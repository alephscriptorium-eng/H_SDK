# WP-RH-11 · owners-externos — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-11 |
| fecha | 2026-08-03 |
| rama | `wp/rh-11-owners-externos` |
| commits | `3e19938` |
| eje(s) CA | IV, V |
| riesgo de revisión | `normal` |
| revisor distinto del worker | `no requerido` |
| estado propuesto | listo para revisión (PARAR en gaps / pending_external por superficie) |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en h-sdk (4 vars). Worktree `C:/S_LAB/wt/h-rh-11` en rama `wp/rh-11-owners-externos` desde `main` tip `b8cb645`. Re-medí las cuatro superficies del step 11 (candidato LORE-HM, provider E, ceremonia/evidencia, materialización/linea-kit) contra el registry, citando RH-04 y re-chequeo puntual 2026-08-03T14:17:56Z. Documenté gaps por superficie + elevaciones a owners en `RH-11-GAPS-OWNERS.md` y nota opcional `C:/S_META/HSDK/RH-11-ELEVACION-OWNERS.md`. Declaré explícitamente que H no implementa `line.materialize`, provider, digest, cremallera, notaría ni ledger sustituto. Cero código en `packages/*` de H. No BACKLOG, no merge, no push, no publish falso.

## Archivos tocados

- `plan/REPORTES/RH-11-GAPS-OWNERS.md` — creado: matriz gaps × owner × veredicto
- `plan/REPORTES/RH-11-owners-externos.md` — creado: este reporte
- `C:/S_META/HSDK/RH-11-ELEVACION-OWNERS.md` — creado (opcional): nota de elevación a owners (fuera de git h-sdk)

## Evidencia

```
# preflight
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
→ identidad-raiz: PASS / world-real: c:/s_lab/h-sdk / git-toplevel: c:/s_lab/h-sdk

# worktree
git worktree add -b wp/rh-11-owners-externos C:/S_LAB/wt/h-rh-11 main
→ HEAD b8cb645 gov(RH-05,06,10,11): 🔶 lote-3 …

# re-chequeo registry (2026-08-03T14:17:56Z)
lore-hm-candidate / lore-hm / @logos/lore-hm / @alephscript/lore-hm-candidate → exit=1 E404
@zeus/provider-e / @zeus/analisis-e / provider-e → exit=1 E404
@zeus/evidence-kit / @zeus/evidencia-kit / @zeus/hub-evidence / @zeus/ceremony-kit / @zeus/notaria-kit → exit=1 E404
@zeus/linea-kit@0.3.0 → version=0.3.0; types/typings ausentes; export ./materialize=false
@zeus/acta-kit@0.1.1 → version=0.1.1; types/typings ausentes

# install limpio (temp, ignore-scripts)
@zeus/linea-kit@0.3.0 + @zeus/acta-kit@0.1.1 → d.ts none; materializeRecorrido solo en ./viaje (sin types)

# contraevidencia brief
git diff --name-only main...HEAD | grep '^packages/' → (esperado 0 tras commit)
```

### Veredicto por superficie (PARAR aquí)

| superficie | veredicto |
| --- | --- |
| candidato LORE-HM | `pending_external_contract` |
| provider E | `pending_external_contract` |
| ceremonia / evidencia canónica | `pending_external_contract` (`acta-kit@0.1.1` = `publicado-sin-types`, no sustituye) |
| materialización / linea-kit | `publicado-sin-types` + sin export tipado `./materialize` |

OK tipado: **0 / 4**.

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[manual]` hostil-omite tipado: `linea-kit` publicado sin `types`/`typings` y sin `.d.ts` → no VERDE (alineado RH-04).
  - `[manual]` ausencia de export `./materialize` → gap explícito; H no inventa operación.
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: no aplica producto H; probes solo lectura registry + install temp de kits publicados.
- `INSTALACION_LIMPIA`: temp dir + `npm install --ignore-scripts --no-package-lock` de `@zeus/linea-kit@0.3.0` y `@zeus/acta-kit@0.1.1` → exit 0; evidencia types negativa.
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `npm view` exit codes; node probe `hasOwnProperty(exports,'./materialize')=false`.
  - Manual: lectura RH-04, DECISIONES ①, frontera REVISION-ALEPH (owners; sin nombrar capas de marco).
- `VEREDICTO_REVISOR`: `no requerido`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `plan/REPORTES/RH-11-*` (+ S_META nota opcional)
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia
- [x] Sellos con fuente; rutas citadas existentes (RH-04, DECISIONES ①, registry)
- [x] Sin fluff ni promesa de futuro sin `<pendiente>` / pending_external
- [x] Eje IV: segundo consumidor (H) como sensor — gaps visibles, no tapados
- [x] Eje V: mediación transparente — texto nombra owners/paquetes; no capas de marco
- [x] Gates: preflight PASS; probes registry literales
- [x] Commits convencionales (entrega)
- [x] Diff solo del alcance del WP
- [x] Riesgo y contraevidencia del brief cubiertos (`packages/` = 0)
- [x] Pruebas automatizadas separadas de evidencia manual

## Hallazgos fuera de alcance

- Runtime `materializeRecorrido` en `@zeus/linea-kit/viaje` existe sin types: owner Z decide si esa es la API canónica a tipar/exportar; H no adopta ni reexpone.
- `@zeus/acta-kit` publicado sin types: candidato parcial HUB/Z; no cierra evidencia canónica (ya en RH-04).

## Dudas / bloqueos

- Bloqueo intencional: las cuatro superficies permanecen abiertas hasta publicación tipada de owners. Este WP **PARA** aquí; no rellena gaps en H.

---

## Revisión del orquestador

**✅ aceptado** 2026-08-03 · orquestador-H · merge `520b1ea` · 0/4 tipados = pending_external explícito (bloquea RH-15 hasta owners).
