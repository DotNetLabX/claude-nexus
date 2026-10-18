# The routine questions — the catalogue

The plugin's fixed owner questions, one entry each. A question this file holds is asked as a
**routine ask**, in the short form's standard-question variant: one line naming the entry and this
run's own facts, at most one more fact line where one sentence cannot hold them, then the question
sentence, then the entry's options.

```
{catalogue name}, routine: {this run's own facts, one sentence}
{the rest of this run's facts, one sentence — only where the routine line cannot hold them}
{the question sentence}
```

The word `routine` tells the owner this question is asked by rule in every run of its kind, and it
appears nowhere else in the ask. The entry's name on that line is the one place a word from the
plain-words list that ships beside this file may appear; every other part of the ask says the plain
thing instead. An ask site names its entry and restates nothing from it — the
entry owns the wording, the option set, the recommendation rule, the away line and the long form —
and a routine line is valid only with a name this list holds.

When the owner answers `explain` or `?` alone, or asks in a sentence what the question is or means,
the entry's **long form** is re-asked in its place, in the relaxed form: a why line saying why the
plugin asks, up to two more fact lines, then the same question sentence and the same options word for
word, with the same recommended option. A long form names no entry and carries no routine line, and
it says something the short form did not. That re-ask counts as no new round, cycle or escalation.
How all of this is composed is stated once in `research-before-asking.md` § Routine questions; this
file holds the entries that section points at, and a reader new to the plugin reads it once.

Each entry's **This run** block is the routine ask's context as it is asked, with `{placeholders}` for
the run's facts: the routine line and, where one sentence holding those facts at their usual length
would run past about 100 characters, one fact line. A run whose facts fit the routine line asks it
alone. The long form may carry the same facts. Each option's consequence is one sentence, and the
long form carries it word for word.

Each entry's **With the owner away** line says what an owner-away run does in place of asking: first
the answer a run declared in the owner's own words takes, then the typed marker's, or "the same". It
is the one home of the words-declared answer, and the rule it serves is stated once
(→ agents-workflow.md § Owner-away runs).

Four entries carry an **Under a gear** line: the answer a feature's gear gives in place of the
question, attended or away (→ agents-workflow.md § Gears).

## Entries

#### Shared: the model-choice option set

Both entries that ask which model checks another model's work when the two share a family — the
reviewer and critic pairing checks — derive their options the same way, from the reader-pair list
(`agents-workflow.md` § Critic rounds): the main reader of each pair whose conditions hold in this run
and whose main is not the author's family, in the list's order, the recommended one first — counted
from pair 3 where the colliding checker was set explicitly, by a spawn parameter or the repo's own
per-agent entry, since that opts out of the first two pairs; then Fable,
a plain option never recommended, left out where Fable is the author's family; then keep the same
model. The `reader pair` entry, which asks who reads a first-round
review, is the one model question with its own option table. Options whose condition does not hold in a run are left out, and the set of
models eligible to check is closed.

   - **Option rendering:** every option leads with its **concrete model name, resolved at ask time** (from the stamp, config, frontmatter, or the Codex config file), then its reasoning. Never hardcode a model name in an option template. When a name cannot be resolved at ask time, fall back to the ordinal labels `next 1st best` / `next 2nd best` / `Codex default`. Policy vocabulary ("next-best", "first-entry", "neighbor") never appears as option text.
   - **Cheaper picks are first-class:** every option carries an equal-weight reasoning line. Beyond the recommended option leading, that never reorders the list.

### slug confirmation

**When asked:** asked in the closing turn of a conversation on a source, else before a spec is written, and again when an ad-hoc slug outgrows a solo change and is re-slugged.
**Surfaces:** question box; questions file.
**Options:**

| label | consequence | offered when |
|---|---|---|
| the proposed name | the spec folder and the branch take it | always |
| a name you give instead | you name it; folder and branch follow | always |

**Recommended:** the proposed name, unless the user has already named one in the conversation.
**With the owner away:** a PO's or team lead's proposed name is taken, since they assign slugs; a standalone architect or solo that needs a new slug waits on it, since it may only ask for one. Typed marker: the same.
**Long form:**

