# Rule Check

> Read when: a feature's rule check is run, ruled, resumed or finished later.

The check of a feature's rule list against the built code, the rulings of the unruled rows in the registers the
feature changed, and the register writes and module summaries that follow. A tool runs each pass: `rule-check.mjs`
lists the rows, writes the record and closes the pass.
It sits in `mine-verify-cover/tools/` of the mining skills, beside `rule-record.mjs` and `promote-rows.mjs` — load
the `locate-miner` skill (`nexus-miner`) for the folder. Every command takes
`--root {session root} --folder docs/specs/{slug}`, and `start` also `--repo {tree}`; each prints one JSON object,
and a refusal exits 2 naming its cause.

## When it runs, and who runs it

- It runs where the mining skills (`nexus-miner`) are installed, for a feature that has a rule list
  (`docs/specs/{slug}/definition/spec-rules.md`, or the `specRules` path `sdd-read.js` prints), and for one with no
  rule list file whose changed registers hold rows to rule.
- **No rule list file:** at handover the coordinator runs
  `rule-delta.mjs --repo {tree} --folder docs/specs/{slug} --first`, which writes nothing, and starts the first pass
  only where it lists a `toRule` row — a `pending-triage` row of a register the plan names or the change touched. At the close's re-check point a feature with no record
  runs that listing again and starts a first pass where it now lists one: rows first written in a fix round. A rule
  list that exists and cannot be read is refused, and so is a `--rules` path given that does not exist, and a missing
  list the spec header reads `Rule list: not landed` for: its first pass waits for the list mined during the build.
- The coordinator runs it — the team lead, or the lane's architect in the architect's own lanes — never one
  background agent. A spawned coordinator hands `rule check owed` back to its main session.
