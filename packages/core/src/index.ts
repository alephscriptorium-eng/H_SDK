/**
 * @h-sdk/core — dominio H puro.
 *
 * Source-first: se importa con extensión `.ts` y se consume sin build
 * (`tsconfig.base.json`: `allowImportingTsExtensions` + `verbatimModuleSyntax`).
 */

export { ok, err, esOk } from './resultado.ts';
export type { Resultado } from './resultado.ts';

export { barrioId, unidadId, piezaId, actorId } from './dominio.ts';
export type {
  Acople,
  ActorId,
  BarrioId,
  Cadena,
  EntradaCadena,
  Id,
  Lado,
  PiezaId,
  PiezaOnfalo,
  UnidadId,
  UnidadRef,
} from './dominio.ts';

export type { Adaptador, PuertoActa, PuertoCiudad, PuertoOnfalo } from './puertos.ts';
