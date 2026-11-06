#!/usr/bin/env node
/**
 * Nexus PreToolUse(Agent|Task) round gate. Synchronous; it refuses a critic round the critic-round
 * schedule does not allow (rules/on-demand/agents-workflow.md § Critic rounds), and passes all else.
 *
 * WHICH SPAWNS: a `nexus:critic` (or `critic`) spawn whose prompt carries `Round: {n}`. The review
 * kind is read from the mode field in either form, `Mode: {n}.` or `Mode {n}: {Name}.` — Mode 1 a
 * spec review, Mode 2 a plan review. A promotion review (Mode 3) is out of reach: its rounds live in
 * the consolidation report, not in a feature's record. A prompt with no `Round:` or no mode passes.
 *
 * THE DECISION is lib/round-gate.js, which the Codex job helper's `start` also calls:
 * - round 4 or later is refused, with no record read;
 * - round 3 is refused when the last round-2 merge table of the same review kind holds no row whose
 *   settled level is CRITICAL — a contested cell is read by its settled level;
 * - the owner-ordered line `Extra round: owner-ordered — "{the owner's words, quoted}"` in the prompt
 *   lets any round through, and every refusal names that line and asks for the owner's words.
 *
 * THE RECORD for round 3 is the feature folder's top-level `delivery/review-critic.md`: the prompt's
 * `Artifact:` path (a quoted or backticked one read whole, spaces included; a bare one up to its first
 * space) cut before its first `definition`, `delivery` or `sdd` segment, so an SDD spec
 * (`docs/specs/{slug}/sdd/definition/spec.md`) and a nested slug find the canonical record. A relative
 * path is resolved in the tree this session declared (lib/worktree-target.js), else the project root.
 *
 * FAIL OPEN, round 3 only: no record at the path, no round-2 merge table of that kind (a record
 * written before the layout), no `level` column, a row whose level the gate cannot read (and no
 * CRITICAL found), an unreadable file or any parse error — the spawn passes, no output. Round 4 needs
 * no record, so it never fails open. A false refusal stops a round the schedule allows; a false pass
 * only lets one through, so every doubt passes.
 *
 * A REFUSAL is a PreToolUse `permissionDecision: deny`, its reason the gate's own text. The platform
 * does not honour a hook's decision on a background subagent's tool call (ADR-13), so a spawn made by
 * a background subagent is not covered; the main session's spawns are.
 */
const path = require('path');
const gate = require('./lib/round-gate');

const TOOLS = ['Agent', 'Task'];
const SEATS = ['nexus:critic', 'critic'];

function decisionFor(data) {
  if (!data || typeof data !== 'object' || !TOOLS.includes(data.tool_name)) return null;
  const input = data.tool_input;
  if (!input || typeof input !== 'object' || !SEATS.includes(input.subagent_type)) return null;
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  const round = gate.roundOf(prompt);
  const kind = gate.kindOfMode(prompt);
  if (round === null || !kind) return null;
  const readRecord = () => {
    const artifact = gate.artifactOf(prompt);
    if (!artifact) return null;
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const record = gate.recordPathFor(artifact, path.isAbsolute(artifact) ? root : resolveDeclaredTree(root, data.session_id));
    return gate.readIfFile(record);
  };
  const verdict = gate.decide({ round, kind, text: prompt, readRecord, recordName: 'the feature\'s review-critic.md' });
  return verdict.refused ? verdict.reason : null;
}

function main(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return; }
  let reason = null;
  try { reason = decisionFor(data); } catch { return; }
  if (!reason) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Nexus round gate: ${reason}`,
    },
  }));
}

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (input += d));
  // No process.exit: on an asynchronous stdout it drops the deny still being written.
  process.stdin.on('end', () => {
    try { main(input); } catch { /* never wedge a spawn */ }
    process.exitCode = 0;
  });
}

module.exports = { decisionFor };
