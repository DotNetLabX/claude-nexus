# Review — adhoc-MineSemanticModel

## Step 1 — Done-Check (architect, 2026-07-10)

**Verdict: PASS for Steps 1–4 (all verified); Step 5 (release) correctly HELD** — blocked by a
concurrent sibling's uncommitted bump (`adhoc-ArchitectFastLane`, another operator session, live
1.29.0 on plugin.json). The hold is the plan's own Step-5 gate working as designed; see
questions.md Q2 (Closed — awaiting operator action).

### Step-by-step disposition (plan ↔ implementation.md ↔ disk)

| Step | Plan requirement | Verdict | Architect re-verification |
|---|---|---|---|
| 1 | 7 probes byte-for-byte, BOM-clean | Implemented | AC-2/AC-10 outputs in implementation.md; the Q1 token-leak inventory independently re-executed and confirmed exact (3-file sweep list, one `F52` comment) |
| 2 | 3 references generalized + project-profile.md authored | Implemented | KG-token sweep re-executed: authored `.md` files clean, tokens confined to project-profile.md (+ the byte-for-byte probe comments per the Q1 carve-out); AC-4 key set present |
| 3 | SKILL.md + evaluate-skill | Implemented | frontmatter flags + ≥3 family pointer hits confirmed; F-id sweep re-executed — `F38` only in the labeled origin story (SKILL.md:14-15, self-documenting "the one feature-id this file carries"); evaluate-skill ACCEPT (fix-then-accept), finding F1 (inherited AC-numbering collision, 8 occurrences) fixed pre-Step-4, eval doc at `docs/skill-evals/2026-07-10-mine-semantic-model.md` |
| 4 | 5 family-registration edits incl. member-count sweep | Implemented | Re-executed: `all four members\|across all four` = **0 hits**; `all five` = **4 hits** (core :19 + new SKILL :226 + both siblings); DO-NOT-TOUCH checklist line intact; the extra adjacent "4-row→5-row" fix in mine-reference-model is in-scope-consistent (same stale-count class), recorded |
| 5 | Release (MINOR, sequenced) | **HELD (valid)** | Gate re-checked red twice by the developer (exit 1; sibling's uncommitted 1.29.0); `bump-plugin --dry-run` evidence shows foreign dirty categories; CLAUDE.md double-bump rule mandates the hold — not a deviation, the gate firing |

### Adjudications

- **Q1 (AC-6/AC-9 vs byte-for-byte probes): CLOSED** — plan's step-level scoping governs; tech-spec
  AC-6/AC-9 amended with the explicit `probes/*.sql` carve-out + a Decisions row. The developer's
  proceed-and-report-honestly handling was correct; the sweeps' full outputs are in
  implementation.md, nothing silently passed.
- **Q2 (sequencing hold): CLOSED** — hold confirmed; operator action owed (commit or reset the
  ArchitectFastLane session's bump), then Step 5 runs: gate re-check → `bump-plugin --dry-run` →
  `--minor` (targets the version after the sibling's), CHANGELOG line per plan, `gen-omni` + tests.

### Cross-checks

- Tests re-run context: developer reports 509/509 + selfcheck 4/5 (gen-omni drift **expected**
  pre-bump — the twin correctly lags the unreleased skill; not a regression).
- The developer's re-verify-at-the-action discipline (gate re-checked immediately before the bump,
  not trusted from the brief) is exactly the lesson now recorded in lessons.md — promoted-worthy.

### Handoff — SUPERSEDED by owner decision (addendum below)

~~Remaining work for this slug is ONE gated step: after the ArchitectFastLane bump commits, run
Step 5.~~

## Addendum — owner relocation decision (2026-07-10, after done-check)

**The owner ruled the skill ships in the `nexus-analytics` extension, not nexus core** — domain
cohesion governs ("it doesn't make sense to keep the skill in the core plugin when we build a new
plugin"), on the established cross-plugin composition precedent: `mine-verify-cover-dotnet` (in
nexus-dotnet) composes with the core method via a plain prose reference ("Read `mine-verify-cover`
first"), no file-path pointers. Consequences:

- **Step 5 (core release) DISSOLVES for the skill files.** The folder was never committed
  (untracked) — the relocation is a filesystem move executed by the adhoc-AnalystExtension build,
  which also re-words the skill's four `../mine-verify-cover/references/mine-family-core.md §X`
  relative pointers into the cross-plugin prose form (they cannot resolve across separately
  installed plugins).
- **The family registration stays in core** (mine-family-core.md + the two sibling one-word
  edits — already made, tracked-file modifications): the family REGISTRY is a core concept;
  the table row gains a "ships in `nexus-analytics`" marker (AnalystExtension build). These 3
  edits ride a later core PATCH once the concurrent ArchitectFastLane bump commits — they block
  nothing.
- **Q2's hold becomes moot for this slug** — there is no core bump to sequence anymore.
- Steps 1–4's verification (this done-check) remains valid: the artifacts are correct wherever
  they ship; only their home and pointer wording change, both owned by the AnalystExtension plan.
