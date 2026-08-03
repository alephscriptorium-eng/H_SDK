# BACKLOG (fixture SINTÉTICA) — quinta cara VÁLIDA: región declarada

Cierre estructural (opt-in): el mundo declara dónde empieza y acaba su backlog,
y **todo lo de fuera se ignora por construcción**. Con esto, la familia de
envolturas deja de importar: lo de arriba y lo de abajo no se lintea aunque
tenga forma de tabla.

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-Z99** | P9 | tabla de ejemplo FUERA de la region | ejemplo | ninguna | I |

<!-- backlog:inicio -->

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | FX-A01 | II |

<!-- backlog:fin -->

## Anexo (fuera de la región)

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-Z98** | P9 | otra tabla fuera de la region | ejemplo | ninguna | I |
