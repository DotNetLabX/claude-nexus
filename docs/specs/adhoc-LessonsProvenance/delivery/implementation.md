# adhoc-LessonsProvenance — Implementation (Solo)

**Source:** vwh-adoptions A6 (lessons voice + provenance tags). **Lane:** solo. **Release:** PATCH (pending commit).
**Date:** 2026-06-23.

## What changed (2 plugin files)

Adopted the **provenance-tag + strengthen-don't-duplicate** half of A6. The cosmetic "first-person
voice" half was **dropped by design** (architect call — unproven value).

1. `plugins/nexus/skills/lessons-format/SKILL.md` — new **Provenance & strengthen-don't-duplicate**
   subsection. Reuses the existing improvement-proposal `**Evidence:**` line as the provenance tag (the
   run/feature set a lesson has appeared in); maturity = provenance count → makes the 2-occurrence
   promotion threshold visible in the lesson itself; strengthen an existing entry rather than appending a
   near-identical twin; revise (don't twin) on a contradicting recurrence.
2. `plugins/nexus/agents/learner.md` — step 3 (track recurrence) now reads the provenance tag as the
   recurrence count and strengthens the matching tracked/promoted entry instead of duplicating; step 6
   notes a `[TRACKED]` item keeps its provenance so the next consolidation strengthens rather than
   re-discovers.

**Design stance:** built on existing structures (`**Evidence:**` field, `[TRACKED]` tag) — no new
ledger file. A6 is a prose convention; it is best-effort until A4 (advisory nudges) can flag
"lesson lacks provenance" — enforcement is deliberately A4's job, not A6's.

## Verification

- `node --test tests/lint/{frontmatter,skill-refs,convergence,wiring,enforcement,salience}.test.mjs` →
  **27/27 pass**.

## Commit-time steps still owed (deferred — see below)

- `release-plugin` **PATCH** bump + CHANGELOG (same commit as the change, per repo CLAUDE.md).
- `node scripts/gen-commands.mjs nexus` — regenerate `commands/learner.md` (learner agent body changed).
- Omni twin regen + mirrored commit.
- Scoped staging only (concurrent Inc 3 run shares this working tree — stage just the A6 files).
- Update `docs/proposals/vwh-adoptions-2026-06.md` remainder: drop A6 (delivered).
