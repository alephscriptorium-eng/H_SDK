# Ciclo prep → worker → revisión → merge

El aislamiento **worktree + rama por WP** previene el conflicto por
construcción. No lo sustituyas. Lo que sigue son las costuras.

## 1. Preparación (orquestador)

1. Ejecutar, antes de cualquier efecto, el preflight canónico de identidad de
   `../../vigilancia/reference/ESTACION.md` con su detector
   `../../vigilancia/scripts/verificar-identidad-raiz.mjs`. El orquestador
   exige y adjunta al despacho `WORLD_ROOT`, `CANONICAL_WORLD_ROOT`,
   `READ_ONLY_ROOTS` y `DOWNSTREAM_PATTERNS`; la plantilla base del brief no
   los sustituye. Orden obligatorio: `DETECTOR → PASS|LOCK → EFECTOS`. Solo
   `identidad-raiz: PASS` permite continuar. Entrada ausente o
   `LOCK identidad-raiz` se devuelve al custodio con cero efectos: no `mkdir`,
   escritura, watcher, git mutable, plan, rama, worktree, boot, handoff ni
   `OUT_DIR`; el orquestador no crea ni elige otro clone.
2. Ritual de inicio (`ORQUESTADOR.md`).
3. Si el ecosistema es multi-carril: gate de convivencia
   (`reference/convivencia-multi-orquestador.md` — fuente única): higiene
   pre-despacho §8 + `Rn-<carril>` PASS §3. Sin PASS, no hay lote.
4. Elegir lote paralelizable (dependencias, dirs que no se pisen; un
   territorio por orquestador).
5. En la rama principal del **carril**: BACKLOG ⬜→🔶 por cada WP del lote.
6. Rellenar un BRIEF por WP (eje(s), `ALCANCE_DIFF`, worktree y los campos
   de riesgo definidos en `reference/revision-adversarial.md`).
   REPORTES/BRIEFS bajo el sprint del carril (convivencia §5).
7. Si el arranque continúa mediante `estacion-viva`, ejecutar primero el
   detector con las cuatro entradas y conservar su PASS. Solo entonces se
   construye o entrega el handoff y se invoca
   `../../estacion-viva/reference/BOOT.md` o su script. Su fase 1 puede crear
   `OUT_DIR`; por eso LOCK impide boot, handoff y cualquier efecto.

## 2. Ejecución (worker)

1. Checkout / worktree según brief.
2. Lectura obligatoria (PRACTICAS, WP, VISION, zona).
3. Implementar solo el CA (+ ejes).
4. Verificar dependencias runtime directas y probes exigidos. Si aplica
   política semver, usar `reference/politica-dependencias-semver.md`: el gate
   local determinista y C8 online generan evidencias separadas.
5. Gates verdes; auto-revisión; reporte con campos de riesgo, casos,
   dependencias, instalación y tipo de evidencia en la rama del WP.
6. Parar. Sin BACKLOG. Sin merge. Sin push salvo que el mundo lo autorice
   explícitamente para ese entregable.

## 3. Contrarrevisión selectiva pre-aceptación

Aplicar `reference/revision-adversarial.md`. Riesgo `normal` pasa directamente
a revisión ordinaria. Riesgo `independiente` exige un revisor distinto,
read-only, que intente refutar CA y emita PASS o devolución numerada. Sin PASS,
el WP no puede aceptarse. El revisor no acepta ni mergea.

## 4. Revisión ordinaria y aceptación (orquestador)

1. `REVISION.md` + reporte + diff.
2. Verificar CA y eje(s).
3. ✅ → BACKLOG ✅ + merge + limpiar worktree.
   **Merge solo post-aceptación:** la rama `wp/*` entra a la principal
   **únicamente tras** el ✅. Prohibido merge prematuro (pre-STOP /
   pre-aceptación) aunque el tip «parezca listo» o haya CI parcial.
   **Commit de aceptación solo:** no abrir brief/🔶 de otro WP en el
   mismo commit (V2 — `reference/reglas-metodo-v03.md`).
4. Devuelto → comentarios numerados; mismo worker con `CORRECCION.md`.

## 5. Corrección

Misma rama; solo lo pedido; actualizar reporte a `devuelto-corregido`.

## 6. Merge y gate post-merge

Tras aceptar, mergear y ejecutar el gate `Rn-<carril>` sobre el tip integrado.
Ese gate verifica el estado de facto y no sustituye ni queda sustituido por la
contrarrevisión pre-aceptación. Un fallo post-merge se devuelve numerado como
incidencia del tip integrado; no fabrica un PASS pre-merge retroactivo.

## 7. Cierre de ola (orquestador)

Antes de declarar la ola cerrada, ejecutar el checklist de
`reference/reglas-metodo-v05.md`: stash vacío · `plan/` limpio · ramas
`wp/*` mergeadas borradas o justificadas · `git status` explicado ·
worktrees huérfanos removidos (**poda segura §10** si hay junctions /
reparse points) · **carpetas de IDE sin markdowns de info de
sesión (solo config funcional) y memoria interna no citada como fuente
(regla 15)** · **run-id VERDE de CI (+ Release/homólogo) citado por cada
repo tocado (regla 16)** · **si hubo proyección: sync-map post-apply, sin
IDs especulativos (regla 17)**.

