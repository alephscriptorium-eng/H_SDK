# ADDENDA-EJEMPLO · fixture sintética (no es dato real)

Fixture mínima para ejercitar el formato. No proviene de ninguna sesión.

## §interna

Hallazgo de laboratorio: un worktree bajo `.worktrees/demo-orphan` aparece
en disco sin registro en `git worktree list` durante ≥3 ciclos, con
contenido y `.git`, mtime vivo, mientras el orquestador relanzó el mismo
WP. Clasificación **(c)** — elevar al custodio. No hablar con el swarm.
Carril de laboratorio: `Rn-obra`.

## §WP

## Parte 1 · Vista PO/SCRUM

ESTADO: GO=⏳; CHECK_LOCAL=✅; PASS_HIGIENE=⛔ BLOQUEADO

### Qué cambió

- ✅ Una carpeta no registrada mantuvo `.git` y mtime vivo durante tres
  ciclos.
- ⛔ La higiene del carril permanece bloqueada.

### Qué sigue

- ⏳ Inspeccionar su HEAD en quietud y recuperar trabajo útil o limpiar el
  residuo.
- ⛔ No relanzar ni despachar mientras persista.

### Decisión del custodio

- ⏳ Autorizar la inspección en quietud o mantener el freeze.

## Parte 2 · Handoff operativo

```markdown
BACKLOG
- Hallazgo sin alta: huérfano activo bajo `.worktrees/demo-orphan`.

GATES
ESTADO: GO=⏳; CHECK_LOCAL=✅; PASS_HIGIENE=⛔ BLOQUEADO
- Exigir ≥2 ciclos antes de elevar un huérfano no vacío.
- Tras resolución, watcher sin `!!HUERFANO` durante 2 ciclos.

ALCANCES
- Un solo carril: `Rn-obra`.
- No relanzar trabajo ni editar backlog desde vigilancia.

SECUENCIA
1. Inspeccionar HEAD del huérfano en quietud.
2. Recuperar trabajo útil o limpiar el residuo.
3. Contrastar `git worktree list` con `.worktrees/`.
4. Exigir higiene §8 en PASS antes del siguiente despacho.
```

## Prueba de ceguera

```text
# Sobre solo §WP (fixture): vocabulario prohibido del marco = 0
# (el consumidor sustituye el patrón por el de su PRACTICAS)
awk '/^## §WP$/{on=1} /^## Prueba de ceguera$/{on=0} on' \
  examples/addenda-sintetica.md |
  rg -n 'MARCO_PROHIBIDO_PLACEHOLDER'
→ 0 matches en §WP tras redacción
```

Nota: este ejemplo usa un placeholder a propósito; la prueba real la corre
el vigía con el patrón local del custodio antes de mediar.
