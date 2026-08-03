# BRIEF · RH-14 · composition root Bun/TS alcanzable

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-14 · packages/app-prueba-hm composition root + demo Bun/TS
Rama: wp/rh-14-composition-root (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-14
Reporte: plan/REPORTES/RH-14-composition-root.md

Preflight h-sdk PASS (4 vars).

Lecturas: plan.md step 14 · CONTRATO-ACEPTACION · packages/core · packages/edge-zeus
Ejes: I, II

Trabajo:
1. Crear packages/app-prueba-hm (TS/Bun) con entry p.ej. src/main.ts que:
   - arranca Ciudad como entrada (puerto RH-13);
   - abre sesión delta SÓLO tras reach/wake confirmado;
   - asienta M (connected+lastStateTs);
   - expone resources MCP versionados: estado, escena, evidencia (para V);
   - cualquier pending_external queda visible (no finge complete).
2. Cambiar scripts raíz: typecheck incluye app; `demo` (o equivalente) apunta a
   Bun/TS del composition root — NO a packages/game-prueba-hm/server.mjs.
3. Retirar game-prueba-hm del producto alcanzable (sacar de workspaces/scripts
   demo). Assets: NO borrar aún (RH-10 pack existe; plan: eliminar assets solo
   tras Ónfalo publicado/verificado — dejar paquete fuera del reachable path).
4. Test de reachability: el entrypoint importa core + edges requeridos
   (assertion estática o bun test).
5. bun typecheck + test reachability verdes.

ALCANCE_DIFF: packages/app-prueba-hm/** · package.json raíz · bun.lock ·
  tsconfig* · plan/REPORTES/RH-14-* · opcional ajuste workspaces
PROHIBIDO: vertical E2E real (RH-15); borrar assets onfalo de game aún;
  editar BACKLOG; sibling g-sdk permanente.

Identidad: git -c user.name="worker-RH-14" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: cambio de entrypoint de producto; falso reachability (importa
  sin cablear máquina/edges) autorizaría demo mentirosa.
CONTRAEVIDENCIA_REQUERIDA:
  - package.json scripts.demo (u homólogo) no contiene game-prueba-hm/server.mjs
  - test reachability falla si se quita import de core o edge clave (o equivalente)
  - grep app: no modo replay silencioso que declare complete
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → app + scripts → tests → reporte → PARAR.
```
