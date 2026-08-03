# BRIEF · RH-04 · matriz ejecutable de contratos

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-04 · Matriz paquete×gate desde install limpio H
Rama: wp/rh-04-matriz-contratos  (desde h-sdk main HEAD)
Worktree: C:/S_LAB/wt/h-rh-04
Reporte: plan/REPORTES/RH-04-matriz-contratos.md
Matriz (entregable): plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
  (puede reusar/extender método de plan/REPORTES/E1-MATRIZ-TYPES-ZEUS.md; no copiar veredictos viejos sin re-medir)

Preflight:
  WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'

Lecturas: BACKLOG RH-04 · plan.md step 4 · REPLAN §8 · E1 matriz (método) · VISION
Ejes: III, IV

Superficies a medir (fila cada una; verdes/rojos OBSERVADOS):
  @zeus/ciudad · @zeus/authority-kit · @zeus/rooms · @zeus/player-mcp-kit
  delta: arg-domain · arg-runtime (si existe publicado) · arg-view-kit (si existe)
    · arg-player-mcp · arg-feeds (si aplica)
  @zeus/mockdatas-ciudad · artefacto Ónfalo · candidato LORE-HM · provider E
  línea/materialización (@zeus/linea-kit@0.3.0 u hallado) · ceremonia/evidencia HUB
Columnas mínimas por fila:
  paquete | version_exacta | export_map | d.ts | runtime_import | owner | veredicto
  | evidencia (comando literal) | notas (paths siblings / pending_external)

Reglas duras:
- Medir desde install limpio (temp dir o rm+install frozen); prohibido fiarse de
  paths a C:/S_LAB/* siblings, file:, link:, workspace: externos, .d.ts ambientales.
- Re-verificar linea-kit types aunque E1 ya lo mirara.
- Estado inicial ESPERADO (hipótesis a confirmar o refutar, no a forzar):
  verdes: ciudad, rooms, player-mcp-kit
  rojos hasta publicación: delta público tipado, Ónfalo publicado, lengua/provider,
  evidencia canónica
- Si un paquete no existe en registry: veredicto ROJO / pending_external_contract
  con evidencia npm view (exit ≠ 0), no inventar versión.
- Eje IV: la matriz debe ser usable como sensor por un segundo consumidor
  (documenta cómo re-ejecutar; idealmente script bajo scripts/ o plan/REPORTES/).

ALCANCE_DIFF:
  - plan/REPORTES/RH-04-*
  - opcional scripts/ verificador de matriz (solo lectura de registry/install temp)
  - package.json / bun.lock SOLO si el install limpio exige pin declarado y queda
    justificado en reporte (preferir no mutar producto)
PROHIBIDO: implementar adapters, publicar G, editar BACKLOG, declarar producto,
  “arreglar” edges, usar sibling checkouts como resolución.

Identidad: git -c user.name="worker-RH-04" -c user.email="alephscriptorium@gmail.com"

RIESGO_REVISION: independiente
MOTIVO_RIESGO: gate de contratos con riesgo de falso verde (paquete marcado OK
  sin types/export/runtime reales) que autorizaría obra H/G posterior.
CONTRAEVIDENCIA_REQUERIDA:
  - al menos 1 paquete esperado rojo permanece rojo con evidencia npm/tsc
  - 0 filas VERDE sin comando literal de d.ts o runtime import
  - grep de package.json/tsconfig en el alcance por paths|file:|link: a S_LAB → 0
    (o documentado como hallazgo ROJO, no silenciado)
  - linea-kit: evidencia explícita de types ausentes/presentes en manifest instalado
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → install limpio / probes → matriz → script opcional →
reporte → PARAR (sin merge, sin ✅).
```
