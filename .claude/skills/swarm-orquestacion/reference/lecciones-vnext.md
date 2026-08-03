# Lecciones vNext (método)

Lecciones de operación iniciadas en el corte **0.7.0**. PORT al
skill — no reescritura tribal. Cruzan `swarm-orquestacion` +
`vigilancia` + checkout declarado del brief.

## 1 · Sucesión de vigía

La estación del vigía es **viva** (proceso/estación del carril), no un
subagente del orquestador. Gate `Rn-<carril>`: **sin PASS no hay 🔶**.
El vigía re-verifica CA de facto post-merge (C8 canal real). No se
sustituye por un chat auxiliar «de vigilancia».

Ver: skill `vigilancia` · `reference/ESTACION.md` · convivencia §8.

## 2 · Checkout declarado

Si el WP escribe fuera del `MUNDO_RAIZ` del índice, el brief nombra el
**path FS exacto** del checkout de obra. Casos fundantes:

| caso | checkout de obra |
| ---- | ---------------- |
| IB-01 | fuentes / cuadernos (lectura) declarados en mapa de raíz |
| IB-21 | librería (skill nuevo) en checkout hermano declarado |
| N0-02 / #15 | librería en checkout declarado (piel fanzine) |
| LIB-070 | patrón taller: clone materializado bajo taller `S_LAB` (path declarado en brief + mapa S-LAB + RAIZ) |

Atlas (gitlinks) = SOLO LECTURA; obra = checkout declarado.

## 3 · Worktree por rol

Un WP = una rama `wp/*` = (si hay paralelo) un worktree. Un worktree
por rol (worker / reporte / backstage). No mezclar roles en el mismo
worktree. Aplica a **todo** repo tocado, incluidos hermanos
(`reglas-metodo` · aislamiento).

## 4 · Raíz por constelación

| raíz | rol |
| ---- | --- |
| Atlas del carril (p. ej. `C:\S`) | mapa · estación · fuentes · gitlinks |
| Taller (p. ej. `C:\S_LAB`) | checkouts de obra por mundo / librería |

Nada nuevo sin declaración en el mapa canónico de esa raíz. Copia-release
FS regenerada desde el canónico en git.

## 5 · Identidad antes de efectos

`WORLD_ROOT` es candidata, no prueba. Todo punto de entrada reutiliza el
detector canónico y el LOCK sin efectos de
`../../vigilancia/reference/ESTACION.md`; no duplica implementación ni
calibración. Cada despacho aporta explícitamente `WORLD_ROOT`,
`CANONICAL_WORLD_ROOT`, `READ_ONLY_ROOTS` y `DOWNSTREAM_PATTERNS`; faltar una
entrada es LOCK. El orden es PASS → mkdir/escritura/watcher/git mutable/plan/
rama/worktree. Más precisamente: `DETECTOR → PASS|LOCK → EFECTOS`.
`LOCK identidad-raiz` es fail-closed y garantiza cero efectos: no `mkdir`,
escritura, watcher, git mutable, plan, rama, worktree, boot, handoff ni
`OUT_DIR`. El custodio aporta otra raíz; orquestador y worker no crean ni
eligen clones.

El handoff a estación viva conserva ese orden antes de invocar su boot, script
o fase 1: `../../estacion-viva/reference/BOOT.md`. Como esa fase puede crear
`OUT_DIR`, no se construye ni entrega el handoff sin PASS previo.

## 6 · Revisión selectiva y gate final

La selección `normal`/`independiente`, los campos del brief y el protocolo
read-only viven en `revision-adversarial.md`. El flujo completo es:

```text
preflight → preparación → worker → contrarrevisión si corresponde →
revisión ordinaria/aceptación → merge → gate post-merge
```

PASS adversarial no acepta. El gate post-merge no reemplaza la
contrarrevisión. Cada barrera conserva su evidencia.

## 7 · Dependencias, semver y probes

`politica-dependencias-semver.md` es la fuente única para dependencias runtime
directas, `exact`, `caret-semver`, `major-band`, warning `0.x`, allow/deny y
probes. El gate local es determinista y sin red; C8 online verifica canal,
instalación limpia e integración después y se reporta aparte.

Brief y reporte registran riesgo, contraevidencia, dependencias, instalación y
si cada evidencia fue automatizada o manual. Un camino verde sin inválidos ni
falsos negativos no basta.

## 8 · Idle y salida dual bidireccional

El vigía recoge residuos en idle y los eleva sin editar BACKLOG. El
orquestador contrasta, pide GO y solo entonces planifica. La entrada y la
respuesta usan por referencia
`../../vigilancia/reference/ADDENDA-DOS-CARAS.md`: vista PO/SCRUM primero,
handoff técnico después. El orquestador opera el bloque técnico y rechaza con
el gate canónico cualquier salida incompleta, invertida, divergente o no
copiable; no copia plantilla ni parser.

