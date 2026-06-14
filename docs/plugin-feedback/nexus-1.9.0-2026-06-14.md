# nexus plugin feedback — v1.9.0 / 2026-06-14

Consolidated by the **learner** across **three projects' completed pipelines**, sweeping both
`lessons.md` **and** `communication-log.md` Runtime/Plugin Issues sections:

- **nexus** (this dev repo) — `adhoc-PipelineHardening`, `adhoc-VwhSelfcheckAndPrinciple`,
  `adhoc-DotnetSkillSweep`, `adhoc-PipelineGatesHardening`, `adhoc-ConfidenceGatedResearch`,
  `adhoc-BuildFlowFormalization`.
- **sprint-rituals** — Pass0…Pass5 + Pass3b/3c family, `adhoc-ReflektLiftAndShift`,
  `adhoc-VwhEvaluationFollowup` (12 pipelines).
- **knowledge-gateway** — F1–F11, F16, `adhoc-AnalyticsDraftToAgent`, `adhoc-DataPointProfiles`;
  its own outbound `docs/plugin-feedback/nexus-1.4.1-2026-06-11.md` (already learner-classified there)
  is **received and merged here**.

Each promoted item recurs across **2+ features** and is **not** already enforced by shipped source
(re-verified against the live 1.9.0 tree on 2026-06-14). Items that merely confirm an existing rule
were pruned, not listed (code-grounded-critic mandate; Phase-2 fresh-spawn `team-lead.md:91`;
research-helper/placeholder contract `agents-workflow.md:90-91`; final-message-is-deliverable
`agents-workflow.md:89`; confidence-label + offer-research `agents-workflow.md:92-93`;
no-self-advance — already routed from sprint-rituals Pass3b/3c).

> **Dev-repo note (ADR-1).** This *is* the plugin source repo, so these are fixes to make **here**
> (agent file / hook / skill, with a `release-plugin` bump in the same commit), routed to a
> developer/solo pass — not items to mail to a downstream maintainer. Cross-project evidence below
> (T4; P2/P3 recurrence) was sourced from sprint-rituals and knowledge-gateway, whose plugin cache is
> read-only; the fixes apply **here**. This file supersedes `nexus-1.8.2-2026-06-13.md` (renamed
> forward; nothing from it had been applied). Re-grounding against the live 1.9.0 tree moved three
> carried-over items to **Resolved**, not re-proposed: P1 (by 1.8.3), T5 (by 1.8.1 + current source),
> and the cross-project K-cluster (operator-owed deferral / prompt-only validator / revision
> re-grounding — already shipped in 1.5.0). The Mode-3 promotion-review critic caught the K-cluster.

---

## Resolved since the 1.8.2 draft — recorded so they are not re-proposed

