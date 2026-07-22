# F12 — Workspace Self-Heal

**Traces to:** `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (feature B) — plugin-lane extract of the parent proposal ratified 2026-07-18 in omnishelf-analytics (`docs/proposals/2026-07-18-am-workspace-and-two-leg-improvement.md`)
**Source:** Ratified proposal
**Dependencies:** None ship-blocking. Consuming-repo precondition (already met in omnishelf-analytics): the repo commits the personal-workspace parent with its README and the star-form ignore protection — a repo-owner action this feature warns about but never performs. Related: F11-AnalyticsFailClosedIntake (its per-user defaults record lives in this folder; F11 creates what it needs itself, so neither feature waits on the other), F13-AnalyticsSavedPrompts (uses the prompts subfolder), F14-AnalyticsUsageCapture (will buffer its log here later).
**Status:** Ready
**Plan:** docs/specs/F12-AnalyticsWorkspaceSelfHeal/delivery/plan.md

---

## Purpose

Account Managers are non-technical git users: when their personal files (exports, notes,
prompts) sit unprotected in the repo, `git pull` collides with them and their clone breaks —
the proposal's gap B. The consuming repo gives every AM one personal folder, ignored by version
control except for a committed README. This feature makes the plugin keep that folder healthy:
create its standard structure whenever it is missing, warn when the repo's ignore protection is
absent, and send file output there by default — while **never** editing the repository's ignore
file or any tracked file.

## Entities

### Personal workspace

The `my-workspace/` folder at the repo root — each AM's own space, ignored by version control
(the repo commits only the folder's README, via star-form ignore entries the repo owner
maintains). Standard structure the plugin guarantees:

- `my-workspace/exports/` — default landing place for file output.
- `my-workspace/prompts/` — home of saved prompts (behavior owned by F13).

**File location, not answer delivery.** The exports folder answers a different question than
F11's destination intake, and the two never overlap: F11 resolves **where the answer is
delivered** (in the conversation, or to a spreadsheet) — unchanged by this feature. This
feature governs only **where a produced file lands on disk**: whenever an export flow writes a
file into the working copy (illustrative example: script-path export files an AM accumulates
in their clone — the kind that collide with `git pull` when left loose in the repo), that
file's default location is the exports folder. A disk location is **not** a delivery destination: it never satisfies
any consuming-repo rule that requires one (in particular, the large-export gate that demands a
spreadsheet or narrower filters still fires exactly as before — this default can never bypass
it). A consuming repo whose export flows produce no files simply never exercises this default.

Other features place their own files here (F11's defaults record; F14's capture log later);
this feature owns the folder structure and its protection warning. The overlap with F11 —
which also creates the folders its defaults record needs — is intentional and safe: both are
create-if-missing, whichever runs first wins and the other finds nothing to do. Everything
inside the workspace belongs to the AM — the plugin creates folders, and never deletes, moves,
or rewrites workspace content it did not just write.

### Ignore protection

The repo-owned ignore entries that keep workspace contents out of version control while keeping
the README tracked. Owned and committed by the repo owner. The plugin only *detects* their
absence and warns — fixing them is a human, repo-side action (an automated edit to a tracked
file would itself leave every AM clone permanently dirty: the exact conflict this feature
prevents). Detection judges the **outcome** — workspace contents are ignored and the README is
tracked — never the exact wording of the ignore entries, so a repo that achieves the outcome
differently is never falsely warned.

**"Session"** in this spec means one analyst conversation — from the moment the analytics
agent is invoked until that conversation ends. Per-session behaviors (the heal check, the
warning below) reset with each new conversation.

## User Flows

```
Flow 1: Session-start heal
1. An analytics session starts in a consuming repo.
2. The plugin checks that the workspace and its standard subfolders exist; missing ones
   are created, with a one-line note ("set up your my-workspace folder"). Nothing to
   create → no output.
```

```
Flow 2: Pre-write backstop
1. Any plugin behavior is about to write into the workspace (an export, a saved prompt,
   a persisted default).
2. The structure check runs again first; a missing folder is recreated. A write never
   fails because a folder was missing — even one deleted mid-session.
