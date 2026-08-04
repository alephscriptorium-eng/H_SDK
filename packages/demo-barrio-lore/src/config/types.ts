import type { ColorToken } from '../theme/tokens.ts';

/** Override parcial de la paleta canónica. */
export type ThemeOverride = Partial<Record<ColorToken, number>>;

/** Emotes tipestate→clip (GLB kit / stick-puppet). */
export type UnitGesto = {
  readonly glb: string;
  readonly stick: string;
};

/**
 * Unidad de la herradura. `acento` es token de paleta
 * (`oro` H / `verdigris` M / `violeta` simulacro).
 */
export type UnitDef = {
  readonly id: string;
  readonly nombre: string;
  readonly tarea: string;
  readonly gesto: UnitGesto;
  readonly acento: ColorToken | 'ok' | 'fallo';
};

/** Config del builder BarrioScene (roster / GLB; geometría vive en layout tokens). */
export type BarrioConfig = {
  readonly unidades: readonly UnitDef[];
  /** Subconjunto de `unidades[].id` que exigen lease (FK). */
  readonly unidadesConLease?: readonly string[];
  /** Override de `RUTA_GLB_DEFAULT`. */
  readonly rutaGlb?: string;
  readonly theme?: ThemeOverride;
};

/**
 * Color por id de distrito. Defaults del game:
 * zigurat/editores/lore-voz/red-stream/runtime-mcp/infra-ui.
 */
export type ColorDistritoMap = Readonly<Record<string, number>>;

/** Nombre canónico `dry` de calle por distrito (seeds startpack-ciudad). */
export type DryCalleMap = Readonly<Record<string, string>>;

/** Config del builder CiudadScene. */
export type CiudadConfig = {
  /** Barrio destacado (pulso emissive); p.ej. `document-machine-sdk`. */
  readonly destacadoBarrioId: string;
  readonly colorDistrito?: ColorDistritoMap;
  readonly dryCalle?: DryCalleMap;
  /** Override de `RADIO_CIUDAD`. */
  readonly radio?: number;
  /** Override de `DENSIDAD_NIEBLA`. */
  readonly densidadNiebla?: number;
  readonly theme?: ThemeOverride;
};

/** Config fina del host (camera rails / cremallera); L5. */
export type HostConfig = {
  readonly barrioId: string;
  readonly hondura?: number;
  readonly fov?: number;
  readonly theme?: ThemeOverride;
};
