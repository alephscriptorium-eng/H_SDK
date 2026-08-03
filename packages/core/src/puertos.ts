/**
 * Puertos de caso de uso H. El core DECLARA; no implementa ni importa edges.
 * Sin schemas Zeus/HUB paralelos ni notaría/cadena local.
 */

import type { Resultado } from './resultado.ts';
import type { Acople, ActorId, PiezaId, PiezaOnfalo } from './dominio.ts';

/** Todo adaptador declara régimen. Sin excepción. */
export interface Adaptador {
  readonly nombre: string;
  acople(): Acople;
}

/** Confirmación de entrada Ciudad: state/ledger observados, no inventados. */
export interface ConfirmacionCiudad {
  readonly actor: ActorId;
  /** Id de state del owner — opaco; no es shape Zeus copiado. */
  readonly stateId: string;
  /** Id de ledger del owner — opaco. */
  readonly ledgerId: string;
}

/** Sesión delta abierta tras reach/wake confirmados. */
export interface SesionDeltaRef {
  readonly sesionId: string;
}

/** Salida del provider E (owner externo); H no analiza. */
export interface AnalisisRef {
  readonly analisisId: string;
  readonly pieza: PiezaId;
}

/** Línea materializada por el owner canónico; H no implementa materialize. */
export interface LineaRef {
  readonly lineaId: string;
}

/** Veredicto de evidencia canónica (HUB/owner); H verifica, no notaría. */
export interface VeredictoEvidencia {
  readonly verificado: boolean;
  readonly evidenciaId: string;
}

/** Proyección propia H → V (resources / schema versionado). */
export interface ProyeccionPublicada {
  readonly resourceVersion: string;
  readonly estado: string;
}

/** Entrada Ciudad confirmada (state/ledger observables). */
export interface PuertoEntradaCiudad extends Adaptador {
  confirmarEntrada(actor: ActorId): Promise<Resultado<ConfirmacionCiudad>>;
}

/** Sesión delta (paquete G tipado cuando esté VERDE). */
export interface PuertoSesionDelta extends Adaptador {
  abrirSesion(confirmacion: ConfirmacionCiudad): Promise<Resultado<SesionDeltaRef>>;
}

/** Análisis vía provider E (owner externo). */
export interface PuertoAnalisisE extends Adaptador {
  analizar(pieza: PiezaOnfalo): Promise<Resultado<AnalisisRef>>;
}

/** Materialización de línea (owner canónico; no `line.materialize` en H). */
export interface PuertoMaterializacionLinea extends Adaptador {
  materializar(analisis: AnalisisRef): Promise<Resultado<LineaRef>>;
}

/** Evidencia canónica (HUB); sustituye la antigua notaría local. */
export interface PuertoEvidenciaCanonica extends Adaptador {
  verificar(linea: LineaRef): Promise<Resultado<VeredictoEvidencia>>;
}

/** Publicación de proyección H para V. */
export interface PuertoProyeccion extends Adaptador {
  publicar(proyeccion: ProyeccionPublicada): Promise<Resultado<void>>;
}
