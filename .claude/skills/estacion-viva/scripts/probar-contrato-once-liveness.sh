#!/usr/bin/env bash
# Test ejecutable WP-28 — contrato ONCE + liveness por lease + fuente única.
# Fixtures = logs/árboles sintéticos en temporal; asserts por grep/diff.
# Portable Git Bash (win) + POSIX. Exit 0 si todo PASA.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCHER="$SCRIPT_DIR/watcher-sesion.sh"
PULSO="$SCRIPT_DIR/pulso-mundo.sh"
VIVO="$SCRIPT_DIR/comprobar-vivo.sh"
CONTAR="$SCRIPT_DIR/contar-skills-mat.sh"

fallos=0
ok(){ echo "PASS $*"; }
ko(){ echo "FAIL $*"; fallos=$((fallos+1)); }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- Fixture: árbol WORLD_ROOT con 3 skills materializados ---
W="$TMP/mundo"
for s in skill-a skill-b skill-c; do
  mkdir -p "$W/.claude/skills/$s"
  printf '# %s\n' "$s" > "$W/.claude/skills/$s/SKILL.md"
done
# Ruido: SKILL.md fuera de .claude/skills NO debe contar.
mkdir -p "$W/otro"; printf '# ruido\n' > "$W/otro/SKILL.md"

# ── CA1 · ONCE refresca pulso.txt partiendo de sello rancio ─────────────
O1="$TMP/out1"; mkdir -p "$O1"
cat > "$O1/pulso.txt" <<EOF
pulso: ok
world_root: $W
skills_materializados: 999
worktrees_dir: 7
ts: 2000-01-01T00:00:00Z
EOF
ONCE=1 WORLD_ROOT="$W" OUT_DIR="$O1" bash "$WATCHER"
if grep -q '2000-01-01T00:00:00Z' "$O1/pulso.txt"; then
  ko "CA1 pulso.txt conserva el sello rancio (no refrescó)"
else
  nueva_ts="$(grep -oE '^ts: .*' "$O1/pulso.txt" | sed 's/^ts: //')"
  # ts es ISO-UTC (…Z); date -d respeta la Z como UTC (no reinterpretar local).
  te="$(date -d "$nueva_ts" +%s 2>/dev/null || date -j -f '%Y-%m-%dT%H:%M:%SZ' "$nueva_ts" +%s)"
  now="$(date +%s)"; d=$(( now - te )); [ "$d" -lt 0 ] && d=$(( -d ))
  if [ "$d" -lt 120 ]; then ok "CA1 ONCE refrescó pulso.txt (ts fresco: $nueva_ts, +${d}s)"
  else ko "CA1 ts presente pero no fresco ($nueva_ts, ${d}s)"; fi
fi
# ONCE también dejó línea de tick en watch.log
if grep -qE '^\[[0-9-]+ [0-9:]+\] sesion=1 skills_mat=' "$O1/watch.log"; then
  ok "CA1 ONCE dejó línea de tick en watch.log"
else
  ko "CA1 ONCE no dejó tick en watch.log"
fi

# ── CA3 · skills_mat: fuente única (ONCE vs snapshot vs conteo directo) ──
wl_count="$(grep -oE 'skills_mat=[0-9]+' "$O1/watch.log" | tail -1 | grep -oE '[0-9]+')"
px_count="$(grep -oE '^skills_materializados: [0-9]+' "$O1/pulso.txt" | grep -oE '[0-9]+')"
directo="$(WORLD_ROOT="$W" bash "$CONTAR")"
# Un segundo ciclo de "sesión" para contrastar ONCE vs sesión
ONCE=1 WORLD_ROOT="$W" OUT_DIR="$O1" bash "$WATCHER"
wl2="$(grep -oE 'skills_mat=[0-9]+' "$O1/watch.log" | tail -1 | grep -oE '[0-9]+')"
if [ "$wl_count" = "3" ] && [ "$px_count" = "3" ] && [ "$directo" = "3" ] && [ "$wl2" = "3" ]; then
  ok "CA3 skills_mat único = 3 (watch.log=$wl_count snapshot=$px_count directo=$directo sesion2=$wl2; ruido excluido)"
else
  ko "CA3 divergencia de conteo (watch.log=$wl_count snapshot=$px_count directo=$directo sesion2=$wl2)"
