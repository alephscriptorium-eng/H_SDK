# BACKLOG (fixture SINTÉTICA) — contradicciones declaradas

Decir «ninguna» y a la vez nombrar dependencias, o «ninguno» y a la vez listar
ejes, no es una omisión: es una declaración que se contradice. El linter no
elige por el autor cuál de las dos mitades vale.

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | ninguna, FX-A01 | II |
| **FX-A03** | P1 | publicar la cara publica del kit de plantillas | el script de ceguera imprime `ceguera: 0` en arbol e historial | ninguna | ninguno, ceguera |
