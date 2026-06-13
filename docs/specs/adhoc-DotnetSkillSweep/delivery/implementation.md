# adhoc-DotnetSkillSweep — Implementation

> Documentation/skill-improvement pass. No source code; outputs are markdown artifacts
> (research doc, 26 skill-eval docs, disposition table, gap proposal) and — post-checkpoint —
> skill edits + a `nexus-dotnet` release. Step 3 is a USER CHECKPOINT (hard stop): the developer
> writes `disposition.md`, hands back, and STOPS; the team lead relays for owner approval before
> any Step-4 edit.

## Files Created
- `docs/specs/adhoc-DotnetSkillSweep/delivery/research-external.md` — Step 1 external research sweep: 6 credible .NET Claude-Code skill packages found, per-package skill tables, overlap map (HIGH/MEDIUM/none vs our 26), gap table (testing skills headed it as predicted), and 10 form findings checked against Anthropic's official skill-authoring best-practices. 4 packages cloned to `D:\src\temp-skills-eval\dotnet\`.

## Files Modified

Step 4 (apply dispositions, batched A–E). Owner approved all 26 dispositions + §2.A-F rulings (disposition.md §5).

**Batch B (pattern references) — lint exit 0:**
- `skills/persistence-patterns/SKILL.md` — **blocking lint fix**: wrapped the two `<T>` heading tokens in inline code (`### Base: \`EntityConfiguration<T>\``, `### Audited: \`AuditedEntityConfiguration<T>\``) so E7 (XML-tag-in-prose) passes. Body already generic (`{Svc}` placeholders, no Fokus/sprint-rituals leak — verified by grep). No content change beyond the two headings.
- `skills/redis-patterns/SKILL.md` — **blocking lint fix**: `## Repository<T>` → `## \`Repository<T>\``. Body already generic. No other change.
- `skills/service-registration/SKILL.md` — reformat: removed the description-duplication paragraph (critic MEDIUM-2 — body line 8 restated the frontmatter verbatim, AP3 one-owner violation); `# service-registration` → `# Service Registration`; replaced the duplicated paragraph with a one-line scope sentence; added `user-invocable: true` (§2.D — pattern skill, matches Batch-B siblings).
- `skills/domain-patterns/SKILL.md` — **rewrite (§2.E genericize)**: removed the "not proven until Passes 2/3" banner; "this solution"/Fokus binding → light-stack/full-stack **variant axis** framing; demoted live `Fokus.Domain/…`/`Identity.Domain/…` paths and the `dotnet-microservices` "reference-only" labels to clearly-labelled illustrative examples; restated ADR-004 (plain-DDD identity) / ADR-007 (VO-vs-scalar) / ADR-011 (FastEndpoints publisher) as **named conventions**, not project ADR numbers. Preserved verbatim: CS9032 `required`+`private set` rule, the VO-vs-scalar rule + worked VO table, the dispatch interceptor mechanics, the `IEventHandler<T>`/`INotification` split. Net length down (201 → ~165 lines).

**§2.A — per-skill CHANGELOGs dropped to git history (estate-wide, all 5):** removed `CHANGELOG.md` from analytics-computation-service, create-aggregate, create-feature, domain-patterns, persistence-patterns (`git rm`). Zero per-skill CHANGELOGs remain under `skills/`. Per-skill evolution now lives in the plugin CHANGELOG (ADR-9 plugin versioning).