## 9 · Gate forward por fuente local

Un gate forward post-release pertenece al plan del mundo. El método solo lo
enlaza: el orquestador espera el trigger publish + C8 declarado por esa fuente,
entrega entonces su handoff y conserva la autoridad externa. No adelanta el
aviso, no concede GO downstream y no edita ni opera su backlog.

## 10 · Sucesión v2 «gorro» (relevo de estación viva)

Extiende §1. Cuando la estación viva de un carril (vigía u otro rol vivo)
**releva** a otro agente/proceso, el relevo se rige por «gorro»: un **rol
temporal** que se pone y se quita, con **origen declarado**. El relevo no
hereda contexto tribal ni memoria de chat — solo lo que quede escrito en la
fuente de verdad del mundo (bitácora / plan trazado, regla 15).

Piezas obligatorias del relevo:

- **Handoff volátil.** El saliente entrega un handoff **efímero**: sirve para
  el arranque del entrante, no es fuente de verdad. Tras el relevo, el handoff
  **no** se cita como evidencia; la verdad sigue siendo la bitácora / el plan.
- **Ronda breve Q&A.** Antes de soltar el gorro, el saliente responde una
  ronda corta de preguntas del entrante (estado real, gates pendientes, qué es
  residuo y qué es señal). Sin ronda no hay relevo limpio.
- **Herencia de anomalías COMO anomalía.** Toda anomalía abierta pasa al
  entrante **marcada como anomalía**, nunca como estado normal. Heredar un
  huérfano / lock / gate colgado sin marca lo normaliza y lo entierra.
- **Rol temporal con origen declarado.** El gorro declara **quién lo cede y
  por qué** (origen del relevo). Emular otro rol/carril sin origen declarado
  es doble-conductor: exige claim previo de carril
  (`convivencia-multi-orquestador.md` §10).
- **Anclas activas literales frente a citas históricas inertes.** El handoff
  distingue dos clases de referencia y las marca:
  - **ancla activa** — comando / ruta / gate **literal y reproducible** que el
    entrante debe poder ejecutar tal cual (fuera de todo bloque de cita);
  - **cita histórica inerte** — evidencia del pasado que **no** se reproduce;
    se marca con la etiqueta explícita `[cita inerte]` (o bloque
    `> cita inerte — no reproducir`). Sin la marca, una cita histórica se
    confunde con ancla activa y el entrante la re-ejecuta contra un canal ya
    movido.

La marca `cita inerte` es **contractual**: su ausencia sobre material
histórico es defecto de handoff. Aplicación en la estación:
`../../vigilancia/reference/ESTACION.md` §Sucesión de estación.

## Probe integrado

Este probe ejecuta las fuentes canónicas en vez de recrearlas. Cubre PASS/LOCK
sin efectos, salida dual inválida, selección normal/independiente, semver y
separación pre/post-merge. Para el Eje IV ejercita dos consumidores
independientes de esta integración: el rol orquestador y el cliente
worker/ciclo. Mutantes eliminan salida dual, estación, calibración y orden
PASS→boot; otros eliminan LOCK o adelantan efectos al bloqueo. Los once deben
quedar rechazados. Un mutante adicional recorta boot/handoff solo de la
cláusula de cero efectos; el probe valida esa cláusula aislada, no menciones
globales. Tres mutantes temporales sustituyen «antes» por «después» en cada
consumidor y también deben quedar rechazados.

```bash
awk '/^```js integracion-metodo-probe$/{on=1;next} /^```$/{if(on) exit} on' \
  skills/swarm-orquestacion/reference/lecciones-vnext.md |
  node --input-type=module
```

Runtime: Node 22 y built-ins `node:fs`/`node:child_process`; dependencias npm
nuevas: cero.

