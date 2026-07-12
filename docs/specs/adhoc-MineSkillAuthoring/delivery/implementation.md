# Mine Siblings Skill Authoring — Implementation

Graduates the two ratified mine-sibling proposals (`mine-algorithm`, `mine-design`) into shipped
nexus plugin skills, authors the routing contract into the mine-family core, does the graduation
bookkeeping, and runs the MINOR release tooling (dry-run only — commit is team-lead-owned).

## Files Created
- `plugins/nexus/skills/mine-algorithm/SKILL.md` — Step 2 (heavy-archetype thin orchestrator for the 7th mine).
- `plugins/nexus/skills/mine-algorithm/references/canonical-catalog.md` — Step 3 (frozen R2 catalog).
- `plugins/nexus/skills/mine-algorithm/references/equivalence-net.md` — Step 3 (frozen R1 equivalence recipe).
- `plugins/nexus/skills/mine-design/SKILL.md` — Step 4 (heavy-archetype thin orchestrator for the 6th mine).
- `plugins/nexus/skills/mine-design/references/decision-table.md` — Step 5 (decision table v2 + deferred row + anti-moves).
- `plugins/nexus/skills/mine-design/references/judge-protocol.md` — Step 5 (two-tier judge protocol + rejection exemplars).

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — Step 1: family table 5→7 rows
  (added `mine-algorithm` + `mine-design`); intro "five-member" → "seven-member" (+ both new skills named in
  the parenthetical member list); family-invariant "all five" → "all seven"; NEW `## Routing boundary` section
  (the once-authored algorithm-shaped vs rule/mapping-shaped contract). Left `:44` "five dimension extractors"
  untouched — that is mine-reference-model's dimension count, not a family-member count (does not match the
  `all five|five-member` accept grep). **Cycle 1 (FD1):** authored a 5-line chunked-writes discipline into
  §Execution topology (see Cycle 1 Fixes below).
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Step 1 sibling sync: `:409` "the full 4-row family table
  (including mine-verify-repo and mine-reference-model)" → "the full 7-row family table (including
  mine-verify-repo, mine-reference-model, mine-algorithm, and mine-design)". Retires the pre-existing stale "4-row".
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — Step 1 sibling sync: `:28` "5-row" → "7-row"; `:29`
  "all five members follow" → "all seven members follow".
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — Step 1 sibling sync: `:27` "all five members follow" →
  "all seven members follow".
- `plugins/nexus/skills/mine-design/SKILL.md` — Step 6 Judgment-Gate fold: removed a dead `### D5 — (reserved …)`
  contract placeholder and renumbered the output-artifact section D6→D5 and the rails section D7→D6 (with all
  in-body `(D6)`/`(D7)` and pipeline-block cross-refs updated). Net complexity down. **Cycle 1 (FD2):** added the
  Stage-0 absent-registry halt-and-route action at the pipeline block (`Stage 0` line) and the D1 BR-registry
  bullet (see Cycle 1 Fixes below).
- `plugins/nexus/skills/mine-design/references/decision-table.md` — Step 6 fold: updated the output-grammar
  owner cross-ref `SKILL.md §D6` → `§D5` to match the renumber.
- `docs/skill-backlog.md` — Step 6: two `Created` entries (mine-algorithm, mine-design) per the improve-skills
  Skill-Backlog logging discipline.
- `docs/architecture/README.md` — Step 7 (ADR-28 extraction): NEW **ADR-55** on **both surfaces** — the register
  summary line AND the full `## ADR-55 …` section (extracted, not re-authored; points at both ratified proposals
  as the tech-spec record). Ordinals reconciled against the live register: mine-semantic-model (nexus-analytics)
  is the fifth mine and holds no row here, mine-design is the sixth, mine-algorithm the seventh. Highest prior ADR
  was 54; 55 free, no renumber.
- `docs/proposals/mine-algorithm-2026-07.md` — Step 7: appended the `Graduated 2026-07-12 — shipped as
  plugins/nexus/skills/mine-algorithm (nexus 1.31.0)` stamp to the Status line.
- `docs/proposals/mine-design-2026-07.md` — Step 7: appended the same Graduated stamp AND reconciled the Status
  header clause (critic L8) — "scope: pilot authorization" → "fully adopt-ratified 2026-07-12", so the header field
  reads Graduated, not pending (the full-ratification fact was previously only a line lower).
