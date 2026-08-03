/**
 * Sustantivos del mundo H. Regla de la corrección de rumbo
 * (`design/RECAP-SPEC-DEMO.md`): cada elemento lleva la fuente de la que se
 * deriva. Lo que no se derive, no entra — por eso este fichero es corto y
 * los huecos están marcados PENDIENTE en vez de rellenados a ojo.
 *
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
 * Los dos lados de la ceremonia H·M — RECAP («el juego Prueba-H-M») y
 * `design/ARQUITECTURA-DEMO-R2.md` §W-CEREMONIA-REAL(3): «dos cadenas H/ y M/».
 */
export type Lado = 'H' | 'M';

/**
 * Pieza del Ónfalo. Campos tomados del manifiesto sellado real
 * (`packages/game-prueba-hm/assets/onfalo/source.manifest.json`), no inventados.
 * H las lee; no las produce (ADR 0002: nunca lengua ni notaría).
 */
export interface PiezaOnfalo {
  readonly id: PiezaId;
  readonly mediaType: string;
  readonly size: number;
  readonly sha256: string;
}

/**
 * Entrada de cadena de evidencia. Forma literal de
 * `design/ARQUITECTURA-DEMO-R2.md` §W-CEREMONIA-REAL(3):
 * `{step, verb, object, causalDigest, wireDigest, activityId, side}`.
 * Se conservan los nombres de campo del contrato para que el round-trip con
 * `chain.ndjson` sea identidad.
 */
export interface EntradaCadena {
  readonly step: number;
  readonly verb: string;
  readonly object: string;
  readonly causalDigest: string;
  readonly wireDigest: string;
  readonly activityId: string;
  readonly side: Lado;
}

/** Cadena de un lado: entradas en orden de emisión. */
export type Cadena = readonly EntradaCadena[];

/**
 * Referencia a una unit de la DocumentMachine del barrio Lore
 * (RECAP · «Materia»; backlog H12).
 *
 * PENDIENTE: el tipestate de la unit y su proyección a cuerpo/clips no está
 * medido todavía — se deriva del catálogo real, no de una lista a mano. Hasta
 * esa medición solo existe la referencia.
 */
export interface UnidadRef {
  readonly id: UnidadId;
  readonly barrio: BarrioId;
}

/**
 * Estado del acople con el exterior. ALEPH-H: «replay ≠ conectado, jamás
 * fallback silencioso». Todo puerto que pueda degradar lo declara con esto.
 */
export type Acople = 'conectado' | 'replay';
