import {
  ANG_INICIAL,
  BANDAS,
  GAP_DISTRITO,
  GAP_HOLON,
} from '../layout/tokens.ts';
import { PALETA } from '../theme/tokens.ts';
import type { ColorDistritoMap, DryCalleMap } from '../config/types.ts';

const TAU = Math.PI * 2;

/** Paleta de respaldo cuando un distrito no tiene color en config. */
export const COLORES_RESPALDO = Object.freeze([
  PALETA.oro,
  PALETA.verdigris,
  PALETA.tinta,
  PALETA.violeta,
  PALETA.verde,
  PALETA.terracota,
] as const);

/** Defaults estructurales (ids de distrito del mapa, no lore de barrio). */
export const COLOR_DISTRITO_DEFAULT: ColorDistritoMap = Object.freeze({
  zigurat: PALETA.oro,
  editores: PALETA.verdigris,
  'lore-voz': PALETA.tinta,
  'red-stream': PALETA.violeta,
  'runtime-mcp': PALETA.verde,
  'infra-ui': PALETA.terracota,
});

export const DRY_CALLE_DEFAULT: DryCalleMap = Object.freeze({
  editores: 'funcional',
  'red-stream': 'tecnico',
  'runtime-mcp': 'plugins',
  'lore-voz': 'mcp-vivos',
  'infra-ui': 'infra',
});

export type MapaHolon = {
  readonly id: string;
  readonly slug?: string;
  readonly name?: string;
  readonly runtimeKind?: keyof typeof BANDAS | string;
  readonly barrios?: readonly string[];
  readonly razonSinBarrio?: string | null;
};

export type MapaDistrito = {
  readonly id: string;
  readonly displayName?: string;
  readonly holonId?: string;
  readonly barrios?: readonly string[];
};

export type MapaBarrio = {
  readonly id: string;
  readonly slug?: string;
  readonly displayName?: string;
  readonly distrito?: string;
  readonly holonId?: string;
  readonly estado?: string;
  readonly grafo?: { readonly handoffEdges?: number };
};

export type MapaData = {
  readonly kind?: string;
  readonly version?: string | number;
  readonly holones?: readonly MapaHolon[];
  readonly distritos?: readonly MapaDistrito[];
  readonly barrios?: readonly MapaBarrio[];
};

export type BandaHolon = (typeof BANDAS)[keyof typeof BANDAS];

export type SectorHolon = {
  holon: MapaHolon;
  banda: BandaHolon;
  a0: number;
  a1: number;
  medio: number;
  arco: number;
};

export type BarrioTrazado = {
  id: string;
  slug: string;
  nombre: string;
  distrito: string | undefined;
  holonId: string | undefined;
  estado: string;
  aristas: number;
  indice: number;
  numero: number;
  radio?: number;
  angulo?: number;
  elevacion?: number;
  distritoRef?: MesetaTrazado;
  anillo?: number;
  color?: number;
};

export type AnilloTrazado = {
  radio: number;
  puntos: Array<{ id: string; ang: number; radio: number }>;
};

export type MesetaTrazado = {
  id: string;
  nombre: string;
  holonId: string | undefined;
  sector: SectorHolon;
  a0: number;
  a1: number;
  medio: number;
  rIn: number;
  rOut: number;
  grosor: number;
  elevacion: number;
  color: number;
  vacia: boolean;
  aristas: number;
  barrios: string[];
  anillos?: AnilloTrazado[];
  paseo?: number;
  hub?: { radio: number; ang: number; y: number };
  malla?: unknown;
};

export type NotariaTrazado = {
  holon: MapaHolon | undefined;
  ang: number;
  radio: number;
  elevacion: number;
  altura: number;
};

export type TrazadoResult = {
  holones: MapaHolon[];
  sectores: Map<string, SectorHolon>;
  mesetas: MesetaTrazado[];
  barrios: Map<string, BarrioTrazado>;
  notaria: NotariaTrazado;
  maxAristas: number;
  maxAristasDistrito: number;
};

export type Punto3 = { x: number; y: number; z: number };

export type GamemapNodo = {
  id: string;
  displayName: string;
  role: string;
  kind: string;
  entrada: Punto3 & { facing: number };
  holonId: string | null | undefined;
  mesetaId: string | null | undefined;
  handoffEdges?: number;
  sinBarrios?: boolean;
  razonSinBarrio?: string | null;
  anclas: string[];
  enlaces: string[];
};

export type GamemapEnlace = {
  id: string;
  displayName: string;
  dry: string;
  from: string;
  to: string;
  bidirectional: boolean;
  walkSpeed: number;
  waypoints: Punto3[];
};

