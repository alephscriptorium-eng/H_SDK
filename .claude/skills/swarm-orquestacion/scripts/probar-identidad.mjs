#!/usr/bin/env node
// probar-identidad.mjs — pruebas de verificar-identidad.mjs con `node --test`.
// Repos git sintéticos en un tmp; se limpian al terminar. Sin deps externas.
//
// Ejecutar:  node --test probar-identidad.mjs
//
// Aislamiento: cada corrida del guard recibe GIT_CONFIG_GLOBAL/SYSTEM apuntando
// a un gitconfig vacío, para que solo cuente la config LOCAL del repo sintético
// (la identidad real de la máquina no contamina los casos).

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'verificar-identidad.mjs');

let sandbox;
let emptyCfg;

before(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-identidad-'));
  emptyCfg = path.join(sandbox, 'gitconfig-vacio');
  fs.writeFileSync(emptyCfg, '');
});

after(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
});

function makeRepo(name, { userName, userEmail } = {}) {
  const root = path.join(sandbox, name);
  fs.mkdirSync(root, { recursive: true });
  execFileSync('git', ['init', '--quiet', root]);
  if (userName) execFileSync('git', ['-C', root, 'config', 'user.name', userName]);
  if (userEmail) execFileSync('git', ['-C', root, 'config', 'user.email', userEmail]);
  return root;
}

// env base sin ninguna GIT_* heredada, con config global/system aislada.
function baseEnv(extra = {}) {
  const env = { ...process.env };
  for (const k of [
    'GIT_AUTHOR_NAME',
    'GIT_AUTHOR_EMAIL',
    'GIT_COMMITTER_NAME',
    'GIT_COMMITTER_EMAIL',
    'EMAIL',
    'IDENTIDAD_PLACEHOLDERS',
    'IDENTIDAD_REPO',
  ]) {
    delete env[k];
  }
  env.GIT_CONFIG_GLOBAL = emptyCfg;
  env.GIT_CONFIG_SYSTEM = emptyCfg;
  return { ...env, ...extra };
}

function run(repo, { placeholders = [], env = {}, verbose = false } = {}) {
  const args = ['--repo', repo];
  for (const p of placeholders) args.push('--placeholder', p);
  if (verbose) args.push('--verbose');
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: baseEnv(env),
  });
}

// snapshot recursivo (ruta:size) para detectar cualquier efecto en disco.
function snapshot(root) {
  const entries = [];
  (function walk(dir) {
    for (const it of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, it.name);
      const rel = path.relative(root, abs).replaceAll('\\', '/');
      if (it.isDirectory()) {
        entries.push(`d:${rel}`);
        walk(abs);
      } else {
        entries.push(`f:${rel}:${fs.statSync(abs).size}`);
      }
    }
  })(root);
  return entries.sort().join('\n');
}

// --- CA: placeholder detectado -> WARNING + diagnóstico; exit 0 -----------
test('config placeholder -> WARNING con remedios y exit 0', () => {
  const repo = makeRepo('cfg-placeholder', {
    userName: 'Your Name',
    userEmail: 'you@example.com',
  });
  const r = run(repo);
  assert.equal(r.status, 0, 'exit 0 SIEMPRE');
  assert.match(r.stderr, /WARNING/);
  assert.match(r.stderr, /PLACEHOLDER/i);
  assert.match(r.stderr, /you@example\.com/);
  // remedios presentes
  assert.match(r.stderr, /git -c user\.name=/);
  assert.match(r.stderr, /GIT_AUTHOR_NAME/);
  assert.match(r.stderr, /git config user\.name/);
});

// --- CA: identidad legítima -> sin ruido; exit 0 --------------------------
test('identidad real -> silencio y exit 0', () => {
  const repo = makeRepo('cfg-real', {
    userName: 'Nombre Real',
    userEmail: 'dev@equipo.example',
  });
  const r = run(repo);
  assert.equal(r.status, 0);
  assert.equal(r.stderr.trim(), '', 'sin WARNING');
  assert.equal(r.stdout.trim(), '', 'sin ruido en stdout');
});

test('identidad real + --verbose -> línea OK (opt-in), sin WARNING', () => {
  const repo = makeRepo('cfg-real-verbose', {
    userName: 'Nombre Real',
    userEmail: 'dev@equipo.example',
  });
  const r = run(repo, { verbose: true });
  assert.equal(r.status, 0);
  assert.equal(r.stderr.trim(), '');
  assert.match(r.stdout, /OK: identidad efectiva legítima/);
});

