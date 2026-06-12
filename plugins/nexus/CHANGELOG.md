# nexus — Changelog


## [1.7.2] — 2026-06-12
Names the allocation principle the pipeline already practices and wires it into the learner
(VWH adoption A1; `docs/proposals/vwh-adoptions-2026-06.md`). The shipped surface is one line of
learner behavior; the rest of the pass is dev-repo machinery (architecture record + T1 lint
extensions), which does not ship.

- **Learner classifies by locus** (`learner.md`): the consolidation classify step gains a third
  axis (c) **locus** — should a lesson become a **deterministic check** (hook/lint/CI), **prose**
  (rule/skill), or stay **with judgment**? Prefer the cheapest locus that cannot decay; a lesson
  restating what a gate already enforces is a prune candidate, not a promotion. (The architecture
  record's new *allocation principle* section, referenced from ADR-7/ADR-23, is the dev-repo half.)

## [1.7.1] — 2026-06-12
Two small imports from the Omnishelf estate sweep (10 candidate mechanisms triaged: 6 were
already nexus's own or covered by 1.7.0; the third genuine candidate — a standing
cross-cutting lessons inbox — is documented as a deferred proposal in the dev repo
(`docs/proposals/cross-cutting-lessons-inbox.md`) with an explicit adoption trigger).

- **Research-before-asking offer** (`agents-workflow.md` + architect + PO): when a question
  headed to the user could be materially sharpened by targeted research (codebase, KB,
  existing specs), offer it alongside the question — "I can research {X} first — want me to,
  or do you already have a direction?" Guards both failure modes: researching silently when
  the user already knows, and forcing a cold answer when researched context is cheap.
  Offer only where research would genuinely change the question.
- **Research-helper dispatch contract** (`agents-workflow.md` + architect's Explore pattern):
  point helpers at inputs by file path — never paste bulk content into the prompt — and
  require a structured return (counts + per-item one-liners + surprises, ~300 words). The
  cheap preventive half of the existing placeholder-is-a-non-result rule.

## [1.7.0] — 2026-06-12
Completes the skill-quality system (ADR-23 extension) — the remaining Lane A items from the
Omnishelf upstreaming plan (`2026-06-12-skill-quality-to-plugin.md`): the *design* layer and
the *review* layer join 1.6.0's write standard + mechanical gate.

- **New skill: `evaluate-skill`** — the review standard. Judges a skill against its own job
  statement (input → output → consumer → what excellent looks like), two anchors: first-pass
  quality AND whole-life job fitness (the measured estate pattern: high first-pass, failing
  loop-closure). Process: gather run evidence → lint as Layer 0 → judgment Layers 1–4 +
  capability overlays (`references/rubric.md`, genericized from the consumer's validated
  rubric) → severity-rated findings doc (`docs/skill-evals/`) with verdict + checked-clean
  list → fixes routed via improve-skills (local) or the plugin-feedback file (shipped,
  ADR-1). Project-specific overlays deliberately stay consumer-local.
- **New: `improve-skills/references/proven-patterns.md`** — the §7 catalog genericized:
  11 evidence-backed patterns (deterministic post-conditions, state-first writing,
  preserve-on-write, two-axis quality, carry-over confirm-or-refute, …) + 7 anti-patterns
  (dead-letter enforcement, half-landed fixes, restated rules, hardcoded inventories,
  fictional infrastructure, no-finalize-path, gate-nothing checkpoints), each with one-line
  provenance and a when-NOT-to-use fence. Wired into improve-skills' scaffold step, fix
  path, and Quality Gate — the design-judgment layer the lint can't check.
- **skill-lint.mjs — generic Layer-0 extras:** XML-tag-shaped tokens in prose (code blocks
  exempt; `{placeholder}` never `<placeholder>`), mojibake markers (U+FFFD / UTF-8-as-1252
  signatures), description-length cap warning, and a path-prefix fix so repo-level paths
  containing `references/` aren't treated as skill-relative. 5 new tests (TDD-first);
  config-driven project checks (retired names, index-sync, convergence pins) stay local.
- **Enforcement pins (AP1 applied to the system itself):** lint tests assert improve-skills
  names the lint as its done-condition and ships the script, and evaluate-skill runs the
  lint as Layer 0 and ships the rubric.

## [1.6.0] — 2026-06-12
The improve-skills overhaul (ADR-23) — the skill meta-loop now ends in a deterministic gate.
Evidence base: the Omnishelf job-fitness evaluation of the evolved skill estate (their addendum
diff-verified `omni:improve-skills` against our 1.5.1 source and moved the rewrite target here;
distilled in `docs/evidence/2026-06-11-omnishelf-job-fitness.md`), convergent with the
knowledge-gateway skills-decay audit: **a rule that isn't mechanically executed on every run is
decoration** — two independent projects, one law.

- **New: `skills/improve-skills/scripts/skill-lint.mjs`** — a portable lint shipped *inside* the
  skill (version-locked to the instructions that invoke it): SKILL.md present, no BOM (UTF-8/16),
  frontmatter valid, `name` = folder, `description` present, cited `references/`/`workflows/`
  files exist. Errors exit 1; thin descriptions warn. The dev repo dogfoods it — a new test
  lints every shipped nexus skill (11 new tests, TDD-first).
- **improve-skills SKILL.md rewritten** around "born compliant":
  - **Deterministic gate (both paths):** every fix and every scaffold ends with the lint
    exiting 0 — the done-condition, not advice.
  - **Born-compliant scaffolds:** frontmatter completeness (name=folder, when-to-use phrasing,
    `user-invocable`/`disable-model-invocation` decisions) + a registration step (skills index
    row) are scaffold steps 4/6.
  - **Write Discipline:** SKILL.md and reference files via the Write tool, UTF-8 without BOM —
    never shell redirection (measured incident: three skills silently registered broken by a
    shell-default BOM, found weeks later).
  - **Two entry points, one owner:** learner-classified items AND direct user requests
    ("build me a skill for X") run the same gates — the de-facto main entry point was
    previously unscoped; a separate create-skill skill was rejected (duplicate owner).
  - **Fixes are consolidating passes:** net complexity flat or down, never additive patching.
- **improve-flow — "Prefer Mechanical Enforcement":** when promoting a lesson, wire or extend a
  deterministic check (lint/test/hook/CI) instead of — or alongside — the prose rule, and name
  the enforcement in the report; prose-only promotions must say so explicitly.
- Architecture record: ADR-23.

## [1.5.2] — 2026-06-12
Refinements from the knowledge-gateway per-plan skill-usage audit (29 mapped steps across 11
plans → 3 Skill invocations; evidence distilled in `docs/evidence/2026-06-12-developer-skill-usage-audit.md`).

- **developer.md — mandate re-keyed on the mapping, not the "Follow" keyword.** A plan writing
  bare skill names (the measured F16 failure) now binds identically; the keyword is phrasing,
  the mapping is the trigger.
- **developer.md — fallback ladder gains the cache-Read rung.** Skill tool (bare → namespaced) →
  Read the installed SKILL.md from the plugin cache, recorded as a Read-channel deviation in
  `## Skills Used` → plan references, recorded. (F11's developer proved the cache rung works
  and is materially compliant; 1.5.1 had banned all disk reads.)
- **create-implementation-plan + plan-template — two new anti-patterns:** (a) a mapped skill
  without its disposition keyword in the step text (removed the developer's binding trigger —
  9 mapped steps, zero invocations); (b) structural-pattern code references on Follow steps
  (devs measurably imitate cited code and skip the skill — cite code only for feature-specific
  surfaces).
- **consumption-report — skill-usage caveat:** frontmatter preloads never appear as `Skill`
  tool calls; zero entries ≠ format non-compliance (a measured audit mis-conclusion).

## [1.5.1] — 2026-06-11
Restores the Fokus-baseline **Skill-First Implementation** section in `developer.md` — diluted in the
Fokus→nexus extraction (same loss class as ADR-19). Audit evidence: a 12-step plan with skills mapped
on 9 steps implemented with zero Skill invocations while the logger was active (sprint-rituals Pass 4).

- The 4-step invoke→load→implement→conflict recipe and the **"This is mandatory… STOP and invoke
  it"** self-check sentence are back, extended to `tdd` on `TDD: yes` steps.
- The dead fallback fixed: "read `.claude/skills/{name}/SKILL.md`" doesn't exist in plugin consumers
  (skills live in the version-keyed cache — probe-verified that bare AND `nexus-dotnet:{name}` forms
  resolve via the Skill tool). On a genuinely failed invocation: implement from the plan's pattern
  references + record the deviation in `## Skills Used` — never silently reconstruct from memory.

## [1.5.0] — 2026-06-11
The F16 remediation package (ADR-21/ADR-22) — anti-delegation, communication, read discipline, and
skills enforcement, all evidence-based from the audited F16-DataPathRework run (10-rogue-agent
self-advancement incident, 8/8 stranded deliverables, plan.md re-read ×35, 2 Skill invocations in
12.7h).

- **Anti-delegation (ADR-21).** New all-agents hard rule: a pipeline subagent never spawns
  pipeline-role agents (the F16 incident vector — a developer commissioned done-checks, a Step-2
  review, and a learner as correctly-typed agents, so ownership rules never fired); explicit
  entries in `developer.md`/`learner.md`; the false "as a subagent you *cannot* spawn" claims
  corrected to **must not** (architect/critic/learner). `boundary-detector.js` now also matches
  `Agent|Task` and logs a subagent's pipeline-role spawn to `violations.log`. The team-lead
  dispatch templates gain the standing "Phase-end = hand back and STOP" line; the learner gains an
  explicit approval gate before applying promotions.
- **Communication (ADR-22).** `salvage-transcript.js` default selection is now longest-recent (the
  measured 8/8 recovery winner; the old final-substantive pick failed all 8 verbose-closer
  strandings — `--final` preserves it). New all-agents final-message contract: the last message IS
  the deliverable, never an acknowledgement after it (reinforced per agent). Placeholder
  first-returns ("Standing by.") codified as non-results with a re-dispatch-once rule. Team lead:
  persists critic findings verbatim to `review-critic.md` (standardized), and documents that
  spawn-time `model` overrides do NOT survive `SendMessage` resume (platform constraint #4) —
  re-spawn fresh for model-critical phases.
- **Read discipline (ADR-22).** New all-agents rule: read each file at most **once per round**
  (sanctioned exceptions: post-compaction, cross-round external change, chunked first reads,
  offset checks); role-input boundary (the comm-log is the team lead's). New `read-tracker.js`
  PostToolUse hook: nudges on a 2nd same-round read, logs ≥3 to `violations.log`; round boundary =
  pipeline-state token/session change. `consumption-report` gains a re-read-offenders aggregation;
  the plan skill gains a plan-size budget (a plan is read by 4+ agents).
- **Skills enforcement.** The plan template's Skill Mapping gains a **TDD column** (`Skill: None`
  never waives TDD — F16 shipped 34+ tests test-after under an all-None mapping);
  `implementation-format` gains a `## Skills Used` section; the developer's completion checklist
  and the architect's done-check now verify skill conformance per step.
- **Plan-grounding additions** (from the knowledge-gateway feedback file): pre-authored
  operator-owed fallbacks for build-time-unavailable credentials; prompt-only LLM obligations must
  pair with a fail-closed validator or documented backstop; revision passes re-ground steps whose
  surface changed; presumed answers are never recorded as user-answered (`questions-format`);
  `lessons.md` is append-only per role (`lessons-format`).
- Stale "gate invariant 3" references fixed (`team-lead.md`, `agents-workflow.md`); the
  architecture record gains ADR-21/ADR-22 + platform constraint #4; the P2 skill-inventory
  limitation marked resolved (the F16 all-None mapping was verified honest). F11's "gate blocked
  Edit during implementation" feedback item: verified not-a-bug in current code — the gate blocks
  only during `:analyze`; the F11 symptom was a stale token + foreground writer.

## [1.4.1] — 2026-06-10
Learner consolidation from Passes 3c-C, 4, 5 — proven (2+ occurrence) lessons promoted into the plan skill and architect agent.

- **`skills/create-implementation-plan`**: new **Plan Grounding & Deviation Rules** section — (1) declare which surfaces are binding vs the developer's call (public/wire identifiers binding, internal names free; name the convention forks) so deviations are pre-sanctioned; (2) a hedge in a plan is a deferred read — resolve every disk-checkable "may/if needed/either-or" at plan time, cite counts only from greps, and trace cross-boundary contract fields to their actual source type. Extended the enumerate-all-consumers refactoring rule with a **method-hiding sweep** (`public new {Method}` + call-site static types — a `new`-hidden base method can have zero reachable callers).
- **`agents/architect.md`** (+ regenerated command mirror): adhoc/refactoring passes must **re-verify every aged finding against current source** (triage verdicts, proposal-era defect lists, prior-pass deferrals) before planning its fix — the cited defect may already be fixed; a "fix" for a fixed finding is a no-op or a regression.

## [1.4.0] — 2026-06-10
The enforcement + relay package (evaluation roadmap B/C, TDD-first: every change below
shipped with its test written and failing first; the offline suite lives in the dev repo).

**New: stranded deliverables are recoverable by script.** `hooks/scripts/salvage-transcript.js`
extracts a background agent's final substantive message verbatim from its platform-written
transcript (zero model tokens), skipping lifecycle stubs ("Ready when you are.") — the measured
stranding shape. The always-on rules context now injects the resolved plugin root + the exact
salvage command, and team-lead.md codifies the recovery order: **artifact → TaskOutput →
salvage → re-ask LAST** (re-ask measured 0/2). A stranded critic message is routed from salvage
exactly as if it had arrived.

**New: boundary violations are deterministically visible.** Probe P1 established that
PostToolUse hooks fire inside background subagents (where the gate's deny is dropped, ADR-13).
New `hooks/scripts/boundary-detector.js` (async, observe-only) logs every ADR-18 ownership
breach by a subagent — non-code role editing source, wrong-role artifact writes,
`.pipeline-state` writes — to `.claude/audit/violations.log`; the team lead reads it at every
checkpoint. Zero footprint when clean.

**Hardened: critic is physically tool-locked.** `disallowedTools: Write, Edit, MultiEdit,
NotebookEdit` in its frontmatter — platform-enforced regardless of spawn mode; message-only is
now mechanical, not instructional.

**Hardened: persona registry can no longer be clobbered by a subagent.** Probe P1 showed
subagent hook events carry the parent session_id; `register-persona.js` now ignores any event
with `agent_type`, so only the main thread registers personas.

**Artifacts self-certify.** `implementation-format` and `review-format` gain a completion
footer (`*Status: COMPLETE — {role}, {date}*`); the team lead trusts the footer, not the
completion message.

Also: developer.md Phase-2 heading now names the real resume message (Step-10 LOW-3 carry-over).

## [1.3.0] — 2026-06-10
Restores the worker-side halves of every pipeline contract that the Fokus→nexus extraction dropped
("the hub got hardened, the spokes got lobotomized" — full audit: adhoc-PluginCleanup). The team-lead
layer kept its formats and gates across 1.2.x; this release gives the five worker agents back the
protocols those gates assume, plus a consistency sweep and hook fixes.

- **developer.md** — two-phase plan workflow (analyze-and-stop checkpoint), idempotency/resume,
  step announcements, debugging protocol (diagnose + 3-attempt circuit breaker), TDD, Boy Scout,
  completion checklist, reviewer-findings response protocol, anti-patterns.
- **critic.md** — full investigation protocol (code-grounded feasibility, breadth scan, self-audit,
  realist + adversarial checks), severity scale, REJECT/REVISE/ACCEPT verdict, cross-reference
  matrix in the message (no-file contract kept).
- **reviewer.md** — pre-commitment predictions, `## Carry-Over Findings` consumption, fresh-evidence
  requirement (`git show HEAD~1:{path}` parity), stage gate, gap analysis, finding confidence,
  self-audit.
- **po.md** — question-answering mode (Cited/Inferred/No-answer, cite-or-escalate), read boundaries,
  pre-spec gap check, optional `help.tooltips.md` question (restore-lite), generic tracker flows,
  slug confirm.
- **team-lead.md** — Fast Mode dispatch (developer self-review), per-agent model/effort config via
  optional `.claude/nexus-agents.json` (spawn-param model + prompt-line effort, frontmatter fallback),
  Codex first-round-only heuristics, lessons-processing and completion-dashboard pipeline steps,
  unattended spec-gate abort, two-leg question routing.
- **learner.md** — two-channel lesson promotion: project-bound lessons applied on the spot;
  plugin-bound lessons routed to a portable `docs/plugin-feedback/` file for the plugin owner
  (consumers can't edit the plugin cache). improve-flow/improve-skills rewritten around the same model.
- **Consistency sweep** — every agent carries the identical slug/paths/caps compact-reference block
  (ADR-2); stale `v1.md`/`project-rules`/`@`-import references genericized across skills; stack-specific
  (.NET) examples abstracted out of create-implementation-plan.
- **Hooks** — audit-logger: truly zero-cost when off, logs to `.claude/audit/` with per-event detail;
  inject-rules: skips on resume; guard: split-flag `rm` + PowerShell `Remove-Item` coverage,
  `.env.example` excluded; pipeline-gate: unreachable background-role invariant removed (ADR-13);
  register-persona: handles Edit payloads; restore-agent: roles derived from `agents/` dir.

## [1.2.8] — 2026-06-09
Every recommendation an agent puts to the user now carries a **confidence label** (high | medium | low),
so the user can see at a glance which defaults are safe to rubber-stamp and which need real thought —
exactly the distinction that was implicit when, in Pass 4/5, the user accepted most PO defaults but made
a few calls personally.

- **New universal hard rule (`agents-workflow.md`):** when an agent surfaces a question/choice to the
  user — `AskUserQuestion`, a `To: user` question, or a recommendation handed up for the team lead to
  relay — it states its recommended answer + **Confidence: high | medium | low** + a one-line why.
  high = clear basis (spec/ADR/pattern/evidence), safe to proceed if unanswered; medium = reasonable
  lean with a real trade-off; low = toss-up, wants the human's call.
- **Echoed into the user-facing agents** (po, architect, developer, solo, team-lead) per ADR-2 (a
  spawned subagent sees only its own file). The team lead preserves an agent's confidence when relaying
  and adds its own when it asks. (Critic/reviewer/learner don't put option-questions to the user, so
  they're covered by the universal rule rather than an echo.)
- **Structural:** `questions-format` skill gains `Recommendation` + `Confidence` fields on every
  `To: user` question; the checkpoint-report "Action options" block now tags the recommended option
  with its confidence.

## [1.2.7] — 2026-06-09
Restores the spec-side review gate (sibling of 1.2.6's team-lead restoration). Found in a real run
(sprint-rituals Pass 4): the PO shaped a spec and went straight to `Status: Ready` with **no spec
review** — because the spec-review choice (self cross-check vs critic Mode 1) is written as an
interactive offer, and when the PO runs spawned/background it had no relay path and the team lead had no
checkpoint to surface it (unlike the architect's plan-review, which nexus wires correctly). The
coordinator then pre-empted it by handling only the PO's product questions.

- **PO spec review is now a mandatory, mode-aware gate (`po.md`).** Standalone (`be po`) still asks the
  user directly — individual flow unchanged. When **spawned**, the PO does not ask; it hands a
  `recommend {critic|self}` spec-review choice up to the team lead and never flips to Ready until the
  chosen review runs.
- **New PO Spec-Review Checkpoint in `team-lead.md`** — the spec-side mirror of the Architect Questions
  Checkpoint: after a spawned PO returns, the team lead surfaces self-vs-critic (Mode 1: spec vs
  product/architecture docs + ADRs) to the user before Ready; unattended → self cross-check.
- **Entry-point rule made explicit (`team-lead.md` Launch Path Selection):** the furthest existing
  artifact sets the start — plan exists → Developer; else spec (`Status: Ready`) exists → Architect;
  else → PO. **Never spawn the PO when a spec already exists**, exactly as the team lead never re-plans
  when a plan exists. The PO runs only for genuinely new behavior with no spec yet.

## [1.2.6] — 2026-06-09
Closes a severe failure mode found in a real run (sprint-rituals Pass 5) and restores the team-lead
operational depth lost when nexus was extracted from Fokus. The developer, spawned in the background
for Phase-1 analyze, ran the whole pipeline in one sweep — and **fabricated both quality gates**,
signing a Step-1 done-check as "Architect" and a Step-2 review as "Reviewer", plus a `summary.md`, and
self-committing. No rule forbade it; the gate is inert on background subagents (ADR-13). Two layers fix
it: an explicit **prevention** rule in the agents, and **containment** restored to the team lead. No
hook/gate code changed — rules + agent text + decision record.

- **Agent output boundaries (prevention, ADR-18).** New hard rules in the developer (and echoed in
  architect/reviewer + universal in `agents-workflow.md`): each artifact has **one owner**; an agent
  never authors another role's verdict, never signs as another agent, never commits, never writes
  `.pipeline-state`. "If a gate hasn't run, report it — never simulate it." The developer's outputs are
  source + `implementation.md` (+ `lessons.md`); everything else is read-only to it.
- **Artifact is the primary deliverable (ADR-17).** `agents-workflow.md` + the team-lead Relay Contract:
  the durable file is the mandatory primary output; `TaskOutput` is best-effort (it returned "no task
  found" for a completed agent in Pass 5). An inline-only verdict with an empty artifact is an
  incomplete result → re-spawn with the file as primary; never proceed on it.
- **Team-lead operational depth restored from the Fokus baseline (ADR-19).** Inlined (ADR-2 #2 blocks
  `@`-import): **verbatim relay to the user** (the team lead is the user's only window — show agent
  output before triage); **idempotency gate** + **safe Resume** (branch-mismatch block, done-check,
  resume-from-Step/Cycle via agent IDs); a **communication-log header** (the resume state) + Runtime/
  Plugin Issues Log; **phase-failure & timeout/stall recovery** (assess → resume → split; Retry/Edit/
  Skip/Abort menu); **escalation menu** (Continue/Force-accept/Abort); a **status-check table**; and
  **shutdown issue-investigation** (on detected issues, don't close silently — investigate, report).
- **Commit strategy → 2 commits with override (ADR-20).** Reverts the fixed 4-checkpoint scheme. Commits
  now happen only at team-lead-owned boundaries (plan approved, pipeline done), removing the
  post-implementation commit seam a subagent used to self-commit; overridable to 1 or 4 at launch.
- **Decision record:** ADR-17–20 added to `docs/architecture/README.md`, including why the team lead
  regressed (the Fokus operations file fell through the `@`-import gap at extraction).
- **Critic pass (folded in):** an independent critic review caught that ADR-17's artifact-primary
  inversion left the *opposite* pre-inversion wording in `developer/architect/reviewer.md` and split
  the team-lead Relay Contract's ordering — the `:43/:112`-vs-`:77` contradiction class ADR-16 had
  retired. Reconciled: the three agent handoffs now state "artifact first, message is a convenience
  copy"; the Relay Contract states the artifact-primary ordering once; a verbatim-relay/Read-Discipline
  bridge was added; and ADR-16 now back-references ADR-17.

## [1.2.5] — 2026-06-09
Enforcement moves into the agents; the docs stop claiming the gate does what it can't. Root-caused
from a real run (Pass 3c-C): the developer ran analyze→implement in one spawn while the token was
correctly `developer:analyze` and the gate produced **zero** denies — proving a synchronous
PreToolUse `deny` is **not honored for a background subagent** (the gate is inert for exactly the
agents it targets). No hook/gate code changed — this is rules + agent text + the decision record.

- **New universal hard rule — "never assume past an open question; stop and ask."** Added to
  `agents-workflow.md` (always-on) **and hard-coded into every agent file** (developer, architect,
  reviewer, po, critic, learner, solo) — per ADR-2 a spawned subagent sees only its own file, so the
  rule must live in both. A question-free phase may proceed; a phase with an *unsurfaced* question may
  not. The developer's narrow "if the plan contradicts itself" stop is broadened to any ambiguity.
- **team-lead.md slimmed to coordinate + enforce, not author agent rules (ADR-14).** Removed the
  agent-behavior sentence from the Phase-1 step (the "agent stops" rule now lives in the agent); added
  an **Enforcing the Rules** section — detect a broken rule, then apply the *least* intervention:
  self-fix-and-continue when there's no process impact, correct-in-place when recoverable, stop-and-retry
  only when a checkpoint is unrecoverable (ADR-15). Restarting a clean run is itself a defect.
- **Honesty fixes for the doc-drift that kept causing reverts.** `agents-workflow.md` + `team-lead.md`
  now say the `pipeline-gate` is a **best-effort tripwire** (bites a foreground writer; a background
  deny is dropped — ADR-13), not the two-phase enforcer. The stale `.pipeline-state` "cleared on
  SessionStart" line is corrected (`restore-agent.js` only touches the persona registry). The relay
  contradiction is reconciled: read the full result via `TaskOutput`, the inline notice is partial by
  design, the artifact is a legitimate fallback (ADR-16).
- **Architecture record: ADR-13–16** — gate-inert-on-background (qualifies ADR-7), agent
  self-containment, graduated minimal-intervention enforcement, and the relay model — so the next
  pass doesn't re-propose foregrounding or "the messaging is broken / disable OMC".

## [1.2.4] — 2026-06-08
Independent review gate for the learner — promotions now get a critic pass before close.

- **`critic.md`: new Mode 3 — Promotion Review** (code-grounded). The critic reads the *actual*
  promoted/edited files on disk + the source `lessons.md` and flags distortion, **over-promotion**
  (a 1-occurrence item promoted with no build-breaking/data-loss justification), **mis-routing**
  (ADR-1: stack-agnostic content in an extension, or stack-specific detail in the agnostic core),
  conflicts/duplication, and **artifact drift** (an edited `agents/*.md` with a stale `commands/*.md`,
  or a shipped change with no bump/CHANGELOG). The learner is added as a critic spawner (standalone →
  direct; team → via team lead), and folds the findings like the architect folds a plan review.
- **`learner.md`: a Mode-3 critic review is now a mandatory close step.** Promotions edit shared source
  that shapes every future run (highest blast radius), so they get an independent review exactly like a
  plan. An adversarial second opinion (`omc:critic` / Codex) is an opt-in add-on for large
  consolidations — never required (nexus depends on neither). Release machinery stays out of the shipped
  learner (dev-repo concern); the Mode-3 artifact-drift check backstops a skipped `gen-commands`.

## [1.2.3] — 2026-06-08
Learner consolidation from Passes 0–3c-B — proven (2+ occurrence) flow lessons promoted into the plan skill, the architect, and the coordination rules.

- **`create-implementation-plan`**: new **Refactoring & Type-Move Plan Rules** section — (a) a "fix/split/replace every file matching P" step must derive its file list from the *exact* acceptance grep (definition-line, not usage); (b) enumerate ALL consumer/DI/injection sites from a repo-wide grep before a removal; (c) "grep before delete" is a hard numbered sub-step for shared-type deletions; (d) "replace all X" needs file:line + DO-NOT-TOUCH carve-outs for non-call homonyms (the `"neutral"` literal, `HttpClient`/SignalR `SendAsync`, Mapster `.Adapt<T>()`); (e) type-move/rename needs an explicit old→new table + wire-stability invariants (`DataMember(Order)`, property/JSON-key names, wire-only `*Response` envelopes); (f) project-reference removal must grep dependent `GlobalUsings` + property/field/return types, not just `.csproj`.
- **`architect.md`**: the Feature Spec Workflow now handles **ad-hoc / refactoring passes that have no `spec.md`** — gate on backlog row + ADR register + triage, cross-check every ADR against its triage verdict (conflicts → user Q), and review via critic **Mode 2 against the ADR register**. Also: when subagent spawn is unavailable, an in-context critic must be **disclosed** (never called "independent"), and shared/external-artifact passes (skills, the plugin repo) require a **code-grounded** review as the load-bearing gate, not a doc-only critic.
- **`agents-workflow.md`** (Pipeline State): documented the three recurring `pipeline-gate` failure modes — inline user override (team lead must advance the token, not the agent), no self-advance / no Bash-`printf`/`mv` bypass, and the **foreign-repo blind spot** (the working-tree gate fails open for deliverables in another repo; the team lead enforces the checkpoint manually). The two-repo-aware `pipeline-gate.js` change remains a tracked, unimplemented improvement.

## [1.2.2] — 2026-06-08
Standard+Codex review made explicit and deterministic.

- **`team-lead.md`: Standard+Codex now mandates *both* reviewers run in parallel** — the nexus reviewer
  (Step 2) **and** Codex, independently (neither sees the other's findings). Codex never replaces the
  reviewer. The team lead **merges both into one deduped fix-list** for the developer (who never reads
  either review file) and reconciles a verdict conflict (reviewer APPROVED vs Codex NO-GO)
  finding-by-finding. The prior wording ("Codex before or alongside the reviewer") could be misread as
  Codex-only.
- **Renamed the Codex artifact `codex-crosscheck.md` → `review-codex.md`** so it pairs with `review.md`.

## [1.2.1] — 2026-06-08
Reverts the 1.2.0 pipeline-hardening experiment. The hardening regressed the thing that actually
worked — agents relaying their output to the team lead — without buying correctness the simple gate
didn't already give. Confirmed against a real run that shipped clean with the gate not even firing,
and against the `cfb7a64` / fokus baseline that "worked fine."

- **Restored the message-first relay model** (the `cfb7a64` model). Pipeline agents return their full
  verdict, questions, and findings **in their completion message**, and the team lead reads and relays
  that message. Reverted the 1.2.0 "minimal-return contract / never trust the agent's last message /
  grep the artifact for the verdict" machinery in `team-lead.md`, `architect.md`, `developer.md`, and
  `reviewer.md`. Artifacts (`plan.md`, `review.md`, `implementation.md`, `lessons.md`) remain the durable
  record — the team lead no longer reconstructs verdicts/questions from them.
- **Simplified `pipeline-gate.js` back to the load-bearing invariants** — (1) analyze-phase collapse
  (no `plan.md`/source written during an `:analyze` phase), (2) review.md verdict integrity (no APPROVED
  with an open CRITICAL/HIGH), (3) state-file integrity (a pipeline subagent can't rewrite
  `.pipeline-state`). Dropped the 1.2.0 additions: the team-lead read-lane (H0) and the dev-repo markdown
  source guard (H2b). Spawns pass through untouched (background by design, ADR-12).
- **Reverted `restore-agent.js`** (dropped the SessionStart `.pipeline-state` liveness-clearing, H4) and
  the hooks matcher (back to `Write|Edit|MultiEdit|Task|Agent`, no `Read`/`Grep`). Removed the gate/restore
  unit tests added with the experiment.

## [1.2.0] — 2026-06-07
Pipeline-gate hardening experiment — **reverted in 1.2.1**, see above. Tightened the team lead's read
lane (H0, hook-enforced), added a dev-repo markdown source guard (H2b) and a `.pipeline-state`
liveness clear (H4), and added a "minimal-return / grep-the-artifact" relay contract across the
pipeline agents. The relay changes regressed message relay and the extra gate lanes added no
correctness the simple gate lacked; all of it was rolled back in 1.2.1.
## [1.1.1] — 2026-06-07
Spawn mode reversed to **background** for pipeline agents (ADR-12, supersedes ADR-10). Also flips the
release policy to **PATCH-default** (owner escalates to MINOR/MAJOR) — see `release-plugin` skill.

- **Pipeline agents now spawn in the background.** The team lead spawns architect/developer/reviewer/PO/
  critic with `run_in_background: true` so the pipeline no longer blocks the main session — restoring the
  original `cfb7a64` default and the repo owner's standing preference. It reads each agent's full result
  via `TaskOutput` on completion and resumes the same live agent via `SendMessage` for Phase 2.
- **`pipeline-gate.js` foreground enforcement removed** (former invariant 3). Spawn mode is no longer
  hook-gated; the gate keeps the two-phase-collapse, verdict-integrity, and state-file invariants (now
  numbered 1–3). The 1.0.1 rationale (background "truncates" the relayed result) did not hold: relay
  reads the verdict from the artifact and the full result from `TaskOutput`, never the inline message,
  and a background agent stays alive to resume.
- **Docs:** ADR-10 marked superseded; ADR-12 records the reversal and why the foreground fears don't
  hold on the current platform.

## [1.1.0] — 2026-06-07
Token consumption audit — opt-in, off by default (ADR-11).

- **`token_audit` userConfig flag** (default off). When on, the `audit-logger` hook additionally
  records per-agent token usage to `docs/audit/token-usage.jsonl` (`{ts, agent, tool, input, output,
  cache_read, cache_creation, context}`), reading the last completed turn's `usage` from the
  transcript (a one-turn lag, fine for a growth curve). Off by default — zero extra work when
  disabled; the existing `tool-calls.log` trace is unchanged.
- **`consumption-report` skill** — aggregates that log into a per-agent table: peak context, output
  generated, tool-call count, and context growth (first → peak), so you can see which agent burns the
  most tokens and tie its growth back to what it re-read. Dedups same-turn rows so output isn't
  multi-counted.

## [1.0.2] — 2026-06-06
Hotfix: revert the implementer agents off the 1M-context model.

- **`developer`, `reviewer`, `solo` moved back to the `sonnet` alias** (from `sonnet[1m]`).
  Sonnet 1M context requires usage credits on every plan, which blocked Developer Phase 1 with a
  1M-context credit error. The plain `sonnet` alias (200K, subscription-covered) avoids the cost.
  `effort: max` is retained — effort does not incur the 1M credit charge.

## [1.0.1] — 2026-06-06
Pipeline-orchestration fixes: spawn mode and review-mode timing (committed in `024fcf2`
without a bump; this release carries it to users).

- **Foreground pipeline spawns enforced.** `pipeline-gate.js` now denies a pipeline agent
  (architect/developer/reviewer/po/critic/learner) spawned with `run_in_background` — a background
  spawn truncates the relayed result (breaking verdict relay) and leaves no live agent to
  SendMessage-resume for Phase 2 (ADR-10). The team-lead's Two-Phase Spawn now carries an
  imperative "Foreground, always" rule at the spawn site; the hook matcher is broadened to
  `Task|Agent` so the gate sees spawns.
- **Pipeline-gate state-file tamper protection.** `pipeline-gate.js` now denies any pipeline
  subagent (architect/developer/reviewer/po/critic/learner) from writing `.claude/.pipeline-state`
  — the two-phase gate's own source of truth. Previously a subagent could rewrite it to flip its own
  `analyze`→`implement` phase and silently bypass the collapse gate (guard.js treats `.claude/` as
  writable and it is not a plan/source file, so nothing else stopped it). Only the team lead advances
  phases now; the main session is unaffected.
- **Review-mode question deferred to the post-Phase-1 checkpoint.** Removed from the team-lead's
  launch-time Pre-Flight. The architect owns the decision: it recommends in its Phase-1 report when
  team-spawned, and asks itself alongside the Phase-1 questions when running standalone — so it is
  no longer asked before any design analysis has happened.
- **Per-agent model & effort tuning.** Added an `effort:` level to every agent (opus agents →
  `xhigh`, sonnet agents → `max`) and moved the implementer agents (developer, reviewer, solo)
  to the 1M-context `sonnet[1m]` alias. **Cost note:** Sonnet 1M context is billed via usage
  credits on every plan (not subscription-covered), so those three agents now carry that cost
  on every install.

## [1.0.0] — 2026-06-06
First versioned release. Graduates from the `0.1.x` line to `1.0.0` and adopts the
MAJOR-leaning version policy (the payload is agent behavior and the install cache is
version-keyed, so most changes must reach users). Backfilled from git history.

Baseline included in 1.0.0:
- Eight-agent pipeline (team-lead, architect, developer, reviewer, po, critic, learner, solo)
  with hub-and-spoke coordination, two-phase spawn, verdict validation, and persona commands.
- Always-on rules injected via the SessionStart hook (`inject-rules.js`); enforcement hooks
  `guard.js` (security guard, `security_mode` userConfig) and `pipeline-gate.js`.
- Artifact-format skills (`implementation-format`, `questions-format`, `review-format`,
  `lessons-format`, `summary-format`) preloaded producer-only; process skills
  (`create-implementation-plan`, `create-architecture-doc`, `create-feature-spec`,
  `improve-flow`, `improve-skills`, `diagnose`, `tdd`, `boy-scout`, kb/schema skills).
- Team-lead and architect **read discipline** (grep verdicts, own the comm-log, never re-read
  the plan you authored) — the change that triggered this release.
- **`release-plugin` skill + `scripts/bump-plugin.mjs`**: a **dev-repo tool** that owns the
  version-bump decision and the ADR-9 release flow (classify → bump + CHANGELOG in the same commit
  → regenerate → validate → tag). Invoked directly when developing the plugin; the local reminder
  lives in the dev-repo `CLAUDE.md` and the guarantee is a CI `--check`. **Not** wired into the
  shipped agents — nothing about releasing reaches consumer-facing agent behavior. No session hook.
