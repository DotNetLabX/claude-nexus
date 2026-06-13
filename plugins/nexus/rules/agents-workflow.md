# Agent Coordination Protocol

The agent pipeline (8 roles — team-lead, po, architect, developer, reviewer, critic, learner, solo) for feature development. Agents coordinate through file-based handoffs and **hub-and-spoke messaging** — all messages route through the team lead.

## Slug and Path Resolution

The `{slug}` identifies a unit of work and follows these conventions:
- Internal feature: `F{N}-{Name}` — e.g., `F5-SprintSummaryCard`
- Jira epic: `{KEY}-{2-3-words}` — e.g., `PD-5234-shelf-compliance-kpis`
- Jira issue: `{KEY}-{2-3-words}` — e.g., `PD-5226-split-config`
- Ad-hoc: `adhoc-{Name}` — e.g., `adhoc-SyncRefactoring`
- Bug: `BUG-{N}-{name}` — e.g., `BUG-1-bug-count-zero`
- Gap: `GAP-{N}-{name}` — e.g., `GAP-3-sub-team-management-ui`

The team lead or PO assigns the slug at the start of each pipeline run and passes it to all downstream agents. Agents never derive the slug — they use exactly what was passed.

Standard paths:
```
docs/backlog.md                              ← feature sequence, dependencies, status
docs/specs/{slug}/
  definition/   ← spec.md (or epic.md / bug.md), help.tooltips.md, images
  delivery/     ← plan.md, implementation.md, review.md, lessons.md, summary.md, communication-log.md
```

For a Jira issue nested under an epic:
```
docs/specs/{epic-slug}/{issue-slug}/definition/
docs/specs/{epic-slug}/{issue-slug}/delivery/
```
Ad-hoc work has no `definition/` folder — only `delivery/`.

`communication-log.md` is the **canonical filename** for the inter-agent message log. A consumer project preferring another name is their concern — the plugin always uses this name.

## Pipeline State (`.claude/.pipeline-state`)

The team lead is the **sole writer** of `.claude/.pipeline-state`. Every phase transition writes the next token before the spawn or resume. The `pipeline-gate` hook reads this file as a **best-effort tripwire** — it can deny a *foreground* (main-session) write under the wrong token, but a **background subagent's deny is not honored by the platform** (ADR-13), so it does **not** reliably stop a backgrounded pipeline agent. The real enforcement of the analyze→stop boundary is the agent's own hard-stop rule (it asks before assuming — see "All Agents") plus the team lead's verify-and-intervene. No pipeline subagent may write this file — a subagent's write cannot be blocked (ADR-13) but is detected by the boundary detector and logged to `.claude/audit/violations.log`.

**Complete vocabulary (these exact tokens):**

| `.pipeline-state` value | Phase meaning | Written by team-lead before |
|---|---|---|
| *(absent / file missing)* | No pipeline active, solo, or leaderless run | — |
| `po:shape` | PO shaping the spec | Spawning PO |
| `architect:analyze` | Architect Phase-1 analyze-and-stop | Spawning architect Phase 1 |
| `architect:plan` | Architect Phase-2 writing the plan | Resuming architect Phase 2 |
| `architect:donecheck` | Architect Step-1 done check | Resuming architect for done check |
| `critic:review` | Critic reviewing spec or plan | Spawning critic |
| `developer:analyze` | Developer Phase-1 analyze-and-stop | Spawning developer Phase 1 |
| `developer:implement` | Developer Phase-2 implementing | Resuming developer Phase 2 |
| `reviewer:review` | Reviewer Step-2 code review | Spawning reviewer |
| `learner:process` | Learner consolidating lessons | Spawning learner |

**Gate contract (source of truth is the gate decision table in `pipeline-gate.js`) — these describe the gate's *decision*; it is only *enforced* against a foreground writer (ADR-13):**
- A developer source-write is allowed **only** under `developer:implement`; any other present token, or an unrecognized token, denies it — **but a background developer subagent's write is not actually blocked** (the deny is dropped), so this is a tripwire, not a guarantee.
- A plan.md write is blocked under any token ending in `:analyze` (same foreground-only caveat).
- An absent file fails open (solo / leaderless / unattended runs are never wedged).

