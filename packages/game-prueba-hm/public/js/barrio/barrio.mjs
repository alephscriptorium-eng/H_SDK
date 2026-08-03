/**
 * barrio.mjs — módulo W-BARRIO-REAL · demo «Prueba-H-M» (El Descenso) · R2
 * ---------------------------------------------------------------------------
 * Dibuja el barrio del descenso: una herradura de 10 locales con letrero
 * alrededor de la fuente Ónfalo, y un monigote por unidad cuyo cuerpo lee el
 * tipestate de la unidad.
 *
 * R2 — «que la demo enseñe Scriptorium». Los cuerpos ya NO son geometría
 * inventada aquí: son el mecanismo REAL de los kits, importado por import map
 * (el server monta /kit/ → @zeus/ui-3d-kit/src y /view-kit/ → @zeus/view-kit/src):
 *
 *   · `loadPuppet`  (@zeus/ui-3d-kit/puppet/puppet.mjs)  — marioneta skinned
 *     con el contrato de animación Alephillo: setBase('idle'|'walk'|'sit'|…) con
 *     crossfade de 0.2 s y playAdditive(gesto) con su fallback documentado
 *     (los emotes de RobotExpressive NO son additive-safe → crossfade temporal).
 *   · `DEFAULT_CLIP_MAPS` (@zeus/ui-3d-kit/puppet/clip-map.mjs) — mapa de clips
 *     real para RobotExpressive.glb; aquí solo se COMPLETA con dos entradas
 *     (ver MAPA_CLIPS) usando la opción real `loadPuppet(url, { clipMap })`.
 *   · `createStickPuppet` (@zeus/view-kit/stick-puppet.mjs) — el fallback que
 *     manda el brief: monigote procedural con el MISMO duck-type que loadPuppet.
 *   · `createAnimationController` (@zeus/ui-3d-kit/core/animation-controller.mjs)
 *     — motor de tweens del kit; sustituye al tween casero de R1.
 *   · `BARRIO_ESTADOS` (@zeus/ciudad/contract.mjs) — vocabulario REAL de salud
 *     del barrio ('vivo'|'latente'|'muerto'|'roto'); setUnitState lo acepta
 *     además del tipestate de R1, porque en R2 lo emite el dominio real.
 *
 * Contrato público (NO cambia respecto a R1):
 *   export async function createBarrio({ scene, THREE, origin })
 *   → { group, setUnitState(unitId, estado, causa?), unitAnchor(unitId): Vector3,
 *       wake(), sleep(), dispose() }
 *
 * Extras (superconjunto del contrato, opcionales para el integrador):
 *   update(dt)        — conducir la animación desde el bucle de main.mjs.
 *                       En cuanto se llama una vez, el bucle interno se aparta.
 *   onfaloAnchor()    — corona de la fuente, para las gotas de flujo.mjs.
 *   unidades          — array con los ids en orden de herradura.
 *   estadoUnidad(id)  — { estado, causa } actual.
 *   procedencia       — {cuerpos, real[], pendiente[]}: la frontera real/pendiente
 *                       de ESTE módulo, para que la demo pueda enseñarla.
 *
 * Tipestate → cuerpo (vía el contrato puppet, no vía clips sueltos):
 *   declarada  · setBase('ALP_LOC_stop') + gris (la pose existe, el color no)
 *   arrendada  · setBase('ALP_LOC_stop') + halo (la llave de H ya bajó)
 *   lista      · setBase('idle')
 *   corriendo  · setBase('walk') + playAdditive(gesto de oficio) con cadencia
 *   halted+orden · setBase('sit')
 *   halted+fallo · setBase('HM_TERM_muerte') y SELLADO: el mixer del puppet se
 *                  frena hasta congelarse en el último fotograma de «Death»
 *                  (duración real medida del GLB: 0.9583 s). Nada más cambia:
 *                  la unidad ignora cualquier setUnitState salvo 'recovering'.
 *   recovering · fade-in y setBase('idle') (levanta el sellado)
 *
 * Reglas honradas: ES modules de navegador, cero build, solo colores de paleta,
 * easing en toda animación, `prefers-reduced-motion`.
 */

import * as TRES_POR_DEFECTO from 'three';

// ── Mecanismo real de Scriptorium (import map: /kit/, /view-kit/) ───────────
import { loadPuppet } from '@zeus/ui-3d-kit/puppet/puppet.mjs';
import { DEFAULT_CLIP_MAPS } from '@zeus/ui-3d-kit/puppet/clip-map.mjs';
import { createAnimationController } from '@zeus/ui-3d-kit/core/animation-controller.mjs';
import { createStickPuppet } from '@zeus/view-kit/stick-puppet.mjs';

// ── Paleta (única fuente de color; nada fuera de aquí) ──────────────────────

const PALETA = {
  sepia: 0x131008,
  tinta: 0xeae0c8,
  oro: 0xe7b14c,
  verdigris: 0x85baa9,
  violeta: 0xac97ce,
  ok: 0x8fbf7f,
  fallo: 0xdb7a5d,
};

const CSS = {
  sepia: '#131008',
  tinta: '#EAE0C8',
  oro: '#E7B14C',
  verdigris: '#85BAA9',
  violeta: '#AC97CE',
  ok: '#8FBF7F',
  fallo: '#DB7A5D',
};

// ── Cuerpos: GLB real del kit + mapa de clips real ──────────────────────────

/** Servido por el montaje /models/ → @zeus/game-engine/assets/models/. */
const RUTA_GLB = '/models/RobotExpressive.glb';
const ESPERA_GLB_MS = 12000;

/** Mapa de clips REAL del kit para este GLB (clip-map.mjs). */
const MAPA_KIT = DEFAULT_CLIP_MAPS['RobotExpressive.glb'] || null;

/**
 * Mapa de clips que se le pasa a `loadPuppet` por su opción real `clipMap`.
 * Solo COMPLETA el del kit con dos entradas que el tipestate necesita:
 *
 *   ALP_LOC_stop   — nombre canónico REAL del catálogo Alephillo
 *                    (ALEPHILLO_SPEC_BASE de clip-map.mjs) que el mapa de
 *                    RobotExpressive aún no cubría; se le da su clip obvio.
 *   HM_TERM_muerte — clave LOCAL de la demo: el catálogo Alephillo no tiene
 *                    ranura para «pose terminal por fallo». Va marcada
 *                    `fallback: true` + `note`, como manda la convención del
 *                    propio clip-map, para que no se confunda con spec.
 */
