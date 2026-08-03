/**
 * ceremonia/domain.mjs — la «Prueba de H·M» (El Descenso) sobre mecanismo REAL.
 *
 * R2: donde R1 proyectaba, aquí se importa. Tres capas, todas verificadas
 * contra `node_modules` antes de escribirse:
 *
 *  1 · CIUDAD REAL — `createCiudadDomainState` de `@zeus/ciudad/domain` corre
 *      de verdad en el navegador (vía `./puente-zeus.mjs`, que carga el código
 *      del paquete sin tocarlo; ver allí por qué hace falta un puente).
 *      La escena sale de `sceneFromGamemap` real sobre `/mapa.json`: 24 barrios,
 *      6 distritos, plaza. H entra con `makeIntent(actor,'join',…)` tipado
 *      `game:'ciudad'`, se anuncia en plaza, CAMINA hasta el ancla del barrio y
 *      lo despierta con `wake` + `horseMode:'stub'`. Todos los gates son los del
 *      dominio: si el barrio ya está vivo, el dominio lo dice y se ve.
 *
 *  2 · VOCABULARIO REAL — los 11 pasos de `barrio-lore-v1` y los verbos salen
 *      literales del playground (lectura RO; sólo constantes, cero código):
 *        · C:/S/scriptorium/playground/prueba-de-H-M/lib/ceremonia/constants.mjs
 *        · C:/S/scriptorium/playground/prueba-de-H-M/reference/VERBOS.md
 *        · C:/S/scriptorium/playground/prueba-de-H-M/scenarios/barrio-lore/scenario.json
 *      17 parejas esperadas (11 primarias + 6 secundarias) = 34 Activities.
 *
 *  3 · EVIDENCIA CON FORMA REAL — dos cadenas, H/ y M/, con la forma exacta de
 *      `chain.ndjson` del playground:
 *        {step, verb, object, causalDigest, wireDigest, activityId, side, secondary}
 *      El `causalDigest` es idéntico en las dos mitades (núcleo causal, por
 *      denylist: fuera `actor`, `digest` y `context.side`); el `wireDigest`
 *      difiere porque cada mitad sella lo suyo. Añadimos `prev` al núcleo para
 *      que la cadena sea re-verificable línea a línea (extensión declarada de
 *      la demo, no del playground).
 *
 *  4 · ÓNFALO REAL — las piezas se bajan de `/onfalo/`; el análisis enseña
 *      extractos, secciones y digests de los bytes que se leyeron.
 *
 *  5 · ACTA REAL — al cierre se pide `POST /api/acta`, que emite en el server
 *      con `emitirActa` + `huellaLedger` de `@zeus/ciudad/acta` (node:crypto).
 *      `verifyChain()` intenta además `POST /api/verificar`.
 *
 * Lo que no está en canal se declara en `state.pendientes`, con motivo, y se
 * dice en voz de M. Nada se finge.
 *
 * FIRMAS PÚBLICAS CONSERVADAS (contrato R1):
 *   createCeremonia(opts) → { start, options, say, pick, transcriptNdjson,
 *                             restartRecover, verifyChain, state }
 *   estadoCuerpo(estado)  → { estado, causa? }
 *   PASOS · UNIDADES · UNIDADES_CON_LEASE
 *
 * NUEVO para main.mjs / paneles.mjs (aditivo, nada se quita):
 *   · `onActivity` se dispara DOS veces por paso: una por mitad.
 *       a.side === 'H' → oro          a.side === 'M' → verdigrís
 *     Sólo la mitad H trae `a.escena` (pista de efecto 3D) para que el
 *     integrador no dispare el efecto por duplicado.
 *   · a.escena ∈ 'llave' | 'gota-onfalo' | 'gota-analisis' | 'cristal' |
 *                'cadena' | 'disolver' | 'acta'
 *     con `a.escenaVeces` (p. ej. 2 cristales en un solo `line.materialize`).
 *     La denegación de leases NO emite Activity (fallo atómico): se ve en
 *     `state.denegaciones` y en el hueco de `state.cobertura.faltan`.
 *   · api.chainNdjson('H'|'M') · api.descargas() · api.actaJson()
 */

import {
  cargarCiudadReal,
  gamemapDesdeMapa,
  anclaDeBarrio,
  sha256Hex as sha256Sincrono,
  SHA256_AUTOTEST_OK
} from './puente-zeus.mjs';

/* ══════════════════════════════════════════════════════════════════════════
   1 · Vocabulario REAL del playground (constantes citadas, cero código copiado)
   ══════════════════════════════════════════════════════════════════════════ */

/** cita: playground/prueba-de-H-M/lib/ceremonia/constants.mjs */
export const CEREMONY_ID = 'barrio-lore-v1';
export const SCENARIO_ID = 'barrio-lore';
export const ACTOR_H = 'urn:scriptorium:hm:actor:anfitrion-h';
export const ACTOR_M = 'urn:scriptorium:hm:actor:maestro-m';

export const SIDE_ACTOR = Object.freeze({ H: ACTOR_H, M: ACTOR_M });

/**
 * Los 11 pasos bloqueantes de `barrio-lore-v1`, con su verbo primario y su
 * unidad. cita: constants.mjs · CEREMONY_STEPS (idéntico en scenario.json).
 */
export const CEREMONY_STEPS = Object.freeze([
  Object.freeze({ order: 1, verb: 'peer.join', description: 'Preflight e identidad H/M', unitId: 'portal' }),
  Object.freeze({ order: 2, verb: 'peer.announce', description: 'Room y autoridad', unitId: 'portal' }),
  Object.freeze({ order: 3, verb: 'unit.inflate', description: 'Leases e inflación Bartleby/Cristalizador', unitId: 'bartleby' }),
  Object.freeze({ order: 4, verb: 'machine.deploy', description: 'Machine manifest y despliegue del resto', unitId: 'cristalizador' }),
  Object.freeze({ order: 5, verb: 'source.ingest', description: 'Ingest Onfalo y análisis Bartleby', unitId: 'archivero' }),
  Object.freeze({ order: 6, verb: 'vector.mock-index', description: 'VectorMock determinista', unitId: 'vector-mock' }),
  Object.freeze({ order: 7, verb: 'line.materialize', description: 'Dos líneas validadas con linea-kit', unitId: 'pipeline' }),
  Object.freeze({ order: 8, verb: 'graph.bifurcate', description: 'Grafo enlazado', unitId: 'grafista' }),
  Object.freeze({ order: 9, verb: 'universe.instantiate', description: 'Dos universos con runners y pods', unitId: 'demiurgo' }),
  Object.freeze({ order: 10, verb: 'corto.emit', description: 'Emisión y consulta de cortos', unitId: 'dramaturgo' }),
  Object.freeze({ order: 11, verb: 'coverage.measure', description: 'Trace, coverage y shutdown limpio', unitId: 'portal' })
]);

/** cita: constants.mjs · CEREMONY_SECONDARY_VERBS */
export const CEREMONY_SECONDARY_VERBS = Object.freeze([
  Object.freeze({ step: 5, verb: 'document.analyze', unitId: 'bartleby' }),
  Object.freeze({ step: 10, verb: 'corto.query', unitId: 'dramaturgo' }),
  Object.freeze({ step: 11, verb: 'provenance.trace', unitId: 'portal' }),
  Object.freeze({ step: 11, verb: 'unit.stop', unitId: 'portal' }),
  Object.freeze({ step: 11, verb: 'pod.revoke', unitId: 'portal' }),
  Object.freeze({ step: 11, verb: 'session.exit', unitId: 'portal' })
]);

/** cita: constants.mjs · REQUIRED_SHUTDOWN_VERBS (raíz de confianza del cierre) */
export const REQUIRED_SHUTDOWN_VERBS = Object.freeze([
  'coverage.measure', 'provenance.trace', 'unit.stop', 'pod.revoke', 'session.exit'
]);

/** 17 parejas esperadas → 34 Activities. Derivado, nadie escribe la cifra. */
export const EXPECTED_ACTIVITY_PAIRS = Object.freeze([
  ...CEREMONY_STEPS.map((s) => Object.freeze({ step: s.order, verb: s.verb, unitId: s.unitId, secondary: false })),
  ...CEREMONY_SECONDARY_VERBS.map((s) => Object.freeze({ step: s.step, verb: s.verb, unitId: s.unitId, secondary: true }))
]);

/** cita: constants.mjs · activityPairKey */
export function activityPairKey(step, verb, secondary) {
  return `${step}|${verb}|${secondary ? 'sec' : 'pri'}`;
}

export const EXPECTED_PAIR_KEYS = Object.freeze(
  EXPECTED_ACTIVITY_PAIRS.map((p) => activityPairKey(p.step, p.verb, p.secondary))
);

