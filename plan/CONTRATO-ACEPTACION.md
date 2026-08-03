# CONTRATO DE ACEPTACIÓN · H ↔ G ↔ V ↔ owners

Documento de gobierno (RH-05 · `plan.md` step 5). **No copia shapes** entre
repos. Ancla de estados: `plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md`
(2026-08-03T14:11:41.822Z, registry `https://npm.scriptorium.escrivivir.co`).

> **No declara producto.** Ausencias y superficies sin types tipados quedan
> visibles; no se tapan con stubs en H.

---

## 1 · Superficies (owner → artefacto → consumidor → estado)

Estados permitidos (mapeo RH-04):

| estado contrato | origen RH-04 |
| --- | --- |
| `VERDE` | veredicto VERDE (registry + versión exacta + export_map + types en disco + runtime OK) |
| `pending_external_contract` | ROJO / pending_external_contract (E404 o sin paquete medible) |
| `publicado-sin-types` | ROJO / publicado-sin-types (paquete existe, runtime OK, sin `.d.ts` declarados/en disco) |

| superficie | owner | artefacto publicado esperado | consumidor | estado (RH-04) |
| --- | --- | --- | --- | --- |
| Ciudad (dominio / intents / events) | G/Z (ciudad) | `@zeus/ciudad` tipado en registry | H (edge Ciudad); V vía proyección H | **VERDE** (`@zeus/ciudad@0.1.1`) |
| Authority composition (kit) | Z (authority) | `@zeus/authority-kit` tipado | G (`arg-runtime`); H no reimplementa | **VERDE** (`@zeus/authority-kit@0.4.2`) |
| Rooms / transporte | Z (rooms) | `@zeus/rooms` tipado | H / G / M según wire publicado | **VERDE** (`@zeus/rooms@0.1.2`) |
| Asiento M (player MCP) | Z (player-mcp) | `@zeus/player-mcp-kit` tipado | H (factory M); G (`arg-player-mcp`) | **VERDE** (`@zeus/player-mcp-kit@0.1.4`) |
| Delta domain (escena, estado, intents, feeds, snapshots) | G (delta) | `@zeus/arg-domain` **público tipado** | H (sesión delta); V (tipos visuales vía view-kit) | **pending_external_contract** |
| Delta runtime (wire, tick, snapshot, shutdown) | G (delta) | `@zeus/arg-runtime` **público tipado** | H (compone escena/feed; no copia launcher) | **pending_external_contract** |
| Delta view (grifos, ríos, mar, gotas, cantera) | G (delta) | `@zeus/arg-view-kit` browser-safe tipado | **V** (render escena); H no embebe UI | **pending_external_contract** |
| Delta player MCP factory | G (delta) | `@zeus/arg-player-mcp` tipado sobre player-mcp-kit | H (asiento M configurado) | **pending_external_contract** |
| Delta feeds / DocumentMachine surface | G (delta) | `@zeus/arg-feeds` tipado si aplica publicación | H (adapter; no sibling discovery) | **pending_external_contract** |
| Mockdatas Ciudad / volúmenes Lore | G (mockdatas) | `@zeus/mockdatas-ciudad` pinneado | H / fixtures de aceptación | **pending_external_contract** |
| Artefacto Ónfalo (piezas, manifest, hashes) | H/G (artefacto; owner de publicación `<pendiente>` hasta pin) | paquete/artefacto read-only pinneado (candidatos medidos en RH-04) | H (selección pieza); V (identidad/hash) | **pending_external_contract** |
| Candidato LORE-HM (lengua) | S/lengua (externo) | paquete tipado del owner (candidato `lore-hm-candidate@0.0.x` u homólogo PO) | H (análisis bajo lengua); no edita lengua | **pending_external_contract** |
| Provider E (análisis) | E (externo) | API/paquete tipado del owner | H (puerto análisis); V muestra salida vía proyección H | **pending_external_contract** |
| Línea / materialización | Z (línea) | `@zeus/linea-kit` **con types** (o gap elevado al owner) | H delega; no implementa `line.materialize` | **publicado-sin-types** (`@zeus/linea-kit@0.3.0`) |
| Ceremonia / evidencia canónica HUB | HUB (externo) | kit tipado canónico (candidatos RH-04 E404) | H verifica; V muestra veredicto | **pending_external_contract** |
| Acta kit (candidato parcial; no sustituye evidencia canónica) | Z/HUB | `@zeus/acta-kit` tipado si el owner lo eleva a contrato | H solo si el contrato canónico lo apunta | **publicado-sin-types** (`@zeus/acta-kit@0.1.1`) |
| Proyección experiencia H (estado / escena / evidencia) | **H** | resources MCP versionados **o** JSON Schema servido como resource (superficie propia H) | **V** (único UI) | `<pendiente>` publicación H (post RH-14; no medido en RH-04) |

