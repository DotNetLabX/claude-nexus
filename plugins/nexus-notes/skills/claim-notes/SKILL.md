---
name: claim-notes
description: Claim selected unclaimed notes into a feature — present the matches, get explicit user confirmation, move the files into docs/specs/{slug}/definition/notes/, and stamp claimed_by/claimed_at frontmatter. Side-effecting and confirmation-gated. Use after search-notes to pull chosen notes into the feature you are shaping; never runs without an explicit in-session confirmation.
user-invocable: true
---

# claim-notes

Claims one or more unclaimed notes into a feature's definition folder. It **moves** files and **stamps**
frontmatter — the only side-effecting skill in the notes-consumer surface. It runs after `search-notes`:
the user picks rows from a search result, and this skill claims them.

## Hard rules

1. **Never claim without explicit user confirmation in-session.** This skill will never claim without
   an explicit in-session confirmation from the user — refusing to proceed without it is the **correct**
   behavior, not an error. If the user has not confirmed the specific files, stop and ask; do not infer
   consent from the search request or from a prior claim.
2. **Never overwrite.** If a destination file already exists, surface it and skip that file — never
   clobber an existing claimed note.
3. **Never re-claim.** A note whose frontmatter already carries `claimed_by` is already claimed — skip it
   with a notice.

## Inputs

- **Selection** — the notes to claim, as row numbers from a `search-notes` result or as file paths.
- **Target `{slug}`** — the feature the notes are claimed into (e.g. `F1-NotesPlugin`).

The inbox root that the selected paths are relative to resolves through
`../search-notes/references/notes-config.md` (the `inbox` config value, or the documented default) —
exactly as in `search-notes`. No inbox path is hardcoded here. (The shared references live in the
`search-notes` skill folder; both skills cite them — the sibling-citation pattern.)

## Steps

The agent running this skill performs each step:

1. **Resolve the selection to files.** Map row numbers back to their file paths under the inbox root
   (resolved via `../search-notes/references/notes-config.md`). If given paths directly, use them.
2. **Present the claim set and ask for confirmation.** List every file to be claimed, the target
   `{slug}`, and the destination `docs/specs/{slug}/definition/notes/`. Then ask the user to confirm.
   **Do not proceed until the user confirms** (hard rule 1). Honor **partial confirmation** — if the
   user confirms only some rows, claim only those and leave the rest in the inbox.
3. **For each confirmed file:**
   - **Skip if already claimed** — frontmatter carries `claimed_by` (hard rule 3): report and move on.
   - **Skip if the destination exists** — never overwrite (hard rule 2): report and move on.
   - **Move** the file into `docs/specs/{slug}/definition/notes/`, creating the folder if absent.
   - **Stamp** its frontmatter with the two claim fields defined in `../search-notes/references/note-schemas.md`:
     - `claimed_by: {slug}`
     - `claimed_at: {ISO date}` — today's date, `YYYY-MM-DD`.
4. **Report** what was claimed, what was skipped (already-claimed / destination-exists), and where the
   claimed notes now live.

## Edge cases

| Situation | Action |
|-----------|--------|
| No confirmation given | Stop and ask. Refusing to claim is correct — never claim without confirmation. |
| File already claimed (`claimed_by` present) | Skip with a notice; do not re-stamp or move. |
| Destination file already exists | Never overwrite; surface it and skip that file. |
| User confirms only some rows | Claim only the confirmed rows; leave the rest in the inbox. |
| Selection resolves to zero files | Report "nothing to claim" and stop. |

## What this skill does NOT do

- **Search** — that is `search-notes`; this skill claims a selection it produced.
- **Claim without confirmation** — the confirmation gate is a hard rule, not an option.
- **Edit note content** — it moves the file and stamps two frontmatter fields; the body is untouched.
- **Overwrite or re-claim** — existing claimed notes are never clobbered or re-stamped.
