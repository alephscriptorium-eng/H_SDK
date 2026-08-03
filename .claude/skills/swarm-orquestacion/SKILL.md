---
name: swarm-orquestacion
description: >-
  Protocolo de swarm marco-agnóstico: roles (orquestador, worker, revisión,
  corrección), ciclo prep→worker→revisión→merge, BRIEF, plantilla de reporte
  y cinco ejes de CA por tipo de WP. Activar al montar o operar el plan/ de
  cualquier mundo; parametriza rutas y BACKLOG del consumidor.
---

# Skill · swarm-orquestacion

Método para orquestar un swarm de agentes sobre **el mundo** (parámetro:
raíz del repo o carpeta del mundo, worktrees, `plan/BACKLOG.md` del
consumidor). No nombra mundos reales ni el marco.

## Cuándo aplicar

- Arrancar el `plan/` de un mundo nuevo solo con este skill.
- Operar un lote de WPs: asignar → implementar → revisar → merge.
- Exigir los **cinco ejes** como criterios de aceptación según el tipo de WP
  (ver `reference/ejes-ca.md`).
- Operar **varios orquestadores** en paralelo sobre territorios
  emparentados: contrato en
  `reference/convivencia-multi-orquestador.md`.

## Parámetros del mundo

| parámetro | significado | ejemplo local |
| --------- | ----------- | ------------- |
| `MUNDO_RAIZ` | raíz del repo o carpeta del mundo | ruta absoluta del consumidor |
| `PLAN_DIR` | directorio de plan | `$MUNDO_RAIZ/plan` |
| `ALCANCE_DIFF` | prefijo(s) donde el worker puede escribir | p. ej. `plan/` o carpeta del pack |
| `WORKTREE_BASE` | directorio padre de worktrees paralelos | hermano de `MUNDO_RAIZ` |
| `RAMA_WP` | patrón de rama | `wp/<id>-<slug>` |

La calibración concreta (rutas, gates, sellos) vive en el `plan/` del
mundo, no en este skill.

## Preflight antes de mutar

Antes de crear directorios, escribir, arrancar watchers, ejecutar git mutable,
editar el plan, crear ramas o worktrees, verificá la identidad de la raíz con
el detector canónico de `vigilancia`:
`../vigilancia/scripts/verificar-identidad-raiz.mjs`. Su contrato y parámetros
viven en `../vigilancia/reference/ESTACION.md`; este skill no los redefine.

El orquestador adjunta a cada despacho y handoff de arranque la calibración
explícita `WORLD_ROOT`, `CANONICAL_WORLD_ROOT`, `READ_ONLY_ROOTS` y
`DOWNSTREAM_PATTERNS`. Si falta cualquiera, no hay despacho ni boot.

Orden obligatorio: `DETECTOR → PASS|LOCK → EFECTOS`. Solo
`identidad-raiz: PASS` habilita la preparación. `LOCK identidad-raiz` es
fail-closed y se devuelve al custodio con cero efectos: no `mkdir`, escritura,
watcher, git mutable, plan, rama, worktree, boot, handoff ni `OUT_DIR`. Se
solicita otro clone de trabajo, pero el orquestador no lo crea ni lo elige. El
mismo preflight precede el handoff de arranque a `estacion-viva`
(`../estacion-viva/reference/BOOT.md`).

## Montaje rápido (mundo nuevo)

1. Obtené `PASS` del preflight de identidad.
2. Copiá o generá el esqueleto con `scripts/montar-plan.sh` (ver README).
3. Rellená `VISION.md`, `PRACTICAS.md` (reglas del mundo) y el primer
   `BACKLOG.md`.
4. Los prompts de rol viven en `plan/roles/` (copias del skill o enlace a
   `reference/roles/`).
5. Arrancá el ciclo: orquestador → BRIEF → worker → revisión selectiva →
   aceptación → merge → gate post-merge.

Detalle: `reference/ciclo.md` · roles: `reference/roles/` · ejes:
`reference/ejes-ca.md` · re-plan: `reference/RE-PLAN-protocolo-swarm.md` ·
ejemplo: `examples/`.

## Ciclo (resumen)

