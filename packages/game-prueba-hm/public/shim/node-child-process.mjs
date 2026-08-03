/**
 * node:child_process — tapón de navegador. NO implementa nada: declara.
 *
 * POR QUÉ EXISTE
 * ─────────────
 * El grafo real, verificado leyendo node_modules:
 *
 *     @zeus/ciudad/domain  →  ./edificios.mjs  →  ./salud.mjs
 *                                                    ↑
 *                          import { spawn } from 'node:child_process'
 *
 * Los imports se resuelven al cargar el grafo. Sin una resolución para
 * `node:child_process`, el navegador no carga `@zeus/ciudad/domain` — que es
 * el dominio real del R2 — aunque nadie vaya a lanzar un proceso jamás.
 *
 * Y nadie va a lanzarlo: `edificios.mjs` solo importa de `salud.mjs` tres
 * constantes CONGELADAS (`DEFAULT_NPM_REGISTRY`, `PROBE_KINDS`,
 * `SALUD_SHAPE_FOR_ACL`). El único `spawn(...)` del paquete vive en el
 * ejecutor de probes (salud.mjs línea 201), fuera del reducer: la cabecera del
 * propio módulo lo dice — «El dominio permanece puro: este módulo orquesta I/O
 * y propone estado».
 *
 * QUÉ HACE ESTE FICHERO
 * ────────────────────
 * Nada. Deja que el grafo cargue y, si alguien intentara de verdad lanzar un
 * proceso desde una pestaña, LANZA con el motivo. Un navegador no tiene
 * procesos hijo y aquí no se finge que los tenga: los probes de salud
 * (npm-view · http-status · smoke) son `pendiente` declarado, no simulado.
 *
 * Diferencia con /shim/node-crypto.mjs: aquel SÍ calcula, porque SHA-256 se
 * puede calcular en cualquier sitio y da la misma huella. Esto no se puede, y
 * por eso no se hace.
 */

const MOTIVO = 'Un navegador no tiene procesos hijo. Los probes de salud de '
  + '@zeus/ciudad/salud (npm-view · http-status · smoke) son «pendiente» '
  + 'declarado en esta demo, no simulado. Si necesitas salud real, córrela en '
  + 'node y manda la señal al dominio con `applySalud`.';

function noDisponible(nombre) {
  return function (...args) {
    throw new Error(
      `node:child_process.${nombre}() no existe en el navegador `
      + `(pedido con ${args.length} argumento(s)). ${MOTIVO}`,
    );
  };
}

export const spawn = noDisponible('spawn');
export const spawnSync = noDisponible('spawnSync');
export const exec = noDisponible('exec');
export const execSync = noDisponible('execSync');
export const execFile = noDisponible('execFile');
export const execFileSync = noDisponible('execFileSync');
export const fork = noDisponible('fork');

/** Marca para que la UI pueda decir la verdad sobre esta frontera. */
export const ES_TAPON_DECLARADO = true;
export const MOTIVO_PENDIENTE = MOTIVO;

export default { spawn, spawnSync, exec, execSync, execFile, execFileSync, fork, ES_TAPON_DECLARADO, MOTIVO_PENDIENTE };
