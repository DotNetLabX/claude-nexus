# F19-DotnetSkillCoverageWave — Implementation

Applies plugin-feedback P1–P10 to 10 shipped nexus-dotnet skills — one `edit-shipped-plugin-skill`
coherent-edit pass per skill under the F18 authoring standard (`## Assumes` first-H2 block +
minimal-stack branch/adaptation posture + `Use when` discoverability). Steps 1–8 + Step 9's estate
guards + repo lint suite are the developer's (fast-lane split — the `release-plugin` run and backlog
edits belong to the lane close, per plan §Step 9 "Executor split").

## Files Modified

### Step 1 — `authorization-patterns` (P7)
- `plugins/nexus-dotnet/skills/authorization-patterns/SKILL.md` —
  - **Description rewrite (P7 honest scope + W6-adjacent):** added the policy-based branch and the
    minimal single-stub-principal shape to the "what it does" clause; added a `Use when … choosing
    between the role/resource gate and a policy-based gate` shape; added a `Does not cover OAuth/OIDC
    sign-in middleware, client-side route guards, or 401 response interception` tail. Now contains
    `policy` (0 hits before).
  - **`## Assumes` block (F18 §4.1, new first H2 after the exemplar):** declares the closed shared role
    enum, the two-layer `RequireRoleAuthorization` infrastructure, per-service resource checkers, and
    the one shared JWT validator; escape-hatch sentence points at the two body branches (adaptation
    posture, no scaffolding just to follow along).
  - **`## Choosing your authorization model` branch (new):** frames the existing 5 phases as the
    two-layer role+resource branch (not the only truth), and adds the policy-based branch
    (`AddAuthorizationBuilder().AddPolicy` + `IAuthorizationRequirement`/`IAuthorizationHandler`) with
    when-each-fits guidance.
  - **`### Minimal shape — single stub principal` (new H3):** authentication-only single-principal
    shape with a promote-to-two-layer path (satisfies the stub/minimal-heading acceptance).
  - **Honest-scope disclaimers (new, in "What this skill does NOT do"):** OAuth/OIDC sign-in
    middleware, client-side route guards, 401/403 interception — with an explicit note that the Phase-4
    pre-processor stamp and Phase-5 JWT validation ARE covered (plan: don't disclaim those).
- **Acceptance evidence (executed):**
  - `skill-lint plugins/nexus-dotnet/skills/authorization-patterns` → `OK` exit=0 (W5 cleared; no W6).
  - `grep 'policy'` frontmatter → hit on line 3.
  - stub/minimal heading → `52:### Minimal shape — single stub principal`.
  - `^## Assumes` → line 17.

### Step 2 — `create-feature` (P1)
- `plugins/nexus-dotnet/skills/create-feature/SKILL.md` —
  - **`## Assumes` block (new first H2):** per-service endpoint framework (FastEndpoints endpoint-only
    vs Carter/Minimal-API MediatR); `GlobalExceptionMiddleware` + FastEndpoints `Send.*` (points at the
    per-framework workflows' Error Handling/Notes — does NOT duplicate them, per plan); Blocks.Core
    FluentValidation helpers + `MaxLength.C*` ladder scoped to the MediatR validator path; explicit
    no-BuildingBlocks adaptation posture (plain-FluentValidation fallback / FastEndpoints branch).
  - **No-CQRS framing (P1):** step 3 now states FastEndpoints has no separate handler (inline
    `HandleAsync`, skip `Handler.md`); the FastEndpoints folder-structure heading is relabeled
    `### FastEndpoints (endpoint-only — no CQRS/MediatR)`.
  - **GET query-string + DELETE/no-body (new Route Conventions bullets):** GET binds from the query
    string (`[FromQuery]`/`[AsParameters]`/`HttpContext.Request.Query`), no body-validation; DELETE
    carries no body, returns 204 (`Send.NoContentAsync`/`Results.NoContent()`). 0 matches before.
  - **Response-record location (new subsection):** where `{CommandType}`/`{ResponseType}` records live
    per framework; response record is the endpoint contract, never the aggregate/EF entity.
- `plugins/nexus-dotnet/skills/create-feature/workflows/Validator.md` — **HIGH-1 two-surface
  reconciliation + fallback:**
  - **FastEndpoints `Validator<T>` template switched off Blocks.Core** → `NotEmpty().WithMessage(
    ValidatorsMessagesConstants.NameRequired)` / `MaximumLength(64).WithMessage(...)`, matching
    `service-infra-conventions` §10:254/:279 (which forbid Blocks.Core helpers in a FastEndpoints
    validator). The FE code block now contains `ValidatorsMessagesConstants` and **zero**
    `NotEmptyWithMessage` (2 before, at :27-28).
  - **MediatR `AbstractValidator<T>` keeps the helpers** — labeled "the only path that uses the
    Blocks.Core message helpers."
  - **Custom Validation Extensions re-scoped to "MediatR path only"** + a **No-Blocks.Core fallback**
    (plain `NotEmpty().WithMessage(...)` / raw `MaximumLength(64)`) pointing at `service-infra-conventions`
    §10 (SKILL.md:253-272) for copy-in of the helper source.
- **DO-NOT-TOUCH honored:** `cqrs-patterns/SKILL.md:100` and `service-infra-conventions:253/:272`
  (consistent siblings for the MediatR path) left untouched; `MaxLength.C*` EF-ladder hits in
  create-aggregate/persistence-patterns untouched.
- **Acceptance evidence (executed):** skill-lint `OK` exit=0; `grep -cF 'NotEmpty().WithMessage'`
  Validator.md = 2 (≥1); FE block has `ValidatorsMessagesConstants` + 0 `NotEmptyWithMessage` (remaining
  3 hits at :53/:65/:81 are all MediatR-path); `grep -icE 'query.string|FromQuery'` SKILL.md = 3 (≥1);
  `grep -ic 'DELETE'` SKILL.md = 1 (≥1); `^## Assumes` line 10.

### Step 3 — `create-service` (P5)
- `plugins/nexus-dotnet/skills/create-service/SKILL.md` —
  - **`## Assumes` block (new first H2):** declares the BuildingBlocks package set (`Blocks.Domain`,
    `Blocks.Core`, `Blocks.MediatR`, `Blocks.EntityFrameworkCore`/`Blocks.Redis`, `Blocks.AspNetCore`/
    `Blocks.FastEndpoints`, pointing at `workflows/ScaffoldCsprojFiles.md` for the exact set), MediatR
    for Carter/MinAPI variants, the `create-service-claude-md` precondition, and the reference-app
    solution layout; escape sentence routes a no-BuildingBlocks repo to the new branch.
  - **`## Minimal-stack branch (no BuildingBlocks)` (new, authored fresh — P5):** per the plan's fokus
    F1-lessons:22 seed — packages-not-BuildingBlocks-references at each csproj/DI fork, inline
    `Entity`/`AggregateRoot` bases or none (points at Step 4's `domain-patterns` zero-dep variant),
    SQLite-first raw provider config (`UseSqlite`/raw `UseNpgsql`), no MediatR (inline endpoint
    handler), skip estate infra (docker-compose/gateway/`Security`/`Abstractions`). Fresh authored —
    nothing to promote (fokus's `create-standalone-service` never existed, plan Decisions row).
- **Acceptance evidence (executed):** skill-lint `OK` exit=0; minimal-stack heading
  `58:## Minimal-stack branch (no BuildingBlocks)`; `^## Assumes` line 10.

### Step 4 — `domain-patterns` (P6)
- `plugins/nexus-dotnet/skills/domain-patterns/SKILL.md` —
  - **`## Assumes` block (new first H2):** `Blocks.Domain` base classes; MediatR for full-stack; the
    explicit "light stack drops MediatR **but still uses `Blocks.Domain`**" clarification (plan input);
    reference app for paths/identity variants; routes a no-`Blocks.Domain` service to the new variant.
  - **`Entity<int>` vs non-generic `Entity` alias/constraint note (new bullet in the Entity section):**
    reconcile the whole generic-argument/constraint chain (repository, `IAuditedEntity<T>`, EF config)
    in one edit — a `where T : Entity<int>` meeting the non-generic `Entity` is a compile failure
    (reflekt `refactor-base-classes` evidence).
  - **`## Promoting an Entity to an AggregateRoot in place` (new recipe):** 4-step in-place promotion
    (change base → partial split → EF ownership → route writes through root) with a "not every entity
    is an aggregate" guard. Heading carries `AggregateRoot` for the acceptance grep. 0 promotion
    content before.
  - **`## Zero-dependency variant (no Blocks.Domain)` (new):** inline `Entity<TKey>`/`AggregateRoot<TKey>`/
    marker `IDomainEvent` bases (code fence), same conventions, self-dispatch after `SaveChanges`;
    points at `create-service`'s minimal-stack branch. (KG F55:28 — one shipped in KG unrecognized.)
- **Acceptance evidence (executed):** skill-lint `OK` exit=0; `grep -iE '^#{2,3}.*AggregateRoot'`
  hits `60:## Promoting an Entity to an AggregateRoot in place`; `^## Assumes` line 16.

### Step 5 — `create-vue-feature` (P2)
- `plugins/nexus-dotnet/skills/create-vue-feature/SKILL.md` —
  - **`## Assumes` block (new first H2):** the reference `client/src/` Vite+Vue3 layout (folders,
    `apiFetch`, Pinia setup stores) + the `PageLayout`/`PageToolbar` app shell + nav host; adaptation
    posture routes a differing layout to the structure-mismatch section.
  - **`## Extending an existing slice` (new — P2):** edit-in-place guidance (add field to existing
    interface / function to existing API module / refs to existing store [points at pinia-patterns'
    extend-store section] / component to existing view), with "skip route/nav when extending". The
    8-step list + Checklist were creation-only before.
  - **`## When the layout doesn't match` (new structure-mismatch callout):** different root/alias,
    feature-first structure, no `apiFetch`, different nav host — keep the six concerns, remap paths.
- **Acceptance evidence (executed):** skill-lint `OK` exit=0; extend-existing heading
  `127:## Extending an existing slice`; `^## Assumes` line 10. (W6 not flagged — description already
  carries `Use when`.)

### Step 6 — `vue-patterns` + `pinia-patterns` (P3+P4)
- `plugins/nexus-dotnet/skills/vue-patterns/SKILL.md` (P3) —
  - **W6 description fix:** added `Use when` + step-shapes (adding a composable, typing props/emits with
    script-setup macros, wiring reactivity, using a built-in component) and `URL-state sync`.
  - **`## Assumes` block (new first H2):** Vue 3.5+ / `<script setup>` / Composition API; the reference
    layout scoped to the Project Conventions section only; adaptation posture (paths discovery-driven).
  - **Project Conventions scoping:** prefixed with a "reference app's layout, not a universal Vue
    contract — discovery-driven" sentence (was flat universal-looking path claims). No external consumer
    of the `Project Conventions` heading (plan grep confirmed).
- `plugins/nexus-dotnet/skills/pinia-patterns/SKILL.md` (P4) —
  - **W6 description fix:** added `Use when` + step-shapes (create store, extend store, persist state) and
    `localStorage persistence`.
  - **`## Assumes` block (new first H2) with the §4.1 posture stated explicitly:** Pinia 3 setup stores /
    Vue 3; framework-native — no extra packages presumed; localStorage uses plain Web Storage API unless
    the project already carries a persistence plugin.
  - **`## Persisting State to localStorage` (new — P4):** seed-guarded `JSON.parse` + write-through
    `watch`, UI/preference-only rule, namespaced key, plugin-if-present. 0 localStorage hits before → 6.
  - **`## Extending an Existing Store` (new — P4):** edit-in-place (add refs/actions/getters → return
    them → consume), **explicitly contrasted with `Store Composition`** (which stays — combines separate
    stores; this grows one), per the plan Decisions row.
- **Acceptance evidence (executed):** both folders skill-lint `OK` exit=0 (W5+W6 cleared);
  `grep -ic localStorage` pinia = 6 (≥1); `^## Assumes` line 11 in both; extend-store heading
  `295:## Extending an Existing Store`.

### Step 7 — `service-registration` + `service-infra-conventions` (P8+P9)
- `plugins/nexus-dotnet/skills/service-registration/SKILL.md` (P8) —
  - **Frontmatter lead refit:** description lead changed from bare "Service DI registration —" to
    "Within-service DI layer structure — where each dependency type goes across a service's
    API/Application/Persistence layers, plus Host composition …" (was reading as module-DI while 8/9 H2s
    teach single-service/host composition); added the `choosing which layer a dependency belongs in` shape.
  - **Body-lead two-surface reconciliation (:9):** "across a service's DI layers" → "across a **single
    service's** API / Application / Persistence DI layers" — mirrors the refit lead.
  - **`## Assumes` block (new first H2) with §4.1 posture:** BuildingBlocks registration extensions +
    MediatR behavior order + reference app; adaptation posture = register equivalents directly per layer,
    "layer-placement rules stand regardless of package."
  - **Live consumers verified true post-refit:** `service-infra-conventions:287` ("The DI layer
    structure … is `service-registration`") and `file-storage-patterns:163` ("DI layer placement is
    `service-registration`") — both layer-structure framings, aligned with the refit; no edit needed.
- `plugins/nexus-dotnet/skills/service-infra-conventions/SKILL.md` (P9, narrowed) —
  - Attribution at :16/:108/:115 kept (already shipped 1.5.0 — plan Decisions row).
  - **`## Assumes` block (new first H2):** `Blocks.Core` config extensions + ambient providers, MediatR
    pipeline, CPM, reference app; adaptation posture points at §3's inline fallback.
  - **§3 no-BuildingBlocks fallback (new):** plain `AddOptions<T>().Bind().ValidateDataAnnotations().
    ValidateOnStart()` shape (or copy-in the §3 source), keeping the fail-fast guarantee.
  - **Softened the two unconditional imperatives to the reference-app branch:** :110 "This is the default
    …" → "In the reference-app stack this is the default …"; :142 "Don't call `services.Configure` directly"
    → "… **without a `ValidateOnStart()`**" with the minimal-stack alternative named.
- **Acceptance evidence (executed):** both folders skill-lint `OK` exit=0; service-registration
  description leads with "Within-service DI layer structure" (not bare "Service DI registration");
  §3-range `grep -icE 'without|fallback|no Blocks'` = 2 (≥1); `^## Assumes` at line 11 (service-registration)
  and line 18 (service-infra-conventions).

### Step 8 — `add-integration-event` (P10)
- `plugins/nexus-dotnet/skills/add-integration-event/SKILL.md` —
  - **`## Assumes` block (new first H2):** MassTransit + RabbitMQ wiring site (`AddMassTransitWithRabbitMQ`,
    points at `service-registration`), the shared `{ProjectName}.Integration.Contracts` package, and the
    `consumer-patterns` hand-off for the consumer body; adaptation note (no MassTransit → that's
    `service-registration`'s job).
  - **`## Consumer is a test harness (no production consumer yet)` (new — P10):** valid no-production-consumer
    state — still create contract+publisher, point the consumer at the test project, don't fake a no-op
    production consumer, record the gap. `consumer-patterns` hand-off kept intact as a **pointer, no
    restatement** (plan Scope: P10 stays in `add-integration-event`).
- **Acceptance evidence (executed):** skill-lint `OK` exit=0;
  `grep -icE 'test harness|test-harness|no production consumer'` = 4 (≥1); `^## Assumes` line 12;
  `consumer-patterns` referenced 4× (all pointers, no body restatement).

### Step 9 (developer portion) — estate gates + repo lint suite
Per plan §Step 9 "Executor split": the developer delivers the estate guards + green lint suite; the
`release-plugin` run and the backlog `Done` edit are the **architect's lane close**. Not run here.
- **Estate guard 1 — per-folder `^## Assumes` = exactly 1 on each of the 10 target folders** (0 each at
  baseline): all 10 report `1`.
- **Estate guard 2 — skill-lint exit 0 with zero W5/W6 warns on all 10:** all 10 `OK` (no `(with
  warnings)`), exit=0.
- **Estate guard 3 — no non-target folder gained/lost an `## Assumes` through this wave:** estate-wide
  `grep -rlE '^## Assumes' plugins/nexus-dotnet/skills/` returns **exactly the 10 target folders** (count
  10; baseline was 0). No non-target skill touched.
- **Estate guard 4 — plugin.json "37" skill count untouched:** no skills added/removed; plugin.json not
  edited by this wave (the `37` lives in its description string, line 4, intact). The version bump itself
  is the lane close's (release-plugin).
- **Repo lint suite (glob form):** `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` →
  **tests 593, pass 593, fail 0**.

## Key Decisions
- **Line-number cross-refs replaced with a section anchor (review fix).** My `service-infra-conventions`
  edits (Assumes block + §3 fallback) shifted §10's source listing down (~:253-272 → ~:280-300), which
  staled the `Validator.md` reference the plan had me cite as `SKILL.md:253-272`. Changed it to the stable
  `## 10. Validators` section anchor rather than chase the shifted line number — line numbers are fragile
  across a same-wave edit; section headings are not.
- **`create-service` minimal-stack + `domain-patterns` zero-dependency variant cross-reference each
  other.** Both new branches were authored in this wave (Steps 3 and 4); the forward/back references
  resolve within the wave and both skills exist.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | edit-shipped-plugin-skill (Read-channel deviation) | Skill tool `Unknown skill` on both `nexus:edit-shipped-plugin-skill` and bare `edit-shipped-plugin-skill` — the documented F18 cache-predates-1.46.0 trap. Consumed the recipe via Read of `plugins/nexus/skills/edit-shipped-plugin-skill/SKILL.md` + `improve-skills/references/skill-recipe.md` §4. Plan: TDD no. |
| 2 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Two-surface reconciliation (recipe §3) applied. Plan: TDD no. |
| 3 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Fresh-authored branch (recipe §1 smallest-coherent-edit). Plan: TDD no. |
| 4 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Directional-refs checked (recipe §3): "above"/"below" verified against final layout. Plan: TDD no. |
| 5 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Directional ref "below" verified against final layout. Plan: TDD no. |
| 6 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Two folders, one pass each (recipe §5 per-folder lint gate). §4.1 posture pinned. Plan: TDD no. |
| 7 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Two folders; two-surface reconciliation (desc lead ↔ body :9); live-consumer sweep (recipe §2). Plan: TDD no. |
| 8 | edit-shipped-plugin-skill (Read-channel, as Step 1) | Pointer-not-restatement discipline (recipe §3 canonical-terms). Plan: TDD no. |
| 9 (dev portion) | release-plugin — NOT invoked (lane-close scope) | Per plan §Step 9 "Executor split", the developer delivers estate guards + green lint suite; the `release-plugin` run + backlog edits are the architect's lane close. Estate guards + repo lint run below. |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Backlog F19 row already flipped to "In Progress" at dispatch | low | architect | `git diff docs/backlog.md` = Ready→In Progress + plan-path column filled; NOT my edit | The lane-close `Done` (shipped date + MINOR version) + the `release-plugin` bump + omni twin are the architect's per plan §Step 9 "Executor split" — I did not touch backlog.md. |
| `docs/backlog.md` shows ` M` in git status | low | architect | git status --porcelain | Pre-existing/architect dispatch edit, outside my write scope. Do not attribute to this wave's skill edits. |
| Exclusion-list drift since dispatch snapshot | low | architect | live `git status`: `docs/research/2026-07-22-…md` and `docs/specs/adhoc-VwhRound4Eval/` no longer appear; only `docs/specs/F27-ConventionsPipeline/` remains `??` | A concurrent session appears to have committed/moved two of the three dispatch-time exclusion entries. I touched none of them; flagging so the lane-close `git add` stays scoped to F19 files only. |

## Self-Review
**Docs-only-diff prose review (rule 5 of the dispatch).** Method: **disclosed in-context self-review** —
no Agent/Task spawn tool is available in this developer context, so per the dispatch's fallback clause I
ran the review in-context against the review-format prose angles rather than two parallel general-purpose
finder passes (F18 precedent). Angles: internal consistency, dangling cross-references, dropped/silently
narrowed guarantees, directional references, stale adjacent sentences.

**Findings folded (2):**
1. **Stale line-number cross-reference (dangling-ref angle).** `Validator.md` cited
   `service-infra-conventions` §10 as `SKILL.md:253-272`, but my same-wave edits to that file (Assumes +
   §3 fallback) shifted §10 down to ~:280-300. Fixed → stable `## 10. Validators` section anchor. Estate
   sweep confirmed this was the **only** line-number cross-ref to the shifted file (no other consumer
   cites it by line).
2. **Count drift (internal-consistency angle).** `create-vue-feature` Assumes lists the slice shape as 7
   concerns (types → api → store → components → view → route → nav) while the structure-mismatch bullet
   said "the six concerns" after listing four. Fixed → "the same concerns" (drop the brittle count — the
   enumeration trap recipe §2 warns about).

**Considered and dismissed (1):**
- **`domain-patterns` intro says "Two stack variants recur" but I added a third (zero-dependency) section.**
  Dismissed: the intro's claim is scoped to variants "called out **per pattern**" — light/full remain the
  two per-pattern axes; the zero-dependency variant is an all-or-nothing escape hatch, not a per-pattern
  callout, and the Assumes block (immediately after the intro) already routes a no-`Blocks.Domain` reader
  to it ("No `Blocks.Domain` at all? See the Zero-dependency variant below"). No contradiction; left as-is.

**Clean on the other angles:** directional refs ("above"/"below") re-verified against final layout in
every touched file (domain-patterns promotion/zero-dep, create-vue-feature, pinia extend-store,
service-infra §3); no dropped guarantees (the §3 softening keeps the fail-fast invariant, re-pinned to
`ValidateOnStart()`; the HIGH-1 reconciliation relocates rather than drops the FastEndpoints validator
guidance); sibling-skill prose references all name real skills; `create-service`↔`domain-patterns` mutual
references resolve within the wave.

**Verdict: PASS** — 2 findings folded, 1 dismissed with reason; final consolidated lint OK exit 0 zero
warns on all 10, estate guards 1–4 hold, repo lint suite 593/593.

## Deviations from Plan
- **Skill-tool channel (all steps):** `edit-shipped-plugin-skill` is not resolvable via the Skill
  tool in this session (installed cache predates nexus 1.46.0). Per the dispatch's KNOWN TRAP clause
  and the developer agent's Read-channel fallback, the recipe was consumed by Read of the live
  `plugins/nexus/skills/edit-shipped-plugin-skill/SKILL.md`. Documented valid deviation, not a failure.
- **Review method = in-context, not spawned finders.** No Agent/Task spawn tool in this context; the
  rule-5 docs-diff review ran in-context (disclosed above), the dispatch's sanctioned fallback.
- **Step 9 release + backlog `Done` NOT run (by design).** Plan §Step 9 "Executor split" assigns the
  `release-plugin` MINOR bump and the backlog `Done` edit to the architect's lane close. A developer
  Step-9 without the release run is *Implemented, not Deviated* (plan's own words).

*Status: COMPLETE — developer, 2026-07-23*
