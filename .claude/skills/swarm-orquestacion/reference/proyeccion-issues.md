# Proyección del backlog a issues (sin sync bidireccional)

Método para proyectar el scrum de markdown a un tracker de issues
externo. **No es sync**: es **proyección**. El markdown local es la
**fuente de verdad única** (regla 15); los issues son un artefacto
desechable, regenerable, sin autoridad.

Herramienta: `scripts/proyectar-backlog.mjs` (Node ≥18 + `gh` CLI
autenticado para el adaptador GitHub). Marco-agnóstico.

> **Modo por defecto: LOCAL-ONLY (DC-15).** Nadie proyecta a GitHub salvo
> que el **usuario lo pida explícitamente**. El modo se **declara al
> inicio de sesión** (el orquestador lo confirma; default local-only). El
> `export` real rehúsa sin opt-in (`--habilitar-github` /
> `PROYECCION_GITHUB=1`); el `--dry-run` (preview, sin API) se permite
> siempre. Un tracker público mal proyectado causa líos: por eso el
> silencio es el estado seguro.

## Principio

```
LOCAL (markdown + marcas)      REMOTO (issues)
  fuente de verdad     ──export──▶  proyección desechable
  el orquestador escribe  ◀─import──  INBOX (cola de reconciliación)
```

Nunca dos maestros. El remoto **jamás** escribe el BACKLOG: lo que llega
de la web (comentarios, cierres a mano) entra por `plan/INBOX-GH.md`, que
el orquestador lee y reconcilia **a mano** en el markdown. La divergencia
no es un conflicto de merge — es una cola de decisiones, que es el modelo
de siempre (solo el orquestador escribe BACKLOG).

## Export (local → remoto)

Determinista e idempotente:

- Cada WP lleva su **ID estable**, parseado del BACKLOG aunque el
  encabezado venga en formato mixto (`**ID · título**`, `**ID** — prosa`,
  `ID · prosa`, `ID (nota)`).
- Si el exportador ve una línea de WP que no puede interpretar, **falla
  ruidoso** con la línea y el número de línea; no omite en silencio.
- `plan/.sync-map.json` (`WP-XX → nº issue`) — git-tracked — permite
  crear/actualizar. Marcador oculto `<!-- proyeccion:WP-XX -->` en el
  body para resiliencia si se pierde el mapa.
- **Post-apply (regla 17):** el mapa **nunca** se commitea con números
  de issue antes de que existan en el tracker. Orden: export real
  (crear/actualizar) → mapa refleja IDs reales → commit mapa + acta.
  Mapa especulativo = devolución.
- **Mapeo (DC-14):** `✅` → issue **closed**; `⬜`/`🔶` → **open**. Sin
  labels.
- **Alcance configurable (DC-20):** `--alcance todos` (default; proyecta
  todo el backlog) o `--alcance abiertos` (solo `⬜`/`🔶`, el trabajo
  accionable; los `✅` no se proyectan). Se elige **al activar**.
- **Auto-cierre (DC-19):** todo issue del `sync-map` cuyo WP **no** esté en
  el conjunto proyectado (retirado del backlog, o `✅` bajo
  `--alcance abiertos`) se **cierra** con comentario y sale del map. Modelo:
  «proyectá el conjunto; cerrá lo que sobra».
- Re-correr no duplica; regenerable desde cero (si borras los issues, el
  export los reconstruye).

```bash
# preview seguro (sin API, sin opt-in):
CEGUERA_PATTERN='<patrón del mundo>' \
  node scripts/proyectar-backlog.mjs export --dry-run

# proyección real (SOLO si el usuario lo pidió — DC-15):
CEGUERA_PATTERN='<patrón del mundo>' PROYECCION_GITHUB=1 \
  node scripts/proyectar-backlog.mjs export [--repo owner/name]
```

## Series de ID configurables (DC-29) — obligatorio declarar las del mundo

