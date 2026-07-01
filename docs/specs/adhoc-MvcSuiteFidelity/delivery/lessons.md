# MVC Suite Fidelity (F1 + F3) — Lessons

## Architect Lessons
- **A count-based confirm gate is structurally blind to behaviour-coverage loss — the guard must be
  categorical and pre-removal.** ADR-37's post-floor confirm compares exact kill counts, so a
  mutation-redundant-but-behaviour-distinct test contributes zero unique kills and its removal is invisible
  to the confirm. The plan correctly located the fix *before* removal (a categorical-KEEP list, the inverse
  of the categorical-DEAD classes) rather than trying to strengthen the confirm. General principle: when a
  safety net measures a quantity (kill count) that a class of defect leaves unchanged **by definition**, no
  tuning of that net catches the defect — move the guard to a layer where the defect is observable.
- **A skip/off state of a new gate needs its own report form, wired to BOTH renderers.** The critic's two
  MEDIUM findings were entirely about the activation-gate SKIP being unwired — it would have rendered as
  "removed 0 tests" (false). The done-check confirmed the fix landed in three places that must agree: the
  method Report-line spec (third form), the harness renderer branch (ordered ahead of `heldBack`/`removed`),
  and the Step 4b assertion on the rendered line. When a plan adds a gate with an inactive branch, make the
  inactive-branch rendering an explicit acceptance line in every artifact that renders state — a silent
  fall-through to an existing message is the default failure mode.
- **A gate placed behind an existing guard needs its test fixture to satisfy the guard first.** The
  activation gate is an `else if` after `killedBefore === null`; slice (b) could only exercise the skip by
  also supplying a non-null `mutation_floor.detail.killed`. The plan's acceptance for 4b named the
  `suite_green.detail.runs` extension but not the `killed` prerequisite — the developer inferred it. Worth
  encoding in future plans: when acceptance says "exercise branch X behind guard G", list G's precondition
  in the fixture requirement, not just X's input.

