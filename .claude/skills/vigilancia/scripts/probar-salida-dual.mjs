#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDualOutput } from "./verificar-salida-dual.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, "..", "examples", "addenda-idle-sintetica.md");
const valid = fs.readFileSync(fixturePath, "utf8");
let assertions = 0;

function expect(name, source, shouldPass) {
  const errors = validateDualOutput(source);
  if ((errors.length === 0) !== shouldPass) {
    throw new Error(`${name}: resultado inesperado\n${errors.join("\n")}`);
  }
  assertions += 1;
  console.log(`${shouldPass ? "PASS" : "RECHAZO"} ${name}${errors[0] ? `: ${errors[0]}` : ""}`);
}

expect("fixture-pass-y-bloqueo", valid, true);
expect("sin-cara-wp", valid.replace("## §WP\n", ""), false);
expect("estructura-simulada-en-caja", `~~~markdown\n${valid}\n~~~`, false);
expect(
  "parte-1-cercada-cierre-corto",
  `\`\`\`\`markdown\npreámbulo\n\`\`\`\n${valid}\n\`\`\`\``,
  false,
);
expect(
  "una-sola-parte",
  valid.slice(0, valid.indexOf("## Parte 2 · Handoff operativo")),
  false,
);
expect(
  "parte-1-cercada",
  valid
    .replace("## Parte 1 · Vista PO/SCRUM\n", "## Parte 1 · Vista PO/SCRUM\n\n```markdown")
    .replace("\n## Parte 2 · Handoff operativo", "\n```\n\n## Parte 2 · Handoff operativo"),
  false,
);
expect(
  "seccion-po-omitida",
  valid.replace("### Decisión del custodio", "### Resolución"),
  false,
);
expect("go-oculto", valid.replaceAll("GO=✅; ", ""), false);
expect(
  "matriz-sin-bifurcacion",
  valid.replace("### Qué sigue", "| opción | estado |\n| --- | --- |\n| A | ✅ |\n\n### Qué sigue"),
  false,
);
expect("parte-2-no-copiable", valid.replaceAll("```markdown", "").replaceAll("\n```", ""), false);
expect(
  "handoff-con-fluff",
  valid.replace("BACKLOG\n", "BACKLOG\n- Excelente sinergia del equipo.\n"),
  false,
);
expect(
  "handoff-fuera-de-vocabulario",
  valid.replace("GATES\n", "MOTIVACION\n- Contexto adicional.\n\nGATES\n"),
  false,
);
expect(
  "seccion-libre-en-wp",
  valid.replace("## Parte 2 · Handoff operativo", "## Notas libres\n\n## Parte 2 · Handoff operativo"),
  false,
);
expect(
  "contenido-libre-en-handoff",
  valid.replace("GATES\n", "GATES\nDecisión operativa fuera de lista.\n"),
  false,
);
expect(
  "orden-invertido",
  valid
    .replace("## Parte 1 · Vista PO/SCRUM", "## TEMP")
    .replace("## Parte 2 · Handoff operativo", "## Parte 1 · Vista PO/SCRUM")
    .replace("## TEMP", "## Parte 2 · Handoff operativo"),
  false,
);
expect(
  "estado-divergente",
  valid.replace(
    "GATES\nESTADO: GO=✅; CHECK_LOCAL=✅; PASS_LOCAL=✅; C8=⛔ BLOQUEADO",
    "GATES\nESTADO: GO=✅; CHECK_LOCAL=✅; PASS_LOCAL=⛔; C8=⛔ BLOQUEADO",
  ),
  false,
);
expect(
  "demasiadas-referencias-wp",
  valid.replace("### Qué cambió", "WP-1 WP-2 WP-3\n\n### Qué cambió"),
  false,
);
expect("token-no-go", valid.replaceAll("GO=✅", "NO_GO=✅"), false);
expect(
  "token-checkmate",
  valid.replaceAll("CHECK_LOCAL=✅", "CHECKMATE=✅"),
  false,
);
expect(
  "token-bypass",
  valid.replaceAll("PASS_LOCAL=✅", "BYPASS=✅"),
  false,
);

console.log(`salida-dual-probes: PASS (${assertions} casos)`);
