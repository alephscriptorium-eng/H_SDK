import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import mapaJson from '../../assets/mapa/mapa.json' with { type: 'json' };
import type { HostConfig } from '../config/types.ts';
import { CiudadScene } from '../ciudad/CiudadScene.ts';
import { BarrioScene } from '../barrio/BarrioScene.ts';
import { FlujoFx } from '../flujo/FlujoFx.ts';
import {
  CAMARA_FAR,
  CAMARA_NEAR,
  CAMARA_POS_INICIAL,
  CREMALLERA_HOST,
  EXPOSICION_DEFAULT,
  FOV,
  HONDURA,
  ORBIT_CIUDAD,
} from '../layout/tokens.ts';
import { barrioBarrioLore, ciudadBarrioLore } from '../fixtures/barrio-lore.ts';
import { prefersReducedMotion } from '../shared/motion.ts';
import { PALETA } from '../theme/tokens.ts';
import type { MapaData } from '../ciudad/trazado.ts';
import {
  encuadreAereo,
  duracionDescenso,
  orbitCeremonia,
  pasoVuelo,
  poseCeremonia,
  volar,
  waypointsDescenso,
  type VueloActivo,
} from './CameraRails.ts';

export type SceneHostOptions = {
  mount?: HTMLElement;
  mapa?: MapaData | string;
  config?: HostConfig;
  three?: typeof THREE;
  sombras?: boolean;
  exposicion?: number;
  toneMapping?: boolean;
  reducido?: boolean;
};

export type HostAct = 'overlook' | 'approach' | 'ceremony';

export type CueArgs = Record<string, unknown>;

export class SceneHost {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;

  private readonly T: typeof THREE;
  private readonly config: HostConfig;
  private readonly reducido: boolean;
  private readonly hondura: number;

  private ciudad: CiudadScene | null = null;
  private barrio: BarrioScene | null = null;
  private flujo: FlujoFx | null = null;
  private barrioPromise: Promise<BarrioScene> | null = null;

  private act: HostAct = 'overlook';
  private vuelo: VueloActivo | null = null;
  private miraScratch = new THREE.Vector3();
  private ultimoMs = 0;
  private disposed = false;

  private constructor(
    T: typeof THREE,
    config: HostConfig,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    reducido: boolean,
    hondura: number,
  ) {
    this.T = T;
    this.config = config;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.reducido = reducido;
    this.hondura = hondura;
  }

  static async create(opts: SceneHostOptions = {}): Promise<SceneHost> {
    const T = opts.three ?? THREE;
    const config: HostConfig = {
      barrioId: opts.config?.barrioId ?? 'document-machine-sdk',
      ...opts.config,
    };
    const reducido = prefersReducedMotion(opts.reducido);
    const hondura = config.hondura ?? HONDURA;
    const mount = opts.mount ?? document.body;

    const renderer = new T.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(PALETA.sepia, 1);
    const tone = opts.toneMapping ?? true;
    renderer.toneMapping = tone ? T.ACESFilmicToneMapping : T.NoToneMapping;
    renderer.toneMappingExposure = opts.exposicion ?? EXPOSICION_DEFAULT;
    if (opts.sombras ?? true) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
    }
    mount.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(
      config.fov ?? FOV,
      window.innerWidth / Math.max(1, window.innerHeight),
      CAMARA_NEAR,
      CAMARA_FAR,
    );
    camera.position.set(
      CAMARA_POS_INICIAL.x,
      CAMARA_POS_INICIAL.y,
      CAMARA_POS_INICIAL.z,
    );
    scene.add(camera);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = ORBIT_CIUDAD.dampingFactor;
    controls.rotateSpeed = ORBIT_CIUDAD.rotateSpeed;
    controls.zoomSpeed = ORBIT_CIUDAD.zoomSpeed;
    controls.panSpeed = ORBIT_CIUDAD.panSpeed;
    controls.maxPolarAngle = ORBIT_CIUDAD.maxPolarAngle;
    controls.minDistance = ORBIT_CIUDAD.minDistance;
    controls.maxDistance = ORBIT_CIUDAD.maxDistance;

    const host = new SceneHost(
      T,
      config,
      renderer,
      scene,
      camera,
      controls,
      reducido,
      hondura,
    );

    const mapaData: MapaData =
      (opts.mapa as MapaData) ?? (mapaJson as MapaData);
    const ciudadCfg = { ...ciudadBarrioLore(), destacadoBarrioId: config.barrioId };

    host.ciudad = await CiudadScene.mount({
      scene,
      mapa: mapaData,
      three: T,
      config: ciudadCfg,
    });

    const rail = host.ciudad.focusCity();
    const aspecto = window.innerWidth / Math.max(1, window.innerHeight);
    const aereo = encuadreAereo(rail, aspecto);
    camera.position.copy(aereo.pos);
    controls.target.copy(aereo.mira);
    controls.update();

    const ancla = host.ciudad.barrioAnchor(config.barrioId);
    const origen = new T.Vector3(ancla.x, ancla.y - hondura, ancla.z);
    host.barrioPromise = BarrioScene.mount({
      scene,
      three: T,
      origin: origen,
      config: barrioBarrioLore(),
    });

