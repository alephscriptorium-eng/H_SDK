# HANDOFF · RH-16 · carril V (v-sdk)

| dato | valor |
| ---- | ----- |
| emisor | orquestador-H · WORLD_ROOTS `C:\S_LAB\h-sdk` · `C:\S_LAB\g-sdk` |
| fecha | 2026-08-03 |
| WP | **RH-16** (lane `v`) · estado en BACKLOG: **🔶 encolado/handoff** |
| tip H | `9bfd7ff` (`main`) |
| tip G | `6b302b7` (`main`) · checkpoint `wp/g-prueba-hm-adaptacion@35cbded` **intacto** |
| tip V (observado al emitir) | `7eecfd4` (`main`, limpio) |
| BRIEF | [`BRIEF-RH-16-servicio-experiencia-v.md`](./BRIEF-RH-16-servicio-experiencia-v.md) |
| contrato | [`../CONTRATO-ACEPTACION.md`](../CONTRATO-ACEPTACION.md) |
| matriz | [`RH-04-MATRIZ-CONTRATOS.md`](./RH-04-MATRIZ-CONTRATOS.md) (sensor 2026-08-03T16:34:21.973Z) |

Este documento **no implementa** V. Es el paquete de arranque para un worker del
carril `v-sdk`. Orquestador H **no** despacha obra sobre `v-sdk` sin este
handoff y PASS de identidad en el clone V.

---

## 1 · Mandato (plan.md step 16)

En V, crear un servicio de experiencia H sobre `MinimalMcpClient` /
`ResourceProjectionService`: descubrir el servidor H por catálogo, listar y
leer resources; validar versión/shape publicado; modelar `pending`,
`connected`, `error` y `complete` sin datos hardcodeados. No importar H por
sibling ni reutilizar `IPlay`/`ICompany` hasta que gobiernen una runtime real.

Deps BACKLOG: `RH-05` (contrato). Integración real post `RH-14`/`RH-15`
(composition + vertical hasta `pending_external` visible).

---

## 2 · Qué deja H listo (evidencia literal)

| superficie | estado | ancla |
| --- | --- | --- |
| Composition Bun/TS `@h-sdk/app-prueba-hm` | ✅ RH-14/15 | tip `9bfd7ff` |
| Vertical registry hasta Ónfalo + stop E/línea/evidencia | ✅ RH-15 | `pending_external_contract`; **cero** `complete` |
| Resources H (in-process) | shapes `0.1.0` | `packages/app-prueba-hm/src/resources.ts` |
| Packs G tipados en registry | ✅ publicados | `arg-domain@0.1.0`, `arg-runtime@0.1.1`, `arg-player-mcp@0.1.0`, `arg-view-kit@0.1.0` (ver §4) |
| `@zeus/onfalo-fixture@0.1.1` | pin H + publish RH-15 | Actions 30832131073; sensor RH-04 candidate-scan aún ROJO (ver §4) |

### URIs / shapes de proyección H→V (no reexport Zeus)

```text
RESOURCE_VERSION = 0.1.0
h-sdk://experiencia/estado     → PayloadEstado
  { resourceVersion, estado, motivo?, superficie?, pending_external[],
    acople: { ciudad, delta, m } }
h-sdk://experiencia/escena     → PayloadEscena
  { resourceVersion, sesionId, disponible, motivo? }
h-sdk://experiencia/evidencia  → PayloadEvidencia
  { resourceVersion, verificado, evidenciaId, pending_external, motivo? }
```

API in-process hoy: `listResources()` / `readResource(uri)` / `snapshot()` en
`AlmacenResources`. `bun run demo` imprime JSON con esos tres URIs.

---

## 3 · Gaps que V debe mostrar (no rellenar)

| gap | owner | efecto en UI V |
| --- | --- | --- |
| Transport MCP de producto (stdio/HTTP) que proyecte `AlmacenResources` | **H** (post-handoff; no bloquea tests con fixtures) | hasta existir: fixtures MCP; integración real queda `<pendiente>` |
| LORE-HM tipado | S/lengua | `pending_external_contract` |
| Provider E | E | `pending_external_contract` |
| `line.materialize` / linea-kit tipado | Z | `publicado-sin-types` / pending |
| Evidencia canónica HUB | HUB | `pending_external_contract` |

**Prohibido en V y en H:** inventar provider E, lore, evidencia o
`line.materialize` para “completar” la demo.

---

## 4 · Matriz RH-04 post-publish (sensor fresco)

Generado: `2026-08-03T16:34:21.973Z` · **7 VERDE / 9 ROJO**.

VERDE: ciudad@0.1.1, authority-kit@0.4.2, rooms@0.1.2, player-mcp-kit@0.1.4,
arg-domain@0.1.0, arg-runtime@0.1.1, arg-player-mcp@0.1.0.

ROJO relevante para V:

- `@zeus/arg-view-kit@0.1.0` — types en disco; **runtime_import_fail** bajo
  Node del sensor (paquete browser-safe; RH-17 renderiza en webview).
- `@zeus/mockdatas-ciudad@0.1.0` — **publicado-sin-types**.
- Ónfalo (candidates) — sensor ROJO; H ya pinnea `@zeus/onfalo-fixture@0.1.1`
  (RH-15). Re-chequear con pin exacto al consumir.
- LORE-HM / provider-E / ceremonia-HUB — `pending_external_contract`.
- `linea-kit@0.3.0` / `acta-kit@0.1.1` — `publicado-sin-types`.

No esperar investigación z-sdk para arrancar RH-16 (fixtures + parseo).

---

## 5 · Preflight e identidad (carril V)

```text
WORLD_ROOT=C:/S_LAB/v-sdk CANONICAL_WORLD_ROOT=C:/S_LAB/v-sdk
READ_ONLY_ROOTS='["C:/S","C:/S_META"]'
DOWNSTREAM_PATTERNS='["S/*"]'
```

Detector: el del skill `vigilancia` si existe en el clone V; si no,
documentar `⏳` y limitar efectos hasta PASS canónico. Identidad git:

```bash
git -c user.name="worker-RH-16" -c user.email="alephscriptorium@gmail.com"
```

No tocar `g-sdk` checkpoint. No mutar h-sdk salvo reporte si se acuerda.

---

## 6 · Criterios de aceptación (CA del BACKLOG)

- Tests de parseo/estados de resources H (version/shape).
- Fixtures MCP tras contrato RH-05 (pueden ser sintéticos).
- Integración real tras RH-14/15 cuando exista transport; si no, marcar
  `<pendiente>` sin fingir `connected`/`complete`.
- Ejes I, IV; hostil-omite en el BRIEF.

Siguiente en lote V tras ✅ RH-16: **RH-17** (vista) → **RH-18** (VSIX).

---

## 7 · Qué hace el worker V (checklist)

1. PASS identidad en `v-sdk`.
2. Rama `wp/rh-16-experiencia-h` desde `main`.
3. Implementar servicio + tests según BRIEF.
4. Reportar con evidencia literal; PARAR. No RH-17 en el mismo chat.
