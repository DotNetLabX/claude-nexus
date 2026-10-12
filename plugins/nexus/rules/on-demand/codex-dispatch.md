# Codex Dispatch

> Read when: dispatching a Codex job — availability, the review templates, the job helper and its limit, verdict consumption and merge.

The single authored home of the Codex surfaces. Consuming agent files carry marker-delimited,
script-generated copies of the sections they need — never a hand-maintained copy. Edit this file;
the generator propagates it.

## Availability detection <!-- id: availability -->

**Codex is available when the Codex plugin's surfaces are present in your session context** — its
`codex:*` skills and agents — read once per review, at the reading rule's first pass. There is no
probing protocol beyond that and no shared file to read. Absent those surfaces, every Codex option
below is simply not offered. With the surfaces present, a start through the Codex job helper
(`codex-job.js`) that returns `unavailable` is a **start failure**, judged by the early window
(→ § Time limit and fallback).

## Code-review seat <!-- id: code-review -->

On the reader pair's Codex option, **Codex is the code review's primary.** The nexus reviewer reads
the same round as its second reader — on Sonnet, or the repo's `jobs.secondReader` model where it is
set and no pick names the second — and writes `review-second.md`, never `review.md` unless promoted
(below). That reader
joins the first review and a follow-up whose `Covers:` lists a built or redone step; a follow-up
covering no step is Codex alone. The dispatcher is whoever starts the code review — the team lead, or
the standalone architect at the fast lane's review gate — and the same session dispatches a fix
round's follow-up, and the round-less follow-up after a solo fix or a hand-up made once the first
review started (its own round, never a fix cycle) — save one made for a red at the close's complete
run, which takes no follow-up review. Dispatch the two readers off the same implementation and feed neither the other's
findings: the independent reading is the point.

**What the brief carries:** the plan path, `implementation.md` with its carry-over findings table
(Codex confirms or refutes each row), the registry and digest of every touched unit, and the round's
run record — the complete-run record on a first review (`pending — complete run in flight` on the
light lane, where that run starts beside the review), the producer's fast record on a follow-up
(the fix developer's, the solo's or the hand-up developer's; `not verified at this round` where it is
cut or missing), or `undeclared` where the repo declares no complete suite. Every reader takes the
same line and cites it; none re-runs the suite (→ reviewer.md § Fresh Evidence). The skill log, the test-entry log
and plan conformance are the done check's, which runs beside the review.

**Code-review dispatch template:**
```
Review the implementation of {slug}. Review: {first | Re-review after fixes. Cycle {N}/3. Covers: {list} | Re-review after fixes. Solo fix {n}. Covers: {list} | Re-review after fixes. Hand-up {n}. Covers: {list}}.
Tree: {worktree path | session root}. Diff: the working tree against {base ref}.
Plan: docs/specs/{slug}/delivery/plan.md. Implementation record: docs/specs/{slug}/delivery/implementation.md
— confirm or refute each row of its Carry-Over Findings table.
Registries and digests of the touched units: {list | none}.
Run record: {record path and verdict | pending — complete run in flight | undeclared | the follow-up's producer record, or "not verified at this round"}.
Read-only run: do not modify any file; this is a review, not a fix.
Return in your completion message one line `## Verdict: GO` or `## Verdict: NO-GO`, then every
finding: severity (CRITICAL, HIGH, MEDIUM or LOW), file:line, the issue, the suggested fix.
The dispatching session persists them to docs/specs/{slug}/delivery/review-codex.md — you are not
expected to write any file, and must not attempt to.
```

**Two records, both written by the dispatching session.** First `review-codex.md`: the job's
`## Verdict:` line and its findings, as returned; a follow-up appends a new `## Verdict:` section
below the earlier ones and never rewrites the file. A persisted copy keeps that heading. Then the
round's primary section of `review.md` — `## Step 2 — Code Review`,
or `## Step 2 — Re-review (cycle {N})` on a follow-up — `## Step 2 — Re-review (solo fix {n})` or
`## Step 2 — Re-review (hand-up {n})` on a round-less one — in `review.md`'s own grammar, so every reader
of that file keeps reading one primary section per round:

