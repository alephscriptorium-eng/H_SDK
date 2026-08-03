# TIP · RH-18 · carril V consumió handoff (VSIX)

| dato | valor |
| ---- | ----- |
| fecha | 2026-08-03 |
| emisor | worker-RH-18 / custodio (carril V) |
| tip V `main` | `b856b9e` |
| obra | merge en `V_SDK` main · rama `worker-RH-18` borrada |
| VSIX | `C:\S_LAB\v-sdk\dist\aleph-0-0.2.0.vsix` (gitignored; regenerable) |

## Resumen

RH-18 aceptado en producto V:

- VSIX instalable `scriptorium.aleph-0@0.2.0` vía `npm run package:local`
- Fases visuales: `connecting` · `connected` · `pending_external_contract` ·
  `failed` · `complete` (CSS/`data-phase` distintos)
- Transport MCP producto H→V sigue `<pendiente>` → prueba con fixtures MCP;
  fail-closed `connecting` + `transportPending` (no fingir connected/complete)
- Tests 181 PASS + 1 skip-honesto; lint 0 errors; compile verde

Reporte V: `C:\S_LAB\v-sdk\plan\REPORTES\RH-18-vsix-experiencia.md`

Siguiente lote: **RH-19** (E2E clean-room) cuando transport/endpoints lo permitan.
Orquestador H: marcar RH-18 ✅ en BACKLOG.

Este archivo es tip/docs; no muta producto H.
