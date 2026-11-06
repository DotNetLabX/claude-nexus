#!/usr/bin/env node
/**
 * Nexus decision review — the command form of lib/decision-review.js.
 *
 *   node decision-review.js --folder {feature folder} [--out {file}] [--title {title}]
 *
 * Reads the folder's decision records (lib/decision-records.js), renders the owner's review and writes it to
 * `--out`, by default `{folder}/delivery/decision-review.md`, keeping every verdict the file already holds.
 * Prints one JSON object, `{ ok, file, cards, shortList, keptVerdicts }`, and exits 0; exits 2 with
 * `{ ok: false, error }` where no `--folder` is given, the folder does not exist, a file already there cannot be
 * read (it is left as it was) or the file cannot be written; the file is written whole or not at all. The printed
 * `file` uses forward slashes. A plain program: no agent, no network.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { readDecisions } = require('./lib/decision-records');
const { renderReview, readVerdicts, isCard } = require('./lib/decision-review');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
}

function out(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

const folder = arg('folder');
if (!folder) out({ ok: false, error: 'no --folder given' }, 2);
if (!fs.existsSync(folder)) out({ ok: false, error: `no such folder: ${folder}` }, 2);
const file = (arg('out') || path.join(folder, 'delivery', 'decision-review.md')).split(path.sep).join('/');
let previous = null;
try { previous = fs.readFileSync(file, 'utf8'); } catch (err) {
  if (!err || err.code !== 'ENOENT') out({ ok: false, error: `${file} could not be read (${(err && err.code) || err}): it was left as it was` }, 2);
}
try {
  const cards = readDecisions(folder);
  const text = renderReview(cards, { title: arg('title') || path.basename(path.resolve(folder)), previous });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
  const full = cards.filter(isCard).length;
  out({ ok: true, file, cards: full, shortList: cards.length - full, keptVerdicts: Object.keys(readVerdicts(previous)).length }, 0);
} catch (err) {
  try { fs.rmSync(`${file}.${process.pid}.tmp`, { force: true }); } catch { /* nothing to remove */ }
  out({ ok: false, error: String((err && err.message) || err) }, 2);
}
