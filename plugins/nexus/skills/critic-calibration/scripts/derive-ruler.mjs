#!/usr/bin/env node
// derive-ruler.mjs — the calibration machinery behind the critic-calibration skill.
//
// Usage: node derive-ruler.mjs <mode> [options]
//
//   extract  [--repo {root}]                       review records -> corpus rows
//   sheet    --candidates [--out {path}]           corpus -> a grading sheet
//   sheet    --blind --select {sel} [--out {path}] corpus -> a blind sheet + its id sidecar
//   ingest   --sheet {file}                        a filled grading sheet -> the corpus
//   derive   [--seed] [--out {p}] [--date {ISO}] [--hold-out {sel}]   corpus -> the ruler
//   derive   --dry-run                             the refusal list only; writes nothing
//
// The refusal list guards the one text the ruler prints — a record's `consequence`. A consequence
// carrying a feature slug, a path-shaped token, a token from the repository's own
// docs/critic-calibration/deny-tokens.txt, or more than 160 characters is excluded from anchor
// selection (its levels still feed the bias table). `derive` names each on stderr and exits 0;
// `derive --dry-run` is the gate and exits 1 on a non-empty list.
//   score    --sheet {file}                        a filled blind sheet -> the distribution
//   metrics  --slug {slug}                         one review record -> the round figures
//   check    [--seed] [--ruler {p}] [--corpus-only]  the drift gate
//
// Every mode accepts --repo {root}. Without it the repo root is the nearest ancestor of the
// working directory holding a `.git` ENTRY — file or directory, since a worktree's `.git` is a
// file. The skill's own root is resolved from import.meta.url, so the script runs in place from a
// version-keyed cache.
//
// Exit codes: 0 success, 1 a refused record / a failed check / a malformed round, 2 usage.
//
// Node 22+, built-ins only, no child process at all (so no shell quoting surface exists).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const SKILL_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// ── the vocabulary (one owner; the convergence lint pins these against the shipped prose) ──────
const LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const LEVEL_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const DISPOSITIONS = ['fixed-real', 'waived', 'churn', 'plan-must-resolve', 'open'];
const KINDS = ['spec', 'plan', 'promotion'];
const ANCHOR_KINDS = ['spec', 'plan'];
const EVIDENCE = ['quoted', 'scenario', 'path', 'none'];
const UNTOUCHABLE = ['data-loss', 'security', 'silent-wrong-output'];
const GRADED_BY = ['owner', 'panel', 'pre-grade', 'extract'];
// Who can sign a sitting: one owner, or a panel of readers. `pre-grade` and `extract` are what a row
// carries when nobody signed it, so neither is a value `--grader` accepts.
const GRADERS = ['owner', 'panel'];
const SOURCES = ['seed', 'extracted'];
const CONSEQUENCE_MAX = 160;
const ANCHORS_PER_CELL = 3;

// The corpus record, in its one canonical key order — every writer emits this order, so a rewrite
// that changes nothing changes no bytes (what makes ingest idempotent).
const RECORD_KEYS = [
  'id', 'kind', 'round', 'finding', 'title', 'level_given', 'level_after', 'disposition',
  'shape', 'surfaces', 'consequence', 'excerpt', 'evidence', 'untouchable', 'tag',
  'anchor_cited', 'band', 'graded_by', 'grade_note', 'reviewed', 'source', 'origin', 'ts',
];

// The merge table's twelve columns, read BY HEADER NAME. A table missing one is an error.
const MERGE_COLUMNS = [
  'id', 'readers', 'level', 'anchor', 'title', 'shape', 'consequence', 'evidence',
  'untouchable', 'tag', 'surfaces', 'source ids',
];
const FOLD_COLUMNS = ['id', 'disposition', 'level after'];
const SHEET_COLUMNS = [
  'id', 'kind', 'round', 'given', 'disposition', 'title', 'consequence (edit)',
  'proposed level', 'reason', 'owner level', 'owner note',
];

const ROUND_RE = /^## Round (\d+) — (\d{4}-\d{2}-\d{2}) — (spec|plan|promotion) — primary \(([a-z][\w.-]*)\)$/;
const ROUND_LINE_RE = /^## Round /;
// The layout-adoption signal — ONE test, used by both legacy branches below, so "did this record
// adopt the layout?" cannot be answered two different ways sixteen lines apart. A record carrying
// either round table is held to the whole layout; a record carrying neither never adopted it.
const LAYOUT_HEADING_RE = /^### (Merge|Fold) — round \d/;
const LEGACY_NO_ROUND_HEADING = 'no "## Round " heading';
const LEGACY_NO_ROUND_TABLES = 'no "### Merge — round" or "### Fold — round" table';
const SLUG_RE = /\bF\d+-[A-Z]\w*/;
// Path-shaped: an extension-bearing token, or any token carrying a slash between word characters.
// The slash arm is deliberately broad — an anchor consequence has no business carrying one at all.
const PATH_RE = /\b[\w-][\w.-]*\.(?:md|mjs|cjs|mts|js|ts|json|jsonl|ya?ml|py|cs|sh|txt|csv)\b|[\w.-]+[\\/][\w.-]+/;

function fail(message) {
  console.error(`derive-ruler: ${message}`);
  process.exit(1);
}

/**
 * A malformed RECORD FILE, as distinct from every other failure in this script.
 *
 * The record-parsing path throws this instead of calling `fail()`, because `fail()` exits the
 * process and an exit cannot be caught: one malformed record therefore killed the whole estate's
 * `extract` pass and wrote nothing. `modeExtract` catches it per file and continues; `modeMetrics`
 * catches it and re-emits `fail()`'s exact one-line shape, which is the line a consuming repo's
 * close gate quotes verbatim into its deny reason — a stack trace there would ship local absolute
 * paths as a remediation message.
 */
class RecordParseError extends Error {}

function parseFail(message) {
  throw new RecordParseError(message);
}

function usage(message) {
  if (message) console.error(`derive-ruler: ${message}`);
  console.error('usage: node derive-ruler.mjs <extract|sheet|ingest|derive|score|metrics|check> [options]');
  process.exit(2);
}

// ── arguments ──────────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i += 1;
    } else {
      flags.set(key, true);
    }
  }
  return flags;
}

function flagValue(flags, key) {
  const v = flags.get(key);
  return typeof v === 'string' ? v : null;
}

/** Nearest ancestor holding a `.git` entry — file OR directory (a worktree's `.git` is a file). */
function findRepoRoot(startDir) {
  let cur = resolve(startDir);
  for (;;) {
    if (existsSync(join(cur, '.git'))) return cur;
    const parent = dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function repoRoot(flags) {
  const named = flagValue(flags, 'repo');
  if (named) {
    const r = resolve(named);
    if (!existsSync(r)) usage(`--repo ${named} does not exist`);
    return r;
  }
  const found = findRepoRoot(process.cwd());
  if (!found) usage('no .git entry above the working directory — pass --repo {root}');
  return found;
}

// In the plugin source repo the skill folder lives inside the repo; a consuming repo reads it from a
// version-keyed cache. Both sides are realpath'd (a junction or symlink otherwise reads as "outside")
// and case-folded on Windows, where a differently-cased --repo would otherwise make the answer wrong
// in the direction that produces a message stating the opposite of the truth.
function isPluginSourceRepo(root) {
  const real = (p) => {
    try {
      return realpathSync.native(p);
    } catch {
      return resolve(p);
    }
  };
  const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  return fold(real(SKILL_ROOT)).startsWith(fold(real(root)) + sep);
}

const today = () => new Date().toISOString().slice(0, 10);

// ── corpus io ──────────────────────────────────────────────────────────────────────────────────
const corpusPath = (root) => join(root, 'docs', 'critic-calibration', 'corpus.jsonl');

function readCorpus(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    try {
      out.push(JSON.parse(line));
    } catch (e) {
      fail(`${path}:${i + 1}: not valid JSON — ${e.message}`);
    }
  });
  return out;
}

