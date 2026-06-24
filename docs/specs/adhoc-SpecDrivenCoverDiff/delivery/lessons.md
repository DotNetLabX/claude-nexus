# Lessons — adhoc-SpecDrivenCoverDiff

## Architect Lessons

- **Research before the write-up changed the confidence basis, not the direction.** The owner's inverse-
  harness instinct ("golden rules are the target; circle each rule") was sound; the research
  (`docs/kb/research/spec-driven-test-generation.md`) confirmed it is a *named, validated* technique
  (spec-driven RBTG + the JEST/SPECA diff), which is why the proposal could be written at all. But the
  research is on the *science*, not our build — so the proposal landed at **Medium**, gated on a spike,
  not High/ratifiable.
- **Spike-first is the correct graduation for a Medium-confidence technical proposal (ADR-28).** Rather
  than ratify-and-build-blind, the proposal graduates to a **spike-scoped** tech-spec: the three
  harness-specific unknowns (spec source on KG, rule→code location, diff signal) become the spike's
  go/no-go criteria. The full build's ADRs (A–D) are named but **extracted only on a go**.
- **The load-bearing new piece is rule→code location (Step 2, Confidence low).** The code-derived harness
  gets this free by starting *from* a class; the inverse must map a rule *to* code. Everything else reuses
  the proven Cover engine — so the spike's real risk concentrates in one step, which is exactly where a
  spike should point.
- **The owner's two earlier asks converged on one artifact.** "Don't let the test-writer see existing
  tests" (isolation) and "have the PO author golden rules" (recall) both resolve into the spec-driven
  input + isolated-assembly setup — the golden set does double duty (recall yardstick + spec source), so
  the inverse direction costs no extra authoring.
- **Done-check on a synthesis closeout = verify the anchors against live source, not the self-report.**
  AC-1 isolation, the L272 FIXED annotation, and AC-4's every-rule classification were each load-bearing
  *claims* in implementation.md; all three were confirmed against live KG source/config (golden-set.md
  outside `src/`, targets ids-only, the `> 0.01 + 1e-9` fix comment verbatim). A backfill closeout is the
  exact shape where a self-report can drift from disk — the done-check's job is the independent re-check,
  and the three pre-commitment predictions all pointed at the right files.
- **A non-`None` skill (Step 4 `tdd`) on a synthesis closeout passes via documented deviation, not the log.**
  The skill-conformance check is log-scored, but the all-`None` exemption + a documented `## Skills Used`
  deviation reason (loop ran in the prior solo run; no-new-experiments per plan §33-39 + architect A1) is a
  valid pass. The log having zero developer entries for the implement window is correct here, not a Fail —
  the plan's own no-re-run scope is what makes the empty window legitimate.
- **The spike's low-ceremony self-review does NOT carry to the full build.** The spec review gate is explicit:
  a **code-grounded critic becomes mandatory** when the spec-driven direction is wired into `harness/**`
  (a shared/external-artifact change). The done-check must surface that owed gate so it isn't lost at the
  graduate-to-build step.

## Solo Lessons (code-derived kill-delta run, 2026-06-25)

- **Cheap baseline-first paid off.** Running Stryker on the existing suite *before* any LLM spend surfaced
  all the toolchain friction for ~free: Stryker 4.15 has **no test-case filter** (initial run executes the
  whole suite → infra-bound integration tests block it), KG uses the new **`.slnx`** format, and a **running
  API process** file-locks the build. None of these would have been visible from a doc review.
- **The isolated mini-assembly is the reusable mechanism.** A scratch test csproj that links the target's
  test file(s) + references the product project lets Stryker mutate one file and run only its unit tests —
  no Docker/Postgres. This *is* the "isolated assembly" the harness design already requires, and it keeps the
  consuming repo untouched. Both classes' test files were self-contained (FluentAssertions + xUnit + the API
  namespace), which made this trivial — verify self-containment first.
