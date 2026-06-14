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
