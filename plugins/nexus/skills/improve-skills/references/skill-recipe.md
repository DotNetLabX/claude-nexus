# Skill Authoring Recipe — archetype, element menu, frontmatter cheat-sheet

Sibling to `proven-patterns.md`. Where that file is the evidence layer (mechanisms proven to earn
their keep), this file is the **authoring-from-scratch recipe** — the archetype decision, the
reusable-element menu, and the frontmatter field semantics — for building a new skill before there
is anything to fix or evaluate. Consulted by `improve-skills` "For New Project-Local Skills" (steps
2 and 4) for both authoring paths — project-local skills and, under the dev-repo carve-out, new
shipped plugin skills.

Extracted from the omnishelf skill/agent recipe reference (`SKILL_AND_AGENT_RECIPES.md` §0/§1/§4)
and re-grounded against the live nexus skill estate — this is the **one gap** identified in
`docs/proposals/skill-authoring-recipe.md`: everything else in that source is either already
shipped here (`evaluate-skill`, `skill-lint.mjs`, `proven-patterns.md`), redundant with the nexus
pipeline itself (the agent recipe — Nexus *is* that pipeline), or project-specific to omnishelf.
This file references those existing owners rather than restating them — one fact, one owner
(`proven-patterns.md` AP3).

---

## 1. Archetype decision — pick the weight first

