# mine-verify-repo — Implementation

Slice 1 = Metric→Mine→Verify→Registry method text + cross-refs. Steps 1–2 executed; Steps 3–4 are
documented-only (team-lead / operator owned — see Deviations). Q1 resolved by team lead: developer
does NOT run `bump-plugin.mjs` and does NOT commit.

## Files Created
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — the new stack-neutral skill. Carries the method:
  the pipeline block; the four lenses (code-quality, architecture, performance, test-coverage); the
  global structure-graph pass + its catalog (layering / dependency-direction / god-node); the
  execution-topology paragraph (semantics inherited from mine-verify-cover — session-owned
  orchestration, staged background `general-purpose` agents, orchestrator has no filesystem);
  contracts C1–C6 transcribed from the tech-spec; the grep-checkable binding prompt obligations
  (AC-3); the safety rails (pointer to C6); the scope fence; and the relationship table. Frontmatter
  `user-invocable: true`.
- `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md` — the C1 runbook: tool-availability
  preflight (Code Maat JVM + lizard) with the documented degrade-fallback, the mandatory bot filter
  procedure, the exact `git log --numstat`-family + MSR hotspot commands, the Code Maat invocations,
  the lizard invocation, the validated-signal table, the μ+3σ AND >1-change/month hotspot filter, the
  within-repo calibration note, and the degrade-honestly report rule.
