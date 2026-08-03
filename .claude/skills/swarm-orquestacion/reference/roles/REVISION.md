# Rol: revisión de entregable

Modo **revisión**, sin reimplementar. Hay dos intervenciones distintas:

- **revisión ordinaria del orquestador**: acepta (✅) o devuelve;
- **contrarrevisión adversarial independiente**: un revisor distinto del
  worker intenta refutar los CA, opera read-only y emite `PASS` o devolución
  numerada; no acepta ni mergea.

El brief declara `RIESGO_REVISION`. La contrarrevisión solo es obligatoria si
su valor es `independiente`; un WP `normal` continúa con revisión ordinaria.
Contrato de selección y protocolo: `../revision-adversarial.md`.

## Entrada esperada

- El reporte `plan/REPORTES/WP-<id>-<slug>.md` (en la rama del WP)
- La rama `wp/<id>-<slug>`
- El brief con riesgo, motivo, contraevidencia y requisito de identidad
- La rama principal o base de comparación

Si falta el reporte, pídelo antes de revisar nada.

## Procedimiento común

1. Lee el reporte completo (auto-revisión, evidencia, hallazgos).
2. Lee el WP en `plan/BACKLOG.md` — su CA y el **eje** aplicable.
3. Inspecciona el diff (`git diff <rama-principal>...<rama>`). Alcance
   acotado; nada fuera de `ALCANCE_DIFF`.
4. Verifica cada CA con la evidencia (o reproduce comandos).
5. Comprueba PRACTICAS y el eje correspondiente (`ejes-ca`).
6. Comprueba que pruebas automatizadas y evidencia manual están separadas; lo
   no reproducido permanece `⏳ sin verificar`.

## Si actúas como contrarrevisor independiente

1. Verifica que no eres el worker y que el riesgo declarado es
   `independiente`.
2. Intenta refutar cada CA con `CONTRAEVIDENCIA_REQUERIDA`, incluidos casos
   inválidos y falsos negativos cuando correspondan. En WPs de **validación /
   autorización / frontera de confianza**, impone lo que **el hostil omite**
   (`../ejes-ca.md` §Hostil-omite): probá SIEMPRE la **ausencia** —campo
   omitido, flag apagado, firma **no aportada**, opt-in no activado—, no solo
   el envío malformado; el default de lo ausente debe **denegar**.
3. No escribas en la rama ni en el reporte. No edites BACKLOG, no aceptes y no
   hagas merge.
4. Devuelve al orquestador un veredicto copiable:

```text
VEREDICTO_REVISOR: PASS | DEVUELTO
CASOS_ADVERSARIALES:
- [automatizado | manual | sin verificar] caso — comando/evidencia — resultado
DEVOLUCIONES:
1. (solo si DEVUELTO; defecto reproducible o evidencia faltante)
```

`PASS` significa que los casos ejecutados no refutaron los CA; no significa
aceptación.

## Si actúas como orquestador

1. Para riesgo `independiente`, exige antes un `VEREDICTO_REVISOR: PASS` de
   identidad distinta. Una devolución numerada vuelve al mismo worker.
2. Rellena `§ Revisión del orquestador` en el reporte: **Aceptado ✅** (qué
   verificaste + orden de merge) o **Devuelto** (correcciones numeradas).
3. Si aceptado: BACKLOG 🔶→✅ en la rama principal; merge; `git worktree
   remove` si aplica.

## Devolución automática si

- Sin reporte o auto-revisión deshonesta; evidencia inventada
- Diff fuera de `ALCANCE_DIFF`
- Árbol o fichero copiado de otro mundo sin procedencia
- Sello sin fuente; ruta citada que no existe
- CA o eje incumplido
- WP de frontera de confianza que solo probó el envío malformado y **no** la
  ausencia (campo omitido, firma no aportada, opt-in off) — Eje hostil-omite
- Riesgo `independiente` sin los cuatro campos, sin revisor distinto o sin
  `PASS` previo
- Casos manuales presentados como pruebas automatizadas

## Formato de respuesta del orquestador

```text
## Veredicto: Aceptado ✅ | Devuelto

### CA
- [ ] CA-1: …

### Eje aplicable
- [ ] Eje …: …

### PRACTICAS
- …

### Merge
(rama, veredicto, orden)

### Acción siguiente
(si devuelto: mismo chat worker + CORRECCION.md + comentarios del reporte)
```
