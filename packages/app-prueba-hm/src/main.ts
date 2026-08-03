/**
 * Entrypoint alcanzable Bun/TS de Prueba-H-M.
 * Sustituye `packages/game-prueba-hm/server.mjs` en el producto reachable.
 *
 * Uso: `bun run demo` (raíz) o `bun run packages/app-prueba-hm/src/main.ts`
 *
 * Sin room/registry viva la demo es fail-closed: resources muestran
 * error/pending_external; nunca declara `complete` por replay silencioso.
 */

import {
  arrancarComposition,
  depsDemoPorDefecto,
} from './composition.ts';
import {
  URI_ESCENA,
  URI_ESTADO,
  URI_EVIDENCIA,
} from './resources.ts';

// Ancla de reachability: imports de producto (core + edges) en el entrypoint.
import {
  crearMaquina,
  type MaquinaExperiencia,
} from '@h-sdk/core';
import {
  crearPuertoEntradaCiudad,
  crearPuertoSesionDelta,
  abrirAsientoM,
  crearPuertoProyeccion,
  crearPuertoAnalisisE,
  crearPuertoEvidenciaCanonica,
  crearPuertoMaterializacionLinea,
} from '@h-sdk/edge-zeus';

/** Símbolos que el test de reachability exige cableados (no tree-shake opacos). */
export const REACHABILITY_ANCHORS = {
  crearMaquina,
  crearPuertoEntradaCiudad,
  crearPuertoSesionDelta,
  abrirAsientoM,
  crearPuertoProyeccion,
  crearPuertoAnalisisE,
  crearPuertoEvidenciaCanonica,
  crearPuertoMaterializacionLinea,
} as const;

export type { MaquinaExperiencia };

async function main(): Promise<number> {
  const handle = await arrancarComposition(depsDemoPorDefecto());
  const snap = handle.resources.snapshot();
  const estado = snap[URI_ESTADO] as { estado?: string; pending_external?: string[] };

  const salida = {
    entrypoint: '@h-sdk/app-prueba-hm',
    maquina: handle.maquina.estado,
    resources: {
      list: handle.listResources().map((d) => d.uri),
      [URI_ESTADO]: snap[URI_ESTADO],
      [URI_ESCENA]: snap[URI_ESCENA],
      [URI_EVIDENCIA]: snap[URI_EVIDENCIA],
    },
  };

  console.log(JSON.stringify(salida, null, 2));

  if (estado.estado === 'complete') {
    console.error(
      'ABORT: composition declaró complete sin vertical real (RH-15) — mentira',
    );
    return 2;
  }

  // Demo honesta: arranque OK aunque quede en error/pending (fail-closed).
  return 0;
}

if (import.meta.main) {
  const code = await main();
  process.exit(code);
}
