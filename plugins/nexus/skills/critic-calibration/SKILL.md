---
name: critic-calibration
description: "Grade a review finding against a ruler of past findings whose outcome is known, rather than against a category list graded against itself — cite the anchor below and above, band instead of rounding up, and never downgrade data loss, security or silent wrong output. Use when writing a critic finding and choosing its level, when a persona re-grades one at the fold, when a repository wants its own overlay ruler derived from its own review records, when a grading sitting needs a candidate sheet or a blind re-grade scored, or when a consolidation needs the per-round calibration figures — citation rate, miss tags, level bias — measured rather than estimated."
---

# Critic Calibration

A severity scale that is a **category list** is graded against itself. "An ambiguity two people would
interpret differently" stretches — almost any sentence admits two readings if the reader wants it to
— so a HIGH in round two need not be the size of a HIGH in round one on the same document, and a
rising action floor can be cleared by inflation.

This skill replaces the category list with a **ruler of past findings whose outcome is known**, and
one rule: every finding cites an anchor, or says in as many words which of the two unranked forms it
carries and why — a level is never assigned without one or the other behind it.

## The ruler you cite

Two files, same shape:

| | Where | Derived from |
|---|---|---|
| **seed** | `references/ruler.md`, beside this file | the graded corpus that ships with it |
| **overlay** | `docs/critic-calibration/ruler.md` in the repository under review | that repository's own review records |

**Precedence.** The overlay's cell wins where it is **not thin**; the seed fills a thin overlay cell;
with no overlay on disk the seed stands alone.
A cell carrying the line `Thin cell — {n} anchor(s); cap confidence.` has too little evidence to
settle a level on its own — cite it, then say so and prefer a band. A cell reading `No anchor yet` is empty, and so is a ruler that has not been derived at all: in both cases the finding is `unranked — no ruler yet` — **no ruler loaded, or the loaded ruler's cell for this kind and level is empty** — and it **keeps its level**, because a reader the ruler cannot reach has still judged honestly. Never stretch a neighbouring cell to cover it.

**Never downgrade**, under seed or overlay alike: **data loss · security · silent wrong output**. A
finding in one of those three classes keeps its level however thin the cell is and whatever the
neighbouring anchors say.

Each cell is a small table of anchors with the outcome that confirmed them, plus at most one
**negative** anchor — a finding graded at that level that turned out to be churn or settled lower.
The negative is the one that stops inflation: if your finding resembles it more than the positives,
it is not that level.

## How to cite

1. **Grep the corpus for the same `shape` first.** The sharpest anchor is usually a past finding of
   the same shape, not the nearest-looking consequence. `docs/critic-calibration/corpus.jsonl` in the
   repository under review carries every record; the ruler carries only the anchors chosen from them.
2. **Place the finding by comparison to the anchor below AND above it** — never nearest-only. "Worse
   than {lower anchor} because the wrong figure is never visible; not as bad as {upper anchor}, which
   loses data" is a citation. "Feels like a HIGH" is not.
3. **No citation, no level.** A finding no anchor fits is reported *unranked* and handed to the
   persona to grade — it is not silently rounded to the level that feels right.
4. **Unsure between two levels: report a band with its driver**, never the higher of the two. The
   driver names the fact that would settle it.
5. **A re-grade is a record, not an opinion.** A persona overriding a cited level writes the level it
   gives, the anchor, and one line of why, in the fold.

## The finding block

Machine-readable by design: the fold's merge table is built from these fields, and a later
extraction reads that table rather than re-parsing prose.

```
### [{LEVEL}] {id} — {title}
**Anchor:** {anchor-id} · above {lower-anchor-id} · below {upper-anchor-id}
**Band:** {LEVEL}–{LEVEL}; driver: {one clause}
**Shape:** {short tag}
**Consequence:** {at most 160 characters, stack-neutral, consequence-worded}
**Evidence:** quoted | scenario | path | none
**Surfaces:** {file § section}; {file § section}
**Untouchable:** data-loss | security | silent-wrong-output
**Tag:** round-1 miss: {surface}
**Source:** … **Issue:** … **Impact:** … **Fix:** …
**Route:** plan must resolve
```

`Anchor`, `Shape`, `Consequence`, `Evidence` and `Surfaces` are **mandatory** — the extraction fails
on a merge row that leaves one of them empty, rather than recording a half-formed anchor. The rest
appear only when they apply: `Band` only when genuinely unsure between two levels; `Untouchable` only
when one of the three classes applies; `Tag` only from round two on, for a finding on text untouched
since the round it names; `Route` only where a finding cannot be settled at the depth the artifact is
written for and belongs one layer down.

**Where each field lands in the record.** The fold's merge table carries one row per finding, with a
column per field above; the band rides **inside the anchor cell**, appended as `; band {a}–{b}`, and
its driver stays in the prose block for the human reader. `Consequence`, `Evidence`, `Untouchable`
and `Tag` are read from their own columns; the fold table supplies the disposition and the level
after. That is the whole interface: extraction reads those two tables and nothing else.

**`Anchor` has exactly three forms, and no fourth:**

- a citation — `{anchor-id} · above {id} · below {id}`;
- `**Anchor:** unranked — no anchor fits; persona grades` — the finding then carries **no level in
  its heading** (`### [UNRANKED] …`); the persona settles it;
