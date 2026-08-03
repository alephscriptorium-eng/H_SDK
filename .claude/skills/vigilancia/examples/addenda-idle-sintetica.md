# ADDENDA-IDLE-EJEMPLO · R7-obra · fixes retroactivos

Fixture sintética; no contiene observaciones de una instancia.

## §interna

Durante quietud, dos gates locales repetidos señalan el mismo residuo técnico.
El vigía lo clasifica como candidato retroactivo y propone una ola al custodio.
No edita backlog, no abre trabajo, no implementa ni acepta. La comprobación
online queda bloqueada en este laboratorio sin red.

## §WP

## Parte 1 · Vista PO/SCRUM

ESTADO: GO=✅; CHECK_LOCAL=✅; PASS_LOCAL=✅; C8=⛔ BLOQUEADO

### Qué cambió

- ✅ Dos ejecuciones locales reprodujeron el residuo y el control negativo no
  lo reprodujo.
- ✅ El candidato quedó agrupado por causa para evitar fixes aislados.

### Qué sigue

- ⏳ El custodio puede autorizar que el orquestador contraste solapamientos y
  forme una ola pequeña.
- ⛔ La evidencia online sigue bloqueada; no se presenta como PASS.

### Decisión del custodio

- ⏳ Decidir si eleva la propuesta ahora o espera otra muestra idle.

## Parte 2 · Handoff operativo

```markdown
BACKLOG
- Candidato retroactivo sin alta: agrupar dos residuos por causa común.

GATES
ESTADO: GO=✅; CHECK_LOCAL=✅; PASS_LOCAL=✅; C8=⛔ BLOQUEADO
- Local determinista: PASS.
- C8 online: bloqueado, sin verificar.

ALCANCES
- Proponer y elevar solamente; no editar backlog, abrir trabajo, implementar
  ni aceptar.

SECUENCIA
1. Contrastar el candidato con colas existentes.
2. Decidir aceptación, adaptación o espera.
3. Si se autoriza, proyectar una ola con CA por clase.
4. Mantener C8 separado hasta disponer del canal real.
```

## Prueba de ceguera

La comprobación se ejecuta solo sobre `§WP` con el vocabulario prohibido que
calibre el consumidor. Resultado requerido antes de mediar: `0` coincidencias.
