#!/usr/bin/env node
// Gate local de dependencias runtime. Determinista, sin red y sin paquetes
// externos: usa únicamente built-ins de Node >=22.

import { isBuiltin } from 'node:module';
import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const POLICIES = new Set(['exact', 'caret-semver', 'major-band']);
const CORE = '(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)';
const EXACT_RE = new RegExp(
  `^${CORE}(?:-([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`,
);
const CARET_RE = new RegExp(`^\\^${CORE}$`);
const BAND_RE = new RegExp(`^>=${CORE} <${CORE}$`);
const SOURCE_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
  '.jsx',
  '.tsx',
]);

function failInput(message) {
  console.error(`[dependencias-semver] CONFIG: ${message}`);
  process.exitCode = 2;
}

function classifySpecifier(specifier) {
  if (specifier.startsWith('node:')) {
    return isBuiltin(specifier) ? { kind: 'builtin' } : { kind: 'invalid' };
  }
  if (isBuiltin(specifier)) return { kind: 'invalid' };
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#')
  ) {
    return { kind: 'local' };
  }
  if (/^(?:https?:|git(?:\+|:)|file:|link:|workspace:|npm:)/.test(specifier)) {
    return { kind: 'invalid' };
  }
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2
      ? { kind: 'external', name: `${parts[0]}/${parts[1]}` }
      : { kind: 'invalid' };
  }
  const name = specifier.split('/')[0];
  return name ? { kind: 'external', name } : { kind: 'invalid' };
}

