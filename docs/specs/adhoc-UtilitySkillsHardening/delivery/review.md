# Utility Skills Hardening — Review

## Step 1 — Done-Check

Ad-hoc technical pass (no `spec.md`). Binding definition = the routed feedback file
`D:\src\dotnet-microservices\docs\plugin-feedback\nexus-1.23.1-2026-07-06.md` (Entries 1–6),
governed by ADR-23 / ADR-9 / ADR-1. Dispositions map the 4 plan steps to `implementation.md`;
load-bearing artifact claims spot-verified on disk (version, CHANGELOG, skill-backlog, rubric
deletion, recipe bullets, lint fns).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Extend `skill-lint.mjs` (widen E6, add W3 + W4, header comment) — TDD | Implemented | `findRepoRoot` (`.git`-anchored fallback, critic M2) + `isFileShaped` (scripts/assets file-shape filter) + widened regex `(?:references\|workflows\|scripts\|assets)/` with `(?<![\w/])` lookbehind + W3 (body >500, WARN) + W4 (references-only nested scope, critic H1) + header/rationale comment rewrite. Test suite 16→25 (9 TDD cases). `tdd` invoked (logged). Satisfies feedback Entries 1, 2, 6. |
| 2 — `rubric.md`: delete Layer 0 item 6, sync item 4, soften item 3, add Layer 2.2 clause | Implemented | Layer 0 "skills index" dead-letter deleted (grep → 0 hits in Layer 0); item 4 folder list synced to widened E6; item 3 scripted/judgment boundary softened; Layer 2.2 degrees-of-freedom clause added **in prose** (no `references/`-prefixed path — W4-safe, verified). `improve-skills` invoked (logged). Satisfies Entries 3, 5 (rubric half). |
| 3 — `skill-recipe.md` §2 + `improve-skills/SKILL.md` | Implemented | Recipe §2: intro harmonized (sanctions `scripts/`), `Bundled executable scripts/` bullet (P1 exemplars, AP3 no-restate), `Degrees of freedom` bullet — all exemplars bare filenames (W4-safe). SKILL.md scaffold step 3 offers `scripts/`; lint-scope sentence synced + names W3/W4. `improve-skills` invoked (logged, 2nd). Satisfies Entries 4, 5 (recipe half). |
| 4 — Full-estate lint sweep, skill-backlog, MINOR release + omni twin | Deviated (valid reason) | **Done:** bump `1.23.1 → 1.24.0` (`--minor`, owner-confirmed); CHANGELOG `[1.24.0]` naming the six entries; two `## Skills Fixed` skill-backlog entries (source slug); estate lint sweep + `--check` exit 0. **Deferred to team lead (plan-sanctioned, operator-owed by construction):** `gen-omni.mjs` + omni-twin commit + the impl commit — the developer never commits (hard rule) and gen-omni's footer pins the impl commit sha, which does not exist until the team-lead commit (standing finalize-artifacts-before-commit2 rule). `release-plugin` invoked (logged). Satisfies feedback header + ADR-9. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, session `d9f444c7`, token `developer:implement`):** all non-`None` mapped skills present in the scoped window — `nexus:tdd` (Step 1, `TDD: yes`), `nexus:improve-skills` ×2 (Steps 2–3), `nexus:release-plugin` (Step 4). `## Skills Used` section present; every self-reported invocation is in the log (no fabrication). Step 1's pattern-skill disposition `(none)` is warranted — JS-script editing has no pattern skill.

**No scope creep:** modified files are exactly the plan's Scope-In set (4 shipped skill files + `plugin.json` + `CHANGELOG.md` + `docs/skill-backlog.md` + `tests/unit/skill-lint.test.mjs`). No unexpected files. `boy-scout` skip is documented as a judgment call (clean consolidating pass on a release bump) — not a plan step, not a conformance gap.

**Open production gate (team-lead-owed, non-blocking for done-check):** the omni-twin sync + both commits remain to run. The verify-gate selfcheck fail is this deferred `gen-omni` arm, a known mid-feature false positive — it is not a plan↔implementation conformance defect and does not affect this verdict. It IS the team-lead's remaining commit-protocol work (see `implementation.md` → OPERATOR / TEAM-LEAD ACTION REQUIRED).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-06*

## Step 2 — Code Review

## Reviewed By
Reviewer (code-grounded pass per architect mandate: read `skill-lint.mjs` source directly, re-ran the
estate-wide lint sweep and the mandated test suite in its glob form; cross-reconciled the independently
produced `review-codex.md` cross-check against live source rather than trusting either artifact).

## Pre-commitment Predictions

