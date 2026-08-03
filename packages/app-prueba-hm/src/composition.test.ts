/**
 * Composition: delta sólo tras reach/wake; pending_external visible.
 */

import { describe, expect, test } from 'bun:test';
import { actorId, ok } from '@h-sdk/core';
import {
  arrancarComposition,
  type OpcionesComposition,
} from './composition.ts';
import { URI_ESCENA, URI_ESTADO, URI_EVIDENCIA } from './resources.ts';

function baseDeps(
  overrides: Partial<OpcionesComposition> = {},
): OpcionesComposition {
  return {
    actor: actorId('actor-comp-test'),
    emisor: { emitir: async () => undefined },
    observarCiudad: () => ({ stateId: 'S1', ledgerId: 'L1' }),
    observarReachWake: () => ({
      loreAlcanzado: true,
      barrioDespertado: true,
    }),
    anclaLore: { anchorId: 'lore-dm' },
    wake: { tool: 'document-machine' },
    abridorDelta: {
      abrir: async () => ok({ sesionId: 'ses-1' }),
    },
    saludM: () => ({ connected: true, lastStateTs: 1 }),
    factoryM: async () => ({
      bridge: {
        connected: true,
        lastStateTs: () => 1,
      },
      close: async () => undefined,
    }),
    ...overrides,
  };
}

describe('composition · gates de orden', () => {
  test('sin reach/wake no abre escena delta', async () => {
    const handle = await arrancarComposition(
      baseDeps({
        observarReachWake: () => ({
          loreAlcanzado: false,
          barrioDespertado: false,
        }),
      }),
    );
    const escena = JSON.parse(handle.readResource(URI_ESCENA)!.text) as {
      sesionId: string | null;
      disponible: boolean;
    };
    expect(escena.disponible).toBe(false);
    expect(escena.sesionId).toBeNull();
    expect(handle.maquina.estado).not.toBe('delta_running');
    expect(handle.maquina.estado).not.toBe('complete');
  });

  test('sin factory M → pending_external visible, no complete', async () => {
    const handle = await arrancarComposition(
      baseDeps({ factoryM: null }),
    );
    const estado = JSON.parse(handle.readResource(URI_ESTADO)!.text) as {
      estado: string;
      pending_external: string[];
    };
    expect(estado.estado).toBe('pending_external_contract');
    expect(estado.pending_external.length).toBeGreaterThan(0);
    expect(estado.estado).not.toBe('complete');
    const evid = JSON.parse(handle.readResource(URI_EVIDENCIA)!.text) as {
      verificado: boolean;
      pending_external: string | null;
    };
    expect(evid.verificado).toBe(false);
    expect(evid.pending_external).toBeTruthy();
  });

  test('camino hasta delta + E pending: no complete', async () => {
    const handle = await arrancarComposition(baseDeps());
    expect(handle.maquina.estado).toBe('pending_external_contract');
    const escena = JSON.parse(handle.readResource(URI_ESCENA)!.text) as {
      sesionId: string | null;
      disponible: boolean;
    };
    expect(escena.disponible).toBe(true);
    expect(escena.sesionId).toBe('ses-1');
    const estado = JSON.parse(handle.readResource(URI_ESTADO)!.text) as {
      estado: string;
      pending_external: string[];
    };
    expect(estado.estado).not.toBe('complete');
    expect(
      estado.pending_external.some((p) => p.includes('pending_external')),
    ).toBe(true);
  });
});
