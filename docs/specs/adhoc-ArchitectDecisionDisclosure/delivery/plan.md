# Architect Decision Disclosure — "declare, don't ask" (## Decisions plan section + prose cross-checks)

**Feature Spec:** None — ad-hoc technical pass. Binding definition: the user's decisions at the
2026-07-06 checkpoint (slug, enforcement scope = prose cross-checks, review = code-grounded critic)
+ the research verdict in `docs/kb/research/po-architect-role-design.md` (§Recommendation).

## Context

The architect's "Before Acting" rule ("answer what you can, ask the rest") surfaces *open* judgment
calls but gives the *self-resolved* ones no disclosure surface — they get baked into plan steps
invisibly. The user's observed failure: rare silent important decisions. Field research (25/25
adversarially-verified claims) confirms the canonical remedy is a decision-disclosure artifact
(ADR triad: decision + rationale + rejected alternatives) with a reviewer gate that treats a
silently-skipped decision as a defect — never a stance change on the architect. This pass adds that
artifact at plan scale, keeping the architect's partner stance untouched.

## Scope

- `plugins/nexus/skills/create-implementation-plan/references/plan-template.md` — new `## Decisions` section (template body + section-map line).
- `plugins/nexus/agents/architect.md` — authoring rule, checkpoint metric, done-check one-liner.
- `plugins/nexus/agents/critic.md` — Mode 2 cross-check.
- Release: MINOR bump (user-ratified), command regen, omni sync — via release-plugin.

Out of scope: any PO-side Decisions section (separate feature if ever wanted); any deterministic
hook/lint gate (allocation principle: promote to script only on demonstrated recurrence); retroactive
flagging of plans that predate the section.

## Binding vs developer's-call

- **Binding:** the heading text `## Decisions`; the row fields (decision · why · rejected alternative · status `decided | deferred`); the explicit-empty form `None — no self-resolved calls met the disclosure bar`; the metric label `Decisions taken: N`; MEDIUM severity for the critic finding. These are cross-artifact contract surfaces (greps and other agents key on them).
- **Developer's call:** exact sentence flow and placement *within* the named target sections, so the new prose reads like the surrounding text; whether rows render as bullets or a table in the template example.

## Skill Mapping

| Step | Skill | Disposition | TDD | Gaps |
|------|-------|-------------|-----|------|
| 1 | None (agent/skill prose editing has no pattern skill) | None | no | — |
| 2 | None | None | no | — |
| 3 | None | None | no | — |
| 4 | release-plugin | Follow | no | — |

## Domain / Data Model Changes

N/A — prose-only pass, no source code.

## Implementation Steps

### Step 1: Add `## Decisions` to the plan template
**File:** `plugins/nexus/skills/create-implementation-plan/references/plan-template.md`
**Skill:** None. **TDD:** no.

Two edits:
1. **Section map (line 5):** insert `` `## Decisions` `` into the fixed top-level heading set, between `` `## KB Impact` `` and `` `## Open Questions` `` — the map order must mirror template order.
2. **Template body:** insert a `## Decisions` section immediately before `## Open Questions` with this content (binding semantics, wording may be smoothed):

