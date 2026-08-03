// server.mjs · demo «Prueba de H·M — El Descenso»
// Servidor de la demo: node:http puro, cero build, cero dependencias de red.
// Sirve public/ y monta three, los kits @zeus, los modelos, el mapa y el Ónfalo.
//
// Uso:   node server.mjs            (puerto 4180)
//        PUERTO=4181 node server.mjs
//
// Rutas montadas (verificadas contra node_modules antes de escribirse):
//   /vendor/three/            → node_modules/three/build/
//   /vendor/three/examples/   → node_modules/three/examples/   (jsm = addons)
//   /kit/                     → node_modules/@zeus/ui-3d-kit/src/
//   /view-kit/                → node_modules/@zeus/view-kit/src/
//   /game-engine/             → node_modules/@zeus/game-engine/src/
//   /models/                  → node_modules/@zeus/game-engine/assets/models/
//   /zeus-ciudad/             → node_modules/@zeus/ciudad/src/
//   /zeus-protocol/           → node_modules/@zeus/protocol/       (raíz: el
//                               entry real es src/index.mjs, ver package.json)
//   /onfalo/                  → assets/onfalo/
//   /mapa.json                → assets/mapa/mapa.json
//
// Nota: three/build/three.module.js importa «./three.core.js», por eso se monta
// el directorio build/ completo en /vendor/three/ y no solo el módulo suelto.
//
// ── ENDPOINTS NODE (lo que NO puede vivir en el navegador) ───────────────────
//   GET  /onfalo/index.json  índice de piezas del Ónfalo; recomputa el sha256
//                            de cada pieza en disco y lo contrasta contra el
//                            sello real de assets/onfalo/source.manifest.json.
//   POST /api/acta           `emitirActa` + `huellaLedger` REALES de
//                            @zeus/ciudad/acta. Viven aquí y no en el
//                            navegador porque acta.mjs usa node:crypto.
//   POST /api/verificar      re-verifica una cadena chain.ndjson H/M
//                            recomputando digests. Usa el verificador REAL del
//                            playground (lib/cadena/hash.mjs + envelope.mjs)
//                            cuando el checkout está presente; si no, una
//                            reimplementación local del mismo algoritmo, y lo
//                            dice en la respuesta (`motor`). Nunca finge.
//
// Frontera declarada: `@zeus/ciudad/domain` y `@zeus/ciudad/scene` SÍ cargan en
// el navegador, pero domain.mjs arrastra acta.mjs → node:crypto. Por eso el
// import map de public/index.html resuelve `node:crypto` a /shim/node-crypto.mjs
// (SHA-256 estándar, huella idéntica, autoverificado). Ese camino es
// re-verificable contra el node:crypto de verdad por /api/acta y /api/verificar.

import http from 'node:http';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync as existeSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Mecanismo REAL de Scriptorium: la notaría del acta es la del juego «ciudad».
// (verificado: node_modules/@zeus/ciudad/package.json exporta «./acta»)
import {
  ACTA_CLASES,
  ACTA_ESTADOS,
  ACTA_VERSION,
  LEDGER_ACTA,
  RESUMEN_MAX,
  emitirActa,
  huellaLedger,
  isActaDeBarrioShaped,
} from '@zeus/ciudad/acta';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

export const PUERTO_POR_DEFECTO = 4180;
export const HOST_POR_DEFECTO = '127.0.0.1';

// ── localización de node_modules (sube directorios hasta encontrarlo) ────────
function buscarNodeModules(desde) {
  let dir = desde;
  for (let i = 0; i < 12; i += 1) {
    const cand = path.join(dir, 'node_modules');
    // basta con comprobar three, que es la dependencia crítica del import map
    if (existeSync(path.join(cand, 'three', 'build', 'three.module.js'))) return cand;
    const padre = path.dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  return path.resolve(desde, '..', '..', 'node_modules');
}

const NODE_MODULES = buscarNodeModules(AQUI);
const PUBLICO = path.join(AQUI, 'public');
const MAPA = path.join(AQUI, 'assets', 'mapa', 'mapa.json');
const ONFALO = path.join(AQUI, 'assets', 'onfalo');
const ONFALO_MANIFIESTO = path.join(ONFALO, 'source.manifest.json');

// ── tabla de montajes ────────────────────────────────────────────────────────
// El orden importa: se prueba el prefijo más largo primero.
export const MONTAJES = [
  { url: '/vendor/three/examples/', disco: path.join(NODE_MODULES, 'three', 'examples'), cache: 'largo' },
  { url: '/vendor/three/', disco: path.join(NODE_MODULES, 'three', 'build'), cache: 'largo' },
  { url: '/kit/', disco: path.join(NODE_MODULES, '@zeus', 'ui-3d-kit', 'src'), cache: 'corto' },
  { url: '/view-kit/', disco: path.join(NODE_MODULES, '@zeus', 'view-kit', 'src'), cache: 'corto' },
  { url: '/game-engine/', disco: path.join(NODE_MODULES, '@zeus', 'game-engine', 'src'), cache: 'corto' },
  { url: '/models/', disco: path.join(NODE_MODULES, '@zeus', 'game-engine', 'assets', 'models'), cache: 'largo' },
  // R2 · el dominio y la escena del juego «ciudad», tal cual se publican.
  { url: '/zeus-ciudad/', disco: path.join(NODE_MODULES, '@zeus', 'ciudad', 'src'), cache: 'corto' },
  // R2 · protocol se monta por la RAÍZ del paquete: su package.json declara
  // `"main": "src/index.mjs"` y `"exports": { ".": "./src/index.mjs" }`, y el
  // import map necesita poder apuntar a src/index.mjs sin inventarse un alias.
  { url: '/zeus-protocol/', disco: path.join(NODE_MODULES, '@zeus', 'protocol'), cache: 'corto' },
  // R2 · piezas del Ónfalo (fixture sellado, copia de consumo).
  { url: '/onfalo/', disco: ONFALO, cache: 'corto' },
].sort((a, b) => b.url.length - a.url.length);

const FICHEROS_SUELTOS = new Map([
  ['/mapa.json', MAPA],
]);

// ── tipos MIME ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ndjson': 'application/x-ndjson; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.hdr': 'image/vnd.radiance',
  '.exr': 'image/aces',
  '.ktx2': 'image/ktx2',
  '.dds': 'image/vnd-ms.dds',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
};

