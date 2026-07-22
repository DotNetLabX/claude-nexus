# F29-OracleStrengthMiner — mine-oracle-strength (twelfth mine)

**Feature Spec:** `docs/specs/F29-OracleStrengthMiner/definition/tech-spec.md`

## Context

Mechanize the field-validated (5×) blind-battery suite audit as the shipped `mine-oracle-strength`
skill — the twelfth mine. Consumed by F28's PROVE stage; standalone between campaigns. Graduated
from campaign #2's ratified S2 proposal; owner decisions D1–D5 recorded in the tech-spec.
Collision check (plan-time grep `oracle-strength|OracleStrength` over docs/): only this slug's own
artifacts + the backlog row + the program doc — no stale same-name artifact.

## Scope

**In:** the new skill (SKILL.md + hardened runner asset), the 12-member family sweep, program-doc +
ADR updates, lint + release. **Out:** F28 (consumes the report seam, built separately); F25 (recipe
— this run's friction feeds it via lessons); per-stack fills beyond Dart (TBD-at-first-use per D1);
running a live battery against a real suite (operator-owed at first campaign use).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | full inline detail in step | gap: mine-family-member authoring recipe (= F25; recurrence #4 after F10/F15/F16) |
| 2 | (none) | — | no | runner source location + Keep/Change/Scrub + D4 grammar | gap: same F25 gap (asset-promotion half) |
| 3 | (none) | — | no | enumerated echo-site list (plan-time grep, pasted) | gap: shipped-skill edit recipe (= F24) |
| 4 | (none) | — | no | ADR shape mirror (ADR-67), program-doc lines | — |
| 5 | release-plugin | Follow | no | MINOR (new capability); glob-form test command | — |

`Skill: None` never waives TDD; all steps here are prose/docs/script-port with no domain-logic test
harness — TDD `no` across the plan. Gaps route to `lessons.md ## Skill Gaps` per `lessons-format`
(binding record; the cells above are markers).

## Domain Model Changes

None — skill estate + docs only.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Author `plugins/nexus/skills/mine-oracle-strength/SKILL.md`

Skill: None (gap = F25). Author under the F18 standards (assumptions declared up front;
frontmatter description names the trigger shapes: "audit a gated suite", "fresh blind battery",
"suite-strength report", "reference-pair discrimination").

Content contract (from tech-spec §Method + §Decisions). The plan does not restate the spec's
§Method — but the shipped SKILL.md itself MUST fully describe stages 1–6, self-contained: consuming
repos never see this dev-repo's `docs/specs/` (sibling precedent: `mine-architecture/SKILL.md`
inlines its full pipeline). Binding pins:
- Stages 1–6 with **explicit stage-model pins (D3)**: mutant author + gap-kill `model: opus`;
  survivor adjudication `model: fable` (the judge); battery run + report `model: sonnet` —
  explicit override on every dispatch, never session-inherit.
- **D1 per-stack fill table**: columns = parse-check command · test command · crash return-code
  set · process-tree timeout mechanism. Dart row filled (proven in campaign #2); other stacks
  `TBD-at-first-use`. State the promotion rule (name-and-shape → full adapter contract only when a
  second stack's fill diverges).
- **Pair stage (D2)** with the mandatory skip line: "no pair declared → stage skipped, stated in
  the report — never silent"; the three verdict forms (discrimination proof / equivalence
  attestation *at measured strength* / red-on-reference = HALT).
- **Report section grammar** (the F28-PROVE seam — stable, grep-checkable section names):
  `## Scores` (raw kill %, reachable kill %, exact-floor comparison), `## Buckets`
  (COMPILE_FAIL/LOAD_CRASH/TIMEOUT counts + adjudications), `## Survivors` (REAL vs UNKILLABLE,
  code-cited, clusters), `## Gap-Kill` (tests added, sanity-red evidence), `## Pair`
  (verdict or skip line), `## Registry Annotations`.
- Family-core pointers (execution topology, skeptic protocol, marginal-budget rail, kickoff
  checklist) — pointer style copied from `mine-architecture/SKILL.md` (the newest member; cite for
  the pointer *surface* only), plus a Relationship table naming `mine-verify-cover` (family head),
  F28 `regenerate-unit` (consumer), and the instrument-integrity section it inherits.
- `user-invocable: true`.

Files: `plugins/nexus/skills/mine-oracle-strength/SKILL.md` (new).
Satisfies: tech-spec Acceptance 1, 3.

### Step 2 — Promote and harden the battery runner asset

Skill: None (gap = F25 asset half). **Source pinned (critic live-diff, 2026-07-22):**
`D:\omnishelf\omnishelf_flutter_app\docs\specs\adhoc-P0-RC-Regeneration\delivery\battery\mutation_battery_v3.py`
— the only candidate already implementing the bucket grammar (`excluded_non_viable`,
`pending_adjudication`, denominator-exclusion; FSD ran RC's tooling and owns no copy).
**DO-NOT-USE decoys:** the exact-name `mutation_battery.py` (adhoc-Refactor-W3 — unrelated
campaign, zero bucket logic) and `mutation_battery_v2.py` (W5 — same). Copy v3 to
`plugins/nexus/skills/mine-oracle-strength/assets/mutation_battery.py`.

**Keep/Change/Scrub (port rule):**
- Keep: exact-string apply, sha-verified restore, stdout scoring loop, mutant manifest format,
  **v3's existing bucket/adjudication logic** — verify it against D4, don't rebuild it.
- Change (D4 hardening): (a) kill = failing-test-assertion only — classify every non-pass into
  `COMPILE_FAIL | LOAD_CRASH | TIMEOUT` buckets, emitted per-mutant in the JSON report, never
  auto-killed; (b) per-pid/GUID scratch paths — no shared temp state; (c) exact floor comparison,
  no rounding anywhere in score arithmetic; (d) timeout kill reaches the whole process tree;
  (e) per-stack commands (parse-check, test, crash-rc set) read from a config block, not
  hardcoded Dart.
- Scrub: campaign-#2-specific paths, unit names, and repo literals — build the forbidden-token
  list from a census of the copied file (paths, `omnishelf`, dates, numeric fingerprints), then
  zero-hit gate it.

Acceptance: `grep -E "COMPILE_FAIL|LOAD_CRASH|TIMEOUT" assets/mutation_battery.py` ≥ 3 hits;
forbidden-token grep = 0 hits (separate command, `; true`); offline dry-run against a 2-file
fixture (tiny subject + 2-mutant manifest, no real test run — stub command) exits 0 and emits the
bucket fields in its JSON. **What a PASS does not prove:** no live battery ran — the first real
audit (a campaign suite) is the operator's arm, marked `Owner: operator` there.
Satisfies: Acceptance 2.

### Step 3 — Family sweep (count refs + table row), enumerated

Skill: None (gap = F24 recipe, not built — inline the discipline). The echo-site list below is the
**plan-time grep output** (`eleven|11-row|eleventh` over `plugins/**/*.md`, 2026-07-22) — the
acceptance grep re-runs the same query:

- `mine-verify-cover/references/mine-family-core.md`: line 3 "eleven-member" → twelve-member;
  line 25 "all eleven" → all twelve; **§The mine family table: insert row 12** — unit = one gated
  suite + its subject; ground truth = the subject source (never the suite); gate =
  sanity-red-proven gap-kill + the instrument-integrity honesty proof.
- Sibling count sweeps ("full 11-row family table" → 12-row; "all eleven members" → twelve):
  `mine-skill-candidates/SKILL.md:25-26`, `mine-reference-model/SKILL.md:28-29,221`,
  `mine-design/SKILL.md:25,27`, `mine-architecture/SKILL.md:24,26,215`,
  `mine-verify-repo/SKILL.md:27,276`, `mine-algorithm/SKILL.md:26,28`,
  `mine-verify-flows/SKILL.md:16`, `mine-verify-cover/SKILL.md:504` (also add
  `mine-oracle-strength` to that Relationship sentence's member list).
- **DO-NOT-TOUCH (positional ordinals + homonyms):** `mine-architecture/SKILL.md:20` "eleventh
  mine" (positional identity); `mine-design/SKILL.md:23` "sixth mine"; ADR-67's title/body
  ("eleventh") in `docs/architecture/README.md`; `plugins/nexus/CHANGELOG.md` historic entries;
  `mine-semantic-model/SKILL.md:34` "eleven profile inputs" (unrelated homonym — profile inputs,
  not family members).

Acceptance (each as a separate command; zero-hit greps append `; true`):
`grep -rE "eleven members|11-row" plugins/` → 0 hits (the tech-spec's literal scope — critic-verified:
no hits exist outside `plugins/nexus/skills` today and the "eleven profile inputs" homonym matches
neither pattern);
`grep -cE "^\| .?mine-" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` → 12
(member rows only — currently 11; never `grep -c "^|"`, which counts header+separator too);
positional-ordinal spot-greps (`"eleventh mine"` in mine-architecture, `"sixth mine"` in
mine-design) still hit — proving the carve-out held.
Satisfies: Acceptance 4, 5 (family half).

### Step 4 — Program doc + ADR register

Skill: None. Two files:
- `docs/programs/br-anchored-regeneration.md`: §4 line 107 "Eleven mines" → "Twelve mines" + add
  `mine-oracle-strength` to the §4 capability table's Gating row; §2 line 45 "(the S2
  `mine-oracle-strength` candidate, the 12th mine)" → mark shipped; §7 **item 3 only** status
  (candidate → shipped, F29) — item 1 is F16's historic record, not an edit target. DO-NOT-TOUCH: §7 line 175 "the eleventh mine shipped" (historic
  F16 event, positional).
- `docs/architecture/README.md`: new ADR "mine-oracle-strength is the twelfth mine: unit = one
  gated suite + its subject, output = the suite-strength report + registry annotations" — index
  line + body section **mirroring ADR-67's shape** (Decision / status *(Accepted —
  F29-OracleStrengthMiner, {date})*). Number: next free — **ADR-68 by the 2026-07-22 register
  (top = ADR-67; 66 absent) — re-verify at edit time**.
