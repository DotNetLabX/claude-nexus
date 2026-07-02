# Tech-Spec — SDD Coverage Loop (v1)

**Slug:** adhoc-SddCoverageLoop
**Type:** Technical feature — architect owns the definition (ADR-27). Graduates from the sprint-rituals
`br-coverage` proposal family (ADR-28); that proposal stays the **binding pilot contract**.
**Status:** **Ready** (2026-07-01) — code-grounded critic pass folded (NO-GO → fixed; see `## Critic Review`);
owner resolved the load-bearing forks: **OD-5 = (a)** build a calculator-shaped spec front-end, keep the
SR/`BugRatioAnalyzer` pilot, reuse `spec-diff.mjs`; **OD-6 = (a)** author a golden-shaped intermediate from
the Fokus prose lineage. OD-1..4 taken at the recommended options (owner may revisit). `delivery/plan.md` may
now be written.
**Absorbs:** the tracked-but-unstarted "spec-driven Increment 3 = fold the spec-driven front-end into
`mine-verify-cover`" (`adhoc-SpecDrivenCoverValidate` Inc-3). This spec is the larger framing of that step.

---

## Context

Two rule-mining directions exist, and the value is in **comparing them**:

- **Code-mine** (`mine-verify-cover`, LIVE-PROVEN on 3 classes / 2 repos): Roslyn-grounded → mines rules
  **from code** → mutation-gated tests. It can only test behavior the code already exhibits — so on its own
  it pins incidental behavior and inherits the code's bugs.
