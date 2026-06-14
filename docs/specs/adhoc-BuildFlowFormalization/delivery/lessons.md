# Build-Flow Formalization — Lessons

## Architect Lessons

- **A "formalize the flow" pass is overwhelmingly definitional, not code.** The research had already
  *decided* most items (§8); the plan's real risk was scope creep (R6 harness) and collision with the
  systems it consumes (P1/P2/P3) — not implementation difficulty. The four Phase-1 questions that mattered
  were all scope/ownership forks, not technical unknowns. Right call to surface them before planning rather
  than guess.

- **The hard constraint "consume, don't redefine" needs a *greppable* acceptance, not just a prose vow.**
  Step 1's acceptance includes "references P1/P2 by name AND copies no schema fields" as an explicit check.
  A reviewer can't catch a silent restatement of P2's schema from a prose "we reference P2" claim — the
  grep makes the boundary checkable.

- **Eating the dog food clarified two decisions.** (Q4) New ADRs land PROPOSED because the flow we're
  defining says the owner ratifies — and ADR-24 already set that precedent in the same register. (Step 2)
  The tech-spec *is* the "technical feature → tech-spec + extracted ADRs" example the R4 ADR prescribes.
  When a pass defines a process, applying that process to the pass's own artifacts resolves framing questions
  for free.

- **Shared-file edit races are avoidable by ownership, not ordering.** Both this pass and `adhoc-ResearchKB`
  conceptually touch research. Rather than impose a hard sequence, the plan assigns `research-before-asking.md`
  recall-edits to P2 and keeps this pass to *referencing* the P1 rule in the flow ADR — so neither edits a
  file the other owns. No ordering dependency, no race.

- **Optional-additive conventions must say "where present", never "every X must".** R5's `Satisfies: AC-n`
  could retro-fail every existing plan if written as a hard done-check gate. The plan binds it as
  optional/where-present and forbids the blanket-mandate phrasing — a recurring trap when adding a new
  annotation to an existing artifact format.

### Done-check lessons (Step 1, 2026-06-14)

- **A plan-time "this surface is currently absent" grep pays off at done-check.** Step 6 added a
  tech-spec-ownership line to `architect.md` and a spec-seed line to `po.md` — both verified *absent*
  when I wrote the plan. At done-check, re-grepping confirmed they now exist: absence→presence is a
  clean binary disposition, far easier than judging "did they edit the right paragraph." Recording the
  plan-time absence in the step acceptance made the done-check a one-grep confirmation.

- **Greppable hard-constraint acceptance turned a judgment call into a check.** The "consume P1/P2,
  don't restate" constraint could have been an unfalsifiable prose vow. Because Step 1's acceptance
  required *both* "references by name" *and* "restates no schema," the done-check was two greps + one
  context read of ADR-26 — not a subjective read of the whole register. The developer even put the
  no-restatement promise in the ADR's Rejected-alternatives, which is itself checkable.

- **The skill-invocations log cleanly disambiguated a sanctioned dry-run from a skipped step.** Step 7
  (`release-plugin`) is dry-run-only by Q5, yet still must *invoke* the skill — and it does, logged
  under the round token. Pairing the log check with `git status` (no developer commit; staged 1.8.3
  untouched) confirmed the dry-run was real and ADR-18 honored, not a quietly-skipped release.
  "Deviated (valid reason)" is the right disposition; the open bump stays surfaced as operator-owed,
  not absorbed into a silent PASS.

- **Round-scope the skill log by the `.pipeline-state` token, not by timestamp.** The log carried
  entries across three sessions; filtering to `token=developer:implement, session=19e36d5c` isolated
  *this* developer run from a prior unrelated `release-plugin`/`learner` cluster. Reading the token
  first is what made the conformance check honest.

## Developer Lessons

- **Phase-1 analysis caught a release-base collision the plan couldn't have anticipated.** Step 7 says
  "bump MINOR", but the working tree already has an un-committed `1.8.3` (GateNegationFix) staged. Because
  `bump-plugin.mjs` reads the *working-tree* `plugin.json` as its base, a `--minor` run lands `1.9.0`, not
  `1.8.4` — and two unrelated releases end up co-staged. The lesson: for any release-bump step, verify the
  *current committed vs working-tree* version before assuming the bump's output; a staged-but-uncommitted
  prior release silently shifts the base. Surfaced as Q5 (dry-run-first, team lead reconciles the commit).

- **A "definitional" pass is still fully verifiable at Phase 1 — every acceptance grep maps to on-disk
  reality.** All seven steps' targets were confirmable before writing a line: `architect.md` has no
  `tech-spec`/`Satisfies` yet (Step 5/6 greps will pass after edits), `po.md` has no `ratified`/`spec seed`
  yet (Step 6), `docs/backlog.md` genuinely doesn't exist while team-lead.md references it at :46/:158/:253
  (Step 4 premise correct), `proposal-format/` is greenfield (Step 3), and `skill-lint.mjs` is present
  (Step 3 gate). No plan-vs-source drift found.

