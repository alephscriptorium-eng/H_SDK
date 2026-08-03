# ESTACIÓN DEL VIGÍA — protocolo (marco-agnóstico)

Protocolo de vigilancia v1. Parametriza **el mundo** (`WORLD_ROOT`,
`CANONICAL_WORLD_ROOT`, `READ_ONLY_ROOTS`, `DOWNSTREAM_PATTERNS`, `OUT_DIR`,
`INTERVAL`). No incluye histórico de sesión: eso es dato de instancia.
La nota de frontera local del worktree, si existe, vive en
`plan/ESTACION.md` y se trata como calibración local.

## Parámetros canónicos

| param | rol |
| ----- | --- |
| `WORLD_ROOT` | Raíz candidata del repo git vigilado; no acredita identidad por sí sola |
| `CANONICAL_WORLD_ROOT` | Clone de trabajo canónico esperado |
| `READ_ONLY_ROOTS` | Array JSON explícito de raíces que nunca pueden ser raíz de trabajo |
| `DOWNSTREAM_PATTERNS` | Array JSON de patrones por segmentos; calibración del consumidor |
| `OUT_DIR` | Logs/estado del vigía (`watch.log`, `anomalias.log`) |
| `INTERVAL` | Segundos entre muestras (default 45) |

Territorio hermano (p. ej. gobierno vs obra) = **otra** calibración
`WORLD_ROOT`/`OUT_DIR`, no hardcode en el skill. Ver «Pulso multi-carril».

## Preflight de identidad (antes de cualquier efecto)

`scripts/verificar-identidad-raiz.mjs` es el detector canónico. El watcher lo
ejecuta **antes** de `mkdir -p "$OUT_DIR"`, de escribir logs o de entrar en su
bucle. Un consumidor que vaya a crear plan, rama o worktree, arrancar otro
watcher o ejecutar git mutable invoca el mismo preflight antes de esa acción.

El detector:

1. exige las cuatro entradas de identidad, incluidas listas vacías explícitas
   (`[]`), para distinguir «sin raíces» de calibración ausente;
2. resuelve ruta absoluta, `realpath` (incluidos junction/symlink) y
   `git rev-parse --show-toplevel` de candidata y canónica;
3. normaliza separadores y, en Windows, el case; compara pertenencia por
   segmentos, no por prefijo textual;
4. resuelve también cada raíz read-only y contrasta los patrones downstream
   contra la ruta lexical, real y git toplevel;
5. solo emite `identidad-raiz: PASS` si candidata, canónica y git toplevel
   identifican exactamente la misma raíz y esta queda fuera de las zonas
   prohibidas.

Cada elemento de `DOWNSTREAM_PATTERNS` es una secuencia `/` de segmentos. `*`
representa exactamente un segmento; `**`, segmentos parciales con glob, `.`
y `..` son ambiguos y producen LOCK. Los patrones concretos pertenecen a la
calibración del consumidor: este skill no incluye ninguno real.

Raíz inexistente, alias hacia downstream/read-only, git toplevel distinto,
calibración ausente o ambigua y diferencia respecto del canónico producen
`LOCK identidad-raiz` (exit `23`). Ante LOCK no se crea salida ni artefacto:
se pide al custodio un clone canónico fuera de las raíces observadas. El vigía
no lo crea, no lo elige y espera nueva calibración.

```bash
WORLD_ROOT=/ruta/candidata \
CANONICAL_WORLD_ROOT=/ruta/canonica \
READ_ONLY_ROOTS='["/ruta/solo-lectura"]' \
DOWNSTREAM_PATTERNS='["segmento/downstream/*"]' \
node skills/vigilancia/scripts/verificar-identidad-raiz.mjs
```

## Rol (inviolable)

- **Read-only** sobre los repos del swarm del mundo. Nunca editar, nunca
  tocar index/HEAD, nunca entrar en `.worktrees/` con workers vivos.
- **No hablar con el swarm; solo con el custodio.** Mediación transparente:
  el orquestador PUEDE saber que existe revisión externa («agente externo» /
  «vigilante»); NUNCA conoce la capa del marco que publica este skill.
- **Vigía silencioso:** el falso positivo no es inocuo — un aviso ruidoso
  empuja a relanzar. Solo elevar anomalía real.
