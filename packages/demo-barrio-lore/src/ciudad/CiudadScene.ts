import {
  createAnchorMarker,
  createLinkCorridorBetween,
  createNodeMesh,
  createTrajectoryManager,
} from '@zeus/ui-3d-kit';
import { linkDistance, sampleLink } from '@zeus/game-engine';
import type * as THREE_NS from 'three';
import type { CiudadConfig } from '../config/types.ts';
import {
  ALTURA_BRUMA,
  DENSIDAD_NIEBLA,
  DUR_REVELADO,
  ESTADOS_VISUAL,
  RADIO_CIUDAD,
} from '../layout/tokens.ts';
import { EASE, pinza } from '../shared/ease.ts';
import { prefersReducedMotion } from '../shared/motion.ts';
import { PALETA } from '../theme/tokens.ts';
import {
  cargarCiudadReal,
  colorCss,
  crearEtiqueta,
  desecharArbol,
  geometriaMeseta,
  nombreCorto,
  resolverMapa,
  tematizar,
  texturaDegradadoVertical,
  texturaDiscoBruma,
} from './ciudad-helpers.ts';
import {
  COLOR_DISTRITO_DEFAULT,
  DRY_CALLE_DEFAULT,
  calcularTrazado,
  gamemapDesdeMapa,
  semilla,
  type Gamemap,
  type MapaData,
  type TrazadoResult,
} from './trazado.ts';

type ThreeModule = typeof THREE_NS;
const TAU = Math.PI * 2;

const FACIL = Object.freeze({
  entrada: (t: number) => t * t * t,
  salida: EASE.salidaCubica,
  suave: EASE.suave,
  seno: EASE.suaveSeno,
  latido: (t: number) => {
    const s = Math.sin(Math.PI * t);
    return s * s;
  },
});

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;

export type CiudadFrontera = {
  real: string[];
  pendiente: Array<{ que: string; motivo: string }>;
};

export type CiudadMountOptions = {
  scene: THREE_NS.Scene;
  mapa: MapaData | string;
  three?: ThreeModule;
  config: CiudadConfig;
};

export type FocusCityArg =
  | THREE_NS.Camera
  | {
      camera?: THREE_NS.Camera;
      controls?: { target?: THREE_NS.Vector3; update?: () => void };
      duracion?: number;
    }
  | null
  | undefined;

export type FocusCityResult = {
  centro: THREE_NS.Vector3;
  mirarA: THREE_NS.Vector3;
  camara: THREE_NS.Vector3;
  radio: number;
  distancia: number;
  listo: Promise<void>;
};

type AnclaBarrio = {
  barrio: import('./trazado.ts').BarrioTrazado;
  grupo: THREE_NS.Group;
  malla: THREE_NS.Mesh;
  material: THREE_NS.MeshStandardMaterial;
  base: THREE_NS.Vector3;
  cima: THREE_NS.Vector3;
  altura: number;
};

type Animable = {
  retardo: number;
  duracion: number;
  aplicar: (p: number) => void;
};

type Latido = { tic: (t: number, dt: number) => void };

/**
 * Vista Three de la ciudad (port de game `ciudad.mjs`).
 * Config-driven: destacado, colores de distrito y dry de calles vía `CiudadConfig`.
 */
export class CiudadScene {
  readonly group: THREE_NS.Group;
  readonly gamemap: Gamemap;
  readonly escena: import('@zeus/ciudad/scene').CiudadScene | null;
  readonly frontera: CiudadFrontera;
  readonly trazado: TrazadoResult;

  private readonly T: ThreeModule;
  private readonly scene: THREE_NS.Scene;
  private readonly config: CiudadConfig;
  private readonly idDestacado: string;
  private readonly radioCiudad: number;
  private readonly menosMovimiento: boolean;
  private readonly centro: THREE_NS.Vector3;
  private readonly notariaPos: THREE_NS.Vector3;

  private readonly desechables: Array<{ dispose?: () => void }> = [];
  private readonly animables: Animable[] = [];
  private readonly latidos: Latido[] = [];
  private readonly anclas = new Map<string, AnclaBarrio>();
  private readonly marcasKit = new Map<string, THREE_NS.Object3D>();
  private readonly nieblaPropia: THREE_NS.FogExp2;
  private readonly fogPrevio: THREE_NS.Fog | THREE_NS.FogExp2 | null;
  private readonly trayectorias: ReturnType<typeof createTrajectoryManager>;
  private readonly estadosCanonicos: readonly string[] | null;

  private revelado: number;
  private reloj = 0;
  private raf = 0;
  private externo = false;
  private vivo = true;
  private ultimo: number;
  private resolverListo: (() => void) | null = null;
  private promesaListo: Promise<void> | null = null;
  private camaraAnim: {
    camera: THREE_NS.Camera;
    controls?: { target?: THREE_NS.Vector3; update?: () => void };
    duracion: number;
    t: number;
    desdePos: THREE_NS.Vector3;
    hastaPos: THREE_NS.Vector3;
    desdeMira: THREE_NS.Vector3;
    hastaMira: THREE_NS.Vector3;
  } | null = null;

  private constructor(
    T: ThreeModule,
    scene: THREE_NS.Scene,
    config: CiudadConfig,
    trazado: TrazadoResult,
    gamemap: Gamemap,
    escena: import('@zeus/ciudad/scene').CiudadScene | null,
    frontera: CiudadFrontera,
    estadosCanonicos: readonly string[] | null,
    group: THREE_NS.Group,
    nieblaPropia: THREE_NS.FogExp2,
    fogPrevio: THREE_NS.Fog | THREE_NS.FogExp2 | null,
    notariaPos: THREE_NS.Vector3,
    trayectorias: ReturnType<typeof createTrajectoryManager>,
    menosMovimiento: boolean,
    radioCiudad: number,
  ) {
    this.T = T;
    this.scene = scene;
    this.config = config;
    this.trazado = trazado;
    this.gamemap = gamemap;
    this.escena = escena;
    this.frontera = frontera;
    this.estadosCanonicos = estadosCanonicos;
    this.group = group;
    this.nieblaPropia = nieblaPropia;
    this.fogPrevio = fogPrevio;
    this.notariaPos = notariaPos;
    this.trayectorias = trayectorias;
    this.menosMovimiento = menosMovimiento;
    this.radioCiudad = radioCiudad;
    this.idDestacado = config.destacadoBarrioId;
    this.centro = new T.Vector3(0, 1.2, 0);
    this.revelado = menosMovimiento ? 1 : 0;
    this.ultimo =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  }

