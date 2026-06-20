# Distill Prompt Skill

**Feature Spec:** None — ad-hoc technical feature. The architect owns the definition (ADR-27); the
binding scope is the user-confirmed intent below (2026-06-19), not a `spec.md`.

## Context
A **user-invocable** Nexus utility skill that takes a verbose, rambling, or underspecified prompt and
rewrites it into a **tight, effective** one — clear task, explicit constraints, defined output shape —
**without dropping any load-bearing requirement**. Invoked by a human via `/nexus:distill-prompt`.
Stack-agnostic → ships in `nexus` core (`plugins/nexus/skills/`). It is a two-way door (additive, fully
reversible by deleting the folder), so per ADR-25 it collapses to this plan — no tech-spec, no Options
Panel.

## Scope
**In scope**
- New skill folder `plugins/nexus/skills/distill-prompt/` with `SKILL.md` (the recipe).
- Born-compliant frontmatter (ADR-23): `user-invocable: true`, human-triggered.
- Version bump (`release-plugin`) + omni twin regeneration (ADR-6/9).

**Out of scope**
- No command file — skills invoke as `/nexus:{name}` directly (verified: `commands/` holds only the 8
  generated persona commands; the platform auto-discovers `skills/*/SKILL.md`).
- No skills-index row — `plugins/nexus/README.md` is prose, not an enumerated list.
- No new hook, agent, or test infrastructure.
- Not pipeline-agent-invoked (human-only this iteration; model auto-invocation disabled).
- Not a lossy summarizer, and not an idea→spec shaper (that overlaps `create-feature-spec`). Strictly
  **prompt → better prompt**.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills (+ claude-api, proven-patterns) | Follow | no | new skill `distill-prompt`; 4-key frontmatter; 7-stage recipe **grounded in Anthropic prompt-engineering** | |
| 2 | evaluate-skill | Follow | no | job-fitness pass on the new SKILL.md; fix findings via improve-skills | |
| 3 | release-plugin | Follow | no | bump `plugins/nexus`; MINOR; run `gen-omni` | |
| 4 | (none) | — | no | run `skill-lint` + `selfcheck`; both exit 0 | |

**The full authoring harness, not just form-lint.** Step 1 grounds the recipe in the domain reference
(`claude-api` — this *is* a prompt skill) and the `proven-patterns.md` catalog; Step 2 runs the
job-fitness `evaluate-skill` pass (the judgment layers `skill-lint` can't check — ADR-23 keeps the lint
at form only); Step 4 is the deterministic form gate. This is **not** an all-`None` plan: Steps 1–3 map
skills, so the done-check expects `improve-skills`, `evaluate-skill`, and `release-plugin` in
`.claude/audit/skill-invocations.log`. TDD is `no` throughout — the deliverable is a prose recipe; the
gate is the harness above, not new unit tests.

## Domain Model Changes
None.

## Data Model Changes
None.

## Implementation Steps

### Step 1 — Author `plugins/nexus/skills/distill-prompt/SKILL.md`
**Follow `improve-skills`** — its "For New Skills" recipe + born-compliant frontmatter, with `skill-lint`
as the done-condition. **Dev-repo carve-out (ADR-1):** author the shipped skill **directly** in
`plugins/nexus/skills/` — *not* `.claude/skills/`, and *not* the consuming-project feedback-file channel.

**File:** `plugins/nexus/skills/distill-prompt/SKILL.md` — Write tool, **UTF-8 without BOM** (ADR-23
encoding rule; never shell redirection).

**Frontmatter** (closed key set — `tests/lint/frontmatter.test.mjs` hard-fails any other key):
- `name: distill-prompt` (must equal the folder name).
- `description:` — what it does **and** a "Use when…" trigger. **Hard floor: ≥20 chars**
  (`frontmatter.test.mjs:43`); **aim for the 40–1024 band** that `skill-lint.mjs` W1/W2 *advise*
  (warnings, not errors — they do **not** fail the gate). Must convey: rewrites a verbose/underspecified
  prompt into a tight, effective one **without dropping requirements**; human-invoked.
- `user-invocable: true`.
- `disable-model-invocation: true` — human-triggered only (matches the confirmed scope; stops the model
  auto-firing it on every verbose prompt). *Reversible default — see Open Questions.*

**Recipe body** — the SKILL.md must instruct the model to run this distillation method. Describe *what
each stage produces*; the developer writes the actual recipe prose (no pseudo-code, no method-body
flow):
1. **Take the input** — the slash-command argument text. If empty: distill the most recent user prompt
   in context, or ask the user to paste it. Document this in an `## Arguments` section.
2. **Extract the core ask** — the single-sentence goal the prompt is really after.
3. **Inventory the load-bearing elements that must survive** — hard constraints, required output format,
   scope boundaries, named entities/values, success criteria.