```
A rename later moves both the spec folder and the working branch, so the name is cheapest to settle now.
The proposed name is {the proposed name}, built from {the words it came from}.
Is {the proposed name} the right name for this feature?
```

**This run:**

```
Slug confirmation, routine: the proposed name is {the proposed name}.
It is built from {the words it came from}.
```

### review mode

**When asked:** asked in the closing turn of a conversation on a source; otherwise before a spec goes Ready, before a plan is written, and at a technical definition checkpoint when no closing turn asked it.
**Surfaces:** question box; checkpoint report.
**Options:**

| label | consequence | offered when |
|---|---|---|
| an independent critic reads it | a second reader raises gaps before work starts | always |
| self-review only | fastest; gaps surface later, during the build | always |

**Recommended:** an independent critic where the work is complex or costly to get wrong, self-review otherwise.
**With the owner away:** the option you would have recommended. Typed marker: self-review (`team-lead.md` § Unattended Mode).
**Under a gear:** not asked; the gear's review is taken — self-review, Codex alone, or a critic — and named in the record with the gear; under `off`, or where the gear says ask me, it is asked as above.
**Long form:**

```
A gap found before the work starts costs a paragraph, and the same gap found mid-build costs a rewrite.
This {artifact} comes from {its author}, and it is {its size or intent class}.
How should this {artifact} be reviewed?
```

**This run:**

```
Review mode, routine: this {artifact} comes from {its author}.
It is {its size or intent class}.
```

### options panel

**When asked:** asked in the closing turn in the plan type's place, with the plan-review question, only when the cost-of-being-wrong gate trips; the plan type then follows in the panel's result turn when the panel is taken, and in the turn right after the closing turn when it is declined.
**Surfaces:** question box; checkpoint report.
**Options:**

| label | consequence | offered when |
|---|---|---|
| run the panel | independent positions are drafted and merged before the plan | the gate tripped |
| skip the panel | the plan proceeds on one position | always |

**Recommended:** run the panel when the design is expensive to reverse, skip it otherwise.
**With the owner away:** not run; the plan is written on your one recommendation and the build waits for the owner on that choice, so the `build lane` question is not reached. Typed marker: the same.
**Long form:**

```
Two positions drafted apart and then merged surface the disagreements one position never notices.
Here the design was flagged for {what it flagged}.
Reversing this design would cost {what reversing it costs}.
Run an options panel on this design?
```

**This run:**

```
Options panel, routine: the design was flagged for {what it flagged}.
Reversing this design would cost {what reversing it costs}.
```

### plan overwrite or resume

**When asked:** asked when a plan already exists for this feature at analysis time.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| resume the existing plan | the work continues from where it stopped | a plan exists |
| overwrite it | the existing plan is replaced; its steps are lost | a plan exists |

**Recommended:** resume, unless the existing plan predates a decision that changed the feature.
**With the owner away:** resume; a plan is never overwritten. Typed marker: the same.
**Long form:**

```
An existing plan carries decisions taken and questions answered, and a fresh plan pays for them again.
The plan for this feature was written on {when it was written} and got as far as {how far}.
Resume the existing plan, or overwrite it?
```

**This run:**

```
Plan overwrite or resume, routine: a plan for this feature was written on {when it was written}.
It got as far as {how far}.
```

### reviewer pairing check

**When asked:** asked at a review outside the first round — a re-review that covers no built step, or a later round whose author changed — when the code's author and its reviewer share a model family; a first-round match is the `reader pair` entry's.
**Surfaces:** question box; checkpoint report.
**Options:** derived — see the shared model-choice option set above.
**Recommended:** the main reader of the reader-pair list's first applicable pair — the first whose conditions hold and whose main is not the author's family, from pair 3 on where the reviewer was set explicitly — never Fable.
**With the owner away:** the pairing check runs as attended and takes the option it would have recommended, with no ask (`team-lead.md` § Checker-Seat Pairing Check). Typed marker: that check's unattended step, step 6.
**Long form:**