  static async mount(opts: CiudadMountOptions): Promise<CiudadScene> {
    const T = opts.three ?? (await import('three'));
    const datos = await resolverMapa(opts.mapa);
    const config = opts.config;
    const colorDistrito = { ...COLOR_DISTRITO_DEFAULT, ...config.colorDistrito };
    const trazado = calcularTrazado(datos, { colorDistrito });
    const gamemapFixed = gamemapDesdeMapa(datos, trazado, {
      dryCalle: { ...DRY_CALLE_DEFAULT, ...config.dryCalle },
    });

    const real = await cargarCiudadReal();
    const frontera: CiudadFrontera = { real: [], pendiente: [] };
    const anotarReal = (t: string) => frontera.real.push(t);
    const anotarPend = (que: string, motivo: string) =>
      frontera.pendiente.push({ que, motivo });

    anotarReal('@zeus/ui-3d-kit · createNodeMesh');
    anotarReal('@zeus/ui-3d-kit · createAnchorMarker');
    anotarReal('@zeus/ui-3d-kit · createLinkCorridorBetween');
    anotarReal('@zeus/ui-3d-kit · createTrajectoryManager');
    anotarReal('@zeus/game-engine · sampleLink + linkDistance');
    anotarPend(
      '@zeus/ui-3d-kit · createSceneManager',
      'el host ya posee renderer/cámara/bucle',
    );
    anotarPend(
      '@zeus/ui-3d-kit · createAnimationController',
      'update sin dt; la demo usa ciudad.update(dt)',
    );

    let escena: import('@zeus/ciudad/scene').CiudadScene | null = null;
    if (real.scene) {
      escena = real.scene.sceneFromGamemap(gamemapFixed);
      anotarReal(
        `@zeus/ciudad/scene · sceneFromGamemap (${real.sceneEsp}) — spawn '${escena.spawnNodeId}'`,
      );
    } else {
      anotarPend(
        '@zeus/ciudad/scene · sceneFromGamemap + nodesReachable',
        real.motivos.scene ?? 'no disponible',
      );
    }

    let estadosCanonicos: readonly string[] | null = null;
    if (real.contract) {
      estadosCanonicos = real.contract.BARRIO_ESTADOS;
      anotarReal(`@zeus/ciudad/contract · BARRIO_ESTADOS (${real.contractEsp})`);
      const desconocidos = [
        ...new Set(
          [...trazado.barrios.values()]
            .map((b) => b.estado)
            .filter((e) => !estadosCanonicos!.includes(e)),
        ),
      ];
      if (desconocidos.length) {
        anotarPend('estados del mapa', `fuera de BARRIO_ESTADOS: ${desconocidos.join(', ')}`);
      }
    } else {
      anotarPend(
        '@zeus/ciudad/contract · BARRIO_ESTADOS + SPAWN_NODE_ID',
        real.motivos.contract ?? 'no disponible',
      );
    }

    const menosMovimiento = prefersReducedMotion();
    const radioCiudad = config.radio ?? RADIO_CIUDAD;
    const densidadNiebla = config.densidadNiebla ?? DENSIDAD_NIEBLA;

    const instance = new CiudadScene(
      T,
      opts.scene,
      config,
      trazado,
      gamemapFixed,
      escena,
      frontera,
      estadosCanonicos,
      new T.Group(),
      new T.FogExp2(PALETA.sepia, densidadNiebla),
      opts.scene?.fog ?? null,
      new T.Vector3(),
      createTrajectoryManager({
        particleRadius: 0.17,
        curvature: 3.4,
        channelColors: { ...colorDistrito, notaria: PALETA.oro },
      }),
      menosMovimiento,
      radioCiudad,
    );

    instance.buildScene(datos, gamemapFixed, colorDistrito, real);
    return instance;
  }

  private col(hex: number): THREE_NS.Color {
    return new this.T.Color(hex);
  }

  private tinte(a: number, b: number, t: number): THREE_NS.Color {
    return this.col(a).lerp(this.col(b), t);
  }

  private punto(radio: number, ang: number, y = 0): THREE_NS.Vector3 {
    return new this.T.Vector3(
      radio * Math.cos(ang),
      y,
      -radio * Math.sin(ang),
    );
  }