- `**Anchor:** unranked — no ruler yet` — no ruler loaded, or the loaded ruler's cell for this kind
  and level is empty (`No anchor yet`). The finding **keeps its level**
  in the heading: that is the reader's honest judgment, recorded as uncalibrated rather than dropped.

## The consequence line is the anchor text

It is the sentence a future ruler prints, so it must read to someone who has never seen this
repository: stack-neutral, worded as a **consequence** ("a wrong total ships unnoticed"), not as a
location ("§ 3 is unclear"), and at most 160 characters. It carries **no feature name, no path, no
denied token** — the derivation refuses one that does, and the finding then never becomes an anchor.

## Deriving an overlay for your own repository

Everything runs from this skill's `scripts/derive-ruler.mjs`, and **every mode takes `--repo {root}`**
(without it the root is the nearest ancestor of the working directory holding a `.git` entry).

| Mode | Reads | Writes |
|---|---|---|
| `extract` | review records under `docs/specs` | appends corpus rows |
| `derive [--date {ISO}] [--out {path}]` | the corpus | `docs/critic-calibration/ruler.md`, the overlay |
| `derive --seed` | the corpus | the shipped ruler beside this file — **only in the plugin source repo**, where that folder is writable |
| `derive --hold-out {sel}` | the corpus minus the selected records | a scratch ruler for a blind re-grade; never the shipped one |
| `derive --dry-run` | the corpus | nothing — the refusal gate |
| `check [--seed] [--ruler {path}]` | the ruler | nothing — the drift gate |
| `check --corpus-only` | the corpus | nothing — the shape gate |
| `sheet --candidates [--out {path}]` | the corpus | a grading sheet of anchor candidates |
| `sheet --blind --select {sel} [--out {path}]` | the corpus | a blind sheet plus its id sidecar |
| `ingest --sheet {file} [--grader owner\|panel]` | a filled grading sheet | grades back into the corpus, each filled row labelled with who graded it |
| `score --sheet {file}` | a filled blind sheet | the re-grade distribution |
| `metrics --slug {slug}` | one feature's review record | the per-round figures |

**The short path.** `extract` appends one record per merge-table row; it is idempotent, so re-run it
at every consolidation. It reads two record layouts — `docs/specs/{slug}/delivery/review-critic.md`
and the nested `docs/specs/{epic}/{issue}/delivery/review-critic.md` — and nothing deeper. A record
written before the layout existed is skipped with a message; one that half-adopts it is an error,
never a silent skip. Then `derive` writes the overlay: deterministic, so the same corpus and the same
date produce a byte-identical file, which is what lets `check` be a plain comparison and catch a hand
edit. `derive` prints how many anchors it produced — **a run that produces zero is the signal that
the folds are not filling their `level after` column**, since a record with no level after the fold
can never become a positive anchor.

**The grading round trip**, once the corpus has rows worth grading: `sheet --candidates` writes a
worksheet of the strongest candidates per cell; a reviewer fills the proposed level, the reason and a
corrected consequence, and the sitting settles the level in the owner column where it disagrees;
`ingest`
writes those grades back. An owner- or panel-graded record outranks a pre-graded one at anchor
selection, so the sitting is what makes a cell authoritative rather than merely populated. Where the
sitting was a panel of readers rather than one owner, run `ingest --grader panel`: the filled column
is then recorded as the panel's, and the ruler's provenance says so instead of claiming an owner
graded rows no owner read.

**Two guards, and which one blocks.** `derive` itself never refuses: a record whose consequence is
unfit to print is **excluded from anchor selection**, named on stderr, and the ruler is still written.
`derive --dry-run` is the blocking gate — run it before every derive; it lists the same records and
exits non-zero while the list is non-empty. `check --corpus-only` is the shape gate. A repository that
wants a token refused everywhere — a company or product name that must never reach a shipped anchor —
lists it in `docs/critic-calibration/deny-tokens.txt`, one whole-word token per line.

## What the learner does with it

`metrics --slug {slug}` reads one feature's review record and prints, per round and per reader:
ledger rows and surfaces not opened, the depth reviewed at, findings by level, the anchor-citation
rate, the `round-{k} miss` tag count, and whether a third round ran. At consolidation the learner
appends the closed rounds to the corpus, re-derives the ruler — replacing the weakest anchor rather
than growing a cell past three — and records those figures. The bias table at the foot of the ruler
is the loop closing: a negative mean shift on a kind means findings of that kind have been graded
high, and the seat that produced them is where to look.

`metrics` reads more of the record than `extract` does, so a record it can measure carries, per
round: the reader's own `## Coverage ledger` section, opening with a
`Round: … · Depth: … · Bar: … · Ruler: …` line and followed by a table whose status column reads
`NOT OPENED` on a briefed surface nobody reached; where a second reader ran, its section heading
names it, and its ledger is the one after that heading.

**When the ruler is what failed.** A cell that keeps producing `unranked` findings, or a level the
persona keeps overriding, is a gap in the ruler rather than in the reader — record it as a lesson
against the calibration data (your project's lessons file, under the reviewing role's heading) so the
next consolidation grades a candidate into that cell instead of the cell staying thin forever.

## What this skill does NOT do

- Decide **how many rounds** run, or what each round acts on — that is the round schedule the review
  seats carry, not the ruler.
- Write, fold or persist a review record — the persona that consumes the findings does that.
- Grade for you. The anchors make a level arguable; they do not make it automatic.
