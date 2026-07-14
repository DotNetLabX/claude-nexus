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
 *
 * Abbreviations: the fast lane names its spawns `dev-wave0` / `dev-w1` / `dev-json-golden-2`. The
 * suffix-peel alone does NOT save these — it yields candidate `dev`, which is not a KNOWN_ROLE, so
 * the name returns unresolved and breaks BOTH consumers: the boundary detector logs a false ADR-18
 * cross-role write on every `implementation.md` touch, and the verify gate falls through to
 * `verdict:"skipped"` — recorded, but the developer's verify set never runs. So resolution consults
 * an abbreviation map at the SAME two points as KNOWN_ROLES. Keep it an EXACT-TOKEN map, never a
 * prefix/startsWith match: a prefix rule would collapse any `dev*` token and re-open the team-lead
 * class of bug. (plugin-feedback omni-1.32.0 Entry 1; 3 slugs — 33 logged violations.)
 */
const KNOWN_ROLES = new Set(['team-lead', 'po', 'architect', 'developer', 'reviewer', 'critic', 'learner', 'solo']);

// Abbreviation -> canonical role. Add only abbreviations OBSERVED in real spawn names; an unevidenced
// entry can only mis-resolve. Extension point for any future fast-lane shorthand.
const ROLE_ABBREVS = new Map([['dev', 'developer']]);

function canonicalize(token) {                                          // exact token -> role, or '' if neither
  if (KNOWN_ROLES.has(token)) return token;                             // base role (incl. team-lead)
  return ROLE_ABBREVS.get(token) || '';                                 // abbreviation (exact token only)
}

function resolveRole(agentType) {
  if (!agentType) return '';
  const stripped = String(agentType).toLowerCase().split(/[:/]/).pop(); // drop a `nexus:`/path namespace
  const exact = canonicalize(stripped);
  if (exact) return exact;                                              // developer; team-lead; dev
  const parts = stripped.split('-');
  for (let n = parts.length - 1; n >= 1; n--) {                         // longest hyphen-prefix first
    const cand = canonicalize(parts.slice(0, n).join('-'));
    if (cand) return cand;                                              // developer-f6 -> developer; team-lead-2 -> team-lead; dev-wave0 -> developer
  }
  return stripped;                                                      // genuinely unknown — caller treats as unknown
}

module.exports = { resolveRole, KNOWN_ROLES, ROLE_ABBREVS };
