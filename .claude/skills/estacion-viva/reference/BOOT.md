# BOOT — 7 fases (contrato)

Contrato de arranque de la estación viva. Parametriza `WORLD_ROOT`,
`GAME_MCP`, `OUT_DIR`. Un agente **fresco** que solo conoce este skill
debe poder reproducir el boot completo (eje IV / regla 13).

Herramienta: `scripts/reproduce-boot.sh`. Fixture:
`examples/fixture-tick-cero/`.

## Perfiles de boot

El boot corre bajo un **perfil** declarado en la calibración del mundo. El
perfil **no** es un flag de conveniencia: fija qué fases del contrato son
exigidas. Se resuelve una vez, al arrancar; **sin perfil declarado = `jugador`**
(retrocompatible con el contrato de 7 fases original).

| perfil | para qué mundo | fase 5 (conexión al juego) |
| ------ | -------------- | -------------------------- |
| `jugador` (default) | agente que **entra al juego** | **exigida**: `GAME_MCP` no vacío + peercard firmada + kit del registry |
| `vigia` | agente que **observa** la estación sin jugar | **omitida por contrato**: `GAME_MCP` no aplica; no es un fallo |

### Tabla fase × perfil

| # | fase | `jugador` | `vigia` |
| - | ---- | --------- | ------- |
| 1 | Cargar estación | corre | corre |
| 2 | Regenerar estado desde bitácora | corre | corre |
| 3 | Relanzar watcher (clase sesión) | corre | corre |
| 4 | Pulso del mundo | corre | corre |
| 5 | Conexión al juego (`GAME_MCP` + peercard + kit) | **exigida** | **omitida (declarada)** |
| 6 | Modo debug | corre | corre |
| 7 | Salida dual PO/scrum | corre | corre |

- La diferencia entre perfiles es **exactamente** la fase 5. Todo lo demás
  es idéntico: el `vigia` regenera estado, relanza watcher, pulsa y emite
  salida dual igual que el `jugador`.
- `vigia` **omite declaradamente** la fase 5. La salida dual lo hace
  explícito (`juego: omitido (perfil vigia)`), no lo marca como `FAIL` ni
  como `pendiente`. Omisión por contrato ≠ fallo silencioso.
- En perfil `jugador`, `GAME_MCP` vacío **falla** la fase 5 (contrato de
  `GAME-MCP.md`). En perfil `vigia`, `GAME_MCP` puede faltar sin penalizar.

### Elección del perfil (en calibración)

- El perfil se declara en la **calibración local del consumidor** (junto a
  ruta de bitácora, canal de registry, etc.), no se codifica en el skill.
- Forma sugerida: variable de entorno `PERFIL` (`jugador`|`vigia`) o clave
  equivalente del preset del mundo; el default al leer ausencia es
  `jugador`.
- El perfil elegido se registra en `OUT_DIR/boot.log` (fase 1) y se refleja
  en ambas caras de la salida dual (fase 7), para que un lector sepa por qué
  la fase 5 corrió u omitió.

## Invariantes

1. **Fuente única del estado = bitácora.** Tras el boot, el estado en
   `OUT_DIR` se deriva solo de la bitácora; no hay segundo almacén que
   pueda divergir (sin drift).
2. **Watcher de clase sesión.** El proceso nace en la fase 3 y **muere
   con la sesión** (trap / kill al salir del boot o al cerrar el shell
   padre). No es un demonio de sistema.
3. **Kits del registry.** La conexión al juego resuelve
   `player-mcp-kit@0.1.3` por canal de registry (C8). Prohibido apuntar
   a un checkout hermano o raíz ajena.
4. **Whitelist de materialización.** El watcher no trata
   `.claude/skills/` como residuo de IDE (clase I71).

## Fases

### 1 · Cargar estación

- Verificar que `WORLD_ROOT` existe y es usable (repo o fixture).
- Crear `OUT_DIR` si falta.
- Registrar en `OUT_DIR/boot.log` el tip de estación (ruta + marca de
  tiempo).

### 2 · REGENERAR ESTADO desde bitácora

- Localizar la bitácora del mundo (default:
  `$WORLD_ROOT/bitacora/linea.mdl` o path de calibración).
- Regenerar `$OUT_DIR/estado.json` **solo** desde esa bitácora.
- Borrar o sobrescribir cualquier estado previo en `OUT_DIR` antes de
  escribir (evita drift con restos de sesión anterior).
- Contrato de línea: `BITACORA.md`.

#### Degradación · bitácora ausente (bootstrap de fundación)

