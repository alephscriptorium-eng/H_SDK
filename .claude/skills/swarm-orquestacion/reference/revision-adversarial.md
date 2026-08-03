# Contrarrevisión adversarial selectiva

Contrato para añadir una revisión **independiente** cuando el riesgo de un WP
lo justifica. No sustituye la revisión ordinaria del orquestador ni el gate
post-merge: es una barrera read-only, previa a la aceptación, cuyo objetivo es
intentar refutar los criterios de aceptación (CA).

## Activación selectiva

El orquestador clasifica el WP al preparar su brief:

| `RIESGO_REVISION` | Cuándo corresponde | Flujo |
| ----------------- | ------------------ | ----- |
| `normal` | documentación rutinaria, cambios mecánicos o riesgo acotado sin las clases siguientes | worker → revisión ordinaria (sin contrarrevisión obligatoria) |
| `independiente` | gate/parser con riesgo de falsos negativos; seguridad, permisos o fronteras de escritura; migración o demolición irreversible; publicación/release; cambio transversal del contrato del método; protocolo operativo que puede autorizar mutaciones | worker → contrarrevisión adversarial → revisión ordinaria |

La lista de riesgo es cerrada por defecto: la mera edición de documentación no
activa contrarrevisión. El orquestador puede elevar un caso no listado, pero
debe explicar el riesgo verificable en `MOTIVO_RIESGO`; no puede rebajarlo si
pertenece a una clase `independiente`.

## Campos del brief

- `RIESGO_REVISION`: `normal` o `independiente`.
- `MOTIVO_RIESGO`: clase de riesgo y efecto que podría escapar a la revisión
  ordinaria; para `normal`, explica por qué no activa una clase independiente.
- `CONTRAEVIDENCIA_REQUERIDA`: casos concretos con los que se intentará refutar
  los CA, incluidos verdes, inválidos y falsos negativos cuando correspondan.
- `REVISOR_DISTINTO_WORKER`: `sí` cuando el riesgo es `independiente`; para
  riesgo `normal`, `no requerido`.

Un brief de riesgo `independiente` queda incompleto si falta un campo, si el
revisor no es distinto o si la contraevidencia solo repite el camino feliz.

## Protocolo read-only

El revisor recibe rama, reporte, brief y base de comparación. No modifica
archivos, commits, BACKLOG, estados, tags ni remotas; tampoco acepta ni mergea.

1. Confirma identidad distinta respecto del worker y que el diff se limita al
   `ALCANCE_DIFF`.
2. Convierte cada CA y cada elemento de `CONTRAEVIDENCIA_REQUERIDA` en una
   hipótesis refutable.
3. Inspecciona el diff completo y reproduce gates locales cuando sea posible.
4. Busca caminos inválidos aceptados, falsos negativos, omisiones de alcance,
   dependencias runtime no declaradas y afirmaciones sostenidas solo por
   evidencia manual.
5. Distingue en su salida:
   - **prueba automatizada**: comando o probe repetible con resultado literal;
   - **evidencia manual**: inspección identificada como manual, sin presentarla
     como test;
   - **sin verificar**: cualquier observación no reproducida.
6. Emite exactamente uno de estos resultados:
   - `PASS`: no logró refutar los CA con los casos ejecutados;
   - `DEVUELTO`: lista numerada de defectos reproducibles o evidencia faltante.

`PASS` no equivale a aceptación. El orquestador conserva la revisión ordinaria,
decide la aceptación y realiza cualquier merge posterior.

## Casos de contrato

Estos casos prueban la selección, no el contenido de un WP concreto:

1. **Normal:** corregir redacción sin cambiar reglas, gates ni comportamiento
   declara `RIESGO_REVISION: normal` y no exige revisor independiente.
2. **Gate:** cambiar un parser que puede aceptar entradas inválidas declara
   `RIESGO_REVISION: independiente`, exige persona/agente distinto y
   contraevidencia con inválidos y falsos negativos.

Una comprobación automatizada puede validar que la tabla conserva ambos flujos;
la valoración de si un cambio real pertenece a una clase de riesgo sigue siendo
evidencia manual del orquestador y debe etiquetarse como tal.

## Probe persistente de contrato y dedup

Desde la raíz del mundo, el siguiente comando extrae y ejecuta el probe
versionado en esta misma referencia:

```bash
awk '/^```js revision-adversarial-probe$/{on=1;next} /^```$/{if(on) exit} on' \
  skills/swarm-orquestacion/reference/revision-adversarial.md |
  node --input-type=module
```

El probe comprueba los campos, ambos flujos y la ubicación única de la
clasificación en todos los consumidores contractuales de este WP: `BRIEF.md`,
`REVISION.md` y `plantilla-reporte.md`. Extrae las clases desde la fila
canónica, sin volver a declararlas en el código. Después inyecta esa
clasificación en memoria dentro de `REVISION.md` y exige que el detector
semántico la rechace. También muta por separado los flujos `normal` e
`independiente` y exige que ambos queden rechazados; no se limita a contar un
encabezado o marcador.

