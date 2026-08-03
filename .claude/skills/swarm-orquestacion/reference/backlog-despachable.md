# BACKLOG despachable — contrato y linter

Un BACKLOG es **despachable** cuando el orquestador puede convertir cualquiera
de sus filas en un BRIEF sin preguntar nada. Este documento define ese contrato
y la doctrina del linter que lo verifica
(`../scripts/verificar-backlog.mjs`).

No sustituye al juicio del orquestador: **decide sobre la forma**, no sobre la
verdad. Un backlog despachable puede seguir siendo un mal plan; uno no
despachable no se puede repartir sin inventar.

---

## 1. Los siete campos por WP

| campo | qué decide | ausencia = |
| ----- | ---------- | ---------- |
| `lane` | quién lo despacha (carril / territorio) | no se puede repartir |
| `WP` | identidad literal del trabajo (serie del mundo) | no se puede citar ni cerrar |
| `BRIEF` | qué se hace | el worker lo inventa |
| `CA` | cuándo está hecho | la aceptación es opinión |
| `P` | prioridad dentro del conjunto declarado | no hay orden de ola |
| `deps` | qué debe estar antes | se despacha en orden imposible |
| `ejes` | qué eje de CA activa el tipo de WP (`ejes-ca.md`) | el eje se «recuerda», no se exige |

**Formato:** tabla markdown cuya cabecera declara la columna de ID (`WP` / `id`).
`lane` puede venir de columna o del encabezado de sección
(`--patron-lane`, por defecto `## Lane …` / `## Carril …`). Las tablas que **no**
declaran columna de ID se ignoran (metadatos, conteos) — pero si una de sus filas
empieza por un ID de serie declarada, el linter la caza: ningún WP vive fuera de
la tabla de WPs.

El formato de **lista** (`- ⬜ **ID · título**`, el que parsea
`proyectar-backlog.mjs` para proyectar issues) **no** es despachable: no tiene
sitio por fila para `deps` ni `ejes`. Un backlog en ese formato da 0 WPs y falla
ruidoso; no se «aprueba por no encontrar nada».

**Solo cuenta lo que el lector ve como tabla del backlog.** Esto no se resuelve
enumerando formas de esconder una tabla, sino con la **estructura de bloque de
CommonMark**, que es un problema acotado y especificado:

| bloque | regla aplicada |
| ------ | -------------- |
| fence | cierre con el **mismo carácter**, longitud **≥** la apertura y nada más en la línea; un fence de backticks no admite backticks en su info string (`~~~` no cierra ```` ``` ````, y un fence de 4 contiene uno de 3) |
| código indentado | ancho ≥ 4 con **expansión de tabulador** (3 espacios + tab = 4) |
| bloque HTML | tipo 1 (`<pre>`, `<script>`, `<style>`, `<textarea>`) hasta su cierre; tipo 6 (`<details>`, `<div>`, `<table>`…) hasta línea en blanco. Como en CommonMark, basta con que la línea **empiece** por la etiqueta —`<details><summary>…</summary>` en una línea también abre bloque— y un `<details>` seguido de línea en blanco **sí** deja ver su tabla |
| front-matter | `---` / `+++` en la primera línea, hasta su cierre |
| comentario HTML · cita | velados, con su causa contada |

Cada línea velada se cuenta **por causa** (`fence=`, `indentado=`, `html=`,
`front-matter=`, `comentario=`, `cita=`) y el diagnóstico las nombra: el mensaje
no dice «no hay ninguna tabla» cuando lo que hay es una tabla escondida.

**Cierre estructural (opt-in).** Un mundo que quiera acabar con la familia
entera declara la **región** de su backlog (`--region-inicio` / `--region-fin`):
todo lo de fuera se ignora por construcción —envolturas incluidas— y la marca
ausente es `region-ausente` → exit 3 limpio.

**La ausencia se declara.** `deps` sin dependencias se escribe `ninguna`
(configurable). Una celda en blanco, `—`, `?`, `TBD` o `pendiente` es **campo
ausente**, no «sin dependencias». Es la regla 21 (hostil-omite) aplicada al
plan: el default de lo que calla es denegar. Y declarar `ninguna` **junto a** una
dependencia real (o `ninguno` junto a un eje real) es una **contradicción**: el
linter no elige por el autor cuál de las dos mitades vale.

**Convención de `deps` (declarada, con holgura).** La celda se lee así:

- **separadores**: espacios, `,` `;` `+` `/` `·` `→` `>` `&`. «`FX-A01 y
  FX-A03`» son dos dependencias, no un WP llamado «y»: en una herramienta en
  castellano eso es lo que la gente escribe, y un gate que lo rechaza acaba
  desactivado. Los conectores **no se declaran en ninguna lista**: se ignoran
  por su **forma** (no tienen forma de ID), igual que cualquier otra palabra;
- **puntuación de prosa** alrededor de cada token —punto final, paréntesis,
  comillas, corchetes— se ignora: `Ninguna.` es el token nulo, y
  `ninguna (WP raiz)` no declara ninguna dependencia;
- **enlaces markdown** se resuelven a su texto: `[FX-A01](#fx-a01)` = `FX-A01`;
- **prosa**: palabras (`ambas`, `raiz`, `y`) **y números sueltos** (`ola 1`,
  `seccion 3`) se ignoran — un número no puede confundirse con un ID roto;
- **token que mezcla letras y dígitos** sin ser un ID legible (`FXA01`,
  `FX_A01`) → `dep-no-interpretable` (bloqueante): esa sí es la forma de un ID
  roto, y no se traga en silencio;
- **celda con contenido de la que no sale nada** —ni id, ni token nulo, ni
  forma de ID roto: «las dos anteriores»— → `deps-no-declaradas` (bloqueante).
  La holgura no puede convertirse en **omisión silenciosa**: la ausencia se
  declara.

---

## 2. Qué bloquea y qué avisa

> **Bloquea lo decidible; avisa de lo opinable.**

| decide el exit | motivos |
| -------------- | ------- |
| **sí — bloquea** | `campo-ausente` · `columna-requerida-ausente` · `prioridad-invalida` · `eje-desconocido` · `ejes-contradictorios` · `deps-contradictorias` · `deps-no-declaradas` · `dep-no-interpretable` · `lane-desconocida` · `serie-no-declarada` · `id-duplicado` · `id-no-interpretable` · `fila-fuera-de-tabla-wp` · `dep-inexistente` · `dep-ciclo` · `brief-insuficiente` · `ca-insuficiente` · `region-ausente` · `region-sin-cierre` · `backlog-vacio` · `sin-wps` |
| **no — avisa** | `CA-ornamental/valoracion` · `CA-ornamental/sin-ancla` · `CA-ornamental/sin-objeto` · `CA-ornamental/sin-referente` |

**Por qué el CA ornamental no bloquea.** La calidad de un CA es **juicio**, y un
gate no puede arrogárselo sin producir falsos rechazos que lo maten: un gate que
rechaza CAs correctos acaba **desactivado**, y entonces no protege de nada. La
detección de CA ornamental es información valiosa —dice dónde el plan promete
sin comprometerse— y se emite siempre, con su motivo, su cita literal y su
recuento; pero el veredicto de despacho lo deciden las cosas que un programa
puede decidir sin opinar: campos, conjuntos declarados, contradicciones,
dependencias, ciclos, suelos y **ausencia**.

El **suelo** (`brief-insuficiente`, `ca-insuficiente`) sí bloquea porque no
juzga calidad: cuenta **palabras significativas distintas**. `zzz zzz zzz` no
son tres palabras; es una repetida. Es objetivo, declarado y parametrizable
(`--min-palabras-brief`, `--min-palabras-ca`).

---

## 3. Qué hace ornamental a un CA (aviso)

> Un CA es **verificable** cuando nombra las dos mitades de una comprobación:
> el **ancla** (el acto observable que decide) y el **objeto** (sobre qué
> recae). Es **ornamental** cuando falta cualquiera de las dos, o cuando el
> juicio de valor domina el enunciado.

**Ancla** — lo que alguien puede ejecutar o mirar, y que puede dar rojo:
un comando, un script, un gate, un probe, una fixture, una suite, un `grep`, un
conteo, un `exit`, un checksum, un veredicto (`falla`, `deniega`, `pasa`,
`verde`), una **negación universal** comprobable («ninguna referencia queda en
el árbol», «ningún usuario sin rol abre la sala») o un comparador (`= 0`, `≥ 1`).
El léxico se reconoce por forma exacta **y por lema** (`ejecu-`, `verific-`,
`grep-`, `fall-`, `deneg-`…), para que «ejecuciones», «grepables» o
«verificable» cuenten tanto como «ejecuta», «grep» o «verifica».

**Objeto** — sobre qué recae la comprobación: al menos una palabra de contenido
que no sea ancla, ni valoración, ni palabra función. «El test pasa» tiene ancla
y no tiene objeto: ¿el test **de qué**?

**Valoración** — juicio sobre el resultado: *elegante, limpio, mejor, calidad,
robusto, coherente, claro, sencillo, adecuado, correcto, se revisa, queda…*. No
están prohibidas: está prohibido que **dominen** (ratio ≥ `--umbral-valoracion`,
0.5 por defecto).

### Dos asimetrías cerradas

1. **Un dígito no ancla nada.** Una cantidad suelta solo cuenta como ancla si va
   con **comparador** (`= 0`), con **unidad de medida** (`0 hits`,
   `1 definicion`) o **pegada a otra ancla** (`exit 0`). Si bastara un número,
   «queda elegante en 2 sitios» sería un CA verificable.
2. **Concatenar con los separadores declarados no diluye.** El CA se analiza
   además **por segmentos**, pero solo por los separadores que el linter parte:
   `·`, `;`, `<br>` y salto de línea. Con coma, punto, paréntesis, guion o «y
   además», la dilución **vuelve** — es un límite acotado, no una propiedad
   general. Los *fragmentos de medida* (sin valoraciones y con ≤2 palabras
   significativas, como `exit 0`) no se juzgan sueltos: solo dentro del conjunto.

### Los cuatro motivos

| motivo | qué pasó | ejemplo que avisa |
| ------ | -------- | ----------------- |
| `CA-ornamental/valoracion` | la valoración domina | «queda elegante» · «mejor estructurado» · «se revisa la calidad» |
| `CA-ornamental/sin-ancla` | no nombra ninguna comprobación | «el modulo queda listo para su uso» |
| `CA-ornamental/sin-objeto` | comprueba… ¿el qué? | «el test pasa» · «gate verde» |
| `CA-ornamental/sin-referente` | solo con `--ca-estricto`: sin código, ruta ni cantidad | «la suite del segundo cliente pasa en verde» |

El mensaje cita **siempre** el WP, el campo, el motivo y el CA literal (o el
segmento), más las valoraciones y anclas detectadas. Un aviso sin cita no sirve
para corregir.

### Por qué esta definición y no una lista negra

Una lista negra de palabras («prohibido decir elegante») se esquiva con un
sinónimo y castiga CAs legítimos que mencionan calidad de paso. La regla
ancla+objeto ataca la **estructura** del enunciado. Aun así **sigue siendo un
léxico**, con las dos caras del error; por eso avisa en vez de bloquear.

### El aviso es de BARRIDO AMPLIO — ratio medido

No es una cola curada: es un barrido con **falsos positivos esperados**. Medido
y publicado para que nadie lo lea como veredicto:

| medida | valor |
| ------ | ----- |
| avisos por WP en un backlog real de 73 WPs | **35 → 48 %** |
| de ellos, CAs telegráficos (≤4 palabras distintas) | 26 (**74 %** de los avisos) |
| CAs legítimos de un juego independiente que avisan | ~5 de 12 (**42 %**) |

Léase así: **casi tres cuartos de los avisos son CAs cortos que el linter no
sabe juzgar**, no promesas vacías. El aviso sirve para *mirar dónde*, no para
concluir; por eso no bloquea y su recuento va en el reporte, no en el exit.
Quien quiera menos ruido sube los suelos o sustituye el léxico; quien quiera más
severidad, `--ca-estricto`.

---

## 4. Límites honestos

El aviso de CA mira la forma del texto. Deja pasar, **por diseño**:

1. **Forma correcta, verdad no verificada.** «el probe de la capa X falla si
   falta el campo» pasa aunque ese probe no exista. El linter no ejecuta nada
   del mundo: eso es trabajo de la revisión y del gate del carril.
2. **Comprobación real + prosa ornamental.** «queda elegante y el build de docs
   pasa con exit 0» pasa: contiene una comprobación.
3. **Ancla con objeto vago.** «el gate del portal pasa» tiene ancla y objeto y
   pasa. `--ca-estricto` sube el listón (exige código entre backticks, ruta o
   cantidad), a coste de rechazar CAs de prosa legítimos.
4. **Léxico dependiente del idioma.** Anclas y valoraciones son castellanas; un
   CA en otro idioma casi siempre avisa por falta de ancla. Se sustituye con
   `--lexico` (`--lexico-modo reemplazar`), incluidos los lemas.
5. **CA telegráfico.** Cerrar la asimetría del dígito tiene precio: «ceguera 0»
   o «DS-5 · ceguera» avisan por `sin-ancla`. Se corrige escribiendo la medida
   («`grep` de ceguera en árbol e historial = 0»), y mientras tanto **no
   bloquea**.
6. **Semántica de `deps`.** Se comprueba que resuelvan, que no se contradigan y
   que no ciclen, no que la dependencia sea *cierta*: un WP puede **omitir** una
   dependencia real y pasar.
7. **Estado del WP.** Se lintean **todas** las filas, incluidas las ya
   aceptadas: no hay marca que exima de lint (una exención sería la primera
   puerta que usaría un backlog basura).
8. **Filas descartadas arrastran sus defectos.** Una fila con ID duplicado, ID
   ilegible o de serie no declarada se rechaza por eso y sus demás campos ya no
   se analizan: el defecto citado es el que bloquea, no la lista completa.
9. **Calibración del consumidor.** Un `--series` demasiado permisivo declara
   como propia cualquier serie; los conjuntos los fija el BRIEF, no el linter.
10. **BRIEF.** Solo se le aplica el suelo y el aviso de **valoración**: no se le
    exige ancla ni objeto, porque describe trabajo, no comprobación.
11. **Dilución por separadores no declarados.** Ver §3: la garantía de segmentos
    cubre `·`, `;`, `<br>` y salto de línea, no la coma ni el punto.
12. **Tamaño (medido, no estimado).** El detector de ciclos es recursivo, así
    que el límite depende de la **profundidad** del grafo, no del número de
    filas:

    | caso | resultado |
    | ---- | --------- |
    | 20 000 filas planas | ~2 s · exit normal |
    | 40 000 filas planas | ~3,4 s · exit normal |
    | cadena **profunda** (cada WP depende del siguiente) de 4 000 | pasa |
    | cadena **profunda** de 5 000 | **desborda la pila → exit 2** |
    | cadena inversa (cada WP depende del anterior) de 50 000 | pasa: el DFS no se hunde |

    Desbordar **no** concede: sale por el manejador con **exit 2**
    (fail-closed), y hay caso rojo que lo fija. Un plan real (cientos de filas)
    queda **un orden de magnitud** por debajo del umbral de cadena profunda —
    no tres, como decía la versión anterior de esta línea.
13. **Tabla indentada dentro de un ítem de lista.** Una tabla escrita como
    continuación de un ítem (4 espacios) se vela como código indentado: es la
    regla de CommonMark aplicada sin contexto de lista. Falla ruidoso y nombra
    la causa (`indentado=`), pero es un **falso rechazo declarado**: saca la
    tabla del ítem o usa la región declarada.
14. **Envolturas que quedan fuera, como límite y no como defecto**: bloque HTML
    tipo 7 (etiqueta arbitraria sola en su línea), encabezados HTML crudos, la
    regla GFM de que una tabla no interrumpe un párrafo, un *thematic break*
    inicial confundible con front-matter, y una marca de región citada dentro
    de un fence. Ninguna concede en falso por sí sola en los casos probados;
    quien quiera cerrarlas todas de golpe usa la **región declarada**.

Y **no** deja pasar, por diseño: el vacío y la duda de uso. Fichero vacío, sin
tablas, tabla sin filas, filas que no producen ningún WP, o WPs que solo viven
donde el lector no los ve → **exit 3**. Flag desconocida, argumento suelto,
número no numérico o regex inválida → **exit 2**, nunca un veredicto: en CI solo
se lee el exit, y un linter que contesta sobre un fichero que nadie pidió
concede en falso.

---

## 5. Uso

```bash
node scripts/verificar-backlog.mjs \
  --backlog plan/BACKLOG.md \
  --series 'AA-[0-9]+|BB-[0-9]+' \
  --prioridades P0,P1,P2 \
  --ejes I,II,III,IV,V,ceguera,hostil-omite,ninguno
```

| exit | significado |
| ---- | ----------- |
| 0 | despachable (puede llevar avisos de CA) |
| 1 | defectos bloqueantes, citados por WP y campo |
| 2 | **uso o configuración**: flag desconocida, valor no numérico, regex inválida, backlog inexistente |
| 3 | **ausencia**: vacío o 0 WPs |

Parámetros (todos con env equivalente): `--backlog`, `--series`,
`--prioridades`, `--ejes`, `--ejes-ninguno`, `--lanes`, `--patron-lane`,
`--sin-deps`, `--deps-externas`, `--region-inicio`,
`--region-fin`, `--umbral-valoracion`, `--min-palabras-brief`,
`--min-palabras-ca`, `--ca-estricto`, `--lexico` (+`--lexico-modo`), `--alias`
(+`--alias-modo`), `--json`. Admite también `--flag=valor`; `--ayuda` solo se
sirve si es lo único que se pide. Nada está cableado a un mundo concreto:
series, prioridades, ejes, lanes, nombres de columna, suelos, marcas de región
y léxico son del consumidor.

Fixtures en cuatro caras (5 válidas, 1 de avisos, 13 inválidas y 9 de
ausencia, con su veredicto y recuento exacto en `casos.json`):
`../examples/fixture-backlog/`. Suite:
`node --test scripts/verificar-backlog.test.mjs`.

---

## 6. Dónde encaja en el ciclo

- **Antes del despacho** (paso 1 del ciclo, `ciclo.md`): el orquestador lintea
  el BACKLOG; si no es despachable, no hay ola. Los avisos de CA se leen como
  cola de mejora, no como bloqueo.
- **Al montar un mundo nuevo**: el primer BACKLOG nace ya con los siete campos.
- **En el cierre de ola**: un WP nuevo encolado sin `deps` ni `ejes` no espera
  a la revisión para que se note.

El linter **no** escribe el BACKLOG (regla de oro 2: solo el orquestador
escribe en él) ni decide prioridades: dice qué falta para poder repartir.