```
A model that checks its own family's work tends to agree with it, so a blind spot in the code survives.
This time {the author model} wrote the code, and the reviewer is set to {the reviewer model} too.
Which model reviews this step?
```

**This run:**

```
Reviewer pairing check, routine: {the author model} wrote the code, and the reviewer is set to {the reviewer model} too.
```

### critic pairing check

**When asked:** asked at a review outside the first round — a later round whose author changed — when a spec's or plan's author and its critic share a model family; a first-round match is the `reader pair` entry's.
**Surfaces:** question box; checkpoint report.
**Options:** derived — see the shared model-choice option set above.
**Recommended:** the main reader of the reader-pair list's first applicable pair, from pair 3 on where the critic was set explicitly, never Fable.
**With the owner away:** the pairing check runs as attended and takes the option it would have recommended, with no ask (`team-lead.md` § Checker-Seat Pairing Check). Typed marker: that check's unattended step, step 6.
**Long form:**

```
A checker from the family that wrote a document agrees with it too easily, so its gaps go unreported.
This time {the author model} wrote the {artifact}, and {the checker model} is set to check it.
This review allows {what it allows}.
Which model reviews the {artifact}?
```

**This run:**

```
Critic pairing check, routine: {the author model} wrote the {artifact}, and {the checker model} is set to check it.
This review allows {what it allows}.
```

### reader pair

**When asked:** asked once per feature, at its first first-round review (once per consolidation at the learner's seat), and again where the pick would lead with the author's own model family or was only presumed; never where the owner has already named the checking model for that spawn.
**Surfaces:** question box; checkpoint report.
**Options:**

| label | consequence | offered when |
|---|---|---|
| Codex, with Sonnet reading second | Codex leads every review — spec, plan, code and promotion — and Sonnet reads beside it | Codex is installed |
| Sonnet, with Opus reading second | two readers from two families, the second one costlier | the author is not Sonnet |
| Opus, with Sonnet reading second | two readers from two families, the second one cheaper | the author is not Opus |
| {the checker model} alone | one reader, cheaper and faster than a pair, and the record says the second was skipped | the configured model is not the author's family |
| Fable, with Sonnet reading second | the strongest reader leads, at the highest cost | the author is not Fable |

**Recommended:** the reader-pair list's first applicable pair (`agents-workflow.md` § Critic rounds) — the Codex option where it is offered; otherwise the first two-reader option, in the table's order, whose leading model is neither the author's family nor Fable. Either way, its second reader is replaced by the repo's `jobs.secondReader` model where that is set and usable, rendered under the option's concrete names — on the Codex option that is the reader beside Codex, at every review. Fable is never recommended, and where it is the configured checker its option is labelled as the configured model; the one exception is a repo-set Fable second reader in an attended run, which the recommended option names.
**With the owner away:** the pairing check runs as attended — its precedence, its collision check and its second-reader rules unchanged — and takes its recommended option with no ask, recorded `presumed` (`team-lead.md` § Checker-Seat Pairing Check). Typed marker: that check's checker-resolution and unattended steps, steps 2 and 6.
**Under a gear:** not asked; the gear's pair is taken, its second reader still the repo's `jobs.secondReader` where that is set and usable, and named in the record with the gear; under `off`, or where the gear says ask me, it is asked as above. A consolidation takes no gear, so the learner asks it as before.
**Long form:**

```
Two readers from two model families miss less than one, and the lead is never the author's family.
This time {the author model} wrote the {artifact}, and {the checker model} is set to check it.
Who should read this feature's work at its first review?
```

**This run:**

```
Reader pair, routine: {the author model} wrote the {artifact}, and {the checker model} is set to check it.
```

### branch or worktree election

**When asked:** asked at a fresh launch on the default branch or on an unrelated branch.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| continue on this branch | work lands on the branch already checked out | always |
| a new branch from the default | clean history; it still shares this working copy | always |
| a new branch stacked on this one | builds on unmerged work already here | the current branch is not the default |
| a separate working copy | this feature is isolated; the folder is removed after its merge | always |

**Recommended:** by tree state and work shape —

- Dirty tree, dirt belongs to **this same work** (fix-cycle) → recommend **continue here**.
- Dirty tree, dirt is **unrelated / another feature's in-flight work** → recommend **worktree** (isolate the new work; never build on a tree you can't commit cleanly). Stash-then-branch is fallback guidance only — when a worktree is impractical — never a first-class option.
- Clean tree, small single-commit change → recommend **continue here**.
- Clean tree, multi-commit / PR-bound feature → recommend **new `{slug}` branch from the default**.
- New work **builds on** the current unmerged branch → recommend **stacked branch**.
- Work will run **in parallel** with other active work in this checkout (another session/agent), is long-running, or sits on a dirty tree that must stay untouched → recommend **worktree**.

