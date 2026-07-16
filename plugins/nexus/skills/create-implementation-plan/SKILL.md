---
name: create-implementation-plan
description: Creates implementation plans with mandatory skill mapping per step. Ensures plan steps reference skills instead of restating patterns. Extends the agents-workflow.md plan format.
user-invocable: true
---

# Create Implementation Plan (Architect Reference)

This skill is for the **architect agent**. It produces `docs/specs/{slug}/delivery/plan.md` — the implementation plan that the developer executes. Each step either references a skill or explicitly justifies inline detail. No freeform plans.

## Purpose

Generate `docs/specs/{slug}/delivery/plan.md` with a structural guarantee that each step either references a skill or explicitly justifies inline detail. Extends the plan format in `agents-workflow.md` with mandatory skill mapping.

## When to use

After a feature spec exists (`docs/specs/{slug}/definition/spec.md` with `Status: Ready`). Replaces freeform plan writing.

## Reading protocol

Before writing, ensure you have:

1. **Feature spec** — read `docs/specs/{slug}/definition/spec.md` (or `epic.md` / `bug.md` depending on slug type)
2. **Architecture doc** — read for system shape and existing decisions
3. **Skill inventory** — if the architecture doc has a Skill Inventory section, use it; otherwise build one from **the skills surfaced in your context** (plugin skills live in the version-keyed cache — globbing `.claude/skills/` under-reports them) plus the project's own `.claude/skills/`.
4. **Existing plans** — read `docs/specs/*/delivery/plan.md` for format consistency

## Steps

1. **Pre-fill from conversation context.** The architect has typically been discussing the feature before invoking this skill. Pull every answer you can from the existing conversation. Do not re-ask what the user already said.

2. **Run the reading protocol.** Read existing feature specs, architecture doc, skill inventory, and existing plans.

3. **Draft the implementation steps.** Each step is one focused task with full file paths.

4. **Build the Skill Mapping** — for each step, determine the disposition:
   - **Follow** — a skill covers this pattern. Provide only feature-specific inputs (entity names, file paths, property types). Do NOT restate how the pattern works.
   - **Build** — a skill covers this pattern but references infrastructure that doesn't exist locally (BuildingBlocks, base classes). The step must include building the missing infrastructure first, then following the skill.
   - **None** — no skill covers this step. Describe what to accomplish + acceptance criteria. Since the developer has no skill to invoke, also include key domain constraints (type names, case sensitivity, important values) and pattern references (point to existing code). Do NOT write method-body logic flows (sequential pseudo-code under a single method). The developer decides internal decomposition. Route the gap to `lessons.md` `## Skill Gaps` per `lessons-format` — the plan's `Gap?` column stays a plan-local marker, not the record.

   **Skill verification before setting None:** For each step, list the actions it performs (throws exceptions, registers services, queries data, creates endpoints, configures persistence). Match each action against skill frontmatter descriptions. Only set None after confirming no frontmatter description matches. If a frontmatter is ambiguous, read the skill's When to Use section before deciding.

   **TDD marking (every step, every plan):** alongside the disposition, set the step's `TDD` column — `yes` for testable behavior (domain logic, endpoint request/response, business rules), `no` for pure wiring (DI, config, migrations). This is a *process-skill* mapping, independent of the pattern-skill disposition: a `Skill: None` step can still be `TDD: yes`, and the developer invokes the `tdd` skill on every `yes` step.

5. **Anti-pattern check.** Scan the draft for:
   - The word "adapted" or "adapt" near a skill reference — violation. Either Follow or Build, never Adapt.
   - A skill dismissed as "too simple" or "not needed for this case" — violation. Skills ensure consistency; complexity is not the criterion.
   - Implementation pattern details restated when a skill exists — over-specification. Delete and reference the skill.
   - A mapped skill whose step text lacks the disposition keyword — violation. Write `Follow {name}` / `Build {x} then follow {name}`, never a bare skill name with a parenthetical scope. The keyword is the developer's binding invocation trigger (measured failure: a plan dropped it and 9 mapped steps shipped with zero invocations).
   - In-repo code references on a Follow step that point at the *structural pattern* the skill teaches — violation. Developers measurably imitate cited code and skip the skill. On Follow steps, cite code only for feature-specific surfaces (a route to mirror, a type to extend).
   
   **Over-specification test for Follow steps:** Read the skill's SKILL.md. For each detail in the plan step, ask: "Does the skill already cover this?" If yes, delete it from the plan step. What remains should be ONLY feature-specific inputs the skill can't know:
   - Entity/type names and their properties ✓
   - Business rules and computation logic ✓
   - File paths ✓
   - Route paths, API shapes ✓
   - References to existing code for feature-specific patterns ✓
   
   Delete from Follow steps — the skill already covers these:
   - File placement rules ✗
   - DI registration instructions ✗
   - Constructor injection patterns ✗
   - Record/class structural syntax ✗
   - Boilerplate that the skill's template generates ✗
   
   **Content budget:** A Follow step should be ~5-15 lines of feature-specific inputs + a skill reference. If a Follow step exceeds 30 lines, it likely over-specifies. The developer invokes the skill via the Skill tool to get structural patterns — duplicating them in the plan causes the developer to skip skill invocation entirely.

