# RH-11b · types Z publicados — addenda

| dato | valor |
| ---- | ----- |
| agente | worker-RH-11b |
| fecha | 2026-08-03 |
| rama | `main` |
| nota Z | `C:/S_META/HSDK/NOTA-Z-TYPES-PUBLISH-2026-08-03.md` |
| eje(s) CA | IV |

## Qué se hizo

Incorporación en H de types publicados por Z (install limpio verificado en nota):

| paquete | pin | efecto en H |
| --- | --- | --- |
| `@zeus/linea-kit` | **0.4.0** | **VERDE tipado**; wire `crearPuertoMaterializacionLinea` → `materializeRecorrido` desde `@zeus/linea-kit/viaje` (inyectable / fail-closed) |
| `@zeus/acta-kit` | **0.1.2** | tipado pinneado; **no** cableado como evidencia HUB canónica |
| `@zeus/feed-kit` | **0.3.1** | **VERDE tipado** (canal); `@zeus/arg-feeds` sigue E404/private |

`pending_release_types` cerrado para linea / acta / feed-kit. Siguen
`pending_external`: LORE-HM, provider E, evidencia HUB canónica, arg-feeds.

## Frontera (sin mentir)

- H **no** inventa `line.materialize`.
- H **no** trata `acta-kit` como evidencia canónica HUB.
- H **no** implementa provider E ni notaría/ledger local.

## Matriz RH-04 (re-run)

Generado: 2026-08-03T17:15:35.787Z → **10 VERDE · 7 ROJO**.

VERDE nuevos/confirmados: `linea-kit@0.4.0`, `acta-kit-candidato@0.1.2`,
`feed-kit@0.3.1`. ROJO relevantes: `arg-feeds`, `provider-e`,
`ceremonia-evidencia-hub`, `lore-hm-candidate`, `artefacto-onfalo` (scan),
`mockdatas-ciudad` (sin types), `arg-view-kit` (runtime Node).

## Demo vertical

Sigue parando en `onfalo_selected` → `pending_external_contract` (provider E).
No avanza a `analyzed` / `line_materialized` hasta que E publique contrato
consumible; el puerto de línea queda listo unitariamente con fixture mínima.
