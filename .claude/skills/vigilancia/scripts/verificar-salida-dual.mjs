#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

// CONTRATO_SALIDA_DUAL_V1: implementación canónica; no duplicar.
const PART1 = "## Parte 1 · Vista PO/SCRUM";
const PART2 = "## Parte 2 · Handoff operativo";
const PUBLIC_FACE = "## §WP";
const PROOF = "## Prueba de ceguera";
const REQUIRED_PO = [
  "### Qué cambió",
  "### Qué sigue",
  "### Decisión del custodio",
];
const REQUIRED_HANDOFF = ["BACKLOG", "GATES", "ALCANCES", "SECUENCIA"];
const FLUFF = /\b(excelente|maravilloso|celebramos|emocionante|gran trabajo|sinergia)\b/i;

function exactLineIndices(lines, expected) {
  return lines.flatMap((line, index) => (line.trimEnd() === expected ? [index] : []));
}

function fencedLineMap(lines) {
  let marker;
  return lines.map((line) => {
    const wasFenced = marker !== undefined;
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/u);
    if (match && marker === undefined) {
      marker = { type: match[1][0], length: match[1].length };
    } else if (
      match &&
      match[1][0] === marker?.type &&
      match[1].length >= marker.length &&
      match[2].trim() === ""
    ) {
      marker = undefined;
    }
    return wasFenced;
  });
}

function validateState(line, audience, errors) {
  const raw = line?.match(/^ESTADO:\s*(.+)$/u)?.[1];
  if (!raw) {
    errors.push(`estado operativo no visible en ${audience}`);
    return undefined;
  }
  const fields = raw.split(";").map((field) => field.trim());
  const parsed = fields.map((field) =>
    field.match(/^([A-Z][A-Z0-9_]*)=(✅|⏳|⛔)(?:\s+\S.*)?$/u),
  );
  if (parsed.some((field) => !field)) {
    errors.push(`estado mal formado en ${audience}`);
    return raw;
  }
  const keys = parsed.map((field) => field[1]);
  if (new Set(keys).size !== keys.length) {
    errors.push(`estado con claves duplicadas en ${audience}`);
  }
  const required = [
    ["GO", (key) => key === "GO"],
    ["CHECK", (key) => /^CHECK(?:_[A-Z0-9]+)*$/.test(key)],
    ["PASS", (key) => /^PASS(?:_[A-Z0-9]+)*$/.test(key)],
  ];
  for (const [name, predicate] of required) {
    if (!keys.some(predicate)) errors.push(`${name} no es token completo en ${audience}`);
  }
  return raw;
}

function validateHandoffStructure(handoff, errors) {
  const lines = handoff.split(/\r?\n/);
  const sectionLines = lines.flatMap((line, index) =>
    REQUIRED_HANDOFF.includes(line.trim()) ? [[line.trim(), index]] : [],
  );
  if (
    sectionLines.length !== REQUIRED_HANDOFF.length ||
    sectionLines.some(([name], index) => name !== REQUIRED_HANDOFF[index])
  ) {
    errors.push("Parte 2 requiere BACKLOG→GATES→ALCANCES→SECUENCIA una vez y en orden");
    return undefined;
  }
  if (lines.slice(0, sectionLines[0][1]).some((line) => line.trim())) {
    errors.push("Parte 2 contiene contenido fuera de sus secciones");
  }

  let stateLine;
  for (let sectionIndex = 0; sectionIndex < sectionLines.length; sectionIndex += 1) {
    const [section, start] = sectionLines[sectionIndex];
    const end = sectionLines[sectionIndex + 1]?.[1] ?? lines.length;
    const content = lines.slice(start + 1, end);
    let substantive = 0;
    let previousWasItem = false;
    for (const line of content) {
      if (!line.trim()) continue;
      if (section === "GATES" && /^ESTADO:\s*/u.test(line)) {
        if (stateLine) errors.push("Parte 2 contiene más de un ESTADO");
        stateLine = line;
        substantive += 1;
        previousWasItem = false;
        continue;
      }
      const item =
        section === "SECUENCIA"
          ? /^\d+\.\s+\S/u.test(line)
          : /^-\s+\S/u.test(line);
      const continuation = previousWasItem && /^\s{2,}\S/u.test(line);
      if (!item && !continuation) {
        errors.push(`contenido libre fuera del vocabulario de ${section}: ${line.trim()}`);
      }
      if (item) {
        substantive += 1;
        previousWasItem = true;
      } else if (!continuation) {
        previousWasItem = false;
      }
    }
    if (substantive === 0) errors.push(`sección operativa vacía: ${section}`);
  }
  return stateLine;
}

