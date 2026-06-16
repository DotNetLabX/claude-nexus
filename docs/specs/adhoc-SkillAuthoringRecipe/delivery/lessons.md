# Lessons — adhoc-SkillAuthoringRecipe

## Architect Lessons

- **A grep-based "verify against live source" instruction is only as good as the source actually
  containing the thing.** Step 1 told the developer to verify the §4 frontmatter fields by grepping the repo —
  but four of the nine fields (`allowed-tools`, `disallowed-tools`, `context: fork`, `when_to_use` + cap) have
  **zero** in-repo frontmatter precedent, so the grep silently confirms nothing and the unverified omnishelf
  forms pass straight through. When a plan says "verify X against the codebase," confirm the codebase can
  actually confirm X; if it can't, name the real ground truth (here: the `claude-code-guide` agent /
  platform docs) per field. This is the AP5 "fictional infrastructure" trap applied to a verification step,
  not just a referenced path. (Caught by the code-grounded critic, not derivable from the plan alone — which
  is exactly why a shared/plugin-source pass needs a *code-grounded* review, not a doc-only diff.)

- **A lint done-condition that depends on an exact token must say so in the step that writes the token.**
  Step 3's `skill-lint` only bites because Step 2 cites the literal `references/skill-recipe.md`. The coupling
  was implicit; a paraphrased pointer would have passed the lint green while leaving the reference unwired.
  When a later step's gate depends on an earlier step's literal output, state the literal in the earlier step.

- **For a small extraction pass, the proposal *is* the confirmed scope.** P5 was High-confidence and named
  exactly §0/§1/§4 in, §2/§3/§5/§6/§7 out — no separate tech-spec or scope-confirmation round was needed
  (master gate, ADR-25). The judgment that earned its keep was the *anti-duplication* constraint (reference
  `proven-patterns.md`, don't restate it — AP3), not scope reconstruction.
