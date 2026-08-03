// Suite del linter de BACKLOG despachable (verificar-backlog.mjs).
// Ejecutar: node --test skills/swarm-orquestacion/scripts/verificar-backlog.test.mjs
//
// Política verificada aquí (v2, tras contrarrevisión): BLOQUEA lo decidible
// (campos, conjuntos, contradicciones, deps, ciclos, suelos, AUSENCIA) y AVISA
// sin bloquear sobre CA ornamental. Los casos rojos permanentes de la
// devolución están marcados con [B1]…[B4] y [M1]…[M5].
//
// Fixtures SINTÉTICAS (serie FX-…), sin nombres ni rutas de ningún mundo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  analizarCA,
  parsearBacklog,
  detectarCiclos,
  verificarBacklog,
  configurar,
  parsearArgv,
  significativosDistintos,
  leerDeps,
  anchoIndentacion,
  ErrorUso,
  CAMPOS,
  MOTIVOS_AVISO,
} from './verificar-backlog.mjs';

const SCRIPT = fileURLToPath(new URL('./verificar-backlog.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../examples/fixture-backlog/', import.meta.url));
const CASOS = JSON.parse(readFileSync(join(FIXTURES, 'casos.json'), 'utf-8'));

/** CLI con la calibración de la fixture. */
function correr(ruta, extra = []) {
  return crudo(['--backlog', ruta, '--series', CASOS.series, '--prioridades', CASOS.prioridades, ...extra]);
}

/** CLI con argv literal (para probar el contrato de uso). */
function crudo(argv) {
  const r = spawnSync(process.execPath, [SCRIPT, ...argv], { encoding: 'utf-8' });
  return { status: r.status, salida: `${r.stdout}\n${r.stderr}` };
}

function correrJson(ruta, extra = []) {
  const r = correr(ruta, ['--json', ...extra]);
  return { ...r, reporte: JSON.parse(r.salida.trim()) };
}

const cfg = configurar();
const cfgFx = configurar({ series: 'FX-[A-Z][0-9]{2}' });

function backlogDe(filas, cabecera = '| WP | P | BRIEF | CA | deps | ejes |') {
  return `# BACKLOG\n\n## Lane A · ALFA\n\n${cabecera}\n| -- | - | ----- | -- | ---- | ---- |\n${filas.join('\n')}\n`;
}
const FILA_OK = '| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico devuelve exit 0 | ninguna | I |';

// ===========================================================================
// 1. Tabla de casos: cada fixture con su veredicto, sus defectos y sus avisos
// ===========================================================================

for (const caso of CASOS.casos) {
  test(`fixture ${caso.cara}: ${caso.fixture} → exit ${caso.exit} (${caso.descripcion})`, () => {
    const ruta = join(FIXTURES, caso.fixture);
    const extra = caso.args || [];
    const { status, salida } = correr(ruta, extra);
    assert.equal(status, caso.exit, `exit inesperado.\n${salida}`);

    const { reporte } = correrJson(ruta, extra);
    assert.equal(reporte.resumen.wps, caso.wps, `WPs parseados inesperados.\n${salida}`);
    assert.deepEqual(reporte.resumen.porMotivo, caso.motivos, `defectos bloqueantes: recuento exacto.\n${salida}`);
    assert.deepEqual(reporte.resumen.porMotivoAviso, caso.avisos, `avisos: recuento exacto.\n${salida}`);
    for (const cita of caso.citas) {
      assert.ok(salida.includes(cita), `el mensaje debe citar «${cita}».\n${salida}`);
    }
    for (const d of [...reporte.defectos, ...reporte.avisos]) {
      assert.ok(d.wp, 'todo defecto/aviso nombra el WP');
      assert.ok(CAMPOS.includes(d.campo), `campo desconocido: ${d.campo}`);
      assert.ok(d.detalle && d.detalle.length > 20, 'todo defecto/aviso explica el motivo');
    }
    // Ningún motivo de aviso puede aparecer como bloqueante, ni al revés.
    for (const m of Object.keys(reporte.resumen.porMotivo)) {
      assert.ok(!MOTIVOS_AVISO.includes(m), `${m} es aviso: no puede decidir el exit`);
    }
    for (const m of Object.keys(reporte.resumen.porMotivoAviso)) {
      assert.ok(MOTIVOS_AVISO.includes(m), `${m} no está declarado como aviso`);
    }
  });
}

test('coherencia de la tabla: solo valida/aviso salen en verde; ausencia siempre exit 3', () => {
  for (const c of CASOS.casos) {
    if (c.exit === 0) assert.ok(['valida', 'aviso'].includes(c.cara), `${c.fixture} verde con cara ${c.cara}`);
    if (c.cara === 'invalida') assert.equal(c.exit, 1, `${c.fixture}`);
    if (c.cara === 'ausencia') assert.equal(c.exit, 3, `${c.fixture}`);
  }
  assert.ok(CASOS.casos.filter((c) => c.cara === 'valida').length >= 5, 'al menos cinco fixtures válidas');
  assert.ok(CASOS.casos.filter((c) => c.cara === 'ausencia').length >= 8, 'al menos ocho caras de ausencia');
});

// ===========================================================================
// 2. Política: el aviso de CA informa pero NO bloquea
// ===========================================================================

