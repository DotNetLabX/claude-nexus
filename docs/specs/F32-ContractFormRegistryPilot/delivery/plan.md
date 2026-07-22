# F32-ContractFormRegistryPilot — grammar half (ADR-collapsed: plan is the definition)

**Feature Spec:** None — ADR-collapsed per F17/F20 precedent. Definition = the backlog F32 row +
`docs/kb/research/spec-representation-and-equivalence-oracles.md` (the research the field cites).
**Scope note:** this plan ships the **grammar half only**. The pilot (contract-form re-authoring of
one P0-RC/FSD-class registry + regeneration vs prose baseline) is **campaign-side, out of scope
here** — it runs in `omnishelf_flutter_app` after `/plugin update`, owned by the campaign
architect. The F32 backlog row therefore flips to "grammar half shipped / pilot owed", NOT Done.

## Context

Research-backed: full contracts close the spec-soundness gap by capturing the input assumptions
prose rules leave implicit (sound@1 64.8–71.3% vs 19.7–21.0%; test-set-correctness overestimates
soundness up to ~6×). The grammar half gives the registry an optional `precondition:` field so the
pilot has something to measure. Plan-time greps (2026-07-22): `precondition` as a row-field token —
0 collisions estate-wide; row-grammar echo sites are pointers to the owner section
(`mine-verify-cover` §The rule registry), not field-list copies — no sweep needed.

## Scope

**In:** the optional `precondition:` row field (grammar owner section), its consumption lines
(Cover test-writer; regenerate-unit generator), lint + release. **Out:** the pilot; any mandatory
use of the field (optional, never-blanket); spec-arm/Merge schema changes beyond the field's
availability (the row grammar is arm-agnostic already); `kb-navigation.md` (its field summary is
non-exhaustive prose — explicit no-edit disposition).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | field grammar + semantics (inline below) | — (surgical prose edit; F24 recipe gap already registered) |
| 2 | (none) | — | no | one consumer line in regenerate-unit Stage 3 | — |
| 3 | release-plugin | Follow | no | MINOR; glob-form test command | — |

## Implementation Steps

### Step 1 — The field, in the grammar owner

`plugins/nexus/skills/mine-verify-cover/SKILL.md` §The rule registry (field bullets at lines
309–315): TWO edits, each pinned to sibling weight (critic M1 fold — the bullet matches the
`status` bullet's 2-line weight and plain format; consumers/provenance live OUTSIDE the bullet):

1. Add one bullet after `source:` (verbatim):
   ```
   - `precondition:` — optional; the input assumptions under which the rule's outcome holds
     (argument ranges, null/shape constraints, checked or stated state). Mined, never invented —
     a rule with no encoded assumption carries no field; zero-`precondition:` registries stay valid.
   ```
2. Add one sentence to the prose BELOW the bullet list (after the "Rule statements are durable
   prose" paragraph): "A present `precondition:` is consumed by the Cover test-writer (input
   construction) and by regeneration (the generator treats it as the rule's binding input
   contract); provenance: F32, `spec-representation-and-equivalence-oracles.md`."

Producer intent (confirmed): the pilot authors preconditions MANUALLY — no Mine/Merge stage
emits the field in this increment. Do not touch the row-grammar framing sentence, the other field
bullets, or `kb-entry-schema`.
Satisfies: backlog F32 row, grammar clause.

### Step 2 — The consumer line in regenerate-unit

`plugins/nexus/skills/regenerate-unit/SKILL.md`, Stage 3's registry-semantics line ("active rows
only; bug-preserve rows implemented verbatim"): append one sentence — a row's optional
`precondition:` field is the rule's **input-assumption contract**, binding on the generator the
same way the rule statement is. Locate the line by grep (`bug-preserve`), not from this plan's
memory — the file shipped hours ago and is live.
Satisfies: backlog F32 row, consumption clause.

### Step 3 — Lint, release

Follow release-plugin. **MINOR** (new grammar capability — F26 charter-tier precedent); CHANGELOG
entry: the optional `precondition:` row field, its two consumers, the research provenance, and the
explicit "pilot owed campaign-side" status. Lint glob form green before bump; dry-run reasons must
name only mine-verify-cover + regenerate-unit. No gen-commands (no agents edited). No commit
(lane close owns it).

## Testing Strategy

Lint suite. The field's live validation IS the campaign pilot — out of scope here by design.

## KB Impact

None.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| ADR-collapsed definition (no tech-spec) | Two-way-door surgical edit; F17/F20/F26 precedent | Full tech-spec | decided |
| MINOR, not PATCH | New grammar capability consumers depend on (F26 precedent) | PATCH default | decided |
| `kb-navigation.md` NOT edited | Its field mention is a non-exhaustive prose summary; an optional field doesn't falsify it | Sweep it too | decided |
| Backlog row → "grammar half shipped / pilot owed", not Done | The pilot is the row's point; Done would erase the owed half | Flip to Done | decided |
| Review mode = code-grounded critic without re-asking | Standing mandate for shared-artifact passes + user picked it twice today ("you have already everything") | Re-ask at checkpoint | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (opus, 2026-07-22): **GO-with-fixes** — 1 MEDIUM folded (the drafted field
bullet was ~4× the plan's own ≤-status-weight ceiling with a format no sibling uses; compressed to
sibling weight, consumers/provenance relocated to the section prose). Verified clean: bullet-list
location (309–315), zero row-field collisions, the `bug-preserve` Stage-3 anchor (regenerate-unit
line 110), all four no-edit dispositions (kb-navigation proven non-exhaustive — it already omits
`last_verified`; cpp/php pointers; kb-entry-schema), no missed field-enumerating consumer, backlog
row faithfulness, Decisions hygiene. Producer-wiring absence confirmed as intended (manual
authoring in the pilot; miner emission is a later increment).
