# F4-ResearchBoostedAsks — Implementation Plan

**Feature Spec:** `docs/specs/F4-ResearchBoostedAsks/definition/spec.md`

## Context

The Research & Confidence Protocol requires agents to *offer* research beside medium/low-confidence
questions as prose — no click path in a batched interview. The spec upgrades the depth dial's offer
branch to a first-class, selectable option on **boostable asks** (user-decision question whose
recommendation rests on an expensive, fact-shaped, user-mootable input), with a one-round cap,
re-ask-boosted semantics, and a relayed-path carrier on the question record. All changes are prose
edits to shipped nexus plugin files (rules, one format skill, four agent files) — no runtime source,
no change to the `research` skill itself (spec BR5 consumes it as-is).

## Scope

**In:** `research-before-asking.md`, `agents-workflow.md` (All-Agents block), `questions-format`
skill, `po.md` / `architect.md` / `solo.md` / `team-lead.md` agent files, command regeneration,
MINOR release bump (user-confirmed 2026-07-12).
**Out:** the `research` skill and `research-entry-schema` (unchanged); unattended behavior (spec
BR11 — no edits to autonomy rules); confidence vocabulary; nexus-dotnet / analytics plugins.

**Tree note:** the working tree carries F3-AnalyticsBorrowWave dirt (backlog, docs/research). Scope
staging to F4 files at commit; at bump time verify the dry-run reasons list names only F4 files
(CLAUDE.md multi-agent-tree rule).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | research-before-asking.md §The offer rework | Prose-edit step; no skill gap |
| 2 | (none) | — | no | agents-workflow.md L165–166 amendments | " |
| 3 | (none) | — | no | questions-format field + routing | " |
| 4 | (none) | — | no | po/architect/solo offer-sentence updates | " |
| 5 | (none) | — | no | team-lead relay duty | " |
| 6 | release-plugin | Follow | no | gen-commands + MINOR bump for F4 | |

TDD is `no` throughout — every step edits agent/rule prose with no executable behavior; acceptance
is grep-based (see per-step gates) plus the prose-angle review at Step 2 of the pipeline.

## Domain Model Changes

None — prose/protocol artifacts only.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Rework `plugins/nexus/rules/research-before-asking.md` §"The offer"

