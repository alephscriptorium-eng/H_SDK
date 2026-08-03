/**
 * main.mjs — INTEGRADOR · demo «Prueba-H-M» (El Descenso)
 * ---------------------------------------------------------------------------
 * Una sola escena three.js con tres actos y un único bucle de reloj:
 *
 *   I  · CIUDAD    vista aérea de los 24 barrios sobre sus nueve mesetas.
 *   II · DESCENSO  raíl de cámara que cae por la niebla desde la meseta de
 *                  lore·voz hasta la plaza del barrio 20 (document-machine-sdk).
 *   III· CEREMONIA el guion determinista de domain.mjs cableado a los paneles
 *                  (DOM), a los cuerpos del barrio y a los efectos de flujo.
 *
 * Cableado del guion (contrato del brief):
 *   lease.grant        → flujo.llaveDesciende(ancla) + barrio.wake()
 *   document.ingest    → flujo.gota(cielo → Ónfalo)          [añadido, misma gramática]
 *   document.analyze   → flujo.gota(Ónfalo → escritorio)
 *   line.materialize   → flujo.cristalLinea(canal)  ×2
 *   unit.stop          → los cristales se disuelven
 *   room.close         → flujo.actaAsciende(Ónfalo → NOTARÍA) + ui.sellar()
 *   cualquier Activity → flujo.cremallera(paso, real ? oro : verdigrís)
 *   onState            → paneles + barrio.setUnitState(estadoCuerpo(...))
 *   restart → recupera → los cuerpos entran en 'recovering' y se reponen con
 *                        la cadencia de la relectura del ledger.
 *
 * Reglas: ES modules puros, cero build, cero deps, paleta cerrada, español,
 * `prefers-reduced-motion` respetado.
 *
 * Parámetros de URL (para la mirada humana, todos opcionales):
 *   ?directo=1     salta el acto I y aterriza ya en el barrio
 *   ?auto=0        no desciende sola: sólo con clic o tecla
 *   ?espera=14     segundos de vista aérea antes del descenso automático
 *   ?sombras=0     apaga el mapa de sombras
 *   ?exposicion=1  exposición del tone mapping (por defecto 1.24)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createCiudad } from './ciudad/ciudad.mjs';
import { createBarrio } from './barrio/barrio.mjs';
import { createFlujo } from './flujo/flujo.mjs';
import { createCeremonia, estadoCuerpo } from './ceremonia/domain.mjs';
import { createPaneles } from './ceremonia/paneles.mjs';

/* ══════════════════════════════════════════════════════════════════════════
   Constantes de puesta en escena
   ══════════════════════════════════════════════════════════════════════════ */

/** El barrio del descenso: distrito lore·voz, barrio 20. */
const BARRIO_ID = 'document-machine-sdk';

/** Cuánto se hunde la plaza bajo su meseta. La niebla de la ciudad ocupa
 *  y ∈ [-30, 50]: cayendo 60 se atraviesa entera y se sale por debajo. */
const HONDURA = 60;

/** La cremallera de flujo.mjs nace pensada para un barrio en el origen y con
 *  una escala de sobremesa; aquí se agranda para que lea desde la cámara de
 *  ceremonia (≈34 u) y se pega al fondo de la herradura. */
const CREMALLERA = { desplazamiento: new THREE.Vector3(0, 3.55, -8.6), escala: 1.8 };

const PALETA = Object.freeze({
  sepia: 0x131008, tinta: 0xeae0c8, oro: 0xe7b14c,
  verdigris: 0x85baa9, violeta: 0xac97ce, ok: 0x8fbf7f, fallo: 0xdb7a5d
});

/* ── parámetros de URL ──────────────────────────────────────────────────── */

const PARAMS = new URLSearchParams(location.search);
const numero = (clave, porDefecto) => {
  if (!PARAMS.has(clave)) return porDefecto;
  const v = Number(PARAMS.get(clave));
  return Number.isFinite(v) ? v : porDefecto;
};
const bandera = (clave, porDefecto) => {
  if (!PARAMS.has(clave)) return porDefecto;
  const v = String(PARAMS.get(clave)).toLowerCase();
  return !(v === '0' || v === 'no' || v === 'false');
};

