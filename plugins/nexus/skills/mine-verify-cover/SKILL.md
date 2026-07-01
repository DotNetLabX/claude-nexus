---
name: mine-verify-cover
description: Discover, verify, and mutation-gate the business rules of ONE class — clean-room miners extract the rules, a skeptic verifies them, a Cover agent writes tests, and a mutation gate proves the tests actually catch bugs. Produces a verified rule KB plus a gated test suite. Stack-neutral method; pair with a stack adapter (e.g. mine-verify-cover-dotnet) for the toolchain. Use when you need trustworthy code-grounded rule docs and/or regression tests for a rule-rich class — or Mine→Verify alone for a KB with no test toolchain.
user-invocable: true
---

# Mine→Verify→Cover

Point this at ONE production class. It produces two things, automatically:

1. A **verified business-rule KB entry** — the rules the class actually enforces, each re-checked against the code.
2. A **mutation-gated test suite** — one test per rule, proven to catch real bugs (not just pass).

It **reverse-engineers** the rules already encoded in the code — it documents what the code *does*, not what it *should* do. It never edits the production class, and it never deletes a failing test to go green.

This is the **stack-neutral method**. The toolchain (test runner, mutation tool, test style) comes from a paired **stack adapter** skill — `mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter, `mine-verify-cover-cpp` for C/C++. The method here does not change per language; only the adapter does.

## The pipeline

```
Mine        3 clean-room miners read ONLY the one source class and extract every rule it encodes
Consolidate merge the 3 into consensus rules with agreement counts + transcribed/interpretive triage
Verify      a fresh skeptic re-checks each rule against the code: CONFIRMED / WRONG / IMPRECISE
KB write    serialize the verified rules into the project KB (status: verified) — the Verify→Cover seam
Cover       a Cover agent writes example + property tests (never categorically-dead ones — see Safety rails); the adapter runs the suite + mutation tool
Gate        the orchestrator scores the §gate-battery; surviving mutants feed back to Cover; loop to floor
Minimize    a minimize agent attributes each test to the mutant(s) it kills (by reasoning, no re-runs) and proposes removals; the orchestrator applies them and confirms
Report      auto-write the run report; flip the KB entry verified → mutation-gated on all-gates-green
```

One class per run. The orchestrator is deterministic and trusted; the agents do all reading/writing (the orchestrator has no filesystem). See `kb-entry-schema` for the KB shape and `tdd` for the test discipline the Cover agent follows.

## Two modes

- **Full** (needs a stack adapter): Mine→Verify→Cover→Gate→Report. Yields the verified KB *and* the gated tests.
- **Mine→Verify only** (no adapter, no toolchain): stops after KB write. Yields a **verified rule KB** for any language — even code you cannot build. Use this as a standalone code-grounded KB generator (a clean input for documentation, drift-checking, or a broader KB to ingest).

## The gate battery (never fake green)

Every gate is computed by the orchestrator from the adapter's raw output — no agent self-reports a gate. All must pass:

| Gate | Passes when |
|------|-------------|
| `target_mutated` | the mutation report ACTUALLY mutated the target file (anti-fake-green — match the FULL source path, never the basename) |
| `suite_green` | the test suite is run twice and is fully green both times |
| `no_flaky` | the two runs report identical pass/fail/skip counts |
| `mutation_floor` | reachable mutation kill is at or above the floor (default 75%); a Timeout counts as a kill |
| `no_new_skips` | the suite adds no skipped tests over the measured baseline |
| `char_pin` | the production source was not changed (only Stryker-disable annotations are allowed) |

`mutation_floor` measures **reachable** kill: mutants in known-dead lines are excluded only when the KB pre-documents them (default: exclude none). A sub-100% honest kill is a pass when it clears the floor — report the residual survivors, never hide them.

**Anti-fake-green invariant:** before scoring `mutation_floor`, cross-check the agent-reported mutant TOTAL against the tool summary's `Found N`. If they differ, halt and flag — a mismatch indicates the gate is scoring on a partial mutant set (e.g. a survivor-only XML output read as the full set). The stack adapter's summary parse is the authoritative total; the gate must not proceed on an unverified count.

## The Minimize stage

Runs **after** Gate reaches the mutation floor and **before** Report — the architectural **dual of
classify-survivors** (the stage below): that stage tags unkilled *mutants*; this one tags *tests* that
kill nothing new. Suite target is **rule-traceable, not mutation-minimal** — trim true duplicates and
categorically-dead tests, keep every test that documents a distinct verified rule.

**Who attributes redundancy.** A **minimize agent** (source + suite + the final-iteration survivor list,
model: sonnet) reconstructs, by **reasoning**, which mutant(s) each test kills and proposes removals. The
mutation tool reports only aggregate survivors, never which *test* killed which mutant — so the
attribution is an explicit **hypothesis**, not a verified fact, and nothing re-runs per-test to check it
up front. Same actor split as classify-survivors: the agent proposes, the orchestrator only
records/routes, and **never derives** a removal itself.

**The rule-traceable removal rule.** Propose removing test T only if (a) every mutant T is reasoned to
kill is ALSO killed by a retained test, AND (b) T documents no distinct verified rule. A test that
uniquely documents a distinct verified rule is kept even when it is mutation-redundant.

**The four categorical-dead classes** (always removable, regardless of the rule they were generated
against):
1. Log-only — asserts on log/no-output side effects only.
2. Occurrence-count escalation — a near-duplicate that only escalates a call-count assertion.
3. Same-call-same-assertion under two rule labels — two tests with identical call + assertion, filed
   against two different rule IDs.
4. Boundary test with no distinguishing input — a "boundary" test that never actually constructs the
   input that distinguishes the boundary.

**Actor split / I/O ownership.** The orchestrator has no filesystem, so every I/O step here is an agent,
same as everywhere else in this method: the minimize agent reads and reasons (no writes); a
**write-owning agent** applies the proposed removal to the test file (and restores it on regression); the
**runner agent** re-runs the gate. The orchestrator only routes the proposal between agents and makes the
pure accept/restore decision — it never edits a file and never re-runs a mutation tool itself.

**The fail-closed confirm.** Because attribution is fallible reasoning no tool can verify, the confirm is
the ONLY safety net — a removal is verified, never trusted. After the write-owning agent removes the
proposed tests, the runner agent re-runs the FULL gate on the reduced suite, producing a fresh result; the
orchestrator compares the EXACT reachable killed-count (never the rounded score — a one-mutant drop on a
large denominator can round away) against the pre-minimize count:
- unchanged → accept the trim;
- any drop → instruct the write-owning agent to restore every removed test.

This is the anti-fake-green invariant, applied to test removal — equivalently, the mutation ratchet
applied post-floor instead of mid-loop. Full re-gate is the sound default: it inherits every guard the
gate battery above already has. A targeted at-risk-line re-mutation is an optional cost optimization only
where the mutation tool supports line-scoping — the adapter states which applies.

**Report line.** Every run reports `minimized: removed N tests, reachable kill X%→X% (confirmed
unchanged)`; a held-back minimize (the confirm regressed) reports `held-back: confirm-regression` with the
restored count instead. Never a silent trim.

## The Report stage — survivor classification

The Report stage does more than write a pass/fail number: every run **classifies its residual survivors** so the output drives code cleanup, not just a gate verdict. Each surviving mutant the gate reports carries exactly one tag, and **who can assign the tag depends on what the tag needs to see**:

| Tag | Assigned by | Why |
|-----|-------------|-----|
| `equivalent-logging` | the **orchestrator**, as a pre-tag — but ONLY when the stack adapter supplies the no-output (log-call) line set; otherwise the survivor is left `unclassified` for the agent | needs only a line-membership test against an adapter/KB signal, which the orchestrator can do without source |
| `equivalent-format` | the **classify-survivors agent** | needs both use-sites of the mutated key/format — a source property |
| `dead-code` | the **classify-survivors agent** | a cross-procedural call-graph property (no caller reaches the branch) |
| `masked` | the **classify-survivors agent** | a whole-source semantic property (a fallback/`else` reproduces the result) |
| `REAL-gap` | the **classify-survivors agent** — and only as the verdict *after* it fails to prove the mutant equivalent/dead/masked | the default this stage exists to STOP the orchestrator from reaching for blindly |

**The orchestrator never defaults an unprovable survivor to `REAL-gap`.** The source-dependent tags (`equivalent-format`/`dead-code`/`masked`/`REAL-gap`) are assigned by a **classify-survivors agent with source + KB access**; the orchestrator only *records* the agent's verdict. The orchestrator (no filesystem) can pre-tag only `equivalent-logging`, and only against an adapter-supplied log-line set — a line *number* is not enough on its own, so without that signal the survivor stays *untagged* and is handed to the classify-survivors agent. This split is load-bearing: a pure classifier over mutant metadata cannot derive a source-semantic tag, and defaulting the unprovable ones to `REAL-gap` reproduces the exact defect this stage removes.

**Only `REAL-gap` *should* drive another Cover iteration — but the re-feed filter is two-tier.** *Mid-loop* (inside the Cover→Gate iteration) the orchestrator can withhold only the survivors it can tag without source: its own `equivalent-logging` pre-tags. The source-dependent tags are not known until the **classify-survivors agent runs at the Report stage**, *after* the loop — so mid-loop the un-pre-tagged survivors (dead/masked/format and genuine gaps alike) are *not* filtered out per iteration; the Cover agent keeps trying to kill them until the floor or the iteration cap is reached, which is correct because a mid-loop run cannot yet prove a survivor equivalent. The full "only `REAL-gap` is worth chasing" rule is therefore a **Report-stage / follow-up-run property**, not a single per-iteration filter: the classification tells the operator which residual survivors a *next* run should target (`REAL-gap`) and which to exclude via `expectedSurvivorLines` (the equivalents).

**`unclassified` — the agent-non-response terminal state.** A survivor the orchestrator cannot pre-tag is handed to the classify-survivors agent untagged, and the agent assigns one of the four source-dependent tags. If the agent returns **no verdict** for such a survivor (a non-response), the orchestrator records it as `unclassified` — a loud, **logged** terminal state, never silently defaulted to `REAL-gap` or to an equivalent tag. An `unclassified` survivor in the report means the classify step did not cover it and the operator must look.

**Classification authority — the final iteration.** Run the classification on the **final** iteration's residual survivors (after `expectedSurvivorLines` exclusions are known), so the tagged set does not shrink run-over-run; the report states which run the tags are authoritative for.

The Report stage emits, every run:

1. **Tagged residual survivors** — each survivor with its tag (and the agent's one-line reason for the source-dependent ones).
2. **Implied source cleanups** — `dead-code` and always-equivalent survivors are signals of removable or buggy production code; surface them as candidate cleanups with `file:line` (e.g. a backward-edge branch no caller reaches).
3. **An `expectedSurvivorLines` suggestion** — the equivalent (logging/format) lines, so a follow-up run can exclude them and report an honest *reachable* kill rate.

The scoring this stage reports is guarded by the anti-fake-green invariant above — the Report stage consumes the same authoritative tool-summary total, never a survivor-only subset read as the whole set.

## Safety rails

- **Budget cap** — halt when the run's **marginal** spend exceeds the ceiling. `budget.spent()` is the shared session pool, NOT the run's cost; capture the start spend and gate on the delta, or a run fired late in a long session trips on the session's prior spend.
- **Mutation ratchet** — a kill-rate regression between iterations means the harness is broken: halt.
- **Report on halt** — every stop writes a report naming the stop reason. Never silently exit green.
- **Forbidden to the Cover agent** — editing the production class, the mutation config, the gate infra, or the KB. A test that is RED on current code is KEPT and flagged as a candidate bug, never deleted.
- **Generation guard (Cover)** — the Cover agent must not emit categorically-dead tests: no log-output assertions (the adapter's existing test-style policy) and one representative per mutation-equivalence class. This is volume reduction, not enforcement — a prompt instruction is a request, not a guarantee that it is followed. The Minimize stage's confirm re-gate is the actual enforcement.

## The KB rule-ledger

Mine→Verify writes a per-class entry (one file) with a `## Rules` list (`- BR-1: {statement}`) and a status footer. Rule statements are durable prose — describe rules by SYMBOL and CONDITION (names, predicates), never by source line number (line numbers rot when the source shifts; keep them in a separate field). Status is `verified` after Verify, flipped to `mutation-gated` after the Cover gate passes. See `kb-entry-schema`.

