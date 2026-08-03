#!/usr/bin/env node
// verificar-identidad.mjs — guard opt-in de la IDENTIDAD EFECTIVA de git.
// Marco-agnóstico; sin deps (Node >=18); warn-only.
//
// Motivación (gobierno): un repo puede quedar con la identidad de git en el
// placeholder por defecto ("Your Name" / "you@example.com"). Los commits de
// gobierno o los merges heredan esa identidad y quedan mal atribuidos. Este
// guard es un PREFLIGHT opt-in: se corre ANTES de un commit de gobierno o un
// merge para avisar si la identidad efectiva es un placeholder.
//
// Qué comprueba: la identidad EFECTIVA que git usaría para el repo dado,
// resolviendo autor y committer con la misma precedencia que git:
//   nombre  autor     = GIT_AUTHOR_NAME     -> config user.name
//   email   autor     = GIT_AUTHOR_EMAIL    -> config user.email  -> $EMAIL
//   nombre  committer = GIT_COMMITTER_NAME  -> config user.name
//   email   committer = GIT_COMMITTER_EMAIL -> config user.email  -> $EMAIL
// Si cualquiera de esos cuatro tokens casa (sin distinguir mayúsculas, con
// recorte de espacios) con la lista de placeholders, emite un WARNING claro
// con remedios. Si la identidad está sin configurar (ningún token resuelve),
// emite un WARNING distinto. Identidad legítima -> sin ruido.
//
// GARANTÍAS (invariantes duros):
//   - Exit 0 SIEMPRE (warn-only): jamás bloquea, ni siquiera ante errores
//     operativos (repo inexistente, no-es-repo, git ausente).
//   - Cero efectos secundarios: solo lecturas (`git config --get`,
//     `git rev-parse`). Nunca escribe `git config`, nunca reescribe historia,
//     nunca crea ni modifica ficheros.
//
// Placeholders: default "Your Name" / "you@example.com" (default de git),
// ampliable por flag `--placeholder <valor>` (repetible) o por env
// `IDENTIDAD_PLACEHOLDERS` (lista separada por comas). Cada placeholder se
// compara tanto contra nombres como contra emails.
//
// Uso:
//   node verificar-identidad.mjs [--repo DIR] [--placeholder V]... [--verbose]
//   IDENTIDAD_PLACEHOLDERS="Bot CI,ci@example.org" node verificar-identidad.mjs
//
// Salida: WARNING -> stderr; confirmación (--verbose) -> stdout. Siempre exit 0.

import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`verificar-identidad — guard opt-in de la identidad efectiva de git (warn-only)

Uso:
  node verificar-identidad.mjs [opciones]

Opciones:
  --repo DIR           Repo a inspeccionar (default: directorio actual)
  --placeholder V      Placeholder extra (nombre o email); repetible
  --verbose            Imprime una línea de confirmación si la identidad es OK
  -h, --help           Esta ayuda

Env:
  IDENTIDAD_PLACEHOLDERS   Placeholders extra separados por comas
  GIT_AUTHOR_NAME/EMAIL, GIT_COMMITTER_NAME/EMAIL   se respetan al resolver

Contrato: warn-only. Exit 0 SIEMPRE. Cero efectos secundarios (solo lecturas
de git config; jamás escribe config ni historia).`);
  process.exit(0);
}

// --- parseo de flags (soporta --placeholder repetible) --------------------
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const argAll = (n) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === n && argv[i + 1]) out.push(argv[i + 1]);
  }
  return out;
};

const REPO = arg('--repo', process.env.IDENTIDAD_REPO || '.');
const VERBOSE = argv.includes('--verbose');

