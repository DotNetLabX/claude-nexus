# Nexus Pipeline — Consolidated Hardening Findings

**Status:** scope/brief for a hardening pass. **Definition of done:** every HIGH and MEDIUM below
closed **and verified** (guardrail fixes proven to *fire*, not just code-reviewed), shipped as **one**
release.

Suggested slug for the run: **`adhoc-PipelineHardening`**.

**Plan:** `docs/specs/adhoc-PipelineHardening/delivery/plan.md` (10 steps; critic-reviewed, gaps fixed).

## Where this came from

Two independent production runs, different projects, surfaced a **converging** set of
agent/skill/communication defects:

- **Pass-3b — AppSettingsVOs** (Sprint-Rituals): VO refactor + Identity encapsulation, Standard+Codex.
- **F6 — SlackAdapter** (KnowledgeGateway): Slack webhook slice, Standard+Codex.

Both runs **shipped correct results** — the defensive design (grep-the-artifact, Verdict Validation,
backstop builds, the Codex cross-check) held the line. The problem is that several guardrails were found
to be **load-bearing by luck, not enforced**: when an agent's return is empty *and* its artifact is
stale, only the team-lead's distrust catches it, and in one case it caught a stale verdict only because
the stale value happened to point the *safe* way. This pass converts that luck into enforcement.

## Already fixed in the working tree — do NOT re-do (context only)

These ride along in the same release; they are not part of the hardening scope, but the run must not
re-open them:

- **Spawn mode reversed to background** (ADR-12, supersedes ADR-10). Resolves finding *"foreground
  unsatisfiable for resumes"* — pipeline agents now spawn `run_in_background: true` and resume via
  `SendMessage` (which is background anyway), so protocol matches runtime. *Uncommitted/unshipped.*
- **Versioning policy → PATCH-default, owner escalates** (`bump-plugin.mjs` + `release-plugin` skill +
  `CLAUDE.md`). *Uncommitted.*
- **Gate invariant: state-file integrity** (release 1.0.1, `45cb42b`) — denies a pipeline subagent
  writing `.claude/.pipeline-state`. Directly relevant to **H2** below; *committed but never shipped*,
  so both runs (stale installs) lacked it.

The two runs ran on a **pre-1.0.1 install**, which explains why the foreground rule and the
state-flip collapse both appeared: those installs had neither the background reversal nor the
state-file guard.

---

## Findings

Severity key: **HIGH** = could ship a wrong result · **MED** = workflow friction, recoverable · **LOW**
= convention/cosmetic · **RUNTIME** = platform limitation, document only.

