import type * as ThreeNamespace from 'three';
import type { BarrioConfig, UnitDef } from '../config/types.ts';
import {
  ALTURA_ANCLA,
  ALTURA_MONIGOTE,
  ALTURA_ONFALO,
  ARCO_HERRADURA,
  DURACION_MUERTE,
  ESPERA_GLB_MS,
  FADE_IN_RECOVERING,
  GESTO_CADA,
  INICIO_HERRADURA,
  R_FUENTE,
  R_HERRADURA,
  R_MONIGOTES,
  R_PLAZA,
  RUTA_GLB_DEFAULT,
  TRANSICION_MATERIAL,
  Y_AGUA,
} from '../layout/tokens.ts';
import { EASE, pinza } from '../shared/ease.ts';
import { prefersReducedMotion } from '../shared/motion.ts';
import {
  colorDe,
  PALETA,
  PALETA_CSS,
  type ColorAlias,
  type ColorToken,
} from '../theme/tokens.ts';
import {
  claveAspecto,
  esVocabularioSalud,
  normalizarCausa,
  normalizarEstado,
  poseBaseParaClave,
  saludATipestate,
  SALUD_A_TIPESTATE,
  type AspectKey,
  type CausaHalt,
  type Tipestate,
} from './tipestate.ts';

import { loadPuppet } from '@zeus/ui-3d-kit/puppet/puppet.mjs';
import { DEFAULT_CLIP_MAPS } from '@zeus/ui-3d-kit/puppet/clip-map.mjs';
import { createAnimationController } from '@zeus/ui-3d-kit/core/animation-controller.mjs';
import { createStickPuppet } from '@zeus/view-kit/stick-puppet.mjs';
import { BARRIO_ESTADOS } from '@zeus/ciudad/contract';

type Three = typeof ThreeNamespace;
type Vector3Like = ThreeNamespace.Vector3 | { x?: number; y?: number; z?: number };
type SceneLike = { add: (obj: ThreeNamespace.Object3D) => void };

export type ProcedenciaCuerpos = 'glb' | 'stick' | 'mixto' | 'pendiente';

export type Procedencia = {
  cuerpos: ProcedenciaCuerpos;
  real: string[];
  pendiente: string[];
};

export type EstadoUnidad = {
  estado: Tipestate;
  causa: CausaHalt | null;
};

export type BarrioMountOptions = {
  scene?: SceneLike;
  three?: Three;
  origin?: Vector3Like;
  config: BarrioConfig;
};

type PuppetLike = {
  object: ThreeNamespace.Object3D;
  setBase: (pose: string) => boolean | void;
  playAdditive: (name: string) => void;
  update: (dt: number) => void;
  dispose?: () => void;
};

type AnimationController = {
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

type UnitRuntime = {
  id: string;
  meta: UnitDef;
  grupo: ThreeNamespace.Group;
  estado: Tipestate;
  causa: CausaHalt | null;
  sellada: boolean;
  selloRestante: number | null;
  puppet: PuppetLike | null;
  tipo: 'glb' | 'stick';
  pose: string | null;
  gestoT: number;
  materiales: ThreeNamespace.Material[];
  acentoActual: ThreeNamespace.Color;
  acentoBase: ThreeNamespace.Color;
  acentoK: number;
  grisK: number;
  emisivoK: number;
  haloK: number;
  opacidad: number;
  luzK: number;
  luz: ThreeNamespace.PointLight | null;
  halo: ThreeNamespace.Group;
};

type AspectoVisual = {
  gris: number;
  emisivo: number;
  halo: number;
  luz: number;
  acento: ColorToken | ColorAlias;
};

const CORTE_ACENTO = 0.45;

const ASPECTO: Readonly<Record<AspectKey, AspectoVisual>> = Object.freeze({
  declarada: { gris: 0.86, emisivo: 0.0, halo: 0.0, luz: 0.12, acento: 'tinta' },
  arrendada: { gris: 0.0, emisivo: 0.12, halo: 1.0, luz: 0.35, acento: 'oro' },
  lista: { gris: 0.0, emisivo: 0.1, halo: 0.55, luz: 0.55, acento: 'ok' },
  corriendo: { gris: 0.0, emisivo: 0.24, halo: 0.95, luz: 1.0, acento: 'ok' },
  haltedOrden: { gris: 0.24, emisivo: 0.07, halo: 0.4, luz: 0.25, acento: 'oro' },
  haltedFallo: { gris: 0.0, emisivo: 0.26, halo: 0.0, luz: 0.55, acento: 'fallo' },
  recovering: { gris: 0.0, emisivo: 0.2, halo: 0.7, luz: 0.6, acento: 'ok' },
});

function aVector(T: Three, v?: Vector3Like): ThreeNamespace.Vector3 {
  if (!v) return new T.Vector3();
  if (
    typeof (v as ThreeNamespace.Vector3).isVector3 === 'boolean' &&
    (v as ThreeNamespace.Vector3).isVector3
  ) {
    return (v as ThreeNamespace.Vector3).clone();
  }
  const o = v as { x?: number; y?: number; z?: number };
  return new T.Vector3(o.x ?? 0, o.y ?? 0, o.z ?? 0);
}

function conPlazo<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, rechazar) =>
      setTimeout(() => rechazar(new Error('plazo agotado')), ms),
    ),
  ]);
}

