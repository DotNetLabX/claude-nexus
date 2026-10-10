---
name: access-declaration
description: "Declare, change or validate a repo's access channels — the committed `.claude/access.yaml` that names, per corpus, what may ground an answer: a local copy in the repo, a remote server, or both. Owns the guided setup (`set up the knowledge channels` — the file is drafted, and every settings change is confirmed before it is written), the refresh recipe (`refresh the knowledge channels`, when a newer received template arrives), the hands-on scaffold recipe, the deny recipe (propose the settings line, edit only on confirmation) and the validate recipe (a `--check` run plus a fresh session). Use when a repo first declares its corpora, when the session-start line invites the setup, when a corpus changes channel, when the session-start table is missing or disagrees with reality, or when an agent needs to know which channel serves a corpus and no table was injected. Every value comes from the repo owner, never invented. It never calls a remote itself and never edits a settings file on its own."
user-invocable: true
---

# access-declaration

A repo's corpora — a handbook, a product catalog, an API atlas — can reach an agent through more than
one channel: a copy committed into the repo, or a remote server the agent can call. When nothing owns
that choice, it gets made per answer, from whatever a tool's description sounds like it offers, and
the same question gets grounded two different ways on two different days.

This skill owns the file that ends that: **`.claude/access.yaml`**, committed at the repo root, naming
per corpus what may ground an answer. The extension reads it at session start, resolves each corpus
against its kind's safe default, checks the declaration against the repo's real settings and files,
and injects the resolved table. **The declaration is configuration; it is never the agent's judgment** —
a row that resolves `by compare` delegates a mechanical comparison the declaration specified, not a choice.

The full field-by-field contract, the per-kind resolution table, the version compare and the dialect
rules live in `references/access-schema.md`. Read it before writing or changing a declaration — this file is the
recipes, that file is the contract.

## When to use

- The repo is declaring its corpora for the first time — in conversation (the guided setup) or by
  hand (the scaffold recipe).
- Someone says `set up the knowledge channels`, or asks for the same thing in their own words. The
  line a repo with no declaration gets at session start invites exactly this.
- Someone says `refresh the knowledge channels`, or the session-start envelope reports a received
  template that differs from the one this declaration was drafted from.
- A corpus changes channel — gains a remote, loses its local copy, becomes split.
- The session-start table **disagrees with reality** (a row reads `unresolved`, or names a channel
  that does not work), or it is **absent**. At the start of a **fresh** session an installed
  extension always says something: the table once the repo has declared, one line of setup nudge
  while it has not — so neither, there, means it is not installed or not enabled. A **resumed** or
  **compacted** session is silent on purpose: that conversation already carries what it was told.
- An agent needs to know which channel serves a corpus. **Read the injected table first** — it is the
  resolved answer for this session. Come here only when there is no table, or the table is wrong.

## Guided setup

The conversational path, and the one the session-start nudge invites by name. It drafts the whole
declaration and confirms every change that leaves this repo's own file.

**1. Find the draft source, in this order.**

| Order | Source | Where it is |
|---|---|---|
| 1 | A template this repo received | An `access.template.yaml` committed somewhere in this repo. The session-start nudge names its path when it found one; the search and its bound belong to the hook, and `references/access-schema.md` states them. **The documents beside the template in its folder — a README, wiring notes — are part of the same received source:** the publisher who sent the template put the values there (a server address or the exact command to register it, deny lines, a retired channel to remove). Read them in the same pass. |
| 2 | The person's own defaults | The same file, prefilled, in their Claude config directory — `CLAUDE_CONFIG_DIR` when that is set, otherwise `~/.claude`. |
| 3 | Nothing | The interview in step 2. |

The per-machine copy is how values a person already knows travel with them to the next repo. Only its
shape is known here — read it, never assume what is in it.

**2. Fill it, asking only for what is missing.** A value the source already carries is not asked about
again — and the source is the whole received folder, not just the template file: an address or a
command a sibling document carries is **proposed for confirmation, never asked for from scratch**. Every `{placeholder}` it leaves is asked, one at a time, in plain words: what the corpus is,
where its local copy lives in this repo, which server serves it. With no source at all, that interview
is the draft — one pass per corpus. **Never invent a value.** The rule binds hardest here: a guided
run makes filling a blank with something plausible the easiest thing in the world, and the check
cannot tell a plausible wrong value from a real one.

