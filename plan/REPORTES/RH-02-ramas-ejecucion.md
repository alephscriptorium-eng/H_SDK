# WP-RH-02 · ramas-ejecucion — reporte

| dato | valor |
| ---- | ----- |
| agente | `worker-RH-02 <alephscriptorium@gmail.com>` |
| fecha | 2026-08-03 |
| rama | `wp/rh-02-ramas-ejecucion` |
| commits | `c17b67262070199aa8305f6b12cb3f417589322d` |
| eje(s) CA | III |
| riesgo de revisión | `normal` |
| revisor distinto del worker | `no requerido` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se creó el worktree `C:/S_LAB/wt/h-rh-02` en `wp/rh-02-ramas-ejecucion` desde `main` HEAD (`a3f06f3…`). Se crearon las ramas de ejecución `wp/rh-ejecucion` en h-sdk (`e53694e…` checkpoint), g-sdk (`9f434b3…` padre del checkpoint) y v-sdk (`7eecfd4…` tip main). Tags locales opcionales `checkpoint/rh-01-h` y `checkpoint/rh-01-g`. Se actualizó el acta REPLAN §7 con hashes literales. Cero merges de checkpoint; `wp/g-prueba-hm-adaptacion` permanece en `35cbded…`. Sin push. `plan/PRACTICAS.md` no existe en el árbol (`⏳` lectura omitida por ausencia).

## Archivos tocados

- `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` — modificado: §7 ramas de ejecución (hashes literales)
- `plan/REPORTES/RH-02-ramas-ejecucion.md` — creado: este reporte
- refs git (no ficheros de producto): `wp/rh-ejecucion` en H/G/V; tags locales `checkpoint/rh-01-h`, `checkpoint/rh-01-g`; rama WP `wp/rh-02-ramas-ejecucion`

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

```
# Preflight H
WORLD_ROOT=C:/S_LAB/h-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/h-sdk \
  READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]' \
  node .../verificar-identidad-raiz.mjs
→ identidad-raiz: PASS / world-real: c:/s_lab/h-sdk / git-toplevel: c:/s_lab/h-sdk

# Worktree + rama WP
git -C C:/S_LAB/h-sdk worktree add -b wp/rh-02-ramas-ejecucion C:/S_LAB/wt/h-rh-02 HEAD
→ HEAD is now at a3f06f3 gov(RH-02,RH-03): 🔶 lote-1 ramas de ejecución + verdad artefactos

# H ejecución + tag
git -C C:/S_LAB/h-sdk branch wp/rh-ejecucion e53694e3e4acb664b84f517cf37a5b2155d0b934
git -C C:/S_LAB/h-sdk tag checkpoint/rh-01-h e53694e3e4acb664b84f517cf37a5b2155d0b934
git -C C:/S_LAB/h-sdk rev-parse wp/rh-ejecucion
→ e53694e3e4acb664b84f517cf37a5b2155d0b934

# Preflight G
→ identidad-raiz: PASS / world-real: c:/s_lab/g-sdk / git-toplevel: c:/s_lab/g-sdk

# G ejecución + tag; checkpoint intacto
git -C C:/S_LAB/g-sdk branch wp/rh-ejecucion 9f434b3bfc028db949ba39c67856e1bdaace16c8
git -C C:/S_LAB/g-sdk tag checkpoint/rh-01-g 35cbded673fdb557af4fe4864d8e514f7acf9f1c
git -C C:/S_LAB/g-sdk rev-parse wp/rh-ejecucion
→ 9f434b3bfc028db949ba39c67856e1bdaace16c8
git -C C:/S_LAB/g-sdk rev-parse wp/g-prueba-hm-adaptacion
→ 35cbded673fdb557af4fe4864d8e514f7acf9f1c
G_CHECKPOINT_INTACT=YES

# Preflight V (detector presente)
→ identidad-raiz: PASS / world-real: c:/s_lab/v-sdk / git-toplevel: c:/s_lab/v-sdk

# V ejecución desde main tip
git -C C:/S_LAB/v-sdk branch wp/rh-ejecucion main
git -C C:/S_LAB/v-sdk rev-parse wp/rh-ejecucion main
→ 7eecfd4592ae4b42544ff6ac6fe5ce451f6712aa
→ 7eecfd4592ae4b42544ff6ac6fe5ce451f6712aa
V_MATCH_MAIN=YES
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[manual]` `wp/g-prueba-hm-adaptacion` sigue `35cbded…` tras crear `wp/rh-ejecucion` en padre → `G_CHECKPOINT_INTACT=YES`
  - `[manual]` cero merges checkpoint→obra: solo `git branch` / `git tag`; sin `merge`/`reset`/`checkout` permanente del custodio
  - `[manual]` H `wp/rh-ejecucion` == `e53694e…`; G == `9f434b3…`; V == tip main `7eecfd4…`
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: no aplica (solo refs git + acta + reporte; sin runtime)
- `INSTALACION_LIMPIA`: no aplica (sin packages tocados)
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `verificar-identidad-raiz.mjs` PASS en H, G y V
  - Manual: `git rev-parse` de las cinco refs de contraevidencia del brief
- `VEREDICTO_REVISOR`: `no requerido`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: refs H/G/V + acta REPLAN §7 + reporte en rama WP
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: sí
- [x] Sellos con fuente; rutas citadas existentes: acta y BRIEF citados; hashes literales
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: sí
- [x] Eje(s) aplicables evidenciado(s): III — trazabilidad de anclas/refs con evidencia literal
- [x] Gates ejecutados de verdad: preflight identidad H/G/V PASS
- [x] Commits convencionales: este reporte
- [x] Diff solo del alcance del WP: sí (sin BACKLOG, sin merge, sin push, sin superficie)
- [x] Riesgo y contraevidencia del brief cubiertos: sí
- [x] Pruebas automatizadas separadas de evidencia manual: sí
- [ ] PRACTICAS.md: ausente en `plan/` → `⏳ sin verificar` contra ese fichero

## Hallazgos fuera de alcance

- `plan/PRACTICAS.md` no existe en h-sdk; worker no pudo leer PRACTICAS del mundo.
- Ancla BRIEF «H main tip post-✅ `20530665…`» no coincide con `main` actual (`a3f06f3…`); no se movió main (fuera de alcance).

## Dudas / bloqueos

Ninguno bloqueante. Acta en `C:/S_META` (fuera de git h-sdk); colisión de escritura no observada al aplicar §7.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