function nombreArchivoGlb(ruta: string): string {
  const partes = ruta.split('/');
  return partes[partes.length - 1] ?? 'RobotExpressive.glb';
}

/** Mapa de clips para `loadPuppet` (completa el del kit con entradas locales). */
function buildClipMap(rutaGlb: string): Record<string, unknown> | null {
  const archivo = nombreArchivoGlb(rutaGlb);
  const mapaKit = DEFAULT_CLIP_MAPS[archivo] as
    | { base?: Record<string, unknown>; additive?: Record<string, unknown> }
    | undefined;
  if (!mapaKit) return null;
  const base = { ...(mapaKit.base ?? {}) };
  const additive = { ...(mapaKit.additive ?? {}) };
  return {
    base: {
      ...base,
      ALP_LOC_stop: { clip: 'Standing' },
      HM_TERM_muerte: {
        clip: 'Death',
        fallback: true,
        note: 'clave local de la demo H·M: el catálogo ALP_* no tiene pose terminal por fallo',
      },
    },
    additive,
  };
}

function crearTexturaLetrero(
  T: Three,
  nombre: string,
  tarea: string,
  acentoCss: string,
): ThreeNamespace.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 160;
  const g = lienzo.getContext('2d');
  if (!g) return null;

  g.fillStyle = PALETA_CSS.sepia;
  g.fillRect(0, 0, 512, 160);

  g.strokeStyle = acentoCss;
  g.lineWidth = 3;
  g.strokeRect(9, 9, 494, 142);
  g.globalAlpha = 0.28;
  g.strokeStyle = PALETA_CSS.tinta;
  g.lineWidth = 1;
  g.strokeRect(18, 18, 476, 124);
  g.globalAlpha = 1;

  const mono = '"Cascadia Code", "Cascadia Mono", Consolas, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = PALETA_CSS.tinta;
  g.font = `600 50px ${mono}`;
  g.fillText(nombre.toUpperCase(), 256, 66);
  g.fillStyle = acentoCss;
  g.font = `400 23px ${mono}`;
  g.fillText(tarea, 256, 114);

  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

/**
 * Barrio del descenso: plaza, Ónfalo, locales en herradura y puppets por unidad.
 * Port de `game-prueba-hm/public/js/barrio/barrio.mjs`.
 */
export class BarrioScene {
  readonly group: ThreeNamespace.Group;
  readonly unidades: readonly string[];
  readonly procedencia: Procedencia;

  private readonly T: Three;
  private readonly quieto: boolean;
  private readonly dur: (s: number) => number;
  private readonly themeOverride: BarrioConfig['theme'];
  private readonly roster: readonly UnitDef[];
  private readonly rutaGlb: string;
  private readonly mapaClips: ReturnType<typeof buildClipMap>;

  private readonly unidadesMap = new Map<string, UnitRuntime>();
  private readonly emisivosAmbiente: Array<{
    material: ThreeNamespace.Material & {
      emissiveIntensity?: number;
    };
    base: number;
  }> = [];
  private readonly lucesAmbiente: Array<{
    luz: ThreeNamespace.Light;
    base: number;
  }> = [];

  private readonly motor: AnimationController;
  private readonly barrioK = { despierto: 0.1 };
  private readonly anclaOnfalo: ThreeNamespace.Object3D;

  private aguaMalla: ThreeNamespace.Mesh | null = null;
  private radiosAgua: Float32Array | null = null;

  private reloj = 0;
  private vivo = true;
  private rafId = 0;
  private ultimoMs = 0;
  private ultimaExterna = -Infinity;

  private barrioEstados: readonly string[] | null = null;
  private avisadoGlb = false;

  private readonly GRIS: ThreeNamespace.Color;
  private readonly PIEDRA: ThreeNamespace.Color;
  private readonly PIEDRA_CLARA: ThreeNamespace.Color;

  private constructor(
    T: Three,
    config: BarrioConfig,
    origin: Vector3Like | undefined,
    procedencia: Procedencia,
    barrioEstados: readonly string[] | null,
  ) {
    this.T = T;
    this.quieto = prefersReducedMotion();
    this.dur = (s) => (this.quieto ? 0 : s);
    this.themeOverride = config.theme;
    this.roster = config.unidades;
    this.rutaGlb = config.rutaGlb ?? RUTA_GLB_DEFAULT;
    this.mapaClips = buildClipMap(this.rutaGlb);
    this.procedencia = procedencia;
    this.barrioEstados = barrioEstados;
    this.unidades = config.unidades.map((m) => m.id);

    this.barrioK.despierto = this.quieto ? 1 : 0.1;

    this.GRIS = new T.Color(colorDe('sepia', this.themeOverride)).lerp(
      new T.Color(colorDe('tinta', this.themeOverride)),
      0.34,
    );
    this.PIEDRA = new T.Color(colorDe('sepia', this.themeOverride)).lerp(
      new T.Color(colorDe('tinta', this.themeOverride)),
      0.16,
    );
    this.PIEDRA_CLARA = new T.Color(colorDe('sepia', this.themeOverride)).lerp(
      new T.Color(colorDe('tinta', this.themeOverride)),
      0.26,
    );

    this.group = new T.Group();
    this.group.name = 'barrio';
    this.group.position.copy(aVector(T, origin));

    this.anclaOnfalo = new T.Object3D();
    this.motor = createAnimationController() as AnimationController;
  }

