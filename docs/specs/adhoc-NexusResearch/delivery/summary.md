# adhoc-NexusResearch — Summary

**Status:** COMPLETE · **Release:** nexus 1.13.2 → **1.14.0** (MINOR) · **Branch:** main
**Team mode:** Standard+Codex · **Review:** reviewer APPROVED (1 round, 0 fix cycles)

## What shipped

Makes `/research` the everyday research command and routes heavy dives to the built-in
`/deep-research`, with a capture path that folds a deep-research report back into the research pool.

| Step | Outcome |
|------|---------|
| 1 — Rename `search-researches` → `research` (live surfaces only) | Implemented — rename gate zero hits (CHANGELOG history excluded per Q2); skill-lint OK; cite-check 19/19 at new path; old folder deleted |
| 2 — Depth-routing branch + `/deep-research` re-label | Implemented — `external .deep-research` grep zero; routing chain `recall → route(low-med forked \| heavy → /deep-research) → capture` |
| 3 — Capture path (`/deep-research` report → pool entry) | Implemented (Deviated-valid, Q3 — see below) — sample report → cite-check-clean entry |
| 4 — `research-before-asking` depth-dial update | Implemented — both engines named, one-owner; zero `search-researches` in rules/ |
| 5 — Release (in-repo half) | Implemented (Deviated-valid, Q1) — bump 1.14.0 + CHANGELOG `[1.14.0]`; full suite 224/0; validate `research` strict-clean; gen-commands no-diff |

## Decisions & deviations

- **Q1 (twin):** `../omni` is absent on this machine → the in-repo half (bump + validate + suite) was
  done; the omni twin regen is deferred as an **OPERATOR ACTION** (below). Resolved Deviated-valid at done-check.
- **Q2 (CHANGELOG):** the Step-1 zero-hit rename gate excludes `CHANGELOG.md` — the 3 hits are release
  history (audit trail), left untouched.
- **Q3 (cite-check):** the plan's literal Step-3 mechanism (high-stakes single-source + `Status: uncertain`)
  **CITE-FAILs** — `cite-check.mjs` keys the high-stakes floor on the `Corroboration` line and never reads
  `Status`. Corrected rule applied in the skill (omit the `high-stakes` label; record count; `Status: uncertain`;
  caveat in prose); the architect independently confirmed and **patched plan Step 3** to match.

## Review

- **Architect Step-1 done-check:** PASS — 3 Implemented, 2 Deviated-valid, 0 Missing; skill-conformance 5/5.
- **Reviewer Step-2:** APPROVED — no CRITICAL/HIGH; full plan conformance.
- **Codex (Standard+Codex):** **did not deliver** — job stalled ~40 min, no verdict. Per owner decision,
  closed on the reviewer's independent approval. See `review-codex.md`.

## OPERATOR ACTIONS REQUIRED (owner)

1. **Regenerate the omni twin** — ✅ **RESOLVED (correction).** The twin was *not* absent: Q1 checked
   `D:/src/omni`, but `gen-omni` resolves the twin to `NEXUS/../omni` = **`D:/src/claude-plugins/omni`**
   (present). It was *drifted* (the selfcheck message said "drifted", not "missing"), not missing. The
   twin was regenerated during the follow-up `adhoc-FleetHeartbeatFix` run (covering 1.14.0 + 1.14.1);
   `gen-omni --check` now passes and `selfcheck` is 4/4. The twin commit rides in the `../omni` repo with
   the FleetHeartbeatFix close. No owner action remains here.
2. **Validate capture live** — run `/deep-research` once and confirm the report → pool-entry path is
   cite-check-clean against genuine output (validated here against a representative hand-built report).

## Follow-ups (separate, not blockers)

- Pre-existing `claude plugin validate --strict` failures on 4 unrelated skills (`boy-scout`, `diagnose`,
  `evaluate-skill`, `improve-skills`) — unchanged by this feature; a small separate pass + possible
  `skill-lint` E-check gap (unquoted `description:` colon-space). Logged in lessons.

## Commits

- `c695ef8` — plan (commit 1/2)
- *(this close)* — implementation + bump + docs (commit 2/2)
