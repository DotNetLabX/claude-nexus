# Lessons — adhoc-ArchitectDecisionDisclosure

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] externally-sourced-recommendation vocabulary grounding (grep the structure's usage in the live file first) → architect.md tech-spec anchor grounding. Concurrent staging/scoped-bump practice → team-lead.md Pre-Flight 2 evidence.

## Architect Lessons

- **An externally-sourced recommendation names a concept, not this repo's structure — transplanting
  its vocabulary literally into a plan step creates unsatisfiable acceptance.** The research verdict
  said "surface 'Decisions taken: N' at the checkpoint report"; the plan wired it into "the
  Checkpoint Report when reporting Phase-2 completion" — a structure that does not exist in
  architect.md (the usage list covers Phase-1 outputs and verdicts only), making the `grep -c ≥ 2`
  acceptance unsatisfiable without mutating a shared placeholder (critic HIGH). Before wiring
  anything into a named artifact structure, grep that structure's usage list in the live file —
  even when the plan already cites the file elsewhere.
- **Two gates sharing one criterion phrase is an ambiguity generator.** The disclosure bar reused
  "hard to reverse" both as the row-earning trigger and as the ask-first (one-way door) trigger, so
  one call could match both rules (critic MEDIUM). When a new rule borrows an existing lens (ADR-25),
  split the thresholds explicitly — the borrowed lens's axis must map to exactly one outcome per
  band (two-way door → disclose; one-way door → ask).
- **Dogfooding the mechanism in its own plan surfaced design questions before the critic did.**
  Writing this plan's `## Decisions` section forced the row-shape calls (where open items live,
  severity level, explicit-None sentence) to be made explicitly at authoring time — and gave the
  code-grounded critic a well-formed instance to verify against instead of an abstract spec.
- **A `grep -A{n}` acceptance is window-fragile — assert tokens on one line instead.** Step 3's
  original `grep -A2` check would pass or fail on the implementer's line-wrapping choice, not the
  content (critic MEDIUM). Acceptance lines should name tokens co-located on a single greppable line
  (`## Decisions` + `MEDIUM` + `predate`), never depend on a context-window size.
- **All-deterministic-grep acceptance makes the done-check a re-run, not a re-judgment — and that
  is the win.** Every Step 1–3 acceptance line was a self-contained grep I re-ran against the live
  staged files in one pass; no reading-and-judging, no ambiguity. When a prose-only pass writes each
  acceptance as its exact grep target, the done-check is deterministic and fast. Keep authoring
  acceptance this way for agent-doc/skill-prose passes.
- **Pre-authorizing the team-lead/operator-owed closure action in Step-4 acceptance turns a
  would-be escalation into a one-line `Deviated (valid reason)`.** The developer correctly stopped
  staged-ready (commit + omni-sync are closure actions), and because Step-4 acceptance already said
  the omni twin "is not grep-verifiable from this repo … the done-check must not expect to observe
  it here," the deferral resolved in one line instead of a missing-step Fail. Same for the
  `--staged` bump scoping under a concurrent dirty plugin. Continue naming the closure-owned arm and
  the sanctioned scoping variant up front.

## Reviewer Lessons
- **A plan's narrative resolution of a critic finding (e.g. "single home, no Phase-2 report") is
  worth re-verifying against the live file, not trusting the plan/implementation.md self-report.**
  Grepped `Checkpoint Report Format`'s actual usage list in architect.md myself rather than
  accepting the plan's claim at face value — it held up, but the check was cheap (one grep + read)
  relative to the cost of a design-origin defect slipping through on trust.
- **A developer's technical justification for a script-scoping choice (`--staged --minor` to avoid
  sweeping a concurrent dirty plugin into the bump) is a testable claim, not a narrative to accept.**
  Reading `bump-plugin.mjs`'s actual filter logic (10 lines) and cross-checking the concurrent
  plugin's live porcelain status + version took under a minute and turned a plausible-sounding
  mitigation into a verified one.
- **New finding types introduced into an established artifact section (here: the architect's
  "plan-hygiene finding" written into `## Step 1 — Done-Check`) can outpace the format skill that
  defines that section, when the plan's Scope deliberately excludes the format skill from its file
  list.** Not a defect in this pass (additive prose fits without conflict), but worth flagging as a
  documentation-consistency gap for whichever pass next touches `review-format`.

## Developer Lessons
- **`bump-plugin.mjs --minor`/`--major` escalates EVERY changed plugin in the working tree, not just
  the feature's.** The override tier (script lines 166-173) is applied to every plugin whose shipped
  files are dirty. In a shared tree with a concurrent feature (here: 28 dirty `nexus-dotnet` files from
  adhoc-DotnetFeedbackApply), a whole-tree `--minor` would have bumped nexus-dotnet too — hijacking that
  feature's release version. **Fix: stage only your plugin's files and run `--minor --staged`** — the
  `--staged` path (script lines 80-86) classifies staged paths only, skipping unstaged + untracked. Then
  stage the resulting bump/CHANGELOG/regenerated-commands (also unstaged after the tool writes them).
  This operationalizes the "scope staging under concurrent run" rule at the bump layer specifically.
- **`gen-commands.mjs {plugin}` rewrites ALL command files but is deterministic** — after editing 2 of
  N agents, it re-emits all N commands; only the genuinely-changed ones differ from HEAD (the rest are
  byte-identical, no git diff). Verify with `git status --porcelain -- plugins/{plugin}/commands/` and
  stage only the changed command files, so the feature commit doesn't carry no-op command churn.
- **A concurrent pipeline can stage its OWN files into the shared index mid-fix-cycle — not just
  leave them dirty.** Between the initial Step 4 run and this fix-cycle's re-stage, `git diff --cached`
  picked up 28 `nexus-dotnet` files + 6 `adhoc-DotnetFeedbackApply` delivery docs that I never `git add`-ed
  (I only ever staged my own named files, each time). Confirmed via `git reflog`/`git branch` that HEAD and
  branch hadn't moved — it was an index-only overlap from the other feature's own `git add`, not a rebase
  or checkout. **Re-verify `git diff --cached --name-only` scoped to your own files right before every
  re-stage in a fix cycle**, not just once at the start — the "recheck under concurrent run" discipline
  applies per fix-cycle round, not only per pipeline run. Never unstage another process's files to "clean
  up" — that risks destroying a concurrent commit-in-progress; escalate via Carry-Over instead and let the
  team lead scope its own commit (pathspec-limited, not a bare `git commit` against the current index).