> One row per judgment call the architect resolved alone: **decision · one-line why · rejected
> alternative · status (`decided` | `deferred`)**. A call earns a row when **a reasonable user might
> have decided differently AND the call is a two-way door** (reversible enough that asking first
> isn't warranted). Below that: just decide, no row. A **one-way door** (hard to reverse) is never a
> row — the ask-first machinery (questions checkpoint / ADR-25 options panel) applies, not this
> section. `deferred` marks a call explicitly left to the developer or a
> later pass; genuinely *open* items go to `## Open Questions`, not here. The section is
> **always present**; when nothing met the bar write exactly:
> `None — no self-resolved calls met the disclosure bar`. Additive: plans predating this section
> are not retro-flagged.

**Accept:** `grep -c '^## Decisions' plan-template.md` = 1 (template body) and the section-map line
contains `## Decisions` between `KB Impact` and `Open Questions`; `grep 'no self-resolved calls met the disclosure bar' plan-template.md` hits.

### Step 2: Architect authoring rule + checkpoint metric + done-check one-liner
**File:** `plugins/nexus/agents/architect.md`
**Skill:** None. **TDD:** no.

Three edits:
1. **Plan Writing Rules** — add one bullet: every plan carries the `## Decisions` section per the
   plan-template; a self-resolved judgment call clearing the ADR-25 bar gets a row *at the moment it
   is resolved* (not reconstructed afterward); an absent section or a silent empty is a defect the
   critic and done-check flag.
2. **Phase 2 auto-approve message** (step 13 of Plan Workflow, `architect.md:218`) — extend the template:
   `"For developer: Plan approved for {FeatureName} ({N} steps, Decisions taken: {M} — see ## Decisions). Begin implementation."` This message is the metric's **single authoritative home** — the architect has no Phase-2 Checkpoint Report (the Checkpoint Report Format's usage list covers Phase-1 outputs and verdicts only), and the shared headline-metrics placeholder must NOT be mutated (it serves all four checkpoint types). In standalone mode the same extended sentence closes the plan-approval message to the user.
3. **Step 1: Done Check section** — add one line: while reading the plan, confirm `## Decisions`
   exists (a row set or the explicit `None …` sentence). If missing/silent-empty, record a
   **plan-hygiene finding** in the `## Step 1 — Done-Check` section of review.md attributed to the
   architect's own artifact — it does **not** Fail the developer or the step-disposition verdict.

**Accept:** `grep -c 'Decisions taken:' architect.md` ≥ 1, with the hit inside the step-13
auto-approve message template; `grep 'plan-hygiene' architect.md` hits in the Done Check section; the Plan Writing Rules bullet greps on `## Decisions`.

### Step 3: Critic Mode 2 cross-check
**File:** `plugins/nexus/agents/critic.md`
**Skill:** None. **TDD:** no.

In the Mode-2 **"Plan reviews" checklist** (`critic.md:43-48` — not the Mode headers at 21-29), add
one checklist line: a plan under review that lacks the `## Decisions` section, or whose section is
empty without the explicit `None — no self-resolved calls met the disclosure bar` sentence, is a
**MEDIUM** finding (silent-decision hygiene); plans that predate the section are exempt — flag only
the plan under review in this run, never referenced historical plans. Write it as **one line**
carrying all three tokens: `## Decisions`, `MEDIUM`, `predate`.

**Accept:** a single `grep -n 'Decisions' critic.md` line inside the Plan-reviews checklist contains
all three tokens `## Decisions`, `MEDIUM`, and `predate` — one-line check, no `-A` window dependence.

### Step 4: Release — bump MINOR, regen, sync, validate, one commit
**Skill:** Follow release-plugin. **TDD:** no.

Run after Steps 1–3 all land (never per-step — CLAUDE.md bump-once rule). Feature-specific inputs:
escalate to `--minor` (new capability; user-ratified 2026-07-06). Agents changed → command regen
covers `commands/architect.md` + `commands/critic.md`; omni sync commit per CLAUDE.md mirror-subject
convention (`feat(adhoc-ArchitectDecisionDisclosure): sync architect decision disclosure (omni {version})`).

**Accept:** `plugins/nexus/plugin.json` version = 1.25.0; CHANGELOG.md has a 1.25.0 entry naming the
Decisions mechanism; `git diff --stat HEAD` shows content + bump + regenerated commands staged
together (ADR-9 one-commit rule); `claude plugin validate plugins/nexus --strict` passes. The omni
twin commit lands in `../omni` and is **not grep-verifiable from this repo** — its verification is
delegated to the release-plugin flow; the done-check must not expect to observe it here.

## Cross-Service Changes

N/A.

## Migration Notes

None — additive prose. Existing plans are exempt by the explicit additive clauses in Steps 1 and 3.

## Testing Strategy

No runtime surface. Every acceptance line above is a deterministic grep (mechanism, not judgment);
Step 4's validate run is the only tool-gated check. The first real exercise is the next pipeline
plan authored after release — its `## Decisions` section and checkpoint metric are observable there.

