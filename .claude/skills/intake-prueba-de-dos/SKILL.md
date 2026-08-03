---
name: intake-prueba-de-dos
description: >-
  Metodo para convertir un intake en un skill materializable con contrato
  minimo y ejemplo sintetico, sin inventar las partes aun no definidas.
---

# Skill · intake-prueba-de-dos

Metodo para pasar de una nota de intake a un skill utilizable: separa lo
definido de lo pendiente, escribe el contrato minimo y deja un ejemplo
sintetico que lo ejercite.

## Cuando aplicar

Cuando el agente deba:

1. Tomar un intake y convertirlo en un skill nuevo.
2. Dejar explicitado que falta definir sin rellenarlo por intuicion.
3. Entregar un paquete que ya pueda consumirse como metodo, aunque parte
   del comportamiento siga en `<pendiente>`.

## Pasos

1. Leer el intake de origen y listar lo que si esta definido.
2. Separar lo que falta por resolver y marcarlo como `<pendiente>`.
3. Redactar `reference/CONTRATO.md` con entradas, salidas y limites.
4. Escribir un ejemplo sintetico en `examples/` que no dependa de datos
   reales.
5. Verificar que el skill resultante se pueda leer de principio a fin sin
   ambiguedad de formato.

## Regla

Si el intake no fija una parte del comportamiento, no se inventa: se
deja como `<pendiente>` hasta que haya una fuente.

## Recursos

- `README.md` — puntero de consumo
- `reference/CONTRATO.md` — contrato minimo del skill
- `examples/fixture-intake-prueba-de-dos/` — ejemplo sintetico
