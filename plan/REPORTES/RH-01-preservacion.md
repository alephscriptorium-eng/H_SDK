# WP-RH-01 · preservacion — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-01 |
| fecha | 2026-08-03 |
| rama | `main` (h-sdk) · `wp/g-prueba-hm-adaptacion` (g-sdk) — **excepción** brief: sin `wp/RH-01-*` |
| commits | H `e53694e3e4acb664b84f517cf37a5b2155d0b934` (+ este reporte si segundo commit); G `35cbded673fdb557af4fe4864d8e514f7acf9f1c` |
| eje(s) CA | III |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | listo para revisión |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en h-sdk y g-sdk. Audité untracked/modified excluyendo secretos, `node_modules` y outputs. Ejecuté checks read-only de línea base (H typecheck falló por `bun-types` corrupto local — no se reparó; G tests domain/feeds/player-mcp PASS). Creé checkpoint en `h-sdk/main` rotulado fundación TS/Bun **NO alcanzable / NO validada como producto**, y en `g-sdk/wp/g-prueba-hm-adaptacion` rotulado adaptación **forense NO integrable**. Escribí acta `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` con hash, padre, `diff --stat`, checks y limitaciones literales. No merge, no push, no BACKLOG, no v-sdk, no ramas RH-02.

## Archivos tocados

- `packages/core/**`, `packages/edge-zeus/**`, `package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.base.json`, `plan.md`, `INSTRUCTIONS/**` — preservados en checkpoint H
- delta/arg-* + `e2e/document-machine-demo.mjs` + scripts demo — preservados en checkpoint G (ver acta)
- `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` — creado (única escritura fuera de repos)
- `plan/REPORTES/RH-01-preservacion.md` — este reporte

## Evidencia

```
# identidad h
identidad-raiz: PASS
world-real: c:/s_lab/h-sdk
git-toplevel: c:/s_lab/h-sdk

# identidad g
identidad-raiz: PASS
world-real: c:/s_lab/g-sdk
git-toplevel: c:/s_lab/g-sdk

# H checkpoint
e53694e3e4acb664b84f517cf37a5b2155d0b934
parent=f5caeed64271735a2bf23aed08fb8c589518291f
author=worker-RH-01 <alephscriptorium@gmail.com>
21 files changed, 1251 insertions(+), 1 deletion(-)

# H typecheck
bun run typecheck → FAIL (bun-types/bun.d.ts = data/null bytes; TS1127 Invalid character)
file node_modules/bun-types/bun.d.ts → data
(no fix aplicado)

# G checkpoint
35cbded673fdb557af4fe4864d8e514f7acf9f1c
parent=9f434b3bfc028db949ba39c67856e1bdaace16c8
author=worker-RH-01 <alephscriptorium@gmail.com>
23 files changed, 2077 insertions(+), 101 deletions(-)

# G checks
npm run test:arg-domain → pass 72 / fail 0
npm test -w @zeus/arg-feeds → pass 4 / fail 0
npm test -w @zeus/arg-player-mcp → pass 22 / fail 0

# secret/generated
H/G: cero .env*; node_modules no staged; scan BEGIN PRIVATE/OPENSSH/AKIA → vacío
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[manual]` secretos tipicos (.env, private key, AKIA) en diff a commitear → 0 hallazgos
  - `[manual]` `git diff --cached --name-only` sin `node_modules` / `.env` → STAGE_OK en H y G
  - `[manual]` post-commit `git status --porcelain` vacío en g; h limpio tras checkpoint (reporte = segundo commit permitido)
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: no aplica a WP de preservación (sin cambio de política runtime/publicación)
- `INSTALACION_LIMPIA`: no aplica (checkpoint forense; no gate de publicación)
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `bun run typecheck` FAIL local; `test:arg-domain` / arg-feeds / arg-player-mcp PASS
  - Manual: auditoría untracked, exclusión secretos/generated, hashes/padre/stat en acta REPLAN
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: H working tree filtrado + G adaptación + acta S_META
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: solo preservación in-place
- [x] Sellos con fuente; rutas citadas existentes: acta y hashes literales
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: rótulos NO alcanzable / NO integrable
- [x] Eje(s) aplicables evidenciado(s): III — exclusiones secret/generated documentadas
- [x] Gates ejecutados de verdad: typecheck H (FAIL registrado); tests G parciales PASS
- [x] Commits convencionales: `checkpoint(RH-01): …`
- [x] Diff solo del alcance del WP: sin tipado/publicación/demo nuevos
- [x] Riesgo y contraevidencia del brief cubiertos: secretos 0; status limpio; acta con hash/padre/stat
- [x] Pruebas automatizadas separadas de evidencia manual: sí

## Hallazgos fuera de alcance

- `node_modules/bun-types/bun.d.ts` corrupto (ceros) en checkout H — candidato a higiene de install, no RH-01.
- Edge H con payloads paralelos / demo `.mjs` no alcanzable — RH-12/RH-14.
- G `document-machine` sibling/ledger — RH-06/RH-09 (descomposición/gate).

## Dudas / bloqueos

Ningún bloqueo para cierre de preservación. Riesgo `independiente` queda pendiente de revisor distinto read-only. Orquestador: no ✅ / no merge desde este worker.

---

## Revisión del orquestador

**✅ aceptado** 2026-08-03 · orquestador-H

- CA: status limpio H+G; acta `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` con hash/padre/stat; paths sin `.env`/`node_modules` en diffs.
- Contrarrevisión adversarial (revisor ≠ worker): **PASS** — no refutó los CA.
- Merge: **no aplica** (checkpoints ya en `main` / `wp/g-prueba-hm-adaptacion` por excepción del BRIEF).
- Hallazgo heredado (no bloquea RH-01): `bun-types` corrupto en install H → higiene posterior.
- Siguiente: RH-02 / RH-03 tras GO de lote.
