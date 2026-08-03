# RH-04 · MATRIZ CONTRATOS (install limpio)

Generado: 2026-08-03T17:15:35.787Z
Registry: `https://npm.scriptorium.escrivivir.co`

## Método

1. `npm view <pkg> version types typings exports --json` contra registry scriptorium.
2. Temp dir + `package.json` con deps pinneadas + `.npmrc` de scopes `@zeus`/`@alephscript`.
3. `npm install --ignore-scripts --no-package-lock` (sin siblings, sin `file:`/`link:`/`workspace:`).
4. Lectura del `package.json` **instalado** (types/typings/exports) + presencia de `.d.ts` en disco.
5. `node` import dinámico del paquete desde el temp dir.
6. Grep de contaminación `S_LAB|file:|link:` en package.json/tsconfig del repo H.

Re-ejecutar:
```bash
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json
```

## Resumen

| estado | n | superficies |
| --- | --- | --- |
| VERDE | 10 | ciudad, authority-kit, rooms, player-mcp-kit, arg-domain, arg-runtime, arg-player-mcp, feed-kit, linea-kit, acta-kit-candidato |
| ROJO | 7 | ver tabla |

### linea-kit (re-verificación obligatoria)

```json
{
  "version": "0.4.0",
  "typesField": "./types/index.d.ts",
  "typingsField": null,
  "hasTypesInExports": true,
  "d_ts": "declared:./types/index.d.ts; disk:./types/index.d.ts,./types/curation.d.ts,./types/resolve.d.ts,./types/force-activation.d.ts,./types/validate.d.ts,./types/loader.d.ts,./types/tools/index.d.ts,./types/starterkits/index.d.ts,./types/viaje/index.d.ts; missing:./types/schemas/*.d.ts",
  "veredicto": "VERDE"
}
```

### Contaminación repo (S_LAB / file: / link:)

0 hits en package.json / tsconfig*.json / bunfig.toml / .npmrc (excl. skills).

Install limpio: exit 0

### Mutante DEVOLUCION #1 (types-en-exports sin `.d.ts` en disco)

- id: `mutant-types-exports-no-disk`
- input: `hasTypesInExports=true`, `dts_found=[]`, runtime OK
- veredicto: **ROJO / sin d.ts** · pass=true
- re-probe: `node scripts/rh-04-matriz-contratos.mjs --mutant`

## Matriz

