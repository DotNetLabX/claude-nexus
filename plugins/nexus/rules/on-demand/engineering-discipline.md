# Engineering Discipline

> Read when: planning/writing/reviewing code and a smell, a skill-vs-pattern/adherence call, or a gate/validation contract needs its failure-mode direction, reachability, or diagnosis precedence.

Universal coding-quality constraints. Applies to every agent that plans, writes, or reviews code.

## Problem-class rule

Any reported issue is an **example of a class**, not a one-off. When you fix it:
1. Fix **every instance** across the codebase — grep the pattern, don't stop at the cited file.
2. Fix the **root cause** — the skill, convention, or process that allowed it — not just the symptom.

## Failure-mode direction

Four failure modes of a gate, in the order they bite: it defaults the wrong way, it can never fire at
all, it fires and blames the wrong file, or it fires and names a remedy that does not repair. Where a
direction is in play, pick the loud one.

- **Denylist, not allowlist, for any freshness/drift/projection predicate.** An allowlist of "fields
  that matter" makes an unrecognized field invisible (a semantic edit scores as a warn); a denylist of
  "fields that don't" makes it significant (a loud fail, fixed by adding one word). Check which
  direction any "compare only these fields" spec is written in.
- **A contract string enforced only by its parser is a trap** — this bullet owns **absence**, the check
  that never fires. When a tool parses a literal that a human or agent *elsewhere* must author, three
  things must hold, and the third is the one that gets skipped: the literal is pinned in the
  **producer-facing prose**; the parser is **reachable** from the shipped entry point with the
  malformed input intact; and a missing or malformed literal yields a **named error, never silence**.
  A parser agreeing with its own test fixture proves nothing.
- **Name the root cause before the pass that emits its symptoms** — this bullet owns **misattribution**,
  the check that *does* fire and blames the wrong file. A config error reported as the failure it
  superficially resembles sends the operator to the wrong file, and adding the right diagnosis
  *alongside* the wrong one still buries it. Let the cause carry the blast radius, and pair every
  suppression with a still-emitted `fail` so a suppressed symptom can never convert a fail into a pass.
- **A refusal's printed remedy is run against the failing state, once** — this bullet owns the
  **unnamed exit**. A capability that exists but appears in no message is absent to the reader of the
  failure, and a remedy that merely reads plausible is the same defect as a missing one. Run the
  command the message prints on the state that produced it and confirm it goes green.

## Decision order when code smells

1. **A correct skill exists** → apply it exactly.
2. **No skill, or the skill itself smells** → derive the pattern from the project's **reference implementation** (a project names it in `docs/conventions/` if it has one), then **fix or create the skill** so the next person inherits the right way.

Never invent a pattern when a skill or the project's reference implementation already defines one.

## Skill-adherence guards

- **Plans map every step to a skill**, or justify inline detail — no skill-less steps.
- **"Adapt" requires written justification.** "A skill exists but I did it differently" without a recorded reason is a deviation, not a disposition.
- **The architect's done-check scores skill conformance** — from the skill invocation log, not the self-report; a step that ignored its mapped skill is a Fail (→ architect.md § Step 1: Done Check).
- **Skills stay portable and compilable** — no app-specific names leaking in, no non-compiling snippets. A skill that fails either test is itself a defect to fix.
- **Architecture docs defer to skills** — reference the skill, don't inline the pattern.
