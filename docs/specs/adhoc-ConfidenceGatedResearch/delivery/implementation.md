# Confidence-Gated Research (P1) — Implementation

## Files Modified

### Step 1 — D1 (universal): an unconfirmed assumption lowers confidence
- `plugins/nexus/rules/agents-workflow.md` (L92) — extended the canonical confidence hard rule:
  added that **a clear basis means a confirmed basis (a belief is not a basis)**, that confidence is
  **lowered by an unconfirmed load-bearing assumption** (a verdict/recommendation resting on an
  unconfirmable assumption is **not High**), and that such an assumption is a **research target, not a
  basis**. Names the Stryker failure inline ("X is unsupported" — never checked — confident wrong
  verdict). Kept the line a full hard rule.
- `plugins/nexus/agents/po.md` (L102), `architect.md` (L275), `solo.md` (L33), `developer.md` (L128)
  — extended the byte-identical inlined "Surface a recommendation without a confidence label" one-liner
  with the assumption clause + "research target, not a basis", and tightened "clear basis" →
  "clear *confirmed* basis". Per-file Edit (the one-liner is identical across the four files; per
  lessons.md Edit-uniqueness note — each is unique within its own file). The inlined copy is the
  ADR-14 backstop: a pointer alone doesn't reach a spawned subagent (ADR-2 #2), so the clause lives in
  each file, not only behind the pointer.
