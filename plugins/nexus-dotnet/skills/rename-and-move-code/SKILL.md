---
name: rename-and-move-code
description: Renames and moves code across a .NET solution and proves nothing was lost, with one run of the shipped move-check script against the base commit. Use when renaming types, namespaces, projects or settings keys across a solution, moving code between projects or folders, or splitting or merging files — any plan step whose change should alter names and places but not behaviour. The script compares old and new code with comments, using and namespace lines set aside and the name map applied to the old side, compares C# string and char literals and settings files without the map, and sweeps paths and every tracked and untracked file for old names left behind.
---

# Rename And Move Code

A rename or a move should change names and places and nothing else, and green tests do not show that: a line
dropped in a moved file, two checks swapped in a split class, or a settings key renamed with its code all pass a
suite that never exercised them. This recipe makes the claim checkable — one script run lists every line,
literal, setting and old name the change did not account for, and each one is fixed or ruled.

## Assumes

- **A git repository** with the feature's base commit.
- **Node 18 or later on the path.** The script needs nothing else and builds nothing.
- **A names-and-places change, planned first.** The script compares the whole working tree with the feature's base
  commit, so every other change in it shows up as leftovers: a plan puts its rename and move steps before any
  behaviour step, and the run comes between them.
- No shared library and no particular solution layout: the script reads `.cs` files with its own lexer and every
  other file as text.

## When to Use

- Renaming a type, a namespace, a project or a settings key across the solution.
- Moving files or a folder between projects, or a project to a new path (`.csproj` and `.slnx` lines included).
- Splitting a class into several files or merging files into one.

## Steps

1. **Write the name map** — one `Old.Name -> New.Name` pair a line, the full dotted name where one exists, a `#`
   line for a comment. Sample, with made-up names:

   ```text
   Acme.Billing -> Acme.Invoicing
   BillingService -> InvoicingService
   IBillingService -> IInvoicingService
   ```

   A name matches only whole and in its exact case: `Acme.Billing` covers `Acme.Billing.Contracts` but never
   `Acme.BillingService`, and `BillingService` never `IBillingService` or `billing-service`. So every derived name —
   an interface, a test class, a lower-case route or key — needs its own line. The map and keep files may sit
   anywhere; the script never compares or sweeps them.
2. **Make the change** — the plan's rename and move steps. Leave the files unstaged: never stage a file to make a
   search see it; the script reads untracked files itself.
3. **Run the script once**, after the last rename or move step and before any behaviour step, against the
   feature's base commit. The script sits in this skill's `tools/` folder; `{base-dir}` is the path the platform prints as `Base directory for this skill:` when the skill
   loads:

   ```bash
   node "{base-dir}/tools/move-check.mjs" --base {base commit} --map {map file} --skip "docs/specs/**" --skip "**/CHANGELOG.md"
   ```

   `--skip` (repeatable) leaves history folders — old specs, changelogs — out of both the compare and the sweep,
   so they need no keep entries. `--keep {file}` adds the rulings (step 4); `--root {dir}` runs it on another
   checkout. Ignored files are never read.
4. **Fix or rule every item it lists.** Fix the code, or add a keep-file entry — `{path glob} :: {text}`, or
   `{text}` alone — whose text is the item's last field exactly. Rule only a planned difference: a text that keeps
   its old wording on purpose (a runtime message tests assert, a quote of removed code, a wire name), or a change the
   plan made. An entry covers **every** item with that text in the files its glob matches, so give it the narrowest
   glob: a `dropped` item's file is its old path, an `added` one its new path. A kept text that starts with `#` is
   written `** :: #…`, since a `#` line is a comment.
5. **Re-run only to confirm the fixes** — the same command with `--keep`, until it exits 0.
6. **Record** the summary line and the keep entries, each with its one-line why, in that step's block in
   `implementation.md`. The reviewer reads that record and does not re-run the script.

## Reading the Output

The first line counts everything found: `move-check: {pairs} pairs, {groups} split or merge groups, {identical}
identical, {n} leftover lines, {m} changed literals or settings, {k} old-name hits, {kept} kept`. Each item follows
as `{file}:{line}: {what}: {text}`, or `{file}: {what}: {text}` when it has no line. Exit 0 means every item is fixed
or kept, 1 means items are left, 2 means bad input — an unknown base ref, a missing map or keep file, a map or keep
file that is not UTF-8 text, a map line with no `->`.

| Item | What it means | What to do |
|------|---------------|------------|
| `dropped` / `added` | A line in the old file with no place in the new one, or the reverse — a lost line, a new one, or two lines whose order changed | Restore it, or keep it when the plan changed it |
| `literal dropped {value}` / `literal added {value}` | A C# string or char literal that differs once the map is set aside — an interpolated string keeps its fixed text and each hole's format (`{price:N2}` reads `{:N2}`); one renamed literal is two items, the old and the new; the keep text is the whole source line | Keep both when the text changes on purpose; otherwise put the old wording back |
| `setting dropped` / `setting added` | A changed line of a `.json`, `.yaml`, `.yml`, `.config`, `.xml`, `.env` or `.env.*` file — compared without the map and with its whitespace, because deploy files and tests read these keys | Keep both, or put the old value back |
| `old name {Name}` / `old name {Name} in the path` | An old name left in a file — code, docs, diagrams, a UTF-16 or Latin-1 script, a link's target — or in a path | Rename it, or keep the line or path |
| `added file with no base counterpart` | A new file the script could not trace to any old one; its text is `(new file)` | `{glob} :: (new file)` keeps every new file under a folder |
| `ambiguous join` | A fragment that shares as many lines with two old files; it is compared with the first by path, and its text is `(ambiguous join)` | Check it against both old files, then keep it |
| `link target dropped` / `link target added` | A symbolic link whose target text changed; links are compared by their target and never followed | Keep both when the target moved on purpose |
| `binary content changed` / `binary file deleted` | A file that is not UTF-8 text, compared byte for byte; its text is `(binary file)` | Keep it when the change is planned |

How it pairs files, so a surprising item reads right:

- A file still at its path pairs with itself; a moved file pairs by its mapped path, then by name, then by the
  lines it shares — at least 20% of the larger file's distinct lines.
- A new file with no pair joins a split when at least half its own lines come from one old file; an old file with
  no pair joins a merge the same way. Under those shares it reads as a new file (one item) or a deleted one — every
  line `dropped`, fixed or kept line by line, so a move that also rewrites most of a file belongs in a later step.
- Inside a split or merge a line matches only under the same chain of enclosing blocks — the class, method and
  condition lines around it, `partial` set aside — so a statement taken out of its `if` or a class nested into
  another is reported.
- Lines moved between two files that both still exist are not traced: they show as `dropped` in one and `added` in
  the other — a false alarm, never a false clean. Keep both lines.

## What This Skill Does NOT Do

- Apply renames — the change is the developer's, made by the plan's steps.
- Compare literals outside C#: the unmapped literal compare reads `.cs` files only. In `.razor`, `.cshtml`, `.sql`,
  `.resx` and other text files the map applies to the whole line, so a message renamed there with its code reads as
  planned — the sweep reports only an old name left behind. Read those files' renamed text by hand.
- Judge host composition or settings timing: a new host missing its siblings' hardening is `create-host`'s concern,
  a settings read moved to another start-up moment `service-infra-conventions`'.
- Move endpoint types inside one feature folder — that is `extract-endpoint-types`.
