# BRIEF · RH-09 · gate publish G (document-machine fuera + 4 tarballs limpios)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-09 · Rechazar document-machine sucio + verificar tarballs tipados aislados
Rama: wp/rh-09-gate-publish (desde g-sdk wp/rh-ejecucion @ 7532d8c…)
Worktree: C:/S_LAB/wt/g-rh-09
Reporte: g-sdk/plan/REPORTES/RH-09-gate-publish.md

Preflight G PASS (4 vars). Checkpoint wp/g-prueba-hm-adaptacion @ 35cbded
INTACTO (solo lectura forense).

Hecho observado (orquestador):
- En wp/rh-ejecucion, `packages/delta/arg-feeds/src/document-machine.mjs` NO existe
  (solo vive en el checkpoint forense 35cbded, con ancestorsOf/h-sdk + ledger local).
- Los packs tipados ya están en exec: arg-domain, arg-runtime, arg-view-kit, arg-player-mcp.

Trabajo:
1. Forense (read-only) desde 35cbded: inventariar tests gotas/sellos/excavación de
   document-machine; extraerlos a spec/fixture explícita bajo arg-feeds o
   plan/REPORTES/spec-document-machine/ consumible por adapter H, SIN portar
   sibling discovery / ledger / notaría local / fallback a copias.
2. Asegurar que NINGÚN paquete publicable incluye document-machine.mjs “tal cual”
   ni rutas ../h-sdk / ancestorsOf checkout. Si hay que añadir un feed limpio,
   que sea opt-in con deps/fixtures inyectadas — default deniega ausencia
   (hostil-omite).
3. Gate: npm pack de arg-domain, arg-runtime, arg-view-kit, arg-player-mcp;
   install+import+typecheck en directorio TEMP sin C:/S_LAB/h-sdk ni z-sdk
   (ni siblings) en resolve. Grep de cada tarball: 0 hits h-sdk / ledger local
   de notaría / paths absolutos S_LAB.
4. Ceguera (eje): evidencia grep en tarballs + árbol empaquetado.
5. pending_registry_publish OK si no hay auth; el gate local debe abrir en verde.

ALCANCE_DIFF: packages/delta/arg-feeds/** · specs/fixtures document-machine limpios ·
  scripts de gate opcionales · plan/REPORTES/RH-09-* · package.json solo si añade
  script de gate (como lotes previos).
PROHIBIDO: reset/mover checkpoint; BACKLOG h; publicar fingiendo registry VERDE;
  copiar document-machine sucio al tip de ejecución.

Identidad: git -c user.name="worker-RH-09" -c user.email="alephscriptorium@gmail.com"
Ejes: II, I, ceguera
RIESGO_REVISION: independiente
MOTIVO_RIESGO: gate de publicación + demolición de vía sucia; falso verde de tarball
  contaminado autorizaría H.
CONTRAEVIDENCIA_REQUERIDA:
  - grep en los 4 .tgz: h-sdk|ancestorsOf|S_LAB\\ → 0 (o documentado fuera de pack)
  - install temp: resolve paths sin h-sdk/z-sdk
  - typecheck/import de los 4 packs en ese temp EXIT 0
  - checkpoint tip sigue 35cbded
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree desde wp/rh-ejecucion → forense checkpoint → spec limpia →
pack/gate → reporte → PARAR.
```
