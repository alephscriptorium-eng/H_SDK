# ADDENDA-EJEMPLO-LOCK · fixture multi-carril (sintética)

Ejemplo de elevación por `index.lock` sostenido. Sin datos de instancia.

# ADDENDA-lock-demo · Rn-gobierno · freeze por lock

## §interna

Pulso: `index.lock` presente en el root de gobierno durante ≥3 ciclos del
watcher. Shape asumida: freeze pushes de gobierno en ambos carriles +
elevar. No mezclar con hallazgos de obra en esta addenda (otra addenda
si hace falta).

## §WP

## Parte 1 · Vista PO/SCRUM

ESTADO: GO=⛔; CHECK_LOCK=✅; PASS_HIGIENE=⛔ BLOQUEADO

### Qué cambió

- ✅ El mismo `index.lock` apareció durante tres ciclos.
- ⛔ Los pushes de gobierno y los despachos nuevos quedan congelados.

### Qué sigue

- ⏳ Inspeccionar procesos git y esperar dos ciclos limpios.
- ⛔ No matar procesos ni workers a ciegas.

### Decisión del custodio

- ⏳ Autorizar la investigación del lock o mantener el freeze.

## Parte 2 · Handoff operativo

```markdown
BACKLOG
- Incidente sin alta: lock sostenido en `Rn-gobierno`.

GATES
ESTADO: GO=⛔; CHECK_LOCK=✅; PASS_HIGIENE=⛔ BLOQUEADO
- Requerir 0 `index.lock` / `HEAD.lock` durante 2 ciclos consecutivos.

ALCANCES
- Freeze de pushes de gobierno en carriles activos.
- No despachar trabajo nuevo ni matar procesos a ciegas.

SECUENCIA
1. Inspeccionar procesos git.
2. Resolver el lock sin intervenir workers vivos.
3. Observar dos ciclos limpios.
4. Registrar fin del freeze con etiqueta `Rn-gobierno`.
```

## Prueba de ceguera

```text
# Fixture: patrón local del custodio sobre §WP → 0 matches
```
