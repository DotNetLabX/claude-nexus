'use strict';

/**
 * The decisions one feature folder records as taken without the owner, read as cards.
 *
 *   readDecisions(folder) -> card[]
 *
 * A card: `{ id, recordId, phase, by, kind, confidence, area, what, options, why, answer, where, story, units, forOwner }`.
 * `answer` is a question's own answer text, as written, the options' `chosen` being only read from it.
 * `id` names the record and its number (`spec D1`, `plan D3`, `questions Q7`, `build step 4`, `review R2`,
 * `close C2`) and is unique for one folder; `recordId` is the id the campaign's `verdict` command takes, or null;
 * `options` is `[{ text, chosen }]`, or null where the record holds none; any part the record does not hold is
 * null, and a kind not recorded reads `untagged`. A section holding text that yields no record, a build
 * `Decisions:` line that cannot be read, and a record that cannot be read, each give one `untagged` card whose id
 * starts `not read: `.
 *
 * Read: the spec's or epic's `## Decisions and why` entries not by the owner and its `added` rules kept with the
 * owner away; the plan's `## Decisions` rows and `## Decisions and why` entries (heading and bullet forms);
 * answered questions the owner did not answer; build steps' and fix rounds' `**Decisions:**` lines; code-review
 * findings at HIGH and CRITICAL with what the fix list did; the campaign close record's presumed choices; and
 * registry changelog rulings naming the feature. An epic folder adds every story folder under it, and each story's
 * part folders (`{story}/{part}`); any other folder adds its own part folders — those whose definition is the parts
 * command's generated pointer. An `sdd/` folder is never a story.
 * A plain reader: no agent, no network, no write.
 */

const fs = require('fs');
const path = require('path');
const { readRules } = require('./spec-sources');
const { parsePointer } = require('./parts');

const KINDS = Object.freeze(['business', 'product', 'technical']);
const PHASES = Object.freeze(['spec', 'plan', 'build', 'review', 'close']);
const REVIEW_FILES = Object.freeze([
  ['review.md', 'review', 'reviewer'],
  ['review-codex.md', 'review-codex', 'Codex'],
  ['review-second.md', 'review-second', 'second reader'],
  ['review-third.md', 'review-third', 'third reader'],
]);
const SHOWN_LEVELS = Object.freeze(['HIGH', 'CRITICAL']);
const PRESUMED = 'presumed (proceed-default)';
const CLOSE_RECORD = 'campaign-close.json';

const lf = (text) => String(text).replace(/\r\n?/g, '\n');
const bare = (text) => String(text || '').replace(/[`*]/g, '').trim();
const isNone = (text) => /^(?:[-*]\s+)?None\s*(?:$|[—–.:;-])/i.test(bare(text));
const noAlternative = (text) => !bare(text) || /^(?:none\b|n\/a\b|[—–-]+$)/i.test(bare(text));

function kindOf(text) {
  const m = bare(text).match(/^(business|product|technical)\b/i);
  return m ? m[1].toLowerCase() : 'untagged';
}

function confidenceOf(text) {
  const m = bare(text).match(/^(high|medium|low)\b/i);
  return m ? m[1].toLowerCase() : null;
}

function read(file) {
  try { return { text: lf(fs.readFileSync(file, 'utf8')) }; } catch (err) {
    return err && err.code === 'ENOENT' ? { missing: true } : { error: String((err && err.message) || err) };
  }
}

// The lines of the `## {name}` section, up to the next `## ` heading; null where there is none.
function section(text, name) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.replace(/<!--.*-->/, '').trim() === `## ${name}`);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end === -1 ? lines.length : end);
}

const holdsText = (lines) => lines.some((l) => l.trim() && !isNone(l));

function card(fields) {
  return {
    id: fields.id,
    recordId: fields.recordId || null,
    phase: fields.phase,
    by: fields.by || null,
    kind: fields.kind || 'untagged',
    confidence: fields.confidence || null,
    area: fields.area || null,
    what: fields.what || null,
    options: fields.options || null,
    why: fields.why || null,
    answer: fields.answer || null,
    where: fields.where || null,
    story: fields.story || null,
    units: null,
    forOwner: fields.forOwner === true,
  };
}

function gap(ctx, where, phase, what, sectionName = null) {
  return card({ id: `not read: ${where}${sectionName ? ` § ${sectionName}` : ''}`, phase, what, where, story: ctx.story });
}

