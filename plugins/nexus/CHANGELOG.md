# nexus — Changelog


## [1.2.1] — 2026-06-08
Reverts the 1.2.0 pipeline-hardening experiment. The hardening regressed the thing that actually
worked — agents relaying their output to the team lead — without buying correctness the simple gate
didn't already give. Confirmed against a real run that shipped clean with the gate not even firing,
and against the `cfb7a64` / fokus baseline that "worked fine."

- **Restored the message-first relay model** (the `cfb7a64` model). Pipeline agents return their full
  verdict, questions, and findings **in their completion message**, and the team lead reads and relays
  that message. Reverted the 1.2.0 "minimal-return contract / never trust the agent's last message /
  grep the artifact for the verdict" machinery in `team-lead.md`, `architect.md`, `developer.md`, and
  `reviewer.md`. Artifacts (`plan.md`, `review.md`, `implementation.md`, `lessons.md`) remain the durable
  record — the team lead no longer reconstructs verdicts/questions from them.
- **Simplified `pipeline-gate.js` back to the load-bearing invariants** — (1) analyze-phase collapse
  (no `plan.md`/source written during an `:analyze` phase), (2) review.md verdict integrity (no APPROVED
  with an open CRITICAL/HIGH), (3) state-file integrity (a pipeline subagent can't rewrite
  `.pipeline-state`). Dropped the 1.2.0 additions: the team-lead read-lane (H0) and the dev-repo markdown
  source guard (H2b). Spawns pass through untouched (background by design, ADR-12).
- **Reverted `restore-agent.js`** (dropped the SessionStart `.pipeline-state` liveness-clearing, H4) and
  the hooks matcher (back to `Write|Edit|MultiEdit|Task|Agent`, no `Read`/`Grep`). Removed the gate/restore
  unit tests added with the experiment.

## [1.2.0] — 2026-06-07
Pipeline-gate hardening experiment — **reverted in 1.2.1**, see above. Tightened the team lead's read
lane (H0, hook-enforced), added a dev-repo markdown source guard (H2b) and a `.pipeline-state`
liveness clear (H4), and added a "minimal-return / grep-the-artifact" relay contract across the
pipeline agents. The relay changes regressed message relay and the extra gate lanes added no
correctness the simple gate lacked; all of it was rolled back in 1.2.1.
## [1.1.1] — 2026-06-07
Spawn mode reversed to **background** for pipeline agents (ADR-12, supersedes ADR-10). Also flips the
release policy to **PATCH-default** (owner escalates to MINOR/MAJOR) — see `release-plugin` skill.

- **Pipeline agents now spawn in the background.** The team lead spawns architect/developer/reviewer/PO/
  critic with `run_in_background: true` so the pipeline no longer blocks the main session — restoring the
  original `cfb7a64` default and the repo owner's standing preference. It reads each agent's full result
  via `TaskOutput` on completion and resumes the same live agent via `SendMessage` for Phase 2.
- **`pipeline-gate.js` foreground enforcement removed** (former invariant 3). Spawn mode is no longer
  hook-gated; the gate keeps the two-phase-collapse, verdict-integrity, and state-file invariants (now
  numbered 1–3). The 1.0.1 rationale (background "truncates" the relayed result) did not hold: relay
  reads the verdict from the artifact and the full result from `TaskOutput`, never the inline message,
  and a background agent stays alive to resume.
- **Docs:** ADR-10 marked superseded; ADR-12 records the reversal and why the foreground fears don't
  hold on the current platform.

## [1.1.0] — 2026-06-07
Token consumption audit — opt-in, off by default (ADR-11).

- **`token_audit` userConfig flag** (default off). When on, the `audit-logger` hook additionally
  records per-agent token usage to `docs/audit/token-usage.jsonl` (`{ts, agent, tool, input, output,
  cache_read, cache_creation, context}`), reading the last completed turn's `usage` from the
  transcript (a one-turn lag, fine for a growth curve). Off by default — zero extra work when
  disabled; the existing `tool-calls.log` trace is unchanged.
- **`consumption-report` skill** — aggregates that log into a per-agent table: peak context, output
  generated, tool-call count, and context growth (first → peak), so you can see which agent burns the
  most tokens and tie its growth back to what it re-read. Dedups same-turn rows so output isn't
  multi-counted.

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
