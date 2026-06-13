# adhoc-DotnetSkillSweep — Disposition Table (Step 3 synthesis)

**Date:** 2026-06-12
**Inputs merged:** `delivery/research-external.md` (Step 1) + the 26 `docs/skill-evals/2026-06-12-{skill}.md` docs (Step 2).
**Disposition vocabulary (plan Step 3):** `keep` · `reformat` (structure only) · `rewrite` (content defects) · `merge` (name the absorbing skill) · `retire` (name the migration note). These five are the ONLY permitted verdicts — the Step-5 grep verifies no out-of-vocabulary verdict (the forbidden token begins with A-d-a-p-t) was invented.
**Status: APPROVED 2026-06-12** (owner, no overrides — see §5). Per the plan, `merge`/`retire` verdicts and every estate-wide normalization decision are owner calls — **none were assumed**. Step 4 proceeded only after this approval.

---

## 1. Per-skill dispositions (all 26)

Each row cites its findings doc. Where a disposition could look like it contradicts the doc's verdict, the reason is stated. "Effort" is the Step-4 batch cost.

| # | Skill | Batch | Eval verdict | **Disposition** | Effort | Basis (findings doc) |
|---|-------|-------|--------------|-----------------|--------|----------------------|
| 1 | add-integration-event | A | fix-then-accept | **reformat** | S | Drop empty `{ProjectName}` registry table → pointer line; add adjacency fence vs create-domain-event-handler |
| 2 | add-pipeline-behavior | C | fix-then-accept | **reformat** | XS | Add one-line scope fence vs cqrs-patterns. (Existing-Behaviors table is legit — keep) |
| 3 | analytics-computation-service | D | rewrite | **rewrite** ⚠ owner | L | Genericize Fokus binding; **remove all "Pass 2/3 / target-state / won't-build" framing**; restate ADRs as named principles. Lockstep with domain-service |
| 4 | authorization-patterns | B | ACCEPT | **keep** | — | Clean, genericized exemplar. (Optional: fence — deferred) |
| 5 | central-package-management | E | fix-then-accept (rewrite-lite) | **rewrite** ⚠ owner | M | Remove banner + sprint-rituals "Pass 0" snapshot; **preserve the three-form grep + globstar warning verbatim**; restate ADR-013 as a named convention |
| 6 | cqrs-patterns | B | ACCEPT | **keep** | — | Clean genericization exemplar — designate the Step-3 reference for "how to document variants without project-binding" |
| 7 | create-aggregate | A | ACCEPT | **keep** (CHANGELOG → §2.A) | XS | Best-in-class failure-mode encoding. Only the estate CHANGELOG decision touches it |
| 8 | create-building-blocks-package | A | ACCEPT | **keep** | — | Reference-quality thin scaffolder |
| 9 | create-domain-event-handler | A | fix-then-accept | **reformat** | XS | Add adjacency fence vs add-integration-event |
| 10 | create-feature | A | fix-then-accept | **reformat** | XS | Append when-to-use to description (§2.C); CHANGELOG → §2.A |
| 11 | create-grpc-contract | A | fix-then-accept | **reformat** | S | Drop empty `{ProjectName}` registry table → pointer; add fence vs add-integration-event |
| 12 | create-module | A | ACCEPT | **keep** | — | Best-in-class heavy scaffolder |
| 13 | create-module-claude-md | A | fix-then-accept | **reformat** | XS | F10 invocation-flag (§2.D) — depends on the §2.D ruling |
| 14 | create-service | A | ACCEPT | **keep** | — | Best-in-class heavy scaffolder |
| 15 | create-service-claude-md | A | fix-then-accept | **reformat** | XS | F10 invocation-flag (§2.D) |
| 16 | domain-patterns | B | rewrite | **rewrite** ⚠ owner | L | Genericize the "this solution"=Fokus binding; remove "not proven until Passes 2/3" banner; ADR-004/007/011 → named conventions. **Anchors the §2.E genericization decision** |
| 17 | domain-service | B/D | rewrite | **rewrite** ⚠ owner | L | Genericize Fokus binding; remove banner + Pass-2/3/won't-build refs; ADR-005/006/010 → principles. Lockstep with analytics-computation-service |
| 18 | error-handling | B | ACCEPT | **keep** | — | Clean, genericized, followable-cold |
| 19 | extract-endpoint-types | C | ACCEPT | **keep** | — | Clean; fence is a model for the estate |
| 20 | extract-feature-service | C | ACCEPT | **keep** | — | Clean, guardrail-rich |
| 21 | framework-currency | E | fix-then-accept (rewrite-lite) | **rewrite** ⚠ owner | M | Remove banner; demote `GraphQLXrayClient.cs:296`/`SyncSprintsEndpoint.cs:46` to generic examples; **preserve two-stage Send.* detection verbatim**; ADR-011/012 → named conventions |
| 22 | improve-architecture | E | fix-then-accept | **reformat** | XS | Reconcile the "we don't use ADRs" line with §2.E (resolves automatically if Domain skills genericize) |
| 23 | persistence-patterns | B | fix-then-accept | **reformat** | S | **Blocking lint fix** (`<T>`→`{T}`/fence at L77/L83/L86/L131-132/L167/L184-186); CHANGELOG → §2.A. Preserve all prose semantics |
| 24 | redis-patterns | B | fix-then-accept | **reformat** | S | **Blocking lint fix** (`<T>`, headline `## Repository<T>` L60). Preserve prose |
| 25 | service-registration | B | reformat | **reformat** | S | Drop the description-duplication paragraph (critic MEDIUM-2); `# service-registration` → `# Service Registration`; decide trailing trigger; add `user-invocable` (§2.D) |
| 26 | system-design | E | fix-then-accept | **reformat** | XS | Fix the `user-invocable: false` mis-citation (Layer 1.4) — depends on §2.D ruling |

