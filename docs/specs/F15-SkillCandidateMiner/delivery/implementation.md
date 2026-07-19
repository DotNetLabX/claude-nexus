# F15-SkillCandidateMiner — Implementation

**Mode:** Architect-led fast lane (spawned by the standalone architect; architect runs the Step 1
done-check and closes the pipeline). Developer performed **no git writes of any kind** — read-only
git only, per the dispatch's hard rule.

## Files Created

- `plugins/nexus/skills/mine-skill-candidates/SKILL.md` — the new tenth mine: a code + git-history
  pattern miner (Lens A co-change, Lens B structural recurrence, hand-authored seed join), the
  supply-side complement to `mine-skill-gaps`. Emits skill candidates plus an
  `## Anti-patterns (do-not-propagate)` section into the swept repo's `docs/skill-gaps/registry.md`.
- `docs/specs/F15-SkillCandidateMiner/delivery/fixtures/sdk-registry.md` — the golden-fixture run
  output against `D:\omnishelf\omnivision-ai-sdk` (Step 4): the run header (window, tooling
  fallback, bot filter, skeptic disclosure), the seed-join table, 7 skill-candidate rows, 1
  anti-pattern row, and the run report evidencing every accept criterion.
- `docs/specs/F15-SkillCandidateMiner/delivery/lessons.md` — developer lessons (no skill gaps
  found this pass).
- `docs/specs/F15-SkillCandidateMiner/delivery/implementation.md` — this file.

## Files Modified

- `plugins/nexus/skills/mine-skill-gaps/SKILL.md` (Step 2, schema-owner extension) — inserted the
  `source` column immediately after `kind` in the 9-column registry header (+ separator + example
  row), added the `source` field-bullet (values `artifact | code`, optional-with-default
  `artifact`, merged-row value `code+artifact`), added the cross-corroboration merge-rule sentence,
  added the `## Anti-patterns cross-reference` pointer paragraph (owns nothing, points at the
  sibling), and added a sibling cross-reference on the "ninth mine" intro line pointing at
  `mine-skill-candidates` as the code-side counterpart.
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` (Step 3) —
  `nine-member` → `ten-member`; the member-enumeration parenthetical gains `mine-skill-candidates`
  alongside `mine-skill-gaps` as the two name-and-shape members; the `§The mine family` table gains
  the 10th row; `all nine` → `all ten`. `## Routing boundary` untouched, as instructed.
- `plugins/nexus/skills/mine-design/SKILL.md`, `mine-reference-model/SKILL.md`,
  `mine-verify-flows/SKILL.md`, `mine-verify-repo/SKILL.md`, `mine-verify-cover/SKILL.md` (Step 3,
  sibling sweep) — each sibling's `9-row`/`all nine` family-table pointer updated to `10-row`/
  `all ten`; `mine-verify-cover/SKILL.md`'s sibling list additionally gains `mine-skill-candidates`
  by name. `mine-design`'s unrelated "nine fixed causes" (branch-taxonomy homonym) left untouched,
  as instructed.

## Key Decisions

- **D3 resolved: prose-only lens-parser, no bundled script.** The tech-spec left the lens-parser
  form as the developer's call. Chose prose recipe (pointing Lens A at
  `mine-verify-repo/references/metric-layer.md` for the git/Code Maat runbook, Lens B at a
  grep/ctags fallback) over a bundled ADR-62 script — mirrors `mine-skill-gaps`' own light-footprint
  precedent and avoids committing to `tests/unit/` maintenance scope the tech-spec didn't require
  for v1. Two-way door; a future run can still add a script if a target repo's history proves
  uniform enough to make one cheaper than the prose read.
- **D6 resolved: Lens A window = full history.** Declared `2022-09-21` (first commit) through
  `2026-07-19` (HEAD) — 1192 commits. The SDK repo is small enough (1192 commits total) that a
  full-history scan is cheap and maximizes recurrence signal for the seeded recipes; declared in
  the fixture registry header per the plan's requirement.
