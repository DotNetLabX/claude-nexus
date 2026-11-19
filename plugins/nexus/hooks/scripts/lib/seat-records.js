'use strict';
/**
 * The records a seat job leaves in the session root, written by codex-job.js where a hook would have written them
 * for a Claude seat: no Nexus hook runs inside Codex.
 *
 * THE SEAT'S IDENTITY is `codex-seat-{role}`: the `--agent` its brief gives the test runner's step form, so the
 * job's step-run records can be told from any other's.
 *
 * THE SKILL LINES. One line per skill the brief delivered, built by lib/skill-log.js, with the seat's role as its
 * agent and `via: "brief"` — the skill's text was in the brief, no Skill call loaded it.
 *
 * THE HAND-BACK ROWS. The job's start is a `spawn` row whose target is the seat's role, its end a `handback` row
 * whose agent id is `codex-{job id}` and whose agent type is the role, both built by lib/handoff-log.js and both
 * marked `engine: "codex"`.
 *
 * THE STEP-RUN RECORDS. A job runs the step form with the tree as its project root, so its records land in the
 * tree's `.claude/audit/verify-verdict.json`. A record is the job's only where it is a step run, its agent is the
 * seat's identity, its own `tree` is the job's tree and it was written after the job's intent: a Codex server
 * another session started can hand a job that session's environment. Each is appended to the session root's log
 * once, matched by its run id, with the session and the session's token filled in where its own are empty. Where
 * the tree is the session root the records are already there and nothing is carried.
 */
const fs = require('fs');
const path = require('path');
const { skillLine, appendSkillLine } = require('./skill-log');
const { handbackRow, targetRow, appendHandoff } = require('./handoff-log');
const { treeKey } = require('./codex-seat');

const ENGINE = 'codex';
const VERDICTS = path.join('.claude', 'audit', 'verify-verdict.json');

const seatIdentity = (role) => `codex-seat-${role}`;

function writeSkillLines({ root, role, skills, token, session, ts = new Date().toISOString() }) {
  for (const skill of skills) appendSkillLine(root, { ...skillLine({ ts, agentType: role, skill, token, session }), via: 'brief' });
}

function writeStartRow({ root, role, token, session, ts = new Date().toISOString() }) {
  appendHandoff(root, { ...targetRow({ ts, event: 'spawn', target: role, token, session }), engine: ENGINE });
}

function writeEndRow({ root, role, jobId, token, session, ts = new Date().toISOString() }) {
  appendHandoff(root, { ...handbackRow({ ts, agentId: `codex-${jobId}`, agentType: role, token, session }), engine: ENGINE });
}

function readLines(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* a torn line is not a record */ }
  }
  return out;
}

/** The job's step-run records as the tree's verify log holds them. */
function jobStepRuns({ tree, role, since }) {
  const own = treeKey(tree);
  const identity = seatIdentity(role);
  const from = Date.parse(since);
  return readLines(path.join(tree, VERDICTS)).filter((r) => r && r.step_run === true && r.agent === identity
    && typeof r.run_id === 'string' && typeof r.tree === 'string' && treeKey(r.tree) === own && Date.parse(r.ts) >= from);
}

/** The number of the job's step-run records appended to the session root's log by this call. */
function carryStepRuns({ root, tree, role, since, token, session }) {
  if (treeKey(tree) === treeKey(root)) return 0;
  const target = path.join(root, VERDICTS);
  const present = new Set(readLines(target).map((r) => r && r.run_id).filter(Boolean));
  const carried = [];
  for (const r of jobStepRuns({ tree, role, since })) {
    if (present.has(r.run_id)) continue;
    present.add(r.run_id);
    carried.push({ ...r, session: r.session || session, token: r.token || token });
  }
  if (!carried.length) return 0;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.appendFileSync(target, carried.map((r) => JSON.stringify(r) + '\n').join(''));
  return carried.length;
}

module.exports = { ENGINE, seatIdentity, writeSkillLines, writeStartRow, writeEndRow, jobStepRuns, carryStepRuns };
