# Review — adhoc-SkillAuthoringRecipe

## Step 1 — Done-Check

Pre-commitment predictions (before reading implementation.md): most-likely gaps were (1) Step 2's
binding *literal* `references/skill-recipe.md` citation being paraphrased (would pass lint but violate
the plan), (2) the skill-backlog format deviation not actually being accepted, (3) the three mapped
skill invocations missing from the log. All three checked out clean.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Author `references/skill-recipe.md` (§0/§1/§4, nexus-grounded) | Implemented (two valid deviations) | File on disk (9308 B, sibling to `proven-patterns.md`). **Dev-call deviation (a):** heavy-archetype examples used `mine-verify-repo`/`mine-verify-cover` instead of the plan's suggested `evaluate-skill`/`release-plugin`. Valid — the plan put "which nexus skills to name as the archetype examples" under *developer's-call* and listed the originals only as "candidates to verify"; the swap is structurally justified (heavy = multi-stage pipeline + parallel subagent dispatch + state/gate, which mine-verify-* match and the originals don't) and disclosed. **Dev-call deviation (b):** H1 fact-check extended to `effort`/`model` (the two fields the critic's verification split left unbucketed). Valid — a faithful application of the plan's governing "verify every field name before writing it" instruction; both returned VERIFIED via `claude-code-guide`. `improve-skills` invoked. |
| 2 — Wire recipe into `improve-skills/SKILL.md` steps 2 + 4 (literal path) | Implemented | Literal `references/skill-recipe.md` confirmed present in SKILL.md L42 (step 2 — archetype decision + element menu) and L49 (step 4 — frontmatter cheat-sheet). M1 binding requirement met — not paraphrased. Both authoring paths covered. `improve-skills` (same process, carried forward). |
| 3 — Born-compliant lint + skill-backlog entry + PATCH release | Implemented (one accepted format deviation) | `plugin.json` = 1.22.1 on disk; `CHANGELOG.md` `[1.22.1]` is a real entry, not the generated stub; `skill-lint.mjs` OK ×2; `claude plugin validate --strict` passed; `gen-omni --check` in sync; no `gen-commands` (no agent frontmatter touched); commit correctly deferred to the team lead. **Deviation:** skill-backlog entry uses the live file's structured `### {Skill Name}` block instead of the plan's inline one-liner — confirmed present under `## Skills Fixed` (`### improve-skills`, Type Fix, Source adhoc-SkillAuthoringRecipe). Valid — this is the format the rest of the file already uses; flagged at the Phase-1 checkpoint and accepted by the team lead. `release-plugin` invoked. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`).** Scoped to the implement-phase
window (agent=`developer`, token=`developer:implement`, session `6f201083-af1d-486b-8fd7-7a642d00f719`):
`improve-skills` (Steps 1–2) and `release-plugin` (Step 3) both logged — every non-`None` mapped skill
present. `boy-scout` additionally logged (matches the impl note; an extra, not a gap). No `tdd` expected —
all three steps are `TDD: no`. `## Skills Used` section present in implementation.md. **Conformance: PASS.**

