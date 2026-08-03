/**
 * `PuertoEntradaCiudad` — confirma entrada solo con state/ledger observados.
 * «Conectado» ≠ presencia de emisor; exige ambos ids opacos del owner.
 */

import { err, ok } from '@h-sdk/core';
import type {
  Acople,
  ActorId,
  ConfirmacionCiudad,
  PuertoEntradaCiudad,
  Resultado,
} from '@h-sdk/core';
import { intentJoin, type EmisorCiudad } from './wire-ciudad.ts';

/**
 * Observables del owner (EVENTS.STATE / EVENTS.LEDGER).
 * Campos omitidos ⇒ denegación (hostil-omite). No se inventan.
 */
export interface ObservablesCiudad {
  readonly stateId?: string;
  readonly ledgerId?: string;
}

export interface OpcionesPuertoEntradaCiudad {
  readonly emisor: EmisorCiudad;
  /** Lectura actual de ids observados; sin ambos ⇒ no conectado. */
  readonly observar: () => ObservablesCiudad;
}

function idsCompletos(
  o: ObservablesCiudad,
): o is { readonly stateId: string; readonly ledgerId: string } {
  return (
    typeof o.stateId === 'string' &&
    o.stateId.length > 0 &&
    typeof o.ledgerId === 'string' &&
    o.ledgerId.length > 0
  );
}

export function crearPuertoEntradaCiudad(
  opciones: OpcionesPuertoEntradaCiudad,
): PuertoEntradaCiudad {
  const { emisor, observar } = opciones;

  const acople = (): Acople => (idsCompletos(observar()) ? 'conectado' : 'replay');

  async function confirmarEntrada(
    actor: ActorId,
  ): Promise<Resultado<ConfirmacionCiudad>> {
    const antes = observar();
    if (!idsCompletos(antes)) {
      return err(
        'ciudad: stateId|ledgerId omitidos — denegado (no hay confirmación sin observables)',
      );
    }

    await emisor.emitir(intentJoin(actor));

    const despues = observar();
    if (!idsCompletos(despues)) {
      return err(
        'ciudad: tras join faltan stateId|ledgerId observados — denegado',
      );
    }

    return ok({
      actor,
      stateId: despues.stateId,
      ledgerId: despues.ledgerId,
    });
  }

  return {
    nombre: '@h-sdk/edge-zeus/ciudad',
    acople,
    confirmarEntrada,
  };
}
