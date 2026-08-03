# BACKLOG (fixture SINTÉTICA) — cara que PASA

Serie sintética `FX-[A-Z]\d{2}`. Ningún dato de mundo real.

| dato | valor |
| ---- | ----- |
| serie | `FX-[A-Z]\d{2}` |
| prioridades | P0 · P1 · P2 |

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | Extraer el kit de plantillas a un paquete propio | un consumidor sintetico importa el kit y su probe imprime la plantilla resuelta con exit 0 | ninguna | I |
| **FX-A02** | P1 | Mover la validacion de entrada al adaptador unico | grep del simbolo devuelve 1 definicion; el probe de omision deniega el mensaje sin firma | FX-A01 | II, hostil-omite |

## Lane B · BETA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-B01** | P1 | Publicar la cara publica del kit de plantillas | el script de ceguera imprime `ceguera: 0` en arbol e historial | FX-A01, FX-A02 | ceguera |
| **FX-B02** | P2 | Segundo cliente independiente del contrato de plantillas | la suite del segundo cliente pasa en verde sin tocar al primero | FX-B01 | IV |

## Conteos

| prioridad | WPs |
| --------- | --- |
| P0 | 1 |
| P1 | 2 |
| P2 | 1 |
