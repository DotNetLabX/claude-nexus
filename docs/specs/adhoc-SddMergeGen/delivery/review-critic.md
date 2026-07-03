# adhoc-SddMergeGen — Critic Findings (Mode 2, code-grounded)

Persisted verbatim by the architect (ADR-13: the critic writes no files). Review of
`delivery/plan.md` rev 1 against the proposal + SddLifecycle/SddCoverageLoop tech-specs + live repo.
**Verdict as returned: NO-GO (2 CRITICAL, 3 HIGH, 5 MEDIUM, 1 LOW).** All findings folded into plan
rev 2 — dispositions in `plan.md ## Plan Review`.

## Findings

### [CRITICAL] F1 — Adapter edited at the wrong plugin path; Step 10 bumps only `nexus`
Plan targeted `plugins/nexus/skills/mine-verify-cover-dotnet/SKILL.md` — path does not exist; the
adapter lives in the separate `nexus-dotnet` plugin (`plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md`).
Four independently version-keyed plugins exist (`nexus`, `nexus-dotnet`, `nexus-cpp`, `nexus-flutter`).
A single `nexus` MINOR bump means adapter edits ship in-repo but **never reach users** (version-keyed
cache, CLAUDE.md); CI release-check would fail the un-bumped plugin.

### [CRITICAL] F2 — "No shipped flutter adapter exists" is false; §B flutter-`tags` commitment dropped on a wrong premise
`plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` ships (Test-style contract `:20`,
survivor-tag taxonomy `:92`); `mine-verify-cover/SKILL.md` references it at `:21,:264,:316-317`. The
plan conflated it with dev-repo `harness/cover-flutter.workflow.js`. Proposal §B explicitly commits
flutter `tags` mapping. (Secondary: `mine-verify-cover-cpp` also ships — see F10.)

### [HIGH] F3 — Tests at `harness/*.test.mjs` are never collected; Step 4 edits a non-existent file
The suite globs only `tests/lint/*.test.mjs tests/unit/*.test.mjs` (`scripts/selfcheck.mjs:45`; same in
CI). Cited precedents actually live at `tests/unit/rule-crosswalk.test.mjs`,
`tests/unit/workflow-contract.test.mjs`. Plan-authored tests under `harness/` would silently never run —
Step 10's "suite green incl. Steps 1–4 tests" false-greens.

### [HIGH] F4 — Step 6 ungating anchors + accept grep miss `:277` (M0 "Cover/red-suite deferred") and `:280` (M3 "three-way reconciliation deferred"); `:74` ("No Cover, no mutation gate in this mode") also needs reconciling
Accept grep tested only the exact strings "AC-6-gated"/"deferred pending" — bare `deferred` in the
table rows passes it, shipping a self-contradictory skill.

### [HIGH] F5 — U-3 (tag-taxonomy freeze before adapters encode) absent from the reversal map while Step 5 encodes it
Highest-fanout ratification dependency hidden; plan declared "None open."

### [MEDIUM] F6 — New libs belong under `harness/lib/` (existing convention; selfcheck sync guard keys on `harness/lib/…`); crosswalk precedent path is `harness/lib/rule-crosswalk.mjs`
### [MEDIUM] F7 — Tech-spec C2 (attestation grammar, AC-L2/AC-L5) and C3/C4 (merged ONE test set) neither implemented nor explicitly deferred; registry path diverges from OD-L5's `docs/kb/golden/{Class}.md` default
### [MEDIUM] F8 — "Entry gate" wording vs Step 8's build-then-ratify model is ambiguous (halt-at-Step-1 misreading)
### [MEDIUM] F9 — Proposal §C render step (BR ledgers → docs-bootstrap high-trust source) undispositioned
### [MEDIUM] F10 — `mine-verify-cover-cpp` (shipped) unmentioned; needs an explicit deferral
### [LOW] F11 — "Follow the spec-cover-calc registration precedent exactly" overstates: precedent also has a dedicated sandbox-run test file; Step 4 lists only the shared-loop registration

## Verified-correct (not defects)
`applyCrosswalk`/`reconcileRuleSets` exist (`harness/lib/rule-crosswalk.mjs:27,42`); no-static-import
registration precedent real (`tests/unit/workflow-contract.test.mjs:1549`); workflow-runtime constraint
claims match `spec-cover-calc.workflow.js:53-55` + `selfcheck.mjs:87-169`; `developer.md:131` and
`solo.md` net-new claims accurate (adjacent anchor: `solo.md:14` attestation check); dotnet adapter has
a natural mapping home (`mine-verify-cover-dotnet/SKILL.md:16-18`); Step 9 operator-owed framing
consistent with the repo's build-only/live-run split.

## Critic open questions (architect dispositions in plan rev 2)
- C2/C3/C4 deferred-by-§A.3 or oversight? → **Architect: deferred deliberately; now explicit (F7).**
- Does `bump-plugin.mjs` classify all four plugins? → **Moot for the plan: Step 10 now bumps every
  changed plugin explicitly.**
