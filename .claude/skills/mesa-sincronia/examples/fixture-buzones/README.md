# Fixture — buzones y notas materializados (hub + 2 mundos)

Ficheros **reales** (no narrados) del ciclo de
[`../ciclo-nota-tick-informe.md`](../ciclo-nota-tick-informe.md), sobre la
calibración de [`../mesa-sintetica.md`](../mesa-sintetica.md): hub
**Faro**, carriles **NOR** y **SUR**. Todo es sintético — nombres, rutas,
fechas, hashes y contenidos inventados; no existe mesa real detrás.

Estado congelado: **final de la ronda R2**, tras validarse el informe y
antes del sello. Cada subcarpeta refleja el layout sintético `/mundos/…`:

```text
faro/sala/TIMBRE.md      # timbre del hub: 2 PINGs ajenos (NOR y SUR)
nor/sincronia/           # BUZON(NOR): buzón + timbre + draft + notas
sur/sincronia/           # BUZON(SUR): ídem, con 1 ping ajeno encolado
```

## Qué muestra cada pieza

| pieza | regla visible |
| ----- | ------------- |
| `nor/sincronia/BUZON.md` | puntero: datos + «Vigente» de 1 fila; la presentación ya **archivada** (compactar-y-reemplazar, BUZON-Y-NOTAS §6) |
| `nor/sincronia/notas/archivo/` | historia local con README de doctrina; la fila salió de «Vigente» sin tachones |
| `sur/sincronia/BUZON.md` | mismo puntero desde otro dueño |
| `faro/sala/TIMBRE.md` | **única excepción** a un-buzón-un-dueño: líneas `PING` ajenas (append de una línea, §7) |
| `sur/sincronia/TIMBRE.md` | ping ajeno `HILO=espejo-4` no autorizado: SUR lo **reporta sin procesar** (su nota, ⏳) |
| `nor/sincronia/DRAFT.md` · `sur/sincronia/DRAFT.md` | §9.5: draft encolable siempre presente, aun vacío |

## Un buzón, un dueño

Cada `sincronia/` lo escribe **solo** su fila `Dueño`. En todo el fixture
la única letra ajena dentro del territorio de otro son las líneas
`PING … · DE=<otro>` de los timbres — la excepción exacta de
`../../reference/BUZON-Y-NOTAS.md` §3. No hay ninguna otra: ni notas, ni
buzones, ni drafts tocados por terceros.