**With the owner away:** the branch matrix's unattended column with its dirty-tree and stale-default overlays, for every seat, solo included (`agents-workflow.md` § Branch Pre-Flight & Default-Branch Resolution); a worktree only where the owner's launch words named one. Typed marker: the same column.
**Long form:**

```
A folder shared with another session's unsaved changes cannot take a commit without sweeping them up.
You are on {the branch}.
The folder holds {its changed files and whose they are}.
Where should this feature's work happen?
```

**This run:**

```
Branch or worktree election, routine: you are on {the branch}.
The folder holds {its changed files and whose they are}.
```

### verify-roles declaration

**When asked:** asked at pre-flight, once per repo, when the repo declares no unit verify command.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| declare them now | the repo's conventions are read and a block is proposed for your approval | always |
| skip for this run | the run proceeds and names the gap in its report | always |
| stop asking in this repo | the prompt is silenced; the speed features stay off | always |

**Recommended:** declare now — it is one pass, and every later run reuses it.
**With the owner away:** skipped, and named in `summary.md`. Typed marker: the same.
**Long form:**

```
Each run needs to know how to test this repo, and the answer is stored here so it is asked only once.
This repo has not declared {which commands}.
Without them, each run {what it does instead}.
Declare this repo's verify commands now?
```

**This run:**

```
Verify-roles declaration, routine: this repo has not declared {which commands}.
Without them, each run {what it does instead}.
```

### checkpoint decision

**When asked:** asked at every checkpoint that carries action options.
**Surfaces:** checkpoint report; question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| the default action | the pipeline moves to its next phase | always |
| {the alternative} | {what picking it changes} | the checkpoint offers one |

The report's own `Stop` line is a template element, never one of this entry's options, so it is
neither listed here nor counted toward the four a question may carry.

**Recommended:** the default action, unless the checkpoint's own findings argue against it.
**With the owner away:** the recommended option, unless the action is one-way or the point is reserved for the owner — the first two rows of the open-point table (→ agents-workflow.md § Owner-away runs). Typed marker: the same.
**Long form:**

```
Moving on builds the next phase on what this one found, and stopping gives up the time spent so far.
The {phase that just finished} is done.
Its findings were {what they were}.
What happens next?
```

**This run:**

```
Checkpoint decision, routine: the {phase that just finished} is done.
Its findings were {what they were}.
```

### research companion

**When asked:** where the `research` skill (`nexus-pro`) is in your skill list, asked beside a question whose options are already full and a fact would settle it.
**Surfaces:** question box; questions file.
**Options:**

| label | consequence | offered when |
|---|---|---|
| measure it first | this answer waits and is re-asked with what the data shows | always |
| answer now | the recommendation stands, unverified | always |

**Recommended:** measure first when the fact would change the recommendation, not just its wording.
**With the owner away:** the research runs where the question it serves is one the run proceeds on. Typed marker: the same.
**Long form:**

```
An answer given now stands on a guess, and if a later measurement contradicts it, the work is redone.
The question beside this one rests on {the unknown}.
Measuring {the target} would cost about {the rough cost}.
Measure {the target} before answering the question beside this one?
```

**This run:**

```
Research companion, routine: the other question rests on {the unknown}.
Measuring {the target} would cost about {the rough cost}.
```

