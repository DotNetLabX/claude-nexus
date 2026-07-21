# F5-SkillGapCapture — Lessons

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED-PRIOR] `git add -A` close-time ban — already shipped in team-lead.md Commit Protocol + architect.md fast-lane close (staging+cached-diff as one act); this run's incident is the measured evidence. [APPLIED] zero-hit grep exit-code trap → create-implementation-plan harden-patterns. [TRACKED] executed-at-plan-time extended to quantitative prose claims + denominator rule (1 occurrence). [TRACKED] verify-the-critic's-correction (1 occurrence — promote at 2nd per its own proposal). [ROUTED-TO-BACKLOG] `edit-shipped-agent-file` gap corroborates backlog F24.

## Architect Lessons

- **A count you reasoned to is not a fact, and it fails silently.** This plan made **three** counting
  errors, and the pattern was perfectly clean: *everything I executed held; everything I reasoned to was
  wrong.* The code-grounded critic tried hard to break the executed claims — 14/14 Accept baselines,
  4/4 phrasing citations, every `file:line` across 6 files, the ADR-register check, both script
  behaviours — and could not break one. It broke every unexecuted count: "2 of 4" (my grep matched only
  cells *starting* with "Log", missing `F1-NotesPlugin`'s "No scaffold skill… — log to lessons.md"),
  "~41%" (the global rate across 54 lessons files, misattributed to solo — whose real corpus is 1-of-54),
  "six anchors" (seven — both the critic and I missed `commands/developer.md`, the generated mirror; my
  own re-run caught it). The existing rule *"every pinned acceptance command is executed at plan time"*
  already protects Accept blocks — **the hole is that the plan's Context/justification statistics get no
  such rule, and those are exactly what lands in the permanent ADR register.** ADR-59 nearly shipped
  carrying "2 of 4".
- **Verify the critic's *correction*, not just its *catch*.** The critic correctly killed my "2 of 4" —
  then replaced it with "6 of 13", which was **also wrong**. Only re-running the enumeration myself found
  the truth (4-of-11 directed, plus ≥6 undirected). A correction arrives wearing the authority of a
  finding, which is precisely what makes it easy to paste in unverified. `adhoc-PipelineTrustRules`
  established *"don't trust a fact you didn't verify"*; this run shows the rule has a **blind spot at the
  critic boundary** — a reviewer's replacement value is a fact you didn't verify.
- **When two careful greps of the same field return two different answers, the field is the defect — not
  the grep.** The instinct was to arbitrate between my narrow matcher and the critic's broad one. The
  right move was to ask *why the field resisted counting*: the plan template's `Gap?` column had **five
  incompatible vocabularies** across 33 plans (gap text, explicit non-gaps, `high`/`medium` confidence,
  `Owner: operator`, bare `yes`/`no`). The disagreement **was** the finding — and it changed the design
  (Step 5 gained a two-value vocabulary, which also makes the post-ship check a single grep instead of a
  hand-judged enumeration). A measurement that two competent readers cannot reproduce is a design signal.
- **The code-grounded review mandate paid again — including on a docs-only diff.** All 4 HIGHs were
  things only source-reading finds: `## Skill Gaps` sitting *inside* a fenced block (so both candidate
  implementations passed the gates, one shipping broken markdown that `skill-lint` cannot detect); a gate
  reading `grep -c "Skill Gaps" → ≥1` on a file with a *second, unrelated* match at `:131`, so it stayed
  green on the exact deletion it existed to prevent. A doc-only critic finds none of these. Strengthens
  the existing mandate; no change proposed.
- **A done-check finding on my own artifact is still mine to disclose, not to absorb.** The developer
  surfaced that the plan-pinned template drops the ill-fitting case's "what didn't fit" sub-field rather
  than silently implementing around it — correct behavior. It is a defect in *my plan*, not the
  implementation, so it cannot Fail the developer; but the verdict being binary does not make the risk
  disclosure binary. Recorded in `review.md` and surfaced to the owner as an open decision.

- **`git add -A` at lane close is unsafe in a multi-agent tree — and my own dispatch-time snapshot gave
  me false confidence.** I built the developer's unrelated-dirt exclusion list from a `git status` at
  dispatch (clean), re-checked `git status` again before writing `summary.md` (still only F5's 15
  entries), then ran `git add -A` — which swept in **two files that appeared in the minutes between**:
  `docs/proposals/mine-machinery-hardening-2026-07.md` (a **Draft** awaiting owner decision) and
  `docs/research/2026-07-15-mine-family-vs-vwh-machinery.md`, both another session's in-flight mine-family
  work. Caught only because I read `git log -1 --stat` after committing; recovered with
  `reset --soft` + `restore --staged` + re-commit (19 files, F5 only; the foreign files returned to
  untracked, untouched). **The status check and the staging command must be the same act** — a snapshot
  taken even one tool-call earlier is stale in a concurrent tree. CLAUDE.md already warns that "a
  concurrent feature's in-flight files contaminate the classification" **for the bump**; this run shows
  the identical hazard applies to **the commit**, where nothing checks it at all. Committing a Draft
  proposal under another feature's slug would have misattributed someone else's un-ratified work.

### Improvement Proposal
**Target:** `plugins/nexus/agents/architect.md` — Architect-Led Fast Lane → Close; and
`plugins/nexus/agents/team-lead.md` — Commit Protocol
**Change:** Forbid `git add -A` / `git add .` at close. Stage the **explicit file list the plan names**
(`git add <paths>`), or re-run `git status --porcelain` **in the same command** as the staging and abort
on any path outside the plan's scope. CLAUDE.md's existing concurrent-tree warning covers `bump-plugin`'s
classification but nothing guards the commit itself — the same contamination silently lands foreign files
in a feature's commit.
**Evidence:** [F5-SkillGapCapture]
**Priority:** high — measured this run: a Draft proposal + a research doc from a concurrent session were
committed under F5's slug and needed a `reset --soft` to unpick.

### Improvement Proposal
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` — Plan Grounding & Deviation Rules
**Change:** Extend *"Every pinned acceptance command is executed at plan time… never asserted from
memory"* beyond Accept blocks to **every quantitative claim in the plan's prose** (Context, Scope,
justification statistics) — the numbers that motivate the work and get copied into an ADR. Add the
counting-rule corollary: when a plan cites a rate over a corpus, state the **denominator's selection
rule** and the **population**, because a count without them is unreproducible (measured: "2 of 4" vs
"6 of 13" vs the true 4-of-11 from the same column; and a 41% global rate misread as one role's rate).
**Evidence:** [F5-SkillGapCapture]
**Priority:** high — a wrong justification statistic is permanent once it reaches the ADR register.

### Improvement Proposal
**Target:** `plugins/nexus/agents/architect.md` — the critic-review fold-in step (Phase 2, step 12)
**Change:** State that folding a critic finding means **verifying its replacement value, not just
accepting its catch**. A critic that correctly identifies a wrong number may supply another wrong one;
re-run the measurement before writing it into an artifact. Extends `adhoc-PipelineTrustRules`' "don't
trust a fact you didn't verify" across the reviewer boundary, where the finding's authority makes
unverified acceptance most likely.
**Evidence:** [F5-SkillGapCapture]
**Priority:** medium — recurrence unknown (1 run); promote at the 2-occurrence threshold.

## Developer Lessons

- **The dogfood worked — filling in the Step-1 template while doing the gap it describes was easy, not
  awkward.** All five fields (`Kind`, `Searched for`, `Why it would help`, `References`, `Evidence`)
  mapped cleanly onto what actually happened during Steps 2–4: `Kind: missing` was an immediate,
  unambiguous call (there is no candidate skill to call "ill-fitting" here — the search came back empty,
  not mismatched); `References` was trivial to fill because the three touched files (`architect.md`,
  `solo.md`, `developer.md`) *are* the reference set. The one field that took a moment of thought was
  `Why it would help` — distinguishing "what it would cover" from "what I did instead" is a genuinely
  useful two-part prompt, since the second half is exactly what a plan step's `None` disposition + inline
  detail already produces, and restating it here made the gap's shape concrete instead of a vague "no
  skill for this."
- **`grep -c` on a zero-match pattern exits 1, not 0 — chain accept-greps individually or with `|| true`,
  never with `&&`.** Mid-session I chained five accept greps with `&&` in one Bash call; the first
  (correctly) returned `0` matches, which is `grep`'s exit code 1, which killed the rest of the chain
  silently (only the first grep's output printed, no error surfaced beyond the tool's own "Exit code 1").
  Not itself a defect in this plan or its skills, but worth naming: a `→ 0` acceptance line pairs badly
  with `&&`-chained verification — run each grep as its own command, or append `; true`.
- **The critic's pre-executed, code-grounded Accept blocks made this the fastest 8-step doc-only
  implementation in recent memory to verify.** Every grep target, expected count, and "was N" baseline
  in the plan was correct on first execution — zero surprises, zero re-reads of the plan to re-derive an
  expected value. This is the plan-quality signal `plan-review-mode` / the critic's Mode 2 pass is meant
  to produce, and it showed up as a real time saving during implementation, not just a review-time one.

## Skill Gaps

### edit-shipped-agent-file
- **Kind:** missing
- **Searched for:** a skill covering the structural pattern for editing a shipped agent file
  (`plugins/nexus/agents/*.md`) in this dev repo — placement of a new obligation within an existing
  agent's section structure, how to phrase a "trigger" sentence that binds reliably (the
  `developer.md:158`/`architect.md` pattern this feature itself analyzes), and how a fresh obligation
  should reference a skill's template instead of restating it.
- **Why it would help:** it would cover the recipe for "add or slim an agent-file obligation without
  breaking its trigger shape or its cross-references" — including the anti-pattern this plan explicitly
  guarded against (Step 4's gate: a step deleted outright but a co-located unrelated match keeps a loose
  `grep -c ≥1` gate green). What I did instead: read the target agent file's existing section structure
  by hand each time (Steps 2–4), matched its existing prose voice and trigger-sentence shape
  (`**Log skill gaps**`-style bold lead + destination + reference), and cross-checked each edit against
  the plan's own pinned Accept greps rather than a skill's checklist.
- **References:** `plugins/nexus/agents/architect.md` (`## After Every Review Cycle`),
  `plugins/nexus/agents/solo.md` (new `## Lessons` section + frontmatter), `plugins/nexus/agents/developer.md`
  (`:158` trigger slim) — the three edited agent files; `plugins/nexus/skills/improve-skills/SKILL.md`
  (confirmed scope: covers shipped *skills* via the dev-repo carve-out, not agent files) and
  `plugins/nexus/skills/improve-flow/SKILL.md` description (confirmed scope: learner-only, CLAUDE.md /
  `docs/conventions/` — also not agent files).
- **Evidence:** [F5-SkillGapCapture]
