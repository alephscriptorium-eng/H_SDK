/**
 * @h-sdk/demo-barrio-lore — builders Three (ciudad / barrio / flujo / host).
 *
 * L0+L1: theme, layout tokens, config types, fixture barrio-lore.
 * L2–L5: CiudadScene, BarrioScene, FlujoFx, SceneHost.
 */

export {
  PALETA,
  PALETA_ALIAS,
  PALETA_CSS,
  HEX_KIT,
  colorDe,
} from './theme/tokens.ts';
export type { ColorToken, ColorAlias } from './theme/tokens.ts';

export {
  RADIO_CIUDAD,
  R_HERRADURA,
  HONDURA,
  FOV,
  RUTA_GLB_DEFAULT,
  BANDAS,
  ESTADOS_VISUAL,
  CREMALLERA_HOST,
  CREMALLERA_DEFAULT,
  FX_DURACIONES,
  REDUCIDO_DURACION_K,
} from './layout/tokens.ts';

export type {
  ThemeOverride,
  UnitGesto,
  UnitDef,
  BarrioConfig,
  CiudadConfig,
  HostConfig,
  ColorDistritoMap,
  DryCalleMap,
} from './config/types.ts';

export {
  validarBarrioConfig,
  validarCiudadConfig,
  validarConfigs,
} from './config/validate.ts';
export type { ConfigIssue, ConfigValidation } from './config/validate.ts';

export {
  BARRIO_DESTACADO_ID,
  UNIDADES_BARRIO_LORE,
  UNIDADES_CON_LEASE,
  COLOR_DISTRITO,
  DRY_CALLE,
  ciudadBarrioLore,
  barrioBarrioLore,
  fixtureBarrioLore,
} from './fixtures/barrio-lore.ts';

export { EASE, pinza } from './shared/ease.ts';
export type { EaseFn } from './shared/ease.ts';

export {
  prefersReducedMotion,
  escalaDuracion,
  duracionConMotion,
} from './shared/motion.ts';

export { CiudadScene } from './ciudad/CiudadScene.ts';
export type { CiudadMountOptions, FocusCityResult } from './ciudad/CiudadScene.ts';

export { BarrioScene } from './barrio/BarrioScene.ts';
export type {
  BarrioMountOptions,
  EstadoUnidad,
  Procedencia,
} from './barrio/BarrioScene.ts';

export { FlujoFx } from './flujo/FlujoFx.ts';
export type { FlujoFxOptions, ThreeModule as FlujoThreeModule, AnchorResolver } from './flujo/FlujoFx.ts';

export { SceneHost } from './host/SceneHost.ts';
export type { SceneHostOptions, HostAct, CueArgs } from './host/SceneHost.ts';
