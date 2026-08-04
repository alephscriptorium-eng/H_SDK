import type { PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  DESCENSO_WAYPOINTS,
  DUR_DESCENSO,
  ENCUADRE_AEREO,
  HONDURA,
  ORBIT_CEREMONIA,
  POSE_CEREMONIA,
  RAIL_TENSION,
} from '../layout/tokens.ts';
import { EASE, pinza } from '../shared/ease.ts';
import { prefersReducedMotion } from '../shared/motion.ts';
import type { FocusCityResult } from '../ciudad/CiudadScene.ts';

export type VueloOptions = {
  camera: PerspectiveCamera;
  controls?: OrbitControls;
  posiciones: Vector3[];
  miradas: Vector3[];
  dur: number;
  ease?: (t: number) => number;
  reducido?: boolean;
};

export type VueloActivo = {
  curvaPos: import('three').CatmullRomCurve3;
  curvaMira: import('three').CatmullRomCurve3;
  t: number;
  dur: number;
  ease: (t: number) => number;
  resolver: () => void;
};

export function encuadreAereo(
  rail: FocusCityResult,
  aspecto: number,
): { pos: Vector3; mira: Vector3 } {
  const k = pinza(
    ENCUADRE_AEREO.aspectoRef / aspecto,
    ENCUADRE_AEREO.kMin,
    ENCUADRE_AEREO.kMax,
  );
  return {
    pos: rail.camara.clone().multiplyScalar(k),
    mira: rail.mirarA.clone(),
  };
}

export function poseCeremonia(
  origen: Vector3,
  aspecto: number,
  THREE: typeof import('three'),
): { pos: Vector3; mira: Vector3 } {
  const k = pinza(
    POSE_CEREMONIA.aspectoRef / aspecto,
    POSE_CEREMONIA.kMin,
    POSE_CEREMONIA.kMax,
  );
  return {
    pos: origen
      .clone()
      .add(
        new THREE.Vector3(
          0,
          POSE_CEREMONIA.posYBase + POSE_CEREMONIA.posYPorK * (k - 1),
          POSE_CEREMONIA.posZBase * k,
        ),
      ),
    mira: origen
      .clone()
      .add(
        new THREE.Vector3(
          POSE_CEREMONIA.mira.x,
          POSE_CEREMONIA.mira.y,
          POSE_CEREMONIA.mira.z,
        ),
      ),
  };
}

export type VueloResult = {
  activo: VueloActivo | null;
  listo: Promise<void>;
};

export function volar(
  opts: VueloOptions,
  THREE: typeof import('three'),
): VueloResult {
  const {
    camera,
    controls,
    posiciones,
    miradas,
    dur,
    ease = EASE.suave,
    reducido,
  } = opts;

  const curvaPos = new THREE.CatmullRomCurve3(
    posiciones,
    false,
    'catmullrom',
    RAIL_TENSION,
  );
  const curvaMira = new THREE.CatmullRomCurve3(
    miradas,
    false,
    'catmullrom',
    RAIL_TENSION,
  );

  if (prefersReducedMotion(reducido) || dur <= 0) {
    camera.position.copy(posiciones[posiciones.length - 1]!);
    if (controls) {
      controls.target.copy(miradas[miradas.length - 1]!);
      controls.update();
    } else {
      camera.lookAt(miradas[miradas.length - 1]!);
    }
    return { activo: null, listo: Promise.resolve() };
  }

  if (controls) controls.enabled = false;

  let resolver: () => void = () => {};
  const listo = new Promise<void>((resolve) => {
    resolver = resolve;
  });

  const activo: VueloActivo = {
    curvaPos,
    curvaMira,
    t: 0,
    dur,
    ease,
    resolver,
  };

  return { activo, listo };
}

export function pasoVuelo(
  vuelo: VueloActivo,
  dt: number,
  camera: PerspectiveCamera,
  controls?: OrbitControls,
  miraScratch?: Vector3,
): boolean {
  vuelo.t = pinza(vuelo.t + dt / vuelo.dur, 0, 1);
  const e = vuelo.ease(vuelo.t);
  vuelo.curvaPos.getPointAt(e, camera.position);
  const mira = miraScratch ?? camera.position.clone();
  vuelo.curvaMira.getPointAt(e, mira);
  camera.lookAt(mira);
  if (controls) controls.target.copy(mira);
  if (vuelo.t >= 1) {
    if (controls) {
      controls.enabled = true;
      controls.update();
    }
    vuelo.resolver();
    return false;
  }
  return true;
}

export function waypointsDescenso(
  cameraPos: Vector3,
  controlsTarget: Vector3,
  ancla: Vector3,
  cima: Vector3,
  destino: { pos: Vector3; mira: Vector3 },
  THREE: typeof import('three'),
): { posiciones: Vector3[]; miradas: Vector3[] } {
  const afuera = new THREE.Vector3(ancla.x, 0, ancla.z);
  if (afuera.lengthSq() < 1e-6) afuera.set(1, 0, 0);
  afuera.normalize();

  return {
    posiciones: [
      cameraPos.clone(),
      cima
        .clone()
        .add(afuera.clone().multiplyScalar(DESCENSO_WAYPOINTS.cimaAfuera))
        .add(new THREE.Vector3(0, DESCENSO_WAYPOINTS.cimaY, 0)),
      new THREE.Vector3(
        ancla.x,
        ancla.y - HONDURA * DESCENSO_WAYPOINTS.midHondura,
        ancla.z,
      ).add(afuera.clone().multiplyScalar(DESCENSO_WAYPOINTS.midAfuera)),
      destino.pos,
    ],
    miradas: [
      controlsTarget.clone(),
      ancla.clone(),
      new THREE.Vector3(
        ancla.x,
        ancla.y - HONDURA * DESCENSO_WAYPOINTS.miraHondura,
        ancla.z,
      ),
      destino.mira,
    ],
  };
}

export const duracionDescenso = (reducido?: boolean) =>
  prefersReducedMotion(reducido) ? 0 : DUR_DESCENSO;

export const orbitCeremonia = ORBIT_CEREMONIA;
