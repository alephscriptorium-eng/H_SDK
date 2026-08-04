import { describe, expect, test } from 'bun:test';
import { BARRIO_ESTADOS } from '@zeus/ciudad/contract';
import {
  claveAspecto,
  esVocabularioSalud,
  normalizarCausa,
  normalizarEstado,
  poseBaseParaClave,
  poseBaseParaTipestate,
  POSE_GLB,
  POSE_STICK,
  SALUD_A_TIPESTATE,
  saludATipestate,
} from './tipestate.ts';

describe('tipestate → clave de aspecto', () => {
  test('halted + fallo → haltedFallo', () => {
    expect(claveAspecto('halted', 'fallo')).toBe('haltedFallo');
  });

  test('halted + orden → haltedOrden', () => {
    expect(claveAspecto('halted', 'orden')).toBe('haltedOrden');
  });

  test('corriendo sin causa', () => {
    expect(claveAspecto('corriendo', null)).toBe('corriendo');
  });
});

describe('alias de estado', () => {
  test('inglés y español convergen', () => {
    expect(normalizarEstado('running')).toBe('corriendo');
    expect(normalizarEstado('LEASED')).toBe('arrendada');
    expect(normalizarEstado('recuperando')).toBe('recovering');
  });

  test('desconocido → null', () => {
    expect(normalizarEstado('fantasma')).toBeNull();
  });
});

describe('salud BARRIO_ESTADOS → tipestate', () => {
  test('cubre el vocabulario real del paquete', () => {
    for (const s of BARRIO_ESTADOS) {
      expect(SALUD_A_TIPESTATE[s]).toBeDefined();
      expect(esVocabularioSalud(s, BARRIO_ESTADOS)).toBe(true);
    }
  });

  test('vivo → corriendo', () => {
    expect(saludATipestate('vivo')).toEqual({ estado: 'corriendo', causa: null });
  });

  test('roto → halted + fallo', () => {
    expect(saludATipestate('roto')).toEqual({ estado: 'halted', causa: 'fallo' });
  });
});

describe('tipestate → pose base (GLB)', () => {
  const casos: Array<{
    estado: string;
    causa?: string;
    pose: string;
  }> = [
    { estado: 'declarada', pose: 'ALP_LOC_stop' },
    { estado: 'arrendada', pose: 'ALP_LOC_stop' },
    { estado: 'lista', pose: 'idle' },
    { estado: 'corriendo', pose: 'walk' },
    { estado: 'halted', causa: 'orden', pose: 'sit' },
    { estado: 'halted', causa: 'fallo', pose: 'HM_TERM_muerte' },
    { estado: 'recovering', pose: 'idle' },
  ];

  for (const { estado, causa, pose } of casos) {
    test(`${estado}${causa ? ` + ${causa}` : ''} → ${pose}`, () => {
      const e = normalizarEstado(estado);
      expect(e).not.toBeNull();
      const c =
        e === 'halted' ? normalizarCausa(causa ?? 'orden') : null;
      expect(poseBaseParaTipestate(e!, c, 'glb')).toBe(pose);
    });
  }
});

describe('tipestate → pose base (stick)', () => {
  test('halted fallo usa sit (sin pose terminal)', () => {
    expect(poseBaseParaClave('haltedFallo', 'stick')).toBe('sit');
  });

  test('declarada usa menu', () => {
    expect(poseBaseParaClave('declarada', 'stick')).toBe('menu');
  });
});

describe('tablas POSE_GLB / POSE_STICK', () => {
  test('todas las claves de aspecto tienen entrada en ambas tablas', () => {
    const claves = Object.keys(POSE_GLB);
    expect(Object.keys(POSE_STICK)).toEqual(claves);
    expect(claves.length).toBe(7);
  });
});
