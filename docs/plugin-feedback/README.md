# Plugin feedback — inbound index & triage status

Inbound feedback files (ADR-1 portable format) routed here from consuming projects. Each file is a
**verbatim copy** of the source repo's file — byte-identical, so it stays citable as evidence. This
index is the **only** place per-entry disposition is recorded; do not annotate the copies.

Why an index rather than per-file headers: the older `nexus-*` files record status in prose headers,
and that is exactly what failed — `nexus-1.13.0-2026-06-17.md` opens by noting *"several of its items
were never confirmed-applied."* One table beats status scattered across six preambles.

**Status vocabulary:** `Applied` (substance is present in shipped plugin text — verified by reading
the source, not inferred from a changelog) · `Open` (absent from shipped text) · `Owner-decision`
(needs a call before it can be applied).

Last verified: **2026-07-14** against nexus 1.34.0 / nexus-flutter 0.4.0.

## Summary

| File | Source | Entries | Applied | Open |
|---|---|---|---|---|
| `omni-1.22.0-2026-07-05.md` | omnishelf_flutter_app | 11 | 2 | 9 |
| `omni-1.23.1-2026-07-07.md` | omnishelf_flutter_app | 3 | 0 | 3 |
| `omni-1.25.1-2026-07-12.md` | omnishelf_flutter_app | 10 | 6 | 4 |
| `omni-1.32.0-2026-07-14.md` | omnishelf_flutter_app | 1 | 0 | 1 |
| `omni-flutter-0.3.0-2026-07-04.md` | omnishelf_flutter_app | 1 | 0 | 1 |
| `omni-flutter-0.3.0-2026-07-12.md` | omnishelf_flutter_app | 4 | **4** | 0 |
| **Total** | | **30** | **12** | **18** |

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

### `omni-1.22.0` Entry 8 — **Applied**
`mine-reference-model` skill built; ratified as **ADR-50** (`docs/architecture/README.md:1233`).
Entry 8's optional stage-2 is explicitly declined on record (`mine-reference-model/SKILL.md:151`).

### `omni-1.22.0` Entry 6 — **Applied (condensed)**
Scale datapoint landed at `mine-verify-cover/references/mine-family-core.md:75`. The 301k-token /
52-tool-call figures and the "revisit sharding for wider runs" line did not survive the condense.

## Open

Both applied `omni-1.22.0` entries were consumed as **inputs to building `mine-reference-model`**,
not from a pass over the file. No sweep of these files has ever run — which is what the 18 below are.

### `omni-flutter-0.3.0-2026-07-04` E1 + `omni-1.23.1` E3 — colon-form test tags (one issue, twice flagged)
`mine-verify-cover-flutter/SKILL.md:122,124` still ship `tags: ['layer:domain-calc', ...]` and
`--tags "criticality:golden&&runtime-cost:fast"`. Colons are a **hard parse failure** in
`package:test` (`boolean_selector` lexes `:` as the ternary operator), not a warning — a colon-form
`dart_test.yaml` fails to load, blocking every test in the file. The nexus-flutter 0.4.0 bump did not
touch this file (`git show --stat 988075b`); its last change was `82200b3`. Fix is mechanical: hyphen
composition preserves the full vocabulary. Needs its own nexus-flutter patch bump.

### `omni-1.23.1` E1, E2 — Cover tag emission + mined-test location
E1: tag emission is prose (`mine-verify-cover/SKILL.md:277`), not a gate — measured adherence 1-in-13.
The skill already argues this exact principle at `:238` (*"a prompt instruction is a request, not a
guarantee that it is followed"*) but doesn't apply it to tag emission. E2: no guidance on a single
mined-test root, no `arm-code`/`arm-spec` tag, no note that a `test_mine/` sibling of `test/` is
invisible to bare `flutter test` — which silently kept 132 code-arm tests out of CI.

### `omni-1.32.0` E1 — `resolveRole` doesn't map the `dev-*` abbreviation
**Diagnosis verified correct against source.** `KNOWN_ROLES` (`hooks/scripts/lib/resolve-role.js:18`)
has `developer`, not `dev`; `resolveRole('dev-wave0')` peels to candidate `dev`, misses, returns
unchanged → absent from `ARTIFACT_OWNERS[implementation.md]` (`boundary-detector.js:51`) → false
ADR-18 violation on every touch. The entry's correction of the original lessons' `.current-agent`
hypothesis is also right — the detector never reads it.

**Blast radius is larger than the entry reports:** `resolve-role.js` is shared with
`verify-gate.js`, where an unresolved name hits Branch 3 (`:134`) and writes `verdict:"skipped"` —
so a `dev-*` fast-lane developer's verify gate **never runs**. It is recorded as skipped rather than
silently swallowed (deliberate, per the HIGH-2 comment), so it is detectable in the log — but the
developer is unverified. This favors fix (a) teach `resolveRole` the abbreviation over (b) require
canonical spawn names, since prose can't defend the verify gate. Caveat for (a): use an exact-token
map consulted at the same two points as `KNOWN_ROLES`, never a prefix match — the `team-lead`
landmine (`:33-38`) and "unknown stays unknown" (`:41`) must both survive.

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

### `omni-1.22.0` E1–E5, E7, E9–E11 — the mine-verify-repo/cover cluster
Nine entries, all Open and untracked, each needing an edit to an existing skill: E1 lizard has no
native Dart reader (`lizard <dir>` silently returns 0 Dart files; `-f <filelist>` works) · E2
area-expansion rule for singleton-collapsed communities · E3 test-coverage lens granularity cap ·
E4 evidence-command traps (generated-file exclusion, formatter-split lines, awk-not-`grep -A` for
lcov) · E5 mandate foreground completion ("poll, don't wait") · E7 author-identity consolidation
before ownership · E9 `@JsonKey`-name mutants are codegen-inert · E10 hanging/crashing mutants +
process-tree kill + re-assert `char_pin` after abnormal exit · **E11** golden/UI miner sibling —
untracked in all registries, and *not* covered by `mine-verify-flows` (that is JSON flow goldens;
E11 is widget-render goldens).

## Residual

`docs/proposals/agent-grounding-memory-wiring.md:27` still carries the superseded *"OQ-1 transfers as
the tolerance default"* claim. It didn't contaminate the skill, but the proposal is now stale against
shipped doctrine — correct it or mark item 4 graduated.
