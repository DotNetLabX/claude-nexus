# PR + AI-Review Tail (v1)

**Feature Spec:** `docs/specs/adhoc-PRReviewTail/definition/tech-spec.md` (technical-branch tech-spec, ADR-27 — the binding cross-check is the ADR register, not a product `spec.md`)

## Context

The pipeline's tail stops at a controlled push (the just-shipped push gate, `adhoc-BranchPreflightGuard`,
release 1.16.2). This pass adds the **opt-in tail after push**: open a PR → post the AI review **first**
→ hand to one human who curates (accept/edit/dismiss) and controls the merge. The model is **"AI goes
first, human curates"**; the human owns the merge (a one-way action).

**Re-grounded against live source (2026-06-21 — the prerequisite shipped since the tech-spec was written):**
- The push gate **shipped**. `team-lead.md` Commit Protocol now ends with a `**Push gate (after the final
  feature commit)**` subsection whose last bullet is *"Merge-to-main is NOT part of closure… deferred to
  the separate PR-tail feature… sequenced after a PR review."* **The tail attaches right after that
  subsection, and that note stays true** (merge lives in the tail, after PR review — not at commit closure).
- `{defaultBranch}` resolution now lives canonically in `agents-workflow.md` →
  `## Branch Pre-Flight & Default-Branch Resolution` (`origin/HEAD` → config `defaultBranch` → `main`).
  The tail **references** it; it does **not** re-derive the default branch.
- Pre-Flight **4b** already does one `.claude/nexus-agents.json` read capturing model/effort +
  `defaultBranch`/`autoPush`. The tail's three keys are appended to **that same read**.
- The projection source is live as the tech-spec claims: `review.md` carries `## Step 2 — Code Review`
  with `### [SEVERITY]` findings, `**File:** path:line`, and `## Verdict: APPROVED | REQUEST CHANGES | COMMENT`
  (verified in `review-format` skill + the push-gate `review.md`).

**The design stance — reuse, don't rebuild.** Default = *project* the pipeline's own `review.md` (one
coherent review, no reconciliation, no second reviewer). The independent fresh-eyes pass + true inline
comments are reserved for an **opt-in** hand-off to `/code-review` — which the team-lead **suggests, never
runs** (it is user-triggered and billed; the model cannot launch it).

Impacted plugin: `nexus` (the team-lead agent doc + the always-on `agents-workflow` rule). Dev-repo change
→ needs a version bump (`release-plugin`) in the same commit. **Release tier: MINOR** (owner decision,
2026-06-21 — a new opt-in capability).

## Scope

**In scope (v1 — owner-resolved forks D1–D4 in the tech-spec)**
- A canonical **Host-Adapter & PR-Tail** rule in `agents-workflow.md` (ADR-36 seam): adapter surface
  (open-PR / post-review / view-PR / merge), `gh`-only, host capability resolved first, attended-only.
- Team-lead Commit Protocol: an opt-in **PR Tail** subsection after the Push gate — open PR → project
  `review.md` as a single PR review body → STOP → human curates + controls merge.
- Three optional `.claude/nexus-agents.json` keys read at the existing Pre-Flight 4b: `prTail` (bool,
  default false), `prDraft` (bool, default false), `prReviewMode` (`project` default | `independent` | `both`).
- An Unattended-Mode bullet recording the tail is unreachable unattended (fail-closed).
- ADR-35/36 extraction + tech-spec → `Ready` (architect graduation, post-critic — see *Graduation*).
- Command regeneration + version bump (MINOR).

**Out of scope (roadmap — named in the tech-spec, NOT planned here)**
- Native **inline** projection of `review.md` via `gh api .../reviews` with a `comments[]` array (v1
  reserves inline for the opt-in `/code-review` pass).
- Unattended PR-open/review-post behind an `autoPR` flag.
- A `guard.js` hardened-mode hook block for `gh` outward ops (v1 defers the tail in **prose**; the hook
  block is roadmap — `gh` is genuinely unguarded by hardened mode today).
- A solo-lane tail (solo produces no `review.md`).
- Curation loop-back to the learner; non-GitHub host adapters.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Canonical Host-Adapter & PR-Tail rule: adapter surface, host-capability gate, attended-only posture | |
| 2 | (none) | — | no | Pre-Flight 4b: append `prTail`/`prDraft`/`prReviewMode` to the existing one-read capture | |
| 3 | (none) | — | no | PR-Tail subsection A: gate + open PR + project review FIRST + opt-in independent pass | |
| 4 | (none) | — | no | PR-Tail subsection B: STOP + human curates + human-controlled merge | |
| 5 | (none) | — | no | Unattended-Mode bullet: tail unreachable unattended | |
| 6 | (none) | — | no | `node scripts/gen-commands.mjs nexus` (regenerate commands) | |
| 7 | release-plugin | Follow | no | MINOR bump + CHANGELOG, same commit; omni twin follow-through | |