- the verdict line, mapped by what the round leaves open, whichever of GO or NO-GO Codex returned: a
  CRITICAL or HIGH finding → `REQUEST CHANGES`; only MEDIUM or LOW → `COMMENT`; nothing → `APPROVED`;
- the provenance line `Primary: Codex — {GO | NO-GO}, persisted by {session}`;
- `**Model:** codex`, plus the model the job reports where it reports one;
- each finding as a `### [SEVERITY]` heading in the `review-format` skill's finding grammar.

Keeping the findings as severity headings is deliberate: the pipeline gate refuses an `APPROVED` that
sits beside an open HIGH or CRITICAL heading, so a mistranslated verdict is caught mechanically.

**When Codex drops, its second reader writes the round.** Which reader is promoted, and when a fresh
main is spawned instead, is the late rule's (→ § Time limit and fallback). Where it makes the round's
second reader its main, wait for that reader's hand-back if it is still running,
then resume it as round {n}'s primary, naming the dropped reader and why. It writes the round's
`review.md` Step-2 section itself, in that file's grammar, opening with the line
`Primary: {model} — promoted from second reader; {dropped reader} dropped: {why}` — the round's header
note — and re-heads its own `review-second.md` section for that round to
`## Promoted to primary — round {n}`, so that file keeps second-reader verdicts only. A reader you can
no longer resume is replaced by a fresh `nexus:reviewer` on the same model, handed the round's merge so
far with `review-second.md`, for the same two writes. The new pair's second reader, where the round
carries one, writes `review-second.md` as usual. Both files stay the reviewer's: nothing is persisted
for a promoted reader.

No two readers share a file at this seat: the done check writes `done-check.md` (a Codex done check's
block is persisted by its dispatcher, → codex-dispatch.md § Done check), the second reader
`review-second.md`, and only the dispatching session writes the two records above — or, where Codex
dropped, the promoted reader writes `review.md`'s section itself. Should two nexus
checkers ever share one section, give each a `## Pass {X}` region or hold the second append — two
agents appending to one section interleave, and a read-before-write rule does not prevent it. The
checker-side duty is in the `review-format` skill's code-review checklist.

Merging the readers into one fix list is the merge section's, below — the only place it is stated.

## Critic seat <!-- id: critic-seat -->

When Codex is picked at a critic seat — a spec, plan or promotion review — it **replaces** the nexus
critic as the primary — an owner-ratified exception to "nexus agents own the pipeline" — and in
round 1 a Sonnet second reader runs beside it, or the `jobs.secondReader` model where it is set and
no pick names the second (→ agents-workflow.md § Critic rounds). No nexus critic is spawned as that
seat's primary. Its verdict lives at its **record path**: `docs/specs/{slug}/delivery/review-critic-codex.md`
for a spec or plan review, and the consolidation report's round section for a promotion review (GO/NO-GO
plus severity-rated findings, the code-review verdict file's grammar), kept distinct from
`review-codex.md` so a feature with Codex at both seats keeps two separate records.

**Write posture — one for every Codex job.**

**Dispatch READ-ONLY: every Codex job runs through the Codex job helper, which never sends `--write` or `--model` and sends `--effort` only where the repo sets `codex.effort` or the dispatch passes `--effort`, and its brief says read-only in words too, so Codex can never touch the artifact under review.**

Sending no model is deliberate: the Codex CLI resolves its own default, and the user's Codex config
file is the model dial — and the effort dial, where the repo sets no `codex.effort`. The
`codex:codex-rescue` forwarder is not a dispatch path: nothing can hold it to the time limit.

**Persistence is the dispatching session's.** A read-only job cannot write the verdict file at all,
so the session that dispatched it takes the GO/NO-GO and the findings from the job's collected output
and persists the record itself via the Relay Contract.