test('CA ornamental: se cita con su motivo y su texto literal, y el exit sigue siendo 0', () => {
  const { status, salida, reporte } = correrJson(join(FIXTURES, 'backlog-ca-ornamental.md'));
  assert.equal(status, 0, 'la calidad del CA es juicio: no decide el despacho');
  assert.equal(reporte.resumen.defectos, 0);
  assert.equal(reporte.resumen.avisos, 5, salida);
  assert.equal(reporte.avisos[0].wp, 'FX-A01');
  assert.match(reporte.avisos[0].detalle, /queda elegante/);
});

test('un backlog con TODOS los CA ornamentales sigue siendo despachable, con sus avisos', () => {
  const texto = backlogDe([
    '| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | queda elegante | ninguna | I |',
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | mejor estructurado | FX-A01 | II |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0);
  assert.equal(r.resumen.avisos, 2);
  assert.equal(r.resumen.defectos, 0);
});

// ===========================================================================
// 3. [B1] Ausencia: probar lo que CALLA, no solo lo malformado
// ===========================================================================

test('[B1] tabla INDENTADA 4 espacios → exit 3 (hermano del fence, no aprueba)', () => {
  const texto = `# BACKLOG

## Lane A · ALFA

    | WP | P | BRIEF | CA | deps | ejes |
    | -- | - | ----- | -- | ---- | ---- |
    ${FILA_OK}
`;
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 3, 'un documento que solo documenta el formato no es un backlog');
  assert.equal(r.resumen.wps, 0);
  assert.match(r.defectos.at(-1).detalle, /indentado=3/);
});

test('[B1] el mismo contenido en fence, comentario, indentado o cita da SIEMPRE exit 3', () => {
  const tabla = `| WP | P | BRIEF | CA | deps | ejes |\n| -- | - | ----- | -- | ---- | ---- |\n${FILA_OK}`;
  const envolturas = {
    fence: '```\n' + tabla + '\n```',
    comentario: '<!--\n' + tabla + '\n-->',
    indentado: tabla.split('\n').map((l) => `    ${l}`).join('\n'),
    cita: tabla.split('\n').map((l) => `> ${l}`).join('\n'),
  };
  for (const [causa, cuerpo] of Object.entries(envolturas)) {
    const r = verificarBacklog(`# BACKLOG\n\n## Lane A · ALFA\n\n${cuerpo}\n`, cfgFx);
    assert.equal(r.exit, 3, `envoltura ${causa} concedió`);
    assert.match(r.defectos.at(-1).detalle, new RegExp(`${causa}=`), `el diagnóstico debe nombrar la causa ${causa}`);
  }
});

// --- [D-A] el fence sigue la regla de CommonMark, no un toggle ------------

const TABLA = `| WP | P | BRIEF | CA | deps | ejes |\n| -- | - | ----- | -- | ---- | ---- |\n${FILA_OK}`;

test('[D-A] `~~~` NO cierra un fence de backticks: la tabla sigue velada', () => {
  const texto = `# BACKLOG\n\n\`\`\`\ntexto\n~~~\n${TABLA}\n\`\`\`\n`;
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 3, 'con toggle ingenuo esto aprobaba con exit 0');
  assert.equal(r.resumen.wps, 0);
});

test('[D-A] un fence de 4 backticks contiene uno de 3 y NO se cierra antes de tiempo', () => {
  const texto = `# BACKLOG\n\n\`\`\`\`markdown\n\`\`\`\n${TABLA.replace('FX-A01', 'FX-Z99')}\n\`\`\`\n\`\`\`\`\n\n## Lane A · ALFA\n\n${TABLA}\n`;
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, 'el backlog REAL de después no puede quedar velado (falso rechazo)');
  assert.deepEqual(r.wps.map((w) => w.id), ['FX-A01']);
});

test('[D-A] el cierre exige mismo carácter, longitud ≥ y nada más en la línea', () => {
  // `\`\`\` js` no cierra (lleva info string); `\`\`\`\`` sí (longitud ≥ 3).
  const sinCerrar = `# B\n\n\`\`\`\n${TABLA}\n\`\`\` js\n`;
  assert.equal(verificarBacklog(sinCerrar, cfgFx).exit, 3);
  const cierraLargo = `# B\n\n\`\`\`\nejemplo\n\`\`\`\`\n\n## Lane A · ALFA\n\n${TABLA}\n`;
  assert.equal(verificarBacklog(cierraLargo, cfgFx).exit, 0);
});

// --- [D-B] la familia entera, por estructura de bloque --------------------

test('[D-B] front-matter, <pre>, <details> y 3 espacios + tabulador → exit 3 con su causa', () => {
  const envolturas = {
    'front-matter': `---\ntabla: |\n${TABLA}\n---\n\n# B\n`,
    html: `# B\n\n<pre>\n${TABLA}\n</pre>\n`,
    indentado: `# B\n\n${TABLA.split('\n').map((l) => `   \t${l}`).join('\n')}\n`,
  };
  for (const [causa, texto] of Object.entries(envolturas)) {
    const r = verificarBacklog(texto, cfgFx);
    assert.equal(r.exit, 3, `envoltura ${causa} concedió`);
    assert.match(r.defectos.at(-1).detalle, new RegExp(`${causa}=`), `causa ${causa} no citada`);
  }
});

test('[D-B] la expansión de tabulador sigue CommonMark (3 espacios + tab = 4 columnas)', () => {
  assert.equal(anchoIndentacion('   \tx'), 4);
  assert.equal(anchoIndentacion('\tx'), 4);
  assert.equal(anchoIndentacion('  x'), 2);
});

