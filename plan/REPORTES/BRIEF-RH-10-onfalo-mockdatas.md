# BRIEF · RH-10 · Ónfalo pinneado + mockdatas-ciudad

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-10 · Publicar/pinnear Ónfalo read-only + @zeus/mockdatas-ciudad Lore
Rama: wp/rh-10-onfalo-mockdatas (desde g-sdk wp/rh-ejecucion = 9f434b3…)
Worktree: C:/S_LAB/.worktrees/g/rh-10  (o C:/S_LAB/wt/g-rh-10)
Reporte: g-sdk/plan/REPORTES/RH-10-onfalo-mockdatas.md
  (+ espejo opcional en h-sdk/plan/REPORTES/)

Preflight G PASS (4 vars). No tocar checkpoint wp/g-prueba-hm-adaptacion.

Lecturas: plan.md step 10 · packages/mockdatas-ciudad · RH-04 (ambos ROJO hoy)
Eje: I

Trabajo:
1. Empaquetar Ónfalo como artefacto read-only: piezas, manifest, media types, hashes.
   Consumidor resuelve por package/API — nunca ruta de checkout H/G.
2. Publicar o dejar listo @zeus/mockdatas-ciudad con volúmenes Lore necesarios.
3. Verificación de sello: leer manifest del paquete → identidad artefacto/version/hash.
4. Si no hay credenciales de publish al registry: `npm pack`, install limpio desde
   tarball en temp SIN siblings, documentar `pending_registry_publish` con evidencia
   pack+install; no fingir VERDE de registry.

ALCANCE_DIFF (g-sdk): packages/mockdatas-ciudad/** · paquete/fixture onfalo nuevo ·
  plan/REPORTES/RH-10-* · package metadata publish
PROHIBIDO: sibling discovery; ledger local; implementar lengua/provider en H;
  editar BACKLOG h; reset checkpoint.

Identidad: git -c user.name="worker-RH-10" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: publish/pack de materia consumible; falso verde de “instalable”
  sin manifest/sello rompería H/V.
CONTRAEVIDENCIA_REQUERIDA:
  - install desde tarball/registry en dir temp sin C:/S_LAB/h-sdk ni z-sdk en path
  - sello produce hash/identidad desde manifest (comando literal)
  - grep del paquete empaquetado sin ../h-sdk ni rutas absolutas S_LAB
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → pack/publish → verify sello → reporte → PARAR.
```