### merge at close

**When asked:** asked at close, attended, when the run ends on a branch with no pull request.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| squash-merge now | the branch lands on the default line and the working copy is removed | always |
| stop at the commit | the branch is handed to you by name and nothing merges | always |

**Recommended:** squash-merge when the run closed clean and nothing else is building on the branch.
**With the owner away:** stop at the commit and name the branch. Typed marker: the same.
**Long form:**

```
Until the branch lands, this work exists only here, so anything built on it starts unmerged.
This feature's work is committed on {the branch}.
It is not yet on {the default branch}, and a separate working copy is {in play or not}.
Squash-merge {the branch} into {the default branch} now?
```

**This run:**

```
Merge at close, routine: this feature's work is committed on {the branch}.
It is not yet on {the default branch}, and a separate working copy is {in play or not}.
```

### push

**When asked:** asked after the final feature commit, attended, before anything leaves this machine.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| push to {the remote} | the commits leave this machine and others can see them | always |
| keep it local | nothing is published; the commits stay here | always |

**Recommended:** push when the run closed clean and the branch is meant to be shared.
**With the owner away:** no push, unless an explicit owner instruction that the seat's own text already honours says to. Typed marker: the team lead's `autoPush` setting decides, by its push gate.
**Long form:**

```
A push is hard to take back, because once the commits are out, anyone with access has them.
There are {how many} local commits on {the branch}, and {the remote} has not seen them.
Push {the branch} to {the remote}?
```

**This run:**

```
Push, routine: {how many} commits are local on {the branch}, and {the remote} has not seen them.
```

### learner approval gate

**When asked:** asked before any lesson is promoted into a shared file.
**Surfaces:** question box; checkpoint report.
**Options:**

| label | consequence | offered when |
|---|---|---|
| apply the promotions | the listed edits land in the listed files | always |
| apply a subset you name | only what you name lands | always |
| apply none | nothing changes; the lessons stay recorded | always |

**Recommended:** apply, where every promotion carries its measured size and a pruning pass has run.
**With the owner away:** nothing is promoted; the proposals are listed. Typed marker: the same.
**Long form:**

```
Each line added to a shared file is read by every later run, so its cost is paid again and again.
There are {the count} lessons ready for {which files}.
They would add {the measured growth}.
Apply these promotions?
```

**This run:**

```
Learner approval gate, routine: {the count} lessons are ready for {which files}.
They would add {the measured growth}.
```

### plan only

**When asked:** asked when a request with no spec reaches a standalone architect, in a repo that declares its complete test run.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| plan it now | the plan alone defines it; once it is written I recommend lighter or full checks, and you choose before its review | always |
| shape a spec first | a written spec comes first, then the plan | always |
| small enough for Solo | one session makes the change with no plan and no separate review | the change fits Solo's scope |

**Recommended:** plan it now, where the request has no product what to shape; a spec first where it has one.
**With the owner away:** shape a spec first; a plan-only definition is never chosen without you. Typed marker: the same.
**Long form:**

```
A plan alone starts sooner, and a written spec settles what to build before anything is planned.
The request is {its intent class}, has no spec, and would change {what it changes}.
How should this change be defined?
```

**This run:**

```
Plan only, routine: the request is {its intent class}, has no spec, and would change {what it changes}.
```

### plan type

**When asked:** asked in the closing turn, or in the Options Panel's result turn when a panel runs, or in the turn right after the closing turn when the panel was offered and declined, only when the architect expects a full plan; a plan it expects light is written light, and a refactoring plan always takes the full format.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| light plan | a short plan, reviewed in one round where you then pick the fastest build, and written out in full first for any other | always |
| full plan | every section is written, so any way of building it can follow | always |

**Recommended:** the plan the architect expects, which is `full plan`, since the question is asked only then.
**With the owner away:** not asked; the plan takes the format the architect expects. Typed marker: the same.
**Under a gear:** not asked; the plan takes the gear's plan detail, named in the record with the gear; under `off`, or where the gear says ask me, it is asked as above.
**Long form:**