export function tipoMime(ruta) {
  return MIME[path.extname(ruta).toLowerCase()] || 'application/octet-stream';
}

const CACHE = {
  largo: 'public, max-age=3600',   // vendor y modelos: no cambian durante la demo
  corto: 'no-cache',               // kits @zeus
  vivo: 'no-cache',                // public/: los workers editan en caliente
};

// ── utilidades ───────────────────────────────────────────────────────────────
function dentro(base, destino) {
  const rel = path.relative(base, destino);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

async function estatDe(abs) {
  try {
    const st = await fs.stat(abs);
    return st.isFile() ? st : null;
  } catch {
    return null;
  }
}

function etiqueta(st) {
  return `W/"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
}

function responderTexto(res, codigo, texto) {
  const cuerpo = Buffer.from(texto, 'utf8');
  res.writeHead(codigo, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': cuerpo.length,
    'cache-control': 'no-store',
  });
  res.end(cuerpo);
}

function responderJson(res, codigo, dato) {
  const cuerpo = Buffer.from(JSON.stringify(dato, null, 2), 'utf8');
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': cuerpo.length,
    'cache-control': 'no-store',
  });
  res.end(cuerpo);
}

async function enviarFichero(req, res, abs, modoCache = 'vivo') {
  const st = await estatDe(abs);
  if (!st) return false;

  const etag = etiqueta(st);
  const cabeceras = {
    'content-type': tipoMime(abs),
    'content-length': st.size,
    'cache-control': CACHE[modoCache] || CACHE.vivo,
    'last-modified': st.mtime.toUTCString(),
    etag,
  };

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { etag, 'cache-control': cabeceras['cache-control'] });
    res.end();
    return true;
  }

  if (req.method === 'HEAD') {
    res.writeHead(200, cabeceras);
    res.end();
    return true;
  }

  res.writeHead(200, cabeceras);
  const flujo = createReadStream(abs);
  flujo.on('error', () => res.destroy());
  res.on('close', () => flujo.destroy());
  flujo.pipe(res);
  return true;
}

function normalizarRuta(crudo) {
  let ruta;
  try {
    ruta = decodeURIComponent(new URL(crudo, 'http://local').pathname);
  } catch {
    return null;
  }
  if (ruta.includes('\0')) return null;
  // normalizamos separadores y colapsamos «..» de forma segura
  const partes = [];
  for (const seg of ruta.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { partes.pop(); continue; }
    partes.push(seg);
  }
  const final = `/${partes.join('/')}`;
  return ruta.endsWith('/') && final !== '/' ? `${final}/` : final;
}

// ── cuerpo de petición ───────────────────────────────────────────────────────
const CUERPO_MAX = 8 * 1024 * 1024; // 8 MiB: dos cadenas + 34 wires caben de sobra

async function leerCuerpo(req) {
  const trozos = [];
  let n = 0;
  for await (const t of req) {
    n += t.length;
    if (n > CUERPO_MAX) {
      const err = new Error(`cuerpo > ${CUERPO_MAX} bytes`);
      err.codigo = 413;
      throw err;
    }
    trozos.push(t);
  }
  return Buffer.concat(trozos).toString('utf8');
}

async function leerJson(req) {
  const crudo = await leerCuerpo(req);
  if (!crudo.trim()) {
    const err = new Error('cuerpo vacío: se esperaba JSON');
    err.codigo = 400;
    throw err;
  }
  try {
    return JSON.parse(crudo);
  } catch (e) {
    const err = new Error(`JSON inválido: ${e.message}`);
    err.codigo = 400;
    throw err;
  }
}

// ── GET /onfalo/index.json ───────────────────────────────────────────────────
// Índice REAL: lista lo que hay en disco y recomputa su sha256 para
// contrastarlo con el sello del manifiesto importado del playground
// (fixtures/onfalo/source.manifest.json, modo «import-once»). El veredicto
// `sellado` no se declara: se calcula.
async function indiceOnfalo() {
  /** @type {{pieces?: Array<{id:string, sourceRelativePath?:string, relativePath?:string, sha256?:string, size?:number, mediaType?:string}>, seal?:object, simulacro?:object, logicalRepo?:string, logicalPath?:string}} */
  let manifiesto = {};
  let manifiestoPresente = false;
  try {
    manifiesto = JSON.parse(await fs.readFile(ONFALO_MANIFIESTO, 'utf8'));
    manifiestoPresente = true;
  } catch {
    manifiesto = {};
  }

  const selladoPorFichero = new Map();
  for (const p of manifiesto.pieces ?? []) {
    const base = path.basename(p.sourceRelativePath || p.relativePath || `${p.id}.md`);
    selladoPorFichero.set(base, p);
  }

  let entradas = [];
  try {
    entradas = await fs.readdir(ONFALO);
  } catch {
    entradas = [];
  }

  const piezas = [];
  for (const nombre of entradas.sort()) {
    if (!nombre.toLowerCase().endsWith('.md')) continue;
    if (nombre === 'SOURCE.md') continue; // nota de procedencia, no pieza
    const abs = path.join(ONFALO, nombre);
    const st = await estatDe(abs);
    if (!st) continue;

    const bytes = await fs.readFile(abs);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const texto = bytes.toString('utf8');
    const primeraLinea = texto.split('\n').find((l) => l.trim().startsWith('# '));
    const declarado = selladoPorFichero.get(nombre) ?? null;
    const id = declarado?.id ?? nombre.replace(/\.md$/i, '');

    piezas.push({
      id,
      urn: `urn:onfalo:${id}`,
      fichero: nombre,
      url: `/onfalo/${encodeURIComponent(nombre)}`,
      titulo: primeraLinea ? primeraLinea.replace(/^#\s+/, '').trim() : id,
      mediaType: declarado?.mediaType ?? 'text/markdown',
      bytes: st.size,
      lineas: texto.split('\n').length,
      sha256,
      // el sello NO se copia del manifiesto: se compara con lo recomputado
      sellado: declarado ? declarado.sha256 === sha256 : null,
      selloDeclarado: declarado?.sha256 ?? null,
      enManifiesto: Boolean(declarado),
    });
  }

  const conSello = piezas.filter((p) => p.enManifiesto);
  const todasSelladas = conSello.length > 0 && conSello.every((p) => p.sellado === true);

  return {
    kind: 'onfalo-index',
    version: '1.0.0',
    ruta: '/onfalo/',
    piezas,
    cuenta: piezas.length,
    manifiesto: {
      presente: manifiestoPresente,
      fichero: manifiestoPresente ? '/onfalo/source.manifest.json' : null,
      logicalRepo: manifiesto.logicalRepo ?? null,
      logicalPath: manifiesto.logicalPath ?? null,
      pieceCount: manifiesto.pieceCount ?? null,
      seal: manifiesto.seal ?? null,
      simulacro: manifiesto.simulacro ?? null,
    },
    // veredicto calculado, no declarado
    veredicto: {
      selloRecomputado: true,
      todasSelladas,
      sinManifiesto: piezas.filter((p) => !p.enManifiesto).map((p) => p.fichero),
    },
    nota: manifiestoPresente
      ? 'sha256 de cada pieza recomputado en el server y contrastado con el sello import-once.'
      : 'sin source.manifest.json: se lista lo que hay y se publica su sha256, pero NO hay sello contra el que contrastar.',
  };
}

// ── motor de digests para /api/verificar ─────────────────────────────────────
// Preferencia 1: el código REAL del playground (única fuente de verdad del
// esquema DIC-4). No está publicado en npm, así que se carga por ruta si el
// checkout existe. Preferencia 2: reimplementación local del MISMO algoritmo,
// declarada como tal en la respuesta.
export const RAIZ_PLAYGROUND = process.env.HM_PLAYGROUND
  || 'C:/S/scriptorium/playground/prueba-de-H-M';

// Marcas del observador — raíz de confianza citada literalmente de
// playground/prueba-de-H-M/lib/ceremonia/constants.mjs (líneas 185 y 188).
const CAUSAL_STRIPPED_FIELDS = Object.freeze(['actor', 'digest']);
const CAUSAL_STRIPPED_CONTEXT_FIELDS = Object.freeze(['side']);

/** Copia local de lib/cadena/hash.mjs::stableStringify (claves ordenadas). */
function stableStringifyLocal(valor) {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(stableStringifyLocal).join(',')}]`;
  const claves = Object.keys(valor).sort();
  return `{${claves.map((k) => `${JSON.stringify(k)}:${stableStringifyLocal(valor[k])}`).join(',')}}`;
}

/** Copia local de lib/cadena/hash.mjs::digestObject. */
function digestObjectLocal(valor) {
  return `sha256:${createHash('sha256').update(stableStringifyLocal(valor), 'utf8').digest('hex')}`;
}

/** Copia local de lib/ceremonia/envelope.mjs::causalCore (denylist, no allowlist). */
function causalCoreLocal(envelope) {
  const core = {};
  for (const [k, v] of Object.entries(envelope)) {
    if (CAUSAL_STRIPPED_FIELDS.includes(k)) continue;
    core[k] = v;
  }
  core.id = String(envelope.id).replace(/:(H|M)$/, '');
  core.target = envelope.target ?? null;
  core.provenance = {
    ...(envelope.provenance ?? {}),
    source: envelope.provenance?.source ?? null,
    upstream: [...(envelope.provenance?.upstream ?? [])],
  };
  if (envelope.context != null && typeof envelope.context === 'object') {
    const ctx = {};
    for (const [k, v] of Object.entries(envelope.context)) {
      if (CAUSAL_STRIPPED_CONTEXT_FIELDS.includes(k)) continue;
      ctx[k] = v;
    }
    core.context = ctx;
  }
  return core;
}

let motorPrometido = null;

export function cargarMotorDigests() {
  if (motorPrometido) return motorPrometido;
  motorPrometido = (async () => {
    const libHash = path.join(RAIZ_PLAYGROUND, 'lib', 'cadena', 'hash.mjs');
    const libEnv = path.join(RAIZ_PLAYGROUND, 'lib', 'ceremonia', 'envelope.mjs');
    if (existeSync(libHash) && existeSync(libEnv)) {
      try {
        const hash = await import(pathToFileURL(libHash).href);
        const env = await import(pathToFileURL(libEnv).href);
        if (typeof hash.digestObject === 'function' && typeof env.causalDigest === 'function') {
          return {
            nombre: 'playground-real',
            origen: RAIZ_PLAYGROUND,
            digestObject: hash.digestObject,
            causalDigest: env.causalDigest,
            nota: 'digests calculados con lib/cadena/hash.mjs y lib/ceremonia/envelope.mjs del playground (código real, sin copiar).',
          };
        }
      } catch {
        // cae a la reimplementación local; el motivo se publica abajo
      }
    }
    return {
      nombre: 'reimplementacion-local',
      origen: null,
      digestObject: digestObjectLocal,
      causalDigest: (envelope) => digestObjectLocal(causalCoreLocal(envelope)),
      nota: 'el playground no está publicado en npm ni presente en disco: se recomputa con una copia local del MISMO algoritmo (sha256 sobre stableStringify de claves ordenadas), citada en el código.',
    };
  })();
  return motorPrometido;
}

// ── POST /api/verificar ──────────────────────────────────────────────────────
const RE_DIGEST = /^sha256:[0-9a-f]{64}$/;
const RE_ID = /^(.*):step:(\d+):([^:]+?)(:sec)?:(H|M)$/;

function filasDeCadena(entrada, lado) {
  if (entrada == null) return { filas: [], error: `falta la cadena ${lado}` };
  const crudas = Array.isArray(entrada)
    ? entrada
    : String(entrada)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        try {
          return JSON.parse(l);
        } catch (e) {
          return { __error: `${lado} línea ${i + 1}: NDJSON inválido (${e.message})` };
        }
      });
  const malas = crudas.filter((f) => f && f.__error).map((f) => f.__error);
  if (malas.length) return { filas: [], error: malas[0] };
  return { filas: crudas, error: null };
}

