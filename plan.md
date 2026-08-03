## Plan: Recuperación real de Prueba-H-M

Recuperar la demo desde el estado efectivo, no desde las declaraciones documentales: preservar primero las obras unstaged de H y G; convertir en paquetes publicados y tipados únicamente las costuras genéricas de delta que pertenecen a G; reconstruir H como composición TypeScript/Bun realmente alcanzable que consume Ciudad, delta, M, lengua/provider y evidencia por sus canales propietarios; y hacer que V sea la única interfaz mediante resources MCP. El boceto `.mjs` y la adaptación G actual quedan como evidencia, nunca como base integrable.

**Estado de partida verificado**
- `C:\S_LAB\h-sdk` está en `main`, con cero cambios staged y toda la fundación TypeScript/configuración unstaged. `npm run demo` sólo alcanza `packages/game-prueba-hm/server.mjs`; no alcanza `packages/core` ni `packages/edge-zeus`.
- `C:\S_LAB\g-sdk` está en `wp/g-prueba-hm-adaptacion`, con cero cambios staged y toda la adaptación delta→Ciudad/Lore/DocumentMachine unstaged. La rama no contiene todavía commits propios de la adaptación.
- `C:\S_LAB\v-sdk` está limpio en `main` y no contiene integración H.
- Contratos publicados ya disponibles: `@zeus/ciudad@0.1.1`, `@zeus/player-mcp-kit@0.1.4` y `@zeus/rooms@0.1.2` con declaraciones TypeScript.
- El edge H actual no respeta el wire real: Ciudad espera `walk {anchorId|nodeId}`, `announce {message}` y `wake {tool,barrioId?,horseMode}` emitido por un actor unido y posicionado; H envía `destino`, `mensaje` y un actor sintético `h-sdk`.
- La obra G actual no es clean-room: `document-machine.mjs` busca el Ónfalo en un checkout hermano H, crea un ledger local y depende del checkout Z para el launcher.
- `@zeus/arg-domain`, `@zeus/arg-feeds`, `@zeus/arg-player-mcp` y `@zeus/arg-console` son hoy paquetes privados sin `types`; no son una membrana consumible por H.
- V ya tiene `MinimalMcpClient`, `ResourceProjectionService`, CSP de webviews y proyección de resources. El Teatro actual está hardcodeado y sus interfaces `IPlay`/`ICompany` no gobiernan esa vista; no será la costura inicial.

**Matriz de disposición**

| Disposición | Elementos | Tratamiento |
| --- | --- | --- |
| Conservar | ADR/fundación de H; Bun/TS estricto; `Resultado`, ids opacos y estado explícito de acople; contratos publicados Zeus; cliente/proyección MCP y seguridad webview de V | Revalidar y hacerlos alcanzables; no promover puertos/payloads sólo porque compilan |
| Extraer | Parametrización genérica de escena, orillas, nav y proyección iniciada en G; composición de autoridad de `arg-demos`; renderer de grifos/ríos/mar; pruebas y datos de `ciudad-v0`; manifiesto sellado del Ónfalo; conductas útiles del server boceto | Convertir en paquetes/fixtures del owner correspondiente o en casos de aceptación; nunca copiar código entre repos |
| Demoler | `demo` de H apuntando a `.mjs`; `TransporteZeus` y payloads paralelos actuales; contratos de cadena/notaría definidos por H; sibling discovery y ledger local de G; integración G actual como bloque; UI DOM de H; Teatro hardcodeado como interfaz H | Eliminar de la rama de recuperación una vez preservado el checkpoint; mantener sólo historia y trazabilidad |
| Rehacer | Superficie delta pública y tipada en G; composición H TypeScript alcanzable; adapters exactos Ciudad/delta/M/provider/evidencia; proyección MCP H; vista V dedicada y data-driven | Implementar por gates, con confirmación de estado/ledger y sin fallback de runtime |

**Steps**

### Fase 0 · Preservación y línea base
1. Revisar los cambios unstaged de H y G para excluir secretos, outputs y dependencias generadas; ejecutar sólo checks read-only de línea base. Crear en las ramas actuales los checkpoints aprobados: uno en `h-sdk/main` rotulado como fundación no alcanzable/no validada como producto, y otro en `g-sdk/wp/g-prueba-hm-adaptacion` rotulado como adaptación forense no integrable. Registrar hash, padre, `diff --stat`, checks ejecutados y limitaciones en `C:\S_META\HSDK\REPLAN-PRUEBA-HM-REACHABILITY.md`. Confirmar luego `git status` limpio en ambos repos.
2. No fusionar esos checkpoints. Crear ramas de ejecución separadas: H desde su checkpoint para reemplazar la superficie; G desde el padre del checkpoint para reaplicar sólo piezas genéricas; V desde `main`. Conservar intactas las ramas checkpoint como red de recuperación. *Depende de 1.*
3. Corregir en el dossier y en la planificación H todas las afirmaciones falsas de “cero violaciones”, “listo” o “product-reachable”. Añadir una tabla por artefacto con `committed`, `reachable`, `observed`, `clean-room` y `owner-correct`; sólo cinco positivos permiten declarar producto. *Depende de 1; puede avanzar en paralelo con 2.*

