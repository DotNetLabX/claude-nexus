# Confidence-Gated Research (P1)

**Feature Spec:** None (ad-hoc; proposal `docs/proposals/research-confidence-gated.md`)

## Context

Make a below-High confidence label *do* something instead of sitting as an annotation, and stop the
Stryker failure class: an **unconfirmed assumption treated as fact** ("MTP not supported") producing a
confident wrong verdict (NO-GO).

**Grounding finding (changes the scope) — ~60% of P1 already ships:**
- `rules/agents-workflow.md` **L92** already mandates the confidence label (high/medium/low + basis) —
  a hard rule in the "All Agents" block, and the team lead's confidence-relay rule is on the same line.
- `rules/agents-workflow.md` **L93** already has "offer research before a cold answer" + the
  load-bearing corollary "**codebase facts are never user questions — look them up**" (echoed at
  `architect.md:69`, `po.md:98`).
- `rules/research-before-asking.md` is an 8-line offer stub (overlaps L93).

P1's real novel delta is four things only: **(D1)** confidence is **lowered by an unconfirmed
load-bearing assumption**, and such an assumption is a *research target*, not a basis; **(D2)** a
**third unknown-category** — a fact-shaped unknown you can't resolve from current context — where
**research is the default move before a verdict** (today's rules cover only grep-able codebase facts and
user-facing questions); plus the **depth dial** and **minimal capture**, which ride with D2.

**Scope shape (the axis the review exposed):** **D1 is universal** — it refines the *confidence rule*,
which is inlined in all 5 agents that carry it; per ADR-2 #2 + ADR-14 each inlined copy must get it (a
pointer doesn't reach a spawned subagent). **D2 is scoped** to po/architect/solo per Q2.

## Scope

**In scope:** D1 (assumption→confidence) into the canonical rule + **all 5** agent confidence lines;
D2 (fact-shaped-unknown→research) + depth dial + capture-before-surface as a protocol, scoped to
po/architect/solo; expand `research-before-asking.md` into the topical owner of the protocol while
keeping L92/L93 full hard rules. All soft-harness (prose).

**Out of scope:** the research-KB schema + `search-researches` skill (P2); retention/eviction (P3);
persona (P4); the **developer**'s D2/research branch and **team-lead**'s D2 (Q2 — both still get D1);
any hook/gate enforcement (capture flagged inline as a *future* gate candidate per the allocation
principle, not built).

**Surfaces intentionally NOT touched (F8 — documented so the divergence is deliberate):**
`architect.md:196` (the `Confidence:` field on *plan steps* — a developer-facing pattern-clarity axis,
not the user-recommendation axis); the Checkpoint Report Format's `confidence:` on action options
(`architect.md:351`, `developer.md:210` — inherits meaning from the rule, no edit needed);
`po.md:74-83` (the PO's `confidence: high | inferred | none` *spec-citation* enum — a different
vocabulary).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|-------------------------|------|
| 1 | (none) | — | no | D1: `agents-workflow.md:92` + inlined confidence line in **5** agents (po:102, architect:275, solo:33, developer:128, team-lead:26) | |
| 2 | (none) | — | no | D2: expand `research-before-asking.md`; keep `agents-workflow.md:93` full + pointer; reconcile inlined offers in po:86 / architect:71; add pointer to solo | |
| 3 | release-plugin | Follow | no | bump `nexus` (PATCH), `gen-commands.mjs nexus` (**5** agents changed), `gen-omni.mjs` | |

All steps `TDD: no` — prose, not testable code (the "Stryker scenario covered by rule text" check is
the review's job). Steps 1-2 `Skill: None` (prose authoring — all-`None` exemption applies, verified
`architect.md:238`). Step 3 **Follow release-plugin** is the one real skill invocation.

## Domain Model Changes
N/A — plugin-content change.

## Data Model Changes
N/A.

## Implementation Steps

### Step 1 — D1 (universal): an unconfirmed assumption lowers confidence
**Files:** `plugins/nexus/rules/agents-workflow.md` (L92, the "All Agents" hard rule); and the inlined
confidence line in **all five** agents — `plugins/nexus/agents/po.md` (L102), `architect.md` (L275),
`solo.md` (L33), `developer.md` (L128), `team-lead.md` (L26).

- **agents-workflow.md L92:** add that confidence is **lowered by an unconfirmed load-bearing
  assumption** — a verdict resting on an assumption you could not confirm is **not High**, and the
  assumption is a *research target*, not a basis. Make explicit that "a clear basis" means a
  **confirmed** basis (the exact Stryker correction: a belief is not a basis). Keep the line a full
  hard rule.
