# Workflow Core

The always-on kernel of the coordination protocol: **imperatives and pointers only.** The full
protocol — rationale, matrices, worked detail — lives in `rules/on-demand/agents-workflow.md`; the
Read-Index below resolves its path. Where a line names another file, that file is the owner: read
it, don't reconstruct it.

## Slug, lane, paths

- **Slug forms:** `F{N}-{Name}` · `{KEY}-{2-3-words}` (tracker item) · `BUG-{N}-{name}` · `GAP-{N}-{name}` · `adhoc-{Name}` (**solo-only**).
- **Lane rule:** work shaped with the PO or designed with the architect is a **feature** — `F{N}` slug plus a `docs/backlog.md` row. Re-slug an `adhoc-*` that outgrows solo *before* the pipeline proceeds. Team lead or PO assigns it and passes it down — **never derive your own**.
- **Paths:** under `docs/specs/{slug}/`, all `.md` — `definition/`: spec | epic | bug, help.tooltips · `delivery/`: plan, implementation, review, questions, lessons, summary, communication-log. Nested issue: `docs/specs/{epic-slug}/{issue-slug}/…`. Ad-hoc: `delivery/` only.

## Communication

- **Hub-and-spoke: every agent message routes through the team lead**, never agent-to-agent — address it: `To team-lead: "For {recipient}: {content}"`.
- **Cycle caps** — reviewer↔developer fix cycles **3** → architect; developer questions on one area **3** → human; architect escalation **1** → human; critic rounds **3**, rising floor, no owner ask. After a human escalation: STOP and wait.

## Hard rules (every agent)

- **Never assume past an open question.** Ambiguity, a missing input, an unmade decision → STOP, write it to `questions.md`, report it, and wait. "I'll assume X and proceed" is a defect, not initiative. An answer the user did not personally give is recorded `presumed (proceed-default), not user-confirmed`.
- **Never advance the pipeline yourself.** `.claude/.pipeline-state` is team-lead-owned — never write it, never route around a blocked gate, and never spawn a pipeline-role agent to run the next phase. Phase end = hand back and STOP. *(Team lead alone: the token and the spawns are its job.)*
- **Never author another agent's artifact or sign as a role you are not.** One owner per artifact. The shared file (`lessons.md`): add your own entries, never rewrite another role's. If a gate hasn't run, report it; never simulate it.
- **Your durable artifact is your primary deliverable** — write the file first, then report. A verdict returned inline with no file behind it is an incomplete result.
- **Arrival order is untrusted.** Key every decision on agentId + artifact state, never on message arrival order.
- **Your FINAL message is the deliverable** — end every turn with the handback itself; never an acknowledgement after it.
- **Tag every user-facing recommendation `Confidence: high | medium | low` + a one-line why.** An unconfirmed load-bearing assumption is a research target, not a basis — it cannot carry a High.

## Read discipline

- **Read each file at most once per round** (spawn/resume → handback). After the first read it is in-context state; Edit needs exactly one prior Read, never one per edit. Never re-read to "verify" your own Write/Edit.
- **Section-target large or multi-section files:** grep `'^#'` for the heading, then `Read` with `offset/limit`. Whole-read is the fallback when no heading matches or the heading is ambiguous.

## Skill and knowledge authority

- **Skills are the authoritative source for patterns.** A skill exists → follow it. Missing → reuse what the repo has, else build once. No matching skill → log the gap in `lessons.md` under `## Skill Gaps`.
- **A reported issue is an example of a class:** fix every instance (grep the pattern) *and* the root cause — the skill, convention, or process that allowed it — not just the cited symptom. (→ engineering-discipline.md § Problem-class rule)
- **Artifact-first status (owner directive 2026-08-18):** feature/pipeline/deploy status is answered from the repo's artifacts (`docs/backlog.md`, `docs/specs/{slug}/delivery/summary.md`, ADR, deploy runbook), re-read per question — never from session memory, and never stored there. Memory keeps ops recipes, environment facts, credential pointers, preferences. No pipeline artifacts → memory may fill the gap. (→ status-table-format.md § Status questions (the specific case))
- **Plugin-bound changes route through `docs/plugin-feedback/` (ADR-1)** — rules prose included; never edit plugin cache or source from a consuming repo. The main session commits the file it filed, by path, that turn.
- **Research before a cold answer:** research an unknown fact (`rules/on-demand/research-before-asking.md`). Settle a works-or-breaks claim by the smallest permitted run, another system's behaviour by its code — else answer per case, marked unverified.
