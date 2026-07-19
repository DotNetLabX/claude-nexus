# F15-SkillCandidateMiner — Implementation Plan

**Feature Spec:** `docs/specs/F15-SkillCandidateMiner/definition/tech-spec.md` (Status: Ready;
code-grounded critic GO-with-fixes folded 2026-07-19; ADR-65 owed at close)
**Slug:** `F15-SkillCandidateMiner`
**Intent class:** Scoped (1 new shipped skill + the `mine-skill-gaps` schema extension + an
8-file family sweep + 1 fixture run + one MINOR release)
**Release tier:** MINOR (tech-spec pins it — new capability: a new shipped skill)
**Baseline at plan time:** nexus **1.36.1** (HEAD `eb870b9`); tree **DIRTY with non-F15 files**
(nexus-analytics plugin edits + F3-AnalyticsBorrowWave docs, per session-start status) — the
step-5 concurrent-tree guard is live, not theoretical.

## Context

The tech-spec ships `mine-skill-candidates`, the **tenth mine** — the supply-side complement to
`mine-skill-gaps`: two lenses over one repo's code + git history (Lens A co-change, Lens B
structural recurrence), a fresh-context skeptic + debt health gate, dual output (skill candidates
AND an anti-pattern list) into the existing `docs/skill-gaps/registry.md` species. Consumer:
`omnivision-ai-sdk` F2-SdkRewrite P3. All greps and external-repo checks below were executed at
plan time (2026-07-19; SDK checks via PowerShell — sandboxed Bash fabricates external-repo
listings, recorded incident class).

## Scope

**In scope:** the skill (tech-spec S1–S4), the `mine-skill-gaps` canonical-schema extension, the
family membership sweep (nine → ten), the SDK golden-fixture run (the run gate), one MINOR bump.
**Explicitly out of scope:** building/fixing any discovered skill (owner triage first);
class dispositioning / coverage census; business-rule mining; learner changes; cross-repo merge
machinery (all recorded tech-spec non-goals); `## Routing boundary` in the family core — DO NOT
TOUCH (design↔algorithm only); any write into the SDK repo (D1).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow (New-Skill recipe, dev-repo carve-out) | no* | Skill name, body content = tech-spec S1–S4; see step | |
| 2 | (none) | — | no | Schema-owner deltas; exact anchors below | — (prose format extension; no covering skill) |
| 3 | (none) | — | no | Exact sweep list below (13 grep-verified lines) | — (prose count-sweep; no covering skill) |
| 4 | mine-skill-candidates | Follow-by-Read (pre-sanctioned — D2) | no | Fixture target + output path below | |
| 5 | release-plugin | Follow (dry-run verification only; apply at Close — D7) | no | MINOR; concurrent-tree guard | |

\* Step 1 is prose; **if** the optional lens-parser script ships (D3), that sub-scope is
`TDD: yes` — the developer invokes the `tdd` skill for it and homes the test in `tests/unit/`.

## Implementation Steps

### Step 1 — Author the `mine-skill-candidates` skill

`Satisfies:` tech-spec S1 (two lenses + seed join), S2 (skeptic + health gate), S3 (emit,
deltas-only), S4 (owner-triaged routing), Family membership §Execution topology.
**Follow improve-skills** — the New-Skill recipe under the dev-repo carve-out (author directly in
`plugins/nexus/skills/mine-skill-candidates/`, full recipe including the Judgment Gate).

Feature-specific inputs the recipe can't know:
- **Name:** `mine-skill-candidates`. Frontmatter description carries the "Use when" triggers (a
  repo's code + git history needs a pattern sweep; thin delivery estate makes `mine-skill-gaps`
  near-zero; an anti-pattern / do-not-regenerate list is needed for a rewrite lane) and the family
  boundary line (not an artifact-estate mine / debt mine / class miner — mirror the sibling
  descriptions).
