/**
 * ceremonia/paneles.mjs — W-UI-REAL (R2)
 *
 * Overlay DOM de la ceremonia montado sobre el VIEW-KIT REAL de Scriptorium.
 * Mecanismo real dentro (verificado en node_modules/@zeus/view-kit/src/):
 *
 *   panel.mjs      createPanel · panelStorageKey · loadPanelState ·
 *                  savePanelState  → las ventanitas del raíl y la terminal,
 *                  con plegado y persistencia `vk:<vista>:<id>` del kit.
 *   log-panel.mjs  createLogPanel  → las DOS cadenas de evidencia (H / M),
 *                  «lo más nuevo arriba», que es como el kit hace de ledger.
 *   hud.mjs        setText · createCounters → campos y contadores de cabecera.
 *   widgets.mjs    createWidgetRegistry · mountStoryWidgets → el cuerpo de
 *                  cada panel del raíl es un widget registrado (el kit no
 *                  nombra juegos: la demo inyecta sus renderers).
 *
 * Y de @zeus/ciudad/acta: `isActaDeBarrioShaped` valida el acta/1 que
 * devuelve POST /api/acta antes de pintarla.
 *
 * Se importan los MÓDULOS SUELTOS y no el barril `@zeus/view-kit`: su
 * index.mjs reexporta scene.mjs (arrastra three + @zeus/ui-3d-kit) y
 * room.mjs, que importa «/assets/room-client/room-client.browser.mjs», ruta
 * que este servidor no monta. Los cuatro módulos de arriba no importan nada:
 * son DOM puro, browser-safe. El import map del shell
 * («@zeus/view-kit/» → «/view-kit/») resuelve estos subcaminos; el campo
 * `exports` del paquete no los publica, pero en el navegador manda el import
 * map, no package.json.
 *
 * La estética R1 se conserva como TEMA encima de las clases del kit
 * (.arg-panel, .arg-panel-bar, .log-line, .log-badge…) en /css/demo.css.
 *
 * Contrato del brief (intacto):
 *   createPaneles({ mount })
 *   → { logH, logM, logSys, logActivity, setOptions, setStep, setTurn,
 *       setUnits, setLeases, badge }
 *
 * Extras R1 (intactos): root, estado, logMal, divisor, sello, sellar,
 * setUniverso, setCerrada, habilitarRecuperar, transcriptNdjson, descargar,
 * limpiar, dispose.
 * Extras R2: logCadena, setCadenas, cadenaNdjson, descargarCadena, setActa,
 * descargarActa, setBarrio, setPendientes, registro, paneles.
 *
 * Cableado que espera del integrador (todo opcional):
 *   onCadena:  (lado) => cer.chainNdjson(lado)
 *   onActa:    () => cer.actaJson()
 *   onState:   ui.setBarrio(s.ciudad.estadoActual, s.ciudad.barrioId)
 *              ui.setPendientes(s.pendientes)
 */

import {
  createPanel,
  panelStorageKey,
  loadPanelState,
  savePanelState
} from '@zeus/view-kit/panel.mjs';
import { createLogPanel } from '@zeus/view-kit/log-panel.mjs';
import { setText, createCounters } from '@zeus/view-kit/hud.mjs';
import { createWidgetRegistry, mountStoryWidgets } from '@zeus/view-kit/widgets.mjs';

/* El acta que devuelve POST /api/acta se valida con el validador REAL del
   paquete de la ciudad — no con una comprobación casera. `acta.mjs` importa
   node:crypto y el shell lo resuelve con el shim SHA-256 del server; la misma
   cadena de imports que ya carga ceremonia/domain.mjs, así que no añade
   dependencia nueva a la página. */
import { isActaDeBarrioShaped, ACTA_VERSION } from '@zeus/ciudad/acta';

import * as dominio from './domain.mjs';

/* ── datos del escenario (barrio-lore-v1) ──────────────────────────────── */

/* El vocabulario lo manda el dominio: los nombres reales de los 11 pasos y
   de las unidades viven en ceremonia/domain.mjs. Estas listas son sólo el
   respaldo literal de R1 por si el dominio dejara de exportarlas. */

const PASOS_RESPALDO = [
  'preflight · identidad H·M',
  'room y autoridad',
  'leases',
  'inflación',
  'manifiesto y despliegue',
  'ingesta Ónfalo + análisis',
  'vector',
  'dos líneas',
  'grafo',
  'universos',
  'cortos · traza · cierre'
];

const UNIDADES_RESPALDO = [
  'portal', 'loreador', 'bartleby', 'archivero', 'cristalizador',
  'vector-mock', 'grafista', 'demiurgo', 'dramaturgo', 'pipeline'
];

const ARRENDABLES_RESPALDO = ['bartleby', 'cristalizador'];

const listaReal = (v, respaldo) => (Array.isArray(v) && v.length ? [...v] : [...respaldo]);

export const PASOS = Object.freeze(listaReal(dominio.PASOS, PASOS_RESPALDO));
export const UNIDADES = Object.freeze(listaReal(dominio.UNIDADES, UNIDADES_RESPALDO));
export const ARRENDABLES = Object.freeze(
  listaReal(dominio.UNIDADES_CON_LEASE, ARRENDABLES_RESPALDO)
);