Un mundo recién nacido puede no tener bitácora todavía. La fase 2 **no
falla mudo ni inventa estado**: hace un **bootstrap explícito** de fundación.

1. Comprobar la ruta de bitácora resuelta (default o calibración).
2. Si **no existe** (o está totalmente vacía, sin cabecera):
   1. Crear la bitácora con **cabecera + un único asiento de fundación**:
      una línea `fundacion` con `ts` UTC y autor = la estación (ver
      «Asiento de fundación» en `BITACORA.md`). La línea queda como primera
      entrada append-only; el resto del fichero, vacío.
   2. Regenerar `$OUT_DIR/estado.json` como **estado inicial** derivado de
      esa única línea (mundo en tick-cero: sin acumulados; solo la marca de
      fundación). Es el mismo camino de regeneración, sobre una bitácora de
      una sola línea — no una rama de código paralela.
   3. Registrar en `boot.log`: `bitacora: bootstrap-fundacion` (para que el
      lector distinga «regenerado de historia» de «sembrado en fundación»).
3. Si **existe con líneas**: regeneración normal (arriba).

Prohibido: (a) fallar la fase 2 en silencio porque falta la bitácora;
(b) fabricar estado que la bitácora no respalda —el único estado permitido
sin historia es el tick-cero de fundación—; (c) mantener un segundo almacén
que el boot no regenere. Autoría de líneas posteriores: editor MCP del
mundo (`BITACORA.md`), no este skill.

### 3 · RELANZAR watcher (muere con la sesión)

- Arrancar `scripts/watcher-sesion.sh` con `WORLD_ROOT` + `OUT_DIR`.
- Aplicar whitelist `.claude/skills/` (`WATCHER.md`).
- Guardar PID en `$OUT_DIR/watcher.pid`.
- Registrar trap: al salir del proceso padre → matar el watcher.

### 4 · Pulso del mundo

- Una muestra puntual: `scripts/pulso-mundo.sh`.
- Escribe resumen en `$OUT_DIR/pulso.txt` (conteo worktrees / locks /
  skills materializados whitelisted).
- Puede componer señales del skill `vigilancia` sin copiar datos de
  instancia.

### 5 · Conexión al juego

**Solo perfil `jugador`.** En perfil `vigia` esta fase se **omite por
contrato**: no se exige `GAME_MCP` ni peercard; la salida dual lo declara
(`juego: omitido (perfil vigia)`) y el boot sigue siendo OK. Ver «Perfiles
de boot».

En perfil `jugador`:

- Exigir `GAME_MCP` no vacío.
- Exigir peercard firmada en path de calibración o
  `$OUT_DIR/peercard.json` (fixture en tick-cero).
- Resolver kit `player-mcp-kit@0.1.3` vía registry (C8), no sibling.
- Detalle: `GAME-MCP.md`.

### 6 · Modo debug

- Escribir `$OUT_DIR/debug.flag` con marca de sesión.
- Volcar checklist de las 7 fases a `$OUT_DIR/debug-boot.txt`.

### 7 · Salida dual PO/scrum

- Emitir `$OUT_DIR/salida-po.md` y `$OUT_DIR/salida-scrum.md`.
- Formato: `SALIDA-DUAL.md`.
- Declarar en ambas caras el **perfil** activo y, si aplica, el
  **bootstrap de fundación** y el **modo pre-git** (fases en `<pendiente>`).

## Modo fundación (pre-git)

Un mundo en **fundación** puede no tener aún `.git` en `WORLD_ROOT` (el
repo se inicializa en un WP de repo posterior). El boot **degrada de forma
declarada**: corre lo que no depende de git y deja en `<pendiente>`
—nunca en `FAIL` mudo— lo que sí depende, hasta que exista el repo.

| # | fase | sin `.git` en `WORLD_ROOT` |
| - | ---- | -------------------------- |
| 1 | Cargar estación | **corre** (WORLD_ROOT sirve como directorio/fixture; no exige repo) |
| 2 | Regenerar estado | **corre** (bitácora es un fichero, no git; con bootstrap si falta) |
| 3 | Relanzar watcher | **corre** en clase sesión + whitelist; las señales git del pulso salen `<pendiente>` |
| 4 | Pulso del mundo | **parcial**: conteo de skills materializados corre (filesystem); worktrees/locks quedan `<pendiente>` hasta el repo |
| 5 | Conexión al juego | **independiente de git** (depende de `GAME_MCP` + registry). Corre en `jugador`; omitida en `vigia` |
| 6 | Modo debug | **corre** |
| 7 | Salida dual | **corre**; declara qué señales quedaron `<pendiente>` por pre-git |

