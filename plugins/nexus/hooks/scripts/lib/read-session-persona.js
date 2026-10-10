'use strict';
/**
 * Resolve the main-thread persona for a session from the per-session registry.
 *
 * Extracted from three hand-copied definitions (guard.js, audit-logger.js, skill-tracker.js) —
 * the same pattern that produced the documented drift incident behind `is-code-file` and
 * `resolve-role` (F45-RuntimeDriftHardening Step 3). Subagent calls carry `agent_type`; the
 * main thread does not, so its role is recorded per-session in `.claude/.personas.json` and
 * read back here. Every caller uses it as the middle tier of the same attribution chain:
 * `data.agent_type || readSessionPersona(sid, root) || 'main'`.
 *
 * Signature is `(sid, root)` — the root is CALLER-RESOLVED and passed in, never derived here.
 * Root policy legitimately differs per hook (guard.js resolves from `data.cwd`, the two loggers
 * from their own already-resolved root), so centralizing it would force one policy on all three.
 *
 * Fail-soft by contract: a falsy `sid` short-circuits to `null` WITHOUT touching the filesystem,
 * and any error — missing file, unreadable file, malformed JSON, a throw on indexing — returns
 * `null` so attribution degrades to the caller's next fallback tier instead of aborting. These
 * are load-bearing behaviors, not defensive padding: they are mined and verified as BR-13, BR-23
 * and BR-24 in `docs/business-rules/hooks/skill-tracker.md`.
 */
const fs = require('fs');
const path = require('path');

function readSessionPersona(sid, root) {
  if (!sid) return null;
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(root, '.claude', '.personas.json'), 'utf8'));
    return reg[sid] && reg[sid].agent;
  } catch {
    return null;
  }
}

module.exports = { readSessionPersona };
