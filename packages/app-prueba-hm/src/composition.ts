/**
 * Composition root: cablea máquina (core) + edges (edge-zeus) + resources.
 * Delta sólo tras reach/wake confirmados. pending_external visible; nunca
 * finge `complete`.
 */

import {
  actorId,
  aplicar,
  crearMaquina,
  esOk,
  type ActorId,
  type MaquinaExperiencia,
  type PiezaOnfalo,
  type Resultado,
} from '@h-sdk/core';
import {
  MOTIVO_ANALISIS_E,
  MOTIVO_EVIDENCIA,
  MOTIVO_LINEA,
  abrirAsientoM,
  acopleDesdeSaludM,
  cacheDirLineaEfimero,
  crearPuertoAnalisisE,
  crearPuertoEntradaCiudad,
  crearPuertoEvidenciaCanonica,
  crearPuertoMaterializacionLinea,
  crearPuertoProyeccion,
  crearPuertoSesionDelta,
  draftMinimoDesdeAnalisis,
  intentWake,
  intentWalk,
  saludMConectada,
  type AbridorRuntimeDelta,
  type EmisorCiudad,
  type FactoryArgPlayerMcp,
  type ObservablesCiudad,
  type SaludM,
} from '@h-sdk/edge-zeus';
import {
  AlmacenResources,
  RESOURCE_VERSION,
  type PayloadEstado,
} from './resources.ts';
import { seleccionarPiezaOnfaloSellada } from './onfalo-pieza.ts';

/** Confirmación de reach (lore) + wake (barrio) observada del owner. */
export interface ConfirmacionReachWake {
  readonly loreAlcanzado: boolean;
  readonly barrioDespertado: boolean;
}

export interface OpcionesComposition {
  readonly actor?: ActorId;
  readonly emisor: EmisorCiudad;
  readonly observarCiudad: () => ObservablesCiudad;
  /** Tras walk+wake; ambos true para abrir delta. */
  readonly observarReachWake: () => ConfirmacionReachWake;
  /** Ancla Lore / DocumentMachine (wire Ciudad). */
  readonly anclaLore: { readonly anchorId: string } | { readonly nodeId: string };
  readonly wake: { readonly tool: string; readonly barrioId?: string };
  readonly abridorDelta: AbridorRuntimeDelta | null;
  readonly saludM: () => SaludM;
  /** Null ⇒ M no asentado; delta no abre (fail-closed). */
  readonly factoryM: FactoryArgPlayerMcp | null;
  readonly motivoAusenciaDelta?: string;
  /**
   * Selección de pieza Ónfalo. Default: `@zeus/onfalo-fixture` sellado.
   * Inyectable en tests.
   */
  readonly seleccionarPieza?: () =>
    | { ok: true; pieza: PiezaOnfalo; identity?: string }
    | { ok: false; error: string };
}

export interface CompositionHandle {
  readonly maquina: MaquinaExperiencia;
  readonly resources: AlmacenResources;
  readonly listResources: AlmacenResources['listResources'];
  readonly readResource: AlmacenResources['readResource'];
}

function pendingDe(maquina: MaquinaExperiencia): string[] {
  const out: string[] = [];
  if (maquina.estado === 'pending_external_contract' && maquina.superficie) {
    out.push(maquina.superficie);
  }
  if (maquina.motivo?.includes('pending_external_contract')) {
    out.push(maquina.motivo);
  }
  return out;
}

function publicarEstado(
  resources: AlmacenResources,
  maquina: MaquinaExperiencia,
  acople: PayloadEstado['acople'],
  extras: readonly string[] = [],
): void {
  const pending = [...new Set([...pendingDe(maquina), ...extras])];
  resources.escribirEstado({
    resourceVersion: RESOURCE_VERSION,
    estado: maquina.estado,
    motivo: maquina.motivo,
    superficie: maquina.superficie,
    pending_external: pending,
    acople,
  });
}

/**
 * Arranca la experiencia: Ciudad → reach/wake → M → delta → (E/línea/evidencia).
 * Cualquier ausencia queda en resources; no hay camino a `complete` fingido.
 */