## The adapter contract (what a stack skill provides)

The method names FIVE capabilities; the stack adapter fills them. Do not extract this seam from a single language — abstract it only once a second stack is live (premature extraction bakes in a one-language-shaped contract).

1. **Evidence indexer** — read the target source (and, later, find coupled files for boundary analysis).
2. **Test runner** — run the suite twice; report pass/fail/skip counts.
3. **Mutation tool** — mutate ONLY the target file (pin the scope on the CLI, not just static config); emit a per-file survivor report the gate can parse.
4. **Test-style contract** — the example + property test API the Cover agent must follow so generated tests compile.
5. **Prod-source-diff scoping** — the scoped diff of the production source for `char_pin`.

When a stack's mutation tool is **regex-based** (e.g. Dart's `mutation_test`) it emits equivalent mutants the adapter must exclude by reasoning (a removed log call, a consistent internal-format change) — not chase. When a stack lacks a mutation tool **entirely**, the adapter declares a documented fallback (coverage + an assertion-density floor + a raised skeptic cadence) — a weaker gate, stated honestly, not a silent downgrade.

## Substrate

The loop runs as a Workflow the orchestrator **instantiates from this spec** — skill markdown cannot reference a bundled script path, so the Workflow is authored from this method, not loaded. The dev-repo reference implementation lives in the nexus repo `harness/` (maintainer reference, not shipped). Workflow scripts run in a constrained runtime: no static import, no filesystem in the orchestrator (agents do all I/O), `meta` a pure literal, no `Date()`/`Math.random()` (they break resume), args may arrive JSON-stringified, and `budget.spent()` is the shared pool. Validate a Workflow against an offline mock-globals guard, never via expensive live runs.

