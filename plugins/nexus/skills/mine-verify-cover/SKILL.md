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

**Both premises above — ONE production class, reverse-engineering code — describe the method's code arm.**
The spec arm (`## mine-from-spec mode` below) runs the same Mine→Verify stages against a spec manifest
instead of a class, and documents what the spec *commits to*, not what code does. See `## Input-source
axis` for how the two relate.

This is the **stack-neutral method**. The toolchain (test runner, mutation tool, test style) comes from a paired **stack adapter** skill — `mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter, `mine-verify-cover-cpp` for C/C++, `mine-verify-cover-php` for PHP. The method here does not change per language; only the adapter does.

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

**Tier disclosure:** the miner clean-room is **prompt-enforced** — the Workflow tool's `agent()`
exposes no tool-restriction option, so "reads ONLY the inline slice/class" is an instruction the
model is asked to follow, not a mechanical guarantee; weigh a run's clean-room claim accordingly.
A mechanical seal is pending upstream platform support.

One class per run. The orchestrator is deterministic and trusted; the agents do all reading/writing (the orchestrator has no filesystem). See `kb-entry-schema` for the KB shape and `tdd` for the test discipline the Cover agent follows.

## Two modes

- **Full** (needs a stack adapter): Mine→Verify→Cover→Gate→Report. Yields the verified KB *and* the gated tests.
- **Mine→Verify only** (no adapter, no toolchain): stops after KB write. Yields a **verified rule KB** for any language — even code you cannot build. Use this as a standalone code-grounded KB generator (a clean input for documentation, drift-checking, or a broader KB to ingest).

## Input-source axis

The two modes above are a **depth** axis — how far the pipeline runs (through Cover/Gate, or stopping
after Verify). **Input source is a separate, orthogonal axis** — what the miners read:

- **Code source** (default, the code arm): ONE production class. Eligible for either depth mode.
- **Spec source** (the spec arm): a slug's definition docs, via the **`mine-from-spec` mode** below.
  Spec source always runs at **Mine→Verify depth only** when run STANDALONE — there is no Full/Cover
  variant driven directly off the raw spec-rule list. **Cover-from-spec ships as a separate, shipped
  mode** — a diff-driven generator that consumes the Merge stage's TRIAGED output, never the raw
  `spec-rules.md` this mode alone produces; see `## SDD lifecycle` below
  (`docs/proposals/sdd-generate-merge-2026-07.md`, Ratified).

`mine-from-spec` is a **source choice, not a third depth mode** — it composes with the existing
Mine→Verify-only depth, it does not add a new one.

## mine-from-spec mode

Runs the Mine and Verify stages against a spec manifest instead of a production class.

**Source manifest.** The miners read ONLY the mined definition docs: default `spec.md`/`tech-spec.md` for
the slug; additional definition docs only if explicitly listed in the manifest. **Forbidden** — stated in
**every stage prompt**, miner and skeptic alike: all production source, any existing tests, any code-arm
rule KB, any golden set.

**Mine.** Clean-room miners extract every testable rule the spec commits to (boundaries, invariants,
outcome rules), each with a **verbatim spec citation** (quoted line(s)).

**Verify.** A fresh skeptic verifies each rule against the spec text only — is it really committed to, is
the boundary stated or invented, is it testable? Each rule gets a `verified | ambiguous` verdict; every
`ambiguous` verdict carries the skeptic's one-line reason. Unverifiable rules are **spec findings** — the
mode's second product, not a defect in the mode.

**No Cover, no mutation gate in this `mine-from-spec` mode itself** — run standalone, this mode's output
is `spec-rules.md` only. Test authoring against a spec is the separate, shipped **generate** mode
(`## SDD lifecycle` below), which is driven off the Merge stage's TRIAGED output (never the raw
`spec-rules.md` this mode produces directly) and which itself waits for the plan's target surface — a
plan decision, not a property of this mode.

**Output artifact.** `docs/specs/{slug}/definition/spec-rules.md` — one row per rule: authored `ruleName`,
statement, boundary, verbatim citation, verdict (`verified | ambiguous`), and the skeptic's one-line reason
for each `ambiguous`.

