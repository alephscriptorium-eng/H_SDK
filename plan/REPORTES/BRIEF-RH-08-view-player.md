# BRIEF · RH-08 · arg-view-kit + arg-player-mcp tipados

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-08 · Extraer view-kit browser-safe + factory player-mcp tipada
Rama: wp/rh-08-view-player (desde g-sdk wp/rh-ejecucion @ 9293b3e…)
Worktree: C:/S_LAB/wt/g-rh-08
Reporte: g-sdk/plan/REPORTES/RH-08-view-player.md

Preflight G PASS. No tocar checkpoint 35cbded.

Lecturas: plan.md step 8 · arg-console assets · arg-player-mcp
Eje: I

Trabajo:
1. Extraer @zeus/arg-view-kit: browser-safe, tipado, grifos/ríos/mar/gotas/cantera;
   SIN server, rooms, ni contenido Lore.
2. Convertir @zeus/arg-player-mcp en factory pública/configurable tipada sobre
   @zeus/player-mcp-kit; escena+actor inyectados; resources estándar.
3. Apps arg-console / arg-demos permanecen private.
4. CA: npm pack view-kit + player-mcp; install limpio tipado; pending_registry_publish
   si no hay auth.

ALCANCE_DIFF: packages/delta/arg-view-kit/** (nuevo) · packages/delta/arg-player-mcp/** ·
  arg-console solo extracción · plan/REPORTES/RH-08-*
PROHIBIDO: Lore en view-kit; sibling H; checkpoint; BACKLOG h.

Identidad: git -c user.name="worker-RH-08" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: pack/types + frontera browser-safe (Lore/server no deben colarse).
CONTRAEVIDENCIA_REQUERIDA:
  - grep tarball view-kit sin lore/document-machine/rooms/server
  - install tarball temp sin sibling H
  - types en disco para VERDE de probe (mismo criterio RH-04)
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → extract → pack/probe → reporte → PARAR.
```
