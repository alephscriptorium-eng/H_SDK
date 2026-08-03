# BUZÓN Y NOTAS · capa operativa del carril

| dato | valor |
| ---- | ----- |
| Mantiene | `HUB` (mismo régimen que `PROTOCOLO.md`) |
| Rango | mecanismo operativo de §1, §3, §5, §7 y §9 del contrato — **no añade normas nuevas**: las materializa en ficheros y pasos |
| Público | cualquier agente que deba montar u operar el buzón de un carril conociendo **solo este skill** |

Los nombres en MAYÚSCULA son parámetros §0 (`../SKILL.md` §Parámetros).
Todo ejemplo de este documento es sintético; los ficheros de un ciclo
completo materializado viven en `../examples/fixture-buzones/`.

---

## 1 · Piezas de `sincronia/`

`BUZON(X) = <WORLD_ROOT(X)>/sincronia/` es el **único** lugar del mundo de
un carril donde vive su correo. Layout completo:

```text
<WORLD_ROOT(X)>/sincronia/
  BUZON.md          # PUNTERO del carril: datos + tabla «Vigente» (este doc §2)
  TIMBRE.md         # campanilla append-only (contrato §7)
  DRAFT.md          # borrador de backlog encolable (contrato §9.5)
  notas/            # el CONTENIDO: una nota = un fichero
    archivo/        # notas superadas (compactar-y-reemplazar, este doc §6)
```

| pieza | qué es | qué NO es |
| ----- | ------ | --------- |
| `BUZON.md` | índice vivo: apunta a lo vigente | contenedor de mensajes |
| `TIMBRE.md` | aviso «hay algo que leer» | buzón ni hilo de conversación |
| `notas/*.md` | el mensaje completo, uno por fichero | log editable a posteriori |
| `notas/archivo/` | historia local navegable | fuente normativa (esa es la cadena de sellos, §10.7) |

## 2 · El buzón apunta, no contiene

`BUZON.md` es un **puntero**: levanta el estado del carril en una pantalla.
Exactamente tres bloques, en este orden (plantilla:
`plantillas/BUZON.md.tpl`):

1. **Cabecera de datos del carril** — tabla `| dato | valor |` con, como
   mínimo: `Mundo` (raíz), `Dueño` (identidad que firma), `Watchers`
   (estado real: vivos o parados), `Informe` (el vigente de la `SALA`, o
   `-`), `Draft`, `Timbre`, `Bitácora` (`OUT_DIR(X)`).
2. **`## Vigente`** — tabla `| fecha | nota |`: una fila por nota viva,
   con enlace relativo a `notas/…` y un resumen de **una línea como
   máximo**. Lo que no está aquí no es correo vigente del carril.
3. **Pie** — puntero a la historia (`notas/archivo/` · sellos en
   `CUADERNOS`) y firma del dueño (§1).

Reglas del puntero:

- **Apuntar, no contener.** Si un dato vive en otro fichero, el buzón lo
  enlaza; jamás lo copia. Un buzón que crece con prosa está roto.
- **Mínimo vivo** (§3 forma): cada token del buzón lo paga la ventana de
  contexto de todo el que levanta estado. Filas superadas se **sustituyen**
  (este doc §6), no se tachan ni se acumulan.
- **El buzón lo mantiene su dueño** en el mismo turno en que emite o
  archiva una nota: nota nueva sin fila en «Vigente» = correo invisible.

## 3 · Un buzón, un dueño

- **Escribe el dueño y solo el dueño** en todo su `sincronia/` — buzón,
  notas, draft y timbre propio incluidos.
- **Única excepción:** cualquier carril puede hacer **append de UNA línea
  `PING …`** al `TIMBRE.md` de otro (formato y encoding exactos: contrato
  §7). Nada más: ni editar líneas ajenas, ni tocar `BUZON.md` ni `notas/`
  de otro, ni «corregir por ayudar».
- Timbre ajeno roto por un append defectuoso: quien lo rompió lo declara
  con ⚠️; **repara el dueño** — la reparación del dueño es la única
  reescritura legítima (§7).