## 8. Activación de mundo (regla 13)

La activación la ejecuta un agente **fresco** (solo conoce el skill).
No reutilizar un agente con contexto del marco.

## 9. Ceguera (regla 14)

Antes de merge/publish: `comprobar-ceguera.sh` sobre el árbol **y**
`git log -p` sobre el historial reachable. Medir con `grep -c` /
`grep -q`, nunca `grep | head && echo OK`. Fuga intermedia → squash.

## 10. Poda segura de worktrees (junctions / reparse points)

Al podar worktrees (higiene de §7, o `git worktree remove` tras
aceptación), un worktree puede contener **junctions** o directorios
enlazados (reparse points en Windows; symlinks en POSIX) hacia obra viva
**fuera** del worktree. Podar «a lo bruto» sigue el enlace y **borra el
destino**, no solo el worktree.

Protocolo:

1. **Chequeo de reparse points ANTES de podar.** Detectá enlaces / reparse
   dentro del worktree (`fsutil reparsepoint query` / `dir /AL` en Windows;
   `find -type l` / `lstat` en POSIX). Un worktree con enlaces no se borra
   directo con `rm -rf`.
2. **Desenlazar la junction primero.** Borrá **solo el enlace** —quitar el
   reparse point: `rmdir` del junction en Windows (**no** `rmdir /s`, que
   recorre el destino), `rm` del symlink en POSIX—. El destino queda intacto.
3. **Recién entonces podar** el worktree ya sin enlaces (`git worktree
   remove` o borrado del directorio).
4. **Alternativa `symlinkDirectories`.** Si el flujo necesita enlazar obra
   dentro de worktrees de forma reproducible, preferí el mecanismo declarado
   de enlaces de directorio del mundo (p. ej. `symlinkDirectories`) sobre
   junctions ad-hoc: deja el enlace **explícito y auditable**, y la poda sabe
   qué desenlazar.

Un `worktree remove` puede además dejar residuo si el FS bloquea el directorio
(clases de huérfano: `../../vigilancia/reference/ESTACION.md`). Poda en quietud.

## Anti-patrones de costura

| Patrón | Mitigación |
| ------ | ---------- |
| Relanzar worker «muerto» por falta de commits | Señal = mtime del worktree, no cadencia de commits |
| Merge de `wp/*` a principal antes del ✅ | **Merge solo post-aceptación** (caso fundante C05) |
| Dos workers en el mismo dir de entrega | Dirs/ramas distintos; brief declara conflicto |
| Aceptar extracción sin consumidor | Eje I en el BRIEF |
| Demoler y dejar lógica huérfana | Eje II: destino por símbolo |
| Layout sin dedup | Eje III en auditoría |
| Contrato con un solo cliente | Eje IV programado como gate |
| Ocultar al vigía o revelar el marco | Eje V: asimetría de marco |
| Un commit mezcla ✅ de un WP + brief 🔶 de otro | V2: commits de gobierno atómicos (reglas 2+7) |
| Cerrar ola con ramas `wp/*` mergeadas vivas | Checklist cierre (regla 10) |
| Activación con agente que ya conoce el marco | Regla 13: agente fresco |
| Ceguera solo del árbol; fuga en commit intermedio | Regla 14: `git log -p` + squash |
| `grep | head && echo OK` como evidencia | Regla 14 práctica: `grep -c` / `grep -q` |
| Info de sesión en carpeta de IDE / memoria como verdad | Regla 15: solo config funcional; el plan trazado es la única verdad |
| Cerrar ola sin run-id verde de CI/Release | Regla 16: citar run-id por cada repo tocado |
| Commitear sync-map con IDs de issue inventados | Regla 17: apply → mapa real → commit |
| Despacho multi-carril sin `Rn-<carril>` PASS | Convivencia §3 + §8 |
| E2E vía checkout raíz de territorio ajeno | Convivencia §7 (registry / scratch / post-gate) |
| Push de gobierno con `index.lock` sostenido | Convivencia §9: freeze de **ambos** carriles |
| Emular otro carril sin claim / sobre carril no idle | Convivencia §10: claim + idle real; doble-conductor = anomalía |
| Podar worktree con junction sin desenlazar (borra destino) | §10: chequear reparse + quitar el enlace antes de podar |
| Relevo de estación sin gorro (handoff citado como verdad, anomalía heredada como normal) | Sucesión v2: `lecciones-vnext.md` §10 + `ESTACION.md` §sucesión |
| Mutar antes de acreditar la raíz canónica | Detector de `vigilancia` → PASS o LOCK sin efectos |
| Invocar boot/handoff de estación antes del PASS | LOCK; ni fase 1 ni `OUT_DIR` |
| Tratar PASS adversarial como aceptación | `revision-adversarial.md`: el orquestador acepta |
| Usar contrarrevisión como gate post-merge | Dos barreras y dos evidencias distintas |
| Presentar gate semver local como C8 | `politica-dependencias-semver.md`: evidencia separada |
| Vigía escribe BACKLOG durante idle | Addenda dual al custodio; decide el orquestador |

## Señal de worker vivo

Trabajo callado + ráfaga final es normal. Un vigía que grita de más empuja
a relanzar — y el relanzamiento duplicado es el incidente que este ciclo
evita. Preferí mtime del worktree frente a «hace N minutos sin commit».
