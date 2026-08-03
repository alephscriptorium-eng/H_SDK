/**
 * node:crypto — polyfill de navegador, SOLO `createHash('sha256')`.
 *
 * POR QUÉ EXISTE (leer antes de juzgarlo)
 * ──────────────────────────────────────
 * `@zeus/ciudad/domain` (dominio puro del juego, el corazón del R2) importa
 * `./acta.mjs`, y `acta.mjs` línea 11 hace:
 *
 *     import { createHash } from 'node:crypto';
 *
 * Los imports se resuelven al cargar el grafo, no al usarse: sin una
 * resolución para `node:crypto` el navegador NO carga `@zeus/ciudad/domain`
 * en absoluto, aunque nadie llame a `emitirActa`. Y `domain.mjs` sí la llama
 * en camino normal (`huellaLedger` en sus líneas 164 y 348), así que un stub
 * que lanzara tampoco serviría.
 *
 * QUÉ ES Y QUÉ NO ES
 * ──────────────────
 * NO es un mecanismo de Scriptorium ni pretende serlo. Es SHA-256 (FIPS 180-4),
 * el mismo algoritmo estándar que implementa OpenSSL detrás de node:crypto.
 * No inventa una huella «parecida»: produce el MISMO hexadecimal, byte a byte.
 * Por eso no es un simulacro — es la misma función calculada aquí.
 *
 * Y no se pide que se crea: cada huella emitida en el navegador es
 * re-verificable contra el `node:crypto` de verdad por dos caminos del server:
 *   · POST /api/acta      → `huellaLedger`/`emitirActa` reales de @zeus/ciudad/acta
 *   · POST /api/verificar → recomputación completa de la cadena en node
 * Si este fichero mintiera, esos dos endpoints lo delatarían al instante.
 *
 * El módulo se autoverifica al cargarse contra los vectores publicados de
 * FIPS 180-4; si fallara, lanza y no deja arrancar la demo en silencio.
 *
 * Superficie cubierta: createHash('sha256') → .update(dato[,enc]) → .digest(enc).
 * Es exactamente lo que usa `acta.mjs`. Cualquier otra cosa lanza con motivo.
 */

// ── SHA-256 (FIPS 180-4 §6.2) ────────────────────────────────────────────────
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
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H0 = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const W = new Uint32Array(64);

/**
 * @param {Uint8Array} bytes
 * @returns {Uint8Array} 32 bytes
 */
function sha256(bytes) {
  const l = bytes.length;
  // padding: mensaje + 0x80 + ceros + 8 bytes de longitud, múltiplo de 64
  const total = (((l + 8) >> 6) << 6) + 64;
  const m = new Uint8Array(total);
  m.set(bytes);
  m[l] = 0x80;

  const vista = new DataView(m.buffer);
  // longitud en BITS, big-endian de 64 bits (l*8 partido en alto/bajo)
  vista.setUint32(total - 8, Math.floor(l / 0x20000000), false);
  vista.setUint32(total - 4, (l << 3) >>> 0, false);

  const h = H0.slice();

  for (let off = 0; off < total; off += 64) {
    for (let t = 0; t < 16; t += 1) W[t] = vista.getUint32(off + t * 4, false);
    for (let t = 16; t < 64; t += 1) {
      const w15 = W[t - 15];
      const w2 = W[t - 2];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = h[0]; let b = h[1]; let c = h[2]; let d = h[3];
    let e = h[4]; let f = h[5]; let g = h[6]; let hh = h[7];

    for (let t = 0; t < 64; t += 1) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[t] + W[t]) >>> 0;
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

  const salida = new Uint8Array(32);
  const dv = new DataView(salida.buffer);
  for (let i = 0; i < 8; i += 1) dv.setUint32(i * 4, h[i], false);
  return salida;
}

// ── utilidades de codificación ───────────────────────────────────────────────
const codificador = new TextEncoder();

function aBytes(dato, codificacion) {
  if (typeof dato === 'string') {
    if (codificacion && codificacion !== 'utf8' && codificacion !== 'utf-8') {
      if (codificacion === 'hex') {
        const n = dato.length >> 1;
        const b = new Uint8Array(n);
        for (let i = 0; i < n; i += 1) b[i] = parseInt(dato.substr(i * 2, 2), 16);
        return b;
      }
      throw new Error(`node:crypto (shim): codificación de entrada no soportada: ${codificacion}`);
    }
    return codificador.encode(dato);
  }
  if (dato instanceof Uint8Array) return dato;
  if (dato instanceof ArrayBuffer) return new Uint8Array(dato);
  if (ArrayBuffer.isView(dato)) return new Uint8Array(dato.buffer, dato.byteOffset, dato.byteLength);
  throw new Error('node:crypto (shim): update() acepta string, Uint8Array o ArrayBuffer');
}

function aHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

function aBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function concatenar(trozos) {
  let n = 0;
  for (const t of trozos) n += t.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const t of trozos) { out.set(t, o); o += t.length; }
  return out;
}

// ── superficie node:crypto ───────────────────────────────────────────────────
class Hash {
  constructor(algoritmo) {
    this._alg = algoritmo;
    this._trozos = [];
    this._cerrado = false;
  }

  update(dato, codificacion) {
    if (this._cerrado) throw new Error('node:crypto (shim): update() tras digest()');
    this._trozos.push(aBytes(dato, codificacion));
    return this;
  }

  digest(codificacion) {
    this._cerrado = true;
    const bytes = sha256(concatenar(this._trozos));
    if (!codificacion) return bytes;
    if (codificacion === 'hex') return aHex(bytes);
    if (codificacion === 'base64') return aBase64(bytes);
    throw new Error(`node:crypto (shim): codificación de salida no soportada: ${codificacion}`);
  }
}

/**
 * Única función cubierta. Cualquier otro algoritmo lanza en vez de devolver
 * un valor plausible: un hash falso es peor que un fallo ruidoso.
 * @param {string} algoritmo
 */
export function createHash(algoritmo) {
  const alg = String(algoritmo).toLowerCase().replace(/-/g, '');
  if (alg !== 'sha256') {
    throw new Error(
      `node:crypto (shim de navegador): solo sha256. Pedido: «${algoritmo}». `
      + 'Ver /shim/node-crypto.mjs — se cubre lo que usa @zeus/ciudad/acta y nada más.',
    );
  }
  return new Hash('sha256');
}

// ── autoverificación (FIPS 180-4, vectores publicados) ───────────────────────
export const VECTORES_FIPS = Object.freeze({
  '': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  abc: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq:
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
});

for (const [entrada, esperado] of Object.entries(VECTORES_FIPS)) {
  const obtenido = createHash('sha256').update(entrada, 'utf8').digest('hex');
  if (obtenido !== esperado) {
    throw new Error(
      `node:crypto (shim): SHA-256 incorrecto para «${entrada.slice(0, 12)}…»: `
      + `${obtenido} ≠ ${esperado}. La demo no arranca con huellas falsas.`,
    );
  }
}

/** Marca para que la UI pueda decir la verdad sobre de dónde sale la huella. */
export const ES_SHIM_DE_NAVEGADOR = true;

export default { createHash, ES_SHIM_DE_NAVEGADOR, VECTORES_FIPS };
