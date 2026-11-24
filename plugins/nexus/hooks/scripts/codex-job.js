#!/usr/bin/env node
/**
 * Nexus codex-job: the one dispatch path for every Codex job, whichever seat starts it.
 *
 *   node codex-job.js brief   --seat <role> --unit <unit> --tree <absolute path> --slug <slug> --unit-file <path> --out <path> [--skills <a,b>]
 *   node codex-job.js route
 *   node codex-job.js start   --prompt-file <path> [--limit-minutes <n>] [--effort <level>] [--job-name discovery|audit|general] [--label <text>] [--kind <kind>] [--record <path>] [--expect-route direct|plugin]
 *   node codex-job.js start   --prompt-file <path> --kind seat --seat <role> --unit <unit> --tree <absolute path> --slug <slug> [--questions] [--skills <a,b>] [--other-work <file>] [--spawned] [--limit-minutes <n>] [--effort <level>]
 *   node codex-job.js wait    --job <id> --deadline <iso> [--started <iso>] [--max-seconds <n>] [--kind <kind>]
 *   node codex-job.js collect --job <id> --deadline <iso> [--started <iso>] [--kind review|done-check|research|panel|mining|helper|seat]
 *   node codex-job.js watch   --job <id> --deadline <iso> [--started <iso>] [--kind <kind>] --out <path>
 *   node codex-job.js jobs    --label <text>
 *   node codex-job.js sweep
 *   node codex-job.js seat-release --tree <absolute path> [--close] [--legacy]
 *   node codex-job.js seat-check
 *   node codex-job.js seat --role <role> --slug <slug> [--tree <absolute path>] [--spawned]
 *
 * THE CRITIC-ROUND SCHEDULE. A `start` labelled `{slug} {spec-review|plan-review} round {n}` is
 * checked by lib/round-gate.js after its arguments are validated and before anything is written: a
 * round the schedule does not allow prints `{"refused": true, "reason": …}` and exits 0, starting no
 * job and writing no intent line. Round 3 reads the record named by --record; a round 3 without it is
 * refused, naming the flag. The owner-ordered line in the brief lets any round through. Any other
 * label passes untouched, and an error inside the check passes too.
 *
 * Every call prints one JSON object on stdout and exits 0 on every handled outcome — an unavailable
 * Codex, a failed or cancelled job, a job cut off at its limit. Exit 2 is reserved for a call the
 * helper cannot act on (a missing argument, a prompt file that does not exist, an unknown --kind),
 * printed as `{error}`.
 *
 * ROUTE. `route` reports the route for a non-seat job in this session root. With `features.codexDirect`
 * enabled and the box available, `start` uses a read-only box in the session root. The plugin route is used
 * when the switch is off or the box is unavailable, with the skip reason in the latter case.
 * `--expect-route` refuses a different route before launching and is only accepted outside the pipeline seats.
 * A direct launch that may have happened
 * returns `unavailable` with `launchUncertain`, and its box remains collectable.
 *
 * A JOB A LATER SESSION CAN FIND. The companion's job records are per working directory and no session
 * keeps another's job id, so a session started after one ended could not reach its jobs. `start`
 * appends an intent line to `.claude/audit/codex-jobs.jsonl` in the session root before it calls the
 * companion — its --label, or null without one — then the job id with the log path the companion's start
 * reply names, or `unstarted` when no companion was found to call. A labelled intent it cannot write
 * starts no job, `unavailable`; an unlabelled one
 * starts the job anyway and adds `recordError`. A companion call that returns no id leaves the intent
 * standing, since its worker may already run; so does an id line it cannot write, which adds
 * `recordError`. A direct start verifies its written intent before launch and records `unstarted` when
 * that verification refuses the launch. Its request identifies the job if the job line is missing, and
 * a launch claim or status lets `jobs --label` recover the box id.
 * `jobs --label` prints every job recorded under exactly that label, newest first:
 * `recorded` with its id, `started, id not recorded` for an intent with neither, or `none`, a missing
 * record file included; a record it cannot read whole is `unreadable`. --kind is validated as
 * `collect` validates it and recorded. A `collect` or `watch` that returns `completed`, `failed` or
 * `cancelled` for a job the record holds appends one `end` line — its label, the job id, when it ended,
 * the state, any reason, and `codexSession` from the direct box's thread or the companion's result —
 * once per job under its record lock, so every job's run time can be read
 * back and its failures counted by cause; a job the record does not hold, a
 * companion not found, or a job still running writes none, and `jobs --label` reads past the line.
 * Beside the record, a start keeps a running file for a recorded job,
 * `.claude/audit/codex-running/{session id}/{job id}.json` with its label, kind, seat, unit, start, deadline and model
 * (the sandbox check jobs omit the model). No file is written without a safe `CLAUDE_CODE_SESSION_ID`.
 * The call that writes or finds the job's end removes it from whichever
 * session's folder holds it, and a `start` past its argument checks first clears files more than 60 minutes past
 * their deadline, day-old leftovers and empty session folders an hour old — none of which changes a call's outcome.
 *
 * CLOSING FORGOTTEN SERVERS. The Codex plugin keeps one background server per folder and, when its
 * connect check on it fails, starts another without ending the old one. `start`, before it calls the
 * companion, and a `collect` whose job ended — read as completed, failed or cancelled, or cut with the
 * cancel confirmed — end the job's folder's forgotten servers (lib/codex-servers.js), the session root's
 * (box jobs call no companion, so their start and collect close none): those whose pid file
 * is gone and that no Codex record names, and only while no Codex job runs in the folder, this
 * collect's own worker left out. The recorded server stays; the Codex plugin stops it when the session
 * ends. Each such call prints `serversClosed`; a close that fails adds `serversNote` and never changes
 * the job's state, verdict, output or early flag. `sweep` does the same for every folder on the
 * machine and prints one row per folder — closed, kept, and why kept — with the total. Every close
 * that ends servers appends one `close` line: when, the folder, how many, their ages in minutes, and
 * the trigger, `start`, `collect`, `sweep` or `seat-release`.
 *
 * RUN FROM THE SESSION ROOT. The Codex companion keeps its job records per working directory, so
 * every subcommand runs from the session root and its record. A seat job of the earlier design, started
 * through the companion, names another folder: the companion is told the job's tree with `--cwd` at every
 * call, read back from the record. Every other kind sends no `--cwd`, and a review of a worktree names the
 * worktree in its brief.
 *
 * A SEAT JOB. `--kind seat` starts one unit of a pipeline seat's work (lib/codex-seat.js) as `codex exec`
 * in a box the helper owns (lib/seat-box.js), on Windows only and without the Codex plugin: the tree is
 * the job's folder and the project root of everything it runs (`CLAUDE_PROJECT_DIR`), a writing unit runs
 * under the `workspace-write` sandbox and the `questions` unit under `read-only`, and the label is built as
 * `{slug} seat {role} {unit}`, then the model where the role's entry names one. The job id is the box id.
 * `brief` prepares the prompt from the shipped template, the unit file, the tree's verify roles and the
 * full text of the seat's format and mapped skills. Qualified skills come from their named plugin. Bare
 * names are resolved from the tree's local skills, then the core, then the other installed plugins, with
 * ambiguity refused. The other-work list excludes plan paths and the seat's own delivery records. For a
 * developer build, the helper merges plan paths into the session's live same-feature approval stamp,
 * preserving its paths and facts. It returns the output paths, brief size, skill sources, skipped plan
 * tokens and a limit of 1.5 times the greater of the repo limit and the unit's effort points, rounded up.
 * Nothing in this route names a role: the seat table alone opens one. `seat`, a seat `start` and the box
 * share one availability answer, the box's (lib/seat-box.js `available`). Its model and effort come from
 * the role's seat setting
 * (lib/model-presets.js `seats`) in a helper job entry's place. Every start, question units included,
 * is refused where the role's row allows no seat on this platform (lib/codex-entry.js). A writing start also checks
 * its own other conditions whatever an earlier call said: its entry is a usable seat setting, the
 * call carries no `--spawned`, and no campaign gear names the role's author model. One that fails
 * prints `{refused: true, reason}` and starts nothing.
 * Its limit is --limit-minutes raised to the repo's Codex limit where shorter. Before the box starts the
 * start takes the tree: one reservation file per tree under the seat folder, made so only one caller can
 * make it, naming the box id; a tree another seat job holds is `refused`, naming that job. The reservation
 * also carries what the job's end is finished from — the intent line, the safety copy, the coordinating
 * session and its phase token — before the keeper starts, and the keeper's pid, creation time and Windows
 * session once it reports, so any session root reaches the job from the reservation alone, and a `collect`
 * with no record of the job finds it there. The safety copy and every change to the reservation are made under the
 * tree's lock, each change only while the reservation still names this start. A box that never launched the job
 * gives the tree back; one whose keeper claimed the launch and reported nothing keeps it, `unavailable` with
 * `treeHeld`. The intent line adds the box, the tree, the seat, the unit and the write option, and keeps the slug,
 * `--skills`, the `--other-work` file's paths and the files git showed as uncommitted before the job.
 * `seat-release --tree` ends that folder's Codex servers, the recorded one included, while no Codex
 * job runs there, and prints how many. A tree held by a box job that has ended is finished there as a
 * `collect` finishes it (A SEAT JOB'S END) and given back (`released`, else `held` with `heldReason`); a job
 * still running in its box keeps it. A box that has reported nothing holds the tree for the start's own five
 * minutes; past them its job is given up by the box's `abandon` claim and the tree given back, unless its keeper
 * claimed the launch, which holds it. Only with `--close`, while no seat job holds the tree, does it drop the
 * tree's safety copies (`copiesDropped`), under the tree's lock — none where this same call found a gone feature
 * file (`copiesKept`) — and with `--close` it drops each box folder of the tree whose job's end was finished,
 * every stage of it, with the verify commands' boxes whose end that finish proved, each box whose job never launched
 * and each box with no status whose `abandon` claim stands (`boxesDropped`), each renamed away before it is removed
 * so a keeper still loading finds nothing to claim; the box of a job not finished stays. A reservation of the earlier seat
 * design is given back only with `--legacy` (A SEAT JOB OF THE EARLIER DESIGN).
 *
 * THE SAFETY COPY. Before a seat job with the write option starts, every uncommitted file git shows
 * in the tree — changed or untracked, each untracked file by itself, never an ignored one — is copied
 * under the seat folder (lib/seat-copy.js), and an earlier copy of the tree whose feature files are now
 * committed is dropped; a copy that cannot be made, or a tree whose uncommitted files git cannot list, starts
 * nothing, `unavailable`. `--other-work` names the other work in the tree, one path or folder per line. Once,
 * by the call that finishes the job's end (A SEAT JOB'S END), it looks
 * only for copied files that are gone: other work is put back, other work that changed is left as it
 * is, a gone feature file is left gone with its copy kept, and no file that exists is written over.
 * A complete Codex session record can attribute a changed record in the feature's delivery folder to another
 * role, or its communication log to the coordinator. The helper returns the lists as `safetyCopy` and records
 * findings in one `copy` line, with attributed paths in `changedByOthers` in both. A question unit gets no copy.
 *
 * THE SEAT'S RECORDS. No Nexus hook runs inside Codex, so the helper writes in the session root what the hooks
 * write for a Claude seat (lib/seat-records.js), each with the coordinating session's id and phase token. Once a
 * seat start has its job id: one skill-log line per `--skills` entry, its agent the seat's role and `via:
 * "brief"`, and one `spawn` row in the hand-back log whose target is the role. When the job's end is finished
 * (A SEAT JOB'S END): one `handback` row, its agent id `codex-{job id}` — both rows marked `engine: "codex"`; the
 * job's step-run records in the tree's verify log, carried into the session root's once (`stepRunsCarried`) —
 * only those of the seat's identity, `codex-seat-{role}`, whose own tree is the job's tree, written after its
 * intent, with the session's token where theirs is empty, and none where the tree is the session root; and the
 * job's `minutes`. These go to the session root that started the job, whichever root finishes it.
 * A record that cannot be written adds `recordsNote` and never changes the job's outcome.
 *
 * THE CHECKS AFTER A SEAT JOB. The call that finishes a seat job's end — a `collect`, or `seat-release` for a job
 * nobody collected — also records, once, in the session root's violations log, what a hook would have recorded for a Claude
 * seat (lib/seat-checks.js), and sends nothing back: each command in Codex's own session record of the job that the
 * test-entry gate would refuse on that seat, as an unblocked `test-entry` line — or one `seat-unread` line where
 * that record cannot be found or read whole; for a seat whose row lists the compare, each file the job changed
 * that lies under `.claude/`, is another role's artifact, or lies outside the session's live approved set. An
 * edit that breaks only the other-role rule can be attributed to another session (lib/seat-checks.js). For a
 * completed fix round the helper also checks the block for a class-check line. It returns `seatChecks` with those results, the
 * units whose step runs passed two (`stepRunsOverTwo`), and whether the approved-set compare ran. A `collect` that
 * leaves the end unconfirmed runs neither these nor the safety copy's look, and says so (`checksWait`).
 *
 * THE SANDBOX CHECK. A writing seat start also needs a standing pass of the machine's sandbox check
 * (lib/seat-check.js): none, a failed one, or one made under another machine name, Codex version, Codex
 * config hash, route, launcher, sandbox mode or sandbox settings prints `refused` with the reason. `seat-check`
 * runs it: in a throwaway repository made fresh under the seat folder, one short write job in its main checkout
 * and one in a linked worktree, each in a box of its own under the settings a writing seat job carries, told to
 * run the probe script the helper put there, and cut at its own limit. Only once both jobs' ends are confirmed
 * from their boxes does the helper read the probe's result file, the repository and each box's `leftovers` —
 * never the model's message — and record the result whole; an end it cannot confirm fails the check and keeps
 * its layouts. A standing pass is reused; one check runs at
 * a time on the machine, and a caller that finds one running waits for its record. The check's own two
 * jobs are the one writing start made without a pass. `seat` prints whether a role's seat runs on Codex
 * now — the engine; the model and effort the seat runs on, a Codex job's or, on Claude, the role's own
 * without its Codex entry (the gear's where a gear decided), with the entry's Codex settings beside it as
 * `codexModel` and `codexEffort`; one disclosure line naming the seat, the reason and that model; and `read`,
 * the rule section the coordinator follows for the unit. It never runs the check: with no
 * usable record it answers that the check is owed and gives the `seat-check` call. It never refuses
 * and asks nothing. `seat` and a seat start name the seat table file they read as `seatTable` wherever it is not
 * the shipped one, which only the test runner can change (lib/codex-entry.js).
 *
 * READ-ONLY BUT FOR A SEAT. A writing seat job runs in its box under the `workspace-write`
 * sandbox, as do the sandbox check's two jobs. Direct and plugin jobs are read-only. `start --model`
 * carries the selected slot for a non-seat job other than mining. The value `codex` uses the user's
 * default. Without the flag, a helper or done check honours its Codex job entry first, else Speed
 * takes the first eligible Codex entry in the job's list. When that list has none, the intent is
 * recorded as unstarted. A seat takes its own `codexModel`. Names and efforts use the shapes in
 * lib/codex-entry.js.
 * Effort comes from the dispatch, campaign gear, repo job or list entry, repo `codex.effort`, feature
 * gear, then shipped list entry, in that order. List effort is looked up by the model being sent.
 * The start and intent lines record the model and effort sent.
 *
 * ONE LIMIT, AND A STALL CHECK. `codex.timeLimitMinutes` (default 25) runs from the job's start. Inside
 * it the companion's job log decides: 6 minutes with no new `[ISO time]` line is a stall — measured on 84 jobs,
 * no completed job went quiet longer than 5.6 minutes and every stuck one went quiet 8 or more. Quiet
 * counts from the newest timestamped line, or from --started when the log exists and is empty; a log the
 * helper cannot use (no path, missing, unreadable, no parsable timestamp) never makes a stall, and the
 * limit stays the backstop. `wait` reads the state once without waiting, for the log's path, then waits
 * until the first stall check would fall due. If the log has advanced, it keeps waiting for the
 * remainder of the requested wait. It reports `stalled` with the quiet minutes when the log stayed
 * quiet. Only `collect` cuts a stall, after checking the state and log again.
 * `wait` returns within --max-seconds (default 100) plus a 15-second grace for a hung companion; at
 * its default that is inside the Bash tool's two-minute timeout, so no caller needs a timeout
 * argument; past the deadline it adds `deadlinePassed` to an unfinished job's state, since an agent
 * has no clock, and keeps waiting up to --max-seconds, so a dispatcher waiting on the round's other
 * readers can call it again.
 * A status read that fails — the companion erred, timed out or knew no job — is `unknown` with
 * `readError`, never a job failure, save a lost job (below): the caller keeps waiting to the
 * deadline. A read that does not wait gets 15 seconds of its own, so a hung one is cut long before a
 * long wait ends. `wait` reads
 * again once a second while more than a second of its wait is left, so a job that ends after a
 * failed read is reported at once, and an error that lasts the wait still takes the whole wait. At
 * the deadline `collect` re-reads the state, allowing that read 30 seconds of its own. A job that
 * just finished is taken; otherwise `collect` cancels it and returns the job's whole log as
 * `partial`; the caller runs its fallback as well. A later `collect` of a job the record shows this
 * helper cut returns that log as `partial` again, with the cut's reason.
 *
 * A LOST JOB. The companion keeps every job of a folder in one state file it rewrites with no lock, and
 * a save drops the job file and log of every job missing from its list, so two jobs started seconds
 * apart can erase one. With --started, once the early window has ended, a job of any kind but `helper` and
 * `seat` (the recorded kind first, else --kind) whose status read answers `No job found for`, whose log
 * recorded at `start` and its `.json` job file beside it are both gone, whose record holds no `end` line
 * and whose worker no process runs (`task-worker … --job-id {id}`: on Windows a `Win32_Process` query on
 * the job id, elsewhere `ps`) is read again after about 2 seconds; a read that still finds no job and no
 * files fails it `lost — the Codex companion holds no record of the job`, a job failure. A search that
 * finds the worker or gives no answer, a job line with no log path, an unreadable record, any other read
 * error, or a read that finds the job keeps the rules above, and a read that finds the job governs. A
 * search that finds the worker or gives no answer is not run again for 30 seconds of the same call, and
 * the check runs only where the search, the pause and the read fit inside the wait plus its grace.
 * `collect` checks before its cut, so a lost job is never cancelled; it writes the `end` line, and a
 * later `collect` or `wait` with --started of a job whose recorded end is the lost one returns it lost
 * again. Every status read `wait` makes is checked, the one that waits included. Tests
 * replace the search with `NEXUS_CODEX_WORKER_SEARCH` (a JSON array, the job id appended, printing the
 * command lines as a JSON array) and the pause with `NEXUS_CODEX_LOST_RECHECK_MS`.
 *
 * A HELPER JOB. For the `helper` and `seat` kinds silence with the worker alive is not a stall: the job
 * waits to its limit, and a seat job in its box has no stall at all (A SEAT JOB'S END). A worker gone while the job reads `running` fails the job at once, unless the
 * status read again has the job ended; a re-read that fails is a read error, as above. `wait` reads the
 * kind from the job record; a job the record does not hold keeps the stall rule, and its --kind is read
 * by the lost-job check alone. An unknown --kind is a usage error, as at `collect`.
 * A `collect` with no --kind reads a box job's kind from the record, defaulting to `review`. A plugin job defaults to `review`.
 *
 * WATCH. `watch` runs what a session's `wait` then `collect` loop runs, in one process: the same cut at
 * the limit, early flag and end line. Without --kind it reads the kind from the job record, else
 * `review`. It writes the job's output, or a cut job's partial, to --out and prints one line: the
 * state, the path, the size, any reason, any `earlyFailure`, and `partial` for a cut job — never the
 * output. A file it cannot write adds the reason; `collect` still returns the job's result, or a cut
 * job's partial.
 *
 * A REAL REPORT. For the kinds that take any output — research, panel, mining, helper and seat — the companion's page for a missing payload, its
 * line for an empty final message and the session lines either route appends are no output.
 *
 * THE EARLY FLAG. With --started, a job failure — `unavailable` at start, `failed`, `cancelled` read
 * as terminal, a completed job with no usable output for its --kind — returned before the start plus
 * the window (6 minutes, or the whole limit where that is shorter) carries `earlyFailure`; a stall
 * carries it only when `collect` sees it before the window plus one minute of companion setup, and a
 * lost job only when the read that reaches the verdict comes before then — `watch` keeps the flag of its
 * first `wait` that reached it, across passes whose `collect` could not confirm it, until a read finds the job. The time
 * the helper sees the failure governs, less the time `start` spent closing forgotten servers, so no
 * caller keeps a clock. No --started, no flag. Deadline cuts and failed cancels carry no flag.
 *
 * THE STOP. `collect` runs the companion's own `cancel` first (40 s), with Git Bash path conversion off
 * so the companion's `taskkill /PID` switches arrive intact. A cancel that fails is judged by the
 * process, not by the cancel's exit code: after the re-read, the record's pid gone, or held by another
 * program, reads as stopped; on Windows a pid whose command line names this job's `task-worker` is
 * ended here with `taskkill /PID {pid} /T /F`, no shell, then checked again. A lookup that errors, runs
 * past its 5 seconds or returns an empty command line is tried once more; two such are no answer, which
 * never reads as stopped. Only a job still running — by its process — is reported as that state with
 * the cancel's error, never as `cancelled`. Node's own warning lines never reach a `reason`. A failed
 * or cancelled job whose record carries no error message is reasoned from the last lines of its log.
 *
 * A DIRECT JOB'S END. `wait`, `collect` and `watch` use the recorded route and the box's status. A running
 * direct job has no stall check. It ends when the box closes or reports it never launched. If the keeper
 * is gone, the same check for the job object and its listed processes can confirm closure. After five
 * minutes with no status, both recorded launch processes must be gone to end the job as failed.
 * `collect` uses the original turn's final answer in Codex's session record and appends the session lines
 * from the box's thread. A message without a phase needs matching text in that turn's completion record.
 * At the caller's deadline it asks the keeper to cut the job. A confirmed cut returns the last 64 KB of agent messages
 * as partial; a cut that cannot be confirmed returns the observed state and partial, with no end line.
 * An ambiguous final answer or source read failure leaves the end and delivery unrecorded for retry. `watch` leaves its output
 * path untouched on that error. Each direct start clears delivered, closed direct boxes of this root whose
 * recorded end is over seven days old.
 *
 * A SEAT JOB'S END. `wait`, `collect` and `watch` read the seat box's state from its status.json: it has
 * ended once the keeper wrote the box's close, and a keeper gone while the job reads `running` fails the job.
 * Silence while the keeper lives is never a stall: the job runs to its limit, where `collect` cuts it through
 * the box, `cancelled` with the box's events as `partial`. The keeper holds the same limit, from the job's launch,
 * and cuts the job itself where no call comes; `collect` reads that cut as its own. The end is then finished once, by whichever call
 * comes first — a `collect`, or `seat-release` — under the tree's lock, in stages each recorded in the
 * box's finalize.json before the next runs, so a call stopped part-way resumes at the first stage not
 * recorded: the end line, the step-run carry, the safety copy's look, the checks, the question job's questions,
 * the row's after-job runs, then the tree given back. The questions stage appends the seat's block between
 * job-id markers and returns the file and entry count, or a note with the hand-back where the coordinator
 * must relay it. A stage resumed after a stop writes nothing its stopped run already wrote: the end and
 * `confirm` lines, the hand-back row, a step-run record, the `copy` line, a check's line and the verify record are
 * each written once per job, and the safety copy's look names each file it puts back before it does. The end is
 * `confirmed` when the box's status — naming this box, and the keeper the start recorded where it recorded one —
 * reads `boxClosed: true`, or — the keeper gone by pid and creation time — when this call runs in the Windows session the keeper ran in, 10 s have
 * passed since a call first saw the keeper gone (recorded in the reservation by that call), the box's job object
 * no longer opens and no process the box last listed lives. Otherwise it is `unconfirmed` with its reason and the tree stays held: so for a call
 * in another session, a status.json missing, unreadable or naming another box, and a reservation that exists
 * but cannot be read, which is never read as given back. `collect` returns the end (`end`, `endReason`), what
 * the box ended that the job left running (`leftovers`), the fallback, `finishedSteps` and the finished
 * stages' results; an unconfirmed end says the records and checks wait (`checksWait`). The row's after-job runs
 * are what the seat's row in the seat table names (lib/seat-after.js), returned as `afterJobRuns`: for
 * `verify-commands`, the project's verify commands, each in a box of its own in the tree, entered in finalize.json
 * before it starts — its keeper once known, and when a call first saw that keeper gone — and its 120 s limit kept by
 * its keeper, the tree held until each box's end is proved as a seat job's is, between the tree's build-ledger
 * lines, and one verify record in the session root's audit log, keyed by the seat job's box id. A finish resumed
 * after a stop first ends every command box the stopped one recorded, and reads the result of a command whose box
 * closed by itself, uncut, instead of running it again. A free stage that cannot read the reservation, or finds it
 * still this job's, records nothing, keeps the tree and returns `checksWait` with `freeError`. A tree lock no call
 * can take because a stopped call left its reap claim names that file in the reason.
 *
 * A seat job's fallback and finished steps (lib/seat-end.js): `collect` returns whether a fallback is owed and
 * why (`fallback`, `fallbackReason`: the job failed, lost its box's keeper, was cut or cancelled, or completed with no
 * hand-back line of the role's own) and `finishedSteps` — each step whose block in implementation.md ends with
 * `**Step done:** {n}` and whose latest step-run record of this job, in its tree, counts as passing. The end line
 * records the end, the fallback and their reasons.
 *
 * A SEAT JOB OF THE EARLIER DESIGN. A tree reservation with no box, a companion `task-*` job id, no job id, or the
 * process evidence that design kept is from the design that ran seat jobs through the companion. Nothing can tell
 * its writer from a stale hold, so it holds its tree, `a reservation from the earlier seat design`: a seat start is
 * refused, a `collect` of its job reads the end `unconfirmed` with `checksWait` and closes none of the tree's
 * servers, and a plain `seat-release` keeps it. `seat-release --tree {tree} --legacy` gives it back once no process
 * whose command line names the tree runs — as given, as the reservation spelled it, or through their real paths —
 * this call and the processes that started it aside; a process list that cannot be taken keeps it, and a process
 * that names the tree some other way is not seen. Under the test runner
 * only, NEXUS_CODEX_TREE_LIST names a command printing that list as JSON `[{pid, ppid, cmd}]`.
 *
 * A WORKER THAT NEVER TOOK THE JOB. The companion starts its background worker before it saves the
 * job, and a worker that reads first exits: the job stays `queued` with no process behind it. `start`
 * loads `codex-worker-wait.js` into the companion through NODE_OPTIONS, after whatever the shell set
 * there, and the worker then waits for its launcher to exit before it reads. Where a worker is lost
 * all the same, `wait` and `collect` read a `queued` job whose pid is gone, or held by another
 * program, as `failed` — a job failure, early flag included — and `collect` has the companion cancel
 * the record, only while no process holds the pid. A lookup with no answer never reads as lost, and
 * the stall check stays the backstop.
 *
 * FINDING THE COMPANION. `NEXUS_CODEX_COMPANION` names it directly. Otherwise
 * `installed_plugins.json` under CLAUDE_CONFIG_DIR (or ~/.claude), the first `codex@` key: the entry
 * installed for this working directory first, else the user-scope entry, the highest version
 * within the chosen group. Project paths compare case-folded on Windows, whose paths are.
 *
 * ONE JOB FOLDER. The companion keeps its jobs under CLAUDE_PLUGIN_DATA, which the Bash tool's shell
 * has and the PowerShell tool's has not, so a job started in one was unknown in the other. A shell
 * without the variable is given the Codex plugin's own data folder, `plugins/data/{id}` under the
 * config directory, the id being the registry key with every character outside letters, digits, `_`
 * and `-` turned into `-`. A companion named directly gets no folder.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createHash } = require('crypto');
const { spawnSync } = require('child_process');

const DEFAULT_LIMIT_MINUTES = 25;
const DEFAULT_MAX_SECONDS = 100;
const STATUS_GRACE_MS = 15000;
const COLLECT_STATUS_MS = 30000;
const CANCEL_MS = 40000;
const QUIET_LIMIT_MS = 6 * 60000;
const SETUP_ALLOWANCE_MS = 60000;
const WAIT_FLOOR_MS = 1000;
const LOOKUP_MS = 5000;
const LOOKUP_TRIES = 2;
const READ_SLACK_MS = LOOKUP_MS * LOOKUP_TRIES + 1000;
const KILL_MS = 10000;
const RECHECK_MS = 2000;
const TREE_LIST_MS = 20000;
const codexEntry = require('./lib/codex-entry');
const presets = require('./lib/model-presets');
const seats = require('./lib/codex-seat');
const seatCheck = require('./lib/seat-check');
const seatCopy = require('./lib/seat-copy');
const seatRecords = require('./lib/seat-records');
const seatChecks = require('./lib/seat-checks');
const seatEndLib = require('./lib/seat-end');
const seatBox = require('./lib/seat-box');
const { codexRoute, SWITCH_OFF } = require('./lib/codex-route');
const seatAfter = require('./lib/seat-after');
const seatBrief = require('./lib/seat-brief');
const fileLock = require('./lib/file-lock');
const { isSafeId } = require('./lib/safe-id');
const { readRoundToken } = require('./lib/round-token');
const { specFolder } = require('./lib/parts');
const LEVELS_TEXT = codexEntry.LEVELS.join(', ');
const KINDS = ['review', 'done-check', 'research', 'panel', 'mining', 'helper', 'seat'];
const ANY_OUTPUT_KINDS = new Set(['research', 'panel', 'mining', 'helper', 'seat']);
const HELPER_KIND = 'helper';
const SEAT_KIND = 'seat';
const SILENT_KINDS = new Set([HELPER_KIND, SEAT_KIND]);
const SEAT_SECTION = 'codex-dispatch.md § Seat job';
const JOB_NAMES = ['discovery', 'audit', 'general'];
const LIST_JOBS = new Set(['review', 'doneCheck', 'panel', 'research']);
const RECORD_REL = '.claude/audit/codex-jobs.jsonl';
const RUNNING_REL = '.claude/audit/codex-running';
const RUNNING_LINGER_MS = 60 * 60000;
const LEFTOVER_MS = 24 * 60 * 60000;
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const WORKER_WAIT = path.join(__dirname, 'codex-worker-wait.js');
const PARTIAL_REASON = 'partial — Codex cancelled at the limit';
const STALL_REASON = 'stalled — no Codex output for 6 minutes';
const LOST_WORKER_REASON = 'the Codex worker exited before it took the job';
const GONE_WORKER_REASON = 'the Codex worker exited while the job was running';
const GONE_KEEPER_REASON = 'the box\'s keeper exited while the job was running';
const NEVER_REPORTED = 'the box never reported its launch';
const DIRECT_KEEP_MS = 7 * 24 * 60 * 60000;
const DIRECT_PARTIAL_BYTES = 64 * 1024;
const FINAL_STAGES = ['end', 'carry', 'copy', 'checks', 'after', 'free'];
const FINALIZE_WAIT_MS = 30000;
const START_WINDOW_MS = 5 * 60000;
const FINALIZE_STALE_MS = 10 * 60000;
const KEEPER_QUIET_MS = 10000;
const LOST_REASON = 'lost — the Codex companion holds no record of the job';
const NOT_FOUND = /No job found for/;
const LOST_RECHECK_MS = 2000;
const SEARCH_HOLD_MS = 30000;
const SESSION_LINE = /^Codex session ID:[ \t]*(\S+)[ \t]*\r?$/gm;
const SESSION_TRAILER = /\r?\n?Codex session ID:[^\r\n]*\r?\nResume in Codex:[^\r\n]*\r?\n?$/;
const NO_FINAL_MESSAGE = 'Codex did not return a final message.';
const NO_VERDICT = 'no verdict returned';
const NO_OUTPUT = 'no output returned';
const TAIL_LINES = 5;
const TAIL_CHARS = 400;
const LOG_TIME = /^\[(\d{4}-\d{2}-\d{2}T[^\]\s]+)\]/;
const NODE_WARNING = /^\(node:\d+\) (?:\[[A-Z]+\d+\] )?[A-Za-z]*Warning: /;
const DONE_CHECK_VERDICT = /^\s*(?:[-*+]\s+)?\*\*Verdict: (?:(PASS)\*\*|(FAIL)\b)/;
const BOLD_VERDICT = /^\s*\*\*(NO-GO|GO)(?:[.:!]|\s+[—–-]\s[^*]*)?\*\*[.:!]?\s*$/;

function print(obj, callback) { process.stdout.write(JSON.stringify(obj) + '\n', callback); }
function warn(line) { process.stderr.write(line + '\n'); }
function sleepUntil(t) {
  const ms = t - Date.now();
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function usage(message) {
  print({ error: message });
  process.exitCode = 2;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opts[a.slice(2)] = true;
    else { opts[a.slice(2)] = next; i++; }
  }
  return opts;
}

const isPositive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

function readConfigBlock(root, key) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8'));
    return cfg && typeof cfg[key] === 'object' && cfg[key] ? cfg[key] : {};
  } catch {
    return {};
  }
}

const readCodexConfig = (root) => readConfigBlock(root, 'codex');

function resolveLimit(codex, flag) {
  let limit = DEFAULT_LIMIT_MINUTES;
  if ('timeLimitMinutes' in codex) {
    if (isPositive(codex.timeLimitMinutes)) limit = codex.timeLimitMinutes;
    else warn(`codex.timeLimitMinutes is ${JSON.stringify(codex.timeLimitMinutes)}, not a positive number of minutes — using ${limit}.`);
  }
  if (flag !== undefined) {
    const n = Number(flag);
    if (flag !== true && isPositive(n)) limit = n;
    else warn(`--limit-minutes is ${JSON.stringify(flag)}, not a positive number of minutes — using ${limit}.`);
  }
  return limit;
}

// A seat job's limit is the dispatch's, never shorter than the repo's Codex limit.
function seatLimit(codex, flag) {
  const repo = resolveLimit(codex, undefined);
  return flag === undefined ? repo : Math.max(repo, resolveLimit({ timeLimitMinutes: repo }, flag));
}

function repoEffort(codex) {
  if (!('effort' in codex)) return null;
  if (codexEntry.effortLevel(codex.effort)) return codex.effort;
  warn(`codex.effort is ${JSON.stringify(codex.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

// This job's Codex entry in the repo's `jobs` (lib/codex-entry.js), or null.
function jobEntry(root, name) {
  if (name === undefined) return null;
  const entry = readConfigBlock(root, 'jobs')[name];
  if (codexEntry.isCodexValue(entry)) return { model: 'codex' };
  return codexEntry.codexEntry(entry) ? entry : null;
}

function jobEffort(entry, name) {
  if (!entry || !('effort' in entry)) return null;
  if (codexEntry.effortLevel(entry.effort)) return entry.effort;
  warn(`jobs.${name}.effort is ${JSON.stringify(entry.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

// Shape only: a name that cannot be read as a flag or carry a space. Which names exist is Codex's to answer.
function jobModel(entry, name) {
  if (!('codexModel' in entry)) return null;
  if (codexEntry.modelName(entry.codexModel)) return entry.codexModel;
  warn(`jobs.${name}.codexModel is ${JSON.stringify(entry.codexModel)}, not a Codex model name (letters, digits, '.', '_', ':' and '-', opening with a letter or digit) — not sent.`);
  return null;
}

function companionSlot(opts, root, entry, entryName) {
  const kind = opts.kind === 'done-check' ? 'doneCheck' : opts.kind;
  const job = kind === HELPER_KIND ? entryName : LIST_JOBS.has(kind) ? kind : undefined;
  const resolved = job ? presets.resolvePreset({ root }) : null;
  const list = resolved?.lists?.[job];
  let selected = opts.model;
  if (!selected && (kind === HELPER_KIND || kind === 'doneCheck') && typeof entry?.model === 'string') {
    selected = jobModel(entry, entryName) || 'codex';
  }
  if (!selected && list) {
    const { codexModels } = presets.codexAccount();
    selected = list.find((item) => presets.eligibleCodex(item, codexModels))?.model;
    if (!selected) return { model: null, unavailable: `no Codex model of the ${job} list is on this account` };
  }
  const effort = list?.find((item) => item.model === selected)?.effort ?? null;
  const repo = resolved?.repoLists?.includes(job);
  return { model: selected && selected !== 'codex' ? selected : null, repoEffort: repo ? effort : null, shippedEffort: repo ? null : effort };
}

// A seat setting's effort and model as sent; a value the entry names outside the levels or the shape is
// not sent and is named on stderr.
function seatEffort(setting, role) {
  if (!setting || !('effort' in setting.entry)) return null;
  if (setting.effort) return setting.effort;
  warn(`${role}.effort is ${JSON.stringify(setting.entry.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

function seatModel(setting, role) {
  if (!setting || !('codexModel' in setting.entry)) return null;
  if (setting.codexModel) return setting.codexModel;
  warn(`${role}.codexModel is ${JSON.stringify(setting.entry.codexModel)}, not a Codex model name (letters, digits, '.', '_', ':' and '-', opening with a letter or digit) — not sent.`);
  return null;
}

// Row 6 of the gear resolver for this session's active gear context, the dispatch's --effort as its
// explicit rung. A value naming no level (`not lowered`, `as today`) sends the repo's setting, else
// none; a resolver that cannot run leaves today's rule. A job's entry — a helper job's, or a seat's
// setting — is a repo setting: under a campaign's gear and over the feature's. `entryEffort` is read
// only where the dispatch names no --effort.
function resolveEffort(codex, opts, root, entryEffort, shippedEffort = null) {
  const explicit = 'effort' in opts ? opts.effort : undefined;
  const entry = explicit === undefined ? entryEffort() : null;
  try {
    const gears = require('./lib/gears');
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
    const v = gears.valueOf({ setting: 6, explicit, root, tree: resolveDeclaredTree(root, session), session, env: process.env });
    const geared = v.source === 'campaign' || (v.source === 'gear' && !entry);
    if (geared && Object.hasOwn(gears.EFFORT_LEVELS, v.value)) return gears.EFFORT_LEVELS[v.value];
  } catch { /* today's rule below */ }
  if (explicit !== undefined) return explicit;
  return entry || repoEffort(codex) || shippedEffort;
}

