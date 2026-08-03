/**
 * ceremonia/domain.mjs — el guion determinista de la «Prueba de H·M» (El Descenso).
 *
 * Lógica pura y portable: sin three, sin DOM, sin dependencias. Sólo usa
 * `crypto.subtle` cuando existe, con respaldo FNV-1a si no hay secure context.
 *
 * Voces:  H decide · M nunca ordena ni se concede nada · denegar deja cero
 *         estado parcial (fallo atómico). Todo queda sellado en una cadena
 *         de digests donde cada Activity enlaza el digest anterior.
 */

/* ── datos del escenario ──────────────────────────────────────────────── */

/** Los 11 pasos bloqueantes de la ceremonia `barrio-lore-v1`. */
export const PASOS = Object.freeze([
  'preflight · identidad H·M',
  'room y autoridad',
  'leases',
  'inflación',
  'manifiesto y despliegue',
  'ingesta Onfalo + análisis',
  'vector',
  'dos líneas',
  'grafo',
  'universos',
  'cortos · trace · cierre'
]);

/** Las 10 unidades declaradas del barrio LORE. */
export const UNIDADES = Object.freeze([
  'loreador', 'bartleby', 'archivero', 'vector-mock', 'grafista',
  'demiurgo', 'dramaturgo', 'pipeline', 'portal', 'cristalizador'
]);

/** Las únicas dos unidades que exigen `pod.lease` para materializarse. */
export const UNIDADES_CON_LEASE = Object.freeze(['bartleby', 'cristalizador']);

/**
 * Traduce el tipestate del playground (8 estados) al cuerpo del barrio 3D
 * que espera `barrio.setUnitState(unitId, estado, causa?)`.
 *
 * @param {string} estado tipestate del dominio
 * @returns {{estado:string, causa?:string}}
 */
export function estadoCuerpo(estado) {
  switch (estado) {
    case 'arrendada':
    case 'materializada': return { estado: 'arrendada' };
    case 'lista':         return { estado: 'lista' };
    case 'corriendo':     return { estado: 'corriendo' };
    case 'detenida':      return { estado: 'halted', causa: 'orden' };
    case 'fallida':       return { estado: 'halted', causa: 'fallo' };
    case 'recuperando':   return { estado: 'recovering' };
    default:              return { estado: 'declarada' };
  }
}

/* ── sellos: SHA-256 real, FNV-1a de repuesto ─────────────────────────── */

const CODIFICADOR = typeof TextEncoder === 'function' ? new TextEncoder() : null;

/** Respaldo honesto sin secure context: FNV-1a en 8 carriles → 64 hex. */
function fnv1aHex64(texto) {
  let salida = '';
  for (let carril = 0; carril < 8; carril++) {
    let h = (0x811c9dc5 ^ Math.imul(carril + 1, 0x9e3779b9)) >>> 0;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    salida += h.toString(16).padStart(8, '0');
  }
  return salida;
}

function subtleDisponible() {
  const g = globalThis;
  return !!(g.crypto && g.crypto.subtle && CODIFICADOR);
}

async function sha256Hex(texto) {
  if (subtleDisponible()) {
    try {
      const buf = await globalThis.crypto.subtle.digest(
        'SHA-256', CODIFICADOR.encode(texto)
      );
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      /* contexto no seguro: cae al respaldo declarado */
    }
  }
  return fnv1aHex64(texto);
}

/* ── utilidades ───────────────────────────────────────────────────────── */

const nada = () => {};

const normaliza = (s) => String(s == null ? '' : s)
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{M}/gu, '')   // fuera diacríticos: «continúa» ≡ «continua»
  .trim();

const espera = (ms) => (ms > 0
  ? new Promise((r) => setTimeout(r, ms))
  : Promise.resolve());

