'use strict';
/**
 * Whether a hook event comes from a spawned agent (a subagent or an in-process teammate).
 *
 * The platform puts `agent_id` on a spawned agent's events only. `agent_type` is no test: a
 * session started with `--agent` carries it on its own main-session events too, so reading it as
 * "spawned" treats that main session as a subagent. The role still comes from `agent_type`.
 */
function isSpawned(data) {
  return Boolean(data && data.agent_id);
}

module.exports = { isSpawned };
