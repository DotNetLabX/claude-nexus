'use strict';
/**
 * The Vitest test runner: how a named-files run is composed and read. The contract is lib/test-runners.js's, in the
 * core plugin.
 *
 * A named run goes from the nearest folder above the file holding a Vitest or Vite config, one command per folder. A
 * tied run is the whole of each such folder holding a changed file, never `related` or `--changed`: both stop with
 * no report on a syntax error anywhere in the project. Either reads from Vitest's json report: each failed assertion a failure of its file, and a file with a message and no
 * failed assertion, the shape of a syntax error, a failure of that file. Client tests take no slow label: named files
 * run whole, so this runner reads no slow declaration and the slow-test timing pass does not cover it. A complete run
 * stays the owner's of its stage, and this runner reads none (it has no `withRunReport`).
 */
const fs = require('fs');
const path = require('path');

const TEST_FILE = /\.(spec|test)\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const CONFIG = /^(vitest|vite)\.config\.[cm]?[jt]s$/;
const REPORT = 'vitest.json';
const MESSAGE_CAP = 300;
const NOT_COVERED = 'the slow-test timing pass does not cover this runner';
// The options a `vitest run` may carry and still run every test of its folder.
const WHOLE_RUN_OPTION = /^--(testTimeout|reporter|outputFile(\.\w+)?|passWithNoTests)(=|$)/;
// A run that named nothing and still exited clean.
const CLEAN_EMPTY = /exiting with code 0/;

const messageLine = (text) => (String(text || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) || '').slice(0, MESSAGE_CAP);
const slashes = (p) => String(p).replace(/\\/g, '/');

function readReport(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, REPORT), 'utf8'));
}