**Informational (no verdict impact).** The plan's Step 1 parenthetical still cites the stale skill name
`search-researches/SKILL.md` (renamed to `research/SKILL.md`). The developer correctly did **not** propagate
this into the shipped reference file (which documents `context: fork`'s platform semantics, not that skill),
so there is no implementation gap. The plan text may optionally be corrected — plan-doc hygiene only.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-04*

## Step 2 — Code Review

## Reviewed By
nexus:reviewer (Sonnet 5)

## Verdict: APPROVED

## Pre-commitment Predictions
Before reading the diff, expected the highest-risk area to be the §4 frontmatter cheat-sheet
(hallucination-prone platform facts — the exact "AP5 fictional infrastructure" trap the critic's
H1 fix was written to guard against) and secondarily: (a) AP3 restatement creep (the new file
duplicating `proven-patterns.md` prose instead of referencing it), (b) the Step 2 wiring citing a
paraphrase instead of the literal `references/skill-recipe.md` token, (c) loader-safety violations
(angle-bracket tokens) in the new file, (d) the "swapped nexus examples" being structurally
dishonest (e.g. citing a skill whose `description`/`Use when` language doesn't actually match the
archetype claimed). All five were checked directly against source; only (a) is discussed at length
below because it is where a defect was most likely — everything checked out clean.

## Findings
None at or above the ≥80 confidence reporting cutoff. See Open Questions for one sub-80 item.

## Positive Observations
- **Every one of the 9 frontmatter-cheat-sheet claims independently re-verified against live
  platform docs, not just trusted from implementation.md's say-so.** I fetched
  `code.claude.com/docs/en/skills.md` (frontmatter reference table) and
  `code.claude.com/docs/en/model-config.md` (`effort` scoping) fresh in this review session and
  compared line-by-line against `references/skill-recipe.md:87-105`. Every claim matches,
  including the more surprising/specific ones: `disallowed-tools` clearing "on your next message"
  (docs: "The restriction clears when you send your next message"), `model` being silently ignored
  under an org allowlist (docs: "A value excluded by your organization's `availableModels`
  allowlist is not used and the session keeps its current model"), `context: fork` defaulting to
  `general-purpose` when `agent:` is omitted, and `Explore`/`Plan` skipping CLAUDE.md/git status
  under a forked skill (docs: "The built-in Explore and Plan agents skip CLAUDE.md and git status
  to keep their context small"). The `when_to_use` 1,536-char combined cap and the
  `skillListingMaxDescChars` setting name are also verified verbatim. This is exactly the rigor the
  plan's H1 fix demanded and the developer's implementation.md claimed — confirmed, not just
  trusted.
- **The two-tier "grep-authoritative only for 2 fields" claim holds up.** Grepped
  `plugins/**` for `disallowed-tools|allowed-tools|^effort:|^model:|context: fork|when_to_use` and
  for `^context:\s*fork` specifically — zero live frontmatter precedent for any of the six
  zero-precedent fields, confirming the plan's H1 framing and the shipped file's own disclosure
  (`skill-recipe.md:89-93`) are accurate, not just asserted.
- **Archetype example swap is honestly grounded, not just claimed.** Read
  `mine-verify-repo/SKILL.md` and `mine-verify-cover/SKILL.md` frontmatter directly — both are
  `name`/`description`/`user-invocable` only, and both descriptions carry verbatim "Use when ..."
  triage/mining language matching the source table's own "Use when" row. The light-side examples
  (`create-feature-spec`, `create-implementation-plan`) checked the same way. The frontmatter-row
  simplification in the archetype table (dropping `version`/`triggers`/`args` from the source,
  since no nexus skill uses them) is a legitimate re-grounding, not an inaccuracy.
- **AP3 reference-not-restate constraint genuinely held, not just asserted.** Read
  `proven-patterns.md` P5, P6, and AP3 directly — the new file's self-check item points at P5/P6
  without restating their text, and the file-level intro cites AP3's actual rule ("one fact, one
  owner") accurately. No duplicated prose found anywhere in the new file.
- **No loader-safety violations.** Grepped `skill-recipe.md` for `[<>]` — zero matches; the file
  correctly uses `{placeholder}` conventions throughout and contains no XML-tag-shaped tokens.
- **Wiring citation is the literal token, confirmed independently.** `SKILL.md:42` and `:49` both
  cite `references/skill-recipe.md` verbatim (re-grepped fresh, not reusing the architect's
  citation).
- **`Satisfies:` traceability holds for both plan steps.** Step 1's "P5 'the one real gap'" and
  Step 3's "P5 Note" both trace to real headings in `docs/proposals/skill-authoring-recipe.md`
  (`# Proposal P5`, `## The one real gap`) — confirmed by direct grep of the proposal, not taken on
  faith.
- **All build/lint evidence reproduced fresh in this review session** (see Evidence table) —
  independent of the developer's and architect's runs.

## Gaps
- The `effort` frontmatter row (`skill-recipe.md:103`) doesn't mention that an organization can cap
  which effort levels are available (docs: "Your organization can also cap which levels are
  available for a model; see Organization effort limits") — the `model` row does carry the
  equivalent org-allowlist caveat. This is a real, minor asymmetry, but the org-effort-limits
  feature is enterprise-only and the cheat-sheet is deliberately a "use it for" summary, not an
  exhaustive replica of the platform docs (its own framing, `skill-recipe.md:107-109`: "add
  complexity only when it pays" / defer detail to the linked source). Not filed as a finding —
  below the bar for a doc-completeness nitpick on a reference whose job is triage-level guidance,
  not a full mirror.
- No test suite applies (plan's Testing Strategy correctly identifies this as a no-code, prose +
  wiring change) — the lint gate and the code-grounded fact-check (this review) are the only
  applicable done-conditions, both green.

## Open Questions
- **(Confidence ~40, not filed as a finding)** Whether `effort`'s skill-frontmatter override is
  scoped identically to `model`'s ("current turn, resets on next prompt") is inferred from
  model-config.md's "Frontmatter effort applies when that skill or subagent is active, overriding
  the session level but not the environment variable" (docs/en/model-config.md, "Set the effort
  level") rather than stated as explicitly turn-scoped the way the `model` row is. The developer's
  and platform's own wording ("when...active") is compatible with "current turn" but doesn't use
  that exact phrase for `effort` the way it does for `model`. This is a wording-precision question,
  not a functional-correctness one — flagging for the developer to confirm intent matches the
  `claude-code-guide` transcript if there's any doubt, but not blocking approval.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Skill lint | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/improve-skills` | `OK    improve-skills` |
| Structural lint suite | pass (46/46) | `node --test tests/lint/*.test.mjs` | `tests 46 / pass 46 / fail 0`, incl. "plugin.json is valid and CHANGELOG top entry matches its version" and skill-reference-resolution tests |
| Plugin manifest validation | pass | `claude plugin validate plugins/nexus --strict` | `Validation passed` |
| Omni twin sync | pass | `node scripts/gen-omni.mjs --check` | `omni twin is in sync with nexus.` |
| Version bump sanity | expected (mid-feature signal, not a re-bump cue) | `node scripts/bump-plugin.mjs --dry-run` | `PATCH 1.22.1 -> 1.22.2 - skill change (improve-skills)` — committed HEAD is 1.22.0, working tree already carries the uncommitted 1.22.1 bump; dry-run's `current+1` against the dirty tree is the documented false-dirty signal, not a missed bump |
| Platform-fact cross-check (fresh, this review) | pass | `WebFetch code.claude.com/docs/en/skills.md` + `.../model-config.md` | All 9 frontmatter claims in `skill-recipe.md:95-105` confirmed against current docs (see Positive Observations) |
| Loader safety | pass | `Grep "[<>]" references/skill-recipe.md` | 0 matches |
| Wiring literal-path check | pass | `Grep "skill-recipe\.md" improve-skills/SKILL.md` | L42, L49 — literal path, not paraphrased |
| Skill-backlog entry | present, correct format | `Grep improve-skills docs/skill-backlog.md` | `### improve-skills` under `## Skills Fixed`, matches accepted deviation |
| CHANGELOG top entry | correct | `Read plugins/nexus/CHANGELOG.md` | `[1.22.1] — 2026-07-04` real content, not the generated stub |

Carry-Over Findings from implementation.md: none listed (`## Carry-Over Findings` → "None") — nothing
to confirm or refute.

*Status: COMPLETE — reviewer, 2026-07-04*
