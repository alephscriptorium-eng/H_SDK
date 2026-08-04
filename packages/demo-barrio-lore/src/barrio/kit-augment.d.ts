/** Augmentaciones mínimas para subpaths de kit usados por BarrioScene. */
declare module '@zeus/ui-3d-kit/puppet/puppet.mjs' {
  export function loadPuppet(
    url: string,
    opts?: Record<string, unknown>,
  ): Promise<{
    object: import('three').Object3D;
    setBase: (pose: string) => boolean | void;
    playAdditive: (name: string) => void;
    update: (dt: number) => void;
    dispose?: () => void;
  }>;
}

declare module '@zeus/ui-3d-kit/puppet/clip-map.mjs' {
  export const DEFAULT_CLIP_MAPS: Record<string, Record<string, unknown>>;
}

declare module '@zeus/ui-3d-kit/core/animation-controller.mjs' {
  export function createAnimationController(): {
    createAnimation: (
      key: string,
      props: Array<{
        object: object;
        property: string;
        startValue?: number;
        endValue: number;
      }>,
      opts: {
        duration: number;
        easing?: string;
        onComplete?: () => void;
        onUpdate?: (p: number) => void;
      },
    ) => void;
    removeAnimation: (key: string) => void;
    update: () => void;
    start: () => void;
    dispose: () => void;
  };
}

declare module '@zeus/view-kit/stick-puppet.mjs' {
  export function createStickPuppet(opts?: {
    color?: import('three').Color;
  }): {
    object: import('three').Object3D;
    setBase: (pose: string) => boolean | void;
    playAdditive: (name: string) => void;
    update: (dt: number) => void;
    dispose?: () => void;
  };
}