const INSIGNIAS = {
  simulacro: {
    texto: 'SIMULACRO', clase: 'sim', visible: true,
    titulo: 'Sala, identidades y Future Machine son mock declarado'
  },
  provider: {
    texto: 'provider DeterministicDocumentMachine · contingency=true',
    clase: '', visible: true,
    titulo: 'M es plantillas deterministas, no un LLM'
  },
  tipestate: {
    texto: 'tipestate playground(8) ≠ lengua(6)', clase: '', visible: true,
    titulo: 'Proyección a las seis fases de la lengua: pendiente'
  },
  recuperado: {
    texto: 'RECUPERADO ✓', clase: 'ok', visible: false,
    titulo: 'Estado reconstruido desde la evidencia, no desde memoria'
  },
  cadena: {
    texto: 'CADENA ÍNTEGRA ✓', clase: 'ok', visible: false,
    titulo: 'Todos los digests encadenan con su previo'
  },
  acta: {
    texto: 'ACTA REAL ✓', clase: 'oro', visible: false,
    titulo: 'ActaDeBarrio acta/1 emitida por el server con emitirActa + '
      + 'huellaLedger de @zeus/ciudad/acta (POST /api/acta)'
  },
  atomico: {
    texto: 'FALLO ATÓMICO', clase: 'mal', visible: false,
    titulo: 'Denegado: cero estado parcial'
  }
};

/* ── utilidades ────────────────────────────────────────────────────────── */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const slug = (s) => String(s == null ? '' : s)
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nada';

function el(tag, clase, html) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (html != null) n.innerHTML = html;
  return n;
}

function reducido() {
  return typeof window.matchMedia === 'function' &&
         window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Los dos lados de la ceremonia bilateral: H (oro) y M (verdigrís). */
const LADOS = ['H', 'M'];

const lado = (v, porDefecto = 'M') => {
  const t = String(v == null ? '' : v).trim().toUpperCase();
  return LADOS.includes(t) ? t : porDefecto;
};

/**
 * Digest recortado para leerlo de un vistazo; el completo va en el title.
 * El dominio real sella con prefijo de algoritmo («sha256:…»): se retira para
 * mostrar, porque en pantalla sólo caben los primeros dígitos del hash.
 */
const corto = (d, n = 10) => {
  const s = String(d == null ? '' : d).replace(/^[a-z0-9-]+:/i, '');
  return s ? s.slice(0, n) : '—';
};

/** hud.mjs trabaja con getElementById: los ids han de ser únicos en la página. */
function prefijoLibre(base) {
  const raiz = String(base || 'hm');
  let p = raiz;
  for (let i = 2; document.getElementById(p + '-turno') && i < 50; i += 1) p = raiz + i;
  return p;
}

const almacen = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;                       // storage bloqueado: se sigue sin persistir
  }
};

