/**
 * Tipestate → pose base del contrato puppet (GLB / stick).
 * Tabla pura portada de barrio.mjs; sin three ni DOM.
 */

export type Tipestate =
  | 'declarada'
  | 'arrendada'
  | 'lista'
  | 'corriendo'
  | 'halted'
  | 'recovering';

export type CausaHalt = 'orden' | 'fallo';

export type AspectKey =
  | 'declarada'
  | 'arrendada'
  | 'lista'
  | 'corriendo'
  | 'haltedOrden'
  | 'haltedFallo'
  | 'recovering';

/** Alias histórico (mount-barrio / L3 paralelo). */
export type AspectoClave = AspectKey;

export type PuppetKind = 'glb' | 'stick';

export type SaludBarrio = 'vivo' | 'latente' | 'muerto' | 'roto';

export type SaludMapping = {
  readonly estado: Tipestate;
  readonly causa: CausaHalt | null;
};

/** Alias de entrada → tipestate canónico. */
export const ALIAS_ESTADO: Readonly<Record<string, Tipestate>> = Object.freeze({
  declarada: 'declarada',
  declared: 'declarada',
  arrendada: 'arrendada',
  leased: 'arrendada',
  concedida: 'arrendada',
  lista: 'lista',
  ready: 'lista',
  preparada: 'lista',
  corriendo: 'corriendo',
  running: 'corriendo',
  ejecutando: 'corriendo',
  halted: 'halted',
  detenida: 'halted',
  parada: 'halted',
  recovering: 'recovering',
  recuperando: 'recovering',
  recuperada: 'recovering',
});

export const ALIAS_CAUSA: Readonly<Record<string, CausaHalt>> = Object.freeze({
  orden: 'orden',
  order: 'orden',
  ordenada: 'orden',
  parada: 'orden',
  fallo: 'fallo',
  fail: 'fallo',
  failure: 'fallo',
  error: 'fallo',
  corto: 'fallo',
});

/**
 * Lectura de `BARRIO_ESTADOS` (@zeus/ciudad/contract) sobre tipestate del cuerpo.
 */
export const SALUD_A_TIPESTATE: Readonly<Record<SaludBarrio, SaludMapping>> =
  Object.freeze({
    vivo: { estado: 'corriendo', causa: null },
    latente: { estado: 'lista', causa: null },
    muerto: { estado: 'halted', causa: 'orden' },
    roto: { estado: 'halted', causa: 'fallo' },
  });

/** Poses base GLB (contrato puppet / clip-map). */
export const POSE_GLB: Readonly<Record<AspectKey, string>> = Object.freeze({
  declarada: 'ALP_LOC_stop',
  arrendada: 'ALP_LOC_stop',
  lista: 'idle',
  corriendo: 'walk',
  haltedOrden: 'sit',
  haltedFallo: 'HM_TERM_muerte',
  recovering: 'idle',
});

/** STICK_POSES de view-kit: idle | walk | ride | swim | sit | menu. */
export const POSE_STICK: Readonly<Record<AspectKey, string>> = Object.freeze({
  declarada: 'menu',
  arrendada: 'menu',
  lista: 'idle',
  corriendo: 'walk',
  haltedOrden: 'sit',
  haltedFallo: 'sit',
  recovering: 'idle',
});

export function claveAspecto(
  estado: Tipestate,
  causa: CausaHalt | null,
): AspectKey {
  if (estado === 'halted') {
    return causa === 'fallo' ? 'haltedFallo' : 'haltedOrden';
  }
  return estado;
}

/** Alias de `claveAspecto` desde strings crudos (tipestate + causa). */
export function aspectoDeTipestate(
  estado: string,
  causa?: string | null,
): AspectKey | null {
  const e = normalizarEstado(estado);
  if (!e) return null;
  const c = e === 'halted' ? normalizarCausa(causa ?? 'orden') : null;
  return claveAspecto(e, c);
}

export function normalizarEstado(crudo: string): Tipestate | null {
  const k = String(crudo ?? '').toLowerCase();
  return ALIAS_ESTADO[k] ?? null;
}

export function normalizarCausa(crudo: string): CausaHalt {
  const k = String(crudo ?? 'orden').toLowerCase();
  return ALIAS_CAUSA[k] ?? 'orden';
}

export function esVocabularioSalud(
  crudo: string,
  barrioEstados?: readonly string[],
): boolean {
  const k = String(crudo ?? '').toLowerCase();
  if (barrioEstados) return barrioEstados.includes(k);
  return k in SALUD_A_TIPESTATE;
}

export function saludATipestate(crudo: string): SaludMapping | null {
  const k = String(crudo ?? '').toLowerCase() as SaludBarrio;
  return SALUD_A_TIPESTATE[k] ?? null;
}

/** Pose base del contrato puppet para la clave de aspecto. */
export function poseBaseParaClave(clave: AspectKey, kind: PuppetKind): string {
  return kind === 'glb' ? POSE_GLB[clave] : POSE_STICK[clave];
}

/** Alias de `poseBaseParaClave`. */
export function poseParaAspecto(
  tipo: PuppetKind,
  clave: AspectKey,
): string {
  return poseBaseParaClave(clave, tipo);
}

/** Tipestate (+ causa si halted) → clip/pose base. */
export function poseBaseParaTipestate(
  estado: Tipestate,
  causa: CausaHalt | null,
  kind: PuppetKind,
): string {
  return poseBaseParaClave(claveAspecto(estado, causa), kind);
}
