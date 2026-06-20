# Distill Prompt Skill — Implementation

## Files Created
- `plugins/nexus/skills/distill-prompt/SKILL.md` — the `/nexus:distill-prompt` recipe. Born-compliant frontmatter (closed 4-key set: `name`, `description`, `user-invocable: true`, `disable-model-invocation: true`); body documents the 7-stage distillation method, a domain-grounding section keyed to canonical Anthropic prompt-engineering structure, an `## Arguments` section with the empty-input fallback, an output shape (distilled block + "Cut / Still-ambiguous" note), a scope fence, and a "What this skill does NOT do" section.
- `docs/skill-evals/2026-06-20-distill-prompt.md` — Step-2 `evaluate-skill` findings doc. Verdict **ACCEPT**; one keep-as-is LOW (lossless rule emphasized in 4 places, single normative owner in stage 4 — consistent, not AP3 drift); full rubric-items-checked-clean list (Layers 0–4 + overlay coverage note).

## Files Modified
- `docs/skill-backlog.md` — appended a `## Skills Created` entry for `distill-prompt` (Step-2 improve-skills logging requirement); records the ACCEPT eval + no-change consolidating pass.
- `plugins/nexus/.claude-plugin/plugin.json` — `version` `1.14.1` → `1.15.0` (Step 3; MINOR, owner-escalated for the new user-facing capability via `bump-plugin.mjs --minor`).
- `plugins/nexus/CHANGELOG.md` — prepended the `[1.15.0]` entry; replaced the generator stub with a real description of the `distill-prompt` capability.
- `tests/lint/wiring.test.mjs` — **root-cause fix for a lint gap surfaced by Step 4** (not plugin source, so no bump). The `nexus:X` reference resolver (line ~98) asserted every `/nexus:X` mention resolved to a shipped *agent* (`agents/X.md`). Skills are also invoked as `/nexus:{skill}` (platform auto-discovers `skills/*/SKILL.md` — exactly the invocation the plan's Scope documents), so the skill's own description `…/nexus:distill-prompt…` tripped it. Widened the resolver to accept a shipped agent **or** a shipped skill (imported `listSkills`, built a skill-name set, updated the assertion + message). Verified it keeps the agent references (`nexus:architect`, `nexus:developer`) passing.
- `../omni` twin (regenerated via `gen-omni.mjs`; lives in the sibling omni repo, outside this repo's `git status`) — `gen-omni --check` exit 0.

## Key Decisions
- **Recipe grounded in `claude-api`, not from memory** (plan Step 1 mandate). The "What 'good' looks like (grounding)" section reflects the canonical prompt-engineering targets surfaced by the `claude-api` skill: be clear & direct (prescriptive about *what*, and *when* where it matters — the loaded guidance stresses trigger conditions, not just descriptions), role/context up front, output format stated explicitly, examples carried through, reasoning room left in place. No SDK code or model IDs appear — the skill is about prompt *shape*, so only the structural guidance is cited, which is the relevant slice.
- **AP1 (every MUST names its executor):** each of the 7 stages names what it produces and who acts — the skill addresses "you (the model running this skill)" explicitly in the intro and stages, so no dead-letter rule. AP5 (every named path/tool exists): the only cross-skill reference is `create-feature-spec` (verified present in `plugins/nexus/skills/`); no fictional paths.
- **E7 compliance:** the command is written as `/nexus:distill-prompt` and placeholders as `{placeholder}`-style prose; no XML/angle-bracket tokens in prose (lint E7 clean).
- **`disable-model-invocation: true`** kept as the plan's reversible default — strictly human-triggered, matching the confirmed scope; the description states "human-triggered only" so frontmatter promise = body behavior.
- **Lossless-on-requirements stated as the cardinal rule and repeated as the stage-7 self-check** (re-read the stage-3 keep-list against the output block) — the plan flags this as the #1 failure mode, so it is named explicitly (grep ×3), not implied. Never-invent stated explicitly in stage 6 and the scope fence (grep ×3).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills, claude-api | improve-skills "For New Skills" recipe + born-compliant frontmatter + Write-tool UTF-8-no-BOM discipline + proven-patterns (AP1/AP5) read directly; claude-api invoked for the prompt-engineering domain grounding (a skill about prompts must reflect the canonical source). TDD: no (prose recipe; plan Skill Mapping). |
| 2 | evaluate-skill, improve-skills | evaluate-skill produced the findings doc (verdict ACCEPT); improve-skills invoked for the consolidating-pass decision — concluded **no change** (sole finding a keep-as-is LOW, no net-complexity reduction available). Both in this round's log. TDD: no. |
| 2b (owner-directed re-pass) | improve-skills | **Active** consolidating pass on the authored SKILL.md (not a no-change default). Checked against `proven-patterns.md` AP3; applied **3 single-owner consolidations** (opener, grounding section, stage 7/Output shape) — see `## Active improve-skills Pass`. gen-omni + skill-lint + selfcheck all exit 0; no second bump. TDD: no. |
| 3 | release-plugin | `bump-plugin --dry-run` (PATCH proposed) → `--minor` (owner-escalated) → 1.14.1→1.15.0; CHANGELOG entry rewritten; `gen-omni` + `gen-omni --check` exit 0; no `gen-commands` (no agent changed). TDD: no. |
| 4 | None | terminal verification gate (plan: Skill None). skill-lint exit 0; selfcheck 4/4 PASS after the wiring-test fix. |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `claude plugin validate --strict` fails on 4 pre-existing skills | low | reviewer | `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` SKILL.md error: "YAML frontmatter failed to parse" — all present at HEAD, none modified this round (git status clean for all 4); `distill-prompt` is NOT flagged | The `claude plugin` strict YAML parser is stricter than the repo's own CI gates (`frontmatter.test.mjs` + `selfcheck.mjs`, which the plan names as authoritative and which all PASS). Pre-existing; out of scope for this feature. Flagged so the reviewer doesn't re-investigate or attribute it here. |
| `nexus:fleet` reference is in a `.mjs`, never lint-scanned | low | architect | `skills/fleet/scripts/render-fleet.mjs:2` references `/nexus:fleet`; the wiring test's `walk` only scans `.md`, so skill-script references escape the resolver | Not fixed (out of scope; `.mjs` scanning is a separate decision). The widened resolver I added would resolve it correctly if `.md`-scanning were ever extended to scripts. |

## Active improve-skills Pass (owner-directed, 2026-06-20)

The owner directed a second, **active** `improve-skills` pass on the just-authored
`distill-prompt/SKILL.md` — concrete improvements applied, not a default "no change." Invoked
`improve-skills` (dev-repo carve-out, ADR-1: shipped skill fixed directly in `plugins/nexus/skills/`,
`skill-lint` as the done-condition) and checked the fix against `references/proven-patterns.md`,
specifically **AP3 (one fact, one owner; every other location references it)**. Re-read the catalog
plus two structurally-similar shipped siblings (`research`, `evaluate-skill`) to ground the pass.

**Three AP3 duplications consolidated** (net complexity *down*, not additive):

1. **Lossless-rule over-statement in the opener.** The opener restated the cardinal rule in full
   ("the cardinal rule and the whole point: distillation is lossless on requirements… A shorter
   prompt that quietly dropped a constraint has failed, not succeeded") — a verbatim-weight copy of
   what **stage 4** owns. Tightened the opener to the thesis one-liner ("lossless on requirements,
   not a lossy summary") and made it **point to stage 4** as the single full-statement owner. The
   thesis-in-opener pattern is conventional in the siblings (`research`: "cited or it does not
   ship"); what's removed is the *duplicated full statement*, not the thesis.
2. **Lossless rule restated inside the grounding section.** Lines 45–46 re-asserted the rule
   ("Brevity serves clarity here; it never overrides completeness. When the two conflict, keep the
   requirement and cut elsewhere.") in a section that is structurally *about prompt-engineering
   shape*, not the cardinal rule. Rewrote it to **reference the cardinal rule (stage 4)** instead of
   re-asserting it.
3. **Four-part block shape stated twice** — stage 7 enumerated "task → context → constraints →
   output format and success criteria" and the `## Output shape` section restated the same ordering
   parenthetically. Made `## Output shape` the **single owner** of the block structure (promoted the
   parenthetical to the explicit normative statement) and rewrote **stage 7 to defer to it** ("Emit
   the two parts defined in **Output shape** below"). Removes the drift risk where one location's
   ordering could change without the other.

**Net effect:** each core fact now has exactly one full-statement owner (lossless → stage 4; block
shape → Output shape; never-invent was already single-owned at stage 6), with the remaining
mentions as thesis pointers or scope echoes — the conventional, accepted pattern. The body stayed
shorter, not longer (consolidating pass, not additive patching).

**Grep-checked plan invariants re-verified intact after the edits:** lossless-on-requirements rule
(stage 4 owner + thesis/grounding/scope/closing echoes), never-invent rule (stage 6 + closing
echo), `## Arguments` with empty-input fallback, `/nexus:distill-prompt` slash form, no
XML/angle-bracket tokens.

**Why this is not the prior "no change."** The first consolidating pass (Step 2) concluded no change
because the sole `evaluate-skill` finding was a keep-as-is LOW and no *net-complexity reduction* was
then identified. This active pass went looking specifically for AP3 single-owner violations against
the catalog and the siblings, and found three concrete ones that reduce duplication while preserving
every normative surface's intent — a genuine improvement, not polish-for-its-own-sake.

**Gates re-run (SKILL.md changed → twin mirrors `plugins/**`):**
- `node scripts/gen-omni.mjs` → regenerated; `gen-omni --check` → "twin in sync" (exit 0).
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt`
  → `OK distill-prompt` (exit 0).
- `node scripts/selfcheck.mjs` → **4/4 PASS** (exit 0); `bump-plugin --check` confirms the existing
  1.15.0 bump is present — **no second bump** (these edits ride the same uncommitted release).

## Files Modified (active improve-skills pass)
- `plugins/nexus/skills/distill-prompt/SKILL.md` — three AP3 consolidations above (opener, grounding
  section, stage 7 / Output shape). No frontmatter change; no version-relevant surface beyond the
  body prose already covered by the 1.15.0 bump.
- `../omni` twin — regenerated via `gen-omni.mjs` to mirror the SKILL.md edit (sibling repo, outside
  this repo's `git status`); `gen-omni --check` exit 0.

## Deviations from Plan
- **Step 4 required a fix to `tests/lint/wiring.test.mjs` the plan did not anticipate.** The plan's Step 4 named `frontmatter.test.mjs` + `selfcheck` as the gates; `selfcheck` also runs `tests/lint/*.test.mjs`, which includes `wiring.test.mjs`. That test's `/nexus:X` resolver was agents-only and failed on the skill's self-documented `/nexus:distill-prompt`. Fixed at root cause (resolver now accepts agent **or** skill) rather than by mangling the skill description — the slash-command form in the description is correct and load-bearing (it's the "Use when…" trigger). Reason this is the right call: the test encoded a pre-skill-invocation assumption; skills *are* invoked as `/nexus:{name}`, so the lint, not the skill, was wrong. The fix is to a test file (not shipped `plugins/{name}/**`), so it needs no plugin bump. Selfcheck went 3/4→4/4 after it.
- **`claude plugin validate --strict` (Step 6 of the release-plugin procedure) reports errors** — but only on 4 pre-existing, unmodified skills, not on `distill-prompt`. The plan's authoritative terminal gate is skill-lint + selfcheck (both green); `claude plugin validate` is not the plan's Step-4 gate. Documented as a Carry-Over for the reviewer; not treated as a blocker for this feature. (Attribution confirmed via read-only `git cat-file -e HEAD:...` + `git status` — no git writes performed.)

*Status: COMPLETE — developer, 2026-06-20*
