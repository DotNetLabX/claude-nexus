// recheck-args.mjs — the .NET adapter's one-mutant re-check (SKILL.md § One-mutant re-check). Reads the rule
// re-check record (`nexus-miner`'s `rule-recheck.mjs due` writes it) and, for every group with no result or a
// failed one, builds a Stryker.NET config that tests only the group's due mutants with only their killing
// tests. Groups sharing a mutated project and a test project share one config, so Stryker's start-up is paid
// once per project pair. Configs and Stryker's output go to a folder outside the repo — with no `--out`, a
// fresh `recheck-args-*` folder under `{CLAUDE_CODE_TMPDIR or the system temp}/claude/`.
//
// Stryker.NET reads a `mutate` span `{a..b}` in zero-based character indices over the file's text and tests
// only mutants fully inside it; `test-case-filter` is a config key only (4.16 refuses it on the command line).
// The report's columns are one-based with an exclusive end, so the span ends at the last character + 1,
// which is right whether Stryker reads the bound as inclusive or half-open.
//
// Zero imports beyond Node's own. Usage:
//   node recheck-args.mjs --repo {tree} --slug {slug} [--out {scratch folder}] [--recheck {rule-recheck.mjs}]

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const GONE = 'killing test gone';
const OPEN = new Set([null, 'failed']);
const DROPPED_KEYS = ['project', 'mutate', 'reporters', 'thresholds', 'test-case-filter', 'test-projects', 'since', 'with-baseline'];

const USAGE = 'usage: node recheck-args.mjs --repo {tree} --slug {slug} [--out {scratch folder}] [--recheck {rule-recheck.mjs}]';

class Refusal extends Error {}

const slash = (p) => String(p).replace(/\\/g, '/');
const isFile = (abs) => { try { return statSync(abs).isFile(); } catch { return false; } };
const isDir = (abs) => { try { return statSync(abs).isDirectory(); } catch { return false; } };

/** Zero-based character span of a mutant whose location is `L:C` (one-based) to `L:C` (one-based, end exclusive). */
export function charSpan(source, start, end) {
  const starts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1);
  const at = (pos) => {
    const [line, column] = String(pos).split(':').map(Number);
    if (!Number.isInteger(line) || !Number.isInteger(column) || line < 1 || line > starts.length || column < 1) {
      throw new Refusal(`location ${pos} is outside the reference source`);
    }
    return starts[line - 1] + column - 1;
  };
  return { start: at(start), end: at(end) };
}

/**
 * The `test-case-filter` value: one `FullyQualifiedName~` term per test, its parameter list cut off and each
 * character the filter grammar gives a meaning (`\ ( ) & | = ! ~`) escaped with a backslash.
 */
