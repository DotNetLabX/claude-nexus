#!/usr/bin/env node
/**
 * Nexus critique check (Stop, SYNCHRONOUS — can refuse once per turn).
 *
 * Every critique in an interview turn ends with one line, `Change: none` or `Change: {what it adds, removes or
 * replaces}` (research-before-asking.md § Interview). The check reads interview turns only — a turn holding a title of
 * type `Decide` or `Read` (or the older `your decision` / `read only`), or a progress line `Step {n} of {total}` — and
 * there counts every titled topic whatever its type word, so a type a skill adds is counted without being named here.
 * It refuses a turn in which a Read topic (`read only` included) declares a change, or whose declared changes outnumber
 * the questions its question boxes asked. A topic ends at the next title or at the progress line. It counts questions;
 * it never reads what a question says, and it cannot see a change a critique leaves undeclared.
 *
 * REACH: a session whose persona is the architect or the PO, with the owner present. Every other session, an
 * owner-away one and bad JSON exit before the transcript is opened.
 *
 * REFUSES ONCE PER OWNER PROMPT: `{"decision":"block","reason":…}` on the first failing stop. With
 * `stop_hook_active`, or at a later stop of a prompt already refused (a marker per session under
 * `.claude/audit/critique-check/`), the turn is still evaluated but stdout stays empty — a second block, or any
 * additionalContext, would continue a turn the persona may be unable to fix. After a refusal, a later stop of the same
 * prompt reads only the text and the question boxes that came after it.
 *
 * THE TURN: from the user record holding the owner's own typed prompt to the end of the transcript, read from its
 * last TAIL_BYTES; a record written twice is read once. The payload's `last_assistant_message` is the turn's final
 * text, counted once when the transcript already holds it — only text after the last tool result, of the last
 * assistant message, is taken for that copy. A box is paired with the first result after it; it counts its questions
 * when answered or declined, none when the owner-ask gate refused it or it ended in another error.
 *
 * FAIL OPEN: an unreadable transcript, an opening outside the bytes read, a malformed line in the turn or a box with no
 * result pass the turn. Every refusal, every miss that only logs, and every fail-open pass whose final message is an
 * interview turn with a titled topic append one `rule: "critique-change"` line to `.claude/audit/violations.log`. Exit 0 on every path.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const { resolveRole } = require('./lib/resolve-role');
const { readSessionPersona } = require('./lib/read-session-persona');
const { readOwnerAway } = require('./lib/read-owner-away');
const { isSafeId } = require('./lib/safe-id');

const RULE = 'critique-change';
const REACH = new Set(['architect', 'po']);
const TAIL_BYTES = 4 * 1024 * 1024;

const TITLE_RE = /^\s*\*\*(\d+)\.\s+(.+)\s[—–]\s+([^—–*]+?)\.?\*\*\s*$/;
// The line that ends every interview turn after the first, bold or plain, alone on its line.
const PROGRESS_RE = /^\s*(?:\*\*)?Step\s+\d+\s+of\s+\d+\.?(?:\*\*)?\s*$/i;
// A title of one of these types, or a progress line, makes a turn an interview turn. The two older words are read as
// Decide and Read, so a core updated before the paid plugin still checks the old skill's turns.
const INTERVIEW_TYPES = new Set(['decide', 'read', 'your decision', 'read only']);
const READ_TYPES = new Set(['read', 'read only']);
const CHANGE_RE = /^\s*(?:[-*+•]\s+)?(?:\*\*)?change(?:\*\*)?\s*:(?:\*\*)?\s*(.*?)\s*$/i;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;
// "No change" is a sentinel alone — `none`, `no change(s)`, `nothing`, `n/a` or a lone dash, in optional parentheses,
// with an optional full stop — or a sentinel, an em dash and a reason. Any other remainder is a change.
const NO_CHANGE_RE = /^\(?\s*(?:none|no changes?|nothing|n\/a|[-–—])\s*\)?\.?(?:\s+—\s+\S.*)?$/;

// true for a declared change, false for no change, null for an empty value (no declaration).
function isChange(value) {
  const v = value.replace(/[`*_]/g, '').trim().toLowerCase();
  if (!v) return null;
  return !NO_CHANGE_RE.test(v);
}

// `{ topics, interview }`: every titled topic with its declared changes, and whether the text holds an interview title
// or a progress line.
function parseTopics(text) {
  const topics = [];
  let interview = false;
  let current = null;
  let fence = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const f = FENCE_RE.exec(raw);
    if (fence) {
      // Only a bare fence of the opening's character, at least as long, closes it.
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && !raw.slice(f[0].length).trim()) fence = null;
      continue;
    }
    if (f) { fence = f[1]; continue; }
    if (/^\s*>/.test(raw)) continue;
    const line = raw.replace(/`[^`]*`/g, '');
    const title = TITLE_RE.exec(line);
    if (title) {
      current = { number: title[1], title: title[2].trim(), type: title[3].trim().toLowerCase(), changes: 0 };
      if (INTERVIEW_TYPES.has(current.type)) interview = true;
      topics.push(current);
      continue;
    }
    if (PROGRESS_RE.test(line)) { interview = true; current = null; continue; }
    if (!current || !CHANGE_RE.test(line)) continue;
    const m = CHANGE_RE.exec(raw) || CHANGE_RE.exec(line);
    if (isChange(m[1]) === true) current.changes++;
  }
  return { topics, interview };
}

// The titled topics of an interview turn, whatever their type word; none for any other turn. `scope` decides whether
// the turn is an interview turn, `texts` which topics are counted.
function checked(texts, scope = texts) {
  if (!scope.some((t) => parseTopics(t).interview)) return [];
  return texts.flatMap((t) => parseTopics(t).topics);
}

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();

// The shapes a platform- or agent-inserted user line takes, for lines that carry no `origin`.
const NOT_TYPED = [/^<task-notification>/, /^<agent-message/, /^<teammate-message/, /^Another Claude session sent a message:/, /^\[Request interrupted/];
const WRAPPER_OPEN = /^\s*<(system-reminder|command-name|command-message|command-args|local-command-stdout|local-command-stderr)>/;

// Text made only of wrapper blocks. Walked block by block: one backtracking pattern over the whole text runs for
// minutes on a dozen-odd blocks followed by typed text.
function wrapperOnly(text) {
  let rest = text;
  while (rest.trim()) {
    const open = WRAPPER_OPEN.exec(rest);
    if (!open) return false;
    const close = rest.indexOf(`</${open[1]}>`, open[0].length);
    if (close === -1) return false;
    rest = rest.slice(close + open[1].length + 3);
  }
  return true;
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b && b.type === 'text').map((b) => String(b.text || '')).join('\n');
}

// A box counts its questions when the owner answered it or declined it; a box the owner-ask gate refused, or that
// ended in any other error, asked nothing.
const DECLINE = /doesn't want to proceed/;

function counts(resultBlock) {
  if (!resultBlock.is_error) return true;
  return DECLINE.test(textOf(resultBlock.content));
}

function opensTurn(r) {
  if (r.type !== 'user' || !r.message) return false;
  const c = r.message.content;
  if (Array.isArray(c) && c.some((b) => b && b.type === 'tool_result')) return false;
  if (r.origin) return r.origin.kind === 'human';
  if (r.isMeta || r.isCompactSummary) return false;
  const text = textOf(c).trim();
  if (NOT_TYPED.some((re) => re.test(text))) return false;
  if (Array.isArray(c) && c.some((b) => b && b.type === 'image')) return true;
  return Boolean(text) && !wrapperOnly(text);
}

function tailLines(transcriptPath) {
  let fd;
  try {
    fd = fs.openSync(transcriptPath, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const lines = buf.toString('utf8').split('\n');
    if (len < size) lines.shift();
    return lines;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ignore */ }
  }
}

