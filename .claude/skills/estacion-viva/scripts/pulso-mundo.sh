#!/usr/bin/env bash
# Un pulso puntual del mundo (fase 4). Delega en watcher-sesion.sh con
# ONCE=1, que es la ÚNICA fuente del snapshot: escribe OUT_DIR/pulso.txt
# (ts fresco) más una línea en watch.log con el MISMO conteo skills_mat.
# Antes este script recontaba por su cuenta y podía divergir del ciclo de
# sesión (evidencia consumidor: skills_mat 6 vs 8). Ya no: una sola fuente.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

WORLD_ROOT="${WORLD_ROOT:-${1:-}}"
OUT_DIR="${OUT_DIR:-${2:-}}"

if [ -z "$WORLD_ROOT" ] || [ -z "$OUT_DIR" ]; then
  echo "uso: WORLD_ROOT=<repo> OUT_DIR=<salida> $0" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"

ONCE=1 INTERVAL=1 WORLD_ROOT="$WORLD_ROOT" OUT_DIR="$OUT_DIR" \
  bash "$SCRIPT_DIR/watcher-sesion.sh"

echo "pulso escrito: $OUT_DIR/pulso.txt"
cat "$OUT_DIR/pulso.txt"
