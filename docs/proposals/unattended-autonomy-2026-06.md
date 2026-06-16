# Proposal — Unattended Autonomy as an Additive Layer

**Status:** Ratified (owner, 2026-06-16)
**Decision-maker:** Laurentiu (repo owner)
**Recommendation:** Add unattended-overnight operation as a strictly additive mode (default OFF), built as a thin vertical slice first — mode switch + always-on verification gate + fail-closed defer-to-review-queue, pinned by a golden test that proves attended mode is byte-unchanged.
**Confidence:** High — on the additive strategy and the v1 thin slice (mode-flag-default-off is unbreakable-by-construction and golden-test-pinned; the verify gate runs at the *foreground* team-lead Stop boundary, so it needs no background-subagent enforcement). The one unconfirmed mechanism (Layer-2 enforceable advancement on background subagents) is **carved out of v1** and routed to a spike, so it does not lower v1 confidence.
**Impact:** 9
**Effort:** med (committed v1 slice; full program is high and phased)
**Date:** 2026-06-16

---

## Need

The end goal is to run Nexus **unattended overnight** as jobs/pipelines — specs in, verified
work (or a triaged review queue) out by morning. The code-grounded orchestration research
(`docs/research/2026-06-16-orchestration-*`) confirmed two things: Nexus already **leads the
field** on engineering, orchestration, observability, and attended UX, and it has exactly
**one hole and one cap** standing between it and unattended operation — verification rigor
(scored 3/10: no real suite gate, trusts agent-authored tests) and enforcement on background
subagents (6/10: detect-then-log, per ADR-13). Those two axes *are* unattended operation.

**The hard constraint, owner-stated:** the attended pipeline must not break. The 29-ADR
record is hard-won and is the project's primary asset. The autonomy layer must be **strictly
additive** — a switch, never a rewrite.

**Out of scope (this proposal):** any change to attended behavior; the Layer-2 enforceable-
advancement mechanism (needs a spike — see Unresolved); anti-gaming holdout scenarios (Layer 4,
phased last); wiring the T3/T4 agent-eval tier into CI (a separate, already-deferred owner
decision); and true headless-on-a-subscription (a ToS/cost question the research closed as
out of scope).

## Approach

**Organizing principle: autonomy is a switch, not a rewrite.** Four disciplines guarantee the
constraint:

1. **One mode flag, default OFF, new code unreachable when off.** Attended-with-flag-off is
   today's behavior, byte for byte.
2. **New mechanisms are always-on-but-advisory in attended, authoritative in unattended — one
   code path, not two.** The verify gate always runs and reports; only *who consumes the
   verdict* changes (the human, vs. the gate). This is what stops the two modes diverging.
3. **A golden regression test pins attended behavior with the flag off** — the mechanical
   expression of the constraint, in the T1/T2 suite from day one.
4. **Unattended fails closed** → defers to a morning human-review queue with the full audit
   trail; never force-ships.

**Committed first increment — the v1 thin slice (owner decision):**
- **Layer 0 — mode switch + golden test.** Reuse/extend the existing `[UNATTENDED]` /
  `.pipeline-state` machinery for the flag; add the attended-unchanged golden test.
- **Layer 1 — verification gate.** Run the project's real test/lint/type/security suite at the
  **foreground team-lead Stop/SubagentStop boundary** + in CI. Always runs; in attended it
  *informs* the human who still decides, in unattended its result *is* the decision. (Foreground
  boundary ⇒ no background-subagent enforcement needed — sidesteps ADR-13 entirely for v1.)
- **Layer 3 — fail-safe budgets + fail-closed defer.** Per-run token cap; on verify-fail /
  3-cycle-cap / genuinely-unanswered-question under `[UNATTENDED]`, **defer to the review queue**
  rather than force-accept. Reuses the existing audit/`violations.log`/consumption-report trail
  as the morning-review evidence.

**Roadmap (NOT committed by this proposal):**
- **Layer 2 — enforceable advancement** ("no phase advance without recorded verification," via a
  Stop-boundary + cooperative tool-call gate that survives background subagents). Owner chose this
  *mechanism* over a stateful MCP server — but it rests on the one unconfirmed assumption and is
  gated behind a spike.