- **All 5 inlined agent copies:** extend the existing "Surface a recommendation without a confidence
  label …" one-liner with the assumption clause (one sentence + "See agents-workflow.md"). The inlined
  copy is the ADR-14 backstop — a pointer alone does not reach a spawned subagent (ADR-2 #2), so the
  clause must be present in each file, not just referenced.
- **team-lead.md L26 (F7):** also note a *relayed* below-High label may now be assumption-derived —
  don't silently upgrade it; the team lead's own self-generated confidence obeys the same refinement.

**Acceptance:**
- `grep -rn "unconfirmed assumption" plugins/nexus/agents/ plugins/nexus/rules/agents-workflow.md` →
  the clause is present in agents-workflow.md L92 **and all 5 agent files** (6 hits minimum).
- The Stryker scenario is covered: an unconfirmed "X unsupported" assumption forces below-High.
- `developer.md` and `team-lead.md` carry the D1 clause (they get D1, not D2).

### Step 2 — D2 (scoped po/architect/solo): fact-shaped unknown → research, + depth dial + capture
**Files:** `plugins/nexus/rules/research-before-asking.md`; `plugins/nexus/rules/agents-workflow.md`
(L93); `plugins/nexus/agents/po.md` (L86), `architect.md` (L71), `solo.md`.

- **research-before-asking.md** becomes the single topical owner — rename to a **Research & Confidence
  Protocol** and add the genuinely-new, non-duplicative material: (a) the **third unknown-category** —
  a fact-shaped unknown you cannot resolve from current context (not a grep-able codebase fact, not a
  user preference) → **research is the default action before you render a verdict**; (b) the **depth
  dial** — cheap/local → resolve silently; expensive/external → recommend as an option **with a rough
  cost estimate**; (c) **capture-before-surface** — write findings to `docs/kb/research/{topic}.md`
  *before* surfacing the summary (a bare convention; schema + recall are P2; the folder is created
  lazily in the consuming project — the plugin never ships it, ADR-1).
- **agents-workflow.md L93 (F4 — do NOT collapse to a bare pointer):** keep it a **full hard rule**
  (offer-research + the "codebase facts are never user questions" corollary) and append "See
  research-before-asking.md for the full Research & Confidence Protocol (depth dial, capture,
  fact-shaped-unknown)." Only the *expanded protocol* moves to the rule file; the hard rule + its
  corollary stay in the All-Agents block.
- **po.md:86 / architect.md:71 (F3 — reconcile, don't duplicate):** these already inline the "I can
  research {X} first" offer — the legitimate ADR-14 backstop. **Update** those existing lines to the
  protocol's new meaning (the fact-shaped-unknown branch); do not add a second copy. **solo.md** has
  no offer line — add the one-line research-branch pointer.

**Acceptance:**
- `grep -rn "I can research" plugins/nexus/rules/ plugins/nexus/agents/` → the offer appears in
  `research-before-asking.md` (topical owner), `agents-workflow.md:93` (hard rule + pointer), and the
  intentional ADR-14 backstops `po.md` / `architect.md` — **and nowhere else**; no two of them state
  the *expanded protocol* (only the owner does). (Corrects the prior rules-only false-green grep.)
- The codebase-facts corollary remains on `agents-workflow.md:93` (not silently dropped into the rule
  file).
- po/architect/solo carry the D2 branch; developer/team-lead do **not**.

### Step 3 — Release (bump + regenerate)
**Files:** `plugins/nexus/.claude-plugin/plugin.json` (F1 — corrected path), `plugins/nexus/CHANGELOG.md`
(via the skill), regenerated `plugins/nexus/commands/{po,architect,solo,developer,team-lead}.md`, the
`omni` twin.

**Follow release-plugin** — propose a **PATCH** (default for a shipped-file change; owner escalates if
they consider the new behavior a MINOR capability). The skill owns the real manifest path. Then
`node scripts/gen-commands.mjs nexus` — **5** agent bodies changed (all 5 got D1; 3 also got D2), so 5
commands regenerate (F5). Then `node scripts/gen-omni.mjs` (twin rides the bump). The team lead commits
content + bump + regenerated artifacts as one commit (ADR-9/ADR-20).

**Acceptance:** `plugin.json` version bumped + CHANGELOG entry; **5** regenerated command files reflect
the agent edits; `claude plugin validate plugins/nexus --strict` passes; omni twin regenerated.

## Cross-Service Changes
N/A.

## Migration Notes
N/A.

## Testing Strategy
No executable tests (prose change). Verification is the code-grounded review (below) confirming: the
Stryker scenario is covered by rule text, D1 reaches all 5 agents, D2 stays scoped to 3, the "I can
research" owners are reconciled (not collapsed), and the L92-93 hard-rule block + corollary are intact.
Run any `tests/` rule-injection / skill-lint checks after Step 3.

## KB Impact
None in the plugin repo. The `docs/kb/research/` convention is a *consumer-project* runtime path, not a
plugin KB entry — P2 gives it a schema.

## Plan Review (code-grounded — Q3)

Independent code-grounded review run 2026-06-13. **Disclosure:** the chosen reviewer was the Nexus
`critic`, but it is `disallowedTools: Write,Edit` (message-only) and its findings were lost twice to
background-spawn inline truncation (the ADR-16/17 failure). Recovered with a fresh general-purpose
code-grounded reviewer that **wrote** its findings to
`docs/specs/adhoc-ConfidenceGatedResearch/delivery/plan-review-findings.md` (the durable evidence) —
still independent, fresh-context, file-grounded; substituted only because the critic cannot write.

**Verdict: GO-with-fixes.** All four blocking findings folded into the revised steps above:

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| F1 | HIGH | `plugin.json` path is `.claude-plugin/plugin.json` | Fixed — Step 3 path corrected / deferred to skill |
| F2 | HIGH | D1 under-scoped to 3 agents; a pointer doesn't reach a subagent (ADR-2 #2/ADR-14) | Fixed — D1 inlined into all 5 (Step 1) |
| F3 | HIGH | "I can research" has 4 owners; rules-only acceptance grep was a false green | Fixed — Step 2 reconciles po:86/architect:71; acceptance grep widened |
| F4 | MED→HIGH | Don't collapse L93 to a bare pointer (hard rule + codebase-facts corollary) | Fixed — Step 2 keeps L92/L93 full + pointer |
| F5 | LOW | gen-commands count 3→5 | Fixed — Step 3 says 5 |
| F7 | MED | team-lead is a missed confidence-relay surface | Fixed — folded into Step 1 D1 |
| F8 | LOW | document untouched surfaces | Fixed — Scope section |

Root cause flagged by the review: "edit the canonical rule" ≠ done when ADR-2 #2 + ADR-14 require the
inlined agent copies too — applied for D2 but originally dropped for D1.

## Open Questions
None — Q1/Q2/Q3 resolved in `questions.md`.
