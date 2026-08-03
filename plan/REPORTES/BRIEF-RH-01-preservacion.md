# BRIEF · RH-01 · preservación dual H+G

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-01 · Preservación checkpoint H+G (fundación no alcanzable / adaptación forense)
Rama: EXCEPCIÓN al patrón wp/* — commits checkpoint EN las ramas actuales:
  - h-sdk: main
  - g-sdk: wp/g-prueba-hm-adaptacion
  NO crear rama wp/RH-01-*. NO merge. NO push salvo que el brief lo pida (no lo pide).
Worktree: ninguno (un solo worker; operar in-place en ambos checkouts)
Reporte: plan/REPORTES/RH-01-preservacion.md  (en h-sdk, rama main, tras o con el checkpoint)

WORLD_ROOTS del orquestador: C:/S_LAB/h-sdk · C:/S_LAB/g-sdk
Preflight por cada efecto en un root (obligatorio, las cuatro entradas):
  WORLD_ROOT=<root tocado>
  CANONICAL_WORLD_ROOT=<mismo>
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]'
  DOWNSTREAM_PATTERNS='["S/*"]'
  → solo identidad-raiz: PASS habilita efectos en ese root

Lecturas:
- plan/BACKLOG.md · fila RH-01
- plan.md (fuente narrativa step 1)
- plan/VISION.md · plan/DECISIONES.md
- plan/PRACTICAS.md → ausente en h-sdk; aplicar PRACTICAS de g-sdk/plan/PRACTICAS.md
  solo como criterio de evidencia/sellos; no ejecutar obra G-F2
- Eje CA: III (auditoría / gate dedup de claims vivos — aquí: no meter secretos/generated)

Notas del orquestador:
- ALCANCE_DIFF =
    h-sdk: working tree untracked/modified (fundación TS/Bun, plan.md, config) EXCEPTO
           secretos, outputs, node_modules, locks generados si el criterio los excluye
    g-sdk: working tree unstaged de la adaptación delta (misma exclusión)
    C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md = única escritura fuera de repos
- MUNDO_RAIZ = el root del commit en curso (h o g)
- Rotular mensajes de commit con claridad forense:
    H: checkpoint fundación TypeScript/Bun NO alcanzable / NO validada como producto
    G: checkpoint adaptación Prueba-H-M forense NO integrable
- Checks: SOLO read-only de línea base (typecheck/test si ya existen y son seguros).
  Prohibido “arreglar” la demo o reescribir superficie.
- plan/BACKLOG.md y este BRIEF ya están en gobierno 🔶: incluirlos en el checkpoint H
  si siguen modificados; no revertir el 🔶.
- Tras commits: git status limpio en AMBOS repos.
- No tocás v-sdk. No creás ramas de ejecución (RH-02).

RIESGO_REVISION: independiente
MOTIVO_RIESGO: commits en main (H) y rama de obra (G) + exclusión de secretos;
  falso negativo (secret/generated colado) o commit incompleto es irreversible
  en la red de recuperación.
CONTRAEVIDENCIA_REQUERIDA:
  - buscar secretos típicos (.env, tokens, credenciales) en el diff a commitear → 0
  - confirmar que node_modules / artefactos build no entran
  - post-commit: git status --porcelain vacío en h y g
  - acta REPLAN cita hash, padre y diff --stat literales (no memoria)
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS identidad en h → auditar H → checkpoint H → PASS identidad en g →
auditar G → checkpoint G → escribir acta REPLAN → reporte → PARAR (sin merge, sin ✅).
```