const MAPA_CLIPS = MAPA_KIT
  ? {
    ...MAPA_KIT,
    base: {
      ...MAPA_KIT.base,
      ALP_LOC_stop: { clip: 'Standing' },
      HM_TERM_muerte: {
        clip: 'Death',
        fallback: true,
        note: 'clave local de la demo H·M: el catálogo ALP_* no tiene pose terminal por fallo',
      },
    },
    additive: { ...MAPA_KIT.additive },
  }
  : null;

/** Duración real del clip «Death» medida sobre el GLB del kit (segundos). */
const DURACION_MUERTE = 0.9583;

/** Poses base del contrato puppet por tipestate (GLB) y por stick. */
const POSE_GLB = {
  declarada: 'ALP_LOC_stop',
  arrendada: 'ALP_LOC_stop',
  lista: 'idle',
  corriendo: 'walk',
  haltedOrden: 'sit',
  haltedFallo: 'HM_TERM_muerte',
  recovering: 'idle',
};

/** STICK_POSES reales de view-kit: idle | walk | ride | swim | sit | menu. */
const POSE_STICK = {
  declarada: 'menu',
  arrendada: 'menu',
  lista: 'idle',
  corriendo: 'walk',
  haltedOrden: 'sit',
  haltedFallo: 'sit',
  recovering: 'idle',
};

/** Cadencia del gesto de oficio mientras la unidad corre (segundos). */
const GESTO_CADA = 5.4;

// ── Geometría del barrio ────────────────────────────────────────────────────

const R_HERRADURA = 11.5;
const R_MONIGOTES = 8.9;
const R_PLAZA = 16.5;
const ARCO_HERRADURA = (Math.PI * 2 * 280) / 360;
const INICIO_HERRADURA = (Math.PI * 2 * 40) / 360;

const ALTURA_MONIGOTE = 1.8;
const ALTURA_ANCLA = 1.15;

const R_FUENTE = 2.5;
const ALTURA_ONFALO = 1.15;
const Y_AGUA = 0.46;

const TRANSICION = 0.5; // segundos de las transiciones de material/halo
const FADE_IN = 0.95; // segundos del fade-in de 'recovering'

/**
 * Las diez unidades de la herradura, en orden. `gesto` es el emote que la
 * unidad repite mientras está 'corriendo': `glb` usa los nombres aditivos
 * REALES del clip-map de RobotExpressive, `stick` los de STICK_EMOTES de
 * view-kit ('wave'|'nod'|'shake'|'thumbsUp'). `nombre`/`tarea` van al letrero.
 * El acento cromático dibuja la bilateralidad oro (H) / verdigrís (M) del
 * barrio; vector-mock se sale con violeta porque el simulacro no se esconde.
 */
const UNIDADES = [
  { id: 'portal', nombre: 'Portal', tarea: 'recepción', gesto: { glb: 'wave', stick: 'wave' }, acento: 'oro' },
  { id: 'loreador', nombre: 'Loreador', tarea: 'memoria del lugar', gesto: { glb: 'nod_quick', stick: 'nod' }, acento: 'oro' },
  { id: 'bartleby', nombre: 'Bartleby', tarea: 'copia y objeción', gesto: { glb: 'shake_head', stick: 'shake' }, acento: 'oro' },
  { id: 'archivero', nombre: 'Archivero', tarea: 'custodia', gesto: { glb: 'thumbsUp', stick: 'thumbsUp' }, acento: 'oro' },
  { id: 'cristalizador', nombre: 'Cristalizador', tarea: 'fija la línea', gesto: { glb: 'finger_up', stick: 'thumbsUp' }, acento: 'oro' },
  { id: 'vector-mock', nombre: 'Vector', tarea: 'índice · SIMULACRO', gesto: { glb: 'shrug', stick: 'shake' }, acento: 'violeta' },
  { id: 'grafista', nombre: 'Grafista', tarea: 'traza el grafo', gesto: { glb: 'nod_quick', stick: 'nod' }, acento: 'verdigris' },
  { id: 'demiurgo', nombre: 'Demiurgo', tarea: 'compone', gesto: { glb: 'dance', stick: 'wave' }, acento: 'verdigris' },
  { id: 'dramaturgo', nombre: 'Dramaturgo', tarea: 'pone voz', gesto: { glb: 'wave_soft', stick: 'wave' }, acento: 'verdigris' },
  { id: 'pipeline', nombre: 'Tubería', tarea: 'encadena pasos', gesto: { glb: 'jump', stick: 'nod' }, acento: 'verdigris' },
];

const ALIAS_ESTADO = {
  declarada: 'declarada', declared: 'declarada',
  arrendada: 'arrendada', leased: 'arrendada', concedida: 'arrendada',
  lista: 'lista', ready: 'lista', preparada: 'lista',
  corriendo: 'corriendo', running: 'corriendo', ejecutando: 'corriendo',
  halted: 'halted', detenida: 'halted', parada: 'halted',
  recovering: 'recovering', recuperando: 'recovering', recuperada: 'recovering',
};

const ALIAS_CAUSA = {
  orden: 'orden', order: 'orden', ordenada: 'orden', parada: 'orden',
  fallo: 'fallo', fail: 'fallo', failure: 'fallo', error: 'fallo', corto: 'fallo',
};

/**
 * Lectura del vocabulario REAL `BARRIO_ESTADOS` de @zeus/ciudad/contract.mjs
 * ('vivo'|'latente'|'muerto'|'roto') sobre el tipestate del cuerpo. El mapa es
 * de la demo — la constante es del paquete, y se valida contra ella al arrancar.
 */
const SALUD_A_TIPESTATE = Object.freeze({
  vivo: { estado: 'corriendo', causa: null },
  latente: { estado: 'lista', causa: null },
  muerto: { estado: 'halted', causa: 'orden' },
  roto: { estado: 'halted', causa: 'fallo' },
});

// ── Utilidades puras ────────────────────────────────────────────────────────

