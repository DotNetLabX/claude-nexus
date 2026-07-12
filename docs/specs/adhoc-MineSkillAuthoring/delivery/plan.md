# Mine Siblings Skill Authoring — mine-algorithm + mine-design

**Feature Spec:** None (ad-hoc — binding inputs: the two ratified proposals `docs/proposals/mine-algorithm-2026-07.md` + `docs/proposals/mine-design-2026-07.md` (both fully ratified 2026-07-12), the pilot run reports in the SDK repo (`D:\Omnishelf\omnivision-ai-sdk\docs\specs\adhoc-MineAlgorithmPilot\delivery\run-report*.md`, `...\adhoc-MineDesignPilot\delivery\run-report.md`), and ADR-28 graduation)

## Context

Both mine-sibling proposals are ratified at High confidence with validated pilots (mine-algorithm: 2 pilots; mine-design: calibration pair + held-out). Graduation = ship them as nexus plugin skills. The pilots produced binding method refinements the proposals alone don't carry — the plan encodes them so the skills ship pilot-corrected, not proposal-literal.

## Scope

In: two new shipped skills (`plugins/nexus/skills/mine-algorithm/`, `plugins/nexus/skills/mine-design/`), the routing contract + family-table update in the mine-family core reference, graduation bookkeeping (ADR extraction, proposal status stamps), MINOR release. Out: WS7 consumption wiring (SDK-repo work), a separate cpp adapter skill (deferred — see ## Decisions), any agent/command changes (no gen-commands needed — skills only).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | routing-contract text + 2 family-table rows (inline in step) | — |
| 2 | improve-skills | Follow (dev-repo carve-out, new shipped skill per its skill-recipe) | no | mine-algorithm method content (stage prompts, deviation classes, model tiers) | |
| 3 | (none) | — | no | freeze R1/R2 into skill references (inline in step) | — |
| 4 | improve-skills | Follow (dev-repo carve-out, new shipped skill per its skill-recipe) | no | mine-design method content (census taxonomy, designer obligations, two-tier judge) | |
| 5 | (none) | — | no | decision-table v2 + judge protocol references (inline in step) | — |
| 6 | improve-skills + evaluate-skill | Follow (Deterministic Gate + mandatory Judgment Gate for new skills) | no | lint both new skill folders, then evaluate-skill each + fold CRITICAL/HIGH | |
| 7 | (none) | — | no | ADR extraction + proposal stamps + backlog row (inline in step) | — |
| 8 | release-plugin | Follow | no | `--minor`; closure-commit + omni twin per repo CLAUDE.md | |

All steps `TDD: no` — prose/skill artifacts and release tooling; no runtime behavior to test-drive. The deterministic gate is step 6.

## Domain Model Changes

None (plugin prose artifacts only).

## Data Model Changes

None.

## Implementation Steps

**Step 1 — Author the routing contract + family-table rows in the mine-family core (must land before steps 2/4 so both skills cite it, never restate it).**
File: `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`.
- Add section `## Routing boundary — algorithm-shaped vs rule/mapping-shaped` (the ONCE-authored contract, owner decision 2026-07-12): mine-design's stage-1 census routes algorithm-shaped units (an implementation of a computational problem — inputs/outputs/objective abstractable from the code) to mine-algorithm; mine-algorithm hands rule/mapping-shaped units back to mine-design; the definition lives here only — on drift, supersede this section, never fork it into a skill.
- Extend the family table from 5 to 7 rows: `mine-algorithm | one algorithm-shaped unit | BR registry (conformance oracle) | row-by-row deviation classification + deviation-triggered row re-grounding | algorithm-brief` and `mine-design | one class/function | complexity census (cause-classified branches) | two-tier judge (grounding kill, then pairwise) | design-brief`. Update EVERY member count in the file: the intro sentence ("five-member mine family" → seven-member) AND the family-invariant sentence ("unchanged across all five" → all seven) — the invariant sentence counts members without enumerating them; it is in scope (critic M1).
- **Sibling pointer sync (Q1 answer, 2026-07-12):** update the three in-plugin member-count pointers in this same step — counts only, no other wording changes. Old→new: `plugins/nexus/skills/mine-verify-cover/SKILL.md:409` "the full 4-row family table" → "the full 7-row family table" (also retires the pre-existing stale 4-row); `plugins/nexus/skills/mine-reference-model/SKILL.md:28` "the full 5-row family table" → "the full 7-row family table" and `:29` "all five members follow" → "all seven members follow"; `plugins/nexus/skills/mine-verify-repo/SKILL.md:27` "all five members follow" → "all seven members follow". DO-NOT-TOUCH: `plugins/nexus-analytics/skills/mine-semantic-model/SKILL.md` — its member counts (lines 226, 229, 246) are deferred to a nexus-analytics release (see ## Decisions), and its line 72 "All five phases" is a phase-count homonym, never a member count.
- Constraint: this file is shipped text — self-contained wording, no dev-repo/SDK paths.
Accept: `grep -n "## Routing boundary" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` hits exactly once; the family table contains rows starting `| \`mine-algorithm\`` and `| \`mine-design\``; `grep -ciE "all five|five-member" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` = 0 (no residual member count). Sibling sync: `grep -niE "all five|[45]-row"` over the three named sibling SKILL.md files (mine-verify-cover, mine-reference-model, mine-verify-repo) returns no hits, AND `grep -ciE "7-row|all seven"` ≥ 1 in each of the three. (Negative grep is scoped to the three named files, not a `mine-*` glob — the new skills authored in steps 2/4 may legitimately say "all five" on a different basis, e.g. the five-verdict grammar.)
Satisfies: ADR-28 graduation (ratified technical proposal → extracted, not re-authored).

**Step 2 — Author `plugins/nexus/skills/mine-algorithm/SKILL.md`.** Follow improve-skills (dev-repo carve-out; heavy archetype per its skill-recipe: thin orchestrator + `references/`). Feature-specific content (from the ratified proposal §Approach + both pilot run reports — read them once):
- 3 stages: problem characterization (clean-room, **canonical-naming ban**, registry+source inputs) → 2–3 independent matchers (problem statement + catalog ONLY — never source; off-catalog flagging; candor/no-match obligation) → adversarial conformance adjudication (deviation classes `adjudicated-bug | domain-requirement | accident`; **the oracle-is-challengeable rule** — a deviation re-grounds the BR row before it's honored; evidence excerpts mandatory per verdict).
- Inputs contract: BR registry HARD; **stage-0 precondition check (HARD BLOCK, proposal amendment from the pilot-2 truth-fork incident, 2026-07-12): registry absent or stale → the run STOPS and requests a separate mine-verify-cover run — the skill NEVER self-mines its own oracle.** Rationale shipped with the check: same-session oracle production forks the truth (two competing registries for one code range) and destroys the conformance gate's independence. Encode as a checkable stage-0 precondition in SKILL.md (registry file exists at the canonical `docs/business-rules/{area}/{unit}.md` path), not prose guidance. **Per-repo availability inventory also REQUIRED (owner decision 2026-07-12):** which libraries/modules the build actually links, assembled from the build files at kickoff — never discovered mid-run (pilot 2 had to grep CMakeLists mid-run to learn calib3d wasn't linked). Tech-debt row optional (targeting only); reference-model NOT an input.
- Verdict grammar: replace / restructure-toward-canonical / owner-gated / keep-domain / deletion-set; **quantified-win table mandatory** (NLOC, CCN, bugs, complexity class, new deps).
- Availability discipline: verify library claims against the **installed build** (linked module set / build files), never library docs (pilot-2 calib3d finding). Availability determines a candidate's **dependency tier**, never its viability — the dependency budget constrains only the recommendation tier, never the stage-2 candidate set (owner decision 2026-07-12).
- Execution topology + budget rail + kickoff checklist: one-line pointers to the family core (never restated); model defaults in stage dispatches: `sonnet` lanes, `opus` gate, Fable never required; **pin the target-repo search root in every stage prompt** (pilot wrong-repo-Glob finding).
- Output grammar: `algorithm-brief.md` per unit → consuming repo `docs/algorithm-briefs/{area}/{unit}.md` (placement note: ADR-45-aligned area mirroring), **with the brief's section grammar named as required content** (problem statement row-cited · matches with complexity + availability · conformance table · **dependency-tier ranking** — owner decision 2026-07-12: every viable candidate ranked **tier 0** = already-linked primitives (hand-roll on what the build links today) / **tier 1** = new module of an already-shipped library (e.g. enabling OpenCV calib3d for USAC) / **tier 2** = new external dependency, each with its quantified win, so the owner decides the dep budget per case; "not linked" is a tier assignment, never a rejection reason · recommendation with quantified wins · migration path + required net · rejected candidates with reasons, genuinely nonviable only).
- Calibration note (pilot-1 finding 5): the bugs-vs-deviations crosswalk is a **partial map by nature** — algorithmic bugs fall out as deviations, plumbing bugs don't — and the formalization routinely surfaces NEW latent hazards; state this as expectation-setting so a partial crosswalk reads as normal, not as failure.
- **Shared self-containment gate (applies to every file authored in steps 2–5, stated once here):** `grep -ciE "Omnishelf|omnivision-ai-sdk|D:\\\\src|docs/kb/research|docs/specs/adhoc-" {file}` = 0. Sanctioned exceptions (the consuming-repo contract, not dev-repo leakage): the output-grammar template paths `docs/algorithm-briefs/{area}/…`, `docs/design-briefs/{area}/…`, and the canonical registry input path `docs/business-rules/{area}/{unit}.md` — template tokens with `{placeholders}` only, never resolved paths.
Accept: file exists with frontmatter `name: mine-algorithm`, `description` naming the trigger ("hand-rolled algorithm", "canonical replacement", "BR-conformance"), a `## The pipeline` stage block, AND a greppable stage-0 precondition (`grep -ci "never self-mine" SKILL.md` ≥ 1); the dependency-tier ranking + availability inventory are present (`grep -ci "tier 0" SKILL.md` ≥ 1 AND `grep -ci "availability inventory" SKILL.md` ≥ 1); the shared self-containment gate (above) passes.
Satisfies: ADR-28 (mine-algorithm graduation).

**Step 3 — mine-algorithm references (freeze the research into shipped, self-contained files).**
- `plugins/nexus/skills/mine-algorithm/references/canonical-catalog.md`: the R2 catalog (`docs/kb/research/canonical-algorithm-catalog.md`) — entries + availability field + bounding discipline + the pilot extension (budgeted-selection/knapsack family) + both pilot-2 corrections (RANSAC calib3d module-scoping caveat; `cv::fitLine` name-collision trap). Keep the reconfirm triggers; add provenance line pointing at the pool entry by name (not path). **Scope header required (critic M4):** "the availability column is CV/C++-instantiated (OpenCV/Eigen/STL/NumCpp/vendored-DBSCAN); a new stack re-derives `availability` against its own linked set" — keeps the deferred-adapter decision honest.
- `plugins/nexus/skills/mine-algorithm/references/equivalence-net.md`: the R1 verdict (`docs/kb/research/algorithm-equivalence-testing.md`) as an operational recipe — executable back-to-back default; reasoning-only permitted solely for exact integer/discrete outputs with full row reproduction; engineered per-quantity comparators (exact / `max(rel,abs)` / agreement-rate / distributional); target-ABI measurement rule; metamorphic one-sided fallback; **seed-injection as the enabling refactor for unseeded-RNG units** (pilot-2 net); one perf-parity line — complexity-class reasoning at brief time, on-device micro-benchmark deliberately deferred (R5) until a replacement implementation approaches.
Rationale for freezing (not pointing): the research pool is dev-repo-local — consuming repos never see it; shipped text must be self-contained (plan-grounding rule).
Accept: both files exist; `grep -n "CV/C++-instantiated" plugins/nexus/skills/mine-algorithm/references/canonical-catalog.md` hits; the shared self-containment gate (step 2) passes on both files.
Satisfies: ADR-28.

**Step 4 — Author `plugins/nexus/skills/mine-design/SKILL.md`.** Follow improve-skills (same carve-out; heavy archetype). Feature-specific content (proposal §Approach + mine-design run report — read once):
- Stage 1 census: the 9 fixed causes + two per-unit observations (**flow-shape**, **mutation-fusion** — the row-11/row-5 anchors; every decision-table row must have a census anchor), BR-row crosswalk, counts-by-cause table as the headline artifact, chunked-writes discipline via family-core pointer.
- Stage 2 designers: 2–3 clean-room, decision-table-constrained; the three hard obligations (census citations / strangler path / precedent sweep with **pinned repo root**); honest zero-cause scoping (never prescribe for causes counted 0); bug-preservation discipline (documented live bugs preserved-and-ticketed, never silently fixed).
- Stage 3 judge: **blind** (no exemplar brief in its inputs), provenance-stripped, different model tier from designers (`opus` over `sonnet` lanes); tier 1 absolute grounding kill (citations re-executed with excerpts; authority scores zero; anti-move proposals fail outright); tier 2 pairwise survivors only, both orderings, flips resolved by evidence; synthesis with census-cited grafts.
- Calibration note: the planted fabricated-authority candidate is a **calibration-time instrument only** — production runs don't include one.
- Output grammar: `design-brief.md` → consuming repo `docs/design-briefs/{area}/{unit}.md`, **with the brief's section grammar named as required content** (census summary counts-by-cause · target architecture with moves RANKED BY PATHS ELIMINATED — note the estate-wide empirical finding that dedup-first is routinely the top move · per-move pattern + principle + census citations + migration + precedent · BR-row → rule-object mapping · rejected alternatives with reasons · required safety net).
Accept: file exists with frontmatter `name: mine-design`, `description` naming triggers ("design brief", "target architecture", "pattern prescription", "complexity census"); a `## The pipeline` stage block (parity with step 2, critic L3); the 9-cause list authored as ONE line so `grep -c "business-rule.*type-fork.*config-fork" SKILL.md` = 1 (layout pinned to make the grep sound, critic L2); the shared self-containment gate (step 2) passes.
Satisfies: ADR-28 (mine-design graduation).

**Step 5 — mine-design references.**
- `plugins/nexus/skills/mine-design/references/decision-table.md`: decision table v2 (11 rows + deferred state-row with promote-trigger + anti-moves + the three obligations + output grammar) — port from the ratified proposal, **with the pilot-upheld row-9 revision**: replace the `-fno-exceptions` assumption with "verify the repo's exception posture from its build files; prefer the repo's own error idiom" and keep the ≤ ~15-row growth cap. Include the census-anchor notes on rows 5/6/11.
- `plugins/nexus/skills/mine-design/references/judge-protocol.md`: tier definitions, evidence-excerpt requirement, both-orderings rule, authority-zero rule, and few-shot **rejection exemplars** distilled from the PLN-1 record (Visitor/flat-structs, Template-Method/inheritance-coupling, CoR-structure) — exemplar rejections only, never a full reference brief (keeps production judges blind). **Include the ratified independence escalation ladder (critic M5):** provenance-strip + different-tier is the default; escalate ONLY if a run shows self-preference or authority leakage — first an external cross-family CLI judge, then a 3-judge geometric-median panel; **do not pre-build either**.
Accept: both files exist; decision-table row count = 11 + 1 deferred; row-9 revision verified by a positive+negative pair (critic M2): `grep -n "exception posture" references/decision-table.md` hits ≥ 1 AND `grep -c "adapt, don't adopt" references/decision-table.md` = 0; `grep -n "geometric-median" references/judge-protocol.md` hits; the shared self-containment gate (step 2) passes on both files.
Satisfies: ADR-28.

**Step 6 — Deterministic gate + Judgment Gate.** Follow improve-skills. Two-part done-condition for a NEW shipped skill under the dev-repo carve-out (improve-skills/SKILL.md:21 + :74-90, owner decision 2026-06-20 — Q2 answer 2026-07-12):
- **Deterministic Gate:** run `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` over both new skill folders; fix all findings; apply the loader-safety pass (no XML-tag-shaped tokens, `{placeholder}` style, comparator words not glyphs).
- **Judgment Gate (mandatory for new skills, no waiver):** after lint exit 0, Follow evaluate-skill on each new folder (`plugins/nexus/skills/mine-algorithm/`, `plugins/nexus/skills/mine-design/`) — it runs the rubric's judgment layers (job fitness, repeatability, no-overlap, concrete steps) the lint structurally cannot. Fold every CRITICAL/HIGH finding back **through improve-skills** as a consolidating pass (net complexity flat or down, never additive patching); record MEDIUM/LOW dispositions in implementation.md; re-run the lint after folding. Rationale: two brand-new shipped skills carry the meta-loop force-multiplier blast radius; pilot validation certifies the *method*, evaluate-skill judges the *authored artifact* — a different axis.
Accept: lint exit 0 for both folders AND zero unresolved CRITICAL/HIGH evaluate-skill findings (each either folded or, for a genuine false positive, dispositioned with a one-line reason in implementation.md); re-lint after folding is exit 0.

**Step 7 — Graduation bookkeeping.**
- ADR extraction (ADR-28): mirror the mine-family precedent ADR-46/ADR-50 on **both surfaces** — the register summary line AND the full `## ADR-N` section (critic L6) — in `docs/architecture/README.md`: one ADR covering "**mine-design (sixth) + mine-algorithm (seventh)** ship as family members; the routing boundary lives once in the family core" (ordinal order per the proposals — design is the sixth mine, algorithm the seventh; reconcile the count against the live register at authoring time — mine-semantic-model ships in nexus-analytics and may hold no row here, critic L1). Point the ADR at the proposals as the tech-spec record — extracted, not re-authored.
- Stamp both proposals' Status lines: `Graduated {date} — shipped as plugins/nexus/skills/{name} (nexus {version})` appended (fill version from step 8). While stamping mine-design, reconcile its Status header clause — the header still opens "scope: pilot authorization"; the full-ratification upgrade lives a line lower — so the field reads Graduated, not pending (critic L8).
- Backlog: if `docs/backlog.md` carries a row for this arc, mark it Done; if none exists, add nothing (the proposals are the record).
Accept: register grep shows the new ADR id; both proposals grep `Graduated 2026-07-`.
Satisfies: ADR-28.

**Step 8 — Release.** Follow release-plugin: `--dry-run` first, verify the reasons list names ONLY this feature's files (steps 1–7), then bump **`--minor`** (new capability: two new skills), CHANGELOG entry, closure commit per repo CLAUDE.md (bump rides in the same commit as the change; omni twin regenerated and committed in `../omni` with the mirrored message per convention). Re-check `git branch`/`git log` immediately before committing (concurrent-run rule).
Owner: team-lead/operator at close (commit is not the developer's).
Accept: `plugins/nexus/plugin.json` version bumped MINOR; CHANGELOG top entry names mine-algorithm + mine-design; `git log -1` subject matches `feat(adhoc-MineSkillAuthoring): …`.

## Cross-Service Changes

None.

## Migration Notes

None (no consuming-repo migration; existing mine-family skills untouched except the core reference, which is additive).

## Testing Strategy

Prose artifacts: the deterministic gate is skill-lint (step 6) plus the acceptance greps per step, and — for the two NEW shipped skills — the evaluate-skill Judgment Gate (step 6), which judges the *authored artifact* (job fitness, repeatability, no-overlap, concrete steps), a different axis from method validity. No runtime harness — the *methods* were validated by the five pilot units; the skills encode, not re-derive, that validation.

## KB Impact

None in this repo (the research pool entries stay as-is; the skills carry frozen copies). Consuming-repo KBs are produced BY the skills, not updated by this feature.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Freeze R1/R2 research into shipped `references/` files | consuming repos cannot read the dev-repo research pool; shipped text must be self-contained | pool-pointer only | decided |
| One slug ships both skills + the core edit | the routing contract must be authored once, atomically with both citers | two sequential passes | decided |
| Model tiers encoded in stage dispatches (sonnet lanes, opus gates) | pilot-measured: full quality, Fable never needed; silent inherit burned Fable in pilot runs | inherit session model | decided |
| Judge ships blind; PLN-1 survives only as distilled rejection exemplars | blind judging was the validated calibration posture; a full exemplar brief would contaminate production judging | anchor judge on the PLN-1 brief | decided |
| Brief outputs at `docs/{algorithm,design}-briefs/{area}/` in consuming repos | pilot precedent, mirrors `docs/business-rules/` area structure; ADR-45-aligned | inside `docs/specs/{slug}/` | decided |
| No separate cpp adapter skill yet | both methods ran stack-neutral with inline stack notes; extract an adapter when a second stack consumes | author `mine-algorithm-cpp` now | deferred |
| Plant (fabricated-authority candidate) is calibration-only | validated once; per-run planting adds cost without new signal | plant every production run | decided |
| Step 1 syncs the 3 in-plugin sibling member-count pointers to 7 (Q1) | same plugin, same MINOR — a 7-row table beside "all five"/"4-row" siblings is a visible inconsistency; also retires the pre-existing stale 4-row | leave the informal pointers unsynced | decided |
| nexus-analytics `mine-semantic-model` counts NOT synced (Q1) | separate plugin, own version/release cadence; a sync forces a nexus-analytics bump this feature doesn't own. `:72` "All five phases" is a phase-count homonym — DO-NOT-TOUCH when that sync eventually runs | sync it in this feature | deferred (to a nexus-analytics release) |
| Step 6 runs the full new-skill done-condition (lint + evaluate-skill Judgment Gate), no waiver (Q2) | steps 2/4 Follow improve-skills under the dev-repo carve-out, which binds new shipped skills to the mandatory Judgment Gate; pilot validation certifies the method, not the authored artifact | lint-only, or waive with a recorded reason | decided |

## Open Questions

None — the pilots resolved every Unresolved item both proposals carried.

## Plan Review

Code-grounded critic (opus), 2026-07-12: **GO-with-fixes** — all load-bearing anchors verified live (family core 5-row baseline, `skill-lint.mjs` multi-folder invocation, `--minor`, dev-repo carve-out, ADR-28/45 + precedent ADR-46/50, both ratification stamps, all three SDK run reports). 5 MEDIUM + 8 LOW findings, all folded into the steps above (tagged `critic M{n}`/`L{n}` in place): invariant-sentence count (M1), row-9 positive+negative acceptance pair (M2), shared self-containment gate with sanctioned template-path exceptions (M3), catalog CV/C++ scope header (M4), judge-independence escalation ladder (M5), plus L1–L8 (ordinal order, layout-pinned census grep, pipeline-block parity, partial-crosswalk calibration note, R5 perf line, ADR both-surfaces, brief section grammars, mine-design Status-header reconcile). The proposal's post-review amendment (HARD BLOCK: never self-mine the oracle, stage-0 precondition) was folded into step 2 the same day.

## Step-2 Fix Directives (cycle 1 — architect placement calls, 2026-07-12)

Reviewer returned APPROVED with 1 MEDIUM + 1 open question needing architect placement. Both are two-way-door wording fixes to shipped skill text, grounded in the ratified proposal; developer applies, **no re-bump** (rides the uncommitted 1.31.0). Both re-run `skill-lint.mjs` to exit 0 after, and both stay self-contained (self-containment gate = 0, no dev-repo/SDK paths).

**FD1 — chunked-writes dead pointer (MEDIUM, design origin) → author the discipline INTO the core (option a).**
- Root: `mine-design/SKILL.md:60` points the census's chunked-writes discipline at `mine-verify-cover/references/mine-family-core.md §Execution topology`, which carries **no** such content (`grep -niE "chunk|64k" core` = 0; §Marginal-budget rail is *spend*, not output-size). The proposal (line 104) asserted "the mine-family core owns the 64k chunked-writes discipline" — a resolved-Unresolved claim never actually authored. Plan step 4 inherited that false assumption ("chunked-writes discipline via family-core pointer"), hence **design** origin: the code faithfully implemented a flawed plan assumption.
- Fix: author a 3–5 line chunked-writes discipline into `mine-family-core.md` **§Execution topology** (the section `SKILL.md:60` already points at — leave that pointer as-is). Single-source AP3 posture, matches the proposal's own design intent, and is a family-wide need (any large-output member — census on a high-branch unit, a big rule KB, a repo triage registry — hits the same ceiling). Re-touches the shipped core inside this feature's already-in-scope step-1 edit; no re-bump.
- Substance to encode (exact shipped wording is the developer's): a stage agent producing a large artifact **appends it incrementally — per section / per cause-group — rather than composing the whole artifact in one write**; a single oversized write risks output truncation near the ~64k output ceiling, and the orchestrator holds no filesystem so the writing agent owns the chunking.

**FD2 — mine-design stage-0 absence behavior (open question) → specify HALT-and-route, NOT intended looseness.**
- The proposal designs the BR registry as **REQUIRED** (line 8; `SKILL.md:78` "BR registry (required)") — a genuine precondition, so "proceed-degraded" is wrong against the ratified design. The gap is only the missing absence *action*.
- Fix: at the Stage-0 precondition, state the absence action — **registry absent → HALT and route to a separate `mine-verify-cover` run to produce it, then re-run** (mine-verify-cover is already the named "Upstream input producer", `SKILL.md:222`). One added sentence at Stage 0.
- **Do NOT copy mine-algorithm's HARD-BLOCK never-self-mine language** — the rationale differs and overclaiming it is wrong: mine-algorithm's registry is the adversarial **conformance oracle** (self-mining forks the truth + destroys the gate's independence — the pilot-2 truth-fork block); mine-design's registry is a required **input** to the census (deletion oracle + BR-row→rule-object mapping source), NOT the stage-3 judge's oracle (the judge grades census-citation *grounding*, not registry conformance). Rationale to encode: the census's deletion oracle is trustworthy only if the registry was independently mutation-gated by a real mine-verify-cover run — self-producing it in-run yields an unverified oracle. So mine-design halt-and-routes to *get* a required input; it does not carry mine-algorithm's independence prohibition.
