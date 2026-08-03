#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gate = resolve(
  here,
  '..',
  '..',
  '..',
  'scripts',
  'verificar-dependencias-semver.mjs',
);
const run = spawnSync(
  process.execPath,
  [
    gate,
    '--package',
    resolve(here, 'package.json'),
    '--config',
    resolve(here, 'dependencias-semver.json'),
  ],
  { cwd: here, encoding: 'utf8' },
);
const output = `${run.stdout}${run.stderr}`;
process.stdout.write(output);
if (
  run.status !== 0 ||
  !output.includes('OK: 1 dependencia(s) runtime') ||
  !output.includes('C8 no se ejecutó')
) {
  console.error(`cliente independiente: FAIL · exit=${run.status}`);
  process.exit(1);
}
console.log('cliente independiente: OK · gate ejercitado sin red');