- **Body content = tech-spec S1–S4 verbatim semantics:**
  - S1 Lens A: bot-filtered `git log` + Code Maat coupling over a **declared window**; a file-set
    recurring across **≥3 capability-adding commits** is a candidate; carries inferred name +
    commit citations + file-set. Lens B: **≥3 units** instantiating the same member/signature
    skeleton; `graphify-out/` is an accelerator when present, name/signature clustering
    (grep/ctags tier) the fallback — **never a prerequisite**; carries inferred name + `file:line`
    instance citations + shared skeleton. Both lenses are cheap collectors — clustering judgment
    stays model-tier. **Seed join:** an architecture-doc Gaps table joins as pre-named candidates;
    the lenses corroborate or challenge, never re-discover; an uncorroborated seed survives only
    as a row marked `uncorroborated` and **never counts toward the run gate**.
  - S2: fresh-context skeptic (**MUST be a subagent**) re-reads each candidate's cited evidence;
    then the health gate — cross-check surviving candidates against the swept repo's
    `docs/tech-debt/` registry and reference model (when present); recurring ∩ debt-implicated →
    anti-pattern list; no signal either way → pass with `unopposed` recorded. Every surviving row
    carries the skeptic's excerpt.
  - S3: emit into the swept repo's `docs/skill-gaps/registry.md`. **This skill points at
    `mine-skill-gaps` as the canonical schema owner and owns ONLY its deltas:** the `code` source
    value and the `## Anti-patterns (do-not-propagate)` section (rows cite their instances AND the
    implicating tech-debt row). Never mirror the full schema into this skill. Carried invariants
    (state as pointers to the owner where they're defined): one canonical set, per-row
    `last_verified`, append-only changelog, delta-keyed refresh, kills mark `superseded`.
    Code-row citations must resolve: commit SHAs exist, `file:line` at the cited revision.
  - S4: owner triages `candidate → confirmed`; confirmed rows route to improve-skills' New-Skill
    recipe **named as the route target only — the skill never invokes it**, never builds skills,
    never edits code. Anti-pattern rows are evidence handed to the consuming repo's design
    artifacts, never auto-applied.
- **Family-core pointer:** the standard sibling boilerplate (points at
  `../mine-verify-cover/references/mine-family-core.md` §The mine family), plus the disclosed
  topology latitude: single-session run; the family's full staged-orchestration mandate not
  adopted (shape-not-contract).
- **Shipped-text self-containment:** no dev-repo document references as load-bearing definitions
  (no tech-spec/ADR/backlog pointers) — deltas live in the skill, schema lives in
  `mine-skill-gaps`.
- **String ban:** the new skill names itself the **tenth** mine and must not contain the string
  `ninth mine` anywhere (the tech-spec's own prose calls the sibling "the ninth mine" — echoing
  it would break the step-3 positive-control grep (b), which requires exactly one hit).
- Lens-parser: developer's call per D3 (prose recipe vs bundled ADR-62 script; the Code Maat
  command posture is anchored in `mine-verify-repo/SKILL.md:49` — the metric-layer runbook).