**Disposition summary (exact, from the 26 rows above):** **9 keep · 12 reformat · 5 rewrite · 0 merge · 0 retire.**

> The 5 rewrite-class rows split into 3 full rewrites (Fokus-bound Domain skills: analytics-computation-service, domain-patterns, domain-service) + 2 *scoped* rewrites (central-package-management, framework-currency — remove the banner + project-snapshots, **preserve the excellent mechanical content verbatim**). None is a from-scratch rewrite; all keep their valuable patterns. The 9 keep: authorization-patterns, cqrs-patterns, create-aggregate, create-building-blocks-package, create-module, create-service, error-handling, extract-endpoint-types, extract-feature-service.

**No `merge` and no `retire`:** every skill has a distinct, non-overlapping job (confirmed by the overlap map — our scaffolders and specialized skills are unmatched even externally). No skill is redundant with another; no skill is dead. The closest merge candidate — analytics-computation-service into domain-service — is explicitly rejected: analytics-computation-service correctly models itself as a *specialization* (read domain-service first, all its rules apply), and the specialization carries real analytics-only content (sparklines, delta/direction/polarity, rolling averages). Keep both.

---

## 2. Estate-wide normalization decisions (each needs an owner ruling)

Each carries before/after and a **recommendation + confidence**. These are the owner calls the plan reserves.

### §2.A — Per-skill CHANGELOG policy
**Current:** 5 of 26 carry `CHANGELOG.md` (analytics-computation-service, create-aggregate, create-feature, domain-patterns, persistence-patterns); 21 don't. No external package keeps per-skill changelogs (research F9); the repo already version-keys the whole plugin (ADR-9).
**Options:** (a) **drop all 5 to git history** (delete the files); (b) keep all 5 and *add* changelogs to the other 21 (consistency upward); (c) leave as-is.
**Recommendation:** **(a) drop all 5.** **Confidence: medium.** Per-skill changelogs duplicate git history and ADR-9 plugin versioning; no external norm supports them; the content ("reconstructed from git history") is recoverable. Downside: loses the human-readable per-skill evolution notes — but those belong in the plugin CHANGELOG. *Owner may prefer (c) if the per-skill notes are valued.*

