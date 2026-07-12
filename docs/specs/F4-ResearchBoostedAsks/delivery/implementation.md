# F4-ResearchBoostedAsks — Implementation

## Files Modified

- `plugins/nexus/rules/research-before-asking.md` — Step 1 (+ Self-Review fixes). Reworked §"The offer"
  (former L69–79, titled "the L93 corollary, expanded") into "## The offer — boostable asks and the
  research option" with five subsections: **Boostable asks** (definition + the three exclusions:
  question-itself-fact-shaped → auto-research, cheap input → silent resolve, pure preference → never
  boostable; plus the spec's tracker-integration worked example verbatim in substance), **The research
  option** (D3 template: label `Research first: {short target}`, description `~{cost}. Defers this
  answer — the agent researches and re-asks with a boosted recommendation.`; generic "let me research"
  ruled malformed), **Round semantics** (click → `research` skill recall/dive/deep-research routing per
  the existing §Capture and recall, cited not restated; re-ask boosted, never an open menu; one-round
  cap; declined `/deep-research` re-asks unchanged, marked cold), **Full option budget** (companion
  yes/no question at the 4-option cap; answer wins on conflict), **Mixed batch** (dependent answers
  held), **Prose fallback** (attended/clickable-only stated explicitly, BR11 textual carve-out). Also
  repaired the critic F-1 stale cross-refs: the intro's `(L92-L93)`, the fact-shaped-unknown section's
  `(agents-workflow.md L92)`, and the depth dial's `` `agents-workflow.md` L93 offer `` all now read as
  section-name references. The §Capture and recall body (L51–68 in the pre-edit file) was left
  byte-for-byte untouched, confirmed by direct read after the edit. **Self-review fixes (see below):**
  restored the "guards two failure modes" (silent research / forced cold answer) framing sentence as a
  lead-in paragraph to the reworked §The offer section — it had been dropped in the initial rework and
  survived only in agents-workflow.md's short pointer bullet, inverting the full-protocol-owner
  relationship the file's own header declares; and revised the file's scope line (L7–8) to distinguish
  "judges/originates a research offer" (po/architect/solo only) from "mechanical relay" (team lead's
  actual, now-real role per Steps 3 and 5) — the original line's blanket "not this research branch" for
  team lead had gone stale the moment Step 5 gave team-lead.md real render/route duties.
- `plugins/nexus/rules/agents-workflow.md` — Step 2. All-Agents block, the two L165/L166 hard-rule
  bullets. L165 (confidence label) gained one clause: "and on a **boostable ask**, the question also
  carries the research option per research-before-asking.md" — inserted mid-sentence, not a new
  sentence. L166 (offer research) restates its opening as the primary/fallback split (clickable
  research option primary, prose fallback for non-clickable surfaces) and widens its
  research-before-asking.md pointer to name boostable asks and the option's semantics, while keeping
  sentence count equal to the pre-edit bullet (5) — no restatement of the option's full mechanics (D2).
- `plugins/nexus/skills/questions-format/SKILL.md` — Step 3. Added the optional
  `**Research offer:** {named target} (~{rough cost})` field to the Q-section template immediately
  after `**Confidence:**`, with the consumed-rewrite rule (`consumed ({ISO date}) — {finding}`) inline
  in the field's bracketed guidance. Added a new Rules-block bullet ("Research offer (relayed
  path...)") stating the field is asker-written only, the team lead renders it verbatim (never
  re-judges/re-prices/researches), and documenting the click-back → round → re-surface cycle (spec
  Flow 3). Extended the Consumers table's Team Lead row with the render-verbatim + route-click-back
  duty.
- `plugins/nexus/agents/po.md` — Step 4 (+ Self-Review fix). The Escalation paragraph (L88) now leads
  with the boostable-ask reference and states the clickable research option (direct via
  `AskUserQuestion`, relayed via the `Research offer` field) as primary, prose as fallback — the
  fact-shaped-unknown default-before-asking sentence that followed is unchanged. The What-You-Never-Do
  "Skip the research offer" line gained a clause naming the option as primary form. Line 21's
  pre-interview shaping reminder ("3. **Research** — ... Offer to research before asking.") was left
  untouched per the plan's explicit critic-F-2 disposition (verified via grep — text is identical to
  the pre-edit file). **Self-review fix:** the boostable-ask parenthetical originally glossed it as
  "(spec/product-facing, medium/low confidence resting on an expensive fact-shaped input)" — a
  non-canonical category ("spec/product-facing" isn't one of research-before-asking.md's four
  preference/priority/scope/risk categories) that also dropped the "user can moot by answering"
  clause; replaced with a direct pointer to "research-before-asking.md's definition" instead of
  restating it, per D2 (no restatement, one owner).
