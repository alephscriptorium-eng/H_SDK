# BACKLOG (fixture SINTÉTICA) — dependencia circular corta (A → B → A)

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | Extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | FX-A02 | I |
| **FX-A02** | P1 | Cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | FX-A01 | II |
