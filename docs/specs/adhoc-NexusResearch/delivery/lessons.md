# Nexus /research skill — rename + depth-route + capture — Lessons

## Developer Lessons

- **`skill-lint` and `claude plugin validate --strict` disagree on frontmatter YAML.** `skill-lint`
  (the plan's per-skill done-condition) parses frontmatter line-by-line with a lenient regex (improve-skills
  `skill-lint.mjs` L52-55) and **accepts** an unquoted `description:` value containing `: ` (colon-space).
  `--strict` uses a real YAML parser and **rejects** it (`YAML Parse error: Unexpected token`, "loads with
  empty metadata"). A skill can pass `skill-lint` (exit 0) yet fail `--strict`. When a plan uses `skill-lint`
  as the step done-condition AND `--strict` as a release gate, expect this gap. Mitigation that worked:
  reword the description to use ` — ` / commas instead of `: `, matching descriptions that already pass.

- **A folder `git mv` re-keys the file for the harness Read/Edit guard.** After `git mv old new`, the
  first `Edit` on `new/SKILL.md` fails with "File has not been read yet" even though the *content* is
  identical and was read at the old path. You must `Read` the file at the **new** path once before editing.
  (Content is unchanged — the re-read is a path-identity formality, not a content re-read.)

- **`/tmp` resolves differently between the Bash tool and the Write tool on Windows.** The Write tool
  placed `/tmp/foo` at `D:\tmp\foo` (current-drive root `/tmp`), while Git-Bash's `cygpath` reported `/tmp`
  as `C:\Users\…\AppData\Local\Temp`. node's `resolve()` (called by cite-check) then couldn't find the
  Write-placed file via the `/tmp` path. For scratch files that a Windows `node` script must read, write
  under an explicit drive-qualified path (e.g. `D:/tmp/...`) and pass node that same path, or use the
  system temp dir consistently.

- **Spot-checking a plan against the actual validator caught a load-bearing contradiction (Q3).** Plan
  Step 3 said "set `Status: uncertain` so the validator does not fail-closed on a high-stakes single-source
  verdict." Reading `cite-check.mjs` pass C showed it keys the high-stakes floor **only** on the
  `**Corroboration:**` line and never reads `Status` — so the plan's exact mechanism produces a CITE-FAIL.
  The correct capture rule is to **not label Corroboration `high-stakes`** when a verdict can't clear the
  second-source floor (record the count, flag `Status: uncertain`, caveat in prose). Lesson: when a plan
  asserts how a *deterministic gate* behaves, verify against the gate's source before implementing — the
  gate is the authority, the plan prose can be wrong.

- **When a release gate fails on files outside the feature, prove pre-existence before attributing it.**
  `--strict` failed on 5 skills; 4 were unchanged in the working tree (and the 5th, `research`, inherited a
  colon-space the *original* `search-researches` already had at HEAD). Confirming this (empty `git status`
  for the 4; `git show HEAD:…` for the original description) separated "pre-existing repo issue, out of
  scope" from "my change broke it" — and kept the fix minimal (only the feature's own skill).

## Architect Lessons

- **A plan that asserts how a deterministic gate behaves must cite the gate's source, not paraphrase its
  intent.** Plan Step 3 claimed `Status: uncertain` makes `cite-check.mjs` "not fail-closed" on a
  high-stakes single-source verdict. The validator never reads `Status` (pass C, cite-check.mjs:130-141);
  the rule produced the opposite of its stated effect (a CITE-FAIL). The plan-writing skill already says
  "pair every prompt-only LLM obligation with an enforcement" — the dual lesson is that when the plan
  *names* the enforcement's behavior, that naming is itself a factual claim to verify against source at
  plan time. Had Step 3 cited `cite-check.mjs:139` (`highStakes && singleSource → fail`) when written, the
  contradiction would have surfaced in planning, not implementation. **Improvement candidate:** when a plan
  step's acceptance leans on a deterministic script's *internal logic* (not just "it exits 0"), cite the
  exact predicate line — it forces the plan author to read the gate.

- **Operator-owed deferrals (Q1 gen-omni, Step-3 live-report) resolved in one line each at done-check —
  because they were pre-authored.** Both were named up front (plan Step 3's operator-owed clause; my Q1
  ruling), each with the exact command and the build-time-unavailable reason. At done-check each is a clean
  `Deviated (valid reason)` with the open gate surfaced as a carry-over — no escalation, no ambiguity. This
  is the operator-owed-fallback rule paying off exactly as intended: a pre-authored fallback that fires is
  a one-line disposition; an un-authored one is an escalation.

- **The skill-invocation log made the conformance check a 30-second fact, not a judgment.** Scoping the log
  to this run (session + `agent: developer` + `token: developer:implement`) and matching the 5 logged
  skills against the plan's non-`None` mapping was deterministic and uncontestable — the implementation's
  self-reported `## Skills Used` was corroborated, not trusted. The round-keying by `token` (not timestamp)
  cleanly isolated this run from the other 2026-06-18 developer sessions in the same log.

## Reviewer Lessons

- **When a plan pre-declares two deviations valid (Q3 and Q1), verify both deviations were actually corrected, not just noted.** Q3 (cite-check capture rule) was pre-ruled design-origin by the architect and the plan was patched. The review's job is to confirm the code matches the *corrected* rule, not the original one. Checking SKILL.md capture §step 3 against cite-check.mjs:130-141 is the concrete move — not trusting the plan-patch description.
- **A pre-existing gate failure requires git-status evidence before it can be ruled out of scope.** The `--strict` failure on 4 skills looked like it could be this feature's fault (the `research` skill also failed initially). The right move — confirmed by implementation.md — is `git status --short` to verify the 4 files are unmodified in the working tree, then attribute the failure to the pre-existing state. Without that check, a reviewer cannot distinguish "pre-existing" from "introduced."
- **gen-commands no-diff must be verified by running it, not by reading the claim.** The implementation said "gen-commands NOT run" and "verified: no diff." Both need a fresh `git diff --stat plugins/nexus/commands/` to confirm — especially since gen-commands was run as part of verification (its output showed 8 command files rewritten). The diff was clean, confirming the no-change claim. Never trust a no-diff claim without running the diff.

## Skill Gaps

### skill-lint should catch colon-space in an unquoted `description:` (Fix to a shipped skill)
- **What I needed:** `skill-lint` to flag an unquoted `description:` value containing `: ` (colon-space),
  which `claude plugin validate --strict` rejects as malformed YAML ("loads with empty metadata").
- **Coverage today:** `skill-lint.mjs` checks BOM (E2), frontmatter-present (E3), name==folder (E4),
  description-present (E5), dangling refs (E6), XML tokens (E7), mojibake (E8) — but parses frontmatter
  with a line-regex that tolerates colon-space, so a frontmatter that fails the real YAML parser passes
  skill-lint. This is the exact gap that let 5 skills (4 pre-existing) reach `--strict` broken.
- **Suggested:** add an E-check that either (a) round-trips the frontmatter through a real YAML parse and
  fails on error, or (b) at minimum flags an unquoted scalar value containing `: ` for the `description:`
  (and other) keys. Routes to the plugin via the feedback file (shipped skill; this is the dev-repo so it
  could be applied directly, but it's out of scope for this feature — flagging for the architect/learner).
- **References used:** `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` L47-62 (the lenient
  frontmatter parse); the `--strict` output naming the 5 skills.
