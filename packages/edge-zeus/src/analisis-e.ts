/**
 * Análisis E — owner externo ausente (RH-11). Fail-closed:
 * `pending_external_contract`. Cero provider local en H.
 */

import { err } from '@h-sdk/core';
import type {
  Acople,
  AnalisisRef,
  PiezaOnfalo,
  PuertoAnalisisE,
  Resultado,
} from '@h-sdk/core';

export const MOTIVO_ANALISIS_E =
  'pending_external_contract: provider-E (RH-11)';

export function crearPuertoAnalisisE(): PuertoAnalisisE {
  return {
    nombre: '@h-sdk/edge-zeus/analisis-e',
    acople: (): Acople => 'replay',
    async analizar(_pieza: PiezaOnfalo): Promise<Resultado<AnalisisRef>> {
      return err(MOTIVO_ANALISIS_E);
    },
  };
}