// The turn's records, or `{ failed }` naming why the turn cannot be read whole. Only `user` and `assistant`
// records are the session's own; the request copies (`api-request-blob`) and every other record type are skipped.
function readTurn(transcriptPath) {
  if (!transcriptPath) return { failed: 'no transcript path' };
  const lines = tailLines(transcriptPath);
  if (!lines) return { failed: 'the transcript cannot be read' };
  const records = [];
  let opener = null;
  let malformed = false;
  for (let i = lines.length - 1; i >= 0 && !opener; i--) {
    if (!lines[i].trim()) continue;
    let r;
    try { r = JSON.parse(lines[i]); } catch { malformed = true; continue; }
    if (!r || (r.type !== 'user' && r.type !== 'assistant')) continue;
    if (opensTurn(r)) opener = r;
    else records.push(r);
  }
  if (!opener) return { failed: 'the turn\'s opening is not inside the bytes read' };
  if (malformed) return { failed: 'a line in the turn is malformed' };
  records.reverse();
  const texts = [];
  const calls = [];
  // A record written twice is read once, the first copy kept: a repeated result would otherwise pair with a later
  // call that reuses its id.
  const seen = new Set();
  for (const r of records) {
    const key = typeof r.uuid === 'string' && r.uuid ? r.uuid : JSON.stringify(r);
    if (seen.has(key)) continue;
    seen.add(key);
    const content = r.message && Array.isArray(r.message.content) ? r.message.content : [];
    if (r.type === 'user' && content.some((b) => b && b.type === 'tool_result')) {
      for (const t of texts) t.final = false;
    }
    for (const b of content) {
      if (!b) continue;
      if (r.type === 'assistant' && b.type === 'text') texts.push({ text: String(b.text || ''), id: r.message.id, final: true });
      if (r.type === 'assistant' && b.type === 'tool_use' && b.name === 'AskUserQuestion') {
        const qs = b.input && Array.isArray(b.input.questions) ? b.input.questions.length : 0;
        calls.push({ id: b.id, questions: qs, result: null });
      }
      if (r.type === 'user' && b.type === 'tool_result') {
        const call = calls.find((c) => c.id === b.tool_use_id && c.result === null);
        if (call) call.result = b;
      }
    }
  }
  if (calls.some((c) => !c.result)) return { failed: 'a question box has no result' };
  // The final message is the text after the last tool result, of the last assistant message.
  const finalId = texts.length ? texts[texts.length - 1].id : undefined;
  for (const t of texts) if (t.id !== finalId) t.final = false;
  let questions = 0;
  for (const c of calls) if (counts(c.result)) questions += c.questions;
  const prompt = String(opener.promptId || opener.uuid || opener.timestamp || textOf(opener.message.content).slice(0, 200));
  return { texts, questions, prompt };
}

