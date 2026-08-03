# ESTACIÓN · calibración del mundo h-sdk (mundo H · vendor del scriptorium)

**La estación se activa desde aquí.** El método vive en
`@alephscript/skills-scriptorium`; **esta calibración NO va en el skill**.
h-sdk simula un **vendor externo** que usa el scriptorium: consume por
registry, con `C:\S` como downstream y la obra en `C:\S_LAB`.

## Params

| param | valor |
| ----- | ----- |
| `MUNDO_RAIZ` / `WORLD_ROOT` | `C:\S_LAB\h-sdk` (checkout principal) |
| `CANONICAL_WORLD_ROOT` | = `WORLD_ROOT` (rutas con `/` en preflight) |
| `WORKTREE_BASE` | `C:\S_LAB\wt` (salas `h-<wp>`, convención viva) |
| `OUT_DIR` | `C:\S_LAB\vigilancia\h` — **siempre fuera del WORLD_ROOT** (lección LORE-HM: su evidencia quedó dentro y violó el gobierno) |
| `INTERVAL` | `45` (default del watcher) |
| `DOWNSTREAM_PATTERNS` | `['C:/S/**']` — el hub es downstream; el patrón **jamás** cubre el propio `WORLD_ROOT` (LOCK del preflight) |
| `READ_ONLY_ROOTS` | `C:/S` · hermanos de `C:/S_LAB` · OASIS (solo cita genealógica) |
| `SIBLING_ROOT` | `C:\S_LAB` |
| `GAME_MCP` | `<pendiente>` hasta E4 (rooms de `@zeus` por registry) |

## Espejo de skills

| dato | valor |
| ---- | ----- |
| paquete | `@alephscript/skills-scriptorium@0.11.0` |
| registry | `https://npm.scriptorium.escrivivir.co` (`.npmrc` con scopes `@alephscript` y `@zeus`) |
| comando | `npm run skills:sync` → `alephscript-skills-sync --runtime claude` |
| destino | `.claude/skills/` (espejo auditable **commiteado**) |

## Handoffs por skill — el punto de vista del vendor h

Teóricamente todos los skills se usan. Para cada uno: qué levanta en h,
calibración, primer acto y cerco.

### 1 · `vigilancia` — la estación del carril h

- **Qué levanta**: vigía read-only del mundo h — gates post-merge de las olas
  H, re-verificación de CAs de facto, anomalías al custodio, salida dual
  PO/scrum (addenda dos caras + prueba de ceguera).
- **Calibración**: los params de arriba; crear `C:\S_LAB\vigilancia\h` al
  primer arranque (mismo patrón que `a,e,g,lib,o,s,v,z`).
- **Primer acto**: preflight `verificar-identidad-raiz.mjs` con
  `WORLD_ROOT=CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk` → `PASS` antecede todo
  efecto.
- **Cerco**: vigía silencioso — no habla con workers, solo con el custodio;
  el watcher **no se arranca** hasta que haya obra despachada.

### 2 · `estacion-viva` — boot reproducible

- **Qué levanta**: arranque de estación desde cero con bitácora como fuente
  única, watcher de sesión con whitelist (los skills materializados bajo
  `.claude/skills/` no disparan falsos positivos), pulso, y conexión al juego
  por `GAME_MCP` con peercard firmada y **kits del registry, no checkout
  hermano** — que es literalmente nuestra postura de vendor.
- **Calibración**: `WORLD_ROOT` + `OUT_DIR` de arriba; `GAME_MCP=<pendiente>`.
- **Primer acto**: `ONCE=1 bash .claude/skills/estacion-viva/scripts/watcher-sesion.sh`
  con `OUT_DIR=C:/S_LAB/vigilancia/h` para el primer pulso; iniciar bitácora.
- **Cerco**: una fuente de estado (la bitácora); regenerar, no recordar.

### 3 · `mesa-sincronia` — el asiento de h en la mesa

> ✅ **Gap resuelto en origen (2026-08-03)**: L cortó el release 0.12.0
> (tag `v0.12.0`, workflow de publicación en verde) con `mesa-sincronia`
> incluida; este mundo consume 0.12.0 y el espejo queda **8/8**. El gate de
> changelog de L también destapó las filas WP-31/32/34 sin reflejar, ya
> saldadas en el CHANGELOG con su estado real.

