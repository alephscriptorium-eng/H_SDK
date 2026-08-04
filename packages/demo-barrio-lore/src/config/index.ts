export type {
  ThemeOverride,
  UnitGesto,
  UnitDef,
  BarrioConfig,
  ColorDistritoMap,
  DryCalleMap,
  CiudadConfig,
  HostConfig,
} from './types.ts';

export {
  validarBarrioConfig,
  validarCiudadConfig,
  validarConfigs,
} from './validate.ts';
export type { ConfigIssue, ConfigValidation } from './validate.ts';
