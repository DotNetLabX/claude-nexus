# adhoc-DotnetSkillSweep — Critic Review (Plan)

> Salvaged from the critic agent's transcript (agent a7142ff10f55dfc73, 2026-06-12) — the
> agent stranded its deliverable behind a closer twice; recovered via longest-assistant-text
> extraction. Content verbatim, encoding normalized.

## Mode: Plan Review (code-grounded)
## Verdict: REVISE

The plan is unusually well-grounded — every load-bearing factual claim I checked reproduced exactly (32 folders, 26 in-scope arithmetic, 30/32 lint with the two named failures, the genericization artifact, the 5-CHANGELOG / 1-references / 9-workflows distribution, all skill/script paths, the dev-repo channel carve-out). It is close. Two HIGH issues (precondition under-enforcement with a concrete bump collision; stale Context line-counts branded as "verified") and a few MEDIUM/LOW gaps keep it from ACCEPT. No CRITICAL.

## Pre-commitment Predictions (expected vs found)
1. **32/26 arithmetic** — predicted possible error. **Found: correct.** 32 folders, 32−6 Vue = 26, in-scope list is exactly 26 entries.
2. **Lint status stale/wrong** — predicted likely wrong. **Found: exactly right.** Full sweep = 30 pass / 2 fail; failures are persistence-patterns + redis-patterns (`<T>` in prose), as claimed.
3. **Findings-doc path mismatch vs evaluate-skill** — predicted mismatch. **Found: matches** (`docs/skill-evals/{date}-{skill}.md`).
4. **Lint invocation path wrong** — predicted wrong. **Found: correct and executable** at `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs`.
5. **One-commit shape vs staged precondition** — predicted collision. **Found: real collision risk** (see HIGH-1). This was the highest-value prediction.

## Cross-reference Matrix

| Binding-input requirement | Plan coverage | Status | Notes |
|---|---|---|---|
| Owner: improve/clean/reformat the 26 .NET skills | Scope §, Steps 2–4 | COVERED | 26-list verified exact |
| Owner: full sweep against `D:\src\dotnet-microservices` | Step 2 grounding-evidence input | COVERED | repo exists; read-only stated |
| Owner: deep external research via OMC research agents | Step 1 | COVERED | "Executed with OMC research agents" |
| Owner: compare internal vs external, evaluate, plan, apply | Steps 1→2→3→4 | COVERED | clean dependency chain |
| Owner fork: convergent pass (gaps → proposal, build nothing) | Scope §, Step 6 | COVERED | "Building new skills (gaps → proposal only)" |
| Owner fork: code-grounded critic review | Step 8 + this review | COVERED | code-grounded reviewer mandated |
| Owner fork: Vue skills deferred | Scope §, 6 named out-of-scope | COVERED | the 6 Vue skills verified by name |
| ADR-23: skill-lint as deterministic gate | Steps 4–5, Testing Strategy | COVERED | per-batch exit 0 + estate sweep |
| ADR-23: evaluate-skill as review standard | Step 2 | COVERED | Follow contract; vocabulary matches |
| ADR-23: improve-skills as single write owner | Step 4 | COVERED | Follow; consolidating constraint stated |
| ADR-1: dev repo = source of truth → fixes land here | Step 2 Channel note | COVERED | legitimate carve-out (see Note A) |
| ADR-9 / release-plugin: bump in same commit | Step 7 | COVERED | one-commit shape matches skill |
| ADR-9: gen-omni twin sync | Step 7 | COVERED | gen-omni.mjs exists; no gen-commands correct |
| ADR-9: validate --strict | Step 7 | COVERED | per the skill contract |
| Clean baseline before sweep (staged 1.0.3) | Precondition (prose) | **PARTIAL** | prose note, no Step-0 gate — see HIGH-1 |
| Context facts "grep/lint-verified 2026-06-12" | Context § | **PARTIAL** | line-counts stale — see HIGH-2 |

## Findings

### [HIGH-1] Precondition is load-bearing but unenforced — concrete bump collision if skipped
**Source:** plan Precondition line + Step 7; `release-plugin` SKILL.md step 7 (one-commit).
**Issue:** The staged change is a *complete in-flight release* (1.0.2 → 1.0.3 with matching CHANGELOG entry — verified via `git diff --cached`). The plan correctly says the owner must commit it before Step 4, but this lives as an "OPERATOR ACTION REQUIRED" prose note with **no Step-0 and no accept criterion**. I confirmed the collision is real, not theoretical: running `node scripts/bump-plugin.mjs --dry-run` *right now* (1.0.3 staged, no skill edits) proposes:
```
nexus-dotnet: PATCH  1.0.3 -> 1.0.4
    - plugin payload (conventions/csharp.md)
```
i.e. the tool is already attributing a bump to the **in-flight csharp.md change**, not the sweep. If the operator forgets the precondition, Step 7 commits the in-flight release and the skill sweep as **one 1.0.4 commit**, with a CHANGELOG entry that conflates two logical releases — exactly the "bump must never conflate" hazard the release machinery exists to prevent.
**Impact:** Silent release-history corruption; the 1.0.3 csharp.md change loses its own changelog identity.
**Suggestion:** Promote the precondition to **Step 0** with an accept criterion: "`git status --short` shows no staged/modified `plugins/nexus-dotnet/**` before Step 4; `node scripts/bump-plugin.mjs --dry-run` reports base HEAD = the committed 1.0.3." One move, makes the gate checkable.

