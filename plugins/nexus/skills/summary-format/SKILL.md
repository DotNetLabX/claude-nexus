---
name: summary-format
description: Format spec for docs/specs/{slug}/delivery/summary.md — written by the team lead after approval, or by the standalone architect at the close of an Architect-Led Fast Lane run; its existence means the pipeline completed. Load when closing a pipeline run.
---

# Summary File Format

Written after approval: `docs/specs/{slug}/delivery/summary.md`. Its existence means the pipeline completed successfully. **Producers** (below) covers who writes it.

**Producers.** Two: the team lead (pipeline runs), or the standalone architect at the close of an Architect-Led Fast Lane run (`architect.md`) — the lane's mode-scoped ownership exception. **Every** `summary.md` carries one mode line, right under its title: `Mode: team pipeline ({definition})` from the team lead, or `Mode: architect-led fast lane ({level}, {definition})` from the architect, where `{level}` is `light` (the fast lane with its checks turned down, `architect.md`) or `full`, and `{definition}` is `spec`, `bug` or `epic` (the file under `definition/`: `spec.md`, `bug.md` or `epic.md`), else `ADR` (an ADR-collapsed definition), else `plan only`. A summary written before this grammar keeps the line it has. Consumers (the learner-cadence hook, the team-lead idempotency gate) treat both as a completed run — they check the file's existence, not its producer or content — the pipeline gate also requires the mode line at write. A reader of the closed run's record matches the phrase `architect-led fast lane`, so the architect's line always keeps that phrase.

**The `**Full suite:**` line is required in EVERY summary.md** — including one for a repo that
declares no suite, where it reads `undeclared`. An absent line and a disclosed absence are different
claims, and only the second is evidence that anyone checked.

Its verdict, duration and timestamp are transcribed from the close gate's full-suite record — the one
`verify-run.js --profile complete` appends, which is the handover run's record when the close reused
it — never from recollection. The record carries no test **count**,
so read `N tests` off the suite's own output, or drop that clause when the runner reports none. The
three values are the record's verdict: `pass`, `fail`, or `undeclared` when the repo declared no
`roles.full`. A record whose only failures are timeouts in tests the change did not touch counts as
passing at the close yet still reads `fail` here; the Notes' `Timed out, sent to solo:` line says why
it closed. A red whose every failure passed when re-run alone also closes yet reads `fail` here; the
Notes' flaky line says why. Carry the timestamp so a reader can tell a fresh run from a stale one. The gate that
produces the record, and the fork a `fail` takes, are `team-lead.md` § Close Gate item 5 — cited, not
restated.

The line's two measurement fields come from the same record. `filtered` is transcribed from the
record's `filtered` field. **Complete red on a fast-green tree** is derived from two fields: `yes` when
the record's `verdict` is `fail` **and** its `fast_green` is `pass`; `not measured` when `fast_green` is `none`;
`no` otherwise — a passing complete run on a fast-green tree reads `no`, never `yes`, and so does a `fail`
whose only failures are timeouts in tests the change did not touch (`reason: "tests-timed-out"`, every
`timed_out` entry `touched: false`): it counts as passing, so it is no red. Worked:
`verdict: pass, fast_green: pass` → `no`; `verdict: fail, fast_green: pass` → `yes`;
`verdict: fail, reason: tests-timed-out, all untouched, fast_green: pass` → `no`;
`verdict: fail, fast_green: none` → `not measured`.

**The `**Map delta:**` line is required in EVERY summary.md too — and it is never a verdict.** It
carries no pass/fail and nothing consumes it as a gate. It exists so that a reader can see the map's
drift trend across closes without anyone having to run anything. **Transcribed verbatim, never
recomputed** — exactly as the full-suite line is transcribed from its record.

What gets transcribed is the meter's **headline line**. When rows do cite changed files the meter
also prints one indented line per file; those are detail for whoever chases the drift, not part of
this record. Where the repo has no architecture map the meter prints nothing and the line reads
`none`; where the path to the meter could not be had it reads `unavailable`; and where the meter
could not measure it prints its own reason ending `; skipped.` — an unstamped map, a basis that no
longer resolves, a tree that is not a git repository — which is transcribed as-is. **Every one of
those is a COMPLETE record, not a gap** — otherwise a reader treats the absence of a number as an
open item, which is precisely what this line is designed not to create.

The line itself never blocks a close. The **one** case where the underlying meter does is a repo
that declares `Map cadence: per-merge` in its anchored-set manifest, having asked for the block; the
default is `milestone`, under which it never blocks. That mechanism belongs to the gate, not to this
format — the gate that produces the line is `team-lead.md` § Close Gate, the map-delta item, cited
by content anchor and never by ordinal, because an ordinal pointer silently redirects when an item is
inserted above it.