| paquete | version_exacta | export_map | d.ts | runtime_import | owner | veredicto | evidencia | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| @zeus/ciudad | 0.1.1 | 11 keys: ., ./domain, ./contract, ./presencia, ./acta, ./jugadores, ./scene, ./misiones… | declared:./types/contract.d.ts; disk:./types/contract.d.ts,./types/domain.d.ts,./types/presencia.d.ts,./types/acta.d.ts,./types/jugadores.d.ts,./types/scene.d.ts,./types/misiones.d.ts,./types/cronista.d.ts,./types/salud.d.ts,./types/edificios.d.ts; missing:none | OK | G/Z (ciudad) | VERDE | npm view @zeus/ciudad@0.1.1 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.1; types=./types/contract.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  |  |
| @zeus/authority-kit | 0.4.2 | 2 keys: ., ./create-authority | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/create-authority.d.ts; missing:none | OK | Z (authority) | VERDE | npm view @zeus/authority-kit@0.4.2 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.4.2; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-l |  |
| @zeus/rooms | 0.1.2 | 1 keys: . | declared:./types/index.d.ts; disk:./types/index.d.ts; missing:none | OK | Z (rooms) | VERDE | npm view @zeus/rooms@0.1.2 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.2; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  (de |  |
| @zeus/player-mcp-kit | 0.1.4 | 1 keys: . | declared:./types/index.d.ts; disk:./types/index.d.ts; missing:none | OK | Z (player-mcp) | VERDE | npm view @zeus/player-mcp-kit@0.1.4 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.4; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package- |  |
| @zeus/arg-domain | 0.1.0 | 5 keys: ., ./contract, ./scenes/delta-v0, ./scenes/tap-cloaks, ./node | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/intents.d.ts,./types/scene.d.ts,./types/tap-cloaks.d.ts,./types/node.d.ts; missing:none | OK | G (delta) | VERDE | npm view @zeus/arg-domain name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.0; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  (dep | delta público tipado |
| @zeus/arg-runtime | 0.1.1 | 1 keys: . | declared:./types/index.d.ts; disk:./types/index.d.ts; missing:none | OK | G (delta) | VERDE | npm view @zeus/arg-runtime name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.1; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  (de | si existe publicado |
| @zeus/arg-view-kit | 0.1.0 | 3 keys: ., ./node, ./package.json | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/node.d.ts; missing:none | FAIL: node:internal/modules/esm/resolve:274
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\assets\room-client\room-client.browser.mjs' imported from C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p\node_modules\@zeus\view-kit\src\room.mjs
    | G (delta) | ROJO / runtime_import_fail | npm view @zeus/arg-view-kit name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.0; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  (d | si existe |
| @zeus/arg-player-mcp | 0.1.0 | 3 keys: ., ./server, ./package.json | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/server.d.ts; missing:none | OK | G (delta) | VERDE | npm view @zeus/arg-player-mcp name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.0; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock   |  |
| @zeus/arg-feeds | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-feeds name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-feeds - no such package a | si aplica; DocumentMachine surface |
| @zeus/feed-kit | 0.3.1 | 6 keys: ., ./families, ./synthetic, ./resolve, ./mcp, ./jetstream | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/families.d.ts,./types/synthetic.d.ts,./types/resolve.d.ts,./types/mcp.d.ts,./types/jetstream.d.ts; missing:none | OK | Z (feeds canal) | VERDE | npm view @zeus/feed-kit@0.3.1 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.3.1; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock   | canal tipado; no sustituye arg-feeds |
| @zeus/mockdatas-ciudad | 0.1.0 | 3 keys: ., ./package.json, ./volumes/volumes.json | none | OK | G (mockdatas) | ROJO / publicado-sin-types | npm view @zeus/mockdatas-ciudad name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.0; types=— \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  (deps: @zeus/ci |  |
| (candidatos: @zeus/onfalo, @zeus/onfalo-fixture, @zeus/fixtures-onfalo, onfalo, onfalo-fixture) | — | — | — | N/A (no package) | H/G (artefacto) | ROJO / pending_external_contract | npm view @zeus/onfalo version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/onfalo-fixture version --registry=https://npm.scriptorium.escrivivir.co → undefined \| npm view @zeus/fixtures-onfalo version --registry=https://npm.scriptorium.escrivivir.co → | artefacto Ónfalo pinneado |
| (candidatos: lore-hm-candidate, lore-hm, @logos/lore-hm, @alephscript/lore-hm-candidate) | — | — | — | N/A (no package) | S/lengua (externo) | ROJO / pending_external_contract | npm view lore-hm-candidate version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view lore-hm version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @logos/lore-hm version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @a | candidato LORE-HM |
| (candidatos: @zeus/provider-e, @zeus/analisis-e, provider-e) | — | — | — | N/A (no package) | E (externo) | ROJO / pending_external_contract | npm view @zeus/provider-e version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/analisis-e version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view provider-e version --registry=https://npm.scriptorium.escrivivir.co → E404 | provider E |
| @zeus/linea-kit | 0.4.0 | 10 keys: ., ./curation, ./resolve, ./force-activation, ./validate, ./loader, ./tools, ./starterkits… | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/curation.d.ts,./types/resolve.d.ts,./types/force-activation.d.ts,./types/validate.d.ts,./types/loader.d.ts,./types/tools/index.d.ts,./types/starterkits/index.d.ts,./types/viaje/index.d.ts; missing:./types/schemas/*.d.ts | OK | Z (línea/materialización) | VERDE | npm view @zeus/linea-kit@0.4.0 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.4.0; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock  | API canónica materializeRecorrido @ @zeus/linea-kit/viaje |
| (candidatos: @zeus/evidence-kit, @zeus/evidencia-kit, @zeus/hub-evidence, @zeus/ceremony-kit, @zeus/notaria-kit) | — | — | — | N/A (no package) | HUB (externo) | ROJO / pending_external_contract | npm view @zeus/evidence-kit version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/evidencia-kit version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/hub-evidence version --registry=https://npm.scriptorium.escrivivir.co → E4 | ceremonia/evidencia canónica; acta-kit medido aparte como candidato parcial |
| @zeus/acta-kit | 0.1.2 | 7 keys: ., ./tipos, ./emitir, ./validar, ./publicar, ./adoptar, ./huella | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/tipos.d.ts,./types/emitir.d.ts,./types/validar.d.ts,./types/publicar.d.ts,./types/adoptar.d.ts,./types/huella.d.ts; missing:none | OK | Z/HUB (candidato parcial) | VERDE | npm view @zeus/acta-kit@0.1.2 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.2; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-glge5p && npm install --ignore-scripts --no-package-lock   | tipado; no sustituye evidencia canónica HUB |

## Hipótesis del BRIEF vs observado

| expectativa BRIEF | observado |
| --- | --- |
| verde: ciudad | VERDE |
| verde: rooms | VERDE |
| verde: player-mcp-kit | VERDE |
| rojo hasta publicación: arg-domain | VERDE |
| rojo hasta publicación: arg-runtime | VERDE |
| rojo hasta publicación: arg-view-kit | ROJO / runtime_import_fail |
| rojo hasta publicación: arg-player-mcp | VERDE |
| rojo hasta publicación: artefacto-onfalo | ROJO / pending_external_contract |
| rojo hasta publicación: lore-hm-candidate | ROJO / pending_external_contract |
| rojo hasta publicación: provider-e | ROJO / pending_external_contract |
| rojo hasta publicación: ceremonia-evidencia-hub | ROJO / pending_external_contract |

## Criterio VERDE

VERDE solo si: paquete en registry + versión exacta en install limpio + export_map + types declarados (`types`/`typings` o types-en-exports) + **al menos un path de types declarado presente en disco** + runtime import OK + pollution 0. `hasTypesInExports=true` sin `.d.ts` en disco → **ROJO / sin d.ts** (no VERDE).
