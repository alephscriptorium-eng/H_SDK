/**
 * Smoke: monta SceneHost (ciudad + barrio + flujo) sin domain/paneles.
 * Ejecutar en browser con un bundler o abrir vía dev server que resuelva three.
 *
 *   bun run packages/demo-barrio-lore/examples/smoke.mjs
 */
import { SceneHost } from '../src/host/SceneHost.ts';

if (typeof document === 'undefined') {
  console.log('[smoke] omitido: requiere DOM/WebGL');
  process.exit(0);
}

const host = await SceneHost.create({ mount: document.body });
console.log('[smoke] SceneHost montado', {
  act: 'overlook',
  ciudad: host.scene.children.length,
});
await host.setAct('ceremony');
host.playCue('gota-onfalo');
host.playCue('cremallera', { step: 1, side: 'H' });
setTimeout(() => host.dispose(), 2000);
