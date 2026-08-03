# DOSSIER FUNDACIONAL · h-sdk — mundo H y el juego «Prueba-H-M»

> **VIGILANCIA ALEPH · DEVUELTO CON ADDENDA DE OWNERSHIP.** Antes de crear
> repo, packages o backlog ejecutable, incorporar el veredicto y los gates de
> [`REVISION-ALEPH-LORE-HM.md`](REVISION-ALEPH-LORE-HM.md). Este dossier se
> conserva como visión del orquestador; no prevalece sobre las fronteras de
> lengua, provider, contracts, notaría y playground fijadas en la revisión.

> **Modo ASI** (constitución Aleph): esto no es una respuesta, es un programa.
> Estado: BORRADOR v2 para veredicto del custodio · 2026-08-03
> Canal: `C:\S_META\HSDK\` (staging; h-sdk lo adopta como `plan/VISION.md` al nacer)
> **h-sdk NO es un holón.** La cadena sigue en siete filas (D-L01-01, gate
> `verificar-sellado-l05.mjs`). Es mundo consumidor del ecosistema scriptorium.

---

## §0 · Recap del viaje (lo certificado, con fuente)

1. **El guion H↔M es copia única** en `S_META\HANDOFF-DEMO.md` — cero precedente
   en disco. Su esqueleto es `WPS_QUEUE/DRAFT/PLAN.md §29` (11 pasos
   `barrio-lore-v1`); su disparador, la pregunta del PO en
   `sincronia/HANDOFF-LORE-HM-2026-08-02.md`; su marco «simulacro», el veredicto
   **NO CORRE** del spike WP-HUB-112. Prototipo visual ya publicado (artifact
   «Prueba de H·M — Barrio LORE», guion jugable + cadena SHA-256 + restart→recupera).
2. **Programa madre**: `S_META\WPS_QUEUE\plan.md` (6 fases, cola A `QUEUED`).
   Fronteras: *S registra; 04 incuba; 02 destila; E encarna; Zeus publica
   contratos; el playground verifica.* Campaña LENGUA L01–L05 ejecutada y
   fusionada (accum `wp/lore-hm-accum`); dossier notarial en
   `s-sdk\DEVOPS\METODOLOGIA\holones\junturas\lore-hm-integracion-holonica\`.
3. **Holones**: zeus = solo 01. Fuera: 02 Logos (`@logos/*`, registry, no mundo),
   03 Emmanuel/e-sdk (Future Machine; papel-primero, DA-1…5 abiertas, NO CORRE),
   04 Network-Engine/AOS (**Aleph**; sellado como fuente histórica por L05),
   05–06 cantera OASIS, 07 s-sdk (notaría, activo). El hub no es holón.
4. **Vigilancia**: apagada desde 2026-07-26; ciega por diseño al vocabulario
   holónico; la campaña LORE-HM corrió sin estación y su evidencia quedó dentro
   del WORLD_ROOT (contra `GOBIERNO-LORE-HM.md §3`). Regla 19: doble conductor =
   anomalía. Regla anti-canibalización ya escrita en `FC3-revision-holon-ZV.md`.
5. **Delta FC1**: los kits UI de z-sdk están **sanos y abandonados** —
   `ui-3d-kit`, `view-kit`, `ui-kit`, `app-shell`, `game-engine`,
   `room-client-browser` (ESM puro, tipos parciales), `3d-monitor` y
   `player-3d-ui` arrancables. Rotos: `operator-ui`/`threejs-ui-lib` (U185, sin
   ejecutar). FC3 ni retira ni productiza: campo libre, sin colisión.
6. **Aleph encontrado** (`OASIS…\SCRIPTORIUM-CORE\NETWORK-ENGINE`, MAYÚSCULAS):
   Bun + TS estricto source-first, hexágono core/edges (20 paquetes), mesh
   docker (Mongo RS + GraphDB + GraphQL), constitución + LAYER_0..4 +
   MODES MONKEY/AGI/ASI + ADR. Su dossier **zeus-bridge** ya define la postura:
   consumir `@zeus/*` del registry **como tercero anónimo**; su F1 declara como
   demo «MCP App renderizando el ledger de una ronda».
7. **La constitución de games** (g-sdk): **delta** (ARG three.js; grifos, mar
   vivo, cantera — `packages/delta/spec/{UX,MAR}.md`; derivado evolucionado del
   `3d-monitor`), **pozo** (juego mínimo, «se construye solo importando
   engine»), **solve-coagula** (CARPETA DRAMATURGO), y **ciudad** (rabbit que
   camina entre anchors, anuncia en plaza y despierta barrios `latente`
   ofreciendo un tool; **tres jugadores** — residente / visitante / corriente —
   distinguidos por contrato de mapeo, sin canal nuevo; loop con
   decay / energía / objetivo / presencia / **acta**). Regla D-8.

---

## §1 · Identidad y criterio único

**h-sdk: codebase independiente de NETWORK-ENGINE.** Nace rehecha, no clonada
(la antigua es proto); se registra la genealogía y **se corta toda relación**;
pasa al ecosistema scriptorium. h-sdk usa z-sdk **como alguien ajeno**, con sus
propias formas de hacer las cosas.

**Doble acople** (la regla de la casa nueva):

- **De Aleph hereda las formas, no el código**: Bun, hexágono core/edges,
  MODES, disciplina ADR, Markdown-First, TS estricto source-first
  (`strict`, `noEmit`, `verbatimModuleSyntax`, imports `.ts`).
- **De zeus toma todo lo publicado, nada de dogma en contra**: registry
  `npm.scriptorium.escrivivir.co`, reglas de asimetría del zeus-bridge —
  solo lo publicado · outbound-only · degradación limpia sin `@zeus/*` ·
  **jamás vendorear/submodule** (DB-0).
- Ninguna herencia de la antigua tan estricta como para no aprovechar zeus;
  ningún idioma de zeus tan invasivo como para romper el hexágono.

«Ojalá pudiéramos traerla toda»: la puerta queda abierta por ADR — cualquier
pieza de la antigua puede **re-derivarse bajo demanda** (se cita ancla + commit,
se reescribe aquí); nada entra por inercia. Candidatas ya vistas: interfaz
`PubSubBridge` (connect/disconnect), deck MCP, patrón DocumentStore F2
(volúmenes externos read-only contra manifest), edge-graphdb (almacén RDF para
la vista JSON-LD, fase posterior).

## §2 · Raspa mínima propuesta

```
h-sdk/
├─ INSTRUCTIONS/            constitución H (re-derivada) + MODES/{MONKEY,AGI,ASI}
├─ ADR/
│  ├─ 0001-genealogia-y-corte-network-engine.md
│  └─ 0002-doble-acople-aleph-zeus.md
├─ plan/                    VISION · BACKLOG · DECISIONES (este dossier siembra VISION)
├─ design/
│  ├─ TIPESTATE-UNIFICADO.md          (§5)
│  └─ JUEGO-PRUEBA-HM.md              (§3–§4, la biblia del juego)
└─ packages/
   ├─ core/                 la lengua en TS: primitivas, tipestate, ceremonia, proyecciones
   ├─ edge-zeus/            adaptador registry @zeus/* (rooms, protocol, game-engine, ui-3d-kit)
   ├─ edge-mcp/             M operable por MCP (el asiento vivo de M)
   └─ game-prueba-hm/       el juego: dominio, portal de vistas, gamemap, escena, guion
```

Toolchain: **Bun** (dev + test + tsc como verificador), `package.json`
npm-compatible; `bunfig.toml` con `[install.scopes]` del registry (el token ya
está en `~/.npmrc`). Skills: `@alephscript/skills-scriptorium` al init.

---

## §3 · El modelo del juego «Prueba-H-M»

> La demo no es una pantalla sobre la ceremonia: es la ceremonia **encarnada
> en la Ciudad**. Tres planos verticales, un reparto de monigotes, y las dos
> leyes de la holarquía convertidas en mecánica.

### §3.1 · Los tres planos (el espacio del juego)

```
PLANO META  ─ la Ciudad holónica ──────────────────────────────────────────
│  mapa.json sellado: 7 holones × 6 distritos × 24 barrios.
│  Aquí viven: la Plaza Mayor, la NOTARÍA (institución del holón 07),
│  y la autoridad de H. Las leases NACEN aquí y descienden.
│
PLANO MÁQUINA ─ distrito lore-voz · barrio 20 «document-machine-sdk» ─────
│  La DocumentMachine como barrio habitado: locales, cinta, fuente.
│  Aquí vive M con sus diez monigotes. El barrio arranca `latente`.
│
PLANO FLUJO ─ la corriente ───────────────────────────────────────────────
   El Ónfalo mana piezas; gotas→análisis→líneas→grafo→universos→cortos.
   Mecánica delta: mar vivo, cristales, murk, salvage.
```

La cámara puede subir y bajar; **quién puede subir y bajar es la gramática**
(§3.4). El eje vertical ES la holarquía — no decorado: permiso.

### §3.2 · La DocumentMachine y sus monigotes (dramatis personae)

El barrio 20 se modela como **fábrica habitada**. Cada Unit de la lengua es un
monigote con oficio, local propio, animación por tipestate y el comando del
protocolo DocumentMachine que ofrece al ser despertado (`/feed`, `/diff-corpus`,
`/merge-corpus`, `/design`, `/status`, `/universo`, `/guion` — e-sdk, plugin
lore-sdk). La súper-cadena del dossier Future Machine
(`@Puzzle → @Archivero → @Grafista → @Demiurgo → @Dramaturgo`, slots
pieza→grafo→universo→cortos) es la coreografía del barrio.

| Unit | Monigote / oficio | Local en el barrio | Ofrece (tool al wake) | Rol en la cadena |
| ---- | ----------------- | ------------------ | --------------------- | ---------------- |
| `portal` | el Portero — protocolo de subsunción: la tecnología invisible | el Portal (única puerta) | entrada/`/status` | frontera H↔barrio |
| `loreador` | el Pregonero — lee y proclama | el Atrio | lectura RO | voz del barrio |
| `bartleby` | el Escribano (preferiría no hacerlo) | el Escritorio | `/feed` → 5 secciones: linaje, taxonomía, mecanismos, emergencias, ausencias | slot **pieza** |
| `archivero` | el Archivero — corpus inmutable | el Archivo | `/diff-corpus`, `/merge-corpus` | slot **pieza** |
| `cristalizador` | el Vidriero — diseña artefactos | el Taller de Cristal | `/design` | pieza→artefacto |
| `vector-mock` | el Autómata de Vectores (**mock declarado**, luz violeta) | la Sala de Vectores | embedding sim | pieza→grafo |
| `grafista` | el Cartógrafo — nodos y arcos | la Mesa del Mapa | grafo | slot **grafo** |
| `demiurgo` | el Demiurgo — abre mundos plausibles | las Puertas de Universo (Alpha/Beta) | `/universo` | slot **universo** |
| `dramaturgo` | el Dramaturgo — emite cortos | el Teatro | `/guion`, corto | slot **cortos** |
| `pipeline` | la Cinta — transporta, no decide | las calles interiores | — | conectivo |

**El Ónfalo es la fuente del barrio**: un pozo/manantial en su plaza interior
del que manan las piezas (`fixtures/onfalo/pieces/*.md`, reales y selladas).
La corriente (plano flujo) nace ahí.

**Tipestate → cuerpo** (proyección visual, misma tabla §5):

```
declarada      silueta gris, estática (el barrio latente es un barrio de estatuas)
arrendada      la silueta se enciende (halo: la lease ha descendido)
materializada  cuerpo sólido (GLB: RobotExpressive/Xbot/stick-puppet de view-kit)
lista          idle animado en su local
corriendo      animación de oficio (el Escribano escribe, el Vidriero sopla…)
halted‖orden   se sienta; luces del local a mínimo
halted‖fallo   caído; el local parpadea en rojo — y NADA más cambia (fallo atómico)
‖suspendida    congelado a mitad de gesto
‖recovering    se re-arma pieza a pieza releyendo el acta (salvage)
```

### §3.3 · H y M según la definición de Ciudad (contratos de jugador)

Ciudad distingue **tres jugadores por contrato de mapeo, sin canal nuevo**.
Hipótesis de reparto (a validar contra `g-sdk/packages/ciudad/spec`):

- **H = el Visitante con autoridad.** Reside en el plano meta (es el anfitrión
  de la Ciudad); **desciende** como visitante al barrio. Sus verbos de ciudad:
  `join`, `walk`, `wake` (despierta el barrio ofreciendo un tool — **el tool
  que ofrece ES la lease**), y los de autoridad de la lengua: `grant`, `deny`,
  `choose`. H camina; su monigote es el jugador visible.
- **M = el Residente.** Vive en el barrio 20; no tiene cuerpo único: **habla
  por sus diez monigotes** (M es el maestro de la máquina, no un personaje
  más). Sus verbos: `announce` (en la plaza del barrio: report/propose),
  `request` (sube como anuncio hacia el plano meta), `explain`. Jamás
  `grant`, jamás `walk` fuera del barrio.
- **La Corriente = el tercer jugador.** El flujo del Ónfalo juega solo: sus
  «movimientos» son los pasos de la cadena (gotas que caen, cristales que
  crecen). No decide — pero sin ella no hay partida. (Lectura literal del
  contrato `corriente` de ciudad; si su spec dice otra cosa, se ajusta.)

**Los verbos de Ciudad son los verbos de la lengua con piel de juego:**

| ciudad | lengua LORE-HM | plano |
| ------ | -------------- | ----- |
| `join` | `peer.join` | meta → máquina |
| `walk` | navegación (consulta RO, gratis) | cualquiera descendente |
| `wake` (ofrece tool) | `room.open` + `pod.lease` → `unit.inflate` | meta → máquina |
| `announce` (plaza) | `report` / `propose` / `request` de M | máquina → meta (solo voz) |
| `sleep` | `unit.stop` + `lease.revoke` | cierre |
| `acta` (loop de ciudad) | sello del transcript en la NOTARÍA | máquina → meta (solo evidencia) |

### §3.4 · La operativa meta en los holones superiores

Las **dos leyes de la holarquía** (skill holarquía, holón 07) se compilan a
mecánica de juego:

1. **Ceguera ascendente** — desde el barrio, la ciudad alta se renderiza como
   niebla; los monigotes de M **no tienen pathfinding hacia arriba**; ningún
   verbo de M ejecuta en el plano meta. Lo único de M que sube es su **voz**
   (announce en plaza) y su **evidencia** (el acta al cierre). M no puede
   concebir su techo: lo vive como el fin del mundo — y el juego lo dibuja así.
2. **Acceso descendente** — H lo relee todo: puede bajar a cualquier plano,
   inspeccionar gratis (RO), releer el barrio entero. La autoridad solo viaja
   hacia abajo (la lease desciende como una llave visible con el `wake`); la
   evidencia solo viaja hacia arriba (el acta asciende a la NOTARÍA al cierre).

**La partida meta entre H y M es exactamente esto**: H arriba decidiendo qué
desciende (leases, elecciones Alpha/Beta), M abajo operando y elevando voz y
actas, la NOTARÍA del holón 07 sellando el transcript — el juego dramatiza el
método real del programa (plaza=sincronía, notaría=actas, ceguera=prueba de
ceguera de vigilancia). Nada de esto exige canal nuevo: es el contrato de
mapeo de Ciudad aplicado a la lengua.

### §3.5 · El flujo (mecánica delta) y el guion por planos

Isomorfismo delta→lengua (el mar vivo de `delta/spec/MAR.md` como piel del
ledger): grifo=lease · gota=Activity · mar=evidencia (nada se evapora) ·
isla de cristal=Artifact · murk=pérdida de procedencia · salvage=recovering ·
colapso=fallo atómico visible.

**Guion (el de HANDOFF-DEMO, ahora encarnado):**

1. H nace en el plano meta, camina el mapa holónico hasta lore-voz; el barrio
   20 está `latente`: estatuas grises tras el Portal.
2. `wake` con tool: la llave desciende — room abierta, SIMULACRO declarado por
   el Portero. M despierta como residente (announce en plaza del barrio).
3. «Inspecciona» — H pasea el barrio (RO): diez siluetas, dos exigen lease.
4. M `request` (anuncio que sube); H **concede o deniega desde arriba**.
   Deniega → cero estado parcial: las estatuas ni parpadean. Concede → el
   Escribano y el Vidriero se encienden y toman cuerpo.
5. La Corriente entra: el Ónfalo mana dos piezas; la Cinta las lleva al
   Escritorio; Bartleby `corriendo` (animación de oficio) → 10 secciones.
6. Sala de Vectores (violeta, mock declarado) → **dos líneas cristalizan** en
   el mar del barrio; el Cartógrafo bifurca el grafo en su Mesa.
7. Dos Puertas de Universo se iluminan (Alpha prioriza consejos, Beta partido);
   **H elige** — decisión real en la cadena causal; el Teatro emite el corto.
8. «Traza y cierra»: verificación de cadena en vivo; los monigotes se sientan
   (`sleep`), las leases revocadas ascienden apagadas, y **el acta sube sola
   la ciudad hasta la NOTARÍA** — plano final: el sello.
9. Restart → recupera: el barrio se reconstruye releyendo el acta (salvage,
   `‖recovering` monigote a monigote). Nada se recuerda; todo se relee.

**Final bonito = CA medible**: una pieza real del Ónfalo procesada de punta a
punta (analyze → line.materialize) visible como cristal en el mar, con cadena
de digests verificada, transcript descargable y acta en la NOTARÍA.

---

## §4 · Diseño 3D: «El Descenso» (una escena, tres altitudes)

**Una sola escena three.js cuyo eje vertical es la holarquía.** La cámara es
la gramática: descender es leer (permitido a H), ascender es imposible para M
(niebla). No hay tres pantallas: hay tres altitudes de la misma escena.

```
ALTITUD META    la Ciudad: 24 barrios como node-mesh unidos por calles
                (link-corridor) derivadas de barrios[].grafo.handoffEdges
                del mapa.json sellado; distritos como mesetas de color;
                la NOTARÍA como landmark del holón 07. H camina aquí:
                monigote SK_Alephillo sobre gamemap de game-engine
                (anchors, tick, progreso 0→1, auto-sit).
                       │  wake: la llave-lease DESCIENDE (trajectory)
ALTITUD BARRIO  interior del 20: diez locales en herradura alrededor de
                la plaza del Ónfalo (fuente). Monigotes GLB en sus
                puestos; tipestate = cuerpo (§3.2). El techo del barrio
                es niebla para la vista-M (ceguera ascendente literal:
                fog + clamp de cámara).
                       │  acta: ASCIENDE al cierre hasta la NOTARÍA
ALTITUD FLUJO   el LOG de la Future Machine hecho espacio (§4.1):
                la red semántica de futuros — nodos, arcos y HUECOS —,
                la cremallera bilateral H/M, y los hilos de onfaloTrace
                que se caminan hasta la fuente.
```

### §4.1 · El log de la Future Machine, modelado en three.js

El log está documentado en dos capas y ninguna es «gotas en un mar»:

- **Histórico real** (OASIS DocumentMachineSDK, citado en
  `WPS_QUEUE\investigacion-e-sdk-documentmachine.md §4`): `LORE_INDEX.md` ·
  `CORPUS_PREVIEW.md` · `grafo/{nodos, arcos, huecos, index}.json` (la RED
  SEMÁNTICA — **los huecos son fichero propio**) · `universo/universo-N.md` ·
  `DRAFTS2/LORE_F-*_CORTO-*.md`. Más la estructura del análisis de Bartleby
  (5 secciones) y el corpus inmutable que solo crece por `/merge-corpus`.
- **Simulacro** (playground): `graph/universe/corto.schema.json`,
  `chain.ndjson` **por lado H/ y M/** (`{step, verb, causalDigest,
  wireDigest, side}`), `evidence/report.json`, y el verbo diagnóstico
  `pipeline.gaps → hm:PipelineGapAnalysis`.

Cada elemento del log tiene su forma — el flujo se modela desde aquí, no
desde el ejemplo:

| elemento del log | fuente | forma three.js |
| ---------------- | ------ | -------------- |
| corpus (`CORPUS_PREVIEW`/`LORE_INDEX`) | Archivero | pared-estantería del Archivo: placas instanciadas, una por pieza, cada una con hilo a su `urn:onfalo:*`; **solo crece** |
| análisis · linaje | Bartleby `/feed` | hilos finos de cada afirmación hacia su pieza fuente |
| análisis · taxonomía | | árbol de términos brotando junto al Escritorio |
| análisis · mecanismos | | calibres/contadores sobre la mesa |
| análisis · emergencias `E.XX` | | nodos inestables pulsando (emissive intermitente): tensión sin resolver |
| análisis · ausencias estructurales | | **siluetas en negativo**: wireframe translúcido de lo que el corpus implica y no está |
| red semántica · nodos/arcos | `HmFuturesGraph` del Grafista | node-mesh + link-corridor; cada relación con su estilo: `bifurcates`=corredor bífido · `references`=hilo discontinuo · `derives`=gradiente sólido |
| red semántica · **huecos** | `grafo/huecos.json` · `pipeline.gaps` | **vacíos de primera clase**: placeholders wireframe alrededor de los que el grafo crece; la cámara puede enfocarlos — un hueco es una invitación, no un error |
| universo-N (`HmUniverse`) | Demiurgo | cúpula tras cada Puerta: re-instancia del mismo grafo teñida por universo; `state` como luz de cúpula; `simulacro{mock,seed}` grabado en el dintel; `eventsEmitted` como ticker |
| corto (`HmCortoDeEjecucion`) | Dramaturgo | tira de fotogramas en el Teatro: frames = `events[]` del `interval`; `digest` al pie |
| `onfaloTrace[]` | corto.schema (**obligatorio**: el verificador falla sin él) | **hilos físicos** del corto hasta la fuente del Ónfalo — la trazabilidad se camina; el hilo renderiza un contrato, no un adorno |
| `chain.ndjson` H/ y M/ | `.runs/<runId>/{H,M}/` | **la cremallera**: dos cadenas paralelas (oro H, verdigrís M) engarzadas peldaño a peldaño — las 17 parejas bilaterales; peldaño roto = divergencia visible |
| `evidence/report.json` | evidence pack | el acta-tapiz: la matrix verbo×actor tejida como panel que asciende a la NOTARÍA; `report.md` es render estricto del JSON — el tapiz se genera, no se dibuja |

**El mar muere.** Delta queda solo como referencia de *persistencia visual*
(nada se evapora); los elementos del plano flujo son nativos del log FM.

**Tipestate → clips del GLB** (RobotExpressive trae clips nombrados —
Idle/Walking/Sitting/Death/Wave/Punch…; lo que un GLB no traiga lo cubre el
stick-puppet de view-kit): declarada=sin mixer+material gris ·
arrendada=emissive halo · materializada=Standing · lista=Idle ·
corriendo=clip de oficio por local · halted‖orden=Sitting ·
halted‖fallo=Death **y nada más cambia** (fallo atómico visible) ·
‖suspendida=mixer.timeScale=0 · ‖recovering=fade-in releyendo acta.

**Overlay DOM** (la ceremonia como paneles, el artifact publicado es su spec):
log-panel de view-kit para el diálogo H/M (voces coloreadas, lo nuevo arriba) ·
panel.mjs para evidencia/cadena, unidades y leases (ventanas plegables
persistentes) · hud para turno/paso/SIMULACRO/provider · labels como
nameplates sobre monigotes.

**Portal y servidor**: patrón `3d-monitor` (registry de vistas: ciudad |
barrio | ceremonia | notaría) + patrón `player-3d-ui` (import map,
`/vendor/three` desde node_modules instalados del registry, **sin bundler**),
servido por Bun en h-sdk.

**Transporte**: dos modos declarados, jamás fallback silencioso — `replay`
(chain.ndjson / evidence del HUB) y `conectado` (@zeus/rooms +
room-client-browser + channel-events, outbound-only). **M vivo** sentado en
`@zeus/player-mcp-kit` (room-bridge + confirm-intent) tras un adapter fino.

**Librerías z-sdk y su rol** (decisión PO #3: usarlas ES el experimento):

| paquete | rol en la demo |
| ------- | -------------- |
| `@zeus/game-engine` | gamemap ciudad (nodos/enlaces/anclas, tick) + GLBs monigote |
| `@zeus/ui-3d-kit` | node-mesh (barrios/cristales) · link-corridor (calles/cinta) · anchor-marker · scene-manager (cámara/raíles) · trajectory-manager (gotas/llave/acta) · puppet |
| `@zeus/view-kit` | panels, log-panel, hud, labels, actors-layer, stick-puppet |
| `@zeus/ui-kit` + `@zeus/app-shell` | shell HTML, themes, ssr-view-registry (portal) |
| `@zeus/ciudad` + `@zeus/startpack-ciudad` | dominio del paseo (join/walk/announce/wake/sleep/acta) — ⚠ sin `types`: **G debe soportarlo ya** (decisión PO #4; reporte al owner en H0) |
| `@zeus/rooms` + `@zeus/room-client-browser` + `@zeus/protocol` | modo conectado |
| `@zeus/player-mcp-kit` | el asiento de M |
| `@zeus/linea-kit` | schemas de línea para el final del Ónfalo |
| delta (`spec/{UX,MAR}.md`) | referencia de persistencia visual; los elementos del flujo son nativos del log FM (§4.1) |

**Lo único que h-sdk escribe** (adapters y dominio propio, cada uno pequeño):
adapter `mapa.json→gamemap` (E2) · adapter `units→puppets+clips` (E3) ·
layout del barrio 20 (data) · proyección eventos→panels · compilador
`guion→Activities` (game-domain) · raíles/ceguera de cámara. Todo lo demás
llega del registry — que es exactamente lo que la demo debe probar.

## §5 · Tipestate unificado (propuesta del consumidor)

Dos niveles: **fase** (lengua, 6: `declared→leased→inflated→ready→running→halted`)
× **cualificador operativo**. Proyección playground(8)→lengua(6):
`paused → running‖suspendida` · `stopped → halted‖por-orden` ·
`failed → halted‖por-fallo`. Ampliación: `‖recovering` (restart→recupera,
U235) durante replay verificado. Leyes: round-trip = identidad; toda
transición del playground proyecta a transición legal de la lengua. Con
**mutante que lo apaga entero** (L-H12). La proyección visual §3.2 consume
esta tabla — el juego es un render del tipestate, no un dibujo aparte.
Gobierno: propuesta de h-sdk (consumidor); la lengua sellada no se edita —
se eleva a la notaría de s-sdk como DA del custodio cuando él decida.

## §6 · Experimentos de expresividad (el porqué de todo)

**¿Es z-sdk suficientemente expresivo para usarlo desde fuera?** Cada
experimento es un fichero, no un sistema:

| # | experimento | mide |
| - | ----------- | ----- |
| E1 | `npm view @zeus/*` + `tsc` estricto contra `.d.ts` desde registry | ¿qué paquetes exponen tipos de verdad? (cola B tipó 4; kits UI sin medir) |
| E2 | adaptador `HmFuturesGraph → escena game-engine` | ¿nuestro grafo cabe en su gamemap? |
| E3 | 10 Units → gameobjects/actores GLB, tipestate→animación (§3.2) | ¿nuestras units suben a sus gameobjects? |
| E4 | room del playground ↔ `@zeus/rooms` viva, outbound-only | ¿la ceremonia viaja por su transporte? |
| E5 | `chain.ndjson` → envelope `state\|intent\|track\|ledger` | ¿nuestra evidencia habla su contrato (holón 01)? |
| E6 | verbos ciudad (`wake`/`announce`/`acta`) → verbos lengua (§3.3) | ¿el contrato de mapeo de Ciudad expresa la ceremonia sin canal nuevo? |

## §7 · Backlog semilla (olas)

- **H0 · fundación**: raspa §2 · ADR 0001/0002 · `design/TIPESTATE-UNIFICADO.md`
  · `design/JUEGO-PRUEBA-HM.md` (extraer §3–§4) · E1.
- **H1 · gamemap habitado**: `edge-zeus` mínimo · mapa.json→ciudad · gamemap
  navegable hasta el barrio 20 · **los diez monigotes en sus locales con
  tipestate visual** (E2, E3, E6).
- **H2 · ceremonia jugable**: guion §3.5 por planos · ceguera/descenso como
  cámara y permisos · leases que descienden, denegación atómica, Alpha/Beta ·
  evidencia + acta a la NOTARÍA + restart→recupera (E5).
- **H3 · el final bonito**: la línea del Ónfalo de punta a punta · la Corriente
  como tercer jugador (mecánica delta) · M vivo por `edge-mcp` (E4) · parte
  legible del evidence/report (`parte-kit`).

## §8 · Decisiones del PO (2026-08-03) y lo que queda

**Decididas por el PO en esta fecha:**

1. **Package candidato de la lengua: SÍ** — se publica la lengua incubada como
   candidato en el registry para que H compile por canal limpio (deshace el
   deadlock; en línea con DPO-FC3-03).
2. **La prioridad es LA DEMO** — «CLI vs 3D» era falsa dicotomía; diálogo y
   escena avanzan juntos como facetas de la misma demo.
3. **`@zeus/player-mcp-kit` como asiento de M: SÍ** — criterio general del PO:
   *cuando z-sdk tenga paquete para el trabajo, usarlo ES el experimento*.
   H se convierte en su consumidor real (evidencia para DPO-FC3-09).
4. **Types de `ciudad`/`startpack-ciudad`: G tiene que soportarlo ya** — no es
   dicotomía reporte-o-workaround: se reporta al owner G en H0 y se cuenta con
   los tipos.

**Defaults tomados (reversibles, veto del PO):** `HANDOFF-DEMO.md` se conserva
en su sitio, anclado por hash, marcado supersedido por este dossier · la demo
aspira a «consumidor limpio» (registry, no `file:`) · scope de publicación
propio: ninguno por ahora (root privado) · delta aporta spec/piel, no motor.

**Restantes, del PO cuando toque:** el «ya» del `git init` de `C:\S_LAB\h-sdk` ·
owner/canal del provider E (DPO-FC3-01, futuro) · qué package publica el HUB
para escenario/evidence replay · momento de elevar el tipestate como DA a la
notaría (tras evidencia del experimento).
