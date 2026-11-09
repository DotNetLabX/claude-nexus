#!/usr/bin/env node
/**
 * Nexus parts — a spec's `## Parts` list turned into part folders. Run by hand, by an agent, or by the
 * campaign — NOT a registered hook.
 *
 *   parts.js --spec {spec folder}        make one folder per part; print the parts as JSON
 *   parts.js check --part {part folder}  print `ready`, `stale: {why}`, `waiting: {slug}, …` or, for a folder
 *                                        that is no part, `error: {why}`
 *
 * `--spec` takes a folder under docs/specs at depth one or two. The list is read from the definition
 * `sdd-read.js` resolves for it, which must read `Status: Ready` and be committed and unchanged. Each part's
 * folder sits beside the spec's own `definition/` and holds one generated pointer; a pointer changed by hand,
 * or any other file at a part's folder, is never overwritten. Runs are serialised by a lock file in the
 * spec's folder. The rules and the library are `lib/parts.js`.
 *
 * Exit codes: `--spec` 0 made (or nothing to change) · 1 refused, each reason printed; `check` 0 ready ·
 * 1 stale, waiting or not a part; 2 usage.
 */
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { makeParts, checkPart } = require('./lib/parts');

const USAGE = 'usage: parts.js --spec {spec folder} | parts.js check --part {part folder}';

// The repository root and the folder's path in it, read from git so a short or linked path never skews it.
function locate(folder) {
  const dir = path.resolve(folder);
  const ask = (args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', windowsHide: true });
  const top = ask(['rev-parse', '--show-toplevel']);
  const prefix = ask(['rev-parse', '--show-prefix']);
  if (top.status !== 0 || prefix.status !== 0) return null;
  return { repo: path.resolve(top.stdout.trim()), rel: prefix.stdout.trim().replace(/\/+$/, '') };
}

function main(argv) {
  const check = argv[0] === 'check';
  const args = check ? argv.slice(1) : argv;
  const flag = check ? '--part' : '--spec';
  if (args.length !== 2 || args[0] !== flag || !args[1] || args[1].startsWith('--')) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const where = locate(args[1]);
  if (!where) {
    process.stdout.write(`refused: ${args[1]} is not a folder inside a git repository.\n`);
    return 1;
  }
  if (check) {
    const out = checkPart(where.repo, where.rel);
    process.stdout.write(out.state === 'ready' ? 'ready\n' : out.state === 'waiting' ? `waiting: ${out.waits.join(', ')}\n` : `${out.state}: ${out.reason}\n`);
    return out.state === 'ready' ? 0 : 1;
  }
  const out = makeParts(where.repo, where.rel);
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  return out.ok ? 0 : 1;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { main };
