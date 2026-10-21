#!/usr/bin/env node
/**
 * Nexus label-tests: labels the tests a step close timed, from that run's record alone — it never runs a
 * test.
 *
 *   node label-tests.js --run <run_id> [--reason "<text>" --test <file>:<line>]…
 *
 * The run is the verify-run record carrying `run_id` (verify-run.js prints it); a step close — `--files` or
 * `--tied` — records each executed test's time (`test_times`) and the content hash of every file it timed
 * (`timed_hashes`). Any run records the tests it timed out (`timed_out`): each is over the slow line by
 * definition, and is found by its line when the run gave no column; a run with no `timed_hashes` (a complete
 * run) is read against its `file_hashes`. For each timed test file, every timed test at or over the repo's slow line
 * (`slow.thresholdMs` in .claude/verify.json, 2000 ms when unset) gets the slow label and every one under it
 * loses it, along with a kept-slow reason above it: ` @slow` on a node test's name, `[Trait("Speed", "Slow")]`
 * on a .NET test method (found by its class and method name; a class-level Trait is left alone), `tags:
 * ['slow']` on a Flutter test() call, with `slow: {}` declared in its project's dart_test.yaml. `--reason`
 * with `--test {file}:{line}` (the line as the run reported it) writes that reason as a `// slow: {reason}`
 * comment above a test kept slow.
 *
 * A FILE IS THE RUN'S only while its content is the run's: its hash is the run's `timed_hashes` entry, or the
 * `after` of this run's own latest label record for it. Any other file is skipped and named. Every file it
 * edits gets one label record line in .claude/audit/verify-verdict.json — `{source: "label-tests", run_id,
 * tree, files: {path: {before, after, shifts}}}`, `before` the run's hash, `after` the labelled file's,
 * `shifts` the lines reason comments added (+1) or removed (-1) at a run line, so a later call maps the run's
 * positions. The close readers (pipeline-gate.js, lib/gear-close.js) accept such a record as covering the
 * labelled file for its run: the content differs from the run's by labels and reason comments alone.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { fileHash } = require('./lib/tree-hash');
const {
  retagNodeSource, setNodeReason, clearNodeReason, labelDotnetMethod, dotnetReasonLine, labelDartCall, mergeDartTestYaml, dartProjectDir,
} = require('./lib/test-labels');

const DEFAULT_SLOW_MS = 2000;
const NODE_TEST = /\.test\.(mjs|js|cjs)$/;
const DOTNET_TEST = /\.cs$/;
const FLUTTER_TEST = /_test\.dart$/;
const LOG = ['.claude', 'audit', 'verify-verdict.json'];

function parseArgs(argv) {
  const out = { reasons: [] };
  let reason = null;
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i + 1];
    if (argv[i] === '--run') { out.run = value; i++; }
    else if (argv[i] === '--reason') { reason = value; i++; }
    else if (argv[i] === '--test') { out.reasons.push({ at: value, reason }); i++; }
  }
  return out;
}

function readLog(root) {
  let text = '';
  try { text = fs.readFileSync(path.join(root, ...LOG), 'utf8'); } catch { return []; }
  const records = [];
  for (const line of text.split('\n')) {
    try { const r = JSON.parse(line); if (r && typeof r === 'object') records.push(r); } catch { /* a torn or blank line */ }
  }
  return records;
}

function slowLine(tree) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'));
    const ms = cfg && cfg.slow && cfg.slow.thresholdMs;
    return typeof ms === 'number' && ms > 0 ? ms : DEFAULT_SLOW_MS;
  } catch {
    return DEFAULT_SLOW_MS;
  }
}

const kindOf = (file) => (NODE_TEST.test(file) ? 'node' : DOTNET_TEST.test(file) ? 'dotnet' : FLUTTER_TEST.test(file) ? 'flutter' : null);

