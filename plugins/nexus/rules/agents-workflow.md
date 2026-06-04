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
