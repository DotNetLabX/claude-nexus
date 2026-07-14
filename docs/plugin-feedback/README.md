# Plugin feedback — inbound index & triage status

Inbound feedback files (ADR-1 portable format) routed here from consuming projects. Each file is a
**verbatim copy** of the source repo's file — byte-identical, so it stays citable as evidence. This
index is the **only** place per-entry disposition is recorded; do not annotate the copies.

Why an index rather than per-file headers: the older `nexus-*` files record status in prose headers,
and that is exactly what failed — `nexus-1.13.0-2026-06-17.md` opens by noting *"several of its items
were never confirmed-applied."* One table beats status scattered across six preambles.

**Status vocabulary:** `Applied` (substance is present in shipped plugin text — verified by reading
the source, not inferred from a changelog) · `Open` (absent from shipped text) · `Owner-decision`
(needs a call before it can be applied) · `Tracked` (owner decided **not** to build it now; the idea
is recorded in `docs/proposals/` — the ADR-29 idea inbox — so it is resolved here, not pending).

Last verified: **2026-07-14** against nexus 1.34.1 / nexus-flutter 0.4.1.

## Summary

| File | Source | Entries | Applied | Tracked | Open |
|---|---|---|---|---|---|
| `omni-1.22.0-2026-07-05.md` | omnishelf_flutter_app | 11 | 4 | 1 | 6 |
| `omni-1.23.1-2026-07-07.md` | omnishelf_flutter_app | 3 | **3** ✅ | 0 | 0 |
| `omni-1.25.1-2026-07-12.md` | omnishelf_flutter_app | 10 | 6 | 0 | 4 |
| `omni-1.32.0-2026-07-14.md` | omnishelf_flutter_app | 1 | **1** ✅ | 0 | 0 |
| `omni-flutter-0.3.0-2026-07-04.md` | omnishelf_flutter_app | 1 | **1** ✅ | 0 | 0 |
| `omni-flutter-0.3.0-2026-07-12.md` | omnishelf_flutter_app | 4 | **4** ✅ | 0 | 0 |
| **Total** | | **30** | **19** | **1** | **10** |

Four files are fully closed. The remaining 10 open are in `omni-1.22.0` (6 — the `mine-verify-repo`
half) and `omni-1.25.1` Part A (4). `omni-1.22.0` E11 is `Tracked` — decided, not open (see below).

Older `nexus-1.9.0` / `nexus-1.9.1` / `nexus-1.13.0` / `nexus-cpp-0.1.0` files predate this index and
retain their in-header status notes; they are not re-triaged here.

## Applied

### `omni-1.25.1` Entries 5–10 + all of `omni-flutter-0.3.0-2026-07-12` — **Applied, nexus 1.34.0 / nexus-flutter 0.4.0**

All 10 were graduation inputs for a skill that did not exist at the time. Both now ship
(`988075b`, ported from the omni twin), and all 10 lessons are present in the shipped text:

- `plugins/nexus/skills/mine-verify-flows/SKILL.md` — E5 gate calibration (L91–95), E6 ~4 verify
  pairs (L97–99), E7 fixture strategy (L107–112), E8 determinism scoping (L103), E9 deferred-smoke
  precision (L116), E10 all five sub-lessons (L120–124).
- `plugins/nexus-flutter/skills/mine-verify-flows-flutter/SKILL.md` — E1 `--keep-app-running`
  (L23–39), E2 two-hop bless (L43–54), E3 call-chain greps + isolate/init-gate traps (L75–83),
  E4 pure-Dart golden module + three verdicts (L87–98).

**The known calibration trap was avoided.** `docs/proposals/agent-grounding-memory-wiring.md:27`
said *"The spike's determinism answer (OQ-1) transfers as the tolerance default"* — the superseded
answer E5 explicitly said not to graduate. It did not propagate: `OQ-1` / `tolerance ships` have zero
hits in both skills, and `SKILL.md:93` carries the corrected two-tier answer (semantic exact-match +
class-wide `**.`-suffix exclusions + the single `**.sfr` ε 0.005 tolerance).

The port improved on the feedback in three places: E10's dead-code by-products route to the run
report as candidate `mine-verify-repo` rows rather than straight into `docs/tech-debt/`; the adapter
adds the non-recursive-pubspec-assets trap; and exclusion-is-deliberate-blindness is called out.

