/**
 * Acople con `@zeus/protocol` — el contrato real, consumido `.mjs` + `.d.ts`
 * desde el registry (ADR 0002: solo lo publicado; jamás vendorear).
 *
 * Este fichero es la frontera: aquí `IntentPayload` es un tipo legítimo. Un
 * fichero de `@h-sdk/core` que importe esto tiene el hexágono roto.
 */

import { makeIntent } from '@zeus/protocol';
import type { IntentPayload } from '@zeus/protocol';
import type { ActorId } from '@h-sdk/core';

/** Id de juego con el que H habla al dominio de ciudad (RECAP · «Marco»). */
export const JUEGO_CIUDAD = 'ciudad';

/**
 * Transporte outbound-only: H habla hacia zeus, zeus no manda dentro de H
 * (ALEPH-H · doble acople). El socket real vive fuera del edge; aquí solo su
 * forma, para que el puerto sea testeable sin red.
 */
export interface TransporteZeus {
  readonly nombre: string;
  enviar(sobre: IntentPayload): Promise<void>;
}

/** Construye un intent REAL con `makeIntent` de `@zeus/protocol`. */
export function intentDeCiudad(
  actor: ActorId,
  intent: string,
  args: Record<string, unknown> = {},
): IntentPayload {
  return makeIntent(actor, intent, args, { game: JUEGO_CIUDAD });
}

export type { IntentPayload };
