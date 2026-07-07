# Skill Estate Consolidation — Lessons

## Architect Lessons
- **A critic's "checked clean" fact can go stale between review and Phase-1.** The plan's Plan Review note
  recorded "ADR-50 free — checked clean", but ADR-50 was Accepted 2026-07-05 (before the 2026-07-07 plan) —
  the critic's check was already wrong when written. Developer Phase-1 caught it (Q1). Lesson: an
  ADR-number allocation is a live-register fact; re-grep the register at Phase-1 rather than trusting a
  review note, and pin ADR references to `file:line` so staleness is greppable. When a Phase-1 answer
  corrects a review claim, annotate the review record (don't silently diverge) so the plan stays internally
  consistent.
- **Vacuous-grep acceptance recurs even after a critic raises the exact bug (F1).** Step 9's §14 gate
  targeted a literal string (`What exists: 13 project-local skills`) that is markdown-bolded in the live
  file (`**What exists:**`), so it matched 0 both before and after — the same class F1 was folded to fix,
  re-introduced two steps away. Lesson: for any "claim removed" gate, the acceptance must be a regex proven
  to be **1 before / 0 after** against the live text at plan time — a literal-string grep against
  potentially-formatted prose is the trap. Grep the live file when writing the acceptance, not from memory
  of the claim's wording.
- **Owner-chosen worktree isolation satisfies a `= main` precondition in spirit — record it as a sanctioned
  variant.** F7 literally required `git branch --show-current = main`; the owner provisioned a dedicated
  clean worktree cut from main instead (stronger isolation). Rather than leave the literal check to fail at
  done-check, amend the precondition to name the worktree as the sanctioned isolation, converting a
  would-be deviation into a one-line pre-sanctioned resolution.
- **The log-based skill-conformance gate is inapplicable in a worktree with no audit hooks — don't Fail for
  an absent log.** This dedicated worktree's `.claude/settings.json` wires no hooks, so
  `.claude/audit/skill-invocations.log` was never going to exist. An absent log here is an environment gap,
  not a fabrication or a missed invocation. At done-check, first confirm whether the hook is active
  (`grep skill-tracker .claude/`, check for `.claude/audit/`) before treating a missing log as a
  conformance failure; when inactive, fall back to the documented secondary (`## Skills Used`) and
  corroborate it with deterministic artifact greps. Record the fallback explicitly so the reviewer knows
  the primary gate was unavailable.
- **On a two-part release step (developer edits + team-lead commit/gen-omni), the correct done-check
  disposition is Deviated (valid reason), not Missing.** Commit and gen-omni are team-lead-owned by the
  developer-never-commits hard rule; a precondition-blocked cross-repo step (Step 9, gated by critic F2
  behind "release shipped + installed") is likewise not-yet-due within the developer round. Both pass as
  Deviated with the reason documented, and the open production gates are surfaced as team-lead follow-ups —
  the verdict stays binary while the risk disclosure does not.

## Developer Lessons
- **D3 register compliance when porting a domain-saturated skill = one covering exemplar clause + genericized
  pattern prose + a pattern-first description — not identifier-by-identifier rewriting.** The practical mechanism
  that satisfied F5 across all 4 ports (and the `authorization-patterns` re-registration) was: (1) description
  leads with the pattern, zero domain tokens (the case-insensitive `article` grep is the smoke test); (2) a
  top-of-skill `> Worked exemplar — the reference app (dotnet-microservices)` blockquote that attributes every
  concrete `Article*`/`UserRoleType`/service-name identifier below it; (3) genericize the *pattern-level* prose
  ("does this caller reach this **resource**?", not "this article") while leaving concrete class names in
  reference-app-labeled code blocks. Rewriting every identifier makes the skill unteachable; the covering clause
  is how the estate's existing ports (file-storage, consumer) already read.
- **skill-lint E6 false-positive: never write another skill's `workflows/X.md` (or `references/X.md`) path in
  prose.** The dangling-reference check matches any `references|workflows|scripts|assets/…` token and resolves it
  skill-relative OR at repo root — so citing `add-integration-event`'s `workflows/Consumer.md` from inside
  `consumer-patterns` errored as dangling. Refer to a sibling skill's file WITHOUT the folder prefix ("its
  `Consumer.md` workflow"). Cost me one lint round.
- **Fold-upstream diffs parallelize cleanly; the fold/defer/drop judgment does not.** Delegating the 10-pair
  claim-by-claim enumeration to 4 read-only research agents (grouped by pair) returned precise `already-upstream`
  / `fold-candidate` / `contradiction` lists in one parallel pass — far cheaper than reading ~20 files into my
  own context. But the actual decision (fold now vs defer-to-backlog vs drop, and *where* to fold) needed my
  judgment + the plan's D2/D3 framing. Split the labor at that seam. Also: a "contradiction where shipped is the
  corrected form" is a **drop/supersede**, never a re-fold — re-folding the stale local wording would undo the
  1.4.0 correction (the VO-ctor absolute was exactly this trap).
- **Deferred-to-backlog is the D2-honest disposition for a genuine-but-large fold-candidate.** Step 6's `dropped`
  is only for "no pattern value"; a real portable pattern too big to fold safely in-pass (the caching impl cluster,
  the `*OrThrow` family) goes to `docs/skill-backlog.md` as `Deferred`, not dropped — the knowledge survives the
  Step-9 local retirement in the backlog rather than only in a transient disposition note.
- **At the release step a developer edits but never commits — and `gen-omni` is commit-coupled + worktree-unsafe.**
  Ran `bump-plugin.mjs --minor` (a file edit) and the count/backlog/CHANGELOG edits, verified `--check` exit 0,
  then STOPPED. `gen-omni.mjs` was deliberately NOT run: from a feature worktree it would regenerate the omni twin
  from this branch's `plugins/**`, missing the concurrent pipeline's state in the sibling checkout. The commit +
  `gen-omni` + twin commit are the team lead's, on merged main. Flag them as OPERATOR ACTION in Deviations.
- **A D3 register defect can land in a *fold*, not just a *port* — the fold-upstream step needs the same register
  scrutiny as the 4 new skills.** Reviewer Fix Cycle 1 found the one HIGH register violation not in any of the 4
  freshly-ported skills (which I'd applied the exemplar-clause discipline to deliberately) but in a Step-6 *fold*
  into a pre-existing skill (`create-grpc-contract`'s new "Handler usage" section) — I wrote genuinely new prose
  to explain a gap the diff found, and it slipped past register discipline because my attention was on "is this
  fold-candidate genuine and correctly targeted," not "does this fresh prose carry bare domain vocabulary." Lesson:
  any *newly-written* content in a fold (not just a verbatim-lifted code block) needs the same `(reference app: ...)`
  framing check as a full port — grep the diff's added lines for domain tokens before calling a fold done, not just
  the ported skills.
- **A ported code example with a parameter the local base's body used, once that body line is deliberately dropped,
  becomes a silent dangling-parameter defect.** Porting `article-state-machine`'s `Approve` method, I correctly
  dropped `_actors.Add(new ArticleActor {...})` (repo-specific, doesn't generalize) but didn't notice the `Person
  editor` parameter it was the sole reader of was now unused — the inline Layers-1-4 judgment pass reviewed the
  ported *prose* but didn't diff the example against the local base's *code* line-by-line, which is exactly the
  kind of check that would have caught it. Lesson (also logged as a Skill Gap below): when porting a code example,
  after dropping any line, re-scan the signature for now-unused parameters — don't just check the remaining body
  reads sensibly in isolation.

## Skill Gaps
- **The inline Judgment Gate (Layers 1–4) doesn't diff a ported example against its local-base code line-by-line.**
  Both the HIGH and MEDIUM Fix-Cycle-1 findings were content-fidelity defects in freshly-written/ported code
  examples that an isolated read of the shipped prose wouldn't surface (a dangling parameter reads fine in
  isolation; bare domain vocabulary reads fine if you're not actively grepping for it). Suggested strengthening for
  `evaluate-skill`'s rubric (Layer 1 or 2, for any skill whose authoring involved porting/lifting code from a
  named base): add a mechanical step — diff each ported/lifted code block against its cited local-base source
  line-by-line, not just review the ported prose in isolation, and grep the fold's newly-added lines (not just the
  ported skills) for bare domain vocabulary. Coverage: applies to any future skill port or fold-upstream pass, not
  just this feature. References: this fix cycle's HIGH + MEDIUM findings (`review.md` Step 2).

## Reviewer Lessons
- **On a "port skill A, then fold gap-findings into skills B/C/D" plan, re-verify the register rule
  (D3-class) separately for EACH touched target, not just for the skill(s) the plan calls out by name.**
  This plan's Context section named exactly one pre-existing register violation (`authorization-patterns`)
  and one body to sweep (`create-domain-event-handler`) — both were clean. But Step 6 also folded *new*
  prose into `create-grpc-contract` (a skill the Context section never flagged, because before this pass it
  had no register problem — it had no Articles content at all). The new "Handler usage" section introduced
  bare `Article`/`Journal`/`Person` vocabulary with zero exemplar framing — a fresh violation the plan's own
  scoping missed because it only looked backward at skills with *known* prior residue, not forward at where
  a fold's *new* content might introduce the same defect it was fixing elsewhere. Grep every touched file's
  Step-6 diff for capitalized domain-shaped nouns, not just the files named in Context/Binding as
  register-suspect.
- **A line-count match between a ported reference file and its local-base source (line-for-line identical)
  is a strong, cheap signal of full-fidelity porting — but it only covers files ported wholesale, not
  inline code SAMPLES inside a SKILL.md that get selectively trimmed.** The 3 fully-ported `references/*.md`
  files all matched their local-base line counts exactly and were genuinely clean. The one defect found
  (`add-state-machine`'s dangling `editor` parameter) was in a SKILL.md's own inline code block, where one
  line (`_actors.Add(...)`) was correctly dropped as ungeneralizable but the now-orphaned parameter it fed
  was not cleaned up. When auditing a "genericize this local file" port, diff inline code SAMPLES against
  the local base line-by-line too — don't rely on whole-file line-count parity as a fidelity proxy for
  anything containing hand-edited examples.
- **Fanning out 2 read-only helpers for a large markdown-only plugin diff (4 new skills + ~10 edited files,
  cross-referenced against a second repo) was worth it here:** one did the full 4-pair content-fidelity +
  register diff against `dotnet-microservices`, the other spot-checked 3 of 10 Step-6 disposition-table
  pairs against both local bases and `docs/skill-backlog.md`. Both returned concrete file:line evidence I
  verified myself before writing findings — this kept the single-pass checklist from missing the one real
  HIGH (which sat in a file the plan's own Context section never flagged as register-risk, see above).
- **A Cycle-2 re-review of 3 narrowly-scoped fixes needed zero fan-out — direct reads + targeted greps at the
  exact fix sites were enough.** Fan-out earns its cost on a genuinely large surface (Cycle 1's 4-skill/10-pair
  cross-repo diff); a fix-verification pass with 3 named file:line targets and no new surface to cover is
  cheaper and just as reliable done directly. Also worth noting: the developer's fix chose to genericize
  `create-grpc-contract`'s Handler-usage section (reusing the skill's own pre-existing `{ServiceName}`/`{Request}`
  placeholder vocabulary, verified by grepping its `workflows/*.md`) rather than exemplar-tag it — the other
  option the finding offered. Both were acceptable; confirming the chosen fix didn't invent a new pattern (it
  matched an existing in-file convention) was a fast, high-value adjacent-check.
