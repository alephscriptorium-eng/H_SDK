#!/usr/bin/env bash
# Prueba de ceguera sobre la cara pública de este skill.
# Veta marcas de INSTANCIA (nombres propios de mesas reales, rutas de
# máquina, remotos, hashes y fechas de sesión) y marcas de marco. El
# vocabulario de método (mesa, carril, tick, timbre, sello, auditor) es
# propio y NO se veta. Los términos se arman por fragmentos para que un
# grep sobre este directorio (incluido este script) siga siendo 0.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

P01="anfi"; P01+="tri"
P02="te"; P02+="mis"
P03="scrip"; P03+="torium"
P04="aleph"; P04+="script"
P05="escri"; P05+="vivir"
P06="ze"; P06+="us"
P07="parte"; P07+="-kit"
P08="operator"; P08+="-bridge"
P09="ciu"; P09+="dad"
P10="S_"; P10+="META"
P11="S_"; P11+="LAB"
P12="S_"; P12+="SDK"
P13="SCRI"; P13+="PT_"; P13+="SDK"
P14="d399"; P14+="230"
P15="2026"; P15+="-07"
P16="git"; P16+="hub"
P17="c:"; P17+='\\'
P18="s · o"; P18+=" · v"

PATTERN="${P01}|${P02}|${P03}|${P04}|${P05}|${P06}|${P07}|${P08}|${P09}"
PATTERN+="|${P10}|${P11}|${P12}|${P13}|${P14}|${P15}|${P16}|${P17}|${P18}"

if command -v rg >/dev/null 2>&1; then
  HITS=$(rg -n -i -e "$PATTERN" "$SKILL_ROOT" || true)
else
  HITS=$(grep -RInE "$PATTERN" "$SKILL_ROOT" || true)
fi

if [[ -n "$HITS" ]]; then
  echo "ceguera: FAIL"
  echo "$HITS"
  exit 1
fi

echo "ceguera: 0"
echo "raiz: $SKILL_ROOT"
exit 0
