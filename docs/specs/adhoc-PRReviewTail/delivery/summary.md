# Summary — adhoc-PRReviewTail (PR + AI-Review Tail v1)

**Status:** COMPLETE — 2026-06-21
**Slug:** adhoc-PRReviewTail
**Plugin:** nexus — version bumped **1.16.2 → 1.17.0 (MINOR)**
**Team mode:** Standard+Codex · **Review:** APPROVED, 1 cycle

## What shipped

The pipeline's opt-in tail **after push**: open a PR → post the AI review **first** (by default *projecting*
the reviewer's existing `review.md`) → STOP and hand to one human who curates and controls the merge.
"AI goes first, human curates." Agent-doc / rules-prose only — no runtime code. Attached at the push
gate's closure seam (shipped 1.16.2); reuses the canonical `defaultBranch` resolution.

## Steps (7/7 Implemented, 0 Missing, 1 sanctioned Deviation)

1. New canonical **`## Host Adapter & PR Tail`** rule in `agents-workflow.md` (ADR-36 seam: 4-op adapter, gh-only, host-capability-resolved-first, attended-only).
2. Pre-Flight 4b extended with `prTail` / `prDraft` / `prReviewMode` (same one-read capture as `defaultBranch`/`autoPush`).
3. **PR Tail** subsection in team-lead Commit Protocol (after the byte-unchanged Push gate): gate + `gh pr view` idempotency + `gh pr create … --fill` + `gh pr review --comment` projection (`--comment` not self-approve) + suggest-not-run `/code-review ultra`.
4. STOP + single-human hand-off + human-controlled `gh pr merge` (never auto, never at closure).
5. Unattended-Mode bullet: PR tail unreachable in v1 (fail-closed, ADR-32).
6. Regenerated `commands/team-lead.md`.
7. MINOR bump + CHANGELOG (`release-plugin`). *Deviation (sanctioned):* commit/omni deferred to team-lead (ADR-18).

## Definition / decisions

- **Tech-spec → Ready**; **ADR-35** (tail policy) + **ADR-36** (gh-only host-adapter seam) extracted to `docs/architecture/README.md` (body + index lines), committed in commit 1.
- Owner-resolved: design forks D1–D4 (tech-spec), release tier **MINOR**, team mode **Standard+Codex**.

## Verification

- Real gate: lint + unit **233/233 PASS**; golden negative-control **5/5 PASS** (no hook surface moved).
- ADR-30 byte-unchanged discipline confirmed (Push-gate subsection untouched vs HEAD).
- Plan-time **code-grounded critic** GO-with-fixes (18/18 ACs, 2 MEDIUM folded); Step-1 done-check PASS; Step-2 reviewer **APPROVED** + Codex cross-check (NO-GO only on the expected uncommitted-bump, reconciled → resolved by commit 2).

## Files

- **Modified (plugin):** `rules/agents-workflow.md`, `agents/team-lead.md`, `commands/team-lead.md`, `.claude-plugin/plugin.json`, `CHANGELOG.md`.
- **Modified (docs):** `docs/architecture/README.md` (ADR-35/36, commit 1).
- **Delivery artifacts:** plan.md, implementation.md, review.md (Step 1 + Step 2), review-codex.md, lessons.md, communication-log.md, summary.md, tech-spec.md (Ready); research `docs/kb/research/gh-pr-review-capabilities.md`.

## Commits

- **Commit 1** — `c23f280` `feat(adhoc-PRReviewTail): add implementation plan + extract ADR-35/36`.
- **Commit 2** — the implementation (plugin edits + 1.17.0 bump + delivery artifacts).
- **Omni twin** — regenerated + committed in `../omni` (mirrored subject, footer pins commit 2 SHA).

## Roadmap (named, not built)

Native inline projection via `gh api .../reviews`; unattended `autoPR`; `guard.js` hardened-mode `gh` hook
block (v1 defers the tail in prose — `gh` is genuinely unguarded today); solo-lane tail; learner loop-back;
non-GitHub host adapters (the ADR-36 seam exists for these).

## Lessons

Recorded in `lessons.md` (architect + developer). Processing: **not yet** — offer to the user at close.
