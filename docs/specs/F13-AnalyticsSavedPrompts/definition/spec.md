# F13 — Saved Prompts

**Traces to:** `docs/proposals/2026-07-18-nexus-analytics-am-lane.md` (feature C) — plugin-lane extract of the parent proposal ratified 2026-07-18 in omnishelf-analytics (`docs/proposals/2026-07-18-am-workspace-and-two-leg-improvement.md`)
**Source:** Ratified proposal
**Dependencies:** None ship-blocking. Related: F12-AnalyticsWorkspaceSelfHeal guarantees the prompts folder exists (either feature creates it when needed — same intentional create-if-missing overlap as F11/F12); F11-AnalyticsFailClosedIntake defines the mandatory-clarification intake every prompt run routes through (if F13 ships first, runs route through the agent's current batched intake and inherit F11's stronger contract when it lands).
**Status:** Ready
**Plan:** None

---

## Purpose

Account Managers ask the same questions every week — "weekly OSA report", "top out-of-stock
SKUs by store" — and today they retype them from memory or lose them when a session ends
(proposal gap C). This feature lets an AM save a question under a name, list what they have,
and run it again — all as plain files in their personal workspace, with no server (the sibling
web product solved this server-side; this is the deliberately file-based equivalent). Sharing
stays human: an AM sends a prompt file to the owner, who promotes it into a committed shared
folder every AM then sees.

## Entities

### Saved prompt

A plain, human-readable file in `my-workspace/prompts/`, one per prompt. It stores:

- **Name** — what the AM called it ("weekly OSA report"); also how the file is identified.
  Name matching is **case-insensitive and whitespace-tolerant** everywhere (save-clash
  detection, run, delete): "Weekly OSA Report" and "weekly osa report" are the **same
  prompt** — one normalized identity, the same identity the file is stored under, so clash
  detection can never miss a name the filesystem would collide (a case-variant save triggers
  the normal replace-confirmation, never a silent overwrite). A run request that matches no
  name even after normalization follows the unknown-name flow.
- **The question** — the request as the AM phrased it.
- **The parameters as given** — whatever inputs the AM supplied when the prompt was saved,
  in the form they gave them: a relative date expression ("last week") is stored **relative**,
  never frozen to concrete dates, so each run re-resolves it to the current period.

The file belongs to the AM: hand-editing it is legitimate, and an edited prompt is honored —
its next run simply goes through the normal intake, which catches anything broken or missing.
Prompt files never store credentials, results, or anything beyond the question and its
parameters.

### Shared prompt library

One committed, repo-owned folder of promoted prompts (same file format), maintained by the
repo owner — the destination of the human promotion step. **Discovery:** the plugin looks for
a conventionally named `shared-prompts/` folder at the repo root; a consuming repo that keeps
its library elsewhere says so in its own project instructions, and the plugin uses that
location instead. The library is always a committed, tracked folder — a location inside the
ignored personal workspace is invalid and treated as no library. A repo with no library simply
has no shared prompts to list.

The plugin **reads** the library (list, run) and **never writes** it: promotion is the owner
committing a file, not a plugin action (the same never-touch-version-control rule as the
sibling features). Shared prompts are read-only through the plugin — "editing" one produces a
personal copy in the AM's own prompts folder.

## User Flows

```
Flow 1: Save
1. The AM asks a question (or has just gotten an answer) and says
   "save this as weekly OSA report".
2. The prompt file is written to my-workspace/prompts/ (folder created if missing) and
   the response confirms the name and path.
```

```
Flow 2: Save under an existing name
1. The AM saves under a name that already exists in their personal prompts.
2. The system asks one confirmation: replace it, yes or no?
3. Yes → overwritten. No → nothing changes; the AM can save under another name.
```

```
Flow 3: Run
1. The AM says "run weekly OSA report" (or "run my prompts" → picks one).
2. The prompt's question and stored parameters enter the normal mandatory-clarification
   intake: relative dates re-resolve to the current period, persisted defaults are
   confirmed inline, anything mandatory and missing is asked in one batched message —
   a saved prompt never bypasses fail-closed intake or default naming.
3. Extra wording in the run request overrides the stored parameters
   ("run weekly OSA report for chain 31" wins over the stored chain).
4. The answer ships under the normal answer contract.
```

```
Flow 4: List
1. The AM says "list my prompts".
2. The response lists personal and shared prompts in one view, each labeled with its
   origin (personal / shared) and its question's first line.
```

```
Flow 5: Same name in both places
1. A name exists both as a personal prompt and in the shared library.
2. Running that name uses the personal copy, with a note that a shared version also
   exists. The list shows both, labeled.
```

```
Flow 6: Unknown name
1. The AM asks to run a name that matches nothing.
2. Nothing runs; the response says so and shows the available list.
```

