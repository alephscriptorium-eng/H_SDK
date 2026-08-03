---
name: mesa-sincronia
description: >-
  Protocolo de mesa de sincronía multi-consola sobre «el mundo»: identidad y
  firma con aborto por nombre cruzado, leyenda TUI compactar-y-reemplazar,
  consentimiento y GO, modo tick validado con jerarquía de fuentes, timbre
  append-only con fallback pull, capa operativa de buzón-puntero y notas con
  plantillas montables, hilos con lectura cruzada acotada y git por
  rama-discusión, dinámica dirigida con DRAFT/BLOQUEA, cuadernos durables con
  cadena de sellos y cerco exterior local-first, y auditor en sombra
  (CUSTODIO, HUB, SALA, CARRILES, WORLD_ROOT(X), TIMBRE(X), CUADERNOS,
  RAMA(X), AUDITOR, META_DIR, GAMA_BAJA, GAMA_ALTA). Sin datos de instancia.
---

# Skill · mesa-sincronia

Método para operar una **mesa de sincronía**: N consolas (carriles), cada
una con mundo propio, coordinadas por un hub neutro y un custodio humano
que valida cada paso. El skill es protocolo; los nombres, rutas, fechas y
sellos de una mesa concreta son calibración del consumidor y **jamás**
viven aquí (mismo patrón protocolo ≠ datos de `../vigilancia/`).

## Cuándo aplicar

- Montar o re-arrancar una mesa de sincronía de varias consolas sobre
  mundos disjuntos, con custodio humano al mando.
- Operar como carril, hub o auditor dentro de una mesa ya calibrada.
- Resolver disputas de identidad, frontera o fuente («¿esto era para mí?»,
  «¿qué nota manda?») con reglas literales en vez de juicio ad hoc.
- Cerrar sesión con memoria durable: bitácoras, snapshot y cadena de
  sellos en el repo de cuadernos.

## Parámetros del mundo (§0)

El contrato (`reference/PROTOCOLO.md`, §1–§11) se lee con estos nombres
como parámetros. La calibración es dato de instancia del consumidor; el
ejemplo sintético vive en `examples/`.

| parámetro | rol |
| --------- | --- |
| `CUSTODIO` | humano que valida ticks y da GO |
| `HUB` | sesión neutra que mantiene sala, índice y protocolo |
| `SALA` | carpeta de sincronía del hub |
| `CARRILES` | consolas con mundo propio |
| `WORLD_ROOT(X)` | raíz del mundo del carril X |
| `BUZON(X)` | puntero + notas del carril: `<WORLD_ROOT(X)>/sincronia/` — capa operativa: `reference/BUZON-Y-NOTAS.md` |
| `TIMBRE(X)` | campanilla append-only: `<WORLD_ROOT(X)>/sincronia/TIMBRE.md` |
| `OUT_DIR(X)` | estación/bitácora del carril (declarado por cada carril) |
| `INTERVAL` | muestreo del watcher (default 45 s) |
| `PLAYGROUND` | terreno común de pruebas (lectura malla) |
| `CUADERNOS` | repo git durable de bitácoras, sincronización y handoffs |
| `RAMA(X)` | canal del carril X en `CUADERNOS` (patrón `<mundo>-vigilancia`) |
| `AUDITOR` | consola en sombra que descarga al `HUB` y cura entregas |
| `META_DIR` | taller del auditor — sin git, desechable, fuera de la `SALA` |
| `RAICES_AUDITABLES` | raíces de lectura omnímoda del auditor (§11.3) |
| `GAMA_BAJA` | carriles cuyas notas el auditor edita por defecto (tick de ronda) |
| `GAMA_ALTA` | carriles que exigen tick explícito del custodio por caso |

## Resumen operativo (§1–§11)

| § | regla en una línea |
| - | ------------------ |
| §1 | toda salida se anuncia y se firma; firmar a menudo |
| §2 | nombre cruzado = **abortar ya**, verificar identidad, esperar |
| §3 | leyenda TUI única (✅⏳⛔⚠️🔶 · ▸◆★ · frases-contrato) + compactar-y-reemplazar |
| §4 | herramientas ≠ permiso; toda mutación exige GO del custodio |
| §5 | modo TICK validado: `NO_TICK_VALIDADO=NO_PROCESAR`; lo curado manda |
| §6 | reparto de voces (principal · shadow · hub · cronista); shadow no concede mando |
| §7 | timbre append-only + estación v0; fallback pull-on-tick (v0.2) |
| §8 | hilos por tick con compactador; git local por rama-discusión; push prohibido |
| §9 | sesión dirigida: el custodio hila; una nota por turno; DRAFT + `BLOQUEA:` |
| §10 | cuadernos durables: sellos encadenados, gate de cierre, cerco exterior v2 |
| §11 | auditor en sombra: lectura omnímoda, edición trazada, `META_DIR` desechable |

## Pasos

1. Leer la calibración §0 del mundo (si falta un parámetro, `<pendiente>`;
   no se rellena por inferencia).
2. Leer `reference/PROTOCOLO.md` entero antes de la primera salida.
3. Carril sin buzón todavía: montarlo con `reference/BUZON-Y-NOTAS.md` §7
   (plantillas en `reference/plantillas/`) — pasos ejecutables sin leer el
   contrato entero.
4. Operar el rol que toque (carril, hub o auditor) bajo §1–§11: anunciarse,
   esperar tick, una nota por turno, firmar.
5. Al cierre de ronda/sesión: bitácora en `RAMA(X)`, snapshot de `SALA` y
   sello en `CUADERNOS` (§10.5–§10.7).
6. Antes de cara pública del skill: `scripts/comprobar-ceguera.sh` →
   `ceguera: 0`.

## Recursos

| ruta | contenido |
| ---- | --------- |
| `reference/PROTOCOLO.md` | contrato completo §1–§11 parametrizado por §0 |
| `reference/BUZON-Y-NOTAS.md` | capa operativa: buzón-puntero, notas, aviso y montaje (§7) |
| `reference/plantillas/` | `BUZON.md.tpl` · `NOTA.md.tpl` · `TIMBRE.md.tpl` materializables |
| `examples/mesa-sintetica.md` | fixture de calibración: §0 relleno con mesa inventada |
| `examples/ciclo-nota-tick-informe.md` | ciclo de ejemplo con datos sintéticos |
| `examples/fixture-buzones/` | el mismo ciclo **materializado**: hub + 2 carriles, un-buzón-un-dueño |
| `examples/simulacion-montaje-buzon.md` | CA de la capa operativa: montaje solo-con-el-skill |
| `scripts/comprobar-ceguera.sh` | ceguera de este skill (marcas de instancia/marco) |

## Relación con otros skills del paquete

- `../swarm-orquestacion/` — los DRAFT de §9 usan formato de candidatos WP
  compatible con su BRIEF/backlog; la mesa no sustituye su ciclo de obra.
- `../vigilancia/` — mismo patrón protocolo ≠ datos y misma disciplina de
  watcher (log propio, lease de liveness, salida dual).
- `../estacion-viva/` — la estación de un carril puede absorber el watcher
  de timbre (§7) como un pulso más.

## Ceguera de este skill

Este skill **nombra** su vocabulario de método (mesa, carril, tick, timbre,
sello, auditor). La prueba de ceguera veta **marcas de instancia y de
marco**: nombres propios de mesas reales, rutas de máquina, remotos, hashes
y fechas de sesión — no el vocabulario propio.
