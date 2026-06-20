# Skill Evaluation — distill-prompt (contract-fix re-eval)

**Evaluator:** developer (Step 2 job-fitness pass, adhoc-DistillPromptContractFix)
**Date:** 2026-06-20
**Scope:** `plugins/nexus/skills/distill-prompt/SKILL.md` (rewritten this round to the graduated-proposal
contract; 159 lines, closed 4-key frontmatter). No `references/`/`workflows/`/changelog (light single-SKILL.md skill).
**Run artifacts consulted:** None — the skill was rewritten this round, so this evaluates the **spec text
plus the Layer-0 form-gate result**, not observed runs (stated explicitly per rubric Process step 2).
First-pass behavior is judged from the recipe; loop-closure is judged structurally (single-shot
transform, no correction/refresh/revision lifecycle of its own). The skill's one job — strip every
run-specific data value — is verified behaviorally by the **owner smoke test (Step 6)**, recorded in
implementation.md.
**Channel:** Dev-repo carve-out (ADR-1) — shipped skill rewritten directly in `plugins/nexus/skills/`;
any fix applies directly here, NOT via the consuming-project feedback file.
**Supersedes:** `docs/skill-evals/2026-06-20-distill-prompt.md` — that eval graded the
**verbose-prompt-sharpener** job statement ("Input: a verbose / rambling / underspecified prompt"),
which is the drift, not the contract. Its ACCEPT verdict does not carry to the corrected skill.

## The job statement (the lens — the REAL contract)
- **Input:** a conversation / interaction transcript that *worked*. Source-agnostic (slash-arg = the
  transcript text; empty = the recent conversation window; else paste). Adapting project logs into a
  transcript is the *consumer's* job.
- **Output:** ONE clean, generalized, reusable prompt **+ a short title** + a "Stripped /
  Still-ambiguous" note. Returned in-conversation, never written to disk, never auto-saved.
- **Consumer:** the human who invoked `/nexus:distill-prompt`, who reviews the prompt before reusing it
  (and, downstream and out of scope here, gateway F25, which embeds the instruction server-side).
- **Excellent for that consumer:** the **converged intent + final working approach survive** and are
  re-usable, while **every run-specific data value is stripped** (generalized to its role in prose), so
  a re-fired prompt carries no stale data; genuine gaps are flagged, never invented.

## Findings

