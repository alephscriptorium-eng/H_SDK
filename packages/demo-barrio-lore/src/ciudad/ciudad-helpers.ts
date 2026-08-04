import { HEX_KIT, PALETA } from '../theme/tokens.ts';
import type { MapaData } from './trazado.ts';
import type { CiudadScene as CiudadSceneContract } from '@zeus/ciudad/scene';
import type * as THREE_NS from 'three';

type ThreeModule = typeof THREE_NS;

export type TematizarCfg = {
  acento: number | THREE_NS.Color;
  trama?: number | THREE_NS.Color;
  fondo?: number | THREE_NS.Color;
  alfa?: number;
};

/** Re-tiñe geometría del kit a la paleta cerrada de la demo. */
export function tematizar(
  raiz: THREE_NS.Object3D,
  cfg: TematizarCfg = { acento: PALETA.oro },
): THREE_NS.Object3D {
  const { acento, trama = acento, fondo = PALETA.sepia, alfa = 1 } = cfg;
  const vistos = new Set<THREE_NS.Material>();
  raiz.traverse((o: THREE_NS.Object3D) => {
    if ('castShadow' in o) {
      (o as THREE_NS.Mesh).castShadow = false;
    }
    if ('receiveShadow' in o) {
      (o as THREE_NS.Mesh).receiveShadow = false;
    }
    const mats: THREE_NS.Material[] = Array.isArray((o as THREE_NS.Mesh).material)
      ? ((o as THREE_NS.Mesh).material as THREE_NS.Material[])
      : (o as THREE_NS.Mesh).material
        ? [(o as THREE_NS.Mesh).material as THREE_NS.Material]
        : [];
    for (const m of mats) {
      if (vistos.has(m)) continue;
      vistos.add(m);
      const std = m as THREE_NS.MeshStandardMaterial;
      if (std.color) {
        const hex = std.color.getHex();
        if (hex === HEX_KIT.MATRIZ) std.color.set(trama as number);
        else if (hex === HEX_KIT.CIAN) std.color.set(acento as number);
        else if (hex === HEX_KIT.VACIO || hex === HEX_KIT.ASIENTO) {
          std.color.set(fondo as number);
        }
      }
      if (std.emissive) {
        std.emissive.set(acento as number);
        std.emissiveIntensity = Math.min(std.emissiveIntensity ?? 0.1, 0.34);
      }
      std.transparent = true;
      std.opacity = (std.opacity ?? 1) * alfa;
    }
  });
  return raiz;
}

export async function resolverMapa(mapa: MapaData | string): Promise<MapaData> {
  if (mapa && typeof mapa === 'object' && Array.isArray((mapa as MapaData).barrios)) {
    return mapa as MapaData;
  }
  const url = typeof mapa === 'string' ? mapa : '/mapa.json';
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`[ciudad] no pude leer el mapa (${url}): ${r.status}`);
  return r.json() as Promise<MapaData>;
}

/** Sector anular extruido: la meseta de un distrito. */
export function geometriaMeseta(
  T: ThreeModule,
  rIn: number,
  rOut: number,
  a0: number,
  a1: number,
  grosor: number,
): THREE_NS.BufferGeometry {
  const forma = new T.Shape();
  forma.absarc(0, 0, rOut, a0, a1, false);
  forma.absarc(0, 0, rIn, a1, a0, true);
  forma.closePath();
  const geo = new T.ExtrudeGeometry(forma, {
    depth: grosor,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.2,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 64,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox!.max.y, 0);
  return geo;
}

export function texturaDegradadoVertical(
  T: ThreeModule,
): THREE_NS.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 4;
  lienzo.height = 256;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.74, 'rgba(255,255,255,0.55)');
  g.addColorStop(1.0, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

export function texturaDiscoBruma(T: ThreeModule): THREE_NS.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 256;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0.0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.42)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

export type EtiquetaOpciones = {
  color?: string;
  altura?: number;
  opacidad?: number;
};

