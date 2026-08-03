/**
 * @h-sdk/edge-zeus — el único puerto de h-sdk hacia `@zeus/*`.
 *
 * Regla del hexágono: los tipos de zeus entran hasta aquí y no pasan. Lo que
 * cruza al core son los tipos del core.
 */

export { JUEGO_CIUDAD, intentDeCiudad } from './protocolo.ts';
export type { IntentPayload, TransporteZeus } from './protocolo.ts';

export { crearPuertoCiudad } from './ciudad.ts';
export type { OpcionesPuertoCiudad } from './ciudad.ts';

export { leerActa } from './acta.ts';
export type { ActaDeBarrio, ActaRecibida } from './acta.ts';