// --- vars GIT_AUTHOR/COMMITTER se respetan --------------------------------
test('GIT_AUTHOR_* placeholder sobre config real -> WARNING (autor)', () => {
  const repo = makeRepo('env-author-placeholder', {
    userName: 'Nombre Real',
    userEmail: 'dev@equipo.example',
  });
  const r = run(repo, {
    env: { GIT_AUTHOR_NAME: 'Your Name', GIT_AUTHOR_EMAIL: 'you@example.com' },
  });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
  assert.match(r.stderr, /autor/);
});

test('config placeholder pero GIT_COMMITTER real sin cubrir autor -> WARNING', () => {
  // config placeholder; solo committer aprovisionado por env => autor sigue
  // resolviendo al placeholder de config.
  const repo = makeRepo('env-committer-only', {
    userName: 'Your Name',
    userEmail: 'you@example.com',
  });
  const r = run(repo, {
    env: {
      GIT_COMMITTER_NAME: 'Nombre Real',
      GIT_COMMITTER_EMAIL: 'dev@equipo.example',
    },
  });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
  assert.match(r.stderr, /autor/);
});

test('env cubre autor y committer con identidad real -> silencio', () => {
  const repo = makeRepo('env-both-real', {
    userName: 'Your Name',
    userEmail: 'you@example.com',
  });
  const r = run(repo, {
    env: {
      GIT_AUTHOR_NAME: 'Nombre Real',
      GIT_AUTHOR_EMAIL: 'dev@equipo.example',
      GIT_COMMITTER_NAME: 'Nombre Real',
      GIT_COMMITTER_EMAIL: 'dev@equipo.example',
    },
  });
  assert.equal(r.status, 0);
  assert.equal(r.stderr.trim(), '', 'env real cubre todo -> sin WARNING');
});

// --- lista de placeholders ampliable --------------------------------------
test('--placeholder amplía la lista (email de bot de CI) -> WARNING', () => {
  const repo = makeRepo('flag-placeholder', {
    userName: 'Bot CI',
    userEmail: 'bot@ci.example',
  });
  const limpio = run(repo);
  assert.equal(limpio.stderr.trim(), '', 'sin ampliar, bot no es placeholder default');
  const r = run(repo, { placeholders: ['bot@ci.example'] });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
  assert.match(r.stderr, /bot@ci\.example/);
});

test('IDENTIDAD_PLACEHOLDERS (env, coma-separado) amplía la lista -> WARNING', () => {
  const repo = makeRepo('env-placeholders', {
    userName: 'Bot CI',
    userEmail: 'bot@ci.example',
  });
  const r = run(repo, { env: { IDENTIDAD_PLACEHOLDERS: 'Otro Bot,bot@ci.example' } });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
});

test('coincidencia case-insensitive con recorte de espacios', () => {
  const repo = makeRepo('case-insensitive', {
    userName: '  YOUR NAME  ',
    userEmail: 'YOU@EXAMPLE.COM',
  });
  const r = run(repo);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
});

// --- identidad sin configurar ---------------------------------------------
test('identidad sin configurar -> WARNING (sin configurar) y exit 0', () => {
  const repo = makeRepo('sin-config', {}); // sin user.name/email locales
  const r = run(repo);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /WARNING/);
  assert.match(r.stderr, /SIN CONFIGURAR/i);
});

// --- exit 0 aunque el repo no exista / no sea repo ------------------------
test('repo inexistente -> AVISO y exit 0 (nunca bloquea)', () => {
  const r = run(path.join(sandbox, 'no-existe'));
  assert.equal(r.status, 0, 'exit 0 SIEMPRE, incluso ante error operativo');
  assert.match(r.stderr, /AVISO|no se pudo inspeccionar/i);
});

test('directorio que no es repo git -> AVISO y exit 0', () => {
  const dir = path.join(sandbox, 'no-repo');
  fs.mkdirSync(dir, { recursive: true });
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /AVISO|no se pudo inspeccionar/i);
});

// --- cero efectos secundarios ---------------------------------------------
test('cero efectos: ni disco ni git config cambian', () => {
  const repo = makeRepo('sin-efectos', {
    userName: 'Your Name',
    userEmail: 'you@example.com',
  });
  const treeBefore = snapshot(repo);
  const cfgBefore = fs.readFileSync(path.join(repo, '.git', 'config'), 'utf8');

  const r = run(repo);
  assert.equal(r.status, 0);

  const treeAfter = snapshot(repo);
  const cfgAfter = fs.readFileSync(path.join(repo, '.git', 'config'), 'utf8');
  assert.equal(treeAfter, treeBefore, 'el árbol de ficheros no cambia');
  assert.equal(cfgAfter, cfgBefore, 'la config de git no cambia');
});

// --- --help exit 0 --------------------------------------------------------
test('--help imprime uso y exit 0', () => {
  const r = spawnSync(process.execPath, [script, '--help'], {
    encoding: 'utf8',
    env: baseEnv(),
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /verificar-identidad/);
  assert.match(r.stdout, /warn-only/);
});
