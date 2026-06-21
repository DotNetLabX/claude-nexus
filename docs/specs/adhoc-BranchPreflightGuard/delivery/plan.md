# Branch Pre-Flight Guard + Push Gate

**Feature Spec:** None (ad-hoc plugin-hardening pass — binding input is the design agreed in this session, see Context)

## Context

The Nexus pipeline has weak **bookends**. At launch, the team-lead only warns on a *dirty* tree
and otherwise stays on whatever branch is checked out (Pre-Flight #1–2); **solo has no branch
handling at all**. At closure, the team-lead makes a final commit and stops — no push gate, no
default-branch awareness. The result: work can silently land on `main`, on an unrelated branch, or
on a stale base, and the user has no controlled push step.

This pass adds a **launch-time branch guard** (resolve the repo's default branch, then decide
new-branch vs continue by branch state) and a **closure-time push gate** (controlled, opt-in), to
both the team-lead and solo. It is git-only and host-agnostic. The **PR / AI-assisted-review /
merge-to-main tail is explicitly out of scope** — that is a separate feature (see Open Questions →
deferred).

Impacted plugin: `nexus` (agent docs + the always-on `agents-workflow` rule). Dev-repo change →
needs a version bump (`release-plugin`) in the same commit.

Design decisions locked with the user this session (carried as `Satisfies:` units):
- **D1 — Default-branch resolution:** auto-detect `origin/HEAD` → `.claude/nexus-agents.json`
  `defaultBranch` override → `main` fallback. (Detection beats pure config.)
- **D2 — "Unrelated" rule:** ask when ambiguous; no auto-classification.
- **D3 — Unattended default:** auto-create `{slug}` branch from the default branch; abort only if it
  can't (no slug / detached HEAD).
- **D4 — Solo scope:** same guard, lightweight.
- **D5 — Push gate:** attended asks; unattended never pushes unless opted in; hardened mode still
  blocks push.

## Scope

**In scope**
- A shared, canonical branch-guard + default-branch-resolution rule in `agents-workflow.md`.
- Team-lead Pre-Flight: replace #1–2 with the unified guard (fresh-launch path only).
- Team-lead Commit Protocol: a closure push gate.
- Solo: a lightweight pre-flight branch guard + a light push gate.
- Two new `.claude/nexus-agents.json` keys: `defaultBranch` (string), `autoPush` (bool, unattended).
- Version bump + command regeneration.

**Out of scope (deferred to a separate feature)**
- Opening PRs, posting AI review onto a PR, the AI-first-then-human review-curation loop.
- Merge-to-main (sequencing-wise it belongs *after* PR review, not at commit closure).
- Any GitHub/`gh` coupling.
- Changing the **Resume** branch-match block (already correct; the new guard is launch-only and must
  not double-fire with it).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Canonical branch-guard section: resolution order, 4-state matrix, overlays | |
| 2 | (none) | — | no | Team-lead Pre-Flight rewrite (#1–2 → unified guard); read `defaultBranch` at 4b | |
| 3 | (none) | — | no | Team-lead push gate in Commit Protocol; `autoPush` key; hardened-mode note | |
| 4 | (none) | — | no | Solo Workflow pre-flight step + light push gate | |
| 5 | (none) | — | no | `node scripts/gen-commands.mjs nexus` (regenerate commands) | |
| 6 | release-plugin | Follow | no | PATCH bump + CHANGELOG, same commit; omni twin follow-through | |

All editing steps are `Skill: None` — this is an agent-doc / rules-prose pass with no pattern skill
(the documented all-`None` shape for a hooks/agent-doc hardening pass). `TDD: no` throughout: the
deliverable is instruction prose, not runtime behavior; acceptance is **grep-checkable presence** +
the lint/selfcheck gate + the unchanged golden test (proves no hook surface moved). Step 6 follows
the `release-plugin` skill for the version bump (ADR-9 release flow).

## Domain Model Changes

None — documentation/instruction change only.

## Data Model Changes

Two optional keys added to the existing `.claude/nexus-agents.json` config contract (read at
team-lead Pre-Flight 4b; absent file/keys fall back to defaults — never required):
- `defaultBranch`: string — overrides auto-detection of the repo's default branch.
- `autoPush`: bool (default false) — unattended-only; when true, an unattended run may push after the
  final commit. Attended is always an explicit ask regardless.

## Implementation Steps

### Step 1 — Add the canonical branch-guard rule to `agents-workflow.md`
**File:** `plugins/nexus/rules/agents-workflow.md`
Add a new section (suggested title **"Branch Pre-Flight & Default-Branch Resolution"**) near the
Pipeline Modes / Slug area, since both team-lead and solo load this always-on rule and both reference
it (the existing "canonical in agents-workflow" pattern). The section defines, once:

- **Default-branch resolution order (D1):** (a) `git symbolic-ref --quiet refs/remotes/origin/HEAD`
  (strip `refs/remotes/origin/`); (b) on miss, `.claude/nexus-agents.json` → `defaultBranch`;
  (c) on miss, literal `main`. State that resolution is best-effort and never blocks — a detached or
  remote-less repo falls through to (b)/(c).
- **Branch-state decision matrix** (attended | unattended), where "matches the slug" = the current
  branch name contains the slug or vice-versa (the cheap heuristic — anything not a clear match is
  treated as *unrelated*, and unrelated → **ask**, never auto-classify, D2):

  | State | Attended | Unattended (D3) |
  |---|---|---|
  | On default branch | Ask: new branch (named `{slug}`) or continue here | Auto-create `{slug}` from default, proceed |
  | Branch matches slug | Proceed silently ("Working on `{branch}`") | Proceed silently |
  | Unrelated branch | Ask: continue here, or new branch `{slug}` from default | Auto-create `{slug}` from default, proceed |
  | Detached HEAD / no slug | Ask to create a branch | **Abort** (can't safely auto-branch) |

- **Overlays (apply on top of the matrix):**
  - **Dirty tree:** warn + offer to isolate (branch or worktree) before proceeding (attended);
    abort if it can't be cleanly isolated (unattended). This is the *existing* team-lead #1 behavior
    — state it here as the shared rule, don't change its meaning.
  - **Stale default:** when creating a branch *from* the default, `git fetch` the default and warn
    if local is behind `origin` before branching — never base new work on a stale default silently.
    The fetch is **unconditionally best-effort**: if it fails or errors for any reason (offline, no
    remote, a guard policy, a detached/remote-less repo), **warn-and-skip — never block or error**.
    (Note: unlike the Step 3 push gate, this is *not* a hardened-mode deferral — hardened mode does
    **not** block `git fetch`, and an agent has no runtime signal for the active guard mode anyway; the
    best-effort posture covers the fetch failing for *any* reason, which subsumes the policy case.)
  - **New-branch name** = the slug.
- A one-line pointer that this is the **fresh-launch** guard and is distinct from the team-lead
  **Resume** branch-match block (which guards against resuming onto the wrong branch and is unchanged).

Keep it tight (a matrix + the resolution list + overlays), consistent with the file's existing
table-driven style.
`Satisfies:` D1, D2, D3 (resolution + ask-when-ambiguous + unattended auto-branch)

### Step 2 — Wire team-lead Pre-Flight to the canonical guard
**File:** `plugins/nexus/agents/team-lead.md` (Operations → Pre-Flight, current #1–2)
- Replace the current #1 (Dirty tree) and #2 (Branch) with a single **"Branch guard"** kept as
  **#1** that applies the canonical rule from Step 1: resolve the default branch, then run the
  branch-state matrix (ask on default / ask on unrelated / silent on match), with the dirty-tree
  overlay folded **into** it (no separate #2). Keep the existing "offer to isolate (new branch or
  worktree)" wording for the dirty case.
- **Numbering (binding):** the sequence becomes `0, 1 (branch guard), 3, 4, 4b, 5, 6, 7` — **no #2**,
  and **renumber nothing below**. Do **not** close the 1→3 gap by shifting 3/4/4b/5/6/7 down: `4b` is
  cross-referenced from elsewhere in the file (team-lead.md:101 "see Pre-Flight 4b") and from this
  plan's Steps 2–3, so a renumber silently breaks those pointers. (HIGH-1.)
- **Run-order vs the idempotency gate #0 (binding):** the branch guard runs **only on the clean-start
  path**. Pre-Flight **#0** already routes an interrupted run (`communication-log.md` without
  `summary.md`) to the **Resume** flow *before* #1 executes. State in the agent text that an
  interrupted run takes the Resume branch-check (team-lead.md:378–383) and **skips the launch guard
  entirely** — the guard sits *after* the #0 fork. This prevents a double-fire via the #0 route, not
  just via the Resume block directly. (HIGH-2.)
- At Pre-Flight **4b** (the existing `.claude/nexus-agents.json` read), add **both** `defaultBranch`
  **and** `autoPush` to the keys read there (one pre-flight read, cached for closure — Step 3 uses the
  captured `autoPush` value, no second read), same "missing key → default applies, never ask" posture
  as model/effort. (HIGH-3 — keeps the two keys symmetric and makes the Data Model "both read at 4b"
  claim true.)
- **Additive-edit discipline (ADR-30):** edit the unattended fork additively and leave existing
  **attended** wording byte-unchanged *except* where this plan explicitly replaces it (the #1–#2
  collapse). The new unattended branch behavior (auto-branch from default) sits alongside the existing
  unattended bullets (spec gate, dirty-tree abort), consistent with them. (MEDIUM-1.)
**Acceptance:** Pre-Flight #1 contains the resolution + on-default ask + unrelated ask + a reference
to the canonical rule + the #0/Resume skip note; 4b lists both `defaultBranch` and `autoPush`; the
`[UNATTENDED]` fork creates `{slug}` from default; numbering is `0,1,3,4,4b,5,6,7` (grep: no `#2`);
no change to the Resume block.
`Satisfies:` D1, D2, D3
**Confidence: medium** — read the current Pre-Flight block (team-lead.md:195–209) before editing; the
numbering and 4b cross-references are the rework hazard.

### Step 3 — Add the push gate to team-lead Commit Protocol
**File:** `plugins/nexus/agents/team-lead.md` (Commit Protocol section)
After the final feature commit, add a **push gate**:
- **Attended:** ask "push? (remote / branch)" — do not push without confirmation. (Matches the global
  "commit or push only when the user asks" posture.)
- **Unattended:** **never push** unless `autoPush: true` (the value captured at Pre-Flight 4b in
  Step 2 — reference it, don't re-read the config at closure); default is no push (pushing is
  outward-facing and effectively one-way).
- **Hardened guard mode** already blocks `git push` at the hook layer (README / `guard.js`) — the gate
  must defer to it (don't instruct a push the guard will reject; surface that instead).
- State explicitly that **merge-to-main is NOT part of closure** — it is deferred to the PR-tail
  feature, and is sequenced *after* a PR review, not at commit time. (Prevents the done-check from
  expecting a merge step, and records the deliberate omission.)
**Acceptance:** Commit Protocol contains the attended push-ask, the unattended `autoPush`-gated
default, the hardened-mode deferral, and the explicit "merge-to-main out of scope" note.
`Satisfies:` D5

### Step 4 — Add a lightweight branch guard + push gate to solo
**File:** `plugins/nexus/agents/solo.md` (Workflow section)
- Add a pre-flight branch step at the **start** of the Workflow (before/within step 1 "Understand")
  that applies the canonical guard from Step 1 — lightweight: resolve the default branch, then the
  matrix. Solo is interactive (no `[UNATTENDED]` orchestration of its own), so the attended column
  governs; keep it to a couple of lines and reference the canonical rule rather than restating it.
- Add a **light push gate**: solo's commits are user-driven (it has no team-lead commit protocol), so
  the gate is simply "before pushing, ask" — solo never pushes unprompted. Place it in the Workflow's
  Document/closure step.
- Keep solo's lightweight character — reference `agents-workflow` for the algorithm, don't inline the
  matrix.
**Acceptance:** solo Workflow contains a pre-flight branch step referencing the canonical guard and a
"ask before push" line; no full matrix duplicated in solo.
`Satisfies:` D4, D5

### Step 5 — Regenerate commands
**File (generated):** `plugins/nexus/commands/team-lead.md`, `plugins/nexus/commands/solo.md`
Run `node scripts/gen-commands.mjs nexus` so the generated command docs reflect the agent edits in
Steps 2–4. Do not hand-edit the command files.
**Acceptance:** `git diff` shows the command files regenerated to match the agents; no manual edits.
**Note:** the `selfcheck.mjs` gen-commands check is git-HEAD-based and produces a known false-positive
at a developer's pre-commit stop (it compares against HEAD before the team-lead commits) — this is
expected and resolves at the team-lead commit; do not bounce on it (see lessons).

### Step 6 — Version bump + release
**Files:** `plugins/nexus/plugin.json`, `plugins/nexus/CHANGELOG.md` (via the skill)
Follow `release-plugin` (PATCH default — a shipped-file change reaches users via the version-keyed
cache; PATCH is correct unless the owner escalates). The bump must ride **in the same commit** as the
edits (CLAUDE.md release rule). After the bump, the omni twin is regenerated (`gen-omni.mjs`) and
committed in `../omni` with the mirrored-subject convention (CLAUDE.md "Generated artifacts") — this
is team-lead/owner follow-through, noted here so it isn't dropped.
**Acceptance:** `plugin.json` version incremented; CHANGELOG has an entry naming the branch-guard +
push-gate change; bump is in the feature commit.
`Satisfies:` ADR-9 release flow

## Cross-Service Changes

None.

## Migration Notes

None. The two new config keys are optional and backward-compatible (absent → documented defaults).

## Testing Strategy

No new runtime code, so acceptance is verification-by-inspection plus the existing gates:
- **Grep acceptance** per step (the section/keywords above) — the done-check is grep-and-confirm.
- **`scripts/selfcheck.mjs`** + `tests/lint/*` pass (note the gen-commands HEAD false-positive above).
- **`attended-unchanged.golden.test.mjs` is unaffected** — it exercises hook scripts (`verify-gate`,
  `pipeline-gate`, `guard`) + `hooks.json`, not agent/rule markdown, so it cannot fail from this
  change. Treat it as a **negative control** confirming no hook surface moved — not as proof of
  additivity (the real additivity gate is the grep checks + the ADR-30 byte-unchanged discipline in
  Steps 2–4).
- **Manual sanity** (optional): describe-don't-run — on `main`, the team-lead should now ask; on a
  slug-named branch, proceed silently.

## KB Impact

None — `docs/kb/` carries product/domain rules, not plugin-internal workflow. (The behavior is
documented in the agent files themselves, which is the source of truth for the pipeline.)

## Open Questions

None blocking. **Deferred (separate feature, next session):** the PR + AI-assisted-review +
merge-to-main pipeline tail — audit `/code-review --comment`, `gh pr review`, and the reviewer's
`review.md` shape first, then design how the existing reviewer output is projected onto a PR for
human curation. Out of scope for this plan by decision.

## Plan Review

Code-grounded critic review (Mode 2, ad-hoc — cross-referenced D1–D5 and verified every file-claim
against live source). **Verdict: GO-with-fixes.** No CRITICAL; no factual errors (all 11 load-bearing
claims about team-lead.md / solo.md / agents-workflow.md / guard.js verified accurate). Three HIGH +
one fetch-gap, all localized prose fixes folded in — no re-planning:

| Finding | Fix folded into |
|---|---|
| HIGH-1 — #1+#2 collapse left the renumbering mechanism unspecified | Step 2: binding numbering `0,1,3,4,4b,5,6,7`, no #2, renumber nothing |
| HIGH-2 — guard's interaction with the #0 idempotency→Resume *route* (not just the Resume block) unaddressed | Step 2: guard runs only on the clean-start path, after #0; interrupted runs skip it |
| HIGH-3 — `autoPush` had no read-site; contradicted the Data Model "both read at 4b" claim | Step 2: read both keys at 4b; Step 3: use the 4b-captured value |
| Gap — stale-default `git fetch` handling (original premise "hardened blocks remote fetches" was false — `guard.js:138-144` blocks `git push`/installs/`curl|wget`, **not** `git fetch`; and agents have no runtime signal for the guard mode) | Step 1: fetch is unconditionally best-effort — warn-and-skip on any failure, never block |
| MEDIUM-1 — ADR-30 additive discipline not stated for the reworded attended paths | Step 2: edit additively, attended wording byte-unchanged except the #1–#2 collapse |
| MEDIUM-2 — golden-test claim overstated (it covers hooks, not markdown) | Testing Strategy: reframed as a negative control |

LOW-1 (command-file list) self-corrects via the `git diff` acceptance — no change needed. Critic
agentId `a77086e85d74fc135`.
