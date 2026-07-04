# Proposal — mine-verify-repo: full-repo technical evaluation feeding the refactoring lane

**Status:** Ratified (2026-07-04, owner go-ahead in-session — "ok, is fine, let's write the spec/plan";
the three preference calls — name, pilot repo, security deferral — stand as answered)
**Decision-maker:** Laurentiu
**Recommendation:** Build **`mine-verify-repo`** — the third mine (mine-verify-cover scans ONE class,
mine-from-spec ONE spec; this scans one REPO decomposed into graphify areas). Keep the mine-verify
invariant (clean-room miners → consensus → skeptic verify → graded registry); change the unit (area),
the ground truth (deterministic git/complexity metrics + must-reproduce evidence), and the gate
(bot-filtered hotspot ranking instead of mutants). Output = a **triage registry** feeding the existing
ad-hoc refactoring lane — never a refactoring plan. **First slice: Mine→Verify→Registry only, piloted
on knowledge-gateway, measuring refactoring payoff as a hypothesis.**
**Confidence:** High — every load-bearing design choice rests on 3-vote adversarially verified research
(23/25 claims, `docs/kb/research/repo-technical-evaluation-for-refactoring.md`) plus shipped
mine-verify machinery; the single unproven assumption (refactoring *payoff*, vs defect-density
prediction) is scoped INTO the pilot as a measured hypothesis, not assumed by the proposal.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-04

## Need

The end goal is refactoring. The architect's ad-hoc refactoring lane (ADR register + triage + backlog
row → `adhoc-*` slug → normal pipeline) **presupposes a triage artifact that nothing produces today** —
the two existing mines are unit-scoped (one class, one spec) and there is no repo-level evaluation that
outputs verified, prioritized findings. Consuming repos with real debt (knowledge-gateway,
sprint-rituals, omnivision) have no systematic way to decide *what* to refactor first.

This is not a local gap: the research confirms a field-wide practitioner vacuum — architectural
tech-debt management is largely untooled and prioritized by "gut feeling" (Verdecchia et al. ECSA 2020,
corroborated by the Lenarduzzi SLR). And the naive fix — "have an LLM audit the repo" — is known-bad:
raw LLM defect findings run ~79–83% false positive, and consensus alone does not save it (80+ agents
unanimously endorsed a nonexistent OpenSSL bug; only an empirical evidence gate killed it). A repo
evaluation is only worth building **with** the verification discipline the mine family already has.

**Why now:** the roadmap's "don't build before the single-class skill ships" deferral is dissolved —
mine-verify-cover is shipped and validated across three stacks; graphify (the area-scoping engine)
is shipped; the deep research is done and captured.

**Out of scope:**
- **Auto-generating refactoring plans.** The registry feeds the existing ad-hoc lane; planning stays
  with the architect + user.
- **The docs/render layer.** ADR-43 boundary — docs render FROM verified KB in the
  omnishelf-docs estate; this skill produces the registry, never documentation.
- **The security category** (owner call, 2026-07-04): deferred — it overlaps `/security-review`, and
  security findings need exploitability judgment, a different verification discipline than
  grep-reproducible facts. The registry documents this boundary; a later slice may add thin delegation
  (import `/security-review` findings as registry rows).
- **Cover/mutation at repo scale.** Cover stays per-class via composition (see Approach §7).

## Approach

The mine-verify invariant is kept; three things change — unit, ground truth, gate.

**1. Unit = one graphify area, plus ONE global pass.** graphify communities/modules are the fan-out
unit (clean-room miners per area, orchestrator holds the only cross-area view — the docs-bootstrap
Phase 5 topology, which is battle-tested). One additional global miner reads ONLY the structure graph:
layering and dependency-direction violations are invisible per-area.

**2. Deterministic metric layer FIRST — miners consume, never estimate.** Before any agent reads
source, the pipeline computes (free tooling: Code Maat GPLv3 + documented `git log --numstat` commands
+ lizard for complexity):
- **Bot filtering** — mandatory first step (bots were 74% of hotspot commits in one 91-repo corpus).
- **Relative churn** (89% discrimination of fault-prone modules), **churn×complexity hotspot ranking**
  (filter: modification count > μ+3σ AND >1 change/month), **minor-contributor ownership** (Spearman
  0.86–0.93, the strongest known defect correlate), **change coupling** (modest, secondary signal).
