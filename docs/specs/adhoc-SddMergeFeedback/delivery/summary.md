# Summary — adhoc-SddMergeFeedback

**Status:** Complete · **Team mode:** Standard+Codex · **Branch:** main · **Version:** nexus 1.25.1 → **1.25.2** (PATCH)

## What shipped

Applied the sprint-rituals **nexus 1.21.0 merge-machinery feedback** (items 1–4) to the SDD merge harness,
plus the `mine-verify-cover` skill doc-honesty edit, and a PATCH release bump. Every `harness/lib/*.mjs`
edit was mirrored verbatim into its inlined copy in `harness/merge.workflow.js`; `scripts/selfcheck.mjs`
stayed green throughout (7 lib/workflow byte-compare pairs).

| Step | Change | Item |
|------|--------|------|
| 1 (HIGH) | `updateRegistry` keys new/retire entries by `ruleName ?? id` — code-only-precision rows (`BR-n`, no `ruleName`) no longer silently dropped | 1 |
| 2 | Crosswalk value may be `string` OR `{canonical, expect?, staleSpec?}`; new exported `crosswalkExpectations`; registered in selfcheck PAIRS | 2a |
| 3 | Operator-declared `expect` authoritative; `boundaryDiverges` demoted to a no-declaration hint; `staleSpec`-OR-date stale tag; honest header/comment | 2b + 3 |
| 4 (LOW) | `clusterKey` layer-only fallback when `symbol` absent; dropped `?? canonicalName` pseudo-symbol | 4 |
| 5 | `mine-verify-cover` Merge paragraph rewritten — no "content-keyed/granularity-tolerant" claim; operator-declared mechanism; no harness filenames | 2 (doc) |
| 6 | PATCH bump 1.25.2; CHANGELOG cites the feedback file; omni twin regenerated | — |

**Fix Cycle 1 (post-review, 3 LOW folded):** stale "granularity-tolerant" comment removed from
`tests/unit/merge-rules.test.mjs` header; SKILL.md "per matched pair" → per-canonical wording;
`crosswalkExpectations` empty-decl guard (a metadata-less alias can no longer clear a sibling's real
declaration — Codex finding 2).

## Pipeline

- **Entry:** Developer (plan pre-approved by a standalone code-grounded critic run: NO-GO → folded 2 HIGH / 2 MED / 4 LOW).
- **Done-check (architect):** PASS — 6/6 steps Implemented, source-verified, HIGH-1 (`crosswalkExpectations` in PAIRS) closed.
- **Step-2 review:** reviewer **APPROVED** (0 CRIT/HIGH; 1 LOW) + Codex **NO-GO** (1 blocker, 1 major, 1 minor).
  Reconciled finding-by-finding vs live source — Codex's NO-GO did **not** survive:
  - Finding 1 (registry duplicate coalescing): **pre-existing, out of items 1–4 scope** → follow-up candidate.
  - Finding 2 (crosswalk per-canonical overwrite + skill wording): **partly real → folded as 3 LOW fixes**.
  - Finding 3 (local `ruleKey` not byte-mirrored): **adjudicated MED-1 plan decision** → won't-fix.
- **Re-review (cycle 1/3):** reviewer **APPROVED** — all fixes correct, no regressions.

## Verification

- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **505 pass / 0 fail** (15 new regression cases: 13 impl + 2 fix-cycle).
- `node scripts/selfcheck.mjs` → **5/5** (inline-copy sync, gen-omni --check, bump-plugin --check, gen-commands drift, tests).
- Per-skill + full-estate skill-lint on `mine-verify-cover` → clean (25/25).
- `claude plugin validate --strict` → passed.
- Backward-compat spine: all-string crosswalk / no declaration ⇒ five triage buckets byte-identical. Items 1 & 4 intentionally change registry/distillate (the fix).

## Follow-ups (recorded, not shipped here)

1. **Registry duplicate-canonicalName coalescing** (Codex finding 1) — `updateRegistry` emits one row per triage entry with no coalescing; two entries sharing a reconciled `ruleName` (pre-existing many-to-one) produce order-dependent carried/supersede. Pre-existing, outside items 1–4. Candidate for a plugin-feedback entry against the SDD harness.
2. **Reader over-extraction / write-agent `</content>`** (feedback addendum) — agent-prompt issues, not these libs; out of scope per plan.
3. Item 5 (read-tracker post-compaction) — separate subsystem, deferred by the plan.

## Carry-overs

- `../omni` twin regenerated (in sync, `gen-omni --check` green) and committed to the sibling repo with the mirrored message.
- No push performed (attended push gate).
