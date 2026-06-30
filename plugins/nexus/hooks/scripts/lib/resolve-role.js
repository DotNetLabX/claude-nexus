'use strict';
/**
 * Resolve a raw hook `agent_type` to its canonical pipeline role.
 *
 * The platform surfaces a spawn's display name as `agent_type`, which the name-keyed hooks
 * (verify-gate, boundary-detector) reduce to a role. A bare `.split(/[:/]/).pop()` strips the
 * NAMESPACE (`nexus:developer` -> `developer`) but NOT a custom or auto-assigned spawn-name
 * SUFFIX: a re-spawn of an already-rostered role auto-suffixes (`developer` -> `developer-2`),
 * and teams name spawns `developer-f6` / `architect-rrc`. Left unresolved, `developer-2` is not in
 * the role sets -> the verify gate writes `verdict:"skipped"` (reads as a pass but never ran) and
 * the boundary detector false-flags the agent writing its own `implementation.md`. (plugin-feedback
 * knowledge-gateway P1 + sprint-rituals item 1, ~27 occurrences across two consuming repos.)
 *
 * Landmine: `team-lead` is itself a hyphenated base role — never naively strip after the first
 * hyphen or it collapses to `team`. So match the FULL token against the role set first, then peel
 * trailing `-<suffix>` segments longest-prefix-first and stop at the first known role.
 */
const KNOWN_ROLES = new Set(['team-lead', 'po', 'architect', 'developer', 'reviewer', 'critic', 'learner', 'solo']);

function resolveRole(agentType) {
  if (!agentType) return '';
  const stripped = String(agentType).toLowerCase().split(/[:/]/).pop(); // drop a `nexus:`/path namespace
  if (KNOWN_ROLES.has(stripped)) return stripped;                       // exact base role (incl. team-lead)
  const parts = stripped.split('-');
  for (let n = parts.length - 1; n >= 1; n--) {                         // longest hyphen-prefix first
    const cand = parts.slice(0, n).join('-');
    if (KNOWN_ROLES.has(cand)) return cand;                             // developer-f6 -> developer; team-lead-2 -> team-lead
  }
  return stripped;                                                      // genuinely unknown — caller treats as unknown
}

module.exports = { resolveRole, KNOWN_ROLES };
