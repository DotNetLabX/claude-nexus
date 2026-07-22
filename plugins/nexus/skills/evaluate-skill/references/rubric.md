# Skill Quality Rubric

The evaluation standard `evaluate-skill` executes. Layer 0 is scripted; Layers 1–4 are
judgment. Fix as a **consolidating pass** — net complexity flat or down, never additive
patching. Provenance: distilled from a consumer project's evolved review standard
(Omnishelf, 2026-06), validated by a five-skill evaluation round; project specifics removed.

## Layer 0 — Mechanical (scripted: improve-skills' `skill-lint.mjs`)

All blocking; fixed (or recorded, for shipped skills) before judgment review starts.

1. UTF-8 **without BOM**; no mojibake markers.
2. Frontmatter parses; has `name:` + `description:`; `name` matches the folder name.
3. `description` is real prose stating what the skill does AND when to use it. Thinness is
   scripted (W1, the under-40-char warn); "real prose, not the skill name repeated" is judgment,
   confirmed at Layer 1.1.
4. Files the body cites relative to the skill folder exist — `references/`/`workflows/` (any
   shape), plus file-shaped `scripts/`/`assets/` paths — resolved skill-relative or at the repo root.
5. No XML-tag-shaped tokens in prose (`{placeholder}`, never angle brackets).

## Layer 1 — Contract & safety (every skill)

1. **Frontmatter promise = body behavior.** Every capability the `description` claims is
   implemented in the body; everything load-bearing in the body is discoverable from the
   frontmatter. A description too thin to evaluate against is itself a finding.
2. **Guardrail claims verified against the mechanism.** "Read-only", "never writes X",
   "draft only", "approval-gated" — find the *mechanism* (`disable-model-invocation: true`
   for side-effecting skills, absence of write instructions, an explicit stop-for-approval
   step), not just the sentence.
3. **External-system claims verified live or cited.** Any claim about an external API's
   fields, limits, or behavior must carry a dated verification or a citation to the
   project's tooling docs. (Measured defect class: a skill confidently claimed an API
   *couldn't* do something it could.)
4. **Citation audit.** Every "per `{convention}`" reference checked against the cited file —
   skills have confidently cited conventions for the *opposite* of what they say.
5. **Scope fence present** ("what this skill does NOT do") naming its adjacent skills, plus
   a downstream-consumers note for any artifact other things read.
6. **Known failure modes are encoded.** Failure branches discovered in lessons/runs appear
   in the skill's own steps or error handling — not only in the lessons file.

## Layer 2 — Legibility (too complex to follow is a defect)

1. **One concept once.** A rule lives in one place (this skill, or a shared file it
   references) — never restated with drift (AP3). Deliberate copies need a mechanical
   convergence check.
2. **Mechanical checks over exhortation.** Counts, gates, and self-checks the model must
   *emit* — not prose "be careful." A prose rule that has failed twice in run evidence MUST
   be converted to a mechanical gate or escalated; a third edit of the same prose is the
   known-failed move (P1). And is each fragile step pinned to low freedom — "run exactly this,"
   not heuristic prose? See the degrees-of-freedom axis in improve-skills' `skill-recipe.md` §2.
3. **Right weight for the job.** A light skill is a single SKILL.md (+ at most a template);
   a heavy multi-phase skill is a thin orchestrator + phase files + state. A light skill
   grown phases-in-prose, or a heavy skill whose SKILL.md duplicates its phase files, fails.
4. **Steps are followable cold.** A reader who has never run the skill can execute it
   without the author's context. Named constants in one table, not magic numbers inline.
5. **No anti-pattern from `proven-patterns.md`** (shipped with `improve-skills`) — above
   all AP1 dead-letter enforcement (any MUST/gate/cap without an executor that runs every
   pass), AP2 half-landed fixes, AP4 hardcoded inventories, AP5 fictional paths/tools,
   AP6 missing finalize path.

## Layer 3 — Capability overlays (apply the ones that match)

**Writes an external system:**
- `disable-model-invocation` considered; single-writer rule (one skill owns the write path).
- Canary-before-batch on bulk creates; produced keys/IDs recorded back into the source
  artifact; idempotent or explicitly create-vs-update moded; states what is NOT rollbackable.

**Spawns subagents / fan-out:**
- Completion is **disk-verified** via receipts/artifacts — never the agent's final message.
- Dispatch contract: subagents read their own inputs from a file list — never paste bulk
  content into N prompts.
- The orchestrator derives watermarks/cursors from written files — never lets a subagent
  compute them. States its concurrency cap and model policy.

**Iterates an unbounded list:**
- Has a volume strategy (window, cap, batch disposition for the tail) and reports honestly
  what was NOT fully covered — no silent implication of full coverage (P6).

**Resumable / long-running / multi-phase:**
- State file at phase boundaries (P2); idempotency check at entry (never reprocess what has
  a receipt); a recorded-but-empty input is skipped WITHOUT recording, so a later run can
  pick it up; a finalize-what-exists entry point (AP6).

**Stack-extension skill** (plugin dir suffix `-dotnet`/`-flutter`/`-cpp`/`-php`):
- Opens with an `## Assumes` block that is present **and honest** — it names the stack
  packages/infrastructure and reference app the body *actually* presumes (skill-recipe §4), not a
  boilerplate stub, and offers a minimal-stack branch or a one-line adaptation posture for a
  presumed package.
- The `description` names the **step-shapes plans use** — the judgment behind Layer 0.3 / 1.1's
  general description rules, checked there and not restated here — phrased with the `Use when …`
  trigger. The lint (W5/W6) checks only presence; honesty and step-shape fit are this overlay's job.

*(A consuming project may define additional overlays in its own rules — apply those too.)*

## Layer 4 — Maintenance hooks

1. Lessons-capture instruction present (on discovery, to the right file).
2. Heavy skills: changelog + version bumped on change (P10).
3. Index/registration row and frontmatter description in sync (frontmatter wins).

## Findings doc format

Header: evaluator, date, scope (exact files + versions read), run artifacts consulted.
Then one section per finding:

```markdown
## F{n}: {title}
**Severity:** Critical | High | Medium | Low
**Layer:** {0-4 / overlay name}
**Claim vs reality:** {what the skill says / what the text + run evidence shows}
**Fix:** {the consolidating fix, one move}
```

Severity: **Critical** = can corrupt an external system or silently lose pipeline data ·
**High** = produces wrong output or dead-ends a flow · **Medium** = drift, duplication,
missing fence — will bite later · **Low** = polish.

Close with a **verdict** (ACCEPT / fix-then-accept / rework) and the rubric items that were
**checked clean** — an evaluation that lists only failures hides its own coverage.