**Accept:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs
plugins/nexus/skills/mine-skill-candidates` exits 0 (lint path verified at plan time); Judgment
Gate run (evaluate-skill invoked, CRITICAL/HIGH resolved or waived with reason — recorded in
implementation.md); read-verify: every improve-skills mention in the new SKILL.md is
recommendation-phrased (route target, no invocation instruction); the anti-patterns section
template lives HERE (grep `Anti-patterns (do-not-propagate)` in the new skill folder ≥ 1 hit) and
the full 9-column schema does NOT (grep `| name | kind | source |` in the new skill folder = 0
hits — pointer only, owner keeps the header).

### Step 2 — Extend `mine-skill-gaps` (canonical schema owner)

`Satisfies:` tech-spec S3 (schema ownership + `source` field). Modify
`plugins/nexus/skills/mine-skill-gaps/SKILL.md` only — single-file skill, verified at plan time:
- **Registry header** (currently `SKILL.md:100`, 8 columns): `source` inserted **immediately
  after `kind`** → `| name | kind | source | recurrence | citations | repo | skeptic excerpt |
  last_verified | status |` — the full 9-column header stated once, here.
- **Field definitions** (the field-bullet block, `:105–117` — name `:105`, kind `:106`, …,
  status `:117`): add a `source` bullet **immediately after the `kind` bullet** (mirror the
  header's column order) — values `artifact | code`; optional-with-default `artifact` (existing
  rows are `artifact` by definition — backward compatible); this skill stamps `source: artifact`
  on its own rows.
- **Cross-corroboration merge rule:** a candidate found by both miners merges into ONE
  strengthened row citing both evidence classes (strengthen-don't-duplicate, the family
  invariant).
- **Anti-patterns cross-reference:** one pointer sentence — the `## Anti-patterns
  (do-not-propagate)` section is emitted and owned by `mine-skill-candidates` (sibling); do NOT
  mirror its template here.
- **Sibling cross-reference on the "ninth mine" line** (currently `:20`): the line keeps its own
  ordinal ("ninth mine" — it names the skill's ordinal, not the family size; it is the acceptance
  positive control) and gains the pointer to `mine-skill-candidates` as the code-side sibling.

**Accept:** grep `\| name \| kind \| source \|` in `mine-skill-gaps/SKILL.md` ≥ 1 hit; grep
`artifact \| code` ≥ 1 hit; grep `mine-skill-candidates` in `mine-skill-gaps/SKILL.md` ≥ 1 hit;
acceptance grep (b) below still returns exactly the one `ninth mine` line in this file.

### Step 3 — Family membership sweep (nine → ten)

`Satisfies:` tech-spec Family membership. In
`plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`: line 3 "nine-member" →
"ten-member"; the member enumeration (lines 3–4 parenthetical) gains `mine-skill-candidates` with
the same shape-only annotation style as `mine-skill-gaps` (name-and-shape member; does not adopt
the shared method contract); §The mine family table gains the 10th row —
`` `mine-skill-candidates` | one repo's code + git history | commit history + code structure | skeptic re-execution + debt health gate over resolving citations | skill candidates + anti-pattern rows in `docs/skill-gaps/registry.md` ``;
line 23 "all nine" → "all ten". **DO NOT TOUCH** `## Routing boundary`.

Sibling sweep — exactly the plan-time grep hits (`nine-member|all nine|9-row` over
`plugins/nexus/skills`, **13 lines / 7 files**, executed 2026-07-19):
`mine-design/SKILL.md:25,27` · `mine-reference-model/SKILL.md:28,29,221` ·
`mine-verify-flows/SKILL.md:16` · `mine-verify-repo/SKILL.md:27,276` ·
`mine-verify-cover/SKILL.md:473` · `mine-algorithm/SKILL.md:26,28` · family-core `:3,23`.
Update each count token (`9-row`→`10-row`, `all nine`→`all ten`, `nine-member`→`ten-member`);
leave surrounding invariant prose intact. **DO NOT TOUCH** `mine-design/SKILL.md` "nine fixed
causes" (`:93,182` at plan time) — unrelated homonym, and it does not match the acceptance grep.