/**
 * Re-verifica dos cadenas chain.ndjson (H y M).
 *
 * Lo que se puede comprobar SOLO con las cadenas (invariantes DIC-4, los
 * mismos que exige lib/verificador/verificar.mjs::validateBilateralCausal):
 *   · forma de cada fila y de cada digest
 *   · el activityId codifica paso/verbo/lado y ha de concordar con la fila
 *   · todas las filas son de la MISMA corrida
 *   · biyección de parejas: cada paso tiene su H y su M, sin duplicados
 *   · causalDigest H ≡ M   (el hecho es compartido)
 *   · wireDigest  H ≢ M    (el observador no lo es)
 *
 * Lo que NO se puede: recomputar los digests. Una fila de chain.ndjson no
 * contiene el envelope, así que su digest no es derivable de ella. Por eso
 * `actividades` es opcional: si el cliente manda los wires sellados, se
 * recomputan de verdad y `recomputado` pasa a true; si no, se dice que no.
 *
 * @param {{H?:unknown, M?:unknown, actividades?:unknown[]}} peticion
 */
export async function verificarCadenas(peticion) {
  const motor = await cargarMotorDigests();
  const comprobaciones = [];
  const fallos = [];
  const anotar = (nombre, ok, detalle) => {
    comprobaciones.push({ nombre, ok, detalle });
    if (!ok) fallos.push({ comprobacion: nombre, detalle });
    return ok;
  };

  const h = filasDeCadena(peticion?.H, 'H');
  const m = filasDeCadena(peticion?.M, 'M');
  if (h.error || m.error) {
    anotar('cadenas_legibles', false, h.error || m.error);
    return {
      ok: false,
      veredicto: 'fail',
      motor: { nombre: motor.nombre, origen: motor.origen, nota: motor.nota },
      recomputado: false,
      comprobaciones,
      fallos,
    };
  }
  anotar('cadenas_legibles', true, `H=${h.filas.length} filas · M=${m.filas.length} filas`);

  // ── forma de las filas ─────────────────────────────────────────────────
  const todas = [...h.filas.map((f) => ({ f, lado: 'H' })), ...m.filas.map((f) => ({ f, lado: 'M' }))];
  const problemasForma = [];
  for (const { f, lado } of todas) {
    const q = f && typeof f === 'object' ? f : null;
    if (!q) { problemasForma.push(`${lado}: fila no es objeto`); continue; }
    if (!Number.isInteger(q.step)) problemasForma.push(`${lado}#${q.activityId ?? '?'}: step no entero`);
    if (typeof q.verb !== 'string' || !q.verb) problemasForma.push(`${lado}#${q.activityId ?? '?'}: verb vacío`);
    if (typeof q.object !== 'string' || !q.object) problemasForma.push(`${lado}#${q.activityId ?? '?'}: object vacío`);
    if (!RE_DIGEST.test(String(q.causalDigest))) problemasForma.push(`${lado}#${q.activityId ?? '?'}: causalDigest no es sha256:<64hex>`);
    if (!RE_DIGEST.test(String(q.wireDigest))) problemasForma.push(`${lado}#${q.activityId ?? '?'}: wireDigest no es sha256:<64hex>`);
    if (typeof q.activityId !== 'string' || !q.activityId) problemasForma.push(`${lado}: activityId vacío`);
    if (q.side !== 'H' && q.side !== 'M') problemasForma.push(`${lado}#${q.activityId ?? '?'}: side=${q.side}`);
    if (q.side && q.side !== lado) problemasForma.push(`${q.activityId ?? '?'}: fila con side=${q.side} dentro de la cadena ${lado}`);
  }
  anotar('forma_filas', problemasForma.length === 0, problemasForma.slice(0, 5).join(' · ') || `${todas.length} filas bien formadas`);

  // ── activityId: <prefijo>:step:<orden>:<verbo>[:sec]:<lado> ─────────────
  const prefijos = new Set();
  const problemasId = [];
  /** @type {Map<string, {H?:object, M?:object, clave:string}>} */
  const parejas = new Map();

  for (const { f, lado } of todas) {
    const id = String(f?.activityId ?? '');
    const mm = RE_ID.exec(id);
    if (!mm) { problemasId.push(`${id || '(vacío)'}: no sigue <prefijo>:step:<orden>:<verbo>[:sec]:<H|M>`); continue; }
    const [, prefijo, ordenCrudo, verboDelId, marcaSec, ladoDelId] = mm;
    prefijos.add(prefijo);
    if (ladoDelId !== lado) problemasId.push(`${id}: sufijo de lado ≠ cadena ${lado}`);
    if (f.verb !== verboDelId) problemasId.push(`${id}: verb=${f.verb} ≠ ${verboDelId} del id`);
    if (Number(ordenCrudo) !== f.step) problemasId.push(`${id}: step=${f.step} ≠ ${ordenCrudo} del id`);
    const secundario = Boolean(marcaSec) || f.secondary === true;
    if (Boolean(marcaSec) !== (f.secondary === true)) {
      problemasId.push(`${id}: marca «:sec» del id ≠ campo secondary=${f.secondary}`);
    }
    const baseId = id.replace(/:(H|M)$/, '');
    const clave = `${f.step}|${f.verb}|${secundario ? 'sec' : 'pri'}`;
    const hueco = parejas.get(baseId) ?? { clave };
    if (hueco[lado]) problemasId.push(`${baseId}: dos filas para el lado ${lado}`);
    hueco[lado] = f;
    hueco.clave = clave;
    parejas.set(baseId, hueco);
  }
  anotar('id_bilateral', problemasId.length === 0, problemasId.slice(0, 5).join(' · ') || `${parejas.size} ids consistentes`);
  anotar(
    'misma_corrida',
    prefijos.size === 1,
    prefijos.size === 1 ? `prefijo único: ${[...prefijos][0]}` : `${prefijos.size} prefijos distintos: ${[...prefijos].slice(0, 3).join(', ')}`,
  );
  const runId = prefijos.size === 1 ? [...prefijos][0].split(':').pop() : null;

  // ── biyección de parejas + invariantes bilaterales ─────────────────────
  const incompletas = [];
  const causalDiverge = [];
  const wireIgual = [];
  const clavesVistas = new Map();
  const duplicadas = [];

  for (const [baseId, hueco] of parejas) {
    if (!hueco.H || !hueco.M) { incompletas.push(`${baseId}: H=${!!hueco.H} M=${!!hueco.M}`); continue; }
    if (hueco.H.causalDigest !== hueco.M.causalDigest) {
      causalDiverge.push(`${baseId}: ${hueco.H.causalDigest} ≠ ${hueco.M.causalDigest}`);
    }
    if (hueco.H.wireDigest === hueco.M.wireDigest) {
      wireIgual.push(`${baseId}: ambas mitades con el mismo wireDigest`);
    }
    if (clavesVistas.has(hueco.clave)) duplicadas.push(`${hueco.clave}: ${clavesVistas.get(hueco.clave)} y ${baseId}`);
    else clavesVistas.set(hueco.clave, baseId);
  }

  anotar('parejas_completas', incompletas.length === 0, incompletas.slice(0, 5).join(' · ') || `${parejas.size} parejas H·M completas`);
  anotar('sin_duplicados', duplicadas.length === 0, duplicadas.slice(0, 5).join(' · ') || `${clavesVistas.size} claves paso|verbo|sec únicas`);
  anotar(
    'causal_bilateral',
    causalDiverge.length === 0,
    causalDiverge.slice(0, 5).join(' · ') || 'causalDigest H ≡ M en todas las parejas (el hecho es compartido)',
  );
  anotar(
    'wire_divergente',
    wireIgual.length === 0,
    wireIgual.slice(0, 5).join(' · ') || 'wireDigest H ≢ M en todas las parejas (el observador no es compartido)',
  );

  // ── recomputación real (solo si vienen los wires sellados) ─────────────
  const actividades = Array.isArray(peticion?.actividades) ? peticion.actividades : null;
  let recomputado = false;

  if (actividades && actividades.length > 0) {
    const malWire = [];
    const malCausal = [];
    const sinFila = [];
    const porId = new Map();
    for (const { f } of todas) porId.set(String(f?.activityId ?? ''), f);

    for (const wire of actividades) {
      if (!wire || typeof wire !== 'object') { malWire.push('actividad no es objeto'); continue; }
      const { digest, ...sinDigest } = wire;
      const esperadoWire = motor.digestObject(sinDigest);
      if (digest !== esperadoWire) {
        malWire.push(`${wire.id}: digest=${digest} recomputado=${esperadoWire}`);
      }
      const esperadoCausal = motor.causalDigest(wire);
      const fila = porId.get(String(wire.id));
      if (!fila) { sinFila.push(`${wire.id}: wire sin fila en las cadenas`); continue; }
      if (fila.wireDigest !== esperadoWire) {
        malWire.push(`${wire.id}: chain.wireDigest=${fila.wireDigest} recomputado=${esperadoWire}`);
      }
      if (fila.causalDigest !== esperadoCausal) {
        malCausal.push(`${wire.id}: chain.causalDigest=${fila.causalDigest} recomputado=${esperadoCausal}`);
      }
    }

    const huerfanas = [...porId.keys()].filter((id) => !actividades.some((w) => String(w?.id) === id));
    anotar('wire_recomputado', malWire.length === 0, malWire.slice(0, 5).join(' · ') || `${actividades.length} wires con digest recomputado idéntico`);
    anotar('causal_recomputado', malCausal.length === 0, malCausal.slice(0, 5).join(' · ') || `${actividades.length} núcleos causales recomputados idénticos`);
    anotar('biyeccion_wires_cadena', sinFila.length === 0 && huerfanas.length === 0,
      [...sinFila, ...huerfanas.map((id) => `${id}: fila sin wire que la respalde`)].slice(0, 5).join(' · ')
      || 'cada fila tiene su wire y cada wire su fila');
    recomputado = true;
  } else {
    comprobaciones.push({
      nombre: 'digests_recomputados',
      ok: null,
      detalle: 'NO EJECUTADA · una fila de chain.ndjson no contiene el envelope, '
        + 'así que sus digests no son derivables de ella. Manda `actividades` '
        + '(los wire sellados) y se recomputan de verdad.',
    });
  }

  const ok = fallos.length === 0;
  return {
    ok,
    veredicto: ok ? 'pass' : 'fail',
    runId,
    motor: { nombre: motor.nombre, origen: motor.origen, nota: motor.nota },
    recomputado,
    filas: { H: h.filas.length, M: m.filas.length },
    parejas: parejas.size,
    comprobaciones,
    fallos,
    frontera: {
      real: recomputado
        ? 'digests recomputados desde los wires + invariantes bilaterales DIC-4'
        : 'invariantes bilaterales DIC-4 sobre las cadenas (forma, biyección, causal H≡M, wire H≢M)',
      pendiente: recomputado
        ? []
        : ['recomputación de digests: requiere `actividades` (wires sellados); la cadena sola no los contiene'],
    },
  };
}

