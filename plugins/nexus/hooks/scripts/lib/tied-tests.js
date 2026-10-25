#!/usr/bin/env node
'use strict';
/**
 * The tests tied to a change: the test files that exercise a changed file, as the repo's layout shows it,
 * plus the test files the change itself edits. verify-run.js `--tied` runs them; the CLI lists them.
 *
 *   node tied-tests.js --list --repo <path> --changed <file>...
 *
 * How a changed file ties to tests is its runner's (`tiedSet`, the contract in lib/test-runners.js): node, built
 * in, ties a changed source to every test file whose base name is the source's. A runner with no `tiedSet`,
 * or none installed, ties nothing, and its reason is the fallback.
 *
 * Files lib/tree-hash.js leaves out of the hash (docs/, the pipeline's own writes) are ignored, since no
 * close ever asks for them. Any other changed file that ties to no test makes the set unknown: `fallback`
 * names why, and the caller runs its declared step tests instead — a step never runs no test at all.
 *
 * failedTargets reads a run's output for the test targets it reports failing (each runner's reader), or null
 * when it names none it can place in the repo, names one it cannot place, or ran anything but a listed shape:
 * the runner invoked directly, with listed options only, as its last stage after listed setup stages (a
 * wrapper may stop at its first failing stage; an unlisted shape may hide one). The runner lists its own
 * options and setup stages (`commandShape`); the shell grammar of a stage is lib/test-runners.js's. nodeInvocation reads a
 * command that is one direct node stage in that shape into its executable, options and targets, so
 * verify-run.js can run it as the composer's legs.
 */
const fs = require('fs');
const path = require('path');
const {
  inferRunner, listFiles, loadRunner, RUNNERS, optionEnd, stagesOf, isAssignment, directRunner, setupStage,
} = require('./test-runners');
const { isExcluded } = require('./tree-hash');

const slashes = (p) => String(p).replace(/\\/g, '/');
const relTo = (repo, f) => slashes(path.relative(repo, path.resolve(repo, slashes(f))));
const sessionRoot = (root) => root || process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readConfig(repo) {
  try { return JSON.parse(fs.readFileSync(path.join(repo, '.claude', 'verify.json'), 'utf8')); } catch { return null; }
}

// The runner verify-run.js composes `--files` for: `slow.runner`, else the one the declared unit invokes.
function runnerOf(cfg) {
  if (cfg && cfg.slow && typeof cfg.slow.runner === 'string' && cfg.slow.runner) return cfg.slow.runner;
  const unit = cfg && cfg.roles && cfg.roles.unit;
  return typeof unit === 'string' ? inferRunner(unit) : '';
}

// What tiedSet reads of a repo's verify.json: the runner, the declared unit and the slow declaration.
function declaredFor(cfg) {
  const unit = cfg && cfg.roles && typeof cfg.roles.unit === 'string' ? cfg.roles.unit : '';
  const slow = cfg && cfg.slow && typeof cfg.slow === 'object' ? cfg.slow : null;
  return { runner: runnerOf(cfg), unit, slow };
}

function tiedSet({ repo, changed, runner, unit = '', slow = null, listing = null, stopSeconds = 0, root = null }) {
  const named = [...new Set((changed || []).map((f) => relTo(repo, f)))];
  const considered = named.filter((f) => !isExcluded(f));
  const result = (fields) => ({
    runner, changed: named, ignored: named.filter(isExcluded), targets: [], untied: [], commands: [], fallback: null, ...fields,
  });
  if (considered.length === 0) return result({ fallback: "no changed file outside docs/ and the pipeline's own files" });
  if (!runner) return result({ fallback: 'no test runner in .claude/verify.json' });
  const loaded = loadRunner(runner, { root: sessionRoot(root) });
  if (!loaded.runner) return result({ fallback: loaded.reason });
  if (typeof loaded.runner.tiedSet !== 'function') return result({ fallback: `the ${runner} runner ties no tests` });
  const tie = loaded.runner.tiedSet({ repo, changed: considered, listing: listing || listFiles(repo), unit, slow, stopSeconds });
  if (tie.untied.length) return result({ targets: tie.targets, untied: tie.untied, fallback: `no tied test for ${tie.untied.join(', ')}` });
  if (tie.fallback) return result({ targets: tie.targets, fallback: tie.fallback });
  return result({ targets: tie.targets, commands: tie.commands });
}

