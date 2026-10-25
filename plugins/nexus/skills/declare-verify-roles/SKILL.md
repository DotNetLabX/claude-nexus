---
name: declare-verify-roles
description: "Declare a repo's verify roles (build / unit / full / mutation commands in .claude/verify.json), its slow-test declaration and exclusion, and optionally its commit strategy — the one-time onboarding the developer speed features need. Use when the session-start nudge fires, when the user says declare verify roles, or at pipeline pre-flight when the repo has no roles yet. Reads the repo's conventions first, proposes the block against a contract with a cost bound, times each command and verifies it runs, then writes the files with the measurement."
---

# Declare verify roles

The developer closes each step with **one call** of the declared `unit` command, through
`verify-run.js --profile fast`, and the close gate runs `full` once and keeps a record — but only
in a repo that has **declared** those commands. The plugin never guesses them: they are the repo's
facts. This recipe writes them, once — with the owner, or by the unattended path below when the
owner is away.

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
   | `unit` | the **narrowest** command covering the step's change; where the repo's convention chains build and test, chain them here (`… && …`) rather than dropping the build | **the `stepLimitSeconds` you declare** (step 5); never the whole suite, and never the full command minus a filter clause — the slow-test exclusion below is added to a `unit` already scoped this way and never scopes it |
   | `full` | everything, the suite the close gate runs once (it may take minutes) | **once, at close, from the main session** — never in a subagent; within the `fullLimitSeconds` you declare (step 5), 10 minutes when unset |

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
   the runner on every run:

   ```json
   "slow": { "thresholdMs": 2000, "runner": "vstest", "targets": ["src/App.slnx"] }
   ```

   - `runner`, from the project: an xunit 2.x test project → `vstest`; `xunit.v3` with the Microsoft
     Testing Platform runner flag → `mtp`, which this version refuses to time or exclude (declare it,
     skip the exclusion, say so); `node --test` → `node`; `pubspec.yaml` → `flutter`. A `full` that
     runs none of these declares no `slow`.
   - **A `vstest` or `flutter` repo needs its language plugin** (`nexus-dotnet`, `nexus-flutter`): this
     plugin runs node tests itself, and each language plugin carries how its own tests run. Without it
     the composer's `join` and `join-stop` below exit 2 naming the missing plugin, named-files and tied
     step closes run the declared `unit` whole, and slow tests cannot be timed; `filtered` answers either
     way. Tell the user which plugin to install before composing.
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

   **The per-test stop.** A stuck test should fail in seconds, not hold the whole run. For `vstest`
   and `flutter`, join the runner's stop into `unit` **and** `full` with the same composer, at the
   slow stop of step 5 (30 s unless the user picks another):

   ```bash
   node "{plugin}/hooks/scripts/lib/compose-test-command.js" join-stop --runner {runner} --seconds 30 -- "{unit}"
   ```

   It adds `--blame-hang-timeout {s}s --blame-hang-dump-type none` to `dotnet test`, or
   `--timeout {s}s` to `flutter test`, and leaves a command that already carries one as it is. `node`
   needs nothing: the runner applies its stops at run time to a direct `node --test` command. A `unit`
   or `full` that runs a script of its own instead passes the composer's legs — `nodeLegs` for the
   argument lists, `announceLegs` before the first, and as its last act `endLegs` with the legs'
   statuses, which states that nothing of the script's own failed and exits — so its tests get the
   stops and its run's timeouts are told apart from failures. Declare the script as `node {script}`
   alone — never through another program, never chained with another stage, with no word a shell
   would expand (`*`, `?`): the runner then starts it with no shell and counts only the statement of
   the process it started, so call `endLegs` there, never in a process the script starts. A script whose own check
   failed exits without `endLegs`, and `endLegs` states nothing while an `exit` listener is registered,
   since that listener runs after it; every red exit `endLegs` did not end stays a real failure.
3. **Run each role command once through the runner** — `verify-run.js --role {r}`; for `unit`
   `verify-run.js --role unit --timeout-ms 110000`, since no step limit is set yet and the bare form
   would cut at the 90 s default; and for `full`
   `verify-run.js --role full --slug declare-verify-roles --timeout-ms 1800000`, since no full-run
   limit is set yet and the bare form would cut at the 10-minute default (the session's plugin-paths block carries
   the runner's resolved path). The runner reads the roles from `.claude/verify.json`, so write the
   proposed `roles` block there first (Write tool) and correct it in place as you go; step 5
   completes the file. **Before timing `full`**, ask the composer whether it carries a filter clause:
   `node "{plugin}/hooks/scripts/lib/compose-test-command.js" filtered -- "{full}"`. `true` — a
   clause such as `--filter`, `--filter-not-trait` or `-x` — means `full` is not complete: re-propose
   it without the clause and time that. **After the exclusion join**, time `unit` again; the number
   you keep is the joined command's. Paste, for each role, **its exit code and how long it took** (the record's
   `verdict` and `duration_ms`) — the elapsed time is half the result, and a recipe that never asks
   for it is how an over-broad declaration gets written in good faith. A role that fails here must not be declared
   as-is: fix the command or leave the key out and say why. **A proposed `unit` command cut
   at 110 s (`reason: "timeout"`) or measuring over 110 s is re-proposed narrower before it is
   written** — cut the path, the
   filter or the project set, and time it again. The user may override the bound; when they do, say
   so in the reply along with the measured number, so the choice is visible in the transcript
   instead of buried in the file.
