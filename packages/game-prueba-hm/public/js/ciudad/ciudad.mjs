/**
 * ciudad.mjs — módulo W-CIUDAD-REAL · demo «Prueba-H-M» (El Descenso) · R2
 * ---------------------------------------------------------------------------
 * R2: la ciudad deja de ser una proyección inventada y pasa a dibujarse SOBRE
 * mecanismo real de Scriptorium. Tres cosas cambian y una se conserva:
 *
 *   1 · PROYECCIÓN REAL. `mapa.json` se adapta a un **gamemap** con la forma
 *       exacta de `@zeus/startpack-ciudad/seeds/gamemap.json` (nodos/enlaces/
 *       anclas; ids idénticos: `plaza`, `zigurat`, `calle-mcp-vivos`,
 *       `ancla-document-machine-sdk`…) y se proyecta con el
 *       **`sceneFromGamemap` real** de `@zeus/ciudad/scene`. El resultado
 *       (`api.escena`) es lo que consume el dominio de W-CEREMONIA.
 *   2 · GEOMETRÍA REAL. Las piezas de escenario son las del kit publicado
 *       `@zeus/ui-3d-kit`: `createNodeMesh` por nodo, `createAnchorMarker` por
 *       ancla, `createLinkCorridorBetween` por enlace (troceado con el
 *       `sampleLink`/`linkDistance` reales de `@zeus/game-engine`), y
 *       `createTrajectoryManager` para el tráfico de handoffs hacia la NOTARÍA.
 *       Del kit se conserva la GEOMETRÍA; sólo se re-tiñe el color a la paleta
 *       cerrada de la demo (`tematizar`), que es el tema R1 puesto encima.
 *   3 · VOCABULARIO REAL. Los estados de barrio se validan contra
 *       `BARRIO_ESTADOS` de `@zeus/ciudad/contract`, y el nodo de spawn es el
 *       `SPAWN_NODE_ID` real ('plaza').
 *   4 · SE CONSERVA el urbanismo R1 que deriva del dato: mesetas por distrito,
 *       anillos al tresbolillo, avenidas de handoff barrio→NOTARÍA, bruma de
 *       altura y la NOTARÍA como landmark. Ahora son la CAPA ESTÉTICA sobre la
 *       escena real, no la escena.
 *
 * Frontera real/pendiente (se publica en `api.frontera`, es producto):
 *   · `createSceneManager` del kit NO se usa: monta su propio renderer, cámara,
 *     OrbitControls y bucle rAF, y en esta demo el integrador (`main.mjs`) ya
 *     los posee y le entrega a este módulo una `scene` ajena. Adoptarlo rompería
 *     la firma `createCiudad({ scene })` y duplicaría el bucle.
 *   · `createAnimationController` del kit tampoco: lleva reloj propio
 *     (`update()` sin dt) y la demo impone un único reloj `ciudad.update(dt)`.
 *   · `@zeus/ciudad/scene` se carga por import DINÁMICO (no estático) porque su
 *     montaje `/zeus-ciudad/` y su clave de import map los publica otro dueño
 *     (W-SERVER-REAL). Comprobado en canal: `GET /zeus-ciudad/scene.mjs` → 200 y
 *     el import map trae `@zeus/ciudad/` y `@zeus/ciudad/scene`. Si algún día no
 *     estuviera, `api.escena` queda `null` y el motivo se publica en
 *     `api.frontera.pendiente` — NO se reimplementa `sceneFromGamemap`.
 *
 * TODO lo geométrico sigue derivándose de `assets/mapa/mapa.json`: el sector
 * angular de cada holón sale del número de barrios, la elevación de cada meseta
 * del volumen de handoffs de su distrito, la altura y el brillo de cada torre
 * del estado y de `grafo.handoffEdges`, y las avenidas hacia la NOTARÍA de esos
 * mismos handoffs. Ojo: `handoffEdges` es un CONTADOR, no una lista de aristas.
 *
 * Contrato (ARQUITECTURA-DEMO.md · no cambia en R2):
 *   export async function createCiudad({ scene, mapa, THREE })
 *   → { group, barrioAnchor(barrioId), focusCity(), dispose() }
 *
 * Reglas: ES modules de navegador, cero build, paleta cerrada, easing en toda
 * animación y `prefers-reduced-motion` respetado.
 */

// ── kit real (verificado contra node_modules Y contra el servidor) ───────────
// node_modules/@zeus/ui-3d-kit/src/…  → montaje /kit/  → import map «@zeus/ui-3d-kit/».
// Los cuatro módulos declaran «Browser-safe: three resolves via import map» y
// sólo importan `three` (+ `three/addons/loaders/GLTFLoader.js` en anchor-marker,
// que el import map manda a /vendor/three/examples/jsm/). Comprobado 200 en el
// servidor de la demo: /kit/stage/{node-mesh,anchor-marker,link-corridor}.mjs,
// /kit/core/trajectory-manager.mjs, /game-engine/index.mjs y el GLTFLoader.
//
// Nota de instancia: estos módulos resuelven `three` por el import map, o sea la
// MISMA instancia que carga main.mjs. Si alguien inyectase por `createCiudad({THREE})`
// un namespace distinto, la geometría del kit seguiría siendo la del import map;
// en esta demo main.mjs pasa el mismo `three`, así que no hay dos instancias.
import { createNodeMesh } from '@zeus/ui-3d-kit/stage/node-mesh.mjs';
import { createAnchorMarker } from '@zeus/ui-3d-kit/stage/anchor-marker.mjs';
import { createLinkCorridorBetween } from '@zeus/ui-3d-kit/stage/link-corridor.mjs';
import { createTrajectoryManager } from '@zeus/ui-3d-kit/core/trajectory-manager.mjs';
// Matemática de enlaces del motor real (pura, sin three, sin builtins de node).
import { sampleLink, linkDistance } from '@zeus/game-engine';

const TAU = Math.PI * 2;

/** Paleta cerrada del scriptorium (ningún color fuera de aquí). */
export const PALETA = Object.freeze({
  sepia:     0x131008, // fondo / tierra
  tinta:     0xEAE0C8, // luz, texto
  oro:       0xE7B14C, // H · notaría
  verdigris: 0x85BAA9, // M
  violeta:   0xAC97CE, // mock
  verde:     0x8FBF7F, // ok
  terracota: 0xDB7A5D  // fallo
});

/** Color por distrito (todos de la paleta). */
const COLOR_DISTRITO = Object.freeze({
  'zigurat':     PALETA.oro,
  'editores':    PALETA.verdigris,
  'lore-voz':    PALETA.tinta,
  'red-stream':  PALETA.violeta,
  'runtime-mcp': PALETA.verde,
  'infra-ui':    PALETA.terracota
});
const COLORES_RESPALDO = [
  PALETA.oro, PALETA.verdigris, PALETA.tinta,
  PALETA.violeta, PALETA.verde, PALETA.terracota
];

/** El barrio 20 `document-machine-sdk` destaca (pulso emissive muy contenido). */
const ID_DESTACADO = 'document-machine-sdk';

/** Bandas radiales y altura base por `runtimeKind` del holón. */
const BANDAS = Object.freeze({
  anchor:       { rIn: 12.0, rOut: 21.0, base:  1.30, arcoMin: 0.00, grosor: 1.10 },
  metodo:       { rIn:  4.2, rOut:  9.2, base:  7.00, arcoMin: 1.05, grosor: 1.60 },
  cantera:      { rIn: 25.0, rOut: 31.0, base: -2.30, arcoMin: 0.85, grosor: 0.70 },
  constelacion: { rIn: 25.0, rOut: 31.0, base: -2.30, arcoMin: 0.85, grosor: 0.70 }
});

const ANG_INICIAL   = Math.PI * 0.62;
const GAP_HOLON     = 0.085;
const GAP_DISTRITO  = 0.045;
const RADIO_CIUDAD  = 31;
const DUR_REVELADO  = 2.6;   // segundos
const ALTURA_BRUMA  = 80;

/**
 * Lectura visual de cada estado de barrio. Las CLAVES son el vocabulario real
 * `BARRIO_ESTADOS` de `@zeus/ciudad/contract` (['vivo','latente','muerto','roto'])
 * — R1 sólo conocía tres; 'roto' entra en R2 aunque el mapa actual no lo use,
 * para que la tabla cubra el vocabulario entero y nada quede sin dibujar.
 */
export const ESTADOS_VISUAL = Object.freeze({
  vivo:    { alturaK: 1.00, radioK: 1.00, emissive: 0.26,  opacidad: 1.00, apagado: 0.00 },
  latente: { alturaK: 0.72, radioK: 0.90, emissive: 0.12,  opacidad: 0.88, apagado: 0.34 },
  muerto:  { alturaK: 0.44, radioK: 0.82, emissive: 0.035, opacidad: 0.55, apagado: 0.66 },
  roto:    { alturaK: 0.52, radioK: 0.94, emissive: 0.09,  opacidad: 0.62, apagado: 0.52 }
});

/**
 * Constantes de color del kit `@zeus/ui-3d-kit` (leídas de su fuente: los tres
 * módulos de `stage/` comparten «same cyberpunk-grid palette»). Se listan aquí
 * para poder RE-TEÑIR su geometría a la paleta cerrada de la demo sin tocar el
 * paquete: es tema encima, no fork.
 */
const HEX_KIT = Object.freeze({
  MATRIZ:  0x00ff41,  // MATRIX_GREEN — tramas, wireframes, línea central
  CIAN:    0x00d4ff,  // CYAN — acentos y emissive del asiento
  VACIO:   0x050508,  // VOID — suelos
  ASIENTO: 0x101418   // gris del asiento procedural de anchor-marker
});

/** Nombre canónico del `dry` de cada calle: literal de los seeds reales
 *  `@zeus/startpack-ciudad/seeds/gamemap.json` (calle-funcional, calle-tecnico,
 *  calle-plugins, calle-mcp-vivos, calle-infra). */
const DRY_CALLE = Object.freeze({
  editores:      'funcional',
  'red-stream':  'tecnico',
  'runtime-mcp': 'plugins',
  'lore-voz':    'mcp-vivos',
  'infra-ui':    'infra'
});