- `plugins/nexus/agents/architect.md` — Step 4. The Codebase Facts paragraph (L71) rewritten to open
  with the primary-form clickable research option (direct/relayed split), keep the existing prose
  quote as the fallback sentence, and widen the closing research-before-asking.md pointer to name
  boostable asks and the option alongside the depth dial/capture-before-surface.
- `plugins/nexus/agents/solo.md` — Step 4 (+ Self-Review fix). The Discuss workflow step (L35) kept its
  existing fact-shaped-unknown sentence unchanged and appended one new sentence giving solo's
  confirmation asks the boostable-ask option duty (clickable research option as primary form; prose
  fallback), pointing at research-before-asking.md — no restatement of the option template.
  **Self-review fix:** the original gloss "a scope/approach call the user owns" narrowed the canonical
  definition to two of its four categories (dropping preference/priority/risk) and added a
  non-canonical fifth ("approach"); replaced with a direct pointer to "research-before-asking.md's
  definition" instead of restating/narrowing it, matching the po.md fix for the same defect class.
- `plugins/nexus/agents/team-lead.md` — Step 5. The confidence-relay hard-rule bullet (L26) gained two
  appended sentences extending the preserve-verbatim duty to a relayed question's `Research offer`
  field: render-by-template (never re-judge/re-price/research on the asker's behalf — "verbatim" =
  template render, not literal string copy), route a click back to the asking agent as a standard
  message-handoff, re-surface the boosted question on return. Points at questions-format for the field
  and research-before-asking.md for full semantics — placed in the same bullet rather than a new one
  (D4, developer's call: the confidence-relay bullet already owns "what the team lead does with a
  relayed recommendation," and the Research offer duty is a direct extension of that same duty rather
  than a separate concern).
- `plugins/nexus/commands/po.md`, `plugins/nexus/commands/architect.md`,
  `plugins/nexus/commands/solo.md`, `plugins/nexus/commands/team-lead.md` — Step 6. Regenerated via
  `node scripts/gen-commands.mjs nexus` from the four edited agent files above; no hand-edits.
  Regenerated a second time after the Self-Review fixes to po.md/architect.md*/solo.md/team-lead.md
  (*architect.md's command was already regenerated once and the Self-Review pass made no further edit
  to architect.md, so its second regen is a no-op re-write) so the shipped commands reflect the final
  agent text, not the pre-review draft.
