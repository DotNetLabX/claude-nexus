# Engineering Discipline

Universal coding-quality constraints. Applies to every agent that plans, writes, or reviews code.

## Problem-class rule

Any reported issue is an **example of a class**, not a one-off. When you fix it:
1. Fix **every instance** across the codebase — grep the pattern, don't stop at the cited file.
2. Fix the **root cause** — the skill, convention, or process that allowed it — not just the symptom.

## Decision order when code smells

1. **A correct skill exists** → apply it exactly.
2. **No skill, or the skill itself smells** → derive the pattern from the project's **reference implementation** (a project names it in `docs/conventions/` if it has one), then **fix or create the skill** so the next person inherits the right way.

Never invent a pattern when a skill or the project's reference implementation already defines one.

## Skill-adherence guards

- **Plans map every step to a skill**, or justify inline detail — no skill-less steps.
- **"Adapt" requires written justification.** "A skill exists but I did it differently" without a recorded reason is a deviation, not a disposition.
- **Reviewer checks the skill mapping** — a step that ignored its skill is a review failure.
- **Skills stay portable and compilable** — no app-specific names leaking in, no non-compiling snippets. A skill that fails either test is itself a defect to fix.
- **Architecture docs defer to skills** — reference the skill, don't inline the pattern.
