#!/usr/bin/env node
// ============================================================================
// verificar-backlog.mjs — LINTER de BACKLOG DESPACHABLE
// ----------------------------------------------------------------------------
// Decide si un BACKLOG puede despacharse: cada WP declara los SIETE campos
// (`lane`, `WP`, `BRIEF`, `CA`, `P`, `deps`, `ejes`), la prioridad y los ejes
// están en los conjuntos declarados, las dependencias resuelven y no ciclan, y
// ningún campo está por debajo del suelo declarado. Marco-agnóstico y sin
// dependencias (Node ≥18).
//
// Contrato, doctrina y límites honestos: `../reference/backlog-despachable.md`.
// Fixtures de las dos caras: `../examples/fixture-backlog/`.
//
// QUÉ BLOQUEA Y QUÉ AVISA (política v2, tras contrarrevisión)
//   BLOQUEA lo DECIDIBLE sin opinar: campo ausente, columna ausente, prioridad
//   o eje fuera del conjunto, contradicciones declaradas, serie no declarada,
//   ID duplicado o ilegible, dependencia que no resuelve, ciclo, suelo de
//   BRIEF/CA y AUSENCIA (vacío / 0 WPs).
//   AVISA, sin decidir el exit: `CA-ornamental/*`. La calidad de un CA es
//   juicio, y un gate no puede arrogárselo sin producir falsos rechazos que lo
//   maten: un gate que rechaza CAs correctos acaba desactivado, y entonces no
//   protege de nada. El aviso se emite igual, con su motivo y la cita literal.
//
// DOCTRINA — CONCEDER EN FALSO ES PEOR QUE NO TENER LINTER (hereda DC-25/DC-29
// de `proyectar-backlog.mjs`): la AUSENCIA es fallo ruidoso. Fichero vacío,
// backlog sin ninguna tabla de WPs, tabla sin filas, o WPs que solo viven donde
// el lector no los ve (fence, comentario HTML, bloque indentado, cita) → exit 3.
// Un backlog que lintea a cero JAMÁS es despachable.
//
// PARAMETRIZADO (nada cableado a un mundo concreto): rutas, serie(s) de ID,
// conjuntos de prioridades / ejes / lanes, patrón de lane, alias de columnas,
// tokens de «sin dependencias», léxico de CA, umbral y suelos.
//
// Uso:
//   node verificar-backlog.mjs --backlog plan/BACKLOG.md \
//        [--series 'FX-[A-Z]\d{2}'] [--prioridades P0,P1,P2] \
//        [--ejes I,II,III,IV,V,ceguera,hostil-omite,ninguno] \
//        [--lanes A,B,C] [--deps-externas 'EXT-\d+'] [--ca-estricto] [--json]
//   (también admite la forma `--flag=valor`; toda flag desconocida es exit 2)
//
// Exit: 0 despachable · 1 defectos · 2 uso/config/E-S · 3 AUSENCIA (vacío/0 WPs).
// ============================================================================

import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 1. Léxico y defaults (todo sustituible por el consumidor)
// ---------------------------------------------------------------------------

// Palabras función: no aportan ni comprobación ni objeto.
const STOPWORDS = `a al ante bajo cada como con contra cual cuando cuyo de del desde donde durante e el ella ellas ellos en entre es esa ese eso esos esta estan estas este esto estos ha hacia han hasta hay la las le les lo los mas menos mi mientras misma mismo mucha mucho muy ni no nos o otra otras otro otros para pero por porque que quien se segun ser sera si sin sobre son su sus tambien tan tanto tiene tienen todas todo todos tras tu un una unas unos y ya debe deben puede pueden sea sean solo`.split(/\s+/);

// ANCLAS de verificación: nombran el acto observable que decide (comando,
// gate, probe, conteo, exit, veredicto, negación universal comprobable).
const ANCLAS = `pasa pasar pasan supera superar excede exceder baja bajar sube subir aumenta disminuye desciende crece verde rojo exit exitcode salida stdout stderr comando script gate gates probe probes prueba pruebas test tests suite fixture fixtures caso casos conteo cuenta contador contar recuento build ci run-id checksum hash sha snapshot assert mide medir medida ejecuta npm node bash diff log retorna devuelve aborta abortar bloquea bloquear bloqueado bloqueada bloqueados lock hits ocurrencias dry-run nadie nunca jamas`.split(/\s+/);

// Lemas de ancla (coincidencia por prefijo). Cubren la morfología sin cerrar el
// léxico en formas exactas: «ejecuciones», «grepables», «verificable» son
// anclas tanto como «ejecuta», «grep» o «verifica».
const ANCLAS_LEMA = `ejecu verific comprob comprueb grep fall rechaz deneg denieg reproduc valid compil compara ningun`.split(/\s+/);

// VALORACIONES: juicios sobre el resultado. Describen una impresión, no una
// comprobación. Su presencia no está prohibida; su DOMINANCIA sí.
const ORNAMENTALES = `bonito bonita bello bella precioso prolijo optimo optima calidad solido solida solidez decente satisfactorio suficiente bueno buena buen bien luce parece agradable amigable intuitivo usable moderno profesional presentable armonioso fluido comodo`.split(/\s+/);
const ORNAMENTALES_LEMA = `elegan mejor limpi pulid pulcr robust coheren clarid clar legib sencill simple simplific razonab aceptab consisten apropiad adecuad correct estetic ordenad organizad revis qued`.split(/\s+/);

// UNIDADES de medida: promueven una cantidad suelta a ancla («0 hits»,
// «1 definicion»). Sin unidad, comparador ni ancla al lado, un dígito NO ancla
// nada: si bastara un número, «queda elegante en 2 sitios» sería verificable.
const UNIDADES = `hits ocurrencias apariciones coincidencias definicion definiciones linea lineas fila filas fichero ficheros caso casos wps wp errores defectos avisos consumidor consumidores cliente clientes commits builds segundos ms bytes kb mb`.split(/\s+/);

// Valores MARCADORES: la celda existe pero no dice nada.
const VACIAS = `- -- --- — – ? ?? ??? . .. ... … * _ tbd todo wip pendiente n/a na x xx xxx idem varios ver`.split(/\s+/);
const VACIAS_FRASE = ['por definir', 'sin definir', 'a definir', 'por concretar', 'ver arriba', 'ver abajo', 'como arriba', 'sin especificar'];

const ALIAS = {
  wp: ['wp', 'id', 'wp id'],
  p: ['p', 'prioridad', 'prio'],
  brief: ['brief', 'descripcion', 'resumen', 'encargo', 'objeto'],
  ca: ['ca', 'ca tentativo', 'ca minimo', 'criterio', 'criterios', 'criterio de aceptacion', 'criterios de aceptacion', 'aceptacion'],
  deps: ['deps', 'dependencias', 'depende de', 'depende', 'dep'],
  ejes: ['ejes', 'eje', 'eje ca', 'ejes ca', 'eje(s)', 'eje(s) ca'],
  lane: ['lane', 'carril', 'via'],
};

export const DEFAULTS = {
  backlog: 'plan/BACKLOG.md',
  series: 'WP-[A-Za-z0-9]+',
  prioridades: ['P0', 'P1', 'P2'],
  ejes: ['I', 'II', 'III', 'IV', 'V', 'ceguera', 'hostil-omite', 'ninguno'],
  ejesNinguno: ['ninguno', 'ninguna', 'none'],
  lanes: [], // vacío = no se valida el conjunto de lanes (solo su presencia)
  patronLane: '^#{1,6}\\s*(?:lane|carril)\\b[\\s·:.\\-]*(.*)$',
  sinDeps: ['ninguna', 'ninguno', 'sin-deps', 'sin deps', 'none', 'na'],
  depsExternas: '', // regex; '' = ninguna dependencia externa permitida
  regionInicio: '', // marca de apertura de la región del backlog (opt-in)
  regionFin: '',
  umbralValoracion: 0.5,
  minPalabrasBrief: 3, // tokens significativos DISTINTOS
  minPalabrasCa: 2, // tokens significativos DISTINTOS
  caEstricto: false,
  alias: ALIAS,
  lexico: {
    stopwords: STOPWORDS,
    anclas: ANCLAS,
    anclasLema: ANCLAS_LEMA,
    ornamentales: ORNAMENTALES,
    ornamentalesLema: ORNAMENTALES_LEMA,
    unidades: UNIDADES,
    vacias: VACIAS,
    vaciasFrase: VACIAS_FRASE,
  },
};

