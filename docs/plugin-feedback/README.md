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
| `omni-1.22.0-2026-07-05.md` | omnishelf_flutter_app | 11 | **10** ✅ | 1 | 0 |
| `omni-1.23.1-2026-07-07.md` | omnishelf_flutter_app | 3 | **3** ✅ | 0 | 0 |
| `omni-1.25.1-2026-07-12.md` | omnishelf_flutter_app | 10 | 8 | 0 | 2 |
| `omni-1.32.0-2026-07-14.md` | omnishelf_flutter_app | 1 | **1** ✅ | 0 | 0 |
| `omni-flutter-0.3.0-2026-07-04.md` | omnishelf_flutter_app | 1 | **1** ✅ | 0 | 0 |
| `omni-flutter-0.3.0-2026-07-12.md` | omnishelf_flutter_app | 4 | **4** ✅ | 0 | 0 |
| **Total** | | **30** | **27** | **1** | **2** |

Five of the six files are fully closed. **The only open entries are `omni-1.25.1` Part A E2 and E4**
— both owner-decided and in flight. `omni-1.22.0` E11 is `Tracked` — decided, not open (see below).

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

### `omni-1.25.1` Part A E1, E3 — **Applied, nexus 1.34.4** (`adhoc-PipelineTrustRules`)
- **E1** (relayed/consensus/remembered fact) → `agents-workflow.md` `## All Agents` (new bullet,
  placed between the confidence-label and offer-research bullets — both epistemic-hygiene neighbours).
  As the index predicted, the entry's suggested per-agent home doesn't exist, so `## All Agents` took
  it. The entry's *"fold, don't double-state"* was honoured: the bullet closes by naming the
  `mine-verify-repo` skeptic as the finding-verification **instance** of the same principle rather
  than restating it, and `mine-verify-repo` was not edited.
- **E3** (600s watchdog) → `developer.md` `## Anti-patterns` (new bullet), framed as the entry frames
  it: one root cause, two different-in-kind facets (untrusted draft after a kill / prefer the main
  session + write evidence incrementally).

**The citation trap was avoided both ways.** The consumer-local `docs/skill-backlog.md` PD-5444 item
the entry points at was not cited (no nexus counterpart). The true local citation
(`adhoc-MvcSuiteFidelity/delivery/communication-log.md:56` — a 600s stall against nexus's own
pipeline) was read and confirmed, then **deliberately not cited in shipped text**: `developer.md`
ships to consumer projects where a nexus-dev-repo spec path is meaningless, and the neighbouring
bullets use generic parentheticals ("Measured failure: ×32 in a run"). The evidence is real; the
citation form would not have travelled.

### `omni-1.22.0` E1–E5, E7 — **Applied, nexus 1.34.3** (`adhoc-MineRepoPilotHardening`)
The `mine-verify-repo` half of the pilot cluster — six findings from the run that produced 143 mined →
83 rows, each a place the pilot improvised around a gap the method should have owned:

- **E1** → `metric-layer.md` §0 + §4. Landed generalized: the stack-neutral rule (**the preflight
  proves the binary runs, not that it reads your language — add a one-file parse probe per stack**)
  sits in §0; the Dart specifics (`CLikeReader` fallback, the directory-walk 0-files bug,
  `lizard -f <filelist>`, 0 → 1,887 rows) stay in §4 as the evidence case.
- **E2** → new `### Scope stage — area-expansion rule`. Codifies area = anchor file(s) + direct
  imports/importers + change-coupled files at support ≥5, with the 735-communities/951-files/86.5%-
  singleton stat and the 20-of-20 miner validation.
- **E3** → `## The four lenses`, test-coverage bullet. One row per uncovered method/region, branches
  as sub-bullets; cites the 44 → 8 merge.
- **E4** → C2, new evidence-command robustness block: formatter-split greps, generated-file exclusion
  (116/60/167 → 45/7/4), `grep -A N` truncation → awk.
