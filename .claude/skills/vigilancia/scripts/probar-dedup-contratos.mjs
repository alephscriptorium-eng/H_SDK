#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, "..");
const gate = path.join(here, "verificar-dedup-contratos.mjs");
const detector = path.join(here, "verificar-identidad-raiz.mjs");
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "vig-dedup-"));

function run(root) {
  return spawnSync(process.execPath, [gate, "--root", root], {
    encoding: "utf8",
  });
}

try {
  const current = run(skillRoot);
  if (current.status !== 0 || !current.stdout.includes("dedup-contratos: PASS")) {
    throw new Error(`árbol actual no pasó dedup\n${current.stdout}${current.stderr}`);
  }
  console.log("PASS arbol-actual: implementaciones efectivas únicas");

  const copiedSkill = path.join(sandbox, "vigilancia");
  fs.cpSync(skillRoot, copiedSkill, { recursive: true });
  const duplicate = fs
    .readFileSync(detector, "utf8")
    .replace(/^\/\/ CONTRATO_IDENTIDAD_RAIZ_V1:.*\r?\n/mu, "");
  fs.writeFileSync(
    path.join(copiedSkill, "scripts", "copia-detector-sin-marcador.mjs"),
    duplicate,
  );

  const negative = run(copiedSkill);
  const output = `${negative.stdout}${negative.stderr}`;
  if (
    negative.status === 0 ||
    !output.includes("dedup identidad-raiz: FAIL") ||
    !output.includes("simbolo=lock definiciones=2") ||
    !output.includes("copia-detector-sin-marcador.mjs")
  ) {
    throw new Error(`duplicado real sin marcador no fue rechazado\n${output}`);
  }
  console.log(
    "RECHAZO detector-duplicado-sin-marcador: lock=2; implementación copiada detectada",
  );
  console.log("dedup-probes: PASS (2 casos)");
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