- Regla: las fases que solo tocan el **filesystem** (1, 2, 6, 7 y las
  partes no-git de 3/4) corren siempre. Las señales **derivadas de git**
  (worktrees, locks, git toplevel) se marcan `<pendiente>` con etiqueta
  explícita, no se omiten en silencio ni se fingen en cero.
- El pulso git compuesto desde `vigilancia` (worktrees/locks/CI) también
  queda `<pendiente>` hasta que `WORLD_ROOT` sea un repo; la fase 4 lo
  anota.
- **Identidad de raíz pre-git**: el preflight fail-closed que decide si
  `WORLD_ROOT` es una raíz de trabajo legítima (LOCK pre-git esperado) vive
  en `vigilancia` → `reference/ESTACION.md` §«Preflight de identidad»
  (`LOCK identidad-raiz`, exit 23). Aquí solo se apunta; no se duplica ni
  se afloja esa doctrina.

## Layout de rutas (librería vs consumidor)

Las rutas de este contrato (`scripts/…`, `reference/…`,
`examples/fixture-tick-cero/`) son relativas a la **raíz del skill**. Esa
raíz cambia según dónde se ejecute:

| escenario | raíz del skill |
| --------- | -------------- |
| **librería** (desarrollo del paquete) | `skills/estacion-viva/` |
| **consumidor · canónico** (runner-agnóstico) | `node_modules/<PAQUETE_SKILLS>/skills/estacion-viva/` |
| **consumidor · espejo del runner** | `<runner>/skills/estacion-viva/` (p. ej. `.claude/skills/estacion-viva/`) |

- `<PAQUETE_SKILLS>` = el paquete de skills publicado en el registry del
  mundo (nombre concreto en el README de consumo). La fuente **canónica y
  runner-agnóstica** es la copia bajo `node_modules/…/skills/`.
- El espejo del runner (`.claude/skills/…` es el **namespace de Claude
  Code**; otro runner usa el suyo) es un **adaptador derivado**: se
  regenera en `postinstall` y se **ignora en git**. No se edita a mano ni
  es la fuente (DC-16).
- Ejemplo del mismo comando en los dos layouts:

```bash
# Layout librería (desde la raíz del repo del paquete):
WORLD_ROOT="$FIXTURE" GAME_MCP="mcp://fixture" OUT_DIR="$OUT" \
  bash skills/estacion-viva/scripts/reproduce-boot.sh

# Layout consumidor (canónico, runner-agnóstico):
BASE="node_modules/<PAQUETE_SKILLS>/skills/estacion-viva"
WORLD_ROOT="$FIXTURE" GAME_MCP="mcp://fixture" OUT_DIR="$OUT" \
  bash "$BASE/scripts/reproduce-boot.sh"
```

## Criterio de éxito del boot

```text
[ ] perfil resuelto (jugador|vigia); default jugador si no declarado
[ ] OUT_DIR/estado.json existe y hash-deriva de la bitácora
    (o = estado inicial de fundación si hubo bootstrap)
[ ] watcher.pid vivo durante la sesión; muerto al cerrar
[ ] pulso.txt escrito (señales git en <pendiente> si pre-git)
[ ] perfil jugador: peercard + GAME_MCP verificados; kit = registry
    perfil vigia: fase 5 omitida (declarada), no FAIL
[ ] debug.flag + debug-boot.txt
[ ] salida-po.md + salida-scrum.md (declaran perfil / bootstrap / pre-git)
[ ] ceguera del skill = 0 (scripts/comprobar-ceguera.sh)
```

## Anti-patrones

| síntoma | mitigación |
| ------- | ---------- |
| estado editado a mano además de bitácora | fase 2 sobrescribe; bitácora = única fuente |
| watcher queda huérfano tras cerrar chat | trap + clase sesión |
| ~3k FP al materializar skills | whitelist `.claude/skills/` |
| E2E vía checkout hermano del kit | registry o fixture copiada (§7 convivencia) |
| fase 2 falla mudo porque falta la bitácora | bootstrap de fundación (asiento + estado inicial) |
| estado inventado sin bitácora que lo respalde | solo tick-cero de fundación; nada más sin historia |
| `vigia` marca fase 5 como `FAIL`/`pendiente` | omisión **declarada** por perfil, no fallo |
| señales git fingidas en cero en mundo pre-git | marcar `<pendiente>` explícito hasta el repo |
