# adhoc-AgentGrounding — Registry consumers, discoverability, and the grounding contract

**Feature Spec:** `docs/specs/adhoc-AgentGrounding/definition/tech-spec.md` (Status: Ready)

## Context

The rules-registry slice (`adhoc-RulesRegistry`, shipped as nexus 1.21.1 / nexus-cpp 0.1.4) delivered
the registry artifact; this slice wires its consumers: rebase the three inert C2-conditional agent
hooks onto the live C1 registries (U1), add the rule-aware review rider (U2), make registries
discoverable in the navigation rules (U3), ship the consumer-repo grounding contract (U4, ADR-52),
add the C++ graph-extraction recipe (U5), and rebase the merge-harness defaults (U6). All decisions
are ratified — see the tech-spec and the two proposals; nothing here re-opens them.

## Scope

**In:** U1–U6 as specified in the tech-spec — files: `plugins/nexus/agents/{solo,developer,architect,reviewer}.md`
(+ regenerated `commands/`), `plugins/nexus/rules/{kb-navigation,kb-maintenance}.md`,
`plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md`, `harness/merge.workflow.js`,
`harness/lib/rules-registry.mjs`, `tests/unit/{rules-registry,kb-distill}.test.mjs`, release bumps.
**Out:** the gateway consultation rule (spike queued behind this slice), `mine-verify-flows`
graduation, the `ground-repo` skill, the conformance and node-payload spikes, all consumer-repo
executions (SDK grounding pass, KB sync script). See tech-spec Out-of-scope.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Pinned hook text, solo.md + developer.md | |
| 2 | (none) | — | no | Pinned hook text, architect.md | |
| 3 | (none) | — | no | Rider text, reviewer.md two sections | |
| 4 | (none) | — | no | Nav layer + species note, two rules files | |
| 5 | (none) | — | no | Grounding-contract section (ADR-52 content) | |
| 6 | (none) | — | no | clang-uml recipe, cpp SKILL.md | |
| 7 | tdd | Follow | yes | New default path + area arg, harness + 2 test files | |
| 8 | (none) | — | no | `node scripts/gen-commands.mjs nexus`, 4 commands | |
| 9 | (none) | — | no | AC-1..AC-7 verification sweep | |
| 10 | release-plugin | Follow | no | nexus + nexus-cpp bumps, MINOR recommendation | |

## Domain Model Changes

None — doc/rule/agent-text + dev-repo harness pass.

## Data Model Changes

None.

## Implementation Steps

**Binding surfaces:** the pinned sentences below (AC greps target them) and all file paths. Free
(developer's call): exact placement *within* a named section, prose around the pinned sentences,
harness internal decomposition.

### Step 1 — Rebase the solo + developer hooks (U1)

Files: `plugins/nexus/agents/solo.md` (hook at ~line 14), `plugins/nexus/agents/developer.md`
(~line 66). Replace each **Attestation drift check (pre-implementation)** paragraph with the
**Registry guardrail (pre/post-edit)** paragraph. Pinned text (both files; the one per-agent variance
is the disclosure target):

> **Registry guardrail (pre/post-edit).** When the unit you are about to touch **has a registry at
> `docs/business-rules/<area>/<unit>.md`**, read it before editing — its rows are the load-bearing
> behaviors. After the edit, run a **scoped skeptic re-verify** of the touched rules: spawn a
> read-only `general-purpose` verifier over the edited source vs the touched rows (if subagent spawn
> is unavailable, do the re-check in-context and disclose it in {implementation.md | your final
> report}); semantic drift is flagged and fixed or escalated — never silently absorbed, never a full
> re-mine. **Update the affected tests in the same pass**, or flag an **M3 re-mine**. (C2 attestation
> records remain a future SddLifecycle arc; when they ship, attestation joins this trigger.)

Use `implementation.md` in developer.md, `your final report` in solo.md.
Satisfies: AC-1, AC-2.

### Step 2 — Rebase the architect hook (U1)

File: `plugins/nexus/agents/architect.md` (~line 246). Replace the **Attestation drift check
(plan / done-check time)** bullet with:

> **Registry guardrail (plan / done-check time).** When a unit in scope **has a registry at
> `docs/business-rules/<area>/<unit>.md`**, plan the obligations: the pre-edit registry read, the
> post-edit scoped skeptic re-verify, and the test update (or M3 re-mine flag) — you never execute
> them yourself; plan the obligation, don't execute it. (C2 attestation records remain a future
> SddLifecycle arc; when they ship, attestation joins this trigger.)

