# TIMBRE · hub Faro (SALA)

Campanilla — no buzón. Contrato: PROTOCOLO §7.
Append-only de líneas `PING …`. El dueño (Faro) puede rotar a
`notas/timbre-<fecha>.md`.

Formato (citado indentado a propósito — no debe matchear `^PING `):

    PING <YYYY-MM-DD HH:MM> · DE=<X> · HILO=<id|-> · REF=<ruta absoluta de la nota>

Append con encoding UTF-8 sin BOM; REF con `/`. Watchers: **vivos**
(`/mundos/faro/estacion/timbre-watch.log`).

## Pings

---
PING 2030-01-05 10:12 · DE=NOR · HILO=- · REF=/mundos/nor/sincronia/notas/NOTA-NOR-2030-01-05-censo-piezas.md
PING 2030-01-05 11:40 · DE=SUR · HILO=- · REF=/mundos/sur/sincronia/notas/NOTA-SUR-2030-01-05-contraste-censo.md
