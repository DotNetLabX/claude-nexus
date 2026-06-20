# Codex Review — adhoc-DistillPrompt

Date: 2026-06-20

## Verdict: NO-GO — the 7-stage recipe and the agent-or-skill resolver are largely correct, but the skill file fails two explicit review-contract checks: the frontmatter key set is not `name/description/usage/examples`, and the never-invent rule does not explicitly ban invented behaviors.

## Findings table
| Severity | File | Issue |
|---|---|---|
| BLOCKER | `plugins/nexus/skills/distill-prompt/SKILL.md` | Frontmatter has four keys, but not the required `name`, `description`, `usage`, `examples` set; it uses `user-invocable` and `disable-model-invocation` instead. |
| BLOCKER | `plugins/nexus/skills/distill-prompt/SKILL.md`; `docs/specs/adhoc-DistillPrompt/delivery/implementation.md` | The never-invent rule is explicit for requirements, constraints, and values, but not for absent behaviors; against the requested contract, that prohibition is incomplete. |
| WARN | `tests/lint/wiring.test.mjs` | The `/nexus:` resolver now correctly accepts shipped agents or skills for lowercase exact matches, but the regex is lowercase-only, so mixed-case `nexus:` references are not linted at all. |

## Detail
### BLOCKER — Frontmatter schema does not meet the requested 4-key contract
`plugins/nexus/skills/distill-prompt/SKILL.md:1-5` declares exactly four keys: `name`, `description`, `user-invocable`, and `disable-model-invocation`. Under the review contract for this pass, that is the wrong closed set: `usage` and `examples` are missing, and `user-invocable` plus `disable-model-invocation` are extra.

Cross-checking the surrounding artifacts matters here. This is not an implementation drift against the plan: `docs/specs/adhoc-DistillPrompt/delivery/plan.md:62-70` explicitly requires the same four keys the file currently has, `docs/specs/adhoc-DistillPrompt/delivery/implementation.md:4` repeats that same schema, and `tests/lint/frontmatter.test.mjs:13,34-46` enforces it repo-wide. The implementation is internally consistent with the plan and notes, but it does not satisfy the frontmatter contract requested for this review.

### BLOCKER — Never-invent rule does not explicitly ban invented behaviors
The skill does carry an explicit never-invent rule, but it stops short of the requested scope. In stage 6, `plugins/nexus/skills/distill-prompt/SKILL.md:75-79` says to flag genuinely missing facts as open questions, to avoid assumed values, and that inventing a missing requirement is a failure. The final guardrail in `plugins/nexus/skills/distill-prompt/SKILL.md:108-109` bans inventing "requirements, constraints, or values." No line explicitly says the distilled prompt must not add behaviors absent from the source.

That omission is material because the same stage also authorizes "Make underspecified asks explicit where the user's intent is unambiguous" (`plugins/nexus/skills/distill-prompt/SKILL.md:75-76`). Without an explicit behavior-level guard, the text still leaves room to sharpen the prompt by adding behavior not actually present in the source. Cross-check: the plan only required "never invent missing requirements" (`docs/specs/adhoc-DistillPrompt/delivery/plan.md:85-87`), and the implementation note says the never-invent rule is explicit (`docs/specs/adhoc-DistillPrompt/delivery/implementation.md:19`). Against the requested contract for this review, the artifact is still incomplete.

### WARN — `/nexus:` resolution is widened correctly, but mixed-case refs still escape the lint
The core fix is real. `tests/lint/wiring.test.mjs:10` imports `listSkills`, `tests/lint/wiring.test.mjs:84` builds a skill-name set from shipped `skills/*/SKILL.md`, and `tests/lint/wiring.test.mjs:104-106` now accepts `agents.has(name) || skills.has(name)`. That means a lowercase `/nexus:x` reference only passes if `x` resolves to a shipped agent or a shipped skill; otherwise it still fails. The lookup is exact, not prefix-based, because both agent and skill checks are set membership against concrete names (`tests/helpers.mjs:16-27,85-86`), so partial-name false passes are not introduced.

The edge-case gap is case sensitivity. The matcher at `tests/lint/wiring.test.mjs:102` is `/\/?nexus:([a-z][a-z0-9-]*)/g`, which means the lint only sees lowercase tokens. Mixed-case references such as `/nexus:Distill-prompt`, `nexus:Developer`, or `/Nexus:distill-prompt` would not be validated at all. This does not break the current corpus: the scanned markdown refs I found are lowercase (`plugins/nexus/agents/architect.md:176`, `plugins/nexus/skills/distill-prompt/SKILL.md:3`), and empty shipped inventories are separately guarded by `tests/lint/frontmatter.test.mjs:18-19,35-37`. Still, the implementation note's broad "`/nexus:X` resolver" wording is slightly stronger than what the regex actually enforces.

## Summary
The 7-stage distillation method itself is complete and internally consistent: all seven stages are present, the outputs chain cleanly, and I found no circular dependencies or orphaned steps in the recipe. The resolver change in `tests/lint/wiring.test.mjs` correctly broadens lowercase `/nexus:x` references from agents-only to agent-or-skill without weakening exact-match failure for unknown lowercase names.

This is still a NO-GO because the skill file misses two explicit review-contract requirements: the frontmatter key set is not `name/description/usage/examples`, and the never-invent rule does not explicitly forbid inventing absent behaviors.