Predicted before reading code, based on feature shape (a widened regex-based lint gate + prose edits):
1. The E6 regex widening would need careful escaping of the new folder alternation — expected a possible
   over-broad match on `assets/`/`scripts/` inside unrelated longer paths. **Found:** correctly scoped by
   the pre-existing `(?<![\w/])` lookbehind; verified with the tailwind-theme carry-over case.
2. The `.git`-anchored repo-root fallback would risk being cwd-dependent in practice despite the comment
   claiming otherwise. **Found:** independently verified cwd-independence by invoking the script from an
   unrelated directory with absolute paths — both DO-NOT-BREAK sites still resolved clean.
3. W3's line-count arithmetic would be an off-by-one risk at the 500/501 boundary. **Found:** boundary
   tests exist at both 500 (no warn) and 501 (warn); traced the slice/split arithmetic by hand — correct.
4. W4's "references-only" scope claim would leak into `workflows/`/`scripts/` chains through the shared
   regex machinery. **Found:** implemented as a separate, narrower regex (`references-only`), with an
   explicit no-trip test — the two scanning passes do not share a matcher, so no leak.
5. The Step-4 release deviation (gen-omni/commit deferred) looked, at first glance, like scope creep or an
   incomplete Step 4. **Found:** it is a correctly-sequenced, ADR-20-compliant deferral (2-commit
   team-lead-owned strategy) — confirmed against `plugins/nexus/agents/team-lead.md:207,374-381` and prior
   precedent across multiple shipped features (`adhoc-MineVerifyRepo`, `adhoc-MineReferenceModel`,
   `adhoc-SddLifecycle`, etc.), not an invented excuse for this feature.

## Findings

No CRITICAL or HIGH findings.

### [LOW] Plan cites the regressed bare-directory test form
**File:** `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:157,181`
**Origin:** design
**Issue:** Plan Step 4's acceptance and the Testing Strategy section both name `node --test tests/`
(bare-directory form) as the regression-gate command. `tests/README.md:26` already documents, independent
of this feature, that "the bare-dir form regressed on Node ≥22" and prescribes the glob form
(`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`). The plan should have cited the already-known
working form.
**Fix:** None needed on the code side — the developer correctly substituted the glob form and recorded it
as a lesson (`lessons.md:55-58`). Cosmetic: amend the plan text if this slug's plan is ever revised, or
fold into a plan-template reminder that test acceptance commands should be copied from `tests/README.md`
verbatim rather than re-typed.
**Confidence:** 92/100

### [LOW] `review-codex.md`'s "major" NO-GO on Step 4 does not hold against the ADR-20 sequencing rule
**File:** `docs/specs/adhoc-UtilitySkillsHardening/delivery/review-codex.md:7-9`
**Origin:** external (an independent Codex cross-check reached a conclusion that a fuller read of this
repo's own conventions refutes — not a defect in this feature's code or docs)
**Issue:** The Codex cross-check flags `implementation.md`/`review.md` as prematurely marking Step 4
"COMPLETE"/"PASS" while `node scripts/gen-omni.mjs --check` still reports drift in six omni paths. Verified
independently: `gen-omni.mjs --check` does exit 1 right now (confirmed by re-running it). But
`implementation.md:93-110` explicitly documents this as a **deferred, plan-sanctioned** step, not an
oversight: gen-omni's twin-commit footer pins the **implementation commit's sha**, which cannot exist
before that commit is made — and per ADR-20 (`plugins/nexus/agents/team-lead.md:374-381`), the
post-implementation commit is exclusively the team lead's, never a subagent's. The architect's Step 1
"Verdict: PASS" (this file, line 22-24) already carves this out explicitly as team-lead-owed and
non-blocking for the done-check. The Codex cross-check's premise — that `--check` should be green before
the commit exists — is not achievable under this repo's 2-commit protocol, so its "major" severity does
not hold once that protocol is factored in. Its companion "minor" finding (the bare-dir test form) is
valid and is addressed above.
**Fix:** None — no code or doc change indicated. Flagging here only so the discrepancy between the two
review artifacts is reconciled rather than left silently contradictory for the team lead.
**Confidence:** 85/100

## Positive Observations

- **Deliberate-narrowing trade-off recorded in implementation.md**, exactly as the plan required (a
  directory-shaped fictional `assets/`/`scripts/` citation escapes the net by design) — this kind of
  self-aware scope note is what keeps a lint gate's coverage claims honest.
- **Every one of the plan's 8 minimum test cases is present** in `tests/unit/skill-lint.test.mjs:151-234`,
  plus a 9th (the tailwind carry-over pin) — verified by name against the plan's acceptance list, not just
  by count.
