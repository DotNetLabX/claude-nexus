---
name: tdd
description: Test-driven development — red-green-refactor loop, one vertical slice at a time. Loaded by developer agent during implementation steps that have testable behavior.
---

# TDD

Test-driven development using red-green-refactor, one vertical slice at a time. Each cycle: write ONE test, see it fail (red), write minimal code to pass (green), refactor only when green.

## When to Use

- Plan step specifies "with tests" or "test coverage"
- Implementing domain logic with clear input/output contracts
- Adding a new endpoint with defined request/response behavior
- Fixing a bug (write the regression test FIRST — see `diagnose` skill Phase 5)
- Writing tests over already-shipped behavior (characterization / coverage backfill) — use the **retro-fit mutation variant** below
- User requests TDD explicitly

## When NOT to Use

- Scaffolding/wiring (DI registration, project setup, infrastructure wiring) — no behavior to test
- UI layout/styling — visual, not behavioral
- One-shot scripts or migrations

## Anti-Pattern: Horizontal Slicing

**Never** write all tests first, then all implementation. This produces tests that verify shape (structure) rather than behavior (what happens when).

```
BAD:  Write 5 tests → implement all → all green
GOOD: Write 1 test → implement → green → write next test → implement → green
```

## Workflow

### Step 0: Bootstrap (first time only)

If no test project exists, set one up following the project's testing conventions if present (e.g. `docs/conventions/testing.md`) — project structure, frameworks, dependencies. If no testing convention file exists, create a minimal test project using the stack's standard test runner and register it in the build.

### Step 1: Plan the Slice

Before writing code, identify the **behavior** to test — not the implementation:
- What does the caller send in?
- What comes back (or what side effect occurs)?
- What must **not** produce it? Write the slice's **must-not list** before the first red: the empty,
  null, placeholder, duplicate, out-of-scope and decline variants of its input, and the branch that
  refuses. An input variant the happy path never tried is the commonest shape of an escaped defect.

Write it as a sentence: "When {input}, it should {behavior}."

When the plan step lists rules under its `Satisfies:` line, those rules are the floor of what to test,
never the ceiling — your own judgment still adds every test it asks for. Each listed rule ends the
step with one disposition on the step's `Rules:` line in `implementation.md`: `tested` (naming the
test), `not testable here` (with the reason) or `disputed` (a question to the architect).

### Step 2: Red — Write One Failing Test

Write one test using the project's test naming convention (e.g. `docs/conventions/testing.md`). Structure: Arrange (set up inputs), Act (call the unit), Assert (verify ONE behavior).

**Run** `verify-run.js --profile fast` — **one call**, never a build call and then a test call. Confirm it fails for the RIGHT reason (not a compile error, not a wrong assertion — the actual behavior is missing). While you iterate, the test you are writing runs alone as `--profile fast --files {that file}`; the step close is the call with no files.

If it fails for the wrong reason: fix the test setup, not the production code.

### Step 3: Green — Minimal Implementation

Write the **minimum** code to make the test pass. No more. Hardcoding is acceptable if only one test exists — the next test will force generalization.

**Run** `verify-run.js --profile fast` — one call — green.

### Step 4: Refactor (only when green)

With all tests passing, improve the code:
- Remove duplication introduced by the minimal implementation
- Extract methods if a block is doing two things
- Rename for clarity

**Rules:**
- Never refactor while red
- Run `verify-run.js --profile fast` after each refactoring move — one call each time — stay green
- Don't anticipate future tests during refactoring

### Step 5: Next Slice

Take the next slice from the must-not list — straight to its red in Step 2 — before any new happy
path; return to Step 1 with a new behavior only once the list is empty. A slice closes when its list
is empty, or when each remaining item is named out of scope in `implementation.md`. Each cycle should
take 5–15 minutes.

## Retro-fit Mutation Variant

Use this when the behavior **already ships and is believed correct** — you are backfilling
characterization or coverage, not driving new code. Step 2's red-first is impossible here: the test
is born green against already-correct code, so a pre-implementation red can never appear. This is the
**one sanctioned exception** to the red-first default — the mutation step below (not a
pre-implementation red) is what proves the test has teeth.

**The retro-fit mutation loop, per test** (or one tight behavior cluster):

**Every "run" in the loop below is one call of `verify-run.js --profile fast`** — the same rule as the
main workflow, and it matters more here: this loop runs three times per mutant, once per guard, so a
build-then-test pair doubles the most call-dense part of the skill.

