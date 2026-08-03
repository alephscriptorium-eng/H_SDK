# BRIEF · RH-16 · servicio experiencia H en V (handoff carril V)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md
  · carril V (v-sdk). Este BRIEF se emite desde h-sdk; la obra vive en v-sdk.

WP: RH-16 · Servicio experiencia H sobre MinimalMcpClient/ResourceProjectionService
Rama: wp/rh-16-experiencia-h (desde v-sdk main)
Worktree: C:/S_LAB/wt/v-rh-16 (opcional; main limpio OK)
Reporte: v-sdk plan/ o h-sdk plan/REPORTES/RH-16-servicio-experiencia-v.md
  (si V no tiene plan/, entregar reporte en h-sdk REPORTES citando tip V)

Handoff canónico (leer antes de mutar):
  h-sdk/plan/REPORTES/HANDOFF-RH-16-carril-V.md
  C:/S_META/HSDK/HANDOFF-RH-16-CARRIL-V.md (puntero)

Preflight v-sdk (obligatorio antes de efectos; calibración idéntica):
  WORLD_ROOT=C:/S_LAB/v-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/v-sdk
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]'
  DOWNSTREAM_PATTERNS='["S/*"]'
→ solo identidad-raiz: PASS habilita obra. LOCK → cero efectos; pedir otro clone.

Lecturas:
  - plan.md step 16 (h-sdk) · CONTRATO-ACEPTACION §2–3 · HANDOFF-RH-16
  - v-sdk: src/mcp/client.ts · src/resources/ResourceProjectionService.ts
  - H surface: packages/app-prueba-hm/src/resources.ts (URIs + shapes H)
Ejes: I, IV

Trabajo (solo v-sdk):
1. Servicio experiencia H: descubrir server H por catálogo MCP; listar/leer
   resources; validar resourceVersion/shape publicados (ver handoff).
2. Modelar estados pending | connected | error | complete sin hardcode de
   escena/actores; pending_external_contract debe ser visible y distinto.
3. Tests de parseo/estados + fixtures MCP (pueden arrancar sin H vivo).
4. Integración real contra H tip 9bfd7ff+ cuando haya transport MCP de producto
   (hoy AlmacenResources es in-process; ver gaps en handoff).

ALCANCE_DIFF: v-sdk src/** (servicio + tests) · package metadata V ·
  reportes citados. Cero edits a h-sdk/g-sdk salvo reporte de aceptación
  si el orquestador H lo pide.
PROHIBIDO: import sibling h-sdk; IPlay/ICompany/Teatro como costura;
  inventar actors/escenas; declarar complete con resources stale;
  implementar provider E / línea / evidencia en V o H.

Anclas H (consumo, no copia de shapes Zeus):
  URI_ESTADO    = h-sdk://experiencia/estado
  URI_ESCENA    = h-sdk://experiencia/escena
  URI_EVIDENCIA = h-sdk://experiencia/evidencia
  RESOURCE_VERSION = 0.1.0
  tip H main: 9bfd7ff · tip G main: 6b302b7 (no tocar checkpoint 35cbded)

Identidad: git -c user.name="worker-RH-16" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: UI/proyección que finge complete o hardcodea Teatro autorizaría
  demo mentirosa ante el gate final.
CONTRAEVIDENCIA_REQUERIDA:
  - grep: cero import path a ../h-sdk o file: h-sdk
  - estados: pending_external distinto de connected/complete
  - fixtures sin success con payload stale / complete inventado
  - hostil-omite: resource omitido / version ausente → no connected
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS v-sdk → leer HANDOFF → servicio+tests → reporte → PARAR.
  No esperes investigación z-sdk; gaps E/línea/evidencia ya son pending visibles.
```