**File:** `plugins/nexus/rules/research-before-asking.md` (canonical home — D2 in ## Decisions).
**Anchor (before):** the section `## The offer (the L93 corollary, expanded)` (L69–79), whose body is
the prose-quote form only ("I can research {X} … want me to, or do you already have a direction?").
**After — the section must carry, in the plugin's rule voice:**
- The **boostable ask** definition, verbatim in substance from spec §Concepts: user-decision question,
  confidence medium|low **because** it rests on an unconfirmed **expensive** fact-shaped input the
  user can moot by answering. The three exclusions: question-itself-fact-shaped → auto-research
  (existing default, unchanged); cheap input → silent resolve (unchanged); pure preference → never
  boostable. Include the spec's worked example (tracker-integration scope call) — it is the
  two-agents-draw-the-same-line device the spec review demanded.
- The **research option**: on a boostable ask presented through a clickable surface
  (`AskUserQuestion`), the offer is an **option in the question itself**, never only prose. Canonical
  shape (D3): label `Research first: {short target}`; description `~{cost}. Defers this answer — the
  agent researches and re-asks with a boosted recommendation.` A generic "let me research" option is
  malformed (spec BR3).
- **Round semantics:** click → resolve through the `research` skill exactly as this rule already
  routes (recall → dive → `/deep-research` recommendation, capture-before-surface; no new engine
  text — cite the existing §Capture and recall). Then **re-ask the same question** boosted (updated
  Recommendation + Confidence), never an open menu (BR6). **One round per question** — the re-asked
  question never carries the option again; residual uncertainty goes in the recommendation's why
  (BR7). A declined `/deep-research` re-asks unchanged, marked cold (spec Flow 4).
- **Full option budget:** the option never evicts a substantive answer; at the 4-option cap it
  becomes a **companion yes/no question in the same batch** ("Research {X} first? (defers this
  answer)"); if the user both answers and requests research, **the answer wins** and research is
  skipped (BR9).
- **Mixed batch:** answered questions proceed immediately unless dependent on a question still in
  research — dependent answers are **held** until that round resolves (BR8).
- **Prose fallback** survives only for surfaces with no clickable ask (BR12's carve-out). State
  explicitly that the option is **attended/clickable-only** — an unattended run has no clickable
  surface, so BR11's guarantee is textual, not inferred.
- **Cross-ref repair (critic F-1):** the file's stale `L92`/`L93` references to agents-workflow
  (intro L4, L24, L35, the §title at L69) are replaced with **section-name references** ("the
  All-Agents confidence-label and offer-research bullets") — Step 2 shifts those line numbers again,
  so numeric refs must go.
**Accept:** `grep -c "boostable" plugins/nexus/rules/research-before-asking.md` ≥ 3;
`grep -n "Research first:" plugins/nexus/rules/research-before-asking.md` hits the option template;
`grep -n "answer wins" plugins/nexus/rules/research-before-asking.md` hits the companion-question
rule; `grep -c "L9[23]" plugins/nexus/rules/research-before-asking.md` = 0 (stale refs gone); the
existing §Capture-and-recall body text is unmodified.
**Satisfies:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9 (definition layer).

### Step 2 — Amend `plugins/nexus/rules/agents-workflow.md` All-Agents rules

**File:** `plugins/nexus/rules/agents-workflow.md`.
**Anchors (before):** the two hard-rule bullets at L165 ("Tag every user-facing recommendation with a
confidence label…") and L166 ("Offer research before a cold answer…").
**After:**
- L166's bullet states the **primary form**: on a boostable ask through a clickable surface, the
  offer is a selectable research option (named target + cost); prose remains the fallback form for
  non-clickable surfaces. Keep it compact — one or two sentences pointing at
  `research-before-asking.md` for the full semantics (D2: no restatement; the rule file stays the
  single owner).
- L165's bullet gains one clause: the recommended option's description carries the confidence label,
  *and on a boostable ask the question also carries the research option per research-before-asking.md*.
**Accept:** `grep -n "research option" plugins/nexus/rules/agents-workflow.md` hits both bullets;
neither bullet exceeds its current paragraph shape by more than ~3 sentences (read check — the
canonical semantics must NOT be duplicated here).
**Satisfies:** BR12.

### Step 3 — Extend `plugins/nexus/skills/questions-format/SKILL.md`

**File:** `plugins/nexus/skills/questions-format/SKILL.md`.
**Template change (after `**Confidence:**` line, L29):** add one optional field:
`**Research offer:** {named target} (~{rough cost})` — presence = the asking agent judged the
question boostable (D1). After a round runs, the asking agent rewrites it as
`**Research offer:** consumed ({ISO date}) — {one-line what the round found}` so a re-relay never
re-renders the option (one-round cap on the relayed path).
**Routing-rules change (the `**Rules:**` block and Consumers table):**
- The field is written **only by the asking agent** (boostability is the asker's judgment — spec
  BR10); the team lead renders it verbatim as the research option and **never re-judges, re-prices,
  or researches on the asker's behalf**.
- A user click travels back as a normal message-handoff to the asking agent ("research requested on
  Q{n}"); the asking agent runs the round, updates Recommendation + Confidence in the same Q
  section, marks the field consumed, and the team lead re-surfaces the boosted question (spec Flow 3).
- Consumers table: Team Lead row gains the render-verbatim + route-click-back duty.
**Accept:** `grep -n "Research offer" plugins/nexus/skills/questions-format/SKILL.md` hits the
template line, the rules block, and the consumers table (≥ 3 hits); `grep -n "consumed"` hits the
one-round marking.
**Satisfies:** AC-7 (carrier layer), BR10.

### Step 4 — Update the three asking agents' offer sentences

**Files / anchors (before → after):**
- `plugins/nexus/agents/po.md` — the Question-Answering **Escalation** paragraph (the "I can research
  {X} first…" sentence, currently ~L88) and the What-You-Never-Do line "Skip the research offer →
  instead: always offer to research first": both now name the **clickable research option on
  boostable asks** as the primary form, prose as fallback, with the pointer to
  research-before-asking.md. No full protocol restatement (D2).
- `plugins/nexus/agents/architect.md` — the **Codebase Facts** paragraph (~L71, same offer sentence):
  same treatment.
- `plugins/nexus/agents/solo.md` — the **Discuss** step (~L35, currently fact-shaped-default only):
  add the boostable-ask option duty for solo's confirmation asks, one sentence + pointer.
- **Deliberately unchanged (critic F-2):** `po.md:21` ("3. **Research** — … Offer to research before
  asking.") is the pre-interview shaping reminder, not a boostable ask — it stays as-is; this line
  records the disposition so the reviewer doesn't flag it as missed.
**Accept:** `grep -l "research option" plugins/nexus/agents/po.md plugins/nexus/agents/architect.md
plugins/nexus/agents/solo.md` returns all three; `grep -n "I can research" plugins/nexus/agents/*.md`
— every remaining hit sits inside a sentence that names the option as primary/fallback context (read
check on the ≤3 hits).
**Satisfies:** spec §Scope (asking agents), AC-1.

### Step 5 — Extend `plugins/nexus/agents/team-lead.md` relay duty

**File:** `plugins/nexus/agents/team-lead.md`.
**Anchor (before):** the confidence-relay hard-rule bullet at L26 ("Put a choice to the user without
a confidence label → … Preserve an agent's confidence when relaying…").
**After:** the same bullet (or an adjacent sentence — developer's call, D4) extends the
preserve-verbatim duty to the `Research offer` field: render it by applying the D3 option template
to the field's target + cost, **changing neither** ("verbatim" = never re-judge/re-price/execute —
not literal string copy); route a click back to the asking agent as a standard message-handoff;
re-surface the boosted question when it returns. Point at questions-format for the field,
research-before-asking for semantics.
**Accept:** `grep -n "Research offer" plugins/nexus/agents/team-lead.md` ≥ 1 hit inside the relay
rules; `grep -n "re-judge" plugins/nexus/agents/team-lead.md` hits the never-re-judge clause.
**Satisfies:** AC-7 (relay layer), BR10.

### Step 6 — Regenerate commands, bump, changelog — Follow release-plugin

After Steps 1–5 land (never mid-sequence — CLAUDE.md bump rule):
- `node scripts/gen-commands.mjs nexus` — regenerates `plugins/nexus/commands/{po,architect,solo,team-lead}.md`
  from the edited agents.
- Contamination gate (critic F-4 — the dry-run's reasons are **category labels**, not file paths,
  so they can't prove scope): run `git status --porcelain -- plugins/nexus/` and confirm the changed
  plugin files are **exactly** the F4 set (2 rules, 1 skill, 4 agents, 4 regenerated commands,
  plugin.json, CHANGELOG). Then `node scripts/bump-plugin.mjs --minor --note "clickable research
  option on boostable asks (rules + questions-format + agents), one-round cap, relayed-path
  carrier"` (tier user-confirmed 2026-07-12; `--note` supplies the feature-naming CHANGELOG bullet).
- Follow release-plugin for the mechanics; the bump commits **with** the content (team lead's commit
  protocol at close).
**Accept:** commands diff contains only Step-4/5-derived changes (`git diff --stat
plugins/nexus/commands/` lists exactly the four regenerated files); `git status --porcelain --
plugins/nexus/` ⊆ F4 file set; `plugin.json` minor-bumped once.
**Satisfies:** release policy (dev-repo concern; no spec AC).

## Cross-Service Changes

None. The omni twin sync (`gen-omni.mjs`) rides the normal post-bump flow in the `../omni` repo —
team-lead close concern, not a plan step (per CLAUDE.md, deferred when the tree is shared).

## Migration Notes

None — no data, no config. Consuming projects pick the behavior up via `/plugin update` after
release.

## Testing Strategy

No runtime surface — verification is structural + review-based:
1. The per-step grep gates above (all executed at plan time against current files to confirm
   anchors exist; expected-hit counts written from those runs — anchors verified 2026-07-12).
2. Step-2-of-pipeline review runs the **docs/rules-only prose angle set** (internal consistency,
   dangling cross-refs, dropped guarantees, stale adjacent sentences) — not the code checklist.
3. Dogfood check (manual, reviewer): one boostable ask rendered per the new rule carries the option
   with target + cost; a high-confidence ask does not (spec AC-1/AC-2 are observable in any
   post-ship interview).

## KB Impact

None — this repo ships no `docs/kb/` consumers for protocol rules; the architecture README needs no
new ADR (the change lives under the existing ADR-25/ADR-26 umbrella: it re-shapes the offer branch,
reverses no decision).

## Decisions

| Decision | Why | Rejected alternative | Status |
|----------|-----|---------------------|--------|
| D1 — one optional `**Research offer:**` field (target + cost in one line; rewritten to `consumed (…)` after the round) | Smallest carrier that holds mark + target + cost + one-round state | Three separate fields (`Boostable/Target/Cost`) — more surface, no added meaning | decided |
| D2 — canonical semantics live in `research-before-asking.md`; all other files carry one-sentence pointers | It is already the protocol's declared single topical owner; restatement = drift risk | Restating the option rules in each agent file | decided |
| D3 — option template: label `Research first: {short target}`, description = cost + defers-and-re-asks | Uniform render across agents; the label carries the target so a batch scan shows what each option researches | Free-form per-agent wording | decided |
| D4 — click routing reuses the existing message-handoff machinery verbatim; exact team-lead bullet placement is the developer's call | No new mechanism needed; placement is internal prose structure | A new dedicated handoff type in the pipeline diagram | decided |

## Open Questions

None — spec ambiguities were closed in the PO's critic round; review mode (critic, code-grounded)
and bump tier (MINOR) user-confirmed 2026-07-12.

## Plan Review

Code-grounded critic (Mode 2) ran 2026-07-12 — verdict **ACCEPT (GO)**, all cited anchors verified
against live files, no vacuous accept-gates, all 12 BR + 9 AC mapped. Five findings, all folded:
F-2 (MEDIUM) po.md:21 disposition now explicit in Step 4; F-1 stale L92/L93 cross-refs added to
Step 1's scope + a zero-hits gate; F-3 AC-4/AC-6 added to Step 1 Satisfies; F-4 Step 6 contamination
gate reworded to `git status --porcelain -- plugins/nexus/` and the bump invocation gained `--note`;
F-5 Step 5 clarifies "verbatim" = template-render without re-judging. BR11 hardening (attended/
clickable-only stated textually) folded into Step 1.
