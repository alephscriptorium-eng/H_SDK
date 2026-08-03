#!/usr/bin/env bash
# Liveness portable del watcher por LEASE DE TIMESTAMP (WP-28 · DC-29).
#
# Contrato (fuente contractual = el último tick de watch.log):
#   VIVO   : hay tick parseable y edad  <  2×INTERVAL
#   MUERTO : hay tick parseable y edad  >= 2×INTERVAL
#   DUDOSO : no hay watch.log, está vacío, o el tick no es parseable
#
# El PID ($OUT_DIR/watcher.pid) es PISTA SECUNDARIA no contractual: se
# reporta como evidencia pero NO decide el veredicto. Un tick fresco con
# PID no verificable (p. ej. distinto árbol de procesos en Git Bash) da
# VIVO igualmente — es exactamente el caso observado en el consumidor
# («pulso vivo con pid no verificable»).
#
# Portable: Git Bash (win) + POSIX. No usa tasklist/ps como fuente. La
# pista de PID usa `kill -0` (señal cero), no un listador de procesos.
#
# Uso:
#   OUT_DIR=<dir> [INTERVAL=45] ./comprobar-vivo.sh
#   ./comprobar-vivo.sh <dir> [INTERVAL]
# Salida: una línea «comprobar-vivo: estado=… …» con evidencia literal.
# Exit:   0 = vivo · 1 = muerto · 2 = dudoso
set -uo pipefail

OUT_DIR="${OUT_DIR:-${1:-}}"
INTERVAL="${INTERVAL:-${2:-45}}"

if [ -z "$OUT_DIR" ]; then
  echo "uso: OUT_DIR=<dir> [INTERVAL=45] $0" >&2
  exit 2
fi

LOG="$OUT_DIR/watch.log"
PIDFILE="$OUT_DIR/watcher.pid"
THRESHOLD=$(( 2 * INTERVAL ))

# Convierte «YYYY-MM-DD HH:MM:SS» a epoch. GNU date (Git Bash/Linux) y,
# como respaldo, BSD date (macOS). Sin ninguno → falla (→ dudoso).
ts_to_epoch() {
  local ts="$1" e
  e="$(date -d "$ts" +%s 2>/dev/null)" && { printf '%s' "$e"; return 0; }
  e="$(date -j -f '%Y-%m-%d %H:%M:%S' "$ts" +%s 2>/dev/null)" && { printf '%s' "$e"; return 0; }
  return 1
}

# --- Pista secundaria: PID (no contractual) ---
pid="-"
pid_pista="sin-pidfile"
if [ -f "$PIDFILE" ]; then
  pid="$(tr -dc '0-9' < "$PIDFILE" 2>/dev/null || true)"
  [ -n "$pid" ] || pid="-"
  if [ "$pid" != "-" ] && kill -0 "$pid" 2>/dev/null; then
    pid_pista="pid-activo"
  else
    pid_pista="pid-no-verificable"
  fi
fi

emitir() {
  # $1 estado · $2 exit · $3 tick · $4 edad · $5 motivo
  echo "comprobar-vivo: estado=$1 ultimo_tick='${3}' edad=${4} umbral=${THRESHOLD}s pid=${pid} pid_pista=${pid_pista}${5:+ motivo=$5}"
  exit "$2"
}

# --- Lease de timestamp (contractual) ---
if [ ! -f "$LOG" ]; then
  emitir "dudoso" 2 "-" "-" "sin-watch.log"
fi

# Último sello «[F T]» del log (cualquier línea de tick o anomalía lo lleva).
tick="$(grep -oE '^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]' "$LOG" 2>/dev/null | tail -1 || true)"
tick="${tick#[}"
tick="${tick%]}"

if [ -z "$tick" ]; then
  emitir "dudoso" 2 "-" "-" "sin-tick-parseable"
fi

tick_epoch="$(ts_to_epoch "$tick")" || emitir "dudoso" 2 "$tick" "-" "ts-no-convertible"
now="$(date +%s)"
age=$(( now - tick_epoch ))
[ "$age" -lt 0 ] && age=0   # tolerar leve desfase de reloj

if [ "$age" -lt "$THRESHOLD" ]; then
  emitir "vivo" 0 "$tick" "${age}s" ""
else
  emitir "muerto" 1 "$tick" "${age}s" "sin-tick-reciente"
fi
