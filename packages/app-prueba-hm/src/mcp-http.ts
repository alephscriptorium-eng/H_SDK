/**
 * Transport MCP producto H→V (Streamable HTTP, stateless).
 * Contrato alineado a MinimalMcpClient de V:
 * - POST `/mcp` JSON-RPC 2.0 · Accept application/json + text/event-stream
 * - GET/DELETE → 405 · Accept incompleto → 406
 * - Resources: h-sdk://experiencia/{estado,escena,evidencia} v0.1.0
 */

import * as http from 'node:http';
import type { AlmacenResources } from './resources.ts';
import {
  CATALOG_CAPABILITY,
  CATALOG_SERVER_ID,
  CATALOG_SERVER_NAME,
  type CatalogServerEntry,
} from './catalog.ts';

export const MCP_HTTP_PATH = '/mcp';
export const MCP_HEALTH_PATH = '/mcp/health';
export const MCP_PROTOCOL_VERSION = '2025-03-26';

export const SERVER_INFO = Object.freeze({
  name: 'h-sdk-prueba-hm',
  version: '0.1.0',
});

export interface McpHttpOptions {
  readonly host?: string;
  readonly port?: number;
  readonly resources: AlmacenResources;
}

export interface McpHttpServer {
  readonly host: string;
  readonly port: number;
  readonly url: string;
  readonly catalogEntry: CatalogServerEntry;
  close(): Promise<void>;
}

interface JsonRpcRequest {
  readonly jsonrpc?: string;
  readonly id?: number | string | null;
  readonly method?: string;
  readonly params?: { readonly uri?: string; readonly name?: string };
}

/**
 * Arranca HTTP MCP sobre un AlmacenResources ya poblado (post-composition).
 * Fail-closed: no inventa payloads; solo proyecta lo que el almacén tiene.
 */
export async function startMcpHttpServer(
  options: McpHttpOptions,
): Promise<McpHttpServer> {
  const host = options.host ?? '127.0.0.1';
  const portWanted = options.port ?? 0;
  const resources = options.resources;

  const server = http.createServer((req, res) => {
    const url = req.url ?? '';
    if (url === MCP_HEALTH_PATH && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          server: SERVER_INFO,
          capability: CATALOG_CAPABILITY,
        }),
      );
      return;
    }

    if (url !== MCP_HTTP_PATH) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed in stateless mode',
          },
          id: null,
        }),
      );
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const accept = String(req.headers.accept ?? '');
      if (
        !accept.includes('application/json') ||
        !accept.includes('text/event-stream')
      ) {
        res.statusCode = 406;
        res.end();
        return;
      }

      let body: unknown;
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        body = raw === '' ? undefined : JSON.parse(raw);
      } catch {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' },
            id: null,
          }),
        );
        return;
      }

      const rpc = (body ?? {}) as JsonRpcRequest;
      const reply = (payload: Record<string, unknown>) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({ jsonrpc: '2.0', id: rpc.id ?? null, ...payload }),
        );
      };

      switch (rpc.method) {
        case 'initialize':
          reply({
            result: {
              protocolVersion: MCP_PROTOCOL_VERSION,
              capabilities: { resources: {}, tools: {} },
              serverInfo: { ...SERVER_INFO },
            },
          });
          return;
        case 'notifications/initialized':
          // Stateless: ack vacío opcional; cliente V no lo exige.
          res.statusCode = 202;
          res.end();
          return;
        case 'resources/list':
          reply({
            result: {
              resources: resources.listResources().map((d) => ({
                uri: d.uri,
                name: d.name,
                mimeType: d.mimeType,
                description: `experiencia H ${d.name} v${d.version}`,
              })),
            },
          });
          return;
        case 'resources/read': {
          const uri = rpc.params?.uri;
          if (typeof uri !== 'string') {
            reply({
              error: { code: -32602, message: 'resources/read sin uri' },
            });
            return;
          }
          const contents = resources.readResource(uri);
          if (!contents) {
            reply({
              error: {
                code: -32002,
                message: `Resource not found: ${uri}`,
              },
            });
            return;
          }
          reply({
            result: {
              contents: [
                {
                  uri: contents.uri,
                  mimeType: contents.mimeType,
                  text: contents.text,
                },
              ],
            },
          });
          return;
        }
        case 'tools/list':
          // Sin tools de producto aún — lista vacía honesta (no Method not found).
          reply({ result: { tools: [] } });
          return;
        case 'tools/call':
          reply({
            error: {
              code: -32601,
              message: `Tool not found: ${rpc.params?.name ?? ''}`,
            },
          });
          return;
        default:
          reply({
            error: {
              code: -32601,
              message: `Method not found: ${rpc.method}`,
            },
          });
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(portWanted, host, () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address !== 'object') {
    server.close();
    throw new Error('mcp-http: sin dirección de escucha');
  }

  const port = address.port;
  const catalogEntry: CatalogServerEntry = {
    id: CATALOG_SERVER_ID,
    name: CATALOG_SERVER_NAME,
    port,
    workspace: 'packages/app-prueba-hm',
    capabilities: [CATALOG_CAPABILITY],
  };

  return {
    host,
    port,
    url: `http://${host}:${port}${MCP_HTTP_PATH}`,
    catalogEntry,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
