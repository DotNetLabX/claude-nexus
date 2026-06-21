# Tech-Spec — PR + AI-Review Tail (v1)

**Slug:** adhoc-PRReviewTail
**Status:** **Ready (2026-06-21)** — both blockers to `Ready` cleared: (1) the push-gate prerequisite **shipped** (`adhoc-BranchPreflightGuard`, release 1.16.2, commit `62e9d78`); (2) the code-grounded critic Mode-2 pass returned **GO-with-fixes** (18/18 ACs covered, fixes folded). ADRs 35–36 **extracted** to the register (`docs/architecture/README.md`, body + index lines) per ADR-27/28. **Plan:** `docs/specs/adhoc-PRReviewTail/delivery/plan.md` (7 steps, MINOR release).
**Owner (definition):** architect (technical branch, ADR-27)
**Ratifier:** Laurentiu (repo owner)
**Source:** deferred from `docs/specs/adhoc-BranchPreflightGuard/delivery/plan.md` (Open Questions → deferred) — "the PR + AI-assisted-review + merge-to-main pipeline tail."
**Date:** 2026-06-20

> Technical-branch definition (ADR-27): the architect owns this tech-spec; the binding cross-check
> is the **ADR register** (`docs/architecture/README.md`), not product docs. This document is *where
> the design is explored*; the durable decisions are the ADRs under **ADRs to extract**, extracted
> (not re-authored) when this spec reaches `Ready`.

---

## Context

**Goal.** Complete the pipeline's missing *end*. The back of the flow currently stops at the final
commit; with the push gate (`adhoc-BranchPreflightGuard`) it stops at a controlled push. This feature
adds the opt-in tail **after push**: open a PR → post an AI review **first** → hand to one human who
curates the AI findings (accept / edit / dismiss) and controls the merge. The model is **"AI goes
first, human curates"**; the human owns the push (already handled by the push gate) and the merge.

**The design stance — reuse, don't rebuild.** Three existing surfaces already do the heavy lifting;
the audit (`docs/kb/research/gh-pr-review-capabilities.md`) confirmed each:
- The Nexus **reviewer** already emits `review.md` with `### [SEVERITY]` + `**File:** path:line`
  findings and an `APPROVED | REQUEST CHANGES | COMMENT` verdict — a review ready to project onto a PR.
- **`gh pr create | review | merge`** cover open / review / merge. (`gh pr review` posts a *single
  overall body* — no native per-line inline comments; those need `gh api .../reviews` with a
  `comments[]` array.)
- **`/code-review --comment | ultra`** already posts *inline* PR comments and runs a fresh
  cloud multi-agent review on an existing PR.

So v1 **projects** the pipeline's own review onto the PR (one coherent review, no reconciliation) and
reserves the independent fresh-eyes pass + true inline comments for an opt-in hand-off to
`/code-review`.

**Hard constraints (carried, non-negotiable).**
- The team-lead owns all outward/git actions — commit, push, PR, merge (ADR-18/20). Pipeline agents
  never do outward ops.
- Additive only (ADR-30 posture): with the tail off / unavailable, the pipeline closes exactly as
  today. The tail is opt-in, host-aware, and **never a hard step**.
- Unattended fails closed (ADR-32); merge is one-way and stays human-controlled.

**v1 scope (owner decisions, 2026-06-20):** team-lead pipeline only; attended-only; default =
project `review.md`; `/code-review ultra` is the opt-in independent pass; merge human-controlled.

**Out of scope (roadmap, named only):** unattended PR-open/review; native inline projection of
`review.md` via `gh api`; a `guard.js` hardened-mode hook block for `gh` outward ops; a solo-lane
tail; the curation loop-back to the learner; non-GitHub host adapters.

---

## Prerequisite — the push gate (blocks `Ready`)

The tail attaches **after push**, and the push gate is **not yet shipped**: `adhoc-BranchPreflightGuard/`
is an untracked `plan.md` with no implementation commit, and `team-lead.md` has **no push step,
no `autoPush`, no `defaultBranch`** (verified against live source 2026-06-20). This tech-spec is
written *on top of* that plan (owner decision): it reuses the push gate's `defaultBranch` resolution
(D1) and its hardened-mode deferral pattern, and attaches at the push gate's closure point. **Ship
`adhoc-BranchPreflightGuard` first**; this spec reaches `Ready` only once it lands.

---

## What already exists — v1 extends, does not reinvent

