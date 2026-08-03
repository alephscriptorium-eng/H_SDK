# RECAP · La demo según el PO — derivada SOLO de la conversación

> Corrección de rumbo (2026-08-03). Este fichero sustituye todo marco
> inventado. Regla: cada elemento de la spec lleva la palabra del PO de la
> que se deriva. Lo que no se derive de aquí, no entra.

## La spec, con sus fuentes

| elemento | palabra del PO (paráfrasis fiel) |
| -------- | -------------------------------- |
| **Qué es** | «La demo NO es "el descenso", es una **adaptación de "delta" para el juego "ciudad"**, en concreto para el **barrio Lore** y en particular para la **DocumentMachine**» |
| Nombre | el juego **«Prueba-H-M»**, acoplado a la constitución de games |
| Base | **delta** como «punto de partida para base donde agregar lo nuevo» |
| Marco | «partimos del juego **Ciudad** como entrada» (rabbit, walk, plaza, wake con tool, actas) |
| Materia | la **DocumentMachine** y sus monigotes; «tenemos que **modelizar el flujo de nuestro lenguaje**» |
| Final | «que hemos podido **procesar mínimamente alguna de las líneas del Ónfalo**» |
| **Interfaz** | «**V es la interfaz de H, sin ella nada tiene sentido**» — el Zigurat (paneles, teatro, elenco, sockets) |
| Estilo | monigotes; «retomar la **escena de los grifos, el mar**» (la de delta) |
| Mecánica federadora | **rabbit-spiders-horses** (pregunta directa del PO; tríada real de ciudad/delta) |
| Método | «**implemente scriptorium**» — mecanismo real donde exista; pendiente declarado donde no (Future Machine NO CORRE) |
| M | asiento **`@zeus/player-mcp-kit`** (decisión ③) |
| Membrana | el **registry** (criterio: usar el paquete z-sdk ES el experimento) |

## Lo que fue invención mía y MUERE

1. «El Descenso» como nombre, marco y dramaturgia vertical de la demo.
2. La escenografía de holones superiores como sustituto del juego (era, a lo
   sumo, un mecanismo de representación; no la demo).
3. El render de ciudad propio en lugar de partir del juego delta real
   (arg-domain/arg-console con su flow engine, mar vivo, tablero/jugador).
4. Los paneles DOM propios como interfaz de H — **la interfaz de H es V**.
5. La cámara/ceguera como mecánica estrella no pedida.

## El boceto queda TERMINADO (no es la demo)

`packages/game-prueba-hm/` tal como está hoy = **boceto cerrado**
(commits `9296c39`+`9c030f5`). No se itera más sobre él como si fuera la
demo. Piezas rescatables SOLO si la adaptación las pide: el server de
import maps + endpoints reales (`/api/acta`, `/api/verificar`, `/onfalo`),
`puente-zeus` (browser-safety de `@zeus/ciudad`), la corrida del dominio
real en navegador, tipestate→clips, y los datos (mapa sellado, piezas
selladas del Ónfalo).

## La adaptación (esqueleto, pendiente de medición)

- **delta aporta**: el juego base — dominio de flujo (gotas→mar vivo→
  cristales, grifos como válvulas), vistas tablero/jugador (arg-console),
  MCP-por-actor (arg-player-mcp), bots rabbit/spider/horse.
- **ciudad aporta**: el dominio de entrada (join/walk/announce/wake/sleep +
  acta) — ya probado real en navegador.
- **el barrio Lore aporta**: las units de la DocumentMachine, el Ónfalo,
  la lengua para modelizar el flujo.
- **V aporta**: el asiento de H — el juego se ve y se opera desde el
  Zigurat, y el teatro (`IPlay`: actos/escenas/cast) es candidato natural
  para representar el guion.
- **A medir antes de plan**: cómo corre delta hoy (launch, rooms, qué está
  publicado de `packages/delta/*`), y el patrón exacto de webview/teatro
  en v-sdk para asentar la vista de H.
