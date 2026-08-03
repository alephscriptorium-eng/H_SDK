/**
 * Implementación de `PuertoCiudad` (core) contra `@zeus/protocol`.
 *
 * Sin transporte el adaptador NO finge: se declara en `replay` y cada verbo
 * devuelve error explícito. Replay ≠ conectado (ALEPH-H).
 */

import { err, ok } from '@h-sdk/core';
import type { Acople, ActorId, BarrioId, PuertoCiudad, Resultado } from '@h-sdk/core';
import { intentDeCiudad } from './protocolo.ts';
import type { TransporteZeus } from './protocolo.ts';

export interface OpcionesPuertoCiudad {
  /** Ausente ⇒ el puerto queda en `replay`, dicho en voz alta. */
  readonly transporte?: TransporteZeus;
}

const SIN_TRANSPORTE = 'replay: sin transporte @zeus; el intent no salió';

export function crearPuertoCiudad(opciones: OpcionesPuertoCiudad = {}): PuertoCiudad {
  const { transporte } = opciones;

  const acople = (): Acople => (transporte ? 'conectado' : 'replay');

  async function emitir(
    actor: ActorId,
    intent: string,
    args: Record<string, unknown> = {},
  ): Promise<Resultado<void>> {
    if (!transporte) return err(SIN_TRANSPORTE);
    await transporte.enviar(intentDeCiudad(actor, intent, args));
    return ok(undefined);
  }

  return {
    nombre: '@h-sdk/edge-zeus/ciudad',
    acople,
    entrar: (actor) => emitir(actor, 'join'),
    caminar: (actor, destino) => emitir(actor, 'walk', { destino }),
    anunciar: (actor, mensaje) => emitir(actor, 'announce', { mensaje }),
    // `wake` sin actor: el verbo lo emite el barrio; el actorId de sistema es
    // PENDIENTE de medir contra el dominio real de `@zeus/ciudad`.
    despertar: (barrio: BarrioId) =>
      emitir('h-sdk' as ActorId, 'wake', { barrio, horseMode: 'stub' }),
  };
}