export type GamemapAncla = {
  id: string;
  parent: string;
  displayName: string;
  barrioId: string;
  slug: string;
  estado: string;
  position: Punto3;
  posicionEdificio: Punto3;
  facing: number;
  slot: string;
  kind: string;
  holonId: string | undefined;
  handoffEdges: number;
};

export type Gamemap = {
  id: string;
  sceneId: string;
  version: string | number;
  displayName: string;
  gobierno: { gobierna: string; opera: string; ejecutan: string };
  zones: Array<{
    id: string;
    displayName: string;
    role: string;
    nodeId: string;
    barrios: string[];
  }>;
  nodos: Record<string, GamemapNodo>;
  enlaces: Record<string, GamemapEnlace>;
  anclas: Record<string, GamemapAncla>;
  defaultAnchorByNode: Record<string, string>;
};

export type CalcularTrazadoOptions = {
  colorDistrito?: ColorDistritoMap;
  coloresRespaldo?: readonly number[];
};

export type GamemapOptions = {
  dryCalle?: DryCalleMap;
};

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;

/** Semilla determinista a partir del id. */
export function semilla(txt: string): number {
  let h = 2166136261;
  const s = String(txt);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Reparto entero por pesos (mayor resto). */
export function repartir(n: number, pesos: readonly number[]): number[] {
  const total = pesos.reduce((s, p) => s + p, 0) || 1;
  const crudo = pesos.map((p) => (n * p) / total);
  const base = crudo.map(Math.floor);
  let resto = n - base.reduce((s, v) => s + v, 0);
  const orden = crudo
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < orden.length && resto > 0; k++, resto--) base[orden[k]!.i]++;
  return base;
}

/** Punto polar → cartesiano (convención ciudad: z = -radio*sin(ang)). */
export function punto3(radio: number, ang: number, y = 0): Punto3 {
  return { x: radio * Math.cos(ang), y, z: -radio * Math.sin(ang) };
}

const DESVIO_ANCLA = 1.15;

function anguloCorto(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Rumbo en grados (0 = +Z) desde `a` mirando a `b`. */
export function rumboHacia(a: Punto3, b: Punto3): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (dx === 0 && dz === 0) return 0;
  return (Math.atan2(dx, dz) * 180) / Math.PI;
}

function calleWaypoints(
  a: { radio: number; ang: number; y: number },
  b: { radio: number; ang: number; y: number },
  n = 2,
): Punto3[] {
  const pts: Punto3[] = [];
  const dAng = anguloCorto(a.ang, b.ang);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(
      punto3(
        a.radio + (b.radio - a.radio) * t,
        a.ang + dAng * t,
        a.y + (b.y - a.y) * t,
      ),
    );
  }
  return pts;
}

function bandaDe(runtimeKind: string | undefined): BandaHolon {
  if (runtimeKind && runtimeKind in BANDAS) {
    return BANDAS[runtimeKind as keyof typeof BANDAS];
  }
  return BANDAS.anchor;
}

/**
 * Calcula el trazado urbano a partir del mapa: sectores por holón, mesetas por
 * distrito, anillos y posiciones por barrio, y la posición de la NOTARÍA.
 */
