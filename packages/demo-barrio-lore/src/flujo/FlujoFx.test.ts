import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';
import { REDUCIDO_DURACION_K } from '../layout/tokens.ts';
import { FlujoFx } from './FlujoFx.ts';

describe('FlujoFx', () => {
  test('constructor no lanza con mocks mínimos', () => {
    const scene = new THREE.Scene();
    const fx = new FlujoFx({
      three: THREE,
      scene,
      resolveAnchor: (id) => (id === 'portal' ? new THREE.Vector3(2, 1, 3) : null),
      reducido: true,
      acta: { titulo: 'ACTA-TEST', subtitulo: 'fixture' },
    });
    expect(fx.group.name).toBe('flujo');
    expect(fx.reducido).toBe(true);
    expect(scene.children.some((c) => c === fx.group)).toBe(true);
    fx.dispose();
  });

  test('reduced-motion acorta duraciones (duracionK)', () => {
    const fxNormal = new FlujoFx({ three: THREE, reducido: false });
    const fxReducido = new FlujoFx({ three: THREE, reducido: true });
    expect(fxNormal.reducido).toBe(false);
    expect(fxReducido.reducido).toBe(true);
    expect(fxNormal.duracionK).toBe(1);
    expect(fxReducido.duracionK).toBe(REDUCIDO_DURACION_K);
    expect(fxReducido.duracionK).toBeLessThan(fxNormal.duracionK);
    fxNormal.dispose();
    fxReducido.dispose();
  });

  test('efectos no lanzan con mocks (reducido)', () => {
    const scene = new THREE.Scene();
    const fx = new FlujoFx({
      three: THREE,
      scene,
      resolveAnchor: () => new THREE.Vector3(0, 1, 0),
      reducido: true,
    });
    fx.gota({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 });
    fx.cristalLinea({ x: 0, y: 0, z: 0 });
    fx.llaveDesciende({ x: 0, y: 1, z: 0 });
    fx.actaAsciende({ x: 0, y: 1, z: 0 });
    fx.cremallera(1, 'H');
    for (let i = 0; i < 400; i++) fx.update(0.02);
    fx.dispose();
  });
});
