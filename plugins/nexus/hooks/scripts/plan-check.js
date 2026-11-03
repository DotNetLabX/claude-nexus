#!/usr/bin/env node
/**
 * Nexus plan check (F328). Run by hand — it sits beside the step runner in the core plugin's scripts
 * folder — and registered as a PostToolUse(Write|Edit) hook with `--hook`.
 *
 *   plan-check.js --plan {path} [--repo {tree}] [--no-run]
 *   plan-check.js --hook        (stdin: the PostToolUse event)
 *   plan-check.js --help
 *
 * HOOK MODE acts only on a write of a `delivery/plan.md` under `docs/specs/` (a nested issue's too)
 * and runs the three checks with `--no-run`, from the git root holding the plan — never CLAUDE_PROJECT_DIR, so a worktree round
 * checks the worktree. Findings come back as the PostToolUse additionalContext, ending with the line
 * that asks for the full run before the review; no finding, a git call that failed or timed out, or
 * any error, is exit 0 with nothing printed. SYNCHRONOUS: only a synchronous hook's output reaches the model.
 *
 * Three checks over a plan's step blocks, light and full format alike:
 *   A — a backticked span in an `Accept:` that is a raw test command, or asks for the complete run;
 *       a step whose heading marks it `Owner: close` or `Owner: operator` is skipped.
 *   B — a backticked repo-relative path that does not exist, is not git-ignored, and that no step at
 *       or before this one lists under `Files:`.
 *   C — a search in an `Accept:` (`grep`, `rg`, `git grep`) with no `(plan time: N)` result after it;
 *       unless `--no-run`, a search in a safe form is re-run and its value compared.
 * It reports and never refuses, and it never writes a file. The comparison is a plan-time tool: a step
 * already built moves its counts by design.
 *
 * Every program it starts is looked up on PATH by absolute path, passing over the current folder, the
 * repository and any relative PATH entry, each compared as a real path once links and prefixes are
 * resolved, and the repository is found from the real start folder: a `git` or `rg` planted in a
 * checked-out tree never runs. A search's path operand is judged where it really leads.
 *
 * Exit codes are the contract: 0 — no finding; 1 — findings; 2 — it could not run, and it printed
 * `plan-check: cannot run — {why}`.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const USAGE = [
  'Usage:',
  '  plan-check.js --plan {path} [--repo {tree}] [--no-run]',
  '      findings, then notes, then one summary line',
  '  plan-check.js --help',
].join('\n');

const SEARCH_TIMEOUT_MS = 10000;
const PLAN_BUDGET_MS = 60000;
const GIT_TIMEOUT_MS = 5000;

class CannotRun extends Error {}

function fail(why) {
  throw new CannotRun(why);
}

const within = (dir, top) => {
  const rel = path.relative(top, dir);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

// Containment holds only between real paths: a `\\?\` prefix, a junction, a symlink or a short name
// would otherwise reach the repository under another spelling. An entry that cannot be resolved is
// passed over.
function canonical(p) {
  try { return fs.realpathSync.native(p); } catch { return null; }
}

const realPath = (p) => canonical(p) || path.resolve(p);

// The nearest folder at or above `dir` holding `.git`: before git has named the root, a subfolder's
// repository must still be passed over. The walk starts from the real folder, since the spelled
// parents of a link lead away from the repository it points into.
function treeAbove(dir) {
  const start = realPath(dir);
  for (let d = start; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    if (path.dirname(d) === d) return start;
  }
}

const unquote = (s) => (s.length >= 2 && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s);

// Windows starts only an .exe or .com without a shell.
function findProgram(name, repo) {
  const names = process.platform === 'win32' ? [`${name}.exe`, `${name}.com`] : [name];
  const cwd = realPath(process.cwd());
  const top = repo ? treeAbove(repo) : null;
  const passOver = (dir) => path.relative(cwd, dir) === '' || (top && within(dir, top));
  for (const entry of (process.env.PATH || '').split(path.delimiter)) {
    const dir = unquote(entry);
    if (!dir || !path.isAbsolute(dir)) continue;
    const full = canonical(dir);
    if (!full || passOver(full)) continue;
    for (const n of names) {
      const file = path.join(full, n);
      const real = canonical(file);
      if (!real || passOver(path.dirname(real)) || (top && within(real, top))) continue;
      try {
        if (!fs.statSync(file).isFile()) continue;
        fs.accessSync(file, fs.constants.X_OK);
        return file;
      } catch { /* the next candidate */ }
    }
  }
  return null;
}