## F1: Strip-cardinal-rule and no-disk fence stated in multiple places — deliberate, not drift
**Severity:** Low
**Layer:** 2.1 (one concept once)
**Claim vs reality:** The cardinal "STRIP every run-specific data value" rule appears in the intro
(lines 12–17), its normative home in Method stage 4 (lines 79–90), the stage-7 strip self-verification
(stage 7), the Output-shape constraint, and the `## What this skill does NOT do` fence ("Carry a
run-specific data value forward — the cardinal failure"). The no-disk / never-auto-saved line likewise
appears in the description, the intro, Output shape, and the NOT-do fence. Rubric 2.1 warns against a
rule restated *with drift*.
**Assessment:** Not drift — every mention is consistent and has a single normative owner (stage 4 for
the strip rule); the others *apply* or *reference* it (stage 7 is the executable re-read, Output-shape
is the boundary statement, intro is the framing, NOT-do is the failure-mode fence). This is deliberate
emphasis on the skill's explicitly-identified #1 failure mode — the plan mandated *naming* the strip
rule as cardinal, not implying it — addressed to a model that may run this under degraded context.
Tightening to fewer mentions would weaken the guardrail against the exact failure (a surviving literal
datum) the skill exists to prevent. The prior eval reached the same disposition for the (then) lossless
rule; the verdict transfers to the inverted rule because the *structure* (one normative owner + applying
references) is identical, only the rule's content flipped.
**Fix:** None applied — keep as deliberate, consistent emphasis (no AP3 drift to consolidate). Recorded
so a future reviewer sees it was a considered choice.

## Layer-2.2 re-derivation: stage-7 re-read weight, in the STRIP direction (critic 2026-06-20, MED)
The prior eval blessed the stage-7 **keep-list** re-read as an adequate Layer-2.2 mechanism (a
model-emitted per-invocation check, correct weight for a light prose recipe with no scriptable
validator). That verdict does **not** transfer unexamined to a **strip-list** re-read — the directions
differ in failure mode: a keep-list re-read fails *safe* (a missed keep-item leaves the prompt
underspecified, which the human notices on review), while a strip-list re-read fails *unsafe* (a missed
data value leaves a stale literal in a prompt that *looks* clean — the exact form-clean/job-wrong class
of the original drift). **Re-derived verdict:** the stage-7 strip re-read is the *correct shape* for a
prose skill (P1's script-it rule does not apply — there is no scriptable "is this string a run-specific
datum" validator; whether a token is run-specific is a judgment call), but it is **explicitly an
in-prompt mitigation, not enforcement** — the same model that missed a datum can miss it on re-read. The
rewrite states this verbatim in stage 7 ("not a true enforcement … The real backstops are the contract's
human review-before-use and the owner smoke test"). The real backstops are therefore (a) the contract's
**human review-before-use** and (b) the **blocking owner smoke test (Step 6)**, which asserts on the
*emitted output* that zero data values survived. This is the honest weight — the mitigation is named as a
mitigation, and a real out-of-prompt gate (the smoke test) backstops it. Adequate; no CRITICAL/HIGH.

## Named no-overlap check — two explicit sub-checks (the discriminators differ)

The real design risk for a skill that lives next to the `learner` / `improve-skills` family. Checked
finding-by-finding against live source (`plugins/nexus/agents/learner.md`,
`plugins/nexus/skills/improve-skills/SKILL.md`):

- **vs `learner` — CLEAN.** `learner.md` (read this round): the learner *reads lessons.md +
  communication-log.md → classifies (target/channel/locus) → tracks 2+ recurrence → approval gate →
  promotes to durable system files (CLAUDE.md, conventions, skills, plugin-feedback) → tags
  [APPLIED]/[ROUTED-TO-PLUGIN]/[TRACKED] → critic Mode-3 review*. Lifecycle: a **post-pipeline
  consolidation** with a recurrence threshold, an approval gate, and writes to shared source.
  `distill-prompt` has **none** of these — no recurrence threshold, no approval gate, writes no shared
  source; it is a **single-shot transform** of one transcript into one in-conversation reusable prompt.
  Distinct inputs (lessons/comm-logs vs a transcript), outputs (durable system-file edits vs an
  ephemeral reusable prompt), and lifecycle. The proposal notes the learner *may invoke* distill-prompt
  later — they **compose, not collide**. The rewrite's NOT-do section states this discriminator
  explicitly (lines 148–152: "no recurrence threshold, no approval gate, and writes no shared source …
  a single-shot transform, not a post-pipeline consolidation. (They compose …)").

- **vs `improve-skills` — CLEAN (the more confusable boundary).** Both emit *reusable instruction text*,
  so this is the boundary an eval must inspect, not collapse into the learner check. `improve-skills`
  (SKILL.md, in context this round): authors / fixes a **durable, stored, lint-gated `SKILL.md`** —
  born compliant, registered in a skills index, run through `skill-lint` as the done-condition, logged
  to `docs/skill-backlog.md`. `distill-prompt`'s output is **ephemeral, returned in-conversation, never
  written to disk, never registered, never lint-gated**. That **no-disk / no-registration / no-lint
  line is the fence** — the rewrite states it explicitly (lines 153–157: "distill output is
  ephemeral … never written to disk, never registered, never lint-gated; improve-skills authors a
  durable, stored, lint-gated SKILL.md … Both emit reusable instruction text, so this … is the fence").

A finding that the skill blurred into either neighbor's job would be CRITICAL/HIGH. **None found** — the
discriminators are stated, distinct, and accurate against live source.

## Rubric items checked clean
- **Layer 0 (mechanical):** skill-lint exit 0 (verified this round); UTF-8 no BOM (first 3 bytes
  `2d2d2d`); frontmatter parses; `name` == folder `distill-prompt`; `description` is real prose (489
  chars) stating what (transcript → ONE reusable prompt + title, strip data / keep intent,
  source-agnostic) + when (human invokes `/nexus:distill-prompt`); no `references/`/`workflows/` cited
  (nothing to dangle); no `{placeholder}` / angle-bracket tokens in prose (the one `{placeholder}`
  mention is inside backticks as the *prohibited* token, not an emitted placeholder); no skills index to
  register against (project README is prose).
- **Layer 1.1 promise=behavior:** every description claim (conversation→reusable-prompt; ONE prompt +
  title; strip run-specific data; keep converged intent/approach; source-agnostic; human-triggered;
  never auto-saved) is implemented in the body.
- **Layer 1.2 guardrail mechanisms:** "human-triggered only" → `disable-model-invocation: true`
  (present); "nothing written to disk / never auto-saved" → no write instruction + explicit "Write any
  file" NOT-do entry + Output-shape restatement.
- **Layer 1.3 external-system claims:** none made (no API/SDK claims) — N/A. (The reusable prompt's
  target *structure* is grounded in canonical prompt-engineering guidance via `claude-api`, but the
  skill claims no API field/limit/behavior.)
- **Layer 1.4 citation audit:** `create-feature-spec` cited as the idea-to-spec owner (verified: that
  skill exists and that is its job); `learner` and `improve-skills` cited as adjacent owners (verified
  against `learner.md` + `improve-skills/SKILL.md` this round — citations match what those say).
- **Layer 1.5 scope fence:** `## Scope` + `## What this skill does NOT do` present, name adjacent
  `learner` / `improve-skills` / `create-feature-spec` with discriminators; downstream consumer (gateway
  F25) is correctly out of scope (separate KG change) and not a file-consumer of this skill's output
  (in-conversation output only), so no consumers note required.
- **Layer 1.6 failure modes encoded:** carry-a-stale-datum (stage 4 + stage-7 strip re-read + NOT-do
  "cardinal failure") and invent-a-requirement/value (stage 6 + NOT-do fence) both in the skill's own
  steps.
- **Layer 2.2 mechanical-over-exhortation:** stage-7 strip re-read is a model-emitted per-invocation
  check, correctly weighted and **named as a mitigation, not enforcement**, with the smoke test as the
  real out-of-prompt backstop (see the Layer-2.2 re-derivation above).
- **Layer 2.3 right weight:** single SKILL.md, no phase bloat — correct for a light single-shot skill.
- **Layer 2.4 followable cold:** 7 ordered stages, each naming its product; the cardinal rule + the
  inseparable-datum boundary case are spelled out; executable without author context.
- **Layer 2.5 anti-patterns:** AP1 (every MUST addressed to "you, the model running this skill"; the one
  un-scriptable gate — the strip — is honestly a mitigation backed by the smoke-test gate, not a
  dead-letter "refuses to" with no executor), AP5 (every named skill — `learner`, `improve-skills`,
  `create-feature-spec`, `claude-api` — verified to exist), no AP2/AP4/AP6.
- **Layer 3 overlays:** none match — single-shot in-conversation transform; not external-write (no disk
  write), not subagent-spawning, not unbounded-iteration, not resumable/multi-phase. Nothing to fail.
- **Layer 4 maintenance:** light single-shot utility — lessons-capture/changelog/index hooks are
  pipeline- and plugin-level, not baked per utility skill (matches shipped peers `research`,
  `evaluate-skill`). N/A.

## Verdict
**ACCEPT.** Evaluated against the **corrected** conversation→reusable-prompt job statement (the prior
ACCEPT graded the wrong, prompt-sharpener lens — that is the drift this pass corrects). First-pass
quality is sound: the recipe produces the right output shape (title + ONE generalized reusable prompt +
Stripped/Still-ambiguous note), names the STRIP-run-specific-data cardinal rule explicitly, keeps the
converged intent/approach, holds the never-invent rule, and resolves the inseparable-datum boundary case.
Job fitness across its life: a single-shot transform with no correction/refresh/revision lifecycle, so
loop-closure is not at risk. **No-overlap vs `learner` and vs `improve-skills`** checked against live
source — both CLEAN, discriminators stated and accurate. **No CRITICAL / HIGH / MEDIUM findings**; the
single LOW (consistent multi-location emphasis of the cardinal rule and the no-disk fence) is deliberate,
with a single normative owner — no consolidating change warranted. The Layer-2.2 strip-re-read weight was
re-derived in the strip direction (MED concern from the critic) and resolved: correct shape for a prose
skill, honestly named as a mitigation, backstopped by the blocking owner smoke test (Step 6).

## improve-skills routing
No CRITICAL/HIGH/MEDIUM finding to fold back. The one LOW is keep-as-is (deliberate emphasis, single
normative owner, no AP3 drift), so there is no net-complexity-reducing consolidation for `improve-skills`
to apply. Per plan Step 2 acceptance, this LOW is explicitly dispositioned here (kept, with reason)
rather than waived silently. `improve-skills` was invoked in Step 1 (the rewrite ran under its "For
Existing Skills" whole-skill-reframe path with `skill-lint` as the done-condition); no second
consolidating pass is triggered because the re-eval surfaced nothing to fold.
