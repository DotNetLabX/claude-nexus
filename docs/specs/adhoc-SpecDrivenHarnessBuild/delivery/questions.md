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

---

## Q6: Which golden IDs go in `harness/targets/generatedsqlvalidator.json` — all GOLD-01..12, or only the Rule-5/L272 slice the AC-6 known-answer needs?
**From:** developer
**To:** architect
**Status:** Answered (architect, 2026-06-25)
**Step:** Step 1 — Target config + `loadSpecRules()` seam
**File:** `harness/targets/generatedsqlvalidator.json` (net-new)

**Context:** Step 1 says the target config carries "the **golden ids only**" (mirrors
`bugratio.json`, which lists `GOLD-16..18` — a *3-id subset*, not the full set). The live golden set
(`D:\src\knowledge-gateway\docs\audit\golden-set.md`, verified) defines **GOLD-01..12** for
`GeneratedSqlValidator`, each with a `Code attestation` column (`file:line`) that maps directly to
Step 1's `codeAttestation?` schema field. But the plan never states **which** of the 12 go in the
config. Two readings:
- **(A) All 12** — the spec-load agent returns all 12 structured rules; the front-end Covers/diffs the
  full rule set; AC-4's "every rule classifies into exactly one axis" runs over 12. This is the truest
  "spec-driven direction on this class" and exercises the diff most fully.
- **(B) The Rule-5 slice only** (GOLD-08 + the interaction rules GOLD-05/06/09 that the AC-6 fixture
  must keep silent) — minimal config that proves the L272 known-answer (AC-6) and the 5-case labeler
  (AC-5) without authoring 12 rules' worth of fixtures.

**Question:** Does the target config carry **all GOLD-01..12** (full-class spec-driven run, A), or a
**curated Rule-5-centric subset** (minimal known-answer proof, B)?

**Recommendation:** **(A) all GOLD-01..12.** The spec's AC-4 ("classifies **every** rule into exactly
one axis") and AC-1 ("drives the existing Cover engine with the spec-rule input shape") read as the
*whole* class's golden set, not a slice — and `bugratio.json`'s 3-id list is small only because that
class's golden set *is* 3 ids (GOLD-16..18), not because it sub-selects. The full set is what makes the
3-axis diff a real deliverable rather than a single-rule demo; the AC-6 known-answer is then *one
asserted rule within* the full run (GOLD-08 → case-4), which is exactly how the spike produced it
(107 tests over GOLD-01..12, 5 red, 1 real). Subsetting to (B) would make AC-4 vacuous and diverge from
the spike's proven path.
**Confidence:** high — the spike ran the full GOLD-01..12 set and AC-4's "every rule" language is
explicit; (B) only makes sense if the appetite is "smallest possible known-answer proof," which
contradicts the diff-is-the-deliverable framing (ADR-B). Flagging it because the plan's literal "golden
ids only" sentence is about *text-exclusion*, not *which ids*, leaving the count genuinely unstated.

### Answer (architect, 2026-06-25)
**(A) — all GOLD-01..12.** Your recommendation is correct and I verified the load-bearing facts against
source:
- **Live golden-set confirmed:** `D:\src\knowledge-gateway\docs\audit\golden-set.md:31,36,76` defines
  exactly **GOLD-01 … GOLD-12** for `GeneratedSqlValidator` (12 rules, denominator stated as
  "GeneratedSqlValidator = 12 (GOLD-01..12)"), each with a `file:line` Code-attestation column that maps
  to Step 1's `codeAttestation?` field.
- **Precedent confirmed:** `harness/targets/bugratio.json` carries `"goldenIds": ["GOLD-16","GOLD-17",
  "GOLD-18"]` — and that **is** BugRatioAnalyzer's *whole* golden set (the golden-set file shows
  Slack/BugRatio split GOLD-13..18), so the 3-id list is the full class set, not a sub-selection. (A) is
  the faithful mirror of that precedent: list the class's whole golden set.
- **AC alignment:** AC-4 ("classifies **every** rule into exactly one axis") + AC-1 (drives the engine
  with the spec-rule input shape) read as the whole class. (B) would make AC-4 vacuous and diverge from
  the spike's proven 12-rule path. The AC-6 known-answer is then **one asserted rule within** the full
  run, exactly as the spike produced it.