- Calibrate within-repo — cross-project thresholds don't transfer.

The research's hybrid finding motivates this ordering: static/deterministic signal + LLM triage killed
94–98% of false positives; agent-estimated likelihood (Phase 5's approach) is the weakest link this
replaces.

**3. Hotspot-first cost control.** Scan the top-N hot areas, not everything. A god class nobody
touches is a non-problem; the hotspot table decides scan order and caps spend.

**4. Finding = fact + judgment; only the fact is verifiable.** Each miner finding must be
**fact-shaped**: a grep/metric-reproducible claim with the reproducing command and evidence excerpt
(Phase 5's mandatory symbol citations, hardened). Four category lenses — code-quality, architecture,
performance, test-coverage — run as **diverse lenses, not redundant voters** (research: lens diversity
ρ=0.05–0.25 is the ensemble mechanism; naive consensus degrades teams).

**5. Verify = the empirical must-reproduce gate.** A fresh skeptic **RUNS** each finding's evidence
(re-executes the grep/metric) — never re-reasons it; reasoning-only review is exactly what endorsed
the nonexistent bug. Verdict grammar reused: CONFIRMED / WRONG / IMPRECISE. Two additions from the
research:
- **Severity recalibration** — a devil's-advocate pass on severity (LLMs inflate; adversarial agents
  corrected 8/9 downward).
- **Cross-model critic slot** (Codex integration exists) — deferred to slice 2; the seam is named now
  so the Verify stage can accept an external critic without redesign.

**6. By-design triage — the judgment half, human-adjudicated.** CONFIRMED facts are adjudicated
against the repo's **reference model** (ADRs, conventions; the fokus lesson: "anemic by design" is a
verdict only the reference model + owner can render). Architect + user work, not automatable. Repos
with no ADRs degrade to the generic catalog with every judgment row flagged `no-reference-model`.

**7. Output = triage registry, feeding the lane + the safety net.** Per-area files
`docs/tech-debt/<area>.md` (mirroring the `docs/business-rules/<area>/` species split, ADR-45),
reusing the registry invariants: provenance, `last_verified`, deprecate-never-delete, changelog,
idempotent re-runs. Row = finding + reproducible evidence + severity + hotspot priority + disposition
(`accepted → backlog row | by-design | deferred | resolved`). Two consumers:
- **The ad-hoc lane:** accepted rows become backlog rows → `adhoc-*` slugs → normal pipeline.
- **The BR-mine composition:** before executing an accepted refactor, run mine-verify-cover (M2
  protect) on affected classes — this mine finds WHERE, the BR mine proves behavior preservation.

**8. Refresh pass (staleness).** Borrowed from docs-update Phase 5: re-verify existing registry rows
against the git delta — `resolved / still-active / superseded`, with auto-resolve heuristics. Findings
age; the registry must not.

**Home:** `plugins/nexus`, stack-neutral (the metric layer is git-based; lizard is multi-language). No
adapter seam extracted yet — same rule as mine-verify-cover: abstract the seam only when a second
stack's toolchain actually diverges. Relationship to nexus-dotnet `improve-architecture`: this skill
**supersedes its discovery phase**; its heuristic catalog becomes donor look-for material for the
architecture lens.

**First slice (the pilot):** Mine→Verify→Registry on **knowledge-gateway** (live churn history for the
hotspot layer, .NET so the BR-mine safety net exists, real refactoring appetite so payoff is
measurable). The pilot measures two things: (a) verification precision — what fraction of miner
findings survive the must-reproduce gate; (b) **payoff as a hypothesis** — hotspot-prioritized
accepted findings get refactored through the lane, and we track whether the targeted areas actually
improve (the research proves defect-density *prediction*; payoff is the open question the pilot
exists to answer).

## Benefits