El mundo consumidor no está limitado a `WP-XX`: puede numerar sus WPs con
**cualquier serie** (`IB-\d+`, `PD-\d+`, `LIB-\d+`, `N0-\d+`, `WP-U?\d+`,
`GF-[0-9.]+-Z`, …). El parser las acepta por configuración:

- `--series 'REGEX|REGEX|…'` (o env `PROYECCION_SERIES`): **alternación de
  regex** de ID, separada por `|`. Ej.: `--series 'IB-\d+|PD-\d+|LIB-\d+'`.
- Sin declaración → serie por defecto `WP-[A-Za-z0-9]+` (retrocompatible con
  el histórico `WP-XX`, `WP-Unnn`, `WP-I60`).
- **CERO normalización de IDs (DA-S17):** el ID del consumidor se conserva
  **literal** (clave del `sync-map` y del marcador `<!-- proyeccion:ID -->`).
  `BB-02` no se reescribe a `BB-2`; `GF-0.10.0-Z` no se trunca.

**Fallo ruidoso ante mixtos no declarados (DC-25/DC-29).** Si el backlog
tiene ítems con forma de ID de una serie **no declarada**, o si de N ítems
se parsean **0 WPs**, el export **falla** (exit ≠ 0) con las series
detectadas y las declaradas — **nunca** omite WPs en silencio ni proyecta
un backlog vacío. El operador declara la serie y reintenta.

```bash
# multi-serie declarada:
node scripts/proyectar-backlog.mjs export --dry-run \
  --series 'IB-\d+|PD-\d+|LIB-\d+'
# serie no declarada → diagnóstico + exit ≠ 0:
#   [proyectar] IDs de serie(s) NO declarada(s) en el backlog: IB, PD, LIB.
#     series declaradas: WP-[A-Za-z0-9]+  … declara las series con --series.
```

Tests del parser: `scripts/proyectar-backlog.test.mjs`
(`node --test scripts/proyectar-backlog.test.mjs`).

## Gate de ceguera (DC-12) — obligatorio

Los issues son **cara pública**. Antes de tocar la API, el export valida
el contenido a proyectar contra `CEGUERA_PATTERN` (regex de los tokens de
marco del mundo, **por env** — nunca almacenado en el skill, para no
auto-contaminarse). **Sin patrón → se rehúsa** (fail-safe, exit 3). Con
hit → aborta sin crear nada (exit 1). Un backlog no-blindado no se
proyecta a un tracker público.

## Import (remoto → local)

`import` trae el estado y comentarios de los issues mapeados y escribe
`plan/INBOX-GH.md` (git-tracked). **No** escribe el BACKLOG. El
orquestador reconcilia y vacía el inbox.

```bash
node scripts/proyectar-backlog.mjs import [--dry-run]
```

Cuerpo de cada issue proyectado lleva la nota: *«proyección generada —
comentad, no editéis; los comentarios entran por inbox»*.

## Modos

| modo | qué es | activación |
| ---- | ------ | ---------- |
| a) solo local | no ejecutar el exportador; coste cero | **por defecto** |
| b) sesión | `import` al abrir (drenar inbox), `export` al cerrar | opt-in explícito del usuario |
| c) continuo | `export` en hook post-commit — **patrón**, no incluido en 0.3.2 | opt-in explícito del usuario |

El modo se fija al **inicio de sesión**: el orquestador confirma con el
usuario (ver `roles/ORQUESTADOR.md`). Sin declaración → modo a (local).

## Adaptador (remote-agnóstico)

El adaptador GitHub usa `gh issue create/edit/close/reopen`. Otro remoto
(GitLab, ninguno) = otro adaptador; el parser del backlog y el modelo
proyección/inbox no cambian.

## No git-bug (DC-11)

git-bug resuelve issues-en-git, pero su modelo no es el markdown con
marcas — se perdería el backlog-como-texto, que es el corazón del método.
Por eso: exportador propio, fino sobre `gh api`.
