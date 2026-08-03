# WP-RH-03 · verdad-artefactos — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-03 |
| fecha | 2026-08-03 |
| rama | `wp/rh-03-verdad-artefactos` |
| commits | `d844138296b78ca67a500df42111c262efa6627c` |
| eje(s) CA | III |
| riesgo de revisión | `normal` |
| revisor distinto del worker | `no requerido` |
| estado propuesto | listo para revisión |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en h-sdk. Worktree `C:/S_LAB/wt/h-rh-03` en rama `wp/rh-03-verdad-artefactos` desde `main`. Audité dossier H, `plan/VISION.md`, `plan/DECISIONES.md`, `design/RECAP*`, `design/ARQUITECTURA-DEMO*`, `S_META/HSDK/REPLAN` y greps de «cero violaciones» / «product-reachable» / equivalentes. No había afirmaciones vigentes literales de «cero violaciones» ni «product-reachable» positivo; sí claims engañosos («lo certificado», «ahora encarnado», «boceto TERMINADO» leíble como demo lista, título «El Descenso»). Los taché/aclaré con evidencia. Añadí **§8 verdad de artefactos** en `REPLAN-PRUEBA-HM-REACHABILITY.md` (sección distinta de §7 RH-02, ya presente), con tabla artefacto×cinco flags, regla de cinco `sí` y anti-claims. **Hoy no se declara producto.** No BACKLOG, no merge, no push, no código de producto.

## Archivos tocados

- `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` — añadida §8 (tabla + regla + anti-claims RH-03); §7 RH-02 intacta
- `C:/S_META/HSDK/DOSSIER-FUNDACIONAL-H-SDK.md` — banner RH-03; §0 retitulado; «ahora encarnado» tachado
- `plan/VISION.md` — espejo de correcciones del dossier
- `plan/DECISIONES.md` — decisión ⑥ regla de cinco flags
- `design/RECAP-SPEC-DEMO.md` — banner + aclaración TERMINADO(boceto) ≠ producto
- `design/ARQUITECTURA-DEMO.md` — tachado «El Descenso»; banner anti product-claim
- `design/ARQUITECTURA-DEMO-R2.md` — «lista es producto» desambiguada
- `plan/REPORTES/RH-03-verdad-artefactos.md` — este reporte

## Evidencia

```
# preflight
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
→ identidad-raiz: PASS / world-real: c:/s_lab/h-sdk / git-toplevel: c:/s_lab/h-sdk

# worktree
git worktree add -b wp/rh-03-verdad-artefactos C:/S_LAB/wt/h-rh-03 main
→ HEAD a3f06f3 (base)

# anclas tabla (muestra)
package.json scripts.demo → node packages/game-prueba-hm/server.mjs
test -f packages/app-prueba-hm/src/main.ts → ABSENT
git -C g-sdk rev-parse HEAD → 35cbded673fdb557af4fe4864d8e514f7acf9f1c
npm view @zeus/ciudad version types → 0.1.1 / ./types/contract.d.ts
npm view @zeus/rooms version → 0.1.2
npm view @zeus/player-mcp-kit version types → 0.1.4 / ./types/index.d.ts
arg-domain package.json → private=true, types=(none)
document-machine.mjs → sondeo h-sdk sibling + ledger local (L68–82, L426+)
edge-zeus ciudad.ts → walk {destino}, announce {mensaje}, wake actor 'h-sdk'

# acta
C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md §8 presente tras §7 RH-02
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[manual]` grep residual `product-reachable`/`cero violaciones` en ALCANCE → solo contextos negativos/históricos/tarea/BRIEF (0 afirmaciones vigentes positivas)
  - `[manual]` ninguna fila de la tabla con cinco `sí`; todos los `sí` citan ancla
  - `[manual]` colisión RH-02: relectura de REPLAN; §7 intacta; obra solo en §8
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: no aplica (WP documental; sin cambio runtime)
- `INSTALACION_LIMPIA`: no aplica (sin publish/pack)
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `npm view` de Ciudad/rooms/player-mcp-kit (registry)
  - Manual: greps, lecturas dossier/RECAP/REPLAN, `-f` paths, inspección edge/document-machine
- `VEREDICTO_REVISOR`: `no requerido`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: S_META/HSDK + VISION + DECISIONES + design + REPORTES/RH-03-*
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (REPLAN §8, dossier, RECAP)
- [x] Sin fluff ni promesa de futuro sin `<pendiente>` / `⏳`
- [x] Eje III evidenciado: claims falsos tachados + tabla con anclas
- [x] Gates: greps residuales documentados; no se inventó producto
- [x] Commits convencionales (tras este reporte)
- [x] Diff solo del alcance del WP: sin BACKLOG, sin código producto, sin g/v mutados
- [x] Riesgo y contraevidencia del brief cubiertos
- [x] Pruebas automatizadas separadas de evidencia manual

## Hallazgos fuera de alcance

- `plan.md` «estado de partida» aún describe fundación unstaged (obsoleto post RH-01); fuera de `ALCANCE_DIFF` estricto del BRIEF → candidato higiene orquestador/RH-20.
- Anti-claim RH-01 §5 («ni ramas de ejecución RH-02») quedó histórico; supersedido por §7 — no reescrito para no mezclar autoría RH-01.

## Dudas / bloqueos

Ningún bloqueo. Colisión con RH-02 evitada (secciones distintas). PARAR: sin merge, sin push, sin editar BACKLOG.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
