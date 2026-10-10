#!/usr/bin/env node
/**
 * The script behind /nexus:style — reports, turns the always-on reply-form rule on, or turns it off
 * for this repo. Manually invoked from the command's `!`-preprocess line, NOT a registered hook, so
 * there is no hooks.json entry (unregistered-script precedent: anchor-check.js, salvage-transcript.js).
 *
 * STDOUT IS THE CONTRACT — every path prints its result and exits 0. The preprocess line's output is
 * substituted into the command file before the model reads it, so stdout IS the conversational half:
 * the model relays it. Exit codes carry nothing (a non-zero exit inside a preprocess line has no
 * documented semantics), which is why even a refusal and a write failure exit 0 — silently failing
 * to print would be the only real failure mode.
 *
 * TWO INDEPENDENT HALVES (spec BR11). The FILE half decides what the NEXT session gets: it may
 * write, refuse, or do nothing. The CONVERSATIONAL half always runs, whatever the file half did,
 * because THIS session's delivery was decided at its start and need not match the file — a user who
 * runs `off` in a session that already received the paragraph needs the rule to stand down now, not
 * next time.
 *
 * "ALREADY" MEANS THE STORED VALUE, NOT THE EFFECTIVE ONE. A file holding `"maybe"` RESOLVES to on,
 * but answering `/nexus:style on` with "already on" would strand that typo in the file forever — and
 * this command is the user's only repair path (the emitter deliberately injects no disclosure for a
 * bad value). So an unrecognised or non-string value is never "already" anything: the request
 * repairs it by writing the canonical value.
 *
 * THE WRITE IS A TEXTUAL SPLICE, NEVER A RE-SERIALISATION. JSON.parse -> JSON.stringify would
 * reformat every other key in the user's committed config file — their layout, their key order,
 * their comments-by-convention spacing — while passing every behavioural test. So the value token is
 * located by a position-tracking scan and replaced in place; a new key is inserted as the first
 * member with the file's own separator; every other byte survives. Text that does not parse is
 * REFUSED rather than spliced, because a splice into unknown text is exactly the "partial" write the
 * spec forbids. Writes go through a temp file and a rename in the same directory, so a failure
 * mid-write can never truncate an existing config.
 *
 * PROJECT DIR: CLAUDE_PROJECT_DIR || cwd (estate convention). Probed: a command's preprocess line
 * carries NO CLAUDE_PROJECT_DIR, so today this is cwd — the directory Claude Code was started in,
 * which is the SAME directory the SessionStart emitter resolves, including when that is a
 * subdirectory of the repo rather than its git root. The env leg stays for a future CLI that sets
 * it. Every output path discloses the resolved path, so a repo-vs-session-directory mismatch is
 * visible rather than silent.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveReplyStyle } = require('./lib/reply-style-config');

const KEY = 'replyStyle';
const CONTENT = path.resolve(__dirname, '..', '..', 'rules', 'reply-style', 'reply-form.md');

// ── Reading the shipped paragraph ────────────────────────────────────────────
// Single source: the same file the envelope ships, so the printed wording is verbatim by
// construction. The header and the completeness marker are envelope plumbing and are not relayed.
function paragraph() {
  try {
    return fs.readFileSync(CONTENT, 'utf8').split(/\r?\n/).find(l => l.startsWith('**Reply form.**')) || '';
  } catch { return ''; }
}

// ── A position-tracking scan of the top-level object ─────────────────────────
// Only ever run on text that already parsed as JSON, so it does not need to diagnose malformed
// input — it needs to be exact about WHERE each top-level member's value sits. A regex cannot do
// this: a nested `"replyStyle"` would match first and the real key would go untouched, leaving the
// file resolving the old value while the command reported success.
function topLevelMembers(text) {
  let i = 0;
  const n = text.length;
  const members = [];
  const ws = () => { while (i < n && /\s/.test(text[i])) i++; };

  const str = () => {                       // assumes text[i] === '"'; leaves i past the close quote
    const start = i++;
    while (i < n) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === '"') { i++; return text.slice(start, i); }
      i++;
    }
    return null;
  };

  const value = () => {                     // leaves i just past the value
    ws();
    const c = text[i];
    if (c === '"') return str() !== null;
    if (c === '{' || c === '[') {
      const close = c === '{' ? '}' : ']';
      let depth = 0;
      while (i < n) {
        const ch = text[i];
        if (ch === '"') { if (str() === null) return false; continue; }
        if (ch === c) depth++;
        else if (ch === close) { depth--; i++; if (depth === 0) return true; continue; }
        i++;
      }
      return false;
    }
    const start = i;                        // number | true | false | null
    while (i < n && !/[\s,}\]]/.test(text[i])) i++;
    return i > start;
  };

  ws();
  if (text[i] !== '{') return null;         // top level is not an object — caller falls back
  i++;
  ws();
  if (text[i] === '}') return members;      // empty object: no members, still spliceable
  while (i < n) {
    ws();
    if (text[i] !== '"') return null;
    const rawKey = str();
    if (rawKey === null) return null;
    ws();
    if (text[i] !== ':') return null;
    const colonIdx = i++;
    ws();
    const valueStart = i;
    if (!value()) return null;
    members.push({ key: JSON.parse(rawKey), colonIdx, valueStart, valueEnd: i });
    ws();
    if (text[i] === ',') { i++; continue; }
    return members;                         // `}` or end of input
  }
  return members;
}

// Replace ONLY the value token of the top-level key. Returns null when the key is not there.
function spliceValue(text, value) {
  const members = topLevelMembers(text);
  if (!members) return null;
  // LAST occurrence, not the first. JSON allows a duplicate key and `JSON.parse` resolves it
  // last-wins, so the resolver reads the last one — splicing the first would rewrite a value nobody
  // reads while reporting success, and every re-run would repeat that false success because the
  // stored state never changes. Hand-appending a key to a config that already has one is exactly
  // how a duplicate arises, and JSON.parse accepts it silently.
  const m = members.filter(x => x.key === KEY).pop();
  if (!m) return null;
  return text.slice(0, m.valueStart) + JSON.stringify(value) + text.slice(m.valueEnd);
}

// Insert the key as the FIRST member, reusing the file's own separator and colon spacing so the
// insertion is invisible in a diff beyond the added line. Purely additive: no existing byte moves.
function insertFirst(text, value) {
  const members = topLevelMembers(text);
  if (!members) return null;
  const open = text.indexOf('{');
  if (open === -1) return null;
  let j = open + 1;
  while (j < text.length && /\s/.test(text[j])) j++;
  const sep = text.slice(open + 1, j);
  // Match the file's colon spacing off its existing first member; a file with no members has no
  // style to match, so use the canonical one.
  const spaced = members.length === 0 || text[members[0].colonIdx + 1] === ' ';
  const member = `"${KEY}":${spaced ? ' ' : ''}${JSON.stringify(value)}`;
  if (members.length === 0) {
    // An empty object has no separator to copy, so the newline is invented here — take it from the
    // file rather than hardcoding LF, or a CRLF config comes back with mixed line endings.
    const nl = /\r\n/.test(text) ? '\r\n' : '\n';
    return text.slice(0, open + 1) + nl + '  ' + member + nl + text.slice(j);
  }
  return text.slice(0, open + 1) + sep + member + ',' + text.slice(open + 1);
}

// Temp file + rename in the SAME directory: a rename is atomic there, so a failure mid-write leaves
// the previous config intact rather than a truncated one.
function atomicWrite(target, text) {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(target)}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, target);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* best effort — never mask the real error */ }
    throw e;
  }
}

