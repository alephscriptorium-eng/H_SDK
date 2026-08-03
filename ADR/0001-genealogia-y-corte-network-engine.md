# ADR 0001 · Genealogía y corte con NETWORK-ENGINE

**Estado**: aceptada (GO del PO, 2026-08-03).

h-sdk desciende **en método** del AOS Aleph — `NETWORK-ENGINE` (MAYÚSCULAS),
ancla de cita:
`C:\Users\aleph\OASIS\SCRIPTORIUM_V0\transmedia-system\SCRIPTORIUM-CORE\NETWORK-ENGINE`
(holón 04, sellado como fuente histórica por WP-SDK-L05).

**Decisión**: h-sdk nace **rehecho, no clonado** (la antigua es proto). Se
hereda la forma: Bun, TS estricto source-first (`strict`, `noEmit`,
`verbatimModuleSyntax`, imports `.ts`), hexágono core/edges, MODES
(MONKEY/AGI/ASI), disciplina ADR, Markdown-First. **Se corta toda relación**:
ni submodule, ni vendoring, ni rutas runtime hacia OASIS.

Cualquier pieza de la antigua puede **re-derivarse bajo demanda** con ADR
propio que cite ancla + commit (candidatas vistas: interfaz `PubSubBridge`,
deck MCP, DocumentStore F2, edge-graphdb). Nada entra por inercia.
