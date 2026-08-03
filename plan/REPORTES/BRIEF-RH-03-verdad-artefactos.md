# BRIEF · RH-03 · verdad de artefactos (anti claims falsos)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-03 · Corregir claims falsos + tabla artefacto×cinco flags
Rama: wp/rh-03-verdad-artefactos  (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-03
Reporte: plan/REPORTES/RH-03-verdad-artefactos.md

Preflight h-sdk:
  WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'

Lecturas:
- plan.md step 3 · BACKLOG RH-03 · VISION · DECISIONES
- C:/S_META/HSDK/DOSSIER-FUNDACIONAL-H-SDK.md
- C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md
- design/RECAP-SPEC-DEMO.md (si existe)
- PRACTICAS: ausente en h; usar criterio de evidencia de g-sdk/plan/PRACTICAS.md

Eje CA: III

Trabajo:
1. Buscar afirmaciones falsas o engañosas de “cero violaciones”, “listo”,
   “product-reachable” / equivalentes de producto cerrado en dossier H, plan/,
   RECAP y S_META/HSDK (no en skills). Corregir o tachar con evidencia.
2. Publicar tabla por artefacto con columnas:
   artefacto | committed | reachable | observed | clean-room | owner-correct
   Valores: sí / no / ⏳ sin verificar — NUNCA inventar; anclar a comando o path.
3. Regla del plan: solo cinco positivos permiten declarar producto — déjala
   explícita junto a la tabla; hoy el producto NO se declara.
4. Preferir escribir/actualizar la tabla en
   C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md y, si hace falta espejo corto,
   plan/REPORTES/ o design/. Coordinar con RH-02 si ambos tocan el acta:
   sección distinta («§ verdad de artefactos») para reducir colisión.

ALCANCE_DIFF:
  - C:/S_META/HSDK/*.md (dossier + REPLAN)
  - h-sdk: design/**, plan/VISION.md, plan/DECISIONES.md, plan/REPORTES/RH-03-*,
    design/RECAP-SPEC-DEMO.md
PROHIBIDO: BACKLOG estados; código de producto; g-sdk/v-sdk; declarar demo lista.

Identidad: git -c user.name="worker-RH-03" -c user.email="alephscriptorium@gmail.com"

RIESGO_REVISION: normal
MOTIVO_RIESGO: corrección documental/auditoría; sin publish ni frontera de confianza.
CONTRAEVIDENCIA_REQUERIDA:
  - grep residual de claims “product-reachable”/“cero violaciones” como afirmación
    vigente (no tachada) en ALCANCE → 0 o solo en contexto negativo/histórico
  - tabla con las cinco columnas presente y sin fila “sí”×5 sin ancla
  - cada “sí” cita evidencia (path/comando/hash)
REVISOR_DISTINTO_WORKER: no requerido

Empieza: PASS → worktree → auditar → corregir → tabla → reporte → PARAR (sin merge).
```
