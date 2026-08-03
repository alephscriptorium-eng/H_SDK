// Tests del parser multi-serie de proyectar-backlog.mjs (WP-27, DC-29).
// Ejecutar: node --test skills/swarm-orquestacion/scripts/
// Fixtures SINTÉTICAS y método-agnósticas: series ficticias (AA/BB/CC/N0/
// WP-U…), sin nombres de mundo real. Verifican: parseo de series declaradas
// (verde), fallo RUIDOSO ante mixto no declarado / 0 WPs (rojo) y CERO
// normalización de IDs del consumidor.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseBacklog, seriesList } from './proyectar-backlog.mjs';

// Ruta absoluta al script (para spawn del CLI real y su contrato de exit).
const SCRIPT = fileURLToPath(new URL('./proyectar-backlog.mjs', import.meta.url));

// Ejecuta `export --dry-run` del CLI real sobre un backlog sintético en un
// dir temporal aislado (map inexistente → sin sync-map real). Devuelve
// { status, stdout, stderr }. CEGUERA_PATTERN no-coincidente para que el
// gate no interfiera con el contrato de parseo/exit.
function runExportCLI(backlogText, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), 'wp27-cli-'));
  try {
    const backlog = join(dir, 'BACKLOG.md');
    writeFileSync(backlog, backlogText);
    return spawnSync(
      process.execPath,
      [SCRIPT, 'export', '--dry-run', '--backlog', backlog, '--map', join(dir, 'nomap.json'), ...extraArgs],
      { encoding: 'utf-8', env: { ...process.env, CEGUERA_PATTERN: 'zzz_token_que_no_coincide' } }
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- Fixture 1: BACKLOG estilo multi-serie (series declaradas) ---
const BACKLOG_MULTISERIE = `# BACKLOG

Estados: ⬜ pendiente · 🔶 en curso · ✅ aceptado.

## Ola A

- ⬜ **AA-1 · Primer ítem de la serie AA** — cuerpo con detalle
  y una segunda línea de prosa.
- 🔶 **BB-02** — ítem en curso de la serie BB con prosa suelta.
- ✅ **CC-3 · Ítem aceptado de la serie CC**
- ⬜ N0-5 — serie con prefijo alfanumérico (letra + dígito)
`;

// --- Fixture 2: BACKLOG estilo WP-Unnn (serie por defecto) ---
const BACKLOG_WP_UNNN = `# BACKLOG

Estados: ⬜ pendiente · 🔶 en curso · ✅ aceptado.

- ⬜ **WP-U172 · Proyector de mutaciones** — cuerpo del WP.
- 🔶 **WP-U173** — kit de reparto, en curso.
- ✅ **WP-27 · Parser multi-serie**
- ⬜ WP-I60 · ID con prefijo de letra en el sufijo
`;

// --- Fixture 3: mixto NO declarado (AA declarada, BB no) ---
const BACKLOG_MIXTO = `# BACKLOG

- ⬜ **AA-1 · Ítem declarado**
- ⬜ **BB-2 · Ítem de serie NO declarada**
`;

// --- Fixture 4: ítems presentes pero de serie ajena a la default ---
const BACKLOG_SOLO_AJENA = `# BACKLOG

- ⬜ **AA-1 · Solo serie AA, sin ninguna WP-**
- 🔶 **AA-2 · Segunda de la serie AA**
`;

test('multi-serie declarado → parsea N WPs con IDs literales (antes 0)', () => {
  const wps = parseBacklog(BACKLOG_MULTISERIE, 'AA-\\d+|BB-\\d+|CC-\\d+|N0-\\d+');
  assert.equal(wps.length, 4, 'debe parsear los 4 ítems multi-serie');
  assert.deepEqual(
    wps.map((w) => w.id),
    ['AA-1', 'BB-02', 'CC-3', 'N0-5'],
    'IDs conservados literales, sin normalizar (BB-02 NO se vuelve BB-2)'
  );
  assert.deepEqual(
    wps.map((w) => w.estado),
    ['⬜', '🔶', '✅', '⬜']
  );
  assert.equal(wps[0].titulo, 'Primer ítem de la serie AA');
  assert.equal(wps[2].titulo, 'Ítem aceptado de la serie CC');
});

test('estilo WP-Unnn con serie por defecto → parsea (WP-U172, WP-I60…)', () => {
  const wps = parseBacklog(BACKLOG_WP_UNNN); // sin --series → default WP-[A-Za-z0-9]+
  assert.equal(wps.length, 4);
  assert.deepEqual(
    wps.map((w) => w.id),
    ['WP-U172', 'WP-U173', 'WP-27', 'WP-I60'],
    'IDs WP-Unnn e WP-I60 conservados literales'
  );
  assert.equal(wps[0].titulo, 'Proyector de mutaciones');
});

test('mixto NO declarado → FALLA ruidoso con diagnóstico de series', () => {
  assert.throws(
    () => parseBacklog(BACKLOG_MIXTO, 'AA-\\d+'),
    (err) => {
      assert.match(err.message, /NO declarada/i, 'menciona serie no declarada');
      assert.match(err.message, /BB/, 'nombra la serie detectada BB');
      assert.match(err.message, /series declaradas: AA-\\d\+/, 'lista las declaradas');
      assert.match(err.message, /línea 4/, 'apunta la línea del ítem mixto');
      return true;
    }
  );
});

test('todos los ítems de serie ajena a la default → FALLA (nunca 0 en silencio)', () => {
  assert.throws(
    () => parseBacklog(BACKLOG_SOLO_AJENA), // default WP-… ; ítems son AA-…
    (err) => {
      assert.match(err.message, /NO declarada/i);
      assert.match(err.message, /AA/);
      return true;
    },
    'un backlog con ítems y 0 WPs de la serie declarada debe fallar ruidoso'
  );
});

test('CERO normalización: ID literal preservado (N0-5, BB-02)', () => {
  const wps = parseBacklog('- ⬜ **N0-5 · sin ceros a la izquierda**', 'N0-\\d+');
  assert.equal(wps.length, 1);
  assert.equal(wps[0].id, 'N0-5', 'no se reescribe el prefijo ni el número');
});

test('retrocompat: formas mixtas de encabezado con serie por defecto', () => {
  const bl = `# BACKLOG

- ✅ **WP-01 · Portal** — con prosa
- ⬜ **WP-02** — prosa sin separador de título
- 🔶 WP-03 · título plano
- ⬜ **WP-04**
- ⬜ WP-05
`;
  const wps = parseBacklog(bl);
  assert.deepEqual(
    wps.map((w) => w.id),
    ['WP-01', 'WP-02', 'WP-03', 'WP-04', 'WP-05']
  );
  assert.equal(wps[0].titulo, 'Portal');
  assert.equal(wps[3].titulo, 'WP-04', 'bare → título = id');
});

test('serie declarada pero encabezado no interpretable → FALLA (WP-18)', () => {
  // WP-30 es de serie declarada pero no hay separador de título ni es bare.
  const bl = '- ⬜ **WP-30 titulo sin separador valido**';
  assert.throws(
    () => parseBacklog(bl),
    /no interpretable en línea 1/,
    'ID declarado con encabezado roto debe fallar ruidoso, no omitirse'
  );
});

test('ítem con estado pero SIN forma de ID → se ignora (no es WP)', () => {
  const bl = `# BACKLOG

- ✅ Nota de checklist sin identificador de WP
- ⬜ **WP-09 · sí es WP**
`;
  const wps = parseBacklog(bl);
  assert.equal(wps.length, 1);
  assert.equal(wps[0].id, 'WP-09');
});

test('serie con ID complejo (dots/dashes) declarada → parsea literal', () => {
  // Forma tipo `GF-0.10.0-Z`: el ID lleva puntos y un sufijo. Si se declara
  // la serie, el parser lo captura entero (sin truncar a `GF-0`).
  const bl = '- ⬜ **GF-0.10.0-Z · gate final de release**';
  const wps = parseBacklog(bl, 'GF-[0-9.]+-[A-Z]');
  assert.equal(wps.length, 1);
  assert.equal(wps[0].id, 'GF-0.10.0-Z', 'ID complejo conservado literal, sin truncar');
  assert.equal(wps[0].titulo, 'gate final de release');
});

test('mismo ID complejo SIN declarar → FALLA ruidoso (no se omite)', () => {
  const bl = '- ⬜ **GF-0.10.0-Z · gate final de release**';
  assert.throws(
    () => parseBacklog(bl), // default WP-… ; GF- no declarada
    (err) => {
      assert.match(err.message, /NO declarada/i);
      assert.match(err.message, /GF/);
      return true;
    }
  );
});

test('seriesList parte la alternación para diagnóstico', () => {
  assert.deepEqual(seriesList('IB-\\d+|PD-\\d+|LIB-\\d+'), ['IB-\\d+', 'PD-\\d+', 'LIB-\\d+']);
});

test('cuerpo del WP se acumula hasta el siguiente ítem/encabezado', () => {
  const bl = `- ⬜ **AA-1 · uno**
  cuerpo de AA-1
  más cuerpo
- ⬜ **AA-2 · dos**`;
  const wps = parseBacklog(bl, 'AA-\\d+');
  assert.equal(wps.length, 2);
  assert.match(wps[0].body, /cuerpo de AA-1/);
  assert.match(wps[0].body, /más cuerpo/);
  assert.doesNotMatch(wps[0].body, /AA-2/);
});

// --- Contrato de EXIT CODES a nivel CLI (spawn del script real, OBS-2) ---
// Muerden el exit code de doExport, no solo parseBacklog. Una mutación que
// se trague el catch y siga con wps=[] hace caer (a) y (b): esperarían 5
// pero obtendrían 0 («0 proyectado(s)»).

test('CLI: serie NO declarada → exit 5 + stderr nombra la serie', () => {
  const r = runExportCLI('# BACKLOG\n\n- ⬜ **ZZ-1 · serie ajena a la default**\n');
  assert.equal(r.status, 5, `stderr:\n${r.stderr}\nstdout:\n${r.stdout}`);
  assert.match(r.stderr, /NO declarada/i);
  assert.match(r.stderr, /ZZ/, 'el diagnóstico nombra la serie detectada');
});

test('CLI: backlog solo-prosa (0 líneas de ítem) → exit 5 + «NINGUNA línea de ítem»', () => {
  const r = runExportCLI('# BACKLOG\n\nSolo prosa. Ruta equivocada o fichero truncado.\nSin marcas de estado.\n');
  assert.equal(r.status, 5, `stderr:\n${r.stderr}\nstdout:\n${r.stdout}`);
  assert.match(r.stderr, /NINGUNA línea de ítem/);
  assert.doesNotMatch(r.stdout, /proyectado\(s\)/, 'jamás llega a proyectar');
});

test('CLI: fixture válida declarada → exit 0 + proyecta', () => {
  const r = runExportCLI('# BACKLOG\n\n- ⬜ **AA-1 · válida**\n- ✅ **AA-2 · otra válida**\n', ['--series', 'AA-\\d+']);
  assert.equal(r.status, 0, `stderr:\n${r.stderr}\nstdout:\n${r.stdout}`);
  assert.match(r.stdout, /2 proyectado\(s\)/);
});