// ── Report wording (the spec's Flow-5 vocabulary) ────────────────────────────
function sourceWording(r) {
  switch (r.source) {
    case 'key': return 'key value';
    case 'file-absent':
    case 'key-absent': return 'default: file or key absent';
    // JSON.stringify, not String(): String(['off']) is "off", which would report
    // `value "off" not recognised` — nonsense, since off IS recognised — and String({}) is
    // "[object Object]". The rendered form has to be the value the user actually wrote.
    case 'unrecognised': return `default: value ${JSON.stringify(r.raw)} not recognised`;
    default: return `default: file unreadable${r.error ? ` (${r.error})` : ''}`;
  }
}

// The STORED state — what the file says, not what it resolves to. `null` means "no canonical value
// stored": unrecognised (repair it) or unreadable (refuse).
function storedState(r) {
  if (r.source === 'key') return r.state;
  if (r.source === 'file-absent' || r.source === 'key-absent') return 'on';
  return null;
}

const USAGE = [
  'Usage: /nexus:style          report the current state (writes nothing)',
  '       /nexus:style on       turn the reply-form rule on for this repo',
  '       /nexus:style off      turn it off for this repo',
];

// ── Main ─────────────────────────────────────────────────────────────────────
const arg = String(process.argv[2] || '').trim().toLowerCase();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const r = resolveReplyStyle(projectDir);
const out = [];

