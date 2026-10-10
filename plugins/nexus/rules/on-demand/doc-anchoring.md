# Doc Anchoring

> Read when: a change moves/renames/deletes source files or build targets in a repo with docs/conventions/anchored-set.md, or you edit/re-anchor current-state docs.

Current-state docs rot silently when code moves: a doc that names a deleted file keeps reading as
authoritative, and nothing fails. The doc layer that survives a large refactor is the one with a
round-trip loop — planned obligation, done-check, close gate. This file gives every other doc layer
the same loop at the **existence** tier: a per-repo manifest that buckets the docs, one citation
grammar, and a close-time check.

## Two buckets and an ignore list

Every `docs/**` file belongs in exactly one of three places — the two live buckets plus the ignore
list:

- **anchored set** — it claims **current state**. When the tree changes, it must be re-anchored.
- **dated record** — it carries an as-of date and a provenance SHA. Never re-anchored, and it never
  claims currency; its cites are historical by construction.
- **ignored** — out of navigation scope (scratch, imported material, saved research).

A `docs/**/*.md` file in **no** bucket is an **advisory warning** from anchor-check, never an exit 1 —
enforcement with a surface, without the nag-until-disabled failure mode. The manifest file itself is
implicitly ignored: it is never reported as unbucketed.

## The manifest — `docs/conventions/anchored-set.md`

The interface between this rule, the check script, and the repo. Reached by **path convention**, never
through `docs/conventions/coding-conventions.md` — that index is a generated artifact (the conventions
election writes it) and would clobber a hand-added listing.

```markdown
# Anchored set — {repo}

Source roots: `src/`, `lib/`
Map cadence: milestone

## Anchored set
- docs/architecture/index.md — exempt: § ADR Register
- docs/architecture/flow-map.md
- docs/architecture-map/**

## Dated records
- docs/reference-model.md

## Ignored
- docs/research/**
```

Parse rule:

- `- ` lines under each `## ` heading are the entries; glob patterns are allowed. **The three bucket
  headings are contract strings** — `## Anchored set`, `## Dated records`, `## Ignored`. The fatal
  tier is keyed off the first of them, so a manifest that spells it differently would check nothing:
  a missing or empty `## Anchored set` is a **config error**, never a green gate.
- An entry normally names a path under `docs/`, but a glob-free entry may name a file anywhere in
  the repo (a repo-root `README.md` that claims current state); it is matched by existence.
- The optional `— exempt: § {Heading}` suffix excludes that section (from the heading to the next
  same-or-higher heading) from cite extraction — the escape hatch for a section of deliberately
  historical cites inside an otherwise-current doc.
- The **`Source roots:`** line declares the path prefixes treated as live-cite-shaped, and **must
  precede the first `## ` heading**. Source roots are declared, never hardcoded — not every repo
  keeps its code in `src/`.
- The **`Map cadence:`** line is **optional** and declares how the architecture map's refresh is
  triggered: `milestone` (the default) or `per-merge`. It shares the preamble region rule with
  `Source roots:` — read only before the first `## ` heading. An absent, unparseable or unrecognised
  line all read as `milestone`, and so does a repo with **no manifest at all**, so the blocking form
  is opt-in in both directions. It is the one setting that lets the map-delta meter block a close.
- An **anchored-set** entry resolving to **zero** files is a failure, not a skip: a deleted anchored
  doc is precisely the class this gate exists to catch. Each condition's exit code is the table in
  § The close-time check — `anchor-check.js` decides them, and this list is the authoring rule.

## Citation grammar

Four forms, and nothing else. Each doc layer declares which form(s) **it** mandates; a deep gate may
specialize how a form is *resolved*, never the grammar itself.

- **live-cite** — `path[:line]`. The path must resolve in the working tree; the `:line` is advisory
  display only and is never load-bearing (the gate checks the path). The form for prose docs —
  architecture maps, flow maps, an atlas index, and an atlas page's `file` column.