function canonical(record, onDroppedKey) {
  const out = {};
  for (const k of RECORD_KEYS) out[k] = k in record ? record[k] : null;
  // A key outside the canonical order is dropped by design — but silently dropping data a later
  // schema version added is how a rewrite loses it. Name it.
  if (onDroppedKey) {
    for (const k of Object.keys(record)) if (!RECORD_KEYS.includes(k)) onDroppedKey(record.id, k);
  }
  return JSON.stringify(out);
}

function writeCorpus(path, records, onDroppedKey) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, records.map((r) => canonical(r, onDroppedKey)).join('\n') + '\n', 'utf8');
}

function writeArtifact(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
}

// ── markdown tables ────────────────────────────────────────────────────────────────────────────
const isRow = (line) => line.trim().startsWith('|');
const isSeparator = (line) => /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(line);

function splitRow(line) {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => c.trim());
}

/**
 * The first markdown table at or after `from` and before `to`.
 * Returns { headers, headerLine, rows: [{ cells, line }] } or null.
 */
function parseTable(lines, from, to) {
  let i = from;
  while (i < to && !isRow(lines[i])) i += 1;
  if (i >= to) return null;
  const headers = splitRow(lines[i]).map((h) => h.toLowerCase());
  const headerLine = i;
  i += 1;
  if (i < to && isSeparator(lines[i])) i += 1;
  const rows = [];
  for (; i < to && isRow(lines[i]); i += 1) {
    if (isSeparator(lines[i])) continue;
    rows.push({ cells: splitRow(lines[i]), line: i });
  }
  return { headers, headerLine, rows };
}

function cellReader(table) {
  return (row, name) => {
    const idx = table.headers.indexOf(name.toLowerCase());
    if (idx < 0) return '';
    return (row.cells[idx] ?? '').trim();
  };
}

const blank = (v) => !v || v === '—' || v === '-';

// ── record-file discovery ──────────────────────────────────────────────────────────────────────
function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

// Every review record under docs/specs — the flat `{slug}/delivery/` form and the nested
// `{epic}/{issue}/delivery/` one. (Spelled in prose: a glob written in a block comment would close it.)
function findRecordFiles(root) {
  const specs = join(root, 'docs', 'specs');
  const out = [];
  for (const slug of listDirs(specs)) {
    const flat = join(specs, slug, 'delivery', 'review-critic.md');
    if (existsSync(flat)) out.push(flat);
    for (const nested of listDirs(join(specs, slug))) {
      const p = join(specs, slug, nested, 'delivery', 'review-critic.md');
      if (existsSync(p)) out.push(p);
    }
  }
  return out;
}

const relPath = (root, path) => path.slice(resolve(root).length + 1).split(sep).join('/');

// The feature a record belongs to: the path segment immediately before `delivery`.
function featureOf(rel) {
  const parts = rel.split('/');
  const i = parts.lastIndexOf('delivery');
  return i > 0 ? parts[i - 1] : parts[0];
}

// ── the round scope ─────────────────────────────────────────────────────────────────────────
function settledLevel(cell) {
  const arrow = cell.match(/→\s*(CRITICAL|HIGH|MEDIUM|LOW)\b/);
  if (arrow) return arrow[1];
  const bare = cell.trim();
  return LEVELS.includes(bare) ? bare : null;
}

function parseAnchorCell(cell) {
  let rest = cell.trim();
  let band = null;
  const bm = rest.match(/;\s*band\s+(\S+)\s*$/);
  if (bm) {
    band = bm[1];
    rest = rest.slice(0, bm.index).trim();
  }
  // A blank cell cites nothing. Reading the em-dash as an anchor id made `metrics` report a perfect
  // citation rate for a row that cited nothing — the target is 100%, so the blank met it.
  if (blank(rest)) return { anchor_cited: null, band, noRulerYet: false };
  if (/^unranked\b/i.test(rest)) return { anchor_cited: null, band, noRulerYet: /no ruler yet/i.test(rest) };
  const id = rest.split(/\s+/)[0].replace(/[·,;]+$/, '');
  return { anchor_cited: id || null, band, noRulerYet: false };
}

/**
 * Every round in one record file, scoped by the round-heading grammar. A LEGACY file — one that never
 * adopted the F110 layout — comes back as `{ legacy: {reason} }` and the caller skips it with a
 * message; a file that DID adopt the layout but breaks it is an error naming the file and line.
 *
 * The adoption test is the presence of a round TABLE, never the presence of a `## Round ` line. The
 * pre-contract seats wrote `## Round {n} — …` in a free-form style of their own, so reading the
 * round line as the adoption signal classified every one of those records as half-adopted, and the
 * first of them killed the whole estate's pass. A record carrying a round table but missing a round
 * heading is still the half-adopted error it always was: both branches read the same test, so no
 * record is legacy on one and half-adopted on the other.
 */
function parseRecordFile(text, rel) {
  const lines = text.split(/\r?\n/);
  const heads = [];
  lines.forEach((line, i) => {
    if (ROUND_LINE_RE.test(line)) heads.push(i);
  });
  const layoutAt = lines.findIndex((l) => LAYOUT_HEADING_RE.test(l));
  if (!heads.length) {
    // A file with merge and fold tables but no round heading is a HALF-ADOPTED layout, not a legacy
    // one: skipping it silently would drop rounds someone believed they had persisted.
    if (layoutAt >= 0) {
      parseFail(`${rel}:${layoutAt + 1}: a "${lines[layoutAt].trim()}" table with no "## Round " heading above it — ` +
        'the round heading is what scopes a round; add it rather than leaving the file half-adopted');
    }
    return { legacy: LEGACY_NO_ROUND_HEADING };
  }
  // Round lines but no round table anywhere: pre-contract, whatever those lines look like.
  if (layoutAt < 0) return { legacy: LEGACY_NO_ROUND_TABLES };

  const rounds = [];
  for (let k = 0; k < heads.length; k += 1) {
    const start = heads[k];
    const end = k + 1 < heads.length ? heads[k + 1] : lines.length;
    const m = lines[start].replace(/\s+$/, '').match(ROUND_RE);
    if (!m) {
      parseFail(`${rel}:${start + 1}: a "## Round " line that fails the round-heading grammar — ` +
        '"## Round {n} — {YYYY-MM-DD} — {spec|plan|promotion} — primary ({model})"');
    }
    const round = Number(m[1]);
    const kind = m[3];

    const findHeading = (re) => {
      for (let i = start; i < end; i += 1) if (re.test(lines[i])) return i;
      return -1;
    };
    const mergeAt = findHeading(new RegExp(`^### Merge — round ${round}\\b`));
    if (mergeAt < 0) parseFail(`${rel}:${start + 1}: round ${round} has no "### Merge — round ${round}" table`);
    const foldAt = findHeading(new RegExp(`^### Fold — round ${round}\\b`));
    if (foldAt < 0) parseFail(`${rel}:${start + 1}: round ${round} has no "### Fold — round ${round}" table`);
    // Order is part of the layout, not a convenience: with the fold first, the merge table's extent
    // would be scanned to the end of the round and could swallow the fold's own rows.
    if (foldAt < mergeAt) {
      parseFail(`${rel}:${foldAt + 1}: round ${round}'s "### Fold" table precedes its "### Merge" table — ` +
        'the merge is the round\'s finding list and the fold dispositions it, so the merge comes first');
    }

    const merge = parseTable(lines, mergeAt + 1, foldAt > mergeAt ? foldAt : end);
    if (!merge) parseFail(`${rel}:${mergeAt + 1}: the "### Merge — round ${round}" heading is followed by no table`);
    const missing = MERGE_COLUMNS.filter((c) => !merge.headers.includes(c));
    if (missing.length) {
      parseFail(`${rel}:${merge.headerLine + 1}: the merge table is missing the mandatory column(s) ` +
        `${missing.map((c) => `"${c}"`).join(', ')} — the twelve columns are read by header name`);
    }
    const fold = parseTable(lines, foldAt + 1, end);
    if (!fold) parseFail(`${rel}:${foldAt + 1}: the "### Fold — round ${round}" heading is followed by no table`);
    const foldMissing = FOLD_COLUMNS.filter((c) => !fold.headers.includes(c));
    if (foldMissing.length) {
      parseFail(`${rel}:${fold.headerLine + 1}: the fold table is missing the mandatory column(s) ` +
        `${foldMissing.map((c) => `"${c}"`).join(', ')}`);
    }
    rounds.push({ round, kind, merge, fold, headLine: start });
  }
  return rounds;
}

