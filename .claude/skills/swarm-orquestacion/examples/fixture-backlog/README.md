# fixture-backlog — las cuatro caras del BACKLOG despachable

Fixture **sintética** del linter `../../scripts/verificar-backlog.mjs`. Serie
inventada `FX-[A-Z]\d{2}`, lanes `ALFA` / `BETA`. Ningún dato de mundo real.

Contrato y doctrina: `../../reference/backlog-despachable.md`.
Veredicto esperado de cada fichero: `casos.json` (recuento **exacto** de
defectos bloqueantes y de avisos + citas obligatorias del mensaje). La suite
`../../scripts/verificar-backlog.test.mjs` ejecuta esa tabla contra el linter.

28 fixtures. Cuatro caras, porque el veredicto tiene cuatro formas: **pasa** (exit 0),
**pasa con avisos** (exit 0 + CA ornamental citado), **cae por un defecto
decidible** (exit 1) y **cae por ausencia** (exit 3).

## Cara que pasa (exit 0)

| fichero | por qué pasa |
| ------- | ------------ |
| `backlog-valido.md` | 4 WPs, 2 lanes, los siete campos, deps sin ciclos, CA con ancla y objeto |
| `backlog-dep-enlace.md` | deps escritas como enlace markdown resuelven; CA de negación universal («ninguna referencia queda…») es verificable |
| `backlog-deps-prosa.md` | `deps` en prosa: «FX-A01 y FX-A03», «Ninguna.», «(ambas de la ola 1)», enlaces |
| `backlog-fence-anidado.md` | fence de 4 backticks con uno de 3 dentro: el backlog real de después **sí** se lintea |
| `backlog-region-declarada.md` | región declarada (`--region-inicio`/`--region-fin`): lo de fuera se ignora por construcción |

## Cara del AVISO (exit 0, pero informa)

| fichero | avisos | exit |
| ------- | ------ | ---- |
| `backlog-ca-ornamental.md` | `valoracion` ×3 · `sin-ancla` · `sin-objeto` | **0** |

La calidad del CA es juicio: se cita con su motivo y su texto literal, pero no
decide el despacho. Un gate que rechaza CAs correctos acaba desactivado.

## Cara que cae (exit 1 — cada una por SU motivo)

| fichero | motivo bloqueante |
| ------- | ----------------- |
| `backlog-ciclo-corto.md` | `dep-ciclo` (A → B → A) |
| `backlog-ciclo-largo.md` | `dep-ciclo` (A → B → C → A) |
| `backlog-campo-ausente.md` | `campo-ausente` (celda vacía, `—`, `?`) |
| `backlog-prioridad-invalida.md` | `prioridad-invalida` (`P3`, `alta`) |
| `backlog-suelo-minimo.md` | `brief-insuficiente` + `ca-insuficiente` (palabras repetidas) |
| `backlog-contradicciones.md` | `deps-contradictorias` + `ejes-contradictorios` |
| `backlog-deps-sin-declarar.md` | `deps-no-declaradas`: prosa que no dice de qué depende |
| `backlog-serie-no-declarada.md` | `serie-no-declarada` (filas ajenas no se omiten) |
| `backlog-id-duplicado.md` | `id-duplicado` |
| `backlog-dep-inexistente.md` | `dep-inexistente` |
| `backlog-fila-fuera-de-tabla.md` | `fila-fuera-de-tabla-wp` (WP colado fuera del lint) |
| `backlog-columna-ausente.md` | `columna-requerida-ausente` (`deps`, `ejes`) |
| `backlog-sin-lane.md` | `columna-requerida-ausente` (`lane`) |

## Cara de la AUSENCIA (exit 3 — lo que calla, no lo malformado)

| fichero | causa |
| ------- | ----- |
| `backlog-vacio.md` | fichero de 0 bytes |
| `backlog-sin-wps.md` | prosa; ninguna tabla con columna de WP |
| `backlog-tabla-sin-filas.md` | cabecera y separador, sin filas |
| `backlog-lista-sin-tabla.md` | formato de lista, no despachable |
| `backlog-tabla-indentada.md` | tabla en bloque indentado (4 espacios) |
| `backlog-tabla-en-cita.md` | tabla dentro de una cita `>` |
| `backlog-fence-tilde.md` | `~~~` no cierra un fence de backticks (regla de CommonMark) |
| `backlog-envolturas-html.md` | front-matter, `<pre>`, `<details>` y 3 espacios + tabulador |
| `backlog-details-inline.md` | `<details><summary>` y `<div align>` que abren y siguen en la misma línea |

Ninguno de estos nueve es «verde por vacío»: un backlog que lintea a cero jamás
es despachable, y el diagnóstico dice la **causa** (`fence=`, `comentario=`,
`indentado=`, `cita=`) en vez de afirmar que no había ninguna tabla.

## Reproducir a mano

```bash
node ../../scripts/verificar-backlog.mjs \
  --backlog backlog-ca-ornamental.md --series 'FX-[A-Z][0-9]{2}'
```
