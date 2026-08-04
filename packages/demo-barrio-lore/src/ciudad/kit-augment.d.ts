/** Augmentaciones mínimas para exports runtime de @zeus/ui-3d-kit no listados en index.d.ts. */
declare module '@zeus/ui-3d-kit' {
  import type { Group, Object3D, Vector3 } from 'three';

  export function createNodeMesh(options?: Record<string, unknown>): Group;
  export function createAnchorMarker(options?: Record<string, unknown>): Group;
  export function createLinkCorridorBetween(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number },
    options?: Record<string, unknown>,
  ): Group;
  export function createTrajectoryManager(options?: Record<string, unknown>): {
    setScene(scene: Object3D): void;
    createMessageParticle(
      id: string,
      start: Vector3,
      end: Vector3,
      channel?: string,
      speed?: number,
    ): unknown;
    updateParticles(dt: number): void;
    dispose(): void;
  };
}
