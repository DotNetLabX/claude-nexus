'use strict';
/**
 * A seat job's end, read by codex-job.js: whether a fallback is owed, and which steps the job finished. Whether
 * the job has really stopped writing in its tree is the box's to say (lib/seat-box.js).
 *
 * A FALLBACK IS OWED where the job failed, lost its worker or its box's keeper, was cut or cancelled, or completed with no hand-back
 * line of the role's own: a line addressed `For team-lead:` or `For architect:` in one of its row's forms in the seat
 * table (lib/codex-entry.js) — opening with a blocker or fix phrase, ending with a unit phrase, or opening with a
 * unit phrase whose disposition follows the next colon. A question job has handed back if it returns marked
 * material to write or relay, uses the row's questions or blocker phrase, or gives an all-clear in the row's form.
 * A unit phrase does not count where a negation — `not`, `no`, `never`, or a word ending
 * `n't` — stands before it in its clause, which runs from the previous comma, semicolon, colon or dash.
 *
 * A STEP IS FINISHED on the seat's own word and a proof: its `## Step {n}` block in the feature's
 * implementation.md ends with `**Step done:** {n}`, and the latest step-run record of that unit made by this job
 * (lib/seat-records.js) counts as passing (lib/run-verdict.js) or was skipped for want of a runner; with no such
 * record, only where the tree declares no unit test role.
 */
const fs = require('fs');
const path = require('path');
const { seatRow } = require('./codex-entry');
const { jobStepRuns } = require('./seat-records');
const { specFolder } = require('./parts');