### Fase 1 · Gates de contratos y publicaciones
4. Construir una matriz ejecutable desde un install limpio de H con versiones exactas, export maps, `.d.ts`, runtime import y owner para: Ciudad, authority-kit, rooms, player-mcp-kit, delta domain/runtime/view/player, mockdatas Ciudad, artefacto Ónfalo, candidato LORE-HM, provider E, línea/materialización y ceremonia/evidencia HUB. Prohibir `paths` a siblings, `file:`, `link:`, `workspace:` externos y `.d.ts` ambientales. Estado inicial esperado: Ciudad/rooms/player-mcp-kit verdes; delta público, Ónfalo publicado, lengua/provider y evidencia canónica rojos hasta publicación. `@zeus/linea-kit@0.3.0` debe volver a verificarse porque el manifest instalado no declara `types`.
5. Definir el contrato de aceptación entre repos sin copiar shapes: G publica tipos delta; los owners de Ciudad/lengua/provider/evidencia publican sus contratos; H sólo publica su proyección propia versionada para V o sirve su JSON Schema como resource; V consume esa proyección y los tipos visuales delta. Cualquier ausencia permanece `pending_external_contract` visible en V y bloquea el gate final, sin implementación local de contingencia. *Depende de 4.*

### Fase 2 · Producto G: delta configurable y consumible
6. En la rama G limpia, reaplicar la parametrización genérica de escena a `createArgDomainState`, reducer, nav y proyecciones, manteniendo `delta-v0` como default idéntico. Extraer `ciudad-v0` a fixture de aceptación/configuración H; no fusionar sus 697 líneas como verdad de G. Añadir pruebas de paridad delta y una escena mínima distinta para demostrar que no quedan ids de `grifo-a`, orillas o cantera congelados. *Depende de 2 y 4.*
7. Promover `@zeus/arg-domain` como paquete público con `.d.ts` para escena, estado, intents, feeds y snapshots. Extraer de `arg-demos/apps/authority/index.mjs` un paquete público `@zeus/arg-runtime` que componga `@zeus/authority-kit` con escena/feed/gamemap inyectados y sea dueño del wire dual, tick, snapshot y shutdown. H no copiará launcher ni cableado de rooms. *Depende de 6.*
8. Extraer del `arg-console` un `@zeus/arg-view-kit` browser-safe y tipado para grifos, ríos, mar, gotas y cantera, sin servidor, rooms ni contenido Lore. Convertir `@zeus/arg-player-mcp` en una factory pública/configurable y tipada construida sobre `@zeus/player-mcp-kit`, con escena y actor inyectados y resources estándar. Mantener las apps `arg-console`/`arg-demos` privadas. *Depende de 6; runtime, view y player pueden desarrollarse en paralelo.*
9. Rechazar de la publicación G `document-machine.mjs` tal como existe: sin búsqueda de `../h-sdk`, sin lectura implícita por ancestros, sin ledger/notaría local y sin fallback a copias. Conservar sus tests de gotas, sellos y excavación como especificación para el adapter H, alimentados por dependencias/fixtures explícitos. Publicar y verificar tarballs exactos de `arg-domain`, `arg-runtime`, `arg-view-kit` y `arg-player-mcp`; el gate G sólo abre tras instalación y typecheck en un directorio sin H/Z siblings. *Depende de 7 y 8.*

### Fase 3 · Artefactos y owners externos
10. Publicar/pinnear el Ónfalo como artefacto read-only con piezas, manifest, media types y hashes; publicar/verificar `@zeus/mockdatas-ciudad` con los volúmenes Lore necesarios. El consumidor recibe una API o ruta de package resuelta, nunca una ruta de checkout. La verificación del sello debe usar el manifest del paquete y producir identidad de artefacto/version/hash. *Puede avanzar en paralelo con 6-9.*
11. Obtener por sus owners las publicaciones tipadas del candidato LORE-HM, provider E y ceremonia/evidencia/materialización canónica. Si `@zeus/linea-kit` no expone la operación/tipos requeridos, elevar el gap al owner; H no implementa `line.materialize`, provider, digest, cremallera, notaría ni un ledger sustituto. *Puede avanzar en paralelo con 6-10; bloquea 15.*

