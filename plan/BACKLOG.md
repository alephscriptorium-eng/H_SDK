# BACKLOG · recuperación Prueba-H-M

Fuente narrativa: [`../plan.md`](../plan.md) (20 steps).  
**WORLD_ROOTS de este orquestador:** `C:\S_LAB\h-sdk` · `C:\S_LAB\g-sdk`.  
`v-sdk` y owners externos viven en lanes `v` / `ext`: se encolan aquí; **no se despachan** workers sobre ellos desde este gorro sin handoff al carril dueño.

| dato | valor |
| ---- | ----- |
| serie | `RH-\d{2}` |
| prioridades | P0 · P1 · P2 |
| lanes | `h` · `g` · `v` · `ext` · `gov` |
| estados | ⬜ pendiente · 🔶 en curso · ✅ aceptado |
| despacho | nada 🔶 sin GO de lote del custodio |
| legado H0–H3 | H01–H04 ✅ históricos; H05/H10–H33 **no despachar** — se cierran o reescriben en RH-20 |

Calibración identidad (ambos roots, antes de cualquier efecto):

```text
WORLD_ROOT=<root> CANONICAL_WORLD_ROOT=<root>
READ_ONLY_ROOTS='["C:/S","C:/S_META"]'
DOWNSTREAM_PATTERNS='["S/*"]'
```

---

## Lane gov · gobierno dual / preservación

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **RH-01** | P0 | ✅ 2026-08-03 · H e53694e+e3fb956 · G 35cbded · acta REPLAN · contrarrevisión PASS · Revisar unstaged de h-sdk y g-sdk excluyendo secretos outputs y generados; checks read-only; crear checkpoint en h-sdk/main (fundacion no alcanzable) y en g-sdk/wp/g-prueba-hm-adaptacion (adaptacion forense); registrar hash padre diff-stat checks y limites en C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md; dejar ambos repos con status limpio | acta REPLAN con hashes y git status limpio en h-sdk y g-sdk; cero secretos en los commits checkpoint | ninguna | III |
| **RH-02** | P0 | ✅ 2026-08-03 · merge 13e1f9e · H/G/V wp/rh-ejecucion · ckpt G 35cbded intacto · Sin fusionar checkpoints: crear ramas de ejecucion h desde su checkpoint para reemplazar superficie; g desde el padre del checkpoint para reaplicar solo piezas genericas; v desde main; conservar ramas checkpoint intactas como red de recuperacion | tres ramas de ejecucion existen y las checkpoint siguen alcanzables sin merge al tip de obra | RH-01 | III |
| **RH-03** | P1 | ✅ 2026-08-03 · merge bc01b33 · REPLAN §8 tabla cinco flags · claims tachados · Corregir en dossier y plan H las afirmaciones falsas de cero violaciones listo o product-reachable; tabla por artefacto con committed reachable observed clean-room owner-correct; solo cinco positivos permiten declarar producto | tabla de artefacto publicada en plan o REPLAN; claims falsos eliminados o tachados con evidencia | RH-01 | III |
| **RH-05** | P1 | ✅ 2026-08-03 · merge b132b2b · plan/CONTRATO-ACEPTACION.md · Definir contrato de aceptacion entre repos sin copiar shapes | documento de contrato en plan/ con owner por superficie y regla pending_external_contract | RH-04 | IV |
| **RH-19** | P0 | Ejecutar demo desde checkouts limpios H y V solo con packages pinneados registry y endpoints; prohibir resolucion via g-sdk z-sdk o playground; capturar versiones commits health lastStateTs state/ledger hash Onfalo provider linea y veredicto evidencia | acta E2E clean-room con las capturas; resolucion sin siblings | RH-15, RH-18 | IV, ceguera, hostil-omite |
| **RH-20** | P2 | Actualizar RECAP backlog y DECISIONES con verdad de reachability; cerrar o reescribir H10-H33; declarar demo solo si se observo completa desde V; checkpoints y boceto como evidencia historica | RECAP/BACKLOG/DECISIONES alineados; H10-H33 cerrados o reescritos; sin claim demo sin observacion V | RH-19 | III |

## Lane h · territorio h-sdk

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **RH-04** | P0 | ✅ 2026-08-03 · merge 587beea · 4 VERDE / 12 ROJO · mutante types-exports-no-disk ROJO · contrarrevisión PASS tras fix · Matriz ejecutable desde install limpio H | matriz paquete×gate en plan/REPORTES con verdes/rojos observados; cero paths sibling en resolucion | RH-02 | III, IV |
| **RH-12** | P0 | ✅ 2026-08-03 · merge 36551c9 · maquina+9 tests · EntradaCadena/PuertoActa=0 · contrarrevisión PASS · Rehacer packages/core | typecheck verde; transiciones unit-tested; grep sin EntradaCadena/PuertoActa en core | RH-05 | II |
| **RH-13** | P0 | ✅ 2026-08-03 · merge 28762d0 · 20 tests hostil-omite · wire Ciudad real · pending_external fail-closed · contrarrevisión PASS tras fix | adapters tipados consumen registry; smoke confirma state/ledger y lastStateTs; sin payloads destino/mensaje paralelos | RH-09, RH-10, RH-11, RH-12 | I, II, hostil-omite |
| **RH-14** | P0 | ✅ 2026-08-03 · merge 10d14e8 · app-prueba-hm · demo Bun/TS · 8 tests reachability · contrarrevisión PASS | bun typecheck + test reachability importan core y edges; demo raiz no apunta a server.mjs | RH-12, RH-13 | I, II |
| **RH-15** | P0 | ✅ 2026-08-03 · vertical registry · arg-runtime@0.1.1 + onfalo@0.1.1 · demo pending_external E · contrarrevisión PASS ·  flujo observado con confirmaciones; fallo explicito si falta contrato; cero modo replay | RH-10, RH-11, RH-14 | IV, hostil-omite |

