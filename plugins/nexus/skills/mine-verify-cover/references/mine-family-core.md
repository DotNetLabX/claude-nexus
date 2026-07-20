# Mine-family core reference

Shared content for the eleven-member mine family (`mine-verify-cover` incl. its `mine-from-spec`
mode, `mine-verify-repo`, `mine-reference-model`, `mine-semantic-model`, `mine-design`, `mine-algorithm`, `mine-verify-flows`, `mine-architecture`, `mine-skill-gaps`, and `mine-skill-candidates` (the latter two are name-and-shape members; neither adopts the shared method contract)). Each sibling SKILL.md replaces its restated copy
of the sections below with a short load-bearing pointer to this file, plus ONLY its own per-skill
deltas. This file has no frontmatter — it is a reference, not a skill, and is never Skill-tool
loaded directly.

## The mine family

| Mine | Unit | Ground truth | Gate | Output |
|------|------|-------------|------|--------|
| `mine-verify-cover` | one class | code | mutants | rules KB + gated suite |
| `mine-from-spec` (mode) | one spec | spec text | skeptic-vs-text | spec-rules |
| `mine-verify-repo` | one repo (debts) | git metrics + code | hotspot rank + re-execution | `docs/tech-debt/{area}.md` |
| `mine-reference-model` | one reference repo (virtues) | reference source | skeptic re-execution (invented-virtue kill) | `docs/reference-model.md` in the consuming repo |
| `mine-semantic-model` (ships in nexus-analytics) | one datasource area | live schema + read-only data probes | probe re-execution + KB grounding + operator interview | semantic-model bundle + provenance ledger |
| `mine-design` | one class/function | complexity census (cause-classified branches) | two-tier judge (grounding kill, then pairwise) | design-brief |
| `mine-algorithm` | one algorithm-shaped unit | BR registry (conformance oracle) | row-by-row deviation classification + deviation-triggered row re-grounding | algorithm-brief |
| `mine-verify-flows` | one app's user flows | routes/screens/blocs + on-device output documents | sabotage check + twice-green golden gate | flow registry + golden-gated flow tests |
| `mine-skill-gaps` | one repo's delivery-artifact estate | plan/lessons artifact text | skeptic re-read + citation resolution | `docs/skill-gaps/registry.md` in the consuming repo |
| `mine-skill-candidates` | one repo's code + git history | commit history + code structure | skeptic re-execution + debt health gate over resolving citations | skill candidates + anti-pattern rows in `docs/skill-gaps/registry.md` |
| `mine-architecture` | one repo's architecture | code structure (+ optional graph and coupling table) | adversarial skeptic re-execution | `docs/architecture-map/` (index + per-module) |

The family invariant is unchanged across all eleven: bounded unit -> clean-room miners -> consolidate
-> skeptic verify -> graded/verified registry. What changes per member is the unit, the ground
truth, and the failure mode the gate kills.

## Routing boundary — algorithm-shaped vs rule/mapping-shaped

The two prescription siblings — `mine-design` (prescribes *structure*: patterns/principles) and
`mine-algorithm` (prescribes *computation*: canonical algorithms) — split one unit population along
a single boundary that is **authored here once** and cited, never restated per skill:

- A unit is **algorithm-shaped** when it is an implementation of a computational problem — its
  inputs, outputs, and objective function are abstractable from the code (an assignment, a
  clustering, a sequence alignment, a budgeted selection). These route to `mine-algorithm`.
- A unit is **rule/mapping-shaped** when its complexity is braided business rules, type/config
  forks, format mapping, or defensive plumbing — structure to be redesigned, not a named algorithm
  to be recognized. These stay with `mine-design`.

`mine-design`'s stage-1 census is the routing point: an algorithm-shaped unit it encounters is
handed to `mine-algorithm`; `mine-algorithm` hands a unit whose complexity turns out to be
rule/mapping-shaped back to `mine-design`. The two are not mutually exclusive on a mixed unit — a
class can carry a rule-shaped shell around an algorithm-shaped core, and each sibling prescribes for
its own portion.

**On drift, supersede this section — never fork the definition into a skill.** This paragraph is the
single owner of the boundary; a sibling that needs to state it points here.

## Execution topology (who runs what)

