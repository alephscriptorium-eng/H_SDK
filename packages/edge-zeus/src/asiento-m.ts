/**
 * Asiento M: factory `@zeus/arg-player-mcp` / kit `@zeus/player-mcp-kit`.
 * Acople `conectado` exige health `connected === true` **y** `lastStateTs`
 * numérico presente. Omitir cualquiera ⇒ denegar (hostil-omite).
 */

import type { Acople } from '@h-sdk/core';
import { err, ok, type Resultado } from '@h-sdk/core';
import type { PlayerRoomBridge } from '@zeus/player-mcp-kit';

/** Salud mínima del bridge/health M (player-mcp-kit). */
export interface SaludM {
  readonly connected?: boolean;
  /** Epoch ms del último STATE; omitido/null ⇒ no conectado. */
  readonly lastStateTs?: number | null;
}

/**
 * Lectura de health del bridge (kit). `connected` puede faltar en mocks
 * hostil-omite — la ausencia deniega.
 */
export type BridgeM = {
  readonly connected?: PlayerRoomBridge['connected'];
  readonly lastStateTs?: PlayerRoomBridge['lastStateTs'];
  readonly lastState?: PlayerRoomBridge['lastState'];
};

/**
 * `true` solo si connected y lastStateTs son ambos presentes y válidos.
 * La ausencia de cualquiera deniega.
 */
export function saludMConectada(salud: SaludM): boolean {
  return (
    salud.connected === true &&
    typeof salud.lastStateTs === 'number' &&
    Number.isFinite(salud.lastStateTs)
  );
}

export function acopleDesdeSaludM(salud: SaludM): Acople {
  return saludMConectada(salud) ? 'conectado' : 'replay';
}

/** Lee salud desde un bridge player-mcp-kit (forma tipada del kit). */
export function leerSaludDesdeBridge(bridge: BridgeM): SaludM {
  let lastStateTs: number | null | undefined;
  if (typeof bridge.lastStateTs === 'function') {
    lastStateTs = bridge.lastStateTs();
  } else if (typeof bridge.lastState === 'function') {
    lastStateTs = bridge.lastState()?.ts ?? null;
  }
  return { connected: bridge.connected, lastStateTs };
}

export interface HandleAsientoM {
  readonly bridge: {
    readonly connected?: boolean;
    readonly lastStateTs?: () => number | null;
    readonly lastState?: () => { ts?: number } | null;
    [key: string]: unknown;
  };
  readonly close: () => Promise<void>;
  [key: string]: unknown;
}

export type FactoryArgPlayerMcp = (options: {
  actor: string;
  scene?: unknown;
  room?: string;
  port?: number;
  host?: string;
  bridge?: object;
  connect?: boolean;
}) => Promise<HandleAsientoM>;

export interface OpcionesAsientoM {
  readonly actor: string;
  readonly factory: FactoryArgPlayerMcp;
  readonly scene?: unknown;
  readonly room?: string;
  readonly port?: number;
  readonly host?: string;
  readonly bridge?: object;
  readonly connect?: boolean;
}

/**
 * Abre asiento M y exige health connected+lastStateTs.
 * Si la factory produce bridge sin ambos ⇒ error explícito (no OK por omisión).
 */
export async function abrirAsientoM(
  opciones: OpcionesAsientoM,
): Promise<Resultado<HandleAsientoM>> {
  const handle = await opciones.factory({
    actor: opciones.actor,
    scene: opciones.scene,
    room: opciones.room,
    port: opciones.port,
    host: opciones.host,
    bridge: opciones.bridge,
    connect: opciones.connect,
  });

  const salud = leerSaludDesdeBridge(handle.bridge);
  if (!saludMConectada(salud)) {
    await handle.close().catch(() => undefined);
    return err(
      'm: health incompleto — exige connected=true y lastStateTs numérico (hostil-omite)',
    );
  }

  return ok(handle);
}