- **cwd-independence (critic M2) verified, not just asserted**: ran the lint script from an unrelated
  directory with absolute paths against both DO-NOT-BREAK sites; both still resolved clean.
- **W4's references-only scope is a genuinely separate code path**, not a shared regex with a scope
  parameter bolted on — this is the correct fix for the critic's H1 (a shared four-folder regex would have
  self-tripped on `skill-recipe.md`'s own `workflows/Template.md` citation).
- **Carry-Over Finding addressed with evidence, not assertion**: the tailwind-theme `assets/main.css`
  code-block case is now a named, passing test (`tests/unit/skill-lint.test.mjs:176-183`), and I confirmed
  by inspection that the lookbehind — not the file-shaped filter — is what makes it safe, matching the
  claim exactly.
- **No scope creep**: `git diff --stat` against HEAD touches exactly the plan's Scope-In files plus the
  slug's own delivery docs; nothing else in the tree changed.

## Gaps

- E6 does not recurse into `references/*.md` content for its own dangling-citation check (only W4 scans
  nested reference content, and only for further `references/` tokens) — a dangling `scripts/`/`assets/`
  citation *inside* a reference file would not be caught by either check. This is consistent with E6's
  pre-existing scope (SKILL.md-only) and is not a plan requirement; noting as a gap for a future pass, not
  a finding against this feature.
- No test pins the exact WARN wording for W3/W4 against a golden string (tests use `assert.match(/WARN/)`
  plus targeted substrings) — sufficient for the plan's acceptance criteria, but a future wording edit
  could silently drift without a stricter test.

## Open Questions

None below the confidence cutoff — both findings scored ≥80 and are reported above.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Mandated test suite (glob form) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `tests 484 / pass 484 / fail 0` |
| skill-lint suite in isolation | pass | `node --test tests/unit/skill-lint.test.mjs` | `tests 25 / pass 25 / fail 0` |
| Estate-wide lint sweep — nexus | pass, no warnings | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs <all 24 nexus skill dirs>` | all `OK`, exit 0 |
| Estate-wide lint sweep — nexus-dotnet | pass, no warnings | same script over 32 nexus-dotnet skill dirs | all `OK`, exit 0 |
| Estate-wide lint sweep — nexus-flutter | pass, no warnings | same script over 2 nexus-flutter skill dirs | all `OK`, exit 0 |
| cwd-independence (critic M2) | pass | ran the lint script from `%TEMP%` with absolute paths against `release-plugin` + `figma-to-flutter` | both `OK`, exit 0 |
| W3 body-size headroom claim | verified | counted body lines after frontmatter for every nexus SKILL.md | max = 410 (`mine-verify-cover`), matches plan's corrected M1 figure |
| Carry-over finding (tailwind-theme) | confirmed addressed | inspected `tailwind-theme/SKILL.md:16` + traced the lookbehind match logic by hand | lookbehind (not file-shaped filter) is load-bearing, as claimed |
| Scope check | pass | `git diff --stat` (working tree vs HEAD) | exactly the plan's Scope-In files + slug delivery docs, no stray files |
| `bump-plugin --check` semantics | understood, not a defect | read `scripts/bump-plugin.mjs` source (`--check` diffs `baseRef...HEAD`, not working tree) | confirms current "no bump needed" reading is pre-commit-correct, not a false pass |
| `gen-omni --check` (informational) | fails (expected) | `node scripts/gen-omni.mjs --check` | exit 1, 6 drifted paths — matches the documented, plan-sanctioned team-lead deferral |

**Reviewer tooling note (self-disclosed):** mid-review, `node scripts/bump-plugin.mjs --help` was run to
probe usage text; the script has no unknown-flag guard and silently fell through to **apply** mode,
bumping `1.24.0 -> 1.24.1` and duplicating the CHANGELOG entry. Caught immediately via `git diff --stat`
(insertion/deletion counts no longer matched the pre-existing diff), and reverted by hand
(`plugin.json` version restored to `1.24.0`; the spurious `[1.24.1]` CHANGELOG block removed) before any
further review steps. Post-revert `git diff --stat` matches the original working-tree diff exactly
(225 insertions / 18 deletions across 8 files) — confirmed byte-for-byte equivalent to the pre-mistake
state. No developer artifact was affected; flagging for transparency and because `bump-plugin.mjs`'s
missing unknown-flag guard is itself a small latent footgun (out of this feature's scope — not filed as a
finding against this plan).

**Verdict: APPROVED**

*Status: COMPLETE — reviewer, 2026-07-06*
