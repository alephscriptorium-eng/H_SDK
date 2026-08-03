/**
 * Sustantivos del dominio H (experiencia). Sin shapes Zeus/HUB.
 * Nada de aquí conoce IO, red, fs ni `@zeus/*`.
 */

/** Identificador opaco: un `string` no es intercambiable con otro por azar. */
export type Id<Marca extends string> = string & { readonly __marca: Marca };

export type BarrioId = Id<'barrio'>;
export type UnidadId = Id<'unidad'>;
export type PiezaId = Id<'pieza'>;
export type ActorId = Id<'actor'>;

export const barrioId = (raw: string): BarrioId => raw as BarrioId;
export const unidadId = (raw: string): UnidadId => raw as UnidadId;
export const piezaId = (raw: string): PiezaId => raw as PiezaId;
export const actorId = (raw: string): ActorId => raw as ActorId;

/**
 * Pieza del Ónfalo (artefacto sellado del owner). H la selecciona/lee;
 * no la produce (ADR 0002: nunca lengua ni notaría).
 */
export interface PiezaOnfalo {
  readonly id: PiezaId;
  readonly mediaType: string;
  readonly size: number;
  readonly sha256: string;
}

/**
 * Referencia a una unit de DocumentMachine / barrio Lore.
 * Tipestate completo: `<pendiente>` hasta catálogo pinneado del owner.
 */
export interface UnidadRef {
  readonly id: UnidadId;
  readonly barrio: BarrioId;
}

/**
 * Régimen de acople del adaptador. «replay ≠ conectado»; sin fallback
 * silencioso (ALEPH-H).
 */
export type Acople = 'conectado' | 'replay';

/**
 * Estados literales de la experiencia H (`plan.md` step 12).
 * `error` y `pending_external_contract` son terminales de fallo/bloqueo
 * explícitos — no hay fallthrough silencioso.
 */
export type EstadoExperiencia =
  | 'idle'
  | 'ciudad_connected'
  | 'lore_reached'
  | 'barrio_awake'
  | 'delta_running'
  | 'onfalo_selected'
  | 'analyzed'
  | 'line_materialized'
  | 'evidence_verified'
  | 'complete'
  | 'error'
  | 'pending_external_contract';

/** Orden del camino feliz (sin terminales de fallo). */
export const CAMINO_FELIZ: readonly EstadoExperiencia[] = [
  'idle',
  'ciudad_connected',
  'lore_reached',
  'barrio_awake',
  'delta_running',
  'onfalo_selected',
  'analyzed',
  'line_materialized',
  'evidence_verified',
  'complete',
] as const;

export function esTerminal(estado: EstadoExperiencia): boolean {
  return (
    estado === 'complete' ||
    estado === 'error' ||
    estado === 'pending_external_contract'
  );
}
