# Distill-Prompt — Contract Fix (supersede the prompt-sharpener)

**Feature Spec:** None — ad-hoc technical feature. The architect owns the definition (ADR-27). The
binding input is the **graduated proposal** `D:\src\knowledge-gateway\docs\plugin-feedback\nexus-distill-prompt-skill-2026-06-19.md` (the real cross-repo contract) + the owner's resolution of its two open decisions (2026-06-20), **not** a `spec.md` and **not** the prior nexus charter (which drifted).

## Context
The shipped `distill-prompt` skill (1.16.x) **drifted from its contract.** The real proposal defines a
*conversation → reusable-prompt* compaction skill; the nexus build narrowed it to a *single-prompt
sharpener* with the **opposite cardinal rule** (lossless / keep values). The Step-2 eval
(`docs/skill-evals/2026-06-20-distill-prompt.md`) graded ACCEPT **against the wrong job statement**
("Input: a verbose/rambling/underspecified prompt"), so the drift went uncaught.

This pass **rewrites `distill-prompt` in place to its real contract.** It is **one skill, not two** — the
name (`distill-prompt`), location (`plugins/nexus/skills/distill-prompt/`), and standalone/user-invocable
posture are decided-no-veto in the proposal; this **supersedes** the prompt-sharpener. Two-way door
(ADR-25) → single plan, no tech-spec, no options panel.

**The contract (binding):**
- **Input:** a conversation / interaction transcript that *worked*. **Source-agnostic** — live chat, a
  pasted exchange, or a project's session logs adapted into a transcript by the *consumer* (not the
  skill's job).
- **Output:** **ONE** clean, generalized, reusable prompt **+ a short title.** Human-reviewed before use,
  never auto-saved, nothing written to disk.
- **Generalization contract:** **KEEP** the converged intent + the final working approach ("only the
  final working version matters"). **STRIP** iteration/back-and-forth noise ("a typo fixed on retry-1 is
  noise"), verbatim message text, and **run-specific data values** (categories, dates, brand/SKU names,
  IDs, sheet URLs, specific retrieved figures) so a re-fired prompt carries no stale data.
- **Output mode (owner-decided 2026-06-20):** **prose-only.** Defer the optional `[placeholder]`
  parameterization until analytics needs it (proposal D1; owner chose prose).
- **Keep intact from the current skill:** the 7-stage discipline, the never-invent rule,
  review-before-use, human-triggered (`disable-model-invocation: true`), no-disk.

**The portability boundary (load-bearing scope fence).** The skill contains **none** of the
promotion/storage pipeline: no storage/sharing/dedup/recurrence-detection/shared library, no Sheet/YAML
"prompt library", no parameter format, no AM role, no grounding dictionaries, no SQL/category linting, no
promotion threshold, no `[APPLIED]`/`[TRACKED]` idempotency tagging. Those are **project-local (analytics)
or already the `learner`'s / `improve-skills`' job.** A skill polluted with any of them stops being
portable — and this is the **no-overlap axis** the evaluate-skill pass must check (vs `learner` /
`improve-skills`, NOT vs a sibling skill).

**Downstream consumer (OUT of scope here):** gateway **F25** embeds this skill's instruction server-side
as the single source of truth (proposal D2, owner-confirmed yes). That re-point is a **separate change in
`knowledge-gateway`, routed to the PO** — not part of this nexus pass. Flagged so it is not lost.

**Architect-owned definition companion (recommended, see checkpoint):** extract the proposal's boundary
decision as **ADR-34** in `docs/architecture/README.md` (the proposal pre-drafted the text). The drift's
*root cause* was that this boundary was never recorded as an ADR, so the charter narrowed it freely.
Recording it is the durable fix against re-drift. ADR extraction is architect-owned (ADR-27/28), not a
developer step.

## Scope
**In scope (developer-executable)**
- Rewrite `plugins/nexus/skills/distill-prompt/SKILL.md` to the contract above (same file/name/frontmatter
  keys).
- Re-run `evaluate-skill` against the **correct** job statement; supersede the stale eval; fold findings
  via `improve-skills`.
- Version bump (`release-plugin`) + omni twin regeneration (ADR-6/9); changelog entry.
- Update the `docs/skill-backlog.md` entry for `distill-prompt`.