1. Write the test → run → **green** (it passes against the shipped behavior).
2. Introduce **ONE** temporary mutation into the covered code. Across the whole cluster, however, the
   battery must cover **all three classes below; they are required, not a menu.** An
   author left to choose picks only the class they were already thinking about, which is precisely
   the blind spot this step exists to close:
   - **predicate** (required) — flip an operator, boundary, or constant on a line the test guards.
   - **guard-deletion** (required, and **enumerated — not sampled**) — **for every guard, early
     return, exclusion, or skip in the code under test**, delete the whole line and confirm something
     goes red. Ask of each: "if a future editor removed this line as dead code, would anything go
     red?" Authors systematically skip this class — a battery of predicate flips alone reproduces
     that blind spot verbatim.
   - **refinement** (required wherever a lookup, key, or match is *exact*) — replace it with a
     heuristic one ("this entry" → "any entry"). Catches a guard that is present, tested, and still
     not pinned to the key it must match on; its precision is the load-bearing part and is usually
     unasserted.
3. Run → confirm the test goes **RED for the right reason** (the mutation broke exactly the behavior
   the test asserts, not something incidental).
4. **Revert** the mutation → run → green again.

**Rules:**

- One mutation at a time — never stack two.
- The mutation is **never committed** — verify the working tree is clean of it before moving on.
- A test that stays green under its mutation is testing nothing — rewrite it. This step is the manual
  analogue of a mutation-testing gate: it enforces anti-vacuity in the one case where red-first can't.
  **Triage every survivor before any test is changed — REAL vs the three non-real classes this
  bullet defines (EQUIVALENT, NOT-APPLIED, DOUBLE-GUARDED).** The rewrite rule holds
  for a real survivor only. An *equivalent* mutant — one a downstream `catch` or guard neutralizes,
  an identity case (redirect-to-root equals the status quo), a comparison already false against
  `NaN`, or a branch unreachable on this platform — is **recorded** with a one-line proof of
  equivalence, never "fixed": the only test that kills it pins implementation shape rather than
  behavior. Report the survivors and their class alongside the kills. The third survivor class is
  **NOT-APPLIED**: a mutant whose
  anchor never matched runs the unmodified code and reports as a survivor, indistinguishable from a
  real one — so treat `SURVIVED` as a claim to investigate, and run mutations from a script that
  fails when the anchor is absent, never as an inline one-liner whose "no match" is silent. The
  fourth class is **DOUBLE-GUARDED** — another guard masks the mutant — and it splits in two, with
  **opposite dispositions**. A *redundant chain* (the guards short-circuit to the same observable
  outcome): score the chain by its *terminal* guard, mutate the links **as a set** as well as
  individually (no link killed = the whole chain is untested), and record upstream links
  EQUIVALENT-by-construction with a one-line proof. An *independent downstream guard that changes
  the diagnostic* (the safety effect holds, the message differs): that survivor is **not
  equivalent** — the assertion is too loose; tighten it to the failure **diagnostic verbatim**,
  never a keyword regex.
- **A battery proves nothing over a red suite, and its anchors decay.** Assert a green baseline
  before the first mutation — over a failing suite every mutant reports as killed. A mutant needs a
  *scope*, not just an anchor — a duplicated
  phrase silently relocates it; after any fix or fold to the code under the battery, re-anchor
  and re-run until NOT-APPLIED is zero — never close a battery report carrying one.
- **Score a battery by the runner's exit status, never a regex over its summary line.** A verdict
  predicate that matches nothing reports every mutant identically — a battery that cannot fail is
  the vacuity it exists to detect, one level up. Independent of suite state, so the green-baseline
  rule above does not cover it.
- **Completeness, not sampling — the battery is done when every guard in the code under test carries
  a deletion mutant**, and a report is premature until then. This is the variant's primary case:
  already-shipped code, whose guards are by definition not ones you added. **Additionally, when a
  round *adds* code, every guard inside that new code joins the battery in the same round**, before
  you report — a named blind spot does not close, it moves down one level to the guards the fix
  itself introduced. And mutation is
  structurally blind to a guard that was **never written** — the highest-severity gap shape — so
  pair the battery with 2–3 inputs derived from the cited contract (the spec's or owning skill's
  text), independent of the subject's own code and tests, run against the shipped artifact.
- **When a fix narrows a condition, pin the narrowness.** The behavior and the reason the behavior is
  safe are different claims, and an unpinned load-bearing invariant is one refactor from silently
  loosening. The shape that catches it is a **mixed fixture** — a healthy case and a triggering case
  in the same run, asserting the healthy one still fires. A single-condition fixture cannot tell an
  exact match from a global flag: both produce the same output when only the triggering case exists.
- **Mutation evidence states the classes attempted** — a bare "N/N killed" reads as coverage proof
  while meaning only "N/N of the mutants I thought of". Say which classes were tried, and say that
  the battery is author-written; an independent battery is the reviewer's, not yours.
