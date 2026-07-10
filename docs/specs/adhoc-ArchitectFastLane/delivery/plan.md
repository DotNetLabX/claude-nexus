# Architect-Led Fast Lane (standalone mini-pipeline)

**Feature Spec:** None (ad-hoc — binding input = the user directive of 2026-07-10 + the
`## Decisions` table below; this plan pends one open question, OQ-1, before implementation)

## Context

For small features the user wants the standalone architect to run a compact version of the
team-lead loop instead of handing off to a full pipeline:

1. Architect plans as usual (existing Phase 1/2 — unchanged).
2. Architect spawns the developer **once**, with a **first-round code review baked into the
   dispatch** (the `code-review` skill on the working diff at the end of implementation).
3. Architect runs the existing **Step 1 done-check** (plan vs implementation.md → `review.md`
   `## Step 1 — Done-Check`; unchanged artifact and rules).
4. **Pass** → architect writes `summary.md` and closes. **Fail** → another developer round with
   the findings, **without** the code review (review runs on the first round only), capped, then
   escalate to the user.

Today this flow is unsanctioned prose-wise: `summary.md` is team-lead-owned (ADR-18; the
architect's own "What You Never Do" forbids it), and the architect never commits. This pass
codifies the lane as a **mode-scoped exception**, smallest-possible footprint: one new section in
`architect.md`, a producer note in `summary-format`, command regen, release.

**Verified mechanics (plan-time, code-grounded):**
- `plugins/nexus/hooks/scripts/boundary-detector.js:77` — the detector watches **subagent** calls
  only (`!data.agent_type → exit`); a main-session architect-persona `summary.md` write logs
  nothing. The subagent tripwire (`:52`, summary.md → team-lead) is **untouched** — a subagent
  architect writing summary.md still flags, so the fabrication ledger keeps its teeth.
- `boundary-detector.js:112-136` — **any subagent git write flags.** Hence the lane's developer
  never commits; the commit belongs at close, in the main session (OQ-1).
- The `## Self-Review` contract already exists — team-lead **Fast Mode** (`team-lead.md:238`)
  defines it (verdict + evidence in implementation.md; developer still never writes review.md).
  The lane reuses it verbatim rather than inventing a new artifact.
- Precedent for review-first-round-only: team-lead Standard+Codex — "Codex runs on the first
  review round only; fix cycles are verified by the normal review" (`team-lead.md:244`).
- **The all-agents ownership hard rule restates the prohibition** (`agents-workflow.md:158`:
  "the team lead writes `summary.md` and owns commits") — always-on, loaded by the standalone
  architect every session. The lane MUST carve its exception there too, or it contradicts its own
  highest-authority rule surface (critic CRITICAL-1). Two softer restatements at
  `team-lead.md:379` and `:381` ("pipeline agents never commit (their agent files forbid it)")
  become stale-but-guarded — a one-word scoping fix each.
- **Live-run evidence for the done-check scope key** (this session, 2026-07-10): the spawned
  developer's skill-invocation log lines carry the **parent session's** `session` id
  (`release-plugin` 19:27:09Z / `code-review` 19:28:19Z, both `agent: developer`,
  `session: dc0fa376…` = the main session). So `agent == developer && session == <main session>`
  is an empirically working scope key; a dispatch-timestamp lower bound on `ts` disambiguates
  back-to-back lane runs in one session (critic HIGH-2, resolved).

Requirements:
- **R1 — Lane codified in architect.md:** trigger (user asks the standalone architect to also run
  implementation for a small feature), the 4-step flow above, single developer dispatch template
  (constraints: no git writes, unrelated-dirt exclusion, `code-review` skill invocation with
  review-format fallback, implementation.md + `## Self-Review` per the Fast-Mode contract).
- **R2 — Done-check unchanged:** same Step 1 rules, same artifact (`review.md ## Step 1`), plus
  one **pinned** scoping mechanism: with no `.claude/.pipeline-state` token in standalone mode,
  the skill-conformance window is `agent == developer` AND `session == the main session's id`
  (the spawned developer logs the parent session id — live-verified, see Verified mechanics) AND
  `ts >=` the dispatch time (which the architect notes when spawning). Never scope by token in
  the lane; never accept an empty window as a pass when the plan maps a non-`None` skill —
  an empty window with a mapped skill is a Fail, not a vacuous green.
- **R3 — Fix rounds:** findings relayed to the same developer (SendMessage resume, or re-spawn
  with explicit context), **no re-review**, max **3** rounds → escalate to the user.
- **R4 — Close:** architect writes `summary.md` (mode-scoped ownership exception) carrying a
  provenance line `Mode: architect-led fast lane` — for human readers and any later team-lead
  idempotency scan (the learner-cadence hook counts summary files by mtime and parses no content;
  the line is disambiguation, not a machine contract — critic OQ note folded); the **architect
  (main session) runs the commit protocol at close** (OQ-1, user-resolved 2026-07-10) — one
  commit, content + bump per release-plugin; push remains an explicit ask, never automatic;
  branch pre-flight already ran at plan time (Branch Pre-Flight rule — unchanged by this pass).

## Scope

In scope: `architect.md` (lane section + the ownership-bullet amendment), **two one-line
ownership-consistency edits** — the `agents-workflow.md:158` carve-out (critic CRITICAL-1) and
the `team-lead.md:379`/`:381` "(spawned)" scoping (critic MEDIUM-2) — `summary-format` producer
note **including its frontmatter `description`** (critic MEDIUM-1), command regen (architect +
team-lead commands), release. Out of scope: any hook/detector change (verified unnecessary),
solo.md, the lane *section* itself in agents-workflow.md (only the one-sentence carve-out rides
there — the full lane stays in architect.md, the cheapest correct locus), unattended mode (the
lane is attended-only: it exists to keep a human-in-the-loop flow light, and its asks/escalations
need a user).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | architect.md lane section + single-bullet amendment | |
| 2 | (none) | — | no | agents-workflow.md:158 carve-out + team-lead.md:379/:381 "(spawned)" | |
| 3 | (none) | — | no | summary-format producer note + frontmatter description | |
| 4 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | |
| 5 | release-plugin | Follow | no | recommend owner escalation `--minor` (new capability) | |

All-`None` on 1-4 is legitimate (prose + regen); `TDD: no` throughout (no testable code behavior;
the detector is deliberately untouched, so `boundary-detector.test.mjs` needs no new case).

## Domain Model Changes

None.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — `plugins/nexus/agents/architect.md`: add the lane, amend the boundary bullets

Skill: None. Two edits:

1a. New section `## Architect-Led Fast Lane (standalone only)` placed after the Standalone-mode
paragraph. Content (semantic spec — implementer words it in house style):
- **Trigger:** standalone architect (main session persona, never as a spawned subagent), user
  explicitly asks the architect to run implementation for a small feature after plan approval.
  Not a replacement for the team pipeline (multi-service / domain-model work) nor for solo
  (trivial 1-3 file fixes needing no plan).
- **Dispatch (once):** spawn `nexus:developer` (background) with: plan path; hard no-git-writes
  rule (commit is close-time, main session — cite the detector's subagent git tripwire as the
  why); unrelated-dirt exclusion list built from `git status` at dispatch time; first-round
  review = invoke the `code-review` skill on the working diff at end of implementation (effort
  medium), fold real findings, dismiss false positives with reasons; fallback when the skill is
  unavailable in the subagent context = disclosed self-review against the `review-format`
  checklist; implementation.md per implementation-format **including `## Self-Review`** (verdict +
  evidence — the Fast-Mode contract, cite it).
- **Done-check:** existing Step 1 rules verbatim (no restatement — reference the section), plus:
  verify `## Self-Review` exists with a verdict line (same posture as Fast Mode's validation);
  skill-log scoping in standalone = the pinned R2 mechanism (`agent == developer` AND
  `session == the main session's id` AND `ts >=` the dispatch time the architect noted at spawn;
  an empty window against a mapped non-`None` skill is a Fail, never a vacuous pass).
- **Fix rounds:** relay findings to the developer (resume or re-spawn), **no code-review re-run —
  first round only** (Codex precedent), max 3 rounds → escalate to the user with the open
  findings.
- **Close (pass):** write `summary.md` per summary-format with the provenance line
  `Mode: architect-led fast lane`; then the architect (main session) runs the commit — one commit,
  content + bump together per release-plugin; push only on an explicit user ask; report the
  completion dashboard-style (steps, verdicts, version bump).
- **Boundaries kept:** developer still never writes review.md; architect still never edits
  source; a *spawned* architect never runs this lane (the lane is main-session only — the
  detector's subagent tripwires are the backstop).

1b. Amend the **single** "Author another agent's artifact, or sign as another role" bullet
(`architect.md:323` — the `summary.md (team lead's)` clause and the `never commit` clause are two
clauses of **one** physical bullet; do NOT split it): both clauses gain the narrow exception,
worded once to cover both — e.g. "…or `summary.md` (team lead's); never commit — **except both,
at the close of an Architect-Led Fast Lane run (see that section)**; never sign as another role."
The exception names the mode, not a general license. (Critic HIGH-1: the plan originally
mis-described this as two bullets and set a line-count acceptance a correct implementation would
fail.)

Acceptance (structure-independent): `grep -c '^## Architect-Led Fast Lane'
plugins/nexus/agents/architect.md` == 1; `grep -c 'close of an Architect-Led Fast Lane run'` ≥ 2
(the bullet exception + the lane section's own close text); `grep 'first round only' -i` hits
within the lane section; `grep 'Mode: architect-led fast lane'` hits; `grep -c 'ts >='` ≥ 1 (the
pinned scoping triple is stated). Satisfies: R1, R2, R3, R4.

### Step 2 — Ownership-consistency carve-outs (`agents-workflow.md` + `team-lead.md`)

Skill: None. Two surgical one-line edits (critic CRITICAL-1 + MEDIUM-2):

2a. `plugins/nexus/rules/agents-workflow.md:158` (the All-Agents "Never author another agent's
artifact" hard rule): the clause "the team lead writes `summary.md` and owns commits" gains the
narrow cross-reference — e.g. "…the team lead writes `summary.md` and owns commits (sole
exception: the standalone architect writes `summary.md` and commits at the close of an
Architect-Led Fast Lane run — architect.md)". One sentence-level amendment; the rest of the rule
(pipeline-state, verdict-forgery language) untouched. This is the always-on surface — without it
the lane contradicts the hard rule every session.

2b. `plugins/nexus/agents/team-lead.md:379` and `:381`: both occurrences of "pipeline agents
never commit (their agent files forbid it)" become "**spawned** pipeline agents never commit
(their agent files forbid it)" — the team-lead context only ever deals with spawned agents, so
the claim stays true in-context while no longer contradicting the architect's main-session-only
lane exception.

Acceptance: `grep -c 'Architect-Led Fast Lane' plugins/nexus/rules/agents-workflow.md` == 1;
`grep -c 'spawned pipeline agents never commit' -i plugins/nexus/agents/team-lead.md` == 2;
`git diff` on agents-workflow.md touches exactly one line region. Satisfies: R4.

### Step 3 — `plugins/nexus/skills/summary-format/SKILL.md`: second producer + provenance line

Skill: None. Add: producer note — written by the team lead (pipeline) **or the standalone
architect at the close of an Architect-Led Fast Lane run**; the fast-lane variant carries a
header-adjacent provenance line `Mode: architect-led fast lane`. Consumers (learner-cadence hook,
team-lead idempotency gate) treat both as a completed run. **Also amend the frontmatter
`description` (line 3)** — currently "written by the team lead after approval" — to name both
producers (critic MEDIUM-1: the description is agent-facing via the skill inventory and would
otherwise go stale). Keep the rest of the format untouched.

Acceptance: `grep -c 'architect' plugins/nexus/skills/summary-format/SKILL.md` ≥ 2 (description +
producer note); `grep 'architect-led fast lane' -i` hits. Satisfies: R4.

### Step 4 — Regenerate commands

Skill: None. `node scripts/gen-commands.mjs nexus`; diff confined to
`plugins/nexus/commands/architect.md` and `plugins/nexus/commands/team-lead.md` (mirrors of
Steps 1 + 2b). Satisfies: R1.

### Step 5 — Release

Follow release-plugin. Single bump after all edits; tool proposes PATCH; recommend the owner
escalate to **`--minor`** (a new operating mode is a new capability). CHANGELOG entry names the
lane, the ownership carve-outs, and the summary-format producer note. Sequencing: lands **after**
adhoc-BranchStrategyAsk's release commit (done — `ef6786e`, 1.29.0), so this bump is
1.29.0 → 1.30.0. Satisfies: R1-R4.

## Cross-Service Changes

None (omni twin rides the release flow).

## Migration Notes

None.

## Testing Strategy

Prose-only. Grep acceptance per step; unit suite green as backstop (no test pins architect.md
prose; `boundary-detector.test.mjs` unaffected — the detector is untouched, which is itself the
verified design). Reviewer lens: lane section must *reference* the done-check/Fast-Mode/commit
sections it reuses, not restate them (drift-proofing), and the two bullet exceptions must name
the mode narrowly.

## KB Impact

None.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| `/review` → the `code-review` skill | `/review` targets a GitHub PR; the lane reviews the local working diff pre-commit — `code-review` is the diff command | Literal `/review` (wrong target, needs a PR) | decided |
| Review on the first round only | Fix cycles are verified by the done-check re-round; mirrors the existing Codex first-round-only precedent (`team-lead.md:244`) | Re-review every round (cost without precedent) | decided |
| Fix-round cap = 3, then escalate | Matches the pipeline's reviewer↔developer cycle cap — one constant everywhere | New lane-specific cap (2) | decided |
| Detector untouched | Main-session exemption (`boundary-detector.js:77`) already legitimizes the lane's summary write; keeping `:52` flags a *subagent* architect summary write — tripwire preserved | Teach the detector a mode flag (complexity, weakens the tripwire) | decided |
| Lane *section* lives in architect.md; the shared rule gets only a one-sentence carve-out | The full lane is single-role (cheapest correct locus), but the ownership hard rule at `agents-workflow.md:158` must not contradict it — one clause there, not a section (critic CRITICAL-1 corrected the original all-or-nothing framing) | Whole lane section in agents-workflow.md (per-session cost) / no shared-rule edit at all (live contradiction) | decided |
| Keep architect.md:323 as one bullet; exception worded once for both clauses | Splitting the hard-rule bullet is an unsanctioned structural change; a single exception phrase covers summary + commit | Split into two bullets to satisfy a line-count grep | decided |
| Done-check scope key = agent + main-session id + dispatch-timestamp | Empirically verified this session (spawned developer logs the parent session id); timestamp bound disambiguates back-to-back runs; empty-window-with-mapped-skill = Fail | Bare "agent + session" prose (two readings, one vacuous — critic HIGH-2) | decided |
| team-lead.md :379/:381 get the "(spawned)" scoping word | Keeps the blanket claim literally true after the lane exception; one word × 2 | Leave stale ("their agent files forbid it" would be false) | decided |
| Reuse Fast-Mode `## Self-Review` contract | Existing, greppable, already validated by team-lead Fast Mode — no new artifact species | New review-lite artifact | decided |
| Lane is attended-only | Its checkpoints and escalations need a user; unattended already has its own fail-closed machinery (ADR-30/32) | Unattended support (scope creep) | decided |
| Architect (main session) commits at lane close | User-resolved (OQ-1, 2026-07-10); keeps the lane autonomous; subagent git-write tripwire preserved; push stays an explicit ask | User commits each run (friction the lane exists to remove) | decided |

## Open Questions

None — OQ-1 (commit ownership at lane close) resolved by the user 2026-07-10: the architect (main
session) commits at close; push stays an explicit ask. Folded into R4, Step 1a Close, and the
Decisions table.

## Plan Review

Code-grounded critic (Mode 2), 2026-07-10 — verdict **REJECT**: 1 CRITICAL, 2 HIGH, 2 MEDIUM,
1 low OQ. All folded, plan revised 4 → 5 steps:
- **CRITICAL-1** — the always-on ownership rule (`agents-workflow.md:158`) contradicted the lane
  with no carve-out → new Step 2a (one-sentence exception in the shared rule); Scope + Decisions
  D5 reworded (the original row rejected a strawman — whole section vs one clause).
- **HIGH-1** — Step 1b targeted "two bullets" that are one physical bullet (`architect.md:323`),
  and the `grep -c ≥ 3` acceptance would fail a correct implementation → 1b rewritten
  (single-bullet, do-not-split), acceptance recalibrated structure-independent.
- **HIGH-2** — "agent + session" scoping was ambiguous (one reading yields a vacuous
  conformance gate) → mechanism pinned (agent + main-session id + dispatch-timestamp;
  empty-window-with-mapped-skill = Fail), grounded in this session's live log evidence.
- **MEDIUM-1** — summary-format frontmatter `description` would go stale → Step 3 extended.
- **MEDIUM-2** — `team-lead.md:379/:381` blanket "never commit" claim → Step 2b "(spawned)" × 2.
- **OQ (low)** — provenance-line consumer misattributed to the learner → R4 reworded (human +
  idempotency disambiguation; no machine contract).
Critic's clean checks recorded: detector-untouched decision verified line-exact; Self-Review
contract transfer clean; summary consumers (learner-cadence, idempotency gate, learner) all
content-agnostic; fabrication matrix cannot misfire on a main-session close; gen-commands scope
confirmed.