- **Anti-pattern substitution (not a plan deviation — the health gate working as designed).** The
  tech-spec's own named example anti-pattern (`COR-4`, near-dup KPI blocks in the old `fromJson`)
  and its stated second candidate (`IFC-4`, 4x duplicate FFI image-ingest blocks) were both found
  **stale** — the SDK repo underwent an active `adhoc-RefactoringPlan` in the days immediately
  before this run that extracted a shared `parseReportKpi` helper (resolving COR-4) and
  consolidated the 4 `newmemcpy` call sites into one `buildPreprocessItem` helper (resolving IFC-4).
  Confirmed independently by the S2 skeptic subagent (0 hits for both patterns' evidence commands
  at HEAD). Substituted `PRC-9` (8x duplicate `bigFrameDetections_` scan-loop in
  `reportProcessor.cpp`, still-live, tech-debt-row-backed) per the tech-spec's own explicit
  allowance ("or another recurring-shape ∩ debt-row intersection named in the run report"). This is
  reported, not silently substituted — see the fixture registry's "Note on the tech-spec's own
  expected citation" for the full evidence trail.
- **Anti-pattern status vocabulary widened (review fix).** The anti-pattern row template's example
  placeholder originally showed only 3 of the 6 status values `mine-skill-gaps` defines
  (`candidate|confirmed|superseded`), while the prose claimed "same...semantics" — a real gap, since
  `rejected` is exactly the value a human triager needs to overturn a health-gate false positive
  without deleting the row. Widened the placeholder and made the inherited-vocabulary claim explicit
  rather than implicit (see Self-Review, Finding 2).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | First pass: `evaluate-skill` only (via a fresh-context `general-purpose` subagent, `model: sonnet`) — the New-Skill recipe itself was applied **from memory**, not via a logged Skill-tool invocation. **Corrected on done-check fix cycle 1:** `improve-skills` invoked via the Skill tool and its checklist re-walked against the already-authored skill. | `skill-lint.mjs` exit 0 (after two description-length trims). Judgment Gate verdict: **ACCEPT-with-fixes** — 6 findings (1 CRITICAL, 2 HIGH, 3 MEDIUM); 4 real and fixed (declared-window pointer that didn't resolve, merge-rule value gap, undefined "capability-adding commit," inconsistent invariant citation); 2 (missing `source` field, stale family count) were correctly-flagged sequencing that Steps 2/3 resolved. The fix-cycle-1 `improve-skills` re-walk surfaced one more real gap the from-memory pass missed: **AP6** (no finalize path on a multi-phase producer) — S3's emit wasn't stated as incremental, so a halted run had no explicit path to keep already-verified rows. Folded: S3 now states rows are written per-candidate as each clears S2, not batched at run end. `skill-lint.mjs` re-run clean after. |
| 2 | (none) | plan-sanctioned — prose schema-owner extension, no covering skill (plan: `Gap? —`). |
| 3 | (none) | plan-sanctioned — prose count-sweep, no covering skill (plan: `Gap? —`). |
| 4 | `mine-skill-candidates` (Follow-by-Read, plan D2) | **Read-channel deviation, plan-sanctioned:** the new skill is not in the installed 1.36.1 plugin cache, so it was executed by reading `plugins/nexus/skills/mine-skill-candidates/SKILL.md` from the working tree rather than a Skill-tool invocation. Additionally dispatched a fresh-context `general-purpose` subagent (`model: sonnet`) as the mandatory S2 skeptic, per the skill's own §Execution topology requirement. |
| 5 | First pass: `node scripts/bump-plugin.mjs --dry-run` run **directly**, not through a logged `release-plugin` Skill-tool invocation. **Corrected on done-check fix cycle 1:** `release-plugin` invoked via the Skill tool; its procedure re-walked (Step 0 precondition — `.claude-plugin/marketplace.json` present, confirmed; Step 1 CLASSIFY — dry-run re-run; Step 2 JUDGMENT — explicitly deferred to Close per plan D7, not applied here). | Re-run dry-run output identical to the first pass: all 8 F15 shipped-file groups present in the `nexus` reasons (new skill + `mine-skill-gaps` + the 6 siblings); `nexus-analytics` contamination present and correctly not acted on (concurrent F3 tree). **No apply** — `plugin.json` version re-confirmed unchanged (`1.36.1`) after the skill-governed re-validation too. |

## Deviations from Plan

- **D2 (plan-sanctioned) — Read-channel for Step 4.** Executed `mine-skill-candidates` by reading
  its working-tree `SKILL.md` rather than a Skill-tool invocation, since the skill does not yet
  exist in the installed 1.36.1 cache. Logged per plan instruction.
- **D5 fallback fired (plan-sanctioned).** `java`/Code Maat unavailable on this machine (`java` not
  on PATH). Used the pre-authored fallback: pairwise file-set co-change computed directly from
  `git log --all --numstat` via a small Node script
  (`C:\Users\dumit\AppData\Local\Temp\claude\...\scratchpad\cochange.mjs`, scratch-only, not part of
  the shipped skill). Declared in the fixture registry as `Deviated (valid reason), not Missing`.
- **Anti-pattern substitution** — see Key Decisions above; reported in the fixture registry's run
  report and here, not a silent swap.
- No other deviations. Steps 1–5 executed as planned; no git writes of any kind performed
  (verified: `git status` shows my changed files as unstaged/untracked only — no staged entries
  from this session).

## Self-Review

**First-round review posture:** the diff is docs-only (skill prose) — the optional D3 lens-parser
script was not shipped (see Key Decisions), so the `/code-review` leg of the dispatch's review
instruction does not apply. Ran the two parallel `general-purpose` finder passes (both
`model: sonnet`, explicit per the dispatch's hard rule) over all 8 changed skill files, one pass
per angle-pair: (A) internal consistency + dangling cross-references, (B) dropped/narrowed
guarantees + directional references + stale adjacent prose.

**Findings and dispositions:**

| # | Severity | Finding | Verified in-context? | Disposition |
|---|----------|---------|----------------------|-------------|
| 1 | HIGH | `mine-skill-gaps/SKILL.md:25` said "see its `source` field **above**" — the `source` field is actually defined at lines 103/110, both *below* line 25, not above. | Yes — grepped the file for `source`, confirmed no earlier occurrence. | **Folded.** Removed the incorrect directional word; both pointers now correctly read as "below." |
| 2 | MEDIUM | Anti-pattern row template's example placeholder showed only `candidate\|confirmed\|superseded` (3 of 6 values) while the prose claimed "same...semantics" as the skill-candidate rows (which carry 6 values including `rejected`). | Yes — cross-checked against `mine-skill-gaps/SKILL.md`'s actual `status` bullet. | **Folded.** Widened the placeholder to include `rejected`; made the inherited-vocabulary claim explicit, with a one-line rationale for why `building`/`built` rarely apply but `rejected` matters (health-gate false-positive override). |
| 3 | MEDIUM | `mine-skill-candidates/SKILL.md`'s seed-join sentence claimed the architecture-doc Gaps table carries "skill-name suggestions with file-lists" as if that were the defined schema — but `create-architecture-doc/references/template.md`'s actual Gaps-table schema (`Gap \| What's Missing \| Suggested Skill Name`) has a free-prose "What's Missing" column, not a guaranteed file-list; the file-list framing only matched this one SDK's specific usage. | Yes — read the template directly. | **Folded.** Reworded to state the generic schema accurately and note that a code-shaped gap *often* fills the column with a file/module list, without claiming that's the contract. |
| 4 | LOW | `mine-reference-model/SKILL.md`'s "Relationship to other skills" table (near the edited "10-row"/"ten members" lines) doesn't list `mine-skill-candidates` as a new consumer, even though the new skill's S2 health gate reads `docs/reference-model.md` when present. | Yes — read the table; it also omits `mine-verify-repo`, a longstanding and more prominent consumer, predating this diff. | **Dismissed.** Pre-existing table sparseness, not a regression this change introduced; outside plan Step 3's scope (which only touches specific count/pointer lines, not Relationship tables). Not folded — flagging here for the record rather than silently dropping it. |

All four findings were independently re-verified against live source before folding or dismissing
(no finding taken on the finder's word alone). Re-ran `skill-lint.mjs` on both edited skills and
the full 3 accept-grep set (nine-count 0-hit, ninth-mine positive control, anti-patterns/schema
greps) after folding — all still pass (see Step evidence below). Full offline suite
(`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`) re-run after the fixes: **587/587
green**.

**Verdict: ACCEPT-with-fixes, fixes folded, ready for the architect's Step 1 done-check.**

## Step-by-Step Evidence

### Step 1 — Author `mine-skill-candidates`

```
$ node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-skill-candidates
OK    mine-skill-candidates
```
Judgment Gate: fresh-context `general-purpose` subagent (`model: sonnet`) ran the `evaluate-skill`
rubric — verdict **ACCEPT-with-fixes**, 6 findings, 4 real and folded (see Key Decisions/Self-Review
above), 2 correctly flagged as sequencing (resolved by Steps 2–3, re-verified below).
```
$ grep -rn "ninth mine" plugins/nexus/skills/mine-skill-candidates/     -> 0 hits (string ban holds)
$ grep -c "Anti-patterns (do-not-propagate)" .../mine-skill-candidates/SKILL.md   -> 3 (template lives here)
$ grep -c "| name | kind | source |" .../mine-skill-candidates/SKILL.md          -> 0 (schema not duplicated)
```

**Fix cycle 1 (skill-conformance correction, per done-check FAIL):** the New-Skill recipe was
originally applied from memory — `improve-skills` never actually ran through the Skill tool, so
`.claude/audit/skill-invocations.log` correctly showed no invocation while `## Skills Used`
incorrectly claimed one. Invoked `improve-skills` for real and re-walked its checklist against the
already-authored `mine-skill-candidates/SKILL.md`: gap verification, authoritative-source grounding
(family precedent + `proven-patterns.md` + `skill-recipe.md`), scaffold shape, born-compliant
frontmatter, "extract don't invent," and skills-index registration (`plugins/nexus/README.md` is a
56-line overview, not a per-skill index — confirmed no row needed, same as every other mine-family
sibling). The re-walk surfaced one real miss: **AP6** (no finalize path on a multi-phase producer)
— S3 didn't state its emit as incremental, so a halted run had no explicit path to keep
already-verified rows. Folded (S3 now states per-candidate incremental writes); `skill-lint.mjs`
re-run clean:
```
$ node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-skill-candidates
OK    mine-skill-candidates
$ grep -c "ninth mine" .../mine-skill-candidates/SKILL.md               -> 0
$ grep -c "Anti-patterns (do-not-propagate)" .../mine-skill-candidates/SKILL.md -> 3
$ grep -c "| name | kind | source |" .../mine-skill-candidates/SKILL.md -> 0
```

### Step 2 — Extend `mine-skill-gaps`

```
$ grep -n "| name | kind | source |" plugins/nexus/skills/mine-skill-gaps/SKILL.md
103:| name | kind | source | recurrence | citations | repo | skeptic excerpt | last_verified | status |
$ grep -n "artifact | code" plugins/nexus/skills/mine-skill-gaps/SKILL.md
110:- **source** — values `artifact | code`. Optional-with-default `artifact`: ...
$ grep -c "mine-skill-candidates" plugins/nexus/skills/mine-skill-gaps/SKILL.md   -> 4
$ grep -n "ninth mine" plugins/nexus/skills/mine-skill-gaps/SKILL.md
20:This is the **ninth mine** — ...
$ node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-skill-gaps
OK    mine-skill-gaps
```

### Step 3 — Family membership sweep

```
$ grep -rnE 'nine-member|all nine|9-row' plugins/nexus/skills
(0 hits — exit 1)
$ grep -rn 'ninth mine' plugins/nexus/skills
plugins/nexus/skills/mine-skill-gaps/SKILL.md:20:This is the **ninth mine** — ... (exactly 1 hit, positive control)
$ grep -n "mine-skill-candidates" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
4:...`mine-skill-gaps`, and `mine-skill-candidates` (the latter two are name-and-shape members...
22:| `mine-skill-candidates` | one repo's code + git history | ... | skill candidates + anti-pattern rows in `docs/skill-gaps/registry.md` |
$ grep -n "nine fixed causes" plugins/nexus/skills/mine-design/SKILL.md    -> untouched, unrelated homonym (verified)
$ grep -n "## Routing boundary" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md  -> present, untouched
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
tests 587 / pass 587 / fail 0
```

### Step 4 — Golden-fixture run on `omnivision-ai-sdk`

Full evidence lives in `docs/specs/F15-SkillCandidateMiner/delivery/fixtures/sdk-registry.md`.
Summary against the tech-spec's verbatim accept criteria:

- **≥3 of 7 seeded recipes corroborated with lens-produced citations:** **6/7** corroborated
  (`add-task-type`, `add-kpi-metric`, `add-config-param`, `add-callback`, `add-compliance-type`,
  `add-action-type` — each with real commit-SHA citations, never the seed's own Gaps-table
  file-list); `create-conventions-doc` correctly stayed `uncorroborated` (doc-shaped recipe, no code
  file-set — anticipated at plan time). **PASS.**
- **Spot-check ≥3 counted rows' citations resolve:** 4 Lens A commits independently re-executed by
  the S2 skeptic subagent via `git -C ... show --stat` (`def61d0`, `3d97b3a`, `178afd1`, `be4c195`)
  — all 4 confirmed (one date correction folded: `3d97b3a` is 2026-05-21, not the initially drafted
  2025-05-21). The Lens B `TaskBase` skeleton citation was independently re-read and confirmed
  across 3 of 4 spot-checked instances. **PASS.**
- **≥1 anti-pattern row whose implicating citation resolves against the SDK's tech-debt registry:**
  `PRC-9` (8x duplicate scan-loop in `reportProcessor.cpp`) — skeptic-reconfirmed exact line match
  against `docs/tech-debt/processors.md`. **PASS.** (The tech-spec's own named example, COR-4, was
  checked and found stale — see Key Decisions.)
- Toolchain: Code Maat/Java unavailable; D5 git-only fallback fired and declared, not silently
  degraded. Nothing written into the SDK repo (D1 upheld — verified via `git -C
  D:\omnishelf\omnivision-ai-sdk status --short` showing no changes before or after the run).

**Run gate: PASS.**

### Step 5 — Release verification (dry-run only)

```
$ node scripts/bump-plugin.mjs --dry-run
bump-plugin (dry-run) — base HEAD:
  nexus-analytics: PATCH  0.4.0 -> 0.4.1   (concurrent F3 feature's dirt — not acted on)
  nexus: PATCH  1.36.1 -> 1.36.2
      - skill change (mine-algorithm)
      - skill change (mine-design)
      - skill change (mine-reference-model)
      - skill change (mine-skill-gaps)
      - skill change (mine-verify-cover)
      - skill change (mine-verify-flows)
      - skill change (mine-verify-repo)
      - skill change (mine-skill-candidates)
```
All 8 F15 shipped-file groups present in the reasons (new skill + `mine-skill-gaps` + the 6
siblings, `mine-verify-cover` hosting `mine-family-core.md`). Tool proposes PATCH by default per
policy — the owner (architect, at Close) escalates to **MINOR** via `--staged --minor`, per plan D7.
`plugin.json` version confirmed **unchanged**: `"version": "1.36.1"`. No `gen-commands` regen needed
(no agent files changed). **No bump applied — verification only, as instructed.**

**Fix cycle 1 (skill-conformance correction, per done-check FAIL):** the dry-run above was run
directly with the raw command, never through a logged `release-plugin` Skill-tool invocation —
`.claude/audit/skill-invocations.log` correctly showed it absent while `## Skills Used` incorrectly
claimed one. Invoked `release-plugin` for real and re-walked its procedure over the same evidence:
Step 0 precondition (`.claude-plugin/marketplace.json` present, confirmed) — Step 1 CLASSIFY
(dry-run re-run, identical result) — Step 2 JUDGMENT (MINOR escalation explicitly deferred to
Close's `--staged --minor` per plan D7, not applied in this verification-only step). Re-confirmed:
```
$ node scripts/bump-plugin.mjs --dry-run          (re-run under the skill, identical output)
$ grep -n '"version"' plugins/nexus/.claude-plugin/plugin.json
3:  "version": "1.36.1",
```
No new findings from the re-walk — the earlier interpretation held; only the invocation channel
was wrong, not the substance.

## KB Changes

None — dev-repo, no `docs/kb/` surface (per plan's own "KB Impact: None").

*Status: COMPLETE — developer, 2026-07-19*
