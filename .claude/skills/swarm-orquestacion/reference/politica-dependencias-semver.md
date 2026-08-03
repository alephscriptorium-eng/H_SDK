# Política de dependencias y gate semver

Contrato para declarar dependencias runtime directas y verificar sus rangos
sin convertir una consulta al registry en requisito del trabajo local.

## Dos gates, dos evidencias

1. **Gate local determinista:** lee dos JSON y las raíces runtime declaradas;
   descubre imports, valida completitud, dependencias directas, allow/deny,
   dedup y sintaxis de rangos. Ejecuta los probes de integración local
   exigidos para `0.x`. No usa red, no resuelve versiones y no instala.
2. **C8 online:** comprueba después que el mínimo o la versión resuelta existe
   en el canal declarado y que una instalación limpia pasa el test de
   integración. Su evidencia se reporta separada; offline es
   `⏳ sin verificar`, nunca un PASS local.

El gate local usa solo built-ins de Node >=22. Por tanto, no añade una
dependencia runtime al paquete ni depende transitivamente de un parser semver.

## Configuración

```json
{
  "defaultPolicy": "exact",
  "policies": {
    "cliente-compatible": "caret-semver",
    "adaptador-estable": "major-band"
  },
  "runtimeImports": [
    "node:fs",
    "cliente-compatible/subpath",
    "adaptador-estable"
  ],
  "runtimeRoots": ["src", "bin"],
  "allow": ["cliente-compatible", "adaptador-estable"],
  "deny": [],
  "integrationTests": {
    "cliente-compatible": "test/integracion-cliente-compatible.mjs"
  },
  "dedupPatterns": [
    {
      "name": "CONTRATO_ADAPTADOR",
      "pattern": "\\bconst\\s+CONTRATO_ADAPTADOR\\b",
      "maxDefinitions": 1
    }
  ]
}
```

- `runtimeRoots` es obligatorio y debe cubrir las raíces JS/TS que se
  distribuyen o ejecutan (`src`, `bin`, etc.). El gate recorre todos sus
  ficheros, salvo `node_modules`, y descubre imports/exports, `import()`
  y `require()` literales. Una llamada dinámica no literal falla porque no es
  auditable.
- `runtimeImports` es un inventario opcional de contraste, no la fuente del
  descubrimiento. Si se declara incompleto o contiene un paquete no observado,
  falla. Si se omite, el escaneo sigue siendo obligatorio. Además, toda
  dependencia directa debe aparecer en las fuentes: una declaración muerta
  también falla. Así, vaciar el array no puede fabricar un PASS.
- Built-ins reconocidos por Node, incluidos `node:test`,
  `node:test/reporters` y `node:sqlite`, no requieren entrada en
  `dependencies`. El prefijo `node:` es obligatorio: formas bare como `fs`
  o `path` fallan tanto si se descubren en fuentes como si aparecen en
  `runtimeImports`. Un prefijo `node:` desconocido también falla.
- Cada paquete externo del inventario debe estar en `dependencies` u
  `optionalDependencies`. Estar solo en `devDependencies`, en el lockfile o
  como transitiva falla.
- `allow`, cuando no está vacío, limita los nombres directos permitidos.
  `deny` prevalece siempre.
- `policies` permite excepciones por nombre; el resto usa `defaultPolicy`.
- `integrationTests` mapea una dependencia `0.x` a un script Node local. El
  gate lo ejecuta desde la raíz del paquete con timeout; solo `exit 0`
  acredita integración. Enumerar el nombre sin ejecutar comportamiento ya no
  constituye evidencia.
- `dedupPatterns` es obligatorio. Cada regex localiza una definición de
  contrato en las fuentes y falla si aparece más de una vez
  (`maxDefinitions: 1`).

```bash
node skills/swarm-orquestacion/scripts/verificar-dependencias-semver.mjs \
  --package package.json --config dependencias-semver.json
```

## Políticas admitidas

- `exact`: `M.m.p` completo; admite sufijos SemVer de prerelease/build. Un
  identificador prerelease puramente numérico no admite ceros iniciales:
  `1.2.3-01` falla.
- `caret-semver`: exactamente `^M.m.p`.
- `major-band`: exactamente `>=M.m.p <(M+1).0.0`. Conserva un mínimo conocido
  y cierra el rango antes de la major siguiente.

Se rechazan rangos abiertos, `*`, tags (`latest`, `next`), Git/URL, aliases
`npm:`, workspaces y rutas `file:`/`link:`. No se aceptan abreviaturas ni
versiones con ceros iniciales. Los enteros se comparan como `BigInt`; majors
mayores que `Number.MAX_SAFE_INTEGER` no pierden precisión.

Para cualquier mínimo `0.x`, el gate emite `WARNING`: los saltos minor pueden
ser incompatibles. Además ejecuta el script de `integrationTests`; ausencia,
timeout o exit distinto de cero hacen fallar el gate.

## C8 online, separado

Con el gate local ya verde y un canal disponible:

```bash
npm view <paquete>@<mínimo-o-versión-resuelta> \
  --registry=<registry-declarado> version
npm ci --ignore-scripts
npm test
```

El test debe ejercitar la integración, no limitarse a importar. Una versión
inexistente o una instalación fallida refuta C8 aunque el rango sea
sintácticamente válido. Estos comandos implican red y no forman parte del
script local.

## Probes

`examples/fixture-semver/probes.mjs` crea paquetes efímeros y automatiza:

- verdes de las tres políticas;
- localizadores y rangos inválidos;
- allow/deny;
- dependencia runtime ausente o solo transitiva/dev;
- banda con techo incorrecto;
- prerelease numérico con cero inicial y majors fuera del entero seguro;
- built-ins `node:` prefix-only y subpaths;
- rechazo de built-ins bare en fuentes e inventario;
- completitud del escaneo e inventario incompleto;
- warning y test integrado ejecutado para `0.x`;
- definición duplicada de un símbolo de contrato;
- casos diseñados para detectar falsos negativos de parsers permisivos.

Los probes no consultan red y eliminan sus temporales al finalizar.

## Segundo cliente independiente (Eje IV)

`examples/fixture-semver/cliente-independiente/` es un paquete-fixture
autocontenido con su propio `package.json`, configuración, fuentes y runner.
No comparte manifiesto ni proceso de casos con `probes.mjs`; invoca el CLI
como lo haría otro consumidor:

```bash
node skills/swarm-orquestacion/examples/fixture-semver/cliente-independiente/probe.mjs
```

El resultado exigido es
`cliente independiente: OK · gate ejercitado sin red`.