const alternatives = (text) => (noAlternative(text) ? [] : bare(text).split(';').map((s) => s.trim()).filter(Boolean));
const optionsOf = (decided, turnedDown) => [{ text: decided, chosen: true }, ...alternatives(turnedDown).map((text) => ({ text, chosen: false }))];

// `### {id} — {title}` entries with `- **Field:** value` bullets, and `- **{id} — {title}** prose` bullets whose
// fields (`By:`, `Kind:`, `Confidence:`) sit inline.
function readEntries(lines, prefix) {
  const out = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(new RegExp(`^###\\s+(${prefix}\\d+)\\b\\s*[—–-]?\\s*(.*)$`));
    if (heading) {
      current = { id: heading[1], title: heading[2].trim(), fields: {}, prose: null };
      out.push(current);
      continue;
    }
    const bullet = line.match(new RegExp(`^-\\s+\\*\\*(${prefix}\\d+)\\s*[—–-]\\s*(.+?)\\*\\*\\s*(.*)$`));
    if (bullet) {
      current = { id: bullet[1], title: bullet[2].trim(), fields: {}, prose: bullet[3] };
      out.push(current);
      continue;
    }
    if (!current) continue;
    if (current.prose !== null) {
      if (/^\s+\S/.test(line)) current.prose += ` ${line.trim()}`;
      else if (line.trim()) current = null;
      continue;
    }
    const field = line.match(/^\s*-\s*\*\*([A-Za-z ]+):\*\*\s*(.*)$/);
    if (field) current.fields[field[1].toLowerCase()] = field[2].trim();
  }
  return out.map((e) => (e.prose === null ? e : { ...e, fields: inlineFields(e.prose) }));
}

