# Critic Review — Plan Review (code-grounded) — adhoc-MineFamilyCore

**Verdict:** GO-with-fixes (REVISE) · **Date:** 2026-07-10 · **Mode:** 2 (plan vs tech-spec),
code-grounded (live SKILL.mds read; AC greps executed against disk).
No CRITICAL. P0 "pilots ran" premise VERIFIED on disk (6 tech-debt area files in
omnishelf_flutter_app; reference-model.md in dotnet-microservices — self-reference run confirmed
by artifact location). Sibling-relative pointer path VERIFIED (flat siblings under the
version-keyed `skills/` cache dir). Step-5 anchors all verified correct.

## Findings

- **[HIGH] F1 — AC-3 signature `owns spawning` collides with `conformance-review/SKILL.md:83`**
  (out-of-scope skill, shipped 1.26.0). Post-edit residual hit falsifies "exactly ONE shipped
  file". Fix: use the discriminating signature `"is the session that owns spawning"` — verified to
  hit only the 3 mine skills.
- **[HIGH] F2 — Disposition row 5 sends cover's registry invariants to CORE but Step 2 leaves them
  untouched** (the invariant sentence lives in the Merge paragraph inside `## SDD lifecycle`,
  cover:386–388, which Step 2 marks untouched; `## The rule registry` at :244–262 unmentioned).
  No AC catches the residue (`carried unchanged from ADR-43` absent from cover — grep hits only
  repo:155, ref-model:146). Fix: reconcile table ↔ step explicitly.
- **[HIGH] F3 — AC-7 targets `D:\src\dotnet-microservices\docs\backlog.md`, which does not exist**;
  the repo has `docs/skill-backlog.md`. "Match each file's existing row format" is unexecutable.
  Fix: retarget to `skill-backlog.md`.
- **[MEDIUM] F4 — AC-6 grep `"pilot executed 2026-07-0"` unsatisfied by Step 5's summary wording**
  (date not contiguous: "pilot executed **on** …", "pilot executed **(self-reference** …"). 2/4
  hits as written. Fix: contiguous date phrasing.
- **[MEDIUM] F5 — B4 checklist authored in core but no step wires a consuming pointer** despite
  disposition row 9's `new | new | new`. Ships write-only unless wired or declared passive-advisory.
- **[MEDIUM] F6 — External consumer unenumerated: `agents/team-lead.md:127` (+ generated
  `commands/` mirror) cites "mine-verify-cover's Execution topology"**, a heading the pass removes
  from the SKILL.md body. Resolves via extra hop; repoint + `gen-commands.mjs` or acknowledge.
- **[MEDIUM] F7 — Disposition row 3 lists cover's Verify-stage line as CORE, but cover's code-arm
  skeptic is a different mechanism** (mutation-gated code re-check, not must-RUN/drop-without-
  excerpt). Core text must be lifted from repo C3 / ref-model R3; cover's line stays.
- **[LOW] F8 —** (a) row 8 claims cover has an AC-anchored binding section — it has none (AC-4
  vacuous for cover); (b) cover's relationship table has 8 rows, not 7 (slim removes 2, keeps 6);
  (c) self-pointer nit: inside cover use `references/mine-family-core.md`, not the `../` form.

## Pre-edit signature inventory (executed live)

- `capture the start` → 2 hits (cover:238, repo:192); ABSENT from ref-model (R6 wording differs —
  Step 4's budget slim does not affect this signature).
- `carried unchanged from ADR-43` → 2 hits (repo:155, ref-model:146); absent from cover.
- `owns spawning` → 4 hits (3 mine skills + conformance-review:83 — the F1 collision).
- No collisions in any stack adapter (`plugins/nexus-*`).

## Systemic note (3 HIGH → adversarial re-sweep ran)

Root cause across F1/F3/F4 (and the F2/F7/F8 table drift): **acceptance greps and the disposition
table were asserted from an expected mental model, not executed against the live tree.** For a
feature whose value IS grep-verifiable de-duplication, ACs must be executable-true at authoring
time.

## Open question routed to architect

Is B4 an enforced preflight or passive advisory? (Architect ruling, folded into the revision:
**wired-but-advisory** — one pointer line per skill at the run-launch area; see plan ## Plan Review.)
