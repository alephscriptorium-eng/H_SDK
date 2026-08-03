// Tests del gate anti-drift verificar-release.mjs (WP-34, DC-30 / INT-V-07).
// Ejecutar: node --test skills/swarm-orquestacion/scripts/
// Fixtures SINTÉTICAS y método-agnósticas: paquete ficticio `@acme/widget`
// (el gate deriva name+versión de package.json → prueba que NO hardcodea
// este repo). Verifican: README con drift → FALLO ruidoso nombrando
// fichero+versiones (rojo); README sin drift → pasa (verde); una versión de
// solo-historia NO se marca como actual.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SCRIPT = fileURLToPath(new URL('./verificar-release.mjs', import.meta.url));

// Corre el CLI real sobre un package.json + README sintéticos en dir aislado.
function runGate(pkgObj, readmeText, extraArgs = []) {
  const dir = mkdtempSync(join(tmpdir(), 'wp34-rel-'));
  try {
    const pkg = join(dir, 'package.json');
    const readme = join(dir, 'README.md');
    writeFileSync(pkg, JSON.stringify(pkgObj, null, 2));
    writeFileSync(readme, readmeText);
    return spawnSync(
      process.execPath,
      [SCRIPT, '--pkg', pkg, '--readme', readme, ...extraArgs],
      { encoding: 'utf-8' },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const PKG = { name: '@acme/widget', version: '0.11.0' };

// README con la versión actual bien puesta en todos los marcadores; incluye
// una versión ANTERIOR de solo-historia (corte 0.9.0) que NO debe marcarse.
const README_LIMPIO = `# @acme/widget

Release notes: \`CHANGELOG.md\` (actual \`0.11.0\`).

Correspondencia actual: el paquete **0.11.0** amplía sobre el corte
**0.9.0**.

\`\`\`bash
npm install --save-exact @acme/widget@0.11.0
npm view @acme/widget@0.11.0 version
# → 0.11.0, exit 0
\`\`\`

Pack local: \`acme-widget-0.11.0.tgz\`.
`;

// Mismo README pero DESFASADO: package.json va 0.11.0 y el README cita 0.10.0
// como actual en todos los marcadores. Además NO aparece 0.11.0 (presencia).
const README_DRIFT = `# @acme/widget

Release notes: \`CHANGELOG.md\` (actual \`0.10.0\`).

Correspondencia actual: el paquete **0.10.0** amplía sobre el corte
**0.9.0**.

\`\`\`bash
npm install --save-exact @acme/widget@0.10.0
npm view @acme/widget@0.10.0 version
# → 0.10.0, exit 0
\`\`\`

Pack local: \`acme-widget-0.3.4.tgz\`.
`;

test('README sin drift → pasa (exit 0) y no marca la versión de solo-historia', () => {
  const r = runGate(PKG, README_LIMPIO);
  assert.equal(r.status, 0, `esperado exit 0; stderr:\n${r.stderr}`);
  assert.match(r.stdout, /OK/);
  // 0.9.0 es histórico (corte) → jamás debe aparecer como problema.
  assert.doesNotMatch(r.stderr, /0\.9\.0/, 'la versión de solo-historia no debe marcarse');
});

test('README con drift → FALLO ruidoso (exit 1) nombrando fichero y versiones', () => {
  const r = runGate(PKG, README_DRIFT);
  assert.equal(r.status, 1, `esperado exit 1; stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stderr, /FALLO/);
  assert.match(r.stderr, /README\.md/, 'debe nombrar el fichero');
  assert.match(r.stderr, /0\.10\.0/, 'debe nombrar la versión anterior hallada');
  assert.match(r.stderr, /0\.11\.0/, 'debe nombrar la versión actual esperada');
  // Presencia: la versión actual no aparece → ese problema concreto se reporta.
  assert.match(r.stderr, /NO aparece en el README/);
  // Marcadores de actualidad detectados (install/view/tarball/(actual)/paquete).
  assert.match(r.stderr, /referencia npm/);
  assert.match(r.stderr, /tarball npm pack/);
  assert.match(r.stderr, /marcador «\(actual/);
  assert.match(r.stderr, /prosa «el paquete/);
});

test('drift solo en un marcador (presencia OK) → FALLO nombrando ese marcador', () => {
  // La versión actual SÍ aparece (@0.11.0), pero el marcador «(actual …)»
  // quedó en 0.10.0 → debe fallar por ese marcador sin falso «no aparece».
  const readme = `# @acme/widget

(actual \`0.10.0\`)

npm install --save-exact @acme/widget@0.11.0
`;
  const r = runGate(PKG, readme);
  assert.equal(r.status, 1, `esperado exit 1; stderr:\n${r.stderr}`);
  assert.match(r.stderr, /marcador «\(actual/);
  assert.match(r.stderr, /0\.10\.0/);
  assert.doesNotMatch(r.stderr, /NO aparece en el README/, 'la presencia está OK: @0.11.0 existe');
});

test('package.json inexistente → error de uso (exit 2)', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--pkg', 'no-existe-xyz.json'], {
    encoding: 'utf-8',
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /package\.json inexistente/);
});
