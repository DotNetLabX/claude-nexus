#!/usr/bin/env node
/**
 * Nexus SubagentStart hook: delivers the SPAWN CONTRACT into a spawned agent's context — the second
 * command on this event, alongside F81's verify-roles carrier (ADR-100 Decision Rule 4).
 *
 * THE PROBLEM. The always-on rules reach the MAIN session only: three SessionStart envelopes, and a
 * SessionStart injection never reaches a spawn (ADR-70's constraint). A spawned pipeline agent at
 * least carries its own agent-file body. A CHARTER-LESS helper — `general-purpose`, `Explore`, a
 * custom name — carries nothing but whatever the dispatcher happened to type into the prompt, and
 * that is the incident class this program exists for. SubagentStart is the one channel that reaches
 * a spawn; F80 P0 measured it delivering 4/4, and F100's spikes measured it reaching a helper spawned
 * BY a subagent as well.
 *
 * TWO PAYLOADS, ONE AUDIENCE EACH.
 *   PRIMARY   — rules/spawn-contract/helper-contract.md, for the charter-less population. This is
 *               the payload the feature exists for: it is the only carrier those spawns have.
 *   SECONDARY — rules/spawn-contract/role-boundary.md, reinforcement for pipeline agents. It is
 *               NEVER a rule's sole carrier: every line restates a rule the agent file already owns
 *               and still owns, so nothing breaks if this block is dropped.
 *
 * AUDIENCE = A MEMBERSHIP TEST, NEVER AN EMPTINESS TEST. `resolveRole` returns the STRIPPED TOKEN for
 * an unknown type (`general-purpose` -> `"general-purpose"`, `Explore` -> `"explore"`); it returns
 * `''` only for an ABSENT type. So the switch is: no raw `agent_type` -> nothing;
 * `KNOWN_ROLES.has(resolveRole(type))` -> the role block; anything else -> the helper contract. An
 * emptiness test would route every helper into the absent-type branch and deliver the primary payload
 * to nobody — silently, because a zero-footprint exit is also this hook's correct behaviour on an
 * opt-out. One block per spawn, never both.
 *
 * POINTER FORM, NOT A DATA CARRIER (ADR-100 DR2, sanctioned copy form #3). Every line is one
 * imperative ending in a pointer to the section that OWNS the rule, the shape
 * rules/prohibitions/prohibitions.md uses. No new rules ride here: a line without an owner elsewhere
 * would give one rule two owners, which is the drift this form exists to prevent. Unlike
 * inject-verify-roles.js, which carries DATA the repo declared, this carries prose — so it is
 * budgeted small and says nothing the estate does not already say.
 *
 * NOT A CONTAINMENT MECHANISM. This hook informs; it does not enforce. ADR-13 measured a synchronous
 * PreToolUse `deny` as DROPPED for a background subagent's tool call, so nothing in this plugin may
 * treat a hook as a gate. The boundary detector still logs the breach it always logged.
 *
 * BUDGET. Deliberately smaller than the prohibitions envelope: this rides in EVERY spawn's context on
 * top of an agent body that can already be 90 KB. The deterministic gate is SPAWN_CONTRACT_BUDGET in
 * tests/unit/inject-spawn-contract.test.mjs; the runtime tripwire below sits between it and the
 * platform cap. F100 Spike 1 measured that cap ON THIS EVENT: at 12,000 chars the payload was
 * persisted to a file and replaced by a ~2.4 KB preview, and the terminal marker never reached the
 * model — so an oversize payload here is a silent total loss, not a degraded delivery. Each command
 * on the event is capped independently (8,000 and 9,850 both arrived whole beside the roster).
 *
 * ZERO FOOTPRINT BY DEFAULT. Missing directory, unreadable file, whitespace-only body, absent
 * agent_type or unparseable stdin -> write nothing and exit 0. Never a partial or empty envelope:
 * an empty additionalContext is a cost with no payload.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole, KNOWN_ROLES } = require('./lib/resolve-role');

const pluginRoot = path.resolve(__dirname, '..', '..');
const contractDir = path.join(pluginRoot, 'rules', 'spawn-contract');

// The measured platform cap, per hook OUTPUT (F100 Spike 1, CLI 2.1.260, on SubagentStart itself).
const PLATFORM_CAP = 10000;
const WARN_AT = PLATFORM_CAP - 150;
// Mirrored by the test's own constant so a payload that passes here cannot fail there.
const SPAWN_CONTRACT_BUDGET = 3000;

const HELPER = 'helper-contract.md';
const ROLE_BOUNDARY = 'role-boundary.md';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');

    // Guard on the RAW field, before resolution — an absent type is not an audience, and it is the
    // only input for which resolveRole returns ''.
    if (!data.agent_type) return process.exit(0);

    const file = KNOWN_ROLES.has(resolveRole(data.agent_type)) ? ROLE_BOUNDARY : HELPER;

    let body;
    try {
      body = fs.readFileSync(path.join(contractDir, file), 'utf8');
    } catch {
      return process.exit(0); // no tier shipped, or one unreadable file — silence, never a stub
    }
    if (!body || body.trim() === '') return process.exit(0);

    // Fail OPEN, the posture both always-on envelopes use: a dropped payload is worse than an
    // oversize one, so emit regardless and warn on stderr, which the platform surfaces without
    // breaking the hook.
    if (body.length > WARN_AT) {
      process.stderr.write(
        `nexus inject-spawn-contract: ${file} assembles to ${body.length} chars, over the ${WARN_AT} ` +
        `tripwire (platform hook-output cap is ${PLATFORM_CAP} — oversize output is persisted to a ` +
        `file and never reaches the model). Trim rules/spawn-contract/*.md.\n`
      );
    }

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: body },
    }));
  } catch { /* fail silent — a carrier that cannot parse its own input emits nothing, never a stub */ }
  process.exit(0);
});
