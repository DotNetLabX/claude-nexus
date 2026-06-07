# Pipeline Hardening

**Feature Spec:** None (brief: `docs/pipeline-hardening-findings.md` — owner-authored consolidated findings)
**Slug:** `adhoc-PipelineHardening`
**Intent class:** Complex (multi-file: 1 hook + 5 agents + 2 rules + 2 skills) with a mechanical-enforcement core. Refactoring-adjacent — behavior of the *pipeline machinery* changes; no consuming-project code changes.
**Release tier:** MINOR (owner decision — new enforcement capability).

## Context

Two independent production runs (F6-SlackAdapter / KnowledgeGateway and Pass-3b-AppSettingsVOs /
Sprint-Rituals) surfaced a converging set of agent/communication defects. Both runs *shipped correct
results*, but several guardrails were found to be **load-bearing by luck, not enforced** — when an
agent's return is empty *and* its artifact is stale, only the team-lead's distrust caught it, and in one
case only because the stale value happened to point the safe way. This pass converts that luck into
enforcement. Definition of done (from the brief): **every HIGH and MEDIUM closed and verified — guardrail
fixes proven to *fire* live, not merely code-reviewed — shipped as one release.**

This is a **dev-repo concern**: all edits are to `plugins/nexus/**` (the plugin's own machinery). Per
`CLAUDE.md` + ADR-9, the edits ship under one version bump in the same commit, with `commands/*.md`
regenerated and the `omni` twin synced.

## Scope

**In scope:** H1, H2, H3 (HIGH); **H4 — `.pipeline-state` liveness/deadlock-prevention (surfaced live during
this planning session; folded into Step 2)**; **H0 — team-lead read-lane enforcement and H2b — gate
markdown blind spot (both surfaced when a live team run executed against this self-hosting repo; folded
into Step 2)**; M4, M5, M6, M7 (MED); L8, L9 (LOW); the two RUNTIME items as
documentation. One MINOR release bundling these with the already-in-tree work (below).

**H0 / H2b origin (live run, this repo).** A team-lead run executed Phase 1–2 here and exposed two holes the
spoke-only findings missed: (H2b) the collapse gate keys on real-code extensions, but **this** repo's pipeline
source *is* markdown, so the developer collapsed into implementation during `analyze` and the gate let every
`.md` write through (only the `.js` steps were caught); (H0) the team-lead left its router lane — it opened the
authored artifacts (plan/implementation), which both **usurps an agent's judging role** and **inflates the
team-lead's context**. Both are the same class this pass targets (a prose-only guardrail ignored under load),
so both get *enforced*, not just re-stated. They are dev-repo machinery fixes; consuming projects are unaffected.

**Explicitly out of scope:**
- **Token-audit fidelity** (per-turn-sampling, under-reported peak, off-by-one output in ADR-11 /
  `consumption-report`) — real defects found while reading the audit logs, but a *different axis*
  (observability accuracy, not correctness guardrails). Owner decision: track as a separate follow-up
  feature `adhoc-TokenAuditFidelity`. Do **not** touch `audit-logger.js` / `consumption-report` in this run.
- Any consuming-project (`nexus-dotnet`) skill or convention change.
- Parallelizing the pipeline (serial-by-design stays — Inherited decisions).

## Already in the working tree — do NOT re-open (context only)

These ride along in the same release; they are not part of this scope and must not be re-implemented:
- **Spawn mode = background** (ADR-12) — `pipeline-gate.js:42` already drops foreground enforcement.
- **Versioning → PATCH-default, owner-escalates** (`bump-plugin.mjs`, `release-plugin` skill, `CLAUDE.md`).
- **State-file integrity** (gate invariant 3, `pipeline-gate.js:48-62`) — already denies a pipeline
  subagent writing `.claude/.pipeline-state`. This is invariant 3 below; **keep it**, build on it.

## Skill Mapping

| Step | Skill | Disposition | Feature-Specific Inputs | Gap? |
|------|-------|-------------|------------------------|------|
| 1 | (none) | — | `.pipeline-state` vocabulary + gate-behavior table; rules + team-lead | M7 — no skill governs pipeline state vocabulary |
| 2 | (none) | — | Gate decision table (`pipeline-gate.js`) + H4 state liveness (`restore-agent.js` SessionStart clear) + H2b dev-repo markdown source guard + H0 team-lead read-lane (`hooks.json` matcher + gate Read/Grep branch) | Hook logic — no covering skill |
| 3 | review-format (edit) | None | Fokus parity: critic message-only (no file); done-check + code-review = labeled sections in `review.md`; no new files | Editing the format skill itself |
| 4 | (none) | — | Reviewer re-review postcondition + team-lead per-cycle staleness check | Agent-prose enforcement |
| 5 | (none) | — | Critic spawn = current hub (standalone: architect; team: team-lead); review-mode question UNCHANGED | Agent-prose coordination |
| 6 | (none) | — | Codex → `codex-crosscheck.md` mandate | Team-lead dispatch prose |
| 7 | (none) | — | Minimal-return requirement per agent | Agent-prose return contract |
| 8 | (none) | — | L8 canonical comm-log name, L9 agentId note, RUNTIME notes | Doc-only |
| 9 | (none) | — | `pipeline-gate.js` unit tests + live-fire procedure | No test infra exists yet |
| 10 | release-plugin | Follow | MINOR bump; regenerate commands; sync omni; validate; one commit | |

Most steps are **None** — the work edits the plugin's *own* agent/rule/hook prose, for which no
generative skill exists. The disposition is honest: describe the change + acceptance, reference the exact
current text to replace, and let the developer make the edit. Step 10 **Follows** `release-plugin` (the
owned ADR-9 flow).

## Domain Model / Data Model Changes

None (no aggregates, tables, or migrations). The "domain" here is the pipeline-state vocabulary (Step 1).

## Implementation Steps

> **Read-first for the developer:** `docs/pipeline-hardening-findings.md` (the brief — every finding's
> root cause + acceptance), `docs/architecture/README.md` ADR-7 (enforcement philosophy: *failures must be
> unreachable*), ADR-12 (background spawn), ADR-4 (format skills are producer-preloaded).
> **Generated-artifact rule:** never hand-edit `plugins/nexus/commands/*.md` — they are regenerated in
> Step 10. Edit only `agents/*.md`, `rules/*.md`, `skills/**`, `hooks/scripts/*.js`.

---

### Step 1 — Define the complete `.pipeline-state` vocabulary + gate-behavior table (M7)

**Do:** Establish the full phase vocabulary the team-lead writes and the gate reads — today only four
tokens are documented (`team-lead.md:84`: `architect:analyze→architect:plan`,
`developer:analyze→developer:implement`); critic/reviewer/donecheck/po phases are undefined, and the gate
fails open on anything it doesn't recognize. Document the vocabulary **once** as the canonical reference
and point the gate spec (Step 2) at it.

**Canonical vocabulary (binding — these exact tokens):**

| `.pipeline-state` value | phase meaning | written by team-lead before |
|---|---|---|
| *(absent)* | no pipeline active / solo / leaderless run | — |
| `po:shape` | PO shaping the spec | spawning PO |
| `architect:analyze` | architect Phase-1 analyze-and-stop | spawning architect Phase 1 |
| `architect:plan` | architect Phase-2 writing the plan | resuming architect Phase 2 |
| `architect:donecheck` | architect Step-1 done check | resuming architect for done check |
| `critic:review` | critic reviewing spec or plan | spawning critic |
| `developer:analyze` | developer Phase-1 analyze-and-stop | spawning developer Phase 1 |
| `developer:implement` | developer Phase-2 implementing | resuming developer Phase 2 |
| `reviewer:review` | reviewer Step-2 code review | spawning reviewer |
| `learner:process` | learner consolidating lessons | spawning learner |

**Files:**
- `plugins/nexus/rules/agents-workflow.md` — add a "Pipeline state (`.claude/.pipeline-state`)" subsection
  near the paths block (`:22`): the vocabulary table, "**the team-lead is the sole writer**" (cross-ref
  gate invariant 3), and "every transition writes the next token before the spawn/resume."
- `plugins/nexus/agents/team-lead.md` — replace the `:84` "State for the gate" paragraph: reference the
  full vocabulary (not just the 4 tokens), and state the gate contract in one line ("source writes are
  gate-allowed only under `developer:implement`; a stale/absent token fails open per Step-2 rules").

**Acceptance:** every pipeline phase has exactly one defined token; the rule file and team-lead agree;
team-lead is named as sole writer. **Dependency:** none (Step 2 references this table).
**Confidence:** high.

---

### Step 2 — Gate enforcement: present⇒strict/absent⇒open + state liveness + dev-repo source coverage + team-lead read-lane (H2 + H4 + H2b + H0)

**Do:** Replace the gate's analyze-only block (`pipeline-gate.js:66-80`, `phaseIsAnalyze` at `:103-108`)
with persona-keyed strict enforcement keyed on the Step-1 vocabulary. **Keep invariants 2 and 3 as-is**
(verdict integrity on `review.md`; state-file integrity). Do not write the JS here — implement to this
decision table:

**Gate decision (PreToolUse, Write/Edit/MultiEdit only):**

| Condition | Decision |
|---|---|
| `.pipeline-state` **absent** (file missing) | **allow** (fail open — solo / leaderless / unattended-no-leader) |
| writer persona = `developer`, target is a **source file**, state ≠ `developer:implement` | **deny** (covers `developer:analyze`, any other present token, and unrecognized values — conservative) |
| writer persona = `developer`, target is a source file, state = `developer:implement` | allow |
| writer persona = `architect`, target = `plan.md`, state matches any `*:analyze` | **deny** (the plan-collapse) |
| writer persona = `architect`, target = `plan.md`, any other state (incl. `architect:plan`, absent) | allow |
| anything else | allow (out of this invariant's scope; `guard.js` still applies) |

**Matching rule (for the developer):** the source-write row matches by **exact string** —
`state.trim() === 'developer:implement'`; any other value, including unrecognized, denies a developer
source-write. The `plan.md` rows reuse the existing **`:analyze` suffix** logic (today's `phaseIsAnalyze`,
`:103-107`). The two intentionally differ — source is allowed only under the one explicit working token;
plan.md blocks only the analyze-collapse.

**Rationale to preserve in the header comment:**
- *Source* is the high-risk write → strict (allowed only under the explicit working token). The team-lead
  is the sole state writer (invariant 3) and is always present when a pipeline is active, so it can always
  advance the token → **no deadlock**: the deny reason addresses the team-lead ("advance `.pipeline-state`
  to `developer:implement`"), who *can* write it; the subagent (which cannot, by invariant 3) is not asked to.
- *plan.md* is lower-risk → block only the analyze-collapse, so a legitimate plan amendment during
  `architect:plan` or a Q&A resume is not false-blocked.
- *Absent* state → open, preserving "never wedge a leaderless/unattended run" (ADR-7).

**State liveness — H4 (deadlock prevention; surfaced live during this planning session).** `present⇒strict`
is only safe if "present" means "set by *this* live session." Today `.pipeline-state` is a flat file with
**no session identity and no expiry**, so a stale token from a **closed / abandoned / forgotten** session
persists and the gate keeps enforcing it — blocking a *new* session's writes (exactly what happened: a dead
team-lead session's `architect:analyze` blocked a plan edit). `present⇒strict` *amplifies* this. The persona
registry already solved the identical problem for `.current-agent`: `.personas.json` is session-keyed,
16h-TTL-pruned, and cleared-on-exit by `restore-agent.js`. `.pipeline-state` never got that hygiene. **Fix:
mirror the persona lifecycle** — `restore-agent.js` (the SessionStart hook) **deletes `.pipeline-state` on
`source==='startup'` and `'clear'`** (a brand-new or exited session can only be holding a *prior* session's
leftover) and **keeps it on `'compact'`/`'resume'`** (the live session is continuing). A fresh session then
starts with no inherited state → gate fails open → the team-lead writes fresh state when it actually
launches a pipeline *in this session*. No cross-session block, no manual clear, no deadlock. (Verified:
subagents share the parent `session_id`, so within a live run the team-lead's state still governs its
subagents; there is **no `SessionEnd` hook**, so SessionStart is the correct — and only — self-heal point.
A within-session stale token, e.g. team-lead forgets to advance, is recoverable: the main session rewrites
the token and the deny reason says so; only *cross-session* leakage was unrecoverable without this fix.)

**Dev-repo source coverage — H2b (collapse gate is blind to this repo's real source).** The collapse gate
treats only real-code extensions as "source" (and excludes anything under `docs/`); markdown is docs in a
*consuming* project, so that is correct there. But **this** repo's pipeline source IS markdown
(`plugins/*/{agents,rules,skills,commands}/**`), so the developer's analyze-collapse wrote those files
straight through the gate. **Fix: add a dev-repo-scoped source check** — when the project root is itself a
nexus plugin repo, treat a write under `plugins/*/{agents,rules,skills,commands,hooks}/**` as a guarded
source write for the developer collapse rule, in addition to the existing code-extension check.
**Marker must identify THIS repo specifically, not "any repo with a plugin folder"** (MINOR-3 — a consuming
monorepo that vendors a nexus plugin, or hosts other Claude plugins, would also have a
`plugins/*/.claude-plugin/plugin.json`). Require **both**: (a) the marker resolves at the
`CLAUDE_PROJECT_DIR` **root** (`<root>/plugins/<name>/.claude-plugin/plugin.json`, not a nested/vendored
path), and (b) that `plugin.json`'s `name` is `nexus` or `nexus-dotnet`. Only then does the `plugins/*`
source case arm. **Scope it to that test** so no consuming project ever has its `.md`/doc writes blocked
during `analyze` — the guard activates only when the root IS the nexus plugin dev repo. (The existing
`docs/` and `.claude/` exclusions stay; this adds the `plugins/*` developer-source case for the dev repo
only.)

**Team-lead read-lane — H0 (the hub must stay a router; enforce it).** Prose says the team-lead routes and
must never open `plan.md`/`implementation.md`/`lessons.md`/source — and that prose was ignored under load
(the live run's team-lead opened `implementation.md` and grep-read large stretches of `plan.md`), which both
**usurped the agent's judging role** and **bloated the team-lead's context**. Convert the rule into an
enforced lane: **extend the PreToolUse gate to also see `Read`/`Grep`**, and when the actor is the
team-lead, deny opening the authored artifacts/source.

**Persona detection — use the session-keyed signal, NOT `.current-agent` (MAJOR-1).** `.current-agent` is a
flat, host-repo-scoped, single-value file written once per persona command and **never cleared by any hook**
(only `register-persona.js` writes it; `restore-agent.js` clears `.pipeline-state` and prunes
`.personas.json` but never touches it) — so it goes stale and would either **false-positive-wedge** the main
session (it still says `team-lead` after the user switched to `be solo`/`be architect`) or **silently no-op**
in a consuming project that never ran `/team-lead`. Using it here would reproduce the exact unhygienic-state
class H4 just fixed. **Detect the team-lead from `.personas.json[data.session_id].agent === 'team-lead'`**
(the PreToolUse payload carries `session_id`; the registry is 16h-TTL-pruned and cleared-on-exit) **AND** no
subagent `agent_type` (a subagent carries `agent_type`, so it cannot pose as the main-session team-lead).
**Absent/disagreeing signal ⇒ allow (fail open, per ADR-7)** — never wedge an unattended or non-team-lead
session.

**What is denied vs allowed — encode the team-lead's own Read Discipline table exactly (MINOR-4), no more,
no less:**
- **Deny** `Read` (and `Grep`) of `plan.md`, `implementation.md`, `lessons.md`, and any code/markdown
  *source* under `plugins/**`/`src/**`.
- **Allow** `Read` of `communication-log.md`, `questions.md`, and **`docs/backlog.md`** (the team-lead's own
  coordination ledger — triage reads it, and "update backlog/spec Status" at shutdown forces a read-before-
  edit; omitting it wedges the hub's headline job). All are legitimate router reads; mirror them into
  `team-lead.md`'s Read Discipline table (add the `backlog.md` row — the table was incomplete, which is why
  this surfaced only once H0 made the table binding).
- **Allow** a **structurally-bounded** `Grep` of `review.md` / `codex-crosscheck.md` only — *not* an
  intent-based "targeted" grep (MINOR-1: a `Grep` with `output_mode: content` + broad pattern or large
  `-C`/`head_limit` reads as much as a full `Read`). Machine-checkable rule: allow `Grep` **only when** the
  path ∈ {`review.md`, `codex-crosscheck.md`} **and** (`output_mode` ∈ {`files_with_matches`,`count`} **or**
  context is small — `-C`/`-A`/`-B` ≤ 3 and no `head_limit: 0`); **deny** `Grep` on
  `plan.md`/`implementation.md`/`lessons.md`/source outright (those carry no verdict to grep).
- `git diff --stat` (summary construction) is a **Bash** call, not `Read`/`Grep` — unaffected; do not
  over-block it.

The deny reason self-corrects: *"you route, you don't read — forward this to the architect (done-check) or
reviewer; resume the owning agent by agentId."* This is the same enforce-don't-restate move as the rest of
this pass, applied to the hub the pass otherwise skipped.

**Files:**
- `plugins/nexus/hooks/scripts/pipeline-gate.js` — generalize `phaseIsAnalyze` into a state-reader returning
  the raw token; rewrite the invariant-1 block per the table; use `data.agent_type` for the writer persona
  (same source invariant 3 already uses at `:53`); update the header doc comment to describe
  present⇒strict / absent⇒open. **H2b:** extend `isCodeFile` (or add an `isDevRepoPluginSource(fp, root)`
  helper) so a developer write under `plugins/*/{agents,rules,skills,commands,hooks}/**` counts as source
  **only when** the root-anchored marker `<root>/plugins/<name>/.claude-plugin/plugin.json` exists **and**
  its `name` is `nexus`/`nexus-dotnet` (MINOR-3 — not any nested/vendored plugin). **H0:** add a
  `Read`/`Grep` branch that detects the team-lead via `.personas.json[data.session_id].agent==='team-lead'`
  + no subagent `agent_type` (NOT `.current-agent` — MAJOR-1), fails open on absent/disagreeing signal, and
  applies the deny/allow allowlist above (deny plan/impl/lessons/`plugins/**`+`src/**` source; allow
  comm-log + `questions.md` Read; allow only structurally-bounded `Grep` of `review.md`/`codex-crosscheck.md`
  per MINOR-1); emit the self-correcting "you route, you don't read" deny reason. **Restructure the
  early-return (MINOR-2):** the H0 branch must run **before** `pipeline-gate.js:59`
  (`if (!/^(Write|Edit|MultiEdit)$/…) return allow()`), which today hard-allows every non-Write tool — a
  branch added after it is dead code. Keep the common case cheap: a non-team-lead `Read`/`Grep` must still
  fast-path to `allow()` immediately.
- `plugins/nexus/hooks/hooks.json` — **H0:** widen the `pipeline-gate.js` PreToolUse matcher to also include
  `Read|Grep` (today it is `Write|Edit|MultiEdit|Task|Agent`) so the read-lane branch is reached. The widening
  is **isolated to the pipeline-gate matcher block** — `guard.js`/`audit-logger.js` are separate blocks
  (already all-tools) and are unaffected; confirm, do not modify them.
- `plugins/nexus/hooks/scripts/restore-agent.js` — extend the existing SessionStart cleanup (`:52-69`):
  alongside the `.personas.json` prune, **delete `.claude/.pipeline-state` on `startup` and `clear`** (keep
  on `compact`/`resume`), reusing the same `source`-discrimination the persona restore already applies
  (`:60,71`). Document why (`.pipeline-state` must not outlive its session).
- `plugins/nexus/agents/team-lead.md` — **H0:** in Read Discipline, note the lane is now hook-enforced (not
  prose-only): opening the authored artifacts/source is denied; the team-lead reads the comm-log +
  `questions.md` and greps verdicts (`review.md`/`codex-crosscheck.md`) only. The hook allowlist must match
  this table exactly (MINOR-4). Cross-ref the deny reason.

**Acceptance:** with `.pipeline-state`=`developer:analyze`, a developer source-write is **denied**; with
`developer:implement`, allowed; with the file absent, allowed; with an unrecognized token, a developer
source-write is denied. **And (H4): a `.pipeline-state` left by a prior/closed session does NOT block a new
session** — `restore-agent.js` clears it on `startup`, so the next session begins gate-open until the
team-lead sets fresh state. **And (H2b): with a plugin-repo marker present, a developer write to a
`plugins/*/agents/*.md` under `developer:analyze` is denied** (the self-hosting collapse hole is closed),
while the same write in a marker-less consuming project is allowed. **And (H0): a team-lead-persona `Read`
of `plan.md`/`implementation.md` is denied, while a targeted verdict `Grep` of `review.md` and a `Read` of
`communication-log.md` are allowed.** Proven by Step 9 tests, not assumed. **Dependency:** Step 1 (vocabulary).
**Confidence:** medium — the persona-keyed asymmetry (strict source, collapse-only plan) is a refinement
of the brief's "conservative-deny"; the developer should implement the table exactly and surface any case
it doesn't cover. H0/H2b are dev-repo-scoped — the developer must verify the marker gate so no consuming
project is affected.

---

### Step 3 — Remove stacked verdicts WITHOUT new files (M4 — full Fokus parity)

**Do:** The brief's M4 proposed splitting `review.md` into three files (`plan-review.md`, `done-check.md`,
`review.md`). **Owner decision: do not introduce new files** — neither `plan-review.md` nor `done-check.md`
exists in the Fokus baseline (verified: Fokus uses a single `review.md` for the architect done-check
*Step-1 section* + the reviewer code-review *Step-2 section*, and the **critic returns findings by message**
with no durable file). Restore that model and kill the stacked-verdict ambiguity by **labeling sections and
grepping the section**, not by proliferating files.

Target artifact model (= Fokus):
- **critic plan-review → message only, no file.** The architect folds the critic's findings into a
  `## Plan Review` note in `plan.md` and fixes them (Step 5). Nothing downstream greps a critic verdict.
- **`review.md` holds two labeled sections:** `## Step 1 — Done-Check` (architect: dispositions +
  PASS/FAIL) and `## Step 2 — Code Review` (reviewer: severity findings + APPROVED/REQUEST CHANGES). The
  three-verdict stacking is gone because the critic no longer writes here.

**Files:**
- `plugins/nexus/skills/review-format/SKILL.md` — document `review.md`'s two labeled sections (`## Step 1
  — Done-Check`, `## Step 2 — Code Review`), each with its single verdict line; state explicitly that the
  **critic produces no durable file** (findings go via message). No `plan-review.md`, no `done-check.md`.
- `plugins/nexus/agents/architect.md` — done-check section (`:194-210`) + escalation read (`:223`):
  the Step-1 verdict is written to the `## Step 1 — Done-Check` **section of `review.md`** (unchanged
  target — keep it in `review.md`, as Fokus does; do NOT move it to a `done-check.md`).
- `plugins/nexus/agents/reviewer.md` — writes the `## Step 2 — Code Review` section of `review.md`
  (its existing target; just name the section).
- `plugins/nexus/agents/critic.md` — message-only; writes no file (mechanics covered by Step 5).
- `plugins/nexus/agents/team-lead.md` — Read-Discipline grep-target row (`:44`) + Verdict Validation
  (`:140-142`): grep the **`## Step 1 — Done-Check` section** for any `Missing`, and the **`## Step 2 —
  Code Review` section** for the reviewer verdict — section-targeted, not a bare `Verdict:` scan.
  (Coordinate with Step 4, which also edits `:140-142` — Step 3 sets the grep *targets*, Step 4 adds the
  per-cycle staleness check.)
- `plugins/nexus/hooks/scripts/pipeline-gate.js` — **no change** (invariant 2 already targets `review.md`;
  with the critic gone, the only `APPROVED`+severity content is the reviewer's Step-2 section, so the
  invariant cannot misfire on a stacked critic/done-check finding). Recorded so the brief's M4 file list is
  accounted for, not silently dropped.

**Acceptance:** no new artifact files are created (`plan-review.md` / `done-check.md` do NOT exist);
`review.md` carries the two labeled sections; the critic writes no file and the architect folds its findings
into `plan.md`; the team-lead greps the named sections (no bare `Verdict:` scan, no grep for a critic file).
**Dependency:** none. **Confidence:** high (reverts to the proven Fokus artifact set).

---

### Step 4 — Reviewer re-review postcondition + team-lead per-cycle staleness check (H1)

**Do:** Make a stale verdict unreachable. (a) A reviewer **re-review** is complete only if it rewrites
`review.md` — the verdict line **and** the evidence rows for *this* cycle; a resume that returns an ack
without rewriting is a failure. (b) The team-lead, on a re-review, confirms the artifact actually changed
for this cycle (verdict/evidence differ from the prior cycle); an unchanged artifact ⇒ treat as agent
failure and **re-dispatch**, never accept the chat ack.

**Files:**
- `plugins/nexus/agents/reviewer.md` — add the hard postcondition near the APPROVED-scan (`:54`) and the
  fixes/return block (`:62`): "On a re-review you MUST rewrite `review.md` (verdict + this-cycle evidence
  rows). A resume that does not is incomplete."
- `plugins/nexus/agents/team-lead.md` — Verdict Validation (`:140-142`): add the per-cycle staleness
  check — compare the re-review's verdict/evidence against the prior cycle; if unchanged, re-dispatch with
  an explicit "you MUST edit review.md" and do not relay the ack. Cross-reference L9 (resume by agentId).

**Acceptance:** a reviewer resume that fails to update `review.md` for the cycle is detected by the
team-lead and re-dispatched, not accepted; verified by the Step-9 documented integration check.
**Dependency:** Step 3 (the reviewer's verdict lives in the `## Step 2 — Code Review` section of
`review.md` — the staleness check targets that section).
**Confidence:** medium — prose enforcement; the brief notes a `SubagentStop` staleness hook as a fallback
if prose proves insufficient (flag in lessons if so, do not build the hook in this run).

---

### Step 5 — Critic spawn = the current coordination hub; review-mode question unchanged (H3)

**Do:** Fix the silent self-review collapse. The bug is in `critic.md:40`, which says the critic "returns
directly to whoever spawned you … because you run **as a sub-review within the PO's or architect's turn**."
That assumes the requester can always spawn the critic — true for a **standalone** architect/PO (the main
session, which can spawn), **false** for a **team** architect/PO (a background subagent cannot spawn a
subagent) — so in team mode the critic step silently collapses to a self-review. Fokus had this right:
`fokus/.../critic.md` routes "**via team lead**." Restore that, conditioned on the spawner's capability.

**DO NOT CHANGE the architect's review-mode question.** The architect still asks/recommends **self-review
vs critic** in both modes (`architect.md:144` recommendation, `:159` standalone `AskUserQuestion`) — that is
load-bearing and stays exactly as-is. Only the **spawn mechanics** change.

Corrected rule (the hub spawns the critic):
- **Standalone** architect/PO (main session): spawns the critic **directly** via
  `Agent(subagent_type="critic", …)` and receives findings directly. (Works today — unchanged.)
- **Team** architect/PO (itself a subagent): **cannot** spawn — hands back to the team-lead
  ("critic review owed on `plan.md`"); the **team-lead** spawns the critic and **relays** findings back,
  then resumes the requester to fix gaps.
- Either way the critic returns findings **by message** (no durable file — Step 3); when the team-lead
  spawned it, the critic routes **via the team-lead**.

**Files:**
- `plugins/nexus/agents/critic.md` — rewrite `:40`: the critic is spawned by the **current coordination
  hub** (standalone architect/PO directly; the team-lead when the requester is itself a subagent), returns
  findings to that spawner, and routes **via the team-lead** when the team-lead spawned it. Drop the "runs
  as a sub-review within the requester's turn" assumption. Align with Fokus (`via team lead`).
- `plugins/nexus/agents/architect.md` — Plan Workflow step 11 (Critic review): **keep** the review-mode
  question; make the spawn **conditional** — standalone → spawn directly via `Agent(...)` (as today); team
  (you are a subagent) → hand back "critic review owed on `plan.md`" for the team-lead to spawn. The critic
  is message-only; fold its findings into a `## Plan Review` note in `plan.md` and fix them.
- `plugins/nexus/agents/team-lead.md` — add "critic review owed" hand-back handling: spawn the critic
  (Mode 2), relay findings to the architect; update the pipeline diagram that folds critic review into
  "architect Phase 2."

**Acceptance:** the architect's self/critic review-mode question is unchanged in both modes; a **standalone**
architect spawns the critic itself; a **team** architect's critic is **team-lead-spawned** (never a silent
self-review); the critic returns findings by message with no durable file.
**Dependency:** Step 3 (critic is message-only). **Confidence:** medium — touches the coordination diagram;
keep it consistent across `critic.md`, `architect.md`, `team-lead.md`.

---

### Step 6 — Codex cross-check writes findings to a file (M5)

**Do:** Surface Codex findings via the same grep-the-artifact contract as every other verdict. **Verified
gap:** `team-lead.md:153` is only the team-mode *selection* line (*"ask: Fast / Standard / Standard+Codex"*)
— there is **no** Standard+Codex *dispatch* section in `team-lead.md` today (grep `codex` → only `:44` and
`:153`). So this step **creates** that dispatch contract; it does not edit `:153` in place.

Add a new **Standard+Codex dispatch** subsection: when team mode = Standard+Codex, dispatch
`codex:codex-rescue` with a requirement to **write findings to
`docs/specs/{slug}/delivery/codex-crosscheck.md`**; then grep that file for the GO/NO-GO + findings (per the
Relay Contract). A Codex chat ack (`"Done."`/`"Acknowledged."`) is never the result. Update the
Read-Discipline `codex-*` grep-target row (`:44`) to name `codex-crosscheck.md` as the canonical file.

**Files:** `plugins/nexus/agents/team-lead.md` — new Standard+Codex dispatch subsection (placed near the
team-mode selection at `:153`) + the `:44` grep-target row.

**Acceptance:** a Standard+Codex run surfaces Codex's findings from `codex-crosscheck.md` every time, with
no manual "write them down" re-prompt; the team-lead greps `codex-crosscheck.md` for the verdict.
**Dependency:** none. **Confidence:** high.

---

### Step 7 — Minimal-return requirement per pipeline agent (M6)

**Do:** The Checkpoint Report Format (`team-lead.md:111`) is universally ignored — both runs returned
`Idle.`/`Done.`/`Acknowledged.`, and the architect's Phase-1 return did not inline its own questions.
Keep artifact-first relay, but make a **minimal return** a hard requirement: at least the **verdict line +
any questions inline**. Grep stays the backstop (and H1 shows the artifact alone can be stale, so neither
channel is reliable alone).

**Files:**
- `plugins/nexus/agents/architect.md`, `plugins/nexus/agents/developer.md`,
  `plugins/nexus/agents/reviewer.md` — add a per-agent "Minimal return" rule: a Phase-1 analyze return
  **must inline its questions** (Q1..Qn verbatim); a verdict handoff **must carry the verdict line**.
- `plugins/nexus/agents/team-lead.md` — tighten the Checkpoint Report Format (`:111`) to state the minimal
  return is mandatory and that the team-lead appends action options if missing (existing rule).

**Acceptance:** a Phase-1 analyze return carries its questions inline; a verdict handoff carries the
verdict line without forcing a grep (grep remains a backstop). **Dependency:** none. **Confidence:** high.

---

### Step 8 — Comm-log canonical name (L8), agentId addressing (L9), RUNTIME notes

**Do:** Three small doc fixes.
- **L8:** The plugin already uses `communication-log.md` everywhere (`team-lead.md:43,226,230`;
  `agents-workflow.md:22`) — there is **no** `comm-log` drift inside the plugin (the drift was a consuming
  repo's local name). Make it explicit: state in `agents-workflow.md` that **`communication-log.md` is the
  canonical filename**; a consumer preferring another name is their concern. Verify-only — do not rename.
- **L9:** `team-lead.md:80` already says "SendMessage to its agent id" — add the explicit warning that
  **role-name addressing fails once an agent goes idle; always resume by agentId** (the resume path is now
  always a SendMessage to a completed background agent).
- **RUNTIME (document only):** in `team-lead.md`, note (a) **stale task-notification labels** keep the
  original spawn label across resumes — track role by agentId, do not trust the notification label; (b)
  **self-report count drift** — rely on the artifact, not the agent's prose self-count.

**Files:** `plugins/nexus/rules/agents-workflow.md`, `plugins/nexus/agents/team-lead.md`.

**Acceptance:** one canonical comm-log name stated; the resume instruction names agentId and warns
role-name addressing is live-only; both RUNTIME caveats documented. **Dependency:** none. **Confidence:** high.

---

### Step 9 — Prove the guardrails fire: gate unit tests + documented live-fire (cross-cutting acceptance #1)

**Do:** Code-review alone is insufficient (both runs proved guardrails fail *silently*). Add deterministic
tests for the gate and a documented manual procedure for the team-lead-level checks. There is currently
**no test infrastructure** in the plugin — add a minimal one (no new dependency): a node script that pipes
crafted PreToolUse JSON to `pipeline-gate.js` via `child_process` and asserts the `permissionDecision`.

**Cases (assert deny/allow):**
1. developer source-write under `developer:analyze` → **deny** (H2 collapse).
2. developer source-write under `developer:implement` → allow.
3. developer source-write with `.pipeline-state` **absent** → allow (fail open).
4. developer source-write under an unrecognized token → **deny** (conservative).
5. architect `plan.md` write under `architect:analyze` → **deny**; under `architect:plan` → allow.
6. any pipeline-role write to `.claude/.pipeline-state` → **deny** (invariant 3, regression guard).
7. `review.md` APPROVED with an open HIGH → **deny** (invariant 2, regression guard).
8. **(H4)** `restore-agent.js` on a SessionStart payload with `source:"startup"` (and `"clear"`) **deletes**
   a pre-existing `.claude/.pipeline-state`; with `source:"compact"` (and `"resume"`) it **keeps** it. Proves
   a prior/closed session's token cannot block a new session.
9. **(H2b)** developer write to `plugins/nexus/agents/x.md` under `developer:analyze`, with a **root-anchored
   `name:nexus`** marker present → **deny**; same write with **no marker** (consuming project) → **allow**;
   same write with a marker whose **`name` ≠ nexus** (vendored/unrelated plugin, MINOR-3) → **allow**. Proves
   the self-hosting markdown hole is closed and scoped to this repo only.
10. **(H0)** team-lead detected via `.personas.json[session_id].agent==='team-lead'` + no `agent_type`:
    `Read` of `plan.md`/`implementation.md` → **deny**; `Read` of `communication-log.md`/`questions.md`/
    `docs/backlog.md` and a **bounded** `Grep` of `review.md` (`output_mode: files_with_matches`) → **allow**;
    a **broad-context** `Grep` of `plan.md` (e.g. `-C 200`) → **deny** (MINOR-1). And **absent/disagreeing
    persona signal** (no `.personas.json` entry for this session) on a `Read` of `plan.md` → **allow**
    (MAJOR-1 fail-open). Proves the router lane is enforced AND does not wedge the team-lead's own triage or a
    non-team-lead/solo session.

**Files:** `plugins/nexus/hooks/scripts/__tests__/pipeline-gate.test.mjs` and
`…/__tests__/restore-agent.test.mjs` (case 8). **Run command (MAJOR-2 — verified on this repo's Node
v24):** `node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"`. Do **not** use the bare-directory
form `node --test …/__tests__/` — on Node v24 it throws `MODULE_NOT_FOUND` and runs **zero** tests (it
treats the dir as a module entrypoint). **No `package.json` exists anywhere in the repo** (verified) — add no
`test` script entry; `node --test` needs none. **Cases 1–8 already exist in the working tree** from the
halted run (`pipeline-gate.test.mjs` 1–7, `restore-agent.test.mjs` 8) and pass — this step **adds cases 9
and 10** (and their sub-cases) and is otherwise a reuse, *if* that in-tree work is kept (owner's
validate-vs-redo decision); on a clean redo, author all of them.

**Also document AND run once** (not auto-testable at the hook layer): the H1 team-lead staleness check (a
re-review that doesn't update `review.md` is caught). Write the procedure to a delivery note **and record
its one live-run result** (PASS/FAIL + the re-dispatch evidence) **before Step 10** — a documented-but-unrun
check does not meet the brief's "proven to fire live" bar.

**Acceptance:** `node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"` passes every scenario above;
the three cross-cutting live-fire guarantees (developer source in analyze denied; subagent `.pipeline-state`
write denied; reviewer stale `review.md` caught) are each demonstrably covered (1, 6, and the documented H1
check); H4 cross-session non-blocking is covered by case 8; H2b dev-repo markdown coverage (incl. the
vendored-plugin allow) by case 9; H0 team-lead read-lane (incl. broad-grep deny + absent-persona fail-open)
by case 10.
**Dependency:** Steps 1, 2 (gate behavior + H4), 3 (review.md sections). **Confidence:** medium — no
precedent test harness in-repo; use `node:test` (no `package.json` exists, verified) driving the hooks via
`child_process` + stdin.

---

### Step 10 — Regenerate commands, MINOR release, sync omni, one commit (cross-cutting acceptance #3)

**Do:** Ship everything above plus the already-in-tree work (background, versioning, state-integrity) as
**one** MINOR release. Follow `release-plugin`.

**Sequence (Follow `release-plugin` / ADR-9):**
1. `node --test "plugins/nexus/hooks/scripts/__tests__/*.test.mjs"` — **all gate/restore tests green first**
   (MAJOR-2: the glob form, not the bare-dir form which runs zero on Node v24). Release ships only on green.
2. `node scripts/gen-commands.mjs nexus` — regenerate `commands/*.md` from the edited `agents/*.md`.
3. `node scripts/bump-plugin.mjs --minor` — bump `plugin.json` + `CHANGELOG.md` (owner-escalated MINOR).
4. `node scripts/gen-omni.mjs` — sync the omni twin (runs **after** the bump so the twin's version rides along).
5. `claude plugin validate plugins/nexus --strict`.
6. Commit content + bump + CHANGELOG + regenerated commands as **one** commit.

**Files:** `plugins/nexus/hooks/scripts/__tests__/pipeline-gate.test.mjs` +
`…/__tests__/restore-agent.test.mjs` (new, from Step 9 — list explicitly),
`plugins/nexus/hooks/scripts/restore-agent.js` (H4 change, Step 2),
`plugins/nexus/hooks/scripts/pipeline-gate.js` + `plugins/nexus/hooks/hooks.json` (H2b/H0 change, Step 2),
`plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md`,
`plugins/nexus/commands/*.md` (generated), the omni twin (generated).

**Acceptance:** one commit contains every behavior change + the MINOR bump + regenerated commands; `claude
plugin validate --strict` passes; CHANGELOG entry enumerates H0, H1–H4, H2b, M4–M7, L8–L9. **Dependency:** Steps 1-9 complete.
**Confidence:** high (owned, scripted flow). **Follow `release-plugin`.**

## Testing Strategy

- **Gate (Step 9):** the scenario suite over crafted hook payloads — the only way to *prove* deny/allow
  without a live run. Covers H2, the H4 SessionStart clear, H2b dev-repo markdown coverage (incl. vendored-
  plugin scoping), the H0 team-lead read-lane (incl. broad-grep deny + absent-persona fail-open), and
  regression-guards invariants 2 & 3. Run via the glob form (MAJOR-2), never the bare-dir form.
- **Live-fire (manual, documented):** developer source-write blocked mid-`analyze`; subagent
  `.pipeline-state` write blocked; reviewer stale-`review.md` re-dispatch — the three cross-cutting #1
  guarantees, run once on a live pipeline by the owner.
- **Validation:** `claude plugin validate --strict` (Step 10).

## KB Impact

None — no `docs/kb/` in this repo. Architecture record: ADR-7 (enforcement) and ADR-9/M7 (state
vocabulary) gain a concrete realization; consider an ADR-13 note for the present⇒strict gate decision
**and the H4 session-scoped state lifecycle** after merge (out of scope for the developer; architect/owner
follow-up).

## Open Questions

None blocking — the four launch decisions are resolved (H2 = present⇒strict/absent⇒open; token findings =
separate follow-up; tier = MINOR; review = critic). Remaining low-confidence points are flagged inline
(Steps 2, 4, 9) for the developer to surface during analyze rather than guess.

## Plan Review (critic — resolved)

Critic Mode-2 review ran (standalone — the architect spawned it directly). Verdict was CHANGES (2 MAJOR, 4
MINOR); all resolved in this plan. Per the message-only critic model (Steps 3 & 5), findings are recorded
**here in the plan**, not in a separate `plan-review.md`:

- **MAJOR-1 (M4):** Step 3 dropped the team-lead consumer-grep → stale done-check validation. → Resolved —
  superseded entirely by the Fokus-parity rewrite (no file relocation; the team-lead greps the labeled
  `review.md` sections).
- **MAJOR-2 (M5):** Step 6 anchored Codex dispatch to a non-existent section (`:153` is mode-selection). →
  Resolved — Step 6 now creates the dispatch subsection.
- **MINOR-1 (H1):** live-fire documented but not required-to-run. → Resolved — Step 9 records the run result.
- **MINOR-2 (H2):** exact-vs-suffix match rule unstated. → Resolved — Step 2 matching-rule note.
- **MINOR-3:** dead `package.json` branch + test file missing from commit list. → Resolved — Steps 9 & 10.
- **MINOR-4 (M4):** `done-check.md` format not asserted. → Moot under Fokus parity (no `done-check.md`; the
  `review.md` section shape is asserted in Step 3 instead).

### Second critic pass — after the H0/H2b additions (CHANGES → all resolved)

A second Mode-2 critic review ran on the revised plan (standalone). Verdict **CHANGES (2 MAJOR, 5 MINOR)** —
all resolved in-place:

- **MAJOR-1 — H0 keyed persona-detection on `.current-agent`, which no hook ever clears** (it would
  false-positive-wedge the main session or no-op in consumers — the exact unhygienic-state class H4 fixes). →
  Resolved — Step 2 now detects via session-keyed `.personas.json[session_id]` + no `agent_type`, with
  absent/disagreeing ⇒ fail-open (ADR-7); Step 9 case 10 adds the absent-persona allow case.
- **MAJOR-2 — Step 9's bare-dir `node --test …/__tests__/` runs ZERO tests on Node v24** (MODULE_NOT_FOUND).
  → Resolved — pinned to the verified glob form `node --test "…/__tests__/*.test.mjs"` in Steps 9 & 10; the
  test run is now Step 10 sequence item 1 (release ships only on green).
- **MINOR-1 — "targeted grep" was intent-based, not machine-checkable.** → Resolved — Step 2 makes the
  `Grep` allow-rule structural (path-allowlist + bounded `output_mode`/context); Step 9 adds a broad-grep
  deny case.
- **MINOR-2 — matcher widening would be dead code after the `:59` early-return; no fast-path stated.** →
  Resolved — Step 2 Files note requires the H0 branch before `:59` and a non-team-lead fast-path; confirms
  the matcher widening is isolated from `guard.js`/`audit-logger.js`.
- **MINOR-3 — H2b marker would misfire on a vendored plugin in a consumer monorepo.** → Resolved — marker
  tightened to root-anchored + `name`∈{nexus,nexus-dotnet}; Step 9 case 9 adds the vendored-plugin allow.
- **MINOR-4 — H0 allow-list diverged from team-lead.md's Read Discipline table (silent on `questions.md`).**
  → Resolved — Step 2 mirrors the table exactly (allow comm-log + `questions.md`; `git diff --stat` is Bash,
  unaffected).
- **MINOR-5 — "ten cases" count + cases 1–8 already in-tree read as all-future.** → Resolved — Step 9 notes
  1–8 already exist (reuse if kept; author all on a clean redo) and reworded the count to "scenarios."

Critic also confirmed (no action): invariants 2 & 3 untouched, ADR-7 fail-open intact (conditional on
MAJOR-1, now fixed), subagent-masquerade correctly blocked by the `agent_type` half, and Steps 1/3/4/5/6/7/8
prose matches the working tree with no regressions. **Note:** the critic again returned terse (verdict only)
and the full findings had to be recovered from its transcript — live M6 recurrence (third time this
feature), reinforcing Step 7.
