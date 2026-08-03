# Reglas de método v0.4 — costuras del swarm

v0.4 = las 14 reglas de v0.3 **sin cambios**
(`reference/reglas-metodo-v03.md`) + la **regla 15** (fuente de verdad
única y efimeralidad). Nace de un incidente real: un agente casi deja el
gobierno en una carpeta de herramienta efímera, y la práctica difusa de
que cada agente confíe en su memoria interna en vez de en el plan trazado.

## Regla 15 — Fuente de verdad única; memoria y carpetas de IDE son efímeras

**El plan trazado en git es la única fuente de verdad del mundo.** El
estado (BACKLOG, DECISIONES, REPORTES, briefs) vive versionado y visible
para cualquier agente, IDE o equipo. Todo lo demás es scratch.

- **La memoria interna del agente es scratch de sesión, no verdad.** Sirve
  para apoyarse mientras se trabaja, pero se pierde al cerrar y **solo la
  conoce ese agente**. Prohibido tomarla como fuente de verdad: acumula
  información obsoleta mientras otros IDEs avanzan sobre el plan. **Antes
  de actuar se verifica contra el plan, no contra el recuerdo.**
- **Las carpetas de herramienta/IDE** (`.claude/`, `.cursor/`,
  `.github/` de agente, equivalentes) son efímeras. Se **conserva** su
  **configuración funcional** (settings, tasks, servidores MCP, cualquier
  config que el entorno necesite para operar). Se **prohíbe** dejar en
  ellas **texto de información**: markdowns o notas con estado de sesión,
  identificadores internos (p. ej. «U148»), decisiones o hallazgos. Ese
  texto se pierde al cerrar la sesión y hace creer a otros equipos que
  «ya lo sabe el resto» — el incidente que bloquea el trabajo multi-IDE.
- **Corolario de entrega:** cualquier información que deba sobrevivir a la
  sesión o servir a otro agente va al plan trazado (o al canal que el
  mundo declare), nunca a memoria interna ni a un markdown de carpeta de
  IDE.

**Regla:** una fuente de verdad, trazada y compartida; lo efímero no se
comparte ni se cita.

Pareja de la regla 1 (gobierno a git antes que obra): la 1 exige
**commitear** el gobierno; la 15 **prohíbe** una fuente de verdad
paralela y efímera (memoria o carpeta de IDE) que compita con él.

## Checklist de cierre de ola (v0.4)

Extiende la de v0.3 con el ítem de efimeralidad:

```text
[ ] git stash list          → vacío (o deudas registradas)
[ ] git status plan/        → sin diff pendiente
[ ] ramas wp/* mergeadas    → borradas local+remoto, o justificadas
[ ] git status              → explicado línea a línea
[ ] worktrees huérfanos     → removidos
[ ] carpetas de IDE         → sin markdowns/notas de info de sesión
                              (solo config funcional); memoria interna
                              no citada como fuente — verificado el plan
```

## Práctica · CHANGELOG de gobierno vinculado al backlog

Aplicación de C9 (no listas que se pudren). Hay **dos ejes** de changelog;
no se confunden:

| eje | cardinalidad | clave | quién lo escribe | este gate |
| --- | ------------ | ----- | ---------------- | --------- |
| **CHANGELOG de gobierno** | uno por mundo | WP-id (✅ del BACKLOG) | agente: copia del plan, no inventa | sí |
| **CHANGELOG de paquete** | N (p. ej. monorepo + changesets) | SHA / semver del paquete | máquina / tooling de release | no |

Disciplina del eje de **gobierno**:

- **Formato FOSS estándar** (Keep a Changelog): `## [x.y.z] — fecha` con
  secciones `Added` / `Changed` / `Fixed` (u homónimos). Sin prosa libre
  por agente.
- **Contenido = WP ✅ del plan.** Cada entrada de una versión copia los WP
  cerrados de esa release (id + título del BACKLOG), no textos improvisados.
  Un WP ✅ que no está en el CHANGELOG de gobierno es un desfase.
