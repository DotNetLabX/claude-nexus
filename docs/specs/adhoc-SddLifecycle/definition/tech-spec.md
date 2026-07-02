# Tech-Spec — SDD Golden-Set Lifecycle (v1)

**Slug:** adhoc-SddLifecycle
**Type:** Technical feature — architect owns the definition (ADR-27). Successor framing to
`adhoc-SddCoverageLoop` (the pilot machinery): that spec defines **one run** of the loop; this spec defines
the **lifecycle** — how the loop's outputs are merged, attested, protected, and evolved across sessions.
**Status:** **Ready** (2026-07-02) — code-grounded critic pass folded (REVISE → fixed; see `## Critic
Review`). Implementation remains gated on the parent pilot's AC-6 verdict (below).
**Depends on:** the `adhoc-SddCoverageLoop` pilot verdict (its AC-6). The lifecycle contracts below assume
the two-arm loop works; a pilot NO-GO invalidates M1/M3 as designed (M2's *arm* stands regardless — the
code arm is shipped `mine-verify-cover`; M2's cross-refactor protocol is net-new, see below).
**Implementation vehicle:** the skill fold-in (`adhoc-SddCoverageLoop` roadmap step 4). Nothing here ships
independently; this spec exists so the fold-in implements contracts, not improvisation.

---

## Context

The pilot machinery (built, offline-proven) is **built to produce** two blind rule sets + test sets and a
reconciled diff — the live two-arm run is operator-owed and the parent's AC-6 is pending; the reconciled
diff is so far proven only synthetically (`rule-crosswalk.test.mjs`). What the parent deliberately does not
define: what happens **after** the diff. The owner's driving constraint: **when a feature is finished there
is exactly ONE test set** — the best of both arms — plus the durable records that let a later session
update it without re-litigating old decisions.

Four lifecycle modes, one system:

| Mode | Trigger | Arms | Output |
|------|---------|------|--------|
| **M0 — Greenfield** | Spec exists, code doesn't | Spec arm only | Red suite = the SDD starting point; code is written to turn it green |
| **M1 — Create** | Code + spec both exist, no golden set | Both, blind → triage merge | Attested golden set (rules + ONE test set) |
| **M2 — Protect** | Refactor of a covered class | Code arm only (the arm is shipped `mine-verify-cover`; the cross-refactor protocol below is net-new) | Safety net; suite-green + floor re-clear across the refactor |
| **M3 — Evolve** | Feature update on a class with an existing attested set | Both, blind → three-way reconciliation (defined below) | add / re-open / supersede / retire / carried per rule + re-attestation |

---

## Contracts (the durable artifacts)

### C1 — Canonical rule registry (per class, persistent) — NET-NEW
A stateful per-class identity registry that survives sessions. **Net-new work**: the pilot's
`rule-crosswalk.mjs` is a stateless per-run `Record<string,string>` name-rewrite — the seed is its
alias→name mapping idea only; the registry's lifecycle fields, persistence, and re-binding have no
existing implementation.

**Identity model (resolved):** the **canonical rule NAME is the identity key** — it is what
`spec-diff`'s `ruleKey = ruleName ?? id` already matches on, so the diff layer is not re-keyed. There is
no separate canonical id. One row per rule: canonical name, per-arm aliases (code-arm `BR-n` ids,
spec-arm authored names), status (`active | superseded | retired`), first-seen, last-confirmed. A rule
*rename* is a supersede: new canonical name, old row marked `superseded → {new-name}`. M1 creates the
registry; M3 requires it.

### C2 — Attestation record (per class, versioned)
The record of the merge-triage verdicts: final rule list; **one verdict per disagreement**; the code sha +
spec-doc version it was decided against; attestor + date. Dropped from-spec tests are **deleted, not
archived** — the verdict line is the durable trace (OD-L3).

**Verdict-line grammar (machine-checkable, pinned for AC-L2/AC-L5):**
```
- verdict: {spec-wins|code-wins|promote|incidental} | rule: {canonical-name} | why: {one line}
- carried: {canonical-name} | from: {prior C2 version}
```
This is what lets M3 distinguish "already ruled code-wins on rule X" from "new disagreement." SR's
`docs/audit/golden-set.md` is the precedent for a per-class attested rule record — with the role
difference that the golden set is a deliberately **frozen** benchmark, while C2 is **versioned and
living**; C2's version stamp is what makes staleness visible instead of silent.

### C3 — The merged test set (ONE durable set)
The merged set lands in the **consuming repo's real test project** — the code arm's home (e.g. SR's
`Fokus.Domain.Tests`); the spec arm's throwaway harness project dissolves at merge (OD-L7). Every kept
test carries a provenance tag (`spec | code | both` + canonical rule name). The **merged set as a whole**
must pass the mutation gate at the adapter's floor — gating each arm separately does not prove the
merged/pruned set still bites (AC-L3).

### C4 — Triage protocol (quadrant semantics)
Agents propose, a human attests:
- `both-agree` → keep **one arm's** tests per rule; default the code arm's kept set — which is legitimately
  1..N tests under the shared rule name (main assertion + categorical-KEEP boundary tests, per
  `mine-verify-cover`'s Minimize guard) — and drop the spec-arm variant, unless the spec-arm test is
  strictly clearer (OD-L2). The invariant is **no cross-arm double-maintenance**, not "one test per rule."
- `spec∧¬code` → per-rule verdict: **spec-wins** (real bug: test stays red, code gets fixed) or
  **code-wins** (stale spec: spec doc updated, from-spec test dropped + verdict recorded in C2).
- `code∧¬spec` → per-rule verdict: **promote** (behavior becomes spec — spec doc updated, test kept) or
  **incidental** (regression-pin or drop; recorded either way).

---

## M3 reconciliation semantics (the three-way rules)

M3 = the two-way diff of the **new** arms, combined with the **prior C2**. Net-new logic (the harness diff
is two-way only). Disposition per rule, keyed on (prior-C2 status, prior verdict, new two-way bucket):

| Prior C2 | New arms | Disposition |
|----------|----------|-------------|
| Not present | Any bucket | **add** — normal M1 triage for this rule |
| Attested, verdict recorded | Same bucket, evidence consistent with the verdict | **carried** — auto-applied, listed with prior C2 version (AC-L5) |
| Attested | New evidence contradicts the recorded verdict (e.g. was `code-wins`, spec doc now re-asserts the rule) | **re-open** — new human verdict; never auto-override a recorded verdict |
| Attested | Rule's boundary/outcome changed but rule persists in both arms | **supersede** — same canonical name, new version; old test replaced |
| Attested | Absent from **both** new arms | **retire** — rule left both spec and code |
| Attested (spec-backed) | Absent from new-spec, present in new-code | **re-open as retire-candidate** — human confirms retire vs enshrine; never auto-retire on spec-side disappearance alone |

---

## Topology

**2 transient worktrees + 1 durable merged test project** — not three standing projects. The isolation
constraint binds only while the arms author; after the triage merge, arm outputs are disposable run
artifacts (`.runs/` audit trail), and only the merged set + C1 + C2 persist. (Worktrees are the isolation
*mechanism*; the enforced invariant is disjoint input manifests — `independence-check.mjs` — which is
placement-independent.)

---

## Drift policy (v1)

- **Team lane:** discretionary today — the architect's general KB-reading, **not** an encoded rule (no
  agent instruction checks attestations). The fold-in adds the symmetric attestation-check rule to
  **architect and developer** alongside solo, converting discretion into rule.
- **Solo lane:** new rule owed to the solo agent — *touched class has an attested golden set (C2 exists) →
  update the affected tests in the same pass, or flag an M3 re-mine*.
- **Mechanical backstop (free):** the merged set lives in the consuming repo's normal suite — drift that
  *breaks* an attested rule fails CI regardless of process discipline.
- **Accepted v1 gap (named, not solved):** **additive drift** — new behavior in a covered class keeps all
  tests green while the golden set silently under-covers. Only the per-PR loop (out of scope, roadmap)
  closes this. v1 accepts it explicitly.

---

## v1 Acceptance Criteria

- **AC-L1 — Registry stability.** Two consecutive runs on the same class yield identical canonical names
  for unchanged rules; a changed arm alias re-binds to the same canonical name via C1, not a new row.
  *Proof:* registry diff across two runs shows zero identity churn on unchanged rules.
- **AC-L2 — Attestation completeness.** After an M1 merge, every `spec∧¬code` and `code∧¬spec` rule has
  exactly one verdict line (the pinned grammar) in C2; zero unresolved disagreements in an attested set.
  *Proof:* `grep -c '^- verdict:'` in C2 == count of disagreement-quadrant rules in the run report.
- **AC-L3 — Merged-set gate + M2 protocol.** The merged test set passes the adapter's mutation floor as a
  set. For M2: **every pre-refactor gated test stays green post-refactor (`suite_green`), and the
  re-gated whole-class reachable kill clears the adapter floor.** A kill-rate before/after delta is
  **advisory only** — the mutant population (denominator) changes with the source, so a rate comparison is
  not apples-to-apples and is never the pass/fail criterion.
  *Proof:* gate reports (suite_green + floor) before and after; two floor checks, not a rate-delta judgment.
- **AC-L4 — One-set invariant (no cross-arm double-maintenance).** After merge, no rule is asserted by
  **both arms'** tests — the dropped arm's variant is removed; a rule may legitimately carry the kept
  arm's 1..N tests (categorical-KEEP preserved). Every kept test's provenance tag resolves to a C1 row.
  *Proof:* no canonical name has tests tagged both `spec` and `code`; tag→registry join has no orphans.
- **AC-L5 — M3 no-relitigation.** An M3 run on a class with an existing C2 surfaces only **new**
  disagreements; previously-attested verdicts are applied per the reconciliation table and listed as
  `- carried:` lines citing the prior C2 version.
  *Proof:* the M3 report's carried section is non-empty for unchanged attested rules; each cites a version.
- **AC-L6 — Drift rules shipped.** The solo agent's shipped instructions contain the C2-check rule; the
  architect and developer files carry the symmetric check (per Drift policy).
  *Proof:* grep the three agent files for the attestation check. (Effectiveness is process-level; only the
  rules' presence is grep-checkable.)

**Out of scope for v1:** the per-PR automated loop; multi-class sweep; non-.NET stacks; any archive of
dropped tests; automation of the human attestation itself.

---

## Owner Decisions

Settled in discussion with the owner (2026-07-02):

- **OD-L1 — Topology = 2 transient worktrees + 1 durable merged project.** (Owner asked "3 projects?";
  resolved to 2+1 — isolation is an authoring-time constraint, not a storage design.) Confidence: high.
- **OD-L2 — `both-agree` keeps the code arm's kept test set by default** (mutation-killed evidence,
  categorical-KEEP intact), spec-arm variant only when strictly clearer. Confidence: medium (default may
  flip per-class; C2 records exceptions).
- **OD-L3 — Dropped from-spec tests are deleted + recorded in C2, no archive.** The verdict is the trace;
  an archive is dead weight. Confidence: high (owner-proposed).
- **OD-L4 — Solo-awareness rule is the v1 drift answer**, additive drift explicitly accepted until the
  per-PR loop. Confidence: medium-high (owner-proposed; the named gap is real but bounded by CI backstop).
- **OD-L5 — Registry + attestation live in the consuming repo beside its KB** (default
  `docs/kb/golden/{Class}.md` for C1+C2 combined; SR may keep its `docs/audit/golden-set.md` lineage —
  path is a consuming-repo convention, not a harness constant). Confidence: medium.
- **OD-L6 — M0 (greenfield) is a named mode with no new machinery** — it is the spec arm run alone; its
  output is the red suite. Confidence: high.
- **OD-L7 — The merged set's home is the consuming repo's real test project** (the code arm's home); the
  spec arm's harness project is transient and dissolves at merge. Confidence: medium (architect-resolved
  from the critic's topology gap; owner may relocate per repo convention).

---

## ADRs to extract (deferred to ship, per ADR-27/28 and the pilot precedent)

- **ADR-E — One attested golden set per class; arms are transient.** (C1/C2/C3 + OD-L1/OD-L7.)
- **ADR-F — Triage verdicts are recorded, not re-litigated.** (C2 grammar + AC-L5 + the M3 table;
  code→spec reconciliation is a first-class verdict, spec is updated when code wins.)
- **ADR-G — The merged set is the gated unit; M2 safety = suite-green + floor re-clear, never a
  kill-rate delta.** (AC-L3.)
- **ADR-H — Drift v1 = encoded agent awareness (solo/architect/developer) + CI backstop; additive drift
  deferred to the per-PR loop.**

---

## Cross-references

- **Parent machinery:** `docs/specs/adhoc-SddCoverageLoop/definition/tech-spec.md` (the one-run loop; its
  AC-6 pilot is this spec's entry gate).
- **Shipped baseline for M2's arm:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (+ `-dotnet`
  adapter). Its categorical-KEEP and aggregate-gate semantics are binding constraints on C4/AC-L3/AC-L4.
- **Attestation precedent:** `sprint-rituals/docs/audit/golden-set.md` (GOLD ids, sequestration, tripwire).
- **Registry seed (idea only — C1 is net-new):** the pilot's `rule-crosswalk.mjs` alias→name mapping +
  `trace-map-bugratio.md`.

---

## Critic Review

**Mode:** code-grounded Mode 1 (tech-spec vs live harness + shipped skill + parent artifacts).
**Verdict:** REVISE — 4 HIGH + 3 MEDIUM, 0 CRITICAL — **all accepted**; this revision applies them.

| # | Finding | Disposition in this revision |
|---|---------|------------------------------|
| HIGH-A | AC-L4 "count == 1" contradicts `mine-verify-cover` categorical-KEEP (1..N tests per rule by design) | **Fixed** — invariant reframed to *no cross-arm double-maintenance*; C4/OD-L2 keep the code arm's 1..N set |
| HIGH-B | M2 "kill-rate non-decrease" is not a shipped comparison; whole-file rate + changing denominator | **Fixed** — M2 criterion = suite_green + floor re-clear; rate delta demoted to advisory; "already shipped" claim scoped to the arm |
| HIGH-C | M3 three-way diff asserted "mechanical" but undefined and unbuilt | **Fixed** — reconciliation table specified (add/carried/re-open/supersede/retire + the spec-disappearance edge); named net-new |
| HIGH-D | C1 "generalizes the crosswalk" understates net-new; canonical id contradicts the name-keyed diff | **Fixed** — C1 declared net-new (seed = idea only); identity key resolved to canonical NAME, no separate id, diff layer unchanged |
| MEDIUM-A | AC-L2's grep proof had no verdict grammar | **Fixed** — C2 verdict/carried line grammar pinned |
| MEDIUM-B | "Team lane: covered (existing behavior)" ungrounded — no agent rule exists | **Fixed** — restated as discretionary today; fold-in adds architect+developer rules; AC-L6 widened |
| MEDIUM-C | Context overstated the pilot's realized state (live run not executed) | **Fixed** — "built to produce"; AC-6 pending stated |
| LOW | Frozen-golden-set staleness framed as the C2-preventable failure | **Fixed** — reframed as frozen-benchmark vs versioned-living contrast |

**Systemic root cause (accepted):** the draft repeated, one level up, the parent spec's original failure —
composition claims grounded in module/skill *vocabulary* ("crosswalk", "mutation-gated", "already
shipped") rather than the concrete module shapes (`rule-crosswalk.mjs` = stateless name-map;
`cover-gates.mjs` = whole-file rate; categorical-KEEP = multiple tests per rule). Fix applied: every
reuse claim re-grounded; net-new work named net-new (C1 registry, M2 protocol, M3 table).

---

## Review gate

Code-grounded critic (Mode 1) — **done** (above). Re-review recommended only if the owner reverses OD-L2
or OD-L7 (they shape C3/C4), or if the parent pilot's AC-6 verdict invalidates the two-arm premise.
