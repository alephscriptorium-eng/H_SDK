/**
 * Magic numbers del game de vista, con nombres semánticos.
 * Origen: ciudad.mjs · barrio.mjs · flujo.mjs · main.mjs.
 */

// ── Ciudad ──────────────────────────────────────────────────────────────────

/** Radio exterior de la ciudad (cantera / constelación). */
export const RADIO_CIUDAD = 31;

/** Ángulo inicial del layout radial de holones. */
export const ANG_INICIAL = Math.PI * 0.62;

/** Hueco angular entre holones. */
export const GAP_HOLON = 0.085;

/** Hueco angular entre distritos. */
export const GAP_DISTRITO = 0.045;

/** Segundos del revelado de mesetas. */
export const DUR_REVELADO = 2.6;

/** Altura de la bruma / niebla de ciudad. */
export const ALTURA_BRUMA = 80;

/** Densidad por defecto de FogExp2. */
export const DENSIDAD_NIEBLA = 0.0128;

/** Bandas radiales y altura base por `runtimeKind` del holón. */
export const BANDAS = Object.freeze({
  anchor: { rIn: 12.0, rOut: 21.0, base: 1.3, arcoMin: 0.0, grosor: 1.1 },
  metodo: { rIn: 4.2, rOut: 9.2, base: 7.0, arcoMin: 1.05, grosor: 1.6 },
  cantera: { rIn: 25.0, rOut: 31.0, base: -2.3, arcoMin: 0.85, grosor: 0.7 },
  constelacion: { rIn: 25.0, rOut: 31.0, base: -2.3, arcoMin: 0.85, grosor: 0.7 },
} as const);

/** Lectura visual de `BARRIO_ESTADOS` (@zeus/ciudad/contract). */
export const ESTADOS_VISUAL = Object.freeze({
  vivo: { alturaK: 1.0, radioK: 1.0, emissive: 0.26, opacidad: 1.0, apagado: 0.0 },
  latente: { alturaK: 0.72, radioK: 0.9, emissive: 0.12, opacidad: 0.88, apagado: 0.34 },
  muerto: { alturaK: 0.44, radioK: 0.82, emissive: 0.035, opacidad: 0.55, apagado: 0.66 },
  roto: { alturaK: 0.52, radioK: 0.94, emissive: 0.09, opacidad: 0.62, apagado: 0.52 },
} as const);

// ── Barrio (plaza / herradura) ──────────────────────────────────────────────

/** Radio de la herradura de locales. */
export const R_HERRADURA = 11.5;

/** Radio de colocación de monigotes. */
export const R_MONIGOTES = 8.9;

/** Radio de la plaza. */
export const R_PLAZA = 16.5;

/** Arco de la herradura (280°). */
export const ARCO_HERRADURA = (Math.PI * 2 * 280) / 360;

/** Inicio angular de la herradura (40°). */
export const INICIO_HERRADURA = (Math.PI * 2 * 40) / 360;

export const ALTURA_MONIGOTE = 1.8;
export const ALTURA_ANCLA = 1.15;
export const R_FUENTE = 2.5;
export const ALTURA_ONFALO = 1.15;
export const Y_AGUA = 0.46;

/** Transición de material/halo (s). */
export const TRANSICION_MATERIAL = 0.5;

/** Fade-in de tipestate `recovering` (s). */
export const FADE_IN_RECOVERING = 0.95;

/** Plazo de carga GLB (ms). */
export const ESPERA_GLB_MS = 12_000;

/** Duración del clip Death del GLB kit (s). */
export const DURACION_MUERTE = 0.9583;

/** Cadencia del gesto de oficio en `corriendo` (s). */
export const GESTO_CADA = 5.4;

/** Ruta GLB servida por el host demo (`/models/` → game-engine assets). */
export const RUTA_GLB_DEFAULT = '/models/RobotExpressive.glb';

// ── Host / cámara (main.mjs) ────────────────────────────────────────────────

/** Hundimiento de la plaza bajo su meseta. */
export const HONDURA = 60;

/** FOV de PerspectiveCamera. */
export const FOV = 46;

export const CAMARA_NEAR = 0.35;
export const CAMARA_FAR = 900;

/** Pose inicial aérea (antes del rail de ciudad). */
export const CAMARA_POS_INICIAL = Object.freeze({ x: 0, y: 40, z: 70 } as const);

/** Exposición tone-mapping por defecto. */
export const EXPOSICION_DEFAULT = 1.24;

/** OrbitControls — ciudad (overlook). */
export const ORBIT_CIUDAD = Object.freeze({
  dampingFactor: 0.055,
  rotateSpeed: 0.55,
  zoomSpeed: 0.7,
  panSpeed: 0.5,
  maxPolarAngle: Math.PI * 0.495,
  minDistance: 6,
  maxDistance: 160,
} as const);

/** OrbitControls — ceremonia (plaza). */
export const ORBIT_CEREMONIA = Object.freeze({
  minDistance: 12,
  maxDistance: 96,
} as const);

/**
 * Offsets de `poseCeremonia` relativos al origen del barrio.
 * `pos` usa factor de aspecto `k`; aquí van los coeficientes base.
 */
export const POSE_CEREMONIA = Object.freeze({
  posYBase: 12.4,
  posYPorK: 3.2,
  posZBase: 34,
  mira: { x: 0, y: 2.6, z: -1.2 },
  aspectoRef: 1.62,
  kMin: 1,
  kMax: 1.7,
} as const);

/** Factor de aspecto para encuadre aéreo. */
export const ENCUADRE_AEREO = Object.freeze({
  aspectoRef: 1.45,
  kMin: 1,
  kMax: 1.9,
} as const);

/** Duración del vuelo de descenso (s). */
export const DUR_DESCENSO = 5.8;

/** Tensiones CatmullRom del rail de cámara. */
export const RAIL_TENSION = 0.35;

/** Waypoints del descenso (fracciones de HONDURA / offsets). */
export const DESCENSO_WAYPOINTS = Object.freeze({
  cimaAfuera: 15,
  cimaY: 10.5,
  midHondura: 0.44,
  midAfuera: 19,
  miraHondura: 0.72,
} as const);

/**
 * Cremallera en el host: desplazamiento desde origen del barrio + escala.
 * (main.mjs agranda la de flujo para la cámara de ceremonia ≈34 u.)
 */
export const CREMALLERA_HOST = Object.freeze({
  desplazamiento: { x: 0, y: 3.55, z: -8.6 },
  escala: 1.8,
} as const);

// ── Flujo FX ────────────────────────────────────────────────────────────────

/** Escala global de duraciones con prefers-reduced-motion. */
export const REDUCIDO_DURACION_K = 0.12;

/** Defaults de cremallera en FlujoFx (antes del override del host). */
export const CREMALLERA_DEFAULT = Object.freeze({
  posicion: { x: 0, y: 3.1, z: -9.2 },
  rotacionY: 0,
  pasos: 11,
  separacion: 0.38,
  ancho: 1.26,
  techo: 2.05,
} as const);

export const FX_DURACIONES = Object.freeze({
  gota: 1.55,
  cristalCrecer: 1.35,
  llave: 1.7,
  acta: 3.4,
  chispas: 0.85,
  destelloAnillo: 0.9,
} as const);

export const FX_CRISTAL = Object.freeze({
  alto: 1.15,
  radio: 0.3,
} as const);