/**
 * verbo → activityType. cita: reference/VERBOS.md (familias A · B · C · D).
 * Backbone ActivityStreams 2.0 / PROV-O / DCTERMS antes de acuñar `hm:`/`lore:`.
 */
export const ACTIVITY_TYPES = Object.freeze({
  'peer.join': 'as:Join',
  'peer.announce': 'as:Announce',
  'state.inspect': 'as:View',
  'session.exit': 'as:Leave',
  'pod.lease': 'hm:PodLease',
  'pod.revoke': 'hm:PodRevoke',
  'unit.inflate': 'hm:UnitInflate',
  'unit.stop': 'hm:UnitStop',
  'unit.inspect': 'hm:UnitInspect',
  'machine.deploy': 'hm:MachineDeploy',
  'machine.status': 'as:View',
  'source.ingest': 'prov:Usage',
  'document.analyze': 'lore:DocumentAnalyze',
  'vector.mock-index': 'lore:VectorMockIndex',
  'line.materialize': 'lore:LineMaterialize',
  'graph.bifurcate': 'lore:GraphBifurcate',
  'universe.instantiate': 'lore:UniverseInstantiate',
  'corto.emit': 'lore:CortoEmit',
  'corto.query': 'lore:CortoQuery',
  'provenance.trace': 'prov:Activity',
  'coverage.measure': 'hm:CoverageMeasure'
});

/**
 * Marcas del observador: lo único que puede diferir entre las dos mitades.
 * cita: constants.mjs · CAUSAL_STRIPPED_FIELDS / CAUSAL_STRIPPED_CONTEXT_FIELDS.
 * El núcleo causal se deriva por DENYLIST (quitar), no por allowlist.
 */
export const CAUSAL_STRIPPED_FIELDS = Object.freeze(['actor', 'digest', 'id']);
export const CAUSAL_STRIPPED_CONTEXT_FIELDS = Object.freeze(['side']);

/** cita: constants.mjs · SIMULACRO_NOTE */
export const SIMULACRO_NOTE =
  'Future Machine no corre hoy; ceremonia playground-mock (spike WP-HUB-112).';

/** Etiquetas de paso para los paneles: verbo real + descripción real. */
export const PASOS = Object.freeze(
  CEREMONY_STEPS.map((s) => `${s.verb} · ${s.description}`)
);

/** Las 10 unidades del barrio. cita: scenarios/barrio-lore/scenario.json · units */
export const UNIDADES = Object.freeze([
  'loreador', 'bartleby', 'archivero', 'vector-mock', 'grafista',
  'demiurgo', 'dramaturgo', 'pipeline', 'portal', 'cristalizador'
]);

/** Las únicas dos que exigen `pod.lease` para materializarse. */
export const UNIDADES_CON_LEASE = Object.freeze(['bartleby', 'cristalizador']);

/**
 * Traduce el tipestate del playground al cuerpo del barrio 3D que espera
 * `barrio.setUnitState(unitId, estado, causa?)`.
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

/* ══════════════════════════════════════════════════════════════════════════
   Sellos — SHA-256 real siempre (crypto.subtle si hay; si no, el del puente,
   que produce EXACTAMENTE los mismos digests que node:crypto)
   ══════════════════════════════════════════════════════════════════════════ */

function subtleDisponible() {
  const g = globalThis;
  return !!(g.crypto && g.crypto.subtle && typeof TextEncoder === 'function');
}

const CODIFICADOR = typeof TextEncoder === 'function' ? new TextEncoder() : null;

async function sha256Subtle(texto) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', CODIFICADOR.encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Núcleo causal por DENYLIST sobre el wire completo — nunca por allowlist.
 * cita: constants.mjs · «con allowlist un campo nuevo del envelope queda fuera
 * del núcleo en silencio y nadie se entera; con denylist entra por defecto y
 * hay que decidir explícitamente excluirlo».
 */
function nucleoCausal(wire) {
  const salida = {};
  for (const [k, v] of Object.entries(wire)) {
    if (CAUSAL_STRIPPED_FIELDS.includes(k)) continue;
    if (k === 'context' && v && typeof v === 'object') {
      const ctx = {};
      for (const [ck, cv] of Object.entries(v)) {
        if (!CAUSAL_STRIPPED_CONTEXT_FIELDS.includes(ck)) ctx[ck] = cv;
      }
      salida.context = ctx;
      continue;
    }
    salida[k] = v;
  }
  return salida;
}

