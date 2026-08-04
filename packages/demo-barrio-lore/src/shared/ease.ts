/** Easings (siempre suaves; nada lineal a la vista). */

export type EaseFn = (t: number) => number;

export const EASE = Object.freeze({
  entrada: (t: number) => t * t * t,
  salida: (t: number) => 1 - Math.pow(1 - t, 3),
  suave: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  seno: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  latido: (t: number) => {
    const s = Math.sin(Math.PI * t);
    return s * s;
  },
  lineal: (p: number) => p,
  entradaCuad: (p: number) => p * p,
  salidaCubica: (p: number) => 1 - Math.pow(1 - p, 3),
  salidaQuinta: (p: number) => 1 - Math.pow(1 - p, 5),
  suaveCubica: (p: number) =>
    p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  suaveSeno: (p: number) => -(Math.cos(Math.PI * p) - 1) / 2,
  salidaAtras: (p: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
  salidaElastica: (p: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    return Math.pow(2, -9 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
  },
  ascenso: (p: number) =>
    p < 0.28
      ? (1 - Math.pow(1 - p / 0.28, 3)) * 0.16
      : 0.16 + Math.pow((p - 0.28) / 0.72, 2.1) * 0.84,
} as const);

/** Alias histórico (ciudad builders). */
export const facil = EASE;

/** Alias usado por FlujoFx (port del game). */
export const EASE_FLUJO = EASE;

export const easeOutCubic = EASE.salida;

export const pinza = (v: number, a: number, b: number) =>
  v < a ? a : v > b ? b : v;
