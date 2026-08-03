/**
 * ceremonia/puente-zeus.mjs — puente de navegador para los paquetes @zeus reales.
 *
 * POR QUÉ EXISTE (verificado contra node_modules, R2)
 * ---------------------------------------------------------------------------
 * El brief daba `@zeus/ciudad/domain` por «browser-safe». Leído el paquete
 * (v0.1.1) NO lo es de forma transitiva:
 *
 *   src/domain.mjs
 *     ├─ ./acta.mjs       → import { createHash } from 'node:crypto'
 *     └─ ./edificios.mjs  → ./salud.mjs → import { spawn } from 'node:child_process'
 *
 * El resto del grafo sí lo es: contract · jugadores · presencia · scene y todo
 * `@zeus/protocol` (index.mjs se declara y comprueba «browser-safe, sin imports
 * de Node»). Es decir: el dominio real es puro; sólo dos especificadores de
 * Node bloquean su carga nativa en el navegador.
 *
 * Este puente carga el CÓDIGO REAL, sin tocar un byte de la lógica: baja los
 * ficheros por HTTP desde los montajes `/zeus-ciudad/` y `/zeus-protocol/`,
 * reescribe SÓLO los especificadores (relativos → blob del módulo ya cargado,
 * `node:crypto` / `node:child_process` → shim declarado) y los instancia como
 * módulos blob. Ningún cuerpo de función se reescribe.
 *
 *   · `node:crypto`        → shim con SHA-256 síncrono en JS (mismos digests
 *                            que OpenSSL; auto-test con vector conocido).
 *   · `node:child_process` → shim que LANZA si alguien llama a `spawn`.
 *                            `salud.mjs` sólo aporta constantes al grafo, así
 *                            que nunca se llama; si se llamara, se vería.
 *
 * Se intenta antes la vía limpia (`import('@zeus/ciudad/domain')` por import
 * map). Si el import map llegara a mapear también `node:crypto`, esa vía gana
 * y el puente no se usa.
 *
 * Sin dependencias, sin build, ES modules puros.
 */

/* ── rutas de montaje (las monta server.mjs; aquí sólo se consumen) ───────── */

export const BASE_CIUDAD = '/zeus-ciudad/';
export const BASE_PROTOCOL = '/zeus-protocol/';

/** Candidatos de entrada de @zeus/protocol (según cómo se monte el paquete). */
const ENTRADAS_PROTOCOL = Object.freeze([
  BASE_PROTOCOL + 'src/index.mjs',
  BASE_PROTOCOL + 'index.mjs'
]);

/**
 * Raíz para resolver rutas. `new URL('./x.mjs', '/a/b.mjs')` lanza: la base ha
 * de ser absoluta, así que los montajes se anclan al origen del documento.
 */
const RAIZ = (globalThis.location && globalThis.location.origin)
  ? `${globalThis.location.origin}/`
  : 'http://hm.local/';

const absoluta = (u) => new URL(u, RAIZ).href;

/* ══════════════════════════════════════════════════════════════════════════
   SHA-256 síncrono — el shim de `node:crypto` lo necesita síncrono
   (crypto.subtle.digest es asíncrono y `createHash().digest()` no lo es).
   Implementación estándar FIPS 180-4; salida idéntica a node.
   ══════════════════════════════════════════════════════════════════════════ */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const CODIFICADOR = typeof TextEncoder === 'function' ? new TextEncoder() : null;

/** UTF-8 sin TextEncoder (contextos raros): mismo resultado, más lento. */
function utf8Bytes(texto) {
  if (CODIFICADOR) return CODIFICADOR.encode(texto);
  const crudo = unescape(encodeURIComponent(String(texto)));
  const out = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i++) out[i] = crudo.charCodeAt(i) & 0xff;
  return out;
}

/**
 * SHA-256 sobre bytes.
 * @param {Uint8Array} bytes
 * @returns {string} 64 hex
 */