### `omni-1.22.0` E9, E10 + `omni-1.23.1` E1, E2 — **Applied, nexus 1.34.2 / nexus-flutter 0.4.2** (`adhoc-MineCoverArmHardening`)
The Cover-arm half of the pilot cluster. All four in `mine-verify-cover/SKILL.md` +
`mine-verify-cover-flutter/SKILL.md`:

- **E10** (hanging/crashing mutants) — stack-neutral "Abnormal mutant exits are part of the contract"
  in the method's `## The adapter contract` (process-tree kill, crash-rc = KILLED-by-crash,
  re-verify `char_pin` after any abnormal exit), pointer from `## The gate battery`; the Windows/Dart
  concretes (`taskkill /F /T /PID`, file-not-pipe output, `0xC0000409`, `git diff -- lib/` re-check)
  in the adapter's new `## Hung and crashing mutants` section.
- **E9** (`@JsonKey` codegen-inert) — third entry in the adapter's equivalent-mutant filter
  ("Two seen" → "Three seen"); default is exclude via `expectedSurvivorLines`, with the reason a
  symmetric round-trip can't catch a key rename even *with* a regen.
- **E1** (1.23.1, tag emission) — the fix mirrors the skill's own `## Safety rails` generation guard
  and cites its *"a prompt instruction is a request"* line: a post-Cover assertion counting `tags: [`
  against the test count, re-checked at Report, same agent-counts/orchestrator-compares actor split
  as the Minimize confirm. The index flagged this as the entry's own best argument; it is now the
  edit's stated rationale.
- **E2** (1.23.1, mined-test location) — new `## Mined-test location` section (single root for both
  arms; adapters must state their default-path consequence) + a new stack-neutral `arm: code | spec`
  fact, which the adapter maps to flat `arm-code`/`arm-spec` tags and pairs with a `test/mine/`
  placement rule citing the 132-test CI blind spot.

Two judgment calls worth recording: `arm` is modeled as a stack-neutral **fact** in the method
(matching `layer`/`criticality`) rather than a flat-tag-only convention, so the adapter's hyphen
mapping stays the adapter's job. And the pilot's `test_mine/` vs `test_mine/spec/` discovery asymmetry
is reported **as observed** — the source evidence doesn't explain the mechanism, so none was invented.

### `omni-1.22.0` Entry 8 — **Applied**
`mine-reference-model` skill built; ratified as **ADR-50** (`docs/architecture/README.md:1233`).
Entry 8's optional stage-2 is explicitly declined on record (`mine-reference-model/SKILL.md:151`).

### `omni-1.22.0` Entry 6 — **Applied (condensed)**
Scale datapoint landed at `mine-verify-cover/references/mine-family-core.md:75`. The 301k-token /
52-tool-call figures and the "revisit sharding for wider runs" line did not survive the condense.

### `omni-flutter-0.3.0-2026-07-04` E1 + `omni-1.23.1` E3 — **Applied, nexus-flutter 0.4.1** (`eb5e638`)
Colon-form fact tags switched to hyphen composition in `mine-verify-cover-flutter/SKILL.md:122-124`,
plus the `boolean_selector` grammar note (so the .NET key-value analogy isn't re-derived) and the
`dart_test.yaml` declaration reminder.

### `omni-1.32.0` E1 — **Applied, nexus 1.34.1** (`f292c2e`)
`resolve-role.js` gained an exact-token `ROLE_ABBREVS` map (`dev` → `developer`) consulted at the same
two points as `KNOWN_ROLES`. Fixes both consumers: the boundary detector's false ADR-18 violations
**and** the verify gate's `verdict:"skipped"` fall-through (the latter was not in the report — an
unrun gate is more serious than log noise). Map is exact-token, never a prefix match, so `devops` does
not collapse. Tests cover the new case plus the `team-lead` landmine and "unknown stays unknown".

## Open

Both applied `omni-1.22.0` entries were consumed as **inputs to building `mine-reference-model`**,
not from a pass over the file. No sweep of these files has ever run — which is what the 18 below are.

