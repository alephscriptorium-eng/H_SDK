# Contrato minimo

Este skill convierte un intake en un paquete de skill consumible. El
contrato solo fija lo necesario para materializar la entrega; si el
intake no define una parte, se deja como `<pendiente>`.

## Entradas

- `intake` original, en texto.
- `nombre del skill` a materializar.
- `alcance` declarado por el intake.
- `carpeta destino` del skill nuevo.

## Salidas

- `SKILL.md` con frontmatter valido.
- `README.md` como puntero de consumo.
- `reference/CONTRATO.md` con el minimo acordado.
- `examples/fixture-intake-prueba-de-dos/` con ejemplo sintetico.

## Reglas

1. No inventar comportamiento que el intake no describa.
2. Todo hueco de definicion va como `<pendiente>`.
3. El ejemplo debe ser sintetico y no depender de datos reales.
4. El skill debe poder leerse sin saltos de contexto externos.

## Pendientes habituales

- `proposito exacto`: `<pendiente>`
- `criterio de aceptacion`: `<pendiente>`
- `limite de uso`: `<pendiente>`

## Forma de revision

Revisar que el skill nuevo tenga contrato, puntero de consumo y ejemplo
antes de considerarlo materializable.