This method is **multi-agent by design** (parallel clean-room miners, then a fresh skeptic) and
**a subagent cannot orchestrate it** — subagents have no Workflow/agent/parallel primitives, and a
subagent spawning further agents is the ADR-21 breach vector. So:

- The **orchestrator is the session that owns spawning** — the team lead in team mode; the main
  session (PO or architect persona) in standalone mode.
- The orchestrator runs the run as **staged background agents**, exactly like pipeline stages: the
  clean-room miners/extractors in parallel (background), then on their completion a
  consolidate+skeptic agent (background).
- Miner and skeptic stages spawn as **`general-purpose` agents** carrying the run's stage prompts —
  they are method stages, not pipeline roles (no pipeline `subagent_type`, no custom names).
- "Launch the run" always means "orchestrate its stages" — never "delegate the whole run to one
  background agent": a single agent cannot preserve miner/skeptic independence.

**Chunked writes for a large artifact.** A stage agent producing a large output — a high-branch
census, a big rule KB, a whole-repo triage registry — **appends it incrementally, per section or
per cause-group, rather than composing the entire artifact in one write.** A single oversized write
risks output truncation near the ~64k output ceiling, and because the orchestrator holds no
filesystem it cannot re-assemble a truncated write — so the writing agent owns the chunking.

**Per-skill staging (the delta each sibling keeps):**
- `mine-verify-cover` / `mine-from-spec` mode — clean-room miners in parallel, then
  consolidate+skeptic; stages interleave with plan-authoring (planning never blocks on the run).
- `mine-verify-repo` — the metric agent runs first, then the per-area miners in parallel, then
  consolidate+skeptic.
- `mine-reference-model` — five dimension extractors in parallel (default), then ONE
  consolidate+skeptic (Entry-6 sizing note: one consolidate+skeptic held at roughly 145 findings on
  the debt-mine pilot; a virtues run yields far fewer rows, so this is comfortably bounded).
- `mine-semantic-model` (ships in nexus-analytics) — phases run sequentially in the main session;
  the Phase-4 interview is **operator-in-loop** (the family's one in-loop human gate — never
  delegable as one background run); probe batches (Phase 2) may background between interview
  points.
