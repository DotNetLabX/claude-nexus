# adhoc-PipelineGatesHardening — Communication Log

**Branch:** main
**Step:** done (Step 2 APPROVED+GO cycle 1/3; released 1.8.0; implement commit made)
**Cycle:** 1/3 (approved first round)
**Team Mode:** standard+codex
**Review Mode:** critic (code-grounded)
**Architect ID:** a81d5aff64955d4e8 (revise) → ab5dac4f96d11c1ba (Step-1 done-check PASS, all 8 Implemented, 0 Missing)
**Developer ID:** ae16324f917cdda00 (Phase-1 analyze) → aa3b24ab6878d8e90 (Phase-2 implement, FRESH opus spawn — resume would downgrade model)
**Reviewer ID:** af8d0f445276cd7dc (Step 2)  |  **Codex ID:** a72dfa861d62aff26 (review-codex.md, first round only)
**Plan Steps Completed / Remaining:** [] / [1,2,3,4,5,6,7,8,9]
**Plan approved:** yes — auto-approved after critic REVISE → architect re-ground (verdict ready); committed f60abb3
**Questions Resolved:** [launch: review-mode=critic (user), team-mode=standard+codex (user)]
**Phase-2 model note:** developer Phase-2 (implement) must re-spawn FRESH on opus with context handoff — a SendMessage resume falls back to frontmatter (RUNTIME caveat); this is model-critical (regex/hook work).

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
| 8 | architect → TL | architect:plan | Handback stranded inline ("Complete."); recovered via direct transcript probe (block #35/#36). Verdict: READY. All blockers + MEDIUM/LOW/gaps resolved, re-grounded vs tree; self-verify caught own regex defect (commit-graph). Delta table confirms MINOR. One deferred: platform tool_name → Step-2 live-verify gate. | thin deliverable (RT-1/RT-2 pattern) |
| 9 | TL → user | architect:plan | Relayed architect handback + delta table verbatim. Validated verdict (ready, self-consistent). Auto-approved plan; committed f60abb3 (scoped). Decided NOT to re-run critic (reasoned). | — |
| 10 | TL → developer | developer:analyze | Phase-1 spawn: `Analyze adhoc-PipelineGatesHardening.` agentId=ae16324f917cdda00 (opus). | — |
| 11 | developer → TL | developer:analyze | Phase-1 ALL CLEAR. 3 resolved observations in questions.md (Q1 stale "11"→10 tests; Q2 baseline 116/117, pre-existing nexus-dotnet frontmatter fail out-of-scope; Q3 reds direct-to-final-tier). None blocking; none reverse decision/scope/step. | — |
| 12 | TL → user | developer:analyze | Relayed Phase-1 verbatim. Flagged Q2 pre-existing nexus-dotnet red for transparency. Resumed Phase-2 directly (all clear). | — |
| 13 | TL → developer | developer:implement | Phase-2 FRESH opus spawn (resume would downgrade model). Scope: Steps 1–8 only (Step 9 release = TL). Honor Q1-Q3; verify platform Skill tool_name (Step 2 live-verify); use architect's verified Step-5 regex; write implementation.md incl. `## Skills Used`; no commits. agentId=aa3b24ab6878d8e90. | — |
| 14 | developer → TL | developer:implement | Steps 1–8 COMPLETE (handback via transcript probe, blocks #70-71). 127/128 suite (1 = pre-existing nexus-dotnet, Q2); 11 new tests green. **Platform tool_name live-verify RESOLVED** = `Skill` (20 real transcripts). Enforcement clean: HEAD=f60abb3 (no dev commit), violations.log baseline-only, scope exact, plugin.json/CHANGELOG untouched (Step 9=TL). | thin inline (transcript-probe recovery) |
| 15 | TL → user | developer:implement | Relayed dev handback verbatim + validation (enforcement clean, live-verify resolved). | — |
| 16 | TL → architect | architect:donecheck | Step-1 done-check spawn (fresh): verify Steps 1–8 vs implementation.md, write review.md `## Step 1` + lessons; Step 9 absence not a Fail; all-None skill-conformance exemption. agentId=ab5dac4f96d11c1ba. | — |
| 17 | architect → TL | architect:donecheck | Done-check **PASS** (read from review.md `## Step 1`; inline stranded). All 8 Implemented, 0 Missing → verdict valid. Pre-commitment predictions on 3 defect-spots all cleared. 127/128. ADR-24 owner-owed gate disclosed. | thin inline |
| 18 | TL → user | architect:donecheck | Relayed done-check PASS table + verdict verbatim. Validated (PASS, no Missing → valid). | — |
| 19 | TL → reviewer ‖ codex | reviewer:review | Standard+Codex Step 2: dispatched BOTH in parallel, independent, same implementation. Reviewer→review.md `## Step 2`; Codex→review-codex.md (GO/NO-GO). Codex aimed at Step-5 regex + hook plumbing. reviewer=af8d0f445276cd7dc, codex=a72dfa861d62aff26. | — |
| 20 | reviewer → TL | reviewer:review | Step 2 **APPROVED** (validated vs review.md `## Step 2`: only 1 LOW = implementation.md:169 phrasing nit; 0 CRIT/HIGH/MED → valid approval). 5 pre-commitment predictions cleared; regex case table 21/21 fresh. | — |
| 21 | TL → user | reviewer:review | Relayed reviewer APPROVED + the 1 LOW. Checkpoint HELD OPEN pending Codex (Standard+Codex merges both). | awaiting codex a72dfa861d62aff26 |
| 22 | codex → TL | reviewer:review | **GO** (2 WARN best-effort: git -C, aliases — covered by Step-6 git log backstop by design; 1 INFO non-issue). Independently confirmed bash -c wrapping IS caught, &&-chains caught, commit-graph excluded, branch position, 17/17 skill-tracker + 9/9 hooks.json. review-codex.md written (8.6KB). | — |
| 23 | TL (merge) | reviewer:review | Merged finding-by-finding: 0 CRIT/HIGH, no verdict conflict. APPROVED+GO → Step 2 passes cycle 1/3. LOW phrasing nit fixed by TL (implementation.md:169); 2 WARNs accepted by design. | — |
| 24 | TL (release) | done | Step 9: bump 1.7.2→1.8.0 MINOR (proper CHANGELOG written); gen-commands nexus (architect+team-lead); gen-omni (--check green). Suite 127/128 (1 pre-existing nexus-dotnet). summary.md written. | — |
| 25 | TL → user | done | Implement commit; completion dashboard; present RT-1/RT-2 runtime issues; lessons-processing ask. | — |

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
