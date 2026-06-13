# Proposal — boundary-detector false-positive on the solo lane writing implementation.md

**Status:** Deferred / backlog (raised 2026-06-13 during `adhoc-SalvageFencedCloser`; owner chose to
backlog rather than fix inline).
**Severity:** Low — logs only; does not block, and `implementation.md` is not in the team-lead
void-and-rerun matrix, so it cannot trigger a spurious void.

## Problem

`plugins/nexus/hooks/scripts/boundary-detector.js` maps `implementation.md` → `developer` in its
`ARTIFACT_OWNERS` ownership check (ADR-18: each artifact has exactly one owner). When the **solo
lane** writes its own `implementation.md` record — which it legitimately does, and which the team
lead explicitly requests — the detector logs an ownership violation to `.claude/audit/violations.log`:

```
{"agent":"solo","tool":"Write","path":".../delivery/implementation.md",
 "rule":"wrote an artifact whose owner is another role (...) — each artifact has exactly one owner (ADR-18)"}
```

This fires on **every** solo run that records an implementation, polluting the violations log with a
benign line the team lead must recognize and dismiss each time.

## The design question (why this is backlogged, not auto-fixed)

ADR-18 says each artifact has exactly one owner. Two coherent resolutions, and picking between them
is an owner call, not a mechanical fix:

1. **Solo is a legitimate `implementation.md` writer.** Add `solo` to the accepted writers for
   `implementation.md` in `ARTIFACT_OWNERS` (the artifact has two valid authoring roles: developer
   in the full pipeline, solo in the lightweight lane). Simplest; widens the ownership rule.
2. **Solo writes a different artifact.** The solo lane records to its own file (e.g. `solo.md` or
   reuses `summary.md`) and leaves `implementation.md` strictly developer-owned. Keeps ADR-18's
   one-owner invariant literally true; requires updating the solo agent's instructions + any
   consumers that read `implementation.md`.

**Recommendation:** option 1 (medium confidence) — the solo lane *is* doing developer-type work and
`implementation.md` is the natural record; the cleaner conceptual model is "implementation.md has two
authoring roles" rather than inventing a parallel artifact. But confirm against the solo agent's
documented artifacts and the implementation-format consumers first.

## Adoption trigger

Fix when next touching `boundary-detector.js` or the solo agent's artifact contract, or if the
false-positive lines ever start masking a real ownership breach in `violations.log`.

## Provenance

Surfaced live during the `adhoc-PipelineGatesHardening` → `adhoc-SalvageFencedCloser` session — the
same run that shipped the Gate B boundary-detector changes (1.8.0). Recorded in
`docs/specs/adhoc-SalvageFencedCloser/delivery/summary.md` (RT-3).
