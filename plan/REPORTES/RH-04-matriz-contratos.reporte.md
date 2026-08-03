# WP-RH-04 · matriz-contratos — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-04 |
| fecha | 2026-08-03 |
| rama | `wp/rh-04-matriz-contratos` |
| commits | e3b9186 (entrega); bb238be · 87d7dc4 · 42a9883 · 5ab0f55 (anclas); + commit fix DEVOLUCION #1 (ver §corrección) |
| eje(s) CA | III, IV |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | devuelto-corregido |

> **Nota de ruta:** el BRIEF pedía `RH-04-matriz-contratos.md` (reporte) y
> `RH-04-MATRIZ-CONTRATOS.md` (matriz). En FS case-insensitive (Windows) son el
> mismo path; el reporte vive aquí como `RH-04-matriz-contratos.reporte.md` y la
> matriz en `RH-04-MATRIZ-CONTRATOS.md`.

## Qué se hizo

Sin desviaciones de alcance del BRIEF (salvo renombre del reporte por
case-folding). Preflight `identidad-raiz: PASS` en h-sdk. Worktree
`C:/S_LAB/wt/h-rh-04` en rama `wp/rh-04-matriz-contratos` desde `main` tip
`d0fb5dd` (gov 🔶). Medí desde install limpio en temp dir (registry
`npm.scriptorium.escrivivir.co`, sin siblings/`file:`/`link:`/`workspace:`) las
superficies del BRIEF: versiones exactas, export maps, `.d.ts` declarados en
manifest instalado, runtime import y owner. Reusé el método de E1 (medición
registry) sin copiar veredictos: re-medí todo, incluida `@zeus/linea-kit@0.3.0`.
Entregué matriz + script re-ejecutable + JSON sensor. No muté
`package.json`/`bun.lock` de producto. No BACKLOG, no merge, no push.

**Corrección post-DEVOLUCION:** defecto #1 de
`plan/REPORTES/DEVOLUCION-RH-04.md` — `verdictFor` ya no concede VERDE si
falta `.d.ts` en disco aunque `hasTypesInExports=true`. Sensor re-ejecutado;
matriz/JSON/reporte regenerados; mutante documentado y ROJO.

## Archivos tocados

- `scripts/rh-04-matriz-contratos.mjs` — sensor + fix `verdictFor` + `--mutant`
- `plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md` — matriz paquete×gate observada
- `plan/REPORTES/RH-04-matriz-contratos.json` — salida máquina del sensor (eje IV)
- `plan/REPORTES/RH-04-matriz-contratos.reporte.md` — este reporte (alias del path brief)

## Corrección (DEVOLUCION #1)

| ítem | valor |
| --- | --- |
| defecto | `verdictFor` VERDE con `hasTypesInExports` y `dts_found=[]` |
| remedio | VERDE exige `dts_found.length > 0` (paths declarados top-level/exports en disco); si declara types y no hay archivo → `ROJO / sin d.ts` |
| corregido en commit | _(hash del commit de fix)_ |

### Mutante → ROJO

```
node scripts/rh-04-matriz-contratos.mjs --mutant
→ veredicto: ROJO / sin d.ts
→ pass: true
→ exit: 0
```

Input del mutante: `hasTypesInExports=true`, `dts_found=[]`, `runtime_import=OK`,
`export_map` presente, `version_exacta=0.0.0-mutant`. Antes del fix esto podía
ser VERDE; ahora deniega (hostil-omite / anti falso-verde).

## Evidencia

