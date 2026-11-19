'use strict';
/**
 * The hand-back log's rows, built and written the one way: by the handoff tracker (handoff-tracker.js) and by
 * any script that records a hand-back for work no hook saw. Each row is appended to
 * `.claude/audit/handoff.jsonl` under the root it is given, with `plugin_version` read from this plugin's own
 * plugin.json (left out when unreadable).
 *
 *   handback -> { ts, event: "handback", agent_id, agent_type, token, session[, step | range_end] }
 *   spawn | resume -> { ts, event, target, token, session }
 *
 * `agent_type` keeps the platform's type lower-cased, past its last `:` or `/`.
 */
const fs = require('fs');
const path = require('path');

let pluginVersion;
function readPluginVersion() {
  if (pluginVersion === undefined) {
    pluginVersion = null;
    try {
      const v = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
      if (typeof v === 'string' && v) pluginVersion = v;
    } catch { /* unreadable: the field is omitted */ }
  }
  return pluginVersion;
}

function handbackRow({ ts, agentId, agentType, token, session, step, rangeEnd }) {
  return {
    ts, event: 'handback', agent_id: agentId, agent_type: String(agentType).toLowerCase().split(/[:/]/).pop(), token, session,
    ...(step ? { step } : {}), ...(rangeEnd ? { range_end: rangeEnd } : {}),
  };
}

const targetRow = ({ ts, event, target, token, session }) => ({ ts, event, target, token, session });

/** The row as the log holds it. */
function handoffLine(record) {
  const version = readPluginVersion();
  return version ? { ...record, plugin_version: version } : record;
}

function appendHandoff(root, record) {
  const auditDir = path.join(root, '.claude', 'audit');
  fs.mkdirSync(auditDir, { recursive: true });
  fs.appendFileSync(path.join(auditDir, 'handoff.jsonl'), JSON.stringify(handoffLine(record)) + '\n');
}

module.exports = { handbackRow, targetRow, handoffLine, appendHandoff };