function recordsFromRound(round, rel, repo, ts, problems) {
  const mCell = cellReader(round.merge);
  const fCell = cellReader(round.fold);
  const folds = new Map();
  for (const row of round.fold.rows) folds.set(fCell(row, 'id'), row);

  return round.merge.rows.map((row) => {
    const finding = mCell(row, 'id');
    const levelGiven = settledLevel(mCell(row, 'level'));
    if (!levelGiven) {
      parseFail(`${rel}:${row.line + 1}: the merge row's level cell is neither a bare level nor the ` +
        'contested form "contested: {a} / {b} → {settled} — {reason}"');
    }
    const anchor = parseAnchorCell(mCell(row, 'anchor'));
    const foldRow = folds.get(finding);
    const disposition = foldRow ? fCell(foldRow, 'disposition') : 'open';
    if (!DISPOSITIONS.includes(disposition)) {
      parseFail(`${rel}:${(foldRow ? foldRow.line : row.line) + 1}: disposition "${disposition}" is not one of ` +
        DISPOSITIONS.join(' | '));
    }
    const after = foldRow ? fCell(foldRow, 'level after') : '';
    const evidence = mCell(row, 'evidence').toLowerCase();
    const untouchable = mCell(row, 'untouchable');
    const tag = mCell(row, 'tag');
    const surfaces = mCell(row, 'surfaces');

    // The five mandatory fields are mandatory HERE, at the only place that can refuse. Coercing a
    // blank one (evidence to `none`, say) records a half-formed anchor that then ranks badly for a
    // reason no reader can see — the finding reads as weak when it was only written thin.
    for (const [name, value] of [['anchor', mCell(row, 'anchor')], ['shape', mCell(row, 'shape')],
      ['consequence', mCell(row, 'consequence')], ['surfaces', surfaces], ['evidence', evidence]]) {
      if (blank(value)) {
        problems.push(`${rel}:${row.line + 1}: merge row "${finding}" leaves the mandatory "${name}" cell empty`);
      }
    }
    if (!blank(evidence) && !EVIDENCE.includes(evidence)) {
      problems.push(`${rel}:${row.line + 1}: merge row "${finding}" carries evidence "${evidence}", ` +
        `not one of ${EVIDENCE.join(' | ')}`);
    }
    // The same rule the evidence cell got, for the two cells that kept the lax path. Coercing an
    // unrecognised untouchable token to null strips the never-downgrade class and makes the record
    // eligible as a NEGATIVE anchor; coercing a folded row's blank level to null writes a folded
    // finding that reads as unfolded — outside every cell and outside the bias mean.
    if (!blank(untouchable) && !UNTOUCHABLE.includes(untouchable)) {
      problems.push(`${rel}:${row.line + 1}: merge row "${finding}" carries untouchable "${untouchable}", ` +
        `not one of ${UNTOUCHABLE.join(' | ')}`);
    }
    if (foldRow && disposition !== 'open' && !LEVELS.includes(after)) {
      problems.push(`${rel}:${(foldRow.line) + 1}: fold row "${finding}" is dispositioned ` +
        `"${disposition}" but its "level after" cell reads "${after || '(empty)'}" — a level is null ` +
        'only until a finding is folded');
    }

    return {
      id: null,
      kind: round.kind,
      round: round.round,
      finding,
      title: mCell(row, 'title'),
      level_given: levelGiven,
      level_after: LEVELS.includes(after) ? after : null,
      disposition,
      shape: mCell(row, 'shape'),
      surfaces: surfaces ? surfaces.split(';').map((s) => s.trim()).filter(Boolean) : [],
      consequence: mCell(row, 'consequence'),
      excerpt: null,
      evidence,
      untouchable: UNTOUCHABLE.includes(untouchable) ? untouchable : null,
      tag: blank(tag) ? null : tag,
      anchor_cited: anchor.anchor_cited,
      band: anchor.band,
      graded_by: 'extract',
      grade_note: null,
      reviewed: false,
      source: 'extracted',
      origin: { feature: featureOf(rel), repo, file: rel, reader: mCell(row, 'readers') || 'primary' },
      ts,
    };
  });
}

// ── refusals (the consequence rule) ─────────────────────────────────────────────────────────
// The deny set is DATA, never a literal in this file: the repository that reviews owns
// `docs/critic-calibration/deny-tokens.txt` — one whole-word, case-insensitive token per line, `#`
// comments, blanks ignored. Absent means no deny check. That is what lets the shipped script refuse
// a company name without ever naming one.
const denyFile = (root) => join(root, 'docs', 'critic-calibration', 'deny-tokens.txt');

function denyTokens(root) {
  const path = denyFile(root);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean);
}

function refusalReasons(record, deny) {
  const c = record && typeof record.consequence === 'string' ? record.consequence : '';
  const reasons = [];
  if (!c.trim()) reasons.push('the consequence is empty');
  if (c.length > CONSEQUENCE_MAX) reasons.push(`the consequence is ${c.length} chars (max ${CONSEQUENCE_MAX})`);
  const slug = c.match(SLUG_RE);
  if (slug) reasons.push(`the consequence carries the feature slug "${slug[0]}"`);
  const path = c.match(PATH_RE);
  if (path) reasons.push(`the consequence carries the path-shaped token "${path[0]}"`);
  for (const token of deny) {
    const probe = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (probe.test(c)) reasons.push(`the consequence carries the denied token "${token}"`);
  }
  return reasons;
}

function refusals(records, root) {
  const deny = denyTokens(root);
  const out = [];
  for (const r of records) {
    const reasons = refusalReasons(r, deny);
    if (reasons.length) out.push({ id: r.id, reasons });
  }
  return out;
}

// ── selectors ──────────────────────────────────────────────────────────────────────────────────
function parseSelector(text) {
  const sel = {};
  for (const part of String(text).split(',')) {
    const [k, v] = part.split('=');
    if (!k || v === undefined) usage(`selector "${text}" must read key=value[,key=value…]`);
    sel[k.trim()] = v.trim();
  }
  for (const k of Object.keys(sel)) {
    if (!['kind', 'feature', 'round'].includes(k)) usage(`selector key "${k}" is not one of kind, feature, round`);
  }
  return sel;
}

function matchesSelector(record, sel) {
  if (sel.kind && record.kind !== sel.kind) return false;
  if (sel.feature && (!record.origin || record.origin.feature !== sel.feature)) return false;
  if (sel.round !== undefined && String(record.round) !== String(sel.round)) return false;
  return true;
}