export function sha256Bytes(bytes) {
  const largo = bytes.length;
  const conUno = largo + 1;
  const relleno = ((56 - (conUno % 64)) + 64) % 64;
  const total = conUno + relleno + 8;

  const m = new Uint8Array(total);
  m.set(bytes, 0);
  m[largo] = 0x80;

  const vista = new DataView(m.buffer);
  vista.setUint32(total - 8, Math.floor(largo / 536870912), false); // (largo*8) >> 32
  vista.setUint32(total - 4, (largo << 3) >>> 0, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const w = new Uint32Array(64);

  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = vista.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];

    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }

  let salida = '';
  for (let i = 0; i < 8; i++) salida += h[i].toString(16).padStart(8, '0');
  return salida;
}

/** SHA-256 de una cadena UTF-8. */
export function sha256Hex(texto) {
  return sha256Bytes(utf8Bytes(String(texto == null ? '' : texto)));
}

/** Vector conocido FIPS: si esto falla, nada de lo sellado vale. */
export const SHA256_AUTOTEST_OK = (
  sha256Hex('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  && sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
);

/**
 * Réplica mínima de `createHash` de node — sólo lo que usa `@zeus/ciudad/acta`:
 * `createHash('sha256').update(blob, 'utf8').digest('hex')`.
 * Cualquier otro algoritmo o formato lanza: no se finge soporte.
 */
export function createHashShim(algoritmo) {
  const alg = String(algoritmo || '').toLowerCase().replace(/-/g, '');
  if (alg !== 'sha256') {
    throw new Error(`puente-zeus: createHash('${algoritmo}') no está en el navegador (sólo sha256)`);
  }
  /** @type {Uint8Array[]} */
  const trozos = [];
  const hash = {
    update(dato) {
      if (typeof dato === 'string') trozos.push(utf8Bytes(dato));
      else if (dato instanceof Uint8Array) trozos.push(dato);
      else if (dato && dato.buffer) trozos.push(new Uint8Array(dato.buffer, dato.byteOffset, dato.byteLength));
      else trozos.push(utf8Bytes(String(dato)));
      return hash;
    },
    digest(formato = 'hex') {
      if (formato !== 'hex') {
        throw new Error(`puente-zeus: digest('${formato}') no soportado (sólo hex)`);
      }
      let n = 0;
      for (const t of trozos) n += t.length;
      const todo = new Uint8Array(n);
      let i = 0;
      for (const t of trozos) { todo.set(t, i); i += t.length; }
      return sha256Bytes(todo);
    }
  };
  return hash;
}

/* ══════════════════════════════════════════════════════════════════════════
   Cargador de módulos: código real, especificadores reescritos
   ══════════════════════════════════════════════════════════════════════════ */

const AQUI = import.meta.url;

const FUENTE_SHIM_CRYPTO = `// shim declarado de node:crypto (ver puente-zeus.mjs)
import { createHashShim } from ${JSON.stringify(AQUI)};
export function createHash(alg) { return createHashShim(alg); }
export default { createHash };
`;

const FUENTE_SHIM_CHILD = `// shim declarado de node:child_process (ver puente-zeus.mjs)
export function spawn() {
  throw new Error('puente-zeus: node:child_process.spawn no existe en el navegador; ' +
    '@zeus/ciudad/salud.mjs sólo aporta constantes al grafo del dominio.');
}
export default { spawn };
`;

/** Especificadores que no existen en el navegador → shim declarado. */
const SHIMS = new Map([
  ['node:crypto', FUENTE_SHIM_CRYPTO],
  ['node:child_process', FUENTE_SHIM_CHILD]
]);

/** `from '…'` y `import '…'` estáticos. `import('…')` (JSDoc) no casa: lleva paréntesis. */
const RE_ESPECIFICADOR = /\b(from|import)\s+(['"])([^'"\n]+)\2/g;

const urlsBlob = [];
function comoBlob(fuente) {
  const url = URL.createObjectURL(new Blob([fuente], { type: 'text/javascript' }));
  urlsBlob.push(url);
  return url;
}

/** Libera los blobs creados (la demo no lo necesita; útil para pruebas). */
export function liberarBlobs() {
  for (const u of urlsBlob.splice(0)) {
    try { URL.revokeObjectURL(u); } catch { /* ya liberado */ }
  }
}

/**
 * Baja un módulo real, reescribe sus especificadores y lo instancia como blob.
 * @param {string} url             URL absoluta del fichero real
 * @param {Map<string,Promise<string>>} cache  url → promesa de blob URL
 * @param {Map<string,string>} shimCache       specifier → blob URL del shim
 * @returns {Promise<string>} blob URL listo para `import()`
 */
function urlBlobDe(url, cache, shimCache) {
  const yaVa = cache.get(url);
  if (yaVa) return yaVa;

  const promesa = (async () => {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`puente-zeus: ${res.status} al bajar ${url}`);
    let fuente = await res.text();

    // 1 · recolectar especificadores (sin reescribir todavía)
    const vistos = new Set();
    for (const m of fuente.matchAll(RE_ESPECIFICADOR)) vistos.add(m[3]);

    // 2 · resolver cada uno a un blob (recursivo) o a un shim
    /** @type {Map<string,string>} */
    const destino = new Map();
    for (const spec of vistos) {
      if (SHIMS.has(spec)) {
        if (!shimCache.has(spec)) shimCache.set(spec, comoBlob(SHIMS.get(spec)));
        destino.set(spec, shimCache.get(spec));
        continue;
      }
      if (spec.startsWith('.')) {
        destino.set(spec, await urlBlobDe(new URL(spec, url).href, cache, shimCache));
        continue;
      }
      if (spec === '@zeus/protocol' || spec.startsWith('@zeus/protocol/')) {
        destino.set(spec, await urlBlobDe(await entradaProtocol(), cache, shimCache));
        continue;
      }
      throw new Error(`puente-zeus: especificador no previsto «${spec}» en ${url}`);
    }

    // 3 · reescribir sólo el literal del especificador
    fuente = fuente.replace(
      RE_ESPECIFICADOR,
      (todo, clave, comilla, spec) => (destino.has(spec)
        ? `${clave} ${JSON.stringify(destino.get(spec))}`
        : todo)
    );

    return comoBlob(fuente);
  })();

  cache.set(url, promesa);
  return promesa;
}

let entradaProtocolCache = null;
async function entradaProtocol() {
  if (entradaProtocolCache) return entradaProtocolCache;
  for (const candidato of ENTRADAS_PROTOCOL) {
    const url = absoluta(candidato);
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) { entradaProtocolCache = url; return url; }
    } catch { /* siguiente candidato */ }
  }
  throw new Error('puente-zeus: @zeus/protocol no está montado (/zeus-protocol/)');
}

