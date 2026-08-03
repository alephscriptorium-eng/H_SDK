---
name: operador-rooms
description: >-
  Metodo para operar rooms con peercard, ACL y salud sin depender de
  memoria de sesion. Parametriza el mundo; si falta contrato, marca
  <pendiente>.
---

# Skill `operador-rooms`

Metodo para operar rooms de un mundo con evidencia trazable. La regla
base es resolver identidad, autorizacion y salud desde archivos o
endpoints declarados por el mundo; lo que no este contractualmente
definido se deja `<pendiente>`.

## Cuando aplicar

- Registrar o revalidar una room.
- Comprobar si un peer puede entrar o actuar segun la ACL.
- Emitir o revisar el estado de salud operativo de una room.
- Preparar una salida que pueda reproducirse sin memoria de sesion.

## Parametros del mundo

| parametro | significado |
| --------- | ----------- |
| `MUNDO_RAIZ` | raiz del mundo consumidor |
| `ROOM_DIR` | carpeta de definicion/estado de rooms |
| `PEERCARD` | ruta o endpoint de la peercard declarada |
| `ACL` | ruta o endpoint de la ACL declarada |
| `SALUD` | ruta o endpoint de salud declarada |
| `OUT_DIR` | carpeta de salida y evidencia |

Calibracion local obligatoria: si alguna ruta, formato o firma no esta
declarada en el mundo, dejarla como `<pendiente>` y detener la inferencia.

## Contrato minimo

### Peercard

- La identidad de la room se comprueba con una peercard trazada.
- Campos minimos conocidos: `id`, `sig`, `issuedAt`, `features`.
- Si el mundo define mas campos, se documentan en la calibracion local.
- Si la card no resuelve al peer esperado o le falta firma, falla
  cerrado.

### ACL

- Toda accion se compara contra la ACL del mundo antes de ejecutarse.
- Lo no listado se deniega por defecto.
- Si la semantica de grupos, rooms o verbos no esta documentada, dejar
  `<pendiente>`.
- La ACL vive en el canal trazado que el mundo declare (archivo, API o
  registry).

### Salud

- Salud es estado observable de la room, no intuicion del agente.
- Estados minimos: `OK`, `DEGRADED`, `FAIL`, `<pendiente>`.
- Una room sin senal de salud trazada no se declara `OK`.
- Los checks concretos los fija el mundo; este skill solo fija el fallo
  cerrado y la evidencia.

## Pasos

1. Leer la calibracion local del mundo.
2. Resolver peercard, ACL y senal de salud desde las rutas o endpoints
   declarados.
3. Verificar identidad con la peercard.
4. Validar permisos contra la ACL.
5. Evaluar salud y registrar evidencia literal.
6. Si falta contrato, parar y dejar `<pendiente>`; no inferir.

## Recursos

- `reference/peercard.md` - contrato de identidad
- `reference/acl.md` - contrato de autorizacion
- `reference/salud.md` - contrato de salud

## Ceguera de este skill

Este skill nombra su vocabulario de metodo: room, peercard, ACL y
salud. La prueba de ceguera aqui veta marcas de marco y memoria de
sesion, no el vocabulario propio. Lo no verificado se marca
`<pendiente>`.
