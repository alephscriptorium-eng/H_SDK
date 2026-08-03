#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootFlag = process.argv.indexOf("--root");
const targetRoot =
  rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1] ?? "") : skillRoot;
if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error("uso: verificar-dedup-contratos.mjs [--root <skill-root>]");
  process.exit(2);
}

const contracts = [
  {
    name: "identidad-raiz",
    symbols: ["lock", "parseList", "gitTop", "matchesDownstream"],
  },
  {
    name: "salida-dual",
    symbols: ["validateDualOutput"],
  },
];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(?:cjs|mjs|js)$/u.test(entry.name)) files.push(absolute);
  }
}

walk(targetRoot);
let failed = false;
for (const contract of contracts) {
  const definitionFiles = new Set();
  const results = [];
  for (const symbol of contract.symbols) {
    const definition = new RegExp(`\\bfunction\\s+${symbol}\\s*\\(`, "gu");
    let count = 0;
    for (const file of files) {
      const matches = fs.readFileSync(file, "utf8").match(definition)?.length ?? 0;
      if (matches) definitionFiles.add(file);
      count += matches;
    }
    results.push({ symbol, count });
  }
  const valid =
    results.every(({ count }) => count === 1) && definitionFiles.size === 1;
  if (!valid) {
    failed = true;
    console.error(`dedup ${contract.name}: FAIL`);
    for (const { symbol, count } of results) {
      console.error(`- simbolo=${symbol} definiciones=${count}`);
    }
    for (const file of definitionFiles) {
      console.error(`- implementacion=${path.relative(targetRoot, file)}`);
    }
  } else {
    console.log(
      `dedup ${contract.name}: PASS simbolos=${results.length} implementaciones=1`,
    );
  }
}

if (failed) process.exit(1);
console.log("dedup-contratos: PASS");