Satisfies: AC-1.

### Step 3 — Rule-aware review rider (U2)

File: `plugins/nexus/agents/reviewer.md`. Two additions (exact position within each named section is
the developer's call):
- In `## Before Reviewing`: a numbered item — when the diff touches a unit that **has a registry at
  `docs/business-rules/<area>/<unit>.md`**, read that registry before reviewing; its rows are the
  verified load-bearing behaviors.
- In `## Review Dimensions`, after the stage-gate paragraph: a **Rule-aware rider (where a registry
  exists)** note — check the change against the unit's registry rows; a finding that contradicts a
  row names the rule ("this change flips BR-12: {statement}"), severity per the standard scale.
  Absence of a registry changes nothing; a rider on dimensions 1–2, not a new stage or axis.

Satisfies: AC-3.

### Step 4 — Registry discoverability in the navigation rules (U3)

- `plugins/nexus/rules/kb-navigation.md`: add a `## Business-Rules Registries` section after the
  intro protocol: for a behavior question about a **specific class/unit**, check
  `docs/business-rules/<area>/<unit>.md` before reading source — if present it holds the unit's
  verified rules with per-row provenance (`source: code | spec | both`), status, and criticality
  (ADR-45). Skip silently when `docs/business-rules/` doesn't exist in the repo.
- `plugins/nexus/rules/kb-maintenance.md`: add a `## Species Boundary — Registries Are Not KB
  Entries` section: this file governs `docs/kb/` only; registries under `docs/business-rules/` are
  their own species (ADR-45) with their own lifecycle — **never hand-edit** them; changes flow
  through a re-mine or the post-edit skeptic re-verify. None of this file's update/lint rules apply
  to them.

Satisfies: AC-4.

### Step 5 — Repo grounding contract section (U4)

File: `plugins/nexus/rules/kb-navigation.md`. Add a `## Repo Grounding Contract` section stating
(content mirrors ADR-52 — keep it compact, ~10 lines):
- A consumer repo is agent-ready when it provides the three thin indexes —
  `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` —
  each an index over existing docs, not a rewrite; plus a **tracked, script-synced** copy of the
  estate KB (never a manual untracked copy). The knowledge-gateway MCP is the runtime layer **once
  the gateway consultation rule ships** (conditional — that rule is spike-gated).
- Agent behavior: surface a missing grounding file **once per session** — note it and offer to
  create the index; never nag, never block.

Satisfies: AC-5 (the ADR-52 index line + body already landed at definition time — verify presence,
don't re-add).

### Step 6 — C++ graph-extraction recipe (U5)

File: `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md`. Add a short self-contained section
adjacent to `## Picking a target (this decides the ceiling)` (~line 131): **clang-uml** as the
extraction layer feeding `graphify-out/GRAPH_REPORT.md` — `compile_commands.json` via Ninja,
GraphML + JSON model output, context-radius and path/regex filters that exclude god nodes at
extraction time; **CodeQL licence-barred** for private repos; **Joern** zero-build fallback. Cite
the SDK research entry (`docs/kb/research/cpp-code-graph-tooling.md`, omnivision repo) as provenance
only — all essentials inline (shipped-text self-containment).
Satisfies: AC-6.

### Step 7 — Merge-harness path rebase (U6) — TDD: yes, Follow tdd

Files: `tests/unit/rules-registry.test.mjs` (lines 4, 129 comments + fixtures),
`tests/unit/kb-distill.test.mjs` (fixture paths at lines 24, 28, 36, 55, 68, 106, **plus the line-72
regex assertion** in escaped-slash form `docs\/kb\/golden\/X\.md`),
`harness/merge.workflow.js` (`REGISTRY_PATH` default, currently line 492),
`harness/lib/rules-registry.mjs` (comments at lines 4, 159).
This 12-line list IS the acceptance grep's baseline hit set (re-run at plan time, same query — no
hand-curated drift).
Red first: re-point the test fixtures/assertions to `docs/business-rules/…` paths; then change the
`REGISTRY_PATH` default to compose `docs/business-rules/<area>/<unit>.md` with the area supplied via
an optional arg (explicit `registryPath` override stays supported; when no area is supplied, compose
the single-area form `docs/business-rules/<unit>.md` per Contract R1). Update the two
`rules-registry.mjs` comments. DO-NOT-TOUCH: anything under `harness/.runs/` (gitignored run
history) and `docs/specs/**` (immutable delivery records).
Acceptance: `git grep -nE "kb[\\\\/]+golden" -- harness tests` → 0 hits;
`grep -nE "docs[\\\\/]+business-rules" harness/merge.workflow.js` → ≥1 hit on the `REGISTRY_PATH`
default (separator-agnostic, mirroring the negative gate — the composition separator style is the
developer's call; critic MED-2); `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green —
the repo's documented CI form (kb-distill.test.mjs:9). Do NOT use the bare directory form
`node --test tests/unit/` — it errors MODULE_NOT_FOUND on Node v24, a false RED on a green suite
(critic MED-1, verified by execution: glob form = 458 pass, 0 fail).
Satisfies: AC-7.

### Step 8 — Regenerate commands

Run `node scripts/gen-commands.mjs nexus` once, after Steps 1–3. Verify
`plugins/nexus/commands/{solo,developer,architect,reviewer}.md` reflect the new hook/rider text.
Satisfies: AC-1, AC-3 (the "regenerated commands match" clauses).

### Step 9 — Verification sweep

Run and record in implementation.md:
- `grep -rn "activates the day the first one ships" plugins/` → **0 hits** (AC-1 negative; executed
  baseline 2026-07-09: exactly 6 hits — the 3 agent hooks + their 3 generated commands, all removed
  by Steps 1–2 + 8; no other plugins/ file carries the phrase).
- `grep -l "has a registry at" plugins/nexus/agents/{solo,developer,architect,reviewer}.md` →
  **4 files** (AC-1/AC-3 positive — the pinned trigger phrase).
- `grep -n "business-rules" plugins/nexus/rules/kb-navigation.md plugins/nexus/rules/kb-maintenance.md`
  → ≥1 hit each (AC-4); kb-maintenance's hit includes "never hand-edit".
- `grep -n "Repo Grounding Contract" plugins/nexus/rules/kb-navigation.md` → 1 hit; section names the
  three index files + "script-synced" (AC-5); ADR-52 present in `docs/architecture/README.md`
  (index line + body — landed at definition, verify only).
- `grep -n "clang-uml" plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` → ≥1;
  `grep -n "Joern"` → ≥1 (AC-6).
- The Step-7 acceptance greps + `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (AC-7).
- `grep -l "has a registry at" plugins/nexus/commands/{solo,developer,architect,reviewer}.md` →
  **4 files**, and `grep -c "Rule-aware rider" plugins/nexus/agents/reviewer.md` → ≥1 with the
  regenerated `commands/reviewer.md` mirroring it — the AC-1/AC-3 positives on the generated copies
  (critic LOW-4).
Satisfies: AC-1–AC-7.

### Step 10 — Release (Follow release-plugin)

After ALL edits land (never per-step, per CLAUDE.md): Follow **release-plugin** — dry-run, then bump
**nexus** and **nexus-cpp**; CHANGELOG entries name the guardrail rebase (C2→C1 + review rider +
discoverability) and the grounding contract (ADR-52). **Phrasing guard (predecessor lesson,
adhoc-RulesRegistry):** fresh CHANGELOG prose must NOT quote the retired trigger phrase verbatim —
write "the old C2-conditional trigger", never the literal "activates the day the first one ships" —
or it re-trips the Step-9 negative grep. Re-run that grep after writing the CHANGELOG entries.
**Known tool quirk (predecessor Skill Gap, adhoc-RulesRegistry):** `bump-plugin.mjs` inserts the new
stub directly under the H1 in `plugins/nexus-cpp/CHANGELOG.md` (that file has a descriptive
paragraph there) — expect it, and place the real entry below the descriptive line when authoring. Tier: PATCH proposed by the tool; **architect
recommends the owner escalate both to MINOR** (new consumer capability / new guidance section) —
owner's call at release (AC-8). Harness/tests changes (Step 7) are dev-repo files — no bump driver.
gen-omni twin sync rides the close-out commit per CLAUDE.md.
Satisfies: AC-8.

## Cross-Service Changes

None.

## Migration Notes

None — no consuming-repo migration in this slice (the Flutter registry migration note shipped in
`adhoc-RulesRegistry` and stands).

## Testing Strategy

- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (the repo's documented CI form,
  kb-distill.test.mjs:9) — suite green after the Step-7 rebase (the only executable surface in this
  slice). **Baseline correction (post-review, Step-2 LOW-2):** the originally cited "458 pass" was
  the plan-critic's run of `tests/unit/*.test.mjs` ONLY; the pinned CI form adds `tests/lint/`
  (exactly 47 tests, measured), so its true baseline is **505 pass / 0 fail** — confirmed by the
  reviewer's clean-HEAD reproduction. A count is valid only for the exact command that produced it.
- Text-artifact verification is the Step-9 grep sweep (mechanism-named, no judgment greps).

## KB Impact

None — this repo's `docs/kb/` is untouched; the slice edits shipped rules *about* registries and KB
navigation, not KB entries.

## Decisions

| Decision | Why | Rejected alternative | Status |
|----------|-----|---------------------|--------|
| Hook/rider wording pinned in the plan | AC-1's positive grep needs a deterministic phrase ("has a registry at") | Leave wording to developer — makes the done-check judgmental | decided |
| Skeptic = read-only `general-purpose` subagent | Matches the ADR-21 boundary (no pipeline-role nesting) and the options-panel precedent | A dedicated skeptic agent type — heavier, not needed for v1 | decided |
| Harness area handling: optional arg + single-area fallback (`docs/business-rules/<unit>.md`) | Contract R1 explicitly permits omitting `<area>` in single-area repos; keeps existing invocations working | Mandatory area arg — breaks current callers | decided |
| Rider placement within reviewer.md's two named sections | Exact position is layout, not contract | — | deferred (developer) |

## Open Questions

None — all judgment calls were resolved at ratification (proposal Resolutions 1–5) or disclosed
above.

## Plan Review

Code-grounded critic pass, 2026-07-09 (fresh context; the pinned acceptance commands were executed,
not just read). Verdict: **REVISE** → all findings folded, plan approved. The critic also confirmed:
the 12-line Step-7 baseline matches the live grep byte-for-byte, the AC-1 baseline is exactly the 6
enumerated hits, all U1–U6 / AC-1..AC-8 are covered, plan hygiene passes (Decisions non-silent,
every `Satisfies:` real), suite baseline green (458 pass / 0 fail).

| Finding | Severity | Disposition |
|---------|----------|-------------|
| MED-1 — `node --test tests/unit/` errors MODULE_NOT_FOUND on Node v24 (false RED on a green suite) | MED | Fixed — repo CI glob form pinned in Step 7, Step 9, Testing Strategy + tech-spec AC-7 |
| MED-2 — positive `docs/business-rules` grep was separator-sensitive vs the file's backslash composition style | MED | Fixed — positive grep made separator-agnostic, mirroring the negative gate; separator style left to the developer |
| LOW-3 — heading casing drift (plan `## Repo Grounding Contract` vs spec lowercase) | LOW | Fixed — tech-spec U4/AC-5 aligned to Title Case (kb-navigation.md house style) |
| LOW-4 — positive command/rider content had no dedicated grep | LOW | Fixed — Step 9 adds the 4-command positive grep + rider grep |
| GAP — predecessor `bump-plugin.mjs` CHANGELOG-stub quirk (nexus-cpp) not flagged to the developer | LOW | Fixed — Step 10 heads-up note added |
