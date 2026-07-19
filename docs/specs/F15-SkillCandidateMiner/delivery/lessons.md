# F15-SkillCandidateMiner — Lessons

## Architect Lessons

- **Name spawned lane agents role-first (`developer-f15`), never qualifier-first (`f15-developer`).**
  The role hooks peel only role-PREFIXED names; the qualifier-first dispatch name caused the
  boundary detector to log the developer's own `implementation.md` write as a cross-role violation
  (spurious entry in violations.log, discounted in the done-check) and left the skill-log `agent`
  field as the raw name instead of `developer`. Recorded incident class
  ([[custom-agent-name-breaks-role-hooks]]) — the architect's dispatch is where the fix lives.
- **A dispatch that says "invoke via the Skill tool so invocations log" still lost 2 of 3 mapped
  invocations to from-memory application.** The developer ran the *content* of `improve-skills`
  and `release-plugin` (lint, Judgment Gate, dry-run — all present) without the Skill-tool call
  that logs. The log-based done-check caught it mechanically (its exact purpose), at the cost of a
  fix cycle. Possible sharpening for lane dispatches: state the consequence ("an unlogged mapped
  skill is a done-check FAIL"), not just the instruction.
- **Finder/helper subagents re-read the same files ×2–3 per round** (read-tracker warnings during
  the developer's review pass). Lane dispatches that bake in finder passes should carry the
  read-once rule into the finder prompts.
- **The COR-4 staleness catch validates the "re-verify aged findings against current source"
  plan rule end-to-end** — the tech-spec's plan-time expected citation was already stale by run
  time (concurrent SDK refactoring), and the skill's health gate caught it live. The rule earned
  its keep; keep citing expected fixture findings as hypotheses with a named-in-report fallback,
  exactly as the tech-spec did.

## Developer Lessons

- **A tech-spec's own "expected" example citation can go stale between plan time and run time —
  the health gate has to actually check, not just cite.** The tech-spec named `COR-4` (and a
  fallback `IFC-4`) as the anticipated anti-pattern finding for the SDK golden-fixture run. Both
  had been resolved by a concurrent `adhoc-RefactoringPlan` effort in the SDK repo in the days
  immediately before this run — the code shapes the tech-debt rows described no longer existed.
  Re-running the citation commands against live HEAD (rather than trusting the tech-spec's
  plan-time snapshot) caught this before it produced a fake-green anti-pattern row. Worth a general
  note: any skill/plan step that cites a specific expected fixture-repo finding should treat that
  citation as a hypothesis to re-verify at run time, not a given — external repos keep moving.
- **`git -C` co-change analysis without Code Maat is fast enough for a small repo (1192 commits)
  to be a genuinely usable D5 fallback, not just a degraded-signal placeholder.** A ~90-line Node
  script computing pairwise file-set co-change from `git log --all --numstat` surfaced 40-140
  corroborating commits per recipe in seconds. No gap here — flagging it as a positive data point
  in case a future mine-family run second-guesses the fallback's practicality.
- **Sandboxed Bash touching a path outside the working repo, even for a plain `grep`-equivalent
  read (not a git command), still risks the fabrication failure mode.** One `Bash` call was made
  against the SDK repo mid-run (a `grep` for a tech-debt row) before catching it and re-verifying
  the same fact via `Read` instead. The hard rule as stated ("external-repo facts via PowerShell or
  `git -C`") reads like it's scoped to git commands, but the actual risk (recorded in
  [[bash-sandbox-fabricates-external-fs]]) is any Bash invocation against an out-of-repo path — the
  rule should probably be read/stated as "any external-repo filesystem read," not "any external-repo
  git command." No correction needed this run (caught and re-verified before the fact was used),
  but the phrasing ambiguity cost a wasted step.

## Skill Gaps

None found this pass — every step had a clear covering skill or an explicit plan-sanctioned
`(none)` disposition, and the `mine-skill-candidates` skill itself is the artifact that closes the
one gap this feature exists to close (code+history pattern mining with no covering skill before
F15).