## Lane g · territorio g-sdk

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **RH-06** | P0 | ✅ 2026-08-03 · G wp/rh-ejecucion@9293b3e (via merge RH-06) · arg-domain 76/76 · fixture ciudad-v0 · En rama G limpia reaplicar parametrizacion generica de escena | test:delta + paridad delta-v0 + escena inyectada verde; ciudad-v0 fuera de verdad G | RH-02, RH-04 | I |
| **RH-07** | P0 | ✅ 2026-08-03 · tip pack local + **publicado** Actions run [30831342542](https://github.com/alephscriptorium-eng/Z_SDK-games-library/actions/runs/30831342542) · `@zeus/arg-domain@0.1.0` + `@zeus/arg-runtime@0.1.0` tipados en registry | tarball + registry con types; consumidor limpio importa sin sibling H | RH-06 | I |
| **RH-08** | P1 | ✅ 2026-08-03 · tip pack local + **publicado** Actions 30831342542 · `@zeus/arg-view-kit@0.1.0` + `@zeus/arg-player-mcp@0.1.0` tipados en registry · conflicto test:delta resuelto en merge | tarballs + registry tipados; apps privadas; sin contenido Lore en view-kit | RH-06 | I |
| **RH-09** | P0 | ✅ 2026-08-03 · gate 4 tarballs VERDE · document-machine opt-in limpio · **publish registry VERDE** Actions 30831342542 (ref `wp/rh-ejecucion`) | gate G + npm view@0.1.0 tipado sin sibling H | RH-07, RH-08 | II, I, ceguera |
| **RH-10** | P1 | ✅ 2026-08-03 · `@zeus/onfalo-fixture@0.1.0` + `@zeus/mockdatas-ciudad@0.1.0` **publicados** Actions 30831342542 · sello PASS | packages pinneados instalables desde registry; sello con manifest del paquete | ninguna | I |

## Lane ext · owners externos (no territorio h/g)

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **RH-11** | P1 | ✅ 2026-08-03 · merge 520b1ea · 0/4 OK tipado · gaps+elevación S_META · Obtener publicaciones tipadas / pending_external por owners | contratos tipados en registry o pending_external_contract explicito por superficie; cero implementacion local en H | ninguna | IV, V |

## Lane v · handoff v-sdk (fuera de WORLD_ROOTS)

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **RH-16** | P1 | ✅ 2026-08-03 · tip V f12ac76 · tip H c3a0afe · 17 tests V · transport MCP producto H `<pendiente>` · Servicio experiencia H en V (MinimalMcpClient/ResourceProjectionService): descubrir server H listar/leer resources validar version/shape; modelar pending connected error complete sin hardcode; sin import sibling H ni IPlay/ICompany hasta runtime real | tests de parseo/estados; fixtures MCP tras RH-05; integracion real tras RH-14 | RH-05 | I, IV |
| **RH-17** | P1 | Vista V dedicada TreeView diagnostico + webview experiencia con CSP/nonce existentes; render Ciudad escena via arg-view-kit estado M Onfalo analisis linea evidencia; comandos = tools MCP; H sin paneles HTML; Teatro hardcodeado fuera del cambio | vista data-driven sin Teatro; compile/lint verdes | RH-08, RH-14, RH-16 | I |
| **RH-18** | P2 | Empaquetar VSIX y probar contra H/M reales; distinguir pending_external_contract connecting connected failed complete; no exito con resources stale ni actores/escenas inventados | VSIX instalable; transicion observada hasta estados reales | RH-15, RH-17 | IV, hostil-omite |

---

## Ola sugerida (tras GO)

| lote | WPs | nota |
| ---- | --- | ---- |
| 0 | RH-01 | preservacion dual; bloquea casi todo |
| 1 | RH-02 · RH-03 | ramas + verdad documental (paralelo tras RH-01) |
| 2 | RH-04 | matriz contratos desde H |
| 3 | RH-05 · RH-06 · RH-10 · RH-11 | contrato + escena G + artefactos + externos |
| 4 | RH-07 · RH-08 | packs G en paralelo tras RH-06 |
| 5 | RH-09 | gate publicacion G |
| 6 | RH-12 → RH-13 → RH-14 → RH-15 | reconstruccion H en serie |
| 7 | RH-16 → RH-17 → RH-18 | RH-16 ✅ tip V `f12ac76` · tip H `c3a0afe`; **siguiente:** RH-17 (vista) tras GO |
| 8 | RH-19 → RH-20 | cierre (bloqueado por V + owners E/línea/HUB) |

### Siguiente (post RH-16 · tip V `f12ac76` · tip H `c3a0afe`)

- **Despachable desde H/G ahora:** nada de producto H/G pendiente en lote 6.
  Gobierno: RH-16 ✅ aceptado (obra en V; no re-implementar en H).
- **Carril V:** siguiente es RH-17 (vista) cuando haya GO de lote; no encolar 🔶 hasta GO.
- **Bloqueado por owners externos:** LORE-HM · provider E · linea-kit tipado ·
  evidencia HUB (RH-11). H no rellena. Transport MCP producto H→V sigue
  `<pendiente>` (no inventar connected/complete).
- **No tocar:** checkpoint G `wp/g-prueba-hm-adaptacion@35cbded`.

## Anti-alcance (del plan)

- No revivir El Descenso/ceguera/holones como producto de esta ola.
- No copiar Teatro; no desarrollar provider/lengua/notaría en H.
- No fusionar la rama G completa tal cual; no siblings como runtime.
- No declarar demo parcial como terminada.
