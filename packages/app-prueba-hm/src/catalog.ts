/**
 * Entrada de catálogo que V descubre (discoverHExperienceServer).
 * Ids/capability alineados a v-sdk/src/experiencia/discover.ts.
 */

export const CATALOG_SERVER_ID = 'h-sdk' as const;
export const CATALOG_SERVER_NAME = 'prueba-hm' as const;
export const CATALOG_CAPABILITY = 'h.experiencia' as const;

/** Forma launcher://catalog.servers[] consumible por V. */
export interface CatalogServerEntry {
  readonly id: string;
  readonly name: string;
  readonly port: number;
  readonly workspace?: string;
  readonly capabilities: readonly string[];
}

/**
 * Env mínimo reproducible (sin launcher Zeus):
 *   H_SDK_MCP_HOST=127.0.0.1
 *   H_SDK_MCP_PORT=<puerto del server>
 *
 * V inyecta esta fila en el catálogo cuando ambas vars están set.
 */
export const ENV_HOST = 'H_SDK_MCP_HOST' as const;
export const ENV_PORT = 'H_SDK_MCP_PORT' as const;

export function catalogEntry(port: number): CatalogServerEntry {
  return {
    id: CATALOG_SERVER_ID,
    name: CATALOG_SERVER_NAME,
    port,
    workspace: 'packages/app-prueba-hm',
    capabilities: [CATALOG_CAPABILITY],
  };
}
