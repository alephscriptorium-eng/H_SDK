import type {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  ShaderMaterial,
  Vector3,
} from 'three';
import type { ThemeOverride } from '../config/types.ts';
import {
  CREMALLERA_DEFAULT,
  FX_CRISTAL,
  FX_DURACIONES,
  REDUCIDO_DURACION_K,
} from '../layout/tokens.ts';
import { EASE } from '../shared/ease.ts';
import { prefersReducedMotion } from '../shared/motion.ts';
import {
  colorDe,
  PALETA_CSS,
  type ColorAlias,
  type ColorToken,
} from '../theme/tokens.ts';

export type ThreeModule = typeof import('three');

export type AnchorResolver = (id: string) => Vector3 | null;

export type ActaTextConfig = { titulo?: string; subtitulo?: string };

export type FlujoFxOptions = {
  three: ThreeModule;
  theme?: ThemeOverride;
  resolveAnchor?: AnchorResolver;
  scene?: Object3D;
  reducido?: boolean;
  acta?: ActaTextConfig;
  cremallera?: Partial<{
    posicion: Vector3 | { x: number; y?: number; z?: number };
    rotacionY: number;
    pasos: number;
    separacion: number;
    ancho: number;
    techo: number;
  }>;
  luces?: boolean;
  intensidadLuz?: number;
};

type ColorInput = ColorToken | ColorAlias | number;

type LineAddons = {
  Line2: new (
    geometry: BufferGeometry,
    material: Material,
  ) => Object3D & { computeLineDistances?: () => void };
  LineGeometry: new () => BufferGeometry & {
    setPositions: (positions: number[]) => void;
  };
  LineMaterial: new (params: Record<string, unknown>) => Material & {
    resolution: { set: (x: number, y: number) => void };
    dashOffset: number;
    dashScale: number;
    dashSize: number;
    gapSize: number;
    opacity: number;
  };
};

type AnimHandle = {
  t: number;
  dur: number;
  ease: (p: number) => number;
  onPaso?: (e: number, bruto: number) => void;
  onFin?: () => void;
  resolver: () => void;
};

type LiveHandle = { fn: (reloj: number, dt: number) => void };

type Cumulo = {
  pts: Object3D;
  geo: BufferGeometry;
  mat: ShaderMaterial;
  pos: Float32Array;
  tam: Float32Array;
  alfa: Float32Array;
  n: number;
};

type Estela = {
  obj: Object3D;
  revelar: (r: number) => void;
  opacidad: (o: number) => void;
};

type LuzSlot = {
  luz: PointLight;
  libre: boolean;
};

type CremalleraLado = {
  x: number;
  color: number;
  cable: Estela;
  eslabones: Map<number, Eslabon>;
};

type Eslabon = {
  obj: Mesh;
  mat: MeshStandardMaterial;
  y: number;
};

type CremalleraState = {
  grupo: Group;
  H: CremalleraLado;
  M: CremalleraLado;
  dientes: Map<number, Array<{ cuna: Mesh; mat: MeshStandardMaterial }>>;
};

/* ───────────────────── addons: Line2 opcional ───────────────────── */

let _addons: LineAddons | null = null;
let _addonsProm: Promise<LineAddons | null> | null = null;

function cargarAddons(): Promise<LineAddons | null> {
  if (_addonsProm) return _addonsProm;
  _addonsProm = Promise.all([
    import('three/addons/lines/Line2.js'),
    import('three/addons/lines/LineGeometry.js'),
    import('three/addons/lines/LineMaterial.js'),
  ])
    .then(([a, b, c]) => {
      _addons = {
        Line2: a.Line2 as unknown as LineAddons['Line2'],
        LineGeometry: b.LineGeometry as unknown as LineAddons['LineGeometry'],
        LineMaterial: c.LineMaterial as unknown as LineAddons['LineMaterial'],
      };
      return _addons;
    })
    .catch(() => {
      _addons = null;
      return null;
    });
  return _addonsProm;
}

/* ───────────────────────── shaders mínimos ───────────────────────── */

const VS_PUNTOS = `
	uniform float uEscala;
	attribute float aTam;
	attribute float aAlfa;
	varying float vAlfa;
	void main() {
		vAlfa = aAlfa;
		vec4 mv = modelViewMatrix * vec4( position, 1.0 );
		gl_PointSize = clamp( aTam * uEscala / max( 0.001, -mv.z ), 1.0, 96.0 );
		gl_Position = projectionMatrix * mv;
	}
`;

const FS_PUNTOS = `
	uniform vec3 uColor;
	uniform float uOpacidad;
	varying float vAlfa;
	void main() {
		float d = length( gl_PointCoord - vec2( 0.5 ) );
		float nucleo = smoothstep( 0.5, 0.0, d );
		float a = pow( nucleo, 2.0 ) * vAlfa * uOpacidad;
		if ( a < 0.004 ) discard;
		gl_FragColor = vec4( uColor * ( 0.55 + 0.9 * vAlfa ), a );
		#include <colorspace_fragment>
	}
`;

const VS_HALO = `
	uniform float uTam;
	varying vec2 vUv;
	void main() {
		vUv = uv;
		vec4 mv = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
		mv.xy += position.xy * uTam;
		gl_Position = projectionMatrix * mv;
	}
`;

const FS_HALO = `
	uniform vec3 uColor;
	uniform float uOpacidad;
	varying vec2 vUv;
	void main() {
		float d = length( vUv - vec2( 0.5 ) ) * 2.0;
		float halo = smoothstep( 1.0, 0.0, d );
		float a = pow( halo, 2.6 ) * uOpacidad;
		if ( a < 0.004 ) discard;
		gl_FragColor = vec4( uColor, a );
		#include <colorspace_fragment>
	}
`;

/* ─────────────────── textura del acta (pergamino) ─────────────────── */

