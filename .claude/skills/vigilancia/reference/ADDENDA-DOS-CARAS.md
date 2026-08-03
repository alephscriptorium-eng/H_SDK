# Formato — addenda dos caras

Toda propuesta del vigía al custodio sale en **dos caras**. La cara que
puede llegar al orquestador del mundo jamás filtra vocabulario del marco.

## Estructura

```markdown
# ADDENDA-<id> · Rn-<carril> · <tema corto>

## §interna
(Para el custodio / vigía. Puede nombrar mediación, capa, procedencia.
Declara el carril. No se copia al orquestador del mundo.)

## §WP
(Salida dual copiable en el idioma del mundo: Parte 1 PO/SCRUM y Parte 2
operativa, en ese orden. Sin vocabulario del marco ni rutas ajenas al mundo.
Un solo carril por addenda — ver abajo.)

## Prueba de ceguera
(Paso obligatorio del método — ver abajo.)
```

## Contrato dual de toda salida al custodio

La cara `§interna` conserva contexto de mediación. Dentro de `§WP`, toda
salida de vigilancia presenta exactamente este orden:

1. **Parte 1 · Vista PO/SCRUM**, Markdown renderizable fuera de fenced code
   blocks. Es breve y humana; contiene «Qué cambió», «Qué sigue» y «Decisión
   del custodio». Muestra GO/check/PASS con `✅`/`⏳`/`⛔`, limita referencias
   WP a las imprescindibles y evita jerga de backlog. Prefiere listas
   verticales; solo usa matriz corta cuando declara una bifurcación real o el
   custodio pide ampliación.
2. **Parte 2 · Handoff operativo**, contenido completo dentro de un único
   fenced code block. Sin fluff: solo `BACKLOG`, `GATES`, `ALCANCES` y
   `SECUENCIA`; queda listo para copy/paste al orquestador.

El estado operativo se repite literalmente en ambas partes para que un PASS o
un bloqueo no desaparezca al separar audiencias. Una parte sola, Parte 1
cercada, Parte 2 parcialmente fuera de caja o estados divergentes se
devuelven. La estructura exige una única `§WP`; dentro de ella no caben
secciones libres. El handoff contiene una vez y en orden `BACKLOG`, `GATES`,
`ALCANCES`, `SECUENCIA`: listas bajo las tres primeras y pasos numerados bajo
la última, sin prosa operativa suelta.

`ESTADO` es una lista `CLAVE=✅|⏳|⛔` separada por `;`. Debe incluir la clave
exacta `GO` y familias completas `CHECK`/`CHECK_*` y `PASS`/`PASS_*`.
Subcadenas dentro de otras claves no acreditan estado.

El patrón de boot dual de `estacion-viva/reference/SALIDA-DUAL.md` es una
referencia vecina: no se copia ni fusiona. Este contrato cubre las salidas
propias del vigía.

Gate y probes:

```bash
node skills/vigilancia/scripts/verificar-salida-dual.mjs <salida.md>
node skills/vigilancia/scripts/probar-salida-dual.mjs
```

## Carril (multi-carril)

- El título lleva la etiqueta `Rn-<carril>` (patrón abstracto; el
  consumidor sustituye `<carril>`).
- **No mezclar carriles:** una addenda = un carril. Hallazgos de otro
  carril → otra addenda (otro id + otra etiqueta).
- La cara §WP no cita señales ni worktrees del carril hermano salvo que
  el CA del mundo lo exija; si debe mencionar freeze global por lock,
  lo hace en lenguaje del mundo sin filtrar el otro orquestador.
- Fuente de doctrina: `ESTACION.md` → «Pulso multi-carril» / supuestos
  de convivencia.

## Prueba de ceguera (paso del método)

Antes de entregar §WP:

1. Acordar el **vocabulario prohibido** para esta entrega: identificadores
   del marco que publica el skill + cualquier nombre de capa que el mundo
   no deba ver (lista local del custodio / PRACTICAS del marco).
2. Correr búsqueda sobre **solo** la cara §WP (no sobre §interna):
   resultado = **0 coincidencias**.
3. Anotar el comando y el conteo en esta sección (salida literal).
4. Si hay match: reescribir §WP y repetir. No entregar con matches.

La cara §interna puede usar vocabulario de mediación; la prueba de
ceguera **no** se aplica a §interna.

## Evidencia enmascarada (estándar de cara pública)

A veces la propia evidencia de ceguera **necesita citar el patrón vetado**
(p. ej. reportar que un token de marco apareció, o mostrar el antes/después de
una fuga). En cara pública —§WP, reportes copiables al mundo, addenda
mediada— rige el estándar reforzado:

1. **El patrón vetado se cita ENMASCARADO, nunca literal.** Se rompe por
   fragmentos, se sustituye por un marcador (`‹token-marco›` / `<vetado>`) o
   se describe («identificador de marco»), de modo que un `grep` del
   vocabulario prohibido sobre la cara pública siga dando **0**.
2. **El conteo va LITERAL.** El número de coincidencias sí es dato real y se
   reporta tal cual: «el patrón vetado apareció **3** veces en N ficheros». La
   máscara oculta el **token**, no la **magnitud**.
3. **§interna puede citar el token literal** (no pasa por ceguera); la cara
   pública, nunca.
4. **Aplicación retroactiva.** Endurecer caras públicas **ya emitidas** queda
   a criterio de **cada mundo** —no es obligación del método reescribir
   evidencia histórica—; las nuevas cumplen el estándar desde ya. La evidencia
   histórica que se conserve se trata como **cita inerte** (no se re-emite sin
   enmascarar).

Corolario del comando de ceguera: valida el **exit / conteo** de `grep -c` /
`grep -q`, nunca `grep | head && echo OK` (misma regla que `swarm-orquestacion`
→ `reference/ejes-ca.md` §Ceguera, regla 14).

## Entrega

- Custodio recibe el documento completo (todas las caras + etiqueta de
  carril).
- Orquestador del mundo recibe **solo** §WP (tras ceguera = 0), mediado;
  el custodio enruta al orquestador del carril etiquetado.
- Tras merge del WP: el vigía re-verifica el CA de facto en el canal real.
