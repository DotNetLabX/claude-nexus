# Spec — Section-Addressable Reads & Read-Discipline Extension

**Slug:** adhoc-SectionAddressableReads
**Status:** Ready (critic-reviewed 2026-06-20 — 3 Major findings applied)
**Author:** main session (token-optimization track)
**Date:** 2026-06-20
**Evidence base:** `docs/kb/research/plugin-token-optimization.md` (live audit, 2026-06-20)
**Plan:** `docs/specs/adhoc-SectionAddressableReads/delivery/plan.md`

## Problem

A 3-day live audit across the two nexus-heavy projects (KG, SR; ~4,100 telemetry rows,
~60 sessions) found prompt caching is **healthy** (KG 92.2%, SR 98.1% read/create) — the
~21–42K always-on rules block is cached, not the spend. The spend is agents **reading whole
artifacts and docs when they need a section**, ballooning contexts to 150–250K.

`nexus:critic` is the clearest case at **59% cache efficiency** — it spawns fresh, reads
spec + plan + product docs **whole**, reasons for a few turns, and finishes, so most of its
tokens are first-time cache *writes* that never amortise. Every whole-read costs twice:
a fat first-write to cache, **and** a heavier context carried on every subsequent turn
(which also accelerates compaction → re-reads).

This is not a compression problem and not a "harness too big" problem. It is a
**read-targeting** problem.

## Goal

Cut per-agent read volume by making large artifacts/docs section-addressable and extending
the existing **Read Discipline** rule from *"don't re-read"* to *"read only the section you
need."* Originals stay intact — this is targeted reading, never compression.

## Non-goals (this slice)

- **Source-file AST / code-map structural reads** (the unverified ~80% idea) — deferred to a follow-up slice.
- **#1 cache-stable injection** — dropped; the audit proved the prefix already caches optimally.
- **#3 distilled-return contract** (team-mode subagent returns) — separate slice. *Why deferred:*
  different axis (return-size vs read-size), team-mode only, estimated-not-measured; sequenced behind
  #2's audit-proven win. Revisit after #2 ships + the operator post-measure.
- **Any lossy compression / truncation of artifacts** — explicitly out; the file on disk is never shrunk.

## Scope

1. **Targeted-read pattern (canonical): locate-then-read.** Grep the file's `^#{1,6} ` headings
   to get a live section map + line numbers, then `Read` with `offset/limit` around the wanted
   section. Two cheap calls replace one fat whole-file read.
2. **Read-Discipline rule extension** (`plugins/nexus/rules/agents-workflow.md`, "Read Discipline"):
   add *"read the section you need, not the whole file"* for **large** inputs (e.g. > ~400 lines
   or a known multi-section artifact). Whole-read stays allowed for small files and for the
   author's own first pass.
3. **Fixed-heading format skills document a stable heading set.** The **fixed-heading** artifact
   format skills (`review-format`, `implementation-format`, `summary-format`, and the plan) already
   fix section order; make each state its heading set explicitly so agents can target by heading.
   **Target by heading, not by stored line ranges** — ranges drift on edit and would mislead;
   grepped headings are always current. **Variable-heading logs are excluded:** `questions.md`
   (runtime-numbered `## Q3`…) and `communication-log.md` (one growing `## Messages` catch-all)
   have no finite heading set to document — they rely on the grep step alone, and in practice sit
   under the size trigger anyway (comm-logs here run ≤ ~83 lines).
4. **Heavy-loader guidance.** Direct the critic (and reviewer/architect when they load big docs)
   to read only the sections their job needs — enforce the existing `kb-navigation` discipline
   ("index first, then entry") and extend it to spec/plan (read the sections under review, not the
   whole doc when it is large).
5. **Minimal measurement harness (in-slice).** A pinned replay: run the critic over a fixed
   spec+plan pair before and after, and diff **absolute `cache_creation` per run** (reuse the
   existing `cache-sweep` parsing). Not a benchmarking framework — just enough to make AC4
   falsifiable on a noise-free input.

## Design notes

- **Heading-targeted, not a persisted TOC index.** Edits shift line numbers, so a stored
  range table goes stale and misleads. Grepping `^#` headings is always current; the format
  skills guarantee which headings exist, so an agent knows what to ask for.
- **Non-lossy and coordination-safe.** The original artifact is untouched and whole-read stays
  available; no risk to multi-agent handoff fidelity (the headroom failure mode we explicitly avoid).
- **Locate-then-read fallbacks (each resolves to a wider/whole read).** (a) **No `^#` match**
  (a non-markdown log) → whole-read. (b) **Ambiguous/duplicate heading** (two identical headings, or
  a repeated `### Improvement Proposal`) → widen to whole-read rather than guess. (c) **Oversized
  single section** (one heading spanning hundreds of lines) → heading-targeting's floor is one
  section; `offset/limit` within it is the manual escape.
- **Enforcement is advisory, and the hook piece is net-new (not a tweak).** The rule + skill prose
  is the substance. The optional Phase-2 hook is a **new size-threshold nudge**: on a *first* read of
  a path over N lines, length-check it and nudge ("consider a targeted read") — never block. This is
  a new trigger and code path (`read-tracker.js` today fires only on a *repeat* read, not on size),
  so the plan must size it accordingly; it can also be dropped entirely without affecting the
  rule/skill win.

## Acceptance criteria

- **AC1** — The Read-Discipline rule states the locate-then-read pattern and when it applies (large / multi-section inputs).
- **AC2** — Each **fixed-heading** artifact format skill (`review-format`, `implementation-format`, `summary-format`, plan) documents its stable heading set as the section map agents target. Variable-heading logs (`questions`, `communication-log`) are explicitly excluded — they rely on the grep step alone.
- **AC3** — Critic (and reviewer/architect) instructions direct section-targeted reads of large inputs and reference `kb-navigation`.
- **AC4** — On a **fixed-input replay** (the critic re-run over a pinned spec+plan pair), **absolute `cache_creation` per run drops** vs the whole-read baseline. The efficiency *ratio* is **not** the criterion — the audit shows it flags amortisation, not waste — and the pinned input removes the workload noise that confounds an in-the-wild comparison.
- **AC5** — No artifact is compressed or truncated on disk; whole-read remains available as a fallback.

## Risks

- **Wrong range fetched** → mitigated by heading-anchored locate + whole-read fallback.
- **Over-application** → an agent that genuinely needs the whole artifact (e.g. a final full review) must not be forced to chunk; the rule scopes to "large *and* a section suffices."
- **Measurement noise** → efficiency varies by workload; compare like runs (critic on similar artifacts) when validating AC4.

## Rollout & measurement

- **Baseline:** capture absolute `cache_creation` for the critic on a pinned spec+plan pair (current whole-read behaviour), alongside the 2026-06-20 audit context (59% efficiency, contexts 150–250K).
- **After:** re-run the same pinned replay; success = absolute `cache_creation` per critic run drops, with no loss of review quality. The `cache-sweep` over a fresh KG/SR window is the secondary, in-the-wild check (directional only — workload-confounded, per the audit).

## Implementation note (for the plan)

Implementation touches `plugins/nexus/rules/**` and `plugins/nexus/skills/**` (shipped files),
so it requires a **release-plugin** version bump in the same commit (ADR-9). Spec authoring here
touches only `docs/**` and needs no bump.