- `docs/skill-evals/2026-07-04-mine-verify-repo.md` — the `evaluate-skill` gate findings doc (Step 1's
  post-authoring gate output, per the skill's process step 5). Verdict: fix-then-accept → ACCEPT.

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — TWO surgical edits only (plan Step 2; diff kept
  scoped so it doesn't collide with the concurrent RulesRegistry edits in this file's registry
  section):
  1. `## Relationship to other skills` table — added a `mine-verify-repo` row (repo-scoped sibling
     mine; finds WHERE to refactor; composes via M2 as the behavior-preserving safety net, M1 first
     if uncovered).
  2. `## What this skill does NOT do` — the "Multi-class sweeps … graph-scoped targeting" bullet now
     points graph-scoped repo evaluation at the shipped `mine-verify-repo`; the single-class stance is
     stated as unchanged.
- `plugins/nexus-dotnet/skills/improve-architecture/SKILL.md` — added a short supersession note (a
  blockquote near the top, before `## When to Use`): its discovery phase is superseded by
  `mine-verify-repo` (ADR-46); its heuristic catalog remains donor look-for material for the mine's
  architecture lens; its architect→backlog flow for already-known improvements is untouched.

## Key Decisions
- **Structural template = mine-verify-cover.** Section order mirrors it as the plan directed: intro →
  pipeline (with four-lenses + global-pass + execution-topology subsections) → C1–C6 contracts →
  binding prompt obligations → safety rails → "What this skill does NOT do" → relationship table.
- **Angle-bracket paths use `{placeholder}` / backticks.** `docs/tech-debt/{area}.md` etc. are written
  with curly placeholders or inside code spans so skill-lint E7 (no XML/angle-bracket tokens in prose)
  passes. Greek/math glyphs (μ, σ, ×, ∩) are valid UTF-8 and pass E8; the file is written BOM-less by
  the Write tool.
- **Safety rails made a pointer to C6** (evaluate-skill finding F1): the plan's requested "safety
  rails" structural section would otherwise restate the tech-spec's `C6 — Cost & safety rails`
  verbatim. Converting it to a pointer keeps the structural landmark while giving C6 the single
  authoritative home (rubric Layer 2.1, one concept once).
- **evaluate-skill findings doc written to `docs/skill-evals/`** per the skill's own process step 5 —
  it is the skill's output artifact, not a pipeline artifact owned by another role.
- **No boy-scout pass on mine-verify-cover** — the plan explicitly caps that file's diff to the two
  Step-2 locations (concurrent RulesRegistry edits share the file); adjacent cleanup would violate the
  scoped-diff instruction.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | `evaluate-skill` (Skill tool) + `skill-lint.mjs` (Layer 0, run twice — post-author and post-fix, both `OK`) | Post-authoring gate per plan Skill Mapping. Verdict fix-then-accept→ACCEPT; F1 (Medium) + F2 (Low) fixed in-source, F3/F4 (Low) recorded. Findings doc: `docs/skill-evals/2026-07-04-mine-verify-repo.md`. TDD: no (method-text slice, no executable code — plan §Skill Mapping). |
| 2 | None | Cross-reference edits only — plan maps no skill, TDD no. |
| 3 | `release-plugin` — NOT invoked (deferred to team lead) | Plan mapped release-plugin here; Q1 team-lead resolution (release mechanics team-lead-owned, ADR-18/20) directs the developer NOT to run the bump or commit. Non-execution is plan-sanctioned, not a silent skip. See Deviations. |
| 4 | `mine-verify-repo` (the new skill) — NOT invoked (operator-owed) | Plan marks Step 4 Owner: operator, not executable in-pipeline. See Deviations. |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| AC-3 grep-checkable terms present | low | reviewer | `forbidden` on the miner estimate-ban (SKILL.md L200) + skeptic reasoning-only ban (L201–202); `dropped by the orchestrator` on the structural enforcement (L204) | re-grep to confirm the enforcement text is intact |
| AC-7 grep-checkable terms present | low | reviewer | 14 hits across four lens names, global-pass catalog, disposition enum verbatim, refresh outcomes | four lenses + global pass + `accepted \| by-design \| deferred \| resolved \| superseded` + resolved/still-active/superseded all present |
| Step-2 diff intentionally scoped | low | reviewer | only the relationship table + the does-NOT bullet changed in mine-verify-cover | the concurrent RulesRegistry edits in the same file's registry section are deliberately untouched |
| evaluate-skill F3/F4 recorded-not-fixed | low | reviewer | `docs/skill-evals/2026-07-04-mine-verify-repo.md` | model policy + fan-out receipt contract are Substrate/Workflow-inherited (slice-2); lessons routing is pipeline-owned — not defects of this slice |

## KB Changes
None. `docs/kb/research/repo-technical-evaluation-for-refactoring.md` already captures the evidence
base and needs no change (plan §KB Impact). The new `docs/skill-evals/` doc is a skill-eval artifact,
not a KB entry.

## Deviations from Plan
- **Step 3 — release NOT executed by developer (RELEASE OWED — team lead).** Plan Step 3 = "Follow
  release-plugin". Q1 team-lead resolution overrides: the developer runs no `bump-plugin.mjs` and no
  commit (release mechanics are team-lead-owned, ADR-18/20). **Owed at commit time:** run
  `node scripts/bump-plugin.mjs` once (classifies the whole working tree → both plugins PATCH: nexus
  1.21.1→1.21.2, nexus-dotnet 1.3.0→1.3.1), then **hand-escalate nexus** — edit
  `plugins/nexus/.claude-plugin/plugin.json` 1.21.2→**1.22.0** and rewrite that CHANGELOG entry header
  to `[1.22.0]` MINOR ("new capability: mine-verify-repo skill"). nexus-dotnet stays PATCH **1.3.1**
  (cross-ref note only). `--minor` is a GLOBAL flag (no per-plugin tier), so the split tier cannot be
  expressed in one flagged run — hence tool-default + hand-escalation. No `agents/*.md` changed → no
  `gen-commands` run. Then regenerate the omni twin and commit the mirrored message; **re-check the
  branch immediately before committing** — a concurrent pipeline shares this tree. Target end state:
  nexus **1.22.0**, nexus-dotnet **1.3.1**.
- **Step 4 — KG pilot NOT executed (OPERATOR ACTION REQUIRED).** Plan Step 4 Owner: operator, not
  executable in-pipeline. **Operator runs** the shipped `mine-verify-repo` skill against
  `d:\src\knowledge-gateway` — precondition: the `references/metric-layer.md` preflight passes (Code
  Maat JVM + lizard runnable, or the documented fallback consciously accepted for the run). Capture in
  the run report: bot-exclusion count, degraded signals, mined→confirmed survival rate, registry
  delta; then flow ≥1 accepted row to a KG backlog row and record the payoff baseline (hotspot scores
  + finding set at run date). Pilot findings that are skill defects come back as plugin feedback
  (`docs/plugin-feedback/` in KG), never silent local fixes. A PASS on Steps 1–3 proves the skill text
  ships and gates green — it does **not** prove AC-2/4/5/6; those land only at this run.

## Fix Cycle 1

Source: `docs/specs/adhoc-MineVerifyRepo/delivery/review-merged-cycle1.md` (team-lead-reconciled
reviewer + Codex fix-list — the single consolidated source; `review.md`/`review-codex.md` not read
directly, per the coordinator's instruction). All 3 fixes scoped to
`plugins/nexus/skills/mine-verify-repo/references/metric-layer.md`.

| # | Sev | Finding | Fix applied |
|---|-----|---------|-------------|
| 1 | HIGH | Section 2 hotspot-log command (`git log -M -C …`) omitted the bot-author filter that Section 1 mandates for "every log below" and Section 3 already applies; the prose at the time claimed "bot-filtered history" without the command filtering. | Added `--perl-regexp --author='^(?!.*(\[bot\]\|dependabot\|renovate\|autoroll))'` to the Section 2 command, matching Section 3's form exactly (same clause, same placement before `--pretty`). Section heading now states "bot-filtered, same author lookahead as Section 1" so the claim and the command agree. |
| 2 | MEDIUM | Preflight's Code-Maat-absent fallback pointed to "Section 5" for the git-only method; Section 5 is the signals table, not the fallback — the actual git-only fallback paragraph is in Section 3. | Changed the pointer to "Section 3 (the git-only fallback paragraph)". |
| 3 | MEDIUM | No Windows/Git-Bash precondition for Code Maat log generation; Code Maat expects LF line endings and a native PowerShell/cmd `>` redirect can emit CRLF. The KG pilot target (`d:\src\knowledge-gateway`) is Windows-hosted, so this was a live gap. | Added a "Windows note" paragraph in the Section 0 preflight (generate via Git Bash or ensure LF endings) and a matching inline note directly after the Section 3 log-generation command block. Additive only — no command syntax changed. |

**Verification:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-repo`
→ `OK mine-verify-repo` (re-run after all 3 fixes). No other file touched this cycle; no version bump,
no commit (per the coordinator's instruction — release stays team-lead-owned, unchanged from the
original Deviations entry above).

## Skills Used — Fix Cycle 1
| Fix | Skill(s) invoked | Notes |
|-----|------------------|-------|
| 1–3 | None | Additive text/command corrections to an already-authored reference doc — no plan step skill mapping applies to a fix cycle; `skill-lint.mjs` re-run as the mechanical gate (same tool used in Step 1). |

*Status: COMPLETE — developer, Fix Cycle 1/3, 2026-07-04*