Satisfies: Acceptance 5.

### Step 5 — Lint, release, commit

Follow release-plugin. Inputs: nexus plugin, **MINOR** (new capability — a new shipped skill);
CHANGELOG entry names the twelfth mine + the D4 runner hardening + the sweep (mirror the F16
CHANGELOG entry's shape, including its "siblings swept N → N+1 (positional ordinals untouched)"
line). Before the bump: `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` (glob form
— never bare-directory, per CLAUDE.md) green. Bump + content in the same commit; no
`gen-commands` run needed (no `agents/*.md` edited). Run the bump once, after Steps 1–4 all land.
Satisfies: Acceptance 6, 7.

## Cross-Service Changes

None (dev-repo skill estate).

## Migration Notes

None.

## Testing Strategy

Lint suite (glob form) is the shipped gate; Step 2's offline fixture dry-run proves the runner's
bucket grammar; the live battery is explicitly operator-owed at first campaign use (F28 preflight
or a standalone audit). No stack toolchain runs in this repo.

## KB Impact

None — `docs/kb/` here is the research pool; the relevant entry
(`spec-representation-and-equivalence-oracles.md`) is already current and cited by the tech-spec.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Report section grammar fixed at plan time (`## Scores/Buckets/Survivors/Gap-Kill/Pair/Registry Annotations`) | It is the F28-PROVE consumption seam — a stable grep target beats a developer-chosen shape F28 would then chase | Leave section names to the developer | decided |
| Step 1/2 disposition None despite `improve-skills` proximity | improve-skills' create-half targets project-local scaffolds and routes shipped-skill fixes via plugin-feedback — dev-repo new-mine authoring is exactly the registered F25 gap | Follow improve-skills | decided |
| ADR number written as "68, re-verify at edit time" | Register may gain rows before implementation; a hard pin would ship a collision | Hard-pin ADR-68 | decided |
| Runner source pinned to adhoc-P0-RC `mutation_battery_v3.py` | Critic's live diff of the 3 candidates: v3 alone carries the D4 bucket logic; the exact-name file is a decoy from an unrelated campaign | Developer-grep resolution (would likeliest pick the decoy) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (fresh context, 2026-07-22): **GO-with-fixes** — 3 HIGH, 1 MEDIUM, 1 LOW, all
folded above: (H1) runner source pinned to `mutation_battery_v3.py`, decoys named DO-NOT-USE;
(H2) row-count acceptance command rewritten to count member rows only; (H3) Step 4 "§7 items 1/3" →
"item 3 only"; (M1) Step 3 acceptance grep widened to the tech-spec's literal scope; (L1) Step 1
self-containment wording tightened. Critic verified clean: the full echo-site enumeration + all
DO-NOT-TOUCH carve-outs, D1–D5 pin fidelity (backlog F28 row, instrument-integrity grammar, ADR-67
mirror, S1-PROVE seam), all Satisfies↔Acceptance mappings, Decisions hygiene. Common root of the
HIGHs: mechanically-verifiable claims written without a live dry-run — logged to lessons.
