/**
 * The source check of a spec's business rules, as pure functions over the spec's text — plus the one
 * committed-version read both callers need.
 *
 * Every business rule ends with one source marker, `*(Source: {kind} {reference})*`; the grammar's home
 * is the spec template (skills/create-feature-spec/workflows/Template.md § Business Rules), never this
 * file. A rule is a numbered item at column 0 under `## Business Rules`, or a column-0 bullet opening
 * with a bold rule id (`- **BR1 — …**`); its text runs to the next rule, the next heading or the
 * section's end, so an indented item or a continuation line belongs to it. A rule with no marker, or
 * with a kind outside the six, is `missing`; a rule with an `added` source the owner has not kept is
 * `pending` — a keep reads `added — kept by owner {YYYY-MM-DD}`, the date required.
 *
 * Two callers, one rule: pipeline-gate.js invariant (10) refuses a foreground write that flips a spec
 * to Ready, and spec-sources.js is the command the PO, the architect and the team lead run before a
 * spec goes to planning — the gate never reaches a spawned writer. Both judge under one baseline:
 * where the last committed version reads Ready or Done, only rules whose text is new or changed
 * against it are checked (matched by text, whitespace normalised, never by number); otherwise every
 * rule is checked.
 *
 * Fail-open edges, each the caller's to apply: the committed read reports `error` (no git, not a
 * repository, no commit, a timeout, a committed path git cannot read) apart from `absent` (the ref's
 * tree holds no such path, case-folded on Windows) — the gate
 * allows on `error` and checks every rule on `absent`; the command checks every rule on both.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const KINDS = new Set(['ticket', 'contract', 'owner', 'document', 'pattern', 'added']);
const KEPT_RE = /^added\s*[—–-]\s*kept by owner\s+\d{4}-\d{2}-\d{2}\b/i;
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/;
const STATUS_RE = /^(?:\*\*Status:\*\*|Status:)[ \t]*(.*)$/;
const NUMBERED_RE = /^(\d+)[.)][ \t]+\S/;
const BOLD_ID_RE = /^[-*+][ \t]+\*\*([A-Z][A-Za-z]*-?\d+[a-z]?)\b/;

const lf = (s) => String(s == null ? '' : s).replace(/\r\n?/g, '\n');

/**
 * Per line, whether it is a fence delimiter or inside a code fence. A fence closes only on a delimiter
 * of its opening character, at least as long, with nothing after it but spaces — so an example fence
 * nested in a tilde or a longer fence stays inside it.
 */
function fencedLines(lines) {
  let open = null;
  return lines.map((line) => {
    const m = FENCE_RE.exec(line);
    if (!open) {
      if (m) open = m[1];
      return Boolean(m);
    }
    if (m && m[1][0] === open[0] && m[1].length >= open.length && !m[2].trim()) open = null;
    return true;
  });
}

/** The value of the first status line outside a code fence, or null. */
function statusValue(text) {
  const lines = lf(text).split('\n');
  const fenced = fencedLines(lines);
  for (let k = 0; k < lines.length; k++) {
    if (fenced[k]) continue;
    const m = STATUS_RE.exec(lines[k]);
    if (m) return m[1].trim();
  }
  return null;
}

const isReady = (text) => /^Ready\b/.test(statusValue(text) || '');
const isApproved = (text) => /^(?:Ready|Done)\b/.test(statusValue(text) || '');