// Campos exigidos por WP (el orden es el del reporte).
export const CAMPOS = ['lane', 'WP', 'BRIEF', 'CA', 'P', 'deps', 'ejes'];

// Motivos que NO bloquean: se emiten como aviso (ver cabecera).
export const MOTIVOS_AVISO = [
  'CA-ornamental/valoracion',
  'CA-ornamental/sin-ancla',
  'CA-ornamental/sin-objeto',
  'CA-ornamental/sin-referente',
  'BRIEF-ornamental/valoracion',
];

/** Error de uso/configuración: siempre exit 2, nunca un veredicto sobre el backlog. */
export class ErrorUso extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorUso';
    this.codigo = 2;
  }
}

// ---------------------------------------------------------------------------
// 2. Utilidades de texto
// ---------------------------------------------------------------------------

const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s) => sinAcentos(String(s || '')).toLowerCase().trim();

/** Quita énfasis markdown, backticks, enlaces y marcas de estado de una celda. */
function limpiarCelda(s) {
  return String(s || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{23E9}-\u{23FA}\u{FE0F}]/gu, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // enlace markdown → su texto
    .replace(/<\/?[a-z][^>]*>/gi, ' ') // etiquetas HTML: `<b>2</b>` no es un comparador
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*(\S)/g, '$1$2')
    .replace(/`/g, '')
    .replace(/\\\|/g, '|')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ¿La celda es un marcador vacío (`—`, `?`, `TBD`, `por definir`…)? */
function esMarcador(valor, lex) {
  const v = norm(limpiarCelda(valor));
  if (!v) return true;
  if (lex.vacias.includes(v)) return true;
  if (lex.vaciasFrase.includes(v)) return true;
  return /^[\s\-–—.·?*_…]+$/.test(v);
}

/** Tokeniza para el análisis de CA/BRIEF: palabras, cantidades y rutas. */
export function tokenizar(texto) {
  const plano = norm(limpiarCelda(texto));
  const brutos = plano.match(/[a-z0-9][a-z0-9_.:/\\-]*/g) || [];
  return brutos.map((t) => t.replace(/[.:,;]+$/, '')).filter(Boolean);
}

const empiezaPor = (t, lemas) => lemas.some((l) => l && t.startsWith(l));
const esCantidad = (t) => /^\d+([.,]\d+)?%?$/.test(t);

/** Tokens significativos DISTINTOS: el suelo cuenta palabras, no repeticiones. */
export function significativosDistintos(texto, cfg) {
  const stop = cfg.lexico.stopwords;
  return [...new Set(tokenizar(texto).filter((t) => !stop.includes(t)))];
}

function clasificarToken(t, lex) {
  if (lex.stopwords.includes(t)) return 'vacia';
  if (lex.ornamentales.includes(t) || empiezaPor(t, lex.ornamentalesLema || [])) return 'valoracion';
  if (lex.anclas.includes(t) || empiezaPor(t, lex.anclasLema || [])) return 'ancla';
  if (esCantidad(t)) return 'cantidad'; // se promueve (o no) por contexto
  return 'contenido';
}

// ---------------------------------------------------------------------------
// 3. EL AVISO: ¿este CA nombra una comprobación o solo una impresión?
// ---------------------------------------------------------------------------
//
// Un CA es VERIFICABLE cuando nombra las dos mitades de una comprobación:
//
//   (1) ANCLA  — el acto observable que decide: comando, gate, probe, fixture,
//                conteo, exit, veredicto («falla», «deniega», «pasa»),
//                negación universal («ninguna referencia queda en el árbol»),
//                comparador o cantidad CON medida.
//   (2) OBJETO — sobre QUÉ recae: al menos una palabra de contenido que no sea
//                ancla, ni valoración, ni palabra función.
//
// Es ORNAMENTAL cuando falta cualquiera de las dos, o cuando el juicio de valor
// DOMINA el enunciado (ratio ≥ umbral). Esto NO bloquea el despacho: es un
// aviso citado. La lista de motivos vive en MOTIVOS_AVISO.
//
// Dos asimetrías cerradas tras la contrarrevisión:
//   · un dígito suelto NO ancla nada (solo con comparador, unidad o ancla al
//     lado): antes «…en 2 sitios» convertía cualquier frase en verificable;
//   · el CA se analiza además POR SEGMENTOS (`·`, `;`, `<br>`, salto de línea),
//     para que concatenar un CA ornamental con uno bueno no lo diluya en el
//     ratio. Los fragmentos de medida («exit 0», «ceguera 0») no se juzgan
//     sueltos: solo dentro del conjunto.
//
export function analizarCA(texto, cfg = configurar()) {
  const global = analizarFragmento(texto, cfg);
  if (!global.ok) return { ...global, alcance: 'ca' };
  const segmentos = partirSegmentos(texto);
  if (segmentos.length > 1) {
    for (const seg of segmentos) {
      const a = analizarFragmento(seg, cfg);
      if (a.ok) continue;
      if (a.valoraciones.length === 0 && a.significativos <= 2) continue; // fragmento de medida
      return { ...a, alcance: 'segmento', segmento: seg, detalle: `segmento «${limpiarCelda(seg)}» → ${a.detalle}` };
    }
  }
  return { ...global, alcance: 'ca' };
}

export function partirSegmentos(texto) {
  return String(texto || '')
    .split(/·|;|<br\s*\/?>|\r?\n/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function analizarFragmento(texto, cfg) {
  const lex = cfg.lexico;
  const toks = tokenizar(texto);
  const clases = toks.map((t) => clasificarToken(t, lex));
  // Sobre el texto ya limpio de etiquetas HTML (d8): `<b>2</b>` no es un
  // comparador, y tomarlo por tal convertía prosa adornada en «medida».
  const hayComparador = /[=≥≤≠<>]\s*\d|\d\s*[=≥≤≠<>]/.test(limpiarCelda(texto));

  // Promoción de cantidades: una cifra suelta no es una comprobación.
  for (let i = 0; i < clases.length; i++) {
    if (clases[i] !== 'cantidad') continue;
    const anterior = toks[i - 1];
    const siguiente = toks[i + 1];
    const pegadaAncla = clases[i - 1] === 'ancla' || clases[i + 1] === 'ancla';
    const conUnidad = lex.unidades.includes(anterior) || lex.unidades.includes(siguiente);
    clases[i] = hayComparador || pegadaAncla || conUnidad ? 'ancla' : 'contenido';
  }

  const dame = (clase) => toks.filter((_, i) => clases[i] === clase);
  const valoraciones = dame('valoracion');
  const anclas = dame('ancla');
  const contenido = dame('contenido');
  if (hayComparador && !anclas.length) anclas.push('comparador');

  const significativos = valoraciones.length + anclas.length + contenido.length;
  const ratio = significativos ? valoraciones.length / significativos : 0;
  const base = { valoraciones, anclas, contenido, significativos, ratio: Number(ratio.toFixed(3)) };
  const cita = limpiarCelda(texto);

  if (valoraciones.length && ratio >= cfg.umbralValoracion) {
    return {
      ...base,
      ok: false,
      motivo: 'CA-ornamental/valoracion',
      detalle:
        `la valoracion domina (${valoraciones.length}/${significativos} = ${base.ratio} >= ${cfg.umbralValoracion}): ` +
        `«${valoraciones.join('», «')}». Anclas de verificacion: ${anclas.length ? anclas.join(', ') : '(ninguna)'}. ` +
        `CA citado: «${cita}»`,
    };
  }
  if (anclas.length === 0) {
    return {
      ...base,
      ok: false,
      motivo: 'CA-ornamental/sin-ancla',
      detalle:
        'no nombra ninguna comprobacion observable (comando, gate, probe, fixture, conteo, exit, ' +
        `veredicto falla/deniega/pasa, negacion universal o comparador). CA citado: «${cita}»`,
    };
  }
  if (contenido.length === 0) {
    return {
      ...base,
      ok: false,
      motivo: 'CA-ornamental/sin-objeto',
      detalle: `nombra la comprobacion (${anclas.join(', ')}) pero no su OBJETO: no dice sobre que recae. CA citado: «${cita}»`,
    };
  }
  if (cfg.caEstricto && !tieneReferenteFuerte(texto)) {
    return {
      ...base,
      ok: false,
      motivo: 'CA-ornamental/sin-referente',
      detalle:
        'modo --ca-estricto: no cita ningun referente fuerte (codigo entre backticks, ruta/fichero, ' +
        `cantidad o comparador). CA citado: «${cita}»`,
    };
  }
  return { ...base, ok: true, motivo: null, detalle: null };
}

function tieneReferenteFuerte(texto) {
  if (/`[^`]+`/.test(texto)) return true;
  if (/[\w.-]+\.(?:md|mjs|cjs|js|ts|json|ya?ml|sh|toml|lock)\b/i.test(texto)) return true;
  if (/(?:^|[\s(])[\w.-]+\/[\w.-]/.test(texto)) return true;
  if (/(?:^|\s)\d+([.,]\d+)?%?(?:\s|$)/.test(texto)) return true;
  if (/[=≥≤≠]\s*\d/.test(texto)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// 4. Parseo del BACKLOG (formato despachable = tabla con columna de ID)
// ---------------------------------------------------------------------------

const esFilaTabla = (l) => /^\s*\|.*\|\s*$/.test(l);
const esSeparador = (l) => typeof l === 'string' && /^\s*\|[\s:|-]+\|\s*$/.test(l) && /-/.test(l);

function celdas(linea) {
  return linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());
}

function resolverColumnas(cabeceras, alias) {
  const mapa = {};
  cabeceras.forEach((raw, idx) => {
    const clave = norm(limpiarCelda(raw)).replace(/[:]+$/, '');
    for (const [campo, nombres] of Object.entries(alias)) {
      if (nombres.includes(clave) && mapa[campo] === undefined) mapa[campo] = idx;
    }
  });
  return mapa;
}

// Token con forma de ID (para cazar series NO declaradas, igual que el parser
// de proyección): prefijo alfanumérico + `-` + cola que contiene un dígito.
const FORMA_ID = /^([A-Za-z][A-Za-z0-9]*-[A-Za-z0-9.\-]*\d[A-Za-z0-9.\-]*)/;

function extraerId(celda, reSerie) {
  const limpio = limpiarCelda(celda);
  if (!limpio) return { id: null, token: null, roto: false };
  const primero = limpio.split(/[\s·,;]+/)[0];
  if (reSerie.test(primero)) return { id: primero, token: primero, roto: false };
  const forma = primero.match(FORMA_ID);
  if (!forma) return { id: null, token: null, roto: false };
  // Token con forma de ID: ¿es de serie DECLARADA pero la celda lo enturbia
  // (`FX-A01/FX-A02`, `FX-A01bis`)? Entonces la celda es ilegible, no ajena.
  return { id: null, token: forma[1], roto: reSerie.test(forma[1]) };
}

/** Ancho de indentación con expansión de tabulador (CommonMark: tope de 4). */
export function anchoIndentacion(linea, tope = 4) {
  let ancho = 0;
  for (const c of linea) {
    if (c === ' ') ancho += 1;
    else if (c === '\t') ancho += tope - (ancho % tope);
    else break;
    if (ancho >= tope) break;
  }
  return ancho;
}

// Bloques HTML que ocultan su contenido (subconjunto de CommonMark):
// tipo 1 (`<pre>`, `<script>`, `<style>`, `<textarea>`) termina en su cierre;
// tipo 6 (contenedores conocidos, `<details>`, `<div>`…) termina en línea vacía.
// CommonMark solo exige que la línea EMPIECE por la etiqueta: exigir que la
// ocupe entera dejaba pasar `<details><summary>…</summary>` en una línea, que
// es la forma común de plegar en markdown.
const HTML_TIPO1 = /^ {0,3}<(pre|script|style|textarea)\b/i;
const HTML_TIPO6 = /^ {0,3}<\/?(details|summary|div|table|thead|tbody|tr|td|th|section|article|aside|figure|figcaption|form|fieldset|dl|dd|dt|ul|ol|li|blockquote|header|footer|main|nav|p|center|iframe|noscript)(?:\s|\/?>|$)/i;

/**
 * Vela lo que el lector del backlog NO ve como tabla del backlog. Implementa la
 * estructura de bloque de CommonMark para lo que importa, en vez de enumerar
 * formas de esconder una tabla:
 *
 *  - **fence** con su regla real: el cierre es el MISMO carácter, de longitud
 *    ≥ la apertura y sin nada más en la línea (`~~~` no cierra un fence de
 *    backticks; un fence de 4 backticks contiene uno de 3 sin cerrarse);
 *  - **código indentado** con expansión de tabulador (3 espacios + tab = 4);
 *  - **bloques HTML** tipo 1 y tipo 6 (`<pre>`, `<details>`…);
 *  - **front-matter** YAML/TOML al principio del fichero;
 *  - **comentario HTML** y **cita**.
 *
 * Se blanquea la línea para conservar la numeración y se cuenta la CAUSA, para
 * que el diagnóstico no mienta. Quien quiera cerrar la familia entera de
 * envolturas de una vez usa la **región declarada** (`--region-inicio`).
 */
function velarNoVisible(lineas, stats) {
  let fence = null; // { char, len }
  let enComentario = false;
  let htmlCierre = null; // regex de cierre para bloque HTML tipo 1
  let enHtml6 = false;
  let enFrontMatter = false;
  const oculta = (causa) => {
    stats.ocultas[causa] = (stats.ocultas[causa] || 0) + 1;
    stats.lineasOcultas++;
    return '';
  };
  const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

  return lineas.map((l, i) => {
    // --- front-matter (solo en la primera línea del fichero) ---
    if (i === 0 && /^(---|\+\+\+)\s*$/.test(l)) {
      enFrontMatter = true;
      return oculta('front-matter');
    }
    if (enFrontMatter) {
      if (/^(---|\+\+\+|\.\.\.)\s*$/.test(l)) enFrontMatter = false;
      return oculta('front-matter');
    }

    // --- fence (regla de CommonMark, no toggle ingenuo) ---
    const m = l.match(FENCE);
    if (fence) {
      const cierra = m && m[1][0] === fence.char && m[1].length >= fence.len && m[2].trim() === '';
      if (cierra) fence = null;
      return oculta('fence');
    }
    if (m) {
      const marca = m[1];
      // Un fence de backticks no puede llevar backticks en su info string.
      if (!(marca[0] === '`' && m[2].includes('`'))) {
        fence = { char: marca[0], len: marca.length };
        return oculta('fence');
      }
    }

    // --- comentario HTML ---
    let linea = l.replace(/<!--.*?-->/g, '');
    if (enComentario) {
      if (/-->/.test(linea)) {
        enComentario = false;
        stats.ocultas.comentario++;
        stats.lineasOcultas++;
        return linea.replace(/^[\s\S]*?-->/, '');
      }
      return oculta('comentario');
    }
    if (/<!--/.test(linea)) {
      enComentario = true;
      stats.ocultas.comentario++;
      stats.lineasOcultas++;
      return linea.replace(/<!--[\s\S]*$/, '');
    }

    // --- bloques HTML ---
    if (htmlCierre) {
      if (htmlCierre.test(linea)) htmlCierre = null;
      return oculta('html');
    }
    const t1 = linea.match(HTML_TIPO1);
    if (t1) {
      const cierre = new RegExp(`</${t1[1]}\\s*>`, 'i');
      if (!cierre.test(linea)) htmlCierre = cierre;
      return oculta('html');
    }
    if (enHtml6) {
      if (!linea.trim()) enHtml6 = false; // línea vacía cierra el bloque tipo 6
      else return oculta('html');
    } else if (HTML_TIPO6.test(linea)) {
      enHtml6 = true;
      return oculta('html');
    }

    // --- código indentado (con expansión de tabulador) ---
    if (linea.trim() && anchoIndentacion(linea) >= 4) return oculta('indentado');
    // --- cita: la tabla se ve, pero citada; no es lo que el mundo declara ---
    if (/^ {0,3}>/.test(linea)) return oculta('cita');
    return linea;
  });
}

/**
 * Región declarada (cierre estructural, opt-in). Si el mundo declara marcas,
 * TODO lo que quede fuera se ignora por construcción y las envolturas dejan de
 * importar. La marca de inicio ausente es `region-ausente` → exit 3 limpio.
 */
function recortarRegion(lineas, cfg, stats, defectos) {
  if (!cfg.regionInicio) return lineas;
  const ini = lineas.findIndex((l) => l.includes(cfg.regionInicio));
  if (ini < 0) {
    defectos.push({
      wp: '(backlog)',
      campo: 'WP',
      motivo: 'region-ausente',
      linea: 0,
      detalle:
        `el mundo declara la region del backlog con «${cfg.regionInicio}» y el fichero no la contiene: ` +
        'sin region declarada no hay nada que despachar (cierre estructural, no se adivina).',
    });
    stats.regionAusente = true;
    return lineas.map(() => '');
  }
  const desde = ini + 1;
  const relativo = cfg.regionFin ? lineas.slice(desde).findIndex((l) => l.includes(cfg.regionFin)) : -1;
  if (cfg.regionFin && relativo < 0) {
    // La región queda abierta hasta EOF: extenderla en silencio convertiría un
    // fichero truncado en un backlog «entero» (D-F).
    defectos.push({
      wp: '(backlog)',
      campo: 'WP',
      motivo: 'region-sin-cierre',
      linea: ini + 1,
      detalle:
        `la region abre en la linea ${ini + 1} con «${cfg.regionInicio}» pero su marca de cierre ` +
        `«${cfg.regionFin}» no aparece: la region queda abierta hasta el final del fichero. ` +
        'Cierrala o no declares marca de fin.',
    });
  }
  const hasta = relativo >= 0 ? desde + relativo : lineas.length;
  return lineas.map((l, i) => {
    if (i >= desde && i < hasta) return l;
    if (l.trim()) {
      stats.ocultas['fuera-de-region'] = (stats.ocultas['fuera-de-region'] || 0) + 1;
      stats.lineasOcultas++;
    }
    return '';
  });
}

/**
 * Parsea el backlog. Devuelve WPs, defectos estructurales, avisos y
 * estadísticas de AUSENCIA (para que un backlog que lintea a cero nunca pase
 * en silencio).
 */
export function parsearBacklog(texto, cfg = configurar()) {
  const laneRe = new RegExp(cfg.patronLane, 'i');
  const reSerie = new RegExp(`^(?:${cfg.series})$`);
  const wps = [];
  // Índice id→WP para que duplicados y deps no sean O(n²) (d11).
  wps.indice = new Map();
  const defectos = [];
  const avisos = [];
  const stats = {
    tablasWp: 0,
    tablasIgnoradas: 0,
    filasDato: 0,
    filasVacias: 0,
    lineasLista: 0,
    lineasOcultas: 0,
    regionAusente: false,
    ocultas: { fence: 0, comentario: 0, indentado: 0, cita: 0, html: 0, 'front-matter': 0 },
  };
  const lineas = velarNoVisible(recortarRegion(texto.split(/\r?\n/), cfg, stats, defectos), stats);

  let lane = null;
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];
    if (/^\s*#{1,6}\s/.test(l)) {
      const m = l.match(laneRe);
      lane = m ? limpiarCelda(m[1]) || limpiarCelda(l.replace(/^\s*#+\s*/, '')) : null;
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) stats.lineasLista++;
    if (esFilaTabla(l) && esSeparador(lineas[i + 1])) {
      const cabeceras = celdas(l);
      const mapa = resolverColumnas(cabeceras, cfg.alias);
      const filas = [];
      let j = i + 2;
      // Toda fila posterior al separador de cabecera es fila de DATOS, incluida
      // la que parece otro separador (`| - | - | - |`): omitirla en silencio
      // contradiría la doctrina de «fila sin ID → defecto, no omisión» (d6).
      while (j < lineas.length && esFilaTabla(lineas[j])) {
        filas.push({ celdas: celdas(lineas[j]), n: j + 1, raw: lineas[j] });
        j++;
      }
      if (mapa.wp === undefined) {
        stats.tablasIgnoradas++;
        // Contrabando: una fila con ID de serie declarada escondida en una
        // tabla que NO declara columna de WP quedaría fuera del lint.
        for (const fila of filas) {
          const { id } = extraerId(fila.celdas[0] || '', reSerie);
          if (id) {
            defectos.push({
              wp: id,
              campo: 'WP',
              motivo: 'fila-fuera-de-tabla-wp',
              linea: fila.n,
              detalle:
                `la fila declara el ID «${id}» (serie declarada) en una tabla SIN columna de WP ` +
                `(cabecera linea ${i + 1}: ${cabeceras.join(' | ')}). Ningun WP puede vivir fuera de la tabla de WPs.`,
            });
          }
        }
      } else {
        stats.tablasWp++;
        for (const fila of filas) {
          if (fila.celdas.every((c) => !limpiarCelda(c))) {
            stats.filasVacias++;
            continue;
          }
          stats.filasDato++;
          procesarFila(fila, mapa, lane, cfg, reSerie, wps, defectos, avisos, cabeceras, i + 1);
        }
      }
      i = j;
      continue;
    }
    i++;
  }
  return { wps, defectos, avisos, stats };
}

// ---------------------------------------------------------------------------

function procesarFila(fila, mapa, laneHeading, cfg, reSerie, wps, defectos, avisos, cabeceras, cabeceraLinea) {
  const celda = (campo) => (mapa[campo] === undefined ? undefined : fila.celdas[mapa[campo]]);
  const { id, token, roto } = extraerId(celda('wp') || '', reSerie);

  if (!id) {
    if (roto) {
      defectos.push({
        wp: token,
        campo: 'WP',
        motivo: 'id-no-interpretable',
        linea: fila.n,
        detalle:
          `la celda de WP contiene el ID declarado «${token}» pero no se puede interpretar como un unico ID: ` +
          `«${limpiarCelda(celda('wp'))}». Un ID por fila, literal.`,
      });
    } else if (token) {
      defectos.push({
        wp: token,
        campo: 'WP',
        motivo: 'serie-no-declarada',
        linea: fila.n,
        detalle:
          `el ID «${token}» tiene forma de ID pero NO pertenece a ninguna serie declarada ` +
          `(--series '${cfg.series}'). Declara la serie o corrige el ID; no se lintea en silencio.`,
      });
    } else {
      defectos.push({
        wp: `(linea ${fila.n})`,
        campo: 'WP',
        motivo: 'campo-ausente',
        linea: fila.n,
        detalle: `fila de la tabla de WPs (cabecera linea ${cabeceraLinea}) sin ID: «${fila.raw.trim()}»`,
      });
    }
    return;
  }
  const previo = wps.indice.get(id);
  if (previo) {
    defectos.push({
      wp: id,
      campo: 'WP',
      motivo: 'id-duplicado',
      linea: fila.n,
      detalle: `el ID «${id}» ya estaba declarado en la linea ${previo.linea}`,
    });
    return;
  }

  const lane = mapa.lane !== undefined ? limpiarCelda(celda('lane')) : laneHeading;
  const wp = {
    id,
    linea: fila.n,
    lane,
    p: mapa.p === undefined ? undefined : celda('p'),
    brief: mapa.brief === undefined ? undefined : celda('brief'),
    ca: mapa.ca === undefined ? undefined : celda('ca'),
    deps: mapa.deps === undefined ? undefined : celda('deps'),
    ejes: mapa.ejes === undefined ? undefined : celda('ejes'),
  };

  // --- campos ausentes / marcadores vacíos ---
  const presencia = [
    ['lane', wp.lane, mapa.lane !== undefined || laneHeading !== null],
    ['P', wp.p, mapa.p !== undefined],
    ['BRIEF', wp.brief, mapa.brief !== undefined],
    ['CA', wp.ca, mapa.ca !== undefined],
    ['deps', wp.deps, mapa.deps !== undefined],
    ['ejes', wp.ejes, mapa.ejes !== undefined],
  ];
  for (const [campo, valor, declarado] of presencia) {
    if (!declarado) {
      defectos.push({
        wp: id,
        campo,
        motivo: 'columna-requerida-ausente',
        linea: fila.n,
        detalle:
          campo === 'lane'
            ? `sin columna «lane» y sin encabezado de lane que cubra la fila (patron ${cfg.patronLane})`
            : `la tabla (cabecera linea ${cabeceraLinea}: ${cabeceras.join(' | ')}) no declara la columna «${campo}»`,
      });
      continue;
    }
    if (esMarcador(valor, cfg.lexico)) {
      defectos.push({
        wp: id,
        campo,
        motivo: 'campo-ausente',
        linea: fila.n,
        detalle: `el campo «${campo}» esta vacio o es un marcador sin contenido: «${limpiarCelda(valor)}»`,
      });
    }
  }

  // --- lane dentro del conjunto declarado (si el mundo lo declara) ---
  if (cfg.lanes.length && wp.lane && !esMarcador(wp.lane, cfg.lexico)) {
    if (!cfg.lanes.some((x) => norm(x) === norm(wp.lane))) {
      defectos.push({
        wp: id,
        campo: 'lane',
        motivo: 'lane-desconocida',
        linea: fila.n,
        detalle: `lane «${wp.lane}» fuera del conjunto declarado {${cfg.lanes.join(', ')}}`,
      });
    }
  }

  // --- prioridad dentro del conjunto declarado ---
  if (wp.p !== undefined && !esMarcador(wp.p, cfg.lexico)) {
    const p = limpiarCelda(wp.p);
    if (!cfg.prioridades.some((x) => norm(x) === norm(p))) {
      defectos.push({
        wp: id,
        campo: 'P',
        motivo: 'prioridad-invalida',
        linea: fila.n,
        detalle: `prioridad «${p}» fuera del conjunto declarado {${cfg.prioridades.join(', ')}}`,
      });
    }
  }

  // --- ejes: conjunto declarado y sin contradicciones ---
  if (wp.ejes !== undefined && !esMarcador(wp.ejes, cfg.lexico)) {
    const tokensEjes = limpiarCelda(wp.ejes).split(/[\s,;+/·]+/).filter(Boolean);
    for (const t of tokensEjes) {
      if (!cfg.ejes.some((x) => norm(x) === norm(t))) {
        defectos.push({
          wp: id,
          campo: 'ejes',
          motivo: 'eje-desconocido',
          linea: fila.n,
          detalle: `eje «${t}» fuera del conjunto declarado {${cfg.ejes.join(', ')}}`,
        });
      }
    }
    const nulos = tokensEjes.filter((t) => cfg.ejesNinguno.some((x) => norm(x) === norm(t)));
    if (nulos.length && tokensEjes.length > nulos.length) {
      defectos.push({
        wp: id,
        campo: 'ejes',
        motivo: 'ejes-contradictorios',
        linea: fila.n,
        detalle:
          `declara «${nulos.join(', ')}» junto a otros ejes (${tokensEjes.join(', ')}): o no aplica ninguno, ` +
          'o aplican los que se listan. La contradiccion no se resuelve sola.',
      });
    }
  }

  // --- suelo del BRIEF: palabras DISTINTAS, no repeticiones ---
  if (wp.brief !== undefined && !esMarcador(wp.brief, cfg.lexico)) {
    const sig = significativosDistintos(wp.brief, cfg);
    if (sig.length < cfg.minPalabrasBrief) {
      defectos.push({
        wp: id,
        campo: 'BRIEF',
        motivo: 'brief-insuficiente',
        linea: fila.n,
        detalle:
          `el BRIEF tiene ${sig.length} palabra(s) significativa(s) DISTINTA(S) [${sig.join(', ')}], ` +
          `minimo ${cfg.minPalabrasBrief}: «${limpiarCelda(wp.brief)}»`,
      });
    } else {
      // El BRIEF describe trabajo, no comprobación: no se le exige ancla ni
      // objeto (sería ruido puro). Sí se avisa cuando la VALORACIÓN domina
      // («dejarlo todo mas limpio y elegante»), que es el mismo síntoma (d7).
      const an = analizarFragmento(wp.brief, cfg);
      if (!an.ok && an.motivo === 'CA-ornamental/valoracion') {
        avisos.push({
          wp: id,
          campo: 'BRIEF',
          motivo: 'BRIEF-ornamental/valoracion',
          linea: fila.n,
          detalle: an.detalle.replace('CA citado', 'BRIEF citado'),
        });
      }
    }
  }

  // --- suelo del CA (bloqueante) + análisis ornamental (aviso) ---
  if (wp.ca !== undefined && !esMarcador(wp.ca, cfg.lexico)) {
    const sig = significativosDistintos(wp.ca, cfg);
    if (sig.length < cfg.minPalabrasCa) {
      defectos.push({
        wp: id,
        campo: 'CA',
        motivo: 'ca-insuficiente',
        linea: fila.n,
        detalle:
          `el CA tiene ${sig.length} palabra(s) significativa(s) DISTINTA(S) [${sig.join(', ')}], ` +
          `minimo ${cfg.minPalabrasCa}: «${limpiarCelda(wp.ca)}». Suelo objetivo, no juicio de calidad.`,
      });
    } else {
      const an = analizarCA(wp.ca, cfg);
      if (!an.ok) avisos.push({ wp: id, campo: 'CA', motivo: an.motivo, linea: fila.n, detalle: an.detalle });
    }
  }

  // --- deps: se declaran SIEMPRE, incluso para decir «ninguna» ---
  wp.depsIds = [];
  if (wp.deps !== undefined && !esMarcador(wp.deps, cfg.lexico)) {
    const { ids, nulos, ilegibles } = leerDeps(wp.deps, cfg, reSerie);
    if (nulos.length && ids.length) {
      defectos.push({
        wp: id,
        campo: 'deps',
        motivo: 'deps-contradictorias',
        linea: fila.n,
        detalle:
          `declara «${nulos.join(', ')}» junto a dependencias reales (${ids.join(', ')}): ` +
          'o no depende de nada, o depende de esas. La contradiccion no se resuelve sola.',
      });
    }
    for (const t of ilegibles) {
      defectos.push({
        wp: id,
        campo: 'deps',
        motivo: 'dep-no-interpretable',
        linea: fila.n,
        detalle:
          `«${t}» mezcla letras y digitos sin ser un ID legible ni el token de «sin dependencias» ` +
          `(${cfg.sinDeps.join(', ')}): tiene forma de ID roto y no se ignora como prosa. ` +
          `Celda: «${limpiarCelda(wp.deps)}»`,
      });
    }
    // La celda tiene contenido pero no declara NADA: ni un id, ni el token de
    // «sin dependencias», ni algo con forma de ID roto. «las dos anteriores» no
    // es una declaración: la ausencia se declara, no se deduce.
    if (!ids.length && !nulos.length && !ilegibles.length) {
      defectos.push({
        wp: id,
        campo: 'deps',
        motivo: 'deps-no-declaradas',
        linea: fila.n,
        detalle:
          `la celda «${limpiarCelda(wp.deps)}» no declara ninguna dependencia ni el token de ` +
          `«sin dependencias» (${cfg.sinDeps.join(', ')}): la prosa sola no dice de que depende el WP.`,
      });
    }
    wp.depsIds = ids;
  }
  wps.push(wp);
  if (wps.indice) wps.indice.set(wp.id, wp);
}

/**
 * Lee la celda `deps` con la HOLGURA declarada en el contrato (§1): separadores
 * naturales —espacios, `,` `;` `+` `/` `·` `→` `>` `&`—, puntuación de prosa,
 * paréntesis y enlaces markdown. En una herramienta en castellano,
 * «FX-A01 y FX-A03 (ambas de la ola 1)» es lo que la gente escribe: rechazarlo
 * sería un gate que su propio autor desactiva.
 *
 * Clasificación de cada token, sin adivinar:
 *  - token de «sin dependencias» (normalizado: `Ninguna.` = `ninguna`) → nulo;
 *  - token con forma de ID (serie declarada o genérica) → dependencia;
 *  - **prosa** —palabras (`y`, `ambas`, `raiz`) y números sueltos (`1`, `3`)—
 *    → se ignora: un número no puede confundirse con un ID roto;
 *  - token que MEZCLA letras y dígitos sin ser un ID legible (`FXA01`,
 *    `FX_A01`) → `dep-no-interpretable` (bloqueante): esa sí es la forma de un
 *    ID roto, y no se traga en silencio.
 *
 * Si de una celda con contenido no sale **nada** de lo anterior, quien llama
 * emite `deps-no-declaradas`: «las dos anteriores» no declara dependencias.
 */
export function leerDeps(celda, cfg, reSerie = new RegExp(`^(?:${cfg.series})$`)) {
  const crudo = limpiarCelda(celda);
  const brutos = crudo.split(/[\s,;+/·→>&|]+/).filter(Boolean);
  const ids = [];
  const nulos = [];
  const ilegibles = [];
  for (const bruto of brutos) {
    // Puntuación de prosa alrededor del token: `Ninguna.` `(FX-A01)` `FX-A01,`
    const t = bruto.replace(/^[¡¿"'`([{<]+/, '').replace(/[.,;:!?"'`)\]}>]+$/, '');
    if (!t) continue;
    const n = norm(t);
    if (cfg.sinDeps.some((x) => norm(x) === n)) {
      nulos.push(t);
      continue;
    }
    if (reSerie.test(t) || FORMA_ID.test(t)) {
      ids.push(t);
      continue;
    }
    // Forma de ID ROTO = mezcla de letras y dígitos. Un número suelto es prosa
    // («ola 1», «seccion 3»), y una palabra suelta también («ambas», «y»).
    if (/[A-Za-z]/.test(t) && /\d/.test(t)) ilegibles.push(t);
  }
  return { ids, nulos, ilegibles };
}

// ---------------------------------------------------------------------------
// 5. Grafo de dependencias: existencia + ciclos concretos
// ---------------------------------------------------------------------------

export function detectarCiclos(wps) {
  const conocidos = new Set(wps.map((w) => w.id));
  const grafo = new Map(wps.map((w) => [w.id, (w.depsIds || []).filter((d) => conocidos.has(d))]));
  const ciclos = [];
  const vistos = new Set();
  const estado = new Map(); // 0 = en pila, 1 = cerrado
  const pila = [];

  function dfs(nodo) {
    estado.set(nodo, 0);
    pila.push(nodo);
    for (const sig of grafo.get(nodo) || []) {
      if (!estado.has(sig)) {
        dfs(sig);
      } else if (estado.get(sig) === 0) {
        const desde = pila.indexOf(sig);
        const ciclo = pila.slice(desde);
        const clave = canonizarCiclo(ciclo);
        if (!vistos.has(clave)) {
          vistos.add(clave);
          ciclos.push([...ciclo, sig]);
        }
      }
    }
    pila.pop();
    estado.set(nodo, 1);
  }
  for (const w of wps) if (!estado.has(w.id)) dfs(w.id);
  return ciclos;
}

function canonizarCiclo(ciclo) {
  const min = ciclo.reduce((a, b) => (a < b ? a : b));
  const idx = ciclo.indexOf(min);
  return [...ciclo.slice(idx), ...ciclo.slice(0, idx)].join('>');
}

function verificarDeps(wps, cfg, defectos) {
  const ids = new Set(wps.map((w) => w.id));
  const reExterna = cfg.depsExternas ? new RegExp(`^(?:${cfg.depsExternas})$`) : null;
  for (const w of wps) {
    for (const d of w.depsIds || []) {
      if (ids.has(d)) continue;
      if (reExterna && reExterna.test(d)) continue;
      defectos.push({
        wp: w.id,
        campo: 'deps',
        motivo: 'dep-inexistente',
        linea: w.linea,
        detalle:
          `depende de «${d}», que no es ningun WP del backlog` +
          (cfg.depsExternas ? ` ni casa con --deps-externas '${cfg.depsExternas}'` : ' (no hay dependencias externas permitidas: --deps-externas)'),
      });
    }
  }
  for (const ciclo of detectarCiclos(wps)) {
    const cabeza = ciclo[0];
    defectos.push({
      wp: cabeza,
      campo: 'deps',
      motivo: 'dep-ciclo',
      linea: (wps.find((w) => w.id === cabeza) || {}).linea,
      detalle: `dependencia circular (${ciclo.length - 1} WP): ${ciclo.join(' -> ')}`,
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Veredicto
// ---------------------------------------------------------------------------

export function verificarBacklog(texto, cfg = configurar()) {
  const defectos = [];
  const avisos = [];
  const resumen = { wps: 0, defectos: 0, avisos: 0, porMotivo: {}, porMotivoAviso: {} };

  if (!texto || !texto.trim()) {
    defectos.push({
      wp: '(backlog)',
      campo: 'WP',
      motivo: 'backlog-vacio',
      linea: 0,
      detalle: 'el fichero esta vacio (0 caracteres utiles): no hay nada que despachar. Nunca es verde.',
    });
    return finalizar({ ok: false, exit: 3, defectos, avisos, resumen, wps: [], stats: null });
  }

  const { wps, defectos: dParse, avisos: aParse, stats } = parsearBacklog(texto, cfg);
  defectos.push(...dParse);
  avisos.push(...aParse);
  verificarDeps(wps, cfg, defectos);

  if (wps.length === 0) {
    let detalle;
    if (stats.tablasWp === 0 && stats.tablasIgnoradas === 0) {
      detalle =
        `0 WPs: el backlog no contiene NINGUNA tabla legible. ${stats.lineasLista} linea(s) de lista detectada(s). ` +
        'El formato despachable es una tabla con columna de WP (ver reference/backlog-despachable.md). ' +
        'Ruta equivocada, fichero truncado o formato ajeno: no se concede en verde.';
    } else if (stats.tablasWp === 0) {
      detalle =
        `0 WPs: hay ${stats.tablasIgnoradas} tabla(s) pero NINGUNA declara columna de WP ` +
        `(alias aceptados: ${cfg.alias.wp.join(', ')}).`;
    } else if (stats.filasDato === 0) {
      detalle = `0 WPs: hay ${stats.tablasWp} tabla(s) de WPs pero SIN filas de datos (cabecera y separador solos).`;
    } else {
      detalle =
        `0 WPs de ${stats.filasDato} fila(s) de datos: ninguna fila produjo un WP valido ` +
        '(ID ausente o de serie no declarada). Revisa --series.';
    }
    if (stats.lineasOcultas) {
      const causas = Object.entries(stats.ocultas)
        .filter(([, n]) => n > 0)
        .map(([c, n]) => `${c}=${n}`)
        .join(', ');
      detalle +=
        ` Ademas se ignoraron ${stats.lineasOcultas} linea(s) NO legibles como tabla (${causas}): ` +
        'lo que el lector no ve como tabla del backlog tampoco se despacha.';
    }
    defectos.push({ wp: '(backlog)', campo: 'WP', motivo: 'sin-wps', linea: 0, detalle });
    return finalizar({ ok: false, exit: 3, defectos, avisos, resumen, wps, stats });
  }

  const exit = defectos.length ? 1 : 0;
  return finalizar({ ok: exit === 0, exit, defectos, avisos, resumen, wps, stats });
}

function finalizar(r) {
  r.resumen.wps = r.wps.length;
  r.resumen.defectos = r.defectos.length;
  r.resumen.avisos = r.avisos.length;
  for (const d of r.defectos) r.resumen.porMotivo[d.motivo] = (r.resumen.porMotivo[d.motivo] || 0) + 1;
  for (const a of r.avisos) r.resumen.porMotivoAviso[a.motivo] = (r.resumen.porMotivoAviso[a.motivo] || 0) + 1;
  const ordenar = (l) => l.sort((a, b) => (a.linea || 0) - (b.linea || 0) || String(a.wp).localeCompare(String(b.wp)));
  ordenar(r.defectos);
  ordenar(r.avisos);
  return r;
}

// ---------------------------------------------------------------------------
// 7. Configuración (CLI + env) — fail-closed ante cualquier duda
// ---------------------------------------------------------------------------

const FLAGS_BOOL = ['--ca-estricto', '--json', '--ayuda', '--help', '-h'];
const FLAGS_VALOR = [
  '--backlog', '--series', '--prioridades', '--ejes', '--ejes-ninguno', '--lanes', '--patron-lane',
  '--sin-deps', '--deps-externas', '--region-inicio', '--region-fin',
  '--umbral-valoracion', '--min-palabras-brief', '--min-palabras-ca',
  '--lexico', '--lexico-modo', '--alias', '--alias-modo',
];

/**
 * Parseo ESTRICTO de argv: admite `--flag valor` y `--flag=valor`, y rechaza
 * (exit 2) cualquier flag desconocida, argumento suelto o valor ausente. Una
 * flag mal escrita NO puede caer al valor por defecto: el linter contestaría
 * sobre un fichero que nadie pidió y en CI solo se lee el exit.
 */
export function parsearArgv(argv) {
  const opciones = {};
  const errores = [];
  for (let i = 0; i < argv.length; i++) {
    const bruto = argv[i];
    if (!bruto.startsWith('-')) {
      errores.push(`argumento suelto «${bruto}»: este linter no toma posicionales (usa --backlog RUTA)`);
      continue;
    }
    const igual = bruto.indexOf('=');
    const nombre = igual >= 0 ? bruto.slice(0, igual) : bruto;
    const valorIgual = igual >= 0 ? bruto.slice(igual + 1) : undefined;
    if (FLAGS_BOOL.includes(nombre)) {
      if (valorIgual !== undefined) errores.push(`la flag «${nombre}» no toma valor (recibido «${valorIgual}»)`);
      opciones[nombre] = true;
      continue;
    }
    if (FLAGS_VALOR.includes(nombre)) {
      let valor = valorIgual;
      if (valor === undefined) {
        valor = argv[i + 1];
        if (valor === undefined || valor.startsWith('--')) {
          errores.push(`la flag «${nombre}» exige un valor`);
          continue;
        }
        i++;
      }
      opciones[nombre] = valor;
      continue;
    }
    const parecidas = [...FLAGS_BOOL, ...FLAGS_VALOR].filter((f) => f.slice(0, 5) === nombre.slice(0, 5));
    errores.push(
      `flag desconocida «${nombre}»${parecidas.length ? ` (¿querias ${parecidas.join(' | ')}?)` : ''}`
    );
  }
  if (errores.length) {
    throw new ErrorUso(`argumentos invalidos:\n  - ${errores.join('\n  - ')}\n  (--ayuda lista las flags admitidas)`);
  }
  return opciones;
}

function numeroValido(nombre, bruto, { min, max, entero }) {
  const n = Number(bruto);
  if (bruto === '' || bruto === null || !Number.isFinite(n)) {
    throw new ErrorUso(`${nombre}: «${bruto}» no es un numero. Una config invalida NO desactiva la regla en silencio.`);
  }
  if (entero && !Number.isInteger(n)) throw new ErrorUso(`${nombre}: «${bruto}» debe ser entero`);
  if (n < min || n > max) throw new ErrorUso(`${nombre}: ${n} fuera del rango [${min}, ${max}]`);
  return n;
}

function regexValida(nombre, patron, envoltorio = (p) => p) {
  // Coherencia con los conjuntos (d5): un patrón vacío es tan inservible como
  // un conjunto vacío, y colarse como «regex válida» sería fail-open silencioso.
  if (!String(patron).trim()) throw new ErrorUso(`${nombre}: patron vacio (no declara nada; usa un patron o no pases la flag)`);
  try {
    new RegExp(patron);
    new RegExp(envoltorio(patron));
  } catch (e) {
    throw new ErrorUso(`${nombre}: expresion regular invalida (${e.message})`);
  }
  return patron;
}

/**
 * Marca de región: si se pasa la flag, tiene que decir algo. Una marca vacía
 * desactivaría el cierre estructural **en silencio**, que es justo lo que el
 * cierre viene a evitar (D-F).
 */
function marcaValida(nombre, bruto, declarado) {
  if (!declarado) return '';
  const v = String(bruto === undefined || bruto === null ? '' : bruto);
  if (!v.trim()) throw new ErrorUso(`${nombre}: marca vacia (no delimita nada; usa una marca o no pases la flag)`);
  return v.trim();
}

function listaValida(nombre, bruto) {
  const l = String(bruto).split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  if (!l.length) throw new ErrorUso(`${nombre}: conjunto vacio (un conjunto vacio rechazaria todo)`);
  return l;
}

export function configurar(over = {}, argv = [], env = {}) {
  const op = parsearArgv(argv);
  const val = (flag, envVar, def) => {
    if (op[flag] !== undefined) return op[flag];
    if (envVar && env[envVar] !== undefined && env[envVar] !== '') return env[envVar];
    return def;
  };

  const cfg = {
    ...DEFAULTS,
    backlog: val('--backlog', 'BACKLOG_RUTA', DEFAULTS.backlog),
    series: regexValida('--series', val('--series', 'BACKLOG_SERIES', DEFAULTS.series), (p) => `^(?:${p})$`),
    prioridades: listaValida('--prioridades', val('--prioridades', 'BACKLOG_PRIORIDADES', DEFAULTS.prioridades.join(','))),
    ejes: listaValida('--ejes', val('--ejes', 'BACKLOG_EJES', DEFAULTS.ejes.join(','))),
    ejesNinguno: listaValida('--ejes-ninguno', val('--ejes-ninguno', 'BACKLOG_EJES_NINGUNO', DEFAULTS.ejesNinguno.join(','))),
    lanes: (() => {
      const bruto = val('--lanes', 'BACKLOG_LANES', '');
      return bruto ? listaValida('--lanes', bruto) : [];
    })(),
    patronLane: regexValida('--patron-lane', val('--patron-lane', 'BACKLOG_PATRON_LANE', DEFAULTS.patronLane)),
    sinDeps: listaValida('--sin-deps', val('--sin-deps', 'BACKLOG_SIN_DEPS', DEFAULTS.sinDeps.join(','))),
    regionInicio: marcaValida(
      '--region-inicio',
      val('--region-inicio', 'BACKLOG_REGION_INICIO', DEFAULTS.regionInicio),
      op['--region-inicio'] !== undefined || env.BACKLOG_REGION_INICIO !== undefined
    ),
    regionFin: marcaValida(
      '--region-fin',
      val('--region-fin', 'BACKLOG_REGION_FIN', DEFAULTS.regionFin),
      op['--region-fin'] !== undefined || env.BACKLOG_REGION_FIN !== undefined
    ),
    depsExternas: (() => {
      const bruto = val('--deps-externas', 'BACKLOG_DEPS_EXTERNAS', DEFAULTS.depsExternas);
      return bruto ? regexValida('--deps-externas', bruto, (p) => `^(?:${p})$`) : '';
    })(),
    umbralValoracion: numeroValido('--umbral-valoracion', val('--umbral-valoracion', 'BACKLOG_UMBRAL', DEFAULTS.umbralValoracion), { min: 0, max: 1, entero: false }),
    minPalabrasBrief: numeroValido('--min-palabras-brief', val('--min-palabras-brief', 'BACKLOG_MIN_BRIEF', DEFAULTS.minPalabrasBrief), { min: 1, max: 100, entero: true }),
    minPalabrasCa: numeroValido('--min-palabras-ca', val('--min-palabras-ca', 'BACKLOG_MIN_CA', DEFAULTS.minPalabrasCa), { min: 1, max: 100, entero: true }),
    caEstricto: op['--ca-estricto'] === true || env.BACKLOG_CA_ESTRICTO === '1',
    alias: { ...DEFAULTS.alias },
    lexico: { ...DEFAULTS.lexico },
    json: op['--json'] === true,
  };

  // Coherencia de las flags de región (D-F): una marca de fin sin marca de
  // inicio no delimita nada, y quedarse callado sería fail-open.
  if (cfg.regionFin && !cfg.regionInicio) {
    throw new ErrorUso('--region-fin sin --region-inicio: una marca de cierre no delimita ninguna region.');
  }
  // Los modos se validan SIEMPRE que se pasan, no solo si además se pasa el
  // fichero: `--lexico-modo perro` sin `--lexico` salía exit 0 en silencio.
  for (const [flag, valor] of [
    ['--lexico-modo', op['--lexico-modo']],
    ['--alias-modo', op['--alias-modo']],
  ]) {
    if (valor !== undefined && !['extender', 'reemplazar'].includes(valor)) {
      throw new ErrorUso(`${flag}: «${valor}» (usa extender|reemplazar)`);
    }
  }
  if (op['--lexico-modo'] !== undefined && !val('--lexico', 'BACKLOG_LEXICO', '')) {
    throw new ErrorUso('--lexico-modo sin --lexico: no hay lexico que extender ni reemplazar.');
  }
  if (op['--alias-modo'] !== undefined && !val('--alias', 'BACKLOG_ALIAS', '')) {
    throw new ErrorUso('--alias-modo sin --alias: no hay alias que extender ni reemplazar.');
  }

  // Léxico y alias sustituibles por fichero JSON del consumidor.
  const rutaLexico = val('--lexico', 'BACKLOG_LEXICO', '');
  if (rutaLexico) {
    let extra;
    try {
      extra = JSON.parse(readFileSync(rutaLexico, 'utf-8'));
    } catch (e) {
      throw new ErrorUso(`--lexico: no se pudo leer/parsear «${rutaLexico}» (${e.message})`);
    }
    const modo = val('--lexico-modo', null, 'extender');
    if (!['extender', 'reemplazar'].includes(modo)) throw new ErrorUso(`--lexico-modo: «${modo}» (usa extender|reemplazar)`);
    for (const clave of Object.keys(cfg.lexico)) {
      if (!extra[clave]) continue;
      cfg.lexico[clave] = modo === 'reemplazar' ? extra[clave] : [...cfg.lexico[clave], ...extra[clave]];
    }
  }
  const rutaAlias = val('--alias', 'BACKLOG_ALIAS', '');
  if (rutaAlias) {
    let extra;
    try {
      extra = JSON.parse(readFileSync(rutaAlias, 'utf-8'));
    } catch (e) {
      throw new ErrorUso(`--alias: no se pudo leer/parsear «${rutaAlias}» (${e.message})`);
    }
    const modo = val('--alias-modo', null, 'extender');
    if (!['extender', 'reemplazar'].includes(modo)) throw new ErrorUso(`--alias-modo: «${modo}» (usa extender|reemplazar)`);
    for (const campo of Object.keys(cfg.alias)) {
      if (!extra[campo]) continue;
      cfg.alias[campo] = modo === 'reemplazar' ? extra[campo].map(norm) : [...cfg.alias[campo], ...extra[campo].map(norm)];
    }
  }
  Object.assign(cfg, over);
  return cfg;
}

const AYUDA = `verificar-backlog.mjs — linter de BACKLOG despachable

  --backlog RUTA            fichero a lintear (def. plan/BACKLOG.md)
  --series REGEX|REGEX      serie(s) de ID del mundo (def. WP-[A-Za-z0-9]+)
  --prioridades P0,P1,P2    conjunto de prioridades admitido
  --ejes I,II,...           conjunto de ejes de CA admitido
  --ejes-ninguno ninguno    tokens que declaran «sin eje» (contradiccion si van con otros)
  --lanes A,B,C             conjunto de lanes admitido (def. vacio = no se valida)
  --patron-lane REGEX       encabezado que abre una lane (grupo 1 = nombre)
  --sin-deps ninguna,none   tokens que declaran «sin dependencias»
  --deps-externas REGEX     IDs permitidos fuera del backlog (def. ninguno)
  --region-inicio MARCA     cierre estructural: solo se lintea la region entre
  --region-fin MARCA        marcas; su ausencia es exit 3 limpio (opt-in)
  --umbral-valoracion 0.5   ratio de valoracion que vuelve ornamental un CA (aviso)
  --min-palabras-brief 3    suelo del BRIEF en palabras DISTINTAS
  --min-palabras-ca 2       suelo del CA en palabras DISTINTAS
  --ca-estricto             el aviso de CA exige ademas referente fuerte
  --lexico F.json [--lexico-modo extender|reemplazar]
  --alias  F.json [--alias-modo  extender|reemplazar]
  --json                    reporte en JSON
  --ayuda

Admite tambien la forma --flag=valor. Toda flag desconocida, argumento suelto,
numero no numerico o regex invalida es exit 2 (nunca un veredicto).

BLOQUEA lo decidible (campos, conjuntos, contradicciones, deps, ciclos, suelos,
ausencia). AVISA sin bloquear sobre CA ornamental: la calidad de un CA es
juicio, y un gate que rechaza CAs correctos acaba desactivado.

Exit: 0 despachable · 1 defectos · 2 uso/config/E-S · 3 AUSENCIA (vacio / 0 WPs).
Doctrina y limites: reference/backlog-despachable.md`;

// ---------------------------------------------------------------------------
// 8. CLI
// ---------------------------------------------------------------------------

function imprimir(r, cfg) {
  if (cfg.json) {
    console.log(
      JSON.stringify(
        {
          ok: r.ok,
          exit: r.exit,
          resumen: r.resumen,
          defectos: r.defectos,
          avisos: r.avisos,
          wps: r.wps.map((w) => ({ id: w.id, lane: w.lane, p: limpiarCelda(w.p), deps: w.depsIds })),
        },
        null,
        2
      )
    );
    return;
  }
  console.log(
    `[verificar-backlog] ${cfg.backlog} · ${r.resumen.wps} WP · ${r.resumen.defectos} defecto(s) · ${r.resumen.avisos} aviso(s)`
  );
  for (const d of r.defectos) {
    console.log(`  x ${d.wp} · campo ${d.campo} · ${d.motivo} · linea ${d.linea}`);
    console.log(`      ${d.detalle}`);
  }
  for (const a of r.avisos) {
    console.log(`  ! ${a.wp} · campo ${a.campo} · ${a.motivo} · linea ${a.linea} (AVISO, no bloquea)`);
    console.log(`      ${a.detalle}`);
  }
  const avisoResumen = Object.entries(r.resumen.porMotivoAviso).map(([m, n]) => `${m}=${n}`).join(' · ');
  if (r.resumen.defectos) {
    const porMotivo = Object.entries(r.resumen.porMotivo).map(([m, n]) => `${m}=${n}`).join(' · ');
    console.log(`[verificar-backlog] NO DESPACHABLE · ${porMotivo}`);
  } else {
    console.log('[verificar-backlog] DESPACHABLE: los 7 campos declarados, conjuntos respetados, deps sin ciclos, suelos cumplidos.');
  }
  if (r.resumen.avisos) console.log(`[verificar-backlog] avisos (no bloquean) · ${avisoResumen}`);
}

const invocado = process.argv[1] ? realpathSync(process.argv[1]) : '';
const esMain = invocado && realpathSync(fileURLToPath(import.meta.url)) === invocado;
if (esMain) {
  const argv = process.argv.slice(2);
  const pidenAyuda = argv.filter((a) => ['--ayuda', '-h', '--help'].includes(a));
  if (pidenAyuda.length) {
    // La ayuda solo se sirve si es LO ÚNICO que se pide (d4): `--backlog X -h`
    // salía 0 sin lintear, y un exit 0 sin veredicto es una concesión muda.
    if (argv.length === pidenAyuda.length) {
      console.log(AYUDA);
      process.exit(0);
    }
    console.error(
      `[verificar-backlog] «${pidenAyuda[0]}» no se combina con otras flags: ` +
        'o se pide la ayuda, o se lintea un backlog. Un exit 0 sin veredicto seria una concesion muda.'
    );
    process.exit(2);
  }
  let cfg;
  try {
    cfg = configurar({}, argv, process.env);
  } catch (e) {
    console.error(`[verificar-backlog] ${e instanceof ErrorUso ? e.message : `configuracion invalida: ${e.message}`}`);
    process.exit(2);
  }
  if (!existsSync(cfg.backlog)) {
    console.error(`[verificar-backlog] BACKLOG inexistente: ${cfg.backlog} (motivo backlog-ausente). Un backlog que no se puede leer NO es despachable.`);
    process.exit(2);
  }
  let texto;
  try {
    texto = readFileSync(cfg.backlog, 'utf-8');
  } catch (e) {
    console.error(`[verificar-backlog] no se pudo leer ${cfg.backlog}: ${e.message}`);
    process.exit(2);
  }
  let r;
  try {
    r = verificarBacklog(texto, cfg);
  } catch (e) {
    console.error(`[verificar-backlog] fallo interno al lintear: ${e.message}`);
    process.exit(2);
  }
  imprimir(r, cfg);
  process.exit(r.exit);
}
