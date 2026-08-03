# WP-RH-04 · matriz-contratos — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-04 |
| fecha | 2026-08-03 |
| rama | `wp/rh-04-matriz-contratos` |
| commits | `e3b9186d55deb7ea42bf11762b911db5c604d91c`,  |
| eje(s) CA | III, IV |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | listo para revisión |

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

## Archivos tocados

- `scripts/rh-04-matriz-contratos.mjs` — sensor re-ejecutable (install limpio + gates)
- `plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md` — matriz paquete×gate observada
- `plan/REPORTES/RH-04-matriz-contratos.json` — salida máquina del sensor (eje IV)
- `plan/REPORTES/RH-04-matriz-contratos.reporte.md` — este reporte (alias del path brief)

## Evidencia

```
# preflight
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
node .claude/skills/vigilancia/scripts/verificar-identidad-raiz.mjs
→ identidad-raiz: PASS / world-real: c:/s_lab/h-sdk / git-toplevel: c:/s_lab/h-sdk

# worktree
git worktree add -b wp/rh-04-matriz-contratos C:/S_LAB/wt/h-rh-04 main
→ HEAD d0fb5dd gov(RH-04): 🔶 lote-2 matriz ejecutable de contratos

# sensor
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json > plan/REPORTES/RH-04-matriz-contratos.json
→ install limpio exit 0
→ VERDES: ciudad@0.1.1, authority-kit@0.4.2, rooms@0.1.2, player-mcp-kit@0.1.4
→ ROJOS: arg-* / mockdatas / onfalo / lore-hm / provider-e / evidencia-hub = pending_external_contract (E404)
→ linea-kit@0.3.0 instalado: types=null typings=null hasTypesInExports=false → ROJO / publicado-sin-types
→ acta-kit@0.1.1 instalado: sin types → ROJO / publicado-sin-types (candidato parcial, no canónico)

# contaminación alcance
rg -n 'S_LAB|file:|link:' --glob package.json --glob 'tsconfig*.json' (repo, excl. skills)
→ 0 hits
```

### Resumen verdes / rojos

| veredicto | superficies |
| --- | --- |
| VERDE | `@zeus/ciudad@0.1.1`, `@zeus/authority-kit@0.4.2`, `@zeus/rooms@0.1.2`, `@zeus/player-mcp-kit@0.1.4` |
| ROJO / pending_external_contract | arg-domain, arg-runtime, arg-view-kit, arg-player-mcp, arg-feeds, mockdatas-ciudad, artefacto-onfalo, lore-hm-candidate, provider-e, ceremonia-evidencia-hub |
| ROJO / publicado-sin-types | `@zeus/linea-kit@0.3.0`, `@zeus/acta-kit@0.1.1` |

Hipótesis BRIEF confirmada: verdes esperados (ciudad/rooms/player-mcp-kit) verdes; delta tipado / Ónfalo / lengua / provider / evidencia canónica rojos. Extra observado: `authority-kit` también VERDE; `linea-kit` y `acta-kit` publicados pero sin types en manifest instalado.

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` al menos 1 esperado rojo permanece rojo: `npm view @zeus/arg-domain … → E404` (y resto delta/onfalo/lore/provider/evidencia)
  - `[automatizado]` 0 filas VERDE sin d.ts declarado + runtime import OK (ciudad/authority/rooms/player-mcp-kit tienen ambos; evidencia en matriz)
  - `[automatizado]` grep `S_LAB|file:|link:` en package.json/tsconfig alcance → 0
  - `[automatizado]` linea-kit: manifest instalado `types=null`, `typings=null`, `hasTypesInExports=false`, `d_ts=none` con runtime OK (falso-verde types bloqueado)
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: deps del probe temp = solo paquetes pinneados del registry; sin `file:`/`link:`/`workspace:`
- `INSTALACION_LIMPIA`: `npm install --ignore-scripts --no-package-lock` en temp dir con `.npmrc` de scopes → exit 0
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `scripts/rh-04-matriz-contratos.mjs` (view + install + d.ts + import + pollution)
  - Manual: lectura de BRIEF/plan.md step 4 / método E1; no se copiaron veredictos E1
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto` (riesgo `independiente`)

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `plan/REPORTES/RH-04-*` + `scripts/rh-04-matriz-contratos.mjs`
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (matriz + script)
- [x] Sin fluff ni promesa de futuro sin `<pendiente>` / `⏳`
- [x] Eje III: veredictos con anclas de comando literal; Eje IV: script + JSON re-ejecutables por segundo consumidor
- [x] Gates ejecutados de verdad (install limpio + sensor)
- [x] Commits convencionales
- [x] Diff solo del alcance del WP: sin BACKLOG, sin adapters, sin mutar pins de producto
- [x] Riesgo y contraevidencia del brief cubiertos
- [x] Pruebas automatizadas separadas de evidencia manual

## Hallazgos fuera de alcance

- `@zeus/authority-kit@0.4.2` está VERDE (no estaba en la hipótesis mínima de verdes del BRIEF; no bloquea).
- `@zeus/acta-kit@0.1.1` existe en registry pero sin types: no cierra la fila «evidencia canónica».
- `tsconfig.base.json` tiene `paths` internos `@h-sdk/*` → `./packages/*` (no sibling `S_LAB`); no cuenta como contaminación del brief.
- Case-folding Windows: paths brief reporte/matriz colisionan; reporte renombrado a `.reporte.md`.

## Dudas / bloqueos

Ningún bloqueo de ejecución. Riesgo `independiente` → falta revisor distinto read-only antes de aceptación. PARAR: sin merge, sin ✅, sin editar BACKLOG, sin push.

### Cómo re-ejecutar (eje IV)

```bash
cd C:/S_LAB/wt/h-rh-04   # o checkout de la rama
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json > plan/REPORTES/RH-04-matriz-contratos.json
```

---

## Revisión del orquestador

_(la rellena el orquestador tras revisor distinto: aceptado ✅ / devuelto con lista numerada)_
