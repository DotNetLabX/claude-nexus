# adhoc-PipelineGatesHardening — Communication Log

**Branch:** main
**Step:** architect:plan (revise per critic REVISE)
**Cycle:** 0/3
**Team Mode:** standard+codex
**Review Mode:** critic (code-grounded)
**Architect ID:** a81d5aff64955d4e8 (revise spawn; frontmatter model — not in nexus-agents.json)
**Developer ID:** not spawned
**Reviewer ID:** not spawned
**Plan Steps Completed / Remaining:** [] / [1,2,3,4,5,6,7,8,9]
**Questions Resolved:** [launch: review-mode=critic (user), team-mode=standard+codex (user)]

---

## Baseline (pre-existing state at launch)

- `violations.log` carries **one pre-existing line** dated `2026-06-12T21:40:33Z` — a `developer` subagent
  spawned `nexus:architect` (ADR-21 delegated-advancement) in a **prior run** (before this plan was written
  at 2026-06-13 16:20). Recorded as baseline; NOT attributable to this run. Any new line after launch is a
  triage item.
- `plan.md` exists (architect, prior session). Handback in §Plan Review: "plan ready — code-grounded critic
  review owed on plan.md." No spec.md (ad-hoc). Open Questions: None.

## Message Log

| # | From → To | Phase | Message | Problem |
|---|-----------|-------|---------|---------|
| 1 | user → TL | launch | Launch adhoc-PipelineGatesHardening. Review=critic(code-grounded), Team=standard+codex. | — |
| 2 | TL → critic | critic:review | Spawn Mode 2 (code-grounded) plan review on plan.md vs cited sources + ADR register + hook scripts on disk. agentId=ad1b412d45f589114 (opus). | — |

| 3 | critic → TL | critic:review | Completion returned only "Done. Reviewed: plan.md" — findings stranded. | thin deliverable |
| 4 | TL → critic | critic:review | Recovery: TaskOutput thin; salvage by agentId confirmed NO findings text in transcript; .output (tasks/) is 0 bytes (real transcript = subagents/agent-{id}.jsonl). Re-asked live agent (leg 4) to emit findings in reply. | — |
| 5 | critic → TL | critic:review | 2nd completion again thin ("Complete."); direct transcript probe found the real deliverable mid-stream (block #20, 21k chars). Persisted verbatim to review-critic.md. **Verdict: REVISE** (1 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW + gaps). | salvage heuristic beaten by fenced closer — see RT-2 |
| 6 | TL → user | critic:review | Relayed critic review verbatim. Flagged CRITICAL-1 (part of Gate A already shipped → re-check scope after re-ground). No user-decision reversed → auto-route to architect. | — |
| 7 | TL → architect | architect:plan | Revise plan per review-critic.md: re-ground Steps 3-5 vs tree, fix CRITICAL-1 + HIGH-2/3 (blocking) + MEDIUMs + gaps, quantify remaining Gate-A delta, keep ADR-24 proposed. agentId=a81d5aff64955d4e8. | — |

## Runtime / Plugin Issues Log

- **RT-1 — Critic thin deliverable (critic:review).** Critic ad1b412d45f589114 ran the full review (23
  tool-uses, 147k tokens) but emitted ONLY "Done. Reviewed: plan.md" as its final assistant text — the
  structured findings were never produced as text. Recovery walked the full Relay Contract order: artifact
  (n/a — critic writes none by design), TaskOutput (thin), salvage-transcript (confirmed no findings text
  across the whole transcript — not a lifecycle-closer strand, the deliverable was genuinely never emitted),
  then re-ask the live agent (leg 4). Note: the `tasks/{id}.output` file was **0 bytes**; the real transcript
  is `~/.claude/projects/{slug}/{session}/subagents/agent-{id}.jsonl` (salvage's by-agentId search found it).
  For the learner: a read-only critic that can't write a file has no artifact fallback, so an inline strand
  is only recoverable by transcript-salvage or re-ask — and salvage only helps if the findings were actually
  emitted as text. Worth considering whether the critic should be told its reply is the sole deliverable more
  forcefully, or be given a scratch file to write findings to.
- **RT-2 — salvage-transcript heuristic beaten by a fenced lifecycle closer (critic:review, 2nd pass).**
  On the re-ask, the critic DID emit the full review (transcript block #20, 21,109 chars, titled
  "# Pipeline Gates Hardening — Critic Review"), but then capped the run with several multi-line
  "Complete." / "Done." closers that each contain a fenced `Reviewed:` line. salvage's
  `looksLikeDeliverable = last.includes('\n') || len>=400` treats any multi-line final text as the
  deliverable, so the newline inside the fenced closer defeats BOTH the stub filter and the
  longest-recent fallback → salvage returned the 85-char closer, not the 21k-char review. Recovered by
  probing the real transcript directly and selecting the largest assistant text block. For the learner:
  salvage should prefer the LONGEST recent substantive block when the last is short-but-multiline (a
  fenced closer), or strip trailing fence-only closers before the looks-like-deliverable test. Both RT-1
  and RT-2 are live findings on the very surfaces this pass hardens.