**Out of scope**
- The `[placeholder]` parameterization mode (deferred — owner D1).
- Any promotion/storage/recurrence/library concern (the portability boundary above).
- The gateway F25 endpoint re-point (separate KG change, PO-routed).
- ADR-34 extraction is architect-owned (not in the developer step list); tracked as a companion action.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills (+ claude-api, proven-patterns) | Follow | no | rewrite `distill-prompt`; conversation→reusable-prompt; strip-data/keep-intent 7-stage recipe; prose-only; learner/improve-skills boundary fence | |
| 2 | evaluate-skill | Follow | no | re-eval against the **conversation→reusable-prompt** job statement; **no-overlap vs learner/improve-skills**; supersede stale eval; fix findings via improve-skills | |
| 3 | release-plugin | Follow | no | bump `plugins/nexus` 1.16.1 → **1.17.0 (MINOR, owner-decided)**; run `gen-omni` | |
| 4 | (none) | — | no | update `docs/skill-backlog.md` distill-prompt entry | |
| 5 | (none) | — | no | run `skill-lint` + `selfcheck`; both exit 0 | |
| 6 | (none) | — | no | **behavioral acceptance** — owner-run smoke test on a real transcript; output recorded in implementation.md; **blocking** | |

**The full authoring harness, not just form-lint.** Step 1 grounds the recipe in `claude-api` (the output
*is* a prompt, so canonical prompt-engineering structure applies) and `proven-patterns`; Step 2 runs the
job-fitness `evaluate-skill` pass against the corrected lens (ADR-23: a well-formed skill can still do the
wrong job — which is exactly what happened). **Not all-`None`:** Steps 1–3 map skills → the done-check
expects `improve-skills`, `evaluate-skill`, `release-plugin` in `.claude/audit/skill-invocations.log`. TDD
`no` throughout — prose recipe; the gate is the harness + the owner smoke test.

## Domain Model Changes
None.

## Data Model Changes
None.

## Implementation Steps

### Step 1 — Rewrite `plugins/nexus/skills/distill-prompt/SKILL.md` to the contract
**Follow `improve-skills`** ("For Existing Skills" — whole-skill reframe, net complexity flat/down, not
additive patching) with `skill-lint` as the done-condition. **Dev-repo carve-out (ADR-1):** edit the
shipped file **directly** in `plugins/nexus/skills/` — Write tool, **UTF-8 without BOM** (ADR-23).

This **supersedes** the current content. Keep the closed 4-key frontmatter
(`name/description/user-invocable/disable-model-invocation`), `name: distill-prompt`,
`disable-model-invocation: true`. **Rewrite the `description`** to: turns a *conversation/transcript* into
**ONE reusable prompt + a title**, stripping run-specific data + iteration noise while keeping the
converged intent/approach; human-invoked; source-agnostic. It must read clearly as the
conversation→reusable-prompt job (the old verbose-prompt-sharpener wording is the drift — replace it).

**Recipe body** — keep the 7-stage discipline; invert the cardinal rule. Describe *what each stage
produces* (no pseudo-code):
1. **Take the input** — a conversation/interaction transcript. **Source-agnostic:** slash-arg = the
   transcript text; empty = the recent conversation window in context; else ask the user to paste it.
   Document in `## Arguments`, and state explicitly that adapting project logs into a transcript is the
   *consumer's* job, not the skill's.
2. **Extract the converged intent + a title** — the refined ask the conversation arrived at (the final
   working version), in one sentence, plus a short descriptive **title** for the reusable prompt.
3. **Separate the final working approach (KEEP) from the noise (DROP)** — keep the converged approach
   ("only the final working version matters"); drop iteration/back-and-forth (a typo fixed on retry-1 is
   noise), dead ends, and verbatim message text.
4. **Cardinal rule (state explicitly — the inverse of the old skill): STRIP every run-specific data
   value** — categories, dates, brand/SKU names, IDs, sheet URLs, specific retrieved figures — and
   **generalize it into role-descriptive prose** so a re-fired prompt carries **no stale data**. KEEP the
   intent and the approach; STRIP the data. **Prose-only:** generalize in words, do **not** emit
   `{placeholder}`/`[placeholder]` tokens (deferred). This is the #1 thing the skill exists to do; name it
   as the cardinal rule, do not imply it.
   **Inseparable-datum rule (resolve the boundary case):** when a datum is inseparable from the converged
   intent (e.g. "always export Chips because Chips is the pilot category"), generalize the **role** it
   plays ("the pilot category") rather than dropping the constraint, and **flag the specific value in the
   Stripped/Still-ambiguous note** so the human can re-supply it. Never silently bake the literal back in.
