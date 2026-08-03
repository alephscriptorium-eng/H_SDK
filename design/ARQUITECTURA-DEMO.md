# ARQUITECTURA · demo «Prueba-H-M» (~~El Descenso~~) — brief para workers

> **RH-03 / RECAP:** «El Descenso» está muerto como marco de demo. Este brief
> describe el **boceto** `.mjs`, no un producto alcanzable. No declara
> product-reachable ni «cero violaciones». Ver REPLAN §8 y `RECAP-SPEC-DEMO.md`.

**Objetivo**: app three.js jugable, elegante, servida sin bundler. Prioridad
del PO: resultados y elegancia; validaciones relajadas (node --check y humo).

## Reparto de ficheros (un dueño por directorio — NO tocar los ajenos)

```
packages/game-prueba-hm/
├─ server.mjs                  W-SERVER
├─ public/index.html           W-SERVER (shell; el integrador puede retocar)
├─ public/css/demo.css         W-UI
├─ public/js/ciudad/ciudad.mjs     W-CIUDAD
├─ public/js/barrio/barrio.mjs     W-BARRIO
├─ public/js/ceremonia/domain.mjs  W-DOMAIN
├─ public/js/ceremonia/paneles.mjs W-UI
├─ public/js/flujo/flujo.mjs       W-FLUJO
├─ public/js/main.mjs              INTEGRADOR
└─ assets/mapa/mapa.json           (ya existe; solo lectura)
```

## Servidor e import map (patrón player-3d-ui, sin bundler)

`server.mjs` (node/express NO — usar `node:http` puro o Bun.serve; cero deps
nuevas): sirve `public/` estático y monta:

| URL | disco |
| --- | ----- |
| `/vendor/three/` | `node_modules/three/build/` y `node_modules/three/examples/jsm/` |
| `/kit/` | `node_modules/@zeus/ui-3d-kit/src/` |
| `/view-kit/` | `node_modules/@zeus/view-kit/src/` |
| `/game-engine/` | `node_modules/@zeus/game-engine/src/` |
| `/models/` | `node_modules/@zeus/game-engine/assets/models/` |
| `/mapa.json` | `assets/mapa/mapa.json` |

Import map en index.html: `three` → `/vendor/three/three.module.js`,
`three/addons/` → `/vendor/three/examples/jsm/` (ojo: mapear el prefijo real
que exista en el paquete instalado — verificar rutas en node_modules antes de
escribirlas). Puerto: env `PUERTO` o 4180.

## Contratos entre módulos (ES modules, sin clases si no hacen falta)

```js
// ciudad.mjs
export async function createCiudad({ scene, mapa, THREE })
// → { group, barrioAnchor(barrioId): Vector3, focusCity(), dispose() }
//   Dibuja: 24 barrios como node-mesh (color por distrito), calles desde
//   barrios[].grafo.handoffEdges (link-corridor o líneas), NOTARÍA como
//   landmark elevado en la zona del holón 07, niebla de altura.

// barrio.mjs
export async function createBarrio({ scene, THREE, origin })
// → { group, setUnitState(unitId, estado, causa?), unitAnchor(unitId): Vector3,
//     wake(), sleep(), dispose() }
//   10 locales en herradura + fuente Ónfalo al centro. Monigotes: GLB
//   RobotExpressive (clonado) o fallback caja articulada. Tipestate→cuerpo:
//   declarada=gris estático · arrendada=halo emissive · lista=Idle ·
//   corriendo=clip de oficio (Walking/Punch/Wave) · halted‖orden=Sitting ·
//   halted‖fallo=Death y NADA más cambia · recovering=fade-in.
//   Unidades: portal, loreador, bartleby, archivero, cristalizador,
//   vector-mock (luz violeta), grafista, demiurgo, dramaturgo, pipeline.

// ceremonia/domain.mjs  (SIN three; lógica pura, portable)
export function createCeremonia({ onH, onM, onActivity, onState })
// → { options(): [{n, label}], say(texto): void, pick(n): void,
//     transcriptNdjson(): string, restartRecover(): Promise<void>, state }
//   Implementa el guion determinista completo (beats del artifact):
//   abre barrio → inspección → solicitud leases → grant/deny (deny=atómico)
//   → despliegue+análisis Onfalo → líneas/grafo → Alpha/Beta → corto →
//   traza y cierra → acta → restart→recupera (releer cadena, verificar).
//   Cadena de digests SHA-256 real (crypto.subtle) con prev enlazado.
//   Cada Activity: { seq, verb, mode:'real'|'mock', note, fx, prev, digest }.
//   fx aplica: units{id:estado}, leases{id:estado}, step(1..11), universe.

// ceremonia/paneles.mjs  (DOM overlay, estética del artifact)
export function createPaneles({ mount })
// → { logH(t), logM(t), logSys(t), logActivity(a), setOptions(opts, onPick),
//     setStep(n), setTurn(n), setUnits(map), setLeases(map), badge(id, on) }
//   Estética: terminal de scriptorium — sepia #131008, tinta #EAE0C8,
//   oro H #E7B14C, verdigrís M #85BAA9, mock violeta #AC97CE, ok #8FBF7F,
//   fallo #DB7A5D. Mono (Cascadia/Consolas), cajas TUI, chips real/mock.
//   Paneles: transcript+opciones (izq), pasos 1-11 + unidades + leases +
//   evidencia con digests (raíl der). Botón ⬇ transcript.ndjson.

// flujo/flujo.mjs
export function createFlujo({ scene, THREE, barrio })
// → { gota(desde, hasta): Promise, cristalLinea(pos): Mesh,
//     llaveDesciende(hasta): Promise, actaAsciende(desde): Promise,
//     cremallera(step, side), dispose() }
//   Partículas/trayectorias: gotas Ónfalo→Escritorio, cristal de línea
//   creciendo en el canal, la llave-lease bajando del cielo, el acta
//   subiendo a la NOTARÍA, cremallera bilateral (oro/verdigrís) por paso.

// main.mjs (INTEGRADOR)
//   Escena única: cámara con raíles (focusCity → descenso a barrio 20 →
//   vista ceremonia). Une: guion domain → paneles + barrio.setUnitState +
//   flujo (grant→llaveDesciende+wake; analyze→gota; line.materialize→
//   cristal; cierre→actaAsciende; cada activity→cremallera).
//   Arranque: ciudad vista aérea, H camina/vuela (automático elegante o
//   click) al barrio 20 `document-machine-sdk` (distrito lore-voz) →
//   al llegar, arranca la ceremonia con su primera opción.
```

## Reglas

1. ES modules puros para navegador; imports de terceros SOLO vía import map
   (`three`, `three/addons/…`). Los kits @zeus se sirven pero su uso es
   opcional si complica: elegancia > pureza (decisión PO: resultados).
2. Cero build. Cero deps npm nuevas. `node --check` debe pasar en cada .mjs.
3. Estética unificada (paleta de arriba); `prefers-reduced-motion` respetado.
4. Español en todo el texto visible. Banda SIMULACRO + chips real/mock:
   el mock honesto es parte de la elegancia, no se esconde.
5. El guion y las voces: exactamente los del prototipo artifact (M nunca
   ordena ni concede; H decide; denegar deja cero estado parcial).