```
Flow 7: Delete
1. The AM asks to delete one of their prompts by name.
2. One confirmation, then the personal file is deleted. Shared prompts are never
   deletable through the plugin.
```

## API Surface

N/A — conversational behavior of the analytics plugin; no HTTP surface.

## Business Rules

1. **Stored as given:** a saved prompt stores the question and the parameters the AM supplied,
   in the form they were supplied — relative date expressions stay relative and re-resolve at
   every run.
2. **Runs go through the intake:** every prompt run enters the full mandatory-clarification
   intake, and the run's response says which saved prompt it is running. Resolution order at
   run time: wording in the run request, then the stored prompt content, then persisted
   per-user defaults, then documented defaults, then the batched ask. Run wording overrides
   **any** conflicting stored value — whether it sits in the stored parameters or inside the
   stored question's own text. This precedence is settled **before** the intake is invoked:
   the run overlays its wording onto the stored content and hands the intake one effective
   question, so the intake's own resolution order (F11) needs no new source and no change. A
   saved prompt can never bypass a fail-closed rule, and every applied default is named in
   the answer as usual.
3. **No silent overwrite:** saving under an existing personal name requires one explicit
   confirmation; declined means nothing changed.
4. **Personal writes only:** the plugin writes prompt files only inside the personal workspace.
   The shared library is read-only through the plugin — modifying or "saving" a shared prompt
   produces a personal copy; promotion into the shared library is a human, repo-owner act.
5. **One labeled list:** listing shows personal and shared prompts together, each labeled with
   its origin.
6. **Personal shadows shared, visibly:** when the same name exists in both, runs use the
   personal copy and say that a shared version exists.
7. **Hand-edits honored:** a prompt file edited outside the plugin is used as-is; the intake
   is the safety net for anything malformed or missing. A file that cannot be read at all —
   or that no longer contains a runnable question — is reported plainly by name and skipped;
   never a silent disappearance from the list.
8. **Unknown names never run:** a run request matching no prompt produces the available list
   and no query.
9. **Delete is explicit and personal-only:** deletion happens only on an explicit request,
   after one confirmation, and only for personal prompts.
10. **Graceful empties:** "save this as {name}" with no question yet asked in the
    conversation saves nothing and says why; listing with no prompts anywhere says so and
    mentions how to save one.

## Acceptance Criteria

- [ ] "Save this as weekly OSA report" creates a readable file under the personal prompts
  folder and the response names it and its path; the folder is created first if missing.
- [ ] A prompt saved with "last week" and run in a later week ships an answer whose named
  date range is that later week — not the week of saving.
- [ ] Saving an existing name asks exactly one replace-confirmation; declining leaves the
  original file byte-identical.
- [ ] Saving a case-variant of an existing name ("weekly osa report" after "Weekly OSA
  Report") triggers the same replace-confirmation — never a silent overwrite, never a second
  prompt; running or deleting a case-variant matches the existing prompt.
- [ ] Shared prompts are found at the conventional repo-root folder, or at the location the
  consuming repo's own instructions declare; a declared location inside the ignored personal
  workspace yields no shared prompts rather than an error.
- [ ] Running a prompt whose stored parameters leave a mandatory input unresolved produces
  the one batched ask — no query first.
- [ ] "Run weekly OSA report for chain 31" uses chain 31 even when the stored prompt or the
  persisted default says otherwise, and the answer names it.
- [ ] The list shows personal and shared prompts with origin labels; a name present in both
  places appears twice, labeled.
- [ ] Running a name that exists in both places uses the personal copy and notes the shared
  one exists.
- [ ] No plugin action ever creates, modifies, or deletes a file in the shared library —
  after any sequence of save/run/list/delete, the shared folder is unchanged.
- [ ] A hand-edited prompt file runs; one made unreadable is reported by name and skipped,
  and the rest of the list still works.
- [ ] Deleting a prompt asks one confirmation and removes only that personal file; asking to
  delete a shared prompt is refused with the promotion/ownership explanation.
- [ ] "Save this as X" before any question was asked saves nothing and explains why; "list my
  prompts" with none saved (and no shared library) says so and mentions how to save one.
- [ ] A prompt run's response states which saved prompt it is running.

## Out of Scope

- **Any server-side prompt store, sync, or account system** — the web product's solution;
  this feature is deliberately file-based and local (proposal decision).
- **Automating the share transport** — sending a prompt file to the owner happens outside the
  plugin (chat, email); the plugin neither sends files nor commits promotions.
- **The owner's promotion act and the shared folder's repo setup** — repo-owner actions.
- **Scheduled or automatic runs** — a prompt runs when the AM asks; recurrence stays human.
- **A template/variable syntax inside prompt files** — run-time wording already overrides
  stored parameters (rule 2), which covers the "same report, different chain" case without
  inventing a syntax non-technical AMs would have to learn.

