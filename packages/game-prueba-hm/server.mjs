// server.mjs · demo «Prueba de H·M — El Descenso»
// Servidor estático sin dependencias: node:http puro, cero build.
// Sirve public/ y monta three, los kits @zeus, los modelos y el mapa.
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
//   /mapa.json                → assets/mapa/mapa.json
//
// Nota: three/build/three.module.js importa «./three.core.js», por eso se monta
// el directorio build/ completo en /vendor/three/ y no solo el módulo suelto.

import http from 'node:http';
import { createReadStream, existsSync as existeSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ── tabla de montajes ────────────────────────────────────────────────────────
// El orden importa: se prueba el prefijo más largo primero.
export const MONTAJES = [
  { url: '/vendor/three/examples/', disco: path.join(NODE_MODULES, 'three', 'examples'), cache: 'largo' },
  { url: '/vendor/three/', disco: path.join(NODE_MODULES, 'three', 'build'), cache: 'largo' },
  { url: '/kit/', disco: path.join(NODE_MODULES, '@zeus', 'ui-3d-kit', 'src'), cache: 'corto' },
  { url: '/view-kit/', disco: path.join(NODE_MODULES, '@zeus', 'view-kit', 'src'), cache: 'corto' },
  { url: '/game-engine/', disco: path.join(NODE_MODULES, '@zeus', 'game-engine', 'src'), cache: 'corto' },
  { url: '/models/', disco: path.join(NODE_MODULES, '@zeus', 'game-engine', 'assets', 'models'), cache: 'largo' },
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

// ── manejador ────────────────────────────────────────────────────────────────
export async function manejar(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD');
    return responderTexto(res, 405, '405 · método no permitido');
  }

  const ruta = normalizarRuta(req.url || '/');
  if (ruta === null) return responderTexto(res, 400, '400 · ruta inválida');

  // salud: útil para el humo y para saber qué montajes faltan
  if (ruta === '/salud') {
    return responderJson(res, 200, {
      ok: true,
      demo: 'Prueba de H·M — El Descenso',
      nodeModules: NODE_MODULES,
      montajes: MONTAJES.map((m) => ({ url: m.url, disco: m.disco, presente: existeSync(m.disco) })),
      mapa: { url: '/mapa.json', disco: MAPA, presente: existeSync(MAPA) },
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
    .then(({ url, cerrar }) => {
      console.log('');
      console.log('  Prueba de H·M — El Descenso');
      console.log(`  escuchando en  ${url}`);
      console.log(`  node_modules   ${NODE_MODULES}`);
      for (const m of MONTAJES) {
        console.log(`  ${existeSync(m.disco) ? '✓' : '·'} ${m.url.padEnd(26)} ${m.disco}`);
      }
      console.log(`  ${existeSync(MAPA) ? '✓' : '·'} ${'/mapa.json'.padEnd(26)} ${MAPA}`);
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
