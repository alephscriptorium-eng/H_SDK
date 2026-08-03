---
titulo: front-matter que no es backlog
tabla: |
  | WP | P | BRIEF | CA | deps | ejes |
  | -- | - | ----- | -- | ---- | ---- |
  | **FX-A01** | P0 | colada en el front-matter | el probe devuelve exit 0 | ninguna | I |
---

# BACKLOG (fixture SINTÉTICA) — envolturas HTML y front-matter

Front-matter, `<pre>`, `<details>` y tres espacios + tabulador: la misma familia
de siempre. Se cierran por **estructura de bloque** (CommonMark), no
enumerando formas nuevas.

<pre>
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A02** | P0 | colada en un bloque pre | el probe devuelve exit 0 | ninguna | I |
</pre>

<details>
<summary>tabla plegada</summary>
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A03** | P0 | colada en un details sin linea en blanco | el probe devuelve exit 0 | ninguna | I |
</details>

## Lane A · ALFA

   	| WP | P | BRIEF | CA | deps | ejes |
   	| -- | - | ----- | -- | ---- | ---- |
   	| **FX-A04** | P0 | colada con tres espacios y un tabulador | el probe devuelve exit 0 | ninguna | I |
