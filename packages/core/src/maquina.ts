/**
 * Máquina de estados de la experiencia H.
 * Transiciones ilegales → `Resultado` error explícito (nunca fallthrough).
 */

import { err, ok, type Resultado } from './resultado.ts';
import type { EstadoExperiencia, PiezaId } from './dominio.ts';
import { esTerminal } from './dominio.ts';

/** Eventos que avanzan, bloquean o fallan la experiencia. */
export type EventoExperiencia =
  | { readonly tipo: 'ciudad_confirmada' }
  | { readonly tipo: 'lore_alcanzado' }
  | { readonly tipo: 'barrio_despertado' }
  | { readonly tipo: 'delta_iniciada' }
  | { readonly tipo: 'onfalo_seleccionado'; readonly pieza: PiezaId }
  | { readonly tipo: 'analisis_listo' }
  | { readonly tipo: 'linea_materializada' }
  | { readonly tipo: 'evidencia_verificada' }
  | { readonly tipo: 'completar' }
  | { readonly tipo: 'fallo'; readonly motivo: string }
  | { readonly tipo: 'contrato_ausente'; readonly superficie: string };

const FELIZ: Readonly<
  Record<string, { readonly desde: EstadoExperiencia; readonly hacia: EstadoExperiencia }>
> = {
  ciudad_confirmada: { desde: 'idle', hacia: 'ciudad_connected' },
  lore_alcanzado: { desde: 'ciudad_connected', hacia: 'lore_reached' },
  barrio_despertado: { desde: 'lore_reached', hacia: 'barrio_awake' },
  delta_iniciada: { desde: 'barrio_awake', hacia: 'delta_running' },
  onfalo_seleccionado: { desde: 'delta_running', hacia: 'onfalo_selected' },
  analisis_listo: { desde: 'onfalo_selected', hacia: 'analyzed' },
  linea_materializada: { desde: 'analyzed', hacia: 'line_materialized' },
  evidencia_verificada: {
    desde: 'line_materialized',
    hacia: 'evidence_verified',
  },
  completar: { desde: 'evidence_verified', hacia: 'complete' },
};

export interface TransicionOk {
  readonly estado: EstadoExperiencia;
  readonly motivo?: string;
  readonly superficie?: string;
  readonly pieza?: PiezaId;
}

/**
 * Aplica un evento. Camino ilegal o estado terminal → error explícito.
 */
export function transicionar(
  estado: EstadoExperiencia,
  evento: EventoExperiencia,
): Resultado<TransicionOk> {
  if (esTerminal(estado)) {
    return err(`transicion_ilegal: estado terminal '${estado}' no acepta '${evento.tipo}'`);
  }

  if (evento.tipo === 'fallo') {
    return ok({ estado: 'error', motivo: evento.motivo });
  }

  if (evento.tipo === 'contrato_ausente') {
    return ok({
      estado: 'pending_external_contract',
      superficie: evento.superficie,
    });
  }

  const regla = FELIZ[evento.tipo];
  if (!regla) {
    return err(`transicion_ilegal: evento desconocido '${(evento as EventoExperiencia).tipo}'`);
  }

  if (estado !== regla.desde) {
    return err(
      `transicion_ilegal: '${evento.tipo}' exige '${regla.desde}', actual '${estado}'`,
    );
  }

  if (evento.tipo === 'onfalo_seleccionado') {
    return ok({ estado: regla.hacia, pieza: evento.pieza });
  }

  return ok({ estado: regla.hacia });
}

export interface MaquinaExperiencia {
  readonly estado: EstadoExperiencia;
  readonly motivo?: string;
  readonly superficie?: string;
  readonly pieza?: PiezaId;
}

export function crearMaquina(): MaquinaExperiencia {
  return { estado: 'idle' };
}

/** Avanza la máquina; conserva motivo/superficie/pieza del último ok. */
export function aplicar(
  maquina: MaquinaExperiencia,
  evento: EventoExperiencia,
): Resultado<MaquinaExperiencia> {
  const r = transicionar(maquina.estado, evento);
  if (!r.ok) return r;
  return ok({
    estado: r.valor.estado,
    motivo: r.valor.motivo,
    superficie: r.valor.superficie,
    pieza: r.valor.pieza ?? maquina.pieza,
  });
}
