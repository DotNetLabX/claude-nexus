# PR + AI-Review Tail v2 — inline projection, runnable independent pass, gh hardened block

> **SUPERSEDED (2026-07-09)** — never implemented. The concept was redirected to
> `docs/specs/adhoc-ConformanceReviewer/` (conformance lens, not a richer correctness projection).
> The delivery mechanics (Step 4, corrected to hunk-level diff checks per the critic's HIGH finding)
> are absorbed there; the `guard.js` hardened `gh` block (Step 1) remains a valid standalone
> ride-along candidate for that feature's plan. Kept as the audit trail of the critic findings.

**Feature Spec:** `docs/specs/adhoc-PRReviewTailV2/definition/tech-spec.md` (technical-branch tech-spec,
ADR-27 — the binding cross-check is the ADR register, not a product `spec.md`)

## Context

v1 (nexus 1.17.0, ADR-35/36) shipped the opt-in post-push tail but projects the review as **one
monolithic comment body** — GitHub's resolve/dismiss curation UX operates on *individual* review
comments, so the promised accept/edit/dismiss loop cannot actually be exercised. v2 makes the
projection **inline by default** (per-finding `comments[]` via the reviews API, behind a fallback
ladder that bottoms out at exact v1 behavior), lets the team-lead **run** the local
`/code-review --comment` as the opt-in independent pass (ultra stays suggest-only), and moves the
hardened-mode deferral from prose to a real `guard.js` block (allocation principle).

**Grounding is current** — every live-source claim was re-verified 2026-07-08 (tech-spec → Grounding
table): the v1 recipe at `agents/team-lead.md:393-400`, the "convention, not an enforcement" posture at
`rules/agents-workflow.md:80`, `guard.js:138-144` hardened block (git push / pkg installs / fetches — no
`gh`), the finding grammar at `skills/review-format/SKILL.md:111-136`, and the reviews-API route in
`docs/kb/research/gh-pr-review-capabilities.md` [4][5].

Impacted plugin: `nexus` (team-lead agent doc, the always-on `agents-workflow` rule, **and runtime hook
code** — `guard.js` + its tests). Dev-repo change → version bump in the same commit. **Release tier:
MINOR recommended** (new opt-in capability + intent-aligned hardened tightening; mirrors the v1 tier —
owner confirms at bump time).

## Scope

**In scope (v2 — owner-resolved 2026-07-08: scope pick + D2 amendment)**
- `guard.js` hardened-mode block for outward/mutating `gh` ops + unit tests (Layer C).
- `agents-workflow.md` posture sync: hardened-skip becomes an enforcement, not a convention (AC-C.4).
- Team-lead PR-Tail recipe: inline-first projection ladder (Layer A) + runnable local independent
  pass (Layer B) + the `prProjection` 4b key (AC-A.3).
- Command regen, research-entry update, MINOR bump; ADR-52/53 extraction (architect graduation).

**Out of scope (still roadmap — named in the tech-spec, NOT planned here)**
- Unattended `autoPR`; solo-lane tail; learner loop-back; non-GitHub adapters.
- Any change to the ADR-36 adapter surface (still four ops; inline is a richer `post-review` recipe).
- Blocking `gh` ops outside the named deny list (e.g. `gh repo`, `gh release`) — see Decisions d2.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | yes | `guard.js` hardened gh deny list + allow list; tests in `guard.test.mjs` | |
| 2 | (none) | — | no | `agents-workflow.md` posture bullet: enforced, not convention | |
| 3 | (none) | — | no | 4b: append `prProjection` (`inline` default \| `body`) to the one-read capture | |
| 4 | (none) | — | no | Team-lead projection bullet → inline ladder (reviews API + fallbacks) | |
| 5 | (none) | — | no | Team-lead independent-pass bullet → run local `/code-review --comment`; ultra suggest-only | |
| 6 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | |
| 7 | (none) | — | no | Research-entry update: self-PR reconfirm note + inline-projection shipped | |
| 8 | release-plugin | Follow | no | MINOR bump + CHANGELOG, same commit; omni twin follow-through | |

Steps 2–5 are agent-doc / rules-prose (`Skill: None`, `TDD: no` — grep-checkable acceptance, the v1
shape). **Step 1 is runtime hook code — `TDD: yes`**: the developer invokes the `tdd` skill and drives
the deny/allow behavior through `tests/unit/guard.test.mjs` (red-green per fixture). Step 8 follows
`release-plugin` (ADR-9).

## Domain Model Changes

None.

## Data Model Changes

One optional key appended to the `.claude/nexus-agents.json` contract (read once at team-lead
Pre-Flight 4b; absent → default, never asked):
- `prProjection`: `inline` (default) | `body` — `body` forces the v1 single-body projection
  (escape hatch). The existing `prTail` / `prDraft` / `prReviewMode` keys are unchanged.

**Binding surfaces:** the key name `prProjection` and its two values are a public config contract —
binding. `guard.js` deny-reason strings, exact regexes (within AC boundaries), and team-lead bullet
wording (within the grep anchors) are the developer's call.

## Implementation Steps

### Step 1 — `guard.js`: hardened-mode block for outward/mutating `gh` ops (+ tests)
**Files:** `plugins/nexus/hooks/scripts/guard.js` (the `mode === 'hardened'` branch, currently
`:138-144`), `tests/unit/guard.test.mjs`
Inside the existing hardened branch (open mode untouched), deny:
- `gh pr create`, `gh pr merge`, `gh pr review`, `gh pr comment` — the outward PR mutations;
- mutating `gh api` — `--method POST|PUT|PATCH|DELETE` or `-X <same>` (a bare `gh api` GET stays allowed).

Must stay allowed in hardened mode (false-positive guard — assert these in tests): `gh pr view`,
`gh pr diff`, `gh pr list`, `gh auth status`. Deny reasons follow the file's existing self-correcting
style (e.g. `'gh PR mutation (hardened mode defers the PR tail)'` — exact wording developer's call).
TDD: extend `tests/unit/guard.test.mjs` (it already parameterizes mode — `guard(event, mode)`) with
the deny fixtures AND the allow fixtures above.
**Golden-test expectation (negative assertion, pre-resolved):** `tests/unit/attended-unchanged.golden.test.mjs`
pins **fixed fixtures** — none of them exercise hardened-mode `gh`, so it must **still pass unchanged**.
If it fails, that is a real regression to investigate — do **not** re-baseline it (Decisions d1).
**Acceptance (mechanism):** `node --test tests/unit/guard.test.mjs` green with the new deny + allow
fixtures; `node --test tests/unit/attended-unchanged.golden.test.mjs` green **without edits to the test
file**; grep `guard.js` for `gh pr create` within the hardened branch.
`Satisfies:` AC-C.1, AC-C.2, AC-C.3

### Step 2 — `agents-workflow.md`: hardened posture becomes an enforcement
**File:** `plugins/nexus/rules/agents-workflow.md` (the `## Host Adapter & PR Tail` posture list, `:77-81`)
Rewrite ONLY the third posture bullet (`:80`): hardened guard mode **blocks** the tail's outward ops at
the hook layer (`guard.js` denies `gh pr create|merge|review|comment` + mutating `gh api`) — the tail
**defers** to it, same shape as the closure push gate's deferral. Delete "convention, not an
enforcement" and "the `guard.js` hook block is roadmap" (both retired by Step 1). Leave the
attended-only and unattended bullets and everything else in the section byte-unchanged (ADR-30
discipline). The four-op adapter table is untouched — inline is a richer `post-review` recipe, not a
new op (recipes live in the team-lead subsection per the section's own last line).
**Acceptance:** grep `agents-workflow.md`: `convention, not an enforcement` → **0 hits**; the posture
bullet names `guard.js` as the enforcing layer; the adapter table and other posture bullets unchanged
vs HEAD (`git diff` shows only the one bullet).
`Satisfies:` AC-C.4

### Step 3 — Team-lead Pre-Flight 4b: append `prProjection`
**File:** `plugins/nexus/agents/team-lead.md` (Pre-Flight 4b — the existing one-read capture)
Append `prProjection` (`inline` default | `body`) to the same capture sentence that already carries
`prTail`/`prDraft`/`prReviewMode`. Missing key → default applies, never ask; cached for closure, no
second config read. ADR-30: the existing keys' wording stays byte-unchanged; this is an append to the
same sentence (a `±` diff pair on that one line is the expected shape — v1 developer lesson).
**Acceptance:** 4b lists `prProjection` with its default alongside the three v1 keys, same single read.
`Satisfies:` AC-A.3
**Confidence: medium** — read the current 4b bullet first; the hazard is disturbing the existing capture.

### Step 4 — Team-lead PR Tail: replace the projection bullet with the inline-first ladder
**File:** `plugins/nexus/agents/team-lead.md` (Commit Protocol → PR Tail, the **"Post the AI review
FIRST"** bullet, currently `:395`)
Replace that one bullet (its siblings — gate, open-PR, AI-goes-first/STOP — stay byte-unchanged; the
independent-pass bullet is Step 5's). New content, still "projection, not re-review":
- **Default (`prProjection: inline`):** parse the findings from the `## Step 2 — Code Review` section
  of `docs/specs/{slug}/delivery/review.md` — each `### [SEVERITY] title` block carrying
  `**File:** path:line` becomes one `comments[]` entry `{path, line, side: RIGHT, body: severity +
  title + finding body}`. Post as **one** PR review:
  `gh api --method POST repos/{owner}/{repo}/pulls/{n}/reviews` with `event: COMMENT` (**always
  COMMENT** — the v1 self-PR restriction carries over verbatim), `commit_id` from
  `gh pr view --json headRefOid`, and top-level `body` = provenance line (**"Projected from the
  pipeline reviewer — `review.md` Step 2"**) + the `## Verdict:` + all line-less findings (MEDIUM/LOW
  without `file:line`) + `## Open Questions`.
- **Fallback ladder (the tail never errors):** (1) a finding whose `path` is not in
  `gh pr diff --name-only` rides in the **body**, not `comments[]` (the reviews API 422s the whole
  POST on out-of-diff paths/lines); (2) if the inline POST fails for **any** reason, fall back once to
  the v1 whole-body projection — `gh pr review --comment --body-file` — worst case is exact v1
  behavior. `prProjection: body` forces rung 2 directly.
**Acceptance (grep-and-confirm):** the bullet contains `gh api --method POST` + `pulls/{n}/reviews` (or
equivalent placeholder form), `event: COMMENT` with the self-PR rationale, `headRefOid`,
`gh pr diff --name-only`, the provenance line, and the `gh pr review --comment --body-file` fallback;
`git diff` shows the sibling bullets (gate / open-PR / STOP-handoff / merge) unchanged.
`Satisfies:` AC-A.1, AC-A.2, AC-A.4

### Step 5 — Team-lead PR Tail: the independent pass becomes runnable (local only)
**File:** `plugins/nexus/agents/team-lead.md` (same subsection, the **"Opt-in independent pass"**
bullet, currently `:396`)
Replace that one bullet: with `prReviewMode: independent | both`, the team-lead **runs the local
`/code-review --comment` itself** (Skill invocation, default effort, attended-only) once the PR exists
— for `both`, after the projection posts. If the skill is unavailable in the session → **degrade to
suggesting it** (the v1 sentence). **`/code-review ultra` stays suggest-only** — user-triggered +
billed, the team-lead never launches it (keep that v1 sentence for ultra, scoped to ultra). Both
reviews stay clearly labeled (Step 4's provenance line vs `/code-review`'s own output);
**reconciliation is the human's** — no automated merge of the two (v1 sentence survives).
**Acceptance:** the bullet contains "runs" + `/code-review --comment` as a Skill invocation, the
unavailable→suggest degradation, the ultra-stays-suggest-only sentence, and the
reconciliation-is-human sentence. Grep: `code-review --comment`, `ultra`, `reconciliation`.
`Satisfies:` AC-B.1, AC-B.2, AC-B.3

### Step 6 — Regenerate commands
**File (generated):** `plugins/nexus/commands/team-lead.md`
Run `node scripts/gen-commands.mjs nexus`. Do not hand-edit. The `selfcheck.mjs` gen-commands check is
git-HEAD-based → known false-positive until the team-lead commits (v1 lesson; do not bounce).
**Acceptance:** `commands/team-lead.md` regenerated to match `agents/team-lead.md`.

### Step 7 — Update the research entry (KB step — numbered so it isn't dropped)
**File:** `docs/kb/research/gh-pr-review-capabilities.md`
Two additive edits: (a) append the **self-PR restriction** to the entry (GitHub rejects
`--approve`/`--request-changes` from the PR author — the v1 lesson said this belongs on the entry) and
extend the `Reconfirm trigger` accordingly; (b) note under Recommendation/Status that native inline
projection **shipped in v2** (`comments[]` route, fallback ladder) so the entry's "deferred past v1"
framing doesn't mislead a future reader. Keep the entry's `research-entry-schema` shape.
**Acceptance:** grep the entry for the self-PR note + a v2-shipped note; schema headings unchanged.

### Step 8 — Version bump + release
**Files:** `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` (via the skill)
Follow `release-plugin` — **MINOR** (`bump-plugin.mjs --minor`; owner confirms tier at bump). Bump in
the **same commit** as the edits (CLAUDE.md release rule). Omni twin regenerated + committed in
`../omni` (mirrored subject) — team-lead/owner follow-through. Sequence the architect's ADR extraction
(Graduation) before the omni sync or fold it into the feature commit (v1 L1 lesson — the omni footer
pins the impl SHA).
**Acceptance:** `plugin.json` minor incremented; CHANGELOG names inline projection, `prProjection`,
the runnable local pass, and the hardened `gh` block; bump rides in the same commit as the edits.
`Satisfies:` AC-D.3, ADR-9

## Graduation (ADR extraction — architect-owned, post-critic, NOT a developer step)

Per ADR-27/28, after the code-grounded critic passes this plan the architect:
- **(a)** Extracts **ADR-52** and **ADR-53** verbatim from the tech-spec (body form) into
  `docs/architecture/README.md`, appended after ADR-51.
- **(b)** Adds the ADR-52/53 **index lines** to the contents block (authored at extraction time — the
  index surface has no draft in the tech-spec; v1 M1 lesson: name every surface).
- **(c)** Adds the **amendment pointers**: ADR-35's index line and body heading gain
  *"(amended by ADR-53 — the local independent pass is runnable)"*, and ADR-35's tradeoff sentence
  ("a hook block is roadmap") gains a "(shipped in v2 — ADR-52/53 pass)" pointer. ADR-36 is untouched
  (its decision — four ops, gh-only — is unchanged by v2).
- **(d)** Confirms the tech-spec `Status: Ready` note records the extraction.

Commit grouping is the team-lead's call (mixed precedent — v1 H1 finding); if a separate `docs` commit,
sequence it before the omni sync.

## Cross-Service Changes

None.

## Migration Notes

None. `prProjection` is optional and backward-compatible; consumers on v1 behavior set
`prProjection: body` or simply never enable the tail.

## Testing Strategy

- **Step 1 is real runtime code — TDD.** New deny + allow fixtures in `tests/unit/guard.test.mjs`
  (mode-parameterized harness already exists). The **allow fixtures are load-bearing**: the
  host-capability gate (`gh auth status`, `gh pr view`) must keep working in hardened mode or the tail's
  "silently skipped" posture breaks.
- **Golden negative-control:** `attended-unchanged.golden.test.mjs` must pass **unmodified** (fixed
  fixtures, none hardened-gh) — a failure is a regression, never a re-baseline (Decisions d1).
- **Prose steps (2–5):** grep acceptance per step; `scripts/selfcheck.mjs` + `tests/lint/*` (gen-commands
  HEAD false-positive expected pre-commit).
- **No live `gh`/API calls** — the reviews-API recipe is team-lead instruction prose, exercised at a
  real closure, not code under test here.

## KB Impact

Step 7 (numbered) updates `docs/kb/research/gh-pr-review-capabilities.md`. No `docs/kb/` domain entries
apply (plugin-internal workflow).

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Golden test must pass **unmodified**; a failure = regression | Its fixtures are fixed and none exercise hardened `gh` — adding patterns can't legitimately change them | Pre-authorizing a re-baseline (would mask a real open-mode regression) | decided |
| Deny list = the 4 `gh pr` mutations + mutating `gh api` only; `gh repo`/`gh release`/etc. stay unblocked | Scope-matched to the tail's own ops (ADR-36's four); hardened mode's documented intent, not a general gh firewall | Blanket-deny all `gh` mutations (over-blocks unrelated legitimate use; bigger false-positive surface) | decided |
| `commit_id` included via `gh pr view --json headRefOid` (resolves tech-spec d2) | Research [4] recommends it; one cheap call; removes an API-default ambiguity | Omit and rely on the API defaulting to latest commit | decided |
| Release tier MINOR | New opt-in capability + intent-aligned tightening; mirrors v1's tier | PATCH (undersells a capability), MAJOR (nothing reverses; hardened tightening matches documented intent) | deferred — owner confirms at bump |

## Open Questions

None. Both owner forks (v2 scope, D2 amendment) resolved 2026-07-08; spec-time review mode
(self cross-check) and ratification done at the definition checkpoint the same day.