- **No rule list?** A feature that did not qualify (`po.md`'s **rule-shaped behavior** gate) records one line in
  summary.md, *nothing to promote*; its registers' unruled rows are ruled all the same, as above. A qualified
  feature whose spec header reads `Rule list: not landed` has its list mined during the build (`team-lead.md`
  § Mine-from-spec Dispatch (spec arm), item 5).
- **Without the mining skills**, a `Rule list: not available — mining skills not installed` header, a
  `Rule list: not landed` header and a rule list left by an earlier install end the same way: one summary.md line
  naming the install, `/plugin install nexus-miner@claude-nexus-miner`, with nothing promoted, no re-check and no
  rule check. Where a rule list exists, or the changed registers hold unruled `pending-triage` rows,
  `rule-check.md` holds one line saying so and the footer
  `*Status: COMPLETE — not run, mining skills not installed*`. That line names each such row as
  `{area}/{unit} {PREFIX}-n`; they are not ruled and do not block.

## A pass

1. `start --pass {kind}` lists the rows, writes the head or opens a `## Delta` block and prints the pass's key, the
   groups of at most 8 rows, the `toRule` rows and one brief per group. A pass inside the feature has no clock: it
   runs until the close cuts it (§ The cut).
2. One verifier per group, up to 8 at once, each given the brief the tool printed: a read-only `general-purpose`
   verifier on the `audit` job's model (→ pipeline-guardrails.md § Helper agents — model and type), the same one the
   registry guardrail uses. A verifier hands each row back with `add` as it goes.
3. Where the repo runs the `audit` helper job on Codex (→ codex-dispatch.md § Helper job), the job takes the group's
   Codex brief under the helper job's own time limit; its returned block goes in with `add --from {file}`.
4. `verified --pass {key}` once the last verifier is in: every row with no verdict is written
   `not checked — time limit` and the rows owed a ruling print.
5. The ruling (§ The ruling), then `close --pass {key}`.

At the cut every verifier still running is stopped; a stop that fails never holds the close, and the tool refuses
anything delivered later. A row is never counted verified on spec text alone — a verdict reads the built code.

## The ruling

- **Owed** for every row a verifier found `fails` or `unclear`, and for the tool's `toRule` rows: every
  `pending-triage` row of a register the plan names or the change touched, whatever its origin, and every row a
  register captured since the base. A row an earlier close ruled `deferred` is among them, and is re-ruled, dated
  this close, even when it is `deferred` again.
- **Also ruled here:** an unruled row in a register that a mutation re-check's mark put under this close.
- **The one exclusion:** a row of a code-mined, attested set (its unit has an `-attestation.md` sibling), whose triage
  stays the merge ceremony's.
- The rulings start only once `verified` has printed the rows owed, so a step another installed plugin runs before
  the rulings has its moment there; `toRule` rows may be ruled from `start` on.
- **Who rules:** the ruling architect (`architect.md` § Ruling on a Rule). On the team lane, a fresh `nexus:architect`
  on its resolved model; in the architect's own lanes, the lane's architect itself, coordinator and ruler at once —
  the self-review trade its file names, each ruling listed in the summary. On the team lane, with more rows owed than
  one ruler takes — about 8 — one ruling architect per register, all at once, never two on one register; in the
  architect's own lanes the lane's architect rules every row itself.
- **How:** this feature's failed rows first. Each ruling is written in two halves — on the register row by hand,
  the row's `ruling:` value carrying, after its word and date, the pass's token `rule check {slug} {pass}` that
  `start` and `rule` print, copied whole (it names the feature, so no other feature's ruling carries it), and in the
  record with `rule --pass {key} --rule {row} --ruling {r} --lands {l} --why {w}` — one row finished, both halves,
  before the next.
- At the cut a ruling architect still running is stopped, and `close` settles what it left part-way, matching the
  two halves by the token on the row's own `ruling:` — no changelog line is read for it: a row whose `ruling:` holds
  this pass's token gets its line in the record, and a record line whose row's `ruling:` lacks it, or opens with
  another word, is written `not checked — time limit`, still owed a ruling. A ruling written without the token reads
  as not reached, and the row is ruled again by a finishing run.
- **Owner away:** a row whose ruling would reverse a decision the owner made is ruled `deferred` — the open question
  written on the row, a `.claude/review-queue/` entry and a backlog row — and the close proceeds.

## The first pass and the re-check

- **Before every `start`**, the rule list's stamp check against the spec (load the `locate-miner` skill
  (`nexus-miner`), then read `mine-verify-cover/SKILL.md` § mine-from-spec mode beside it). Where the stamp still
  matches there is nothing to do. Where the spec changed since the list was mined, the list's re-check runs first —
  it also adds `kind` to an older list — and each row it added or changed is passed to `start` as `--also {ruleName}`.
  That re-check rewrites the rule list. Before the close's re-check it runs beside the pre-merge runs; where it has
  not finished when the close is otherwise ready, the re-check starts on the list as it stands and is cut with the
  rest, and the coordinator writes `rule list re-check owed` into the feature's backlog row, whatever the cut left:
  added to the row the cut prints, or a row of its own where the cut prints none.
- **The first pass** (`--pass first`) starts with the done check and the code review — for a feature with no rule
  list file, only where the handover listing finds a row to rule (§ When it runs, and who runs it) — and does not
  re-run on a follow-up. It reads only the rows the plan delivers: a row on the plan's *Not delivered by this
  feature* list is written `not delivered` and never verified.
- **The re-check** (`--pass delta`) starts when the close's merge-in lands — at the close's start where nothing is
  merged in — beside the pre-merge runs. It lists the rows whose cited files moved since the newest verified commit,
  and sends to the ruling the rows registers captured since then, and the unruled rows a register changed since
  then already held that the record does not name; its first block also re-tries a cut first pass's
  rows, once.
- After any later code change before the summary, another delta block runs. A block with nothing listed says so in
  one line.
- **An older record:** a `rule-check.md` written by hand that the tool cannot read makes `start` refuse, naming the
  heading and the row. That row is repaired by hand, once — the one hand edit the record ever takes. A base git
  cannot read is cleared by `start` again with `--base {ref}`, the merge-base the close used. Any other refusal
  names its cause; clear it and `start` again.

## The cut

The close is the only limit a pass inside the feature has. Once every other close condition holds, the coordinator
cuts every open pass, in one order: stop each ruling architect and verifier of that pass still running, then
`close --pass {key}`, which settles a ruling left half-written from the registers (§ The ruling). Nothing writes a
register for that pass after its `close`. The summaries' publish (§ The summaries during the review) comes after the
cut.

## The summaries during the review

- Once the first pass is closed, or a module has no row left owed a ruling, the coordinator starts that module's
  Distill run (load the `locate-miner` skill (`nexus-miner`), then read
  `mine-verify-cover/SKILL.md` § The Distill stage beside it) into a folder outside the tree — the session's
  scratch folder, never the tree — beside the review. The modules are those with an `## Owed` row (`team-lead.md` § Close Gate, item 4),
  save those a rule list's promotion will write (the plan's `{ruleName} → {area}/{unit}` lines), rebuilt after the
  close instead (§ After the close).
- At the close, after the merge-in and before `summary.md`, the coordinator runs
  `distill-publish.mjs --repo {tree} --module {module} --draft {folder}`, beside `rule-check.mjs`, for each draft. It
  holds the registers' lock and writes only where every register the draft read is unchanged: `published` lands
  `digest.md` and `index.md` and clears the module's `## Owed` row. `stale` or `incomplete` (exit 3) drops the draft,
  and the `## Owed` row stays for the next feature that touches the module; a draft not finished by then is dropped
  the same way. `held` (exit 4): run it once more; still held, drop it the same way. Exit 2 (a bad argument or an
  input it cannot read): clear the cause it names and run it once more; still 2, drop it the same way.
