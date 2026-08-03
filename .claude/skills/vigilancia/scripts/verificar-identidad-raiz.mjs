#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// CONTRATO_IDENTIDAD_RAIZ_V1: implementación canónica; no duplicar.
const WINDOWS = process.platform === "win32";

function lock(reason) {
  console.error(`LOCK identidad-raiz: ${reason}`);
  console.error(
    "accion: pedir al custodio un clone de trabajo canónico fuera de las raíces observadas; el vigía no lo crea ni lo elige.",
  );
  process.exit(23);
}

function parseList(name) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    lock(`${name} no fue calibrado explícitamente`);
  }
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      lock(`${name} debe ser un array JSON de strings`);
    }
    return value;
  } catch (error) {
    lock(`${name} no es JSON inequívoco: ${error.message}`);
  }
}

function lexical(raw, name) {
  if (!raw || !raw.trim()) lock(`${name} está vacío`);
  return path.resolve(raw);
}

function real(raw, name) {
  const absolute = lexical(raw, name);
  try {
    return fs.realpathSync.native(absolute);
  } catch (error) {
    lock(`${name} no se puede resolver: ${error.code ?? error.message}`);
  }
}

function comparable(raw) {
  let value = path.normalize(raw).replaceAll("\\", "/");
  value = value.replace(/\/+$/, "");
  return WINDOWS ? value.toLowerCase() : value;
}

function segments(raw) {
  return comparable(raw).split("/").filter(Boolean);
}

function same(left, right) {
  return comparable(left) === comparable(right);
}

function inside(candidate, root) {
  const child = segments(candidate);
  const parent = segments(root);
  return (
    child.length >= parent.length &&
    parent.every((segment, index) => child[index] === segment)
  );
}

function gitTop(root, name) {
  try {
    return real(
      execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
      `${name}.git_toplevel`,
    );
  } catch (error) {
    lock(`${name} no acredita git toplevel: ${error.status ?? error.message}`);
  }
}

function patternSegments(pattern) {
  if (!pattern.trim()) lock("DOWNSTREAM_PATTERNS contiene un patrón vacío");
  const normalized = pattern.replaceAll("\\", "/");
  const parts = normalized.split("/").filter(Boolean);
  if (
    parts.length === 0 ||
    parts.some(
      (part) =>
        part === "." ||
        part === ".." ||
        part === "**" ||
        (/[*?[\]]/.test(part) && part !== "*"),
    )
  ) {
    lock(`patrón downstream ambiguo o no segmentario: ${pattern}`);
  }
  return (WINDOWS ? parts.map((part) => part.toLowerCase()) : parts);
}

function matchesDownstream(candidate, pattern) {
  const candidateParts = segments(candidate);
  const wanted = patternSegments(pattern);
  for (let start = 0; start <= candidateParts.length - wanted.length; start += 1) {
    const matched = wanted.every(
      (part, index) => part === "*" || part === candidateParts[start + index],
    );
    if (matched) return true;
  }
  return false;
}

const worldRaw = process.env.WORLD_ROOT;
const canonicalRaw = process.env.CANONICAL_WORLD_ROOT;
const readOnlyRaw = parseList("READ_ONLY_ROOTS");
const downstreamPatterns = parseList("DOWNSTREAM_PATTERNS");

const worldLexical = lexical(worldRaw, "WORLD_ROOT");
const canonicalLexical = lexical(canonicalRaw, "CANONICAL_WORLD_ROOT");
const worldReal = real(worldLexical, "WORLD_ROOT");
const canonicalReal = real(canonicalLexical, "CANONICAL_WORLD_ROOT");
const worldTop = gitTop(worldReal, "WORLD_ROOT");
const canonicalTop = gitTop(canonicalReal, "CANONICAL_WORLD_ROOT");

if (!same(worldTop, worldReal)) {
  lock(`git toplevel de WORLD_ROOT es distinto: ${worldTop}`);
}
if (!same(canonicalTop, canonicalReal)) {
  lock(`git toplevel de CANONICAL_WORLD_ROOT es distinto: ${canonicalTop}`);
}
if (!same(worldReal, canonicalReal) || !same(worldTop, canonicalTop)) {
  lock("WORLD_ROOT no coincide con CANONICAL_WORLD_ROOT tras resolver aliases");
}

for (const configuredRoot of readOnlyRaw) {
  const readOnlyReal = real(configuredRoot, "READ_ONLY_ROOTS[]");
  if (
    inside(worldLexical, lexical(configuredRoot, "READ_ONLY_ROOTS[]")) ||
    inside(worldReal, readOnlyReal)
  ) {
    lock(`WORLD_ROOT pertenece a una raíz read-only: ${readOnlyReal}`);
  }
}

for (const pattern of downstreamPatterns) {
  if (
    matchesDownstream(worldLexical, pattern) ||
    matchesDownstream(worldReal, pattern) ||
    matchesDownstream(worldTop, pattern)
  ) {
    lock(`WORLD_ROOT coincide por segmentos con downstream: ${pattern}`);
  }
}

console.log("identidad-raiz: PASS");
console.log(`world-real: ${comparable(worldReal)}`);
console.log(`git-toplevel: ${comparable(worldTop)}`);
