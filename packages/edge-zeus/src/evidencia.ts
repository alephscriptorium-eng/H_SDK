/**
 * Evidencia canónica HUB — contrato tipado ausente (RH-11). Fail-closed.
 * Cero notaría/ledger local en H.
 *
 * `@zeus/acta-kit@0.1.2` está tipado en registry, pero **no** es evidencia HUB
 * canónica (CONTRATO / nota Z). No se cablea aquí para no mentir que es HUB.
 */

import { err } from '@h-sdk/core';
import type {
  Acople,
  LineaRef,
  PuertoEvidenciaCanonica,
  Resultado,
  VeredictoEvidencia,
} from '@h-sdk/core';

export const MOTIVO_EVIDENCIA =
  'pending_external_contract: evidencia/ceremonia HUB (RH-11; acta-kit≠canónico)';

export function crearPuertoEvidenciaCanonica(): PuertoEvidenciaCanonica {
  return {
    nombre: '@h-sdk/edge-zeus/evidencia',
    acople: (): Acople => 'replay',
    async verificar(_linea: LineaRef): Promise<Resultado<VeredictoEvidencia>> {
      return err(MOTIVO_EVIDENCIA);
    },
  };
}
