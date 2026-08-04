import { describe, expect, test } from 'bun:test';
import {
  validarBarrioConfig,
  validarCiudadConfig,
  validarConfigs,
} from './validate.ts';
import type { BarrioConfig, CiudadConfig, UnitDef } from './types.ts';
import {
  barrioBarrioLore,
  ciudadBarrioLore,
  fixtureBarrioLore,
} from '../fixtures/barrio-lore.ts';

const u = (id: string): UnitDef => ({
  id,
  nombre: id,
  tarea: 't',
  gesto: { glb: 'wave', stick: 'wave' },
  acento: 'oro',
});

describe('validarBarrioConfig', () => {
  test('fixture barrio-lore ok (ids únicos + FK leases)', () => {
    const r = validarBarrioConfig(barrioBarrioLore());
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  test('rechaza id duplicado', () => {
    const cfg: BarrioConfig = {
      unidades: [u('portal'), u('portal')],
    };
    const r = validarBarrioConfig(cfg);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('duplicado'))).toBe(true);
  });

  test('rechaza FK de lease inexistente', () => {
    const cfg: BarrioConfig = {
      unidades: [u('portal'), u('bartleby')],
      unidadesConLease: ['bartleby', 'cristalizador'],
    };
    const r = validarBarrioConfig(cfg);
    expect(r.ok).toBe(false);
    expect(
      r.issues.some((i) => i.path === 'unidadesConLease' && i.message.includes('cristalizador')),
    ).toBe(true);
  });

  test('rechaza roster vacío', () => {
    const r = validarBarrioConfig({ unidades: [] });
    expect(r.ok).toBe(false);
  });

  test('rechaza id vacío', () => {
    const r = validarBarrioConfig({
      unidades: [{ ...u('x'), id: '  ' }],
    });
    expect(r.ok).toBe(false);
  });
});

describe('validarCiudadConfig', () => {
  test('fixture ciudad ok', () => {
    const r = validarCiudadConfig(ciudadBarrioLore());
    expect(r.ok).toBe(true);
  });

  test('rechaza destacado vacío', () => {
    const cfg: CiudadConfig = { destacadoBarrioId: '' };
    expect(validarCiudadConfig(cfg).ok).toBe(false);
  });

  test('rechaza radio ≤ 0', () => {
    const cfg: CiudadConfig = {
      destacadoBarrioId: 'document-machine-sdk',
      radio: 0,
    };
    expect(validarCiudadConfig(cfg).ok).toBe(false);
  });
});

describe('validarConfigs + fixture', () => {
  test('fixtureBarrioLore completo ok', () => {
    const r = validarConfigs({
      ciudad: fixtureBarrioLore.ciudad,
      barrio: fixtureBarrioLore.barrio,
    });
    expect(r.ok).toBe(true);
    expect(fixtureBarrioLore.barrioId).toBe('document-machine-sdk');
    expect(fixtureBarrioLore.ciudad.destacadoBarrioId).toBe(
      fixtureBarrioLore.barrioId,
    );
  });

  test('leases del fixture son subconjunto del roster', () => {
    const ids = new Set(fixtureBarrioLore.barrio.unidades.map((x) => x.id));
    for (const lease of fixtureBarrioLore.barrio.unidadesConLease ?? []) {
      expect(ids.has(lease)).toBe(true);
    }
  });
});
