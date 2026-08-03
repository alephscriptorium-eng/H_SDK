# RH-19 · E2E clean-room fail-closed — acta

| dato | valor |
| ---- | ----- |
| agente | worker-RH-19 / orquestador-H |
| fecha | 2026-08-03T17:54:57Z |
| WORLD_ROOT | `C:\S_LAB\h-sdk` · identidad-raiz **PASS** |
| tip H `main` | `5fadbb4` (docs tip final transport `0ea993b`; merge obra MCP `e38ba28`) |
| tip V `main` | `27a98ef` (consumo env/catalog `h.experiencia`) |
| tip G `main` | `6b302b7` · checkpoint `wp/g-prueba-hm-adaptacion@35cbded` **intacto** |
| clean-room | `C:\tmp\rh-19-clean-20260803-194846\` (solo `h-sdk/` + `v-sdk/`; **sin** `g-sdk`/`z-sdk`/`playground`) |
| transport | cerrado · ver [`RH-TRANSPORT-MCP-H-V.md`](./RH-TRANSPORT-MCP-H-V.md) |
| veredicto CA | **fail-closed PASS** (acta + resolución sin siblings + PARAR en gaps) |
| claim producto / demo terminada | **PROHIBIDO · no declarado** (`completeFingido: false`) |

> **PARAR.** Esta acta no declara demo completa ni producto. La máquina y V
> observan `pending_external_contract`. Gaps E / línea (input E) / HUB quedan
> visibles. Room viva real sigue stub en el path demo documentado.

---

## 1 · Método clean-room

1. Clone detached de H tip `5fadbb4` y V tip `27a98ef` bajo
   `C:\tmp\rh-19-clean-…` (fuera de `C:\S_LAB`, sin siblings g/z/playground).
2. En H limpio: `.npmrc` registry scriptorium · `bun install --frozen-lockfile`.
3. Probe de resolución `@zeus/*` → paths bajo `…/h-sdk/node_modules/@zeus/…`
   · **SIBLING_RESOLUTION: PASS**.
4. Gates H limpio: `bun run typecheck` exit 0 · `bun run test:reachability`
   **13 pass** (incl. `mcp-http`) · `bun run demo` → máquina
   `pending_external_contract`, nunca `complete`.
5. Transport vivo desde checkout limpio:
   ```bash
   H_SDK_MCP_HOST=127.0.0.1 H_SDK_MCP_PORT=18765 bun run mcp
   ```
6. Smoke HTTP + cliente V `MinimalMcpClient` (jest env-gated) contra ese
   endpoint.

---

## 2 · Capturas

### 2.1 Commits

| repo | tip | nota |
| ---- | --- | ---- |
| H | `5fadbb4` | main; obra MCP merge `e38ba28`; tip docs transport `0ea993b` |
| V | `27a98ef` | main; discover `H_SDK_MCP_*` / launcher `h.experiencia` |
| G | `6b302b7` | main packs; ckpt `35cbded` no tocado |

### 2.2 Packs pinneados (install limpio observado)

| paquete | versión |
| ------- | ------- |
| `@zeus/arg-domain` | 0.1.0 |
| `@zeus/arg-runtime` | 0.1.1 |
| `@zeus/arg-player-mcp` | 0.1.0 |
| `@zeus/onfalo-fixture` | 0.1.1 |
| `@zeus/mockdatas-ciudad` | 0.1.0 |
| `@zeus/ciudad` | 0.1.1 |
| `@zeus/linea-kit` | 0.4.0 |
| `@zeus/rooms` | 0.1.2 |
| `@zeus/player-mcp-kit` | 0.1.4 |

Resolución Ónfalo ejemplo:
`C:\tmp\rh-19-clean-20260803-194846\h-sdk\node_modules\@zeus\onfalo-fixture\…`
· `siblingHit: false`.

### 2.3 Salud M / Ciudad (path demo documentado)

| campo | valor observado | nota |
| ----- | --------------- | ---- |
| M `connected` | `true` | acople resource `m: conectado` |
| M `lastStateTs` | `1785779696880` (probe factory) | no expuesto en resource `estado` |
| Ciudad `stateId` | `S-rh15` | observables aceptación (`depsDemoPorDefecto`) |
| Ciudad `ledgerId` | `L-rh15` | idem |
| Room viva | **stub** (`stubsRoomSinRed`) | gap: no socket real en este run |

### 2.4 Ónfalo

| campo | valor |
| ----- | ----- |
| identity | `@zeus/onfalo-fixture@0.1.1#sha256:493c961d3d68374c17549aeb6d54046441246757bfb07101eea2c5debedfeec1` |
| hash sello | `493c961d3d68374c17549aeb6d54046441246757bfb07101eea2c5debedfeec1` |
| `allSealed` | `true` |
| pieza | `2024-05-01_primero-de-mayo` · sha256 `bcaf7f446aa2417811d0e12de98a6588a020fddf7c6cb289138d4a40e4c17fee` |

### 2.5 Provider / línea / evidencia

| superficie | captura | veredicto |
| ---------- | ------- | --------- |
| provider E | salida | **pending** · `pending_external_contract: provider-E (RH-11)` |
| línea | id | **pending** · requiere análisis E previo |
| evidencia HUB | veredicto | **pending** · `verificado: false` · `evidenciaId: null` · acta-kit ≠ canónico |

### 2.6 Transport MCP H→V (vivo · clean-room)

Endpoint:

```text
H_SDK_MCP_HOST=127.0.0.1
H_SDK_MCP_PORT=18765
url: http://127.0.0.1:18765/mcp
health: http://127.0.0.1:18765/mcp/health
capability: h.experiencia
catalogEntry.id: h-sdk
```

Smoke (server H limpio):

| gate | resultado |
| ---- | --------- |
| `GET /mcp/health` | `ok: true` · server `h-sdk-prueba-hm@0.1.0` · `h.experiencia` |
| `initialize` | protocol `2025-03-26` |
| `resources/list` | 3 URIs v0.1.0 |
| `resources/read` estado | `pending_external_contract` |
| `completeFingido` | **false** |
| veredicto | **SMOKE_OK** |

URIs:

- `h-sdk://experiencia/estado`
- `h-sdk://experiencia/escena` (`sesionId` UUID observado)
- `h-sdk://experiencia/evidencia`

### 2.7 Cliente V / MinimalMcpClient

| gate | resultado |
| ---- | --------- |
| tip V | `27a98ef` |
| discover | env `H_SDK_MCP_HOST`+`H_SDK_MCP_PORT` **o** launcher catalog `h.experiencia` |
| jest env-gated | `MinimalMcpClient lee resources reales del server H` **PASS** (exit 0) |
| fase observada | `pending_external_contract` (≠ `complete` / ≠ success fingido) |
| VSIX | `dist/aleph-0-0.2.0.vsix` presente (RH-18); fase UI con transport = proyección real vía env (no `transportPending`) cuando `H_SDK_MCP_*` set |

Reporte transport canónico H:
[`RH-TRANSPORT-MCP-H-V.md`](./RH-TRANSPORT-MCP-H-V.md).

---

## 3 · PARAR · gaps (no rellenar en H)

| # | gap | owner | bloquea |
| - | --- | ----- | ------- |
| G1 | provider E / LORE-HM tipado en registry | E / lengua | `analyzed` |
| G2 | materialización línea con input E real | Z API lista; falta E | `line_materialized` |
| G3 | evidencia/ceremonia HUB canónica | HUB | `evidence_verified` |
| G4 | room/socket Ciudad viva (demo usa stubs) | ops / rooms endpoint | smoke “red real” |
| G5 | declaración demo `complete` desde V | owners + observación | producto |

**Cero claim `complete` / demo terminada.** CA de RH-19 = clean-room +
capturas + fail-closed honesto — **cumplida**. Cierre narrativo RECAP/H10–H33
= **RH-20** (otro GO).

---

## 4 · Veredicto

| eje | resultado |
| --- | --------- |
| clean-room install + resolución sin siblings | **PASS** |
| demo / máquina fail-closed | **PASS** (`pending_external_contract`) |
| transport MCP producto H→V | **PASS** (vivo; tip H `5fadbb4` / `0ea993b`) |
| cliente V MinimalMcpClient | **PASS** (env-gated contra server limpio) |
| demo producto completa | **NO** — PARAR en G1–G5 |

**BACKLOG RH-19:** ✅ fail-closed CA cumplida (gaps listados; sin fingir complete).