const strings = (list) => (Array.isArray(list) ? list.filter((p) => typeof p === 'string' && p) : []);
const ADDRESSED = /^(?:for team-lead|for architect):/;
const QUESTION_FOOTER = /^(?:plan:\s+docs\/specs\/\S+\/delivery\/plan\.md|codex session id:\s*\S+)$/;
const handbackLine = (raw) => raw.replace(/^[\s>#*_`-]+/, '').replace(/\*\*/g, '').trim().toLowerCase();
const CLAUSE_BREAK = /[,;:–—]|\s-\s/g;
const NEGATION = /(?:^|[^a-z'’])(?:not|no|never|[a-z]+n['’]t)(?![a-z])/;

// Whether a negation stands in the clause of `text` that runs up to `at`, from its last comma, semicolon, colon or dash.
function negatedAt(text, at) {
  const before = text.slice(0, at);
  let start = 0;
  for (const m of before.matchAll(CLAUSE_BREAK)) start = m.index + m[0].length;
  return NEGATION.test(before.slice(start));
}

// A hand-back line is addressed — `For team-lead:` or `For architect:` — and what follows the address opens with a
// blocker or fix phrase of the row, ends with a unit phrase, or opens with a unit phrase whose disposition — a
// blocker or fix phrase — follows the next colon, as a solo's verdict does.
function handsBack(role, output) {
  const row = seatRow(role);
  const groups = row && row.handbackPhrases ? row.handbackPhrases : {};
  const lower = (list) => strings(list).map((p) => p.toLowerCase());
  const dispositions = lower([...(groups.blocker || []), ...(groups.fix || [])]);
  const units = lower(groups.unit);
  const opens = (t, list) => list.some((p) => t.startsWith(p));
  return String(output || '').split(/\r?\n/).some((raw) => {
    const line = handbackLine(raw);
    const addressed = ADDRESSED.exec(line);
    if (!addressed) return false;
    const rest = line.slice(addressed[0].length).trim();
    if (opens(rest, dispositions)) return true;
    const ended = rest.replace(/[\s.!]+$/, '');
    if (units.some((p) => ended.endsWith(p) && !negatedAt(ended, ended.length - p.length))) return true;
    const colon = rest.indexOf(':');
    return colon > 0 && opens(rest, units) && opens(rest.slice(colon + 1).trim(), dispositions);
  });
}

function questionHandback(role, output, slug) {
  const text = String(output || '');
  const markers = [...text.matchAll(/^<!-- nexus-seat-questions:(start|end) -->\r?$/gm)];
  if (markers.length) {
    const [open, close] = markers;
    if (open[1] !== 'start') return { kind: 'relay', note: 'the questions block has no opening marker' };
    if (!close) return { kind: 'relay', note: 'the questions block has no closing marker' };
    if (close[1] !== 'end' || markers.length !== 2) return { kind: 'relay', note: 'the questions block has unexpected markers' };
    const from = open.index + open[0].length + 1;
    const to = close.index;
    const count = [...text.slice(from, to).matchAll(/^## Q\d+\b/gm)].length;
    if (!count) return { kind: 'relay', note: 'the marked questions block has no question entries' };
    return { kind: 'block', from, to, count };
  }

  const phrases = seatRow(role)?.handbackPhrases;
  const openers = strings(phrases?.questions).map((phrase) => phrase.toLowerCase());
  const blockers = strings(phrases?.blocker).map((phrase) => phrase.toLowerCase());
  const heading = `questions before implementing ${String(slug || '').toLowerCase()}:`;
  const lines = text.split(/\r?\n/);
  let clear = false;
  for (const [index, raw] of lines.entries()) {
    const handback = handbackLine(raw);
    const addressed = ADDRESSED.test(handback);
    const line = handback.replace(ADDRESSED, '').trimStart();
    if (addressed && blockers.some((phrase) => line.startsWith(phrase))) {
      return { kind: 'blocker', note: 'route the blocker from the question hand-back output' };
    }
    const opener = openers.find((phrase) => line.startsWith(phrase));
    if (!opener) continue;
    if (opener === 'all clear') {
      clear ||= /^all clear(?:$|[.!]|\s*[,:—–-]|\s+and ready\b)/.test(line);
      continue;
    }
    if (slug && line.startsWith(heading)) {
      let disposition = line.slice(heading.length);
      for (const raw of lines.slice(index + 1)) {
        const next = raw.trim().replace(/\*\*/g, '').toLowerCase();
        if (ADDRESSED.test(next) || QUESTION_FOOTER.test(next)) break;
        disposition += ` ${next}`;
      }
      if (/^none(?:\s*[—–-]+\s*all clear(?:,?\s+(?:and\s+)?ready to implement)?)?[.!]?$/.test(disposition.trim().replace(/\s+/g, ' '))) {
        clear = true;
        continue;
      }
    }
    return { kind: 'relay', note: 'the question hand-back has no marked questions block' };
  }
  return { kind: clear ? 'clear' : 'missing' };
}

/** `{fallback, fallbackReason}` for a seat job's end. */
function fallbackOf({ role, state, reason, output, cut, questions = false, question, slug }) {
  if (state === 'completed') {
    const returned = questions ? (question ?? questionHandback(role, output, slug)).kind !== 'missing' : handsBack(role, output);
    if (returned) return { fallback: false, fallbackReason: null };
    return { fallback: true, fallbackReason: `the job ended with no hand-back line of the ${role}'s own` };
  }
  if (cut) return { fallback: true, fallbackReason: `the job was cut: ${reason}` };
  if (state === 'cancelled') return { fallback: true, fallbackReason: 'the job was cancelled' };
  const lost = /\b(worker|keeper) exited\b/.exec(String(reason || ''));
  if (lost) return { fallback: true, fallbackReason: `the job lost its ${lost[1] === 'keeper' ? 'box\'s keeper' : 'worker'}: ${reason}` };
  return { fallback: true, fallbackReason: `the job failed${reason ? `: ${reason}` : ''}` };
}

function declaresUnit(tree) {
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); } catch { return false; }
  return require('../test-entry-gate').declaresUnit(cfg);
}

/** The step ids this job finished, in the order their blocks stand. */
function finishedSteps({ tree, slug, role, since }) {
  const folder = specFolder(tree, slug);
  let body;
  try { body = fs.readFileSync(path.join(folder, 'delivery', 'implementation.md'), 'utf8'); } catch { return []; }
  const { countsAsPassing } = require('./run-verdict');
  const runs = jobStepRuns({ tree, role, since });
  const unitDeclared = declaresUnit(tree);
  const out = [];
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const head = /^## Step (\S+?)\s+—/.exec(lines[i]);
    if (!head) continue;
    const id = head[1];
    let last = '';
    for (let j = i + 1; j < lines.length && !/^## /.test(lines[j]); j++) if (lines[j].trim()) last = lines[j].trim();
    const done = /^\*\*Step done:\*\*\s*(\S+)$/.exec(last);
    if (!done || done[1] !== id) continue;
    const mine = runs.filter((r) => String(r.unit) === id).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const latest = mine[mine.length - 1];
    const proven = latest ? countsAsPassing(latest) || latest.verdict === 'skipped' : !unitDeclared;
    if (proven) out.push(id);
  }
  return out;
}

module.exports = { fallbackOf, finishedSteps, questionHandback };
