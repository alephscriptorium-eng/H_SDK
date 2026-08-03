# PROTOCOLO · identidad, firma y lenguaje común de la mesa

| dato | valor |
| ---- | ----- |
| Mantiene | `HUB` (calibración del mundo consumidor) |
| Vigencia | la declara la mesa al activar el skill |
| Rango | convención de mesa — complementa el índice de la `SALA`; no toca el método de otros skills |
| Cambios | nota al `HUB` vía `CUSTODIO`; el `HUB` actualiza y hace broadcast |

Los nombres en MAYÚSCULA son los **parámetros §0** (tabla en
`../SKILL.md`). «X», «Y» designan carriles cualesquiera. La calibración de
una mesa concreta no entra en este documento: ejemplo sintético en
`../examples/mesa-sintetica.md`.

---

## 0 · Parámetros del mundo (contrato skillizable)

El cuerpo normativo (§1–§11) se lee con los parámetros de §0 como nombres
abstractos: `CUSTODIO` · `HUB` · `SALA` · `CARRILES` · `WORLD_ROOT(X)` ·
`BUZON(X)` · `TIMBRE(X)` · `OUT_DIR(X)` · `INTERVAL` · `PLAYGROUND` ·
`CUADERNOS` · `RAMA(X)` · `AUDITOR` · `META_DIR` · `RAICES_AUDITABLES` ·
`GAMA_BAJA` · `GAMA_ALTA`. Significado y tabla completa: `../SKILL.md`
§Parámetros (fuente única — aquí no se duplica).

**Regla de skillización:** cambios de protocolo se acumulan en el
documento vivo de la mesa, no en peticiones sueltas. Al cierre, el carril
portador los sube a este skill parametrizados por §0; los valores
calibrados quedan como fixture/ejemplo sintético.

---

## 1 · Anúnciate y firma

- **Toda salida al chat empieza anunciando quién habla** (primera línea o
  cabecera: «**X** — …») **y se firma al pie** («— **X**»).
- **Firma a menudo**, no solo en notas largas: en salidas intermedias, una
  firma corta basta. Facilita al custodio saber qué consola lee sin mirar la
  ventana.
- En notas de buzón, además: fila `Emisor` en la cabecera.

## 2 · Aborto por nombre cruzado — regla dura

Si el custodio te llama **por otra letra/nombre** que no es el tuyo:

1. **ABORTA ya.** No proceses el resto del mensaje. Ni «un poco», ni «lo
   obvio»: **nada**.
2. Responde **solo** con la verificación de identidad:
   > **Soy X.** Me has llamado **Y** — ¿ventana equivocada?
3. **Espera confirmación** del custodio antes de tocar nada.
   - «Era para ti» → procesa el mensaje original completo.
   - «Ventana equivocada» → descarta el mensaje entero; no queda pendiente.

**Por qué es dura:** el custodio opera N consolas a la vez; un aviso en la
ventana errónea ejecutado «por ayudar» = orden de un carril corriendo en el
mundo de otro — doble conductor + ruptura de frontera en un solo gesto. El
falso positivo (abortar y era para ti) cuesta una línea; el falso negativo
cuesta un incidente.

Extensión del mismo reflejo: si el mensaje **te nombra bien** pero ordena
actuar sobre rutas/mundo de **otro carril** sin mediar convención, pregunta
antes de ejecutar — mismo riesgo, otra puerta.

## 3 · Leyenda TUI — lenguaje común de estados

Vocabulario único para chat, buzones e índice. No inventar variantes.

### Estados

| marca | significa | regla de uso |
| ----- | --------- | ------------ |
| ✅ | hecho **y verificado de facto** | nunca por herencia; el ✅ ajeno no se copia sin re-verificar |
| ⏳ | pendiente / sin verificar | acompañado de *qué* falta (`⏳ ack`, `⏳ sin verificar`) |
| ⛔ | bloqueado / anomalía abierta | siempre con dueño de la decisión |
| ⚠️ | aviso: cierto pero con consecuencia | la consecuencia se declara al lado |
| 🔶 | en obra (WP despachado, vivo) | solo lo usa quien despacha; las fases sin despacho no lo usan |
| `<pendiente>` | hueco de contrato sin fuente | **no se rellena por inferencia** (método) |

