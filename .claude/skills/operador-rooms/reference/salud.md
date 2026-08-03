# Salud

Contrato de estado operativo para una room.

## Regla

La salud se observa, no se supone. Si no hay senal trazada, no se
declara `OK`. La lectura no depende de memoria de sesion.

## Estados minimos

- `OK`
- `DEGRADED`
- `FAIL`
- `<pendiente>`

## Criterio

- `OK`: la room responde segun el check declarado por el mundo.
- `DEGRADED`: responde, pero con una alerta o limitacion declarada.
- `FAIL`: no responde o incumple el check minimo.
- `<pendiente>`: no existe contrato suficiente para clasificar.

## Evidencia

Registrar siempre la senal leida y la decision tomada. Si la fuente de
salud no esta declarada, dejar `<pendiente>` en vez de inferir.