6. **Write the plan** following `references/plan-template.md`. Output: `docs/specs/{slug}/delivery/plan.md`.

   **`Satisfies:` traceability (optional-but-recommended, per step).** Each plan step *may* carry a
   one-line `Satisfies:` annotation citing the acceptance criterion it delivers (`Satisfies: AC-3`), or
   — for an ad-hoc pass with no spec ACs — the **ADR unit** it satisfies (`Satisfies: ADR-26
   RESEARCH-stage`), or — when the slug ran the spec arm — a **`{ruleName}`** referent that resolves to a
   row in `docs/specs/{slug}/definition/spec-rules.md` (`Satisfies: BR-CreditLimit-Boundary`). This is the
   lightweight SDD requirement→task link (the research's chosen weight, a one-line annotation, not a full
   requirement-ID chain), and it is the defense against intent drift (code that runs but does the wrong
   thing). Rule-bearing steps **should** carry the `{ruleName}` referent when `spec-rules.md` exists for
   the slug — strengthening the trace-join's plan-ref anchor. It is **additive and optional** — a step may
   omit it, and existing plans predate it; **never** write it as a blanket "every step must carry
   `Satisfies:`" mandate. Where a step carries it, the architect done-check confirms the cited
   AC/ADR-unit/`ruleName` is real and the reviewer verifies the code traces to it (both "where present",
   not a new hard gate).

7. **Apply the auto-approve gate** from `agents-workflow.md` (always auto-approve; if >10 steps, consider splitting into sub-plans where each has >= 2 steps). Message team lead, never developer directly.

## Arguments

Pass the feature name: `create-implementation-plan Sprint`

## Required Reading

Before invoking this skill, ensure you have read:
- `docs/specs/{slug}/definition/spec.md` — feature requirements to plan against
- `docs/architecture/index.md` — system shape and existing decisions (read it if present — nothing is auto-loaded)
- The skill inventory (context-surfaced plugin skills + project `.claude/skills/`) — needed for the Skill Mapping table
- `docs/specs/*/delivery/plan.md` (1-2 recent examples) — format consistency

## Anti-patterns

- **Writing method-body plans.** Describing sequential logic steps (1. do X, 2. do Y, 3. do Z) instead of operation + acceptance criteria. This over-specifies and leads the developer to skip skill invocation. Describe *what* to accomplish, not *how* to implement it internally.
- **Omitting skill mapping for steps that have a matching skill.** Setting disposition to None without running the skill verification test ("list all actions → match each against skill frontmatter"). A step that creates an endpoint, adds a domain event handler, or configures persistence almost always has a matching skill.
- **Restating pattern details alongside a Follow skill reference.** If the skill already covers file placement, DI wiring, or record structure — delete it from the plan step. Keep only feature-specific inputs the skill can't know. Over-specification causes the developer to skip the skill entirely.
- **Dropping the disposition keyword from a mapped step.** A bare skill name (`persistence-patterns` (seed-data section)) instead of `Follow persistence-patterns` removes the developer's binding invocation trigger — the measured result was 9 mapped steps implemented with zero skill invocations. Every mapped step's text carries `Follow` or `Build … then follow`.
- **Structural-pattern code references on Follow steps.** When a Follow step also cites in-repo code implementing the same pattern, the developer imitates the cited code and never opens the skill (measured across 11 plans: skills were consumed only on steps with no in-repo precedent). Cite code on Follow steps only for feature-specific surfaces — the structural pattern is the skill's job.
- **Bloated plans are a read-cost multiplier.** A plan is read by 4+ agents across the run, and every KB is paid in each of their contexts (a measured 72KB plan was read ×55 ≈ 3.9MB through contexts). Keep the whole file lean — acceptance criteria over restated detail; target well under ~40KB, and past that prefer splitting into sub-plans over letting one file bloat.

