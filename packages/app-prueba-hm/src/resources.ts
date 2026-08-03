/**
 * Resources MCP versionados (superficie propia H → V).
 * URIs estables; shapes H, no reexport de `@zeus/*`.
 */

export const RESOURCE_VERSION = '0.1.0';

export const URI_ESTADO = 'h-sdk://experiencia/estado' as const;
export const URI_ESCENA = 'h-sdk://experiencia/escena' as const;
export const URI_EVIDENCIA = 'h-sdk://experiencia/evidencia' as const;

export type ResourceUri =
  | typeof URI_ESTADO
  | typeof URI_ESCENA
  | typeof URI_EVIDENCIA;

export interface ResourceDescriptor {
  readonly uri: ResourceUri;
  readonly name: string;
  readonly mimeType: 'application/json';
  readonly version: string;
}

export interface ResourceContents {
  readonly uri: ResourceUri;
  readonly mimeType: 'application/json';
  readonly version: string;
  readonly text: string;
}

export interface PayloadEstado {
  readonly resourceVersion: string;
  readonly estado: string;
  readonly motivo?: string;
  readonly superficie?: string;
  readonly pending_external: readonly string[];
  readonly acople: {
    readonly ciudad: string;
    readonly delta: string;
    readonly m: string;
  };
}

export interface PayloadEscena {
  readonly resourceVersion: string;
  readonly sesionId: string | null;
  readonly disponible: boolean;
  readonly motivo?: string;
}

export interface PayloadEvidencia {
  readonly resourceVersion: string;
  readonly verificado: boolean;
  readonly evidenciaId: string | null;
  readonly pending_external: string | null;
  readonly motivo?: string;
}

const DESCRIPTORES: readonly ResourceDescriptor[] = [
  {
    uri: URI_ESTADO,
    name: 'estado',
    mimeType: 'application/json',
    version: RESOURCE_VERSION,
  },
  {
    uri: URI_ESCENA,
    name: 'escena',
    mimeType: 'application/json',
    version: RESOURCE_VERSION,
  },
  {
    uri: URI_EVIDENCIA,
    name: 'evidencia',
    mimeType: 'application/json',
    version: RESOURCE_VERSION,
  },
];

/** Almacén in-process; proyectado por `mcp-http.ts` / `bun run mcp`. */
export class AlmacenResources {
  private readonly cuerpos = new Map<ResourceUri, string>();

  constructor() {
    this.escribirEstado({
      resourceVersion: RESOURCE_VERSION,
      estado: 'idle',
      pending_external: [],
      acople: { ciudad: 'replay', delta: 'replay', m: 'replay' },
    });
    this.escribirEscena({
      resourceVersion: RESOURCE_VERSION,
      sesionId: null,
      disponible: false,
      motivo: 'sesion no abierta',
    });
    this.escribirEvidencia({
      resourceVersion: RESOURCE_VERSION,
      verificado: false,
      evidenciaId: null,
      pending_external: null,
      motivo: 'evidencia no verificada',
    });
  }

  listResources(): readonly ResourceDescriptor[] {
    return DESCRIPTORES;
  }

  readResource(uri: string): ResourceContents | undefined {
    if (
      uri !== URI_ESTADO &&
      uri !== URI_ESCENA &&
      uri !== URI_EVIDENCIA
    ) {
      return undefined;
    }
    const text = this.cuerpos.get(uri);
    if (text === undefined) return undefined;
    return {
      uri,
      mimeType: 'application/json',
      version: RESOURCE_VERSION,
      text,
    };
  }

  escribirEstado(payload: PayloadEstado): void {
    this.cuerpos.set(URI_ESTADO, JSON.stringify(payload));
  }

  escribirEscena(payload: PayloadEscena): void {
    this.cuerpos.set(URI_ESCENA, JSON.stringify(payload));
  }

  escribirEvidencia(payload: PayloadEvidencia): void {
    this.cuerpos.set(URI_EVIDENCIA, JSON.stringify(payload));
  }

  snapshot(): Record<ResourceUri, unknown> {
    return {
      [URI_ESTADO]: JSON.parse(this.cuerpos.get(URI_ESTADO) ?? '{}'),
      [URI_ESCENA]: JSON.parse(this.cuerpos.get(URI_ESCENA) ?? '{}'),
      [URI_EVIDENCIA]: JSON.parse(this.cuerpos.get(URI_EVIDENCIA) ?? '{}'),
    };
  }
}
