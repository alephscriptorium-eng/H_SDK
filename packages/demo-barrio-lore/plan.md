# Plan — Clone NE + Prueba H·M jugable

Método: **ASI · NE primero · conversación completa**.  
Esto es el programa; no se implementa en este archivo.

---

## 1. Encargo (suma)

1. Aleph / NETWORK-ENGINE en **ASI**.
2. Clonar lo robusto de NE en h-sdk **sin rutas OASIS** en runtime.
3. Acople a z-sdk (`@zeus/*`: Ciudad, DocumentMachine, linea-kit, etc.).
4. **Un producto**: backend MCP + frontend Three; el agente **juega** por tools y lee por resources.
5. MCP = **SDK oficial** + `StreamableHTTPServerTransport` (transporte Streamable HTTP; no el HTTP+SSE legado deprecado). Runtime ≠ edge; `discover`; `events$` / `subscriptions/listen`.
6. Lenguaje = **aleph-lang** (Universe / Force / Expansion / Dimension / Boundary). DocumentMachine **opera** esa ontología (líneas → grafo → universos). **No** inventar `hm-lore-lang` paralelo.
7. Demoler el frankenstein app∥game-as-arquitectura; **extraer** ceremonia, evidencia, Ciudad, vista.

---

## 2. Anti-patrones (ya cometidos; no repetir)

| Fallo | Corrección |
| --- | --- |
| App y game como dos mundos | Frontend / backend del **mismo** producto |
| Hexágono H casero en lugar de clone NE | Plataforma NE ancha primero |
| Ampliar `mcp-http` ad hoc | Sustituir por borde NE + SDK |
| Tools de cámara (`descender`, `avanzar`) | Verbos DocumentMachine / Ciudad |
| Tercer lenguaje “hm-lore” | Extender / puentear **aleph-lang** |
| “Mínimo heroico” (sin Graph/GraphQL) | Clonar la plataforma que da edges de gratis |
| Vista = copiar mamotreto `.mjs` o bypass a view-kit | Drenaje por **patito** (`threejs-ui-lib` / operator-ui) |
| Dicotomías / “Feedback PO” / “GO” inventados | Defaults de codebase; medir y arreglar |
| Plan del último turno o capas cosméticas | Reescritura contra la **suma** |

---

## 3. Defaults (cerrados)

| Tema | Default |
| --- | --- |
| Vista | Patito: `@zeus/threejs-ui-lib` / operator-ui |
| `ui-3d-kit` | Alinear patito a **^0.1.4** (medir roturas) |
| Lenguaje | aleph-lang; sin LANGUAGE INCEPTION |
| Plataforma | Clone **ancho** (MCP SDK, edges, graphdb, graphql, pubsub si el grafo lo pide) |
| Naming | `@h-sdk/…` layout tipo NE; evitar choque con `@h-sdk/core` RH → p.ej. `packages/ne/*` / `@h-sdk/network-core` |
| Procesos | Edge MCP (Bun/NE) + host Angular (como operator-ui hoy) |
| compose-lang | Fuera del primer vertical; solo si el grafo del clone lo arrastra |
| V / Accept | Cliente V ya habla Streamable HTTP (`application/json` + `text/event-stream` = negociación del transporte moderno, no HTTP+SSE legado). Preferir JSON (`enableJsonResponse`) donde baste |
| FSM “nueva” de H·M | **No inventar**. Ver §5 |

---

## 4. Qué hay hoy (hechos)

| Pieza | Realidad | Destino |
| --- | --- | --- |
| `app-prueba-hm` | Hexágono + `mcp-http` casero; resources OK; tools `[]` | Demoler como arquitectura; conservar lecciones fail-closed / env / catalog |
| `@h-sdk/core` máquina RH | Pipeline lineal reachability | **No** es el lenguaje; aparcar o absorber después |
| `edge-zeus` | Puertos Ciudad / delta / M / línea | Extraer como adapters → Forces / intents |
| `game-prueba-hm` | Guion `B.*` + `pareja()` + Ciudad + Three ESM | Extraer contrato / evidencia / Ciudad; vista vía patito; `B.*` = referencia de beats, no FSM del lenguaje |
| MCP actual | JSON-RPC a mano | Sustituir por `edge-mcp` + SDK Streamable HTTP |

Falta en h-sdk: plataforma NE, aleph-lang operativo, producto único con tools de dominio y vista en patito.

---

## 5. Estado / máquinas (honestidad)

No hay una máquina H·M “ya diseñada” como artefacto único. Hay tres cosas distintas:

1. **`@h-sdk/core`** — FSM lineal de experiencia RH (reachability). No es aleph ni la ceremonia.
2. **Game `B.*`** — grafo procedural de beats + bolsas `S`/`Z` + `pareja()`. **No XState**.
3. **aleph-lang (NE)** — máquina del lenguaje (XState / DSL `AlephUniverse`) a clonar; hoy la ceremonia es más rica que el package fino → el trabajo es **puente/extensión**, no fingir que ya es barrio-lore.