**Stamp header (pinned grammar).** One line **per mined source doc**, in manifest order:
```
Spec-stamp: {repo-relative path} @ sha256:{first 12 hex} ({date})
```
Hash input = exactly the docs the miners were given (the manifest) — never `spec-rules.md` itself (it
lives in the same folder; including it would be circular), never unmined siblings (e.g.
`help.tooltips.md`). **Content is LF-normalized before hashing** (CRLF repo; writer and reader must
agree). A later join recomputes per-file with the same normalization and compares line-by-line; a mismatch
triggers a **delta re-check** — re-verify each citation against the current spec and scan changed sections
for uncovered commitments — never a full re-run.

**Execution topology (who runs what).** Read `references/mine-family-core.md` §Execution topology
before orchestrating — the canonical shape (multi-agent by design, orchestrator-owns-spawning,
staged background `general-purpose` agents, "launch = orchestrate stages") is defined there. This
mode's own staging: the clean-room miners run in parallel (background), then on their completion a
consolidate+skeptic agent (background); stages interleave with plan-authoring — planning never
blocks on the run. **Poll, don't wait + mechanized firing:** see `references/mine-family-core.md`
§Stage-completion discipline + mechanized firing — the canonical completion discipline plus the F7 S2
journal watcher (advances a stalled stage / fires the cadence skeptic without operator input; watcher
implementation is dev-repo machinery).

**On a NEW target, walk the core §kickoff checklist first** (tool preflight, expected survival rate,
stop-budget, run-report location, stage-model-plan) before launching this mode's run.

## The gate battery (never fake green)

Every gate is computed by the orchestrator from the adapter's raw output — no agent self-reports a gate. All must pass:

| Gate | Passes when |
|------|-------------|
| `target_mutated` | the mutation report ACTUALLY mutated the target file (anti-fake-green — match the FULL source path, never the basename) |
| `suite_green` | the test suite is run twice and is fully green both times |
| `no_flaky` | the two runs report identical pass/fail/skip counts |
| `mutation_floor` | reachable mutation kill is at or above the floor (default 75%), compared **exactly — no rounding** (a shipped `Math.round` once carried 74.59% over a 75 floor); a kill counts **only when attributed to a failing test assertion** — Timeout and crash are adjudication buckets, never auto-kills |
| `no_new_skips` | the suite adds no skipped tests over the measured baseline |
| `char_pin` | the production source was not changed (only Stryker-disable annotations are allowed) |
| `lint_clean` | the stack's static analyzer reports zero findings on the generated test file(s) — info/style-level findings count (a repo that keeps a lint set treats them as real). The adapter supplies the analyzer command (capability 4); a stack with no configured analyzer declares that in its fill and the gate auto-passes — stated, never silent |

`mutation_floor` measures **reachable** kill: mutants in known-dead lines are excluded only when the KB pre-documents them (default: exclude none). A sub-100% honest kill is a pass when it clears the floor — report the residual survivors, never hide them.

**Anti-fake-green invariant:** before scoring `mutation_floor`, cross-check the agent-reported mutant TOTAL against the tool summary's `Found N`. If they differ, halt and flag — a mismatch indicates the gate is scoring on a partial mutant set (e.g. a survivor-only XML output read as the full set). The stack adapter's summary parse is the authoritative total; the gate must not proceed on an unverified count.

A mutant can also hang or crash the runner instead of failing cleanly — see `## The adapter contract`'s
"Abnormal mutant exits" paragraph for how that keeps `mutation_floor` and `char_pin` honest under a hard
kill.

### Instrument integrity — the kill-attribution rule (binding)

A cross-stack audit (2026-07-21) found **every audited mutation instrument lying in its own way**:
a parallel harness counted crashes as kills (shared temp-file race; a "97.8%" re-measured at 53.8%),
an exit-code battery counted compile failures as kills, a Stryker gate counted deadlock timeouts as
kills, and this skill's own shipped gate rounded 74.59% up to a 75-floor PASS. The binding rule:

