# @h-sdk/demo-barrio-lore — vista Three reusable

Builders config-driven extraídos de `game-prueba-hm` (sin ceremonia/DOM).

## Uso mínimo

```typescript
import * as THREE from 'three';
import { CiudadScene } from '@h-sdk/demo-barrio-lore/ciudad';
import { BarrioScene } from '@h-sdk/demo-barrio-lore/barrio';
import { FlujoFx } from '@h-sdk/demo-barrio-lore/flujo';
import { fixtureBarrioLore } from '@h-sdk/demo-barrio-lore/fixtures/barrio-lore';
import mapa from '@h-sdk/demo-barrio-lore/assets/mapa/mapa.json';

const scene = new THREE.Scene();
const ciudad = await CiudadScene.mount({
  scene,
  mapa,
  three: THREE,
  config: fixtureBarrioLore.ciudad,
});

const ancla = ciudad.barrioAnchor(fixtureBarrioLore.barrioId);
const barrio = await BarrioScene.mount({
  scene,
  three: THREE,
  origin: new THREE.Vector3(ancla.x, ancla.y - 60, ancla.z),
  config: fixtureBarrioLore.barrio,
});

const flujo = new FlujoFx({
  three: THREE,
  scene,
  resolveAnchor: (id) => barrio.unitAnchor(id),
});

ciudad.update(1 / 60);
barrio.update(1 / 60);
flujo.update(1 / 60);
```

## Host integrado

`SceneHost.create({ mount, config })` monta renderer + ciudad + barrio + loop.
API: `setAct('overlook' | 'approach' | 'ceremony')`, `playCue(name, args)`.

## Patito (siguiente paso del plan producto)

Estas clases inyectan `scene` + `THREE`; el host Angular (`threejs-ui-lib`) puede envolverlas en façades sin copiar el mamotreto ESM del game.