```

```
Flow 3: Missing ignore protection
1. At session start the plugin detects the repo lacks the workspace ignore protection.
2. It warns once for that session, in AM-facing language: personal files in this folder
   can collide with git pull; ask the repo owner to add the ignore protection. No repeat
   on later questions in the same session; every new session warns again until fixed.
3. The plugin changes nothing in the repo — warning only.
```

```
Flow 4: Default file location
1. An export flow produces a file and the AM named no disk location for it. (Where the
   answer is DELIVERED — conversation or spreadsheet — was already resolved by the F11
   intake; any delivery rule such as the large-export gate has already applied.)
2. The file lands in my-workspace/exports/, and the answer names the full path.
3. An explicitly named location is always honored instead — no forced redirect.
```

## API Surface

N/A — session behavior of the analytics plugin; no HTTP surface.

## Business Rules

1. **Heal timing:** the structure check runs at session start and again immediately before any
   write into the workspace. A workspace write never fails for a missing folder.
2. **Create-only:** healing creates missing folders. It never deletes, moves, renames, or
   overwrites anything in the workspace, and never creates or edits the workspace README (the
   README is repo-owned and committed).
3. **Never touch version control:** the plugin never edits the repository's ignore file or any
   tracked file — not to fix protection, not for any workspace purpose. Detection of missing
   protection produces a warning only.
4. **Warn once per session:** a missing ignore protection produces exactly one warning per
   session, naming the risk (pull conflicts with personal files) and the fix owner (the repo
   owner), phrased for a non-technical AM to pass along. Every new session repeats it until the
   protection exists.
5. **Default file location, never a delivery destination:** a file an export flow produces
   with no user-named disk location lands in the exports subfolder, and the shipped answer
   names the resulting path. A user-named location always wins. The disk location is not an
   answer-delivery destination: it never satisfies a consuming-repo rule that requires one
   (the large-export gate fires exactly as without this feature), and it never changes what
   F11's intake resolves.
6. **Quiet when healthy:** when nothing is missing, healing produces no output; folder creation
   produces a single one-line note.
7. **Heal failure is reported, never silent:** if a folder cannot be created (e.g., permissions),
   the plugin says so plainly and continues with whatever does not need that folder — a broken
   workspace never silently blocks an otherwise deliverable answer.

## Acceptance Criteria

- [ ] In a clone with no workspace folder, starting an analytics session creates the workspace
  with its exports and prompts subfolders and prints a one-line note; a second session start
  creates nothing and prints nothing about the workspace.
- [ ] Deleting the exports subfolder mid-session and then requesting a file export succeeds:
  the folder is recreated before the write.
- [ ] In a repo without the ignore protection, session start produces exactly one warning
  naming the pull-conflict risk and directing the fix to the repo owner; further questions in
  the same session add no repeat; a fresh session warns again.
- [ ] After any number of sessions and exports in an unprotected repo, the plugin has modified
  no tracked file — the repository's ignore file is byte-identical.
- [ ] When an export flow produces a file and no disk location was named, the file lands in
  the exports subfolder and the answer names the path; an explicitly named location is used
  exactly. (In a consuming repo whose export flows produce no files, this criterion is
  vacuously satisfied — the folder still serves the sibling features.)
- [ ] A large export that the consuming repo's delivery gate would stop (no spreadsheet
  provided) is still stopped — the exports-folder default is never offered or used as a way
  past that gate.
- [ ] Pre-existing files inside the workspace are untouched by healing, and the committed
  README is neither created nor modified by the plugin.
- [ ] When folder creation fails, the session reports the failure in plain language and still
  ships any answer that does not require the folder.

## Out of Scope

- **Committing the workspace parent, README, and ignore entries in a consuming repo** — a
  repo-owner action (already done in omnishelf-analytics); the plugin only warns when absent.
- **The defaults record's content, migration, and intake behavior** — F11; it only *lives* in
  this folder.
- **Saved-prompt save/list/run behaviors** — F13; this feature only guarantees the prompts
  subfolder exists.
- **The capture log** — F14, later and gated.
- **Any write to the repository's ignore file** — permanently excluded by rule 3, not deferred.
- **Backup, sync, or sharing of workspace contents** — sharing goes through F13's
  owner-promotion path; the workspace itself stays local.