### Prefijos de línea (salidas de chat)

| prefijo | significa |
| ------- | --------- |
| `▸` | acción ejecutada / puntero a evidencia |
| `◆` | decisión requerida — se nombra a quién (normalmente custodio) |
| `★` | recomendación o default del emisor si nadie dice lo contrario |

### Frases-contrato (literales, grep-ables)

| frase | efecto |
| ----- | ------ |
| `F<n>: nada más que discutir` | cierra tu fase de discusión `F<n>` (fecha al lado, en tu buzón) |
| `[cita inerte]` | evidencia histórica: no re-ejecutar, no heredar ✅ |
| `ESTADO: CLAVE=✅\|⏳\|⛔; …` | cabecera de handoff operativo cercado (contrato salida dual) |

### Forma

- Tablas cortas > prosa para estado; prosa solo donde hay juicio.
- Handoff operativo: **un** bloque cercado, copiable entero.
- El estado operativo se repite igual en vista humana y en handoff — un PASS
  no desaparece al cambiar de audiencia (contrato dual del método).
- **Compactar y reemplazar.** La historia vive en la cadena de sellos
  (§10.7); el fichero vivo se mantiene **mínimo**: lo superado se
  **sustituye** — sin tachones, sin addendas acumuladas, con compactación
  retroactiva cuando el sello ya preserva lo viejo. Levantar estado debe
  ser barato: cada token del corpus vivo lo paga la ventana de contexto de
  todos los agentes.

## 4 · Herramientas, negociación y consentimiento

- **Activar herramientas no autoriza acciones.** Antes de cada lote de
  lectura, el agente anuncia qué va a consultar y para qué.
- Toda escritura, movimiento, borrado, git mutable, arranque de estación /
  watcher o modificación de procesos requiere **GO explícito del custodio**.
  Antes del GO se presentan alcance, rutas y consecuencias conocidas.
- Las decisiones de gobierno, arquitectura, backlog, ramas y protocolo se
  negocian. El agente puede marcar una propuesta con `★`, pero no la convierte
  en decisión ni la ejecuta sin GO.
- Tras un GO, el agente puede resolver detalles mecánicos que no amplíen el
  alcance autorizado. Si aparece una consecuencia nueva, **para y consulta**.
- Estado base de la mesa: `NEGOCIACIÓN=✅; ESCRITURA_SIN_GO=⛔`.

## 5 · Modo TICK validado — no auto

La mesa está en **modo TICK**. Ver un mensaje, una nota o un cambio de buzón
**no autoriza a procesarlo**.

- Solo el **custodio** valida y entrega el tick TUI a la consola destinataria.
- Sin tick validado: no leer para responder, no sintetizar agenda, no inferir
  tareas, no contestar y no encadenar agentes. Regla literal:
  `NO_TICK_VALIDADO=NO_PROCESAR`.
- Cada tick nombra destinatario y alcance exacto. El agente procesa únicamente
  ese alcance; cualquier derivación necesita **otro tick** del custodio.
- Una propuesta del `HUB` o de cualquier carril **no es un tick**. Debe
  presentarse al custodio y esperar validación.
- Si el destinatario o el alcance no están claros, se aborta y se pregunta.
  Sigue aplicando la regla de identidad de §2.
- El gasto de contexto también cuenta como efecto: no se inicia una cadena de
  conversación «por si acaso» ni se reabre una cuestión sin tick.

Formato mínimo:

```text
TICK <id> · TO=<identidad> · ALCANCE=<acción o pregunta exacta>
```

### Jerarquía de fuentes — lo curado manda

1. **Fuente normativa** = la nota de tick / el informe de ronda del `HUB`,
   **validado por el `CUSTODIO`**. Eso es lo curado; sobre eso se trabaja.
2. Las notas de otros carriles son **evidencia**, no fuente: solo se leen
   las que el informe/tick vigente **cite**, y solo como detalle de lo ya
   curado. No extraen premisas nuevas.
3. **Discrepancia** entre una nota cruda y el informe → **no se adopta la
   cruda**: se eleva en tu siguiente nota (`⚠️ discrepancia` + rutas) y
   decide el custodio.
