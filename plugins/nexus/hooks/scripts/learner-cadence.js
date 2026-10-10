#!/usr/bin/env node
/**
 * Nexus PostToolUse(Write|Edit) learner-cadence nudge. Async, advisory — never blocks, never gates
 * (PostToolUse cannot block, and a broken nudge must never wedge a pipeline close).
 *
 * Why this exists (spec adhoc-LearnerCadenceNudge): the learner is memory-triggered — lessons
 * accumulate silently between runs and nobody consolidates them. This rides the one mandatory
 * close-time touchpoint (the team lead's `summary.md` write) and, once >= THRESHOLD slugs have
 * closed since the last learner consolidation, emits a single advisory line. Silent-when-clean:
 * below threshold, or on any non-summary write, it produces NO output at all (the no-cry-wolf
 * invariant). This is the A4 primary-locus pattern — when A4's nudge registry ships, this folds
 * in as its first row.
 *
 * The cadence counter is the stamp file `.claude/audit/learner-last-run`, written by the learner
 * agent ONLY when a consolidation actually applied promotions (learner.md step 8). Its MTIME
 * drives both the count (summaries newer than it) and the displayed date; the ISO content is
 * informational-only. A MISSING stamp is DATA, not failure: a never-consolidated repo with a real
 * backlog is exactly the state this nudge exists for — it counts ALL summaries and says "never".
 *
 * Delivery: `process.stdout.write(JSON.stringify({ systemMessage: line }))` — the read-tracker.js /
 * boundary-detector.js envelope, the only in-repo shape with precedent for reaching the session; a
 * raw stdout line has none and would fire into the void.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const THRESHOLD = 5;

/**
 * Pure decision function — no I/O, no clock read, fully deterministic (tests inject every input).
 *
 * @param {number[]} summaryMtimes - mtime (ms epoch) of every `docs/specs/**\/delivery/summary.md`.
 * @param {number|null} stampMtime - mtime (ms epoch) of `.claude/audit/learner-last-run`, or `null`
 *   when the stamp is absent (never consolidated / pre-existing repo).
 * @param {number} now - injected reference clock (ms epoch). The pure fn takes time as an argument
 *   rather than reading it so the decision stays deterministic; reserved for A4's registry
 *   generalization (a "days since" variant) — the current line's date comes from the stamp mtime.
 * @returns {string} the nudge line, or `''` when below threshold.
 */
function computeNudge(summaryMtimes, stampMtime, now) {
  void now; // reserved (see @param) — the current line derives its date from the stamp, not now
  const mtimes = Array.isArray(summaryMtimes) ? summaryMtimes : [];
  // Missing stamp ⇒ never consolidated ⇒ every summary counts (spec Behavior #4).
  const count = stampMtime == null ? mtimes.length : mtimes.filter((m) => m > stampMtime).length;
  if (count < THRESHOLD) return '';
  const date = stampMtime == null ? 'never' : new Date(stampMtime).toISOString().slice(0, 10);
  return `Learner cadence: ${count} slugs closed since the last learner consolidation (${date}) — consider 'be learner'.`;
}

module.exports = { computeNudge, THRESHOLD };

// Guarded I/O main (critic M4): importing computeNudge in a test triggers no stdin handler and no
// process.exit — when the process entry point is the ESM test, require.main is undefined, so this
// block never runs on import. It runs only when the script is executed directly by the hook.
if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    try {
      const evt = JSON.parse(raw || '{}');
      const ti = evt.tool_input || {};
      const fp = String(ti.file_path || '').replace(/\\/g, '/');
      // Scope filter: only a `summary.md` close write, at either spec-folder nesting depth
      // (docs/specs/<slug>/delivery/ or docs/specs/<epic>/<issue>/delivery/). Anything else: silent.
      if (!/(^|\/)docs\/specs\/[^/]+(\/[^/]+)?\/delivery\/summary\.md$/.test(fp)) return process.exit(0);

      const root = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
      const summaryMtimes = collectSummaryMtimes(path.join(root, 'docs', 'specs'));

      // Narrow try (critic M3): a missing/unreadable stamp is DATA → null → the `never` path. Only
      // genuinely unexpected errors reach the outer swallow.
      let stampMtime = null;
      try {
        stampMtime = fs.statSync(path.join(root, '.claude', 'audit', 'learner-last-run')).mtimeMs;
      } catch { stampMtime = null; }

      const line = computeNudge(summaryMtimes, stampMtime, Date.now());
      if (line) process.stdout.write(JSON.stringify({ systemMessage: line }));
    } catch { /* outer swallow — a broken nudge must never break a pipeline close */ }
    process.exit(0);
  });
}

// Recursive walk of docs/specs/ (mirrors tests/lint/wiring.test.mjs walk(); zero deps). Collects the
// mtime of every `delivery/summary.md` at any nesting depth. Unreadable entries are skipped.
function collectSummaryMtimes(specsDir) {
  const out = [];
  walkSummaries(specsDir, out);
  return out;
}

function walkSummaries(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSummaries(full, out);
    } else if (entry.name === 'summary.md' && path.basename(dir) === 'delivery') {
      try { out.push(fs.statSync(full).mtimeMs); } catch { /* skip unreadable */ }
    }
  }
}
