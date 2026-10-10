---
name: declare-verify-roles
description: "Declare a repo's verify roles (build / unit / full / mutation commands in .claude/verify.json), its slow-test declaration and exclusion, and optionally its commit strategy — the one-time onboarding the developer speed features need. Use when the session-start nudge fires, when the user says declare verify roles, or at pipeline pre-flight when the repo has no roles yet. Reads the repo's conventions first, proposes the block against a contract with a cost bound, times each command and verifies it runs, then writes the files with the measurement."
---

# Declare verify roles

The developer closes each step with **one call** of the declared `unit` command, through
`verify-run.js --profile fast`, and the close gate runs `full` once and keeps a record — but only
in a repo that has **declared** those commands. The plugin never guesses them: they are the repo's
facts. This recipe writes them, once, attended.

## Steps

1. **Find the commands the repo already uses.** In order: `docs/conventions/coding-conventions.md`
   (a build/test discipline section, if any), `CLAUDE.md`, CI workflow files, the project shape
   (`*.sln` / `package.json` scripts / `pyproject.toml` / `Makefile`). Quote the lines you found —
   never invent a command.
2. **Propose the block** and show it before writing.
   Each role has a defined meaning and a cost bound. The repo still supplies its own concrete
   commands — the plugin never guesses them — but the contract says what a good one is:

   | role | means | bound |
   |---|---|---|
   | `build` | an **incremental** build of what changed, used only in a compile-fix loop | never a clean or forced full rebuild — that guarantee belongs to CI and to the close |
   | `unit` | the **narrowest** command covering the step's change; where the repo's convention chains build and test, chain them here (`… && …`) rather than dropping the build | **30 seconds**; never the whole suite, and never the full command minus a filter clause — the slow-test exclusion below is added to a `unit` already scoped this way and never scopes it |
   | `full` | everything, the suite the close gate runs once (it may take minutes) | **once, at close, from the main session** — never in a subagent |

   - `mutation` — only if the repo has a mutation runner; otherwise omit the key.

   A declared command is a **fixed** string, so `unit` cannot be narrowest for every individual step
   the way an agent composing one per step can be. Declare the narrowest set that covers a typical
   step in **this** repo and let the unconditional `full` run at close cover the rest — that rail is
   what makes any narrowing safe.
   Keep the existing `commands` list (the quick gate) as it is — `roles` sits beside it. **One
   exception: where a `commands` entry is the same broad command you just narrowed, narrow it too.**
   The quick gate runs that list at every implementation stop, so leaving the old command there keeps
   the whole cost you just took out of `unit`.

   **The `slow` object and the slow-test exclusion.** Propose one more object beside `roles`, read by
   the runner's named-files run:

   ```json
   "slow": { "thresholdMs": 2000, "runner": "vstest", "targets": ["src/App.slnx"] }
   ```

   - `runner`, from the project: an xunit 2.x test project → `vstest`; `xunit.v3` with the Microsoft
     Testing Platform runner flag → `mtp`, which this version refuses to time or exclude (declare it,
     skip the exclusion, say so); `node --test` → `node`; `pubspec.yaml` → `flutter`. A `full` that
     runs none of these declares no `slow`.
   - `targets` — the paths the `full` command names (a solution or project file, test globs, a test
     directory); `thresholdMs` — 2,000 unless the user picks another.
   - Write the exclusion into `unit` — **never** into `full` — as an addition to the `unit` you just
     scoped: it never scopes `unit` itself. Compose it with the plugin's composer, never by hand
     (`{plugin}` is the plugin root: the folder above `hooks/` in the runner path the plugin-paths
     block carries):

     ```bash
     node "{plugin}/hooks/scripts/lib/compose-test-command.js" join --runner {runner} -- "{unit}"
     ```

     It prints the joined `unit` — one `--filter` expression for `vstest`, the clause on the test
     invocation of a chained `unit` — and exits 2 naming the reason when it cannot join. On `node`,
     first run `node "{plugin}/hooks/scripts/lib/compose-test-command.js" node-skip-pattern`: `false`
     means this Node lacks the skip flag — declare `slow` and skip the exclusion.
