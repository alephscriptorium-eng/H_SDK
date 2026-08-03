/**
 * `PuertoSesionDelta` — sesión vía packs G tipados (`@zeus/arg-domain` +
 * `@zeus/arg-runtime`). Acople conectado exige salud M (connected+lastStateTs)
 * además de confirmación Ciudad previa.
 *
 * Packs tip: pending_registry_publish (RH-09 tarball / g-sdk@1fad30e).
 */

import { err, ok } from '@h-sdk/core';
import type {
  Acople,
  ConfirmacionCiudad,
  PuertoSesionDelta,
  Resultado,
  SesionDeltaRef,
} from '@h-sdk/core';
import {
  acopleDesdeSaludM,
  saludMConectada,
  type SaludM,
} from './asiento-m.ts';

/** Apertura de runtime delta inyectable (smoke / tarball / registry). */
export interface AbridorRuntimeDelta {
  abrir(confirmacion: ConfirmacionCiudad): Promise<{ sesionId: string }>;
}

export interface OpcionesPuertoSesionDelta {
  readonly abridor: AbridorRuntimeDelta | null;
  /** Salud M actual; omitir lastStateTs/connected ⇒ no acople conectado. */
  readonly saludM: () => SaludM;
  /**
   * Motivo cuando abridor es null (p.ej. pending_registry_publish /
   * pending_external_contract).
   */
  readonly motivoAusencia?: string;
}

export function crearPuertoSesionDelta(
  opciones: OpcionesPuertoSesionDelta,
): PuertoSesionDelta {
  const {
    abridor,
    saludM,
    motivoAusencia = 'pending_registry_publish: @zeus/arg-runtime|arg-domain',
  } = opciones;

  const acople = (): Acople => {
    if (!abridor) return 'replay';
    return acopleDesdeSaludM(saludM());
  };

  async function abrirSesion(
    confirmacion: ConfirmacionCiudad,
  ): Promise<Resultado<SesionDeltaRef>> {
    if (!abridor) {
      return err(motivoAusencia);
    }

    if (!confirmacion.stateId || !confirmacion.ledgerId) {
      return err(
        'delta: confirmacion Ciudad sin stateId|ledgerId — denegado',
      );
    }

    const salud = saludM();
    if (!saludMConectada(salud)) {
      return err(
        'delta: M no conectado — exige connected+lastStateTs (hostil-omite)',
      );
    }

    const abierto = await abridor.abrir(confirmacion);
    if (!abierto.sesionId) {
      return err('delta: runtime no devolvió sesionId');
    }

    return ok({ sesionId: abierto.sesionId });
  }

  return {
    nombre: '@h-sdk/edge-zeus/delta',
    acople,
    abrirSesion,
  };
}

/**
 * Abridor que usa `startArgRuntime` del pack tipado (inyectado para no
 * fijar sibling path en producto). El caller resuelve el import desde
 * tarball RH-09 / registry cuando exista.
 */
export function abridorDesdeStartArgRuntime(deps: {
  startArgRuntime: (opts: Record<string, unknown>) => Promise<{
    sessionId?: string;
    id?: string;
    close?: () => Promise<void> | void;
    shutdown?: () => Promise<void> | void;
    [key: string]: unknown;
  }>;
  runtimeOpts: Record<string, unknown>;
  sesionIdDe?: (handle: Record<string, unknown>, c: ConfirmacionCiudad) => string;
}): AbridorRuntimeDelta {
  return {
    async abrir(confirmacion) {
      const handle = await deps.startArgRuntime(deps.runtimeOpts);
      const sesionId = deps.sesionIdDe
        ? deps.sesionIdDe(handle, confirmacion)
        : String(
            handle.sessionId ??
              handle.id ??
              `delta:${confirmacion.stateId}:${confirmacion.ledgerId}`,
          );
      return { sesionId };
    },
  };
}
