# F2-AdhocIsSoloOnly — Implementation

## Files Modified

- `plugins/nexus/rules/agents-workflow.md` — Step 1 (4 anchored edits, plan-exact):
  - Line 11: `adhoc-{Name}` slug bullet annotated `(**solo-only** — see the Lane rule below)`.
  - After line 15: new **Lane rule (ADR-58)** paragraph inserted verbatim (quoted from ADR-58's
    Decision), the canonical home for the rule that all 8 agent files and role-specific edits
    point back to.
  - Line 30 (pre-edit numbering; line 32 post-edit): "Ad-hoc work has no `definition/` folder"
    sentence gets a backref `(solo-only lane — Lane rule above).`
  - Line 237 (pre-edit numbering, persona/entry-point table): `be architect` row's "ad-hoc
    analysis" example reworded to "one-off analysis" — reserves the term "ad-hoc" for the lane.
- `plugins/nexus/agents/team-lead.md`, `po.md`, `architect.md`, `developer.md`, `reviewer.md`,
  `critic.md`, `learner.md`, `solo.md` (all 8) — Step 2: the shared compact "Slug / paths / caps"
  reference block's slug line annotated identically:
  `` `adhoc-{Name}` (solo-only — Lane rule, agents-workflow) `` inserted between `adhoc-{Name}` and
  `` `BUG-{N}-{name}` ``. Verified byte-identical across all 8 (`grep -rh ... | sort -u` → exactly
  one distinct line).
- `plugins/nexus/agents/po.md` — Step 3: new sentence appended to `## Slug Assignment` (after the
  existing slug-proposal paragraph): work the PO shapes is never `adhoc-*`, always a feature/tracker
  slug, and the PO adds/updates the `docs/backlog.md` row (when that file exists) whatever the
  source. The "when that file exists" qualifier was added in the Self-Review fold pass (finding 2
  below) to match ADR-58/agents-workflow's Lane rule text exactly.
- `plugins/nexus/agents/architect.md` — Step 3: the `## Feature Spec Workflow` exception block's
  intro reworded from "ad-hoc / refactoring passes have no `spec.md`" framing to "a technical
  feature's ADR-collapsed definition (ADR-25/27)" framing (scoped to *may* collapse — the full
  tech-spec form remains valid, per Self-Review finding 3); new first bullet added — a **Guard
  (ADR-58, Lane rule)**: an `adhoc-*` slug arriving for planning gets **stopped and handed back**
  to the team lead/PO to re-slug (next free `F{N}` + backlog row) before Phase 1 proceeds — the
  architect never self-assigns a slug (Self-Review finding 1, folded — the first draft had the
  architect assigning the slug itself, contradicting its own never-derive-slug rule). The five
  original bullets (spec-exists gate, ADR-vs-triage cross-check, re-verify-aged-findings, critic
  Mode 2, technical-branch tech-spec ownership) are unchanged, kept verbatim in substance per the
  plan. Boy-scout fix (same file, same pass): the `Satisfies:` cross-check's "ADR unit for an
  ad-hoc pass" phrase (line ~299, outside the plan's anchor range) reworded to "ADR unit for a
  technical feature" for internal consistency with the reworded exception above it.
- `plugins/nexus/agents/team-lead.md` — Step 3: the Launch Path Selection decision tree's two
  separate `Ad-hoc with existing plan` / `Ad-hoc without plan` branches collapsed into one
  reconciled `Non-backlog work (no backlog row yet)` sub-tree (PO/architect-shaped work → assign
  `F{N}` + backlog row, re-slug if it arrived as `adhoc-*`; solo-scoped work → `adhoc-{Name}`,
  route to solo) — matches the plan's target sub-tree sketch exactly. The Entry-point rule
  paragraph immediately below the tree got one appended sentence pointing at the Lane rule.
- `plugins/nexus/agents/solo.md` — Step 3: new paragraph inserted after the compact slug/paths/caps
  block, before `## Message Footer`: solo owns the `adhoc-*` lane end-to-end; hands off to
  team-lead/PO for a feature slug when work outgrows solo scope. Phrasing caution honored — this
  paragraph does **not** contain the literal string `solo-only — Lane rule` (verified: that phrase
  still counts exactly 1 in solo.md, from the Step-2 edit only).
- `plugins/nexus/commands/architect.md`, `critic.md`, `developer.md`, `learner.md`, `po.md`,
  `reviewer.md`, `solo.md`, `team-lead.md` (all 8) — Step 4: regenerated via
  `node scripts/gen-commands.mjs nexus`; no hand edits. `git diff --stat` confirms the mirrored
  edits land in each file with byte-for-byte matching content to the source agent file.
- `plugins/nexus/.claude-plugin/plugin.json` — Step 5: version bumped `1.31.1` → `1.32.0` (MINOR,
  owner-escalated) via `node scripts/bump-plugin.mjs --minor`.
- `plugins/nexus/CHANGELOG.md` — Step 5: new `[1.32.0]` entry; the tool's generic reason-stub lines
  replaced with a real description of the Lane rule change (see file for full text).

