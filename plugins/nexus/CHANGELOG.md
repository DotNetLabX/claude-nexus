# nexus — Changelog

## [1.0.2] — 2026-06-06
Hotfix: revert the implementer agents off the 1M-context model.

- **`developer`, `reviewer`, `solo` moved back to the `sonnet` alias** (from `sonnet[1m]`).
  Sonnet 1M context requires usage credits on every plan, which blocked Developer Phase 1 with a
  1M-context credit error. The plain `sonnet` alias (200K, subscription-covered) avoids the cost.
  `effort: max` is retained — effort does not incur the 1M credit charge.

## [1.0.1] — 2026-06-06
Pipeline-orchestration fixes: spawn mode and review-mode timing (committed in `024fcf2`
without a bump; this release carries it to users).

- **Foreground pipeline spawns enforced.** `pipeline-gate.js` now denies a pipeline agent
  (architect/developer/reviewer/po/critic/learner) spawned with `run_in_background` — a background
  spawn truncates the relayed result (breaking verdict relay) and leaves no live agent to
  SendMessage-resume for Phase 2 (ADR-10). The team-lead's Two-Phase Spawn now carries an
  imperative "Foreground, always" rule at the spawn site; the hook matcher is broadened to
  `Task|Agent` so the gate sees spawns.
- **Pipeline-gate state-file tamper protection.** `pipeline-gate.js` now denies any pipeline
  subagent (architect/developer/reviewer/po/critic/learner) from writing `.claude/.pipeline-state`
  — the two-phase gate's own source of truth. Previously a subagent could rewrite it to flip its own
  `analyze`→`implement` phase and silently bypass the collapse gate (guard.js treats `.claude/` as
  writable and it is not a plan/source file, so nothing else stopped it). Only the team lead advances
  phases now; the main session is unaffected.
- **Review-mode question deferred to the post-Phase-1 checkpoint.** Removed from the team-lead's
  launch-time Pre-Flight. The architect owns the decision: it recommends in its Phase-1 report when
  team-spawned, and asks itself alongside the Phase-1 questions when running standalone — so it is
  no longer asked before any design analysis has happened.
- **Per-agent model & effort tuning.** Added an `effort:` level to every agent (opus agents →
  `xhigh`, sonnet agents → `max`) and moved the implementer agents (developer, reviewer, solo)
  to the 1M-context `sonnet[1m]` alias. **Cost note:** Sonnet 1M context is billed via usage
  credits on every plan (not subscription-covered), so those three agents now carry that cost
  on every install.

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
