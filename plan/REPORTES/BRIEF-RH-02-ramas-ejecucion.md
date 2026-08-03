# BRIEF · RH-02 · ramas de ejecución H+G+V

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-02 · Ramas de ejecución (sin fusionar checkpoints)
Rama WP: wp/rh-02-ramas-ejecucion  (desde h-sdk main HEAD; solo reporte/acta)
Worktree: C:/S_LAB/wt/h-rh-02  (h-sdk)
Reporte: plan/REPORTES/RH-02-ramas-ejecucion.md

Anclas RH-01 (literales; no mover):
  H checkpoint tip: e53694e3e4acb664b84f517cf37a5b2155d0b934  (main history)
  H main tip post-✅: 20530665cee58f6e85127c237070e119797a9571
  G checkpoint: 35cbded673fdb557af4fe4864d8e514f7acf9f1c on wp/g-prueba-hm-adaptacion
  G padre checkpoint: 9f434b3bfc028db949ba39c67856e1bdaace16c8
  V main: 7eecfd4592ae4b42544ff6ac6fe5ce451f6712aa

Crear (si no existen) estas ramas de EJECUCIÓN — no checkout permanente del custodio:
  1) h-sdk:  wp/rh-ejecucion          ← desde e53694e (checkpoint) 
     Nota: main puede seguir adelante con gov; la obra de superficie usa wp/rh-ejecucion.
  2) g-sdk:  wp/rh-ejecucion          ← desde 9f434b3 (PADRE del checkpoint; reaplicar genérico)
     PROHIBIDO avanzar o resetear wp/g-prueba-hm-adaptacion (queda en 35cbded).
  3) v-sdk:  wp/rh-ejecucion          ← desde main (7eecfd4 o tip main limpio)

Opcional (recomendado): tags ligeros locales (no push) checkpoint/rh-01-h → e53694e,
  checkpoint/rh-01-g → 35cbded.

Preflight:
  H/G: WORLD_ROOT=CANONICAL=… READ_ONLY_ROOTS='["C:/S","C:/S_META"]' DOWNSTREAM_PATTERNS='["S/*"]'
  V: si existe detector en v-sdk, úsalo; si no, documenta ⏳ y limita efectos a `git branch`
     (crear rama wp/rh-ejecucion únicamente).

Lecturas: BACKLOG RH-02 · plan.md step 2 · acta REPLAN · BRIEF RH-01
Eje CA: III

ALCANCE_DIFF:
  - crear refs de rama (y tags locales opcionales) en h-sdk, g-sdk, v-sdk
  - actualizar C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md § ramas de ejecución
  - reporte + commits solo en h-sdk wp/rh-02-ramas-ejecucion
PROHIBIDO: merge de checkpoints; commits de producto en las ramas de ejecución;
  reset/force sobre checkpoint G; push; editar BACKLOG; tocar superficie de código.

Identidad git por invocación (no config):
  git -c user.name="worker-RH-02" -c user.email="alephscriptorium@gmail.com" commit ...

RIESGO_REVISION: normal
MOTIVO_RIESGO: creación de refs + acta; no demolición, no publish, no frontera de secretos.
  Clases independiente no activadas.
CONTRAEVIDENCIA_REQUERIDA:
  - git rev-parse wp/rh-ejecucion en H apunta a e53694e (o es ancestro/desc igual al pedido)
  - git rev-parse wp/rh-ejecucion en G == 9f434b3
  - git rev-parse wp/g-prueba-hm-adaptacion sigue == 35cbded
  - git rev-parse wp/rh-ejecucion en V == tip main al crear
  - cero merges de checkpoint a tip de obra
REVISOR_DISTINTO_WORKER: no requerido

Empieza: PASS H → worktree/rama WP → crear refs → PASS G → ref G → V ref → acta → reporte → PARAR.
```