| Existing | Where | v1 relationship |
|----------|-------|-----------------|
| Reviewer `review.md` — `### [SEVERITY]` + `**File:** path:line` findings + `## Verdict` | `agents/reviewer.md`, `skills/review-format` | **Project it** onto the PR as one review body. The projection source — *not* re-reviewed. |
| `/code-review --comment` / `ultra` / `--fix` (bundled CLI skill) | Claude Code harness | **Opt-in independent pass** — fresh eyes + inline comments on the existing PR. Comments on a PR, never creates one. |
| `gh pr create/review/merge` | host CLI | The host-adapter primitives (ADR-36). `pr review` = single body only; inline needs `gh api .../reviews`. |
| Team-lead **Commit Protocol** (2-commit default, team-lead owns every commit) | `agents/team-lead.md:340` | The tail attaches at closure, **after** the (planned) push gate — same owner, same boundary. |
| Planned **push gate** + `defaultBranch`/`autoPush` keys | `adhoc-BranchPreflightGuard/delivery/plan.md` | **Prerequisite.** Reuse its `defaultBranch` resolution + hardened-mode deferral; attach the tail right after it. |
| `guard.js` hardened mode blocks `git push`/fetch/curl — **not `gh`** | `hooks/scripts/guard.js:138` | **Gap.** v1 defers the tail to hardened mode in *prose* (gh passes the hook); a hook block is roadmap. |
| Canonical-rule pattern (branch guard lives once in `agents-workflow.md`, both agents reference it) | `rules/agents-workflow.md` | The **host-adapter + tail rule** lives here once; team-lead references it. |
| `.claude/nexus-agents.json` (model/effort; +`defaultBranch`/`autoPush` from push gate) | pre-flight 4b | **Extend** with the optional `prTail` keys, read at the same pre-flight read. |
| Unattended fail-closed → review queue (ADR-32); `Force-accept` attended-only | `agents/team-lead.md:319/327/385` | The tail is **unreachable unattended** in v1 — consistent with fail-closed. |

---

## v1 definition & acceptance criteria

The plan's steps will carry `Satisfies: AC-n`. This is an agent-doc / rules-prose pass (no runtime
code in v1), so acceptance is **grep-checkable presence** + the existing lint/selfcheck gate, the same
shape as the push-gate plan.

### Layer 0 — Opt-in, host-gated, attended-only switch (additive guarantee)
- **AC-0.1** The tail is **opt-in and OFF by default.** With it off, unavailable, or declined, the
  pipeline closes exactly as today (the push gate is the last step). No change to any path before push.