## Model

Pin the `agent()` calls to **Sonnet** (`model: 'sonnet'`) — do **not** inherit the session model (often Opus). The gate is a *mechanical* evaluator, so what counts is the tests' quality, and Sonnet clears the floor on every target proven to date (.NET + Flutter, 90–100% reachable kill); Opus adds cost with no demonstrated gain. A stronger model may earn its keep only on the Verify skeptic (equivalent-mutant reasoning) — reserve it there if anywhere, never as the blanket default.

## What this skill does NOT do

- Provide the toolchain — that is the stack adapter's job (`mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter, `mine-verify-cover-cpp` for C/C++).
- Author NEW rules or judge whether the code is correct — it documents and tests EXISTING behavior (red-on-current tests are flagged as candidate bugs, not fixes).
- Measure recall/completeness — without a hand-authored golden set, the 3-miner consensus + surviving mutants are the practical completeness signal, not a proof that no rule was missed.
- Multi-class sweeps, boundary Discover, or graph-scoped targeting — single-class only; those are deferred extensions (graphify is the natural engine for graph-scoped target selection).

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover-dotnet` | the .NET stack adapter — fills the 5 capabilities (Stryker, dotnet test, xUnit + FsCheck, the test-project scaffold) |
| `mine-verify-cover-flutter` | the Dart/Flutter stack adapter — fills the 5 capabilities (mutation_test driving flutter test, flutter_test + mocktail, kiri_check, the build_runner + HTTPS-rewrite bringup) |
| `mine-verify-cover-cpp` | the C/C++ stack adapter — fills the 5 capabilities (mull-15 driving GoogleTest/CTest, libclang, GoogleTest + RapidCheck, the Docker image + exit()-wrap bringup) |
| `kb-entry-schema` | the KB rule-ledger shape this method reads and writes |
| `tdd` | the test discipline the Cover agent follows (boundary cases, kill the mutant) |
