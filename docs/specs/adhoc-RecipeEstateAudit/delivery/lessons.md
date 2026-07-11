# Lessons — adhoc-RecipeEstateAudit

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [ROUTED-TO-PROPOSAL] boundary-detector implementation.md-owner false positive (recurs across runs) → docs/proposals/session-scoped-pipeline-state-2026-07.md.

> **Learner disposition (2026-06-29 → nexus 1.18.7):** **[APPLIED]** custom-spawn-name breaks role hooks (RA-C-1/C-3, with BranchPreflightGuard) → team-lead spawn-by-`subagent_type`-only rule. Explore-sweeps-are-candidates (RA-L-3) and skill-conformance-via-log (RA-L-5/7) confirm already-shipped architect rules — not re-promoted.

## Architect Lessons

- **I carried a stale framing from the pre-read diagnosis into the plan, against a file I'd read this
  same session.** Step 2 said "promote the parenthetical" — but `research-before-asking.md` (which I read
  in full earlier this session) has a full `## Capture and recall` section, not a parenthetical, and
  `agents-workflow.md:94` already carries it always-on. The "parenthetical" word came from turn-1's
  diagnosis (written *before* I read the file) and I never re-grounded it. **Lesson:** a plan claim must
  be re-verified against files already read, not inherited from the conversation's earlier framing —
  "unchanged framing" ≠ "still true." This is the revision-re-grounding rule applied to my own plan.

- **Code-grounded critic caught two HIGHs a doc-only review would have missed.** HIGH-1 (the parenthetical
  premise) and HIGH-2 (the inverted `isCodeFile` extension list — `pipeline-gate` is the outlier, not
  boundary-detector; plus an unspotted backslash-normalization divergence) were both found only by
  reading live source. **Lesson:** the mandatory-code-grounded rule for shared/plugin-source passes is
  load-bearing, not ceremony — it paid for itself here.

- **Delegated Explore sweeps had a ~⅓ false/inverted rate on factual "dead reference"-type claims.** The
  ADR-13 "miscite" was a false positive (with a hallucinated correction); the `.sh/.ps1` divergence was
  inverted. **Lesson:** Explore sweeps surface *candidates*, never verified defects — spot-verify every
  load-bearing claim before transcribing, and tag Confirmed vs Candidate. Transcribing the sweep verbatim
  would have shipped two wrong findings.

- **Dogfooding the research loop worked and changed the decision.** Routing the placement question through
  `search-researches` (recall → forked dive → cite-checked capture to `docs/kb/research/`) moved the
  placement call from a medium-confidence "fold into rules" lean to a high-confidence two-phase shape —
  and surfaced that the real lever is skill `description` quality, not a new always-on artifact. The
  research that would otherwise have evaporated is now durable and cited.

- **Done-check FAIL on skill-conformance despite all code outcomes being sound.** Every step's code/artifact
  landed correctly (descriptions tightened, 35/35 tests green, clean 1.13.2 bump), but the scoped
  skill-invocation log (session `6f0b68ae`, token `developer:implement`) recorded **only**
  `implementation-format` — the mapped `improve-skills` (Steps 1, 3), `tdd` (Step 4), and `release-plugin`
  (Step 6) were never logged, while `## Skills Used` affirmatively claimed all three ran. The log is the
  authority; a correct-looking output is not evidence the skill's discipline ran, and a self-report the log
  contradicts is a fabrication-Fail. **Lesson:** the log-vs-self-report cross-check is the load-bearing half
  of the done-check on this kind of pass — a "the work looks right" PASS would have been an invalid verdict.
  A custom-named subagent (`developer-audit-impl`) logs fine under its own attribution, so a missing skill
  entry is a real absence, not a tracking blind spot — don't excuse it as an attribution artifact.

- **The fabrication-Fail had a clean exit via the evidenced-deviation path — and it worked in one cycle.**
  Cycle 1 FAILed because `## Skills Used` *asserted* invocations the log denied; cycle 2 the developer
  re-framed each as a dev-repo direct-path deviation naming the deterministic binding gate (skill-lint /
  bump-plugin / tdd discipline). The gate's two acceptance paths (re-run for record, OR document an
  evidenced deviation) are genuinely sufficient and well-calibrated — neither path is a rubber stamp,
  because the deviation must name a gate I can re-run. **Lesson:** when failing skill-conformance, always
  state the two clear-paths; for a dev-repo pass the deviation path is the *correct* resolution, not a
  loophole — the binding gate there really is a script, not the Skill tool.

- **Re-verify cited evidence yourself; and watch your own tool-invocation form.** I re-ran `skill-lint`
  and `bump --check` rather than trusting the developer's "exit 0" — correct discipline. But my first
  skill-lint run reported non-zero on all 5 only because I passed the SKILL.md *file* path when the script
  takes a skill *folder* arg. A naive read of that would have wrongly re-FAILed a valid deviation.
  **Lesson:** before treating a non-zero gate result as a finding, confirm the gate's expected
  argument/usage (read its header) — a false-negative from my own mis-invocation is as damaging as
  rubber-stamping. Read usage, then judge.

## Reviewer Lessons

- **Double-normalize is harmless — confirm idempotency rather than flagging as a bug.** Both
  `pipeline-gate.js` and `boundary-detector.js` pre-normalize `fp` before passing it to `isCodeFile`,
  which also normalizes. The result is idempotent; the lib normalizes defensively for any future caller
  that does not pre-normalize. Confirming idempotency (rather than flagging "double-normalize") is the
  correct call here.
- **Carry-over findings from implementation.md are load-bearing.** The two LOW notes (Node 24 glob form,
  bump --check healthy state) would otherwise read as unexplained anomalies. Confirming both inline
  prevented a false investigation path and made the evidence table accurate.
