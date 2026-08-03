# BACKLOG (fixture SINTÉTICA) — `<details><summary>` en una línea

La forma común de plegar en markdown: la etiqueta abre y la línea sigue. Un
bloque HTML tipo 6 de CommonMark solo exige que la línea **empiece** por la
etiqueta, así que la tabla de dentro no se renderiza y no declara WPs. Exigir
que la etiqueta ocupara la línea entera era implementar el contrato más estrecho
de lo que dice.

<details><summary>Backlog v1 (obsoleto)</summary>
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
</details>

<div align="center">Otra envoltura que abre y sigue en la misma linea
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A02** | P0 | colada tras un div con contenido | el probe devuelve exit 0 | ninguna | I |
</div>