  static async mount(opts: BarrioMountOptions): Promise<BarrioScene> {
    const T = (opts.three ?? (await import('three'))) as Three;
    const procedencia: Procedencia = {
      cuerpos: 'pendiente',
      real: [
        '@zeus/ui-3d-kit/puppet/clip-map.mjs · DEFAULT_CLIP_MAPS',
        '@zeus/ui-3d-kit/core/animation-controller.mjs · createAnimationController',
      ],
      pendiente: [],
    };

    let barrioEstados: readonly string[] | null = null;
    try {
      barrioEstados = BARRIO_ESTADOS;
      const faltan = BARRIO_ESTADOS.filter((e) => !saludATipestate(e));
      const sobran = Object.keys(SALUD_A_TIPESTATE).filter(
        (e) => !BARRIO_ESTADOS.includes(e as typeof BARRIO_ESTADOS[number]),
      );
      if (
        faltan.length &&
        typeof console !== 'undefined' &&
        console.warn
      ) {
        console.warn('[BarrioScene] BARRIO_ESTADOS sin mapa local', { faltan });
      }
      if (sobran.length && typeof console !== 'undefined' && console.warn) {
        console.warn('[BarrioScene] mapa salud sobra', { sobran });
      }
      procedencia.real.push('@zeus/ciudad/contract · BARRIO_ESTADOS');
    } catch (err) {
      procedencia.pendiente.push(
        'BARRIO_ESTADOS de @zeus/ciudad/contract no disponible ('
          + ((err as Error)?.message ?? err)
          + '): setUnitState acepta salud sin validar contra el paquete',
      );
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[BarrioScene] sin @zeus/ciudad/contract:', (err as Error)?.message);
      }
    }

    const scene = new BarrioScene(T, opts.config, opts.origin, procedencia, barrioEstados);
    await scene.build();

    if (opts.scene?.add) opts.scene.add(scene.group);
    scene.motor.start();
    scene.actualizar(0);
    if (typeof requestAnimationFrame === 'function') {
      scene.rafId = requestAnimationFrame(scene.bucle);
    }