- **Spec-mine** (`spec-cover.workflow.js`, **wired + offline-validated on `GeneratedSqlValidator`; live run
  operator-owed, not yet executed**): takes the **spec/intent** as the oracle → generates tests → diffs
  spec-rules against code behavior. It catches **sins of omission** (spec'd but not built/tested) that the
  code-mine structurally cannot see.

Run **both, blind to each other**, then diff: the intersection is behavior confirmed against intent; the
symmetric difference is the signal (spec∧¬code = missing feature; code∧¬spec = undocumented / enshrined bug).
The `spec-diff.mjs` three-axis diff already codes this comparison. **What is missing is the connective
tissue that makes the two runs line up on the same subject: a spec→plan→impl→class traceability join that
aims the code-mine at exactly the classes a given spec rule should live in.**

This is SDD done properly: the spec drives (the "should"), the code-mine reports the "is," and the diff is
the verification payoff. It is **not** TDD (both directions work on existing code) and it is not BDD ceremony
(no Gherkin, no collaborative spec-first) — it is spec-driven **verification**.

**Pilot / testbed:** `sprint-rituals` Fokus.Domain analytics. Canonical first target (name pinned — see the
MEDIUM finding): **`BugRatioAnalyzer.cs`** (public API `ComputeMultiSprint` / `ComputeSingleSprint`; has
code-mined tests + `harness/targets/bugratio.json`; golden rules GOLD-16..18 for scoring). The golden set
still attests these to `BugRatioCalculator.cs` — a **stale name** (the class was renamed, line numbers
preserved); flagged for a golden-set fix.

---

## What already exists — and the two net-new components

| Piece | State | Role in the loop |
|-------|-------|------------------|
| `mine-verify-cover` (skill) + `harness/cover.workflow.js` | Live-proven, shipped | **Code front-end** — the "is" side |
| `harness/lib/spec-diff.mjs` — `classifyRule`/`diffRules` | Proven, generic | **The diff** (rule-level, reusable as-is) |
| `spec-cover.workflow.js` (spec-load / Cover / runner / FP-labeler) | Validator-shaped; offline-validated only | **Partly reusable** — see CRITICAL: does NOT transfer to a calculator |
| `harness/targets/bugratio.json` | Exists (**code-mine** target) | Code-side target config for the pilot |
| SR `docs/audit/golden-set.md` (GOLD-16..18) | Frozen, harness-excluded | **Benchmark only** — scores recall/precision; never a run input |
| Fokus lineage docs (`D:\src\fokus\docs\kb/analytics/bug-ratio.md`, `kb/domain/ticket.md`) | Read-only, **prose** | **Spec source** for the spec front-end (shape gap — see OD-6) |
| `spec→plan→impl` chain; `create-implementation-plan` mandates **step→file** paths | Convention | Raw material for the trace-join (rule→file link is *optional* — see HIGH-5) |

**Two net-new components (not one):**
1. **The trace-join** — spec-rule → class(es), to aim the code-mine (below).
2. **A calculator-shaped spec front-end** — `spec-cover.workflow.js` is built end-to-end for a
   *first-violation-wins validator* (its spec-load returns a rule-name/enum, its Cover agent asserts
   *violation identity*, its runner reports `{expected, actual}` rule names, its FP-labeler is positional
   over `RULE_ORDER` + an `okValue` pass sentinel). A numeric analytics calculator has none of that surface.
   The genuinely reusable part is `spec-diff.mjs`'s rule-level three-axis diff. Building the calculator spec
   front-end (test model + red/`okValue` analog + labeler) is real work, not wiring. See OD-5.

---

## v1 Definition & Acceptance Criteria

The loop, in order:

```
  SPEC FRONT-END              TRACE-JOIN                 CODE FRONT-END           COMPARE
  spec-mine (from     ──►  map each spec rule    ──►  code-mine ONLY the    ──►  spec-diff.mjs
  intent docs) →           to its class(es) via       trace-selected             rule-level 3-axis
  spec-tests               plan/impl refs+locator      classes (aimed)           diff
       └──────────────── two runs, mutually BLIND, isolated locations ─────────────┘
```

- **AC-1 — Two mutually-blind runs.** The spec front-end and the code front-end execute in **isolated
  locations** (separate worktrees). The spec-miner's agents never receive the code-mined rules or tests; the
  code-miner uses **production source only**. *Proof:* a per-run input manifest + a pre-run tripwire
  assertion (mirrors the SR golden-set placement+tripwire, `golden-set.md:10-23`, and the spec-cover
  single-reader placement, `spec-cover.workflow.js:23-27`) that the forbidden paths appear in **no** agent
  prompt / config. Confidence: high (the enforcement pattern already exists twice).
- **AC-2 — Spec source ≠ golden set.** The spec front-end reads the **intent/spec lineage docs**, never
  `golden-set.md`. The golden set is used **post-hoc only** to score each run. *Proof:* golden-set path
  absent from both runs' input manifests. Confidence: high on the rule; the *oracle shape* to feed the
  spec-load agent is unresolved — see OD-6.
- **AC-3 — Trace-join.** Each spec-mined rule maps to 0..N target classes, **anchored on plan/impl file
  references** where present; the **spec-cover guided-miner** rule→code locator (~53–56%, `spec-diff.mjs:42`)
  is fallback only — never silently trusted; a low-confidence / no-match map routes to a **human queue**.
  *Proof:* a trace artifact — one row per rule → `class` with a `source` column (`plan-ref | locator | manual`)
  + confidence. Confidence: **medium** (the anchor is only partly guaranteed by convention — HIGH-5 — and the
  pilot exercises only the fallback; see OD-1).
- **AC-4 — The code-mine is aimed, not swept.** The code front-end runs **only** on the trace-selected
  classes. *Proof:* the code-mine target set equals the trace artifact's class set. Confidence: high.
- **AC-5 — The comparison (rule-level).** The diff produces the four buckets
  (spec∧¬code / code∧¬spec / both-divergent / both-agree) and the **rule-level intersection** (`both-agree`),
  reusing `spec-diff.mjs` (`:102-137`). *Proof:* every rule lands in exactly one bucket (the existing
  accounting in `spec-diff.mjs`). **This is a rule-set diff keyed by name+boundary — NOT a test-coverage
  metric.** If line/branch coverage overlap is also wanted, it comes separately from the code arm's coverlet,
  not from `spec-diff.mjs`. **Confidence: medium (calculator case)** — the two blind arms don't share rule names,
so `both-agree` needs a post-hoc rule-identity reconciliation crosswalk (plan Step 7) before `spec-diff` can
match; without it the intersection is empty by construction.
- **AC-6 — Pilot end-to-end.** The full loop runs on `BugRatioAnalyzer.cs` and emits a report giving, per run,
  recall/precision against GOLD-16..18, plus the intersection and the sins-of-omission list. *Proof:*
  `delivery/pilot-bugratio.md` cites `.runs/` evidence. **The live spec-arm run is operator-owed**
  (`spec-cover.workflow.js:55-57`); a build-only PASS **does not** prove the live comparison **nor** the
  plan-ref trace anchor (the SR port has no plan chain — only the locator + manual map are exercised).
  Confidence: medium, contingent on OD-1/OD-5/OD-6 + live toolchain.

**Out of scope for v1 (named, not built):** multi-class sweep; the automated per-PR loop; adapter extraction;
any language beyond .NET. These stay under the `mine-verify-cover` roadmap's deferred items.

---

## The trace-join — the crux (design intent, not implementation)

The join answers "which class(es) implement this spec rule?" so the two runs compare on the same subject.

- **Anchor on structure where the convention guarantees it.** `create-implementation-plan` mandates
  **step→file** paths (`SKILL.md:34`), so a slug's plan reliably names the files a step touches. It does
  **not** mandate a **rule→file** link — the `Satisfies:` annotation is explicitly *optional*
  (`SKILL.md:70-78`). So the durable rule→class anchor exists only where `Satisfies:` is present; for
  join-eligible slugs the loop should **require `Satisfies:` on rule-bearing steps**, else the anchor is
  best-effort.
- **Locator as fallback only.** Where no plan/impl reference exists (e.g. a ported/legacy class with no nexus
  slug — the SR analytics case), fall back to the **spec-cover guided-miner** rule→code locator, **flagged**
  `locator` source and subject to the low-confidence → human-queue rule.
- **This is the spec-driven analog** of the deferred graph-scoped *target selection* in the
  `mine-verify-cover` roadmap ("structure scopes behavior"): here **spec scopes which classes to code-mine**.
  (That mine-verify-cover feature is the *analog*, not the source of the locator.)

For the BugRatio pilot specifically: SR's analytics classes are a *port* (no nexus plan chain), so the pilot
join uses the guided-miner locator + a **human-confirmed manual map** for GOLD-16..18 → `BugRatioAnalyzer.cs`.
That is acceptable for the first pilot (OD-1) — but it means AC-6 proves the fallback, not the plan-ref anchor.

---

## ADRs to extract (deferred to ship — roadmap step 4, per ADR-27/28)

Formal extraction into the nexus ADR register (`docs/architecture/README.md`) is **deferred to ship**, matching
the `mine-verify-cover` precedent ("promote to its own ADR when built") — this is dev-repo `harness/` work that
ships nothing until the skill lands. The stubs below are the durable one-decision records to extract then.


- **ADR-A — The SDD coverage loop.** = a spec front-end + trace-join + code front-end (`mine-verify-cover`),
  run as two mutually-blind passes and compared by `spec-diff`. Absorbs spec-driven Inc-3. **Note:** the spec
  front-end for a numeric calculator is net-new; only `spec-diff.mjs` transfers from the validator harness.
- **ADR-B — The trace-join anchors on plan/impl references; the spec-cover guided-miner locator is fallback.**
  Low-confidence maps route to a human queue, never silently accepted. Spec scopes which classes the code-mine
  runs on.
- **ADR-C — Golden set stays the sequestered benchmark; the spec source is the intent/spec lineage, never
  the golden set.** Both runs are scored against the golden set post-hoc. (Reconciles the golden-set's
  opposite roles between the SR code-mine and the KG spec-cover.)
- **ADR-D — Independence is enforced by placement + tripwire, not trust.** Per-run input manifest + a
  forbidden-path assertion, mirroring the two existing enforcement precedents.

---

## Open Decisions (for the owner, before `Ready`)

**Resolved 2026-07-01 (owner):** OD-5 → **(a)** build calculator spec front-end, keep SR/`BugRatioAnalyzer`,
reuse `spec-diff.mjs`; OD-6 → **(a)** author a golden-shaped intermediate from the Fokus prose; OD-1..4 →
taken at the recommended options (owner may revisit). Details below.

- **OD-1 — Trace-join automation level for v1.** Rec: plan-ref anchor + guided-miner locator fallback +
  human-confirm at low confidence, with a **human-confirmed manual map for the first BugRatio pilot** (the SR
  port has no plan chain). Confidence: medium.
- **OD-2 — Ship shape: mode vs new skill.** Rec: a **mode/front-end of `mine-verify-cover`** (the Inc-3
  framing), not a standalone skill. Confidence: medium.
- **OD-3 — Spec source doc set for the pilot.** Rec: Fokus `kb/analytics/bug-ratio.md` + `kb/domain/ticket.md`
  (GOLD-16). Confidence: medium.
- **OD-4 — Physical isolation mechanism.** Rec: two SR git worktrees, one input manifest each. Confidence: high.
- **OD-5 — [CRITICAL fork] The spec-cover reuse scope, given the pilot target is a calculator.** The
  validator-shaped spec-cover does not transfer to `BugRatioAnalyzer`. Three ways forward:
  - **(a) Build a calculator-shaped spec front-end** reusing only `spec-diff.mjs` — keep the SR/BugRatio
    pilot; accept two net-new components. *Rec — it matches your "use SR, both halves" intent.* Confidence: medium.
  - **(b) Pick a validator-shaped pilot target** so spec-cover reuses wholesale — but SR analytics are all
    calculators; this means a KG/validator class and loses SR's ready code-mined side. Confidence: low.
  - **(c) Prove the loop on `spec-diff.mjs` alone** with a hand-authored spec-rule set for BugRatio (no spec
    front-end automation in v1) — smallest, but the spec arm isn't automated. Confidence: medium.
- **OD-6 — [HIGH fork] Spec-oracle shape.** The spec-load schema is golden-shaped (GOLD-ids, ruleName→RULE_ORDER,
  codeAttestation, boundary); the Fokus spec source is prose. Either **(a)** author a golden-shaped
  intermediate from the lineage (deterministic, but a manual authoring step), or **(b)** extend the spec-load
  agent to mine structure from prose (harder, less deterministic, unbudgeted). Rec: (a) for the pilot.
  Confidence: medium. (Also: a spec-side target config must be added — `bugratio.json` is a code-mine target.)

---

## Roadmap (named only — NOT planned here)

1. **v1 pilot** — the loop end-to-end on `BugRatioAnalyzer.cs` (this spec).
2. Generalize the trace-join off the pilot (plan-ref anchor as primary once a slug-chained class is targeted).
3. Multi-class sweep + the code-mine roadmap's deferred Discover/3b seam.
4. Harden to the shipped skill estate (mode folded into `mine-verify-cover`), `release-plugin`, ADR promotion.

Dev-repo `harness/` machinery until step 4 — **ships nothing to users, no plugin bump** until the skill lands.

---

## Cross-references

- **Binding pilot contract:** `sprint-rituals/docs/proposals/br-coverage-loop-harness.md` (+ golden-set,
  research doc). This spec must not contradict that proposal's Pass roadmap.
- **Absorbs:** `adhoc-SpecDrivenCoverValidate` Inc-3.
- **Reuses:** `mine-verify-cover` (+ `-dotnet`), `harness/lib/spec-diff.mjs` (the diff), `harness/targets/
  bugratio.json` (code-mine target). **Partly reuses** `spec-cover.workflow.js` (see CRITICAL / OD-5).

---

## Critic Review

**Mode:** code-grounded Mode 2 (tech-spec vs live harness). **Verdict:** NO-GO for `Ready` as first written;
GO-with-fixes on the approach. 1 CRITICAL + 5 HIGH + 1 MEDIUM — **all accepted**. This revision applies the
pure corrections and captures the two genuine forks as OD-5/OD-6.

| # | Finding | Disposition in this revision |
|---|---------|------------------------------|
| CRITICAL | spec-cover is validator-shaped; pilot target is a calculator — "retarget = wiring" is wrong | **Fixed** — thesis reframed to *two* net-new components; fork captured as **OD-5** (owner call) |
| HIGH-1 | rule→code locator mis-attributed to `mine-verify-cover` | **Fixed** — reattributed to the spec-cover guided-miner (AC-3, trace-join, ADR-B) |
| HIGH-2 | AC-5 "test-coverage intersection" is rule-level | **Fixed** — reworded to rule-level `both-agree`; coverage disclaimed |
| HIGH-3 | spec-oracle shape gap (golden-shaped schema vs prose source); no OD; no spec-side target config | **Fixed** — captured as **OD-6**; spec-side target config noted |
| HIGH-4 | "Proven KG-side" overstated (live run operator-owed) | **Fixed** — restated as wired + offline-validated; AC-6 marks the live run operator-owed |
| HIGH-5 | trace anchor rests on the *optional* `Satisfies:` link; pilot can't exercise it | **Fixed** — precise step→file vs rule→file split; AC-6 states PASS doesn't prove the anchor |
| MEDIUM | 3-way target-name divergence; stale golden attestation | **Fixed** — canonical target pinned `BugRatioAnalyzer.cs`; golden staleness flagged |

**Systemic root cause (adversarial-mode note, accepted):** the first draft built composition claims from the
harness's *self-description* (headers, ADR labels, the loop-diagram vocabulary) rather than from tracing the
actual agent prompts / return schemas / the pilot class's real API — the same "doc-only pass is blind" failure
the Review gate warns against, turned on the harness's own headers. The fix applied: reuse claims re-grounded
on concrete prompt/schema/API; the "single new component / everything is wiring" framing corrected.

---

## Review gate

Code-grounded critic (Mode 2) — **done** (above). Re-review after the owner resolves OD-5/OD-6 is
recommended only if their resolution changes the composition (e.g. OD-5(b) changes the pilot target).
