# BACKLOG (fixture SINTÉTICA) — `~~~` no cierra un fence de backticks

CommonMark: el fence de cierre es el **mismo carácter**, de longitud ≥ la
apertura y sin nada más en la línea. Con un toggle ingenuo, la línea de tildes
«cerraría» el bloque y la tabla de abajo aprobaría — pero markdown no la
renderiza: sigue dentro del bloque de código.

```
texto de ejemplo dentro del bloque
~~~
| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | ninguna | I |
```