test('[D-B] <details> con línea en blanco: la tabla vuelve a ser markdown y SÍ se lintea', () => {
  const texto = `# B\n\n<details>\n<summary>plegado</summary>\n\n## Lane A · ALFA\n\n${TABLA}\n`;
  assert.equal(verificarBacklog(texto, cfgFx).exit, 0, 'CommonMark: el bloque HTML tipo 6 acaba en línea vacía');
});

test('[D-B] región declarada: lo de fuera se ignora por construcción', () => {
  const cfgReg = configurar({ series: 'FX-[A-Z][0-9]{2}', regionInicio: '<!-- bl:ini -->', regionFin: '<!-- bl:fin -->' });
  const texto = `# B\n\n## Lane A · ALFA\n\n${TABLA.replace('FX-A01', 'FX-Z99')}\n\n<!-- bl:ini -->\n\n## Lane A · ALFA\n\n${TABLA}\n\n<!-- bl:fin -->\n\n${TABLA.replace('FX-A01', 'FX-Z98')}\n`;
  const r = verificarBacklog(texto, cfgReg);
  assert.equal(r.exit, 0);
  assert.deepEqual(r.wps.map((w) => w.id), ['FX-A01'], 'solo la región declara WPs');
});

test('[D-B] región declarada ausente → exit 3 limpio, nunca verde', () => {
  const cfgReg = configurar({ series: 'FX-[A-Z][0-9]{2}', regionInicio: '<!-- bl:ini -->' });
  const r = verificarBacklog(`# B\n\n## Lane A · ALFA\n\n${TABLA}\n`, cfgReg);
  assert.equal(r.exit, 3);
  assert.equal(r.resumen.porMotivo['region-ausente'], 1);
});

// --- [D-C] deps en prosa: holgura declarada, sin falsos rechazos ----------

test('[D-C] «FX-A01 y FX-A03» son dos dependencias, no un WP llamado «y»', () => {
  const { ids, nulos, ilegibles } = leerDeps('FX-A01 y FX-A03', cfgFx);
  assert.deepEqual(ids, ['FX-A01', 'FX-A03']);
  assert.deepEqual(nulos, []);
  assert.deepEqual(ilegibles, []);
});

test('[D-C] «Ninguna.» y «ninguna (WP raiz)» son «sin dependencias», no defectos', () => {
  for (const celda of ['Ninguna.', 'ninguna (WP raiz)', 'NINGUNA;', '(ninguna)']) {
    const { ids, nulos, ilegibles } = leerDeps(celda, cfgFx);
    assert.deepEqual(ids, [], `${celda} no declara dependencias`);
    assert.equal(nulos.length, 1, `${celda} declara el token nulo`);
    assert.deepEqual(ilegibles, [], `${celda} no deja ilegibles`);
  }
});

test('[D-C] un backlog entero con deps en prosa es despachable', () => {
  const texto = backlogDe([
    '| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor devuelve exit 0 | Ninguna. | I |',
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion | ninguna (WP raiz del carril) | II |',
    '| **FX-A03** | P2 | publicar la cara publica del kit | el script de ceguera imprime ceguera 0 hits | FX-A01 y FX-A02 | ceguera |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, JSON.stringify(r.defectos, null, 2));
  assert.deepEqual(r.wps[2].depsIds, ['FX-A01', 'FX-A02']);
});

test('[D-C] la prosa sin dígitos se ignora, pero un ID roto NO se traga', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | extraer el kit de plantillas | el probe devuelve exit 0 | FXA01 | I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.resumen.porMotivo['dep-no-interpretable'], 1, 'un token con dígitos que no es ID se caza');
  assert.match(r.defectos[0].detalle, /FXA01/);
});

test('[D-C] la contradicción se mantiene con la holgura nueva', () => {
  const texto = backlogDe([
    FILA_OK,
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | el probe devuelve exit 0 | ninguna y FX-A01 | II |',
  ]);
  assert.equal(verificarBacklog(texto, cfgFx).resumen.porMotivo['deps-contradictorias'], 1);
});

// --- 3ª devolución: D-A tipo 6, D-B omisión, D-C dígito en prosa ----------

test('[D-A3] bloque HTML tipo 6: basta con que la línea EMPIECE por la etiqueta', () => {
  const casos = {
    'details inline': `<details><summary>Backlog v1 (obsoleto)</summary>\n${TABLA}\n</details>`,
    'div con texto': `<div align="center">Texto\n${TABLA}\n</div>`,
    'p con texto': `<p>Texto de intro\n${TABLA}`,
  };
  for (const [nombre, cuerpo] of Object.entries(casos)) {
    const r = verificarBacklog(`# BACKLOG\n\n${cuerpo}\n`, cfgFx);
    assert.equal(r.exit, 3, `${nombre} concedió (markdown NO renderiza esa tabla)`);
    assert.match(r.defectos.at(-1).detalle, /html=/);
  }
});

test('[D-A3] la etiqueta inline tampoco se cuela DENTRO de la región declarada', () => {
  const cfgReg = configurar({ series: 'FX-[A-Z][0-9]{2}', regionInicio: '<!-- bl:ini -->' });
  const texto = `# B\n\n<!-- bl:ini -->\n\n<details><summary>plegado</summary>\n${TABLA}\n</details>\n`;
  assert.equal(verificarBacklog(texto, cfgReg).exit, 3, 'el cierre estructural no tapa una envoltura mal implementada');
});

test('[D-A3] y sigue valiendo lo contrario: línea en blanco reabre markdown', () => {
  const texto = `# B\n\n<details><summary>plegado</summary>\n\n## Lane A · ALFA\n\n${TABLA}\n`;
  assert.equal(verificarBacklog(texto, cfgFx).exit, 0, 'CommonMark: el tipo 6 acaba en línea vacía');
});