- `plugins/nexus/.claude-plugin/plugin.json` — Step 8: version 1.30.4 → 1.31.0 (MINOR), written by `bump-plugin.mjs --minor`.
- `plugins/nexus/CHANGELOG.md` — Step 8: new `[1.31.0]` entry; the generated stub was enriched per release-plugin
  step 3 to describe the two new skills + the family-core change. (Editing a plugin's own CHANGELOG does not
  re-trigger a bump — it is excluded from bump classification.)

## Key Decisions
- **Routing-boundary section placed between `## The mine family` and `## Execution topology`** in the core
  reference — it is about family membership/routing, so it belongs adjacent to the family table, not buried
  in the stage plumbing. Added a "mixed unit" clause (rule-shaped shell around an algorithm-shaped core) beyond
  the plan's minimum wording, because both proposals note units are not mutually exclusive; kept fully
  self-contained (no dev-repo/SDK paths).
- **nexus-analytics `mine-semantic-model` NOT touched** (Q1 answer) — separate plugin/release cadence; its
  member counts (`:226/:229/:246`) and the `:72` "All five phases" phase-count homonym are DO-NOT-TOUCH.
- **Both new skills use `user-invocable: true` only, no `disable-model-invocation`** — matches the sibling
  `mine-reference-model` (which also writes a doc artifact to the consuming repo); the description's "Use when …"
  triggers govern auto-invocation. Not treated as a dangerous side-effecting write that would warrant hiding
  from model invocation.
- **gen-omni (twin sync) NOT run by me** — release-plugin step 5 runs `gen-omni.mjs` after the bump, but the
  omni twin is committed in `../omni` with a message whose footer pins the nexus closure-commit sha (per repo
  CLAUDE.md + finalize-artifacts-before-commit2). Since the closure commit is team-lead-owned, the twin regen
  belongs to that same step; running it now would strand uncommitted `../omni` changes with no provenance sha.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Plan Skill Mapping row 1 = (none); routing-contract text + 2 family-table rows authored inline per step. TDD: no. |