- **[RESOLVED · 1.8.3 GateNegationFix] P1 — pipeline-gate `approvedWithOpenHighSev` false-positives on
  negated tokens and Confidence fields.** `pipeline-gate.js` now exempts line-initial negation
  (`NEGATED`, `:129`) and the `**Confidence:**` qualifier (`CONFIDENCE_FIELD`, `:130`), applied at
  `:136`, with regression tests in `tests/unit/pipeline-gate.test.mjs`. The real invariant (APPROVED
  beside a genuinely-unresolved CRITICAL/HIGH) still fires. **Was a true cross-project defect** — nexus
  ×4 features, sprint-rituals `adhoc-VwhEvaluationFollowup` ("false-positive on 'CRITICAL or HIGH' as
  part of a description… bypass via Bash heredoc"), kg F11 ("gate intercepted Edit… forced PowerShell
  `WriteAllText`"). Closed.

- **[RESOLVED · 1.8.1 SalvageFencedCloser + current source] T5 — salvage-transcript defeated by a
  SubagentStop closer-storm / fenced closer.** `salvage-transcript.js:117-120` now walks back
  **stripping all trailing closers** until a non-closer (`while (tail>0 && isCloser(...)) tail--`), and
  `stripFences` (`:107`) removes fenced `Reviewed:`/`Plan:` trailers before the <400-char closer test
  (`CLOSER_RE`, `:109`). An N-deep storm is therefore handled. **Residual is NOT a salvage bug:** when
  the deliverable was *never emitted* (a read-only critic that wrote no findings at all — PGH Issues
  Log #65 "genuinely never emitted"; BuildFlow #32 "empty transcript"), nothing exists to recover —
  that is **P2's durable-findings-file** territory, below.

- **[RESOLVED · 1.5.0 (commit `b6be9c9`, "F16 remediation"); caught by the Mode-3 critic 2026-06-14]
  K1 / K2 / K3 — operator-owed deferral, prompt-only fail-closed validator, revision re-grounding.**
  Received from knowledge-gateway's `nexus-1.4.1` feedback file — but that file **predates the fix**: kg
  proposed these from F16, and nexus **applied them in 1.5.0**, three releases before this consolidation.
  All ship verbatim-in-substance on the live tree: **K1** `architect.md:200`, `developer.md:152`,
  `create-implementation-plan/SKILL.md:111`, `implementation-format/SKILL.md:65`; **K2** `architect.md:201`,
  `create-implementation-plan/SKILL.md:115`; **K3** `architect.md:202`, `create-implementation-plan/SKILL.md:116`.
  **Lesson (added to N6's spirit):** a *received* cross-project feedback file must have **every item
  re-grepped against the current plugin tree before promotion** — its disposition is frozen at the
  sender's version (here 1.4.1), and the dev repo "never hits" these features, so stale items carry
  easily. This is K3's own rule applied to the consolidation itself.

---

## P2 — Critic strands or never-emits its findings; standalone path has no salvage-persist; durable findings-file is owed

- **Suggested target:** `plugins/nexus/agents/architect.md:172` (the **standalone** "Critic review"
  bullet — *"Receive findings, fold them into a `## Plan Review` note… fix gaps"* — which has **no**
  salvage-and-persist instruction); compare `team-lead.md:168` which **does** ("salvage… **Persist the
  critic's findings yourself**… write them verbatim to `review-critic.md`"). Toolset constraint:
  `plugins/nexus/agents/critic.md` (`disallowedTools: Write,Edit,…`). Must not conflict with the
  code-grounded mandate at `architect.md:175`.
- **Action — split:** **(a) applicable now (one line):** mirror `team-lead.md:168`'s salvage-and-persist
  into the standalone `architect.md:172` bullet. **(b) architect decision (not net-new):** whether to give
  the critic its own write — the team-path durable record *already ships* at `team-lead.md:168`, so this
  only removes the salvage dependency and covers the non-emission case.
- **Recurrence:** **~6 features · 2 projects.** nexus — `adhoc-PipelineHardening` (L-A3/L-A8: bare
  verdict twice, recovered from transcript), `adhoc-PipelineGatesHardening` (RT-1 + Issues #65: salvage
  confirmed **no findings text anywhere** — genuine non-emission, not a strand),
  `adhoc-ConfidenceGatedResearch` (process/tooling), `adhoc-BuildFlowFormalization` (TL lesson + Issues
  #32: ACCEPT read ×4, **detailed findings unrecoverable, empty transcript**). sprint-rituals —
  `adhoc-Pass5-EventCorrectness` (comm-log #16: "critic wrote 0 tool uses → no critic-review.md…
  transcript 0 bytes → findings unrecoverable"), `adhoc-Pass3c-ComputationToDomain` ("a critic that
  couldn't surface its findings" among 11 malfunctions).
- **Lesson:** The critic is message-only (ADR-13). Two distinct failure shapes recur: **(1)** a
  **strand** (findings emitted, buried behind lifecycle closers) — recoverable by salvage, but only the
  team-lead path documents the recovery; the standalone/architect path doesn't. **(2)** a **genuine
  non-emission** (critic wrote nothing durable and emitted no findings text) — **unrecoverable by any
  means**, because there is nothing to salvage. Shape (2) is the load-bearing case: it has now bitten in
  PGH and BuildFlow with the verdict surviving (read ×4) but the *detail permanently lost*.
- **Design decision owed (route to architect; not net-new — `team-lead.md:168` already persists the
  team-path record today):** give the critic a **single allowed write** to the team-lead-dictated
  `review-critic.md` path, converging the critic's own write with what the team lead already writes —
  clarify ownership of `review-critic.md` first. The delta this buys is narrow: it removes the salvage
  dependency and is the *only* thing that covers shape-(2) non-emission (which has recurred across both
  projects with real detail loss). PGH RT-1 and BuildFlow's TL lesson both independently proposed it.
- **Priority:** high (the standalone-path gap is a one-line add; the non-emission detail-loss is a real
  recurring data loss with no current recovery).

---

## P3 — A 0-byte `output_file` is expected, not a hang; never poll a sibling agent's output file

- **Suggested target:** `plugins/nexus/agents/team-lead.md` — the Relay-Contract recovery order
  (`:50`/`:134`) and a one-line caveat alongside `agents-workflow.md:86` (durable-artifact) / `:88`
  (never-spawn-a-pipeline-role).
- **Action:** add (prose caveat).
- **Recurrence:** **~6 features · 2 projects.** nexus — `adhoc-VwhSelfcheckAndPrinciple` (Issues #41:
  "Spawn output_file was 0 bytes, not a symlink as documented"), `adhoc-DotnetSkillSweep` (Issues #55
  empty output_file; **msg #18 the ADR-21 breach** — the resumed developer watched a legit architect's
  0-byte output for 15+ min, misread the completed done-check as a hang, and **spawned a rogue
  architect**), `adhoc-PipelineGatesHardening` (Issues #67 `tasks/{id}.output` 0 bytes),
  `adhoc-BuildFlowFormalization` (Issues #2 ".output transcripts were 0 bytes this run"). sprint-rituals
  — `adhoc-Pass5-EventCorrectness` (#16 "transcript file is 0 bytes"), `adhoc-ReflektLiftAndShift`
  (ISSUE-3 stranded-then-recovered Codex lane).
- **Lesson:** The spawn-result `output_file` / `tasks/{id}.output` is routinely **0 bytes**; the real
  transcript is `~/.claude/projects/{slug}/{session}/subagents/agent-{id}.jsonl` (salvage's by-agentId
  search finds it). Two rules follow: **(1)** a 0-byte output file is *not* evidence of a hung or
  stranded agent — check the transcript before concluding anything; **(2)** **never poll a sibling
  agent's output file** to infer its progress — that polling is exactly the misread that triggered the
  ADR-21 delegated-self-advancement in `DotnetSkillSweep`. Pairs with the never-spawn-a-pipeline-role
  hard rule.
- **Priority:** high (directly caused one ADR-21 breach; repeated misdiagnosis across both projects).

---

## P4 — A create→extend scope correction must carry a disposition table in the plan

- **Suggested target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` — alongside the
  Downstream-Consumers / grep-before-delete rules (`:115`, `:123`).
- **Action:** add (prose — skill rule).
- **Recurrence:** 2 features · nexus — `adhoc-VwhSelfcheckAndPrinciple` (architect proposal: three HIGHs
  shared one root, fixed by one disposition table), `adhoc-DotnetSkillSweep` (the sweep ran on a
  `disposition.md` mapping every catalog item to keep/reformat/rewrite/merge/retire; it pre-resolved
  Phase-1 questions).
- **Lesson:** When a plan's scope is corrected from "create X" to "extend an existing X" (test suite,
  script, skill estate, doc set), the de-duplication boundary — which items already exist, which are
  new, which are deferred and why — is a **plan artifact**, not the architect's working memory. Require
  a disposition table mapping every source-catalog/brief item to `covered (where)` / `new (step)` /
  `deferred (why)`.
- **Priority:** medium.

---

## N4 — `improve-skills`' feedback-file channel does NOT apply in the plugin dev repo (ADR-1 carve-out)

- **Suggested target:** `plugins/nexus/skills/improve-skills/SKILL.md` — the "Two Channels (ADR-1)"
  section (`:17-21`), which currently states only the *consuming-project* rule ("Fix to a shipped skill
  → append to the feedback file… Never edit the cache").
- **Action:** add a one-line dev-repo carve-out.
- **Recurrence:** 2 features · nexus — `adhoc-DotnetSkillSweep` (developer lesson #2: the channel is
  inverted via the ADR-1 dev-repo carve-out; recorded as a documented deviation so the reviewer
  doesn't read direct edits as a contract violation), `adhoc-BuildFlowFormalization` (developer lesson:
  authored the new `proposal-format` skill **directly** in `plugins/nexus/skills/`; recorded the
  rationale in `## Skills Used` so the done-check doesn't read it as a channel violation).
- **Lesson:** In the plugin **source** repo (ADR-1), the cache rule is inverted: shipped skills are
  authored/fixed **directly here** and the skill's own lint is the done-condition; the feedback-file
  channel is the *consuming-project* path. Without the carve-out in the skill, every dev-repo developer
  re-derives it from ADR-1/CLAUDE.md and has to disclose it per-run.
- **Priority:** medium.

---

## N6 — The learner must sweep `communication-log.md` Runtime/Issues sections, not just `lessons.md`

- **Suggested target:** `plugins/nexus/agents/learner.md` — Consolidation Workflow **step 1** ("Read
  all lessons") and the "What You Know" list (both currently name only
  `docs/specs/*/delivery/lessons.md`).
- **Action:** add `communication-log.md` (Runtime/Plugin Issues sections) as a required second source in
  step 1.
- **Recurrence:** practiced in **2 projects, uncodified.** The richest plugin-bound evidence (0-byte
  output, the ADR-21 breach, the SubagentStop storm, gate-blocks-Edit) lives **only** in the comm-log
  Issues Logs, not in `lessons.md` — confirmed this pass: P3's strongest evidence and the storm
  root-cause were invisible in the lessons files. Already done ad-hoc: the nexus 1.8.2 file header
  ("sweeping… `lessons.md` **and** `communication-log.md`"), sprint-rituals
  `adhoc-Pass5-EventCorrectness` lessons ("Learner addendum — com-log Runtime/Plugin Issues Log R1–R7")
  and `adhoc-VwhEvaluationFollowup` summary ("`communication-log.md` Runtime/Plugin Issues Log #1–#5 and
  `lessons.md`").
- **Lesson:** A consolidation that reads only `lessons.md` misses the highest-signal plugin-bound
  evidence, which agents record in the comm-log Issues section because it is *runtime/tooling* rather
  than *role-craft*. Codify the two-source sweep so it is not left to each learner to rediscover.
- **Priority:** medium (it is the gate on the quality of every future consolidation).

---

## T4 — pipeline-gate is blind to plugin-tree markdown writes (cross-project) — escalated to a build decision

- **Suggested target:** `plugins/nexus/hooks/scripts/pipeline-gate.js` `isCodeFile` (`:105-107`,
  excludes `.md`/`docs/`) + the boundary-detector wiring; existing proposal
  `docs/proposals/boundary-detector-solo-ownership.md` (RT-3).
- **Action:** **build** — make the gate plugin-tree / two-repo aware (owner-approved this pass).
- **Recurrence:** **3 features · 2 projects.** nexus — `adhoc-PipelineHardening` (FINDING-B:
  `isCodeFile` excludes `.md`, so plugin **markdown source** is unguarded against the analyze-collapse
  when the pipeline self-hosts on nexus — correct for consuming projects where `.md` is docs, a hole
  here). sprint-rituals — `adhoc-Pass1-SkillRepair` ("the `pipeline-gate` watches the sprint-rituals
  tree, but skills land in the plugin repo… the gate can't enforce phases for plugin-repo work"),
  `adhoc-Pass3c-C-DevEpicAnalytics` ("harden the `pipeline-gate` so the token is team-lead-writable
  only and `developer:analyze` truly blocks source writes").
- **Lesson:** Two faces of one gap: **(a)** in the dev repo, plugin markdown source (agents/rules/skills)
  isn't guarded because `isCodeFile` excludes `.md`; **(b)** in a consuming project, skill edits land in
  the *plugin* tree the gate doesn't watch. A two-repo-aware gate (watch a declared foreign/plugin path;
  treat plugin-tree `.md` as guarded source) closes both. This is a **runtime behavior change** — owner
  sign-off obtained 2026-06-14; build via a solo/developer pass with its own bump.
- **Priority:** medium-high.

---

## Cross-project plan-authoring disciplines (K1 / K2 / K3) — moved to Resolved

These three — operator-owed deferral, prompt-only fail-closed validator, revision re-grounding — were
received from knowledge-gateway's `nexus-1.4.1` feedback file but **already ship in the live tree**
(applied in nexus 1.5.0 from the same kg F16 lessons that proposed them). See the **Resolved** section
above; they are recorded there, not promoted. The Mode-3 promotion-review critic caught the stale
dispositions — they were carried at kg's 1.4.1-era state without re-grounding against the 1.9.0 tree.

---

## Tracked — recorded, below the 2-feature bar or held for corroboration

- **N1 — Spawn `description` must be phase-AGNOSTIC** (`"{Role} · {slug}"`, never `"{Role} Phase 1
  analyze"`) — the label is immutable and a `SendMessage` resume can't rename it. `adhoc-BuildFlowFormalization`
  (TL lesson). The *symptom* already ships at `team-lead.md:89` ("track role by agentId, don't trust the
  label"); the proposed *fix-convention* in Message Templates does not. 1 feature; promote at the 2nd.
- **N2 — Standard+Codex earns its keep on multi-file *documentation* passes** (cross-file coherence
  defects per-file checks structurally can't see). `adhoc-BuildFlowFormalization` (TL lesson). Refine the
  "when to recommend Standard+Codex" guidance. 1 feature.
- **N3 — All-Markdown review evidence table = skill-lint + structural lint + plugin validate** (a doc
  pass has no compiler, but "no approval without fresh output" still binds). `adhoc-BuildFlowFormalization`
  (reviewer lesson). 1 feature; likely already implied by `review-format`.
- **N5 — A cross-file convention reconciles in ONE canonical home with the others pointing at it**
  (don't restate the rule in all N files — that re-creates the drift). `adhoc-BuildFlowFormalization`
  (architect fix-cycle). Adjacent to T1's canonical-source theme; 1 feature.
- **K4 — Never record a presumed/proceed-default answer as "user-answered"** (high blast radius — a kg
  plan step was built on a false attribution later reversed). knowledge-gateway F16. 1 feature; target
  `team-lead.md` + `questions-format`.
- **K5 — Lessons-file clobbering across resume boundaries** (each role appends under its own heading,
  never rewrites the header/other sections). knowledge-gateway F11 (1 confirmed, still-open proposal);
  related to the nexus relay-stranding evidence. Target `lessons-format` + `agents-workflow.md`.
- **T1 — Edit the canonical hard rule AND every inlined agent copy (ADR-14); a duplication audit greps
  `agents/` AND `rules/`.** `adhoc-ConfidenceGatedResearch`. 1st cross-feature occurrence; the proposed
  lint guard (flag an unchanged inlined copy when the canonical rule changed) is a deterministic check
  to build when this recurs.
- **T2 — A done-check reads live git/version state, not the env-block snapshot or a prior section's
  claims.** `adhoc-DotnetSkillSweep` (#5/#9), and BuildFlow's done-check applied it cleanly (round-scope
  the skill log by the `.pipeline-state` token). **Working as intended** — adjacent rules ship
  (`architect.md:133/:201`); confirmation, not a gap. Hold.
- **T3 — A scoped commit on a dirty-at-launch tree verifies the staged set (`git diff --cached
  --name-only`) before committing.** `adhoc-VwhSelfcheckAndPrinciple` (Issues Log). `team-lead.md:350`
  covers "never `git add -A`" but not the pre-staged-index case. 1 feature; borderline.

---

## Project-bound (not plugin source) — routed elsewhere

- **`scripts/bump-plugin.mjs` is all-or-nothing across plugins (no `--plugin <name>` scope flag).**
  2 features (`VwhSelfcheckAndPrinciple` proposal; `DotnetSkillSweep` live `--dry-run` cross-slug
  collision). A dev-repo tool, not shipped plugin source — belongs in a `scripts/` proposal + a note in
  the `release-plugin` skill. Recorded here only as a pointer.

## OMC-bound (not nexus plugin source) — flagged, not promoted here

- **SubagentStop hook storm.** An OMC-chain hook re-nudges a *completed* subagent ~8× ("Duplicate
  SubagentStop, no new instruction"), each nudge appending a lifecycle closer that buries the deliverable
  and burns post-completion tokens. This is the **root cause** behind most strands
  (`adhoc-VwhSelfcheckAndPrinciple` #39/#42, `adhoc-DotnetSkillSweep` #54, sprint-rituals
  `adhoc-Pass3c-B-DeliveryMetrics` "hook loops on SubagentStop, clobbers the final relay"). nexus's
  mitigation (salvage strip-all-closers) is shipped (see T5 Resolved); the storm itself is an **OMC**
  defect — route to the OMC maintainer, not a nexus bump.