All editing steps are `Skill: None` — an agent-doc / rules-prose pass with no pattern skill (the documented
all-`None` shape, same as the push-gate plan). `TDD: no` throughout: the deliverable is instruction prose,
not runtime behavior; acceptance is **grep-checkable presence** + the lint/selfcheck gate + the unchanged
golden test (a negative control proving no hook surface moved). Step 7 follows `release-plugin` for the
version bump (ADR-9 release flow).

## Domain Model Changes

None — documentation/instruction change only.

## Data Model Changes

Three optional keys appended to the existing `.claude/nexus-agents.json` config contract (read once at
team-lead Pre-Flight 4b alongside `defaultBranch`/`autoPush`; absent file/keys fall back to defaults —
never required, never asked):
- `prTail`: bool (default `false`) — the attended opt-in default for whether the tail runs.
- `prDraft`: bool (default `false`) — open the PR as a draft (`gh pr create --draft`).
- `prReviewMode`: `project` (default) | `independent` | `both` — `project` posts `review.md` only;
  `independent`/`both` also offer the `/code-review` hand-off.

## Implementation Steps

### Step 1 — Add the canonical Host-Adapter & PR-Tail rule to `agents-workflow.md`
**File:** `plugins/nexus/rules/agents-workflow.md`
Add a new section (suggested title **"Host Adapter & PR Tail"**) — placement is the developer's call;
the natural home is right after `## Branch Pre-Flight & Default-Branch Resolution` (its closure-side
companion: both are git/host-boundary rules that team-lead references). Both team-lead and solo load this
always-on rule, so the canonical definition lives here once and team-lead references it (the existing
"canonical in agents-workflow" pattern). The section defines, once:

- **Host-adapter surface (ADR-36):** the outward PR operations — **open-PR / post-review / view-PR /
  merge** — route through a named adapter seam. The **only adapter shipped is `gh` (GitHub).** State that
  this is a documented concept, not code (one adapter in v1) — what stops `gh`/GitHub being hard-wired
  into the agent prose, and the seam a future GitLab/Gitea/Azure adapter slots into.
