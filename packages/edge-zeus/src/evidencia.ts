/**
 * Evidencia canónica HUB — contrato tipado ausente (RH-11). Fail-closed.
 * Cero notaría/ledger local en H. `acta-kit` no sustituye (publicado-sin-types).
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
  'pending_external_contract: evidencia/ceremonia HUB (RH-11)';

export function crearPuertoEvidenciaCanonica(): PuertoEvidenciaCanonica {
  return {
    nombre: '@h-sdk/edge-zeus/evidencia',
    acople: (): Acople => 'replay',
    async verificar(_linea: LineaRef): Promise<Resultado<VeredictoEvidencia>> {
      return err(MOTIVO_EVIDENCIA);
    },
  };
}
