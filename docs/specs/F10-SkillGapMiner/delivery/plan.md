# F10-SkillGapMiner — Implementation Plan

**Feature Spec:** `docs/specs/F10-SkillGapMiner/definition/tech-spec.md` (Status: Ready; ADR-63
extracted)
**Slug:** `F10-SkillGapMiner`
**Intent class:** Scoped (1 new shipped skill + a 7-sibling membership sweep + 2 fixture runs + one
MINOR release)
**Release tier:** MINOR (tech-spec pins it — new capability: a new shipped skill)
**Baseline at plan time:** nexus **1.35.0** (F7 shipped, commit `0898f75`); tree clean except this
feature's own docs edits.

## Context

The ratified proposal (`docs/proposals/skill-gap-miner-2026-07.md`) ships `mine-skill-gaps`, the
ninth mine: sweep a repo's `docs/specs/*/delivery/` estate for cross-plan `(none)` clusters
(Tier B) plus pre-flagged ADR-59 records (Tier A), skeptic-verify, and emit an owner-triaged
candidate registry. All greps below were executed at plan time (2026-07-18, post-F7 tree).

## Scope

**In scope:** the skill (S1–S4 of the tech-spec), the family membership sweep, the two fixture
runs (acceptance run gates), one MINOR bump.
**Explicitly out of scope:** building any discovered candidate skill (owner triage first); cross-repo
merge machinery; implementation.md/review.md mining (re-entry condition in the tech-spec);
learner/lessons-format/plan-template changes (no shipped surface outside the skill + family sweep);
`## Routing boundary` in the family core — DO NOT TOUCH (design↔algorithm only).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow (New-Skill recipe, dev-repo carve-out) | no* | Skill name, body content = tech-spec S1–S4; see step | |
| 2 | (none) | — | no | Exact sweep list below (13 grep-verified lines) | — (prose count-sweep; no covering skill) |
| 3 | mine-skill-gaps | Follow-by-Read (pre-sanctioned — see D2) | no | Fixture targets + output paths below | |
| 4 | release-plugin | Follow | no | MINOR; once after steps 1–3; no gen-commands regen | |

\* Step 1 is prose; **if** the optional parser script ships (D3), that sub-scope is `TDD: yes` —
the developer invokes the `tdd` skill for it and homes the test in `tests/unit/`.

## Implementation Steps

### Step 1 — Author the `mine-skill-gaps` skill

`Satisfies:` tech-spec S1 (two-tier discover), S2 (skeptic verify), S3 (registry), S4 (routing),
Family membership §Execution topology. **Follow improve-skills** — the New-Skill recipe under the
dev-repo carve-out (author directly in `plugins/nexus/skills/mine-skill-gaps/`, full recipe
including the Judgment Gate).

Feature-specific inputs the recipe can't know:
- **Name:** `mine-skill-gaps`. Frontmatter description must carry the "Use when" triggers (a repo's
  delivery estate needs a skill-gap sweep; recurring `(none)` rows suspected) and the family
  boundary line (not a debt mine / class miner / spec miner — mirror the sibling descriptions).
- **Body content source:** tech-spec S1–S4 verbatim semantics — Tier A candidate-of-record rule
  (lessons entry counts; `gap:` cells corroborate only; orphan cells = capture-leak findings),
  Tier B task-shape clustering at 3+ plans, fresh-context skeptic (MUST be a subagent), the S3
  registry template (ALL fields: name · kind · recurrence N rows / M plans · citations · repo ·
  skeptic excerpt · `last_verified` · status incl. `superseded`; append-only changelog rule;
  recurrence ranking, plan count first), S4 owner-triage routing (the skill RECOMMENDS
  improve-skills routing; it never invokes it).
- **Shipped-text self-containment:** no dev-repo document references (no proposal/tech-spec/ADR
  pointers as load-bearing definitions) — the registry template and tier rules live in the skill.
