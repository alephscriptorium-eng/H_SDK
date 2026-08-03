# BRIEF · RH-12 · packages/core máquina de experiencia H

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-12 · Rehacer core: máquina de estados + puertos H (sin shapes Zeus/HUB)
Rama: wp/rh-12-core-maquina (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-12
Reporte: plan/REPORTES/RH-12-core-maquina.md

Preflight h-sdk PASS (4 vars).

Lecturas: plan.md step 12 · plan/CONTRATO-ACEPTACION.md · packages/core/** · ejes II
Eje: II

Estados (literales):
  idle → ciudad_connected → lore_reached → barrio_awake → delta_running →
  onfalo_selected → analyzed → line_materialized → evidence_verified → complete
+ errores/pending explícitos (no silent fallthrough).

Puertos solo caso de uso H: entrada Ciudad confirmada, sesión delta, análisis E,
materialización de línea, evidencia canónica, publicación de proyección.
Eliminar EntradaCadena, PuertoActa y shapes externos paralelos no propios.
core sin import @zeus/* ni Node IO.

CA:
- bun/tsc typecheck del package core verde (si bun-types sigue corrupto: reinstalar
  types en worktree o documentar fix de install; no dejar FAIL silencioso)
- tests unitarios de transiciones
- grep packages/core sin EntradaCadena|PuertoActa

ALCANCE_DIFF: packages/core/** · tests core · plan/REPORTES/RH-12-*
PROHIBIDO: reescribir edge-zeus completo (RH-13); composition root (RH-14);
  implementar provider/linea; editar BACKLOG.

Identidad: git -c user.name="worker-RH-12" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: demolición de API (EntradaCadena/PuertoActa) con destino canónico
  de puertos nuevos; falso “typecheck verde” ocultaría shapes paralelos.
CONTRAEVIDENCIA_REQUERIDA:
  - grep EntradaCadena|PuertoActa en packages/core → 0
  - intento de transición ilegal → error/pending explícito (test)
  - core package.json/tsconfig sin dependency @zeus/*
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → rehacer core → tests → reporte → PARAR.
```