- **Fills the lane's missing input.** The ad-hoc refactoring flow finally has the triage artifact it
  presupposes — systematic, not gut-feeling (the exact vacuum the research documents in industry).
- **Verified findings, not an LLM audit dump.** The must-reproduce gate is the difference between a
  registry the owner can trust and the ~80%-false-positive shelf-ware audits the literature reports.
- **Objective prioritization for free.** The entire hotspot layer costs nothing (git + Code Maat +
  lizard) and rests on the strongest validated defect correlates known.
- **Staleness solved by design** — the refresh pass keeps the registry current instead of rotting like
  a one-shot audit report.
- **Composes with what's shipped:** graphify scopes it, mine-verify-cover protects its refactorings,
  the ad-hoc lane executes them. No new pipeline concepts — a third mine on the existing backbone.

## Alternatives

1. **Port docs-bootstrap Phase 5 as-is.** Battle-tested donor (per-domain fan-out, finding schema,
   refresh pass — all borrowed above), but it has four gaps: fresh findings are self-graded (no
   skeptic), likelihood is agent-estimated (no git-history gate), no by-design adjudication against
   ADRs, and output feeds documentation, not a refactoring pipeline. It is also embedded in a ~2h
   docs-encyclopedia run. Borrow the schema and topology; don't port the skill.
2. **Extend nexus-dotnet `improve-architecture`.** Already area-scoped and lane-feeding, but its
   discovery is heuristic and self-graded, it is dotnet-only, and it has no verification or hotspot
   layer. Superseding its discovery phase (and keeping its catalog as donor material) gets the value
   without maintaining two overlapping discovery skills.
3. **Formal architecture assessment (ATAM lineage).** Rejected on evidence: strikingly thin validation
   (the lightweight variants practitioners would use are the least validated), and the one controlled
   comparison found ATAM beaten by a lighter method.
4. **Commercial tooling (CodeScene).** The metric lineage is exactly what we adopt — but the validated
   signals are computable from bare git history with free tools. Revisit only if the pilot shows the
   free pipeline's friction exceeds a license.
5. **Do nothing (ad-hoc audits on demand).** The status quo the research shows produces shelf-ware:
   unverified findings, no prioritization, no staleness handling, nothing feeding the lane.

## Unresolved

- **Registry format detail:** per-area files vs one `registry.md`; exact row grammar (recommend
  mirroring the business-rules row style — resolve at tech-spec).
- **Payoff measurement design:** which before/after signals (hotspot-score delta, defect-proxy rate,
  cycle time on touched areas?) and the observation window — pilot design decision, needs owner input.
- **Ownership-metric applicability:** validated in strong-ownership industrial contexts, weakens in
  open source — on a single-maintainer repo like KG it may carry no signal. The pilot reports whether
  to keep it in the gate.
- **Global-pass catalog:** exactly what the structure-graph miner looks for (layering violations,
  dependency direction, god nodes) — tech-spec detail.
- **Cross-model critic slot:** slice 2 timing and whether Codex or a second Claude family fills it.

## Graduate-to-spec

Technical branch (ADR-27/ADR-28): on ratification this graduates to
`docs/specs/adhoc-MineVerifyRepo/definition/tech-spec.md` with ADRs extracted for the durable
decisions — unit = graphify area + global pass; the must-reproduce Verify gate; the bot-filtered
hotspot gate; the `docs/tech-debt/` registry species; the security-category deferral.

## Provenance

Session dd66811d, 2026-07-04 (architect). Fed by: deep-research run wf_128b6675-975 → captured at
`docs/kb/research/repo-technical-evaluation-for-refactoring.md` (23/25 claims verified 3-vote); working
notes `docs/proposals/technical-mine-2026-07-notes.md` (superseded by this proposal); donor evaluation
of omnishelf-docs `docs-bootstrap` Phase 5 (`phases/5-tech-debt.md`, `templates/techdebt-finding.md`,
`docs-update/phases/5-tech-debt-refresh.md`); owner preference calls 2026-07-04 (name =
mine-verify-repo, pilot = knowledge-gateway, security = deferred).