| 2 | improve-skills | Invoked via Skill tool; grounded the heavy-archetype authoring against skill-recipe (archetype decision) + proven-patterns (AP1/AP4/AP5/AP6) + mine-reference-model as the structural template. New shipped skill under the dev-repo carve-out. TDD: no. |
| 3 | None | Plan Skill Mapping row 3 = (none); freeze R1/R2 research into shipped self-contained references, authored inline per step. TDD: no. |
| 4 | improve-skills | Re-invoked via Skill tool for the second new-skill authoring; same heavy-archetype grounding, parallel structure to mine-algorithm. New shipped skill under the dev-repo carve-out. TDD: no. |
| 5 | None | Plan Skill Mapping row 5 = (none); decision-table v2 + judge-protocol frozen into references inline. TDD: no. |
| 6 | improve-skills + evaluate-skill | Deterministic Gate (skill-lint, exit 0 both folders) + mandatory Judgment Gate (evaluate-skill run in-context on each folder per Q2 — no waiver). One MEDIUM folded through improve-skills as a consolidating pass, re-lint exit 0. TDD: no. |
| 7 | None | Plan Skill Mapping row 7 = (none); ADR extraction + proposal Status stamps + backlog check authored inline. TDD: no. |
| 8 | release-plugin | Invoked via Skill tool; ran `bump-plugin.mjs --dry-run --minor` (reasons = only this feature's 5 skill folders) then `--minor` apply (1.30.4→1.31.0), enriched the CHANGELOG stub per the skill, `claude plugin validate --strict` passed. Commit + omni twin + tag left to team-lead (skill "does NOT commit for you"). TDD: no. |

## Judgment Gate — evaluate-skill findings (Step 6)

Both new folders lint exit 0 (Deterministic Gate) before the Judgment Gate. The evaluate-skill
rubric (Layers 1-4 + the fan-out overlay) was run in-context per folder — run-evidence basis: the
three pilot run reports validate the *method*; this gate judges the *authored artifact* (a different
axis). Findings:

| ID | Skill | Severity | Layer | Finding | Disposition |
|----|-------|----------|-------|---------|-------------|
| F1 | mine-design | MEDIUM | 2.4 legibility | A dead `### D5 — (reserved …)` contract placeholder shipped in the SKILL.md — an authoring artifact a cold reader stumbles on. | **Folded** through improve-skills (removed the reserved section, renumbered D6→D5 / D7→D6 with every cross-ref, net complexity down); re-lint exit 0. |
| F2 | mine-algorithm | LOW | 1.1 | `description` headlines the "replacement" verdict; the grammar also carries keep-domain / deletion-set verdicts. | Kept — the description is an auto-invocation trigger; the replacement-with-quantified-win guardrail is the right headline, the full grammar lives in A5. No change. |
| F3 | both | LOW | 4.1 / overlay | No skill-private lessons-capture line or partial-brief "finalize what exists" path. | Kept — family-consistent: the whole mine family routes lessons + report-on-halt through the family core + pipeline flow (mine-reference-model/mine-verify-repo ship the same posture); not a per-skill defect. |

Rubric items checked clean (both skills): Layer 1.2 guardrails have mechanisms (stage-0 precondition
halt; blind/provenance-stripped judge; read-only + orchestrator-drops-unexcerpted-verdict); 1.3
external-availability claims carry provenance + pilot-hardened caveats; 1.4 every `core §…` / ADR-45
citation resolves live; 1.5 scope fences name adjacent siblings; 1.6 known failure modes encoded
(truth-fork→stage-0, wrong-repo-Glob→pinned search root, calib3d→availability discipline,
partial-crosswalk / search-root / zero-cause / bug-preservation). Layer 2: routing boundary + skeptic
+ budget + topology single-sourced in the family core and pointed to (AP3); references not duplicated
in the SKILL.md; no AP1 dead-letter (every gate names its executor), no AP5 fictional path (all five
cited references exist on disk). Layer 3 fan-out overlay: model policy + concurrency cap stated
(sonnet lanes / opus gate; 2-3 lanes); verification-by-written-excerpt inherited from core.

**Verdict: ACCEPT (fix-then-accept) for both — zero unresolved CRITICAL/HIGH.** The one MEDIUM was
folded; the two LOWs are dispositioned keep-as-is with reasons above.

## Deviations from Plan
- **Judgment-Gate findings recorded in implementation.md, not a standalone `docs/skill-evals/{date}-{skill}.md`
  doc.** evaluate-skill's default step-5 writes a per-skill findings doc; the plan (source of truth) instead
  routes the dispositions into implementation.md ("record MEDIUM/LOW dispositions in implementation.md"), and
  the developer file-ownership boundary + the standing "no standalone findings .md" instruction both point to
  capturing the record here. The durable record exists (this section); only its location differs. No CRITICAL/HIGH
  was left unlogged.
- **evaluate-skill run in-context rather than via spawned evaluator agents.** The developer instance is under a
  no-spawn-pipeline-agents constraint for this run; the rubric layers were executed directly against the authored
  artifacts (which I hold in full context) rather than fanned out. This is a method-fidelity note, not a coverage
  gap — every rubric layer was walked.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Closure steps remain team-lead-owned | medium | team-lead | release-plugin steps 5/7/8 | The bump is applied but NOT committed. Team-lead owns: (1) run `node scripts/gen-omni.mjs` then `--check`; (2) stage the content edits + bumped `plugin.json` + `CHANGELOG.md` together and commit as ONE commit with subject `feat(adhoc-MineSkillAuthoring): …`; (3) commit the regenerated omni twin in `../omni` with the mirrored message + `Generated from the nexus plugin (nexus {sha}).` footer; (4) re-check `git branch`/`git log` immediately before committing (concurrent-run rule). No `gen-commands` needed — skills only, no agent changes. |
| Plan step 7 directs edits to docs/proposals + architecture ADR | low | reviewer | plan step 7 | The proposal Status stamps and the new ADR-55 are plan-step-7-directed edits, not developer over-reach — `docs/proposals/**` and `docs/architecture/README.md` are outside the developer's read-only set (which is plan.md/review.md/summary.md/.pipeline-state + `docs/specs/{slug}/definition/`). Flagged so the review doesn't misread them as a boundary breach. |
| Pre-existing working-tree state at session start | low | reviewer | git status | At session start `docs/proposals/mine-algorithm-2026-07.md` was already `M` (the pre-existing proposal amendment) and `docs/specs/adhoc-MineSkillAuthoring/` was untracked — not introduced by this implementation; the bump's reasons list confirmed no cross-feature contamination (only this feature's 5 skill folders). |

