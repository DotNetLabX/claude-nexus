# Codex Dispatch

> Read when: dispatching a Codex job, or consuming or merging its verdict.

The single authored home of the Codex surfaces. Consuming agent files carry marker-delimited,
script-generated copies of the sections they need — never a hand-maintained copy. Edit this file;
the generator propagates it.

## Availability detection <!-- id: availability -->

**Codex is available when the session has the Codex plugin's `codex:*` skills and agents or the
session-start line `Codex starts directly: yes`.** Read those signals once per review, at the
reading rule's first pass. Offer Codex only where available. A start through the Codex job helper
(`codex-job.js`) that returns `unavailable` where Codex is available is a **start failure**, judged by
the early window (→ § Time limit and fallback). For a seat job, the helper's `seat` call answers
whether Windows and the npm Codex launcher can run it (→ codex-dispatch.md § Seat job).

## Code-review seat <!-- id: code-review -->

When the pairing check resolves a Codex primary, **Codex is the code review's primary**. A round built
on Codex can take a Codex reader whose model differs from every author model on its stamp history
(→ agents-workflow.md § Critic rounds). Start with `--kind review --model {the slot's model}`, using
`--model codex` for a bare slot. The reviewer runs on the resolved second reader's model and effort
(the `jobs.secondReader` rung still applies) and writes `review-second.md`, never `review.md` unless promoted
(below). That reader
joins the first review and a follow-up whose `Covers:` lists a built or redone step; a follow-up
covering no step is Codex alone. Under a gear that adds a third reader, a reviewer on the resolved
third slot reads the first review as its third reader and writes `review-third.md` (→ agents-workflow.md § Critic rounds). The dispatcher is whoever starts the code review — the team lead, or
the standalone architect at the fast lane's review gate — and the same session dispatches a fix
round's follow-up, and the round-less follow-up after a solo fix or a hand-up made once the first
review started (its own round, never a fix cycle) — save one made for a red at the close's runs,
which takes no follow-up review. Dispatch the two readers off the same implementation and feed neither the other's
findings: the independent reading is the point.

**What the brief carries:** the plan path, `implementation.md` with its carry-over findings table
(Codex confirms or refutes each row), the registry and digest of every touched unit, the repo's conventions
pointer (Codex reads no agent file, so the brief names them), and the round's
run record — the handover's tied-run record on a first review (no complete run is made before the
merge; under a gear that runs the complete suite once beside the reviewers the handover run is
that complete run, which may still be `running` when the review starts), the producer's fast record on a follow-up
(the fix developer's, the solo's or the hand-up developer's; `not verified at this round` where it is
cut or missing), or `undeclared` where the repo declares no `unit` role, so the tied run records nothing. Every reader takes the
same line and cites it; none re-runs the suite (→ reviewer.md § Fresh Evidence). The skill log, the test-entry log
and plan conformance are the done check's, which runs beside the review.

**Code-review dispatch template:**
```
Review the implementation of {slug}. Review: {first | Re-review after fixes. Cycle {N}/3. Covers: {list} | Re-review after fixes. Solo fix {n}. Covers: {list} | Re-review after fixes. Hand-up {n}. Covers: {list}}.
Tree: {worktree path | session root}. Diff: the working tree against {base ref}.
Plan: docs/specs/{slug}/delivery/plan.md. Implementation record: docs/specs/{slug}/delivery/implementation.md
— confirm or refute each row of its Carry-Over Findings table.
Registries and digests of the touched units: {list | none}.
Conventions: {docs/conventions/coding-conventions.md and every file it lists | none}. Read them: a change that goes against one is a finding.
Run record: {record path and verdict | running — the gear's complete run, not landed yet | undeclared | the follow-up's producer record, or "not verified at this round"}.
Read-only run: do not modify any file; this is a review, not a fix.
On a re-review, a finding the round's `## Fix Round` block lists on a `**Left out:**` line with its reason, below the always-fix line of its fix list's `Bar:` line in review.md, is settled: never raise it again.
Where the plan's header carries `**Limit:**`, a way round the check the plan builds goes under the bold line `Beyond the limit:` in your completion message, with no severity, only when all three hold: the line names that way round or that actor; the actor the check defends against would not hit it in ordinary use; and the line was read by plan review, or a `## Decisions` row by the architect or the owner rules on it. Anything else, an unsure case included, keeps its level as a normal finding, and so does a finding that shows the limit lets through the danger it names. No level is ever lowered.
Return in your completion message one line `## Verdict: GO` or `## Verdict: NO-GO`, then every
finding: severity (CRITICAL, HIGH, MEDIUM or LOW), file:line, the issue, the suggested fix.
The dispatching session persists them to docs/specs/{slug}/delivery/review-codex.md — you are not
expected to write any file, and must not attempt to.
```

**Two records, both written by the dispatching session.** First `review-codex.md`: the job's
`## Verdict:` line, its findings and any `Beyond the limit:` list, as returned; a follow-up appends a new `## Verdict:` section
below the earlier ones and never rewrites the file. A persisted copy keeps that heading. Then the
round's primary section of `review.md` — `## Step 2 — Code Review`,
or `## Step 2 — Re-review (cycle {N})` on a follow-up — `## Step 2 — Re-review (solo fix {n})` or
`## Step 2 — Re-review (hand-up {n})` on a round-less one — in `review.md`'s own grammar, so every reader
of that file keeps reading one primary section per round:

- the verdict line, mapped by what the round leaves open, whichever of GO or NO-GO Codex returned: a
  CRITICAL or HIGH finding → `REQUEST CHANGES`; only MEDIUM or LOW → `COMMENT`; nothing → `APPROVED`;
- the provenance line `Primary: Codex — {GO | NO-GO}, persisted by {session}`;
- `**Model:** codex`, plus the model the job reports where it reports one;
- each finding as a `### [SEVERITY]` heading in the `review-format` skill's finding grammar;
- a returned `Beyond the limit:` list, copied as returned, with no severity heading; it takes no fix-list row.

