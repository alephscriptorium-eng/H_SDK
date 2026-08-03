/**
 * barrio.mjs — módulo W-BARRIO · demo «Prueba-H-M» (El Descenso)
 * ---------------------------------------------------------------------------
 * Dibuja el barrio del descenso: una herradura de 10 locales con letrero
 * alrededor de la fuente Ónfalo, y un monigote por unidad cuyo cuerpo lee el
 * tipestate de la unidad.
 *
 * Contrato (ARQUITECTURA-DEMO.md):
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
 *
 * Tipestate → cuerpo:
 *   declarada  · gris estático (pose congelada, sin color)
 *   arrendada  · halo emissive (la llave de H ya bajó; el cuerpo sigue quieto)
 *   lista      · Idle
 *   corriendo  · clip de oficio (Walking / Punch / Wave según la unidad)
 *   halted+orden · Sitting
 *   halted+fallo · Death — y NADA más cambia: la unidad queda sellada y
 *                  ignora cualquier setUnitState posterior salvo 'recovering'.
 *   recovering · fade-in (y levanta el sellado del fallo)
 *
 * Reglas honradas: ES modules de navegador, cero deps nuevas, cero build,
 * solo colores de paleta, easing en toda animación, `prefers-reduced-motion`.
 */

import * as TRES_POR_DEFECTO from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonarConEsqueleto } from 'three/addons/utils/SkeletonUtils.js';

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

// ── Geometría del barrio ────────────────────────────────────────────────────

const RUTA_GLB = '/models/RobotExpressive.glb';
const ESPERA_GLB_MS = 12000;

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

const CRUCE = 0.34; // segundos de crossfade entre clips
const TRANSICION = 0.5; // segundos de las transiciones de material/halo
const FADE_IN = 0.95; // segundos del fade-in de 'recovering'

/**
 * Las diez unidades de la herradura, en orden. `oficio` es el clip que se
 * reproduce en 'corriendo'; `nombre`/`tarea` van al letrero.
 * El acento cromático dibuja la bilateralidad oro (H) / verdigrís (M) del
 * barrio; vector-mock se sale con violeta porque el simulacro no se esconde.
 */