## Operator / team-lead actions required
- **Do NOT re-run the bump.** It is already applied at 1.31.0 (this feature's uncommitted bump). A `--dry-run`
  now proposing 1.31.1 would be a false dirty-vs-HEAD signal, not a cue to re-bump (repo CLAUDE.md).
- **Closure commit + omni twin + tag** are the team-lead/operator's at close (see Carry-Over row 1).

## Cycle 1 Fixes — Step-2 Fix Directives (2026-07-12)

Reviewer returned APPROVED with 1 MEDIUM + 1 open question needing architect placement; the plan's
`## Step-2 Fix Directives` (FD1/FD2) are the binding directives. Both are two-way-door wording fixes to
shipped skill text, grounded in the ratified proposals. **No re-bump** — these ride the uncommitted 1.31.0
(uncommitted-bump-rides-within).

**FD1 — chunked-writes dead pointer (MEDIUM, design origin) → author the discipline INTO the core (option a).**
- Root: `mine-design/SKILL.md:61` pointed the census's chunked-writes discipline at
  `mine-family-core.md §Execution topology`, which carried no such content (dead pointer). The proposal's
  "the mine-family core owns the 64k chunked-writes discipline" was a resolved-Unresolved claim never actually
  authored; the plan inherited it — hence design origin.
- Fix applied: authored a 5-line **Chunked writes for a large artifact** paragraph into
  `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` **§Execution topology** (new lines
  63–67), between the topology bullet list and **Per-skill staging**. Substance: a stage agent producing a
  large output (high-branch census, big rule KB, whole-repo triage registry) **appends it incrementally, per
  section or per cause-group, rather than one write**; a single oversized write risks truncation near the ~64k
  output ceiling, and because the orchestrator holds no filesystem it cannot re-assemble a truncated write, so
  the writing agent owns the chunking. Single-source AP3 posture, family-wide (any large-output member hits the
  same ceiling). **The `SKILL.md:60/61` pointer was left exactly as-is** (per the directive) and now resolves.
- Not restated in the SKILL.md — pointer-only, per the family-core single-source discipline.

**FD2 — mine-design stage-0 absence behavior (open question) → HALT-and-route, NOT intended looseness.**
- The proposal designs the BR registry as **required** (a genuine precondition); the gap was only the missing
  absence *action*.
- Fix applied to `plugins/nexus/skills/mine-design/SKILL.md` in two coordinated spots at the Stage-0 precondition:
  - **D1 BR-registry bullet (line 82):** added the binding sentence — *"Absent → HALT and route to a
    `mine-verify-cover` run to produce the registry, then re-run — the census's deletion oracle is trustworthy
    only if the registry was independently mutation-gated by a real `mine-verify-cover` pass, so producing it
    in-run would yield an unverified oracle. This is a halt to obtain a required input, not a self-mining
    prohibition."*
  - **Pipeline-block `Stage 0` line (line 39):** added a compact "absent, HALT and route to a mine-verify-cover
    run to produce it, then re-run" clause so the diagram the reviewer flagged as silent names the action and
    stays consistent with the D1 contract.
- **Deliberately did NOT copy mine-algorithm's HARD-BLOCK / "never self-mine" language** (grep confirms neither
  phrase is present in mine-design). The differing rationale is encoded as mine-design's own: it halt-and-routes
  to *obtain a required census input* (deletion oracle + BR-row→rule-object mapping source), which is a
  different thing from mine-algorithm's conformance-oracle independence prohibition. The `mine-verify-cover`
  "Upstream input producer" relationship (§Relationship to other skills) is already the named route target.

**Verification (re-run this cycle):**
- `skill-lint.mjs` over `mine-algorithm`, `mine-design`, and `mine-verify-cover` (the touched-reference folder):
  `OK` each, **EXIT=0**.
- Self-containment gate `grep -ciE "Omnishelf|omnivision-ai-sdk|D:\\src|docs/kb/research|docs/specs/adhoc-"` on
  both edited files (`mine-family-core.md`, `mine-design/SKILL.md`): **0** each.
- No re-bump (1.31.0 uncommitted bump unchanged); no commit (team-lead-owned).

*Status: COMPLETE — developer, 2026-07-12 (Cycle 1 fixes applied)*

## Cycle 2 Fixes — review-codex.md (late-landing Codex cross-check, 2026-07-12)

Codex Step-2 cross-check returned NO-GO with 5 findings (2 MEDIUM, 3 LOW), all team-lead-verified
against live source. All five are two-way-door wording/ordering fixes to already-shipped text —
no logic, no new content, no re-bump (they ride the uncommitted 1.31.0, uncommitted-bump-rides-within).

**F1 (MEDIUM) — `mine-reference-model/SKILL.md:220-221` stale 3-member family enumeration.**
- Root: the "Relationship to other skills" pointer restated a stale 3-member subset
  (`mine-verify-cover`, `mine-from-spec`, `mine-verify-repo`) of the now-7-member family — item-3
  pointer-sync was incomplete in this second (relationship-section) pointer, the top count-sync line
  (`:28-29` "7-row"/"all seven") having already been synced in Cycle 0.
