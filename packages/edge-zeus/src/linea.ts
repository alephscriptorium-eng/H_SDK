/**
 * Materialización de línea — owner canónico tipado ausente / sin types
 * (RH-11 · linea-kit publicado-sin-types). Fail-closed. Cero
 * `line.materialize` local en H.
 */

import { err } from '@h-sdk/core';
import type {
  Acople,
  AnalisisRef,
  LineaRef,
  PuertoMaterializacionLinea,
  Resultado,
} from '@h-sdk/core';

export const MOTIVO_LINEA =
  'pending_external_contract: linea/materialize tipada (RH-11; linea-kit sin types)';

export function crearPuertoMaterializacionLinea(): PuertoMaterializacionLinea {
  return {
    nombre: '@h-sdk/edge-zeus/linea',
    acople: (): Acople => 'replay',
    async materializar(_analisis: AnalisisRef): Promise<Resultado<LineaRef>> {
      return err(MOTIVO_LINEA);
    },
  };
}
