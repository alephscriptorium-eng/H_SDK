/**
 * Entrypoint MCP producto H→V.
 *
 * 1. Arranca composition (fail-closed; nunca finge complete).
 * 2. Proyecta AlmacenResources por Streamable HTTP `/mcp`.
 *
 * Uso:
 *   bun run mcp
 *   H_SDK_MCP_PORT=8765 bun run mcp
 *
 * Descubrimiento V (sin launcher):
 *   export H_SDK_MCP_HOST=127.0.0.1
 *   export H_SDK_MCP_PORT=<puerto impreso>
 */

import { arrancarComposition } from './composition.ts';
import { depsDemoPorDefecto } from './deps-vertical.ts';
import { ENV_HOST, ENV_PORT, catalogEntry } from './catalog.ts';
import { startMcpHttpServer } from './mcp-http.ts';
import { URI_ESTADO } from './resources.ts';

function envPort(): number | undefined {
  const raw = process.env[ENV_PORT];
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

async function main(): Promise<number> {
  const handle = await arrancarComposition(depsDemoPorDefecto());
  const snap = handle.resources.snapshot();
  const estado = snap[URI_ESTADO] as {
    estado?: string;
    pending_external?: string[];
  };

  if (estado.estado === 'complete') {
    console.error(
      'ABORT: composition declaró complete — transport no arranca (mentira)',
    );
    return 2;
  }

  const host = process.env[ENV_HOST]?.trim() || '127.0.0.1';
  const port = envPort() ?? 0;

  const mcp = await startMcpHttpServer({
    host,
    port,
    resources: handle.resources,
  });

  const entry = catalogEntry(mcp.port);
  const banner = {
    entrypoint: '@h-sdk/app-prueba-hm/mcp',
    maquina: handle.maquina.estado,
    mcp: {
      url: mcp.url,
      health: `http://${mcp.host}:${mcp.port}/mcp/health`,
      host: mcp.host,
      port: mcp.port,
    },
    catalogEntry: entry,
    discoverEnv: {
      [ENV_HOST]: mcp.host,
      [ENV_PORT]: String(mcp.port),
    },
    resources: handle.listResources().map((d) => d.uri),
    pending_external: estado.pending_external ?? [],
  };

  console.log(JSON.stringify(banner, null, 2));
  console.error(
    `[h-sdk mcp] listening ${mcp.url} · set ${ENV_HOST}=${mcp.host} ${ENV_PORT}=${mcp.port}`,
  );

  const shutdown = async (signal: string) => {
    console.error(`[h-sdk mcp] ${signal} — closing`);
    await mcp.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // Mantener proceso vivo.
  await new Promise<void>(() => undefined);
  return 0;
}

if (import.meta.main) {
  try {
    const code = await main();
    if (code !== 0) process.exit(code);
  } catch (err) {
    console.error(
      'ABORT mcp:',
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }
}
