# DEVOLUCIÓN · RH-04 · contrarrevisión adversarial

Fecha: 2026-08-03  
Veredicto: **DEVUELTO** (no aceptación)

## Defectos numerados

1. `scripts/rh-04-matriz-contratos.mjs` · `verdictFor`: concede VERDE si `hasTypesInExports===true` aunque `dts_found` esté vacío y no exista en disco el `.d.ts` declarado. Mutante reproducible → VERDE. Viola MOTIVO_RIESGO (falso verde) y hostil-omite (ausencia no deniega).

## Remedios exigidos

- Exigir presencia en disco del path de types (top-level o exports) antes de VERDE.
- Re-ejecutar sensor; regenerar `RH-04-MATRIZ-CONTRATOS.md`, JSON y reporte.
- Añadir caso/test o probe documentado del mutante que debe quedar ROJO.

Misma rama: `wp/rh-04-matriz-contratos` · worktree `C:/S_LAB/wt/h-rh-04`.