- This variant is for coverage over **already-shipped** code only. For NEW behavior, normal
  red-green-refactor (Steps 1–5) stays the default — the variant never replaces it.

## What to Test, Mocking Rules, Test Naming, Test Organization

Read the project's testing conventions (e.g. `docs/conventions/testing.md`) for all stack-specific details: test layers and what to mock at each level, mocking rules (mock at system boundaries only, never mock internal classes or pure logic), test naming conventions, test file organization, and assertion style.

The universal principle: mock only at system boundaries (external APIs, message buses, time, file system). Never mock internal classes or pure domain logic.

## Integration with Developer Workflow

TDD is HOW the developer implements plan steps, not a separate phase:

1. Developer reads plan step
2. Developer identifies the testable behavior in that step
3. TDD loop (red-green-refactor) until the step's acceptance criteria are met
4. Move to next plan step

**Not every plan step needs TDD.** Steps that are pure wiring (DI, config, schema migration) skip directly to implementation. Steps with business logic or request/response contracts use TDD.

## Guardrails

- **One test at a time** — never write the next test until the current one is green
- **Test behavior, not implementation** — if refactoring internals breaks tests, the tests are wrong
- **No test-only abstractions** — don't introduce interfaces solely for testability when you can use a real in-process test harness with real dependencies
- **Delete tests that test nothing** — a test that passes regardless of implementation is worse than no test
- **Four shapes make an arm vacuous while green.** (a) An **absence** assertion over output that an upstream guard emptied — every substring is absent from an empty string, so the arm passes on the very failure it exists to catch. Assert the output *exists* before asserting what is missing from it. (Distinct from DOUBLE-GUARDED above: there the downstream guard changes the diagnostic, here it removes the artifact.) (b) An **upper bound with no floor** — a budget gate stayed green through a total delivery failure, because zero is under every cap. (c) An **inequality against the one wrong value** a bug report quoted (`!= "+0"`) — the stale value in another environment is not that value either, so the arm survives. (d) An **absence over a value the subject is never handed** — unreachable by construction, so no mutation can fail it. Before keeping any arm, name the one-line mutation that turns it red; none = vacuous (the loop above).
- **A check added upstream of an existing arm can de-fang it without turning it red.** After tightening a validator, re-read every arm whose payload the new check now touches: one refusing for the *new* reason instead of the old is vacuous while green, and only check ordering decides which happens. Related: a test's **title** is an evidence claim — assert every clause of it, or narrow the title.
- **Integration over unit for endpoints** — prefer one in-process integration test (real host) over mocking 5 internal collaborators

## Required Reading

Before invoking this skill, ensure you have:
- The plan step's acceptance criteria — what behavior needs to be verified
- The test project path (check if a test project exists; if not, run Step 0 bootstrap)
- An existing test file in the same project — for naming conventions and fixture setup patterns
- **The runner each Run step above calls — `verify-run.js --profile fast`.** It runs the `unit` role a
  repo declares in `.claude/verify.json` under `roles` (`build` / `unit` / `full` / `mutation`); an
  implementation subagent is handed the resolved call at spawn, and a standalone session reads the
  path from its plugin-paths block. `unit` is the **narrowest** command covering the change this step
  makes — 30 seconds, never the whole suite — run in a single
  invocation — where the stack needs a build first, that invocation chains build and test rather than
  splitting the cycle into two calls. If the repo declares
  none, use the narrowest command covering the files this step changed, and reach for a separate `build` call
  only inside a compile-fix loop. Never run the `full` suite from this loop: it belongs to the close
  gate, in the main session.

## Anti-patterns

- **Writing all tests first, then all implementation (horizontal slicing).** This produces tests that verify shape rather than behavior. Write one test → implement → green → next test. Never batch tests.
- **Writing a test that passes before any implementation (new behavior).** For **new behavior**, if the test is green before you write the implementation code, the test is testing nothing — confirm the test fails for the right reason (missing behavior, not a compile error) before implementing. This applies to new behavior only: for coverage over **already-shipped** code, red-first is impossible by construction — see the **Retro-fit Mutation Variant**, where a temporary mutation (not a pre-implementation red) proves the test has teeth.
- **Using implementation details as test assertions.** If refactoring internals breaks tests, the tests are wrong. Assert on observable behavior (return values, side effects, state changes) — not on how the code is structured internally.

## What This Skill Does NOT Do

- Set up CI/CD test pipelines — that's infrastructure
- Guide load/performance testing — different concern
- Handle flaky test investigation — see `diagnose` skill
- Make architectural decisions about test boundaries — that's the architect's job