- **Reparto por coste:** un modelo piensa y sintetiza corto; otro lee pesado
  y verifica CAs; otro barre mecánico. Persistir TODO veredicto en disco
  (la memoria del chat se pierde).

## Ciclo de trabajo

vigía detecta → verificación → addenda dos caras (§interna / §WP copiable
en idioma del mundo, con prueba de ceguera) → custodio media → orquestador
decide (acepta/adapta/cola) → WP → merge → **vigía re-verifica CA de facto**
(grep/curl/gh real, nunca fiarse del ✅). Entregar en QUIETUD (entre lotes,
nunca sobre zona de worker vivo). Cruzar SIEMPRE con las colas propias del
orquestador antes de entregar (no duplicar).

Toda salida al custodio aplica además el contrato dual de
`ADDENDA-DOS-CARAS.md`: primero vista PO/SCRUM renderizable y después handoff
operativo copiable. La contrarrevisión read-only pre-merge intenta refutar un
WP de riesgo; no sustituye el gate final post-merge `Rn-<carril>`.

## Sucesión de estación (v2 «gorro»)

La estación es **viva** (§Rol). Cuando un agente/proceso **releva** a otro en
la misma estación, el relevo se rige por «gorro»: rol temporal que se pone y
se quita, con **origen declarado**. Contrato de método (fuente única):
`swarm-orquestacion` → `reference/lecciones-vnext.md` §Sucesión v2. Aquí, lo
que hace **la estación** al relevar:

1. **Handoff volátil.** El saliente entrega un arranque **efímero**; la fuente
   de verdad sigue siendo `OUT_DIR` (bitácora / `watch.log` / `anomalias.log`)
   y el plan trazado, no el handoff. Tras el relevo, el handoff no se cita
   como evidencia.
2. **Ronda breve Q&A.** El entrante pregunta estado real, gates pendientes y
   qué es residuo vs señal; el saliente responde **antes** de soltar el gorro.
3. **Herencia de anomalías COMO anomalía.** Cada entrada abierta de
   `anomalias.log` pasa al entrante **marcada como anomalía**; ninguna se
   entrega como estado normal. Un huérfano / lock heredado sin marca queda
   normalizado y se pierde.
4. **Rol temporal con origen declarado.** El gorro declara quién lo cede y por
   qué. Antes de **emular** otro rol de carril, **claim previo** (convivencia
   del swarm → `convivencia-multi-orquestador.md` §10): sin claim en el canal
   + idle real verificado, el relevo es **doble-conductor = anomalía
   registrable**.
5. **Anclas activas vs citas inertes.** El handoff separa comandos / rutas
   **literales y reproducibles** (anclas activas, ejecutables tal cual) de la
   **evidencia histórica** que no se reproduce; esta última se marca con
   `[cita inerte]`. Sin la marca, el entrante re-ejecuta una cita contra un
   canal ya movido.

El vigía relevado **no** hereda el `✅` ni el veredicto del saliente sin
re-verificarlo **de facto** en el canal real (misma disciplina que la
re-verificación post-merge del §Ciclo de trabajo).

## Doctrina calibrada (señales)

- **Worker muerto = mtime del worktree**, no cadencia de commits (patrón
  normal: trabajo callado + ráfaga final).
- **Huérfanos en `.worktrees/`** (sin registro git):
  - **(a)** transitorio <2 ciclos en cierre de WP = ruido de remove;
  - **(b)** carpeta vacía persistente = residuo de FS benigno;
  - **(d)** contenido pesado SIN `.git`, mtime estable, WP cerrado =
    remove fallido por bloqueo de FS (benigno, limpiar en quietud);
  - **(c)** contenido + `.git` + mtime vivo + WP relanzado = **worker
    perdido** (el incidente; elevar).
- **Locks:** `index.lock` 1 ciclo = git trabajando; ≥2–3 ciclos = colgado.
- **Plataforma:** preferir señales de proceso nativas del OS; `worktree
  remove` puede dejar residuos si el FS bloquea el directorio; junctions /
  enlaces pueden auto-repararse si hay hook de re-resolución.
- **CA con verificación externa** (URL, release, registro): no dar por ✅
  sin correr la verificación (curl/gh/browser).
- **Gates externos explícitos:** un sprint puede terminar esperando un tick
  ajeno al swarm. El swarm declara «esperando: tick de quién»; el
  vigía, al ver sprint drenado con gate externo, avisa al custodio.
