#!/usr/bin/env node
/**
 * Nexus SubagentStart hook: delivers the repo's DECLARED verify commands into an implementation
 * subagent's context at spawn time (F81, KH feedback item 7).
 *
 * THE PROBLEM. `.claude/verify.json` carries the repo's command roster in its `roles` block, and no
 * spawned subagent reads it — so the developer rediscovers build/test commands every run (measured
 * ~4–6 min/run across 29 runs in a consuming repo). The always-on rules kernel cannot carry it
 * either: that is a SessionStart injection and never reaches a spawn (ADR-70's constraint, restated
 * in team-lead.md's Close Gate item 3). SubagentStart does — its additionalContext was live-probed
 * reaching subagent context 4/4 (F80 P0, 2026-08-28).
 *
 * WHAT RIDES HERE — a DATA CARRIER, not prose (ADR-94's placement rule: prohibitions always-on,
 * procedures on demand). This states what the repo declared plus the two limits on USING it. It
 * carries no rules and no procedure: the one-call step-close rule is developer.md's and tdd's, the
 * close gate's full-suite duty is team-lead.md's. Duplicating either here would give two owners to
 * one rule.
 *
 * WHO GETS IT. Implementation roles only (developer / solo) — resolved through lib/resolve-role.js
 * exactly as verify-gate.js resolves them, so a namespaced `nexus:developer`, an auto-suffixed
 * `developer-2` and a named `dev-wave0` (older runs; developers now spawn unnamed, their name the
 * description's first word) all land on `developer`. Every other recognized role
 * and an absent agent_type get nothing: an architect has no step to close, and paying context for a
 * command roster it will not run is the cost this hook exists to reduce.
 *
 * ZERO FOOTPRINT BY DEFAULT. No verify.json, unreadable/malformed JSON, no `roles` key, or a `roles`
 * block with nothing usable in it → write nothing and exit 0. Same posture as inject-prohibitions.js
 * on a missing directory: an empty envelope is a cost with no payload, and a repo that declared
 * nothing must be byte-unchanged.
 *
 * WHICH TREE. Root resolution mirrors read-tracker.js (CLAUDE_PROJECT_DIR || cwd), then honours a
 * session-matching `.claude/.worktree-target` line via lib/worktree-target.js — the same rule
 * verify-gate.js measures by. A worktree round must be handed ITS tree's declaration, not the
 * session root's.
 *
 * SECOND PAYLOAD — the per-step commit block (F81 Step 8 rider). When the tree declares
 * `commitStrategy: "per-step"`, this carrier also delivers the resolved invocation of
 * commit-step.js. It rides HERE for the same reason the roster does, one level sharper: an agent
 * file cannot state the path at all (the plugin-root variable does not expand in markdown, and the
 * release lint rejects it there), and the kernel's plugin-paths block — which is how the MAIN
 * session learns such a path — is a SessionStart injection that never reaches a spawn. Without this
 * block, developer.md would name a command its reader cannot locate. Still a data carrier: a
 * resolved path and a declared value, plus the one line saying where a step commit may land. The
 * rule itself stays developer.md's, and every refusal stays the helper's.
 *
 * THIRD PAYLOAD — the runner block (F147), FIRST in the payload. When the tree declares a non-empty
 * `roles.unit` — the same arming condition as test-entry-gate.js — the carrier delivers the resolved
 * verify-run.js call for the fast profile and its named-files form. Same reason as the commit block:
 * nothing else in a background spawn's context can locate the runner.
 *
 * BUDGET PRIORITY. All three payloads share the 2,000-byte delivery budget. The ROSTER yields first
 * (it is verify.json, a file the developer can open), the commit block second, and the runner block
 * never while anything else remains — it is the one call every step makes, and it is recoverable from
 * nothing in a subagent's context.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { resolveRole } = require('./lib/resolve-role');
const { resolveDeclaredTree } = require('./lib/worktree-target');

// Roles that write application source — the same boundary verify-gate.js draws, and for the same
// reason: these are the spawns with a step to close.
const IMPL_ROLES = new Set(['developer', 'solo']);

// Declaration order is fixed here, never taken from the file's key order: the roster reads as a
// sequence (what you compile with, what you close a step with, what the close gate runs, what the
// mutation lane runs), and a repo's JSON key order is incidental.
const ROLE_ORDER = ['build', 'unit', 'full', 'mutation'];

// `full` is the close gate's, run from the main session by verify-run.js — annotated inline so the
// roster itself says why the subagent must not run it, without carrying the rule.
const ROLE_NOTES = { full: ' (main session only)' };

// The platform caps a hook's output at 10,000 chars and DROPS an oversize payload (persisting it to
// a file the model never sees). For a carrier whose only job is delivery, a silent drop is total
// failure, so an implausibly long declaration is truncated to a payload that still arrives.
//
// Two rules keep the truncation from destroying the payload it is protecting.
//
// (1) The budget never bounds the whole block. The limits line below is what makes the roster safe to
//     act on, so truncating the assembled body would drop exactly the sentences the feature exists to
//     deliver and leave a bare wall of commands behind — a worse payload than none.
// (2) The cap is PER ROLE, not on the joined roster. One pathological declaration must not starve its
//     siblings: capping the joined string lets a huge `build` value consume the whole budget and drop
//     `unit` entirely — and `unit` is the one command an implementation subagent actually needs. Each
//     role is bounded on its own, so every declared role always arrives.
const MAX_ROLE_CHARS = 300;

// The whole delivery budget, shared by the roster and the per-step block. Deliberately the same
// number tests/unit/inject-verify-roles.test.mjs gates on: one budget, asserted in one place, so a
// payload that passes here cannot fail there.
const DELIVERY_BUDGET = 2000;

// The per-step commit block. Emitted ONLY when the tree declares that strategy — every other repo
// stays byte-identical, which is this carrier's standing posture.
//
// DEVELOPER ONLY, narrower than the roster's audience. `solo` also gets the roster (it closes steps
// and runs the same verify commands), but solo's commits are user-driven and outside the commit
// strategy entirely — its own file says so. Delivering a commit helper into a context whose agent
// file never authorizes using it would grant a capability no rule governs, which is the shape of
// every accident this feature is otherwise built to prevent.
function commitBlock(tree, role) {
  if (role !== 'developer') return '';
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'nexus-agents.json'), 'utf8')); }
  catch { return ''; }                                  // absent or malformed — nothing to declare
  if (!cfg || cfg.commitStrategy !== 'per-step') return '';

  // POSIX separators even on Windows: the path is pasted into a command line, where a backslash is
  // an escape character. Quoted for the same reason a path with spaces must be.
  const script = path.join(__dirname, 'commit-step.js').replace(/\\/g, '/');
  return '```\n' +
    'Nexus commit strategy: per-step (.claude/nexus-agents.json)\n' +
    `  node "${script}" --slug <slug> --step <n> --msg-file <path> -- <path>...\n` +
    'Commit each finished step this way and no other: only on the slug branch, only the paths you ' +
    'list, never a raw git command. Integration squashes the branch.\n' +
    'The message file is yours to write anywhere outside the repo tree (a temp path); subject ' +
    '"feat({slug}): step {n} - {step name}", body optional. The helper appends its own trailer.\n' +
    '```';
}

function runnerBlock(roles) {
  if (typeof roles.unit !== 'string' || roles.unit.trim() === '') return '';
  const runner = path.join(__dirname, 'verify-run.js').replace(/\\/g, '/');
  return '```\n' +
    `run tests: node "${runner}" --profile fast\n` +
    `the test file you are writing: node "${runner}" --profile fast --files <test file>...\n` +
    '```';
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');

    const role = resolveRole(data.agent_type);
    if (!role || !IMPL_ROLES.has(role)) return process.exit(0); // not an implementation spawn

    const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
    const tree = resolveDeclaredTree(root, data.session_id);

    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'));
    } catch {
      return process.exit(0); // absent or malformed — zero footprint, never a partial envelope
    }
    const roles = cfg && cfg.roles;
    if (!roles || typeof roles !== 'object') return process.exit(0);

    // Only string values survive: a null, a number, or a nested object is not a runnable command,
    // and shipping one would put an un-runnable string in front of the model as if it were one.
    const present = ROLE_ORDER.filter((r) => typeof roles[r] === 'string' && roles[r].trim() !== '');

    // One role per line, never a single ` | `-joined line: a declared command may itself contain a
    // pipe (`npm test | tee out.log`), which would make the entries ambiguous exactly where they must
    // be copied verbatim. Parameterized by the per-role cap so the budget pass below can tighten it.
    const rosterAt = (cap) => present.map((r) => {
      const cmd = roles[r].trim();
      const shown = cmd.length > cap
        ? `${cmd.slice(0, cap)}… (truncated — read .claude/verify.json)`
        : cmd;
      return `  ${r}: ${shown}${ROLE_NOTES[r] || ''}`;
    }).join('\n');

    const commit = commitBlock(tree, role);
    if (present.length === 0 && !commit) return process.exit(0);
    const runner = runnerBlock(roles);

    const assemble = (roster, withCommit = true) => [
      runner,
      roster && ('```\n' +
        'Nexus verification roles (.claude/verify.json → roles):\n' +
        `${roster}\n` +
        'Step-close = ONE call of verify-run.js --profile fast; never a separate build call outside a ' +
        'compile-fix loop; the full suite is never run by a subagent.\n' +
        '```'),
      withCommit && commit,
    ].filter(Boolean).join('\n');

    // Budget pass. The per-role cap tightens until the WHOLE payload fits, which trims every role a
    // little rather than dropping one entirely — a dropped role reads as "the repo did not declare
    // it", the one misreading a carrier must never cause. The runner and commit blocks are not in the
    // loop: they are the parts nothing downstream can reconstruct.
    let cap = MAX_ROLE_CHARS;
    let body = assemble(rosterAt(cap));
    while (Buffer.byteLength(body, 'utf8') > DELIVERY_BUDGET && cap > 24) {
      cap = Math.max(24, Math.floor(cap * 0.75));
      body = assemble(rosterAt(cap));
    }
    // Shrinking bottoms out at the floor. If the payload is still oversize there, drop the roster
    // ENTIRELY rather than emit over budget — emitting over budget is not a degraded delivery, since
    // the platform persists an oversize payload to a file the model never sees, so losing both
    // blocks is strictly worse than losing the one the reader can recover from `.claude/verify.json`.
    //
    // Reachability, stated honestly: with the four-role roster this hook actually emits, the floor
    // caps the roster near 300 chars, the commit block near 400 and the runner block near 250, so
    // these lines are a FLOOR rather than a live path — reachable only if the role list grows or a
    // plugin root gets implausibly long. Kept because the alternative is a silent over-budget emit,
    // which is the one failure mode a carrier cannot detect. Past the roster, the commit block goes
    // before the runner block.
    const over = () => Buffer.byteLength(body, 'utf8') > DELIVERY_BUDGET;
    if ((commit || runner) && over()) body = assemble('');
    if (commit && runner && over()) body = assemble('', false);

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: body },
    }));
  } catch { /* fail silent — a carrier that cannot parse its own input emits nothing, never a stub */ }
  process.exit(0);
});
