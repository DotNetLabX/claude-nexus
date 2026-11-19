'use strict';
/**
 * The skill log's line, built and written the one way: by the skill tracker (skill-tracker.js) and by any script
 * that records a skill no Skill call loaded. Appended to `.claude/audit/skill-invocations.log` under the root it is
 * given: `{ ts, agent, skill, token, session }`, `agent` the attributed type lower-cased past its last `:` or
 * `/`, `main` where none is given.
 */
const fs = require('fs');
const path = require('path');

function skillLine({ ts, agentType, skill, token, session }) {
  const agent = String(agentType || 'main').toLowerCase().split(/[:/]/).pop();
  return { ts, agent, skill, token, session };
}

function appendSkillLine(root, line) {
  const auditDir = path.join(root, '.claude', 'audit');
  fs.mkdirSync(auditDir, { recursive: true });
  fs.appendFileSync(path.join(auditDir, 'skill-invocations.log'), JSON.stringify(line) + '\n');
}

module.exports = { skillLine, appendSkillLine };