4. **State the cardinal rule explicitly in the recipe: distillation is lossless on requirements** —
   never drop a constraint for brevity. Distinguish it from lossy *summarization*. (This is the #1
   failure mode; the recipe must name it, not imply it.)
5. **Cut the padding** — pleasantries, hedging, redundancy, repeated context, narration,
   meta-commentary.
6. **Surface what's implicit or ambiguous** — make underspecified asks explicit; **flag** missing-but-
   needed facts as open questions; **never invent** missing requirements. (State the never-invent rule
   explicitly too.)
7. **Restructure + output** — emit the distilled prompt as a ready-to-paste block in a clean,
   model-friendly shape (task / context / constraints / output-format-&-success-criteria), followed by a
   short **"Cut / Still-ambiguous"** note so the user can confirm nothing load-bearing was lost.

**Domain grounding (do before writing the recipe):**
- **Invoke `claude-api`** — the Anthropic prompt-engineering reference. Ground the recipe's target
  structure (be clear & direct, give role/context, specify output format explicitly, use examples, allow
  reasoning room) in that guidance rather than from memory. A skill *about prompts* must reflect the
  canonical prompt-engineering source.
- **Read `plugins/nexus/skills/improve-skills/references/proven-patterns.md`** (the P1–P11 / AP1–AP7
  catalog) and design the SKILL.md against it directly — not from the second-hand summary.

**Authoring constraints (from proven-patterns):** AP1 — every MUST in the recipe names its executor;
concrete, actionable steps (not abstract guidance); AP5 — every path/tool the recipe names must exist.
Study `research/SKILL.md` and `evaluate-skill/SKILL.md` for structure (both `user-invocable` utilities).
Keep the body lean.

**Acceptance — mechanical (exit-0 gates, verified in Step 3):**
- Folder + `SKILL.md` exist; `name` = folder; `description` present (≥20). [`skill-lint` + `node --test`]
- Frontmatter is exactly the 4 keys above — **enforced by `frontmatter.test.mjs`/selfcheck, not by
  `skill-lint`** (the lint does not check the key set; a typo'd key passes the lint and only fails
  `node --test`).
- No BOM (lint E2); no XML/angle-bracket tokens in prose (lint E7 — use `{placeholder}`).

**Acceptance — author-verified (grep/judgment, NOT exit-0 gated):**
- The recipe covers all 7 stages, with the **lossless-on-requirements** rule and the
  **never-invent-missing-facts** rule each stated explicitly — grep the body for both.
- `## Arguments` documents the input + empty-input fallback — no gate checks for it; verify by reading.

Satisfies: ADR-23 (born-compliant skill); new-capability scope confirmed 2026-06-19.

### Step 2 — Job-fitness pass (`evaluate-skill`)
**Follow `evaluate-skill`** on the freshly authored skill — the DIAGNOSE half that scores **job fitness**
via the rubric's judgment layers (lint-first Layer 0, then repeatability / no-overlap / concrete-steps /
capability overlays), which `skill-lint`'s form check structurally cannot catch (ADR-23: "a well-formed
bad skill passes the lint"). Target: `plugins/nexus/skills/distill-prompt`.

Fold the resulting findings back in **via `improve-skills`** (the APPLY half) as a consolidating pass —
net complexity flat or down, not additive patching. evaluate-skill → improve-skills is the plugin's
documented order; do not skip it for a new user-facing skill (force-multiplier risk, ADR-23).

**Acceptance:** an `evaluate-skill` findings pass ran; every CRITICAL/HIGH finding is resolved (or
explicitly waived with a reason in implementation.md); `evaluate-skill` and `improve-skills` both appear
in the skill-invocations log for this round.

Satisfies: ADR-23 (judgment layer on top of the form gate).

### Step 3 — Bump the plugin + sync the twin
**Follow `release-plugin`** (owns the ADR-9 release flow).
**Files:** `plugins/nexus/.claude-plugin/plugin.json` (`version`), `plugins/nexus/CHANGELOG.md`.
- `node scripts/bump-plugin.mjs --dry-run`, then the real bump. **Tier: MINOR — owner escalated
  (2026-06-20); pass `--minor`.** Rationale: a new user-facing capability (`/nexus:distill-prompt`).
- No `gen-commands` step — no agent file changed.
- Regenerate the twin: `node scripts/gen-omni.mjs` (ADR-6; `gen-omni --check` is a CI gate). The twin's
  commit in `../omni` is the **team-lead/owner's** follow-up using the mirroring-message convention
  (CLAUDE.md) — not a developer step, and not this repo's commit.

**Acceptance:** `plugin.json` `version` bumped; `CHANGELOG.md` carries the entry;
`node scripts/bump-plugin.mjs --check` clean; `node scripts/gen-omni.mjs` run (twin updated).

Satisfies: ADR-9 (release flow); ADR-6 (twin sync).

