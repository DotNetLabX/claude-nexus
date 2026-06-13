# Skill Evaluation — redis-patterns

**Evaluator:** developer (adhoc-DotnetSkillSweep Step 2)
**Date:** 2026-06-12
**Scope read:** `redis-patterns/SKILL.md` (172 lines; monolithic; no changelog)
**Run artifacts:** none. Spec judged against `D:\src\dotnet-microservices` — `Blocks.Redis/` verified.
**Channel:** ADR-1 dev-repo carve-out — critic Note A.
**Batch:** B.

## Layer 0 — Lint
**FAIL (exit 1).** `XML/angle-bracket token in prose (<T>)`. Exact prose/heading occurrences (outside code fences):
- L60 `## Repository<T>` (heading — the main offender)
- L77 `IRedisCollection<T>` mention, L78
- L99 `GetByIdOrThrowAsync<T>(collection, id)` / L100-102 `GenerateNewId<TEntity>`, `SetSequenceSeed<TEntity>`, `SeedFromJson<TEntity>`
- L119 `Use Repository<T> for single-entity writes.`
Blocking Layer-0 finding. Fix in Batch B Step 4: `{T}`-style or inline-code/fence the tokens. The `## Repository<T>` heading (L60) is the headline fix.

## Rubric items checked clean
- L1.1 frontmatter = body (entity model, repository, index creation, seeding, DI — all present)
- **L1.6 failure-mode encoding — STRONG.** "Redis.OM does not properly update nested child collections — `UpdateAsync` silently fails to persist changes to child lists" with the explicit workaround. A real measured Redis.OM trap encoded in the skill (peer to persistence-patterns' SetValues bug).
- **L1.2 guardrail / scope:** "When to Use Redis as Primary DB" with explicit Use-for / Do-NOT-use-for lists, and "Does NOT inherit from AggregateRoot — Redis entities are simpler" — clear boundary statements (though not a formal adjacent-skill fence — see note).
- L2.4 followable cold: the `[Indexed]`/`[Searchable]`/`[Document]` attribute guide is concrete and grounded in Redis.OM
- L2.3 weight: 172 lines, genuine reference, under budget
- L3 (writes external system): Redis repository write path single-owned; seeding idempotency via `collection.Any()` stated

## Minor note (not a finding)
No formal `## What this skill does NOT do` adjacency fence (vs persistence-patterns for the EF case). The "When to Use Redis" section partly covers it. Optional add under estate normalization.

## Verdict: **fix-then-accept** — ONE blocking lint fix (`<T>`, headline at L60 heading). Content is strong (Redis.OM child-collection trap is a valuable encoded failure mode). Mechanical lint fix only; preserve prose meaning.
