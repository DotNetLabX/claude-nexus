# Lessons — adhoc-ConformanceReviewer

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] platform-capability claims cite the ADR/CHANGELOG line, never memory → architect.md tech-spec anchor grounding. node --test trailing-slash spurious-fail → tests/README.md glob-form convention.

## Architect Lessons

- **ADR numbers race under concurrent sessions — re-check the register at the moment of use, not at
  draft time.** This spec drafted its ADRs as 52/53 on the strength of a same-day register read
  ("ADR-51 is highest"). By plan-critic time, `adhoc-AgentGrounding` had landed ADR-52 (committed
  `9bab0a7`) — the extraction would have corrupted the register with two ADR-52s. The critic's
  CRITICAL forced the renumber to 53/54, and the Graduation step now mandates a register re-check
  immediately before extraction. General form: any globally-numbered artifact (ADRs, migrations) must
  be claimed against the live state at write time; a number "verified free" earlier in the same day is
  not a reservation.

- **A debunked claim resurfaced in a fresh plan — the corpus caught it because a code-grounded critic
  read the corpus.** The plan justified the operator-owed calibration carve-out with "subagents can't
  sub-spawn" — a claim this repo already corrected once (CHANGELOG 1.x: ADR-21 changed "cannot spawn"
  to "must not"). The conclusion (operator-owed) survived on correct grounds (the verdict is the
  owner's; the run is orchestrator-owned per the mine-verify-cover topology), but the false premise
  shipped in the draft. Ironically this is the exact defect class the Conformance Reviewer is being
  built to catch. Do-not-repeat: platform-capability claims in plans cite the ADR/CHANGELOG line, not
  memory.

- **Research-before-spec paid for itself in design decisions, not just confidence.** Three concrete
  spec elements came straight from evidence that intuition had wrong: (1) repo-grounded rules files
  are commodity across commercial tools — the differentiator is the maintained corpus, which
  re-anchored the build-vs-buy recommendation; (2) more repo context makes review models WORSE
  (SWE-PRBench ablation) — the "diff + targeted facts, never whole files" rule inverts the natural
  instinct to feed more context; (3) the two-stage generate→filter shape is the only
  production-measured precision architecture (BitsAI-CR) — it upgraded mine→verify from house habit
  to evidence-backed design.

- **Grep-token acceptance must cover every AC a step claims to satisfy.** The critic found four ACs
  (B.2, B.4, C.2, D.4) claimed in Step 1's `Satisfies:` with no corresponding acceptance token — a
  SKILL.md could pass every listed grep while omitting the skeptic stage, the helper-model rule, the
  go-live gate, and standalone mode. "Satisfies" without a checkable token is verification theater;
  the token list and the Satisfies list must reconcile 1:1.

- **Fail-closed gates need a binding marker, not a described state.** "An owner-recorded pass verdict
  exists" is a judgment; `grep '## Owner verdict: PASS'` is a gate. The calibration report's verdict
  marker became a binding surface so the go-live check is deterministic in both directions (UNGRADED
  and FAIL fail closed).

- **Done-check: pre-authoring the operator-owed carve-out turned a would-be escalation into a
  one-line PASS.** The plan named the calibration run operator-owed up front with a fail-closed
  `## Owner verdict: PASS` gate and an `OPERATOR ACTION REQUIRED` note. The consequence at done-check:
  the developer left it undone *correctly* — and, critically, did **not** fabricate a PASS stub to
  "finish" it (which would have silently unlocked live PR posting). A clean PASS with nothing to
  escalate is the payoff of the pre-authored-fallback rule; the failure mode it prevents is a
  developer manufacturing the gate's success condition to close a step. Do-not-repeat for planners:
  when a step's success condition is *itself* a gate marker (a verdict line, a `PASS` token), state
  explicitly that the developer verifies runnability only and must never write the success value.

- **A done-check can PASS while a real production gate stays locked — surface it, don't bury it.**
  Every developer step here is Implemented, yet live PR posting remains locked pending the owner's
  calibration grade. The verdict is binary (PASS); the risk disclosure is a separate line. The
  done-check must explicitly record the still-open production gate on a PASS, so "method ships" is
  never misread as "capability is live." implementation.md modeled this well (the OPERATOR-owed
  callout); the done-check mirrors it rather than absorbing the gap into a silent green.

## Developer Lessons

- **Phase-1 analysis (2026-07-09): Step 1's flagged concern is a non-issue — verified, not deferred.**
  Step 1's confidence note said "ask if the calibration-gate wording fights the skill-lint required
  sections." Read of `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs`: the only blocking
  errors are E1–E8, and E3/E4/E5 require *frontmatter only* (`name` == folder, `description` present) —
  **no body sections are required** (W3 is a >500-line warning, not an error). So the calibration-gate
  prose (`## Owner verdict: PASS`, etc.) cannot collide with any required section. The real skill-lint
  hazard is **E7** (XML/angle-bracket tokens in prose; code fences + inline-code spans exempt) — the
  plan already mandates `{file}`-style placeholders in prose and `gh` recipes inside fences. No question
  raised; the concern is closed by inspection.
- **Repo corpus is thin here (informational, for the operator-owed calibration run).** Of the six
  charter grounding sources, only `docs/architecture/` is present; `docs/conventions/`,
  `docs/reference-model.md`, `docs/tech-debt/`, and `graphify-out/` are absent. This does not block
  writing the skill (stack-agnostic, read-if-present, and the absence is exactly what the "No corpus,
  no review" rule is for), but the operator's calibration replay over this repo's history will surface
  sparse findings — a known, tech-spec-acknowledged caveat (internal-evidence Caveat: "cannot size the
  lens on product code"), not a defect.
- **Phase-2 implementation (2026-07-09): the E7 hazard was the only real skill-lint risk, and the plan
  had already pre-empted it — the skill was born-compliant on the first `skill-lint` run (OK, no
  warnings).** Concrete mechanics worth reusing when authoring a `gh`-recipe skill: (a) the reviews-API
  placeholders for owner/repo/file MUST be written `{owner}`/`{repo}`/`{file}` in prose and all `gh`
  command lines kept inside fenced code blocks — E7's regex fires on any angle-bracket form in prose;
  (b) inline-code spans are ALSO exempt (the lint strips `` `...` `` before the E7 scan), so
  `` `@@ -a,b +c,d @@` `` in prose is safe; (c) keep the body under 500 lines to avoid the W3 warning
  (landed at ~230) — no `references/` split needed for a single-purpose method skill.
- **`node --test <dir>/` (trailing-slash directory arg) can emit a spurious "fail" — node tries to
  execute the directory path itself as a test file.** Running `node --test tests/lint/` reported `fail 1`
  with the directory name as the failing "test", yet every file passed individually and via the glob
  `tests/lint/*.test.mjs` (47/0). When a directory-arg run shows one unexplained failure named after the
  directory, re-run with the `*.test.mjs` glob before treating it as real.
- **git-bash `grep -iF` aborts on this Windows box** (`Aborted` on every `-iF` invocation). Use the
  ripgrep-backed Grep tool for case-insensitive literal token confirmation instead of shelling out.
- **Fix-cycle 1 (2026-07-09): the same behavior described in two loci must be reconciled in both, or
  the two drift.** The prConformance trigger and the calibration gate were each stated in *both*
  `team-lead.md` (the PR-tail bullet) and `SKILL.md` (the skill's own gate). The round-1 defects were
  exactly the drift between them: `team-lead.md` claimed an "offer once when absent" branch that 4b's
  "missing key → default, never ask" makes unreachable, and both files described the uncalibrated path
  as "runs calibration-only" (an implied auto-replay). When a rule lives in two documents, a fix to one
  is incomplete until the other is aligned — I edited the SKILL gate (FIX 2) *and* the team-lead bullet's
  calibration clause in the same pass so they read identically. Do-not-repeat: after editing a
  cross-referenced behavior, grep the peer document for the old phrasing before declaring done.
- **A same-line, non-overlapping double-edit is the clean way to change two independent clauses in one
  long prose line.** `team-lead.md:397` needed two unrelated fixes (trigger semantics + calibration
  phrasing) on the same wrapped source line. Two separate `Edit` calls, each keyed on a distinct unique
  substring, applied cleanly — no need to rewrite the whole 400-word line and risk an unintended reword
  of the untouched middle (ADR-30 byte-stability). Then regenerate the command and `git diff --stat` the
  `commands/` dir to confirm only the intended command changed (+3/-2 here).

## Reviewer Lessons

- **A plan-cited internal shorthand ("T3") can look like a fabricated citation until you read the
  tech-spec's own grounding line.** SKILL.md points to "the T3 boundary entry" for the deterministic-tier
  exclusion; the research doc `sonar-codescene-llm-review-boundary.md` has no literal "T1/T2/T3" label
  anywhere in its body. It resolved cleanly: `tech-spec.md:12-13` defines T1+T2/T3 as the tech-spec's own
  research-grounding tier names for its three cited pool entries, not a label the source doc is expected
  to carry. Do-not-repeat for reviewers: before flagging a citation as unfounded, check whether the token
  is the *plan/spec's own* indexing shorthand rather than a literal string expected in the cited artifact.
- **Re-diffing byte-stability claims (ADR-30) caught nothing wrong here, but is worth doing every time
  regardless.** A mid-sentence key insertion ("capture the three... PR-tail keys" → "...the five...") is
  exactly the shape where a silent reword of an *existing* key's parenthetical could slip in unnoticed if
  the reviewer only trusts implementation.md's self-report. Diffing the actual before/after text (not just
  grepping for the new tokens) is the only way to confirm byte-stability rather than infer it.
- **A verify-gate `blocking_failed` (selfcheck ok:false) is not automatically an implementation defect —
  but it must be traced to its specific failing sub-check, not accepted or dismissed on the label alone.**
  This run's failure was pre-diagnosed in `communication-log.md` as omni-twin drift (a team-lead-owed
  closure step); independently re-running `scripts/selfcheck.mjs` confirmed the *same* single sub-check
  failure and nothing else. The lesson is procedural: even a pre-diagnosed "expected failure" note gets
  independently re-run by the reviewer before it's accepted into the Evidence table — the diagnosis, not
  just the verdict, needs fresh confirmation.
- **A fix-cycle "REQUEST CHANGES on a plan step" isn't always a code bug — check whether the plan step
  itself contradicts its own cited `Satisfies:` AC before assuming the code needs to match the plan's
  literal prose.** Cycle-2's Fix 1 removed a plan-Step-3 clause ("offered once, attended, when the key is
  absent") that directly contradicted the tech-spec's `AC-D.3` ("key off → tail behaves exactly as
  today") which that same step cited as `Satisfies:`. Before flagging this as a new plan-conformance
  deviation, I checked plan.md's own "Binding surfaces" paragraph, which explicitly carves bullet wording
  out as "the developer's call" — meaning the plan's prose was never binding here, only the AC was. A
  fix that resolves a plan's internal self-contradiction in favor of its own binding target is a correct
  fix, not a deviation; grep the plan's Binding-surfaces/Data-Model section before flagging a re-worded
  bullet as non-conformant.
- **On a re-review, grep the *whole* touched file for the old (buggy) phrase, not just the cited
  line(s).** Confirming a fix at its reported location is necessary but not sufficient — a stale echo of
  the pre-fix wording elsewhere in the same file (a second mention of "calibration-only," a leftover
  "offered once when absent") would silently reintroduce the ambiguity the fix was meant to remove. Both
  fix-cycle-1 defects here were genuinely clean on a whole-file grep, but that check is what makes the
  "clean" verdict trustworthy rather than assumed.
