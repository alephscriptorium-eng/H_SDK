# BRIEF · RH-07 · @zeus/arg-domain público tipado + @zeus/arg-runtime

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-07 · Promover arg-domain + extraer arg-runtime públicos con .d.ts
Rama: wp/rh-07-arg-domain-runtime (desde g-sdk wp/rh-ejecucion @ 9293b3e…)
Worktree: C:/S_LAB/wt/g-rh-07
Reporte: g-sdk/plan/REPORTES/RH-07-arg-domain-runtime.md

Preflight G PASS (4 vars). No tocar checkpoint wp/g-prueba-hm-adaptacion (35cbded).

Lecturas: plan.md step 7 · RH-06 entrega · arg-demos/apps/authority/index.mjs
Eje: I

Trabajo:
1. @zeus/arg-domain: público (private:false), exports + .d.ts para escena, estado,
   intents, feeds, snapshots. ciudad-v0 sigue fuera del export de producción.
2. Extraer @zeus/arg-runtime (paquete nuevo) desde authority demo: compone
   @zeus/authority-kit con escena/feed/gamemap inyectados; dueño de wire dual,
   tick, snapshot, shutdown. Sin copiar launcher rooms a H.
3. CA: npm pack ambos; install limpio en temp SIN sibling H; import + types
   resueltos (tsc o probe). Si no hay auth registry: pack+install tarball OK +
   pending_registry_publish explícito (no fingir VERDE registry).

ALCANCE_DIFF: packages/delta/arg-domain/** · packages/delta/arg-runtime/** (nuevo) ·
  arg-demos solo si cablea al runtime · plan/REPORTES/RH-07-*
PROHIBIDO: publish falso; checkpoint; BACKLOG h; document-machine (RH-09).

Identidad: git -c user.name="worker-RH-07" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: pack/types de contrato consumible; falso verde de .d.ts autorizaría H.
CONTRAEVIDENCIA_REQUERIDA:
  - mutante/ausencia: types declarados pero .d.ts faltante → no PASS del probe
  - install tarball temp sin C:/S_LAB/h-sdk en resolve
  - grep tarball arg-domain sin export de ciudad-v0 como main
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree desde wp/rh-ejecucion → packs → probes → reporte → PARAR.
```
