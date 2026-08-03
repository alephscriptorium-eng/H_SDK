/**
 * Acople de lectura con `@zeus/ciudad/acta`.
 *
 * H **no posee la notaría** (ADR 0002, frontera de ownership): aquí solo se
 * adopta la FORMA del acta publicada, para poder tiparla al recibirla.
 *
 * PENDIENTE: implementar `PuertoActa` de verdad. Motivo medido — el módulo
 * `@zeus/ciudad/acta` usa `node:crypto` (`design/ARQUITECTURA-DEMO-R2.md`
 * §W-SERVER-REAL: «por eso vive en server»), así que emitir/verificar exige un
 * edge de proceso Node, no este edge de contrato. Se abre cuando la ficha lo
 * pida, no antes.
 */

import type { ActaDeBarrio } from '@zeus/ciudad/acta';

export type { ActaDeBarrio };

/** Vista mínima que H necesita de un acta recibida. */
export interface ActaRecibida {
  readonly barrio: string;
  readonly estado: ActaDeBarrio['estado'];
  readonly huella: string;
}

export function leerActa(acta: ActaDeBarrio): ActaRecibida {
  return { barrio: acta.barrioId, estado: acta.estado, huella: acta.huellaLedger };
}
