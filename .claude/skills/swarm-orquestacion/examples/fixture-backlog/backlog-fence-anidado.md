# BACKLOG (fixture SINTÉTICA) — cuarta cara VÁLIDA: fence anidado

Un documento que **enseña el formato** en un fence de cuatro backticks que
contiene otro de tres, y **después** declara sus WPs de verdad. Con un toggle
ingenuo, el fence interior «cerraría» el exterior y el backlog real quedaría
velado entero: falso rechazo. Con la regla de CommonMark (mismo carácter,
longitud ≥ la apertura), el bloque se cierra donde debe y la tabla real se
lintea.

````markdown
```
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-Z99** | P9 | ejemplo de la guia, no es un WP | ejemplo | ninguna | I |
```
````

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | FX-A01 | II |
