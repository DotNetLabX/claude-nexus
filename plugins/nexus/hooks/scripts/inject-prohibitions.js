#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the always-on PROHIBITIONS envelope — the SECOND always-on
 * payload, emitted alongside the ADR-70 rules kernel that inject-rules.js delivers. Like it, this
 * fires on startup | clear | compact and never on resume.
 *
 * WHY A SECOND ENVELOPE, NOT MORE KERNEL LINES. Prohibitions fail when they are carried on demand:
 * a "never X" rule only helps if it is already in front of you at the moment you would do X, and a
 * read-when trigger is recognition-gated — by the time you recognize the trigger you have usually
 * already acted. But the kernel has no room: its budget and the platform cap sit close together by
 * construction, so ~6 more always-on lines there would force a diet or a demotion. The platform
 * caps each hook OUTPUT independently, and a SessionStart group may hold several commands — so a
 * second command buys the same salience at zero kernel cost.
 *
 * WHAT RIDES HERE (the placement rule). A PROHIBITION — one where the violation is a single wrong
 * act — one line plus a pointer to the section that owns the procedure. Nothing else: procedures
 * live on demand, and a prohibition whose only actor is a spawned subagent belongs in that agent's
 * file, because this channel reaches the MAIN session only. The envelope carries STOP-SIGNS ONLY:
 * the one affirmative line it used to admit by name — the write-lessons close duty — is retired from
 * this release on, and the duty is observed at close instead by pipeline-gate.js invariant (5).
 *
 * BUDGET. Deliberately small and test-gated (PROHIBITIONS_BUDGET in
 * tests/unit/inject-prohibitions.test.mjs) — a 9K budget here would simply invite a second kernel.
 * The runtime tripwire below sits between that gate and the platform cap, warning only. The next
 * raise is a diet or a demotion, never a raise.
 *
 * ENVELOPE 1 IS UNTOUCHED. The content lives in rules/prohibitions/, a SUBDIRECTORY: the kernel's
 * tier-1 enumeration is non-recursive and files-only (pinned by its own test), so these files are
 * invisible to it by construction rather than by an exclusion someone has to maintain.
 *
 * Fail-open and zero-footprint throughout: no prohibitions directory, an empty one, or a tier whose
 * every file is unreadable all exit silently — never an empty envelope — and one bad file is
 * skipped while the rest ship.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..', '..');
const prohibitionsDir = path.join(pluginRoot, 'rules', 'prohibitions');

// The platform caps a hook's output — additionalContext included — at PLATFORM_CAP chars, PER HOOK
// OUTPUT (re-verified on CLI 2.1.241): oversize is persisted to a file and replaced by a ~2KB
// preview, so it never reaches the model. Envelope 1 has its own copy of these two numbers because
// each hook is capped independently — this envelope's budget is not a share of the kernel's.
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 150;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  // On `resume` the transcript — original injection included — is reloaded verbatim, so a
  // re-injection would duplicate this envelope. Skip it (inject-rules.js does the same).
  try {
    const evt = JSON.parse(input || '{}');
    if (evt.source === 'resume') process.exit(0);
  } catch { /* unparseable stdin — fall through and inject (fail open) */ }

  const mdFilesIn = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => (e.isFile() || e.isSymbolicLink()) && e.name.endsWith('.md'))
      .map(e => e.name)
      .sort();

  let files = [];
  try {
    files = mdFilesIn(prohibitionsDir);
  } catch {
    process.exit(0); // no prohibitions tier — nothing to inject
  }
  if (files.length === 0) process.exit(0);

  let body = '';
  for (const f of files) {
    // Per-file guard: one vanished/unreadable file must not drop ALL the prohibitions.
    try {
      const text = fs.readFileSync(path.join(prohibitionsDir, f), 'utf8');
      // Separated by a newline, not concatenated raw: a file that ends without one would otherwise
      // glue the next file's heading onto its own last line, silently turning two prohibitions into
      // one malformed bullet. Conditional on `body` so a single file — today's shipped case — pays
      // nothing, which keeps the budget measurement a pure function of the content.
      body += (body ? '\n' : '') + text;
    } catch { /* skip the bad file, keep the rest */ }
  }

  // Zero READABLE content is the same outcome as an empty directory: silence. Checked on the
  // assembled body, not on the file count — enumeration can succeed while every read fails, and an
  // empty additionalContext is a cost with no payload.
  if (body.trim() === '') process.exit(0);

  // Runtime tripwire, same posture as envelope 1: fail OPEN — emit regardless (a dropped envelope is
  // worse than an oversize one) and warn on stderr, which the platform surfaces without breaking the
  // hook. The DETERMINISTIC gate is PROHIBITIONS_BUDGET in tests/unit/inject-prohibitions.test.mjs;
  // this sits between it and the cap, and the test asserts that ordering by parsing these constants.
  if (body.length > WARN_AT) {
    process.stderr.write(
      `nexus inject-prohibitions: assembled envelope is ${body.length} chars, over the ${WARN_AT} ` +
      `tripwire (platform hook-output cap is ${PLATFORM_CAP} — oversize output is persisted to a ` +
      `file and never reaches the model). Trim rules/prohibitions/*.md.\n`
    );
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body }
  }));
  process.exit(0);
});