- **Host capability resolved FIRST:** before any adapter call, confirm the origin is a **GitHub remote**
  **and** `gh` is **installed + authed** (e.g. origin URL matches `github.com`; `gh auth status` succeeds).
  Absent → the tail is **unavailable** and **silently skipped** — never an error, never a hard step; the
  pipeline closes at push exactly as today. (Mirrors the branch guard's best-effort, host-aware posture.)
- **Attended-only / unattended-unreachable / hardened-skip (state once):** the tail runs **attended
  only**; under `[UNATTENDED]` it is **unreachable** (fail-closed, ADR-32 — curation + the one-way merge
  need a human); hardened guard mode **skips** it (prose deferral, mirroring the push gate — note `gh` is
  not actually blocked by `guard.js`, so this is a convention, not an enforcement, in v1).
- A pointer that `{defaultBranch}` for PR base comes from `## Branch Pre-Flight & Default-Branch
  Resolution` — **do not re-derive it here.**

Keep it tight and consistent with the file's table-driven style; do not inline `gh` command recipes here
(those live in the team-lead tail subsection).
**Acceptance (grep-and-confirm):** a new `Host Adapter & PR Tail` heading exists; the section names the
four adapter ops (open-PR / post-review / view-PR / merge), the `gh`-only adapter, a host-capability check
(`gh auth status` / `github.com` origin → else **silently skipped**), the **attended-only / unattended-
unreachable / hardened-skip** posture, and a pointer to `## Branch Pre-Flight & Default-Branch Resolution`
for `{defaultBranch}`. Grep tokens: `Host Adapter & PR Tail`, `gh auth status`, `silently skipped`.
`Satisfies:` AC-0.2, AC-0.3, AC-4.1

### Step 2 — Append the three `prTail` keys to team-lead Pre-Flight 4b
**File:** `plugins/nexus/agents/team-lead.md` (Pre-Flight **4b**, the existing `.claude/nexus-agents.json` read)
Pre-Flight 4b already reads the config **once** for model/effort and (from the push gate) captures
`defaultBranch` + `autoPush`. In that **same one read**, also capture the three top-level tail keys:
`prTail` (bool, default `false`), `prDraft` (bool, default `false`), `prReviewMode` (`project` default |
`independent` | `both`). Same posture as the existing keys: **missing key → its default applies, never
ask.** Cache them for closure (the PR-Tail subsection in Steps 3–4 references these captured values; do
**not** re-read the config at closure).
- **Additive-edit discipline (ADR-30):** extend the 4b bullet additively — leave the model/effort and
  `defaultBranch`/`autoPush` wording byte-unchanged; append the three keys to the same capture sentence.
**Acceptance:** 4b lists `prTail`, `prDraft`, `prReviewMode` with their defaults, in the same read as
`defaultBranch`/`autoPush`; no second config read introduced.
`Satisfies:` AC-4.2
**Confidence: medium** — read the current 4b bullet first (it was just rewritten by the push gate); the
hazard is duplicating the read or disturbing the existing capture.

### Step 3 — PR-Tail subsection (A): gate + open PR + post the AI review FIRST
**File:** `plugins/nexus/agents/team-lead.md` (Commit Protocol — insert a new **PR Tail** subsection
**immediately after** the existing `**Push gate (after the final feature commit)**` subsection; leave that
subsection — including its "Merge-to-main is NOT part of closure" note — **byte-unchanged**; the tail is
where merge now lives, after PR review, so that note stays true.)
Add the opt-in, attended-only, host-gated tail. Apply the canonical rule from Step 1 (host capability
resolved first; reference it, don't restate the posture). Flow:

- **Gate (additive guarantee):** the tail runs only **after a successful push** (it depends on a pushed
  branch — if nothing was pushed, it does not run). It is **OFF by default**: attended, the team-lead
  **asks** whether to open a PR unless `prTail: true` pre-sets the answer. With the tail off, host
  unavailable, or declined → the pipeline closes at push **exactly as today** (no change to any pre-push path).
- **Open the PR (idempotent):** `gh pr view` first — if a PR already exists for the branch, **reuse it,
  never open a duplicate**. Otherwise `gh pr create --base {defaultBranch} --head {branch} --fill`
  (title/body from the feature commits + slug), adding `--draft` when `prDraft: true`. `{defaultBranch}`
  comes from the canonical Branch Pre-Flight rule (Step 1 pointer).
- **Post the AI review FIRST — default `prReviewMode: project`:** section-read the reviewer's
  `## Step 2 — Code Review` section from `docs/specs/{slug}/delivery/review.md` and post it as a **single
  PR review body** via `gh pr review --comment --body-file <file>` (write the section to a temp body file
  or pipe via `--body-file -`). **Use `--comment` deliberately — NOT `--approve`/`--request-changes`:**
  GitHub forbids approving or requesting-changes on **your own** PR, so the event is always `--comment`
  and the **verdict** (`APPROVED | REQUEST CHANGES | COMMENT`) + per-finding **severity + `file:line`**
  ride in the **body** so the human can navigate. This is **projection, not re-review** — no second
  reviewer, no reconciliation. (MEDIUM/LOW findings + `## Open Questions` may lack `file:line`; they post
  in the body, not inline — inline is the opt-in pass's job.)
- **Opt-in independent pass (`prReviewMode: independent | both`):** the team-lead **suggests** a hand-off
  to **`/code-review ultra`** (or `/code-review --comment`) for fresh eyes + true inline comments — and
  **states it does not run it itself** (user-triggered + billed; the model cannot launch it). It does
  **not** replace the projected review; both appear on the PR, clearly labeled, and **reconciliation is
  the human's** (no automated merge of the two). Note `ultra` needs a claude.ai account.
- **AI goes first:** the review is posted **before** the human curates; the tail then continues to Step 4
  (STOP + hand-off).
**Acceptance:** the PR Tail subsection sits after (and leaves unchanged) the Push gate subsection; contains
the after-push + opt-in/OFF-by-default gate, the `gh pr view` idempotency check, the `gh pr create --base
{defaultBranch} --head {branch} --fill` (+ `--draft` on `prDraft`) open, the `gh pr review --comment
--body-file` projection of the `## Step 2 — Code Review` section with the explicit **"--comment, not
self-approve"** rationale and "verdict + severity + file:line in the body", and the **suggest-not-run**
`/code-review ultra` opt-in. Grep: `gh pr review --comment`, `gh pr view`, `code-review ultra`.
`Satisfies:` AC-0.1, AC-0.4, AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-2.2, AC-2.3, AC-2.4

### Step 4 — PR-Tail subsection (B): STOP + human curates + human-controlled merge
**File:** `plugins/nexus/agents/team-lead.md` (same **PR Tail** subsection, continuing after Step 3's content)
After posting the review, the tail **STOPS** and hands off:
- **Hand to one human:** "PR #N opened, AI review posted — review the code + the AI review, curate
  (accept / edit / dismiss), and merge when ready." The pipeline's automated work **ends here.**
- **No custom curation surface:** curation uses **native** GitHub / `gh` UX (resolve/dismiss review
  comments, approve/request-changes). The tail builds nothing here.
- **Merge is human-controlled (the one-way action):** the team-lead **never auto-merges.** It executes
  `gh pr merge` (`--squash | --merge | --rebase`, `--delete-branch` per the user) **only on explicit user
  instruction**, sequenced **after** the human review — **never at commit closure**. Unattended never
  merges (Step 5). This is consistent with the existing Push-gate "merge-to-main is NOT part of closure"
  note — merge lives **here**, in the tail, after PR review.
**Acceptance:** the subsection contains the explicit STOP + single-human hand-off, the native-UX curation
statement, and the human-controlled `gh pr merge` (only on explicit instruction, after review, never
auto, never at closure). Grep: `gh pr merge`, `never auto-merge` (or equivalent), `STOP`.
`Satisfies:` AC-3.1, AC-3.2, AC-3.3, AC-3.4

### Step 5 — Record the tail is unreachable unattended (Unattended Mode)
**File:** `plugins/nexus/agents/team-lead.md` (the **Unattended Mode** list — where the push gate added its
`Branch guard (#1)` bullet)
Add one bullet to the Unattended Mode list, symmetric with the existing unattended bullets: **"PR tail:
unreachable in v1 — no PR open, no review post, no merge"** (fail-closed, ADR-32; curation + the one-way
merge need a human). This makes the safety property discoverable in the unattended path, not buried in the
Commit Protocol. Additive only — leave the surrounding bullets byte-unchanged.
**Acceptance:** the Unattended Mode list contains a "PR tail unreachable" bullet citing fail-closed.
`Satisfies:` AC-0.3

### Step 6 — Regenerate commands
**File (generated):** `plugins/nexus/commands/team-lead.md`
Run `node scripts/gen-commands.mjs nexus` so the generated command doc reflects the team-lead agent edits
in Steps 2–5. Do not hand-edit the command file.
**Acceptance:** `git diff` shows `commands/team-lead.md` regenerated to match `agents/team-lead.md`; no
manual edits.
**Note:** the `selfcheck.mjs` gen-commands check is git-HEAD-based and produces a known false-positive at a
developer's pre-commit stop (it compares against HEAD before the team-lead commits) — expected, resolves at
the team-lead commit; do not bounce on it (push-gate lesson).

### Step 7 — Version bump + release
**Files:** `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` (via the skill)
Follow `release-plugin` with a **MINOR** bump (owner decision — a new opt-in capability;
`bump-plugin.mjs --minor`). The bump must ride **in the same commit** as the edits (CLAUDE.md release rule).
After the bump, the omni twin is regenerated (`gen-omni.mjs`) and committed in `../omni` with the
mirrored-subject convention (CLAUDE.md "Generated artifacts") — team-lead/owner follow-through, noted here
so it isn't dropped. **Sequencing:** the omni footer pins the nexus impl SHA, so if the architect's ADR
extraction (see *Graduation*) lands as a **separate** `docs` commit, sequence it **before** the omni sync
(or fold it into the feature commit) so the pinned SHA includes the register edit (per the "finalize
artifacts before the omni sync" team-lead lesson).
**Acceptance:** `plugin.json` minor version incremented; CHANGELOG has an entry naming the PR-tail
capability + the three config keys; the bump rides in the **same commit as the plugin edits** (CLAUDE.md
release rule — this is about the bump↔edits pairing, independent of where the README ADR edit is grouped).
`Satisfies:` AC-4.3 (release flow), ADR-9

## Graduation (ADR extraction — architect-owned, post-critic, NOT a developer step)

Per ADR-27/28 the architect graduates the tech-spec: after the code-grounded critic passes this plan,
the architect:
- **(a) Extracts ADR-35 and ADR-36 verbatim** from the tech-spec's *ADRs to extract* section into
  `docs/architecture/README.md` as **`## ADR-N` body entries**, appended after ADR-34 (never re-author —
  the tech-spec drafted them as complete one-decision records).
- **(b) Adds the ADR-35/36 index lines** to the register's contents block (after `README.md:52`, the
  ADR-34 line), in the register's index form — `- ADR-N — {title} *(Accepted — adhoc-PRReviewTail, {date})*`.
  The index line has **no draft in the tech-spec** (its *ADRs to extract* section drafts only the body
  form), so it is authored at extraction time; "verbatim" applies to the body, not the index line.
- **(c) Flips the tech-spec Status to `Ready`** with a note that the ADRs are extracted.

These are doc edits the architect owns (the tech-spec and the ADR register), not plugin source — so they
are **not** developer numbered steps. **Commit grouping is the team-lead's call:** the README.md edit may
ride in the feature `feat` commit (the older ADR pattern — e.g. `808604c`) **or** land as a separate
`docs(adhoc-PRReviewTail): extract ADR-35/36…` commit (the ADR-34 pattern — `49a864f` extracted ADR-34 in
a standalone `docs` commit, *not* its feature commit). The precedent is genuinely mixed; do not treat
either grouping as mandated.

## Cross-Service Changes

None.

## Migration Notes

None. The three new config keys are optional and backward-compatible (absent → documented defaults).

## Testing Strategy

No new runtime code, so acceptance is verification-by-inspection plus the existing gates:
- **Grep acceptance** per step (the section/keywords above) — the done-check is grep-and-confirm.
- **`scripts/selfcheck.mjs`** + `tests/lint/*` pass (note the gen-commands HEAD false-positive above).
- **`attended-unchanged.golden.test.mjs` is unaffected** — it exercises hook scripts + `hooks.json`, not
  agent/rule markdown, so it cannot fail from this change. Treat it as a **negative control** confirming no
  hook surface moved — not as proof of additivity (the real additivity gate is the grep checks + the
  ADR-30 byte-unchanged discipline in Steps 2–5).
- **No live `gh` calls are exercised** — v1 ships prose only; the `gh` commands are instructions the
  team-lead runs at closure, not code under test.

## KB Impact

None — `docs/kb/` carries product/domain rules, not plugin-internal workflow. The behavior is documented in
the agent file + the `agents-workflow` rule (the source of truth for the pipeline). The research that
grounds this plan already lives at `docs/kb/research/gh-pr-review-capabilities.md`.

## Open Questions

None blocking. The four design forks (D1–D4) were owner-resolved in the tech-spec; the release tier (MINOR)
was owner-resolved 2026-06-21. The single enforcement soft-spot — hardened mode does not actually block
`gh`, so "hardened skips the tail" is prose-only in v1 — is an **accepted, documented** tradeoff (ADR-35),
with the `guard.js` hook block named on the roadmap.

## Plan Review

Code-grounded critic review (Mode 2, ad-hoc — cross-referenced all 18 ACs against plan steps and verified
every file-claim against live source). **Verdict: GO-with-fixes.** No CRITICAL/HIGH. **18/18 ACs covered**
(no orphaned AC, no orphaned step). Every load-bearing live-source claim verified TRUE: the Push-gate
subsection + "merge-to-main not at closure" note (`team-lead.md:355/359`), the 4b one-read capture
(`:205`), the Unattended-Mode list (`:411`), the `## Branch Pre-Flight & Default-Branch Resolution` rule
(`agents-workflow.md:34`), the `review.md` projection shape (`review-format:11/116/124`), and that
`guard.js:138–144` blocks `git push` but **not** `gh` (so the prose-only hardened deferral is honest).
The `--comment`-not-self-approve rationale, the suggest-not-run `/code-review`, and the `gh pr view`
idempotency all confirmed sound. Two MEDIUM + one LOW, all in the architect-owned *Graduation*/release
prose (none block developer Steps 1–7), folded in:

| Finding | Fix folded into |
|---|---|
| H1 (MED) — mis-cited ADR-34 as precedent for folding the README edit into the feature commit; ADR-34 was a *separate* `docs` commit (`49a864f`), precedent is mixed | *Graduation*: commit-grouping is the team-lead's call; both patterns cited correctly |
| M1 (MED) — register has an index-line surface (`README.md:45–52`) the tech-spec doesn't draft; "verbatim extraction" would add body entries only | *Graduation* (b): authored index lines added at extraction time in the register's index form |
| L1 (LOW) — omni footer pins the impl SHA; a separate README `docs` commit could predate it | Step 7: sequence the extraction before the omni sync (or fold into the feature commit) |
| Advisory — Step 1 acceptance was read-and-judge (new section, no grep anchor) | Step 1: added grep tokens (`Host Adapter & PR Tail`, `gh auth status`, `silently skipped`) |

Critic agentId `a2327b58b58f8dc4b`. ADR-35/36 confirmed coherent single-decision records (ADR-35 = tail
policy; ADR-36 = gh-only host-adapter seam; no overlap).
