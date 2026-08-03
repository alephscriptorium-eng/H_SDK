# ARQUITECTURA R2 · «que la demo enseñe Scriptorium» — brief de re-obra

**Orden del PO**: sustituir toda proyección inventada por el mecanismo REAL de
Scriptorium. El server ya monta `/kit` (ui-3d-kit), `/view-kit`, `/game-engine`
— en R1 nadie los importaba. **En R2 se importan o se explica por qué no.**
Regla de honestidad intacta: lo que aún no está en canal (lengua candidato,
kit del playground, rooms server) se declara `pendiente`, no se finge.

## Mismo reparto de ficheros que R1 (un dueño por directorio)

| dueño | ficheros | misión R2 |
| ----- | -------- | --------- |
| W-SERVER-REAL | `server.mjs`, `public/index.html` | montar además `/zeus-ciudad/` → `node_modules/@zeus/ciudad/src/` y `/zeus-protocol/` → `node_modules/@zeus/protocol/` (verificar su entry browser-safe real leyendo su package.json); `/onfalo/` → `assets/onfalo/`; import map: `@zeus/ciudad/…`, `@zeus/protocol…`. **Endpoints node con paquetes reales** (probados: funcionan): `POST /api/acta` → `emitirActa`+`huellaLedger` de `@zeus/ciudad/acta` (usa node:crypto, por eso vive en server) · `POST /api/verificar` → re-verifica una cadena chain.ndjson recibida (recomputar digests, devolver veredicto) · `GET /onfalo/index.json` (lista de piezas) |
| W-CIUDAD-REAL | `public/js/ciudad/` | render con **ui-3d-kit real** (`/kit/`: scene-manager si encaja, node-mesh, link-corridor, anchor-marker — verificar exports leyendo `node_modules/@zeus/ui-3d-kit/src/`); proyección del mapa vía **`sceneFromGamemap` real** (`@zeus/ciudad/scene`, browser-safe, tipado) adaptando mapa.json→gamemap `{nodos,enlaces,anclas}`; conservar el urbanismo R1 que derive del dato (mesetas, avenidas de handoff) como capa estética SOBRE la escena real |
| W-BARRIO-REAL | `public/js/barrio/` | monigotes vía **`puppet/` de ui-3d-kit** (verificar el módulo real en `/kit/puppet/…`; fallback: stick-puppet de view-kit); estados de unidad = **BARRIO_ESTADOS + tipestate** como en R1 pero emitidos por el dominio real (ver W-CEREMONIA) |
| W-CEREMONIA-REAL | `public/js/ceremonia/domain.mjs` | **el corazón del R2**: (1) correr `createCiudadDomainState` real (`@zeus/ciudad/domain`, dominio puro browser-safe — verificar imports) con la escena real: H entra con `makeIntent(actor,'join',…)` REAL tipado `game:'ciudad'` y playerType por `jugadores` real; `walk` real hasta el barrio; **`wake` real con `horseMode:'stub'`** (modo REAL del dominio; 'horse' pleno queda `pendiente` hasta capability servida) — «ofrece tool vía horse cuando hay acta» es literal del dominio; (2) la ceremonia H·M usa los **nombres reales**: los 11 pasos de `barrio-lore-v1` y verbos de `reference/VERBOS.md` del playground (leer AMBOS read-only para extraer nombres exactos: `C:/S/scriptorium/playground/prueba-de-H-M/lib/ceremonia/constants.mjs` y `reference/VERBOS.md`; NO copiar código, solo las constantes de vocabulario con cita); (3) evidencia con **forma real**: dos cadenas H/ y M/ estilo `chain.ndjson` `{step, verb, object, causalDigest, wireDigest, activityId, side}`; (4) piezas del Ónfalo REALES desde `/onfalo/` (fetch del md, el análisis muestra extractos reales); (5) al cierre, **acta real** vía `POST /api/acta` y descarga de las dos chain.ndjson + acta.json |
| W-UI-REAL | `public/js/ceremonia/paneles.mjs`, `public/css/demo.css` | paneles sobre **view-kit real** (`/view-kit/`: panel.mjs, log-panel.mjs, hud.mjs, labels.mjs — verificar exports); conservar la estética R1 como tema encima; el ledger muestra las DOS cadenas (H oro / M verdigrís) |
| INTEGRADOR | `public/js/main.mjs` | recablear; humo igual que R1 + `curl POST /api/acta` con payload de prueba |

## Contratos que NO cambian

Firmas públicas de cada módulo (createCiudad/createBarrio/createCeremonia/
createPaneles/createFlujo) se conservan para que main.mjs sufra lo mínimo;
`flujo.mjs` NO se toca en R2 (su estética sirve igual sobre datos reales).

## Verificaciones relajadas (orden PO)

`node --check` + humo de server + un fetch real de cada endpoint nuevo. Nada más.
Cada worker anota en su resultado QUÉ mecanismo real quedó dentro y QUÉ quedó
`pendiente` con motivo (browser-unsafe, no publicado, etc.). Esa lista es
producto: es la frontera real/pendiente que la demo enseña.
