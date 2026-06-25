# Spec-driven Harness Build — Questions

These are owner/scope decisions surfaced during Phase-1 analysis. Each is a genuine fork that
changes the plan (not a codebase fact I can look up). The full build graduates the GO'd spike
(`adhoc-SpecDrivenCoverDiff`) — the spike named three full-build conditions; the questions below
are the unresolved *approach/scope* choices inside those conditions.

---

## Q1: Retrieval-at-scale (rule→code location) — embedding search vs guided LLM-miner, and is it even in THIS build's scope?
**From:** architect
**To:** user
**Status:** Answered (user-confirmed 2026-06-25 via AskUserQuestion)
**Step:** Phase 1 analysis (the spike's full-build condition #1 — the #1 technical risk)
**File:** net-new `harness/spec-cover.workflow.js` (the rule→code-location phase)
**Answer:** **(B) guided LLM-miner behind a `locateRuleCode()` seam** (attestation-first; miner fallback → `file:line | NO-CODE-FOUND`); embedding index **deferred** (master-gate one-way door). Folded into spec D1 + plan Steps 1–2.

**Context:** The spike proved rule→code location *manually* (18/18 rules mapped by hand from the
golden-set's Code-attestation column). The spike result names this "the #1 technical risk for the
full build" and explicitly says retrieval at scale is **unproven** — two candidate mechanisms, neither
tested:
- **(A) Embedding search** over the codebase (the most direct; needs an embedding index — new infra,
  a real one-way-door commitment, and an external dependency the harness has never carried).
- **(B) A guided LLM-miner agent** given the rule text + the candidate file set, returning
  `file:line` or `NO-CODE-FOUND` (no new infra — reuses the `agent()` + schema pattern the harness
  already runs; cheaper to try, lower ceiling on a 50+-rule domain-wide sweep).

This is the single biggest design fork in the build. It is also the one place the master gate (ADR-25)
flags **high cost-of-being-wrong** (uncertainty × irreversibility): committing to an embedding-index
dependency is hard to walk back.

**Question:** For this build, do we (1) build retrieval with mechanism **A** (embedding), **B**
(guided miner), or **both behind a seam**; and (2) is retrieval-at-scale **in scope for this build**,
or does this build stay on the **manual/guided-miner small-N path** and defer the embedding-index
sweep to a later increment?

**Recommendation:** **Scope this build to mechanism (B) — the guided LLM-miner — behind a
`locateRuleCode()` seam, and explicitly DEFER the embedding-index sweep (A) to a later increment.**
The guided miner reuses the harness's proven `agent()`+schema+clean-room pattern with zero new infra,
returns the same `file:line | NO-CODE-FOUND` contract the manual map produced, and is provable on the
spike's two classes (12 + 6 rules) before any 50-rule claim. The seam keeps (A) a drop-in later without
re-architecting. Building an embedding index now is a one-way-door dependency commitment for a scale we
have not yet hit.
**Confidence:** medium — (B) is clearly the cheaper, more reversible first step and matches the
harness's existing shape; the residual uncertainty is whether (B) actually holds at 50+ rules (the
spike couldn't test that). If you want the build to *prove the scale answer*, that's a different, larger
appetite and pushes toward (A) — your call on appetite.

---

## Q2: Build appetite — single increment (spec front-end + diff, one class) or the full bidirectional shipped skill?
**From:** architect
**To:** user
**Status:** Answered (user-confirmed 2026-06-25 via AskUserQuestion)
**Step:** Phase 1 analysis (scope boundary — drives step count + split)
**Answer:** **(a) one increment** — spec front-end + 3-axis diff + FP-filter on one class, ~7 steps, `harness/` only, no plugin bump. Folded into spec D2 + plan (7 steps).

**Context:** The existing harness shipped in **increments** (1 Mine→Verify, 2 Cover, 3a loop
controller), each a runnable workflow + pure-helper libs + unit tests, living in `harness/` (dev-repo
machinery, no plugin bump). The spec-driven build's natural increment-1 is: **the spec front-end
workflow (`spec-cover.workflow.js`) + the diff helper (`lib/spec-diff.mjs`) + the false-positive
filter, proven on ONE class end-to-end (re-running the spike's SQL class through the automated path,
not by hand).** The full vision (bidirectional shipped skill, multi-class sweep, embedding retrieval,
automated spec-source extraction) is several increments.

The proposal's own Out-of-scope list excludes "productionizing the spec-driven direction as a shipped
skill (that is the post-spike build)" — but "post-spike build" could mean *this whole thing* or *the
next runnable increment*. That's the appetite question.

**Question:** Is this build (a) **one increment** — automate the spec-driven direction + diff +
FP-filter on one class end-to-end, matching how Cover/loop shipped; or (b) **the full bidirectional
shipped skill** (multi-class, retrieval-at-scale, automated extraction, graduated to
`plugins/nexus/skills/`)?

**Recommendation:** **(a) — one increment.** Automate the spec-driven front-end + 3-axis diff +
false-positive filter, proven on the spike's GeneratedSqlValidator class through the *automated* path
(the spike did it half-manually). This matches every prior harness increment, keeps the plan at ~6–8
steps, and turns the three full-build conditions into concrete, gated deliverables instead of an
open-ended "ship the skill." Multi-class sweep + embedding retrieval + automated spec-source extraction
become the *named next increments*, not this one.
**Confidence:** high — the harness's whole history is increment-shipped runnable workflows with unit
tests; a "ship the full skill" appetite would contradict ADR-23/the increment pattern and produce a
>15-step plan I'd have to split anyway. The one thing only you can set is whether you *want* a bigger
single bite this round.

---

## Q3: The false-positive filter — which of the three named mechanisms are IN this build, and is rule-isolation automated or operator-assisted?
**From:** architect
**To:** user
**Status:** Answered (user-confirmed 2026-06-25 via AskUserQuestion)
**Step:** Phase 1 analysis (the spike's full-build condition #2)
**File:** net-new `lib/spec-diff.mjs` / the FP-filter pass in `spec-cover.workflow.js`
**Answer:** **#3 automated as a deterministic violation-identity labeler** in `lib/spec-diff.mjs` (against the validator's fixed rule order — sharper than the spike's "re-run with rule disabled", which would need a prod change); **#1 (rule isolation) + #2 (fixture fidelity) = operator-assisted discipline + a `needs-triage` bucket**. Folded into spec D3 + §FP-labeler (5-case) + plan Step 5.

**Context:** The spike confirmed Direction-2 needs three filters (4/5 SQL reds were artifacts):
1. **Rule isolation** — inputs that trigger ONLY the rule under test. The spike flagged this as **hard
   under first-violation-wins** (an earlier rule fires before the rule under test; 2 of the 4 SQL
   artifacts were exactly this). Full automation may be undecidable in general; a *mechanical detector*
   (re-run with earlier rules disabled / input restructured, then re-classify) is tractable.
2. **Fixture fidelity** — all profiles/fixtures must match real runtime construction (the
   un-constructable `SurfaceProfile.Curated` artifact). This is a build-the-fixtures-faithfully
   discipline, not an algorithm.
3. **FP labeling** — rule-interaction reds are *predictable* (an earlier rule fired) and **detectable
   mechanically** (re-run with the earlier rule disabled; if the red flips, it was an interaction
   artifact, not a code bug). The spike calls this one out as the mechanizable one.

**Question:** Does this build implement (1) the mechanical **FP-labeling re-run** (#3) as the core
filter — the spike's named mechanizable piece — and treat rule-isolation (#1) + fixture-fidelity (#2)
as **operator-assisted discipline documented in the run report**; or do you want **automated
rule-isolation** (#1) attempted in this build too?

**Recommendation:** **Implement #3 (mechanical FP-labeling re-run) as the automated filter; treat #1
and #2 as documented operator discipline + a structured "needs-human-triage" bucket in the diff
output.** #3 is the piece the spike explicitly calls mechanizable and it directly kills the
rule-interaction artifacts (2/4 of the SQL false positives). Full automated rule-isolation under
first-violation-wins is a research problem; attempting it in this increment risks the whole build on the
hardest sub-problem. Every red the filter can't auto-label routes to a candidate-bug queue tagged
`needs-triage` (never deleted — ADR-D), exactly as the spike handled it.
**Confidence:** medium — #3 is clearly the right automated core and is well-scoped; the judgment you own
is whether "operator-assisted rule-isolation" is acceptable for this increment or whether you want the
harder automation attempted now (higher risk, larger scope → pushes toward Q2(b)).

---

## Q4: Spec-source extraction beyond PO golden rules — in this build, or named as the next increment?
**From:** architect
**To:** user
**Status:** Answered (user-confirmed 2026-06-25 via AskUserQuestion)
**Step:** Phase 1 analysis (the spike's full-build condition #3)
**Answer:** **(a) keep the PO-golden-rules input contract behind `loadSpecRules()`**; automated extraction (`seed/db/generation-rules/` + the validator's XML doc comments — both confirmed present in KG) is the **named next increment**. Folded into spec D4 + plan Step 1.

**Context:** The spike used the **PO-authored golden rules** as the only spec source and flagged the
constraint as real: if the PO hasn't authored rules, Direction-2 has no input. For KG, the spike named
three candidate structured sources for *automated* extraction — `seed/db/generation-rules/`,
`query-patterns.md`, and XML doc comments — but **did not exercise automated extraction** (the manual
golden set was available). The spike result lists "run the spec-source extraction step" as full-build
condition #3 but qualifies it "unproven but tractable."

**Question:** Does this build (a) **keep the PO-golden-rules input contract** (the proven spike path)
and *name* automated spec-source extraction as the next increment; or (b) **build automated extraction**
from one of the KG structured sources (e.g. `generation-rules/`) as part of this increment?

**Recommendation:** **(a) — keep the PO-golden-rules input contract for this build; name automated
spec-source extraction as the explicit next increment.** The golden-rules path is the *proven* one (the
spike ran on it end-to-end); the front-end's input contract should accept a rule-text source (golden
set today, extracted rules tomorrow) behind a `loadSpecRules()` seam, so automated extraction is a
drop-in source later. Building extraction now adds an unproven sub-pipeline on top of an already-net-new
direction — too many simultaneous unknowns for one increment.
**Confidence:** high — this is the consistent "one proven thing per increment, seam for the next"
pattern; the spike explicitly left extraction unexercised, so building it now means proving two new
things at once. The only reason to choose (b) is if KG has *no* current golden set and extraction is the
*only* way to get input — a fact I'd confirm before you decide (offer: I can check KG for an existing
golden set + the three named structured sources before you answer).

---

## Q5: Build target repo — sprint-rituals (the harness's home) or knowledge-gateway (the spike's target)?
**From:** architect
**To:** user
**Status:** Answered (user-confirmed 2026-06-25 via AskUserQuestion)
**Step:** Phase 1 analysis (which repo the end-to-end proof runs against)
**Answer:** **knowledge-gateway / `GeneratedSqlValidator`** (Q5a). Acceptance (Q5b): **reproduce the spike's L272 finding against pre-fix source — primary known-answer; live-source run secondary** (Q5b). Note corrected since drafting: the `+1e-9` fix is **uncommitted** in KG (no fix commit; HEAD still buggy), so the two AC-6 arms are HEAD vs HEAD+operator-patch. Folded into spec D5 + AC-6 + plan Step 7.

**Context:** The existing harness workflows default their target consts to **sprint-rituals**
(`D:\src\sprint-rituals` — BugRatio/CycleTime) and are parameterized via `_args` to retarget. The
**spike ran on knowledge-gateway** (`D:\src\knowledge-gateway` — GeneratedSqlValidator,
SlackSignatureVerifier), where the golden set + the FIXED L272 finding live. The spec-driven front-end's
end-to-end proof needs a class with **(a) a golden-rule spec source** and **(b) a known divergence**.
KG has both (the spike established them); sprint-rituals' golden set is recall-scoped (GOLD-16..18),
not the spec-driven divergence target.

**Question:** Run this build's end-to-end proof against **knowledge-gateway** (re-running the spike's
SQL class through the automated path) or **sprint-rituals** (a fresh class, no established divergence)?

**Recommendation:** **knowledge-gateway, GeneratedSqlValidator** — it is the spike's proven target,
carries the golden-rule spec source and the established (since-fixed) divergence, and lets the build
*reproduce the spike's manual finding through the automated path* (the cleanest possible end-to-end
acceptance: "the automated front-end finds what the manual spike found"). Note the L272 bug is **fixed
in live KG** (spike Q1) — so the automated proof either runs against experiment-time evidence or targets
a *different* still-divergent rule; I'll handle that in the plan's acceptance design.
**Confidence:** high — KG is the only target with both a spec source and an established divergence; a
fresh sprint-rituals class would have no known-answer to validate the automated direction against. The
fixed-L272 wrinkle is a plan-acceptance detail, not a target choice.
