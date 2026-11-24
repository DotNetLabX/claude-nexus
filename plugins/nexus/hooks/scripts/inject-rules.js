#!/usr/bin/env node
/**
 * Nexus SessionStart hook: injects the plugin's always-on rules KERNEL into context, plus a
 * Read-Index of the on-demand tier and — in this plugin's own dev repo only — a prompt-audit
 * tripwire.
 *
 * Plugins have NO auto-loaded rules/ directory (verified — bug-class behaviour, not a config
 * miss), so this hook is the mechanism that replaces the host project's auto-loaded
 * .claude/rules/. It fires on startup | clear | compact (never resume — see below).
 *
 * TIERED DELIVERY (ADR-70). The platform caps a hook's output — additionalContext included — at
 * 10,000 chars; anything larger is persisted to a file and replaced by a ~2KB preview, so it
 * never reaches the model. So the payload is:
 *   - tier 1, the KERNEL: every top-level rules/*.md, concatenated in full (budget 9,200 chars
 *     since ADR-91, gated deterministically by tests/unit/inject-rules.test.mjs — where the
 *     location-adjusted leg and the consumer-root projection coincide by construction, so neither
 *     is the tighter one and neither moves alone);
 *   - tier 2, ON-DEMAND: rules/on-demand/*.md are NOT injected. Instead the hook emits a
 *     Read-Index — one line per file, path relative to the once-stated plugin root + the file's
 *     `> Read when:` trigger — generated from the live directory so it cannot go stale.
 * The tier-1 enumeration is deliberately NON-RECURSIVE (pinned by test); making it recursive
 * would re-inject the whole tier-2 the kernel exists to keep out.
 * The resolved plugin paths also tell the session when the Codex job helper starts directly.
 *
 * PROMPT-AUDIT TRIPWIRE. Session start reads existing results and starts a detached check when
 * a comparison is due. The check reads transcripts. A project without the audit doc pays one
 * existence check. A tripwire failure must leave the kernel intact.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { codexRoute } = require('./lib/codex-route');

const pluginRoot = path.resolve(__dirname, '..', '..');
const rulesDir = path.join(pluginRoot, 'rules');
const onDemandDir = path.join(rulesDir, 'on-demand');

// Kernel budget (ADR-70). The platform caps a hook's output — additionalContext included — at
// PLATFORM_CAP chars; oversize is persisted to a file and replaced by a ~2KB preview, so it never
// reaches the model. Two numbers, one concept: the DETERMINISTIC gate lives in
// tests/unit/inject-rules.test.mjs (KERNEL_BUDGET), and this runtime tripwire sits between it and
// the cap, warning only (fail open — never drop the rules). The test asserts the ordering
// KERNEL_BUDGET < WARN_AT < PLATFORM_CAP by parsing these constants, so the margin cannot drift.
const PLATFORM_CAP = 10000;
// ADR-91 restores cap−150. ADR-90 had loosened it to cap−50 only because the payload had grown into
// the tripwire — a real installed cache root (~67 chars) then yielded ~9,934, which would have
// warned on every healthy session start. The diet removed that pressure: the payload now measures
// well under 8,800 even at an 85-char root, so the tripwire can sit back where it usefully precedes
// the cliff instead of hugging it.
const WARN_AT = PLATFORM_CAP - 150;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  // On `resume` the transcript — original injection included — is reloaded verbatim, so a
  // re-injection would duplicate ~6K tokens of rules. Skip it (restore-agent.js does the same).
  let evt;
  try {
    evt = JSON.parse(input || '{}');
    if (evt?.source === 'resume') process.exit(0);
  } catch { /* unparseable stdin — fall through and inject (fail open) */ }

  // Both tiers enumerate FILES only (a symlink counts) — a *directory* named `*.md` would
  // otherwise be concatenated as a kernel section or, worse, listed in the Read-Index as a
  // readable path that is not one. Non-recursive by contract; see the header note.
  const mdFilesIn = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => (e.isFile() || e.isSymbolicLink()) && e.name.endsWith('.md'))
      .map(e => e.name)
      .sort();

  let files = [];
  try {
    files = mdFilesIn(rulesDir);
  } catch {
    process.exit(0); // no rules dir — nothing to inject
  }
  if (files.length === 0) process.exit(0);

  // Read-Index for the on-demand tier. Generated at runtime from the live directory so it can
  // never go stale, and emitted as paths RELATIVE to the root the header states (ADR-91): the root
  // rides the payload once instead of once per entry, which is what collapses the consumer-root
  // sensitivity from 12 × Δroot to 3 × Δroot. Resolved BEFORE the header so the header only
  // promises an index that will actually be there.
  let onDemand = [];
  try {
    onDemand = mdFilesIn(onDemandDir);
  } catch { /* no on-demand tier — index section is simply omitted */ }

  let body =
    '# Nexus — always-on rules\n' +
    // TWO BRANCHES, never one (pinned by test): the unconditional half must mention neither the
    // Read-Index nor the on-demand tier, or a plugin with no tier-2 ships a dangling promise. The
    // conditional half keeps `see the Read-Index` verbatim. "Read a listed file when its trigger
    // applies" is NOT repeated here — the Read-Index banner two sections down states it.
    '\nThe nexus plugin delivers these rules for this session — treat them as loaded from ' +
    '.claude/rules/.' +
    (onDemand.length > 0
      ? ' They are the always-on KERNEL; the fuller rules are on demand — see the Read-Index at ' +
        'the end of this block.\n'
      : '\n') +
    // The ONE root (ADR-91). Stated once, at column 0, before anything that is relative to it —
    // and kept at this exact spelling, which both the Read-Index scheme and a test grep depend on.
    `Nexus plugin root: ${pluginRoot}\n`;

  for (const f of files) {
    // Per-file guard: one vanished/unreadable file must not drop ALL rules.
    try {
      body += `\n\n--- ${f} ---\n` + fs.readFileSync(path.join(rulesDir, f), 'utf8');
    } catch { /* skip the bad file, keep the rest */ }
  }

  if (onDemand.length > 0) {
    body +=
      `\n\n--- on-demand rules (Read-Index) ---\n` +
      `These are NOT injected. Read a file with the Read tool when its trigger applies. Paths are ` +
      `relative to the plugin root above.\n`;
    for (const f of onDemand) {
      const abs = path.join(onDemandDir, f);
      let trigger = '';
      try {
        const m = fs.readFileSync(abs, 'utf8').match(/^> Read when:[ \t]*(.+)$/m);
        if (m) trigger = m[1].trim();
      } catch { /* unreadable file — still index it, with the generic trigger below */ }
      // POSIX-style literal, never path.relative: that returns backslashes on Windows, so the
      // shipped payload would differ byte-for-byte by the platform the session starts on.
      body += `- rules/on-demand/${f}\n  Read when: ${trigger || 'this rule is relevant to the task at hand'}\n`;
    }
  }

  // Resolved plugin paths: ${CLAUDE_PLUGIN_ROOT} does not expand in markdown, so agent files
  // cannot say where the plugin lives. These lines are what make the salvage script invocable
  // from any consumer project (team-lead recovery order, roadmap C.2/C.4). They stay ABSOLUTE
  // under the ADR-91 one-root scheme: a relative `node "…"` resolves against the consumer's cwd,
  // and team-lead.md + doc-anchoring.md both promise this block carries a resolved path.
  const projectDir = process.env.CLAUDE_PROJECT_DIR || evt?.cwd || process.cwd();
  body +=
    `\n\n--- plugin paths (resolved at session start) ---\n` +
    `Salvage script (stranded subagent reply; <config dir>/projects/…/subagents/agent-<id>.jsonl):\n` +
    `  node "${path.join(pluginRoot, 'hooks', 'scripts', 'salvage-transcript.js')}" --file <transcript-path>\n` +
    `Anchor check (close gate, when docs/conventions/anchored-set.md exists):\n` +
    `  node "${path.join(pluginRoot, 'hooks', 'scripts', 'anchor-check.js')}"\n` +
    `Map drift meter (close gate, when docs/architecture-map/ exists):\n` +
    `  node "${path.join(pluginRoot, 'hooks', 'scripts', 'map-drift.js')}"\n` +
    `Fast profile (solo step close; developer: developer.md § The step test rule):\n` +
    `  node "${path.join(pluginRoot, 'hooks', 'scripts', 'verify-run.js')}" --profile fast\n` +
    `Codex job helper: codex-job.js, beside verify-run.js above\n` +
    (codexRoute(projectDir).route === 'direct' ? 'Codex starts directly: yes\n' : '') +
    `Full suite (features.fullSuite on: after merge; gear's handover run):\n` +
    `  node "${path.join(pluginRoot, 'hooks', 'scripts', 'verify-run.js')}" --profile complete --slug <slug> --session <id> [--tree <path>]\n`;

  try {
    const AUDIT_DOC = 'docs/architecture/subagent-context-audit.md';
    const auditDoc = path.join(projectDir, AUDIT_DOC);
    if (fs.existsSync(auditDoc)) {
      // A load failure must leave the kernel available.
      const { sessionWarning } = require('./lib/prompt-audit-io');
      body += sessionWarning({
        project: projectDir,
        transcripts: typeof evt?.transcript_path === 'string' && evt.transcript_path
          ? path.dirname(evt.transcript_path) : null,
        warningLimit: WARN_AT - body.length,
      });
    }
  } catch { /* Keep the kernel even if the audit cannot be loaded or run. */ }

  // Measure the final payload, including any audit warning.
  // Runtime tripwire. Fail OPEN — emit the payload regardless (a dropped kernel is worse than an
  // oversize one) and warn on stderr, which the platform surfaces without breaking the hook.
  if (body.length > WARN_AT) {
    process.stderr.write(
      `nexus inject-rules: assembled kernel is ${body.length} chars, over the ${WARN_AT} tripwire ` +
      `(platform hook-output cap is ${PLATFORM_CAP} — oversize output is persisted to a file and ` +
      `never reaches the model). Trim rules/*.md or demote a file to rules/on-demand/.\n`
    );
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body }
  }));
  process.exit(0);
});
