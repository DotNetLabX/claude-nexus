# Decision Log with Outcome Back-links (A5 pilot)

**Feature Spec:** `docs/specs/adhoc-DecisionLog/definition/tech-spec.md`

## Context

Port VWH's decisions.jsonl as a team-lead-only pilot: a `## Decisions Log` section in the existing
`communication-log.md` (rows owed only when the TL chooses between real alternatives), a
deterministic outcome back-fill at shutdown, the learner as the shipped-together reader, and an
explicit kill-if-unused criterion. Additive prose, two agent docs + command regen.

## Scope

In scope: `plugins/nexus/agents/team-lead.md`, `plugins/nexus/agents/learner.md`, their generated
`commands/` mirrors, release bump. Out of scope: other writers, selfcheck assertions, structured
formats, the architect's plan `## Decisions` lane.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | team-lead.md — three insertion points below | |
| 2 | (none) | — | no | learner.md — two insertion points below | |
| 3 | (none) | — | no | command regen + AC battery + gates | |
| 4 | release-plugin | Follow | no | recommend `--minor` (tech-spec Decision 5) | |

All prose edits, grep-checkable acceptance, no runtime behavior (TDD `no` throughout).

## Domain Model Changes / Data Model Changes / Cross-Service Changes / Migration Notes

None. New artifact section (`## Decisions Log`) appears in future runs' `communication-log.md`;
existing logs are not retrofitted.

## Implementation Steps

### Step 1 — team-lead.md (three additive insertions)

Modify `plugins/nexus/agents/team-lead.md` per tech-spec §Design Edit 1 (all additive; no existing
text removed):

1. **Communication Log section** (after the Runtime / Plugin Issues Log sentence, ≈line 422):
   define `## Decisions Log` — **rendered as a backtick-quoted section NAME within the
   `### Communication Log` prose, mirroring how `**Runtime / Plugin Issues Log**` names its
   artifact section; never a live H2 heading in team-lead.md (critic M2 — a live H2 would swallow
   the following content and mirror into commands/)**. Row format
   `| # | Phase | Decision (choice over rejected alternative) | Reasoning | Outcome |`, `Outcome`
   written `open`; the trigger rule verbatim from the tech-spec (owed when choosing between real
   alternatives: escalation-menu picks, phase-failure recovery, non-default launch-path/team-mode,
   triage STOPs resolved without the user, model-per-phase overrides; routine protocol-following =
   no row).
2. **Pipeline Sequence step 6** (Shutdown, ≈line 320): one clause — before writing `summary.md`,
   back-fill the Outcome on every open **Decisions Log** row (critic M1 — the phrase is
   load-bearing for AC-1's ≥3 count); zero rows left `open` at close.
3. **Resume section** (≈line 424–431): one line — tail the Decisions Log along with the last
   message rows.

Keep total addition ≤ 18 lines (this doc is loaded every team run).
Acceptance: AC-1 + AC-2 greps.
Satisfies: AC-1, AC-2

### Step 2 — learner.md (two additive insertions)

Modify `plugins/nexus/agents/learner.md` per tech-spec §Design Edit 2:

1. **Consolidation step 1** (≈line 15): extend the comm-log read to include each run's
   `## Decisions Log`; recurring decision patterns are lesson items classified per the existing
   steps.
2. **Same step, one sentence:** the decision-log pilot evaluation — once ≥3 runs carry a Decisions
   Log: no lesson citing decision-log evidence, or rows repeatedly closing `open` → flag the pilot
   for removal.

Keep total addition ≤ 6 lines.
Acceptance: AC-3 greps.
Satisfies: AC-3

### Step 3 — Regen, AC battery, gates

Run `node scripts/gen-commands.mjs nexus`; verify AC-4 (mirror greps hit
`plugins/nexus/commands/team-lead.md` and `commands/learner.md`). Run the full AC grep battery +
`git diff --name-only` scope check (AC-5) and record outputs in implementation.md. Run
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` and `node scripts/selfcheck.mjs` —
green. Depends on Steps 1–2.
Acceptance: AC-4, AC-5, AC-6 (gate half).
Satisfies: AC-4, AC-5

### Step 4 — Release

Follow release-plugin: recommend `--minor` (new pipeline capability — new artifact section +
learner input; owner confirms at the bump). CHANGELOG one-liner: "decisions log pilot in
communication-log.md (team-lead writer, shutdown outcome back-fill, learner reader,
kill-if-unused criterion)". Bump in the same commit. **Note (critic L2):** the ADR-6 omni-twin
regen is commit-closure machinery owned by the team-lead/operator, correctly outside this plan —
owed at commit time, not a developer step.
Acceptance: AC-6 (release half); CI green.
Satisfies: AC-6

## Testing Strategy

No runtime behavior — the AC grep battery (signatures pre-verified: `Decisions Log` /
`decision-log pilot` virgin tree-wide; `back-fill` per-file scoped due to a figma-to-flutter
collision) + repo gates. The pilot's real test is operational: the kill-criterion evaluates after
~3 runs.

## KB Impact

None.

## Decisions

Inherited from the tech-spec table (comm-log home; TL-only writer; trigger bound; kill-criterion
locus; MINOR recommendation). Plan-level:
`None — no additional self-resolved calls met the disclosure bar`.

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2): **GO-with-fixes** — findings persisted to
`delivery/review-critic.md`, all four folded: M1 → Step 1.2 wording aligned verbatim ("every open
Decisions Log row" — load-bearing for AC-1's ≥3); M2 → representation pinned (backtick-quoted
section name in prose, never a live H2); L1 → AC-3 relaxed to ≥1; L2 → omni-twin ruled
commit-closure machinery (team-lead/operator-owed, noted in Step 4). Critic verified clean: all
four insertion anchors exact, all signature claims accurate, AC-5 scope independently confirmed
feasible (all 8 command mirrors byte-in-sync today), and every coherence surface (resume-tail
rule, unattended posture, Origin tag, architect Decisions lane) non-conflicting.