// ── POST /api/acta ───────────────────────────────────────────────────────────
// `huellaLedger` y `emitirActa` REALES de @zeus/ciudad/acta. Viven en el server
// porque acta.mjs usa node:crypto. La validación de forma la hace el propio
// paquete (`emitirActa` lanza «shape_invalido»); aquí solo se traduce a HTTP.
export function emitirActaDesdePeticion(cuerpo) {
  const c = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};

  // La huella se calcula sobre el evento del cliente; si manda una huella ya
  // hecha se acepta, pero se recomputa y se dice si coincide.
  const tieneEvento = Object.prototype.hasOwnProperty.call(c, 'evento');
  const huellaCalculada = tieneEvento ? huellaLedger(c.evento) : null;
  const huellaFinal = huellaCalculada ?? (typeof c.huellaLedger === 'string' ? c.huellaLedger : null);

  if (!huellaFinal) {
    const err = new Error('falta `evento` (se le calcula la huella) o `huellaLedger`');
    err.codigo = 422;
    throw err;
  }

  let acta;
  try {
    acta = emitirActa({
      barrioId: c.barrioId,
      estado: c.estado,
      resumen: c.resumen,
      pendientes: c.pendientes,
      ultimaClase: c.ultimaClase,
      tickEmision: c.tickEmision,
      huellaLedger: huellaFinal,
    });
  } catch (e) {
    const err = new Error(
      `${e.message} · estado ∈ [${ACTA_ESTADOS.join('|')}] · ultimaClase ∈ [${ACTA_CLASES.join('|')}] `
      + `· resumen ≤ ${RESUMEN_MAX} · tickEmision entero · barrioId no vacío`,
    );
    err.codigo = 422;
    throw err;
  }

  return {
    ok: true,
    acta,
    // el paquete valida su propio producto: no lo afirmamos nosotros
    valida: isActaDeBarrioShaped(acta),
    huella: {
      valor: huellaFinal,
      recomputada: Boolean(huellaCalculada),
      coincideConLaDeclarada:
        typeof c.huellaLedger === 'string' && huellaCalculada !== null
          ? c.huellaLedger === huellaCalculada
          : null,
    },
    // entrada de ledger con la forma que `actaDesdeEntry`/`adoptarActaDesdePlaza`
    // del propio paquete saben leer: el viaje de vuelta cierra.
    ledgerEntry: { kind: LEDGER_ACTA, detail: { acta } },
    real: {
      paquete: '@zeus/ciudad/acta',
      funciones: ['huellaLedger', 'emitirActa', 'isActaDeBarrioShaped'],
      version: ACTA_VERSION,
      motivo: 'acta.mjs usa node:crypto — por eso la notaría vive en el server y no en el navegador',
    },
  };
}

