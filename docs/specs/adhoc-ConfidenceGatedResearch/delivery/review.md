# Confidence-Gated Research (P1) — Review

## Step 1 — Done-Check

Done-check run 2026-06-13 (architect, fresh invocation). Plan + implementation.md read once;
every acceptance criterion verified against **live source** (grep), not the self-report. The
authoritative skill evidence is `.claude/audit/skill-invocations.log` scoped to `agent=developer`,
`token=developer:implement`.

**Pre-commitment predictions (made before reading impl):** (1) D1 clause present in only 4/5 agents —
team-lead's differently-worded line is the easy miss; (2) D2 research branch leaking into
developer/team-lead; (3) the L93 "codebase facts are never user questions" corollary silently dropped
when appending the pointer. **All three predicted gaps were checked and are clean.**

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — D1 (universal): unconfirmed assumption lowers confidence | Implemented | Clause present in **all 6** files. agents-workflow.md:92 (canonical hard rule, "a belief is not a basis" + research-target + Stryker scenario named inline); inlined in po:102, architect:275, solo:33, developer:128 (byte-identical one-liner extension); team-lead:26 clause **correctly fitted to its differently-worded line** (relayed-label refinement) — prediction #1 falsified, it is present. Substance grep `unconfirmed.{0,20}assumption` → 6 hits/6 files. |
| 2 — D2 (scoped po/architect/solo): fact-shaped unknown → research + depth dial + capture | Implemented | research-before-asking.md renamed to **Research & Confidence Protocol** (topical owner). "I can research" appears in exactly the sanctioned owners — owner + agents-workflow.md:93 (hard rule + pointer) + po:86 + architect:71 (ADR-14 backstops), **nowhere else**. solo:17 (Discuss step) carries the fact-shaped-unknown branch. developer/team-lead carry **no** fact-shaped-unknown branch (prediction #2 falsified — scoping is clean). L93 codebase-facts corollary intact (prediction #3 falsified). |
| 3 — Release (bump + regenerate) | Implemented | plugin.json 1.8.1 → **1.8.2** (PATCH); CHANGELOG `[1.8.2] — 2026-06-13` entry present; 5 command files regenerated and carry the D1 clause (architect/developer/po/solo/team-lead); modified set = exactly the 14 plugin files claimed. `release-plugin` logged in skill-invocations.log (agent=developer, token=developer:implement) — the one mapped skill invoked. Validation `--strict` reported passing; omni twin `--check` in sync (separate `../omni` repo, commits separately). |

**Skill conformance:** Plan Skill Mapping = Steps 1-2 `Skill: None` (prose authoring, all-`None`
exemption — verified the exemption is legitimate: pure rule/agent prose, no pattern skill applies),
Step 3 `Follow release-plugin`. The scoped log contains exactly `nexus:release-plugin`
(`developer:implement` token) — the single non-`None` mapping is satisfied. `## Skills Used` section
present and corroborated by the log. No fabricated invocations; no missing mapped skill. PASS.

**Deviations (all valid, all pass):**
- **Step 1 acceptance grep string is stale** — the acceptance line greps the literal `"unconfirmed
  assumption"` (adjacent words) but the plan **body** prescribes "unconfirmed **load-bearing**
  assumption" (4×). The two are inconsistent *within the plan*. Developer correctly honored the plan
  body's load-bearing wording; substance verified with `unconfirmed.{0,20}assumption` → 6 hits/6 files.
  Deviated (valid reason) — the plan's own body is the load-bearing instruction, the bare-substring
  grep is a convenience check that omitted the qualifier. **Not a Missing.**
- **research-before-asking.md rewritten, not appended** — source was an 8-line stub fully subsumed by
  the new protocol's "The offer" section; a full `Write` lost no content. Plan intent ("expand …
  rename"), executed as a rewrite. Valid.
- **solo.md pointer placed in the Workflow "Discuss" step** — plan said "add the one-line pointer"
  without pinning a line; Discuss is the semantic home (where solo decides what to recommend). Valid.

**Open production / carry-over notes (informational, not blocking):**
- The omni twin lives in a **separate sibling repo** (`../omni`) — `gen-omni.mjs --check` reports in
  sync, but it needs its **own commit there**; it is not part of this repo's same-commit set. Team
  lead: two commits (this repo + ../omni).
- Pre-existing nexus-dotnet frontmatter test failure (`create-module-claude-md` `disable-model-invocation`)
  is present at HEAD, untouched by this feature — do not attribute to this work.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-13*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer), 2026-06-13. Fresh read of plan.md, implementation.md, and all modified plugin files via grep and direct Read. No self-report trusted without grounded grep verification.

## Verdict: APPROVED