function crearTexturaActa(
  THREE: ThreeModule,
  acta: ActaTextConfig = {},
): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  try {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 340;
    const g = c.getContext('2d');
    if (!g) return null;

    const titulo = acta.titulo ?? 'ACTA';
    const subtitulo = acta.subtitulo ?? 'cadena verificada';

    g.fillStyle = PALETA_CSS.tinta;
    g.fillRect(0, 0, 256, 340);

    const vel = g.createRadialGradient(128, 168, 58, 128, 168, 214);
    vel.addColorStop(0, 'rgba(19,16,8,0)');
    vel.addColorStop(1, 'rgba(19,16,8,0.30)');
    g.fillStyle = vel;
    g.fillRect(0, 0, 256, 340);

    g.fillStyle = 'rgba(19,16,8,0.72)';
    g.font = 'bold 19px Consolas, "Cascadia Mono", monospace';
    g.fillText(titulo, 40, 42);
    g.font = '11px Consolas, "Cascadia Mono", monospace';
    g.fillStyle = 'rgba(19,16,8,0.5)';
    g.fillText(subtitulo, 40, 58);

    g.strokeStyle = 'rgba(19,16,8,0.40)';
    g.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const y = 84 + i * 15.5;
      const w = 140 + Math.sin(i * 2.3) * 42;
      g.beginPath();
      g.moveTo(40, y);
      g.lineTo(40 + w, y);
      g.stroke();
    }

    g.beginPath();
    g.arc(188, 296, 23, 0, Math.PI * 2);
    g.fillStyle = PALETA_CSS.oro + 'e0';
    g.fill();
    g.strokeStyle = 'rgba(19,16,8,0.45)';
    g.stroke();

    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  } catch {
    return null;
  }
}

export class FlujoFx {
  readonly group: Group;
  readonly reducido: boolean;
  readonly duracionK: number;

  private readonly THREE: ThreeModule;
  private readonly theme: ThemeOverride | undefined;
  private readonly resolveAnchor: AnchorResolver | undefined;
  private readonly scene: Object3D | undefined;
  private readonly actaCfg: ActaTextConfig;
  private readonly intLuz: number;

  private readonly compartidos = new Set<{ dispose?: () => void }>();
  private readonly materialesLinea = new Set<
    Material & { resolution?: { set: (x: number, y: number) => void } }
  >();

  private readonly uEscala = { value: 460 };
  private readonly geoHalo: BufferGeometry;
  private readonly geoAnillo: BufferGeometry;
  private readonly texActa: CanvasTexture | null;

  private readonly anims = new Set<AnimHandle>();
  private readonly vivos = new Set<LiveHandle>();
  private reloj = 0;
  private raf = 0;
  private ultimo = 0;
  private externo = false;
  private activo = true;

  private readonly luces: LuzSlot[] = [];
  private cfgCrem: {
    posicion: Vector3;
    rotacionY: number;
    pasos: number;
    separacion: number;
    ancho: number;
    techo: number;
  };
  private crem: CremalleraState | null = null;

  private readonly alRedimensionar: () => void;

  constructor(options: FlujoFxOptions) {
    const { three: THREE } = options;
    if (!THREE) throw new Error('FlujoFx: falta three');

    this.THREE = THREE;
    this.theme = options.theme;
    this.resolveAnchor = options.resolveAnchor;
    this.scene = options.scene;
    this.actaCfg = options.acta ?? {};
    this.reducido = prefersReducedMotion(options.reducido);
    this.duracionK = this.reducido ? REDUCIDO_DURACION_K : 1;
    this.intLuz = options.intensidadLuz ?? 3.4;

    this.group = new THREE.Group();
    this.group.name = 'flujo';
    this.group.renderOrder = 2;
    if (this.scene && typeof this.scene.add === 'function') {
      this.scene.add(this.group);
    }

    const marcar = <T extends { dispose?: () => void; userData?: Record<string, unknown> }>(
      r: T,
    ): T => {
      if (r) {
        this.compartidos.add(r);
        r.userData = r.userData ?? {};
        r.userData.compartido = true;
      }
      return r;
    };

    this.geoHalo = marcar(new THREE.PlaneGeometry(1, 1));
    this.geoAnillo = marcar(new THREE.RingGeometry(0.62, 0.78, 56, 1));
    const texActa = crearTexturaActa(THREE, this.actaCfg);
    this.texActa = texActa ? marcar(texActa) : null;

    const res = new THREE.Vector2(1280, 720);
    if (typeof window !== 'undefined') {
      res.set(window.innerWidth || 1280, window.innerHeight || 720);
      this.uEscala.value = Math.max(240, (window.innerHeight || 720) * 0.62);
    }

    if (options.luces !== false) {
      for (let i = 0; i < 2; i++) {
        const l = new THREE.PointLight(this.col('tinta'), 0, 16, 2);
        this.group.add(l);
        this.luces.push({ luz: l, libre: true });
      }
    }

    const cremDef = CREMALLERA_DEFAULT;
    const cremOpt = options.cremallera ?? {};
    this.cfgCrem = {
      posicion: this.v3(cremOpt.posicion ?? cremDef.posicion, new THREE.Vector3(
        cremDef.posicion.x,
        cremDef.posicion.y,
        cremDef.posicion.z,
      )),
      rotacionY: cremOpt.rotacionY ?? cremDef.rotacionY,
      pasos: cremOpt.pasos ?? cremDef.pasos,
      separacion: cremOpt.separacion ?? cremDef.separacion,
      ancho: cremOpt.ancho ?? cremDef.ancho,
      techo: cremOpt.techo ?? cremDef.techo,
    };

    this.alRedimensionar = () => {
      if (typeof window !== 'undefined') {
        this.setResolucion(window.innerWidth, window.innerHeight);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.alRedimensionar);
    }

    cargarAddons();

    if (typeof requestAnimationFrame === 'function') {
      this.raf = requestAnimationFrame(this.bucle);
    }
  }