// ── manejador ────────────────────────────────────────────────────────────────
export async function manejar(req, res) {
  const ruta = normalizarRuta(req.url || '/');
  if (ruta === null) return responderTexto(res, 400, '400 · ruta inválida');

  // ── endpoints node (POST) ──────────────────────────────────────────────
  const ENDPOINTS_POST = {
    '/api/acta': async () => emitirActaDesdePeticion(await leerJson(req)),
    '/api/verificar': async () => verificarCadenas(await leerJson(req)),
  };

  if (Object.prototype.hasOwnProperty.call(ENDPOINTS_POST, ruta)) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { allow: 'POST, OPTIONS', 'cache-control': 'no-store' });
      return res.end();
    }
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST, OPTIONS');
      return responderTexto(res, 405, `405 · ${ruta} es POST (recibido ${req.method})`);
    }
    try {
      const dato = await ENDPOINTS_POST[ruta]();
      // el veredicto no cambia el código HTTP: un «fail» honesto es un 200 que
      // dice fail, no un error de transporte.
      return responderJson(res, 200, dato);
    } catch (err) {
      const codigo = Number(err?.codigo) || 400;
      return responderJson(res, codigo, { ok: false, error: err?.message || 'error', ruta });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD');
    return responderTexto(res, 405, '405 · método no permitido');
  }

  // índice del Ónfalo — antes del montaje /onfalo/, que no lo tiene en disco
  if (ruta === '/onfalo/index.json') {
    return responderJson(res, 200, await indiceOnfalo());
  }

  // salud: útil para el humo y para saber qué montajes faltan
  if (ruta === '/salud') {
    const motor = await cargarMotorDigests();
    return responderJson(res, 200, {
      ok: true,
      demo: 'Prueba de H·M — El Descenso',
      nodeModules: NODE_MODULES,
      montajes: MONTAJES.map((m) => ({ url: m.url, disco: m.disco, presente: existeSync(m.disco) })),
      mapa: { url: '/mapa.json', disco: MAPA, presente: existeSync(MAPA) },
      onfalo: {
        url: '/onfalo/',
        indice: '/onfalo/index.json',
        disco: ONFALO,
        presente: existeSync(ONFALO),
        manifiesto: existeSync(ONFALO_MANIFIESTO),
      },
      endpoints: [
        { metodo: 'GET', url: '/onfalo/index.json', real: 'sha256 recomputado en node + sello import-once' },
        { metodo: 'POST', url: '/api/acta', real: '@zeus/ciudad/acta · emitirActa + huellaLedger' },
        { metodo: 'POST', url: '/api/verificar', real: `digests DIC-4 · motor «${motor.nombre}»` },
      ],
      motorDigests: { nombre: motor.nombre, origen: motor.origen, nota: motor.nota },
      // La frontera es producto: se publica, no se esconde.
      frontera: {
        real: [
          '@zeus/ciudad/acta (node:crypto) tras POST /api/acta',
          '@zeus/ciudad/domain + /scene servidos en /zeus-ciudad/ (browser-safe salvo acta.mjs)',
          '@zeus/protocol servido en /zeus-protocol/ (src/index.mjs, sin node: en su grafo)',
        ],
        polyfill: [
          'node:crypto en el navegador → /shim/node-crypto.mjs (SHA-256 FIPS 180-4, '
          + 'huella idéntica y autoverificada; existe porque @zeus/ciudad/acta lo importa '
          + 'y sin él no carga @zeus/ciudad/domain). Re-verificable por /api/acta y /api/verificar.',
          'node:child_process en el navegador → /shim/node-child-process.mjs (TAPÓN: no '
          + 'implementa nada y lanza con motivo; existe porque domain.mjs → edificios.mjs → '
          + 'salud.mjs lo importa, aunque solo se consumen constantes congeladas).',
        ],
        pendiente: [
          'probes de salud de @zeus/ciudad/salud (npm-view · http-status · smoke): '
          + 'necesitan spawn; el navegador no tiene procesos hijo. Corren en node o no corren.',
          'lengua candidato: no publicada en canal',
          'rooms server: no levantado por esta demo',
          'ceremonia real de la Future Machine: el playground declara «no corre hoy» (spike WP-HUB-112)',
        ],
      },
    });
  }

  // ficheros sueltos (mapa.json)
  const suelto = FICHEROS_SUELTOS.get(ruta);
  if (suelto) {
    if (await enviarFichero(req, res, suelto, 'vivo')) return undefined;
    return responderTexto(res, 404, `404 · no encontrado: ${ruta}`);
  }

  // montajes de node_modules
  for (const montaje of MONTAJES) {
    if (!ruta.startsWith(montaje.url)) continue;
    const rel = ruta.slice(montaje.url.length);
    const abs = path.resolve(montaje.disco, rel);
    if (!dentro(montaje.disco, abs)) return responderTexto(res, 403, '403 · fuera del montaje');
    if (await enviarFichero(req, res, abs, montaje.cache)) return undefined;
    return responderTexto(res, 404, `404 · no encontrado en ${montaje.url}: ${rel}`);
  }

  // estáticos de public/
  // «/» y «/lo-que-sea/» resuelven al index.html correspondiente
  const relPub = ruta.endsWith('/')
    ? `${ruta.replace(/^\/+/, '')}index.html`
    : ruta.replace(/^\/+/, '');
  const abs = path.resolve(PUBLICO, relPub);
  if (!dentro(PUBLICO, abs)) return responderTexto(res, 403, '403 · fuera de public/');

  if (await enviarFichero(req, res, abs, 'vivo')) return undefined;

  // sin extensión → devolvemos el shell (una sola página)
  if (!path.extname(abs)) {
    if (await enviarFichero(req, res, path.join(PUBLICO, 'index.html'), 'vivo')) return undefined;
  }

  return responderTexto(res, 404, `404 · no encontrado: ${ruta}`);
}

