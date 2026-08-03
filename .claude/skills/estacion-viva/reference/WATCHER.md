# WATCHER — sesión + whitelist

Watcher de la estación viva: **clase sesión** (muere al cerrar) y
**whitelist** de materialización de skills.

Componer con el skill `vigilancia` (`scripts/watcher.sh`) para pulso
de worktrees/locks. Este skill aporta el filtro que evita la clase de
ruido I71.

## Clase: muere con la sesión

- Arranque: fase 3 del boot (`scripts/watcher-sesion.sh`).
- PID en `$OUT_DIR/watcher.pid`.
- El proceso padre registra `trap` → `kill` del watcher al EXIT /
  INT / TERM.
- No instalar como servicio del OS; no sobrevivir al chat/sesión del
  agente.

## Contrato ONCE (snapshot canónico)

`ONCE=1` ejecuta **un** ciclo y deja **siempre** dos artefactos frescos
en `$OUT_DIR`:

| artefacto | contenido |
| --------- | --------- |
| `watch.log` | una línea de tick `[F T] sesion=1 skills_mat=… …` |
| `pulso.txt` | snapshot canónico con `ts` UTC **fresco** en cada ONCE |

- El snapshot se escribe de forma **atómica** (temporal + `mv`): un lector
  nunca ve un `pulso.txt` a medio escribir.
- `pulso-mundo.sh` (fase 4 del boot) es un envoltorio fino: delega en
  `watcher-sesion.sh ONCE=1`, que es la **única** fuente del snapshot. No
  recuenta por su cuenta.

Motivo (evidencia consumidor 2026-07-25): un `pulso.txt` con **sello
rancio** mientras el watcher estaba vivo, porque `ONCE=1` directo no
refrescaba el snapshot. El contrato lo cierra: ONCE **siempre** refresca.

## Conteo `skills_mat`: fuente única

`scripts/contar-skills-mat.sh` es la **única** implementación del conteo
de skills materializados (`SKILL.md` bajo `.claude/skills/`). La usan
tanto el ciclo (`skills_mat=` en `watch.log`) como el snapshot
(`skills_materializados:` en `pulso.txt`). Al derivar ambos del mismo
lugar, ONCE y sesión **no divergen** sobre el mismo árbol (evidencia
consumidor: `skills_mat 6 vs 8`, dos fuentes de conteo distintas).

## Liveness por lease de timestamp (portable)

Señal **contractual** de vida = el **último tick** de `watch.log`:

| estado | condición |
| ------ | --------- |
| **vivo** | hay tick parseable y `edad < 2×INTERVAL` |
| **muerto** | hay tick parseable y `edad ≥ 2×INTERVAL` |
| **dudoso** | no hay `watch.log`, está vacío, o el tick no es parseable |

El **PID** (`watcher.pid`) es **pista secundaria no contractual**: se
reporta como evidencia pero **no** decide el veredicto. Un tick fresco con
PID no verificable (p. ej. distinto árbol de procesos en Git Bash) da
**vivo** igualmente — el caso «pulso vivo con pid no verificable» del
consumidor.

Portable **Git Bash (win) + POSIX**: el chequeo no usa `tasklist`/`ps`
como fuente; la pista de PID usa `kill -0` (señal cero), no un listador.

```bash
OUT_DIR=<dir> INTERVAL=45 bash scripts/comprobar-vivo.sh
# → comprobar-vivo: estado=vivo ultimo_tick='…' edad=…s umbral=…s pid=… pid_pista=…
# exit 0=vivo · 1=muerto · 2=dudoso
```

## Test reproducible

`scripts/probar-contrato-once-liveness.sh` — fixtures sintéticos
(árboles + logs) y asserts por `grep`/`diff`: ONCE refresca desde sello
rancio, lease vivo/muerto/dudoso, PID no contractual y `skills_mat` de
fuente única. Portable; `exit 0` si todo pasa.

## Whitelist de materialización (clase I71)

### Problema

Al materializar el paquete de skills bajo `.claude/skills/`, un barrido
ingenuo de «markdown en carpetas de IDE» trata cada `SKILL.md` /
`README.md` / `reference/*.md` como **residuo de info** (regla 15 del
swarm). Feedback S02: del orden de **~3.110 falsos positivos** si se
barre sin whitelist.

### Regla

| path | tratamiento |
| ---- | ----------- |
| `.claude/skills/**` | **whitelist** — materialización legítima del paquete; NO es residuo |
| `.claude/worktrees/**` | ajeno al swarm de estación (señal distinta; ver vigilancia) |
| otros `*.md` bajo `.claude/`, `.cursor/`, … | residuo de info → elevar |

### Herramienta

`scripts/filtro-whitelist-skills.sh` — dada una lista de paths (stdin o
args), emite solo los que **no** caen bajo `.claude/skills/`.

`scripts/watcher-sesion.sh` aplica el filtro en cada ciclo antes de
logar `!!RESIDUO`.

## Relación con vigilancia

- Pulso de locks / worktrees / CI: citar y, si el consumidor lo desea,
  invocar el watcher de `vigilancia` en paralelo o en modo one-shot.
- No copiar árboles de instancia ni datos de sesión ajenos.
- La whitelist es responsabilidad de **estación viva** porque el dolor
  aparece al materializar skills en el boot de estación.

## Params

| param | rol |
| ----- | --- |
| `WORLD_ROOT` | repo vigilado |
| `OUT_DIR` | `watch.log`, `anomalias.log`, `watcher.pid`, `pulso.txt` |
| `INTERVAL` | segundos (default 45; fixture puede usar 2). También umbral del lease: vivo si `edad < 2×INTERVAL` |
| `ONCE` | `1` → un ciclo y sale; refresca **watch.log y pulso.txt** |

## Scripts

| script | rol |
| ------ | --- |
| `watcher-sesion.sh` | ciclo/loop; escribe tick + snapshot canónico |
| `pulso-mundo.sh` | pulso puntual (fase 4); envoltorio fino sobre `ONCE=1` |
| `contar-skills-mat.sh` | **fuente única** del conteo `skills_mat` |
| `comprobar-vivo.sh` | liveness por lease; `vivo`/`muerto`/`dudoso` |
| `probar-contrato-once-liveness.sh` | test reproducible del contrato |