```text
0. Orquestador: identidad canónica PASS; si LOCK, devolver sin efectos
1. Orquestador: estado del BACKLOG, lote paralelo, 🔶 + BRIEF por WP
2. Worker: una rama (y worktree si hay paralelo); implementa; reporta
3. Si el riesgo lo exige: contrarrevisión adversarial read-only
4. Orquestador (revisión ordinaria): ✅ + merge, o devolución numerada
5. Tras merge: gate del carril; no confundirlo con la contrarrevisión
6. Si devolución: mismo worker, misma rama (corrección)
```

## Reglas de oro

1. Un WP = un chat worker = una rama = (si hay paralelo) un worktree.
2. Solo el orquestador escribe en BACKLOG; el custodio cierra decisiones
   abiertas.
3. El worker no edita BACKLOG ni replanifica olas.
4. Evidencia literal; lo no comprobado se marca `<pendiente>`.
5. Los cinco ejes son CA obligatorios **por tipo de WP** (no opcionales).
6. Cara pública del skill: prueba de ceguera del paquete (ver README).
7. Gobierno atómico (V2): un commit no mezcla aceptación (✅) con brief
   (🔶) de otro WP — ver `reference/reglas-metodo-v03.md` §V2.
8. Cierre de ola: checklist de higiene obligatorio
   (`reference/reglas-metodo-v03.md`).
9. Activación de mundo (regla 13): la ejecuta un agente **fresco** que
   solo conoce el skill — jamás uno con contexto del marco.
10. Ceguera (regla 14): además del árbol, verificar historial reachable
    (`git log -p`); fuga intermedia = squash antes del merge.
11. Fuente de verdad única (regla 15): el plan trazado en git, no la
    memoria interna del agente ni las carpetas de IDE. Se conserva la
    config funcional del entorno; se prohíbe el texto de info de sesión
    (markdowns, identificadores). Verificar contra el plan, no contra el
    recuerdo.
12. Cierre con runner (regla 16): al cerrar ola, citar run-id VERDE de CI
    y de Release (u homólogo) del tip de **cada repo tocado**.
13. Sync-map post-apply (regla 17): el mapa de proyección se commitea
    **después** de que los issues existan; mapa especulativo = devolución.
14. Convivencia multi-orquestador: partición de obra/gobierno, V2 por
    carril, vigía único `Rn-<carril>`, higiene pre-despacho y e2e por
    vías permitidas — ver
    `reference/convivencia-multi-orquestador.md` (fuente única).
15. Revisión por riesgo: clasificación, campos y protocolo viven únicamente
    en `reference/revision-adversarial.md`; un PASS read-only precede la
    aceptación cuando corresponda, pero no la concede.
16. Dependencias y semver: política, inventario runtime, probes y separación
    gate local/C8 viven en `reference/politica-dependencias-semver.md`.
17. Idle y comunicación: `vigilancia` propone candidatos sin escribir
    BACKLOG y entrega la salida dual de
    `../vigilancia/reference/ADDENDA-DOS-CARAS.md`; el orquestador conserva
    decisión y planificación.
18. Sucesión v2 «gorro»: el relevo de estación viva usa handoff volátil,
    ronda Q&A, herencia de anomalías **como anomalía**, rol temporal con
    origen declarado y anclas activas vs citas históricas marcadas
    `[cita inerte]` — `reference/lecciones-vnext.md` §Sucesión v2 +
    `../vigilancia/reference/ESTACION.md` §sucesión.
19. Claim de carril antes de emular: claim en canal + idle real verificado;
    doble-conductor = anomalía registrable —
    `reference/convivencia-multi-orquestador.md` §10.
20. Poda segura de worktrees: chequear reparse points y **desenlazar** el
    junction antes de podar (borrar solo el enlace) —
    `reference/ciclo.md` §10.
21. Hostil-omite (contrarrevisión de fronteras de confianza): probar la
    **ausencia** —campo omitido, firma no aportada, opt-in off—, no solo el
    envío malformado; el default de lo ausente deniega —
    `reference/ejes-ca.md` §Hostil-omite.
22. Evidencia enmascarada en cara pública: el patrón vetado se cita
    **enmascarado** con **conteo literal** —
    `../vigilancia/reference/ADDENDA-DOS-CARAS.md`.

## Método v0.7 (costuras)

Base v0.6 + **cinco costuras** (reglas 18–22), lecciones del relevo y del
frente. Cada una vive en su fichero de referencia; el incremento de método
**son** estas costuras (mismo patrón que v0.6):

