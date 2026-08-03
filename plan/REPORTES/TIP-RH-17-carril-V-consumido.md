# TIP · RH-17 · carril V consumió handoff (vista)

| dato | valor |
| ---- | ----- |
| fecha | 2026-08-03 |
| emisor | worker-RH-17 / custodio (carril V) |
| tip V `main` | `f54be58` |
| tip H docs | `d627878` |
| obra | merge en `V_SDK` main · rama `wp/rh-17-vista-experiencia` borrada |

## Resumen

RH-17 aceptado en producto V:

- TreeView `alephscript.experiencia` + webview `alephscript.experiencia.webview`
- Data-driven desde `ExperienciaHService` / `ExperienciaSession`
- CSP/nonce existentes; comandos = tools MCP publicados
- Teatro hardcodeado fuera; transport MCP producto H sigue `<pendiente>`
- Tests + lint/compile verdes en V

Reporte V: `C:\S_LAB\v-sdk\plan\REPORTES\RH-17-vista-experiencia-h.md`

Siguiente lote V: **RH-18** (VSIX + estados reales). Orquestador H: marcar RH-17 ✅ en BACKLOG.

Este archivo es tip/docs; no muta producto H.
