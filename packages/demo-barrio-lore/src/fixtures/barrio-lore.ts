import type { BarrioConfig, CiudadConfig } from '../config/types.ts';
import {
  COLOR_DISTRITO_DEFAULT,
  DRY_CALLE_DEFAULT,
} from '../ciudad/trazado.ts';

/** Barrio del descenso (distrito lore-voz, barrio 20). */
export const BARRIO_DESTACADO_ID = 'document-machine-sdk';

/** Alias usado en host / rails. */
export const BARRIO_ID = BARRIO_DESTACADO_ID;

/** Roster de la herradura (fixture barrio-lore; no hardcode en builders). */
export const UNIDADES_BARRIO_LORE = [
  {
    id: 'portal',
    nombre: 'Portal',
    tarea: 'recepción',
    gesto: { glb: 'wave', stick: 'wave' },
    acento: 'oro' as const,
  },
  {
    id: 'loreador',
    nombre: 'Loreador',
    tarea: 'memoria del lugar',
    gesto: { glb: 'nod_quick', stick: 'nod' },
    acento: 'oro' as const,
  },
  {
    id: 'bartleby',
    nombre: 'Bartleby',
    tarea: 'copia y objeción',
    gesto: { glb: 'shake_head', stick: 'shake' },
    acento: 'oro' as const,
  },
  {
    id: 'archivero',
    nombre: 'Archivero',
    tarea: 'custodia',
    gesto: { glb: 'thumbsUp', stick: 'thumbsUp' },
    acento: 'oro' as const,
  },
  {
    id: 'cristalizador',
    nombre: 'Cristalizador',
    tarea: 'fija la línea',
    gesto: { glb: 'finger_up', stick: 'thumbsUp' },
    acento: 'oro' as const,
  },
  {
    id: 'vector-mock',
    nombre: 'Vector',
    tarea: 'índice · SIMULACRO',
    gesto: { glb: 'shrug', stick: 'shake' },
    acento: 'violeta' as const,
  },
  {
    id: 'grafista',
    nombre: 'Grafista',
    tarea: 'traza el grafo',
    gesto: { glb: 'nod_quick', stick: 'nod' },
    acento: 'verdigris' as const,
  },
  {
    id: 'demiurgo',
    nombre: 'Demiurgo',
    tarea: 'compone',
    gesto: { glb: 'dance', stick: 'wave' },
    acento: 'verdigris' as const,
  },
  {
    id: 'dramaturgo',
    nombre: 'Dramaturgo',
    tarea: 'pone voz',
    gesto: { glb: 'wave_soft', stick: 'wave' },
    acento: 'verdigris' as const,
  },
  {
    id: 'pipeline',
    nombre: 'Tubería',
    tarea: 'encadena pasos',
    gesto: { glb: 'jump', stick: 'nod' },
    acento: 'verdigris' as const,
  },
];

export const UNIDADES_CON_LEASE = [
  'portal',
  'loreador',
  'archivero',
  'grafista',
  'demiurgo',
] as const;

export const COLOR_DISTRITO = COLOR_DISTRITO_DEFAULT;
export const DRY_CALLE = DRY_CALLE_DEFAULT;

export const ciudadBarrioLore = (): CiudadConfig => ({
  destacadoBarrioId: BARRIO_DESTACADO_ID,
  colorDistrito: COLOR_DISTRITO,
  dryCalle: DRY_CALLE,
});

export const barrioBarrioLore = (): BarrioConfig => ({
  unidades: UNIDADES_BARRIO_LORE,
  unidadesConLease: [...UNIDADES_CON_LEASE],
});

export const fixtureBarrioLore = {
  barrioId: BARRIO_DESTACADO_ID,
  ciudad: ciudadBarrioLore(),
  barrio: barrioBarrioLore(),
};
