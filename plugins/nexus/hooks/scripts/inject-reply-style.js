#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the always-on REPLY-FORM envelope — the THIRD always-on payload,
 * emitted alongside the ADR-70 rules kernel (inject-rules.js) and the prohibitions envelope
 * (inject-prohibitions.js). Like both, it fires on startup | clear | compact and never on resume.
 *
 * WHY A THIRD ENVELOPE, NOT KERNEL LINES. The rule this carries shapes how a reply is FORMED —
 * answer at the level the question was asked, hold the depth back until it is wanted. It only works
 * always-on: by the time you recognize that you have just buried the answer under its evidence, you
 * have already sent it, so an on-demand read-when trigger cannot fire in time. But the kernel has
 * no room for it: measured nag-off and location-adjusted, the way its shipped budget test counts,
 * the kernel sits at 8,848 of its 9,200-char cap — 352 chars of headroom against a 558-char
 * paragraph. The number-free argument holds too: the ADR-91 diet left the kernel's two budget legs
 * coinciding by construction, so ANY kernel content addition breaks the consumer-root leg as well.
 * And the displacement argument runs the other way: every kernel rule prevents a broken run, while
 * this one prevents a re-prompt — so it may not evict any of them. The platform caps each hook
 * OUTPUT independently and a SessionStart group may hold several commands, so a third command buys
 * the same salience at zero kernel cost.
 *
 * ON ADR-94. That decision governs the PROHIBITIONS envelope: its placement rule says what may ride
 * THAT channel, and its "the next raise is a diet or a demotion" sentence governs THAT envelope's
 * 4,000-char budget. Neither reaches a separate channel for a rule that is neither a prohibition nor
 * a procedure. This envelope inherits the doctrine rather than the budget: 1,000 chars, test-gated,
 * and its own next raise is likewise a diet or a demotion, never a raise.
 *
 * THE OFF SWITCH — the one thing the other two envelopes do not have. `replyStyle` in the consuming
 * repo's .claude/nexus-agents.json is the FIRST key in that file read by a HOOK; every other key is
 * agent-read at pre-flight. Resolution (and the reason every failure mode fails open) lives in
 * lib/reply-style-config.js. Two properties are load-bearing here: `off` emits NOTHING AT ALL, and
 * a BAD value emits the envelope with NO disclosure of the problem — not in the payload, and not on
 * stderr. A typo must not buy itself a nag every session; the /nexus:style report is the channel
 * that names it, on demand, to the one person who can fix it.
 *
 * ENVELOPES 1 AND 2 ARE UNTOUCHED. The content lives in rules/reply-style/, a SUBDIRECTORY: the
 * kernel's tier-1 enumeration is non-recursive and files-only (pinned by its own test), so these
 * files are invisible to it by construction rather than by an exclusion someone has to maintain.
 * This is a third COPY of the envelope lifecycle on purpose — sharing it would mean editing the
 * other two emitters, which must stay byte-identical. Only the config resolver is shared code.
 *
 * Fail-open and zero-footprint throughout: no reply-style directory, an empty one, or a tier whose
 * every file is unreadable all exit silently — never an empty envelope — and one bad file is
 * skipped while the rest ship.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveReplyStyle } = require('./lib/reply-style-config');

const pluginRoot = path.resolve(__dirname, '..', '..');
const replyStyleDir = path.join(pluginRoot, 'rules', 'reply-style');

// The platform caps a hook's output — additionalContext included — at PLATFORM_CAP chars, PER HOOK
// OUTPUT: oversize is persisted to a file and replaced by a ~2KB preview, so it never reaches the
// model. Each envelope carries its own copy of these two numbers because each hook is capped
// independently — this envelope's budget is not a share of the kernel's or the prohibitions'.
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 150;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  let evt = {};
  // On `resume` the transcript — original injection included — is reloaded verbatim, so a
  // re-injection would duplicate this envelope. Skip it (both sibling emitters do the same).
  try {
    evt = JSON.parse(input || '{}') || {};
    if (evt.source === 'resume') process.exit(0);
  } catch { evt = {}; /* unparseable stdin — fall through and inject (fail open) */ }

  // Project-root chain, the estate convention (skill-tracker.js and every sibling): the hook's env
  // var first, then the event's own cwd, then this process's. All three are the directory Claude
  // Code was STARTED in — probed equal, including when that is a subdirectory of the repo — so the
  // emitter and the /nexus:style command resolve the same config file by construction.
  const projectDir = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  // Deliberately silent on every failure mode: a bad value injects the envelope with no disclosure
  // in the payload and writes nothing to stderr (see the header). `off` is the ONLY value that
  // suppresses it, and it suppresses it completely.
  if (resolveReplyStyle(projectDir).state === 'off') process.exit(0);

  const mdFilesIn = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => (e.isFile() || e.isSymbolicLink()) && e.name.endsWith('.md'))
      .map(e => e.name)
      .sort();

  let files = [];
  try {
    files = mdFilesIn(replyStyleDir);
  } catch {
    process.exit(0); // no reply-style tier — nothing to inject
  }
  if (files.length === 0) process.exit(0);

  let body = '';
  for (const f of files) {
    // Per-file guard: one vanished/unreadable file must not drop ALL the content.
    try {
      const text = fs.readFileSync(path.join(replyStyleDir, f), 'utf8');
      // Separated by a newline, not concatenated raw: a file that ends without one would otherwise
      // glue the next file's heading onto its own last line. Conditional on `body` so a single
      // file — today's shipped case — pays nothing, which keeps the budget measurement a pure
      // function of the content.
      body += (body ? '\n' : '') + text;
    } catch { /* skip the bad file, keep the rest */ }
  }

  // Zero READABLE content is the same outcome as an empty directory: silence. Checked on the
  // assembled body, not on the file count — enumeration can succeed while every read fails, and an
  // empty additionalContext is a cost with no payload.
  if (body.trim() === '') process.exit(0);

  // Runtime tripwire, same posture as the sibling envelopes: fail OPEN — emit regardless (a dropped
  // envelope is worse than an oversize one) and warn on stderr, which the platform surfaces without
  // breaking the hook. The DETERMINISTIC gate is REPLY_STYLE_BUDGET in
  // tests/unit/inject-reply-style.test.mjs; this sits between it and the cap, and the test asserts
  // that ordering by parsing these constants.
  if (body.length > WARN_AT) {
    process.stderr.write(
      `nexus inject-reply-style: assembled envelope is ${body.length} chars, over the ${WARN_AT} ` +
      `tripwire (platform hook-output cap is ${PLATFORM_CAP} — oversize output is persisted to a ` +
      `file and never reaches the model). Trim rules/reply-style/*.md.\n`
    );
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body }
  }));
  process.exit(0);
});
