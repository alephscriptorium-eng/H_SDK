/**
 * Hostil-omite: ausencia (campo omitido) deniega. No OK por omisión.
 */

import { describe, expect, test } from 'bun:test';
import { actorId, ok, piezaId, type PiezaOnfalo } from '@h-sdk/core';
import { crearPuertoEntradaCiudad } from './ciudad.ts';
import {
  abridorDesdeStartArgRuntime,
  crearPuertoSesionDelta,
} from './delta.ts';
import {
  acopleDesdeSaludM,
  abrirAsientoM,
  saludMConectada,
} from './asiento-m.ts';
import { crearPuertoAnalisisE, MOTIVO_ANALISIS_E } from './analisis-e.ts';
import {
  cacheDirLineaEfimero,
  crearPuertoMaterializacionLinea,
  draftMinimoDesdeAnalisis,
  MOTIVO_LINEA_INPUT,
} from './linea.ts';
import {
  crearPuertoEvidenciaCanonica,
  MOTIVO_EVIDENCIA,
} from './evidencia.ts';
import { crearPuertoProyeccion } from './proyeccion.ts';
import {
  intentAnnounce,
  intentWake,
  intentWalk,
} from './wire-ciudad.ts';
import { materializeRecorrido } from '@zeus/linea-kit/viaje';

const ACTOR = actorId('actor-prueba');

const PIEZA: PiezaOnfalo = {
  id: piezaId('pieza-1'),
  mediaType: 'text/markdown',
  size: 1,
  sha256: 'abc',
};

const ANALISIS = {
  analisisId: 'a1',
  pieza: PIEZA.id,
};

describe('hostil-omite · Ciudad state/ledger', () => {
  test('omite stateId → acople replay y confirmarEntrada error', async () => {
    const puerto = crearPuertoEntradaCiudad({
      emisor: { emitir: async () => undefined },
      observar: () => ({ ledgerId: 'L1' }),
    });
    expect(puerto.acople()).toBe('replay');
    const r = await puerto.confirmarEntrada(ACTOR);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('stateId|ledgerId');
  });

  test('omite ledgerId → deniega', async () => {
    const puerto = crearPuertoEntradaCiudad({
      emisor: { emitir: async () => undefined },
      observar: () => ({ stateId: 'S1' }),
    });
    expect(puerto.acople()).toBe('replay');
    const r = await puerto.confirmarEntrada(ACTOR);
    expect(r.ok).toBe(false);
  });

  test('omite ambos → deniega', async () => {
    const puerto = crearPuertoEntradaCiudad({
      emisor: { emitir: async () => undefined },
      observar: () => ({}),
    });
    expect(puerto.acople()).toBe('replay');
    const r = await puerto.confirmarEntrada(ACTOR);
    expect(r.ok).toBe(false);
  });

  test('stateId+ledgerId presentes → conectado y ok', async () => {
    const puerto = crearPuertoEntradaCiudad({
      emisor: { emitir: async () => undefined },
      observar: () => ({ stateId: 'S1', ledgerId: 'L1' }),
    });
    expect(puerto.acople()).toBe('conectado');
    const r = await puerto.confirmarEntrada(ACTOR);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.stateId).toBe('S1');
      expect(r.valor.ledgerId).toBe('L1');
    }
  });
});

describe('hostil-omite · M lastStateTs', () => {
  test('omite lastStateTs → no conectado', () => {
    expect(saludMConectada({ connected: true })).toBe(false);
    expect(acopleDesdeSaludM({ connected: true })).toBe('replay');
  });

  test('lastStateTs null → no conectado', () => {
    expect(saludMConectada({ connected: true, lastStateTs: null })).toBe(false);
  });

  test('omite connected → no conectado', () => {
    expect(saludMConectada({ lastStateTs: 1 })).toBe(false);
    expect(acopleDesdeSaludM({ lastStateTs: 1 })).toBe('replay');
  });

  test('connected+lastStateTs → conectado', () => {
    expect(saludMConectada({ connected: true, lastStateTs: 1_700_000_000_000 })).toBe(
      true,
    );
    expect(
      acopleDesdeSaludM({ connected: true, lastStateTs: 1_700_000_000_000 }),
    ).toBe('conectado');
  });

  test('abrirAsientoM con bridge sin lastStateTs → error', async () => {
    const r = await abrirAsientoM({
      actor: 'uno',
      factory: async () => ({
        bridge: { connected: true },
        close: async () => undefined,
      }),
    });
    expect(r.ok).toBe(false);
  });

  test('abrirAsientoM con connected+lastStateTs → ok', async () => {
    const r = await abrirAsientoM({
      actor: 'uno',
      factory: async () => ({
        bridge: {
          connected: true,
          lastStateTs: () => 42,
        },
        close: async () => undefined,
      }),
    });
    expect(r.ok).toBe(true);
  });
});