### Phase 2 (implement)

- **Two plan instructions can lightly tension; satisfy BOTH rather than pick one.** Q4 said mirror
  ADR-24's banner *verbatim* (`PROPOSED (owner ratifies)`, parens), but Step 1's acceptance grep is the
  em-dash literal `PROPOSED — owner ratifies`. A naive "verbatim banner" satisfies Q4 but the acceptance
  grep finds only the Contents entries (6 hits, none on the ADR bodies). The fix: keep the parenthetical
  `>` banner (verbatim ADR-24) AND add the em-dash phrase to each ADR heading. Both instructions honored,
  grep finds every new ADR (11 hits). When an acceptance check and a style instruction disagree on a
  literal string, the check wins on *findability* and the style instruction wins on *shape* — do both.

- **In the plugin *dev* repo, `improve-skills`'s "route shipped-skill fixes to the feedback file" channel
  does NOT apply.** That channel is for *consuming* projects (the cache is read-only there). Here the
  plugin repo IS the source of truth (ADR-1), so a new shipped skill (`proposal-format`) is authored
  directly in `plugins/nexus/skills/` and the same skill's lint is the done-condition. Recorded the
  rationale in `## Skills Used` so the done-check doesn't read the direct authoring as a channel violation.

- **`bump-plugin.mjs --dry-run` exit 0 confirmed the Q5 prediction exactly** — base `1.8.3` (the staged
  GateNegationFix release), MINOR → `1.9.0`, and the reasons list even surfaced the *pre-existing* staged
  `pipeline-gate.js` ("hook behavior/enforcement change") which is NOT from this pass. A dry-run is cheap
  and disambiguates "what would this bump do, given the messy working tree" without touching anything.

- **Pre-existing test failures must be isolated from the pass, with proof.** `tests/lint/frontmatter.test.mjs`
  fails on a `nexus-dotnet` skill's `disable-model-invocation` key — confirmed pre-existing (`git show HEAD:`
  has the key; the file isn't in my git status). Captured as a low-severity Carry-Over so the reviewer
  doesn't burn a cycle re-investigating a failure the pass didn't cause. The nexus lint tests (frontmatter,
  skill-refs, format-skill-refs, wiring, command-backing) all pass.

### Fix Cycle 1 (2026-06-14)

- **A "convention" expressed across a skill + an ADR + a doc must reconcile in ONE canonical home, with
  the others pointing at it.** The Impact-optional contradiction (FIX 2) existed only in the
  `proposal-format` skill's front-matter comment, but the cleanest fix wasn't just deleting the comment —
  it was stating the *reconciling rule* (omit-Impact ⇒ the master-gate one-ADR-line path, not a backlog
  row) in the skill (canonical per ADR-4) and mirroring a single clause into the backlog-lifecycle ADR
  (ADR-29). ADR-28 needed nothing because it never claimed Impact-optional. Lesson: before editing N
  files for a cross-file contradiction, find which file *owns* the rule and which merely need a pointer —
  don't restate the rule in all of them (that re-creates the drift you're fixing).

- **When a fix references an ADR's "path/option", verify that path exists verbatim first.** FIX 2's rule
  leans on the master-gate "one ADR line" path; I confirmed ADR-25:666 says exactly "collapses to its
  lightest artifact (a line) or skips" before pointing the skill at it. A fix that invents an ADR clause
  that isn't there is its own new finding.

- **A schema gap (FIX 1) is fixed by adding the column, not rewording the consumers.** The fix-list
  explicitly preferred adding a `Spec` column over rewording po.md's "link the spec", because po.md
  genuinely needed a *home* for the link. Adding the structural slot and then making every consumer
  ("link the spec" lines) point at it is more durable than rewording each consumer to avoid mentioning a
  missing column.

