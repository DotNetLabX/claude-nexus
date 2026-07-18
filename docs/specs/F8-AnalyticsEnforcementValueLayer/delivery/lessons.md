# F8 W3 — Value Layer — Lessons

## Architect Lessons

- **A "free reuse" claim on a config/enum-bound tool must be checked against its hardcoded domain,
  not its CLI surface.** `validate-provenance.cs` had a `--file` flag that *looked* like generic
  reuse, but its grammar pass iterates 7 hardcoded bundle families and silently skips everything
  else (exit 0) — the plan's reuse claim and its "structurally rejects" contingency were both wrong,
  and only the code-grounded critic caught it (`:63`, `:70-72`). Worse than failing, the tool
  *passes vacuously* — the exact silent-gap shape the code-grounded mandate exists for. When a plan
  leans on reusing an existing validator/generator, read the loop that selects what it validates,
  not just its invocation.
- **A sibling skill's worked example is not copy-safe when the new skill carries a token-sweep
  gate.** mine-semantic-model's profile reference legitimately embeds KG tokens (`seed/db`, F38/F60)
  under its carve-out; value-briefing's sweep bans them with no carve-out. When a plan says "mirror
  skill X's reference," check X's example against the new skill's own negative gates and say
  explicitly what must NOT be carried over.
- **Concurrent-feature dirt lists go stale fast — cite the mitigation, not just the snapshot.** The
  F9 dirt list grew between plan-time and critic re-run (~4 → ~8 files). The load-bearing safety is
  the `--staged` scoping, not the enumerated list; the plan now names both.

## Developer Lessons

- **A value-model-only fixture has no *measured number* except the construct itself — so a demo
  built to show a "measured row" tempts you to promote a weight to measured, the exact mislabel the
  skill exists to prevent.** `value-briefing`'s whole discipline is measured (verified construct /
  probe evidence) vs estimated (weights, coefficients). The synthetic fixture pulls only a value
  model — no live probe number — so the only genuinely measured thing is a KPI's construct
  *resolving*. First draft labeled the KPI's value weight (1.3) "measured" because its construct
  resolved; a value weight is a business monetization judgment — always estimated. Fix: a resolving
  construct makes a row *measured-eligible* (its metric is measured); the weight and any
  coefficient-derived figure on that row stay estimated. Lesson: when a demonstration fixture must
  show a label whose evidence class its data source doesn't actually carry, don't bend the
  definition to fit the demo — attach the label to the one thing that does qualify (here, the
  construct/metric) and keep the rest honest.
- **A SKILL.md summary that enumerates a subset of a reference file's list silently narrows the
  guarantee.** The method step summarized "estimated" as "a value weight or coefficient," dropping
  the contract's third source (a displacement mapping) — and displacement is a first-class question
  type for this skill. An incomplete enumeration reads as authoritative. Lesson: when SKILL.md
  summarizes a definition owned by a `references/` file, make the summary *conceptual* ("anything
  derived from the value model's own inputs"), not a shorter list — one owner (AP3), and no
  narrowing by omission.

## Skill Gaps

None — the two `Skill: None` build steps are verification/demo steps and the runbooks are
external-repo by construction (expected, not gaps); pattern steps mapped to improve-skills,
evaluate-skill, release-plugin.