- **Layer 4 — anti-gaming holdout** (joycraft pattern: separate private repo, one-way spec
  dispatch, tests against the built artifact in CI). Lives entirely outside the in-session path,
  so it cannot touch attended mode by construction. Phased last, once the rest is proven.

## Benefits

- Closes the **only** two gaps between Nexus and unattended operation (verify 3→8, enforcement
  6→8) using mechanisms verified in joycraft's and maestro's source, not README claims.
- The attended pipeline is **provably unchanged** (golden test) — the constraint is mechanical,
  not a promise.
- The verify gate **earns its keep in attended mode too** (it informs the human), so it is never
  dead weight when the flag is off.
- Leverages Nexus's **already-best-in-class observability (8/10)** for the morning-review
  workflow — the asset becomes load-bearing instead of incidental.
- **Fail-closed** means the worst overnight outcome is "deferred to your queue," never "shipped a
  bug while you slept."

## Alternatives

- **Forked attended/unattended code paths** — rejected: they drift and rot; the switch-not-rewrite
  discipline (one advisory-or-authoritative path) exists precisely to avoid this.
- **Force-accept on unattended** (the trilogy's default) — rejected: the OMC failure mode, ships
  unverified work unwatched. *(Owner decision: fail-closed → review queue.)*
- **Full stack incl. holdout in one pass** — rejected: holdout is the heaviest, riskiest piece;
  the thin slice delivers most of the safety first. *(Owner decision: thin slice.)*
- **Stateful MCP gate server (maestro pattern) for enforcement** — rejected for v1: a new
  long-running process to own; the Stop-boundary + cooperative-tool-call route is cheaper and
  matches ADR-13's "no machinery without evidence." Retained as a fallback if the hook route leaks.
  *(Owner decision: Stop-boundary route.)*
- **Fork sddw or joycraft instead of extending Nexus** — rejected: the code review showed Nexus
  already leads on engineering/orchestration/observability/attended-UX; the gap is narrower than a
  rebuild. Mine joycraft's *mechanism*, don't adopt its base.
- **Adopt nexus-agents-style consensus/bandit routing** — rejected: wrong shape for a fixed-role
  serial pipeline (heavy, needs substitutable models + call volume).

## Unresolved

1. **Verify-command config** — where a project declares its real test/lint/type/security commands
   (a small explicit `.claude/verify.json` vs a `docs/conventions/` entry vs reusing sddw-style
   runner detection as a fallback). Lean: explicit config + detection fallback.
2. **Layer-2 enforcement mechanism (the one unconfirmed assumption)** — does a Stop-boundary +
   cooperative-tool-call gate actually enforce on background subagents *without* an MCP server?
   Needs a Probe-P1-style in-repo spike before Layer 2 is planned. **v1 does not depend on this.**
3. **Review-queue format & location** — the shape of the morning queue (deferred-item dir +
   index) and how a human resumes a deferred item back into the attended pipeline.
4. **Dogfood suite scope** — for the nexus repo itself, "the suite" is presumably `node:test`
   T1/T2 + `selfcheck.mjs`; confirm.
5. **Existing `[UNATTENDED]` inventory** — catalog what ADR-7/ADR-19 already ship (defaults,
   force-accept menu, fail-open hooks) and reconcile, so v1 *extends* rather than duplicates.

## Graduate-to-spec

Technical branch (ADR-27). On ratification this graduates to a tech-spec
(`docs/specs/adhoc-UnattendedAutonomy/`) with ADRs *extracted* (not re-authored): one for the
additive-mode / switch-not-rewrite principle, one for the verification gate, one for
fail-closed-defer. Layer-2 enforcement earns its own ADR only after the spike; Layer-4 holdout
only when built. **Ratified 2026-06-16 → graduated to
`docs/specs/adhoc-UnattendedAutonomy/definition/tech-spec.md`; the v1 slice becomes the
first backlog row.**

## Provenance

Session 2026-06-16. Fed by: the orchestration-fork trilogy
(`docs/research/2026-06-16-orchestration-fork-{1,2,3}-*.md`), the code-grounded value-extract
and scorecard (`docs/research/2026-06-16-orchestration-{value-extract,scorecard}.md` — seven
repos cloned and read at source), and owner direction (committed to unattended autonomy with a
hard don't-break-attended constraint; three design decisions answered 2026-06-16: fail-closed,
thin slice first, Stop-boundary gate).
