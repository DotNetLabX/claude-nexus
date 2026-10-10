'use strict';
/**
 * The id-to-file-name guard. An agent id becomes a file name (`.claude/audit/dev-steps/{id}.json`)
 * only when it is made of letters, digits, `_` and `-` — the same character set audit-logger.js
 * keeps from a session id — so no id can climb out of its directory or name a device.
 *
 * Shared by handoff-tracker.js, register-owner-away.js and lib/read-owner-away.js, so a writer and
 * a reader can never disagree about which ids have a file.
 */
const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

function isSafeId(id) {
  return typeof id === 'string' && SAFE_ID.test(id);
}

module.exports = { SAFE_ID, isSafeId };