5. **Cut the padding/noise** — emit only the reusable-prompt content (folds with stage 3; remove
   pleasantries, narration, meta-commentary).
6. **Surface implicit/ambiguous — never invent** — make underspecified parts of the reusable ask explicit
   where intent is unambiguous; **flag** genuine gaps as open questions; **never invent** a requirement or
   a data value. State the never-invent rule explicitly.
7. **Restructure + output + self-verify** — emit the parts in **Output shape** below, then **re-read the
   emitted prompt and confirm no run-specific data value survived** — if any literal datum remains,
   generalize it before returning. *(This re-read is the strongest **in-prompt mitigation** available for a
   prose skill — not a true enforcement: the same model that missed a datum can miss it on re-read. The
   real backstops are the contract's **human review-before-use** and the **owner smoke test (Step 6)**.
   Mirrors the old stage-7 keep-list re-read, inverted to a strip-list re-read.)*

**Output shape:** (1) a short **title**; (2) **ONE** clean, generalized, reusable **prompt** as a
self-contained block in a model-friendly shape (task / context / constraints / output-format); (3) a short
**"Stripped / Still-ambiguous"** note — what run-specific data was removed and any open questions — so the
human can **review before use**. Nothing is written to disk; never auto-saved.

**Scope fence (the portability boundary — must be in `## Scope` + `## What this skill does NOT do`):**
- **In:** transcript → one reusable prompt + title (the pure compaction atom). Source-agnostic.
- **Out:** **none** of the promotion/storage pipeline — no storage/sharing/dedup/recurrence-detection/
  shared library; no Sheet/YAML "prompt library"; no parameter/`{category=...}` format; no AM role; no
  grounding dictionaries; no SQL/category linting; no promotion threshold; no `[APPLIED]`/`[TRACKED]`
  tagging. Those are **project-local (analytics) or the `learner`'s / `improve-skills`' job** — name both
  as the adjacent owners **and state each discriminator** (the load-bearing fences differ):
  - **vs `learner`** — distill-prompt has no recurrence threshold, no approval gate, and writes no shared
    source; it is a single-shot transform, not a post-pipeline consolidation. (They *compose*: the learner
    may invoke distill-prompt.)
  - **vs `improve-skills`** — distill-prompt's output is **ephemeral, returned in-conversation, never
    written to disk, never registered or lint-gated**; `improve-skills` authors a **durable, stored,
    lint-gated `SKILL.md`**. This no-disk/no-registration line is the fence (both emit reusable instruction
    text, so this is the more confusable boundary — state it explicitly).

  Also out: not a lossy *content* summarizer; not an idea→spec shaper (`create-feature-spec`).

**Domain grounding (do before writing):**
- **Invoke `claude-api`** — the reusable prompt's target structure (clear & direct, role/context, explicit
  output format, examples, reasoning room) is grounded in canonical Anthropic prompt-engineering guidance.
  **`claude-api` is a runtime-loaded skill, not a file on disk** — the verb is *invoke*, not *read*.
  **Fallback (do not ground from memory):** if `claude-api` does not surface as an invokable skill, ground
  the structure from the current skill's existing "What good looks like" section
  (`plugins/nexus/skills/distill-prompt/SKILL.md:30–43`, itself derived from canonical guidance).
- **Read `plugins/nexus/skills/improve-skills/references/proven-patterns.md`** (P1–P11 / AP1–AP7); design
  against it directly.
- **Read the current `plugins/nexus/skills/distill-prompt/SKILL.md`** — this is what you are replacing;
  preserve its 7-stage/never-invent/no-disk discipline, invert its cardinal rule. **Confidence: high.**

**Acceptance — mechanical (exit-0 gates, verified in Step 5):**
- `name` = folder; `description` present (≥20, `frontmatter.test.mjs:43`); frontmatter exactly the 4 keys.
- No BOM (lint E2); no XML/angle-bracket tokens in prose (lint E7).