Trabajo: clonar aleph-lang → mapear verbos DocumentMachine/Ciudad a Force/Universe/Expansion → usar `B.*` solo como especificación de corrida / evidencia. **Prohibido** inventar una 4ª FSM por encima.

---

## 6. Arquitectura objetivo

```text
Capa 0   TypeScript / Bun
Capa 1   Plataforma (clone NE → @h-sdk/…, cero paths OASIS)
         network-core · network-engine · mcp · mcp-runtime
         edge-rest · edge-mcp (SDK Streamable HTTP)
         graphdb · edge-graphdb · graphql · edge-graphql · …
Capa 2   aleph-lang (clone + puente operativo H·M)
Capa 3   Corrida barrio-lore = operación Aleph + Ciudad + evidencia
Capa 4   Contenido: Ónfalo, líneas, grafo, acta
Vista    Façades Three en threejs-ui-lib (patito), suscritas a events$/estado
MCP      Una app: resources = lectura; tools = mutaciones de dominio
```

Reglas: runtime ≠ edge; tool = efecto (si no hay efecto, no es tool); apps no hacen `dispatch` crudo (pasan por DSL / fachada); sin paths OASIS; `@zeus/*` por registry.

### Mapa DocumentMachine ↔ aleph-lang

| Operación (maqueta / Zeus) | Ontología Aleph |
| --- | --- |
| `source.ingest` / `document.analyze` | Force |
| `line.materialize` | Capacidad / estructura dimensional |
| `graph.bifurcate` | Grafo asimilado |
| `universe.instantiate` | Universe |
| Elegir rama / más ingest | `absorbForce` / presión a Boundary |
| Más capacidad | `REACH_BOUNDARY` → Expansion |
| `join` / `walk` / `announce` / `wake` | Intents Ciudad (anfitrión; no sustituyen el lenguaje) |
| Acta / cadenas H∥M | Evidencia / read-model (resources + ledger) |

Documento corto de mapeo (ADR o `definition/`) antes del puente gordo — dossier, no código ciego.

### Vista (patito)

| Capa | Origen game | Destino |
| --- | --- | --- |
| Contrato | `CEREMONY_*`, verbos, `pareja`/digests | Pack TS puro (sin Three/Angular) |
| Ciudad | mapa, anclas, intents | Pack TS + `@zeus/ciudad` |
| Proyección | ciudad/barrio/flujo | Façades en / junto a `threejs-ui-lib` (`Kit*Facade` → `ui-3d-kit`) |
| Host | — | operator-ui o shell Angular mínimo |

No servir el mamotreto ESM como producto. Cámara/efectos = proyección; cero tools de cámara.

---

## 7. Extraer vs demoler

**Extraer antes de borrar**

- Constantes / matriz 17 parejas / digests / shutdown verbs  
- Grant/deny leases como política de corrida  
- Puente Ciudad + intents  
- Ónfalo, acta, verificar  
- Recetas de escena (como spec para façades)  
- Cableado `.env` / `mcp.json` (reapuntar al edge nuevo)

**Demoler tras sustituir**

- `mcp-http.ts` como diseño  
- Relato “app sustituye game” / composition RH como “el producto”  
- `B.*` como orquestador definitivo  
- Tools inventadas de vista

---

## 8. Trabajo lineal

1. **Inventario + ADR** — paquetes NE a clonar (grafo real `edge-mcp` → …); ADR genealogía paths; ADR mapa verbo ↔ Aleph / Ciudad.
2. **Clone plataforma (Capa 1)** — rename/imports; Bun; smoke health + discover + Streamable HTTP.
3. **Clone aleph-lang (Capa 2)** — DSL + máquina; tests mínimos.
4. **Puente H·M** — barrio-lore → eventos Aleph + intents Ciudad; evidencia H∥M colgada del orquestador; pendientes honestos (no fingir `complete`).
5. **Producto MCP** — app sobre `edge-rest` + `mountMcpRoute`; resources lectura; tools mutación; retirar ad hoc; Cursor → nuevo `/mcp`.
6. **Vista patito** — contrato/ciudad TS; façades; host Angular; suscripción a estado/`events$`.
7. **Demolición + DoD** — rutas muertas fuera; demo agente juega + browser refleja; cero OASIS paths.

Si algo rompe (kit 0.1.4, transport, puente), se mide y se arregla en el paso; no se convierte en menú existencial.

---

## 9. Definition of Done

1. Plataforma compilable en h-sdk (Bun); MCP por SDK Streamable HTTP.  
2. `server/discover` + subscriptions/`events$` (o shim documentado como en NE).  
3. aleph-lang ejecutable; Prueba H·M = corrida sobre él + Ciudad/DocumentMachine.  
4. Agente Cursor juega por tools; lee por resources (vocabulario de dominio).  
5. Vista 3D en patito acoplada al mismo producto; no segundo MCP.  
6. Sin rutas OASIS; `@zeus/*` por registry.

---

## 10. Primera acción

Inventario del grafo de deps NE + ADRs de §8.1. Sin eso, no hay copy masivo de paquetes.