Nexus skills run at two weights. Picking the wrong one is the most common authoring mistake —
default to the simplest thing that works, and add weight only where it demonstrably pays (see
"the allocation principle," `docs/architecture/README.md` — cheapest correct locus, harden only
what's demonstrably needed).

| | **Heavy / autonomous** | **Light / conversational** |
|---|---|---|
| Examples | `mine-verify-repo`, `mine-verify-cover` (+ stack adapters) | `create-feature-spec`, `create-implementation-plan`, the `*-format` skills (`implementation-format`, `questions-format`, `lessons-format`, …) |
| Frontmatter | `name`, `description`, `user-invocable` | `name`, `description`, `user-invocable` |
| Structure | thin `SKILL.md` orchestrator + a `references/` folder for durable operational material (a metric-layer runbook, a rubric) + a durable output artifact (a KB entry, a triage registry row) | single `SKILL.md`, sometimes one sibling file (`workflows/Template.md`, or a `references/*.md` the format skill documents) |
| Driver | a deterministic orchestrator dispatches clean-room-miner / skeptic / Cover subagents in parallel through a multi-stage pipeline (Mine → Verify → Cover → Gate → Report) | a person or agent drives it inline, in one conversation turn |
| Subagents | yes — parallel dispatch, mechanical re-derivation, a verification gate | none — main-context judgment only |
| Use when | mining a codebase or class for rules/debt, a long multi-stage run with a proof-bearing gate at the end | shaping a spec, decomposing a plan, defining a file format — judgment-heavy, one artifact family |

**Rule of thumb:** PO/architect-driven skills (shape a spec, decompose a plan, define a file
format) are **light**. Codebase/class-mining skills that end in a verification gate are **heavy**.
Borrow a heavy element into a light skill only where it demonstrably pays (§2 below) — never for
its own sake.

---

## 2. The reusable element menu

Pull the elements that fit; don't ship all of them in a light skill. Nexus does not use the
`phases/` / `playbooks/` / `templates/` directory split some source material describes — heavy
nexus skills instead keep a `references/` folder for durable inputs (a metric-layer runbook, a
rubric, a plan template) and, when a post-condition is deterministically checkable, a `scripts/`
folder for the executable that checks it.

- **Frontmatter** — `name`, `description` (drives auto-invocation — be specific), `user-invocable`,
  and `disable-model-invocation` for side-effecting or timing-controlled skills. Full field
  semantics: §3 below.
- **Thin `SKILL.md` orchestrator + a `references/` folder** for durable operational material, so
  the body loads only when invoked — progressive disclosure keeps reference material cheap.
- **Bundled executable `scripts/`** — the home of a P1 deterministic post-condition check: a script
  that runs the gate every pass and is runnable without being read into context. Live exemplars:
  `improve-skills`' `skill-lint.mjs`, `research`'s `cite-check.mjs`, `fleet`'s `render-fleet.mjs`.
  See `proven-patterns.md` P1 for when a post-condition earns a script — don't restate it here (AP3).
- **Degrees of freedom, matched to fragility** — set each step's specificity by how badly a misread
  hurts: high freedom (heuristic prose) where any reasonable reading works; medium (a parameterized
  template or pseudocode) for a shaped-but-flexible step; low ("run exactly this; do not modify") for
  a fragile step where drift corrupts the output.
- **Modes** (a create / update / check-style split) — reuse for any skill that both produces and
  later revises an artifact.
- **Configuration constants** — named thresholds kept in one place.
- **Hard rules** — numbered, "never violate" — categorical, role-boundary, safety.
- **Phase index / pipeline diagram** — an ASCII "stage → what it does" block reads as well as a
  diagram; heavy nexus skills already do this (`mine-verify-cover`'s `## The pipeline` block).
- **State persistence for batch + resume-after-compaction** — nexus's own equivalent is the
  pipeline resume artifacts: `communication-log.md` (agent IDs, branch, current step, cycle count)
  and `.claude/.pipeline-state` — not a skill-private state file.
- **Append-only changelog + Lessons** — `lessons.md`'s per-role headings (this skill's own
  `lessons-format`) feed the learner loop.
- **Self-check / mechanical re-derivation** — never trust a subagent's self-scored value; re-derive
  counts/scores mechanically from the written artifact. For the deeper question of whether a
  self-check actually catches omissions, **reference `proven-patterns.md` P5 and P6** — don't
  restate them here (AP3).
- **Provenance** — every produced entry carries a source.
- **Downstream-consumers table** — who reads this artifact and the impact if it goes stale
  (`implementation-format`'s Consumers table is the shipped example to copy).
- **Error-handling / refusal tables** — `Situation | Action` and `User asks | Refuse with`.
- **"What this skill does NOT do"** — a scope fence, already load-bearing across the estate (see
  `improve-skills`' own section of that name).

**Loader safety (mechanical, not a restated prose rule):** no XML-tag-shaped tokens anywhere in a
`SKILL.md` — write `{placeholder}`, never an angle-bracket placeholder; rephrase math comparisons
as "under/over/at most." This is enforced by the shipped `skill-lint.mjs` gate (checks E7/E8), not
left to a prose reminder — see `improve-skills`' own "Write Discipline (encoding)" and
"Deterministic Gate" sections for the full write standard and the exact command to run.

---

## 3. Frontmatter cheat-sheet

Every field below is a **real, currently-supported** `SKILL.md` frontmatter field, verified
2026-07-04 against the live Claude Code Skills documentation (`code.claude.com/docs/en/skills.md`)
— not carried over from an older reference unverified. `user-invocable` and
`disable-model-invocation` additionally have live in-repo precedent (grep any shipped nexus
`SKILL.md` — e.g. `improve-skills/SKILL.md` itself uses both); the other six have no in-repo
frontmatter precedent to grep, so treat the platform docs as the ground truth for those, not the
codebase.

| Field | Use it for |
|---|---|
| `description` | Drives auto-invocation. Be specific, or the skill mis-fires or never fires. |
| `when_to_use` | Extra trigger phrases / example requests, appended to `description`. Cap is combined across both fields, at 1,536 characters (configurable via the `skillListingMaxDescChars` setting) — not a separate budget per field. |
| `disable-model-invocation: true` | Side-effecting or timing-controlled skills. Removes the skill from Claude's automatic context entirely (not just hidden) and keeps it out of subagent preloading and scheduled-task auto-run. This is the mechanism for "never do X without a human driving it." |
| `user-invocable: false` | Hides the skill from the `/` menu only — Claude can still invoke it automatically. To block automatic invocation too, use `disable-model-invocation` instead; the two fields are independent controls. |
| `allowed-tools` | Pre-approves specific tools while the skill is active, so it doesn't prompt per call. Does not restrict any other tool — your normal permission settings still govern everything not listed. |
| `disallowed-tools` | Removes tools from Claude's available pool while the skill is active (e.g. blocking `AskUserQuestion` for an unattended background loop). The restriction is turn-scoped — it clears on your next message, not for the rest of the session. |
| `effort` | Per-skill effort override (`low` / `medium` / `high` / `xhigh` / `max`, model-dependent) for the current turn; the session's effort level resumes on the next prompt. |
| `model` | Per-skill model override for the current turn (same values as the `/model` command, plus `inherit` to keep the session model explicitly); resets to the session model on the next prompt. Silently ignored if the organization's model allowlist excludes it. |
| `context: fork` (+ `agent:`) | Runs the skill body as the prompt for an isolated subagent — no access to the parent conversation. `agent:` names the subagent type (a built-in like `Explore`/`Plan`/`general-purpose`, or a custom agent from `.claude/agents/`); defaults to `general-purpose` if omitted. Fits research/audit skills that fan out and return a report. Note: `Explore`/`Plan` skip CLAUDE.md and git status to stay small — a `context: fork` skill on one of those sees only its own `SKILL.md` content. |

**Add complexity only when it pays.** Rather than restating agent-design first principles here,
see the nexus "allocation principle" (`docs/architecture/README.md`) — the nexus-native version of
"start simple, hardening only what's demonstrably needed."
