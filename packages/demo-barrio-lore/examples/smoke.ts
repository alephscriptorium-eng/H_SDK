/**
 * Smoke sin DOM: valida fixture del pack.
 * Ejecutar: bun run packages/demo-barrio-lore/examples/smoke.ts
 */
import { fixtureBarrioLore } from '../src/fixtures/barrio-lore.ts';
import { validarConfigs } from '../src/config/validate.ts';

const v = validarConfigs({
  ciudad: fixtureBarrioLore.ciudad,
  barrio: fixtureBarrioLore.barrio,
});
if (!v.ok) {
  console.error('fixture inválido', v.issues);
  process.exit(1);
}

console.log('barrio-lore pack OK:', {
  barrioId: fixtureBarrioLore.barrioId,
  unidades: fixtureBarrioLore.barrio.unidades.length,
  destacado: fixtureBarrioLore.ciudad.destacadoBarrioId,
});
