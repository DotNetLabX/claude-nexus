# Technical Mine — pre-proposal working notes (2026-07-04)

**Status:** SUPERSEDED by `docs/proposals/mine-verify-repo.md` (2026-07-04) — read that instead.
Kept as the raw working record only.

**The idea (owner's):** a full technical evaluation of a repository — a "technical mine" — whose
end goal is a refactoring backlog and, ultimately, executed refactorings. Sibling of the two
existing mines: mine-code scans ONE class, mine-from-spec scans ONE spec; this scans one REPO
(decomposed into areas).

## Origin trail (verified in this session — don't re-derive)

- No prior proposal exists. Session archaeology (all project transcripts swept): the 2026-06-23
  discussion (session a6015324) about importing omnishelf-docs `docs-bootstrap` was the *product
  KB* direction — captured as forward vision in
  `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` §Knowledge-layer integration (layer 3,
  "captured, not yet built"). The docs↔KB direction question graduated as **ADR-43** (docs render
  FROM verified KB; render step is omnishelf-docs-estate concern). The technical-evaluation →
  refactoring idea was never discussed before this session ("technical mine" has zero prior hits).
- The roadmap's "don't build before the single-class skill ships" deferral is dissolved —
  mine-verify-cover shipped.

## Decided design points (this session's discussion, research-confirmed)

1. **Keep the mine-verify invariant**: bounded unit → clean-room miners → consensus → skeptic
   verify → graded registry. Change unit, ground truth, and gate.
2. **Unit = one area** (graphify community / module / vertical slice), fan-out over areas +
   ONE global pass reading only the structure graph (layering/dependency-direction violations are
   invisible per-area). graphify = the scoping engine.
3. **Finding = fact + judgment; only the fact is skeptic-verifiable.** Fact: grep/metric-
   reproducible (CONFIRMED/WRONG/IMPRECISE grammar reused). Judgment ("is it a problem *here*?")
   is adjudicated against a reference model (repo ADRs, conventions, generic catalog) in a
   **by-design triage** step — architect + user work, not automatable (fokus lesson: "anemic by
   design").
4. **Gate = git-history hotspot ranking, not mutants.** Churn × complexity + ownership prioritize
   findings; a god class nobody touches is a non-problem. Objective, cheap, free.
5. **Output = triage registry** (finding + reproducible evidence + severity + hotspot priority +
   disposition), NOT a refactoring plan. Feeds the existing ad-hoc refactoring lane (the
   architect's "ADR register + triage + backlog row" flow already *presupposes* this artifact;
   nothing produces it today). Accepted rows → backlog rows → ad-hoc slugs → normal pipeline.
6. **Composition with the BR mine = the refactoring safety net**: before refactoring a target,
   run mine-verify-cover on affected classes; mutation-gated tests prove behavior preservation.
   Tech mine finds WHERE; BR mine proves the refactor didn't break behavior.
7. **Cost control**: hotspot-first ordering (scan top-N hot areas, not everything).

## Donor material — omnishelf-docs docs-bootstrap Phase 5 (evaluated this session)

`D:\Omnishelf\omnishelf-docs\.claude\skills\docs-bootstrap\phases\5-tech-debt.md`,
`templates\techdebt-finding.md`, and `docs-update\phases\5-tech-debt-refresh.md`. Battle-tested;
borrow: per-domain subagent fan-out (orchestrator-only cross-domain view), 5 categories
(code-quality / architecture / security / performance / test-coverage) with look-for catalogs,
finding schema (severity × likelihood × confidence 1–5, mandatory symbol citations, evidence
excerpt, one-paragraph next step, confidence ≤2 dropped), severity×likelihood → triage timeline,
carry-over confirm-or-refute protocol, and the **refresh pass** (verify old findings against git
delta: resolved / still-active / superseded with auto-resolve heuristics — solves staleness).

**Four gaps the nexus skill adds** (Phase 5 lacks these):
1. Fresh findings are self-graded — no independent clean-room/skeptic pass (only carry-overs get
   verified). Add mine-verify discipline.
2. No churn/hotspot gate — likelihood is agent-estimated, not computed from git history.
3. No by-design adjudication against ADRs/conventions (generic catalog only).
4. Output feeds documentation, not a refactoring pipeline; no BR-mine composition.

Also: Phase 5 is embedded in a ~2h docs-encyclopedia run (Jira, features, flows) — the nexus
skill must run standalone.

## Research (adversarially verified) — full entry:
`docs/kb/research/repo-technical-evaluation-for-refactoring.md`

Design-bearing facts: relative churn (89% discrimination), minor-contributor ownership
(Spearman 0.86–0.93, strongest known correlate), change coupling (modest, secondary) are the
verified objective layer; entire pipeline free (Code Maat GPLv3 + `git log --numstat` commands +
hotspot filter μ+3σ AND >1 change/month); **bot filtering mandatory first** (74% of hotspot
commits in one corpus); ATAM lineage skipped (near-zero validation, beaten by lighter method);
practitioner vacuum confirmed (untooled, "gut feeling" prioritization); calibrate within-repo
(cross-project transfer poor); payoff (vs defect-density) prediction is UNPROVEN — pilot must
measure it.

**New ideas from research to incorporate (unverified leads, marked in the entry):**
- **Empirical must-reproduce gate beats reasoning-only verification**: 80+ agents unanimously
  endorsed a nonexistent bug; only a concrete-evidence gate killed it. The skeptic must RUN the
  grep/metric, not re-reason. (Refute-or-Promote: ~79–83% of raw LLM defect findings are FPs.)
- **Cross-model critic slot** (Codex integration exists): caught findings same-family review
  missed + errors in 16% of same-family-approved fixes.
- **Severity recalibration pass**: LLMs inflate severity; adversarial agents corrected downward
  8/9 — bake a devil's-advocate severity check into Verify.
- **Diverse lenses > redundant voters** (agent diversity ρ=0.05–0.25 is the ensemble mechanism;
  naive consensus degrades teams).
- **Hybrid with deterministic tooling**: static-analysis + LLM triage killed 94–98% of FPs — the
  mine's miners should consume deterministic metric output (churn tables, lizard complexity),
  not estimate.

## Open questions for the proposal

- Name and home: `mine-tech`? Relationship to nexus-dotnet `improve-architecture` (area-scoped
  heuristic discovery, architect→backlog): absorb as the catalog donor / supersede its discovery
  phase? Stack-neutral method + adapter split like mine-verify-cover?
- Registry format: reuse kb-sync-borrowed invariants (ADR-43 precedent: source provenance,
  last_verified ceilings, deprecate-never-delete) and/or the SddLifecycle merge-registry work?
- Reference-model bootstrap for repos with no ADRs/conventions (degrade to generic catalog?).
- Scope of first slice: Mine→Verify→Registry only (no auto-plan), pilot on one live repo
  (KG / SR / dotnet-microservices / omnivision are candidates) measuring payoff.
- Security category: keep (Phase 5 has it) or defer (overlaps /security-review)?