- **AC-0.2** **Host capability is resolved first** (ADR-36): the origin is a GitHub remote **and**
  `gh` is installed + authed. Absent → the tail is **unavailable** and silently skipped — never an
  error, never a hard step. (Mirrors the push gate's best-effort/host-aware posture.)
- **AC-0.3** **Attended-only in v1.** Under `[UNATTENDED]` the tail is **unreachable** — no PR open,
  no review post, no merge (fail-closed, ADR-32; curation + merge need a human). Hardened guard mode
  also **skips the tail** (prose deferral, mirroring the push gate's hardened deferral).
- **AC-0.4** The tail attaches at the **post-push closure point** and depends on a pushed branch
  (the push-gate prerequisite). If nothing was pushed, the tail does not run.

### Layer 1 — Open the PR (team-lead-owned, opt-in)
- **AC-1.1** After a successful push, the team-lead **asks** (attended) whether to open a PR; never
  auto-opens without the opt-in. A `nexus-agents.json` key may pre-set the answer.
- **AC-1.2** PR opened via the adapter: `gh pr create --base {defaultBranch} --head {branch} --fill`
  (title/body from the feature commits + slug); `--draft` is opt-in. `{defaultBranch}` reuses the
  push gate's D1 resolution.
- **AC-1.3** **Idempotent** — if a PR already exists for the branch (`gh pr view`), reuse it; never
  open a duplicate.

### Layer 2 — Post the AI review FIRST (the projection)
- **AC-2.1** **Default = project `review.md`.** The team-lead posts the reviewer's `## Step 2 — Code
  Review` section onto the PR as a **single PR review body** (`gh pr review --comment --body-file`).
  One coherent review, reuses the gate already run, **no reconciliation** and **no second reviewer**.
- **AC-2.2** The projected body preserves the **verdict** (`APPROVED | REQUEST CHANGES | COMMENT`) and
  the per-finding **severity + `file:line`** so the human can navigate. (MEDIUM/LOW / Open Questions
  may lack `file:line`; they appear in the body, not inline — inline is Layer-2 opt-in's job.)
- **AC-2.3** **Opt-in independent pass.** The team-lead offers a hand-off to **`/code-review ultra`**
  (or `/code-review --comment`) for a fresh-eyes review that also posts **inline** per-line comments.
  It does **not** replace the projected review; both appear on the PR, clearly labeled, and
  reconciliation is the **human's** (no automated merge of the two). `ultra` needs a claude.ai account.
- **AC-2.4** **AI goes first** — the review is posted *before* the human curates; the tail then **STOPS**
  and hands off.

### Layer 3 — Human curates + controls merge
- **AC-3.1** After posting, the team-lead **hands to one human**: "PR #N opened, AI review posted —
  review the code + the AI review, curate (accept / edit / dismiss), and merge when ready." The
  pipeline's automated work ends here.
- **AC-3.2** Curation uses **native** GitHub / `gh` UX (resolve/dismiss review comments,
  approve/request-changes) — the tail builds **no custom curation surface**.
- **AC-3.3** **Merge is human-controlled.** The team-lead **never auto-merges**; it executes
  `gh pr merge` (squash | merge | rebase, `--delete-branch` per the user) **only on explicit user
  instruction**, sequenced **after** the human review — never at commit closure. Unattended never
  merges (AC-0.3).
- **AC-3.4** Records the deliberate omission: **merge-to-main is NOT part of commit closure** (the
  push-gate plan flagged this; the tail is where merge lives, after PR review).

### Layer 4 — The host seam + config
- **AC-4.1** A **host-adapter** seam (ADR-36) is documented once in `agents-workflow.md`: the adapter
  surface is *open-PR / post-review / view-PR / merge*; the only adapter shipped is **`gh` (GitHub)**;
  host capability is resolved before any adapter call. The team-lead references the rule rather than
  inlining `gh` commands ad-hoc.
- **AC-4.2** New optional `.claude/nexus-agents.json` keys, read at the existing pre-flight 4b read
  (absent → defaults, never required): `prTail` (bool, default false — attended opt-in default),
  `prDraft` (bool, default false), `prReviewMode` (`project` default | `independent` | `both`).
- **AC-4.3** Version bump + command regeneration (ADR-9 release flow) — same commit as the edits;
  omni twin follow-through.

---

## Roadmap (named only — NOT defined or planned here)

- **Native inline projection of `review.md`** via `gh api POST /repos/{o}/{r}/pulls/{n}/reviews` with
  a `comments[]` array (commit_id + per-finding path/line). Richer than the single-body projection, but
  adds commit_id resolution + the MEDIUM/LOW-without-line edge. v1 reserves inline for the opt-in
  `/code-review` pass instead.
- **Unattended PR-open + review-post (no merge)** behind an `autoPR` flag — overnight runs open the PR
  + post the review for morning triage; merge always deferred to the review queue.
- **`guard.js` hardened-mode hook block for `gh` outward ops** (`gh pr create|merge`) — moves the
  hardened deferral from prose to the cheapest-locus hook (allocation principle). Closes the gap that
  `gh` is currently unguarded.
- **Solo-lane tail** — solo produces no `review.md` (no pipeline review), so "project the review" does
  not apply; a solo "open a PR" step is lower-value and deferred.
- **Curation loop-back to the learner** — dismissed AI findings as a signal the reviewer over-flags.
  Out of scope v1.
- **Non-GitHub host adapters** (GitLab / Gitea / Azure DevOps) — the seam (ADR-36) exists so these
  slot in without re-architecting.

---

## ADRs to extract (on reaching `Ready`, per ADR-27/28)

Drafted here as complete one-decision records; extract **verbatim** (not re-authored) into
`docs/architecture/README.md` as ADR-35/36 when this spec reaches `Ready`.

### ADR-35 — The PR + AI-review tail: project the pipeline's review onto an opt-in PR; the human curates and merges
- **Context.** The pipeline ended at the final commit (and, with the push gate, at a controlled push).
  There was no controlled hand-off from "pushed" to "reviewed and merged," and no place for the AI
  review the pipeline already produces to reach a PR.
- **Decision.** An **opt-in, attended-only, host-gated** tail, owned by the **team-lead**, that after
  push: (a) opens a PR; (b) posts the AI review **first** — by **default *projecting* the reviewer's
  existing `review.md`** as a single PR review body (*not* a second reviewer), with an **opt-in**
  hand-off to `/code-review ultra` for an independent fresh-eyes pass + inline comments; then (c)
  **STOPS** and hands to **one human** who curates via native GitHub/`gh` UX and **controls the
  merge.** The team-lead **never auto-merges**; merge runs only on explicit user instruction,
  sequenced **after** the human review, never at commit closure. Under `[UNATTENDED]` the tail is
  unreachable (fail-closed, ADR-32); hardened mode skips it (prose deferral, like the push gate).
- **Why.** Reuse over rebuild — the reviewer already emits severity-rated `file:line` findings, so
  *projecting* them is one coherent review with no reconciliation; a second reviewer is the *opt-in*,
  not the default. "AI first, human curates" keeps the human in control of the one-way action
  (merge). Attended-only + fail-closed unattended honors ADR-18/20/32; the team-lead is the existing
  owner of outward actions.
- **Tradeoffs.** MEDIUM/LOW review.md findings may lack `file:line` and post in the body, not inline
  (inline is the opt-in independent pass's job). `gh` is not blocked by hardened mode, so the
  hardened deferral is prose-level in v1 (a hook block is roadmap).
- **Rejected.** *A second on-PR reviewer as default* — reconciliation cost; fresh eyes is the opt-in.
  *Auto-merge* (even unattended-flagged) — a one-way action unwatched is the OMC/ADR-32 failure mode.
  *A custom curation UI* — GitHub's native dismiss/resolve/approve already is the curation surface.

### ADR-36 — PR-tail host operations route through a thin host adapter; gh (GitHub) is the only adapter, and the tail is host-gated
- **Context.** PR/merge operations are host-specific. Hard-coding `gh`/GitHub into the team-lead prose
  would exclude offline / non-GitHub / no-remote repos and silently turn the tail into a hard step.
- **Decision.** All outward PR operations (**open-PR / post-review / view-PR / merge**) route through a
  **named host-adapter seam** documented once in `agents-workflow.md`. The **only adapter shipped is
  `gh` (GitHub).** Host capability is **resolved first** (GitHub remote + `gh` installed/authed);
  absent → the tail is **unavailable** and the pipeline closes at push exactly as today — never an
  error, never a hard step.
- **Why.** The seam keeps offline/non-GitHub repos first-class (the tail is always optional) and lets a
  future GitLab/Gitea/Azure adapter slot in without re-architecting. Mirrors the push gate's
  best-effort, host-aware, never-blocks posture.
- **Tradeoffs.** v1 ships a single adapter, so the "abstraction" is a documented concept, not code —
  accepted: it is exactly what stops GitHub being hard-wired into the agent prose.
- **Rejected.** *Hard-code `gh` inline in team-lead prose* — excludes non-GitHub, makes the tail a
  hard step. *A third-party `gh` extension for inline comments* — an external dependency outside the
  thin seam.

---

## Open decisions — RESOLVED (owner, 2026-06-20)

| # | Fork | Resolution |
|---|------|------------|
| D1 | Push-gate dependency / sequencing | **Ship the push gate (`adhoc-BranchPreflightGuard`) first; spec this tail on top.** |
| D2 | One review or two (the core stance) | **Default = project `review.md`; `/code-review ultra` is the opt-in independent pass.** |
| D3 | Unattended / merge posture | **Attended-only in v1.** Unattended skips the tail; merge is human-controlled, never auto. |
| D4 | Review mode for this feature's own plan | **Critic, code-grounded** (shared plugin source — the code-grounded mandate applies). |

Decided by the architect (no owner ask needed): host seam = thin gh-only adapter, host-gated (ADR-36);
hardened-mode deferral = prose in v1 (hook block = roadmap); learner loop-back = out of scope v1.

---

## Review gate

- **Cross-check is the ADR register** (ADR-27, technical branch) — not product docs; there is no
  `spec.md`.
- **Code-grounded critic Mode-2 owed at PLAN time** (D4). This feature edits **shared plugin source**
  (agent prose + the `agents-workflow.md` rule, and any future `guard.js` hardening) — the
  code-grounded review mandate applies; a doc-only/self pass is structurally blind to shared-artifact
  defects. The critic runs against the **ADR register + these ACs** (no spec to diff).
- **Next step:** ship the push-gate prerequisite, then `Analyze adhoc-PRReviewTail` → plan (steps
  carry `Satisfies: AC-n`) → code-grounded critic → extract ADR-35/36 → flip Status to `Ready`.
