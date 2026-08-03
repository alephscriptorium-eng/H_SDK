#!/usr/bin/env node
/**
 * RH-04 · matriz ejecutable paquete×gate desde install limpio.
 *
 * Re-ejecutar:
 *   node scripts/rh-04-matriz-contratos.mjs
 *   node scripts/rh-04-matriz-contratos.mjs --json > /tmp/rh04.json
 *   node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
 *
 * Medición: temp dir + npm install del registry (sin siblings / file: / link: /
 * workspace: externos). No muta package.json del repo.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY = process.env.ZEUS_REGISTRY ?? "https://npm.scriptorium.escrivivir.co";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");

/** @typedef {{ id: string, packageName: string | null, pin?: string, owner: string, candidates?: string[], notes?: string }} Surface */

/** Superficies del BRIEF RH-04 (fila cada una). */
const SURFACES = /** @type {Surface[]} */ ([
  { id: "ciudad", packageName: "@zeus/ciudad", pin: "0.1.1", owner: "G/Z (ciudad)" },
  { id: "authority-kit", packageName: "@zeus/authority-kit", pin: "0.4.2", owner: "Z (authority)" },
  { id: "rooms", packageName: "@zeus/rooms", pin: "0.1.2", owner: "Z (rooms)" },
  { id: "player-mcp-kit", packageName: "@zeus/player-mcp-kit", pin: "0.1.4", owner: "Z (player-mcp)" },
  { id: "arg-domain", packageName: "@zeus/arg-domain", owner: "G (delta)", notes: "delta público tipado" },
  { id: "arg-runtime", packageName: "@zeus/arg-runtime", owner: "G (delta)", notes: "si existe publicado" },
  { id: "arg-view-kit", packageName: "@zeus/arg-view-kit", owner: "G (delta)", notes: "si existe" },
  { id: "arg-player-mcp", packageName: "@zeus/arg-player-mcp", owner: "G (delta)" },
  { id: "arg-feeds", packageName: "@zeus/arg-feeds", owner: "G (delta)", notes: "si aplica; DocumentMachine surface" },
  {
    id: "feed-kit",
    packageName: "@zeus/feed-kit",
    pin: "0.3.1",
    owner: "Z (feeds canal)",
    notes: "canal tipado; no sustituye arg-feeds",
  },
  { id: "mockdatas-ciudad", packageName: "@zeus/mockdatas-ciudad", owner: "G (mockdatas)" },
  {
    id: "artefacto-onfalo",
    packageName: null,
    owner: "H/G (artefacto)",
    candidates: ["@zeus/onfalo", "@zeus/onfalo-fixture", "@zeus/fixtures-onfalo", "onfalo", "onfalo-fixture"],
    notes: "artefacto Ónfalo pinneado",
  },
  {
    id: "lore-hm-candidate",
    packageName: null,
    owner: "S/lengua (externo)",
    candidates: ["lore-hm-candidate", "lore-hm", "@logos/lore-hm", "@alephscript/lore-hm-candidate"],
    notes: "candidato LORE-HM",
  },
  {
    id: "provider-e",
    packageName: null,
    owner: "E (externo)",
    candidates: ["@zeus/provider-e", "@zeus/analisis-e", "provider-e"],
    notes: "provider E",
  },
  {
    id: "linea-kit",
    packageName: "@zeus/linea-kit",
    pin: "0.4.0",
    owner: "Z (línea/materialización)",
    notes: "API canónica materializeRecorrido @ @zeus/linea-kit/viaje",
  },
  {
    id: "ceremonia-evidencia-hub",
    packageName: null,
    owner: "HUB (externo)",
    candidates: [
      "@zeus/evidence-kit",
      "@zeus/evidencia-kit",
      "@zeus/hub-evidence",
      "@zeus/ceremony-kit",
      "@zeus/notaria-kit",
    ],
    notes: "ceremonia/evidencia canónica; acta-kit medido aparte como candidato parcial",
  },
  {
    id: "acta-kit-candidato",
    packageName: "@zeus/acta-kit",
    pin: "0.1.2",
    owner: "Z/HUB (candidato parcial)",
    notes: "tipado; no sustituye evidencia canónica HUB",
  },
]);