function versionKey(v) {
  return String(v || '0').split('.').map((p) => parseInt(p, 10) || 0);
}

function compareVersionsDesc(a, b) {
  const x = versionKey(a.version);
  const y = versionKey(b.version);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] || 0) - (x[i] || 0);
    if (d) return d;
  }
  return 0;
}

let codexDataDir = null;

function findCompanion(cwd) {
  if (process.env.NEXUS_CODEX_COMPANION) return { path: process.env.NEXUS_CODEX_COMPANION };
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(path.join(configDir, 'plugins', 'installed_plugins.json'), 'utf8'));
  } catch {
    return { unavailable: 'the Codex plugin is not installed (no installed-plugins registry)' };
  }
  const plugins = (registry && registry.plugins) || registry || {};
  const key = Object.keys(plugins).find((k) => k.startsWith('codex@'));
  const entries = key && Array.isArray(plugins[key]) ? plugins[key].filter((e) => e && e.installPath) : [];
  const win = process.platform === 'win32';
  const norm = (p) => { const r = path.resolve(String(p || '')); return win ? r.toLowerCase() : r; };
  const here = norm(cwd);
  const forHere = entries.filter((e) => e.projectPath && norm(e.projectPath) === here);
  const pool = forHere.length ? forHere : entries.filter((e) => e.scope === 'user');
  if (!pool.length) return { unavailable: 'the Codex plugin is not installed for this directory' };
  const chosen = pool.slice().sort(compareVersionsDesc)[0];
  const script = path.join(chosen.installPath, 'scripts', 'codex-companion.mjs');
  if (!fs.existsSync(script)) return { unavailable: `the Codex companion is missing at ${script}` };
  if (!process.env.CLAUDE_PLUGIN_DATA) codexDataDir = path.join(configDir, 'plugins', 'data', key.replace(/[^A-Za-z0-9_-]/g, '-'));
  return { path: script };
}

