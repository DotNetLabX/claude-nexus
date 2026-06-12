# Lessons — adhoc-DotnetSkillSweep

## Architect Lessons

### 2026-06-12 — Plan phase

1. **Explore subagents placeholdered 4/4 dispatches.** Two inventory dispatches and two
   reference-repo dispatches (including the protocol's one re-dispatch with explicit
   "do not acknowledge" wording) returned only "Ready." / "Noted." / "(No action needed.)".
   The read-tracker proves the first inventory agent *did* read all 32 SKILL.md files and
   then returned nothing — work done, result lost. Bounded self-search (two PowerShell
   one-liners + targeted reads) recovered both results in minutes. Lesson: for
   inventory-shaped discovery (counts, dates, file lists), bounded structured commands are
   both cheaper and more reliable than an Explore dispatch on this setup; the
   re-dispatch-once cap is right — don't burn a third attempt.
   *Improvement proposal:* track Explore placeholder rate; if it persists across sessions,
   the dispatch-contract wording in agents-workflow (research-helper dispatch contract,
   1.7.1) isn't reaching this environment's Explore agent type.

2. **Critic stranded its full review twice — and the salvage heuristic was defeated by a
   fenced closer.** The code-grounded critic produced a complete 13KB review (verdict,
   findings, matrix) mid-turn, then ended with a closer containing only a code-fenced
   `Reviewed: {path}` line. A SendMessage resume re-stranded the same way.
   `salvage-transcript.js --file` then picked the *closer*, because the code fence makes it
   multi-line and it passes the ADR-22 "looks like a deliverable" test (multi-line or
   ≥400 chars). Longest-assistant-text extraction recovered the full review.
   *Improvement proposal (plugin-bound):* salvage-transcript should strip code fences before
   the multi-line test, or treat a final message whose non-fence content is a single short
   line as a closer and fall through to longest-recent. This is a measured failure of the
   exact heuristic ADR-22 shipped to fix.

3. **The code-grounded mandate paid for itself at plan stage.** The critic's two HIGHs
   (live `bump-plugin.mjs --dry-run` collision with the in-flight 1.0.3 release; stale
   "verified" line-counts from `Measure-Object -Line` skipping blank lines) are both
   findings only source/tool-running review produces — a doc-only critic would have
   APPROVED. Confirms the standing rule: shared/external-artifact passes get code-grounded
   review, mandatory.

4. **PowerShell `Measure-Object -Line` is not `wc -l`** — it skips blank lines. Any
   line-count cited in a plan from this environment must come from `wc -l` (Git Bash) or
   `(Get-Content f).Count`, or be labeled non-blank. Small, but it produced a HIGH.
