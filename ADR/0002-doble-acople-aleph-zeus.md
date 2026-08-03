# ADR 0002 · Doble acople Aleph ↔ Zeus

**Estado**: aceptada (criterio del PO, 2026-08-03).

- **De Aleph, las formas, no el código** (ADR 0001).
- **De zeus, todo lo publicado**: registry `npm.scriptorium.escrivivir.co`,
  reglas de asimetría del zeus-bridge — solo lo publicado · outbound-only ·
  degradación limpia y declarada sin `@zeus/*` (replay ≠ conectado, jamás
  fallback silencioso) · **jamás vendorear/submodule**.
- Ninguna herencia tan estricta como para no aprovechar zeus; ningún idioma
  de zeus tan invasivo como para romper el hexágono.
- **Criterio del PO**: cuando z-sdk tenga paquete para el trabajo, usarlo
  **ES** el experimento — no se pregunta, se usa y se mide.
- Frontera de ownership adoptada de `REVISION-ALEPH-LORE-HM.md §1`: h-sdk es
  juego + experiencia + adapters/proyecciones; nunca lengua, provider,
  contracts ni notaría.