// NODE_OPTIONS for the companion's `task` call: the worker wait, after whatever the shell set.
function workerWaitEnv() {
  if (!fs.existsSync(WORKER_WAIT)) return {};
  const flag = `--require "${WORKER_WAIT.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
  const own = process.env.NODE_OPTIONS;
  return { NODE_OPTIONS: own ? `${own} ${flag}` : flag, NEXUS_CODEX_WORKER_WAIT: flag };
}

// Drops Node's own warning lines, and the `(Use \`node --trace-…` hint right after one.
function dropWarnings(text) {
  const kept = [];
  let afterWarning = false;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (NODE_WARNING.test(line)) { afterWarning = true; continue; }
    if (afterWarning && line.startsWith('(Use `node --trace-')) { afterWarning = false; continue; }
    afterWarning = false;
    kept.push(line);
  }
  return kept.join('\n').trim();
}

// The tree the record names for a seat job of the earlier design, which ran through the companion, sent as --cwd
// on every call a wait, collect or watch makes for it. Null for a job of any other kind.
let jobTree = null;

function companion(script, args, timeoutMs, extraEnv = {}) {
  const folder = jobTree && args[0] !== 'task' ? ['--cwd', jobTree] : [];
  const res = spawnSync(process.execPath, [script, ...args, ...folder], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(codexDataDir ? { CLAUDE_PLUGIN_DATA: codexDataDir } : {}),
      MSYS_NO_PATHCONV: '1',
      MSYS2_ARG_CONV_EXCL: '*',
      ...extraEnv,
    },
    timeout: timeoutMs,
    windowsHide: true,
  });
  const ok = res.status === 0 && !res.error;
  const reason = dropWarnings(res.stderr) || (res.error && res.error.message) || `the Codex companion exited ${res.status}`;
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* text output, or none */ }
  return { ok, stdout: res.stdout || '', json, reason };
}

const windowMs = (limitMs) => Math.min(QUIET_LIMIT_MS, limitMs);

/** The critic-round schedule's refusal for a labelled spec or plan review round, or null (lib/round-gate.js). */
function roundRefusal(opts, promptFile) {
  try {
    const gate = require('./lib/round-gate');
    const parsed = gate.parseLabel(opts.label);
    if (!parsed || !parsed.kind) return null;
    const text = fs.readFileSync(promptFile, 'utf8');
    const record = typeof opts.record === 'string' && opts.record.trim() ? path.resolve(opts.record) : null;
    if (parsed.round === gate.LAST_ROUND && !record && !gate.ownerOrdered(text)) {
      return `critic round ${parsed.round} needs --record {the absolute path of the feature's review-critic.md}, the record the critic-round schedule is checked against — no job started`;
    }
    const verdict = gate.decide({
      round: parsed.round, kind: parsed.kind, text, readRecord: () => gate.readIfFile(record), recordName: record || 'the review record',
    });
    return verdict.refused ? `${verdict.reason} No job started.` : null;
  } catch {
    return null;
  }
}

function cmdStart(opts) {
  const callStart = Date.now();
  if (!opts['prompt-file'] || opts['prompt-file'] === true) return usage('start needs --prompt-file <path>');
  const promptFile = path.resolve(opts['prompt-file']);
  if (!fs.existsSync(promptFile)) return usage(`prompt file not found: ${promptFile}`);
  if ('effort' in opts && !codexEntry.effortLevel(opts.effort)) {
    return usage(`--effort is ${JSON.stringify(opts.effort)}, not one of the Codex levels (${LEVELS_TEXT}) — no job started`);
  }
  if ('kind' in opts && !KINDS.includes(opts.kind)) return usage(`--kind is ${JSON.stringify(opts.kind)}, not one of ${KINDS.join(', ')} — no job started`);
  if ('model' in opts && ([SEAT_KIND, 'mining'].includes(opts.kind) || !codexEntry.modelName(opts.model))) {
    return usage('--model needs a Codex model name on a companion job other than mining — no job started');
  }
  if ('job-name' in opts && !JOB_NAMES.includes(opts['job-name'])) return usage(`--job-name is ${JSON.stringify(opts['job-name'])}, not one of ${JOB_NAMES.join(', ')} — no job started`);
  if ('label' in opts && (typeof opts.label !== 'string' || !opts.label.trim())) return usage('--label needs the text of the label — no job started');
  if ('expect-route' in opts && !['direct', 'plugin'].includes(opts['expect-route'])) return usage('--expect-route needs direct or plugin — no job started');
  if (opts.kind === SEAT_KIND && 'expect-route' in opts) return usage('--expect-route cannot be used on a seat job — no job started');
  const seat = opts.kind === SEAT_KIND ? seatArgs(opts) : null;
  if (seat && seat.usage) return usage(seat.usage);
  const refusal = roundRefusal(opts, promptFile);
  if (refusal) return print({ refused: true, reason: refusal });
  const root = process.cwd();
  sweepRunning(root);
  const codex = readCodexConfig(root);
  let setting = null;
  if (seat) {
    const decided = seats.seatDecision({ role: seat.role, root, tree: seat.tree, slug: seat.slug, spawned: seat.spawned });
    if (!decided.codex && (seat.write || decided.closed)) return print({ refused: true, reason: `${decided.reason} — no job started`, ...tableField() });
    const questionRefusal = questionPhaseRefusal(seat);
    if (questionRefusal) return print({ refused: true, reason: `${questionRefusal} — no job started`, ...tableField() });
    if (seat.write) {
      const machine = seatCheck.standing();
      if (machine.state !== 'pass') return print({ refused: true, reason: `${machine.reason} — no job started`, ...tableField() });
    }
    setting = decided.setting || null;
  }
  const limit = seat ? seatLimit(codex, opts['limit-minutes']) : resolveLimit(codex, opts['limit-minutes']);
  const jobName = opts.kind === 'done-check' ? 'doneCheck' : opts['job-name'];
  const job = seat ? null : jobEntry(root, jobName);
  const slot = seat ? null : companionSlot(opts, root, job, jobName);
  const entryEffort = () => seat ? seatEffort(setting, seat.role) : jobEffort(job, jobName) || slot.repoEffort;
  const effort = resolveEffort(codex, opts, root, entryEffort, slot?.shippedEffort);
  const model = seat ? seatModel(setting, seat.role) : slot.model;
  const label = seat ? seats.seatLabel({ slug: seat.slug, role: seat.role, unit: seat.unit, model }) : opts.label;
  if (seat) return startSeat({ seat, promptFile, limit, effort, model, label, root, callStart });
  const { route, why } = codexRoute(root);
  const routeFields = route === 'direct' ? { route } : why === SWITCH_OFF ? {} : { route, directSkipped: { why } };
  let closeMs = 0;
  const unavailable = (reason, extra = {}) => print({
    ...(Date.now() - closeMs < callStart + windowMs(limit * 60000) ? { unavailable: reason, earlyFailure: true } : { unavailable: reason }),
    ...routeFields, ...extra,
  });
  if (opts['expect-route'] && opts['expect-route'] !== route) {
    return unavailable(`expected the ${opts['expect-route']} route but start resolved the ${route} route — no job started`);
  }
  if (route === 'direct') return startDirect({ root, kind: opts.kind || null, label: label ?? null, promptFile, limit, effort, model, slot, unavailable });

  const labelled = label !== undefined;
  let intent = newIntent();
  let recordError = null;
  const at = new Date();
  const wroteIntent = appendRecord({
    type: 'intent', intent, label: labelled ? label : null, kind: opts.kind || null, model, effort: effort || null,
    at: at.toISOString(), deadline: new Date(at.getTime() + limit * 60000).toISOString(),
  });
  if (wroteIntent !== true) {
    if (labelled) return unavailable(wroteIntent);
    recordError = wroteIntent;
    intent = null;
  }
  if (slot.unavailable) {
    if (intent) appendRecord({ type: 'unstarted', intent, reason: slot.unavailable });
    return unavailable(slot.unavailable);
  }
  const found = findCompanion(root);
  if (found.unavailable) {
    if (intent) appendRecord({ type: 'unstarted', intent, reason: found.unavailable });
    return unavailable(found.unavailable);
  }
  const closeStart = Date.now();
  const servers = closeServers('start', null, root);
  closeMs = Date.now() - closeStart;

  const startedAt = new Date();
  const res = launchTask(found, { promptFile, effort, model });
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) return unavailable(res.ok ? 'the Codex companion returned no job id' : res.reason, servers);
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  const out = { jobId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString(), effort: effort || null, model };
  if (intent) {
    const logFile = typeof res.json.logFile === 'string' && res.json.logFile ? { logFile: res.json.logFile } : {};
    const wrote = appendStartedJob(root, { type: 'job', intent, jobId, startedAt: out.startedAt, deadline: out.deadline, ...logFile },
      { label: labelled ? label : null, kind: opts.kind || null, seat: null, unit: null, model });
    if (wrote !== true) recordError = wrote;
  }
  if (recordError) out.recordError = recordError;
  print({ ...out, ...routeFields, ...servers });
}

function startDirect({ root, kind, label, promptFile, limit, effort, model, slot, unavailable }) {
  const box = seatBox.newBoxId();
  const intent = newIntent();
  const now = Date.now();
  const startedAt = new Date(now).toISOString();
  const deadline = new Date(now + limit * 60000).toISOString();
  const route = 'direct';
  const wroteIntent = appendRecord({ type: 'intent', intent, label, kind, model, effort: effort || null, at: startedAt, deadline, box, route }, root);
  if (wroteIntent !== true) return unavailable(wroteIntent);
  const unstarted = (reason) => {
    const wrote = appendRecord({ type: 'unstarted', intent, reason }, root);
    return unavailable(reason, wrote === true ? {} : { recordError: wrote });
  };
  let lines;
  try { lines = readRecord(root); } catch (err) { return unstarted(unreadableRecord(err)); }
  if (!lines.some((row) => row?.type === 'intent' && row.intent === intent && row.box === box)) {
    return unstarted(`the Codex job record (${RECORD_REL}) does not contain the direct launch intent`);
  }
  if (slot.unavailable) return unstarted(slot.unavailable);
  dropOldDirectBoxes(root, lines);
  const began = seatBox.start({
    tree: root, sandbox: 'read-only', model, effort, promptFile, boxId: box, limitMs: (limit + 120) * 60000,
    direct: { jobKind: kind, label, sessionRoot: root, startedAt, deadline },
  });
  if (began.unavailable && !began.launchClaimed) return unstarted(began.unavailable);
  const launch = began.launchClaimed ? { launchUncertain: true } : {};
  const fields = { jobId: box, box, route, startedAt, deadline, ...launch };
  const locked = withJobLock(root, box, () => {
    let current;
    try { current = readRecord(root); } catch { /* the append still reports its own result */ }
    if (current?.some((l) => l?.type === 'job' && l.jobId === box)) return true;
    return appendStartedJob(root, { type: 'job', intent, ...fields }, { label, kind, seat: null, unit: null, model });
  });
  const recordError = locked === true ? {} : { recordError: locked || 'the Codex job record lock could not be taken' };
  if (began.launchClaimed) return unavailable(began.unavailable, { ...fields, ...recordError, earlyFailure: true });
  return print({ ...fields, effort: effort || null, model, ...recordError });
}

// A seat job's start (lib/seat-box.js): the tree is reserved under the box id first, with what the job's end is
// finished from — the intent, the safety copy, the coordinating session and its phase token — so any session root
// reaches the job from the reservation alone; the keeper is started after that, and its own facts added once known.
// The copy and every change to the reservation are made under the tree's lock, each change only while the
// reservation is still this start's.
function startSeat({ seat, promptFile, limit, effort, model, label, root, callStart }) {
  let giveBack = () => {};
  const unavailable = (why, extra = {}) => {
    giveBack();
    return print({ ...(Date.now() < callStart + windowMs(limit * 60000) ? { unavailable: why, earlyFailure: true } : { unavailable: why }), ...extra, ...tableField() });
  };
  const ready = seatBox.available();
  if (ready.unavailable) return unavailable(ready.unavailable);
  const boxId = seatBox.newBoxId();
  const intent = newIntent();
  const at = new Date();
  const marks = sessionMarks(root);
  const took = seats.reserveTree(seat.tree, {
    intent, label, sessionRoot: root, at: at.toISOString(), jobId: boxId, box: { id: boxId }, session: marks.session, token: marks.token,
  });
  if (took.held) return print({ refused: true, reason: `${heldText(seat.tree, took.held)} — one seat job per tree; no job started`, ...tableField() });
  if (took.error) return unavailable(took.error);
  const own = { intent, jobId: boxId };
  giveBack = () => withTreeLock(seat.tree, () => seats.releaseTree(seat.tree, own), () => false);
  const prepared = withTreeLock(seat.tree, () => prepareSeat({ seat, intent, label, model, at, limit, boxId, file: took.file, own }),
    (left) => ({ unavailable: `another call holds the tree's lock (${treeLockFile(seat.tree)})${left}, so the job's safety copy cannot be made now — no job started` }));
  if (prepared.unavailable) return unavailable(prepared.unavailable);
  const { intentLine, copy } = prepared;
  const wroteIntent = appendRecord(intentLine);
  if (wroteIntent !== true) return unavailable(wroteIntent);

  const startedAt = new Date();
  const began = seatBox.start({ tree: seat.tree, sandbox: seat.write ? 'workspace-write' : 'read-only', model, effort, promptFile, boxId, limitMs: limit * 60000 });
  if (began.launchClaimed) {
    giveBack = () => {};
    return unavailable(began.unavailable, { treeHeld: `the box (${boxId}) may hold a running job, so the tree stays held until its end is confirmed — \`seat-release --tree ${seat.tree}\` finishes it` });
  }
  if (began.unavailable) {
    appendRecord({ type: 'unstarted', intent, reason: began.unavailable });
    return unavailable(began.unavailable);
  }
  let recordError = null;
  const keeperSet = withTreeLock(seat.tree, () => seats.updateHeld(took.file, own, (h) => ({ box: { ...(h.box || {}), id: boxId, keeper: began.keeper } })), () => false);
  if (!keeperSet) {
    recordError = 'the tree\'s reservation could not be given the box\'s keeper; the box\'s own status still names it';
  }
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  const out = {
    jobId: boxId, box: boxId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString(), effort: effort || null, model,
    label, tree: seat.tree, unit: seat.unit, write: seat.write, ...(copy ? { copy } : {}), ...tableField(),
  };
  const wrote = appendStartedJob(root, { type: 'job', intent, jobId: boxId, box: boxId, startedAt: out.startedAt, deadline: out.deadline },
    { label, kind: SEAT_KIND, seat: seat.role, unit: seat.unit, model });
  if (wrote !== true) recordError = wrote;
  if (recordError) out.recordError = recordError;
  const note = seatRecordsAt(() => {
    seatRecords.writeSkillLines({ root, role: seat.role, skills: seat.skills, ...marks });
    seatRecords.writeStartRow({ root, role: seat.role, ...marks });
  });
  if (note) out.recordsNote = note;
  print(out);
}

// Under the tree's lock: the safety copy and the intent the job's end is finished from, written into the reservation.
function prepareSeat({ seat, intent, label, model, at, limit, boxId, file, own }) {
  const uncommitted = seats.gitChanged(seat.tree);
  if (seat.write && uncommitted === null) {
    return { unavailable: 'the tree\'s uncommitted files could not be listed — git status gave no answer — so no safety copy can be made' };
  }
  let copy = null;
  if (seat.write && uncommitted) {
    try {
      seatCopy.dropCommitted(seat.tree, uncommitted);
      copy = seatCopy.makeCopy({ tree: seat.tree, intent, unit: seat.unit, files: uncommitted, otherWork: seat.otherWork }).dir;
    } catch (err) {
      return { unavailable: `the safety copy of the tree's uncommitted files could not be made: ${err.message}` };
    }
  }
  const intentLine = {
    type: 'intent', intent, label, kind: SEAT_KIND, model, at: at.toISOString(),
    deadline: new Date(at.getTime() + limit * 60000).toISOString(), box: boxId,
    tree: seat.tree, seat: seat.role, unit: seat.unit, write: seat.write, slug: seat.slug, skills: seat.skills,
    otherWork: seat.otherWork, changedBefore: uncommitted ? uncommitted.map((f) => f.path) : null, copy,
  };
  if (!seats.updateHeld(file, own, { intentLine, copy })) {
    return { unavailable: 'the tree\'s reservation could not be given the job\'s intent, which the job\'s end is finished from' };
  }
  return { intentLine, copy };
}

// The tree's lock, beside its reservation: every change to the reservation, the job's end being finished, and
// `seat-release --close`'s drop of the tree's copies run under it, one caller at a time.
const treeLockFile = (tree) => seats.reservationFile(tree).replace(/\.json$/, '.lock');

function withTreeLock(tree, fn, busy) {
  const lock = treeLockFile(tree);
  const token = fileLock.newToken();
  if (!takeTreeLock(lock, token)) {
    const left = fileLock.stranded(lock);
    return busy(left ? ` (${left} was left by a call that stopped while clearing the lock: remove it by hand once no seat call runs)` : '');
  }
  try {
    return fn();
  } finally {
    fileLock.release(lock, token);
  }
}

// The coordinating session's id and phase token, which a seat job's records carry as a Claude seat's do.
function sessionMarks(root) {
  const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
  return { session, token: readRoundToken(root, session) };
}

// A seat record that cannot be written is a note beside the job, never a change to its outcome.
function seatRecordsAt(write) {
  try {
    write();
    return null;
  } catch (err) {
    return `a seat record could not be written: ${err.message}`;
  }
}

// The companion's `task` call, read-only.
function launchTask(found, { promptFile, effort, model }) {
  const args = ['task', '--background', '--prompt-file', promptFile, '--json'];
  if (effort) args.push('--effort', effort);
  if (model) args.push('--model', model);
  return companion(found.path, args, 120000, workerWaitEnv());
}