// The result, or `{ failed }` when git could not be started or ran past its time limit.
function git(root, args, input) {
  const program = findProgram('git', root);
  if (!program) return { failed: 'git is not on PATH outside the repository' };
  const res = spawnSync(program, args, {
    cwd: root, encoding: 'utf8', input, shell: false, windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error && res.error.code === 'ETIMEDOUT') return { failed: 'git timed out' };
  if (res.error || res.signal) return { failed: `git cannot run (${(res.error && res.error.code) || res.signal})` };
  return res;
}

// ---- the step reader ----

const STEP_HEADING = /^#{2,4}\s+Step\s+(\d+[a-z]?)\b(.*)$/i;
const HEADING = /^#{1,6}\s/;
const FENCE = /^\s*(`{3,}|~{3,})/;
const FIELD_AT_LINE = /^(\s*)(?:[-*]\s+)?(?:\*\*)?(Files|Accept):(?:\*\*)?\s*/;
const FIELD_AFTER_DOT = /^\s*(?:\*\*)?(Files|Accept):(?:\*\*)?\s*/;
const LIST_ITEM = /^(\s*)[-*]\s/;
const OWNER_SKIP = /\bOwner:\s*(?:close|operator)\b/i;

// Each `Step N` heading opens a block that runs to the next heading. A fenced sample is neither a
// heading nor read at all: a quoted template's `Accept:` line is no instruction. A fence closes only
// on a bare fence of its own character, at least as long.
function stepBlocks(text) {
  const blocks = [];
  let current = null;
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const f = FENCE.exec(line);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && !line.slice(f[0].length).trim()) fence = null;
      continue;
    }
    if (f) { fence = f[1]; continue; }
    const m = STEP_HEADING.exec(line);
    if (m) {
      current = { id: m[1].toLowerCase(), heading: m[2], lines: [] };
      blocks.push(current);
    } else if (HEADING.test(line)) {
      current = null;
    } else if (current) {
      current.lines.push(line);
    }
  }
  return blocks;
}

// ` · ` separates fields only outside a code span.
function dotSegments(line) {
  const segs = [];
  let start = 0;
  let code = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '`') code = !code;
    else if (!code && line.startsWith(' · ', i)) {
      segs.push(line.slice(start, i));
      start = i + 3;
      i += 2;
    }
  }
  segs.push(line.slice(start));
  return segs;
}

// A field runs to the next field, the next ` · `, the next list item at its own indent or shallower,
// a blank line or the block's end.
function fieldsOf(lines) {
  const fields = [];
  let current = null;
  const close = () => {
    if (current) fields.push({ name: current.name, text: current.parts.join('\n') });
    current = null;
  };
  for (const line of lines) {
    if (!line.trim()) { close(); continue; }
    const item = LIST_ITEM.exec(line);
    if (current && item && item[1].length <= current.indent) close();
    dotSegments(line).forEach((seg, i) => {
      if (i > 0) close();
      const m = (i === 0 ? FIELD_AT_LINE : FIELD_AFTER_DOT).exec(seg);
      if (m) {
        close();
        const indent = i === 0 ? m[1].length : Infinity;
        current = { name: m[i === 0 ? 2 : 1], indent, parts: [seg.slice(m[0].length)] };
      } else if (current && i === 0) {
        current.parts.push(seg);
      }
    });
  }
  close();
  return fields;
}