// ── servidor ─────────────────────────────────────────────────────────────────
export function crearServidor() {
  return http.createServer((req, res) => {
    const t0 = process.hrtime.bigint();
    res.on('finish', () => {
      if (process.env.SILENCIO === '1') return;
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      const marca = res.statusCode >= 400 ? '✗' : '·';
      console.log(`${marca} ${res.statusCode} ${req.method} ${req.url}  ${ms.toFixed(1)} ms`);
    });
    manejar(req, res).catch((err) => {
      console.error('✗ error interno:', err && err.message);
      if (!res.headersSent) responderTexto(res, 500, '500 · error interno');
      else res.destroy();
    });
  });
}

export async function iniciar({ puerto, host = HOST_POR_DEFECTO } = {}) {
  const p = Number(puerto ?? process.env.PUERTO ?? PUERTO_POR_DEFECTO);
  const servidor = crearServidor();

  await new Promise((resolve, reject) => {
    const alFallar = (err) => {
      if (err && err.code === 'EADDRINUSE') {
        reject(new Error(`El puerto ${p} ya está ocupado. Prueba con PUERTO=${p + 1}.`));
      } else reject(err);
    };
    servidor.once('error', alFallar);
    servidor.listen(p, host, () => {
      servidor.removeListener('error', alFallar);
      resolve();
    });
  });

  const url = `http://${host}:${p}/`;
  return {
    servidor,
    puerto: p,
    host,
    url,
    cerrar: () => new Promise((resolve) => servidor.close(() => resolve())),
  };
}

