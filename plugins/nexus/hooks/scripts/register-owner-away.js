#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit) hook — set or clear this session's owner-away mark (SYNCHRONOUS).
 *
 * A persona that reads the owner's "run it without me" never learns its own session id, so it
 * writes one word — `on` or `off` — to a file named `.owner-away`. That write fires this hook, which
 * carries the authoritative session_id and keeps the state: one file per session,
 * `.claude/audit/owner-away/<session_id>`, under the hooks' root (CLAUDE_PROJECT_DIR, never the
 * edited tree). owner-ask-gate.js reads it through lib/read-owner-away.js.
 *
 * THE TRIGGER IS NOT THE STATE. Nothing reads `.owner-away` back, wherever it was written — the
 * session scratchpad, or a `.claude/` folder. This hook deletes it once handled, so the next
 * declaration is always a plain create: the platform refuses a Write over a file the session has not
 * read and an Edit that changes nothing, either of which would leave a mark silently unset.
 *
 * ONE FILE PER SESSION, never a shared registry: two sessions declaring in the same second cannot
 * lose each other's record to a read-modify-write.
 *
 * NO TIMER. `off` removes this session's record, and nothing else ever removes one — never by age.
 *
 * SYNCHRONOUS, unlike register-persona.js: the mark must exist before the session's next tool call,
 * and only a synchronous hook's output reaches the model. It answers in one line — set, or cleared —
 * and only after the record really changed, so a session is never told of a mark it does not have.
 *
 * Subagent events are ignored: they carry agent_type and the PARENT's session_id, so a spawned
 * agent writing the trigger would mark, or unmark, the main session.
 *
 * A session id that is not a plain file name is REFUSED, never sanitised — a cleaned-up id would
 * record a mark no reader looks up. Anything else this hook cannot act on — other content, another
 * file, an unreadable event — does nothing, says nothing and exits 0.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { isSafeId } = require('./lib/safe-id');
const { ownerAwayFile } = require('./lib/read-owner-away');

const TRIGGER = '.owner-away';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try { handle(JSON.parse(raw || '{}')); } catch { /* an unreadable event does nothing and says nothing */ }
  process.exit(0);
});

function handle(evt) {
  if (!evt || evt.agent_type) return;
  if (!isSafeId(evt.session_id)) return;

  const ti = evt.tool_input || {};
  const filePath = typeof ti.file_path === 'string' ? ti.file_path : '';
  if (filePath.replace(/\\/g, '/').split('/').pop() !== TRIGGER) return;

  // Write carries `content`; Edit carries `new_string`.
  const word = String(ti.content != null ? ti.content : (ti.new_string != null ? ti.new_string : '')).trim();
  if (word !== 'on' && word !== 'off') return;

  const root = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  const record = ownerAwayFile(root, evt.session_id);
  let recorded = false;
  try {
    if (word === 'on') {
      fs.mkdirSync(path.dirname(record), { recursive: true });
      // One line for a person reading a stale mark. The reader never parses it; it only needs the
      // file to be non-empty.
      fs.writeFileSync(record, `${new Date().toISOString()}\n`);
    } else {
      fs.rmSync(record, { force: true });
    }
    recorded = true;
  } catch { /* no answer below: the session must not be told of a mark it does not have */ }

  try { fs.rmSync(path.resolve(evt.cwd || process.cwd(), filePath), { force: true }); } catch { /* best-effort */ }
  if (!recorded) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: word === 'on'
        ? 'Owner-away mark is set for this session: the question box is refused until you write `off` to `.owner-away` the same way.'
        : 'Owner-away mark is cleared for this session: the question box is open again.',
    },
  }));
}
