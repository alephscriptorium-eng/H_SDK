# WP-RH-14 · composition-root — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-14 |
| fecha | 2026-08-03 |
| rama | `wp/rh-14-composition-root` |
| commits | `1139079` feat · `b05d03a` reporte · tip = HEAD de `wp/rh-14-composition-root` |
| eje(s) CA | I, II |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` |
| estado propuesto | listo para revisión |

## Qué se hizo

Sin desviaciones de alcance del BRIEF. Preflight `identidad-raiz: PASS` en
h-sdk (4 vars). Worktree `C:/S_LAB/wt/h-rh-14` en rama
`wp/rh-14-composition-root` desde `main` tip `d32fd3e`. Creé
`packages/app-prueba-hm` (Bun/TS) con composition root que: arranca Ciudad
vía `PuertoEntradaCiudad`; emite walk+wake y abre delta **sólo** tras
reach/wake confirmados; asienta M (`abrirAsientoM` /
`connected+lastStateTs`); expone resources versionados
`h-sdk://experiencia/{estado,escena,evidencia}`; deja
`pending_external_contract` visible y **nunca** declara `complete`. Cambié
`scripts.demo` a `bun run packages/app-prueba-hm/src/main.ts`; typecheck
incluye app; workspaces explícitos sin `game-prueba-hm`. Assets del boceto
intactos en disco. Tests reachability + composition verdes. Typecheck root
verde. No BACKLOG, no merge, no push, no vertical E2E (RH-15), no borrado
de assets Ónfalo.

## Destino canónico (eje II)

| símbolo / vía demolida del reachable | destino único |
| --- | --- |
| `scripts.demo` → `node packages/game-prueba-hm/server.mjs` | → `bun run packages/app-prueba-hm/src/main.ts` |
| producto reachable vía `packages/*` (incl. boceto) | → workspaces explícitos: `core`, `edge-zeus`, `app-prueba-hm` |
| assets `game-prueba-hm/**` | permanecen en disco (no borrados; eliminación post Ónfalo verificado) |

## Archivos tocados

- `packages/app-prueba-hm/package.json` — creado: workspace `@h-sdk/app-prueba-hm`
- `packages/app-prueba-hm/tsconfig.json` — creado
- `packages/app-prueba-hm/src/main.ts` — creado: entrypoint + anchors reachability
- `packages/app-prueba-hm/src/composition.ts` — creado: cableado máquina/edges/resources
- `packages/app-prueba-hm/src/resources.ts` — creado: resources MCP versionados H→V
- `packages/app-prueba-hm/src/reachability.test.ts` — creado: scan imports + anchors
- `packages/app-prueba-hm/src/composition.test.ts` — creado: orden reach/wake/M/pending
- `package.json` — modificado: workspaces, typecheck+app, demo Bun/TS, test:reachability
- `tsconfig.base.json` — modificado: path `@h-sdk/app-prueba-hm`
- `bun.lock` — modificado: workspace app-prueba-hm
- `plan/REPORTES/RH-14-composition-root.md` — este reporte

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
git worktree add -b wp/rh-14-composition-root C:/S_LAB/wt/h-rh-14 main
→ HEAD d32fd3e (gov RH-14 🔶)
→ tip feat: 1139079ef83e34f77ee86a80947446708387181e

# typecheck
bun run typecheck
→ TYPECHECK_EXIT:0 (core + edge-zeus + app-prueba-hm)

# tests reachability + composition
bun run test:reachability
→ 8 pass, 0 fail

# demo reachable
bun run demo
→ entrypoint @h-sdk/app-prueba-hm
→ maquina: error (Ciudad sin observables — fail-closed)
→ resources list: estado/escena/evidencia
→ DEMO_EXIT:0 (honesto; no complete)

# contraevidencia BRIEF
node -e "… scripts.demo …"
→ bun run packages/app-prueba-hm/src/main.ts
→ HAS_SERVER_MJS false
→ WORKSPACES ["packages/core","packages/edge-zeus","packages/app-prueba-hm"]
rg -n "game-prueba-hm/server.mjs" package.json → (sin match)
rg modo replay que declare complete en app src → NO_REPLAY_COMPLETE_MODE
test -d packages/game-prueba-hm/assets → ASSETS_OK
test -f packages/game-prueba-hm/server.mjs → SERVER_MJS_STILL_ON_DISK (no borrado)

# eje I · consumidor de producción
packages/app-prueba-hm importa y ejecuta @h-sdk/core + @h-sdk/edge-zeus
(composition + REACHABILITY_ANCHORS + tests de comportamiento)
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` demo por defecto no declara `complete` (`bun test`
    reachability) — pass
  - `[automatizado]` sin reach/wake → escena `disponible:false`, no
    `delta_running` (`composition.test`) — pass
  - `[automatizado]` sin factory M → `pending_external_contract` visible,
    evidencia no verificada — pass
  - `[automatizado]` camino hasta delta + E → pending, no complete — pass
  - `[automatizado]` mutante: quitar `crearPuertoEntradaCiudad` del source
    deja el scan sin el símbolo — pass
  - `[manual]` `scripts.demo` sin `game-prueba-hm/server.mjs` — pass
  - `[manual]` grep app: no modo replay silencioso que declare complete — pass
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: app runtime
  `@h-sdk/core@workspace:*`, `@h-sdk/edge-zeus@workspace:*` (workspaces
  locales). Edges ya pinnean `@zeus/ciudad` / `@zeus/player-mcp-kit`
  (RH-13). Sin `file:../g-sdk`.
- `INSTALACION_LIMPIA`: `bun install` en worktree OK; app enlazada en
  `node_modules/@h-sdk/app-prueba-hm`.
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: `bun run typecheck` + `bun run test:reachability` (8)
  - Manual: greps contraevidencia demo/workspaces/assets; `bun run demo`
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de `ALCANCE_DIFF`: app-prueba-hm + package.json +
  bun.lock + tsconfig* + reporte
- [x] Cero árboles/ficheros copiados de otros mundos sin procedencia: sí
- [x] Sellos con fuente; rutas citadas existentes: sí
- [x] Sin fluff ni promesa de futuro sin `<pendiente>`: vertical E2E =
  RH-15; arg-* registry = pending_registry_publish; E/línea/evidencia =
  pending_external_contract
- [x] Eje(s) aplicables evidenciado(s): I (app consume core+edges), II
  (demo/.mjs → app-prueba-hm; assets no borrados)
- [x] Gates ejecutados de verdad: typecheck + test:reachability + demo
- [x] Commits convencionales: sí
- [x] Diff solo del alcance del WP: sí; no BACKLOG, no RH-15
- [x] Riesgo y contraevidencia del brief cubiertos: sí
- [x] Pruebas automatizadas separadas de evidencia manual: sí

## Hallazgos fuera de alcance

- Vertical E2E real (Ciudad room viva + delta registry + Ónfalo + E + línea
  + evidencia) → RH-15.
- Servidor MCP de proceso (tools/resources over stdio/HTTP) para V → RH-16.
- Borrado de assets `game-prueba-hm` tras Ónfalo publicado/verificado →
  post RH-10 gate.
- Publicación registry `@zeus/arg-*` → pending_registry_publish (owner G).

## Dudas / bloqueos

Ninguna bloqueante para revisión. Revisor distinto requerido
(`RIESGO_REVISION: independiente`).

---

## Revisión del orquestador

_(la rellena el orquestador tras PASS del revisor distinto: aceptado ✅ /
devuelto con lista numerada)_