test('[D-B3] `deps` que no declara nada → defecto, nunca omisión silenciosa', () => {
  for (const celda of ['las dos anteriores', 'las mismas del WP anterior', 'segun la ola']) {
    const texto = backlogDe([`| **FX-A01** | P0 | extraer el kit de plantillas del mundo | el probe devuelve exit 0 | ${celda} | I |`]);
    const r = verificarBacklog(texto, cfgFx);
    assert.equal(r.resumen.porMotivo['deps-no-declaradas'], 1, `«${celda}» pasó en silencio`);
    assert.equal(r.exit, 1);
  }
});

test('[D-B3] pero declarar de verdad sigue pasando', () => {
  for (const celda of ['ninguna', 'FX-A01', 'ninguna (WP raiz)', 'FX-A01 y FX-A01']) {
    const texto = backlogDe([
      FILA_OK,
      `| **FX-A02** | P0 | cablear el kit en el adaptador | el probe devuelve exit 0 | ${celda} | I |`,
    ]);
    const r = verificarBacklog(texto, cfgFx);
    assert.equal(r.resumen.porMotivo['deps-no-declaradas'], undefined, `«${celda}» no declara nada?`);
  }
});

test('[D-C3] un número en prosa NO es un ID roto: «(ambas de la ola 1)» pasa', () => {
  const realistas = [
    'FX-A01, FX-A03 (ambas de la ola 1)',
    'ninguna (raiz de la ola 2)',
    'FX-A01 (ver seccion 3)',
    'FX-A01 y FX-A03 (ola 1)',
  ];
  for (const celda of realistas) {
    const { ilegibles } = leerDeps(celda, cfgFx);
    assert.deepEqual(ilegibles, [], `«${celda}» rechazada por un número suelto`);
  }
  // La forma que SÍ se caza es el ID roto: letras y dígitos mezclados.
  assert.deepEqual(leerDeps('FXA01', cfgFx).ilegibles, ['FXA01']);
  assert.deepEqual(leerDeps('FX_A01', cfgFx).ilegibles, ['FX_A01']);
});

