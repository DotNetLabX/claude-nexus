# nexus — Changelog

## [1.0.0] — 2026-06-06
First versioned release. Graduates from the `0.1.x` line to `1.0.0` and adopts the
MAJOR-leaning version policy (the payload is agent behavior and the install cache is
version-keyed, so most changes must reach users). Backfilled from git history.

Baseline included in 1.0.0:
- Eight-agent pipeline (team-lead, architect, developer, reviewer, po, critic, learner, solo)
  with hub-and-spoke coordination, two-phase spawn, verdict validation, and persona commands.
- Always-on rules injected via the SessionStart hook (`inject-rules.js`); enforcement hooks
  `guard.js` (security guard, `security_mode` userConfig) and `pipeline-gate.js`.
- Artifact-format skills (`implementation-format`, `questions-format`, `review-format`,
  `lessons-format`, `summary-format`) preloaded producer-only; process skills
  (`create-implementation-plan`, `create-architecture-doc`, `create-feature-spec`,
  `improve-flow`, `improve-skills`, `diagnose`, `tdd`, `boy-scout`, kb/schema skills).
- Team-lead and architect **read discipline** (grep verdicts, own the comm-log, never re-read
  the plan you authored) — the change that triggered this release.
- **`release-plugin` skill + `scripts/bump-plugin.mjs`**: a **dev-repo tool** that owns the
  version-bump decision and the ADR-9 release flow (classify → bump + CHANGELOG in the same commit
  → regenerate → validate → tag). Invoked directly when developing the plugin; the local reminder
  lives in the dev-repo `CLAUDE.md` and the guarantee is a CI `--check`. **Not** wired into the
  shipped agents — nothing about releasing reaches consumer-facing agent behavior. No session hook.