### §2.B — `workflows/` vs `references/` subdirectory convention
**Current:** 9 scaffolders use `workflows/`; 0 in-scope skills use `references/` (only Vue's vue-patterns does, out of scope). Anthropic's guidance legitimizes BOTH (`references/` for progressive disclosure; the "Workflows and feedback loops" section blesses step-folders).
**Options:** (a) **keep `workflows/` for scaffolders** (it matches the official *workflow* pattern — sequential generative steps), reserve `references/` for non-sequential reference material (none currently); (b) rename all `workflows/`→`references/` for uniformity.
**Recommendation:** **(a) keep `workflows/`.** **Confidence: high.** The scaffolder workflow files ARE sequential procedures (the official workflow pattern), not reference lookups; renaming would be churn for no legibility gain and 40 file-citation updates. State the convention explicitly ("`workflows/` = ordered generative steps; `references/` = non-sequential lookup material") so future skills pick correctly. No file moves this pass.

### §2.C — Description / trigger phrasing standard (research F1)
**Current:** descriptions are inconsistent — some have a when-to-use clause ("Use when…", "Loaded when…"), some are what-it-does only (create-building-blocks-package), one has a non-trigger tail (create-feature: "Check the service CLAUDE.md…"). Anthropic's guidance: every description states what-it-does AND when-to-invoke with key terms, third person.
**Options:** (a) **standardize: every description = "{what it does}. Use when {trigger + key terms}."** third person; (b) leave as-is.
**Recommendation:** **(a) standardize on the when-to-use clause.** **Confidence: high.** This is official Anthropic guidance, the best externals all do it, and it improves auto-invocation discovery. Signature phrase for the Step-5 spot-grep: a `Use when` / `Loaded when` clause present in every in-scope description. Low-risk, additive. **Names frozen** (research F3) — only descriptions change. Apply only to skills already being edited (reformat/rewrite) plus the `keep` skills whose description lacks the clause (touch-description-only).

### §2.D — Frontmatter invocation-flag standard (research F10; system-design F1)
**Current:** inconsistent — some set `user-invocable: true` (domain-patterns, the Batch-B/D/E pattern skills, create-*-claude-md), most scaffolders set nothing. None sets `disable-model-invocation`. system-design *mis-cites* create-*-claude-md as `user-invocable: false` (they're `true`).
**The real question:** should **architect-only** skills (create-service-claude-md, create-module-claude-md, system-design) be **model-invocable**? They are design-time architect tools; a developer-session model should not auto-invoke them.
**Options:** (a) **architect-only skills set `disable-model-invocation: true` (keep `user-invocable: true`); developer scaffolders leave model-invocation on; standardize the rest per family**; (b) just fix the system-design mis-citation to match current reality (`user-invocable: true`) and change nothing else.
**Recommendation:** **(a) set `disable-model-invocation: true` on the 3 architect-only skills**, then correct system-design's citation to describe the real flags. **Confidence: medium.** It encodes the actual intent (architect-only ≠ model-auto-invoked) with the correct mechanism (rubric 1.2 wants the *mechanism*, not prose). Downside: behavior change (the model can no longer auto-invoke those 3) — but that matches their stated "Architect-only" contract. *Owner may prefer (b) minimal if wary of changing invocation behavior.* **This must be settled before system-design (#26) and create-*-claude-md (#13, #15) are edited.**

### §2.E — Fate of genericization artifacts + project-binding (THE pivotal decision)
**Current:** the estate binds to **two different private projects**: **Fokus** (domain-patterns, domain-service, analytics-computation-service — live paths `Fokus.Domain/…`, `Fokus.API/…`, live VOs `HealthThresholdConfig`/`BugRatioScorer`) and **sprint-rituals** (central-package-management — `D:\src\sprint-rituals\…`). Five skills also reference internal **ADR-004…013** as governing law (improve-architecture says the opposite: "we don't use ADRs"). Three skills document **unbuilt "Pass 2/3" future state** ("won't build until then"). The reference repo for THIS sweep is `dotnet-microservices` (a third project). Separately, two scaffolders ship empty `{ProjectName}` "Existing X" registry tables.
**Options:**
- (a) **Genericize fully.** Replace "this solution"/"this stack" with generic placeholders (`{the service}`/`{project}`); demote ALL named-project specifics (Fokus, sprint-rituals, dotnet-microservices) to clearly-labelled *illustrative examples*; **remove all Pass-2/3 / target-state / won't-build framing**; restate ADR-004…013 as named conventions (the rule, not the project's ADR number); drop the empty registry tables → pointer lines. Result: app-agnostic shipped skills (what a plugin skill should be — research F1, and the ADR-1 spirit).
- (b) **Bind to one named baseline.** Pick ONE reference project (presumably `dotnet-microservices`, the sweep's reference), relabel everything to it honestly, still remove the unbuilt Pass-2/3 references. Weaker for reuse but less rewrite.
- (c) Leave as-is.
**Recommendation:** **(a) genericize fully.** **Confidence: medium-high.** A shipped plugin skill bound to a private project (worse: to *two* private projects, plus unbuilt future state) can't serve other consumers — exactly the nesbo "LMP project" defect we flagged externally. The clean skills (cqrs-patterns, authorization-patterns, error-handling, all scaffolders) prove the generic pattern works and reads well. The Pass-2/3/won't-build references are indefensible in any shipped skill regardless of binding (remove under (a) OR (b)). **Cost:** the 3 full-rewrite Domain skills + 2 scoped CPM/framework-currency rewrites are the bulk of Step 4's effort — but their *valuable mechanical content* (escape-hatch rules, three-form grep, two-stage detection) is **preserved verbatim**; only the framing is genericized. *This is the single most consequential ruling — it cascades to §2.C (descriptions), the ADR contradiction (improve-architecture), and 5 skill bodies.*

### §2.F — Empty `{ProjectName}` registry tables (sub-decision of §2.E)
**Current:** add-integration-event ("Existing Integration Events") and create-grpc-contract ("Existing Contracts") ship empty tables keyed `(check src/BuildingBlocks/{ProjectName}.X.Contracts/)`.
**Recommendation:** **replace each with a one-line pointer** ("existing X live in `{ProjectName}.X.Contracts/` — grep there before adding to avoid duplicates"). **Confidence: high.** Registry tables are consuming-project content; an empty table teaches nothing and reads as unfinished. Folds into the reformat for both skills.

---

## 3. Routed out (NOT executed this pass — log only)

Per plan Scope, anything touching a conventions file or a core-nexus skill is listed here, not done:

- **`conventions/csharp.md`** — domain-patterns (#16) cross-references it for the CS9032 `required`+`private set` rule. The reference is *correct and useful*; **no change to the convention file** this pass. If the genericization decision (§2.E) changes how domain-patterns cites it, that is a domain-patterns body edit, not a convention edit. **Routed out.**
- **Core-nexus skills** (`improve-skills`, `evaluate-skill`, `boy-scout`, etc.) — out of scope by definition; none touched.
- **Skill renames** — frozen (binding invocation contract). Research F3 (gerund-form names) is noted as a divergence from Anthropic's *preferred* form but our imperative/noun names are "acceptable alternatives" per the same doc — **no renames.**
- **The 6 Vue skills** — out of scope (separate pass, separate reference-repo decision).
- **ADR numbering as a project concept** — whether the *consuming project* keeps ADR-004…013 is the project's call, not this plugin sweep's. We only decide how the *skills* reference them (§2.E).

---

## 4. Consistency self-check (Step-5 preview)

- No row's disposition contradicts its eval verdict. The 2 "fix-then-accept (rewrite-lite)" evals (CPM, framework-currency) map to **rewrite (scoped)** dispositions — stated, not silent.
- Only the five permitted verdicts used; no out-of-vocabulary verdict invented (Step-5 grep for the forbidden A-d-a-p-t token will confirm zero hits).
- Every `merge`/`retire` = **none** (no assumption made; the one plausible merge explicitly rejected with reason).
- Every normalization decision (§2.A-F) carries a recommendation + confidence and is flagged for owner ruling.

---

## 5. User approval (to be filled at the checkpoint)

**Approved:** ☑  **Date:** 2026-06-12  **By:** owner (user-confirmed at the team-lead checkpoint, AskUserQuestion — all four asks answered with the recommended option; recorded verbatim by the team lead)

**Per-skill overrides (if any):**
_None — all 26 dispositions approved as proposed._

**Normalization rulings (owner decides §2.A-F):**
- §2.A CHANGELOG policy: **(a) drop all 5** to git history
- §2.B workflows/references: **(a) keep `workflows/`**; state the convention explicitly
- §2.C description standard: **(a) standardize** "{what}. Use when {trigger}." (names frozen)
- §2.D invocation flags: **(a) `disable-model-invocation: true`** on the 3 architect-only skills (keep `user-invocable: true`); fix system-design's mis-citation
- §2.E genericization / project-binding: **(a) genericize fully**  ← **the pivotal one**
- §2.F registry tables: **(a) replace empty tables with one-line pointers**

**Only after this block is filled does Step 4 begin.**
