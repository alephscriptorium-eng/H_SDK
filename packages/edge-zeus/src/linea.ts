/**
 * Materialización de línea — delega en `materializeRecorrido` tipado de
 * `@zeus/linea-kit/viaje` (RH-11b · linea-kit@0.4.0). Fail-closed si falta
 * cacheDir/draft o el kit rehúsa. Cero `line.materialize` local en H.
 */

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materializeRecorrido as materializeRecorridoKit } from '@zeus/linea-kit/viaje';
import type {
  KitFailure,
  MaterializeRecorridoOk,
  MaterializeRecorridoOptions,
  ViajeDraft,
} from '@zeus/linea-kit/viaje';
import { err, ok } from '@h-sdk/core';
import type {
  Acople,
  AnalisisRef,
  LineaRef,
  PuertoMaterializacionLinea,
  Resultado,
} from '@h-sdk/core';

/** Etiqueta de superficie en composition / pending list (no implica types ausentes). */
export const MOTIVO_LINEA =
  'pending_external_contract: linea (requiere análisis E previo o input)';

/** Sin cacheDir / draft / materializador inyectable → denegado (hostil-omite). */
export const MOTIVO_LINEA_INPUT =
  'linea: cacheDir|draft|materializar ausente — denegado (hostil-omite)';

export type MaterializadorRecorrido = (
  options: MaterializeRecorridoOptions,
) => MaterializeRecorridoOk | KitFailure;

export type DraftDesdeAnalisis = (analisis: AnalisisRef) => ViajeDraft | null;

export interface OpcionesPuertoMaterializacionLinea {
  /** Default: `materializeRecorrido` de `@zeus/linea-kit/viaje`. */
  readonly materializar?: MaterializadorRecorrido | null;
  /** Obligatorio para camino feliz; ausente → fail-closed. */
  readonly cacheDir?: string | null;
  /** Mapea AnálisisRef → ViajeDraft; null/ausente → fail-closed. */
  readonly draftDesdeAnalisis?: DraftDesdeAnalisis | null;
}

function esDraftValido(draft: ViajeDraft | null | undefined): draft is ViajeDraft {
  if (!draft) return false;
  return Boolean(draft.id && draft.origin && draft.destination);
}

/** Draft mínimo de aceptación desde un AnálisisRef opaco (fixture / smoke). */
export function draftMinimoDesdeAnalisis(analisis: AnalisisRef): ViajeDraft {
  return {
    id: `linea-${analisis.analisisId}`,
    origin: String(analisis.pieza),
    destination: analisis.analisisId,
    source_kind: 'custom',
    etapa: 'idle',
  };
}

/** cacheDir efímero bajo tmp (composition / smoke; no sibling checkout). */
export function cacheDirLineaEfimero(prefijo = 'h-sdk-linea-'): string {
  return mkdtempSync(join(tmpdir(), prefijo));
}

export function crearPuertoMaterializacionLinea(
  opciones: OpcionesPuertoMaterializacionLinea = {},
): PuertoMaterializacionLinea {
  const materializarFn =
    opciones.materializar === undefined
      ? materializeRecorridoKit
      : opciones.materializar;
  const cacheDir = opciones.cacheDir ?? null;
  const draftDesdeAnalisis = opciones.draftDesdeAnalisis ?? null;

  const listo = (): boolean =>
    Boolean(materializarFn && cacheDir && draftDesdeAnalisis);

  return {
    nombre: '@h-sdk/edge-zeus/linea',
    acople: (): Acople => (listo() ? 'conectado' : 'replay'),
    async materializar(analisis: AnalisisRef): Promise<Resultado<LineaRef>> {
      if (!materializarFn || !cacheDir || !draftDesdeAnalisis) {
        return err(MOTIVO_LINEA_INPUT);
      }
      if (!analisis?.analisisId || !analisis.pieza) {
        return err('linea: AnalisisRef inválido — denegado (hostil-omite)');
      }

      const draft = draftDesdeAnalisis(analisis);
      if (!esDraftValido(draft)) {
        return err('linea: draft inválido (id|origin|destination) — denegado');
      }

      const resultado = materializarFn({
        cacheDir,
        recorrido: draft,
      });

      if (!resultado.ok) {
        return err(
          `linea: materializeRecorrido refused: ${resultado.error} (${resultado.rule})`,
        );
      }

      const lineaId = resultado.recorrido?.id;
      if (!lineaId) {
        return err('linea: materializeRecorrido sin recorrido.id');
      }

      return ok({ lineaId });
    },
  };
}
