/**
 * Selección de pieza Ónfalo desde `@zeus/onfalo-fixture` (registry).
 */

import { piezaId, type PiezaOnfalo } from '@h-sdk/core';
import { verifySeal } from '@zeus/onfalo-fixture';

export function seleccionarPiezaOnfaloSellada():
  | { ok: true; pieza: PiezaOnfalo; identity: string }
  | { ok: false; error: string } {
  const seal = verifySeal();
  if (!seal.allSealed || seal.pieces.length === 0) {
    return {
      ok: false,
      error: 'onfalo: sello incompleto o sin piezas (verifySeal)',
    };
  }
  const p = seal.pieces.find((x) => x.sealed) ?? seal.pieces[0];
  if (!p?.sealed) {
    return { ok: false, error: 'onfalo: ninguna pieza sealed' };
  }
  return {
    ok: true,
    identity: seal.identity,
    pieza: {
      id: piezaId(p.id),
      mediaType: p.mediaType,
      size: p.size,
      sha256: p.sha256,
    },
  };
}
