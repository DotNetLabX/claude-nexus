# SDD Golden-Set Lifecycle (v1 ungated slice) — Critic Review

*(Persisted verbatim by the team lead from the critic's completion message — the critic writes no file by design. Critic ran Mode 2, code-grounded, on plan.md.)*

## Mode: Plan Review (code-grounded)
## Verdict: REVISE

## Pre-commitment Predictions (expected vs found)
1. M0 "spec arm run alone" would reference unshipped spec-arm machinery → **FOUND** (MEDIUM-3).
2. selfcheck / gen-omni ordering vs the developer/team-lead Owner Split would create a developer-stage gate that can't pass → **FOUND, and stronger than expected** (HIGH-1).
3. ADR numbering (37→38/39) might be stale → **checked, correct; no finding.**
4. AC-L6 rule text wouldn't fit all three roles uniformly → **FOUND** (MEDIUM-4).
5. Drift-rule path might diverge from OD-L5 (`docs/kb/golden/{Class}.md`) → **checked, matches OD-L5; no finding.**

## Cross-reference Matrix (ungated subset only — deferrals not flagged per scope note)

| Source Requirement | Plan Coverage | Status | Notes |
|---|---|---|---|
| OD-L6 — M0 greenfield, no new machinery | Step 1 (M0 full-brief + mode-map row) | COVERED (with caveat) | See MEDIUM-3: M0's "spec arm" is unshipped dev-repo harness |
| M2 net-new cross-refactor protocol | Step 1 (M2 full text) | COVERED (with caveat) | See MEDIUM-2: "re-run the existing gate battery" collides with `char_pin` |
| AC-L3 (M2 half) — suite_green + floor, delta advisory, never pass/fail | Step 1 M2 text + Step 3 ADR-38 | COVERED | Accept greps `delta is advisory only` + `never`; matches spec verbatim |
| AC-L6 — drift rules in solo/architect/developer | Step 2 | COVERED | grep-verifiable; net-new confirmed (zero attestation checks today) |
| Drift policy — mechanical backstop + additive-drift gap | Step 3 ADR-39 | COVERED | ADR-39 notes CI/suite backstop + named additive-drift gap |
| ADR-G → ADR-38 (M2-safety half) | Step 3 | COVERED | Correctly ships only the M2 half; C3 "gated unit" half deferred + documented |
| ADR-H → ADR-39 (Drift v1) | Step 3 | COVERED | Title matches spec |
| OD-L5 — path `docs/kb/golden/{Class}.md` | Step 2 content | COVERED | Path matches OD-L5 |
| Release — bump + gen-commands + validate + selfcheck | Step 4 | PARTIAL | See HIGH-1: developer-stage selfcheck can't exit green |

Coverage of the ungated subset is **complete** — no missing-requirement gap. All findings are feasibility/coherence, not coverage.

---

## Findings

### [HIGH-1] Step 4's "`selfcheck` exits green" is unsatisfiable at the developer's stage — `gen-omni --check` will FAIL and risk a developer bounce
**Source:** plan Step 4 Accept ("`node scripts/selfcheck.mjs` exits green"), plan Owner Split ("The developer does **not** commit and does **not** run `gen-omni`").
**Issue:** `scripts/selfcheck.mjs` runs **`gen-omni --check` as a *gating* check** (selfcheck.mjs:73-77 — no `informational: true`; only `salience report` is informational). `gen-omni --check` regenerates the twin in memory and **exits 1 on any drift** (gen-omni.mjs:44-56). The `../omni` twin **exists** (verified on disk) and currently reflects the *pre-edit* nexus. This feature is, by the plan's own words, "the **first `plugins/**` touch in this lineage**" — so after the developer edits SKILL.md + 3 agents + `plugin.json` + `CHANGELOG.md` + regenerated `commands/`, the twin is stale and `gen-omni --check` reports `differs:` for every one of those files → **`[FAIL] gen-omni --check` → selfcheck exits 1**. The plan (correctly, per ADR-6 + memory "Finalize artifacts before commit 2") defers the twin regen to the **team-lead at commit time**, and explicitly forbids the developer from running `gen-omni`. So the developer is handed a gate that **cannot** go green at their stage.
**Impact:** A developer following the plan literally runs `selfcheck`, sees a red `gen-omni --check`, and has three bad options: bounce/loop trying to fix it (the omni analog of the documented ~125k-token `gen-commands` false-positive — selfcheck.mjs:54-63 records that exact class of bug), wrongly run `gen-omni` (violating the Owner Split and pinning the twin to a pre-commit SHA that then needs re-running — memory "Finalize artifacts before commit 2"), or stall at the Step-4 "exits green" gate. Note the parent `SddCoverageLoop` passed selfcheck 5/5 only *because it changed no `plugins/**` files* (its summary.md:36) — this plan is the first to hit the plugin-edit + developer-selfcheck combination, so the risk is novel and unmitigated.
**Suggestion:** Scope Step 4 so the developer's completion does **not** gate on `gen-omni --check`. Options: (a) have the developer run selfcheck but **expect and record the `gen-omni --check` FAIL as a known-deferred state** (exactly as selfcheck.mjs already documents the `gen-commands` false-positive), gating Step-4 completion on the *other* checks + `validate --strict`; or (b) move the **full** `selfcheck` to the team-lead's post-`gen-omni` commit step and give the developer `validate --strict` + `bump-plugin --check` only. State explicitly in the plan which checks the developer must see green vs. which are team-lead/post-sync.

### [MEDIUM-2] M2's "re-run the existing gate battery" contradicts the file's own `char_pin` gate for a refactor
**Source:** plan Step 1 M2 text ("re-run the **existing gate battery** (see the 'gate battery' section) before and after the refactor"); `mine-verify-cover/SKILL.md:49`.
**Issue:** The gate battery includes **`char_pin` = "the production source was **not changed** (only Stryker-disable annotations are allowed)"** (SKILL.md:49). M2 (Protect) is, by definition, a **refactor of the production class** — the source *does* change. Running `char_pin` "after the refactor" fails categorically. The plan's *criterion* is precise (suite_green + mutation_floor, and it says to name those two gates), but the surrounding instruction to "re-run the existing gate battery" pulls in `char_pin` (and its no-edit-prod premise), which is the exact opposite of what M2 governs. If the shipped M2 text keeps the broad "gate battery" phrasing, the skill contradicts itself for the one operation M2 covers.
**Impact:** An executor applying M2 per the shipped text either hits a guaranteed `char_pin` failure on their refactor or is left unsure whether M2 permits source changes at all (it must — that's the point). A user-facing contradiction inside a single shipped skill.
**Suggestion:** In the M2 text, scope the re-run to the **safety-net gates it actually uses** — `suite_green` + `mutation_floor` (as the plan's own binding criterion already names) — and add one clause noting `char_pin` is **inapplicable to M2**, because M2 deliberately changes production source (the inverse of `mine-verify-cover`'s normal no-edit-prod stance).

### [MEDIUM-3] M0 ships as a "full" mode whose "spec arm" mechanism is unshipped (dev-repo harness, itself AC-6-gated)
**Source:** plan Step 1 M0 content ("greenfield = the **spec arm run alone**; its output is the **red suite** … it is the spec front-end used by itself"); spec OD-L6.
**Issue:** The "spec arm" / spec-cover front-end lives only in dev-repo `harness/` (`spec-cover.workflow.js`, `spec-cover-calc.workflow.js`) and **does not ship** — the parent `SddCoverageLoop` "changed no `plugins/**` files" (its summary.md:36) and its live proof (AC-6) is still pending (summary.md:31). M1/M3 are correctly shipped as a **deferred stub**, but M0 is shipped **"in full"** with an actionable recipe ("the spec arm run alone; output is the red suite"). A consumer reading the public `mine-verify-cover` skill reasonably treats a fully-described mode as executable — but they have no shipped spec arm to run, and the spec arm's two-arm premise is itself the thing gated on AC-6.
**Impact:** The shipped skill describes an executable-sounding mode that consumers cannot execute — reader confusion about what actually ships in this slice.
**Suggestion:** Either mark M0's spec arm as the **dev-repo / not-yet-shipped (AC-6-gated) front-end**, or frame M0 as a **named position in the lifecycle** (like the mode-map row) rather than an executable recipe — consistent with how M1/M3 are handled as stubs.

### [MEDIUM-4] AC-L6 rule text is off-role for the architect ("update the affected tests in the same pass")
**Source:** plan Step 2 Content ("each file gains a rule stating: … **update the affected tests in the same pass**, or flag an M3 re-mine") + Accept (grep requires `M3 re-mine` in all three files); spec Drift policy + AC-L6.
**Issue:** The spec assigns the **solo** agent the primary rule (update tests OR flag re-mine) and the **architect + developer** the *symmetric check* — for the architect specifically "at **plan / done-check time**" (spec Drift policy; plan restates this). But the architect plans and done-checks; it does **not** "update the affected tests in the same pass." The plan's uniform lead sentence plus a grep that demands the same anchor across all three files could push a verbatim off-role instruction ("update tests in the same pass") into `architect.md`.
**Impact:** A test-authoring duty lands on the plan-time architect, which the architect can't and shouldn't perform — a minor role-fit incoherence in shipped agent prose.
**Suggestion:** Frame the architect's rule as a **plan/done-check-time flag** ("when a class you are planning work on has an attested golden set, plan the test update or flag an M3 re-mine") — the `flag an M3 re-mine` branch fits the architect; the "update tests in the same pass" branch is solo/developer-only. The plan already names the per-role framing; make the Content sentence and the grep expectation reflect it so the architect rule isn't copied verbatim.

## Gap Analysis
- **Coverage:** every ungated spec requirement maps to a plan step (matrix above). No missing-requirement or scope-expansion gap. Deferrals (C1–C4, M1/M3, AC-L1..L5, ADRs A–F + C3-half of G, topology, reconciliation table) are explicitly listed under Scope→Out with a forward reference to the AC-6 fold-in — not silently dropped.
- **ADR-38 split:** the plan correctly ships only the M2-safety half of spec ADR-G and defers the "merged-set-is-the-gated-unit" half, with a documented AC-6 deferral note inside ADR-38. No number-collision risk (the deferred half rides the post-AC-6 fold-in). Sound.
- **Release policy:** Step 4 correctly proposes PATCH and **flags** (never self-decides) the MINOR escalation to the owner, per CLAUDE.md. Sound.
- **Boy-scout note (not a plan defect):** **ADR-37 appears to be missing from the `## Contents` list** — the Contents list ends at ADR-36 (README.md:54) while ADR-37 exists in the body (README.md:889). When Step 3 adds ADR-38/39 to Contents, the developer should also add the absent ADR-37 line. Pre-existing; out of this plan's charter but cheap to fix in-pass.

## Open Questions
- None. All four findings survived the self-audit and realist check with MEDIUM+ confidence and concrete code evidence; none were downgraded to open questions.

## Self-audit / Realist check
- **HIGH-1** — confidence HIGH; not refutable against the plan as written ("exits green" is unambiguous, and selfcheck lists `gen-omni --check` as gating). Genuine process-blocking gate, not preference. Held at HIGH (fixable → REVISE, not CRITICAL: it fails loudly as a FAIL, no silent-wrong-output or data loss).
- **MEDIUM-2/3** — real cross-reference/coherence catches in shipped text; MEDIUM because the plan's binding criteria are already correct and a competent author *may* resolve them — but the shipped-text risk is concrete, so they belong in the artifact, not as opinions.
- **MEDIUM-4** — MEDIUM leaning refinement; the plan already names the per-role framing, so this is a wording-precision guard against verbatim copy.
- No CRITICAL and only 1 HIGH → no ADVERSARIAL escalation. The plan is well-grounded and close; these are fixable before it reaches the developer.
