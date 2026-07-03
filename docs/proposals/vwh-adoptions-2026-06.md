# virtual-worker-harness findings — adoption proposals for Nexus

**Date:** 2026-06-12 (Architect) · **Status:** Ratified — partially delivered (was v2 post-deep-dive). Bookkept 2026-06-22.
**Delivered:** A1 (allocation / "cheapest correct locus" principle in `docs/architecture/README.md`) + A3 (`scripts/selfcheck.mjs`, adhoc-VwhSelfcheckAndPrinciple) + A6 provenance-tag half (adhoc-LessonsProvenance, nexus 1.18.2; first-person-voice half dropped by design).
**Remainder (backlog):** A2 declutter skill, A4 advisory nudges, A5 decision log.
**Subject:** `github.com/omniaz/virtual-worker-harness` ("VWH"), local clone `D:\omnishelf\virtual-worker-harness`
**Method:** v1 was based on remote spot-reads (README, contract, firewall, coverage flavor). v2 adds a
full deep dive: three parallel Explore surveys (all ~35 kernel modules; the soft harness — CLAUDE.md,
prompts, personas/intakes/cookbooks, memory conventions, journal triad; the complete test
architecture — 6 test categories, selfcheck, dry-run, CI) plus direct reads of `PRINCIPLES.md`,
`declutter-harness`, and `autoresearch-bootstrap`.
**Sibling evaluation:** VWH as automation substrate for the BR-coverage loop:
`D:\src\sprint-rituals\docs\proposals\br-coverage-vwh-evaluation.md`. This document covers only what
**Nexus itself** should adopt.

## Context

VWH is a task-agnostic kernel for autonomous research/build/eval loops (agent pursues a goal;
mechanical firewall, hypothesis DAG, commit-per-experiment ledger, fresh-context skeptic, governance).
Different problem from Nexus (goal-pursuit loop vs multi-role delivery pipeline), strikingly shared
DNA — both independently converged on deterministic gates (≈ADR-7/23), skills-as-lore (≈ADR-4),
fresh-context review (≈the critic), artifact-first truth (≈ADR-17), indexed memory. Treat the
convergence as mutual validation; treat VWH's gaps as previews of ours.

The deep dive confirmed v1's three proposals and made each substantially cheaper or more concrete.
It also surfaced three new candidates (A4–A6) and hardened the non-adoption list.

---

## A1 — Name the allocation principle in the architecture record *(green-lit)*

**Delivered:** `adhoc-VwhSelfcheckAndPrinciple`, 2026-06-12.

**What:** add a named principle ("cheapest correct locus") to `docs/architecture/README.md`:
*every behavior belongs at the cheapest locus that cannot decay — deterministic script > skill text >
agent prompt > model judgment — and improvement flows in both directions.* Reference from ADR-7 and
ADR-23. Add one triage question to the learner's classification step: **"which locus?"**

