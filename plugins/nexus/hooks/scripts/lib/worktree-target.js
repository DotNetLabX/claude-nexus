'use strict';
/**
 * Read the coordinator-published worktree target for ONE session (F51).
 *
 * Extracted from verify-gate.js, which owned it privately until three consumers needed the same
 * rule (verify-gate, inject-verify-roles, verify-run). Same precedent as lib/resolve-role.js: a
 * rule that decides WHICH TREE a hook measures cannot live in one hook's file while two others
 * re-derive it — three copies of a session-matching rule is three chances to diverge, and a
 * divergence here fails GREEN (it measures the wrong tree and records a pass).
 *
 * Returns { status: 'absent' | 'no-match' } or { status: 'match', tree }.
 *
 * The file is APPEND-ONLY JSON lines, one per dispatch, and every line is session-keyed — so a
 * CONCURRENT session's line is inert by construction and can never redirect this stop. Last match
 * wins, which is also how a session "un-publishes" (append a newer line); no deletion duty exists,
 * so a peer's close can never blind a live round.
 *
 * The match is against the RAW payload field: an absent or empty session id must match NOTHING,
 * including a line that itself carries "session_id": "". Normalizing to '' first would make those
 * two collide and let an unkeyed line redirect an unkeyed payload.
 */
const fs = require('fs');
const path = require('path');

function readWorktreeTarget(root, rawSessionId) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(root, '.claude', '.worktree-target'), 'utf8');
  } catch {
    return { status: 'absent' }; // unpublished or unreadable — the topology-neutral status quo
  }
  if (typeof rawSessionId !== 'string' || rawSessionId === '') return { status: 'no-match' };
  let match = null;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed;
    try { parsed = JSON.parse(trimmed); } catch { continue; } // per-line tolerance: skip and keep going
    if (parsed && parsed.session_id === rawSessionId) match = parsed;
  }
  return match ? { status: 'match', tree: match.tree } : { status: 'no-match' };
}

/**
 * Compose readWorktreeTarget into "the tree this session's declaration file should be read from".
 *
 * The READ-ONLY consumers' shape (inject-verify-roles, verify-run): they only need to know where
 * .claude/verify.json lives, so every not-a-usable-match case degrades to `root` — the pre-F51
 * status quo. verify-gate deliberately does NOT use this: its three-way distinction (absent /
 * no-match / match-but-unusable) is load-bearing for the verdict record it writes, and collapsing
 * an unusable target to a silent fallback there would turn a loud verdict:"unknown" into a pass.
 *
 * Usability is checked the same way verify-gate checks it, and for the same reason: absolute-only,
 * because a relative value would otherwise resolve against the hook process's INCIDENTAL cwd.
 */
function resolveDeclaredTree(root, rawSessionId) {
  let signal;
  try { signal = readWorktreeTarget(root, rawSessionId); } catch { return root; }
  if (!signal || signal.status !== 'match') return root;
  const declared = String(signal.tree);
  if (!path.isAbsolute(declared)) return root;
  try { if (!fs.statSync(declared).isDirectory()) return root; } catch { return root; }
  return declared;
}

module.exports = { readWorktreeTarget, resolveDeclaredTree };
