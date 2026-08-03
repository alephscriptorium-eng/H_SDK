# BRIEF · RH-06 · escena delta parametrizable (territorio G)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-06 · Parametrización genérica de escena + fixture ciudad-v0 fuera de G
Rama: wp/rh-06-escena-generica (desde g-sdk wp/rh-ejecucion = 9f434b3…)
Worktree: C:/S_LAB/.worktrees/g/rh-06  (o C:/S_LAB/wt/g-rh-06)
Reporte: copiar también a h-sdk es OPCIONAL; reporte canónico en
  g-sdk/plan/REPORTES/RH-06-escena-generica.md
  + espejo h-sdk/plan/REPORTES/RH-06-escena-generica.md (commit en h solo espejo
  si el orquestador lo pide; preferir reporte en G y path citado en handoff)

WORLD_ROOT para efectos G: C:/S_LAB/g-sdk (PASS con 4 vars)
PROHIBIDO tocar wp/g-prueba-hm-adaptacion (checkpoint 35cbded).

Lecturas: plan.md step 6 (en h-sdk) · RH-04 matriz · packages/delta/arg-domain
Eje: I

Trabajo:
1. Reaplicar parametrización genérica de escena a createArgDomainState, reducer,
   nav y proyecciones; delta-v0 permanece default idéntico (prueba de paridad).
2. Extraer ciudad-v0 a fixture de aceptación/configuración (paquete fixture o
   path bajo examples/fixtures — NO como verdad de dominio G).
3. Escena mínima distinta que demuestre que no quedan ids grifo-a / orillas /
   cantera congelados en el core.
4. Tests: test:delta + paridad delta-v0 + escena inyectada verdes.

ALCANCE_DIFF (g-sdk): packages/delta/arg-domain/** · tests relacionados ·
  fixture ciudad-v0 · plan/REPORTES/RH-06-*
PROHIBIDO: publicar npm; fusionar checkpoint; tocar h-sdk producto; document-machine
  limpio (RH-09); editar BACKLOG h.

Identidad: git -c user.name="worker-RH-06" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: normal
MOTIVO_RIESGO: extracción/parametrización de dominio; sin publish ni frontera de secretos.
CONTRAEVIDENCIA_REQUERIDA:
  - test paridad delta-v0 PASS
  - grep en arg-domain (excl. fixtures/tests de la escena mínima) sin hardcode
    grifo-a como dependencia del default path de producción — documentar hits
  - ciudad-v0 no es export/main de @zeus/arg-domain
REVISOR_DISTINTO_WORKER: no requerido

Empieza: PASS G → worktree desde wp/rh-ejecucion → implementar → tests → reporte → PARAR.
Handoff al orquestador: rama tip + path reporte G (y espejo H si lo creaste en
rama h separada; si no, solo G).
```
