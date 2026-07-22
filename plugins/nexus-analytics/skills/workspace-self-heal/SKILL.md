---
name: workspace-self-heal
description: Keep each Account Manager's my-workspace/ folder healthy without ever touching version control — create the standard exports/ and prompts/ structure when it is missing at session start and again before any workspace write, warn once per session when the repo's ignore protection is absent, and send produced-file output to my-workspace/exports/ by default. Never edits the repository's ignore file or any tracked file. Use at the start of every analyst conversation and before any write into the workspace.
user-invocable: true
---

# Workspace Self-Heal

Keep the Account Manager's personal workspace healthy across a session — create its
standard structure when missing, warn once when version control is not protecting it, and
default produced-file output into it — while never editing the repository's ignore file or
any tracked file. An automated edit to a tracked file would leave every AM clone permanently
dirty, which is the exact `git pull` conflict this behavior exists to prevent.

## The workspace contract

The `my-workspace/` folder at the repo root is each AM's own space, ignored by version
control except for a committed README the repo owner maintains. Everything inside it belongs
to the AM. The standard structure this skill guarantees is two subfolders:

- `my-workspace/exports/` — the default landing place for files an export flow produces.
- `my-workspace/prompts/` — the home of saved prompts (the save/list/run behavior is owned
  by the F13 saved-prompts feature; this skill only guarantees the folder exists).

Other features place their own files inside the workspace: the `fail-closed-intake` skill's
per-user `my-workspace/analyst-defaults.json` record, F13's saved prompts, and (later) F14's
usage-capture log. Those files are owned by those features; this skill is the single
documented owner of the workspace **structure** and its protection warning — nothing more.

## The heal check

The structure check runs **at session start** and **again immediately before any write into
the workspace** (an export, a saved prompt, a persisted default). It creates only the missing
standard folders — create-if-missing and idempotent, the same effect as `mkdir -p` — so a
workspace write never fails because a folder was missing, even one deleted mid-session.

The heal is create-only. It **never deletes, moves, renames, or overwrites** anything already
in the workspace, and it **never creates or edits the workspace README** (repo-owned and
committed). Pre-existing files inside the workspace are left exactly as they are.

**Quiet when healthy.** When nothing is missing, the heal produces no output at all. When it
creates a folder, it emits a single one-line note ("set up your my-workspace folder") — never
a running commentary. The overlap with `fail-closed-intake` (which also create-if-missing the
folders its defaults record needs) is intentional and safe: both are idempotent, whichever
runs first wins, and the other finds nothing to do.

## Ignore-protection detection and the once-per-session warning

At session start, detect the ignore protection by its **outcome**, never by the exact wording
of the ignore entries — a repo that achieves the same outcome differently is never falsely
warned. The two outcome facts:

- Whether the workspace contents are ignored — checked by outcome, for example
  `git check-ignore -q` on a path under `my-workspace/`.
- Whether the committed README is tracked — checked by outcome, for example
  `git ls-files --error-unmatch my-workspace/README.md`. The repo owner maintains this.

The warning fires on **one condition only: the workspace contents are NOT ignored** — the
pull-conflict condition. That is the state in which an AM's personal files collide with
`git pull` and break the clone. The README-tracked half of a healthy setup is detected but is
**not** an independent warning trigger: a repo whose contents are already ignored is
pull-safe, so firing the pull-conflict warning there would be a *false warning* the outcome
rule forbids, and there is no second message defined for a README-only-broken repo — that case
is deliberately left un-warned because it carries no pull-conflict risk.

Warn **exactly once per session**, in AM-facing language a non-technical AM can pass along:
the personal files in this folder can collide with `git pull`, so ask the **repo owner** to
add the workspace ignore protection. Do not repeat the warning on later questions in the same
session; every new session warns again until the protection exists.

A **non-git repo** has no version control and therefore no `git pull` and no pull-conflict
risk — and the detection commands cannot run outside a git repo anyway — so skip the warning
entirely there while still healing the folders.

The plugin changes **nothing** in the repository. It **never edits the repository's ignore
file (`.gitignore`) or any tracked file** — not to fix protection, not for any workspace
purpose. Detection of missing protection produces a warning only.

## Default file location

A file an export flow produces with **no** user-named disk location lands in
`my-workspace/exports/`, and the shipped answer names the resulting path (that the answer
*names* the path is enforced by the sibling `answer-qa` skill's contract, obligation #7; this
skill owns only *where* the file lands). A user-named location **always wins** — there is no
forced redirect away from a location the AM chose.

This disk location is **not** an answer-delivery destination. It never satisfies any
consuming-repo rule that requires one: in particular, the large-export gate that demands a
spreadsheet or narrower filters still fires exactly as it did before, and this default can
**never bypass** it or be offered as a way past it. Nor does this default change what the
`fail-closed-intake` skill resolves about where the answer is *delivered* (conversation or a
spreadsheet) — that is F11's, unchanged here. A consuming repo whose export flows produce no
files simply never exercises this default.

## Heal failure is reported, never silent

If a folder cannot be created — permissions, a read-only disk — say so plainly and continue
with whatever does not need that folder. A broken workspace **reports** the failure and the
session **continues** to ship any answer that does not require the folder; it never silently
blocks an otherwise deliverable answer.

## What this skill does NOT do

- Edit the repository's ignore file (`.gitignore`) or any tracked file — for any purpose, ever.
  Missing protection is a warning to the AM, not an automated fix.
- Create or modify the workspace README — it is repo-owned and committed.
- Delete, move, rename, or overwrite any workspace content it did not just write — the heal is
  create-only.
- Own the defaults record's content, migration, or intake — that is the `fail-closed-intake`
  skill; the record only *lives* in this workspace.
- Own saved-prompt save/list/run behavior — that is F13; this skill only guarantees the
  `prompts/` folder exists.
- Own the usage-capture log — that is F14, later.
- Treat `my-workspace/exports/` as a delivery destination — it is a disk location only, and
  never a way past the large-export gate.

**Consumed by:** the `data-analyst` agent — at the start of every conversation, and again
before any write into the workspace.

Discovered a defect in the workspace contract or a missing heal/warn rule while using this
skill? Log it — inside the SDD pipeline, append to that feature's
`docs/specs/{slug}/delivery/lessons.md` under `## Developer Lessons` or `## Skill Gaps`;
running standalone, note it for the project's own lessons flow. Never silently work around a gap.

## References

- The sibling `fail-closed-intake` skill — owns `my-workspace/analyst-defaults.json` and its
  own create-if-missing folder logic; the overlap with this skill's heal is intentional and safe.
- The sibling `answer-qa` skill — its answer contract carries obligation #7, that a produced
  file's path is named in the shipped answer; this skill owns where the file lands, that skill
  owns that the answer names it.
