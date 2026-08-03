# BACKLOG (fixture SINTÉTICA) — dependencia circular larga (A → B → C → A)

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | Extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | FX-A02 | I |
| **FX-A02** | P1 | Cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | FX-A03 | II |
| **FX-A03** | P1 | Publicar la cara publica del kit de plantillas | el script de ceguera imprime `ceguera: 0` en arbol e historial | FX-A01 | ceguera |

## Lane B · BETA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-B01** | P2 | Segundo cliente independiente del contrato de plantillas | la suite del segundo cliente pasa en verde sin tocar al primero | FX-A01 | IV |