const newIntent = () => `${Date.now().toString(36)}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

// One of the sandbox check's two jobs, in a box of its own under the sandbox mode and settings a writing seat job
// carries: its intent, job and end lines, its own limit, held by its keeper too, cut there. Returns its state and the box's end, which is
// read from the box alone — the check's layouts hold no reservation. A start that may have launched its job
// (`launchClaimed`) counts as started with its end unconfirmed, so its layout is kept.
function checkJob(name, dir, promptFile) {
  const intent = newIntent();
  const boxId = seatBox.newBoxId();
  const at = new Date();
  const limitMs = seatCheck.JOB_MINUTES * 60000;
  appendRecord({
    type: 'intent', intent, label: `seat-check ${name}`, kind: SEAT_KIND, model: null, at: at.toISOString(),
    deadline: new Date(at.getTime() + limitMs).toISOString(), box: boxId, tree: dir, seat: null, unit: 'seat-check', write: true,
  });
  const startedAt = new Date();
  const began = seatBox.start({ tree: dir, sandbox: seatCheck.SANDBOX, effort: 'low', promptFile, boxId, limitMs });
  if (began.unavailable) {
    appendRecord({ type: 'unstarted', intent, reason: began.unavailable, ...(began.launchClaimed ? { launchClaimed: true } : {}) });
    if (began.launchClaimed) {
      return { state: 'unavailable', reason: began.unavailable, started: true, boxId, end: { end: 'unconfirmed', endReason: `the job may have launched: ${began.unavailable}` } };
    }
    return { state: 'unavailable', reason: began.unavailable, started: false };
  }
  const deadline = startedAt.getTime() + limitMs;
  const job = { startedAt: startedAt.toISOString(), deadline: new Date(deadline).toISOString() };
  appendStartedJob(process.cwd(), { type: 'job', intent, jobId: boxId, box: boxId, ...job },
    { label: `seat-check ${name}`, kind: SEAT_KIND, seat: null, unit: 'seat-check' });
  let s = boxRead(boxId, true);
  while (!TERMINAL.has(s.state) && Date.now() < deadline) {
    sleepUntil(Date.now() + WAIT_FLOOR_MS);
    s = boxRead(boxId);
  }
  let state = s.state;
  let reason = keeperCut(s) ? PARTIAL_REASON : s.reason || (s.status && s.status.reason) || null;
  if (!TERMINAL.has(state)) {
    const cut = seatBox.cut(boxId);
    s = boxRead(boxId, true);
    state = TERMINAL.has(s.state) ? s.state : 'cancelled';
    reason = cut.cut ? PARTIAL_REASON : cut.reason;
  }
  const end = boxEnd(boxId, { box: { id: boxId, keeper: began.keeper } });
  const thread = (s.status && s.status.thread) || null;
  recordEnd(boxId, state, reason, thread, { end: end.end, endReason: end.endReason, leftovers: end.leftovers || [] });
  return { state, reason, started: true, end, boxId };
}

// Runs the check's two jobs and, only once both ends are confirmed, records what the repository shows, whole.
// Never throws.
function runCheck(facts) {
  const record = { result: 'fail', reason: null, ...facts, at: null, layouts: {} };
  const finish = (reason) => {
    Object.assign(record, { result: reason ? 'fail' : 'pass', reason, at: new Date().toISOString() });
    try { seatCheck.writeRecord(record); } catch (err) { record.recordError = `the check's record could not be written: ${err.message}`; }
    return record;
  };
  const ready = seatBox.available();
  if (ready.unavailable) return finish(`the check could not run: ${ready.unavailable}`);
  let run;
  let brief;
  try {
    run = seatCheck.prepare();
    brief = path.join(run.dir, 'brief.md');
    fs.writeFileSync(brief, seatCheck.BRIEF);
  } catch (err) {
    return finish(`the check could not run: ${err.message}`);
  }
  const jobs = [];
  for (const { name, dir } of run.layouts) {
    let before;
    try { before = seatCheck.setUp(dir); } catch (err) { return finish(`the check could not run: ${err.message}`); }
    jobs.push({ name, dir, before, job: checkJob(name, dir, brief) });
  }
  const live = jobs.filter((j) => j.job.started && j.job.end.end !== 'confirmed');
  for (const j of jobs) {
    record.layouts[j.name] = {
      job: j.job.state, ...(j.job.reason ? { jobReason: j.job.reason } : {}),
      ...(j.job.started ? { end: j.job.end.end, endReason: j.job.end.endReason } : {}),
    };
  }
  if (live.length) {
    record.kept = run.dir;
    return finish(live.map((j) => `the ${j.name} job's end could not be confirmed: ${j.job.end.endReason}`).join('; '));
  }
  const unstarted = jobs.filter((j) => !j.job.started);
  const failed = unstarted.map((j) => `the ${j.name} job could not start: ${j.job.reason}`);
  for (const j of jobs.filter((x) => x.job.started)) {
    const read = seatCheck.judge(j.name, j.dir, j.before, j.job.end.leftovers);
    Object.assign(record.layouts[j.name], read.reading);
    failed.push(...read.failed);
  }
  if (!seatCheck.dropRun(run.dir)) record.kept = run.dir;
  for (const j of jobs.filter((x) => x.job.started)) seatCheck.dropRun(seatBox.boxDir(j.job.boxId));
  return finish(failed.length ? failed.join('; ') : null);
}

// The machine's sandbox check (lib/seat-check.js): a standing pass is reused; one check runs at a time,
// and a caller that finds one running waits for its record.
function cmdSeatCheck() {
  let facts;
  try {
    facts = seatCheck.machineFacts();
    const missing = seatCheck.versionMissing(facts);
    if (missing) return print({ result: 'fail', reason: `the check could not run: ${missing}`, ...facts });
    const now = seatCheck.standing(process.env, facts);
    if (now.state === 'pass') return print({ ...now.record, reused: true });
    const waitStart = Date.now();
    for (;;) {
      const lock = seatCheck.takeLock();
      if (lock.taken) break;
      if (lock.stranded) return print({ result: 'fail', reason: `the check could not run: ${lock.stranded} was left by a call that stopped while clearing the check's lock — remove it by hand`, ...facts });
      sleepUntil(Date.now() + 250);
      while (seatCheck.lockHeld()) sleepUntil(Date.now() + 250);
      const after = seatCheck.standing(process.env, facts);
      if (after.record && after.state !== 'owed' && Date.parse(after.record.at) >= waitStart) return print({ ...after.record, waited: true });
    }
  } catch (err) {
    return print({ result: 'fail', reason: `the check could not run: ${err.message}`, ...(facts || {}) });
  }
  try {
    return print(runCheck(facts));
  } finally {
    seatCheck.releaseLock();
  }
}

// Whether a role's seat runs on Codex now, and why not; never runs the check and never refuses.
function cmdSeat(opts) {
  for (const flag of ['role', 'slug']) {
    if (typeof opts[flag] !== 'string' || !opts[flag].trim()) return usage(`seat needs --${flag}`);
  }
  const role = opts.role;
  const root = process.cwd();
  const tree = typeof opts.tree === 'string' && path.isAbsolute(opts.tree) ? path.resolve(opts.tree) : root;
  const decided = seats.seatDecision({ role, root, tree, slug: opts.slug, spawned: opts.spawned === true });
  const setting = decided.setting || null;
  const model = setting ? seatModel(setting, role) : null;
  const effort = setting ? resolveEffort(readCodexConfig(root), {}, root, () => seatEffort(setting, role)) : null;
  const claude = (reason, extra = {}) => {
    const own = decided.gear ? { model: decided.gear.model, effort: null } : seats.claudeSeat(role, root);
    const from = decided.gear ? `, from the campaign gear ${decided.gear.gear}` : '';
    const named = own.model ? ` (${own.model}${own.effort ? `, effort ${own.effort}` : ''}${from})` : '';
    return print({
      role, engine: 'claude', model: own.model, effort: own.effort, ...(setting ? { codexModel: model, codexEffort: effort } : {}),
      reason, ...extra, disclosure: `${role} seat: Claude${named} — ${reason}`, read: SEAT_SECTION, ...tableField(),
    });
  };
  if (!decided.codex) return claude(decided.reason, decided.gear ? { gear: decided.gear.gear, claudeModel: decided.gear.model } : {});
  const ready = seatBox.available();
  if (ready.unavailable) return claude(`Codex is not available: ${ready.unavailable}`);
  if (seatCheck.lockHeld()) return claude('a sandbox check is running on this machine — call seat again once it has ended', { checkRunning: true });
  const machine = seatCheck.standing();
  if (machine.state === 'owed') {
    return claude(machine.reason, { checkOwed: true, check: `node "${__filename}" seat-check` });
  }
  if (machine.state !== 'pass') return claude(machine.reason);
  const sent = `${model || 'the user\'s default Codex model'}${effort ? `, effort ${effort}` : ''}`;
  return print({ role, engine: 'codex', model, effort, reason: decided.reason, disclosure: `${role} seat: Codex (${sent}) — ${decided.reason}, the sandbox check passed on this machine`, read: SEAT_SECTION, ...tableField() });
}

const tableField = () => {
  const file = codexEntry.seatTableFile();
  return file ? { seatTable: file } : {};
};

// A seat start's own flags, or `{usage}` naming what is missing.
function seatArgs(opts) {
  for (const flag of ['seat', 'unit', 'tree', 'slug']) {
    if (typeof opts[flag] !== 'string' || !opts[flag].trim()) return { usage: `a seat job needs --${flag} — no job started` };
  }
  if ('label' in opts) return { usage: 'a seat job\'s label is built from --slug, --seat and --unit, so --label is not taken — no job started' };
  if (!seats.isUnit(opts.unit)) return { usage: `--unit is ${JSON.stringify(opts.unit)}, not one of: ${seats.UNIT_TEXT} — no job started` };
  const questions = opts.unit === 'questions';
  if ('questions' in opts && !questions) return { usage: '--questions requires --unit questions — no job started' };
  let isDir = false;
  try { isDir = path.isAbsolute(opts.tree) && fs.statSync(opts.tree).isDirectory(); } catch { /* not a folder */ }
  if (!isDir) return { usage: `--tree is ${JSON.stringify(opts.tree)}, not the absolute path of a folder that exists — no job started` };
  let otherWork = [];
  if ('other-work' in opts) {
    try {
      otherWork = fs.readFileSync(path.resolve(String(opts['other-work'])), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    } catch (err) {
      return { usage: `--other-work names a file that cannot be read (${err.message}) — no job started` };
    }
  }
  const skills = typeof opts.skills === 'string' ? opts.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  return {
    role: opts.seat, unit: opts.unit, tree: path.resolve(opts.tree), slug: opts.slug, write: !questions,
    spawned: opts.spawned === true, skills, otherWork,
  };
}

function cmdBrief(opts) {
  const seat = seatArgs(opts);
  if (seat.usage) return usage(seat.usage);
  const questionRefusal = questionPhaseRefusal(seat);
  if (questionRefusal) return usage(questionRefusal);
  for (const flag of ['unit-file', 'out']) {
    if (typeof opts[flag] !== 'string' || !opts[flag].trim()) return usage(`brief needs --${flag}`);
  }
  const root = process.cwd();
  const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
  const model = seatModel(seats.seatSettingOf(seat.role, root).setting, seat.role);
  const repoLimit = resolveLimit(readCodexConfig(root));
  try {
    return print(seatBrief.writeBrief({ ...seat, root, session, model, repoLimit,
      unitFile: path.resolve(opts['unit-file']), out: path.resolve(opts.out) }));
  } catch (err) {
    return usage(err.message);
  }
}

function questionPhaseRefusal({ role, write }) {
  if (!write && !/^yes\b/i.test(codexEntry.seatRow(role)?.questionPhase ?? '')) {
    return `the ${role}'s seat has no question phase`;
  }
  return null;
}

function heldText(tree, held) {
  if (isLegacy(held)) return `the tree ${tree} is held by ${legacyText(tree)}`;
  const by = held.jobId ? `seat job ${held.jobId}` : 'a seat job still starting';
  const label = held.label ? ` (${held.label})` : '';
  const from = held.sessionRoot ? `, started from ${held.sessionRoot}` : '';
  return `the tree ${tree} is held by ${by}${label}${from}`;
}

// After a writing seat job: the safety copy's look for gone files (lib/seat-copy.js), recorded as one
// `copy` line where it found any, and none where the record already holds the job's. Its outcome never changes the job's.
function safetyCopyAfter({ jobId, dir, root, intent, activity }) {
  try {
    const before = readRecord(root).find((l) => l && l.type === 'copy' && l.jobId === jobId);
    if (before) {
      const { type, jobId: recordedJob, at, ...out } = before;
      return out;
    }
  } catch { /* read as none */ }
  let found;
  try {
    found = seatCopy.checkCopy(dir);
  } catch (err) {
    found = { restored: [], changed: [], featureGone: [], reason: `the safety copy could not be read: ${err.message}` };
  }
  const changes = seatChecks.copyChanges({ files: found.changed, tree: intent.tree, role: intent.seat, slug: intent.slug, activity });
  const out = { copy: dir, ...found, ...changes };
  if (found.restored.length || found.changed.length || found.featureGone.length || found.reason) {
    appendRecord({ type: 'copy', jobId, at: new Date().toISOString(), ...out }, root);
  }
  return out;
}

// Ends a seat tree's Codex servers, the recorded one included, while no Codex job runs there, once the tree is not
// held: a tree a box job holds is given back first where its end is finished, and a reservation of the earlier
// design only with --legacy.
function cmdSeatRelease(opts) {
  if (typeof opts.tree !== 'string' || !path.isAbsolute(opts.tree)) return usage('seat-release needs --tree <the absolute path of the tree> [--close] [--legacy]');
  const tree = path.resolve(opts.tree);
  findCompanion(process.cwd());
  let res = null;
  const closeTree = () => {
    try {
      res = closeAndRecord('seat-release', null, tree, true);
    } catch (err) {
      res = { closed: [], workspaces: [], reason: `the Codex server close failed: ${err.message}` };
    }
  };
  const file = seats.reservationFile(tree);
  const reservation = seats.readReservation(tree);
  const unread = !reservation && fs.existsSync(file)
    ? { held: 'an unreadable reservation', heldReason: `the tree's reservation (${file}) cannot be read, so its holder cannot be told` }
    : null;
  const release = () => (isLegacy(reservation) ? releaseLegacy(tree, reservation, opts.legacy === true) : releaseBox(tree, reservation));
  const held = unread || (reservation ? release() : {});
  if (!held.held) closeTree();
  const row = (res && res.workspaces[0]) || { kept: 0, why: [] };
  const goneHere = held.safetyCopy && held.safetyCopy.featureGone && held.safetyCopy.featureGone.length;
  const copiesDropped = opts.close === true && !goneHere ? withTreeLock(tree, () => (fs.existsSync(file) ? 0 : seatCopy.dropAll(tree)), () => 0) : 0;
  const kept = opts.close === true && goneHere ? { copiesKept: 'this call found a gone feature file; its copy stays until it is put back or its removal committed' } : {};
  const boxes = opts.close === true ? { boxesDropped: dropBoxes(tree) } : {};
  print({ tree, serversClosed: res ? res.closed.length : 0, kept: row.kept, why: row.why, ...held, copiesDropped, ...kept, ...boxes, ...(res && res.reason ? { reason: res.reason } : {}) });
}

// A reservation of the earlier seat design, which ran seat jobs through the companion: no box, a companion job id,
// no job id, or the process evidence that design kept.
const isLegacy = (held) => Boolean(held) && (!held.box || !held.jobId || /^task-/.test(String(held.jobId)) || 'evidence' in held);
const LEGACY_HOLD = 'a reservation from the earlier seat design';
const legacyText = (tree) => `${LEGACY_HOLD} — \`seat-release --tree ${tree} --legacy\` clears it once no process naming the tree runs`;

// A reservation of the earlier design holds its tree until --legacy finds no process naming the tree.
function releaseLegacy(tree, held, legacy) {
  const holder = held.jobId || held.intent || LEGACY_HOLD;
  if (!legacy) return { held: holder, heldReason: legacyText(tree) };
  const found = treeWriters(tree, typeof held.tree === 'string' ? [held.tree] : []);
  if (found.reason) return { held: holder, heldReason: `${LEGACY_HOLD}: ${found.reason}, so no process naming the tree can be seen gone` };
  if (found.procs.length) {
    return { held: holder, heldReason: `${LEGACY_HOLD}: pid ${found.procs.map((p) => p.pid).join(', ')} names the tree and still runs` };
  }
  let left = '';
  const freed = withTreeLock(tree, () => seats.releaseTree(tree, { jobId: held.jobId, intent: held.intent }), (why) => { left = why; return null; });
  if (freed === null) return { held: holder, heldReason: `${LEGACY_HOLD}: another call holds the tree's lock${left} — call seat-release again` };
  if (!freed) return { held: holder, heldReason: `${LEGACY_HOLD}: the tree's reservation changed or could not be removed` };
  return { released: LEGACY_HOLD };
}

// The processes whose command line names the tree — as given, as `spellings` give it (the reservation's own), or
// through any of their real paths — this call and its own callers aside, or `{reason}`.
function treeWriters(tree, spellings = []) {
  const named = codexEntry.testSeam('NEXUS_CODEX_TREE_LIST');
  let override = null;
  try { override = named ? JSON.parse(named) : null; } catch { /* read as no override */ }
  const plat = process.platform;
  let exe;
  let args;
  if (Array.isArray(override) && override.length) [exe, ...args] = override;
  else if (plat === 'win32') {
    const script = "$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; " +
      'try { $p = @(Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object { ' +
      '[pscustomobject]@{ pid = [int]$_.ProcessId; ppid = [int]$_.ParentProcessId; cmd = $_.CommandLine } }); ' +
      '[Console]::Out.Write((ConvertTo-Json -InputObject $p -Compress -Depth 3)) } catch { exit 1 }';
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  } else {
    exe = 'ps';
    args = ['-eww', '-o', 'pid=,ppid=,args='];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: TREE_LIST_MS, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, LC_ALL: 'C' } });
  if (res.error || res.status !== 0) return { reason: `the process list could not be taken${res.error ? `: ${res.error.message}` : ''}` };
  const out = String(res.stdout || '');
  let procs;
  if (override || plat === 'win32') {
    try { procs = JSON.parse(out); } catch { return { reason: 'the process list is malformed' }; }
    if (!Array.isArray(procs)) return { reason: 'the process list is malformed' };
  } else {
    procs = out.split('\n').map((line) => /^\s*(\d+)\s+(\d+)(?:\s(.*))?$/.exec(line)).filter(Boolean)
      .map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), cmd: m[3] || '' }));
  }
  procs = procs.filter((p) => p && Number.isInteger(p.pid));
  if (!procs.length) return { reason: 'the process list is empty' };
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const mine = new Set();
  for (let pid = process.pid; Number.isInteger(pid) && pid > 0 && !mine.has(pid);) {
    mine.add(pid);
    pid = byPid.has(pid) ? byPid.get(pid).ppid : null;
  }
  const fold = (s) => (plat === 'win32' ? s.replace(/\//g, '\\').toLowerCase() : s);
  const roots = new Set();
  for (const p of [tree, ...spellings]) {
    roots.add(path.resolve(p));
    try { roots.add(fs.realpathSync.native(path.resolve(p))); } catch { /* the path as given */ }
  }
  const wants = [...roots].map((r) => fold(r.replace(/[\\/]+$/, '')));
  const names = (cmd) => {
    const text = fold(String(cmd || ''));
    return wants.some((w) => {
      for (let at = text.indexOf(w); at >= 0; at = text.indexOf(w, at + 1)) {
        if (!/[A-Za-z0-9._-]/.test(text.charAt(at + w.length))) return true;
      }
      return false;
    });
  };
  return { procs: procs.filter((p) => !mine.has(p.pid) && names(p.cmd)) };
}

// Ends forgotten Codex servers (lib/codex-servers.js) — this folder's, or with `workspace` null every
// folder's — and records one close line per folder where any ended. Whatever happens here, the job's
// own outcome stands: a failure, the module's loading included, is only a note beside it.
function closeAndRecord(trigger, excludeJob, workspace, all = false) {
  const { closeForgotten, defaultStateRoots } = require('./lib/codex-servers');
  const res = closeForgotten({ workspace, excludeJob, all, stateRoots: defaultStateRoots(codexDataDir) });
  const at = new Date().toISOString();
  for (const row of res.workspaces) {
    if (!row.closed) continue;
    const ages = res.closed.filter((c) => c.workspace === row.workspace).map((c) => c.ageMinutes);
    const wrote = appendRecord({ type: 'close', at, workspace: row.workspace, servers: row.closed, ages, trigger });
    if (wrote !== true && !res.reason) res.reason = wrote;
  }
  return res;
}

function cmdSweep() {
  findCompanion(process.cwd());
  let res;
  try {
    res = closeAndRecord('sweep', null, null);
  } catch (err) {
    res = { workspaces: [], reason: `the Codex server close failed: ${err.message}` };
  }
  const total = res.workspaces.reduce((t, w) => ({ closed: t.closed + w.closed, kept: t.kept + w.kept }), { closed: 0, kept: 0 });
  print(res.reason ? { workspaces: res.workspaces, total, reason: res.reason } : { workspaces: res.workspaces, total });
}

function closeServers(trigger, excludeJob, workspace = process.cwd()) {
  try {
    const res = closeAndRecord(trigger, excludeJob, workspace);
    return res.reason ? { serversClosed: res.closed.length, serversNote: res.reason } : { serversClosed: res.closed.length };
  } catch (err) {
    return { serversClosed: 0, serversNote: `the Codex server close failed: ${err.message}` };
  }
}

// The session root's record of Codex jobs, one JSON line each: an intent before the companion is
// called, then the job id or a confirmed `unstarted` disposition, and a close line per folder
// whose forgotten servers were ended. Returns true, or why not.
function appendRecord(line, root = process.cwd()) {
  const file = path.join(root, RECORD_REL);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(line)}\n`);
    return true;
  } catch (err) {
    return `the Codex job record (${RECORD_REL}) could not be written: ${err.message}`;
  }
}

// A collector can finish as soon as the job line is visible.
function appendStartedJob(root, line, fields) {
  const { jobId, startedAt, deadline } = line;
  const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
  const base = path.join(root, RUNNING_REL);
  const name = isSafeId(jobId) && `${jobId}.json`;
  const published = isSafeId(session) && name &&
    writeRunning(base, session, name, { ...fields, startedAt, deadline });
  const wrote = appendRecord(line, root);
  if (wrote !== true && published) unlinkRunning(base, session, name);
  return wrote;
}

function writeRunning(base, session, name, fields) {
  const dir = path.join(base, session);
  const file = path.join(dir, name);
  const tmp = `${file}.${process.pid}.tmp`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.mkdirSync(base, { recursive: true });
      if (!fs.lstatSync(base).isDirectory()) return false;
      fs.mkdirSync(dir, { recursive: true });
      if (!fs.lstatSync(dir).isDirectory()) return false;
      fs.writeFileSync(tmp, JSON.stringify(fields), { flag: 'wx' });
      fs.renameSync(tmp, file);
      return true;
    } catch (err) {
      if (err.code !== 'EEXIST') unlinkRunning(base, session, path.basename(tmp));
      if (err.code !== 'ENOENT') break;
    }
  }
  return false;
}

function runningSessions(base) {
  try {
    if (fs.lstatSync(base).isDirectory()) {
      return fs.readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory() && isSafeId(entry.name));
    }
  } catch { /* no running directory to list */ }
  return [];
}

function unlinkRunning(base, session, name) {
  try {
    if (!fs.lstatSync(base).isDirectory()) return;
    const dir = path.join(base, session);
    if (fs.lstatSync(dir).isDirectory()) fs.unlinkSync(path.join(dir, name));
  } catch { /* already gone, or inaccessible */ }
}

function removeRunning(root, jobId) {
  if (!isSafeId(jobId)) return;
  const base = path.join(root, RUNNING_REL);
  for (const session of runningSessions(base)) unlinkRunning(base, session.name, `${jobId}.json`);
}

// A running file more than RUNNING_LINGER_MS past its deadline belongs to a job whose end never came; a temporary
// file or one with no deadline to read goes once a day old, and an empty session folder once RUNNING_LINGER_MS old.
function sweepRunning(root, now = Date.now()) {
  const base = path.join(root, RUNNING_REL);
  for (const session of runningSessions(base)) {
    const dir = path.join(base, session.name);
    let entries;
    try {
      if (!fs.lstatSync(dir).isDirectory()) continue;
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { continue; }
    for (const entry of entries) {
      const { name } = entry;
      const marker = /^([^.]+)\.json(?:\.[1-9]\d*\.tmp)?$/.exec(name);
      if (!entry.isFile() || !marker || !isSafeId(marker[1])) continue;
      const file = path.join(dir, name);
      try { if (runningStale(file, name, now)) unlinkRunning(base, session.name, name); } catch { /* another call removed it first */ }
    }
    try {
      const stat = fs.lstatSync(dir);
      if (stat.isDirectory() && now - stat.mtimeMs > RUNNING_LINGER_MS) fs.rmdirSync(dir);
    } catch { /* in use again, or already gone */ }
  }
}

function runningStale(file, name, now) {
  if (name.endsWith('.json')) {
    let deadline = NaN;
    try { deadline = Date.parse(JSON.parse(fs.readFileSync(file, 'utf8')).deadline); } catch { /* no deadline to read */ }
    if (Number.isFinite(deadline)) return now - deadline > RUNNING_LINGER_MS;
  }
  return now - fs.statSync(file).mtimeMs > LEFTOVER_MS;
}

const readRecord = (root = process.cwd()) => fs.readFileSync(path.join(root, RECORD_REL), 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
const unreadableRecord = (err) => `the Codex job record (${RECORD_REL}) could not be read: ${err.message}`;

function intentOf(lines, jobId) {
  const job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  return job ? lines.find((l) => l && l.type === 'intent' && l.intent === job.intent) : undefined;
}

// A record that cannot be read whole writes no end line: a collect never fails on its timing line. Returns
// the job's start and end times, `wrote` where this call appended the end line, or null where the record
// cannot say.
function recordEnd(jobId, state, reason, codexSession, extra = {}, root = process.cwd(), direct = null) {
  if (!fs.existsSync(path.join(root, RECORD_REL))) return null;
  return withJobLock(root, jobId, () => recordEndLocked(jobId, state, reason, codexSession, extra, root, direct));
}

function withJobLock(root, jobId, fn) {
  const key = createHash('sha256').update(jobId).digest('hex');
  const lock = path.join(root, path.dirname(RECORD_REL), 'codex-job-locks', `${key}.lock`);
  const token = fileLock.newToken();
  if (!takeTreeLock(lock, token)) return null;
  try { return fn(); } finally { fileLock.release(lock, token); }
}

function recordEndLocked(jobId, state, reason, codexSession, extra, root, direct) {
  let lines;
  try {
    lines = readRecord(root);
  } catch {
    return null;
  }
  let job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  let intent = intentOf(lines, jobId);
  if (!job && direct) {
    intent = lines.find((l) => matchesDirectRequest(l, direct) &&
      !lines.some((row) => row?.type === 'unstarted' && row.intent === l.intent));
    if (intent) {
      job = { type: 'job', intent: intent.intent, jobId, box: jobId, route: 'direct', startedAt: direct.startedAt, deadline: direct.deadline };
      if (seatBox.readBox(jobId).read === 'missing' && seatBox.claimOf(jobId) === 'launch') job.launchUncertain = true;
      if (appendRecord(job, root) !== true) return null;
    }
  }
  if (!intent) return null;
  const startedAt = job && job.startedAt;
  const before = lines.find((l) => l && l.type === 'end' && l.jobId === jobId);
  if (before) {
    removeRunning(root, jobId);
    return { startedAt, endedAt: before.endedAt, wrote: false, before };
  }
  const endedAt = new Date().toISOString();
  const why = reason ? { reason } : {};
  const link = codexSession ? { codexSession } : {};
  const appended = appendRecord({ type: 'end', label: intent.label, jobId, endedAt, state, ...why, ...link, ...extra }, root);
  if (appended === true) removeRunning(root, jobId);
  return { startedAt, endedAt, wrote: appended === true, ...(appended === true ? {} : { writeError: appended }) };
}

// A seat job of the earlier design, collected through the companion: its end is never confirmed while its
// reservation holds the tree, which only `seat-release --legacy` clears; the fallback and the finished steps are
// lib/seat-end.js's. `fields` go to the collect's output, `line` onto its end line.
function seatEndOf(a, out, codexSession, log) {
  const intent = a.intent;
  const tree = intent.tree;
  const reservation = seats.readReservation(tree);
  const unreadable = !reservation && fs.existsSync(seats.reservationFile(tree));
  const holds = unreadable || holdsTree(reservation, a.job, intent);
  let before = null;
  try { before = readRecord().find((l) => l && l.type === 'end' && l.jobId === a.job) || null; } catch { /* read as none */ }
  const cut = out.reason === PARTIAL_REASON || out.reason === STALL_REASON;
  const thread = seatChecks.threadIdOf(out.output, out.partial, codexSession ? `Codex session ID: ${codexSession}` : '', log())
    || (before && before.thread) || null;
  const end = unreadable
    ? { end: 'unconfirmed', endReason: `the tree's reservation (${seats.reservationFile(tree)}) cannot be read, so the job holding the tree cannot be told — it is never read as given back` }
    : holds ? { end: 'unconfirmed', endReason: legacyText(tree) }
    : { end: 'confirmed', endReason: (before && before.end === 'confirmed' && before.endReason) || 'the tree was already given back' };
  const questions = intent.write === false;
  const question = questions && out.state === 'completed' ? seatEndLib.questionHandback(intent.seat, out.output, intent.slug) : undefined;
  const fallback = seatEndLib.fallbackOf({ role: intent.seat, state: out.state, reason: out.reason, output: out.output, cut, questions, question });
  const questionsNote = question?.note
    ?? (question?.kind === 'block' ? 'relay the questions from the output of this earlier-design seat job' : undefined);
  let finishedSteps = [];
  try { finishedSteps = seatEndLib.finishedSteps({ tree, slug: intent.slug, role: intent.seat, since: intent.at }); } catch { /* none proven */ }
  const line = { ...end, ...fallback };
  return {
    fields: { ...line, finishedSteps, ...(holds || unreadable ? { checksWait: true } : questionsNote ? { questionsNote } : {}) },
    line: { ...line, ...(thread ? { thread } : {}) },
  };
}

