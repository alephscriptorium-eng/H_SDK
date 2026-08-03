# BACKLOG (fixture SINTÉTICA) — segunda cara VÁLIDA: deps con enlace markdown

Escribir la dependencia como enlace (`[FX-A01](#fx-a01)`) es formato, no otra
dependencia. El linter resuelve el texto del enlace: no inventa un
`dep-inexistente` por la sintaxis, y los CA con enlaces o rutas siguen leyéndose.

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | ninguna referencia al simbolo antiguo queda en el arbol | [FX-A01](#fx-a01) | II |
| **FX-A03** | P2 | cerrar el acceso a la sala sin rol declarado | ningun usuario sin rol puede abrir la sala | [FX-A02](#fx-a02), FX-A01 | hostil-omite |