**3. Write `.claude/access.yaml`.** When a template was the source, the declaration's first line is
that template's stamp — `# drafted-from: sha256:{16 lowercase hex}` — which is how a later session
notices that a newer template has arrived. `references/access-schema.md` owns the line's grammar and
gives the command that computes the stamp; **use that command**, because a digest from an ordinary
hashing tool either fails to read back at all or never matches.

**4. Propose the two settings changes, and write neither without a yes.**

- Every `permissions.deny` line the declaration needs. The deny recipe below owns the mechanics and
  the forms that count as covering: propose the line, edit only on confirmation.
- The project's server entry, when the repo does not already have one —
  `claude mcp add --scope project {name} {how to reach it}`. When the received source carries the
  address or the exact command (step 1's sibling documents), propose that, quoted, for the person to
  approve; only with no source at all are both values asked from the person. **Recommend registering
  when any declared corpus has no usable arm without it** — a remote-only or `split` corpus, or one
  whose consuming extension reaches the datasource through that server; deferring is the right
  default only when every declared corpus is fully served by a local copy, and then the deferral is
  said with its consequence (the copies stay currency-unverified until the server exists). Either
  way it is proposed, never written without a yes: it is theirs to approve.

**5. Validate** with the validate recipe below, and fix what it reports.

**6. Name what to commit** — `.claude/access.yaml`, the settings line if one was added, and the
project server entry (`.mcp.json`) if one was added. The declaration is a repo fact, and it only
becomes one when the person commits it.

Two properties hold throughout. **Every message is readable by a person who knows the corpora and not
this file** — no key names, no internal labels, and no path this repo or the person did not already
supply. And the run stays **fail-closed**: an unconfirmed deny line or server entry leaves the corpus
declared with its remote arm unresolved, which the session-start check discloses at the next start.
That is the intended outcome, not a failure to handle — a permission nobody agreed to is worse than a
corpus that says it is not ready.

## Refresh from a newer template

Triggered by the session-start line reporting a received template that differs from the one this
declaration was drafted from, or by someone saying `refresh the knowledge channels`. It is the guided
setup with a smaller question.

1. Read the received template and the current declaration.
2. Say **what differs, in plain words** — a corpus the template adds, a server name that changed, a
   tool no longer offered. Not a file diff: the person is the one deciding, and handing them a diff
   hands them the work of reading it.
3. Apply only what they confirm, corpus by corpus. A value this repo chose deliberately survives a
   template that disagrees with it — a template is a starting point, never an authority over a repo
   that has since declared.
4. Rewrite the `# drafted-from:` stamp to the template just folded in — same command as step 3 of
   the guided setup — so the notice stops.
5. Re-run the validate recipe.

A declaration carrying no stamp — hand-written, or written before the stamp existed — never gets that
notice, and has nothing to refresh from until a guided run gives it one.

## Scaffold a declaration

The hands-on path: fill the template yourself. It owns the file's shape; the guided setup above owns
the questions, and both write the same file.

1. Copy `references/access.template.yaml` to `.claude/access.yaml` at the repo root.
2. For each corpus the repo grounds answers from, fill one entry. **Every value comes from the repo
   owner** — the corpus names, the paths, the server name, the tool names. Never invent a server, a
   tool or a path, and never copy one from another repo's declaration: a plausible-looking wrong
   value is worse than a missing one, because the check cannot tell it from a real one.
3. Choose each corpus's `kind` by what the corpus *is*, not by what is convenient:
   - `private` — it exists only as the copy in this repo. It may declare no remote.
   - `published` — it has an authoritative source elsewhere. Declare the `remote`, and a `path` too if
     a local copy exists. To have the copy used while it is current and the remote when it is behind,
     add the `manifest` block and both compare keys — without them the corpus always resolves to the
     remote.
   - `split` — both arms are real and the consuming skill picks per operation. Both `path` and
     `remote` are required.
4. **Three keys in the template belong to a consuming extension, not to this one** —
   `manifest.hash_key` and the `remote.fetch_tool` / `remote.fetch_key` pair. Fill them only when an
   extension that reads them is installed and the corpus's publisher actually offers them; otherwise
   **delete those lines**. The rule in step 2 binds here hardest: their values are the repo owner's
   and the publisher's, never invented — and the pair is all-or-nothing, so half of it is reported as
   an incomplete pair rather than half-used.
5. Run the validate recipe below. Fix what it reports before committing.
6. Commit the file. It is a repo fact, not a personal setting — an uncommitted declaration means each
   person's session resolves differently, which is the problem this file exists to end.

## Declare a deny

A `deny` list on a corpus names tools that **must not be callable in this repo** — typically the
write or mutate tools of a server whose read tools the repo does use.

The declaration does not enforce the deny; the platform's own permissions do. So the two must agree,
and the session-start check reports every entry that is declared but not in force.

1. For each `deny` entry, the matching line goes in `permissions.deny` of the repo's
   `.claude/settings.json`. A broader glob already covering the tool counts — besides the exact
   entry, the check accepts the bare server prefix `mcp__{server}` (every tool of that server), the
   per-server wildcard `mcp__{server}__*`, and the broad `mcp__*` and `*`.
2. **Propose that line to the owner and edit the settings file only on their confirmation.** A
   settings file is the owner's, and a permission the owner did not agree to is a surprise at the
   worst moment.
3. Re-run the validate recipe: a satisfied deny leaves no gap finding.

If the owner declines, remove the entry from the declaration rather than leaving a gap that every
session re-reports — a standing finding nobody intends to fix trains everyone to ignore findings.

## Validate a declaration

Run the extension's own checker against the repo:

```
node "{plugin root}/hooks/scripts/inject-access.js" --check
```

It prints the same report the session envelope carries — minus the two lines that invite a
conversation rather than state a fact, the setup nudge and the refresh notice — and exits:

| Exit | Meaning |
|---|---|
| `0` | Clean — the file parses, every corpus resolves, no findings. |
| `1` | Findings, an unresolved corpus, or both. The report names each one with its line number. |
| `2` | No declaration file — this repo declares no access channels. |

Then **start a fresh session** and confirm the table appears. The checker proves the file is good; only
a real session proves the hook is wired and the table actually reaches the agent. A pass on the
checker with no table in the session means the extension is not installed or not enabled — an
installed one always says something, the table or the setup line.

## Reading the resolved table

Each row is one corpus: its kind, the channel it resolved to — or `by compare`, which you decide —
its local copy (and whether that copy is present), the copy's version stamp, its remote server and
tools, the compare it owes, and its status.

- A `resolved` row is the channel to use for that corpus. Say which channel you used, its stamp when
  that channel is a local copy carrying one, and the compare outcome; the injected resolver rule
  gives the exact line to say it on.
- An `unresolved` row means **refuse to ground from that corpus and say so.** Do not quietly fall back
  to the other arm, and do not answer from memory of it. Name what is unresolved and what would fix it.
- A row whose channel reads **`by compare`** is one you decide: its compare cell names a version tool
  and a key, so call that tool at the first grounding of the corpus and read the value at the key —
  equal to the row's stamp means the local copy is current, different means use the remote. Report
  the outcome. The injected resolver rule carries the full instruction and the line to report it on.
- A published corpus resolved to its local copy with **no compare declared** is currency-unverified:
  the copy is not checked against the source, so say the stamp rather than implying it is current.

## What this skill does NOT do

- **The hook never runs the compare.** It has no client for a declared server, so it ships the
  compare's inputs — the tool, the key, the stamp — and the rule; the session runs the compare.
- **No remote calls of its own.** Nothing in this skill or its hook contacts a declared server.
  `manifest.hash_key` and the `remote.fetch_tool` / `remote.fetch_key` pair are validated here and
  acted on by a consuming extension — the analytics extension's model-channel contract verifies one
  declared file against the manifest and fetches construct files one at a time. This skill checks
  that they are well formed, and that the fetch tool is not denied in any settings layer (checked
  only once both keys of the pair are declared). It never calls the tool, and it cannot tell you the
  server is connected or that the tool exists.
- **No settings edits on its own.** It proposes a `permissions.deny` line; the owner confirms it.
- **No execution declaration.** How a datasource is *queried* is a different contract and lives in the
  analytics profile, not here. An `execution:` key in this file is rejected with a line-cited error.
- **No invented values.** If the owner cannot say what a corpus's server or path is, the corpus does
  not get declared — an unresolved corpus is a safe outcome, a guessed one is not.