### H1 — Reviewer resume no-ops and leaves `review.md` stale
- **Seen in:** F6 (High #1); Pass-3b (terse-returns, milder form).
- **Symptom:** on the first re-review, the reviewer returned `"Acknowledged."` but `review.md` was
  **untouched** — still `Verdict: REQUEST CHANGES` with the pre-fix FAIL evidence rows. Only the
  Verdict-Validation grep caught it; a re-dispatch with *"you MUST edit review.md"* was required.
- **Root cause:** a resumed agent can silently no-op the message; there is no postcondition that a
  re-review must rewrite its artifact. Grep-the-artifact only saves you when the stale value points the
  *safe* way — a re-review that should flip `APPROVED → REQUEST CHANGES` but no-ops leaves a stale
  **APPROVED** that grep would relay as a pass. **Latent correctness bug.**
- **Fix direction:** (a) `reviewer.md` — hard postcondition: a re-review is complete only if it rewrites
  `review.md` (verdict line **and** evidence rows for the cycle); a resume that doesn't is a failure.
  (b) `team-lead.md` Verdict Validation — on a re-review, confirm the artifact actually changed for this
  cycle (verdict/evidence differ from the prior cycle); a stale artifact ⇒ treat as agent failure and
  re-dispatch, never accept the chat ack.
- **Files:** `agents/reviewer.md`, `agents/team-lead.md`. Consider a `SubagentStop`-style staleness
  check if prose proves insufficient.
- **Acceptance:** a reviewer resume that fails to update `review.md` is detected and re-dispatched, not
  accepted.

### H2 — Two-phase gate fails open (collapse + `.pipeline-state` self-flip)
- **Seen in:** F6 (High #2 — developer ran 171 tool-uses straight through; `.pipeline-state` flipped to
  `developer:implement` "by something other than me"; the gate did not fire); Pass-3b (same collapse).
- **Root cause:** two parts. (1) The runs lacked the **state-file integrity** invariant (unshipped), so
  the subagent's self-flip wasn't blocked. (2) The gate's analyze-phase block relies on the team-lead
  having written an accurate `.pipeline-state`; if it's missing/stale/unknown the gate **fails open** by
  design (so it never wedges an unattended run). So the two-phase discipline currently rests on the
  agent *choosing* to comply.
- **Fix direction:** ship the state-file guard (already in tree). Then close the fail-open: define the
  full state vocabulary (see **M7**), and decide how the gate should treat a developer/architect
  subagent writing source/plan when state is **missing or unknown** during an active pipeline — likely
  conservative-deny for a known pipeline role rather than fail-open. Reconcile with the
  "never wedge an unattended run" rule. **This is the core design question for the architect.**
- **Files:** `hooks/scripts/pipeline-gate.js`, `agents/team-lead.md`, `rules/agents-workflow.md`.
- **Acceptance:** a developer source-write during an `analyze` phase is **denied** in a live run
  (proven, not assumed); a subagent cannot flip its own phase.

### H3 — Critic is unreachable from inside the architect's session
- **Seen in:** F6 (#4 — `ToolSearch select:Agent` returned nothing in the architect's context, so its
  "critic" review collapsed to a **self-review** — the "never self-approve in the same context"
  anti-pattern); Pass-3b (#E — architect handed back with no `review.md`, critic step silently owed).
- **Root cause:** `critic.md` says the architect spawns the critic "as a sub-review within your turn,"
  but a subagent **cannot spawn a subagent** — so the critic step vanishes unless the lead notices. Skill
  text and actual tool availability disagree.
- **Fix direction:** make it hub-and-spoke. Architect writes the plan and hands back *"plan ready —
  critic review owed on plan.md"*; the **team-lead** spawns the critic and relays findings back to the
  architect. Rewrite `critic.md` (spawned by team-lead, not the architect/PO in-turn), the team-lead
  pipeline sequence + Architect Questions Checkpoint, and the architect's handoff. Update the pipeline
  diagram (`team-lead.md`) which currently says "architect Phase 2 = write plan + critic review."
- **Files:** `agents/critic.md`, `agents/team-lead.md`, `agents/architect.md`.
- **Acceptance:** with review mode = critic, the critic runs as an independent agent (never the
  architect self-reviewing), and the lead can see the critic step is owed.

### M4 — Verdict artifacts stack / no canonical done-check artifact
- **Seen in:** Pass-3b (#F — three `Verdict:` lines in one `review.md`: critic plan-review + architect
  done-check + reviewer code-review); F6 (Low — the architect's Step-1 PASS landed in `lessons.md` under
  "Phase 3", not a predictable file; had to grep the whole delivery folder).
- **Root cause:** `review.md` is written by three producers (architect done-check, reviewer code review,
  and in practice the critic's plan review), and the done-check has no canonical home. The whole safety
  net is "grep the verdict line" — ambiguous with stacked verdicts, and `pipeline-gate` invariant 2
  (APPROVED-with-open-HIGH) can misfire on a retained finding.
- **Fix direction:** one authoritative file per verdict: `plan-review.md` (critic), `done-check.md`
  (architect Step 1, canonical), `review.md` (reviewer Step 2 only). Update `review-format` skill (and a
  done-check format if needed), the three agents, the team-lead grep targets, and `pipeline-gate.js`
  (invariant 2 targets `review.md`; the done-check PASS/Missing check targets `done-check.md`).
- **Files:** `skills/review-format/SKILL.md`, `agents/{architect,reviewer,critic}.md`,
  `agents/team-lead.md`, `hooks/scripts/pipeline-gate.js`.
- **Acceptance:** each verdict grep hits exactly one authoritative line in a predictable file.

### M5 — Codex findings not surfaced unless told to write to a file
- **Seen in:** F6 (#3 — `codex:codex-rescue` returned `"Done."`/`"Acknowledged."` twice with zero
  findings surfaced; produced usable output only when explicitly told to write to `codex-crosscheck.md`
  — that pass then caught 3 HIGH the Nexus reviewer missed); Pass-3b (Codex caught the BLOCKING `User`
  ctor bypass the other gates passed). The value is real; the result-handling is the weak link.
- **Root cause:** `codex:codex-rescue` is a Bash-only agent that returns a terse ack by default; its
  analysis goes to its own output, not to the orchestrator. For "Standard+Codex" mode the orchestrator
  never sees the findings unless the dispatch mandates a file.
- **Fix direction:** in the team-lead's Standard+Codex dispatch, require Codex to **write findings to
  `docs/specs/{slug}/delivery/codex-crosscheck.md`**, then grep that file for the GO/NO-GO + findings —
  same grep-the-artifact contract as every other verdict. Document that a Codex chat ack is never the
  result.
- **Files:** `agents/team-lead.md` (team-mode / Codex section).
- **Acceptance:** a Standard+Codex run surfaces Codex's findings from a file every time, with no manual
  "write them down" re-prompt.

### M6 — Terse returns: the Checkpoint Report format is universally ignored
- **Seen in:** both runs. Every agent returned a placeholder (`Idle.`, `Done.`, `Complete.`,
  `Acknowledged.`); the architect's Phase-1 return was one line and did not quote its own Q1–Qn.
- **Root cause:** the prescribed Checkpoint Report format and what agents actually emit have **total**
  divergence. Artifact-first relay is by design, but the returns are so empty they don't even carry the
  verdict/questions, forcing a grep on every handoff — and **H1** shows the artifact itself can be stale,
  so neither channel is reliable alone.
- **Fix direction:** make the minimal return a hard requirement in each pipeline agent — at least the
  **verdict line + any questions inline** — while keeping grep as the backstop. Tighten the Checkpoint
  Report Format in `team-lead.md` and the per-agent return rules so Phase-1 *must* inline its questions.
- **Files:** `agents/{architect,developer,reviewer}.md`, `agents/team-lead.md`.
- **Acceptance:** a Phase-1 analyze return carries its questions inline; a verdict handoff carries the
  verdict line without forcing a grep (grep remains a backstop).

### M7 — `.pipeline-state` vocabulary undefined + fail-open on unknown
- **Seen in:** F6 (Low — only `analyze`/`implement` are defined; the lead had to invent `critic:review`,
  `reviewer:review`, `architect:donecheck`; the gate fails open on unknown values; ownership unclear —
  "I write it, but something else also wrote it").
- **Root cause:** the state vocabulary is incomplete and ownership isn't enforced (resolved partly by the
  unshipped state-file guard, H2). Unknown values silently weaken the gate.
- **Fix direction:** define the **complete** phase vocabulary and document it once (`agents-workflow`
  rule + `team-lead.md`): the team-lead is the sole writer; every phase the pipeline can be in has a
  defined token; the gate's treatment of unknown values is explicit (tie to the H2 fail-open decision).
- **Files:** `rules/agents-workflow.md`, `agents/team-lead.md`, `hooks/scripts/pipeline-gate.js`.
- **Acceptance:** every pipeline phase has a defined `.pipeline-state` token; the gate's behavior on each
  is specified.

### L8 — Comm-log naming drift
- **Seen in:** F6 (Low — skill/rules say `communication-log.md`; the consuming repo's convention was
  `comm-log.md`).
- **Fix direction:** ensure the plugin uses **one** name everywhere (today it is `communication-log.md`)
  and state it as the canonical name; consumers that prefer another name is their concern, but the plugin
  must be internally consistent and explicit.
- **Files:** `rules/agents-workflow.md`, `agents/team-lead.md` (audit for any drift).
- **Acceptance:** a single comm-log filename across all plugin files.

### L9 — Name-addressing dies once an agent goes idle
- **Seen in:** Pass-3b (#G — `SendMessage to: "architect"` failed after the agent completed; had to use
  the agentId).
- **Fix direction:** `team-lead.md` already says "resume … to its agent id" (good) — add an explicit note
  that **role-name addressing fails once an agent is idle; always resume by agentId**, since the resume
  path is now always a `SendMessage` to a completed (background) agent.
- **Files:** `agents/team-lead.md`.
- **Acceptance:** the resume instruction names agentId and warns that role-name addressing is live-only.

### RUNTIME — document only (not plugin-fixable)
- **Stale task-notification labels:** every completion notice keeps the original spawn label
  (e.g. *"…Phase 1 analyze F6"*) across resumes, because the agentId keeps its spawn label. The team-lead
  should track role by agentId and **not trust notification labels** — document this, don't try to fix it.
- **Self-report count drift:** an agent's prose count of its own output can drift (architect said
  "Q1–Q3" while raising Q1–Q4). Rely on the artifact, not the agent's self-count.

---

## Cross-cutting acceptance (applies to the whole release)

1. **Guardrails proven to fire, live.** At minimum: (a) a developer source-write during an `analyze`
   phase is denied; (b) a pipeline subagent cannot write `.claude/.pipeline-state`; (c) a reviewer
   re-review that doesn't update `review.md` is caught. Code-review alone is insufficient — both runs
   proved guardrails fail *silently*.
2. **One verdict, one file.** After M4, each of plan-review / done-check / code-review / codex-crosscheck
   has a single authoritative verdict line in a predictable path.
3. **One release.** All of the above plus the already-in-tree work (background, versioning) ship together
   under a single version bump; nothing is delivered half-done.
