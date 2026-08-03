# WP-RH-12 · core-maquina — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-12 |
| fecha | 2026-08-03 |
| rama | `wp/rh-12-core-maquina` |
| commits | `20c7055` (20c705513954a3742b22842e9ba484bb7ff18202) · reporte `<pendiente anclar>` |
| eje(s) CA | II |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | listo para revisión |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en
h-sdk (4 vars). Worktree `C:/S_LAB/wt/h-rh-12` en rama
`wp/rh-12-core-maquina` desde `main` tip `355e4e9`. Rehíce `packages/core`
como máquina de experiencia con estados literales del BRIEF
(`idle` → … → `complete`) más terminales explícitos `error` y
`pending_external_contract`. Definí puertos H: entrada Ciudad confirmada,
sesión delta, análisis E, materialización de línea, evidencia canónica y
proyección. Eliminé `EntradaCadena`, `Cadena`, `Lado`, `PuertoActa`,
`PuertoCiudad` (verbos Zeus) y `PuertoOnfalo`. Añadí tests de transiciones
(camino feliz, ilegales, pending). Typecheck del package core verde tras
reparar `bun-types`/`typescript` corruptos en el worktree (caché Bun →
ceros; reinstalación desde tarball npm). No BACKLOG, no merge, no push,
no edge-zeus, no composition root.

## Destino canónico (eje II)

| símbolo demolido | destino único |
| --- | --- |
| `EntradaCadena` / `Cadena` / `Lado` | demolidos; evidencia canónica = owner HUB vía `PuertoEvidenciaCanonica` (contrato tipado pendiente) |
| `PuertoActa` | → `PuertoEvidenciaCanonica.verificar` (H no notaría) |
| `PuertoCiudad` (entrar/caminar/anunciar/despertar) | → `PuertoEntradaCiudad.confirmarEntrada` + eventos máquina `ciudad_confirmada` / `lore_alcanzado` / `barrio_despertado`; wire Zeus exacto = RH-13 |
| `PuertoOnfalo` | → evento `onfalo_seleccionado` + `PiezaOnfalo` de dominio; lectura artefacto = RH-13/14 |

Consumidores afectados (no tocados aquí): `packages/edge-zeus` importa
`PuertoCiudad`/`Acople` — rotura esperada hasta RH-13.

## Archivos tocados

- `packages/core/src/maquina.ts` — creado: `transicionar` / `aplicar` / `crearMaquina`
- `packages/core/src/maquina.test.ts` — creado: 9 tests de transiciones
- `packages/core/src/dominio.ts` — modificado: `EstadoExperiencia`; sin cadena
- `packages/core/src/puertos.ts` — modificado: 6 puertos de caso de uso H
- `packages/core/src/index.ts` — modificado: exports nuevos; sin símbolos demolidos
- `packages/core/src/resultado.ts` — modificado: comentario
- `packages/core/package.json` — modificado: script `test`
- `packages/core/tsconfig.json` — modificado: `types: []` + `lib: ESNext` (core puro)
- `plan/REPORTES/RH-12-core-maquina.md` — este reporte

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
git worktree add -b wp/rh-12-core-maquina C:/S_LAB/wt/h-rh-12 main
→ HEAD 355e4e99067edbf1e036720b43729f95a0657a4e

# fix install (bun-types/typescript corruptos = archivo de ceros desde caché Bun)
npm pack bun-types@1.3.11 && cp → node_modules/bun-types
npm pack typescript@5.9.3 && cp → node_modules/typescript
rm -rf ~/.bun/install/cache/bun-types@* typescript@*
# package.json / bun.lock raíz NO mutados (revertidos tras bun add)

# typecheck package core
cd packages/core && bun run typecheck
→ TYPECHECK_EXIT:0

# tests
cd packages/core && bun test src
→ 9 pass / 0 fail / 42 expect()

# contraevidencia BRIEF
rg -n 'EntradaCadena|PuertoActa' packages/core
→ MATCHES_0

# sin dependency @zeus en core
rg -n '"@zeus' packages/core/package.json packages/core/tsconfig.json
→ 0

# sin import runtime @zeus / Node IO en src
rg -n 'from ["'\'']@zeus|node:|from ["'\'']fs' packages/core/src
→ 0 (solo strings de superficie en test de pending + comentarios “sin @zeus”)
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` transición ilegal `idle`+`delta_iniciada` → `transicion_ilegal` (test) — pass
  - `[automatizado]` `pending_external_contract` + `completar` → error explícito (test) — pass
  - `[automatizado]` grep `EntradaCadena|PuertoActa` en `packages/core` → 0 — pass
  - `[manual]` `package.json`/`tsconfig` de core sin dependency `@zeus/*` — pass
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: `@h-sdk/core` sin `dependencies`/`devDependencies` propias; runtime = built-ins del lenguaje únicamente
- `INSTALACION_LIMPIA`: `bun install` en worktree dejó `bun-types`/`typescript` corruptos (ceros); fix documentado vía tarball npm en worktree local (no committed). `⏳ sin verificar` install limpio en máquina fría distinta
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `bun run typecheck` (EXIT:0); `bun test src` (9 pass); greps
  - Manual: destino canónico eje II; inspección package.json/tsconfig sin `@zeus`
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto` (RIESGO_REVISION: independiente)

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: `packages/core/**` + `plan/REPORTES/RH-12-*`
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: N/A (código nuevo H)
- [x] Sellos con fuente; rutas citadas existentes: BRIEF + CONTRATO + plan.md step 12
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: tipestate UnidadRef y wire Zeus → `<pendiente>`/RH-13
- [x] Eje(s) aplicables evidenciado(s): II — tabla destino canónico + grep 0
- [x] Gates ejecutados de verdad: typecheck + tests + greps
- [x] Commits convencionales: `feat(RH-12): …`
- [x] Diff solo del alcance del WP: sí; edge-zeus no tocado
- [x] Riesgo y contraevidencia del brief cubiertos: sí; veredicto revisor pendiente
- [x] Pruebas automatizadas separadas de evidencia manual: sí
- `plan/PRACTICAS.md` ausente en el árbol (mismo hallazgo RH-02/05)

## Hallazgos fuera de alcance

- `packages/edge-zeus` sigue tipando contra `PuertoCiudad` demolido → RH-13.
- Caché Bun en este host puede materializar `bun-types`/`typescript` como
  archivos de ceros; candidato a nota de entorno / higiene de install (no WP).
- Root `bun run typecheck` (core+edge-zeus) quedará rojo hasta RH-13; CA de
  este WP es typecheck del **package** core.

## Dudas / bloqueos

Ninguno que bloquee revisión. Listo para revisor distinto (riesgo
independiente).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