- **Don't hand-edit generated artifacts even when grep flags them as stale.** After editing
  `agents/po.md`, grep showed `commands/po.md:54` still carrying the old "link the spec" text. The
  command file is generated by `gen-commands.mjs` (CLAUDE.md: don't hand-edit) and its regen is already
  team-lead-owned in the OPERATOR ACTION REQUIRED note — editing it directly would create a source/
  generated divergence the next regen silently overwrites. Edit the source, leave the generated file.

## Skill Gaps
- None new. `proposal-format` is created by this pass (Step 3) via `improve-skills`, closing the gap that
  proposals had no format skill (the ADR-4 sibling to `kb-entry-schema`).

## Reviewer Lessons

- **The pipeline-gate can block an APPROVED review.md edit that contains legitimate mentions of severity words in non-finding contexts.** The gate scans for `CRITICAL|HIGH` + `APPROVED` and must not trigger on: negation lines ("No findings at severity CRITICAL or severity HIGH"), LEGEND/table-header lines (starting with `|`), or `**Confidence:**` fields. Always simulate the gate logic against the draft content before writing to avoid a wasted blocked edit. The gate's `approvedWithOpenHighSev` function is in `plugins/nexus/hooks/scripts/pipeline-gate.js:111`.

- **For an all-Markdown documentation pass, the review evidence table must collect its own fresh build evidence.** There is no compile step for documentation, so "build" evidence means: skill-lint on every modified skill, structural lint tests, and plugin validate. Enumerate these checks explicitly rather than leaving the evidence row empty — a thin Evidence table fails the "no approval without fresh output" requirement even when the artifact type has no compiler.

- **Greppable acceptance criteria in the plan are the reviewer's best friend.** The plan's Step 1 acceptance block included exact grep commands for every content unit. Running those greps verbatim at review time gives hard evidence without requiring subjective reading of the full ADR register. Future plans should continue this pattern for documentation-heavy passes.

- **On a fix-cycle re-review, sweep adjacent call sites for every fixed file, not just the changed lines.** FIX 1 touched both `backlog.md` and `po.md` — verifying them independently and confirming their language matched caught potential inconsistency. FIX 2 touched both `proposal-format/SKILL.md` and `ADR-29` — checking that the ADR clause matched the skill rule confirmed the one-authoritative-source discipline held after the fix. Sweeping both sides of a cross-file fix is what makes a re-review meaningful rather than a rubber-stamp.

## Team Lead Lessons

- **Spawn labels must be phase-AGNOSTIC — the label is bound at spawn and a `SendMessage` resume cannot rename it.** The owner watched the FleetView row stay `Architect Phase 1 analyze` while that same agent went analyze → plan → done-check (and the developer analyze → implement → fix). This is the documented "stale task-notification labels" caveat, but the team-lead Message Templates still implicitly bake the phase into the `description`. **Improvement proposal (fold into team-lead.md Message Templates):** spawn `description` convention = `"{Role} · {slug}"` (e.g. `Architect · adhoc-BuildFlowFormalization`), never `"{Role} Phase 1 analyze"`. The phase lives in the `.pipeline-state` token + the comm-log header, not the immutable label. Applied to the reviewer/Codex/fix-developer spawns this run; existing agents could not be relabeled.

- **Every background agent stranded its deliverable behind a lifecycle closer (ADR-12) — and the `.output` transcripts were 0 bytes this run, so `salvage-transcript` could not recover.** Architect/developer were recoverable from their artifacts (questions.md/plan.md/implementation.md); the **critic has no artifact by design** (no Write tool), so its detailed findings were genuinely unrecoverable — recovery order ran all the way to step 4 (re-ask) and the platform still truncated `TaskOutput` to the final line. The ACCEPT verdict was read consistently x4 and is reliable; the body is not. **Improvement proposal:** when transcripts are empty AND the agent owns no artifact, the only durable record is what the team lead writes — so persist the verdict + an explicit "detail unrecoverable (platform)" note (done in review-critic.md), and never fabricate the missing findings. Consider giving the critic a *findings-file* convention (team-lead-owned path it dictates) so a future run has an artifact to fall back on.

- **Standard+Codex earned its keep on an all-Markdown pass — against my own prior.** I flagged Codex as low-leverage for documentation at launch, and the owner chose it anyway. The per-file nexus reviewer APPROVED (its single-file greps were sound); Codex's independent pass caught **three real cross-file coherence gaps** the per-file checks structurally couldn't see (Impact-optional vs backlog-ranking; spec-link referenced but absent from the schema; a backlog row pointing at a non-existent file). One Codex finding (P1/P2 "schema restatement") was an over-read and was refuted finding-by-finding. **Lesson:** the value of the independent cross-check is *cross-file interaction* defects, not severity duplication — and that value is not limited to code. Refine the "when to recommend Standard+Codex" guidance to include multi-file documentation/process changes with consistency invariants across files.

- **Model overrides do not survive a `SendMessage` resume (developer frontmatter=sonnet, pinned=opus).** Honored the owner's opus pin by re-spawning the developer FRESH on opus for Phase 2 AND for the fix cycle, with an explicit handoff (Phase-1/implementation state lives in plan.md/questions.md/implementation.md, so little is lost). The resume-keeps-context tradeoff was acceptable because the state was fully captured in artifacts. Agents whose model is NOT pinned (architect, reviewer) were resumed normally — frontmatter == intended model, no downgrade.