const sujetar = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function menosMovimiento() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function aVector(T, v) {
  if (!v) return new T.Vector3();
  if (typeof v.isVector3 === 'boolean' && v.isVector3) return v.clone();
  return new T.Vector3(v.x || 0, v.y || 0, v.z || 0);
}

/** Deja correr `promesa` pero no espera más de `ms`. */
function conPlazo(promesa, ms) {
  return Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('plazo agotado')), ms)),
  ]);
}

/** Letrero del local, pintado en canvas: nombre grande + oficio pequeño. */
function crearTexturaLetrero(T, nombre, tarea, acentoCss) {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 160;
  const g = lienzo.getContext('2d');
  if (!g) return null;

  g.fillStyle = CSS.sepia;
  g.fillRect(0, 0, 512, 160);

  g.strokeStyle = acentoCss;
  g.lineWidth = 3;
  g.strokeRect(9, 9, 494, 142);
  g.globalAlpha = 0.28;
  g.strokeStyle = CSS.tinta;
  g.lineWidth = 1;
  g.strokeRect(18, 18, 476, 124);
  g.globalAlpha = 1;

  const mono = '"Cascadia Code", "Cascadia Mono", Consolas, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = CSS.tinta;
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

// ── Fábrica ─────────────────────────────────────────────────────────────────

/**
 * @param {object} opciones
 * @param {object} [opciones.scene]  escena donde colgar el barrio
 * @param {object} [opciones.THREE]  namespace de three (el del import map)
 * @param {object} [opciones.origin] posición del barrio en el mundo
 * @returns {Promise<object>} api del barrio
 */
export async function createBarrio({ scene, THREE, origin } = {}) {
  const T = THREE || TRES_POR_DEFECTO;
  const quieto = menosMovimiento();
  const dur = (s) => (quieto ? 0 : s);

  const GRIS = new T.Color(PALETA.sepia).lerp(new T.Color(PALETA.tinta), 0.34);
  const PIEDRA = new T.Color(PALETA.sepia).lerp(new T.Color(PALETA.tinta), 0.16);
  const PIEDRA_CLARA = new T.Color(PALETA.sepia).lerp(new T.Color(PALETA.tinta), 0.26);
  const color = (nombre) => new T.Color(PALETA[nombre]);

  const group = new T.Group();
  group.name = 'barrio';
  group.position.copy(aVector(T, origin));

  const unidades = new Map();
  const emisivosAmbiente = [];
  const lucesAmbiente = [];

  /** Motor de tweens REAL del kit (core/animation-controller.mjs). */
  const motor = createAnimationController();

  /** Los tweens del kit animan PROPIEDADES de objetos: aquí vive el despertar. */
  const barrioK = { despierto: quieto ? 1 : 0.1 };

  let reloj = 0;
  let vivo = true;
  let rafId = 0;
  let ultimoMs = 0;
  let ultimaExterna = -Infinity; // ms del último update(dt) del integrador

  /** La frontera real/pendiente de este módulo: es producto, se devuelve. */
  const procedencia = {
    cuerpos: 'pendiente',
    real: [
      '@zeus/ui-3d-kit/puppet/clip-map.mjs · DEFAULT_CLIP_MAPS',
      '@zeus/ui-3d-kit/core/animation-controller.mjs · createAnimationController',
    ],
    pendiente: [],
  };

  const ahora = () =>
    typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  // ── Tweens (sobre el motor real del kit) ──────────────────────────────────

  /**
   * Anima `objeto[prop]` hasta `hasta` en `d` segundos. `clave` identifica la
   * animación en el controlador: crear otra con la misma clave la sustituye
   * (misma semántica que el tween de R1). Con d ≤ 0 se aplica en seco.
   *
   * @param {{clave:string, objeto:object, prop:string, hasta:number,
   *          dur:number, ease?:string, onDone?:Function}} o
   */
  function tween(o) {
    const { clave, objeto, prop, hasta, dur: d, ease = 'easeInOut', onDone } = o;
    if (!(d > 0)) {
      motor.removeAnimation(clave);
      objeto[prop] = hasta;
      if (onDone) onDone();
      return;
    }
    motor.createAnimation(
      clave,
      [{ object: objeto, property: prop, endValue: hasta }],
      { duration: d, easing: ease, onComplete: onDone }
    );
  }

  // ── Materiales de escenografía ────────────────────────────────────────────

  function piedra(c, { rugosidad = 0.92, emisivo = null, intensidad = 0 } = {}) {
    const m = new T.MeshStandardMaterial({
      color: c,
      roughness: rugosidad,
      metalness: 0.04,
      emissive: emisivo ? emisivo : new T.Color(0, 0, 0),
      emissiveIntensity: intensidad,
    });
    return m;
  }

  /** Material cuyo brillo sigue el despertar del barrio. */
  function registrarEmisivoAmbiente(material, base) {
    emisivosAmbiente.push({ material, base });
    return material;
  }

  // ── Suelo de la plaza ─────────────────────────────────────────────────────

  function construirPlaza() {
    const suelo = new T.Mesh(new T.CircleGeometry(R_PLAZA, 84), piedra(PIEDRA, { rugosidad: 0.98 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    group.add(suelo);

    // Inlay: el trazo de la herradura, apenas insinuado.
    // RingGeometry mide su ángulo desde +X en el plano XY; tras tumbarla con
    // rotation.x = -π/2 el ángulo θ de la herradura cae en φ = θ - π/2.
    const trazo = new T.Mesh(
      new T.RingGeometry(
        R_HERRADURA - 0.22,
        R_HERRADURA + 0.22,
        96,
        1,
        INICIO_HERRADURA - Math.PI / 2 - 0.12,
        ARCO_HERRADURA + 0.24
      ),
      registrarEmisivoAmbiente(piedra(PIEDRA_CLARA, { emisivo: color('tinta'), intensidad: 0.06 }), 0.06)
    );
    trazo.rotation.x = -Math.PI / 2;
    trazo.position.y = 0.012;
    group.add(trazo);

    // Borde exterior del barrio.
    const borde = new T.Mesh(
      new T.RingGeometry(R_PLAZA - 0.32, R_PLAZA, 96),
      registrarEmisivoAmbiente(piedra(PIEDRA_CLARA, { emisivo: color('verdigris'), intensidad: 0.1 }), 0.1)
    );
    borde.rotation.x = -Math.PI / 2;
    borde.position.y = 0.014;
    group.add(borde);
  }

  // ── Fuente Ónfalo ─────────────────────────────────────────────────────────

  let aguaMalla = null;
  let radiosAgua = null;
  const anclaOnfalo = new T.Object3D();

  function construirOnfalo() {
    const fuente = new T.Group();
    fuente.name = 'onfalo';

    const muro = new T.Mesh(
      new T.CylinderGeometry(R_FUENTE, R_FUENTE * 1.04, 0.62, 64, 1, true),
      piedra(PIEDRA_CLARA)
    );
    muro.material.side = T.DoubleSide;
    muro.position.y = 0.31;
    muro.receiveShadow = true;
    fuente.add(muro);

    const brocal = new T.Mesh(
      new T.TorusGeometry(R_FUENTE, 0.085, 12, 72),
      registrarEmisivoAmbiente(piedra(PIEDRA_CLARA, { rugosidad: 0.6, emisivo: color('oro'), intensidad: 0.09 }), 0.09)
    );
    brocal.rotation.x = -Math.PI / 2;
    brocal.position.y = 0.62;
    fuente.add(brocal);

    const vaso = new T.Mesh(new T.CircleGeometry(R_FUENTE, 64), piedra(new T.Color(PALETA.sepia)));
    vaso.rotation.x = -Math.PI / 2;
    vaso.position.y = 0.1;
    fuente.add(vaso);

    // Agua: disco con rejilla radial; las ondas se calculan en update().
    const aguaGeo = new T.RingGeometry(0.02, R_FUENTE - 0.09, 72, 12);
    const pos = aguaGeo.attributes.position;
    radiosAgua = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      radiosAgua[i] = Math.hypot(pos.getX(i), pos.getY(i));
    }
    const aguaMat = new T.MeshStandardMaterial({
      color: color('verdigris'),
      roughness: 0.14,
      metalness: 0.12,
      transparent: true,
      opacity: 0.74,
      side: T.DoubleSide,
      emissive: color('verdigris'),
      emissiveIntensity: 0.12,
    });
    registrarEmisivoAmbiente(aguaMat, 0.12);
    aguaMalla = new T.Mesh(aguaGeo, aguaMat);
    aguaMalla.rotation.x = -Math.PI / 2;
    aguaMalla.position.y = Y_AGUA;
    fuente.add(aguaMalla);
    ondularAgua(0);

    // La piedra-ombligo: perfil de lathe, cúpula ojival.
    const perfil = [new T.Vector2(0.74, 0), new T.Vector2(0.7, 0.07)];
    const PASOS = 18;
    for (let i = 0; i <= PASOS; i++) {
      const u = i / PASOS;
      const r = 0.64 * Math.pow(Math.cos((u * Math.PI) / 2), 0.55);
      perfil.push(new T.Vector2(Math.max(r, 0.0001), 0.09 + ALTURA_ONFALO * u));
    }
    const onfalo = new T.Mesh(
      new T.LatheGeometry(perfil, 64),
      registrarEmisivoAmbiente(
        piedra(PIEDRA_CLARA, { rugosidad: 0.55, emisivo: color('tinta'), intensidad: 0.09 }),
        0.09
      )
    );
    onfalo.material.side = T.DoubleSide;
    onfalo.position.y = Y_AGUA - 0.04;
    onfalo.castShadow = true;
    fuente.add(onfalo);

    anclaOnfalo.position.set(0, Y_AGUA + ALTURA_ONFALO + 0.18, 0);
    fuente.add(anclaOnfalo);

    const luzFuente = new T.PointLight(PALETA.tinta, 0, 22, 2);
    luzFuente.position.set(0, 3.4, 0);
    lucesAmbiente.push({ luz: luzFuente, base: 9 });
    fuente.add(luzFuente);

    group.add(fuente);
  }

  function ondularAgua(t) {
    if (!aguaMalla || !radiosAgua) return;
    const pos = aguaMalla.geometry.attributes.position;
    const R = R_FUENTE - 0.09;
    for (let i = 0; i < pos.count; i++) {
      const r = radiosAgua[i];
      const caida = 0.3 + 0.7 * (r / R);
      const z = 0.032 * caida * (Math.sin(r * 5.4 - t * 1.7) * 0.62 + Math.sin(r * 9.1 - t * 2.6 + 1.3) * 0.38);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    aguaMalla.geometry.computeVertexNormals();
  }

  // ── Locales de la herradura ───────────────────────────────────────────────

  function construirLocal(meta, theta) {
    const local = new T.Group();
    local.name = `local:${meta.id}`;
    local.position.set(R_HERRADURA * Math.sin(theta), 0, R_HERRADURA * Math.cos(theta));
    // La fachada vive en +Z local; girando θ+π queda mirando a la fuente.
    local.rotation.y = theta + Math.PI;

    const acento = color(meta.acento);
    const acentoCss = CSS[meta.acento];

    const cuerpo = new T.Mesh(new T.BoxGeometry(3.2, 2.6, 2.4), piedra(PIEDRA_CLARA));
    cuerpo.position.y = 1.3;
    cuerpo.castShadow = true;
    cuerpo.receiveShadow = true;
    local.add(cuerpo);

    const zocalo = new T.Mesh(new T.BoxGeometry(3.44, 0.18, 2.64), piedra(PIEDRA));
    zocalo.position.y = 0.09;
    local.add(zocalo);

    const umbral = new T.Mesh(new T.BoxGeometry(1.9, 0.1, 0.5), piedra(PIEDRA));
    umbral.position.set(0, 0.05, 1.42);
    local.add(umbral);

    const vano = new T.Mesh(new T.BoxGeometry(1.32, 1.78, 0.14), piedra(new T.Color(PALETA.sepia)));
    vano.position.set(0, 0.92, 1.2);
    local.add(vano);

    // Luz de dentro: el local se enciende al despertar el barrio.
    const dentro = new T.Mesh(
      new T.PlaneGeometry(1.16, 1.62),
      registrarEmisivoAmbiente(
        new T.MeshStandardMaterial({
          color: new T.Color(PALETA.sepia),
          roughness: 1,
          emissive: acento.clone(),
          emissiveIntensity: 0.34,
        }),
        0.34
      )
    );
    dentro.position.set(0, 0.92, 1.28);
    local.add(dentro);

    const marquesina = new T.Mesh(new T.BoxGeometry(3.5, 0.11, 0.78), piedra(PIEDRA));
    marquesina.position.set(0, 2.12, 1.42);
    marquesina.rotation.x = -0.06;
    local.add(marquesina);

    const filo = new T.Mesh(
      new T.BoxGeometry(3.5, 0.05, 0.06),
      registrarEmisivoAmbiente(piedra(PIEDRA_CLARA, { rugosidad: 0.5, emisivo: acento.clone(), intensidad: 0.3 }), 0.3)
    );
    filo.position.set(0, 2.07, 1.79);
    local.add(filo);

    const textura = crearTexturaLetrero(T, meta.nombre, meta.tarea, acentoCss);
    if (textura) {
      const letreroMat = new T.MeshStandardMaterial({
        map: textura,
        emissiveMap: textura,
        emissive: color('tinta'),
        emissiveIntensity: 0.42,
        roughness: 0.88,
        metalness: 0,
      });
      registrarEmisivoAmbiente(letreroMat, 0.42);
      const letrero = new T.Mesh(new T.PlaneGeometry(2.64, 0.82), letreroMat);
      letrero.position.set(0, 2.68, 1.24);
      letrero.rotation.x = -0.17;
      local.add(letrero);

      const marco = new T.Mesh(new T.BoxGeometry(2.82, 0.98, 0.08), piedra(PIEDRA));
      marco.position.set(0, 2.68, 1.18);
      marco.rotation.x = -0.17;
      local.add(marco);
    }

    group.add(local);
    return local;
  }

  // ── Cuerpos: marioneta real del kit ───────────────────────────────────────

  /**
   * Pide una marioneta skinned al kit. Devuelve el puppet real o null si el
   * GLB no está disponible (el llamante cae al stick de view-kit).
   */
  let avisadoGlb = false;
  async function pedirPuppetGlb() {
    if (!MAPA_CLIPS) return null;
    // Las diez peticiones salen en la misma vuelta: el FileLoader de three
    // deduplica la descarga (loading[url]); el parseo sí es por instancia, y es
    // justo lo que le da a cada unidad su esqueleto y sus materiales propios.
    const promesa = loadPuppet(RUTA_GLB, { clipMap: MAPA_CLIPS, castShadow: true });
    try {
      return await conPlazo(promesa, ESPERA_GLB_MS);
    } catch (err) {
      // Si solo se agotó el plazo, el puppet puede llegar tarde: que no se quede
      // colgando ni sin liberar.
      promesa.then((p) => p && p.dispose && p.dispose()).catch(() => {});
      if (!avisadoGlb && typeof console !== 'undefined' && console.warn) {
        avisadoGlb = true;
        console.warn(
          '[barrio] loadPuppet no pudo con RobotExpressive.glb, se usa el'
          + ' stick-puppet de view-kit:', err && err.message
        );
      }
      return null;
    }
  }

  /** Normaliza la altura del cuerpo al canon del barrio (1.8 u). */
  function ajustarAltura(objeto) {
    const caja = new T.Box3().setFromObject(objeto);
    const alto = caja.max.y - caja.min.y;
    if (Number.isFinite(alto) && alto > 0.001) objeto.scale.setScalar(ALTURA_MONIGOTE / alto);
  }

  /**
   * Recoge los materiales del cuerpo para que `aplicarAspecto` pueda leer el
   * tipestate sobre ellos. `loadPuppet` parsea el GLB por instancia, así que
   * cada unidad tiene sus propios materiales: no hace falta clonarlos.
   */
  function recogerMateriales(u) {
    const mats = [];
    u.puppet.object.traverse((o) => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false; // el skinning desborda la caja de bind
      const lista = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of lista) {
        if (!m || mats.indexOf(m) !== -1) continue;
        m.userData.colorBase = m.color ? m.color.clone() : new T.Color(PALETA.tinta);
        m.userData.transparenteBase = m.transparent === true;
        mats.push(m);
      }
    });
    u.materiales = mats;
  }

  /** Pose base del contrato puppet para la clave de aspecto en curso. */
  function ponerPose(u, clave) {
    if (!u.puppet) return;
    // Con `prefers-reduced-motion` la locomoción en el sitio sobra: se respira.
    const clave2 = quieto && clave === 'corriendo' ? 'lista' : clave;
    const pose = u.tipo === 'glb' ? POSE_GLB[clave2] : POSE_STICK[clave2];
    if (!pose || pose === u.pose) return;
    if (u.puppet.setBase(pose) !== false) u.pose = pose;
  }

  // ── Halos y luz de simulacro ──────────────────────────────────────────────

  function crearHalo(acento) {
    const halo = new T.Group();
    const anillo = (rInt, rExt, opacidad) => {
      const m = new T.Mesh(
        new T.RingGeometry(rInt, rExt, 64),
        new T.MeshBasicMaterial({
          color: acento.clone(),
          transparent: true,
          opacity: 0,
          blending: T.AdditiveBlending,
          depthWrite: false,
          side: T.DoubleSide,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.userData.opacidadBase = opacidad;
      halo.add(m);
      return m;
    };
    anillo(0.52, 0.74, 0.85);
    anillo(0.78, 1.18, 0.22);
    halo.position.y = 0.035;
    return halo;
  }

  // ── Montaje de las unidades ───────────────────────────────────────────────

  function construirUnidad(meta, theta, puppetGlb) {
    const acento = color(meta.acento);
    const grupo = new T.Group();
    grupo.name = `unidad:${meta.id}`;
    grupo.position.set(R_MONIGOTES * Math.sin(theta), 0, R_MONIGOTES * Math.cos(theta));
    grupo.rotation.y = theta + Math.PI; // mirando al Ónfalo

    const u = {
      id: meta.id,
      meta,
      grupo,
      estado: 'declarada',
      causa: null,
      sellada: false,
      selloRestante: null, // segundos de mixer que le quedan al clip terminal
      puppet: null,
      tipo: 'stick',
      pose: null,
      gestoT: 0,
      materiales: [],
      acentoActual: acento.clone(),
      acentoBase: acento.clone(),
      acentoK: 0, // progreso del cambio de acento (lo escribe el motor del kit)
      grisK: 0,
      emisivoK: 0,
      haloK: 0,
      opacidad: 1,
      luzK: 0,
      luz: null,
      halo: null,
    };

    if (puppetGlb) {
      u.puppet = puppetGlb;
      u.tipo = 'glb';
    } else {
      // Fallback del brief: el monigote procedural REAL de view-kit. Se le pasa
      // el acento de la paleta (colorForActorId del kit da HSL fuera de paleta).
      u.puppet = createStickPuppet({ color: acento.clone() });
      u.tipo = 'stick';
    }

    ajustarAltura(u.puppet.object);
    recogerMateriales(u);
    grupo.add(u.puppet.object);

    u.halo = crearHalo(acento);
    grupo.add(u.halo);

    if (meta.acento === 'violeta') {
      // vector-mock: el simulacro se anuncia con su propia luz violeta.
      u.luz = new T.PointLight(PALETA.violeta, 0, 9.5, 2);
      u.luz.position.set(0, 1.5, 0.35);
      grupo.add(u.luz);
    }

    group.add(grupo);
    unidades.set(meta.id, u);
    aplicarEstado(u, 'declarada', null, { instantaneo: true });
    return u;
  }

  // ── Aspecto por tipestate ─────────────────────────────────────────────────

  function aplicarAspecto(u) {
    for (const m of u.materiales) {
      const base = m.userData.colorBase;
      if (base && m.color) {
        m.color.copy(base).lerp(GRIS, u.grisK);
        // El stick de view-kit usa MeshBasicMaterial (sin emissive): el estado
        // se lee tiñendo el color hacia el acento.
        if (!m.emissive) m.color.lerp(u.acentoActual, sujetar(u.emisivoK * 2.2, 0, 1));
      }
      if (m.emissive) {
        m.emissive.copy(u.acentoActual);
        m.emissiveIntensity = u.emisivoK;
      }
      if (u.opacidad < 1) {
        m.transparent = true;
        m.opacity = u.opacidad;
      } else if (!m.userData.transparenteBase) {
        m.transparent = false;
        m.opacity = 1;
      }
    }
  }

  /** Punto del recorrido en el que el acento cambia de color (apagado total). */
  const CORTE_ACENTO = 0.45;

  /**
   * Cambia el color del acento apagando y reencendiendo el emissive.
   *
   * Va en UNA sola animación con `onUpdate`, y no en dos encadenadas por
   * `onComplete`: el controlador del kit borra la animación DESPUÉS de llamar a
   * su onComplete (`animationsToRemove` se vacía al final de update), así que
   * una segunda fase creada con la misma clave desde dentro del onComplete
   * moriría en el acto. Comprobado contra el paquete real.
   */
  function cambiarAcento(u, nuevo, intensidad, d) {
    const igual = u.acentoActual.getHex() === nuevo.getHex();
    if (igual || !(d > 0)) {
      u.acentoActual.copy(nuevo);
      tween({ clave: `${u.id}:emisivo`, objeto: u, prop: 'emisivoK', hasta: intensidad, dur: d });
      return;
    }
    const desde = u.emisivoK;
    u.acentoK = 0;
    motor.createAnimation(
      `${u.id}:emisivo`,
      [{ object: u, property: 'acentoK', startValue: 0, endValue: 1 }],
      {
        duration: d,
        easing: 'linear',
        onUpdate: (p) => {
          if (p < CORTE_ACENTO) {
            u.emisivoK = desde * (1 - easeOutCubic(p / CORTE_ACENTO));
            return;
          }
          u.acentoActual.copy(nuevo);
          u.emisivoK = intensidad * easeOutCubic((p - CORTE_ACENTO) / (1 - CORTE_ACENTO));
        },
      }
    );
  }

  const ASPECTO = {
    declarada: { gris: 0.86, emisivo: 0.0, halo: 0.0, luz: 0.12, acento: 'tinta' },
    arrendada: { gris: 0.0, emisivo: 0.12, halo: 1.0, luz: 0.35, acento: 'oro' },
    lista: { gris: 0.0, emisivo: 0.1, halo: 0.55, luz: 0.55, acento: 'ok' },
    corriendo: { gris: 0.0, emisivo: 0.24, halo: 0.95, luz: 1.0, acento: 'ok' },
    haltedOrden: { gris: 0.24, emisivo: 0.07, halo: 0.4, luz: 0.25, acento: 'oro' },
    haltedFallo: { gris: 0.0, emisivo: 0.26, halo: 0.0, luz: 0.55, acento: 'fallo' },
    recovering: { gris: 0.0, emisivo: 0.2, halo: 0.7, luz: 0.6, acento: 'ok' },
  };

  function aplicarEstado(u, estado, causa, { instantaneo = false } = {}) {
    const d = instantaneo ? 0 : dur(TRANSICION);
    u.estado = estado;
    u.causa = causa;

    const clave =
      estado === 'halted' ? (causa === 'fallo' ? 'haltedFallo' : 'haltedOrden') : estado;
    const a = ASPECTO[clave] || ASPECTO.declarada;

    // vector-mock nunca finge: su acento siempre es violeta.
    const acento = u.meta.acento === 'violeta' ? color('violeta') : color(a.acento);

    tween({ clave: `${u.id}:gris`, objeto: u, prop: 'grisK', hasta: a.gris, dur: d });
    cambiarAcento(u, acento, a.emisivo, d);
    tween({ clave: `${u.id}:halo`, objeto: u, prop: 'haloK', hasta: a.halo, dur: d, ease: 'easeOut' });
    tween({ clave: `${u.id}:luz`, objeto: u, prop: 'luzK', hasta: a.luz, dur: d });

    // Opacidad: solo 'recovering' entra desvanecido.
    if (estado === 'recovering') {
      u.opacidad = quieto ? 1 : 0;
      tween({
        clave: `${u.id}:opacidad`,
        objeto: u,
        prop: 'opacidad',
        hasta: 1,
        dur: dur(FADE_IN),
        ease: 'easeOut',
      });
    } else {
      tween({ clave: `${u.id}:opacidad`, objeto: u, prop: 'opacidad', hasta: 1, dur: d });
    }

    // Cuerpo: pose base del contrato puppet + sellado del clip terminal.
    ponerPose(u, clave);
    if (clave === 'haltedFallo' && u.tipo === 'glb') {
      // El mixer avanzará solo lo que dura «Death» y se congelará ahí.
      u.selloRestante = DURACION_MUERTE;
    } else {
      u.selloRestante = null;
    }
    if (clave === 'corriendo') u.gestoT = GESTO_CADA * 0.6;

    aplicarAspecto(u);
  }

  // ── Bucle ─────────────────────────────────────────────────────────────────

  /**
   * Avanza el cuerpo de una unidad. El sellado por fallo NO usa un clip
   * distinto: frena el propio mixer del puppet hasta pararlo en el último
   * fotograma de «Death», que es lo que significa «sellada».
   */
  function avanzarCuerpo(u, paso) {
    if (!u.puppet) return;

    if (u.selloRestante !== null) {
      if (u.selloRestante <= 0) return; // congelada
      const k = sujetar(u.selloRestante / (DURACION_MUERTE * 0.3), 0, 1);
      const p = Math.min(u.selloRestante, paso * (0.1 + 0.9 * easeOutCubic(k)));
      u.selloRestante -= p;
      u.puppet.update(p);
      return;
    }

    u.puppet.update(paso);

    // Gesto de oficio: playAdditive real (crossfade documentado del kit).
    if (quieto || u.estado !== 'corriendo' || !u.meta.gesto) return;
    u.gestoT += paso;
    if (u.gestoT < GESTO_CADA) return;
    u.gestoT = 0;
    const nombre = u.tipo === 'glb' ? u.meta.gesto.glb : u.meta.gesto.stick;
    if (nombre) u.puppet.playAdditive(nombre);
  }

  function actualizar(dt) {
    if (!vivo) return;
    const paso = sujetar(dt || 0, 0, 0.1);
    reloj += paso;
    motor.update(); // el controlador del kit lleva su propio reloj

    if (!quieto) ondularAgua(reloj);

    const brilloAmb = 0.1 + 0.9 * barrioK.despierto;
    for (const e of emisivosAmbiente) e.material.emissiveIntensity = e.base * brilloAmb;
    for (const l of lucesAmbiente) l.luz.intensity = l.base * (0.06 + 0.94 * barrioK.despierto);

    for (const u of unidades.values()) {
      if (barrioK.despierto > 0.02 || u.selloRestante !== null) avanzarCuerpo(u, paso);

      aplicarAspecto(u);

      const pulso = !quieto && u.estado === 'corriendo' ? 1 + 0.13 * Math.sin(reloj * 2.6) : 1;
      for (const anillo of u.halo.children) {
        anillo.material.opacity = anillo.userData.opacidadBase * u.haloK * barrioK.despierto * pulso;
        anillo.visible = anillo.material.opacity > 0.004;
      }
      if (u.luz) u.luz.intensity = (0.6 + 3.4 * u.luzK) * barrioK.despierto;
    }
  }

  /**
   * Bucle propio: el barrio se anima solo aunque nadie lo conduzca. Si el
   * integrador llama a update(dt), este bucle se aparta mientras siga
   * haciéndolo; si deja de hacerlo (media segundo de silencio) lo retoma, de
   * modo que el barrio nunca se queda congelado por un cambio de fase.
   */
  function bucle(ms) {
    if (!vivo) return;
    rafId = requestAnimationFrame(bucle);
    const dt = ultimoMs ? (ms - ultimoMs) / 1000 : 0.016;
    ultimoMs = ms;
    if (ahora() - ultimaExterna < 500) return;
    actualizar(dt);
  }

  // ── Construcción ──────────────────────────────────────────────────────────

  construirPlaza();
  construirOnfalo();

  const hemisferio = new T.HemisphereLight(PALETA.tinta, PALETA.sepia, 0);
  lucesAmbiente.push({ luz: hemisferio, base: 0.85 });
  group.add(hemisferio);

  const luzClave = new T.DirectionalLight(PALETA.oro, 0);
  luzClave.position.set(9, 14, 8);
  luzClave.castShadow = true;
  lucesAmbiente.push({ luz: luzClave, base: 0.75 });
  group.add(luzClave);

  const contra = new T.DirectionalLight(PALETA.verdigris, 0);
  contra.position.set(-8, 7, -10);
  lucesAmbiente.push({ luz: contra, base: 0.3 });
  group.add(contra);

  if (!MAPA_CLIPS) {
    procedencia.pendiente.push(
      'clip-map del kit sin entrada «RobotExpressive.glb» (versión de @zeus/ui-3d-kit'
      + ' distinta de 0.1.4): los cuerpos caen al stick-puppet de view-kit'
    );
  } else {
    // Fronteras estructurales del mecanismo real, no fallos de esta demo.
    procedencia.pendiente.push(
      'capa aditiva REAL (AnimationUtils.makeClipAdditive): todos los emotes de'
      + ' RobotExpressive.glb están marcados additiveSafe:false en el clip-map del'
      + ' kit, así que playAdditive usa su fallback documentado (crossfade base →'
      + ' gesto → base). Habrá aditiva de verdad cuando llegue el rig ALP_*.'
    );
    procedencia.pendiente.push(
      'pose terminal en el contrato puppet: el catálogo ALP_* no tiene ranura para'
      + ' «sellada por fallo» ni loadPuppet expone clampWhenFinished; el sellado se'
      + ' hace frenando el mixer del propio puppet hasta el último fotograma de Death.'
    );
    procedencia.pendiente.push(
      '@zeus/view-kit/actors-layer.mjs · createActorsLayer: compone estos mismos dos'
      + ' mecanismos, pero se maneja por snapshot de actores (position/pose/emote) y'
      + ' no expone los puppets, así que el tipestate no podría teñir sus materiales.'
    );
  }

  // Vocabulario REAL de salud del barrio ('vivo'|'latente'|'muerto'|'roto').
  // El import es dinámico a propósito: el montaje /zeus-ciudad/ y su entrada de
  // import map los pone W-SERVER-REAL, y si un día no estuvieran, el barrio se
  // dibuja igual y lo DECLARA en `procedencia.pendiente` — nunca copia aquí la
  // constante del paquete.
  let BARRIO_ESTADOS = null;
  try {
    ({ BARRIO_ESTADOS } = await import('@zeus/ciudad/contract'));
    const faltan = BARRIO_ESTADOS.filter((e) => !(e in SALUD_A_TIPESTATE));
    const sobran = Object.keys(SALUD_A_TIPESTATE).filter((e) => !BARRIO_ESTADOS.includes(e));
    if ((faltan.length || sobran.length) && typeof console !== 'undefined' && console.warn) {
      console.warn('[barrio] BARRIO_ESTADOS real ha cambiado', { faltan, sobran });
    }
    procedencia.real.push('@zeus/ciudad/contract.mjs · BARRIO_ESTADOS');
  } catch (err) {
    procedencia.pendiente.push(
      'BARRIO_ESTADOS de @zeus/ciudad/contract.mjs no llegó al navegador ('
      + ((err && err.message) || err) + '): setUnitState acepta el vocabulario'
      + ' de salud sin poder validarlo contra el paquete'
    );
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[barrio] sin @zeus/ciudad/contract.mjs:', err && err.message);
    }
  }

  // Los diez cuerpos, en paralelo.
  const puppets = MAPA_CLIPS
    ? await Promise.all(UNIDADES.map(() => pedirPuppetGlb()))
    : UNIDADES.map(() => null);

  UNIDADES.forEach((meta, i) => {
    const theta = INICIO_HERRADURA + (ARCO_HERRADURA * i) / (UNIDADES.length - 1);
    construirLocal(meta, theta);
    construirUnidad(meta, theta, puppets[i]);
  });

  const conGlb = puppets.filter(Boolean).length;
  procedencia.cuerpos = conGlb === UNIDADES.length ? 'glb' : conGlb === 0 ? 'stick' : 'mixto';
  if (conGlb > 0) {
    procedencia.real.push(`@zeus/ui-3d-kit/puppet/puppet.mjs · loadPuppet ×${conGlb}`);
  }
  if (conGlb < UNIDADES.length) {
    procedencia.real.push(
      `@zeus/view-kit/stick-puppet.mjs · createStickPuppet ×${UNIDADES.length - conGlb}`
    );
    procedencia.pendiente.push(
      `${UNIDADES.length - conGlb}/${UNIDADES.length} cuerpos sin GLB: van con el`
      + ' stick-puppet de view-kit (STICK_POSES no tiene pose terminal de fallo:'
      + ' el sellado se lee por color, no por cuerpo)'
    );
  }

  if (scene && typeof scene.add === 'function') scene.add(group);
  motor.start();
  actualizar(0);
  if (typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(bucle);

  // ── API ───────────────────────────────────────────────────────────────────

  /**
   * @param {string} unitId
   * @param {string} estado tipestate de R1 o BARRIO_ESTADOS real de @zeus/ciudad
   * @param {string} [causa] 'orden' | 'fallo' (solo con 'halted')
   */
  function setUnitState(unitId, estado, causa) {
    const u = unidades.get(unitId);
    if (!u) return;

    const crudo = String(estado == null ? '' : estado).toLowerCase();
    // El vocabulario de salud solo vale si el paquete real lo declara: si
    // BARRIO_ESTADOS llegó, manda él; si no llegó, se acepta el mapa local y
    // queda dicho en `procedencia.pendiente`.
    const esSalud = BARRIO_ESTADOS ? BARRIO_ESTADOS.includes(crudo) : crudo in SALUD_A_TIPESTATE;
    const salud = esSalud ? SALUD_A_TIPESTATE[crudo] : null;
    const e = salud ? salud.estado : ALIAS_ESTADO[crudo];
    if (!e) return;
    const c = e !== 'halted'
      ? null
      : salud
        ? salud.causa
        : ALIAS_CAUSA[String(causa || 'orden').toLowerCase()] || 'orden';

    // Muerta por fallo: se queda como está. Solo 'recovering' rompe el sello.
    if (u.sellada && e !== 'recovering') return;
    if (u.estado === e && u.causa === c) return;

    u.sellada = e === 'halted' && c === 'fallo';
    aplicarEstado(u, e, c);
  }

  function unitAnchor(unitId) {
    if (unitId === 'onfalo' || unitId === 'ónfalo') return onfaloAnchor();
    const u = unidades.get(unitId);
    const destino = new T.Vector3();
    if (!u) return group.getWorldPosition(destino);
    u.grupo.getWorldPosition(destino);
    destino.y += ALTURA_ANCLA;
    return destino;
  }

  function onfaloAnchor() {
    return anclaOnfalo.getWorldPosition(new T.Vector3());
  }

  function transicionDespertar(hasta) {
    return new Promise((resolver) => {
      tween({
        clave: 'barrio:despierto',
        objeto: barrioK,
        prop: 'despierto',
        hasta,
        dur: dur(1.5),
        ease: 'easeInOut',
        onDone: resolver,
      });
    });
  }

  const wake = () => transicionDespertar(1);
  const sleep = () => transicionDespertar(0.1);

  function update(dt) {
    ultimaExterna = ahora();
    actualizar(dt);
  }

  function dispose() {
    vivo = false;
    if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
    rafId = 0;
    motor.dispose();

    // Cada marioneta se despide con su propio dispose (contrato del kit):
    // para el mixer, suelta el root y libera geometrías/materiales.
    for (const u of unidades.values()) {
      if (u.puppet && typeof u.puppet.dispose === 'function') u.puppet.dispose();
      u.puppet = null;
      u.materiales = [];
    }
    unidades.clear();

    const liberar = (raiz) => {
      raiz.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          for (const k in m) {
            const v = m[k];
            if (v && v.isTexture) v.dispose();
          }
          m.dispose();
        }
        if (o.isLight && typeof o.dispose === 'function') o.dispose();
      });
    };
    liberar(group);

    if (group.parent) group.parent.remove(group);
    group.clear();
    emisivosAmbiente.length = 0;
    lucesAmbiente.length = 0;
  }

  function estadoUnidad(unitId) {
    const u = unidades.get(unitId);
    return u ? { estado: u.estado, causa: u.causa } : null;
  }

  return {
    group,
    setUnitState,
    unitAnchor,
    wake,
    sleep,
    dispose,
    // extras
    update,
    onfaloAnchor,
    estadoUnidad,
    unidades: UNIDADES.map((m) => m.id),
    procedencia,
  };
}

export default createBarrio;
