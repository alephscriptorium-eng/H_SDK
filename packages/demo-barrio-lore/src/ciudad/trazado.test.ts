import { describe, expect, test } from 'bun:test';
import mapa from '../../assets/mapa/mapa.json';
import { BARRIO_DESTACADO_ID } from '../fixtures/barrio-lore.ts';
import {
  calcularTrazado,
  gamemapDesdeMapa,
  punto3,
  repartir,
  semilla,
  type MapaData,
} from './trazado.ts';

const mapaFixture = mapa as MapaData;

describe('semilla + repartir', () => {
  test('semilla es determinista', () => {
    expect(semilla('document-machine-sdk')).toBe(semilla('document-machine-sdk'));
    expect(semilla('a')).not.toBe(semilla('b'));
  });

  test('repartir suma n', () => {
    expect(repartir(7, [1, 2, 3]).reduce((s, v) => s + v, 0)).toBe(7);
    expect(repartir(1, [5, 5])).toEqual([1, 0]);
  });
});

describe('calcularTrazado', () => {
  test('fixture mapa: 7 holones, 6 distritos con meseta, 24 barrios posicionados', () => {
    const t = calcularTrazado(mapaFixture);
    expect(t.holones).toHaveLength(7);
    expect(t.mesetas.filter((m) => !m.vacia)).toHaveLength(6);
    expect(t.barrios.size).toBe(24);

    let posicionados = 0;
    for (const b of t.barrios.values()) {
      if (b.radio !== undefined && b.angulo !== undefined) posicionados++;
    }
    expect(posicionados).toBe(24);
  });

  test('notaría en holón método (07)', () => {
    const t = calcularTrazado(mapaFixture);
    expect(t.notaria.holon?.runtimeKind).toBe('metodo');
    expect(t.notaria.radio).toBeGreaterThan(0);
    expect(t.notaria.elevacion).toBeGreaterThan(0);
    expect(t.notaria.altura).toBe(7.6);
  });

  test('barrio destacado tiene coordenadas polares', () => {
    const t = calcularTrazado(mapaFixture);
    const b = t.barrios.get(BARRIO_DESTACADO_ID);
    expect(b).toBeDefined();
    expect(b!.radio).toBeGreaterThan(0);
    expect(b!.angulo).toBeDefined();
    expect(b!.distrito).toBe('lore-voz');
  });

  test('determinista con mismo mapa', () => {
    const a = calcularTrazado(mapaFixture);
    const b = calcularTrazado(mapaFixture);
    const ba = a.barrios.get(BARRIO_DESTACADO_ID)!;
    const bb = b.barrios.get(BARRIO_DESTACADO_ID)!;
    expect(ba.radio).toBe(bb.radio);
    expect(ba.angulo).toBe(bb.angulo);
    expect(a.notaria.ang).toBe(b.notaria.ang);
  });

  test('punto3 convención z negativa', () => {
    const p = punto3(10, Math.PI / 2, 3);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBe(3);
    expect(p.z).toBeCloseTo(-10, 5);
  });
});

describe('gamemapDesdeMapa', () => {
  test('topología mínima startpack: plaza, zigurat, anclas por barrio', () => {
    const trazado = calcularTrazado(mapaFixture);
    const gm = gamemapDesdeMapa(mapaFixture, trazado);

    expect(gm.nodos.plaza).toBeDefined();
    expect(gm.nodos.plaza.role).toBe('gobierna');
    expect(gm.nodos.zigurat).toBeDefined();
    expect(gm.gobierno.gobierna).toBe('plaza');
    expect(gm.gobierno.opera).toBe('zigurat');

    const anclaIds = Object.keys(gm.anclas);
    expect(anclaIds).toHaveLength(24);
    expect(gm.anclas[`ancla-${BARRIO_DESTACADO_ID}`]).toBeDefined();
    expect(gm.anclas[`ancla-${BARRIO_DESTACADO_ID}`].parent).toBe('lore-voz');

    const enlaces = Object.values(gm.enlaces);
    expect(enlaces.some((e) => e.id === 'calle-plaza-zigurat')).toBe(true);
    expect(enlaces.some((e) => e.dry === 'mcp-vivos')).toBe(true);
  });

  test('dry de calle configurable', () => {
    const trazado = calcularTrazado(mapaFixture);
    const gm = gamemapDesdeMapa(mapaFixture, trazado, {
      dryCalle: { 'lore-voz': 'custom-dry' },
    });
    expect(Object.values(gm.enlaces).some((e) => e.dry === 'custom-dry')).toBe(
      true,
    );
  });
});