/** Descarga un texto como fichero, sin dejar el object URL colgando. */
function bajar(nombre, texto, mime) {
  const url = URL.createObjectURL(new Blob([texto], { type: mime }));
  const a = Object.assign(el('a'), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Enlaza demo.css si el shell no lo trajo puesto. */
function asegurarCss(href) {
  if (!href) return;
  const ya = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .some((l) => (l.getAttribute('href') || '').includes('demo.css'));
  if (ya) return;
  const link = el('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/* ── widgets del raíl (registro real de @zeus/view-kit/widgets.mjs) ────── */

/**
 * Renderer mínimo con la firma que pide el kit:
 *   (ctx) => { el, id, destroy() }
 * El kit no nombra juegos (D-8): la demo inyecta estos cuatro y quien monte
 * `createPaneles({ widgets })` puede añadir o sustituir los suyos.
 */
function widgetDe(ctx, html) {
  const doc = ctx.doc || document;
  const caja = doc.createElement('div');
  caja.className = 'vk-widget hm-widget';
  caja.setAttribute('data-widget-id', ctx.id || 'widget');
  caja.innerHTML = typeof html === 'function' ? html(ctx.data || {}) : html;
  if (ctx.mount && ctx.mount.appendChild) ctx.mount.appendChild(caja);
  return {
    el: caja,
    id: ctx.id || 'widget',
    destroy() { caja.remove(); }
  };
}

/** Los renderers de la demo, por id de widget. */
export const WIDGETS = Object.freeze({
  'panel-pasos': (ctx) => widgetDe(ctx, '<ol class="hm-pasos" data-pasos></ol>'),

  'panel-unidades': (ctx) => widgetDe(ctx,
    '<table class="hm-tabla" data-unidades></table>'
    + '<p class="hm-pie">tipestate del playground · «·sim» = ejecutada vía '
    + 'máquina simulada</p>'),

  'panel-leases': (ctx) => widgetDe(ctx,
    '<table class="hm-tabla" data-leases></table>'
    + '<p class="hm-pie">request → grant | deny → materialize · revocable · '
    + 'fallo atómico</p>'),

  /* La frontera real/pendiente es producto de R2: la demo la enseña. */
  'panel-frontera': (ctx) => widgetDe(ctx,
    '<ul class="hm-frontera" data-frontera></ul>'
    + '<p class="hm-pie">lo que hoy no está en canal se declara aquí, con su '
    + 'motivo · nunca se finge</p>'),

  'panel-cadenas': (ctx) => widgetDe(ctx, (d) => `
    <div class="hm-cadenas">
      <section class="hm-cadena h">
        <p class="hm-cadena-cab">
          <span class="lado">H</span>
          <span class="ruta">H/chain.ndjson</span>
          <b id="${esc(d.idNH)}">0</b>
        </p>
        <div class="hm-log-k" id="${esc(d.idH)}" role="log" aria-label="Cadena de H"></div>
        <p class="hm-vacio" data-vacio="H">sin líneas todavía</p>
      </section>
      <section class="hm-cadena m">
        <p class="hm-cadena-cab">
          <span class="lado">M</span>
          <span class="ruta">M/chain.ndjson</span>
          <b id="${esc(d.idNM)}">0</b>
        </p>
        <div class="hm-log-k" id="${esc(d.idM)}" role="log" aria-label="Cadena de M"></div>
        <p class="hm-vacio" data-vacio="M">sin líneas todavía</p>
      </section>
    </div>
    <div class="hm-acta" data-acta></div>
    <div class="hm-botones">
      <button class="hm-mini acento" type="button" data-dl-h
              title="Cadena del lado H — en el playground, H/chain.ndjson">⬇ H/chain</button>
      <button class="hm-mini acento verde" type="button" data-dl-m
              title="Cadena del lado M — en el playground, M/chain.ndjson">⬇ M/chain</button>
      <button class="hm-mini" type="button" data-dl-acta disabled
              title="El acta se emite al cerrar la ceremonia (POST /api/acta)">⬇ acta.json</button>
      <button class="hm-mini" type="button" data-dl hidden
              title="Wire JSON sellado, una Activity por línea">⬇ transcript.ndjson</button>
      <button class="hm-mini" type="button" data-rec disabled
              title="Disponible tras cerrar la ceremonia">restart → recupera</button>
      <button class="hm-mini" type="button" data-zero>de cero</button>
    </div>
    <p class="hm-pie">dos cadenas encadenadas por digest · cada línea es
      {step, verb, object, causalDigest, wireDigest, activityId, side} ·
      log-panel del view-kit: lo más nuevo, arriba</p>`)
});

/* ── fábrica ───────────────────────────────────────────────────────────── */

export function createPaneles(opciones = {}) {
  const {
    mount = document.body,
    titulo = 'Prueba de H·M — Barrio LORE',
    ceja = 'Scriptorium · demo prueba-de-H-M · El Descenso',
    pasos: pasosIn = PASOS,
    unidades: unidadesIn = UNIDADES,
    arrendables: arrendablesIn = ARRENDABLES,
    cssHref = '/css/demo.css',
    onSay = null,          // (texto) => void        — muestra el prompt H>
    onDescarga = null,     // () => string ndjson    — transcript R1 (opcional)
    onRecuperar = null,    // () => Promise<void>    — restart → recupera
    onReiniciar = null,    // () => void             — «de cero»
    onCadena = null,       // (lado) => string ndjson — si no, se serializa la propia
    onActa = null,         // () => Promise<acta|null> — POST /api/acta del dominio
    ladoPorDefecto = 'M',  // lado de una Activity que no declara `side`
    vista = 'prueba-hm',   // clave de persistencia del kit: vk:<vista>:<id>
    prefijo = 'hm',        // prefijo de ids (hud.mjs trabaja por getElementById)
    widgets = null,        // renderers extra/sustitutos para el registro del kit
    ecoLocal = false,      // true: hace eco de la opción elegida como línea H
    aplicarFx = true,      // true: activity.fx pinta paneles sin ayuda externa
    maxLineas = 500,
    maxCadena = 240        // líneas retenidas por cadena (log-panel del kit)
  } = opciones;

  const raiz = (typeof mount === 'string' ? document.querySelector(mount) : mount)
    || document.body;
  asegurarCss(cssHref);

  const pre = prefijoLibre(prefijo);
  const ID = {
    turno: pre + '-turno',
    paso: pre + '-paso',
    actos: pre + '-actos',
    barrio: pre + '-barrio',
    cadena: { H: pre + '-cadena-h', M: pre + '-cadena-m' },
    cuenta: { H: pre + '-n-h', M: pre + '-n-m' }
  };
  const guardado = almacen();

  /* copias propias: ninguna instancia toca las listas del módulo */
  const pasos = [...pasosIn];
  const unidades = [...unidadesIn];
  const arrendables = [...arrendablesIn];

  /* ── estado de pintura (espejo, no fuente de verdad) ── */
  const S = {
    turno: 0,
    paso: 0,
    cerrada: false,
    universo: null,
    unidades: Object.fromEntries(unidades.map((u) => [u, 'declarada'])),
    sim: Object.fromEntries(unidades.map((u) => [u, false])),
    causa: Object.fromEntries(unidades.map((u) => [u, ''])),
    leases: Object.fromEntries(arrendables.map((u) => [u, '—'])),
    ledger: [],
    cadenas: { H: [], M: [] },
    acta: null,        // la ActaDeBarrio acta/1, si viene dentro
    actaSobre: null,   // lo que se descarga como acta.json (sobre completo)
    barrio: null,
    pendientes: []
  };

  /* ── DOM ── */
  const ui = el('div', 'hm-ui');
  ui.setAttribute('data-hm-ui', '');

  /* El raíl recuerda si quedó abierto: misma clave y mismos helpers que las
     ventanitas del kit (vk:<vista>:<id>). */
  const claveRail = panelStorageKey(vista, pre + '-rail');
  const railGuardado = loadPanelState(guardado, claveRail);
  const railAbierto0 = railGuardado.collapsed === false;
  ui.setAttribute('data-rail', railAbierto0 ? 'abierto' : 'cerrado');

  ui.innerHTML = `
    <header class="hm-cab hm-caja">
      <p class="hm-ceja">${esc(ceja)}</p>
      <h1 class="hm-tit">Prueba de <span class="hh">H</span>·<span class="mm">M</span> —
        <span data-tit-cola></span></h1>
      <div class="hm-meta">
        <span>turno <b id="${esc(ID.turno)}">0</b></span>
        <span>paso <b id="${esc(ID.paso)}">0</b>/${pasos.length}</span>
        <span>actos <b id="${esc(ID.actos)}">0</b></span>
        <span data-barrio hidden title="estado del barrio en el dominio de la ciudad">barrio
          <b id="${esc(ID.barrio)}">—</b></span>
        <span data-rama hidden>rama <b data-rama-v>—</b></span>
        <span data-insignias></span>
      </div>
    </header>

    <button class="hm-tog" type="button" data-tog
            aria-expanded="${railAbierto0}">${railAbierto0 ? '✕' : '⌗'} estado</button>

    <aside class="hm-rail" data-rail-panel aria-label="Estado de la ceremonia"></aside>
  `;

  raiz.appendChild(ui);

  const q = (sel) => ui.querySelector(sel);
  const nRail = q('[data-rail-panel]');

  /* ── ventanitas: createPanel real del view-kit ──────────────────────── */

  const ventana = (id, title, extra) => createPanel({
    id: pre + '-' + id,
    title,
    view: vista,
    mount: extra && extra.mount ? extra.mount : nRail,
    className: (extra && extra.className) || 'hm-panel hm-caja',
    collapsible: !(extra && extra.collapsible === false),
    draggable: false,          // el raíl es una columna flex: sin left/top
    storage: guardado,
    doc: document
  });

  /* La terminal es una ventanita del kit sin plegado: su barra de título hace
     de cabecera y aloja la etiqueta del paso en curso. */
  const panelTerm = ventana('panel-term', 'Ceremonia bilateral', {
    mount: ui, className: 'hm-term hm-caja', collapsible: false
  });
  ui.insertBefore(panelTerm.el, nRail);   // orden de lectura: terminal, luego raíl
  const nPasoLbl = el('span', 'hm-pasolbl', 'sala sin abrir');
  nPasoLbl.setAttribute('data-pasolbl', '');
  panelTerm.bar.appendChild(nPasoLbl);
  panelTerm.body.innerHTML = `
    <div class="hm-log" data-log role="log" aria-live="polite" tabindex="0"></div>
    <div class="hm-dock">
      <p class="hm-ceja">Turno de H</p>
      <div class="hm-opts" data-opts></div>
      <div class="hm-sayrow" data-sayrow hidden>
        <span class="hm-cursor" aria-hidden="true">H&gt;</span>
        <input class="hm-say" data-say type="text" autocomplete="off"
               spellcheck="false" aria-label="Frase de H"
               placeholder="…o escribe una frase de la gramática cerrada" />
      </div>
      <p class="hm-gram">gramática cerrada · H pregunta / dirige / concede /
        deniega / elige · las teclas 1–9 seleccionan opción</p>
    </div>`;

  const panelPasos = ventana('panel-pasos', `Ceremonia · ${pasos.length} pasos bloqueantes`);
  const panelUnidades = ventana('panel-unidades', `Unidades · ${unidades.length} declaradas`);
  const panelLeases = ventana('panel-leases', 'Leases');
  const panelEv = ventana('panel-evidencia', 'Evidencia · dos cadenas');
  const panelFrontera = ventana('panel-frontera', 'Frontera · real / pendiente');

  /* ── cuerpos: registro de widgets real del view-kit ─────────────────── */

  const registro = createWidgetRegistry({ ...WIDGETS, ...(widgets || {}) });
  const datosWidget = {
    'panel-pasos': { pasos },
    'panel-unidades': { unidades },
    'panel-leases': { arrendables },
    'panel-cadenas': {
      idH: ID.cadena.H, idM: ID.cadena.M,
      idNH: ID.cuenta.H, idNM: ID.cuenta.M
    },
    'panel-frontera': {}
  };
  const montados = [];
  for (const [idWidget, panel] of [
    ['panel-pasos', panelPasos], ['panel-unidades', panelUnidades],
    ['panel-leases', panelLeases], ['panel-cadenas', panelEv],
    ['panel-frontera', panelFrontera]
  ]) {
    montados.push(mountStoryWidgets({
      registry: registro,
      widgets: [idWidget],
      dataById: datosWidget,
      mount: panel.body,
      doc: document
    }));
  }

  const nTitCola = q('[data-tit-cola]');
  const nRama = q('[data-rama]');
  const nRamaV = q('[data-rama-v]');
  const nBarrio = q('[data-barrio]');
  const nInsig = q('[data-insignias]');
  const nLog = q('[data-log]');
  const nOpts = q('[data-opts]');
  const nSayRow = q('[data-sayrow]');
  const nSay = q('[data-say]');
  const nPasos = q('[data-pasos]');
  const nUnidades = q('[data-unidades]');
  const nLeases = q('[data-leases]');
  const nFrontera = q('[data-frontera]');
  const nActa = q('[data-acta]');
  const nEvPanel = panelEv.el;
  const nDl = q('[data-dl]');
  const nDlH = q('[data-dl-h]');
  const nDlM = q('[data-dl-m]');
  const nDlActa = q('[data-dl-acta]');
  const nRec = q('[data-rec]');
  const nZero = q('[data-zero]');
  const nTog = q('[data-tog]');
  const nVacio = { H: q('[data-vacio="H"]'), M: q('[data-vacio="M"]') };

  /* ── ledger vivo: dos log-panel del kit, uno por lado ───────────────── */
  /* createLogPanel resuelve su contenedor por id AHORA: el DOM ya está puesto. */
  const cadenaLog = {
    H: createLogPanel(ID.cadena.H, { max: maxCadena }),
    M: createLogPanel(ID.cadena.M, { max: maxCadena })
  };
  const contadores = createCounters({
    actos: ID.actos, H: ID.cuenta.H, M: ID.cuenta.M
  });

  nTitCola.textContent = String(titulo).replace(/^.*—\s*/, '');
  if (!nTitCola.textContent) nTitCola.textContent = titulo;
  nDl.hidden = typeof onDescarga !== 'function';

  /* ── insignias ── */
  const insignias = new Map();
  function insignia(id, cfg) {
    let n = insignias.get(id);
    if (!n) {
      n = el('span', 'hm-insignia' + (cfg && cfg.clase ? ' ' + cfg.clase : ''));
      n.setAttribute('data-insignia', id);
      n.textContent = (cfg && cfg.texto) || id;
      if (cfg && cfg.titulo) n.title = cfg.titulo;
      n.hidden = true;
      nInsig.appendChild(n);
      insignias.set(id, n);
    }
    return n;
  }
  for (const [id, cfg] of Object.entries(INSIGNIAS)) {
    insignia(id, cfg).hidden = !cfg.visible;
  }

  function badge(id, on = true) {
    const n = insignia(id, INSIGNIAS[id]);
    const mostrar = on !== false;
    if (mostrar && n.hidden) {                 // reanima al reaparecer
      n.style.animation = 'none';
      void n.offsetWidth;
      n.style.animation = '';
    }
    n.hidden = !mostrar;
    return n;
  }

  /* ── transcript ── */
  function linea(clase, html) {
    const p = el('p', 'hm-ln ' + clase, html);
    nLog.appendChild(p);
    while (nLog.childElementCount > maxLineas) nLog.removeChild(nLog.firstChild);
    nLog.scrollTo({ top: nLog.scrollHeight, behavior: reducido() ? 'auto' : 'smooth' });
    return p;
  }

  const logH = (t) => linea('h', '<span class="pfx">H&gt;</span> ' + esc(t));
  const logM = (t) => linea('m', '<span class="pfx">M&gt;</span> ' + esc(t));
  const logSys = (t) => linea('sys', '· ' + esc(t));
  const logMal = (t) => linea('mal', 'H&gt; ' + esc(t) + '   ⌀ no compila');
  const divisor = (t = '') => linea(
    'div', esc(('── ' + t + ' ').trim() + ' ').padEnd(44, '─')
  );
  const sello = (t) => linea('sello', '⟐ ' + esc(t));

  function chip(modo) {
    const m = modo === 'mock' ? 'mock' : 'real';
    return '<span class="hm-chip ' + m + '">' + m + '</span>';
  }

  /** núcleos causales ya escritos en la terminal (una línea por acto, no dos) */
  const causalesVistos = new Set();

  /**
   * El dominio real avisa DOS veces por acto — mitad H y mitad M del mismo
   * núcleo causal (mismo `causalDigest`, distinto `wireDigest`). La terminal
   * escribe el acto una sola vez; cada mitad baja a la cadena de su lado.
   */
  function logActivity(a) {
    if (!a) return null;
    const causal = a.causalDigest ?? null;
    const mitad = !!(causal && a.side);
    const repetida = mitad && causalesVistos.has(causal);
    if (mitad) causalesVistos.add(causal);

    const act = {
      seq: a.seq ?? a.activityId ?? null,
      verb: a.verb,
      mode: a.mode === 'mock' ? 'mock' : 'real',
      note: a.note ?? a.object ?? null,
      fx: a.fx ?? null,
      prev: a.prev ?? null,
      causalDigest: causal,
      digest: a.digest ?? a.wireDigest ?? null
    };

    let p = null;
    if (!repetida) {
      S.ledger.push(act);
      contadores.bump('actos');
      if (aplicarFx && act.fx) aplicar(act.fx);

      // en pareja se muestra el núcleo causal: es lo que comparten las mitades
      const d = causal || act.digest;
      const dg = d ? ' <span class="dg">#' + esc(corto(d)) + '</span>' : '';
      const nota = act.note
        ? ' <span class="nota">· ' + esc(act.note) + '</span>' : '';
      p = linea('act', '  ├─ activity ' + esc(act.verb) + ' ' + chip(act.mode) + dg + nota);
    }

    logCadena(a);
    return p;
  }

  /* ── las dos cadenas (H oro · M verdigrís) ─────────────────────────── */

  /**
   * Normaliza a la forma REAL de una línea de chain.ndjson:
   *   { step, verb, object, causalDigest, wireDigest, activityId, side }
   * Acepta esa forma o la Activity sellada del dominio (seq/note/prev/digest).
   * Lo que no viene, va a null: aquí no se inventa ningún campo.
   */
  function lineaCadena(a) {
    if (!a || typeof a !== 'object') return null;
    const paso = a.step ?? (a.fx && a.fx.step) ?? S.paso ?? 0;
    const l = {
      step: Number(paso) || 0,
      verb: String(a.verb ?? '—'),
      object: a.object ?? a.note ?? null,
      causalDigest: a.causalDigest ?? a.prev ?? null,
      wireDigest: a.wireDigest ?? a.digest ?? null,
      activityId: a.activityId ?? a.id ?? a.seq ?? null,
      side: lado(a.side ?? a.lado, ladoPorDefecto)
    };
    // el dominio real añade `secondary` a la mitad: se conserva si viene
    if (a.secondary != null) l.secondary = a.secondary;
    return l;
  }

  const textoCadena = (l) => l.verb
    + (l.object ? ' ' + l.object : '')
    + ' · ⛓' + corto(l.causalDigest) + ' → ⌗' + corto(l.wireDigest);

  /**
   * Añade una línea a la cadena de su lado. `logActivity` ya llama aquí: úsalo
   * suelto sólo para líneas que no pasan por una Activity.
   * @returns la línea normalizada
   */
  function logCadena(entrada) {
    const l = lineaCadena(entrada);
    if (!l) return null;
    S.cadenas[l.side].push(l);

    const log = cadenaLog[l.side];
    if (log) {
      log.append({
        badge: 'p' + String(l.step).padStart(2, '0'),
        color: l.side === 'H' ? 'var(--oro)' : 'var(--verdigris)',
        text: textoCadena(l)
      });
      // el log-panel del kit pone lo más nuevo arriba: el digest entero, al title
      const caja = document.getElementById(ID.cadena[l.side]);
      const fila = caja && caja.firstElementChild;
      if (fila) fila.title = JSON.stringify(l, null, 1);
    }
    contadores.bump(l.side);
    if (nVacio[l.side]) nVacio[l.side].hidden = true;
    return l;
  }

  /** Repinta de golpe una o las dos cadenas (relectura de la evidencia). */
  function setCadenas(cadenas) {
    for (const L of LADOS) {
      const lista = cadenas && Array.isArray(cadenas[L]) ? cadenas[L] : null;
      if (!lista) continue;
      if (cadenaLog[L]) cadenaLog[L].clear();
      S.cadenas[L] = [];
      contadores.set(L, 0);
      if (nVacio[L]) nVacio[L].hidden = false;
      for (const l of lista) logCadena({ ...l, side: L });
    }
    return S.cadenas;
  }

  /** El ndjson de un lado, una línea de cadena por renglón. */
  function cadenaNdjson(cual) {
    const L = lado(cual, 'M');
    if (typeof onCadena === 'function') {
      const s = onCadena(L);
      if (typeof s === 'string') return s;
    }
    return S.cadenas[L].map((l) => JSON.stringify(l)).join('\n');
  }

  function descargarCadena(cual, nombre) {
    const L = lado(cual, 'M');
    const nd = cadenaNdjson(L);
    bajar(nombre || L + '-chain.ndjson', nd + (nd ? '\n' : ''), 'application/x-ndjson');
  }

  /* ── acta real (ActaDeBarrio acta/1 del server) ────────────────────── */

  /**
   * Localiza la ActaDeBarrio dentro de lo que llegue —el propio acta o el
   * sobre del dominio (actaJson → { …, acta, actaBarrio })— y la valida con
   * `isActaDeBarrioShaped` de @zeus/ciudad/acta: la forma la dicta el paquete.
   */
  function actaDeBarrioDe(x) {
    if (!x || typeof x !== 'object') return null;
    for (const c of [x, x.actaBarrio, x.acta]) {
      if (isActaDeBarrioShaped(c)) return c;
    }
    return null;
  }

  /** ¿el server dijo haber recomputado la huella con su node:crypto real? */
  function recomputadaEnServer() {
    const h = S.actaSobre && S.actaSobre.huella;
    return !!(h && typeof h === 'object' && h.recomputada === true);
  }

  /** Pinta el acta que devuelve POST /api/acta. */
  function pintarActa() {
    const a = S.acta;
    if (!a) {
      nActa.innerHTML = S.actaSobre
        ? '<p class="hm-vacio mal">lo recibido no pasa isActaDeBarrioShaped '
          + '(' + esc(ACTA_VERSION) + ') · se descarga tal cual llegó</p>'
        : '<p class="hm-vacio">acta aún no emitida · se emite al cerrar '
          + '(POST /api/acta → emitirActa + huellaLedger de '
          + '@zeus/ciudad/acta)</p>';
      return;
    }
    const fila = (k, v) => '<div class="f"><span class="k">' + esc(k) +
      '</span><span class="v">' + esc(v == null || v === '' ? '—' : v) + '</span></div>';
    const pend = Array.isArray(a.pendientes) ? a.pendientes : [];
    nActa.innerHTML =
      '<p class="hm-acta-cab">⟐ ActaDeBarrio ' + esc(a.version) + '</p>'
      + fila('barrio', a.barrioId)
      + fila('estado', a.estado)
      + fila('clase', a.ultimaClase)
      + fila('tick', a.tickEmision)
      + fila('huella', corto(a.huellaLedger, 16))
      + (a.resumen ? '<p class="hm-acta-res">' + esc(a.resumen) + '</p>' : '')
      + (pend.length
        ? '<p class="hm-acta-pend">pendientes · ' + esc(pend.join(' · ')) + '</p>'
        : '')
      + '<p class="hm-acta-val">forma validada con isActaDeBarrioShaped'
      + (recomputadaEnServer() ? ' · huella recomputada por el server' : '')
      + '</p>';
    nActa.title = JSON.stringify(a, null, 1);
  }

  /**
   * Recibe el acta emitida por el server y habilita su descarga.
   * Acepta el objeto, el sobre del dominio o el JSON en texto.
   */
  function setActa(entrada) {
    let sobre = entrada;
    if (typeof entrada === 'string') {
      try { sobre = JSON.parse(entrada); } catch { sobre = null; }
    }
    S.actaSobre = sobre && typeof sobre === 'object' ? sobre : null;
    S.acta = actaDeBarrioDe(S.actaSobre);
    pintarActa();
    nDlActa.disabled = !S.actaSobre;
    if (S.acta) {
      nDlActa.title = 'ActaDeBarrio ' + (S.acta.version || '?') + ' · huella '
        + corto(S.acta.huellaLedger, 16);
      badge('acta', true);
    } else if (S.actaSobre) {
      nDlActa.title = 'acta.json tal como llegó';
    }
    return S.acta;
  }

  async function descargarActa() {
    if (!S.actaSobre && typeof onActa === 'function') setActa(await onActa());
    if (!S.actaSobre) return null;
    bajar('acta.json', JSON.stringify(S.actaSobre, null, 2) + '\n', 'application/json');
    return S.actaSobre;
  }

  /* ── frontera real / pendiente ─────────────────────────────────────── */

  /**
   * setPendientes(lista) — lista: [{ que, motivo }] tal cual las declara el
   * dominio. Es el producto de R2: lo que hoy no está en canal, con su motivo.
   */
  function setPendientes(lista) {
    const ps = Array.isArray(lista) ? lista : [];
    S.pendientes = ps;
    nFrontera.innerHTML = ps.length
      ? ps.map((p) => '<li><span class="que">' + esc(p && (p.que ?? p.id ?? p)) +
        '</span><span class="motivo">' + esc((p && p.motivo) || '—') +
        '</span></li>').join('')
      : '<li class="hm-vacio">sin pendientes declarados todavía</li>';
    return S.pendientes;
  }

  /** Estado del barrio en el dominio de la ciudad (vivo/latente/…). */
  function setBarrio(estado, id) {
    S.barrio = estado ? String(estado) : null;
    nBarrio.hidden = !S.barrio;
    setText(ID.barrio, S.barrio);
    if (id) nBarrio.title = 'barrio ' + id + ' · estado del dominio de la ciudad';
    return S.barrio;
  }

  /* ── fx → paneles ── */
  function aplicar(fx) {
    if (!fx) return;
    if (fx.units) setUnits(fx.units);
    if (fx.leases) setLeases(fx.leases);
    if (Array.isArray(fx.sim)) {
      for (const u of fx.sim) if (u in S.sim) S.sim[u] = true;
      pintarUnidades();
    }
    if (fx.step != null && Number(fx.step) > S.paso) setStep(Number(fx.step));
    if (fx.universe) setUniverso(fx.universe);
  }

  /* ── cabecera ── */
  function setTurn(n) {
    S.turno = Number(n) || 0;
    setText(ID.turno, S.turno);
  }

  function setStep(n) {
    const v = Math.max(0, Math.min(pasos.length, Number(n) || 0));
    S.paso = v;
    setText(ID.paso, v);
    nPasoLbl.textContent = v
      ? 'paso ' + v + '/' + pasos.length + ' · ' + pasos[v - 1]
      : 'sala sin abrir';
    nPasoLbl.classList.toggle('vivo', v > 0 && !S.cerrada);
    pintarPasos();
  }

  function setUniverso(u) {
    S.universo = u || null;
    nRama.hidden = !S.universo;
    nRamaV.textContent = S.universo || '—';
  }

  function setCerrada(on = true) {
    S.cerrada = on !== false;
    nPasoLbl.classList.toggle('vivo', S.paso > 0 && !S.cerrada);
    pintarPasos();
    if (S.cerrada) {
      setOptions([]);
      habilitarRecuperar(true);
      nSay.disabled = true;
      nSay.placeholder = 'ceremonia cerrada — restart → recupera, o de cero';
    }
  }

  /* ── raíl ── */
  function pintarPasos() {
    nPasos.innerHTML = pasos.map((t, i) => {
      const k = i + 1;
      const cls = k < S.paso ? 'hecho'
        : (k === S.paso ? (S.cerrada ? 'hecho' : 'ahora') : '');
      return '<li class="' + cls + '"><span class="k">' +
        String(k).padStart(2, '0') + '</span><span class="t">' + esc(t) + '</span></li>';
    }).join('');
  }

  const cambiadas = new Set();
  function pintarUnidades() {
    nUnidades.innerHTML = unidades.map((u) => {
      const st = S.unidades[u] || 'declarada';
      const sim = S.sim[u] ? '<span class="hm-sim">·sim</span>' : '';
      const causa = S.causa[u] ? '<span class="hm-causa">' + esc(S.causa[u]) + '</span>' : '';
      const marca = cambiadas.has(u) ? ' class="cambia"' : '';
      return '<tr' + marca + '><td>' + esc(u) + '</td><td class="st"><span class="u-' +
        slug(st) + '">' + esc(st) + '</span>' + sim + causa + '</td></tr>';
    }).join('');
    cambiadas.clear();
  }

  function pintarLeases() {
    nLeases.innerHTML = arrendables.map((u) => {
      const st = S.leases[u] || '—';
      const cls = st === '—' ? 'l-nada' : 'l-' + slug(st);
      return '<tr><td>pod/' + esc(u) + '</td><td class="st ' + cls + '">' +
        esc(st) + '</td></tr>';
    }).join('');
  }

  /**
   * setUnits(map) — map: { id: 'lista' } o { id: { estado, sim, causa } }.
   * Fusiona: lo no mencionado se conserva.
   */
  function setUnits(map) {
    if (!map) return;
    for (const [u, v] of Object.entries(map)) {
      if (!(u in S.unidades)) { S.unidades[u] = 'declarada'; S.sim[u] = false; S.causa[u] = ''; }
      const estado = (v && typeof v === 'object') ? (v.estado ?? v.state ?? '') : v;
      if (estado && S.unidades[u] !== estado) cambiadas.add(u);
      if (estado) S.unidades[u] = String(estado);
      if (v && typeof v === 'object') {
        if (v.sim != null) S.sim[u] = !!v.sim;
        if (v.causa != null) S.causa[u] = v.causa ? String(v.causa) : '';
      }
    }
    pintarUnidades();
  }

  /** setLeases(map) — map: { id: 'pendiente'|'concedida'|'denegada'|'revocada'|'—' } */
  function setLeases(map) {
    if (!map) return;
    for (const [u, v] of Object.entries(map)) {
      if (!arrendables.includes(u)) arrendables.push(u);
      S.leases[u] = v == null || v === '' ? '—' : String(v);
    }
    pintarLeases();
  }

  /* ── opciones de H ── */
  let vigentes = [];
  let elegir = null;

  /**
   * setOptions(opts, onPick) — opts: [{ n, label }] (o cadenas sueltas).
   * Las teclas 1–9 disparan la opción con ese número.
   */
  function setOptions(opts, onPick) {
    vigentes = (opts || []).map((o, i) => (typeof o === 'string'
      ? { n: i + 1, label: o }
      : { n: Number(o.n) || i + 1, label: String(o.label ?? o.texto ?? '') }));
    elegir = typeof onPick === 'function' ? onPick : null;

    nOpts.innerHTML = '';
    for (const o of vigentes) {
      const b = el('button', 'hm-opt');
      b.type = 'button';
      b.innerHTML = '<span class="n">' + esc(o.n) + '</span>' + esc(o.label);
      b.addEventListener('click', () => elegirOpcion(o, b));
      nOpts.appendChild(b);
    }
    if (vigentes.length && !S.cerrada && nSay && !nSay.disabled && onSay) {
      // el foco no se roba: sólo se ofrece
      nSay.placeholder = '…o escribe una frase de la gramática cerrada';
    }
  }

  function elegirOpcion(o, boton) {
    if (!vigentes.length) return;
    const botones = [...nOpts.querySelectorAll('button')];
    botones.forEach((b) => { b.disabled = true; });
    if (boton) boton.classList.add('elegida');
    const fn = elegir;
    vigentes = [];
    if (ecoLocal) logH(o.label);
    if (fn) fn(o.n, o);
  }

  /* ── evidencia: descarga ── */
  function transcriptNdjson() {
    if (typeof onDescarga === 'function') {
      const s = onDescarga();
      if (typeof s === 'string') return s;
    }
    return S.ledger.map((a) => JSON.stringify(a)).join('\n');
  }

  function descargar(nombre = 'transcript.ndjson') {
    const nd = transcriptNdjson();
    bajar(nombre, nd + (nd ? '\n' : ''), 'application/x-ndjson');
  }

  function sellar() {
    nEvPanel.classList.remove('sella');
    void nEvPanel.offsetWidth;
    nEvPanel.classList.add('sella');
    badge('cadena', true);
  }

  function habilitarRecuperar(on = true) {
    nRec.disabled = !on || typeof onRecuperar !== 'function';
    nRec.title = nRec.disabled
      ? 'Disponible tras cerrar la ceremonia'
      : 'Verifica la cadena y reconstruye el estado desde el transcript';
  }

  function limpiar({ ledger = false } = {}) {
    nLog.innerHTML = '';
    if (ledger) {
      S.ledger.length = 0;
      causalesVistos.clear();
      contadores.set('actos', 0);
      setCadenas({ H: [], M: [] });
    }
  }

  /* ── escuchas ── */
  const teclado = (ev) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const activo = document.activeElement;
    if (activo === nSay && nSay.value) return;
    if (activo && /^(INPUT|TEXTAREA|SELECT)$/.test(activo.tagName) && activo !== nSay) return;
    const k = Number(ev.key);
    if (!Number.isInteger(k) || k < 1 || k > 9) return;
    const o = vigentes.find((v) => v.n === k);
    if (!o) return;
    ev.preventDefault();
    const boton = nOpts.querySelectorAll('button')[vigentes.indexOf(o)];
    elegirOpcion(o, boton);
  };

  const enter = (ev) => {
    if (ev.key !== 'Enter') return;
    const raw = nSay.value;
    if (!raw.trim()) return;
    nSay.value = '';
    if (typeof onSay === 'function') onSay(raw);
  };

  const clickDl = () => descargar();
  const clickDlH = () => descargarCadena('H');
  const clickDlM = () => descargarCadena('M');
  const clickDlActa = () => { descargarActa(); };
  const clickRec = async () => {
    nRec.disabled = true;
    if (typeof onRecuperar === 'function') await onRecuperar();
  };
  const clickZero = () => {
    if (typeof onReiniciar === 'function') onReiniciar();
    else location.reload();
  };
  const clickTog = () => {
    const abierto = ui.getAttribute('data-rail') === 'abierto';
    ui.setAttribute('data-rail', abierto ? 'cerrado' : 'abierto');
    nTog.setAttribute('aria-expanded', String(!abierto));
    nTog.textContent = abierto ? '⌗ estado' : '✕ estado';
    // misma persistencia que las ventanitas del kit: vk:<vista>:<id>
    savePanelState(guardado, claveRail, { collapsed: abierto });
  };

  document.addEventListener('keydown', teclado);
  nSay.addEventListener('keydown', enter);
  nDl.addEventListener('click', clickDl);
  nDlH.addEventListener('click', clickDlH);
  nDlM.addEventListener('click', clickDlM);
  nDlActa.addEventListener('click', clickDlActa);
  nRec.addEventListener('click', clickRec);
  nZero.addEventListener('click', clickZero);
  nTog.addEventListener('click', clickTog);

  if (typeof onSay === 'function') nSayRow.hidden = false;
  habilitarRecuperar(false);

  function dispose() {
    document.removeEventListener('keydown', teclado);
    nSay.removeEventListener('keydown', enter);
    nDl.removeEventListener('click', clickDl);
    nDlH.removeEventListener('click', clickDlH);
    nDlM.removeEventListener('click', clickDlM);
    nDlActa.removeEventListener('click', clickDlActa);
    nRec.removeEventListener('click', clickRec);
    nZero.removeEventListener('click', clickZero);
    nTog.removeEventListener('click', clickTog);
    for (const m of montados) m.destroy();
    for (const p of [panelTerm, panelPasos, panelUnidades, panelLeases,
      panelEv, panelFrontera]) {
      p.destroy();
    }
    ui.remove();
  }

  /* ── primer pintado ── */
  pintarPasos();
  pintarUnidades();
  pintarLeases();
  pintarActa();
  setPendientes([]);
  setStep(0);
  setTurn(0);

  return {
    /* contrato */
    logH, logM, logSys, logActivity,
    setOptions, setStep, setTurn, setUnits, setLeases, badge,
    /* extras R1 */
    root: ui, estado: S,
    logMal, divisor, sello, sellar,
    setUniverso, setCerrada, habilitarRecuperar,
    transcriptNdjson, descargar, limpiar, dispose,
    /* extras R2 */
    logCadena, setCadenas, cadenaNdjson, descargarCadena,
    setActa, descargarActa, setBarrio, setPendientes,
    registro, paneles: {
      terminal: panelTerm, pasos: panelPasos, unidades: panelUnidades,
      leases: panelLeases, evidencia: panelEv, frontera: panelFrontera
    }
  };
}

export default createPaneles;
