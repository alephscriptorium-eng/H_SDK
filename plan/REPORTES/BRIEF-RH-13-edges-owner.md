# BRIEF · RH-13 · edges de owner (Ciudad / delta / M / E / línea / evidencia)

```text
(rol) .claude/skills/swarm-orquestacion/reference/roles/WORKER.md

WP: RH-13 · Sustituir edge genérico por adapters alineados a puertos RH-12 + wire real
Rama: wp/rh-13-edges-owner (desde h-sdk main)
Worktree: C:/S_LAB/wt/h-rh-13
Reporte: plan/REPORTES/RH-13-edges-owner.md

Preflight h-sdk PASS (4 vars).

Lecturas:
- plan.md step 13 · plan/CONTRATO-ACEPTACION.md · packages/core (puertos RH-12)
- packages/edge-zeus/** (estado roto a propósito)
- RH-04 matriz · RH-09 gate · RH-11 gaps
Ejes: I, II, hostil-omite

Hechos:
- Core ya NO exporta PuertoCiudad/PuertoActa/EntradaCadena; usa
  PuertoEntradaCiudad, PuertoSesionDelta, PuertoAnalisisE,
  PuertoMaterializacionLinea, PuertoEvidenciaCanonica, PuertoProyeccion.
- Wire Ciudad real: walk {anchorId|nodeId}, announce {message},
  wake {tool, barrioId?, horseMode} desde actor unido/posicionado — NO
  {destino}/{mensaje} ni actor sintético `h-sdk`.
- G packs tipados: disponibles como tarball (pending_registry_publish). Consumir
  vía pack desde C:/S_LAB/g-sdk wp/rh-ejecucion@1fad30e o tarballs del gate RH-09
  en TEMP; prohibido paths sibling en producto final (package.json de H no debe
  quedar con file:../g-sdk para runtime permanente — si usas file: solo en smoke
  documentado, déjalo fuera del commit o como optionalDev con nota).

Trabajo:
1. Rehacer packages/edge-* (o reestructurar edge-zeus) implementando los 6 puertos
   del core contra owners:
   - Ciudad: @zeus/ciudad.makeIntent / EVENTS; confirmar state/ledger (no “hay transporte”).
   - Delta: @zeus/arg-domain + @zeus/arg-runtime (y player factory si aplica sesión).
   - M: @zeus/arg-player-mcp / @zeus/player-mcp-kit; connected exige connected+lastStateTs.
   - Análisis E / línea / evidencia: DELEGAR; si pending_external_contract → Resultado
     error/pending explícito (RH-11). Cero line.materialize/provider/ledger local en H.
2. Demoler TransporteZeus genérico y payloads paralelos destino/mensaje.
3. Hostil-omite: omitir firma/state/ledger/lastStateTs → denegar; no OK por omisión.
4. Smoke (aunque sea con mock de transporte/registry tarball): evidencia de
   state/ledger y lastStateTs cuando el camino es “conectado”.
5. typecheck del/los packages edge + tests de omisión.

ALCANCE_DIFF: packages/edge-zeus/** y/o packages/edge-* nuevos · package.json raíz
  solo pins registry/tarball justificados · plan/REPORTES/RH-13-*
PROHIBIDO: composition root app (RH-14); vertical E2E (RH-15); implementar
  LORE/provider/notaría; editar BACKLOG; sibling path permanente a g-sdk.

Identidad: git -c user.name="worker-RH-13" -c user.email="alephscriptorium@gmail.com"
RIESGO_REVISION: independiente
MOTIVO_RIESGO: frontera de confianza + demolición de payloads paralelos; falso
  “conectado” sin state/ledger/lastStateTs.
CONTRAEVIDENCIA_REQUERIDA:
  - grep edge: destino:|mensaje:|ActorId.*h-sdk|'h-sdk' → 0 en caminos Ciudad
  - omitir lastStateTs / ledger → no acople conectado (test)
  - packages/core sigue sin @zeus; edges son el único IO
  - superficies pending_external no devuelven ok() fingido
REVISOR_DISTINTO_WORKER: sí

Empieza: PASS → worktree → rehacer edges → tests hostil-omite → reporte → PARAR.
```