## Pre-commitment Predictions
1. **D1 clause in team-lead.md might be mis-worded** — predicted the fitted clause might be a loose copy-paste given team-lead's differently-worded line. FALSIFIED — clause correctly fitted to existing sentence.
2. **research-before-asking.md might duplicate agents-workflow.md L93 content** — predicted the hard-rule block might be collapsed into the rule file. FALSIFIED — L93 retains its full hard rule + codebase-facts corollary; rule file holds only the expanded protocol.
3. **solo.md D2 pointer might land in wrong location** — plan said add a pointer without pinning a line. FALSIFIED — placed in Workflow step 2 Discuss, the semantic home for pre-recommendation research.
4. **D2 might have leaked into developer.md or team-lead.md** — recurring scoping failure class. FALSIFIED — grep confirms neither carries fact-shaped-unknown, research-before-asking, or depth-dial.
5. **"I can research" might have orphan instances after F3 reconciliation** — FALSIFIED — exactly 4 sanctioned owners: research-before-asking.md, agents-workflow.md:93, po.md:86, architect.md:71.

## Findings

No CRITICAL or HIGH findings.

## Carry-Over Findings

All four developer-flagged carry-overs addressed:

1. **Step 1 acceptance grep string mismatch (LOW — valid deviation confirmed):** Plan acceptance greps literal "unconfirmed assumption" (0 hits) but the plan body prescribes "unconfirmed load-bearing assumption" (the implemented phrase). Developer correctly honored the body; regex check confirms 6 hits across 6 files. Substance met; string-drift is a plan authoring issue, not a code defect. CONFIRMED NON-ISSUE.

2. **Pre-existing nexus-dotnet frontmatter test failure (LOW — not caused by this work):** plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md carries disable-model-invocation: true at HEAD; nexus-dotnet untouched by this feature. CONFIRMED PRE-EXISTING, NOT ATTRIBUTABLE.

3. **commands/*.md are generated mirrors (LOW — informational):** Only the 5 edited agents produce command diffs. Grep confirms unconfirmed load-bearing assumption appears in exactly 5 command files (architect, developer, po, solo, team-lead). CONFIRMED CORRECT.

4. **omni twin is a separate sibling repo (LOW — action for team lead):** gen-omni.mjs --check passed (twin in sync); twin lives in ../omni and commits separately. No action needed in this repo. CONFIRMED — team lead needs a separate commit in ../omni.

## Positive Observations

- D1 clause correctly fitted to team-lead's differently-worded line: "A relayed below-High label may now be assumption-derived — relay as-is, never silently upgrade" reads naturally in context, not like copy-paste.
- D2 scoping is precise: po/architect/solo all carry the fact-shaped-unknown branch; developer and team-lead carry only D1 with no D2 leakage.
- No protocol duplication: full Research and Confidence Protocol lives only in research-before-asking.md; all agent references are one-line pointers, not restatements.
- L93 preserved intact: hard rule + codebase-facts corollary remain in the All-Agents block; pointer appended, not a replacement. Directly addresses plan concern F4.
- "I can research" exactly 4 sanctioned owners, no stray copies.
- Stryker failure class covered: agents-workflow.md:92 names the scenario inline with the example "X is unsupported — never checked — into a confident wrong verdict."

## Gaps

None. Developer/team-lead D2 and the research branch are explicitly scoped out per Q2 resolution. P2/P3/P4 items are documented out of scope.

## Open Questions

None. All low-confidence areas resolved through direct file reads and grep verification.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| D1 clause in all 6 files | pass | grep "unconfirmed load-bearing assumption" agents + rules | 6 hits: agents-workflow.md:92, po.md:102, architect.md:275, solo.md:33, developer.md:128, team-lead.md:26 |
| D2 scoped to po/architect/solo only | pass | grep -l "fact-shaped unknown" agents/*.md | solo.md, po.md, architect.md -- NOT developer.md or team-lead.md |
| "I can research" owners reconciled | pass | grep -l "I can research" agents/*.md rules/*.md | rules/research-before-asking.md, rules/agents-workflow.md, agents/po.md, agents/architect.md -- exactly 4 |
| L93 codebase-facts corollary intact | pass | Read agents-workflow.md:93 | Full hard rule + corollary + pointer to research-before-asking.md |
| plugin.json bumped to 1.8.2 | pass | Read plugins/nexus/.claude-plugin/plugin.json | "version": "1.8.2" |
| CHANGELOG entry present | pass | Read plugins/nexus/CHANGELOG.md | [1.8.2] -- 2026-06-13 with D1 + D2 descriptions |
| 5 command files carry D1 clause | pass | grep -l "unconfirmed load-bearing assumption" commands/*.md | architect.md, developer.md, po.md, solo.md, team-lead.md |
| research-before-asking.md is topical owner | pass | Read plugins/nexus/rules/research-before-asking.md | Full protocol: third unknown-category, depth dial, capture-before-surface, the offer |

*Status: COMPLETE -- reviewer, 2026-06-13*