```
A short plan is written and reviewed sooner, and a full plan holds every section any way of building it needs.
The change is {its intent class}, and I expect a full plan.
It would have {its step count and the mix of step kinds}.
How detailed should the plan be?
```

**This run:**

```
Plan type, routine: the change is {its intent class}, and I expect a full plan.
It would have {its step count and the mix of step kinds}.
```

### build lane

**When asked:** asked right after a standalone plan is written, before its review, to settle who builds it and how it is reviewed; the options are listed by preference, the recommended one first.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| fastest — lighter checks | it is built now, then checked once at lower effort, with one round of fixes | the plan declares no developer split and the repo declares its complete test run (`roles.full` in `.claude/verify.json`) |
| fast — full checks | it is built now in this session; every fix is re-read, up to three rounds, so fewer issues slip through | the plan declares no developer split |
| thorough — full team | separate roles plan, build and review it; it catches the most and can run while you are away | always |
| stop after the plan | nothing is built; the plan waits | always |

**Recommended:** `thorough — full team` for more than 8 developer-built steps or a declared developer split; otherwise the level the plan's `**Lane:**` header names — `fastest — lighter checks` for light, `fast — full checks` for full. The other offered options follow by preference: after `thorough — full team` — `fast — full checks`, then `fastest — lighter checks`; after `fast — full checks` — `thorough — full team`, then `fastest — lighter checks`; after `fastest — lighter checks` — `fast — full checks`, then `thorough — full team`; `stop after the plan` always last. The recommendation's reason says why in plain words — the plan's size, a developer split — and never names the `fullChecks` list.
**With the owner away:** not asked; the lane you would have recommended from the finished plan, with `fast — full checks` in place of `fastest — lighter checks` — a lighter-checks build needs you. Typed marker: the same.
**Under a gear:** not asked; the build takes the gear's lane, named in the record with the gear, and the away swap to `fast — full checks` above does not apply — a gear's lighter-checks build runs unattended too; under `off`, or where the gear says ask me, it is asked as above.
**Long form:**

```
A session building its own plan also reviews it, and separate roles read it fresh but add rounds.
The plan is {its intent class} with {its step count and the mix of step kinds}.
The available lanes are {which ones}.
Who builds this plan?
```

**This run:**

```
Build lane, routine: the plan is {its intent class} with {its step count and the mix of step kinds}.
The available lanes are {which ones}.
```

### cut candidates

**When asked:** asked at a standalone plan's approval, only where the repo turns the feature on (`features.planCutCandidates` in `.claude/nexus-agents.json`), one question per part offered for deferring, at most three questions to a box, every answer in before any part is cut; asked as written under any gear, since it asks what is built, not how; never under `stop after the plan`.
**Surfaces:** question box.
**Options:**

| label | consequence | offered when |
|---|---|---|
| Keep it | it is built with the rest of the plan, as its steps say | always |
| Defer it | it leaves this plan and becomes the backlog row {the proposed backlog row} | the repo keeps a backlog |
| Defer it | it leaves this plan, and the plan and the approval message name it as cut | the repo keeps no backlog |

A part's label runs to at most 40 characters and what deferring it loses to at most 35, so every line fits; the proposed backlog row is written as its id inside backticks, never bare.

**Recommended:** `Defer it` only when two readers from two model families both say `safe to defer` at medium or better — and where the first round had more readers, every one of them; otherwise `Keep it`, which any `keep`, any low, a disagreement, a part changed after its verdicts or fewer than two verdicts gives.
**With the owner away:** not asked; nothing is cut — the offered parts and their verdicts go on the run's list. Typed marker: the same.
**Long form:**

```
A part built only for a rare case, a seldom-run flow or a second copy can often wait without anyone missing it.
Deferring {the part} loses {what deferring it loses}.
{each reader's verdict and confidence}.
Keep {the part} in this plan, or defer it?
```

**This run:**

```
Cut candidates, routine: deferring {the part} loses {what deferring it loses}.
{each reader's verdict and confidence}.
```