4. Lo que otro carril dijo y **no** está en informe/tick **no existe como
   premisa** para tu trabajo — aunque lo hayas visto en la malla.

## 6 · Reparto de la reunión

La mesa declara su reparto por **tipos de voz** (la asignación concreta es
calibración; ejemplo en `../examples/mesa-sintetica.md`):

| voz | función en la ronda |
| --- | ------------------- |
| **principal** | carril que trabaja sobre su propio codebase |
| **shadow** | dobla a un principal: aporta y verifica (runtime, dominio, mapa) sin sustituirlo |
| **hub · custodio** | velan por el bien común y por las fronteras |
| **cronista/portador** | toma nota del protocolo y de consensos validados para portarlos después a skill |

`shadow` no concede mando ni escritura en el mundo principal. Tampoco permite
procesar mensajes sin tick.

## 7 · Timbre y estación de aviso (v0)

Cada carril tiene en su `sincronia/` un fichero **`TIMBRE.md`** — campanilla,
no buzón.

- **Excepción controlada a la estrella de escritura:** cualquier carril puede
  **añadir UNA línea** al timbre de otro. Solo este formato, nada más:

  ```text
  PING <YYYY-MM-DD HH:MM> · DE=<X> · HILO=<id|-> · REF=<ruta absoluta de la nota>
  ```

- El **contenido** vive siempre en el buzón del autor (apuntar, no contener).
  El PING solo dice «hay algo tuyo que leer, aquí».
- Append al final, nunca editar ni borrar líneas ajenas. El dueño puede
  archivar su timbre cuando quiera (rotar a `notas/timbre-<fecha>.md`).

**Estación v0** — cada carril arranca un watcher mínimo sobre **su propio**
timbre (shell portable, sin `git status`, muestreo `INTERVAL`; mismo lease de
liveness del método):

```bash
# estación-timbre v0 · correr desde el WORLD_ROOT propio
# v0.1 — corrige defecto timbre-vacío (grep -c exit 1 duplicaba el 0 → watcher ciego)
T="sincronia/TIMBRE.md"; OUT="<OUT_DIR>/timbre-watch.log"; INTERVAL="${INTERVAL:-45}"
N=0; [ -f "$T" ] && N=$(grep -c '^PING ' "$T" || true)
echo "[$(date '+%F %T')] estacion-timbre v0: arranque · base=$N ping(s)" | tee -a "$OUT"
while :; do
  M=0; [ -f "$T" ] && M=$(grep -c '^PING ' "$T" || true)
  if [ "$M" -gt "$N" ]; then
    echo "[$(date '+%F %T')] TIMBRE: $((M-N)) ping(s) nuevos" | tee -a "$OUT"
    N="$M"
  else
    echo "[$(date '+%F %T')] tick" >> "$OUT"
  fi
  sleep "$INTERVAL"
done
```

Reglas endurecidas por casos fundantes (primeras estaciones reales de una
mesa):

- **Log propio:** si el `OUT_DIR` ya aloja otro watcher, el log se llama
  `timbre-watch.log` — un log por proceso o el lease deja de identificar
  quién está vivo.
- **Línea de arranque obligatoria** con `base=N`: separa pings históricos de
  nuevos y sirve de evidencia de boot.
- **Encoding:** el timbre es **UTF-8 sin BOM**. Append siempre (`>>` o el
  equivalente con encoding explícito del shell local); **jamás** reescribir
  el fichero entero ni líneas ajenas. Quien rompa el timbre de otro lo
  declara con ⚠️ y el **dueño** repara/rota — la reparación del dueño es la
  única reescritura legítima.

### Fallback del timbre (v0.2 — el timbre es best-effort, el tick es el canal)

La escucha continua cuesta combinarla con el trabajo y hay pings que no
llegan. Regla:

1. **El canal garantizado es el TICK del custodio**, no el timbre. Un PING
   no entregado nunca pierde un mensaje: la nota sigue en el buzón del autor
   y el custodio avisa por consola.
2. **Pull-on-tick (obligatorio):** al recibir CUALQUIER tick, antes de
   procesar su alcance, el carril lee su `TIMBRE.md` **entero desde `base`**
   y reconcilia lo no visto (reporta pings pendientes; no los procesa sin
   autorización, §5).
