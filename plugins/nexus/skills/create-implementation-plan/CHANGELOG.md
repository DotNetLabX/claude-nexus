# create-implementation-plan — Changelog

## [Unreleased]
- Added Required Reading, Anti-patterns, and Downstream Consumers sections (adhoc-PipelineCraftImprovements)
- Added "Plan Grounding & Deviation Rules" section: binding-vs-developer-free surface declaration (adhoc-Pass2-SliceHygiene, adhoc-Pass3c-C-DevEpicAnalytics, adhoc-Pass4-IdentityExtraction) and hedge-is-a-deferred-read / counts-from-grep / trace-contract-fields-to-source-DTO rules (adhoc-Pass4-IdentityExtraction, adhoc-Pass3c-C-DevEpicAnalytics, adhoc-Pass5-EventCorrectness)
- Extended enumerate-all-consumers rule with method-hiding sweep: grep `new`-hidden redeclarations + confirm call-site static types before verifying a shared-base-method change (adhoc-Pass5-EventCorrectness)

## [1.0.0] — 2026-05-24
- Baseline version (reconstructed from git history — last known modification: 41356a8 [Claude-Code] small improvements)
- Skill Mapping table with Follow/Build/None dispositions
- Over-specification test and content budget rules
- Anti-pattern check pass in plan generation steps
- References plan-template.md for output format
