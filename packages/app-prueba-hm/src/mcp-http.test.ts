/**
 * Transport MCP producto: list/read resources reales post-composition.
 */

import { describe, expect, test } from 'bun:test';
import { actorId, ok, piezaId } from '@h-sdk/core';
import {
  arrancarComposition,
  type OpcionesComposition,
} from './composition.ts';
import {
  MCP_HEALTH_PATH,
  MCP_HTTP_PATH,
  MCP_PROTOCOL_VERSION,
  SERVER_INFO,
  startMcpHttpServer,
} from './mcp-http.ts';
import { CATALOG_CAPABILITY, CATALOG_SERVER_ID } from './catalog.ts';
import {
  RESOURCE_VERSION,
  URI_ESCENA,
  URI_ESTADO,
  URI_EVIDENCIA,
} from './resources.ts';

function baseDeps(): OpcionesComposition {
  return {
    actor: actorId('actor-mcp-test'),
    emisor: { emitir: async () => undefined },
    observarCiudad: () => ({ stateId: 'S1', ledgerId: 'L1' }),
    observarReachWake: () => ({
      loreAlcanzado: true,
      barrioDespertado: true,
    }),
    anclaLore: { anchorId: 'lore-dm' },
    wake: { tool: 'document-machine' },
    abridorDelta: {
      abrir: async () => ok({ sesionId: 'ses-mcp' }),
    },
    saludM: () => ({ connected: true, lastStateTs: 1 }),
    factoryM: async () => ({
      bridge: {
        connected: true,
        lastStateTs: () => 1,
      },
      close: async () => undefined,
    }),
    seleccionarPieza: () => ({
      ok: true as const,
      pieza: {
        id: piezaId('pieza-mcp'),
        mediaType: 'text/markdown',
        size: 1,
        sha256: 'abc',
      },
    }),
  };
}

async function rpc(
  url: string,
  method: string,
  params: Record<string, unknown> = {},
  id = 1,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

describe('mcp-http · transport producto H→V', () => {
  test('initialize + list + read tres URIs 0.1.0 (no complete)', async () => {
    const handle = await arrancarComposition(baseDeps());
    expect(handle.maquina.estado).not.toBe('complete');

    const mcp = await startMcpHttpServer({ resources: handle.resources });
    try {
      expect(mcp.catalogEntry.id).toBe(CATALOG_SERVER_ID);
      expect(mcp.catalogEntry.capabilities).toContain(CATALOG_CAPABILITY);

      const health = await fetch(
        `http://${mcp.host}:${mcp.port}${MCP_HEALTH_PATH}`,
      );
      expect(health.status).toBe(200);

      const init = await rpc(mcp.url, 'initialize', {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'test', version: '0' },
      });
      expect(init.status).toBe(200);
      const initResult = init.body.result as {
        serverInfo: { name: string };
        protocolVersion: string;
      };
      expect(initResult.serverInfo.name).toBe(SERVER_INFO.name);
      expect(initResult.protocolVersion).toBe(MCP_PROTOCOL_VERSION);

      const listed = await rpc(mcp.url, 'resources/list', {}, 2);
      const resources = (
        listed.body.result as {
          resources: Array<{ uri: string; mimeType: string }>;
        }
      ).resources;
      const uris = resources.map((r) => r.uri).sort();
      expect(uris).toEqual([URI_ESCENA, URI_ESTADO, URI_EVIDENCIA].sort());

      for (const uri of [URI_ESTADO, URI_ESCENA, URI_EVIDENCIA]) {
        const read = await rpc(mcp.url, 'resources/read', { uri }, 3);
        const contents = (
          read.body.result as {
            contents: Array<{ text: string; mimeType: string }>;
          }
        ).contents;
        expect(contents[0]?.mimeType).toBe('application/json');
        const payload = JSON.parse(contents[0]!.text) as {
          resourceVersion: string;
          estado?: string;
        };
        expect(payload.resourceVersion).toBe(RESOURCE_VERSION);
        if (uri === URI_ESTADO) {
          expect(payload.estado).not.toBe('complete');
        }
      }

      // Accept incompleto → 406 (contrato V).
      const bad = await fetch(`http://${mcp.host}:${mcp.port}${MCP_HTTP_PATH}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 9,
          method: 'resources/list',
          params: {},
        }),
      });
      expect(bad.status).toBe(406);
    } finally {
      await mcp.close();
    }
  });

  test('resource desconocido → JSON-RPC -32002', async () => {
    const handle = await arrancarComposition(baseDeps());
    const mcp = await startMcpHttpServer({ resources: handle.resources });
    try {
      const read = await rpc(mcp.url, 'resources/read', {
        uri: 'h-sdk://experiencia/nope',
      });
      const err = read.body.error as { code: number };
      expect(err.code).toBe(-32002);
    } finally {
      await mcp.close();
    }
  });
});