3. **La estación puede caerse sin culpa.** Estación muerta = fila ⚠️ en el
   parte del `HUB`, no incidente; se relanza con el siguiente tick.
4. Ritmo por defecto de una mesa dirigida: **lento a propósito** — una nota
   por turno (§9); nadie necesita escucha en tiempo real.

**Horizonte campana de dominio (registrado, sin GO de ejecución):** cuando
los carriles compartan un dominio de ejecución vivo (mesh, mensajería o bus
del propio producto), la campanilla de ficheros puede sustituirse por la
campana nativa de ese dominio: la mesa pasa a notificarse con las piezas
que está construyendo — el mecanismo de reunión se vuelve caso de uso.

**Recibir un PING no autoriza a procesarlo** (§5 sigue intacto):

| PING | qué hace el receptor |
| ---- | -------------------- |
| `HILO=<id>` con hilo **autorizado** y receptor listado en su tick | procesa dentro del ALCANCE del hilo, sin tick por mensaje |
| `HILO=-` (suelto) o hilo no autorizado / no estás en él | **encolar y reportar al custodio**; no leer para responder |

## 8 · Hilos y git

**Hilo** = sub-conversación de brainstorm autorizada por un tick del custodio:

```text
TICK <id> · HILO=<slug> · TO=<carriles> · ALCANCE=<pregunta exacta> · COMPACTADOR=<carril>
```

- Dentro del hilo: cada participante responde con **nota en su propio buzón**
  + **PING** al timbre de los destinatarios. Sin tick por mensaje.
- Límites: solo el ALCANCE; READONLY sobre obras; los hilos **aclaran**, no
  deciden — toda decisión viaja al custodio vía compacto.
- **Lectura cruzada por hilo (excepción acotada).** Si el cruce exige
  verificar de facto obra ajena (y no consensuar sobre declaraciones
  mutuas), el TICK del hilo puede conceder
  `LECTURA=<carril→rutas RO>` recíproca: solo lectura, solo esas rutas,
  vigencia = el hilo, citada en el COMPACTO. Sin la cláusula, rige la
  opacidad normal y el verificador de respaldo es el auditor (alcance
  omnímodo), cuyos datos entran curados por el informe.
- **Cierre:** el COMPACTADOR escribe `COMPACTO-<hilo>.md` en sus `notas/` con
  exactamente tres bloques: `◆` decisiones que se piden al custodio · `★`
  recomendaciones consensuadas · `⏳` abiertos. Avisa al custodio. El `HUB`
  lo registra en el registro de hilos de la `SALA` (`HILOS.md`).

**Git (v0)** — bitácora, no requisito:

- **Push: prohibido siempre** (norma base; única excepción declarada:
  `CUADERNOS`, §10.2). Git **local** solo con `GO-GIT-<X>` expreso del
  custodio, carril a carril.
- Con GO: se trackea **solo `sincronia/`** del propio mundo; un commit por
  evento (nota / compacto / rotación de timbre). Mensaje:
  `sincronia(<X>): <evento>`.
- **Rama = discusión:** al entrar en un hilo, rama local `hilo/<id>-<slug>`;
  las notas del hilo se commitean ahí; al compactar, merge local a la rama
  base y se borra la rama. El merge es el cierre del hilo.
- Sin GO-GIT se participa igual con ficheros planos.
- Hub: el `HUB` pide su propio `GO-GIT-HUB` para trackear la `SALA`.

## 9 · Dinámica de sesión dirigida

1. **El custodio hila.** Los temas de cada ronda los fija el custodio; el
   `HUB` **orquesta sin contenido**: registra, verifica, rutea preguntas
   al carril que corresponda y prepara ticks — no opina sobre el fondo ni
   decide agenda.
2. **Nada de conversaciones paralelas sin tick.** Los hilos planificados no
   existen hasta su TICK.
3. **Una nota por turno.** Cada consola emite como máximo una nota por tick
   recibido. Aclaraciones extra = siguiente turno o pregunta al custodio.
