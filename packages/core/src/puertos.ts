/**
 * Puertos del hexágono. El core DECLARA lo que necesita del exterior; no lo
 * implementa y no importa a ningún edge — la dependencia apunta hacia dentro.
 *
 * Que una firma sea `Promise` no rompe la pureza: aquí solo vive la forma del
 * contrato. El IO vive en `packages/edge-*`.
 */

import type { Resultado } from './resultado.ts';
import type { Acople, ActorId, BarrioId, Cadena, PiezaId, PiezaOnfalo } from './dominio.ts';

/** Todo adaptador dice en qué régimen está trabajando. Sin excepción. */
export interface Adaptador {
  readonly nombre: string;
  acople(): Acople;
}

/**
 * Entrada al juego ciudad: los verbos ya probados reales
 * (RECAP · «Marco»: join / walk / announce / wake / acta).
 * H los pide; el dominio de ciudad los resuelve al otro lado del puerto.
 */
export interface PuertoCiudad extends Adaptador {
  entrar(actor: ActorId): Promise<Resultado<void>>;
  caminar(actor: ActorId, destino: BarrioId): Promise<Resultado<void>>;
  anunciar(actor: ActorId, mensaje: string): Promise<Resultado<void>>;
  despertar(barrio: BarrioId): Promise<Resultado<void>>;
}

/**
 * Notaría: H **no la posee** (ADR 0002, frontera de ownership). Solo pide el
 * acta y recibe su huella.
 */
export interface PuertoActa extends Adaptador {
  emitir(barrio: BarrioId, resumen: string): Promise<Resultado<string>>;
  verificar(cadena: Cadena): Promise<Resultado<boolean>>;
}

/** Lectura del Ónfalo. H lee piezas selladas; nunca las escribe. */
export interface PuertoOnfalo extends Adaptador {
  listar(): Promise<Resultado<readonly PiezaId[]>>;
  leer(id: PiezaId): Promise<Resultado<PiezaOnfalo>>;
}
