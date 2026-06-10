# create-aggregate — Changelog

## [Unreleased]
- Initial changelog creation (adhoc-PipelineCraftImprovements)
- Added "Promote an Existing Entity to an Aggregate Root (in place)" section — type-change-in-place workflow, schema-consequence check via model snapshot, mirror-existing-aggregate guidance, plain-DDD vs ASP.NET-Identity variant note (adhoc-Pass4-IdentityExtraction, adhoc-Pass5-EventCorrectness)

## [1.0.0] — 2026-05-24
- Baseline version (reconstructed from git history — last known modification: 27e1934 [Claude-Code] Skills cleanup)
- Variant-aware: EF Core persistence vs Redis persistence
- Workflow files: AggregateEfCore.md, AggregateRedis.md, DomainEvent.md, ValueObject.md
- Partial class split pattern for aggregate state vs behavior
- Domain event raise-and-publish pattern via SaveChanges interceptor
