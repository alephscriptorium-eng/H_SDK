# BRIEF · RH-15 · vertical mínimo real (fail-closed en externos)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-15 · Vertical minimo real hasta pending_external visible
Rama: wp/rh-15-vertical (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-15 (opcional; main limpio OK)
Reporte: plan/REPORTES/RH-15-vertical-minimo.md

Preflight h-sdk PASS (4 vars). G PASS (4 vars).
Calibración:
  WORLD_ROOT=<root> CANONICAL_WORLD_ROOT=<root>
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]'
  DOWNSTREAM_PATTERNS='["S/*"]'

Lecturas: plan.md step 15 · CONTRATO-ACEPTACION · composition RH-14 ·
  packs registry @0.1.0 (+ arg-runtime sessionId si hace falta bump)
Ejes: IV, hostil-omite

Trabajo:
1. Pinnear en H (registry, sin siblings): @zeus/arg-domain, arg-runtime,
   arg-player-mcp, onfalo-fixture, mockdatas-ciudad (versiones exactas
   publicadas).
2. G (si AuthorityHandle sigue sin sessionId|id): bump @zeus/arg-runtime
   para devolver sessionId propio del runtime al arrancar; publicar Actions;
   pin en H. No inventar sesionId en H desde stateId/ledgerId.
3. deps vertical: abridor real (startArgRuntime + resolveFeeds synthetic +
   createClient/connectAndJoin inyectados sin room viva); factoryM =
   createArgPlayerMcp (bridge con connected+lastStateTs, connect:false OK);
   Ciudad con intents wire + observables state/ledger; escena Lore inyectada
   (fixture aceptación H o delta tipada — no sibling g-sdk).
4. Tras delta_running: seleccionar pieza sellada vía @zeus/onfalo-fixture
   (verifySeal/loadOnfaloFixture) → onfalo_seleccionado; luego E/línea/
   evidencia fail-closed pending_external visible. Cero complete. Cero replay.
5. Tests: camino hasta onfalo_selected + pending E; sin factory/abridor
   detiene; typecheck + test:reachability verdes; demo main usa deps vertical.

ALCANCE_DIFF (H): packages/app-prueba-hm/** · packages/edge-zeus/** (mínimo) ·
  package.json · bun.lock · plan/REPORTES/RH-15-* · plan/BACKLOG.md (orq)
ALCANCE_DIFF (G, si bump): packages/delta/arg-runtime/** · package metadata ·
  workflow publish si hace falta
PROHIBIDO: implementar provider E / line.materialize / evidencia HUB en H;
  sibling file:; declarar complete; inventar sesionId.

Identidad H: git -c user.name="worker-RH-15" -c user.email="alephscriptorium@gmail.com"
Identidad G: git -c user.name="worker-RH-15" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: falso vertical (mocks que fingen complete o inventan sessionId)
  autorizaría demo mentirosa.
CONTRAEVIDENCIA_REQUERIDA:
  - grep: cero complete en camino vertical; pending_external en resources
  - abridor/factory resuelven módulos @zeus/* del registry (no file: g-sdk)
  - onfalo: verifySeal allSealed o fallo explícito
  - hostil-omite sessionId sigue rojo si runtime omite
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → bump G si hace falta → pin H → deps+composition → tests →
  reporte → PARAR.
```
