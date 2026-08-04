/**
 * Paleta única de la demo (sRGB). Unifica las tres copias del game
 * (ciudad / barrio / flujo / main).
 *
 * Claves canónicas: `verde` / `terracota` (ciudad).
 * Alias `ok` / `fallo` (barrio / flujo) apuntan a los mismos valores.
 */

export const PALETA = Object.freeze({
  /** Fondo / tierra. */
  sepia: 0x131008,
  /** Luz, texto. */
  tinta: 0xeae0c8,
  /** H · notaría. */
  oro: 0xe7b14c,
  /** M. */
  verdigris: 0x85baa9,
  /** Mock / simulacro. */
  violeta: 0xac97ce,
  /** Ok / éxito. */
  verde: 0x8fbf7f,
  /** Fallo. */
  terracota: 0xdb7a5d,
} as const);

export type ColorToken = keyof typeof PALETA;

/** Alias usados en barrio/flujo del game. */
export const PALETA_ALIAS = Object.freeze({
  ok: PALETA.verde,
  fallo: PALETA.terracota,
} as const);

export type ColorAlias = keyof typeof PALETA_ALIAS;

/** Hex CSS de la misma paleta (letreros canvas, portada, etc.). */
export const PALETA_CSS = Object.freeze({
  sepia: '#131008',
  tinta: '#EAE0C8',
  oro: '#E7B14C',
  verdigris: '#85BAA9',
  violeta: '#AC97CE',
  verde: '#8FBF7F',
  terracota: '#DB7A5D',
  ok: '#8FBF7F',
  fallo: '#DB7A5D',
} as const);

/**
 * Colores del kit `@zeus/ui-3d-kit` (stage cyberpunk-grid) para re-teñir
 * encima de la paleta cerrada sin tocar el paquete.
 */
export const HEX_KIT = Object.freeze({
  MATRIZ: 0x00ff41,
  CIAN: 0x00d4ff,
  VACIO: 0x050508,
  ASIENTO: 0x101418,
} as const);

/** Resuelve un token o alias a número sRGB. */
export function colorDe(
  nombre: ColorToken | ColorAlias,
  override?: Partial<Record<ColorToken, number>>,
): number {
  if (nombre === 'ok') return override?.verde ?? PALETA_ALIAS.ok;
  if (nombre === 'fallo') return override?.terracota ?? PALETA_ALIAS.fallo;
  return override?.[nombre] ?? PALETA[nombre];
}