### [HIGH-2] Context facts branded "grep/lint-verified 2026-06-12" but the line-counts are stale
**Source:** plan Context ("Phase-1 facts (grep/lint-verified 2026-06-12)").
**Issue:** Two illustrative counts in the same sentence are wrong:
- `create-feature` claimed **"59 lines"** → actual `wc -l` = **86**.
- `service-registration` claimed **"184 lines"** → actual = **240**.
Also "44 companion files exist" → I count **40** `.md` files under `workflows/`+`references/`. The lint and folder-count facts in the same block *are* exact, which makes the wrong numbers more dangerous: the "verified" stamp invites a developer to trust them without re-checking.
**Impact:** Low operational blast radius (these numbers feed no accept criterion), but they undermine the plan's own evidence claim and could mislead the Step-2 evaluator sizing "thin skills get thin docs."
**Suggestion:** Re-run the counts and correct them, or drop the specific numbers and keep the qualitative point ("thin scaffolder vs monolithic reference"). If "44" counts non-.md files, state the glob.

### [MEDIUM-1] Step 1 "OMC research agents" assumes a tool surface this agent cannot guarantee
**Source:** plan Step 1.
**Issue:** Step 1 mandates execution "with OMC research agents (owner's choice) — parallel web/document agents." The owner directive does say "deep external research using OMC research agents," so this traces correctly. But the plan gives no fallback if the executing context lacks those agents (the nexus pipeline's own agents are architect/developer/reviewer/etc., not OMC research agents). The accept criterion only checks the *artifact* exists, not that research agents produced it — so this is self-healing at the accept gate, but the step text reads as a hard tool dependency.
**Impact:** Step could stall on a missing-tool interpretation.
**Suggestion:** Add "or equivalent web/document research capability" so the mandate is capability-level, not tool-name-level.

### [MEDIUM-2] `service-registration` body duplicates its own description verbatim — a defect the plan should pre-name for Batch B
**Source:** `service-registration/SKILL.md` lines 3 vs 8 (verified).
**Issue:** The body's first paragraph (line 8) is a verbatim copy of the frontmatter `description:` (line 3). This is a concrete legibility defect of the exact kind Step 2's eval will surface and Step 4's `reformat` will fix — but the plan's Context lists genericization artifacts only for `add-integration-event`. Naming this representative defect would sharpen the Batch-B disposition.
**Impact:** None to plan validity; it's a missed opportunity to pre-ground Batch B. The eval will catch it.
**Suggestion:** Optional — add `service-registration`'s description-duplication as a second named Context example so the reformat scope is concrete before Step 2.

### [LOW-1] "Both format shapes" framing under-counts the workflows family
**Source:** plan Context vs verified `workflows/` distribution.
**Issue:** 9 skills carry `workflows/`. Batch A in Step 2 lists 10 skills as "Scaffolders (workflows-shape)" — `create-grpc-contract` has workflows/ and is in Batch A; fine. The grouping holds. Just noting the Context's "(scaffolders, e.g. create-feature 59 lines + 6 workflow files)" — create-feature has workflows/ but the "6 workflow files" count wasn't separately verified here and the "59 lines" is already wrong (HIGH-2).
**Suggestion:** None required; rolls up into HIGH-2.

## Gap Analysis
- **No missing binding requirement.** Every owner fork and every ADR-23/ADR-1/ADR-9 obligation maps to a step.
- **Out-of-scope dispositions are explicit** (the 6 Vue skills named individually; conventions files, core-nexus skills, renames all listed under Out of scope with reasons) — silence is not used as deferral. Good.
- **Edge case — already-clean skills:** Step 2 evals all 26 including the 30 lint-clean ones; Step 4 only applies *approved* dispositions. A `keep` verdict produces no edit, so a skill with no findings won't be touched — correct, and the disposition vocabulary includes `keep` so it's covered.
- **Edge case — Step 7 with zero skill edits:** if every disposition were `keep`, Step 7 would have nothing to bump beyond the docs/ artifacts. Very low probability given the 2 known lint fixes alone force edits in Batch B → guaranteed ≥1 skill edit → bump is valid. Resolved by the known fixes.

## Note A — the dev-repo channel inversion is correct, not a finding
Both `evaluate-skill` (SKILL.md step 1: "shipped plugin skill … findings route to the portable feedback file (`docs/plugin-feedback/`), never edits (ADR-1)") and `improve-skills` (Two Channels, ADR-1) hard-code: shipped skill → feedback file, never edit. The plan **inverts** this at Step 2 ("this IS the dev repo … findings route to direct fixes here, not the feedback file"). I checked ADR-1 (architecture/README.md): "The plugin repo is canonical… Feedback flows: project surfaces a gap → fix in the plugin repo." The skill's feedback-file rule is explicitly the *consuming-project* path ("in a consuming project resolve via the plugin cache"). In the dev repo, editing the skill directly **is** the canonical fix. The plan reads the contract correctly and states the carve-out explicitly. **Not a finding** — but Step 2/Step 4 should cite "ADR-1 dev-repo carve-out" rather than just "this IS the dev repo," so a reviewer doesn't mistake it for a contract violation.

## Open Questions
- None at LOW-confidence requiring downgrade. The line-count discrepancies (HIGH-2) are HIGH-confidence (direct `wc -l` evidence) but low blast-radius — kept HIGH only because the plan brands them "verified," which is a correctness claim about the plan's own diligence; if the spawner considers the Context section non-binding narrative, downgrade to MEDIUM.

## Realist check applied
- HIGH-1 survives: silent release-history corruption is a data-integrity class issue (never downgrade), and the dry-run output proves the collision is live, not hypothetical.
- HIGH-2: held at HIGH for the "verified" branding; would accept a downgrade to MEDIUM if Context is treated as non-binding. Flagging the option rather than deciding for the spawner.
- No finding survives at CRITICAL; only 2 at HIGH → no ADVERSARIAL escalation. The plan shows genuine grounding, not rushing.

```
Reviewed: D:\src\claude-plugins\nexus\docs\specs\adhoc-DotnetSkillSweep\delivery\plan.md
```