- **E5** → `## Execution topology`, now the **canonical** "poll, don't wait" statement that 1.34.2's
  `mine-verify-cover` mirror points at. Verified bidirectional: `mine-verify-cover/SKILL.md:104` →
  "mirrors `mine-verify-repo`'s Execution topology lesson"; `mine-verify-repo/SKILL.md:115` →
  "canonical statement — `mine-verify-cover`'s topology paragraph mirrors this". One lesson, stated
  once.
- **E7** → `metric-layer.md` §1 (new step 4) + §3. `.mailmap`-based identity consolidation before
  ownership; 3 people / 9 of 13 identities.

Two judgment calls recorded: E7's mechanism was made concrete as a repo-root `.mailmap` **because the
file's own §3 numstat log already formats the author via `%aN`**, which honors mailmap automatically —
derived from the file, not invented. And E7's condensed lesson ("ownership is the strongest signal")
was deliberately paraphrased rather than restated, since §5 Signals already says it — a conscious
dedup, not an omission.

**This closes `omni-1.22.0`** (10 Applied + E11 Tracked).

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

The first real sweep of these files is `adhoc-PluginFeedbackSweep` (2026-07-14) — before it, the two
applied `omni-1.22.0` entries had been consumed as **inputs to building `mine-reference-model`**, not
from a pass over the file. The sweep closed `omni-1.22.0` and `omni-1.23.1`; the two below are what
remain, both owner-decided and in flight as `adhoc-AdrAmendments`.

### `omni-1.25.1` Part A, E2 and E4 — both decided, awaiting the edit
- **E2** (skill-invocation truth) — **Owner-decided 2026-07-14: split by log-window test.** The
  entry's collision is real: `architect.md:315` mandates **Fail** for exactly the case E2 argues is
  *Deviated-with-reason*. It is also **not just a line edit** — `:315` descends from **ADR-24**
  (`docs/architecture/README.md:42`), still `PROPOSED — owner ratifies`, whose decision text reads
  *"make the gate Fail on the logged fact."* The decision: absent from the log **and** from the whole
  scoped run window → **Fail** (true non-invocation, ADR-24's unrecoverable breach #2); absent from
  the log but **present elsewhere in the window** → **Deviated-with-reason** (invoked, mis-recorded);
  a missing `## Skills Used` section → **Fail**, unchanged. This stays log-checkable rather than
  restoring architect discretion, and it covers the observed case (`tdd` legitimately invoked at Step
  4, then applied from memory at Step 6). The amendment **does not ratify ADR-24** — it stays
  PROPOSED. The crash-resume edge case (token-keying dodges it structurally but never names it) gets
  named: scope the check to the step's whole run set, not a single run id.
- **E4** (ADR-18: non-developer implementers write `test-implementation.md`) — **Owner-decided
  option (a) on 2026-07-12; the plugin half never landed.** `test-implementation` has **zero hits**
  across `plugins/` and `docs/architecture/`; the consuming project applied its local half. The ADR-18
  clause ships. **The detector half does not — owner-decided 2026-07-14: leave
  `boundary-detector.js` untouched and record the question.** The entry's rationale (*"so the
  legitimate write stops logging as a violation"*) does not hold: `ARTIFACT_OWNERS` only flags files
  matching a **listed** regex (`boundary-detector.js:59-63`), and `test-implementation.md` matches
  none — so no violation can fire. The 11 logged hits were the integration-tester writing
  **`implementation.md`**, and they stop the moment it writes the new filename, with no detector
  change at all. Adding an entry would **create** enforcement, not remove a false positive — and
  nexus ships **no test-author role** to name as owner (`NONCODE_ROLES` at `:43`; the
  integration-tester is consumer-local), so it would risk flagging the very agent it should permit —
  the same false-violation class 1.34.1 just fixed. Recorded as a deferred proposal instead,
  mirroring `docs/proposals/boundary-detector-solo-ownership.md`, which resolved the identical
  `ARTIFACT_OWNERS` question the same way.


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
