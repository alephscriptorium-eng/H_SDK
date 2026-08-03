# WP-RH-13 · edges-owner — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-13 |
| fecha | 2026-08-03 |
| rama | `wp/rh-13-edges-owner` |
| commits | `13a7826` feat · `040a034` reporte · `72a09d6` fix-#1 · tip = HEAD de `wp/rh-13-edges-owner` |
| eje(s) CA | I, II, hostil-omite |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | devuelto-corregido |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en
h-sdk (4 vars). Worktree `C:/S_LAB/wt/h-rh-13` en rama `wp/rh-13-edges-owner`
desde `main` tip `15adda6`. Rehíce `packages/edge-zeus` como edges de owner
alineados a los 6 puertos RH-12: Ciudad (`PuertoEntradaCiudad` + wire
`@zeus/ciudad.makeIntent`/`EVENTS` con walk `{anchorId|nodeId}`, announce
`{message}`, wake `{tool,barrioId?,horseMode}`), delta (`PuertoSesionDelta`
vía abridor inyectable arg-domain/runtime; tip packs
`pending_registry_publish`), M (`abrirAsientoM` /
`saludMConectada` exige `connected`+`lastStateTs`), análisis E / línea /
evidencia fail-closed `pending_external_contract` (RH-11; nunca `ok()`
fingido), proyección H con sumidero opcional. Demolí `TransporteZeus`,
`protocolo.ts`, `acta.ts` y payloads paralelos. Tests hostil-omite + smoke
state/ledger/lastStateTs. Typecheck root core+edge verde. No BACKLOG, no
merge, no push, no composition root (RH-14), no vertical E2E (RH-15), no
`file:../g-sdk` en package.json.

**Corrección DEVOLUCION-RH-13 #1:** `abridorDesdeStartArgRuntime` ya no inventa
`delta:${stateId}:${ledgerId}` si faltan `sessionId` e `id`; devuelve `err`
explícito. Abridor tipa `Resultado`. Test de omisión + probe mutante añadidos
(corregido en commit `72a09d6`).

## Archivos tocados

- `packages/edge-zeus/src/wire-ciudad.ts` — creado: makeIntent/EVENTS + intents wire real
- `packages/edge-zeus/src/ciudad.ts` — reescrito: `PuertoEntradaCiudad` (state/ledger)
- `packages/edge-zeus/src/delta.ts` — creado: `PuertoSesionDelta` + abridor
- `packages/edge-zeus/src/asiento-m.ts` — creado: health M connected+lastStateTs
- `packages/edge-zeus/src/analisis-e.ts` — creado: pending_external fail-closed
- `packages/edge-zeus/src/linea.ts` — creado: pending_external fail-closed
- `packages/edge-zeus/src/evidencia.ts` — creado: pending_external fail-closed
- `packages/edge-zeus/src/proyeccion.ts` — creado: `PuertoProyeccion`
- `packages/edge-zeus/src/hostil-omite.test.ts` — creado: 19 tests omisión/wire
- `packages/edge-zeus/src/index.ts` — modificado: exports nuevos
- `packages/edge-zeus/src/protocolo.ts` — borrado (`TransporteZeus`)
- `packages/edge-zeus/src/acta.ts` — borrado (no sustituye evidencia canónica)
- `packages/edge-zeus/package.json` — deps: `@zeus/ciudad` + `@zeus/player-mcp-kit`
- `bun.lock` — pin edge: protocol→player-mcp-kit
- `plan/REPORTES/RH-13-edges-owner.md` — este reporte

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
git worktree add -b wp/rh-13-edges-owner C:/S_LAB/wt/h-rh-13 main
→ HEAD 15adda6bcbce2aa0fbec89455a7109e55d5528f1

# typecheck
bun run typecheck
→ TYPECHECK_EXIT:0 (core + edge-zeus)

# tests hostil-omite + smoke
cd packages/edge-zeus && bun test src
→ 20 pass, 0 fail

# corrección #1 · mutante/omisión sessionId|id (DEVOLUCION-RH-13)
# startArgRuntime → {} (sin sessionId ni id); M conectado+lastStateTs
→ abrirSesion: {"ok":false,"error":"delta: runtime omite sessionId|id — denegado (hostil-omite; no se inventa sesionId)"}
→ NO produce {"ok":true,"valor":{"sesionId":"delta:S1:L1"}}

