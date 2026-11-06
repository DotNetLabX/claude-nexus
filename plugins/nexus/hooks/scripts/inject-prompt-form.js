#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the PROMPT-FORM envelope — the fifth session-start payload, beside
 * the rules kernel (inject-rules.js), the prohibitions (inject-prohibitions.js), the reply form
 * (inject-reply-style.js) and the file links (inject-file-links.js). It fires on startup | clear |
 * compact and never on resume, where the transcript already carries the original delivery.
 *
 * WHAT IT CARRIES. rules/prompt-form/prompt-form.md, as it stands — how to shape a prompt the agent
 * hands the owner to paste into another session or repo: its form and what it holds and leaves out.
 *
 * WHEN IT PRINTS. On every entrypoint — a terminal, the desktop app, an IDE and a headless run all
 * hand the owner prompts. There is no setting, so no config file is read.
 *
 * WHY ITS OWN ENVELOPE. Measured 2026-11-06: the kernel stood at 9,587 characters, 9,846 with a repo's
 * audit nag, against its 9,850 tripwire and the platform's 10,000 per-hook cap, so neither a kernel
 * line nor an on-demand file (whose Read-Index entry the kernel carries) fitted; the reply-form
 * envelope had 363 of its 1,000 characters left and can be switched off. The platform caps each hook's
 * output on its own, so this payload costs the others nothing.
 *
 * The content lives in rules/prompt-form/, a subdirectory the kernel's non-recursive enumeration never
 * reads. Its budget (900 chars) is gated by its test, not by a tripwire here. Fail-open: a missing or
 * empty content file prints nothing and exits 0, and unparseable stdin still injects.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const contentFile = path.resolve(__dirname, '..', '..', 'rules', 'prompt-form', 'prompt-form.md');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(input || '{}') || {};
    if (evt.source === 'resume') process.exit(0);
  } catch { /* unparseable stdin — fall through and inject (fail open) */ }

  let body = '';
  try { body = fs.readFileSync(contentFile, 'utf8'); } catch { process.exit(0); }
  if (body.trim() === '') process.exit(0);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: body,
    },
  }));
  process.exit(0);
});