### Fase 4 · Reconstrucción H alcanzable
12. Rehacer `packages/core` como máquina de estados de la experiencia, sin schemas Zeus/HUB: `idle → ciudad_connected → lore_reached → barrio_awake → delta_running → onfalo_selected → analyzed → line_materialized → evidence_verified → complete`, con errores/pending explícitos. Definir sólo puertos de caso de uso H: entrada Ciudad confirmada, sesión delta, análisis E, materialización de línea, evidencia canónica y publicación de proyección. Eliminar `EntradaCadena`, `PuertoActa` y cualquier shape externo paralelo si no son dominio propio H. *Depende de 5 y de los contratos verdes correspondientes.*
13. Sustituir el edge genérico actual por edges de owner claro: Ciudad usa `@zeus/ciudad.makeIntent`/`EVENTS` y confirma state/ledger; delta usa los paquetes G publicados; M configura la factory `@zeus/arg-player-mcp`/`player-mcp-kit` y exige `connected + lastStateTs`; análisis llama al provider E; línea y evidencia delegan a paquetes canónicos. No considerar `connected` la mera presencia de un objeto transporte. *Depende de 9-11 y 12.*
14. Crear un composition root TypeScript/Bun alcanzable, por ejemplo `packages/app-prueba-hm/src/main.ts`, que arranque Ciudad como entrada, abra la sesión delta sólo después de reach/wake confirmado, asiente M y exponga resources MCP versionados de estado, escena y evidencia para V. Cambiar el comando raíz a Bun/TS y retirar `packages/game-prueba-hm` del producto alcanzable; sus assets sólo se eliminan después de que 10 esté publicado y verificado. Añadir un test de reachability que pruebe que el entrypoint importa core y todos los edges requeridos. *Depende de 12 y 13.*
15. Implementar el vertical mínimo real: actor entra en Ciudad, camina al ancla Lore/DocumentMachine, despierta el barrio con tool válido, la autoridad delta arranca con escena/configuración Lore, M se une por MCP, una pieza sellada del Ónfalo se selecciona, el provider E produce análisis bajo LORE-HM, la línea se materializa por el owner canónico y la evidencia se verifica. Cualquier dependencia ausente detiene el flujo y queda visible; no existe modo demo replay. *Depende de 10, 11 y 14.*

### Fase 5 · V como única interfaz
16. En V, crear un servicio de experiencia H sobre `MinimalMcpClient`/`ResourceProjectionService`: descubrir el servidor H por catálogo, listar y leer resources; validar versión/shape publicado; modelar `pending`, `connected`, `error` y `complete` sin datos hardcodeados. No importar H por sibling ni reutilizar `IPlay`/`ICompany` hasta que gobiernen una runtime real. *Puede iniciar con fixtures MCP tras 5; integración real depende de 14.*
17. Crear una vista V dedicada (TreeView para diagnóstico y webview para la experiencia) usando el CSP/nonce existentes. Renderizar Ciudad como entrada, la escena delta mediante `@zeus/arg-view-kit`, estado de M, identidad/hash del Ónfalo, análisis, línea y evidencia. Los comandos de control llaman tools MCP publicados; H no contiene paneles HTML. Mantener el Teatro hardcodeado fuera del cambio. *Depende de 8, 14 y 16.*
18. Empaquetar una VSIX de V y probarla contra H/M reales. La vista debe distinguir visualmente `pending_external_contract`, `connecting`, `connected`, `failed` y `complete`; no puede mostrar éxito con resources stale ni inventar actores/escenas. *Depende de 15 y 17.*

### Fase 6 · Cierre integral
19. Ejecutar la demo desde checkouts limpios de H y V, con sólo packages pinneados, registry y endpoints configurados. Prohibir que existan `C:\S_LAB\g-sdk`, `z-sdk` o rutas playground en la resolución. Capturar versiones, commit hashes, health, `lastStateTs`, ids de state/ledger, hash Ónfalo, salida del provider, id de línea y veredicto de evidencia. *Depende de 15 y 18.*
20. Actualizar RECAP, backlog y decisiones con la nueva verdad de reachability; cerrar o reescribir H10-H33. Declarar la demo sólo si se observó completa desde V. El checkpoint, el boceto y la obra G original quedan referenciados como evidencia histórica, no como alternativas operativas. *Depende de 19.*