**Batch D (domain computation) — lint exit 0; rewritten in lockstep (AP2):**
- `skills/domain-service/SKILL.md` — **rewrite (§2.E)**: removed the "not proven until Passes 2/3" banner; ADR-005/006/010 → named principles (computation-in-domain / no-DTO-input / endpoint-owns-response); removed every "Target-state example (created by Pass 2/3)" / "Current before-state" / "Mapster… won't build until then" reference — pattern now ships as current; Fokus paths demoted to illustrative shapes. Preserved verbatim: pure-by-default rule, the escape-hatch read-port + Forbidden list (`IRepository<T>`/`IQueryable<T>`/`DbContext`), output-boundary + wire-only `{Mode,Multi?,Single?}` envelope rule, input boundary, the full relationship table + scope fence.
- `skills/analytics-computation-service/SKILL.md` — **rewrite (§2.E), lockstep with domain-service**: same banner/ADR/Pass-2-3 removal; kept the specialization-of-domain-service framing, the delta/direction/polarity triplet, `BuildSparkline` signature, the rolling-average `TakeLast`-after-guards caveat, multi/single split, the wire-envelope rule. Replaced "this is a project-specific type, not from BuildingBlocks. Target-state example (created by Pass 2/3)" with a plain domain-layer-type note.
- AP2 sweep verified: grep for `Fokus|sprint-rituals|Pass 2/3|target-state|won't build|not proven|ADR-0` across all 3 rewritten Domain skills (domain-patterns + these 2) returns **zero hits** — genericization fully landed, not half-done.

**Batch E (architect/process) — lint exit 0:**
- `skills/central-package-management/SKILL.md` — **scoped rewrite (§2.E)**: removed the "not proven until Passes 2/3" banner + ADR-013 heading; dropped the `D:\src\sprint-rituals\…` absolute path and the "SprintRituals / As of Pass 0" snapshot; demoted the `d:\src\dotnet-microservices\…` path to an unnamed illustrative example; ADR-013/ADR-012 references → "the CPM convention" / "the framework-currency convention". **Preserved verbatim**: the three-form verification grep (inline `Version="`, child `<Version>`, `VersionOverride=`) WITH the globstar-portability warning, and the `--include`/`--glob` dual form (the best-in-estate mechanical check).
- `skills/framework-currency/SKILL.md` — **scoped rewrite (§2.E)**: removed the banner + ADR-011/012 headings (→ named conventions); "This solution is on FastEndpoints 8.1.0" → "read the installed version from Directory.Packages.props; the 8.x table is the worked example"; demoted `GraphQLXrayClient.cs:296` / `SyncSprintsEndpoint.cs:46` to generic `httpClient`/`hubContext` examples (receiver-type is what matters). **Preserved verbatim**: the two-stage `Send*Async` detection (Stage 1 grep → Stage 2 receiver inspection), the version-verification discipline, the false-positive receiver table. Rule 1's ".NET 10" kept as the worked-example version (eval: GOOD/self-correcting).
- `skills/system-design/SKILL.md` — reformat: **fixed the Layer-1.4 mis-citation** — "Both skills are Architect-only (`user-invocable: false`)" was false (they are `true`); now states they set `disable-model-invocation: true` while staying `user-invocable: true`. Added `disable-model-invocation: true` to its own frontmatter (§2.D).
- `skills/improve-architecture/SKILL.md` — reformat: softened "we don't use ADRs" (a project-policy assertion in a shipped skill) → "findings go into the backlog or plan steps, not a separate decision-record format" (resolves the estate-wide ADR contradiction now that the Domain/CPM/framework skills no longer cite ADRs as law); added a "Use when…" clause to the description (§2.C).