- **C8:** todo comando copiable citado en docs/CAs se EJECUTA contra su
  canal real antes de aprobar — «publicado» es ambiguo (Release ≠ registry
  ≠ tarball).
- **C8 ampliado:** el CANAL DE VERIFICACIÓN = el CANAL DE USO. Un enlace de
  nav a asset de cliente se verifica NAVEGÁNDOLO, no solo con curl.
- **CA-por-clase:** un CA de bug cubre la CLASE del defecto, no solo la
  instancia reportada. Verificar con control de la clase.
- **Pulso CI:** el pulso incluye SIEMPRE el último run de CI de la rama
  principal del mundo (`gh run list -L2` u equivalente). Los smokes locales
  de workers no sustituyen al runner limpio.
- **Pulso secrets de publish:** en todo **repo nuevo** que vaya a publicar
  paquete (tag `v*` → workflow), el pulso incluye
  `gh secret list -R <org>/<repo>` y verifica que existan los nombres que
  el workflow exige (`NPM_USERNAME` + `NPM_PASSWORD`, o `NPM_TOKEN` si
  aplica). Ausencia = anomalía **antes** del primer tag — no tras el
  fallo de CI. Caso fundante: **GL 2026-07-22** (publish roto por secrets
  no sembrados; el check de pulso lo habría pillado en PRE).
- **Residuo de info en carpetas de IDE (regla 15 del swarm):**
  markdowns/notas de sesión bajo `.claude/`, `.cursor/` u otras carpetas
  de herramienta son una **fuente de verdad paralela y efímera** — se
  pierden al cerrar y hacen creer que «el resto ya lo sabe». El vigía los
  **eleva como anomalía**. La **configuración funcional** (json/toml,
  tasks, servidores MCP) **no** es residuo y no se toca. Corolario del
  propio vigía: persiste TODO veredicto a disco trazado (`OUT_DIR`), nunca
  solo en memoria de chat.
- **CHANGELOG ↔ backlog cerrado (práctica del swarm):** el vigía cruza que
  cada WP ✅ del plan está reflejado en el `CHANGELOG.md` (formato estándar,
  derivado del backlog, no inventado). Desfase = anomalía a elevar.
  Herramienta: `verificar-changelog.mjs` del swarm (o grep de los WP ✅
  contra el CHANGELOG). Especialmente antes de un release.
- **Proyección no declarada (DC-15 del swarm):** la proyección del backlog
  a un tracker de issues es **local-only por defecto**; solo se activa si
  el usuario la pidió. El vigía eleva como anomalía cualquier proyección
  (issues creados/actualizados, `.sync-map.json` nuevo) **sin modo
  declarado** en la sesión.

## Ciclo de sprint

1. **PRE (triaje):** auditar temas contra el código real → cruzar con el
   registro de bugs → ENTREGA priorizada con CAs → GO custodio.
2. **DURANTE:** pulso = worktrees + locks + **CI principal** + anomalías;
   review por WP cerrado (CA de facto, causa raíz, cero asserts debilitados).
   Devueltos = señal de salud.
3. **POST:** verificación batch; persistir veredictos; retro de protocolo;
   declarar gates externos pendientes.
4. **Invariante:** un WP ✅ jamás se reabre — trabajo nuevo = WP nuevo.

## Pulso idle y fixes retroactivos

Idle significa que no hay zona de worker viva sobre la que la elevación pueda
interferir. No significa «sin trabajo»: el vigía usa esa ventana para recoger
evidencia ya observada en gates y formar propuestas, siempre read-only.

1. Recoger residuos técnicos reproducibles de gates, devoluciones y CAs de
   facto. Una nota sin evidencia queda como observación, no como candidato.
2. Agrupar por causa/clase del defecto y exigir control positivo más falso
   negativo. No proponer un fix por cada síntoma.
3. Contrastar con backlog/colas existentes para evitar duplicados.
4. Registrar candidato, evidencia literal, alcance tentativo, dependencia,
   CA por clase y si el probe fue automatizado o manual.
5. Proponer al custodio olas pequeñas por independencia de archivos y
   dependencias; la propuesta no es planificación aceptada.
6. Elevar mediante addenda dual. El vigía no edita BACKLOG, no abre WP, no
   implementa, no acepta y no reabre trabajo cerrado.

Checklist de elevación idle:

