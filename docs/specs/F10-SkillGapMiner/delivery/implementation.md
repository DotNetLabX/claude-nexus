# F10-SkillGapMiner — Implementation

Fast-lane, architect-led. Reports to the architect (main session). No git writes (lane rule 1) —
the commit, omni-twin sync, and tag happen at lane close in the main session.

## Files Created
- `plugins/nexus/skills/mine-skill-gaps/SKILL.md` — the ninth mine (Step 1). Sweeps ONE repo's
  `docs/specs/*/delivery/` estate (plan.md + lessons.md); two-tier discovery (Tier A pre-flagged
  `## Skill Gaps` lessons entries as candidates-of-record; Tier B cross-plan clustering of unflagged
  `(none)` skill-mapping rows at the 3-plan threshold); a fresh-context skeptic that kills
  coincidental clusters; owner-triaged registry at `docs/skill-gaps/registry.md`. Light archetype,
  199-line body, born-compliant (skill-lint exit 0).
- `docs/specs/F10-SkillGapMiner/delivery/fixtures/nexus-registry.md` — Tier-A fixture output (Step 3).
- `docs/specs/F10-SkillGapMiner/delivery/fixtures/kg-registry.md` — Tier-B KG golden fixture (Step 3).

## Files Modified
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` (Step 2 + Step 5) — Step 2:
  line 3 `eight-member`→`nine-member`; enumeration gains `mine-skill-gaps` with the shape-only
  annotation; §The mine family table gains the 9th row; line 22 `all eight`→`all nine`;
  `## Routing boundary` untouched. Step 5 (code-review fold F6): §Skeptic protocol carve-out
  paragraph gains a `mine-skill-gaps` clause (mirroring `mine-verify-flows` — a re-read of artifact
  text is not a consumer of the command-re-execution must-RUN enforcement), so the core backs the
  carve-out the skill asserts.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` (Step 2 + Step 5) — Step 2: line 473
  `8-row`→`9-row`. Step 5 (code-review fold, finder B Medium): line 474's illustrative "(including …)"
  list completed to name all 7 non-head members incl. `mine-skill-gaps` and the previously-omitted
  `mine-semantic-model` (removes the stale-adjacent-sentence reading).
- `plugins/nexus/skills/mine-reference-model/SKILL.md` (Step 2) — `8-row`→`9-row`, two `all eight`→`all nine` (lines 28/29/221).
- `plugins/nexus/skills/mine-design/SKILL.md` (Step 2) — `8-row`→`9-row`, `all eight`→`all nine` (lines 25/27).
- `plugins/nexus/skills/mine-algorithm/SKILL.md` (Step 2) — `8-row`→`9-row`, `all eight`→`all nine` (lines 26/28).
- `plugins/nexus/skills/mine-verify-flows/SKILL.md` (Step 2) — `8-row`→`9-row`, `all eight`→`all nine` (line 16).
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` (Step 2) — `all eight`→`all nine` (lines 27, 276).
- `plugins/nexus/.claude-plugin/plugin.json` (Step 4) — version `1.35.0`→`1.36.0` (MINOR, new capability).
- `plugins/nexus/CHANGELOG.md` (Step 4) — new `[1.36.0]` entry describing the ninth-mine capability + family sweep.
- `docs/skill-backlog.md` (Step 1) — appended the `mine-skill-gaps` Created entry (improve-skills recipe byproduct).

## Key Decisions
- **D3 (parser): prose model-tier recipe, NO bundled script.** The tech-spec mandates tolerance of
  pre-standardization estates (`(none)` spelling variants, freeform `Gap?` cells, and — as the KG run
  proved — a `Step | Disposition` table format with no `Skill` column). A tolerant model read handles
  those better than a brittle regex parser; the parse is an input transform feeding model clustering,
  not a deterministic post-condition gate (proven-patterns P1). Consequence: no TDD sub-scope.
- **Judgment Gate folds (Step 1).** evaluate-skill returned fix-then-accept: 0 Critical; F1 (High) =
  the family-core member-count sweep = this feature's Step 2 (resolved — sweep grep now 0); F2–F5
  (2 Medium, 2 Low) folded (capture-leak registry home, skeptic disk-verify + model policy,
  not-rollbackable statement, frontmatter consumer-phrasing). Net complexity flat.
- **F19/F20/F21 tolerant re-parse (Step 3).** The strict `^Skill$`-header parser missed 3 KG plans
  whose skill-mapping table uses a `Step | Disposition | TDD | Confidence` layout (the `None` lives in
  a *Disposition* column). Recovered by a tolerant second pass (~15 rows) — exactly the skill's
  tolerant-parser posture; disclosed in the KG fixture run report and a developer lesson.
- **Uncommitted bump rides within (Steps 4–5).** The Step-5 code-review edits to
  `mine-verify-cover/SKILL.md` + `mine-family-core.md` landed *after* the 1.36.0 bump; they ride
  within the existing uncommitted bump (same feature) — no re-bump (a `--dry-run` proposing 1.36.1
  now would be a false dirty-vs-HEAD signal, not a cue).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | `improve-skills` (Skill tool), `evaluate-skill` (Skill tool) | New-Skill recipe under dev-repo carve-out; Judgment Gate via evaluate-skill + a fresh-context general-purpose evaluator subagent |
