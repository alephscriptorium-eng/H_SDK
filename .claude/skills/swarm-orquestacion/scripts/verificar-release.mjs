#!/usr/bin/env node
// verificar-release.mjs — gate anti-drift de la versión del README del paquete.
// Marco-agnóstico; sin deps (Node ≥18). Hermano de verificar-changelog.mjs.
//
// Motivo (DC-30 / INT-V-07): un tarball salió publicado con `package.json`
// en una versión y el README interno citando la ANTERIOR («actual 0.10.0»
// dentro de un paquete 0.11.0). El README viaja en `files` → es cara del
// tarball y debe cerrar con el semver publicado.
//
// Qué comprueba (todo derivado de package.json — NO hardcodea versiones):
//   1) PRESENCIA: la versión actual (package.json) aparece al menos una vez
//      en el README. Si el README solo cita una versión anterior → FALLO.
//   2) NINGUNA ANTERIOR COMO «ACTUAL»: toda referencia que declare la
//      versión vigente del paquete debe igualar la actual. Referencias
//      detectadas (patrones derivados del `name` del paquete + marcadores):
//        - `@<name>@X.Y.Z`            (install / npm view — «instalá ESTA»)
//        - `<name-sin-scope>-X.Y.Z.tgz` (nombre de tarball de `npm pack`)
//        - `(actual `X.Y.Z`)`          (marcador de release-notes)
//        - `paquete **X.Y.Z**`         (prosa «el paquete **X.Y.Z**»)
//        - cualquier `--marcador 'regex'` extra (grupo 1 = semver)
//      Una versión de SOLO-HISTORIA (p. ej. «sobre el corte **0.9.0**») no
//      cae en ningún patrón de actualidad → no la marca (correcto).
//   FALLO ruidoso: exit 1 nombrando FICHERO:LÍNEA + versión hallada + actual.
//
// Opt-in / parametrizable (adoptable en cualquier mundo/monorepo):
//   --pkg F         package.json fuente de verdad (default: package.json)
//   --readme F      README a verificar (default: README.md)
//   --doc F         doc empaquetado extra a escanear (repetible; NO incluir
//                   CHANGELOG: es version-keyed por diseño → falso positivo)
//   --marcador RE   patrón extra de «actualidad» (repetible; grupo 1 = semver)
//   --version x.y.z fuerza la versión actual (default: la de package.json)
//   -h, --help
//
// Uso:
//   node verificar-release.mjs                       # raíz del paquete
//   node verificar-release.mjs --pkg package.json --readme README.md
//   VERSION=... PKG=... README=... node verificar-release.mjs

import { readFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`verificar-release — gate anti-drift de la versión del README del paquete

Uso:
  node verificar-release.mjs [opciones]

Opciones:
  --pkg F         package.json (default: package.json) — name + versión actual
  --readme F      README a verificar (default: README.md)
  --doc F         doc empaquetado extra (repetible; NO pasar CHANGELOG.md)
  --marcador RE   patrón de «actualidad» extra (repetible; grupo 1 = semver)
  --version x.y.z fuerza la versión actual (default: package.json)
  -h, --help      Esta ayuda

Comprueba que la versión de package.json aparece en el README y que ninguna
versión anterior figura «como actual» (install/view/tarball/marcadores).`);
  process.exit(0);
}

const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const argAll = (n) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === n && argv[i + 1]) out.push(argv[i + 1]);
  return out;
};

const PKG = arg('--pkg', process.env.PKG || 'package.json');
const README = arg('--readme', process.env.README || 'README.md');
const DOCS_EXTRA = argAll('--doc');
const MARCADORES_EXTRA = argAll('--marcador');

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- Cargar package.json (name + versión actual) ---
if (!existsSync(PKG)) {
  console.error(`[verificar-release] package.json inexistente: ${PKG}`);
  process.exit(2);
}
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
} catch (e) {
  console.error(`[verificar-release] package.json ilegible (${PKG}): ${e.message}`);
  process.exit(2);
}
const NAME = pkg.name || '';
let VERSION = arg('--version', process.env.VERSION || pkg.version || '');
if (!VERSION) {
  console.error(`[verificar-release] sin versión actual (ni --version, ni PKG.version en ${PKG})`);
  process.exit(2);
}
if (!/^\d+\.\d+\.\d+/.test(VERSION)) {
  console.error(`[verificar-release] versión actual no parece semver: ${VERSION}`);
  process.exit(2);
}