- `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` — Step 6. MINOR version
  bump 1.32.0 → 1.33.0 via `release-plugin` skill mechanics (`bump-plugin.mjs --minor --note "..."`
  per the plan's exact invocation). The Self-Review round's further edits rode within this same
  uncommitted 1.33.0 bump (CLAUDE.md's uncommitted-bump-rides-within rule) — confirmed via a second
  `--dry-run` showing `1.33.0 -> 1.33.1` as the proposal, which is the expected false dirty-vs-HEAD
  signal since committed HEAD is still 1.32.0, not a cue to bump again.

## Key Decisions

- Kept every prose edit scoped to the exact anchors the plan named — no drive-by rewording of
  untouched adjacent sentences (the fact-shaped-unknown sentences in po.md/architect.md/solo.md were
  left as-is; only the offer/boostable-ask sentences changed).
- Step 2's L166 rewrite was trimmed once (removed a redundant closing sentence restating D2 ownership)
  to stay within the plan's "≤~3 sentences over current shape" read-check — final sentence count
  equals the pre-edit bullet's (5), satisfying "no restatement" more conservatively than the plan
  strictly required.
- team-lead.md Step 5 addition placed inside the existing confidence-relay bullet rather than as a new
  adjacent bullet (D4 explicitly left this to developer's call) — the Research offer duty is presented
  as a direct extension of "preserve verbatim when relaying," which is exactly what the existing bullet
  already governs.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)` — prose edit, research-before-asking.md §The offer |
| 2 | None | plan: `Skill: (none)` — prose edit, agents-workflow.md L165–166 |
| 3 | None | plan: `Skill: (none)` — prose edit, questions-format field + routing |
| 4 | None | plan: `Skill: (none)` — prose edit, po/architect/solo offer sentences |
| 5 | None | plan: `Skill: (none)` — prose edit, team-lead relay duty |
| 6 | release-plugin | Invoked via the Skill tool before running gen-commands/bump-plugin; followed its dry-run-first mechanics for the MINOR bump per plan Step 6 |

## Deviations from Plan

None. All six steps implemented per plan anchors; all accept-greps passed on first pass except Step
2's L166 bullet, which was tightened once (see Key Decisions) to better satisfy the plan's own
sentence-count read-check — not a deviation from the plan's content requirements, a stricter reading of
its own compactness instruction.

## Carry-Over Findings

None. All folded findings were fixed in-place during this implementation round (see Self-Review); no
open findings remain for the reviewer.

## Self-Review

**Verdict: PASS — 5 real findings, all folded and fixed; 3 findings dismissed as false positives with
reasons below; all accept-greps re-verified green after fixes; contamination gate re-verified clean.**

Two parallel `general-purpose` finder passes ran read-only over the diff + all 7 edited files, split
by angle (Pass A: internal consistency, dangling cross-refs; Pass B: dropped/narrowed guarantees,
directional refs, stale adjacent sentences — the 5 prose angles from the dispatch, no overlap between
passes). Every finding was re-verified in-context against live source before disposition — no finding
was folded or dismissed on the finder's word alone.

| # | Pass / Angle | Finding | Disposition | Evidence |
|---|---|---|---|---|
| 1 | B / Angle C | The pre-edit §The offer's explicit two-sided guard ("don't research silently... don't force a cold answer...") was dropped from the reworked section with no replacement, and survived only in agents-workflow.md's short pointer bullet — inverting research-before-asking.md's own "I hold the full protocol" claim (L3-6, unedited by this diff). | **Folded** | Verified by reading research-before-asking.md L71-133 post-edit: no equivalent sentence present. Fixed: added a lead-in paragraph to §The offer restating the guard, framed around the boostable-ask mechanism. |
| 2 | B / Angle C | po.md:88's escalation paragraph dropped the same "rather than researching silently or forcing a cold answer" clause, now pointing at research-before-asking.md instead — which (per Finding 1, pre-fix) no longer stated it either. | **Folded (same fix as #1)** | Once research-before-asking.md's guard was restored, po.md's pointer resolves correctly — no separate po.md edit needed; D2 (no restatement) means po.md should point, not restate. |
| 3 | B / Angle D | Directional references ("above"/"below") inside the reworked §The offer, and pointing into it. | **Dismissed — no defect** | Independently re-verified all 4 self-references (L37 "see §The offer below", L81/L83 "...above, unchanged" x2, L105-106 "see §Capture and recall above") against final line layout: all resolve correctly. |
| 4 | B / Angle E | Stale adjacent sentences assuming prose-only offer or single-field Q&A record. | **Dismissed — no defect** | Independently spot-checked the 4 locations the pass cited (research-before-asking.md:38-39, questions-format SKILL.md:35-37, po.md:90, architect.md:73/solo.md:36-37) — none reference invalidated behavior. |
| 5 | A / Angle A | research-before-asking.md's scope line (L7-8, not itself a plan-named edit target) says team lead carries "not this research branch," but questions-format's Consumers table and team-lead.md (both edited by this feature) now give team lead real render/route duties in that exact branch. | **Folded** | Verified by reading all three files' current text side by side. Fixed: revised the scope line to distinguish judging/originating (po/architect/solo only) from mechanical relay (team lead's real, now-documented role) — resolves the overclaim without weakening the BR10 judgment boundary. |
| 6 | A / Angle A | po.md:88's boostable-ask gloss "(spec/product-facing, medium/low confidence resting on an expensive fact-shaped input)" uses a non-canonical category and drops the "user can moot by answering" clause vs. research-before-asking.md's definition (preference/priority/scope/risk). | **Folded** | Verified by diffing the two definitions directly. Fixed: replaced the restated gloss with a direct pointer to "research-before-asking.md's definition," per D2. |
| 7 | A / Angle A | solo.md:35's gloss "a scope/approach call the user owns" narrows the canonical four categories to two and adds a non-canonical fifth ("approach"). | **Folded (same fix pattern as #6)** | Verified by diffing against the canonical definition. Fixed: same pointer-not-restate treatment. |
| 8 | A / (out-of-scope note, not a finding) | `spec BR10`/`BR11` citation style vs. spec.md's plain numbered Business Rules list (no literal "BR" prefixes in the spec itself). | **Dismissed — established convention** | The finder itself flagged this as out-of-scope, noting plan.md/implementation.md use the same BR-N shorthand throughout. Independently confirmed: `grep -c "BR[0-9]" docs/specs/F4-ResearchBoostedAsks/delivery/plan.md` = 14 hits — this is the plan's own citation style, not a defect introduced by this diff. |

**Post-fix re-verification:** every Step 1-5 accept-grep from the plan was re-run after the Self-Review
fixes and all still pass (boostable count 10 ≥ 3, `Research first:` / `answer wins` / `Research offer`
/ `consumed` / `re-judge` all still hit, `L9[23]` count still 0, `research option` still hits both
agents-workflow.md bullets and all 3 asking-agent files, `I can research` still ≤3 hits in compliant
context, po.md:21 still byte-identical). Commands were regenerated a second time to pick up the fixes;
`git status --porcelain -- plugins/nexus/` still shows exactly the F4 file set (13 files: 2 rules, 1
skill, 4 agents, 4 commands, plugin.json, CHANGELOG); `claude plugin validate plugins/nexus --strict`
passes. No fixes touched the excluded files (docs/backlog.md, docs/research/**,
docs/specs/F3-AnalyticsBorrowWave/**).

*Status: COMPLETE — developer, 2026-07-12.*