- `mine-verify-flows` — 3 clean-room flow miners in parallel, then consolidate+skeptic, then the
  Cover agent per selected flow; the orchestrator computes the sabotage gate from raw runner
  output (the golden-bless hop is the flow family's human-in-loop point).
- `mine-architecture` — four dimension extractors in parallel (default), then ONE
  consolidate+skeptic (the reference-model shape).

## Stage-completion discipline + mechanized firing

**Poll, don't wait (canonical statement — every mine-family member shares this).** Subagent
background-run completion notifications are unreliable: a stage prompt must instruct its agent to run
measurements in the FOREGROUND (a bounded poll loop if the command runs long) and never end its turn
waiting on a background-command completion notification. On the pilot's platform the notification
repeatedly failed to re-invoke the waiting agent — a developer stranded TWICE on this exact pattern before
an explicit "poll, don't wait" instruction fixed it; once every pilot-stage prompt carried the instruction,
no stage stranded. Treat background-completion callbacks as best-effort — completion discipline belongs in
the stage prompt, not in hoping the callback fires.

**Mechanized stage/skeptic firing (F7 S2).** Prompt discipline is now PAIRED with a mechanism: a **watcher**
polls the run journal (the §Marginal-budget rail run journal below — its **binding** state source) on a
bounded interval and, when a stage has been RUNNING past a stall threshold, **advances the stalled stage or
fires the cadence skeptic without operator input, logging each firing**. The watcher reads the JOURNAL, not
the Workflow in-session `agent()` cache — an external watcher process cannot reach that cache, so the
journal's stage / status / timestamps are the only pollable substrate. **Disclosure:** the watcher
IMPLEMENTATION is dev-repo harness machinery (`harness/lib/stage-watcher.mjs` — a Windows-compatible poll
loop, no cron assumption); the capability is the contract, the mechanism is not shipped. A prose-only
sibling run with no watcher falls back on the poll-don't-wait prompt discipline above — disclosed here.

## Marginal-budget rail + report-on-halt

- **Budget cap** — halt when the run's **marginal** spend exceeds the ceiling. `budget.spent()` is
  the shared session pool, NOT the run's cost; **capture the start** spend and gate on the delta, or
  a run fired late in a long session trips on the session's prior spend.
- **Report on halt** — every stop writes a report naming the stop reason. Never silently exit green.
- **Runway forecast (F7 S5)** — beyond the reactive halt, project the run forward: realized tokens accrue
  per completed stage into the run journal, then `spent + projected-remaining` (the average realized cost
  per completed stage applied to the remaining stages) is compared against the budget. When the projection
  crosses the ceiling, emit **`forecast: over-budget at stage N`** (binding line shape) **before** the
  overrun — a warning ahead of the halt, never a replacement for it; report-on-halt semantics are unchanged.
  Computed by `harness/lib/run-journal.mjs` `forecastRunway(journal, { budget })` over the journal's
  per-stage token accrual.
- **Capture the `runId` at launch; resume, don't restart** — a `Workflow` launch returns a
  `runId`; on a kill or hang, relaunch with `Workflow({scriptPath, resumeFromRunId})` — the
  unchanged `agent()` prefix replays from cache and only live work re-runs. The `agent()` cache itself is
  same-session, but the **run journal (F7 S3)** persists run state across sessions, so a next-session
  `reconcile` resumes a killed run from the first non-done stage instead of abandoning it.

  > **Superseded (F7 S3, 2026-07-18):** this rail previously read *"Same-session only: a run killed today
  > cannot be resumed tomorrow, so resume immediately or write the loss off."* The per-run journal
  > (`harness/lib/run-journal.mjs`, under the runs dir — stage / status / `runId` / timestamps) is now the
  > durable cross-session run-state substrate layered over the same-session `agent()` cache: a `reconcile`
  > pass in a new session reads the journal and returns an idempotent plan — **resume** the killed run from
  > where it stopped, **complete-tail** a finished-but-unfinalized run, or **none**. It is also the wave's
  > shared run-state source (Step 5's watcher polls it; Step 7 accrues per-stage tokens into it).

Each sibling keeps its own skill-specific prohibitions list (the AC-anchored "four prohibitions"
glance list) — this rail is the shared mechanism, not the full safety-rails section.

## Skeptic protocol

- The skeptic **RUNS** each finding's/pattern's evidence command and compares output to the claim —
  re-reasoning without execution is forbidden in the stage prompt AND structurally checked: a
  verdict row must carry the re-execution output excerpt, and the orchestrator **drops any verdict
  without one** (a prompt-only obligation gets a real enforcement).
- Verdict grammar: **CONFIRMED / WRONG / IMPRECISE** (IMPRECISE = the phenomenon exists, the stated
  scope/number is off — a corrected statement is required).
- **The vacuous-evidence check (harvested pilot lesson)** — the skeptic also validates that an
  evidence command CAN fail: a zero-hit/absence claim whose grep is structurally unable to match
  (the pilot's `Services[\\/]\K…` kill — sibling-relative paths never contained the literal) is
  WRONG, not CONFIRMED; re-prove with a command that would fire on a real violation.
- **The merged-row audit note (harvested pilot lesson)** — when consolidation merges overlapping
  findings, the surviving row records what was merged (`Merged from: {ids}`), the pilot's working
  pattern.

`mine-verify-cover`'s code-arm Verify stage is a **different mechanism** (mutation-gated code
re-check, not this must-RUN protocol); its row obligation is separate — the code-arm rule-verify
carries the skeptic's evidence excerpt into the registry row (`## The rule registry`), while the
mutation gate remains the arm's *test* verification, distinct from this row obligation.
`mine-from-spec`'s distinct `verified | ambiguous` grammar likewise stays in `mine-verify-cover`
untouched.
`mine-semantic-model`'s gate is likewise a different mechanism (probe re-execution + Audit-mode
refutation legs + interview provenance — its origin enum is its verdict grammar) and is not a
consumer of this must-RUN protocol section. `mine-verify-flows`' Verify stage is a **code
re-trace for reachability** — it reuses the CONFIRMED/WRONG/IMPRECISE verdict grammar but a
reachability verdict is a code-reading claim, not a runnable evidence command, so it is not a
consumer of the command-re-execution must-RUN enforcement either (the same treatment the code-arm
gets). `mine-skill-gaps`' Verify stage is likewise a **re-read of artifact text** (plan/lessons
rows), not a runnable command — it reuses the clean-room posture and carries the re-read excerpt
into each registry row, but a reading claim is not a consumer of the command-re-execution must-RUN
enforcement (the same carve-out as the flows sibling).