// The tree's reservation is this job's: it names the job, or — where its job id was never written — the job's intent.
const holdsTree = (held, jobId, intent) => Boolean(held && (held.jobId === jobId || (!held.jobId && intent && held.intent === intent.intent)));

// After a seat job has ended: its hand-back row once, with the end line; its step-run records carried from the
// tree; and its minutes, for the coordinator's message table. A sandbox check's job has no seat and gets none.
function seatEnd(a, end) {
  const intent = a.intent;
  if (!intent || !intent.seat || typeof intent.tree !== 'string') return {};
  const root = process.cwd();
  const out = {};
  const marks = sessionMarks(root);
  const note = seatRecordsAt(() => {
    if (end && end.wrote) seatRecords.writeEndRow({ root, role: intent.seat, jobId: a.job, ...marks });
    out.stepRunsCarried = seatRecords.carryStepRuns({ root, tree: intent.tree, role: intent.seat, since: intent.at, ...marks });
  });
  if (note) out.recordsNote = note;
  const from = end && Date.parse(end.startedAt);
  const to = end && Date.parse(end.endedAt);
  if (Number.isFinite(from) && Number.isFinite(to)) out.minutes = Math.round(Math.max(0, to - from) / 6000) / 10;
  return out;
}

// The reason on the end line of a job this helper cut, at its limit or at a stall, else null. Its log
// still holds the partial, so a later `collect` can return it.
function cutReason(jobId, root = process.cwd()) {
  try {
    const end = readRecord(root).find((l) => l && l.type === 'end' && l.jobId === jobId);
    return end && (end.reason === PARTIAL_REASON || end.reason === STALL_REASON) ? end.reason : null;
  } catch {
    return null;
  }
}

// The intent `start` recorded for a job, or null where the record cannot say.
function recordedIntent(jobId) {
  try {
    return intentOf(readRecord(), jobId) || null;
  } catch {
    return null;
  }
}

// Every job recorded under exactly this label, newest first. A record that cannot be read whole is
// `unreadable`: a lost line might have been the one asked for, so it never answers `none`.
function cmdJobs(opts) {
  if (typeof opts.label !== 'string' || !opts.label.trim()) return usage('jobs needs --label <text>');
  const label = opts.label;
  let lines;
  try {
    lines = readRecord();
  } catch (err) {
    if (err.code === 'ENOENT') return print({ label, result: 'none' });
    return print({ label, result: 'unreadable', reason: unreadableRecord(err) });
  }
  const jobs = [];
  for (const line of lines) {
    if (!line || line.type !== 'intent' || line.label !== label) continue;
    if (lines.some((l) => l && l.type === 'unstarted' && l.intent === line.intent)) continue;
    let job = lines.find((l) => l && l.type === 'job' && l.intent === line.intent);
    if (!job && line.route === 'direct') {
      const request = directRequest(readBoxRequest(line.box), line.box);
      if (matchesDirectRequest(line, request) && directLaunchEvidence(line.box)) {
        job = { jobId: line.box, startedAt: request.startedAt, deadline: request.deadline };
      }
    }
    const where = line.kind === SEAT_KIND ? { tree: line.tree, unit: line.unit } : {};
    jobs.unshift(job
      ? { jobId: job.jobId, kind: line.kind, startedAt: job.startedAt, deadline: job.deadline, status: 'recorded', ...where }
      : { jobId: null, kind: line.kind, startedAt: line.at, deadline: line.deadline, status: 'started, id not recorded', ...where });
  }
  return print(jobs.length ? { label, result: 'found', jobs } : { label, result: 'none' });
}

function jobArgs(opts, sub) {
  if (!opts.job || opts.job === true) return usage(`${sub} needs --job <id>`);
  const deadline = Date.parse(opts.deadline);
  if (!opts.deadline || opts.deadline === true || Number.isNaN(deadline)) return usage(`${sub} needs --deadline <iso time>`);
  const parsed = typeof opts.started === 'string' ? Date.parse(opts.started) : NaN;
  const started = Number.isNaN(parsed) ? null : parsed;
  const intent = recordedIntent(String(opts.job)) || boxIntent(String(opts.job));
  const box = intent && (!Object.hasOwn(intent, 'route') || intent.route === 'direct') &&
    typeof intent.box === 'string' && BOX_ID_RE.test(intent.box) ? intent.box : null;
  const direct = Boolean(box && intent.route === 'direct');
  const found = box ? { path: null } : findCompanion(process.cwd());
  jobTree = !box && intent && intent.kind === SEAT_KIND && typeof intent.tree === 'string' ? intent.tree : null;
  const copy = intent && typeof intent.copy === 'string' ? intent.copy : null;
  return { job: String(opts.job), deadline, started, found, kind: intent ? intent.kind || null : null, copy, intent, box, direct };
}

// A job failure seen before the start plus the window (plus `extraMs`) is early.
function flagEarly(out, a, extraMs = 0) {
  if (a.started === null) return out;
  return Date.now() < a.started + windowMs(a.deadline - a.started) + extraMs ? { ...out, earlyFailure: true } : out;
}

const isJobFailure = (out) => out.state === 'failed' || out.state === 'cancelled' || (out.state === 'completed' && Boolean(out.reason));

function readStatus(script, job, waitMs, timeoutMs = waitMs + STATUS_GRACE_MS) {
  const args = waitMs > 0
    ? ['status', job, '--wait', '--timeout-ms', String(waitMs), '--json']
    : ['status', job, '--json'];
  const res = companion(script, args, timeoutMs);
  const record = res.json && res.json.job;
  if (!res.ok || !record || typeof record.status !== 'string') {
    return { state: 'unknown', readError: true, reason: res.ok ? 'the Codex companion returned no job state' : res.reason };
  }
  return { state: record.status, record };
}

