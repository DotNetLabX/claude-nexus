# F20-ProcessSkillQuickWins — Implementation

Architect-led fast lane (standalone). Prose-only diff: three named additions to shipped process
skills, then lint + grep conformance. No git write, no version bump (release at lane close in the
main session).

Baseline confirmed at plan time (all before-state greps = 0):
`mutation`/`retro-fit`/`revert` (tdd) = 0; `infra-gate`/`mimic`/`emitter` (diagnose) = 0;
`same-name` (create-implementation-plan) = 0. All three dirs lint-green before edits.

## Files Modified

- `plugins/nexus/skills/tdd/SKILL.md` — **Step 1 (P12).** Added a `## When to Use` bullet routing
  already-shipped-behavior coverage to the new variant; added a `## Retro-fit Mutation Variant`
  section (placed after `## Workflow`, before `## What to Test…`) with the binding green-first →
  single-mutation → red → revert loop and its anti-vacuity rules; and applied the two-half
  reconciliation (critic HIGH): (a) the variant self-names the **one sanctioned exception** to
  red-first, and (b) the `## Anti-patterns` bullet "Writing a test that passes before any
  implementation" gained a **new-behavior** scope qualifier plus a cross-reference to the variant.
  Normal red-green-refactor stays the default for new behavior — the variant never replaces it.
- `plugins/nexus/skills/diagnose/SKILL.md` — **Step 2 (P13).** Added an **Infra-gate mimicry**
  hypothesis-class callout (bold lead, not a new phase) inside `### Phase 3: Hypothesize`, placed
  after the hypothesis Format block and before the phase Gate. Names the pattern (an infra gate —
  auth wall, wrapper script, runner precondition, permission hook, proxy — can emit an error shaped
  like an application/pipeline-phase failure), the hypothesis to rank (the message's **emitter** is a
  gate in front of the tool, not the tool), and the probe (identify the emitter first — grep the
  toolchain/hooks/wrappers for the literal message before debugging the application path).
