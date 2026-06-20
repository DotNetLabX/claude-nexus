# Skill Evaluation — distill-prompt

**Evaluator:** developer (Step 2 job-fitness pass, adhoc-DistillPrompt)
**Date:** 2026-06-20
**Scope:** `plugins/nexus/skills/distill-prompt/SKILL.md` (authored this round; 114 lines, closed 4-key frontmatter). No `references/`/`workflows/`/changelog (light single-SKILL.md skill).
**Run artifacts consulted:** None — the skill is newly authored this round, so this evaluates the **spec text plus the Layer-0 form-gate result**, not observed runs. Stated explicitly per rubric Process step 2. First-pass behavior is judged from the recipe; loop-closure is judged structurally (single-shot transform, no correction/refresh/revision lifecycle).
**Channel:** Dev-repo carve-out (ADR-1) — shipped skill authored directly in `plugins/nexus/skills/`; any fix applies directly here, NOT via the consuming-project feedback file.

## The job statement (the lens)
- **Input:** a verbose / rambling / underspecified prompt (slash-command arg, else last user prompt, else paste).
- **Output:** a ready-to-paste distilled prompt block + a "Cut / Still-ambiguous" note.
- **Consumer:** the human who invoked `/nexus:distill-prompt`, who then sends the block to a model.
- **Excellent for that consumer:** the distilled prompt is tighter AND carries every load-bearing requirement (lossless), with genuine gaps flagged rather than invented.

## Findings

## F1: Lossless-on-requirements rule stated in four places
**Severity:** Low
**Layer:** 2.1 (one concept once)
**Claim vs reality:** The cardinal "lossless on requirements" rule appears in the intro (lines 11–14), its normative home in Method stage 4 (lines 64–68), the stage-7 self-check (line 87), and the Scope fence (line 102). Rubric 2.1 warns against a rule restated with *drift*.
**Assessment:** Not drift — the four mentions are consistent and have a single normative owner (stage 4); the others *apply* or *reference* it (stage 7 is the executable check, scope is the boundary statement, intro is the framing). This is deliberate emphasis on the skill's explicitly-identified #1 failure mode (the plan mandated naming it, not implying it), addressed to a model that may run this under degraded context. Tightening to fewer mentions would weaken the guardrail against the exact failure the skill exists to prevent.
**Fix:** None applied — keep as deliberate, consistent emphasis (no AP3 drift to consolidate). Recorded so a future reviewer sees it was a considered choice, not accidental duplication.

## Rubric items checked clean
- **Layer 0 (mechanical):** skill-lint exit 0; UTF-8 no BOM; frontmatter parses; `name` == folder `distill-prompt`; description is real prose (369 chars) stating what + when; no `references/`/`workflows/` cited (nothing to dangle); no XML/angle-bracket tokens in prose; no skills index to register against (project README is prose).
- **Layer 1.1 promise=behavior:** every description claim (verbose→tight rewrite; lossless; human-triggered) is implemented in the body.
- **Layer 1.2 guardrail mechanisms:** "human-triggered only" → `disable-model-invocation: true` (present); "nothing written to disk" → no write instruction + explicit "Write any file" NOT-do entry.
- **Layer 1.3 external-system claims:** none made (no API/SDK claims) — N/A.
- **Layer 1.4 citation audit:** `create-feature-spec` cited as the idea-to-spec owner — verified the skill exists and that is its actual job.
- **Layer 1.5 scope fence:** `## Scope` + `## What this skill does NOT do` present, names adjacent `create-feature-spec`; no downstream file-consumers (in-conversation output only), so no consumers note required.
- **Layer 1.6 failure modes encoded:** drop-a-requirement (stage 4 + stage-7 check) and invent-a-requirement (stage 6 + NOT-do fence) both in the skill's own steps.
- **Layer 2.2 mechanical-over-exhortation:** stage-7 keep-list re-read is a model-emitted per-invocation check (correct weight for a light prose recipe — not scriptable, so P1's script-it rule does not apply).
- **Layer 2.3 right weight:** single SKILL.md, no phase bloat — correct for a light single-shot skill.
- **Layer 2.4 followable cold:** 7 ordered stages, each naming its product; executable without author context.
- **Layer 2.5 anti-patterns:** AP1 (every MUST addressed to "you, the model running this skill"), AP5 (every named path/tool verified), no AP4/AP6.
- **Layer 3 overlays:** none match — single-shot in-conversation transform; not external-write, not subagent-spawning, not unbounded-iteration, not resumable/multi-phase. Nothing to fail.
- **Layer 4 maintenance:** light single-shot utility — lessons-capture/changelog/index hooks are pipeline- and plugin-level, not baked per utility skill (matches shipped peers `research`, `evaluate-skill`). N/A.

## Verdict
**ACCEPT.** First-pass quality is sound (the recipe produces the right output shape with the lossless and never-invent guardrails named explicitly). Job fitness across its life: the skill is a single-shot transform with no correction/refresh/revision lifecycle of its own, so loop-closure is not at risk. No CRITICAL / HIGH / MEDIUM findings; the single LOW is deliberate, consistent emphasis with a single normative owner — no consolidating change warranted.

## improve-skills routing
No CRITICAL/HIGH finding to fold back. The one LOW is keep-as-is (deliberate emphasis, no drift), so there is no net-complexity-reducing consolidation for `improve-skills` to apply. Per plan Step 2 acceptance, this LOW is explicitly dispositioned here (kept, with reason) rather than waived silently.