**Deep-dive enrichment.** VWH's formulation (PRINCIPLES.md) has two parts worth carrying over
verbatim in spirit:
1. **Memory is the bridge** — the full ratchet is *fluid → memory → MD → code*: lessons accumulate in
   a journal; only **repeatedly-confirmed** ones migrate to harder loci ("never migrate on a single
   data point"). Nexus's learner recurrence-tracking IS this ratchet — naming it connects the
   existing mechanism to the principle.
2. **"Every line of code/MD is a standing bet that scripting beats fluid judgment there."** This is
   the one-sentence justification for the pruning lane (A2): deletion = shifting the responsibility
   to intelligence, not destroying it.
Their CLAUDE.md even self-marks rules as migration candidates ("the kernel is intended to surface
rules 1/2/5/6 per-phase via tooling — until built, they live here") — prose that knows it wants to
become code. Worth adopting as a convention: when a rule is written that *should* eventually be a
gate, say so inline.

**Effort:** small. Architecture README (dev-repo, no bump) + `agents/learner.md` (shipped → PATCH +
command regen). **Confidence: high.**

## A2 — Pruning lane: a Nexus declutter skill *(queued after A3 Tier 1)*

**What:** a subtraction counterpart to improve-flow/improve-skills — evidence-based deletion/
compaction proposals over the plugin's agent files, rules, and skills, with owner confirmation.

**Deep-dive enrichment — the design work is mostly done.** VWH's `declutter-harness` SKILL.md is a
complete, mature spec to adapt rather than a concept to develop:
- **Level 0 first — the allocative pass:** for each responsibility ask (1) right locus? (2) can it
  shift to fluid (PRUNE — the default lean)? (3) is something the agent *keeps dropping* under-built
  (HARDEN — fluid → MD → code)? (4) should a re-derived fact become memory?
- **Then within-locus compaction** (their six levels, ours analogous): structure/design, duplicated
  blocks (our ADR-14 drift), files/layout, docs (single-source-of-truth + pointers), memory/lessons
  (durable vs transient split), and —
- **Level 6, salience/cognitive-load — the level Nexus needs most.** A different axis from
  redundancy: "can the reader find the load-bearing rules, or do they drown?" With **measured**
  diagnostics, not eyeballing: **bold-density budget** (flag when bold exceeds ~1 line in 4 — bold
  stops signaling), **wall-of-text cap** (~150 words/block; lift safety-critical clauses out),
  **TOP-RULES preamble** (≤10-line must-not-miss tier), **orientation-token budget** (tokens a
  reader consumes before acting). Report numbers before/after — a salience fix is justified by the
  numbers moving. Our 2×-baseline agent files are precisely this disease, and the bold-density and
  block-length checks are grep-able → they feed A3's selfcheck as warnings.
- **Process + rails to adopt wholesale:** scan → propose with quantified shrink → confirm before any
  delete → apply one coherent change at a time → verify (for us: selfcheck green, regen-drift clean,
  links resolve). Never delete unconfirmed; never collapse a single source of truth; prefer merge
  over delete; commit before a large prune; reduce-until-it-breaks to find the true requirement.

**Effort:** medium → **small-medium now** (adapt, not invent): new skill + learner wiring (shipped →
MINOR). v1 scope: ADR-14 drifted duplicates + superseded-by-gate prose + salience pass on the two
longest agent files. Transcript-evidence ("never violated in N sessions") stays out of v1.
**Confidence: high.**

## A3 — Mechanical self-test: selfcheck now, dry-run later *(Tier 1 green-lit)*

**Delivered (Tier 1):** `adhoc-VwhSelfcheckAndPrinciple`, 2026-06-12 — corrected from "build a
selfcheck" to *extend* the existing `tests/lint/` T1 suite (a hard-gated suite already existed); the
local `scripts/selfcheck.mjs` aggregator runs every check at once. Tier 2 (dry-run) remains later.

**What (Tier 1):** one script, runnable locally and in CI next to the bump-gate, mechanically
verifying plugin wiring in seconds.

**Deep-dive enrichment — a concrete check catalog** (from VWH's `selfcheck.py`, its negative-test
suite, and the survey's translation):
1. **Bidirectional registry↔disk** — every agent has a generated, non-drifted command (extends the
   existing regen-drift gate) AND every command traces to an agent; every skill dir has a well-formed
   `SKILL.md`; no orphans, no phantoms. (VWH checks both directions; one direction alone misses half
   the drift class.)
2. **Frontmatter completeness** — required fields per skill/agent file, missing field named in the
   failure detail.
3. **Hook registration coherence** — every hook command target resolves to an existing file; no
   duplicate `(event, matcher)` registrations; env-var references resolve.
4. **Cross-reference integrity** — every `/skill-name` and agent-name mention in instruction prose
   resolves to an existing skill/agent (the "dangling edge" check applied to markdown).
5. **Literal-drift for load-bearing strings** — assert specific strings that must stay synchronized
   across files (ADR-14 duplicated blocks match their master copy; current artifact paths/section
   names like `## Step 1 — Done-Check` appear where consumers grep for them). This doubles as A2's
   drift detector and operationalizes VWH's `contract-drift` lesson: *after any vocabulary change,
   sweep ALL governing surfaces, not just the edited file* — the selfcheck makes the sweep mechanical.
6. **Manifest validity** — `plugin.json` parses, version matches CHANGELOG head, generated `omni`
   twin is in sync (`--check` already exists; fold it in).
7. **Salience warnings (non-blocking)** — bold-density and block-length per agent file (from A2's
   Level 6); reported, never failing.
Plus the two test shapes VWH pairs with it: `test_real_repo_passes_selfcheck` (the live repo is
always clean) and **negative tests** — build a throwaway broken fixture, inject exactly one defect,
assert the right check fails. The `SelfcheckReport` pattern (name/passed/detail list, scannable
render, nonzero exit) is steal-verbatim.

**What (Tier 2 — later, own design spike):** a synthetic end-to-end pipeline pass. The dive sharpened
the bar: VWH's dry-run is *real behavior at tiny budget* with two invariants we must plan for from
day one — **state isolation** (byte-for-byte identical repo state after the run, even on mid-run
error) and **dry-run mode designed into hook scripts from the start** (a `NEXUS_SELFCHECK=1` no-op
path; retrofitting it is the expensive part). Without hook dry-run support, Tier 2 can only validate
static structure — which Tier 1 already covers. This is the critical upfront decision if/when Tier 2
is approved.

**Effort:** Tier 1 small-medium (dev-repo script + CI; no bump unless wired into shipped files).
**Confidence: high (Tier 1) / medium (Tier 2).**

---

## New candidates from the deep dive (awaiting owner triage)

### A4 — Advisory nudges: computed, non-blocking discipline flags

VWH's `nudges.py`: each nudge is a **pure function over observable state returning a warning string
or None** — never blocks, overridable, but the override is logged with reasoning. Their nudge list
targets exactly the discipline agents drop (skipped the cheap refuter, left the decision log empty,
deepened one island while another sits unscouted), surfaced at natural decision points.

**Why Nexus:** this is the missing middle tier of ADR-15's graduated enforcement, and the natural
*upgrade path for the 1.4.0 detection layer*: the boundary-detector currently writes
`violations.log` for after-the-fact review; nudge-style checks surface findings *into the flow*
without pretending to be a gate ADR-13 says we can't have. Candidate first nudges:
"implementation.md references a plan step with no disposition", "review.md Step-1 section missing
before a Step-2 write", "developer diff touches N files but no skill was invoked" (the 1.7.x
skill-usage audit made this detectable).

**Mechanism (settled 2026-06-12, owner discussion):** VWH's nudges work because they ride
**existing mandatory touchpoints** (the agent's own `harness plan/status/phase` commands) — nobody
remembers to check. Nexus's mandatory touchpoints are turn boundaries and artifact writes, so:
- **Primary locus: Stop/SubagentStop-time check** — a deterministic script reads the slug's
  artifact state (file existence, section greps, disposition parse) and returns nudge lines as
  stop-hook feedback, so the agent sees them *before the handoff completes* and fixes or explicitly
  overrides. "The system fires it; the agent only responds" (ADR-23's law on ADR-15's middle tier).
- **Secondary locus: PostToolUse scoped to `docs/specs/**` writes** — only where immediacy beats
  turn-boundary; known to fire for background subagents (Probe P1).
- **Invariants kept verbatim from VWH:** *silent when clean* (no-cry-wolf — a clean state emits
  nothing) and *overrides logged* (a decision-log row if A5 lands — the proposals reinforce each
  other). Conditions live in one registry script of pure functions, testable via A3's
  negative-test pattern.
- **Rejected loci:** TL dashboard (requires someone to run it — prompts policing prompts);
  blanket PostToolUse (per-tool-call cadence = noise agents learn to ignore).

**Remaining spike (narrow):** verify SubagentStop feedback actually reaches background pipeline
agents (same probe style as P1). Yes → mechanism confidence goes high; no → secondary locus
carries the load, primary covers foreground agents + TL.
**Effort:** medium (spike is small; registry script + hook wiring after).
**Confidence: medium-high on value; mechanism medium → high pending the one-question spike.**

### A5 — Decision log with outcome back-links

VWH logs every fluid judgment call append-only (`decisions.jsonl`: fact-sheet snapshot, choice,
reasoning) and **back-links the realized outcome**; recent decisions are surfaced at the next
decision point, so in-run learning compounds without transcript replay.

**Why Nexus:** the team lead's routing/escalation calls and the architect's review-mode and
escalation decisions are judgment calls whose outcomes are never systematically tied back. A
lightweight version: a `decisions` section in `communication-log.md` (or a sibling file) with
`{decision, reasoning, outcome}` rows the learner reads — recurrence-tracked decision quality
becomes another lesson source.

**Pilot design (sharpened 2026-06-12, owner discussion):** the loop has two decaying links that the
pilot must wire shut upfront — in VWH the outcome back-link is *kernel code*; for us it would be a
prose obligation, and prose obligations decay (ADR-22):
1. **Ship write + read together** — the TL instruction (write rows) and the learner instruction
   (read the log during consolidation) land in the same change; never a write-only log.
2. **Outcome back-fill is a deterministic close-protocol step** — "before writing summary.md: fill
   outcomes on open decision rows." A3's selfcheck can later assert zero outcome-empty rows at close.
3. **Measurable success criterion:** after ~3 pipeline runs, ≥1 promoted lesson cites decision-log
   evidence AND no rows close outcome-empty. Otherwise the artifact is overhead — kill it.
**Effort:** small-medium (format-skill change + TL/architect/learner instruction lines).
**Confidence: medium — real value; the pilot exists to prove the loop closes before the writing
obligation widens beyond the team lead.**

### A6 — Lessons voice + provenance tags (first-person journal discipline)

VWH's `EXPERIENCE.md`: first-person voice ("my dominant failure mode is…" — an explicit operator
decision: lessons land harder framed as the agent's own experience), **provenance tags** per entry
(`[run-3, run-5]`) making confirmation count visible, and **strengthen-don't-duplicate** (append
provenance to an existing entry; maturity = tag count; promote only at threshold; revise on
contradiction).

**Why Nexus:** maps 1:1 onto `lessons.md` → learner promotion. Today recurrence lives in the
learner's bookkeeping; provenance tags put it *in the lesson itself*, and strengthen-don't-duplicate
keeps lessons files lean. A small `lessons-format` skill amendment + learner instruction tweak.
**Effort:** small (two shipped files → PATCH). **Confidence: high — cheap, directly reinforces the
existing meta-loop.**

---

## Explicit non-adoptions (updated post-dive)

| VWH mechanism | Why not for Nexus |
|---|---|
| Hypothesis DAG / islands / EV ranking / agent_calib | Research-exploration machinery; pipeline work is a known sequence. (agent_calib — calibrating the agent's confidence claims against outcomes — is elegant but needs a scalar outcome stream we don't have.) |
| Variance-aware acceptance / noise model / stats | No noisy scalar metric in feature delivery; learner recurrence covers "don't promote from N=1" |
| Firewall / data tiers | No held-out evaluation to protect (BR-coverage loop's concern — see sibling doc) |
| Commit-per-experiment ledger / vcs | ADR-17 artifacts + git history already serve this |
| In-flight intent journal + crash recovery (`journal.py`/`recovery.py`) | Elegant (intent-before-action, idempotent reconcile), but Nexus steps already checkpoint via artifacts; a crashed pipeline resumes from `implementation.md`/`review.md` state. Revisit only if partial-step loss becomes a measured pain. |
| Monitor daemon + skeptic auto-fire | The principle ("the system fires it; the agent only responds") is ADR-23's law and already drives our hook design; a standing daemon process has no home in a Claude Code plugin today. The *no-cry-wolf invariant* (an approval must not carry a delta) is worth a one-line note in the review-format skill — fold into A6's pass. |

## Where a test-generation capability lives — the nexus↔harness boundary

A recurring question (owner, 2026-06-13): if Nexus gains a "generate tests for a project" capability
(the BR-coverage loop's territory), does it live in the plugin or the project? The key correction
(owner): **testing is part of streamlining software production, so the *method* is a plugin
concern** — only the *data* is project-bound. This is not a new pattern; it is **ADR-4 (artifact
formats are skills) applied to testing** — the plugin already ships `create-implementation-plan` /
`kb-entry-schema` (method) while `plan.md` / `docs/kb/` content (instance) live in the project.
Three **layers**, not two buckets:

| Layer | Home | Examples |
|---|---|---|
| **Method & schema** — how to write a good test, mutation-gate discipline, golden-set schema, the RuleId→KB→CI traceability convention, the KB-entry schema, the mine→verify→cover method | **Plugin skills** — stack-agnostic → `nexus`; stack-specific (xunit/FsCheck) → `nexus-dotnet` | a future `create-unit-tests` skill; a golden-set *schema* skill; the existing `kb-entry-schema` |
| **Output / instance data** — the actual golden set, campaign config, the generated test files, the KB *content* | **The consuming project** | Irreducibly project-specific — the plugin can't ship a golden set for a codebase it has never seen |
| **Loop orchestration** — the stateful mine→verify→cover→discover engine, gates, golden-set firewall, ledger | **Neither — VWH, as a flavor, pointed *at* the project** | Heavyweight stateful kernel; the followup plan code-confirmed ~70% is ML scaffold; a Claude Code plugin ships markdown, not a Python kernel (see non-adoptions table) |

Net rule: **method → plugin (one copy, the generalizable testing discipline), data → project, loop →
external harness.** The plugin's share is bigger than "just lore": the schema/convention/method that
*produces* the project's test artifacts is a nexus(-dotnet) concern and arguably *should* live there,
so every project inherits the same test discipline it inherits for plans/specs/KB today. Only the
output data is project-bound. The method-layer skills graduate to `skill-backlog.md` rows / ADRs when
built; the loop and the data — and the whole BR-coverage harness design — are a **sprint-rituals**
concern (`D:\src\sprint-rituals\docs\proposals\br-coverage-loop-harness.md` +
`br-coverage-vwh-evaluation.md`, `br-coverage-vwh-followup-plan.md`). This doc records only the
boundary and points there; it does not duplicate the harness.

## Sequencing & next steps

1. **A1 + A3 Tier 1 proceed** (owner green-light, confirmed post-dive — the dive only strengthened
   both). A1 is solo-sized; A3 Tier 1 is an adhoc pass (`adhoc-` slug, plan by architect).
2. **A2 next** — now small-medium thanks to the adaptable VWH spec; depends on A3's literal-drift
   check (its detector).
3. **A4–A6 await owner triage.** Recommended order if accepted: A6 (cheapest, reinforces the
   meta-loop), A5 (team-lead-only pilot), A4 (needs the design pass).
4. Implementation reminders: A1 (learner), A2, A5, A6 touch `plugins/nexus/**` → `release-plugin`
   bump in-commit; A3 Tier 1 is dev-repo machinery (scripts + CI), no bump.
5. Re-check VWH in ~a quarter for second-wave lessons once its contract survives full campaigns.

## Session evidence note (dev-repo relevant, not a VWH adoption)

During this dive, all three background Explore agents produced complete reports but **stranded them
behind short acknowledgment replies** ("Acknowledged." / "Ready.") — the transcripts show a
duplicate-`SubagentStop`-hook storm after the report was written, so the *last* message (what
`TaskOutput` relays) was hook-reply noise, not the deliverable. Two re-asks failed the same way
(consistent with the measured 0/2 re-ask rate); salvage via `subagents/agent-{id}.jsonl` text-block
extraction recovered all three reports intact. This is fresh, root-cause-shaped evidence for the
relay-reliability problem (ADR-16/17, scorecard #4): the failure was not report loss but
**final-message clobbering by hook events** — strengthening the case that artifact-first (ADR-17) is
the right contract and that salvage tooling should target the transcript's longest/last substantive
text block, exactly as `salvage-transcript` does.