fi

# ── CA2 · Lease detecta vivo / muerto / dudoso con logs sintéticos ──────
mk_log(){ # $1 dir · $2 ts «F T»
  mkdir -p "$1"
  printf '[%s] sesion=1 skills_mat=3 residuo_filtrado=0 locks=%s\n' "$2" "''" > "$1/watch.log"
}

# vivo: tick de ahora (edad ~0 < 90)
LV="$TMP/vivo"; mk_log "$LV" "$(date '+%F %T')"
out="$(OUT_DIR="$LV" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 0 ] && printf '%s' "$out" | grep -q 'estado=vivo'; then
  ok "CA2 lease VIVO (tick fresco). $out"
else ko "CA2 lease debía ser vivo (rc=$rc). $out"; fi

# muerto: tick de hace 10×INTERVAL (450s >= 90)
LM="$TMP/muerto"; mk_log "$LM" "$(date -d '-450 seconds' '+%F %T')"
out="$(OUT_DIR="$LM" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 1 ] && printf '%s' "$out" | grep -q 'estado=muerto'; then
  ok "CA2 lease MUERTO (tick rancio). $out"
else ko "CA2 lease debía ser muerto (rc=$rc). $out"; fi

# dudoso: sin watch.log
LD="$TMP/dudoso"; mkdir -p "$LD"
out="$(OUT_DIR="$LD" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 2 ] && printf '%s' "$out" | grep -q 'estado=dudoso'; then
  ok "CA2 lease DUDOSO (sin watch.log). $out"
else ko "CA2 lease debía ser dudoso (rc=$rc). $out"; fi

# dudoso: watch.log sin tick parseable
LD2="$TMP/dudoso2"; mkdir -p "$LD2"; printf 'linea sin sello de tiempo\n' > "$LD2/watch.log"
out="$(OUT_DIR="$LD2" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 2 ] && printf '%s' "$out" | grep -q 'estado=dudoso'; then
  ok "CA2 lease DUDOSO (log sin tick parseable). $out"
else ko "CA2 lease debía ser dudoso (rc=$rc). $out"; fi

# ── PID pista secundaria: tick fresco + PID muerto ⇒ VIVO ───────────────
LP="$TMP/pid"; mk_log "$LP" "$(date '+%F %T')"
echo "4000000001" > "$LP/watcher.pid"   # PID inexistente (no verificable)
out="$(OUT_DIR="$LP" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 0 ] && printf '%s' "$out" | grep -q 'estado=vivo' \
   && printf '%s' "$out" | grep -q 'pid_pista=pid-no-verificable'; then
  ok "CA2/PID tick fresco con PID no verificable ⇒ VIVO (pid no contractual). $out"
else ko "CA2/PID debía ser vivo con pid-no-verificable (rc=$rc). $out"; fi

# ── Integración real: ONCE + comprobar-vivo sobre la MISMA salida ───────
out="$(OUT_DIR="$O1" INTERVAL=45 bash "$VIVO")"; rc=$?
# Tras ONCE el watcher.pid quedó con un pid ya muerto; el lease manda.
if [ "$rc" -eq 0 ] && printf '%s' "$out" | grep -q 'estado=vivo'; then
  ok "INTEGR ONCE→pulso reciente ⇒ lease VIVO. $out"
else ko "INTEGR lease sobre ONCE debía ser vivo (rc=$rc). $out"; fi

# ── pulso-mundo.sh coincide con watcher-sesion.sh (misma fuente) ────────
OP="$TMP/pmundo"
WORLD_ROOT="$W" OUT_DIR="$OP" bash "$PULSO" >/dev/null
pm="$(grep -oE '^skills_materializados: [0-9]+' "$OP/pulso.txt" | grep -oE '[0-9]+')"
if [ "$pm" = "3" ]; then ok "FUENTE pulso-mundo.sh == 3 (misma fuente que sesión)"
else ko "FUENTE pulso-mundo.sh divergió ($pm)"; fi

echo "---"
if [ "$fallos" -eq 0 ]; then
  echo "probar-contrato-once-liveness: PASS (todos los CA)"
  exit 0
else
  echo "probar-contrato-once-liveness: FAIL ($fallos aserciones)"
  exit 1
fi
