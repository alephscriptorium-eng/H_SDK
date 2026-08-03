import { describe, expect, test } from 'bun:test';
import { aplicar, crearMaquina, transicionar } from './maquina.ts';
import { CAMINO_FELIZ, esTerminal, piezaId } from './dominio.ts';
import type { EstadoExperiencia } from './dominio.ts';
import type { EventoExperiencia } from './maquina.ts';

const FELIZ_EVENTOS: readonly EventoExperiencia[] = [
  { tipo: 'ciudad_confirmada' },
  { tipo: 'lore_alcanzado' },
  { tipo: 'barrio_despertado' },
  { tipo: 'delta_iniciada' },
  { tipo: 'onfalo_seleccionado', pieza: piezaId('pieza-fixture') },
  { tipo: 'analisis_listo' },
  { tipo: 'linea_materializada' },
  { tipo: 'evidencia_verificada' },
  { tipo: 'completar' },
];

describe('máquina experiencia H', () => {
  test('arranque en idle', () => {
    expect(crearMaquina().estado).toBe('idle');
  });

  test('camino feliz idle → complete', () => {
    let m = crearMaquina();
    for (const ev of FELIZ_EVENTOS) {
      const r = aplicar(m, ev);
      expect(r.ok).toBe(true);
      if (!r.ok) throw new Error(r.error);
      m = r.valor;
    }
    expect(m.estado).toBe('complete');
    expect(m.pieza).toBe(piezaId('pieza-fixture'));
    expect(esTerminal(m.estado)).toBe(true);
  });

  test('CAMINO_FELIZ declara los 10 estados literales', () => {
    expect(CAMINO_FELIZ).toEqual([
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
    ]);
  });

  test('transición ilegal no es fallthrough silencioso', () => {
    const r = transicionar('idle', { tipo: 'delta_iniciada' });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('esperado error');
    expect(r.error).toContain('transicion_ilegal');
    expect(r.error).toContain('barrio_awake');
  });

  test('salto de estado (skip) es ilegal', () => {
    const r = transicionar('ciudad_connected', { tipo: 'barrio_despertado' });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('esperado error');
    expect(r.error).toMatch(/transicion_ilegal/);
  });

  test('fallo → error explícito desde cualquier no-terminal', () => {
    const estados: EstadoExperiencia[] = [
      'idle',
      'ciudad_connected',
      'delta_running',
      'analyzed',
    ];
    for (const e of estados) {
      const r = transicionar(e, { tipo: 'fallo', motivo: 'probe' });
      expect(r.ok).toBe(true);
      if (!r.ok) throw new Error(r.error);
      expect(r.valor.estado).toBe('error');
      expect(r.valor.motivo).toBe('probe');
    }
  });

  test('contrato_ausente → pending_external_contract', () => {
    const r = transicionar('barrio_awake', {
      tipo: 'contrato_ausente',
      superficie: '@zeus/arg-domain',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(r.error);
    expect(r.valor.estado).toBe('pending_external_contract');
    expect(r.valor.superficie).toBe('@zeus/arg-domain');
  });

  test('desde terminal no se avanza (error explícito)', () => {
    for (const terminal of [
      'complete',
      'error',
      'pending_external_contract',
    ] as const) {
      const r = transicionar(terminal, { tipo: 'ciudad_confirmada' });
      expect(r.ok).toBe(false);
      if (r.ok) throw new Error('esperado error');
      expect(r.error).toContain('terminal');
    }
  });

  test('pending no se “completa” en silencio', () => {
    const r = aplicar(
      { estado: 'pending_external_contract', superficie: 'x' },
      { tipo: 'completar' },
    );
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('esperado error');
    expect(r.error).toContain('transicion_ilegal');
  });
});
