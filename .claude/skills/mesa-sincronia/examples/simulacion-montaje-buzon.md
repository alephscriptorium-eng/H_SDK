# Simulación documentada — montaje de buzón solo con el skill

**CA de la capa operativa:** un agente fresco (o simulación documentada)
monta el buzón de un carril nuevo **solo** con este skill
(`reference/BUZON-Y-NOTAS.md` §7 + `reference/plantillas/`), sin leer el
contrato entero ni ningún mundo real. La verificación con **agente fresco
real** es un CA aparte: pendiente, lo declara el backlog del consumidor.

## Entrada (sintética)

Sobre la mesa de [`mesa-sintetica.md`](mesa-sintetica.md): el custodio da
de alta un tercer carril **ESTE**. Datos de entrada (tabla «entrada
necesaria» de BUZON-Y-NOTAS §7):

| dato | valor sintético |
| ---- | --------------- |
| identidad | ESTE |
| `WORLD_ROOT(ESTE)` | `/mundos/este` |
| `OUT_DIR(ESTE)` | `/mundos/este/estacion/` |
| timbre de la `SALA` | `/mundos/faro/sala/TIMBRE.md` |
| tick de alta | `TICK 9 · TO=ESTE` |

## Corrida — cada paso con la instrucción que lo dicta

| paso | instrucción citada | acción ejecutada | resultado |
| ---- | ------------------ | ---------------- | --------- |
| 1 | §7.1 «Crear el árbol — mkdir de `sincronia/`, `sincronia/notas/` y `sincronia/notas/archivo/`» | 3 mkdir bajo `/mundos/este` | árbol de §1 |
| 2 | §7.2 «Materializar `BUZON.md` desde `plantillas/BUZON.md.tpl`: sustituir todos los `<…>`; `Informe` = `-` y `Watchers` = `parados`; Vigente nace vacía» | plantilla + 5 sustituciones | `BUZON.md` sin `<…>` |
| 3 | §7.3 «Materializar `TIMBRE.md` desde `plantillas/TIMBRE.md.tpl`» | plantilla + 2 sustituciones | formato citado indentado → 0 pings |
| 4 | §7.4 «Crear `DRAFT.md` (§9.5): cabecera con dueño y fecha + `## Candidatos` y `## BLOQUEA:` vacías, y firma» + forma de referencia del fixture | fichero según la forma | draft vacío válido |
| 5 | §7.5 «Sembrar `notas/archivo/README.md` con la doctrina de §6.3» | 2 líneas de doctrina | archivo ≠ fuente |
| 6 | §7.6 «Primera nota — presentación desde `plantillas/NOTA.md.tpl`: `Tick` = tick de alta, `REF` = `-` … fila en Vigente en el mismo turno» | `notas/NOTA-ESTE-…-presentacion.md` + fila (forma de fila: la de la plantilla del buzón) | correo visible |
| 7 | §7.7 «Primer PING — una línea al timbre de la `SALA` … ruta absoluta … con `/`» | append de 1 línea a `/mundos/faro/sala/TIMBRE.md` | aviso publicado |
| 8 | §7.8 checklist de verificación (6 puntos) | 6 comprobaciones | 6/6 PASS |

## Árbol resultante

```text
/mundos/este/sincronia/
  BUZON.md
  DRAFT.md
  TIMBRE.md
  notas/NOTA-ESTE-2030-01-06-presentacion.md
  notas/archivo/README.md
```

Fuera de `sincronia/` el montaje solo tocó **una línea** ajena: el PING en
el timbre de la `SALA` (la única excepción de §3).

## Huecos encontrados — y corregidos en el skill

La función del ejercicio: donde el skill no alcanzó para ejecutar un paso,
se corrigió el skill (no la corrida).

| hueco | síntoma en la corrida | corrección aplicada |
| ----- | --------------------- | ------------------- |
| H1 | §7.3 decía «materializar desde el bloque-forma del contrato §7», pero §7 solo da el formato `PING` y reglas — no la forma del fichero; un fresco podía citar el ejemplo **sin indentar** y falsear la `base` del watcher | nueva `plantillas/TIMBRE.md.tpl` (formato citado ya indentado) + §7.3 reescrito para materializar desde ella |
| H2 | §7.4 daba el `DRAFT.md` solo en prosa (sin título ni firma) | §7.4 ampliado (firma) + puntero a forma de referencia en `fixture-buzones/` |

## Criterio de éxito

- Cada paso ejecutado cita la instrucción exacta del skill que lo dicta —
  cero pasos «de memoria».
- Checklist §7.8 completo: árbol, sin placeholders, `grep -c '^PING '`
  del timbre propio = 0, fila «Vigente» con enlace resoluble, PING en la
  `SALA`, nada más escrito fuera del propio `sincronia/`.
- No hizo falta consultar datos de ninguna mesa real.

La salida literal de la corrida vive en el reporte del WP que publica esta
capa (no en el skill: evita acoplar evidencia de sesión al método).
