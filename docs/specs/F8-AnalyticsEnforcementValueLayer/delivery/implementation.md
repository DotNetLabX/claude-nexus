# F8 W3 — Value Layer — Implementation

Scope: Steps 1–4 and Step 6 (architect-led fast lane, developer subagent). Step 5 (release/bump/
commit) is the main session's close step; Steps 7–8 are operator-owed external-repo runbooks. No git
writes performed in this round (hard rule — commit happens at lane close in the main session).

## Files Created

- `plugins/nexus-analytics/skills/value-briefing/SKILL.md` — the gated `value-briefing` skill:
  the sole sanctioned reader of value content, explicit-invocation-only, with the Phase-0 profile
  precondition, the load rules (value model + optional KB + optional ledger, unreachable-source
  disclosure), the produce-briefing method (measured/estimated labeling + estimate guards), an
  obligations table (each rule names its enforcer), and a scope fence.
- `plugins/nexus-analytics/skills/value-briefing/references/project-profile.md` — the four-input
  profile contract (value-model path; semantic-model bundle root; optional ledger; optional
  KB-source order) + a fully synthetic worked-example profile.
- `plugins/nexus-analytics/skills/value-briefing/references/briefing-contract.md` — the output
  contract: measured-vs-estimated labeling, the coefficient-source + confounds rule, the
  dimensional-plausibility guard, unreachable-source disclosure, and the mandatory `## Briefing QA`
  self-check.
- `plugins/nexus-analytics/skills/value-briefing/references/worked-example.md` — Step 2's synthetic
  fixture: a small value model exercising a measured row, an estimated row, one `unmapped: true`
  row, one coefficient with both guardrail classes, and one unreachable/disclosed cited source, plus
  a briefing produced over it and its must-fail counterpart.

## Files Modified

- `docs/specs/F8-AnalyticsEnforcementValueLayer/definition/tech-spec.md` — Step 6, two exact-text
  appends (verbatim from plan Step 6.1/6.2): under `## W3`, the plan pointer
  (`Plan: ../delivery/plan.md (2026-07-18) — W3 planned. W1 remains gated.`); under `## W1`, the
  validator coordination marker (net-new KG-local `validate-value-model.cs`; W1 decides adopt/ignore
  at its gate; does not pre-empt the F7-S0-shared delivery-mechanism decision). Step 6.3 (the W3
  spec header `**Plan:**` line) was already present — architect-authored at plan approval — so it
  was not touched.
- `docs/specs/F8-AnalyticsEnforcementValueLayer/delivery/lessons.md` — appended the `## Developer
  Lessons` section (see that file); other sections untouched.

## Key Decisions

- **Archetype = light/conversational skill** (single `SKILL.md` + a `references/` folder), not a
  heavy mine pipeline — it is judgment-driven, single-turn, no subagents. Mirrors `answer-qa`'s
  prose-contract shape; `mine-semantic-model` was the reference only for the Phase-0 profile
  precondition, not the five-phase machinery.
- **No project-origin carve-out** (Decision D5, stricter than `mine-semantic-model`): the shipped
  surface carries zero KG/omnishelf/VWH tokens. Unlike `mine-semantic-model` (which is allowed one
  origin section + baseline feature id), `value-briefing` names no real project anywhere; the
  worked example is fully synthetic (fictional KPI/coefficient/SAP tokens).
- **`briefing-contract.md §1` is the single owner** of the measured/estimated definitions; the
  SKILL.md method step gives a conceptual summary and defers to §1 (AP3 — one fact, one owner).
- **evaluate-skill findings recorded in this file**, not a standalone `docs/skill-evals/…` doc —
  see Deviations (scope + dev-repo carve-out reason).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | `improve-skills` | Followed for shipped-skill authoring (dev-repo carve-out: authored directly in `plugins/nexus-analytics/skills/`, not routed to a feedback file). Grounded design against its `references/skill-recipe.md` (archetype + element menu + frontmatter cheat-sheet) and `references/proven-patterns.md` (P1/P5/P6; AP1–AP7). Lint = the form done-condition (Layer 0), exit 0. |
| 2 | None | Demo/verification step (plan: Skill None). The synthetic fixture lives in `references/worked-example.md`; the three AC-4 demos are recorded verbatim below. |
| 3 | `evaluate-skill` | Judgment gate on the new skill after lint exited 0 (mandatory for new skills, owner decision 2026-06-20). Ran the rubric Layers 1–4 + overlays; two LOW findings folded, then re-lint. Findings + verdict below. |
| 4 | None | Verification step (acceptance greps — AC-7 negative, token sweep, real-data leak scan). |
| 5 | Deferred to main | Release/bump/commit is the main session's close step per the fast-lane commit protocol (see Deviations). |
| 6 | None | Doc bookkeeping — two exact-text appends to tech-spec (plan Step 6.1/6.2). |
| — | `implementation-format` | Invoked to format this file. |