/* ══════════════════════════════════════════════════════════════════════════
   API del puente
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Carga el dominio real de @zeus/ciudad en el navegador.
 *
 * @param {{forzarPuente?: boolean}} [opts] `forzarPuente` salta el intento por
 *        import map (diagnóstico: obliga a ejercitar el cargador con shims).
 * @returns {Promise<{
 *   via: 'import-map'|'puente',
 *   createCiudadDomainState: Function,
 *   makeIntent: Function,
 *   sceneFromGamemap: Function,
 *   nodesReachable: Function,
 *   BARRIO_ESTADOS: readonly string[],
 *   LOOP_DEFAULTS: object,
 *   GAME_ID: string,
 *   PLAYER_TYPES: readonly string[],
 *   featuresForPlayerType: Function,
 *   residenteActorId: Function,
 *   isActaDeBarrioShaped: Function,
 *   ACTA_ESTADOS: readonly string[],
 *   ACTA_CLASES: readonly string[]
 * }>}
 */
export async function cargarCiudadReal({ forzarPuente = false } = {}) {
  if (!SHA256_AUTOTEST_OK) {
    throw new Error('puente-zeus: el SHA-256 del navegador no pasa el vector conocido');
  }

  // Vía limpia: si el import map resolviera TODO (incluido node:crypto), gana.
  if (!forzarPuente) try {
    const [dom, con, sce, jug, act] = await Promise.all([
      import('@zeus/ciudad/domain'),
      import('@zeus/ciudad/contract'),
      import('@zeus/ciudad/scene'),
      import('@zeus/ciudad/jugadores'),
      import('@zeus/ciudad/acta')
    ]);
    return empaquetar('import-map', dom, con, sce, jug, act);
  } catch { /* esperado: node:crypto no se resuelve nativamente */ }

  const cache = new Map();
  const shimCache = new Map();
  const traer = async (fichero) => {
    const blob = await urlBlobDe(absoluta(BASE_CIUDAD + fichero), cache, shimCache);
    return import(/* @vite-ignore */ blob);
  };
  // En serie: el grafo comparte módulos (contract, jugadores) y así se
  // instancian una sola vez, sin carreras sobre la caché.
  const dom = await traer('domain.mjs');
  const con = await traer('contract.mjs');
  const sce = await traer('scene.mjs');
  const jug = await traer('jugadores.mjs');
  const act = await traer('acta.mjs');
  return empaquetar('puente', dom, con, sce, jug, act);
}

