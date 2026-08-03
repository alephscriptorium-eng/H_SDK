# BRIEF · RH-05 · contrato de aceptación entre repos

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-05 · Contrato de aceptación H↔G↔V↔owners (sin copiar shapes)
Rama: wp/rh-05-contrato-aceptacion (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-05
Reporte: plan/REPORTES/RH-05-contrato-aceptacion.md
Entregable: plan/CONTRATO-ACEPTACION.md

Preflight h-sdk (4 vars): WORLD_ROOT=CANONICAL=C:/S_LAB/h-sdk
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'

Lecturas: plan.md step 5 · RH-04-MATRIZ-CONTRATOS.md · REPLAN §8 · DECISIONES · VISION
Eje: IV

Contenido mínimo del contrato:
1. Tabla superficie → owner → artefacto publicado esperado → consumidor →
   estado (VERDE | pending_external_contract | publicado-sin-types) anclado a RH-04.
2. Reglas: G publica tipos delta; Ciudad/lengua/provider/evidencia = owners;
   H solo proyección propia versionada o JSON Schema resource; V consume
   proyección H + tipos visuales delta; NUNCA copiar shapes entre repos.
3. Ausencia = pending_external_contract visible en V; bloquea gate final;
   cero contingencia local en H (no stubs que simulen contrato).
4. Cómo un segundo consumidor verifica el contrato (sensor; cite script RH-04).

ALCANCE_DIFF: plan/CONTRATO-ACEPTACION.md · plan/REPORTES/RH-05-* ·
  plan/DECISIONES.md (solo si hace falta apuntar al contrato)
PROHIBIDO: código producto; publicar; editar BACKLOG; implementar pending en H.

Identidad: git -c user.name="worker-RH-05" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: normal
MOTIVO_RIESGO: documento de contrato; no publish ni frontera de escritura runtime.
CONTRAEVIDENCIA_REQUERIDA:
  - cada superficie ROJA de RH-04 aparece como pending_external_contract o
    publicado-sin-types (no como “OK”)
  - párrafo explícito: H no implementa contingencia local
  - cero bloques de TypeScript/JSON Schema copiados de @zeus/* hacia H como “contrato”
REVISOR_DISTINTO_WORKER: no requerido

Empieza: PASS → worktree → documento → reporte → PARAR.
```