**Acceptance — author-verified (grep/judgment):** the body covers all 7 stages; the **STRIP-run-specific-
data** cardinal rule, the **keep-intent/strip-data** distinction, the **prose-only / no-placeholder**
decision, the **never-invent** rule, and the **stage-7 strip self-verification** are each stated
explicitly; `## Arguments` documents the source-agnostic transcript input + fallback; the `## Scope` /
NOT-do sections fence out the promotion/storage pipeline and name `learner` / `improve-skills` as the
adjacent owners — grep the body for each.

**Acceptance — behavioral:** the skill's one job (strip every run-specific data value) is verified by the
**blocking owner smoke test in Step 6** — not a code gate, but a blocking checkpoint gated at the
done-check from the recorded output. See Step 6.

Satisfies: ADR-23 (born-compliant skill); the graduated proposal's generalization contract (2026-06-19);
owner D1=prose (2026-06-20).

### Step 2 — Re-eval (`evaluate-skill`) against the CORRECT job statement
**Follow `evaluate-skill`** on the rewritten skill, with the job statement set to the **real contract**:
*Input = a conversation/transcript; Output = ONE reusable prompt + title; Excellent = the converged intent
+ approach survive while every run-specific data value is stripped.* The prior eval graded the
verbose-prompt-sharpener lens and ACCEPTed the drift — that lens is wrong; do not reuse it.

**Named no-overlap check — two explicit sub-checks (the discriminators differ):**
- **vs `learner`** — confirm distill-prompt has no recurrence threshold, no approval gate, and writes no
  shared source (lifecycle distinction: single-shot transform vs post-pipeline consolidation).
- **vs `improve-skills`** — confirm distill-prompt's output is **ephemeral/in-conversation/never written
  to disk/never registered or lint-gated**, vs improve-skills authoring a **durable, lint-gated SKILL.md**.
  Both emit reusable instruction text, so this is the more confusable boundary — the eval must inspect it,
  not collapse it into the learner check.

A finding that the skill blurs into either neighbor's job is CRITICAL/HIGH and must be resolved. **Also
re-derive the Layer-2.2 weight for the stage-7 re-read in the *strip* direction** — the prior eval blessed
the *keep-list* re-read; that verdict does not transfer unexamined to a strip-list re-read (MED, critic
2026-06-20).

**Supersede the stale eval — don't delete.** Mark `docs/skill-evals/2026-06-20-distill-prompt.md`
`Status: superseded` (wrong job statement) and write the new eval alongside (e.g.
`docs/skill-evals/2026-06-20-distill-prompt-contractfix.md`). Fold any CRITICAL/HIGH findings back via
**`improve-skills`** (consolidating, net complexity flat/down).

**Acceptance:** the re-eval ran against the corrected job statement; the no-overlap-vs-learner/improve-skills
check is recorded; every CRITICAL/HIGH resolved (or waived with reason in implementation.md); the stale
eval is marked superseded; `evaluate-skill` + `improve-skills` both appear in the skill-invocations log.

Satisfies: ADR-23 (judgment layer); the drift's root-cause class (wrong-lens eval).

### Step 3 — Bump the plugin + sync the twin
**Follow `release-plugin`** (ADR-9). **Files:** `plugins/nexus/.claude-plugin/plugin.json` (`version`),
`plugins/nexus/CHANGELOG.md`.
- `node scripts/bump-plugin.mjs --dry-run`, then the real bump: **`--minor` → 1.16.1 → 1.17.0**
  (owner-decided 2026-06-20).
- No `gen-commands` step — no agent file changed.
- Regenerate the twin: `node scripts/gen-omni.mjs` (ADR-6). The twin's commit in `../omni` is the owner's
  follow-up (CLAUDE.md mirroring convention) — not a developer step.

**Acceptance:** `version` = **1.17.0**; `CHANGELOG.md` entry present;
`node scripts/bump-plugin.mjs --check` clean; `gen-omni` run.

Satisfies: ADR-9 (release); ADR-6 (twin sync).