## Step 2 — recorded demos (AC-4 build-time evidence)

All three run over the synthetic fixture in `references/worked-example.md`. Real VWH values never
enter the shipped plugin (Decision D5); these demonstrate the method, not real engagement data.

**(a) Sample briefing — every number labeled (SR-57).** Question: *"Where should we focus, and what
would closing the availability gap be worth?"*

> **Focus.** Shelf availability (KPI-202, pool B) maps to a semantic-model-verified construct
> (`measureId: m_availability` resolves against the bundle) — so the availability metric itself is
> **measured**. Its value weight (1.3, revised up from 1.0 per demo note DN-1) is a business
> monetization weight, so it is **estimated**, not measured — and it is the highest among the mapped
> KPIs, which is why availability is the priority.
> **What closing the gap is worth — estimated.** Using out-of-stock elasticity **EC-1** (estimated,
> coefficient-derived), a 1-percentage-point availability improvement maps to a *fraction of a
> percent* of category revenue — kept within EC-1's dimensional-plausibility bound, not multiplied
> into a headline figure. Confounds that threaten this estimate (from EC-1): phantom inventory,
> substitution, promo, seasonality.
> **Promo uplift (KPI-203) — estimated, unmapped.** Its value weight (0.8, estimated) is carried,
> but the KPI has no semantic-model construct (`unmapped: true`), so nothing here is measured —
> directional only.
> **Sources unavailable at briefing time:** `docs/kb/value-notes/oos-elasticity.md` (EC-1's cited
> study) could not be read locally; EC-1's use rests on the value model's embedded provenance.
> **## Briefing QA** — every number labeled (metric measured; weight + elasticity estimated); EC-1
> named + four confounds declared; plausibility bound respected; unreachable source disclosed.
> Well-formed — ships.

**(b) Implausibility probe — refused/flagged, never a bare number (SR-58, must-fail demo).** Ask:
*"So a 1pp OOS reduction is 20% of category revenue?"*

> **Refused.** That violates EC-1's dimensional-plausibility bound — a 1pp OOS reduction is worth
> *fractions of a percent* of category revenue, never a double-digit percent. I will not emit "20%"
> as a plain number. The defensible figure is a fraction of a percent (**estimated**, coefficient
> EC-1; confounds: phantom inventory, substitution, promo, seasonality). A precise number would have
> to come from **measured** probe evidence, not this coefficient.

This is the hard demonstration of the `## Briefing QA` pass: a briefing that emitted a bare "20%"
would fail its line 3 (dimensional-plausibility) and not ship.

**(c) Unavailable-source disclosure (SR-67).** With `docs/kb/value-notes/oos-elasticity.md` not
locally reachable, the briefing runs on embedded provenance and discloses:

> **Sources unavailable at briefing time:** `docs/kb/value-notes/oos-elasticity.md` (EC-1's cited
> elasticity study) was not locally reachable; EC-1 above rests on the value model's embedded
> provenance (origin `kb(demo-elasticity-study)`, verified 2026-01-10).

## Acceptance (Step 4 — greps executed post-build)

| Check | Pattern | Scope | Result |
|-------|---------|-------|--------|
| Step 4.1 AC-7 negative (SR-62/63) | `(?i)value\|estimate\|measured\|briefing` | 3 accuracy skill dirs | **0** on all three (each is a lone SKILL.md; build touched none) |
| Step 4.2 token sweep (SR-41) | `(?i)knowledge-gateway\|kg_\|seed/db\|fmcg_platform\|omniaz\|omnishelf\|laurentiu\|F52\|F60\|F38\|MSM_PROBE_DSN` | new skill dir | **0** |
| Step 4.3 real-data leak | `(?i)labor_yield\|S00[1-7]` | new skill dir | **0** |
| Step 3 Layer-0 lint | `skill-lint.mjs` | new skill dir | **OK, exit 0** |

## evaluate-skill — findings + verdict (Step 3 judgment gate)

Scope: text evaluation of the four new files (no run history — brand-new skill; the Step 2 fixture
demos are the closest ground truth). Channel: shipped skill under the dev-repo carve-out — findings
folded directly, not routed to a feedback file. Verdict: **fix-then-ACCEPT** — no Critical/High; two
LOW findings folded, then re-lint (exit 0).

- **F1 (LOW, Layer 2/AP3):** measured/estimated definition was restated in both SKILL.md and
  briefing-contract.md — drift risk. **Folded:** SKILL.md now gives a conceptual summary and cedes
  ownership to `briefing-contract.md §1`.
- **F2 (LOW, Layer 1.5):** no `Consumed by` line (estate parity with `answer-qa`). **Folded:** added
  a `Consumed by` line (the human/agent that explicitly invokes it; the briefing is not a persisted
  artifact).
