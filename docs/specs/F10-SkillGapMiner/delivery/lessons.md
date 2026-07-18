# F10-SkillGapMiner — Lessons

## Developer Lessons
- **Background grandchild fan-out is unreliable — do mechanical extraction inline.** A background
  miner subagent that itself spawns background sub-miners lost 5/5 of their results (the parent
  stopped with no live children and returned a generic non-answer, not its data). The fix that
  worked: do the deterministic `(none)`-row extraction myself in the main context (a PowerShell
  parser over 73 tables), and reserve subagents for judgment only — inline clustering plus ONE
  synchronous fresh-context skeptic. Reinforces the existing stranded-subagent lesson class
  (`developer` agent, "600s watchdog" note): prefer the main session for mechanical long ops;
  background fan-out is best-effort, and a background agent's own background children are worse.
- **A resumed stranded subagent needs an explicit "consolidate and return your data" message.** The
  completion-notification `<result>` field can carry a stale/generic reasoning line, not the agent's
  real final answer. SendMessage the agent asking it to restate its structured output before trusting
  the notification.
- **Plan-table parsers must tolerate the `Step | Disposition | …` format.** KG's F19/F20/F21 skill
  maps put the `None` disposition in a *Disposition* column with no separate `Skill` column, so a
  strict `^Skill$`-header parser silently under-extracts them. This is exactly the "tolerant of
  pre-standardization estates" posture `mine-skill-gaps`' S1 calls for — the tolerant re-parse
  recovered ~15 rows that reinforced (not created) existing clusters.
- **A Judgment-Gate fold can introduce a new inconsistency — run a consistency pass AFTER the folds.**
  evaluate-skill (job-fitness rubric) passed the skill fix-then-accept, but a later prose
  consistency/cross-ref pass caught 7 more issues — two of which my OWN Judgment-Gate folds
  introduced (folding the skeptic disk-verify created a "scratch file" write that contradicted the
  skill's "one write" safety rail). The multi-angle prose review after the rubric folds earned its keep.
- **Follow-by-Read validated the pilot method end-to-end.** Running a not-yet-cached shipped skill
  from its working-tree SKILL.md (plan D2), with deterministic parse → model cluster → fresh-context
  skeptic, re-found both author-named KG clusters by name and produced 7 skeptic-verified clusters —
  confirming "collection is the bottleneck, not detection" (the strongest candidates self-nominate).

## Architect Lessons
- **Derive family ordinals from the family core's own table, never the ADR register.** The register
  lists only ADR-bearing members (no rows for mine-verify-flows / mine-semantic-model here), so it
  yielded "eighth" for a ninth member; the live `mine-family-core.md` header ("eight-member", 8-row
  table) was the ground truth. Only the code-grounded critic caught it — a doc-only review would
  have shipped two members both labeled eighth. **Evidence:** [F10-SkillGapMiner]
- **The lane hub owns idle-recovery, and the recovery message must say "return via your final
  message."** Two stranded stops this run (a grandchild consolidator SendMessage-ing a role name
  that doesn't resolve, then waiting on children it didn't have) were both cleared by one resume
  message stating the propagation contract + "consolidate what you actually have, no fabrication."
  Future fast-lane dispatches should forbid background grandchild fan-out for mechanical extraction
  up front (5/5 miner results lost). **Evidence:** [F10-SkillGapMiner]
- **An executed grep at plan time beats any cited sweep list — including the critic's.** The
  tech-spec's reviewed sweep list said 6 files; the plan-time executed grep found 7 files / 13
  lines (and post-F7 re-execution caught a line shift). The acceptance grep and the step's file
  list being the same executed query is what made Step 2 deterministic. **Evidence:**
  [F10-SkillGapMiner]

## Skill Gaps

### add-mine-family-member
- **Kind:** missing
- **Searched for:** a repeatable recipe for adding the Nth member to the mine family — the exact
  count-token sweep (`eight`→`nine` / `N-row`→`(N+1)-row` / `all N`), the family-core §The mine family
  9th-row insert with the shape-only annotation, the §Skeptic protocol carve-out clause for a
  reading-claim member, and the sibling grep list — so a future tenth mine doesn't re-derive the
  sweep by hand (F10 caught the line-474 stale-adjacent-list only via code review).
- **Why it would help:** every recent mine (mine-design, mine-algorithm, mine-verify-flows, now
  mine-skill-gaps) repeats the same member-count sweep; the acceptance grep catches stale *count*
  tokens but not a stale adjacent enumeration or a missing carve-out clause. A checklist/recipe would
  close the AP2 half-landed-sweep gap the code review caught here.
- **References:** `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`
  (§The mine family, §Skeptic protocol); the F10 Step-2 sweep list in
  `docs/specs/F10-SkillGapMiner/delivery/plan.md`.
- **Evidence:** [F10-SkillGapMiner]