  gota(
    desde: Vector3 | { x: number; y?: number; z?: number } | string,
    hasta: Vector3 | { x: number; y?: number; z?: number } | string,
    cfg: {
      color?: ColorInput;
      duracion?: number;
      particulas?: number;
      grosor?: number;
      desvio?: number;
    } = {},
  ): Promise<void> {
    const THREE = this.THREE;
    const a = this.v3(desde, new THREE.Vector3(0, 0.8, 0));
    const b = this.v3(hasta, new THREE.Vector3(0, 0.8, 0));
    const color = cfg.color ?? 'verdigris';
    const dur = cfg.duracion ?? FX_DURACIONES.gota;
    const n = this.reducido ? 8 : (cfg.particulas ?? 30);

    const d = a.distanceTo(b);
    const medio = a.clone().add(b).multiplyScalar(0.5);
    const lateral = new THREE.Vector3(b.z - a.z, 0, a.x - b.x);
    if (lateral.lengthSq() < 1e-6) lateral.set(1, 0, 0);
    lateral.normalize().multiplyScalar(d * 0.16 * (cfg.desvio ?? 1));
    const control = medio
      .clone()
      .add(lateral)
      .add(new THREE.Vector3(0, d * 0.42 + 1.1, 0));
    const curva = new THREE.QuadraticBezierCurve3(a, control, b);
    const muestras = curva.getPoints(72);

    const estela = this.crearEstela(muestras, color, cfg.grosor ?? 0.04);
    this.group.add(estela.obj);

    const c = this.crearCumulo(n, color);
    this.group.add(c.pts);
    const desfase: number[] = [];
    for (let i = 0; i < n; i++) {
      desfase.push(i / n);
      c.tam[i] = 0.075 + (i === 0 ? 0.12 : Math.random() * 0.07);
    }
    c.geo.attributes.aTam!.needsUpdate = true;

    const cola = 0.22;
    return this.animar({
      dur,
      ease: EASE.suaveCubica,
      paso: (e, bruto) => {
        estela.revelar(Math.min(1, e * 1.06));
        estela.opacidad(
          0.55 * Math.sin(Math.PI * Math.min(1, bruto * 1.02)) +
            0.08 * (1 - bruto),
        );
        for (let i = 0; i < n; i++) {
          const u = e - desfase[i] * cola;
          const dentro = u > 0 && u <= 1;
          const p = curva.getPointAt(Math.min(1, Math.max(0, u)));
          const w = this.reloj * 2.2 + i * 1.9;
          c.pos[i * 3] = p.x + Math.sin(w) * 0.035;
          c.pos[i * 3 + 1] = p.y + Math.cos(w * 1.3) * 0.035;
          c.pos[i * 3 + 2] = p.z + Math.sin(w * 0.8) * 0.035;
          const borde = dentro
            ? Math.min(1, u * 12) * Math.min(1, (1 - u) * 6 + 0.25)
            : 0;
          c.alfa[i] = borde * (i === 0 ? 1 : 0.35 + 0.55 * (1 - desfase[i]));
        }
        c.geo.attributes.position!.needsUpdate = true;
        c.geo.attributes.aAlfa!.needsUpdate = true;
      },
      fin: () => {
        this.purgar(c.pts);
        this.animar({
          dur: 0.55,
          ease: EASE.entradaCuad,
          paso: (e) => estela.opacidad(0.5 * (1 - e)),
          fin: () => this.purgar(estela.obj),
        });
        if (!this.reducido) this.chispas(b, color, 10, 0.42, 0.6);
      },
    });
  }