// The command shapes a red run's list is read from, and nothing else: the strict stage grammar of
// test-runners.js (`stagesOf`), which the caller reads as null outside it.

// The shape tables of each runner a check reads, loaded once per call.
function shapes(root) {
  const cache = new Map();
  return (runner) => {
    if (!cache.has(runner)) {
      const { runner: r } = loadRunner(runner, { root: sessionRoot(root) });
      cache.set(runner, r && r.commandShape ? r.commandShape : null);
    }
    return cache.get(runner);
  };
}

// A red run proves its failures are all there were only when the runner itself ran every test: the
// runner invoked directly, in a listed shape, as the last stage, after setup stages only. A wrapper can
// stop at its first failing stage, and so can the shell's chain; a shape not listed may hide either.
// Returns the runner, or ''.
function accountingRunner(command, shapeOf) {
  const stages = stagesOf(command);
  if (!stages) return '';
  const runner = directRunner(stages.at(-1), shapeOf);
  return runner && stages.slice(0, -1).every((s) => setupStage(s, shapeOf)) ? runner : '';
}

// A command that is one direct `node … --test …` stage in a listed shape, read into what a run needs to
// recompose it as argument lists: the executable, the listed environment assignments before it, its node
// options and its targets. null for anything else — a setup stage, a wrapper, another runner.
function nodeInvocation(command, { root = null } = {}) {
  const shapeOf = shapes(root);
  const stages = stagesOf(command);
  if (!stages || stages.length !== 1 || directRunner(stages[0], shapeOf) !== 'node') return null;
  const options = shapeOf('node').options;
  const words = stages[0];
  const env = {};
  let start = 0;
  for (; isAssignment(words[start]); start++) {
    const at = words[start].text.indexOf('=');
    env[words[start].text.slice(0, at)] = words[start].text.slice(at + 1);
  }
  const args = words.slice(start + 1).map((w) => w.text);
  const opts = [];
  const targets = [];
  for (let i = 0; i < args.length;) {
    if (args[i] === '--test') { i++; continue; }
    if (!args[i].startsWith('-')) { targets.push(args[i++]); continue; }
    const end = optionEnd(options, args, i);
    opts.push(...args.slice(i, end));
    i = end;
  }
  return { exe: words[start].text, env, options: opts, targets };
}

// A partial list reads as the whole one, so one failure a reader cannot place makes the list unknown.
// Every installed runner's reader reads the output, whichever runner the command invoked.
function failedTargets({ output, repo, command = null, listing = null, root = null }) {
  if (command !== null && !accountingRunner(command, shapes(root))) return null;
  const found = new Set();
  for (const name of RUNNERS) {
    const { runner } = loadRunner(name, { root: sessionRoot(root) });
    if (!runner) continue;
    const hits = runner.failedTargets({ output, repo, listing });
    if (hits === null) return null;
    for (const t of hits) found.add(t);
  }
  return found.size ? [...found].sort() : null;
}

module.exports = { tiedSet, failedTargets, nodeInvocation, runnerOf, declaredFor, readConfig, listFiles };

function cli(argv) {
  const at = (flag) => argv.indexOf(flag);
  const repo = at('--repo') >= 0 ? argv[at('--repo') + 1] : process.cwd();
  const changed = [];
  if (at('--changed') >= 0) {
    for (let i = at('--changed') + 1; i < argv.length && !argv[i].startsWith('--'); i++) changed.push(argv[i]);
  }
  if (at('--list') < 0 || changed.length === 0 || !repo) {
    return { err: 'usage: tied-tests.js --list --repo <path> --changed <file>...' };
  }
  const root = path.resolve(repo);
  const cfg = readConfig(root);
  return { out: tiedSet({ repo: root, changed, ...declaredFor(cfg) }) };
}

if (require.main === module) {
  const { out, err } = cli(process.argv.slice(2));
  if (err) {
    process.stderr.write(`tied-tests: ${err}\n`);
    process.exit(2);
  }
  process.stdout.write(`${JSON.stringify(out)}\n`);
}
