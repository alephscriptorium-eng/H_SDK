/**
 * `PuertoProyeccion` — superficie propia H → V (resources / schema versionado).
 * No reexporta shapes `@zeus/*`.
 */

import { err, ok } from '@h-sdk/core';
import type {
  Acople,
  ProyeccionPublicada,
  PuertoProyeccion,
  Resultado,
} from '@h-sdk/core';

export interface SumideroProyeccion {
  publicar(proyeccion: ProyeccionPublicada): Promise<void>;
}

export interface OpcionesPuertoProyeccion {
  readonly sumidero?: SumideroProyeccion;
}

export function crearPuertoProyeccion(
  opciones: OpcionesPuertoProyeccion = {},
): PuertoProyeccion {
  const { sumidero } = opciones;

  return {
    nombre: '@h-sdk/edge-zeus/proyeccion',
    acople: (): Acople => (sumidero ? 'conectado' : 'replay'),
    async publicar(proyeccion: ProyeccionPublicada): Promise<Resultado<void>> {
      if (!sumidero) {
        return err(
          'proyeccion: sin sumidero — publication sink omitido (hostil-omite)',
        );
      }
      if (!proyeccion.resourceVersion || !proyeccion.estado) {
        return err('proyeccion: resourceVersion|estado omitidos — denegado');
      }
      await sumidero.publicar(proyeccion);
      return ok(undefined);
    },
  };
}
