'use strict';
/**
 * The phase token of ONE session: `{root}/.claude/pipeline-state/{session id}`.
 *
 * Writer: the team lead, with the Write tool, before each spawn or resume. The architect's lanes
 * write none, so their rounds read `''`. Every hook that keys a gate or a log on the round reads
 * it here.
 *
 * Why per session: one checkout runs many sessions at once, and a single shared file let a peer
 * session's phase gate this one's writes and mixed their log rows. A spawned subagent's hook payload
 * carries its parent's session id — the fact the `.worktree-target` contract (lib/worktree-target.js)
 * already relies on — so the coordinator's file reaches every agent it spawns. A developer's Bash run
 * carries the same id in `CLAUDE_CODE_SESSION_ID`.
 *
 * `root` is always the session root (`CLAUDE_PROJECT_DIR`), never a redirected tree: the token stays
 * where its writer is, whichever tree a run measures. The id is the one the `.worktree-target` line
 * and the approval stamp carry, so a coordinator that derives it wrongly shows at once as the verify
 * gate's `no session match` reason.
 *
 * An id that is empty or fails lib/safe-id.js, or a root that is not a path, has no file and no token. There is no fallback to any
 * shared file: a session that wrote no token has none.
 */
const fs = require('fs');
const path = require('path');
const { isSafeId } = require('./safe-id');

function tokenFile(root, sessionId) {
  if (typeof root !== 'string' || !root || !isSafeId(sessionId)) return null;
  return path.join(root, '.claude', 'pipeline-state', sessionId);
}

function readRoundToken(root, sessionId) {
  const file = tokenFile(root, sessionId);
  if (!file) return '';
  try { return fs.readFileSync(file, 'utf8').trim(); } catch { return ''; }
}

module.exports = { tokenFile, readRoundToken };
