# Implementation Plan — F17-MineFieldFixes (plugin-feedback P18 + P19)

**Feature Spec:** None — ADR-collapsed definition (ADR-25/58): binding input = backlog row F17
(`docs/backlog.md`) + plugin-feedback `docs/plugin-feedback/nexus-1.36.0-2026-07-18.md` items
P18/P19 (+ its `## Triage` block).
**Slug:** F17-MineFieldFixes · **Intent:** Scoped (two small hardenings, three surfaces)
**Plan status:** Approved — code-grounded critic review folded (see `## Plan Review`)
**Baseline at plan time (2026-07-20):** HEAD `5cfce18`, nexus **1.38.0**, nexus-analytics **0.4.0**.
**Mode:** architect-led fast lane (standalone). The developer runs **no git write of any kind** and
**no version bump** — release + commit happen at lane close in the main session.
**Unrelated dirt (do not touch):** `docs/kb/research/br-anchored-regeneration-landscape.md`
(untracked, owned by another thread).

## Context

Two field fixes from the knowledge-gateway 2026-07-18 run, urgent because the F2-SdkRewrite
campaign's P2 census/mining waves execute these exact code paths next:

- **P18:** `mine-skill-gaps` S1 Tier-A census greps `## Skill Gaps` case-sensitively at h2 only.
  The KG run missed F3's `### Skill gaps` (lowercase, h3) and initially misclassified three
  captured candidates as capture leaks; F8-style heading-less candidate bullets also escape.
- **P19:** the mine-family kickoff checklist (Tier 1) has no stage-model-plan item. Operator
  directive 2026-07-18: a run declares at kickoff which model tier each stage class runs on.
  The checklist is code-enforced (`kickoff-preflight.mjs`, F7 S4) — the item needs both halves:
  prose + checker. It generalizes the clause `mine-skill-gaps` §Execution topology already
  carries ("dispatched at the session's model tier or a deliberately named one").

## Scope

**In:** the three surfaces above + the 8 sibling pointer-line enumerations + the preflight test.
**Out:** any other feedback item (F18–F22 own them); renumbering/altering Tier 2; the release
bump/commit (lane close, main session); the omni twin (regenerated at close per ADR-9).

**Binding identifiers (public surface):** config key `stageModelPlan`; checklist item title
**Stage-model-plan declared**; the declare-and-veto semantics. Exact prose wording elsewhere is
the developer's call within the acceptance greps.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | prose edit to one shipped SKILL.md; no skill covers editing shipped plugin skills in the dev repo (verified: `improve-skills` scaffolds project-local + routes shipped fixes to plugin-feedback — we ARE the apply side) | — |
| 2 | (none) | — | no | same class of edit, 10 files | — |
| 3 | tdd | Follow | yes | red-first on the new `stageModelPlan` universal check | — |
| 4 | (none) | — | no | mechanical sweep + lint + full suite | — |

## Implementation Steps

### Step 1 — P18: `mine-skill-gaps` S1 sweep hardening
**Skill:** None · **TDD:** no · **Satisfies:** feedback P18
**File:** `plugins/nexus/skills/mine-skill-gaps/SKILL.md`

Three touch points (current text verified at plan time):
1. Pipeline block (line ~35, `Tier A  grep pre-flagged lessons \`## Skill Gaps\` entries`): the
   sweep is **case-insensitive, any heading level**.
2. §S1 **Tier A** paragraph (line ~52): state the sweep contract — match the `Skill Gaps` heading
   case-insensitively at any heading level (`## Skill Gaps`, `### Skill gaps`, …); the fielded
   entry (`### {Suggested skill name}` per `lessons-format`) remains the candidate of record.
3. §**Parser posture** (line ~73): add the heading-less-bullet tolerance — a candidate-shaped gap
   bullet in lessons.md sitting under NO `Skill Gaps` heading is swept and surfaced as a
   **capture-signal** (a *distinct* disposition from the orphan-cell "capture leak" — do NOT widen
   that precisely-defined term; one clause distinguishing the two is enough), never silently
   skipped. Cite the measured miss (KG 2026-07-18: h3-lowercase section missed → three candidates
   misclassified as capture leaks).