- A fix round needs nothing more: the publish catches a changed register. The coordinator may draft again beside
  the pre-merge runs.
- A feature with a rule list rebuilds the modules its promotion writes after the close (§ After the close).

## What a result owes

- The check is in when the pass's footer is written — a finished pass's, or a cut one's. Once every other close
  condition holds, the coordinator cuts any open pass (§ The cut): the close never waits on the rule check.
- A `code wrong` ruling made before the cut is an always-in row of the round's fix list, under the bold line naming
  the rule check.
- A cut never blocks and never asks the owner. `summary.md` Notes lists the rows `close` printed as not checked, those
  a verifier saw fail first, and the close writes one backlog row with the text `close` printed, by the carry-over
  row's rules (`team-lead.md` § Close Gate, item 9). With no backlog file, the summary is the record; a campaign unit
  hands the row as a change note.

## After the close

The close is reported to the owner before any of this starts, and nothing waits on it. Only a feature with a rule
list has work here: a feature without one had its rulings and its summaries during the review.

1. After the timeout solo, where one runs, `start --pass after` gives the after-merge rule work its 10-minute clock.
2. **The promotion** —
   `promote-rows.mjs --repo {tree} --slug {slug} --folder docs/specs/{slug} --rules {path} --write --deadline {iso}`,
   `{path}` the `specRules` path and `{iso}` that pass's deadline. A row lands as its verdict and ruling
   say: `verified` with `last_verified` the verify date, `pending-triage` carrying its ruling, or `rejected`. A row
   that restates an earlier row gives that row `status: superseded`, never a duplicate. The promoted row carries
   `spec-row:` and, from the developer's disposition, `test:`; the changelog entry names the slug after its date. A
   row a pass did not finish is written nowhere until a pass finishes it.
3. **Its exits.** 0: all written. 3: one helper agent writes only the rows it flagged, under the registers' lock —
   `--lock take --deadline {deadline}` before its first write, `--lock release --holder {holder}` after its last.
   4: another writer holds the lock — run it again; still 4, name the holder in the communication log and never
   write without the lock. 5: failed after some registers were written — run it again; it skips what it wrote. 2: an
   input it cannot read — the agent promotion, the whole of it, under the same lock, named in the communication log.
   6: stopped at its deadline — the rows it printed as `left` stay owed, and its printed backlog text starts or joins
   the feature's backlog row.
4. **The distill** — each module the promotion wrote, its run starting once its rows are written.
5. **The limit stops new work, never a write in flight**, and a write is one writer's run: the one register the
   script is writing, a helper's whole batch under the lock it took, one module's distill. After the deadline the
   script starts no further register, `--lock take` refuses, and no module's distill is started. A writer that began before the deadline
   finishes what it began; one that never returns is a stalled agent.
6. What was not started stays owed — the module's `## Owed` row and the feature's backlog row — and `after-close.md`
   reads `**After the close:** left — time limit`, with no deferral ask.

## A finishing run

Any main session asked to finish a feature's rule work from its backlog row:

1. Where the row says `rule list re-check owed`: the rule list's stamp re-check first, then `start --pass delta`
   with `--also {ruleName}` for each row it added or changed, the verifiers, the ruling, `close`.
2. Where rows are unfinished: `start --pass unfinished`, the verifiers, the ruling, `close`.
3. The promotion again, where the feature has a rule list — it skips what it wrote. Where only a promotion was cut,
   this is the whole run.
4. The distill, where still owed.
5. One commit of the registers and the record; the backlog row closed.

Nobody waits on a finishing run, so it runs under no limit — the tool keeps no clock for it. A code fault it finds
lies outside the feature, whose code is merged: it is ruled `deferred` with a backlog bug row whose `Cause:` is the
feature (`architect.md` § Ruling on a Rule).

## Resume

`status` says where each pass stands. A pass inside the feature has no clock, so one still open is taken up where it
stands — the groups `status` shows with no verdict are dispatched again, and a lost ruling is started again for the
rows still owed — until the close cuts it. An after-merge pass whose deadline passed while the session was down is
closed with `close`. A command that fails naming a lock whose holder no longer runs, or one older
than 5 minutes: the coordinator runs `unlock` — its own command, never a verifier's or a ruling architect's — then
the command again. A younger lock whose holder runs is refused, its age and the time it may be removed named.

## The record

`docs/specs/{slug}/delivery/rule-check.md` is written only by the tool; its form is the header of `rule-record.mjs`.
Nobody edits a table by hand, save the one repair of an older record that § The first pass and the re-check names.