### Step 4 — Terminal gate: lint + selfcheck green
**Skill: None** (verification step). **Both commands are load-bearing** — `skill-lint` checks *form*
(BOM, frontmatter present, `name`=folder) but **not** the closed key set or the description floor; those
live in the `node --test` layer inside selfcheck. Run selfcheck **after** Step 3's `gen-omni` (else
`gen-omni --check` fails), on a **clean working tree** (selfcheck's `gen-commands`-drift and `gen-omni`
checks are repo-wide, not skill-scoped — an unrelated uncommitted change fails it for an unrelated
reason).
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt`
  → **exit 0** (ADR-23 born-compliant done-condition; form-level).
- `node scripts/selfcheck.mjs` → **every check PASS** (mirrors CI:
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` incl. `frontmatter.test.mjs` closed-key-set +
  description ≥20 + the shipped-skill lint dogfood; `gen-omni --check`; `bump-plugin --check`;
  `gen-commands` drift).

**Acceptance:** both commands exit 0; any ERROR fixed before reporting done. N/A-for-code — verify the
command output, not a source file.

Satisfies: ADR-23 (deterministic gate).

## Cross-Service Changes
None.

## Migration Notes
None.

## Testing Strategy
No new unit tests — the deliverable is a prose recipe. Coverage is the **existing** dev-repo gates:
`frontmatter.test.mjs` (closed key set + description **≥20 floor** — the 40–1024 band is advisory
`skill-lint` warnings, not a hard gate), the shipped-skill lint dogfood (every `plugins/nexus/skills/*`
passes `skill-lint`), and `selfcheck.mjs` (omni-sync + bump-present). Manual
smoke (owner-run, not a gate): invoke `/nexus:distill-prompt` on a deliberately verbose prompt and
confirm the distilled output preserves **every** constraint and lists its cuts/ambiguities.

## KB Impact
None — this is plugin source, not project `docs/kb/`.

## Open Questions
Two are owner-decisions (surfaced at the Phase-1 checkpoint; non-blocking for the plan). Three are
reversible defaults already baked in above, listed so the owner can override.

**Owner decisions (resolved 2026-06-20)**
1. **Version tier** — RESOLVED → **MINOR** (owner escalated). Step 3 passes `--minor`.
2. **Plan review depth** — RESOLVED → **critic (Mode 2, plan)**. Folded into `## Plan Review` below.
   The **reviewer's Step-2 code review must still be code-grounded** (read the actual SKILL.md, run
   `skill-lint`/`selfcheck`) per the shared/external-artifact mandate — a doc-only review is
   structurally blind to a malformed shipped skill.

**Reversible defaults (baked in; override if preferred)**
3. **Input mechanism** — argument text, fallback to last user message / ask. (vs require a pasted block
   or a file path.)
4. **Output shape** — distilled prompt block + a "Cut / Still-ambiguous" note. (vs distilled prompt
   only.)
5. **`disable-model-invocation: true`** — strictly human-triggered. (vs allow model auto-invocation.)

## Plan Review
**Mode 2 (plan ↔ ADR register), critic, code-grounded — 2026-06-20. Verdict: GO-with-fixes → all fixed.**
Every named path/script/flag was verified to exist; ADR tracing (ADR-23/9/6) confirmed; no CRITICAL.
**Post-critic (2026-06-20):** the authoring harness was strengthened after this review — `claude-api` +
`proven-patterns` grounding added to Step 1, and a new Step 2 `evaluate-skill` job-fitness pass inserted
(steps renumbered). These additions are purely additive quality gates (two-way door) and were **not**
re-run through the critic; re-critic optional.

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| HIGH-1 | HIGH | Description "40–1024" misattributed to `frontmatter.test.mjs` as a hard-fail; it's a `skill-lint` **warning** (W1/W2). Test's only hard floor is **≥20** (`frontmatter.test.mjs:43`). | **Fixed** — Step 1 frontmatter + Testing Strategy now state ≥20 hard / 40–1024 advisory. |
| MED-1 | MED | `skill-lint` does **not** check the closed key set; a typo'd key passes the lint and only fails `node --test`. Plan framed lint exit-0 as *the* done-condition. | **Fixed** — Step 1 acceptance + Step 3 note that the key-set guarantee is the `node --test`/selfcheck layer; both Step-3 commands load-bearing. |
| MED-2 | MED | `## Arguments` / lossless / never-invent are judgment/grep checks, not exit-0 gated — listed beside gated criteria. | **Fixed** — Step 1 acceptance split into mechanical (exit-0) vs author-verified (grep/judgment). |
| LOW-1 | LOW | `selfcheck` runs repo-wide drift gates; a dirty tree or running it before Step 2's `gen-omni` fails it for an unrelated reason. | **Fixed** — Step 3 notes run-after-gen-omni + clean-tree assumption. |

Refuted predictions (no action): `disable-model-invocation`+`user-invocable` combo is **proven** (nexus-dotnet ×3); no hidden registration step; no `gen-commands` needed; recipe stays what-not-how (no pseudo-code). Reviewed: `plan.md`.