Runtime del probe: Node y su built-in `node:fs`; no requiere ni añade
dependencias npm.

```js revision-adversarial-probe
import fs from "node:fs";

const canonicalPath =
  "skills/swarm-orquestacion/reference/revision-adversarial.md";
const briefPath =
  "skills/swarm-orquestacion/reference/roles/BRIEF.md";
const consumerPaths = [
  briefPath,
  "skills/swarm-orquestacion/reference/roles/REVISION.md",
  "skills/swarm-orquestacion/reference/plantilla-reporte.md",
];
const canonical = fs.readFileSync(canonicalPath, "utf8");
const consumers = new Map(
  consumerPaths.map((file) => [file, fs.readFileSync(file, "utf8")]),
);
const brief = consumers.get(briefPath);

const fields = [
  "RIESGO_REVISION",
  "MOTIVO_RIESGO",
  "CONTRAEVIDENCIA_REQUERIDA",
  "REVISOR_DISTINTO_WORKER",
];
for (const field of fields) {
  if (!brief.includes(`- ${field}:`)) {
    throw new Error(`falta campo del brief: ${field}`);
  }
}

const expectedNormalFlow =
  "worker → revisión ordinaria (sin contrarrevisión obligatoria)";
const expectedIndependentFlow =
  "worker → contrarrevisión adversarial → revisión ordinaria";

const validateSelection = (source) => {
  const contract = source.split("## Probe persistente de contrato y dedup")[0];
  const rows = contract.split(/\r?\n/);
  const normalRow = rows.find((line) => line.startsWith("| `normal` |"));
  const independentRow = rows.find((line) =>
    line.startsWith("| `independiente` |"),
  );
  if (!normalRow || normalRow.split("|")[3].trim() !== expectedNormalFlow) {
    throw new Error("flujo normal inválido");
  }
  if (
    !independentRow ||
    independentRow.split("|")[3].trim() !== expectedIndependentFlow
  ) {
    throw new Error("flujo independiente inválido");
  }

  const normalizedContract = normalize(contract);
  const distinctReviewer = normalize(
    "REVISOR_DISTINTO_WORKER sí cuando el riesgo es independiente",
  );
  const adversarialEvidence = normalize(
    "si la contraevidencia solo repite el camino feliz",
  );
  if (!normalizedContract.includes(distinctReviewer)) {
    throw new Error("falta revisor distinto para riesgo independiente");
  }
  if (!normalizedContract.includes(adversarialEvidence)) {
    throw new Error("falta prohibir contraevidencia solo feliz");
  }
  return independentRow;
};

const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();

const independentRow = validateSelection(canonical);

const classification = independentRow.split("|")[2].trim();
const riskClasses = classification.split(";").map((item) => item.trim());
if (riskClasses.length !== 6 || riskClasses.some((item) => item.length === 0)) {
  throw new Error(`clasificación canónica inválida: clases=${riskClasses.length}`);
}

const semanticDuplicates = (text) => {
  const normalizedText = normalize(text);
  return riskClasses.filter((riskClass) =>
    normalizedText.includes(normalize(riskClass)),
  );
};

const duplicates = [...consumers.entries()].flatMap(([file, text]) =>
  semanticDuplicates(text).map((riskClass) => ({ file, riskClass })),
);
if (duplicates.length > 0) {
  throw new Error(
    `clasificación duplicada: ${duplicates
      .map(({ file, riskClass }) => `${file}:${riskClass}`)
      .join(", ")}`,
  );
}

const mutantPath =
  "skills/swarm-orquestacion/reference/roles/REVISION.md";
const mutant = `${consumers.get(mutantPath)}
${classification}`;
const rejectedMutant = semanticDuplicates(mutant);
if (rejectedMutant.length !== riskClasses.length) {
  throw new Error(`el gate no rechazó el duplicado semántico: ${rejectedMutant}`);
}

const expectSelectionRejection = (name, mutant) => {
  try {
    validateSelection(mutant);
  } catch {
    console.log(`mutante flujo ${name}: RECHAZADO`);
    return;
  }
  throw new Error(`el gate aceptó el mutante del flujo ${name}`);
};
expectSelectionRejection(
  "normal",
  canonical.replace(expectedNormalFlow, expectedIndependentFlow),
);
expectSelectionRejection(
  "independiente",
  canonical.replace(expectedIndependentFlow, expectedNormalFlow),
);

console.log("probe revision-adversarial: PASS");
console.log("caso normal: revisión ordinaria sin contrarrevisión obligatoria");
console.log(
  "caso independiente: worker → contrarrevisión adversarial → revisión ordinaria; revisor distinto; contraevidencia no solo feliz",
);
console.log(
  `dedup semántico: PASS (fuente canónica=1; consumidores=${consumerPaths.length}; duplicados=0)`,
);
console.log(
  `mutante REVISION.md: RECHAZADO (clases=${rejectedMutant.length})`,
);
```