- Parser: developer's call per D3 (prose recipe vs bundled script per ADR-62 — F7 just landed the
  in-place script precedent in mine-verify-cover).

**Accept:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs
plugins/nexus/skills/mine-skill-gaps` exits 0 (path verified at plan time); Judgment Gate run
(evaluate-skill invoked, CRITICAL/HIGH resolved or waived with reason — record in
implementation.md); `grep -c "improve-skills" plugins/nexus/skills/mine-skill-gaps/SKILL.md`
hits are recommendation-phrased only (no invocation instruction — read the hits); the registry
template names all 8 S3 fields (grep each field name in the skill folder) AND carries the
append-only changelog rule (grep `changelog` in the skill folder ≥ 1 hit in the template section).

### Step 2 — Family membership sweep (nine members)

`Satisfies:` tech-spec Family membership. In
`plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`: line 3 "eight-member" →
"nine-member" **AND the member enumeration on lines 3-4 gains the ninth name with a shape-only
annotation** — append to the parenthetical: ``…`mine-verify-flows`, and `mine-skill-gaps`
(name-and-shape member; does not adopt the shared method contract)`` — a bare count bump would
leave "nine-member" over an eight-item list, and a bare name-append would mis-imply full-contract
adoption (the acceptance grep cannot catch either); §The mine family table gains the 9th row —
`` `mine-skill-gaps` | one repo's delivery-artifact estate | plan/lessons artifact text | skeptic re-read + citation resolution | `docs/skill-gaps/registry.md` in the consuming repo `` ;
line 22 "all eight" → "all nine". **DO NOT TOUCH** `## Routing boundary`.

Sibling sweep — exactly the plan-time grep hits (`eight-member|all eight|8-row` over `plugins/`,
13 lines / 7 files, re-verified post-F7):
`mine-reference-model/SKILL.md:28,29,221` · `mine-design/SKILL.md:25,27` ·
`mine-algorithm/SKILL.md:26,28` · `mine-verify-flows/SKILL.md:16` ·
`mine-verify-cover/SKILL.md:473` · `mine-verify-repo/SKILL.md:27,276` · family-core `:3,22`.
Update each count token (`8-row`→`9-row`, `all eight`→`all nine`); leave surrounding invariant
prose intact.

