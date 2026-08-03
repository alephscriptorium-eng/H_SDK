# ALEPH-H · constitución del mundo H

> **Genealogía**. Este documento es una **re-derivación**, no una copia. La
> forma (AOS, Markdown-First, modos cognitivos, hexágono, disciplina ADR)
> desciende del AOS Aleph `NETWORK-ENGINE`, ancla de cita:
> `C:\Users\aleph\OASIS\SCRIPTORIUM_V0\transmedia-system\SCRIPTORIUM-CORE\NETWORK-ENGINE`
> — en concreto `INSTRUCTIONS/ALEPH.instructions.md` y `INSTRUCTIONS/MODES/*`.
> El corte es el de [`ADR/0001`](../ADR/0001-genealogia-y-corte-network-engine.md):
> **ni submodule, ni vendoring, ni rutas runtime hacia OASIS**. Se cita; no se
> arrastra. Nada de la antigua entra por inercia: entra con ADR propio o no
> entra.

## Misión

H no produce respuestas: construye, sobre meses, un sistema de conocimiento y
de obra que pueda evolucionar sin perder coherencia arquitectónica.

La misión concreta de este mundo es la **experiencia**: el juego y su
dramaturgia — hoy, la adaptación de **delta** al juego **ciudad**, en el
**barrio Lore**, sobre la **DocumentMachine**, con **V como interfaz de H**
(ver [`design/RECAP-SPEC-DEMO.md`](../design/RECAP-SPEC-DEMO.md); cada elemento
de la spec lleva la palabra del PO de la que se deriva, y lo que no se derive
de ahí no entra).

## Doble acople (ADR 0002)

H se sostiene sobre dos acoples de naturaleza distinta, y no deben confundirse:

| acople | qué se toma | qué NO se toma |
| ------ | ----------- | -------------- |
| **Aleph** (`NETWORK-ENGINE`) | **la forma**: Bun, TS estricto source-first, hexágono core/edges, MODES, Markdown-First, ADR | el código: nada se clona ni se vendorea |
| **Zeus** (`npm.scriptorium.escrivivir.co`) | **lo publicado**: `@zeus/*` desde registry, consumido `.mjs` + `.d.ts` | los árboles: jamás vendorear ni submodule |

Reglas de frontera, heredadas del zeus-bridge y vigentes aquí:

- **Solo lo publicado.** Si no está en el registry, no se usa: se declara
  `pendiente` con motivo. Nunca se finge.
- **Outbound-only.** H habla hacia zeus; zeus no manda dentro de H.
- **Degradación limpia y declarada.** Sin `@zeus/*` el sistema dice que está en
  replay; replay ≠ conectado. **Jamás fallback silencioso.**
- **Criterio del PO**: cuando z-sdk tenga paquete para el trabajo, usarlo **ES**
  el experimento. No se pregunta: se usa y se mide.
- **Ownership**: h-sdk es juego + experiencia + adapters/proyecciones. **Nunca**
  lengua, provider, contracts ni notaría.

## Idiomas: quién habla qué

- **El código propio de H es TypeScript estricto, source-first**: `strict`,
  `noEmit`, `verbatimModuleSyntax`, imports con extensión `.ts`, Bun como
  runtime. La raíz de esa regla es [`tsconfig.base.json`](../tsconfig.base.json).
- **`.mjs` es idioma de zeus y de g**, y de la obra de adaptación dentro de
  delta. En H se **consume**, no se escribe: `@zeus/*` entra como `.mjs` + sus
  `.d.ts`, y el hexágono lo encierra en un edge.
- El boceto `packages/game-prueba-hm/` está **cerrado**: es `.mjs` de navegador
  y no se itera. Sus piezas se rescatan solo si la adaptación las pide.

## Hexágono

```
packages/core/       dominio H puro — sin IO, sin red, sin fs, sin @zeus
packages/edge-*/     puertos hacia fuera — aquí y solo aquí vive el acople
```

- El **core** declara los **puertos** (interfaces) que necesita; no los
  implementa y no importa a ningún edge. La dependencia apunta siempre hacia
  dentro.
- Un **edge** implementa puertos del core contra un mundo concreto
  (`edge-zeus` → `@zeus/*`). Si un tipo de fuera se filtra al core, el hexágono
  está roto.
- Resolución **source-first**: los paquetes se ven entre sí por `paths` a
  `src/index.ts`. No hay paso de build para leer código propio.

## Markdown-First

La ventana de chat es efímera; el disco no. Toda respuesta estructural se
consolida en el árbol:

- [`INSTRUCTIONS/`](.) — constituciones y modos (este fichero y `MODES/`).
- [`ADR/`](../ADR) — decisiones con estado y fecha. Toda re-derivación desde el
  ancla NE exige ADR propio que cite ancla + commit.
- [`design/`](../design) — spec y arquitectura de la obra en curso.
- [`plan/`](../plan) — visión, estación, backlog y `REPORTES/` con evidencia.

Las capas de instrucciones técnicas del AOS Aleph (LAYER_0…LAYER_4) **no se
copian**: se re-derivan bajo demanda, una a una, cuando una ficha las pida.

## Modos cognitivos

El agente opera siempre en uno de los tres modos y **debe bloquear la ejecución
si el modo no está establecido**, pidiéndolo:

- [**MONKEY**](MODES/MONKEY.instructions.md) — ejecución directa.
- [**AGI**](MODES/AGI.instructions.md) — trabajo profesional estándar (defecto).
- [**ASI**](MODES/ASI.instructions.md) — programa de investigación.

## Definición de hecho

Una ficha está hecha cuando: el mecanismo real está dentro (o el hueco está
declarado `pendiente` **con motivo**), la validación acordada está en verde, y
la evidencia quedó en disco. La frontera real/pendiente **es producto**: es lo
que la obra enseña de sí misma.

## Errores frecuentes a evitar

- Usar `npm`/`npx` para el trabajo de H: en este repositorio se usa **Bun**
  (`bun install`, `bun run`, `bun x`) salvo petición explícita.
- Escribir `.mjs` propio de H, o dejar que un tipo de `@zeus/*` cruce al core.
- Copiar árboles de `NETWORK-ENGINE` en vez de citar el ancla y re-derivar.
- Inventar marco, nombre o dramaturgia que no se derive de la palabra del PO.
- Dar por conectado lo que está en replay.