3. **Run each role command once through the runner** — `verify-run.js --role {r}`, and for `full`
   `verify-run.js --role full --slug declare-verify-roles` (the session's plugin-paths block carries
   the runner's resolved path). The runner reads the roles from `.claude/verify.json`, so write the
   proposed `roles` block there first (Write tool) and correct it in place as you go; step 5
   completes the file. **Before timing `full`**, ask the composer whether it carries a filter clause:
   `node "{plugin}/hooks/scripts/lib/compose-test-command.js" filtered -- "{full}"`. `true` — a
   clause such as `--filter`, `--filter-not-trait` or `-x` — means `full` is not complete: re-propose
   it without the clause and time that. **After the exclusion join**, time `unit` again; the number
   you keep is the joined command's. Paste, for each role, **its exit code and how long it took** (the record's
   `verdict` and `duration_ms`) — the elapsed time is half the result, and a recipe that never asks
   for it is how an over-broad declaration gets written in good faith. A role that fails here must not be declared
   as-is: fix the command or leave the key out and say why. **A proposed `unit` command that
   measures over 30 seconds is re-proposed narrower before it is written** — cut the path, the
   filter or the project set, and time it again. The user may override the bound; when they do, say
   so in the reply along with the measured number, so the choice is visible in the transcript
   instead of buried in the file.
4. **Commit strategy (optional, ask once):** `"commitStrategy": "per-step"` in
   `.claude/nexus-agents.json` lets the developer commit each finished step on its branch through the
   plugin's commit helper (squashed at integration) — recommend it for worktree or branch lanes; the
   default (`"2"`) stays right for a repo that commits on its main branch.
5. **Write** `.claude/verify.json` (Write tool, never a heredoc) — `roles`, and the `slow` object
   when declared — and, if chosen, the `commitStrategy` key. **Keep what you measured** in a
   `measured` object beside `roles`, one entry per role you timed (for `unit`, the joined command's
   time), each carrying two fields — `ms`, the elapsed milliseconds as a positive
   number, and `at`, the date you ran it:

   ```json
   "measured": { "unit": { "ms": 23700, "at": "2026-09-15" } }
   ```

   The key is additive and optional: a file without it parses exactly as one with it. What it buys
   is a durable home for the number, so a session-start check can warn about a per-step command that
   was never timed by reading the declaration alone — running nothing. State that the nudge stops on
   the next session start.
6. **Do not commit** unless the user asks — the files are theirs; name them in your reply.
   Where the `tag-slow-tests` skill (`nexus-pro`) is in your skill list and `slow` was declared, end
   the reply by inviting "tag slow tests": that pass times the suite and tags its slow tests, which
   is what gives the exclusion something to leave out (an exclusion for tags that do not exist yet is
   harmless).

## Anti-patterns

- **Declaring from memory.** A command that "should work" and does not turns every step close red.
- **A `full` role under the quick gate.** The quick gate caps each command at 120 s; a multi-minute
  suite belongs in `roles.full` only.
- **Silencing instead of declaring.** `"declarationsNudge": false` is for repos that will never run
  the pipeline, not a way to stop the question.
- **A `build` role carrying a clean-rebuild flag.** One repo's forced rebuild measured **47.6 s
  against 7.4 s incremental**, fired about fifteen times a feature — roughly nine minutes — to buy a
  guarantee its own CI already buys on every cold checkout. If CI does the clean build, the local
  `build` role is incremental.
- **A per-step role that is the whole suite — or that differs from `full` by only a filter clause.**
  One repo's per-step command was its full command minus a single exclusion, which costs very nearly
  the full command. Comparing the two strings for equality would pass it. Compare what each command
  *covers*, not how it is spelled: if narrowing the filter clause is the only thing separating `unit`
  from `full`, `unit` has not been scoped at all. The slow-test exclusion from step 2 changes nothing
  here: it is added to a `unit` already scoped by what it covers, and never scopes `unit` by itself.
- **A `full` role that carries a filter clause.** `full` is the complete suite the close runs once; a
  clause in it leaves tests that no gate ever runs, and the session-start nudge warns about it. The
  composer's `filtered` check in step 3 is the test — re-propose `full` without the clause.
