/**
 * @h-sdk/edge-zeus — único IO de h-sdk hacia owners `@zeus/*` / G tipados.
 * El core declara puertos; aquí se acoplan. Sin transporte genérico ni
 * payloads paralelos vetados.
 */

export {
  EVENTS,
  makeIntent,
  intentJoin,
  intentWalk,
  intentAnnounce,
  intentWake,
} from './wire-ciudad.ts';
export type {
  ArgsWake,
  EmisorCiudad,
  HaciaWalk,
} from './wire-ciudad.ts';

export { crearPuertoEntradaCiudad } from './ciudad.ts';
export type {
  ObservablesCiudad,
  OpcionesPuertoEntradaCiudad,
} from './ciudad.ts';

export {
  crearPuertoSesionDelta,
  abridorDesdeStartArgRuntime,
} from './delta.ts';
export type {
  AbridorRuntimeDelta,
  OpcionesPuertoSesionDelta,
} from './delta.ts';

export {
  abrirAsientoM,
  acopleDesdeSaludM,
  leerSaludDesdeBridge,
  saludMConectada,
} from './asiento-m.ts';
export type {
  BridgeM,
  FactoryArgPlayerMcp,
  HandleAsientoM,
  OpcionesAsientoM,
  SaludM,
} from './asiento-m.ts';

export {
  crearPuertoAnalisisE,
  MOTIVO_ANALISIS_E,
} from './analisis-e.ts';
export {
  cacheDirLineaEfimero,
  crearPuertoMaterializacionLinea,
  draftMinimoDesdeAnalisis,
  MOTIVO_LINEA,
  MOTIVO_LINEA_INPUT,
} from './linea.ts';
export type {
  DraftDesdeAnalisis,
  MaterializadorRecorrido,
  OpcionesPuertoMaterializacionLinea,
} from './linea.ts';
export {
  crearPuertoEvidenciaCanonica,
  MOTIVO_EVIDENCIA,
} from './evidencia.ts';

export { crearPuertoProyeccion } from './proyeccion.ts';
export type {
  OpcionesPuertoProyeccion,
  SumideroProyeccion,
} from './proyeccion.ts';