**Two binding refinements (fold into Step 1 — done below):**
1. **The IDs do NOT positionally map to the validator's 7-rule order — do not assume `GOLD-0n` = `Rule n`.**
   The L272 / `NoStrayLiteralThreshold` stray-literal rule (Rule **5** of 7 in `Validate`'s fixed order)
   is **GOLD-08**, not GOLD-05 (GOLD-05 is `RelationPolicy` = Rule 2). The 12 golden IDs are a *rule
   catalog* for the class; the 7-element `ruleOrder` constant (Step 5) is the validator's *positional
   firing order*. They are two different lists — key the AC-6 fixture and the labeler off the **rule
   name / `ruleOrder`**, never off the GOLD-id ordinal. This is exactly why (B)'s "Rule-5 slice" framing
   was unsafe: there is no clean GOLD-id slice that isolates Rule 5.
2. **The config `_note` mirrors `bugratio.json`'s sequestration note** — golden **IDs only, never rule
   text**; the golden text stays sequestered in `…\docs\audit\golden-set.md`, read only by the Step-1
   `spec-load` agent (ADR-C placement layer). The config is safe to hand to the clean-room run.

This changes plan Step 1 (clarification, not a scope change): folded below. No user decision is touched —
D2's one-increment scope is unchanged (one class, its full golden set). Step 7's two-arm AC-6 run needs live .NET + Stryker execution against KG — does the developer EXECUTE both arms, or wire the harness and hand the live run to the operator?
**From:** developer
**To:** architect
**Status:** Answered (architect, 2026-06-25)
**Step:** Step 7 — End-to-end known-answer reproduction + the operator patch
**File:** `harness/spec-cover.workflow.js` (the runnable front-end) + KG working tree

**Context:** Step 7's acceptance is *behavioral* — "pre-fix run reproduces the L272 finding in the
candidate-bug queue with `actual === "NoStrayLiteralThreshold"`." Producing that requires the runner
`agent()` to execute `dotnet test` + `dotnet stryker` against KG's `GeneratedSqlValidator` in an
isolated assembly, on **two git arms** (HEAD's `> 0.01`, then HEAD+operator-patch's `> 0.01 + 1e-9`).
I verified the KG state: HEAD line 272 is `> 0.01` (committed), the working tree is **already dirty
with `+ 1e-9`** (` M` status, no fix commit) — the dirty-tree hazard the plan calls out. The plan
correctly marks the git stash/restore dance `OPERATOR ACTION REQUIRED`, **and I must not do git writes
in KG** (boundary rule: no `git stash`/`checkout`/`reset`). So the live two-arm run is operator-gated by
construction. What the plan does **not** say is whether Step 7's *developer deliverable* is:
- **(A) Wire-and-handoff** — I build the runnable `spec-cover.workflow.js` + the pinned L272 fixture +
  the unit-test assertions (AC-5/AC-6 *unit* level, which run offline via `node --test`), and document
  the two-arm live run as `OPERATOR ACTION REQUIRED` with exact commands. The live behavioral
  reproduction is the operator's to execute (matches how `cover.workflow.js` defers the live Stryker run
  + the `readProdSourceDiffPlaceholder` operator seam). "Done" = harness runnable + offline unit proof +
  operator runbook.
- **(B) Developer-executes** — I run both arms myself (live .NET + Stryker + the git arm-switching).
  This needs the operator to neutralize/restore KG's dirty tree for me (I can't), a working .NET 10
  toolchain, and a Stryker run per arm — none of which I can self-serve under the no-git-writes boundary.

**Question:** Is Step 7's developer deliverable **(A) wire-the-harness + offline unit proof + an
`OPERATOR ACTION REQUIRED` runbook for the live two-arm run**, or **(B) execute both live arms myself**
(requiring an operator to stage the KG tree per arm first)?

**Recommendation:** **(A) wire-and-handoff.** Every prior harness increment defers the live .NET/Stryker
run to an operator seam (`cover.workflow.js`'s `readProdSourceDiffPlaceholder`, the runner agent's live
`dotnet` calls, runs landing in git-ignored `.runs/`), and the two-arm AC-6 run *inherently* needs a
KG-tree git write I'm barred from doing. So the developer-side "done" is: the runnable
`spec-cover.workflow.js`, the pinned-fixture + 5-case labeler + diff unit tests passing offline
(`node --test tests/unit/spec-diff.test.mjs` — the AC-5/AC-7 gate, fully in my control), and Step 7's
two-arm live reproduction written as an `OPERATOR ACTION REQUIRED` runbook with the exact stash/restore
commands the plan already drafts. The behavioral L272 reproduction is then the operator's confirming
run, recorded in implementation.md when executed.
**Confidence:** high — the no-git-writes boundary + the dirty-tree hazard make (B) physically impossible
for me to complete unaided, and the whole harness lineage treats the live toolchain run as operator-owed.
The only thing the architect owns here is confirming that an offline-unit-proof + operator-runbook
*satisfies* Step 7's acceptance for the developer phase (so the Step-1 done-check doesn't read the
absent live run as an incomplete step).

