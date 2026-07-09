# The Conformance Reviewer — corpus-grounded advisory lens for the PR tail

**Feature Spec:** `docs/specs/adhoc-ConformanceReviewer/definition/tech-spec.md` (technical-branch
tech-spec, ADR-27 — binding cross-check is the ADR register + the three research groundings, not a
product `spec.md`)

## Context

Ships the pipeline's missing conceptual lens as one nexus skill (`conformance-review`) + its PR-tail
integration: review the **diff against the repo's own corpus** (conventions, architecture + graph
facts, reference-model, tech-debt registries, skill patterns) — never correctness, never the
deterministic tier — through a **two-stage precision-first runtime** (generate → fail-closed skeptic
filter), **capped advisory** posting, and a **calibration-before-live** gate. Evidence base:
`docs/kb/research/ai-pr-reviewer-landscape.md`, `docs/kb/research/sonar-codescene-llm-review-boundary.md`,
`definition/internal-evidence.md`.

**Grounded against live source (2026-07-08/09, this session):** team-lead Pre-Flight 4b one-read
capture (`agents/team-lead.md:231` — carries `prTail`/`prDraft`/`prReviewMode`); the PR Tail subsection
bullets at `agents/team-lead.md:391-400` (gate :393, open-PR :394, projection :395, independent-pass
:396, STOP/merge :397-400); the canonical `## Host Adapter & PR Tail` rule (`rules/agents-workflow.md:60-82`)
— its 4-op adapter surface is **unchanged** by this feature (posting the conformance review is the
existing `post-review` op). The skill-lint gate (ADR-23 born-compliant) runs via `tests/lint/*` +
`skill-lint.test.mjs`.

Impacted plugin: `nexus` (one NEW skill + team-lead agent doc). Dev-repo change → version bump in the
same commit. **Release tier: MINOR** (new opt-in capability; owner confirms at bump).

## Scope

**In scope (v1 — owner-ratified 2026-07-09)**
- New skill `plugins/nexus/skills/conformance-review/` — charter, two-stage runtime, calibration mode,
  delivery recipes (Layers A–D of the spec).
- Team-lead: `prConformance` 4b key + a PR-Tail conformance step (post-projection, opt-in, attended).
- Command regen, MINOR bump; ADR-53/54 extraction + supersession pointers (the **Graduation** section
  below — architect-owed, carries AC-E.1/E.2).
- The supersession edits to the parked `adhoc-PRReviewTailV2` files (already on disk) ride in the same
  commit.

**Out of scope (NOT planned here)**
- The `guard.js` hardened-mode `gh` block — deliberately excluded (own tiny pass; keeps this pass free
  of runtime hook code — see Decisions).
- Unattended/Action-triggered runs; learner loop-back from dismissals; Sonar/linter-output ingestion;
  non-GitHub hosts; any `agents-workflow.md` edit (adapter surface unchanged — see Decisions).
- Any change to reviewer/critic/developer roles — the skill lives outside the pipeline (ADR-53 draft).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | The `conformance-review` SKILL.md — charter, runtime, calibration, delivery | |
| 2 | (none) | — | no | 4b: append `prConformance` (default false) to the one-read capture | |
| 3 | (none) | — | no | PR-Tail: conformance step bullet between projection and STOP/hand-off | |
| 4 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | |
| 5 | (none) | — | no | Skill-lint + lint/unit suite green (born-compliant gate) | |
| 6 | release-plugin | Follow | no | MINOR bump + CHANGELOG, same commit; omni follow-through | |

All editing steps `Skill: None` (agent-doc / skill-authoring prose; the documented all-`None` shape) —
`TDD: no` throughout: no runtime code in v1 (spec d5 — the runtime is skill prose orchestrating helper
agents), so acceptance is grep-checkable presence + the lint gates. The calibration RUN is operator-owed
(below), not a numbered developer step.

## Domain Model Changes

None.

## Data Model Changes