| 2 | None | prose count-sweep; plan Skill Mapping: `(none)`, TDD no |
| 3 | `mine-skill-gaps` — Read-channel deviation (plan D2) | new skill not in the 1.35.0 cache; Followed-by-Read from the working tree; fresh-context general-purpose skeptic (synchronous, D4) |
| 4 | `release-plugin` (Skill tool) | one MINOR bump after steps 1–3; dry-run reasons all-F10 |
| 5 (dispatch-baked) | `code-review` (Skill tool) + 2 general-purpose prose finders | built-in /code-review 10-angle pass (correctness: 0 code findings — diff is prose/data) + the prose angle set |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| KG fixture is a delivery copy, not the real pilot | low | architect | `kg-registry.md` D1 note | The real consumer pilot writes `docs/skill-gaps/registry.md` INTO knowledge-gateway — operator-owed, out of F10 scope |
| C8–C10 KG clusters observed but not skeptic-verified | low | architect/reviewer | `kg-registry.md` "Additional clusters" | Left unverified by design (no skeptic excerpt → not ranked); leads for a follow-up run, not padded into the gate |
| Strict `^Skill$` parser misses the `Disposition`-column table format | low | reviewer | KG F19/F20/F21 | Recovered by tolerant re-parse this run; a shipped bundled parser (if ever built) must handle it |

## Deviations from Plan
- **Step 3 mine-skill-gaps is Follow-by-Read (sanctioned, plan D2).** The new skill is not in the
  installed 1.35.0 cache, so it cannot be Skill-tool-invoked; I read the working-tree SKILL.md and
  executed it as written. Logged as the Read-channel deviation the plan pre-sanctions.
- **Step 3 KG mining done inline by the developer (architect course-correction).** The plan's
  execution used background miner subagents; a background grandchild fan-out lost 5/5 results, so —
  per the architect's binding relay — I did the mechanical `(none)`-row extraction myself with a
  deterministic PowerShell parser (D3 latitude), reserved model judgment for clustering, and kept the
  S2 skeptic a synchronous fresh-context subagent. No fabricated rows: every registry citation traces
  to an extracted row.
- **Step 5 scope extension beyond the plan's "mine-verify-cover:473 only".** Code-review finder B
  flagged line 474's adjacent illustrative member list as reading stale (AP2 half-landed-sweep). I
  completed that enumeration (added `mine-skill-gaps` + `mine-semantic-model`) — a one-line, low-risk
  fold of a real fresh-reviewer finding; documented rather than silently absorbed.

## Self-Review
**Verdict: ready for Step 1 (architect done-check).** Evidence:
- **Plan coverage:** all 4 plan steps implemented + Step-5 code-review; every step has a Files
  entry and a Skills Used row.
- **Skill conformance:** `improve-skills` + `evaluate-skill` (Step 1), `release-plugin` (Step 4),
  `code-review` (Step 5) all real Skill-tool invocations; `mine-skill-gaps` Step 3 is the plan-D2
  Read-channel deviation (documented). No TDD step (D3 shipped prose, not a script).
- **Step-1 accept:** skill-lint exit 0; Judgment Gate run (evaluate-skill, findings folded); the
  registry template names all 8 S3 fields; the append-only changelog rule is present; every
  `improve-skills` mention is recommendation-phrased (2 explicit "never invokes/routes to
  improve-skills itself").
- **Step-2 accept:** sweep grep `eight-member|all eight|8-row` over `plugins/` → **0 hits**
  (plan-time 13); family-core §The mine family carries the `mine-skill-gaps` row; offline suite green.
- **Step-3 accept:** Tier B — both author-named clusters (`orchestrator-agent-loop-wiring`,
  `raw-npgsql-persistence`) re-found **by name** with verbatim self-nomination; 7 skeptic-verified
  clusters at 3+ (exceeds the ≥4 gate); 5 citation spot-checks (0 failed to resolve). Tier A — 4
  candidate rows, `gap:` cell corroborates (not a row), zero double-counts, zero capture-leaks.
- **Step-4 accept:** `bump-plugin --dry-run` reasons named only F10 files; `--minor` applied
  (1.35.0→1.36.0); CHANGELOG described; `claude plugin validate --strict` passed; full suite green.
- **Code review:** 7 findings, all folded (finder B 1 Medium; finder A 4 Medium + 2 Low); the
  /code-review 10-angle correctness pass found 0 code bugs (diff is prose/data) and 0 CLAUDE.md
  violations. No false-positive dismissals were needed — every finding was verified real in-context.
- **Debug artifacts:** none (no TODO/HACK/FIXME; the PowerShell extractor lives in scratchpad, not
  the repo).
- **Final battery:** skill-lint OK · sweep grep 0 · offline suite 587 pass / 0 fail · plugin validate
  passed.

*Status: COMPLETE — developer, 2026-07-18*
