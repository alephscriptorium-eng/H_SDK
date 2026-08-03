# BRIEF · RH-11 · owners externos (elevación / pending)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-11 · LORE-HM · provider E · evidencia/materialización — owners (no H)
Rama: wp/rh-11-owners-externos (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-11
Reporte: plan/REPORTES/RH-11-owners-externos.md
Entregable: plan/REPORTES/RH-11-GAPS-OWNERS.md (+ notas elevación)

Preflight h-sdk PASS (4 vars).

Lecturas: plan.md step 11 · RH-04 matriz · DECISIONES ① · eje V mediación
Ejes: IV, V

Trabajo (lane ext — NO implementar en H):
1. Para cada superficie (candidato LORE-HM, provider E, ceremonia/evidencia,
   materialización/linea-kit types+API): estado registry actual (re-medir o citar
   RH-04 con re-chequeo puntual) → pending_external_contract u OK tipado.
2. Si linea-kit no expone operación/tipos: elevar gap al owner (nota en
   S_META o plan/REPORTES con destinatario; sin inventar respuesta del owner).
3. Declarar explícitamente: H no implementa line.materialize, provider, digest,
   cremallera, notaría ni ledger sustituto.
4. Mediación transparente (eje V): el texto no nombra capas de marco; solo owners
   y paquetes.

ALCANCE_DIFF: plan/REPORTES/RH-11-* · C:/S_META/HSDK/ (nota elevación opcional)
PROHIBIDO: código en packages/* de H que “rellene” el gap; publish falso; BACKLOG.

Identidad: git -c user.name="worker-RH-11" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: normal
MOTIVO_RIESGO: elevación documental; no mutación de producto ni publish.
CONTRAEVIDENCIA_REQUERIDA:
  - grep packages/ en el diff del WP → 0 (solo plan/S_META)
  - cada superficie con pending_external_contract o evidencia tipada literal
  - frase de no-implementación local presente
REVISOR_DISTINTO_WORKER: no requerido

Empieza: PASS → worktree → gaps → elevaciones → reporte → PARAR.
```
