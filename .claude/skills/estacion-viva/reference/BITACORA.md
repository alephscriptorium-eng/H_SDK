# BITÁCORA — contrato de línea

La bitácora es la **única fuente** del estado de estación tras el boot
(fase 2). Este skill documenta el contrato; **no** reimplementa el
editor del mundo.

## Forma publicable

- Unidad = **línea** (una entrada append-only).
- Formato mínimo (fixture y consumidores):

```text
# bitácora de estación (líneas)
YYYY-MM-DDTHH:MM:SSZ | <autor> | <evento> | <payload-opcional>
```

- Extensión típica en fixture: `bitacora/linea.mdl` (markdown-line).
- El consumidor puede usar otro path; lo declara en calibración local.

## Autoría

- La autoría de líneas nuevas pasa por el **editor MCP del mundo**
  (herramienta tipo linea-editor / preset del mundo).
- El skill `estacion-viva` **lee** la bitácora para regenerar estado;
  no escribe líneas en nombre del editor.
- Si el mundo no tiene editor MCP aún, el operador puede sembrar líneas
  a mano en la fixture; el contrato de regeneración no cambia.

## Asiento de fundación (bitácora ausente)

Cuando un mundo **nuevo** no tiene bitácora todavía, el boot no falla: la
siembra con un único **asiento de fundación** (ver `BOOT.md` fase 2,
«Degradación · bitácora ausente»). Forma mínima:

```text
# bitácora de estación (líneas)
YYYY-MM-DDTHH:MM:SSZ | estacion | fundacion | perfil=<jugador|vigia>
```

- Es **una** línea append-only: la cabecera documentada + un evento
  `fundacion` con `ts` UTC y autor = la propia estación (no un editor de
  contenido de juego).
- De ese asiento la fase 2 deriva el **estado inicial** (tick-cero: sin
  acumulados). No añade líneas de más ni fabrica historia.
- Las líneas **posteriores** ya pasan por el editor MCP del mundo (arriba,
  «Autoría»); el asiento de fundación es la excepción de arranque, sembrada
  por la estación para que la regeneración tenga una fuente no vacía.

## Regeneración sin drift

1. Leer todas las líneas válidas de la bitácora (ignorar vacías y
   comentarios `#`… salvo cabecera documentada).
2. Reducir a un estado canónico (último evento por clave + acumulados
   que el mundo declare).
3. Escribir **un** fichero de estado en `OUT_DIR` (p. ej.
   `estado.json`).
4. Prohibido mantener un segundo almacén paralelo que el boot no
   regenere.

El script `reproduce-boot.sh` demuestra el paso 2→3 sobre la fixture
`examples/fixture-tick-cero/`.

## Qué no es este contrato

- No es un ledger de juego ni un repositorio de peercards.
- No sustituye al skill de vigilancia (bitácora del vigía ≠ bitácora de
  estación).
- No nombra mundos reales ni el marco.