if (arg !== 'on' && arg !== 'off') {
  // Report mode. An EMPTY or whitespace-only argument lands here on purpose: the command passes
  // "$ARGUMENTS" quoted, so argv[2] is always present and is the empty string when the user typed
  // no argument — treating that as invalid would break the command's most common form.
  out.push(`Reply form: ${r.state}`);
  out.push(`Source: ${sourceWording(r)}`);
  out.push(`Config: ${r.path}`);
  if (arg !== '') {
    out.push('', `Unrecognised argument "${process.argv[2]}" — nothing was written.`);
  } else {
    out.push('',
      "This session's delivery was decided at its start, so it may not match the file above.",
      '`/nexus:style on` and `/nexus:style off` change it from now.');
  }
  out.push('', ...USAGE);
} else {
  // ── File half ──
  let status;
  if (r.source === 'unreadable') {
    // Refuse rather than splice: the file is not JSON we can locate a value in, and overwriting it
    // would destroy keys we cannot read. The report half already named the parse failure.
    // No leading em dash: this is interpolated after one already ("Reply form: off — ..."), and two
    // in a row read as a formatting bug in output the model relays verbatim.
    // "could not be read or parsed", not "does not parse": `unreadable` covers a permissions or
    // EISDIR failure as well as a JSON syntax error, and sending someone with a permissions problem
    // to hunt for a missing comma wastes their time. The verbatim error says which it was.
    status = `could not be written: the config file could not be read or parsed (${r.error}). Nothing was changed; fix the file, then run this again.`;
  } else if (storedState(r) === arg) {
    status = `already ${arg}, nothing written`;
  } else {
    try {
      let text;
      if (r.source === 'file-absent') {
        text = `{\n  "${KEY}": ${JSON.stringify(arg)}\n}\n`;
      } else {
        const current = fs.readFileSync(r.path, 'utf8');
        text = spliceValue(current, arg) ?? insertFirst(current, arg);
        if (text === null) throw new Error('the config file is not a JSON object');
      }
      atomicWrite(r.path, text);
      status = 'written to the config file';
    } catch (e) {
      status = `could not be written (${(e && e.message) || e}). The file is as it was.`;
    }
  }
  out.push(`Reply form: ${arg} — ${status}`);
  out.push(`Config: ${r.path}`);

  // ── Conversational half: runs whatever the file half did ──
  out.push('');
  if (arg === 'on') {
    // A silent '' here would print a header, a blank line and nothing else: the command file's
    // "if it contains a paragraph beginning **Reply form.**" instruction would simply not fire, and
    // nobody — user or model — would be told why. Say so instead.
    out.push(paragraph() ||
      `(the rule text could not be read from ${CONTENT} — the reply-form rule still applies.)`);
  } else {
    out.push('The reply-form rule stands down for the rest of this session.',
      `\`${KEY}\` is a committed team setting — commit \`.claude/nexus-agents.json\` to keep it.`);
  }
}

process.stdout.write(out.join('\n') + '\n');
process.exit(0);
