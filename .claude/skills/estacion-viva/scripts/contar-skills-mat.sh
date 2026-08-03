#!/usr/bin/env bash
# FUENTE ÚNICA del conteo de skills materializados (WP-28 · DC-29 · WP-31).
# Cuenta los DIRECTORIOS inmediatos bajo $WORLD_ROOT/.claude/skills que
# contienen un SKILL.md propio — un skill materializado ES una carpeta con
# su SKILL.md. Es la única implementación del conteo: la usan tanto
# watcher-sesion.sh (cada ciclo, línea skills_mat= de watch.log) como el
# snapshot pulso.txt (skills_materializados=). Al derivar ambos del mismo
# lugar, el conteo de ONCE y el de sesión nunca divergen sobre el mismo árbol.
#
# INT-V-01: un fichero suelto (README.md del espejo) NO es un skill, y un
# SKILL.md ANIDADO dentro de un skill (p. ej. examples/…/.claude/skills/*)
# no debe recontarse. Por eso NO se hace `find -name SKILL.md` recursivo
# (que reportaba 8 sobre un espejo de 7): se cuentan sólo las carpetas de
# primer nivel que tienen su SKILL.md directo.
#
# Uso:
#   WORLD_ROOT=<repo> ./contar-skills-mat.sh
#   ./contar-skills-mat.sh <repo>
# Salida: un entero por stdout (0 si no hay materialización).
set -uo pipefail

WORLD_ROOT="${WORLD_ROOT:-${1:-}}"

n=0
base="${WORLD_ROOT}/.claude/skills"
if [ -n "$WORLD_ROOT" ] && [ -d "$base" ]; then
  for d in "$base"/*/; do
    # Glob sin match queda literal ($base/*/): el test -f lo descarta.
    [ -f "${d}SKILL.md" ] && n=$((n+1))
  done
fi

printf '%s\n' "$n"