**Section map (targeting index).** `summary.md`'s fixed top-level headings — the set agents target for a section read (ADR-22 Extended): `## Status`, `## What Was Built`, `## Key Outcomes`, `## Deviations from Plan`, `## Notes`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around the section you need rather than the whole file.

```
# {Feature Name} — Summary
Mode: team pipeline ({definition}) | architect-led fast lane ({level}, {definition})
Gear: {gear} — {campaign | switch | repo} | none — at the spec review: {gear | none}, only where it differed

## Status: COMPLETE

## What Was Built
- [1-3 sentence description of the feature/change]

## Key Outcomes
- [Files created/modified count]
- [Build status]
- **Full suite:** pass | fail | undeclared — {duration} (recorded {ts}; complete red on a fast-green tree: yes | no | not measured; filtered: yes | no)
- **Map delta:** {the meter's headline line verbatim} | none | unavailable
- **Rules:** {n} listed behaviour rules without a disposition · {n} `tested` rules whose named test does not exist (the done-check's report-only count, from the newest footed check in `done-check.md` — any completion footer counts, a Codex check's `*Status: COMPLETE — Codex, persisted by {session}, {date}*` included; omit the line when the plan listed no rules). In an architect-led fast lane, also the close's rulings, one per row: `{unit} {row id}: {ruling}`
- **Risky steps:** {the line of `review.md`'s risky-steps section, verbatim} — the light lane only
- [Review verdict and cycle count]

## Deviations from Plan
- [Any deviations, or "None"]

## Notes
- [Anything the user should know before committing]
- **Under the bar:** {the rows, one per line, `[LEVEL] title — file:line (source)`} | none — **Carry-over row:** {row id} | none (no MEDIUM) | no backlog (this list is the record) | none ({gear} gear — not fixed, this list is the record)
- **Slow tests kept:** {`{test} — {reason}`, one per line} | none
- **Timed out, sent to solo:** {`{file}:{line} {test} — {the solo's commit | pending}`, one per line} | none | {backlog row id} (campaign unit)
- **Flaky — passed when re-run alone:** {`{file} — {its failing test}`, one per line} — **Backlog row:** {row id} | no backlog (this line is the record) | none
```

**The `Gear:` line** sits under the mode line in every summary: the gear the plan header names (`gear.js fix` printed it), or `none`, and — only where it differed — the gear in force at the spec review, from the spec's `**Gear at review:**` line (→ agents-workflow.md § Gears).

**The `**Under the bar:**` line** is the union of every under-bar block in `review.md` — each fix list's (the block after the follow-up line, `review-format`) and each `## Step 2 — Merge, no fix round` section's — keeping the rows that no later round fixed, deduped by file:line and title — the items the fix-round bar left recorded but unfixed (→ agents-workflow.md § Fix rounds). `none` when no block left any. Its **Carry-over row** field names the backlog row the close wrote for the MEDIUMs among them, by its id — the gate that writes it is `team-lead.md` § Close Gate, the carry-over-row item, cited and not restated. It reads `none (no MEDIUM)` when the union holds LOWs only, `none ({gear} gear — not fixed, this list is the record)` under a gear that leaves those findings unfixed, and `no backlog (this list is the record)` in a repo with no backlog file.

**The three test lines name tests, not a run.** They are apart from the `slow` a complete record may carry, which says a crowded machine slowed the whole run. `Slow tests kept:` gathers every `Slow kept:` line of `implementation.md` — step blocks, fix rounds and solo blocks (`implementation-format`): a test still over the speed-up line after its one try, kept with its reason. `Timed out, sent to solo:` lists every timeout in a test the change did not touch that a record of the round let through the close (`team-lead.md` § Close Gate, the full-suite item). The solo runs after the closing commit, so the line reads `pending` when it is written; in a campaign unit no solo runs, and the line names the backlog row instead. `Flaky — passed when re-run alone:` lists each failed test file of a red complete run that passed when re-run once by name from the coordinating session, or that passed on the once-unchanged complete re-run where `--files` cannot take its target — flaky, never fixed in the run (`team-lead.md` § Close Gate, the full-suite item); its **Backlog row** field names the one row the close wrote listing them, or reads `no backlog (this line is the record)` in a repo with no backlog file. Each line reads `none` when there is nothing to list.

**The `**Risky steps:**` line** appears on a light-lane run only (mode line level `light`), or a team pipeline run on the light path under a gear: it transcribes the one line of `review.md`'s `## Step 2 — Risky steps` section verbatim, the failed-recheck form included, so the close record says which steps had the second reader's full read (`review-format`); on a light-lane run whose plan carries `**Skills per step:** on`, that reader also ran the skills check over every other step (→ architect.md § Light Lane (standalone only)). Every other summary omits it.
