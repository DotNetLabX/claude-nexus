# Evidence — Developer Skill Usage Audit (knowledge-gateway, 2026-06-12)

Distilled from `D:\src\knowledge-gateway\docs\audit\developer-skill-usage.md` and the
`docs/specs/F16-DataPathRework/delivery/communication-log.md` §"Post-Run Audit" (both written
2026-06-12 in the consuming project). This is the evidence base for the **nexus 1.5.x skills
enforcement work** — 1.5.0 (`## Skills Used` + done-check), 1.5.1 (Skill-First restoration),
and 1.5.2 (trigger re-key, fallback ladder, plan anti-patterns).

## Method (theirs)

Plan side: `**Skill:**` mappings from all 11 `docs/specs/*/delivery/plan.md`. Usage side: every
`Skill` tool call from all 13 sessions' subagent transcripts, role-attributed against the audit
logs. 21 subagent Skill calls found; all 21 matched audit entries.

## Headline numbers

- **29 step-level skill recommendations across 11 plans → 3 in-plan Skill-tool invocations**
  (F1 `create-building-blocks-package` ×2, F4 `create-module` ×1, both June 5–6). Zero after June 6.
- `tdd` — the most-recommended skill (11 mappings across 6 plans) — **never consumed in-plan**
  by any channel.
- **F11's developer consumed 3 of its 4 mapped skills by Reading SKILL.md directly from the
  plugin cache** (`…\nexus-dotnet\1.0.1\skills\…\SKILL.md`) — materially compliant, procedurally
  off-protocol, invisible to the Skill-call audit. F5, F6, F16 consumed nothing by either channel.
- Off-plan control: a June 7 ad-hoc dev run (warm Skill tool) invoked 3 pattern skills unprompted.

## Root causes (theirs, evidence-backed, strongest first)

1. **Reference-rich plans crowd out skills.** Developers consume a skill only when the step is
   scaffold-like with no in-repo precedent; every F16 step carried file:line references to
   existing code, and the developer imitated the cited code instead. Architects pre-reading
   skills at plan time and distilling them into step text amplifies this.
2. **The binding trigger word was dropped.** `developer.md` keyed the mandate on
   `Skill: Follow {name}`; earlier plans wrote "Follow X", the F16 plan wrote bare names with
   parenthetical scopes — no "Follow" anywhere, so the one hard compliance hook never fired.
3. **Nothing enforced or recorded skill usage.** implementation.md had no skills field, the
   done-check couldn't see usage, the audit `detail` field was empty pre-1.3.0 — the rule
   decayed silently until first measured.
4. **The Skill-tool habit died with frontmatter preloading.** Through nexus ≤1.2.6 agents
   self-loaded personas via the Skill tool (warm tool → mid-run invocations followed); 1.4.x
   preloads removed the only Skill-tool exercise, so mid-run invocation lost its cue.

## Corrected claims (do NOT re-file)

- **Availability was NOT the cause** — `nexus-dotnet` 1.0.2 was installed, the F16 developer's
  context contained the full skills list, and its own Phase-1 analysis enumerated the relevant
  skills before Phase 2 ignored them. ("Skills uninstalled" / "Skill tool broken for subagents"
  are both disproven by transcript evidence; a live probe confirmed bare and namespaced names
  resolve from subagents.)
- **The audit log alone under-reports**: frontmatter preloads never appear as Skill calls —
  zero entries ≠ format non-compliance.

## Cross-lane reads (their question 2)

The controlled pipeline was clean — nearly all out-of-lane reads belonged to the F16 rogue
window (ADR-21 incident). Refinement of the original read-waste evidence: the architect's
plan.md reads were ×31 **all ranged** (offset/limit, zero full re-reads, "edit anchoring");
developer re-reads were sanctioned by 4 spawns + 3 compactions. This validates ADR-22's
round-scoping and the read-tracker's deliberate skip of offset/limit reads.

## What nexus changed because of this

| Finding | nexus change | Version |
|---|---|---|
| No enforcement signal (cause 3) | `## Skills Used` in implementation-format; blocking developer checklist row; done-check verification | 1.5.0 |
| Habit died with preloading (cause 4) | Restored Fokus "mandatory + stop-and-invoke" Skill-First section; TDD column | 1.5.1 / 1.5.0 |
| Trigger keyword fragility (cause 2) | Mandate re-keyed on the *mapping*, not the "Follow" keyword; plan-side anti-pattern: disposition keyword required on every mapped step | 1.5.2 |
| Reference crowd-out (cause 1) | Plan anti-pattern: on Follow steps, cite code only for feature-specific surfaces — never the structural pattern | 1.5.2 |
| F11 cache-Read channel works | Fallback ladder: Skill tool (bare → namespaced) → cache Read (recorded Read-channel deviation) → plan references (recorded) | 1.5.2 |
| Audit blind spot | Skill-usage caveat in consumption-report | 1.5.2 |
