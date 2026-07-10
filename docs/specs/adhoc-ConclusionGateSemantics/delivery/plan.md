# Conclusion-Gate Verdict Semantics

**Feature Spec:** `docs/specs/adhoc-ConclusionGateSemantics/definition/tech-spec.md`

## Context

Port VWH's conclusion-gate rules as prose into the two verdict-bearing skills: causal verdicts
must name the one variable that flips the outcome (or carry `confounded`), hypotheses die only on
recorded falsifying evidence (`inconclusive` is the resting verdict), pre-escalation kills need ≥2
falsifying probes, and causal review findings name their mechanism (or carry `correlation-only`).
Additive prose, two shipped files, no machinery.

## Scope

In scope: `plugins/nexus/skills/diagnose/SKILL.md`, `plugins/nexus/skills/review-format/SKILL.md`,
release bump. Out of scope: agent docs, hooks/lint enforcement, architect done-check/escalation
verdicts, any heading rename or template restructuring.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | diagnose edits — the four insertion points below | |
| 2 | (none) | — | no | review-format edits — two insertion points below | |
| 3 | (none) | — | no | AC grep battery + repo gates | |
| 4 | release-plugin | Follow | no | PATCH | |

All steps are prose edits with grep-checkable acceptance — no testable runtime behavior (TDD `no`
throughout).

## Domain Model Changes / Data Model Changes / Cross-Service Changes / Migration Notes

None.

## Implementation Steps

### Step 1 — diagnose SKILL.md (four additive insertions)

Modify `plugins/nexus/skills/diagnose/SKILL.md` per tech-spec §Design Edit 1. Insertion points
(all additive — no existing text removed or reworded):

1. **Phase 4 gate line** (currently `**Gate:** Root cause identified with evidence.`) — extend
   with the causal-verdict grammar: names the ONE variable whose change **flips the outcome** +
   the confirming probe + what falsified the alternatives; multiple changed variables ⇒ the
   verdict carries the `confounded` tag (keep bisecting, or override with logged reason).
2. **Phase 4, at the record step** (`Record: which hypothesis confirmed/eliminated`, ≈line 71 —
   where elimination actually happens; critic F5) — the elimination rule: eliminated only by
   recorded falsifying evidence; an ambiguous probe leaves the hypothesis `inconclusive` (the
   resting verdict), alive and testable.
3. **Integration with Circuit Breaker section** — the pre-escalation kill rule: an "approach is
   unworkable / unfixable" conclusion requires ≥2 distinct falsifying probes in the evidence log
   or an explicit override with logged reason; composes with (never replaces) the 3-attempt
   breaker. **Plus the reconciling clause (critic F2):** escalation-with-evidence-log is a
   handoff, not a kill — never gated by the elimination rule; "3 hypotheses exhausted" = each top
   hypothesis probed at least once (confirmed / falsified / inconclusive), so inconclusive-alive
   hypotheses count toward the escalation trigger.
4. **Guardrails section** — one new bullet naming both rules (causal verdicts name their variable
   or carry `confounded`; `inconclusive` is the resting verdict — one ambiguous probe never kills
   a hypothesis).

Keep total addition ≤ 20 lines — this skill is loaded mid-debugging; weight is a cost.
Acceptance: AC-1 + AC-2 greps (`flips the outcome` = 1, `confounded` ≥ 1, `inconclusive` ≥ 2,
`unworkable` ≥ 1 — all currently 0 in this file).
Satisfies: AC-1, AC-2

### Step 2 — review-format SKILL.md (two additive insertions)

Modify `plugins/nexus/skills/review-format/SKILL.md` per tech-spec §Design Edit 2:

1. **Step 2 checklist** — one bullet: a finding asserting causation names the mechanism (the
   variable/path producing the failure) or its causal attribution is tagged `correlation-only`
   (capped at MEDIUM) — **while a directly-observed CRITICAL/HIGH impact (data loss, security,
   silent incorrect output) keeps its severity floor**: impact at full severity, unproven
   attribution to Open Questions (critic F1).
2. **`## Confidence Score` section, adjacent to the `Report cutoff — ≥80` prose** (the single
   anchor — critic F4) — the rule sentence + the carve-out + the explicit non-change: the ≥80
   cutoff remains the sole thin-evidence threshold; this adds a grammar requirement, not a second
   number.

Keep total addition ≤ 12 lines (raised from 8 for the carve-out).
Acceptance: AC-3 grep (`correlation-only` ≥ 2 in this file; currently 0).
Satisfies: AC-3

### Step 3 — Gates and scope check

Run the full AC grep battery (AC-1–AC-3) and record outputs in implementation.md. Run
`git diff --name-only` over `plugins/` — exactly the two SKILL.mds (+ `plugin.json`/`CHANGELOG.md`
after Step 4) — AC-4. Run `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` and
`node scripts/selfcheck.mjs` — green. Depends on Steps 1–2.
Acceptance: AC-4, AC-5 (gate half).
Satisfies: AC-4, AC-5

### Step 4 — Release

Follow release-plugin: PATCH (additive prose, no behavior reversal, no new capability surface);
CHANGELOG one-liner: "conclusion-gate verdict semantics in diagnose + review-format (causal
verdicts name their variable; kills need falsifying evidence)". Bump in the same commit as the
change.
Acceptance: AC-5 (release half); CI `plugin-release-check` green.
Satisfies: AC-5

## Testing Strategy

No runtime behavior — verification is the AC grep battery (all signatures pre-verified zero-hit
across `plugins/**/*.md` on 2026-07-10) + repo lint/selfcheck.

## KB Impact

None.

## Decisions

Inherited from the tech-spec table (two-file scope; prose not machinery; no second threshold;
additive-only; tags as vocabulary not schema). Plan-level:
`None — no additional self-resolved calls met the disclosure bar`.

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2, live-tree greps): **GO-with-fixes** — findings persisted to
`delivery/review-critic.md`, all five folded: F1 (HIGH) → severity-floor carve-out: the
`correlation-only` cap acts on the causal *attribution*, never a directly-observed CRITICAL/HIGH
impact (data loss / security / silent incorrect output keeps its floor; unproven attribution →
Open Questions); F2 → escalation is a handoff-not-a-kill + "exhausted" defined (inconclusive-alive
hypotheses count toward the trigger); F3 → AC-1 `=1` relaxed to `≥1`; F4 → the review-format
sentence pinned to the `## Confidence Score` / report-cutoff anchor; F5 → elimination rule moved
to Phase 4's record step. Critic verified clean: all five signatures zero-hit tree-wide, all six
insertion anchors exact, consumer-safety true (no agent doc restates the changed grammar), no
command regen owed (skills have no mirrors), omni twin owned by release-plugin.