```
# preflight (corrección)
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
→ identidad-raiz: PASS

# mutant probe
node scripts/rh-04-matriz-contratos.mjs --mutant
→ ROJO / sin d.ts · pass=true · exit 0

# sensor re-run
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json > plan/REPORTES/RH-04-matriz-contratos.json
→ install limpio exit 0
→ VERDES: ciudad@0.1.1, authority-kit@0.4.2, rooms@0.1.2, player-mcp-kit@0.1.4
→ ROJOS: arg-* / mockdatas / onfalo / lore-hm / provider-e / evidencia-hub = pending_external_contract (E404)
→ linea-kit@0.3.0 → ROJO / publicado-sin-types
→ acta-kit@0.1.1 → ROJO / publicado-sin-types
→ mutant_probe en JSON: ROJO / sin d.ts · pass=true

# contaminación alcance
rg -n 'S_LAB|file:|link:' --glob package.json --glob 'tsconfig*.json' (repo, excl. skills)
→ 0 hits
```

### Resumen verdes / rojos (post-fix)

| veredicto | superficies |
| --- | --- |
| VERDE | `@zeus/ciudad@0.1.1`, `@zeus/authority-kit@0.4.2`, `@zeus/rooms@0.1.2`, `@zeus/player-mcp-kit@0.1.4` |
| ROJO / pending_external_contract | arg-domain, arg-runtime, arg-view-kit, arg-player-mcp, arg-feeds, mockdatas-ciudad, artefacto-onfalo, lore-hm-candidate, provider-e, ceremonia-evidencia-hub |
| ROJO / publicado-sin-types | `@zeus/linea-kit@0.3.0`, `@zeus/acta-kit@0.1.1` |

Hipótesis BRIEF confirmada tras re-run. Criterio VERDE endurecido: types-en-exports
sin archivo en disco ya no basta.

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` mutante `types-exports-no-disk` → `ROJO / sin d.ts` (DEVOLUCION #1)
  - `[automatizado]` al menos 1 esperado rojo permanece rojo: `npm view @zeus/arg-domain … → E404`
  - `[automatizado]` 0 filas VERDE sin d.ts en disco + runtime import OK
  - `[automatizado]` grep `S_LAB|file:|link:` → 0
  - `[automatizado]` linea-kit: sin types en manifest → `ROJO / publicado-sin-types`
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: deps del probe temp = solo paquetes pinneados del registry
- `INSTALACION_LIMPIA`: `npm install --ignore-scripts --no-package-lock` en temp → exit 0 (re-run)
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: sensor + `--mutant`
  - Manual: lectura DEVOLUCION-RH-04; solo defecto #1
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto` (riesgo `independiente`; estado `devuelto-corregido`)

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `plan/REPORTES/RH-04-*` + `scripts/rh-04-matriz-contratos.mjs`
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (matriz + script)
- [x] Sin fluff ni promesa de futuro sin `<pendiente>` / `⏳`
- [x] Eje III/IV: veredictos con anclas; sensor + mutante re-ejecutables
- [x] Gates ejecutados de verdad (install limpio + mutant + sensor)
- [x] Commits convencionales
- [x] Diff solo del alcance del WP / defectos numerados
- [x] Riesgo y contraevidencia del brief + DEVOLUCION #1 cubiertos
- [x] Pruebas automatizadas separadas de evidencia manual

## Hallazgos fuera de alcance

- `@zeus/authority-kit@0.4.2` está VERDE (extra respecto a hipótesis mínima del BRIEF).
- `@zeus/acta-kit@0.1.1` publicado sin types: no cierra evidencia canónica.
- Case-folding Windows: reporte en `.reporte.md`.

## Dudas / bloqueos

Ningún bloqueo. Defecto #1 corregido; pendiente re-contrarrevisión / aceptación del
orquestador. PARAR: sin merge, sin ✅, sin editar BACKLOG, sin push.

### Cómo re-ejecutar (eje IV)

```bash
cd C:/S_LAB/wt/h-rh-04
node scripts/rh-04-matriz-contratos.mjs --mutant
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json > plan/REPORTES/RH-04-matriz-contratos.json
```

---

## Revisión del orquestador

**DEVUELTO** 2026-08-03 · contrarrevisión adversarial · ver
`plan/REPORTES/DEVOLUCION-RH-04.md` defecto #1.

_(tras corrección: aceptado ✅ / devuelto con lista numerada)_
