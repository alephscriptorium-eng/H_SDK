# WP-RH-05 · contrato-aceptacion — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-05 |
| fecha | 2026-08-03 |
| rama | `wp/rh-05-contrato-aceptacion` |
| commits | `8800f56` (8800f56bdf8f45f2f09122da70776f0f9e836c11) |
| eje(s) CA | IV |
| riesgo de revisión | `normal` |
| revisor distinto del worker | `no requerido` |
| estado propuesto | listo para revisión |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en
h-sdk (4 vars). Worktree `C:/S_LAB/wt/h-rh-05` en rama
`wp/rh-05-contrato-aceptacion` desde `main` tip `b8cb645`. Redacté
`plan/CONTRATO-ACEPTACION.md` con: (1) tabla superficie→owner→artefacto→
consumidor→estado anclada a RH-04; (2) reglas G/owners/H/V y prohibición de
copiar shapes; (3) ausencia = `pending_external_contract` visible en V,
bloquea gate final, párrafo explícito de cero contingencia local en H;
(4) segundo consumidor = sensor `scripts/rh-04-matriz-contratos.mjs`. Añadí
puntero ⑦ en `plan/DECISIONES.md`. No código de producto, no publish, no
BACKLOG, no merge, no push. `plan/PRACTICAS.md` ausente en el árbol (lectura
omitida; mismo hallazgo RH-02).

## Archivos tocados

- `plan/CONTRATO-ACEPTACION.md` — creado: contrato H↔G↔V↔owners
- `plan/DECISIONES.md` — modificado: decisión ⑦ apunta al contrato
- `plan/REPORTES/RH-05-contrato-aceptacion.md` — este reporte

## Evidencia

```
# preflight
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
node .claude/skills/vigilancia/scripts/verificar-identidad-raiz.mjs
→ identidad-raiz: PASS
→ world-real: c:/s_lab/h-sdk
→ git-toplevel: c:/s_lab/h-sdk
→ EXIT:0

# worktree
git worktree add -b wp/rh-05-contrato-aceptacion C:/S_LAB/wt/h-rh-05 main
→ HEAD b8cb645510f5b5712b9d23e19c5961d2c830afcd
→ gov(RH-05,06,10,11): 🔶 lote-3 …

# contraevidencia BRIEF (inspección del entregable)
# 1) superficies ROJAS RH-04 ≠ OK
rg -n 'VERDE|OK' plan/CONTRATO-ACEPTACION.md
→ VERDE solo en filas ciudad/authority-kit/rooms/player-mcp-kit
→ filas ROJAS: pending_external_contract | publicado-sin-types

# 2) párrafo contingencia H
rg -n 'contingencia local|no implementa stubs' plan/CONTRATO-ACEPTACION.md
→ sección «H no implementa contingencia local» presente

# 3) cero blocks TS/JSON Schema copiados de @zeus/*
rg -n '```(ts|typescript|json)' plan/CONTRATO-ACEPTACION.md
→ 0 matches (solo fence bash del sensor RH-04)

# sensor citado existe
test -f scripts/rh-04-matriz-contratos.mjs → SCRIPT_OK
test -f plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md → MATRIZ_OK
```

### Mapeo ROJO RH-04 → estado en contrato

| superficie RH-04 | veredicto matriz | estado en CONTRATO-ACEPTACION |
| --- | --- | --- |
| arg-domain / arg-runtime / arg-view-kit / arg-player-mcp / arg-feeds | ROJO / pending_external_contract | pending_external_contract |
| mockdatas-ciudad | ROJO / pending_external_contract | pending_external_contract |
| onfalo (candidatos) | ROJO / pending_external_contract | pending_external_contract |
| lore-hm (candidatos) | ROJO / pending_external_contract | pending_external_contract |
| provider-e (candidatos) | ROJO / pending_external_contract | pending_external_contract |
| ceremonia-evidencia-hub (candidatos) | ROJO / pending_external_contract | pending_external_contract |
| linea-kit@0.3.0 | ROJO / publicado-sin-types | publicado-sin-types |
| acta-kit@0.1.1 | ROJO / publicado-sin-types | publicado-sin-types |

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[manual]` ROJA≠OK: tabla contrato vs RH-04 — pass (ninguna ROJA como VERDE/OK)
  - `[manual]` párrafo «H no implementa contingencia local» — pass
  - `[manual]` cero fences ts/typescript/json con shapes `@zeus/*` en el contrato — pass (`rg` 0)
  - `[automatizado]` sensor RH-04 no re-ejecutado en este WP (documento; ancla a matriz ya generada) — `no aplica` re-medida; path del script citado y existente
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: no aplica (WP documental; sin runtime nuevo)
- `INSTALACION_LIMPIA`: no aplica (sin publicar ni pinnear deps; sensor RH-04 ya midió install limpio)
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: preflight identidad PASS; `test -f` script/matriz
  - Manual: contraste tabla vs RH-04; greps de contraevidencia del BRIEF
- `VEREDICTO_REVISOR`: `no requerido` (riesgo normal; `REVISOR_DISTINTO_WORKER: no`)

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `plan/CONTRATO-ACEPTACION.md`, `plan/REPORTES/RH-05-*`, `plan/DECISIONES.md`
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: solo citas de paths/versiones RH-04
- [x] Sellos con fuente; rutas citadas existentes: matriz RH-04, script sensor, REPLAN §8, plan.md step 5
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: proyección H marcada `<pendiente>` post RH-14; owner pin Ónfalo `<pendiente>`
- [x] Eje(s) aplicables evidenciado(s): IV — segundo consumidor = sensor RH-04 citado como gate
- [x] Gates ejecutados de verdad: preflight PASS; sensor no re-corrido (fuera de mutar matriz; ancla literal)
- [x] Commits convencionales: docs(RH-05)
- [x] Diff solo del alcance del WP: sí
- [x] Riesgo y contraevidencia del brief cubiertos: tres ítems CONTRAEVIDENCIA_REQUERIDA
- [x] Pruebas automatizadas separadas de evidencia manual: sí
- [ ] PRACTICAS.md: ausente en árbol — auto-revisión contra BRIEF + plantilla + ejes skill

## Hallazgos fuera de alcance

- `plan/PRACTICAS.md` no existe (hallazgo previo RH-02); candidato a WP de gobierno si el mundo lo exige.
- Re-ejecutar el sensor RH-04 no forma parte de este WP; estados tomados de la matriz ya mergeada/anclada en tip `main`.

## Dudas / bloqueos

Ningún bloqueo para revisión ordinaria. Owner de publicación del artefacto
Ónfalo queda `<pendiente>` en la tabla (candidatos E404 en RH-04).

---

## Revisión del orquestador

**✅ aceptado** 2026-08-03 · orquestador-H · merge `b132b2b` · revisión ordinaria.
