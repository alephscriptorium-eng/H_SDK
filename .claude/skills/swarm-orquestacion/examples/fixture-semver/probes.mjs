#!/usr/bin/env node

import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gate = resolve(
  here,
  '..',
  '..',
  'scripts',
  'verificar-dependencias-semver.mjs',
);
const cases = JSON.parse(await readFile(join(here, 'cases.json'), 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'fixture-semver-'));
let failures = 0;

try {
  for (const [index, fixture] of cases.entries()) {
    const caseDir = join(temp, `case-${index}`);
    const sourceDir = join(caseDir, 'src');
    const packagePath = join(caseDir, 'package.json');
    const configPath = join(caseDir, 'dependencias-semver.json');
    await mkdir(sourceDir, { recursive: true });

    const imported = fixture.config.runtimeImports ??
      Object.keys(fixture.package.dependencies ?? {});
    const source = fixture.source ??
      imported.map((name) => `import ${JSON.stringify(name)};`).join('\n');
    const definitions = fixture.duplicateDefinitions ? 2 : 1;
    const markedSource = `${source}\n${'const CONTRATO_SEMVER = true;\n'.repeat(definitions)}`;
    const config = {
      ...fixture.config,
      runtimeRoots: ['src'],
      dedupPatterns: [
        {
          name: 'CONTRATO_SEMVER',
          pattern: '\\bconst\\s+CONTRATO_SEMVER\\b',
          maxDefinitions: 1,
        },
      ],
    };

    if (fixture.integration) {
      const testDir = join(caseDir, 'test');
      await mkdir(testDir, { recursive: true });
      config.integrationTests = { alpha: 'test/integracion-alpha.mjs' };
      const integrationSource =
        fixture.integration === 'pass'
          ? `import alpha from 'alpha';
if (alpha('contrato') !== 'integrado:contrato') process.exit(1);
console.log('integración alpha: OK');
`
          : `console.error('integración alpha: FAIL');
process.exit(1);
`;
      await writeFile(
        join(testDir, 'integracion-alpha.mjs'),
        integrationSource,
        'utf8',
      );
      if (fixture.integration === 'pass') {
        const moduleDir = join(caseDir, 'node_modules', 'alpha');
        await mkdir(moduleDir, { recursive: true });
        await Promise.all([
          writeFile(
            join(moduleDir, 'package.json'),
            JSON.stringify({ name: 'alpha', version: '0.4.2', type: 'module', exports: './index.js' }),
            'utf8',
          ),
          writeFile(
            join(moduleDir, 'index.js'),
            `export default (value) => 'integrado:' + value;\n`,
            'utf8',
          ),
        ]);
      }
    }

    await Promise.all([
      writeFile(packagePath, JSON.stringify(fixture.package), 'utf8'),
      writeFile(configPath, JSON.stringify(config), 'utf8'),
      writeFile(join(sourceDir, 'index.mjs'), markedSource, 'utf8'),
    ]);

    const run = spawnSync(
      process.execPath,
      [gate, '--package', packagePath, '--config', configPath],
      { encoding: 'utf8', env: { ...process.env, NO_UPDATE_NOTIFIER: '1' } },
    );
    const output = `${run.stdout}${run.stderr}`;
    const missing = fixture.includes.filter((text) => !output.includes(text));
    const passed = run.status === fixture.exit && missing.length === 0;
    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${fixture.name} · exit=${run.status}`,
    );
    if (!passed) {
      failures += 1;
      console.error(`  esperado exit=${fixture.exit}; faltan: ${missing.join(', ') || 'ninguno'}`);
      console.error(output.trim());
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`probes semver: FAIL (${failures}/${cases.length})`);
  process.exit(1);
}
console.log(`probes semver: OK (${cases.length}/${cases.length}) · sin red`);