- Fix: replaced the fragile subset with `(all seven members)`. Chose the drop-the-enumeration option
  (finding sanctioned "whichever reads cleaner and stays grep-safe") over re-listing all 7 — a bare
  member list is exactly what went stale; `all seven` follows the file's own "seven-member"/"all seven"
  idiom, is grep-positive (`7-row|all seven`), and can never drift to a stale subset again. The core
  `§The mine family` remains the single source of the full table (single-source discipline).

**F2 (MEDIUM) — `mine-verify-repo/SKILL.md:231-234` same stale 3-member enumeration.** Identical fix:
`(`mine-verify-cover`, `mine-from-spec`, `mine-reference-model`)` → `(all seven members)`; reflowed
the paragraph so the line wrap stays clean. Same rationale as F1.

**F3 (LOW) — `mine-family-core.md:17-19` family-table row order contradicted the ordinals.** The table
placed `mine-algorithm` before `mine-design`, but design is the **sixth** mine and algorithm the
**seventh** everywhere else (`mine-design/SKILL.md:23`, `mine-algorithm/SKILL.md:23`, ADR-55,
CHANGELOG). Fix: swapped rows 18↔19 so `mine-design` (6th) precedes `mine-algorithm` (7th), directly
after `mine-semantic-model` (5th). **Also swapped the same pair in the intro member list (line 4)** —
it carried the identical algorithm-before-design order; swapping only the rows would have left the file
self-contradictory (the exact defect class Codex flagged), so both loci were corrected. Root cause
(algorithm-listed-before-design) fixed at both of its appearances in the file. Grep-neutral (existence
greps and the `all five|five-member`=0 count grep are order-independent).

**F4 (LOW) — `mine-design-2026-07.md:7` stale pre-graduation "not authored there yet" text.** The
proposal is graduation-stamped (`:3`, nexus 1.31.0) and the routing boundary IS now authored in
`mine-family-core.md §Routing boundary`, so the future-tense "It is not authored there yet: the first
sibling to graduate-to-spec writes it into the core" was false. Fix: revised to past tense —
"**Authored into the core at graduation (nexus 1.31.0):** both skills cite it rather than restating."
Added the concrete core path + `§Routing boundary` anchor. **Kept the supersede-never-fork rule**
("On drift, supersede the core, never fork the definition") verbatim.

**F5 (LOW) — `mine-algorithm-2026-07.md:7` same stale text.** Same past-tense revision: the contract
"is **not authored there yet** — the first sibling … writes it" → "was **authored into it at
graduation, nexus 1.31.0** — both skills cite it rather than restating". Kept the routing-direction
sentence and the "On drift, supersede the core" rule intact. (This file was already `M` at session
start from the pre-existing proposal amendment; the line-7 edit rides that same modification.)

**Skills Used (Cycle 2):** None invoked — all five are surgical wording/ordering edits to existing
shipped/proposal text, no skill-mapped step re-executed (the plan's Skill Mapping binds authoring
steps, not this fix round). No `tdd` (prose artifacts, no testable behavior). No `boy-scout` beyond
the in-file consistency swap already folded into F3.

**Deviation (F3):** swapped the intro member list (line 4) in addition to the two table rows the
finding named. Reason: the identical algorithm-before-design ordering appeared at both loci; fixing
only the rows would have introduced a fresh table-vs-intro contradiction — the same internal-
inconsistency defect the finding is about. In-file consistency fix on a file I was already editing.

**Verification (re-run this cycle):**
- `skill-lint.mjs` (`improve-skills/scripts/skill-lint.mjs`) over `mine-reference-model`,
  `mine-verify-repo`, `mine-verify-cover`: **OK each, EXIT=0**.
- Self-containment gate `grep -ciE "Omnishelf|omnivision-ai-sdk|D:\src|docs/kb/research|docs/specs/adhoc-"`
  on the three touched shipped files (`mine-reference-model/SKILL.md`, `mine-verify-repo/SKILL.md`,
  `mine-family-core.md`): **0 each**.
- Q1 sibling accept greps still pass: negative `grep -niE "all five|[45]-row"` over the three sibling
  SKILL.md files = **no hits**; positive `grep -ciE "7-row|all seven"` = **1 / 3 / 2** (≥1 each);
  `grep -ciE "all five|five-member"` on `mine-family-core.md` = **0**.
- Ordinal cross-check: family-table + intro list now read `mine-semantic-model` → `mine-design` (6th)
  → `mine-algorithm` (7th), matching both SKILL.md ordinals, ADR-55, and the CHANGELOG.
- No re-bump (1.31.0 uncommitted bump unchanged); no commit (team-lead-owned).

*Status: COMPLETE — developer, 2026-07-12 (Cycle 2 fixes applied)*