/** The content of the last `(Source: …)` in the rule, its parentheses balanced, or null. */
function markerContent(text) {
  const re = /\(\s*Source:/gi;
  let last = null;
  for (let m = re.exec(text); m; m = re.exec(text)) last = m;
  if (!last) return null;
  let depth = 1;
  let i = last.index + last[0].length;
  const start = i;
  for (; i < text.length && depth > 0; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
  }
  return text.slice(start, depth === 0 ? i - 1 : i).trim();
}

function judge(rule) {
  const content = markerContent(rule.text);
  const parts = content === null ? [] : content.split(';').map((p) => p.trim()).filter(Boolean);
  rule.kinds = parts.map((p) => ((/^[A-Za-z]+/.exec(p) || [''])[0]).toLowerCase());
  rule.missing = parts.length === 0 || rule.kinds.some((k) => !KINDS.has(k));
  rule.pending = !rule.missing && parts.some((p, i) => rule.kinds[i] === 'added' && !KEPT_RE.test(p));
  return rule;
}

/** The business rules of a spec: `{ id, text, kinds, missing, pending }` each, in order. */
function readRules(text) {
  const lines = lf(text).split('\n');
  const fenced = fencedLines(lines);
  let start = -1;
  for (let k = 0; k < lines.length && start < 0; k++) {
    if (!fenced[k] && /^##[ \t]+Business Rules\b/i.test(lines[k])) start = k;
  }
  if (start < 0) return [];
  const rules = [];
  let current = null;
  for (let k = start + 1; k < lines.length; k++) {
    const line = lines[k];
    if (!fenced[k]) {
      if (/^#{1,2}[ \t]/.test(line)) break;
      if (/^#{3,6}[ \t]/.test(line)) { current = null; continue; }
      const numbered = NUMBERED_RE.exec(line);
      const bold = !numbered && BOLD_ID_RE.exec(line);
      if (numbered || bold) {
        current = { id: numbered ? numbered[1] : bold[1], lines: [line] };
        rules.push(current);
        continue;
      }
    }
    if (current) current.lines.push(line);
  }
  return rules.map(({ id, lines: body }) => judge({ id, text: body.join('\n').replace(/\s+$/, '') }));
}

/** A rule's text for the baseline match: its list marker and bold rule id dropped, whitespace normalised. */
const normalised = (rule) => rule.text
  .replace(/^(?:\d+[.)]|[-*+])[ \t]+/, '')
  .replace(/^\*\*[A-Z][A-Za-z]*-?\d+[a-z]?\b/, '**')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The check. `baseText` is the spec's last committed text, or null for none. Returns
 * `{ ok, missing, pending, rules }` — `missing` and `pending` list rule ids, `rules` the rules checked.
 */
function checkSpec(text, baseText = null) {
  let rules = readRules(text);
  if (baseText != null && isApproved(baseText)) {
    const known = new Set(readRules(baseText).map(normalised));
    rules = rules.filter((r) => !known.has(normalised(r)));
  }
  const missing = rules.filter((r) => r.missing).map((r) => r.id);
  const pending = rules.filter((r) => r.pending).map((r) => r.id);
  return { ok: missing.length === 0 && pending.length === 0, missing, pending, rules };
}

/**
 * The file's text at `ref`: `{ status: 'text', text }`, `{ status: 'absent' }` when the ref's tree
 * holds no such path, or `{ status: 'error' }` when git cannot answer — a path the tree holds but git
 * cannot read included. git runs from the nearest existing folder above the file, so a spec in a
 * folder not yet created is still read against the ref. `foldCase` (on by default on Windows, whose
 * file names ignore case while git's tree does not) matches the path against the tree case-folded,
 * and reads the committed name it finds.
 */
function readCommitted(file, ref, { timeoutMs = 5000, foldCase = process.platform === 'win32' } = {}) {
  const abs = path.resolve(file);
  let dir = path.dirname(abs);
  while (!fs.existsSync(dir) && path.dirname(dir) !== dir) dir = path.dirname(dir);
  const rel = `./${path.relative(dir, abs).split(path.sep).join('/')}`;
  const git = (args) => execFileSync('git', ['--no-optional-locks', ...args], {
    cwd: dir, timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  const show = (spec) => ({ status: 'text', text: git(['show', `${ref}:${spec}`]) });
  try {
    return show(rel);
  } catch (e) {
    if (e && (e.code === 'ETIMEDOUT' || e.signal)) return { status: 'error' };
  }
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    const fromTop = git(['rev-parse', '--show-prefix']).replace(/\r?\n$/, '') + rel.slice(2);
    const names = git(['ls-tree', '-r', '-z', '--name-only', '--full-tree', ref]).split('\0');
    if (names.includes(fromTop)) return { status: 'error' };
    const wanted = fromTop.toLowerCase();
    const committed = foldCase ? names.find((n) => n.toLowerCase() === wanted) : undefined;
    return committed ? show(committed) : { status: 'absent' };
  } catch { return { status: 'error' }; }
}

module.exports = { readRules, checkSpec, readCommitted, statusValue, isReady, isApproved, KINDS };