// ── utilidades ──────────────────────────────────────────────────────────────

const pinza = (v, a, b) => (v < a ? a : v > b ? b : v);
const mezcla = (a, b, t) => a + (b - a) * t;

/** Easings (siempre suaves; nada lineal a la vista). */
const facil = Object.freeze({
  entrada: (t) => t * t * t,
  salida:  (t) => 1 - Math.pow(1 - t, 3),
  suave:   (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  seno:    (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  latido:  (t) => { const s = Math.sin(Math.PI * t); return s * s; }
});

/** Semilla determinista a partir del id: variedad sin azar. */
function semilla(txt) {
  let h = 2166136261;
  const s = String(txt);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/** Reparto entero por pesos (mayor resto): n elementos en K anillos. */
function repartir(n, pesos) {
  const total = pesos.reduce((s, p) => s + p, 0) || 1;
  const crudo = pesos.map((p) => (n * p) / total);
  const base = crudo.map(Math.floor);
  let resto = n - base.reduce((s, v) => s + v, 0);
  const orden = crudo
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < orden.length && resto > 0; k++, resto--) base[orden[k].i]++;
  return base;
}

// ── trazado (geometría de la ciudad, derivada del dato, sin three) ──────────

/**
 * Calcula el trazado urbano a partir del mapa: sectores por holón, mesetas por
 * distrito, anillos y posiciones por barrio, y la posición de la NOTARÍA.
 */
export function calcularTrazado(mapa) {
  const holones = [...(mapa.holones || [])].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const distritos = mapa.distritos || [];
  const listaBarrios = mapa.barrios || [];

  const barrios = new Map();
  listaBarrios.forEach((b, i) => {
    barrios.set(b.id, {
      id: b.id,
      slug: b.slug || b.id,
      nombre: b.displayName || b.slug || b.id,
      distrito: b.distrito,
      holonId: b.holonId,
      estado: b.estado || 'latente',
      aristas: (b.grafo && Number(b.grafo.handoffEdges)) || 0,
      indice: i,
      numero: i + 1
    });
  });
  const maxAristas = Math.max(1, ...[...barrios.values()].map((b) => b.aristas));

  // 1 · sector angular por holón, proporcional a su nº de barrios (mínimo 2).
  const peso = (h) => Math.max(2, (h.barrios || []).length);
  const sumaPesos = holones.reduce((s, h) => s + peso(h), 0) || 1;
  const disponible = TAU - GAP_HOLON * holones.length;

  const sectores = new Map();
  const reparto = [];
  let cursor = ANG_INICIAL;
  for (const h of holones) {
    const arco = (disponible * peso(h)) / sumaPesos;
    const banda = BANDAS[h.runtimeKind] || BANDAS.anchor;
    reparto.push({ holon: h, banda, arco, medio: cursor + arco / 2, clave: `${banda.rIn}:${banda.rOut}` });
    cursor += arco + GAP_HOLON;
  }
  // Los holones sin barrios viven en otra banda radial y pueden ensancharse,
  // pero sólo hasta donde quepan entre vecinos de SU MISMA banda.
  const porBanda = new Map();
  for (const p of reparto) {
    if (!porBanda.has(p.clave)) porBanda.set(p.clave, []);
    porBanda.get(p.clave).push(p);
  }
  const vuelta = (x) => { const v = x % TAU; return v <= 0 ? v + TAU : v; };
  for (const grupo of porBanda.values()) {
    grupo.sort((a, b) => a.medio - b.medio);
    grupo.forEach((p, i) => {
      let holgura = p.banda.arcoMin / 2;
      if (grupo.length > 1) {
        const ant = grupo[(i - 1 + grupo.length) % grupo.length];
        const sig = grupo[(i + 1) % grupo.length];
        holgura = Math.min(
          holgura,
          vuelta(p.medio - ant.medio) / 2 - GAP_HOLON / 2,
          vuelta(sig.medio - p.medio) / 2 - GAP_HOLON / 2
        );
      }
      const semi = Math.max(p.arco / 2, holgura);
      sectores.set(p.holon.id, {
        holon: p.holon,
        banda: p.banda,
        a0: p.medio - semi,
        a1: p.medio + semi,
        medio: p.medio,
        arco: semi * 2
      });
    });
  }

  // 2 · meseta por distrito dentro del sector de su holón.
  const maxBarriosDistrito = Math.max(1, ...distritos.map((d) => (d.barrios || []).length));
  const aristasDe = (d) => (d.barrios || []).reduce((s, id) => s + ((barrios.get(id) || {}).aristas || 0), 0);
  const maxAristasDistrito = Math.max(1, ...distritos.map(aristasDe));

  const mesetas = [];
  for (const [holonId, sector] of sectores) {
    const propios = distritos.filter((d) => d.holonId === holonId);
    if (propios.length === 0) {
      // Holón sin distritos (05 cantera, 06 constelación, 07 método): una sola
      // terraza que ocupa su sector — sin fingir barrios.
      mesetas.push({
        id: `holon-${holonId}`,
        nombre: sector.holon.name || sector.holon.slug || holonId,
        holonId,
        sector,
        a0: sector.a0, a1: sector.a1, medio: sector.medio,
        rIn: sector.banda.rIn, rOut: sector.banda.rOut,
        grosor: sector.banda.grosor,
        elevacion: sector.banda.base,
        color: PALETA.tinta,
        vacia: true,
        aristas: 0,
        barrios: []
      });
      continue;
    }
    const totalB = propios.reduce((s, d) => s + Math.max(1, (d.barrios || []).length), 0);
    const util = sector.arco - GAP_DISTRITO * propios.length;
    let a = sector.a0 + GAP_DISTRITO / 2;
    propios.forEach((d, idx) => {
      const nB = Math.max(1, (d.barrios || []).length);
      const arco = (util * nB) / totalB;
      const aristas = aristasDe(d);
      // Elevación: volumen de handoffs (log) + densidad de barrios.
      const elevacion = sector.banda.base
        + 2.45 * (Math.log1p(aristas) / Math.log1p(maxAristasDistrito))
        + 0.55 * ((d.barrios || []).length / maxBarriosDistrito);
      mesetas.push({
        id: d.id,
        nombre: d.displayName || d.id,
        holonId,
        sector,
        a0: a, a1: a + arco, medio: a + arco / 2,
        rIn: sector.banda.rIn, rOut: sector.banda.rOut,
        grosor: sector.banda.grosor,
        elevacion,
        color: COLOR_DISTRITO[d.id] ?? COLORES_RESPALDO[idx % COLORES_RESPALDO.length],
        vacia: false,
        aristas,
        barrios: [...(d.barrios || [])]
      });
      a += arco + GAP_DISTRITO;
    });
  }

  // 3 · anillos y posición de cada barrio dentro de su meseta.
  for (const m of mesetas) {
    if (m.vacia || m.barrios.length === 0) { m.anillos = []; continue; }
    const n = m.barrios.length;
    const nAnillos = n <= 3 ? 1 : 2;
    const radios = [];
    for (let k = 0; k < nAnillos; k++) radios.push(m.rIn + (m.rOut - m.rIn) * ((k + 1) / (nAnillos + 1)));
    const cuentas = repartir(n, radios);
    const margen = Math.min((m.a1 - m.a0) * 0.12, 0.07);
    const a0 = m.a0 + margen;
    const a1 = m.a1 - margen;
    m.anillos = [];
    let cursorB = 0;
    for (let k = 0; k < nAnillos; k++) {
      const cuantos = cuentas[k];
      const ids = m.barrios.slice(cursorB, cursorB + cuantos);
      cursorB += cuantos;
      // Anillos alternos al tresbolillo: nada se alinea radialmente.
      const desfase = (k % 2) * 0.5;
      const puntos = ids.map((id, j) => {
        const t = cuantos === 1 ? 0.5 : (j + 0.5 + desfase) / cuantos;
        const ang = mezcla(a0, a1, t);
        const b = barrios.get(id);
        if (b) {
          b.radio = radios[k];
          b.angulo = ang;
          b.elevacion = m.elevacion;
          b.distritoRef = m;
          b.anillo = k;
          b.color = m.color;
        }
        return { id, ang, radio: radios[k] };
      });
      m.anillos.push({ radio: radios[k], puntos });
    }
    m.paseo = m.rIn + (m.rOut - m.rIn) * 0.12; // paseo interior del distrito
    m.hub = { radio: m.paseo, ang: m.medio, y: m.elevacion };
  }

  // 4 · NOTARÍA: en la zona del holón 07 (método), elevada sobre su terraza.
  const holon07 = holones.find((h) => h.runtimeKind === 'metodo')
    || holones.find((h) => String(h.id) === '07')
    || holones[holones.length - 1];
  const sector07 = sectores.get(holon07 && holon07.id);
  const mesetaNotaria = mesetas.find((m) => m.holonId === (holon07 && holon07.id));
  const notaria = {
    holon: holon07,
    ang: sector07 ? sector07.medio : 0,
    radio: sector07 ? (sector07.banda.rIn + sector07.banda.rOut) / 2 : 6.5,
    elevacion: mesetaNotaria ? mesetaNotaria.elevacion : 7,
    altura: 7.6
  };

  return { holones, sectores, mesetas, barrios, notaria, maxAristas, maxAristasDistrito };
}

// ── adaptación mapa.json → gamemap real ─────────────────────────────────────

/** Punto polar → cartesiano, sin three (misma convención que `punto()`). */
const punto3 = (radio, ang, y = 0) => ({
  x: radio * Math.cos(ang), y, z: -radio * Math.sin(ang)
});

/** Cuánto se separa el asiento (ancla) del eje de su torre, en radio. */
const DESVIO_ANCLA = 1.15;

/** Delta angular más corto (para que las calles no den la vuelta a la ciudad). */
function anguloCorto(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Rumbo en grados (convención del motor: 0 = +Z) desde `a` mirando a `b`. */
function rumboHacia(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (dx === 0 && dz === 0) return 0;
  return (Math.atan2(dx, dz) * 180) / Math.PI;
}

/** Calle en polar: interpola radio/ángulo/altura para que siga el urbanismo. */
function calleWaypoints(a, b, n = 2) {
  const pts = [];
  const dAng = anguloCorto(a.ang, b.ang);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(punto3(
      a.radio + (b.radio - a.radio) * t,
      a.ang + dAng * t,
      a.y + (b.y - a.y) * t
    ));
  }
  return pts;
}

/**
 * `mapa.json` (holones/distritos/barrios) → **gamemap** con la forma exacta que
 * consume `sceneFromGamemap` de `@zeus/ciudad/scene`.
 *
 * La forma se copió de los seeds REALES —
 * `node_modules/@zeus/startpack-ciudad/seeds/gamemap.json`, leído en disco — y
 * la topología coincide barrio a barrio: los ids de distrito del mapa
 * (`zigurat`, `editores`, `red-stream`, `runtime-mcp`, `lore-voz`, `infra-ui`)
 * son los mismos ids de nodo del startpack, y las anclas salen con el mismo
 * patrón `ancla-<barrioId>`. Lo único propio de la demo son las POSICIONES:
 * vienen del urbanismo R1 (`calcularTrazado`), que las deriva del dato.
 *
 * Diferencias declaradas frente al startpack (el mapa de la demo dice más):
 *   · `estado` de cada ancla sale de `mapa.barrios[].estado` (vivo/latente/muerto).
 *   · cada ancla lleva `handoffEdges`, que el startpack no tiene.
 *   · los holones sin distrito (05 cantera, 06 constelación) entran como nodos
 *     con `razonSinBarrio`: el cero también es dato.
 *
 * @param {object} mapa   mapa.json ya parseado
 * @param {object} [trazado] resultado de `calcularTrazado(mapa)` (se reutiliza)
 * @returns {{id:string, sceneId:string, displayName:string, nodos:object,
 *            enlaces:object, anclas:object, gobierno:object, zones:Array,
 *            defaultAnchorByNode:object}}
 */
export function gamemapDesdeMapa(mapa, trazado = calcularTrazado(mapa)) {
  const nodos = {};
  const enlaces = {};
  const anclas = {};
  const zones = [];
  const defaultAnchorByNode = {};

  // 1 · plaza de gobierno = la terraza del holón 07 (método), donde vive la
  //     NOTARÍA. Su id es el SPAWN_NODE_ID real del contrato: 'plaza'.
  const not = trazado.notaria;
  const plazaPolar = { radio: not.radio, ang: not.ang, y: not.elevacion };
  nodos.plaza = {
    id: 'plaza',
    displayName: 'Plaza de la NOTARÍA',
    role: 'gobierna',
    kind: 'gobierno',
    entrada: { ...punto3(not.radio, not.ang, not.elevacion), facing: 0 },
    holonId: not.holon ? not.holon.id : null,
    mesetaId: not.holon ? `holon-${not.holon.id}` : null,
    anclas: [],
    enlaces: []
  };

  // 2 · un nodo por distrito, en el hub (paseo interior) de su meseta.
  const polarDe = new Map([['plaza', plazaPolar]]);
  for (const m of trazado.mesetas) {
    if (m.vacia) continue;
    const polar = m.hub
      ? { radio: m.hub.radio, ang: m.hub.ang, y: m.elevacion }
      : { radio: (m.rIn + m.rOut) / 2, ang: m.medio, y: m.elevacion };
    polarDe.set(m.id, polar);
    const esZigurat = m.id === 'zigurat';
    nodos[m.id] = {
      id: m.id,
      displayName: m.nombre,
      role: esZigurat ? 'opera' : 'ejecuta',
      kind: esZigurat ? 'gobierno-zona' : 'zona',
      entrada: { ...punto3(polar.radio, polar.ang, polar.y), facing: 0 },
      holonId: m.holonId,
      mesetaId: m.id,
      handoffEdges: m.aristas,
      anclas: [],
      enlaces: []
    };
    zones.push({
      id: m.id,
      displayName: m.nombre,
      role: nodos[m.id].role,
      nodeId: m.id,
      barrios: [...m.barrios]
    });
  }

  // 3 · holones sin distrito: existen y se dicen (cantera / constelación).
  for (const m of trazado.mesetas) {
    if (!m.vacia) continue;
    if (m.holonId === (not.holon && not.holon.id)) continue; // ése es la plaza
    const holon = trazado.holones.find((h) => h.id === m.holonId);
    const polar = { radio: (m.rIn + m.rOut) / 2, ang: m.medio, y: m.elevacion };
    polarDe.set(m.id, polar);
    nodos[m.id] = {
      id: m.id,
      displayName: m.nombre,
      role: 'ejecuta',
      kind: holon ? String(holon.runtimeKind) : 'zona',
      entrada: { ...punto3(polar.radio, polar.ang, polar.y), facing: 0 },
      holonId: m.holonId,
      mesetaId: m.id,
      sinBarrios: true,
      razonSinBarrio: (holon && holon.razonSinBarrio) || null,
      anclas: [],
      enlaces: []
    };
  }

  // 4 · un ancla por barrio, con la posición que le dio el urbanismo.
  const notariaXYZ = punto3(not.radio, not.ang, not.elevacion);
  for (const b of trazado.barrios.values()) {
    if (b.radio === undefined) continue; // barrio sin distrito posicionado
    const nodoId = b.distrito;
    const nodo = nodos[nodoId];
    if (!nodo) continue;
    const id = `ancla-${b.id}`;
    // El ancla es el ASIENTO junto al edificio, desplazado hacia fuera para no
    // quedar dentro de la torre. Mismo criterio que los seeds reales, donde
    // `ancla-vscode-extension` está en x=14 y la entrada del nodo zigurat en x=12.
    const pos = punto3(b.radio + DESVIO_ANCLA, b.angulo, b.elevacion);
    anclas[id] = {
      id,
      parent: nodoId,
      displayName: b.nombre,
      barrioId: b.id,
      slug: b.slug,
      estado: b.estado,
      position: pos,          // asiento junto al edificio, no dentro
      posicionEdificio: punto3(b.radio, b.angulo, b.elevacion),
      // Cada barrio mira a la NOTARÍA: la ceremonia sube por ahí.
      facing: Math.round(rumboHacia(pos, notariaXYZ) * 100) / 100,
      slot: 'sit',
      kind: 'gamething.barrio',
      holonId: b.holonId,
      handoffEdges: b.aristas
    };
    nodo.anclas.push(id);
    if (!defaultAnchorByNode[nodoId]) defaultAnchorByNode[nodoId] = id;
  }

  // 5 · calles: plaza → zigurat y zigurat → cada distrito, con los ids y los
  //     `dry` literales del startpack real. Sendas de servicio a los holones
  //     sin barrios, colgando de la plaza.
  const unir = (id, from, to, dry, rotulo) => {
    const a = polarDe.get(from);
    const c = polarDe.get(to);
    if (!a || !c) return;
    const waypoints = calleWaypoints(a, c, 2);
    enlaces[id] = {
      id,
      displayName: rotulo || `Calle ${dry}`,
      dry,
      from,
      to,
      bidirectional: true,
      walkSpeed: 1.4,
      waypoints
    };
    if (nodos[from]) nodos[from].enlaces.push(id);
    if (nodos[to]) nodos[to].enlaces.push(id);
  };

  if (nodos.zigurat) unir('calle-plaza-zigurat', 'plaza', 'zigurat', 'gobierno');
  for (const id of Object.keys(nodos)) {
    if (id === 'plaza' || id === 'zigurat') continue;
    if (nodos[id].sinBarrios) {
      unir(`senda-${id}`, 'plaza', id, nodos[id].kind, `Senda a ${nodos[id].displayName}`);
      continue;
    }
    const dry = DRY_CALLE[id] || id;
    unir(`calle-${dry}`, nodos.zigurat ? 'zigurat' : 'plaza', id, dry);
  }

  return {
    id: 'prueba-hm-ciudad',
    sceneId: String(mapa.kind || 'ciudad') + '-' + String(mapa.version || 'v0'),
    version: mapa.version ?? 0,
    displayName: 'Ciudad de holones · Prueba de H·M',
    gobierno: { gobierna: 'plaza', opera: 'zigurat', ejecutan: 'barrios' },
    zones,
    nodos,
    enlaces,
    anclas,
    defaultAnchorByNode
  };
}

// ── carga del mecanismo real de @zeus/ciudad (montaje de W-SERVER-REAL) ──────

/**
 * Trae `sceneFromGamemap` / `nodesReachable` / `BARRIO_ESTADOS` / `SPAWN_NODE_ID`
 * REALES de `@zeus/ciudad`. Es import dinámico —y no estático— por una razón
 * declarada: el montaje `/zeus-ciudad/` y su entrada en el import map los
 * publica W-SERVER-REAL; si aún no están en canal, la ciudad debe seguir
 * dibujándose y decir que la proyección falta, NO reimplementarla.
 *
 * `scene.mjs` importa `./contract.mjs`, que a su vez importa `@zeus/protocol`
 * (verificado browser-safe: su índice sólo encadena contract/roles/gates/acl/
 * peer-card/game-state-delta; `peer-card-seat.mjs`, el único con `node:crypto`,
 * NO entra por el índice). Por eso el import map necesita también `@zeus/protocol`.
 */
const CANDIDATOS = Object.freeze({
  scene: ['@zeus/ciudad/scene.mjs', '@zeus/ciudad/scene', '/zeus-ciudad/scene.mjs'],
  contract: ['@zeus/ciudad/contract.mjs', '@zeus/ciudad/contract', '/zeus-ciudad/contract.mjs']
});

async function primeroQueCargue(especificadores, requiere) {
  const fallos = [];
  for (const esp of especificadores) {
    try {
      const mod = await import(/* @vite-ignore */ esp);
      if (requiere.every((k) => mod[k] !== undefined)) return { mod, esp };
      fallos.push(`${esp}: sin ${requiere.filter((k) => mod[k] === undefined).join('/')}`);
    } catch (e) {
      fallos.push(`${esp}: ${(e && e.message) || e}`);
    }
  }
  return { mod: null, esp: null, fallos };
}

/**
 * @returns {Promise<{scene:object|null, sceneEsp:string|null, contract:object|null,
 *                    contractEsp:string|null, motivos:Record<string,string>}>}
 */
export async function cargarCiudadReal() {
  const motivos = {};
  const s = await primeroQueCargue(CANDIDATOS.scene, ['sceneFromGamemap', 'nodesReachable']);
  if (!s.mod) motivos.scene = `no resoluble desde el navegador → ${(s.fallos || []).join(' · ')}`;
  const c = await primeroQueCargue(CANDIDATOS.contract, ['BARRIO_ESTADOS', 'SPAWN_NODE_ID']);
  if (!c.mod) motivos.contract = `no resoluble desde el navegador → ${(c.fallos || []).join(' · ')}`;
  return { scene: s.mod, sceneEsp: s.esp, contract: c.mod, contractEsp: c.esp, motivos };
}

// ── módulo ──────────────────────────────────────────────────────────────────

/**
 * Construye la ciudad y la añade a la escena.
 *
 * @param {object}  cfg
 * @param {object}  cfg.scene  escena three donde colgar el grupo
 * @param {object|string} [cfg.mapa]  mapa ya parseado (o URL; por defecto /mapa.json)
 * @param {object}  [cfg.THREE] namespace three (si falta se importa dinámicamente)
 * @param {object}  [cfg.opciones] ajustes finos opcionales
 * @returns {Promise<object>} api de la ciudad
 */
export async function createCiudad({ scene, mapa, THREE, opciones = {} } = {}) {
  const T = THREE || (await import('three'));
  const datos = await resolverMapa(mapa);
  const trazado = calcularTrazado(datos);
  const idDestacado = opciones.destacado || ID_DESTACADO;

  /* ── proyección real ─────────────────────────────────────────────────────
     El gamemap es dato propio (adaptado del mapa); la ESCENA es la proyección
     que hace `sceneFromGamemap` real. Si el paquete no está en canal, `escena`
     queda null y se dice: aquí no se falsifica una proyección.               */
  const gamemap = gamemapDesdeMapa(datos, trazado);
  const real = await cargarCiudadReal();

  const frontera = { real: [], pendiente: [] };
  const anotarReal = (t) => frontera.real.push(t);
  const anotarPend = (que, motivo) => frontera.pendiente.push({ que, motivo });

  anotarReal('@zeus/ui-3d-kit · createNodeMesh (stage/node-mesh.mjs) — un disco por nodo');
  anotarReal('@zeus/ui-3d-kit · createAnchorMarker (stage/anchor-marker.mjs) — un asiento por ancla');
  anotarReal('@zeus/ui-3d-kit · createLinkCorridorBetween (stage/link-corridor.mjs) — un corredor por tramo');
  anotarReal('@zeus/ui-3d-kit · createTrajectoryManager (core/trajectory-manager.mjs) — tráfico de handoffs');
  anotarReal('@zeus/game-engine · sampleLink + linkDistance — troceado por longitud de arco real');
  anotarPend(
    '@zeus/ui-3d-kit · createSceneManager',
    'monta renderer, cámara, OrbitControls y bucle rAF propios; en esta demo main.mjs ya los posee y entrega una `scene` ajena — adoptarlo rompe la firma createCiudad({scene}) y duplica el bucle'
  );
  anotarPend(
    '@zeus/ui-3d-kit · createAnimationController',
    'su update() no acepta dt (usa THREE.Clock interno) y la demo impone un único reloj ciudad.update(dt); además no expone retardo por animación, que es lo que necesita el revelado escalonado'
  );

  let escena = null;
  if (real.scene) {
    escena = real.scene.sceneFromGamemap(gamemap);
    anotarReal(`@zeus/ciudad/scene · sceneFromGamemap (${real.sceneEsp}) — ${Object.keys(escena.barrios).length} barrios proyectados, spawn '${escena.spawnNodeId}'`);
  } else {
    anotarPend('@zeus/ciudad/scene · sceneFromGamemap + nodesReachable', real.motivos.scene);
    console.warn('[ciudad] proyección real no disponible; se dibuja el gamemap crudo, y `escena` queda null.', real.motivos.scene);
  }

  // Vocabulario de estados: se valida contra el real, no contra el nuestro.
  let estadosCanonicos = null;
  if (real.contract) {
    estadosCanonicos = real.contract.BARRIO_ESTADOS;
    anotarReal(`@zeus/ciudad/contract · BARRIO_ESTADOS + SPAWN_NODE_ID (${real.contractEsp})`);
    const desconocidos = [...new Set(
      [...trazado.barrios.values()].map((b) => b.estado).filter((e) => !estadosCanonicos.includes(e))
    )];
    if (desconocidos.length) {
      console.warn(`[ciudad] estados fuera de BARRIO_ESTADOS reales: ${desconocidos.join(', ')}`);
      anotarPend('estados del mapa', `fuera de BARRIO_ESTADOS: ${desconocidos.join(', ')}`);
    }
    const spawn = real.contract.SPAWN_NODE_ID;
    if (!gamemap.nodos[spawn]) {
      anotarPend('nodo de spawn', `SPAWN_NODE_ID='${spawn}' no existe en el gamemap adaptado`);
    }
  } else {
    anotarPend('@zeus/ciudad/contract · BARRIO_ESTADOS + SPAWN_NODE_ID', real.motivos.contract);
  }

  // Alcanzabilidad real: ¿se puede caminar de la plaza al barrio del descenso?
  const alcanzable = (barrioId) => {
    if (!real.scene) return null;                      // no se finge un true
    const ancla = gamemap.anclas[`ancla-${barrioId}`];
    if (!ancla) return false;
    return real.scene.nodesReachable(gamemap.enlaces, gamemap.gobierno.gobierna, ancla.parent);
  };
  if (real.scene) {
    const ok = alcanzable(idDestacado);
    anotarReal(`@zeus/ciudad/scene · nodesReachable — plaza→${idDestacado}: ${ok ? 'sí' : 'NO'}`);
    if (!ok) console.warn(`[ciudad] el barrio ${idDestacado} no es alcanzable desde la plaza`);
  }

  const menosMovimiento = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const col = (hex) => new T.Color(hex);
  const tinte = (a, b, t) => col(a).lerp(col(b), t);
  const punto = (radio, ang, y = 0) => new T.Vector3(radio * Math.cos(ang), y, -radio * Math.sin(ang));

  const group = new T.Group();
  group.name = 'ciudad';

  const desechables = [];   // {dispose()} sueltos (texturas de bruma, etc.)
  const animables = [];     // {retardo, duracion, aplicar(p)} para el revelado
  const latidos = [];       // {tic(t, dt)} para la animación continua
  const anclas = new Map(); // id → {base, cima, grupo, malla}
  const marcasKit = new Map(); // barrioId → grupo del createAnchorMarker real

  // ── atmósfera: niebla de altura ──────────────────────────────────────────
  const fogPrevio = scene ? scene.fog : null;
  const nieblaPropia = new T.FogExp2(PALETA.sepia, opciones.densidadNiebla ?? 0.0128);
  if (scene) scene.fog = nieblaPropia;

  const colorBruma = tinte(PALETA.sepia, PALETA.tinta, 0.14);
  const bruma = new T.Group();
  bruma.name = 'ciudad-bruma';
  {
    // Cilindro-velo con degradado vertical: densa abajo (donde se hunden las
    // canteras), transparente arriba. Lee como niebla de altura desde
    // cualquier ángulo, sin tocar shaders ajenos.
    const texVelo = texturaDegradadoVertical(T);
    if (texVelo) desechables.push(texVelo);
    const velo = new T.Mesh(
      new T.CylinderGeometry(78, 78, ALTURA_BRUMA, 72, 1, true),
      new T.MeshBasicMaterial({
        map: texVelo, color: colorBruma, transparent: true, opacity: 0.52,
        side: T.BackSide, depthWrite: false, fog: false
      })
    );
    velo.position.y = ALTURA_BRUMA / 2 - 30;
    bruma.add(velo);

    // Dos discos de bruma baja que giran en sentidos opuestos, muy despacio.
    const texDisco = texturaDiscoBruma(T);
    if (texDisco) desechables.push(texDisco);
    [
      { y: -3.2, r: 96, op: 0.20, vel:  0.0075 },
      { y:  0.9, r: 78, op: 0.11, vel: -0.0052 }
    ].forEach((cfg, i) => {
      const disco = new T.Mesh(
        new T.CircleGeometry(cfg.r, 72),
        new T.MeshBasicMaterial({
          map: texDisco, color: colorBruma, transparent: true, opacity: cfg.op,
          depthWrite: false, side: T.DoubleSide, fog: false
        })
      );
      disco.rotation.x = -Math.PI / 2;
      disco.position.y = cfg.y;
      disco.renderOrder = -10 + i;
      bruma.add(disco);
      latidos.push({ tic: (t) => { disco.rotation.z = t * cfg.vel * TAU; } });
    });
  }
  group.add(bruma);

  // ── luz propia, sobria: la ciudad se ve aunque el integrador no aporte ───
  const luces = new T.Group();
  luces.name = 'ciudad-luz';
  const hemi = new T.HemisphereLight(PALETA.tinta, PALETA.sepia, 0.85);
  hemi.position.set(0, 40, 0);
  const sol = new T.DirectionalLight(PALETA.tinta, 0.9);
  sol.position.set(22, 34, 16);
  luces.add(hemi, sol);
  group.add(luces);

  // ── mesetas por distrito ─────────────────────────────────────────────────
  const capaMesetas = new T.Group();
  capaMesetas.name = 'ciudad-mesetas';
  trazado.mesetas.forEach((m, i) => {
    const geo = geometriaMeseta(T, m.rIn, m.rOut, m.a0, m.a1, m.grosor);
    const base = m.vacia ? tinte(PALETA.sepia, PALETA.tinta, 0.10) : tinte(m.color, PALETA.sepia, 0.78);
    const mat = new T.MeshStandardMaterial({
      color: base,
      emissive: m.vacia ? tinte(PALETA.sepia, PALETA.tinta, 0.05) : tinte(m.color, PALETA.sepia, 0.88),
      emissiveIntensity: m.vacia ? 0.30 : 0.62,
      roughness: 0.92,
      metalness: 0.06
    });
    const malla = new T.Mesh(geo, mat);
    malla.name = `meseta:${m.id}`;
    malla.userData = { tipo: 'meseta', id: m.id, distrito: m.id, holonId: m.holonId };
    malla.position.y = m.elevacion;
    capaMesetas.add(malla);
    m.malla = malla;

    const retardo = 0.02 * i;
    animables.push({
      retardo,
      duracion: 0.55,
      aplicar: (p) => { malla.position.y = mezcla(m.elevacion - 7.5, m.elevacion, facil.salida(p)); }
    });

    // Cornisa: un filo emissive en el borde exterior de la meseta.
    if (!m.vacia) {
      const cornisa = new T.Mesh(
        new T.TorusGeometry(m.rOut - 0.06, 0.055, 6, 96, m.a1 - m.a0),
        new T.MeshStandardMaterial({
          color: tinte(m.color, PALETA.sepia, 0.35),
          emissive: m.color, emissiveIntensity: 0.5,
          roughness: 0.6, metalness: 0.2, transparent: true, opacity: 0.85
        })
      );
      cornisa.rotation.x = -Math.PI / 2;
      cornisa.rotation.z = m.a0;
      malla.add(cornisa);
      cornisa.position.y = 0;
    }
  });
  group.add(capaMesetas);

  // ── barrios: node-mesh por barrio, color por distrito ────────────────────
  const capaBarrios = new T.Group();
  capaBarrios.name = 'ciudad-barrios';
  // Tabla hoisted a módulo: sus claves son BARRIO_ESTADOS reales (incl. 'roto').
  const ESTADOS = ESTADOS_VISUAL;

  let indiceBarrio = 0;
  for (const b of trazado.barrios.values()) {
    if (b.radio === undefined) continue; // barrio sin distrito posicionado
    const est = ESTADOS[b.estado] || ESTADOS.latente;
    const rel = Math.log1p(b.aristas) / Math.log1p(trazado.maxAristas);
    const altura = (1.15 + 2.9 * rel) * est.alturaK;
    const radio = (0.62 + 0.26 * rel) * est.radioK;
    const colorBase = tinte(b.color, PALETA.sepia, est.apagado);

    const nodo = new T.Group();
    const pos = punto(b.radio, b.angulo, b.elevacion);
    nodo.position.copy(pos);
    nodo.rotation.y = semilla(b.id) * TAU;
    nodo.name = `barrio:${b.id}`;
    nodo.userData = {
      tipo: 'barrio', id: b.id, nombre: b.nombre, distrito: b.distrito,
      holonId: b.holonId, estado: b.estado, aristas: b.aristas, numero: b.numero
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
      opacity: est.opacidad
    });
    const torre = new T.Mesh(geoTorre, matTorre);
    torre.userData = nodo.userData;
    nodo.add(torre);

    // Corona: sólo los barrios con handoffs registrados la lucen; su radio
    // sale del contador. Honestidad del dato hecha geometría.
    if (b.aristas > 0) {
      const corona = new T.Mesh(
        new T.TorusGeometry(radio * (1.25 + 0.5 * rel), 0.045 + 0.03 * rel, 8, 40),
        new T.MeshStandardMaterial({
          color: tinte(b.color, PALETA.tinta, 0.35),
          emissive: tinte(b.color, PALETA.oro, 0.3),
          emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.35
        })
      );
      corona.rotation.x = -Math.PI / 2;
      corona.position.y = altura + 0.22;
      nodo.add(corona);
      latidos.push({
        tic: (t) => { corona.rotation.z = facil.seno(((t * 0.06 + semilla(b.id)) % 1)) * TAU * 0.25; }
      });
    }

    capaBarrios.add(nodo);
    anclas.set(b.id, {
      barrio: b,
      grupo: nodo,
      malla: torre,
      material: matTorre,
      base: pos.clone(),
      cima: pos.clone().setY(pos.y + altura),
      altura
    });

    const retardo = 0.26 + 0.012 * indiceBarrio;
    animables.push({
      retardo,
      duracion: 0.5,
      aplicar: (p) => { nodo.scale.y = 0.001 + 0.999 * facil.salida(p); }
    });
    indiceBarrio++;
  }
  group.add(capaBarrios);

  /* ══════════════════════════════════════════════════════════════════════════
     ESCENA REAL — geometría de @zeus/ui-3d-kit sobre el gamemap adaptado
     Cada pieza del kit se cuelga de la meseta de su nodo, de modo que sube con
     ella en el revelado y muere con ella en dispose(). Del kit se conserva la
     geometría entera; sólo se re-tiñe el color (ver `tematizar`).
     ══════════════════════════════════════════════════════════════════════════ */

  const mesetaPorId = new Map(trazado.mesetas.map((m) => [m.id, m]));
  const matKit = [];                       // {m, objetivo} para el fundido
  const vistosKit = new Set();             // materiales compartidos: una vez
  const recogerKit = (raiz) => {
    raiz.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) {
        if (vistosKit.has(m)) continue;
        vistosKit.add(m);
        matKit.push({ m, objetivo: m.opacity ?? 1 });
        m.opacity = 0;
      }
    });
  };

  // ── un createNodeMesh REAL por nodo del gamemap ──────────────────────────
  const capaNodos = new T.Group();
  capaNodos.name = 'ciudad-nodos';
  for (const nodo of Object.values(gamemap.nodos)) {
    const m = mesetaPorId.get(nodo.mesetaId);
    const anfitrion = (m && m.malla) || capaNodos;
    const color = m && !m.vacia ? m.color : PALETA.oro;
    // El radio del disco sale del dato: cuántas anclas cuelgan del nodo.
    const cuantas = (nodo.anclas || []).length;
    const radio = nodo.id === 'plaza' ? 2.7 : pinza(1.15 + 0.2 * cuantas, 1.15, 3.1);

    const disco = createNodeMesh({ radius: radio, color, segments: 40, name: `nodo:${nodo.id}` });
    tematizar(disco, {
      acento: color,
      trama: tinte(color, PALETA.tinta, 0.25),
      fondo: tinte(PALETA.sepia, color, 0.16),
      alfa: nodo.sinBarrios ? 0.42 : 0.9
    });
    disco.userData = {
      tipo: 'nodo', id: nodo.id, kind: nodo.kind, role: nodo.role,
      holonId: nodo.holonId, anclas: cuantas, razonSinBarrio: nodo.razonSinBarrio || null
    };
    // Coordenadas locales de la meseta: su cara superior es y = 0.
    disco.position.set(nodo.entrada.x, m && m.malla ? 0.045 : nodo.entrada.y + 0.045, nodo.entrada.z);
    recogerKit(disco);
    anfitrion.add(disco);
  }
  group.add(capaNodos);

  // ── un createAnchorMarker REAL por ancla (los 24 barrios) ────────────────
  const capaAnclas = new T.Group();
  capaAnclas.name = 'ciudad-anclas';
  for (const ancla of Object.values(gamemap.anclas)) {
    const b = trazado.barrios.get(ancla.barrioId);
    const m = b && b.distritoRef;
    const anfitrion = (m && m.malla) || capaAnclas;
    const est = ESTADOS[ancla.estado] || ESTADOS.latente;
    const color = (b && b.color) || PALETA.tinta;

    const marca = createAnchorMarker({
      // `position`/`facing` son los del ancla: el kit los aplica tal cual.
      position: {
        x: ancla.position.x,
        y: m && m.malla ? 0.02 : ancla.position.y + 0.02,
        z: ancla.position.z
      },
      facing: ancla.facing,
      color,
      name: ancla.id
    });
    marca.scale.setScalar(0.62 + 0.22 * est.alturaK);
    tematizar(marca, {
      acento: tinte(color, PALETA.tinta, 0.2),
      trama: color,
      fondo: tinte(PALETA.sepia, color, 0.22),
      alfa: est.opacidad * 0.9
    });
    marca.userData = {
      tipo: 'ancla', id: ancla.id, barrio: ancla.barrioId,
      estado: ancla.estado, parent: ancla.parent, handoffEdges: ancla.handoffEdges
    };
    recogerKit(marca);
    anfitrion.add(marca);
    marcasKit.set(ancla.barrioId, marca);
  }
  group.add(capaAnclas);

  // ── un createLinkCorridorBetween REAL por tramo de calle ─────────────────
  // El troceado NO es a ojo: `linkDistance` da la longitud real de la polilínea
  // y `sampleLink` devuelve el punto a un progreso dado con parametrización por
  // longitud de arco. Ambas son del motor publicado, no reimplementadas.
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
      const corredor = createLinkCorridorBetween(a, c, {
        width: 1.55 * gasto, height: 1.2 * gasto, segments: 5
      });
      corredor.name = `${enlace.id}#${i}`;
      corredor.userData = { tipo: 'enlace', id: enlace.id, dry: enlace.dry, tramo: i, largo };
      tematizar(corredor, {
        acento: tinte(color, PALETA.oro, 0.3),
        trama: tinte(color, PALETA.tinta, 0.15),
        fondo: tinte(PALETA.sepia, color, 0.2),
        alfa: 0.5 * gasto
      });
      recogerKit(corredor);
      capaEnlaces.add(corredor);
    }
  }
  group.add(capaEnlaces);

  animables.push({
    retardo: 0.44, duracion: 0.56,
    aplicar: (p) => {
      const e = facil.salida(p);
      for (const { m, objetivo } of matKit) m.opacity = objetivo * e;
    }
  });

  // ── calles: paseos, radiales y anillos (todo dentro de cada distrito) ────
  const trazos = { pos: [], col: [] };
  const empujarPolilinea = (puntos, color, alfa) => {
    const c = col(color).multiplyScalar(alfa);
    for (let i = 0; i < puntos.length - 1; i++) {
      const p = puntos[i], q = puntos[i + 1];
      trazos.pos.push(p.x, p.y, p.z, q.x, q.y, q.z);
      trazos.col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
  };
  const arco = (radio, a0, a1, y, n = 18) => {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(punto(radio, mezcla(a0, a1, i / n), y));
    return pts;
  };

  for (const m of trazado.mesetas) {
    if (m.vacia || !m.anillos || m.anillos.length === 0) continue;
    const yCalle = m.elevacion + 0.035;
    const alfaBase = 0.30 + 0.35 * (Math.log1p(m.aristas) / Math.log1p(trazado.maxAristasDistrito));

    // paseo interior del distrito
    empujarPolilinea(arco(m.paseo, m.a0 + 0.02, m.a1 - 0.02, yCalle, 22), m.color, alfaBase * 0.8);

    for (const anillo of m.anillos) {
      // calle-anillo: une barrios consecutivos del mismo anillo
      for (let i = 0; i < anillo.puntos.length - 1; i++) {
        empujarPolilinea(
          arco(anillo.radio, anillo.puntos[i].ang, anillo.puntos[i + 1].ang, yCalle, 10),
          m.color, alfaBase
        );
      }
      // radiales: de cada barrio al paseo
      for (const p of anillo.puntos) {
        const desde = punto(anillo.radio, p.ang, yCalle);
        const hasta = punto(m.paseo, p.ang, yCalle);
        const medio = punto(mezcla(anillo.radio, m.paseo, 0.5), mezcla(p.ang, m.medio, 0.22), yCalle + 0.02);
        const curva = new T.QuadraticBezierCurve3(desde, medio, hasta);
        empujarPolilinea(curva.getPoints(10), m.color, alfaBase * 0.75);
      }
    }
  }

  // ── avenidas de handoff: barrio → NOTARÍA, grosor por contador ───────────
  const notariaPos = punto(trazado.notaria.radio, trazado.notaria.ang, trazado.notaria.elevacion);
  const capaAvenidas = new T.Group();
  capaAvenidas.name = 'ciudad-avenidas';
  const avenidas = [];

  const bocaNotaria = (desde, alturaExtra = 0.85) => {
    const dir = new T.Vector3(desde.x - notariaPos.x, 0, desde.z - notariaPos.z);
    if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
    dir.normalize().multiplyScalar(2.1);
    return notariaPos.clone().add(dir).setY(notariaPos.y + alturaExtra);
  };

  for (const [id, ancla] of anclas) {
    const b = ancla.barrio;
    if (b.aristas <= 0) continue;
    const rel = b.aristas / trazado.maxAristas;
    const desde = ancla.cima.clone().add(new T.Vector3(0, 0.22, 0));
    const hasta = bocaNotaria(desde);
    const control = desde.clone().lerp(hasta, 0.5);
    control.y = Math.max(desde.y, hasta.y) + 2.4 + 2.2 * rel;
    const curva = new T.QuadraticBezierCurve3(desde, control, hasta);

    const radioTubo = 0.05 + 0.15 * rel;
    const colorAv = tinte(b.color, PALETA.oro, 0.42);
    const matAv = new T.MeshStandardMaterial({
      color: colorAv, emissive: colorAv,
      emissiveIntensity: 0.28 + 0.26 * rel,
      roughness: 0.45, metalness: 0.25,
      transparent: true, opacity: 0
    });
    const tubo = new T.Mesh(new T.TubeGeometry(curva, 56, radioTubo, 8, false), matAv);
    tubo.name = `avenida:${id}`;
    tubo.userData = { tipo: 'avenida', id, aristas: b.aristas };
    capaAvenidas.add(tubo);

    const opacidadFinal = 0.55 + 0.35 * rel;
    const emisionBase = matAv.emissiveIntensity;
    avenidas.push({ id, curva, material: matAv, rel });
    animables.push({
      retardo: 0.62 + 0.03 * avenidas.length,
      duracion: 0.5,
      aplicar: (p) => { matAv.opacity = opacidadFinal * facil.salida(p); }
    });
    const fase = semilla(id);
    latidos.push({
      tic: (t) => {
        const o = facil.seno(((t * 0.11 + fase) % 1));
        matAv.emissiveIntensity = emisionBase * (0.82 + 0.28 * o);
      }
    });
  }
  group.add(capaAvenidas);

  // ── tráfico de handoffs: createTrajectoryManager REAL del kit ────────────
  // Sustituye a la «mota» que R1 movía a mano sobre la curva. Los CANALES del
  // manager son los distritos del mapa y sus colores, la paleta cerrada; la
  // cadencia de cada emisor sale de `grafo.handoffEdges`, no de un reloj
  // inventado: onfalo-asesor-sdk (99) manda una pieza cada pocos segundos y
  // copilot-engine (2) casi nunca. El cero no emite: no hay tráfico fingido.
  const trayectorias = createTrajectoryManager({
    particleRadius: 0.17,
    curvature: 3.4,
    channelColors: { ...COLOR_DISTRITO, notaria: PALETA.oro }
  });
  trayectorias.setScene(capaAvenidas);

  const emisores = [];
  for (const [id, ancla] of anclas) {
    const b = ancla.barrio;
    if (b.aristas <= 0) continue;
    const rel = b.aristas / trazado.maxAristas;
    const desde = ancla.cima.clone().add(new T.Vector3(0, 0.3, 0));
    emisores.push({
      id,
      canal: b.distrito,
      desde,
      hasta: bocaNotaria(desde, 1.15),
      periodo: 11 / (0.55 + 4.2 * rel),        // s entre piezas
      velocidad: 1 / (2.6 + 1.7 * (1 - rel)),  // progreso/s → 2.6-4.3 s de vuelo
      reloj: semilla(id) * 7,                  // fases desalineadas, sin azar
      n: 0
    });
  }

  let trafico = 0;   // lo abre el revelado; con reduced-motion nunca se abre
  if (emisores.length) {
    animables.push({
      retardo: 0.78, duracion: 0.22,
      aplicar: (p) => { trafico = facil.salida(p); }
    });
    latidos.push({
      tic: (t, dt) => {
        // La pose estática de `prefers-reduced-motion` tica los latidos una vez
        // con dt=0: sin esta guarda soltaría partículas que ya nadie movería.
        if (menosMovimiento || trafico <= 0 || dt <= 0) return;
        for (const e of emisores) {
          e.reloj += dt;
          if (e.reloj < e.periodo) continue;
          e.reloj = 0;
          e.n += 1;
          trayectorias.createMessageParticle(
            `${e.id}#${e.n}`, e.desde, e.hasta, e.canal, e.velocidad
          );
        }
        trayectorias.updateParticles(dt);
      }
    });
  }

  // Distritos sin handoffs: una vía tenue hasta la NOTARÍA (el dato dice cero,
  // y el cero también se dibuja — pero apenas).
  for (const m of trazado.mesetas) {
    if (m.vacia || m.aristas > 0 || !m.hub) continue;
    const desde = punto(m.hub.radio, m.hub.ang, m.elevacion + 0.05);
    const hasta = bocaNotaria(desde, 0.35);
    const control = desde.clone().lerp(hasta, 0.5);
    control.y = Math.max(desde.y, hasta.y) + 1.9;
    empujarPolilinea(new T.QuadraticBezierCurve3(desde, control, hasta).getPoints(28), m.color, 0.16);
  }

  const capaCalles = new T.Group();
  capaCalles.name = 'ciudad-calles';
  if (trazos.pos.length) {
    const geoCalles = new T.BufferGeometry();
    geoCalles.setAttribute('position', new T.Float32BufferAttribute(trazos.pos, 3));
    geoCalles.setAttribute('color', new T.Float32BufferAttribute(trazos.col, 3));
    const matCalles = new T.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false
    });
    const calles = new T.LineSegments(geoCalles, matCalles);
    calles.name = 'calles';
    calles.renderOrder = 2;
    capaCalles.add(calles);
    animables.push({
      retardo: 0.5, duracion: 0.5,
      aplicar: (p) => { matCalles.opacity = 0.9 * facil.salida(p); }
    });
  }
  group.add(capaCalles);

  // ── NOTARÍA: landmark elevado en la zona del holón 07 ────────────────────
  const notaria = new T.Group();
  notaria.name = 'notaria';
  notaria.position.copy(notariaPos);
  notaria.userData = { tipo: 'notaria', holonId: trazado.notaria.holon && trazado.notaria.holon.id };
  {
    const h = trazado.notaria.altura;
    const oroClaro = tinte(PALETA.oro, PALETA.tinta, 0.3);

    const matPlinto = new T.MeshStandardMaterial({
      color: tinte(PALETA.oro, PALETA.sepia, 0.68),
      emissive: tinte(PALETA.oro, PALETA.sepia, 0.8),
      emissiveIntensity: 0.6, roughness: 0.8, metalness: 0.2
    });
    const plinto = new T.Mesh(new T.CylinderGeometry(2.5, 2.9, 0.7, 8), matPlinto);
    plinto.position.y = 0.35;
    notaria.add(plinto);

    const matFuste = new T.MeshStandardMaterial({
      color: tinte(PALETA.oro, PALETA.sepia, 0.32),
      emissive: PALETA.oro, emissiveIntensity: 0.34,
      roughness: 0.42, metalness: 0.45
    });
    const fuste = new T.Mesh(new T.CylinderGeometry(0.72, 1.5, h, 8, 1), matFuste);
    fuste.position.y = 0.7 + h / 2;
    notaria.add(fuste);

    const matRemate = new T.MeshStandardMaterial({
      color: oroClaro, emissive: PALETA.oro, emissiveIntensity: 0.9,
      roughness: 0.3, metalness: 0.6
    });
    const remate = new T.Mesh(new T.OctahedronGeometry(0.85, 0), matRemate);
    remate.position.y = 0.7 + h + 0.75;
    notaria.add(remate);

    // Anillo giratorio: el método que relee y ancla.
    const anillo = new T.Mesh(
      new T.TorusGeometry(2.05, 0.075, 10, 96),
      new T.MeshStandardMaterial({
        color: oroClaro, emissive: PALETA.oro, emissiveIntensity: 0.75,
        roughness: 0.3, metalness: 0.55, transparent: true, opacity: 0.92
      })
    );
    anillo.rotation.x = Math.PI / 2.35;
    anillo.position.y = 0.7 + h * 0.72;
    notaria.add(anillo);

    const faro = new T.PointLight(PALETA.oro, 26, 46, 2);
    faro.position.y = 0.7 + h + 0.75;
    notaria.add(faro);

    latidos.push({
      tic: (t) => {
        anillo.rotation.z = t * 0.22;
        anillo.rotation.y = Math.sin(t * 0.17) * 0.35;
        const r = facil.seno(((t * 0.13) % 1));
        remate.rotation.y = t * 0.16;
        remate.position.y = 0.7 + h + 0.75 + 0.16 * (r - 0.5);
        matRemate.emissiveIntensity = 0.78 + 0.28 * r;
        faro.intensity = 22 + 8 * r;
      }
    });
    animables.push({
      retardo: 0.04, duracion: 0.62,
      aplicar: (p) => {
        const e = facil.salida(p);
        notaria.scale.setScalar(0.02 + 0.98 * e);
        notaria.position.y = mezcla(notariaPos.y - 4.5, notariaPos.y, e);
      }
    });
  }
  group.add(notaria);

  // ── barrio destacado: pulso emissive muy contenido ───────────────────────
  const capaDestacado = new T.Group();
  capaDestacado.name = 'ciudad-destacado';
  const destacado = anclas.get(idDestacado);
  if (destacado) {
    const pos = destacado.base;
    const colorD = tinte(destacado.barrio.color, PALETA.oro, 0.34);

    const halo = new T.Mesh(
      new T.RingGeometry(1.25, 1.9, 72),
      new T.MeshBasicMaterial({
        color: colorD, transparent: true, opacity: 0,
        side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.copy(pos).add(new T.Vector3(0, 0.06, 0));
    capaDestacado.add(halo);

    const candil = new T.PointLight(PALETA.oro, 7, 16, 2);
    candil.position.copy(destacado.cima).add(new T.Vector3(0, 0.8, 0));
    capaDestacado.add(candil);

    // R1 movía aquí una «mota» a mano sobre la curva de la avenida. En R2 ese
    // tráfico lo lleva el `createTrajectoryManager` real del kit (arriba), que
    // además lo hace para TODOS los barrios con handoffs, no sólo el destacado.

    const emisionBase = destacado.material.emissiveIntensity;
    const colorFrio = destacado.material.color.clone();
    const colorCalido = colorFrio.clone().lerp(col(PALETA.oro), 0.28);
    let presencia = 0; // lo abre el revelado

    latidos.push({
      tic: (t) => {
        const e = facil.latido((t * 0.30) % 1);        // 0..1 suave, sin picos
        destacado.material.emissiveIntensity = emisionBase + 0.30 * e;
        destacado.material.emissive.copy(colorFrio).lerp(colorCalido, 0.55 * e);
        halo.material.opacity = (0.16 + 0.20 * e) * presencia;
        halo.scale.setScalar(1 + 0.10 * e);
        candil.intensity = (5.5 + 5.5 * e) * presencia;
      }
    });
    animables.push({
      retardo: 0.8, duracion: 0.2,
      aplicar: (p) => { presencia = facil.salida(p); }
    });
  }
  group.add(capaDestacado);

  // ── rótulos en español (distritos, NOTARÍA y barrio destacado) ──────────
  const capaRotulos = new T.Group();
  capaRotulos.name = 'ciudad-rotulos';
  const rotulos = [];
  const rotular = (texto, posicion, cfg = {}) => {
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
      punto(r, m.medio, y),
      { color: colorCss(tinte(m.vacia ? PALETA.tinta : m.color, PALETA.tinta, 0.45)), altura: m.vacia ? 1.15 : 1.45, opacidad: m.vacia ? 0.45 : 0.8 }
    );
  }
  rotular('NOTARÍA', notariaPos.clone().add(new T.Vector3(0, trazado.notaria.altura + 3.0, 0)), {
    color: colorCss(col(PALETA.oro)), altura: 1.9, opacidad: 0.95
  });
  if (destacado) {
    rotular(destacado.barrio.nombre, destacado.cima.clone().add(new T.Vector3(0, 1.5, 0)), {
      color: colorCss(tinte(PALETA.tinta, PALETA.oro, 0.35)), altura: 1.2, opacidad: 0.9
    });
  }
  animables.push({
    retardo: 0.82, duracion: 0.18,
    aplicar: (p) => {
      const e = facil.salida(p);
      for (const r of rotulos) r.sprite.material.opacity = r.opacidad * e;
    }
  });
  group.add(capaRotulos);

  // ── montaje ──────────────────────────────────────────────────────────────
  if (scene && typeof scene.add === 'function') scene.add(group);

  const centro = new T.Vector3(0, 1.2, 0);
  const radioCiudad = opciones.radio ?? RADIO_CIUDAD;

  // ── bucle: revelado + latidos + raíl de cámara opcional ──────────────────
  let revelado = menosMovimiento ? 1 : 0;
  let reloj = 0;
  let raf = 0;
  let externo = false;
  let vivo = true;
  let ultimo = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  let resolverListo = null;
  let promesaListo = null;
  let camaraAnim = null;

  function aplicarRevelado() {
    for (const a of animables) {
      const p = pinza((revelado - a.retardo) / a.duracion, 0, 1);
      a.aplicar(p);
    }
  }

  function paso(dt) {
    reloj += dt;
    if (revelado < 1) {
      revelado = pinza(revelado + dt / DUR_REVELADO, 0, 1);
      aplicarRevelado();
      if (revelado >= 1 && resolverListo && !camaraAnim) { resolverListo(); resolverListo = null; }
    }
    if (!menosMovimiento) for (const l of latidos) l.tic(reloj, dt);

    if (camaraAnim) {
      camaraAnim.t = pinza(camaraAnim.t + dt / camaraAnim.duracion, 0, 1);
      const e = facil.suave(camaraAnim.t);
      camaraAnim.camera.position.lerpVectors(camaraAnim.desdePos, camaraAnim.hastaPos, e);
      const mira = camaraAnim.desdeMira.clone().lerp(camaraAnim.hastaMira, e);
      if (camaraAnim.controls && camaraAnim.controls.target) {
        camaraAnim.controls.target.copy(mira);
        if (typeof camaraAnim.controls.update === 'function') camaraAnim.controls.update();
      } else {
        camaraAnim.camera.lookAt(mira);
      }
      if (camaraAnim.t >= 1) {
        camaraAnim = null;
        if (revelado >= 1 && resolverListo) { resolverListo(); resolverListo = null; }
      }
    }
  }

  function tic() {
    if (!vivo || externo) { raf = 0; return; }
    const ahora = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const dt = pinza(ahora - ultimo, 0, 0.1);
    ultimo = ahora;
    paso(dt);
    raf = requestAnimationFrame(tic);
  }

  aplicarRevelado();
  if (menosMovimiento) {
    // Sin movimiento: una pose estática amable, ya revelada.
    for (const l of latidos) l.tic(0.9, 0);
  } else if (typeof requestAnimationFrame === 'function') {
    raf = requestAnimationFrame(tic);
  } else {
    // Sin bucle disponible: mejor la ciudad entera que una ciudad invisible.
    revelado = 1;
    aplicarRevelado();
  }

  // ── API ──────────────────────────────────────────────────────────────────

  /** Posición (mundo) del barrio sobre su meseta: origen para `barrio.mjs`. */
  function barrioAnchor(barrioId) {
    const a = anclas.get(barrioId)
      || [...anclas.values()].find((x) => x.barrio.slug === barrioId || x.barrio.nombre === barrioId);
    if (!a) {
      console.warn(`[ciudad] barrio desconocido: ${barrioId}`);
      return centro.clone();
    }
    return a.base.clone();
  }

  /** Cima de la torre del barrio (para llaves, actas y raíles de cámara). */
  function barrioCima(barrioId) {
    const a = anclas.get(barrioId);
    return a ? a.cima.clone() : centro.clone();
  }

  /**
   * Encuadre aéreo de la ciudad. Devuelve el raíl sugerido y, si se le pasa
   * una cámara (`focusCity(camera)` o `focusCity({ camera, controls })`),
   * la lleva hasta él con easing.
   * @returns {{centro:object, mirarA:object, camara:object, radio:number, distancia:number, listo:Promise<void>}}
   */
  function focusCity(arg) {
    const cfg = (arg && arg.isCamera) ? { camera: arg } : (arg || {});
    const camera = cfg.camera || null;
    const controls = cfg.controls || null;
    const duracion = cfg.duracion ?? 2.2;

    const guia = destacado
      ? new T.Vector3(destacado.base.x, 0, destacado.base.z)
      : new T.Vector3(1, 0, 0);
    if (guia.lengthSq() < 1e-6) guia.set(1, 0, 0);
    guia.normalize();

    const distancia = radioCiudad * 1.55;
    const camara = new T.Vector3(
      guia.x * distancia, radioCiudad * 0.86, guia.z * distancia
    );
    const mirarA = centro.clone().setY(centro.y + 2.4);

    if (!promesaListo) promesaListo = new Promise((res) => { resolverListo = res; });

    if (camera) {
      if (menosMovimiento || duracion <= 0) {
        camera.position.copy(camara);
        if (controls && controls.target) {
          controls.target.copy(mirarA);
          if (typeof controls.update === 'function') controls.update();
        } else camera.lookAt(mirarA);
      } else {
        const mirada = controls && controls.target
          ? controls.target.clone()
          : camera.getWorldDirection(new T.Vector3()).multiplyScalar(distancia).add(camera.position);
        camaraAnim = {
          camera, controls, duracion, t: 0,
          desdePos: camera.position.clone(), hastaPos: camara.clone(),
          desdeMira: mirada, hastaMira: mirarA.clone()
        };
      }
    }
    if (revelado >= 1 && !camaraAnim && resolverListo) { resolverListo(); resolverListo = null; }

    return {
      centro: centro.clone(),
      mirarA,
      camara,
      radio: radioCiudad,
      distancia,
      listo: promesaListo
    };
  }

  /** Paso manual (segundos). Si lo llamas, la ciudad deja su rAF interno. */
  function update(dt) {
    if (!vivo) return;
    if (!externo) {
      externo = true;
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      raf = 0;
    }
    const d = (typeof dt === 'number' && isFinite(dt)) ? pinza(dt, 0, 0.1) : 1 / 60;
    if (menosMovimiento) {
      if (revelado < 1) { revelado = 1; aplicarRevelado(); }
      if (camaraAnim) paso(d);
      return;
    }
    paso(d);
  }

  /** Realza (o apaga) cualquier barrio con el mismo lenguaje del destacado. */
  function resaltarBarrio(barrioId, encendido = true) {
    const a = anclas.get(barrioId);
    if (!a) return false;
    const est = ESTADOS[a.barrio.estado] || ESTADOS.latente;
    a.material.emissiveIntensity = encendido ? est.emissive + 0.34 : est.emissive;
    // El asiento real del kit se abre con la torre: es el mismo barrio, y es a
    // ese ancla (`ancla-<id>`) a la que camina H en el dominio.
    const marca = marcasKit.get(barrioId);
    if (marca) marca.scale.setScalar((0.62 + 0.22 * est.alturaK) * (encendido ? 1.4 : 1));
    return true;
  }

  function dispose() {
    vivo = false;
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
    animables.length = 0;
    latidos.length = 0;
    // Antes de vaciar el árbol: el manager del kit retira sus partículas de
    // capaAvenidas y libera su geometría y sus materiales compartidos.
    try { trayectorias.dispose(); } catch { /* ya estaba */ }
    emisores.length = 0;
    matKit.length = 0;
    vistosKit.clear();
    marcasKit.clear();
    if (scene) {
      if (group.parent === scene) scene.remove(group);
      else if (group.parent) group.parent.remove(group);
      if (scene.fog === nieblaPropia) scene.fog = fogPrevio;
    } else if (group.parent) group.parent.remove(group);
    desecharArbol(group);
    for (const d of desechables) { try { d.dispose(); } catch { /* da igual */ } }
    desechables.length = 0;
    anclas.clear();
  }

  /** Posición (mundo) del asiento real del barrio, según el ancla del gamemap. */
  function anclaAnchor(barrioId) {
    const a = gamemap.anclas[`ancla-${barrioId}`];
    if (!a) return barrioAnchor(barrioId);
    return new T.Vector3(a.position.x, a.position.y, a.position.z);
  }

  /** Posición (mundo) de la entrada de un nodo del gamemap (plaza, distritos). */
  function nodoAnchor(nodoId) {
    const n = gamemap.nodos[nodoId];
    if (!n) return centro.clone();
    return new T.Vector3(n.entrada.x, n.entrada.y, n.entrada.z);
  }

  return {
    group,
    barrioAnchor,
    focusCity,
    dispose,
    // extras (no rompen el contrato)
    update,
    barrioCima,
    resaltarBarrio,
    notariaAnchor: () => notariaPos.clone(),
    distritoAnchor: (id) => {
      const m = trazado.mesetas.find((x) => x.id === id);
      return m ? punto((m.rIn + m.rOut) / 2, m.medio, m.elevacion) : centro.clone();
    },
    centroCiudad: () => centro.clone(),
    radioCiudad,
    destacado: idDestacado,
    trazado,
    paleta: PALETA,

    // ── R2: la escena real, para quien la necesite (W-CEREMONIA) ───────────
    /** Gamemap adaptado del mapa (nodos/enlaces/anclas). Siempre presente. */
    gamemap,
    /**
     * Proyección de `sceneFromGamemap` REAL de `@zeus/ciudad/scene`, o `null`
     * si el paquete no está servido: entonces mira `frontera.pendiente`.
     * Es lo que come `createCiudadDomainState`.
     */
    escena,
    /** Nodo de spawn real ('plaza') y su posición en el mundo. */
    spawn: escena ? escena.spawnNodeId : gamemap.gobierno.gobierna,
    spawnAnchor: () => nodoAnchor(escena ? escena.spawnNodeId : gamemap.gobierno.gobierna),
    nodoAnchor,
    anclaAnchor,
    anclaDe: (barrioId) => gamemap.anclas[`ancla-${barrioId}`] || null,
    /** `nodesReachable` real; `null` si la proyección no está en canal. */
    alcanzable,
    /** Vocabulario real de estados, o `null` si el contrato no está servido. */
    estadosCanonicos,
    /** Frontera real/pendiente de este módulo. Es producto: se enseña. */
    frontera
  };
}

// ── auxiliares ──────────────────────────────────────────────────────────────

/**
 * Re-tiñe un grupo del kit a la paleta cerrada de la demo. La GEOMETRÍA del kit
 * se conserva entera —es la pieza real—; sólo se traduce su paleta cyberpunk
 * (MATRIX_GREEN / CYAN / VOID, constantes leídas de su fuente) al sepia·oro·
 * verdigrís de la demo. Es tema encima, no fork: el paquete queda intacto.
 *
 * Sólo se traducen esas constantes PROPIAS del kit. Lo que el kit haya pintado
 * con su opción pública `color` —que somos nosotros quienes se la pasamos, ya
 * en paleta— se respeta tal cual: ahí manda la API del paquete, no este tinte.
 *
 * También apaga sombras: a escala de ciudad, 24 asientos proyectando sombra no
 * aportan y el foco de sombra de la demo está encuadrado en el barrio, no aquí.
 *
 * @param {object} raiz  grupo devuelto por el kit
 * @param {{acento:number|object, trama?:number|object, fondo?:number|object, alfa?:number}} cfg
 */
function tematizar(raiz, cfg = {}) {
  const { acento, trama = acento, fondo = PALETA.sepia, alfa = 1 } = cfg;
  // El anchor-marker comparte un mismo material entre asiento y respaldo: sin
  // deduplicar, `alfa` se aplicaría dos veces sobre la misma opacidad.
  const vistos = new Set();
  raiz.traverse((o) => {
    if ('castShadow' in o) o.castShadow = false;
    if ('receiveShadow' in o) o.receiveShadow = false;
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      if (vistos.has(m)) continue;
      vistos.add(m);
      if (m.color) {
        const hex = m.color.getHex();
        if (hex === HEX_KIT.MATRIZ) m.color.set(trama);
        else if (hex === HEX_KIT.CIAN) m.color.set(acento);
        else if (hex === HEX_KIT.VACIO || hex === HEX_KIT.ASIENTO) m.color.set(fondo);
      }
      if (m.emissive) {
        m.emissive.set(acento);
        m.emissiveIntensity = Math.min(m.emissiveIntensity ?? 0.1, 0.34);
      }
      m.transparent = true;
      m.opacity = (m.opacity ?? 1) * alfa;
    }
  });
  return raiz;
}