function empaquetar(via, dom, con, sce, jug, act) {
  return {
    via,
    createCiudadDomainState: dom.createCiudadDomainState,
    makeIntent: con.makeIntent,
    sceneFromGamemap: sce.sceneFromGamemap,
    nodesReachable: sce.nodesReachable,
    BARRIO_ESTADOS: con.BARRIO_ESTADOS,
    LOOP_DEFAULTS: con.LOOP_DEFAULTS,
    GAME_ID: con.GAME_ID,
    INTENTS: con.INTENTS,
    PLAYER_TYPES: jug.PLAYER_TYPES,
    featuresForPlayerType: jug.featuresForPlayerType,
    residenteActorId: jug.residenteActorId,
    isActaDeBarrioShaped: act.isActaDeBarrioShaped,
    ACTA_ESTADOS: act.ACTA_ESTADOS,
    ACTA_CLASES: act.ACTA_CLASES,
    ACTA_VERSION: act.ACTA_VERSION
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   mapa.json (24 barrios · 6 distritos) → gamemap {nodos, enlaces, anclas}
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Proyección literal, sin topología inventada:
 *   nodo `plaza`  ← el spawn que exige `SPAWN_NODE_ID` del contrato
 *   un nodo por DISTRITO real del mapa (6)
 *   una avenida bidireccional plaza↔distrito por cada distrito
 *   un ancla por BARRIO real (24), colgada de su distrito, con SU estado real
 *
 * `sceneFromGamemap` deriva de aquí los 24 barrios del dominio. Los estados
 * («vivo» 14 · «latente» 7 · «muerto» 3) son los del fichero, no una siembra.
 *
 * @param {object} mapa contenido de /mapa.json
 */
export function gamemapDesdeMapa(mapa) {
  if (!mapa || !Array.isArray(mapa.distritos) || !Array.isArray(mapa.barrios)) {
    throw new Error('gamemapDesdeMapa: el mapa necesita distritos[] y barrios[]');
  }

  const nodos = {
    plaza: { id: 'plaza', kind: 'plaza', displayName: 'Plaza · Ónfalo' }
  };
  const enlaces = {};

  for (const d of mapa.distritos) {
    nodos[d.id] = {
      id: d.id,
      kind: 'distrito',
      displayName: d.displayName || d.id,
      holonId: d.holonId || null
    };
    const eid = `avenida:plaza::${d.id}`;
    enlaces[eid] = { id: eid, from: 'plaza', to: d.id, bidirectional: true, kind: 'avenida' };
  }

  const anclas = {};
  for (const b of mapa.barrios) {
    const anchorId = anclaDeBarrio(b.id);
    anclas[anchorId] = {
      id: anchorId,
      parent: b.distrito,
      barrioId: b.id,
      slug: b.slug || b.id,
      displayName: b.displayName || b.id,
      estado: b.estado || 'latente',
      kind: 'barrio',
      holonId: b.holonId || null,
      handoffEdges: (b.grafo && b.grafo.handoffEdges) || 0
    };
  }

  return {
    id: mapa.kind || 'hm-mapa',
    sceneId: mapa.kind || 'hm-mapa',
    displayName: 'Scriptorium · ciudad de holones',
    version: mapa.version || null,
    nodos,
    enlaces,
    anclas
  };
}

/** Id de ancla estable para un barrio del mapa. */
export function anclaDeBarrio(barrioId) {
  return `ancla:${barrioId}`;
}