Keeping the findings as severity headings is deliberate: the pipeline gate refuses an `APPROVED` that
sits beside an open HIGH or CRITICAL heading, so a mistranslated verdict is caught mechanically.

**When Codex drops, follow the review fallback** (→ codex-dispatch.md § Time limit and fallback).
Where the fallback makes the round's
second reader its main, wait for that reader's hand-back if it is still running,
then resume it as round {n}'s primary, naming the dropped reader and why. It writes the round's
`review.md` Step-2 section itself, in that file's grammar, opening with the line
`Primary: {model} — promoted from second reader; {dropped reader} dropped: {why}` — the round's header
note — and re-heads its own `review-second.md` section for that round to
`## Promoted to primary — round {n}`, so that file keeps second-reader verdicts only. A reader you can
no longer resume is replaced by a fresh `nexus:reviewer` on the same model, handed the round's merge so
far with `review-second.md`, for the same two writes. The replacement second reader, where the fallback fills that slot, writes `review-second.md` as usual. Both files stay the reviewer's: nothing is persisted
for a promoted reader. Where the fallback makes a seated third reader the main
(→ § Time limit and fallback), it is resumed the same way and re-heads its own `review-third.md`
section instead.

No two readers share a file at this seat: the done check writes `done-check.md` (a Codex done check's
block is persisted by its dispatcher, → codex-dispatch.md § Done check), the second reader
`review-second.md`, a third reader `review-third.md`, and only the dispatching session writes the two records above — or, where Codex
dropped, the promoted reader writes `review.md`'s section itself. Should two nexus
checkers ever share one section, give each a `## Pass {X}` region or hold the second append — two
agents appending to one section interleave, and a read-before-write rule does not prevent it. The
checker-side duty is in the `review-format` skill's code-review checklist.

Merging the readers into one fix list is the merge section's, below — the only place it is stated.

## Critic seat <!-- id: critic-seat -->

A Codex primary at a critic seat — spec, plan or promotion review — replaces the nexus critic as
primary. It can read work written on another Codex model under the same author comparison as the
code-review seat. Start it with `--kind review --model {the slot's model}`, or `--model codex` for a
bare slot. In round 1 spawn the resolved second reader beside it where the round carries one (the
`jobs.secondReader` rung applies), plus the gear's third reader where it adds one. A gear's
`Codex alone` spec or plan review runs one reader (→ agents-workflow.md § Critic rounds). Its verdict lives at its **record path**: `docs/specs/{slug}/delivery/review-critic-codex.md`
for a spec or plan review, and the consolidation report's round section for a promotion review (GO/NO-GO
plus severity-rated findings, the code-review verdict file's grammar), kept distinct from
`review-codex.md` so a feature with Codex at both seats keeps two separate records.

**Write posture — one rule, and the seat job's exception.**

**Dispatch READ-ONLY: every Codex job runs through the job helper. Writing seat units and the two sandbox-check jobs use the `workspace-write` box (→ codex-dispatch.md § Seat job). Every other job uses the read-only sandbox and says read-only in its brief, so Codex can never touch the artifact under review.**

**Model and effort at start.** For a resolved slot the dispatcher passes only its `--model`. Pass
`--model codex` for a bare slot so the helper uses the account default without choosing a list
model. With no `--model`, the helper reads a Codex helper or done-check job's repo entry first,
including its model-less form. Otherwise a Speed job reads the first eligible Codex model from its
job list. A list with no eligible Codex model returns `unavailable`. A job with no list uses the
account default. Seat jobs take their model from the effective seat entry. Mining keeps its own
dispatch rules. Model names are shape-checked before launch. A well-shaped model that fails in
Codex takes that job's fallback.

The helper resolves effort in this order: an explicit dispatch `--effort`, the campaign gear, the
repo's job or seat entry or the repo list entry for the chosen model, the repo's `codex.effort`, the
feature gear, then the shipped list entry for that model. A list lookup uses the selected model,
with the bare entry matched as `codex`. With no applicable effort, Codex takes its account setting.
The `codex:codex-rescue` forwarder is outside this dispatch path because it cannot enforce the limit.

**Persistence is the dispatching session's.** A read-only job cannot write the verdict file at all,
so the session that dispatched it takes the GO/NO-GO, the findings and any `Beyond the limit:` list from
the job's collected output and persists the record itself via the Relay Contract.