test('[D-C3] el backlog realista con paréntesis y números es despachable', () => {
  const texto = backlogDe([
    '| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor devuelve exit 0 | ninguna (raiz de la ola 2) | I |',
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion | FX-A01 (ver seccion 3) | II |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, JSON.stringify(r.defectos, null, 2));
  assert.deepEqual(r.wps[1].depsIds, ['FX-A01']);
});

test('[D-D3] la prosa se ignora por FORMA, no por una lista de conectores', () => {
  // No hay flag de conectores: `y`, `e`, `and`, `ambas`… se ignoran porque no
  // tienen forma de ID, no porque estén declarados. Un conector inventado
  // funciona igual, y por eso la lista habría sido código muerto.
  for (const union of ['y', 'e', 'and', 'junto con', 'ademas de', 'zzz']) {
    const { ids } = leerDeps(`FX-A01 ${union} FX-A03`, cfgFx);
    assert.deepEqual(ids, ['FX-A01', 'FX-A03'], `unión «${union}»`);
  }
  assert.throws(() => configurar({}, ['--conectores-deps', 'y']), ErrorUso, 'la flag muerta se retiró, no se finge');
});

test('[D-F] las flags de región se validan como las demás', () => {
  assert.throws(() => configurar({}, ['--region-inicio', '']), ErrorUso);
  assert.throws(() => configurar({}, ['--region-inicio', '   ']), ErrorUso);
  assert.throws(() => configurar({}, ['--region-fin', '<!-- fin -->']), ErrorUso, '--region-fin sin --region-inicio');
  assert.throws(() => configurar({}, ['--lexico-modo', 'perro']), ErrorUso);
  assert.throws(() => configurar({}, ['--lexico-modo', 'extender']), ErrorUso, 'modo sin fichero');
  assert.throws(() => configurar({}, ['--alias-modo', 'reemplazar']), ErrorUso, 'modo sin fichero');
  assert.equal(crudo(['--backlog', VALIDA, '--region-inicio', '']).status, 2);
});

test('[D-F] marca de fin declarada pero ausente → defecto, no extensión muda hasta EOF', () => {
  const cfgReg = configurar({ series: 'FX-[A-Z][0-9]{2}', regionInicio: '<!-- ini -->', regionFin: '<!-- fin -->' });
  const texto = `# B\n\n<!-- ini -->\n\n## Lane A · ALFA\n\n${TABLA}\n`;
  const r = verificarBacklog(texto, cfgReg);
  assert.equal(r.resumen.porMotivo['region-sin-cierre'], 1);
  assert.equal(r.exit, 1);
});

test('[D-E] el límite de tamaño declarado es real: cadena profunda → exit 2 fail-closed', () => {
  // Cadena PROFUNDA (cada WP depende del SIGUIENTE): el DFS recorre entera.
  const n = 6000;
  const filas = [];
  for (let i = 1; i <= n; i++) {
    const id = `FX-${String(i).padStart(6, '0')}`;
    const dep = i < n ? `FX-${String(i + 1).padStart(6, '0')}` : 'ninguna';
    filas.push(`| **${id}** | P0 | extraer el kit numero ${i} del mundo | el probe del consumidor devuelve exit 0 | ${dep} | I |`);
  }
  const dir = mkdtempSync(join(tmpdir(), 'lint-carga-'));
  try {
    const f = join(dir, 'BACKLOG.md');
    writeFileSync(f, backlogDe(filas));
    const r = crudo(['--backlog', f, '--series', 'FX-[0-9]{6}']);
    assert.equal(r.status, 2, 'desbordar la pila NO puede conceder');
    assert.match(r.salida, /fallo interno/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- menores de la devolución --------------------------------------------

test('[d4] --ayuda combinada con otras flags → exit 2 (nunca exit 0 sin veredicto)', () => {
  const r = crudo(['--backlog', VALIDA, '-h']);
  assert.equal(r.status, 2, r.salida);
  assert.match(r.salida, /no se combina/);
  assert.equal(crudo(['--ayuda']).status, 0, 'la ayuda sola sigue siendo exit 0');
});

test('[d6] una fila que parece separador es fila de DATOS, no omisión silenciosa', () => {
  const texto = backlogDe([FILA_OK, '| - | - | - | - | - | - |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 1);
  assert.equal(r.resumen.porMotivo['campo-ausente'], 1);
  assert.match(r.defectos[0].detalle, /sin ID/);
});

test('[d7] el BRIEF también recibe aviso cuando la valoración domina', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | dejarlo todo mas limpio y elegante | el probe del consumidor devuelve exit 0 | ninguna | I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, 'sigue sin bloquear');
  assert.equal(r.resumen.porMotivoAviso['BRIEF-ornamental/valoracion'], 1);
});

test('[d8] las etiquetas HTML no son comparadores', () => {
  assert.equal(analizarCA('codigo mas legible <b>2</b> veces', cfg).motivo, 'CA-ornamental/sin-ancla');
});

test('[d5] --series vacío es tan inválido como --prioridades vacío (exit 2)', () => {
  assert.equal(crudo(['--backlog', VALIDA, '--series', '']).status, 2);
  assert.equal(crudo(['--backlog', VALIDA, '--patron-lane', '  ']).status, 2);
});

test('[ruido] los verbos de variación anclan: «no baja del 80%» es verificable', () => {
  assert.equal(analizarCA('el informe de cobertura no baja del 80% respecto a la rama base', cfg).ok, true);
  assert.equal(analizarCA('el tiempo de arranque no supera los 2 segundos', cfg).ok, true);
});

test('[M5] el diagnóstico de ausencia no miente sobre la causa', () => {
  const { salida } = correr(join(FIXTURES, 'backlog-tabla-en-cita.md'));
  assert.match(salida, /cita=3/, 'dice que la tabla estaba citada');
  assert.match(salida, /NO legibles como tabla/);
});

test('AUSENCIA: fichero inexistente → exit 2, nunca verde', () => {
  const { status, salida } = correr(join(FIXTURES, 'no-existe-este-backlog.md'));
  assert.equal(status, 2);
  assert.match(salida, /inexistente/);
});

test('AUSENCIA: fichero solo con espacios en blanco → exit 3', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lint-backlog-'));
  try {
    const f = join(dir, 'BACKLOG.md');
    writeFileSync(f, '\n\n   \n\t\n');
    const { status, salida } = correr(f);
    assert.equal(status, 3, salida);
    assert.match(salida, /backlog-vacio/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('AUSENCIA: todas las filas de serie ajena → 0 WPs y exit 3 (jamás verde por vacío)', () => {
  const texto = backlogDe(['| **ZZ-01** | P0 | fila de serie ajena al mundo | el probe de la fixture falla sin firma | ninguna | I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 3);
  assert.equal(r.resumen.wps, 0);
  assert.equal(r.resumen.porMotivo['serie-no-declarada'], 1);
  assert.equal(r.resumen.porMotivo['sin-wps'], 1);
});

test('AUSENCIA: deps en blanco NO significa «sin dependencias» (se declara o cae)', () => {
  const fila = (deps) =>
    backlogDe([`| **FX-A01** | P0 | extraer el kit de plantillas | el probe del consumidor devuelve exit 0 | ${deps} | I |`]);
  assert.equal(verificarBacklog(fila('ninguna'), cfgFx).exit, 0, 'declarar «ninguna» pasa');
  const omitido = verificarBacklog(fila(' '), cfgFx);
  assert.equal(omitido.exit, 1, 'omitir el campo NO pasa');
  assert.equal(omitido.defectos[0].motivo, 'campo-ausente');
  assert.equal(omitido.defectos[0].campo, 'deps');
});

// ===========================================================================
// 4. [B2][B3][M1] Contrato de uso: una duda de configuración es exit 2
// ===========================================================================

const VALIDA = join(FIXTURES, 'backlog-valido.md');

test('[B2] --umbral-valoracion no numérico → exit 2 (NO desactiva la regla en silencio)', () => {
  const r = crudo(['--backlog', VALIDA, '--series', CASOS.series, '--umbral-valoracion', 'perro']);
  assert.equal(r.status, 2, r.salida);
  assert.match(r.salida, /no es un numero/);
});

test('[B2] --min-palabras-brief y --min-palabras-ca inválidos → exit 2', () => {
  for (const flag of ['--min-palabras-brief', '--min-palabras-ca']) {
    assert.equal(crudo(['--backlog', VALIDA, flag, 'NaN']).status, 2, flag);
    assert.equal(crudo(['--backlog', VALIDA, flag, '0']).status, 2, `${flag} fuera de rango`);
    assert.equal(crudo(['--backlog', VALIDA, flag, '1.5']).status, 2, `${flag} no entero`);
  }
  assert.equal(crudo(['--backlog', VALIDA, '--umbral-valoracion', '7']).status, 2, 'umbral fuera de [0,1]');
});

test('[B3] flag desconocida o mal escrita → exit 2, jamás lintea el fichero por defecto', () => {
  const r = crudo(['--backlgo', VALIDA]);
  assert.equal(r.status, 2, r.salida);
  assert.match(r.salida, /flag desconocida «--backlgo»/);
  assert.match(r.salida, /querias --backlog/);
  assert.doesNotMatch(r.salida, /DESPACHABLE/, 'no puede contestar sobre otro fichero');
});

test('[B3] argumento posicional suelto → exit 2', () => {
  const r = crudo([VALIDA]);
  assert.equal(r.status, 2, r.salida);
  assert.match(r.salida, /argumento suelto/);
});

test('[B3] la forma GNU --flag=valor se admite de verdad', () => {
  const r = crudo([`--backlog=${VALIDA}`, `--series=${CASOS.series}`]);
  assert.equal(r.status, 0, r.salida);
  assert.match(r.salida, /4 WP/);
  assert.equal(crudo([`--json=si`, `--backlog=${VALIDA}`]).status, 2, 'una booleana con valor es error');
});

test('[B3] flag de valor sin valor → exit 2', () => {
  assert.equal(crudo(['--backlog']).status, 2);
  assert.equal(crudo(['--backlog', '--json']).status, 2);
});

test('[M1] regex inválida en --series, --patron-lane o --deps-externas → exit 2 (no exit 1)', () => {
  const a = crudo(['--backlog', VALIDA, '--series', 'FX-[A-Z][0-9]{2(']);
  assert.equal(a.status, 2, a.salida);
  assert.match(a.salida, /expresion regular invalida/);
  assert.equal(crudo(['--backlog', VALIDA, '--patron-lane', '^(##']).status, 2);
  assert.equal(crudo(['--backlog', VALIDA, '--deps-externas', '(']).status, 2);
});

test('conjunto vacío en --prioridades/--ejes → exit 2 (rechazaría todo)', () => {
  assert.equal(crudo(['--backlog', VALIDA, '--prioridades', '']).status, 2);
  assert.equal(crudo(['--backlog', VALIDA, '--ejes', ' , ']).status, 2);
});

test('parsearArgv y configurar lanzan ErrorUso (código 2), no un veredicto', () => {
  assert.throws(() => parsearArgv(['--noexiste']), ErrorUso);
  assert.throws(() => configurar({}, ['--umbral-valoracion', 'x']), (e) => e instanceof ErrorUso && e.codigo === 2);
});

// ===========================================================================
// 5. [B4] Suelo objetivo y declarado
// ===========================================================================

test('[B4] el suelo cuenta palabras DISTINTAS: «zzz zzz zzz» no son tres palabras', () => {
  assert.deepEqual(significativosDistintos('zzz zzz zzz', cfg), ['zzz']);
  const texto = backlogDe(['| **FX-A01** | P0 | zzz zzz zzz | ok ok | ninguna | I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 1);
  assert.equal(r.resumen.porMotivo['brief-insuficiente'], 1);
  assert.equal(r.resumen.porMotivo['ca-insuficiente'], 1);
  assert.match(r.defectos[0].detalle, /DISTINTA\(S\)/);
});

test('[B4] el suelo del CA es objetivo, no juicio: dos palabras distintas bastan', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | extraer el kit de plantillas del mundo | frases-contrato grepables | ninguna | I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, JSON.stringify(r.defectos, null, 2));
  assert.equal(r.resumen.avisos, 0, 'y además no es ornamental: «grepables» es ancla');
});

test('[B4] los suelos son parámetros del consumidor', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | extraer el kit de plantillas del mundo | frases-contrato grepables | ninguna | I |']);
  const exigente = configurar({ series: 'FX-[A-Z][0-9]{2}', minPalabrasCa: 5 });
  assert.equal(verificarBacklog(texto, exigente).resumen.porMotivo['ca-insuficiente'], 1);
});

// ===========================================================================
// 6. El aviso: ancla + objeto, sin que un dígito ancle nada
// ===========================================================================

test('CA ornamental: la valoración domina («queda elegante»)', () => {
  const a = analizarCA('queda elegante', cfg);
  assert.equal(a.ok, false);
  assert.equal(a.motivo, 'CA-ornamental/valoracion');
  assert.match(a.detalle, /queda/);
});

test('CA ornamental: «mejor estructurado» y «se revisa la calidad» caen por valoración', () => {
  assert.equal(analizarCA('mejor estructurado', cfg).motivo, 'CA-ornamental/valoracion');
  assert.equal(analizarCA('se revisa la calidad', cfg).motivo, 'CA-ornamental/valoracion');
});

test('CA ornamental: sin ancla («el modulo queda listo para su uso») y sin objeto («el test pasa»)', () => {
  assert.equal(analizarCA('el modulo queda listo para su uso', cfg).motivo, 'CA-ornamental/sin-ancla');
  const b = analizarCA('el test pasa', cfg);
  assert.equal(b.motivo, 'CA-ornamental/sin-objeto');
  assert.deepEqual(b.contenido, []);
});

test('ASIMETRÍA 1 cerrada: un dígito suelto NO ancla nada', () => {
  assert.equal(analizarCA('el modulo queda listo para su uso en 2 sitios', cfg).motivo, 'CA-ornamental/sin-ancla');
  assert.equal(analizarCA('queda elegante en 3 sitios', cfg).motivo, 'CA-ornamental/valoracion');
  // Sí ancla cuando hay medida: comparador, unidad o ancla al lado.
  assert.equal(analizarCA('ceguera del arbol = 0', cfg).ok, true);
  assert.equal(analizarCA('el grep del simbolo devuelve 0 hits en el arbol', cfg).ok, true);
  assert.equal(analizarCA('el probe del adaptador devuelve exit 0', cfg).ok, true);
});

test('ASIMETRÍA 2 cerrada: concatenar no diluye — se analiza por segmentos', () => {
  const a = analizarCA('queda elegante · el probe de omision deniega el mensaje sin firma', cfg);
  assert.equal(a.ok, false);
  assert.equal(a.alcance, 'segmento');
  assert.match(a.detalle, /segmento «queda elegante»/);
  const b = analizarCA('el modulo queda listo · grep del simbolo devuelve 1 definicion', cfg);
  assert.equal(b.ok, false);
});

test('los fragmentos de medida no se juzgan sueltos («exit 0» tras un segmento bueno)', () => {
  const a = analizarCA('el probe del consumidor resuelve la plantilla; exit 0', cfg);
  assert.equal(a.ok, true, JSON.stringify(a));
});

test('CAs legítimos que antes caían: morfología y negación universal', () => {
  for (const ca of [
    'ningun usuario sin rol puede abrir la sala',
    'la migracion es idempotente: dos ejecuciones dejan la tabla igual',
    'no queda ninguna referencia al simbolo antiguo en el arbol',
    'frases-contrato grepables',
    'dos builds comparan el manifiesto logico',
    'push default bloqueado y documentado',
  ]) {
    const a = analizarCA(ca, cfg);
    assert.equal(a.ok, true, `deberia pasar: «${ca}» → ${a.motivo}`);
  }
});

test('LÍMITE HONESTO: el aviso mira la forma, no la verdad ni el idioma', () => {
  // Nombra un probe que puede no existir: forma correcta, verdad no verificada.
  assert.equal(analizarCA('el probe inventado de la capa fantasma falla si falta el campo', cfg).ok, true);
  // Comprobación real + adorno: pasa, porque contiene una comprobación.
  assert.equal(analizarCA('queda elegante y el build de docs pasa con exit 0', cfg).ok, true);
  // Idioma: el léxico por defecto es castellano (se sustituye con --lexico).
  assert.equal(analizarCA('no user without a role can open the room', cfg).ok, false);
  // Precio de cerrar la asimetría del dígito: un CA telegráfico avisa.
  assert.equal(analizarCA('ceguera 0', cfg).motivo, 'CA-ornamental/sin-ancla');
});

test('--ca-estricto sube el listón: exige referente fuerte (código, ruta o cantidad)', () => {
  const estricto = configurar({ caEstricto: true });
  const ca = 'la suite del segundo cliente pasa en verde sin tocar al primero';
  assert.equal(analizarCA(ca, cfg).ok, true);
  assert.equal(analizarCA(ca, estricto).motivo, 'CA-ornamental/sin-referente');
  assert.equal(analizarCA('`npm test` del cliente sintetico devuelve exit 0', estricto).ok, true);
});

// ===========================================================================
// 7. [M2][M3][M4] Contradicciones, enlaces y conjuntos
// ===========================================================================

test('[M2] una dep escrita como enlace markdown resuelve (no es dep-inexistente)', () => {
  const texto = backlogDe([
    FILA_OK,
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | el probe del adaptador devuelve exit 0 | [FX-A01](#fx-a01) | II |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 0, JSON.stringify(r.defectos, null, 2));
  assert.deepEqual(r.wps[1].depsIds, ['FX-A01']);
});

test('[M3] «ninguna» junto a una dep real es contradicción, no una dep más', () => {
  const texto = backlogDe([
    FILA_OK,
    '| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | el probe del adaptador devuelve exit 0 | ninguna, FX-A01 | II |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.resumen.porMotivo['deps-contradictorias'], 1);
  assert.equal(r.exit, 1);
});

test('[M4] «ninguno» junto a otros ejes es contradicción', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | extraer el kit de plantillas del mundo | el probe devuelve exit 0 | ninguna | ninguno, I |']);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.resumen.porMotivo['ejes-contradictorios'], 1);
});

test('[M4] la lane se valida contra el conjunto cuando el mundo lo declara', () => {
  const texto = backlogDe([FILA_OK]);
  assert.equal(verificarBacklog(texto, cfgFx).exit, 0, 'sin --lanes no se valida el conjunto');
  const conLanes = configurar({ series: 'FX-[A-Z][0-9]{2}', lanes: ['B · BETA'] });
  assert.equal(verificarBacklog(texto, conLanes).resumen.porMotivo['lane-desconocida'], 1);
  const buena = configurar({ series: 'FX-[A-Z][0-9]{2}', lanes: ['A · ALFA', 'B · BETA'] });
  assert.equal(verificarBacklog(texto, buena).exit, 0);
});

// ===========================================================================
// 8. Ciclos concretos
// ===========================================================================

test('ciclo propio (A → A) se señala como ciclo de 1', () => {
  assert.deepEqual(detectarCiclos([{ id: 'FX-A01', depsIds: ['FX-A01'] }]), [['FX-A01', 'FX-A01']]);
});

test('un mismo ciclo no se reporta dos veces', () => {
  const wps = [
    { id: 'FX-A01', depsIds: ['FX-A02'] },
    { id: 'FX-A02', depsIds: ['FX-A03'] },
    { id: 'FX-A03', depsIds: ['FX-A01'] },
  ];
  assert.equal(detectarCiclos(wps).length, 1);
});

test('dos ciclos independientes se reportan por separado', () => {
  const wps = [
    { id: 'FX-A01', depsIds: ['FX-A02'] },
    { id: 'FX-A02', depsIds: ['FX-A01'] },
    { id: 'FX-B01', depsIds: ['FX-B02'] },
    { id: 'FX-B02', depsIds: ['FX-B01'] },
  ];
  assert.equal(detectarCiclos(wps).length, 2);
});

test('un DAG profundo no inventa ciclos', () => {
  const wps = [
    { id: 'FX-A01', depsIds: [] },
    { id: 'FX-A02', depsIds: ['FX-A01'] },
    { id: 'FX-A03', depsIds: ['FX-A01', 'FX-A02'] },
    { id: 'FX-B01', depsIds: ['FX-A03'] },
  ];
  assert.deepEqual(detectarCiclos(wps), []);
});

// ===========================================================================
// 9. Parametrización: nada cableado a un mundo concreto
// ===========================================================================

test('los conjuntos de prioridades y ejes son del consumidor', () => {
  const texto = `# B

## Carril A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **QQ-7** | urgente | extraer el kit de plantillas del mundo | el probe del consumidor devuelve exit 0 | ninguna | forma |
`;
  const estandar = verificarBacklog(texto, configurar({ series: 'QQ-[0-9]+' }));
  assert.equal(estandar.exit, 1);
  assert.ok(estandar.resumen.porMotivo['prioridad-invalida']);
  assert.ok(estandar.resumen.porMotivo['eje-desconocido']);

  const propio = verificarBacklog(
    texto,
    configurar({ series: 'QQ-[0-9]+', prioridades: ['urgente', 'normal'], ejes: ['forma', 'fondo'] })
  );
  assert.equal(propio.exit, 0, 'con los conjuntos del consumidor, el mismo backlog es despachable');
  assert.equal(propio.wps[0].lane, 'A · ALFA', 'la lane se toma del encabezado (patrón parametrizable)');
});

test('--deps-externas permite dependencias fuera del backlog cuando el mundo lo declara', () => {
  const texto = backlogDe(['| **FX-A01** | P0 | extraer el kit de plantillas del mundo | el probe devuelve exit 0 | EXT-9 | I |']);
  assert.equal(verificarBacklog(texto, cfgFx).resumen.porMotivo['dep-inexistente'], 1);
  const abierto = configurar({ series: 'FX-[A-Z][0-9]{2}', depsExternas: 'EXT-[0-9]+' });
  assert.equal(verificarBacklog(texto, abierto).exit, 0);
});

test('el léxico es sustituible por el consumidor (idioma incluido)', () => {
  const base = configurar();
  const otro = configurar({
    lexico: {
      ...base.lexico,
      ornamentales: ['chachi'],
      ornamentalesLema: [],
      anclas: [...base.lexico.anclas, 'passes'],
      anclasLema: [],
    },
  });
  assert.equal(analizarCA('chachi chachi', otro).motivo, 'CA-ornamental/valoracion');
  assert.equal(analizarCA('the migration probe passes twice', otro).ok, true);
});

test('alias de columnas: el mundo puede llamar a sus columnas como quiera', () => {
  const texto = `# B

## Lane A · ALFA

| id | prioridad | encargo | criterio | dependencias | eje |
| -- | --------- | ------- | -------- | ------------ | --- |
| **FX-A01** | P0 | extraer el kit de plantillas del mundo | el probe del consumidor devuelve exit 0 | ninguna | I |
`;
  assert.equal(verificarBacklog(texto, cfgFx).exit, 0);
});

// ===========================================================================
// 10. Parseo: lo que NO es una fila de WP
// ===========================================================================

test('las tablas sin columna de WP se ignoran, pero delatan IDs colados', () => {
  const texto = `# B

| dato | valor |
| ---- | ----- |
| serie | FX-… |

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
${FILA_OK}
`;
  const { wps, defectos } = parsearBacklog(texto, cfgFx);
  assert.equal(wps.length, 1);
  assert.deepEqual(defectos, [], 'la tabla de metadatos no genera ruido');
});

test('fila de tabla de WPs sin ID → defecto, no omisión silenciosa', () => {
  const texto = backlogDe([
    '| Total | P0 | fila de totales colada en la tabla | conteo de la tabla del mundo | ninguna | I |',
    FILA_OK,
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.exit, 1);
  assert.equal(r.resumen.porMotivo['campo-ausente'], 1);
  assert.equal(r.defectos[0].campo, 'WP');
});

test('celda de WP ilegible (dos IDs, guion unicode) → defecto citado, no omisión', () => {
  const texto = backlogDe([
    '| **FX-A01/FX-A02** | P0 | dos WPs en una fila para ahorrar | el probe devuelve exit 0 sobre la plantilla | ninguna | I |',
    '| FX–B01 | P0 | guion largo unicode en el identificador | el probe devuelve exit 0 sobre la plantilla | ninguna | I |',
  ]);
  const r = verificarBacklog(texto, cfgFx);
  assert.equal(r.resumen.porMotivo['id-no-interpretable'], 1);
  assert.equal(r.resumen.porMotivo['campo-ausente'], 1);
  assert.equal(r.exit, 3, '0 WPs de 2 filas: nunca verde');
});