// ── arranque directo ─────────────────────────────────────────────────────────
const ejecutadoDirecto = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (ejecutadoDirecto) {
  iniciar()
    .then(async ({ url, cerrar }) => {
      console.log('');
      console.log('  Prueba de H·M — El Descenso');
      console.log(`  escuchando en  ${url}`);
      console.log(`  node_modules   ${NODE_MODULES}`);
      for (const m of MONTAJES) {
        console.log(`  ${existeSync(m.disco) ? '✓' : '·'} ${m.url.padEnd(26)} ${m.disco}`);
      }
      console.log(`  ${existeSync(MAPA) ? '✓' : '·'} ${'/mapa.json'.padEnd(26)} ${MAPA}`);
      console.log('');
      const motor = await cargarMotorDigests();
      console.log('  endpoints node (mecanismo real):');
      console.log(`    GET  ${'/onfalo/index.json'.padEnd(20)} sello sha256 recomputado`);
      console.log(`    POST ${'/api/acta'.padEnd(20)} @zeus/ciudad/acta · emitirActa + huellaLedger`);
      console.log(`    POST ${'/api/verificar'.padEnd(20)} digests DIC-4 · motor «${motor.nombre}»`);
      if (motor.nombre !== 'playground-real') {
        console.log(`         ↳ ${motor.nota}`);
      }
      console.log('');
      const adios = async () => { await cerrar(); process.exit(0); };
      process.on('SIGINT', adios);
      process.on('SIGTERM', adios);
    })
    .catch((err) => {
      console.error(`No se pudo arrancar: ${err.message}`);
      process.exit(1);
    });
}
