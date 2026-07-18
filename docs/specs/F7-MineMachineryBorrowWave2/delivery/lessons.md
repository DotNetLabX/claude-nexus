# F7-MineMachineryBorrowWave2 — Lessons

## Architect Lessons

- Phase-1 re-grounding of a 1-day-old, critic-folded tech-spec still caught three source drifts —
  verbatim counts in specs age fast even overnight; the corrected facts (carry-forward for the
  Phase-2 plan):
  1. "the two mine-verify-cover poll mentions" → exactly **one** exists
     (`plugins/nexus/skills/mine-verify-cover/SKILL.md:107-108`, the topology-paragraph mirror).
  2. `cover-gates.mjs` is **248** lines now, not 235 (ADR-62/spec cite the F6-era count) — cosmetic.
  3. `EXPECTED_SURVIVOR_LINES = [17, 133, 268]` (`harness/lib/cover-gates.mjs:248`) is a
     pilot-specific data literal (BugRatioAnalyzer.cs dead lines) that the S1.1 acceptance grep
     (`D:\src\claude-plugins` path scan) will NOT catch — the shipped battery must take the
     expected-survivor exclusion set as a parameter; the plan must name this explicitly.
- Stage-0 closure state at Phase 1: S0a Leg-A completed 2026-07-18 (run `wf_e5da4915-84b`), fixture
  deleted — the spec's "one-minute check at S1 build kickoff" is already done; the plan must NOT
  re-include it (communication-log rows 4/6, spike-report updated).
- Q1 research round (2026-07-18), carry-forward facts for the S6 plan step: pilot host repo is
  `D:\src\sprint-rituals`; registries `docs/kb/bug-ratio.md` (37 rules, mutation-gated 2026-06-22,
  manual 3-miner+Codex pilot 2026-06-14) and `docs/kb/cycle-time.md` (59 rules, mutation-gated
  2026-06-21, harness-only provenance). A FROZEN sequestered golden set already exists:
  `D:\src\sprint-rituals\docs\audit\golden-set.md` (20 GOLD rows, user-confirmed 2026-06-11; 3
  BugRatio rows GOLD-16/17/18 = `recall-score.mjs` docstring examples). **Clean-room constraint for
  the plan: golden rule TEXT must never be quoted into plan.md or any miner-visible artifact** —
  the plan references the file path + ids only; per its own header the file is never given to
  miner/verifier/test-writer agents. S6 curation recipe (if BugRatio confirmed): curate from the
  independent legs (frozen GOLD rows + manual-pilot rules + `fokus-spec.md` §Bug Ratio), not from
  the harness-mined registry — avoids the circular-oracle trap that rules out CycleTime.

- Critic fix cycle (2026-07-18): my single-space definition-line grep (`= 'D:`) was blind to
  aligned multi-space assignments and missed 2 of 20 literals (`loop.workflow.js:92,100`) — and
  because the acceptance reused the same query, the gate would have false-greened. Lesson:
  **definition-line greps default to `\s+` around `=`** — alignment whitespace is common in
  config blocks; a wrong grep that is both the enumeration AND the gate fails silently twice.
- MEDIUM-2 carry-forward: the legacy citation `fokus-spec.md` resolves to
  `D:\src\sprint-rituals\docs\product\fokus\v1.md` (§5.5 Bug Ratio Per Developer, v1.md:239);
  v2.md is a QA-analytics extension with no Bug Ratio section of its own. Pinned in plan Step 8.

## Skill Gaps

### harness-workflow-authoring
- **Kind:** missing
- **Searched for:** a skill covering authoring/editing the dev-repo Workflow drivers and harness
  libs (driver anatomy: meta-first statement, `_args ?? default` config resolution, inline-verbatim
  gate-helper copies because the Workflow runtime can't import, RUNS_DIR/journal conventions,
  `budget.spent()` delta rail, `tests/unit/` node-test pairing).
- **Why it would help:** F7 plan steps 1–7 are all `Skill: None` over exactly this surface; the
  plan compensates with inline pattern references (mine-verify.workflow.js:50,
  cover-cpp.workflow.js:182) that a skill would own.
- **References:** `harness/*.workflow.js` (10 drivers), `harness/lib/*.mjs`, `tests/unit/*.test.mjs`,
  `harness/README.md`.
- **Evidence:** [F7-MineMachineryBorrowWave2]