// A .NET method is labelled by its name, never its line, so the attribute and comment lines the edits add
// move nothing still to come. A method is slow when every timed case of it is at or over the line.
function labelDotnet(file, source, tests, threshold, wanted, out) {
  let text = source;
  const methods = new Map();
  for (const t of tests) {
    const key = `${t.class}.${t.method}`;
    if (!methods.has(key)) methods.set(key, { cls: t.class, method: t.method, lines: new Set(), slow: true, ms: 0 });
    const m = methods.get(key);
    m.lines.add(t.line);
    m.slow = m.slow && t.ms >= threshold;
    m.ms = Math.max(m.ms, t.ms);
  }
  for (const { cls, method, lines, slow, ms } of methods.values()) {
    const edit = labelDotnetMethod(text, cls, method, slow);
    if (!edit.found) { out(`label-tests: ${file} ${cls}.${method} — its declaration was not found, so no label was written\n`); continue; }
    text = edit.text;
    const asked = wanted.find((w) => w.file === file && lines.has(w.line));
    const at = dotnetReasonLine(text, cls, method);
    if (!slow) {
      text = clearNodeReason(text, at).text;
      if (asked) { asked.done = true; out(`label-tests: ${file}:${asked.line} ran under the slow line (${Math.round(ms)} ms) — no reason written\n`); }
    } else if (asked) {
      text = setNodeReason(text, at, asked.reason || 'kept slow').text;
      asked.done = true;
    }
  }
  return text;
}

const mapLine = (shifts, line) => line + shifts.filter((s) => s.at <= line).reduce((n, s) => n + s.delta, 0);

// A timed-out test is recorded by its line alone; its call starts at the line's first non-blank column.
function firstColumn(source, line) {
  const text = String(source).split('\n')[line - 1];
  const at = text === undefined ? -1 : text.search(/\S/);
  return at < 0 ? 1 : at + 1;
}

