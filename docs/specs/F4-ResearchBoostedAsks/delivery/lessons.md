# F4-ResearchBoostedAsks — Lessons

## Architect Lessons

- **Numeric cross-file line refs inside shipped rules rot on the very pass that edits them.**
  research-before-asking.md cited agents-workflow "L92/L93" — the real bullets now sit at L165/L166,
  and this feature's Step 2 shifts them again. The critic caught that the plan's own accept-gate
  initially forbade fixing the stale refs. Rule of thumb encoded in Step 1: shipped prose cites
  **section names, never line numbers**, across files.
- **A dry-run "reasons" gate must match what the tool actually emits.** bump-plugin.mjs emits
  category labels (not file paths) for agent/rule/command changes, so a "reasons ⊆ F4 files" check
  was unenforceable as written; the enforceable gate is `git status --porcelain -- plugins/nexus/`
  against the expected file set. Verify a gate's mechanism against the tool's real output at plan
  time, not from the tool's purpose.
- **Dogfooding note for the learner:** this feature's own shaping used the pattern it ships — both
  checkpoint asks carried recommendation + confidence; neither was boostable (both high), which is
  itself a correct-trigger example worth citing when evaluating the shipped rule.

## Developer Lessons

- **A brief parenthetical gloss of a canonical term IS a restatement risk, even at one clause.** Step
  4 instructed "no full protocol restatement (D2)" for po.md/architect.md/solo.md's boostable-ask
  sentences. Writing a short parenthetical gloss of what "boostable ask" means — even a compressed
  one, even without copying the template — still drifted from the canonical definition twice (po.md
  invented a "spec/product-facing" category not in the source; solo.md narrowed the four canonical
  categories to two and invented "approach"). The self-review pass caught both. The safer default for
  a D2-owned term across agent files: point at the definition ("boostable ask (research-before-
  asking.md's definition)"), never gloss it inline, however briefly — a gloss that omits or narrows
  reads as authoritative to the next reader even when it isn't.
- **An edit at Step N can make an untouched sentence at a different file's Step 1 anchor go stale.**
  research-before-asking.md's scope line (L7-8) was never in Step 1's explicit edit list — but Step 5
  gave team-lead.md a real (non-judging) role in "this research branch," which made the scope line's
  blanket "team lead carries... not this research branch" an overclaim. Plan steps that touch
  different files describing the same subsystem (here: who does what in the research-offer flow)
  should flag this ripple risk explicitly, or the developer should re-scan the canonical file's
  scope/header text after the LAST step touching that subsystem, not just the step that names it as
  an anchor.
- **The two parallel prose-angle finder passes (5 angles split A/B, C/D/E) worked well for a
  docs-only diff** — no overlap in findings, both passes independently converged on the same class of
  defect (definition drift vs. the canonical owner file) from different angles (internal consistency
  vs. dropped guarantee), which is a good signal the split was genuinely non-redundant rather than
  two agents reading the same thing twice.
