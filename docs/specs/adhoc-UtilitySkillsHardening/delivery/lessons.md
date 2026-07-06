# Lessons — adhoc-UtilitySkillsHardening

## Architect Lessons

- **`Measure-Object -Line` silently skips blank lines** — a line-count claim in a plan must come from
  `(Get-Content $f).Count`, never `Measure-Object -Line`. The artifact (325 vs the real 410) shipped into a
  plan that advertised code-grounding; the code-grounded critic caught it (M1). Any count a plan cites comes
  from a query whose semantics you've verified, not just a query you ran.
- **A pass that adds a lint check AND content that check could match must cross-check the two against each
  other.** Step 1's W4 (nested-reference warning), read with the widened regex, would have flagged Step 3's
  own `scripts/` recipe additions — the plan adding the check and its first false positive in the same
  change (critic H1). When a plan both tightens a gate and edits the gated surface, run the new gate's logic
  mentally over the pass's own diff before shipping the spec.
- **A cwd-relative fallback re-introduces caller-dependence into a previously deterministic tool.** The E6
  repo-level fallback anchored to `process.cwd()` would have made the lint's exit code depend on the
  invocation directory (critic M2). Anchor to a discoverable marker (nearest `.git` ancestor of the input)
  instead — deterministic from anywhere.
- **The external audit's own blind spot was real but its literal fix was unshippable** — naive E6 widening
  breaks two shipped skills the auditors couldn't see (they audited the concept, not this estate). Re-ground
  every inbound feedback item against live source before planning it (confirmed the standing rule); the
  amendment (marker-anchored fallback + file-shaped filter) is the plan's core design contribution.
