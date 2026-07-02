# SDD Golden-Set Lifecycle — Questions

## Q1: The AC-6 gate — how much to build now, given the parent pilot's live verdict is still pending

**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis (pre-plan)
**File:** docs/specs/adhoc-SddLifecycle/definition/tech-spec.md

**Context:**
The tech-spec is `Status: Ready`, but it explicitly and repeatedly gates *implementation* on the parent
pilot's **AC-6** verdict:
- Header: "Implementation remains gated on the parent pilot's AC-6 verdict."
- Depends-on: "a pilot NO-GO invalidates **M1/M3 as designed** (M2's *arm* stands regardless)."
- Implementation vehicle: "the skill fold-in (`adhoc-SddCoverageLoop` roadmap step 4). Nothing here ships
  independently."

I verified AC-6 is **genuinely pending**: parent `summary.md` line 31 — "AC-6 (the pilot's real proof) lands
only when the operator runs the two-arm live pilot"; parent Steps 6/8/9 are operator-owed and **never run**
(no `harness/.runs/` pilot evidence, no `pilot-bugratio.md`). So the spec's own precondition for implementing
M1/M3 is **not met**.

Two facts sharpen the stakes:
1. **This fold-in is the first thing in this lineage to touch `plugins/**`.** The parent shipped nothing to
   users (dev-repo `harness/` only, no bump). This pass ships **skill text** (into `mine-verify-cover`) +
   **agent drift rules** (solo/architect/developer) → a **plugin bump + omni-twin regen + up to 8 ADR
   promotions** (parent ADR-A..D + this spec's ADR-E..H). That is a **user-facing, hard-to-retract** ship.
2. The feature **decomposes cleanly along the gate**:
   - **Ungated (safe regardless of AC-6):** M2 refactor-safety framing (ADR-G: suite-green + floor re-clear
     across a refactor, kill-rate delta *advisory only*) + M0 naming + the AC-L6 drift rules (ADR-H) as a
     **dormant** conditional. Verified net-new: no shipped agent file carries an attestation check today; the
     `mine-verify-cover` skill + `-dotnet` adapter carry no lifecycle/spec-arm/attestation content.
   - **Gated (a pilot NO-GO invalidates the design):** C1 registry, C2 attestation, C3 merged set, C4 triage,
     **M1 Create, M3 Evolve**, ADRs A–F, and the live proofs AC-L1..L5.

Master-gate read (ADR-25): the gated slice is **high uncertainty** (the design can be invalidated, not merely
unproven) × **high irreversibility** (ships to users + omni + ADR register). That is a one-way door → the gate
should hold. The ungated slice is a two-way door and safe now.

**Question:**
How do we proceed, given AC-6 is pending? Pick the build scope:
- **(A)** Ship the **ungated slice only** now (M2/ADR-G + M0 naming + dormant AC-L6/ADR-H drift rules); **defer**
  the gated lifecycle machinery (C1–C4, M1, M3, ADRs A–F, AC-L1..L5) to a follow-up pass once the operator
  returns AC-6 = GO.
- **(B)** Build the **full fold-in build-only now** (parent precedent: build the machinery, unit-test with
  synthetic fixtures, mark AC-L1..L5 operator-owed), and **ship it all** — ready to go the moment the pilot
  passes. Risk: ships M1/M3 lifecycle contracts + 8 ADRs into the user-facing skill on an **unproven premise**;
  a NO-GO forces retraction of shipped skill content + an omni-twin re-sync. (Variant **B′**: build the
  machinery + skill-text drafts now but **stage the ship** — merge/bump/promote — behind AC-6, removing the
  irreversibility but not the build-on-unproven-premise waste.)
- **(C)** **Hold the entire feature** until AC-6 = GO, then do the whole fold-in in one coherent pass.

**Recommendation:** **(A)** — ship the ungated slice now, defer the gated machinery until AC-6 = GO.
It respects the spec's own gate, ships only always-correct content, and a NO-GO retracts nothing. Honest caveat:
the ungated slice is **thin** (essentially the M2 refactor-safety framing + ADR-G, plus a dormant drift rule and
M0 naming) — if you'd rather not fragment the fold-in into two plugin bumps, **(C)** (hold, then one pass) is the
clean alternative. I recommend **against (B)**: shipping M1/M3 + 8 ADRs to users before the two-arm premise is
proven is the exact high-cost-of-being-wrong case the master gate exists to stop.
**Confidence:** medium-high — that the **gated slice should not ship before AC-6** rests on hard evidence (AC-6
verified pending; the spec's own "NO-GO invalidates M1/M3" language; the user-facing/omni/ADR ship footprint).
The A-vs-C choice (whether the thin ungated carve-out is worth its own pass) is a lower-stakes call I'd defer to
your appetite for an interim win vs. a single coherent pass.

### Answer
**user (relayed by team lead, 2026-07-03):** **(A)** — ship the ungated slice only now (M2/ADR-G + M0
naming + dormant AC-L6/ADR-H drift rules); defer the gated lifecycle machinery (C1–C4, M1, M3, ADRs A–F,
AC-L1..L5) to a follow-up pass once the operator returns AC-6 = GO. Review mode = critic, code-grounded.

---

## Q2: Fold-in target and shape — a mode-section of `mine-verify-cover`, or a standalone skill?

**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis (pre-plan)
**File:** plugins/nexus/skills/mine-verify-cover/SKILL.md

**Context:**
The parent's OD-2 leaned "**a mode/front-end of `mine-verify-cover`**, not a standalone skill" (confidence:
medium). But the lifecycle this spec defines (a full spec-arm + M0–M3 merge/attest/protect/evolve lifecycle) is
substantially larger than a "mode" — `mine-verify-cover/SKILL.md` today is a 211-line **code-arm-only,
one-class** method with no spec-arm, no golden-set lifecycle, no C1–C4. The shipped surface is **skill text +
agent drift rules** (the harness `.mjs`/`.workflow.js` modules are dev-repo and do **not** ship). This question
only bites for whatever we actually ship (depends on Q1).

**Question:**
For the shipped skill text, do we (a) fold the SDD lifecycle as a distinct top-level **"SDD lifecycle (M0–M3)"
section inside `mine-verify-cover`**, keeping the `-dotnet` adapter for the .NET-specific merged-project /
attestation-path bits (OD-L5/OD-L7); (b) create a **standalone sibling skill** (e.g. `sdd-coverage-loop`) that
references `mine-verify-cover` as the code arm; or (c) split — neutral lifecycle text in the sibling, code-arm
gate unchanged in `mine-verify-cover`?

**Recommendation:** **(a)** for anything we ship — honor OD-2, add a clearly delimited "SDD lifecycle" section
(and, under option A, only the M2/M0 subset lands there now); the `-dotnet` adapter carries the merged-test-
project + `docs/kb/golden/{Class}.md` path specifics. Keeps one method home, avoids a second skill to keep in
sync. Revisit only if the gated M1/M3 text (post-AC-6) grows the section past readability, at which point a
sibling extraction is the natural refactor.
**Confidence:** medium — OD-2 is owner-set but only medium-confidence, and the lifecycle is bigger than the
"mode" framing it assumed.

### Clarification requested (user, 2026-07-03): "In which cases would we need a separate skill?"

**Architect answer.** Fold now; a standalone `sdd-coverage-loop` sibling becomes the right call only when one
of these **triggers** fires — none of which are true for the thin ungated slice we're shipping under Q1=(A):

1. **Distinct invocation trigger / audience.** `mine-verify-cover` is invoked to *cover ONE existing class*
   (code-arm, reverse-engineering). The lifecycle is *spec-driven, two-arm, cross-session, human-attested* —
   a different entry point. The skill `description` is how the model picks which skill to load; once the
   lifecycle needs its own `user-invocable` trigger ("run the SDD loop") rather than "cover this class", two
   descriptions serve discovery better than one overloaded one.
2. **Post-AC-6 size/cohesion.** The ungated slice is ~3 paragraphs (M2 framing + M0 naming + dormant drift) —
   folds cleanly. When the **gated M1/M3 machinery lands** (C1–C4 + the three-way reconciliation table + the
   triage protocol), the lifecycle roughly triples the skill and carries a self-contained sub-lifecycle a
   "cover one class" reader never needs. A folded section that rivals its host in size and has its own
   contracts/modes is the readability trigger to extract.
3. **Correct layering (dependency direction).** The relationship is asymmetric: the lifecycle *uses*
   `mine-verify-cover` as its code arm; the code arm does **not** need the lifecycle (it already ships a
   standalone "Mine→Verify only" mode, live-proven on 3 classes / 2 repos). Nesting the whole lifecycle
   *inside* the code-arm primitive is backwards. A sibling that *references* `mine-verify-cover` as its code
   arm — exactly how `mine-verify-cover-dotnet` sits beside it as an adapter — keeps the primitive clean.
4. **A second consumer/stack.** The repo's own anti-premature-extraction rule (stated in
   `mine-verify-cover/SKILL.md`: "abstract the seam only once a second stack is live") applies here: extract
   the lifecycle into its own skill + adapter seam only when a **second** stack or use-case needs it live.

**What tips the balance toward folding right now:** the ungated slice is thin and reuses machinery that already
lives in `mine-verify-cover` (M2 is literally "run the existing gate battery across a refactor"); one method
home = one sync surface (this repo is sync-acute — omni twin, selfcheck, gen-commands); and OD-2 already leaned
"mode, not standalone." **Net: fold now (a); the natural re-evaluation point is the post-AC-6 pass that lands
M1/M3 — decide sibling-vs-section *then*, when triggers 1–3 are concretely testable against real content.**

### Answer
[owner — Q2 still open: fold now (recommended) vs pre-commit to a sibling]