- **A mutation kill counts only when attributed to a failing test assertion.** Crashes, compile
  errors, and timeouts are NEVER auto-kills — each lands in a named bucket (`COMPILE_FAIL`,
  `LOAD_CRASH`, `TIMEOUT`) and is adjudicated per-mutant: a timeout is a kill only as a proven
  infinite loop; a crash is a kill only when the mutant's semantic effect (not the harness) caused
  it. Unadjudicated bucket entries score as survivors — the gate may under-state, never over-state.
- **No score is reported until the instrument passes its shape's honesty proof.** Parallel harness →
  reproducibility proof (two identical runs + one serial, per-mutant verdicts identical); exit-code
  harness → failure-output classification (capture and read the output; `rc != 0` alone proves
  nothing); timeout-counting gate → timeout adjudication. The adapter names the concrete procedure.
- **Harness state must be process-isolated.** Any temp file, port, or global a scored test writes
  must be per-process (pid/GUID-suffixed) — a shared mutable path under parallel workers converts
  harness collisions into false kills at test-authoring time, where no audit can see them later.
- **Score arithmetic and its evidence artifacts are committed**, never left in ephemeral paths
  (gitignored dirs, worktrees, `/tmp`) — a committed verdict must not depend on artifacts one
  cleanup away from gone.
- **Comparative claims require a uniform instrument.** A ranking between arms survives contamination
  only if the contamination is uniform; classify kills in every arm before comparing, or the
  comparison is invalid even where the absolute scores survive.

## The Minimize stage

Runs **after** Gate reaches the mutation floor and **before** Report — the architectural **dual of
classify-survivors** (the stage below): that stage tags unkilled *mutants*; this one tags *tests* that
kill nothing new. Suite target is **rule-traceable, not mutation-minimal** — trim true duplicates and
categorically-dead tests, keep every test that documents a distinct verified rule.

**Activation gate.** Minimize runs only when the generated test count **materially exceeds** the distinct
mined-rule count — a **non-zero margin above** it, not merely *more than* it (margin 0 would never skip).
At or near the rule count there is nothing safe to trim, so the whole stage is **skipped** — logged **and**
reported, never a silent no-op. Both counts are computed **upstream** and are read, never re-derived: the
mined **consensus-rule count** and the **green suite size**. Do **not** count them from the removal
proposal — the proposal lists only the tests being *removed*, which do not exist until the minimize agent
has already run.

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

**The categorical-KEEP class (the inverse — never removable).** A test is a **categorical-KEEP** — kept
even when mutation-redundant and filed under a **shared rule ID** — when it **constructs a
degenerate/boundary input and asserts the observable safe/no-op result**: empty input, no-match, zero /
empty-collection, or the documented failure-passthrough. This is the **inverse** of the four
categorical-dead classes and sits alongside the existing distinct-verified-rule keep. Rationale: the
fail-closed **confirm** compares exact *kill counts*, and a mutation-redundant behaviour test contributes
**zero** unique kills — so its removal leaves the count unchanged and is **invisible to the confirm**. The
confirm is structurally **blind to behaviour-coverage loss**; the guard therefore has to live *before*
removal, at this categorical layer, not in the post-removal count check. The orchestrator honors the
categorical-KEEP signal the **same mechanical way** it honors the distinct-verified-rule keep — a filter it
applies to the agent's proposal, never a removal it derives: the agent proposes, the orchestrator refuses
removal of any candidate carrying a keep signal.

**The discriminator vs categorical-dead class #4.** Class #4 removes a "boundary" test that **never
constructs** the distinguishing input; a categorical-KEEP protects a degenerate test that **does** construct
the edge and asserts the no-op. The single discriminator: *does the test actually construct the degenerate
input AND assert the observable result?* Yes → KEEP; names a boundary but never builds it → still class #4
(remove). Stated adjacently so the two rules read as complementary, not contradictory.

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
restored count instead; an **activation-gate skip** (Minimize never ran because the suite was at the rule
floor) reports a **third form** — `minimized: skipped (at rule-floor) — generated N ≤ rules M + margin` — so
a skipped stage is never rendered as "removed 0 tests / no redundant tests found" (which would misreport a
stage that did not run). Never a silent trim.

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

