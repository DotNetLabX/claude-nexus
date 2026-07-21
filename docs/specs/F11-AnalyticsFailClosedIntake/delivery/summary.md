# F11 — Fail-Closed Intake (Mandatory Clarification) — Summary

Mode: architect-led fast lane

## Status: COMPLETE

## What Was Built

Fail-closed mandatory-clarification intake for the `nexus-analytics` data-analyst: no query runs while a
mandatory input is unresolved, all missing inputs are asked in one batched message, and every applied
default is named in the shipped answer. The declaration of which inputs are mandatory is **data the plugin
reads** (authoritative source = the semantic model; a consuming project's profile carries an identical
interim bridge until the model does), never product knowledge the plugin ships. Implemented as a new
`fail-closed-intake` skill (the declaration schema + precedence + per-user defaults record + legacy
migration + the fail-closed gate), with the data-analyst agent and the `semantic-model-query` /
`answer-qa` skills rewired to route through it.

## Key Outcomes

- **6 plugin files** touched: 1 created (`skills/fail-closed-intake/SKILL.md`), 5 modified
  (`agents/data-analyst.md`, `skills/semantic-model-query`, `skills/answer-qa`,
  `skills/mine-semantic-model/references/project-profile.md`, and `skills/value-briefing` as a documented
  roster-ripple fix).
- **Gates:** `skill-lint` exit 0 on the new skill; every plan-step acceptance grep hit; no runtime code /
  no unit surface (prose feature — F20 precedent).
- **Review:** done-check **PASS** (code-grounded, first try, **0 fix cycles**). The dispatched prose-angle
  review (two parallel finder passes, substituting for `/code-review` on a docs-only diff) folded 6 findings
  including 2 HIGH the developer caught and fixed in-round, and dismissed 2 with reason.
- **Reviews at plan time:** critic (code-grounded) REVISE → all 7 findings folded; `mine-from-spec` 33/36
  rules verified, 3 ambiguous → all resolved at plan level (`definition/spec-rules.md`).
- **Release:** nexus-analytics **MINOR** (new skill + new fail-closed capability); command regenerated;
  omni twin synced. See the commit.

## Deviations from Plan

- `value-briefing/SKILL.md` edited (not one of the plan's 5 named files) — a correct mechanical ripple of
  the Step-2 `skills:` frontmatter change (3→4 preloaded skills made its roster enumerations stale).
  Adjudicated **Deviated (valid reason)** at done-check; within the feature's blast radius.
- Same-file staleness fixes (agent `## Answer Contract` summary, "three→four sibling skills", two
  `description:` fields) and the Step-1 Flow-6/floor-destination completions — all within the plan steps'
  own `Satisfies:` scope; documented.

## Notes

- **Consuming-repo coupling (not a plugin gap):** F11's activation in a consuming repo (omnishelf-analytics)
  must land **with or before** that repo retiring its own interview rule — otherwise two interview owners
  run side by side (AM-lane open item #3). The plugin ships the behavior; the retirement is a product-repo
  work item.
- **KG lane downstream:** the model-carried declaration (per-measure `must_specify` flags) is KG's
  must-specify classification pass — out of scope here; F11 defines the shape it will emit and reads it when
  present. The interim profile bridge covers its absence.
