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
- Done-check (2026-07-18): "cite a sibling feature as precedent" needs the same grep discipline as
  code claims — my Decisions row cited F8's `mine-semantic-model/tools/` as an existing precedent,
  but F8-W1 is gated and the dir was never built (`find plugins -type d -name tools` → 0 pre-wave
  hits). A *planned* shape is citable only as planned. Row amended at done-check; cosmetic, but the
  class of error (doc-claim not grep-verified because it referenced a sibling plan, not code) is
  worth remembering.
- Done-check positive worth keeping: the plan's "runs-area report" wording collided with a
  git-ignored `harness/.runs/` — a committed artifact can never live in an ignored dir. When a plan
  requires "committed X under location Y", verify Y is git-tracked at plan time (one
  `git check-ignore` call). The developer's delivery/-relocation was the right pre-sanctioned call.

## Developer Lessons

- **Windows dynamic `import()` of an OS-absolute path throws `ERR_UNSUPPORTED_ESM_URL_SCHEME`** — a bare
  `import('D:\\...')` (or `D:/...`) fails; it must go through `pathToFileURL(path).href`. Surfaced by the
  S1.1 consuming-repo simulation (`import()` of the shipped file by absolute path). Baked the `file://`
  conversion into BOTH the shipped invoke-in-place recipe (`mine-family-core.md`) and the reconcile/watcher
  CLIs, so consumers don't re-discover it. Also the right form for a direct-invocation guard:
  `process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href`.
- **Cross-skill reference form is load-bearing to the skill-lint.** A sibling skill citing
  `mine-family-core.md` must use the RELATIVE path to the owning skill
  (`../mine-verify-cover/references/mine-family-core.md`), never a bare `references/mine-family-core.md`
  (which the linter resolves against the CITING skill's own `references/`, where it does not exist → dangling
  reference, hard fail). Hit this at Step 5; caught by `skill-lint.test.mjs`. When adding a pointer, copy the
  file's EXISTING sibling-citation form rather than inventing one.
- **Non-destructive gate wiring at libs with a pinned output contract.** When a chokepoint lib has
  round-trip/idempotent tests pinning its exact output (rules-registry's `codeAttestation` round-trip;
  kb-write's `- verify:` sub-bullet on informal prose), a new gate must **surface findings, not mutate** the
  persisted artifact. Put the LIVE "drop" enforcement where the artifact is BORN (the mine-verify verdict
  handler — gating the evidence CARRY onto the rule), not where it is serialized. This kept 500+ existing
  tests green while still wiring the gate at all three named chokepoints.
- **Supersede discipline for a shared reference.** Evolving a load-bearing shared file
  (`mine-family-core.md`, 14 external pointer sites): preserve the binding `##` heading TEXT verbatim (never
  rename — pointers are short-form leading-phrase references, not verbatim headings, but they still key on the
  heading), and quote any superseded sentence/label INSIDE a supersede note, then grep-gate that the old text
  survives ONLY inside the note. A clean, reviewable way to change guidance without breaking pointers or
  losing history. Note supersede notes go WITHIN the section, never as a heading rename.

## Reviewer Lessons
- **Behavioral lockstep beats textual diff for inlined-VERBATIM copies.** The four `structuralEvidenceOk`
  copies differ in formatting (semicolons, JSDoc), so a byte diff false-alarms and a regex grep is fragile
  under shell escaping (mine returned 0 on correct code). What worked: extract the workflow's inline copy
  from source with `new Function`, import the three importable copies, and run one fixture battery through
  all four comparing `pass|reason` — 19 fixtures, minutes to write, and it proves the thing that matters
  (behavior, not bytes). Reusable for every "SOURCE OF TRUTH … keep in sync" review (corroborates the
  developer's inlined-copy-convergence-check skill gap below from the review side).
- **When a plan enumerates chokepoints for a "wherever X happens" spec clause, review the NON-enumerated
  paths too.** The plan's three S1.3 chokepoints were all wired correctly, but the spec said "wherever a
  registry row is written" — and the loop monolith-fallback's inline mine-verify (a fourth, dormant write
  path) carries evidence ungated. The enumeration-vs-quantifier gap is a design-origin finding class:
  check every code path matching the spec's quantifier, not just the plan's list.
- **An "operator-owed / not-pasted" accept item is cheap to close from the reviewer seat.** Accept #1's
  output was never pasted in implementation.md; re-running the consuming-repo simulation myself (scratchpad,
  outside the repo) took one script and upgraded a documentation gap into first-hand evidence. Prefer
  re-running a missing accept over filing a blind finding about it.
- **Sequestered-oracle re-judging is workable without leaking:** rebuild the mined-side packet in the
  scratchpad, run `--pair` there, judge, and report by GOLD id only. The clean-room binding rule constrains
  where text lands, not whether the reviewer can independently verify.
- **Enumerate the legs of a bundled finding.** My boundary-test LOW bundled three thresholds (preflight
  `confirmed(0)`, watcher `sinceMs==stallMs`, forecast `cum==budget`) into one finding; the fix round
  addressed one leg and the round-trip had to re-derive which legs remained. List each leg as a checkbox
  in the finding so a fix cycle resolves leg-by-leg unambiguously (re-review then verifies per leg, and
  "partially resolved" has an exact meaning).

- **When wiring a gate into one path, hunt the DORMANT alternate paths that carry the same data.** The
  S1.3 evidence gate went into the delegated mine→verify path (mine-verify.workflow.js), but loop.workflow.js
  carries a full inlined MONOLITH mine→verify fallback (dormant, `MONOLITH_FALLBACK=false`) that carried
  evidence onto rules UNGATED — the reviewer caught it as a bypass. A gate is only as strong as its
  weakest reachable path; grep for every place the gated artifact is BUILT (here: every `consensusRules.map`
  that spreads `v.evidence`), not just the primary one. This also grew the predicate to 5 in-lockstep copies —
  reinforces the inlined-copy-convergence-check skill-gap below.

## Skill Gaps

### inlined-copy-convergence-check
- **Kind:** missing
- **Searched for:** a mechanical convergence test asserting that a Workflow driver's inlined-VERBATIM copy of
  a shipped/lib helper (the "SOURCE OF TRUTH: … keep in sync" pattern) actually matches the source — the
  Workflow runtime can't import, so `cover-gates.mjs` and now the evidence-gate predicate are hand-copied into
  the drivers with only a prose "keep in sync" comment.
- **Why it would help:** the sync is prose-enforced, so a source edit that isn't mirrored drifts silently
  (Layer 2.1 "deliberate copies need a mechanical convergence check"). A test that extracts the gate-fn bodies
  from each driver and compares them to the shipped source would harden every inlined helper at once.
- **References:** `plugins/nexus/skills/mine-verify-cover/tools/{cover-gates,evidence-gate}.mjs`,
  `harness/{cover,loop,spec-cover,spec-cover-calc,merge,mine-verify}.workflow.js` (inlined copies),
  `tests/unit/workflow-contract.test.mjs`.
- **Evidence:** [F7-MineMachineryBorrowWave2]

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