  private buildScene(
    _datos: MapaData,
    gamemap: Gamemap,
    colorDistrito: Record<string, number>,
    real: Awaited<ReturnType<typeof cargarCiudadReal>>,
  ): void {
    const T = this.T;
    const scene = this.scene;
    const trazado = this.trazado;
    const group = this.group;
    group.name = 'ciudad';

    if (scene) scene.fog = this.nieblaPropia;

    const colorBruma = this.tinte(PALETA.sepia, PALETA.tinta, 0.14);
    const bruma = new T.Group();
    bruma.name = 'ciudad-bruma';
    const texVelo = texturaDegradadoVertical(T);
    if (texVelo) this.desechables.push(texVelo);
    const velo = new T.Mesh(
      new T.CylinderGeometry(78, 78, ALTURA_BRUMA, 72, 1, true),
      new T.MeshBasicMaterial({
        map: texVelo,
        color: colorBruma,
        transparent: true,
        opacity: 0.52,
        side: T.BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    velo.position.y = ALTURA_BRUMA / 2 - 30;
    bruma.add(velo);

    const texDisco = texturaDiscoBruma(T);
    if (texDisco) this.desechables.push(texDisco);
    [
      { y: -3.2, r: 96, op: 0.2, vel: 0.0075 },
      { y: 0.9, r: 78, op: 0.11, vel: -0.0052 },
    ].forEach((cfg, i) => {
      const disco = new T.Mesh(
        new T.CircleGeometry(cfg.r, 72),
        new T.MeshBasicMaterial({
          map: texDisco,
          color: colorBruma,
          transparent: true,
          opacity: cfg.op,
          depthWrite: false,
          side: T.DoubleSide,
          fog: false,
        }),
      );
      disco.rotation.x = -Math.PI / 2;
      disco.position.y = cfg.y;
      disco.renderOrder = -10 + i;
      bruma.add(disco);
      this.latidos.push({
        tic: (t) => {
          disco.rotation.z = t * cfg.vel * TAU;
        },
      });
    });
    group.add(bruma);

    const luces = new T.Group();
    luces.name = 'ciudad-luz';
    const hemi = new T.HemisphereLight(PALETA.tinta, PALETA.sepia, 0.85);
    hemi.position.set(0, 40, 0);
    const sol = new T.DirectionalLight(PALETA.tinta, 0.9);
    sol.position.set(22, 34, 16);
    luces.add(hemi, sol);
    group.add(luces);

    const capaMesetas = new T.Group();
    capaMesetas.name = 'ciudad-mesetas';
    trazado.mesetas.forEach((m, i) => {
      const geo = geometriaMeseta(T, m.rIn, m.rOut, m.a0, m.a1, m.grosor);
      const base = m.vacia
        ? this.tinte(PALETA.sepia, PALETA.tinta, 0.1)
        : this.tinte(m.color, PALETA.sepia, 0.78);
      const mat = new T.MeshStandardMaterial({
        color: base,
        emissive: m.vacia
          ? this.tinte(PALETA.sepia, PALETA.tinta, 0.05)
          : this.tinte(m.color, PALETA.sepia, 0.88),
        emissiveIntensity: m.vacia ? 0.3 : 0.62,
        roughness: 0.92,
        metalness: 0.06,
      });
      const malla = new T.Mesh(geo, mat);
      malla.name = `meseta:${m.id}`;
      malla.userData = {
        tipo: 'meseta',
        id: m.id,
        distrito: m.id,
        holonId: m.holonId,
      };
      malla.position.y = m.elevacion;
      capaMesetas.add(malla);
      m.malla = malla;

      const retardo = 0.02 * i;
      this.animables.push({
        retardo,
        duracion: 0.55,
        aplicar: (p) => {
          malla.position.y = mezcla(m.elevacion - 7.5, m.elevacion, FACIL.salida(p));
        },
      });

      if (!m.vacia) {
        const cornisa = new T.Mesh(
          new T.TorusGeometry(m.rOut - 0.06, 0.055, 6, 96, m.a1 - m.a0),
          new T.MeshStandardMaterial({
            color: this.tinte(m.color, PALETA.sepia, 0.35),
            emissive: this.col(m.color),
            emissiveIntensity: 0.5,
            roughness: 0.6,
            metalness: 0.2,
            transparent: true,
            opacity: 0.85,
          }),
        );
        cornisa.rotation.x = -Math.PI / 2;
        cornisa.rotation.z = m.a0;
        malla.add(cornisa);
      }
    });
    group.add(capaMesetas);

    const capaBarrios = new T.Group();
    capaBarrios.name = 'ciudad-barrios';
    const ESTADOS = ESTADOS_VISUAL;
    let indiceBarrio = 0;

    for (const b of trazado.barrios.values()) {
      if (b.radio === undefined) continue;
      const est = ESTADOS[b.estado as keyof typeof ESTADOS] || ESTADOS.latente;
      const rel = Math.log1p(b.aristas) / Math.log1p(trazado.maxAristas);
      const altura = (1.15 + 2.9 * rel) * est.alturaK;
      const radio = (0.62 + 0.26 * rel) * est.radioK;
      const colorBase = this.tinte(b.color!, PALETA.sepia, est.apagado);

      const nodo = new T.Group();
      const pos = this.punto(b.radio, b.angulo!, b.elevacion!);
      nodo.position.copy(pos);
      nodo.rotation.y = semilla(b.id) * TAU;
      nodo.name = `barrio:${b.id}`;
      nodo.userData = {
        tipo: 'barrio',
        id: b.id,
        nombre: b.nombre,
        distrito: b.distrito,
        holonId: b.holonId,
        estado: b.estado,
        aristas: b.aristas,
        numero: b.numero,
      };

      const geoTorre = new T.CylinderGeometry(radio * 0.74, radio, altura, 6, 1);
      geoTorre.translate(0, altura / 2, 0);
      const matTorre = new T.MeshStandardMaterial({
        color: colorBase,
        emissive: colorBase,
        emissiveIntensity: est.emissive,
        roughness: 0.55,
        metalness: 0.18,
        transparent: est.opacidad < 1,
        opacity: est.opacidad,
      });
      const torre = new T.Mesh(geoTorre, matTorre);
      torre.userData = nodo.userData;
      nodo.add(torre);

      if (b.aristas > 0) {
        const corona = new T.Mesh(
          new T.TorusGeometry(radio * (1.25 + 0.5 * rel), 0.045 + 0.03 * rel, 8, 40),
          new T.MeshStandardMaterial({
            color: this.tinte(b.color!, PALETA.tinta, 0.35),
            emissive: this.tinte(b.color!, PALETA.oro, 0.3),
            emissiveIntensity: 0.55,
            roughness: 0.4,
            metalness: 0.35,
          }),
        );
        corona.rotation.x = -Math.PI / 2;
        corona.position.y = altura + 0.22;
        nodo.add(corona);
        this.latidos.push({
          tic: (t) => {
            corona.rotation.z =
              FACIL.seno(((t * 0.06 + semilla(b.id)) % 1)) * TAU * 0.25;
          },
        });
      }

      capaBarrios.add(nodo);
      this.anclas.set(b.id, {
        barrio: b,
        grupo: nodo,
        malla: torre,
        material: matTorre,
        base: pos.clone(),
        cima: pos.clone().setY(pos.y + altura),
        altura,
      });

      const retardo = 0.26 + 0.012 * indiceBarrio;
      this.animables.push({
        retardo,
        duracion: 0.5,
        aplicar: (p) => {
          nodo.scale.y = 0.001 + 0.999 * FACIL.salida(p);
        },
      });
      indiceBarrio++;
    }
    group.add(capaBarrios);

    const mesetaPorId = new Map(trazado.mesetas.map((m) => [m.id, m]));
    const matKit: Array<{ m: THREE_NS.Material; objetivo: number }> = [];
    const vistosKit = new Set<THREE_NS.Material>();
    const recogerKit = (raiz: THREE_NS.Object3D) => {
      raiz.traverse((o: THREE_NS.Object3D) => {
        const mesh = o as THREE_NS.Mesh;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : mesh.material
            ? [mesh.material]
            : [];
        for (const m of mats) {
          if (vistosKit.has(m)) continue;
          vistosKit.add(m);
          const std = m as THREE_NS.MeshStandardMaterial;
          matKit.push({ m: std, objetivo: std.opacity ?? 1 });
          std.opacity = 0;
        }
      });
    };

    const capaNodos = new T.Group();
    capaNodos.name = 'ciudad-nodos';
    for (const nodo of Object.values(gamemap.nodos)) {
      const m = mesetaPorId.get(nodo.mesetaId ?? '');
      const anfitrion = (m && m.malla ? (m.malla as THREE_NS.Object3D) : null) || capaNodos;
      const color = m && !m.vacia ? m.color : PALETA.oro;
      const cuantas = (nodo.anclas || []).length;
      const radio = nodo.id === 'plaza' ? 2.7 : pinza(1.15 + 0.2 * cuantas, 1.15, 3.1);

      const disco = createNodeMesh({
        radius: radio,
        color,
        segments: 40,
        name: `nodo:${nodo.id}`,
      });
      tematizar(disco, {
        acento: color,
        trama: this.tinte(color, PALETA.tinta, 0.25),
        fondo: this.tinte(PALETA.sepia, color, 0.16),
        alfa: nodo.sinBarrios ? 0.42 : 0.9,
      });
      disco.userData = {
        tipo: 'nodo',
        id: nodo.id,
        kind: nodo.kind,
        role: nodo.role,
        holonId: nodo.holonId,
        anclas: cuantas,
        razonSinBarrio: nodo.razonSinBarrio || null,
      };
      disco.position.set(
        nodo.entrada.x,
        m && m.malla ? 0.045 : nodo.entrada.y + 0.045,
        nodo.entrada.z,
      );
      recogerKit(disco);
      anfitrion.add(disco);
    }
    group.add(capaNodos);

    const capaAnclas = new T.Group();
    capaAnclas.name = 'ciudad-anclas';
    for (const ancla of Object.values(gamemap.anclas)) {
      const b = trazado.barrios.get(ancla.barrioId);
      const m = b?.distritoRef;
      const anfitrion = (m && m.malla ? (m.malla as THREE_NS.Object3D) : null) || capaAnclas;
      const est = ESTADOS[ancla.estado as keyof typeof ESTADOS] || ESTADOS.latente;
      const color = (b && b.color) || PALETA.tinta;

      const marca = createAnchorMarker({
        position: {
          x: ancla.position.x,
          y: m && m.malla ? 0.02 : ancla.position.y + 0.02,
          z: ancla.position.z,
        },
        facing: ancla.facing,
        color,
        name: ancla.id,
      });
      marca.scale.setScalar(0.62 + 0.22 * est.alturaK);
      tematizar(marca, {
        acento: this.tinte(color, PALETA.tinta, 0.2),
        trama: this.col(color),
        fondo: this.tinte(PALETA.sepia, color, 0.22),
        alfa: est.opacidad * 0.9,
      });
      marca.userData = {
        tipo: 'ancla',
        id: ancla.id,
        barrio: ancla.barrioId,
        estado: ancla.estado,
        parent: ancla.parent,
        handoffEdges: ancla.handoffEdges,
      };
      recogerKit(marca);
      anfitrion.add(marca);
      this.marcasKit.set(ancla.barrioId, marca);
    }
    group.add(capaAnclas);

    const capaEnlaces = new T.Group();
    capaEnlaces.name = 'ciudad-enlaces';
    for (const enlace of Object.values(gamemap.enlaces)) {
      const wp = enlace.waypoints || [];
      if (wp.length < 2) continue;
      const destino = mesetaPorId.get(enlace.to);
      const color = destino && !destino.vacia ? destino.color : PALETA.tinta;
      const largo = linkDistance(wp);
      const tramos = pinza(Math.round(largo / 5.5), 1, 6);
      const gasto = enlace.dry === 'gobierno' ? 1 : 0.78;

      for (let i = 0; i < tramos; i++) {
        const a = sampleLink(wp, i / tramos);
        const c = sampleLink(wp, (i + 1) / tramos);
        const corredor = createLinkCorridorBetween(
          { x: a.x, y: a.y, z: a.z ?? 0 },
          { x: c.x, y: c.y, z: c.z ?? 0 },
          {
            width: 1.55 * gasto,
            height: 1.2 * gasto,
            segments: 5,
          },
        );
        corredor.name = `${enlace.id}#${i}`;
        corredor.userData = {
          tipo: 'enlace',
          id: enlace.id,
          dry: enlace.dry,
          tramo: i,
          largo,
        };
        tematizar(corredor, {
          acento: this.tinte(color, PALETA.oro, 0.3),
          trama: this.tinte(color, PALETA.tinta, 0.15),
          fondo: this.tinte(PALETA.sepia, color, 0.2),
          alfa: 0.5 * gasto,
        });
        recogerKit(corredor);
        capaEnlaces.add(corredor);
      }
    }
    group.add(capaEnlaces);

    this.animables.push({
      retardo: 0.44,
      duracion: 0.56,
      aplicar: (p) => {
        const e = FACIL.salida(p);
        for (const { m, objetivo } of matKit) m.opacity = objetivo * e;
      },
    });

    const trazos = { pos: [] as number[], col: [] as number[] };
    const empujarPolilinea = (
      puntos: THREE_NS.Vector3[],
      color: number,
      alfa: number,
    ) => {
      const c = this.col(color).multiplyScalar(alfa);
      for (let i = 0; i < puntos.length - 1; i++) {
        const p = puntos[i]!;
        const q = puntos[i + 1]!;
        trazos.pos.push(p.x, p.y, p.z, q.x, q.y, q.z);
        trazos.col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    };
    const arco = (radio: number, a0: number, a1: number, y: number, n = 18) => {
      const pts: THREE_NS.Vector3[] = [];
      for (let i = 0; i <= n; i++) {
        pts.push(this.punto(radio, mezcla(a0, a1, i / n), y));
      }
      return pts;
    };

    for (const m of trazado.mesetas) {
      if (m.vacia || !m.anillos || m.anillos.length === 0) continue;
      const yCalle = m.elevacion + 0.035;
      const alfaBase =
        0.3 +
        0.35 * (Math.log1p(m.aristas) / Math.log1p(trazado.maxAristasDistrito));

      empujarPolilinea(
        arco(m.paseo!, m.a0 + 0.02, m.a1 - 0.02, yCalle, 22),
        m.color,
        alfaBase * 0.8,
      );

      for (const anillo of m.anillos) {
        for (let i = 0; i < anillo.puntos.length - 1; i++) {
          empujarPolilinea(
            arco(anillo.radio, anillo.puntos[i]!.ang, anillo.puntos[i + 1]!.ang, yCalle, 10),
            m.color,
            alfaBase,
          );
        }
        for (const p of anillo.puntos) {
          const desde = this.punto(anillo.radio, p.ang, yCalle);
          const hasta = this.punto(m.paseo!, p.ang, yCalle);
          const medio = this.punto(
            mezcla(anillo.radio, m.paseo!, 0.5),
            mezcla(p.ang, m.medio, 0.22),
            yCalle + 0.02,
          );
          const curva = new T.QuadraticBezierCurve3(desde, medio, hasta);
          empujarPolilinea(curva.getPoints(10), m.color, alfaBase * 0.75);
        }
      }
    }

    const notariaPos = this.punto(
      trazado.notaria.radio,
      trazado.notaria.ang,
      trazado.notaria.elevacion,
    );
    this.notariaPos.copy(notariaPos);

    const capaAvenidas = new T.Group();
    capaAvenidas.name = 'ciudad-avenidas';

    const bocaNotaria = (desde: THREE_NS.Vector3, alturaExtra = 0.85) => {
      const dir = new T.Vector3(desde.x - notariaPos.x, 0, desde.z - notariaPos.z);
      if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
      dir.normalize().multiplyScalar(2.1);
      return notariaPos.clone().add(dir).setY(notariaPos.y + alturaExtra);
    };

    for (const [id, ancla] of this.anclas) {
      const b = ancla.barrio;
      if (b.aristas <= 0) continue;
      const rel = b.aristas / trazado.maxAristas;
      const desde = ancla.cima.clone().add(new T.Vector3(0, 0.22, 0));
      const hasta = bocaNotaria(desde);
      const control = desde.clone().lerp(hasta, 0.5);
      control.y = Math.max(desde.y, hasta.y) + 2.4 + 2.2 * rel;
      const curva = new T.QuadraticBezierCurve3(desde, control, hasta);

      const radioTubo = 0.05 + 0.15 * rel;
      const colorAv = this.tinte(b.color!, PALETA.oro, 0.42);
      const matAv = new T.MeshStandardMaterial({
        color: colorAv,
        emissive: colorAv,
        emissiveIntensity: 0.28 + 0.26 * rel,
        roughness: 0.45,
        metalness: 0.25,
        transparent: true,
        opacity: 0,
      });
      const tubo = new T.Mesh(
        new T.TubeGeometry(curva, 56, radioTubo, 8, false),
        matAv,
      );
      tubo.name = `avenida:${id}`;
      capaAvenidas.add(tubo);

      const opacidadFinal = 0.55 + 0.35 * rel;
      const emisionBase = matAv.emissiveIntensity;
      this.animables.push({
        retardo: 0.62 + 0.03 * capaAvenidas.children.length,
        duracion: 0.5,
        aplicar: (p) => {
          matAv.opacity = opacidadFinal * FACIL.salida(p);
        },
      });
      const fase = semilla(id);
      this.latidos.push({
        tic: (t) => {
          const o = FACIL.seno(((t * 0.11 + fase) % 1));
          matAv.emissiveIntensity = emisionBase * (0.82 + 0.28 * o);
        },
      });
    }
    group.add(capaAvenidas);

    this.trayectorias.setScene(capaAvenidas);
    const emisores: Array<{
      id: string;
      canal: string | undefined;
      desde: THREE_NS.Vector3;
      hasta: THREE_NS.Vector3;
      periodo: number;
      velocidad: number;
      reloj: number;
      n: number;
    }> = [];

    for (const [id, ancla] of this.anclas) {
      const b = ancla.barrio;
      if (b.aristas <= 0) continue;
      const rel = b.aristas / trazado.maxAristas;
      const desde = ancla.cima.clone().add(new T.Vector3(0, 0.3, 0));
      emisores.push({
        id,
        canal: b.distrito,
        desde,
        hasta: bocaNotaria(desde, 1.15),
        periodo: 11 / (0.55 + 4.2 * rel),
        velocidad: 1 / (2.6 + 1.7 * (1 - rel)),
        reloj: semilla(id) * 7,
        n: 0,
      });
    }

    let trafico = 0;
    if (emisores.length) {
      this.animables.push({
        retardo: 0.78,
        duracion: 0.22,
        aplicar: (p) => {
          trafico = FACIL.salida(p);
        },
      });
      this.latidos.push({
        tic: (t, dt) => {
          if (this.menosMovimiento || trafico <= 0 || dt <= 0) return;
          for (const e of emisores) {
            e.reloj += dt;
            if (e.reloj < e.periodo) continue;
            e.reloj = 0;
            e.n += 1;
            this.trayectorias.createMessageParticle(
              `${e.id}#${e.n}`,
              e.desde,
              e.hasta,
              e.canal,
              e.velocidad,
            );
          }
          this.trayectorias.updateParticles(dt);
        },
      });
    }

    for (const m of trazado.mesetas) {
      if (m.vacia || m.aristas > 0 || !m.hub) continue;
      const desde = this.punto(m.hub.radio, m.hub.ang, m.elevacion + 0.05);
      const hasta = bocaNotaria(desde, 0.35);
      const control = desde.clone().lerp(hasta, 0.5);
      control.y = Math.max(desde.y, hasta.y) + 1.9;
      empujarPolilinea(
        new T.QuadraticBezierCurve3(desde, control, hasta).getPoints(28),
        m.color,
        0.16,
      );
    }

    const capaCalles = new T.Group();
    capaCalles.name = 'ciudad-calles';
    if (trazos.pos.length) {
      const geoCalles = new T.BufferGeometry();
      geoCalles.setAttribute('position', new T.Float32BufferAttribute(trazos.pos, 3));
      geoCalles.setAttribute('color', new T.Float32BufferAttribute(trazos.col, 3));
      const matCalles = new T.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: T.AdditiveBlending,
        depthWrite: false,
      });
      const calles = new T.LineSegments(geoCalles, matCalles);
      capaCalles.add(calles);
      this.animables.push({
        retardo: 0.5,
        duracion: 0.5,
        aplicar: (p) => {
          matCalles.opacity = 0.9 * FACIL.salida(p);
        },
      });
    }
    group.add(capaCalles);

    const notaria = new T.Group();
    notaria.name = 'notaria';
    notaria.position.copy(notariaPos);
    {
      const h = trazado.notaria.altura;
      const oroClaro = this.tinte(PALETA.oro, PALETA.tinta, 0.3);

      const plinto = new T.Mesh(
        new T.CylinderGeometry(2.5, 2.9, 0.7, 8),
        new T.MeshStandardMaterial({
          color: this.tinte(PALETA.oro, PALETA.sepia, 0.68),
          emissive: this.tinte(PALETA.oro, PALETA.sepia, 0.8),
          emissiveIntensity: 0.6,
          roughness: 0.8,
          metalness: 0.2,
        }),
      );
      plinto.position.y = 0.35;
      notaria.add(plinto);

      const matFuste = new T.MeshStandardMaterial({
        color: this.tinte(PALETA.oro, PALETA.sepia, 0.32),
        emissive: this.col(PALETA.oro),
        emissiveIntensity: 0.34,
        roughness: 0.42,
        metalness: 0.45,
      });
      const fuste = new T.Mesh(new T.CylinderGeometry(0.72, 1.5, h, 8, 1), matFuste);
      fuste.position.y = 0.7 + h / 2;
      notaria.add(fuste);

      const matRemate = new T.MeshStandardMaterial({
        color: oroClaro,
        emissive: this.col(PALETA.oro),
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.6,
      });
      const remate = new T.Mesh(new T.OctahedronGeometry(0.85, 0), matRemate);
      remate.position.y = 0.7 + h + 0.75;
      notaria.add(remate);

      const anillo = new T.Mesh(
        new T.TorusGeometry(2.05, 0.075, 10, 96),
        new T.MeshStandardMaterial({
          color: oroClaro,
          emissive: this.col(PALETA.oro),
          emissiveIntensity: 0.75,
          roughness: 0.3,
          metalness: 0.55,
          transparent: true,
          opacity: 0.92,
        }),
      );
      anillo.rotation.x = Math.PI / 2.35;
      anillo.position.y = 0.7 + h * 0.72;
      notaria.add(anillo);

      const faro = new T.PointLight(PALETA.oro, 26, 46, 2);
      faro.position.y = 0.7 + h + 0.75;
      notaria.add(faro);

      this.latidos.push({
        tic: (t) => {
          anillo.rotation.z = t * 0.22;
          anillo.rotation.y = Math.sin(t * 0.17) * 0.35;
          const r = FACIL.seno(((t * 0.13) % 1));
          remate.rotation.y = t * 0.16;
          remate.position.y = 0.7 + h + 0.75 + 0.16 * (r - 0.5);
          matRemate.emissiveIntensity = 0.78 + 0.28 * r;
          faro.intensity = 22 + 8 * r;
        },
      });
      this.animables.push({
        retardo: 0.04,
        duracion: 0.62,
        aplicar: (p) => {
          const e = FACIL.salida(p);
          notaria.scale.setScalar(0.02 + 0.98 * e);
          notaria.position.y = mezcla(notariaPos.y - 4.5, notariaPos.y, e);
        },
      });
    }
    group.add(notaria);

    const capaDestacado = new T.Group();
    capaDestacado.name = 'ciudad-destacado';
    const destacado = this.anclas.get(this.idDestacado);
    if (destacado) {
      const pos = destacado.base;
      const colorD = this.tinte(destacado.barrio.color!, PALETA.oro, 0.34);

      const halo = new T.Mesh(
        new T.RingGeometry(1.25, 1.9, 72),
        new T.MeshBasicMaterial({
          color: colorD,
          transparent: true,
          opacity: 0,
          side: T.DoubleSide,
          depthWrite: false,
          blending: T.AdditiveBlending,
          fog: false,
        }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.copy(pos).add(new T.Vector3(0, 0.06, 0));
      capaDestacado.add(halo);

      const candil = new T.PointLight(PALETA.oro, 7, 16, 2);
      candil.position.copy(destacado.cima).add(new T.Vector3(0, 0.8, 0));
      capaDestacado.add(candil);

      const emisionBase = destacado.material.emissiveIntensity;
      const colorFrio = destacado.material.color.clone();
      const colorCalido = colorFrio.clone().lerp(this.col(PALETA.oro), 0.28);
      let presencia = 0;

      this.latidos.push({
        tic: (t) => {
          const e = FACIL.latido((t * 0.3) % 1);
          destacado.material.emissiveIntensity = emisionBase + 0.3 * e;
          destacado.material.emissive.copy(colorFrio).lerp(colorCalido, 0.55 * e);
          (halo.material as THREE_NS.MeshBasicMaterial).opacity =
            (0.16 + 0.2 * e) * presencia;
          halo.scale.setScalar(1 + 0.1 * e);
          candil.intensity = (5.5 + 5.5 * e) * presencia;
        },
      });
      this.animables.push({
        retardo: 0.8,
        duracion: 0.2,
        aplicar: (p) => {
          presencia = FACIL.salida(p);
        },
      });
    }
    group.add(capaDestacado);

    const capaRotulos = new T.Group();
    capaRotulos.name = 'ciudad-rotulos';
    const rotulos: Array<{ sprite: THREE_NS.Sprite; opacidad: number }> = [];
    const rotular = (
      texto: string,
      posicion: THREE_NS.Vector3,
      cfg: { color?: string; altura?: number; opacidad?: number } = {},
    ) => {
      const sp = crearEtiqueta(T, texto, cfg);
      if (!sp) return null;
      sp.position.copy(posicion);
      sp.renderOrder = 6;
      capaRotulos.add(sp);
      rotulos.push({ sprite: sp, opacidad: cfg.opacidad ?? 0.82 });
      return sp;
    };

    for (const m of trazado.mesetas) {
      const y = m.elevacion + (m.vacia ? 2.0 : 3.9);
      const r = (m.rIn + m.rOut) / 2;
      rotular(
        m.vacia ? nombreCorto(m.nombre) : m.nombre,
        this.punto(r, m.medio, y),
        {
          color: colorCss(
            this.tinte(m.vacia ? PALETA.tinta : m.color, PALETA.tinta, 0.45),
          ),
          altura: m.vacia ? 1.15 : 1.45,
          opacidad: m.vacia ? 0.45 : 0.8,
        },
      );
    }
    rotular(
      'NOTARÍA',
      notariaPos.clone().add(new T.Vector3(0, trazado.notaria.altura + 3.0, 0)),
      { color: colorCss(this.col(PALETA.oro)), altura: 1.9, opacidad: 0.95 },
    );
    if (destacado) {
      rotular(
        destacado.barrio.nombre,
        destacado.cima.clone().add(new T.Vector3(0, 1.5, 0)),
        {
          color: colorCss(this.tinte(PALETA.tinta, PALETA.oro, 0.35)),
          altura: 1.2,
          opacidad: 0.9,
        },
      );
    }
    this.animables.push({
      retardo: 0.82,
      duracion: 0.18,
      aplicar: (p) => {
        const e = FACIL.salida(p);
        for (const r of rotulos) {
          (r.sprite.material as THREE_NS.SpriteMaterial).opacity = r.opacidad * e;
        }
      },
    });
    group.add(capaRotulos);

    if (scene && typeof scene.add === 'function') scene.add(group);

    if (real.scene) {
      const ancla = gamemap.anclas[`ancla-${this.idDestacado}`];
      if (ancla) {
        const ok = real.scene.nodesReachable(
          gamemap.enlaces,
          gamemap.gobierno.gobierna,
          ancla.parent,
        );
        this.frontera.real.push(
          `@zeus/ciudad/scene · nodesReachable — plaza→${this.idDestacado}: ${ok ? 'sí' : 'NO'}`,
        );
      }
    }

    this.aplicarRevelado();
    if (this.menosMovimiento) {
      for (const l of this.latidos) l.tic(0.9, 0);
    } else if (typeof requestAnimationFrame === 'function') {
      this.raf = requestAnimationFrame(() => this.tic());
    } else {
      this.revelado = 1;
      this.aplicarRevelado();
    }
  }

  private aplicarRevelado(): void {
    for (const a of this.animables) {
      const p = pinza((this.revelado - a.retardo) / a.duracion, 0, 1);
      a.aplicar(p);
    }
  }

  private paso(dt: number): void {
    this.reloj += dt;
    if (this.revelado < 1) {
      this.revelado = pinza(this.revelado + dt / DUR_REVELADO, 0, 1);
      this.aplicarRevelado();
      if (this.revelado >= 1 && this.resolverListo && !this.camaraAnim) {
        this.resolverListo();
        this.resolverListo = null;
      }
    }
    if (!this.menosMovimiento) {
      for (const l of this.latidos) l.tic(this.reloj, dt);
    }

    if (this.camaraAnim) {
      this.camaraAnim.t = pinza(
        this.camaraAnim.t + dt / this.camaraAnim.duracion,
        0,
        1,
      );
      const e = FACIL.suave(this.camaraAnim.t);
      this.camaraAnim.camera.position.lerpVectors(
        this.camaraAnim.desdePos,
        this.camaraAnim.hastaPos,
        e,
      );
      const mira = this.camaraAnim.desdeMira
        .clone()
        .lerp(this.camaraAnim.hastaMira, e);
      if (this.camaraAnim.controls?.target) {
        this.camaraAnim.controls.target.copy(mira);
        this.camaraAnim.controls.update?.();
      } else {
        this.camaraAnim.camera.lookAt(mira);
      }
      if (this.camaraAnim.t >= 1) {
        this.camaraAnim = null;
        if (this.revelado >= 1 && this.resolverListo) {
          this.resolverListo();
          this.resolverListo = null;
        }
      }
    }
  }

  private tic(): void {
    if (!this.vivo || this.externo) {
      this.raf = 0;
      return;
    }
    const ahora =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) /
      1000;
    const dt = pinza(ahora - this.ultimo, 0, 0.1);
    this.ultimo = ahora;
    this.paso(dt);
    this.raf = requestAnimationFrame(() => this.tic());
  }

  barrioAnchor(barrioId: string): THREE_NS.Vector3 {
    const a =
      this.anclas.get(barrioId) ||
      [...this.anclas.values()].find(
        (x) => x.barrio.slug === barrioId || x.barrio.nombre === barrioId,
      );
    if (!a) {
      return this.centro.clone();
    }
    return a.base.clone();
  }

  barrioCima(barrioId: string): THREE_NS.Vector3 {
    const a = this.anclas.get(barrioId);
    return a ? a.cima.clone() : this.centro.clone();
  }

  notariaAnchor(): THREE_NS.Vector3 {
    return this.notariaPos.clone();
  }

  focusCity(arg?: FocusCityArg): FocusCityResult {
    const cfg =
      arg && 'isCamera' in arg && (arg as THREE_NS.Camera).isCamera
        ? { camera: arg as THREE_NS.Camera }
        : (arg as Exclude<FocusCityArg, THREE_NS.Camera>) || {};
    const camera = cfg.camera ?? null;
    const controls = cfg.controls ?? null;
    const duracion = cfg.duracion ?? 2.2;

    const destacado = this.anclas.get(this.idDestacado);
    const guia = destacado
      ? new this.T.Vector3(destacado.base.x, 0, destacado.base.z)
      : new this.T.Vector3(1, 0, 0);
    if (guia.lengthSq() < 1e-6) guia.set(1, 0, 0);
    guia.normalize();

    const distancia = this.radioCiudad * 1.55;
    const camara = new this.T.Vector3(
      guia.x * distancia,
      this.radioCiudad * 0.86,
      guia.z * distancia,
    );
    const mirarA = this.centro.clone().setY(this.centro.y + 2.4);

    if (!this.promesaListo) {
      this.promesaListo = new Promise((res) => {
        this.resolverListo = res;
      });
    }

    if (camera) {
      if (this.menosMovimiento || duracion <= 0) {
        camera.position.copy(camara);
        if (controls?.target) {
          controls.target.copy(mirarA);
          controls.update?.();
        } else {
          camera.lookAt(mirarA);
        }
      } else {
        const mirada = controls?.target
          ? controls.target.clone()
          : camera
              .getWorldDirection(new this.T.Vector3())
              .multiplyScalar(distancia)
              .add(camera.position);
        this.camaraAnim = {
          camera,
          controls: controls ?? undefined,
          duracion,
          t: 0,
          desdePos: camera.position.clone(),
          hastaPos: camara.clone(),
          desdeMira: mirada,
          hastaMira: mirarA.clone(),
        };
      }
    }
    if (this.revelado >= 1 && !this.camaraAnim && this.resolverListo) {
      this.resolverListo();
      this.resolverListo = null;
    }

    return {
      centro: this.centro.clone(),
      mirarA,
      camara,
      radio: this.radioCiudad,
      distancia,
      listo: this.promesaListo,
    };
  }

  update(dt?: number): void {
    if (!this.vivo) return;
    if (!this.externo) {
      this.externo = true;
      if (this.raf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.raf);
      }
      this.raf = 0;
    }
    const d =
      typeof dt === 'number' && Number.isFinite(dt) ? pinza(dt, 0, 0.1) : 1 / 60;
    if (this.menosMovimiento) {
      if (this.revelado < 1) {
        this.revelado = 1;
        this.aplicarRevelado();
      }
      if (this.camaraAnim) this.paso(d);
      return;
    }
    this.paso(d);
  }

  resaltarBarrio(barrioId: string, encendido = true): boolean {
    const a = this.anclas.get(barrioId);
    if (!a) return false;
    const est =
      ESTADOS_VISUAL[a.barrio.estado as keyof typeof ESTADOS_VISUAL] ||
      ESTADOS_VISUAL.latente;
    a.material.emissiveIntensity = encendido
      ? est.emissive + 0.34
      : est.emissive;
    const marca = this.marcasKit.get(barrioId);
    if (marca) {
      marca.scale.setScalar((0.62 + 0.22 * est.alturaK) * (encendido ? 1.4 : 1));
    }
    return true;
  }

  dispose(): void {
    this.vivo = false;
    if (this.raf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.raf);
    }
    this.raf = 0;
    this.animables.length = 0;
    this.latidos.length = 0;
    try {
      this.trayectorias.dispose();
    } catch {
      /* ya estaba */
    }
    this.marcasKit.clear();
    if (this.scene) {
      if (this.group.parent === this.scene) this.scene.remove(this.group);
      else if (this.group.parent) this.group.parent.remove(this.group);
      if (this.scene.fog === this.nieblaPropia) this.scene.fog = this.fogPrevio;
    } else if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    desecharArbol(this.group);
    for (const d of this.desechables) {
      try {
        d.dispose?.();
      } catch {
        /* da igual */
      }
    }
    this.desechables.length = 0;
    this.anclas.clear();
  }
}
