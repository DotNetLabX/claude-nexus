# Codex Dispatch

> Read when: dispatching a Codex job — availability, the review templates, the job helper and its limit, verdict consumption and merge.

The single authored home of the Codex surfaces. Consuming agent files carry marker-delimited,
script-generated copies of the sections they need — never a hand-maintained copy. Edit this file;
the generator propagates it.

## Availability detection <!-- id: availability -->

**Codex is available when the Codex plugin's surfaces are present in your session context** — its
`codex:*` skills and agents. There is no probing protocol beyond that and no shared file to read; a
start through the Codex job helper (`codex-job.js`) that returns `unavailable` counts as not installed
(→ § Time limit and fallback). Absent those surfaces, every Codex option below is simply not offered.
No Codex job of any kind runs in an `[UNATTENDED]` run — the reader-pair list's unattended pair takes
the review's place (→ agents-workflow.md § Critic rounds).

## Code-review seat <!-- id: code-review -->

On the reader pair's Codex option, **Codex is the code review's primary.** The nexus reviewer reads
the same round as its second reader — on Sonnet, or the repo's `jobs.secondReader` model where it is
set and no pick names the second — and writes `review-second.md`, never `review.md` unless promoted
(below). That reader
joins the first review and a follow-up whose `Covers:` lists a built or redone step; a follow-up
covering no step is Codex alone. The dispatcher is whoever starts the code review — the team lead, or
the standalone architect at the fast lane's review gate — and the same session dispatches a fix
round's follow-up. Dispatch the two readers off the same implementation and feed neither the other's
findings: the independent reading is the point.

**What the brief carries:** the plan path, `implementation.md` with its carry-over findings table
(Codex confirms or refutes each row), the registry and digest of every touched unit, and the main
session's complete-run record — the fresh build Codex cannot run. The skill log, the test-entry log
and plan conformance are the done check's, which runs beside the review.

**Code-review dispatch template:**
```
Review the implementation of {slug}. Review: {first | Re-review after fixes. Cycle {N}/3. Covers: {list}}.
Tree: {worktree path | session root}. Diff: the working tree against {base ref}.
Plan: docs/specs/{slug}/delivery/plan.md. Implementation record: docs/specs/{slug}/delivery/implementation.md
— confirm or refute each row of its Carry-Over Findings table.
Registries and digests of the touched units: {list | none}. Complete-run record: {path}.
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
or `## Step 2 — Re-review (cycle {N})` on a follow-up — in `review.md`'s own grammar, so every reader
of that file keeps reading one primary section per round:

- the verdict line, mapped by what the round leaves open, whichever of GO or NO-GO Codex returned: a
  CRITICAL or HIGH finding → `REQUEST CHANGES`; only MEDIUM or LOW → `COMMENT`; nothing → `APPROVED`;
- the provenance line `Primary: Codex — {GO | NO-GO}, persisted by {session}`;
- `**Model:** codex`, plus the model the job reports where it reports one;
- each finding as a `### [SEVERITY]` heading in the `review-format` skill's finding grammar.

Keeping the findings as severity headings is deliberate: the pipeline gate refuses an `APPROVED` that
sits beside an open HIGH or CRITICAL heading, so a mistranslated verdict is caught mechanically.

**When Codex drops, its second reader writes the round.** Where the fallback makes the round's second
reader its main (→ § Time limit and fallback), wait for that reader's hand-back if it is still running,
then resume it as round {n}'s primary, naming the dropped reader and why. It writes the round's
`review.md` Step-2 section itself, in that file's grammar, opening with the line
`Primary: {model} — promoted from second reader; {dropped reader} dropped: {why}` — the round's header
note — and re-heads its own `review-second.md` section for that round to
`## Promoted to primary — round {n}`, so that file keeps second-reader verdicts only. A reader you can
no longer resume is replaced by a fresh `nexus:reviewer` on the same model, handed the round's merge so
far with `review-second.md`, for the same two writes. The new pair's second reader, where the round
carries one, writes `review-second.md` as usual. Both files stay the reviewer's: nothing is persisted
for a promoted reader.

No two readers share a file at this seat: the done check writes `done-check.md`, the second reader
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

**Dispatch READ-ONLY: every Codex job runs through the Codex job helper, which never sends `--write` or `--model` and sends `--effort` only where the repo sets `codex.effort`, and its brief says read-only in words too, so Codex can never touch the artifact under review.**

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
Return your GO/NO-GO verdict and all findings (severity, file, issue) in your completion message.
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

**The limit** is `codex.timeLimitMinutes` from the repo's agent config, 25 minutes when unset — total
time from the job's start, not idle time: a reasoning job and a hung one look the same from outside.

**The loop.** `start --prompt-file {brief}` returns the job's `jobId`, `startedAt` and `deadline`,
or `unavailable` with a reason. `wait --job {jobId} --deadline {deadline}` returns the job's `state` —
`queued`, `running`, `completed`, `failed` or `cancelled` — within about two minutes, so call it again
until the state is terminal or it adds `deadlinePassed: true`, which it does once the limit is reached
on an unfinished job: you need no clock of your own. Then `collect --job {jobId} --deadline {deadline}`
returns the `state`, the `output`, the `verdict` it found (`GO`, `NO-GO`, or none) and, where it had
to, a `reason` and the `partial` output. Every call prints one JSON object.

**At the limit** `collect` reads the job's state first: a job that finished in the meantime is taken
as finished. Otherwise it cancels the job and keeps the job's whole log — merged into the round marked
`partial — Codex cancelled at the limit`, levelled by that round's cut (a code review's fix-round bar, a
critic round's action floor), each finding re-verified by the round's
other readers or the fold like any finding — **and the fallback runs as well.** A cancelled job cannot deliver late, so
nothing is held open for it. Where the cancel itself fails and the job is still running, `collect`
returns that state with `cancel failed: {why}` and the log so far: keep the log the same way, fall
back, and ignore anything the job delivers later.

**The fallback.** A job that is `unavailable`, ends `failed` or `cancelled`, is still running when
`collect` gives up on it, or ends `completed` with no usable output — `no verdict returned` for a
review, an empty result for any other job — falls back at once: a review by the reader-pair list (→ agents-workflow.md § Critic rounds), any other job by its
own skill's fallback. No question to the owner and no retry first: a retry spends the same
wait again. The round's header note names the skipped reader and why.

**The verdict file is the gate's channel.** Codex has no message channel of its own, so its persisted
file is the only result: a missing file means the gate has not run — never a pass — and the job's
collected output, never a chat acknowledgement, is what the file is written from.

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
(→ agents-workflow.md § Fix rounds). Its in-bar items form the round's fix list in `review.md`
(`## Step 2 — Fix list, cycle {N}`, layout per `review-format`), the rest the list's under-bar block —
the developer reads that list, never the reader files. Codex HIGH/CRITICAL findings block, under the same cycle-cap rules as
any reader's. Reconcile a verdict conflict between readers (one approves, another does not)
**finding-by-finding**, never by trusting one wholesale.