Two optional keys on the `.claude/nexus-agents.json` contract (read at the existing 4b one-read; absent
→ defaults, never asked): `prConformance`: bool (default `false`) — offer the conformance review at the
PR tail; `prConformanceCap`: int (default `5`) — max findings posted. Orthogonal to `prReviewMode`
(projection) — do not merge them.

**Binding surfaces:** the key names `prConformance` / `prConformanceCap` + defaults; the skill
folder/name `conformance-review`; the charter's six check categories and the exclusion list (they are
ADR-53 content); the calibration report's verdict marker line `## Owner verdict: PASS|FAIL`. Bullet
wording, finding-record field names, and SKILL.md section ordering are the developer's call
(skill-lint requires only valid frontmatter, no body sections — critic-verified).

## Implementation Steps

### Step 1 — Create the `conformance-review` skill
**Files:** `plugins/nexus/skills/conformance-review/SKILL.md` (new; frontmatter `name`,
`description` with when-to-use triggers, per house skill shape)
The skill carries four parts — content per the tech-spec layers, written as method prose (no scripts):
1. **Charter** — the six checks (semantic naming; convention conformance vs `docs/conventions/`
   Read-Index; pattern divergence vs shipped skills + `docs/reference-model.md`; architecture/layering
   intent vs `docs/architecture/` + graphify facts if present; debt-delta vs `docs/tech-debt/`;
   semantic duplication). The permanent exclusions (correctness; the deterministic tier per the T3
   boundary entry — name it; git-history metrics). **Cite-or-drop** stated as a hard rule: every
   finding cites its corpus source (file + section); no citable basis → dropped at Stage 2. **No
   corpus, no review**: with none of the grounding artifacts present, decline with a one-line
   explanation. Advisory-forever posture: COMMENT events only, never a gate, never merge authority.
2. **Two-stage runtime** — Stage 1 (generate): helper agent reads the diff + *targeted* corpus facts
   (relevant convention sections, matched pattern names, graph facts) — an explicit "never stuff whole
   source files" rule; emits candidates `{category, corpus citation, file:line in diff, rationale,
   confidence high|medium}`. Stage 2 (filter): a fresh-context skeptic per batch tries to refute each
   candidate (citation real? diff actually read correctly?); unconfirmed → killed (logged, not
   posted). Cap survivors at `prConformanceCap` (default **5**), highest confidence first, remainder
   as one collapsed summary line. Helper model: the configured sonnet-class tier from
   `.claude/nexus-agents.json`, never the main-session model by default.
3. **Calibration mode** — replay the last K (default **5**) merged feature diffs from git history
   (`git log --merges` / feature-branch diffs; no PR needed), write
   `docs/specs/adhoc-ConformanceReviewer/delivery/calibration-report.md`: every surviving finding +
   citation + a grading column (valid / noise / wrong-citation) for the owner, and a report template
   ending in the **verdict marker line `## Owner verdict: PASS|FAIL`** (ships as
   `## Owner verdict: UNGRADED`). **Fail-closed live gate:** the skill's PR-posting section opens
   with the deterministic check — grep the report for `## Owner verdict: PASS`; anything else
   (absent file, UNGRADED, FAIL) → calibration-only mode.
