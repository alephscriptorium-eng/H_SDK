/**
 * Resultado explícito — el core no lanza para lo esperable.
 *
 * Un puerto que puede fallar devuelve `Resultado`, nunca `undefined` mudo:
 * la degradación se declara (ALEPH-H · doble acople, «jamás fallback
 * silencioso»).
 */

export type Resultado<T, E = string> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(valor: T): Resultado<T, never> {
  return { ok: true, valor };
}

export function err<E>(error: E): Resultado<never, E> {
  return { ok: false, error };
}

export function esOk<T, E>(
  r: Resultado<T, E>,
): r is { readonly ok: true; readonly valor: T } {
  return r.ok;
}