Do NOT restructure the file; smallest coherent edits. Developer decides exact sentences.

**Accept** (before-state verified 0 hits for each):
- `grep -ic 'case-insensitive' plugins/nexus/skills/mine-skill-gaps/SKILL.md` ≥ 1
- `grep -ic 'any heading level' plugins/nexus/skills/mine-skill-gaps/SKILL.md` ≥ 1
- `grep -ic 'heading-less' plugins/nexus/skills/mine-skill-gaps/SKILL.md` ≥ 1 (Parser posture area)

### Step 2 — P19 prose: Tier-1 item 5 + the 8 pointer-line enumerations (+ mine-skill-gaps pointer clause)
**Skill:** None · **TDD:** no · **Satisfies:** feedback P19 (prose half)

**File 1 — `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`** §Kickoff
checklist, Tier 1: add item **5. Stage-model-plan declared** — the run names which model tier each
stage class runs on: mechanical collection/extraction stages may run a **named** cheaper tier;
judgment stages (clustering, skeptic, judges) run the session tier or a deliberately named one.
**Declare-and-veto** — the declaration lands in the kickoff output for the operator to veto, never
an interactive prompt. Note it generalizes the `mine-skill-gaps` §Execution topology clause.

**File 2 — `plugins/nexus/skills/mine-skill-gaps/SKILL.md`** §Execution topology: tie the existing
"session's model tier or a deliberately named one" clause to the new core Tier-1 item (one
pointer clause; the existing sentence stays; the clause carries the literal token
`stage-model-plan` — the acceptance grep keys on it).

**Files 3–11 — the 9 pointer-line enumerations** (list derived from the exact plan-time grep
`grep -rn 'tool preflight' plugins/ | grep -v kickoff-preflight.mjs`; these enumerate the Tier-1
items in a parenthetical and must gain `stage-model-plan`):

| File | Line (plan time) |
|---|---|
| `plugins/nexus/skills/mine-algorithm/SKILL.md` | 70 |
| `plugins/nexus/skills/mine-architecture/SKILL.md` | 108 |
| `plugins/nexus/skills/mine-design/SKILL.md` | 71 |
| `plugins/nexus/skills/mine-reference-model/SKILL.md` | 63 |
| `plugins/nexus/skills/mine-verify-cover/SKILL.md` | 112 |
| `plugins/nexus/skills/mine-verify-flows/SKILL.md` | 155 |
| `plugins/nexus/skills/mine-verify-repo/SKILL.md` | 112 |
| `plugins/nexus/skills/mine-skill-gaps/SKILL.md` | (no enumeration today — gains none; File-2 edit only) |
| `plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md` | 295–299 |

Note: `mine-semantic-model` is in **nexus-analytics** — that plugin is release-affected too (lane
close handles both bumps). The enumerations wrap across lines — insert `stage-model-plan` wherever
the parenthetical flows; the acceptance is per-file, structure-independent.

**Accept:**
- `grep -n 'Stage-model-plan declared' plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` → exactly 1 hit, inside Tier 1
- `grep -c 'stage-model-plan' <file>` ≥ 1 for **each** of: the 8 enumeration files above
  (mine-algorithm, mine-architecture, mine-design, mine-reference-model, mine-verify-cover,
  mine-verify-flows, mine-verify-repo, mine-semantic-model) + mine-skill-gaps (the File-2 pointer)
- `grep -in 'declare-and-veto' .../mine-family-core.md` ≥ 1

### Step 3 — P19 checker: `kickoff-preflight.mjs` + test (TDD, red first)
**Skill:** Follow tdd · **TDD:** yes · **Satisfies:** feedback P19 (checker half)
**Files:** `plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs`,
`tests/unit/kickoff-preflight.test.mjs`

