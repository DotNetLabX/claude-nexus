# adhoc-AgentGrounding — Review

## Step 1 — Done-Check

**Pre-commitment predictions (made before reading implementation.md):** (1) Step-7 TDD shape — a
literal red may be impossible on pass-through fixture tests; (2) Step-9 sweep counts drifting from
plan expectations; (3) Step-10 release integrity (phrasing guard, correct plugins bumped). All three
materialized as *disclosed, well-reasoned items*, none as silent gaps.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — solo + developer hook rebase (U1) | Implemented | Pinned text verbatim; per-agent disclosure variance applied as planned |
| 2 — architect hook rebase (U1) | Implemented | Pinned bullet landed |
| 3 — reviewer rule-aware rider (U2) | Implemented | Both named sections; placement within sections was plan-sanctioned developer's call |
| 4 — discoverability sections (U3) | Implemented | kb-navigation nav layer + kb-maintenance species boundary ("never hand-edit" present) |
| 5 — Repo Grounding Contract (U4) | Implemented | Section added; ADR-52 correctly verified-present, not re-added |
| 6 — C++ graph-extraction recipe (U5) | Implemented | clang-uml/Joern/CodeQL inline; SDK research entry provenance-only |
| 7 — merge-harness path rebase (U6) | Deviated (valid reasons) | (a) OD-L5→Contract R1 comment relabel — correctness fix, disclosed as Key Decision (the old label would misattribute the new default to a superseded decision); (b) TDD red-shape — a literal failing assertion is structurally impossible on pass-through fixture tests (`distillRegistry` et al. never hardcode a path); honestly documented in ## Skills Used instead of a claimed red that couldn't occur. `tdd` skill invocation platform-logged. |
| 8 — regenerate commands | Implemented | One plugin-wide run after all four agent edits |
| 9 — verification sweep | Implemented | All greps recorded in implementation.md; architect independently re-ran the decisive gates (see Evidence) |
| 10 — release | Implemented | PATCH applied per the plan's owner's-call clause with the MINOR recommendation recorded (AC-8 as amended — NOT a deviation despite the developer's cautious listing); phrasing guard held (negative grep re-run 0); nexus-cpp CHANGELOG quirk handled as the plan predicted; no commit, no gen-omni (owner-owned). `release-plugin` invocation platform-logged. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`):** scoped window = this
session (`02b55b65…`), `agent: developer`, token `reviewer:review` (the stale predecessor token in
force during this run — documented; no team lead ran to reset it). Both non-`None` plan mappings
appear in the log: `tdd` (03:51:29Z, Step 7) and `release-plugin` (03:56:00Z, Step 10). `## Skills
Used` is present and claims nothing the log does not corroborate. PASS.

**Plan hygiene:** plan `## Decisions` present and non-silent (4 rows). All `Satisfies:` referents
resolve to real AC-1..AC-8. PASS.

**Carry-over acknowledged:** test-count delta (505 vs the plan's 458 baseline, 0 fail both) — valid
explanation recorded (other in-flight untracked work), handed to the reviewer.

**Evidence (architect re-runs, 2026-07-09):**

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| AC-1 negative | pass | `grep -rn "activates the day the first one ships" plugins/` | 0 hits |
| AC-1/AC-3 positive | pass | `grep -l "has a registry at"` across plugins/ | exactly the 8 expected files (4 agents + 4 commands) |
| AC-7 negative sweep | pass | `git grep -nE "kb[\\\\/]+golden" -- harness tests` | 0 hits (exit 1) |
| AC-7 positive | pass | `grep -nE "docs[\\\\/]+business-rules" harness/merge.workflow.js` | REGISTRY_PATH composition at :492–496, area + no-area forms |

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-09*

## Step 2 — Code Review

## Reviewed By
reviewer (Step 2 code review, adhoc-AgentGrounding)

## Verdict: APPROVED

## Pre-commitment Predictions
- Predicted the harness AREA/registryPath composition in `merge.workflow.js` would have an escaping or precedence bug (undefined `AREA` leaking a literal "undefined" into the path, or the `registryPath` override failing to take precedence). Found: composition is correct — the ternary branches on `AREA` truthiness, `_args.registryPath ?? (...)` correctly gives the explicit override first precedence, and all 6 downstream `REGISTRY_PATH` usages read the same resolved constant.
- Predicted leftover references to the retired C2 trigger phrase or the old `docs/kb/golden` path lingering somewhere in the same files as the new text (a common editing miss). Found: none in the reviewed file set (repo-wide negative grep + a targeted grep for "attested golden set"/"OD-L5"/`docs/kb/golden` both came back clean) — but found a different, narrower text-coherence bug: a copy-paste error in a newly added comment (Finding 1).
- Predicted the 505-vs-458 carry-over finding's stated cause ("other in-flight untracked work") would not survive a clean-HEAD reproduction, since the two touched test files only changed fixture path strings, not test counts. Confirmed by direct reproduction (Finding 2) — the 505 baseline predates this slice and is independent of any untracked files.
- Predicted the regenerated commands might have drifted from a re-run of the generator (stale Step 8 output). Found: re-running `node scripts/gen-commands.mjs nexus` reproduced byte-identical output for all 8 commands (the same 4 already-modified files stayed modified, identical diff) — confirms Step 8 was done correctly and is reproducible.
- Predicted a CHANGELOG/plugin.json version mismatch or a literal retired-phrase reinjection. Found: none — versions match their CHANGELOG headers, and the phrasing guard holds on a fresh repo-wide grep.

## Findings

### [LOW] Self-contradictory provenance comment in kb-distill.test.mjs
**File:** `tests/unit/kb-distill.test.mjs:14-15`
**Origin:** implementation
**Issue:** The Step-7 NOTE comment reads: "fixture ledger paths below use the Contract R1 default path (docs/business-rules/<unit>.md, single-area form) — re-pointed from the retired docs/business-rules/ path." The clause names `docs/business-rules/` as both the NEW path and the RETIRED path — self-contradictory. The path actually retired (per the plan's Step 7, the tech-spec's Context section, and every other comment touched in this slice) is `docs/kb/golden/{Class}.md`. This reads as a copy-paste slip when the comment was authored: the second `docs/business-rules/` should read `docs/kb/golden/`.
**Fix:** Change line 15 to: `// (docs/business-rules/<unit>.md, single-area form) — re-pointed from the retired docs/kb/golden/ path.`
**Confidence:** 97/100

### [LOW] Carry-over finding's stated cause is refuted by a clean-HEAD reproduction; the "no regression" conclusion still holds
**File:** `docs/specs/adhoc-AgentGrounding/delivery/implementation.md:49` (Carry-Over Findings table)
**Origin:** design (the plan's/critic's cited "458 pass / 0 fail" baseline)
**Issue:** implementation.md's carry-over entry attributes the 505-vs-458 delta to "other in-flight untracked work" (untracked `adhoc-PRReviewTailV2`/other uncommitted specs). I reproduced the baseline directly this session: `git stash push -u` (stashing every tracked AND untracked change, leaving a byte-clean checked-out HEAD) followed by `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` still reports **505 pass / 0 fail** — proving the 505 count predates and is independent of this slice's changes and of any untracked docs/specs work. Independently, `git status` shows the only modified files under `tests/`/`harness/` are the 4 files this slice's Step 7 touches, and zero untracked files exist under either directory — so untracked work could never have contributed extra test files in the first place. The real explanation: the plan's Testing Strategy, the Step 7 acceptance line, tech-spec AC-7, and the plan's own critic pass ("suite baseline green (458 pass / 0 fail)") all cite a stale count — 458 was not the count on the commit this slice branched from. It appears to be a figure carried from an earlier point in the repo's history; several commits since (e.g. `adhoc-SddMergeFeedback`, visible in `git log`) added test suites (the loop-flutter Minimize suite is one such block visible in the pinned CI output). This is a plan/critic-authoring inaccuracy, not an implementation defect, and it does not affect merge safety — the suite is green both before and after this slice's edits, so the carry-over's bottom-line "no regression" conclusion is confirmed even though its stated cause is not.
**Fix:** No code change needed. Optionally correct the plan/tech-spec's baseline citation in a follow-up note so a future run doesn't re-flag the same non-issue.
**Confidence:** 95/100

## Positive Observations
- All pinned-text substitutions (the 3 hook files + the reviewer rider) land verbatim against the plan's pinned sentences, with the documented per-agent variance (`your final report` in solo.md vs `implementation.md` in developer.md) applied correctly.
- `harness/merge.workflow.js`'s `REGISTRY_PATH` composition is correct: `_args.registryPath` explicit override still takes first precedence, the `AREA` ternary correctly branches on truthiness (area-supplied vs single-area fallback per Contract R1), and all 6 downstream call sites read the same resolved constant — no drift between the composed default and its usages.
- Re-running `node scripts/gen-commands.mjs nexus` reproduced byte-identical output to what Step 8 had already generated (only the same 4 already-modified command files remained modified, identical diff) — confirms the regenerated commands are not stale and the generator is deterministic against the current agent sources.
- `kb-navigation.md` and `kb-maintenance.md`'s new sections respect the species boundary cleanly: the navigation layer is additive (doesn't touch the existing KB-index protocol above it), and the maintenance file's "never hand-edit" note is correctly scoped to `docs/business-rules/`, leaving the existing KB lint rules untouched.
- The `mine-verify-cover-cpp/SKILL.md` graph-extraction section is genuinely self-contained (clang-uml prerequisite, output shape, extraction-time filtering, CodeQL/Joern callouts all inline) with the research entry cited as provenance only, per the plan's self-containment rule.
- The nexus-cpp CHANGELOG stub-placement quirk (flagged as a predecessor Skill Gap in the plan) was correctly handled — the descriptive H1 paragraph sits above the new `[0.1.5]` entry, matching the file's pre-existing structure.
- Both plugin manifests pass `claude plugin validate --strict` (fresh run, this session).

## Gaps
- None found beyond the two LOW findings above — the Step-9 verification sweep's greps, the AC-1..AC-7 greps, and the pinned CI test form were all independently re-run this session and match implementation.md's claims.

## Open Questions
- None — both findings scored above the 80-confidence cutoff and are reported directly in Findings.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| AC-1 negative | pass | `grep -rn "activates the day the first one ships" plugins/` | 0 hits |
| AC-1/AC-3 positive | pass | `grep -l "has a registry at" plugins/nexus/{agents,commands}/{solo,developer,architect,reviewer}.md` | 8/8 files hit |
| AC-2 | pass | `grep -n "skeptic" plugins/nexus/agents/solo.md plugins/nexus/agents/developer.md` | both hit; in-context-fallback clause present in both |
| AC-3 | pass | `grep -n "docs/business-rules" plugins/nexus/agents/reviewer.md` + `grep -n "Rule-aware rider" plugins/nexus/{agents,commands}/reviewer.md` | registry check present (line 20); rider present in both agent + command copies |
| AC-4 | pass | `grep -n "business-rules" plugins/nexus/rules/kb-navigation.md plugins/nexus/rules/kb-maintenance.md` | both hit; maintenance hit includes "never hand-edit" |
| AC-5 | pass | `grep -n "Repo Grounding Contract" plugins/nexus/rules/kb-navigation.md` + `grep -n "ADR-52" docs/architecture/README.md` | section present (Title Case); ADR-52 present with Status blockquote |
| AC-6 | pass | `grep -n "clang-uml" ...SKILL.md` + `grep -n "Joern" ...SKILL.md` | both ≥1 hit |
| AC-7 negative sweep | pass | `git grep -nE "kb[\\\\/]+golden" -- harness tests` | 0 hits (exit 1) |
| AC-7 positive | pass | `grep -nE "docs[\\\\/]+business-rules" harness/merge.workflow.js` | REGISTRY_PATH composition, area + no-area forms, lines 492-496 |
| AC-8 | pass | Read `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus-cpp/.claude-plugin/plugin.json`, both CHANGELOG.md | versions 1.25.3 / 0.1.5 match CHANGELOG headers; entries name the guardrail rebase + grounding contract / clang-uml+Joern recipe |
| Phrasing guard | pass | `grep -rn "activates the day the first one ships" plugins/` (re-run after reading CHANGELOG) | 0 hits |
| Build/test (pinned CI form) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 505 pass / 0 fail / 0 skip |
| Carry-over reproduction | confirms no regression, refutes stated cause | `git stash push -u` (all tracked+untracked), then `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`, then `git stash pop` | 505 pass / 0 fail on clean HEAD too — identical count with or without this slice's changes or any untracked work |
| Plugin manifest validation | pass | `claude plugin validate ./plugins/nexus --strict` / `./plugins/nexus-cpp --strict` | both "Validation passed" |
| Leftover-reference sweep | pass | `grep -rn "attested golden set\|OD-L5\|docs/kb/golden" {reviewed file set}` | 0 hits |

*Status: COMPLETE — reviewer, 2026-07-09*
