# ACL

Contrato de autorizacion para operar rooms.

## Regla

Toda accion se compara contra la ACL del mundo antes de ejecutarse. Lo
no listado se deniega por defecto. No se usa memoria de sesion para
decidir permisos.

## Forma

El mundo puede declarar la ACL como archivo, endpoint o registry. Este
skill no fija el formato; si falta contrato, se marca `<pendiente>`.

## Comprobacion minima

1. Identificar el peer y la room.
2. Leer la ACL declarada.
3. Resolver si la accion esta permitida.
4. Denegar por defecto cuando haya duda o falta de contrato.

## Fallo cerrado

- ACL ausente: `FAIL`
- Semantica no documentada: `<pendiente>`
- Accion no permitida: `DENY`
