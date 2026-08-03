# BACKLOG (fixture SINTÉTICA) — `deps` que no declara nada

«las dos anteriores» y «las mismas del WP anterior» son prosa: no dicen de qué depende el WP ni
declaran que no depende de nada. Ignorarlas en silencio sería cambiar un falso
rechazo por una **omisión silenciosa** — exactamente lo que la holgura de `deps`
no puede permitirse. La ausencia se declara.

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | las dos anteriores | II |
| **FX-A03** | P1 | publicar la cara publica del kit de plantillas | el script de ceguera imprime `ceguera: 0` en arbol e historial | las mismas del WP anterior | ceguera |