// The time quiet is counted from: the newest timestamped log line, or --started for an empty log.
// Null where the log cannot be used, which never makes a stall.
function quietFrom(record, started) {
  if (!record || !record.logFile) return null;
  let text;
  try { text = fs.readFileSync(record.logFile, 'utf8'); } catch { return null; }
  if (text === '') return started;
  let newest = null;
  for (const line of text.split(/\r?\n/)) {
    const m = LOG_TIME.exec(line);
    const t = m ? Date.parse(m[1]) : NaN;
    if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

// A helper or seat job has no stall: silence is judged by its worker, or its box's keeper, alone.
function stallOf(record, started, kind) {
  if (SILENT_KINDS.has(kind)) return null;
  const from = quietFrom(record, started);
  if (from === null) return null;
  const now = Date.now();
  const testQuietMs = Number(codexEntry.testSeam('NEXUS_CODEX_QUIET_MS'));
  const due = from + (isPositive(testQuietMs) ? testQuietMs : QUIET_LIMIT_MS);
  return { due, stalled: now >= due, quietMinutes: Math.round((now - from) / 6000) / 10 };
}

function waitOnce(a, maxMs, kind, lostKind = kind) {
  if (a.box) return boxWaitOnce(a, maxMs);
  const t0 = Date.now();
  const waitMs = t0 >= a.deadline ? maxMs : Math.min(maxMs, a.deadline - t0);
  const waitEnd = t0 + waitMs;
  const budgetEnd = waitEnd + STATUS_GRACE_MS;

  const report = (s) => {
    if (s.readError) {
      sleepUntil(waitEnd);
      const out = { state: s.state, readError: true, reason: s.reason };
      if (Date.now() >= a.deadline) out.deadlinePassed = true;
      return out;
    }
    if (TERMINAL.has(s.state)) {
      const out = s.reason ? { state: s.state, reason: s.reason } : { state: s.state };
      if (s.lost) return lostFlag(out, s);
      return isJobFailure(out) ? flagEarly(out, a) : out;
    }
    const out = { state: s.state };
    const stall = stallOf(s.record, a.started, kind);
    if (stall && stall.stalled) Object.assign(out, { stalled: true, quietMinutes: stall.quietMinutes });
    if (Date.now() >= a.deadline) out.deadlinePassed = true;
    return out;
  };

  const readLimit = () => Math.min(STATUS_GRACE_MS, budgetEnd - Date.now());
  const lostCheck = { searchAgainAt: 0, readsEnd: budgetEnd, cap: STATUS_GRACE_MS };
  const readChecked = (ms, cap) => {
    const status = readStatus(a.found.path, a.job, ms, cap);
    return lostWorker(a.found.path, lostJob(a, status, lostKind, lostCheck), a.job, kind, readLimit());
  };
  const read = (wantMs) => {
    let state = readChecked(0, readLimit());
    while (!state.readError && !TERMINAL.has(state.state)) {
      const stall = stallOf(state.record, a.started, kind);
      if (stall?.stalled) break;
      const now = Date.now();
      const timeLeft = budgetEnd - now;
      const untilStall = stall ? Math.max(WAIT_FLOOR_MS, stall.due - now) : Infinity;
      const companionWait = Math.floor(Math.min(wantMs, untilStall, timeLeft - READ_SLACK_MS));
      if (companionWait < 1) break;
      state = readChecked(companionWait, timeLeft);
      const checkedStall = stall && companionWait === untilStall && untilStall < wantMs && Date.now() >= stall.due;
      if (!checkedStall) break;
      wantMs = waitEnd - Date.now();
    }
    return state;
  };

  let s = read(waitMs);
  while (s.readError && waitEnd - Date.now() > WAIT_FLOOR_MS) {
    sleepUntil(Date.now() + WAIT_FLOOR_MS);
    s = read(waitEnd - Date.now());
  }
  return report(s);
}

function cmdWait(opts) {
  const a = jobArgs(opts, 'wait');
  if (!a) return;
  if (opts.kind !== undefined && !KINDS.includes(opts.kind)) return usage(`--kind is ${JSON.stringify(opts.kind)}, not one of ${KINDS.join(', ')}`);
  if (a.found.unavailable) return print(flagEarly({ state: 'failed', reason: a.found.unavailable }, a));
  const max = Number(opts['max-seconds']);
  return print(waitOnce(a, (isPositive(max) ? max : DEFAULT_MAX_SECONDS) * 1000, a.kind, a.kind || opts.kind));
}

// The last line naming the verdict wins: a reply that reconsiders ends on its final word. Only where no
// line names it, a first non-empty line that is one whole bold verdict counts (`**NO-GO — Round 1.**`).
function findVerdict(text) {
  const re = /^[-#>*\s]*verdict\s*:?[*\s]*(NO-GO|GO)\b/gim;
  let verdict = null;
  for (let m = re.exec(text); m; m = re.exec(text)) verdict = m[1].toUpperCase();
  if (verdict) return verdict;
  const first = String(text).split(/\r?\n/).find((l) => l.trim() !== '');
  const bold = first === undefined ? null : BOLD_VERDICT.exec(first);
  return bold ? bold[1] : null;
}

// A done-check body is usable with exactly one of the layout's verdict lines.
function doneCheckVerdict(text) {
  const found = String(text).split(/\r?\n/).map((l) => DONE_CHECK_VERDICT.exec(l)).filter(Boolean);
  return found.length === 1 ? found[0][1] || found[0][2] : null;
}

function readLog(record) {
  try {
    return fs.readFileSync(record.logFile, 'utf8');
  } catch {
    return '';
  }
}

function logTail(record) {
  const lines = dropWarnings(readLog(record || {})).split(/\r?\n/).map((l) => l.replace(LOG_TIME, '').trim()).filter(Boolean);
  const tail = lines.slice(-TAIL_LINES).join(' | ');
  return tail.length > TAIL_CHARS ? `…${tail.slice(-(TAIL_CHARS - 1))}` : tail;
}

function endedReason(s) {
  const tail = logTail(s.record);
  return tail ? `the job ended ${s.state} — its log ends: ${tail}` : `the job ended ${s.state}`;
}

// The companion's page for a completed job it holds no result for: a title, the `Job:` and `Status:`
// lines, and no report.
function isStatusPage(text, job) {
  const lines = String(text).split(/\r?\n/);
  return lines.length > 3 && lines[0].startsWith('# ') && lines[1] === '' && lines[2] === `Job: ${job}` && lines[3].startsWith('Status: ');
}

// The result's text where it holds a report, else ''. The session lines the companion appends, and its
// line for an empty final message, are not one.
function reportOf(text, job) {
  if (isStatusPage(text, job)) return '';
  const body = String(text).replace(SESSION_TRAILER, '').trim();
  return body === '' || body === NO_FINAL_MESSAGE ? '' : text;
}

// The last one named: the companion prints its own after the report, which may quote another.
function sessionOf(text) {
  const all = [...String(text).matchAll(SESSION_LINE)];
  return all.length ? all[all.length - 1][1] : null;
}

function completedReport(output, job, kind, session) {
  const link = session ? { codexSession: session } : {};
  if (ANY_OUTPUT_KINDS.has(kind)) {
    const report = reportOf(output, job);
    return { state: 'completed', output: report, verdict: null, ...(report ? {} : { reason: NO_OUTPUT }), ...link };
  }
  const verdict = kind === 'done-check' ? doneCheckVerdict(output) : findVerdict(output);
  return { state: 'completed', output, verdict, ...(verdict ? {} : { reason: NO_VERDICT }), ...link };
}

function finished(script, job, s, kind) {
  if (s.state === 'completed') {
    const res = companion(script, ['result', job], 60000);
    if (!res.ok) return { state: 'completed', output: '', verdict: null, reason: res.reason };
    return completedReport(res.stdout, job, kind, sessionOf(res.stdout));
  }
  const reason = s.reason || dropWarnings(s.record && s.record.errorMessage) || endedReason(s);
  return { state: s.state, output: '', verdict: null, reason };
}

// Windows: 'gone', { commandLine }, or null when no try could run or every command line was empty.
// A busy machine can push one query past its limit, so a try with no answer is asked once more.
function commandOverride(name) {
  try {
    const v = JSON.parse(process.env[name] || 'null');
    return Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? v : null;
  } catch {
    return null;
  }
}

function lookupProcess(pid) {
  for (let i = 1; ; i++) {
    const found = lookupOnce(pid);
    if (found !== null || i >= LOOKUP_TRIES) return found;
  }
}

// Get-CimInstance errors are non-terminating: without Stop a denied query prints 'none'.
function lookupOnce(pid) {
  const override = commandOverride('NEXUS_CODEX_LOOKUP');
  let exe;
  let args;
  if (override) {
    [exe, ...args] = override;
    args.push(String(pid));
  } else {
    const cls = /^\w+$/.test(process.env.NEXUS_CODEX_LOOKUP_CLASS || '') ? process.env.NEXUS_CODEX_LOOKUP_CLASS : 'Win32_Process';
    const script = "$ErrorActionPreference = 'Stop'; " +
      `try { $p = Get-CimInstance ${cls} -Filter 'ProcessId=${pid}' -ErrorAction Stop; ` +
      "if ($p) { [Console]::Out.Write('found:' + $p.CommandLine) } else { [Console]::Out.Write('none') } } catch { exit 1 }";
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const out = String(res.stdout || '').trim();
  if (out === 'none') return 'gone';
  const commandLine = out.startsWith('found:') ? out.slice('found:'.length) : '';
  return commandLine.trim() ? { commandLine } : null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWorkerOf = (commandLine, jobId) => /(?:^|[\s"])task-worker(?=[\s"]|$)/.test(commandLine)
  && new RegExp(`--job-id\\s+"?${escapeRe(jobId)}"?(?=\\s|$)`).test(commandLine);

// 'gone', 'other' (Windows: another program holds the pid), 'worker' (Windows: this job's), 'alive',
// or null (no answer).
function workerState(pid, jobId) {
  const platform = codexEntry.testSeam('NEXUS_CODEX_PLATFORM') || process.platform;
  if (platform !== 'win32') {
    try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'EPERM' ? 'alive' : e.code === 'ESRCH' ? 'gone' : null; }
  }
  const found = lookupProcess(pid);
  if (found === null || found === 'gone') return found;
  return isWorkerOf(found.commandLine, jobId) ? 'worker' : 'other';
}

const isStopped = (state) => state === 'gone' || state === 'other';

// A queued job whose worker is gone never runs, and a helper or seat job's worker gone mid-run never
// ends. Returns the status as a failed one, `pidFree` saying that no process holds the pid, or the
// status unchanged. Such a worker exits once it has saved the job's end, so a running job is read
// again before its worker counts as lost; a re-read that fails is a read error, never a failure.
function lostWorker(script, s, jobId, kind, rereadMs = COLLECT_STATUS_MS) {
  if (s.state !== 'queued' && !(s.state === 'running' && SILENT_KINDS.has(kind))) return s;
  const pid = s.record && s.record.pid;
  if (!(Number.isInteger(pid) && pid > 0)) return s;
  const state = workerState(pid, jobId);
  if (!isStopped(state)) return s;
  if (s.state === 'running') {
    const again = readStatus(script, jobId, 0, Math.max(WAIT_FLOOR_MS, rereadMs));
    if (TERMINAL.has(again.state)) return again;
    if (again.readError) return { ...again, record: s.record };
  }
  return { state: 'failed', reason: s.state === 'queued' ? LOST_WORKER_REASON : GONE_WORKER_REASON, record: s.record, pidFree: state === 'gone' };
}

// The record's word on a job: the log path `start` recorded, whether an `end` line stands and its
// reason, or null where the record cannot say.
function recordedJob(jobId) {
  let lines;
  try { lines = readRecord(); } catch { return null; }
  const job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  if (!job) return null;
  const logFile = typeof job.logFile === 'string' && job.logFile ? job.logFile : null;
  const end = lines.find((l) => l && l.type === 'end' && l.jobId === jobId);
  return { logFile, ended: Boolean(end), endReason: end ? end.reason || null : null };
}

// Only a file that is not there is absent: a read that fails any other way could hide a live job's file.
function isAbsent(file) {
  try {
    fs.statSync(file);
    return false;
  } catch (err) {
    return err.code === 'ENOENT';
  }
}

// The companion keeps a job's file beside its log, the same name with `.json`.
const filesGone = (logFile) => /\.log$/.test(logFile) && isAbsent(logFile) && isAbsent(logFile.replace(/\.log$/, '.json'));

// Whether a process runs this job's worker: true, false, or null where the search gives no answer.
function workerRunning(jobId) {
  const override = commandOverride('NEXUS_CODEX_WORKER_SEARCH');
  const platform = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  const listed = override || platform === 'win32';
  let exe;
  let args;
  if (override) {
    [exe, ...args] = override;
    args.push(jobId);
  } else if (platform === 'win32') {
    if (!/^[A-Za-z0-9_.:-]+$/.test(jobId)) return null;
    const script = "$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; " +
      `try { $p = @(Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%${jobId}%'" -ErrorAction Stop | ForEach-Object { [string]$_.CommandLine }); ` +
      '[Console]::Out.Write((ConvertTo-Json -InputObject $p -Compress)) } catch { exit 1 }';
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  } else {
    exe = 'ps';
    args = ['-eww', '-o', 'args='];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (res.error || res.status !== 0) return null;
  const text = String(res.stdout || '');
  let commandLines;
  if (listed) {
    try { commandLines = JSON.parse(text); } catch { return null; }
    if (!Array.isArray(commandLines) || !commandLines.every((l) => typeof l === 'string')) return null;
  } else {
    commandLines = text.split('\n').filter((l) => l.trim());
    if (!commandLines.length) return null;
  }
  return commandLines.some((l) => isWorkerOf(l, jobId));
}

function lostRecheckMs() {
  const own = Number(process.env.NEXUS_CODEX_LOST_RECHECK_MS);
  return process.env.NEXUS_CODEX_LOST_RECHECK_MS && Number.isFinite(own) && own >= 0 ? own : LOST_RECHECK_MS;
}

// Once the early window has ended, a stall-checked job the companion answers `No job found` for, whose
// recorded log and job file are gone, whose record shows no end and whose worker no process runs, is lost
// once a read and the files checked again after a pause agree. Returns the lost verdict, the job as that
// later read found it, or the status unchanged. A job whose recorded end is the lost one reads lost again,
// with no flag. A search that finds a worker or gives no answer is not run again for SEARCH_HOLD_MS, so a
// long wait neither queries every second nor waits out its whole length on one answer.
function lostJob(a, s, kind, check) {
  if (a.started === null || !s.readError || !NOT_FOUND.test(String(s.reason || ''))) return s;
  const job = recordedJob(a.job);
  if (job && job.endReason === LOST_REASON) return { state: 'failed', reason: LOST_REASON, lost: true };
  if (Date.now() < check.searchAgainAt) return s;
  if (SILENT_KINDS.has((a.intent && a.intent.kind) || kind)) return s;
  const windowEnd = a.started + windowMs(a.deadline - a.started);
  if (Date.now() < windowEnd) return s;
  if (!job || job.ended || !job.logFile || !filesGone(job.logFile)) return s;
  const pause = lostRecheckMs();
  if (Date.now() + LOOKUP_MS + pause + WAIT_FLOOR_MS > check.readsEnd) return s;
  if (workerRunning(a.job) !== false) {
    check.searchAgainAt = Date.now() + SEARCH_HOLD_MS;
    return s;
  }
  sleepUntil(Date.now() + pause);
  const again = readStatus(a.found.path, a.job, 0, Math.min(check.cap, check.readsEnd - Date.now()));
  if (!again.readError) return again;
  if (!NOT_FOUND.test(String(again.reason || '')) || !filesGone(job.logFile)) return again;
  const out = { state: 'failed', reason: LOST_REASON, lost: true };
  return Date.now() < windowEnd + SETUP_ALLOWANCE_MS ? { ...out, earlyFailure: true } : out;
}

// A lost job's output carries the early flag of the read that first reached the verdict, and no other.
function lostFlag(out, from) {
  const rest = { ...out };
  delete rest.earlyFailure;
  return from.earlyFailure ? { ...rest, earlyFailure: true } : rest;
}

function killTree(pid, jobId) {
  const [exe, ...lead] = commandOverride('NEXUS_CODEX_KILL') || ['taskkill'];
  spawnSync(exe, [...lead, '/PID', String(pid), '/T', '/F'], { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  const end = Date.now() + RECHECK_MS;
  for (;;) {
    const state = workerState(pid, jobId);
    if (isStopped(state)) return true;
    if (state === null || Date.now() >= end) return false;
    sleepUntil(Date.now() + 250);
  }
}

// Cancels a running job at the limit, or at a stall (`stall` set). The stall's early flag is decided
// before this runs, since the cancel appends lines to the job's log.
function cut(script, job, s, kind, stall) {
  const extra = stall ? { stalled: true } : {};
  const readError = s.readError ? { readError: true } : {};
  const stopped = () => ({
    state: 'cancelled', output: '', verdict: null, reason: stall ? STALL_REASON : PARTIAL_REASON,
    ...extra, partial: readLog(s.record || {}), ...readError, ...(stall && stall.early ? { earlyFailure: true } : {}),
  });
  const cancel = companion(script, ['cancel', job, '--json'], CANCEL_MS);
  if (cancel.ok) return stopped();
  const again = readStatus(script, job, 0, COLLECT_STATUS_MS);
  if (TERMINAL.has(again.state)) {
    const out = finished(script, job, again, kind);
    return stall && stall.early && isJobFailure(out) ? { ...out, earlyFailure: true } : out;
  }
  const cancelFailed = () => ({
    state: again.state, output: '', verdict: null, reason: `cancel failed: ${cancel.reason}`,
    partial: readLog(again.record || {}), ...extra, ...(again.readError ? { readError: true } : {}),
  });
  const pid = again.record && again.record.pid;
  if (again.readError || !(Number.isInteger(pid) && pid > 0)) return cancelFailed();
  const state = workerState(pid, job);
  if (isStopped(state)) return stopped();
  if (state === 'worker' && killTree(pid, job)) return stopped();
  return cancelFailed();
}

function collectOnce(a, kind) {
  if (a.direct) return collectDirect(a, kind);
  if (a.box) return collectBox(a);
  if (a.found.unavailable) return flagEarly({ state: 'failed', output: '', verdict: null, reason: a.found.unavailable }, a);
  const script = a.found.path;
  const lostCheck = { searchAgainAt: 0, readsEnd: Infinity, cap: COLLECT_STATUS_MS };
  const s = lostWorker(script, lostJob(a, readStatus(script, a.job, 0, COLLECT_STATUS_MS), kind, lostCheck), a.job, kind);
  if (s.pidFree) companion(script, ['cancel', a.job, '--json'], CANCEL_MS);
  const ended = ({ codexSession, ...out }) => {
    if (!TERMINAL.has(out.state)) return out;
    const log = () => readLog(s.record || {});
    const seatOut = a.intent && a.intent.seat && jobTree ? seatEndOf(a, out, codexSession, log) : null;
    const end = recordEnd(a.job, out.state, out.reason, codexSession, seatOut ? seatOut.line : {});
    const records = seatEnd(a, end);
    // A tree its reservation still holds keeps its servers until `seat-release --legacy` gives it back.
    const stillHeld = seatOut && seatOut.fields.checksWait === true;
    return {
      ...out, ...(seatOut ? seatOut.fields : {}), ...records,
      ...(stillHeld ? {} : closeServers('collect', a.job, jobTree || process.cwd())),
    };
  };
  if (TERMINAL.has(s.state)) {
    const finishedOut = finished(script, a.job, s, kind);
    const cutBefore = s.state === 'cancelled' ? cutReason(a.job) : null;
    const out = cutBefore ? { ...finishedOut, reason: cutBefore, partial: readLog(s.record || {}) } : finishedOut;
    if (s.lost) return ended(lostFlag(out, s));
    return ended(isJobFailure(out) ? flagEarly(out, a) : out);
  }
  if (Date.now() >= a.deadline) return ended(cut(script, a.job, s, kind, null));
  const stall = s.readError ? null : stallOf(s.record, a.started, kind);
  if (stall && stall.stalled) {
    const early = flagEarly({}, a, SETUP_ALLOWANCE_MS).earlyFailure === true;
    return ended(cut(script, a.job, s, kind, { early }));
  }
  const out = { state: s.state, output: '', verdict: null, reason: 'still running — wait until the deadline' };
  return s.readError ? { ...out, readError: true } : out;
}

// --- A seat job in its box (lib/seat-box.js) -------------------------------------------------------------------

const pidAlive = (pid) => {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
};

// A box job's state from its status.json: ended once the keeper has written the box's close (or that it never
// launched), `failed` where the keeper is gone while the job reads running. `full` looks the keeper up by pid and
// creation time; otherwise its pid alone is checked. A status that cannot be read is a read error.
function boxRead(boxId, full = false) {
  const read = seatBox.readBox(boxId);
  if (read.read !== 'ok') return { state: 'unknown', readError: true, read: read.read, reason: `the box's status (${path.join(seatBox.boxDir(boxId), 'status.json')}) is ${read.read}` };
  const st = read.status;
  if (TERMINAL.has(st.state) && (st.boxClosed !== undefined || st.launched === false)) return { state: st.state, status: st };
  const keeper = st.keeper && Number.isInteger(st.keeper.pid) ? st.keeper : null;
  const lives = !keeper ? 'unknown' : full ? seatBox.processState(keeper) : pidAlive(keeper.pid) ? 'alive' : 'gone';
  if (lives === 'gone') return TERMINAL.has(st.state) ? { state: st.state, status: st } : { state: 'failed', reason: GONE_KEEPER_REASON, status: st };
  return { state: 'running', status: st };
}

const boxEvents = (boxId) => {
  try { return fs.readFileSync(path.join(seatBox.boxDir(boxId), 'events.jsonl'), 'utf8'); } catch { return ''; }
};

// A box job its keeper cut at the limit the start gave it, with no caller there to cut it.
const keeperCut = (s) => s.state === 'cancelled' && Boolean(s.status) && s.status.limitReached === true;

// The job's outcome as collect returns it, the box's thread beside it. A job cut at its limit — by this helper, or
// by its keeper where no call came — returns its events as `partial`, also when collected again.
function boxOutcome(s, boxId) {
  const st = s.status || {};
  const thread = typeof st.thread === 'string' && st.thread ? st.thread : null;
  if (s.state === 'completed') {
    const output = typeof st.output === 'string' ? st.output : '';
    return { state: 'completed', output, verdict: null, ...(output.trim() ? {} : { reason: NO_OUTPUT }), thread };
  }
  if (keeperCut(s) || (s.state === 'cancelled' && fs.existsSync(path.join(seatBox.boxDir(boxId), 'cut.request')))) {
    return { state: 'cancelled', output: '', verdict: null, reason: PARTIAL_REASON, partial: boxEvents(boxId), thread };
  }
  return { state: s.state, output: '', verdict: null, reason: s.reason || st.reason || `the job ended ${s.state}`, thread };
}

function boxWaitOnce(a, maxMs) {
  const t0 = Date.now();
  const waitEnd = t0 + (t0 >= a.deadline ? maxMs : Math.min(maxMs, a.deadline - t0));
  const read = (full) => a.direct ? directBoxRead(a, { full, until: waitEnd }) : boxRead(a.box, full);
  let s = read(true);
  while (!TERMINAL.has(s.state) && waitEnd - Date.now() > (a.direct ? 0 : WAIT_FLOOR_MS)) {
    sleepUntil(Math.min(waitEnd, Date.now() + WAIT_FLOOR_MS));
    s = read(false);
  }
  if (TERMINAL.has(s.state)) {
    const out = s.reason ? { state: s.state, reason: s.reason } : { state: s.state };
    return isJobFailure(out) && !(a.direct && s.cut) ? flagEarly(out, a) : out;
  }
  const out = s.readError ? { state: 'unknown', readError: true, reason: s.reason } : { state: 'running' };
  if (Date.now() >= a.deadline) out.deadlinePassed = true;
  return out;
}

// A box job has no stall: it runs to its limit, where it is cut through the box.
function collectBox(a) {
  const s = boxRead(a.box, true);
  if (!TERMINAL.has(s.state) && Date.now() < a.deadline) {
    const out = { state: s.state, output: '', verdict: null, reason: 'still running — wait until the deadline' };
    return s.readError ? { ...out, readError: true, reason: s.reason } : out;
  }
  let out;
  if (TERMINAL.has(s.state)) out = boxOutcome(s, a.box);
  else {
    const cut = seatBox.cut(a.box);
    const again = boxRead(a.box, true);
    out = again.state === 'completed' ? boxOutcome(again, a.box) : {
      state: 'cancelled', output: '', verdict: null, reason: PARTIAL_REASON, partial: boxEvents(a.box),
      thread: (again.status && again.status.thread) || null, ...(cut.cut ? {} : { cutNote: cut.reason }),
    };
  }
  const { thread, ...shown } = out;
  const done = finalizeSeat({ boxId: a.box, intent: a.intent, outcome: out });
  return { ...(isJobFailure(shown) ? flagEarly(shown, a) : shown), ...done.fields };
}

function requestIn(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'request.json'), 'utf8')); } catch { return null; }
}

const requestTree = (dir) => requestIn(dir)?.tree || null;
const BOX_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const readBoxRequest = (id) => typeof id === 'string' && BOX_ID_RE.test(id) ? requestIn(seatBox.boxDir(id)) : null;

function directRequest(req, id, root = process.cwd()) {
  if (!req || req.route !== 'direct' || req.kind !== 'codex' || req.boxId !== id || typeof req.sessionRoot !== 'string' ||
      seats.treeKey(req.sessionRoot) !== seats.treeKey(root)) return null;
  if (!Number.isFinite(Date.parse(req.startedAt)) || !Number.isFinite(Date.parse(req.deadline))) return null;
  return req;
}

function matchesDirectRequest(line, req) {
  return Boolean(req && line?.type === 'intent' && line.route === 'direct' && line.box === req.boxId &&
    line.at === req.startedAt && line.deadline === req.deadline && line.label === req.label && line.kind === req.jobKind);
}

function directLaunchEvidence(id) {
  return seatBox.claimOf(id) === 'launch' || seatBox.readBox(id).status?.boxId === id;
}

function directLaunchEnded(a, until) {
  const dir = seatBox.boxDir(a.box);
  const from = Date.parse(a.intent.at);
  if (!(Date.now() - from >= START_WINDOW_MS)) return null;
  try {
    const holder = JSON.parse(fs.readFileSync(path.join(dir, 'holder.json'), 'utf8'));
    const [claim, identity] = fs.readFileSync(path.join(dir, 'claim'), 'utf8').split(/\r?\n/);
    const keeper = claim === 'launch' && JSON.parse(identity);
    const known = (p) => Number.isInteger(p?.pid) && p.pid > 0 && typeof p.created === 'string' && p.created.length > 0;
    if (known(holder) && known(keeper) &&
        seatBox.processState(holder, process.platform, until) === 'gone' &&
        seatBox.processState(keeper, process.platform, until) === 'gone') return true;
  } catch { /* missing or unreadable identity leaves the launch unresolved */ }
  return false;
}

function directCutRecorded(id) {
  try {
    return Number.isFinite(Date.parse(fs.readFileSync(path.join(seatBox.boxDir(id), 'cut.request'), 'utf8')));
  } catch { return false; }
}

function directBoxRead(a, { full = true, confirmGone = true, until = Infinity } = {}) {
  const { read, status } = seatBox.readBox(a.box, { until });
  let st = status;
  if (read !== 'ok' || st.boxId !== a.box) {
    const ended = read === 'missing' && confirmGone ? directLaunchEnded(a, until) : null;
    if (ended === true) {
      if (seatBox.readBox(a.box, { until }).read === 'missing') return { state: 'failed', reason: NEVER_REPORTED };
      return directBoxRead(a, { full, confirmGone: false, until });
    }
    const why = read === 'ok' ? 'names a different box' : `is ${read}`;
    return { state: 'unknown', readError: true, reason: ended === false
      ? `${NEVER_REPORTED} and the holder and keeper cannot both be confirmed gone`
      : `the box's status.json ${why}` };
  }
  const cut = () => st.limitReached === true || directCutRecorded(a.box);
  if (st.launched === false || (st.boxClosed === true && TERMINAL.has(st.state))) {
    const state = TERMINAL.has(st.state) ? st.state : 'failed';
    return { state, status: st, reason: st.reason, cut: state === 'cancelled' && cut() };
  }
  const keeper = st.keeper;
  if (!confirmGone || !Number.isInteger(keeper?.pid) || keeper.pid <= 0) return { state: 'running', status: st };
  const gone = full ? seatBox.processState(keeper, process.platform, until) === 'gone' : !pidAlive(keeper.pid);
  if (!gone) return { state: 'running', status: st };
  const fresh = seatBox.readBox(a.box, { until }).status;
  if (fresh?.boxId !== a.box || fresh.keeper?.pid !== keeper.pid || fresh.keeper?.created !== keeper.created) return { state: 'running', status: st };
  st = fresh;
  if (st.boxClosed === true && TERMINAL.has(st.state)) {
    return { state: st.state, status: st, reason: st.reason, cut: st.state === 'cancelled' && cut() };
  }
  const sessionIssue = process.platform === 'win32' ? keeperSessionIssue(keeper, until) : null;
  const members = Array.isArray(st.members) ? st.members : [];
  const issue = sessionIssue || boxLeftReason(a.box, members, until);
  if (issue) return { state: 'running', status: st, reason: issue };
  if (TERMINAL.has(st.state)) return { state: st.state, status: st, reason: st.reason, cut: st.state === 'cancelled' && cut() };
  if (cut()) return { state: 'cancelled', status: st, cut: true };
  return { state: 'failed', status: st, reason: GONE_KEEPER_REASON };
}

function* directLines(file, { allowMissing = false } = {}) {
  let fd;
  try { fd = fs.openSync(file, 'r'); } catch (err) {
    if (allowMissing && err.code === 'ENOENT') return;
    throw err;
  }
  try {
    let left = fs.fstatSync(fd).size;
    const chunk = Buffer.allocUnsafe(DIRECT_PARTIAL_BYTES);
    let line = [];
    while (left > 0) {
      const size = fs.readSync(fd, chunk, 0, Math.min(chunk.length, left), null);
      if (size === 0) throw new Error('the source ended before its recorded size');
      left -= size;
      const bytes = chunk.subarray(0, size);
      let from = 0;
      for (let end = bytes.indexOf(10); end >= 0; end = bytes.indexOf(10, from)) {
        const piece = bytes.subarray(from, end);
        yield (line.length ? Buffer.concat([...line, piece]) : piece).toString('utf8');
        line = [];
        from = end + 1;
      }
      if (from < size) line.push(Buffer.from(bytes.subarray(from)));
    }
    if (line.length) yield Buffer.concat(line).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function directPartial(id, status) {
  const tail = Buffer.allocUnsafe(DIRECT_PARTIAL_BYTES);
  let cursor = 0;
  let length = 0;
  const keep = (bytes) => {
    const recent = bytes.subarray(-tail.length);
    const copied = recent.copy(tail, cursor);
    if (copied < recent.length) recent.copy(tail, 0, copied);
    cursor = (cursor + recent.length) % tail.length;
    length = Math.min(length + recent.length, tail.length);
  };
  let hasMessage = false;
  const file = path.join(seatBox.boxDir(id), 'events.jsonl');
  for (const line of directLines(file, { allowMissing: !status?.thread && !status?.output })) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event?.type !== 'item.completed' || event.item?.type !== 'agent_message' || typeof event.item.text !== 'string') continue;
    if (hasMessage) keep(Buffer.from('\n'));
    keep(Buffer.from(event.item.text));
    hasMessage = true;
  }
  const bytes = length < tail.length ? tail.subarray(0, length) : Buffer.concat([tail.subarray(cursor), tail.subarray(0, cursor)]);
  let start = 0;
  while ((bytes[start] & 0xc0) === 0x80) start++;
  return bytes.toString('utf8', start);
}

function directReport(thread, since, req) {
  if (!thread) throw new Error('the completed box did not record a Codex thread');
  const env = req?.codexHome ? { CODEX_HOME: req.codexHome } : process.env;
  const file = seatChecks.sessionRecordFile(thread, { since, env, now: Date.parse(since) || Date.now() });
  if (!file) throw new Error('the Codex session record could not be located');
  let matched = false;
  let started = false;
  let finalAnswer;
  let lastAssistant;
  let sawUnphasedText = false;
  for (const line of directLines(file)) {
    const { type, payload } = JSON.parse(line);
    if (!matched) {
      if (type !== 'session_meta' || payload?.id !== thread) throw new Error('the session record identifies a different Codex thread');
      matched = true;
      continue;
    }
    if (type === 'event_msg') {
      if (started && payload?.type === 'task_complete') {
        if (finalAnswer !== undefined) return finalAnswer;
        if (!sawUnphasedText) return '';
        if (lastAssistant.phase == null && lastAssistant.text.trim() && lastAssistant.text === payload.last_agent_message) {
          return lastAssistant.text;
        }
        throw new Error('unphased assistant output does not identify a final answer in the original turn');
      }
      if (payload?.type === 'task_started') {
        if (started) break;
        started = true;
      } else if (payload?.type === 'turn_aborted') break;
    }
    if (started && type === 'response_item' && payload?.type === 'message' && payload.role === 'assistant') {
      const { phase, content } = payload;
      const text = Array.isArray(content)
        ? content.filter((item) => item?.type === 'output_text' && typeof item.text === 'string').map((item) => item.text).join('\n')
        : '';
      lastAssistant = { phase, text };
      if (phase === 'final_answer' && Array.isArray(content)) finalAnswer = text;
      if (phase == null && text.trim()) sawUnphasedText = true;
    }
  }
  throw new Error('the Codex session record has no completed original turn');
}

const directReadError = (source, err) => ({
  state: 'unknown', output: '', verdict: null, readError: true, reason: `the direct job's ${source} could not be read: ${err.message}`,
});

function collectDirect(a, kind) {
  let s = directBoxRead(a);
  if (!TERMINAL.has(s.state)) {
    if (Date.now() < a.deadline) {
      return { state: s.state, output: '', verdict: null, ...(s.readError ? { readError: true } : {}),
        reason: s.reason || 'still running — wait until the deadline' };
    }
    const cut = seatBox.cut(a.box);
    s = directBoxRead(a, { confirmGone: false });
    if (!TERMINAL.has(s.state)) {
      const why = cut.reason || cut.status?.closeReason || (cut.keeperEnded ? `keeper ${cut.keeperEnded}; box closure unconfirmed` : 'box closure unconfirmed');
      try {
        return { state: s.state, output: '', verdict: null, reason: `cancel failed: ${why}`, partial: directPartial(a.box, s.status) };
      } catch (err) { return directReadError('partial log', err); }
    }
  }
  const st = s.status;
  const thread = typeof st?.thread === 'string' && st.thread ? st.thread : null;
  const req = directRequest(readBoxRequest(a.box), a.box);
  let out;
  if (s.state === 'completed') {
    let body;
    try { body = directReport(thread, req?.startedAt || a.intent?.at, req); }
    catch (err) { return directReadError('final report', err); }
    const trailer = `Codex session ID: ${thread}\nResume in Codex: codex resume ${thread}`;
    out = completedReport([body, trailer].filter(Boolean).join('\n\n'), a.job, kind, null);
  } else if (s.cut) {
    try { out = { state: 'cancelled', output: '', verdict: null, reason: PARTIAL_REASON, partial: directPartial(a.box, st) }; }
    catch (err) { return directReadError('partial log', err); }
  } else {
    out = { state: s.state, output: '', verdict: null, reason: s.reason || `the job ended ${s.state}` };
  }
  recordEnd(a.job, out.state, out.reason, thread, {}, process.cwd(), req);
  return isJobFailure(out) && !s.cut ? flagEarly(out, a) : out;
}

// The intent of a box job from the machine's seat folder: the tree's reservation while it holds the tree, else
// what its finished end recorded — so a session root that did not start the job still finds it.
function boxIntent(jobId) {
  if (!BOX_ID_RE.test(jobId)) return null;
  const dir = seatBox.boxDir(jobId);
  const request = requestIn(dir);
  if (request?.route === 'direct') {
    const req = directRequest(request, jobId);
    return req && directLaunchEvidence(jobId) ? { box: jobId, route: 'direct', kind: req.jobKind, at: req.startedAt } : null;
  }
  const tree = request?.tree;
  if (!tree) return null;
  const held = seats.readReservation(tree);
  if (held && held.box && held.box.id === jobId && held.intentLine) return held.intentLine;
  const done = readFinal(dir);
  return done.stages && done.stages.end && done.stages.end.intent ? done.stages.end.intent : null;
}

function readFinal(dir) {
  const file = path.join(dir, 'finalize.json');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (err) {
    return err.code === 'ENOENT' ? { stages: {}, afterBoxes: [] } : { unreadable: `the box's finalize.json (${file}) cannot be read (${err.message}), so which stages of the job's end ran cannot be told` };
  }
  try {
    const value = JSON.parse(text);
    if (value && value.stages && typeof value.stages === 'object') {
      const afterBoxes = (Array.isArray(value.afterBoxes) ? value.afterBoxes : [])
        .map((e) => (typeof e === 'string' ? { id: e } : e)).filter((e) => e && typeof e.id === 'string');
      return { stages: value.stages, afterBoxes };
    }
  } catch { /* named below */ }
  return { unreadable: `the box's finalize.json (${file}) cannot be read, so which stages of the job's end ran cannot be told` };
}

function writeFinal(dir, value) {
  const file = path.join(dir, 'finalize.json');
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value));
  fs.renameSync(tmp, file);
}

function takeTreeLock(lock, token) {
  const end = Date.now() + FINALIZE_WAIT_MS;
  for (;;) {
    try {
      if (fileLock.take(lock, { staleMs: FINALIZE_STALE_MS, token })) return true;
    } catch {
      return false;
    }
    if (Date.now() >= end) return false;
    sleepUntil(Date.now() + 100);
  }
}

/**
 * Finishes a box job's end once, whichever call comes first — a `collect` or a `seat-release` — under the tree's
 * lock: the end line, the step-run carry, the safety copy's look, the checks, the question job's questions,
 * the row's after-job runs, then the tree given back. Each stage is recorded in the box's finalize.json before the next runs, so a call stopped
 * part-way is resumed at the first stage not recorded, and a stage resumed writes nothing it had already written.
 * Returns the fields for the caller's output and whether the tree was given back.
 */
function finalizeSeat({ boxId, intent, outcome }) {
  const dir = seatBox.boxDir(boxId);
  const tree = intent && typeof intent.tree === 'string' ? intent.tree : requestTree(dir);
  if (!tree) return { fields: { end: 'unconfirmed', endReason: 'the box names no tree, so the job holding it cannot be found', checksWait: true }, freed: false };
  return withTreeLock(tree, () => finalizeLocked({ boxId, dir, tree, given: intent, outcome }),
    (left) => ({ fields: { end: 'unconfirmed', endReason: `another call holds the tree's lock${left}, finishing this job's end or changing its reservation — call again once it has`, checksWait: true }, freed: false }));
}

const withoutAt = (stage) => {
  if (!stage) return {};
  const { at, ...rest } = stage;
  return rest;
};

function finalizeLocked({ boxId, dir, tree, given, outcome }) {
  const read = readFinal(dir);
  if (read.unreadable) return { fields: { end: 'unconfirmed', endReason: read.unreadable, checksWait: true }, freed: false };
  const { stages } = read;
  const afterBoxes = read.afterBoxes;
  const save = () => writeFinal(dir, { boxId, tree, stages, ...(afterBoxes.length ? { afterBoxes } : {}) });
  const record = (name, value) => {
    stages[name] = { ...value, at: new Date().toISOString() };
    save();
  };
  try {
    if (!stages.end) {
      const ended = confirmBox({ boxId, tree, given, outcome });
      if (!ended.record) return { fields: ended.fields, freed: false };
      record('end', ended.record);
    }
    const base = stages.end;
    const { root, intent, marks } = base;
    if (!stages.carry) {
      const out = {};
      const note = seatRecordsAt(() => {
        seatRecords.writeEndRow({ root, role: intent.seat, jobId: boxId, ...marks });
        out.stepRunsCarried = seatRecords.carryStepRuns({ root, tree, role: intent.seat, since: intent.at, ...marks });
      });
      if (note) out.recordsNote = note;
      record('carry', out);
    }
    const activity = !stages.checks || (!stages.copy && typeof intent.copy === 'string')
      ? seatChecks.sessionActivity({ thread: base.thread || seatChecks.threadIdOf(base.output), since: intent.at, tree }) : null;
    if (!stages.copy) record('copy', typeof intent.copy === 'string' ? { safetyCopy: safetyCopyAfter({ jobId: boxId, dir: intent.copy, root, intent, activity }) } : {});
    if (!stages.checks) {
      record('checks', { seatChecks: seatChecks.afterJob({ root, intent, jobId: boxId, state: base.state, activity, marks }) });
    }
    if (intent.write === false && !stages.questions) record('questions', finishQuestions(base, tree, boxId));
    if (!stages.after) {
      const book = { entries: afterBoxes, save, endOf: (entry) => commandBoxEnd(entry, save) };
      seatAfter.settle(book);
      record('after', { afterJobRuns: seatAfter.run({ row: codexEntry.seatRow(intent.seat), root, tree, intent, boxId, marks, book }) });
    }
    if (!stages.free) {
      const freed = seats.releaseTree(tree, { intent: intent.intent });
      if (!freed) {
        const still = seats.readReservation(tree);
        if (still ? still.intent === intent.intent : fs.existsSync(seats.reservationFile(tree))) {
          const why = still ? 'could not be removed' : 'cannot be read, so whether it is still this job\'s cannot be told';
          return { fields: { ...endFields(stages), freeError: `the tree's reservation ${why}, so the tree stays held — call seat-release again`, checksWait: true }, freed: false };
        }
      }
      record('free', { freed });
    }
  } catch (err) {
    return {
      fields: { ...endFields(stages), end: 'unconfirmed', endReason: `the job's end could not be finished: ${err.message}`, checksWait: true },
      freed: false,
    };
  }
  return { fields: endFields(stages), freed: true };
}

function endFields(stages) {
  const end = withoutAt(stages.end);
  const fields = {
    end: end.end, endReason: end.endReason, fallback: end.fallback, fallbackReason: end.fallbackReason,
    finishedSteps: end.finishedSteps || [], leftovers: end.leftovers || [],
    ...(Number.isFinite(end.minutes) ? { minutes: end.minutes } : {}),
  };
  return { ...fields, ...(stages.questions?.questionsNote ? { output: end.output } : {}),
    ...withoutAt(stages.carry), ...withoutAt(stages.copy), ...withoutAt(stages.checks),
    ...withoutAt(stages.questions), ...withoutAt(stages.after) };
}

function questionDestination(tree, file) {
  const root = fs.realpathSync.native(tree);
  let resolved = root;
  for (const part of path.relative(tree, file).split(path.sep)) {
    resolved = path.join(resolved, part);
    const stat = fs.lstatSync(resolved, { throwIfNoEntry: false });
    if (stat) resolved = fs.realpathSync.native(resolved);
    const relative = path.relative(root, resolved);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('the resolved questions destination is outside the tree');
    }
    if (stat?.isSymbolicLink()) throw new Error('the questions destination contains a link');
  }
  return resolved;
}