## Fact/judgment doctrine

A rule, finding, or pattern whose claim cannot be phrased as a reproducible check (a grep, a metric
threshold, a re-executable command, a dependency-direction query on the graph) is a **judgment, not
a fact** — it never earns a CONFIRMED verdict of its own. An unreproducible claim may ride along
only as a note attached to a fact (a repo mine's `lens-note`, a class mine's KB context) — never as
a standalone confirmed entry. Each skill's own row schema (the finding/rule/pattern fields) stays
defined in that skill.

## Registry invariants + refresh outcome grammar

**Invariants**, carried unchanged from ADR-43/45/49: per-row provenance, `last_verified`, rows are
**never deleted** (disposition/verdict flips, the record stays), every write
**appends a changelog entry**, a re-run against unchanged input is **idempotent**. Each skill's own
artifact schema/path (`docs/business-rules/`, `docs/tech-debt/{area}.md`, `docs/reference-model.md`)
stays defined in that skill.

**Evidence gate on write (F7 S1.3).** Wherever a registry row or a KB `- verify:` sub-bullet is written,
run the shipped structural evidence predicate (`tools/evidence-gate.mjs`
`structuralEvidenceOk(evidence, claim)`) first: evidence that is empty, a **claim-echo**, or carries **no
re-execution content** (no line reference and no quoted/output artifact) is **dropped** — never recorded as
verified. The `minLength: 1` schema check a verdict already passes cannot express this; the predicate is the
code enforcement, paired with this instruction. The harness chokepoints run it in code (the mine-verify
verdict handler drops it live; the C1 registry writer and the KB serializer expose it at their seam). The
residual — a prose-only sibling run with **no orchestrating code** — must run the predicate by hand; that
path is prompt-tier, disclosed here.

**Refresh outcome grammar** (run 2+, re-verify existing rows against the git delta since
`last_verified`):
- **resolved** — the evidence command no longer reproduces -> disposition `resolved` + re-stamped
  `last_verified`.
- **still-active** — no field change except the re-stamped `last_verified`.
- **superseded** — restructuring moved the problem -> the old row's disposition flips to
  `superseded` (kept, never deleted), a fresh row is mined citing the old row's id in its
  provenance.

Each skill keeps its own refresh **triggers** and disposition/verdict vocabulary; this is the
shared grammar the triggers map onto.

## Shipped gate battery — invoke in place (ADR-62)