## Key Decisions

- The Lane rule paragraph (agents-workflow.md line 17) is the plan-specified text verbatim — it
  matches ADR-58's Decision paragraph in `docs/architecture/README.md` almost word-for-word (the
  plan quotes it faithfully; I re-quoted the plan's exact wording rather than re-deriving from the
  ADR, since the plan had already reconciled the two).
- No implementation choices beyond the plan were needed — all 5 steps had exact line anchors, exact
  target text, and exact accept-criteria greps, and every one matched on the first attempt (the
  critic's "12 line anchors exact" claim held under direct re-verification during implementation).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)` — 4 anchored prose edits in agents-workflow.md |
| 2 | None | plan: `Skill: (none)` — 1 identical line ×8 agent files |
| 3 | None | plan: `Skill: (none)` — role-specific prose edits, 4 files |
| 4 | None | plan: `Skill: (none)` — mechanical regen via `gen-commands.mjs`, no authored content |
| 5 | `nexus:release-plugin` | Followed exactly: dry-run classify → owner-escalated `--minor` bump → CHANGELOG stub replaced with real description → `claude plugin validate --strict` → tests. Stopped before commit per dispatch rule 1 (team lead owns the commit). |

## Carry-Over Findings

None outstanding — all 3 real findings from the review (below) were folded into the diff during
this implementation round; nothing is left for the architect/reviewer to chase.

## Deviations from Plan

- None structural. One documentation-quality improvement beyond the plan's letter: the plan's Step
  5 only said "CHANGELOG entry describes the lane rule" — I replaced the tool-generated generic
  reason-stub with a full itemized description of every file touched, matching the level of detail
  the CHANGELOG's own prior entries (1.31.0, 1.31.1) carry. Not a deviation from intent, just more
  complete than the minimum bar.
- **omni twin regeneration deferred** (plan Step 5 guard, established F1 Step-6 precedent): the
  working tree carries concurrent-session dirt (`docs/architecture/README.md`, `docs/backlog.md`
  modified; `docs/research/**` added/removed; `docs/specs/F1-NotesPlugin/**` untracked — all
  pre-existing, none touched by this feature). `gen-omni.mjs --check` correctly reports drift as
  **expected mid-feature** (selfcheck: "Genuine drift only if this persists after the closure
  commit"). **OPERATOR ACTION REQUIRED:** run `node scripts/gen-omni.mjs` after the F2 closure
  commit lands (and after any concurrent session's commit lands, per CLAUDE.md's per-repo omni
  commit-message convention), then `node scripts/gen-omni.mjs --check` to confirm sync, per
  `plugins/nexus/skills/release-plugin/SKILL.md` step 5.
- **Known noise, did not chase:** dispatch rule 7 flagged `scripts/selfcheck.mjs`'s gen-commands
  check as expected to false-positive while agent edits are uncommitted. In this run it in fact
  **passed** (`[PASS] gen-commands drift — nexus: in sync`) because Step 4's regen ran before
  selfcheck — the noise is conditional on regen timing, not unconditional (see lessons.md). The
  one selfcheck failure that did occur (`gen-omni --check`) is the expected/deferred item above,
  not chased.
- **Unrelated-dirt exclusion respected:** `git status` before and after implementation confirms
  none of the excluded files (`docs/research/**`, `docs/specs/F1-NotesPlugin/**`,
  `docs/architecture/README.md`, `docs/backlog.md`, F2's own `plan.md`/`review-critic.md`) were
  touched by this round — all pre-existing modifications belong to a concurrent session (no
  `review-critic.md` was actually present in the delivery folder at any point).

## Self-Review

**Verdict: PASS** — diff is docs/rules-only (agent prose + one shared rules file, no runtime
source), all 5 plan steps' accept-grep criteria hold in the final state, 510/510 tests pass,
`claude plugin validate --strict` passes, and 3 real findings surfaced by review were folded with
verified fixes (0 outstanding).

**Process (dispatch hard rule 4).** Two parallel `general-purpose` finder passes were spawned
(`f2-finder-a`, `f2-finder-b`) over the content diff, each independently instructed to run the
5-angle set: internal consistency; dangling cross-references; dropped/narrowed guarantees;
directional references vs. final layout; stale adjacent sentences. Finder A never returned a
report within the session despite 5 check-ins over the implementation window — disclosing this
per the developer's sanctioned in-context fallback (used when a spawned check doesn't return):
its angles were covered by my own manual pass below instead. Finder B's findings reached me via
an architect relay message mid-session (the coordinator forwarded them) — evaluated and folded
below; no duplicate findings from finder A to dedupe against (it never reported).

**Findings folded (from finder B, verified in-context before applying):**

| # | Severity | Finding | Verification | Disposition |
|---|----------|---------|---------------|--------------|
| 1 | MEDIUM | `architect.md`'s new re-slug guard told the architect to itself "assign the next free `F{N}` and add the `docs/backlog.md` row" — contradicts the architect's own compact-reference rule ("assigned by the team lead or PO... never derive it") and team-lead.md's ownership of slug assignment. | Re-read `architect.md`'s own Slug line (`never derive it`) and `team-lead.md`'s decision tree (team lead/PO assigns `F{N}` + backlog row) — confirmed the contradiction was real, not a false positive. | **Fixed** — reworded to "stop and hand back — the team lead/PO re-slugs... You never self-assign a slug"; added a standalone-mode clause (ask the user to confirm, same as any assignment). Re-verified `grep -n "re-slug" architect.md` still hits and Step 2's convergence count is unaffected (guard text doesn't touch the shared slug line). |
| 2 | LOW | `po.md`'s new Slug Assignment sentence said the PO "adds (or updates) the `docs/backlog.md` row when the slug is confirmed" with no existence qualifier — reads as an unconditional row-add, diverging from ADR-58/agents-workflow's "recorded as a row... **when that file exists**." | Re-read agents-workflow.md's Lane rule paragraph (line 17) — confirmed the qualifier is load-bearing there and was dropped in the po.md paraphrase. | **Fixed** — inserted `(when that file exists)` into the po.md sentence, matching the canonical wording. |
| 3 | LOW | `architect.md`'s exception intro said "A technical feature... collapses its definition to the ADR register" as if universal — but the same file's own "Technical-branch definition checkpoint" section (lines 140-157) documents that a technical feature can also carry a full tech-spec (ADR-27), with ADR-collapse being the two-way-door case (ADR-25) specifically. | Re-read lines 137-157 of the same file (the tech-spec + extracted ADRs paragraph, the ADR-25 two-way-door sentence) — confirmed the universality claim was inaccurate self-contradiction within the same file. | **Fixed** — reworded to "**may** collapse its definition... under the two-way-door gate (ADR-25)... the full tech-spec form (ADR-27) remains valid when the change warrants it." |

**My own manual 5-angle pass (covering finder A's un-returned scope, plus a fresh check of finder B's areas):**

- **Angle A (internal consistency):** Lane rule wording in agents-workflow.md, po.md, architect.md
  (post-fix), team-lead.md, and solo.md all agree: PO-shaped/architect-designed work = feature;
  `adhoc-*` = solo-only; re-slug on outgrow. No contradictions found post-fold.
- **Angle B (dangling cross-references):** every "Lane rule" / "agents-workflow" pointer (8 agent
  slug lines + architect.md guard + team-lead.md Entry-point sentence + agents-workflow.md's own
  two self-references) resolves to the real paragraph at agents-workflow.md:17. No dangling refs.
- **Angle C (dropped/narrowed guarantees):** confirmed architect.md's five original exception
  bullets are all still present verbatim after the intro reword (spec-exists gate, ADR-vs-triage,
  re-verify-aged, critic Mode-2, tech-spec ownership) — none dropped. team-lead.md's tree
  collapse preserves both prior guarantees ("plan exists → Developer" and "spec exists → Architect,
  do NOT spawn PO") via the retained Entry-point rule paragraph immediately below the tree — the
  "do NOT spawn PO" phrase itself moved from the tree to the (unchanged) paragraph, not lost.
- **Angle D (directional references vs. final layout):** agents-workflow.md line 11 says "Lane
  rule below" — the paragraph is at line 17, below ✓. Line 32 says "Lane rule above" — paragraph
  is at line 17, above ✓. team-lead.md's collapsed tree box-drawing verified structurally valid:
  `├── Backlog feature` (not last, correct prefix) then `└── Non-backlog work` (last, correct
  prefix); within it `├── needs PO shaping...` (not last, `│` continuation on its wrapped line)
  then `└── solo-scoped...` (last).
- **Angle E (stale adjacent sentences):** found and fixed one real instance myself before finder B's
  relay arrived — `architect.md:299`'s `Satisfies:` cross-check said "an ADR unit for an ad-hoc
  pass," stale terminology in the very file whose Step-3 edit (lines 131-132) had just reworded the
  same concept to "technical feature." Fixed as a boy-scout in-file consistency pass (see Files
  Modified). Full-file greps for `ad-hoc|ad hoc` across all 8 agent files turned up two categories
  of non-issues, confirmed as false positives: (a) `team-lead.md:231` "Use ad-hoc complexity to
  recommend" — ordinary English usage (case-by-case), unrelated to the slug lane; (b) the "Ad-hoc:
  `delivery/` only" bullet repeated in all 8 agents' compact Paths line — a true statement about
  folder structure, not slug ownership, correctly left untouched (Step 2 only scoped the Slug
  line, per the plan's Decision #2 on keeping the compact blocks lean).

**Post-fold re-verification:** all Step 1-3 accept-grep criteria re-run and green; Step 4 regen
re-run (`gen-commands.mjs nexus`) after both the boy-scout fix and the 3 folded findings; full
test suite re-run (510/510 pass); `claude plugin validate --strict` re-run (pass); `selfcheck.mjs`
re-run (4/5, same expected/deferred omni-twin drift, nothing new).

*Status: COMPLETE — developer, 2026-07-12.*