export function filterOf(names) {
  const bare = [...new Set(names.map((n) => String(n).replace(/\(.*$/s, '')))];
  return bare.map((n) => `FullyQualifiedName~${n.replace(/[\\()&|=!~]/g, '\\$&')}`).join('|');
}

/** A POSIX-shell single-quoted word: nothing inside is expanded, and a `'` is closed, escaped and reopened. */
export function shellQuote(text) {
  return `'${String(text).replace(/'/g, "'\\''")}'`;
}

/** The longest suffix of a report key that names an existing path in the repo, or null. */
function mapSuffix(repo, key, accept) {
  const parts = slash(key).split('/').filter(Boolean);
  const from = parts.length && /^[A-Za-z]:$/.test(parts[0]) ? 1 : 0;
  for (let i = from; i < parts.length; i++) {
    const abs = join(repo, ...parts.slice(i));
    if (accept(abs)) return abs;
  }
  return null;
}

function entryFor(rep, file) {
  for (const [key, entry] of Object.entries((rep && rep.files) || {})) {
    const k = slash(key);
    if (k === file || k.endsWith(`/${file}`)) return entry;
  }
  return null;
}

const csprojIn = (dir) => {
  try {
    const name = readdirSync(dir).filter((n) => n.endsWith('.csproj')).sort()[0];
    return name ? join(dir, name) : null;
  } catch { return null; }
};

/** The nearest folder at or above `file`'s, inside the repo, that holds a `.csproj`. */
function projectOf(repo, file) {
  const root = resolve(repo);
  let dir = dirname(resolve(file));
  while (dir.startsWith(root)) {
    const proj = csprojIn(dir);
    if (proj) return proj;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const BOM = String.fromCharCode(0xfeff);
const parseText = (text) => JSON.parse(text.startsWith(BOM) ? text.slice(1) : text);

function readJson(abs, what) {
  try { return parseText(readFileSync(abs, 'utf8')); } catch (e) { throw new Refusal(`cannot read ${what} ${slash(abs)} (${e.message})`); }
}

function baseConfig(testProject) {
  const own = join(dirname(testProject), 'stryker-config.json');
  if (!isFile(own)) return {};
  const body = readJson(own, 'the test project\'s Stryker config')['stryker-config'] || {};
  const kept = { ...body };
  for (const k of DROPPED_KEYS) delete kept[k];
  return kept;
}

/** Where one group runs — its mutated project, test projects, spans and test names — or the reason none can. */
function placeGroup(repo, group, reports) {
  const live = (group.mutants || []).filter((mu) => mu.why !== GONE);
  if (!live.length) return { why: GONE };
  if (typeof group.report !== 'string' || typeof group.file !== 'string') return { why: 'the group names no report or file' };
  if (!reports.has(group.report)) reports.set(group.report, readJson(join(repo, ...group.report.split('/')), 'the reference report'));
  const rep = reports.get(group.report);
  const entry = entryFor(rep, group.file);
  if (!entry || typeof entry.source !== 'string') return { why: 'no source for the file in the reference report' };
  const projectDir = typeof rep.projectRoot === 'string' ? mapSuffix(repo, rep.projectRoot, isDir) : null;
  const project = (projectDir && csprojIn(projectDir)) || projectOf(repo, join(repo, ...group.file.split('/')));
  if (!project) return { why: 'no mutated project found for the file' };
  const wanted = new Set(group.tests || []);
  const testProjects = new Set();
  for (const [key, tf] of Object.entries(rep.testFiles || {})) {
    if (!((tf && tf.tests) || []).some((t) => wanted.has(String(t.name)))) continue;
    const file = mapSuffix(repo, key, isFile);
    const proj = file && projectOf(repo, file);
    if (proj) testProjects.add(proj);
  }
  if (!testProjects.size) return { why: 'no test project found for the killing tests' };
  const patterns = live.map((mu) => {
    const { start, end } = charSpan(entry.source, mu.start, mu.end);
    return `**/${group.file}{${start}..${end}}`;
  });
  return { project, tests: [...testProjects].sort(), patterns, names: group.tests || [] };
}

/**
 * What to run: `configs` (one per mutated project and test project set, each with its groups) and `stale`
 * (groups no run can check, with the reason to record).
 */
export function planRecheck({ repo, slug }) {
  const record = readJson(join(repo, 'docs', 'specs', ...slug.split('/'), 'delivery', 'mutation-recheck.json'), 'the re-check record');
  const reports = new Map();
  const byKey = new Map();
  const stale = [];
  const stuck = [];
  for (const group of record.groups || []) {
    if (!group || !OPEN.has(group.result)) continue;
    let placed;
    try { placed = placeGroup(repo, group, reports); } catch (e) { placed = { why: String(e.message) }; }
    if (placed.why) {
      (group.result === 'failed' ? stuck : stale).push({ group: group.id, why: placed.why });
      continue;
    }
    const key = [placed.project, ...placed.tests].join('|');
    if (!byKey.has(key)) byKey.set(key, { project: placed.project, testProjects: placed.tests, groups: [], mutate: [], names: [] });
    const slot = byKey.get(key);
    slot.groups.push(group.id);
    for (const pattern of placed.patterns) if (!slot.mutate.includes(pattern)) slot.mutate.push(pattern);
    slot.names.push(...placed.names);
  }
  const configs = [...byKey.values()].map((s) => {
    const config = {
      ...baseConfig(s.testProjects[0]),
      project: relative(dirname(s.project), s.project),
      mutate: s.mutate,
      'test-case-filter': filterOf(s.names),
      reporters: ['json'],
    };
    const multi = s.testProjects.length > 1;
    if (multi) config['test-projects'] = s.testProjects;
    return { groups: s.groups, runFrom: dirname(multi ? s.project : s.testProjects[0]), config: { 'stryker-config': config } };
  });
  return { configs, stale, stuck };
}

/** Where a run with no `--out` writes: Claude's own temp folder, the one a campaign unit's fence lets it write. */
export function defaultOutRoot(env = process.env) {
  return join(env.CLAUDE_CODE_TMPDIR || tmpdir(), 'claude');
}

function inside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export function main(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!['--repo', '--slug', '--out', '--recheck'].includes(a) || i + 1 >= argv.length) {
      return { code: 2, err: `recheck-args: bad argument ${a}\n${USAGE}` };
    }
    opts[a.slice(2)] = argv[++i];
  }
  if (!opts.repo || !opts.slug) return { code: 2, err: `recheck-args: --repo and --slug are required\n${USAGE}` };
  const repo = resolve(opts.repo);
  try {
    if (opts.out && inside(repo, opts.out)) throw new Refusal(`--out ${opts.out} must be outside the repo`);
    const plan = planRecheck({ repo, slug: opts.slug });
    let out = opts.out ? resolve(opts.out) : null;
    if (!out) {
      const root = defaultOutRoot();
      mkdirSync(root, { recursive: true });
      out = mkdtempSync(join(root, 'recheck-args-'));
    }
    if (inside(repo, out)) throw new Refusal(`the scratch folder ${out} must be outside the repo`);
    const tool = opts.recheck || 'rule-recheck.mjs';
    const lines = [];
    plan.configs.forEach((c, i) => {
      const dir = join(out, `c${i + 1}`);
      mkdirSync(dir, { recursive: true });
      const file = join(dir, 'stryker-config.json');
      writeFileSync(file, `${JSON.stringify(c.config, null, 2)}\n`);
      const output = join(dir, 'output');
      lines.push(`# c${i + 1} — groups ${c.groups.join(', ')}`, `cd "${c.runFrom}"`,
        `dotnet stryker --config-file "${file}" -O "${output}"`);
      for (const g of c.groups) {
        lines.push(`node "${tool}" record --repo "${repo}" --slug ${opts.slug} --group ${g} --report "${join(output, 'reports', 'mutation-report.json')}"`);
      }
    });
    for (const s of plan.stale) lines.push(`node "${tool}" stale --repo "${repo}" --slug ${opts.slug} --group ${s.group} --why ${shellQuote(s.why)}`);
    for (const s of plan.stuck) lines.push(`# ${s.group} stays failed — ${s.why}; no run can check it, so it holds the close`);
    if (!lines.length) lines.push('recheck-args: no group is open — nothing to run');
    return { code: 0, out: lines.join('\n') };
  } catch (e) {
    return { code: 1, err: `recheck-args: ${e.message}` };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = main(process.argv.slice(2));
  if (res.out) process.stdout.write(`${res.out}\n`);
  if (res.err) process.stderr.write(`${res.err}\n`);
  process.exit(res.code);
}
