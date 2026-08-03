# vigilancia

Skill de protocolo: vigilancia read-only de un swarm parametrizado por
«el mundo». Activar desde el paquete; calibrar `WORLD_ROOT`,
`CANONICAL_WORLD_ROOT`, `READ_ONLY_ROOTS`, `DOWNSTREAM_PATTERNS` y `OUT_DIR`
(y opcionalmente `SIBLING_ROOT`) en el consumidor. El preflight de identidad
es fail-closed y precede cualquier efecto.

Cubre pulso clásico (worktrees, locks, CI) y **pulso multi-carril**:
etiquetas `Rn-<carril>`, higiene §8 pre-despacho, freeze por
`index.lock` sostenido, pulso idle para candidatos retroactivos y addendas
duales que no mezclan carriles. Doctrina:
`reference/ESTACION.md`. Formato de elevación:
`reference/ADDENDA-DOS-CARAS.md`.

Datos de sesión (bitácoras, logs, addendas reales) → `instancias/` o
calibración local. Este directorio solo lleva método + fixture sintética.

Corpus público de-identificado: `instancias/ejemplo-M/` (parámetro «M»).
Doctrina de costuras del swarm: skill `swarm-orquestacion` →
`reference/RE-PLAN-protocolo-swarm.md`.

Ceguera del skill: `scripts/comprobar-ceguera.sh` → `ceguera: 0`.

Gates locales:

```bash
node skills/vigilancia/scripts/probar-identidad-raiz.mjs
node skills/vigilancia/scripts/probar-salida-dual.mjs
node skills/vigilancia/scripts/verificar-dedup-contratos.mjs
node skills/vigilancia/scripts/probar-dedup-contratos.mjs
```

Consumo canónico (versión fijada + dedup + C8): README raíz del paquete o
`skills.s-sdk.escrivivir.co/guide/consumo`.
