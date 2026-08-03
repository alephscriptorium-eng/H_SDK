#!/usr/bin/env bash
# Watcher de estación — clase sesión (muere con el padre) + whitelist
# .claude/skills/ (clase I71).
#
# CONTRATO ONCE (WP-28 · DC-29):
#   ONCE=1 ejecuta UN ciclo y deja SIEMPRE dos artefactos frescos:
#     1) una línea de tick en  $OUT_DIR/watch.log  (con sello «[F T]»);
#     2) el snapshot canónico   $OUT_DIR/pulso.txt (con ts UTC fresco).
#   El conteo skills_mat sale de UNA fuente única (contar-skills-mat.sh),
#   de modo que la línea de watch.log (skills_mat=) y el snapshot
#   (skills_materializados=) nunca divergen sobre el mismo árbol.
#   El bucle continuo refresca ambos en cada ciclo.
#
# Uso:
#   WORLD_ROOT=… OUT_DIR=… [INTERVAL=45] ./watcher-sesion.sh
#   ONCE=1 → un ciclo y sale (refresca watch.log Y pulso.txt)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILTRO="$SCRIPT_DIR/filtro-whitelist-skills.sh"
CONTAR="$SCRIPT_DIR/contar-skills-mat.sh"

WORLD_ROOT="${WORLD_ROOT:-${1:-}}"
OUT_DIR="${OUT_DIR:-${2:-}}"
INTERVAL="${INTERVAL:-${3:-45}}"
ONCE="${ONCE:-0}"

if [ -z "$WORLD_ROOT" ] || [ -z "$OUT_DIR" ]; then
  echo "uso: WORLD_ROOT=<repo> OUT_DIR=<salida> [INTERVAL=45] $0" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
LOG="$OUT_DIR/watch.log"
ANOM="$OUT_DIR/anomalias.log"
PIDFILE="$OUT_DIR/watcher.pid"
PULSO="$OUT_DIR/pulso.txt"

echo $$ > "$PIDFILE"

cleanup() {
  rm -f "$PIDFILE"
}
trap cleanup EXIT

# Snapshot canónico atómico: escribe a un temporal y mueve, para que un
# lector nunca vea un pulso.txt a medio escribir. Recibe el MISMO skills_n
# que la línea de watch.log de este ciclo (sin recontar → sin divergencia).
escribir_pulso() {
  local skills_n="$1" wt_n="$2" tmp
  tmp="$(mktemp "$OUT_DIR/.pulso.XXXXXX" 2>/dev/null)" || tmp="$PULSO.tmp"
  {
    echo "pulso: ok"
    echo "world_root: $WORLD_ROOT"
    echo "skills_materializados: $skills_n"
    echo "worktrees_dir: $wt_n"
    echo "ts: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } > "$tmp"
  mv -f "$tmp" "$PULSO"
}

cycle() {
  local ts resid_raw filtered
  ts="$(date '+%F %T')"

  # Residuo IDE: markdowns bajo carpetas de herramienta, EXCEPTO
  # materialización .claude/skills/ (whitelist I71).
  resid_raw=""
  for ide in .claude .cursor .windsurf .aider; do
    idedir="$WORLD_ROOT/$ide"
    [ -d "$idedir" ] || continue
    while IFS= read -r rf; do
      [ -z "$rf" ] && continue
      resid_raw+="${rf}"$'\n'
    done < <(find "$idedir" -type f -name '*.md' \
      -not -path '*/worktrees/*' -not -path '*/node_modules/*' \
      -not -path '*/.git/*' 2>/dev/null || true)
  done

  filtered="$(printf '%s' "$resid_raw" | bash "$FILTRO" || true)"
  local resid_n=0
  if [ -n "$filtered" ]; then
    resid_n="$(printf '%s\n' "$filtered" | grep -c . || true)"
    while IFS= read -r rf; do
      [ -z "$rf" ] && continue
      echo "[$ts] !!RESIDUO markdown de info (fuera de whitelist skills): ${rf#$WORLD_ROOT/}" \
        | tee -a "$ANOM" >> "$LOG"
    done <<< "$filtered"
  fi

  # Conteo de skills materializados — FUENTE ÚNICA (contar-skills-mat.sh).
  local skills_n
  skills_n="$(WORLD_ROOT="$WORLD_ROOT" bash "$CONTAR")"

  # Conteo de worktrees reales (informativo; para el snapshot canónico).
  local wt_n=0
  if [ -d "$WORLD_ROOT/.worktrees" ]; then
    wt_n="$(ls -1 "$WORLD_ROOT/.worktrees" 2>/dev/null | grep -c . || true)"
  fi

  # Locks (sin git status)
  local locks=""
  if [ -d "$WORLD_ROOT/.git" ] || [ -f "$WORLD_ROOT/.git" ]; then
    locks="$(find "$WORLD_ROOT/.git" -maxdepth 3 \( -name 'index.lock' -o -name 'HEAD.lock' \) 2>/dev/null | tr '\n' ' ')"
  fi

  echo "[$ts] sesion=1 skills_mat=$skills_n residuo_filtrado=$resid_n locks='${locks}'" >> "$LOG"

  if [ -n "${locks// /}" ]; then
    echo "[$ts] !!LOCK ${locks}" | tee -a "$ANOM" >> "$LOG"
  fi

  # Snapshot canónico SIEMPRE, con el MISMO skills_n de la línea anterior.
  escribir_pulso "$skills_n" "$wt_n"
}

if [ "$ONCE" = "1" ]; then
  cycle
  exit 0
fi

while true; do
  cycle
  sleep "$INTERVAL"
done
