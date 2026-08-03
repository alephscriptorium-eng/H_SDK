declare module '@zeus/onfalo-fixture' {
  export interface OnfaloPieceSeal {
    id: string;
    relativePath?: string;
    sourceRelativePath?: string;
    mediaType: string;
    size: number;
    sizeDeclared?: number;
    sha256: string;
    sha256Declared?: string;
    sealed: boolean;
  }

  export interface OnfaloSealResult {
    artifact: string;
    version: string;
    identity: string;
    hash: string | null;
    allSealed: boolean;
    pieceCount: number;
    pieces: OnfaloPieceSeal[];
    artifactRoot: string;
    packageRoot?: string;
    env?: { ZEUS_ONFALO_DIR: string };
  }

  export function resolveArtifactRoot(): string;
  export function loadManifest(): { manifestPath: string; manifest: unknown };
  export function verifySeal(): OnfaloSealResult;
  export function loadOnfaloFixture(): OnfaloSealResult;
}

declare module '@zeus/mockdatas-ciudad' {
  export function resolveVolumesRoot(): string;
  export function loadMockdatas(): {
    packageRoot: string;
    volumesRoot: string;
    game: string;
    env: { ZEUS_VOLUMES_ROOT: string };
  };
}