export function crearEtiqueta(
  T: ThreeModule,
  texto: string,
  opciones: EtiquetaOpciones = {},
): THREE_NS.Sprite | null {
  if (typeof document === 'undefined') return null;
  const color = opciones.color || '#EAE0C8';
  const altura = opciones.altura ?? 1.4;
  const px = 72;
  const fuente = `600 ${px}px "Cascadia Mono", Consolas, ui-monospace, monospace`;
  const medidor = document.createElement('canvas').getContext('2d');
  if (!medidor) return null;
  medidor.font = fuente;
  const espaciado = `${Math.round(px * 0.09)}px`;
  if ('letterSpacing' in medidor) {
    (medidor as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      espaciado;
  }
  const ancho = Math.ceil(medidor.measureText(texto).width) + px;
  const alto = Math.ceil(px * 1.9);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  ctx.font = fuente;
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      espaciado;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(19,16,8,0.9)';
  ctx.shadowBlur = px * 0.55;
  ctx.fillStyle = color;
  ctx.fillText(texto, ancho / 2, alto / 2);

  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0,
    }),
  );
  sprite.scale.set(altura * (ancho / alto), altura, 1);
  return sprite;
}

export const colorCss = (c: THREE_NS.Color) => `#${c.getHexString()}`;
export const nombreCorto = (n: string) => String(n).split('(')[0]!.trim();

export function desecharArbol(raiz: THREE_NS.Object3D): void {
  raiz.traverse((o: THREE_NS.Object3D) => {
    const mesh = o as THREE_NS.Mesh;
    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }
    const mats: THREE_NS.Material[] = Array.isArray(mesh.material)
      ? (mesh.material as THREE_NS.Material[])
      : mesh.material
        ? [mesh.material as THREE_NS.Material]
        : [];
    for (const m of mats) {
      const mat = m as THREE_NS.Material & Record<string, unknown>;
      for (const clave of [
        'map',
        'alphaMap',
        'emissiveMap',
        'bumpMap',
        'normalMap',
      ]) {
        const t = mat[clave] as { dispose?: () => void } | undefined;
        if (t && typeof t.dispose === 'function') t.dispose();
      }
      if (typeof mat.dispose === 'function') mat.dispose();
    }
  });
  raiz.clear?.();
}

const CANDIDATOS = Object.freeze({
  scene: ['@zeus/ciudad/scene', '@zeus/ciudad/scene.mjs'],
  contract: ['@zeus/ciudad/contract', '@zeus/ciudad/contract.mjs'],
});

type CiudadSceneMod = {
  sceneFromGamemap: typeof import('@zeus/ciudad/scene').sceneFromGamemap;
  nodesReachable: typeof import('@zeus/ciudad/scene').nodesReachable;
};

type CiudadContractMod = {
  BARRIO_ESTADOS: readonly string[];
  SPAWN_NODE_ID: string;
};

async function primeroQueCargue<T extends Record<string, unknown>>(
  especificadores: readonly string[],
  requiere: readonly (keyof T)[],
): Promise<{ mod: T | null; esp: string | null; fallos: string[] }> {
  const fallos: string[] = [];
  for (const esp of especificadores) {
    try {
      const mod = (await import(/* @vite-ignore */ esp)) as T;
      const faltan = requiere.filter((k) => mod[k] === undefined);
      if (faltan.length === 0) return { mod, esp, fallos };
      fallos.push(`${esp}: sin ${faltan.join('/')}`);
    } catch (e) {
      fallos.push(`${esp}: ${(e as Error)?.message || e}`);
    }
  }
  return { mod: null, esp: null, fallos };
}

export type CargaCiudadReal = {
  scene: CiudadSceneMod | null;
  sceneEsp: string | null;
  contract: CiudadContractMod | null;
  contractEsp: string | null;
  motivos: Record<string, string>;
};

/** Import dinámico de `@zeus/ciudad/scene` y `contract` con frontera honesta. */
export async function cargarCiudadReal(): Promise<CargaCiudadReal> {
  const motivos: Record<string, string> = {};
  const s = await primeroQueCargue<CiudadSceneMod>(CANDIDATOS.scene, [
    'sceneFromGamemap',
    'nodesReachable',
  ]);
  if (!s.mod) {
    motivos.scene = `no resoluble → ${s.fallos.join(' · ')}`;
  }
  const c = await primeroQueCargue<CiudadContractMod>(CANDIDATOS.contract, [
    'BARRIO_ESTADOS',
    'SPAWN_NODE_ID',
  ]);
  if (!c.mod) {
    motivos.contract = `no resoluble → ${c.fallos.join(' · ')}`;
  }
  return {
    scene: s.mod,
    sceneEsp: s.esp,
    contract: c.mod,
    contractEsp: c.esp,
    motivos,
  };
}

export type { CiudadSceneContract };