const REDUCIDO = (() => {
  try {
    return typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
})();

const DIRECTO = bandera('directo', false);
const AUTOMATICO = bandera('auto', true);
const ESPERA = Math.max(0, numero('espera', REDUCIDO ? 1.5 : 10));
const SOMBRAS = bandera('sombras', true);
const EXPOSICION = numero('exposicion', 1.24);
// El tone mapping filmico protege los aditivos (halos, chispas, faros) de
// quemarse a blanco; `?tono=0` lo apaga y devuelve la paleta literal.
const TONO = bandera('tono', true);

/* ── utilidades ─────────────────────────────────────────────────────────── */

const pinza = (v, a, b) => (v < a ? a : v > b ? b : v);
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const avisar = (texto) => {
  document.dispatchEvent(new CustomEvent('hm:aviso', { detail: String(texto) }));
};

/* ══════════════════════════════════════════════════════════════════════════
   Portada del acto I: la invitación a descender
   ══════════════════════════════════════════════════════════════════════════ */

const CSS_PORTADA = `
.hm-portada {
  position: absolute; left: 50%; bottom: clamp(18px, 4vh, 46px);
  transform: translate(-50%, 14px);
  width: min(46em, calc(100vw - 3em));
  opacity: 0; visibility: hidden;
  transition: opacity .7s var(--suave, ease), transform .7s var(--suave, ease), visibility .7s;
}
.hm-portada[data-visible] { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
.hm-portada-caja {
  padding: 1.1em 1.4em 1em;
  text-align: center;
  background: rgba(19, 16, 8, .72);
  border: 1px solid var(--linea, rgba(234,224,200,.14));
  border-radius: 3px;
  box-shadow: 0 18px 44px -26px rgba(0,0,0,.95);
}
@supports (backdrop-filter: blur(9px)) {
  .hm-portada-caja { backdrop-filter: blur(9px) saturate(118%); background: rgba(19, 16, 8, .52); }
}
.hm-portada-ceja {
  margin: 0 0 .5em; font-size: 10.5px; letter-spacing: .24em;
  text-transform: uppercase; color: var(--verdigris, #85BAA9);
}
.hm-portada h2 {
  margin: 0 0 .45em; font-size: 19px; font-weight: 500;
  letter-spacing: .18em; text-transform: uppercase; color: var(--oro, #E7B14C);
}
.hm-portada-txt { margin: 0 auto .95em; max-width: 34em; font-size: 12.5px; color: var(--tinta, #EAE0C8); }
.hm-portada-txt b { color: var(--oro, #E7B14C); font-weight: 500; }
.hm-portada button {
  font: inherit; font-size: 12.5px; letter-spacing: .1em;
  padding: .55em 1.5em; cursor: pointer;
  color: var(--oro, #E7B14C); background: rgba(231, 177, 76, .10);
  border: 1px solid rgba(231, 177, 76, .46); border-radius: 2px;
  transition: background .3s var(--suave, ease), transform .3s var(--suave, ease);
}
.hm-portada button:hover { background: rgba(231, 177, 76, .19); transform: translateY(-1px); }
.hm-portada button:focus-visible { outline: 2px solid var(--oro, #E7B14C); outline-offset: 2px; }
.hm-portada-pie { margin: .8em 0 .6em; font-size: 11px; color: var(--tenue, rgba(234,224,200,.48)); }
.hm-portada-barra { height: 1px; background: var(--linea, rgba(234,224,200,.14)); overflow: hidden; }
.hm-portada-barra i { display: block; height: 100%; width: 0%; background: var(--verdigris, #85BAA9); }
@media (prefers-reduced-motion: reduce) { .hm-portada, .hm-portada * { transition-duration: .001ms !important; } }
`;

function crearPortada({ mount, onDescender, espera }) {
  if (!document.getElementById('hm-portada-css')) {
    const s = document.createElement('style');
    s.id = 'hm-portada-css';
    s.textContent = CSS_PORTADA;
    document.head.appendChild(s);
  }

  const raiz = document.createElement('div');
  raiz.className = 'hm-portada';
  raiz.innerHTML = `
    <div class="hm-portada-caja">
      <p class="hm-portada-ceja">Scriptorium · ciudad de holones</p>
      <h2>El Descenso</h2>
      <p class="hm-portada-txt">Veinticuatro barrios sobre nueve mesetas, y una NOTARÍA
        que recoge cada handoff. Abajo, en <b>lore·voz</b>, el barrio
        <b>document-machine-sdk</b> tiene la sala abierta y espera a H.</p>
      <button type="button" data-ir>Descender al barrio ⟶</button>
      <p class="hm-portada-pie">o pulsa una tecla · también se desciende sola</p>
      <div class="hm-portada-barra"><i data-barra></i></div>
    </div>`;
  mount.appendChild(raiz);

  const barra = raiz.querySelector('[data-barra]');
  const boton = raiz.querySelector('[data-ir]');
  let visible = false;
  let cuenta = 0;
  let corriendo = false;
  let disparada = false;

  const disparar = () => {
    if (disparada) return;
    disparada = true;
    corriendo = false;
    onDescender();
  };

  boton.addEventListener('click', disparar);

  return {
    raiz,
    mostrar() {
      if (disparada) return;
      visible = true;
      corriendo = espera > 0;
      raiz.setAttribute('data-visible', '');
      if (!REDUCIDO) boton.focus({ preventScroll: true });
    },
    ocultar() {
      visible = false;
      corriendo = false;
      raiz.removeAttribute('data-visible');
    },
    /** Aplaza la cuenta atrás: si H está mirando la ciudad, que mire. */
    aplazar() {
      if (!visible) return;
      cuenta = 0;
      barra.style.width = '0%';
    },
    /** Si el descenso no llegó a buen puerto, la invitación vuelve a valer. */
    rearmar() {
      disparada = false;
      cuenta = 0;
      barra.style.width = '0%';
    },
    disparar,
    tic(dt) {
      if (!corriendo || !visible) return;
      cuenta += dt;
      barra.style.width = pinza(cuenta / espera, 0, 1) * 100 + '%';
      if (cuenta >= espera) disparar();
    },
    dispose() { raiz.remove(); }
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Arranque
   ══════════════════════════════════════════════════════════════════════════ */

arrancar().catch((e) => {
  console.error('[main] la demo no pudo levantarse', e);
  avisar('No se pudo levantar la escena: ' + (e && e.message ? e.message : e));
  document.dispatchEvent(new CustomEvent('hm:listo'));
});

async function arrancar() {
  /* ── lienzo ───────────────────────────────────────────────────────────── */

  const hueco = document.getElementById('escena') || document.body;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(PALETA.sepia, 1);
  renderer.toneMapping = TONO ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = EXPOSICION;
  if (SOMBRAS) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  hueco.appendChild(renderer.domElement);

  const escena = new THREE.Scene();

  const camara = new THREE.PerspectiveCamera(
    46, window.innerWidth / Math.max(1, window.innerHeight), 0.35, 900
  );
  camara.position.set(0, 40, 70);
  escena.add(camara);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.055;
  controles.rotateSpeed = 0.55;
  controles.zoomSpeed = 0.7;
  controles.panSpeed = 0.5;
  controles.maxPolarAngle = Math.PI * 0.495;   // nadie se mete bajo el suelo
  controles.minDistance = 6;
  controles.maxDistance = 160;

  const redimensionar = () => {
    const a = window.innerWidth;
    const b = window.innerHeight;
    camara.aspect = a / Math.max(1, b);
    camara.updateProjectionMatrix();
    renderer.setSize(a, b, false);
  };
  window.addEventListener('resize', redimensionar);

  /* ── acto I: la ciudad ────────────────────────────────────────────────── */

  const ciudad = await createCiudad({ scene: escena, THREE });

  // El raíl aéreo se pide SIN cámara: la cinematografía la lleva main.mjs de
  // punta a punta, y así nunca hay dos manos sobre camera.position.
  const rail = ciudad.focusCity();
  const aereo = encuadreAereo(rail);
  camara.position.copy(aereo.pos);
  controles.target.copy(aereo.mira);
  controles.update();

  // Un fotograma antes de retirar el velo: nadie ve un lienzo vacío.
  renderer.render(escena, camara);
  document.dispatchEvent(new CustomEvent('hm:listo'));

  /* ── el barrio se construye mientras la ciudad se revela ──────────────── */

  const ancla = ciudad.barrioAnchor(BARRIO_ID);
  const cima = ciudad.barrioCima(BARRIO_ID);
  const origen = new THREE.Vector3(ancla.x, ancla.y - HONDURA, ancla.z);

  const promesaBarrio = createBarrio({ scene: escena, THREE, origin: origen })
    .then((b) => { afinarLucesBarrio(b.group); return b; });

  /* ── estado del integrador ────────────────────────────────────────────── */

  let barrio = null;
  let flujo = null;
  let ui = null;
  let cer = null;

  let vuelo = null;                 // raíl de cámara en curso
  let acto = 'ciudad';
  const cristales = [];             // los dos cristales de línea, para disolverlos
  let despierto = false;
  let cremEscalada = false;
  let pasoVisto = 0;
  let pasoCremallera = 0;
  let cerradaVista = null;
  let recuperando = false;

  /* ── portada e interacción del acto I ─────────────────────────────────── */

  const fallo = (e) => {
    console.error('[main]', e);
    avisar(String((e && e.message) || e));
  };

  const portada = crearPortada({
    mount: document.getElementById('paneles') || document.body,
    espera: AUTOMATICO ? ESPERA : 0,
    onDescender: () => { descender().catch(fallo); }
  });

  if (!DIRECTO) {
    rail.listo.then(() => { if (acto === 'ciudad') portada.mostrar(); });
  }

  // Clic sobre la ciudad (no un arrastre) o cualquier tecla: se desciende.
  let pinchado = null;
  renderer.domElement.addEventListener('pointerdown', (ev) => {
    pinchado = { x: ev.clientX, y: ev.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    if (acto !== 'ciudad' || !pinchado) return;
    const d = Math.hypot(ev.clientX - pinchado.x, ev.clientY - pinchado.y);
    pinchado = null;
    if (d < 7) portada.disparar();
  });
  document.addEventListener('keydown', (ev) => {
    if (acto !== 'ciudad') return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.key === 'Tab' || ev.key === 'Shift') return;
    portada.disparar();
  });
  // Si H se pone a orbitar la ciudad, la cuenta atrás cede el paso.
  controles.addEventListener('start', () => portada.aplazar());

  /* ── bucle único ──────────────────────────────────────────────────────── */

  let ultimo = 0;
  const mira = new THREE.Vector3();

  renderer.setAnimationLoop((ms) => {
    const dt = ultimo ? pinza((ms - ultimo) / 1000, 0, 0.1) : 1 / 60;
    ultimo = ms;

    if (vuelo) {
      vuelo.t = pinza(vuelo.t + dt / vuelo.dur, 0, 1);
      const e = vuelo.ease(vuelo.t);
      vuelo.curvaPos.getPointAt(e, camara.position);
      vuelo.curvaMira.getPointAt(e, mira);
      camara.lookAt(mira);
      controles.target.copy(mira);
      if (vuelo.t >= 1) {
        const listo = vuelo.resolver;
        vuelo = null;
        controles.enabled = true;
        controles.update();
        listo();
      }
    } else {
      controles.update();
    }

    ciudad.update(dt);
    if (barrio) barrio.update(dt);
    if (flujo) flujo.update(dt);
    portada.tic(dt);

    renderer.render(escena, camara);
  });

  if (DIRECTO) descender().catch(fallo);

  /* ══════════════════════════════════════════════════════════════════════
     Acto II — el descenso
     ══════════════════════════════════════════════════════════════════════ */

  function encuadreAereo(r) {
    // En pantallas estrechas la ciudad no cabe en el raíl que propone
    // ciudad.mjs (pensado para 16:9): se retrocede lo justo.
    const aspecto = window.innerWidth / Math.max(1, window.innerHeight);
    const k = pinza(1.45 / aspecto, 1, 1.9);
    return { pos: r.camara.clone().multiplyScalar(k), mira: r.mirarA.clone() };
  }

  function poseCeremonia() {
    const aspecto = window.innerWidth / Math.max(1, window.innerHeight);
    const k = pinza(1.62 / aspecto, 1, 1.7);
    return {
      // La herradura de barrio.mjs abre hacia +Z: se mira por su boca.
      pos: origen.clone().add(new THREE.Vector3(0, 12.4 + 3.2 * (k - 1), 34 * k)),
      mira: origen.clone().add(new THREE.Vector3(0, 2.6, -1.2))
    };
  }

  /** Raíl de cámara sobre dos splines gemelas (posición y mirada). */
  function volar({ posiciones, miradas, dur, ease = suave }) {
    const curvaPos = new THREE.CatmullRomCurve3(posiciones, false, 'catmullrom', 0.35);
    const curvaMira = new THREE.CatmullRomCurve3(miradas, false, 'catmullrom', 0.35);

    if (REDUCIDO || dur <= 0) {
      camara.position.copy(posiciones[posiciones.length - 1]);
      controles.target.copy(miradas[miradas.length - 1]);
      camara.lookAt(controles.target);
      controles.update();
      return Promise.resolve();
    }
    controles.enabled = false;
    return new Promise((resolver) => {
      vuelo = { curvaPos, curvaMira, t: 0, dur, ease, resolver };
    });
  }

  async function descender() {
    if (acto !== 'ciudad') return;
    acto = 'descenso';
    portada.ocultar();

    try {
      barrio = await promesaBarrio;
    } catch (e) {
      acto = 'ciudad';
      portada.rearmar();
      portada.mostrar();
      throw e;
    }
    ciudad.resaltarBarrio(BARRIO_ID, true);

    flujo = createFlujo({
      scene: escena, THREE, barrio,
      opciones: {
        reducido: REDUCIDO,
        cremallera: {
          posicion: origen.clone().add(CREMALLERA.desplazamiento),
          rotacionY: 0
        }
      }
    });

    const destino = poseCeremonia();
    // Hacia fuera de la ciudad, en el plano del barrio: la dirección por la que
    // la cámara rodea la meseta antes de caer.
    const afuera = new THREE.Vector3(ancla.x, 0, ancla.z);
    if (afuera.lengthSq() < 1e-6) afuera.set(1, 0, 0);
    afuera.normalize();

    await volar({
      dur: (REDUCIDO || DIRECTO) ? 0 : 5.8,
      ease: suave,
      posiciones: [
        camara.position.clone(),
        cima.clone().add(afuera.clone().multiplyScalar(15)).add(new THREE.Vector3(0, 10.5, 0)),
        new THREE.Vector3(ancla.x, ancla.y - HONDURA * 0.44, ancla.z)
          .add(afuera.clone().multiplyScalar(19)),
        destino.pos
      ],
      miradas: [
        controles.target.clone(),
        ancla.clone(),
        new THREE.Vector3(ancla.x, ancla.y - HONDURA * 0.72, ancla.z),
        destino.mira
      ]
    });

    // La plaza es pequeña: se acota el orbitar para que H no se pierda.
    controles.minDistance = 12;
    controles.maxDistance = 96;
    controles.target.copy(destino.mira);
    controles.update();

    portada.dispose();
    acto = 'ceremonia';
    abrirCeremonia();
  }

  /* ══════════════════════════════════════════════════════════════════════
     Acto III — la ceremonia
     ══════════════════════════════════════════════════════════════════════ */

  function abrirCeremonia() {
    ui = createPaneles({
      // Se monta en <body> y no en #paneles: la regla `#paneles > *` del shell
      // fuerza pointer-events:auto y taparía el 3D con un panel invisible.
      mount: document.body,
      onSay: (t) => { if (cer) cer.say(t); },
      onDescarga: () => (cer ? cer.transcriptNdjson() : ''),
      onRecuperar: () => (cer ? cer.restartRecover() : Promise.resolve()),
      // El eco de H lo pone domain.onH; el panel no debe duplicarlo.
      ecoLocal: false,
      // La verdad de los paneles es onState, no el fx suelto de cada Activity.
      aplicarFx: false
    });
    hacerSitioALaBanda();

    cer = createCeremonia({
      autoStart: false,                     // se arranca al pisar la plaza
      onH: (t) => ui.logH(t),
      onM: (t) => ui.logM(t),
      onSys: (t, tipo) => sistema(t, tipo),
      onOptions: (opts) => ui.setOptions(opts, (n) => { cer.pick(n); }),
      onActivity: (a) => { ui.logActivity(a); efectos3D(a); },
      onState: (s) => alEstado(s)
    });

    cer.start();
  }

  /** El shell pinta su banda SIMULACRO fija arriba; el overlay le cede el sitio. */
  function hacerSitioALaBanda() {
    const banda = document.getElementById('banda');
    if (!banda || !ui || !ui.root) return;
    const alto = Math.ceil(banda.getBoundingClientRect().height || 0);
    if (alto > 0) ui.root.style.paddingTop = alto + 12 + 'px';
  }

  /**
   * onSys → transcript. domain.mjs ya trae los adornos puestos («⟐ …»,
   * «── restart ──…», «H> … ⌀ no compila») y paneles.mjs los vuelve a poner:
   * aquí se desnudan para que no salgan dobles.
   */
  function sistema(texto, tipo) {
    const t = String(texto == null ? '' : texto);
    if (tipo === 'sello') { ui.sello(t.replace(/^\s*⟐\s*/, '')); return; }
    if (tipo === 'divider') { ui.divisor(t.replace(/^[\s─-]+|[\s─-]+$/g, '')); return; }
    if (tipo === 'error') {
      const m = /^H>\s*(.*?)\s*⌀\s*no compila\s*$/.exec(t);
      if (m) ui.logMal(m[1]);
      else ui.logSys(t);
      return;
    }
    ui.logSys(t);
  }

  /* ── onState → paneles + cuerpos ──────────────────────────────────────── */

  function alEstado(s) {
    if (!ui) return;

    ui.setTurn(s.turno);
    ui.setStep(s.paso);
    ui.setUniverso(s.universo);

    const cuerpos = {};
    for (const [id, est] of Object.entries(s.unidades)) {
      cuerpos[id] = { estado: est, sim: !!(s.sim && s.sim[id]) };
    }
    ui.setUnits(cuerpos);
    ui.setLeases(s.leases);

    if (s.cerrado !== cerradaVista) {
      cerradaVista = s.cerrado;
      ui.setCerrada(s.cerrado);
    }
    ui.habilitarRecuperar(s.puedeRecuperar);
    if (s.recuperado) ui.badge('recuperado', true);
    if (s.sello && s.sello !== 'sha-256') ui.badge('sello ' + s.sello, true);

    // ── ventana de recuperación: los cuerpos se apagan y vuelven con cadencia
    if (s.recuperando && !recuperando) {
      recuperando = true;
      pasoCremallera = 0;
      cremEscalada = false;
      disolverCristales();
      if (flujo) flujo.reiniciarCremallera();
      if (barrio) for (const id of barrio.unidades) barrio.setUnitState(id, 'recovering');
    } else if (!s.recuperando && recuperando) {
      recuperando = false;
    }

    if (barrio) {
      for (const [id, est] of Object.entries(s.unidades)) {
        // Durante la relectura, 'declarada' no se aplica: la unidad se queda en
        // su fade-in hasta que la evidencia devuelva su estado real.
        if (recuperando && est === 'declarada') continue;
        const c = estadoCuerpo(est);
        barrio.setUnitState(id, c.estado, c.causa);
      }
    }

    // La relectura no emite Activities: la cremallera se re-trepa desde el paso.
    if (recuperando && flujo && s.paso > pasoCremallera) {
      for (let n = pasoCremallera + 1; n <= s.paso; n++) {
        flujo.cremallera(n, 'oro');
        flujo.cremallera(n, 'verdigris');
      }
      pasoCremallera = s.paso;
      escalarCremallera();
    }

    pasoVisto = s.paso;
  }

  /* ── onActivity → efectos 3D ──────────────────────────────────────────── */

  function idDeNota(nota) {
    const t = String(nota || '').toLowerCase();
    if (!barrio) return null;
    for (const id of barrio.unidades) if (t.includes(id)) return id;
    return null;
  }

  function disolverCristales() {
    for (const m of cristales) {
      const f = m && m.userData && m.userData.flujo;
      if (f && typeof f.disolver === 'function') f.disolver(0.9);
    }
    cristales.length = 0;
  }

  /** La cremallera se crea perezosamente dentro de flujo: al aparecer, se agranda. */
  function escalarCremallera() {
    if (cremEscalada || !flujo || !flujo.group) return;
    const g = flujo.group.getObjectByName('cremallera');
    if (!g) return;
    g.scale.setScalar(CREMALLERA.escala);
    cremEscalada = true;
  }

  function efectos3D(a) {
    if (!flujo || !barrio) return;

    // Toda Activity sube un peldaño: oro si fue real, verdigrís si fue mock.
    const paso = (a.fx && a.fx.step) || pasoVisto || 1;
    flujo.cremallera(paso, a.mode === 'real' ? 'oro' : 'verdigris');
    escalarCremallera();

    switch (a.verb) {
      case 'lease.grant': {
        const id = idDeNota(a.note) || 'bartleby';
        if (!despierto) { despierto = true; barrio.wake(); }
        flujo.llaveDesciende(barrio.unitAnchor(id), { altura: 22, duracion: 1.9 });
        break;
      }

      case 'document.ingest':
        // Onfalo se llena desde arriba: una pieza, una gota.
        flujo.gota(
          origen.clone().add(new THREE.Vector3(0, 19, 0)),
          barrio.onfaloAnchor(),
          { color: PALETA.tinta, duracion: 2.0, particulas: 26, desvio: 0.6 }
        );
        break;

      case 'document.analyze':
        flujo.gota('onfalo', idDeNota(a.note) || 'bartleby',
          { color: PALETA.verdigris, duracion: 1.55 });
        break;

      case 'line.materialize': {
        const lado = cristales.length % 2 ? 1 : -1;
        const p = origen.clone().add(new THREE.Vector3(3.2 * lado, 0.06, 4.8));
        const m = flujo.cristalLinea(p, { alto: 2.15, radio: 0.42, color: PALETA.verdigris });
        if (m) cristales.push(m);
        break;
      }

      case 'lease.deny':
        ui.badge('atomico', true);
        break;

      case 'unit.stop':
        // Se detienen las unidades: las líneas materializadas se recogen.
        disolverCristales();
        break;

      case 'chain.verify':
        ui.badge('cadena', true);
        break;

      case 'room.close': {
        ui.sellar();
        const desde = barrio.onfaloAnchor().add(new THREE.Vector3(0, 0.5, 0));
        const notaria = ciudad.notariaAnchor();
        flujo.actaAsciende(desde, {
          subida: Math.max(20, notaria.y + 7 - desde.y),
          duracion: REDUCIDO ? 0.4 : 5.4
        });
        break;
      }

      default:
        break;
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Ajustes sobre módulos ajenos que main.mjs corrige sin tocarlos
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * barrio.mjs coloca sus DirectionalLight dentro de su grupo, pero el `target`
 * por defecto de una DirectionalLight vive en el origen del MUNDO. Con el
 * barrio desplazado (aquí, 60 unidades bajo su meseta) la luz apuntaría hacia
 * arriba y la plaza quedaría iluminada desde el suelo. Se ancla cada target al
 * propio grupo del barrio, que es lo que el módulo da por supuesto.
 * De paso, la sombra recibe un encuadre a la medida de la plaza (R = 16.5).
 */
function afinarLucesBarrio(grupo) {
  const luces = [];
  grupo.traverse((o) => { if (o.isDirectionalLight) luces.push(o); });

  for (const luz of luces) {
    luz.target.position.set(0, 0, 0);
    grupo.add(luz.target);

    if (!luz.castShadow) continue;
    luz.shadow.mapSize.set(2048, 2048);
    const c = luz.shadow.camera;
    c.left = -21; c.right = 21; c.top = 21; c.bottom = -21;
    c.near = 0.5; c.far = 64;
    c.updateProjectionMatrix();
    luz.shadow.bias = -0.0012;
    luz.shadow.normalBias = 0.035;
  }
}
