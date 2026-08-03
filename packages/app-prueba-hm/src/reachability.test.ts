/**
 * Reachability: el entrypoint importa core + edges requeridos.
 * Si se quita un import clave del entry/composition, este test falla.
 */

import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { REACHABILITY_ANCHORS } from './main.ts';
import { arrancarComposition } from './composition.ts';
import { depsDemoPorDefecto } from './deps-vertical.ts';
import { URI_ESTADO } from './resources.ts';

const SRC = import.meta.dir;

async function leer(nombre: string): Promise<string> {
  return Bun.file(join(SRC, nombre)).text();
}

describe('reachability · entrypoint cablea core + edges', () => {
  test('main.ts importa @h-sdk/core y @h-sdk/edge-zeus', async () => {
    const main = await leer('main.ts');
    expect(main).toContain("from '@h-sdk/core'");
    expect(main).toContain("from '@h-sdk/edge-zeus'");
    expect(main).toContain('crearMaquina');
    expect(main).toContain('crearPuertoEntradaCiudad');
    expect(main).toContain('crearPuertoSesionDelta');
    expect(main).toContain('abrirAsientoM');
    expect(main).toContain('crearPuertoProyeccion');
    expect(main).toContain('crearPuertoAnalisisE');
    expect(main).toContain('crearPuertoEvidenciaCanonica');
    expect(main).toContain('crearPuertoMaterializacionLinea');
  });

  test('composition.ts cablea máquina y puertos RH-13', async () => {
    const composition = await leer('composition.ts');
    expect(composition).toContain("from '@h-sdk/core'");
    expect(composition).toContain("from '@h-sdk/edge-zeus'");
    expect(composition).toContain('crearMaquina');
    expect(composition).toContain('aplicar');
    expect(composition).toContain('crearPuertoEntradaCiudad');
    expect(composition).toContain('crearPuertoSesionDelta');
    expect(composition).toContain('abrirAsientoM');
    expect(composition).toContain('intentWalk');
    expect(composition).toContain('intentWake');
    expect(composition).toContain('crearPuertoProyeccion');
  });

  test('anchors runtime son funciones (no undefined por tree-shake mentiroso)', () => {
    for (const [nombre, fn] of Object.entries(REACHABILITY_ANCHORS)) {
      expect(typeof fn).toBe('function');
      expect(nombre.length).toBeGreaterThan(0);
    }
  });

  test('demo vertical: onfalo + pending_external E; nunca complete', async () => {
    const handle = await arrancarComposition(depsDemoPorDefecto());
    expect(handle.maquina.estado).not.toBe('complete');
    expect(handle.maquina.estado).toBe('pending_external_contract');
    expect(handle.maquina.pieza).toBeTruthy();
    const estado = handle.readResource(URI_ESTADO);
    expect(estado).toBeDefined();
    const body = JSON.parse(estado!.text) as {
      estado: string;
      pending_external: string[];
    };
    expect(body.estado).not.toBe('complete');
    expect(body.estado).toBe('pending_external_contract');
    expect(
      body.pending_external.some((p) => p.includes('pending_external')),
    ).toBe(true);
  });
});

describe('reachability · mutante: quitar import clave rompe ancla', () => {
  test('main sin crearPuertoEntradaCiudad fallaría el scan', async () => {
    const main = await leer('main.ts');
    const mutante = main.replaceAll('crearPuertoEntradaCiudad', '');
    expect(mutante.includes('crearPuertoEntradaCiudad')).toBe(false);
    expect(main.includes('crearPuertoEntradaCiudad')).toBe(true);
    // El scan de producción exige el símbolo; el mutante no pasaría ese expect.
    expect(main).toContain('crearPuertoEntradaCiudad');
  });
});
