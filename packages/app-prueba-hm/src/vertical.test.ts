/**
 * Vertical RH-15: packs registry → onfalo_selected → pending_external E.
 */

import { describe, expect, test } from 'bun:test';
import { arrancarComposition } from './composition.ts';
import { depsVerticalRegistry } from './deps-vertical.ts';
import { URI_ESCENA, URI_ESTADO, URI_EVIDENCIA } from './resources.ts';
import { resolve } from 'node:path';

describe('vertical RH-15 · registry', () => {
  test('ciudad→wake→M→delta→onfalo→pending E; cero complete', async () => {
    const handle = await arrancarComposition(depsVerticalRegistry());
    expect(handle.maquina.estado).toBe('pending_external_contract');
    expect(handle.maquina.estado).not.toBe('complete');
    expect(handle.maquina.pieza).toBeTruthy();
    expect(String(handle.maquina.superficie)).toContain('pending_external');

    const escena = JSON.parse(handle.readResource(URI_ESCENA)!.text) as {
      disponible: boolean;
      sesionId: string | null;
    };
    expect(escena.disponible).toBe(true);
    expect(typeof escena.sesionId).toBe('string');
    expect(escena.sesionId!.length).toBeGreaterThan(0);

    const evid = JSON.parse(handle.readResource(URI_EVIDENCIA)!.text) as {
      verificado: boolean;
      pending_external: string | null;
    };
    expect(evid.verificado).toBe(false);
    expect(evid.pending_external).toBeTruthy();

    const estado = JSON.parse(handle.readResource(URI_ESTADO)!.text) as {
      pending_external: string[];
    };
    expect(
      estado.pending_external.some((p) => p.includes('provider-E')),
    ).toBe(true);
  });

  test('resolución onfalo/mockdatas no usa checkout g-sdk', async () => {
    const onfaloPkg = await import('@zeus/onfalo-fixture');
    const mockPkg = await import('@zeus/mockdatas-ciudad');
    const root = onfaloPkg.resolveArtifactRoot();
    const volumes = mockPkg.resolveVolumesRoot();
    const norm = (p: string) => resolve(p).toLowerCase().replace(/\\/g, '/');
    expect(norm(root)).not.toContain('/g-sdk/');
    expect(norm(volumes)).not.toContain('/g-sdk/');
    expect(norm(root)).toContain('node_modules');
    expect(onfaloPkg.verifySeal().allSealed).toBe(true);
  });

  test('sin abridor → pending visible, no complete', async () => {
    const handle = await arrancarComposition(
      depsVerticalRegistry({
        abridorDelta: null,
        motivoAusenciaDelta: 'abridor_ausente: test',
      }),
    );
    expect(handle.maquina.estado).not.toBe('complete');
    expect(['pending_external_contract', 'error']).toContain(
      handle.maquina.estado,
    );
  });
});
