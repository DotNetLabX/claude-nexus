Spec-stamp: docs/specs/adhoc-SddLifecycle/definition/tech-spec.md @ sha256:ab725d865a7f (2026-07-03)

# Spec rules — adhoc-SddLifecycle (mine-from-spec, consolidated + skeptic-verified)

**Provenance**
- Mode: mine-from-spec (Mine+Verify, spec arm)
- Agents: 3 clean-room miners + 1 consolidate/skeptic
- Manifest: exactly one doc — `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (the sole verification oracle; no source, tests, code-arm KB, or golden set consulted)
- Confirmation: owner go-ahead recorded 2026-07-03 (`adhoc-SpecArmTrigger` drill)
- Input volume: 144 miner rows (miner-1: 44, miner-2: 48, miner-3: 52) → 54 consolidated rules

Verdict key: `verified` = committed, boundary stated in the doc, violation observable. `ambiguous` = carries a one-line reason.

---

## Header / gating

### R01 — pilot-ac6-gates-implementation
- **Statement:** Implementation of the lifecycle is gated on the parent pilot's AC-6 verdict; a pilot NO-GO invalidates M1/M3 as designed while M2's arm (shipped `mine-verify-cover`) stands. (Gate scope later narrowed by the OD-L8 amendment — see R50/R51.)
- **Boundary:** AC-6 = NO-GO → M1/M3 contracts invalid; M2's code arm unaffected; M2's cross-refactor protocol is still net-new.
- **Citation:** "**Depends on:** the `adhoc-SddCoverageLoop` pilot verdict (its AC-6). The lifecycle contracts below assume the two-arm loop works; a pilot NO-GO invalidates M1/M3 as designed (M2's *arm* stands regardless — the code arm is shipped `mine-verify-cover`; M2's cross-refactor protocol is net-new, see below)."
- **Miners:** 2/3 (miner-1, miner-3)
- **Verdict:** verified

### R02 — ships-only-via-fold-in
- **Statement:** Nothing in this spec ships independently; the skill fold-in (`adhoc-SddCoverageLoop` roadmap step 4) is the implementation vehicle.
- **Boundary:** Lifecycle machinery shipped outside the fold-in violates the header contract.
- **Citation:** "**Implementation vehicle:** the skill fold-in (`adhoc-SddCoverageLoop` roadmap step 4). Nothing here ships independently; this spec exists so the fold-in implements contracts, not improvisation."
- **Miners:** 1/3 (miner-3)
- **Verdict:** ambiguous — the header's blanket "nothing ships independently" is superseded in-doc by the OD-L8 amendment (Mine+Verify wiring pulled forward into `adhoc-SpecArmTrigger`); the surviving commitment is exactly R51, so this row's blanket form is internally contradicted.

### R03 — one-test-set-at-finish
- **Statement:** When a feature is finished there is exactly ONE test set — the best of both arms — plus the durable records that let a later session update it without re-litigating old decisions.
- **Boundary:** Feature completion with two parallel arm test sets, or without durable verdict records, violates the driving constraint (operationalized by R41/R43).
- **Citation:** "The owner's driving constraint: **when a feature is finished there is exactly ONE test set** — the best of both arms — plus the durable records that let a later session update it without re-litigating old decisions."
- **Miners:** 2/3 (miner-3 standalone; miner-2 embedded in its AC-L4 evidence)
- **Verdict:** verified

---

## Lifecycle modes

### R04 — m0-greenfield-spec-arm-only-red-suite
- **Statement:** M0 (spec exists, code doesn't) runs the spec arm alone with no new machinery; its output is a red suite that code is then written to turn green.
- **Boundary:** Trigger = spec without code; exactly one arm (spec); the output suite must start red; no merge/attestation machinery is invoked.
- **Citation:** "| **M0 — Greenfield** | Spec exists, code doesn't | Spec arm only | Red suite = the SDD starting point; code is written to turn it green |" and "**OD-L6 — M0 (greenfield) is a named mode with no new machinery** — it is the spec arm run alone; its output is the red suite."
- **Miners:** 3/3
- **Verdict:** verified

### R05 — m1-create-both-arms-blind-to-attested-set
- **Statement:** M1 (code + spec both exist, no golden set) runs both arms blind, then a triage merge, producing an attested golden set of rules plus ONE test set.
- **Boundary:** Precondition = no existing golden set; arms blind before merge (see R32); output test-set count = 1.
- **Citation:** "| **M1 — Create** | Code + spec both exist, no golden set | Both, blind → triage merge | Attested golden set (rules + ONE test set) |"
- **Miners:** 3/3
- **Verdict:** verified

### R06 — m2-protect-code-arm-only
- **Statement:** M2 (refactor of a covered class) runs the code arm only; its output is a safety net proven by suite-green plus floor re-clear across the refactor.
- **Boundary:** Trigger = refactor of a covered class; the spec arm must not run; success criterion detailed in R39.
- **Citation:** "| **M2 — Protect** | Refactor of a covered class | Code arm only (the arm is shipped `mine-verify-cover`; the cross-refactor protocol below is net-new) | Safety net; suite-green + floor re-clear across the refactor |"
- **Miners:** 3/3
- **Verdict:** verified

### R07 — m3-evolve-three-way-reconciliation
- **Statement:** M3 (feature update on a class with an existing attested set) runs both arms blind and combines the new two-way diff with the prior C2, yielding per-rule dispositions from the closed set {add, re-open, supersede, retire, carried} plus re-attestation.
- **Boundary:** Precondition = existing attested set (and C1, per R12); disposition vocabulary is exactly the five listed.
- **Citation:** "| **M3 — Evolve** | Feature update on a class with an existing attested set | Both, blind → three-way reconciliation (defined below) | add / re-open / supersede / retire / carried per rule + re-attestation |" and "M3 = the two-way diff of the **new** arms, combined with the **prior C2**."
- **Miners:** 3/3
- **Verdict:** verified

---

## C1 — Canonical rule registry

### R08 — canonical-name-is-identity-key
- **Statement:** The canonical rule NAME is the identity key — there is no separate canonical id, and the diff layer's existing `ruleKey = ruleName ?? id` matching is not re-keyed.
- **Boundary:** Introducing a separate canonical id, or re-keying `spec-diff`, violates the identity model.
- **Citation:** "**Identity model (resolved):** the **canonical rule NAME is the identity key** — it is what `spec-diff`'s `ruleKey = ruleName ?? id` already matches on, so the diff layer is not re-keyed. There is no separate canonical id."
- **Miners:** 3/3
- **Verdict:** verified

### R09 — registry-survives-sessions
- **Statement:** C1 is a stateful per-class identity registry that persists across sessions — not a stateless per-run mapping.
- **Boundary:** A registry rebuilt from scratch each run (the pilot crosswalk's stateless shape) violates it.
- **Citation:** "A stateful per-class identity registry that survives sessions." and "the pilot's `rule-crosswalk.mjs` is a stateless per-run `Record<string,string>` name-rewrite — the seed is its alias→name mapping idea only"
- **Miners:** 2/3 (miner-2 standalone; miner-3 embedded in its M1-creates/M3-requires row)
- **Verdict:** verified

### R10 — registry-row-schema
- **Statement:** The registry holds exactly one row per rule carrying canonical name, per-arm aliases (code-arm `BR-n` ids, spec-arm authored names), a status from the closed enum {active, superseded, retired}, first-seen, and last-confirmed.
- **Boundary:** One row per rule; a status value outside the three-value enum, or a missing field, is invalid.
- **Citation:** "One row per rule: canonical name, per-arm aliases (code-arm `BR-n` ids, spec-arm authored names), status (`active | superseded | retired`), first-seen, last-confirmed."
- **Miners:** 3/3
- **Verdict:** verified

### R11 — rename-is-supersede
- **Statement:** A rule rename is executed as a supersede — a new canonical name is created and the old row is marked `superseded → {new-name}` (retained with the pointer, not mutated in place or deleted).
- **Boundary:** Rename event — the old row must remain, carrying the superseded pointer to the new name.
- **Citation:** "A rule *rename* is a supersede: new canonical name, old row marked `superseded → {new-name}`."
- **Miners:** 3/3
- **Verdict:** verified

### R12 — m1-creates-registry-m3-requires-it
- **Statement:** M1 creates the C1 registry; M3 requires it to exist.
- **Boundary:** An M3 run without an existing C1 is invalid; an M1 run must end with the registry existing.
- **Citation:** "M1 creates the registry; M3 requires it."
- **Miners:** 3/3
- **Verdict:** verified

---

## C2 — Attestation record

### R13 — attestation-record-fields
- **Statement:** The C2 attestation record contains the final rule list, exactly one verdict per disagreement, the code sha + spec-doc version it was decided against, and attestor + date.
- **Boundary:** A disagreement with zero or multiple verdicts, or a record missing sha/spec-version/attestor/date, is incomplete.
- **Citation:** "The record of the merge-triage verdicts: final rule list; **one verdict per disagreement**; the code sha + spec-doc version it was decided against; attestor + date."
- **Miners:** 3/3
- **Verdict:** verified

### R14 — dropped-spec-tests-deleted-not-archived
- **Statement:** Dropped from-spec tests are deleted, not archived; the C2 verdict line is the durable trace.
- **Boundary:** Existence of any archive of dropped tests violates (reinforced by the out-of-scope list); a drop without the corresponding verdict line also violates.
- **Citation:** "Dropped from-spec tests are **deleted, not archived** — the verdict line is the durable trace (OD-L3)." and "**OD-L3 — Dropped from-spec tests are deleted + recorded in C2, no archive.** The verdict is the trace; an archive is dead weight."
- **Miners:** 3/3
- **Verdict:** verified

### R15 — verdict-line-grammar
- **Statement:** C2 verdict and carried lines must parse the pinned machine-checkable grammar, with the verdict token drawn from exactly {spec-wins, code-wins, promote, incidental} and carried lines citing a prior C2 version.
- **Boundary:** A line not matching `- verdict: {spec-wins|code-wins|promote|incidental} | rule: {canonical-name} | why: {one line}` or `- carried: {canonical-name} | from: {prior C2 version}` fails the AC-L2/AC-L5 checks.
- **Citation:** "**Verdict-line grammar (machine-checkable, pinned for AC-L2/AC-L5):**" followed by the two templates "- verdict: {spec-wins|code-wins|promote|incidental} | rule: {canonical-name} | why: {one line}" and "- carried: {canonical-name} | from: {prior C2 version}"
- **Miners:** 3/3
- **Verdict:** verified

### R16 — c2-versioned-living
- **Statement:** C2 is versioned and living (contrast: a frozen golden-set benchmark); its version stamp is what makes staleness visible, and later runs cite it.
- **Boundary:** An attestation without a citable version stamp violates (AC-L5 carried lines must cite "the prior C2 version"); versions must be distinguishable across re-attestations.
- **Citation:** "the golden set is a deliberately **frozen** benchmark, while C2 is **versioned and living**; C2's version stamp is what makes staleness visible instead of silent."
- **Miners:** 3/3
- **Verdict:** verified

---

## C3 — The merged test set

### R17 — merged-set-home-real-test-project
- **Statement:** The merged test set lands in the consuming repo's real test project (the code arm's home); the spec arm's throwaway harness project dissolves at merge.
- **Boundary:** Post-merge, the spec-arm harness project must not persist; merged tests live in the repo's normal test project, not a third standing project.
- **Citation:** "The merged set lands in the **consuming repo's real test project** — the code arm's home (e.g. SR's `Fokus.Domain.Tests`); the spec arm's throwaway harness project dissolves at merge (OD-L7)."
- **Miners:** 3/3
- **Verdict:** verified

### R18 — kept-test-provenance-tag
- **Statement:** Every kept test carries a provenance tag from the closed enum `spec | code | both` plus the canonical rule name.
- **Boundary:** A kept test with no tag, an out-of-enum tag, or no canonical rule name violates C3.
- **Citation:** "Every kept test carries a provenance tag (`spec | code | both` + canonical rule name)."
- **Miners:** 3/3
- **Verdict:** verified

### R19 — merged-set-gated-as-a-whole
- **Statement:** The merged test set as a whole must pass the mutation gate at the adapter's floor; gating each arm separately does not satisfy it.
- **Boundary:** The gate run must be on the merged/pruned set; two separate per-arm gate passes do not count.
- **Citation:** "The **merged set as a whole** must pass the mutation gate at the adapter's floor — gating each arm separately does not prove the merged/pruned set still bites (AC-L3)." and (AC-L3) "The merged test set passes the adapter's mutation floor as a set."
- **Miners:** 3/3
- **Verdict:** verified

---

## C4 — Triage protocol

### R20 — agents-propose-human-attests
- **Statement:** Triage verdicts are proposed by agents and attested by a human; automation of the human attestation is out of scope for v1 (the M3 `carried` disposition is the doc's only auto-applied case, per R26).
- **Boundary:** An attested set whose verdicts were auto-applied without a human attestor (outside `carried`) violates.
- **Citation:** "Agents propose, a human attests:" and "**Out of scope for v1:** … automation of the human attestation itself."
- **Miners:** 3/3
- **Verdict:** verified

### R21 — both-agree-keeps-one-arm-default-code
- **Statement:** For `both-agree` rules exactly one arm's tests are kept per rule — defaulting to the code arm's kept set, which is legitimately 1..N tests (main assertion + categorical-KEEP boundary tests) — with the spec-arm variant dropped unless the spec-arm test is strictly clearer; the invariant is no cross-arm double-maintenance, not one test per rule.
- **Boundary:** 1..N kept-arm tests per rule are legal; retaining both arms' variants violates; a kept spec-arm variant requires the "strictly clearer" exception (OD-L2; C2 records exceptions).
- **Citation:** "`both-agree` → keep **one arm's** tests per rule; default the code arm's kept set — which is legitimately 1..N tests under the shared rule name (main assertion + categorical-KEEP boundary tests, per `mine-verify-cover`'s Minimize guard) — and drop the spec-arm variant, unless the spec-arm test is strictly clearer (OD-L2). The invariant is **no cross-arm double-maintenance**, not \"one test per rule.\""
- **Miners:** 3/3
- **Verdict:** verified

### R22 — spec-not-code-two-verdicts
- **Statement:** A `spec∧¬code` rule resolves to exactly one of two verdicts — spec-wins (real bug: test stays red, code gets fixed) or code-wins (stale spec: spec doc updated, from-spec test dropped, verdict recorded in C2).
- **Boundary:** Closed two-outcome choice; code-wins without both the spec-doc update and the recorded C2 verdict violates; spec-wins with the test removed or forced green violates.
- **Citation:** "`spec∧¬code` → per-rule verdict: **spec-wins** (real bug: test stays red, code gets fixed) or **code-wins** (stale spec: spec doc updated, from-spec test dropped + verdict recorded in C2)."
- **Miners:** 3/3
- **Verdict:** verified

### R23 — code-not-spec-two-verdicts
- **Statement:** A `code∧¬spec` rule resolves to promote (behavior becomes spec: spec doc updated, test kept) or incidental (regression-pin or drop) — and is recorded either way.
- **Boundary:** Closed two-outcome choice; an incidental outcome with no record violates; promote without the spec-doc update violates.
- **Citation:** "`code∧¬spec` → per-rule verdict: **promote** (behavior becomes spec — spec doc updated, test kept) or **incidental** (regression-pin or drop; recorded either way)."
- **Miners:** 3/3
- **Verdict:** verified

---

## M3 reconciliation semantics

### R24 — m3-disposition-key-triple
- **Statement:** M3 disposition per rule is a function of exactly the triple (prior-C2 status, prior verdict, new two-way bucket).
- **Boundary:** Disposition computed from any other inputs, or ignoring one of the three, violates the keying contract.
- **Citation:** "Disposition per rule, keyed on (prior-C2 status, prior verdict, new two-way bucket):"
- **Miners:** 2/3 (miner-3 standalone; miner-2 embedded in its M3 mode row)
- **Verdict:** verified

### R25 — m3-add-when-absent-from-prior-c2
- **Statement:** A rule not present in the prior C2 gets disposition **add** — normal M1 triage — regardless of its new two-way bucket.
- **Boundary:** Key = (prior C2: not present, any bucket); absence from prior C2 dominates.
- **Citation:** "| Not present | Any bucket | **add** — normal M1 triage for this rule |"
- **Miners:** 3/3
- **Verdict:** verified

### R26 — m3-carried-auto-applied-with-version
- **Statement:** An attested rule with a recorded verdict, same new bucket, and evidence consistent with the verdict is **carried** — auto-applied and listed with the prior C2 version.
- **Boundary:** Carried requires all three key conditions; the listing must cite the prior C2 version (AC-L5); carried is the only auto-applied disposition in the table.
- **Citation:** "| Attested, verdict recorded | Same bucket, evidence consistent with the verdict | **carried** — auto-applied, listed with prior C2 version (AC-L5) |"
- **Miners:** 3/3
- **Verdict:** verified

### R27 — m3-reopen-never-auto-override
- **Statement:** When new evidence contradicts a recorded verdict the rule is **re-opened** for a new human verdict; a recorded verdict is never auto-overridden.
- **Boundary:** Any automatic reversal of a recorded verdict violates (e.g. prior `code-wins`, spec doc now re-asserts the rule).
- **Citation:** "| Attested | New evidence contradicts the recorded verdict (e.g. was `code-wins`, spec doc now re-asserts the rule) | **re-open** — new human verdict; never auto-override a recorded verdict |"
- **Miners:** 3/3
- **Verdict:** verified

### R28 — m3-supersede-same-name-new-version
- **Statement:** When an attested rule's boundary/outcome changed but the rule persists in both arms, it is **superseded** — same canonical name, new version, old test replaced.
- **Boundary:** Supersede must not mint a new canonical name; the old test is replaced, not kept alongside.
- **Citation:** "| Attested | Rule's boundary/outcome changed but rule persists in both arms | **supersede** — same canonical name, new version; old test replaced |"
- **Miners:** 3/3
- **Verdict:** verified

### R29 — m3-retire-requires-absence-from-both-arms
- **Statement:** An attested rule is retired only when it is absent from BOTH new arms.
- **Boundary:** Absence must be from both arms simultaneously; absence from one arm alone never triggers retire (see R30 for the spec-side edge).
- **Citation:** "| Attested | Absent from **both** new arms | **retire** — rule left both spec and code |"
- **Miners:** 3/3
- **Verdict:** verified

### R30 — m3-spec-disappearance-is-retire-candidate
- **Statement:** A spec-backed attested rule absent from the new spec but present in new code is **re-opened as a retire-candidate** — a human confirms retire vs enshrine; never auto-retired on spec-side disappearance alone.
- **Boundary:** Key = (attested spec-backed, absent from new-spec, present in new-code); any auto-retire in this cell violates.
- **Citation:** "| Attested (spec-backed) | Absent from new-spec, present in new-code | **re-open as retire-candidate** — human confirms retire vs enshrine; never auto-retire on spec-side disappearance alone |"
- **Miners:** 3/3
- **Verdict:** verified

---

## Topology

### R31 — topology-two-transient-plus-one-durable
- **Statement:** The topology is 2 transient worktrees + 1 durable merged test project — not three standing projects; after the triage merge, arm outputs are disposable `.runs/` audit artifacts and only the merged set + C1 + C2 persist.
- **Boundary:** Persistence set post-merge = {merged set, C1, C2}; any arm output persisting as a standing project violates OD-L1.
- **Citation:** "**2 transient worktrees + 1 durable merged test project** — not three standing projects. The isolation constraint binds only while the arms author; after the triage merge, arm outputs are disposable run artifacts (`.runs/` audit trail), and only the merged set + C1 + C2 persist."
- **Miners:** 3/3
- **Verdict:** verified

### R32 — disjoint-input-manifests-invariant
- **Statement:** The enforced isolation invariant is disjoint input manifests (checked by `independence-check.mjs`), placement-independent; worktrees are only the mechanism, and the constraint binds only while the arms author.
- **Boundary:** Overlapping arm input manifests during authoring violate regardless of physical separation; isolation obligations end at merge.
- **Citation:** "(Worktrees are the isolation *mechanism*; the enforced invariant is disjoint input manifests — `independence-check.mjs` — which is placement-independent.)"
- **Miners:** 3/3
- **Verdict:** verified

---

## Drift policy (v1)

### R33 — solo-lane-attestation-check-rule
- **Statement:** The solo agent carries a new rule: when a touched class has an attested golden set (C2 exists), update the affected tests in the same pass or flag an M3 re-mine.
- **Boundary:** Trigger = C2 exists for the touched class; allowed responses = same-pass test update OR M3 flag, nothing else.
- **Citation:** "**Solo lane:** new rule owed to the solo agent — *touched class has an attested golden set (C2 exists) → update the affected tests in the same pass, or flag an M3 re-mine*."
- **Miners:** 3/3
- **Verdict:** verified

### R34 — ac-l6-drift-rules-shipped-in-three-agents
- **Statement:** The fold-in adds the symmetric attestation-check rule to architect and developer alongside solo (converting discretion into rule); per AC-L6, all three shipped agent files must contain the check, grep-verifiable.
- **Boundary:** Proof = grep the three agent files for the attestation check; presence only is checkable (effectiveness is process-level, per the AC's own scoping).
- **Citation:** "The fold-in adds the symmetric attestation-check rule to **architect and developer** alongside solo, converting discretion into rule." and "**AC-L6 — Drift rules shipped.** The solo agent's shipped instructions contain the C2-check rule; the architect and developer files carry the symmetric check (per Drift policy). *Proof:* grep the three agent files for the attestation check."
- **Miners:** 3/3 (merged: miner-1 ac-l6 row; miner-2 architect-developer-symmetric + ac-l6-grep rows; miner-3 architect-developer row)
- **Verdict:** verified

### R35 — ci-backstop-via-normal-suite
- **Statement:** Because the merged set lives in the consuming repo's normal suite, drift that breaks an attested rule fails CI regardless of process discipline.
- **Boundary:** A code change violating an attested rule must produce a red CI run with no agent-process involvement; the merged tests must run in normal CI.
- **Citation:** "**Mechanical backstop (free):** the merged set lives in the consuming repo's normal suite — drift that *breaks* an attested rule fails CI regardless of process discipline."
- **Miners:** 3/3
- **Verdict:** verified

### R36 — additive-drift-explicitly-accepted
- **Statement:** Additive drift (new behavior in a covered class keeps all tests green while the golden set silently under-covers) is a named, explicitly accepted v1 gap; only the out-of-scope per-PR loop closes it — v1 ships no mechanism for it.
- **Boundary:** Negative/scope rule: a v1 delivery claiming to close additive drift, or shipping machinery for it, violates the declared scope.
- **Citation:** "**Accepted v1 gap (named, not solved):** **additive drift** — new behavior in a covered class keeps all tests green while the golden set silently under-covers. Only the per-PR loop (out of scope, roadmap) closes this. v1 accepts it explicitly."
- **Miners:** 1/3 (miner-3)
- **Verdict:** verified

---

## v1 Acceptance Criteria

### R37 — ac-l1-registry-stability
- **Statement:** Two consecutive runs on the same class yield identical canonical names for unchanged rules; a changed arm alias re-binds to the same canonical name via C1 rather than creating a new row.
- **Boundary:** Proof = registry diff across two runs shows zero identity churn on unchanged rules; an alias change must not mint a new row.
- **Citation:** "**AC-L1 — Registry stability.** Two consecutive runs on the same class yield identical canonical names for unchanged rules; a changed arm alias re-binds to the same canonical name via C1, not a new row. *Proof:* registry diff across two runs shows zero identity churn on unchanged rules."
- **Miners:** 3/3
- **Verdict:** verified

### R38 — ac-l2-attestation-completeness
- **Statement:** After an M1 merge, every `spec∧¬code` and `code∧¬spec` rule has exactly one pinned-grammar verdict line in C2, with zero unresolved disagreements in an attested set.
- **Boundary:** Proof equality: `grep -c '^- verdict:'` in C2 == count of disagreement-quadrant rules in the run report.
- **Citation:** "**AC-L2 — Attestation completeness.** After an M1 merge, every `spec∧¬code` and `code∧¬spec` rule has exactly one verdict line (the pinned grammar) in C2; zero unresolved disagreements in an attested set. *Proof:* `grep -c '^- verdict:'` in C2 == count of disagreement-quadrant rules in the run report."
- **Miners:** 3/3
- **Verdict:** verified

### R39 — m2-pass-suite-green-plus-floor-reclear
- **Statement:** M2's pass criterion is that every pre-refactor gated test stays green post-refactor (`suite_green`) AND the re-gated whole-class reachable kill clears the adapter floor — proven by gate reports before and after (two floor checks, not a comparison judgment).
- **Boundary:** Both conditions required; proof = two independent gate reports (suite_green + floor), never a rate-delta judgment (see R40).
- **Citation:** "For M2: **every pre-refactor gated test stays green post-refactor (`suite_green`), and the re-gated whole-class reachable kill clears the adapter floor.** … *Proof:* gate reports (suite_green + floor) before and after; two floor checks, not a rate-delta judgment."
- **Miners:** 3/3 (merged: miner-1's combined AC-L3 row split across R19/R39/R40)
- **Verdict:** verified

### R40 — kill-rate-delta-advisory-only
- **Statement:** A kill-rate before/after delta is advisory only and is never the M2 pass/fail criterion, because the mutant population (denominator) changes with the source.
- **Boundary:** Any M2 gate that passes/fails on a rate comparison violates AC-L3.
- **Citation:** "A kill-rate before/after delta is **advisory only** — the mutant population (denominator) changes with the source, so a rate comparison is not apples-to-apples and is never the pass/fail criterion."
- **Miners:** 3/3
- **Verdict:** verified

### R41 — ac-l4-no-cross-arm-double-maintenance
- **Statement:** After merge, no rule is asserted by both arms' tests — the dropped arm's variant is removed — while a rule may legitimately carry the kept arm's 1..N tests with categorical-KEEP preserved.
- **Boundary:** Proof half 1: no canonical name has tests tagged both `spec` and `code`; the invariant is cross-arm, not a one-test-per-rule cap.
- **Citation:** "**AC-L4 — One-set invariant (no cross-arm double-maintenance).** After merge, no rule is asserted by **both arms'** tests — the dropped arm's variant is removed; a rule may legitimately carry the kept arm's 1..N tests (categorical-KEEP preserved)."
- **Miners:** 3/3
- **Verdict:** verified

### R42 — provenance-tags-resolve-to-c1
- **Statement:** Every kept test's provenance tag resolves to a C1 registry row — the tag→registry join has no orphans.
- **Boundary:** Any kept test whose canonical-name tag has no matching C1 row is an orphan and fails.
- **Citation:** "Every kept test's provenance tag resolves to a C1 row. *Proof:* no canonical name has tests tagged both `spec` and `code`; tag→registry join has no orphans."
- **Miners:** 3/3 (miner-2 standalone; miner-1/miner-3 embedded in their AC-L4 rows)
- **Verdict:** verified

### R43 — ac-l5-m3-no-relitigation
- **Statement:** An M3 run on a class with an existing C2 surfaces only new disagreements; previously-attested verdicts are applied per the reconciliation table and listed as `- carried:` lines each citing the prior C2 version.
- **Boundary:** Proof = the M3 report's carried section is non-empty for unchanged attested rules and each carried line cites a version; a previously-ruled disagreement resurfacing as open violates.
- **Citation:** "**AC-L5 — M3 no-relitigation.** An M3 run on a class with an existing C2 surfaces only **new** disagreements; previously-attested verdicts are applied per the reconciliation table and listed as `- carried:` lines citing the prior C2 version. *Proof:* the M3 report's carried section is non-empty for unchanged attested rules; each cites a version."
- **Miners:** 3/3
- **Verdict:** verified

### R44 — v1-scope-exclusions
- **Statement:** v1 excludes exactly: the per-PR automated loop, multi-class sweep, non-.NET stacks, any archive of dropped tests, and automation of the human attestation itself.
- **Boundary:** Presence of any of these five in the v1 delivery violates the declared scope.
- **Citation:** "**Out of scope for v1:** the per-PR automated loop; multi-class sweep; non-.NET stacks; any archive of dropped tests; automation of the human attestation itself."
- **Miners:** 1/3 (miner-1 standalone; miners 2/3 cited individual exclusions inside other rows)
- **Verdict:** verified

---

## Owner Decisions (OD-L5, OD-L8)

### R45 — registry-attestation-path-is-repo-convention
- **Statement:** C1 + C2 live combined in the consuming repo beside its KB, defaulting to `docs/kb/golden/{Class}.md`; the path is a consuming-repo convention, never a harness constant.
- **Boundary:** A harness that hard-codes the storage path violates; the default applies absent a repo convention (e.g. SR may keep its `docs/audit/golden-set.md` lineage).
- **Citation:** "**OD-L5 — Registry + attestation live in the consuming repo beside its KB** (default `docs/kb/golden/{Class}.md` for C1+C2 combined; SR may keep its `docs/audit/golden-set.md` lineage — path is a consuming-repo convention, not a harness constant)."
- **Miners:** 3/3
- **Verdict:** verified

### R46 — trigger-confirmation-batched-no-new-stop
- **Statement:** The spec-arm run-confirmation is batched into the PO's existing spec-review checkpoint — one question batch carries both "self cross-check or critic?" and "run mine-from-spec once Ready?" — adding no new pipeline stop.
- **Boundary:** Any additional standalone confirmation stop for the spec-arm run, or splitting the two questions into separate batches, violates.
- **Citation:** "the run-confirmation is **batched into the PO's existing spec-review checkpoint** — one question batch carries both \"self cross-check or critic?\" and \"run mine-from-spec once Ready?\" (no new stop)."
- **Miners:** 3/3
- **Verdict:** verified

### R47 — ready-launches-background-mine-verify-parallel-to-plan
- **Statement:** On `Status: Ready`, the spec arm — Mine+Verify only — launches as a background agent while the architect proceeds to Phase-1/plan in parallel. (The original "in its own transient worktree" phrasing is superseded in-doc by the manifest-only amendment, R50.)
- **Boundary:** Launch condition = spec status transitions to Ready; scope = Mine+Verify only (no Cover); planning must not block on the run.
- **Citation:** "On `Status: Ready`, the spec arm (**Mine+Verify only**) launches as a **background agent in its own transient worktree** (the OD-L1 topology already provides it) while the architect proceeds to Phase-1/plan in parallel."
- **Miners:** 3/3
- **Verdict:** verified

### R48 — spec-version-stamp-and-delta-recheck
- **Statement:** The spec-arm run stamps the spec-doc version it mined; at plan-time join, a stamp mismatch (Phase-1 answers amended the spec) triggers a delta re-check of changed sections only — never a full re-run.
- **Boundary:** A run output without a spec-version stamp cannot support the join; on mismatch, the response must be section-scoped, not a re-mine.
- **Citation:** "The run **stamps the spec-doc version it mined**; at plan-time join, a stamp mismatch (Phase-1 answers amended the spec) triggers a **delta re-check of changed sections only**, not a re-run."
- **Miners:** 3/3 (merged: miner-3's run-stamps + stamp-mismatch rows)
- **Verdict:** verified

### R49 — cover-waits-for-plan
- **Statement:** Cover (test authoring) waits for the plan — it needs the target surface (class/API), which is a plan decision; pre-plan tests would bind to a guessed shape.
- **Boundary:** Any Cover/test authoring launched before the plan exists violates the ordering.
- **Citation:** "**Cover waits for the plan** — test authoring needs the target surface (class/API), which is a plan decision; pre-plan tests would bind to a guessed shape."
- **Miners:** 3/3
- **Verdict:** verified

### R50 — mine-verify-manifest-only-no-worktree
- **Statement:** (Amended 2026-07-03, owner-confirmed) The Mine+Verify slice runs manifest-only, no worktree — the enforced invariant is the disjoint input manifest (per Topology); worktrees return with Cover/merge.
- **Boundary:** Mine+Verify creating/requiring a worktree violates the amended contract; the disjoint-manifest check remains mandatory; Cover/merge phases do use worktrees.
- **Citation:** "**Amended 2026-07-03 (owner-confirmed, `adhoc-SpecArmTrigger` OD-T2):** the Mine+Verify slice runs manifest-only, no worktree — the enforced invariant is the disjoint input manifest (per Topology); worktrees return with Cover/merge."
- **Miners:** 3/3
- **Verdict:** verified

### R51 — gating-split-amendment
- **Statement:** (Amended) The Mine+Verify wiring is pulled forward out of the AC-6 gate into `adhoc-SpecArmTrigger`; only the Cover half + merge machinery remain fold-in-gated on the pilot's AC-6.
- **Boundary:** Shipping Cover/merge machinery before the pilot AC-6 verdict violates the gate; blocking the Mine+Verify wiring on AC-6 contradicts the pull-forward.
- **Citation:** "The Mine+Verify wiring itself is pulled forward out of the AC-6 gate into `adhoc-SpecArmTrigger`; only the Cover half + merge machinery remain fold-in-gated."
- **Miners:** 3/3 (miner-2/miner-3 standalone; miner-1 embedded in its manifest-only row)
- **Verdict:** verified

---

## Cross-references / meta

### R52 — shipped-skill-semantics-are-binding
- **Statement:** The shipped `mine-verify-cover` skill's categorical-KEEP and aggregate-gate semantics are binding constraints on C4, AC-L3, and AC-L4 — the lifecycle may not contradict them.
- **Boundary:** A triage/gate implementation that collapses categorical-KEEP (forcing one test per rule) or abandons aggregate gating breaks the constraint.
- **Citation:** "**Shipped baseline for M2's arm:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (+ `-dotnet` adapter). Its categorical-KEEP and aggregate-gate semantics are binding constraints on C4/AC-L3/AC-L4."
- **Miners:** 3/3
- **Verdict:** verified

### R53 — adrs-e-through-i-extracted-at-ship
- **Statement:** At ship, the five named ADRs (ADR-E one-attested-set/transient-arms; ADR-F recorded-not-relitigated verdicts; ADR-G merged-set-as-gated-unit; ADR-H drift v1; ADR-I spec-arm trigger wiring) are extracted per ADR-27/28.
- **Boundary:** Shipping the fold-in without extracting the five named ADRs violates the deferred-ADR commitment; violation observable in the ADR log.
- **Citation:** "## ADRs to extract (deferred to ship, per ADR-27/28 and the pilot precedent)" followed by the ADR-E … ADR-I list.
- **Miners:** 2/3 (miner-2, miner-3)
- **Verdict:** verified

### R54 — re-review-conditions
- **Statement:** Re-review of this spec is recommended only if the owner reverses OD-L2 or OD-L7 (they shape C3/C4), or if the parent pilot's AC-6 verdict invalidates the two-arm premise.
- **Boundary:** The closed trigger set for re-opening the review gate: {OD-L2 reversal, OD-L7 reversal, AC-6 invalidation}.
- **Citation:** "Re-review recommended only if the owner reverses OD-L2 or OD-L7 (they shape C3/C4), or if the parent pilot's AC-6 verdict invalidates the two-arm premise."
- **Miners:** 1/3 (miner-3)
- **Verdict:** ambiguous — "recommended" is advisory wording, not a binding commitment; skipping a re-review after an OD-L2/OD-L7 reversal is a judgment lapse with no doc-defined observable violation.

---

## Consolidation notes (merges performed)

- Mode rows (R04–R07): 3 differently-named rules per mode merged 3-way.
- AC-L3 cluster: miner-1's single combined AC-L3 row split across R19 (merged-set gate, joined with the C3 rows), R39 (M2 protocol), R40 (rate-delta advisory) to match miners 2/3's finer grain.
- AC-L4 cluster: miner-1's and miner-3's single AC-L4 rows split across R41 + R42, adopting miner-2's two-check split (cross-arm tags vs tag→registry join).
- Drift/AC-L6 cluster: miner-2's `architect-developer-symmetric-drift-rule` + `ac-l6-drift-rules-grep-checkable`, miner-3's `architect-developer-symmetric-drift-rule`, and miner-1's `ac-l6-drift-rules-shipped-in-three-agents` merged into R34 (same commitment: symmetric rule added by fold-in, presence grep-proved).
- Registry persistence: miner-3's combined `c1-m1-creates-m3-requires` split — its persistence clause merged with miner-2's `registry-survives-sessions` into R09; creates/requires merged 3-way into R12.
- OD-L8 stamp: miner-3's `run-stamps-spec-doc-version` + `stamp-mismatch-triggers-delta-recheck-only` merged into R48 (miners 1/2 had them combined).
- Gating split: miner-1 bundled the pull-forward into its manifest-only row; unbundled into R50 + R51 to match miners 2/3.
- Citation drift fixed: miner-1's verdict-grammar quote had collapsed backticks/fencing — re-quoted exactly from the doc (R15); miner-3's several "verbatim" shorthand citations expanded to the exact doc text.
