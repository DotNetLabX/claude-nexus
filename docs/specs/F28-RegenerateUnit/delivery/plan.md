# F28-RegenerateUnit — regenerate-unit (program-home regeneration skill)

**Feature Spec:** `docs/specs/F28-RegenerateUnit/definition/tech-spec.md`

## Context

Codify the 5×-validated wave inner loop as the shipped `regenerate-unit` skill, plus the G1
cluster mode the fix-shelf pilot needs. Consumes F29's just-shipped report seam (nexus 1.42.0).
Collision check (plan-time grep `regenerate-unit|RegenerateUnit`, critic-completed): no stale
same-name artifact. Echo sites + dispositions: mine-oracle-strength SKILL.md:3,18,319 (forward
refs, become live — no edit); ADR-68 body (no edit); CHANGELOG 1.42.0 (historic — no edit);
program doc §5 + §7 item-1 build queue (EDITED by Step 3); idea-brs-as-behavioral-spec.md:117
(soft build-queue mention — no edit, F27/F31 keep the framing valid).

## Scope

**In:** the new skill (SKILL.md — no scripts/assets; the loop is agent-orchestrated), program-doc
status updates, lint + release. **Out (D1, user-confirmed):** p0d incident extras (estate-damage
sweep, plugin-gate stops); instrument honesty (F29's territory); the conventions charter itself
(F27); campaign catalog/ledger instances (campaign-owned species). No family-count sweep — this
is not a mine-family member.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | full inline detail in step | gap: program-home skill authoring recipe (adjacent to F25's mine recipe — log recurrence) |
| 2 | (none) | — | no | seam-contract greps (F29 sections, catalog shape) | — |
| 3 | (none) | — | no | program-doc line edits | — |
| 4 | release-plugin | Follow | no | MINOR (new capability); glob-form test command | — |

All steps prose/docs — TDD `no` across the plan (no runtime code; the skill's own live validation
is a campaign run, operator-owed by construction). Gaps route to `lessons.md ## Skill Gaps`.

## Domain Model Changes

None. ## Data Model Changes — None.

## Implementation Steps

### Step 1 — Author `plugins/nexus/skills/regenerate-unit/SKILL.md`

Skill: None (gap: skill-authoring recipe). F18 standards; frontmatter description names the
trigger shapes ("regenerate a unit/cluster from its mined registry", "wave inner loop", "GO/NO-GO
regeneration report", "cluster rule→target-home mapping").

The SKILL.md must be **fully self-contained** (consuming repos never see this repo's docs/specs/):
inline the entire tech-spec §Method — stages 1–6 with the four preflight hard gates, cluster mode
(G1 fail-closed HALT semantics + orphaned-registry dispositions), the calibration-ledger mechanism
+ 4 seeded rulings, stage-model pins (opus generator / fable adjudication / sonnet mechanical,
explicit per dispatch), the ≤3 repair loop with registry-gap vs generation-slip adjudication, the
declared-ambiguities + files-read honesty outputs, the adoption-standalone rule, and the report
shape (GO/NO-GO, N-way shape table, residuals, declared gate gaps, G3 bench line).
Relationship table: `mine-verify-cover` (registry + run-2 refresh), `mine-oracle-strength`
(PROVE — invokes, never re-implements), `mine-design` (census as directive evidence only),
`mine-skill-candidates` (anti-pattern list), F27 charter (directive input when present).
`user-invocable: true`.
Satisfies: Acceptance 1, 2, 4.

### Step 2 — Seam-contract verification (in the same SKILL.md, gated by greps)

Skill: None. Two content-claim contracts, each verified by grep at implementation time:
- **F29 seam:** the PROVE section's six section names must byte-match the shipped grammar —
  `grep -E "## Scores|## Buckets|## Survivors|## Gap-Kill|## Pair|## Registry Annotations"
  plugins/nexus/skills/mine-oracle-strength/SKILL.md` (6 name hits expected; run it, don't trust
  this plan's memory).
- **G2 catalog shape:** the preflight's required row shape (unit · seam kind · oracle location)
  must match the live instance's columns — read
  `D:\omnishelf\omnishelf_flutter_app\docs\golden-seam-catalog.md` header row and mirror its
  actual column set (critic-observed today: `unit | layer | registry | rules | gated | seam |
  byte-comparable? | wave-scope`, seam taxonomy `either-serialize | flow-golden:{flow} |
  file-write | none` — re-read at implementation time, the file is campaign-owned and moves).
  **The observed columns REPLACE the placeholder row-shape line inlined from §Method in Step 1 —
  never leave both in the SKILL.md.**
Satisfies: Acceptance 3.

### Step 3 — Program doc status updates

Skill: None. `docs/programs/br-anchored-regeneration.md` — **targets re-grounded against the live
2026-07-22 §7 rewrite (critic HIGH-1):**
- §5 line ~140-141 ("S1 `regenerate-unit` and S2 `mine-oracle-strength` build **nexus-side**") —
  mark both shipped in one edit (S2 = 1.42.0; S1 = this release). F29's ship did NOT update §5;
  this repairs the half-stale line.
- §7 **item 1's Build queue** (lines ~185-188: "F27 conventions pipeline → F28 `regenerate-unit`
  (cluster mode = gap G1, …) → F30/F31; F32 …") — remove F28 from the queue arrow-chain and
  append a shipped note: "F28 `regenerate-unit` shipped (this release — cluster mode G1 +
  G2/G3 preflight gates live)". Item 1 IS the edit site — the earlier "item 1 = F16 historic"
  description was wrong.
- **DO-NOT-TOUCH:** §7 items 2/3/4 (campaign + estate status — other sessions own them), §2
  experiment table, §5's campaign narrative beyond the S1/S2 sentence.
No backlog edit in this step (row flips at lane close with the sha, per house precedent).
Satisfies: Acceptance 5.

### Step 4 — Lint, release, commit

Follow release-plugin. MINOR (new capability — new shipped skill); CHANGELOG entry: the
program-home regeneration skill, the G1/G2/G3 fold, the D1 boundary, the F29-seam consumption.
Before bump: `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` green. Bump once,
after Steps 1–3; dry-run reasons must name only F28 files. No gen-commands (no agents edited).
Satisfies: Acceptance 6.

## Cross-Service Changes

None. ## Migration Notes — None.

## Testing Strategy

Lint suite is the shipped gate. The loop's live validation is a campaign run (fix-shelf pilot /
p0c Stage 2) — **operator-owed by construction**; a PASS here proves skill text + seam contracts,
not a live regeneration.

## KB Impact

None.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| No scripts/assets — agent-orchestrated loop only | The 5 validated runs were agent-orchestrated; the only tooling (battery runner) ships in F29 | Ship an orchestration script | decided |
| Catalog shape mirrored from the live instance at implementation time | The live catalog is the species precedent; hard-coding columns from this plan's memory risks drift | Pin columns in the plan | decided |
| Program-doc §5 marks BOTH S1+S2 shipped in one edit | The sentence names both; editing it twice across releases would leave a half-stale line | S1-only edit | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (opus, fresh context, 2026-07-22): **GO-with-fixes** — 1 HIGH, 2 MEDIUM,
1 LOW, all folded: (H1+M2) Step 3's §7 targets re-grounded against the live same-day §7 rewrite
(the build queue moved into item 1; the old "item 3 fast-track list" no longer exists — the plan
had been written against a from-memory pre-F29 structure); (M1) collision list completed with
idea-brs-as-behavioral-spec.md:117 + explicit dispositions; (L1) Step 2's observed catalog columns
declared to REPLACE the §Method placeholder shape. Critic verified clean: the full §S1→spec
promotion (no dropped obligations; the model-tier deviation is explicitly owner-ratified), the F29
seam byte-match (all six section names), the fix-shelf cluster premise (2 orphaned registries
live in the catalog), stage-model pin consistency, D1 exclusion (no p0d leakage), Decisions
hygiene, all Satisfies↔Acceptance mappings.
