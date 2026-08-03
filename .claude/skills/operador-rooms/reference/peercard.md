# Peercard

Contrato de identidad para una room.

## Regla

La room solo se considera identificada cuando existe una peercard
trazada y esta resuelve al peer esperado. No se apoya en memoria de
sesion.

## Campos minimos conocidos

- `id`
- `sig`
- `issuedAt`
- `features`

Si el mundo exige mas campos, se declaran en la calibracion local del
consumidor. Si el contrato real no esta documentado, dejar
`<pendiente>`.

## Fallo cerrado

- Peercard ausente: `FAIL`
- Firma ausente o invalida: `FAIL`
- Identidad no coincide: `FAIL`
- Contrato no declarado: `<pendiente>`