export function calcularTrazado(
  mapa: MapaData,
  opciones: CalcularTrazadoOptions = {},
): TrazadoResult {
  const colorDistrito = { ...COLOR_DISTRITO_DEFAULT, ...opciones.colorDistrito };
  const coloresRespaldo = opciones.coloresRespaldo ?? COLORES_RESPALDO;

  const holones = [...(mapa.holones || [])].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );
  const distritos = mapa.distritos || [];
  const listaBarrios = mapa.barrios || [];

  const barrios = new Map<string, BarrioTrazado>();
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
      numero: i + 1,
    });
  });
  const maxAristas = Math.max(1, ...[...barrios.values()].map((b) => b.aristas));

  const peso = (h: MapaHolon) => Math.max(2, (h.barrios || []).length);
  const sumaPesos = holones.reduce((s, h) => s + peso(h), 0) || 1;
  const disponible = TAU - GAP_HOLON * holones.length;

  const sectores = new Map<string, SectorHolon>();
  const reparto: Array<{
    holon: MapaHolon;
    banda: BandaHolon;
    arco: number;
    medio: number;
    clave: string;
  }> = [];
  let cursor = ANG_INICIAL;
  for (const h of holones) {
    const arco = (disponible * peso(h)) / sumaPesos;
    const banda = bandaDe(h.runtimeKind);
    reparto.push({
      holon: h,
      banda,
      arco,
      medio: cursor + arco / 2,
      clave: `${banda.rIn}:${banda.rOut}`,
    });
    cursor += arco + GAP_HOLON;
  }

  const porBanda = new Map<string, typeof reparto>();
  for (const p of reparto) {
    if (!porBanda.has(p.clave)) porBanda.set(p.clave, []);
    porBanda.get(p.clave)!.push(p);
  }
  const vuelta = (x: number) => {
    const v = x % TAU;
    return v <= 0 ? v + TAU : v;
  };
  for (const grupo of porBanda.values()) {
    grupo.sort((a, b) => a.medio - b.medio);
    grupo.forEach((p, i) => {
      let holgura = p.banda.arcoMin / 2;
      if (grupo.length > 1) {
        const ant = grupo[(i - 1 + grupo.length) % grupo.length]!;
        const sig = grupo[(i + 1) % grupo.length]!;
        holgura = Math.min(
          holgura,
          vuelta(p.medio - ant.medio) / 2 - GAP_HOLON / 2,
          vuelta(sig.medio - p.medio) / 2 - GAP_HOLON / 2,
        );
      }
      const semi = Math.max(p.arco / 2, holgura);
      sectores.set(p.holon.id, {
        holon: p.holon,
        banda: p.banda,
        a0: p.medio - semi,
        a1: p.medio + semi,
        medio: p.medio,
        arco: semi * 2,
      });
    });
  }

  const maxBarriosDistrito = Math.max(
    1,
    ...distritos.map((d) => (d.barrios || []).length),
  );
  const aristasDe = (d: MapaDistrito) =>
    (d.barrios || []).reduce(
      (s, id) => s + (barrios.get(id)?.aristas || 0),
      0,
    );
  const maxAristasDistrito = Math.max(1, ...distritos.map(aristasDe));

  const mesetas: MesetaTrazado[] = [];
  for (const [holonId, sector] of sectores) {
    const propios = distritos.filter((d) => d.holonId === holonId);
    if (propios.length === 0) {
      mesetas.push({
        id: `holon-${holonId}`,
        nombre: sector.holon.name || sector.holon.slug || holonId,
        holonId,
        sector,
        a0: sector.a0,
        a1: sector.a1,
        medio: sector.medio,
        rIn: sector.banda.rIn,
        rOut: sector.banda.rOut,
        grosor: sector.banda.grosor,
        elevacion: sector.banda.base,
        color: PALETA.tinta,
        vacia: true,
        aristas: 0,
        barrios: [],
      });
      continue;
    }
    const totalB = propios.reduce(
      (s, d) => s + Math.max(1, (d.barrios || []).length),
      0,
    );
    const util = sector.arco - GAP_DISTRITO * propios.length;
    let a = sector.a0 + GAP_DISTRITO / 2;
    propios.forEach((d, idx) => {
      const nB = Math.max(1, (d.barrios || []).length);
      const arco = (util * nB) / totalB;
      const aristas = aristasDe(d);
      const elevacion =
        sector.banda.base +
        2.45 * (Math.log1p(aristas) / Math.log1p(maxAristasDistrito)) +
        0.55 * ((d.barrios || []).length / maxBarriosDistrito);
      mesetas.push({
        id: d.id,
        nombre: d.displayName || d.id,
        holonId,
        sector,
        a0: a,
        a1: a + arco,
        medio: a + arco / 2,
        rIn: sector.banda.rIn,
        rOut: sector.banda.rOut,
        grosor: sector.banda.grosor,
        elevacion,
        color:
          colorDistrito[d.id] ??
          coloresRespaldo[idx % coloresRespaldo.length]!,
        vacia: false,
        aristas,
        barrios: [...(d.barrios || [])],
      });
      a += arco + GAP_DISTRITO;
    });
  }

  for (const m of mesetas) {
    if (m.vacia || m.barrios.length === 0) {
      m.anillos = [];
      continue;
    }
    const n = m.barrios.length;
    const nAnillos = n <= 3 ? 1 : 2;
    const radios: number[] = [];
    for (let k = 0; k < nAnillos; k++) {
      radios.push(m.rIn + ((m.rOut - m.rIn) * (k + 1)) / (nAnillos + 1));
    }
    const cuentas = repartir(n, radios);
    const margen = Math.min((m.a1 - m.a0) * 0.12, 0.07);
    const a0 = m.a0 + margen;
    const a1 = m.a1 - margen;
    m.anillos = [];
    let cursorB = 0;
    for (let k = 0; k < nAnillos; k++) {
      const cuantos = cuentas[k]!;
      const ids = m.barrios.slice(cursorB, cursorB + cuantos);
      cursorB += cuantos;
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
        return { id, ang, radio: radios[k]! };
      });
      m.anillos.push({ radio: radios[k]!, puntos });
    }
    m.paseo = m.rIn + (m.rOut - m.rIn) * 0.12;
    m.hub = { radio: m.paseo, ang: m.medio, y: m.elevacion };
  }

  const holon07 =
    holones.find((h) => h.runtimeKind === 'metodo') ||
    holones.find((h) => String(h.id) === '07') ||
    holones[holones.length - 1];
  const sector07 = holon07 ? sectores.get(holon07.id) : undefined;
  const mesetaNotaria = mesetas.find((m) => m.holonId === holon07?.id);
  const notaria: NotariaTrazado = {
    holon: holon07,
    ang: sector07 ? sector07.medio : 0,
    radio: sector07
      ? (sector07.banda.rIn + sector07.banda.rOut) / 2
      : 6.5,
    elevacion: mesetaNotaria ? mesetaNotaria.elevacion : 7,
    altura: 7.6,
  };

  return {
    holones,
    sectores,
    mesetas,
    barrios,
    notaria,
    maxAristas,
    maxAristasDistrito,
  };
}

