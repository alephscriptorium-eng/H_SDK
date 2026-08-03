# RECAP · La demo según el PO — derivada SOLO de la conversación

> Corrección de rumbo (2026-08-03). Este fichero sustituye todo marco
> inventado. Regla: cada elemento de la spec lleva la palabra del PO de la
> que se deriva. Lo que no se derive de aquí, no entra.

> **RH-03:** este RECAP **no** declara producto ni demo lista.
> «Boceto TERMINADO» ≠ product-reachable. Tabla y regla de cinco flags:
> `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` §8.

> **RH-20 (verdad de reachability · 2026-08-03):** la demo **NO** está
> completa desde V. Observación RH-19 = fail-closed PASS con
> `pending_external_contract` (cero `complete`). Checkpoint H/G, boceto
> `game-prueba-hm` y obra G original = **evidencia histórica**, no
> alternativas operativas. Acta:
> [`../plan/REPORTES/RH-19-E2E-CLEAN-ROOM.md`](../plan/REPORTES/RH-19-E2E-CLEAN-ROOM.md).

## Veredicto reachability (RH-19 → RH-20)

| eje | estado observado | ancla |
| --- | ---------------- | ----- |
| Composition Bun/TS + edges registry | alcanzable hasta PARAR en owners | tip H `0f429f2` (acta tip obra `5fadbb4`); `bun run demo` → `pending_external_contract` |
| Transport MCP H→V | vivo; resources `0.1.0` | `bun run mcp` · tips H~`5fadbb4` · V `27a98ef` · SMOKE_OK |
| Vista V / MinimalMcpClient | lee estado real; fase ≠ complete | RH-19 §2.7 · tip V `27a98ef` |
| Provider E / LORE-HM | **pending_external_contract** | RH-11 · ELEV-E-HUB |
| Línea (input E) | **pending** (API tipada; falta E) | `linea-kit@0.4.0` · bloquea `line_materialized` |
| Evidencia HUB canónica | **pending_external_contract** | acta-kit ≠ HUB · ELEV-E-HUB |
| Room Ciudad viva | stub en path demo | RH-19 G4 |
| Demo `complete` desde V | **NO observada** | `completeFingido: false` |

**Frase de veredicto:** *reachability real hasta `pending_external_contract` (E / línea-sin-E / HUB); demo NO completa desde V.*

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
6. **Implementar la parte H en `.mjs` plano** contra el mandato explícito del
   PO («typescript y su mundo de layers… ponlo en modo ASI», «la interfaz no
   será html5 sino ya bien typescript», «pero bun, su hexagon») y contra el
   propio `ADR/0001` de este mundo. El idioma `.mjs` es correcto en los
   mundos de zeus/g (y en la obra de adaptación dentro de delta); el código
   propio de H es **TypeScript estricto source-first, Bun, hexágono
   core/edges, MODES** — la raspa de network-engine rehecha.

## El boceto queda TERMINADO (evidencia histórica · no es la demo)

`packages/game-prueba-hm/` tal como está hoy = **boceto cerrado**
(commits `9296c39`+`9c030f5`). No se itera más sobre él como si fuera la
demo. **[RH-03 · RH-20]** TERMINADO(boceto) **no** implica product-reachable,
«cero violaciones» ni demo observada desde V. Queda referenciado solo como
**evidencia histórica** (guion / assets), no como alternativa operativa ni
entrypoint de producto. El **artifact publicado** «Prueba de H·M — Barrio
LORE» queda re-etiquetado en su propia cabecera como *boceto/espec del panel
de ceremonia*: conserva el guion rescatado de `HANDOFF-DEMO.md` (su valor
real) y el lenguaje visual aprobado por el PO; no representa la demo.

Igual tratamiento histórico (no operativo): checkpoint H
`e53694e` / G `wp/g-prueba-hm-adaptacion@35cbded` y la obra G de adaptación
tal cual (`document-machine` sibling) — ver REPLAN §1–2 y plan.md step 20.

## La adaptación (estado post RH-01…20)

- **delta aporta (publicado tipado):** `@zeus/arg-domain@0.1.0`,
  `arg-runtime@0.1.1`, `arg-view-kit@0.1.0`, `arg-player-mcp@0.1.0` —
  consumidos por H/V vía registry (RH-06…10, RH-15).
- **ciudad aporta:** entrada join/walk/announce/wake con wire real
  (RH-13/15); room viva socket = stub en el path demo documentado (RH-19 G4).
- **barrio Lore / Ónfalo:** fixture pinneado `@zeus/onfalo-fixture@0.1.1`
  sellado observado; LORE-HM + provider E = **pending_external** (owners).
- **V aporta:** asiento MCP de H (TreeView + webview + VSIX); transport
  producto cerrado; **no** muestra `complete` con gaps abiertos.
- **No declarar** producto ni demo terminada mientras falten E / línea-con-E /
  HUB y la observación `complete` desde V (decisión ⑥ + ⑧).