**The gate keys on the token, not on conversational intent — three recurring failure modes:**
- **Inline user override mid-session.** When the user inline-approves a phase transition ("skip the checkpoint, write the plan"), the agent's `.pipeline-state` still says `…:analyze`, so the gate *correctly* blocks the write. The fix is **not** an agent workaround — it is the **team lead advancing the token to the next phase before the agent proceeds**. The team lead is the sole writer; a user "go" is the team lead's cue to write `architect:plan` (or `developer:implement`), then resume the agent.
- **No self-advance / no bypass.** A pipeline subagent must **never** advance its own phase — not by writing `.claude/.pipeline-state` (team-lead-owned; a subagent write is detected and logged by the boundary detector), not via the side doors a faithful agent reaches for when blocked (`printf …> .claude/.pipeline-state` in Bash, or writing `plan-draft.md` and `mv`-ing it to `plan.md`), and not by **spawning other agents to run the next phases** (the hard rule under All Agents). These defeat the checkpoints silently. If blocked, report the checkpoint and let the team lead transition — do not engineer around the gate.
- **Foreign-repo deliverables are a blind spot.** The gate watches the working tree at `CLAUDE_PROJECT_DIR`. For a pass whose deliverables land in a **separate repo** (e.g. editing the Nexus plugin source from a consumer project), the gate sees no plan/source writes in the repo it watches and cannot enforce the analyze→implement boundary at all — it fails open. The team lead must enforce the checkpoint **manually** for such passes (don't rely on the gate), and the plan must headline the foreign deliverable path so the done-check and review read the right repo. *(Making the gate two-repo-aware — watch a plan-declared foreign path, or honor a developer-written phase marker — is a tracked `pipeline-gate.js` improvement, not yet implemented.)*

**Session lifecycle:** `.pipeline-state` is **not** auto-cleared on SessionStart — `restore-agent.js` manages only the persona registry (`.personas.json`), never this file. The team lead owns the token: it overwrites the file to the correct phase before each spawn/resume, so a stale token from a prior run is replaced before it matters. A stale or absent token only ever fails the gate **open** (it never wedges a run).

## Communication Model: Hub-and-Spoke

All agent messages go through the team lead. Agents never message each other directly.

**Why:** The team lead triages all communication, intercepts decisions that need user approval, and prevents agents from silently overriding user requirements.

**How agents send messages:** Address the team lead, specifying the intended recipient and content:
```
To team-lead: "For {recipient}: {message content}"
```

**How the team lead dispatches:** Read the message, decide:
1. **Routine handoff** (e.g., "ready for review") → forward to recipient.
2. **Decision that contradicts user requirements or changes scope** → ask the user first, then forward the answer.
3. **Question that needs user input** → relay to user, wait for answer, forward to agent.

## All Agents

- **Instructions from the team lead are user decisions.** Instructions relayed through the team lead represent user decisions already made. Agents may flag concerns or recommend alternatives *before* the decision, but once an instruction arrives, they execute it — they don't substitute their own judgment because they consider it more efficient or equivalent.
- **Rules go in files, not memory.** When a reusable rule or convention is identified, capture it in the appropriate rule or agent file — not in memory. Memory is for context that doesn't fit in rule files (user preferences, project state, external references). This applies to every agent, not just the team lead.
- **Never assume past an open question — stop and ask (hard rule).** Any ambiguity, missing input, or unmade decision means you STOP, surface it (write it to `questions.md` and report it), and wait — before writing a plan, code, or any artifact that bakes in the assumption. "I'll assume X and proceed" is a defect, not initiative. In a team, route the question through the team lead; standalone, ask the user. A phase with **no** open question may proceed; a phase with an **unsurfaced** one may not. This is every agent's own rule, and it is also hard-coded in each agent file — per ADR-2 a spawned subagent sees only its own file, so the rule lives in both places. Corollary: an answer the user did not personally give is **not** a user answer — record a proceed-default as `presumed (proceed-default), not user-confirmed`, never under a user-answered heading.
- **Your durable artifact is your primary deliverable, not your inline message (hard rule).** Under background spawn the inline completion notice is partial by design (ADR-12/16); the record of record is the file you write (`plan.md`, `review.md`, `implementation.md`, `questions.md`, `lessons.md`, `summary.md`). Write the file **first**, then report — never return a verdict or findings inline-only with no file behind them. A missing artifact is an incomplete result, not a result delivered by message.
- **Never author another agent's artifact or sign as a role you are not (hard rule).** Each artifact has one owner: the developer writes `implementation.md`; the architect writes the Step-1 done-check in `review.md`; the reviewer writes the Step-2 review in `review.md`; the team lead writes `summary.md` and owns commits + `.claude/.pipeline-state`. Producing a verdict for a role that isn't yours — or signing a section as another agent — fabricates an independent gate and is the most severe pipeline breach. If a gate hasn't run, **report it; never simulate it.** `lessons.md` is the one shared artifact: each role **appends under its own `## {Role} Lessons` heading** and never rewrites the file header or another role's sections.
- **Never spawn a pipeline-role agent (hard rule).** Advancing the pipeline by spawning po/architect/developer/reviewer/critic/learner/team-lead — or another instance of your own role — belongs to the team lead alone. The platform may *let* a subagent spawn agents; that is not permission. Commissioning a correctly-typed agent to produce a gate is the same breach as authoring the gate yourself (ADR-18/ADR-21): the result is an unsupervised pipeline — no checkpoints, no model config, gates nobody triaged. When your phase ends, hand back and STOP. The only sanctioned spawns are the ones your own agent file names: research helpers (Explore) for discovery, and the critic where your file directs it in standalone mode. A subagent's pipeline-role spawn is detected by the boundary detector and logged to `.claude/audit/violations.log`.
- **Your FINAL message is the deliverable — never an acknowledgement after it (hard rule).** The spawner reads your last message; under background spawn anything before it can be stranded (the measured shape: a real handback followed by "Done." / "Holding for the go-ahead." / "Acknowledged."). End every turn — the first return AND every resumed turn — with the handback itself: verdict, findings, questions, summary. If there is nothing substantive to add after the deliverable, add nothing.
- **A placeholder return is a non-result.** A dispatched subagent's first reply must carry its findings — a bare acknowledgement ("Ready.", "Standing by.", "Done.") is a non-result. The dispatcher re-dispatches **once** with an explicit "read the files and return findings — do not acknowledge"; if it placeholders again, do the bounded work yourself instead of burning more dispatch cycles. Never treat a placeholder as completed work.
- **Research-helper dispatch contract.** When spawning a research helper (Explore, general-purpose): point it at inputs **by file path** — never paste bulk content into the prompt — and require a structured return: counts + per-item one-liners + surprises, ~300 words ("return findings, not acknowledgements"). A shaped dispatch is the cheap half of the placeholder rule above: it prevents both the empty return and the unusable wall-of-text one.
- **Tag every user-facing recommendation with a confidence label (hard rule).** When you put a question or choice to the user — directly (`AskUserQuestion`), as a `To: user` question in `questions.md`, or as a recommendation you hand the team lead to relay — state your recommended answer and tag it **Confidence: high | medium | low** + a one-line why. **high** = a clear basis (spec, ADR/architecture, an existing pattern, strong evidence) points one way — safe to proceed on if unanswered; **medium** = a reasonable lean with a real trade-off; **low** = weak basis or a genuine toss-up — you especially want the human's call. The label tells the user which defaults to rubber-stamp and which need real thought. In `AskUserQuestion`, put it in the recommended option's description; in `questions.md`, use the Recommendation/Confidence fields (questions-format). The team lead preserves an agent's confidence when relaying, and adds its own when it asks. **A clear basis means a *confirmed* basis — a belief is not a basis.** Confidence is **lowered by an unconfirmed load-bearing assumption**: a verdict or recommendation resting on an assumption you could not confirm is **not High**, however sure it feels, and that assumption is a **research target, not a basis** — confirm it (look it up, test it) before you let it carry a High. (This is the failure that turns "X is unsupported" — never checked — into a confident wrong verdict.)
- **Offer research before a cold answer.** When a question is headed to the user and targeted research (codebase, KB, existing specs/notes) could materially sharpen the question or your recommendation, say so alongside it: "I can research {X} first — want me to, or do you already have a direction?" This guards both failure modes: researching silently when the user already knows the answer, and forcing a cold answer when researched context is cheap. Offer only when research would genuinely change the question — a reflexive offer on every question is noise. (Codebase facts are never user questions — look them up.) See research-before-asking.md for the full Research & Confidence Protocol — the depth dial (cheap/local → resolve silently; expensive/external → offer with a cost estimate), capture-before-surface, and the **fact-shaped unknown** (a fact you can't resolve from current context → research is the default before a verdict).

## Message Size Contract

Keep agent outputs focused. Content goes in files; messages are notifications with summaries.

| Output type | Max length | Rule |
|-------------|-----------|------|
| Analysis outputs (Phase 1) | ~500 words | Write detailed findings to questions.md or a notes file; message is the summary |
| Handoff messages | ~300 words | One paragraph of what was done + one paragraph of what's next |
| Checkpoint reports | Structured format | See the Checkpoint Report Format section in each pipeline agent's own file (architect/developer/team-lead) |

**Write first, message second** — this applies to ALL artifacts, not just questions. Implementation details go in implementation.md, review findings go in review.md, questions go in questions.md. Messages are notifications.

## Read Discipline (all agents)

The pipeline is sequential and most files have one writer — within one **round** (a spawn→handback or resume→handback turn), nothing changes a file except you. Measured token waste comes overwhelmingly from re-reads (one run: an agent re-read its own plan.md ×35, ~2.5MB through context).

- **Read each file at most once per round.** After the first read it is in-context state — work from it. The Edit tool needs exactly **one** prior Read of a file, never one per edit.
- **Never re-read a file to "verify" your own Write/Edit** — the tool errors if the change failed.
- **The artifact you are authoring is the file you least need to re-read.** You wrote it; edit targeted sections from context.
- **Sanctioned re-reads (only these):** (1) after a context compaction — one re-read; (2) a file another agent changed since your last round (their fix landed between rounds — that's the new round's first read); (3) chunked first reads of a large file (offset/limit over distinct ranges is ONE logical read); (4) checking your own recent edit's surroundings — use an offset read of the changed range, not a whole-file re-read.
- **Role-input boundary:** read your role's inputs plus what your dispatch names — nothing else. `communication-log.md` is the team lead's; other roles' artifacts you don't consume are not yours to browse. (Reads are not ownership breaches, but they are paid context.)

The read-tracker hook nudges on a same-round repeat read and logs ≥3 repeats of the same file to `.claude/audit/violations.log` for the team lead's checkpoint review.

## Audit Substrate (`.claude/audit/`) — detect-then-gate

Two enforcement breaches recur and are **not preventable at the prompt level**: a background subagent's PreToolUse deny is dropped (ADR-13), and you cannot force an agent to invoke a `Skill`. So both are converted from "an agent must choose to behave" into **detect-then-gate** — log the fact deterministically, and make a gate Fail on the logged fact. Two always-on, observe-only hooks write two logs (neither is config-gated; both are zero-footprint until they have something to record, and fail silent):

| Log | Written by | Records | Consumed by |
|---|---|---|---|
| `.claude/audit/violations.log` | `boundary-detector.js` (PostToolUse `Write\|Edit\|MultiEdit\|Agent\|Task\|Bash`) + `read-tracker.js` (≥3 same-round re-reads) | A subagent breach the gate cannot block: an ownership write (a role writing another role's artifact / `.pipeline-state`), a **pipeline-role spawn** by a subagent (ADR-21), a **state-changing git write** by a subagent (`commit`/`add`/`reset`/`push`/`stash`/`restore`/`switch` — anchored-regex, `git commit-graph` and read-only git excluded; ADR-18/20), and re-read offenders | The **team lead** at every verify point → the deterministic fabrication void-and-rerun matrix (team-lead.md, Enforcing the Rules): void the fabricated *gate*, re-run the real one, keep correct *code*; unwind a rogue commit. Backstopped by a `git log` author check (the guaranteed catch for any commit not authored by the team lead, however made). |
| `.claude/audit/skill-invocations.log` | `skill-tracker.js` (PostToolUse `Skill`) | One `{ts, agent, skill, token, session}` line per real skill invocation — the platform-logged fact (`tool_name === 'Skill'`, `tool_input.skill` = name), round-scoped by the `.pipeline-state` token | The **architect** done-check (Step 1): the **authoritative** source for the skill-conformance check. A plan-mapped non-`None` skill absent from the log (no documented deviation) Fails; a `## Skills Used` self-report not corroborated by the log is a fabrication → Fail; a missing `## Skills Used` section Fails structurally. All-`None` plans never Fail on an empty log. |

Neither breach is preventable by hook on a background subagent — the rule lives in the agent (ADR-14), the log makes the breach deterministically visible, and the gate Fails on the logged fact. Recoverable breaches (a fabricated gate over correct code) re-run the real gate; the unrecoverable one (a skipped skill — the code is already written) bounces the developer for a redo.

## Agents

| Agent | Scope | Managed by |
|-------|-------|------------|
| team-lead | Pipeline orchestration, message routing, commit protocol | user |
| architect | Plans, Step 1 review (done check), question answers, escalation decisions | team lead |
| po | Feature shaping, spec writing, question answering | team lead |
| critic | Cross-reference review of specs, plans, and learner promotions | Current hub: PO/architect/learner when standalone; team lead in team mode |
| developer | Implementation, implementation.md, questions.md | team lead |
| reviewer | Step 2 review (code review), severity-rated conformance checks | team lead |
| learner | Lessons consolidation, pattern promotion to system files | team lead |
| solo | Small fixes and scoped changes (1-3 files) | user |

Agent models are baked into each agent's definition frontmatter — never override them.

## Pipeline Modes

The pipeline is not a rigid sequence — ceremony scales with uncertainty. Multiple entry points and team configurations exist.

### Entry Points

| Entry Point | First Agent | What's Skipped | Use Case |
|-------------|------------|----------------|----------|
| `be solo` | solo | Everything — no pipeline, no plan/review | Bug fixes, 1-3 file changes |
| `be architect` | architect | PO, spec, team orchestration | Refactoring plans, tech debt, ad-hoc analysis |
| Team lead (existing plan) | developer | PO + architect planning | Plan already written via `be architect` |
| Team lead (full pipeline) | PO or architect | Nothing | Complex features needing discovery and alignment |

### Team Configurations

| Config | Agents | When |
|--------|--------|------|
| **Fast** | architect + developer (developer self-reviews via the review-format checklist → `## Self-Review` in implementation.md) | Well-understood patterns, internal tooling |
| **Standard** | architect + developer + reviewer | Production features, team alignment needed |
| **Standard+Codex** | architect + developer + reviewer + Codex (parallel independent cross-check, first review round only) | Complex analytics, full-stack changes, non-trivial filtering/pagination — when Codex is available |

### Key Principles

- PO phase is optional — architect can plan directly from incomplete tickets
- Critic is always optional with confirmation — never forced
- Solo handles its own scope — small improvements never enter the pipeline
- Known patterns get less process; novel work gets more

## Cycle Caps

| Loop | Max | Escalation |
|------|-----|------------|
| Reviewer ↔ Developer fix cycle | 3 | → Architect |
| Developer questions (same area) | 3 | → Human |
| Architect escalation resolution | 1 | → Human |

After escalation to human, agents STOP and wait.

## Artifact Formats

Nexus provides each artifact format as a skill or template. Agents reference the relevant
skill when producing an artifact:

| Artifact | Provided by |
|----------|-------------|
| Plan | `create-implementation-plan` skill |
| Implementation | `implementation-format` skill |
| Summary | `summary-format` skill |
| Questions | `questions-format` skill |
| Lessons | `lessons-format` skill |
| Review | `review-format` skill |

## Skill Authority

Nexus skills are the authoritative source for patterns.

- **Skill exists, project has what it needs:** Follow the skill.
- **Skill exists, project missing something it references:** Build it. Escalate to architect only if scope seems too large.
- **No matching skill:** Architect may inline snippets. Log the missing skill in lessons.md.
