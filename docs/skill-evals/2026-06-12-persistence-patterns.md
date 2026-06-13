# Skill Evaluation — persistence-patterns

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `persistence-patterns/SKILL.md` (202 lines; monolithic; has `CHANGELOG.md`)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.EntityFrameworkCore/Repositories/{IRepository,Repository}.cs` verified.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B.

## Layer 0 — Lint
**FAIL (exit 1).** `XML/angle-bracket token in prose (<T>)`. Exact prose/heading occurrences (outside code fences):
- L77 `### Base: EntityConfiguration<T>` (heading)
- L83 `### Audited: AuditedEntityConfiguration<T>` (heading)
- L86 `Extends EntityConfiguration<T>.`
- L131 `ApplicationDbContext<T>` / L132 `IdentityDbContext<User, Role, int>`
- L184/186 `SeedFromJsonFile<T>` / `SeedFromJson<T>`
- L167 `context.Set<T>().Any()`
This is the one **blocking** finding (Layer 0). Fix in Batch B Step 4: switch prose generics to `{T}`-style placeholders or wrap the tokens in inline code/fences (the lint allows angle brackets inside code blocks). NOTE: several already ARE in backticks (L16-17 `IRepository<TEntity, TKey>`) and pass — the failures are the bare-prose headings (L77, L83) and bare-prose mentions (L86, L131-132). Fix targets those specifically.

## F1: Per-skill CHANGELOG (estate consistency)
**Severity:** Low · **Layer:** 4.2 / F9 — one of the 5 in-scope skills with a changelog. Step-3 estate decision.

## Rubric items checked clean
- L1.1 frontmatter = body (repository 3-tier, entity configs, DbContext, seed, interceptors — all present)
- **L1.6 failure-mode encoding — BEST-IN-ESTATE.** Two measured latent bugs encoded directly in the skill: (a) `SetValues(object)` silently skips private-backing-field properties (`PropertyAccessMode.Field`) — "a latent shallow-copy bug invisible to shape greps"; (b) `ComplexProperty`/owned VOs need explicit member assignment because neither `.Adapt()` nor `SetValues` deep-copies them. These are exactly the failure branches rubric 1.6 wants lifted from runs into the skill.
- L1.4 citation: "see `persistence-patterns` ... do not restate EF config here" cross-references are consistent
- L2.2 mechanical: the `CurrentValues.SetValues(...)` exact-form rule is a concrete do-this, not exhortation
- L2.3 weight: 202 lines, genuine reference, under budget (F7)
- L3 (writes external system): repository owns the write path; UpsertAsync idempotency + the value-copy rule are stated

## Verdict: **fix-then-accept** — ONE blocking lint fix (`<T>` in 6 prose/heading spots) + the estate CHANGELOG decision. Content is the highest-quality failure-mode reference in the estate; the lint fix is mechanical and must not touch the surrounding prose semantics.