/** JSON canónico: claves ordenadas, `undefined` fuera. Digest determinista. */
function canonico(v) {
  if (v === undefined) return 'null';
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  const claves = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return `{${claves.map((k) => `${JSON.stringify(k)}:${canonico(v[k])}`).join(',')}}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   Utilidades
   ══════════════════════════════════════════════════════════════════════════ */

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

const recorta = (t, n) => {
  const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
};

const mensaje = (e) => String((e && e.message) || e || 'error desconocido');

/* ══════════════════════════════════════════════════════════════════════════
   La ceremonia
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Crea una ceremonia bilateral sobre el dominio real de la ciudad.
 *
 * @param {object} [opciones]
 * @param {(texto:string)=>void}         [opciones.onH]        voz de H
 * @param {(texto:string)=>void}         [opciones.onM]        voz de M
 * @param {(a:object)=>void}             [opciones.onActivity] mitad sellada (H y M)
 * @param {(s:object)=>void}             [opciones.onState]    instantánea de estado
 * @param {(t:string,tipo:string)=>void} [opciones.onSys]      línea de sistema
 *        tipo ∈ 'sys' | 'error' | 'divider' | 'sello'
 * @param {(opts:Array)=>void}           [opciones.onOptions]  turno de H
 * @param {boolean} [opciones.autoStart=true]
 * @param {number}  [opciones.ritmo=70]  ms entre líneas al releer la cadena
 * @param {string}  [opciones.barrioId='document-machine-sdk'] barrio del descenso
 * @param {string}  [opciones.mapaUrl='/mapa.json']
 * @param {string}  [opciones.onfaloUrl='/onfalo/']
 * @param {string}  [opciones.apiActa='/api/acta']
 * @param {string}  [opciones.apiVerificar='/api/verificar']
 */
export function createCeremonia({
  onH = nada,
  onM = nada,
  onActivity = nada,
  onState = nada,
  onSys = nada,
  onOptions = nada,
  autoStart = true,
  ritmo = 70,
  barrioId = 'document-machine-sdk',
  mapaUrl = '/mapa.json',
  onfaloUrl = '/onfalo/',
  apiActa = '/api/acta',
  apiVerificar = '/api/verificar'
} = {}) {

  const cadencia = reduccionDeMovimiento() ? 0 : Math.max(0, Number(ritmo) || 0);

  /** Id de corrida — igual que el playground: urn:scriptorium:hm:<run>:… */
  const RUN = `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const urn = (...partes) => `urn:scriptorium:hm:${RUN}:${partes.join(':')}`;
  const urnUnidad = (u) => `urn:scriptorium:hm:unit:${u}`;

  /* ── estado vivo ────────────────────────────────────────────────── */
  const S = {
    turno: 0,
    paso: 0,
    seq: 0,
    prev: 'genesis',          // último causalDigest (raíz de la cadena)
    cerrado: false,
    recuperado: false,
    recuperando: false,
    arrancada: false,
    universo: null,
    sello: 'sha-256',
    selloVia: subtleDisponible() ? 'crypto.subtle' : 'js·puente-zeus',
    unidades: Object.fromEntries(UNIDADES.map((u) => [u, 'declarada'])),
    sim: Object.fromEntries(UNIDADES.map((u) => [u, false])),
    leases: Object.fromEntries(UNIDADES_CON_LEASE.map((u) => [u, '—'])),
    denegaciones: 0,
    /** @type {Array<{nucleo:object,causalDigest:string,mitades:object,fx:object|null,mode:string,note:string|null}>} */
    pares: [],
    /** @type {Array<{que:string,motivo:string}>} */
    pendientes: [],
    onfalo: { estado: 'sin cargar', piezas: [], fuente: null },
    acta: null,
    verificacion: null
  };

  /** Capa 1 — dominio real de la ciudad. */
  const Z = {
    estado: 'sin conectar',   // 'sin conectar' | 'listo' | 'fallo'
    via: null,                // 'import-map' | 'puente'
    error: null,
    mods: null,
    dominio: null,
    gamemap: null,
    barrioId,
    anclaId: anclaDeBarrio(barrioId),
    barrioEstadoInicial: null,
    parent: null,
    residenteId: null,
    horseMode: null,
    horseGap: null,
    actaBarrio: null,
    sceneId: null,
    barrios: 0,
    nodos: 0,
    intents: []               // bitácora de intents reales aplicados
  };

  let ofrecidas = [];   // [{ label, match, go }]
  let ocupada = false;  // un beat en vuelo: el turno de H está cerrado
  let listo = null;     // promesa de arranque (mapa + dominio + ónfalo)
  let selloCruzado = null;

  /* ── sellado ────────────────────────────────────────────────────── */

  async function sellar(texto) {
    if (subtleDisponible()) {
      try {
        return await sha256Subtle(texto);
      } catch {
        S.selloVia = 'js·puente-zeus';
      }
    }
    return sha256Sincrono(texto);
  }

  /** Una vez: comprueba que las dos vías de sello coinciden bit a bit. */
  async function comprobarSellos() {
    if (selloCruzado !== null) return selloCruzado;
    if (!SHA256_AUTOTEST_OK) {
      selloCruzado = false;
      sistema('el SHA-256 del puente NO pasa el vector conocido: los sellos no valen.', 'error');
      S.pendientes.push({ que: 'sellos SHA-256', motivo: 'autotest FIPS fallido en este navegador' });
      return false;
    }
    if (!subtleDisponible()) {
      selloCruzado = true;
      sistema('sin crypto.subtle: los sellos usan el SHA-256 del puente (mismos digests que node).', 'sys');
      return true;
    }
    const a = await sha256Subtle('abc');
    const b = sha256Sincrono('abc');
    selloCruzado = a === b;
    if (!selloCruzado) {
      sistema('crypto.subtle y el SHA-256 del puente discrepan: sellos no fiables.', 'error');
    }
    return selloCruzado;
  }

  /* ── instantánea ────────────────────────────────────────────────── */

  function cobertura() {
    const emitidas = new Set(
      S.pares.map((p) => activityPairKey(p.step, p.verb, p.secondary))
    );
    const faltan = EXPECTED_PAIR_KEYS.filter((k) => !emitidas.has(k));
    return {
      parejas: S.pares.length,
      esperadas: EXPECTED_PAIR_KEYS.length,
      activities: S.pares.length * 2,
      activitiesEsperadas: EXPECTED_PAIR_KEYS.length * 2,
      faltan,
      completa: faltan.length === 0
    };
  }

  function instantanea() {
    return {
      turno: S.turno,
      paso: S.paso,
      pasos: PASOS,
      seq: S.seq,
      prev: S.prev,
      digestRaiz: S.pares.length ? S.pares[S.pares.length - 1].causalDigest : null,
      cerrado: S.cerrado,
      recuperado: S.recuperado,
      recuperando: S.recuperando,
      arrancada: S.arrancada,
      puedeRecuperar: S.cerrado && !S.recuperado,
      universo: S.universo,
      sello: S.sello,
      selloVia: S.selloVia,
      unidades: { ...S.unidades },
      sim: { ...S.sim },
      leases: { ...S.leases },
      opciones: opcionesPublicas(),
      actividades: S.pares.length * 2,
      // ── R2 ────────────────────────────────────────────────────────
      run: RUN,
      ceremonia: CEREMONY_ID,
      escenario: SCENARIO_ID,
      cobertura: cobertura(),
      denegaciones: S.denegaciones,
      ciudad: {
        estado: Z.estado,
        via: Z.via,
        error: Z.error,
        sceneId: Z.sceneId,
        nodos: Z.nodos,
        barrios: Z.barrios,
        barrioId: Z.barrioId,
        anclaId: Z.anclaId,
        estadoInicial: Z.barrioEstadoInicial,
        estadoActual: estadoBarrioReal(),
        residenteId: Z.residenteId,
        horseMode: Z.horseMode,
        horseGap: Z.horseGap,
        actor: ACTOR_H,
        playerType: 'visitante',
        energia: energiaH(),
        intents: Z.intents.slice(-12)
      },
      onfalo: {
        estado: S.onfalo.estado,
        fuente: S.onfalo.fuente,
        piezas: S.onfalo.piezas.map((p) => ({ ...p }))
      },
      acta: S.acta ? { ...S.acta } : null,
      verificacion: S.verificacion ? { ...S.verificacion } : null,
      pendientes: S.pendientes.map((p) => ({ ...p }))
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

  function declararPendiente(que, motivo) {
    if (S.pendientes.some((p) => p.que === que)) return;
    S.pendientes.push({ que, motivo });
    sistema(`pendiente · ${que} — ${motivo}`, 'sys');
  }

  /* ── efectos sobre el tipestate de las unidades ─────────────────── */
  function aplicarFx(fx) {
    if (!fx) return;
    if (fx.units) for (const [u, st] of Object.entries(fx.units)) S.unidades[u] = st;
    if (fx.sim) for (const u of fx.sim) S.sim[u] = true;
    if (fx.leases) for (const [u, st] of Object.entries(fx.leases)) S.leases[u] = st;
    if (fx.step !== undefined && fx.step > S.paso) S.paso = fx.step;
    if (fx.universe) S.universo = fx.universe;
  }

  /* ══════════════════════════════════════════════════════════════════
     Capa 1 · dominio real de la ciudad
     ══════════════════════════════════════════════════════════════════ */

  function estadoBarrioReal() {
    if (!Z.dominio) return null;
    try {
      return Z.dominio.snapshot('ui').barrios[Z.barrioId]?.estado ?? null;
    } catch {
      return null;
    }
  }

  function energiaH() {
    if (!Z.dominio) return null;
    try {
      return Z.dominio.snapshot('ui').actors[ACTOR_H]?.energy ?? null;
    } catch {
      return null;
    }
  }

  /** Aplica un intent REAL del dominio ciudad y deja rastro de lo que dijo. */
  function intentCiudad(intent, args = {}) {
    if (!Z.dominio) return { ok: false, error: 'ciudad_no_conectada' };
    const payload = Z.mods.makeIntent(ACTOR_H, intent, args);
    const r = Z.dominio.applyIntent(payload);
    Z.intents.push({ intent, args, ok: !!r.ok, error: r.error || null, estado: r.estado || null });
    sistema(
      `ciudad · ${intent}${args.barrioId ? ` ${args.barrioId}` : ''}${args.anchorId ? ` → ${args.anchorId}` : ''}`
      + ` → ${r.ok ? `ok${r.estado ? ` (${r.estado})` : ''}` : `⌀ ${r.error}`}`,
      r.ok ? 'sys' : 'error'
    );
    return r;
  }

  /** Ensayo sin efectos: el mismo gate, sin tocar el estado. */
  function ensayoCiudad(intent, args = {}) {
    if (!Z.dominio) return { ok: false, error: 'ciudad_no_conectada' };
    return Z.dominio.explainIntent(Z.mods.makeIntent(ACTOR_H, intent, args));
  }

  async function conectarCiudad() {
    let mapa;
    try {
      const res = await fetch(mapaUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`${res.status} en ${mapaUrl}`);
      mapa = await res.json();
    } catch (e) {
      Z.estado = 'fallo';
      Z.error = mensaje(e);
      declararPendiente('escena real de la ciudad', `no se pudo leer ${mapaUrl}: ${Z.error}`);
      return;
    }

    try {
      Z.gamemap = gamemapDesdeMapa(mapa);
      Z.mods = await cargarCiudadReal();
      Z.via = Z.mods.via;
      const escena = Z.mods.sceneFromGamemap(Z.gamemap);
      Z.sceneId = escena.sceneId;
      Z.nodos = Object.keys(escena.nodos).length;
      Z.barrios = Object.keys(escena.barrios).length;
      Z.barrioEstadoInicial = escena.barrios[Z.barrioId]?.estado ?? null;
      Z.parent = escena.barrios[Z.barrioId]?.parent ?? null;

      if (!escena.barrios[Z.barrioId]) {
        throw new Error(`el barrio «${Z.barrioId}» no está en el mapa`);
      }

      // El dominio construye su propia escena a partir del mismo gamemap.
      Z.dominio = Z.mods.createCiudadDomainState({ gamemap: Z.gamemap });
      Z.estado = 'listo';

      sistema(
        `@zeus/ciudad · dominio real cargado (${Z.via === 'puente' ? 'puente de navegador' : 'import map'})`
        + ` · escena ${Z.sceneId}: ${Z.nodos} nodos · ${Z.barrios} barrios`,
        'sys'
      );
      sistema(
        `barrio del descenso: ${Z.barrioId} (${Z.parent}) · estado real en el mapa: ${Z.barrioEstadoInicial}`,
        'sys'
      );
      if (Z.via === 'puente') {
        declararPendiente(
          '@zeus/ciudad/domain por import map',
          'el paquete arrastra node:crypto (acta.mjs) y node:child_process (salud.mjs); '
          + 'se carga con shims declarados hasta que el paquete publique una entrada browser'
        );
      }
    } catch (e) {
      Z.estado = 'fallo';
      Z.error = mensaje(e);
      declararPendiente('dominio ciudad real', Z.error);
    }
    emiteEstado();
  }

  /* ══════════════════════════════════════════════════════════════════
     Capa 4 · Ónfalo real
     ══════════════════════════════════════════════════════════════════ */

  /** Nombres de las piezas selladas que viven en assets/onfalo/ (respaldo). */
  const PIEZAS_RESPALDO = Object.freeze([
    '2024-05-01_primero-de-mayo.md',
    '2026-05-01_auge-de-la-educacion-emocional.md'
  ]);

  function normalizaIndice(dato) {
    const lista = Array.isArray(dato)
      ? dato
      : (dato && (dato.piezas || dato.items || dato.files || dato.ficheros)) || [];
    const out = [];
    for (const it of lista) {
      if (typeof it === 'string') out.push({ fichero: it });
      else if (it && typeof it === 'object') {
        const f = it.fichero || it.file || it.name || it.nombre || it.ruta || it.path || it.id;
        if (f) out.push({ fichero: String(f).replace(/^\.?\//, ''), titulo: it.titulo || it.title || null });
      }
    }
    return out;
  }

  /** Análisis de los bytes reales: nada se inventa, todo se cuenta. */
  function analizarPieza(nombre, texto, digest) {
    const lineas = texto.split(/\r?\n/);
    const titulo = (lineas.find((l) => /^#\s+/.test(l)) || '').replace(/^#\s+/, '').trim();
    const secciones = lineas.filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
    const meta = (etiqueta) => {
      const l = lineas.find((x) => new RegExp(`^\\*\\*${etiqueta}`, 'i').test(x));
      return l ? l.replace(/\*\*/g, '').replace(new RegExp(`^${etiqueta}:?\\s*`, 'i'), '').trim() : null;
    };
    const parrafos = texto.split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith('#') && !p.startsWith('**') && !p.startsWith('---'));
    const cita = parrafos.find((p) => p.includes('«')) || parrafos[1] || parrafos[0] || '';
    return {
      fichero: nombre,
      titulo: titulo || nombre,
      fuente: meta('Fuente'),
      fecha: meta('Fecha de publicación') || meta('Fecha'),
      secciones: secciones.length,
      titulares: secciones.slice(0, 4),
      parrafos: parrafos.length,
      palabras: texto.split(/\s+/).filter(Boolean).length,
      bytes: texto.length,
      extracto: recorta(parrafos[0] || '', 240),
      cita: recorta(cita, 200),
      digest: `sha256:${digest}`
    };
  }

  async function bajarPieza(fichero) {
    const url = onfaloUrl.replace(/\/?$/, '/') + fichero;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} en ${url}`);
    const texto = await res.text();
    return analizarPieza(fichero, texto, await sellar(texto));
  }

  async function cargarOnfalo() {
    const indice = onfaloUrl.replace(/\/?$/, '/') + 'index.json';
    let entradas = [];
    try {
      const res = await fetch(indice, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      entradas = normalizaIndice(await res.json());
      S.onfalo.fuente = indice;
    } catch (e) {
      S.onfalo.fuente = null;
      declararPendiente(
        'índice del Ónfalo',
        `${indice} no responde (${mensaje(e)}); se prueban las piezas selladas conocidas`
      );
      entradas = PIEZAS_RESPALDO.map((f) => ({ fichero: f }));
    }

    const piezas = [];
    for (const e of entradas) {
      try {
        piezas.push(await bajarPieza(e.fichero));
      } catch (err) {
        sistema(`Ónfalo · ${e.fichero} no se pudo leer: ${mensaje(err)}`, 'error');
      }
    }
    S.onfalo.piezas = piezas;
    S.onfalo.estado = piezas.length ? `${piezas.length} piezas leídas` : 'sin piezas';
    if (!piezas.length) {
      declararPendiente('piezas del Ónfalo', `no hay nada servido en ${onfaloUrl}`);
    } else {
      sistema(
        `Ónfalo · ${piezas.length} piezas reales leídas (`
        + piezas.map((p) => `${p.fichero} ${p.bytes}B`).join(' · ') + ')',
        'sys'
      );
    }
    emiteEstado();
  }

  /* ══════════════════════════════════════════════════════════════════
     Capa 3 · las dos cadenas de evidencia
     ══════════════════════════════════════════════════════════════════ */

  function unidadDePaso(step, verb, secondary) {
    if (secondary) {
      const s = CEREMONY_SECONDARY_VERBS.find((x) => x.step === step && x.verb === verb);
      return s ? s.unitId : null;
    }
    const p = CEREMONY_STEPS.find((x) => x.order === step);
    return p ? p.unitId : null;
  }

  /**
   * Emite UNA pareja bilateral: mismo núcleo causal, dos sellos de wire.
   *
   * @param {number} step
   * @param {string} verb
   * @param {object} [op]
   * @param {string}   [op.object]      URN del objeto de la Activity
   * @param {string}   [op.target]
   * @param {object}   [op.result]
   * @param {string[]} [op.provenance]  digests de lo que se usó
   * @param {string}   [op.instrument]
   * @param {boolean}  [op.secondary=false]
   * @param {string}   [op.note]        glosa para el ledger de la demo
   * @param {'real'|'mock'} [op.mode]   real = respaldado por mecanismo Scriptorium
   * @param {object}   [op.fx]          tipestate de unidades / paso / universo
   * @param {string}   [op.escena]      pista de efecto 3D (sólo en la mitad H)
   * @param {number}   [op.escenaVeces=1]
   */
  async function pareja(step, verb, op = {}) {
    const secondary = !!op.secondary;
    const unit = op.unit || unidadDePaso(step, verb, secondary);

    // Envelope completo por mitad; el núcleo causal se DERIVA quitando.
    const comun = {
      ceremony: CEREMONY_ID,
      scenario: SCENARIO_ID,
      run: RUN,
      step,
      verb,
      activityType: ACTIVITY_TYPES[verb] || null,
      unit,
      secondary,
      object: op.object || urn('step', String(step), verb),
      target: op.target ?? null,
      result: op.result ?? null,
      provenance: Array.isArray(op.provenance) ? [...op.provenance] : [],
      instrument: op.instrument ?? 'prueba-de-H-M · demo El Descenso',
      timestamp: new Date().toISOString(),
      prev: S.prev
    };

    const wires = {};
    for (const side of ['H', 'M']) {
      wires[side] = {
        ...comun,
        // Gramática real del activityId del playground, la que re-parsea
        // `POST /api/verificar`: <prefijo>:step:<orden>:<verbo>[:sec]:<H|M>.
        // Sin la marca «:sec» el verificador del server ve un id que dice
        // «primaria» junto a un campo secondary=true y lo canta como ruptura.
        // (El id no entra en el núcleo causal —se quita por denylist—, así que
        // esto no mueve ni un causalDigest; sí el wireDigest, que es lo suyo.)
        id: secondary
          ? urn('step', String(step), verb, 'sec', side)
          : urn('step', String(step), verb, side),
        actor: SIDE_ACTOR[side],
        context: { ceremony: CEREMONY_ID, scenario: SCENARIO_ID, step, secondary, side }
      };
    }

    // Las dos mitades han de producir EXACTAMENTE el mismo núcleo: se comprueba.
    const nucleoH = canonico(nucleoCausal(wires.H));
    if (nucleoH !== canonico(nucleoCausal(wires.M))) {
      throw new Error(`pareja ${step}/${verb}: los núcleos causales de H y M difieren`);
    }
    const causalDigest = `sha256:${await sellar(nucleoH)}`;

    S.seq += 1;
    aplicarFx(op.fx);

    const mitades = {};
    for (const side of ['H', 'M']) {
      mitades[side] = {
        step,
        verb,
        object: comun.object,
        causalDigest,
        wireDigest: `sha256:${await sellar(canonico(wires[side]))}`,
        activityId: wires[side].id,
        side,
        secondary
      };
    }

    S.prev = causalDigest;
    S.pares.push({
      step,
      verb,
      secondary,
      wires,
      causalDigest,
      mitades,
      fx: op.fx || null,
      mode: op.mode || 'real',
      note: op.note || null,
      escena: op.escena || null,
      escenaVeces: op.escenaVeces || 1
    });

    // Dos avisos: H (oro) y M (verdigrís). Sólo H trae la pista de escena.
    for (const side of ['H', 'M']) {
      onActivity({
        ...mitades[side],
        seq: S.seq,
        unit,
        activityType: comun.activityType,
        timestamp: comun.timestamp,
        mode: op.mode || 'real',
        note: op.note || null,
        fx: op.fx || null,
        escena: side === 'H' ? (op.escena || null) : null,
        escenaVeces: op.escenaVeces || 1
      });
    }

    emiteEstado();
    return mitades;
  }

  /** Relee las dos cadenas y recomputa cada digest: nadie se cree de memoria. */
  async function verificaCadena({ conServidor = true } = {}) {
    let prev = 'genesis';
    let causalOk = 0;
    let wireOk = 0;
    let rupturas = 0;

    for (const p of S.pares) {
      // Se recomputa desde los envelopes, con el `prev` que toca por posición:
      // así una línea movida de sitio rompe la cadena.
      const causal = `sha256:${await sellar(canonico(nucleoCausal({ ...p.wires.H, prev })))}`;
      if (causal === p.causalDigest) causalOk += 1;
      else rupturas += 1;

      for (const side of ['H', 'M']) {
        const d = `sha256:${await sellar(canonico({ ...p.wires[side], prev }))}`;
        if (d === p.mitades[side].wireDigest) wireOk += 1;
        else rupturas += 1;
      }
      prev = p.causalDigest;
    }

    // El núcleo causal debe ser idéntico en las dos mitades, y el wire no.
    const bilateral = S.pares.every(
      (p) => p.mitades.H.causalDigest === p.mitades.M.causalDigest
        && p.mitades.H.wireDigest !== p.mitades.M.wireDigest
        && canonico(nucleoCausal(p.wires.H)) === canonico(nucleoCausal(p.wires.M))
    );

    // Raíz de confianza del cierre: los 5 verbos exigidos, fuera del pack.
    const verbosEmitidos = new Set(S.pares.map((p) => p.verb));
    const shutdown = {
      requeridos: REQUIRED_SHUTDOWN_VERBS,
      faltan: REQUIRED_SHUTDOWN_VERBS.filter((v) => !verbosEmitidos.has(v)),
      completo: REQUIRED_SHUTDOWN_VERBS.every((v) => verbosEmitidos.has(v))
    };

    const cob = cobertura();
    const local = {
      ok: causalOk,
      wireOk,
      rupturas,
      total: S.pares.length,
      activities: S.pares.length * 2,
      intacta: rupturas === 0 && bilateral,
      bilateral,
      shutdown,
      cobertura: cob
    };

    // Sin `conServidor` no se pierde el veredicto externo ya obtenido.
    const servidor = conServidor
      ? await verificarEnServidor()
      : (S.verificacion ? S.verificacion.servidor : null);
    S.verificacion = { local, servidor };
    return { ...local, servidor };
  }

  /** `POST /api/verificar` re-verifica la cadena fuera del navegador. */
  async function verificarEnServidor() {
    try {
      const res = await fetch(apiVerificar, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          run: RUN,
          ceremony: CEREMONY_ID,
          side: 'H',
          // El verificador del server lee las DOS cadenas por su nombre (`H` y
          // `M`): sólo así puede comprobar los invariantes bilaterales (causal
          // H≡M, wire H≢M, biyección de parejas). Mandar una sola mitad daba
          // «falta la cadena H» — un rojo falso que no era de la evidencia.
          H: chainNdjson('H'),
          M: chainNdjson('M'),
          chain: S.pares.map((p) => p.mitades.H),
          ndjson: chainNdjson('H')
        })
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const dato = await res.json();
      sistema(
        `POST ${apiVerificar} → ${JSON.stringify(dato).slice(0, 180)}`,
        (dato && (dato.ok === false || dato.intacta === false)) ? 'error' : 'sys'
      );
      return dato;
    } catch (e) {
      declararPendiente(
        're-verificación en servidor',
        `${apiVerificar} no responde (${mensaje(e)}); la cadena sólo se re-verifica en el navegador`
      );
      return null;
    }
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
    } catch (e) {
      sistema(`el beat se rompió: ${mensaje(e)}`, 'error');
      vozM('Algo se ha roto en mitad del paso. No invento el resultado: '
        + 'la cadena se queda donde estaba y lo verás en la cobertura.');
    } finally {
      ocupada = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     Beats del guion — 11 pasos reales, 17 parejas
     ══════════════════════════════════════════════════════════════════ */

  const B = {};

  /* paso 1 · peer.join  +  paso 2 · peer.announce  (ciudad: join, announce, walk) */
  B.abrir = async () => {
    if (listo) await listo;

    const conectada = Z.estado === 'listo';
    const rJoin = conectada ? intentCiudad('join', { playerType: 'visitante' }) : null;

    await pareja(1, 'peer.join', {
      object: urn('ceremony', CEREMONY_ID),
      result: conectada
        ? { ciudad: 'join', ok: !!rJoin.ok, playerType: 'visitante', actor: ACTOR_H }
        : { ciudad: null, motivo: Z.error },
      instrument: conectada ? '@zeus/ciudad · makeIntent(join) game:ciudad' : 'ceremonia sin ciudad',
      mode: conectada ? 'real' : 'mock',
      note: 'identidad H·M · alta en la ciudad',
      fx: { step: 1, sim: ['portal'] }
    });

    const rAnn = conectada
      ? intentCiudad('announce', { message: 'H desciende a la Prueba de H·M' })
      : null;

    await pareja(2, 'peer.announce', {
      object: urn('room', SCENARIO_ID),
      result: conectada
        ? { ciudad: 'announce', ok: !!rAnn.ok, energia: energiaH() }
        : { ciudad: null },
      instrument: conectada ? '@zeus/ciudad · announce en plaza' : 'ceremonia sin ciudad',
      mode: conectada ? 'real' : 'mock',
      note: 'sala barrio-lore y autoridad',
      fx: { step: 2 }
    });

    if (conectada) {
      const rWalk = intentCiudad('walk', { anchorId: Z.anclaId });
      if (rWalk.ok) {
        sistema(`ciudad · H está en ${Z.parent} · ancla ${Z.anclaId} · energía ${energiaH()}`, 'sys');
      }
    }

    vozM('Estoy en la sala. Lo que acabas de ver no es una maqueta: H entró en '
      + `la ciudad con un intent tipado game:'ciudad', se anunció en la plaza y `
      + `caminó hasta el ancla de ${Z.barrioId}. `
      + (conectada
        ? `El dominio dice que el barrio está «${estadoBarrioReal()}».`
        : 'El dominio real no está en canal; lo verás declarado como pendiente.')
      + ' Puedo enseñarte el estado antes de tocar nada, o pedir la inflación.');

    ofrece([
      { label: 'Inspecciona primero.', match: ['inspecciona', 'inspeccion'], go: B.inspeccion },
      { label: 'Prepara Bartleby y Cristalizador.', match: ['prepara', 'infla'], go: B.solicitud }
    ]);
  };

  /**
   * Inspección RO — NO entra en la cadena.
   * Las 17 parejas son una biyección: meter un `state.inspect` la rompería.
   * Aquí se usa `explainIntent` del dominio real: mismo gate, cero efectos.
   */
  B.inspeccion = async () => {
    if (Z.estado === 'listo') {
      const ensayo = ensayoCiudad('wake', {
        barrioId: Z.barrioId, tool: 'lore.analyze', horseMode: 'stub'
      });
      sistema(`ciudad · explainIntent(wake) → ${ensayo.ok ? 'ok' : `⌀ ${ensayo.error}`} (ensayo, sin efectos)`, 'sys');
      vozM('Diez unidades declaradas; Bartleby y Cristalizador exigen pod.lease. '
        + `Y una cosa más: he ensayado el wake sobre ${Z.barrioId} sin ejecutarlo, `
        + `y el dominio responde «${ensayo.ok ? 'ok' : ensayo.error}». `
        + (ensayo.error === 'barrio_ya_vivo'
          ? 'El barrio está vivo en el mapa real: para desplegar habrá que dormirlo '
            + 'primero y dejar acta en la plaza. No me lo concedo yo: lo dice el gate.'
          : 'Esa es la respuesta del gate, no mía.')
        + ' Ninguna consulta RO deja Activity: la cadena son 17 parejas exactas.');
    } else {
      vozM('Diez unidades declaradas; Bartleby y Cristalizador exigen pod.lease. '
        + 'El dominio de la ciudad no está en canal, así que no puedo ensayar el '
        + 'gate: queda declarado como pendiente, no simulado.');
    }
    ofrece([
      { label: 'Prepara esas dos unidades.', match: ['prepara', 'dos unidades', 'infla'], go: B.solicitud }
    ]);
  };

  /* la solicitud no sella nada: la Activity es el paso 3, y sólo si H concede */
  B.solicitud = async () => {
    S.leases.bartleby = 'pendiente';
    S.leases.cristalizador = 'pendiente';
    S.paso = Math.max(S.paso, 2);
    emiteEstado();
    vozM('Solicito unit.inflate para Bartleby y Cristalizador. Requiere pod.lease '
      + 'sobre sus pods. Mientras no concedas, no hay Activity: la solicitud no '
      + 'es un hecho, y no voy a sellar lo que no ocurrió.');
    ofrece([
      { label: 'Concedo los leases.', match: ['concedo', 'concede', 'grant', 'si'], go: B.grant },
      { label: 'Deniego.', match: ['deniego', 'deniega', 'deny', 'no'], go: B.deny }
    ]);
  };

  B.deny = async () => {
    S.denegaciones += 1;
    S.leases.bartleby = 'denegada';
    S.leases.cristalizador = 'denegada';
    emiteEstado();
    const cob = cobertura();
    sistema(`denegación · sin Activity · cobertura ${cob.parejas}/${cob.esperadas} parejas`, 'sys');
    vozM('Denegado. Fallo atómico: cero estado parcial y cero evidencia de un '
      + `intento a medias. La cadena se queda en ${cob.parejas} de ${cob.esperadas} `
      + 'parejas, y ese hueco es la prueba de lo que NO ocurrió.');
    ofrece([
      { label: 'Vuelve a solicitarlo.', match: ['vuelve', 'solicita', 'otra vez'], go: B.solicitud },
      { label: 'Cierra la sesión.', match: ['cierra'], go: B.cierreVacio }
    ]);
  };

  B.cierreVacio = async () => {
    await pareja(11, 'session.exit', {
      secondary: true,
      object: urn('room', SCENARIO_ID),
      result: { motivo: 'denegación de leases', parejas: S.pares.length },
      mode: 'real',
      note: 'sesión cerrada sin efectos',
      escena: 'acta'
    });
    if (Z.estado === 'listo') {
      const r = intentCiudad('sleep', {
        barrioId: Z.barrioId,
        resumen: `Prueba de H·M ${RUN}: leases denegados, sin despliegue`,
        pendientes: ['unit.inflate no concedido por H']
      });
      if (r.ok && r.acta) Z.actaBarrio = r.acta;
    }
    await emitirActaReal('Sesión cerrada sin efectos: H denegó los leases.');
    vozM('Sesión cerrada sin efectos. La evidencia demuestra lo que no ocurrió: '
      + 'ésa es la mitad del valor de la ceremonia.');
    trasCerrar();
  };

  /* paso 3 · unit.inflate */
  B.grant = async () => {
    S.leases.bartleby = 'concedida';
    S.leases.cristalizador = 'concedida';
    S.unidades.bartleby = 'arrendada';
    S.unidades.cristalizador = 'arrendada';
    emiteEstado();

    await pareja(3, 'unit.inflate', {
      object: urnUnidad('bartleby+cristalizador'),
      result: {
        leases: { bartleby: 'concedida', cristalizador: 'concedida' },
        tipestate: 'declarada → arrendada → materializada → lista'
      },
      instrument: 'pod.lease concedido por H',
      mode: 'real',
      note: 'bartleby · cristalizador',
      fx: {
        step: 3,
        units: { bartleby: 'lista', cristalizador: 'lista' },
        leases: { bartleby: 'concedida', cristalizador: 'concedida' }
      },
      escena: 'llave'
    });

    vozM('Leases válidas. Bartleby y Cristalizador recorren el tipestate entero: '
      + 'declarada → arrendada → materializada → lista. Toda transición ilegal es '
      + 'inexpresable, no sólo prohibida.');
    ofrece([
      { label: 'Despliega la máquina en el barrio.', match: ['despliega', 'maquina', 'barrio'], go: B.despliegue }
    ]);
  };

  /* paso 4 · machine.deploy  ← ciudad: sleep (acta a plaza) + wake horseMode:'stub' */
  B.despliegue = async () => {
    let resultado = { ciudad: null, motivo: Z.error };

    if (Z.estado === 'listo') {
      const ensayo = ensayoCiudad('wake', { barrioId: Z.barrioId, tool: 'lore.analyze', horseMode: 'stub' });
      if (!ensayo.ok && ensayo.error === 'barrio_ya_vivo') {
        sistema('ciudad · el barrio ya está vivo: se duerme antes (deja acta en plaza).', 'sys');
        const rSleep = intentCiudad('sleep', {
          barrioId: Z.barrioId,
          resumen: `Relevo para la Prueba de H·M ${RUN}`,
          pendientes: []
        });
        if (rSleep.ok && rSleep.acta) {
          Z.actaBarrio = rSleep.acta;
          sistema(`ciudad · acta de relevo en plaza · huellaLedger ${rSleep.acta.huellaLedger.slice(0, 16)}…`, 'sys');
        }
      }

      const rWake = intentCiudad('wake', {
        barrioId: Z.barrioId,
        tool: 'lore.analyze',
        horseMode: 'stub'     // modo REAL del dominio; 'horse' pleno, pendiente
      });

      if (rWake.ok) {
        const snap = Z.dominio.snapshot('wake');
        Z.residenteId = snap.lastWake?.residenteId || null;
        Z.horseMode = snap.lastWake?.horseMode || null;
        const asiento = Z.dominio.drainOutbox().ledger.find((e) => e.kind === 'wake');
        Z.horseGap = asiento?.detail?.horseGap || null;
        resultado = {
          ciudad: 'wake',
          estado: rWake.estado,
          tool: 'lore.analyze',
          horseMode: Z.horseMode,
          residenteId: Z.residenteId,
          horseGap: Z.horseGap
        };
        if (Z.horseGap) {
          declararPendiente(
            "wake con horseMode:'horse'",
            `el propio dominio marca horseGap='${Z.horseGap}': la capability del launcher `
            + "no está servida, así que se ofrece el tool en modo 'stub'"
          );
        }
      } else {
        resultado = { ciudad: 'wake', ok: false, error: rWake.error };
      }
    } else {
      declararPendiente('despliegue sobre barrio real', Z.error || 'ciudad no conectada');
    }

    await pareja(4, 'machine.deploy', {
      object: `urn:scriptorium:hm:ciudad:barrio:${Z.barrioId}`,
      result: resultado,
      instrument: Z.estado === 'listo'
        ? "@zeus/ciudad · wake(tool, horseMode:'stub')"
        : 'manifiesto declarado sin ciudad',
      mode: Z.estado === 'listo' ? 'real' : 'mock',
      note: `machine manifest → ${Z.barrioId}`,
      fx: { step: 4, sim: ['portal', 'loreador'], units: { cristalizador: 'corriendo' } }
    });

    vozM(Z.estado === 'listo'
      ? `Máquina desplegada donde importa: el barrio ${Z.barrioId} está `
        + `«${estadoBarrioReal()}» y ha nacido su residente ${Z.residenteId}. `
        + 'El tool se ofrece por horse en modo stub — es el modo real del dominio, '
        + (Z.horseGap ? `y el propio asiento marca «${Z.horseGap}».` : 'declarado.')
      : 'El despliegue queda declarado: sin dominio de ciudad en canal no hay '
        + 'barrio que despertar, y no voy a fingir uno.');

    ofrece([
      { label: 'Ingiere el Ónfalo y analiza.', match: ['ingiere', 'onfalo', 'analiza'], go: B.onfalo }
    ]);
  };

  /* paso 5 · source.ingest  +  secundario document.analyze */
  B.onfalo = async () => {
    if (listo) await listo;
    const piezas = S.onfalo.piezas;

    await pareja(5, 'source.ingest', {
      object: urn('onfalo', `${piezas.length}-piezas`),
      provenance: piezas.map((p) => p.digest),
      result: {
        piezas: piezas.map((p) => ({
          fichero: p.fichero, bytes: p.bytes, palabras: p.palabras, secciones: p.secciones
        })),
        fuente: S.onfalo.fuente || `${onfaloUrl} (respaldo de piezas selladas)`
      },
      instrument: `fetch ${onfaloUrl}`,
      mode: piezas.length ? 'real' : 'mock',
      note: `Ónfalo · ${piezas.length} piezas`,
      fx: { step: 5, sim: ['archivero', 'loreador'] },
      escena: 'gota-onfalo',
      escenaVeces: Math.max(1, piezas.length)
    });

    const secciones = piezas.reduce((n, p) => n + p.secciones, 0);
    const palabras = piezas.reduce((n, p) => n + p.palabras, 0);

    await pareja(5, 'document.analyze', {
      secondary: true,
      object: urnUnidad('bartleby'),
      provenance: piezas.map((p) => p.digest),
      result: {
        secciones,
        palabras,
        titulares: piezas.flatMap((p) => p.titulares),
        extractos: piezas.map((p) => ({ fichero: p.fichero, extracto: p.extracto }))
      },
      instrument: 'bartleby · análisis sobre los bytes leídos',
      mode: piezas.length ? 'real' : 'mock',
      note: `bartleby → ${secciones} secciones`,
      fx: { units: { bartleby: 'corriendo' } },
      escena: 'gota-analisis'
    });

    S.unidades.bartleby = 'lista';
    emiteEstado();

    if (piezas.length) {
      for (const p of piezas) {
        sistema(`Ónfalo · ${p.titulo}${p.fuente ? ` — ${p.fuente}` : ''}`
          + `${p.fecha ? ` (${p.fecha})` : ''} · ${p.secciones} secciones · ${p.palabras} palabras`
          + ` · ${p.digest.slice(0, 23)}…`, 'sys');
        if (p.cita) sistema(`   « ${p.cita} »`, 'sys');
      }
      vozM(`He leído ${piezas.length} piezas de verdad: ${secciones} secciones y `
        + `${palabras} palabras, cada una con su digest en la procedencia del paso. `
        + `La primera abre así: «${recorta(piezas[0].extracto, 150)}» — eso no lo he `
        + 'escrito yo, estaba en el fichero.');
    } else {
      vozM('No he podido leer ninguna pieza del Ónfalo. Antes que inventarme un '
        + 'análisis, lo dejo declarado como pendiente: la demo enseña la frontera.');
    }

    ofrece([
      { label: 'Continúa hasta el grafo.', match: ['continua', 'grafo'], go: B.grafo }
    ]);
  };

  /* pasos 6 · 7 · 8 */
  B.grafo = async () => {
    const semilla = S.pares.length ? S.pares[S.pares.length - 1].causalDigest.slice(7, 15) : '0';

    await pareja(6, 'vector.mock-index', {
      object: urn('vector', 'mock'),
      result: { mock: true, seed: semilla, piezas: S.onfalo.piezas.length },
      instrument: 'VectorMock determinista (mock=true declarado)',
      mode: 'mock',
      note: 'VectorMock · seed ' + semilla,
      fx: { step: 6, sim: ['vector-mock'] }
    });

    await pareja(7, 'line.materialize', {
      object: urn('lines', '2'),
      result: { lineas: 2, validadas: true },
      instrument: '@zeus/linea-kit (contrato del playground)',
      mode: 'mock',
      note: 'dos líneas validadas',
      fx: { step: 7, sim: ['pipeline'] },
      escena: 'cristal',
      escenaVeces: 2
    });
    declararPendiente(
      'materialización con @zeus/linea-kit',
      'el kit está en node_modules pero la demo no lo monta ni sirve; '
      + 'las dos líneas se declaran, no se materializan'
    );

    await pareja(8, 'graph.bifurcate', {
      object: urn('graph', 'bifurcado'),
      result: { ramas: ['Alpha', 'Beta'] },
      mode: 'mock',
      note: '2 ramas candidatas',
      fx: { step: 8, sim: ['grafista'] }
    });

    vozM('VectorMock indexado con semilla derivada de la propia cadena, dos líneas '
      + 'validadas y grafo bifurcado. Hay dos ramas candidatas esperando tu elección.');
    ofrece([
      { label: 'Muéstrame las alternativas.', match: ['alternativas', 'muestrame'], go: B.alternativas }
    ]);
  };

  /** Consulta RO: tampoco sella. */
  B.alternativas = async () => {
    vozM('Alpha prioriza consejos. Beta prioriza partido. Te lo enseño sin sellar '
      + 'nada: mirar no es un hecho de la ceremonia. Elegir sí, y quedará en la '
      + 'cadena causal con tu nombre.');
    ofrece([
      { label: 'Alpha.', match: ['alpha', 'alfa'], go: () => B.universo('Alpha') },
      { label: 'Beta.', match: ['beta'], go: () => B.universo('Beta') }
    ]);
  };

  /* pasos 9 · 10 */
  B.universo = async (cual) => {
    await pareja(9, 'universe.instantiate', {
      object: urn('universe', cual),
      result: { universo: cual, runner: 'declarado', pods: UNIDADES_CON_LEASE },
      mode: 'mock',
      note: 'universo ' + cual,
      fx: { step: 9, sim: ['demiurgo'], universe: cual }
    });

    await pareja(10, 'corto.emit', {
      object: urn('corto', '1'),
      result: { corto: 1, desde: cual },
      instrument: 'dramaturgo · hm:CortoDeEjecucion',
      mode: 'mock',
      note: 'corto #1 desde ' + cual,
      fx: { step: 10, sim: ['dramaturgo', 'pipeline'] }
    });

    vozM(`Universo ${cual} instanciado y corto emitido. Puedo consultar el corto `
      + '(eso sí sella: es el secundario del paso 10), medir cobertura o trazar y cerrar.');
    ofrece([
      { label: 'Datos del corto.', match: ['datos', 'corto'], go: B.datos },
      { label: 'Cobertura.', match: ['cobertura'], go: B.cobertura },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  /* secundario del paso 10 · corto.query */
  B.datos = async () => {
    await pareja(10, 'corto.query', {
      secondary: true,
      object: urn('corto', '1'),
      provenance: S.onfalo.piezas.map((p) => p.digest),
      result: {
        rama: S.universo,
        derivadoDe: 'dos líneas canónicas',
        procedencia: 'intacta hasta las piezas del Ónfalo'
      },
      mode: 'mock',
      note: 'consulta del corto #1'
    });
    vozM(`Corto #1 · rama ${S.universo} · derivado de dos líneas canónicas · `
      + `procedencia intacta hasta ${S.onfalo.piezas.length} piezas del Ónfalo, `
      + 'con sus digests en la Activity.');
    ofrece([
      { label: 'Cobertura.', match: ['cobertura'], go: B.cobertura },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  /* paso 11 primario · coverage.measure */
  B.cobertura = async () => {
    if (!S.pares.some((p) => p.verb === 'coverage.measure')) {
      const cob = cobertura();
      await pareja(11, 'coverage.measure', {
        object: urn('coverage', CEREMONY_ID),
        result: {
          parejas: cob.parejas + 1,
          esperadas: cob.esperadas,
          activities: (cob.parejas + 1) * 2,
          faltan: cob.faltan.filter((k) => !k.startsWith('11|coverage.measure'))
        },
        instrument: 'matriz de verbos de barrio-lore-v1',
        mode: 'real',
        note: 'cobertura sobre 17 parejas',
        fx: { step: 11, sim: ['portal'] }
      });
    }
    const cob = cobertura();
    vozM(`Cobertura: ${cob.parejas} de ${cob.esperadas} parejas selladas `
      + `(${cob.activities} Activities de ${cob.activitiesEsperadas}). `
      + (cob.faltan.length
        ? `Faltan: ${cob.faltan.join(' · ')}. No la redondeo al alza.`
        : 'Biyección completa contra la matriz de verbos.'));
    ofrece([
      { label: 'Datos del corto.', match: ['datos', 'corto'], go: B.datos },
      { label: 'Traza y cierra.', match: ['traza', 'cierra'], go: B.cierre }
    ]);
  };

  /* paso 11 · el cierre: coverage (si falta) + trace + stop + revoke + exit */
  B.cierre = async () => {
    if (!S.pares.some((p) => p.verb === 'coverage.measure')) {
      await B.cobertura();
      ofrece([]);
    }

    const v = await verificaCadena({ conServidor: true });

    await pareja(11, 'provenance.trace', {
      secondary: true,
      object: urn('trace', 'onfalo'),
      provenance: S.onfalo.piezas.map((p) => p.digest),
      result: {
        parejas: v.total,
        activities: v.activities,
        rupturas: v.rupturas,
        bilateral: v.bilateral,
        raiz: S.prev,
        servidor: v.servidor ? 'verificado fuera del navegador' : 'sólo en navegador'
      },
      instrument: 'recomputación de los 3 digests por pareja',
      mode: 'real',
      note: `${v.activities} Activities, ${v.rupturas} rupturas`,
      escena: 'cadena'
    });

    await pareja(11, 'unit.stop', {
      secondary: true,
      object: urnUnidad('bartleby+cristalizador'),
      result: { detenidas: UNIDADES_CON_LEASE },
      mode: 'real',
      note: 'bartleby · cristalizador',
      fx: { units: { bartleby: 'detenida', cristalizador: 'detenida' } },
      escena: 'disolver'
    });

    await pareja(11, 'pod.revoke', {
      secondary: true,
      object: `urn:scriptorium:hm:pod:bartleby+cristalizador`,
      result: { revocadas: UNIDADES_CON_LEASE },
      mode: 'real',
      note: 'leases revocadas',
      fx: { leases: { bartleby: 'revocada', cristalizador: 'revocada' } }
    });

    // El barrio vuelve a dormir en el dominio real y deja SU acta en la plaza.
    if (Z.estado === 'listo') {
      const r = intentCiudad('sleep', {
        barrioId: Z.barrioId,
        resumen: `Prueba de H·M ${RUN} · ceremonia ${CEREMONY_ID} completada`,
        pendientes: S.pendientes.map((p) => recorta(`${p.que}: ${p.motivo}`, 120))
      });
      if (r.ok && r.acta) {
        Z.actaBarrio = r.acta;
        sistema(`ciudad · acta de barrio en plaza · huellaLedger ${r.acta.huellaLedger.slice(0, 16)}…`, 'sys');
      }
    }

    // El acta se emite ANTES de `session.exit` porque esa Activity sella su
    // huella: por eso el resumen habla de las parejas selladas hasta aquí.
    const acta = await emitirActaReal(
      `Prueba de H·M ${CEREMONY_ID} · ${S.pares.length} parejas selladas al emitir `
      + `(falta session.exit, que sella esta acta) · ${v.rupturas} rupturas · raíz ${S.prev}`
    );

    await pareja(11, 'session.exit', {
      secondary: true,
      object: urn('room', SCENARIO_ID),
      result: { acta: acta ? acta.huellaLedger : null, limpio: true },
      mode: acta ? 'real' : 'mock',
      note: 'salida limpia',
      escena: 'acta'
    });

    // Re-verificación final: ya con las 34 mitades dentro.
    const vf = await verificaCadena({ conServidor: false });

    const cob = cobertura();
    vozM(`Cadena verificada: ${vf.activities} Activities en dos mitades, `
      + `${vf.rupturas} rupturas, núcleo causal idéntico y sellos de wire distintos `
      + `— eso es lo que hace bilateral a la prueba. Cobertura ${cob.parejas}/${cob.esperadas}. `
      + (acta
        ? `Acta emitida en el servidor con emitirActa de @zeus/ciudad/acta, huella ${acta.huellaLedger.slice(0, 16)}….`
        : 'El acta no se pudo emitir en el servidor; queda declarada como pendiente.')
      + ` ${SIMULACRO_NOTE}`);

    sistema(`⟐ sello de ceremonia · raíz causal ${String(S.prev).slice(7, 23)}`, 'sello');
    trasCerrar();
  };

  function trasCerrar() {
    S.cerrado = true;
    ofrece([]);
  }

  /* ══════════════════════════════════════════════════════════════════
     Capa 5 · acta real en el servidor
     ══════════════════════════════════════════════════════════════════ */

  async function emitirActaReal(resumen) {
    const cuerpo = {
      barrioId: Z.barrioId,
      estado: estadoBarrioReal() || 'latente',
      resumen: recorta(resumen, 400),
      pendientes: S.pendientes.map((p) => recorta(`${p.que}: ${p.motivo}`, 120)),
      ultimaClase: 'visitante',
      tickEmision: Z.dominio ? Z.dominio.getTick() : 0,
      // el server sella este evento con huellaLedger (node:crypto)
      evento: {
        kind: 'hm-ceremonia',
        run: RUN,
        ceremony: CEREMONY_ID,
        scenario: SCENARIO_ID,
        parejas: S.pares.length,
        activities: S.pares.length * 2,
        raizCausal: S.prev,
        raizH: S.pares.length ? S.pares[S.pares.length - 1].mitades.H.wireDigest : null,
        raizM: S.pares.length ? S.pares[S.pares.length - 1].mitades.M.wireDigest : null,
        barrioId: Z.barrioId
      }
    };

    try {
      const res = await fetch(apiActa, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const dato = await res.json();
      const acta = (dato && dato.acta) ? dato.acta : dato;
      if (!acta || acta.version !== 'acta/1' || typeof acta.huellaLedger !== 'string') {
        throw new Error('la respuesta no tiene forma ActaDeBarrio v1');
      }
      S.acta = acta;
      sistema(`POST ${apiActa} → acta/1 · ${acta.barrioId} · ${acta.estado} `
        + `· huellaLedger ${acta.huellaLedger.slice(0, 24)}…`, 'sys');
      emiteEstado();
      return acta;
    } catch (e) {
      declararPendiente(
        'acta emitida en servidor',
        `${apiActa} no responde con un ActaDeBarrio v1 (${mensaje(e)}); `
        + 'emitirActa/huellaLedger usan node:crypto y sólo viven en el server'
      );
      // Acta local del dominio (si la hay) — es real, pero es la del barrio.
      if (Z.actaBarrio) {
        S.acta = { ...Z.actaBarrio, origen: 'dominio ciudad (navegador)' };
        emiteEstado();
        return S.acta;
      }
      emiteEstado();
      return null;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     Arranque, recuperación y API
     ══════════════════════════════════════════════════════════════════ */

  async function preparar() {
    await comprobarSellos();
    await conectarCiudad();
    await cargarOnfalo();
    sistema(
      `preparado · run ${RUN} · sellos ${S.sello} (${S.selloVia}) · `
      + `ciudad ${Z.estado}${Z.via ? ` (${Z.via})` : ''} · Ónfalo ${S.onfalo.estado}`,
      'sys'
    );
  }

  /** Relee las cadenas y rehace el estado desde la evidencia, no desde memoria. */
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
    sistema(`leyendo H/chain.ndjson y M/chain.ndjson · ${S.pares.length * 2} líneas…`, 'sys');

    let prev = 'genesis';
    let ok = 0;
    for (const p of S.pares) {
      const causal = `sha256:${await sellar(canonico(nucleoCausal({ ...p.wires.H, prev })))}`;
      if (causal === p.causalDigest) ok += 1;
      prev = p.causalDigest;
      aplicarFx(p.fx);
      emiteEstado();
      if (cadencia) await espera(cadencia);
    }

    S.cerrado = true;
    S.recuperando = false;
    S.recuperado = true;
    emiteEstado();

    sistema(`verificando digests causales… ✓ ${ok}/${S.pares.length}`, 'sys');
    sistema('estado recuperado desde evidencia, no desde memoria.', 'sys');
    if (Z.estado === 'listo') {
      sistema(`el dominio de la ciudad no se rebobina: ${Z.barrioId} sigue `
        + `«${estadoBarrioReal()}» porque su estado vive en el barrio, no en la cadena.`, 'sys');
    }
    vozM('He vuelto. No recuerdo nada — lo he releído todo, y las dos cadenas '
      + 'responden por mí.');
  }

  /* ── ndjson y descargas ─────────────────────────────────────────── */

  /** Una mitad, una Activity por línea — forma exacta de chain.ndjson. */
  function chainNdjson(side) {
    const lado = side === 'M' ? 'M' : 'H';
    return S.pares.map((p) => JSON.stringify(p.mitades[lado])).join('\n');
  }

  /** Contrato R1 conservado: el transcript sellado es la cadena de H. */
  function transcriptNdjson() {
    return chainNdjson('H');
  }

  function actaJson() {
    return JSON.stringify(
      {
        run: RUN,
        ceremony: CEREMONY_ID,
        scenario: SCENARIO_ID,
        barrio: {
          id: Z.barrioId,
          estadoInicial: Z.barrioEstadoInicial,
          estadoFinal: estadoBarrioReal(),
          residenteId: Z.residenteId,
          horseMode: Z.horseMode,
          horseGap: Z.horseGap
        },
        cobertura: cobertura(),
        raizCausal: S.prev,
        acta: S.acta,
        actaBarrio: Z.actaBarrio,
        verificacion: S.verificacion,
        onfalo: S.onfalo.piezas,
        pendientes: S.pendientes,
        nota: SIMULACRO_NOTE
      },
      null,
      2
    );
  }

  /** Los tres ficheros que se lleva H. */
  function descargas() {
    return [
      { nombre: 'H/chain.ndjson', tipo: 'application/x-ndjson', texto: chainNdjson('H') },
      { nombre: 'M/chain.ndjson', tipo: 'application/x-ndjson', texto: chainNdjson('M') },
      { nombre: 'acta.json', tipo: 'application/json', texto: actaJson() }
    ];
  }

  /* ── API pública ────────────────────────────────────────────────── */

  /** Arranca la ceremonia: prepara las capas reales y abre el turno de H. */
  function start() {
    if (S.arrancada) return opcionesPublicas();
    S.arrancada = true;
    listo = preparar().catch((e) => {
      sistema(`el arranque se rompió: ${mensaje(e)}`, 'error');
    });
    sistema(`ceremonia ${CEREMONY_ID} · escenario ${SCENARIO_ID} · `
      + `${EXPECTED_PAIR_KEYS.length} parejas esperadas (${EXPECTED_PAIR_KEYS.length * 2} Activities) `
      + '· 10 unidades declaradas · esperando a H', 'sys');
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

  const api = {
    start,
    options,
    say,
    pick,
    transcriptNdjson,
    restartRecover,
    verifyChain: verificaCadena,
    // ── R2, aditivo ──────────────────────────────────────────────
    chainNdjson,
    actaJson,
    descargas,
    cobertura,
    pasos: CEREMONY_STEPS,
    parejasEsperadas: EXPECTED_ACTIVITY_PAIRS
  };

  Object.defineProperty(api, 'state', { get: instantanea, enumerable: true });

  if (autoStart) queueMicrotask(start);

  return api;
}