- **Equivalent mutants materially inflate raw scores on regex/string-heavy classes.** GeneratedSqlValidator's
  raw 89.24% hid that ~12 of 17 survivors were equivalent (RegexOptions perf/case flags, `break`-removal,
  a documented-dead carve-out). Always triage survivors by reading source — never report a raw % on a
  string/regex-dense class. The design's "exclude equivalent/dead from the floor" seam is load-bearing, not optional.
- **Clean-room single-agent (mine+cover folded) is enough for a kill-delta spike.** One Sonnet agent reading
  production source only (blind to existing tests) compiled first-try on the simple class and needed one
  mechanical compile-fix on the complex one (it referenced an `internal` method — dropped those 5 tests
  rather than modify KG prod). The independent Codex Verify step is not needed to *measure* kill-delta.
- **Result:** simple 85.71%→100%, complex 53.80%→89.24% (~97% of killable). Harness beat real human suites
  on both an easy and a hard already-tested KG class. See `killdelta-*.md`.

## Solo Lessons (Direction-2 spec-driven run, 2026-06-25)

- **The golden files were ids-only; the rule text is sequestered in `golden-set.md`.** The targets JSON
  (`gateway-*.json`) carries GOLD ids only (harness convention); the behavioral text is in
  `docs/audit/golden-set.md`. Direction 2 needs the TEXT — point the spec-author agent there, not at the JSON.
- **Direction-2 clean-room is INVERTED from Direction 1.** The author reads the SPEC (golden rules) and must be
  blind to the IMPLEMENTATION (else it mirrors current behavior — the research's #1 validity threat). Hand it a
  signatures-only contract + config DTOs, never the method bodies.
- **Mechanism works; reds are CANDIDATES, not bugs — triage is mandatory.** Slack: 0 divergences (correct, careful
  class). SQL: 5 reds → 1 real (FP boundary L272) + 4 artifacts (rule-precedence interactions, a bad example table,
  an un-constructable `SurfaceProfile.Curated`). Triaging needs reading the code + spec; ~80% of reds here were
  test/harness artifacts, exactly as the research warned.
- **THE headline: both directions converged on L272.** Direction 1 left a surviving mutant there (`>`→`>=`);
  Direction 2 produced a red there (FP `0.86-0.85 > 0.01` rejects a spec-valid value). Two methods from opposite
  sources (code vs spec) independently flagging one line = the proposal's cross-check thesis, demonstrated live.
- **"Probe edge inputs" works but raises false positives.** Edge-probing surfaced the real FP boundary that the
  happy-path Slack suite hid — but also caused rule-interaction reds (inputs that trip an earlier rule under
  first-violation-wins). A production Direction-2 needs rule-isolation + fixture fidelity + a false-positive filter.

## Developer Lessons (Phase 1 analyze, closeout, 2026-06-25)

- **The spike's headline finding was patched in the consuming repo between the experiments and the closeout.**
  Re-grounding the recorded evidence against live KG source (not just trusting the writeups) caught that
  `GeneratedSqlValidator.cs:272` now reads `> 0.01 + 1e-9` with a comment that restates the spike's exact
  diagnosis — the bug both directions converged on is *fixed*. A synthesis-from-evidence closeout must still
  re-verify load-bearing anchors against live source; the evidence files are a snapshot, not the current truth.
  (This is the "re-ground feedback regardless of version" memory, applied to a spike's own past evidence.)
- **Closeout-from-evidence has a hidden artifact gap: the prior run produced *evidence*, not the plan's *named*
  files.** Steps 2 and 4 name `rule-code-map-{class}.md` / `candidate-bugs-{class}.md`; neither exists — the
  content is embedded in `specdriven-*.md`. Mapping each step's Accept clause to disk (not to the comm-log's
  "Steps 1–4 done" summary) is what surfaced it. On a closeout, verify Accept-clause-to-file, step by step.
- **A docs-only deliverable runs through a code-shaped pipeline.** Steps 5/6 emit two synthesis markdown files,
  not source — so `implementation.md`'s Files Modified/Skills(tdd) framing partly doesn't apply, but the artifact
  is still owed (it's the done-check's only input). The format skill's section *map* holds; the code framing bends.