### Step 4 — Update the skill-backlog entry
**Skill: None.** **File:** `docs/skill-backlog.md`. Add an entry under **`## Skills Fixed`** for
`distill-prompt` (Type: Fix; Source: adhoc-DistillPromptContractFix; Date: 2026-06-20) describing the
contract correction — conversation→reusable-prompt, strip run-specific data / keep converged intent,
prose-only, the learner/improve-skills boundary, and the re-eval verdict. The existing
`## Skills Created` entry (which describes the prompt-sharpener) stays as the audit trail of what was first
built — **but add a one-line forward-marker to it** (e.g. "**Superseded by the Fixed entry below
(adhoc-DistillPromptContractFix) — original build drifted from contract.**") so the stale description
cannot be read as current (mirrors the eval's `Status: superseded` treatment; supersede-don't-delete).

**Acceptance:** a `Skills Fixed` entry for `distill-prompt` exists, dated, sourced to this slug; the
existing `Skills Created` entry carries the forward-marker.

Satisfies: proposal apply-plan step 5 (register in skill-backlog).

### Step 5 — Terminal gate: lint + selfcheck green
**Skill: None** (verification). Both load-bearing — `skill-lint` checks form; the closed key set +
description floor live in the `node --test` layer inside selfcheck. Run selfcheck **after** Step 3's
`gen-omni`, on a **clean working tree** (drift checks are repo-wide).
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt`
  → **exit 0**.
- `node scripts/selfcheck.mjs` → **every check PASS** (`node --test tests/lint/*.test.mjs
  tests/unit/*.test.mjs` incl. `frontmatter.test.mjs` + shipped-skill lint dogfood; `gen-omni --check`;
  `bump-plugin --check`; `gen-commands` drift).

**Acceptance:** both exit 0; any ERROR fixed before reporting done. N/A-for-code — verify command output.

Satisfies: ADR-23 (deterministic gate).

### Step 6 — Behavioral acceptance (blocking, owner-run)
**Skill: None.** The form gates (Steps 1, 5) prove the skill is *well-formed*; **none of them proves it
does its one job** (strip every run-specific data value). This is exactly the form-clean / job-wrong class
the original drift belongs to — so the behavioral check is a **blocking checkpoint**, not advisory.

Run `/nexus:distill-prompt` on a **real multi-turn data-analysis transcript** containing literal figures,
dates, and SKU/brand names. **Record the emitted output verbatim in `implementation.md`** (a new
`## Behavioral Acceptance` note). The done-check verifies, from that recorded output, that:
- **zero** run-specific data value survived (each generalized into prose);
- the **converged approach** is intact and the prompt is re-usable;
- a **title** and a **Stripped / Still-ambiguous** note are present.

*(Assertion on the recorded **output**, never a source grep — a source grep matches the recipe's own
description of the rule; `create-implementation-plan` acceptance-mechanism rule (ii).)* If it fails, the
fix is **content-only** (regenerate the recipe wording) — the 1.17.0 version is unaffected.

**Acceptance:** `implementation.md` carries the `## Behavioral Acceptance` note with the recorded output;
the done-check confirms the three conditions above. **This gate and Step 5 together are the close
condition.**

Satisfies: the contract's strip cardinal rule (the only verification that it *fires*, not just that it is
*stated*); ADR-23 (job-fitness, not just form).

## Cross-Service Changes
None in nexus. (Gateway F25 re-point is a separate KG change, PO-routed — see Context.)

## Migration Notes
The skill's behavior **reverses** (keep-values → strip-values; prompt → conversation). Any consumer that
embedded the *old* distill-prompt instruction expecting lossless prompt-sharpening must be re-pointed —
the only known consumer is gateway F25, which *wants* the new behavior (so this is a fix, not a break, for
it). No other nexus-internal consumer.

## Testing Strategy
No new unit tests — prose recipe. Coverage = existing dev-repo gates (`frontmatter.test.mjs`, shipped-skill
lint dogfood, `selfcheck.mjs`) + the **owner smoke test** in Step 1 (real transcript → zero surviving data
values, converged approach intact).

## KB Impact
None — plugin source, not project `docs/kb/`.

## Open Decisions — RESOLVED (owner, 2026-06-20)
1. **Version tier — RESOLVED → MINOR (1.16.1 → 1.17.0).** Behavior reversal, but the plugin `version` is
   plugin-wide, the skill is days old with no adopters, and the rewrite corrects a drift to the original
   contract. Step 3 passes `--minor`.
2. **ADR-34 extraction — RESOLVED → yes; DONE.** Extracted to `docs/architecture/README.md` (index +
   body) by the architect: "Distillation is a portable nexus skill — the pure compaction mechanism only."
   The durable fix against re-drift (root cause was an unrecorded boundary).

## Plan Review
**Code-grounded self-review (architect, 2026-06-20). Verdict: GO — no CRITICAL/HIGH; 2 owner decisions
open (not defects).** **Disclosure:** this is a *self-review in the authoring context*, not an independent
pass — the critic spawn was unavailable (transient Opus classifier outage). The **load-bearing part is
satisfied** (I read the live files / verified facts first-hand, the mandate for shared-artifact passes),
but an **independent fresh-context critic pass is still owed** before the developer begins; retry the
`nexus:critic` spawn (Mode 2, code-grounded) when Opus recovers.

Verified first-hand against live source:
- Paths/scripts exist: `scripts/bump-plugin.mjs`, `scripts/gen-omni.mjs`, `scripts/selfcheck.mjs`,
  `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs`.
- `tests/lint/frontmatter.test.mjs:13` — `SKILL_KEYS` is exactly `name/description/user-invocable/
  disable-model-invocation`; `:43` — skill description floor is `>= 20`. Plan citation correct.
- `plugin.json` = 1.16.1; ADR-33 is the highest existing → **ADR-34 is the next free number**; ADR-1/6/9/
  23/25/27/28 all exist and match their attributions.
- **No-overlap (the real design risk):** read `plugins/nexus/agents/learner.md` — the learner consolidates
  *lessons → durable system-file edits* (recurrence threshold, approval gate, writes shared source);
  distill-prompt is *transcript → one in-conversation reusable prompt* (no storage/threshold/promotion).
  Distinct inputs, outputs, and lifecycle; the proposal notes the learner *may invoke* distill-prompt
  later — they compose, not collide. Boundary holds **iff** Step-1's NOT-do section names learner/
  improve-skills as the adjacent owners (Step 1 mandates this — verify at done-check).
- **Strip self-verification enforcement** is the same shape the prior eval blessed (Layer 2.2: a
  per-invocation model-emitted check, correct weight for a light prose recipe) — adequate for a prose
  skill with no scriptable validator.

Owner decisions (both resolved 2026-06-20): version tier → **MINOR (1.17.0)**; ADR-34 → **extracted**.

**Independent critic pass (nexus:critic, Mode 2, code-grounded — 2026-06-20, after Opus recovered).
Verdict: GO-with-fixes → all accepted findings folded.** The critic read the proposal, the current
SKILL.md, `learner.md`, `improve-skills/SKILL.md`, ADR-34, `frontmatter.test.mjs`, and verified every named
path/flag. No CRITICAL. Contract fidelity and ADR-34 accuracy confirmed clean.

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| HIGH-1 | HIGH | No-overlap check under-specified vs `improve-skills` (the more confusable boundary — both emit reusable instruction text) | **Fixed** — Step 1 NOT-do + Step 2 now carry two explicit discriminators (learner = lifecycle; improve-skills = ephemeral/no-disk vs durable/lint-gated). |
| HIGH-2 | HIGH | `claude-api` is a runtime skill, not on disk; no fallback → risk of grounding from memory | **Fixed** — Step 1 grounding adds a no-memory fallback to the current SKILL.md:30–43. |
| HIGH-3 | HIGH | Every blocking gate is form-only; the smoke test (only real check of the skill's job) was non-blocking | **Fixed** — added blocking **Step 6** (behavioral acceptance, recorded in implementation.md, gated at done-check). |
| MED-1 | MED | Stage-7 re-read over-claimed as "enforcement"; it's a mitigation, and the eval blessed the *inverse* rule | **Fixed** — stage-7 reworded to "in-prompt mitigation"; Step 2 re-derives the Layer-2.2 weight for the strip direction. |
| MED-2 | MED | Stale `Skills Created` backlog entry (prompt-sharpener description) lacks a forward-marker | **Fixed** — Step 4 now adds a forward-marker to the Created entry. |
| edge | MED | Datum inseparable from intent ("Chips is the pilot category") — strip or keep? unresolved | **Fixed** — Step 1 stage 4 adds the inseparable-datum rule (generalize the role, flag the value). |
| LOW-1 | LOW | Step 5 clean-tree precondition vs pre-existing uncommitted tree | **No change** — already stated; the known `gen-commands` false-positive (resolves at team-lead commit). |
