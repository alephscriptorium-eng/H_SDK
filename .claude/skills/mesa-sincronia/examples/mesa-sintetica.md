# Fixture — mesa sintética mínima (§0 relleno)

Mundo **inventado** para calibrar el skill: un hub («Faro»), dos carriles
(«NOR» y «SUR») y un auditor. Todos los nombres, rutas, fechas y hashes de
este directorio son sintéticos; no existe ninguna mesa real detrás. Sirve
como plantilla de la columna «calibración» que cada mesa rellena para sí.

## §0 calibrado (ejemplo)

| parámetro | rol | calibración sintética |
| --------- | --- | --------------------- |
| `CUSTODIO` | humano que valida ticks y da GO | la persona al teclado de las consolas (no firma ficheros) |
| `HUB` | sesión neutra: sala, índice, protocolo | **Faro** · `/mundos/faro` |
| `SALA` | carpeta de sincronía del hub | `/mundos/faro/sala/` |
| `CARRILES` | consolas con mundo propio | NOR · SUR |
| `WORLD_ROOT(NOR)` | raíz del mundo de NOR | `/mundos/nor` |
| `WORLD_ROOT(SUR)` | raíz del mundo de SUR | `/mundos/sur` |
| `BUZON(X)` | puntero + notas del carril | `<WORLD_ROOT(X)>/sincronia/` |
| `TIMBRE(X)` | campanilla append-only | `<WORLD_ROOT(X)>/sincronia/TIMBRE.md` |
| `OUT_DIR(NOR)` | estación/bitácora de NOR | `/mundos/nor/estacion/` |
| `OUT_DIR(SUR)` | estación/bitácora de SUR | `/mundos/sur/estacion/` |
| `INTERVAL` | muestreo del watcher | 45 s |
| `PLAYGROUND` | terreno común de pruebas | `/mundos/faro/playground/` |
| `CUADERNOS` | repo git durable de bitácoras | remoto `git.ejemplo:mesa/cuadernos-demo.git` · worktrees en `/mundos/_fuentes/` |
| `RAMA(NOR)` | canal de NOR en `CUADERNOS` | `nor-vigilancia` |
| `RAMA(SUR)` | canal de SUR en `CUADERNOS` | `sur-vigilancia` |
| `AUDITOR` | consola en sombra | se auto-asigna nombre al boot (aquí: **Bruma**) |
| `META_DIR` | taller del auditor (sin git, desechable) | `/mundos/_meta/` |
| `RAICES_AUDITABLES` | lectura omnímoda del auditor | `/mundos` |
| `GAMA_BAJA` | notas editables por el auditor en tick de ronda | NOR |
| `GAMA_ALTA` | edición solo con tick explícito por caso | SUR |

## Reparto de la reunión (§6, ejemplo)

| voz | asignación sintética |
| --- | -------------------- |
| principal | NOR (sobre `/mundos/nor`) |
| shadow de NOR | SUR (verifica runtime; no escribe en `/mundos/nor`) |
| hub · custodio | Faro + la persona al teclado |
| cronista/portador | SUR (acumula consensos para skillizar) |

## Layout resultante (sintético)

```text
/mundos/
  faro/               # HUB
    sala/             # SALA: INDICE.md · HILOS.md · informes/ · TIMBRE.md
    playground/       # PLAYGROUND
  nor/                # WORLD_ROOT(NOR)
    sincronia/        # BUZON(NOR): DRAFT.md · TIMBRE.md · notas/
    estacion/         # OUT_DIR(NOR): timbre-watch.log · bitácora
  sur/                # WORLD_ROOT(SUR)
    sincronia/
    estacion/
  _fuentes/           # worktrees locales de CUADERNOS (rama por carril)
  _meta/              # META_DIR del auditor — fuera de SALA, sin git
```

Ciclo completo de ejemplo sobre esta calibración:
[`ciclo-nota-tick-informe.md`](ciclo-nota-tick-informe.md).