function create(h) {
  const stopFlags = (seconds) => `--testTimeout=${seconds * 1000}`;

  function projectOf(cwd, file) {
    return h.projectDir(path.dirname(path.resolve(cwd, file)), cwd, (name) => CONFIG.test(name));
  }

  function filesCommand({ files, cwd = process.cwd(), stopSeconds }) {
    const groups = new Map();
    for (const file of Array.isArray(files) ? files : []) {
      if (!TEST_FILE.test(String(file))) throw new Error(`filesCommand: ${file} is not a Vitest test file`);
      const folder = projectOf(cwd, file);
      if (!folder) throw new Error(`filesCommand: ${file} has no Vitest or Vite config above it`);
      groups.set(folder, [...(groups.get(folder) || []), slashes(path.relative(folder, path.resolve(cwd, file)))]);
    }
    const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
    return [...groups].map(([folder, list]) => {
      const rel = slashes(path.relative(cwd, folder));
      return `${rel ? `cd ${h.quote(rel)} && ` : ''}npx vitest run${stop} ${list.map(h.quote).join(' ')}`;
    });
  }

  function tiedSet({ repo, changed, stopSeconds }) {
    const folders = new Map();
    const targets = [];
    const untied = [];
    for (const file of Array.isArray(changed) ? changed : []) {
      const folder = projectOf(repo, file);
      if (!folder) { untied.push(file); continue; }
      folders.set(folder, [...(folders.get(folder) || []), file]);
      targets.push(file);
    }
    const stop = stopSeconds ? ` ${stopFlags(stopSeconds)}` : '';
    const commands = [...folders.keys()].map((folder) => {
      const rel = slashes(path.relative(repo, folder));
      return `${rel ? `cd ${h.quote(rel)} && ` : ''}npx vitest run${stop} --passWithNoTests`;
    });
    return { targets, untied, commands, ranFor: [...folders.values()], fallback: null };
  }

  // The report's path is read against the folder the command changes to, while `dir` is the tree's.
  function withReport(command, dir) {
    const folder = /^cd "([^"]+)" && /.exec(command);
    const up = folder ? '../'.repeat(folder[1].split('/').length) : '';
    return `${command} --reporter=default --reporter=json --outputFile.json=${h.quote(`${up}${slashes(dir)}/${REPORT}`)}`;
  }

  function readRunResults({ tree, dir, cwd, output }) {
    const folder = slashes(path.relative(tree, path.resolve(cwd || tree))) || '.';
    const project = { project: folder, runner: 'vitest', ms: 0, state: 'unfinished', failed: 0, passed: 0 };
    const none = { failed_tests: [], timed_out: [], projects: [project], complete: false, explained: false, stuck: [], copies: [] };
    let report = null;
    try { report = readReport(dir); } catch { return none; }
    const results = Array.isArray(report.testResults) ? report.testResults : null;
    if (!results) return none;
    if (results.length === 0) {
      if (CLEAN_EMPTY.test(String(output || ''))) return none;
      return { ...none, failed_tests: [{ file: null, line: null, test: null, target: null, runner: 'vitest', message: 'no test ran' }] };
    }
    const failed = [];
    let end = 0;
    for (const file of results) {
      const target = h.relativeFile(file.name, tree);
      end = Math.max(end, Number(file.endTime) || 0);
      const before = failed.length;
      for (const a of Array.isArray(file.assertionResults) ? file.assertionResults : []) {
        if (a.status === 'passed') project.passed++;
        else if (a.status === 'failed') failed.push({ file: target, line: null, test: a.fullName, target, runner: 'vitest', message: messageLine((a.failureMessages || [])[0]) });
      }
      if (file.status === 'failed' && failed.length === before) failed.push({ file: target, line: null, test: null, target, runner: 'vitest', message: messageLine(file.message) });
    }
    project.failed = failed.length;
    project.ms = end && Number(report.startTime) ? Math.max(0, end - Number(report.startTime)) : 0;
    project.state = 'finished';
    return { failed_tests: failed, timed_out: [], projects: [project], complete: true, explained: true, stuck: [], copies: [] };
  }

  const assertions = (report) => (Array.isArray(report.testResults) ? report.testResults : [])
    .flatMap((file) => (Array.isArray(file.assertionResults) ? file.assertionResults : []).map((a) => ({ file, a })));

  function reportTimes({ tree, reportDir }) {
    const root = path.join(tree, reportDir);
    const times = [];
    try {
      for (const found of h.sourceFiles(root, '.json').filter((f) => path.basename(f) === REPORT)) {
        for (const { file, a } of assertions(JSON.parse(fs.readFileSync(found, 'utf8')))) {
          if (a.status === 'passed') times.push({ file: h.relativeFile(file.name, tree), line: null, column: null, test: a.fullName, ms: Number(a.duration) || 0 });
        }
      }
    } catch { /* no report written: nothing was timed */ }
    try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* left for the next run's sweep */ }
    return times;
  }

  function exclusionOf(command) {
    const stages = h.splitChain(command).map(h.fold);
    const runs = [];
    for (const stage of stages) {
      if (/^cd\s/.test(stage)) continue;
      const run = /^(?:npx\s+)?vitest\s+run(?:\s+(.*))?$/.exec(stage);
      if (!run) return { unknown: true, why: `it runs a stage that is neither a direct vitest run nor a folder change: ${stage}` };
      runs.push(run[1] || '');
    }
    if (!runs.length) return { unknown: true, why: 'it runs no direct vitest run' };
    const selects = runs.some((args) => args.split(' ').filter(Boolean).some((word) => !WHOLE_RUN_OPTION.test(word)));
    return selects ? { unknown: true, why: 'its run names files or options that may select tests, so what it leaves out cannot be told' } : { none: true };
  }

  const refused = (form) => () => { throw new Error(`${form}: ${NOT_COVERED}`); };

  return {
    takesNoLabels: true,
    filesCommand,
    tiedSet,
    withReport,
    readRunResults,
    reportTimes,
    exclusionOf,
    stopFlags,
    timingEntries: ({ dir }) => assertions(readReport(dir)).filter(({ a }) => a.status === 'passed' || a.status === 'failed').map(({ file, a }) => ({ file: file.name, name: a.fullName, ms: Number(a.duration) || 0 })),
    failureLines: (text) => String(text || '').split(/\r?\n/).filter((l) => /(^|\s)FAIL\s|Transform failed|:\d+:\d+: ERROR: |AssertionError/.test(l)),
    commandShape: { test: (args) => args[0] === 'run', setup: () => false },
    failedTargets: () => [],
    labelSource: ({ source }) => ({ text: source, slow: false }),
    untagSource: (text) => text,
    joinExclusion: (segment) => segment,
    // Vitest's own default timeout already stops a stuck test, so a declared command needs no flag.
    joinStop: (segment) => segment,
    timingCommand: refused('timingCommand'),
    deltaTargets: refused('deltaTargets'),
    retagEdits: refused('retagEdits'),
  };
}

module.exports = { runners: ['vitest'], contract: 1, create };
