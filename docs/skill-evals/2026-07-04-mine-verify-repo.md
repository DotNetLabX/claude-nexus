# Skill Evaluation — mine-verify-repo

**Evaluator:** developer (post-authoring gate, plan Step 1)
**Date:** 2026-07-04
**Scope:** `plugins/nexus/skills/mine-verify-repo/SKILL.md` (new) + `references/metric-layer.md` (new)
**Run artifacts consulted:** NONE — this skill has never run. It ships method text only; its behavior
is first exercised at the KG pilot (AC-6, operator-owed). Per evaluate-skill process step 2, this
verdict judges the **spec/text**, not run behavior — which is the tech-spec's intended pre-ship
posture (AC-7: "AC-1's `evaluate-skill` gate plus the grep is the ONLY pre-ship check these method
sections receive; their behavior is first exercised at AC-6").
**Channel:** dev-repo source skill (not a version-keyed cache copy) → findings fixed directly in
source, not routed to a feedback file. Plan Step 1 directs "fix findings before proceeding."

**Pilot addendum (2026-07-10):** pilot executed 2026-07-04/05 → `docs/tech-debt/` (6 areas) in
`omnishelf_flutter_app`; refresh owner = operator, `last_verified: 2026-07-05`. The eval text below
reflects the pre-pilot state and is not rewritten (adhoc-MineFamilyCore P0 record hygiene).

## Layer 0 — Mechanical (skill-lint.mjs)

`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-repo`
→ **OK mine-verify-repo** (no errors, no warnings). Verified: no BOM, frontmatter parses,
`name: mine-verify-repo` == folder, description present (within length bounds), `references/metric-layer.md`
cited-and-exists, no XML/angle-bracket tokens in prose (angle-bracket paths kept in backticks/`{}`),
no mojibake.

## F1: `## Safety rails` restated `C6 — Cost & safety rails` verbatim
**Severity:** Medium
**Layer:** 2.1 (one concept once — restated with drift risk)
**Claim vs reality:** the plan's requested structure lists a `safety rails` section AND transcribes
the tech-spec's `C6 — Cost & safety rails` contract. The first draft's Safety rails bullets
re-specified budget cap / report-on-halt / the four prohibitions — a near-duplicate of C6 that would
drift on the next edit.
**Fix (applied):** converted `## Safety rails` to a non-drifting pointer — "the safety floor is C6
above; single source; nothing here overrides it" — keeping the structural landmark the plan asked
for while making C6 the one authoritative home.

## F2: Code Maat `-a` analysis subcommands uncited
**Severity:** Low
**Layer:** 1.3 (external-system claim — cite or verify)
**Claim vs reality:** the research doc verifies the Code Maat **log-generation** command verbatim
against the Code Maat README, and names Code Maat + lizard. The `-a revisions|coupling|entity-ownership|authors|age`
invocations and `-c git2` were added from Code Maat's documented CLI, beyond the cited command.
**Fix (applied):** added a one-line citation in `metric-layer.md` §3 attributing the analysis
vocabulary to Code Maat's documented CLI (research source [9]) and marking the log command as the
README-verified one — honest provenance without changing any command.

## F3: fan-out completion-verification + model policy not stated in-skill
**Severity:** Low
**Layer:** 3 (spawns-subagents overlay)
**Claim vs reality:** the skill fans out parallel miners + a skeptic but does not spell out a
receipt/disk-verified completion contract or a model pin (mine-verify-cover has a `## Model` Sonnet
pin). **Recorded, not fixed:** these are inherited from the Substrate/Workflow model — the
orchestrator instantiates a Workflow from the method text (same as mine-verify-cover, whose own
completion verification lives in the gate battery / harness, not the method prose). Model policy and
per-stage receipts are slice-2 / harness concerns; the tech-spec scopes slice 1 to method text and
defers the harness. Naming them now would assert machinery this slice does not ship.

## F4: no explicit lessons/plugin-feedback routing line in the skill
**Severity:** Low
**Layer:** 4.1 (maintenance hooks — lessons capture)
**Claim vs reality:** the "pilot-discovered skill defects route to `docs/plugin-feedback/` in the
target repo, not silent local fixes" instruction lives in plan Step 4 + the tech-spec, not in
SKILL.md. **Recorded, not fixed:** lessons capture for nexus process skills is owned by the pipeline's
`lessons.md` flow, not per-skill prose (mine-verify-cover carries no such line either). Adding it
would duplicate a plan/tech-spec-owned instruction into the method text against Layer 2.1. Left to the
run-report + pipeline flow.

## Rubric items checked clean

- **Layer 1.1** frontmatter promise = body: every description claim (metric layer, four lenses,
  clean-room miners per graphify area, skeptic re-executes, tech-debt registry, feeds ad-hoc lane,
  stack-neutral, free tooling, not-a-class/not-a-spec) is implemented in the body.
- **Layer 1.2** guardrails vs mechanism: "never edits prod" / "must-reproduce" / "fact-shaped or it
  doesn't exist" each carry a stated enforcement (C3 orchestrator-drops-verdict-without-excerpt; C2
  judgment→lens-note; C6 prohibitions) — not bare sentences.
- **Layer 1.4** citation audit: ADR-43/45/46/49 and the research figures checked against the
  tech-spec's extracted ADRs and the research doc — all match (ADR-46 = improve-architecture
  discovery superseded; ADR-49 = docs/tech-debt species; ADR-45 = business-rules sibling species).
- **Layer 1.5** scope fence present, names adjacent skills (mine-verify-cover, mine-from-spec,
  improve-architecture, /security-review) + downstream-consumers note (C4: ad-hoc lane + M2).
- **Layer 1.6** failure modes encoded: missing tool → preflight fallback; degraded signal → report
  rule; bot contamination → mandatory bot filter; threshold over-fire → μ+3σ AND >1/month;
  LLM false-positive risk → must-reproduce gate + survival-rate metric.
- **Layer 2.3** right weight: single SKILL.md + one runbook reference — appropriate for a method
  skill (matches mine-verify-cover's shape).
- **Layer 2.4** followable cold: exact commands + named constants in the runbook.
- **Layer 2.5** no AP4 (bot list is per-repo config, not hardcoded), no AP5 (git/Code Maat/lizard are
  real; jar path is a `{path}` placeholder; the cited reference exists), AP6 finalize = report-on-halt.
- **Layer 3** unbounded-list overlay: top-N hotspot cap + honest scanned/skipped report; resumable
  overlay: idempotent re-runs + refresh-against-git-delta + rows never deleted.
- **AC-3** grep-checkable: "forbidden" on the miner estimate-ban and the skeptic reasoning-only ban;
  "dropped by the orchestrator" on the structural enforcement — all present.
- **AC-7** grep-checkable: four lens names, global-pass catalog (layering / dependency-direction /
  god nodes), disposition enum verbatim (`accepted | by-design | deferred | resolved | superseded`),
  refresh protocol (resolved / still-active / superseded) — all present.

## Verdict

**fix-then-accept → ACCEPT.** Two findings (F1 Medium, F2 Low) applied as consolidating in-source
fixes; lint re-run green after both. Two Low findings (F3, F4) recorded with rationale as
inherited/slice-2 concerns, not defects of this slice. The skill passes the gate. The one honest
caveat, per the tech-spec's own AC-7 note: this gate + the grep are the ONLY pre-ship checks; the
method's *behavior* is unproven until the AC-6 pilot.