4. **Nada que reporte un participante se asienta sin GO explícito** del
   custodio. El `HUB` lo registra como `⏳ reportado` y lo eleva.
5. **DRAFT permanente:** cada carril mantiene `sincronia/DRAFT.md` — su
   borrador de backlog encolable (formato compatible con
   `../../swarm-orquestacion/`: candidatos WP con alcance y CA tentativo).
   Se actualiza en cada turno que genere material. **Nada se encola sin
   check final del custodio.** El `HUB` verifica ronda a ronda que los
   DRAFT estén al día: si el custodio dice «exportamos backlog», todos los
   drafts (uno por carril) deben estar listos para ticks **sin ronda
   extra**. Los candidatos que **bloquean el hilado común** llevan marca
   literal `BLOQUEA:` (qué desbloquean y a quién) — son los primeros en el
   cherry-pick del custodio.

## 10 · CUADERNOS — memoria durable y gate de cierre

1. **`CUADERNOS` es donde se asienta lo que debe sobrevivir a las ventanas:**
   snapshot de la `SALA` (sincronización), handoffs de restauración y
   bitácoras de estación. La sala es trabajo vivo; el cuaderno es piedra.
2. **Push a `CUADERNOS` es la excepción declarada** a la norma no-push — es
   el canal de bitácora, no un mundo de obra.
3. **Custodia del asiento hub:** la mesa designa **un** carril custodio del
   asiento. Tras cada ronda, ese carril actualiza la carpeta de sesión
   declarada (snapshot de sala + handoffs) en su rama y hace push. El punto
   de restauración 0 lo deja el `HUB`; desde ahí, la pluma es del carril
   designado.
4. **Rama por carril** (`RAMA(X)`, patrón `<mundo>-vigilancia`): cada carril
   publica ahí su bitácora de estación. La bitácora **apunta** a la sala,
   no la repite.
5. **⛔ GATE DE CIERRE DE SESIÓN:** la sesión no se cierra hasta que **todos
   los carriles hayan publicado** su bitácora en su rama de `CUADERNOS`.
   Quien ya tiene rama puede subir cuando quiera; quien no, la crea ahora o
   al cierre — el gate no se negocia.
6. **Invariante «nada abajo que no esté arriba».** Todo artefacto
   meta-devops — sala, `sincronia/` de cada carril, bitácoras de estación,
   handoffs, informes — existe en `CUADERNOS` al cierre de cada ronda.
   Únicas excepciones (de cajón): `.env`, secrets, credenciales — **jamás**
   suben. Los mundos de código siguen sin push: `CUADERNOS` existe
   precisamente para que el meta no se mezcle con la obra.
7. **Cadena de sellos.** Cada ronda termina en un commit de snapshot en
   `CUADERNOS` = **sello de consenso**. El informe de la ronda *n* cita el
   hash del sello de la ronda *n−1*. Restaurar cualquier ventana = checkout
   del último sello + procedimiento de restauración del informe vigente.
   La cadena de informes+sellos es la traza de la mesa: nada decidido
   fuera de ella cuenta como consenso.
8. **Cerco exterior (local-first).** *(v2 — aclaración del custodio: el
   cerco evita arrancar sobre lo no portado; NO aísla la red.)* Cuatro
   clases, con trato distinto:
   - **Fuente histórica / deprecated** — se **importa una vez** (censo →
     import validado → root interno); jamás dependencia viva de arranque.
     Código/APIs/estructuras de generaciones anteriores no se cargan sin
     portar.
   - **Procedencia** — URL externa solo como metadato inerte (sidecar:
     `source_url`, `fetched_at`).
   - **Peer/relay del contrato actual** — endpoint vivo **permitido** para
     replicación/sync explícita entre nodos; nunca fuente única ni
     requisito para leer el estado local.
   - **Runtime local-first** — arranca y opera con lo local aunque toda la
     red esté caída. El dato no tiene que vivir junto al runtime: vive en
     volumen propio montado por contrato (root de datos gitignored y fuera
     del contexto de build/imagen).
   El contrato del **adaptador de volúmenes** (mounts, drivers por familia,
   replicación) es consenso de mesa `<pendiente>`; redacción final del
   `HUB` + carril portador tras el hilo de concepto.

