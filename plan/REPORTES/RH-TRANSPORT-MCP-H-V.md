# RH-TRANSPORT · MCP producto H→V

| dato | valor |
| ---- | ----- |
| agente | worker-RH-transport / orquestador-H |
| fecha | 2026-08-03 |
| WORLD_ROOTS | `C:\S_LAB\h-sdk` (primario) · `C:\S_LAB\v-sdk` (ajuste mínimo) |
| cierra | `<pendiente>` transport de RH-16/18 |
| no cierra | provider E · evidencia HUB · `complete` de producto |

## Qué se entregó

1. **Server MCP producto** en `@h-sdk/app-prueba-hm`:
   - Streamable HTTP stateless `POST /mcp` (mismo contrato que `MinimalMcpClient` de V).
   - Resources `h-sdk://experiencia/{estado,escena,evidencia}` v0.1.0 desde `AlmacenResources` post-composition.
   - Health `GET /mcp/health`.
   - Fail-closed: no arranca si composition declara `complete`; no inventa E/HUB.
2. **Catálogo / descubrimiento**:
   - Fila impresa al arrancar: `{ id: h-sdk, name: prueba-hm, port, capabilities: [h.experiencia] }`.
   - Env mínimo reproducible: `H_SDK_MCP_HOST` + `H_SDK_MCP_PORT` (V los fusiona al catálogo).
3. **V (mínimo)**: `catalogFromEnv.ts` + merge en `ExperienciaHService` / `ExperienciaSession`.

## Cómo arrancar H

```bash
cd C:/S_LAB/h-sdk
# puerto fijo (recomendado para V)
H_SDK_MCP_HOST=127.0.0.1 H_SDK_MCP_PORT=18765 bun run mcp
# o efímero (port 0) — leer banner JSON / stderr
bun run mcp
```

Banner JSON incluye `mcp.url`, `catalogEntry`, `discoverEnv`.

## Cómo lo descubre V

1. **Env (sin launcher Zeus):**
   ```bash
   export H_SDK_MCP_HOST=127.0.0.1
   export H_SDK_MCP_PORT=18765
   ```
   V inyecta fila `h-sdk` con capability `h.experiencia`.
2. **Launcher:** registrar la misma `catalogEntry` en `launcher://catalog.servers[]` (id/capability ya reconocidos por `discoverHExperienceServer`).

## Evidencia

| gate | resultado |
| ---- | --------- |
| identidad-raiz H + V | PASS |
| `bun run typecheck` (H) | verde |
| `bun run test:reachability` (H, +mcp-http) | 13 pass |
| smoke fetch → 3 URIs 0.1.0 | `SMOKE_OK` · estado `pending_external_contract` · `completeFingido: false` |
| jest `experienciaHService` (V) | 13 pass · 1 skip sin env · env-gated verde con server vivo |

## Gaps que siguen visibles (no rellenar)

| gap | owner |
| --- | ----- |
| provider E / LORE-HM | E / lengua |
| evidencia canónica HUB | HUB |
| `complete` de producto | owners + RH-19 clean-room |

## Tips git

- Identidad: `git -c user.name="worker-RH-transport" -c user.email="alephscriptorium@gmail.com"`
- Rama de obra: `worker-RH-transport` → merge `main` → push → borrar rama local/remota.
- No tocar checkpoint G `wp/g-prueba-hm-adaptacion@35cbded`.