4. **Delivery recipes** — (a) PR: one review via `gh api --method POST
   repos/{owner}/{repo}/pulls/{n}/reviews`, `event: COMMENT` (always — self-PR restriction),
   `commit_id` from `gh pr view --json headRefOid`; `comments[]` only for findings whose file+line
   fall **inside the PR diff hunks** — parse `gh pr diff` `@@` hunk headers: for `@@ -a,b +c,d @@`
   the postable new-side range is lines `c` through `c+d-1`, always `side: RIGHT`, preferring added
   lines; a file-level `--name-only` check is insufficient (the API 422s on out-of-hunk lines).
   Keep every `gh` recipe inside fenced code blocks and use `{file}`-style (never `<file>`)
   placeholders in prose — skill-lint E7 rejects angle-bracket tags outside fences. Body = provenance line
   ("Conformance review (advisory) — grounded in this repo's docs/conventions + architecture; not a
   correctness review") + out-of-hunk findings. Fallback: any POST failure → one
   `gh pr review --comment --body-file` body. (b) Standalone: same charter + stages on a
   diff/branch/PR#, terminal output, no posting.
**Acceptance (grep-and-confirm on the new SKILL.md):** frontmatter `name: conformance-review`; tokens
`cite-or-drop` (or `cite or drop`), `No corpus, no review` (or equivalent stated rule), all six check
category names, `never` + `correctness` in the exclusions, `deterministic` + a pointer to the T3
research entry, `skeptic` + `fail-closed` (the Stage-2 refute/kill rule — AC-B.2), a helper-model
rule naming the configured sonnet-class tier (AC-B.4), `calibration-report.md`,
`## Owner verdict: PASS` as the gate's grep target (AC-C.2), `event: COMMENT`, `headRefOid`, `@@`
(hunk parsing with the `+c,d` range rule), `gh pr review --comment --body-file` (fallback, inside a
code fence), `prConformanceCap`, a "never stuff whole source files" (or equivalent) context rule,
the provenance line, and a standalone-invocation section naming `/nexus:conformance-review` with
terminal output (AC-D.4).
`Satisfies:` AC-A.1, AC-A.2, AC-A.3, AC-B.1, AC-B.2, AC-B.3, AC-B.4, AC-C.1, AC-C.2, AC-D.1, AC-D.2, AC-D.4
**Confidence: medium** — no direct precedent for a two-stage reviewer skill in the estate; the closest
shapes are `mine-verify-cover` (miner→skeptic) and `review-format` (finding grammar). Explore both
before writing; ask if the calibration-gate wording fights the skill-lint required sections.

### Step 2 — Team-lead Pre-Flight 4b: append `prConformance` (+ cap)
**File:** `plugins/nexus/agents/team-lead.md` (4b, `:231` — the existing one-read capture)
Append `prConformance` (bool, default `false`) and `prConformanceCap` (int, default `5`) to the same
capture sentence carrying `prTail`/`prDraft`/`prReviewMode`. Missing → defaults, never ask; cached for
closure; no second config read. ADR-30: existing keys' wording byte-unchanged; the edited line's `±`
diff pair is the expected shape.
**Acceptance:** 4b lists both new keys with defaults in the same single read; grep `prConformance`.
`Satisfies:` AC-D.3 (config half)
**Confidence: medium** — read the current 4b bullet first; hazard is disturbing the existing capture.

### Step 3 — Team-lead PR Tail: the conformance step
**File:** `plugins/nexus/agents/team-lead.md` (Commit Protocol → PR Tail; insert a new bullet
**between** the independent-pass bullet (`:396`) and the "AI goes first, then STOP" bullet (`:397`);
all sibling bullets byte-unchanged)
The bullet: with `prConformance: true` (4b) — or offered once, attended, when the key is absent —
invoke the **`conformance-review` skill** on the open PR after the projection posts. (The placement
after the independent-pass bullet is deliberate: conformance is the final AI payload before the
hand-off; "post-projection" per AC-D.3 is satisfied — critic open-question resolved.) State: it is the
*conceptual* lens (conventions/patterns/naming — not correctness, not a second reviewer); it respects
the skill's calibration gate (uncalibrated → the skill declines PR posting); host-gated + attended-only
via the canonical rule (reference, don't restate); its comments are advisory and land before the
human hand-off (the STOP bullet's "AI review posted" hand-off message now covers both payloads —
extend that hand-off line to mention conformance comments when they were posted; that hand-off edit is
part of this step and is the ONLY sibling-line change).
**Acceptance:** new bullet present between :396/:397 anchors containing `conformance-review`,
`calibration`, `advisory`, and a not-correctness clause; `git diff` shows gate/open-PR/projection/
independent-pass bullets unchanged and only the sanctioned hand-off line edit in the STOP block.
`Satisfies:` AC-D.3

### Step 4 — Regenerate commands
**File (generated):** `plugins/nexus/commands/team-lead.md`
`node scripts/gen-commands.mjs nexus`. Do not hand-edit. Known pre-commit git-HEAD false-positive in
`selfcheck.mjs` — do not bounce (house lesson).
**Acceptance:** `commands/team-lead.md` matches the agent edits.

### Step 5 — Lint gates green (born-compliant, ADR-23)
Run the lint + unit suites (`tests/lint/*`, `tests/unit/skill-lint.test.mjs` among them) — the new
skill must pass skill-lint **as shipped**; fix its structure (not the lint) on failure. No hook files
are touched in this pass, so `attended-unchanged.golden.test.mjs` must pass unmodified — a failure is
a regression, not a re-baseline.
**Acceptance (mechanism):** lint + unit suites green; skill-lint reports the new skill compliant;
golden test untouched and green.
`Satisfies:` AC-E.3 (gate half)

### Step 6 — Version bump + release
**Files:** `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` (via the skill)
Follow `release-plugin` — **MINOR** (`bump-plugin.mjs --minor`; owner confirms tier at bump), same
commit as the edits. The already-on-disk supersession edits (`adhoc-PRReviewTailV2` tech-spec + plan
banners) and the research/internal-evidence docs ride in the same commit series. Omni twin regenerated
+ committed in `../omni` (mirrored subject) — team-lead/owner follow-through; sequence the ADR
extraction (Graduation) before the omni sync or fold it into the feature commit.
**Acceptance:** minor version incremented; CHANGELOG names the conformance-review skill, the two 4b
keys, and the PR-tail step; bump in the same commit as the plugin edits.
`Satisfies:` AC-E.3

### Operator-owed (NOT a developer step): the calibration run + grading
The pass verdict is inherently the **owner's** call (AC-C.2), and the two-stage multi-agent run is
**orchestrator-owned** — the session that owns spawning runs it (the mine-verify-cover topology; a
pipeline subagent must-not commission it per ADR-21 policy — a policy boundary, not a platform
inability). **Plan-sanctioned**: the developer only verifies the skill's calibration instructions are
complete and runnable. **OPERATOR ACTION REQUIRED** (owed in implementation.md): the owner (or a
main-session solo run) executes calibration mode over the last 5 merged diffs, grades
`calibration-report.md`, and flips its `## Owner verdict:` line — the skill's PR posting stays locked
until it reads `PASS`. A PASS on this plan proves the method ships; it does **not** prove calibration
precision — that is the operator's arm (AC-C.2's gate is the enforcement).
`Satisfies:` AC-C.1/C.2 (build half)

## Graduation (architect-owed, post-critic — NOT a developer step)

Per ADR-27/28, after this plan's implementation the architect:
- **(a)** Extracts **ADR-53** (Conformance Reviewer) and **ADR-54** (precision-first runtime) verbatim
  from the tech-spec into `docs/architecture/README.md` — **both surfaces**: `## ADR-N` bodies appended
  after ADR-52, and index lines in the contents block (authored at extraction time). **Re-check the
  register's highest number immediately before extracting** — a same-day collision already forced one
  renumber (critic CRITICAL, 2026-07-09).
- **(b)** Adds the **ADR-35 tradeoff pointer** (AC-E.2 clause 2): ADR-35's roadmap/tradeoff line gains
  a pointer to this feature for the absorbed delivery mechanics. (Clause 1 — the parked v2 `Superseded`
  banners — is already on disk, critic-verified.)
- **(c)** Confirms the tech-spec `Status: Ready` note records the extraction.
Sequence before the omni sync or fold into the feature commit (Step 6's ordering note).
`Satisfies:` AC-E.1, AC-E.2

## Cross-Service Changes

None.

## Migration Notes

None — both config keys optional, defaults preserve today's behavior exactly.

## Testing Strategy

- No runtime code in v1 (spec d5) → no new unit tests. The gates: **skill-lint** (born-compliant) +
  the full lint/unit suite + per-step grep acceptance above.
- **Golden negative-control** (`tests/unit/attended-unchanged.golden.test.mjs`): must pass unmodified
  — this pass touches no hook surface (the `guard.js` gh block is explicitly out of scope).
- No live `gh`/API calls at build time; delivery recipes are exercised at a real closure after the
  operator-owed calibration clears.

## KB Impact

None to update — the three groundings were written this session (two pool entries + internal-evidence)
and the landscape entry's Recommendation already describes this feature. No numbered KB step needed.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| `guard.js` hardened `gh` block excluded from this pass | Keeps the pass prose-only (no runtime hook code, no golden-test risk); the block is independent and tiny | Bundle it (one release, but widens blast radius + forces hook-code review into a skill-authoring pass) | decided |
| No `agents-workflow.md` edit | The ADR-36 adapter surface is unchanged — posting the conformance review IS the `post-review` op; a rule edit would be scope creep | Add a conformance sentence to the canonical rule | decided |
| Calibration K default = 5 diffs | Enough to judge precision patterns, cheap to grade in one sitting | 10+ (heavier grading session for marginal signal) | decided |
| `prConformanceCap` exposed as a 4b key (not hardcoded) | The cap is a per-repo noise-tolerance preference; config is the cheapest escape hatch | Hardcode 5 in the skill | decided |
| Release tier MINOR | New opt-in capability; mirrors v1 PR-tail tier | PATCH / MAJOR (nothing breaks or reverses) | deferred — owner confirms at bump |

## Open Questions

None. Owner forks resolved 2026-07-09 (build-not-buy; PR-triggered-before-human; ratify + plan-now at
the definition checkpoint). The calibration precision bar is deliberately the owner's call at grading
time (ADR-54 draft), not a plan unknown.

## Plan Review

Code-grounded critic (Mode 2). **Verdict: GO-with-fixes** — all folded. AC coverage 16/16 after fixes
(was 14/16: AC-E.1/E.2 orphaned). Verified TRUE against live source: 4b capture (`team-lead.md:231`),
PR-Tail bullet anchors (:393–:400) + Step 3's insertion point, the unchanged 4-op adapter surface
(no `agents-workflow.md` edit needed), skill-lint requiring frontmatter only (no grep-vs-shape
conflict; skills auto-discover as `/nexus:{name}`), the golden negative-control untouched by this
pass, all three research groundings, and the v2 supersession banners on disk.

| Finding | Fix folded into |
|---|---|
| CRITICAL — ADR-52 taken same-day by `adhoc-AgentGrounding`; extraction as 52/53 would corrupt the register | Renumbered **ADR-53/54** across tech-spec, plan, and the parked-v2 banner; Graduation (a) adds a re-check-before-extract rule |
| HIGH — AC-E.1/E.2 orphaned (no step, no Graduation section; ADR-35 pointer unassigned) | New **## Graduation (architect-owed)** section, `Satisfies: AC-E.1, AC-E.2` |
| HIGH — operator-owed carve-out cited the false "subagents can't sub-spawn" claim (debunked by ADR-21's own correction) | Re-grounded: verdict is owner's; run is orchestrator-owned (mine-verify-cover topology); ADR-21 is policy, not platform |
| MED — Step 1 acceptance lacked tokens for B.2/B.4/C.2/D.4 | Tokens added (skeptic+fail-closed, helper-model, `## Owner verdict: PASS`, standalone section) |
| MED — go-live gate verdict marker unspecified | Binding marker `## Owner verdict: PASS\|FAIL` (ships UNGRADED); gate = deterministic grep |
| MED — skill-lint E7 hazard on `<file>` placeholders | Step 1 rule: recipes in code fences, `{file}`-style in prose |
| MED — hunk mechanics under-specified | `@@ -a,b +c,d @@` → new-side range `c..c+d-1`, `side: RIGHT`, prefer added lines |
| LOW — Data Model undercounted keys | Two keys; both binding; verdict marker added to binding surfaces |
| LOW/ADV — inline-posting recipe is a third locus off the ADR-36 seam | Recorded in ADR-53's tradeoffs (spec) |
| Open question — conformance step ordering vs independent-pass bullet | Resolved as deliberate (final AI payload before hand-off), noted in Step 3 |
