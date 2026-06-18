# Implementation Plan — adhoc-RecipeEstateAudit (Confirmed set)

**Intent:** Refactoring + scoped capability (plugin-internal). Two-way door (ADR-25) — reversible doc/skill/hook edits.
**Source of truth (no spec — ad-hoc lane):** `docs/proposals/recipe-estate-audit.md` (Ratified), `delivery/findings.md` (Confirmed items only), `delivery/selection-index.md`, and the research entry `docs/kb/research/agent-tool-selection-discoverability.md` (cite-checked).
**Mapping basis:** plan steps ↔ findings triage rows (T1–T4) + the research verdict. The critic runs **Mode 2 against the findings/ADR register**, not a spec.
**Review mode:** **code-grounded critic — mandatory.** These are shared plugin-source edits (skills, rules, agent files, hooks); a doc-only review is structurally blind here (architect rule). Reviewer Step-2 reads the live files.
**Scope fence:** Candidate findings (duplicate-block drift, verdict-integrity Edit gap, improve-flow framing, gate detectors) are **out** — they get a separate grounding sub-pass. The `*-format` auto-load gap (cluster D) is resolved by **documentation, not preloading** — the research says minimize always-on weight, so we do not add frontmatter preloads.

---

## Step 1 — `search-researches`: surface fan-out for landscape, add fallback-capture, tighten description (cluster A + research-capture trio)

**Files:** `plugins/nexus/skills/search-researches/SKILL.md`
**Skill:** Follow `improve-skills` (dev-repo: edits the shipped skill source directly — **not** the plugin-feedback file, which is the consuming-project path; the binding gate is the shipped **skill-lint** at the end).
**TDD:** no (prose skill). **Confidence:** high.
**Satisfies:** findings T2 (research-capture trio) + selection-index cluster A + research entry §Fix.

Do:
- **Promote the breadth-first fan-out from a buried cost-footnote to a named use.** The current "Default a single researcher" section frames fan-out only as a cost warning. Add landscape/competitive/multi-stream scanning as an explicit, sanctioned mode (one topic file, multiple Q&A blocks), so a "scan mature apps" request pattern-matches to this skill instead of a generic agent.
- **Add the fallback-capture clause:** if the forked researcher is unavailable (infra failure) and the caller does the dive inline, the caller **still owes** the cited entry — drafted in `research-entry-schema`, validated through `cite-check.mjs`, written to `docs/kb/research/` **before surfacing**. Infra failure must not silently drop capture. (This is the exact leak that started the pass.)
- **Tighten the frontmatter `description`** to the six-component rubric (Purpose / Guidelines / Limitations), lean (no examples), and state the **cluster-A boundary** in one line: `search-researches` = inline + captures (single fact *or* fan-out); `deep-research` = standalone report, no capture, outside pipeline (ADR-1 decoupled); a bare generic agent for a fact-shaped unknown = wrong (no recall, no capture).

Accept: description names landscape/fan-out and the deep-research boundary; fallback-capture clause present, names the `scripts/cite-check.mjs` validator by path, and resolves the "researcher unavailable **and** no web access" case (block, or answer cold at lowered confidence — pick one in the clause); skill-lint passes for `search-researches`.

---

## Step 2 — Strengthen research-routing discoverability WITHOUT adding always-on weight (re-scoped after code-grounded review — HIGH-1)

**True starting state (verified):** the routing guidance already exists — `research-before-asking.md` has a full `## Capture and recall through search-researches` section (lines 39-55), `agents-workflow.md:94` already carries it as an always-on bullet, and `po.md:86` / `architect.md:71` / `solo.md:17` reference it in prose. **There is no parenthetical to promote.** Both rule files are always-on (`rules/`), so any net add regresses the research's minimize-resident-text verdict.

**Files:** `plugins/nexus/rules/research-before-asking.md`, `plugins/nexus/rules/agents-workflow.md` — **edit-in-place only; combined net always-on line delta must be ≤ 0.**
**Skill:** None. **TDD:** no. **Confidence:** medium.
**Satisfies:** findings T1 + research entry §Recommendation.

Do:
- The missing piece is **not** the capture rule (it exists) — it is the **tie-breaker between the three research tools** (`search-researches` vs `deep-research` vs a bare generic agent), the incident's actual confusion. Its correct home is the **`search-researches` frontmatter description (Step 1)** — the always-on metadata layer agents already route on — **not** new rules text. So Step 2's default is to **add nothing to the rules** and let Step 1 carry the fix.
- ONLY if the existing `## Capture and recall` section genuinely buries the route-first instruction, tighten its wording **in place**, offsetting any added line by trimming elsewhere (net ≤ 0).
- Do **not** add a second always-on bullet duplicating `agents-workflow.md:94` (critic open question resolved: consolidate, never duplicate).

