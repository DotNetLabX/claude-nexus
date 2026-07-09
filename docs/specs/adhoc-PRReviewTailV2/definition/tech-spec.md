# Tech-Spec — PR + AI-Review Tail v2: inline projection, runnable independent pass, gh hardened block

**Slug:** adhoc-PRReviewTailV2
**Status:** **Superseded (2026-07-09)** — by `docs/specs/adhoc-ConformanceReviewer/definition/tech-spec.md`. The owner redirected the concept: the PR reviewer must be conceptually different (conformance lens), not a richer projection of the correctness review. The inline-comments delivery mechanics (reviews API, COMMENT event, fallback ladder incl. the hunk-level 422 fix from the plan critic's HIGH finding) are absorbed there (Layer D); the "runnable local /code-review" D2 amendment is dropped; the draft ADR numbers 52/53 here were never extracted and are dead — the successor's ADRs are 53/54 (ADR-52 was taken by adhoc-AgentGrounding, 2026-07-09). Never implemented. *(Was: Ready 2026-07-08.)*
**Owner (definition):** architect (technical branch, ADR-27)
**Ratifier:** Laurentiu (repo owner)
**Source:** the v1 roadmap (`docs/specs/adhoc-PRReviewTail/definition/tech-spec.md` → Roadmap; ADR-35 tradeoffs) — owner picked the v2 slice 2026-07-08: "the feature is quite thin."
**Prerequisite:** v1 shipped (nexus 1.17.0, ADR-35/36) — all v2 work extends live surfaces.

> Technical-branch definition (ADR-27): the binding cross-check is the **ADR register**
> (`docs/architecture/README.md`), not product docs. This document is where the design is explored;
> the durable decisions are the ADRs under **ADRs to extract**.

---

## Context

**Why v2 — the v1 thinness is structural, not cosmetic.** ADR-35's model is "AI goes first, human
**curates** (accept / edit / dismiss) via native GitHub UX." But v1 projects the reviewer's
`## Step 2 — Code Review` as **one monolithic comment body** (`gh pr review --comment --body-file`) —
and GitHub's resolve/dismiss UX operates on *individual* review comments. With a single blob there is
nothing granular to accept or dismiss: **the promised curation loop exists on paper but cannot be
exercised.** Three consequences:

1. The curation surface (AC-3.2 of v1) is hollow until findings land inline.
2. The roadmap **learner loop-back** (dismissed findings → reviewer-calibration signal) is blocked —
   per-finding dismissals are unmeasurable on a monolithic comment.
3. ADR-39's deferred **per-PR loop** (additive-drift detection) will ride this tail; a per-finding
   review shape is its groundwork.

**Owner decisions (2026-07-08):**
- **v2 scope = native inline projection** (v1 roadmap item 1) + the `guard.js` hardened-mode `gh`
  hook block riding along (v1 roadmap item 3).
- **D2 amended:** the team-lead may **run** the local `/code-review --comment` itself as the opt-in
  independent pass — **ultra stays suggest-only** (user-triggered + billed; the model cannot launch it).

**Hard constraints (carried from v1, non-negotiable).**
- Team-lead owns all outward ops (ADR-18/20); attended-only; unattended tail unreachable (ADR-32).
- Additive: with the tail off / unavailable / any projection failure, behavior degrades to **v1 or
  better, never worse** — the tail never becomes a hard step (ADR-35/36 posture unchanged).
- The host-adapter seam (ADR-36) is **unchanged**: still four ops (open-PR / post-review / view-PR /
  merge), still `gh`-only. Inline projection is a **richer recipe for the existing `post-review` op**,
  not a fifth op.

**Out of scope (still roadmap, named only):** unattended `autoPR`; solo-lane tail; learner
loop-back; non-GitHub adapters.

---

## Grounding — live surfaces verified 2026-07-08

| Fact | Where | Status |
|---|---|---|
| PR-Tail recipe posts one body via `gh pr review --comment --body-file`; `--comment` mandatory (self-PR restriction) | `agents/team-lead.md:395` | verified live |
| Independent pass is **suggest-only** ("state you do not run it yourself") | `agents/team-lead.md:396` | verified live — the line D2-amend changes |
| Hardened-mode posture is "a **convention, not an enforcement**… hook block is roadmap" | `rules/agents-workflow.md:80` | verified live — the line the hook block retires |
| `guard.js` hardened blocks `git push` / pkg installs / fetches — **not `gh`** | `hooks/scripts/guard.js:138-144` | verified live |
| Inline comments need `gh api POST /repos/{o}/{r}/pulls/{n}/reviews` + `comments[]` (`{path, line, side, body}`, `commit_id`, `event`); direct `POST /pulls/{n}/comments` can 422 | `docs/kb/research/gh-pr-review-capabilities.md` [4][5] | research, read-docs tier |
| Finding grammar: `### [SEVERITY] title` + `**File:** path:line` under `## Findings`; verdict at `## Verdict: APPROVED \| REQUEST CHANGES \| COMMENT`; CRITICAL/HIGH always carry `file:line`, MEDIUM/LOW may not | `skills/review-format/SKILL.md:111-136` | verified live |
| `prTail` / `prDraft` / `prReviewMode` captured at Pre-Flight 4b one-read | `agents/team-lead.md` (4b) | verified live (v1 step 2) |

**Known edge (drives the design):** the reviews API **rejects the whole POST (422)** if any
`comments[]` entry references a path/line outside the PR diff. Findings legitimately cite lines
outside the changed hunks (e.g. a caller the diff didn't touch). The projection therefore needs a
**fallback ladder**, not a single attempt.

---

## v2 definition & acceptance criteria

Prose ACs are grep-checkable presence on live source (v1 shape); Layer C adds **behavioral** ACs
(the hook change is runtime code — unit-tested, not just grepped).

### Layer A — Native inline projection (the new default `post-review` recipe)

- **AC-A.1** With `prReviewMode: project` (default), the team-lead posts the Step-2 review as **one
  PR review** via `gh api --method POST /repos/{owner}/{repo}/pulls/{n}/reviews` with:
  `event: COMMENT` (always — self-PR restriction carried from v1); `comments[]` = one entry per
  finding that carries `**File:** path:line` (`{path, line, side: RIGHT, body: severity + title +
  finding body}`); top-level `body` = verdict + provenance line + all line-less findings (MEDIUM/LOW
  without `file:line`) + `## Open Questions`. Still **one coherent review, projection not re-review**.
- **AC-A.2 (fallback ladder — the tail never errors).**
  (1) A finding whose `path` is not in `gh pr diff --name-only` posts in the **body**, not `comments[]`.
  (2) If the inline POST fails for any reason (422 or otherwise), fall back **once** to the v1
  whole-body projection (`gh pr review --comment --body-file`). Worst case = exact v1 behavior.
- **AC-A.3** New optional 4b key **`prProjection`** (`inline` default | `body`), read at the existing
  one-read capture; `body` forces the v1 single-body path (escape hatch, two-way door).
- **AC-A.4** The projected review's body opens with a **provenance line** ("Projected from the
  pipeline reviewer — `review.md` Step 2") so it is distinguishable from any independent pass.

### Layer B — Runnable local independent pass (amends v1 D2 / ADR-35)

- **AC-B.1** With `prReviewMode: independent | both`, the team-lead **runs** the local
  `/code-review --comment` itself (Skill invocation, default effort) after the PR exists (and, for
  `both`, after the projection posts). Attended-only. If the skill is unavailable in the session,
  degrade to **suggesting** it (v1 behavior) — never an error.
- **AC-B.2** **`/code-review ultra` stays suggest-only** — user-triggered + billed; the team-lead
  never launches it. Stated explicitly in the same bullet (the v1 sentence survives for ultra).
- **AC-B.3** Both reviews clearly labeled on the PR (AC-A.4's provenance line vs `/code-review`'s own
  output); **reconciliation remains the human's** — no automated merge of the two.

### Layer C — `guard.js` hardened-mode `gh` block (prose deferral → hook, allocation principle)

- **AC-C.1** In **hardened** mode, `guard.js` denies outward/mutating `gh` ops:
  `gh pr create`, `gh pr merge`, `gh pr review`, `gh pr comment`, and mutating `gh api`
  (`--method POST|PUT|PATCH|DELETE` / `-X` equivalents). Deny reasons are self-correcting
  (existing guard.js style).
- **AC-C.2** Read-only host-capability ops stay allowed in hardened mode: `gh pr view`, `gh pr diff`,
  `gh pr list`, `gh auth status`. **Open mode is unchanged for `gh`** (no new open-mode blocks).
- **AC-C.3** Unit tests cover the new denials **and** the allowed read-onlys (false-positive guard);
  the existing golden negative-control (`tests/unit/attended-unchanged.golden.test.mjs`) still passes
  or is deliberately re-baselined with the reason documented — the plan verifies which applies.
- **AC-C.4** Prose synced to the enforcement: `rules/agents-workflow.md` posture bullet drops
  "convention, not an enforcement" (now enforced); the team-lead subsection needs no gate change
  (posture stays referenced, not restated).

### Layer D — Register + release hygiene

- **AC-D.1** ADR-52/53 extracted **verbatim, both surfaces** — index line + `## ADR-N` body
  (v1 lesson M1: "verbatim extraction" without the index is incomplete by construction).
- **AC-D.2** Amendment pointers on the existing records, both surfaces where applicable:
  ADR-35 gains "*(amended by ADR-53 — the local independent pass is runnable)*" and its tradeoff
  line ("hook block is roadmap") gains the shipped pointer; the ADR-36/agents-workflow
  "convention not enforcement" note is updated per AC-C.4.
- **AC-D.3** MINOR bump + CHANGELOG + `gen-commands` regen + omni twin follow-through (ADR-9),
  bump in the same commit as the edits.

---

## ADRs to extract (on reaching `Ready`, per ADR-27/28)

### ADR-52 — Inline projection is the default post-review recipe: per-finding comments via the reviews API, degrading through a fallback ladder to the v1 body
- **Context.** ADR-35's curation model (accept / edit / dismiss via native GitHub UX) operates on
  individual review comments, but v1 projected `review.md` as one monolithic body — nothing granular
  to curate. The learner loop-back and ADR-39's per-PR loop both need per-finding resolution.
- **Decision.** The default `post-review` recipe becomes **one PR review posted via
  `gh api POST /repos/{o}/{r}/pulls/{n}/reviews`**, `event: COMMENT`, with a `comments[]` entry per
  finding carrying `**File:** path:line`, and the verdict + line-less findings + open questions in
  the top-level body behind a provenance line. **Fallback ladder:** finding-path not in the PR diff →
  that finding rides in the body; inline POST fails at all → one retry as the v1 whole-body
  projection. A `prProjection: inline|body` 4b key is the explicit escape hatch. The ADR-36 seam is
  unchanged — this is a richer recipe for the existing `post-review` op, not a new op.
- **Why.** Per-finding comments make curation *real* (resolve/dismiss per finding), unblock the
  dismissal-signal loop-back, and keep "one coherent review" (a single reviews-API call, not N loose
  comments). The ladder keeps the tail additive: worst case is exactly v1.
- **Tradeoffs.** Line-accuracy is bounded by the diff (out-of-hunk findings stay in the body);
  the projection now parses the finding grammar (`review-format` is the binding contract — a format
  drift breaks projection down to the body fallback, visibly and safely).
- **Rejected.** *Direct `POST /pulls/{n}/comments` per finding* — N loose comments, no single review
  shell, documented 422 flakiness. *A third-party gh extension* — external dependency outside the
  thin seam (carried from v1). *Keeping body-only* — leaves curation hollow.

### ADR-53 — The local independent pass is runnable by the team-lead; ultra stays suggest-only (amends ADR-35)
- **Context.** ADR-35 made the independent pass suggest-only wholesale. The *billing/account*
  rationale is real only for `/code-review ultra`; the plain local `/code-review --comment` is a
  session-local skill the team-lead can execute under its existing outward-ops ownership.
- **Decision.** With `prReviewMode: independent | both`, the team-lead **runs**
  `/code-review --comment` itself (default effort, attended-only) once the PR exists; unavailable →
  degrade to suggesting (v1). **Ultra remains suggest-only** — user-triggered + billed, never
  launched by the model. Both reviews stay labeled; reconciliation stays human (ADR-35 unchanged
  there).
- **Why.** Real fresh-eyes inline comments with zero new machinery; the suggest-only blanket was
  scoped to the actual constraint (billing) instead of the whole capability. Owner ratified the D2
  amendment 2026-07-08.
- **Tradeoffs.** Two AI reviews on one PR when `both` — accepted; that was already v1's shape when
  the human ran the pass manually. The skill is a harness built-in — availability varies by CLI
  version, hence the degrade-to-suggest rung.
- **Rejected.** *Run ultra too* — billed + account-gated, the OMC failure mode. *Keep suggest-only* —
  preserves a restriction whose rationale never applied to the local pass.

---

## Decisions resolved at definition (architect, two-way doors)

| # | Call | Resolution | Why |
|---|---|---|---|
| d1 | `prProjection` default | **`inline`** | The feature's whole point; ladder guarantees ≥ v1; `body` key is the escape hatch |
| d2 | `commit_id` in the POST | include (`gh pr view --json headRefOid`) | Research [4] recommends it; cheap; plan may drop if the API default proves sufficient |
| d3 | Exact hardened block-list regex | plan-time detail | AC-C.1/C.2 fix the boundaries (deny-list + allow-list); the regex is implementation |
| d4 | New ADRs vs rewriting ADR-35/36 | **extract ADR-52/53 + amendment pointers** | Register practice: supersede/amend, never rewrite (ADR-10/12, ADR-7/13 precedent) |

## Open decisions — for ratification

None. Both owner forks (scope, D2 amendment) were resolved 2026-07-08 in the scoping discussion.

---

## Review gate

- Cross-check is the **ADR register** (technical branch; no `spec.md`).
- **Spec-time review:** architect self cross-check (every live-source claim in Grounding was
  re-verified against current source on 2026-07-08, this session) — offered at the definition
  checkpoint alongside ratification.
- **Plan-time review: code-grounded critic Mode-2 — MANDATORY** (mirrors v1 D4). This pass edits
  shared plugin source **including runtime hook code** (`guard.js`) — the code-grounded mandate
  applies twice over (shared-artifact trigger + the golden-test/negative-assertion trigger on
  AC-C.3).
- Plan steps carry `Satisfies: AC-{layer}.{n}`.
- **mine-from-spec:** default-skip — agent-prose + hook wiring, no rule-shaped business behavior.