**§2.D — `disable-model-invocation: true` on the 3 architect-only skills:** system-design, create-service-claude-md, create-module-claude-md (all keep `user-invocable: true`). Encodes the architect-only contract with the correct mechanism (a developer-session model won't auto-invoke them). Lint tolerates the extra frontmatter key (validates only name/description); `claude plugin validate --strict` to be confirmed at Step 7.

**Batch A (scaffolders) — lint exit 0:**
- `skills/add-integration-event/SKILL.md` — reformat: **§2.F** — replaced the empty `{ProjectName}` "Existing Integration Events" table with an "Avoid Duplicates" pointer line (grep the shared contracts package before adding); added a scope fence vs `create-domain-event-handler` (cross-service over MassTransit vs in-process reaction).
- `skills/create-grpc-contract/SKILL.md` — reformat: **§2.F** — replaced the empty `{ProjectName}` "Existing Contracts" table with an "Avoid Duplicates" pointer; added a scope fence vs `add-integration-event` (synchronous/blocking vs async fire-and-forget).
- `skills/create-domain-event-handler/SKILL.md` — reformat: added the reciprocal scope fence vs `add-integration-event` (in-process vs cross-boundary).
- `skills/create-feature/SKILL.md` — reformat: **§2.C** — replaced the non-trigger description tail ("Check the service CLAUDE.md…") with a "Use when adding a new feature slice…" clause.
- `skills/create-building-blocks-package/SKILL.md` — keep + **§2.C** description clause added.
- `skills/create-service/SKILL.md` — keep + **§2.C** description clause added (replaced the "Run … afterward" sequencing tail with a "Use when standing up a new service…" clause that keeps the sequencing note).
- `skills/create-module-claude-md/SKILL.md` — reformat: **§2.D** `disable-model-invocation: true` added (see §2.D note above).
- `skills/create-service-claude-md/SKILL.md` — reformat: **§2.D** `disable-model-invocation: true` added.
- create-aggregate, create-module — **keep**, no body edit (CHANGELOGs already dropped under §2.A; descriptions already carry a when-clause).

**Batch C (extract/refactor) — lint exit 0:**
- `skills/add-pipeline-behavior/SKILL.md` — reformat: added a one-line scope fence vs `cqrs-patterns` (cross-cutting wrapper around every handler vs one command's logic). Existing-Behaviors table kept (legit).
- `skills/extract-endpoint-types/SKILL.md` — keep + **§2.C** description clause added.
- `skills/extract-feature-service/SKILL.md` — keep + **§2.C** description clause added.

**Step 4 complete — all 26 dispositions applied; per-batch lint exit 0 for all five batches (A, B, C, D, E).**

## Step 5 — Estate-wide conformance sweep (all four checks PASS)

1. **Lint all 32 skill folders → exit 0 × 32.** Including the 6 Vue skills (create-vue-feature, frontend-review, pinia-patterns, tailwind-theme, vue-component-architecture, vue-patterns), all `OK` and untouched — proves no collateral edits leaked outside the 26 in-scope skills.
2. **`grep -rn "Adapt" disposition.md` → zero hits (grep exit 1).** No out-of-vocabulary "adapt" verdict was invented; only the five permitted verdicts used.
3. **Frontmatter sweep:** (a) every in-scope `name:` equals its folder name → 32/32 OK; (b) §2.C signature phrase — every one of the 26 in-scope descriptions carries a `Use when` / `Loaded when` clause → 26/26 OK (4 stragglers found on first pass — create-module, create-module-claude-md, create-service-claude-md, system-design — fixed to carry an explicit `Use when` clause, re-lint exit 0).
4. **`git diff --stat HEAD`:** touches only `plugins/nexus-dotnet/skills/**` (23 SKILL.md edits + 5 CHANGELOG deletions) and the pass's own `docs/specs/adhoc-DotnetSkillSweep/delivery/` artifacts (implementation.md, lessons.md, communication-log.md). **No `conventions/*.md` modified; no skill folder renamed.** Pre-existing in-flight 1.0.3 (plugin.json/CHANGELOG/conventions/csharp.md) confirmed already committed (be0818a, ancestor of HEAD) — not conflated with the sweep.

**Note for Step 7 / team lead:** `.claude/nexus-agents.json` (and the rest of `.claude/` — `.pipeline-state`, `.current-agent`, `audit/`, etc.) is pre-existing untracked pipeline-runtime state (present as `?? .claude/` before this pass began). It is **not** a skill edit or a pass doc and must be **excluded** from the Step-7 release commit. `.pipeline-state` is team-lead-owned.

## Step 6 — Gap/adoption proposal

`docs/proposals/dotnet-skill-adoptions-2026-06.md` created (exact path per plan Step 6). Genre matches the existing `docs/proposals/vwh-adoptions-2026-06.md` (per-item What / Best source / Priority / Adoption shape).
- **Part A — 9 capability gaps** (A1–A9), each traced to a research-external.md §3 row; **A1 (.NET testing skills) is the HIGH headline** — predicted by the plan, and two existing skills (`domain-service`, `persistence-patterns`) already point at the missing test as their verification step (cross-cited to those eval docs).
- **Part B — 3 form/convention deferrals** (B1 ToC, B2 `DO NOT USE FOR:` negative triggers, B3 gerund names = explicitly OUT), the §4 findings NOT applied this pass with the reason each was deferred.
- **Nothing implemented this pass** (convergent scope) — accept criterion met.

## Step 7 — Release: Follow `release-plugin` (PREPARED, not committed)

Invoked `release-plugin` (Skill tool). Precondition met (`.claude-plugin/marketplace.json` present — plugin repo).
- **Bump applied: nexus-dotnet 1.0.3 → 1.1.0 (MINOR, owner-escalated).** Initial run applied PATCH default (1.0.4); owner ruled MINOR at the checkpoint (grounds: 26-skill breadth + `disable-model-invocation` behavior change). Re-ran `node scripts/bump-plugin.mjs --minor` → 1.1.0. Dry-run attributed 23 skill changes + `owner-escalated to minor`.
- **CHANGELOG entry rewritten** from the stub to describe the actual change (genericization, blocking lint fixes, format normalization) — `--note` summary per plan ("dotnet skill estate sweep — rubric evaluation, format normalization, genericization fixes (ADR-23)"). Interim [1.0.4] stub removed; [1.1.0] header carries the full detailed entry + MINOR-tier attribution line ("MINOR tier: 26-skill breadth + `disable-model-invocation` behavior change (owner-escalated)").
- **Twin synced:** `node scripts/gen-omni.mjs` regenerated omni + omni-dotnet in the sibling repo `../omni` (ADR-6); `gen-omni.mjs --check` → **exit 0, twin in sync**. (The twin is a separate git repo, not tracked here — no untracked files appear in this repo.)
- **Validated:** `claude plugin validate plugins/nexus-dotnet --strict` → **exit 0, Validation passed.** Confirms `--strict` accepts the new `disable-model-invocation: true` frontmatter field.
- **Accept criteria:** CHANGELOG top version (1.1.0) == plugin.json (1.1.0) ✓; validate exit 0 ✓; final estate lint exit 0 × 32 ✓.
- **NOT committed** — commits are team-lead-owned (developer hard rule). Edits are staged-ready.

**Release commit contents (for the team lead — ONE commit):**
- `plugins/nexus-dotnet/.claude-plugin/plugin.json` (bump) + `plugins/nexus-dotnet/CHANGELOG.md` (entry)
- `plugins/nexus-dotnet/skills/**` — 23 modified SKILL.md + 5 deleted per-skill CHANGELOG.md
- pass docs: `docs/specs/adhoc-DotnetSkillSweep/**`, `docs/skill-evals/**`, `docs/proposals/dotnet-skill-adoptions-2026-06.md`
- **EXCLUDE `.claude/`** — pre-existing untracked pipeline-runtime state (`.pipeline-state` is team-lead-owned).

## Step 8 — Independent verification (NOT run by developer)

Step 8 is the **independent fresh-context reviewer** (pipeline Step 2 — code review). Per the developer boundary (never spawn pipeline agents / never advance the pipeline), I do **not** spawn it. Handing back to the team lead to orchestrate: the architect's Step-1 done-check, then the Step-2 reviewer over the full diff with `disposition.md` as the checklist (every row applied/deviated/missing; spot-verify 5+ grounding claims against `D:\src\dotnet-microservices`; re-run the estate lint independently).

## Step 2 complete — 26/26 skill-eval docs written (docs/skill-evals/2026-06-12-{skill}.md)
Verdict distribution: **9 ACCEPT, 11 fix-then-accept, 1 reformat (service-registration), 3 rewrite (domain-patterns, domain-service, analytics-computation-service), 2 fix-then-accept(rewrite-lite) (central-package-management, framework-currency)**. Every doc: severity-rated findings, a verdict, rubric items checked clean, ADR-1 dev-repo carve-out channel note; factual-claim findings cite the dotnet-microservices path.

Headline cross-skill findings (feed Step 3):
- **Project-binding / genericization (the pivotal estate decision).** 3 skills bind to the **Fokus** project AND document unbuilt "Pass 2/3" future state: domain-patterns, domain-service, analytics-computation-service (rewrite verdicts). 2 more carry the time-sensitive "not proven until Passes 2/3" banner + project leakage: central-package-management (references **sprint-rituals** — a DIFFERENT private project), framework-currency. The clean skills (cqrs-patterns, authorization-patterns, error-handling, all scaffolders) prove the correct generic pattern exists — leaky ones diverge from it. **The estate binds to two different private projects (Fokus + sprint-rituals) — owner must rule.**
- **Estate-wide ADR contradiction.** improve-architecture states "we don't use ADRs"; 5 siblings cite ADR-004/005/006/007/010/011/012/013 as governing law. Resolves as a side-effect of the genericization decision.
- **system-design mis-cites sibling frontmatter** (claims create-*-claude-md are `user-invocable: false`; they are `true`) — Layer 1.4 citation defect; doubles as the concrete F10 invocation-flag trigger.
- **2 blocking Layer-0 lint fails:** persistence-patterns + redis-patterns (`<T>` in prose/headings) — exact line numbers recorded in their docs for the Batch-B Step-4 fix.
- **Genericization artifacts (empty registry tables):** add-integration-event + create-grpc-contract ship empty `{ProjectName}` "Existing X" tables.
- **Per-skill CHANGELOG inconsistency:** 5 of 26 carry one (analytics-computation-service, create-aggregate, create-feature, domain-patterns, persistence-patterns); no external norm keeps per-skill changelogs.

Best-in-estate (cite as positive exemplars): create-module/create-service (hard-error preconditions + thorough fences), persistence-patterns (SetValues backing-field bug encoding), central-package-management (three-form grep + globstar-portability warning), framework-currency (two-stage Send.* detection with receiver-inspection), domain-service/system-design (cross-skill navigation + cascading-effects matrix).

## Key Decisions
- **Step 1 executed directly (WebSearch/WebFetch), not via dispatched research agents.** The 3 `general-purpose` research agents dispatched in parallel each stranded their deliverable behind a lifecycle closer (the documented failure mode; SendMessage is not available in this environment to recover them). Completed the sweep directly — explicitly sanctioned by the plan's capability-level Step-1 mandate (critic MEDIUM-1). Logged as a deviation below.
- **Grounding done once, estate-wide.** Verified the reference repo `D:\src\dotnet-microservices` topology up front (Articles.* prefix, Blocks.* packages, AggregateRoot in Blocks.Domain, protobuf-net.Grpc contracts, MassTransit in Blocks.Messaging, Modules with both archetypes, 6 Services + ApiGateway + compose). All Batch A stack claims matched — cited per eval doc rather than re-grepped per skill.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 0 | None | Operator gate — done pre-spawn (commit be0818a). Plan: TDD no, Skill none. |
| 1 | None | Research process (plan: Skill none). Executed directly via WebSearch/WebFetch — capability-level mandate (critic MEDIUM-1); dispatched research agents stranded their deliverables (deviation below). |
| 2 | **evaluate-skill** (invoked via Skill tool: `nexus:evaluate-skill`) | Followed for all 26 in-scope skills. Read its `references/rubric.md` (Layers 0-4) + `improve-skills/references/proven-patterns.md` (P1-P11, AP1-AP7). Ran `skill-lint.mjs` Layer-0 estate-wide. **Channel = ADR-1 dev-repo carve-out** (direct fix here, not feedback file) — documented in every eval doc per critic Note A / plan Step-2 Channel note. This is the sanctioned deviation from the skill's own "shipped → feedback file, never edit" rule (that rule is the consuming-project path; ADR-1: dev repo = canonical, fix here). |
| 3 | None | Synthesis / plan-level judgment (plan: Skill none). |
| 4 | **improve-skills** (invoked via Skill tool: `nexus:improve-skills`) | Followed for all five batches A-E. Applied as a **consolidating pass** (net complexity flat/down, never additive patching); checked against `references/proven-patterns.md` AP2 (sweep every surface — verified by the estate-wide grep) + AP3 (one owner per fact — drove the service-registration description-duplication removal). Write tool, UTF-8 no BOM (lint E2 confirms). **Channel = ADR-1 dev-repo carve-out** — edited `plugins/nexus-dotnet/skills/**` (the canonical source) directly, NOT the feedback file; this overrides the skill's own "edit shipped skills → feedback file" rule, which is the consuming-project path (plan Step-4 Channel note; channel is a feature-specific decision → follow the plan). Per-batch done-condition `skill-lint.mjs <folder> → exit 0` met for every batch. |
| 5 | None | Deterministic verification (plan: Skill none). Re-ran `skill-lint.mjs` ×32 + frontmatter/diff greps. |
| 6 | None | Proposal doc (plan: Skill none). |
| 7 | **release-plugin** (invoked via Skill tool: `nexus:release-plugin`) | Followed the ADR-9 flow: `bump-plugin.mjs --dry-run` → PATCH default → applied → CHANGELOG detailed entry written → owner ruled MINOR at checkpoint → re-ran `--minor` (1.0.3→1.1.0) → CHANGELOG header corrected to [1.1.0] + interim [1.0.4] stub removed → `gen-omni.mjs` + `--check` (twin in sync) → `claude plugin validate --strict` (exit 0). Did NOT commit (team-lead-owned). No gen-commands (nexus-dotnet ships no `agents/`). |
| 8 | None | Independent review — NOT run by developer (pipeline reviewer / team-lead-owned). |

## Step 3 complete — disposition.md written → USER CHECKPOINT (HARD STOP)
`docs/specs/adhoc-DotnetSkillSweep/delivery/disposition.md`: all 26 per-skill rows (9 keep / 12 reformat / 5 rewrite / 0 merge / 0 retire) + the estate-wide normalization section §2.A-F, each carrying a recommendation + confidence. Routed-out section lists conventions/core-nexus/renames/Vue (not touched). Self-check: no disposition contradicts its eval verdict (the 2 rewrite-lite cases stated); Step-5 literal `grep "Adapt"` already returns ZERO; `plugins/` tree untouched.

**Stopped here per plan Step 3: "STOP after writing — present the disposition table to the user for approval before Step 4."** The 5 rewrite verdicts and all 6 normalization rulings (§2.A-F) are owner calls — none assumed. The pivotal one is **§2.E genericization / project-binding** (recommend: genericize fully; confidence medium-high). Step 4 (the first skill edits) does not begin until the §5 approval block in disposition.md is filled.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Estate binds to TWO private projects (Fokus + sprint-rituals) + unbuilt "Pass 2/3" state | High | architect/owner | domain-patterns, domain-service, analytics-computation-service (Fokus); central-package-management (sprint-rituals); all 3 eval docs | The pivotal Step-3 §2.E decision; cascades to 5 skill bodies. Reviewer (Step 8) should verify the genericization was applied consistently (AP2 half-landed-fix risk) |
| Estate-wide ADR contradiction | Medium | architect/owner | improve-architecture "we don't use ADRs" vs 5 skills citing ADR-004…013 | Resolves as a side-effect of §2.E; flag if §2.E chooses option (b)/(c) |
| 2 blocking Layer-0 lint fails (`<T>`) | Medium | developer (Step 4) | persistence-patterns L77/L83/L86/L131-132/L167/L184-186; redis-patterns L60 (`## Repository<T>`) + L77-119 | Exact lines in the eval docs; Batch-B Step-4 fix; preserve prose semantics |
| system-design mis-cites sibling frontmatter | Medium | developer (Step 4) | system-design §3 says create-*-claude-md `user-invocable: false`; reality `true` | Layer 1.4 defect; couples to §2.D invocation-flag ruling |

## KB Changes
None — this repo has no `docs/kb/` (plan: KB Impact = None).

## Deviations from Plan

1. **Step 1 executed directly (WebSearch/WebFetch) instead of via dispatched research agents.** The 3 parallel `general-purpose` research agents each stranded their deliverable behind a lifecycle closer (the documented failure mode; `SendMessage` unavailable in this environment to recover them). Completed the sweep directly — **explicitly sanctioned by the plan's capability-level Step-1 mandate** (critic MEDIUM-1: "OMC research agents *or equivalent web/document research capability*"). Result is materially complete (6 packages found, 4 cloned, real SKILL.md frontmatter read, all four required sections). Logged in lessons.md (Developer #4-5 + improvement proposal).

2. **`evaluate-skill` channel inverted to direct fixes (ADR-1 dev-repo carve-out) — pre-resolved, not a new deviation.** The skill's own rule routes shipped-skill findings to `docs/plugin-feedback/`, never edits. In THIS repo (the canonical plugin source) the direct fix IS the canonical channel (ADR-1; critic Note A). Cited in every one of the 26 eval docs. Per skill authority: channel selection is a feature-specific decision → follow the plan. (No edits made yet — Step 4 is post-checkpoint — but the eval docs already record the channel so the reviewer doesn't read future direct edits as a violation.)

3. **Steps 1-3 were a deliberate Step-3 checkpoint stop** (now cleared — owner approved disposition.md §5). Steps 4-7 executed this round.

4. **`improve-skills` channel = direct edits to `plugins/nexus-dotnet/skills/**` (ADR-1 dev-repo carve-out), overriding the skill's "edit shipped skills → feedback file" rule.** The skill's "What This Skill Does NOT Do" lists "Edit shipped plugin skills — those route to the feedback file." In THIS repo (the canonical plugin source), the direct edit IS the canonical channel (ADR-1: "project surfaces a gap → fix in the plugin repo"; plan Step-4 Channel note; critic Note A). Channel selection is a feature-specific decision → follow the plan. **Why better/necessary:** routing 23 skill edits to a feedback file in the repo that owns those skills would be a no-op indirection — the feedback file is for *consuming* projects that can't edit the cache. The release bump (Step 7) is exactly the mechanism that ships these edits.

5. **Step 7 release PREPARED but NOT committed.** Commits are team-lead-owned — edits are staged-ready. Version tier: applied PATCH default initially; owner ruled MINOR at the checkpoint (grounds: 26-skill breadth + `disable-model-invocation` behavior change); re-ran `--minor` → 1.1.0. Final state: plugin.json = 1.1.0, CHANGELOG [1.1.0] with full detailed entry, validate exit 0, twin in sync. Both holds (commit + tier escalation) are the plan's explicit handoff boundaries — both now resolved.

6. **Step 8 (independent review) NOT run by the developer.** It is the pipeline's fresh-context reviewer (Step 2 code review), which the developer must not spawn (boundary: never spawn pipeline agents / never advance the pipeline). Handed back to the team lead.

*Status: COMPLETE (developer scope: Steps 4-7) — developer, 2026-06-12. All 26 dispositions applied; per-batch + estate lint exit 0 ×32; proposal written; release prepared (1.1.0 MINOR owner-escalated, validate exit 0, twin in sync), staged-ready and uncommitted. Awaiting the architect's Step-1 done-check, then the team lead orchestrates Step-2 review (plan Step 8) and the single release commit.*

