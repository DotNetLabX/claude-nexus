'use strict';
/**
 * The critic-round schedule's check, shared by the spawn hook (round-gate.js) and the Codex job
 * helper's `start` (codex-job.js). It decides one question: may this spec or plan review round run?
 *
 * The schedule's one home is rules/on-demand/agents-workflow.md § Critic rounds. LAST_ROUND,
 * ROUND3_TRIGGER, the merge heading and the level column below are copies of that table and of its
 * persistence layout, which a convergence test holds equal.
 *
 * - Round 4 or later: refused, with no record read.
 * - Round 3: refused when the last round-2 merge table of the same review kind holds no row whose
 *   settled level is ROUND3_TRIGGER — a contested cell (`contested: {a} / {b} → {settled} — …`) is
 *   read by its settled level, bold or lower case read as the level. Anything that cannot prove the
 *   schedule passes: no record, no round-2 merge of that kind, no level column, a row whose level
 *   cell holds no readable level or whose cell count differs from the header's, an unreadable file.
 * - Rounds 1 and 2, a promotion review and a round with no number: never refused.
 * - The owner-ordered line, `Extra round: owner-ordered — "{the owner's words}"` with the words
 *   non-empty and not the placeholder, lets any round through; a hyphen for the dash and curly
 *   quotes are read the same.
 */
const fs = require('fs');
const path = require('path');

const LAST_ROUND = 3;
const ROUND3_TRIGGER = 'CRITICAL';
const MERGE_HEADING = '### Merge — round';
const LEVEL_COLUMN = 'level';
const KINDS = ['spec', 'plan'];
const KIND_BY_MODE = { 1: 'spec', 2: 'plan' };
const KIND_BY_LABEL = { 'spec-review': 'spec', 'plan-review': 'plan' };
const EXCEPTION_LINE = 'Extra round: owner-ordered — "{the owner\'s words, quoted}"';
const EXCEPTION_RE = /Extra round:\s*owner-ordered\s*[—–-]+\s*["“]([^"“”\r\n]*)["”]/;
const FOLDER_CUT = ['definition', 'delivery', 'sdd'];

const roundOf = (text) => {
  const m = /\bRound:\s*(\d+)\b/.exec(text);
  return m ? Number(m[1]) : null;
};
const kindOfMode = (text) => {
  const m = /\bMode:?\s*([123])\b/.exec(text);
  return m ? KIND_BY_MODE[m[1]] || null : null;
};
const artifactOf = (text) => {
  const m = /\bArtifact:\s*(?:`([^`\r\n]+)`|"([^"\r\n]+)"|“([^”\r\n]+)”|'([^'\r\n]+)'|(\S+))/.exec(text);
  if (!m) return null;
  const quoted = m[1] ?? m[2] ?? m[3] ?? m[4];
  const value = quoted !== undefined ? quoted.trim() : m[5].replace(/^[`'"(]+/, '').replace(/[`'")\].,;]+$/, '');
  return value || null;
};
// The pasted placeholder (`{the owner's words, quoted}`) is no owner's words.
const ownerOrdered = (text) => {
  const m = EXCEPTION_RE.exec(String(text || ''));
  const words = m ? m[1].trim() : '';
  return words !== '' && !words.startsWith('{');
};

/** `{slug} {spec-review|plan-review|promotion-review|code-review} round {n}` → { kind, round }, kind null outside spec and plan. */
function parseLabel(label) {
  const m = /^\s*\S+\s+(spec-review|plan-review|promotion-review|code-review)\s+round\s+(\d+)\s*$/.exec(String(label || ''));
  if (!m) return null;
  return { kind: KIND_BY_LABEL[m[1]] || null, round: Number(m[2]) };
}

/** The feature folder's top-level review record for an artifact path, resolved against `tree`. */
function recordPathFor(artifact, tree) {
  const parts = String(artifact).split(/[\\/]+/);
  // A folder above the repo may carry a cut name too, so the cut is searched after the last docs/specs.
  let from = 0;
  for (let i = parts.length - 2; i >= 0; i -= 1) if (parts[i] === 'docs' && parts[i + 1] === 'specs') { from = i + 2; break; }
  const cut = parts.findIndex((p, i) => i >= from && FOLDER_CUT.includes(p));
  if (cut <= 0) return null;
  return path.resolve(tree, parts.slice(0, cut).join('/'), 'delivery', 'review-critic.md');
}