- **Qué levanta**: identidad y firma del carril h, notas con plantilla,
  DRAFT/`BLOQUEA:`, timbre append-only, buzón-puntero — la voz de h hacia el
  hub y el custodio.
- **Calibración**: `CARRIL=h` · `HUB=C:\S\scriptorium\sincronia` ·
  `WORLD_ROOT(h)=C:\S_LAB\h-sdk` · buzón local `sincronia/` (crear al primer
  uso).
- **Primer acto**: nota de presentación del carril h cuando el custodio abra
  el asiento en la mesa.
- **Cerco**: sin tick validado del custodio no se procesa nada; identidad
  firmada siempre (aborto por nombre cruzado).

### 4 · `holarquia` — la garantía de que h NO es holón

- **Qué levanta**: registro de **anclas** por ruta absoluta/commit
  (genealogía NETWORK-ENGINE, lengua sellada de s-sdk, `mapa.json` del hub,
  candidato de lengua cuando exista) bajo el acuerdo de agente: el repo gana
  a la memoria, `⏳ sin verificar` donde falte evidencia, notaría
  describe-no-prescribe.
- **Calibración**: `MUNDO_RAIZ=C:\S_LAB\h-sdk` · `REGISTRO_HOLONES=∅` (la
  cadena vive en s-sdk y tiene siete filas) · `ANCLAS=ADR/`.
- **Primer acto**: `comprobar-ceguera.sh` sobre las salidas públicas del
  juego (el vocabulario del marco no viaja en outputs de producto).
- **Cerco**: crecimiento solo por junturas verificables; **jamás declarar un
  holón 08** (gate `verificar-sellado-l05.mjs` de s-sdk vigila la metodología).

### 5 · `swarm-orquestacion` — cuando h despache obra (H1+)

- **Qué levanta**: 1 WP = 1 worker background = 1 rama `wp/*` = 1 sala
  `wt/h-<wp>`; ciclo obra → contrarrevisión adversarial (reintenta el
  ataque) → push → **esperar CI** → merge → gate → acta → poda.
- **Calibración**: backlog `plan/BACKLOG.md`; briefs con blancos numerados y
  «qué intentaste y NO conseguiste romper» obligatorio.
- **Primer acto**: proyectar las olas H0–H3 a fichas despachables (hecho en
  BACKLOG; despacho espera GO).
- **Cerco**: workers nunca empujan; `push --force` prohibido; WPs sobre el
  mismo gate en serie; scratchpad prefijado por WP **y por rol**.

### 6 · `operador-rooms` — el contrato de rooms de la demo (E4)

- **Qué levanta**: operación de rooms con evidencia trazable: peercard
  (`id`,`sig`,`issuedAt`,`features`) fail-closed, ACL deny-by-default
  (lo no listado se deniega), salud `OK/DEGRADED/FAIL/<pendiente>` — una room
  sin señal trazada **nunca** se declara `OK`.
- **Calibración**: `ROOM_DIR=<.runs de la demo>` · `PEERCARD/ACL/SALUD` según
  `@zeus/rooms` al conectar.
- **Primer acto**: registrar la room de replay de la demo con salud
  `<pendiente>` hasta señal real.
- **Cerco**: modo `replay` ≠ modo `conectado`, ambos declarados; jamás
  fallback silencioso (ADR 0002).

### 7 · `site-web` — la piel pública del mundo h

- **Qué levanta**: el portal FOSS de la demo (VitePress + Pages + piel
  declarada) cuando haya qué contar.
- **Calibración**: cantera = `design/` + evidencia de la demo.
- **Primer acto**: `<pendiente>` hasta H3 — no se publica piel antes de
  producto.
- **Cerco**: copy bajo protocolo de subsunción (la tecnología es invisible;
  sin nombres del marco).

### 8 · `intake-prueba-de-dos` — de brief a skill sin inventar

- **Qué levanta**: conversión de intakes de la demo (guion, adapters,
  experimentos) en skills/paquetes consumibles: separar definido de
  `<pendiente>`, `reference/CONTRATO.md`, ejemplo sintético.
- **Calibración**: fixtures propias en `examples/`, sin datos reales.
- **Primer acto**: intake del guion «Prueba-H-M» al despachar H2.
- **Cerco**: lo que el intake no fija **no se rellena** — `<pendiente>` hasta
  que haya fuente.
