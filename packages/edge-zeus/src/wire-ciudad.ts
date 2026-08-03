/**
 * Wire real de Ciudad vía `@zeus/ciudad.makeIntent` / `EVENTS`.
 * Payloads: walk {anchorId|nodeId}, announce {message},
 * wake {tool, barrioId?, horseMode}. Sin payloads paralelos vetados.
 */

import { EVENTS, makeIntent } from '@zeus/ciudad';
import type { ActorId } from '@h-sdk/core';

export { EVENTS, makeIntent };

/** Walk: exactamente un ancla o un nodo (owner Ciudad). */
export type HaciaWalk =
  | { readonly anchorId: string; readonly nodeId?: never }
  | { readonly nodeId: string; readonly anchorId?: never };

export interface ArgsWake {
  readonly tool: string;
  readonly barrioId?: string;
  /** Modo horse del owner; default del wire Ciudad = stub. */
  readonly horseMode?: string;
}

/** Emisor outbound hacia la room/authority Ciudad (no transporte genérico). */
export interface EmisorCiudad {
  emitir(sobre: Record<string, unknown>): Promise<void>;
}

export function intentJoin(actor: ActorId): Record<string, unknown> {
  return makeIntent(actor, 'join', {});
}

export function intentWalk(
  actor: ActorId,
  hacia: HaciaWalk,
): Record<string, unknown> {
  if ('anchorId' in hacia && hacia.anchorId) {
    return makeIntent(actor, 'walk', { anchorId: hacia.anchorId });
  }
  return makeIntent(actor, 'walk', { nodeId: hacia.nodeId });
}

export function intentAnnounce(
  actor: ActorId,
  message: string,
): Record<string, unknown> {
  return makeIntent(actor, 'announce', { message });
}

/**
 * Wake emitido por el actor unido/posicionado (nunca actor sintético).
 * horseMode por defecto `stub` (wire Ciudad / player-mcp).
 */
export function intentWake(
  actor: ActorId,
  args: ArgsWake,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    tool: args.tool,
    horseMode: args.horseMode ?? 'stub',
  };
  if (args.barrioId !== undefined) payload.barrioId = args.barrioId;
  return makeIntent(actor, 'wake', payload);
}