function main(argv = process.argv.slice(2), { env = process.env, out = (s) => process.stdout.write(s), cwd = process.cwd() } = {}) {
  const args = parseArgs(argv);
  if (typeof args.run !== 'string' || !args.run) {
    out('usage: label-tests.js --run <run_id> [--reason "<text>" --test <file>:<line>]...\n');
    return 2;
  }
  const root = env.CLAUDE_PROJECT_DIR || cwd;
  const records = readLog(root);
  const run = records.find((r) => r.source === 'verify-run' && r.run_id === args.run);
  if (!run) {
    out(`label-tests: no record of run ${args.run} in .claude/audit/verify-verdict.json\n`);
    return 2;
  }
  const tree = typeof run.tree === 'string' && run.tree ? run.tree : root;
  // A timed-out test is over the slow line by definition: it ran at least its stop.
  const timedOut = (Array.isArray(run.timed_out) ? run.timed_out : [])
    .filter((t) => t && typeof t.file === 'string' && Number.isInteger(t.line))
    .map((t) => ({ ...t, ms: Infinity }));
  const timed = [...(Array.isArray(run.test_times) ? run.test_times : []), ...timedOut];
  const hashes = run.timed_hashes && typeof run.timed_hashes === 'object' ? run.timed_hashes
    : run.file_hashes && typeof run.file_hashes === 'object' ? run.file_hashes : null;
  if (timed.length === 0 || !hashes) {
    out(`label-tests: run ${args.run} timed no test — a step close (--files or --tied) times its tests, and any run records the ones it timed out\n`);
    return 2;
  }
  const threshold = slowLine(tree);
  const ownLabels = records.filter((r) => r.source === 'label-tests' && r.run_id === args.run && r.files && typeof r.files === 'object');
  const wanted = args.reasons.map(({ at, reason }) => {
    const m = /^(.*):(\d+)$/.exec(String(at || ''));
    return m ? { file: m[1].replace(/\\/g, '/'), line: Number(m[2]), reason, done: false } : { file: String(at), line: 0, reason, done: false };
  });

  const files = {};
  const yamls = new Set();
  const timedFiles = [...new Set([...Object.keys(run.timed_hashes || {}), ...timedOut.map((t) => t.file)])];
  for (const file of timedFiles.sort()) {
    const kind = kindOf(file);
    if (!kind) continue;
    const before = hashes[file];
    const current = fileHash(tree, file);
    const prior = ownLabels.filter((r) => r.files[file]).map((r) => r.files[file]).at(-1);
    let shifts;
    if (current !== null && current === before) shifts = [];
    else if (prior && current !== null && prior.after === current) shifts = Array.isArray(prior.shifts) ? [...prior.shifts] : [];
    else {
      out(`label-tests: skipped ${file} — changed since run ${args.run}, so its timed positions no longer hold\n`);
      continue;
    }
    const original = fs.readFileSync(path.join(tree, file), 'utf8');
    let text = original;
    if (kind === 'dotnet') {
      text = labelDotnet(file, original, timed.filter((t) => t.file === file && t.class && t.method), threshold, wanted, out);
      if (text === original) continue;
      fs.writeFileSync(path.join(tree, file), text);
      files[file] = { before, after: fileHash(tree, file), shifts };
      out(`label-tests: ${file} — labelled from run ${args.run} (slow line ${threshold} ms)\n`);
      continue;
    }
    const tests = timed.filter((t) => t.file === file && Number.isInteger(t.line))
      .map((t) => (Number.isInteger(t.column) ? t : { ...t, column: firstColumn(original, mapLine(shifts, t.line)) }));
    if (kind === 'node') {
      const tagged = retagNodeSource(original, tests.map((t) => ({ line: mapLine(shifts, t.line), column: t.column, slow: t.ms >= threshold })));
      text = tagged.text;
      for (const where of tagged.missing) out(`label-tests: ${file} ${where} — the test's name is not a literal, so no label was written\n`);
    } else {
      for (const t of tests) {
        const edit = labelDartCall(text, mapLine(shifts, t.line), t.column, t.ms >= threshold);
        if (!edit.found) out(`label-tests: ${file}:${t.line} — no test() call at the reported position, so no label was written\n`);
        text = edit.text;
      }
      if (tests.some((t) => t.ms >= threshold)) yamls.add(file);
    }
    // Bottom-up by run line, so each edit's line count moves only the tests below it, which are done.
    for (const t of [...tests].sort((a, b) => b.line - a.line)) {
      const asked = wanted.find((w) => w.file === file && w.line === t.line);
      let edit = { text, delta: 0 };
      if (t.ms < threshold) {
        edit = clearNodeReason(text, mapLine(shifts, t.line));
        if (asked) { asked.done = true; out(`label-tests: ${file}:${t.line} ran under the slow line (${Math.round(t.ms)} ms) — no reason written\n`); }
      } else if (asked) {
        edit = setNodeReason(text, mapLine(shifts, t.line), asked.reason || 'kept slow');
        asked.done = true;
      }
      text = edit.text;
      if (edit.delta) shifts.push({ at: t.line, delta: edit.delta });
    }
    if (text === original) continue;
    fs.writeFileSync(path.join(tree, file), text);
    files[file] = { before, after: fileHash(tree, file), shifts };
    out(`label-tests: ${file} — labelled from run ${args.run} (slow line ${threshold} ms)\n`);
  }
  // A Flutter project declares the tag its tests now carry, so `flutter test` does not warn on it.
  for (const project of new Set([...yamls].map((f) => dartProjectDir(tree, f)).filter(Boolean))) {
    const yaml = path.relative(tree, path.join(project, 'dart_test.yaml')).split(path.sep).join('/');
    const was = fs.existsSync(path.join(tree, yaml)) ? fs.readFileSync(path.join(tree, yaml), 'utf8') : null;
    const merged = mergeDartTestYaml(was);
    if (merged === null) { out(`label-tests: ${yaml} — its tags: is not a block map; add "slow: {}" under it by hand\n`); continue; }
    if (merged === was) continue;
    const before = was === null ? null : fileHash(tree, yaml);
    fs.writeFileSync(path.join(tree, yaml), merged);
    files[yaml] = { before, after: fileHash(tree, yaml), shifts: [] };
    out(`label-tests: ${yaml} — the slow tag declared\n`);
  }
  for (const w of wanted.filter((x) => !x.done)) out(`label-tests: ${w.file}:${w.line} is no test run ${args.run} timed — no reason written\n`);
  if (Object.keys(files).length) {
    try {
      fs.mkdirSync(path.join(root, '.claude', 'audit'), { recursive: true });
      fs.appendFileSync(path.join(root, ...LOG), `${JSON.stringify({ ts: new Date().toISOString(), source: 'label-tests', run_id: args.run, tree, files })}\n`);
    } catch { out('label-tests: the label record could not be written — the labelled files will read as changed since the run\n'); }
  }
  return wanted.some((w) => !w.done) ? 1 : 0;
}

module.exports = { main };

if (require.main === module) process.exit(main());