  cristalLinea(
    pos: Vector3 | { x: number; y?: number; z?: number } | string,
    cfg: {
      alto?: number;
      radio?: number;
      color?: ColorInput;
      giro?: number;
    } = {},
  ): Mesh {
    const THREE = this.THREE;
    const p = this.v3(pos, new THREE.Vector3());
    const alto = cfg.alto ?? FX_CRISTAL.alto;
    const radio = cfg.radio ?? FX_CRISTAL.radio;
    const tinte = cfg.color ?? 'verdigris';

    const mat = new THREE.MeshStandardMaterial({
      color: this.col('tinta'),
      emissive: this.col(tinte),
      emissiveIntensity: 0.0,
      metalness: 0.15,
      roughness: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const gCuerpo = new THREE.CylinderGeometry(
      radio,
      radio * 0.94,
      alto * 0.66,
      6,
      1,
      true,
    );
    gCuerpo.translate(0, alto * 0.33, 0);
    const cristal = new THREE.Mesh(gCuerpo, mat);
    cristal.name = 'cristal-linea';
    cristal.renderOrder = 3;

    const gPunta = new THREE.ConeGeometry(radio, alto * 0.4, 6, 1);
    gPunta.translate(0, alto * 0.86, 0);
    cristal.add(new THREE.Mesh(gPunta, mat));

    const gBase = new THREE.ConeGeometry(radio * 0.94, alto * 0.2, 6, 1);
    gBase.rotateX(Math.PI);
    gBase.translate(0, alto * 0.1, 0);
    cristal.add(new THREE.Mesh(gBase, mat));

    const aristas = new THREE.LineSegments(
      new THREE.EdgesGeometry(gCuerpo, 8),
      new THREE.LineBasicMaterial({
        color: this.col(tinte),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    cristal.add(aristas);

    const halo = this.crearHalo(tinte, alto * 1.5);
    halo.position.y = alto * 0.5;
    cristal.add(halo);

    cristal.position.copy(p);
    cristal.rotation.y = cfg.giro ?? Math.random() * Math.PI;
    cristal.scale.set(0.02, 0.001, 0.02);
    this.group.add(cristal);

    const foco = this.pedirLuz(tinte);
    if (foco) {
      foco.luz.position.copy(p).add(new THREE.Vector3(0, alto * 0.6, 0));
    }

    this.destelloAnillo(p, tinte, 1.1, 2.1);

    const aristasMat = aristas.material as LineBasicMaterial;

    const nacer = Promise.all([
      this.animar({
        dur: FX_DURACIONES.cristalCrecer,
        ease: EASE.salidaElastica,
        paso: (e) => {
          cristal.scale.y = Math.max(0.001, e);
        },
      }),
      this.animar({
        dur: 0.95,
        ease: EASE.salidaAtras,
        paso: (e) => {
          cristal.scale.x = cristal.scale.z = Math.max(0.02, e);
        },
      }),
      this.animar({
        dur: 0.8,
        ease: EASE.salidaCubica,
        paso: (e) => {
          mat.opacity = 0.72 * e;
          mat.emissiveIntensity = 0.42 * e;
          aristasMat.opacity = 0.5 * e;
          (halo.material as ShaderMaterial).uniforms.uOpacidad.value = 0.3 * e;
          if (foco) foco.luz.intensity = this.intLuz * e;
        },
      }),
    ]);

    const base = p.y;
    const quitarLatido = this.latir((t) => {
      cristal.rotation.y += 0.0042;
      const s = Math.sin(t * 1.35 + p.x);
      mat.emissiveIntensity = 0.42 + s * 0.13;
      (halo.material as ShaderMaterial).uniforms.uOpacidad.value =
        0.3 + s * 0.09;
      cristal.position.y = base + Math.sin(t * 0.9 + p.z) * 0.028;
      if (foco) foco.luz.intensity = this.intLuz * (1 + s * 0.22);
    });

    cristal.userData.flujo = {
      nacer,
      disolver: (dur = 0.7): Promise<void> => {
        quitarLatido();
        return this.animar({
          dur,
          ease: EASE.entradaCuad,
          paso: (e) => {
            mat.opacity = 0.72 * (1 - e);
            mat.emissiveIntensity = 0.42 * (1 - e);
            aristasMat.opacity = 0.5 * (1 - e);
            (halo.material as ShaderMaterial).uniforms.uOpacidad.value =
              0.3 * (1 - e);
            cristal.scale.y = Math.max(0.001, 1 - e * 0.35);
            if (foco) foco.luz.intensity = this.intLuz * (1 - e);
          },
          fin: () => {
            if (foco) foco.soltar();
            this.purgar(cristal);
          },
        });
      },
    };

    return cristal;
  }

  llaveDesciende(
    hasta: Vector3 | { x: number; y?: number; z?: number } | string,
    cfg: { altura?: number; reposo?: number; duracion?: number } = {},
  ): Promise<void> {
    const THREE = this.THREE;
    const destino = this.v3(hasta, new THREE.Vector3(0, 1, 0));
    const altura = cfg.altura ?? 18;
    const reposo = destino
      .clone()
      .add(new THREE.Vector3(0, cfg.reposo ?? 1.05, 0));
    const { llave, oro } = this.construirLlave();

    const halo = this.crearHalo('oro', 1.5);
    llave.add(halo);
    llave.position.copy(reposo).setY(reposo.y + altura);
    llave.rotation.y = Math.PI * 6;
    this.group.add(llave);

    const matHaz = new THREE.MeshBasicMaterial({
      color: this.col('oro'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const haz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.85, altura, 14, 1, true),
      matHaz,
    );
    haz.position.copy(destino).add(new THREE.Vector3(0, altura / 2, 0));
    haz.renderOrder = 4;
    this.group.add(haz);

    const foco = this.pedirLuz('oro');
    const yIni = reposo.y + altura;

    const caida = this.animar({
      dur: cfg.duracion ?? FX_DURACIONES.llave,
      ease: EASE.salidaQuinta,
      paso: (e, bruto) => {
        llave.position.y = yIni + (reposo.y - yIni) * e;
        llave.rotation.y = Math.PI * 6 * (1 - e);
        llave.rotation.z = Math.sin(bruto * Math.PI) * 0.14;
        oro.emissiveIntensity = 0.22 + e * 0.42;
        (halo.material as ShaderMaterial).uniforms.uOpacidad.value =
          0.16 + 0.3 * e;
        matHaz.opacity = 0.17 * Math.sin(Math.PI * Math.min(1, bruto * 1.15));
        if (foco) {
          foco.luz.position.copy(llave.position);
          foco.luz.intensity = this.intLuz * (0.3 + 0.95 * e);
        }
      },
    });

    return caida
      .then(() => {
        this.destelloAnillo(destino, 'oro', 1.0, 3.6);
        if (!this.reducido) this.chispas(reposo, 'oro', 26, 1.05, 1.0);
        const quitar = this.latir((t) => {
          llave.position.y = reposo.y + Math.sin(t * 2.1) * 0.05;
          llave.rotation.y += 0.012;
        });
        return this.animar({ dur: 0.55 }).then(() => quitar());
      })
      .then(() =>
        this.animar({
          dur: 0.6,
          ease: EASE.entradaCuad,
          paso: (e) => {
            const s = Math.max(0.001, 1 - e);
            llave.scale.set(s, s, s);
            llave.position.y = reposo.y - (reposo.y - destino.y) * e;
            oro.emissiveIntensity = 0.64 + e * 0.9;
            (halo.material as ShaderMaterial).uniforms.uOpacidad.value =
              0.46 * (1 - e * e);
            matHaz.opacity = 0.17 * (1 - e);
            if (foco) foco.luz.intensity = this.intLuz * 1.25 * (1 - e);
          },
          fin: () => {
            if (foco) foco.soltar();
            this.purgar(llave);
            this.purgar(haz);
          },
        }),
      );
  }

  actaAsciende(
    desde: Vector3 | { x: number; y?: number; z?: number } | string,
    cfg: { subida?: number; duracion?: number } = {},
  ): Promise<void> {
    const THREE = this.THREE;
    const origen = this.v3(desde, new THREE.Vector3(0, 1.2, 0));
    const subida = cfg.subida ?? 16;
    const dur = cfg.duracion ?? FX_DURACIONES.acta;

    const geo = new THREE.PlaneGeometry(1.0, 1.34, 14, 18);
    const base = Float32Array.from(geo.attributes.position!.array as Float32Array);
    const mat = new THREE.MeshStandardMaterial({
      color: this.col('tinta'),
      map: this.texActa ?? null,
      emissive: this.col('tinta'),
      emissiveIntensity: 0.08,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const acta = new THREE.Mesh(geo, mat);
    acta.name = 'acta';
    acta.renderOrder = 3;
    acta.position.copy(origen).add(new THREE.Vector3(0, 0.35, 0));
    this.group.add(acta);

    const halo = this.crearHalo('oro', 2.0);
    halo.position.z = -0.02;
    acta.add(halo);

    const n = this.reducido ? 6 : 18;
    const c = this.crearCumulo(n, 'oro');
    this.group.add(c.pts);
    for (let i = 0; i < n; i++) c.tam[i] = 0.05 + Math.random() * 0.08;
    c.geo.attributes.aTam!.needsUpdate = true;

    const rizo = (t: number) => {
      const at = geo.attributes.position as BufferAttribute;
      for (let i = 0; i < at.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        at.array[i * 3 + 2] =
          Math.sin(x * 2.7 + t * 1.5) * 0.055 +
          Math.sin(y * 1.9 - t * 1.05) * 0.038;
      }
      at.needsUpdate = true;
      geo.computeVertexNormals();
    };
    rizo(0);

    const y0 = acta.position.y;
    return this.animar({
      dur,
      ease: EASE.ascenso,
      paso: (e, bruto) => {
        const t = this.reloj;
        acta.position.y = y0 + subida * e;
        acta.position.x =
          origen.x + Math.sin(t * 1.05) * 0.26 * Math.min(1, bruto * 3);
        acta.position.z =
          origen.z + Math.cos(t * 0.78) * 0.2 * Math.min(1, bruto * 3);
        acta.rotation.y = t * 0.55;
        acta.rotation.z = Math.sin(t * 0.9) * 0.17;
        const s = 1 - 0.3 * e;
        acta.scale.set(s, s, s);
        const entrada = Math.min(1, bruto / 0.12);
        const salida = bruto > 0.62 ? 1 - (bruto - 0.62) / 0.38 : 1;
        mat.opacity = entrada * salida;
        mat.emissiveIntensity = 0.08 + 0.16 * (1 - salida);
        (halo.material as ShaderMaterial).uniforms.uOpacidad.value =
          0.14 * entrada * salida;
        if (!this.reducido) rizo(t);
        for (let i = 0; i < n; i++) {
          const u = Math.max(0, e - (i + 1) * 0.018);
          c.pos[i * 3] = acta.position.x + Math.sin(t * 1.6 + i) * 0.3;
          c.pos[i * 3 + 1] = y0 + subida * u - 0.15;
          c.pos[i * 3 + 2] =
            acta.position.z + Math.cos(t * 1.3 + i * 1.4) * 0.3;
          c.alfa[i] = entrada * salida * (0.25 + 0.45 * (1 - i / n));
        }
        c.geo.attributes.position!.needsUpdate = true;
        c.geo.attributes.aAlfa!.needsUpdate = true;
      },
      fin: () => {
        this.purgar(acta);
        this.purgar(c.pts);
      },
    });
  }

  cremallera(
    step: number,
    side: 'H' | 'M' | 'izq' | 'der' | 'derecha' | 'right' | 'verdigris' | '1' | number | string,
  ): Promise<void> {
    if (!this.crem) this.crem = this.crearMuro();
    const clave = this.ladoNorm(side);
    const lado = this.crem[clave];
    const n = Math.max(1, Math.min(this.cfgCrem.pasos, Math.round(step) || 1));

    const tareas: Promise<void>[] = [];
    let esl = lado.eslabones.get(n);
    if (!esl) {
      esl = this.crearEslabon(lado, n);
      lado.eslabones.set(n, esl);
      const giroFin = esl.obj.rotation.z;
      tareas.push(
        this.animar({
          dur: 0.62,
          ease: EASE.salidaAtras,
          paso: (e) => {
            esl!.obj.scale.setScalar(Math.max(0.01, e));
            esl!.obj.rotation.z = giroFin * (0.35 + 0.65 * e) + (1 - e) * 1.4;
            esl!.mat.opacity = Math.min(1, e * 1.3);
            esl!.mat.emissiveIntensity = 0.2 + 0.55 * (1 - e);
          },
        }),
      );
      const rTotal = n / this.cfgCrem.pasos;
      const rPrev = (n - 1) / this.cfgCrem.pasos;
      tareas.push(
        this.animar({
          dur: 0.5,
          ease: EASE.salidaCubica,
          paso: (e) =>
            lado.cable.revelar(Math.max(0.001, rPrev + (rTotal - rPrev) * e)),
        }),
      );
    } else {
      tareas.push(
        this.animar({
          dur: 0.5,
          ease: EASE.salidaCubica,
          paso: (e) => {
            esl!.mat.emissiveIntensity = 0.2 + 0.6 * Math.sin(Math.PI * e);
          },
        }),
      );
    }

    const otro = clave === 'H' ? this.crem.M : this.crem.H;
    if (otro.eslabones.has(n) && !this.crem.dientes.has(n)) {
      tareas.push(this.engarzar(n));
    }

    return Promise.all(tareas).then(() => undefined);
  }

  update(dt?: number): void {
    if (!this.externo) {
      this.externo = true;
      if (this.raf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.raf);
      }
      this.raf = 0;
    }
    let d = typeof dt === 'number' && isFinite(dt) && dt > 0 ? dt : 1 / 60;
    if (d > 1) d /= 1000;
    this.tic(Math.min(0.05, d));
  }

  dispose(): void {
    this.activo = false;
    if (this.raf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.raf);
    }
    this.raf = 0;
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.alRedimensionar);
    }
    for (const a of Array.from(this.anims)) {
      try {
        if (a.onPaso) a.onPaso(1, 1);
        if (a.onFin) a.onFin();
      } catch {
        /* ignorado */
      }
      a.resolver();
    }
    this.anims.clear();
    this.vivos.clear();
    this.crem = null;
    this.purgar(this.group);
    for (const r of this.compartidos) {
      if (r && typeof r.dispose === 'function') r.dispose();
    }
    this.compartidos.clear();
    this.materialesLinea.clear();
    if (this.scene && typeof this.scene.remove === 'function') {
      this.scene.remove(this.group);
    }
  }

  /* ── animador interno ── */

  private readonly bucle = (t: number): void => {
    this.raf = requestAnimationFrame(this.bucle);
    const dt = this.ultimo
      ? Math.min(0.05, (t - this.ultimo) / 1000)
      : 1 / 60;
    this.ultimo = t;
    this.tic(dt);
  };

  private tic(dt: number): void {
    if (!this.activo) return;
    this.reloj += dt;
    for (const a of Array.from(this.anims)) {
      a.t += dt;
      if (a.t < 0) continue;
      const bruto = Math.min(1, a.t / a.dur);
      try {
        if (a.onPaso) a.onPaso(a.ease(bruto), bruto);
      } catch {
        /* un efecto roto no debe romper la ceremonia */
      }
      if (bruto >= 1) {
        this.anims.delete(a);
        try {
          if (a.onFin) a.onFin();
        } catch {
          /* idem */
        }
        a.resolver();
      }
    }
    if (!this.reducido) {
      for (const h of Array.from(this.vivos)) {
        try {
          h.fn(this.reloj, dt);
        } catch {
          /* idem */
        }
      }
    }
  }

  private animar(opts: {
    dur?: number;
    retardo?: number;
    ease?: (p: number) => number;
    paso?: (e: number, bruto: number) => void;
    fin?: () => void;
  }): Promise<void> {
    if (!this.activo) {
      try {
        if (opts.paso) opts.paso(1, 1);
        if (opts.fin) opts.fin();
      } catch {
        /* ignorado */
      }
      return Promise.resolve();
    }
    return new Promise((resolver) => {
      const a: AnimHandle = {
        t: -Math.max(0, opts.retardo ?? 0) * this.duracionK,
        dur: Math.max(0.0001, (opts.dur ?? 1) * this.duracionK),
        ease: opts.ease ?? EASE.suaveCubica,
        onPaso: opts.paso,
        onFin: opts.fin,
        resolver,
      };
      this.anims.add(a);
    });
  }

  private latir(fn: (reloj: number, dt: number) => void): () => void {
    const h: LiveHandle = { fn };
    this.vivos.add(h);
    return () => this.vivos.delete(h);
  }

  setResolucion(ancho: number, alto: number): void {
    const THREE = this.THREE;
    const res = new THREE.Vector2(Math.max(1, ancho | 0), Math.max(1, alto | 0));
    this.uEscala.value = Math.max(240, res.y * 0.62);
    for (const m of this.materialesLinea) {
      if (m.resolution) m.resolution.set(res.x, res.y);
    }
  }

  /* ── utilidades ── */

  private v3(
    v:
      | Vector3
      | { x: number; y?: number; z?: number }
      | string
      | null
      | undefined,
    porDefecto?: Vector3,
  ): Vector3 {
    const THREE = this.THREE;
    if (v && typeof v === 'object' && typeof v.x === 'number') {
      return new THREE.Vector3(v.x, v.y ?? 0, v.z ?? 0);
    }
    if (Array.isArray(v)) {
      return new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0);
    }
    if (typeof v === 'string' && this.resolveAnchor) {
      const a = this.resolveAnchor(v);
      if (a) return a.clone();
    }
    return porDefecto ? porDefecto.clone() : new THREE.Vector3();
  }

  private col(c: ColorInput | Color): Color {
    const THREE = this.THREE;
    if (c instanceof THREE.Color) return c.clone();
    if (typeof c === 'number') return new THREE.Color(c);
    return new THREE.Color(colorDe(c, this.theme));
  }

  private purgar(raiz: Object3D | null | undefined): void {
    if (!raiz) return;
    raiz.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.geometry && !mesh.geometry.userData?.compartido) {
        mesh.geometry.dispose();
      }
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const m of mats) {
        if ((m as Material & { userData?: { compartido?: boolean } }).userData
          ?.compartido) {
          continue;
        }
        const mat = m as Material & {
          map?: { dispose?: () => void; userData?: { compartido?: boolean } };
        };
        if (mat.map && !mat.map.userData?.compartido) mat.map.dispose?.();
        this.materialesLinea.delete(m);
        m.dispose();
      }
    });
    if (raiz.parent) raiz.parent.remove(raiz);
  }

  private pedirLuz(color: ColorInput): {
    luz: PointLight;
    soltar: () => void;
  } | null {
    const s = this.luces.find((x) => x.libre);
    if (!s) return null;
    s.libre = false;
    s.luz.color.set(this.col(color));
    s.luz.intensity = 0;
    return {
      luz: s.luz,
      soltar: () => {
        s.luz.intensity = 0;
        s.libre = true;
      },
    };
  }

  /* ── luces / partículas / halos ── */

  private crearCumulo(n: number, color: ColorInput): Cumulo {
    const THREE = this.THREE;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const tam = new Float32Array(n);
    const alfa = new Float32Array(n);
    const aPos = new THREE.BufferAttribute(pos, 3);
    const aAlfa = new THREE.BufferAttribute(alfa, 1);
    if (THREE.DynamicDrawUsage) {
      aPos.setUsage(THREE.DynamicDrawUsage);
      aAlfa.setUsage(THREE.DynamicDrawUsage);
    }
    geo.setAttribute('position', aPos);
    geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    geo.setAttribute('aAlfa', aAlfa);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.col(color) },
        uOpacidad: { value: 1 },
        uEscala: this.uEscala,
      },
      vertexShader: VS_PUNTOS,
      fragmentShader: FS_PUNTOS,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 6;
    return { pts, geo, mat, pos, tam, alfa, n };
  }

  private chispas(
    centro: Vector3,
    color: ColorInput,
    n = 22,
    radio = 0.9,
    dur: number = FX_DURACIONES.chispas,
  ): Promise<void> {
    const THREE = this.THREE;
    const c = this.crearCumulo(n, color);
    const dir: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2;
      const f = Math.acos(2 * Math.random() - 1);
      dir.push(
        new THREE.Vector3(
          Math.sin(f) * Math.cos(t),
          Math.abs(Math.cos(f)) * 0.85 + 0.25,
          Math.sin(f) * Math.sin(t),
        ).multiplyScalar(radio * (0.45 + Math.random() * 0.9)),
      );
      c.tam[i] = 0.1 + Math.random() * 0.14;
    }
    c.geo.attributes.aTam!.needsUpdate = true;
    c.pts.position.copy(centro);
    this.group.add(c.pts);
    return this.animar({
      dur,
      ease: EASE.salidaCubica,
      paso: (e) => {
        for (let i = 0; i < n; i++) {
          c.pos[i * 3] = dir[i].x * e;
          c.pos[i * 3 + 1] = dir[i].y * e - 0.55 * e * e * radio;
          c.pos[i * 3 + 2] = dir[i].z * e;
          c.alfa[i] = Math.max(0, 1 - e) * (0.55 + 0.45 * Math.sin(i * 1.7));
        }
        c.geo.attributes.position!.needsUpdate = true;
        c.geo.attributes.aAlfa!.needsUpdate = true;
      },
      fin: () => this.purgar(c.pts),
    });
  }

  private crearHalo(color: ColorInput, tam = 1): Mesh {
    const THREE = this.THREE;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.col(color) },
        uOpacidad: { value: 0 },
        uTam: { value: tam },
      },
      vertexShader: VS_HALO,
      fragmentShader: FS_HALO,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(this.geoHalo, mat);
    m.frustumCulled = false;
    m.renderOrder = 5;
    return m;
  }

  private destelloAnillo(
    centro: Vector3,
    color: ColorInput,
    dur: number = FX_DURACIONES.destelloAnillo,
    escalaMax = 3.4,
  ): Promise<void> {
    const THREE = this.THREE;
    const mat = new THREE.MeshBasicMaterial({
      color: this.col(color),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(this.geoAnillo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(centro);
    m.renderOrder = 5;
    this.group.add(m);
    return this.animar({
      dur,
      ease: EASE.salidaQuinta,
      paso: (e) => {
        const s = 0.18 + e * escalaMax;
        m.scale.set(s, s, s);
        mat.opacity = 0.85 * (1 - e) * (1 - e);
      },
      fin: () => this.purgar(m),
    });
  }

  private crearEstela(
    puntos: Vector3[],
    color: ColorInput,
    grosor = 0.045,
  ): Estela {
    const THREE = this.THREE;
    let largo = 0;
    for (let i = 1; i < puntos.length; i++) {
      largo += puntos[i].distanceTo(puntos[i - 1]);
    }

    if (_addons) {
      const { Line2, LineGeometry, LineMaterial } = _addons;
      const plano: number[] = [];
      for (const p of puntos) plano.push(p.x, p.y, p.z);
      const geo = new LineGeometry();
      geo.setPositions(plano);
      const mat = new LineMaterial({
        color: this.col(color),
        linewidth: grosor,
        worldUnits: true,
        dashed: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const res =
        typeof window !== 'undefined'
          ? new THREE.Vector2(
              window.innerWidth || 1280,
              window.innerHeight || 720,
            )
          : new THREE.Vector2(1280, 720);
      mat.resolution.set(res.x, res.y);
      mat.dashOffset = 0;
      mat.dashScale = 1;
      mat.dashSize = 0.0001;
      mat.gapSize = largo * 8 + 100;
      this.materialesLinea.add(mat);
      const linea = new Line2(geo, mat);
      linea.computeLineDistances?.();
      linea.frustumCulled = false;
      linea.renderOrder = 4;
      return {
        obj: linea,
        revelar: (r) => {
          mat.dashSize = Math.max(0.0001, r * largo);
        },
        opacidad: (o) => {
          mat.opacity = o;
        },
      };
    }

    const geo = new THREE.BufferGeometry().setFromPoints(puntos);
    const mat = new THREE.LineBasicMaterial({
      color: this.col(color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const linea = new THREE.Line(geo, mat);
    linea.frustumCulled = false;
    linea.renderOrder = 4;
    geo.setDrawRange(0, 2);
    return {
      obj: linea,
      revelar: (r) =>
        geo.setDrawRange(0, Math.max(2, Math.round(r * puntos.length))),
      opacidad: (o) => {
        mat.opacity = o;
      },
    };
  }

  /* ── llave ── */

  private construirLlave(): {
    llave: Group;
    oro: MeshStandardMaterial;
  } {
    const THREE = this.THREE;
    const oro = new THREE.MeshStandardMaterial({
      color: this.col('oro'),
      emissive: this.col('oro'),
      emissiveIntensity: 0.22,
      metalness: 0.88,
      roughness: 0.26,
    });
    const llave = new THREE.Group();
    llave.name = 'llave-lease';

    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.048, 10, 26),
      oro,
    );
    anillo.position.y = 0.4;
    llave.add(anillo);

    const cana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.62, 10),
      oro,
    );
    cana.position.y = -0.06;
    llave.add(cana);

    for (let i = 0; i < 2; i++) {
      const diente = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.055, 0.05),
        oro,
      );
      diente.position.set(0.07, -0.24 + i * 0.13, 0);
      llave.add(diente);
    }
    const tope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.045, 10),
      oro,
    );
    tope.position.y = 0.235;
    llave.add(tope);

    return { llave, oro };
  }

  /* ── cremallera ── */

  private ladoNorm(
    side: 'H' | 'M' | 'izq' | 'der' | 'derecha' | 'right' | 'verdigris' | '1' | number | string,
  ): 'H' | 'M' {
    const s = String(side ?? 'H').toLowerCase();
    if (
      s === 'm' ||
      s === 'der' ||
      s === 'derecha' ||
      s === 'right' ||
      s === 'verdigris' ||
      s === '1'
    ) {
      return 'M';
    }
    if (typeof side === 'number') return side > 0 ? 'M' : 'H';
    return 'H';
  }

  private alturaPaso(step: number): number {
    const n = Math.max(1, Math.min(this.cfgCrem.pasos, Math.round(step) || 1));
    return this.cfgCrem.techo - (n - 1) * this.cfgCrem.separacion;
  }

  private crearMuro(): CremalleraState {
    const THREE = this.THREE;
    const g = new THREE.Group();
    g.name = 'cremallera';
    g.position.copy(this.v3(this.cfgCrem.posicion));
    g.rotation.y = this.cfgCrem.rotacionY || 0;

    const alto = this.cfgCrem.separacion * (this.cfgCrem.pasos + 1.6);
    const ancho = this.cfgCrem.ancho + 1.9;

    const placa = new THREE.Mesh(
      new THREE.PlaneGeometry(ancho, alto),
      new THREE.MeshStandardMaterial({
        color: this.col('sepia'),
        roughness: 0.96,
        metalness: 0.04,
        transparent: true,
        opacity: 0.82,
      }),
    );
    placa.position.set(
      0,
      this.cfgCrem.techo - (alto / 2 - this.cfgCrem.separacion * 1.2),
      -0.08,
    );
    g.add(placa);

    const marco = new THREE.LineSegments(
      new THREE.EdgesGeometry(placa.geometry),
      new THREE.LineBasicMaterial({
        color: this.col('tinta'),
        transparent: true,
        opacity: 0.16,
      }),
    );
    marco.position.copy(placa.position);
    marco.position.z += 0.005;
    g.add(marco);

    const yFin = this.alturaPaso(this.cfgCrem.pasos) - this.cfgCrem.separacion * 0.6;
    const cable = (x: number, color: ColorInput): Estela => {
      const pts: Vector3[] = [];
      const nSeg = 48;
      for (let i = 0; i <= nSeg; i++) {
        const u = i / nSeg;
        const y =
          this.cfgCrem.techo +
          this.cfgCrem.separacion * 0.8 +
          (yFin - this.cfgCrem.techo) * u;
        pts.push(
          new THREE.Vector3(x + Math.sin(u * 12) * 0.014, y, 0.02),
        );
      }
      const e = this.crearEstela(pts, color, 0.028);
      e.opacidad(0.34);
      e.revelar(0.001);
      g.add(e.obj);
      return e;
    };

    this.group.add(g);
    return {
      grupo: g,
      H: {
        x: -this.cfgCrem.ancho / 2,
        color: colorDe('oro', this.theme),
        cable: cable(-this.cfgCrem.ancho / 2, 'oro'),
        eslabones: new Map(),
      },
      M: {
        x: this.cfgCrem.ancho / 2,
        color: colorDe('verdigris', this.theme),
        cable: cable(this.cfgCrem.ancho / 2, 'verdigris'),
        eslabones: new Map(),
      },
      dientes: new Map(),
    };
  }

  private crearEslabon(lado: CremalleraLado, step: number): Eslabon {
    const THREE = this.THREE;
    const y = this.alturaPaso(step);
    const mat = new THREE.MeshStandardMaterial({
      color: this.col(lado.color),
      emissive: this.col(lado.color),
      emissiveIntensity: 0.2,
      metalness: 0.75,
      roughness: 0.34,
      transparent: true,
      opacity: 0,
    });
    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.031, 8, 20),
      mat,
    );
    anillo.position.set(lado.x, y, 0.05);
    anillo.rotation.z = (step % 2 ? 1 : -1) * 0.9;
    anillo.scale.setScalar(0.01);
    this.crem!.grupo.add(anillo);
    return { obj: anillo, mat, y };
  }

  private engarzar(n: number): Promise<void> {
    const THREE = this.THREE;
    const y = this.alturaPaso(n);
    const medio = this.cfgCrem.ancho / 2;
    const piezas: Array<{ cuna: Mesh; mat: MeshStandardMaterial }> = [];
    for (const clave of ['H', 'M'] as const) {
      const lado = this.crem![clave];
      const mat = new THREE.MeshStandardMaterial({
        color: this.col(lado.color),
        emissive: this.col(lado.color),
        emissiveIntensity: 0.28,
        metalness: 0.7,
        roughness: 0.3,
        transparent: true,
        opacity: 0,
      });
      const cuna = new THREE.Mesh(
        new THREE.BoxGeometry(medio * 0.98, 0.075, 0.075),
        mat,
      );
      const signo = clave === 'H' ? -1 : 1;
      cuna.position.set(signo * medio, y, 0.05);
      cuna.userData.destino = signo * medio * 0.47;
      cuna.userData.origen = signo * medio;
      this.crem!.grupo.add(cuna);
      piezas.push({ cuna, mat });
    }
    this.crem!.dientes.set(n, piezas);

    const brillo = this.crearHalo('tinta', 0.85);
    brillo.position.set(0, y, 0.12);
    this.crem!.grupo.add(brillo);

    return this.animar({
      dur: 0.72,
      ease: EASE.salidaCubica,
      paso: (e) => {
        for (const { cuna, mat } of piezas) {
          cuna.position.x =
            (cuna.userData.origen as number) +
            ((cuna.userData.destino as number) - (cuna.userData.origen as number)) *
              e;
          mat.opacity = Math.min(1, e * 1.6);
          mat.emissiveIntensity = 0.28 + 0.5 * Math.pow(e, 6);
        }
        (brillo.material as ShaderMaterial).uniforms.uOpacidad.value =
          Math.pow(e, 5) * 0.7;
      },
      fin: () => {
        this.animar({
          dur: 0.5,
          ease: EASE.entradaCuad,
          paso: (e) => {
            (brillo.material as ShaderMaterial).uniforms.uOpacidad.value =
              0.7 * (1 - e);
            for (const { mat } of piezas) {
              mat.emissiveIntensity = 0.28 + 0.5 * (1 - e);
            }
          },
          fin: () => this.purgar(brillo),
        });
      },
    });
  }
}