function finishQuestions(base, tree, boxId) {
  if (base.state !== 'completed') return {};
  const question = base.question ?? seatEndLib.questionHandback(base.intent.seat, base.output, base.intent.slug);
  if (question.note) return { questionsNote: question.note };
  if (question.kind !== 'block') return {};
  const folder = specFolder(tree, base.intent.slug);
  if (!folder) return { questionsNote: `the feature folder for ${base.intent.slug} could not be found` };
  const file = path.join(folder, 'delivery', 'questions.md');
  const body = base.output.slice(question.from, question.to);
  const marker = `<!-- nexus-seat-questions:job ${boxId} -->`;
  const done = `<!-- nexus-seat-questions:done ${boxId} -->`;
  const entry = `${body}${done}\n`;
  let fd;
  try {
    const destination = questionDestination(tree, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const before = fs.lstatSync(destination, { bigint: true, throwIfNoEntry: false });
    if (before && (!before.isFile() || before.nlink !== 1n)) {
      throw new Error('the questions destination must be a regular file with one link');
    }
    const { O_APPEND, O_CREAT, O_EXCL, O_NOFOLLOW, O_RDWR } = fs.constants;
    fd = fs.openSync(destination, O_RDWR | O_APPEND | (O_NOFOLLOW ?? 0) | (before ? 0 : O_CREAT | O_EXCL));
    const opened = fs.fstatSync(fd, { bigint: true });
    const current = fs.lstatSync(questionDestination(tree, file), { bigint: true });
    if (!opened.isFile() || opened.nlink !== 1n || !current.isFile() || current.nlink !== 1n
        || opened.dev !== current.dev || opened.ino !== current.ino) {
      throw new Error('the opened questions file is linked or differs from the intended destination');
    }
    const prior = fs.readFileSync(fd, 'utf8');
    const lines = prior.split(/\r?\n/);
    if (!lines.includes(done)) {
      const started = lines.lastIndexOf(marker);
      if (started === -1) {
        const prefix = prior ? '\n\n' : `# ${base.intent.slug} — Questions\n\n`;
        fs.appendFileSync(fd, `${prefix}${marker}\n${entry}`);
      } else {
        const tail = prior.slice(prior.lastIndexOf(marker) + marker.length).replace(/^\r?\n/, '');
        if (!entry.startsWith(tail)) {
          return { questionsNote: `the prior questions append in ${file} is incomplete and the file has since changed` };
        }
        fs.appendFileSync(fd, `${lines.at(-1) === marker ? '\n' : ''}${entry.slice(tail.length)}`);
      }
    }
    return { questionsWritten: { path: file, count: question.count } };
  } catch (err) {
    return { questionsNote: `could not append the questions to ${file}: ${err.message}` };
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// The end stage: confirmed from the box's own record, read against the tree's reservation, which names the job.
function confirmBox({ boxId, tree, given, outcome }) {
  const held = (endReason, extra = {}) => ({ fields: { end: 'unconfirmed', endReason, ...extra, checksWait: true } });
  const file = seats.reservationFile(tree);
  const reservation = seats.readReservation(tree);
  if (!reservation) {
    return held(fs.existsSync(file)
      ? `the tree's reservation (${file}) cannot be read, so the job holding the tree cannot be told — it is never read as given back`
      : 'the tree\'s reservation is gone, though this job\'s end was never finished');
  }
  if (!reservation.box || reservation.box.id !== boxId) return held(`the tree's reservation names another job (${reservation.jobId || 'no job id'})`);
  const intent = reservation.intentLine || given || {};
  const root = reservation.sessionRoot || process.cwd();
  const marks = { session: reservation.session || '', token: reservation.token === undefined ? null : reservation.token };
  const cut = outcome.reason === PARTIAL_REASON;
  const questions = intent.write === false;
  const question = questions && outcome.state === 'completed' ? seatEndLib.questionHandback(intent.seat, outcome.output, intent.slug) : undefined;
  const fallback = seatEndLib.fallbackOf({ role: intent.seat, state: outcome.state, reason: outcome.reason, output: outcome.output, cut, questions, question });
  let finishedSteps = [];
  try { finishedSteps = seatEndLib.finishedSteps({ tree, slug: intent.slug, role: intent.seat, since: intent.at }); } catch { /* none proven */ }
  const end = boxEnd(boxId, reservation, () => firstSeenGone(file, reservation));
  const thread = outcome.thread || null;
  const line = recordEnd(boxId, outcome.state, outcome.reason, thread, {
    end: end.end, endReason: end.endReason, ...fallback, ...(thread ? { thread } : {}), leftovers: end.leftovers || [],
  }, root);
  if (end.end !== 'confirmed') return held(end.endReason, { ...fallback, finishedSteps });
  let confirmed = false;
  try { confirmed = readRecord(root).some((l) => l && l.type === 'confirm' && l.jobId === boxId); } catch { /* read as none */ }
  if (line && line.before && line.before.end !== 'confirmed' && !confirmed) {
    appendRecord({ type: 'confirm', jobId: boxId, at: new Date().toISOString(), end: 'confirmed', endReason: end.endReason }, root);
  }
  const from = line && Date.parse(line.startedAt);
  const to = line && Date.parse(line.endedAt);
  return {
    record: {
      end: 'confirmed', endReason: end.endReason, ...fallback, finishedSteps, leftovers: end.leftovers || [],
      ...(Number.isFinite(from) && Number.isFinite(to) ? { minutes: Math.round(Math.max(0, to - from) / 6000) / 10 } : {}),
      root, intent, marks, state: outcome.state, output: outcome.output || '', thread, ...(question ? { question } : {}),
    },
  };
}

const pidList = (list) => list.map((m) => m.pid).join(', ');

// When a caller first saw the box's keeper gone, in ms, written into the reservation by the first that did — under the
// tree's lock — so every later call times the wait from it; null where it cannot be written.
function firstSeenGone(file, reservation) {
  const box = reservation.box || {};
  const was = Date.parse(box.goneSeenAt);
  if (Number.isFinite(was)) return was;
  const at = new Date().toISOString();
  const wrote = seats.updateHeld(file, { intent: reservation.intent, jobId: reservation.jobId }, (h) => ({ box: { ...(h.box || {}), goneSeenAt: at } }));
  if (!wrote) return null;
  reservation.box = { ...box, goneSeenAt: at };
  return Date.parse(at);
}

// The same, kept by this call alone, for a box no reservation names (the sandbox check's): its first sighting is now.
const seenNow = () => Date.now();

// A verify command's box end, by the seat job's own proof: its keeper as its start reported it, and the first sighting
// of that keeper gone written into the box's entry in finalize.json, under the tree's lock.
function commandBoxEnd(entry, save) {
  return boxEnd(entry.id, { box: { id: entry.id, keeper: entry.keeper || null } }, () => {
    const was = Date.parse(entry.goneSeenAt);
    if (Number.isFinite(was)) return was;
    entry.goneSeenAt = new Date().toISOString();
    save();
    return Date.parse(entry.goneSeenAt);
  });
}

function keeperSessionIssue(keeper, until = Infinity) {
  const mine = seatBox.sessionOf(process.pid, process.platform, until);
  if (!Number.isInteger(keeper.session) || !Number.isInteger(mine)) {
    return 'the Windows session of the box\'s keeper or of this call cannot be read, so the box\'s job object cannot be looked up';
  }
  return keeper.session === mine ? null
    : `the box ran in Windows session ${keeper.session} and this call runs in session ${mine}, where the box's job object cannot be looked up — call again from session ${keeper.session}`;
}

function boxLeftReason(boxId, members, until = Infinity) {
  const left = seatBox.boxLeft({ boxId, members }, { until });
  if (left.job === 'yes') return 'the box\'s keeper is gone but its job object still opens, so a process may still be in it';
  if (left.job !== 'no') return 'whether the box\'s job object still opens cannot be read';
  const running = left.members.filter((m) => m.state !== 'gone');
  return running.length ? `pid ${pidList(running)} of the box still runs or cannot be looked up` : null;
}

// Without a keeper-written close, the seat checks the job object and its members in the keeper's Windows session
// once 10 s have passed since the first sighting of the gone keeper.
function boxEnd(boxId, reservation, firstSeen = seenNow) {
  const hold = (endReason) => ({ end: 'unconfirmed', endReason });
  const read = seatBox.readBox(boxId);
  if (read.read !== 'ok') return hold(`the box's status.json is ${read.read}, so the box's end cannot be seen`);
  const st = read.status;
  if (st.boxId !== boxId) return hold(`the box's status.json names another box (${st.boxId})`);
  const named = reservation.box && reservation.box.keeper && Number.isInteger(reservation.box.keeper.pid) ? reservation.box.keeper : null;
  const written = st.keeper && Number.isInteger(st.keeper.pid) ? st.keeper : null;
  if (named && written && (written.pid !== named.pid || (written.created || null) !== (named.created || null))) {
    return hold(`the box's status.json names another keeper (pid ${written.pid}) than its start reported (pid ${named.pid})`);
  }
  const leftovers = Array.isArray(st.leftovers) ? st.leftovers : [];
  if (st.boxClosed === true) {
    const ended = leftovers.length ? `, after ending what the job left running (pid ${pidList(leftovers)})` : '';
    return { end: 'confirmed', endReason: `the box closed with no process left in it${ended}`, leftovers };
  }
  const keeper = written || named;
  if (!keeper) return hold('neither the box nor the tree\'s reservation names the box\'s keeper');
  const lives = seatBox.processState(keeper);
  if (lives === 'alive') {
    return hold(st.boxClosed === false
      ? `the box's keeper (pid ${keeper.pid}) could not close the box: ${st.closeReason || 'it gave no reason'}`
      : `the box's keeper (pid ${keeper.pid}) still runs`);
  }
  if (lives !== 'gone') return hold(`the box's keeper (pid ${keeper.pid}) cannot be looked up`);
  const sessionIssue = keeperSessionIssue(keeper);
  if (sessionIssue) return hold(sessionIssue);
  const seen = firstSeen();
  if (!Number.isFinite(seen)) return hold('when the box\'s keeper was first seen gone could not be recorded, so its end is not read');
  const since = Date.now() - seen;
  if (since < KEEPER_QUIET_MS) {
    return hold(`the box's keeper was first seen gone ${Math.round(since / 1000)} s ago; its end is read once ${KEEPER_QUIET_MS / 1000} s have passed`);
  }
  const members = Array.isArray(st.members) ? st.members : [];
  const issue = boxLeftReason(boxId, members);
  if (issue) return hold(issue);
  return { end: 'confirmed', endReason: 'the box\'s keeper is gone, and so are its job object and every process it listed', leftovers: members };
}

// seat-release for a tree a box job holds: a job that has ended is finished here as a collect would finish it.
function releaseBox(tree, reservation) {
  const boxId = reservation.box.id;
  const s = boxRead(boxId, true);
  if (s.read === 'missing') return releaseUnreported(tree, reservation);
  if (!TERMINAL.has(s.state)) return { held: boxId, heldReason: s.readError ? s.reason : 'its job is still running in the box' };
  const done = finalizeSeat({ boxId, intent: reservation.intentLine || null, outcome: boxOutcome(s, boxId) });
  if (!done.freed) return { held: boxId, heldReason: done.fields.freeError || done.fields.endReason };
  return { released: boxId, ...done.fields };
}

// A box with no status: a job still starting, a start that stopped before its keeper reported, or a keeper that
// claimed the launch and wrote nothing. Past the start's own window, a box nobody claimed is given up — its
// `abandon` claim made, so no start or keeper launches it — and its tree given back; a launch claim holds the tree.
function releaseUnreported(tree, reservation) {
  const boxId = reservation.box.id;
  const claimed = { held: boxId, heldReason: `the box's keeper claimed the launch but wrote no status, so the box's end cannot be seen (${seatBox.boxDir(boxId)})` };
  const claim = seatBox.claimOf(boxId);
  if (claim === 'launch' || claim === 'unreadable') return claimed;
  if (claim !== 'abandon') {
    const age = Date.now() - Date.parse(reservation.at);
    if (!(age >= START_WINDOW_MS)) return { held: boxId, heldReason: 'its job is still starting — its box has reported nothing yet' };
    if (!seatBox.abandon(boxId)) return claimed;
  }
  let left = '';
  const freed = withTreeLock(tree, () => seats.releaseTree(tree, { intent: reservation.intent, jobId: boxId }), (why) => { left = why; return null; });
  if (freed === null) return { held: boxId, heldReason: `another call holds the tree's lock${left} — call seat-release again` };
  if (!freed) return { held: boxId, heldReason: 'the tree\'s reservation changed or could not be removed' };
  return { released: boxId, endReason: 'the box never launched its job: its start stopped before the keeper reported, and the job was given up' };
}

// Rename first so a keeper still loading finds no box to claim.
function dropBoxDir(root, id) {
  const gone = path.join(root, `${id}.drop-${process.pid}`);
  try { fs.renameSync(path.join(root, id), gone); } catch { return false; }
  try { fs.rmSync(gone, { recursive: true, force: true }); } catch { /* an emptied folder left under another name */ }
  return true;
}

const directDeliveryFile = (id) => path.join(seatBox.boxDir(id), 'delivered');

function markDirectDelivery(a, out) {
  if (!a.direct || !TERMINAL.has(out.state)) return;
  try { fs.writeFileSync(directDeliveryFile(a.box), '', { flag: 'wx' }); } catch { /* A missing marker keeps the box. */ }
}

function dropOldDirectBoxes(root, lines) {
  const boxRoot = seatBox.boxRoot();
  let entries;
  try { entries = fs.readdirSync(boxRoot, { withFileTypes: true }); } catch { return; }
  const before = Date.now() - DIRECT_KEEP_MS;
  const old = new Set(lines.filter((l) => l?.type === 'end' && Date.parse(l.endedAt) < before).map((l) => l.jobId));
  for (const { name: id } of entries.filter((entry) => entry.isDirectory())) {
    if (!BOX_ID_RE.test(id) || !old.has(id) || !directRequest(readBoxRequest(id), id, root)) continue;
    const { status } = seatBox.readBox(id);
    if (status?.boxId !== id || status.boxClosed !== true) continue;
    try {
      if (fs.lstatSync(directDeliveryFile(id)).isFile()) dropBoxDir(boxRoot, id);
    } catch { /* Missing or unreadable delivery evidence keeps the box. */ }
  }
}

// `seat-release --close` can remove the seat and verify boxes whose end was proved,
// plus unreserved seat boxes that never launched or already carry an `abandon` claim.
function dropBoxes(tree) {
  const rootDir = seatBox.boxRoot();
  let names = [];
  try { names = fs.readdirSync(rootDir); } catch { return 0; }
  const want = seats.treeKey(tree);
  const held = seats.readReservation(tree);
  const heldBox = held && held.box && held.box.id;
  const drop = new Set();
  for (const id of names) {
    if (!BOX_ID_RE.test(id) || id === heldBox) continue;
    const req = readBoxRequest(id);
    if (req?.route === 'direct') continue;
    const read = seatBox.readBox(id);
    const st = read.status;
    const boxTree = st && typeof st.tree === 'string' ? st.tree : read.read === 'missing' ? req?.tree : null;
    if (!boxTree || seats.treeKey(boxTree) !== want) continue;
    if (!st) {
      if (seatBox.claimOf(id) === 'abandon') drop.add(id);
      continue;
    }
    const done = readFinal(path.join(rootDir, id));
    if (done.stages && FINAL_STAGES.every((n) => done.stages[n])) {
      drop.add(id);
      for (const after of done.afterBoxes || []) if (after.ended) drop.add(after.id);
    } else if (req && st.launched === false && TERMINAL.has(st.state)) drop.add(id);
  }
  let dropped = 0;
  for (const id of drop) {
    if (!names.includes(id) || readBoxRequest(id)?.route === 'direct') continue;
    if (dropBoxDir(rootDir, id)) dropped++;
  }
  return dropped;
}

function cmdCollect(opts) {
  const a = jobArgs(opts, 'collect');
  if (!a) return;
  const kind = opts.kind === undefined ? (a.direct || a.kind === SEAT_KIND ? a.kind || 'review' : 'review') : opts.kind;
  if (!KINDS.includes(kind)) return usage(`--kind is ${JSON.stringify(kind)}, not one of ${KINDS.join(', ')}`);
  const out = collectOnce(a, kind);
  return print(out, a.direct ? (error) => { if (!error) markDirectDelivery(a, out); } : undefined);
}

// Waits as a `wait` loop does, and collects when a `wait` would have told its caller to. The first `wait`
// that reached the lost verdict keeps its flag until a `collect` confirms it or a read finds the job.
function watched(a, kind) {
  let lostSeen = null;
  const keep = (r) => {
    if (r.reason === LOST_REASON) lostSeen = lostSeen || r;
    else if (r.state !== undefined && !r.readError) lostSeen = null;
  };
  for (;;) {
    const passStart = Date.now();
    const seen = Date.now() >= a.deadline ? { deadlinePassed: true } : waitOnce(a, DEFAULT_MAX_SECONDS * 1000, kind);
    keep(seen);
    if (TERMINAL.has(seen.state) || seen.stalled || seen.deadlinePassed) {
      const out = collectOnce(a, kind);
      if (lostSeen && out.reason === LOST_REASON) return lostFlag(out, lostSeen);
      if (a.direct && out.readError) return out;
      if (TERMINAL.has(out.state) || 'partial' in out) return out;
      keep(out);
    }
    sleepUntil(passStart + WAIT_FLOOR_MS);
  }
}

// Null, or why the report could not be written.
function writeReport(file, text) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    return null;
  } catch (err) {
    return `the report could not be written to ${file}: ${err.message} — collect still returns the job's result, or a cut job's partial`;
  }
}

function cmdWatch(opts) {
  if (typeof opts.out !== 'string' || !opts.out.trim()) return usage('watch needs --out <path>');
  const a = jobArgs(opts, 'watch');
  if (!a) return;
  const kind = opts.kind === undefined ? a.kind || 'review' : opts.kind;
  if (!KINDS.includes(kind)) return usage(`--kind is ${JSON.stringify(kind)}, not one of ${KINDS.join(', ')}`);
  const file = path.resolve(opts.out);
  const out = a.found.unavailable ? collectOnce(a, kind) : watched(a, kind);
  if (a.direct && out.readError) return print({ state: out.state, path: file, size: 0, reason: out.reason, readError: true });
  const cutOff = 'partial' in out;
  const text = out.output || (cutOff ? out.partial : '') || '';
  const writeError = writeReport(file, text);
  if (!writeError) markDirectDelivery(a, out);
  const reason = [out.reason, writeError].filter(Boolean).join('; ');
  print({
    state: out.state, path: file, size: writeError ? 0 : Buffer.byteLength(text),
    ...(reason ? { reason } : {}),
    ...(out.earlyFailure ? { earlyFailure: true } : {}),
    ...(cutOff ? { partial: true } : {}),
  });
}

function main() {
  const [sub, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  if (sub === 'brief') return cmdBrief(opts);
  if (sub === 'route') return print(codexRoute(process.cwd()));
  if (sub === 'start') return cmdStart(opts);
  if (sub === 'wait') return cmdWait(opts);
  if (sub === 'collect') return cmdCollect(opts);
  if (sub === 'watch') return cmdWatch(opts);
  if (sub === 'jobs') return cmdJobs(opts);
  if (sub === 'sweep') return cmdSweep();
  if (sub === 'seat-release') return cmdSeatRelease(opts);
  if (sub === 'seat-check') return cmdSeatCheck();
  if (sub === 'seat') return cmdSeat(opts);
  return usage(`unknown subcommand ${JSON.stringify(sub || '')} — use brief, route, start, wait, collect, watch, jobs, sweep, seat, seat-check or seat-release`);
}

main();