describe('hostil-omite · delta exige M completo', () => {
  test('omite lastStateTs → abrirSesion error aunque haya abridor', async () => {
    const puerto = crearPuertoSesionDelta({
      abridor: {
        abrir: async () => ok({ sesionId: 'ses-1' }),
      },
      saludM: () => ({ connected: true }),
    });
    expect(puerto.acople()).toBe('replay');
    const r = await puerto.abrirSesion({
      actor: ACTOR,
      stateId: 'S1',
      ledgerId: 'L1',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('lastStateTs');
  });

  test('M completo + abridor → ok y smoke lastStateTs', async () => {
    const puerto = crearPuertoSesionDelta({
      abridor: {
        abrir: async () => ok({ sesionId: 'ses-smoke' }),
      },
      saludM: () => ({ connected: true, lastStateTs: 99 }),
    });
    expect(puerto.acople()).toBe('conectado');
    const r = await puerto.abrirSesion({
      actor: ACTOR,
      stateId: 'S-smoke',
      ledgerId: 'L-smoke',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.sesionId).toBe('ses-smoke');
  });

  test('omite sessionId|id → abridor err; no inventa delta:S1:L1', async () => {
    const abridor = abridorDesdeStartArgRuntime({
      startArgRuntime: async () => ({}),
      runtimeOpts: {},
    });
    const puerto = crearPuertoSesionDelta({
      abridor,
      saludM: () => ({ connected: true, lastStateTs: 1 }),
    });
    const r = await puerto.abrirSesion({
      actor: ACTOR,
      stateId: 'S1',
      ledgerId: 'L1',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('omite sessionId|id');
      expect(r.error).not.toContain('delta:S1:L1');
    }
    // mutante: ausencia no produce ok con sesion inventada
    expect(JSON.stringify(r)).not.toContain('delta:S1:L1');
    expect(r).not.toEqual({
      ok: true,
      valor: { sesionId: 'delta:S1:L1' },
    });
  });
});

describe('hostil-omite · pending_external no finge ok', () => {
  test('analisis E', async () => {
    const r = await crearPuertoAnalisisE().analizar(PIEZA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(MOTIVO_ANALISIS_E);
  });

  test('linea sin cacheDir|draft → deniega (no finge ok)', async () => {
    const r = await crearPuertoMaterializacionLinea().materializar(ANALISIS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(MOTIVO_LINEA_INPUT);
  });

  test('linea draft inválido → deniega', async () => {
    const r = await crearPuertoMaterializacionLinea({
      cacheDir: cacheDirLineaEfimero(),
      draftDesdeAnalisis: () => ({ id: '', origin: '', destination: '' }),
    }).materializar(ANALISIS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('draft inválido');
  });

  test('linea tipada · fixture mínima → ok (materializeRecorrido)', async () => {
    const cacheDir = cacheDirLineaEfimero();
    const puerto = crearPuertoMaterializacionLinea({
      materializar: materializeRecorrido,
      cacheDir,
      draftDesdeAnalisis: draftMinimoDesdeAnalisis,
    });
    expect(puerto.acople()).toBe('conectado');
    const r = await puerto.materializar(ANALISIS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.lineaId).toBe('linea-a1');
  });

  test('evidencia (acta-kit tipado ≠ HUB canónico)', async () => {
    const r = await crearPuertoEvidenciaCanonica().verificar({ lineaId: 'l1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(MOTIVO_EVIDENCIA);
  });

  test('proyeccion sin sumidero', async () => {
    const r = await crearPuertoProyeccion().publicar({
      resourceVersion: '1',
      estado: 'pending',
    });
    expect(r.ok).toBe(false);
  });
});

describe('wire Ciudad · payloads reales', () => {
  test('walk usa anchorId|nodeId flat (makeIntent), no destino', () => {
    const a = intentWalk(ACTOR, { anchorId: 'ancla-lore' });
    expect(a.intent).toBe('walk');
    expect(a.anchorId).toBe('ancla-lore');
    expect(Object.prototype.hasOwnProperty.call(a, 'destino')).toBe(false);

    const n = intentWalk(ACTOR, { nodeId: 'plaza' });
    expect(n.intent).toBe('walk');
    expect(n.nodeId).toBe('plaza');
  });

  test('announce usa message flat; sin clave mensaje', () => {
    const i = intentAnnounce(ACTOR, 'hola');
    expect(i.intent).toBe('announce');
    expect(i.message).toBe('hola');
    expect(Object.prototype.hasOwnProperty.call(i, 'mensaje')).toBe(false);
  });

  test('wake usa tool+horseMode y actor real (no actor sintético)', () => {
    const i = intentWake(ACTOR, { tool: 'horse', barrioId: 'b1' });
    expect(i.actorId).toBe('actor-prueba');
    expect(i.intent).toBe('wake');
    expect(i.tool).toBe('horse');
    expect(i.horseMode).toBe('stub');
    expect(i.barrioId).toBe('b1');
    expect(i.actorId).not.toBe('h-sdk');
  });
});