**Accept:** the same grep (`eight-member|all eight|8-row` over `plugins/`) returns **0 hits**
(plan-time: 13); family-core §The mine family contains the `mine-skill-gaps` row; full offline
suite green (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`).

### Step 3 — Fixture runs (the tech-spec's two run gates)

`Satisfies:` tech-spec Acceptance §Run gates. **Follow mine-skill-gaps by-Read** (D2): the new
skill is not in the installed 1.35.0 cache, so read
`plugins/nexus/skills/mine-skill-gaps/SKILL.md` from the working tree and execute it as written —
log the Read-channel deviation in implementation.md.

- **Tier A — this repo:** run over `D:\src\claude-plugins\nexus\docs\specs\` → emit to
  `docs/specs/F10-SkillGapMiner/delivery/fixtures/nexus-registry.md`. Accept: fielded
  `## Skill Gaps` entries appear as candidates-of-record; `gap:` cells corroborate only; zero
  double-counts (one row per candidate).
- **Tier B — KG golden fixture:** run over `d:\src\knowledge-gateway\docs\specs\` (66 top-level
  plans at plan time; include nested epic/issue paths) → emit to
  `docs/specs/F10-SkillGapMiner/delivery/fixtures/kg-registry.md`. **KG is read-only input — write
  nothing into that repo** (D1). Use Read/Glob/Grep or PowerShell for the KG tree — sandboxed Bash
  can fabricate external-repo listings (recorded incident class). Accept: the two author-named
  clusters re-found **by name** (orchestrator decorator/state wiring; raw-Npgsql persistence);
  ≥ 4 total clusters at the 3+ threshold; spot-check ≥ 3 rows' citations against the cited KG plans.
- The S2 skeptic runs as a **fresh-context `general-purpose` subagent** in both runs (D4) — its
  excerpts land in the fixture registry rows.

### Step 4 — Release: one MINOR bump

`Satisfies:` tech-spec Target line ("one release-plugin bump at close (**MINOR** — new
capability)"). **Follow release-plugin.**
Inputs: shipped edits = the new skill folder + `mine-family-core.md` + the 7 sibling SKILL.md
files → one **MINOR** bump of `nexus`, run **once after steps 1–3**, never per-step. No agent
files change → no `gen-commands` regen. Check the dry-run's reasons list names **only F10 files**
— the tree was clean at plan time (post-`0898f75`); if a reason names anything else, stop and
escalate (concurrent-tree rule).

**Accept:** `node scripts/bump-plugin.mjs --dry-run` proposes a bump for `nexus` citing only F10
shipped files; `--minor` applied; full suite green. (Omni twin sync + the single fast-lane commit
happen at close, in the main session — not the developer's step; the developer runs **no git
writes**.)

## Testing Strategy

Verification is the lint + Judgment Gate (step 1), the deterministic sweep grep + offline suite
(step 2), and the two live fixture runs (step 3) — the fixture runs ARE the end-to-end exercise,
so this plan has no operator-owed live arm. **What a PASS does not prove:** consumer-repo
behavior through the installed cache (the Skill-tool invocation path) — that lands with the
release and is verified on the next consuming-repo run.

## KB Impact

None (dev-repo; no `docs/kb/` surface).

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|---|---|---|---|
| D1 | Fixture registries land in `delivery/fixtures/` here; KG is read-only input | Cross-repo write into a live concurrent repo is the recorded hazard class; the gate needs the artifact, not its location | Emit `docs/skill-gaps/registry.md` inside KG (the real consumer path) — operator can do that later as the true pilot | decided |
| D2 | Step 3 is Follow-by-Read (working-tree SKILL.md), logged as a Read-channel deviation | The new skill cannot be Skill-tool-invoked from the 1.35.0 cache; the done-check treats a documented Read-channel deviation as a valid pass | Defer fixture runs until post-release (breaks ship-complete: the gates must run before the bump ships) | decided |
| D3 | Parser ships as prose recipe OR bundled ADR-62 script — developer's call; a script gets a `tests/unit/` test | Tech-spec grants the latitude; F7 landed the in-place script precedent same-week | Plan-pinning either form (over-specification of developer-owned decomposition) | decided |
| D4 | The fixture-run skeptic is a fresh-context `general-purpose` subagent | Clean-room posture the tech-spec mandates; not a pipeline role, so no ADR-21 surface | In-context skeptic (self-verification — the invented-virtue failure mode) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2, 2026-07-18): **GO-with-fixes** — 0 CRITICAL/HIGH, 1 MEDIUM, 3 LOW,
all folded:

- **M1 (folded):** the family-core line-3 member enumeration (8 items) would contradict a bare
  "nine-member" token swap, and a bare name-append would mis-imply full-contract adoption — Step 2
  now specifies the shape-only annotated append; neither failure is catchable by the acceptance
  grep, hence the explicit instruction.
- **L1 (folded):** sweep tally corrected to 13 lines / **7** files.
- **L2 (folded):** Step-1 Accept gains the append-only-changelog grep the tech-spec enumerates.
- **L3 (folded):** Step-4 `Satisfies:` now cites the concrete Target line.

All other anchors verified live by the critic post-F7: the 13-line sweep list exact (broadened
grep proved it exhaustive — the extras are `w-eight` false positives), `skill-lint.mjs`
path-agnostic (runnable against `plugins/`), `--minor` supported (`bump-plugin.mjs:51`),
no-agent-files → no-regen holds, `docs/skill-gaps/` collision-free, Tier-A input non-vacuous
(~30 fielded `## Skill Gaps` entries in this repo), KG top-level plan count 66 exact, and the D4
skeptic spawn sanctioned by ADR-21 (general-purpose research spawns are out of its scope).