    return scene;
  }

  private color(nombre: ColorToken | ColorAlias): ThreeNamespace.Color {
    return new this.T.Color(colorDe(nombre, this.themeOverride));
  }

  private ahora(): number {
    return typeof performance !== 'undefined' &&
      performance &&
      typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  private tween(o: {
    clave: string;
    objeto: object;
    prop: string;
    hasta: number;
    dur: number;
    ease?: string;
    onDone?: () => void;
  }): void {
    const { clave, objeto, prop, hasta, dur: d, ease = 'easeInOut', onDone } = o;
    if (!(d > 0)) {
      this.motor.removeAnimation(clave);
      (objeto as Record<string, number>)[prop] = hasta;
      if (onDone) onDone();
      return;
    }
    this.motor.createAnimation(
      clave,
      [{ object: objeto, property: prop, endValue: hasta }],
      { duration: d, easing: ease, onComplete: onDone },
    );
  }

  private piedra(
    c: ThreeNamespace.Color,
    opts: { rugosidad?: number; emisivo?: ThreeNamespace.Color | null; intensidad?: number } = {},
  ): ThreeNamespace.MeshStandardMaterial {
    const { rugosidad = 0.92, emisivo = null, intensidad = 0 } = opts;
    return new this.T.MeshStandardMaterial({
      color: c,
      roughness: rugosidad,
      metalness: 0.04,
      emissive: emisivo ?? new this.T.Color(0, 0, 0),
      emissiveIntensity: intensidad,
    });
  }

  private registrarEmisivoAmbiente(
    material: ThreeNamespace.Material & { emissiveIntensity?: number },
    base: number,
  ): ThreeNamespace.Material {
    this.emisivosAmbiente.push({ material, base });
    return material;
  }

  private async build(): Promise<void> {
    this.construirPlaza();
    this.construirOnfalo();

    const T = this.T;
    const hemisferio = new T.HemisphereLight(
      colorDe('tinta', this.themeOverride),
      colorDe('sepia', this.themeOverride),
      0,
    );
    this.lucesAmbiente.push({ luz: hemisferio, base: 0.85 });
    this.group.add(hemisferio);

    const luzClave = new T.DirectionalLight(colorDe('oro', this.themeOverride), 0);
    luzClave.position.set(9, 14, 8);
    luzClave.castShadow = true;
    this.lucesAmbiente.push({ luz: luzClave, base: 0.75 });
    this.group.add(luzClave);

    const contra = new T.DirectionalLight(colorDe('verdigris', this.themeOverride), 0);
    contra.position.set(-8, 7, -10);
    this.lucesAmbiente.push({ luz: contra, base: 0.3 });
    this.group.add(contra);

    if (!this.mapaClips) {
      this.procedencia.pendiente.push(
        'clip-map del kit sin entrada para '
          + nombreArchivoGlb(this.rutaGlb)
          + ': los cuerpos caen al stick-puppet de view-kit',
      );
    } else {
      this.procedencia.pendiente.push(
        'capa aditiva REAL (AnimationUtils.makeClipAdditive): emotes de RobotExpressive.glb'
          + ' con additiveSafe:false → playAdditive usa crossfade documentado',
      );
      this.procedencia.pendiente.push(
        'pose terminal en contrato puppet: sellado frenando mixer hasta último fotograma de Death',
      );
      this.procedencia.pendiente.push(
        '@zeus/view-kit/actors-layer.mjs · createActorsLayer: no expone puppets para teñir materiales',
      );
    }

    const n = this.roster.length;
    const puppets = this.mapaClips
      ? await Promise.all(this.roster.map(() => this.pedirPuppetGlb()))
      : this.roster.map(() => null);

    this.roster.forEach((meta, i) => {
      const theta =
        INICIO_HERRADURA + (ARCO_HERRADURA * i) / (n - 1);
      this.construirLocal(meta, theta);
      this.construirUnidad(meta, theta, puppets[i]);
    });

    const conGlb = puppets.filter(Boolean).length;
    this.procedencia.cuerpos =
      conGlb === n ? 'glb' : conGlb === 0 ? 'stick' : 'mixto';
    if (conGlb > 0) {
      this.procedencia.real.push(
        `@zeus/ui-3d-kit/puppet/puppet.mjs · loadPuppet ×${conGlb}`,
      );
    }
    if (conGlb < n) {
      this.procedencia.real.push(
        `@zeus/view-kit/stick-puppet.mjs · createStickPuppet ×${n - conGlb}`,
      );
      this.procedencia.pendiente.push(
        `${n - conGlb}/${n} cuerpos sin GLB: stick-puppet (sin pose terminal de fallo)`,
      );
    }
  }

  private construirPlaza(): void {
    const T = this.T;
    const suelo = new T.Mesh(
      new T.CircleGeometry(R_PLAZA, 84),
      this.piedra(this.PIEDRA, { rugosidad: 0.98 }),
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    this.group.add(suelo);

    const trazo = new T.Mesh(
      new T.RingGeometry(
        R_HERRADURA - 0.22,
        R_HERRADURA + 0.22,
        96,
        1,
        INICIO_HERRADURA - Math.PI / 2 - 0.12,
        ARCO_HERRADURA + 0.24,
      ),
      this.registrarEmisivoAmbiente(
        this.piedra(this.PIEDRA_CLARA, {
          emisivo: this.color('tinta'),
          intensidad: 0.06,
        }),
        0.06,
      ),
    );
    trazo.rotation.x = -Math.PI / 2;
    trazo.position.y = 0.012;
    this.group.add(trazo);

    const borde = new T.Mesh(
      new T.RingGeometry(R_PLAZA - 0.32, R_PLAZA, 96),
      this.registrarEmisivoAmbiente(
        this.piedra(this.PIEDRA_CLARA, {
          emisivo: this.color('verdigris'),
          intensidad: 0.1,
        }),
        0.1,
      ),
    );
    borde.rotation.x = -Math.PI / 2;
    borde.position.y = 0.014;
    this.group.add(borde);
  }

  private construirOnfalo(): void {
    const T = this.T;
    const fuente = new T.Group();
    fuente.name = 'onfalo';

    const muro = new T.Mesh(
      new T.CylinderGeometry(R_FUENTE, R_FUENTE * 1.04, 0.62, 64, 1, true),
      this.piedra(this.PIEDRA_CLARA),
    );
    muro.material.side = T.DoubleSide;
    muro.position.y = 0.31;
    muro.receiveShadow = true;
    fuente.add(muro);

    const brocal = new T.Mesh(
      new T.TorusGeometry(R_FUENTE, 0.085, 12, 72),
      this.registrarEmisivoAmbiente(
        this.piedra(this.PIEDRA_CLARA, {
          rugosidad: 0.6,
          emisivo: this.color('oro'),
          intensidad: 0.09,
        }),
        0.09,
      ),
    );
    brocal.rotation.x = -Math.PI / 2;
    brocal.position.y = 0.62;
    fuente.add(brocal);

    const vaso = new T.Mesh(
      new T.CircleGeometry(R_FUENTE, 64),
      this.piedra(new T.Color(colorDe('sepia', this.themeOverride))),
    );
    vaso.rotation.x = -Math.PI / 2;
    vaso.position.y = 0.1;
    fuente.add(vaso);

    const aguaGeo = new T.RingGeometry(0.02, R_FUENTE - 0.09, 72, 12);
    const pos = aguaGeo.attributes.position;
    this.radiosAgua = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      this.radiosAgua[i] = Math.hypot(pos.getX(i), pos.getY(i));
    }
    const aguaMat = new T.MeshStandardMaterial({
      color: this.color('verdigris'),
      roughness: 0.14,
      metalness: 0.12,
      transparent: true,
      opacity: 0.74,
      side: T.DoubleSide,
      emissive: this.color('verdigris'),
      emissiveIntensity: 0.12,
    });
    this.registrarEmisivoAmbiente(aguaMat, 0.12);
    this.aguaMalla = new T.Mesh(aguaGeo, aguaMat);
    this.aguaMalla.rotation.x = -Math.PI / 2;
    this.aguaMalla.position.y = Y_AGUA;
    fuente.add(this.aguaMalla);
    this.ondularAgua(0);

    const perfil = [new T.Vector2(0.74, 0), new T.Vector2(0.7, 0.07)];
    const PASOS = 18;
    for (let i = 0; i <= PASOS; i++) {
      const u = i / PASOS;
      const r = 0.64 * Math.pow(Math.cos((u * Math.PI) / 2), 0.55);
      perfil.push(new T.Vector2(Math.max(r, 0.0001), 0.09 + ALTURA_ONFALO * u));
    }
    const onfalo = new T.Mesh(
      new T.LatheGeometry(perfil, 64),
      this.registrarEmisivoAmbiente(
        this.piedra(this.PIEDRA_CLARA, {
          rugosidad: 0.55,
          emisivo: this.color('tinta'),
          intensidad: 0.09,
        }),
        0.09,
      ),
    );
    onfalo.material.side = T.DoubleSide;
    onfalo.position.y = Y_AGUA - 0.04;
    onfalo.castShadow = true;
    fuente.add(onfalo);

    this.anclaOnfalo.position.set(0, Y_AGUA + ALTURA_ONFALO + 0.18, 0);
    fuente.add(this.anclaOnfalo);

    const luzFuente = new T.PointLight(colorDe('tinta', this.themeOverride), 0, 22, 2);
    luzFuente.position.set(0, 3.4, 0);
    this.lucesAmbiente.push({ luz: luzFuente, base: 9 });
    fuente.add(luzFuente);

    this.group.add(fuente);
  }

  private ondularAgua(t: number): void {
    if (!this.aguaMalla || !this.radiosAgua) return;
    const pos = this.aguaMalla.geometry.attributes.position;
    const R = R_FUENTE - 0.09;
    for (let i = 0; i < pos.count; i++) {
      const r = this.radiosAgua[i];
      const caida = 0.3 + 0.7 * (r / R);
      const z =
        0.032 *
        caida *
        (Math.sin(r * 5.4 - t * 1.7) * 0.62 +
          Math.sin(r * 9.1 - t * 2.6 + 1.3) * 0.38);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    this.aguaMalla.geometry.computeVertexNormals();
  }

  private construirLocal(meta: UnitDef, theta: number): void {
    const T = this.T;
    const local = new T.Group();
    local.name = `local:${meta.id}`;
    local.position.set(
      R_HERRADURA * Math.sin(theta),
      0,
      R_HERRADURA * Math.cos(theta),
    );
    local.rotation.y = theta + Math.PI;

    const acento = this.color(meta.acento);
    const acentoCss =
      meta.acento === 'ok' || meta.acento === 'fallo'
        ? PALETA_CSS[meta.acento]
        : PALETA_CSS[meta.acento as ColorToken];

    const cuerpo = new T.Mesh(
      new T.BoxGeometry(3.2, 2.6, 2.4),
      this.piedra(this.PIEDRA_CLARA),
    );
    cuerpo.position.y = 1.3;
    cuerpo.castShadow = true;
    cuerpo.receiveShadow = true;
    local.add(cuerpo);

    const zocalo = new T.Mesh(
      new T.BoxGeometry(3.44, 0.18, 2.64),
      this.piedra(this.PIEDRA),
    );
    zocalo.position.y = 0.09;
    local.add(zocalo);

    const umbral = new T.Mesh(
      new T.BoxGeometry(1.9, 0.1, 0.5),
      this.piedra(this.PIEDRA),
    );
    umbral.position.set(0, 0.05, 1.42);
    local.add(umbral);

    const vano = new T.Mesh(
      new T.BoxGeometry(1.32, 1.78, 0.14),
      this.piedra(new T.Color(colorDe('sepia', this.themeOverride))),
    );
    vano.position.set(0, 0.92, 1.2);
    local.add(vano);

    const dentro = new T.Mesh(
      new T.PlaneGeometry(1.16, 1.62),
      this.registrarEmisivoAmbiente(
        new T.MeshStandardMaterial({
          color: new T.Color(colorDe('sepia', this.themeOverride)),
          roughness: 1,
          emissive: acento.clone(),
          emissiveIntensity: 0.34,
        }),
        0.34,
      ),
    );
    dentro.position.set(0, 0.92, 1.28);
    local.add(dentro);

    const marquesina = new T.Mesh(
      new T.BoxGeometry(3.5, 0.11, 0.78),
      this.piedra(this.PIEDRA),
    );
    marquesina.position.set(0, 2.12, 1.42);
    marquesina.rotation.x = -0.06;
    local.add(marquesina);

    const filo = new T.Mesh(
      new T.BoxGeometry(3.5, 0.05, 0.06),
      this.registrarEmisivoAmbiente(
        this.piedra(this.PIEDRA_CLARA, {
          rugosidad: 0.5,
          emisivo: acento.clone(),
          intensidad: 0.3,
        }),
        0.3,
      ),
    );
    filo.position.set(0, 2.07, 1.79);
    local.add(filo);

    const textura = crearTexturaLetrero(T, meta.nombre, meta.tarea, acentoCss);
    if (textura) {
      const letreroMat = new T.MeshStandardMaterial({
        map: textura,
        emissiveMap: textura,
        emissive: this.color('tinta'),
        emissiveIntensity: 0.42,
        roughness: 0.88,
        metalness: 0,
      });
      this.registrarEmisivoAmbiente(letreroMat, 0.42);
      const letrero = new T.Mesh(new T.PlaneGeometry(2.64, 0.82), letreroMat);
      letrero.position.set(0, 2.68, 1.24);
      letrero.rotation.x = -0.17;
      local.add(letrero);

      const marco = new T.Mesh(
        new T.BoxGeometry(2.82, 0.98, 0.08),
        this.piedra(this.PIEDRA),
      );
      marco.position.set(0, 2.68, 1.18);
      marco.rotation.x = -0.17;
      local.add(marco);
    }

    this.group.add(local);
  }

  private async pedirPuppetGlb(): Promise<PuppetLike | null> {
    if (!this.mapaClips) return null;
    const promesa = loadPuppet(this.rutaGlb, {
      clipMap: this.mapaClips,
      castShadow: true,
    }) as Promise<PuppetLike>;
    try {
      return await conPlazo(promesa, ESPERA_GLB_MS);
    } catch (err) {
      promesa.then((p) => p?.dispose?.()).catch(() => {});
      if (!this.avisadoGlb && typeof console !== 'undefined' && console.warn) {
        this.avisadoGlb = true;
        console.warn(
          '[BarrioScene] loadPuppet falló, stick-puppet:',
          (err as Error)?.message,
        );
      }
      return null;
    }
  }

  private ajustarAltura(objeto: ThreeNamespace.Object3D): void {
    const caja = new this.T.Box3().setFromObject(objeto);
    const alto = caja.max.y - caja.min.y;
    if (Number.isFinite(alto) && alto > 0.001) {
      objeto.scale.setScalar(ALTURA_MONIGOTE / alto);
    }
  }

  private recogerMateriales(u: UnitRuntime): void {
    const T = this.T;
    const mats: ThreeNamespace.Material[] = [];
    u.puppet!.object.traverse((o) => {
      const mesh = o as ThreeNamespace.Mesh;
      if (!mesh.isMesh && !(mesh as ThreeNamespace.SkinnedMesh).isSkinnedMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of lista) {
        if (!m || mats.indexOf(m) !== -1) continue;
        const std = m as ThreeNamespace.MeshStandardMaterial & {
          userData: { colorBase?: ThreeNamespace.Color; transparenteBase?: boolean };
        };
        std.userData.colorBase = std.color
          ? std.color.clone()
          : new T.Color(colorDe('tinta', this.themeOverride));
        std.userData.transparenteBase = std.transparent === true;
        mats.push(m);
      }
    });
    u.materiales = mats;
  }

  private ponerPose(u: UnitRuntime, claveAspectoKey: AspectKey): void {
    if (!u.puppet) return;
    const clave2 =
      this.quieto && claveAspectoKey === 'corriendo' ? 'lista' : claveAspectoKey;
    const pose = poseBaseParaClave(clave2, u.tipo);
    if (!pose || pose === u.pose) return;
    if (u.puppet.setBase(pose) !== false) u.pose = pose;
  }

  private crearHalo(acento: ThreeNamespace.Color): ThreeNamespace.Group {
    const T = this.T;
    const halo = new T.Group();
    const anillo = (rInt: number, rExt: number, opacidad: number) => {
      const m = new T.Mesh(
        new T.RingGeometry(rInt, rExt, 64),
        new T.MeshBasicMaterial({
          color: acento.clone(),
          transparent: true,
          opacity: 0,
          blending: T.AdditiveBlending,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      (m.userData as { opacidadBase: number }).opacidadBase = opacidad;
      halo.add(m);
      return m;
    };
    anillo(0.52, 0.74, 0.85);
    anillo(0.78, 1.18, 0.22);
    halo.position.y = 0.035;
    return halo;
  }

  private construirUnidad(
    meta: UnitDef,
    theta: number,
    puppetGlb: PuppetLike | null,
  ): void {
    const T = this.T;
    const acento = this.color(meta.acento);
    const grupo = new T.Group();
    grupo.name = `unidad:${meta.id}`;
    grupo.position.set(
      R_MONIGOTES * Math.sin(theta),
      0,
      R_MONIGOTES * Math.cos(theta),
    );
    grupo.rotation.y = theta + Math.PI;

    const u: UnitRuntime = {
      id: meta.id,
      meta,
      grupo,
      estado: 'declarada',
      causa: null,
      sellada: false,
      selloRestante: null,
      puppet: null,
      tipo: 'stick',
      pose: null,
      gestoT: 0,
      materiales: [],
      acentoActual: acento.clone(),
      acentoBase: acento.clone(),
      acentoK: 0,
      grisK: 0,
      emisivoK: 0,
      haloK: 0,
      opacidad: 1,
      luzK: 0,
      luz: null,
      halo: this.crearHalo(acento),
    };

    if (puppetGlb) {
      u.puppet = puppetGlb;
      u.tipo = 'glb';
    } else {
      u.puppet = createStickPuppet({ color: acento.clone() }) as PuppetLike;
      u.tipo = 'stick';
    }

    this.ajustarAltura(u.puppet.object);
    this.recogerMateriales(u);
    grupo.add(u.puppet.object);
    grupo.add(u.halo);

    if (meta.acento === 'violeta') {
      u.luz = new T.PointLight(colorDe('violeta', this.themeOverride), 0, 9.5, 2);
      u.luz.position.set(0, 1.5, 0.35);
      grupo.add(u.luz);
    }

    this.group.add(grupo);
    this.unidadesMap.set(meta.id, u);
    this.aplicarEstado(u, 'declarada', null, { instantaneo: true });
  }

  private aplicarAspecto(u: UnitRuntime): void {
    for (const m of u.materiales) {
      const std = m as ThreeNamespace.MeshStandardMaterial & {
        userData: { colorBase?: ThreeNamespace.Color; transparenteBase?: boolean };
        emissive?: ThreeNamespace.Color;
        emissiveIntensity?: number;
      };
      const base = std.userData.colorBase;
      if (base && std.color) {
        std.color.copy(base).lerp(this.GRIS, u.grisK);
        if (!std.emissive) {
          std.color.lerp(u.acentoActual, pinza(u.emisivoK * 2.2, 0, 1));
        }
      }
      if (std.emissive) {
        std.emissive.copy(u.acentoActual);
        std.emissiveIntensity = u.emisivoK;
      }
      if (u.opacidad < 1) {
        std.transparent = true;
        std.opacity = u.opacidad;
      } else if (!std.userData.transparenteBase) {
        std.transparent = false;
        std.opacity = 1;
      }
    }
  }

  private cambiarAcento(
    u: UnitRuntime,
    nuevo: ThreeNamespace.Color,
    intensidad: number,
    d: number,
  ): void {
    const igual = u.acentoActual.getHex() === nuevo.getHex();
    if (igual || !(d > 0)) {
      u.acentoActual.copy(nuevo);
      this.tween({
        clave: `${u.id}:emisivo`,
        objeto: u,
        prop: 'emisivoK',
        hasta: intensidad,
        dur: d,
      });
      return;
    }
    const desde = u.emisivoK;
    u.acentoK = 0;
    this.motor.createAnimation(
      `${u.id}:emisivo`,
      [{ object: u, property: 'acentoK', startValue: 0, endValue: 1 }],
      {
        duration: d,
        easing: 'linear',
        onUpdate: (p) => {
          if (p < CORTE_ACENTO) {
            u.emisivoK = desde * (1 - EASE.salida(p / CORTE_ACENTO));
            return;
          }
          u.acentoActual.copy(nuevo);
          u.emisivoK =
            intensidad * EASE.salida((p - CORTE_ACENTO) / (1 - CORTE_ACENTO));
        },
      },
    );
  }

  private aplicarEstado(
    u: UnitRuntime,
    estado: Tipestate,
    causa: CausaHalt | null,
    opts: { instantaneo?: boolean } = {},
  ): void {
    const d = opts.instantaneo ? 0 : this.dur(TRANSICION_MATERIAL);
    u.estado = estado;
    u.causa = causa;

    const clave = claveAspecto(estado, causa);
    const a = ASPECTO[clave] ?? ASPECTO.declarada;

    const acento =
      u.meta.acento === 'violeta'
        ? this.color('violeta')
        : this.color(a.acento);

    this.tween({
      clave: `${u.id}:gris`,
      objeto: u,
      prop: 'grisK',
      hasta: a.gris,
      dur: d,
    });
    this.cambiarAcento(u, acento, a.emisivo, d);
    this.tween({
      clave: `${u.id}:halo`,
      objeto: u,
      prop: 'haloK',
      hasta: a.halo,
      dur: d,
      ease: 'easeOut',
    });
    this.tween({
      clave: `${u.id}:luz`,
      objeto: u,
      prop: 'luzK',
      hasta: a.luz,
      dur: d,
    });

    if (estado === 'recovering') {
      u.opacidad = this.quieto ? 1 : 0;
      this.tween({
        clave: `${u.id}:opacidad`,
        objeto: u,
        prop: 'opacidad',
        hasta: 1,
        dur: this.dur(FADE_IN_RECOVERING),
        ease: 'easeOut',
      });
    } else {
      this.tween({
        clave: `${u.id}:opacidad`,
        objeto: u,
        prop: 'opacidad',
        hasta: 1,
        dur: d,
      });
    }

    this.ponerPose(u, clave);
    if (clave === 'haltedFallo' && u.tipo === 'glb') {
      u.selloRestante = DURACION_MUERTE;
    } else {
      u.selloRestante = null;
    }
    if (clave === 'corriendo') u.gestoT = GESTO_CADA * 0.6;

    this.aplicarAspecto(u);
  }

  private avanzarCuerpo(u: UnitRuntime, paso: number): void {
    if (!u.puppet) return;

    if (u.selloRestante !== null) {
      if (u.selloRestante <= 0) return;
      const k = pinza(u.selloRestante / (DURACION_MUERTE * 0.3), 0, 1);
      const p = Math.min(
        u.selloRestante,
        paso * (0.1 + 0.9 * EASE.salida(k)),
      );
      u.selloRestante -= p;
      u.puppet.update(p);
      return;
    }

    u.puppet.update(paso);

    if (this.quieto || u.estado !== 'corriendo' || !u.meta.gesto) return;
    u.gestoT += paso;
    if (u.gestoT < GESTO_CADA) return;
    u.gestoT = 0;
    const nombre =
      u.tipo === 'glb' ? u.meta.gesto.glb : u.meta.gesto.stick;
    if (nombre) u.puppet.playAdditive(nombre);
  }

  private actualizar(dt: number): void {
    if (!this.vivo) return;
    const paso = pinza(dt || 0, 0, 0.1);
    this.reloj += paso;
    this.motor.update();

    if (!this.quieto) this.ondularAgua(this.reloj);

    const brilloAmb = 0.1 + 0.9 * this.barrioK.despierto;
    for (const e of this.emisivosAmbiente) {
      e.material.emissiveIntensity = e.base * brilloAmb;
    }
    for (const l of this.lucesAmbiente) {
      (l.luz as ThreeNamespace.Light & { intensity: number }).intensity =
        l.base * (0.06 + 0.94 * this.barrioK.despierto);
    }

    for (const u of this.unidadesMap.values()) {
      if (this.barrioK.despierto > 0.02 || u.selloRestante !== null) {
        this.avanzarCuerpo(u, paso);
      }

      this.aplicarAspecto(u);

      const pulso =
        !this.quieto && u.estado === 'corriendo'
          ? 1 + 0.13 * Math.sin(this.reloj * 2.6)
          : 1;
      for (const anillo of u.halo.children) {
        const mesh = anillo as ThreeNamespace.Mesh;
        const mat = mesh.material as ThreeNamespace.MeshBasicMaterial;
        const opBase = (mesh.userData as { opacidadBase: number }).opacidadBase;
        mat.opacity = opBase * u.haloK * this.barrioK.despierto * pulso;
        mesh.visible = mat.opacity > 0.004;
      }
      if (u.luz) {
        u.luz.intensity = (0.6 + 3.4 * u.luzK) * this.barrioK.despierto;
      }
    }
  }

  private bucle = (ms: number): void => {
    if (!this.vivo) return;
    this.rafId = requestAnimationFrame(this.bucle);
    const dt = this.ultimoMs ? (ms - this.ultimoMs) / 1000 : 0.016;
    this.ultimoMs = ms;
    if (this.ahora() - this.ultimaExterna < 500) return;
    this.actualizar(dt);
  };

  setUnitState(unitId: string, estado: string, causa?: string): void {
    const u = this.unidadesMap.get(unitId);
    if (!u) return;

    const crudo = String(estado ?? '').toLowerCase();
    const esSalud = esVocabularioSalud(crudo, this.barrioEstados ?? undefined);
    const salud = esSalud ? saludATipestate(crudo) : null;
    const e = salud ? salud.estado : normalizarEstado(crudo);
    if (!e) return;
    const c =
      e !== 'halted'
        ? null
        : salud
          ? salud.causa
          : normalizarCausa(causa ?? 'orden');

    if (u.sellada && e !== 'recovering') return;
    if (u.estado === e && u.causa === c) return;

    u.sellada = e === 'halted' && c === 'fallo';
    this.aplicarEstado(u, e, c);
  }

  unitAnchor(unitId: string): ThreeNamespace.Vector3 {
    if (unitId === 'onfalo' || unitId === 'ónfalo') return this.onfaloAnchor();
    const u = this.unidadesMap.get(unitId);
    const destino = new this.T.Vector3();
    if (!u) return this.group.getWorldPosition(destino);
    u.grupo.getWorldPosition(destino);
    destino.y += ALTURA_ANCLA;
    return destino;
  }

  onfaloAnchor(): ThreeNamespace.Vector3 {
    return this.anclaOnfalo.getWorldPosition(new this.T.Vector3());
  }

  private transicionDespertar(hasta: number): Promise<void> {
    return new Promise((resolver) => {
      this.tween({
        clave: 'barrio:despierto',
        objeto: this.barrioK,
        prop: 'despierto',
        hasta,
        dur: this.dur(1.5),
        ease: 'easeInOut',
        onDone: resolver,
      });
    });
  }

  wake(): Promise<void> {
    return this.transicionDespertar(1);
  }

  sleep(): Promise<void> {
    return this.transicionDespertar(0.1);
  }

  update(dt: number): void {
    this.ultimaExterna = this.ahora();
    this.actualizar(dt);
  }

  estadoUnidad(unitId: string): EstadoUnidad | null {
    const u = this.unidadesMap.get(unitId);
    return u ? { estado: u.estado, causa: u.causa } : null;
  }

  dispose(): void {
    this.vivo = false;
    if (this.rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = 0;
    this.motor.dispose();

    for (const u of this.unidadesMap.values()) {
      u.puppet?.dispose?.();
      u.puppet = null;
      u.materiales = [];
    }
    this.unidadesMap.clear();

    const liberar = (raiz: ThreeNamespace.Object3D) => {
      raiz.traverse((o) => {
        const mesh = o as ThreeNamespace.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : mesh.material
            ? [mesh.material]
            : [];
        for (const m of mats) {
          for (const k in m) {
            const v = (m as unknown as Record<string, unknown>)[k];
            if (
              v &&
              typeof v === 'object' &&
              'isTexture' in v &&
              (v as { isTexture: boolean }).isTexture
            ) {
              (v as ThreeNamespace.Texture).dispose();
            }
          }
          m.dispose();
        }
        const light = o as ThreeNamespace.Light;
        if (light.isLight && typeof (light as { dispose?: () => void }).dispose === 'function') {
          (light as { dispose: () => void }).dispose();
        }
      });
    };
    liberar(this.group);

    if (this.group.parent) this.group.parent.remove(this.group);
    this.group.clear();
    this.emisivosAmbiente.length = 0;
    this.lucesAmbiente.length = 0;
  }
}