// --- Cargar README (doc primario) + docs extra ---
if (!existsSync(README)) {
  console.error(`[verificar-release] README inexistente: ${README}`);
  process.exit(2);
}
const readmeText = readFileSync(README, 'utf-8');
const docs = [[README, readmeText]];
for (const f of DOCS_EXTRA) {
  if (!existsSync(f)) {
    console.error(`[verificar-release] --doc inexistente: ${f}`);
    process.exit(2);
  }
  docs.push([f, readFileSync(f, 'utf-8')]);
}

const problemas = [];

// --- Check 1: PRESENCIA de la versión actual en el README ---
const verLiteral = new RegExp(`\\b${reEscape(VERSION)}\\b`);
if (!verLiteral.test(readmeText)) {
  problemas.push(
    `${README}: la versión actual ${VERSION} (de ${PKG}) NO aparece en el README (drift de release)`,
  );
}

// --- Check 2: ninguna versión anterior «como actual» ---
// Patrones de actualidad derivados del name del paquete + marcadores de prosa.
const SEMVER = '(\\d+\\.\\d+\\.\\d+)';
const patrones = [];
if (NAME) {
  const unscoped = NAME.replace(/^@/, '').replace(/\//g, '-'); // npm pack: @scope/n → scope-n
  patrones.push({ etiqueta: `referencia npm (${NAME}@…)`, re: `${reEscape(NAME)}@${SEMVER}` });
  patrones.push({ etiqueta: `tarball npm pack (${unscoped}-….tgz)`, re: `${reEscape(unscoped)}-${SEMVER}\\.tgz` });
}
// Marcadores de prosa por defecto (idioma del canal; overridables/ampliables).
patrones.push({ etiqueta: 'marcador «(actual …)»', re: `\\(\\s*actual\\s+\`?\\s*${SEMVER}\\s*\`?\\s*\\)`, flags: 'gi' });
patrones.push({ etiqueta: 'prosa «el paquete **…**»', re: `paquete\\s+\\*\\*${SEMVER}\\*\\*`, flags: 'gi' });
for (const re of MARCADORES_EXTRA) patrones.push({ etiqueta: `marcador --marcador «${re}»`, re });

const lineaDe = (texto, idx) => texto.slice(0, idx).split(/\r?\n/).length;

for (const [fichero, texto] of docs) {
  for (const p of patrones) {
    const re = new RegExp(p.re, p.flags || 'g');
    let m;
    while ((m = re.exec(texto)) !== null) {
      const hallada = m[1];
      if (hallada && hallada !== VERSION) {
        problemas.push(
          `${fichero}:${lineaDe(texto, m.index)}: ${p.etiqueta} declara ${hallada} pero la versión actual es ${VERSION}`,
        );
      }
      if (m.index === re.lastIndex) re.lastIndex++; // guard anti-loop
    }
  }
}

console.log(
  `[verificar-release] pkg=${PKG} · version=${VERSION} · readme=${README}` +
    (DOCS_EXTRA.length ? ` · docs-extra=${DOCS_EXTRA.length}` : ''),
);

if (problemas.length) {
  for (const p of problemas) console.error(`  ✗ ${p}`);
  console.error(
    `\n[verificar-release] FALLO: ${problemas.length} desfase(s) de versión en la cara del tarball. ` +
      `El README (files) debe cerrar con package.json ${VERSION}; ninguna versión anterior puede figurar como actual.`,
  );
  process.exit(1);
}
console.log(
  `[verificar-release] OK: ${README} cita la versión actual ${VERSION} y ninguna anterior figura como actual.`,
);