function main(input) {
  let data;
  try { data = JSON.parse(input || '{}'); } catch { return; }
  if (!data || typeof data !== 'object') return;
  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const role = resolveRole(readSessionPersona(data.session_id, root) || '');
  if (!REACH.has(role)) return;
  if (readOwnerAway(data.session_id, root)) return;
  const turn = readTurn(data.transcript_path);
  const last = typeof data.last_assistant_message === 'string' ? data.last_assistant_message : '';
  if (turn.failed) {
    if (checked([last]).length) {
      logViolation(root, { agent: role, tool: 'Stop', rule: RULE, outcome: `passed — ${turn.failed}`, reason: 'the turn was not checked' });
    }
    return;
  }
  // The final message may sit in the transcript whole, in part, or not yet: its blocks there are dropped and the
  // payload's copy read once. A topic's block never runs past its own text block.
  const blocks = turn.texts.slice();
  if (last.trim()) {
    const tail = () => blocks[blocks.length - 1];
    while (blocks.length && tail().final && flat(tail().text) && flat(last).includes(flat(tail().text))) blocks.pop();
    blocks.push({ text: last });
  }
  const texts = blocks.map((b) => b.text);
  // After a refusal of this owner prompt, the refused text and the questions asked by then were judged already: a
  // later stop reads only the text and the questions that came after.
  const marker = isSafeId(data.session_id) ? path.join(root, '.claude', 'audit', 'critique-check', data.session_id) : '';
  const prior = marker ? readMarker(marker) : null;
  const refused = prior && prior.prompt === turn.prompt ? prior : null;
  const judged = refused ? refused.texts.map(flat).filter(Boolean) : [];
  const fresh = refused ? texts.filter((t) => !judged.some((j) => j.includes(flat(t)))) : texts;
  const asked = refused ? Math.max(0, turn.questions - refused.questions) : turn.questions;
  const topics = checked(fresh, texts);
  const problems = [];
  for (const t of topics) {
    if (READ_TYPES.has(t.type) && t.changes > 0) problems.push(`topic ${t.number} "${t.title}" is a Read topic but declares a change`);
  }
  const changes = topics.reduce((sum, t) => sum + t.changes, 0);
  if (changes > asked) {
    const named = topics.filter((t) => t.changes > 0).map((t) => `${t.number} "${t.title}"`).join(', ');
    problems.push(`the turn declares ${changes} change(s) (topics ${named}) but its question boxes asked ${asked} question(s)`);
  }
  if (!problems.length) return;
  const reason = `Nexus critique check: ${problems.join('; ')}. A critique that changes the source's fix is a Decide topic: `
    + 're-title it `Decide` and ask each change in the question box this turn.';
  if (data.stop_hook_active === true) {
    logViolation(root, { agent: role, tool: 'Stop', rule: RULE, outcome: 'logged — retry stop', reason });
    return;
  }
  if (refused) {
    logViolation(root, { agent: role, tool: 'Stop', rule: RULE, outcome: 'logged — prompt already refused once', reason });
    return;
  }
  if (marker) writeMarker(marker, { prompt: turn.prompt, questions: turn.questions, texts });
  logViolation(root, { agent: role, tool: 'Stop', rule: RULE, outcome: 'refused', reason });
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}

// `{ prompt, questions, texts }` of the last refusal, or null.
function readMarker(file) {
  try {
    const m = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!m || typeof m.prompt !== 'string') return null;
    return { prompt: m.prompt, questions: Number(m.questions) || 0, texts: Array.isArray(m.texts) ? m.texts.map(String) : [] };
  } catch { return null; }
}

function writeMarker(file, refusal) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(refusal));
  } catch { /* without the marker a later stop of this prompt may refuse again — never a wedge */ }
}

function logViolation(root, row) {
  try {
    const dir = path.join(root, '.claude', 'audit');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'violations.log'), JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
  } catch { /* observation must never wedge the stop */ }
}

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  process.stdin.on('end', () => { try { main(input); } catch { /* fail open */ } process.exit(0); });
}