`mine-verify-cover` ships the Cover-stage §6 gate battery as an executable artifact at
`tools/cover-gates.mjs` (relative to this skill's base directory). It is the ONE canonical copy — the
ADR-62 hash-drift anchor: **target-agnostic, zero imports**, seven exported gates (`suiteGreen`,
`noFlaky`, `mutationFloor`, `targetMutated`, `noNewSkips`, `charPin`, `mutationRatchet`). The
expected-survivor exclusion set is **caller input** (`opts.expectedSurvivorLines` on `mutationFloor`) —
the shipped file carries **no per-class default**, so a fresh target never inherits another class's
dead lines.

**Invoke-in-place recipe (the default path).** When this skill is Skill-tool loaded the harness
announces `Base directory for this skill: <base-dir>`. The orchestrator computes the gates by importing
the shipped file **by absolute path** — no copy, no vendoring:

```
# <base-dir> = the announced "Base directory for this skill:" path for mine-verify-cover.
# An orchestrator-side runner imports the shipped battery by ABSOLUTE path (passed as argv[1]) and
# gates the runner agent's JSON output — REPORT/SRC/DEAD_LINES come from that JSON at run time.
# NOTE: dynamic import() of an OS-absolute path must go through a file:// URL (Windows-safe) —
# import(pathToFileURL(path).href), never import(path) on a bare "D:\..." literal.
node --input-type=module -e "
  import('node:url').then(({ pathToFileURL }) =>
    import(pathToFileURL(process.argv[1]).href).then((g) => {
      const gate = g.mutationFloor(REPORT, SRC, { floor: 75, expectedSurvivorLines: DEAD_LINES });
      console.log(gate.pass ? 'PASS' : 'FAIL', gate.detail.scorePct + '%');
    }));
" "<base-dir>/tools/cover-gates.mjs"
```

Inside a `Workflow` body that cannot `import` (the runtime has no module/fs access), paste the gate
functions inline VERBATIM from the shipped file — the harness drivers do exactly this — and keep the
inlined copy in sync with the shipped canonical.

**Consumer-CI vendored fallback (ADR-5 read-index — documented, NEVER the default).** A consuming CI
that cannot reach the installed plugin path may vendor a **hash-stamped** copy of `tools/cover-gates.mjs`
into its own repo, pinning the source file's hash; on a hash mismatch the copy is stale and CI
re-vendors. This is the read-index fallback for locked-down CI only — invoke-in-place is the default,
vendoring is the exception, and a vendored copy is a copy that can drift.

**Stability disclosure (MEDIUM).** The `Base directory for this skill:` announcement is the single fix
locus for the shipped path: if the announcement mechanism or the base-dir shape changes, this ONE recipe
updates and every consumer follows — MEDIUM stability, one-file blast radius by design (ADR-62).

## Kickoff checklist (new-target runs, B4)

Before launching any mine-family run on a **NEW target** (a repo or class it hasn't scanned before), an
orchestrator-verified **preflight** confirms the preconditions below. A failed precondition **REFUSES the
run with a named reason** (the `mine-algorithm` Stage-0 HARD BLOCK pattern) — the run never launches on an
unmet assumption.

**Tier 1 — Universal (blocking, ALL members):**

1. **Tool preflight confirmed** — the target's toolchain (test runner, mutation tool, Code Maat/lizard, or
   the metric-layer preflight) is verified present, or the documented fallback is consciously accepted.
2. **Expected survival rate stated up front** — a rough mined→confirmed expectation, so a run that comes
   back far off that number gets a second look before the registry is trusted.
3. **stop-budget declared** — the marginal-spend ceiling this run halts at (see the budget rail above).
4. **Run-report location named** — where the run's report (areas scanned/skipped, survival rate, registry
   delta) will land, before the run starts.
5. **Stage-model-plan declared** — the run names which model tier each stage class runs on: mechanical
   collection/extraction stages may run a **named** cheaper tier; judgment stages (clustering, skeptic,
   judges) run the session tier or a deliberately named one. **Declare-and-veto** — the declaration
   lands in the kickoff output for the operator to veto, never an interactive prompt. Generalizes the
   `mine-skill-gaps` §Execution topology clause ("dispatched at the session's model tier or a
   deliberately named one").

**Tier 2 — Member-conditional (blocking when applicable; skipped by member class otherwise):**

- **Registry existence/freshness** — **oracle-consuming members ONLY** (`mine-design`, `mine-algorithm`):
  the BR registry the run consumes as its oracle must exist and be fresh, else the run STOPS and requests a
  `mine-verify-cover` run to produce/refresh it (the anti-self-mine independence rule). Every other member
  produces or does not consume a registry — the check is **reachable and skipped by member class**, never
  vacuously absent.
- **Mined-test-root disclosure** — **Cover-arm runs ONLY**: a Cover-arm run declares where the mined tests
  are rooted, before writing them.

**Enforcement (F7 S4).** For workflow-run members the preflight is **code-enforced** — the orchestrator
invokes the shipped checker (`tools/kickoff-preflight.mjs` `preflight(config)`), which returns the named
refusals; a non-empty refusal list HALTS the launch. The skill-text obligation is thereby PAIRED with an
enforcement. **Residue (disclosed):** a **prose-only** sibling run with no orchestrating code walks the same
two tiers by hand — the discipline, not the gate.

> **Superseded (F7 S4, 2026-07-18):** the prior label read *"**Wired-but-advisory:** each sibling skill
> carries one pointer line at its run-launch area (\"on a NEW target, walk this checklist first\") —
> discipline without an enforced gate."* The preflight is now an **enforced gate** for workflow-run members
> (`tools/kickoff-preflight.mjs`); the per-sibling pointer lines remain, but the checklist is no longer
> advisory-only.
