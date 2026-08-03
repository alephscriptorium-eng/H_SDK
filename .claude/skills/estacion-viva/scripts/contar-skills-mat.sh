#!/usr/bin/env bash
# FUENTE ÚNICA del conteo de skills materializados (WP-28 · DC-29).
# Cuenta los SKILL.md bajo $WORLD_ROOT/.claude/skills. Es la única
# implementación del conteo: la usan tanto watcher-sesion.sh (cada ciclo,
# línea skills_mat= de watch.log) como el snapshot pulso.txt
# (skills_materializados=). Al derivar ambos del mismo lugar, el conteo
# de ONCE y el de sesión nunca divergen sobre el mismo árbol.
#
# Uso:
#   WORLD_ROOT=<repo> ./contar-skills-mat.sh
#   ./contar-skills-mat.sh <repo>
# Salida: un entero por stdout (0 si no hay materialización).
set -uo pipefail

WORLD_ROOT="${WORLD_ROOT:-${1:-}}"

n=0
if [ -n "$WORLD_ROOT" ] && [ -d "$WORLD_ROOT/.claude/skills" ]; then
  n="$(find "$WORLD_ROOT/.claude/skills" -type f -name 'SKILL.md' 2>/dev/null | grep -c . || true)"
fi

printf '%s\n' "$n"