function reduccionDeMovimiento() {
  try {
    return !!(globalThis.matchMedia
      && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

/* ── la ceremonia ─────────────────────────────────────────────────────── */

/**
 * Crea una ceremonia bilateral con su guion determinista completo.
 *
 * @param {object} [opciones]
 * @param {(texto:string)=>void}            [opciones.onH]        voz de H
 * @param {(texto:string)=>void}            [opciones.onM]        voz de M
 * @param {(a:object)=>void}                [opciones.onActivity] Activity sellada
 * @param {(s:object)=>void}                [opciones.onState]    instantánea de estado
 * @param {(t:string,tipo:string)=>void}    [opciones.onSys]      línea de sistema
 *        tipo ∈ 'sys' | 'error' | 'divider' | 'sello'
 * @param {(opts:Array)=>void}              [opciones.onOptions]  turno de H
 * @param {boolean} [opciones.autoStart=true] ofrece la primera opción al crearse
 * @param {number}  [opciones.ritmo=70]       ms entre líneas al releer la cadena
 */
export function createCeremonia({
  onH = nada,
  onM = nada,
  onActivity = nada,
  onState = nada,
  onSys = nada,
  onOptions = nada,
  autoStart = true,
  ritmo = 70
} = {}) {

  const cadencia = reduccionDeMovimiento() ? 0 : Math.max(0, Number(ritmo) || 0);

  /* ── estado vivo ────────────────────────────────────────────────── */
  const S = {
    turno: 0,
    paso: 0,
    seq: 0,
    prev: 'genesis',
    cerrado: false,
    recuperado: false,
    recuperando: false,
    arrancada: false,
    universo: null,
    sello: subtleDisponible() ? 'sha-256' : 'fnv-1a·respaldo',
    unidades: Object.fromEntries(UNIDADES.map((u) => [u, 'declarada'])),
    sim: Object.fromEntries(UNIDADES.map((u) => [u, false])),
    leases: Object.fromEntries(UNIDADES_CON_LEASE.map((u) => [u, '—'])),
    ledger: []
  };

  let ofrecidas = [];   // [{ label, match, go }]
  let ocupada = false;  // un beat en vuelo: el turno de H está cerrado
  let avisadoRespaldo = false;

  /* ── instantánea ────────────────────────────────────────────────── */
  function instantanea() {
    return {
      turno: S.turno,
      paso: S.paso,
      pasos: PASOS,
      seq: S.seq,
      prev: S.prev,
      digestRaiz: S.ledger.length ? S.ledger[S.ledger.length - 1].digest : null,
      cerrado: S.cerrado,
      recuperado: S.recuperado,
      recuperando: S.recuperando,
      arrancada: S.arrancada,
      puedeRecuperar: S.cerrado && !S.recuperado,
      universo: S.universo,
      sello: S.sello,
      unidades: { ...S.unidades },
      sim: { ...S.sim },
      leases: { ...S.leases },
      opciones: opcionesPublicas(),
      actividades: S.ledger.length
    };
  }

  const emiteEstado = () => { onState(instantanea()); };

  /* ── voces ──────────────────────────────────────────────────────── */
  function vozH(texto) {
    S.turno += 1;
    onH(texto);
    emiteEstado();
  }
  const vozM = (texto) => { onM(texto); };
  const sistema = (texto, tipo = 'sys') => { onSys(texto, tipo); };

  /* ── efectos ────────────────────────────────────────────────────── */
  function aplicarFx(fx) {
    if (!fx) return;
    if (fx.units) {
      for (const [u, st] of Object.entries(fx.units)) S.unidades[u] = st;
    }
    if (fx.sim) for (const u of fx.sim) S.sim[u] = true;
    if (fx.leases) {
      for (const [u, st] of Object.entries(fx.leases)) S.leases[u] = st;
    }
    if (fx.step !== undefined && fx.step > S.paso) S.paso = fx.step;
    if (fx.universe) S.universo = fx.universe;
  }

  /* ── cadena de evidencia ────────────────────────────────────────── */
  async function act(verb, mode, note, fx) {
    const wire = {
      seq: S.seq + 1,
      verb,
      mode,
      note: note || null,
      fx: fx || null,
      prev: S.prev
    };
    const digest = await sha256Hex(JSON.stringify(wire));

    S.seq = wire.seq;
    S.prev = digest;
    S.ledger.push({ wire, digest });
    aplicarFx(fx);

    if (S.sello !== 'sha-256' && !avisadoRespaldo) {
      avisadoRespaldo = true;
      sistema('sin secure context: los sellos usan el respaldo FNV-1a declarado.', 'sys');
    }

    const activity = { ...wire, digest };
    onActivity(activity);
    emiteEstado();
    return activity;
  }

  /** Relee el ledger y recomputa cada digest: nadie se cree de memoria. */
  async function verificaCadena() {
    let prev = 'genesis';
    let ok = 0;
    let rupturas = 0;
    for (const e of S.ledger) {
      const d = await sha256Hex(JSON.stringify(e.wire));
      if (d === e.digest && e.wire.prev === prev) ok += 1;
      else rupturas += 1;
      prev = e.digest;
    }
    return { ok, rupturas, total: S.ledger.length, intacta: rupturas === 0 };
  }

  /* ── turno de H ─────────────────────────────────────────────────── */
  function opcionesPublicas() {
    return ofrecidas.map((o, i) => ({ n: i + 1, label: o.label }));
  }

  function ofrece(opts) {
    ofrecidas = Array.isArray(opts) ? opts : [];
    const publicas = opcionesPublicas();
    onOptions(publicas);
    emiteEstado();
    return publicas;
  }

  async function elige(opcion) {
    ocupada = true;
    ofrece([]);              // el turno se cierra mientras el beat está en vuelo
    vozH(opcion.label);
    try {
      await opcion.go();
    } finally {
      ocupada = false;
    }
  }

  /* ── beats del guion ────────────────────────────────────────────── */
  const B = {};

  B.abrir = async () => {
    await act('room.open', 'mock', 'sala barrio-lore', { step: 2 });
    await act('peer.join', 'mock', 'H · anfitrión', null);
    await act('peer.join', 'mock', 'M · operador FM', { step: 2 });
    vozM('Estamos en simulacro. La sala y las identidades son mock declarado; '
      + 'tus decisiones y las leases serán reales. Puedo inspeccionar o '
      + 'solicitar la inflación.');
    ofrece([
      { label: 'Inspecciona primero.', match: ['inspecciona', 'inspeccion'], go: B.inspeccion },
      { label: 'Prepara Bartleby y Cristalizador.', match: ['prepara', 'infla'], go: B.solicitud }
    ]);
  };

  B.inspeccion = async () => {
    await act('unit.list', 'real', 'consulta RO', null);
    vozM('Diez unidades declaradas. Bartleby y Cristalizador requieren lease '
      + 'para materializarse; el resto opera vía máquina, simulada. Ninguna '
      + 'frase mía ejecuta efectos ocultos.');
    ofrece([
      { label: 'Prepara esas dos unidades.', match: ['prepara', 'dos unidades', 'infla'], go: B.solicitud }
    ]);
  };

  B.solicitud = async () => {
    await act('lease.request', 'real', 'pod/bartleby', { leases: { bartleby: 'pendiente' }, step: 3 });
    await act('lease.request', 'real', 'pod/cristalizador', { leases: { cristalizador: 'pendiente' } });
    vozM('Solicito unit.inflate para Bartleby y Cristalizador. Requiere '
      + 'pod.lease sobre sus pods. La ceremonia espera tu concesión — yo no '
      + 'puedo concederme nada.');
    ofrece([
      { label: 'Concedo los leases.', match: ['concedo', 'concede', 'grant', 'si'], go: B.grant },
      { label: 'Deniego.', match: ['deniego', 'deniega', 'deny', 'no'], go: B.deny }
    ]);
  };

  B.deny = async () => {
    await act('lease.deny', 'real', 'pod/bartleby', { leases: { bartleby: 'denegada' } });
    await act('lease.deny', 'real', 'pod/cristalizador', { leases: { cristalizador: 'denegada' } });
    vozM('Denegado. Fallo atómico: cero estado parcial. Bartleby y '
      + 'Cristalizador siguen declaradas; ninguna Activity de inflación '
      + 'existe. El transcript registra la denegación, no un intento a medias.');
    ofrece([
      { label: 'Vuelve a solicitarlo.', match: ['vuelve', 'solicita', 'otra vez'], go: B.solicitud },
      { label: 'Cierra la sesión.', match: ['cierra'], go: B.cierreVacio }
    ]);
  };

  B.cierreVacio = async () => {
    await act('room.close', 'mock', 'sesión sin efectos', null);
    vozM('Sesión cerrada sin efectos. La evidencia demuestra lo que no '
      + 'ocurrió: ésa es la mitad del valor de la ceremonia.');
    trasCerrar();
  };

  B.grant = async () => {
    await act('lease.grant', 'real', 'pod/bartleby', { leases: { bartleby: 'concedida' }, units: { bartleby: 'arrendada' } });
    await act('lease.grant', 'real', 'pod/cristalizador', { leases: { cristalizador: 'concedida' }, units: { cristalizador: 'arrendada' } });
    await act('unit.inflate', 'real', 'bartleby', { units: { bartleby: 'materializada' }, step: 4 });
    await act('unit.inflate', 'real', 'cristalizador', { units: { cristalizador: 'materializada' } });
    await act('unit.ready', 'real', 'bartleby · cristalizador', { units: { bartleby: 'lista', cristalizador: 'lista' } });
    vozM('Leases válidas. Unidades materializadas y listas. Tipestate '
      + 'recorrido: declarada → arrendada → materializada → lista. Toda '
      + 'transición ilegal es inexpresable, no solo prohibida.');
    ofrece([
      { label: 'Despliega la máquina y analiza Onfalo.', match: ['despliega', 'analiza', 'onfalo'], go: B.despliegue }
    ]);
  };

  B.despliegue = async () => {
    await act('machine.deploy', 'mock', 'manifiesto declarado', { step: 5 });
    await act('document.ingest', 'mock', 'Onfalo · pieza 1/2', { sim: ['loreador', 'archivero'], step: 6 });
    await act('document.ingest', 'mock', 'Onfalo · pieza 2/2', null);
    await act('document.analyze', 'mock', 'bartleby → 10 secciones', { units: { bartleby: 'corriendo' } });
    await act('unit.idle', 'real', 'bartleby', { units: { bartleby: 'lista' } });
    vozM('Despliegue mock declarado. Dos piezas de Onfalo ingeridas; Bartleby '
      + 'produjo diez secciones de análisis. Cada paso quedó sellado en el '
      + 'ledger con su digest.');
    ofrece([
      { label: 'Continúa hasta el grafo.', match: ['continua', 'grafo'], go: B.grafo }
    ]);
  };

  B.grafo = async () => {
    await act('vector.create', 'mock', 'VectorMock', { sim: ['vector-mock'], step: 7 });
    await act('line.materialize', 'real', 'línea 1/2', { step: 8 });
    await act('line.materialize', 'real', 'línea 2/2', null);
    await act('graph.bifurcate', 'real', '2 ramas candidatas', { sim: ['grafista'], step: 9 });
    vozM('VectorMock creado, dos líneas validadas y grafo bifurcado. Hay dos '
      + 'ramas candidatas esperando tu elección.');
    ofrece([
      { label: 'Muéstrame las alternativas.', match: ['alternativas', 'muestrame'], go: B.alternativas }
    ]);
  };

  B.alternativas = async () => {
    await act('graph.inspect', 'real', 'consulta RO', null);
    vozM('Alpha prioriza consejos. Beta prioriza partido. ¿Cuál '
      + 'inspeccionamos? La elección es tuya y es real: quedará en la cadena '
      + 'causal.');
    ofrece([
      { label: 'Alpha.', match: ['alpha', 'alfa'], go: () => B.universo('Alpha') },
      { label: 'Beta.', match: ['beta'], go: () => B.universo('Beta') }
    ]);
  };

  B.universo = async (cual) => {
    await act('universe.instantiate', 'real', 'universo ' + cual, { universe: cual, sim: ['demiurgo'], step: 10 });
    await act('corto.emit', 'real', 'corto #1 desde ' + cual, { sim: ['dramaturgo', 'pipeline'], step: 11 });
    vozM('Universo ' + cual + ' instanciado. Corto emitido desde ' + cual
      + '. Puedo mostrar datos, trazabilidad o cobertura.');
    ofrece([
      { label: 'Datos.', match: ['datos'], go: B.datos },
      { label: 'Cobertura.', match: ['cobertura'], go: B.cobertura },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  B.datos = async () => {
    await act('corto.data', 'real', 'consulta RO', null);
    vozM('Corto #1 · fuente: grafo bifurcado, rama ' + S.universo
      + ' · derivado de dos líneas canónicas · procedencia intacta hasta Onfalo.');
    ofrece([
      { label: 'Cobertura.', match: ['cobertura'], go: B.cobertura },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  B.cobertura = async () => {
    await act('chain.coverage', 'real', 'consulta RO', null);
    vozM('Cobertura: 11/11 pasos con Activity sellada; 0 huecos en la cadena '
      + 'causal; toda decisión con autoridad tiene su lease.');
    ofrece([
      { label: 'Datos.', match: ['datos'], go: B.datos },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  B.cierre = async () => {
    const n = S.ledger.length;
    const v = await verificaCadena();
    await act('chain.verify', 'real',
      (v.intacta ? '✓ ' : '✗ ') + n + ' actividades, ' + v.rupturas + ' rupturas', null);
    await act('unit.stop', 'real', 'bartleby · cristalizador', { units: { bartleby: 'detenida', cristalizador: 'detenida' } });
    await act('lease.revoke', 'real', 'pod/bartleby', { leases: { bartleby: 'revocada' } });
    await act('lease.revoke', 'real', 'pod/cristalizador', { leases: { cristalizador: 'revocada' } });
    await act('room.close', 'mock', 'ceremonia completa', null);
    vozM('Cadena verificada hasta Onfalo (' + n + ' actividades, '
      + v.rupturas + ' rupturas). Unidades detenidas y leases revocadas. '
      + 'Ceremonia cerrada.');
    sistema('⟐ sello de ceremonia · digest raíz #' + S.prev.slice(0, 16), 'sello');
    trasCerrar();
  };

  function trasCerrar() {
    S.cerrado = true;
    ofrece([]);
  }

  /* ── restart → recupera ─────────────────────────────────────────── */
  async function restartRecover() {
    if (!S.cerrado) {
      sistema('la ceremonia sigue abierta: no hay nada que recuperar todavía.', 'error');
      return;
    }
    if (S.recuperando) return;

    S.recuperando = true;
    sistema('── restart ──────────────────────────────', 'divider');
    sistema('reinicio: estado en memoria descartado.', 'sys');

    S.paso = 0;
    S.cerrado = false;
    S.universo = null;
    S.unidades = Object.fromEntries(UNIDADES.map((u) => [u, 'declarada']));
    S.sim = Object.fromEntries(UNIDADES.map((u) => [u, false]));
    S.leases = Object.fromEntries(UNIDADES_CON_LEASE.map((u) => [u, '—']));
    emiteEstado();

    await espera(cadencia * 2);
    sistema('leyendo transcript.ndjson · ' + S.ledger.length + ' líneas…', 'sys');

    let prev = 'genesis';
    let ok = 0;
    for (const e of S.ledger) {
      const d = await sha256Hex(JSON.stringify(e.wire));
      if (d === e.digest && e.wire.prev === prev) ok += 1;
      prev = e.digest;
      aplicarFx(e.wire.fx);
      emiteEstado();
      if (cadencia) await espera(cadencia);
    }

    S.cerrado = true;
    S.recuperando = false;
    S.recuperado = true;
    emiteEstado();

    sistema('verificando cadena de digests… ✓ ' + ok + '/' + S.ledger.length, 'sys');
    sistema('estado recuperado desde evidencia, no desde memoria.', 'sys');
    vozM('He vuelto. No recuerdo nada — lo he releído todo, y la cadena '
      + 'responde por mí.');
  }

  /* ── API pública ────────────────────────────────────────────────── */

  /** Arranca la ceremonia: sala en simulacro y primera opción de H. */
  function start() {
    if (S.arrancada) return opcionesPublicas();
    S.arrancada = true;
    sistema('sala barrio-lore en simulacro · 10 unidades declaradas · esperando a H', 'sys');
    return ofrece([
      { label: 'M, abre el barrio LORE.', match: ['abre', 'barrio'], go: B.abrir }
    ]);
  }

  /** @returns {Array<{n:number,label:string}>} el turno de H, ahora mismo. */
  function options() {
    return opcionesPublicas();
  }

  /**
   * H elige por número (1..n) — o por etiqueta exacta, si es más cómodo.
   * @returns {Promise<void>}
   */
  async function pick(n) {
    if (ocupada || !ofrecidas.length) return;
    let opcion = null;
    if (typeof n === 'number' && Number.isFinite(n)) {
      opcion = ofrecidas[Math.trunc(n) - 1] || null;
    } else if (typeof n === 'string') {
      const t = normaliza(n);
      opcion = ofrecidas.find((o) => normaliza(o.label) === t) || null;
    }
    if (!opcion) return;
    await elige(opcion);
  }

  /**
   * H habla en la gramática cerrada. Si la frase no compila, M lo dice y el
   * turno sigue abierto: nada se ejecuta a medias.
   * @returns {Promise<void>}
   */
  async function say(texto) {
    const crudo = String(texto == null ? '' : texto);
    if (!crudo.trim() || ocupada) return;
    if (!ofrecidas.length) return;
    const t = normaliza(crudo);
    const hit = ofrecidas.find(
      (o) => o.match && o.match.some((m) => t.includes(m))
    );
    if (hit) {
      await elige(hit);
      return;
    }
    sistema('H> ' + crudo + '   ⌀ no compila', 'error');
    vozM('Esa frase no está en la gramática cerrada. Puedo aceptar: '
      + ofrecidas.map((o) => '«' + o.label + '»').join(' · ') + '.');
  }

  /** El wire sellado, una Activity por línea. */
  function transcriptNdjson() {
    return S.ledger
      .map((e) => JSON.stringify({ ...e.wire, digest: e.digest }))
      .join('\n');
  }

  const api = {
    start,
    options,
    say,
    pick,
    transcriptNdjson,
    restartRecover,
    verifyChain: verificaCadena
  };

  Object.defineProperty(api, 'state', { get: instantanea, enumerable: true });

  if (autoStart) queueMicrotask(start);

  return api;
}