## Reviewer Lessons
- **A `cond1 !== null && cond1 <= threshold` gate has TWO distinct "does not fire" paths — a null-guard
  test suite covering only one of them leaves the other's comparison operator unverified.** The activation
  gate (`generated !== null && generated <= distinctRules + margin`) has an explicit N-boundary skip test
  (9h-8, `generated == threshold`), but every other Minimize slice reaches the "proceed" branch via
  `generated === null` (the base fixture's empty `suite_green.detail`), never via a known `generated`
  value strictly above the threshold. A flipped operator (`<` vs `<=`, or swapped operands) would pass the
  whole suite unnoticed, because no test gives the comparison a real number on the "should proceed" side.
  General principle for review: when a guard is `knownness-check && threshold-check`, the threshold-check's
  N+1 side needs a test where the value is KNOWN, not merely a test where the value is absent — those are
  different code paths through the same `&&` even though both currently "don't skip."
- **Verifying a fail-closed filter change needs a grep-the-flag pass, not just reading the new test.** FIX-A
  changed the removal filter to require BOTH keep flags explicitly `false`; the risk wasn't the new
  fail-closed test (slice (g)) but whether any *pre-existing* removal-expecting fixture now silently fails
  because it never set the newly-load-bearing flag. Grepping every `documentsDistinctRule` occurrence in the
  test file (not just the diff) confirmed all 5 pre-existing removal slices had been updated with an
  explicit `categoricalKeep: false`. General principle: when a filter goes from `!flag` (fail-open) to
  `flag === false` (fail-closed) on an EXISTING field, the fixtures that predate the field are the
  regression risk, not the new test that motivated the change — grep the field name project-wide, not just
  the new assertions.

## Developer Lessons
- **TDD-pair steps run test-first even when the plan numbers the harness first.** This plan split the
  behavior change across Step 3 (harness, `TDD: yes`) and Step 4 (contract slices, `Skill: tdd`). The `tdd`
  red-green loop reverses that ordering *within* the pair: write the slice (red) → implement the harness
  mechanism (green). Slice (a) was red against the old `!c.documentsDistinctRule`-only filter; slice (b) was
  red against the missing activation gate. Announcing "Step 3 then Step 4" in plan order while implementing
  test-first is correct — record the interleave in implementation.md so the done-check sees both steps.
- **A new gate that reads a new upstream field should treat an ABSENT field as "gate off", not "skip".**
  The activation gate reads `coverResult.gates.suite_green.detail.runs[0].passed`. The canonical pre-existing
  minimize fixtures carry an EMPTY `suite_green.detail` (`{}`), so `generated` is `null` there. Guarding the
  skip on `generated !== null && …` means older fixtures/callers keep the pre-change behavior (Minimize runs)
  instead of silently skipping — the safe default, and it kept 5 pre-existing slices green without edits.
- **`claude plugin validate --strict` has pre-existing frontmatter false-negatives on some nexus skills.**
  It reported 4 YAML-frontmatter parse errors on `boy-scout`/`diagnose`/`evaluate-skill`/`improve-skills` —
  none touched by this feature. Cross-check any validator failure against your git change set before
  attributing it to your work; `--check` on `bump-plugin.mjs` and the `tests/lint` suite are the load-bearing
  gates here, and both passed (modulo the separately-known pre-existing `nexus-cpp` CHANGELOG lint failure).
- **Template-literal backtick edits need exact bytes.** The minimize-agent prompt is a JS template literal;
  its inline code spans are escaped backticks (`\``). An Edit `old_string` spanning the closing template
  backtick failed to match — split into smaller edits that don't straddle the unescaped closing `` ` ``.
- **A boolean-keep filter must fail CLOSED — `!c.flag` treats an absent flag as removable.**
  `candidates.filter(c => !c.documentsDistinctRule && !c.categoricalKeep)` removes a true keeper whenever the
  agent omits `categoricalKeep`, because `!undefined === true` (the review's HIGH). The load-bearing fix is an
  explicit `c.flag === false` on BOTH flags (absent ⇒ held back), placed in the ORCHESTRATOR filter — the
  schema `required` add is only a contract-boundary backstop, because the test sandbox's mocked `agent()` does
  NOT validate against the schema, so a schema-only fix leaves the orchestrator behavior (and its test)
  unchanged. When "optional for backward-compat" and "fail closed" conflict, and a fresh run always emits the
  field, fail closed.
- **A gate SKIP form that drops a field silently undercounts.** `suiteGreen()` preserved only `{passed,
  failed}`, dropping `skipped`; the activation gate read `.passed` and undercounted whenever skips are
  tolerated (`baselineSkips > 0`). Carry the field through the producer (`suiteGreen` → `+ skipped`) AND read
  the true total (`passed + failed + skipped`) at the consumer. A plan comment asserting an equality
  (`passed == total suite size`) that a tolerated-skip path violates is worth re-deriving from the producer,
  not trusting.
- **A `knownness && threshold` gate needs a PROCEED-side test with a KNOWN value.** Mirror of the reviewer
  lesson from the dev side: every pre-existing Minimize slice reached "proceed" via `generated === null`, so a
  flipped comparison would pass silently. Added slice (e) with `generated = distinctRules + margin + 1` (agent
  spawned, `skipped` absent) and slice (f) with `skipped > 0` forcing the total past the floor. When you add a
  threshold gate, test BOTH sides at the boundary with real numbers, not just the absent-value proceed path.
- **plan.md is architect-owned — a factual plan correction the reviewer requests gets FLAGGED, not edited.**
  FIX-B falsified plan.md:42's wording, but the developer role is read-only on plan.md; recorded the exact
  one-line correction in implementation.md Carry-Over `For: architect` rather than editing the plan. Honors
  the pipeline ownership model (architect updates the plan) while still surfacing the correction.
