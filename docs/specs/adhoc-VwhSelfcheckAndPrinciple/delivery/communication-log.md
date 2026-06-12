# adhoc-VwhSelfcheckAndPrinciple — Communication Log

**Branch:** main
**Step:** done
**Cycle:** 1/3 (approved on first review)
**Team Mode:** standard
**Review Mode:** n/a — plan pre-existed, pipeline starts at Developer
**Architect ID:** aa6850c664675cdfc (Step 1 done check PASS, model=fable via spawn param)
**Developer ID:** a877f12735cdbb711 (Phase 2 fresh spawn, model=opus via spawn param — fresh spawn instead of SendMessage resume to keep opus; Phase 1 was a712040f556df69f3, opus, all clear; original ad1b4e0b07b8a44f0 killed — sonnet, Phase-1 collapse)
**Reviewer ID:** af19fac95f569da87 (Step 2, frontmatter default sonnet)
**Plan Steps Completed / Remaining:** [] / [1-8]
**Questions Resolved:** [Q1 — resolved by architect pre-launch]

**Launch notes:** Dirty tree at launch (nexus-dotnet files from adhoc-DotnetSkillSweep); user chose: continue on main, scoped commits — stage only this slug's files, never sweep nexus-dotnet changes.

| # | From → To | Phase | Message | Problem |
|---|-----------|-------|---------|---------|
| 1 | team-lead → developer | developer:analyze | "Analyze adhoc-VwhSelfcheckAndPrinciple." + plan path + standing stop line (background spawn) | — |
| 2 | user → team-lead | developer:analyze | Developer runs on sonnet (frontmatter default, no nexus-agents.json) — user ordered stop | Model not acceptable to user |
| 3 | team-lead → developer | developer:analyze | TaskStop ad1b4e0b07b8a44f0 — killed mid-run | Phase-1 collapse detected post-mortem: agent skipped questions.md and was implementing (+24 lines in docs/architecture/README.md) when killed |
| 4 | user → team-lead | developer:analyze | Model config set: architect/po→fable, developer→opus (.claude/nexus-agents.json); discard partial edit; restart developer | — |
| 5 | team-lead → developer | developer:analyze | Partial edit reverted; re-spawned Phase 1 on opus: "Analyze adhoc-VwhSelfcheckAndPrinciple." + plan path + standing stop line (background) | — |

| 6 | developer → team-lead | developer:analyze | Phase 1 complete: all clear, 0 questions, all 8 steps verified against live tree (full report relayed to user; recovered via transcript) | Deliverable stranded — see issues log |
| 7 | team-lead → developer | developer:implement | Fresh Phase-2 spawn on opus with context handoff: "Implement. Answers: None — all clear." + Phase-1 summary (background) | — |
| 8 | developer → team-lead | developer:implement | Phase 2 complete: 8/8 steps, 117/0 tests, nexus 1.7.2 bump, one documented deviation (selfcheck glob form); flags: keep nexus-dotnet staged changes out of commit (full report relayed; recovered from transcript msg #79/86) | Deliverable stranded again — same storm pattern |
| 9 | team-lead → architect | architect:donecheck | "Step 1 done check." + plan/implementation paths, spawned background on fable (spawn param) | — |
| 10 | team-lead (commit) | architect:donecheck | Plan commit 0ac0c88 (plan.md + questions.md only). First attempt 2e1046e swept in pre-staged nexus-dotnet files → soft-reset, unstaged foreign files, recommitted clean | Pre-staged foreign changes in index at launch — caught post-commit, fixed |
| 11 | architect → team-lead | architect:donecheck | Step 1 done check: PASS (review.md ## Step 1, COMPLETE, zero Missing — validated). Advice: commit now — held per 2-commit protocol (commit at pipeline end) | — |
| 12 | team-lead → reviewer | reviewer:review | "Step 2 code review." + plan/implementation paths, spawned background (frontmatter sonnet) | — |
| 13 | reviewer → team-lead | reviewer:review | APPROVED (review.md ## Step 2 — validated: no blocking findings, 2 LOW observations) | — |
| 14 | team-lead (shutdown) | done | summary.md written; final scoped commit b111de7 of implementation + slug artifacts; nexus-dotnet and .claude/ excluded | — |
| 15 | user → team-lead | done | Close approved with issues on record; lessons processing skipped (lessons.md remains unprocessed) | — |

## Runtime / Plugin Issues Log

- **Phase-1 boundary collapse (developer, sonnet):** spawned with `Analyze {slug}.` + standing stop line, but went straight to implementation — modified docs/architecture/README.md (+24 lines) without writing questions or handing back. Detected only because the user killed the run early. questions.md mtime predates spawn. Partial edit pending cleanup decision.
- **violations.log absent** — boundary detector recorded nothing for this breach (ownership write to docs/ by developer during analyze phase is not a detected category, or detector not active in this repo).
- **SubagentStop hook storm (developer Phase 1, opus run):** after delivering its handoff, the agent received ~8 duplicate SubagentStop notifications, each producing a lifecycle reply. The final inline result AND `TaskOutput` both returned only the last closer ("Duplicate SubagentStop, no new instruction") — the real 3.5k-char deliverable was message #14 of 22 in the transcript.
- **salvage-transcript longest-recent failed to reach past the storm:** default selection returned the lifecycle closer, not the deliverable — 8 stacked closers exceed its recency window. Recovered manually by enumerating assistant texts in the JSONL. Plugin fix candidate: salvage should skip known lifecycle-reply patterns or scan deeper.
- **Spawn `output_file` was 0 bytes** (not a symlink to the transcript as documented) — real transcript found at `subagents/agent-{id}.jsonl` under the project session dir.
- **Second SubagentStop storm (developer Phase 2, opus):** same pattern — real handoff was msg #79 of 86, followed by 7 lifecycle closers; inline result + TaskOutput both returned only the last closer. Recurrence (2nd occurrence) — meets the learner's promotion threshold.
- **Plan commit initially swept pre-staged foreign files:** the nexus-dotnet changes (adhoc-DotnetSkillSweep) sat *staged* in the index since before launch; `git commit` of the plan included them (2e1046e). Caught on the commit stat line, soft-reset, recommitted clean (0ac0c88). Team-lead lesson: with a dirty-at-launch tree, check `git diff --cached --name-only` before every scoped commit — staging only your files does not unstage someone else's.