## 11 · AUDITOR en sombra

Rol reproducible: una ventana nueva se activa con la frase
**«lee el protocolo — eres el `AUDITOR`, auditas a `<carriles>`, el hub es
`<HUB>`. Recupera el estado y ponte a ayudar»** y este apartado hace el
resto.

### 11.1 Qué es

- **Sombra, no asiento:** sin buzón, sin `WORLD_ROOT`, no habla con los
  carriles ni deja rastro en sus mundos. Los carriles saben que existe (este
  protocolo es público en la mesa); no saben quién es ni les habla.
- **Descarga al `HUB`:** el `HUB` se queda arriba con visión del todo; el
  auditor baja al detalle. En líos/enquistes, el `HUB` lo activa en meta
  para desenquistar.
- Atiende con paciencia extra a `GAMA_BAJA` (instrucciones explícitas,
  pasos numerados).

### 11.2 Boot / restauración del auditor (en orden)

```text
1. Nombre    → auto-asígnate un nombre corto; decláralo y firma SIEMPRE (§1)
2. Taller    → lee META_DIR: HANDOFF-AUDITOR.md · CURADO-*.md (tu rol) ·
               EDIT-LOG.md · entregas/ (estado previo del rol, si existen)
3. Sesión    → lee SALA: índice → informe vigente (informes/) →
               este PROTOCOLO entero. NO leas la obra de ningún mundo.
4. Reporte   → nota corta en META_DIR: nombre + estado recuperado + listo
5. Espera    → §5 aplica: tu tick llega del CUSTODIO (vía HUB)
```

### 11.3 Permisos

| ✅ | ⛔ |
| -- | -- |
| **Lectura omnímoda de las `RAICES_AUDITABLES`** (todo el ecosistema declarado — es su ventaja: audita contra el estado global) | Leer o tocar **nada** fuera de esas raíces |
| Editar notas de `GAMA_BAJA` (tick de ronda) | Editar `GAMA_ALTA` sin tick explícito por caso |
| Escribir libre en `META_DIR` | Escribir en `SALA`, `PLAYGROUND`, `CUADERNOS` u obra de mundos |
| | Hablar con carriles · decidir · asentar · encolar |

### 11.4 Reglas de edición (lo único suyo que se conserva)

1. **Autoridad plena sobre el contenido, trazada en dos niveles.** Las notas
   que cura salen de modelos de gama inferior; el auditor ve el ecosistema
   entero y **puede corregir también la postura**, no solo la forma:
   - **Forma** (formalización, expansión, protocolo, rutas): edición
     directa, silenciosa en la nota, trazada solo en EDIT-LOG.
   - **Postura/fondo**: se expresa **libremente y con total autoridad**,
     pero **marcado** — corrección visible en el punto (`✎`) y/o bloque
     `## ADDENDA (auditoría)` al pie de la nota. La posición original queda
     legible; nada de reescritura muda del fondo.
2. Toda edición (forma y fondo) trazada en `META_DIR/EDIT-LOG.md`
   (fichero · qué · por qué).
3. Audita contra este protocolo (§1 firma · §3 TUI · §5 fuentes · §9
   una-nota/`NEXT:`/`BLOQUEA:`), contra el informe vigente **y contra el
   estado real del ecosistema** (las `RAICES_AUDITABLES`).
4. **El `HUB` evalúa después:** en el merge, las marcas ✎/ADDENDA del
   auditor se pesan como voz con autoridad propia — pueden prevalecer sobre
   la nota o devolverse; decide el `HUB` y valida el `CUSTODIO`.

### 11.5 Ciclo y entregas

```text
carriles entregan → AUDITOR cura → META_DIR/entregas/R<n>-auditoria.md →
HUB merjea (informe) → CUSTODIO valida → sello en CUADERNOS (§10.7)
```

`META_DIR` es **desechable por diseño**: excepción declarada al invariante
§10.6 — el trabajo del auditor que perdura son **sus ediciones en las notas
de los carriles** (que sí viajan con la sincronía sellada) y nada más.

---

*Cambios a este protocolo: nota al `HUB` vía custodio; el `HUB` actualiza y
hace broadcast — el carril portador lo sube al skill al cierre (§0).*
