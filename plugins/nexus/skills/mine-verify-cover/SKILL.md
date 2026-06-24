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

This is the **stack-neutral method**. The toolchain (test runner, mutation tool, test style) comes from a paired **stack adapter** skill — `mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter. The method here does not change per language; only the adapter does.

## The pipeline

```
Mine        3 clean-room miners read ONLY the one source class and extract every rule it encodes
Consolidate merge the 3 into consensus rules with agreement counts + transcribed/interpretive triage
Verify      a fresh skeptic re-checks each rule against the code: CONFIRMED / WRONG / IMPRECISE
KB write    serialize the verified rules into the project KB (status: verified) — the Verify→Cover seam
Cover       a Cover agent writes example + property tests; the adapter runs the suite + mutation tool
Gate        the orchestrator scores the §gate-battery; surviving mutants feed back to Cover; loop to floor
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

## Safety rails

- **Budget cap** — halt when the run's **marginal** spend exceeds the ceiling. `budget.spent()` is the shared session pool, NOT the run's cost; capture the start spend and gate on the delta, or a run fired late in a long session trips on the session's prior spend.
- **Mutation ratchet** — a kill-rate regression between iterations means the harness is broken: halt.
- **Report on halt** — every stop writes a report naming the stop reason. Never silently exit green.
- **Forbidden to the Cover agent** — editing the production class, the mutation config, the gate infra, or the KB. A test that is RED on current code is KEPT and flagged as a candidate bug, never deleted.

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

## What this skill does NOT do

- Provide the toolchain — that is the stack adapter's job (`mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter).
- Author NEW rules or judge whether the code is correct — it documents and tests EXISTING behavior (red-on-current tests are flagged as candidate bugs, not fixes).
- Measure recall/completeness — without a hand-authored golden set, the 3-miner consensus + surviving mutants are the practical completeness signal, not a proof that no rule was missed.
- Multi-class sweeps, boundary Discover, or graph-scoped targeting — single-class only; those are deferred extensions (graphify is the natural engine for graph-scoped target selection).

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover-dotnet` | the .NET stack adapter — fills the 5 capabilities (Stryker, dotnet test, xUnit + FsCheck, the test-project scaffold) |
| `mine-verify-cover-flutter` | the Dart/Flutter stack adapter — fills the 5 capabilities (mutation_test driving flutter test, flutter_test + mocktail, kiri_check, the build_runner + HTTPS-rewrite bringup) |
| `kb-entry-schema` | the KB rule-ledger shape this method reads and writes |
| `tdd` | the test discipline the Cover agent follows (boundary cases, kill the mutant) |