export function validateDualOutput(source) {
  const errors = [];
  const lines = source.split(/\r?\n/);
  const publicFaces = exactLineIndices(lines, PUBLIC_FACE);
  const firstParts = exactLineIndices(lines, PART1);
  const secondParts = exactLineIndices(lines, PART2);
  const proofs = exactLineIndices(lines, PROOF);

  if (publicFaces.length !== 1) errors.push("se requiere exactamente una cara §WP");
  if (firstParts.length !== 1) errors.push("se requiere exactamente una Parte 1");
  if (secondParts.length !== 1) errors.push("se requiere exactamente una Parte 2");
  if (proofs.length !== 1) errors.push("se requiere exactamente una Prueba de ceguera");
  if (errors.length) return errors;

  const [publicFace] = publicFaces;
  const [first] = firstParts;
  const [second] = secondParts;
  const [proof] = proofs;
  const fencedLines = fencedLineMap(lines);
  if ([publicFace, first, second, proof].some((index) => fencedLines[index])) {
    errors.push("la estructura dual no puede simularse dentro de una caja");
    return errors;
  }
  if (!(publicFace < first && first < second && second < proof)) {
    errors.push("orden inválido: debe ser §WP→Parte 1→Parte 2→Prueba de ceguera");
    return errors;
  }
  if (lines.slice(publicFace + 1, first).some((line) => line.trim())) {
    errors.push("contenido libre entre §WP y Parte 1");
  }
  const publicH2 = lines
    .slice(publicFace, proof + 1)
    .filter((line) => /^##\s/u.test(line))
    .map((line) => line.trimEnd());
  if (
    publicH2.join("\n") !== [PUBLIC_FACE, PART1, PART2, PROOF].join("\n")
  ) {
    errors.push("§WP contiene secciones de nivel 2 libres");
  }
  if (errors.length) return errors;

  const poLines = lines.slice(first + 1, second);
  const po = poLines.join("\n");
  const handoffEnvelope = lines.slice(second + 1, proof).join("\n").trim();
  if (/```|~~~/u.test(po)) errors.push("Parte 1 no puede estar cercada");
  const poHeadings = poLines
    .filter((line) => /^###\s/u.test(line))
    .map((line) => line.trimEnd());
  if (poHeadings.join("\n") !== REQUIRED_PO.join("\n")) {
    errors.push("Parte 1 requiere exactamente Qué cambió→Qué sigue→Decisión del custodio");
  }

  const poWords = po.match(/\p{L}[\p{L}\p{N}_/-]*/gu) ?? [];
  if (poWords.length > 180) errors.push("Parte 1 excede 180 palabras");
  const wpReferences = po.match(/\bWP-\d+\b/gi) ?? [];
  if (wpReferences.length > 2) errors.push("Parte 1 contiene más de 2 referencias WP");
  const hasTable = po.split(/\r?\n/).filter((line) => /^\s*\|.*\|\s*$/.test(line)).length >= 2;
  if (hasTable && !/BIFURCACIÓN:\s*sí/i.test(po)) {
    errors.push("matriz sin bifurcación real declarada");
  }
  if (FLUFF.test(po)) errors.push("Parte 1 contiene fluff");

  const fenced = handoffEnvelope.match(/^```(?:markdown|text)?\r?\n([\s\S]*?)\r?\n```\s*$/);
  if (!fenced) {
    errors.push("Parte 2 debe ser un único bloque cercado completamente copiable");
    return errors;
  }
  const handoff = fenced[1];
  const handoffStateLine = validateHandoffStructure(handoff, errors);
  if (FLUFF.test(handoff)) errors.push("Parte 2 contiene fluff");

  const poStateLines = poLines.filter((line) => /^ESTADO:\s*/u.test(line));
  if (poStateLines.length !== 1) errors.push("Parte 1 requiere exactamente un ESTADO");
  const poState = validateState(poStateLines[0], "Parte 1", errors);
  const handoffState = validateState(handoffStateLine, "Parte 2", errors);
  if (poState && handoffState && poState !== handoffState) {
    errors.push("estado operativo distinto entre partes");
  }
  return errors;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error(`uso: node ${process.argv[1]} <salida.md>`);
    process.exit(2);
  }
  const errors = validateDualOutput(fs.readFileSync(file, "utf8"));
  if (errors.length) {
    console.error("salida-dual: FAIL");
    for (const [index, error] of errors.entries()) {
      console.error(`${index + 1}. ${error}`);
    }
    process.exit(1);
  }
  console.log("salida-dual: PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