- `plugins/nexus/agents/team-lead.md` (L26, F7) — differently-worded confidence line ("Put a choice
  to the user…"). Added that a **relayed below-High label may now be assumption-derived** — relay
  as-is, never silently upgrade; the team lead's own self-generated confidence obeys the same
  refinement. Clause fitted to the existing sentence (not a copy of the other four).

### Step 2 — D2 (scoped po/architect/solo): fact-shaped unknown → research, + depth dial + capture
- `plugins/nexus/rules/research-before-asking.md` — **rewritten** from the 8-line "Research Offering
  Protocol" stub into the **Research & Confidence Protocol**, the single topical owner. New,
  non-duplicative material: (a) the **third unknown-category** — a fact-shaped unknown you can't
  resolve from current context (not a grep-able codebase fact, not a user preference) → research is
  the **default before a verdict**, tied back to the L92 assumption rule; (b) the **depth dial** —
  cheap/local → resolve silently, expensive/external → recommend as an option **with a rough cost
  estimate**; (c) **capture-before-surface** — write findings to `docs/kb/research/{topic}.md` before
  surfacing the summary (bare convention; schema/recall = P2, retention = P3; folder created lazily in
  the consuming project — plugin never ships it, ADR-1; capture is a convention, gate is a future
  candidate). Kept the "I can research {X}" offer (topical owner must retain it).
- `plugins/nexus/rules/agents-workflow.md` (L93, F4) — **kept the full hard rule** (offer-research +
  the "codebase facts are never user questions" corollary, both intact) and **appended** a pointer to
  research-before-asking.md naming the depth dial, capture, and fact-shaped-unknown. Did **not**
  collapse to a bare pointer.
- `plugins/nexus/agents/po.md` (L86), `architect.md` (L71) (F3) — **updated** the existing inlined
  "I can research {X}" offer lines to add the fact-shaped-unknown branch (research is the *default*,
  not an offer, for a fact you can't resolve from context) + pointer to the protocol. Reconciled the
  existing ADR-14 backstop — did **not** add a second copy.
- `plugins/nexus/agents/solo.md` (Workflow step 2 "Discuss") — solo had **no** offer line; added a
  one-line research-branch pointer: if a recommendation rests on a fact-shaped unknown, research it
  before recommending. Placed in the Discuss step (where solo decides what to recommend) — the precise
  home for it.

### Step 3 — Release (bump + regenerate)
- `plugins/nexus/.claude-plugin/plugin.json` — version bumped **1.8.1 → 1.8.2** (PATCH) via
  `node scripts/bump-plugin.mjs`. Dry-run classified it PATCH (agent instruction/behavior change +
  rule injected every session); no escalation — within-intent prose/behavior tightening.
- `plugins/nexus/CHANGELOG.md` — the tool's stub `[1.8.2]` entry replaced with a real description of
  D1 (universal confidence refinement, 5 agents) and D2 (scoped research protocol, 3 agents).
- `plugins/nexus/commands/{po,architect,solo,developer,team-lead}.md` — regenerated via
  `node scripts/gen-commands.mjs nexus`. gen-commands rewrites all command files, but only these 5
  show a git diff (the 5 edited agents). reviewer/critic/learner commands regenerated identically
  (no agent change) → no diff. Matches plan F5 (5 commands reflect edits).
- **omni twin** (sibling repo `../omni`, ADR-6) — regenerated via `node scripts/gen-omni.mjs`;
  `gen-omni.mjs --check` → "omni twin is in sync." The twin lives in its own repo (not a subfolder of
  this one), so it does not appear in this repo's `git status`; the bumped plugin.json + CHANGELOG +
  edited content rode along automatically.
- **Validation:** `claude plugin validate plugins/nexus --strict` → passed.

**NOTE for the team lead (commit owner):** I stopped before commit/tag per ADR-18/ADR-20. The
same-commit set is the 14 modified `plugins/nexus/` files (2 rules, 5 agents, 5 commands, plugin.json,
CHANGELOG) + this implementation.md + lessons.md. The omni twin in `../omni` is a **separate repo**
and needs its own commit there.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | prose authoring; plan Skill Mapping: `Skill: None`, `TDD: no` (all-`None` exemption, verified architect.md:238) |
| 2 | None | prose authoring; plan Skill Mapping: `Skill: None`, `TDD: no` (all-`None` exemption) |
| 3 | release-plugin | invoked before any release work (skill-first); followed its procedure (dry-run → PATCH → CHANGELOG edit → gen-commands → gen-omni + --check → validate). Stopped before commit/tag (team lead owns it). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Step 1 acceptance grep won't match the plan's own prescribed wording | low | reviewer | plan body says "unconfirmed **load-bearing** assumption" (4×) but acceptance greps the adjacent-word `"unconfirmed assumption"` → 0 hits | Use `"unconfirmed load-bearing assumption"` or `unconfirmed.*assumption` → 6 hits across 6 files. Substance met. |
| Pre-existing nexus-dotnet frontmatter test failure | low | reviewer | `nexus-dotnet/skills/create-module-claude-md/SKILL.md` has `disable-model-invocation: true`; present at HEAD; nexus-dotnet untouched by this feature | NOT caused by this work — do not re-investigate (already flagged in Phase-1 lessons.md). |
| `commands/*.md` confidence lines are generated mirrors | low | reviewer | only the 5 edited agents produce command diffs; reviewer/critic/learner regenerate identically | The 5 command diffs are gen-commands output, not hand-edits — review the agent files, not the commands. |
| omni twin is a separate sibling repo (`../omni`), commits separately | low | architect/team-lead | gen-omni writes to `join(NEXUS,'..','omni')`; `--check` passed; absent from this repo's `git status` | Twin needs its own commit in `../omni`; not part of this repo's same-commit set. |

## Deviations from Plan
- **Step 1 acceptance grep string.** The plan's acceptance line greps `"unconfirmed assumption"`
  (adjacent words) for "6 hits minimum", but the plan **body** prescribes the phrase "unconfirmed
  **load-bearing** assumption" (4 occurrences in the plan describing exactly what to write). The two
  are inconsistent within the plan itself. Resolution: honored the plan **body's** precise, repeatedly
  specified wording ("unconfirmed load-bearing assumption") — it is the load-bearing instruction; the
  bare-substring grep is a convenience check that didn't account for the "load-bearing" qualifier.
  The acceptance **intent** ("clause present in agents-workflow.md L92 + all 5 agent files, 6 hits
  min") is fully met: `grep -rnE "unconfirmed.{0,20}assumption"` → 6 occurrences across 6 files
  (agents-workflow.md + po/architect/solo/developer/team-lead). The reviewer's acceptance grep should
  use `"unconfirmed load-bearing assumption"` or a looser `unconfirmed.*assumption`, not the literal
  two-word string.
- **research-before-asking.md rewritten, not appended.** The plan said "expand … rename to a Research
  & Confidence Protocol." The source was an 8-line stub whose entire content (the offer paragraph) is
  subsumed by the protocol's "The offer" section, so a `Write` (full rewrite) was cleaner and correct
  than a surgical `Edit` — no prior content lost, only restructured and expanded. Plan intent,
  executed as a rewrite.
- **solo.md pointer placed in the Workflow "Discuss" step, not a confidence one-liner.** The plan said
  "add the one-line research-branch pointer" without pinning a line. The Discuss step is where solo
  decides what to recommend — the precise semantic home for "research a fact-shaped unknown before
  recommending." (solo's confidence one-liner already got the D1 clause in Step 1.)

*Status: COMPLETE — developer, 2026-06-13*
