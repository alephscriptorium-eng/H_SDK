#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const detector = path.join(here, "verificar-identidad-raiz.mjs");
const watcher = path.join(here, "watcher.sh");
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "vig-identidad-"));
let assertions = 0;

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function repo(relative) {
  const root = path.join(sandbox, relative);
  fs.mkdirSync(root, { recursive: true });
  git(["init", "--quiet"], root);
  fs.writeFileSync(path.join(root, "fixture.txt"), "fixture\n");
  return root;
}

function snapshot(root) {
  const entries = [];
  function walk(current) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, item.name);
      const relative = path.relative(root, absolute).replaceAll("\\", "/");
      if (item.isSymbolicLink()) {
        entries.push(`l:${relative}->${fs.readlinkSync(absolute)}`);
      } else if (item.isDirectory()) {
        entries.push(`d:${relative}`);
        walk(absolute);
      } else {
        entries.push(`f:${relative}:${fs.statSync(absolute).size}`);
      }
    }
  }
  walk(root);
  return entries.sort().join("\n");
}

function envFor(world, canonical, patterns = [], readOnly = []) {
  return {
    ...process.env,
    WORLD_ROOT: world,
    CANONICAL_WORLD_ROOT: canonical,
    READ_ONLY_ROOTS: JSON.stringify(readOnly),
    DOWNSTREAM_PATTERNS: JSON.stringify(patterns),
  };
}

function expectPass(name, env) {
  const result = spawnSync(process.execPath, [detector], {
    env,
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout.includes("identidad-raiz: PASS")) {
    throw new Error(`${name}: se esperaba PASS\n${result.stdout}${result.stderr}`);
  }
  assertions += 1;
  console.log(`PASS ${name}: identidad-raiz: PASS`);
}

function expectLockWithoutEffects(name, env, observedRepo) {
  const output = path.join(sandbox, `out-${name}`);
  const marker = path.join(output, "watch.log");
  const beforeTree = snapshot(sandbox);
  const beforeGit = git(["status", "--porcelain=v1", "--untracked-files=all"], observedRepo);
  const result = spawnSync("bash", [watcher], {
    env: { ...env, OUT_DIR: output, INTERVAL: "0" },
    encoding: "utf8",
  });
  const afterGit = git(["status", "--porcelain=v1", "--untracked-files=all"], observedRepo);
  const afterTree = snapshot(sandbox);
  const combined = `${result.stdout}${result.stderr}`;

  if (
    result.status !== 23 ||
    !combined.includes("LOCK identidad-raiz:") ||
    fs.existsSync(output) ||
    fs.existsSync(marker) ||
    beforeGit !== afterGit ||
    beforeTree !== afterTree
  ) {
    throw new Error(
      `${name}: LOCK no fue fail-closed sin efectos\nstatus=${result.status}\n${combined}`,
    );
  }
  assertions += 1;
  console.log(`PASS ${name}: LOCK exit=23; fs=sin-cambios; git=sin-cambios; OUT_DIR=ausente`);
}

try {
  const canonical = repo("canonico");
  const similar = repo(path.join("zona", "codebase-copia", "repo"));
  const downstream = repo(path.join("zona", "codebase", "consumidor"));
  const foreign = repo("ajeno");
  const readOnly = repo("solo-lectura");
  const nested = path.join(canonical, "subdirectorio");
  fs.mkdirSync(nested);

  const alias = path.join(sandbox, "alias-downstream");
  fs.symlinkSync(
    downstream,
    alias,
    process.platform === "win32" ? "junction" : "dir",
  );

  expectPass("canonico-valido", envFor(canonical, canonical));
  expectPass(
    "prefijo-lexico-no-es-segmento",
    envFor(similar, similar, ["zona/codebase/*"]),
  );
  expectLockWithoutEffects(
    "descendiente-downstream",
    envFor(downstream, downstream, ["zona/codebase/*"]),
    downstream,
  );
  expectLockWithoutEffects(
    "alias-fs-a-downstream",
    envFor(alias, alias, ["zona/codebase/*"]),
    downstream,
  );
  expectLockWithoutEffects(
    "git-toplevel-distinto",
    envFor(nested, canonical),
    canonical,
  );
  expectLockWithoutEffects(
    "raiz-inexistente",
    envFor(path.join(sandbox, "no-existe"), canonical),
    canonical,
  );
  expectLockWithoutEffects(
    "calibracion-ambigua",
    {
      ...process.env,
      WORLD_ROOT: canonical,
      CANONICAL_WORLD_ROOT: canonical,
      READ_ONLY_ROOTS: "",
      DOWNSTREAM_PATTERNS: "[]",
    },
    canonical,
  );
  expectLockWithoutEffects(
    "raiz-read-only",
    envFor(readOnly, readOnly, [], [readOnly]),
    readOnly,
  );
  expectLockWithoutEffects(
    "clone-distinto-del-canonico",
    envFor(foreign, canonical),
    foreign,
  );

  console.log(`identidad-probes: PASS (${assertions} casos)`);
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