    const redimensionar = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (host.flujo) host.flujo.setResolucion(w, h);
    };
    window.addEventListener('resize', redimensionar);

    host.startLoop();
    return host;
  }

  private startLoop(): void {
    this.renderer.setAnimationLoop((ms) => {
      if (this.disposed) return;
      const dt = this.ultimoMs
        ? Math.min((ms - this.ultimoMs) / 1000, 0.1)
        : 1 / 60;
      this.ultimoMs = ms;
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    });
  }

  update(dt: number): void {
    if (this.vuelo) {
      const sigue = pasoVuelo(
        this.vuelo,
        dt,
        this.camera,
        this.controls,
        this.miraScratch,
      );
      if (!sigue) this.vuelo = null;
    } else {
      this.controls.update();
    }
    if (this.ciudad) this.ciudad.update(dt);
    if (this.barrio) this.barrio.update(dt);
    if (this.flujo) this.flujo.update(dt);
  }

  async setAct(act: HostAct): Promise<void> {
    if (act === 'overlook') {
      this.act = 'overlook';
      if (!this.ciudad) return;
      const rail = this.ciudad.focusCity({
        camera: this.camera,
        controls: this.controls,
      });
      const aereo = encuadreAereo(
        rail,
        window.innerWidth / Math.max(1, window.innerHeight),
      );
      this.camera.position.copy(aereo.pos);
      this.controls.target.copy(aereo.mira);
      this.controls.update();
      return;
    }

    if (act === 'approach' || act === 'ceremony') {
      await this.descender();
      this.act = 'ceremony';
    }
  }

  private async descender(): Promise<void> {
    if (!this.ciudad || this.act === 'ceremony') return;
    this.act = 'approach';

    const barrio = await (this.barrioPromise ?? Promise.resolve(null));
    if (!barrio) return;
    this.barrio = barrio;

    this.ciudad.resaltarBarrio(this.config.barrioId, true);

    const ancla = this.ciudad.barrioAnchor(this.config.barrioId);
    const origen = new this.T.Vector3(
      ancla.x,
      ancla.y - this.hondura,
      ancla.z,
    );

    this.flujo = new FlujoFx({
      three: this.T,
      scene: this.scene,
      resolveAnchor: (id: string) => {
        if (id === 'onfalo' || id === 'ónfalo') return barrio.onfaloAnchor();
        return barrio.unitAnchor(id);
      },
      reducido: this.reducido,
      cremallera: {
        posicion: origen.clone().add(
          new this.T.Vector3(
            CREMALLERA_HOST.desplazamiento.x,
            CREMALLERA_HOST.desplazamiento.y,
            CREMALLERA_HOST.desplazamiento.z,
          ),
        ),
        rotacionY: 0,
      },
    });

    const aspecto = window.innerWidth / Math.max(1, window.innerHeight);
    const destino = poseCeremonia(origen, aspecto, this.T);
    const cima = this.ciudad.barrioCima(this.config.barrioId);
    const wp = waypointsDescenso(
      this.camera.position,
      this.controls.target,
      ancla,
      cima,
      destino,
      this.T,
    );

    const { activo, listo } = volar(
      {
        camera: this.camera,
        controls: this.controls,
        posiciones: wp.posiciones,
        miradas: wp.miradas,
        dur: duracionDescenso(this.reducido),
        reducido: this.reducido,
      },
      this.T,
    );

    this.vuelo = activo;
    await listo;

    this.controls.minDistance = orbitCeremonia.minDistance;
    this.controls.maxDistance = orbitCeremonia.maxDistance;
    this.controls.target.copy(destino.mira);
    this.controls.update();
    this.act = 'ceremony';
  }

  playCue(name: string, args: CueArgs = {}): void {
    if (!this.flujo || !this.barrio) return;
    const barrio = this.barrio;
    const flujo = this.flujo;
    const origen = barrio.group.position;

    switch (name) {
      case 'gota':
      case 'gota-onfalo':
        flujo.gota(
          origen.clone().add(new this.T.Vector3(0, 19, 0)),
          barrio.onfaloAnchor(),
        );
        break;
      case 'gota-analisis':
        const desk = args.desde as THREE.Vector3 | undefined;
        flujo.gota(
          desk ?? barrio.onfaloAnchor(),
          barrio.unitAnchor(String(args.unitId ?? 'bartleby')),
        );
        break;
      case 'llave':
        barrio.wake();
        flujo.llaveDesciende(
          barrio.unitAnchor(String(args.unitId ?? 'bartleby')),
        );
        break;
      case 'cristal':
      case 'cristalLinea':
        const lado = Number(args.lado ?? 0) % 2 ? 1 : -1;
        const p = origen.clone().add(new this.T.Vector3(3.2 * lado, 0.06, 4.8));
        flujo.cristalLinea(p);
        break;
      case 'acta':
        flujo.actaAsciende(barrio.onfaloAnchor());
        break;
      case 'cremallera':
        const step = Number(args.step ?? 1);
        const side = (args.side as 'H' | 'M') ?? 'H';
        flujo.cremallera(step, side);
        break;
      default:
        break;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    if (this.flujo) this.flujo.dispose();
    if (this.barrio) this.barrio.dispose();
    if (this.ciudad) this.ciudad.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }
  }
}