const wantJson = process.argv.includes("--json");
const wantMd = process.argv.includes("--md");
const keepTemp = process.argv.includes("--keep-temp");
const mutantOnly = process.argv.includes("--mutant");

const IS_WIN = process.platform === "win32";

function run(cmd, args, opts = {}) {
  const { shell: shellOpt, ...rest } = opts;
  // Windows: npm/rg are often .cmd shims — shell helps. Never shell+execPath
  // (space in "Program Files" breaks). Default: shell only for bare command names.
  const useShell =
    shellOpt !== undefined
      ? shellOpt
      : IS_WIN && !/[\\/]/.test(cmd) && !cmd.endsWith(".exe");
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: useShell,
    ...rest,
  });
  return {
    status: r.status ?? (r.error ? 1 : 0),
    stdout: (r.stdout ?? "").trim(),
    stderr: (r.stderr ?? "").trim(),
    error: r.error ? String(r.error.message ?? r.error) : "",
  };
}

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const startArr = text.indexOf("[");
  let i = -1;
  if (start === -1) i = startArr;
  else if (startArr === -1) i = start;
  else i = Math.min(start, startArr);
  if (i === -1) return null;
  const slice = text.slice(i);
  try {
    return JSON.parse(slice);
  } catch {
    // try last JSON object in stream
    const last = text.lastIndexOf("{");
    if (last > i) {
      try {
        return JSON.parse(text.slice(last));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function npmView(pkg, fields = ["name", "version", "types", "typings", "exports", "main", "module"]) {
  const spec = pkg;
  const r = run("npm", ["view", spec, ...fields, "--json", `--registry=${REGISTRY}`], {
    cwd: REPO,
    env: { ...process.env, npm_config_registry: REGISTRY },
  });
  const combined = [r.stdout, r.stderr, r.error].filter(Boolean).join("\n");
  const data = extractJson(r.stdout) ?? extractJson(combined);
  const is404 =
    /E404|not in this registry|404 Not Found/i.test(combined) ||
    (data && data.error && /E404|Not Found/i.test(JSON.stringify(data.error)));
  const okData = data && !data.error ? data : null;
  return {
    status: r.status,
    is404,
    data: okData,
    text: combined.slice(0, 800),
    cmd: `npm view ${spec} ${fields.join(" ")} --registry=${REGISTRY}`,
  };
}

function summarizeExports(exportsField) {
  if (exportsField == null) return { present: false, summary: "—", hasTypesInExports: false };
  if (typeof exportsField === "string") {
    return { present: true, summary: exportsField, hasTypesInExports: false };
  }
  if (typeof exportsField === "object") {
    const keys = Object.keys(exportsField);
    let hasTypes = false;
    const walk = (v) => {
      if (!v || typeof v !== "object") return;
      if ("types" in v || "typings" in v) hasTypes = true;
      for (const x of Object.values(v)) walk(x);
    };
    walk(exportsField);
    return {
      present: true,
      summary: `${keys.length} keys: ${keys.slice(0, 8).join(", ")}${keys.length > 8 ? "…" : ""}`,
      hasTypesInExports: hasTypes,
    };
  }
  return { present: true, summary: String(exportsField), hasTypesInExports: false };
}

/** Collect types/typings path strings declared in package.json exports tree. */
function collectDeclaredTypesPaths(exportsField) {
  const out = [];
  const walk = (v) => {
    if (!v || typeof v !== "object") return;
    for (const [k, val] of Object.entries(v)) {
      if ((k === "types" || k === "typings") && typeof val === "string") out.push(val);
      else walk(val);
    }
  };
  walk(exportsField);
  return out;
}

function normalizeRel(p) {
  if (!p) return p;
  return p.startsWith("./") ? p : `./${p}`;
}

function inspectInstalled(installRoot, packageName) {
  const pkgDir = join(installRoot, "node_modules", ...packageName.split("/"));
  const manifestPath = join(pkgDir, "package.json");
  if (!existsSync(manifestPath)) {
    return {
      installed: false,
      version: null,
      typesField: null,
      typingsField: null,
      exportsSummary: "—",
      hasTypesInExports: false,
      dtsFiles: [],
      declaredTypesMissing: [],
      runtimeImport: { ok: false, detail: "package dir absent" },
      pollution: [],
      evidence: `ls ${pkgDir} → ABSENT`,
    };
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const exp = summarizeExports(manifest.exports);
  const dtsFiles = [];
  const declaredTypesMissing = [];
  const typesField = manifest.types ?? null;
  const typingsField = manifest.typings ?? null;
  const declared = [
    ...collectDeclaredTypesPaths(manifest.exports),
    ...(typesField ? [typesField] : []),
    ...(typingsField ? [typingsField] : []),
  ].map(normalizeRel);

  for (const rel of declared) {
    const abs = join(pkgDir, rel);
    if (existsSync(abs)) {
      if (!dtsFiles.includes(rel)) dtsFiles.push(rel);
    } else if (!declaredTypesMissing.includes(rel)) {
      declaredTypesMissing.push(rel);
    }
  }

  // pollution inside installed package.json
  const blob = JSON.stringify(manifest);
  const pollution = [];
  if (/S_LAB|S:\\\\LAB|C:\\\\S_LAB/i.test(blob)) pollution.push("S_LAB path in package.json");
  for (const [section, deps] of Object.entries({
    dependencies: manifest.dependencies,
    optionalDependencies: manifest.optionalDependencies,
    peerDependencies: manifest.peerDependencies,
  })) {
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (/^(file:|link:|workspace:)/i.test(String(spec))) {
        pollution.push(`${section}.${name}=${spec}`);
      }
    }
  }

  // runtime import from install root
  const probe = join(installRoot, `probe-${packageName.replace(/[/@]/g, "_")}.mjs`);
  writeFileSync(
    probe,
    `import * as m from ${JSON.stringify(packageName)};\nconsole.log("IMPORT_OK", Object.keys(m).slice(0, 12).join(","));\n`,
  );
  const ir = run(process.execPath, [probe], { cwd: installRoot, shell: false });
  const runtimeImport = {
    ok: ir.status === 0 && /IMPORT_OK/.test(ir.stdout),
    detail: ir.status === 0 ? ir.stdout.slice(0, 200) : (ir.stderr || ir.stdout || ir.error).slice(0, 300),
    cmd: `${process.execPath} ${probe}`,
  };

  return {
    installed: true,
    version: manifest.version ?? null,
    typesField,
    typingsField,
    exportsSummary: exp.summary,
    hasTypesInExports: exp.hasTypesInExports,
    exportsPresent: exp.present || Boolean(manifest.main || manifest.module),
    dtsFiles,
    declaredTypesMissing,
    runtimeImport,
    pollution,
    evidence: `cat node_modules/${packageName}/package.json → version=${manifest.version}; types=${typesField ?? "—"}; typings=${typingsField ?? "—"}; dts_on_disk=${dtsFiles.join(",") || "none"}; declared_missing=${declaredTypesMissing.join(",") || "none"}`,
  };
}

/**
 * VERDE exige .d.ts en disco (paths declarados top-level o en exports).
 * hasTypesInExports=true sin archivo en disco → ROJO (hostil-omite / anti falso-verde).
 */
function verdictFor(row) {
  if (row.registry === "E404" || row.version_exacta === "—") {
    return "ROJO / pending_external_contract";
  }
  const typesDeclared =
    Boolean(row.typesField) || Boolean(row.typingsField) || row.hasTypesInExports === true;
  const dtsOnDisk = Array.isArray(row.dts_found) && row.dts_found.length > 0;
  const exportOk = row.export_map && row.export_map !== "—" && row.export_map !== "absent";
  const runtimeOk = row.runtime_import === "OK";
  const clean = !row.pollution || row.pollution.length === 0;

  // Hard gate: no VERDE without .d.ts on disk — even if exports claim types.
  if (typesDeclared && dtsOnDisk && exportOk && runtimeOk && clean) {
    return "VERDE";
  }
  if (!typesDeclared) {
    return "ROJO / publicado-sin-types";
  }
  if (!dtsOnDisk) {
    return "ROJO / sin d.ts";
  }
  if (!runtimeOk) return "ROJO / runtime_import_fail";
  if (!clean) return "ROJO / pollution";
  if (!exportOk) return "ROJO / sin export_map";
  return "ROJO";
}

/** Mutante DEVOLUCION #1: types-en-exports sin .d.ts en disco → debe ser ROJO. */
function probeMutantDtsAbsent() {
  const mutant = {
    superficie: "mutant-types-exports-no-disk",
    registry: "OK",
    version_exacta: "0.0.0-mutant",
    export_map: "1 keys: .",
    typesField: null,
    typingsField: null,
    hasTypesInExports: true,
    dts_found: [],
    runtime_import: "OK",
    pollution: [],
  };
  const v = verdictFor(mutant);
  const pass = v === "ROJO / sin d.ts" || (typeof v === "string" && v.startsWith("ROJO"));
  return {
    id: "mutant-types-exports-no-disk",
    description:
      "hasTypesInExports=true, dts_found=[], runtime OK, export_map present → must NOT be VERDE",
    input: mutant,
    veredicto: v,
    expected: "ROJO / sin d.ts (any ROJO*)",
    pass,
  };
}

function measureSurface(surface, installRoot, installable) {
  const rowBase = {
    superficie: surface.id,
    paquete: surface.packageName ?? `(candidatos: ${(surface.candidates ?? []).join(", ")})`,
    owner: surface.owner,
    notes: surface.notes ?? "",
  };

  if (!surface.packageName) {
    const probes = [];
    for (const c of surface.candidates ?? []) {
      const v = npmView(c, ["version"]);
      probes.push({
        candidate: c,
        result: v.is404 ? "E404" : v.status === 0 ? (v.data?.version ?? v.stdout) : `err:${v.status}`,
        cmd: v.cmd,
      });
    }
    const anyOk = probes.some((p) => p.result !== "E404" && !String(p.result).startsWith("err:"));
    return {
      ...rowBase,
      version_exacta: "—",
      export_map: "—",
      d_ts: "—",
      typesField: null,
      typingsField: null,
      hasTypesInExports: false,
      dts_found: [],
      runtime_import: "N/A (no package)",
      registry: anyOk ? "PARTIAL" : "E404",
      pollution: [],
      veredicto: "ROJO / pending_external_contract",
      evidencia: probes.map((p) => `${p.cmd} → ${p.result}`).join(" | "),
      candidate_probes: probes,
    };
  }

  const spec = surface.pin ? `${surface.packageName}@${surface.pin}` : surface.packageName;
  const view = npmView(spec);
  if (view.is404 || !view.data) {
    return {
      ...rowBase,
      version_exacta: "—",
      export_map: "—",
      d_ts: "—",
      typesField: null,
      typingsField: null,
      hasTypesInExports: false,
      dts_found: [],
      runtime_import: "N/A",
      registry: view.is404 ? "E404" : "ERR",
      pollution: [],
      veredicto: "ROJO / pending_external_contract",
      evidencia: `${view.cmd} → ${view.is404 ? "E404" : "ERR"} (exit ${view.status}): ${view.text.slice(0, 200)}`,
    };
  }

  const meta = view.data;
  const versionFromView = meta.version ?? null;
  if (!versionFromView) {
    return {
      ...rowBase,
      version_exacta: "—",
      export_map: "—",
      d_ts: "—",
      typesField: null,
      typingsField: null,
      hasTypesInExports: false,
      dts_found: [],
      runtime_import: "N/A",
      registry: "ERR",
      pollution: [],
      veredicto: "ROJO / pending_external_contract",
      evidencia: `${view.cmd} → sin version en respuesta`,
    };
  }
  const expView = summarizeExports(meta.exports);
  installable.push(`${surface.packageName}@${surface.pin ?? versionFromView}`);

  // deferred install inspection filled later
  return {
    ...rowBase,
    _needsInstall: true,
    packageName: surface.packageName,
    pin: surface.pin ?? versionFromView,
    version_exacta: versionFromView,
    export_map: expView.present ? expView.summary : meta.main ? `main=${meta.main}` : "absent",
    d_ts: "⏳ install",
    typesField: meta.types ?? null,
    typingsField: meta.typings ?? null,
    hasTypesInExports: expView.hasTypesInExports,
    dts_found: [],
    runtime_import: "⏳ install",
    registry: "OK",
    pollution: [],
    veredicto: "⏳",
    evidencia: `${view.cmd} → version=${versionFromView}; types=${meta.types ?? "—"}`,
    view_types: meta.types ?? null,
  };
}

function grepRepoPollution() {
  const targets = [
    "package.json",
    "bunfig.toml",
    ".npmrc",
    "tsconfig.base.json",
    "tsconfig.json",
    "packages/core/package.json",
    "packages/core/tsconfig.json",
    "packages/edge-zeus/package.json",
    "packages/edge-zeus/tsconfig.json",
  ];
  const hits = [];
  const re = /S_LAB|file:|link:|workspace:/i;
  for (const rel of targets) {
    const p = join(REPO, rel);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (re.test(line) && /S_LAB|file:|link:|workspace:/i.test(line)) {
        // allow workspace protocol only if internal? brief forbids externos; local workspaces key is different
        if (rel === "package.json" && /"workspaces"/.test(line)) return;
        if (/workspace:/.test(line) || /file:/.test(line) || /link:/.test(line) || /S_LAB/.test(line)) {
          hits.push(`${rel}:${i + 1}:${line.trim()}`);
        }
      }
    });
  }
  // dedicated S_LAB grep
  const r = run(
    "rg",
    ["-n", "S_LAB|file:|link:", "--glob", "package.json", "--glob", "tsconfig*.json", "--glob", "bunfig.toml", "--glob", ".npmrc", "."],
    { cwd: REPO },
  );
  const rgHits = (r.stdout || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.includes("node_modules") && !l.includes(".claude/skills"));
  return { hits, rgHits, cmd: `rg -n 'S_LAB|file:|link:' --glob package.json --glob 'tsconfig*.json' (repo)` };
}

async function main() {
  const installable = [];
  const rows = SURFACES.map((s) => measureSurface(s, null, installable));

  const temp = mkdtempSync(join(tmpdir(), "rh04-matriz-"));
  const pkgJson = {
    name: "rh04-clean-probe",
    private: true,
    type: "module",
    dependencies: Object.fromEntries(
      installable.map((spec) => {
        const at = spec.lastIndexOf("@");
        // @scope/name@version
        if (spec.startsWith("@")) {
          const second = spec.indexOf("@", 1);
          return [spec.slice(0, second), spec.slice(second + 1)];
        }
        const i = spec.lastIndexOf("@");
        return [spec.slice(0, i), spec.slice(i + 1)];
      }),
    ),
  };
  writeFileSync(join(temp, "package.json"), JSON.stringify(pkgJson, null, 2));
  writeFileSync(
    join(temp, ".npmrc"),
    `@zeus:registry=${REGISTRY}\n@alephscript:registry=${REGISTRY}\nregistry=https://registry.npmjs.org/\n`,
  );

  // Prefer installing each @zeus from private registry: npm respects .npmrc scopes
  const inst = run("npm", ["install", "--ignore-scripts", "--no-package-lock"], {
    cwd: temp,
    env: { ...process.env },
    timeout: 180000,
  });

  const installEvidence = {
    temp,
    status: inst.status,
    cmd: `cd ${temp} && npm install --ignore-scripts --no-package-lock  (deps: ${Object.keys(pkgJson.dependencies).join(", ")})`,
    stderr: (inst.stderr || "").slice(0, 600),
    stdout: (inst.stdout || "").slice(0, 400),
  };

  for (const row of rows) {
    if (!row._needsInstall || !row.packageName) continue;
    const info = inspectInstalled(temp, row.packageName);
    row.version_exacta = info.version ?? row.version_exacta;
    row.export_map = info.exportsPresent ? info.exportsSummary : row.export_map;
    row.typesField = info.typesField;
    row.typingsField = info.typingsField;
    row.hasTypesInExports = info.hasTypesInExports;
    row.dts_found = info.dtsFiles;
    row.declaredTypesMissing = info.declaredTypesMissing;
    row.d_ts =
      info.typesField || info.typingsField || info.hasTypesInExports
        ? `declared:${info.typesField ?? info.typingsField ?? "exports"}; disk:${info.dtsFiles.join(",") || "none"}; missing:${info.declaredTypesMissing.join(",") || "none"}`
        : "none";
    row.runtime_import = info.runtimeImport.ok ? "OK" : `FAIL: ${info.runtimeImport.detail}`;
    row.pollution = info.pollution;
    row.evidencia = [
      row.evidencia,
      installEvidence.cmd + ` → exit ${installEvidence.status}`,
      info.evidence,
      `runtime: ${info.runtimeImport.cmd} → ${info.runtimeImport.ok ? "OK" : info.runtimeImport.detail}`,
      info.pollution.length ? `pollution: ${info.pollution.join("; ")}` : "pollution: 0",
    ].join(" || ");
    row.veredicto = verdictFor(row);
    delete row._needsInstall;
  }

  const pollution = grepRepoPollution();
  const mutant = probeMutantDtsAbsent();

  const summary = {
    verdes: rows.filter((r) => r.veredicto === "VERDE").map((r) => r.superficie),
    rojos: rows.filter((r) => r.veredicto !== "VERDE").map((r) => `${r.superficie}:${r.veredicto}`),
    install: installEvidence,
    repo_pollution_S_LAB_file_link: pollution.rgHits.filter((l) => /S_LAB|file:|link:/i.test(l)),
    mutant_probe: mutant,
    linea_kit_types: (() => {
      const r = rows.find((x) => x.superficie === "linea-kit");
      return r
        ? {
            version: r.version_exacta,
            typesField: r.typesField,
            typingsField: r.typingsField,
            hasTypesInExports: r.hasTypesInExports,
            d_ts: r.d_ts,
            veredicto: r.veredicto,
          }
        : null;
    })(),
  };

  if (!keepTemp) {
    try {
      rmSync(temp, { recursive: true, force: true });
    } catch {
      /* keep on failure */
    }
  } else {
    summary.install.kept = temp;
  }

  if (wantJson) {
    process.stdout.write(JSON.stringify({ rows, summary, registry: REGISTRY, generatedAt: new Date().toISOString() }, null, 2));
    return;
  }

  const md = renderMd(rows, summary, pollution);
  if (wantMd) {
    process.stdout.write(md);
    return;
  }

  // default: human summary + write md path hint
  console.log(`registry: ${REGISTRY}`);
  console.log(`install exit: ${installEvidence.status} @ ${temp}${keepTemp ? " (kept)" : " (removed)"}`);
  console.log(`VERDES (${summary.verdes.length}): ${summary.verdes.join(", ") || "—"}`);
  console.log(`ROJOS (${summary.rojos.length}):`);
  for (const r of summary.rojos) console.log(`  - ${r}`);
  console.log(`linea-kit types: ${JSON.stringify(summary.linea_kit_types)}`);
  console.log(`mutant: ${mutant.veredicto} pass=${mutant.pass}`);
  console.log(`repo S_LAB|file:|link: hits: ${summary.repo_pollution_S_LAB_file_link.length}`);
  console.log("\n--- markdown ---\n");
  console.log(md);
  if (!mutant.pass) process.exitCode = 2;
}

function renderMd(rows, summary, pollution) {
  const lines = [];
  lines.push("# RH-04 · MATRIZ CONTRATOS (install limpio)");
  lines.push("");
  lines.push(`Generado: ${new Date().toISOString()}`);
  lines.push(`Registry: \`${REGISTRY}\``);
  lines.push("");
  lines.push("## Método");
  lines.push("");
  lines.push("1. `npm view <pkg> version types typings exports --json` contra registry scriptorium.");
  lines.push("2. Temp dir + `package.json` con deps pinneadas + `.npmrc` de scopes `@zeus`/`@alephscript`.");
  lines.push("3. `npm install --ignore-scripts --no-package-lock` (sin siblings, sin `file:`/`link:`/`workspace:`).");
  lines.push("4. Lectura del `package.json` **instalado** (types/typings/exports) + presencia de `.d.ts` en disco.");
  lines.push("5. `node` import dinámico del paquete desde el temp dir.");
  lines.push("6. Grep de contaminación `S_LAB|file:|link:` en package.json/tsconfig del repo H.");
  lines.push("");
  lines.push("Re-ejecutar:");
  lines.push("```bash");
  lines.push("node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md");
  lines.push("node scripts/rh-04-matriz-contratos.mjs --json");
  lines.push("```");
  lines.push("");
  lines.push("## Resumen");
  lines.push("");
  lines.push(`| estado | n | superficies |`);
  lines.push(`| --- | --- | --- |`);
  lines.push(`| VERDE | ${summary.verdes.length} | ${summary.verdes.join(", ") || "—"} |`);
  lines.push(`| ROJO | ${summary.rojos.length} | ver tabla |`);
  lines.push("");
  lines.push("### linea-kit (re-verificación obligatoria)");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(summary.linea_kit_types, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Contaminación repo (S_LAB / file: / link:)");
  lines.push("");
  if (summary.repo_pollution_S_LAB_file_link.length === 0) {
    lines.push("0 hits en package.json / tsconfig*.json / bunfig.toml / .npmrc (excl. skills).");
  } else {
    for (const h of summary.repo_pollution_S_LAB_file_link) lines.push(`- \`${h}\``);
  }
  lines.push("");
  lines.push(`Install limpio: exit ${summary.install.status}`);
  lines.push("");
  lines.push("### Mutante DEVOLUCION #1 (types-en-exports sin `.d.ts` en disco)");
  lines.push("");
  if (summary.mutant_probe) {
    const m = summary.mutant_probe;
    lines.push(`- id: \`${m.id}\``);
    lines.push(`- input: \`hasTypesInExports=true\`, \`dts_found=[]\`, runtime OK`);
    lines.push(`- veredicto: **${m.veredicto}** · pass=${m.pass}`);
    lines.push(`- re-probe: \`node scripts/rh-04-matriz-contratos.mjs --mutant\``);
  }
  lines.push("");
  lines.push("## Matriz");
  lines.push("");
  lines.push("| paquete | version_exacta | export_map | d.ts | runtime_import | owner | veredicto | evidencia | notas |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const r of rows) {
    const evid = String(r.evidencia || "").replace(/\|/g, "\\|").slice(0, 280);
    const notes = [r.notes, r.pollution?.length ? `pollution:${r.pollution.join(";")}` : ""]
      .filter(Boolean)
      .join("; ")
      .replace(/\|/g, "\\|");
    lines.push(
      `| ${r.paquete} | ${r.version_exacta} | ${String(r.export_map).replace(/\|/g, "\\|")} | ${String(r.d_ts).replace(/\|/g, "\\|")} | ${String(r.runtime_import).replace(/\|/g, "\\|")} | ${r.owner} | ${r.veredicto} | ${evid} | ${notes} |`,
    );
  }
  lines.push("");
  lines.push("## Hipótesis del BRIEF vs observado");
  lines.push("");
  lines.push("| expectativa BRIEF | observado |");
  lines.push("| --- | --- |");
  const expectGreen = ["ciudad", "rooms", "player-mcp-kit"];
  for (const id of expectGreen) {
    const r = rows.find((x) => x.superficie === id);
    lines.push(`| verde: ${id} | ${r?.veredicto ?? "—"} |`);
  }
  const expectRed = ["arg-domain", "arg-runtime", "arg-view-kit", "arg-player-mcp", "artefacto-onfalo", "lore-hm-candidate", "provider-e", "ceremonia-evidencia-hub"];
  for (const id of expectRed) {
    const r = rows.find((x) => x.superficie === id);
    lines.push(`| rojo hasta publicación: ${id} | ${r?.veredicto ?? "—"} |`);
  }
  lines.push("");
  lines.push("## Criterio VERDE");
  lines.push("");
  lines.push("VERDE solo si: paquete en registry + versión exacta en install limpio + export_map + types declarados (`types`/`typings` o types-en-exports) + **al menos un path de types declarado presente en disco** + runtime import OK + pollution 0. `hasTypesInExports=true` sin `.d.ts` en disco → **ROJO / sin d.ts** (no VERDE).");
  lines.push("");
  return lines.join("\n");
}

async function entry() {
  if (mutantOnly) {
    const m = probeMutantDtsAbsent();
    process.stdout.write(JSON.stringify(m, null, 2) + "\n");
    process.exit(m.pass ? 0 : 2);
  }
  await main();
}

entry().catch((e) => {
  console.error(e);
  process.exit(1);
});
