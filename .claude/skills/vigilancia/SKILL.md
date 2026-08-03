---
name: vigilancia
description: >-
  Protocolo de vigilancia read-only sobre un swarm en «el mundo»: pulso de
  worktrees/locks/CI, pulso multi-carril (Rn-<carril>, index.lock, higiene
  §8), clases de huérfano, C8/C8-ampliado, CA-por-clase, addenda dos caras
  con prueba de ceguera, pulso idle/fixes retroactivos, salida dual y watcher
  con identidad fail-closed (WORLD_ROOT, CANONICAL_WORLD_ROOT,
  READ_ONLY_ROOTS, DOWNSTREAM_PATTERNS, OUT_DIR, INTERVAL). Sin datos de
  instancia.
---

# Vigilancia

Método para vigilar un swarm **en el mundo** (parámetro: raíz del repo
vigilado + directorio de salida). Read-only sobre el mundo. Protocolo ≠
datos: las bitácoras, logs y addendas reales viven en la calibración /
`instancias/` del consumidor, nunca aquí.

## Cuándo aplicar

Cuando un agente deba:

1. Mantener pulso read-only de worktrees, locks y CI del mundo.
2. Pulsar **multi-carril** (etiquetas `Rn-<carril>`, higiene §8,
   freeze por `index.lock`) sin mezclar addendas entre carriles.
3. Clasificar huérfanos y elevar solo anomalías reales.
4. Elevar **residuo de info** en carpetas de IDE (markdowns/notas de
   sesión bajo `.claude`/`.cursor`/…; regla 15 del swarm). La config
   funcional no es residuo.
5. Emitir addendas dos caras (§interna / §WP) con prueba de ceguera.
6. Re-verificar CAs de facto tras merge (nunca fiarse del ✅ del reporte).
7. Pulsar **territorio == mapa** cuando existan `plan/MAPA-*.md`
   (`scripts/verificar-territorio-mapa.sh`; ver `ESTACION.md`).
8. Recoger en idle residuos de gates y candidatos retroactivos, y elevarlos
   sin editar backlog ni abrir trabajo.

## Parámetros («el mundo»)

| param | rol |
| ----- | --- |
| `WORLD_ROOT` | Raíz candidata del repo git vigilado (un root por proceso) |
| `CANONICAL_WORLD_ROOT` | Clone de trabajo canónico esperado |
| `READ_ONLY_ROOTS` | Array JSON explícito de raíces solo-lectura |
| `DOWNSTREAM_PATTERNS` | Array JSON de patrones por segmentos, calibrado por el consumidor |
| `OUT_DIR` | Carpeta de logs/estado del vigía (fuera o dentro del mundo, a elección del consumidor) |
| `INTERVAL` | Segundos entre muestras del watcher (default 45) |
| `SIBLING_ROOT` | (opcional) segundo root hermano solo-lectura; pulso de locks/worktrees con prefijo `sibling:` en el mismo `OUT_DIR` |

Calibración local opcional: rutas de colas del orquestador, vocabulario
prohibido para la cara pública, canal de CI (`gh` u otro), mapa
carril→root, y `plan/ESTACION.md` como nota de frontera local.

Doctrina multi-carril y supuestos de convivencia (shape del skill de
orquestación): `reference/ESTACION.md`.

## Pasos

1. Leer `reference/ESTACION.md` (identidad + protocolo + pulsos).
2. Ejecutar el preflight canónico de identidad. LOCK antecede todo mkdir,
   escritura, watcher, git mutable, plan, rama o worktree.
3. Arrancar `scripts/watcher.sh` con las seis entradas obligatorias
   (y `SIBLING_ROOT` si hay territorio hermano). El watcher repite el
   preflight antes de crear `OUT_DIR`.
4. Ciclo: detectar → verificar → addenda dos caras con `Rn-<carril>`
   (`reference/ADDENDA-DOS-CARAS.md`) → custodio media → orquestador
   decide → WP → merge → **re-verificar CA de facto**.
5. En idle, agrupar residuos/candidatos por causa y proponer olas al
   custodio; no editar backlog, abrir WP, implementar ni aceptar.
6. Persistir veredictos en el canal que el mundo declare (no en este skill).
7. Antes de entregar cualquier texto al orquestador del mundo: **prueba de
   ceguera** sobre la cara §WP (`scripts/comprobar-ceguera.sh` o patrón
   local del custodio).
8. Toda salida al custodio: vista PO/SCRUM en Markdown y después un único
   handoff operativo cercado y copiable.

## Recursos

- `reference/ESTACION.md` — protocolo abstraído + multi-carril + supuestos
- `reference/BACKSTAGE-GIT.md` — layout backstage · convención `cantera/` ·
  worktree por rol · migración `fuentes/` → `cantera/`
- `reference/ADDENDA-DOS-CARAS.md` — formato §interna / §WP + carril + ceguera
- `examples/` — fixtures sintéticas mínimas (sin datos de mundo real)
- `../../instancias/ejemplo-M/` — corpus-instancia de-identificado (bitácora /
  revisiones / addendas / handoffs sintéticos; ceguera = 0)
- `scripts/watcher.sh` — muestreo parametrizado (no usa `git status`)
- `scripts/verificar-identidad-raiz.mjs` + probe — preflight fail-closed
- `scripts/verificar-salida-dual.mjs` + probe — gate documental dual
- `scripts/verificar-dedup-contratos.mjs` + probe de copia real — CA Eje III
- `scripts/verificar-territorio-mapa.sh` — pulso territorio==mapa (#19)
- `scripts/comprobar-ceguera.sh` — ceguera sobre este skill

Sucesión de vigía (estación viva · sin PASS no 🔶): ver también
`swarm-orquestacion` · `reference/lecciones-vnext.md`.
