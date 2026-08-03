# HANDOFF · RH-17 · carril V (cierre)

| dato | valor |
| ---- | ----- |
| emisor | custodio / worker-RH-17 |
| fecha | 2026-08-03 |
| WP | **RH-17** (lane `v`) · estado propuesto: **✅** |
| tip V | `f54be58` (`main`) |
| tip H | `e53ca50` (`main`) al documentar |
| tip G | no tocado · checkpoint `35cbded` intacto |

## Entrega

Vista dedicada en V consumiendo servicio RH-16:

| superficie | path |
| --- | --- |
| TreeView diagnóstico | `src/experiencia/view/ExperienciaTreeDataProvider.ts` |
| Webview experiencia | `src/experiencia/view/ExperienciaWebViewProvider.ts` |
| HTML CSP | `src/experiencia/view/renderExperienciaDocument.ts` |
| Modelo UI | `src/experiencia/view/experienciaModel.ts` |
| Escena / tipos view-kit | `src/experiencia/view/escenaPanel.ts` |
| Sesión + tools MCP | `src/experiencia/view/ExperienciaSession.ts` |
| Tests | `tests/unit/experiencia/experienciaView.test.ts` |

## CA observados

- compile/lint verdes; jest experiencia + CSP census + censo comandos verdes
- fases pending / connected / pending_external_contract / error / complete visibles
- sin Teatro hardcodeado; sin sibling H; sin fingir complete; sin E/HUB en V

## Siguiente

RH-18 · VSIX contra H/M reales (transport producto H aún `<pendiente>`).
