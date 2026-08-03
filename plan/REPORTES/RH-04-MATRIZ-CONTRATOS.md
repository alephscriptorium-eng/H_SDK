# RH-04 · MATRIZ CONTRATOS (install limpio)

Generado: 2026-08-03T14:11:41.822Z
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
| VERDE | 4 | ciudad, authority-kit, rooms, player-mcp-kit |
| ROJO | 12 | ver tabla |

### linea-kit (re-verificación obligatoria)

```json
{
  "version": "0.3.0",
  "typesField": null,
  "typingsField": null,
  "hasTypesInExports": false,
  "d_ts": "none",
  "veredicto": "ROJO / publicado-sin-types"
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
| @zeus/ciudad | 0.1.1 | 11 keys: ., ./domain, ./contract, ./presencia, ./acta, ./jugadores, ./scene, ./misiones… | declared:./types/contract.d.ts; disk:./types/contract.d.ts,./types/domain.d.ts,./types/presencia.d.ts,./types/acta.d.ts,./types/jugadores.d.ts,./types/scene.d.ts,./types/misiones.d.ts,./types/cronista.d.ts,./types/salud.d.ts,./types/edificios.d.ts; missing:none | OK | G/Z (ciudad) | VERDE | npm view @zeus/ciudad@0.1.1 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.1; types=./types/contract.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package-lock  |  |
| @zeus/authority-kit | 0.4.2 | 2 keys: ., ./create-authority | declared:./types/index.d.ts; disk:./types/index.d.ts,./types/create-authority.d.ts; missing:none | OK | Z (authority) | VERDE | npm view @zeus/authority-kit@0.4.2 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.4.2; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package-l |  |
| @zeus/rooms | 0.1.2 | 1 keys: . | declared:./types/index.d.ts; disk:./types/index.d.ts; missing:none | OK | Z (rooms) | VERDE | npm view @zeus/rooms@0.1.2 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.2; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package-lock  (de |  |
| @zeus/player-mcp-kit | 0.1.4 | 1 keys: . | declared:./types/index.d.ts; disk:./types/index.d.ts; missing:none | OK | Z (player-mcp) | VERDE | npm view @zeus/player-mcp-kit@0.1.4 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.4; types=./types/index.d.ts \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package- |  |
| @zeus/arg-domain | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-domain name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-domain - no such package | delta público tipado |
| @zeus/arg-runtime | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-runtime name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-runtime - no such packa | si existe publicado |
| @zeus/arg-view-kit | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-view-kit name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-view-kit - no such pac | si existe |
| @zeus/arg-player-mcp | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-player-mcp name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-player-mcp - no such |  |
| @zeus/arg-feeds | — | — | — | N/A | G (delta) | ROJO / pending_external_contract | npm view @zeus/arg-feeds name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2farg-feeds - no such package a | si aplica |
| @zeus/mockdatas-ciudad | — | — | — | N/A | G (mockdatas) | ROJO / pending_external_contract | npm view @zeus/mockdatas-ciudad name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → E404 (exit 1): {
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://npm.scriptorium.escrivivir.co/@zeus%2fmockdatas-ciudad - no  |  |
| (candidatos: @zeus/onfalo, @zeus/onfalo-fixture, @zeus/fixtures-onfalo, onfalo, onfalo-fixture) | — | — | — | N/A (no package) | H/G (artefacto) | ROJO / pending_external_contract | npm view @zeus/onfalo version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/onfalo-fixture version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/fixtures-onfalo version --registry=https://npm.scriptorium.escrivivir.co → E404 | artefacto Ónfalo pinneado |
| (candidatos: lore-hm-candidate, lore-hm, @logos/lore-hm, @alephscript/lore-hm-candidate) | — | — | — | N/A (no package) | S/lengua (externo) | ROJO / pending_external_contract | npm view lore-hm-candidate version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view lore-hm version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @logos/lore-hm version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @a | candidato LORE-HM |
| (candidatos: @zeus/provider-e, @zeus/analisis-e, provider-e) | — | — | — | N/A (no package) | E (externo) | ROJO / pending_external_contract | npm view @zeus/provider-e version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/analisis-e version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view provider-e version --registry=https://npm.scriptorium.escrivivir.co → E404 | provider E |
| @zeus/linea-kit | 0.3.0 | 10 keys: ., ./curation, ./resolve, ./force-activation, ./validate, ./loader, ./tools, ./starterkits… | none | OK | Z (línea/materialización) | ROJO / publicado-sin-types | npm view @zeus/linea-kit@0.3.0 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.3.0; types=— \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package-lock  (deps: @zeus/ciu | re-verificar types en manifest instalado |
| (candidatos: @zeus/evidence-kit, @zeus/evidencia-kit, @zeus/hub-evidence, @zeus/ceremony-kit, @zeus/notaria-kit) | — | — | — | N/A (no package) | HUB (externo) | ROJO / pending_external_contract | npm view @zeus/evidence-kit version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/evidencia-kit version --registry=https://npm.scriptorium.escrivivir.co → E404 \| npm view @zeus/hub-evidence version --registry=https://npm.scriptorium.escrivivir.co → E4 | ceremonia/evidencia canónica; acta-kit medido aparte como candidato parcial |
| @zeus/acta-kit | 0.1.1 | 7 keys: ., ./tipos, ./emitir, ./validar, ./publicar, ./adoptar, ./huella | none | OK | Z/HUB (candidato parcial) | ROJO / publicado-sin-types | npm view @zeus/acta-kit@0.1.1 name version types typings exports main module --registry=https://npm.scriptorium.escrivivir.co → version=0.1.1; types=— \|\| cd C:\Users\aleph\AppData\Local\Temp\rh04-matriz-nxrHeY && npm install --ignore-scripts --no-package-lock  (deps: @zeus/ciud | publicado; no sustituye evidencia canónica tipada |

## Hipótesis del BRIEF vs observado

| expectativa BRIEF | observado |
| --- | --- |
| verde: ciudad | VERDE |
| verde: rooms | VERDE |
| verde: player-mcp-kit | VERDE |
| rojo hasta publicación: arg-domain | ROJO / pending_external_contract |
| rojo hasta publicación: arg-runtime | ROJO / pending_external_contract |
| rojo hasta publicación: arg-view-kit | ROJO / pending_external_contract |
| rojo hasta publicación: arg-player-mcp | ROJO / pending_external_contract |
| rojo hasta publicación: artefacto-onfalo | ROJO / pending_external_contract |
| rojo hasta publicación: lore-hm-candidate | ROJO / pending_external_contract |
| rojo hasta publicación: provider-e | ROJO / pending_external_contract |
| rojo hasta publicación: ceremonia-evidencia-hub | ROJO / pending_external_contract |

## Criterio VERDE

VERDE solo si: paquete en registry + versión exacta en install limpio + export_map + types declarados (`types`/`typings` o types-en-exports) + **al menos un path de types declarado presente en disco** + runtime import OK + pollution 0. `hasTypesInExports=true` sin `.d.ts` en disco → **ROJO / sin d.ts** (no VERDE).
