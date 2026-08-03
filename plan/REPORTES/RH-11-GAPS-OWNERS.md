# RH-11 · GAPS OWNERS (superficies externas)

Generado: 2026-08-03T14:17:56Z  
Registry: `https://npm.scriptorium.escrivivir.co`  
Base RH-04: `plan/REPORTES/RH-04-MATRIZ-CONTRATOS.md` (2026-08-03T14:11:41Z)  
Re-chequeo puntual: `npm view` + install limpio `@zeus/linea-kit@0.3.0` / `@zeus/acta-kit@0.1.1` (temp, `--ignore-scripts`, sin siblings).

## Frontera H (no-implementación local)

**H no implementa** `line.materialize`, provider, digest, cremallera, notaría ni ledger sustituto.  
Cualquier ausencia permanece `pending_external_contract` (o `publicado-sin-types` cuando el paquete existe pero no tipa) visible para consumidores; no hay contingencia en `packages/*` de H.

## Resumen por superficie

| superficie | owner (destinatario) | estado registry (RH-11b 2026-08-03) | veredicto | gap a elevar |
| --- | --- | --- | --- | --- |
| candidato LORE-HM | S / lengua (externo); DECISIONES ① GO `lore-hm-candidate@0.0.x` | E404 en `lore-hm-candidate`, `lore-hm`, `@logos/lore-hm`, `@alephscript/lore-hm-candidate` (exit 1) | `pending_external_contract` | publicar candidato tipado en registry (nombre por defecto `lore-hm-candidate@0.0.x`; no `@logos/*` antes de puerta promoción) |
| provider E | E (externo) | E404 en `@zeus/provider-e`, `@zeus/analisis-e`, `provider-e` (exit 1) | `pending_external_contract` | publicar provider/análisis tipado consumible por H |
| ceremonia / evidencia canónica | HUB (externo) | E404 en kits canónicos; `acta-kit@0.1.2` tipado **≠** canónico | `pending_external_contract` | publicar ceremonia/evidencia canónica tipada (no basta acta-kit) |
| acta-kit (candidato parcial, no sustituye) | Z / HUB | `@zeus/acta-kit@0.1.2` tipado (7 `.d.ts`) | **tipado OK**; `pending_release_types` **cerrado**; **no** cierra evidencia canónica | — (no elevar types; elevación HUB canónica aparte) |
| materialización / linea-kit | Z (línea / materialización) | `@zeus/linea-kit@0.4.0` tipado (50 `.d.ts`); API `materializeRecorrido` en `./viaje` | **VERDE tipado**; `pending_release_types` **cerrado**; H consume | — |
| feeds canal / feed-kit | Z (feeds) | `@zeus/feed-kit@0.3.1` tipado | **VERDE tipado**; `pending_release_types` **cerrado** | — (arg-feeds G sigue E404 si aplica) |

Superficies BRIEF aún abiertas: **LORE-HM · provider E · evidencia HUB canónica** (2/4 tipados cerrados: linea + acta tipado parcial; feed-kit canal aparte).

## Detalle · candidato LORE-HM

- **Owner:** S / lengua (externo).
- **Cita RH-04:** ROJO / `pending_external_contract` (candidatos E404).
- **Re-chequeo:** mismos E404 (exit 1) a 2026-08-03T14:17:56Z.
- **DECISIONES ①:** GO a publicar candidato; asiento en `S_META` (cola A). **No inventa** respuesta del owner: el GO existe; el artefacto tipado en registry **aún no**.
- **Veredicto:** `pending_external_contract`.

## Detalle · provider E

- **Owner:** E (externo).
- **Cita RH-04:** ROJO / `pending_external_contract`.
- **Re-chequeo:** E404 (exit 1) en los tres candidatos.
- **Veredicto:** `pending_external_contract`.

## Detalle · ceremonia / evidencia

- **Owner:** HUB (externo).
- **Cita RH-04 / RH-11b:** candidatos canónicos E404; `@zeus/acta-kit@0.1.2` tipado pero **no** canónico.
- **Veredicto superficie canónica:** `pending_external_contract` (sigue).
- **Nota:** `pending_release_types` de acta-kit **cerrado**; no sustituye evidencia HUB.

## Detalle · materialización / linea-kit

- **Owner:** Z (línea / materialización).
- **RH-11b:** `@zeus/linea-kit@0.4.0` → types `./types/index.d.ts`; API canónica
  `materializeRecorrido` desde `@zeus/linea-kit/viaje` (no existe `line.materialize`).
- **Veredicto:** **OK tipado**; H cablea puerto inyectable fail-closed. Gap
  `pending_release_types` **cerrado**.

## Elevaciones

| id | destinatario | artefacto |
| --- | --- | --- |
| ELEV-RH-11-LORE | S / lengua | `C:/S_META/HSDK/RH-11-ELEVACION-OWNERS.md` §LORE-HM |
| ELEV-RH-11-E | E | misma nota §provider-E |
| ELEV-RH-11-HUB | HUB | misma nota §ceremonia-evidencia |
| ELEV-RH-11-Z-LINEA | Z | misma nota §linea-kit |

Sin respuesta inventada del owner. Mediación: custodio ofrece; H solo documenta gap.

## Criterio de cierre (fuera de este WP)

Superficie → OK tipado solo si: paquete en registry + versión exacta + types declarados + `.d.ts` en disco + runtime import OK (criterio RH-04 VERDE), y para materialización además export/API tipada de materialización usable por el adapter H. Hasta entonces: **PARAR** en `pending_external_contract` / `publicado-sin-types` por superficie.
