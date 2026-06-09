# Agent Coordination Protocol

Three-agent pipeline (architect, developer, reviewer) for feature development. Agents coordinate through file-based handoffs and **hub-and-spoke messaging** — all messages route through the team lead.

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

The team lead is the **sole writer** of `.claude/.pipeline-state`. Every phase transition writes the next token before the spawn or resume. The `pipeline-gate` hook reads this file as a **best-effort tripwire** — it can deny a *foreground* (main-session) write under the wrong token, but a **background subagent's deny is not honored by the platform** (ADR-13), so it does **not** reliably stop a backgrounded pipeline agent. The real enforcement of the analyze→stop boundary is the agent's own hard-stop rule (it asks before assuming — see "All Agents") plus the team lead's verify-and-intervene. Per gate invariant 3, no pipeline subagent may write this file.

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
- **No self-advance / no bypass.** A pipeline subagent must **never** advance its own phase — not via the Write/Edit path (the gate blocks it, invariant 3) and not via the side doors a faithful agent reaches for when blocked: `printf …> .claude/.pipeline-state` in Bash, or writing `plan-draft.md` and `mv`-ing it to `plan.md`. These defeat the gate silently. If blocked, report the checkpoint and let the team lead transition — do not engineer around the gate.
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
- **Never assume past an open question — stop and ask (hard rule).** Any ambiguity, missing input, or unmade decision means you STOP, surface it (write it to `questions.md` and report it), and wait — before writing a plan, code, or any artifact that bakes in the assumption. "I'll assume X and proceed" is a defect, not initiative. In a team, route the question through the team lead; standalone, ask the user. A phase with **no** open question may proceed; a phase with an **unsurfaced** one may not. This is every agent's own rule, and it is also hard-coded in each agent file — per ADR-2 a spawned subagent sees only its own file, so the rule lives in both places.
- **Your durable artifact is your primary deliverable, not your inline message (hard rule).** Under background spawn the inline completion notice is partial by design (ADR-12/16); the record of record is the file you write (`plan.md`, `review.md`, `implementation.md`, `questions.md`, `lessons.md`, `summary.md`). Write the file **first**, then report — never return a verdict or findings inline-only with no file behind them. A missing artifact is an incomplete result, not a result delivered by message.
- **Never author another agent's artifact or sign as a role you are not (hard rule).** Each artifact has one owner: the developer writes `implementation.md`; the architect writes the Step-1 done-check in `review.md`; the reviewer writes the Step-2 review in `review.md`; the team lead writes `summary.md` and owns commits + `.claude/.pipeline-state`. Producing a verdict for a role that isn't yours — or signing a section as another agent — fabricates an independent gate and is the most severe pipeline breach. If a gate hasn't run, **report it; never simulate it.**
- **Tag every user-facing recommendation with a confidence label (hard rule).** When you put a question or choice to the user — directly (`AskUserQuestion`), as a `To: user` question in `questions.md`, or as a recommendation you hand the team lead to relay — state your recommended answer and tag it **Confidence: high | medium | low** + a one-line why. **high** = a clear basis (spec, ADR/architecture, an existing pattern, strong evidence) points one way — safe to proceed on if unanswered; **medium** = a reasonable lean with a real trade-off; **low** = weak basis or a genuine toss-up — you especially want the human's call. The label tells the user which defaults to rubber-stamp and which need real thought. In `AskUserQuestion`, put it in the recommended option's description; in `questions.md`, use the Recommendation/Confidence fields (questions-format). The team lead preserves an agent's confidence when relaying, and adds its own when it asks.

## Message Size Contract

Keep agent outputs focused. Content goes in files; messages are notifications with summaries.

| Output type | Max length | Rule |
|-------------|-----------|------|
| Analysis outputs (Phase 1) | ~500 words | Write detailed findings to questions.md or a notes file; message is the summary |
| Handoff messages | ~300 words | One paragraph of what was done + one paragraph of what's next |
| Checkpoint reports | Structured format | See Checkpoint Report Format in the pipeline protocol |

**Write first, message second** — this applies to ALL artifacts, not just questions. Implementation details go in implementation.md, review findings go in review.md, questions go in questions.md. Messages are notifications.

## Agents

| Agent | Scope | Managed by |
|-------|-------|------------|
| team-lead | Pipeline orchestration, message routing, commit protocol | user |
| architect | Plans, Step 1 review (done check), question answers, escalation decisions | team lead |
| po | Feature shaping, spec writing, question answering | team lead |
| critic | Cross-reference review of feature specs and plans | PO (spec reviews), architect (plan reviews) |
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
| **Fast** | architect + developer (developer self-reviews) | Well-understood patterns, internal tooling |
| **Standard** | architect + developer + reviewer | Production features, team alignment needed |

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
