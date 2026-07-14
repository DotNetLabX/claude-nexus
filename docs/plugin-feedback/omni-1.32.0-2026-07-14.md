# Plugin Feedback — omni 1.32.0 (2026-07-14)

Source: learner consolidation of two architect-led fast-lane runs — `adhoc-lint-leancode-swap`
(omnishelf_lint → leancode_lint 17 swap + 7-gate battery) and `adhoc-Refactor-W1-barrel-scc`
(layer-purity refactoring wave). Lessons: `docs/specs/adhoc-lint-leancode-swap/delivery/lessons.md`,
`docs/specs/adhoc-Refactor-W1-barrel-scc/delivery/lessons.md`. Recurrence counts cross-referenced
against the other `docs/specs/*/delivery/lessons.md` and prior feedback files. None of this is applied
to the consuming repo.

---

## Entry 1: boundary detector false-flags a fast-lane developer subagent because `resolveRole` doesn't map the `dev-*` abbreviation

- **Suggested target:** `hooks/scripts/lib/resolve-role.js` (`resolveRole` abbreviation handling), and/or
  the fast-lane dispatch guidance in `architect.md` (canonical spawn-name requirement).
- **Action:** update
- **Evidence (code-grounded — the source lessons' `.current-agent` hypothesis was wrong; verified
  against the live plugin code):** `boundary-detector.js` exits for the main session (`!data.agent_type`,
  line 77) and resolves ownership from the **acting subagent's** `data.agent_type` via `resolveRole`
  (line 81) — it never reads `.current-agent`. The false positives come from the spawn NAME:
  - `adhoc-lint-leancode-swap` — subagent `dev-wave0`, **18** ADR-18 `implementation.md` hits in
    `.claude/audit/violations.log`.
  - `adhoc-Refactor-W1-barrel-scc` — subagent `dev-w1`, **8** hits.
  - Corroborating (predates both, same root cause): `adhoc-MineVerifyFlows` — subagent
    `dev-json-golden-2`, **7** hits. (That run's *map*-gap facet was already routed as
    `omni-1.25.1-2026-07-12.md` Entry 4; this abbreviation facet is the mechanism underneath it.)
  **Recurrence 2x across the two new slugs (+ a corroborating third).**
- **Lesson:** `resolveRole` peels an auto-suffixed or team-named spawn (`developer-2`, `developer-f6`)
  back to the base role `developer`, but it does **not** know that `dev` is an abbreviation of
  `developer`. Tracing `resolveRole('dev-wave0')`: split on `-` → `['dev','wave0']` → candidate `dev`
  is not in `KNOWN_ROLES` (which has `developer`, not `dev`) → returns `dev-wave0` unchanged. That
  resolved role is absent from `ARTIFACT_OWNERS[implementation.md] = {developer, solo}`, so a fast-lane
  developer editing its OWN `implementation.md` logs an ADR-18 cross-role write on every touch. Fix,
  either: (a) teach `resolveRole` the `dev`→`developer` abbreviation (and any other abbreviations the
  fast lane uses), or (b) require canonical `developer-*` / `architect-*` spawn names in the fast-lane
  dispatch so the existing suffix-peel already resolves them. Do **not** add a `.current-agent` path —
  the detector correctly ignores the main session by design (`register-persona.js` keeps `.current-agent`
  as a write-trigger only). Note `resolve-role.js` already exists specifically to kill this false-positive
  class for suffixed names — this extends its coverage to abbreviated names, it does not build a new path.