- Leer es otra cosa: la lectura cruzada la regulan §5 (jerarquía de
  fuentes) y §8 (hilos con `LECTURA=` acotada); este documento solo fija
  la escritura.

## 4 · La nota — unidad de mensaje

**Una nota por turno** (§9.3): cada tick recibido produce como máximo una
nota. Aclaraciones extra = siguiente turno o pregunta al custodio.

- **Fichero:** `notas/NOTA-<X>-<YYYY-MM-DD>-<slug>.md` — emisor y fecha en
  el nombre; el slug dice el asunto. (Los compactos de hilo usan su propio
  patrón `COMPACTO-<hilo>.md`, §8.)
- **Cabecera:** tabla `| dato | valor |` con `Emisor`, `Fecha`, `Tick`
  (el tick que autoriza la nota, con `TO=`), `REF` (a qué responde: ruta o
  id de nota/informe/tick previo, o `-` si abre asunto).
- **Cuerpo:** leyenda TUI de §3 (`▸` hecho · `◆` decisión con dueño · `★`
  recomendación · `⚠️`/`⏳`/`⛔` estados); tablas cortas antes que prosa.
- **Cierre:** línea `ESTADO: …` solo si la nota es handoff operativo (§3
  frases-contrato) y **firma** `— **<X>**` siempre (§1).
- Una nota emitida **no se reedita**: lo superado se responde con otra
  nota o se archiva (§6). Excepción: las curas trazadas del `AUDITOR`
  (§11.4), que no son del emisor.

Plantilla: `plantillas/NOTA.md.tpl`.

## 5 · El aviso — «tienes mensaje de X»

El contenido nunca viaja por el canal de aviso; el aviso **apunta al
buzón**. Dos vías:

| vía | forma | qué hace el receptor |
| --- | ----- | -------------------- |
| consola (custodio) | «tienes mensaje de X» | abre `BUZON.md` de X (ruta fija: `<WORLD_ROOT(X)>/sincronia/BUZON.md`) y localiza la nota en «Vigente» |
| timbre (carril) | línea `PING … · REF=<ruta de la nota>` en tu `TIMBRE.md` | la `REF` lleva directo a la nota |

- La frase de consola **basta sin ruta** porque el buzón vive en un lugar
  fijo del mundo de cada carril — esa es la función del puntero.
- **Ningún aviso autoriza a procesar** (§5 del contrato:
  `NO_TICK_VALIDADO=NO_PROCESAR`). Ver un PING o recibir la frase solo
  permite saber que hay correo; leer-para-responder exige tick del
  custodio, con las dos únicas salidas de la tabla de §7 (hilo autorizado
  · encolar y reportar).
- Pull-on-tick (§7 v0.2): con CUALQUIER tick, antes del alcance, se lee el
  timbre propio entero desde `base` y se **reporta** lo pendiente.

## 6 · Compactar y reemplazar

Ciclo de vida de una nota (aplica §3 «compactar y reemplazar» al buzón):

```text
emitida → fila en «Vigente» → superada (respondida, asentada en informe,
o cerrada por sello) → fichero a notas/archivo/ + fila fuera de «Vigente»
```

1. **Cuándo archiva el dueño:** cuando el contenido quedó asentado en un
   informe validado o en un sello de `CUADERNOS` (§10.7) — el archivo
   local es cortesía de navegación; la fuente normativa ya es la cadena.
2. **Cómo:** mover el fichero a `notas/archivo/` (sin reescribirlo) y
   quitar la fila de «Vigente». Sin tachones ni «(superado)» acumulados.
3. `notas/archivo/README.md` lleva la doctrina en dos líneas: historia en
   sellos; el archivo **no es fuente normativa**.
4. El timbre rota igual: el dueño archiva a `notas/timbre-<fecha>.md`
   cuando quiera (§7).

## 7 · Montaje — pasos ejecutables

Monta el buzón de un carril nuevo un agente que **solo conoce este
skill**. Entrada necesaria (la entrega el custodio o la calibración §0 de
la mesa; si falta un dato: `<pendiente>`, no se infiere):

