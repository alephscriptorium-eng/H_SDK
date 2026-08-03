# WP-RH-15 · vertical-minimo — reporte

| dato | valor |
| ---- | ----- |
| agente | worker-RH-15 |
| fecha | 2026-08-03 |
| rama | `wp/rh-15-vertical` |
| commits | _(anclar tras commit)_ |
| eje(s) CA | IV, hostil-omite |
| riesgo de revisión | `independiente` |
| revisor distinto del worker | `sí` (orquestador read-only post-obra) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cableó el vertical mínimo real sobre packs registry: Ciudad confirmada →
walk/wake → M (`@zeus/arg-player-mcp`) → delta (`@zeus/arg-runtime@0.1.1` con
`sessionId` propio) → pieza Ónfalo sellada (`@zeus/onfalo-fixture@0.1.1`) →
stop visible en provider E / línea / evidencia (`pending_external_contract`).
Cero `complete`. En G se publicó `arg-runtime@0.1.1` (sessionId) y
`onfalo-fixture@0.1.1` (sello LF alineado al tarball).

## Archivos tocados

- `packages/app-prueba-hm/src/deps-vertical.ts` — creado: abridor/factory registry
- `packages/app-prueba-hm/src/onfalo-pieza.ts` — creado: selección sellada
- `packages/app-prueba-hm/src/composition.ts` — modificado: paso onfalo + E
- `packages/app-prueba-hm/src/main.ts` — modificado: deps vertical
- `packages/app-prueba-hm/src/vertical.test.ts` — creado
- `packages/app-prueba-hm/src/*test*` — actualizados
- `package.json` / `packages/app-prueba-hm/package.json` / `bun.lock` — pins
- G `packages/delta/arg-runtime@0.1.1` · `packages/onfalo-fixture@0.1.1` (main)

## Evidencia

```
bun run typecheck → exit 0
bun test composition/reachability/vertical/hostil-omite → 31 pass / 0 fail
bun run demo → maquina pending_external_contract; acople ciudad/delta/m=conectado;
  sesionId UUID; pending provider-E + linea + evidencia; never complete
npm view @zeus/arg-runtime@0.1.1 types → ./types/index.d.ts
npm view @zeus/onfalo-fixture@0.1.1 → 0.1.1; verifySeal allSealed=true en tarball
Actions publish: 30831894490 (runtime) · 30832131073 (onfalo)
G main tip: 6b302b7; checkpoint G 35cbded intacto
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado]` omitir sessionId en abridor → err hostil-omite (edge test)
  - `[automatizado]` sin factory M → pending_external; no complete
  - `[automatizado]` resolución onfalo/mockdatas paths contienen `node_modules`, no `/g-sdk/`
  - `[manual]` demo JSON: superficie provider-E; complete ausente
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: `@zeus/arg-domain@0.1.0`,
  `arg-runtime@0.1.1`, `arg-player-mcp@0.1.0`, `onfalo-fixture@0.1.1`,
  `mockdatas-ciudad@0.1.0` (registry)
- `INSTALACION_LIMPIA`: `bun install` + pins exactos; onfalo 0.1.1 tras cache clear
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: 31 tests
  - Manual: `bun run demo` JSON
- `VEREDICTO_REVISOR`: `⏳ pendiente de revisor distinto`

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [x] Diff solo dentro de ALCANCE_DIFF (H app + pins; G runtime/onfalo)
- [x] Cero siblings como runtime
- [x] Sellos con fuente; onfalo 0.1.1 verifySeal PASS en tarball
- [x] Sin complete fingido
- [x] Ejes IV / hostil-omite evidenciados
- [x] Gates ejecutados de verdad
- [ ] Commits convencionales: al cerrar
- [x] Riesgo y contraevidencia del brief cubiertos

## Hallazgos fuera de alcance

- LORE-HM / provider E / linea-kit tipado / evidencia HUB siguen ROJO (RH-11).
- Room viva real (sin stubs createClient) queda para E2E RH-19.
- Fixture ciudad-v0 Lore completa no publicada; escena = deltaV0 marcada lore-aceptacion.

## Dudas / bloqueos

Ninguno para CA de RH-15 (vertical hasta pending_external visible).

---

## Revisión del orquestador

_(pendiente PASS/DEVUELTO)_