function parseRange(range, policy) {
  let match;
  if (policy === 'exact') {
    match = range.match(EXACT_RE);
    const prerelease = match?.[4];
    if (
      prerelease &&
      prerelease
        .split('.')
        .some((identifier) => /^\d+$/.test(identifier) && !/^(0|[1-9]\d*)$/.test(identifier))
    ) {
      return { valid: false };
    }
  }
  if (policy === 'caret-semver') match = range.match(CARET_RE);
  if (policy === 'major-band') {
    match = range.match(BAND_RE);
    if (match) {
      const minimumMajor = BigInt(match[1]);
      const maximumMajor = BigInt(match[4]);
      if (
        maximumMajor !== minimumMajor + 1n ||
        match[5] !== '0' ||
        match[6] !== '0'
      ) {
        return { valid: false };
      }
    }
  }
  if (!match) return { valid: false };
  return {
    valid: true,
    major: match[1],
    minimum: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

function stringArray(config, field) {
  const value = config[field] ?? [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`"${field}" debe ser un array de strings`);
  }
  return value;
}

async function loadJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} no se pudo leer como JSON (${path}): ${error.message}`);
  }
}

function insidePackage(packageDir, candidate) {
  const rel = relative(packageDir, candidate);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

async function sourceFiles(packageDir, roots) {
  if (roots.length === 0) {
    throw new Error('"runtimeRoots" debe declarar al menos una raíz');
  }
  const files = [];
  const visit = async (path) => {
    if (!insidePackage(packageDir, path)) {
      throw new Error(`runtimeRoot fuera del paquete: ${path}`);
    }
    let info;
    try {
      info = await stat(path);
    } catch {
      throw new Error(`runtimeRoot inexistente: ${path}`);
    }
    if (info.isDirectory()) {
      const entries = await readdir(path, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        await visit(resolve(path, entry.name));
      }
      return;
    }
    if (info.isFile() && SOURCE_EXTENSIONS.has(extname(path))) files.push(path);
  };
  for (const root of roots) await visit(resolve(packageDir, root));
  if (files.length === 0) {
    throw new Error('"runtimeRoots" no contiene fuentes JS/TS auditables');
  }
  return [...new Set(files)].sort();
}

function importsFromSource(source) {
  const specifiers = [];
  const staticRe =
    /\b(?:import|export)\s+(?:[^'"\n;]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const callRe = /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const regex of [staticRe, callRe]) {
    for (const match of source.matchAll(regex)) specifiers.push(match[1]);
  }
  const calls = [...source.matchAll(/\b(?:import|require)\s*\(/g)].length;
  const literalCalls = [...source.matchAll(callRe)].length;
  return { specifiers, unsupportedCalls: calls - literalCalls };
}

async function collectEvidence(packagePath, config) {
  const packageDir = dirname(packagePath);
  const roots = stringArray(config, 'runtimeRoots');
  const files = await sourceFiles(packageDir, roots);
  const sources = await Promise.all(
    files.map(async (path) => ({ path, source: await readFile(path, 'utf8') })),
  );
  const discovered = [];
  const evidenceErrors = [];
  for (const { path, source } of sources) {
    const imports = importsFromSource(source);
    discovered.push(...imports.specifiers);
    if (imports.unsupportedCalls > 0) {
      evidenceErrors.push(
        `${relative(packageDir, path)}: ${imports.unsupportedCalls} import/require no literal(es) no auditables`,
      );
    }
  }

  const dedupPatterns = config.dedupPatterns;
  if (!Array.isArray(dedupPatterns) || dedupPatterns.length === 0) {
    throw new Error('"dedupPatterns" debe declarar al menos un patrón');
  }
  for (const item of dedupPatterns) {
    if (
      !item ||
      typeof item.name !== 'string' ||
      typeof item.pattern !== 'string' ||
      (item.maxDefinitions ?? 1) !== 1
    ) {
      throw new Error('cada dedupPattern requiere name, pattern y maxDefinitions=1');
    }
    let regex;
    try {
      regex = new RegExp(item.pattern, 'gu');
    } catch (error) {
      throw new Error(`dedupPattern inválido (${item.name}): ${error.message}`);
    }
    const count = sources.reduce(
      (total, { source }) => total + [...source.matchAll(regex)].length,
      0,
    );
    if (count > 1) {
      evidenceErrors.push(
        `dedup ${item.name}: ${count} definiciones (máximo 1)`,
      );
    }
  }

  const integrationTests = config.integrationTests ?? {};
  if (
    typeof integrationTests !== 'object' ||
    Array.isArray(integrationTests) ||
    Object.values(integrationTests).some((path) => typeof path !== 'string')
  ) {
    throw new Error('"integrationTests" debe mapear paquete a script');
  }
  const integrationResults = new Map();
  for (const [name, script] of Object.entries(integrationTests)) {
    const scriptPath = resolve(packageDir, script);
    if (!insidePackage(packageDir, scriptPath)) {
      throw new Error(`${name}: test de integración fuera del paquete`);
    }
    const run = spawnSync(process.execPath, [scriptPath], {
      cwd: packageDir,
      encoding: 'utf8',
      env: { ...process.env, GATE_SEMVER_SIN_RED: '1' },
      timeout: 10_000,
    });
    integrationResults.set(name, {
      passed: run.status === 0,
      detail: run.status === null ? run.error?.message ?? 'sin exit' : `exit=${run.status}`,
    });
  }

  return {
    discovered,
    evidenceErrors,
    fileCount: files.length,
    integrationResults,
  };
}

export function verify(packageJson, config, evidence) {
  if (!packageJson || typeof packageJson !== 'object') {
    throw new Error('package.json debe ser un objeto');
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('la configuración debe ser un objeto');
  }

  const defaultPolicy = config.defaultPolicy ?? 'exact';
  if (!POLICIES.has(defaultPolicy)) {
    throw new Error(`defaultPolicy desconocida: ${defaultPolicy}`);
  }
  const overrides = config.policies ?? {};
  if (
    typeof overrides !== 'object' ||
    Array.isArray(overrides) ||
    Object.values(overrides).some((policy) => !POLICIES.has(policy))
  ) {
    throw new Error('"policies" contiene una política desconocida');
  }

  const runtimeImports = stringArray(config, 'runtimeImports');
  const allow = new Set(stringArray(config, 'allow'));
  const deny = new Set(stringArray(config, 'deny'));
  const direct = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.optionalDependencies ?? {}),
  };
  const errors = [...evidence.evidenceErrors];
  const warnings = [];
  const discoveredNames = new Set();

  for (const specifier of evidence.discovered) {
    const classified = classifySpecifier(specifier);
    if (classified.kind === 'invalid') {
      errors.push(`${specifier}: import runtime inválido`);
    }
    if (classified.kind === 'external') discoveredNames.add(classified.name);
  }

  const declaredInventory = new Set();
  for (const specifier of runtimeImports) {
    const classified = classifySpecifier(specifier);
    if (classified.kind === 'invalid') {
      errors.push(`${specifier}: runtimeImports contiene un localizador inválido`);
    }
    if (classified.kind === 'external') declaredInventory.add(classified.name);
  }
  for (const name of discoveredNames) {
    if (runtimeImports.length > 0 && !declaredInventory.has(name)) {
      errors.push(`${name}: falta en runtimeImports pero fue descubierto en fuentes`);
    }
  }
  for (const name of declaredInventory) {
    if (!discoveredNames.has(name)) {
      errors.push(`${name}: runtimeImports no está respaldado por las fuentes`);
    }
  }

  for (const [name, range] of Object.entries(direct)) {
    if (typeof range !== 'string') {
      errors.push(`${name}: el rango debe ser string`);
      continue;
    }
    if (deny.has(name)) errors.push(`${name}: dependencia denegada`);
    if (allow.size > 0 && !allow.has(name)) {
      errors.push(`${name}: no figura en allow`);
    }

    const policy = overrides[name] ?? defaultPolicy;
    const parsed = parseRange(range, policy);
    if (!parsed.valid) {
      errors.push(`${name}: "${range}" incumple ${policy}`);
      continue;
    }
    if (!discoveredNames.has(name)) {
      errors.push(`${name}: dependencia directa no usada en runtimeRoots`);
    }
    if (parsed.major === '0') {
      warnings.push(
        `${name}@${range}: 0.x puede incluir cambios incompatibles; requiere test de integración`,
      );
      const integration = evidence.integrationResults.get(name);
      if (!integration) {
        errors.push(`${name}: falta test ejecutable en integrationTests para 0.x`);
      } else if (!integration.passed) {
        errors.push(`${name}: test de integración falló (${integration.detail})`);
      }
    }
  }

  for (const name of discoveredNames) {
    if (!(name in direct)) {
      const location =
        name in (packageJson.devDependencies ?? {})
          ? 'solo está en devDependencies'
          : 'no está declarada';
      errors.push(`${name}: dependencia runtime no directa (${location})`);
    }
  }

  for (const name of evidence.integrationResults.keys()) {
    if (!(name in direct)) {
      errors.push(`${name}: integrationTests no corresponde a una dependencia directa`);
    }
  }

  return {
    directCount: Object.keys(direct).length,
    errors,
    warnings,
    fileCount: evidence.fileCount,
    integrationCount: evidence.integrationResults.size,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`verificar-dependencias-semver — gate local sin red