- **Budget cap + report on halt** — read `references/mine-family-core.md` §Marginal-budget rail
  (capture-the-start delta gating, never silently exit green).
- **Mutation ratchet** — a kill-rate regression between iterations means the harness is broken: halt.
- **Forbidden to the Cover agent** — editing the production class, the mutation config, the gate infra, or the KB. A test that is RED on current code is KEPT and flagged as a candidate bug, never deleted.
- **Generation guard (Cover)** — the Cover agent must not emit categorically-dead tests: no log-output assertions (the adapter's existing test-style policy) and one representative per mutation-equivalence class. This is volume reduction, not enforcement — a prompt instruction is a request, not a guarantee that it is followed. The Minimize stage's confirm re-gate is the actual enforcement.

## The rule registry

Mine→Verify writes a per-unit registry (one file) at `docs/business-rules/<area>/<unit>.md` — flat per
mined unit, no folder-per-class slice (`<area>` may be omitted in single-area repos; provenance: this
artifact-species split is ADR-45). Each rule is a `## Rules` bullet (`- BR-1: {statement}`) carrying an
appended row of fields — this sentence is the grammar every other shipped file references:

- `source: code | spec | both`
- `status`: `verified` after Verify, flipped to `mutation-gated` after the Cover gate passes; also
  `divergence-pending-triage` for an unresolved Merge-arm conflict awaiting a human ruling
- `criticality: golden | core | edge | untagged` (`untagged` = the arm never mined that fact — never
  invent a value)
- `last_verified`: the date of the row's most recent verification-against-code event, coherent with
  `status`

Rule statements are durable prose — describe rules by SYMBOL and CONDITION (names, predicates), never
by source line number (line numbers rot when the source shifts; keep them in a separate field). See
`kb-entry-schema` for the registry's non-row context sections (Key Files, Edge Cases, Source, etc.) —
those stay unchanged below the rows.

**Flutter migration note.** Existing Flutter-repo rule ledgers under `docs/kb/` and registries under
`docs/kb/golden/` migrate to `docs/business-rules/` on that repo's next campaign touch; until then,
consumers of those specific repos keep reading the old paths.

## Fact tagging & test tiers

`adhoc-SddMergeGen` (proposal §B; SR pilot condition 1). Every rule and its generated test carries
discrete **facts** — never a scalar score. Named **tiers** are filter expressions over the facts, mapped
per stack adapter to that stack's native filter syntax.

**The facts (consolidate-stage output, both arms).** The Consolidate stage's output schema gains, per
rule:
- `layer` — `domain-calc | api | ui | settings` (SR proposal 1). Spec rules span layers in one flat list
  (F12: 78 rules, ~30 targeting the analyzer class; F13: only 4 of 24 spec-only rules target the domain
  class) — target selection needs the tag.
- `criticality` — `golden | core | edge`.

Cover's test-writer emits the facts on the generated test, plus three test-only facts:
- `mutation-gated` — boolean; set once the test has cleared the gate battery.
- `runtime-cost` — `fast | slow`.
- `arm` — `code | spec`; which mine arm produced this test (`## Mined-test location` below) — the
  mechanism that lets both arms colocate under one test root and be told apart by filter, not by folder.

**Tag emission is a verified assertion, not prose.** The sentence above ("Cover's test-writer emits the
facts on the generated test") is, left alone, the same kind of unenforced prompt instruction the Safety
rails' generation guard already names for categorically-dead tests (`## Safety rails` → "Generation guard
(Cover)": "a prompt instruction is a request, not a guarantee that it is followed"). Measured: 1 of 13
code-arm suites in one pilot carried per-test tags — including suites generated after fact-tagging
shipped. Mirror the guard's own fix rather than a stronger prompt: a **post-Cover assertion**, checked
again at Report — count the tag-carrying occurrences in the generated test file (e.g. `tags: [` per the
Flutter mapping below) and compare to the test count. Equal → pass silently. Mismatch → the Report stage
flags it (fail or warn, adapter's choice) instead of silently shipping an untagged suite. Same actor split
as the Minimize confirm above: an agent (Cover, or a Report-stage checker) counts and reports; the
orchestrator only compares and records — it still has no filesystem of its own.

**Named tiers — filter expressions over facts, not a new taxonomy.** The initial set (extensible — a
tier is just a predicate over the facts above, adding one never touches this list):
- `smoke` = `golden ∧ fast`
- `full` = all tests
- `gate` = `mutation-gated`, run on target-class change

**Rejected: a 1–100 scalar confidence/priority score** on tests or rules. Miners/skeptics cannot
calibrate 67-vs-72, thresholds drift session to session, and CI filters need stable named categories —
this mirrors `kb-sync`'s own design note ("this skill does not assign confidence scores"). Facts give
unlimited tier flexibility without a fake number; do not re-propose the scalar in a later session.

**Stack adapter table (fact→native-filter mapping).**

| Adapter | Mapping |
|---------|---------|
| `mine-verify-cover-dotnet` | `[Trait("layer",…)]` etc. + `dotnet test --filter` tier expressions; the parked-red idiom (`[Fact(Skip = "SPEC-CODE DIVERGENCE … pending triage")]`) |
| `mine-verify-cover-flutter` | flutter test `tags:` + `--tags` tier expressions; the parked-red idiom via `skip:` |
| `mine-verify-cover-cpp` | **deferred** — the fact/tier vocabulary is not yet mapped for the C++ adapter (proposal §B names dotnet+flutter only); a follow-up gives it the same tag mapping |
| `mine-verify-cover-php` | **deferred** — the fact/tier vocabulary is not yet mapped for the PHP adapter (proposal §B names dotnet+flutter only); a follow-up gives it the same tag mapping (PHPUnit `#[Group(…)]` + `--group`/`--exclude-group`) |

## Mined-test location

`## The rule registry` above consolidates RULES into one file per unit — it says nothing about where the
GENERATED TESTS live, and that silence is a bug, not a gap that self-resolves: a team merges the rule
registry and reasonably assumes the tests merged too. One pilot found otherwise — the code arm landed in
`test_mine/` and the spec arm in `test_mine/spec/`, no skill guidance drove either name, and the project's
bare test-runner invocation discovered the spec arm's tests but never the code arm's — the entire
mutation-gated code-arm suite was silently absent from CI.

Two arm-agnostic requirements:
- **A single mined-test root for both arms.** Code-arm and spec-arm output land under the SAME root;
  the arms are told apart by the `arm` fact (`arm-code` / `arm-spec`, `## Fact tagging & test tiers`
  above), filterable, never by separate folders.
- **State the default-path consequence explicitly, per adapter.** A mined-test root that is not on the
  stack's default test-discovery path runs in CI only if the pipeline names it explicitly. The adapter
  must say which is true for its stack and, if the chosen root is off-path, tell the orchestrator to
  either move the root onto the default path or wire the extra path into the project's test command —
  see the stack adapter for the concrete convention (e.g. the Flutter adapter's `test/` placement rule).

## The adapter contract (what a stack skill provides)

The method names FIVE capabilities; the stack adapter fills them. Do not extract this seam from a single language — abstract it only once a second stack is live (premature extraction bakes in a one-language-shaped contract).

1. **Evidence indexer** — read the target source (and, later, find coupled files for boundary analysis).
2. **Test runner** — run the suite twice; report pass/fail/skip counts.
3. **Mutation tool** — mutate ONLY the target file (pin the scope on the CLI, not just static config); emit a per-file survivor report the gate can parse.
4. **Test-style contract** — the example + property test API the Cover agent must follow so generated tests compile, **plus the stack's static-analysis command the generated tests must pass clean** (the `lint_clean` gate's input). Run it after every Cover write, not only at Report — a lint-dirty suite compounds per iteration. One carve-out the contract must state: a deprecated member that is ITSELF the mined rule's subject gets a justified inline suppression, never a migration to the replacement — migrating changes what the test documents.
5. **Prod-source-diff scoping** — the scoped diff of the production source for `char_pin`.

When a stack's mutation tool is **regex-based** (e.g. Dart's `mutation_test`) it emits equivalent mutants the adapter must exclude by reasoning (a removed log call, a consistent internal-format change) — not chase. When a stack lacks a mutation tool **entirely**, the adapter declares a documented fallback (coverage + an assertion-density floor + a raised skeptic cadence) — a weaker gate, stated honestly, not a silent downgrade.

**Abnormal mutant exits are part of the contract, not an afterthought.** A mutant does not only fail an
assertion — it can make the target NON-TERMINATE (infinite recursion) or CRASH the runtime (stack
overflow). The Test runner (capability 2) and Mutation tool (capability 3) fills must document, together,
not re-derive per run:
- **Timeout handling must reach the whole process tree.** If the runner spawns child processes, killing
  only the top-level process can leave a descendant alive holding the output pipe open, so the run never
  returns. The terminated mutant then lands in the `TIMEOUT` adjudication bucket (see `### Instrument
  integrity`) — it is recorded, never auto-scored as a kill.
- **A crashing mutant is an ADJUDICATION entry, not an auto-kill.** Capture the failure output and
  classify: a crash caused by the mutant's semantic effect (e.g. mutant-induced stack overflow) is a
  kill; a crash from the harness or environment (shared-state race, corrupted temp file, load error) is
  an instrument defect that must be fixed before the score means anything. `rc != 0` alone proves the
  process died, not that the tests detected anything — the audited estates' false kills all rode this
  exact conflation.
- **Re-verify `char_pin` after ANY abnormal exit, before proceeding to the next mutant.** A hard external
  kill or the run's own time limit can bypass a restore-on-exit `finally` and leave a mutant still applied
  to production source; the orchestrator must re-check `char_pin` (capability 5) and restore before
  scoring the next mutation — a prompt-level "restore in finally" is not a guarantee against SIGKILL.

State the concrete mechanism for each — process-tree kill command, crash return-code set, restore
re-check trigger — in the adapter's own capability fill; see the Flutter adapter for the Windows/Dart
form.

## Substrate

The loop runs as a Workflow the orchestrator **instantiates from this spec** — skill markdown cannot reference a bundled script path, so the Workflow is authored from this method, not loaded. The dev-repo reference implementation lives in the nexus repo `harness/` (maintainer reference, not shipped). Workflow scripts run in a constrained runtime: no static import, no filesystem in the orchestrator (agents do all I/O), `meta` a pure literal, no `Date()`/`Math.random()` (they break resume), args may arrive JSON-stringified, and `budget.spent()` is the shared pool. Validate a Workflow against an offline mock-globals guard, never via expensive live runs.

## Model

Pin the `agent()` calls to **Sonnet** (`model: 'sonnet'`) — do **not** inherit the session model (often Opus). The gate is a *mechanical* evaluator, so what counts is the tests' quality, and Sonnet clears the floor on every target proven to date (.NET + Flutter, 90–100% reachable kill); Opus adds cost with no demonstrated gain. A stronger model may earn its keep only on the Verify skeptic (equivalent-mutant reasoning) — reserve it there if anywhere, never as the blanket default.

## What this skill does NOT do

- Provide the toolchain — that is the stack adapter's job (`mine-verify-cover-dotnet` for .NET, `mine-verify-cover-flutter` for Dart/Flutter, `mine-verify-cover-cpp` for C/C++, `mine-verify-cover-php` for PHP).
- Author NEW rules or judge whether the code is correct — it documents and tests EXISTING behavior (red-on-current tests are flagged as candidate bugs, not fixes).
- Measure recall/completeness — without a hand-authored golden set, the 3-miner consensus + surviving mutants are the practical completeness signal, not a proof that no rule was missed.
- Multi-class sweeps, boundary Discover, or graph-scoped targeting — single-class only. Graph-scoped repo evaluation is now the shipped `mine-verify-repo` (the repo-scoped sibling mine, with graphify as its scope engine and a docs/tech-debt triage registry as its output); this skill's single-class stance is unchanged.

## SDD lifecycle (M0–M3)

This skill is the **code arm** of a larger SDD (spec-driven development) lifecycle spanning spec and code
together; the **spec arm** is the `mine-from-spec` mode above. Two more stages compose with the arms —
**Merge** (triage) and **Generate** (Cover-from-spec) — both **shipped**, per
`docs/proposals/sdd-generate-merge-2026-07.md` (Ratified). The lifecycle has four modes, keyed on what
already exists for a class — a spec, code, and/or a golden set:

| Mode | Trigger | What runs |
|------|---------|-----------|
| **M0 — Greenfield** | Spec exists, code doesn't | Spec arm (Mine+Verify) + **Generate**, shipped — with no code arm to compare against, Merge's triage degenerates so every eligible spec rule lands in `spec-only-unimplemented`/`spec-only-other-layer`, so Generate produces the red suite up front (OD-L6: no new machinery beyond `mine-from-spec` + Merge/Generate over an empty code arm) |
| **M1 — Create** | Code + spec both exist, no golden set | Both arms — **Merge** (triage) + **Generate**, shipped |
| **M2 — Protect** | Refactor of a class already covered by this skill's gated suite | Code arm only — this skill's gate battery (unchanged; no spec arm involvement) |
| **M3 — Evolve** | Feature update on a class with an existing attested golden set | Both arms — **Merge** (registry-driven triage) + **Generate**, shipped for the `add`/`carried`/`supersede`/`retire` quarter of the reconciliation table; `re-open`, the C2 attestation record, and the merged ONE test set (C3/C4) are **deferred** to the next arc |

**M0 — Greenfield.** A spec exists but the code doesn't. **Mine+Verify-from-spec is shipped and
ungated** — run `mine-from-spec` above to produce the verified `spec-rules.md` rule set. **Merge and
Generate are shipped too** — with no code arm to compare against, Merge's triage (below) puts every
eligible spec rule in `spec-only-unimplemented` (layer-matching the target surface) or
`spec-only-other-layer`, so Generate authors the red suite the code is then written to turn green. No new
machinery beyond `mine-from-spec` + Merge/Generate (OD-L6).

**M2 — Protect** (unchanged by this ship). When refactoring a class already covered by a
`mine-verify-cover` gated suite, re-run the two safety-net gates the protect case actually uses, from
§The gate battery above:

- `suite_green` — every pre-refactor gated test stays green post-refactor.
- `mutation_floor` — the re-gated whole-class reachable kill clears the adapter's floor.

Run both before and after the refactor. `char_pin` **is inapplicable to M2** — M2 deliberately changes
production source (the inverse of this skill's normal no-edit-prod stance), so the "prod source unchanged"
gate does not apply here. A kill-rate before/after **delta is advisory only** — the mutant population (the
denominator) changes with the source, so a rate comparison is not apples-to-apples and is **never** the
pass/fail criterion; `suite_green` + `mutation_floor` re-clearing is. Code arm only; M2 needs no spec arm.

**M1 — Create / M3 — Evolve.** Both modes run **both arms blind**, then **Merge** and **Generate**
(agent-executed per the method below — the dev-repo reference implementation is a Workflow the
orchestrator instantiates from this spec, per `## Substrate` above; skill text never references harness
files).

**Merge.** The spec arm's rule set is reconciled against the code arm's by the **human-authored
crosswalk** (a post-hoc canonical-name map; many-to-one tolerant both ways) and triaged into the **five
delta buckets**: `overlap-confirmed`, `spec-only-other-layer`, `spec-only-divergent` (→ the distinct
**`divergence-pending-triage`** state, carrying the **evidence pair** — spec citation + code attestation
— plus an optional `suspect-stale-spec` tag, **operator-declared via the crosswalk** (or derived when the
code-arm KB carries an attributed-source date the mined spec predates)), `spec-only-unimplemented`,
`code-only-precision` — every rule lands in exactly one bucket, nothing silently dropped. Whether a
matched pair **agrees or diverges is operator-declared**: the crosswalk states, per canonical rule,
whether its matched code/spec pair agrees or diverges, and the condition-boundary comparison is only a
**corroborating hint** — consulted when the operator declared nothing. `ambiguous`-verdicted spec rules are **excluded from
generation-eligible buckets** and routed to a spec-repair list. Merge writes/updates the canonical rule
registry (SddLifecycle C1; default path `docs/business-rules/<area>/<unit>.md`) — `source:`/`last_verified`
mandatory on every row; read `references/mine-family-core.md` §Registry invariants for the
never-deleted / append-only-changelog / idempotent-re-run rules this registry follows. For M3, the
registry's prior rows drive the `add`/`carried`/`supersede`/`retire`
dispositions; the `re-open` disposition (new evidence contradicts a *recorded verdict*) needs the C2
attestation record's verdict-line grammar, which is **deferred** to the next arc alongside the merged ONE
test set (C3/C4) — see `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md`.

**Generate (Cover-from-spec)** — a **diff-driven** generator, never driven off the raw spec-rule list.
Input = the triaged registry — **only** `spec-only-unimplemented` rules whose `layer` matches the plan's
target surface, plus owner-confirmed `spec-only-divergent` rows; `ambiguous` is blocked (routes to spec
repair). **Two preconditions before authoring any red:** run the implemented-upstream check for rules
whose layer ≠ target surface (one inspection beats a misleading wrong-layer red), and route
`suspect-stale-spec`-tagged divergences to spec repair, not test generation. **Output convention:**
generated reds are KEPT, parked as skipped divergence records via the adapter's parked-red idiom
(`## Fact tagging & test tiers` above) with observed values, so the suite stays green while the
divergence stays on the record. **Cover waits for the plan** — the target surface is a plan decision
(SddLifecycle amendment 2026-07-03 stands); worktree isolation returns for generate/merge (Mine+Verify
stays manifest-only). Generated tests carry the fact tags above (`## Fact tagging & test tiers`).
**In a mature-code run with an empty eligible set the correct output is zero tests** — a clean suite with
nothing left to generate is the CORRECT outcome, not a failure (the flutter pilot's executed probe
validated the mechanism: 5 red confirmed drifts, 1 green keeper, zero false alarms).

Running the spec arm alone does not require Merge/Generate to be shipped; only combining it with the code
arm's rule set does — and that combination is shipped now, for the scope above.

## Relationship to other skills

This skill is the **family head** — the class-scoped mine (ground truth: code; gate: mutants), and
`references/mine-family-core.md` (owned by this skill folder) is the shared reference the whole
mine family points to. See that file's §The mine family for the full 12-row family table (including
`mine-verify-repo`, `mine-reference-model`, `mine-semantic-model`, `mine-design`, `mine-algorithm`,
`mine-verify-flows`, `mine-architecture`, `mine-oracle-strength`, `mine-skill-gaps`, and `mine-skill-candidates`).

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover-dotnet` | the .NET stack adapter — fills the 5 capabilities (Stryker, dotnet test, xUnit + FsCheck, the test-project scaffold) |
| `mine-verify-cover-flutter` | the Dart/Flutter stack adapter — fills the 5 capabilities (mutation_test driving flutter test, flutter_test + mocktail, kiri_check, the build_runner + HTTPS-rewrite bringup) |
| `mine-verify-cover-cpp` | the C/C++ stack adapter — fills the 5 capabilities (mull-15 driving GoogleTest/CTest, libclang, GoogleTest + RapidCheck, the Docker image + exit()-wrap bringup) |
| `mine-verify-cover-php` | the PHP stack adapter — fills the 5 capabilities (Infection 0.34 driving PHPUnit 12, workspace-copy isolation, eris property tests, the Docker + PCOV native-fs bringup, the Infection-json → Stryker-schema translation) |
| `kb-entry-schema` | the registry's non-row context sections (row grammar lives in `## The rule registry`) |
| `tdd` | the test discipline the Cover agent follows (boundary cases, kill the mutant) |