Accept: **no net increase in `rules/` line count** — grep-checkable: `wc -l` across the two files, before vs after, delta ≤ 0; no duplication of the L94 bullet; the route-first + tool tie-breaker is discoverable (via Step 1's description). **Binding:** any net always-on add fails review — it regresses the very finding this pass acts on.

---

## Step 3 — Tighten the other ambiguous-cluster skill descriptions (clusters C, D, E, F)

**Files:** `plugins/nexus/skills/{evaluate-skill,improve-skills,boy-scout,diagnose}/SKILL.md` frontmatter descriptions; document the `*-format` on-demand expectation in `delivery/selection-index.md` (cluster D — **no** frontmatter preloads).
**Skill:** Follow `improve-skills` (dev-repo direct edit + skill-lint, as Step 1). **TDD:** no. **Confidence:** medium (adaptation per skill).
**Satisfies:** findings T1 + selection-index clusters C/D/E/F.

Do — each description gains the one distinguishing line its cluster needs:
- **C (evaluate vs improve-skills):** state the order — `evaluate-skill` **diagnoses** (findings); `improve-skills` **applies**. Not interchangeable.
- **D (`*-format` auto-load gap):** document in the selection index that `proposal-format`, `kb-entry-schema`, `research-entry-schema`, `summary-format` are **on-demand** (not preloaded) and name who reaches for each. Decision: document, don't preload (research: minimize always-on).
- **E (boy-scout vs simplify):** boy-scout = in-file, always reports; simplify = diff-scoped. One line each.
- **F (diagnose timing):** reach for `diagnose` after the first obvious fix fails, before the 3-attempt escalation.

Accept: each touched description distinguishes its skill from its cluster-sibling in one rubric-aligned line; selection-index documents the cluster-D on-demand expectation; skill-lint passes for each touched skill.

---

## Step 4 — Extract one shared `isCodeFile()` across the three hooks

**Files:** new `plugins/nexus/hooks/scripts/lib/is-code-file.js` (shared predicate); update `plugins/nexus/hooks/scripts/{guard.js,pipeline-gate.js,boundary-detector.js}` to import it. Tests: `tests/unit/boundary-detector.test.mjs`, `tests/unit/pipeline-gate.test.mjs`.
**Skill:** None — JS refactor, no pattern skill. Pattern reference: the three existing `isCodeFile` defs (`guard.js:91`, `pipeline-gate.js:111`, `boundary-detector.js:55`).
**TDD:** yes — the hooks have unit tests; assert behavior parity (red→green if the extension set changes). **Confidence:** medium.
**Satisfies:** findings T3 (triplicated predicate) + B-gate finding.

**Resolved truth (verified by code-grounded review — HIGH-2; supersedes findings.md's inverted Candidate):**
- `.sh`/`.ps1` are present in **`guard.js:94` AND `boundary-detector.js:58`**; they are **missing only from `pipeline-gate.js:114`.** So the real outlier is **pipeline-gate**, not boundary-detector. The union's *only* behavioral effect: **pipeline-gate gains `.sh`/`.ps1`** (its analyze-phase + dev-source gates would now fire on them). `guard.js` does **not** widen — it already catches them.
- **Second drift axis:** `guard.js:92` normalizes backslashes (`.replace(/\\/g,'/')`) before the path test; `pipeline-gate.js` and `boundary-detector.js` do **not**. On Windows paths (e.g. `.claude\…`) the three hooks' `docs/`/`.claude/` exclusion behaves differently. Extracting one predicate collapses this — a deliberate, must-document behavior change on a platform this repo targets.

Do:
- Extract one predicate into `lib/is-code-file.js`; import in all three. Canonical extension set = the **union** (pipeline-gate gains `.sh`/`.ps1`) — state this effect in `implementation.md`.
- **Reconcile path normalization explicitly:** the unified predicate normalizes backslashes (adopt guard's behavior) so all three hooks treat Windows paths uniformly. Document that pipeline-gate and boundary-detector now normalize where they previously didn't.

Accept: one definition imported by all three hooks; `node --test tests/unit/` green; tests assert **both** the extension set (incl. `.sh`/`.ps1`) **and** a Windows backslash-path case (`src\foo.cs`, `.claude\x.md`); the two behavior changes (pipeline-gate extensions; normalization in two hooks) documented in `implementation.md` with enforcement consequence.

---

## Step 5 — Fix the stale ADR-4 preload table

**Files:** `docs/architecture/README.md` (the ADR-4 table, ~line 192).
**Skill:** None — doc edit. **TDD:** no. **Confidence:** high.
**Satisfies:** findings A-confirmed (`lessons-format` scope).

Do: update the `lessons-format` row from `architect` to `architect, developer, reviewer` — matching the live frontmatter (`developer.md:6`, `reviewer.md:6`). Spot-check the other rows against frontmatter while there; fix any equally-stale row found (note it in implementation.md).

Accept: ADR-4 table matches the agents' actual `skills:` frontmatter.

---

## Step 6 — Regenerate artifacts + version bump (dev-repo release machinery)

**Files:** generated commands, `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md`, the omni twin.
**Skill:** Follow `release-plugin` (owns the bump + validate). Plus `node scripts/gen-commands.mjs nexus` (Step 2 edits agent files) and `node scripts/gen-omni.mjs` (twin) per CLAUDE.md.
**TDD:** no — build/release wiring. **Confidence:** high.
**Satisfies:** CLAUDE.md release policy (version-keyed cache).

Do:
- **First, reconcile the in-flight bump (MEDIUM-1):** `plugin.json` is already at **1.13.1** uncommitted on this branch (FleetView/UnattendedAutonomy work). Inspect `git diff plugins/nexus/.claude-plugin/plugin.json` and the CHANGELOG before bumping; decide whether this audit **folds into 1.13.1** or takes **1.13.2**, and state the chosen end-version in `implementation.md`. Do not blind-run a bump that double-counts or rides another feature's CHANGELOG entry.
- `gen-commands` is **likely N/A**: the re-scoped Step 2 edits only `rules/` (not agent files), and no other step touches `agents/*.md`. Run `node scripts/gen-commands.mjs nexus` **only if** an agent file actually changed; otherwise skip.
- Run `release-plugin` for the reconciled version (PATCH default; owner escalates). Bump `plugin.json` + `CHANGELOG.md` **in the same commit** as the changes. Regenerate the omni twin so its versions ride along.

Accept: `node scripts/bump-plugin.mjs --check` passes; chosen end-version stated and non-colliding; twin regenerated; CI `plugin-release-check.yml` would pass.

---

## Skill Mapping summary

| Step | Disposition | Skill | TDD | Confidence |
|------|-------------|-------|-----|------------|
| 1 | Follow | improve-skills (dev-repo direct + skill-lint) | no | high |
| 2 | None (doc edits) | — | no | medium |
| 3 | Follow | improve-skills | no | medium |
| 4 | None (JS refactor) | — | yes | medium |
| 5 | None (doc edit) | — | no | high |
| 6 | Follow | release-plugin (+ gen-commands, gen-omni) | no | high |

## Risks / notes

- **Always-on weight is the binding constraint (Step 2).** The research is explicit: at our tool count, adding resident text degrades selection. The tie-breaker pointer must stay compact; the full table stays on-demand. A reviewer flags any large always-on addition as a regression of the very thing we're fixing.
- **Step 4 is the only behavior-changing step** (the extension-set reconciliation). It's gated by the existing unit tests; the deliberate list change must be documented, not silently widened.
- **No spec → done-check is findings/ADR-mapping**, and `Satisfies:` rows cite findings items + the research entry, which the done-check confirms are real.

## Plan Review

**Critic — Mode 2, code-grounded (agent `a9e8e9d5a9ac7c305`), 2026-06-17. Verdict: REVISE → resolved.**
The critic read the live source for every step. Dispositions:

| Finding | Sev | Disposition |
|---|---|---|
| HIGH-1 — Step 2 premise wrong (routing guidance is a section + always-on bullet, not a parenthetical; both files always-on) | HIGH | **Fixed** — Step 2 re-scoped to "no net always-on add; the fix lives in the Step-1 description"; net `rules/` line delta ≤ 0 is now the binding accept. |
| HIGH-2 — Step 4 extension list inverted (pipeline-gate is the outlier, not boundary-detector); worked example named wrong files; second drift axis (backslash normalization) missed | HIGH | **Fixed** — Step 4 now states the resolved truth, the correct union effect (only pipeline-gate widens), and an explicit normalization reconciliation + Windows-path test assertion. |
| MEDIUM-1 — Step 6 assumed clean bump; 1.13.1 already uncommitted | MED | **Fixed** — Step 6 now reconciles the in-flight bump and states the chosen end-version. |
| Gap — Step 1 fallback edge cases (cite-check path; "no web access" case) | LOW | **Fixed** — folded into Step 1 accept. |
| LOW-1 — gen-commands is whole-plugin | LOW | **Acknowledged** — Step 6 now conditions gen-commands on an actual agent-file change (re-scoped Step 2 makes it likely N/A). |

Steps 1, 3, 5 returned **sound** — claims verified accurate against live source. Every step traces to a Confirmed finding; the Candidate scope-fence held. The inverted `isCodeFile` Candidate is corrected at source in `findings.md`.
