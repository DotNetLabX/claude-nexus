#!/usr/bin/env node
/**
 * Nexus light-path risk recheck (F232). Run by hand — NOT a registered hook. The architect finds it
 * beside verify-run.js; no line in the session's plugin-paths block names it.
 *
 *   risk-recheck.js --repo {tree} --slug {slug} --base {ref} [--exclude {path}…]
 *   risk-recheck.js --match {path}…
 *   risk-recheck.js --help
 *
 * Exit codes are the contract: 0 — a result was printed; 2 — the recheck could not run, and it
 * printed `Risky steps: recheck failed — {why}; every step treated risky`. Its result decides whether
 * a second code reader runs, so a failure must never read as "nothing risky".
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { matchKinds, KIND_IDS } = require('./lib/sensitive-paths');

const USAGE = [
  'Usage:',
  '  risk-recheck.js --repo {tree} --slug {slug} --base {ref} [--exclude {path}…]',
  '      the handover recheck: JSON, then the ready-made `Risky steps:` line',
  '  risk-recheck.js --match {path}…',
  '      the planner\'s form: the sensitive kind each path matches, or none',
  '  risk-recheck.js --help',
].join('\n');

class RecheckFailed extends Error {}

function say(line) {
  process.stdout.write(`${line}\n`);
}

function fail(why) {
  throw new RecheckFailed(why);
}

function failedLine(why) {
  return `Risky steps: recheck failed — ${why}; every step treated risky`;
}

function parseArgs(argv) {
  const opts = { exclude: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const name = a.startsWith('--') && eq !== -1 ? a.slice(0, eq) : a;
    const inline = a.startsWith('--') && eq !== -1 ? a.slice(eq + 1) : undefined;
    if (!['--repo', '--slug', '--base', '--exclude'].includes(name)) fail(`unknown argument ${a}`);
    let value = inline;
    if (value === undefined) {
      value = argv[i + 1];
      i += 1;
    }
    if (value === undefined || value === '' || value.startsWith('--')) fail(`${name} was given with no value`);
    if (name === '--exclude') opts.exclude.push(value);
    else opts[name.slice(2)] = value;
  }
  for (const req of ['repo', 'slug', 'base']) if (!opts[req]) fail(`--${req} is required`);
  return opts;
}

// Array form, shell false: a shell string loses `^{commit}`'s caret to cmd.exe on Windows.
function git(root, ...args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function readRequired(file, label) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    return fail(`cannot read ${label} (${err.code || 'unreadable'})`);
  }
}

const STEP_HEADING = /^#{2,4}\s+Step\s+(\d+[a-z]?)\b.*$/gim;

// Each `Step N` heading opens a block that runs to the next heading of any level.
function stepBlocks(text, headingRe) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    headingRe.lastIndex = 0;
    const m = headingRe.exec(line);
    if (m) {
      current = { id: m[1].toLowerCase(), lines: [] };
      blocks.push(current);
    } else if (/^#{1,4}\s/.test(line)) {
      current = null;
    } else if (current) {
      current.lines.push(line);
    }
  }
  return blocks;
}

function pathsIn(text) {
  const ticked = [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  const list = ticked.length ? ticked : text.split(/[,;]/).map((s) => s.trim());
  return list.filter((p) => p && !/\s/.test(p));
}

// A light-format step's planned files: the `Files:` field of its body line, up to the next ` · ` field.
// The `Risk:` mark is anchored the same way, so a field quoting either literal is not read as one.
function plannedFiles(lines) {
  const out = [];
  for (const line of lines) {
    for (const m of line.matchAll(/(?:^|·)\s*(?:\*\*)?`?Files:`?(?:\*\*)?\s*([^·]*)/g)) out.push(...pathsIn(m[1]));
  }
  return out;
}

function parsePlan(text) {
  return stepBlocks(text, STEP_HEADING).map((b) => ({
    id: b.id,
    risky: b.lines.some((l) => /(?:^|·)\s*(?:\*\*)?Risk:\s*(?:\*\*)?\s*risky\b/i.test(l)),
    planned: plannedFiles(b.lines),
  }));
}

// An implementation.md step block: its `Files:` field runs from that line to the next bold field.
function parseImplementation(text) {
  return stepBlocks(text, /^##\s+Step\s+(\d+[a-z]?)\b.*$/gi).map((b) => {
    const files = [];
    let inFiles = false;
    let raised = false;
    for (const line of b.lines) {
      if (/^\s*(?:\*\*)?Risk raised:/i.test(line)) raised = true;
      if (/^\s*(?:\*\*)?Files:/.test(line)) inFiles = true;
      else if (/^\s*\*\*[^*]+:\*\*/.test(line)) inFiles = false;
      if (inFiles) files.push(line);
    }
    return { id: b.id, filesText: files.join('\n'), raised };
  });
}