4. **Commit strategy (optional, ask once):** `"commitStrategy": "per-step"` in
   `.claude/nexus-agents.json` lets the developer commit each finished step on its branch through the
   plugin's commit helper (squashed at integration) — recommend it for worktree or branch lanes; the
   default (`"2"`) stays right for a repo that commits on its main branch.
5. **Write** `.claude/verify.json` (Write tool, never a heredoc) — `roles`, the `slow` object when
   declared and the settings proposed below — and, if chosen, the `commitStrategy` key. **Keep what you measured** in a
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

   **The step limit.** Propose a top-level `"stepLimitSeconds"` beside `roles`: the time one step
   close may take — the fast profile, or `verify-run.js --role unit` — in whole seconds. Unset, it is
   90 s; above 110 s the runner clamps it to 110 s, under the Bash tool's 120 s cap; anything but a
   whole number above 0 is ignored, with one stderr line. The architect's light lane runs at
   `min(limit, max(15 s, limit / 2))`, `limit` being the value after the clamp — so a value set under
   15 s stays as set. Propose **three times `measured.unit.ms`, rounded up to the next 15 s and
   capped at 110 s**; the light half then stays above the measured time while that time is under
   55 s, and above it a light-lane close may be cut:

   ```json
   "stepLimitSeconds": 75
   ```

   A step close cut at this limit records `reason: "timeout"`. Where the repo declares `roles.full`,
   the developer reads that as *not finished* rather than red — the complete run at close covers the
   tests that were cut — and without `roles.full` it stays red. Say so when you propose the value.

   **The full-run limit.** A full run — `--profile complete`, or `verify-run.js --role full` — is cut
   at 10 minutes unless the repo declares a top-level `"fullLimitSeconds"` beside `stepLimitSeconds`,
   in whole seconds; it is never clamped (the full run is a main-session run), and anything but a
   whole number above 0 is ignored, with one stderr line. Propose it only when `measured.full.ms`
   is over 5 minutes: **twice the measured time, rounded up to the next minute**. A full run cut at
   its limit records `reason: "timeout"` and names this setting:

   ```json
   "fullLimitSeconds": 1200
   ```

   **The per-test stops and the speed-up line.** Propose a top-level `"testStop"` and
   `"speedUpSeconds"` beside `stepLimitSeconds`, in whole seconds, with the same fall-back to the
   default and one stderr line on a bad value:

   ```json
   "testStop": { "fastSeconds": 3, "slowSeconds": 30 },
   "speedUpSeconds": 5
   ```

   A test over its stop fails as *timed out*, apart from a real failure, and a timeout in a test the
   change did not touch never holds the close. A labelled-slow test gets `slowSeconds`, every other
   test `fastSeconds` — but only once the `slow` object carries `"labelled": true`, written when the
   repo's slow tests carry their label; without it every test gets `slowSeconds`, so an unlabelled
   repo never loses a slow test to the fast stop. `vstest` and `flutter` take `slowSeconds` alone.
   `speedUpSeconds` is the line over which a developer gets one try to speed a test up before it is
   kept slow with a reason.
6. **Do not commit** unless the user asks — the files are theirs; name them in your reply.
   Where the `tag-slow-tests` skill (`nexus-pro`) is in your skill list and `slow` was declared, end
   the reply by inviting "tag slow tests": that pass times the suite, tags its slow tests and writes
   `"labelled": true`, which is what gives the exclusion something to leave out (an exclusion for
   tags that do not exist yet is harmless) and switches on the fast stop. From then on each step
   close labels the tests it ran.

## With the owner away

A run with the owner away whose repo declares no `roles.unit` declares them by this path, as the
catalogue's `verify-roles declaration` entry says. Nothing in it is asked.

- Steps 1 to 3 run as written, but the proposal is not shown for approval: step 3's timing run proves
  it instead — it writes the proposed roles into `.claude/verify.json` before it runs them — and step
  3's bounds hold, with no override.
- A role whose command fails its timing run is taken out of the file again. Where no role is left
  working, the file is restored to what it was before this pass — removed, where there was none — and
  `summary.md` names the roles `undeclared`.
- Step 4 is not asked: the commit strategy takes its default, and no `commitStrategy` key is written.
- Step 5 writes the file as usual. The declaration is a listed point, its answer
  `presumed (proceed-default), not user-confirmed`, naming each role with its measured time
  (→ agents-workflow.md § Owner-away runs).
- In place of step 6, the file is kept on the feature's branch with the run's work, never on the
  default branch, and the invitation to tag slow tests goes on the list.

A campaign unit takes none of this: it never declares and never writes the file. Its coordinator
declares the roles at the campaign's preparation, and the unit reads its worktree's copy.

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