async function resolverMapa(mapa) {
  if (mapa && typeof mapa === 'object' && Array.isArray(mapa.barrios)) return mapa;
  const url = typeof mapa === 'string' ? mapa : '/mapa.json';
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`[ciudad] no pude leer el mapa (${url}): ${r.status}`);
  return r.json();
}

/** Sector anular extruido: la meseta de un distrito, con su bisel. */
function geometriaMeseta(T, rIn, rOut, a0, a1, grosor) {
  const forma = new T.Shape();
  forma.absarc(0, 0, rOut, a0, a1, false);
  forma.absarc(0, 0, rIn, a1, a0, true);
  forma.closePath();
  const geo = new T.ExtrudeGeometry(forma, {
    depth: grosor,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.2,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 64
  });
  geo.rotateX(-Math.PI / 2);           // la forma XY pasa al plano XZ
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.max.y, 0); // cara superior en y = 0
  return geo;
}

/** Degradado vertical para el velo de niebla (denso abajo). */
function texturaDegradadoVertical(T) {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 4; lienzo.height = 256;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.74, 'rgba(255,255,255,0.55)');
  g.addColorStop(1.00, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

/** Disco de bruma baja (degradado radial suave). */
function texturaDiscoBruma(T) {
  if (typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 256; lienzo.height = 256;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0.00, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.42)');
  g.addColorStop(1.00, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

/** Rótulo de scriptorium: mono, tinta, sombra sepia. */
function crearEtiqueta(T, texto, opciones = {}) {
  if (typeof document === 'undefined') return null;
  const color = opciones.color || '#EAE0C8';
  const altura = opciones.altura ?? 1.4;
  const px = 72;
  const fuente = `600 ${px}px "Cascadia Mono", Consolas, ui-monospace, monospace`;
  const medidor = document.createElement('canvas').getContext('2d');
  if (!medidor) return null;
  medidor.font = fuente;
  const espaciado = `${Math.round(px * 0.09)}px`;
  if ('letterSpacing' in medidor) medidor.letterSpacing = espaciado;
  const ancho = Math.ceil(medidor.measureText(texto).width) + px;
  const alto = Math.ceil(px * 1.9);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho; lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  ctx.font = fuente;
  if ('letterSpacing' in ctx) ctx.letterSpacing = espaciado;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(19,16,8,0.9)';
  ctx.shadowBlur = px * 0.55;
  ctx.fillStyle = color;
  ctx.fillText(texto, ancho / 2, alto / 2);

  const tex = new T.CanvasTexture(lienzo);
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new T.Sprite(new T.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0
  }));
  sprite.scale.set(altura * (ancho / alto), altura, 1);
  return sprite;
}

const colorCss = (c) => `#${c.getHexString()}`;
const nombreCorto = (n) => String(n).split('(')[0].trim();

/** Libera geometrías, materiales y texturas de un subárbol. */
function desecharArbol(raiz) {
  raiz.traverse((o) => {
    if (o.geometry && typeof o.geometry.dispose === 'function') o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      for (const clave of ['map', 'alphaMap', 'emissiveMap', 'bumpMap', 'normalMap']) {
        const t = m[clave];
        if (t && typeof t.dispose === 'function') t.dispose();
      }
      if (typeof m.dispose === 'function') m.dispose();
    }
  });
  raiz.clear?.();
}

export default createCiudad;