- **Gate opt-in / parametrizable:** `scripts/verificar-changelog.mjs`
  — declarar `--role gobierno` y las rutas (`--changelog`, `--backlog`,
  `--version`). Falla si falta la sección de la versión, o si un WP ✅ del
  BACKLOG no está referenciado. **Rechaza** `--role paquete`: los
  CHANGELOG de paquete no pasan por este gate. En monorepos, apuntar solo
  al CHANGELOG de gobierno del mundo; no asumir changelog único en la raíz.
  Correrlo antes de `npm publish` (y en CI) cuando el mundo lo active.
- **El vigía** lo cruza en su pulso (ver skill `vigilancia`): el CHANGELOG
  de gobierno refleja lo cerrado del plan, o se eleva como anomalía.

**Regla:** el CHANGELOG de gobierno es un espejo del backlog cerrado, no un
cuaderno personal ni el changelog de un paquete npm.

## Práctica · Versión del README del paquete (anti-drift de release)

Aplicación de C9 (no dos verdades que se pudren) sobre la **cara del
tarball**. El `README.md` viaja en `package.json.files` → es documento
publicado y debe cerrar con el semver que se publica. Incidente real
(DC-30 / INT-V-07): un tarball salió con `package.json` en `0.11.0` y el
README interno citando «actual `0.10.0`» — el consumidor leyó una versión
que ya no era. `bump` tocó `package.json` y `CHANGELOG` pero **no** el
README.

Disciplina:

- **La versión actual (de `package.json`) aparece en el README**, y
  **ninguna versión anterior figura «como actual»**: ni en la referencia
  de install/`npm view` (`@<pkg>@X.Y.Z`), ni en el nombre de tarball de
  `npm pack` (`<pkg-sin-scope>-X.Y.Z.tgz`), ni en marcadores de prosa
  («(actual `X.Y.Z`)», «el paquete **X.Y.Z**»). Una versión de
  **solo-historia** (p. ej. «sobre el corte **0.9.0**») es legítima y no
  se toca — solo se veta la anterior presentada como vigente.
- **Gate opt-in / parametrizable:** `scripts/verificar-release.mjs`
  (hermano de `verificar-changelog.mjs`). Deriva `name` + versión de
  `package.json` (no hardcodea versiones); flags `--pkg`, `--readme`,
  `--doc` (docs extra empaquetados; **no** pasar `CHANGELOG.md`, que es
  version-keyed por diseño), `--marcador 'regex'` (marcadores propios,
  grupo 1 = semver). **FALLA ruidoso** (exit 1) nombrando
  fichero:línea + versión hallada + versión actual.
- **Paso de release:** correrlo en el commit `chore(release)` **junto al
  bump** y antes de `npm pack`/`npm publish` (y en CI), de forma que el
  bump que no propaga la versión al README **rompa el corte** en vez de
  publicarse. Es el hermano de presencia-de-versión del
  `verificar-changelog` (presencia-de-sección).

Checklist mínimo del corte publicable (`chore(release)`):

```text
[ ] package.json.version   → bump al semver del corte
[ ] CHANGELOG (gobierno)    → sección de la versión + WP ✅  (verificar-changelog.mjs)
[ ] README (files)          → cita la versión nueva; ninguna anterior como actual
                             (verificar-release.mjs --pkg package.json --readme README.md)
[ ] npm pack               → inspeccionar el tarball antes de publish
```

**Regla:** un `bump` que no llega al README es un corte roto; el gate lo
detiene antes de que el tarball mienta al consumidor.

## Relación con v0.2 / v0.3

`reglas-metodo-v02.md` (12 reglas) y `reglas-metodo-v03.md` (14 reglas +
V2 + práctica de medida) quedan como histórico. Este fichero (v0.4) es el
contrato vigente: 1–14 (vía v0.3) + 15 + checklist extendido.
