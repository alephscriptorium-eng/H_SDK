# E1 · Matriz `@zeus/*` × types — medida contra el registry real · 2026-08-03

| dato | valor |
| ---- | ----- |
| Ficha | H03 (experimento E1 de `plan/VISION.md §6`) |
| Método | workflow: 8 medidores en paralelo (`npm view <pkg> version types exports --json` contra `npm.scriptorium.escrivivir.co`) + 1 verificador adversarial |
| Veredicto del verificador | **completo=true · 7/7 re-muestras coinciden · 0 discrepancias** |
| Cobertura | 33 paquetes candidatos (censo FC2 + games + startpacks) |

## Resumen

| estado | n | paquetes |
| ------ | - | -------- |
| types-en-exports | 8 | protocol (9/11 subpaths) · authority-kit (2/2) · player-mcp-kit (1/1) · presets-sdk (9/12) · http-contract (3/4) · reparto-kit (6/6) · **ciudad (11/11)** · **startpack-ciudad** |
| types-raiz | 9 | socket-core · rooms · room-client-browser · webrtc-signaling · ui-kit · ui-3d-kit¹ · view-kit · app-shell · game-engine |
| **publicado-sin-types** | **14** | playbook-kit · **linea-kit 0.3.0** · volumes-ops · firehose-core · feed-kit · story-board-schema · **acta-kit 0.1.1** · parte-kit · embajador-kit · lifecycle-kit · test-utils · **linea-system 0.1.1** · **force-system 0.1.1** · startpack-kit |
| **no-publicado** (E404 del registry, no error de red) | 2 | **pozo** · **solve-coagula** |

¹ `ui-3d-kit`: `types` raíz sin prefijo `./` (`src/index.d.ts`) — cosmético.

## Hallazgos

1. **La afirmación «todos los paquetes exponen tipos» es FALSA en el registry**:
   17 de 31 publicados exponen types; 14 no.
2. **Los cuatro objetivos de la cola B (U245–U249: linea-kit, acta-kit,
   linea-system, force-system) están sin types en el registry.** El
   «linea-kit ya está tipado» del recap era foto caducada u obra sin
   publicar. Owner: Z — se eleva como hallazgo (FC3 prohíbe tocar
   `packages/**` durante su campaña; no se arregla desde fuera).
3. **`@zeus/pozo` y `@zeus/solve-coagula` no están publicados**: el
   precedente «se construye solo importando engine» que Prueba-H-M sigue
   existe en el repo g-sdk pero **no en el canal**. Relevante para el
   patrón consumidor del juego H.
4. Los **kits UI del delta FC1 están todos tipados** (types-raiz + exports):
   la demo puede compilar estricto contra `game-engine`, `ui-3d-kit`,
   `view-kit`, `ui-kit`, `app-shell`, `room-client-browser`.
5. El fix de hoy ya consta en la medición: `ciudad@0.1.1` **11/11 subpaths**
   con types y `startpack-ciudad@0.1.1` con types (acta en g-sdk).
6. Parciales con huecos menores: protocol `./spec`+`./spec/build`,
   presets-sdk 3 subpaths, http-contract `./spec` — targets doc/spec en
   su mayoría.

## Matriz completa

| paquete | versión | estado | types |
| ------- | ------- | ------ | ----- |
| @zeus/protocol | 0.4.1 | types-en-exports (9/11) | ./types/index.d.ts |
| @zeus/authority-kit | 0.4.2 | types-en-exports (2/2) | ./types/index.d.ts |
| @zeus/player-mcp-kit | 0.1.4 | types-en-exports (1/1) | ./types/index.d.ts |
| @zeus/playbook-kit | 0.1.3 | publicado-sin-types | — |
| @zeus/socket-core | 0.2.0 | types-raiz (+3/3 exports) | ./types/index.d.ts |
| @zeus/rooms | 0.1.2 | types-raiz (+1/1) | ./types/index.d.ts |
| @zeus/room-client-browser | 0.1.4 | types-raiz (+3/3) | ./types/index.d.ts |
| @zeus/webrtc-signaling | 0.3.3 | types-raiz (+4/4) | ./types/index.d.ts |
| @zeus/linea-kit | 0.3.0 | **publicado-sin-types** (10 subpaths planos) | — |
| @zeus/volumes-ops | 0.2.4 | publicado-sin-types | — |
| @zeus/presets-sdk | 0.1.3 | types-en-exports (9/12) | ./src/types.d.ts |
| @zeus/firehose-core | 0.1.3 | publicado-sin-types | — |
| @zeus/feed-kit | 0.3.0 | publicado-sin-types | — |
| @zeus/http-contract | 0.1.3 | types-en-exports (3/4) | ./types/index.d.ts |
| @zeus/story-board-schema | 0.2.0 | publicado-sin-types | — |
| @zeus/reparto-kit | 0.1.0 | types-en-exports (6/6) | ./types/index.d.ts |
| @zeus/acta-kit | 0.1.1 | **publicado-sin-types** (0/7) | — |
| @zeus/parte-kit | 0.1.1 | publicado-sin-types (0/7) | — |
| @zeus/embajador-kit | 0.1.3 | publicado-sin-types (0/5) | — |
| @zeus/lifecycle-kit | 0.1.1 | publicado-sin-types (0/5) | — |
| @zeus/ui-kit | 0.1.3 | types-raiz (+2/2) | ./types/index.d.ts |
| @zeus/ui-3d-kit | 0.1.4 | types-raiz¹ (+2/2) | src/index.d.ts |
| @zeus/view-kit | 0.1.5 | types-raiz (+2/2) | ./types/index.d.ts |
| @zeus/app-shell | 0.2.3 | types-raiz (+5/5) | ./types/index.d.ts |
| @zeus/game-engine | 0.1.4 | types-raiz (+2/2) | ./types/index.d.ts |
| @zeus/test-utils | 0.1.3 | publicado-sin-types (0/1) | — |
| @zeus/linea-system | 0.1.1 | **publicado-sin-types** (0/2) | — |
| @zeus/force-system | 0.1.1 | **publicado-sin-types** (0/2) | — |
| @zeus/startpack-kit | 0.1.0 | publicado-sin-types | — |
| @zeus/startpack-ciudad | 0.1.1 | types-en-exports (2/2 código) | ./types/index.d.ts |
| @zeus/ciudad | 0.1.1 | types-en-exports (11/11) | ./types/contract.d.ts |
| @zeus/pozo | — | **no-publicado** (E404) | — |
| @zeus/solve-coagula | — | **no-publicado** (E404) | — |

Notas literales por paquete: journal del run `wf_5d044a33-2a4`
(9 agentes · 0 errores · 182k tokens · 139s).
