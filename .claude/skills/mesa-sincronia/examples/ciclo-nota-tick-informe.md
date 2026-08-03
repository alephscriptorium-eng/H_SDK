# Ciclo de ejemplo — nota → tick → informe (datos sintéticos)

Sobre la calibración de [`mesa-sintetica.md`](mesa-sintetica.md). Fechas,
hashes y contenidos inventados; el objetivo es ver el protocolo entero en
un caso pequeño. Los ficheros de este ciclo, materializados:
[`fixture-buzones/`](fixture-buzones/README.md).

## 1 · NOR emite una nota (§1 + §7)

NOR termina un censo local y escribe en su buzón
`/mundos/nor/sincronia/notas/NOTA-NOR-2030-01-05-censo-piezas.md`:

```markdown
| Emisor | NOR |
| Fecha  | 2030-01-05 |

**NOR** — censo de piezas del mundo propio.

▸ censo: 12 piezas, 2 sin dueño (tabla abajo)
◆ custodio: ¿las 2 piezas sin dueño pasan a DRAFT como candidatos WP?
★ default: encolarlas como P2 si nadie dice lo contrario

— **NOR**
```

Y añade **una línea** al timbre del hub (`/mundos/faro/sala/TIMBRE.md`):

```text
PING 2030-01-05 10:12 · DE=NOR · HILO=- · REF=/mundos/nor/sincronia/notas/NOTA-NOR-2030-01-05-censo-piezas.md
```

La estación de Faro registra en su log: `TIMBRE: 1 ping(s) nuevos`.
**Nadie procesa nada todavía** (§5): el PING solo avisa.

## 2 · El custodio valida y entrega el tick (§5)

Faro eleva el ping al custodio en su parte de ronda. El custodio decide que
SUR debe contrastar el censo y entrega en la consola de SUR:

```text
TICK 7 · TO=SUR · ALCANCE=leer la nota de NOR NOTA-NOR-2030-01-05-censo-piezas.md y contrastar el conteo con tu vista de runtime; una nota de respuesta
```

## 3 · SUR procesa (pull-on-tick §7.2 + una nota por turno §9.3)

Antes de tocar el alcance, SUR lee su propio `TIMBRE.md` entero desde
`base`: encuentra 1 ping pendiente de un hilo no autorizado → **lo reporta,
no lo procesa**. Después ejecuta el alcance y responde en su buzón
`/mundos/sur/sincronia/notas/NOTA-SUR-2030-01-05-contraste-censo.md`:

```markdown
| Emisor | SUR |
| Fecha  | 2030-01-05 |

**SUR** — contraste del censo de NOR (TICK 7).

▸ contraste: 12/12 piezas confirmadas en runtime
⚠️ discrepancia: NOR lista 2 sin dueño; en runtime una ya tiene proceso vivo
⏳ pendiente: ping HILO=espejo-4 en mi timbre — no autorizado, queda encolado

— **SUR**
```

...y un PING al timbre del hub apuntando a esa nota.

## 4 · Faro compone el informe de ronda (§5.1 + §10.7)

Faro escribe `/mundos/faro/sala/informes/R2-informe.md` **citando el sello
previo** de `CUADERNOS` (ronda R1: `aaa1111`):

```markdown
# R2 · informe de ronda (sello previo: aaa1111)

| ítem | estado |
| ---- | ------ |
| censo NOR | ⏳ reportado — 12 piezas, discrepancia en 1 |
| decisión piezas sin dueño | ◆ custodio |

ESTADO: RONDA=✅; TIMBRES=✅; DRAFTS=⏳ NOR; SELLO=⏳ push
```

El informe es **lo curado**: desde ahora, la nota cruda de NOR solo se lee
como detalle de lo que el informe cita (§5, jerarquía de fuentes).

## 5 · Validación y sello (§10)

1. El custodio valida el informe (GO).
2. El carril custodio del asiento (aquí NOR) actualiza la carpeta de sesión
   en su worktree de `/mundos/_fuentes/` y hace push a su rama
   `nor-vigilancia` de `CUADERNOS`.
3. Commit de snapshot = **sello de consenso** de R2: `bbb2222`. El informe
   de R3 citará `bbb2222` en su cabecera.
4. Gate de cierre (§10.5): la sesión no se cierra hasta que NOR **y** SUR
   tengan bitácora publicada en su rama.

## 6 · Variante con auditor (§11, opcional)

Si la mesa activa a **Bruma**: tras el paso 3, Bruma cura la nota de NOR
(`GAMA_BAJA`, tick de ronda) — corrige rutas en silencio (EDIT-LOG) y deja
una corrección de fondo marcada:

```markdown
✎ (auditoría) el conteo omite la pieza archivada en /mundos/nor/attic/ —
propongo 13, no 12.
```

Entrega `/mundos/_meta/entregas/R2-auditoria.md`; Faro merjea, el custodio
valida, y el sello de R2 viaja con la nota ya curada. `META_DIR` puede
borrarse entero después: lo que perdura son las ediciones en las notas.
