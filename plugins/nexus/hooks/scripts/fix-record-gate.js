#!/usr/bin/env node
/**
 * Nexus fix-record check (SubagentStop, SYNCHRONOUS — sends a hand-back back once).
 *
 * A developer's fix round names, per finding it fixed, its search for the same flaw in sibling code:
 * the round's `## Fix Round {N}` (or `## Fix Round Hand-up {n}`) block in implementation.md carries
 * `**Class checked:**` lines (implementation-format § A fix round has no step of its own). This check
 * reads that block when a spawned developer hands back `Fixes applied for {name}. Cycle {N}/{M}.` or
 * `Fixes applied for {name}. Hand-up {n}.` — the hand-back text of lib/step-checkpoint.js, so a
 * hand-back made through the platform's tool counts too — and returns `{"decision":"block","reason":…}`
 * when the block, or a `**Class checked:**` line with text after it, is missing. The block runs from
 * its heading to the next `## ` heading; CRLF files read the same.
 *
 * REACH: a stop whose `agent_type` resolves to `developer` (lib/resolve-role.js) and whose hand-back is
 * one of those two lines. Every other stop, and bad JSON, exits 0 with nothing written. A main-session
 * developer persona raises no SubagentStop and is not covered.
 *
 * WHERE: the slug is the `slug` of `.claude/audit/dev-steps/{agent_id}.json` in the session root
 * (handoff-tracker.js writes it from the fix-round dispatch), else the hand-back's `{name}` where
 * a folder of that name exists. The file is `delivery/implementation.md` in the slug's folder — one, two or
 * three levels under docs/specs, a part inside a story inside an epic the deepest (lib/parts.js
 * `specFolder`) — in the session's declared worktree tree (lib/worktree-target.js), then in the session root.
 *
 * NEVER A LOOP: with `stop_hook_active` the block is still read — the line present passes silently, the
 * line still missing appends one `rule: "class-check"`, `blocked: false` row to
 * `.claude/audit/violations.log` and never blocks again (ADR-31). No slug or no file to read appends a
 * `check: "unreadable"` row naming what was missing and never blocks: a disclosed miss, never a silent
 * pass. A first refusal writes no row. Exit 0 on every path.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole } = require('./lib/resolve-role');
const { handbackText } = require('./lib/step-checkpoint');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { isSafeId } = require('./lib/safe-id');
const { specFolder } = require('./lib/parts');

const RULE = 'class-check';
const FIXES = /\bFixes applied for (.+?)\. (?:Cycle (\d+)\s*\/\s*\d+|Hand-up (\d+))\./;
const CLASS_LINE = /^\s*(?:[-*]\s+)?\*\*Class checked:\*\*\s*\S/;
const LINE_FORM = '`**Class checked:** {fix-list row}: {the search, as run} — {siblings fixed | none found | listed: {where}}`';
const NONE_FORM = '`**Class checked:** none — {why}`';

const slashed = (p) => String(p).replace(/\\/g, '/');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function stateSlug(root, agentId) {
  if (!isSafeId(agentId)) return '';
  const state = readJson(path.join(root, '.claude', 'audit', 'dev-steps', `${agentId}.json`));
  return state && isSafeId(state.slug) ? state.slug : '';
}

// The implementation.md of the slug under the first base that holds one, with that base.
function findImplementation(bases, slug) {
  for (const base of bases) {
    const folder = specFolder(base, slug);
    const file = folder && path.join(folder, 'delivery', 'implementation.md');
    if (file && fs.existsSync(file)) return { base, file };
  }
  return null;
}

// The round's block, from its heading to the next `## ` heading, or null when it has none.
function roundBlock(text, round) {
  const lines = String(text).split(/\r?\n/);
  const heading = new RegExp(`^## ${round}(?!\\d)`);
  let start = -1;
  for (let i = 0; i < lines.length; i++) if (heading.test(lines[i])) start = i;
  if (start < 0) return null;
  const block = [];
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) block.push(lines[i]);
  return block;
}

function logRow(root, row) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'violations.log'), `${JSON.stringify({ ts: new Date().toISOString(), rule: RULE, ...row, blocked: false })}\n`);
  } catch { /* observation never wedges the stop */ }
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return; }
  if (!data || typeof data !== 'object') return;
  if (resolveRole(data.agent_type) !== 'developer') return;
  const m = FIXES.exec(handbackText(data));
  if (!m) return;
  const round = m[2] ? `Fix Round ${m[2]}` : `Fix Round Hand-up ${m[3]}`;
  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const tree = resolveDeclaredTree(root, data.session_id);
  const bases = path.resolve(tree) === path.resolve(root) ? [root] : [tree, root];
  const who = { agent_id: data.agent_id || null, session: data.session_id || null, round };

  const name = m[1].trim();
  const slug = stateSlug(root, data.agent_id)
    || (isSafeId(name) && bases.some((b) => specFolder(b, name)) ? name : '');
  if (!slug) {
    return logRow(root, { check: 'unreadable', ...who, why: `no slug: no developer state file names one, and no docs/specs/${name}/ folder` });
  }
  const found = findImplementation(bases, slug);
  let text = null;
  if (found) { try { text = fs.readFileSync(found.file, 'utf8'); } catch { /* unreadable */ } }
  if (text === null) {
    return logRow(root, { check: 'unreadable', ...who, slug, why: `no readable implementation.md for ${slug}` });
  }

  const block = roundBlock(text, round);
  if (block && block.some((l) => CLASS_LINE.test(l))) return;
  if (data.stop_hook_active === true) {
    return logRow(root, { ...who, slug, why: 'second stop without the line' });
  }
  const rel = slashed(path.relative(found.base, found.file));
  const what = block ? `the \`## ${round}\` block in ${rel} has no \`**Class checked:**\` line` : `${rel} has no \`## ${round}\` block`;
  const reason = `Nexus fix-record check: ${what}. Before handing back, search the code for each fixed finding's shape — the same flaw in sibling code, not only the line it cited — and write one line per finding in that block: ${LINE_FORM}; a round that fixed only done-check items writes ${NONE_FORM} (implementation-format). Then hand back again.`;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try { main(input); } catch { /* never wedge a stop */ }
  process.exit(0);
});