**Relevant files**
- `C:\S_META\HSDK\REPLAN-PRUEBA-HM-REACHABILITY.md` — acta forense, hashes, matriz de disposición y gates.
- `C:\S_LAB\h-sdk\package.json` — retirar entrypoint Node `.mjs`, pinnear contratos y hacer alcanzable el composition root Bun/TS.
- `C:\S_LAB\h-sdk\packages\core\src\` — reemplazar contratos paralelos por máquina de experiencia y puertos H.
- `C:\S_LAB\h-sdk\packages\edge-zeus\src\` — desmontar payloads incorrectos; dividir adapters por owner.
- `C:\S_LAB\h-sdk\packages\game-prueba-hm\` — boceto cerrado; extraer evidencia/assets y retirarlo del runtime.
- `C:\S_LAB\h-sdk\design\RECAP-SPEC-DEMO.md`, `C:\S_LAB\h-sdk\plan\BACKLOG.md`, `C:\S_LAB\h-sdk\plan\DECISIONES.md` — verdad de alcance y criterios finales.
- `C:\S_LAB\g-sdk\packages\delta\arg-domain\src\domain-state.mjs`, `reducer.mjs`, `scenes\delta-v0.mjs` — escena inyectable y contrato tipado.
- `C:\S_LAB\g-sdk\packages\delta\arg-demos\apps\authority\index.mjs` — fuente para extraer `@zeus/arg-runtime`, no código a copiar en H.
- `C:\S_LAB\g-sdk\packages\delta\arg-console\assets\js\` — fuente para el view kit genérico.
- `C:\S_LAB\g-sdk\packages\delta\arg-player-mcp\` — factory delta sobre `@zeus/player-mcp-kit`.
- `C:\S_LAB\g-sdk\packages\delta\arg-feeds\src\document-machine.mjs` y `C:\S_LAB\g-sdk\packages\delta\arg-domain\src\scenes\ciudad-v0.mjs` — fuentes forenses a descomponer, no integrar como están.
- `C:\S_LAB\g-sdk\packages\mockdatas-ciudad\package.json` — publicación pinneada de materia Ciudad.
- `C:\S_LAB\v-sdk\src\mcp\client.ts`, `C:\S_LAB\v-sdk\src\resources\ResourceProjectionService.ts` — costura MCP existente a extender.
- `C:\S_LAB\v-sdk\src\views\TeatroWebViewProvider.ts` y `C:\S_LAB\v-sdk\src\webview\security.ts` — patrón de lifecycle/CSP; no reutilizar datos Teatro hardcodeados.
- `C:\S_LAB\v-sdk\package.json` — registrar vista/comandos H y dependencias publicadas.

**Verification**
1. Preservación: `git status` limpio, hashes de checkpoint y `git show --stat` registrados; cero secretos/generated en commits.
2. G: `npm run test:delta`; pruebas nuevas de paridad `delta-v0`, escena inyectada, runtime y player MCP; `npm pack --dry-run`; install+import+typecheck de tarballs en directorio aislado; e2e sin siblings.
3. H: `bun install --frozen-lockfile`, `bun run typecheck`, unit tests de la máquina y adapters, gate de imports (`core` sin `@zeus`/Node IO; H-owned source sin `.mjs`), test de reachability del entrypoint y smoke conectado con confirmación state/ledger.
4. V: `npm run lint`, `npm run compile`, tests unitarios de parseo/resources/estados, `npm run test:exthost`, `npm run package:local`; instalar VSIX y observar transición real hasta `complete`.
5. E2E clean-room: ejecutar sin checkouts hermanos; verificar Ciudad join/walk/wake, delta grifos/mar, health M `connected + lastStateTs`, sello Ónfalo, provider E real, materialización canónica, evidencia verificada y representación completa en V.
6. Gate de declaración: buscar rutas absolutas/sibling, fallbacks locales, assets copiados, payloads inventados y claims “ready”; cualquier hallazgo impide cerrar la demo.

**Decisions**
- Preservación aprobada: commits checkpoint en las ramas actuales antes de separar trabajo.
- Interfaz aprobada: vista V respaldada por resources MCP; no Teatro/IPlay en la primera costura.
- Gate aprobado: H no implementa el producto delta hasta consumir una superficie G publicada, tipada y pinneada.
- H es game/experience/adapters/projections; no posee lengua, provider, contracts de plataforma, notaría ni ceremonia HUB.
- `game-prueba-hm` no se itera; G no se integra como está; V no muestra datos hardcodeados.
- “Conectado” exige evidencia observable; “compila” y “existe en disco” no equivalen a product-reachable.

**Scope boundaries**
- Incluye: preservación, descomposición G, publicaciones tipadas, vertical H real, M por el kit publicado, artefactos pinneados, interfaz V y E2E clean-room.
- Excluye: revivir El Descenso/ceguera/holones, copiar el Teatro actual, desarrollar provider/lengua/notaría en H, fusionar la rama G completa, usar workspaces/siblings como runtime, o declarar demo parcial como terminada.