Red first: extend the test — `baseConfig` gains `stageModelPlan: 'extract=named-cheaper-tier,
judgment=session-tier'` (any meaningful string), and the universal-field loop (plan-time line 42:
`['toolPreflight', 'expectedSurvivalRate', 'stopBudget', 'runReportLocation']`) gains
`'stageModelPlan'`. Run → the new loop case fails (checker doesn't know the key). Then green:
add to `UNIVERSAL` — `{ key: 'stageModelPlan', reason: '<named reason carrying: which tier each
stage class runs; mechanical may be a named cheaper tier, judgment stages the session tier or a
deliberately named one; declare-and-veto>' }` — and update the header comment (line 11 universal
enumeration). `confirmed()` semantics unchanged (a non-empty string passes).

**Accept:**
- `node --test tests/unit/kickoff-preflight.test.mjs` → all pass
- the universal-field loop includes `'stageModelPlan'` (grep the test file)
- `grep -c "key: '" plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs` → 5

### Step 4 — Conformance sweep + lint + full suite
**Skill:** None · **TDD:** no

- Re-run every Step 1–3 acceptance grep; fix any miss.
- Sweep check: for each of the 8 enumeration files, `grep -l 'stage-model-plan' <file>` succeeds
  (structure-independent — do not grep for the item on the same line as `tool preflight`).
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <dir>` green for every edited
  skill dir (mine-skill-gaps, mine-verify-cover, mine-algorithm, mine-architecture, mine-design,
  mine-reference-model, mine-verify-flows, mine-verify-repo, and nexus-analytics
  mine-semantic-model). Invocation form per the lint's own usage — the gate is "lint passes".
- Full regression: `node --test tests/unit/` → green (no unrelated breakage).

## Testing Strategy

Step 3 is the only code change — covered red-first by the existing node:test suite. Steps 1–2 are
prose gated by the executed acceptance greps. Step 4 is the belt-and-braces regression pass.

## KB Impact

None — dev-repo plugin prose + one shipped tool; no consuming-project KB entries exist for these.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Extend the 9 pointer-line enumerations rather than de-enumerating to a bare pointer | Enumeration is the family's shipped convention; at-a-glance value at the cost of one more sweep site per future item | Replace parentheticals with "the five Tier-1 items (see core)" — less drift surface but loses the at-a-glance list and churns 9 files harder | decided |
| No new ADR | Two-way-door checklist amendment; the record = family-core text + CHANGELOG (F9 needed ADR-61 for a coordination-contract change; this is smaller) | Extract an ADR at close | decided |
| PATCH tier for both plugins (nexus + nexus-analytics) | Default per release policy; a checklist item + parser-posture hardening is a fix, not a new capability | MINOR (owner may still escalate at close) | decided |
| Config key `stageModelPlan`; item title "Stage-model-plan declared" | Matches the checker's camelCase key convention and the checklist's title style | `modelTierPlan` / `stageTiers` | decided |
| Architect-led fast lane | Owner's "just proceed / do as you feel best" + F17 is small and campaign-urgent | Full team pipeline (heavier than the change warrants) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (2026-07-20): **APPROVE** — 0 CRITICAL/HIGH, 2 MEDIUM, 2 LOW; all folded:
- MEDIUM (capture-leak term overload) → Step 1 tp3 now mandates the **capture-signal** disposition,
  distinct from the orphan-cell "capture leak"; the term is not widened.
- MEDIUM (PATCH-vs-MINOR is a deliberate owner call) → deferred to lane close by design; the
  closing session states the call explicitly at bump time.
- LOW (File-2 literal token) → instruction now names the `stage-model-plan` token requirement.
- LOW (9 → 8+1 labeling) → header/scope corrected to "8 enumerations + the mine-skill-gaps
  pointer clause".
Critic evidence highlights: all cited line anchors exact at `5cfce18`; the 8-site grep reproduces
exactly; red-first proven sound (adding the loop key fails exactly one test); no shipped
universal-set enumerator outside the covered set; historical delivery records correctly untouched;
baseline suite 10/10 green.