**Critic-seat dispatch template:**
```
Review {artifact-path} for {slug}. Round: {n}. {One line naming what to cross-reference it against.}
{Round 2 and later: Always fixed: {round n-1's always-fix line}. A prior finding folded waived or churn with its reason is closed — except one at or above that line folded waived, or folded churn without the evidence that it does not hold.}
{Plan review: A plan with a step that builds something that refuses or blocks an action, or a script that writes where other sessions or processes also write, and no `**Limit:**` header line, is a finding. Where the plan has the line, a `stops at` that names an outcome, or leaves out the danger the check exists for, is a finding. A way round the check goes under the bold line `Beyond the limit:` in your completion message, with no severity, only when all three hold: the line names that way round or that actor; the actor the check defends against would not hit it in ordinary use; and the line was read by plan review, or a `## Decisions` row by the architect or the owner rules on it. This review's own read counts as plan review's. Anything else, an unsure case included, keeps its level as a normal finding, and so does a finding that shows the limit lets through the danger it names. No level is ever lowered.}
{Plan review: Conventions: {docs/conventions/coding-conventions.md and every file it lists | none}. Read them: a step whose planned class shape, registration, naming or placement goes against one is a finding, naming the step and the convention.}
Read-only run: do not modify any file; this is a review, not a fix.
Return in your completion message one line `## Verdict: GO` or `## Verdict: NO-GO`, then all findings (severity, a confidence — high, medium or low — file, issue).
The dispatching session persists them to {record path} — you are not expected to write any file,
and must not attempt to.
```

`{n}` is the critic round being read; a retry keeps its round. The always-fix line is round n-1's,
read off the schedule table (→ agents-workflow.md § Critic rounds), as the nexus critic's brief reads it.
A spec or promotion brief leaves both `{Plan review: …}` lines out. A plan brief's conventions line names
`docs/conventions/coding-conventions.md` and the files it lists, or `none` where the repo has none: Codex reads no
agent file, so the brief carries the pointer.

## Time limit and fallback <!-- id: liveness -->

**Every Codex job runs through the Codex job helper, under one time limit.** It is `codex-job.js`:
in the main session it sits in the folder of the fast-profile line of the session-start plugin-paths
block (its `Codex job helper` line says so); a spawned agent finds it in the scripts folder its spawn
names. Run every subcommand from the session root. Either shell tool serves. A Codex job sends no
completion notice to the session, so a turn never ends on one unless a background `wait` or `watch`
is running for it.

**The route.** For jobs outside the pipeline seats, `features.codexDirect` set to JSON `true`
starts Codex directly in a read-only box on Windows with the npm Codex launcher available. Where the
repo leaves the switch unset, the profile's `codexDirect` (`nexus/profile.json`) decides the same way;
a repo `true` or `false` wins. Otherwise the helper uses the plugin route. A job keeps its starting route through collection, including after
a settings change. On the plugin route the companion's records are per working directory, which is
why calls from a worktree cannot find a session-root job. The helper supplies the plugin's data
folder when a shell lacks it, so both shells find the same job.

**The limit** is `codex.timeLimitMinutes` from the repo's agent config, 25 minutes when unset, counted
from the job's start. A review job with other readers in its round — a spec, plan or promotion review
with a second reader, or a code review with one — runs to the **later** of that limit and the moment
the round's last other reader is in; every other job, and every job of a session that started no other
reader of its round (a spawned agent spawns none), keeps the plain limit. Cutting earlier saves no
time — the round waits for that reader anyway — and loses the review. Codex at its limit at minute 25
while the second reader runs to minute 31 is collected after minute 31, finished or cut.

**The plugin route's stall check.** The helper reads the job's own log inside and past the limit: 6 minutes with
no new line is a **stall** for plugin jobs other than `helper` and legacy `seat` jobs — a working companion job writes a log line
at least every few minutes, and a stuck one goes silent. `wait` returns `stalled: true`, with the quiet
minutes, as soon as a stall falls due; call `collect` at once. `collect` decides: a job still stalled is
cancelled and its log returned as `partial` with the reason `stalled — no Codex output for 6 minutes`,
merged like a limit cut's partial — **and the fallback runs as well**; "still running" means the job
wrote again, so go back to `wait`. The stall reason rides the round's `Codex dropped:` line, so every
cut is countable in the review records.

**The loop.** `start --prompt-file {brief}` returns the job's `jobId`, `startedAt` and `deadline`,
`unavailable` with a reason, or `refused` with a reason. `wait --job {jobId} --deadline {deadline} --started {startedAt}`
returns the job's `state` — `queued`, `running`, `completed`, `failed` or `cancelled`, or `unknown`
with `readError: true` when the helper could not read the job's state (a read error is no job
failure: keep waiting to the deadline — a lost job, below, aside) — within about two minutes, so call
it again until the state is terminal, it returns `stalled: true`, or it adds `deadlinePassed: true`, which it does once the
limit is reached on an unfinished job: you need no clock of your own. Then
`collect --job {jobId} --deadline {deadline} --started {startedAt} --kind {kind}` — `review` for a
review, `done-check` for the done check, `helper` for a helper job, a skill's own kind for its job — returns the `state`, the
`output`, the `verdict` it found (`GO` or `NO-GO` for a review, `PASS` or `FAIL` for a done check,
none for any other kind) and, where it had to, a `reason` and the `partial` output.
On the plugin route a `queued` job whose worker process has gone never runs: `wait` and `collect` return it as `failed`
with the reason `the Codex worker exited before it took the job`, a job failure like any other.
A plugin job **lost** by the companion, as two jobs started seconds apart can be, is judged
once the early window has ended: a review, done-check, research, panel or mining job whose `wait`,
`collect` or `watch` passes `--started`, its log path recorded and no end recorded, whose status read says no such job while its job file, its
log and its worker process are all gone — the status and the two files read again after a short pause, the worker searched once — ends `failed` with the reason
`lost — the Codex companion holds no record of the job`, a job failure like any other. Any other read
error keeps waiting to the deadline, and a later read that finds the job governs.
On the direct route a confirmed keeper exit while the job was running, or a launch that was never
reported and whose holder and keeper are both confirmed gone, is a job failure. Silence alone leaves
a direct job running.
A failure it saw inside the early window (below) carries `earlyFailure: true`. Every call prints one
JSON object.

**Waiting in the background.** For the jobs of a review round and a Codex done check, an
**interactive** main session runs that `wait` as
`wait --job {jobId} --deadline {deadline} --started {startedAt} --max-seconds {the time limit in seconds}`
with the shell tool's background option, and its turn may end while it runs: the shell's notice wakes
the session when the call returns. The helper caps the wait at the deadline itself, so no clock is
needed; a wait started past the deadline — a job taken up again after it — is the hold's foreground
call instead (below). A terminal state, `stalled: true` or `deadlinePassed` is handled as above; any other return
starts the background wait again. A **headless** session — one started with `claude -p`, as a
campaign's unit and merge sessions are, which ends when its turn ends — and a spawned agent keep the
foreground calls above, and so does a session that cannot tell which it is. A helper job, a seat job
and a skill's own job keep the wait their own section or skill names
(→ codex-dispatch.md § Helper job; → codex-dispatch.md § Seat job). Nothing else the loop decides moves: the
stall check, the early window, `collect`'s cut at the limit, the `end` line.

**A job a later session can find.** Every Codex job of a review round or a done check starts with its
`--kind` and the label `{slug} {spec-review|plan-review|promotion-review|code-review} round {n}`, or
`{slug} done-check {k}`, as `--label`; the helper records it in the session root. A spec or plan
review round's `start` also passes `--record {the absolute path of the feature's review-critic.md}`, the record the
helper reads to check the round against the critic-round schedule (→ agents-workflow.md § Critic rounds).
A `start` that returns `refused` is the schedule's stop: the round does not run, no fallback, no retry,
and it is no job failure — the reason says why, and how an owner-ordered extra round is let through.
Before a session
starts the readers of a round whose record is missing, it runs `jobs --label {that label}`:
- `none` — the round never started: start it as usual;
- a job with its id — take up the loop above from where the job stands: `wait`, then `collect`,
  holding for the round's other readers, a read error held to the deadline (a lost job aside), and a
  cut, a stall or a failure falling back for that seat with no retry;
- `started, id not recorded` or `unreadable` — the job may still run and cannot be reached: that
  seat's fallback, the reason in the round's header note.

A `collect` or `watch` that returns a finished, failed or cancelled job started with a label adds one
`end` line to the same record — when the job ended, its state, its reason where it has one,
and the Codex session id where the result names one — so the job's run time can be read back, its
failures counted by cause and its Codex run found.

**Holding for the other readers.** On `deadlinePassed`, while any other reader of the round is not yet
in — its verdict landed, or its stall handling ended with no verdict; a fallback reader counts as the
reader it replaced (→ agents-workflow.md § Fix rounds) — call `wait --max-seconds 30` again instead of
`collect`, and `collect` once the last is in. A job that ends meanwhile is taken as finished; a
`stalled` is collected at once; `unknown` is held like a running job. At each `wait` return in the
hold, a reader whose completion notice has not come is checked as any silent agent is — its transcript
by its agent id first, then a resume (→ agents-workflow.md § All Agents); found finished, or with its
stall handling ended, it is in. The hold's calls run in the foreground in every session: a background
wait still running when the hold begins needs nothing done, and one that returns after its job was
collected is ignored.

**At the limit** `collect` reads the job's state first: a job that finished in the meantime is taken
as finished, and a lost plugin job is returned `failed`. Otherwise it cancels the job and keeps the
partial — the whole log on the plugin route, or the last 64 KB of agent messages on the direct route.
Merge it into the round marked
`partial — Codex cancelled at the limit`, levelled by that round's cut (a code review's fix-round bar, a
critic round's action floor), each finding re-verified by the round's
other readers or the fold like any finding — **and the fallback runs as well.** A cancelled job cannot deliver late, so
nothing is held open for it. On the plugin route, the helper checks the job's process and on Windows
tries to end its process tree if cancellation fails. On the direct route it asks the box to close.
If the plugin job is still running or the direct box's closure remains unconfirmed, `collect` returns
the known state with `cancel failed: {why}` and the partial so far. Keep it the same way, fall back,
and ignore anything the job delivers later.

**The early window** is the first 6 minutes after the job's start, or its whole limit where
`codex.timeLimitMinutes` is under 6. A **job failure** is a `start` that returns `unavailable` where
Codex is available, a job ending `failed`, a job ending `cancelled` before its deadline by something
other than the limit or the stall check, a stall, a lost job, or a job ending `completed` with no usable
output for its kind. A job cut at the limit is never an early failure, and a read error is no failure
at all, a lost job aside. The helper sets the flag: the call that first returns the failure carries
`earlyFailure: true` when it saw it inside the window — for a stall, when `collect` saw it before the
window plus one minute (minute 7 under a limit of 6 minutes or more), so the job wrote nothing after its
first minute; for a lost job, when the read that found it lost came before that same time, a `watch`
keeping the flag of its first `wait` that found it lost. The flag on that first call governs, and a later call's reading never
overrides it; a `stalled` from `wait` is not yet a failure — the failure is `collect`'s. Key the
fallback on the flag (`earlyFailure: true` → early), never on your own reading of minutes.

**The fallback.** A job that is `unavailable`, ends `failed` or `cancelled`, is cut at its limit or by
the stall check, is still running when `collect` gives up on it, or ends `completed` with no usable
output — `no verdict returned` for a review or a done check, an empty result for any other job — falls
back at once: a review by the preset's fallback below, the done check by codex-dispatch.md § Done check, a
helper job by its job's Claude fallback (→ codex-dispatch.md § Helper job), any other job by its own skill's fallback. A `readError` alone is not a reason to fall back before the
deadline; a lost job is a job failure and falls back at once, its reason riding the round's `Codex dropped:`
line as the stall reason does. No question to the owner and no retry first: a retry spends the same wait again. The
round's header note names the skipped reader and why.

**Under Speed**, a failed or unavailable review job drops the Codex family for this review. The
dispatcher runs the resolver again with every dropped family, the surviving picks and the round's
reader count (→ agents-workflow.md § Critic rounds). Reuse readers who already read. Start a fresh
reader for an empty slot the resolver fills, even after a late drop. The round gate's `refused`
still stops the round with no replacement or family drop.

**The pair-based presets** use the early-window matrix and late rule:

| Codex outcome | Seen | Fallback, attended and unattended alike |
|---|---|---|
| Codex not available | — | no Codex pair; pair 2 on by the reading rule |
| job failure | early (`earlyFailure: true`) | the reading rule from pair 2 on, reusing the readers that already ran; the round keeps its own resolved second reader where it has one, never widened by the fallback |
| job failure, or cut at the limit | late (no flag) | the late rule |

The pair order is the preset's (→ pipeline-guardrails.md § Model presets).

**A seated third reader.** Under a gear that adds a third reader (→ agents-workflow.md § Critic rounds), a
failure flagged early makes the round's seated third reader its main in place of the early row — promoted as a
second reader is, at the code review by "When Codex drops" (→ codex-dispatch.md § Code-review seat),
at a critic seat by the reuse of a reader that already ran — attended and unattended alike, and no
fresh main starts. Where the third reader matches an author model, the reading rule's next eligible main is
taken instead and the third reader's findings stay a reader section. A late drop runs the late rule unchanged,
the third reader's findings kept as a reader section. A third reader skipped or failed before the drop is not seated.

**The late rule — no held-back family.** After the early window no family the preset's late row holds
back is spent (→ pipeline-guardrails.md § Model presets). The round's second
reader is promoted to main when its model differs from every writer's and its family is allowed — at the code review by
"When Codex drops" (→ codex-dispatch.md § Code-review seat), at a critic seat by the reuse of a reader
that already ran (→ agents-workflow.md § Critic rounds) — and the round runs on that **one reader**. On the light lane's code review, a promoted second reader that
read only the risky steps is re-briefed with the rest of the change, and its verdict counts as the main
reader's only after that (→ architect.md § Light Lane (standalone only)). Where the
second reader matches an author model or belongs to a held-back family (a repo may set `jobs.secondReader` to one),
its findings stay in the round as a reader section, and a fresh main is spawned from pair 2 on by the
reading rule — never a held-back family. A round with no other reader
(a critic round ≥ 2, a follow-up covering no step) takes the same fresh main, and gains no second
reader by the fallback. The round's header note keeps its opening line
`Primary: {model} — promoted from second reader; Codex dropped: {why}` and adds
`after the early window — no replacement` where the second reader was promoted, or
`after the early window — fresh {model} main` where a fresh main was spawned. The cut job's partial
output is merged as at the limit — marked `partial — Codex cancelled at the limit`, or with the stall
reason for a stalled job. A one-reader round from this rule is the second sanctioned single-reader
case, beside the owner's pick. **Scope:** the matrix and late rule govern a dropped review primary in presets without job lists; the done check and every other job keep their own fallbacks, and a
same-model replacement of a reader that cannot be resumed is unchanged.

Worked examples:
1. An eligible second reader whose model differs from the writer's, Codex late → the second reader is promoted; one reader.
2. A second reader that matches a writer's model, late → keep its findings and start the first eligible main from pair 2 on.
3. A repo-set second reader of a held-back family (attended), late → its findings are kept; a fresh main from pair 2 on.
4. A critic round ≥ 2 (no second reader), late → a fresh main from pair 2 on, alone.
5. An eligible repo-set second reader of a third family, on a different model from the writer, late → it is promoted.
6. Early → the first pair from pair 2 on whose main matches no author model. Reuse that main if it already read the round as second reader. Otherwise start it fresh and keep the second reader.

- A job that never got going, its stall seen by `collect` at about minute 6:10 →
  `earlyFailure` → example 6's outcome.
- A job that worked to minute 4 and then went quiet, stalled at about minute 10 → no flag → example
  1's outcome.

**The verdict file is the gate's channel.** Codex has no message channel of its own, so its persisted
file is the only result: a missing file means the gate has not run — never a pass — and the job's
collected output, never a chat acknowledgement, is what the file is written from.

## Helper job <!-- id: helper-job -->

A helper job is a read-only Codex job a main session starts for `discovery`, `audit` or `general`.
A repo's `jobs.{name}` entry governs where set. Otherwise under Speed use the head of the resolved
job list after applying availability and the author comparison for judging work. A Codex head
uses this helper path subject to the size, write and nested-spawn rules (→ pipeline-guardrails.md § Helper agents — model and type).
A Claude head uses that slot for a Claude spawn.

- **Start:** `start --prompt-file {brief} --kind helper --label {a label naming the job} --job-name {discovery | audit | general} --limit-minutes {n} --model {the slot's model}`.
  A repo Codex entry without a `codexModel` gives a bare slot. Carry the model and let the helper
  resolve its effort (→ codex-dispatch.md § Critic seat). The start and job record name both.

- **Wait with `watch`, in the background:** `watch --job {jobId} --deadline {deadline} --started {startedAt} --kind helper --out {path}`,
  started with the shell tool's background option, so the session spends no context on the wait. It
  runs the `wait`-then-`collect` loop in one process — the same cut at the limit, the same
  `earlyFailure` flag, the same `end` line — writes the job's output to `--out`, a path the session
  chooses (a cut job's partial too), and prints one JSON line: the state, the path, the size, any
  reason, any `earlyFailure`, and `partial` where the file holds a cut job's partial — never the output. Read only what you need from the file. Where the
  file cannot be written, the line says why; `collect` still returns the job's result, or a cut job's
  partial.
- **Silence is not a stall:** a helper job that is silent while its worker or keeper lives runs to its limit.
  On the plugin route a helper that reads `running` after its worker has gone fails at once, with the reason
  `the Codex worker exited while the job was running`. Plugin jobs follow the exceptions in the stall rule above.
- **A real report is the output:** where the job provides no final message, or the companion prints only its status text or its line that
  Codex returned no final message, the job returned nothing and falls back to its job's Claude fallback
  (→ pipeline-guardrails.md § Helper agents — model and type).

## Seat job <!-- id: seat-job -->

A seat job is one unit of a pipeline seat's work run as a Codex job that may write inside the round's tree — the
seat's row allows it and the effective repo or preset seat entry names Codex (→ pipeline-guardrails.md § Codex seats). This section is the one
home of that form: the coordinator's rules point here wherever a seat set to Codex takes a step they state in its
Claude form. The coordinating main session — the team lead, or the architect in its own lanes — starts, waits on,
checks and records every seat job through the Codex job helper; Claude Code stays the only host. No Nexus hook runs
inside Codex, and the only Nexus script a seat calls is the test runner.

**The box.** A seat job runs on Windows only, and without the Codex plugin: the helper starts `codex exec` itself
inside a box it owns — a Windows job object that every process the job starts stays in, a test runner, a build
server or a detached shell included — and closing the box ends them all. The job's sandbox settings are fixed on
the command line — no writable folder added to the tree, no network, the Windows sandbox's elevated mode, no
approval asked — and outrank every Codex config file, so a project's own Codex settings cannot widen what the job
may write; the sandbox check's pass binds them and the Codex version, so a Codex whose version cannot be read
gets no pass. The box's own record lives outside the tree and every temporary
folder the job may write, or no job starts. On Linux and macOS the seats stay closed
(→ pipeline-guardrails.md § Codex seats).
The `codexDirect` switch selects the route for jobs outside the pipeline seats (→ codex-dispatch.md § Time limit and fallback).

**Whether a seat runs on Codex.** Before each unit, `seat --role {role} --slug {slug} --tree {the round's tree}`
answers for that unit: `engine` (`codex` or `claude`), the model and effort a job would be sent, and one disclosure
line. Where the engine is `claude` and the role has a Codex entry, write that line — in the communication log, or in
the architect's own lanes in the next message to the owner and in `summary.md` — and dispatch the role as a Claude
seat, on the model the line names; never halt and never ask. Where the line says the sandbox check is owed, run the
`seat-check` call it gives once — a few minutes, one check at a time on the machine — then call `seat` again. A
coordinator that is itself a spawned agent starts no seat job: it passes `--spawned`, the entry reads as unset, and
the role is spawned as today.

**One unit, one job.** A unit is one value of the seat's row — for the developer a build slice (the whole plan where
the plan cuts none), a fix round's list or a hand-up round; for the solo one fix. A job takes one unit and ends: it
is never resumed and never messaged, and the next unit is a new job that rebuilds its state from the plan,
`implementation.md` and the tree, as a fresh Claude developer does. There is no size check — every job starts
fresh. Only one seat job runs in a tree at a time, and the helper refuses a second.

**Start.** Write the phase token as before any developer dispatch. From the session root run
`codex-job.js brief --seat {role} --unit {unit} --tree {the round's tree} --slug {slug} --unit-file {unit file} --out {brief path} --skills {the mapped skills, comma-separated}`.
`{unit}` is `steps {a}–{b}`, `fix cycle {N}`, `fix cycle {N} part {k}`, `hand-up {n}`,
`solo fix {n}`, `solo fix {n} attempt {k}` or `questions`. Omit `--skills` when the unit maps none.
On exit 2, disclose the helper's error and run the unit as a Claude seat. On success pass its printed `brief`,
`otherWork` and `limitMinutes` to
`start --prompt-file {brief} --kind seat --seat {role} --unit {unit} --tree {the round's tree} --slug {slug} --skills {the same mapped skills} --other-work {otherWork} --limit-minutes {limitMinutes}`.
The `questions` unit selects read-only mode for a role whose seat row has a question phase. The optional `--questions`
flag is accepted only for that unit.
For a Codex developer build, `brief` writes the plan-derived approval paths into the session's stamp and preserves
any live paths and facts for that feature. The coordinator owns the approval facts, deletes the stamp before a solo,
and re-stamps the solo's added paths before the developer resumes.
A writing start checks its own conditions and the sandbox check's pass. A refusal sends the role to the Claude seat
with the reason as its disclosure line. A start that prints `unavailable` with `treeHeld` may have left a job running: the tree stays
held, and the fallback waits for its end like any other's. Before a writing job the helper copies every uncommitted
file git shows in the tree to a safety copy outside it. The other-work list excludes the plan's paths and the seat's
own delivery records. **Wait** with `wait --job {jobId} --deadline {deadline} --started {startedAt} --max-seconds {seconds to the deadline}`,
started with the shell tool's background option, then **collect** once it reads ended or past its deadline —
`collect`, never `watch`, whose one line drops the lists below. A seat job has no stall: silence while the box's
keeper lives runs to the limit, where `collect` cuts the job through the box — or the keeper itself, which holds the
same limit, where no `collect` comes; a keeper gone while the job reads
`running` fails it.

**The brief.** `brief` fills `hooks/scripts/lib/seat-brief-template.md` from the unit file the coordinator writes with
the Claude dispatch's step range, fix list and rows, or the solo's failure evidence and failing test files.
The commit helper stays with the coordinator.

**The question phase.** Where the lane has a Phase 1 today, the developer's first unit is `--unit questions`.
The read-only seat reads the whole plan and returns its questions, an all-clear, or a blocker. The confirmed
end's `questions` stage reports where the hand-back went:

- `questionsWritten` gives the file and entry count. Route those questions from `questions.md` as a developer's.
- A questions hand-back without a marked block gives `questionsNote`. Relay the questions from the output.
- A blocker gives `questionsNote`. Route the blocker from the output.
- An all-clear leaves the questions file untouched.
- A malformed block or a failed append gives `questionsNote` with the reason. Both `collect` and `seat-release`
  include the hand-back in `output` alongside the note, including at close.

The answers land in `questions.md`, which every later job reads. A lane with no Phase 1 today has none.

**A blocker** — a question written to `questions.md` with a `Blocked on step {N}` hand-back, or a `Bug found` — ends
the job early. Route it as today; once it is answered or fixed, the next job starts at that step.

**After the job.** `collect` returns what the coordinator acts on:
- `end` — `confirmed` once the box has closed with no process left in it, or — its keeper gone — once the box's job
  object and every process it last listed are gone, read from the Windows session the keeper ran in; otherwise
  `unconfirmed` with the reason: an unconfirmed end holds the unit and the tree, and nothing else writes there until
  a later `collect` or `seat-release --tree {tree}` confirms it; with the owner present disclose the hold, with the
  owner away record it as a failed build of that unit;
- `leftovers` — what the job left running that the box's close ended;
- `fallback` and `fallbackReason` — the job failed (its box's keeper gone included), was cut or cancelled, or ended
  with no hand-back of the role's own (the fallback, below);
- `finishedSteps` — the steps whose block ends with the done line and whose step-run record passes;
- `seatChecks` — what a hook would have recorded, already written to the violations log: raw test commands and
  separate builds as test-entry lines, a `seat-unread` line where Codex's session record could not be read whole or
  git could not list the tree after the job (a disclosed miss, never a pass), the files outside the approved set, `stepRunsOverTwo`, and a fix round with no
  class-check line. `changedByOthers` lists other roles' records in this feature's delivery folder whose only
  violation would be ownership and whose edit the complete, readable session record does not attribute to the seat.
  For either writing role, a completed file change naming the feature's communication log is a violation.
  The coordinator reads these results after the job.
- `safetyCopy` — other work put back, other work left changed, and feature files gone with their copies kept.
  `changedByOthers` lists edits attributed to other sessions among other roles' records and the feature's communication log. Put
  back a gone feature file the unit's steps did not ask to remove;
- `afterJobRuns` — what the seat's row runs after the job: for a solo, the project's verify commands (below);
- `minutes`, and the carried step-run records (`stepRunsCarried`).

On an unconfirmed end the records, `seatChecks`, `safetyCopy` and the after-job runs wait (`checksWait`): the call
that confirms the end — a later `collect`, or `seat-release` — runs them once, in order, each recorded as it finishes,
so a call stopped part-way resumes where it stopped, and returns them, with the step-run records written since. A
confirmed end whose tree could not be given back still reads `checksWait`, with `freeError`: the tree stays held.

Then, under a per-step commit strategy, run the commit helper once for the job — the files it changed, the slice's
last step number, the message naming the slice; a fix or hand-up round is committed as the coordinator commits one
today. A solo's job owes you no verify run: the call that finishes its end runs the project's verify commands
(`.claude/verify.json` `commands`) in the tree, each in a box of its own whose keeper cuts it at 120 s, the tree held
until each box is seen to end as a seat job's is, and appends their verdict to `.claude/audit/verify-verdict.json`
with the tree's build-ledger lines, as a Claude solo's stop does. They run one after another, so a solo's `collect` may take up to two minutes per command and about a
minute more per box: start it with the shell tool's background option, as you start `wait`. A call stopped during
them leaves nothing running unseen — the next one ends their boxes first, and runs no command again whose box closed
by itself. In the
message table the job's row reads its minutes in the time column and `n/a — Codex` in the size column.

**While a job runs, nothing else is sent to it.** A late fix item, a solo's second red, a light-lane plan change and
an answered question each wait for the running job and go as a new job of the same round — a late item as
`fix cycle {N} part {k}`, a second red as `solo fix {n} attempt {k}` carrying the solo's earlier block — never two
jobs in one tree. The round's count does not move, and the round ends when its last job has handed back. In the
light lane the handover run waits for it, as today.

**The fallback, per unit.** A seat job that cannot start, fails, loses its box's keeper, is cut at its limit, is refused
for the Codex plan's usage limit, or ends with no hand-back falls back with one disclosure line and no question, in
this order:
1. **The end is confirmed** — never a second writer in the tree before it.
2. **Finished work is committed**, under a per-step strategy: the files `finishedSteps`' blocks name, whole, under the
   last finished step's number, its message naming each such file an unfinished step also changed. Every other
   changed file stays uncommitted, as the unfinished step's.
3. **The role's own Claude agent takes the unit** on the dispatch the unit was given — a fresh developer on the
   build-only or fix-round dispatch, a fresh solo for a solo's fix — from the first step not in `finishedSteps`, on
   the model the seat has without its Codex entry.
The rest of that unit stays on Claude; the next unit tries Codex again.

**The architect's own lane.** The last slice's first review keeps its two parts: the seat writes `## Self-Review`
from its own reading, and the coordinator runs the fresh read-only helper pass itself after the job, its real
findings going to the round's fix list.

**At close**, before a worktree is removed, run `seat-release --tree {tree} --close`: it ends that folder's Codex
servers while no job runs there, and drops the tree's safety copies and the box folders of its finished jobs.
Without `--close` it keeps them; a box whose job's end is not finished is never dropped. A box that reported
nothing — its start stopped — holds the tree for five minutes, then `seat-release` gives its job up and frees the
tree, unless its keeper claimed the launch; `--close` then drops its folder too.

**A reservation from the earlier seat design** — one made when seat jobs ran through the Codex plugin — has no box
to read, so it holds its tree with that reason: a seat start there is refused and `collect` reads the end
`unconfirmed`. `seat-release --tree {tree} --legacy` gives it back once no process whose command line names the
tree runs, by the path given or the one the reservation was made with.

**Not defended.** A seat's test runs take no turn in the machine's test queue; a seat reads any file the user can,
secret files included, as read-only Codex jobs already do; more than two runs of one step are counted and reported,
never stopped. The box holds what the job starts the ordinary way, and nothing else: a process the job starts
through a scheduled task, a Windows service or Windows' management interface, which ordinary build and test
commands never do; a program already running outside the box before the job — a container engine, a Linux
subsystem, a build daemon another session started — that the job's commands hand work to, as a Claude developer's
build does today; for an earlier-design reservation, a process that names the tree some other way than on its
command line; a solo's verify commands, which run with the user's own rights once the job has ended — boxed for
their lifetime, not sandboxed, as a Claude solo's stop runs the same commands; an MCP server a trusted project's
Codex config starts, which the box ends with the job but which runs with the user's own rights, as an MCP server
Claude Code starts does; and a person who sets the helper's
test-only settings by hand in a session, since the plugin binds agents and trusts people.

## Done check <!-- id: done-check -->

**When it runs.** Resolve the `doneCheck` choice with the round's author models from
`implementation.md`. An owner-directed spawn parameter comes first, then the repo's usable
`jobs.doneCheck` entry (→ pipeline-guardrails.md § Helper agents — model and type). A Codex entry
with no `codexModel`, including `"codex"`, means the bare account-default slot. Where no override
wins under Speed, use `model-preset.js readers --job doneCheck --author {models} --codex available|absent --count 1 --no-author-fill --json`.
Run the check on Codex when its resolved first slot is Codex and differs from each author model.
Apply the same comparison to a Codex override, including the unnamed-writer and unknown-default
cases (→ agents-workflow.md § Critic rounds). Otherwise spawn the architect as in the presets without
job lists. Honor a usable Claude override in the same order, then use the preset's done-check model
and effort, else the architect's resolved model. Under Speed the list decides only whether the check
runs on Codex and on which Codex model. If a Codex override collides or cannot be resolved against
the authors, record the reason and take the architect fallback.

**Who runs it.** The coordinating main session — the team lead, or the standalone architect at the
fast lane's review gate — through the Codex job helper with `--kind done-check --model {the slot's model}`, beside the code review
where the architect spawn would start. It keeps the plain limit: it reads no review round. A
coordinator running as a spawned subagent neither writes `done-check.md` nor spawns an architect; it
hands `done check owed` back to its main session, which runs the Codex check or its fallback.

**Beside a Codex code review.** The done check starts first, as the architect spawn does — except in
a typed-marker unattended run, where the code-review job starts first: there the done check has a free
fallback, while a review job refused early needs a fresh main reader. Then, in an interactive session,
each job gets its own background `wait`, each waking the session when its own job ends
(→ codex-dispatch.md § Time limit and fallback). A headless session alternates the two foreground
`wait` calls: the review's at its default, the done check's with `--max-seconds 5`, so the review job,
the only one with an early window, is seen at the pace it would be seen alone.

**The brief** points Codex at the rules and the evidence; every path is absolute, resolved by the
dispatcher — the feature's spec and rule list through `sdd-read.js` (→ agents-workflow.md § Slug and Path Resolution):
```
Step 1 done check (Codex).
Read-only run: do not modify any file; this is a check, not a fix.
Rules: {installed agents/architect.md} § Step 1: Done Check, and the done-check layout in {installed skills/review-format/SKILL.md}.
Plan: {plan.md}. Implementation record: {implementation.md}. Spec: {the resolved spec, and the development spec where one is named}. Rule list: {the resolved rule list | none}. Questions: {questions.md | none}.
Audit logs, in both homes ({session root}/.claude/audit/ and, in a worktree round, {tree}/.claude/audit/): skill-invocations.log, violations.log, verify-verdict.json, handoff.jsonl.
Pipeline token at the developer's dispatch: {token}. Session: {session ids}. Window from: {ISO time}. Lane: {team | architect-led | light}. Tree: {worktree path | session root}. Check: {k}.
{re-check: Prior check: {the prior check block}. Fix dispatched: {ISO time}.}
Return the check block's body only — the disposition table, process slips, rule counts, notes and exactly
one verdict line, **Verdict: PASS** or **Verdict: FAIL — {why}** — with no heading, no Model line and no
footer. Never quote another check's verdict line, a prior block's included. A file you cannot read is
listed as `unreadable: {path}`, an evidence gap, never as absent.
```

`Session:` lists every session the round ran in, comma-separated — on the team lane, the communication
log's `Sessions:` line; on the architect's lanes, the plan's `**Sessions:**` line.

**What is persisted.** The dispatcher takes the body from `collect`'s output, cuts the companion's two
trailing lines (opening `Codex session ID:` and `Resume in Codex:`), and appends to `done-check.md`:
```
### Check {k} — {date} — {after the build | after fix cycle {N} | after hand-up {n}}

**Model:** codex{ — {the model the job reports}, where it reports one}
Checker: Codex — persisted by {session}
**Re-checks:** check {j}        ← a re-check only
{the returned body}

*Status: COMPLETE — Codex, persisted by {session}, {date}*
```
That footer is a completion footer to every reader of one, and verdict validation applies unchanged —
a PASS listing a `Missing` step is invalid. This is the second named exception to one owner per
artifact, beside the code review's persisted Codex verdict, for the same reason: a checker from outside
the pipeline is persisted by its dispatcher. A Codex done check writes no lessons, and its dispatcher
writes none on its behalf.

**A re-check** is a new Codex job, never a resume — Codex jobs are not resumable — carrying the prior
block and `Fix dispatched:`. **The light lane:** the brief reads `Lane: light`, the job starts with the lowered `--effort` the light
lane names (→ pipeline-guardrails.md § Effort in the light lane), and there is no re-check.

**The fallback.** Codex not available for a Codex choice, any `unavailable` start, a job
failure, a `readError` that lasts to the deadline, a lost job, a cut at the limit or by the stall check, or an
unusable block — no verdict line or two, or one naming the plan, `implementation.md` or every
skill-log home `unreadable` — sends the check to the architect spawn. Use the preset's done-check model
and effort, or the architect's resolved model. Write one disclosure line in the communication log
as `Done check: Codex dropped — {why}; architect spawn on {model}.` A cut or unusable block is never
persisted as a check: a done check is binary, and a cut one has not run. The early window does not
apply here — it decides only a review's replacement reader. A plugin job that stalls falls back at once.

## Critic-seat verdict consumption <!-- id: verdict-critic -->

Whoever would have consumed the nexus critic's verdict consumes this one, by the same mapping:

- **GO** = the critic's ACCEPT.
- **NO-GO, or any HIGH/CRITICAL finding** = the critic's REVISE — the same fold-and-fix flow, under
  the critic-round schedule (→ agents-workflow.md § Critic rounds) — a Codex critic runs the same
  rounds and the same floor.
- **A missing file = the gate has not run** (→ § Time limit and fallback), which also owns recovery.

The dispatch that produces this verdict, and the read-only posture it must carry, are stated once in
the critic-seat section above.

## Merge & fold <!-- id: verdict-merge -->

**Merge every reader into ONE fix list**: the primary's findings — Codex's on the Codex pair, the
reviewer's otherwise — with the second reader's, any partial findings kept at the limit, and the done
check's items; dedupe overlaps into a **single** consolidated list and level it against the round's bar
(→ agents-workflow.md § Fix rounds). The list is written in instalments as each check lands, still one
list (→ agents-workflow.md § Fix rounds). Its in-bar items form the round's fix list in `review.md`
(`## Step 2 — Fix list, cycle {N}`, layout per `review-format`), the rest the list's under-bar block —
the developer reads that list, never the reader files. Codex HIGH/CRITICAL findings block, under the same cycle-cap rules as
any reader's. Reconcile a verdict conflict between readers (one approves, another does not)
**finding-by-finding**, never by trusting one wholesale.