### Answer (architect, 2026-06-25)
**(A) — wire-and-handoff. Confirmed: an offline-unit-proof + the `OPERATOR ACTION REQUIRED` runbook
satisfies Step 7's developer-phase deliverable, and the Step-1 done-check will NOT read the absent live
two-arm run as a Missing step.** Your reasoning is correct and consistent with the plan's own grounding:

- **The plan already sanctions the operator seam.** The Guardrails section and Step 7 both mark the
  two-arm git stash/restore dance `OPERATOR ACTION REQUIRED`, and the harness lineage defers every live
  .NET/Stryker run to an operator seam (`cover.workflow.js`'s `readProdSourceDiffPlaceholder`, runs
  landing in git-ignored `harness/.runs/`). A plan-sanctioned operator fallback that fires is
  **`Deviated (valid reason)`** at done-check, not Missing (architect operator-owed-fallback rule) — the
  live behavioral reproduction being operator-executed is pre-authorized, not a gap.
- **The no-git-writes boundary makes (B) infeasible by construction.** AC-6's two arms *require* a KG
  working-tree git write (stash the dirty `+1e-9` for the pre-fix arm, restore for the patched arm). You
  are correctly barred from `git stash`/`checkout`/`reset` in KG. (B) is therefore physically blocked,
  not a scope choice — (A) is the only deliverable shape the boundary permits.

**Developer-phase "done" for Step 7 is exactly:**
1. The runnable `harness/spec-cover.workflow.js` (Steps 1–6 wired through it).
2. The **pinned L272 fixture** (Step 7's "only Rule 5 can fire" SQL — pre-computed stats table, schema-
   qualified `public.*`, literal exactly at tolerance) committed nexus-side.
3. The offline unit gate **green and self-served**: `node --test tests/unit/spec-diff.test.mjs` passing —
   this is the AC-5 (5-case labeler incl. case 4) + AC-4 + AC-7 proof fully in your control, and it is the
   load-bearing developer evidence the done-check scores.
4. The **two-arm live reproduction written as an `OPERATOR ACTION REQUIRED` runbook** in
   implementation.md with the exact stash/restore commands Step 7 already drafts (pre-fix arm:
   `git -C D:\src\knowledge-gateway stash push -- <validator>`; patched arm: `git ... stash pop`),
   plus the expected pre-fix assertion (`actual === "NoStrayLiteralThreshold"` in the candidate-bug queue)
   and the patched-arm assertion (the `|0.86 - 0.85|` test green) so the operator's confirming run has a
   precise pass/fail target.

**Done-check disposition I will apply (so there's no ambiguity at Step 1):** Step 7's **offline** sub-parts
(1–3) must be **Implemented**; the **live two-arm run** (4) is **Deviated (valid reason: operator-owed,
plan-sanctioned, no-git-writes boundary)** — recorded with the runbook present and the open production
gate surfaced as operator-owed in implementation.md. The live behavioral L272 reproduction is recorded in
implementation.md **when the operator executes it**, not a blocker for the developer phase closing. A
*missing* runbook (or a stub fixture that doesn't actually pin Rule 5) **would** be Missing — the seam is
sanctioned, the deliverable for it is not optional.

No user decision touched — D5 (KG target + known-answer acceptance) and the AC-6 two-arm definition are
unchanged; this only confirms *who executes which arm*, which the plan left implicit. No plan content change
needed for Q7 (Step 7 already carries the runbook + `OPERATOR ACTION REQUIRED` markers); I'm only
confirming the done-check disposition above.

---

## Q8 (non-blocking, FYI): The run report (Step 6) and candidate-bug queue have no named output path.
**From:** developer
**To:** architect
**Status:** Open
**Step:** Step 6 — Run report
**File:** `harness/spec-cover.workflow.js`

**Context:** Step 6 says the orchestrator writes "a self-contained run report" (the
`loop.workflow.js:647-719` pattern) with the 3-axis diff + candidate-bug queue + needs-triage bucket,
but names no target path. `loop.workflow.js` writes to a `REPORT_PATH` const and runner artifacts land
in git-ignored `harness/.runs/` (verified git-ignored). Not a blocker — I'll follow the established
convention (report nexus-side under `harness/.runs/` or a sibling, never in the KG tree, mirroring
`cover.workflow.js:261-264`). Flagging only so the path choice is visible to the done-check.

**Recommendation:** Write the run report to `harness/.runs/spec-cover-generatedsqlvalidator.md` (or
`.json` + a rendered `.md`), git-ignored, nexus-side — mirroring `cover.workflow.js`'s `RUNS_DIR`
discipline so nothing strands in the KG working tree.
**Confidence:** high — this is the established harness convention; no architectural choice, just making
the unstated path explicit. Will proceed on this default unless the architect redirects.
