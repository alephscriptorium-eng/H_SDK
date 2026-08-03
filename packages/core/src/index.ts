/**
 * @h-sdk/core — dominio H puro + máquina de experiencia.
 *
 * Source-first: import con extensión `.ts`, sin build
 * (`tsconfig.base.json`: `allowImportingTsExtensions` + `verbatimModuleSyntax`).
 * Sin dependency `@zeus/*` ni Node IO.
 */

export { ok, err, esOk } from './resultado.ts';
export type { Resultado } from './resultado.ts';

export {
  barrioId,
  unidadId,
  piezaId,
  actorId,
  CAMINO_FELIZ,
  esTerminal,
} from './dominio.ts';
export type {
  Acople,
  ActorId,
  BarrioId,
  EstadoExperiencia,
  Id,
  PiezaId,
  PiezaOnfalo,
  UnidadId,
  UnidadRef,
} from './dominio.ts';

export type {
  Adaptador,
  AnalisisRef,
  ConfirmacionCiudad,
  LineaRef,
  ProyeccionPublicada,
  PuertoAnalisisE,
  PuertoEntradaCiudad,
  PuertoEvidenciaCanonica,
  PuertoMaterializacionLinea,
  PuertoProyeccion,
  PuertoSesionDelta,
  SesionDeltaRef,
  VeredictoEvidencia,
} from './puertos.ts';

export {
  aplicar,
  crearMaquina,
  transicionar,
} from './maquina.ts';
export type {
  EventoExperiencia,
  MaquinaExperiencia,
  TransicionOk,
} from './maquina.ts';