**Critic-seat dispatch template:**
```
Review {artifact-path} for {slug}. Round: {n}. {One line naming what to cross-reference it against.}
Read-only run: do not modify any file; this is a review, not a fix.
Return in your completion message one line `## Verdict: GO` or `## Verdict: NO-GO`, then all findings (severity, file, issue).
The dispatching session persists them to {record path} — you are not expected to write any file,
and must not attempt to.
```

`{n}` is the critic round being read; a retry keeps its round.

## Time limit and fallback <!-- id: liveness -->

**Every Codex job runs through the Codex job helper, under one time limit.** It is `codex-job.js`:
in the main session it sits in the folder of the fast-profile line of the session-start plugin-paths
block (its `Codex job helper` line says so); a spawned agent finds it in the scripts folder its spawn
names. Run all three of its subcommands from the session
root — never a worktree — because the Codex companion keeps its job records per working directory,
and a call from anywhere else finds no job.

**The limit** is `codex.timeLimitMinutes` from the repo's agent config, 25 minutes when unset, counted
from the job's start. A review job with other readers in its round — a spec, plan or promotion review
with a second reader, or a code review with one — runs to the **later** of that limit and the moment
the round's last other reader is in; every other job, and every job of a session that started no other
reader of its round (a spawned agent spawns none), keeps the plain limit. Cutting earlier saves no
time — the round waits for that reader anyway — and loses the review. Codex at its limit at minute 25
while the Sonnet reader runs to minute 31 is collected after minute 31, finished or cut.

**The stall check.** Inside the limit and past it, the helper reads the job's own log: 6 minutes with
no new line is a **stall**, at any point in the job — measured, a working Codex job writes a log line
at least every few minutes, and a stuck one goes silent. `wait` returns `stalled: true`, with the quiet
minutes, as soon as a stall falls due; call `collect` at once. `collect` decides: a job still stalled is
cancelled and its log returned as `partial` with the reason `stalled — no Codex output for 6 minutes`,
merged like a limit cut's partial — **and the fallback runs as well**; "still running" means the job
wrote again, so go back to `wait`. The stall reason rides the round's `Codex dropped:` line, so every
cut is countable in the review records.

**The loop.** `start --prompt-file {brief}` returns the job's `jobId`, `startedAt` and `deadline`,
or `unavailable` with a reason. `wait --job {jobId} --deadline {deadline} --started {startedAt}`
returns the job's `state` — `queued`, `running`, `completed`, `failed` or `cancelled`, or `unknown`
with `readError: true` when the helper could not read the job's state (a read error is no job
failure: keep waiting to the deadline) — within about two minutes, so call it again until the state
is terminal, it returns `stalled: true`, or it adds `deadlinePassed: true`, which it does once the
limit is reached on an unfinished job: you need no clock of your own. Then
`collect --job {jobId} --deadline {deadline} --started {startedAt} --kind {kind}` — `review` for a
review, `done-check` for the done check, a skill's own kind for its job — returns the `state`, the
`output`, the `verdict` it found (`GO` or `NO-GO` for a review, `PASS` or `FAIL` for a done check,
none for any other kind) and, where it had to, a `reason` and the `partial` output.
A failure it saw inside the early window (below) carries `earlyFailure: true`. Every call prints one
JSON object.

**Holding for the other readers.** On `deadlinePassed`, while any other reader of the round is not yet
in — its verdict landed, or its stall handling ended with no verdict; a fallback reader counts as the
reader it replaced (→ agents-workflow.md § Fix rounds) — call `wait --max-seconds 30` again instead of
`collect`, and `collect` once the last is in. A job that ends meanwhile is taken as finished; a
`stalled` is collected at once; `unknown` is held like a running job. At each `wait` return in the
hold, a reader whose completion notice has not come is checked as any silent agent is — its transcript
by its agent id first, then a resume (→ agents-workflow.md § All Agents); found finished, or with its
stall handling ended, it is in.

**At the limit** `collect` reads the job's state first: a job that finished in the meantime is taken
as finished. Otherwise it cancels the job and keeps the job's whole log — merged into the round marked
`partial — Codex cancelled at the limit`, levelled by that round's cut (a code review's fix-round bar, a
critic round's action floor), each finding re-verified by the round's
other readers or the fold like any finding — **and the fallback runs as well.** A cancelled job cannot deliver late, so
nothing is held open for it. Where the cancel itself fails and the job is still running — judged by
the helper from the job's own process, and on Windows only after it has tried to end the job's process
tree itself — `collect` returns that state with `cancel failed: {why}` and the log so far: keep the log
the same way, fall back, and ignore anything the job delivers later.

**The early window** is the first 6 minutes after the job's start, or its whole limit where
`codex.timeLimitMinutes` is under 6. A **job failure** is a `start` that returns `unavailable` with the
surfaces present, a job ending `failed`, a job ending `cancelled` before its deadline by something
other than the limit or the stall check, a stall, or a job ending `completed` with no usable output for
its kind. A job cut at the limit is never an early failure, and a read error is no failure at all. The
helper sets the flag: the call that first returns the failure carries `earlyFailure: true` when it saw
it inside the window — for a stall, when `collect` saw it before minute 7, so the job wrote nothing
after its first minute. The flag on that first call governs, and a later call's reading never
overrides it; a `stalled` from `wait` is not yet a failure — the failure is `collect`'s. Key the
fallback on the flag (`earlyFailure: true` → early), never on your own reading of minutes.

**The fallback.** A job that is `unavailable`, ends `failed` or `cancelled`, is cut at its limit or by
the stall check, is still running when `collect` gives up on it, or ends `completed` with no usable
output — `no verdict returned` for a review or a done check, an empty result for any other job — falls
back at once: a review by the matrix below, the done check by codex-dispatch.md § Done check, any
other job by its own skill's fallback. A `readError` alone is not a reason to fall back before the
deadline. No question to the owner and no retry first: a retry spends the same wait again. The
round's header note names the skipped reader and why.

| Codex outcome | Seen | Attended | Typed-marker unattended |
|---|---|---|---|
| surfaces absent | — | no Codex pair; pair 3 by the reading rule | the same |
| job failure | early (`earlyFailure: true`) | the reading rule below pair 1, reusing the readers that already ran | pair 2 — a fresh Fable main; the round keeps its own resolved second reader where it has one, never widened by the fallback; the author-family rule applies |
| job failure, or cut at the limit | late (no flag) | the late rule | the late rule |

**The late rule — no Fable, ever.** After the early window no Fable is spent. The round's second
reader is promoted to main when its family is neither the author's nor Fable — at the code review by
"When Codex drops" (→ codex-dispatch.md § Code-review seat), at a critic seat by the reuse of a reader
that already ran (→ agents-workflow.md § Critic rounds) — and the round runs on that **one reader**. Where the
second reader is the author's family or Fable (an attended repo may set `jobs.secondReader: fable`),
its findings stay in the round as a reader section, and a fresh main is spawned from pairs 3–4 by the
reading rule — Sonnet, or Opus where the author is Sonnet — never Fable. A round with no other reader
(a critic round ≥ 2, a follow-up covering no step) takes the same fresh main, and gains no second
reader by the fallback. The round's header note keeps its opening line
`Primary: {model} — promoted from second reader; Codex dropped: {why}` and adds
`after the early window — no replacement` where the second reader was promoted, or
`after the early window — fresh {model} main` where a fresh main was spawned. The cut job's partial
output is merged as at the limit — marked `partial — Codex cancelled at the limit`, or with the stall
reason for a stalled job. A one-reader round from this rule is the second sanctioned single-reader
case, beside the owner's pick. **Scope:** the window and the late rule govern only the replacement of
a review primary after Codex drops; the done check and every other job keep their own fallbacks, and a
same-model replacement of a reader that cannot be resumed is unchanged.

Worked examples:
1. Author Opus, Sonnet second, Codex late → the Sonnet second is promoted; one reader.
2. Author Sonnet, Sonnet second, late → the second's findings are kept; a fresh Opus main (pair 3's Sonnet is the author's family).
3. Author Opus, a repo-set Fable second (attended), late → the Fable findings are kept; a fresh Sonnet main.
4. A critic round ≥ 2 (no second reader), author Opus, late → a fresh Sonnet main, alone.
5. Author Sonnet, a repo-set Opus second, late → the Opus second is promoted.
6. Typed-marker run, author Opus, Sonnet second, early → a fresh Fable main; the Sonnet second is kept.

- A typed-marker job that never got going, its stall seen by `collect` at about minute 6:10 →
  `earlyFailure` → example 6's outcome.
- A job that worked to minute 4 and then went quiet, stalled at about minute 10 → no flag → example
  1's outcome.

**The verdict file is the gate's channel.** Codex has no message channel of its own, so its persisted
file is the only result: a missing file means the gate has not run — never a pass — and the job's
collected output, never a chat acknowledgement, is what the file is written from.

## Done check <!-- id: done-check -->

**When it runs.** Where the coordinator's effective `jobs.doneCheck` is `codex` — the repo's setting,
which an explicit owner-directed spawn parameter still outranks
(→ pipeline-guardrails.md § Helper agents — model and type) — the Step 1 done check is a read-only
Codex job instead of an architect spawn. Unset, it stays the architect spawn.

**Who runs it.** The coordinating main session — the team lead, or the standalone architect at the
fast lane's review gate — through the Codex job helper with `--kind done-check`, beside the code review
where the architect spawn would start. It keeps the plain limit: it reads no review round. A
coordinator running as a spawned subagent neither writes `done-check.md` nor spawns an architect; it
hands `done check owed` back to its main session, which runs the Codex check or its fallback.

**Beside a Codex code review.** The done check starts first, as the architect spawn does — except in
a typed-marker unattended run, where the code-review job starts first: there the done check has a free
fallback, while a refused review job would spend Fable. Then alternate the two `wait` calls: the
review's at its default, the done check's with `--max-seconds 5`, so the review job, the only one with
an early window, is seen at the pace it would be seen alone.

**The brief** points Codex at the rules and the evidence; every path is absolute, resolved by the
dispatcher:
```
Step 1 done check (Codex).
Read-only run: do not modify any file; this is a check, not a fix.
Rules: {installed agents/architect.md} § Step 1: Done Check, and the done-check layout in {installed skills/review-format/SKILL.md}.
Plan: {plan.md}. Implementation record: {implementation.md}. Spec: {spec.md}. Rule list: {spec-rules.md | none}. Questions: {questions.md | none}.
Audit logs, in both homes ({session root}/.claude/audit/ and, in a worktree round, {tree}/.claude/audit/): skill-invocations.log, violations.log, verify-verdict.json, handoff.jsonl.
Pipeline token at the developer's dispatch: {token}. Session: {session id}. Window from: {ISO time}. Lane: {team | architect-led | light}. Tree: {worktree path | session root}. Check: {k}.
{light lane, the complete record not yet landed: Suite: running — record pending.}
{re-check: Prior check: {the prior check block}. Fix dispatched: {ISO time}.}
Return the check block's body only — the disposition table, process slips, rule counts, notes and exactly
one verdict line, **Verdict: PASS** or **Verdict: FAIL — {why}** — with no heading, no Model line and no
footer. Never quote another check's verdict line, a prior block's included. A file you cannot read is
listed as `unreadable: {path}`, an evidence gap, never as absent.
```

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
block and `Fix dispatched:`. **The light lane:** the brief reads `Lane: light` and carries the `Suite:`
line where the complete record has not landed, the job starts with the lowered `--effort` the light
lane names (→ pipeline-guardrails.md § Effort in the light lane), and there is no re-check.

**The fallback.** Codex surfaces absent while the setting stays `codex`, any `unavailable` start, a job
failure, a `readError` that lasts to the deadline, a cut at the limit or by the stall check, or an
unusable block — no verdict line or two, or one naming the plan, `implementation.md` or every
skill-log home `unreadable` — sends the check to the architect spawn on the model `doneCheck` would
resolve to without the setting (the shipped default), with one disclosure line in the communication
log: `Done check: Codex dropped — {why}; architect spawn on {model}.` A cut or unusable block is never
persisted as a check: a done check is binary, and a cut one has not run. The early window does not
apply here — there is no Fable stand-in to spare — but the stall check does: a stalled done check
falls back at once, not at the limit.

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