# contraevidencia BRIEF
rg -n "destino:|mensaje:|'h-sdk'|\"h-sdk\"" packages/edge-zeus/src --glob '!*.test.ts'
→ PAYLOAD_GREP:0
rg -n "TransporteZeus" packages/edge-zeus/src
→ TRANSPORTE_SRC:0
rg -n "from '@zeus/" packages/core/src
→ CORE_IMPORT_ZEUS:0
rg -n 'delta:\$\{' packages/edge-zeus/src || echo 'INVENT_SESION:0'
→ INVENT_SESION:0

# G tip packs (smoke local, fuera de commit)
# tarballs RH-09: %TEMP%/rh09-clean-2UkgFY/zeus-arg-{domain,runtime,player-mcp}-0.1.0.tgz
# tip g-sdk: wp/rh-ejecucion@1fad30e — pending_registry_publish (npm view 404)
# edge consume arg-* vía abridor inyectable; sin file:../g-sdk en package.json
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` omitir `stateId` / `ledgerId` → `acople=replay` y
    `confirmarEntrada` error (`bun test` hostil-omite · Ciudad)
  - `[automatizado]` omitir `lastStateTs` o `connected` → M no conectado;
    `abrirSesion` delta deniega (`bun test` hostil-omite · M / delta)
  - `[automatizado]` omitir `sessionId` e `id` en handle runtime →
    `err` (no `ok` con `delta:S1:L1`); mutante DEVOLUCION-RH-13 #1
  - `[automatizado]` E/línea/evidencia → `err(pending_external_contract*)`,
    nunca `ok()` (`bun test` pending_external)
  - `[automatizado]` wire: intents con `anchorId|nodeId` / `message` /
    `tool+horseMode`; sin claves paralelas; actor ≠ `h-sdk`
  - `[manual]` grep contraevidencia PAYLOAD_GREP:0 / TRANSPORTE_SRC:0 /
    CORE_IMPORT_ZEUS:0 / INVENT_SESION:0
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: edge runtime directo
  `@zeus/ciudad@^0.1.1`, `@zeus/player-mcp-kit@^0.1.4` (registry). Packs
  `@zeus/arg-*@0.1.0` tipados en tarball RH-09 / g-sdk@1fad30e —
  `pending_registry_publish` (404 registry); consumidos por DI/abridor, no
  pin `file:../g-sdk`.
- `INSTALACION_LIMPIA`: `bun install` en worktree OK para deps registry;
  arg-* no en registry → no pin permanente; smoke tarball documentado arriba.
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `bun test src` (20) + `bun run typecheck`
  - Manual: greps contraevidencia; inspección tip packs 1fad30e / RH-09 tarballs
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto` (post-corrección #1)

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: edge-zeus + bun.lock justificado + reporte
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: sí
- [x] Sellos con fuente; rutas citadas existentes: sí (RH-11, RH-09 tip, puertos)
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: arg-* registry =
  pending_registry_publish; E/línea/evidencia = pending_external_contract
- [x] Eje(s) aplicables evidenciado(s): I (adapters owner), II (destino único
  de puertos demolidos), hostil-omite (tests omisión)
- [x] Gates ejecutados de verdad: typecheck + bun test
- [x] Commits convencionales: sí
- [x] Diff solo del alcance del WP: sí; no app, no BACKLOG, no core
- [x] Riesgo y contraevidencia del brief cubiertos: sí
- [x] Pruebas automatizadas separadas de evidencia manual: sí

## Hallazgos fuera de alcance

- Composition root Bun/TS que cablee emisor Ciudad real + startArgRuntime +
  factory `createArgPlayerMcp` → RH-14.
- Vertical E2E con room viva midiendo state/ledger/lastStateTs de red → RH-15.
- Publicación registry de `@zeus/arg-*` (hoy tarball-only) → owner G /
  pending_registry_publish.
- Provider E / linea tipada / evidencia HUB → RH-11 gaps (elevaciones).

## Dudas / bloqueos

Ninguno bloqueante para revisión. Packs G tipados siguen fuera de registry
(404); el edge queda listo para inyectar abridor desde tarball/registry sin
sibling path.

---

## Revisión del orquestador

DEVUELTO (contrarrevisión) · `plan/REPORTES/DEVOLUCION-RH-13.md` · defecto #1
corregido → estado `devuelto-corregido`. Pendiente re-aceptación.