- dependencia cargada en runtime → dependencia directa declarada;
- propiedad positiva + falsos negativos;
- probes automatizados o evidencia marcada explícitamente como manual;
- gate local determinista separado de C8 online;
- contrarrevisión pre-merge separada del gate post-merge;
- ceguera de la cara copiable = 0.

Fixture: `../examples/addenda-idle-sintetica.md`. Gate documental:
`node ../scripts/verificar-salida-dual.mjs <addenda>` desde esta carpeta, o
las rutas equivalentes desde la raíz.

## Layout BACKSTAGE_GIT · `cantera/`

El backstage (pulsos/addendas + depósitos custodiados) tiene layout
recomendado propio: ver `reference/BACKSTAGE-GIT.md`. Convención:
**`cantera/`** = depósitos custodiados; no confundir con `_fuentes/`
(FS atlas = checkouts de lectura). Un worktree por rol. Migración
legacy: `fuentes/` → `cantera/`.

## Herramienta

`scripts/watcher.sh` (intervalo configurable) → `watch.log` +
`anomalias.log` bajo `OUT_DIR`. Vigila worktrees registrados vs carpetas,
mtime, locks. **No usa `git status`.** Mejora pendiente si se reusa:
clasificar huérfano por vacío/no-vacío y exigir ≥2 ciclos antes de logar.

Un proceso = un `WORLD_ROOT`. Multi-root / territorio hermano: ver
sección siguiente (instancias paralelas o `SIBLING_ROOT` solo lectura).

### Liveness del watcher por lease de timestamp (portable)

Para decidir si **un** watcher (este `watcher.sh` o el `watcher-sesion.sh`
de estación) sigue vivo, la señal **contractual** es el **último tick** de
su `watch.log`, no el PID:

| estado | condición |
| ------ | --------- |
| **vivo** | último tick con `edad < 2×INTERVAL` |
| **muerto** | último tick con `edad ≥ 2×INTERVAL` |
| **dudoso** | sin `watch.log`, vacío, o tick no parseable |

El **PID** es **pista secundaria no contractual**: en Git Bash el árbol de
procesos puede no ser verificable aunque los ticks estén frescos → el lease
manda y el veredicto es **vivo**. Portable **Git Bash (win) + POSIX**: sin
`tasklist`/`ps` como fuente (regla de este skill). Cada ciclo de
`watcher.sh` ya emite un sello `[F T]`, así que el lease aplica sin cambios.

Método inline (vigía solo con este skill):

```bash
# umbral = 2×INTERVAL; tick = último sello del log
INTERVAL=45; LOG="$OUT_DIR/watch.log"
tick="$(grep -oE '^\[[0-9-]{10} [0-9:]{8}\]' "$LOG" | tail -1 | tr -d '[]')"
edad=$(( $(date +%s) - $(date -d "$tick" +%s) ))
[ "$edad" -lt $(( 2*INTERVAL )) ] && echo vivo || echo muerto
```

Versión empaquetada (con salida de evidencia y pista de PID):
`comprobar-vivo.sh` del skill `estacion-viva` (composición ya declarada en
su `reference/WATCHER.md`).

## Supuestos de convivencia (dep blanda · shape S01)

Supuestos explícitos sobre convivencia multi-orquestador. Fuente canónica
del contrato: skill `swarm-orquestacion` →
`reference/convivencia-multi-orquestador.md`. Aquí solo se documenta lo
que el **vigía** asume al pulsar. Si la integración ajusta la shape, el
orquestador alinea — este skill **no** edita el de orquestación.

1. **Vigía único.** Un solo vigía etiqueta rondas `Rn-<carril>` (patrón
   abstracto; el consumidor sustituye `<carril>`). No hay un vigía por
   orquestador.
2. **Partición.** Dos o más orquestadores pueden compartir gobierno con
   **partición de prefijos** (obra vs gobierno, o prefijos de plan/WP).
   El vigía lee ambos territorios; no escribe en ninguno.
3. **Higiene pre-despacho (§8).** Antes de autorizar despacho en un
   carril: sin huérfanos conocidos en el territorio de ese carril
   (worktrees fantasma, locks colgados, ramas merged sin poda). Equivale
   al checklist de higiene / regla 8 del método de orquestación + §8 del
   contrato de convivencia del consumidor.