/** The cell's settled level, or null where the cell holds no level the gate can read. */
function settledLevel(cell) {
  const text = String(cell).replace(/\*/g, '').trim().toUpperCase();
  const arrow = /(?:→|->)\s*(CRITICAL|HIGH|MEDIUM|LOW)\b/.exec(text);
  if (arrow) return arrow[1];
  return /^(CRITICAL|HIGH|MEDIUM|LOW)$/.test(text) ? text : null;
}

const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());

/** true / false where the last round-2 merge of `kind` proves it either way; null where it cannot. */
function round2HasTrigger(text, kind) {
  const lines = String(text).split(/\r?\n/);
  const heading = new RegExp(`^## Round 2 — \\S+ — ${kind} — primary\\b`);
  let start = -1;
  lines.forEach((l, i) => { if (heading.test(l)) start = i; });
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) if (/^## Round /.test(lines[i])) { end = i; break; }
  const mergeAt = lines.findIndex((l, i) => i > start && i < end && l.startsWith(`${MERGE_HEADING} 2`));
  if (mergeAt < 0) return null;
  let i = mergeAt + 1;
  while (i < end && !lines[i].trim().startsWith('|')) {
    if (/^#{1,3} /.test(lines[i])) return null;
    i += 1;
  }
  if (i >= end) return null;
  const headers = splitRow(lines[i]).map((h) => h.toLowerCase());
  const col = headers.indexOf(LEVEL_COLUMN);
  if (col < 0) return null;
  // A row the gate cannot read might hold the trigger, so it can only fail open, never refuse.
  let unreadable = false;
  for (i += 1; i < end && lines[i].trim().startsWith('|'); i += 1) {
    const cells = splitRow(lines[i]);
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const level = cells.length === headers.length ? settledLevel(cells[col]) : null;
    if (level === ROUND3_TRIGGER) return true;
    if (level === null) unreadable = true;
  }
  return unreadable ? null : false;
}

const askLine = `If the owner ordered this extra round, add the line ${EXCEPTION_LINE} to the brief, with the owner's words, quoted.`;

/**
 * { refused: false } or { refused: true, reason }.
 * `readRecord` returns the record's text or null, and may throw — a throw passes.
 * `recordName` names the record in the reason.
 */
function decide({ round, kind, text, readRecord, recordName = 'the review record' }) {
  if (!Number.isInteger(round) || !KINDS.includes(kind)) return { refused: false };
  if (ownerOrdered(text)) return { refused: false };
  if (round > LAST_ROUND) {
    return {
      refused: true,
      reason: `critic round ${round} refused: the critic-round schedule runs at most ${LAST_ROUND} rounds and never a fourth (agents-workflow.md § Critic rounds). The review stops here. ${askLine}`,
    };
  }
  if (round < LAST_ROUND) return { refused: false };
  let record;
  try { record = readRecord(); } catch { return { refused: false }; }
  if (typeof record !== 'string') return { refused: false };
  if (round2HasTrigger(record, kind) !== false) return { refused: false };
  return {
    refused: true,
    reason: `critic round 3 refused: round 3 runs only when round 2's merge table holds a finding whose level as reported is ${ROUND3_TRIGGER}, and the last ${kind} round-2 merge in ${recordName} holds none (agents-workflow.md § Critic rounds). The review stops at round 2. ${askLine}`,
  };
}

/** A file's text, or null where it is absent or not a file. */
function readIfFile(file) {
  if (!file || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return null;
  return fs.readFileSync(file, 'utf8');
}

module.exports = {
  LAST_ROUND, ROUND3_TRIGGER, MERGE_HEADING, LEVEL_COLUMN, EXCEPTION_LINE,
  roundOf, kindOfMode, artifactOf, ownerOrdered, parseLabel, recordPathFor, round2HasTrigger, decide, readIfFile,
};