// ── anchor selection ───────────────────────────────────────────────────────────────────────────
const DISP_RANK = { 'fixed-real': 0, waived: 1, 'plan-must-resolve': 2, churn: 3, open: 4 };
const EV_RANK = { quoted: 0, scenario: 1, path: 2, none: 3 };

function isPositive(record, kind, level) {
  if (record.kind !== kind || record.level_after !== level) return false;
  if (record.disposition === 'fixed-real') return true;
  if (record.disposition === 'waived') return level === 'MEDIUM' || level === 'LOW';
  if (record.disposition === 'plan-must-resolve') return level === 'LOW';
  return false;
}

function isNegative(record, kind, level) {
  if (record.kind !== kind || record.level_given !== level) return false;
  // An untouchable-class record can never be the negative exemplar. The negative anchor's whole
  // teaching is "this looked like that level and was not" — printing a data-loss, security or
  // silent-wrong-output finding there would teach the one downgrade the ruler forbids everywhere.
  if (record.untouchable !== null) return false;
  if (record.disposition === 'churn') return true;
  return record.level_after !== null && LEVEL_RANK[record.level_after] < LEVEL_RANK[record.level_given];
}

// Anchor selection ranks a signed grade over an unsigned one, and the owner's signature over the
// panel's. `pre-grade` and `extract` share the last place on purpose: neither was graded at a
// sitting, so nothing distinguishes them as evidence of a level.
const GRADE_RANK = { owner: 0, panel: 1 };
const UNSIGNED_RANK = 2;