const UNIDADES = [
  { id: 'portal', nombre: 'Portal', tarea: 'recepción', oficio: 'Wave', acento: 'oro' },
  { id: 'loreador', nombre: 'Loreador', tarea: 'memoria del lugar', oficio: 'Walking', acento: 'oro' },
  { id: 'bartleby', nombre: 'Bartleby', tarea: 'copia y objeción', oficio: 'Punch', acento: 'oro' },
  { id: 'archivero', nombre: 'Archivero', tarea: 'custodia', oficio: 'Walking', acento: 'oro' },
  { id: 'cristalizador', nombre: 'Cristalizador', tarea: 'fija la línea', oficio: 'Punch', acento: 'oro' },
  { id: 'vector-mock', nombre: 'Vector', tarea: 'índice · SIMULACRO', oficio: 'Wave', acento: 'violeta' },
  { id: 'grafista', nombre: 'Grafista', tarea: 'traza el grafo', oficio: 'Walking', acento: 'verdigris' },
  { id: 'demiurgo', nombre: 'Demiurgo', tarea: 'compone', oficio: 'Punch', acento: 'verdigris' },
  { id: 'dramaturgo', nombre: 'Dramaturgo', tarea: 'pone voz', oficio: 'Wave', acento: 'verdigris' },
  { id: 'pipeline', nombre: 'Tubería', tarea: 'encadena pasos', oficio: 'Walking', acento: 'verdigris' },
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

// ── Utilidades puras ────────────────────────────────────────────────────────

const sujetar = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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
  // El crossfade nunca vale 0: AnimationAction construye su interpolante con
  // [ahora, ahora+duración] y una duración nula lo degenera.
  const cruce = () => (quieto ? 0.001 : CRUCE);

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
  const tweens = [];
  let despiertoK = quieto ? 1 : 0.1;
  let reloj = 0;
  let vivo = true;
  let rafId = 0;
  let ultimoMs = 0;
  let ultimaExterna = -Infinity; // ms del último update(dt) del integrador

  const ahora = () =>
    typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  // ── Tweens ────────────────────────────────────────────────────────────────

  function tween({ clave, desde, hasta, dur: d, ease = easeInOutCubic, onUpdate, onDone }) {
    if (clave) {
      for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].clave === clave) tweens.splice(i, 1);
    }
    if (!(d > 0)) {
      if (onUpdate) onUpdate(hasta);
      if (onDone) onDone();
      return;
    }
    tweens.push({ clave, desde, hasta, dur: d, ease, onUpdate, onDone, t: 0 });
  }

  function avanzarTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const k = sujetar(tw.t / tw.dur, 0, 1);
      const v = tw.desde + (tw.hasta - tw.desde) * tw.ease(k);
      if (tw.onUpdate) tw.onUpdate(v);
      if (k >= 1) {
        tweens.splice(i, 1);
        if (tw.onDone) tw.onDone();
      }
    }
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

  // ── Cuerpo GLB ────────────────────────────────────────────────────────────

  let fuenteGlb = null; // { escena, clips, escala }

  async function cargarGlb() {
    try {
      const cargador = new GLTFLoader();
      const gltf = await conPlazo(cargador.loadAsync(RUTA_GLB), ESPERA_GLB_MS);
      if (!gltf || !gltf.scene) throw new Error('GLB sin escena');
      const caja = new T.Box3().setFromObject(gltf.scene);
      const alto = Math.max(caja.max.y - caja.min.y, 0.001);
      fuenteGlb = {
        escena: gltf.scene,
        clips: gltf.animations || [],
        escala: ALTURA_MONIGOTE / alto,
      };
      return true;
    } catch (err) {
      // Fallback digno: nadie se queda sin cuerpo.
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[barrio] RobotExpressive no disponible, se usa el monigote de cápsulas:', err && err.message);
      }
      fuenteGlb = null;
      return false;
    }
  }

  function crearCuerpoGlb(u) {
    const raiz = clonarConEsqueleto(fuenteGlb.escena);
    raiz.scale.setScalar(fuenteGlb.escala);

    const materiales = [];
    raiz.traverse((o) => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false; // el skinning desborda la caja de bind
      const lista = Array.isArray(o.material) ? o.material : [o.material];
      const clonados = lista.map((m) => {
        const c = m.clone();
        c.userData.colorBase = c.color ? c.color.clone() : new T.Color(PALETA.tinta);
        c.userData.transparenteBase = c.transparent === true;
        if (!c.emissive) c.emissive = new T.Color(0, 0, 0);
        materiales.push(c);
        return c;
      });
      o.material = Array.isArray(o.material) ? clonados : clonados[0];
    });

    const mixer = new T.AnimationMixer(raiz);
    const acciones = Object.create(null);
    for (const clip of fuenteGlb.clips) acciones[clip.name] = mixer.clipAction(clip);

    u.raiz = raiz;
    u.materiales = materiales;
    u.mixer = mixer;
    u.acciones = acciones;
    u.clipActual = null;
    return raiz;
  }

  /** Patrón fadeToAction del ejemplo oficial de RobotExpressive. */
  function ponerClip(u, nombre, { unaVez = false, escalaTiempo = 1 } = {}) {
    if (!u.acciones) return;
    const nueva = u.acciones[nombre] || u.acciones.Idle;
    if (!nueva) return;
    const previa = u.clipActual ? u.acciones[u.clipActual] : null;
    if (previa && previa !== nueva) previa.fadeOut(cruce());
    if (previa === nueva) {
      nueva.setEffectiveTimeScale(escalaTiempo);
      return;
    }
    nueva.reset();
    nueva.setEffectiveTimeScale(escalaTiempo);
    nueva.setEffectiveWeight(1);
    if (unaVez) {
      nueva.setLoop(T.LoopOnce, 1);
      nueva.clampWhenFinished = true;
    } else {
      nueva.setLoop(T.LoopRepeat, Infinity);
      nueva.clampWhenFinished = false;
    }
    nueva.fadeIn(cruce()).play();
    u.clipActual = nueva === u.acciones[nombre] ? nombre : 'Idle';
  }

  // ── Cuerpo de repuesto: cápsula articulada ────────────────────────────────

  function crearCuerpoCapsula(u, acento) {
    const raiz = new T.Group();
    const mat = new T.MeshStandardMaterial({
      color: PIEDRA_CLARA.clone(),
      roughness: 0.62,
      metalness: 0.08,
      emissive: acento.clone(),
      emissiveIntensity: 0,
    });
    mat.userData.colorBase = mat.color.clone();
    mat.userData.transparenteBase = false;

    const cuerpo = new T.Group();
    raiz.add(cuerpo);
    const caderas = new T.Group();
    caderas.position.y = 0.88;
    cuerpo.add(caderas);

    const malla = (geo, y) => {
      const m = new T.Mesh(geo, mat);
      m.position.y = y;
      m.castShadow = true;
      return m;
    };

    caderas.add(malla(new T.CapsuleGeometry(0.26, 0.5, 6, 16), 0.3));
    caderas.add(malla(new T.SphereGeometry(0.2, 20, 14), 0.8));

    const articular = (x, y) => {
      const pivote = new T.Group();
      pivote.position.set(x, y, 0);
      caderas.add(pivote);
      return pivote;
    };
    const hombroI = articular(-0.34, 0.58);
    const hombroD = articular(0.34, 0.58);
    hombroI.add(malla(new T.CapsuleGeometry(0.088, 0.4, 5, 12), -0.29));
    hombroD.add(malla(new T.CapsuleGeometry(0.088, 0.4, 5, 12), -0.29));

    const caderaI = articular(-0.16, 0);
    const caderaD = articular(0.16, 0);
    caderaI.add(malla(new T.CapsuleGeometry(0.108, 0.58, 5, 12), -0.4));
    caderaD.add(malla(new T.CapsuleGeometry(0.108, 0.58, 5, 12), -0.4));

    u.raiz = raiz;
    u.materiales = [mat];
    u.mixer = null;
    u.acciones = null;
    u.huesos = { cuerpo, caderas, hombroI, hombroD, caderaI, caderaD };
    return raiz;
  }

  /** Pose objetivo de la cápsula para el tipestate y el instante actuales. */
  function poseCapsula(u, t) {
    const p = { cuerpoX: 0, cuerpoY: 0, hombroIX: 0, hombroDX: 0, hombroDZ: 0, caderaIX: 0, caderaDX: 0 };
    const estado = u.estado;
    const q = quieto ? 0 : 1;

    if (estado === 'halted' && u.causa === 'fallo') {
      p.cuerpoX = -1.32;
      p.cuerpoY = -0.08;
      p.hombroIX = 0.5;
      p.hombroDX = 0.5;
      return p;
    }
    if (estado === 'halted') {
      p.caderaIX = -1.38;
      p.caderaDX = -1.38;
      p.cuerpoY = -0.36;
      p.hombroIX = 0.28;
      p.hombroDX = 0.28;
      return p;
    }
    if (estado === 'lista' || estado === 'recovering') {
      p.cuerpoY = Math.sin(t * 1.6) * 0.016 * q;
      p.hombroIX = Math.sin(t * 1.6) * 0.05 * q;
      p.hombroDX = -p.hombroIX;
      return p;
    }
    if (estado === 'corriendo') {
      if (u.meta.oficio === 'Walking') {
        const f = t * 5.2;
        p.hombroIX = Math.sin(f) * 0.52 * q;
        p.hombroDX = -p.hombroIX;
        p.caderaIX = -Math.sin(f) * 0.46 * q;
        p.caderaDX = -p.caderaIX;
        p.cuerpoY = Math.abs(Math.sin(f)) * 0.03 * q;
      } else if (u.meta.oficio === 'Punch') {
        const ciclo = (t * 1.5) % 1;
        const golpe = ciclo < 0.35 ? easeOutCubic(ciclo / 0.35) : 1 - easeInOutCubic((ciclo - 0.35) / 0.65);
        p.hombroDX = -1.62 * golpe * q;
        p.hombroIX = 0.22 * golpe * q;
        p.cuerpoY = -0.02 * golpe * q;
      } else {
        // Saludo: el brazo levantado es pose, no movimiento — se mantiene
        // aunque el usuario pida menos animación; solo cesa el vaivén.
        p.hombroDZ = 2.0;
        p.hombroDX = Math.sin(t * 5.6) * 0.34 * q;
        p.hombroIX = Math.sin(t * 1.5) * 0.05 * q;
      }
      return p;
    }
    // declarada / arrendada: de pie, quieta.
    return p;
  }

  function animarCapsula(u, dt, t) {
    const h = u.huesos;
    if (!h) return;
    const p = poseCapsula(u, t);
    const suave = 1 - Math.exp(-dt * 6.5); // easing exponencial, estable con dt
    const hacia = (nodo, eje, objetivo) => {
      nodo.rotation[eje] += (objetivo - nodo.rotation[eje]) * suave;
    };
    hacia(h.cuerpo, 'x', p.cuerpoX);
    h.cuerpo.position.y += (p.cuerpoY - h.cuerpo.position.y) * suave;
    hacia(h.hombroI, 'x', p.hombroIX);
    hacia(h.hombroD, 'x', p.hombroDX);
    hacia(h.hombroD, 'z', p.hombroDZ);
    hacia(h.caderaI, 'x', p.caderaIX);
    hacia(h.caderaD, 'x', p.caderaDX);
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

  function construirUnidad(meta, theta) {
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
      raiz: null,
      materiales: [],
      mixer: null,
      acciones: null,
      huesos: null,
      clipActual: null,
      acentoActual: acento.clone(),
      acentoBase: acento.clone(),
      grisK: 0,
      emisivoK: 0,
      haloK: 0,
      opacidad: 1,
      luzK: 0,
      luz: null,
      halo: null,
    };

    const cuerpo = fuenteGlb ? crearCuerpoGlb(u) : crearCuerpoCapsula(u, acento);
    grupo.add(cuerpo);

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
      if (base && m.color) m.color.copy(base).lerp(GRIS, u.grisK);
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

  /** Cambia el color del acento apagando y reencendiendo el emissive. */
  function cambiarAcento(u, nuevo, intensidad, d) {
    const igual = u.acentoActual.getHex() === nuevo.getHex();
    if (igual || !(d > 0)) {
      u.acentoActual.copy(nuevo);
      tween({
        clave: `${u.id}:emisivo`,
        desde: u.emisivoK,
        hasta: intensidad,
        dur: d,
        onUpdate: (v) => {
          u.emisivoK = v;
        },
      });
      return;
    }
    tween({
      clave: `${u.id}:emisivo`,
      desde: u.emisivoK,
      hasta: 0,
      dur: d * 0.45,
      ease: easeOutCubic,
      onUpdate: (v) => {
        u.emisivoK = v;
      },
      onDone: () => {
        u.acentoActual.copy(nuevo);
        tween({
          clave: `${u.id}:emisivo`,
          desde: 0,
          hasta: intensidad,
          dur: d * 0.55,
          ease: easeOutCubic,
          onUpdate: (v) => {
            u.emisivoK = v;
          },
        });
      },
    });
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

    tween({
      clave: `${u.id}:gris`,
      desde: u.grisK,
      hasta: a.gris,
      dur: d,
      onUpdate: (v) => {
        u.grisK = v;
      },
    });
    cambiarAcento(u, acento, a.emisivo, d);
    tween({
      clave: `${u.id}:halo`,
      desde: u.haloK,
      hasta: a.halo,
      dur: d,
      ease: easeOutCubic,
      onUpdate: (v) => {
        u.haloK = v;
      },
    });
    tween({
      clave: `${u.id}:luz`,
      desde: u.luzK,
      hasta: a.luz,
      dur: d,
      onUpdate: (v) => {
        u.luzK = v;
      },
    });

    // Opacidad: solo 'recovering' entra desvanecido.
    if (estado === 'recovering') {
      u.opacidad = quieto ? 1 : 0;
      tween({
        clave: `${u.id}:opacidad`,
        desde: u.opacidad,
        hasta: 1,
        dur: dur(FADE_IN),
        ease: easeOutCubic,
        onUpdate: (v) => {
          u.opacidad = v;
        },
      });
    } else {
      tween({
        clave: `${u.id}:opacidad`,
        desde: u.opacidad,
        hasta: 1,
        dur: d,
        onUpdate: (v) => {
          u.opacidad = v;
        },
      });
    }

    // Clip (solo cuerpo GLB; la cápsula se anima por pose).
    if (u.acciones) {
      switch (clave) {
        case 'declarada':
        case 'arrendada':
          ponerClip(u, 'Standing', { escalaTiempo: 0 });
          break;
        case 'lista':
        case 'recovering':
          ponerClip(u, 'Idle');
          break;
        case 'corriendo':
          ponerClip(u, u.meta.oficio);
          break;
        case 'haltedOrden':
          ponerClip(u, 'Sitting', { unaVez: true });
          break;
        case 'haltedFallo':
          ponerClip(u, 'Death', { unaVez: true });
          break;
        default:
          ponerClip(u, 'Idle');
      }
    }

    aplicarAspecto(u);
  }

  // ── Bucle ─────────────────────────────────────────────────────────────────

  function actualizar(dt) {
    if (!vivo) return;
    const paso = sujetar(dt || 0, 0, 0.1);
    reloj += paso;
    avanzarTweens(paso);

    if (!quieto) ondularAgua(reloj);

    const brilloAmb = 0.1 + 0.9 * despiertoK;
    for (const e of emisivosAmbiente) e.material.emissiveIntensity = e.base * brilloAmb;
    for (const l of lucesAmbiente) l.luz.intensity = l.base * (0.06 + 0.94 * despiertoK);

    for (const u of unidades.values()) {
      if (u.mixer && despiertoK > 0.02) u.mixer.update(paso);
      else if (u.huesos) animarCapsula(u, paso, reloj);

      aplicarAspecto(u);

      const pulso = !quieto && u.estado === 'corriendo' ? 1 + 0.13 * Math.sin(reloj * 2.6) : 1;
      for (const anillo of u.halo.children) {
        anillo.material.opacity = anillo.userData.opacidadBase * u.haloK * despiertoK * pulso;
        anillo.visible = anillo.material.opacity > 0.004;
      }
      if (u.luz) u.luz.intensity = (0.6 + 3.4 * u.luzK) * despiertoK;
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

  await cargarGlb();

  UNIDADES.forEach((meta, i) => {
    const theta = INICIO_HERRADURA + (ARCO_HERRADURA * i) / (UNIDADES.length - 1);
    construirLocal(meta, theta);
    construirUnidad(meta, theta);
  });

  if (scene && typeof scene.add === 'function') scene.add(group);
  actualizar(0);
  if (typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(bucle);

  // ── API ───────────────────────────────────────────────────────────────────

  function setUnitState(unitId, estado, causa) {
    const u = unidades.get(unitId);
    if (!u) return;
    const e = ALIAS_ESTADO[String(estado || '').toLowerCase()];
    if (!e) return;
    const c = e === 'halted' ? ALIAS_CAUSA[String(causa || 'orden').toLowerCase()] || 'orden' : null;

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
        desde: despiertoK,
        hasta,
        dur: dur(1.5),
        ease: easeInOutCubic,
        onUpdate: (v) => {
          despiertoK = v;
        },
        onDone: resolver,
      });
      if (!(dur(1.5) > 0)) resolver();
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
    tweens.length = 0;

    for (const u of unidades.values()) {
      if (u.mixer) {
        u.mixer.stopAllAction();
        if (u.raiz) u.mixer.uncacheRoot(u.raiz);
      }
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
    if (fuenteGlb && fuenteGlb.escena) liberar(fuenteGlb.escena);
    fuenteGlb = null;

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
  };
}

export default createBarrio;
