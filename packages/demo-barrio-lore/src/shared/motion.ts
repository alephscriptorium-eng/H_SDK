import { REDUCIDO_DURACION_K } from '../layout/tokens.ts';

/** `prefers-reduced-motion: reduce` (browser o override explícito). */
export function prefersReducedMotion(reducido?: boolean): boolean {
  if (reducido !== undefined) return reducido;
  try {
    return (
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/** Alias interno. */
export const menosMovimiento = prefersReducedMotion;

/** Escala duraciones cuando el usuario prefiere menos movimiento. */
export function escalaDuracion(segundos: number, reducido?: boolean): number {
  return prefersReducedMotion(reducido)
    ? segundos * REDUCIDO_DURACION_K
    : segundos;
}

/** Duración efectiva (s) con motion preference. */
export function duracionConMotion(
  segundos: number,
  reducido?: boolean,
): number {
  return prefersReducedMotion(reducido) ? 0 : segundos;
}

export const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
