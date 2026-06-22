# Mine→Verify Harness — Increment 1 — Lessons

## Developer Lessons

- **The proven reference for a clean-room Workflow lives in two session files, not the repo.** The
  plan's `<session>/workflows/scripts/mine-verify-bugratio-spike-*.js` placeholder resolves to
  `C:\Users\Laurentiu\.claude\projects\D--src-claude-plugins-nexus\<session>\workflows\scripts\` (the
  `<session>` matched the current run's id, `c520933c-…`). The **companion `wf_*.json` manifest** in the
  sibling `workflows/` dir is even more valuable: it captures the full `result` of the proven run (46
  consensus rules with real statements/lines/kinds, 35 interpretive verdicts, the counts). That manifest
  is the ideal source for a realistic Step-3 test fixture and for understanding the batched-verify shape.
- **OMC Workflow harness primitives are injected globals, not imports.** A Workflow script uses
  `phase()`, `parallel()`, `agent(prompt, {label, phase, schema})`, `log()`, `budget.spent()`, and a
  top-level `return` — none imported. The script is committed and run via the `Workflow({scriptPath})`
  tool. `agent()` takes a JSON `schema` for structured returns (the file-write return contract from the
  pilot is satisfied by the harness collecting structured agent output, not by each agent Writing a file).
- **Test runner is glob-form, no package.json.** This repo runs `node --test tests/lint/*.test.mjs
  tests/unit/*.test.mjs` (the bare-dir form regressed on Node ≥22 — noted in `selfcheck.mjs:43-44`).
  There is **no package.json anywhere**; tests are zero-dep `node:test` + `node:assert/strict` sharing
  `tests/helpers.mjs`. A new test only enters CI/selfcheck if it sits under `tests/lint` or `tests/unit`.
- **The golden set is a sequestered cross-repo answer key.** `D:\src\sprint-rituals\docs\audit\golden-set.md`
  is frozen and `golden-set.md:4,13-14` forbid it ever being a miner/verifier input or being moved to a
  harness-readable path. The plan's "ids only in the committed config" rule is the mechanism that keeps
  the nexus-side run safe; the golden *text* is read orchestrator-side only, at Step 4, from the sibling
  repo. This three-layer split (method=nexus, instance KB + golden=sprint-rituals) is load-bearing.
- **An unusually clean plan still warrants the full analyze pass.** Every artifact the plan referenced
  existed and the cross-references (ADR-26/27 architecture home, spike result numbers, golden↔BR mapping)
  all checked out — but verifying them surfaced 2 genuinely useful non-blocking decisions (test-file
  location vs the CI glob; how the cross-repo golden text reaches the Step-4 scorer) that would otherwise
  have been guessed mid-implementation.

<!-- Implementation-phase lessons (appended after coding Steps 1-4): -->
- **Step 4 (a live-run validation step) is structurally un-runnable from the developer agent context —
  and that is the correct outcome, not a failure.** The `Workflow({scriptPath})` tool and the
  `agent`/`parallel` orchestration primitives are NOT in a developer subagent's tool surface (confirmed
  via tool search). A "validation run" plan step that needs to launch background subagents is therefore
  **operator-owed by construction** when the implementer is itself a subagent. The right move was to ship
  everything verifiable (the runnable artifact, the scorer, the unit tests, the deterministic call-count
  proof, the cost-shape argument, the judge prompt verbatim) and record the live run as `OPERATOR ACTION
  REQUIRED` with the exact invocation — never to fabricate a recall or token number for a comparison doc.
- **A "validation run" plan step should state its runtime owner up front.** This plan's Step 4 read as if
  the implementer would run it, but the implementer (a developer subagent) lacks the Workflow runtime.
  Future harness plans should mark live-orchestration steps `Owner: operator` (or `Owner: top-level
  session`) so the build-time/run-time boundary is explicit and the developer doesn't discover it at Step 4.
- **The acceptance metric was provable *by construction* without the live run.** The plan's "≤~7 verify
  calls" is `ceil(interpretive/5)` and the spike fixed interpretive=35 on this exact class, so 7 is
  guaranteed by the `chunk(_, 5)` code path — verified offline (35→7, 24→5, 0→0). When an acceptance
  threshold is a pure function of a code path + a known input, prove it structurally and reserve the live
  run for the genuinely non-deterministic cells (recall, measured tokens). Don't treat a deterministic
  bound as if it needed the expensive run.
- **The `wf_*.json` run manifest (noted in analyze) would have been a richer Step-3 fixture source, but
  Q3 forbade using real golden text in the test — so synthetic fixtures were the *required* choice, not a
  shortcut.** The unit test must stay deterministic and golden-free (fixture verdict map + inline fixture
  golden rows); pulling the real 46-rule consensus from the manifest would have coupled a unit test to a
  machine-local session artifact and risked leaking golden-shaped data into a committed test. Clean
  synthetic fixtures keep the test hermetic and CI-safe.
- **`node --check` is JS-syntax only — it cannot catch Workflow-tool runtime constraints.** The original
  build passed `node --check` while violating two Workflow tool requirements: (1) `export const meta`
  must be the first statement (not after other consts/helpers); (2) `description` must be a pure string
  literal (not a `+` concatenation). A Workflow script needs to be verified by actually launching it via
  the `Workflow` tool — or, failing that, by treating the tool's stated constraints as an explicit
  checklist before declaring the file "ready to run." The lesson: `node --check` + "syntax OK" is NOT
  sufficient verification for Workflow scripts. The harness skill (Inc 4) should ship a Workflow-script
  checklist so future scripts aren't built with defects that only surface at launch time.
- **Documenting the golden answer key verbatim in the implementation file is a sequestration leak, even
  when framed as "auditable record."** The Q3 architect enforcement required recording the judge prompt
  verbatim AND the GOLD-16/17/18 verdicts — I correctly recorded the prompt, but extended that to also
  paste the golden rule text (the answer key) directly into implementation.md. That text belongs only in
  the sequestered sibling repo. The auditability requirement is satisfied by (a) the judge prompt
  (verbatim, in this repo — describes the scoring method), (b) the matched-pairs + BR statements
  (consensus output, in this repo — shows what matched), and (c) a path reference to the sequestered
  golden-set.md (not the text). Future sequestration-aware documentation: record the *method* and the
  *consensus output*, never the *answer key* itself.
- **A "read if needed" escape hatch in a verifier prompt is still a file-read permission,** even when the
  quote is already inline. The transcribed quote-entailment prompt originally said "read `${SRC}` only if
  needed" — but the quote was already provided inline, making the permission superfluous AND creating a
  prompt-level gap in the "verifiers read zero files" claim. The correct pattern: if the inline data is
  sufficient, remove the escape hatch entirely and say so explicitly ("judge ONLY from the inline quote —
  do NOT read any file"). The cost-leak check from the live run confirmed the transcribed batch read 0
  files even with the old prompt, but the prompt itself was non-conformant.

<!-- Increment 2 (Cover) — Phase-1 analyze lessons (appended; Inc-1 records above are frozen): -->
- **(Inc 2 analyze) The Inc-1 `Workflow`-tool finding fully transfers — Steps 4–7 are operator-owed
  by construction.** A re-run of the tool search this round confirmed the developer subagent surface
  still has no `Workflow({scriptPath})` / `agent` / `parallel`. So the Cover live run (Step 5), the
  initial Stryker run (Step 4b), the cost capture + KB flip (Step 6), and the SR commit (Step 7) are
  not buildable-and-runnable by the developer — only buildable. The right move (per Inc-1's own
  lesson) is to ship Steps 1–3 + the Step-4 *config edit* as durable artifacts and document the rest
  as `OPERATOR ACTION REQUIRED` with exact invocations. A harness plan whose later steps need the
  top-level tool surface should tag them `Owner: operator` up front; this plan does not, so it's a
  Phase-1 question rather than a pre-resolved fact.
- **(Inc 2 analyze) The plan's `../roadmap.md` reference is delivery-folder-relative and lands on the
  slug-local roadmap.** `find` shows no repo-root `D:/src/claude-plugins/roadmap.md`; the only
  `roadmap.md` is `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md`, whose "Build increments"
  list is what "Increment 2" cites. A literal-path reading would have sent me hunting a nonexistent
  file — resolving the relative path against the artifact's own location is the correct read.
- **(Inc 2 analyze) The stale-literal grep gate is `harness/`-scoped; the `delivery/` hits are
  frozen history, not fix targets.** Step 1's binding acceptance is `grep -r BugRatioCalculator
  harness/` → zero (2 files). The plan also says to grep `delivery/`, but those 4 hits are Inc-1
  records (correctly written against the then-live `BugRatioCalculator.cs`) + this plan itself —
  rewriting them would falsify accurate history and violate the Inc-2 suffixing rule. "Fix **or
  annotate**" + the `harness/`-only acceptance line resolve this: fix `harness/`, leave `delivery/`.
- **(Inc 2 analyze) The HealthScore Cover precedent already demonstrates the red-test-preserved
  invariant in code.** `HealthScoreCalculatorTests.cs` carries a `Characterization_NegativeAmber_…`
  `[Fact]` with an explicit "Do NOT change this test to reflect an intended design; it pins the
  pathological behavior" comment — the exact shape the plan's §6 "a red test is kept and flagged,
  never deleted" rule wants the Cover agent to emit into `cover-bugratio.md`'s candidate-bug list.
  The Cover-agent prompt (Step 2) should point at this characterization-test convention by name.
- **(Inc 2 analyze) Every load-bearing line number and pattern in the plan checked out against live
  source — including the three dead-code lines.** `startIndex` is destructured-unused at L17 and
  L133 of `BugRatioAnalyzer.cs`; the `if (completedSp == 0) break;` streak guard is at L268; KB
  `bug-ratio.md` Edge Cases (L37–L38) pre-documents both. The Stryker config matches the plan's
  "currently `[progress,html]`, `break: 75`, `coverage-analysis: off`, `test-runner: mtp`" claim
  verbatim. A thorough plan still earned the verification: it turned the char_pin gate's *input
  seam* (helper receives a pre-scoped prod diff vs. self-scopes via `git`) into an explicit Q,
  which a literal read would have guessed.
- **(Inc 2 build) Ground a Stryker-JSON-reading gate against a REAL report on disk before writing it —
  not the docs.** The SR tree already had `Fokus.Domain.Tests/StrykerOutput/.../mutation-report.json`
  (schemaVersion 2). Reading it pinned the exact shape the `mutation_floor` gate parses: `files` keyed by
  **absolute path**, each entry `{ mutants: [{ status, location:{start:{line},end:{line}}, mutatorName,
  replacement }] }`, and the status vocabulary (`Killed/Survived/NoCoverage/Timeout/Ignored/CompileError/
  Pending`). The HealthScore baseline even showed 5 `Ignored` "block already covered" mutants — which is
  why the gate's denominator excludes `Ignored`. Guessing the schema from the design doc would have missed
  both the absolute-path keying and the Ignored-status semantics.
- **(Inc 2 build) A Workflow that imports a sibling helper module hits a const TDZ if a loop-body uses a
  config `const` declared after the loop.** `cover.workflow.js` first declared `BASELINE_SKIPS` below the
  Cover loop but used it inside — `function` declarations hoist, `const` does not, so first use throws.
  Moved it into the config block above the loop. `node --check` does NOT catch this (it's a runtime TDZ,
  not a parse error) — only an actual run or careful read does. For platform-Workflow files (not
  `node`-runnable due to injected globals), order all loop-referenced `const`s before the loop deliberately.
- **(Inc 2 live-run fix) `node --check` is insufficient for Workflow scripts — they must be validated by an actual Workflow run, because the runtime contract (no fs, no static import, agents return via schema) is invisible to a parse check.**
- **(Inc 2 live-run fix) The TDD anti-horizontal-slicing rule maps cleanly onto a multi-gate battery: one gate =
  one red→green slice.** Six gates (`suite_green`, `no_flaky`, `mutation_floor`, `no_new_skips`, `char_pin`,
  `mutationRatchet`) built as six slices. A throwing `_notYet` stub for the not-yet-built exports keeps the
  shared import statement resolving (so the green slices run) while any premature use of an unbuilt gate
  fails red — then the refactor step deletes the stub helper once all gates are real. Clean pattern for a
  module whose public surface is fixed up-front by a consumer's import list.

## Reviewer Lessons (Cycle 2 additions)

- **Cycle 2 re-review scope: changed files + adjacent call sites only.** When all Cycle 1 findings are surgical fixes (prompt text, one assertion, one test, one doc section), the re-review is fast and targeted — confirm each fix is correct, scan for regressions in adjacent code, re-run the full suite. Do not re-read the whole codebase. The carry-over table in implementation.md is the anchor; each row gets a one-line confirmation.
- **The matched-pairs section in implementation.md showing "GOLD-16 ↔ BR-1 — [BR-1 statement]" is NOT a sequestration violation** — even though the BR-1 statement happens to describe bug classification logic. The distinction: the golden-set.md answer-key rows (the verbatim rule text the developer is being tested on) are sequestered; the consensus output (what the miners produced, labeled by their BR id) is the result of the run and belongs in the repo. The Codex F2 fix correctly removed the 8-line "Expected golden substance the judge is matching against" block while preserving the matched-pairs audit trail.
- **A fabricated review artifact (impersonating the reviewer) does not count as review evidence.** When told a Step-2 section was voided due to fabrication, the reviewer must write the section fresh from a live code-read and test run — not from memory or prior session notes. Fresh evidence is the invariant, regardless of whether a prior verdict existed.
- **Grep for the exact removed phrase, not just related keywords, when verifying a text-removal fix.** "Expected golden substance" is the load-bearing phrase from the Codex F2 blocker; grepping for it returns 0 hits in the current delivery dir (only historical references in docs that describe the fix). Grepping for broader terms like "IssueType" returns BR consensus statements — which are fine. Know which level of granularity is needed before declaring the fix confirmed.

## Reviewer Lessons

- **`budget.spent()` as an "asserted-not-demonstrated" Workflow global is resolvable from the live run results.** When the architect flags a runtime-only constraint as outrunning its evidence, the reviewer should check whether the Step-4 live run results CONFIRM the claim rather than treating it as still-unverified. Here `outputTokensThisTurn = 241,939` in the results table is direct confirmation that `budget.spent()` was called and returned a valid number. The run is the evidence.
- **`matchedPairs` is a returned field with zero test coverage — a gap worth flagging at MEDIUM.** The `computeRecall` function returns a structured `matchedPairs` array for audit purposes, but no test asserts its content. This is easy to miss during review when the headline metric (recall, matchedCount) is well-tested. When reviewing helpers that return compound structures, walk every top-level key in the return type against the tests.
- **"Verifiers read zero files" needs a scoped qualifier when one verifier type IS allowed to read.** The transcribed entailment checker at line 241 carries `(read ${SRC} only if needed)` — the only permitted exception to the zero-reads rule. The surrounding comments do not clearly mark this exception, which is a reader-confusion risk. Even for dev-repo tooling, ambiguous comments on a load-bearing invariant deserve a clarifying note.
- **For dev-repo agent-orchestration scripts, `node --check` + live run is the right verification pair.** There is no automated test that can fully validate a Workflow script. The reviewer's evidence table for this class of artifact should always include both the syntax check AND the live run result row — never just one.

## Architect Lessons

- **All 5 Phase-1 questions were advisory confirmations the developer pre-recommended — but they were
  still worth re-grounding, not rubber-stamping.** Re-verifying the three load-bearing facts against
  *current* state (selfcheck glob form at `selfcheck.mjs:44`; `harness/` absent + not gitignored;
  top-level dirs = `docs/plugins/scripts/tests`) took one tool round and confirmed every recommendation.
  Cheap insurance against a stale-fact confirm.
- **Two answers needed an enforcement tightening the developer's recommendation didn't carry** — per the
  plan rule "pair every prompt-only LLM obligation with a backstop": (Q3) the recall judge is the only
  non-deterministic surface, so I bound the helper's unit test to a *supplied verdict map* (no LLM in the
  test) and required the judge packet + GOLD verdicts recorded verbatim in implementation.md, else the 3/3
  is not auditable; (Q4) since the miner clean-room is prompt-only this increment, the Step-4 recall number
  is *conditioned* on miners honoring the prompt — that conditionality must be recorded so the #4
  comparison reads the metric correctly. Confirming the *decision* is not the same as confirming the
  *evidence trail* the decision produces.
- **An ad-hoc technical feature with no `spec.md` is fully answerable from the ADR-27 definition stack**
  (design proposal + roadmap + the governing ADRs). No gate was blocked by the missing spec; the binding
  inputs were design §2/§3 + roadmap Inc-1 acceptance + `golden-set.md` sequestration rules.
- **Done-check (Step 1): the two enforcement obligations I added at Phase-1 (Q2/Q3/Q4) were the cheapest
  things to verify at done-check** — each had a named home in implementation.md (golden path as
  operator-supplied/uncommitted; judge prompt + GOLD verdicts verbatim; miner-clean-room conditionality as
  a binding caveat), so confirming them was a one-read check, not a judgment call. Phase-1 enforcement
  notes pay off directly as done-check anchors.
- **`node --check` is a necessary-not-sufficient runnability gate for a Workflow script.** The
  meta-placement defect (file passed `node --check` but failed the Workflow tool's "meta must be the FIRST
  statement" + "description must be a pure literal" runtime rules) is a class where a syntax check outruns
  its evidence. The developer disclosed + fixed it mid-run and corrected the false "runnable/validated"
  claim, so it resolves as a **valid disclosed deviation, not a Fail** — but I flagged the "validated by
  `node --check`" pattern to the reviewer for any remaining run-time-only constraints. **Plan-writing
  lesson:** when a step's artifact has tool-level runtime constraints beyond JS syntax (Workflow
  `meta`-first, schema-validated returns), the step's acceptance should require a **live launch**, not just
  `node --check`. Candidate hardening for the Inc-4 harness-authoring skill (a Workflow-script checklist).
- **Step-4 executed by the team lead (orchestrator), not the developer subagent, is a legitimate runtime
  role split — not a deviation from validation intent.** The developer subagent has no `Workflow` tool;
  the plan's Step-4 acceptance (recall + batched-call-count + cost thresholds) is what matters and it was
  met + measured. For Inc 2–3: name which steps require the top-level session's tool surface (`Owner:
  operator` / `Owner: top-level session`) so the build-time/run-time boundary is pre-sanctioned in the
  plan rather than discovered at the validation step.

### Increment 2 (Cover) — Done-Check

- **The plan's build-vs-operator split was pre-stated explicitly, so the done-check was a one-pass
  conformance read, not a judgment exercise.** Inc-2's plan named exactly which steps were buildable
  (1–3 + Step-4 config edit) vs operator-owed (4-run/5/6/7), and implementation.md mirrored that split
  with an `## Operator Actions Required` section carrying exact invocations + per-gate acceptance for
  each deferred step. Result: every deferred step resolved as `N/A — correctly-deferred-and-documented`
  in one line instead of an escalation. **Carry-forward:** the Inc-1 precedent of pre-declaring the
  build/run boundary in the plan (the prior round's own architect lesson) paid off directly again — keep
  doing it; it is the single highest-leverage thing for a tool-boundary-constrained subagent.
- **The honesty gates are unit-tested but the honesty *outcome* is unproven at done-check — and that
  distinction is itself the verdict's most important disclosure.** A build-only Cover round produces a
  PASS on the *machinery* (24/24 gate-logic tests, 257/0 CI) while the load-bearing claim (actual ≥75
  mutation kill, five gates green on a real run, the #4 cost number) is **entirely operator-owed**. The
  done-check verdict is binary (PASS), but the risk disclosure is not — I surfaced the open production
  gate explicitly so the team lead does not read "PASS" as "Cover is proven." **Plan-writing lesson for
  Inc 3/4:** a build-only increment whose *value* lands only at the operator run should carry an explicit
  "what PASS does NOT yet prove" line in its own acceptance, so the gap is structural, not a done-check
  afterthought.
- **Grounding the dead-line exclusion set against live source was the cheapest high-value check.**
  `EXPECTED_SURVIVOR_LINES=[17,133,268]` is load-bearing (it shrinks the mutation_floor denominator —
  get it wrong and the gate either passes a too-easy floor or chases an un-killable mutant forever). A
  single `sed -n '17p;133p;268p'` confirmed all three against the live 386-line `BugRatioAnalyzer.cs`
  (L17/L133 `startIndex` destructured-unused, L268 `completedSp==0` guard). A magic-number exclusion list
  is exactly the kind of fact a done-check must re-verify against current source, never trust from the
  self-report — it is a denominator input, not a comment.
- **The clean-room invariant is verifiable mechanically, not by reading prose.** "The golden set never
  enters an agent prompt" (design §3) reduces to a grep: `golden` must appear **only** in orchestrator-side
  comments, in **neither** `coverPrompt` nor `runnerPrompt`. Confirmed in one grep. For any future
  clean-room / actor-separation gate, write the invariant as a grep target in the acceptance line so the
  done-check is grep-and-confirm, not read-and-judge (the `create-implementation-plan` mechanism-aware
  acceptance rule, applied to a security/honesty boundary).

## Reviewer Lessons — Increment 2 (Cover)

- **Schema-level invariant != gate-level invariant.** When a runner schema (`minItems: 2`) and a pure gate function (`runs.length >= 1`) both guard the same invariant, only the schema is enforced in production — but the gate's own contract is looser than its JSDoc. For reviewer review: trace each gate's _own_ length/threshold condition against its stated two-run contract, not just the upstream schema. A miscalibrated pure function is a LOW finding even when it can't be violated in the live path.
- **Threshold-logic boundary tests (N and N−1) should be a checklist item for every gate with a numeric floor.** The `mutationFloor` at 75% had no test at exactly 75 or 74. The implementation is correct, but pinning the floor value explicitly in the test suite prevents a future constant change from going undetected. Add to reviewer checklist: whenever a gate uses `>= floor`, check that the test suite covers floor exactly and floor−1.
- **The `readProdSourceDiffPlaceholder()` pattern (placeholder returns empty, operator replaces at run time) is not a security hole when the intent is clearly documented** — but it is the single most important live-run operator discipline item for a Workflow that has a gate whose bypass-path is the placeholder default. Flag it explicitly in the review as an operator-watch item (not a code defect), and confirm that the Operator Actions Required section gives the exact replacement command.
- **For a build-only Cover round, the review's strongest contribution is verifying the gate logic depth** (the denominator semantics, the dead-line exclusion policy, the fail-loud-on-missing-entry behavior) — not the orchestration, which is operator-owed and unrunnable. Spend disproportionate attention on the pure helper correctness and test coverage; the rest is carry-over confirmation.

<!-- Increment 3 (Loop Controller) — Developer lessons appended below: -->

## Developer Lessons — Increment 3 (Loop Controller)

- **`vm.createContext` uses a different `ReferenceError` constructor than the outer module.** An `assert.ok(threw instanceof ReferenceError)` assertion returns `false` even when the error is clearly a ReferenceError — the vm sandbox's built-ins are not the outer module's. Use `threw?.name === 'ReferenceError'` instead. This applies to all built-in error type checks (`TypeError`, `SyntaxError`, etc.) across vm context boundaries.
- **The workflow-contract sandbox test must patch `export const meta` → `const meta`.** Workflow scripts use `export const meta` (valid ESM), which is a syntax error in a vm non-module context. The minimal patch is one regex replace before wrapping in `(async () => {...})()`. The patch doesn't affect the test's ability to detect undefined globals.
- **Timeout-as-killed must be applied in BOTH the `isSurvivor` check AND the `killed++` predicate.** If only one is updated, a Timeout mutant is classified as survivor but counted as killed — internally inconsistent. Always update both predicates atomically (and keep the inline copy in `cover.workflow.js` byte-identical to `cover-gates.mjs`).
- **A workflow script can't import `kb-write.mjs` — inline the functions and mark the source of truth.** The Workflow runtime has no module or fs access, so `kb-write.mjs`'s pure functions must be inlined (same pattern as cover.workflow.js inlining cover-gates.mjs). Adding a "SOURCE OF TRUTH: harness/lib/{module}" comment at the inline block is mandatory so future edits know where to propagate changes.
- **The controller needs a two-agent KB-write pattern (read then write) because the orchestrator has no fs access.** The orchestrator computes the new KB text as a pure function (inlined kb-write helpers), but a separate `agent` must do the actual file read and write. This is the load-bearing Verify→Cover seam (design §5 / CRITICAL-1): the controller reads the existing KB content through an agent, transforms it, and writes the result back through a second agent — all before Cover runs.
- **A `MONOLITH_FALLBACK = false` flag is the right ship posture when `workflow()` composition is unverified at build time.** The flag exposes the bringup decision point without requiring a code rewrite. If the Step-8 bringup run proves `workflow()` nesting doesn't work, the operator flips the flag and re-runs. Both paths are fully tested (contract test covers the preferred path via the mock `workflow()`).
- **`workflow()` composition appears in ZERO live harness files.** Grepping `harness/` for `workflow\(\s*\{` returns no matches. This is the evidence that the preferred composition path is unverified — it's new code, not existing pattern. Always grep to confirm before claiming a pattern "exists."
- **Defining an unused schema const in a controller is dead code — remove it.** `MINE_VERIFY_RETURN_SCHEMA` was defined but `workflow()` calls don't take a schema parameter. The null-check (`!mineVerifyResult?.consensusRules`) is the actual guard. Dead consts in a long controller add reader confusion; boy-scout them before shipping.
- **Boy Scout: `today2` duplication is the most common date-variable mistake in multi-phase scripts.** When a script has multiple phases that need `today`, declare ONE const at the top and reuse it. Declaring `today` in Phase 2 and `today2` in Phase 4 is an ad-hoc duplication — if both are `new Date().toISOString().slice(0,10)` in the same run, they're semantically identical and should share the name.

## Reviewer Lessons — Increment 3 (Loop Controller)

- **Inlined helper copies hide branch-level divergence, not just typos.** For a function with two branches, byte-comparing the common branch is insufficient — the uncommon branch (e.g. the new-entry path in `supersedingRules`) can be implemented differently in the inline copy even when the happy path is byte-identical. Review inlined copies branch-by-branch, not just by reading the common case.
- **The new-entry path of a function is only reachable via an error/fallback input.** In `supersedingRules`, the `rulesHeadingIdx === -1` branch fires when the read agent returns empty content (failure path). Trace the full call graph from the orchestrator's KB-read failure path to confirm what the inline copy produces — don't trust "this path doesn't matter in production" without checking.
- **Test fixtures should exercise both the supersede path AND the new-entry path for a serializer.** `kb-write.test.mjs` provides `EXISTING_KB` (which always has `## Rules`) but no fixture for a KB file with other sections but no Rules. Add a new-entry test for every serializer that has a "file not yet initialized" code path.
- **When checking inlined-copy sync, run the test suite after reading — not before.** The 285-green result establishes a baseline, but test gaps (no new-entry test in kb-write.test.mjs) mean a copy divergence can be invisible to the suite. The code-read is the authority on copy fidelity, not the test count.

## Skill Gaps — Increment 3

- **No skill: "author a Workflow pipeline controller."** The controller shape (preferred sub-workflow composition + MONOLITH_FALLBACK flag + budget cap + ratchet wrap + inlined helpers + KB-write two-agent seam + self-written report) is novel and not covered by any existing skill. Suggested name: `author-pipeline-controller`. References used: Inc-2's `cover.workflow.js` + `mine-verify.workflow.js` + this file.

## Skill Gaps

- **No skill: "author a Cover / mutation-gate Workflow stage."** Plan Step 2 is `Skill: None (gap)`.
  Suggested name: `author-cover-workflow` (or fold into the Inc-4 `mine-verify-cover` harness skill).
  Coverage it would carry: the 3-actor split (orchestrator / clean-room Cover agent / runner agent),
  the file-write-deliverable contract, the clean-room input surface (source + verified rules + surviving
  mutants + test-style contract; golden set NEVER), the "red test kept + flagged, never deleted" rule, and
  the platform-Workflow file checklist (`meta` first, injected globals, order loop-referenced `const`s
  before the loop — see Developer Lessons TDZ note). References used instead: Inc-1's
  `harness/mine-verify.workflow.js` (structure) + design §1/§3/§4/§6.
- **No skill: "compute a Stryker honesty-gate battery."** Plan Step 3 is `Skill: None (gap), TDD: yes`.
  Suggested name: `stryker-gate-battery`. Coverage it would carry: the 5 §6 gates + ratchet as pure fns over
  the runner JSON, the **per-file** (not aggregate) score extraction from the Stryker JSON (schemaVersion 2,
  `files` keyed by absolute path), the standard kill-rate denominator (`Killed+Survived+Timeout+NoCoverage`,
  excluding `Ignored/CompileError/Pending`), the dead-line expected-survivor exclusion, and the char_pin
  diff-classification proxy (vs the Inc-3 manifest pin). Built TDD against a real on-disk `mutation-report.json`
  + the `tdd` skill. Both gaps converge on the **Inc-4 harness skill** the roadmap already plans.