Conteo anclado a RH-04 (matriz §Resumen): **4 VERDE · 12 ROJO** (10
`pending_external_contract` + 2 `publicado-sin-types`). Ninguna superficie
ROJA aparece aquí como OK/VERDE.

---

## 2 · Reglas de publicación y consumo (sin copiar shapes)

1. **G publica tipos delta.** Las superficies `@zeus/arg-*` (domain, runtime,
   view-kit, player-mcp, feeds si aplica) nacen en G como paquetes **públicos
   tipados** en el registry. H y V las consumen por versión pinneada; no por
   checkout hermano ni `file:`/`link:`/`workspace:` externo.
2. **Owners publican sus contratos.** Ciudad, lengua (LORE-HM), provider E y
   evidencia/ceremonia HUB son de sus owners. H **no** define schemas
   paralelos (`EntradaCadena`, `PuertoActa`, digests, notaría, ledger
   sustituto) para tapar la ausencia.
3. **H solo publica proyección propia.** Para V, H expone resources MCP
   versionados de estado/escena/evidencia **o** sirve JSON Schema propio como
   resource. Eso es contrato H→V, no reexport de shapes `@zeus/*`.
4. **V consume proyección H + tipos visuales delta.** La escena se renderiza
   con el view-kit tipado de G cuando esté VERDE; el estado de experiencia
   (pending/connected/error/complete) viene de resources H. V no importa H
   por sibling.
5. **NUNCA copiar shapes entre repos.** Prohibido pegar interfaces/types/JSON
   Schema de `@zeus/*` (o de G/V/HUB) dentro de H «como contrato». El contrato
   es el artefacto **publicado** (tarball tipado / resource versionado). Citar
   nombre de paquete + versión + path de export; no volcar el shape.

---

## 3 · Ausencia, visibilidad en V y cero contingencia en H

**Ausencia = `pending_external_contract`.** Si el owner no publicó, o el
paquete está en `publicado-sin-types`, o el sensor RH-04 no da VERDE:

- El estado permanece **`pending_external_contract`** (o
  `publicado-sin-types` hasta que el owner tipifique).
- **V lo hace visible** en la UI de experiencia (distinto de `connected` /
  `complete`). No se muestra éxito con resources stale ni se inventan
  actores/escenas.
- **Bloquea el gate final** de declaración de demo/producto (`plan.md`
  verification §6; REPLAN §8 regla de cinco `sí`). Un VERDE de Ciudad no
  abre el vertical completo.

### H no implementa contingencia local

H **no** implementa stubs, shims, `.d.ts` ambientales, ledgers locales,
sibling discovery, ni modos «demo replay» que simulen un contrato ausente.
Si falta el artefacto tipado del owner, el flujo **se detiene** y el pending
queda observable (proyección H → V). Implementar el producto delta, la
lengua, el provider, la notaría o la evidencia canónica dentro de H para
«seguir» viola este contrato y el alcance de `plan.md` (Decisions + Scope
boundaries).

---

## 4 · Segundo consumidor = sensor (eje IV)

El contrato no se cierra porque H «compile contra un shape». El **segundo
consumidor independiente** es el sensor de install limpio de RH-04:

```bash
node scripts/rh-04-matriz-contratos.mjs --md > plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md
node scripts/rh-04-matriz-contratos.mjs --json
node scripts/rh-04-matriz-contratos.mjs --mutant
```

Método (literal RH-04): `npm view` contra registry scriptorium → temp dir +
deps pinneadas → `npm install --ignore-scripts --no-package-lock` sin
siblings/`file:`/`link:`/`workspace:` → leer types del manifest instalado +
presencia `.d.ts` en disco → import dinámico → grep contaminación
`S_LAB|file:|link:` en H.

**Criterio VERDE del sensor:** paquete en registry + versión exacta +
export_map + types declarados + **al menos un path de types en disco** +
runtime OK + pollution 0. `hasTypesInExports=true` sin `.d.ts` →
**ROJO / sin d.ts** (no VERDE).

Hasta que una superficie pase ese sensor, el estado de este contrato para
esa fila sigue siendo `pending_external_contract` o `publicado-sin-types`.
V y el gate final tratan esos estados como bloqueo, no como OK.

---

## 5 · Trazas

| fuente | rol |
| --- | --- |
| `plan.md` step 5 | mandato del contrato entre repos |
| `plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md` | estados medidos |
| `scripts/rh-04-matriz-contratos.mjs` | sensor re-ejecutable (eje IV) |
| `C:/S_META/HSDK/REPLAN-PRUEBA-HM-REACHABILITY.md` §8 | regla producto (cinco flags); no sustituye este contrato |
| `plan/DECISIONES.md` ④⑥ | types Ciudad por owner; no declaración de producto |
| `plan/VISION.md` | visión; no certificación de contratos publicados |