function normalisePath(p, roots) {
  let s = String(p).replace(/\\/g, '/').replace(/^\.\//, '');
  for (const root of roots) {
    if (root && s.toLowerCase().startsWith(`${root.toLowerCase()}/`)) s = s.slice(root.length + 1);
  }
  return s.replace(/\/+$/, '');
}

const OPEN = new Set([' ', '\t', '`', '"', "'", '(', '[', ',', ';', '*', '|']);
const CLOSE = new Set([' ', '\t', '`', '"', "'", ')', ']', ',', ';', '*', '|', ':']);

// Whether a step's Files text cites the changed file: the literal, bounded on both sides.
function names(text, file) {
  let from = 0;
  for (;;) {
    const i = text.indexOf(file, from);
    if (i === -1) return false;
    from = i + 1;
    if (i > 0 && !OPEN.has(text[i - 1]) && text[i - 1] !== '\n') continue;
    const j = i + file.length;
    if (j === text.length || CLOSE.has(text[j]) || text[j] === '\n' || text[j] === '\r') return true;
    if (text[j] === '.' && (j + 1 === text.length || /\s/.test(text[j + 1]))) return true;
  }
}

function collect(set, res, what) {
  if (res.status !== 0) {
    const code = res.error && res.error.code;
    fail(`${what} failed (${code || `git exited ${res.status}`})`);
  }
  for (const p of (res.stdout || '').split('\0')) if (p) set.add(p);
}

function changedFiles(root, base) {
  const set = new Set();
  // `--no-renames`: rename detection reports only the new path, and a migration renamed away is a change.
  collect(set, git(root, 'diff', '--name-only', '-z', '--no-renames', base, '--'), 'git diff');
  collect(set, git(root, 'ls-files', '--others', '--exclude-standard', '--full-name', '-z'), 'git ls-files');
  return [...set].sort();
}

function kindsOf(files) {
  const found = new Set(files.flatMap((f) => matchKinds(f)));
  return KIND_IDS.filter((k) => found.has(k));
}

function recheck(opts) {
  let stat = null;
  try { stat = fs.statSync(opts.repo); } catch { /* reported below */ }
  if (!stat || !stat.isDirectory()) fail(`--repo is not a directory: ${opts.repo}`);
  const featureFolder = `docs/specs/${opts.slug}`;
  const delivery = `${featureFolder}/delivery`;
  const planText = readRequired(path.join(opts.repo, ...delivery.split('/'), 'plan.md'), `${delivery}/plan.md`);
  const implText = readRequired(path.join(opts.repo, ...delivery.split('/'), 'implementation.md'), `${delivery}/implementation.md`);
  if (git(opts.repo, 'rev-parse', '--git-dir').status !== 0) fail(`${opts.repo} is not a git repository`);
  if (git(opts.repo, 'rev-parse', '--verify', '--quiet', `${opts.base}^{commit}`).status !== 0) {
    fail(`base ${opts.base} does not resolve`);
  }

  const top = git(opts.repo, 'rev-parse', '--show-toplevel').stdout.trim();
  const roots = [path.resolve(opts.repo).replace(/\\/g, '/'), top.replace(/\\/g, '/')];
  const excludes = [featureFolder, ...opts.exclude].map((e) => normalisePath(e, roots)).filter(Boolean);
  const changed = changedFiles(opts.repo, opts.base)
    .filter((f) => !excludes.some((e) => f === e || f.startsWith(`${e}/`)));

  const plan = parsePlan(planText);
  const impl = parseImplementation(implText);
  const order = [...plan.map((s) => s.id), ...impl.map((s) => s.id)].filter((id, i, all) => all.indexOf(id) === i);

  const stepFiles = new Map(order.map((id) => [id, []]));
  const named = new Set();
  for (const block of impl) {
    const text = roots.filter(Boolean).reduce(
      (s, r) => s.replace(new RegExp(`${r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'gi'), () => ''),
      block.filesText.replace(/\\/g, '/'),
    );
    for (const file of changed) {
      if (!names(text, file)) continue;
      if (!stepFiles.get(block.id).includes(file)) stepFiles.get(block.id).push(file);
      named.add(file);
    }
  }

  const sources = new Map();
  for (const id of order) {
    const p = plan.find((s) => s.id === id);
    const b = impl.find((s) => s.id === id);
    const list = [];
    const planned = p ? kindsOf(p.planned) : [];
    if (planned.length) list.push(`kind: ${planned.join(', ')}`);
    if (p && p.risky) list.push('architect');
    if (b && b.raised) list.push('developer');
    if (!list.length) {
      const hit = kindsOf(stepFiles.get(id));
      if (hit.length) list.push(`recheck: ${hit.join(', ')}`);
    }
    sources.set(id, list);
  }
  for (let spread = true; spread;) {
    spread = false;
    const risky = order.filter((id) => sources.get(id).length);
    for (const id of order) {
      if (sources.get(id).length) continue;
      const mine = stepFiles.get(id);
      const partner = risky.find((other) => stepFiles.get(other).some((f) => mine.includes(f)));
      if (partner) {
        sources.set(id, [`recheck: shared with Step ${partner}`]);
        spread = true;
      }
    }
  }

  const steps = order.filter((id) => sources.get(id).length)
    .map((id) => ({ step: id, sources: sources.get(id), files: [...stepFiles.get(id)].sort() }));
  const unnamed = changed.filter((f) => !named.has(f));
  const items = unnamed.map((file) => ({ file, kinds: matchKinds(file) })).filter((i) => i.kinds.length);
  const unplanned = unnamed.filter((f) => matchKinds(f).length === 0);
  return { steps, items, unplanned };
}

function riskyLine({ steps, items, unplanned }) {
  const parts = [
    ...steps.map((s) => `Step ${s.step} (${s.sources.join('; ')})`),
    ...items.map((i) => `item ${i.file} (${i.kinds.join(', ')})`),
  ];
  return `Risky steps: ${parts.length ? parts.join(', ') : 'none'} · Unplanned: ${unplanned.length ? unplanned.join(', ') : 'none'}`;
}

function main(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') {
    say(USAGE);
    process.exit(0);
  }
  if (argv[0] === '--match') {
    if (argv.length < 2) {
      say(USAGE);
      process.exit(2);
    }
    for (const p of argv.slice(1)) {
      const kinds = matchKinds(p);
      say(`${p}: ${kinds.length ? kinds.join(', ') : 'none'}`);
    }
    process.exit(0);
  }
  try {
    const result = recheck(parseArgs(argv));
    const line = riskyLine(result);
    say(JSON.stringify({ ...result, line }));
    say(line);
    process.exit(0);
  } catch (err) {
    const why = err instanceof RecheckFailed ? err.message : `unexpected error: ${String(err && err.message || err).split(/\r?\n/)[0]}`;
    const line = failedLine(why);
    say(JSON.stringify({ failed: why, line }));
    say(line);
    process.exit(2);
  }
}

main(process.argv.slice(2));
