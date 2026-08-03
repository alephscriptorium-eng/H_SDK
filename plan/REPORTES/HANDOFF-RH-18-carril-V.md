# HANDOFF · RH-18 · carril V (cierre)

| dato | valor |
| ---- | ----- |
| emisor | custodio / worker-RH-18 |
| fecha | 2026-08-03 |
| WP | **RH-18** (lane `v`) · estado propuesto: **✅** |
| tip V | `b856b9e` (`main`) |
| tip G | no tocado · checkpoint `35cbded` intacto |

## Entrega

| ítem | valor |
| --- | --- |
| VSIX path | `C:\S_LAB\v-sdk\dist\aleph-0-0.2.0.vsix` |
| extension-id | `scriptorium.aleph-0@0.2.0` |
| fases UI | connecting · connected · pending_external_contract · failed · complete |
| prueba H/M reales | no — transport `<pendiente>` |
| evidencia | fixtures MCP + reporte RH-18 |

## CA observados

- VSIX empaquetado e instalable (`package:local`)
- Transición observada hasta estados reales vía fixtures, o fail-closed
  honesto documentado (transport pendiente → `connecting` + `transportPending`)
- Sin éxito con resources stale; sin actores/escenas inventados; sin Teatro
- lint 0 errors · compile verde · 181 tests related PASS · 1 skip-honesto

## Bloqueos transport

| bloqueo | owner |
| --- | --- |
| Transport MCP producto H→V (endpoint en catálogo) | H |
| LORE-HM / provider E / evidencia HUB | owners externos (RH-11) |

## Siguiente

RH-19 · demo clean-room (bloqueado por transport H→V + gaps externos).