## KB Impact

None. The research entry (`docs/kb/research/po-architect-role-design.md`) already captures the
grounding and needs no update from this pass.

## Decisions

- **Section placed before `## Open Questions`, not after `## Scope`** — pairs decided-vs-open at the artifact's tail and adds no developer-facing step noise; rejected: early placement (implies developer action; pushes steps down). Status: decided.
- **Always-present section with explicit `None …` sentence** — makes absence greppable, which is the entire BMAD-gate property (silence ≠ skipped); rejected: optional section (silent absence is indistinguishable from the failure this pass fixes). Status: decided.
- **Trichotomy folded to two homes** — rows carry `decided | deferred`; *open* stays in `## Open Questions` to avoid a duplicate open-items list; rejected: full decided/deferred/open in one section (duplicates an existing heading consumers already grep). Status: decided.
- **Critic finding severity MEDIUM** — hygiene defect, shouldn't block approval the way a CRITICAL/HIGH conformance gap does; rejected: HIGH (would let a formatting miss veto a sound plan). Status: decided.
- **Done-check miss = plan-hygiene finding, not a developer Fail** — the defect is in the architect's artifact; failing the developer punishes the wrong role and pollutes the step-disposition verdict; rejected: Fail disposition. Status: decided.
- **Exact wording inside target sections left to the implementer** — binding surfaces are named in Binding vs developer's-call; prose flow should match each file's voice. Status: deferred.
- **`Decisions taken:` metric has a single home: the step-13 auto-approve message** — the architect has no Phase-2 checkpoint report, and mutating the shared headline-metrics placeholder would bleed the metric into all four checkpoint types; rejected: adding a Phase-2 row to the Checkpoint Report usage list (a bigger behavioral change than the feature needs). Status: decided. *(Resolves critic HIGH.)*
- **Row bar = user-divergence AND two-way door; one-way doors never get a row** — separates the disclosure trigger from the ask-first trigger, which previously shared "hard to reverse"; rejected: the OR-form bar (a call could match both rules at once). Status: decided. *(Resolves critic MEDIUM-1.)*
- **No ADR register entry for the `## Decisions` mandate in this pass** — the mechanism's normative home is the template + agent prose (ADR-14 self-containment), and the CHANGELOG 1.25.0 entry + research pool entry + this plan are the record; ADR-28 reserves extraction for graduated proposals. Rejected: minting an ADR now. Revisit at the next architecture-doc refresh. Status: decided. *(Disposition of critic LOW.)*

## Open Questions

None.

## Plan Review (critic, code-grounded, 2026-07-06)

**Verdict: GO-with-findings** — 1 HIGH, 2 MEDIUM, 2 LOW; no CRITICAL; no missed consumer (section
map confirmed single-sourced at `plan-template.md:5`; no test/script enumerates plan headings;
command twins + version 1.24.0 → 1.25.0 confirmed).

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | HIGH | Second `Decisions taken:` home (Phase-2 checkpoint report) doesn't exist in architect.md; acceptance `≥ 2` unsatisfiable without mutating the shared placeholder | **Fixed** — single home = step-13 message; acceptance re-anchored to `≥ 1` at step 13; Decisions row added |
| 2 | MEDIUM | Disclosure bar conflated row-trigger and ask-first trigger (both keyed "hard to reverse") | **Fixed** — bar rewritten: row = user-divergence AND two-way door; one-way → ask-first only |
| 3 | MEDIUM | Step 3 anchor spanned Mode 3 (`critic.md:21-29`); `grep -A2` acceptance window-fragile | **Fixed** — re-anchored to the Plan-reviews checklist (`critic.md:43-48`); acceptance = one line carrying `## Decisions` + `MEDIUM` + `predate` |
| 4 | LOW | No ADR register entry records the new mandate | **Accepted as-is** — disposition recorded in ## Decisions; revisit at next architecture-doc refresh |
| 5 | LOW (gap note) | Omni twin commit not observable from this repo | **Fixed** — Step 4 acceptance now states the twin is delegated to release-plugin, not done-check-greppable |
