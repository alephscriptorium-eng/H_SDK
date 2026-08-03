/**
 * Deps del vertical RH-15: packs `@zeus/*` del registry (sin siblings).
 * Room viva opcional — stubs de createClient/connectAndJoin permiten
 * arrancar autoridad sin red; sessionId lo aporta arg-runtime@0.1.1.
 */

import {
  abridorDesdeStartArgRuntime,
  type AbridorRuntimeDelta,
  type EmisorCiudad,
  type FactoryArgPlayerMcp,
  type SaludM,
} from '@h-sdk/edge-zeus';
import {
  deltaV0,
  resolveFeeds,
  type ArgScene,
} from '@zeus/arg-domain';
import { startArgRuntime } from '@zeus/arg-runtime';
import { createArgPlayerMcp } from '@zeus/arg-player-mcp';
import { loadMockdatas } from '@zeus/mockdatas-ciudad';
import { loadOnfaloFixture } from '@zeus/onfalo-fixture';
import type { OpcionesComposition } from './composition.ts';
import { seleccionarPiezaOnfaloSellada } from './onfalo-pieza.ts';

/** Escena tipada G (deltaV0) marcada como configuración Lore de aceptación. */
export function escenaLoreAceptacion(): ArgScene {
  return {
    ...deltaV0,
    id: 'lore-aceptacion-v0',
  } as ArgScene;
}

/** Stubs room: authority-kit path sin socket real (`client.room` requerido). */
export function stubsRoomSinRed(): {
  createClient: (
    user: string,
    opts?: { room?: string },
  ) => {
    io: {
      id: string;
      on: (ev: string, cb: (...args: unknown[]) => void) => void;
      off: () => void;
      close: () => void;
    };
    room: (..._args: unknown[]) => void;
  };
  connectAndJoin: () => Promise<{
    room: string;
    socketId: string;
    zones: null;
  }>;
} {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    createClient(user, opts = {}) {
      const id = `stub-${user}-${opts.room ?? 'room'}`;
      return {
        io: {
          id,
          on(ev, cb) {
            const list = handlers.get(ev) ?? [];
            list.push(cb);
            handlers.set(ev, list);
          },
          off() {},
          close() {},
        },
        room() {
          /* noop publish — sin room viva */
        },
      };
    },
    async connectAndJoin() {
      return { room: 'arg-rh15', socketId: 'stub-socket', zones: null };
    },
  };
}

export function abridorRuntimeRegistry(opts?: {
  scene?: ArgScene;
  room?: string;
  user?: string;
}): AbridorRuntimeDelta {
  const scene = opts?.scene ?? escenaLoreAceptacion();
  const room = opts?.room ?? 'arg-rh15';
  const user = opts?.user ?? 'rh15-authority';
  const stubs = stubsRoomSinRed();
  const feeds = resolveFeeds({ mode: 'synthetic', seed: 15 });

  return abridorDesdeStartArgRuntime({
    startArgRuntime: async () => {
      const handle = await startArgRuntime({
        feeds,
        scene,
        user,
        room,
        installSignalHandlers: false,
        createClient: stubs.createClient as (...args: unknown[]) => unknown,
        connectAndJoin: stubs.connectAndJoin as (...args: unknown[]) => unknown,
        log: () => undefined,
        warn: () => undefined,
      });
      return handle as unknown as {
        sessionId?: string;
        id?: string;
        close?: () => Promise<void> | void;
        shutdown?: () => Promise<void> | void;
        [key: string]: unknown;
      };
    },
    runtimeOpts: {},
  });
}

/**
 * Factory M del pack tipado. Bridge inyectado con health completo;
 * `connect: false` evita room viva (fail-closed honesto sin fingir red).
 */
export function factoryMRegistry(): FactoryArgPlayerMcp {
  const scene = escenaLoreAceptacion();
  return async (options) => {
    const lastStateTs = Date.now();
    const bridge = options.bridge ?? {
      connected: true as boolean,
      lastStateTs: () => lastStateTs,
      actor: options.actor,
    };
    const scenePlayer = {
      ...((options.scene as ArgScene | undefined) ?? scene),
      labelset: [
        ...(((options.scene as ArgScene | undefined) ?? scene).labelset ?? []),
      ],
    };
    const handle = await createArgPlayerMcp({
      actor: options.actor,
      scene: scenePlayer,
      room: options.room ?? 'arg-rh15-m',
      port: options.port,
      host: options.host,
      bridge,
      connect: options.connect ?? false,
    });
    return {
      ...handle,
      bridge: handle.bridge as {
        connected?: boolean;
        lastStateTs?: () => number | null;
        lastState?: () => { ts?: number } | null;
        [key: string]: unknown;
      },
      close: async () => {
        await handle.close();
      },
    };
  };
}

export { seleccionarPiezaOnfaloSellada };

/** Observables Ciudad de aceptación (state/ledger confirmados). */
export function observablesCiudadAceptacion(): {
  stateId: string;
  ledgerId: string;
} {
  return { stateId: 'S-rh15', ledgerId: 'L-rh15' };
}

/**
 * Composition deps del vertical: packs registry + confirmaciones.
 * mockdatas se resuelve (volúmenes Lore) sin usarse como path de checkout.
 */
export function depsVerticalRegistry(
  overrides: Partial<OpcionesComposition> = {},
): OpcionesComposition {
  const mock = loadMockdatas();
  const onfalo = loadOnfaloFixture();
  if (!onfalo.allSealed) {
    throw new Error(`onfalo fixture no sellada: ${onfalo.identity}`);
  }
  // Ancla de resolución package (contraevidencia: no sibling path).
  void mock.volumesRoot;
  void onfalo.artifactRoot;

  let salud: SaludM = { connected: true, lastStateTs: Date.now() };
  const emisor: EmisorCiudad = {
    emitir: async () => undefined,
  };

  return {
    emisor,
    observarCiudad: observablesCiudadAceptacion,
    observarReachWake: () => ({
      loreAlcanzado: true,
      barrioDespertado: true,
    }),
    anclaLore: { anchorId: 'lore-document-machine' },
    wake: { tool: 'document-machine', barrioId: 'barrio-lore' },
    abridorDelta: abridorRuntimeRegistry(),
    saludM: () => salud,
    factoryM: async (opts) => {
      const factory = factoryMRegistry();
      const handle = await factory(opts);
      const bridge = handle.bridge as {
        lastStateTs?: () => number | null;
      };
      const ts =
        typeof bridge.lastStateTs === 'function'
          ? bridge.lastStateTs()
          : Date.now();
      salud = {
        connected: true,
        lastStateTs: typeof ts === 'number' ? ts : Date.now(),
      };
      return handle;
    },
    ...overrides,
  };
}

/** Alias demo: mismo vertical registry (RH-15). */
export function depsDemoPorDefecto(): OpcionesComposition {
  return depsVerticalRegistry();
}