export async function arrancarComposition(
  opciones: OpcionesComposition,
): Promise<CompositionHandle> {
  const actor = opciones.actor ?? actorId('actor-prueba-hm');
  const resources = new AlmacenResources();
  let maquina = crearMaquina();

  const puertoCiudad = crearPuertoEntradaCiudad({
    emisor: opciones.emisor,
    observar: opciones.observarCiudad,
  });
  const puertoDelta = crearPuertoSesionDelta({
    abridor: opciones.abridorDelta,
    saludM: opciones.saludM,
    motivoAusencia: opciones.motivoAusenciaDelta,
  });
  const puertoAnalisis = crearPuertoAnalisisE();
  // linea-kit@0.4.0 tipado: listo si E entrega AnálisisRef; sin E → no se ejercita.
  const puertoLinea = crearPuertoMaterializacionLinea({
    cacheDir: cacheDirLineaEfimero(),
    draftDesdeAnalisis: draftMinimoDesdeAnalisis,
  });
  const puertoEvidencia = crearPuertoEvidenciaCanonica();
  const puertoProyeccion = crearPuertoProyeccion({
    sumidero: {
      async publicar(p) {
        // Proyección mínima: refleja estado en resource versionado.
        const actual = resources.readResource('h-sdk://experiencia/estado');
        const prev = actual
          ? (JSON.parse(actual.text) as PayloadEstado)
          : undefined;
        resources.escribirEstado({
          resourceVersion: p.resourceVersion,
          estado: p.estado,
          motivo: prev?.motivo,
          superficie: prev?.superficie,
          pending_external: prev?.pending_external ?? [],
          acople: prev?.acople ?? {
            ciudad: 'replay',
            delta: 'replay',
            m: 'replay',
          },
        });
      },
    },
  });

  const acopleDe = () => ({
    ciudad: puertoCiudad.acople(),
    delta: puertoDelta.acople(),
    m: acopleDesdeSaludM(opciones.saludM()),
  });

  publicarEstado(resources, maquina, acopleDe());

  // 1 · Ciudad como entrada (puerto RH-13)
  const entrada = await puertoCiudad.confirmarEntrada(actor);
  if (!esOk(entrada)) {
    const r = aplicar(maquina, { tipo: 'fallo', motivo: entrada.error });
    if (esOk(r)) maquina = r.valor;
    publicarEstado(resources, maquina, acopleDe());
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  {
    const r = aplicar(maquina, { tipo: 'ciudad_confirmada' });
    if (!esOk(r)) {
      return falloIlegal(maquina, resources, r, acopleDe);
    }
    maquina = r.valor;
  }
  publicarEstado(resources, maquina, acopleDe());

  // 2 · reach (walk) + wake — sin ambos confirmados NO hay delta
  await opciones.emisor.emitir(intentWalk(actor, opciones.anclaLore));
  await opciones.emisor.emitir(intentWake(actor, opciones.wake));

  const reach = opciones.observarReachWake();
  if (!reach.loreAlcanzado || !reach.barrioDespertado) {
    const motivo =
      'reach/wake no confirmados — delta no abierta (fail-closed)';
    const r = aplicar(maquina, { tipo: 'fallo', motivo });
    if (esOk(r)) maquina = r.valor;
    resources.escribirEscena({
      resourceVersion: RESOURCE_VERSION,
      sesionId: null,
      disponible: false,
      motivo,
    });
    publicarEstado(resources, maquina, acopleDe());
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  {
    const r1 = aplicar(maquina, { tipo: 'lore_alcanzado' });
    if (!esOk(r1)) return falloIlegal(maquina, resources, r1, acopleDe);
    maquina = r1.valor;
    const r2 = aplicar(maquina, { tipo: 'barrio_despertado' });
    if (!esOk(r2)) return falloIlegal(maquina, resources, r2, acopleDe);
    maquina = r2.valor;
  }
  publicarEstado(resources, maquina, acopleDe());

  // 3 · Asiento M (connected + lastStateTs)
  if (!opciones.factoryM) {
    const superficie =
      'factory_m_ausente: @zeus/arg-player-mcp';
    const r = aplicar(maquina, {
      tipo: 'contrato_ausente',
      superficie,
    });
    if (esOk(r)) maquina = r.valor;
    resources.escribirEscena({
      resourceVersion: RESOURCE_VERSION,
      sesionId: null,
      disponible: false,
      motivo: superficie,
    });
    resources.escribirEvidencia({
      resourceVersion: RESOURCE_VERSION,
      verificado: false,
      evidenciaId: null,
      pending_external: MOTIVO_EVIDENCIA,
      motivo: MOTIVO_EVIDENCIA,
    });
    publicarEstado(resources, maquina, acopleDe(), [
      superficie,
      MOTIVO_ANALISIS_E,
      MOTIVO_LINEA,
      MOTIVO_EVIDENCIA,
    ]);
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  const asiento = await abrirAsientoM({
    actor: String(actor),
    factory: opciones.factoryM,
  });
  if (!esOk(asiento) || !saludMConectada(opciones.saludM())) {
    const motivo = !esOk(asiento)
      ? asiento.error
      : 'm: health incompleto tras asiento — exige connected+lastStateTs';
    const r = aplicar(maquina, { tipo: 'fallo', motivo });
    if (esOk(r)) maquina = r.valor;
    publicarEstado(resources, maquina, acopleDe());
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  // 4 · Delta SÓLO tras reach/wake + M
  const sesion = await puertoDelta.abrirSesion(entrada.valor);
  if (!esOk(sesion)) {
    const error = sesion.error;
    if (error.includes('pending_')) {
      const r = aplicar(maquina, {
        tipo: 'contrato_ausente',
        superficie: error,
      });
      if (esOk(r)) maquina = r.valor;
    } else {
      const r = aplicar(maquina, { tipo: 'fallo', motivo: error });
      if (esOk(r)) maquina = r.valor;
    }
    resources.escribirEscena({
      resourceVersion: RESOURCE_VERSION,
      sesionId: null,
      disponible: false,
      motivo: error,
    });
    publicarEstado(resources, maquina, acopleDe(), [error]);
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  {
    const r = aplicar(maquina, { tipo: 'delta_iniciada' });
    if (!esOk(r)) return falloIlegal(maquina, resources, r, acopleDe);
    maquina = r.valor;
  }
  resources.escribirEscena({
    resourceVersion: RESOURCE_VERSION,
    sesionId: sesion.valor.sesionId,
    disponible: true,
  });
  publicarEstado(resources, maquina, acopleDe());

  // 5 · Pieza Ónfalo sellada (paquete registry) → onfalo_selected
  const sel =
    (opciones.seleccionarPieza ?? seleccionarPiezaOnfaloSellada)();
  if (!sel.ok) {
    const r = aplicar(maquina, { tipo: 'fallo', motivo: sel.error });
    if (esOk(r)) maquina = r.valor;
    resources.escribirEvidencia({
      resourceVersion: RESOURCE_VERSION,
      verificado: false,
      evidenciaId: null,
      pending_external: MOTIVO_EVIDENCIA,
      motivo: sel.error,
    });
    publicarEstado(resources, maquina, acopleDe(), [sel.error]);
    await publicarProyeccion(puertoProyeccion, maquina);
    return handle(maquina, resources);
  }

  {
    const r = aplicar(maquina, {
      tipo: 'onfalo_seleccionado',
      pieza: sel.pieza.id,
    });
    if (!esOk(r)) return falloIlegal(maquina, resources, r, acopleDe);
    maquina = r.valor;
  }
  publicarEstado(resources, maquina, acopleDe());

  // 6 · E / línea / evidencia: pending_external visible (RH-11); no complete
  const analisis = await puertoAnalisis.analizar(sel.pieza);
  const pendientes = [MOTIVO_ANALISIS_E, MOTIVO_LINEA, MOTIVO_EVIDENCIA];
  if (!esOk(analisis)) {
    pendientes[0] = analisis.error;
  } else {
    const linea = await puertoLinea.materializar(analisis.valor);
    if (!esOk(linea)) {
      pendientes[1] = linea.error;
    } else {
      const evid = await puertoEvidencia.verificar(linea.valor);
      if (!esOk(evid)) {
        pendientes[2] = evid.error;
      } else if (evid.valor.verificado) {
        pendientes[0] =
          'pending_external_contract: complete bloqueado (owners externos)';
      }
    }
  }

  {
    const r = aplicar(maquina, {
      tipo: 'contrato_ausente',
      superficie: pendientes[0],
    });
    if (esOk(r)) maquina = r.valor;
  }

  resources.escribirEvidencia({
    resourceVersion: RESOURCE_VERSION,
    verificado: false,
    evidenciaId: null,
    pending_external: MOTIVO_EVIDENCIA,
    motivo: pendientes.join(' | '),
  });
  publicarEstado(resources, maquina, acopleDe(), pendientes);
  await publicarProyeccion(puertoProyeccion, maquina);

  if (maquina.estado === 'complete') {
    throw new Error(
      'composition: estado complete prohibido (sería demo mentirosa)',
    );
  }

  return handle(maquina, resources);
}

async function publicarProyeccion(
  puerto: ReturnType<typeof crearPuertoProyeccion>,
  maquina: MaquinaExperiencia,
): Promise<void> {
  await puerto.publicar({
    resourceVersion: RESOURCE_VERSION,
    estado: maquina.estado,
  });
}

function handle(
  maquina: MaquinaExperiencia,
  resources: AlmacenResources,
): CompositionHandle {
  return {
    maquina,
    resources,
    listResources: () => resources.listResources(),
    readResource: (uri) => resources.readResource(uri),
  };
}

function falloIlegal(
  maquina: MaquinaExperiencia,
  resources: AlmacenResources,
  r: Resultado<MaquinaExperiencia>,
  acopleDe: () => PayloadEstado['acople'],
): CompositionHandle {
  const motivo = !esOk(r) ? r.error : 'transicion_ilegal';
  let m = maquina;
  const f = aplicar(m, { tipo: 'fallo', motivo });
  if (esOk(f)) m = f.valor;
  publicarEstado(resources, m, acopleDe());
  return handle(m, resources);
}