## Plan Grounding & Deviation Rules

These apply to every plan, feature or refactor.

- **Declare which surfaces are binding and which are the developer's call.** Public/wire identifiers (routes, serialized property names, contract type names) are binding; internal names are free unless the plan says otherwise. Name the known convention forks (e.g. an alternate migration startup project) as sanctioned variants, and when a plan point is genuinely developer judgment, say so explicitly. This converts a would-be "deviation" into a pre-sanctioned decision the done-check resolves in one line instead of escalating.

- **A hedge in a plan is a deferred read.** Every "may", "if needed", "either…or" that is resolvable from on-disk state (a model snapshot, a DI registration, an installed-package list) must be resolved while writing the plan — reserve hedges for genuine runtime unknowns. Any count the plan cites ("N early returns", "8 call sites") comes from a grep run at plan time, never from memory of a read. And when a step carries a field across a module or contract boundary, trace the field back to its *actual source type* on disk before making it a key or a required member — the source DTO may not have it.

- **Every pinned acceptance command is executed at plan time — grep, test runner, or generator — and its expected result written from the actual run, never asserted from memory.** Write each grep-gate's expected-hits whitelist from the executed grep's real output; when a step carries multiple whitelist bullets over overlapping greps, a carve-out granted in one is repeated in every sibling. A first-of-kind consumer of shared machinery (a generator, a hard-coded registry, a lint suite) executes that machinery against a fixture at plan time — a usage line in a doc is not a capability claim. Harden the patterns for the environment: separator/escape hardening (e.g. `[\\/]`) goes on *both* gates of a positive/negative pair, prose-file greps are phrased structure-independent (content anchors, never line counts — markdown re-wraps silently), and any line count comes from `wc -l` / `(Get-Content $f).Count`, never `Measure-Object -Line` (it skips blank lines).

- **Shipped text is self-contained.** A step that edits a shipped skill or agent file must never resolve a load-bearing definition through a dev-repo-only document (a delivery artifact, an internal doc) — inline the definition in exactly one shipped file and point the other shipped surfaces at it.

- **Pre-author the operator-owed fallback for any step needing a live connection or credential.** If a step's primary path needs a resource that may be unavailable at build time (a prod read account, a rotation-gated credential), the plan names the fallback up front: a provisional value, a committed operator helper script, and the `OPERATOR ACTION REQUIRED` documentation owed in implementation.md. A pre-authored fallback that fires resolves as `Deviated (valid reason)` in one line at done-check; an un-authored one becomes an escalation.

- **A step needing a tool the implementing agent's surface lacks is operator-owed *by construction* — mark it `Owner: operator` up front.** A developer (or any) subagent has no `Workflow` / `agent` / `parallel` primitives, so a "validate by launching the workflow" or "run the live harness" step cannot execute in-pipeline however the developer tries — naming it operator-owed in the plan turns a mid-build dead-end into a one-line `Deviated (valid reason)` at done-check instead of an escalation. The companion rule for any **build-only increment** whose value only lands at the operator's run: its acceptance line states **what a PASS does *not* yet prove** ("syntax + offline sandbox green; the live launch is the operator's arm"), so the gap is structural, not a done-check afterthought. Note that `node --check` proves JS syntax *only* — it cannot catch a Workflow-tool runtime constraint (meta-first statement, pure-literal `description`, no static imports, no `Date`/`Math.random`), so a "runnable" claim on a Workflow script needs a real launch, never just `node --check`.

- **Pair every prompt-only LLM obligation with an enforcement.** When a step grounds an LLM's output via prompt text ("only use X", "must filter Y", "never reference Z"), the same step (or a named sibling) carries a post-generation fail-closed validator OR an explicitly documented backstop (retry loop, execution-time guard). A prompt instruction is a request, not an enforcement — and a conformance review cannot catch a missing enforcement the plan never required.

- **On any revision pass, re-ground every step whose execution surface or reference data changed** — re-verify its factual claims and cited acceptance against code even when its governing answer is "unchanged." A surface flip silently invalidates claims in steps nobody re-opened ("unchanged answer" ≠ "unchanged correctness"); a revision's failures cluster in exactly the steps not re-grounded.