- `plugins/nexus/skills/create-implementation-plan/SKILL.md` — **Step 3 (P14).** Added a new **first**
  item to `## Reading protocol` — "Grep the feature name before authoring" (grep the feature name /
  slug keywords across `docs/proposals/`, `docs/specs/`, `docs/backlog.md`; a same-name/same-topic
  hit is surfaced in the plan's Context, never silently re-planned; cites the measured near-miss),
  renumbering the existing four items to 2–5. Added a one-line pointer in `## Required Reading` to the
  same collision check (critic MEDIUM resolution: the two pre-authoring lists must not silently
  diverge — the pointer is the chosen resolution, not a duplicate rule).

## Key Decisions

- **Variant is a `##`-level section** (not `###` inside Workflow) — the plan says place it "after
  `## Workflow`, before `## What to Test…`", i.e. between two top-level sections; a `##` heading
  keeps it a peer, not a Workflow step, matching its "exception, not a stage" framing.
- **Reconciliation navigable from both directions** — the variant section names Step 2's red-first
  and declares itself the exception (variant → Step 2 / anti-pattern); the anti-pattern bullet
  scopes to new behavior and points to the variant (anti-pattern → variant). Step 2's red-first text
  stays accurate as the default path; the top-of-skill When-to-Use bullet routes retro-fit callers
  before they reach Step 2, so Step 2 needed no token (kept edits within the plan's named scope).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: None`, `TDD: no` — prose addition to a shipped process skill (verified-None class, same as F17: no skill covers dev-repo shipped-skill editing) |
| 2 | None | plan: `Skill: None`, `TDD: no` — same verified-None class (shipped-skill prose edit) |
| 3 | None | plan: `Skill: None`, `TDD: no` — same verified-None class (shipped-skill prose edit) |
| 4 | None | plan: `Skill: None`, `TDD: no` — conformance (lint + grep re-runs), no pattern to follow |

## Deviations from Plan

- **One in-scope coherence touch (Step 3 file, `create-implementation-plan/SKILL.md:33`).** The plan
  mandated adding the grep-the-feature-name item as the new **first** item of `## Reading protocol`
  (I renumbered the existing four to 2–5). The Steps section's step 2 ("Run the reading protocol.
  Read existing feature specs, architecture doc, skill inventory, and existing plans.") *summarizes*
  the protocol — and after the addition it listed only the old four items, silently omitting the new
  grep. Since P14's entire purpose is to make the grep happen, an under-counting summary in the same
  file undercuts the addition. I updated it to "Grep for prior same-name/same-topic artifacts, then
  read the feature spec, architecture doc, skill inventory, and existing plans." This is the
  stale-adjacent-sentence fix rule 6 asks for, confined to the file the plan already had me editing —
  not new scope. Surfaced by the self-review.
- Otherwise none. All three additions landed at the plan's named loci with the plan's binding
  identifiers; the reconciliation both-halves and the Required-Reading pointer were implemented as
  specified. No git write, no version bump (lane-close concern).

## Self-Review

**Verdict: APPROVED (self-review, disclosed).** No PR exists (architect-led fast lane), so `/code-review`
is inapplicable (known from F17); ran the disclosed prose self-review against the `review-format`
checklist. No CRITICAL/HIGH findings.

Prose angles (rule 6):

- **Internal consistency — the critic HIGH (tdd variant vs Step 2 red-first vs the anti-pattern),
  read from BOTH directions.** *Variant → default:* the variant section (`tdd:79-103`) states "Step 2's
  red-first is impossible here" and names itself "the **one sanctioned exception** to the red-first
  default — the mutation step below (not a pre-implementation red) is what proves the test has teeth,"
  and closes by deferring to red-green-refactor as the default for NEW behavior. *Anti-pattern →
  variant:* the anti-pattern bullet now reads "…(new behavior)… This applies to new behavior only: for
  coverage over **already-shipped** code, red-first is impossible by construction — see the **Retro-fit
  Mutation Variant**, where a temporary mutation (not a pre-implementation red) proves the test has
  teeth." Both directions carry the identical load-bearing clause ("a temporary mutation, not a
  pre-implementation red, proves the test has teeth"), so the skill no longer prescribes X in one place
  and prohibits X in another — the anti-vacuity guarantee is preserved in both branches (red-first for
  new behavior; the mutation step for shipped code). Coherent from both directions. ✓
- **No dropped/narrowed guarantee.** The anti-pattern's original guarantee (confirm RED-for-the-right-
  reason before implementing) is preserved verbatim for new behavior and given its sanctioned equivalent
  (the mutation step) for shipped code — re-routed, not weakened. The `create-implementation-plan`
  renumber preserved all four original items (now 2–5); no reference to their old numbers exists (grep:
  only `## Reading protocol` item 1 is cited, and it correctly resolves to the new grep item).
- **Stale adjacent sentences — checked, verdicts recorded.** *tdd `When NOT to Use`* (scaffolding/UI/
  one-shot scripts): none overlap the shipped-behavior-coverage case; the variant is a `When to Use`
  addition, so this list stays accurate — no token. *tdd `Integration with Developer Workflow`* ("TDD is
  HOW the developer implements plan steps… red-green-refactor…"): describes the default forward loop; a
  coverage-backfill step is routed to the variant by the top-of-skill When-to-Use bullet before a reader
  reaches this section, so it stays accurate as the default-path description — no token, and touching it
  would be scope creep. *tdd Guardrail "Delete tests that test nothing"* aligns with (does not contradict)
  the variant's anti-vacuity mutation step. *tdd Horizontal-Slicing anti-pattern* (never batch): the
  variant writes one test at a time — consistent. *create-implementation-plan Steps step 2*: DID go stale
  (under-counted the protocol) — fixed (see Deviations). *diagnose Phase-3 Gate line* after the inserted
  callout still closes the phase coherently.
- **Dangling cross-references — none.** variant → "Step 2" / "Steps 1–5" (all exist); anti-pattern →
  "Retro-fit Mutation Variant" (exact heading match); When-to-Use → "variant below" (directionally
  correct); Required Reading → "`## Reading protocol` item 1" (resolves to the new grep item). diagnose
  callout cites no file paths. All resolve.
- **Directional references — correct.** "variant below" (When-to-Use at top → variant lower), "Steps
  1–5" (backward, no positional word), "see the Retro-fit Mutation Variant" (name, not position). No
  above/below word points the wrong way.

**Evidence:** all Step 1–3 acceptance greps re-run at final state (recorded above) + skill-lint exit 0
on all three dirs; read-only `git status` confirms only the three intended `SKILL.md` files modified and
the unrelated dirt file untouched; debug-artifact scan (TODO/HACK/FIXME) = none; angle-bracket-in-prose
count = 0 on all three (E7 clean).

## No Test-Suite Surface (Step 4 note)

No runtime code changed — these are prose-only edits to three shipped `SKILL.md` files. Nothing in
`tests/unit/` covers these files, so no test-suite run is owed (stated explicitly per plan Step 4).
The gates are the executed acceptance greps + skill-lint, all recorded below.

## Acceptance Greps (Step 1 — all pass)

- `grep -ic 'mutation'` = 12 (≥ 3) ✓
- `grep -ic 'retro-fit'` = 4 (≥ 3) ✓
- `grep -ic 'revert'` = 1 (≥ 1) ✓
- `awk '/^## Anti-patterns/,/^## What This Skill/' | grep -ic 'retro-fit'` = 1 (≥ 1) ✓
- skill-lint `tdd` → `OK    tdd`, exit 0 ✓

## Acceptance Greps (Step 2 — all pass)

- `awk '/^### Phase 3/,/^### Phase 4/' | grep -ic 'infra-gate mimicry'` = 1 (≥ 1) ✓
- `grep -ic 'emitter'` = 2 (≥ 1) ✓
- skill-lint `diagnose` → `OK    diagnose`, exit 0 ✓

## Acceptance Greps (Step 3 — all pass)

- `awk '/^## Reading protocol/,/^## Steps/' | grep -ic 'grep the feature name'` = 1 (≥ 1) ✓
- `grep -ic 'same-name'` = 2 (≥ 1) ✓ (item 1 + the Steps-step-2 coherence touch)
- `awk '/^## Required Reading/,/^## Anti-patterns/' | grep -ic 'feature name'` = 1 (≥ 1) ✓
- skill-lint `create-implementation-plan` → `OK    create-implementation-plan`, exit 0 ✓

## Acceptance Greps (Step 4 — conformance re-run, all pass)

Every Step 1–3 grep re-executed together at final state (after the Step-3 coherence touch) — all
still pass with the counts above. skill-lint on all three edited dirs green in one sweep:

- `skill-lint tdd` → `OK    tdd` (exit 0) ✓
- `skill-lint diagnose` → `OK    diagnose` (exit 0) ✓
- `skill-lint create-implementation-plan` → `OK    create-implementation-plan` (exit 0) ✓
- No unit-test surface (see the Step 4 note above) — no test-suite run owed.

*Status: COMPLETE — developer, 2026-07-20*
