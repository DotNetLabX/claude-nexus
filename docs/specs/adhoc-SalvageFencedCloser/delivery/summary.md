# Salvage Fenced-Closer Fix — Summary

## Status: COMPLETE

## What Was Built
Fixed `salvage-transcript.js`'s deliverable-selection heuristic (RT-2, surfaced live during the
adhoc-PipelineGatesHardening run). Replaced the length-gate + `slice(-5)` longest-recent window
with content-based closer detection (de-fence the prose, classify a short lifecycle-keyword block
as a closer) + a backward tail-strip that returns the last substantive non-closer. Shipped as
nexus **1.8.1** (PATCH).

## Key Outcomes
- **Files:** `salvage-transcript.js` (fix), `tests/unit/salvage.test.mjs` (RT-2 test rewritten),
  `tests/fixtures/transcripts/stranded-fenced-closer.jsonl` (fixture extended to the full shape),
  delivery `implementation.md` + this summary; release `plugin.json` + `CHANGELOG.md`; omni twin
  synced (`gen-omni --check` green).
- **Validation (end-to-end, not just synthetic):** `salvage-transcript.js ad1b412d45f589114`
  returns the full **21,288-char** review (header → "## Verdict: REVISE" → `Reviewed:` fence,
  whole, not truncated) instead of an 85-char closer. Salvage suite **9/9**; full suite 129/130
  (1 = pre-existing out-of-scope `nexus-dotnet`).
- **Review:** solo lane, one request-changes cycle — the first fix passed its own synthetic tests
  but failed the real transcript (the `slice(-5)` window was too small for 8 trailing closers);
  the second pass fixed it and is validated against the real transcript + a faithful fixture.
- **Commit:** one `fix(adhoc-SalvageFencedCloser)` commit (fix + test + fixture + bump).

## Deviations from Plan
- Ad-hoc solo fix, no formal plan. The implemented closer detection (de-fenced prose + keyword
  match) is more general than the brief's "strip trailing fence-only closers" — it also catches
  pure-prose closers with no fenced trailer. Strictly additive.

## Notes
- **Team-lead diagnosis correction recorded:** the original brief asserted "longest-recent already
  selects the deliverable correctly" — false when trailing closers outnumber the window. Caught by
  end-to-end validation against the real transcript, not by the unit tests. The lesson: a recovery
  heuristic must be tested against a real stranded transcript, not only a synthetic fixture.
- **RT-3 (open, minor, not fixed here):** the boundary detector logged solo's `implementation.md`
  write as an ownership violation — its `ARTIFACT_OWNERS` maps `implementation.md` → `developer`
  only and doesn't know the solo lane legitimately writes it. A false positive in the freshly
  shipped Gate B; logs (does not block). Surfaced for a later decision.