- **Write each acceptance line as the *mechanism* that proves it, not the surface outcome.** A done-check should be grep-and-confirm, not read-and-judge — so per load-bearing claim, name the test file + assertion shape (or the exact grep target). Two traps recur: **(i)** where local auth is a *stub that authenticates everyone*, assert the **structural** gate (the policy attribute is present **and** a Prod boot throws without it), never a local `401` — the stub returns `200`, so the surface assertion is unprovable locally; **(ii)** a "no literal `X` in the runtime output" gate must be phrased as the **output/test** assertion, not a **source** grep — a source grep matches the substitution table's own definition of `X` and self-flags. Mechanism-aware acceptance is what makes a done-check deterministic instead of judgmental.

## Refactoring & Type-Move Plan Rules

Refactoring passes (rename, extract, relocate, delete, type-move) fail in ways feature plans don't. Encode these in the plan, not in the developer's memory. (Stack-specific carve-out examples belong in the stack extension plugin's skills, not here — these are the stack-agnostic principles.)

- **A create→extend scope correction carries a disposition table in the plan.** When a plan's scope flips from "create X" to "extend an existing X" (a test suite, script, skill estate, doc set), the de-duplication boundary — which source-catalog/brief items already exist, which are net-new, which are deferred and why — is a **plan artifact**, not the architect's working memory. Add a table mapping every source item to `covered (where)` / `new (step)` / `deferred (why)`; it pre-resolves Phase-1 questions and stops the developer re-creating something that already exists.

- **A "fix/split/replace every file matching pattern P" step must derive its file list from the *exact* grep used in its acceptance criterion** — the step's enumerated files and the acceptance grep must be the same query, never hand-curated separately or assembled from memory of files you happened to read. Use a **definition-line** grep (matches where the symbol is *declared*), not a usage grep — a usage grep also matches references and undercounts or overcounts. Hand-curated lists drift from the check and miss files.

- **Enumerate ALL consumers from a grep before planning a removal — not just the obvious one.** When a step removes or renames a public symbol, grep the name across the **whole** project (every registration site, secondary entry points, generated bindings, global imports) and list every site in the plan step. The indirect consumer nobody remembered is the one that breaks the build mid-implementation. Method hiding is part of this sweep: when the change targets a shared base-class method, also grep for `new`-hidden redeclarations (`public new {Method}`) and overrides across all derived types, and confirm the call sites' *static* types — a `new`-hidden base method can have **zero** reachable callers, and any verification step written against it tests a path the change cannot reach.

- **"grep before delete" is a hard, numbered verification sub-step — not a soft note in prose.** A buried "remember to grep" sentence gets skipped. Make it `Step N: grep for remaining references to {symbols}; zero hits required` so the done-check can mark it Missing. Better still: move shared types in an **earlier** step with all consumers updated — phased plans split by feature cluster rarely align with the type-ownership graph.

- **"Replace all X" is dangerous when X has a non-call homonym — spell out the carve-out with file:line + DO-NOT-TOUCH.** Distinguish "this is a *call/usage* of the thing being replaced" from "this is a literal, constant, or unrelated symbol that happens to match the same text." Name every known non-match with its `file:line` and a DO-NOT-TOUCH directive; never rely on a blanket replace-all.

- **Type-move / rename passes need an explicit old→new rename table + the wire-stability invariants stated as binding rules.** Give a byte-checkable `OldName → NewName` table so the done-check is a deterministic field-by-field read instead of a judgment call. State what must NOT change as a rule with a diff-based accept: anything that keys a serialized/wire contract (field order, serialized property names, route strings) survives a code-level rename only if the wire-visible parts are untouched — and when a rename DOES change a serialized name, every hand-written consumer of that contract must change in the same plan. Wire-only envelope types stay at the boundary — never mirror them into the domain or list them in the domain rename table.

- **Before planning a dependency removal, grep the *dependent* modules' global imports and all property/field/return-type signatures — not just the declared dependency list.** A transitive import or a type used only in a signature breaks the removal even when no direct call exists.

## Downstream Consumers

| Agent | What they use | Impact if incomplete |
|-------|--------------|---------------------|
| Developer | All steps (implements against them) | Gaps in plan steps cause skipped implementation or wrong approach |
| Architect | Skill Mapping, plan structure (Step 1 done check) | Done check can't verify conformance without clear acceptance criteria |
| Reviewer | Step descriptions (Step 2 conformance check) | Reviewer can't verify plan was followed without clear per-step requirements |

## What this skill does NOT do

- Write code. Implementation is the developer's job.
- Make architectural decisions — those come from the architecture doc.
- Override the `agents-workflow.md` coordination protocol — it extends the plan format, doesn't replace the pipeline.
- Replace the architect's judgment about step ordering, scope, or complexity classification.