Uso:
  node verificar-dependencias-semver.mjs --package package.json --config dependencias-semver.json

La configuración admite: defaultPolicy, policies por paquete, runtimeRoots,
runtimeImports, allow, deny, integrationTests y dedupPatterns.
Políticas: exact, caret-semver, major-band.
Este gate no consulta registries ni instala: C8 online se ejecuta aparte.`);
    return;
  }
  const option = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  const packagePath = resolve(option('--package', 'package.json'));
  const configPath = resolve(option('--config', 'dependencias-semver.json'));

  let packageJson;
  let config;
  try {
    [packageJson, config] = await Promise.all([
      loadJson(packagePath, 'package.json'),
      loadJson(configPath, 'configuración'),
    ]);
  } catch (error) {
    failInput(error.message);
    return;
  }

  let result;
  try {
    const evidence = await collectEvidence(packagePath, config);
    result = verify(packageJson, config, evidence);
  } catch (error) {
    failInput(error.message);
    return;
  }
  for (const warning of result.warnings) {
    console.warn(`[dependencias-semver] WARNING: ${warning}`);
  }
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`[dependencias-semver] FAIL: ${error}`);
    }
    console.error(
      `[dependencias-semver] FALLO: ${result.errors.length} problema(s); C8 no se ejecutó`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `[dependencias-semver] OK: ${result.directCount} dependencia(s) runtime; ${result.fileCount} fuente(s); ${result.integrationCount} integración(es); gate local sin red; C8 no se ejecutó`,
  );
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await main();
}
