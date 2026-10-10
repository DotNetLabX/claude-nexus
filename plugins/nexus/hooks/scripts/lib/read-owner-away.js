'use strict';
/**
 * Is this session marked owner-away?
 *
 * The mark is one file per session — `.claude/audit/owner-away/<session_id>` under the hooks' root —
 * written and removed by register-owner-away.js and read by owner-ask-gate.js. The path is built
 * here and nowhere else, so the writer and the reader cannot disagree about where a mark lives.
 *
 * Signature is `(sessionId, root)`, as lib/read-session-persona.js has it: the root is
 * CALLER-RESOLVED and passed in, never derived here.
 *
 * A MARK IS A REGULAR FILE THAT IS NOT EMPTY — decided by one `stat`, with no read. An empty record
 * is no usable mark: a torn write or a hand-made file must never refuse every question in a session
 * whose owner declared nothing. What the writer puts in the file is for a person reading it; it is
 * never parsed and never compared, and the file's age is never consulted — the mark has no timer.
 *
 * Fail-soft by contract: a session id that is not a plain file name, and any error, read as not set.
 */
const fs = require('fs');
const path = require('path');
const { isSafeId } = require('./safe-id');

/** Where one session's mark lives. The caller has already checked the id with `isSafeId`. */
function ownerAwayFile(root, sessionId) {
  return path.join(root, '.claude', 'audit', 'owner-away', sessionId);
}

function readOwnerAway(sessionId, root) {
  if (!isSafeId(sessionId)) return false;
  try {
    const stat = fs.statSync(ownerAwayFile(root, sessionId));
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

module.exports = { readOwnerAway, ownerAwayFile };