- **Checked clean:** Layer 1.1 (frontmatter promise = body); 1.2 (guardrail mechanisms —
  `disable-model-invocation: true` backs explicit-invocation; profile precondition backs
  parameterization; the `## Briefing QA` pass is the named executor, not a dead letter — AP1);
  1.3 (no external-system claims); 1.4 (sibling-skill citations verified); 1.5 scope fence present;
  1.6 failure modes encoded in the QA checklist. Layer 2.3 right weight (light). Layer 3 overlays
  n/a (no external write, no subagents, no unbounded iteration, single-turn). Layer 4.1 lessons
  capture present.

## Self-Review

**Verdict: PASS — ship-ready for Step 1 done-check.** Diff is docs/skill-prose only; reviewed with
prose angles via two parallel `general-purpose` finder passes over the new skill dir + the tech-spec
edits, each finding then verified in-context by me. Evidence below.

**Pass A** (SKILL.md + briefing-contract.md; SR-obligation fidelity, cross-refs, directional refs):
- **A1 (real, LOW) — folded.** SKILL.md's inline `estimated` summary dropped "displacement mapping"
  (a silent narrowing vs contract §1, which lists three estimated sources). Fixed: the summary is now
  conceptual ("anything derived from the value model's own inputs … a value weight, a coefficient, a
  displacement mapping") — no longer an incomplete enumeration.
- **A2 (real, LOW) — folded.** SR-39's "co-located, never a distant footnote" cue lived only in the
  contract, not the SKILL.md method step. Fixed: SKILL.md Producing step 3 now says "declare —
  alongside the estimate, never in a distant footnote — the confounds".
- Clean: dangling cross-references (all `references/*` + four sibling skills exist and say what
  they're cited as); SR-37/38/66/67/32/33/34 all present and unweakened; directional
  references (profile inputs 1–4, "§1") verified against final layout; no stale adjacent sentences.

**Pass B** (project-profile.md + worked-example.md + tech-spec edits; synthetic-only, consistency):
- **B1 (real, substantive) — folded.** The fixture labeled KPI-202's value weight `1.3` "measured"
  because its construct resolves — but a value weight is an *estimated* source per contract §1 (and
  per SR-37: measured = verified constructs/probe evidence, never a business weight). Left as-is the
  AC-4 evidence fixture would teach the wrong labeling. **Fixed across both surfaces (AP2):**
  (1) briefing-contract §1 now states a resolving construct makes a row *measured-eligible* — its
  metric is measured, but its value weight / coefficient outputs stay estimated; (2) the
  worked-example briefing labels the availability *metric* measured and the *weight 1.3* estimated,
  and its `## Briefing QA` line updated to match.
- **B token note (dismissed — false positive):** `m_units_sold`/`m_availability` are generic
  illustrative measure names, not real project construct ids, not on the ban list; the token sweep
  is clean (0 hits). No change.
- Clean: full banned-substring sweep = 0; every fixture shape present (measured / estimated /
  `unmapped` / a coefficient with both guardrail classes / a disclosed unreachable source); profile
  4-input numbering matches SKILL.md's back-references; both tech-spec appends match plan Step 6.1/
  6.2 character-for-character and landed in the correct sections; no stale neighbor sentences.

Post-fold re-verification: lint OK (exit 0); Step 4.1/4.2/4.3 greps all 0; the two folds that
touched SKILL.md/contract/worked-example re-swept clean.

## Deviations from Plan

- **Step 5 (release/bump/commit): Deviated (valid reason) — deferred to lane close per fast-lane
  commit protocol.** The `--staged`-scoped MINOR bump to nexus-analytics 0.3.0, CHANGELOG entry,
  repo-lint run, commit, and omni-twin sync are the main session's close step; this developer round
  performed no git writes of any kind.
- **Steps 7–8 (Runbook A KG governed run; Runbook B product-repo sync): N/A — operator-owed by
  construction.** Cross-repo boundary — a nexus developer never edits KG / the product repo / the OD
  hub. Their verifiable output is the runbooks' presence in `plan.md`. No `D:\src\knowledge-gateway`
  or product-repo files were touched (read-only context reads only).
- **evaluate-skill findings recorded in this implementation.md, not a standalone
  `docs/skill-evals/{date}-value-briefing.md`.** Reason: under the dev-repo carve-out the findings
  fold directly into the skill (no feedback-file routing), and the dispatch's write-set is
  feature-scoped; adding a new top-level `docs/skill-evals/` path mid-concurrent-run would introduce
  an artifact outside this feature's `delivery/` dir. The durable record lives here (evaluate-skill
  section above) — the pipeline's own record.

*Status: COMPLETE — developer, 2026-07-18*