- **anchored-cite** — `{path, keyword/anchor}`. The line is *resolved at check time*, never stored.
  The mandated form for registry-class layers: a stale `file:line` is structurally impossible.
- **history-qualified cite** — `{sha}:path[:line]` plus a note. Points at a past tree state and is
  **never** tree-checked; this is how a dated record cites code that no longer exists — the sha is
  **7 to 40 lowercase hex digits**, the prefix the doc-freshness gate recognizes and skips.
- **grep-anchor** — a re-executable search (a command or pattern) rather than a location. The form a
  `verified-by` row uses, because re-running it is the verification.

Scope: this grammar governs **doc → tree** citations. Code-side tags (a `[pv-model BR-7~2]` marker in
source) are the *reverse* join, code → registry, owned by the business-rule drift gate — out of scope
here.

## Cadences

- **Tier 1 — diff-scoped.** At each wave/lane close that moved source files, re-anchor the affected
  anchored-set sections. This is the cadence the guardrail on the persona surfaces enforces.
- **Tier 2 — full regeneration.** The map delta is **measured at every close** by the Close Gate's
  map-delta item (`team-lead.md` § Close Gate — cited by content anchor, never by ordinal), which
  prints the number and blocks nothing. The **refresh** — a regeneration mine, which reruns the
  structural graph with it — is trigger-gated, and any one of three triggers fires it: the module is
  **next worked**, so a refresh runs when someone next has that module open rather than because a
  gate listed it; the owner calls one, at any time; or a build target is added or removed. A repo
  that declares `Map cadence: per-merge` adds a fourth and stricter trigger on top of those three:
  there the map-delta item's non-zero exit stops the close until the refresh lands — or, without the `nexus-miner` plugin (the refresh is its mine), until the owner defers it with a backlog row.

Cadence ownership: this tier owns the **existence-level** cadence only. A deep gate keeps its own (an
atlas's re-execution pass stays on its campaign-milestone cadence) — deep tiers on one shared base,
not competing freshness mechanics.

## The close-time check

`anchor-check.js` is a manually-invoked close-gate tool, not a registered hook. The session-start
payload's resolved plugin-paths block carries its absolute path — the plugin-root placeholder does
not expand in markdown, so no agent file can name the location itself. Behavior:

| Condition | Result |
|---|---|
| No manifest in the repo | exit 0, silent no-op — repos adopt incrementally |
| `Source roots:` missing, empty, or after the first `## ` heading | exit 1, config error |
| No `## Anchored set` bucket, or no entries under it | exit 1, config error |
| A live-cite in an anchored-set doc whose path is gone | exit 1, listing doc + cite |
| A `{sha}:`-prefixed cite, a cite in a fenced code block, or one in an exempt section | skipped |
| A source root glued to a preceding path character — a package, SDK, cache or cross-repo path; also a path under an undeclared parent root, whose remedy is to declare the parent; or wrapped in underscore/strikethrough emphasis — use `*` or backticks for a cite | skipped — not a cite |
| An **anchored-set** entry resolving to zero files | exit 1 |
| A **dated-record or ignored** entry resolving to zero files | stdout warning, exit 0 |
| A `docs/**/*.md` file in no bucket | stdout warning, exit 0 |

Line-number and content drift are **out of scope** — anchored-cites and ordinary content passes cover
those. This gate guards the fatal class: the cited file is gone.

Who runs it: the canonical Close Gate in `team-lead.md` (attended, a non-zero exit blocks close;
unattended, the failing output is recorded and the run closes with the obligation on record). Sibling
close surfaces point at that item — they never restate it.

## Species boundary — the KB layer

`kb-maintenance.md` governs `docs/kb/` and keeps its own write-back duty and its advisory
`stale-key-file` lint. Nothing there retires. A repo **may** additionally register `docs/kb/**` in its
anchored set, which adds the blocking existence tier on top. The two mechanics are separated by tier:
the KB lint is advisory and in-layer; anchor-check is a close-time existence gate.
