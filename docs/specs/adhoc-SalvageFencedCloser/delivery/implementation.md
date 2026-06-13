# adhoc-SalvageFencedCloser — Implementation

## Files Modified

- `plugins/nexus/hooks/scripts/salvage-transcript.js` — replaced the `looksLikeDeliverable`
  length-gate + `slice(-5)` longest-recent fallback with a content-based closer-detection +
  tail-strip algorithm. The old approach failed on the real RT-2 transcript because (a) the
  `slice(-5)` window did not reach the deliverable (8 closers trailing), and (b) one closer
  exceeded 400 total chars. The new algorithm: strip trailing fenced blocks to get non-fenced
  prose, classify as a lifecycle closer if prose < 400 chars AND matches a lifecycle-keyword
  pattern, then walk backwards from the tail stripping closers until the first non-closer is
  reached — that is the deliverable. `--final` mode, the stub-skip, and the fail-safe
  (all-stubs) path are unchanged.

- `tests/fixtures/transcripts/stranded-fenced-closer.jsonl` — extended from the 2-closer
  version to the full RT-2 shape: a longer analysis block (1362 chars, starts "Harness
  analysis:") before the deliverable (1006 chars, starts "# Pipeline Gates Hardening — Critic
  Review"), then 8 trailing closers including one with total chars ≥ 400 (443 chars, prose 279
  chars) and 7 others of decreasing length, all multi-line/fenced. Proves that neither
  "pick the longest" nor "pick the last non-stub" is sufficient.

- `tests/unit/salvage.test.mjs` — updated the RT-2 test to assert the full shape: deliverable
  header present, analysis block NOT present, no fenced closer returned. Updated `--final` test
  description to clarify it returns the last substantive even when that is a lifecycle closer.

## Files Created

- `docs/specs/adhoc-SalvageFencedCloser/delivery/implementation.md` — this file.

## Key Decisions

- **Content detection over length threshold.** The previous approach (length ≥ 400 as the
  deliverable gate) was brittle — a verbose closer whose fenced block pushes it over 400 total
  chars passes the gate and wins. Content detection (`CLOSER_RE` against de-fenced prose) is
  stable against length variation.

- **Tail-strip over windowed-longest.** `slice(-5)` is too small when many closers pile up
  (8 in the real RT-2 case). A backwards walk until the first non-closer is O(n) in closers
  stripped, handles any number, and correctly identifies the "last substantive non-closer" rather
  than the "longest recent."

- **`stripFences` regex targets only trailing fenced blocks.** The regex
  `/(\n\s*```[\s\S]*?```\s*)+$/` strips one or more consecutive ` ``` ... ``` ` blocks anchored
  at the end of the text. It does not disturb fenced blocks embedded in the middle of the prose
  (which appear in real deliverables), so code examples inside reviews are preserved.

- **Lifecycle keyword set calibrated from real data.** The `CLOSER_RE` pattern was derived from
  the 8 real closers in the RT-2 transcript (complete, done, no further action, delivered above,
  nothing to add, my work is, etc.). The set is deliberately inclusive so fenced-closer variants
  the model generates are caught; false-positive risk against real deliverables is low because
  deliverables are not prose-about-completion — they contain findings, verdicts, and code refs.

- **`--final` bypasses closer-stripping entirely.** The `--final` escape hatch is the
  pre-1.5.0 behavior: always return the last substantive text, whatever its shape. This is
  correct for users who know the transcript and want explicit override.

- **Fall-back to last closer when all substantives are closers.** `while (tail > 0 && isCloser)`
  stops at index 0 even if index 0 is also a closer — returns it as best-effort (better than
  nothing). This preserves the original fail-safe contract.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| Solo fix | None | ad-hoc 1-file script fix; solo agent without plan steps |

## Carry-Over Findings

None.

## Deviations from Plan

This is an ad-hoc Solo fix without a formal plan. The brief specified a direction; the
implementation followed it exactly except for one refinement: the brief described
"strip trailing fence-only closers" as an alternative, but the implemented approach
(de-fenced prose + keyword match) is more general — it also catches closers that have
no fenced trailer (pure prose like "Complete. Nothing further."). This is strictly
additive and does not contradict the brief.

*Status: COMPLETE — solo agent, 2026-06-13*
