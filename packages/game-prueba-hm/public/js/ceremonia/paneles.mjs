/**
 * ceremonia/paneles.mjs — W-UI
 *
 * Overlay DOM de la ceremonia: terminal de scriptorium flotando sobre la
 * escena three.js. Sin dependencias, sin build, ES module de navegador.
 * Toda la estética vive en /css/demo.css (se enlaza sola si falta).
 *
 * Contrato del brief:
 *   createPaneles({ mount })
 *   → { logH, logM, logSys, logActivity, setOptions, setStep, setTurn,
 *       setUnits, setLeases, badge }
 *
 * Extras (opcionales, no rompen el contrato): root, divisor, sellar,
 * setUniverso, setCerrada, habilitarRecuperar, transcriptNdjson, descargar,
 * limpiar, dispose.
 */

/* ── datos del escenario (barrio-lore-v1) ──────────────────────────────── */

export const PASOS = [
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

export const UNIDADES = [
  'portal', 'loreador', 'bartleby', 'archivero', 'cristalizador',
  'vector-mock', 'grafista', 'demiurgo', 'dramaturgo', 'pipeline'
];

export const ARRENDABLES = ['bartleby', 'cristalizador'];

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
    onDescarga = null,     // () => string ndjson    — si no, se usa el propio
    onRecuperar = null,    // () => Promise<void>    — restart → recupera
    onReiniciar = null,    // () => void             — «de cero»
    ecoLocal = false,      // true: hace eco de la opción elegida como línea H
    aplicarFx = true,      // true: activity.fx pinta paneles sin ayuda externa
    maxLineas = 500
  } = opciones;

  const raiz = (typeof mount === 'string' ? document.querySelector(mount) : mount)
    || document.body;
  asegurarCss(cssHref);

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
    ledger: []
  };

  /* ── DOM ── */
  const ui = el('div', 'hm-ui');
  ui.setAttribute('data-hm-ui', '');
  ui.setAttribute('data-rail', 'cerrado');

  ui.innerHTML = `
    <header class="hm-cab hm-caja">
      <p class="hm-ceja">${esc(ceja)}</p>
      <h1 class="hm-tit">Prueba de <span class="hh">H</span>·<span class="mm">M</span> —
        <span data-tit-cola></span></h1>
      <div class="hm-meta">
        <span>turno <b data-turno>0</b></span>
        <span>paso <b data-paso>0</b>/${pasos.length}</span>
        <span data-rama hidden>rama <b data-rama-v>—</b></span>
        <span data-insignias></span>
      </div>
    </header>

    <button class="hm-tog" type="button" data-tog
            aria-expanded="false">⌗ estado</button>

    <section class="hm-term hm-caja" aria-label="Ceremonia bilateral">
      <div class="hm-term-cab">
        <p class="hm-ceja">Ceremonia bilateral</p>
        <span class="hm-pasolbl" data-pasolbl>sala sin abrir</span>
      </div>
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
      </div>
    </section>

    <aside class="hm-rail" data-rail-panel aria-label="Estado de la ceremonia">
      <div class="hm-panel hm-caja">
        <p class="hm-ceja">Ceremonia · ${pasos.length} pasos bloqueantes</p>
        <ol class="hm-pasos" data-pasos></ol>
      </div>
      <div class="hm-panel hm-caja">
        <p class="hm-ceja">Unidades · ${unidades.length} declaradas</p>
        <table class="hm-tabla" data-unidades></table>
        <p class="hm-pie">tipestate del playground · «·sim» = ejecutada vía
          máquina simulada</p>
      </div>
      <div class="hm-panel hm-caja">
        <p class="hm-ceja">Leases</p>
        <table class="hm-tabla" data-leases></table>
        <p class="hm-pie">request → grant | deny → materialize · revocable ·
          fallo atómico</p>
      </div>
      <div class="hm-panel hm-caja" data-evpanel>
        <p class="hm-ceja">Evidencia · cadena de digests</p>
        <div class="hm-evid" data-evid></div>
        <div class="hm-botones">
          <button class="hm-mini acento" type="button" data-dl
                  title="Descarga el wire JSON sellado, una Activity por línea">⬇ transcript.ndjson</button>
          <button class="hm-mini" type="button" data-rec disabled
                  title="Disponible tras cerrar la ceremonia">restart → recupera</button>
          <button class="hm-mini" type="button" data-zero>de cero</button>
        </div>
        <p class="hm-pie">wire JSON sellado · SHA-256 real por Activity · cada
          digest encadena el anterior</p>
      </div>
    </aside>
  `;

  raiz.appendChild(ui);

  const q = (sel) => ui.querySelector(sel);
  const nTitCola = q('[data-tit-cola]');
  const nTurno = q('[data-turno]');
  const nPaso = q('[data-paso]');
  const nRama = q('[data-rama]');
  const nRamaV = q('[data-rama-v]');
  const nInsig = q('[data-insignias]');
  const nPasoLbl = q('[data-pasolbl]');
  const nLog = q('[data-log]');
  const nOpts = q('[data-opts]');
  const nSayRow = q('[data-sayrow]');
  const nSay = q('[data-say]');
  const nPasos = q('[data-pasos]');
  const nUnidades = q('[data-unidades]');
  const nLeases = q('[data-leases]');
  const nEvid = q('[data-evid]');
  const nEvPanel = q('[data-evpanel]');
  const nDl = q('[data-dl]');
  const nRec = q('[data-rec]');
  const nZero = q('[data-zero]');
  const nTog = q('[data-tog]');

  nTitCola.textContent = String(titulo).replace(/^.*—\s*/, '');
  if (!nTitCola.textContent) nTitCola.textContent = titulo;

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

  function logActivity(a) {
    if (!a) return null;
    const act = {
      seq: a.seq, verb: a.verb, mode: a.mode === 'mock' ? 'mock' : 'real',
      note: a.note ?? null, fx: a.fx ?? null, prev: a.prev ?? null,
      digest: a.digest ?? null
    };
    S.ledger.push(act);
    if (aplicarFx && act.fx) aplicar(act.fx);

    const dg = act.digest
      ? ' <span class="dg">#' + esc(String(act.digest).slice(0, 10)) + '</span>' : '';
    const nota = act.note
      ? ' <span class="nota">· ' + esc(act.note) + '</span>' : '';
    const p = linea('act', '  ├─ activity ' + esc(act.verb) + ' ' + chip(act.mode) + dg + nota);

    filaEvidencia(act);
    return p;
  }

  function filaEvidencia(act) {
    const vacio = nEvid.querySelector('.vacio');
    if (vacio) vacio.remove();
    const f = el('div', 'fila');
    f.title = JSON.stringify(act, null, 1);
    f.innerHTML =
      '<span class="seq">' + esc(act.seq ?? S.ledger.length) + '</span>' +
      '<span class="vb">' + esc(act.verb) + ' ' + chip(act.mode) + '</span>' +
      '<span class="dg">#' + esc(String(act.digest || '').slice(0, 10)) + '</span>';
    nEvid.appendChild(f);
    nEvid.scrollTop = nEvid.scrollHeight;
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
    nTurno.textContent = String(S.turno);
  }

  function setStep(n) {
    const v = Math.max(0, Math.min(pasos.length, Number(n) || 0));
    S.paso = v;
    nPaso.textContent = String(v);
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
    const url = URL.createObjectURL(new Blob([nd + (nd ? '\n' : '')],
      { type: 'application/x-ndjson' }));
    const a = Object.assign(el('a'), { href: url, download: nombre });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
    if (ledger) { S.ledger.length = 0; nEvid.innerHTML = ''; vacioEvidencia(); }
  }

  function vacioEvidencia() {
    if (!nEvid.childElementCount) {
      nEvid.appendChild(el('div', 'vacio', 'sin actividades selladas todavía'));
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
  };

  document.addEventListener('keydown', teclado);
  nSay.addEventListener('keydown', enter);
  nDl.addEventListener('click', clickDl);
  nRec.addEventListener('click', clickRec);
  nZero.addEventListener('click', clickZero);
  nTog.addEventListener('click', clickTog);

  if (typeof onSay === 'function') nSayRow.hidden = false;
  habilitarRecuperar(false);

  function dispose() {
    document.removeEventListener('keydown', teclado);
    nSay.removeEventListener('keydown', enter);
    nDl.removeEventListener('click', clickDl);
    nRec.removeEventListener('click', clickRec);
    nZero.removeEventListener('click', clickZero);
    nTog.removeEventListener('click', clickTog);
    ui.remove();
  }

  /* ── primer pintado ── */
  pintarPasos();
  pintarUnidades();
  pintarLeases();
  vacioEvidencia();
  setStep(0);
  setTurn(0);

  return {
    /* contrato */
    logH, logM, logSys, logActivity,
    setOptions, setStep, setTurn, setUnits, setLeases, badge,
    /* extras */
    root: ui, estado: S,
    logMal, divisor, sello, sellar,
    setUniverso, setCerrada, habilitarRecuperar,
    transcriptNdjson, descargar, limpiar, dispose
  };
}

export default createPaneles;