4. **Freeze por `index.lock`.** Lock sostenido ≥2–3 ciclos del watcher →
   **freeze** de pushes de gobierno en **ambos** carriles y elevar al
   custodio. Un ciclo = ruido normal de git.
5. **Addendas por carril.** Cada addenda dos caras declara el carril
   (`Rn-<carril>`); **no** mezcla hallazgos de carriles distintos en la
   misma §WP. La cara §WP pasa prueba de ceguera antes de mediar.

## Pulso multi-carril

Cuando el mundo opera con **más de un carril** (orquestadores en
paralelo, obra + gobierno, o partición de prefijos):

### Etiquetas de ronda

- Formato: `Rn-<carril>` (ej. sintético: `Rn-obra`, `Rn-gobierno`).
- El vigía anota la etiqueta en bitácora/`OUT_DIR` y en el id de addenda
  (`ADDENDA-<id>·Rn-<carril>`).
- Un pulso de estación puede **observar** varios carriles; cada
  elevación lleva **una** etiqueta.

### Qué muestrear por carril

| señal | dónde | umbral |
| ----- | ----- | ------ |
| worktrees / huérfanos | `.worktrees/` del `WORLD_ROOT` del territorio | ≥2 ciclos si no vacío |
| `index.lock` / `HEAD.lock` | `.git/` del root vigilado | 1 ciclo = ok; ≥2–3 = freeze + elevar |
| worktree `locked` | `.git/worktrees/*/locked` | igual que locks |
| CI principal | canal del mundo (`gh` u otro) | último run de la rama principal |
| secrets publish | `gh secret list -R <org>/<repo>` | nombres exigidos presentes (repo nuevo / primer publish) |
| higiene §8 | territorio del carril a despachar | 0 huérfanos conocidos |

### Territorio hermano + gobierno

- **Obra** y **gobierno** (o dos roots hermanos) se calibran como dos
  pares `(WORLD_ROOT, OUT_DIR)`.
- Arranque típico: dos procesos `watcher.sh` (uno por root) o un proceso
  con `WORLD_ROOT` principal + `SIBLING_ROOT` opcional (solo muestra
  locks/worktrees del hermano; escribe en el mismo `OUT_DIR` con prefijo
  `sibling:`).
- El vigía **no** mezcla en una sola addenda señales de roots distintos
  sin etiquetar carril.

### Ritual de pulso (multi-carril)

1. Higiene §8 del carril candidato a despacho (PASS/FAIL).
2. Locks en obra y en gobierno (si hay hermano).
3. Huérfanos / stale / residuo IDE en el root correspondiente.
4. CI de la rama principal del mundo de obra (si aplica).
5. Si el mundo de obra es **repo nuevo a publicar**: `gh secret list -R`
   → nombres de publish presentes (caso fundante GL 2026-07-22).
6. **Territorio == mapa** (cuando existan `plan/MAPA-*.md`): contrastar
   raíz FS vs filas de `MAPA-RAIZ` / taller vs `MAPA-TALLER`;
   `git ls-files` ≤2 niveles vs filas+política de `MAPA-REPO`.
   Entrada/fichero sin fila = **FAIL de ronda**; ampliar mapa = commit
   de gobierno. Herramienta: `scripts/verificar-territorio-mapa.sh`.
   Sin mapas → no aplica (mundo pre-#19). Semilla: `montar-plan` del
   skill `swarm-orquestacion`.
7. Si lock ≥2–3 ciclos → freeze pushes gobierno ambos carriles + addenda.
8. Si eleva: addenda dos caras con `Rn-<carril>` y ceguera = 0 en §WP.

## Pulso territorio == mapa (#19)

Invariante de gobierno: el territorio FS / repo **no** crece en silencio.

| mapa | contraste |
| ---- | --------- |
| `plan/MAPA-RAIZ.md` | `ls` raíz del territorio vs filas |
| `plan/MAPA-REPO.md` | `git ls-files` (≤2 niveles) vs filas + columna ¿en git? |
| `plan/MAPA-TALLER.md` | `ls` raíz del taller (si el mundo lo usa) vs filas |

Regla al pie de cada mapa (canónica): *entrada/fichero sin fila = FAIL
de ronda; ampliar el mapa = commit de gobierno.*

```bash
bash skills/vigilancia/scripts/verificar-territorio-mapa.sh --root "$WORLD_ROOT"
```
