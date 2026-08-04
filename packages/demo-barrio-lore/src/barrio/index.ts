/**
 * BarrioScene — plaza del descenso, Ónfalo y puppets por unidad (L3).
 */
export {
  BarrioScene,
  type BarrioMountOptions,
  type EstadoUnidad,
  type Procedencia,
  type ProcedenciaCuerpos,
} from './BarrioScene.ts';

export {
  ALIAS_CAUSA,
  ALIAS_ESTADO,
  claveAspecto,
  esVocabularioSalud,
  normalizarCausa,
  normalizarEstado,
  poseBaseParaClave,
  poseBaseParaTipestate,
  POSE_GLB,
  POSE_STICK,
  SALUD_A_TIPESTATE,
  saludATipestate,
} from './tipestate.ts';

export type {
  AspectKey,
  CausaHalt,
  PuppetKind,
  SaludBarrio,
  SaludMapping,
  Tipestate,
} from './tipestate.ts';
