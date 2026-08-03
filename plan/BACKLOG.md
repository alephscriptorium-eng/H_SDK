# BACKLOG · h-sdk — olas H0–H3 (nada se despacha sin GO)

> **CORRECCIÓN DE RUMBO (2026-08-03, orden del PO)**: la demo es una
> **adaptación de delta para ciudad, en el barrio Lore, sobre la
> DocumentMachine, con V como interfaz de H** — ver
> [`design/RECAP-SPEC-DEMO.md`](../design/RECAP-SPEC-DEMO.md). Lo construido
> en `packages/game-prueba-hm/` queda como **boceto terminado** (piezas
> rescatables listadas en el recap). Las olas H2/H3 se re-derivan tras medir
> delta y el patrón de webview/teatro de V.

Fuente de diseño: [`VISION.md`](VISION.md) (§6 experimentos E1–E6, §7 olas).

## H0 · Fundación (en curso)

| ficha | qué | CA | estado |
| ----- | --- | -- | ------ |
| H01 | raspa + ADR 0001/0002 + plan | mundo git limpio, espejo skills commiteado | ✅ 2026-08-03 (`c8703e7`; repo `H_SDK` + submodule en hub) |
| H02 | estación calibrada + handoffs por skill | `plan/ESTACION.md` con los 8 skills | ✅ 2026-08-03 (espejo 8/8 tras 0.12.0) |
| H03 | **E1** sondeo de tipos desde registry (`npm view @zeus/*` + `tsc` estricto contra `.d.ts`) | matriz paquete×types con evidencia | ✅ 2026-08-03: matriz 33/33 con verificador adversarial (0 discrepancias) — `plan/REPORTES/E1-MATRIZ-TYPES-ZEUS.md`. Hallazgos mayores: cola B (linea/acta/linea-system/force-system) **sin types en registry**; pozo y solve-coagula **sin publicar**; kits UI todos tipados |
| H04 | reporte a G: gap de `types` en `ciudad`/`startpack-ciudad` (decisión ④) | nota entregada al owner | ✅ 2026-08-03 **resuelto en origen**: g-sdk `wp/g-ciudad-types` fusionada, 0.1.1 publicados con `types` (acta `g-sdk/plan/REPORTES/ACTA-TYPES-CIUDAD-0.1.1.md`; de paso, guard del publish corregido a versión exacta) |
| H05 | consumo del candidato de lengua cuando la notaría publique (decisión ①) | `tsc --noEmit` verde contra el candidato | ⬜ bloqueada por publicación |

## H1 · Gamemap habitado

| ficha | qué | CA |
| ----- | --- | -- |
| H10 | `packages/adapter-zeus` mínimo (protocol/game-engine/ui-3d-kit) | compila estricto desde registry |
| H11 | adapter `mapa.json→gamemap` (**E2**) | 24 barrios + calles de `handoffEdges`; round-trip ids/digests |
| H12 | adapter `units→puppets+clips` (**E3**) | tipestate→cuerpo según VISION §4; derivado del catálogo, no lista manual |
| H13 | gamemap navegable hasta el barrio 20 con monigote (**E6** parcial) | `wake` emitido solo tras `grant→materialize` |

## H2 · Ceremonia jugable

| ficha | qué | CA |
| ----- | --- | -- |
| H20 | `packages/game-domain`: compilador `guion→Activities` | los 10 turnos compilan; frase fuera de gramática no compila |
| H21 | El Descenso: cámara por planos, ceguera ascendente (niebla+clamp), llave/acta como trayectorias | vista-M no puede ascender; H sí |
| H22 | ceremonia completa: leases, denegación atómica, Alpha/Beta, cremallera bilateral, acta a la NOTARÍA, restart→recupera | evidencia verificada; **E5** |

## H3 · El final bonito

| ficha | qué | CA |
| ----- | --- | -- |
| H30 | **una línea real del Ónfalo** de punta a punta (analyze → line.materialize) | cristal en la red semántica + cadena verificada + transcript descargable |
| H31 | M vivo por `@zeus/player-mcp-kit` + rooms (**E4**) | modo conectado declarado, fail-closed |
| H32 | parte legible del evidence/report (`@zeus/parte-kit`) | render estricto del JSON |
| H33 | log FM completo en escena (huecos, ausencias, hilos onfaloTrace) | cada elemento de VISION §4.1 renderizado desde datos, no decorado |
