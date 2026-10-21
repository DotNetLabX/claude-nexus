// stryker-reach.mjs — reads the output of the .NET adapter's one-file Stryker reach probe and returns
// that project's reach result for the mining kickoff's mutation reach record.
//
// Stryker mutates only the projects the mutation test project references directly; a project reached
// only through another reference builds, its tests run, and Stryker still stops with "No project found".
// So reach is read from the log's own line — "Found project … to mutate" or "No project found" — and
// never from an exit code or a mutation score: a reached project whose every mutant the one-file
// filter removed still reached.
//
// Zero imports beyond Node's own. Usage: node stryker-reach.mjs --log {probe output file}

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const FOUND = /Found project .+ to mutate/;
const NOT_FOUND = 'No project found';

/**
 * @param {string} logText the probe's console output or log file content
 * @returns {{found:true} | {found:false, detail:string}}
 */
export function readReach(logText) {
  const lines = String(logText).split('\n').map((l) => l.trim());
  if (lines.some((l) => FOUND.test(l))) return { found: true };
  const notFound = lines.find((l) => l.includes(NOT_FOUND));
  return notFound ? { found: false, detail: notFound } : { found: false, detail: 'no reach line in the output' };
}

const USAGE = 'usage: node stryker-reach.mjs --log {probe output file}';

function main(argv) {
  const at = argv.indexOf('--log');
  const file = at === -1 ? undefined : argv[at + 1];
  if (!file) {
    console.error(`stryker-reach: --log names no file\n${USAGE}`);
    return 1;
  }
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`stryker-reach: cannot read ${file} (${err.code ?? err.message})\n${USAGE}`);
    return 1;
  }
  console.log(JSON.stringify(readReach(text)));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