// `ownerFirst` is the ANCHOR-selection rule. The candidate sheet ranks by disposition, then evidence,
// then distinct shape — nothing on it is graded yet, which is what the sitting is for.
function rankCandidates(records, { ownerFirst = true } = {}) {
  return [...records].sort((a, b) => {
    if (ownerFirst) {
      const graded = (GRADE_RANK[a.graded_by] ?? UNSIGNED_RANK) - (GRADE_RANK[b.graded_by] ?? UNSIGNED_RANK);
      if (graded) return graded;
    }
    const disp = (DISP_RANK[a.disposition] ?? 9) - (DISP_RANK[b.disposition] ?? 9);
    if (disp) return disp;
    const ev = (EV_RANK[a.evidence] ?? 9) - (EV_RANK[b.evidence] ?? 9);
    if (ev) return ev;
    // Codepoint order, never localeCompare: its collation is locale- and ICU-build-dependent, and
    // this comparator sits under a byte-identity guarantee.
    const x = String(a.id);
    const y = String(b.id);
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/** Ranked, then a distinct-shape preference pass, then the remainder — deterministic either way. */
function pickDistinct(candidates, limit, opts) {
  const ranked = rankCandidates(candidates, opts);
  const shapes = new Set();
  const picked = [];
  for (const r of ranked) {
    if (picked.length >= limit) break;
    if (shapes.has(r.shape)) continue;
    shapes.add(r.shape);
    picked.push(r);
  }
  for (const r of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(r)) picked.push(r);
  }
  return picked;
}

// ── the ruler ──────────────────────────────────────────────────────────────────────────────────
function biasRow(kind, records) {
  const graded = records.filter((r) => r.kind === kind && r.level_after !== null);
  if (!graded.length) return `| ${kind} | — | 0 |`;
  const sum = graded.reduce((n, r) => n + (LEVEL_RANK[r.level_after] - LEVEL_RANK[r.level_given]), 0);
  return `| ${kind} | ${(sum / graded.length).toFixed(2)} | ${graded.length} |`;
}

function renderRuler({ records, anchorPool, biasPool, date, label, sha, heldOut }) {
  // Counted over the DERIVATION set, not the corpus: a held-out record graded by the owner did not
  // inform this ruler, so counting it would overstate how much of it the owner stands behind.
  const owner = anchorPool.filter((r) => r.graded_by === 'owner').length;
  // Printed only when a panel actually sat: a ruler derived where nobody graded by panel should read
  // exactly as it did before the label existed, and "0 panel-graded" would announce a sitting shape
  // this corpus never used.
  const panelCount = anchorPool.filter((r) => r.graded_by === 'panel').length;
  const panel = panelCount > 0 ? `, ${panelCount} panel-graded` : '';
  const held = heldOut > 0 ? `, ${heldOut} held out` : '';
  const out = [];
  out.push(`# Critic severity ruler — ${label}`);
  out.push(
    `Provenance: derived ${date} from ${records.length} records (${owner} owner-graded${panel}${held}) by the ` +
      `calibration script; corpus sha256 ${sha}. Generated — never hand-edit.`
  );

  for (const kind of ANCHOR_KINDS) {
    out.push('');
    out.push(`## ${kind}`);
    for (const level of LEVELS) {
      const positives = pickDistinct(anchorPool.filter((r) => isPositive(r, kind, level)), ANCHORS_PER_CELL);
      const negative = pickDistinct(anchorPool.filter((r) => isNegative(r, kind, level)), 1)[0];
      out.push('');
      out.push(`### ${level}`);
      out.push('');
      if (positives.length) {
        out.push('| Anchor | Consequence | Outcome |');
        out.push('|---|---|---|');
        for (const r of positives) out.push(`| ${r.id} | ${r.consequence} | ${r.disposition} |`);
        if (positives.length < 2) {
          out.push('');
          out.push(`Thin cell — ${positives.length} anchor(s); cap confidence.`);
        }
      } else {
        // One line, not two: an empty cell is not a thin cell with a count of zero.
        out.push('No anchor yet — grade by comparison to the neighbouring cells.');
      }
      if (negative) {
        out.push('');
        // Two provenances, named apart: a fold that found nothing to fix, and a level the sitting
        // re-graded down. The seed's negatives are all the second kind (C2, D24), and a reader who
        // cannot tell them apart reads a re-grade as a churned finding.
        const why = negative.disposition === 'churn'
          ? 'folded as churn'
          : `re-graded ${negative.level_after || '—'} at the sitting`;
        out.push(`Negative: ${negative.id} — ${negative.consequence} (graded ${negative.level_given}; ${why})`);
      }
    }
  }

  out.push('');
  out.push('## Never downgrade');
  out.push('');
  out.push(`${UNTOUCHABLE.join(' · ')} — under seed or overlay alike.`);
  out.push('');
  out.push('## Bias table');
  out.push('');
  out.push('| Kind | Mean shift given→after | n |');
  out.push('|---|---|---|');
  for (const kind of KINDS) out.push(biasRow(kind, biasPool));
  out.push('');
  out.push(
    'Legend: shift = after − given on ' +
      LEVELS.map((l) => `${l} ${LEVEL_RANK[l]}`).join(' · ') +
      '; negative = the seat graded high.'
  );
  out.push('');
  return out.join('\n');
}

function deriveText(records, root, { date, seed, holdOut }) {
  // Hash the CANONICAL SERIALIZATION, never the file bytes: a corpus checked out with CRLF endings
  // holds the same records and would otherwise stamp a different sha, so the ruler would not be
  // byte-stable across platforms — the one property the drift gate rests on.
  const sha = createHash('sha256').update(records.map(canonical).join('\n') + '\n')
    .digest('hex').slice(0, 12);
  const refused = new Set(refusals(records, root).map((r) => r.id));
  const held = holdOut ? records.filter((r) => matchesSelector(r, holdOut)) : [];
  const heldIds = new Set(held.map((r) => r.id));
  const anchorPool = records.filter((r) => !refused.has(r.id) && !heldIds.has(r.id));
  const biasPool = records.filter((r) => !heldIds.has(r.id));
  return renderRuler({
    records,
    anchorPool,
    biasPool,
    date,
    label: seed ? 'seed' : 'overlay',
    sha,
    heldOut: held.length,
  });
}

// ── schema validation ──────────────────────────────────────────────────────────────────────────
function schemaErrors(record, index) {
  const at = `record ${index + 1}${record && record.id ? ` (${record.id})` : ''}`;
  const errs = [];
  // A corpus line that parses as JSON but is not an object (null, a number, a bare string) must be a
  // schema ERROR with the promised wording — reaching the key loop with it throws a TypeError, and a
  // stack trace is not a validation message however convenient its exit code.
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return [`${at}: not a JSON object`];
  }
  for (const key of RECORD_KEYS) {
    if (!(key in record)) errs.push(`${at}: missing the required key "${key}"`);
  }
  if (errs.length) return errs;
  if (!KINDS.includes(record.kind)) errs.push(`${at}: kind "${record.kind}" is not one of ${KINDS.join(' | ')}`);
  if (!Number.isInteger(record.round)) errs.push(`${at}: round must be an integer`);
  if (!LEVELS.includes(record.level_given)) errs.push(`${at}: level_given "${record.level_given}" is not a level`);
  if (record.level_after !== null && !LEVELS.includes(record.level_after)) {
    errs.push(`${at}: level_after "${record.level_after}" is neither null nor a level`);
  }
  if (!DISPOSITIONS.includes(record.disposition)) {
    errs.push(`${at}: disposition "${record.disposition}" is not one of ${DISPOSITIONS.join(' | ')}`);
  }
  if (!EVIDENCE.includes(record.evidence)) errs.push(`${at}: evidence "${record.evidence}" is not one of ${EVIDENCE.join(' | ')}`);
  if (record.untouchable !== null && !UNTOUCHABLE.includes(record.untouchable)) {
    errs.push(`${at}: untouchable "${record.untouchable}" is neither null nor one of ${UNTOUCHABLE.join(' | ')}`);
  }
  if (!GRADED_BY.includes(record.graded_by)) errs.push(`${at}: graded_by "${record.graded_by}" is not one of ${GRADED_BY.join(' | ')}`);
  if (!SOURCES.includes(record.source)) errs.push(`${at}: source "${record.source}" is not one of ${SOURCES.join(' | ')}`);
  if (record.source === 'extracted' && record.excerpt !== null) errs.push(`${at}: excerpt must be null on an extracted record`);
  if (!Array.isArray(record.surfaces)) errs.push(`${at}: surfaces must be an array`);
  if (typeof record.reviewed !== 'boolean') errs.push(`${at}: reviewed must be a boolean`);
  if (!record.origin || typeof record.origin !== 'object') errs.push(`${at}: origin must be an object`);
  return errs;
}

// Ids are the ruler's citation keys and `ingest`'s write keys, so a duplicate silently sends one
// record's grade to another's row.
function duplicateIdErrors(records) {
  const seen = new Map();
  const errs = [];
  records.forEach((r, i) => {
    const id = r && r.id;
    if (typeof id !== 'string' || !id) return;
    if (seen.has(id)) {
      errs.push(`record ${i + 1}: id "${id}" is already used by record ${seen.get(id) + 1} — ` +
        'the ruler cites ids and ingest writes by id, so a duplicate grades the wrong record');
    } else {
      seen.set(id, i);
    }
  });
  return errs;
}

// ── modes ──────────────────────────────────────────────────────────────────────────────────────
function modeExtract(flags) {
  const root = repoRoot(flags);
  const path = corpusPath(root);
  const corpus = readCorpus(path);
  const prefix = isPluginSourceRepo(root) ? 'seed' : 'local';
  const seen = new Set(corpus.map((r) => `${r.origin && r.origin.file}::${r.round}::${r.finding}`));
  let next = corpus.reduce((max, r) => {
    const m = String(r.id || '').match(/-(\d+)$/);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);

  const ts = today();
  const repo = basename(resolve(root));
  let appended = 0;
  let skipped = 0;
  let legacy = 0;
  // Collected, not thrown one at a time: a record file with three thin rows should be fixed in one
  // pass, not discovered three runs deep.
  const problems = [];

  // PER-FILE FAULT ISOLATION. One malformed record used to kill the whole estate's pass and write
  // nothing — which is how a dead learning loop stayed invisible. A failing file is now reported with
  // the message it always printed and the loop continues. What isolation changes is WHEN the run
  // dies, never WHETHER a malformed record is reported: every failure is named in the summary below
  // and the run still exits non-zero, so it is never a silent skip.
  const files = findRecordFiles(root);
  let parsedFiles = 0;
  const failures = [];

  for (const file of files) {
    const rel = relPath(root, file);
    const fileProblems = problems;
    const before = fileProblems.length;
    let staged;
    try {
      const parsed = parseRecordFile(readFileSync(file, 'utf8'), rel);
      if (parsed.legacy) {
        legacy += 1;
        console.log(`skipped (legacy — ${parsed.legacy}): ${rel}`);
        continue;
      }
      staged = [];
      for (const round of parsed) {
        for (const record of recordsFromRound(round, rel, repo, ts, fileProblems)) staged.push(record);
      }
    } catch (e) {
      // NOT a RecordParseError — an unreadable file, a permission error — is not a malformed record
      // and is deliberately outside the isolation: it says the run itself is broken, not the estate.
      if (!(e instanceof RecordParseError)) throw e;
      // Everything this file had already accumulated goes with the throw. `recordsFromRound` both
      // PUSHES problems (thin cells) and THROWS (a bad level, a bad disposition), so reporting only
      // the throw sends the author back for a second run to discover the rest — the multi-run
      // discovery the collected-problems design exists to prevent.
      failures.push({ rel, reasons: [...fileProblems.slice(before), e.message] });
      continue;
    }
    // A thin or mis-filled cell fails its own file too. These records were never appended before this
    // change either (the run wrote nothing at all), so scoping them to their file keeps that promise
    // while letting every healthy record through.
    if (fileProblems.length > before) {
      failures.push({ rel, reasons: fileProblems.slice(before) });
      continue;
    }
    parsedFiles += 1;
    for (const record of staged) {
      const key = `${rel}::${record.round}::${record.finding}`;
      if (seen.has(key)) {
        skipped += 1;
        continue;
      }
      next += 1;
      record.id = `${prefix}-${String(next).padStart(4, '0')}`;
      corpus.push(record);
      seen.add(key);
      appended += 1;
    }
  }

  if (appended) writeCorpus(path, corpus);
  // The three buckets, printed: every discovered file lands in exactly one, so parsed + legacy +
  // failed is an identity a reader can check against the discovery count rather than taking the
  // tool's word for how much of the estate it read.
  console.log(`extract: ${files.length} record file(s) — ${parsedFiles} parsed, ` +
    `${legacy} legacy-skipped, ${failures.length} failed`);
  if (failures.length) {
    const errors = failures.reduce((n, f) => n + f.reasons.length, 0);
    for (const f of failures) for (const reason of f.reasons) console.error(`derive-ruler: ${reason}`);
    console.error(`extract: ${failures.length} record file(s) failed:`);
    for (const f of failures) console.error(`  ${f.rel}`);
    console.error(`extract: appended ${appended}, skipped ${skipped}, errors ${errors}` +
      `${appended ? '' : ' — nothing written'}`);
    process.exit(1);
  }
  console.log(`extract: appended ${appended}, skipped ${skipped}, errors 0 (legacy files skipped: ${legacy})`);
}

function candidateRows(records) {
  const rows = [];
  for (const kind of ANCHOR_KINDS) {
    for (const level of LEVELS) {
      const sheetRank = { ownerFirst: false };
      const positives = pickDistinct(records.filter((r) => isPositive(r, kind, level)), 4, sheetRank);
      const negatives = pickDistinct(records.filter((r) => isNegative(r, kind, level)), 2, sheetRank);
      for (const r of [...positives, ...negatives]) {
        if (rows.some((x) => x.id === r.id)) continue;
        rows.push(r);
      }
    }
  }
  return rows;
}

function modeSheetCandidates(flags, root, records) {
  const out = flagValue(flags, 'out') || join(root, 'docs', 'critic-calibration', 'grading-sheet.md');
  const rows = candidateRows(records);
  const text = [
    '# Critic severity — seed grading sheet',
    '',
    'One row per anchor candidate. Fill `proposed level` and `reason` for every row; the owner column',
    'is authoritative where it is filled and a blank owner cell means the pre-grade stands. Correct the',
    'consequence in place — it is the text the ruler prints, so it must read stack-neutral, name no',
    'feature, path or repository, and stay at or under 160 characters. A slash reads as a path, so',
    'write a ratio as "8 of 14", never "8/14".',
    '',
    `| ${SHEET_COLUMNS.join(' | ')} |`,
    `|${SHEET_COLUMNS.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${[
      r.id, r.kind, r.round, r.level_given, r.disposition, r.title, r.consequence, '', '', '', '',
    ].join(' | ')} |`),
    '',
  ].join('\n');
  writeArtifact(out, text);
  console.log(`sheet: ${rows.length} candidate row(s) written to ${out}`);
}

/** mulberry32 over a hash of the selector — same selection, same order, every run. */
function seededShuffle(items, seedText) {
  let a = parseInt(createHash('sha256').update(seedText).digest('hex').slice(0, 8), 16) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// `untouchable` is stripped with the levels: the three classes never downgrade, so printing the class
// hands the grader a near-certain CRITICAL — the reader's own grade in disguise.
const BLIND_COLUMNS = ['row', 'kind', 'round', 'title', 'consequence', 'evidence',
  `level (${LEVELS.join(' / ')})`, 'note'];

function modeSheetBlind(flags, root, records) {
  const selText = flagValue(flags, 'select');
  if (!selText) usage('sheet --blind needs --select kind=…,feature=…,round=…');
  const sel = parseSelector(selText);
  const chosen = records.filter((r) => matchesSelector(r, sel));
  if (!chosen.length) fail(`no record matches the selector "${selText}"`);
  const out = flagValue(flags, 'out') || join(root, 'docs', 'critic-calibration', 'blind-sheet.md');

  const shuffled = seededShuffle(chosen, selText);
  const map = {};
  const rows = shuffled.map((r, i) => {
    const row = `b-${String(i + 1).padStart(2, '0')}`;
    map[row] = r.id;
    return `| ${[row, r.kind, r.round, r.title, r.consequence, r.evidence, '', ''].join(' | ')} |`;
  });

  const text = [
    '# Critic severity — blind re-grade sheet',
    '',
    'Grade each row on its own terms. Levels, anchors, dispositions and ids are stripped by',
    'construction. Fill the level column for every row; the note column is optional.',
    '',
    `| ${BLIND_COLUMNS.join(' | ')} |`,
    `|${BLIND_COLUMNS.map(() => '---').join('|')}|`,
    ...rows,
    '',
  ].join('\n');
  // The SIDECAR FIRST: `score` cannot read a sheet whose map is missing, so a half-written pair must
  // fail with no sheet rather than with a sheet nothing can score.
  writeArtifact(`${out}.map.json`, JSON.stringify(map, null, 2) + '\n');
  writeArtifact(out, text);
  console.log(`sheet: ${rows.length} blind row(s) written to ${out}; id sidecar ${out}.map.json`);
}

function modeIngest(flags, root, records) {
  const sheet = flagValue(flags, 'sheet');
  if (!sheet) usage('ingest needs --sheet {file}');
  if (!existsSync(sheet)) fail(`${sheet}: no such sheet`);
  // Refused before the sheet is read, and refused rather than defaulted: a mistyped grader that fell
  // back to `owner` would write a human's name onto rows no human graded, which is the one claim the
  // provenance line exists to keep honest.
  const signed = GRADERS.map((g) => `"${g}"`).join(' or ');
  const grader = flags.has('grader') ? flagValue(flags, 'grader') : 'owner';
  if (grader === null) usage(`--grader needs a value — a filled sheet is signed ${signed}`);
  if (!GRADERS.includes(grader)) {
    usage(`--grader ${JSON.stringify(grader)} is not a grader — a filled sheet is signed ${signed}`);
  }
  const lines = readFileSync(sheet, 'utf8').split(/\r?\n/);
  const table = parseTable(lines, 0, lines.length);
  if (!table) fail(`${sheet}: no table found`);
  const missing = SHEET_COLUMNS.filter((c) => !table.headers.includes(c));
  if (missing.length) {
    fail(`${sheet}:${table.headerLine + 1}: the grading sheet is missing the column(s) ` +
      `${missing.map((c) => `"${c}"`).join(', ')} — the columns are read by header name`);
  }
  const cell = cellReader(table);
  const byId = new Map(records.map((r) => [r.id, r]));

  let updated = 0;
  for (const row of table.rows) {
    const id = cell(row, 'id');
    const record = byId.get(id);
    if (!record) fail(`${sheet}:${row.line + 1}: no corpus record with id "${id}"`);
    const ownerLevel = cell(row, 'owner level');
    const proposed = cell(row, 'proposed level');
    const level = !blank(ownerLevel) ? ownerLevel : proposed;
    if (!LEVELS.includes(level)) {
      fail(`${sheet}:${row.line + 1}: row "${id}" carries no graded level — fill "proposed level" or "owner level"`);
    }
    const consequence = cell(row, 'consequence (edit)');
    const note = cell(row, 'owner note');
    const reason = cell(row, 'reason');
    record.level_after = level;
    if (!blank(consequence)) record.consequence = consequence;
    record.graded_by = !blank(ownerLevel) ? grader : 'pre-grade';
    if (!blank(note)) record.grade_note = note;
    else if (!blank(reason)) record.grade_note = reason;
    record.reviewed = true;
    updated += 1;
  }
  const dropped = [];
  writeCorpus(corpusPath(root), records, (id, key) => dropped.push(`${id}: "${key}"`));
  for (const d of [...new Set(dropped)]) console.error(`dropped key not in the record schema — ${d}`);
  console.log(`ingest: ${updated} record(s) graded from ${sheet}`);
}

function modeDerive(flags, root, records) {
  if (flags.get('dry-run')) {
    const list = refusals(records, root);
    for (const r of list) console.log(`refused ${r.id}: ${r.reasons.join('; ')}`);
    console.log(`derive --dry-run: ${list.length} refusal(s); nothing written`);
    process.exit(list.length ? 1 : 0);
  }
  const seed = Boolean(flags.get('seed'));
  // `--seed` targets the file inside this skill's own folder. In a consuming repo that folder is a
  // read-only, version-keyed plugin cache: writing there would be silently discarded on the next
  // plugin update, and the repo's real ruler — the overlay — would stay unwritten.
  if (seed && !isPluginSourceRepo(root) && !flagValue(flags, 'out')) {
    usage('--seed writes the shipped ruler inside the skill bundle, which is read-only outside the ' +
      'plugin source repo — derive the overlay instead (drop --seed), or name an --out path');
  }
  const date = flagValue(flags, 'date') || today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) usage(`--date ${date} must be an ISO date`);
  const holdOutText = flagValue(flags, 'hold-out');
  const holdOut = holdOutText ? parseSelector(holdOutText) : null;
  const out = flagValue(flags, 'out')
    || (seed ? join(SKILL_ROOT, 'references', 'ruler.md') : join(root, 'docs', 'critic-calibration', 'ruler.md'));

  const text = deriveText(records, root, { date, seed, holdOut });
  writeArtifact(out, text);
  // Named on stderr, exit 0: the ruler WAS produced — the record is only excluded from anchor
  // selection, and its levels still feed the bias table.
  const refused = refusals(records, root);
  for (const r of refused) console.error(`excluded from anchor selection — ${r.id}: ${r.reasons.join('; ')}`);
  // The anchor count is the honest headline: a corpus whose folds never fill `level after` derives a
  // ruler with eight empty cells and no error anywhere, which reads exactly like a working run.
  const anchors = (text.match(/^\| [a-z]+-\d{4} \| /gm) || []).length;
  console.log(`derive: ${records.length} record(s) -> ${out}${refused.length ? ` (${refused.length} excluded as anchors)` : ''}`);
  console.log(`derive: ${anchors} anchor row(s) across the cells${anchors === 0 ? ' — no fold has filled a "level after" cell yet' : ''}`);
}

function modeScore(flags, records) {
  const sheet = flagValue(flags, 'sheet');
  if (!sheet) usage('score needs --sheet {file}');
  if (!existsSync(sheet)) fail(`${sheet}: no such sheet`);
  const mapFile = `${sheet}.map.json`;
  if (!existsSync(mapFile)) fail(`${mapFile}: the blind sheet's id sidecar is missing`);
  const map = JSON.parse(readFileSync(mapFile, 'utf8'));
  const lines = readFileSync(sheet, 'utf8').split(/\r?\n/);
  const table = parseTable(lines, 0, lines.length);
  if (!table) fail(`${sheet}: no table found`);
  const levelHeader = table.headers.find((h) => h.startsWith('level'));
  if (!levelHeader) fail(`${sheet}: the blind sheet has no level column`);
  const cell = cellReader(table);
  const byId = new Map(records.map((r) => [r.id, r]));

  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  let atOrBelowMedium = 0;
  let total = 0;
  for (const row of table.rows) {
    const key = cell(row, 'row');
    const blind = cell(row, levelHeader);
    if (blank(blind)) fail(`${sheet}:${row.line + 1}: row "${key}" has an empty level cell`);
    if (!LEVELS.includes(blind)) fail(`${sheet}:${row.line + 1}: row "${key}" carries "${blind}", not a level`);
    const id = map[key];
    if (!id) fail(`${mapFile}: no id for row "${key}"`);
    const record = byId.get(id);
    if (!record) fail(`no corpus record with id "${id}" (row ${key})`);
    console.log(`${key} ${id}: given ${record.level_given} / after ${record.level_after || '—'} / blind ${blind}`);
    counts[blind] += 1;
    if (LEVEL_RANK[blind] <= LEVEL_RANK.MEDIUM) atOrBelowMedium += 1;
    total += 1;
  }
  // The gate reads the denominator, so a sheet the grader shortened must not quietly shrink it: a
  // deleted row would raise the ratio while looking like a smaller, cleaner run.
  const expected = Object.keys(map).length;
  if (total !== expected) {
    fail(`${sheet}: scored ${total} row(s) but the sidecar names ${expected} — a row is missing from ` +
      'the sheet, and the distribution below it would be read against the wrong denominator');
  }
  console.log(`distribution: ${LEVELS.map((l) => `${l} ${counts[l]}`).join(' · ')}`);
  console.log(`blind at MEDIUM or below: ${atOrBelowMedium} of ${total}`);
}

const LEDGER_HEADING = '## Coverage ledger';

function ledgerFigures(lines, from, to) {
  let at = -1;
  for (let i = from; i < to; i += 1) {
    if (lines[i].trim() === LEDGER_HEADING) {
      at = i;
      break;
    }
  }
  if (at < 0) return null;
  // Scan to the first table, not a fixed window: prose between the heading and the header line is
  // legitimate, and a window that misses it prints em-dashes that read as "the reader recorded none".
  let header = '';
  for (let i = at + 1; i < to && !isRow(lines[i]); i += 1) {
    if (/^Round:/.test(lines[i].trim())) {
      header = lines[i].trim();
      break;
    }
  }
  const fields = {};
  for (const part of header.split('·')) {
    const m = part.match(/^\s*(\w+):\s*(.*?)\s*$/);
    if (m) fields[m[1].toLowerCase()] = m[2];
  }
  const table = parseTable(lines, at + 1, to);
  let rows = 0;
  let notOpened = 0;
  if (table) {
    const idx = table.headers.indexOf('status');
    rows = table.rows.length;
    for (const row of table.rows) {
      const status = (row.cells[idx >= 0 ? idx : row.cells.length - 1] || '').trim();
      if (status.startsWith('NOT OPENED')) notOpened += 1;
    }
  }
  return { at, depth: fields.depth || '—', bar: fields.bar || '—', ruler: fields.ruler || '—', rows, notOpened };
}

function modeMetrics(flags, root, records) {
  const slug = flagValue(flags, 'slug');
  if (!slug) usage('metrics needs --slug {slug}');
  // Exact segment match, and a nested issue is addressed as `{epic}/{issue}`: a bare epic slug on a
  // nested layout otherwise returned whichever issue sorted first, silently measuring the wrong one.
  const wanted = slug.split('/').filter(Boolean);
  const file = findRecordFiles(root).find((f) => {
    const parts = relPath(root, f).split('/');
    const delivery = parts.lastIndexOf('delivery');
    const owned = parts.slice(2, delivery);
    return owned.length === wanted.length && owned.every((s, i) => s === wanted[i]);
  });
  if (!file) {
    fail(`no review record for slug "${slug}" under ${root} — a nested issue is addressed as ` +
      '"{epic}/{issue}", and the slug must match the path segments exactly');
  }
  const rel = relPath(root, file);
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  // The wrapper that keeps this mode's observable behaviour exactly where it was once the parse path
  // throws instead of exiting: `fail()`'s one-line `derive-ruler: {message}` on stderr, exit 1. A
  // consuming repo's close gate quotes this line verbatim into its deny reason, so a stack trace here
  // would put local absolute paths in front of an operator as their remediation.
  let rounds;
  try {
    rounds = parseRecordFile(text, rel);
  } catch (e) {
    if (!(e instanceof RecordParseError)) throw e;
    // `return`, not a bare call: `fail()` never returns today, but if it ever stopped exiting, the
    // fallthrough would read `.legacy` off `undefined` and print a stack trace in the one place this
    // wrapper exists to keep stack-trace-free.
    return fail(e.message);
  }
  if (rounds.legacy) fail(`${rel}: legacy record (${rounds.legacy}) — nothing to measure`);

  const cols = ['round', 'reader', 'depth', 'bar', 'ruler', 'ledger rows', 'not opened',
    ...LEVELS, 'anchor citation', 'miss tags', 'tag tally'];
  console.log(`metrics: ${rel}`);
  console.log(`| ${cols.join(' | ')} |`);
  console.log(`|${cols.map(() => '---').join('|')}|`);

  let ranThree = false;
  for (let k = 0; k < rounds.length; k += 1) {
    const round = rounds[k];
    if (round.round >= 3) ranThree = true;
    const start = round.headLine;
    const end = k + 1 < rounds.length ? rounds[k + 1].headLine : lines.length;

    const mCell = cellReader(round.merge);
    const byLevel = Object.fromEntries(LEVELS.map((l) => [l, 0]));
    let cited = 0;
    let rankable = 0;
    let tags = 0;
    // The two reserved tag values and everything else, counted apart. This is the number that
    // decides whether the fold's own new text or the earlier round's miss is producing the later
    // rounds' findings — readable by hand today, which is why nobody has read it.
    const tally = { fold: 0, miss: 0, other: 0 };
    for (const row of round.merge.rows) {
      const level = settledLevel(mCell(row, 'level'));
      if (level) byLevel[level] += 1;
      const anchor = parseAnchorCell(mCell(row, 'anchor'));
      // A round that ran before any ruler existed is not a round that failed to cite: it is outside
      // the denominator entirely, which is why an all-unruled round prints `n/a` and never `0`.
      if (!anchor.noRulerYet) {
        rankable += 1;
        if (anchor.anchor_cited) cited += 1;
      }
      const tag = mCell(row, 'tag');
      // ONE predicate, read by the `miss tags` column and the tally alike, so the same row cannot be
      // a miss to one and not the other through two spellings of the rule.
      const isMiss = /round-\d+ miss/i.test(tag);
      if (isMiss) tags += 1;
      // `fold` is matched at the head of the cell, so `fold` and a qualified `fold — {where}` both
      // count while a topic label that merely mentions the word does not.
      const isFold = /^fold\b/i.test(tag);
      // The tally's arms are EXCLUSIVE and fold wins, while `miss tags` counts every miss token. So
      // a cell carrying both — which the vocabulary does not permit — lands in fold here and is
      // still counted there, and the tally's miss count sits one below the column. Stated because
      // the two numbers print side by side and a reader will otherwise read the gap as a bug.
      if (isFold) tally.fold += 1;
      else if (isMiss) tally.miss += 1;
      else tally.other += 1;
    }
    // `round-n miss`, not `round-1 miss`: the predicate matches the round the tag names, so a
    // round-2 miss counts here too and a label naming round 1 would misreport it.
    const tagTally = `fold ${tally.fold} · round-n miss ${tally.miss} · other ${tally.other}`;
    const citation = rankable === 0 ? 'n/a' : `${Math.round((cited / rankable) * 100)}%`;

    let secondAt = -1;
    for (let i = start; i < end; i += 1) {
      if (/^## Second reader — round \d+/.test(lines[i])) {
        secondAt = i;
        break;
      }
    }
    const readers = [['primary', ledgerFigures(lines, start, secondAt >= 0 ? secondAt : end)]];
    if (secondAt >= 0) readers.push(['second', ledgerFigures(lines, secondAt, end)]);

    for (const [reader, fig] of readers) {
      // `n/a` where there is no ledger at all — a zero would be indistinguishable from a reader who
      // wrote a ledger and opened nothing, which is the opposite finding.
      const f = fig || { depth: 'n/a', bar: 'n/a', ruler: 'n/a', rows: 'n/a', notOpened: 'n/a' };
      console.log(`| ${[round.round, reader, f.depth, f.bar, f.ruler, f.rows, f.notOpened,
        ...LEVELS.map((l) => byLevel[l]), citation, tags, tagTally].join(' | ')} |`);
    }
  }
  console.log(`round 3 ran: ${ranThree ? 'yes' : 'no'}`);
  console.log(`corpus records for this slug: ${records.filter((r) => r.origin && r.origin.feature === slug).length}`);
}

function modeCheck(flags, root, records) {
  if (flags.get('corpus-only')) {
    const errs = [];
    records.forEach((r, i) => errs.push(...schemaErrors(r, i)));
    errs.push(...duplicateIdErrors(records));
    // Schema first, and STOP there: the refusal list reads fields a schema-invalid record may not
    // have, so running it anyway turns a clean validation message into a stack trace beneath it.
    if (errs.length) {
      for (const e of errs) console.error(`derive-ruler: ${e}`);
      console.error(`check --corpus-only: ${errs.length} schema error(s)`);
      process.exit(1);
    }
    const refused = refusals(records, root);
    for (const r of refused) console.log(`refusal-list hit ${r.id}: ${r.reasons.join('; ')} (advisory — derive --dry-run is the gate)`);
    console.log(`check --corpus-only: ${records.length} record(s) valid; ${refused.length} refusal-list hit(s)`);
    return;
  }

  const seed = Boolean(flags.get('seed'));
  // The mirror of derive's guard: outside the plugin source repo the shipped seed was derived from a
  // corpus this repo does not have, so re-deriving from the local one reports drift on every run and
  // blames the shipped file for it.
  if (seed && !isPluginSourceRepo(root) && !flagValue(flags, 'ruler')) {
    usage('--seed checks the shipped ruler against THIS repo\'s corpus, which only matches inside the ' +
      'plugin source repo — check the overlay instead (drop --seed), or name a --ruler path');
  }
  const target = flagValue(flags, 'ruler')
    || (seed ? join(SKILL_ROOT, 'references', 'ruler.md') : join(root, 'docs', 'critic-calibration', 'ruler.md'));
  if (!existsSync(target)) {
    console.log('no ruler on disk — nothing to compare');
    return;
  }
  const onDisk = readFileSync(target, 'utf8');
  const prov = onDisk.split(/\r?\n/).find((l) => l.startsWith('Provenance:'));
  const dm = prov && prov.match(/derived (\d{4}-\d{2}-\d{2})/);
  if (!dm) fail(`${target}: no "Provenance: derived {ISO date}" line to re-derive from`);
  // A hold-out ruler is a scratch artifact by construction — records were excluded from it that a
  // plain re-derivation puts back, so the byte comparison would report drift forever. Say which it
  // is, rather than letting the gate cry wolf on a file it was never meant to guard.
  if (/held out\b/.test(prov)) {
    fail(`${target}: this ruler was derived with records held out, so a plain re-derivation cannot ` +
      'reproduce it — the drift gate guards the shipped seed and the overlay, not a hold-out ruler');
  }
  const label = /— seed\s*$/m.test(onDisk.split(/\r?\n/)[0]) ? true : false;
  const rebuilt = deriveText(records, root, { date: dm[1], seed: label, holdOut: null });
  // Compare line-wise, so a CRLF checkout of a correct ruler is not reported as a hand edit.
  const a = onDisk.split(/\r?\n/);
  const b = rebuilt.split(/\r?\n/);
  if (a.length !== b.length || a.some((l, i) => l !== b[i])) {
    const at = a.findIndex((l, i) => l !== b[i]);
    const line = at < 0 ? Math.min(a.length, b.length) + 1 : at + 1;
    fail(`${target}: drift — the file differs from a re-derivation at its own date (first difference ` +
      `at line ${line}). The inputs are the corpus and, where present, ${denyFile(root)}.`);
  }
  console.log(`check: ${target} matches a re-derivation at ${dm[1]}`);
}

// ── entry point ────────────────────────────────────────────────────────────────────────────────
const mode = process.argv[2];
if (!mode || mode.startsWith('--')) usage('no mode given');
const flags = parseArgs(process.argv.slice(3));

if (mode === 'extract') {
  modeExtract(flags);
} else if (mode === 'sheet') {
  const root = repoRoot(flags);
  const records = readCorpus(corpusPath(root));
  if (flags.get('blind')) modeSheetBlind(flags, root, records);
  else if (flags.get('candidates')) modeSheetCandidates(flags, root, records);
  else usage('sheet needs --candidates or --blind');
} else if (mode === 'ingest') {
  const root = repoRoot(flags);
  modeIngest(flags, root, readCorpus(corpusPath(root)));
} else if (mode === 'derive') {
  const root = repoRoot(flags);
  modeDerive(flags, root, readCorpus(corpusPath(root)));
} else if (mode === 'score') {
  const root = repoRoot(flags);
  modeScore(flags, readCorpus(corpusPath(root)));
} else if (mode === 'metrics') {
  const root = repoRoot(flags);
  modeMetrics(flags, root, readCorpus(corpusPath(root)));
} else if (mode === 'check') {
  const root = repoRoot(flags);
  modeCheck(flags, root, readCorpus(corpusPath(root)));
} else {
  usage(`unknown mode "${mode}"`);
}
