# WP-`id` · `slug` — reporte

| dato | valor |
| ---- | ----- |
| agente | _(identificador)_ |
| fecha | _(YYYY-MM-DD)_ |
| rama | `wp/<id>-<slug>` |
| commits | _(hashes)_ |
| eje(s) CA | _(I–V o ninguno)_ |
| riesgo de revisión | `normal` / `independiente` |
| revisor distinto del worker | `no requerido` / `sí` / `⏳ sin verificar` |
| estado propuesto | listo para revisión / bloqueado / devuelto-corregido |

## Qué se hizo

_(3–8 líneas, hechos en pasado. Desviaciones del WP: decirlas ANTES de nada.)_

## Archivos tocados

_(una línea por archivo: creado/modificado/borrado + para qué)_

## Evidencia

> No inventes observaciones. Salida literal o `⏳ sin verificar`.

```
(comandos ejecutados y salida relevante: gates, validadores, ejes)
```

## Evidencia de riesgo y contrarrevisión

- `CASOS_ADVERSARIALES`:
  - `[automatizado | manual | sin verificar]` _(caso, comando o inspección y
    resultado literal)_
- `DEPENDENCIAS_DIRECTAS_VERIFICADAS`: _(dependencias runtime comprobadas; si
  usa solo built-ins o no aplica, evidenciarlo)_
- `INSTALACION_LIMPIA`: _(comando + resultado, `no aplica` justificado o
  `⏳ sin verificar`)_
- `TEST_AUTOMATIZADO_VS_EVIDENCIA_MANUAL`:
  - Automatizado: _(probes repetibles ejecutados)_
  - Manual: _(inspecciones manuales, sin llamarlas tests)_
- `VEREDICTO_REVISOR`: `PASS` / `DEVUELTO` / `no requerido` /
  `⏳ pendiente de revisor distinto`

Para riesgo `independiente`, el worker deja el veredicto pendiente. El revisor
read-only entrega el resultado al orquestador sin editar esta rama; `PASS` no
equivale a aceptación. Protocolo:
`skills/swarm-orquestacion/reference/revision-adversarial.md`.

## Auto-revisión (PRACTICAS del mundo — con honestidad)

- [ ] Diff solo dentro de `ALCANCE_DIFF`: …
- [ ] Cero árboles/ficheros copiados de otros mundos sin procedencia: …
- [ ] Sellos con fuente; rutas citadas existentes: …
- [ ] Sin fluff ni promesa de futuro sin `<pendiente>`: …
- [ ] Eje(s) aplicables evidenciado(s): …
- [ ] Gates ejecutados de verdad: …
- [ ] Commits convencionales: …
- [ ] Diff solo del alcance del WP: …
- [ ] Riesgo y contraevidencia del brief cubiertos: …
- [ ] Pruebas automatizadas separadas de evidencia manual: …

## Hallazgos fuera de alcance

_(candidatos a WP; NO se arreglaron aquí)_

## Dudas / bloqueos

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con lista numerada)_