// `text` is the span as shown; `raw` keeps its spacing for a run, a line wrap read as one space.
function spans(text) {
  return [...text.matchAll(/(?<!`)`([^`]+)`(?!`)/g)].map((m) => ({
    text: m[1].replace(/\s+/g, ' ').trim(),
    raw: m[1].replace(/\r?\n\s*/g, ' ').trim(),
    start: m.index,
    end: m.index + m[0].length,
  }));
}

const normalise = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '');

function filesListed(fields) {
  const out = [];
  for (const f of fields.filter((x) => x.name === 'Files')) {
    const ticked = spans(f.text).map((s) => s.text);
    const list = ticked.length ? ticked : f.text.split(/[,;]/).map((s) => s.trim());
    for (const p of list) if (p && !/\s/.test(p)) out.push(normalise(p));
  }
  return out;
}

function parsePlan(text) {
  return stepBlocks(text).map((b) => {
    const fields = fieldsOf(b.lines);
    return {
      id: b.id,
      skipA: OWNER_SKIP.test(b.heading),
      body: b.lines.join('\n'),
      accepts: fields.filter((f) => f.name === 'Accept').map((f) => f.text),
      files: filesListed(fields),
    };
  });
}

// ---- check A ----

// Loaded on first use: the hook runs on every Write and Edit, and most are not a plan.
function checkA(step) {
  if (step.skipA) return [];
  const { isRawTestCommand } = require('./test-entry-gate');
  const out = [];
  for (const field of step.accepts) {
    for (const s of spans(field)) {
      if (isRawTestCommand(s.text)) out.push(`step ${step.id}: raw test command in Accept: ${s.text} — name the test file; the step run takes it`);
      else if (/--profile\s+complete\b/.test(s.text)) out.push(`step ${step.id}: complete run in Accept: ${s.text} — asks for the complete run, which the developer seat cannot make`);
    }
  }
  return out;
}

// ---- check B ----

const LINE_RANGE = '\\d+(?:[-–]\\d+)?';
const LINE_CITE = new RegExp(`(?::${LINE_RANGE}(?:,${LINE_RANGE})*|#L\\d+(?:-L?\\d+)?)$`);

function pathCandidate(token) {
  if (!token.includes('/') || /[\s{<*]/.test(token)) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(token) || /^(?:[a-zA-Z]:|[/\\~])/.test(token)) return null;
  const p = path.posix.normalize(normalise(token.replace(LINE_CITE, '')));
  if (p.startsWith('../') || p === '..' || p.endsWith('/')) return null;
  return /\.[^/.]+$/.test(p.split('/').pop()) ? p : null;
}

const parentOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

// The ignored paths as `{ set }`, or `{ why }` when git could not answer: a failed answer is never
// read as "nothing ignored".
function ignoredSet(repo, candidates) {
  if (!candidates.length) return { set: new Set() };
  const res = git(repo, ['check-ignore', '--stdin', '-z'], `${candidates.join('\0')}\0`);
  if (res.failed) return { why: res.failed };
  if (res.status !== 0 && res.status !== 1) return { why: `git check-ignore failed (exit ${res.status})` };
  return { set: new Set((res.stdout || '').split('\0').map(normalise).filter(Boolean)) };
}

// A `Files:` entry ending in `/` lists the whole folder.
const lists = (step, p) => step.files.some((f) => f === p || (f.endsWith('/') && p.startsWith(f)));

function checkB(steps, repo) {
  const perStep = steps.map((s) => [...new Set(spans(s.body).map((x) => pathCandidate(x.text)).filter(Boolean))]);
  const missing = [...new Set(perStep.flat())].filter((p) => !fs.existsSync(path.join(repo, ...p.split('/'))));
  const out = steps.map(() => []);
  const ignored = ignoredSet(repo, missing);
  if (ignored.why) return { out, cannot: `check B: cannot run — ${ignored.why}; check the new paths by hand` };
  const folders = new Set(steps.flatMap((s) => s.files.map(parentOf)));
  steps.forEach((step, i) => {
    for (const p of perStep[i]) {
      if (!missing.includes(p) || ignored.set.has(p)) continue;
      if (steps.slice(0, i + 1).some((s) => lists(s, p))) continue;
      const later = steps.slice(i + 1).find((s) => lists(s, p));
      if (later) out[i].push(`step ${step.id}: ${p} is created only in step ${later.id}`);
      else if (folders.has(parentOf(p))) out[i].push(`step ${step.id}: no step creates ${p}`);
    }
  });
  return { out, cannot: null };
}

// ---- check C ----

const SEARCH = /^(?:grep|rg|git grep)\s/;
const GIT_SEARCH = /^git\s(?:\S+\s)*grep\s/;
const PLAN_TIME = /\(plan time:\s*(\d+|none)\s*\)/i;

const FLAGS = {
  grep: {
    short: new Set('cnlLrRiIEFPwxeHhvoqsABC'),
    shortValued: new Set('eABC'),
    long: new Set(['--count', '--include', '--exclude', '--exclude-dir']),
    longValued: new Set(['--include', '--exclude', '--exclude-dir']),
  },
  rg: {
    short: new Set('cnlisSFPwxeHvoUgtABC'),
    shortValued: new Set('egtABC'),
    long: new Set(['--count', '--glob', '--type', '--multiline', '--fixed-strings']),
    longValued: new Set(['--glob', '--type']),
  },
};
FLAGS['git grep'] = { ...FLAGS.grep, long: new Set([...FLAGS.grep.long, '--untracked']) };

// Words as a POSIX shell splits them; `unsafe` names an operator outside quotes, or an expansion the
// shell would make outside quotes or inside double quotes.
function shellWords(s) {
  const words = [];
  let word = null;
  const expansion = (i) => s[i] === '$' && /[({A-Za-z_]/.test(s[i + 1] || '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'") {
      const j = s.indexOf("'", i + 1);
      if (j === -1) return { unsafe: 'unclosed quote' };
      word = (word || '') + s.slice(i + 1, j);
      i = j;
    } else if (c === '"') {
      let j = i + 1;
      let buf = '';
      for (; j < s.length && s[j] !== '"'; j++) {
        if (s[j] === '\\' && j + 1 < s.length && '$`"\\'.includes(s[j + 1])) { buf += s[j + 1]; j++; } else if (expansion(j)) return { unsafe: `$${s[j + 1]}` };
        else buf += s[j];
      }
      if (j >= s.length) return { unsafe: 'unclosed quote' };
      word = (word || '') + buf;
      i = j;
    } else if (c === '\\') {
      word = (word || '') + (s[i + 1] || '');
      i += 1;
    } else if (/\s/.test(c)) {
      if (word !== null) words.push(word);
      word = null;
    } else if ('|;&<>`'.includes(c)) {
      return { unsafe: c };
    } else if (expansion(i)) {
      return { unsafe: `$${s[i + 1]}` };
    } else {
      word = (word || '') + c;
    }
  }
  if (word !== null) words.push(word);
  return { words };
}

// The program, its arguments and its path operands — or `why` it is not a safe form.
function safeForm(span) {
  const parsed = shellWords(span);
  if (parsed.unsafe) return { why: `not a safe form (${parsed.unsafe})` };
  const words = parsed.words;
  let kind;
  let rest;
  if (words[0] === 'grep' || words[0] === 'rg') [kind, rest] = [words[0], words.slice(1)];
  else if (words[0] === 'git' && words[1] === 'grep') [kind, rest] = ['git grep', words.slice(2)];
  else if (words[0] === 'git') return { why: 'git option before grep' };
  else return { why: 'not a safe form' };
  const flags = FLAGS[kind];
  const operands = [];
  let pattern = false;
  let ended = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (ended || a === '-' || !a.startsWith('-')) { operands.push({ word: a, afterEnd: ended }); continue; }
    if (a === '--') { ended = true; continue; }
    if (a.startsWith('--')) {
      const name = a.includes('=') ? a.slice(0, a.indexOf('=')) : a;
      if (!flags.long.has(name)) return { why: `unrecognised flag ${name}` };
      if (flags.longValued.has(name) && !a.includes('=')) i += 1;
      continue;
    }
    for (let k = 1; k < a.length; k++) {
      const letter = a[k];
      if (!flags.short.has(letter)) return { why: `unrecognised flag -${letter}` };
      if (flags.shortValued.has(letter)) {
        if (letter === 'e') pattern = true;
        if (k === a.length - 1) i += 1;
        break;
      }
    }
  }
  const paths = operands.slice(pattern ? 0 : 1)
    .filter((o) => kind !== 'git grep' || o.afterEnd || /[./]/.test(o.word))
    .map((o) => o.word)
    .filter((w) => w !== '-');
  if (paths.some((w) => /[*?[]/.test(w))) return { why: 'wildcard operand' };
  const [program, args] = kind === 'git grep' ? ['git', ['grep', ...rest]]
    : kind === 'rg' ? ['rg', ['--no-config', ...rest]] : [kind, rest];
  return { program, args, paths };
}

const MISSING_FILE = /No such file|cannot find the (?:file|path)|not in the working tree|does not exist/i;

function valueOf(stdout) {
  const t = String(stdout || '').trim();
  if (/^\d+$/.test(t)) return Number(t);
  return t.split(/\r?\n/).filter((l) => l.trim()).length;
}

function searchEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.toUpperCase() === 'RIPGREP_CONFIG_PATH') delete env[k];
  return env;
}

function runSearch(form, repo, budget) {
  const left = budget.until - Date.now();
  if (left <= 0) return { why: 'past the time budget' };
  const program = findProgram(form.program, repo);
  if (!program) return { why: `${form.program} is not on PATH outside the repository` };
  const res = spawnSync(program, form.args, {
    cwd: repo, env: searchEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: false, windowsHide: true,
    timeout: Math.min(SEARCH_TIMEOUT_MS, left), maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error && res.error.code !== 'ETIMEDOUT') return { why: `${form.program} cannot run (${res.error.code})` };
  if (res.error || res.signal) return { why: 'past the time limit' };
  const stderr = (res.stderr || '').split(/\r?\n/).find((l) => l.trim()) || '';
  if (res.status >= 2) return MISSING_FILE.test(stderr) ? { why: `a file does not exist (${stderr.trim()})` } : { fails: stderr.trim() };
  return { value: valueOf(res.stdout) };
}

// A path operand that exists is judged where it really leads: a link inside the repo may point out.
const insideRepo = (repo, p) => {
  const full = path.resolve(repo, p);
  const found = canonical(full);
  return found ? within(found, realPath(repo)) : within(full, repo);
};

function checkC(step, repo, opts, budget, tally) {
  const findings = [];
  const notes = [];
  for (const field of step.accepts) {
    const list = spans(field);
    list.forEach((s, i) => {
      if (!SEARCH.test(s.text) && !GIT_SEARCH.test(s.text)) return;
      const tail = field.slice(s.end, i + 1 < list.length ? list[i + 1].start : field.length);
      const note = PLAN_TIME.exec(tail);
      if (!note) {
        findings.push(`step ${step.id}: search has no plan-time result: ${s.text}`);
        return;
      }
      if (opts.noRun) { tally.notRun += 1; return; }
      const said = note[1].toLowerCase();
      const expected = said === 'none' ? 0 : Number(said);
      const form = safeForm(s.raw);
      const outside = form.paths && form.paths.find((p) => !insideRepo(repo, p));
      const absent = form.paths && form.paths.find((p) => !fs.existsSync(path.resolve(repo, p)));
      const result = form.why ? form
        : outside ? { why: `${outside} is outside the repo` }
          : absent ? { why: `${absent} does not exist` } : runSearch(form, repo, budget);
      if (result.why) {
        tally.notRun += 1;
        notes.push(`step ${step.id}: not run — ${result.why}; check by hand: ${s.text}`);
        return;
      }
      tally.run += 1;
      if (result.fails !== undefined) findings.push(`step ${step.id}: the search fails: ${result.fails}: ${s.text}`);
      else if (result.value !== expected) findings.push(`step ${step.id}: plan time says ${said}, now ${result.value}: ${s.text}`);
    });
  }
  return { findings, notes };
}

// ---- the plan ----

function checkPlan(text, repo, opts = {}) {
  const steps = parsePlan(text);
  if (!steps.length) return null;
  const b = checkB(steps, repo);
  const budget = { until: Date.now() + PLAN_BUDGET_MS };
  const tally = { run: 0, notRun: 0 };
  const findings = [];
  const notes = [];
  steps.forEach((step, i) => {
    const c = checkC(step, repo, opts, budget, tally);
    findings.push(...checkA(step), ...b.out[i], ...c.findings);
    notes.push(...c.notes);
  });
  return { findings, notes, cannot: b.cannot ? [b.cannot] : [], run: tally.run, notRun: tally.notRun };
}

function summaryLine(result) {
  return `plan-check: ${result.findings.length} findings, ${result.run} searches run, ${result.notRun} not run`
    + ' — searches compare with plan-time results; run before the build';
}

// The work tree's root, or null outside one; a git that cannot run is CannotRun, never "no tree".
function gitRoot(dir) {
  const res = git(realPath(dir), ['rev-parse', '--show-toplevel']);
  if (res.failed) fail(res.failed);
  return res.status === 0 ? realPath(res.stdout.trim()) : null;
}

function parseArgs(argv) {
  const opts = { noRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-run') { opts.noRun = true; continue; }
    const eq = a.indexOf('=');
    const name = a.startsWith('--') && eq !== -1 ? a.slice(0, eq) : a;
    if (name !== '--plan' && name !== '--repo') fail(`unknown argument ${a}`);
    const value = eq !== -1 && a.startsWith('--') ? a.slice(eq + 1) : argv[++i];
    if (!value || value.startsWith('--')) fail(`${name} was given with no value`);
    opts[name.slice(2)] = value;
  }
  if (!opts.plan) fail('--plan is required');
  return opts;
}

function cli(argv) {
  const say = (line) => process.stdout.write(`${line}\n`);
  if (argv[0] === '--help' || argv[0] === '-h') {
    say(USAGE);
    return 0;
  }
  try {
    const opts = parseArgs(argv);
    let text;
    try { text = fs.readFileSync(opts.plan, 'utf8'); } catch (err) { fail(`cannot read the plan ${opts.plan} (${err.code || 'unreadable'})`); }
    const repo = opts.repo ? realPath(opts.repo) : gitRoot(path.dirname(path.resolve(opts.plan)));
    if (!repo) fail(`${path.dirname(opts.plan)} is not inside a git work tree; pass --repo`);
    const result = checkPlan(text, repo, opts);
    if (!result) fail(`no step found in ${opts.plan}`);
    for (const line of [...result.findings, ...result.notes, ...result.cannot]) say(line);
    say(summaryLine(result));
    return result.findings.length ? 1 : 0;
  } catch (err) {
    const why = err instanceof CannotRun ? err.message : `unexpected error: ${String(err && err.message || err).split(/\r?\n/)[0]}`;
    say(`plan-check: cannot run — ${why}`);
    return 2;
  }
}

// ---- the hook mode ----

const PLAN_PATH = /(?:^|\/)docs\/specs\/(?:[^/]+\/)+delivery\/plan\.md$/;

// The PostToolUse context for a plan save, or '' when there is nothing to say or a check could not run.
function hookContext(evt) {
  const ti = (evt && evt.tool_input) || {};
  if (typeof ti.file_path !== 'string' || !ti.file_path) return '';
  const file = path.resolve(evt.cwd || process.cwd(), ti.file_path).replace(/\\/g, '/');
  if (!PLAN_PATH.test(file)) return '';
  const root = gitRoot(path.dirname(file));
  if (!root) return '';
  const result = checkPlan(fs.readFileSync(file, 'utf8'), root, { noRun: true });
  if (!result || result.cannot.length || !result.findings.length) return '';
  return [...result.findings, `Run plan-check.js --plan ${file} before the review: it also re-runs the search checks.`].join('\n');
}

function hook() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    try {
      const context = hookContext(JSON.parse(raw || '{}'));
      if (context) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext: context,
          },
        }));
      }
    } catch { /* a plan write is never refused and never answered with an error */ }
    process.exit(0);
  });
}

module.exports = { checkPlan, gitRoot, findProgram, realPath };

if (require.main === module) {
  if (process.argv[2] === '--hook') hook();
  else process.exitCode = cli(process.argv.slice(2));
}
