'use strict';

/**
 * The owner's decision review, rendered from the cards `decision-records.js` reads.
 *
 *   renderReview(cards, { title, previous }) -> markdown text
 *   readVerdicts(text) -> { [key]: verdict } — every filled verdict of a review file, by the key it is shown under
 *
 * A card's key is its id, its story before it where it has one: what the reader sees and the verdict command's
 * lists name. A decision with fewer than two options is not a card: it goes in the short list after the cards.
 * `previous` is the file as it stands: every filled verdict in it, of one paragraph or several, is kept on the
 * decision in the same place with the same answer (marked in a comment above its verdict line; a question's answer
 * is its own text, never only the option read from it); one whose
 * decision is gone, or whose place now holds another answer, is kept in a closing list, the second naming the
 * answer it was given on. A decision that reached several units (a campaign's shared answer) names them. The output depends on
 * the cards and `previous` alone. The factory loads this file through its `core-lib.js`.
 */

const { createHash } = require('crypto');

const PHASES = Object.freeze([['spec', 'Spec'], ['plan', 'Plan'], ['build', 'Build'], ['review', 'Review'], ['close', 'Close']]);
const KINDS = Object.freeze([['business', 'Business'], ['product', 'Product'], ['technical', 'Technical'], ['untagged', 'Untagged']]);
const LEVELS = Object.freeze(['high', 'medium', 'low', null]);
const BY_ORDER = Object.freeze([
  'PO', 'campaign PO', 'architect', 'campaign architect', 'decision entry', 'default taken', 'panel',
  'developer', 'reviewer', 'second reader', 'third reader', 'Codex', 'team lead',
]);
const NOT_RECORDED = 'not recorded';
const VERDICT = '**Your verdict:**';
const GONE_HEADING = 'Verdicts whose decision is gone';
const SHORT_HEADING = 'Decided with no alternative recorded';

const keyOf = (c) => (c.story ? `${c.story} ${c.id}` : c.id);
const phaseLabel = (phase) => (PHASES.find(([p]) => p === phase) || [null, phase || NOT_RECORDED])[1];
const kindOf = (c) => (KINDS.some(([k]) => k === c.kind) ? c.kind : 'untagged');
const levelOf = (c) => (LEVELS.includes(c.confidence) ? c.confidence : null);
const byOf = (c) => c.by || NOT_RECORDED;
const isCard = (c) => Array.isArray(c.options) && c.options.length >= 2;
const text = (v) => (v === null || v === undefined || String(v).trim() === '' ? NOT_RECORDED : String(v).replace(/\s*\n\s*/g, ' ').trim());

function byRank(by) {
  const i = BY_ORDER.indexOf(by);
  return i === -1 ? BY_ORDER.length : i;
}