| dato de entrada | ejemplo de forma |
| --------------- | ---------------- |
| identidad del carril `X` | nombre corto con el que firmarás |
| `WORLD_ROOT(X)` | raíz del mundo propio |
| `OUT_DIR(X)` | dónde vivirá tu bitácora/estación |
| timbre de la `SALA` | ruta del `TIMBRE.md` del hub, para tu primer PING |
| tick de alta | el tick del custodio que autoriza este montaje (§4/§5) |

Pasos (cada uno cita su fuente):

1. **Crear el árbol** — `mkdir` de `sincronia/`, `sincronia/notas/` y
   `sincronia/notas/archivo/` bajo `WORLD_ROOT(X)` (layout de §1).
2. **Materializar `BUZON.md`** desde `plantillas/BUZON.md.tpl`:
   sustituir todos los `<…>`; con la mesa recién montada, `Informe` = `-`
   y `Watchers` = `parados` (se declara el estado **real**, §2.1). La
   tabla «Vigente» nace vacía (solo cabecera de tabla).
3. **Materializar `TIMBRE.md`** desde `plantillas/TIMBRE.md.tpl`
   (reglas: contrato §7). La plantilla ya trae el formato `PING …` citado
   **indentado** — así no cuenta como ping real en `grep -c '^PING '` —
   y la sección `## Pings` vacía al pie. Encoding UTF-8 sin BOM; append
   siempre.
4. **Crear `DRAFT.md`** (§9.5): cabecera con dueño y fecha + secciones
   `## Candidatos` y `## BLOQUEA:` vacías, y firma. Vacío es estado
   válido; lo que no es válido es que falte cuando el custodio pida
   exportar backlog. Forma de referencia:
   `../examples/fixture-buzones/sur/sincronia/DRAFT.md`.
5. **Sembrar `notas/archivo/README.md`** con la doctrina de §6.3.
6. **Primera nota** — presentación del carril desde
   `plantillas/NOTA.md.tpl`: `Tick` = el tick de alta, `REF` = `-`,
   cuerpo mínimo (`▸` mundo y rutas propias · `⏳` lo que esperas). Añadir
   su fila en «Vigente» **en el mismo turno** (§2.3).
7. **Primer PING** — una línea al timbre de la `SALA` con `REF` = ruta
   absoluta de la nota de presentación (formato exacto §7; separador
   ` · `; la ruta con `/`, nunca `\`, que parte la línea).
8. **Verificar** antes de darse por montado:

```text
[ ] árbol de §1 completo (BUZON · TIMBRE · DRAFT · notas/ · notas/archivo/)
[ ] BUZON.md sin `<…>` sin sustituir · estados reales · firma del dueño
[ ] grep -c '^PING ' TIMBRE.md == 0 (el formato citado no matchea)
[ ] la fila de «Vigente» enlaza a la nota y el enlace resuelve
[ ] el PING en el timbre de la SALA apunta a la nota con ruta absoluta
[ ] nada escrito fuera de <WORLD_ROOT(X)>/sincronia/ salvo ese PING (§3)
```

Después del montaje rige el ciclo normal: esperar tick (§5) → una nota
por turno (§4) → mantener buzón (§2) → archivar (§6).

## 8 · Mapa al contrato

| este doc | contrato (`PROTOCOLO.md`) |
| -------- | ------------------------- |
| §2 puntero · mínimo vivo | §3 forma (compactar-y-reemplazar) |
| §3 un dueño · excepción PING | §7 timbre append-only |
| §4 nota · una por turno · firma | §1 firma · §3 TUI · §9.3 |
| §5 aviso ≠ autorización | §5 tick validado · §7 v0.2 pull-on-tick |
| §6 archivo ≠ fuente | §5.1 jerarquía · §10.7 sellos |
| §7 montaje | §0 calibración · §4 GO del custodio |

Verificación de un montaje por agente fresco: simulación documentada en
`../examples/simulacion-montaje-buzon.md` (y CA pleno con agente real:
pendiente, lo declara el backlog del consumidor).
