# analytics-computation-service — Changelog

## [Unreleased]
- Whole-skill reframe: reframed as a specialization of `domain-service` (adhoc-Pass1-SkillRepair)
- Removed "Response records at the top of the file" — domain result records replace API response records
- Removed repository "Exception" clause — replaced with `domain-service` narrow read-port escape hatch
- Relocated placement language from `{App}.API/Features/Analytics/` to `{Module}.Domain/Analytics/`
- Applied no-suffix naming rule (Calculator/Analyzer, not Service)
- Applied ADR-005 (computation in domain), ADR-006 (no DTO input), ADR-010 (endpoint owns response DTO)
- Added "not proven until Passes 2/3 consume it" note

## [1.0.0] — 2026-05-24
- Baseline version — API-layer service pattern (pre-ADR-005)
- Response records at top, service class with repository dependencies, multi/single-period methods
