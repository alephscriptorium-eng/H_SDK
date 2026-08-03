# BACKLOG (fixture SINTÉTICA) — la tabla vive indentada (bloque de código)

Documento que **documenta el formato** en vez de declarar WPs: la tabla va
indentada cuatro espacios, así que markdown la pinta como bloque de código y el
lector no la ve como tabla del backlog. Hermano del fence y del comentario: si
esto aprobara, cualquier guía de estilo sería un backlog despachable.

## Lane A · ALFA

    | WP | P | BRIEF | CA | deps | ejes |
    | -- | - | ----- | -- | ---- | ---- |
    | **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
    | **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | FX-A01 | II |