**Accept (the tech-spec's two greps, expected results written from the plan-time run):**
(a) `grep -rnE 'nine-member|all nine|9-row' plugins/nexus/skills` → **0 hits** (plan-time: 13);
(b) `grep -rn 'ninth mine' plugins/nexus/skills` → **exactly one hit, in
`mine-skill-gaps/SKILL.md`** (positive control — the sibling's own ordinal survives; content
anchor, not line-pinned: step 2's edit above it may shift the line number); family-core §The mine
family contains the `mine-skill-candidates` row; full offline suite green
(`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`).

### Step 4 — Golden-fixture run on `omnivision-ai-sdk` (the run gate)

`Satisfies:` tech-spec Acceptance §Run gate. **Follow mine-skill-candidates by-Read** (D2): the
new skill is not in the installed 1.36.1 cache — read
`plugins/nexus/skills/mine-skill-candidates/SKILL.md` from the working tree and execute it as
written; log the Read-channel deviation in implementation.md.

- **Target:** `D:\omnishelf\omnivision-ai-sdk` (git repo + `graphify-out/` present, verified at
  plan time). **The SDK is read-only input — write NOTHING into it** (D1). Emit to
  `docs/specs/F15-SkillCandidateMiner/delivery/fixtures/sdk-registry.md`. Use PowerShell or
  `git -C` for all SDK filesystem/history facts — never sandboxed Bash.
- **Seed join:** the 7 hand-named Gaps-table recipes (`docs/architecture/index.md:197–202` +
  `create-conventions-doc`; table verified at plan time) join as pre-named candidates.
- **Lens A window:** developer's call at run time (D6); declare it in the fixture registry
  header. Code Maat per the `mine-verify-repo` runbook; **pre-authored fallback (D5):** if Code
  Maat is unavailable at run time, compute pairwise co-change from `git log --numstat` directly
  and declare the substitution in the run report — a fired fallback is `Deviated (valid reason)`,
  not Missing.
- **S2 skeptic:** a fresh-context `general-purpose` subagent (D4) — its excerpts land in the
  fixture registry rows. Lens collection inline or as `general-purpose` subagents (tech-spec
  latitude). All subagent dispatches carry an explicit `model: sonnet` (D4).

**Accept (from the tech-spec, verbatim):** ≥3 of the 7 seeded recipes corroborated **with
lens-produced citations** (Lens A commit SHAs or Lens B `file:line` — never the seed's own
Gaps-table file-list; uncorroborated seeds are marked and do not count); spot-check ≥3 counted
rows' citations resolve (SHAs exist in SDK history; `file:line` exists at the cited revision);
**≥1 anti-pattern row** — expected: the near-duplicate KPI-block shape citing tech-debt **COR-4**
(`docs/tech-debt/core-root.md:54`, "3 near-dup blocks", verified at plan time), or another
recurring-shape ∩ debt-row intersection named in the run report — whose implicating citation
resolves against the SDK's tech-debt registry.

### Step 5 — Release verification: dry-run only (bump applies at Close — D7)

`Satisfies:` tech-spec Target line ("one release-plugin bump at close (**MINOR** — new
capability)"). **Follow release-plugin** — verification posture only: run
`node scripts/bump-plugin.mjs --dry-run`, record its classification of the F15 shipped files
(new skill folder + `mine-skill-gaps/SKILL.md` + `mine-family-core.md` + the 6 sibling SKILL.md
files) and the proposed CHANGELOG bullets in implementation.md. **Do NOT apply the bump** — the
tree carries non-F15 dirt (nexus-analytics plugin edits from the concurrent F3 feature), so an
unscoped apply would clobber that plugin's version; application happens once, at Close, via the
`--staged` path (D7). Expected dry-run output: F15 files classified MINOR-eligible for `nexus`;
nexus-analytics contamination present in the reasons — that is the concurrent tree, not an error;
record it, don't act on it. No agent files change → no `gen-commands` regen.

**Accept:** dry-run output recorded in implementation.md; F15 shipped files present in the
reasons; `plugins/nexus/.claude-plugin/plugin.json` version **unchanged** (no apply); full
offline suite green. (The developer runs **no git writes of any kind**.)

## Close (main session — architect-led fast lane; recorded here, not developer steps)

Ordered, after the done-check and review pass: (1) `summary.md` (`Mode: architect-led fast
lane`) + lessons; (2) **ADR-65** extracted into `docs/architecture/README.md` (tenth member +
registry-species extension; ADR-63 is the precedent; register re-checked at plan time — highest
is ADR-64, 65 free); (3) stage **only F15 files** → `node scripts/bump-plugin.mjs --staged
--dry-run` (reasons must name only F15 files) → `--staged --minor` → stage the bump → single
closure commit. **The bump is applied exactly once, here — Step 5 never applies it and Close
never re-runs an already-applied bump** (`--staged` support verified at plan time:
`bump-plugin.mjs:16,38,48,90-97`); (4) omni twin regen (`scripts/gen-omni.mjs` with the twin
path `D:\omnishelf\claude-omni` as arg 1) + mirrored commit in the twin repo — after the nexus
commit, so the footer pins the final sha.

## Testing Strategy

Verification is the lint + Judgment Gate (step 1), the deterministic schema/sweep greps (steps
2–3) + offline suite, and the live SDK fixture run (step 4) — the fixture run IS the end-to-end
exercise, so this plan has no operator-owed live arm. **What a PASS does not prove:**
consumer-repo behavior through the installed cache (the Skill-tool invocation path — lands with
the release), and the true-pilot write of a real registry inside the SDK (the operator's F2-P3
intake move, deliberately out of scope per D1).

## KB Impact

None (dev-repo; no `docs/kb/` surface).

## Decisions

| # | Decision | Why | Rejected alternative | Status |
|---|---|---|---|---|
| D1 | SDK is read-only input; fixture registry lands in `delivery/fixtures/sdk-registry.md` here | Cross-repo write into a live repo is the recorded hazard class; the gate needs the artifact, not its location — mirrors F10 D1 | Emit `docs/skill-gaps/registry.md` inside the SDK (the real consumer path) — operator does that later as the F2-P3 true pilot | decided |
| D2 | Step 4 is Follow-by-Read (working-tree SKILL.md), logged as a Read-channel deviation | The new skill cannot be Skill-tool-invoked from the 1.36.1 cache; a documented Read-channel deviation is a valid pass — mirrors F10 D2 | Defer the fixture run until post-release (breaks ship-complete: the gate must run before the bump ships) | decided |
| D3 | Lens-parser ships as prose recipe OR bundled ADR-62 script — developer's call; a script gets a `tests/unit/` test | Tech-spec grants the latitude; F7 landed the in-place script precedent | Plan-pinning either form (over-specifies developer-owned decomposition) | deferred |
| D4 | Skeptic + lens collectors = fresh-context `general-purpose` subagents with explicit `model: sonnet` | Clean-room posture the tech-spec mandates; ADR-21 sanctions general-purpose research spawns (F10 precedent); explicit-model dispatch is the recorded spend rule | In-context skeptic (self-verification failure mode); default-model dispatch | decided |
| D5 | Pre-authored Code Maat fallback: pairwise co-change from `git log --numstat`, declared in the run report | Code Maat is a run-time external (jar); a pre-authored fallback resolves as `Deviated (valid reason)` in one line instead of a mid-run dead-end | No fallback (run blocks on tooling) | decided |
| D6 | Lens A window = developer's call at run time, declared in the fixture registry header | Window choice is run-scoped judgment the tech-spec leaves open; declaring it keeps the run reproducible | Plan-pinning a window with no data on SDK history density | deferred |
| D7 | Bump applies at Close via `--staged --minor` over F15-only staged files; Step 5 is dry-run verification only | The tree is dirty with the concurrent F3 feature's nexus-analytics edits — an unscoped apply would raise that plugin's version too; `--staged` scoping (flag verified live) lets F15 close without serializing behind F3, and staging is a git write the fast-lane developer is barred from anyway | Developer applies `--minor` unscoped (clobbers nexus-analytics) or F15 blocks until F3 commits (needless serialization) | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2, 2026-07-19): **GO** — 0 CRITICAL/HIGH/MEDIUM, 2 LOW + 2 advisory
notes, all folded:

- **L1 (folded):** Step-2 field-block anchor corrected `:111–116` → `:105–117` with the
  `source` bullet placed immediately after the `kind` bullet (header order mirrored).
- **L2 (folded):** Step 1 gains the `ninth mine` string ban — the tech-spec's own prose names the
  sibling "the ninth mine"; echoing it into the new skill would break positive-control grep (b).
- **Advisory (folded as D7):** bump application moved to Close via `--staged --minor` (flag
  support verified live at `bump-plugin.mjs:16,38,48,90-97`); Step 5 reduced to dry-run
  verification — resolves the concurrent-tree clobber risk and the one-bump ambiguity in one
  move.
- **Gap probes (no defect):** `create-conventions-doc` likely stays `uncorroborated` (doc-recipe,
  no code file-set) — the ≥3/7 gate has margin via the 6 code-shaped recipes; schema ownership
  enforced from both sides by the paired 0-hit/≥1-hit greps; step ordering sound.

All load-bearing anchors verified live by the critic (sweep 13 lines / 7 files exact; positive
control exact; SDK fixture facts exact incl. COR-4 = the KPI-block near-dup and the 7 Gaps
recipes at `index.md:197–203`; skill-lint + Judgment Gate + offline-suite globs + `--minor` +
ADR-64-highest all confirmed).