function inlineFields(prose) {
  const at = (name) => {
    const m = prose.match(new RegExp(`\\b${name}:\\s*([^.]*(?:\\.\\d[^.]*)*)`, 'g'));
    return m ? m[m.length - 1].replace(new RegExp(`^${name}:\\s*`), '').trim() : '';
  };
  const owner = /^(?:Source:\s*)?Owner\b\s*[,:(]/i.test(bare(prose));
  return { by: at('By') || (owner ? 'owner' : ''), kind: at('Kind'), confidence: at('Confidence'), why: prose.trim() };
}

function entryCards(ctx, lines, { doc, phase, prefix, recordIds }) {
  const entries = readEntries(lines, prefix);
  if (!entries.length) return holdsText(lines) ? [gap(ctx, ctx.rel(doc.file), phase, 'the section holds text, but no decision could be read from it', 'Decisions and why')] : [];
  return entries
    .filter((e) => !/^owner\b/i.test(bare(e.fields.by)) && !/^replaced\b/i.test(bare(e.fields.state)))
    .map((e) => {
      const what = e.fields.decided || e.title;
      return card({
        id: `${doc.name} ${e.id}`,
        recordId: recordIds ? e.id : null,
        phase,
        by: bare(e.fields.by) || null,
        kind: kindOf(e.fields.kind),
        confidence: confidenceOf(e.fields.confidence),
        area: e.title,
        what,
        options: optionsOf(what, e.fields['turned down']),
        why: e.fields.why,
        where: ctx.rel(doc.file),
        story: ctx.story,
      });
    });
}

function definitionCards(ctx) {
  const out = [];
  for (const name of ['spec', 'epic']) {
    const file = path.join(ctx.folder, 'definition', `${name}.md`);
    const got = read(file);
    if (got.missing) continue;
    if (got.error) { out.push(gap(ctx, ctx.rel(file), 'spec', `the file could not be read: ${got.error}`)); continue; }
    const lines = section(got.text, 'Decisions and why');
    if (lines) out.push(...entryCards(ctx, lines, { doc: { name, file }, phase: 'spec', prefix: 'D', recordIds: false }));
    for (const rule of readRules(got.text)) {
      if (!/\badded\s*[—–-]\s*kept,\s*owner away\b/i.test(rule.text)) continue;
      const what = rule.text.replace(/\s*\*?\(\s*Source:[\s\S]*$/, '').replace(/^(?:\d+[.)]|[-*+])\s+/, '').trim();
      out.push(card({
        id: `${name} rule ${rule.id}`, phase: 'spec', by: 'PO', kind: 'product', area: null, what,
        options: [{ text: what, chosen: true }], where: ctx.rel(file), story: ctx.story, forOwner: true,
      }));
    }
  }
  return out;
}

const cellsOf = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function planCards(ctx) {
  const file = path.join(ctx.folder, 'delivery', 'plan.md');
  const got = read(file);
  if (got.missing) return [];
  if (got.error) return [gap(ctx, ctx.rel(file), 'plan', `the file could not be read: ${got.error}`)];
  const out = [];
  const rows = section(got.text, 'Decisions');
  if (rows) {
    const table = rows.filter((l) => l.trim().startsWith('|'));
    const data = table.slice(1).filter((l) => !/^\|?[\s:|-]*$/.test(l.trim())).map(cellsOf).filter((c) => c.some(Boolean));
    if (!data.length && holdsText(rows)) {
      out.push(gap(ctx, ctx.rel(file), 'plan', 'the section holds text, but no decision could be read from it', 'Decisions'));
    } else if (data.length) {
      const header = cellsOf(table[0]).map((c) => bare(c).toLowerCase());
      const at = (name) => header.findIndex((h) => h === name || h.startsWith(`${name} `));
      const cell = (cells, name) => (at(name) === -1 ? '' : cells[at(name)] || '');
      const decisionAt = at('decision') === -1 ? 0 : at('decision');
      data.forEach((cells, i) => {
        const what = bare(cells[decisionAt]);
        out.push(card({
          id: `plan D${i + 1}`, recordId: `D${i + 1}`, phase: 'plan', by: 'architect',
          kind: kindOf(cell(cells, 'kind')), confidence: confidenceOf(cell(cells, 'confidence')), what,
          options: optionsOf(what, cell(cells, 'rejected')), why: bare(cell(cells, 'why')),
          where: ctx.rel(file), story: ctx.story,
        }));
      });
    }
  }
  const entries = section(got.text, 'Decisions and why');
  if (entries) out.push(...entryCards(ctx, entries, { doc: { name: 'plan', file }, phase: 'plan', prefix: 'P', recordIds: true }));
  return out;
}

// The questions-format grammar: `## Q{n}: title`, one-line `**Field:**` values, a multi-line `**Recommendation:**`,
// and the text under `### Answer`.
function readQuestions(text) {
  const out = [];
  let q = null;
  let block = null;
  for (const line of text.split('\n')) {
    const head = line.match(/^## (Q\d+)\s*:?\s*(.*)$/);
    if (head) {
      q = { id: head[1], title: head[2].trim(), fields: {}, recommendation: [], answer: [] };
      out.push(q);
      block = null;
      continue;
    }
    if (!q) continue;
    if (/^### Answer\s*$/.test(line)) { block = 'answer'; continue; }
    if (block === 'answer') { q.answer.push(line); continue; }
    const field = line.match(/^\*\*([A-Za-z ]+):\*\*\s*(.*)$/);
    if (field) {
      const name = field[1].toLowerCase();
      q.fields[name] = field[2].trim();
      block = name === 'recommendation' ? 'recommendation' : null;
      if (block && field[2].trim()) q.recommendation.push(field[2].trim());
      continue;
    }
    if (block === 'recommendation' && line.trim()) q.recommendation.push(line.trim());
  }
  return out.map((x) => ({ ...x, answer: x.answer.join('\n').trim() }));
}

// Who gave the answer, where it was not the owner; null for the owner's.
function answeredBy(q) {
  const to = bare(q.fields.to).toLowerCase();
  if (q.answer.includes(PRESUMED)) return /\bpanel A\d+\b/.test(q.answer) ? 'panel' : 'default taken';
  if (/answered from\b[\s\S]*not owner-confirmed/.test(q.answer)) return 'decision entry';
  const shared = q.answer.match(/\b(PO|AR)-\d+\b/);
  if (shared) return shared[1] === 'PO' ? 'campaign PO' : 'campaign architect';
  if (/\brelayed\b|answered by the owner/i.test(q.answer)) return null;
  if (/^(user|owner)\b/.test(to)) return null;
  if (to.startsWith('architect')) return 'architect';
  if (to.startsWith('po')) return 'PO';
  return bare(q.fields.to) || null;
}

function questionPhase(q) {
  if (/\bclos(?:e|ing)\b/i.test(q.fields.step || '')) return 'close';
  const from = bare(q.fields.from).toLowerCase();
  if (/^(developer|solo)\b/.test(from)) return 'build';
  if (/^po\b/.test(from)) return 'spec';
  return 'plan';
}

function questionOptions(q, by) {
  const options = q.recommendation.map((line) => {
    const recommended = /\(Recommended\)/i.test(line);
    const text = line.replace(/^[-*]\s+/, '').replace(/\s*\(Recommended\)\s*/i, ' ').replace(/\s+/g, ' ').trim();
    const label = text.split(/\s+[—–]\s+/)[0].replace(/[.:;,]+$/, '').trim();
    return { text, label, recommended };
  });
  if (!options.length) return null;
  const answer = q.answer.toLowerCase();
  const says = (label) => new RegExp(`(?<![\\w])${label.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`).test(answer);
  const named = options
    .filter((o) => o.label && says(o.label))
    .sort((a, b) => b.label.length - a.label.length)[0];
  const pick = named || ((by === 'default taken' || by === 'panel') ? options.find((o) => o.recommended) : null);
  return options.map((o) => ({ text: o.text, chosen: o === pick }));
}

function questionCards(ctx) {
  const file = path.join(ctx.folder, 'delivery', 'questions.md');
  const got = read(file);
  if (got.missing) return [];
  if (got.error) return [gap(ctx, ctx.rel(file), 'plan', `the file could not be read: ${got.error}`)];
  const out = [];
  for (const q of readQuestions(got.text)) {
    if (!/^(answered|resolved)\b/i.test(bare(q.fields.status))) continue;
    const by = answeredBy(q);
    if (!by) continue;
    const own = q.answer.match(/^\s*\*{0,2}Confidence:\*{0,2}\s*(.+)$/im);
    const said = q.answer.split('\n').filter((l) => l.trim() && !/^\s*\*{0,2}Confidence:/i.test(l)).join(' ').trim();
    out.push(card({
      id: `questions ${q.id}`, recordId: q.id, phase: questionPhase(q), by, kind: kindOf(q.fields.kind),
      confidence: confidenceOf(own ? own[1] : q.fields.confidence), area: q.title, what: q.fields.question || q.title,
      options: questionOptions(q, by), why: said, answer: said,
      where: ctx.rel(file), story: ctx.story, forOwner: /^(user|owner)\b/i.test(bare(q.fields.to)),
    }));
  }
  return out;
}

function buildCards(ctx) {
  const file = path.join(ctx.folder, 'delivery', 'implementation.md');
  const got = read(file);
  if (got.missing) return [];
  if (got.error) return [gap(ctx, ctx.rel(file), 'build', `the file could not be read: ${got.error}`)];
  const out = [];
  let block = null;
  let heading = null;
  const lines = got.text.split('\n');
  const notRead = (what) => out.push(gap(ctx, ctx.rel(file), 'build', what, heading));
  // The text a Decisions line's block holds below it, blank lines passed over, up to the next field or heading.
  const below = (i) => {
    const rest = [];
    for (let j = i + 1; j < lines.length && !/^(?:## |\*\*[A-Za-z ]+:\*\*|---\s*$)/.test(lines[j]); j += 1) {
      if (lines[j].trim()) rest.push(lines[j]);
    }
    return rest;
  };
  lines.forEach((line, i) => {
    const step = line.match(/^## Step (\S+?)\s*[—–:-]\s*(.*)$/);
    const round = line.match(/^## Fix Round (.+?)\s*$/);
    if (/^## /.test(line)) heading = line.slice(3).trim();
    if (step) { block = { id: `build step ${step[1].replace(/:$/, '')}`, phase: 'build', area: step[2].trim() }; return; }
    if (round) { block = { id: `fix round ${round[1].toLowerCase()}`, phase: 'review', area: null }; return; }
    if (/^## /.test(line)) { block = null; return; }
    const decisions = line.match(/^\*\*Decisions:\*\*\s*(.*)$/);
    if (!decisions) return;
    if (!block) { notRead('a Decisions line sits under a heading that is neither a step nor a fix round'); return; }
    if (!bare(decisions[1])) {
      if (below(i).length) notRead('the Decisions line is empty and the text under it could not be read');
      return;
    }
    if (isNone(decisions[1])) return;
    const head = decisions[1].match(/^`?(business|product|technical)`?:\s*(.*)$/i);
    const what = (head ? head[2] : decisions[1]).trim();
    out.push(card({
      id: block.id, phase: block.phase, by: 'developer', kind: head ? head[1].toLowerCase() : 'untagged', area: block.area,
      what, options: [{ text: what, chosen: true }], where: ctx.rel(file), story: ctx.story,
    }));
    if (below(i).length) notRead('the Decisions line goes on below it, and the text there could not be read');
  });
  return out;
}

const levelOf = (score) => (score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low');

// The fix lists' rows of `review.md`, by finding title: `fix list cycle {N}, row {n}`, marked where fixed in round.
function fixListRows(text) {
  const rows = [];
  let list = null;
  for (const line of text.split('\n')) {
    const head = line.match(/^## Step 2 — Fix list, (cycle \d+|hand-up \d+)\s*$/);
    if (head) { list = head[1]; continue; }
    if (/^## /.test(line)) { list = null; continue; }
    const row = list && line.match(/^(\d+)\.\s+\[[^\]]+\]\s+(.+)$/);
    if (row) rows.push({ rest: row[2].trim(), label: `fix list ${list}, row ${row[1]}${/fixed in round/i.test(line) ? ', fixed in round' : ''}` });
  }
  return {
    get: (title) => {
      const found = rows.find((r) => r.rest === title || r.rest.startsWith(`${title} — `));
      return found ? found.label : undefined;
    },
  };
}

function reviewCards(ctx) {
  const out = [];
  let rows = { get: () => undefined };
  for (const [name, idName, by] of REVIEW_FILES) {
    const file = path.join(ctx.folder, 'delivery', name);
    const got = read(file);
    if (got.missing) continue;
    if (got.error) { out.push(gap(ctx, ctx.rel(file), 'review', `the file could not be read: ${got.error}`)); continue; }
    if (name === 'review.md') rows = fixListRows(got.text);
    let n = 0;
    let finding = null;
    const findings = [];
    for (const line of got.text.split('\n')) {
      const head = line.match(/^### \[([A-Z]+)[^\]]*\]\s+(.*)$/);
      if (head) { finding = { n: ++n, level: head[1], title: head[2].trim(), fields: {} }; findings.push(finding); continue; }
      if (/^#{1,3} /.test(line)) { finding = null; continue; }
      const field = finding && line.match(/^\*\*([A-Za-z ]+):\*\*\s*(.*)$/);
      if (field) finding.fields[field[1].toLowerCase()] = field[2].trim();
    }
    for (const f of findings.filter((x) => SHOWN_LEVELS.includes(x.level))) {
      const score = Number.parseInt(f.fields.confidence, 10);
      out.push(card({
        id: `${idName} R${f.n}`, phase: 'review', by, confidence: Number.isFinite(score) ? levelOf(score) : null,
        what: `${f.level}: ${f.title}`, options: [{ text: rows.get(f.title) || 'not on a fix list', chosen: true }],
        why: f.fields.issue, where: ctx.rel(file), story: ctx.story,
      }));
    }
  }
  return out;
}

function closeCards(ctx) {
  const file = path.join(ctx.folder, 'delivery', CLOSE_RECORD);
  const got = read(file);
  if (got.missing) return [];
  let record = null;
  if (!got.error) { try { record = JSON.parse(got.text); } catch (err) { got.error = `not JSON: ${err.message}`; } }
  if (got.error || !record || !Array.isArray(record.presumed)) {
    return [gap(ctx, ctx.rel(file), 'close', `the file could not be read: ${got.error || 'it holds no list of presumed choices'}`)];
  }
  return record.presumed.filter((c) => c && typeof c === 'object').map((c) => card({
    id: `close ${c.id}`, recordId: /^C\d+$/.test(String(c.id)) ? String(c.id) : null, phase: 'close', by: 'team lead',
    kind: kindOf(c.kind), confidence: confidenceOf(c.confidence), what: c.what, options: c.what ? [{ text: c.what, chosen: true }] : null,
    why: c.why, where: typeof c.where === 'string' ? c.where : ctx.rel(file), story: c.story || ctx.story,
  }));
}

function registryFiles(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) registryFiles(full, out);
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// A changelog line records a ruling made when it says `ruled`, or "the architect's ruling", outside a clause that
// is negated or still to come ("not ruled", "until re-verified and ruled", "no ruling"); one that only waits "for"
// or "awaiting the architect's ruling" records none, and an owner's ruling is the owner's decision.
const NOT_YET = /\b(?:not|until|to be)\b[^;.,()]*/gi;
const WAITS = /\b(?:for|awaiting|awaits|until|no|without|before)\s+(?:the\s+|an?\s+|its\s+|their\s+)?(?:[\w-]+['’]s\s+)?(?:first\s+)?ruling\b/gi;
const recordsRuling = (line) => {
  const made = line.replace(WAITS, '').replace(NOT_YET, '');
  return /\bruled\b/i.test(made) || /\barchitect(?:['’]s)?\s+ruling\b/i.test(made);
};

// Changelog lines `- {date} · {slug} · {row ids} — {text}` naming this folder's slug whose text records a ruling.
function registryCards(ctx) {
  if (!ctx.root) return [];
  const base = path.join(ctx.root, 'docs', 'business-rules');
  const slug = path.basename(ctx.folder);
  const out = [];
  for (const file of registryFiles(base)) {
    const got = read(file);
    if (!got.text) continue;
    for (const line of section(got.text, 'Changelog') || []) {
      const m = line.match(/^-\s+\S+\s+·\s+([^·]+?)\s+·\s+(.+?)\s+—\s+(.*)$/);
      if (!m || m[1].trim() !== slug || !recordsRuling(m[3])) continue;
      const what = m[3].trim();
      out.push(card({
        id: `registry ${path.relative(base, file).split(path.sep).join('/')} ${m[2].trim()}`, phase: 'close', by: 'architect',
        what, options: [{ text: what, chosen: true }], where: ctx.rel(file), story: ctx.story,
      }));
    }
  }
  return out;
}

function repoRoot(folder) {
  let dir = path.resolve(folder);
  while (path.dirname(dir) !== dir) {
    if (path.basename(dir) === 'specs' && path.basename(path.dirname(dir)) === 'docs') return path.dirname(path.dirname(dir));
    dir = path.dirname(dir);
  }
  return null;
}

function folderCards(folder, root, story) {
  const ctx = {
    folder,
    root,
    story,
    rel: (file) => path.relative(root || folder, file).split(path.sep).join('/'),
  };
  return [...definitionCards(ctx), ...planCards(ctx), ...questionCards(ctx), ...buildCards(ctx), ...reviewCards(ctx), ...closeCards(ctx), ...registryCards(ctx)];
}

function storyFolders(folder) {
  let entries = [];
  try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((e) => e.isDirectory() && !['definition', 'delivery', 'sdd'].includes(e.name))
    .filter((e) => ['definition', 'delivery'].some((d) => fs.existsSync(path.join(folder, e.name, d))))
    .map((e) => e.name)
    .sort();
}

// The sub-folders the parts command made: those whose definition is its generated pointer.
function partFolders(folder) {
  return storyFolders(folder).filter((name) => {
    try { return parsePointer(fs.readFileSync(path.join(folder, name, 'definition', 'spec.md'), 'utf8')) !== null; } catch { return false; }
  });
}

function readDecisions(folder) {
  if (!fs.existsSync(folder)) return [];
  const root = repoRoot(folder);
  const cards = folderCards(folder, root, null);
  const epic = fs.existsSync(path.join(folder, 'definition', 'epic.md'));
  for (const story of epic ? storyFolders(folder) : partFolders(folder)) {
    const storyFolder = path.join(folder, story);
    cards.push(...folderCards(storyFolder, root, story));
    if (!epic) continue;
    for (const part of partFolders(storyFolder)) cards.push(...folderCards(path.join(storyFolder, part), root, `${story}/${part}`));
  }
  return uniqueIds(cards);
}

// A verdict is kept by its card's id, so an id a folder repeats is numbered from its second card on.
function uniqueIds(cards) {
  const seen = new Map();
  return cards.map((c) => {
    const key = `${c.story || ''}\n${c.id}`;
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    return n === 1 ? c : { ...c, id: `${c.id} (${n})` };
  });
}

module.exports = { readDecisions, KINDS, PHASES };