```js integracion-metodo-probe
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const read = (file) => fs.readFileSync(file, "utf8");
const run = (label, args, options = {}) => {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${label}: FAIL\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }
  console.log(`${label}: PASS`);
  return result.stdout;
};
const expectRejection = (label, check) => {
  try {
    check();
  } catch {
    console.log(`mutante ${label}: RECHAZADO`);
    return;
  }
  throw new Error(`mutante ${label}: ACEPTADO`);
};
const requiredCalibration = [
  "WORLD_ROOT",
  "CANONICAL_WORLD_ROOT",
  "READ_ONLY_ROOTS",
  "DOWNSTREAM_PATTERNS",
];
const failClosedOrder = "DETECTOR → PASS|LOCK → EFECTOS";
const requiredZeroEffects = [
  "mkdir",
  "escritura",
  "watcher",
  "git mutable",
  "plan",
  "rama",
  "worktree",
  "boot",
  "handoff",
  "OUT_DIR",
];
const temporalBefore = {
  orquestador:
    "antes de cualquier `mkdir`, escritura, watcher, git mutable, edición de plan, rama o worktree, ejecutar el detector canónico",
  worker:
    "antes de cualquier `mkdir`, escritura, watcher o git mutable, ejecutá el preflight canónico de identidad",
  ciclo:
    "ejecutar, antes de cualquier efecto, el preflight canónico de identidad",
};
const extractFailClosedClause = (text, label) => {
  const matches = [
    ...text.matchAll(
      /LOCK identidad-raiz`?[\s\S]{0,240}?cero efectos:\s*([\s\S]{0,300}?)`OUT_DIR`/g,
    ),
  ];
  if (matches.length !== 1) {
    throw new Error(`${label}: cláusula fail-closed única no encontrada`);
  }
  return `${matches[0][1]}OUT_DIR`.replace(/\s+/g, " ");
};
const validateIdentityBeforeStation = (text, label, requireBootReference) => {
  for (const field of requiredCalibration) {
    if (!text.includes(field)) throw new Error(`${label}: falta ${field}`);
  }
  const detector = text.indexOf("verificar-identidad-raiz.mjs");
  const pass = text.indexOf("identidad-raiz: PASS", detector);
  const station = text.indexOf("estacion-viva", pass);
  const boot = text.indexOf("BOOT.md", pass);
  if (detector < 0 || pass <= detector || station <= pass) {
    throw new Error(`${label}: orden detector→PASS→estacion inválido`);
  }
  const normalized = text.replace(/\s+/g, " ").toLowerCase();
  const normalizedDetector = normalized.indexOf("verificar-identidad-raiz.mjs");
  const temporalContext = normalized.slice(
    Math.max(0, normalizedDetector - 320),
    normalizedDetector,
  );
  if (!temporalContext.includes(temporalBefore[label])) {
    throw new Error(`${label}: detector/PASS no preceden el primer efecto`);
  }
  if (requireBootReference && boot <= pass) {
    throw new Error(`${label}: BOOT puede invocarse sin PASS previo`);
  }
  if (!text.includes(failClosedOrder)) {
    throw new Error(`${label}: falta orden fail-closed`);
  }
  if (
    !text.includes("LOCK identidad-raiz") ||
    !text.includes("cero efectos")
  ) {
    throw new Error(`${label}: falta LOCK fail-closed explícito`);
  }
  const failClosedClause = extractFailClosedClause(text, label);
  let effectCursor = -1;
  for (const effect of requiredZeroEffects) {
    const effectIndex = failClosedClause.indexOf(effect);
    if (effectIndex <= effectCursor) {
      throw new Error(
        `${label}: cláusula de cero efectos no cubre en orden ${effect}`,
      );
    }
    effectCursor = effectIndex;
  }
};
const dualSection = (text) =>
  text.match(/## Salida dual bidireccional[\s\S]*?(?=\n## )/)?.[0] ?? "";
const validateOrchestrator = (text) => {
  validateIdentityBeforeStation(text, "orquestador", true);
  const dualContract = dualSection(text);
  for (const signal of [
    "ADDENDA-DOS-CARAS.md",
    "**Entrada:**",
    "**Salida:**",
    "gate",
  ]) {
    if (!dualContract.includes(signal)) {
      throw new Error(`orquestador: salida dual incompleta (${signal})`);
    }
  }
};
const validateWorkerCycle = (worker, ciclo) => {
  validateIdentityBeforeStation(worker, "worker", false);
  validateIdentityBeforeStation(ciclo, "ciclo", true);
  if (!worker.includes("calibración ausente") && !worker.includes("falta cualquiera")) {
    throw new Error("worker: no bloquea calibración ausente");
  }
  if (!ciclo.includes("LOCK impide boot, handoff y cualquier efecto")) {
    throw new Error("ciclo: LOCK no bloquea boot/handoff");
  }
};
const swapOnce = (text, first, second) => {
  const marker = "__INTEGRACION_SWAP__";
  return text.replace(first, marker).replace(second, first).replace(marker, second);
};

const revisionPath =
  "skills/swarm-orquestacion/reference/revision-adversarial.md";
const revision = read(revisionPath);
const match = revision.match(
  /```js revision-adversarial-probe\r?\n([\s\S]*?)\r?\n```/,
);
if (!match) throw new Error("probe adversarial no encontrado");
run("seleccion normal/riesgo", ["--input-type=module"], { input: match[1] });

const identity = run("identidad PASS/LOCK y cero efectos", [
  "skills/vigilancia/scripts/probar-identidad-raiz.mjs",
]);
if (!identity.includes("identidad-probes: PASS (9 casos)")) {
  throw new Error("cobertura de identidad incompleta");
}

const dual = run("salida dual valida/invalida", [
  "skills/vigilancia/scripts/probar-salida-dual.mjs",
]);
for (const signal of [
  "PASS fixture-pass-y-bloqueo",
  "RECHAZO una-sola-parte",
  "RECHAZO orden-invertido",
  "RECHAZO estado-divergente",
  "RECHAZO handoff-con-fluff",
]) {
  if (!dual.includes(signal)) throw new Error(`falta caso dual: ${signal}`);
}

run("dedup contratos", [
  "skills/vigilancia/scripts/probar-dedup-contratos.mjs",
]);
run("semver verdes/invalidos/falsos-negativos", [
  "skills/swarm-orquestacion/examples/fixture-semver/probes.mjs",
]);
run("segundo cliente semver", [
  "skills/swarm-orquestacion/examples/fixture-semver/cliente-independiente/probe.mjs",
]);

const ciclo = read("skills/swarm-orquestacion/reference/ciclo.md");
const orchestrator = read(
  "skills/swarm-orquestacion/reference/roles/ORQUESTADOR.md",
);
const worker = read("skills/swarm-orquestacion/reference/roles/WORKER.md");
validateOrchestrator(orchestrator);
console.log("Eje IV consumidor orquestador: PASS");
validateWorkerCycle(worker, ciclo);
console.log("Eje IV consumidor worker/ciclo: PASS");

expectRejection("orquestador-sin-salida-dual", () =>
  validateOrchestrator(
    orchestrator.replace(
      /## Salida dual bidireccional[\s\S]*?(?=\n## )/,
      "",
    ),
  ),
);
expectRejection("orquestador-sin-estacion-viva", () =>
  validateOrchestrator(orchestrator.replaceAll("estacion-viva", "estacion")),
);
expectRejection("worker-sin-estacion-viva", () =>
  validateWorkerCycle(worker.replaceAll("estacion-viva", "estacion"), ciclo),
);
for (const field of requiredCalibration) {
  expectRejection(`orquestador-sin-${field}`, () =>
    validateOrchestrator(orchestrator.replaceAll(field, "CAMPO_ELIMINADO")),
  );
}
const swappedOrchestrator = swapOnce(
  orchestrator,
  "../../../vigilancia/scripts/verificar-identidad-raiz.mjs",
  "../../../estacion-viva/reference/BOOT.md",
);
expectRejection("orquestador-boot-antes-de-detector", () =>
  validateOrchestrator(swappedOrchestrator),
);
expectRejection("ciclo-sin-pass-previo-al-boot", () =>
  validateWorkerCycle(
    worker,
    ciclo.replace("identidad-raiz: PASS", "identidad pendiente"),
  ),
);
expectRejection("orquestador-sin-LOCK", () =>
  validateOrchestrator(orchestrator.replaceAll("LOCK", "BLOQUEO")),
);
expectRejection("orquestador-con-efectos-antes-del-bloqueo", () =>
  validateOrchestrator(
    orchestrator.replace(
      failClosedOrder,
      "DETECTOR → EFECTOS → PASS|LOCK",
    ),
  ),
);
expectRejection("clausula-sin-boot-handoff", () =>
  validateOrchestrator(
    orchestrator.replace("boot, handoff ni `OUT_DIR`", "`OUT_DIR`"),
  ),
);
expectRejection("orquestador-despues-de-mkdir", () =>
  validateOrchestrator(
    orchestrator.replace(
      "antes de cualquier `mkdir`",
      "después de cualquier `mkdir`",
    ),
  ),
);
expectRejection("worker-despues-de-mkdir", () =>
  validateWorkerCycle(
    worker.replace(
      "Antes de cualquier `mkdir`",
      "Después de cualquier `mkdir`",
    ),
    ciclo,
  ),
);
expectRejection("ciclo-despues-de-efecto", () =>
  validateWorkerCycle(
    worker,
    ciclo.replace(
      "antes de cualquier efecto",
      "después de cualquier efecto",
    ),
  ),
);

const ordered = [
  "## 3. Contrarrevisión selectiva pre-aceptación",
  "## 4. Revisión ordinaria y aceptación",
  "## 6. Merge y gate post-merge",
];
let cursor = -1;
for (const heading of ordered) {
  const next = ciclo.indexOf(heading);
  if (next <= cursor) throw new Error(`orden de ciclo inválido: ${heading}`);
  cursor = next;
}

for (const file of [
  "skills/swarm-orquestacion/SKILL.md",
  "skills/swarm-orquestacion/reference/ciclo.md",
  "skills/swarm-orquestacion/reference/roles/ORQUESTADOR.md",
  "skills/swarm-orquestacion/reference/roles/WORKER.md",
]) {
  const text = read(file);
  if (!text.includes("verificar-identidad-raiz.mjs")) {
    throw new Error(`falta referencia de identidad: ${file}`);
  }
}

console.log("integracion-metodo: PASS");
console.log("pre-merge/post-merge: evidencia separada");
```