1. **Sucesión v2 «gorro»** — relevo de estación viva con handoff volátil,
   ronda Q&A, herencia de anomalías como anomalía, rol temporal con origen
   declarado y anclas activas vs citas históricas marcadas `[cita inerte]`:
   `reference/lecciones-vnext.md` §Sucesión v2 +
   `../vigilancia/reference/ESTACION.md` §sucesión.
2. **Claim de carril antes de emular** — claim en canal de estación + idle
   real; doble-conductor = anomalía registrable:
   `reference/convivencia-multi-orquestador.md` §10.
3. **Poda segura de worktrees** — desenlazar junctions / reparse antes de
   podar (borrar solo el enlace); alternativa `symlinkDirectories`:
   `reference/ciclo.md` §10.
4. **Hostil-omite** — la contrarrevisión de fronteras de confianza prueba la
   **ausencia** (campo omitido, firma no aportada, opt-in off), no solo el
   malformado: `reference/ejes-ca.md` §Hostil-omite + `roles/REVISION.md`.
5. **Evidencia enmascarada en cara pública** — el patrón vetado se cita
   enmascarado con **conteo literal**; retroactividad a criterio de cada
   mundo: `../vigilancia/reference/ADDENDA-DOS-CARAS.md`.

No se crea `reglas-metodo-v07.md`: como en v0.6, el incremento son las
costuras en sus ficheros vivos, no un nuevo bloque de reglas numeradas.

## Método v0.6 (costuras)

Diecisiete reglas de borde (v0.5) + **contrato de convivencia
multi-orquestador** (fuente única:
`reference/convivencia-multi-orquestador.md`). Base: v0.5
(`reglas-metodo-v05.md` → v04 → v03). Resumen operativo en
`reference/ciclo.md` y ritual del orquestador.
(v0.2–v0.5 quedan como histórico de reglas numeradas; no se crea
`reglas-metodo-v06.md` — el incremento de método es el contrato de
convivencia.)

## Recursos

| ruta | contenido |
| ---- | --------- |
| `reference/roles/` | ORQUESTADOR, WORKER, REVISION, CORRECCION, BRIEF, README |
| `reference/ejes-ca.md` | cinco ejes → CA por tipo (+ ceguera 13/14 + hostil-omite) |
| `reference/RE-PLAN-protocolo-swarm.md` | fuente narrativa de los ejes (doctrina) |
| `reference/ciclo.md` | prep → merge, anti-patrones y poda segura de worktrees (§10) |
| `reference/lecciones-vnext.md` | sucesión vigía · checkout declarado · worktree por rol · raíz por constelación · sucesión v2 «gorro» |
| `reference/revision-adversarial.md` | selección por riesgo + contrarrevisión read-only pre-aceptación |
| `reference/politica-dependencias-semver.md` | dependencias directas + políticas semver + gate local/C8 |
| `reference/convivencia-multi-orquestador.md` | **fuente única**: convivencia multi-orquestador (v0.6) + claim de carril pre-emulación (§10) |
| `reference/reglas-metodo-v05.md` | reglas 16–17 (run-id verde + sync-map post-apply) + checklist |
| `reference/reglas-metodo-v04.md` | histórico v0.4: regla 15 + checklist (base de v0.5) |
| `reference/reglas-metodo-v03.md` | 14 reglas + V2 commits gobierno + checklist ola (base de v0.4) |
| `reference/reglas-metodo-v02.md` | histórico v0.2 (12 reglas; apunta a v0.3) |
| `reference/plantilla-reporte.md` | plantilla de reporte de WP |
| `examples/mundo-nuevo-plan/` | esqueleto mínimo de `plan/` |
| `examples/simulacion-montaje.md` | simulación documentada (CA de montaje) |
| `scripts/montar-plan.sh` | genera `plan/` + MAPA-RAIZ/REPO/TALLER (#19) |
| `reference/plantillas/MAPA-*.md.tpl` | mapas de territorio con regla al pie |
| `scripts/comprobar-ceguera.sh` | grep de ceguera sobre este skill |
| `scripts/verificar-changelog.mjs` | gate opt-in del CHANGELOG de **gobierno** (WP-id ↔ BACKLOG; `--role gobierno` + rutas); no aplica a CHANGELOG de paquete |
| `scripts/proyectar-backlog.mjs` | proyección del backlog a issues (export/import; sin sync; gate ceguera) — ver `reference/proyeccion-issues.md` |
