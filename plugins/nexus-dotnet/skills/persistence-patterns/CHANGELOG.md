# persistence-patterns — Changelog

## [Unreleased]
- Added `UpsertAsync` value-copy rule: copy through EF `PropertyValues`, never `SetValues(object)` — the object overload silently skips `PropertyAccessMode.Field` backing-field properties; cross-referenced with the existing owned/complex-type deep-copy caveat (adhoc-Pass5-EventCorrectness)

## [1.0.0] — 2026-05-24
- Baseline version — repository 3-tier pattern, entity configurations, DbContext setup, seed data, interceptors, Mapster write-path caveats (IgnoreNonMapped whitelist semantics, adapt-onto-existing no-op erratum, ComplexProperty explicit-assignment exception)