// --- lista de placeholders ------------------------------------------------
const DEFAULT_PLACEHOLDERS = ['Your Name', 'you@example.com'];
const extraEnv = (process.env.IDENTIDAD_PLACEHOLDERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const placeholders = new Set(
  [...DEFAULT_PLACEHOLDERS, ...argAll('--placeholder'), ...extraEnv]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// --- helpers de git (solo lectura) ----------------------------------------
function gitRead(args) {
  try {
    const r = spawnSync('git', args, { encoding: 'utf8' });
    if (r.error) return { ok: false, out: null, err: r.error.message };
    if (r.status !== 0) return { ok: false, out: null, err: (r.stderr || '').trim() };
    return { ok: true, out: (r.stdout || '').replace(/\r?\n$/, ''), err: '' };
  } catch (e) {
    return { ok: false, out: null, err: e.message };
  }
}

function configGet(key) {
  const r = gitRead(['-C', REPO, 'config', '--get', key]);
  if (!r.ok) return null;
  const v = r.out.trim();
  return v === '' ? null : v;
}

// env var: presente y no vacía cuenta; vacía = no seteada (git la ignora).
function envOr(name, fallback) {
  const v = process.env[name];
  return v !== undefined && v.trim() !== '' ? v : fallback;
}

// --- ¿es un repo git? (warn-only, nunca bloquea) --------------------------
const insideRepo = gitRead(['-C', REPO, 'rev-parse', '--git-dir']);
if (!insideRepo.ok) {
  console.error(
    `[verificar-identidad] AVISO: no se pudo inspeccionar la identidad de git en "${REPO}".\n` +
      `  Motivo: ${insideRepo.err || 'no parece un repositorio git (o git no está disponible)'}.\n` +
      `  Este guard es warn-only y no bloquea; verifica la identidad manualmente antes de commitear.`,
  );
  process.exit(0); // exit 0 SIEMPRE
}

// --- identidad efectiva (misma precedencia que git) -----------------------
const cfgName = configGet('user.name');
const cfgEmail = configGet('user.email');
const envEmail = envOr('EMAIL', null); // fallback histórico de git para email

const authorName = envOr('GIT_AUTHOR_NAME', cfgName);
const authorEmail = envOr('GIT_AUTHOR_EMAIL', cfgEmail ?? envEmail);
const committerName = envOr('GIT_COMMITTER_NAME', cfgName);
const committerEmail = envOr('GIT_COMMITTER_EMAIL', cfgEmail ?? envEmail);

const tokens = [
  { rol: 'autor', campo: 'nombre', valor: authorName },
  { rol: 'autor', campo: 'email', valor: authorEmail },
  { rol: 'committer', campo: 'nombre', valor: committerName },
  { rol: 'committer', campo: 'email', valor: committerEmail },
];

const hits = tokens.filter(
  (t) => t.valor && placeholders.has(String(t.valor).trim().toLowerCase()),
);
const faltantes = tokens.filter((t) => !t.valor);

// --- diagnóstico ----------------------------------------------------------
function resumenIdentidad() {
  const fmt = (n, e) => `${n || '(sin nombre)'} <${e || '(sin email)'}>`;
  return (
    `    autor:     ${fmt(authorName, authorEmail)}\n` +
    `    committer: ${fmt(committerName, committerEmail)}`
  );
}

const REMEDIOS =
  `  Remedios (elige uno; el guard no aplica ninguno por ti):\n` +
  `    1. Identidad por invocación (no persiste, ideal para un commit puntual):\n` +
  `         git -c user.name="Nombre Real" -c user.email="tu@correo.example" commit ...\n` +
  `    2. Aprovisionar el entorno de la sesión (afecta a todos los commits):\n` +
  `         export GIT_AUTHOR_NAME="Nombre Real"    GIT_AUTHOR_EMAIL="tu@correo.example"\n` +
  `         export GIT_COMMITTER_NAME="Nombre Real" GIT_COMMITTER_EMAIL="tu@correo.example"\n` +
  `    3. Config del repo (persiste en este repo):\n` +
  `         git config user.name "Nombre Real"  &&  git config user.email "tu@correo.example"`;

if (hits.length) {
  const detalle = hits
    .map((t) => `      - ${t.rol} ${t.campo}: "${t.valor}" (placeholder)`)
    .join('\n');
  console.error(
    `[verificar-identidad] WARNING: la identidad efectiva de git es un PLACEHOLDER.\n` +
      `  Repo: ${REPO}\n` +
      `  Un commit o merge quedaría atribuido a una identidad ficticia:\n` +
      detalle +
      `\n  Identidad efectiva:\n` +
      resumenIdentidad() +
      `\n` +
      REMEDIOS +
      `\n  (warn-only: exit 0; no se ha tocado ninguna config ni historia.)`,
  );
  process.exit(0); // exit 0 SIEMPRE
}

if (faltantes.length) {
  const detalle = faltantes
    .map((t) => `      - ${t.rol} ${t.campo}: sin resolver`)
    .join('\n');
  console.error(
    `[verificar-identidad] WARNING: la identidad efectiva de git está SIN CONFIGURAR.\n` +
      `  Repo: ${REPO}\n` +
      `  git usaría una identidad implícita (usuario@host) y la atribución sería\n` +
      `  no determinista:\n` +
      detalle +
      `\n` +
      REMEDIOS +
      `\n  (warn-only: exit 0; no se ha tocado ninguna config ni historia.)`,
  );
  process.exit(0); // exit 0 SIEMPRE
}

// Identidad legítima -> sin ruido (solo confirma con --verbose).
if (VERBOSE) {
  console.log(
    `[verificar-identidad] OK: identidad efectiva legítima (sin placeholders).\n` +
      resumenIdentidad(),
  );
}
process.exit(0); // exit 0 SIEMPRE