function compareBy(a, b) {
  const ra = byRank(a);
  const rb = byRank(b);
  if (ra !== rb) return ra - rb;
  if (a === NOT_RECORDED || b === NOT_RECORDED) return a === NOT_RECORDED ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

const phaseRank = (c) => {
  const i = PHASES.findIndex(([p]) => p === c.phase);
  return i === -1 ? PHASES.length : i;
};
const kindRank = (c) => KINDS.findIndex(([k]) => k === kindOf(c));
const levelRank = (c) => LEVELS.indexOf(levelOf(c));

// Phase, who decided, kind, then confidence; records keep their order within a tie.
function sorted(cards) {
  return cards
    .map((c, i) => ({ c, i }))
    .sort((x, y) => phaseRank(x.c) - phaseRank(y.c) || compareBy(byOf(x.c), byOf(y.c)) || kindRank(x.c) - kindRank(y.c)
      || levelRank(x.c) - levelRank(y.c) || x.i - y.i)
    .map((x) => x.c);
}

function groupBy(list, keyFn) {
  const groups = [];
  for (const item of list) {
    const key = keyFn(item);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

// The ids whose number is the record's place: a plan row and a review finding are numbered in file order.
const PLACED = /^(?:plan D|review(?:-[a-z]+)? R)\d+$/;
const baseId = (c) => String(c.id || '').replace(/\s*\(\d+\)$/, '');
const storyId = (c) => `${c.story || ''}\n${baseId(c)}`;

const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

// What was decided: the record's own answer as written (a question's chosen option is only read from it), else
// the chosen options, else the record's reason, else its words.
function decidedOf(c) {
  const chosen = (Array.isArray(c.options) ? c.options : []).filter((o) => o && o.chosen).map((o) => text(o.text));
  const said = filled(c.answer) ? text(c.answer) : chosen.length ? chosen.join('; ') : text(filled(c.why) ? c.why : c.what);
  return said.replace(/-->/g, '→');
}

// A decision's place: its record, its story, its source and the record's own number. A number that is only a
// place (a plan row, a review finding, the second card of a repeated id) is replaced by the decision's words.
function slotOf(c, repeated) {
  const base = baseId(c);
  const record = PLACED.test(base) ? `${base.replace(/\d+$/, '#')}\n${text(c.what)}`
    : repeated.has(storyId(c)) ? `${base}\n${text(c.what)}` : base;
  return createHash('sha256').update([c.story || '', record, c.where || ''].join('\n')).digest('hex').slice(0, 12);
}

function identities(cards) {
  const seen = new Map();
  for (const c of cards) seen.set(storyId(c), (seen.get(storyId(c)) || 0) + 1);
  const repeated = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  return new Map(cards.map((c) => [c, { slot: slotOf(c, repeated), answer: decidedOf(c) }]));
}

const MARK = /^<!-- decision ([0-9a-f]+)(?: · answer: (.*))? -->\s*$/;
const markLine = (slot, answer) => `<!-- decision ${slot}${answer === null || answer === undefined ? '' : ` · answer: ${answer}`} -->`;
const EARLIER = (answer) => `(given on an earlier answer: ${answer}) `;
const ENDS_VERDICT = /^(?:#|---\s*$|<!--|- \*\*|\*\*Your verdict:\*\*|\*\*[^*]+? · .*\*\*\s*$)/;

// Every filled verdict of a review file in file order, with its key, the place and answer marked above it (null
// where none is) and whether it sits in the list of verdicts whose decision is gone. A verdict goes on, blank
// lines included, until a heading, a rule, a mark, a list entry, a card or another verdict line.
function readVerdictEntries(previous) {
  const entries = [];
  if (!previous) return entries;
  let key = null;
  let inGone = false;
  let mark = null;
  let open = null;
  const take = (k, first, gone) => {
    const entry = { key: k, identity: mark ? mark[1] : null, answer: mark && mark[2] !== undefined ? mark[2] : null, gone, lines: [first.trim()] };
    entries.push(entry);
    mark = null;
    return entry;
  };
  for (const line of String(previous).replace(/\r\n?/g, '\n').split('\n')) {
    if (open) {
      if (!ENDS_VERDICT.test(line.trim())) { open.lines.push(line.trim()); continue; }
      open = null;
    }
    if (/^## /.test(line)) { inGone = line.startsWith(`## ${GONE_HEADING}`); key = null; mark = null; continue; }
    if (line.trim() === '---') { key = null; mark = null; continue; }
    const marked = line.match(MARK);
    if (marked) { mark = marked; continue; }
    const head = line.match(/^\*\*([^*]+?) · .*\*\*\s*$/);
    if (head) { key = head[1]; continue; }
    const short = line.match(/^- \*\*([^*]+?)\*\* · .*\*\*Your verdict:\*\*\s*(.*)$/);
    if (short) { open = take(short[1], short[2], false); continue; }
    const gone = inGone && line.match(/^- \*\*([^*]+?):\*\*\s*(.*)$/);
    if (gone) { open = take(gone[1], gone[2], true); continue; }
    const verdict = key && line.match(/^\*\*Your verdict:\*\*\s*(.*)$/);
    if (verdict) {
      open = take(key, verdict[1], false);
      key = null;
    }
  }
  return entries
    .map((e) => {
      let verdict = e.lines.join('\n').replace(/^\n+|\n+$/g, '');
      if (e.answer !== null && verdict.startsWith(EARLIER(e.answer))) verdict = verdict.slice(EARLIER(e.answer).length);
      return { key: e.key, identity: e.identity, answer: e.answer, gone: e.gone, verdict };
    })
    .filter((e) => e.verdict);
}

function readVerdicts(previous) {
  const verdicts = {};
  for (const e of readVerdictEntries(previous)) if (!e.gone || !(e.key in verdicts)) verdicts[e.key] = e.verdict;
  return verdicts;
}

// Each card's kept verdict, matched by its place and answer in file order, and the verdicts no card matched; a
// verdict whose place holds a different answer now is marked as given on an earlier answer.
function keepVerdicts(cards, previous, ids) {
  const waiting = new Map();
  const unmatched = [];
  for (const e of readVerdictEntries(previous)) {
    if (!e.identity) { unmatched.push(e); continue; }
    waiting.set(e.identity, [...(waiting.get(e.identity) || []), e]);
  }
  const kept = new Map();
  const answers = new Map();
  for (const c of cards) {
    const { slot, answer } = ids.get(c);
    answers.set(slot, [...(answers.get(slot) || []), answer]);
    const queue = waiting.get(slot) || [];
    const i = queue.findIndex((e) => e.answer === answer);
    if (i !== -1) kept.set(c, queue.splice(i, 1)[0].verdict);
  }
  for (const queue of waiting.values()) unmatched.push(...queue);
  const gone = unmatched.map((e) => ({
    ...e, earlier: e.answer !== null && answers.has(e.identity) && !answers.get(e.identity).includes(e.answer),
  }));
  return { kept, gone };
}

const indented = (verdict, indent) => String(verdict || '').split('\n').join(`\n${indent}`);
const verdictLine = (kept, c, indent = '') => `${VERDICT} ${indented(kept.get(c), indent)}`;
const reachedOf = (c) => (Array.isArray(c.units) && c.units.length ? c.units.join(', ') : null);
const confidenceLabel = (c) => (levelOf(c) ? `${levelOf(c)} confidence` : 'confidence not recorded');

function cardBlock(c, kept, id) {
  const options = Array.isArray(c.options) && c.options.length
    ? ['**Options:**', ...c.options.map((o) => (o.chosen ? `- ✅ ${text(o.text)} (**chosen**)` : `- ▫️ ${text(o.text)}`))]
    : [`**Options:** ${NOT_RECORDED}`];
  return [
    `**${keyOf(c)} · ${confidenceLabel(c)} · ${c.area ? text(c.area) : 'area not recorded'}**`,
    '',
    `**The point:** ${text(c.what)}`,
    '',
    ...options,
    '',
    `**Why:** ${text(c.why)}`,
    '',
    `**Settled by:** ${byOf(c)} · source: ${text(c.where)}`,
    '',
    ...(reachedOf(c) ? [`**Reached:** ${reachedOf(c)}`, ''] : []),
    markLine(id.slot, id.answer),
    verdictLine(kept, c),
    '',
    '---',
    '',
  ];
}

function count(list, pred) {
  return list.filter(pred).length;
}

function summary(cards, short, all) {
  const k = (kind) => count(cards, (c) => kindOf(c) === kind);
  const l = (level) => count(cards, (c) => levelOf(c) === level);
  const marked = count(all, (c) => c.forOwner === true);
  const lines = [
    '## Summary',
    '',
    `Total: ${cards.length} cards — ${k('business')} business, ${k('product')} product, ${k('technical')} technical, ${k('untagged')} untagged; `
      + `${l('high')} high, ${l('medium')} medium, ${l('low')} low, ${l(null)} no confidence; ${marked} marked for you (⚠).`,
  ];
  if (short.length) lines.push('', `${short.length} decision${short.length === 1 ? '' : 's'} with no alternative recorded ${short.length === 1 ? 'is' : 'are'} listed after the cards.`);
  if (cards.length) {
    lines.push('', '| Phase | Decided by | Cards | Business | Product | Technical | Untagged | High | Medium | Low | None |', '|---|---|---|---|---|---|---|---|---|---|---|');
    for (const phase of groupBy(cards, (c) => phaseLabel(c.phase))) {
      for (const by of groupBy(phase.items, byOf)) {
        const g = by.items;
        const cells = [
          phase.key, by.key, g.length,
          ...KINDS.map(([kind]) => count(g, (c) => kindOf(c) === kind)),
          ...LEVELS.map((level) => count(g, (c) => levelOf(c) === level)),
        ];
        lines.push(`| ${cells.join(' | ')} |`);
      }
    }
  }
  const first = all.filter((c) => c.forOwner === true);
  if (first.length) {
    lines.push('', '**Look at these first:**');
    for (const c of first) lines.push(`- ${keyOf(c)} (${phaseLabel(c.phase)}): ${text(c.what)}`);
  }
  lines.push('');
  return lines;
}

function renderReview(cards, { title = 'Decisions', previous = null } = {}) {
  const all = sorted(Array.isArray(cards) ? cards : []);
  const full = all.filter(isCard);
  const short = all.filter((c) => !isCard(c));
  const ids = identities(all);
  const { kept, gone } = keepVerdicts(all, previous, ids);
  const lines = [
    `# ${title} — every decision taken while you were away`,
    '',
    '> **How to read.** One card per decision taken without you, across the whole run: the spec, the plan, the build,',
    '> the review and the close. Each card gives the point, the options on the table (✅ = chosen, ▫️ = not chosen), why,',
    '> and who settled it; a part its record does not hold says "not recorded". On each verdict line write `ok` or',
    '> `overrule: {your reason}`; leave it empty to skip. Grouped by phase, then by who decided, then business, product,',
    '> technical and untagged, then high → medium → low → no confidence. A decision recorded with no alternative is one',
    '> line in the list after the cards.',
    '',
  ];
  if (!all.length) {
    lines.push('No decision was taken without you in this run.', '');
  } else {
    lines.push(...summary(full, short, all));
    for (const phase of groupBy(full, (c) => phaseLabel(c.phase))) {
      lines.push(`## ${phase.key} (${phase.items.length})`, '');
      for (const by of groupBy(phase.items, byOf)) {
        lines.push(`### Decided by: ${by.key} (${by.items.length})`, '');
        for (const kind of groupBy(by.items, kindOf)) {
          const label = KINDS.find(([k]) => k === kind.key)[1];
          lines.push(`#### ${label} (${kind.items.length})`, '');
          for (const c of kind.items) lines.push(...cardBlock(c, kept, ids.get(c)));
        }
      }
    }
    if (short.length) {
      lines.push(`## ${SHORT_HEADING} (${short.length})`, '');
      for (const c of short) {
        lines.push(markLine(ids.get(c).slot, ids.get(c).answer));
        lines.push(`- **${keyOf(c)}** · ${phaseLabel(c.phase)} · ${byOf(c)} · ${kindOf(c)} — ${text(c.what)} · ${reachedOf(c) ? `reached ${reachedOf(c)} · ` : ''}${verdictLine(kept, c, '  ')}`);
      }
      lines.push('');
    }
  }
  if (gone.length) {
    lines.push(`## ${GONE_HEADING} (${gone.length})`, '');
    for (const e of gone) {
      if (e.identity) lines.push(markLine(e.identity, e.answer));
      lines.push(`- **${e.key}:** ${e.earlier ? EARLIER(e.answer) : ''}${indented(e.verdict, '  ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

module.exports = { renderReview, readVerdicts, keyOf, isCard };