/** `mapa.json` → gamemap consumible por `sceneFromGamemap`. */
export function gamemapDesdeMapa(
  mapa: MapaData,
  trazado: TrazadoResult = calcularTrazado(mapa),
  opciones: GamemapOptions = {},
): Gamemap {
  const dryCalle = { ...DRY_CALLE_DEFAULT, ...opciones.dryCalle };
  const nodos: Record<string, GamemapNodo> = {};
  const enlaces: Record<string, GamemapEnlace> = {};
  const anclas: Record<string, GamemapAncla> = {};
  const zones: Gamemap['zones'] = [];
  const defaultAnchorByNode: Record<string, string> = {};

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
    enlaces: [],
  };

  const polarDe = new Map<string, { radio: number; ang: number; y: number }>([
    ['plaza', plazaPolar],
  ]);

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
      enlaces: [],
    };
    zones.push({
      id: m.id,
      displayName: m.nombre,
      role: nodos[m.id]!.role,
      nodeId: m.id,
      barrios: [...m.barrios],
    });
  }

  for (const m of trazado.mesetas) {
    if (!m.vacia) continue;
    if (m.holonId === (not.holon && not.holon.id)) continue;
    const holon = trazado.holones.find((h) => h.id === m.holonId);
    const polar = {
      radio: (m.rIn + m.rOut) / 2,
      ang: m.medio,
      y: m.elevacion,
    };
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
      enlaces: [],
    };
  }

  const notariaXYZ = punto3(not.radio, not.ang, not.elevacion);
  for (const b of trazado.barrios.values()) {
    if (b.radio === undefined) continue;
    const nodoId = b.distrito;
    const nodo = nodoId ? nodos[nodoId] : undefined;
    if (!nodo) continue;
    const id = `ancla-${b.id}`;
    const pos = punto3(b.radio + DESVIO_ANCLA, b.angulo!, b.elevacion!);
    anclas[id] = {
      id,
      parent: nodoId!,
      displayName: b.nombre,
      barrioId: b.id,
      slug: b.slug,
      estado: b.estado,
      position: pos,
      posicionEdificio: punto3(b.radio, b.angulo!, b.elevacion!),
      facing: Math.round(rumboHacia(pos, notariaXYZ) * 100) / 100,
      slot: 'sit',
      kind: 'gamething.barrio',
      holonId: b.holonId,
      handoffEdges: b.aristas,
    };
    nodo.anclas.push(id);
    if (!defaultAnchorByNode[nodoId!]) defaultAnchorByNode[nodoId!] = id;
  }

  const unir = (
    id: string,
    from: string,
    to: string,
    dry: string,
    rotulo?: string,
  ) => {
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
      waypoints,
    };
    if (nodos[from]) nodos[from]!.enlaces.push(id);
    if (nodos[to]) nodos[to]!.enlaces.push(id);
  };

  if (nodos.zigurat) unir('calle-plaza-zigurat', 'plaza', 'zigurat', 'gobierno');
  for (const id of Object.keys(nodos)) {
    if (id === 'plaza' || id === 'zigurat') continue;
    const nodo = nodos[id]!;
    if (nodo.sinBarrios) {
      unir(
        `senda-${id}`,
        'plaza',
        id,
        nodo.kind,
        `Senda a ${nodo.displayName}`,
      );
      continue;
    }
    const dry = dryCalle[id] || id;
    unir(`calle-${dry}`, nodos.zigurat ? 'zigurat' : 'plaza', id, dry);
  }

  return {
    id: 'prueba-hm-ciudad',
    sceneId: `${String(mapa.kind || 'ciudad')}-${String(mapa.version || 'v0')}`,
    version: mapa.version ?? 0,
    displayName: 'Ciudad de holones · Prueba de H·M',
    gobierno: { gobierna: 'plaza', opera: 'zigurat', ejecutan: 'barrios' },
    zones,
    nodos,
    enlaces,
    anclas,
    defaultAnchorByNode,
  };
}