### `omni-1.22.0` E1–E5, E7 — the mine-verify-repo half
Five-and-a-half entries still Open, each needing an edit to `mine-verify-repo`: E1 lizard has no
native Dart reader (`lizard <dir>` silently returns 0 Dart files; `-f <filelist>` works) · E2
area-expansion rule for singleton-collapsed communities · E3 test-coverage lens granularity cap ·
E4 evidence-command traps (generated-file exclusion, formatter-split lines, awk-not-`grep -A` for
lcov) · E7 author-identity consolidation before ownership.

**E5 is half-applied.** Its `mine-verify-cover` topology mirror shipped (below); its primary target —
`mine-verify-repo`'s Execution topology — has not. It closes when that lands.

### `omni-1.25.1` Part A, E1–E4
- **E1** (a relayed/consensus/remembered fact is a claim to re-verify) — Open. The narrow
  mine-verify skeptic version exists (`mine-verify-repo/SKILL.md:16`); the general-pipeline rule does
  not. Note the entry's suggested per-agent home doesn't exist — `architect.md` and `critic.md` have
  no `## Anti-patterns` section — so `agents-workflow.md` "All Agents" is the lower-friction target.
- **E2** (skill-invocation truth) — **Owner-decision.** The log-diff gate already exists
  (`architect.md:309`) and the entry says it needs no fix. But `architect.md:315` mandates **Fail**
  for exactly the case E2 argues is *Deviated-with-reason* — this is an edit to a live gate rule, not
  an append. The crash-resume edge case is structurally dodged by token-keying but never named.
- **E3** (600s no-output watchdog: untrusted draft after a kill; run long ops from the main session)
  — Open, untracked. The referenced Deferred item is consumer-local with no nexus counterpart. The
  root cause is live *here* too — `adhoc-MvcSuiteFidelity/delivery/communication-log.md:56` records a
  600s stall against nexus's own pipeline.
- **E4** (ADR-18: non-developer implementers write `test-implementation.md`) — Open, despite
  *"Resolved by the project owner (2026-07-12): option (a)"*. `test-implementation` has **zero hits**
  across `plugins/` and `docs/architecture/`. The consuming project applied its local half; the
  plugin-side half (ADR-18 clause + `ARTIFACT_OWNERS` mapping) never landed.


## Tracked — decided, not built

### `omni-1.22.0` E11 — golden/UI miner sibling — **Tracked, not building** (owner, 2026-07-14)
Recorded as `docs/proposals/mine-golden-render-2026-07.md` (**Draft** — per ADR-29 an unratified
proposal *is* the idea inbox, so `docs/proposals/` is the registry; `Draft` is the accurate status,
and ratifying it would mis-signal intent to build). The entry's defect was that it was **untracked in
every registry** — tracking closes that; building was a separate, larger bet the owner declined today.

Why not built: the entry's own author left it OPEN and conditional — *"worth building ONLY if
committing to broad UI coverage"* — and that precondition is a **consuming-repo product decision that
has not been made**. The value lives in the consuming repo's UI surface, not in nexus.

Two findings the proposal adds beyond the entry:
- **A scope gap the entry doesn't acknowledge:** its sketch step (c) delegates golden generation to
  "the existing `new-golden-test` skill", which **nexus does not ship**. The only hits across
  `plugins/` are three mentions in `figma-to-flutter/SKILL.md` (L28/30/60), where that skill
  *explicitly declines to own it* and flags it as an assumption to adapt away. A shipped
  `mine-golden-render` would have to own or abstract golden creation — wider than the four-step sketch.
- **It could not use this lane.** `mine-verify-flows` shipped under an `adhoc-` slug only because it
  was a *mechanical port* of already-designed work. `mine-golden-render` is fresh design → per ADR-58
  an `F{N}` slug + `docs/backlog.md` row + PO shaping, never solo/`adhoc-`.

Still true and worth preserving: E11 is **not** covered by `mine-verify-flows` (that is JSON flow
goldens; E11 is widget-render goldens) — a distinction already collapsed once.

## Residual — closed

`docs/proposals/agent-grounding-memory-wiring.md` item 4 carried the superseded *"OQ-1 transfers as
the tolerance default"* claim. It never contaminated the skill, but the proposal was the only tracking
record still holding the old answer. Item 4 is now marked shipped with the claim retracted (`19044bf`).
The C++ flows adapter named there remains unbuilt.
