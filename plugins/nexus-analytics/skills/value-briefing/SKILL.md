---
name: value-briefing
description: Produce a governed value/intelligence briefing over a consuming project's validated value model — answering worth, prioritization, monetization, and displacement questions with every number labeled measured vs estimated and every estimate carrying its guardrails. Explicit-invocation only — the default accuracy flows never load it; a human triggers it as /value-briefing for a deliberate intelligence task. Use when someone asks what something is worth, what to prioritize, or what a monetization/displacement opportunity would be — grounded in the project's value model, never improvised.
user-invocable: true
disable-model-invocation: true
---

# Value Briefing

## What this skill is

The single sanctioned reader of *value* content in agentic flows — the worth / prioritization /
monetization / displacement layer that sits ABOVE the accuracy layer. A briefing answers "what is
this worth", "what should we prioritize", "what would this monetization or displacement be worth",
grounded in the consuming project's **validated value model** — never improvised.

**Explicit invocation only.** This skill is invoked deliberately for an intelligence task. The
default accuracy flows — `semantic-model-query`, `data-investigation`, `answer-qa`,
`fail-closed-intake` — never load it;
`disable-model-invocation: true` removes it from Claude's automatic context and from subagent
preloading entirely, so a default flow structurally cannot auto-load it. A human triggers it as
`/value-briefing`.

**The split it protects.** The accuracy layer answers *what is true* from the semantic model; it
carries no value content and no measured-vs-estimated labeling. This skill is the ONLY home of
value content and that labeling. Value content never flows back into the accuracy surface. The
accuracy-side `value-ledger` skill does not cross this line: it registers *claims and their
validation state* (an estimate must re-execute and hold before it counts as measured), never worth,
prioritization, or measured-vs-estimated *value* labeling — deciding what a validated claim is worth
stays this skill's monopoly.

## Phase 0 — Resolve the project profile (hard precondition)

Read the consuming project's committed `docs/value-model/profile.md` — the four project-specific
inputs this skill needs (see `references/project-profile.md` for the contract and a complete
synthetic worked example). If it exists, load it and proceed.

If it is missing, run the first-run intake: ONE batched message asking for the four profile inputs,
each with its proposed default where one exists. Write the answered profile to
`docs/value-model/profile.md`, then proceed.

**A missing profile is never silently defaulted** — a briefing never runs against assumed paths.
(Same discipline as `mine-semantic-model`'s Phase 0.)

## What it loads

Per the resolved profile:

1. **The value model** — the validated value-model artifact(s) at the profile's path (input 1).
   The sole required input.
2. **Cited KB sources, where reachable** — enrichment, not a hard dependency. The value model's
   provenance rows carry their citations inline, so a briefing runs on the embedded provenance
   alone. Where a cited source *is* reachable (profile input 4's search order), read it for context.
3. **Open model-feedback ledger entries, where a ledger exists** — profile input 3, **optional**.
   A consuming project may host no ledger (the empty case is legitimate, not an error); where it
   does, load that area's open entries as additional context.

**Unreachable source — run and DISCLOSE.** Where a cited KB source file is not locally reachable
(a project that pulls only the value model, say), the briefing runs on the embedded provenance and
**discloses which sources were unavailable**. A silently-dropped unreachable source is a malformed
briefing.

## Producing the briefing

1. **Resolve the question to value-model rows.** Map the intelligence question (worth /
   prioritization / monetization / displacement) to the value-model rows that answer it — KPI rows
   (pool, value weight, displacement mapping where sourced) and/or the coefficient-register rows.
2. **Classify every number measured vs estimated** as you draft, per the label rules in
   `references/briefing-contract.md` (§1 — the single owner of the definitions): *measured* = a
   semantic-model-verified construct value or direct probe evidence; *estimated* = anything derived
   from the value model's own inputs (a value weight, a coefficient, a displacement mapping) — even
   on a row whose construct resolves. When in doubt, it is estimated.
3. **Guard every estimate.** Name the coefficient-register row it derives from; declare — alongside
   the estimate, never in a distant footnote — the confounds that row carries (the threats to that
   estimate); check it against the row's dimensional-plausibility bound BEFORE emitting. A number
   that violates the bound is refused or flagged — never emitted as a plain number.
4. **Run the mandatory `## Briefing QA` self-check** (`references/briefing-contract.md`) as the
   final pass before the briefing ships. A briefing that fails it is malformed and does not ship —
   fix the gap first.

## Obligations (each names its enforcer)

| Rule | Enforced by |
|---|---|
| Explicit invocation only; default accuracy flows never load it | `disable-model-invocation: true` frontmatter (out of automatic + subagent-preload context) |
| Profile is a hard precondition, never silently defaulted | Phase 0 intake gate above |
| Every number labeled measured vs estimated | the `## Briefing QA` final pass (briefing-contract.md) |
| Every estimate names its coefficient source and declares its confounds | briefing-contract.md output contract + `## Briefing QA` |
| A dimensional-plausibility violation is refused/flagged, never a bare number | in-method guard (Producing step 3) + `## Briefing QA` |
| Unreachable cited sources disclosed | the load step above + `## Briefing QA` |
| Shipped skill carries no project-specific paths | profile indirection — every project value comes from `docs/value-model/profile.md` |

## What this skill does NOT do

- **Touch the accuracy layer.** It never edits, and is never loaded by, `semantic-model-query`,
  `data-investigation`, `answer-qa`, or `fail-closed-intake`; measured-vs-estimated labeling lives
  only here.
- **Author or validate the value model.** The value model is created and validated by a governed
  run in the project that owns it; this skill only *reads* it.
- **Emit an unlabeled or unguarded number.** A bare number, an estimate without its coefficient
  source or confounds, or an implausible number stated as fact is a malformed briefing.
- **Improvise value content.** Everything it says traces to a value-model row and its provenance; a
  question the value model cannot ground is answered "not in the value model," never guessed.

Discovered a defect while running this skill (a missing contract obligation, an unhandled input
shape)? Log it — inside the SDD pipeline, append to that feature's
`docs/specs/{slug}/delivery/lessons.md` under `## Developer Lessons` or `## Skill Gaps`; running
standalone, note it for the project's own lessons flow. Never silently work around a gap.

**Consumed by:** the human or agent that explicitly invokes it — the briefing is presented directly,
not persisted as an artifact other tooling reads.

## References

- `references/project-profile.md` — the four-input profile contract + a complete synthetic worked
  example.
- `references/briefing-contract.md` — the output contract: measured-vs-estimated labeling, the
  guardrail rules, and the mandatory `## Briefing QA` self-check.
- `references/worked-example.md` — a synthetic value model (the fixture) and a briefing produced
  over it.
