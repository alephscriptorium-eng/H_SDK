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

# Sello «F T» de hace N segundos. GNU date (Git Bash/Linux) con respaldo
# BSD (macOS), MISMO patrón de fallback que la l.44 / CA1 (menor #1 WP-28).
# Lo usan la fixture MUERTO y los casos límite del umbral (menor #3).
hace_seg(){ date -d "-$1 seconds" '+%F %T' 2>/dev/null || date -v-"$1"S '+%F %T'; }

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

# ── CA-CONTEO · espejo real 7 skills + ruido → 7 (INT-V-01 · menor #4) ──
# Reproduce la evidencia consumidor «pulso reportó 8 con 7»: un espejo con
# 7 skills canónicos MÁS (a) un README.md suelto directo bajo .claude/skills,
# (b) una carpeta SIN SKILL.md, y (c) un SKILL.md ANIDADO dentro de un skill
# (examples/…/.claude/skills/*). Un `find -name SKILL.md` recursivo daba 8;
# el contador por-directorio-de-primer-nivel debe dar 7 y NO moverse por el
# fichero suelto ni la carpeta vacía.
E="$TMP/espejo7"
for s in 1 2 3 4 5 6 7; do
  mkdir -p "$E/.claude/skills/skill-$s"
  printf '# skill %s\n' "$s" > "$E/.claude/skills/skill-$s/SKILL.md"
done
printf '# indice del espejo\n' > "$E/.claude/skills/README.md"          # fichero suelto
mkdir -p "$E/.claude/skills/carpeta-sin-skill"                          # carpeta sin SKILL.md
printf 'nota\n' > "$E/.claude/skills/carpeta-sin-skill/nota.md"
mkdir -p "$E/.claude/skills/skill-1/examples/demo/.claude/skills/anidado"
printf '# anidado\n' > "$E/.claude/skills/skill-1/examples/demo/.claude/skills/anidado/SKILL.md"
c7="$(WORLD_ROOT="$E" bash "$CONTAR")"
if [ "$c7" = "7" ]; then
  ok "CA-CONTEO espejo 7 skills + README suelto + carpeta-sin-SKILL + SKILL.md anidado → $c7 (no 8)"
else
  ko "CA-CONTEO espejo debía contar 7 (README/carpeta/anidado no son skills), dio $c7"
fi
# Conteo inmóvil: quitar el ruido no cambia el 7 (aísla que el ruido no sumaba).
rm -f "$E/.claude/skills/README.md"; rm -rf "$E/.claude/skills/carpeta-sin-skill"
c7b="$(WORLD_ROOT="$E" bash "$CONTAR")"
if [ "$c7b" = "7" ]; then
  ok "CA-CONTEO conteo inmóvil: sin el ruido sigue siendo 7 (el ruido nunca sumó)"
else
  ko "CA-CONTEO el conteo se movió al quitar ruido ($c7b != 7)"
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

# muerto: tick de hace 10×INTERVAL (450s >= 90). date con fallback BSD (menor #1).
LM="$TMP/muerto"; mk_log "$LM" "$(hace_seg 450)"
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

# ── CA-UMBRAL · frontera 2×INTERVAL muerde (menor #3 WP-28) ─────────────
# INTERVAL=45 ⇒ THRESHOLD=90s. El sello se coloca JUSTO dentro y JUSTO
# fuera del umbral. Márgenes de ±3s (jitter medido de una invocación
# ~0.23s en Git Bash) — el «±1s» del brief es demasiado fino para el reloj
# de pared; con ±3s el caso sigue mordiendo el multiplicador 2× y todo
# desplazamiento ≥3s del umbral. Además se asevera literal `umbral=90s`,
# que caza cualquier cambio en THRESHOLD=$((2*INTERVAL)).
LIV="$TMP/umbral-vivo"; mk_log "$LIV" "$(hace_seg 87)"   # edad ~87 < 90 → vivo
out="$(OUT_DIR="$LIV" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 0 ] && printf '%s' "$out" | grep -q 'estado=vivo' \
   && printf '%s' "$out" | grep -q 'umbral=90s'; then
  ok "CA-UMBRAL VIVO justo dentro (edad ~87 < 90). $out"
else ko "CA-UMBRAL debía ser vivo justo dentro del umbral (rc=$rc). $out"; fi

LMU="$TMP/umbral-muerto"; mk_log "$LMU" "$(hace_seg 93)"  # edad ~93 >= 90 → muerto
out="$(OUT_DIR="$LMU" INTERVAL=45 bash "$VIVO")"; rc=$?
if [ "$rc" -eq 1 ] && printf '%s' "$out" | grep -q 'estado=muerto' \
   && printf '%s' "$out" | grep -q 'umbral=90s'; then
  ok "CA-UMBRAL MUERTO justo fuera (edad ~93 >= 90). $out"
else ko "CA-UMBRAL debía ser muerto justo fuera del umbral (rc=$rc). $out"; fi

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

# ── CA-WT · worktrees_dir honra WORKTREE_BASE externo (INT-V-05) ────────
# El watcher hoy sólo miraba $WORLD_ROOT/.worktrees; el consumidor puede
# calibrar los worktrees FUERA del árbol del mundo. Con WORKTREE_BASE
# apuntando a una base sintética de 2 worktrees (+ un fichero suelto que NO
# debe contar), el snapshot debe reportar worktrees_dir=2.
WB="$TMP/wt-base-externa"
mkdir -p "$WB/wt-uno" "$WB/wt-dos"
printf 'x\n' > "$WB/no-soy-worktree.txt"   # fichero suelto: no cuenta
OWB="$TMP/out-wt"
ONCE=1 INTERVAL=1 WORLD_ROOT="$W" OUT_DIR="$OWB" WORKTREE_BASE="$WB" bash "$WATCHER"
wtn="$(grep -oE '^worktrees_dir: [0-9]+' "$OWB/pulso.txt" | grep -oE '[0-9]+')"
if [ "$wtn" = "2" ]; then
  ok "CA-WT WORKTREE_BASE externo (2 worktrees + fichero suelto) → worktrees_dir=2"
else
  ko "CA-WT worktrees_dir debía honrar WORKTREE_BASE externo (=2), dio $wtn"
fi
# Fallback: sin WORKTREE_BASE cae a $WORLD_ROOT/.worktrees (aquí ausente → 0).
OWB2="$TMP/out-wt2"
ONCE=1 INTERVAL=1 WORLD_ROOT="$W" OUT_DIR="$OWB2" bash "$WATCHER"
wtn0="$(grep -oE '^worktrees_dir: [0-9]+' "$OWB2/pulso.txt" | grep -oE '[0-9]+')"
if [ "$wtn0" = "0" ]; then
  ok "CA-WT fallback sin WORKTREE_BASE → \$WORLD_ROOT/.worktrees (ausente = 0)"
else
  ko "CA-WT fallback debía ser 0 (sin .worktrees en el mundo), dio $wtn0"
fi

echo "---"
if [ "$fallos" -eq 0 ]; then
  echo "probar-contrato-once-liveness: PASS (todos los CA)"
  exit 0
else
  echo "probar-contrato-once-liveness: FAIL ($fallos aserciones)"
  exit 1
fi
