export { CiudadScene } from './CiudadScene.ts';
export type {
  CiudadFrontera,
  CiudadMountOptions,
  FocusCityArg,
  FocusCityResult,
} from './CiudadScene.ts';

export {
  calcularTrazado,
  gamemapDesdeMapa,
  semilla,
  repartir,
  punto3,
  rumboHacia,
  COLOR_DISTRITO_DEFAULT,
  DRY_CALLE_DEFAULT,
  COLORES_RESPALDO,
} from './trazado.ts';
export type {
  MapaData,
  MapaBarrio,
  MapaDistrito,
  MapaHolon,
  TrazadoResult,
  Gamemap,
  BarrioTrazado,
  MesetaTrazado,
  NotariaTrazado,
  CalcularTrazadoOptions,
  GamemapOptions,
} from './trazado.ts';

export { cargarCiudadReal, tematizar, resolverMapa } from './ciudad-helpers.ts';
export type { CargaCiudadReal, TematizarCfg } from './ciudad-helpers.ts';
