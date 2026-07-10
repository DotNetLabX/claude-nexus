# Evaluation: the mine-* skill suite vs virtual-worker-harness — scorecard, methodology, borrowables

**Date:** 2026-07-10 (Architect) · **Status:** Assessment — feeds owner triage; no changes applied.
**Subject A:** the nexus mine family — `mine-verify-cover` (+ `mine-from-spec` mode, + 4 stack
adapters: dotnet/flutter/cpp/php), `mine-verify-repo`, `mine-reference-model`, plus the dev-repo
Workflow substrate (`nexus/harness/*.workflow.js`).
**Subject B:** `virtual-worker-harness` ("VWH", `D:\omnishelf\virtual-worker-harness`) — the whole
harness, not just the coverage flavor.
**Question (owner):** score both per category (1–10); same methodology or not; similar
implementation or not; what can nexus borrow from VWH — for everything, not just the miners.

**Grounded in:** direct reads of all three core mine SKILL.mds, `nexus/harness/README.md`, VWH
`README.md` / `CLAUDE.md` / `PRINCIPLES.md` / `FLAVORS.md` / `docs/framework/contract.md`; two
Explore surveys (VWH kernel/skills/memory/tests; mine-suite evals/tech-specs/proposals/run
artifacts); git-history dating on both repos.
**Correction (2026-07-10, same day, owner input):** the first pass searched only the nexus repo for
run artifacts — but mine registries land in the **target** repos. Verified since:
`docs/reference-model.md` in dotnet-microservices (self-reference mode, runs 1–3 @ 2026-07-05,
skeptic drop-rule exercised — it killed a vacuous grep) and `docs/tech-debt/` (6 area files,
`mvr-pilot-1-2026-07-04`) in omnishelf_flutter_app; a further run is in progress on
omnivision-ai-sdk. The Empirical-validation score and §5 were corrected accordingly; the original
wrong claim is kept struck-through in §5 as a lesson in its own right.
**Prior art this builds on (not duplicated):**
- `docs/proposals/vwh-adoptions-2026-06.md` — Ratified, partially delivered (A1/A3/A6-half done;
  A2/A4/A5 backlog; explicit non-adoption table).
- `docs/research/2026-06-23-vwh-vs-mine-verify-cover.md` — the substrate verdict (hybrid: keep
  plugin-native substrate + rule front-end; steal VWH engineering; don't host on the Python kernel).
  Nothing found today overturns it.
- This doc is the "~a quarter" re-check the 2026-06 proposal scheduled (arrived early — one month —
  because VWH has moved: a third flavor, roast, HANDS-ON/companion, arc-state machinery).

---

## Verdict (read this first)

1. **Scores:** mine suite **7.6/10** average, VWH **8.4/10** average (table below; corrected — the
   first pass under-scored mine's Empirical validation on stale evidence). VWH is the more mature
   *system* (code-enforced invariants, 133 test files, self-applied coverage gate, three
   e2e-validated flavors, continuous CI self-validation). The mine suite is the more rigorous
   *method text*, and **every mine has now run for real** — cover across 4 stacks, from-spec
   piloted, the debt mine on omnishelf_flutter_app, the reference model ×3 on dotnet-microservices,
   omnivision-ai-sdk in progress.
2. **Same methodology?** Yes — same epistemics school, with a documented transfer channel (the
   gate-battery vocabulary flowed VWH coverage flavor 2026-06-12 → mine-verify-cover 2026-06-23,
   name-for-name). Different loop shapes: VWH is an open-ended *optimization* loop (maximand, DAG,
   SOTA ratchet, noise statistics); the mines are single-pass *extraction* pipelines (bounded unit →
   clean-room miners → skeptic → registry) with one small ratchet inside (Cover→Gate to the floor).
3. **Similar implementation?** Same actor philosophy (deterministic privileged orchestrator;
   untrusted agents do all I/O; gates computed from raw tool output), different substrate and
   enforcement depth: Python kernel with process-level enforcement vs Workflow JS + prose method
   that consuming sessions re-instantiate. The mine suite's enforcement ceiling is what an
   orchestrator script can check; VWH's is what a kernel can refuse.
4. **Borrowables:** the 2026-06 backlog (A2 declutter, A4 nudges, A5 decision log) is **re-affirmed
   and now better-evidenced** — VWH's month of evolution strengthens A2 and A4 specifically. Four
   **new** candidates surfaced (B1–B4 below); one prior non-adoption re-examined and upheld.
5. **Risk flag (corrected):** the pilots HAVE run (see the correction note above) — the residual
   risks are different: (a) the nexus-repo eval docs (`docs/skill-evals/2026-07-04-*`) still say
   "never run" and are now stale; (b) the pilot runs' lessons have not been harvested back into the
   skills; (c) this assessment's own first pass is a live demonstration of VWH's "confident closure
   ahead of evidence" lesson — a fresh-context reviewer confidently asserted "never run" from a
   one-repo search. §5 keeps the record.

---

## 1. Scorecard (1–10 per category)

| Category | mine-* | VWH | Justification |
|---|---|---|---|
| Methodology rigor (epistemics, anti-gaming) | 9 | 9 | Tie. Mine: skeptic must RE-EXECUTE evidence; verdict rows without re-execution excerpts are dropped by the orchestrator; flattery-kill framing (extractors never told the repo is exemplary); research-grounded (raw LLM audits ≈79–83% false positives; 80+ agents unanimously endorsed a nonexistent OpenSSL bug — only an empirical evidence gate fixes this; `docs/kb/research/repo-technical-evaluation-for-refactoring.md`). VWH: mechanical firewall, noise-band acceptance, conclusion gate, mandatory blocking close-skeptic, charter gate, gap account. |
| Mechanical enforcement (code vs prompt) | 7 | 9 | VWH enforces in kernel code: a read of a firewalled path *raises* (Python audit hook); the conclusion gate *blocks* at `dag.resolve`; flock single-writer; pre-flight guards block out-of-surface edits. Mine enforces via orchestrator drop-rules + pure-fn gates (`lib/cover-gates.mjs`) — real, but the miner clean-room is **prompt-only** (the mechanical seal — `disallowedTools` + inline source — was deferred; `nexus/harness/README.md` records the conditionality honestly). VWH docks a point for its own admitted gap: the firewall is in-process, not an OS sandbox (`NOTES.md`). |
| Empirical validation | 8 | 8 | **Corrected 2026-07-10** (first pass scored 6 off stale, nexus-repo-only evidence). All mines have real runs: mine-verify-cover ~13 runs across 4 stacks (`harness/.runs/`, 90–100% reachable kill); mine-from-spec flutter pilot (5 red confirmed drifts, zero false alarms); mine-verify-repo pilot `mvr-pilot-1-2026-07-04` → `docs/tech-debt/` (6 areas) in omnishelf_flutter_app; mine-reference-model runs 1–3 (2026-07-05, self-reference) → `docs/reference-model.md` in dotnet-microservices — where the skeptic gate demonstrably fired (killed a vacuous cross-service grep and forced a re-proof). omnivision-ai-sdk run in progress. VWH's edge is a different *kind* of evidence: continuous CI self-validation (coverage ≥90% on itself, selfcheck + dry-runs on every push) vs mine's one-shot-per-target runs; mine's edge is target diversity (7+ real repos, 5 languages). Scored a tie. |
| Reusability / portability seams | 8 | 8 | Tie, different shapes. Mine: the 5-capability adapter contract proven across four stacks; the seam was extracted only after a second stack was live (per its own doctrine). VWH: kernel↔flavor seam proven across three domains; residual ML couplings honestly enumerated in `FLAVORS.md` (most already widened). Both are tied to their runtimes (Claude Code Workflow tool vs a hosted Python repo). |
| Self-improvement loop | 7 | 9 | Nexus: lessons.md → learner → recurrence-gated promotion + provenance tags (A6, shipped 1.18.2). VWH adds what nexus still lacks: the **prune direction** (declutter cadence — grow, then remove what the round added but didn't earn) and a documented convention→code migration history (sparring skeptic fired 0/7 times when convention-triggered → daemon auto-fire was built; EXPERIENCE/NOTES read as a changelog of "the agent kept violating rule X in prose, so it became a kernel gate"). |
| Cost governance | 7 | 8 | Mine: marginal-spend budget caps (gate on the delta, not the shared pool), hotspot top-N bounding, Sonnet pinning with a stated rationale. VWH: campaign budgets, stopping triggers, EV ranking, scout/full tiers, throughput-first doctrine, field-kill on doomed runs. **Weight note (owner stance, 2026-07-10):** for the mine's job this category matters least — the deliverable (gated tests + BR registries) is durable and amortizes across every later pipeline run, agents are Sonnet-pinned, so tokens are not the binding constraint; completeness (90–100% kill, 2–3 passes if needed) beats thrift, and the budget rails exist as runaway-stops, not as optimization pressure. Nothing to change in the skills. |
| Documentation & operability | 8 | 9 | Mine skill text is precise but dense, and there is no onboarding path for a new consumer. VWH ships `HANDS-ON.md` (a repo-correlated team-walkthrough), a strictly read-only `/harness-companion` tutor, a `/bootstrap` wizard, `dagboard`, `doctor`, `selfcheck`. |
| Simplicity / cognitive load | 6 | 7 | The mine SKILL.mds run to 420 heavily cross-referenced lines each; the family invariant is clean but the prose is a wall (each skill re-states the topology, the budget rail, the sibling table). The reader is an agent, not a human — but agent context is the same budget, and repeated blocks are re-read on every invocation. Consolidation IS possible without true "inheritance": the cross-skill pointer pattern already exists (mine-verify-repo "inherits the semantics of mine-verify-cover's Execution topology") and skills ship `references/` files — see proposal P1 (family-core extraction). VWH is 5,448 kernel LOC across 33 modules with standing declutter pressure and a one-page canonical PRINCIPLES.md everything links to instead of restating. |
| Statistical honesty (noise/variance) | 7 | 9 | Mine: ×2 flake run, mutation ratchet, the anti-fake-green total cross-check (agent-reported mutant total vs the tool summary's `Found N`) — adequate for a mostly deterministic domain. VWH: noise-band acceptance (delta's lower CI bound > 0), certify repeats, CI-bounded gate metrics, `variance.py`/`stats.py`. VWH's domain needs it more; it also built it. |
| Output artifact quality | 9 | 8 | Mine registries are the stronger durable species: per-row provenance + `last_verified`, never-delete with disposition flips, append-only changelogs, idempotent re-runs, fact tags → named CI tiers, SYMBOL+CONDITION statements that outlive line numbers. VWH's ledger/DAG/rendered-views/SOTA-folder are strong but campaign-scoped; its artifact species don't target long-lived cross-project consumption. |
| **Average** | **7.6** | **8.4** | (corrected 2026-07-10 — Empirical validation 6→8) |

## 2. Same methodology?

**Yes — one school, two loop shapes.** The shared invariant, stated in both repos in nearly the same
words: *never trust the agent's claim — verify mechanically in a fresh context; a prompt instruction
is a request, not an enforcement; record append-only; degrade honestly, never silently green.* Both
also carry the same abstraction doctrine — VWH contract principle 5 ("extract abstraction from
working code, not ahead of it") ≡ mine-verify-cover's adapter-seam rule ("do not extract this seam
from a single language").

Lineage is documented, not coincidental: the gate battery (`suite_green · no_flaky · mutation_floor ·
no_new_skips · char_pin`) appears name-for-name in VWH's coverage-flavor PRD (2026-06-12) and in
mine-verify-cover (shipped 2026-06-23), with the sprint-rituals BR-coverage evaluation as the
transfer channel. The 2026-06 proposal's framing ("independently converged, strikingly shared DNA")
holds for the *foundations* (deterministic gates ≈ ADR-7/23, skills-as-lore ≈ ADR-4, fresh-context
review ≈ the critic, artifact-first truth ≈ ADR-17); the coverage-specific vocabulary flowed
VWH → nexus.

The structural difference: VWH **learns toward a goal** (maximand, hypothesis DAG with EV ranking,
derived-SOTA ratchet, statistics to keep iteration honest); the mines **establish facts once and
refresh them** (bounded unit → clean-room extraction → consolidate → skeptic verify → graded
registry). One convergence worth noting: mine's classify-survivors stage is functionally VWH's "gap
account" (decompose the remaining gap into named failure modes) — arrived at independently on both
sides.

## 3. Similar implementation?

**Same actor philosophy, different substrate and enforcement depth.**

Shared: a deterministic, privileged orchestrator that holds no filesystem; untrusted agents do all
I/O; gates computed deterministically from raw tool output (VWH kernel gates ≈ `lib/cover-gates.mjs`
pure functions); scope pinned mechanically (mutation scope on the CLI, not just config ≈ the
firewall's declared surfaces); golden/held-out material sequestered from every reasoning agent.

Different:
- **Substrate.** VWH = Python kernel (33 modules, 5,448 LOC) + CLI + git-commit-per-experiment +
  flock + crash recovery + 133 test files. Mine = ~6,000 lines of Workflow JS in the *dev repo only*
  (`nexus/harness/`), shipping to users as **prose method** each consuming session re-instantiates.
- **Enforcement ceiling.** VWH refuses at the process level (audit-hook firewall, blocking kernel
  gates). Mine's ceiling is what an orchestrator script can check per stage — strong for gate
  arithmetic, weaker for agent behavior (the miner clean-room seal is still prompt-level).
- **State model.** VWH: every experiment is an immutable commit; SOTA is a derived pointer; rolling
  views are kernel-rendered from the DAG, never hand-edited. Mine: write-once markdown registries
  with never-delete invariants — the right call for durable cross-project artifacts, already noted
  as the mine side's strongest card.

The 2026-06-23 substrate verdict stands: don't host the mine loop on the Python kernel (a plugin
ships markdown), and keep stealing VWH's engineering where it's portable.

## 4. Borrowables — reconciled ledger

### 4a. Already delivered (no action; noting the validation)

- **A1 — "cheapest correct locus" allocation principle** → in `docs/architecture/README.md` +
  learner triage. VWH's month of further evolution keeps validating it (their convention→code
  ratchet produced `conclusion.py` and the monitor auto-fire exactly along this ladder).
- **A3 — `scripts/selfcheck.mjs`** → delivered; VWH's `selfcheck` + self-applied coverage gate
  remain the richer model for later tiers.
- **A6 (provenance half) — lessons provenance tags** → shipped (nexus 1.18.2).

### 4b. Ratified backlog — re-affirmed, priority sharpened by this pass

- **A2 — declutter skill (the prune lane).** *Now the highest-value open item.* New evidence this
  pass: (a) VWH's accordion demonstrably held its kernel at ~5.4k LOC across a month of aggressive
  feature growth; (b) the nexus symptom is measurable — the mine SKILL.mds alone carry ~900 lines of
  partially repeated topology/safety-rail/sibling-table prose; agent docs keep growing. The VWH
  `declutter-harness` 6-level scan (architecture→code→files→docs→memory→salience) + the explicit
  HARDEN/PRUNE dual mode is directly adaptable to the skill estate.
- **A4 — advisory nudges (Stop-hook locus).** Re-affirmed; VWH's key operating lesson is now even
  better documented ("a mechanism I have to remember to trigger, I won't" — the skeptic fired 0/7
  times until a daemon fired it). The nexus-native locus decision (Stop/SubagentStop-time check,
  silent-when-clean, overrides logged) stands; the narrow SubagentStop spike is still the opener.
- **A5 — decision log with outcome back-links.** Unchanged; the pilot design (write+read shipped
  together, deterministic close-protocol back-fill, kill-if-unused criterion) stands.

### 4c. NEW candidates from this pass (B-series — awaiting owner triage)

- **B1 — Conclusion-gate verdict semantics** → home: `diagnose` skill + reviewer/critic verdict
  grammar. Two VWH rules port directly as prose (optionally later a lint):
  1. a **causal claim must name its single changed variable** or carry an explicit
     `confounded`/`factorial` tag;
  2. a **failure/kill verdict on thin evidence is refused by default** (VWH: "refuses a failure on a
     still-rising curve"; nexus mapping: a root-cause verdict after one probe, or abandoning a fix
     approach mid-convergence) — override requires logged reasoning.
  Effort: small (prose in 2–3 shipped files → PATCH). **Confidence: high** — VWH built this gate
  because the prose version kept failing; nexus gets the rule before paying that tuition.
- **B2 — Onboarding layer: HANDS-ON walkthrough + read-only companion skill** → home: a new
  `nexus-companion` skill + a walkthrough doc. Nexus is a shipped product whose consumers currently
  absorb agents-workflow + eight agent docs cold. Copy VWH's two safety patterns: the companion is
  **strictly read-only with an explicit forbidden-command list** (VWH bars even `harness plan`
  because it auto-starts a daemon), and the walkthrough is **repo-correlated** (concept → where it
  lives), not a parallel spec that can drift. Effort: medium. **Confidence: medium-high** — clear
  adoption-cost payoff; unproven demand signal.
- **B3 — Roast: the inverted skeptic (interrogate the operator)** → home: an opt-in PO/architect
  mode for high-uncertainty definitions, slotting into the existing ADR-25 gate alongside the
  options panel. VWH's `roast` asks the *operator* ≥30 acquisition-driven questions and requires
  every answer be **durably ingested** (DAG/ledger/memory) before the round closes — nexus
  challenges agent outputs (critic) but has no systematic extraction of the user's unstated
  knowledge with ingestion receipts. Effort: medium. **Confidence: medium** — novel, high potential
  on genuinely uncertain specs; must stay double-gated (ADR-25) or it's an unconditional cost.
- **B4 — Charter-gate framing for new-target mine runs** → home: the kickoff of every mine run on a
  fresh target (omnivision-ai-sdk now; each future repo). VWH's kickoff charter refuses to optimize
  until the basics are confirmed: *a metric that fits the goal; a goal between an honest baseline
  and a real ceiling*. Mine equivalents at run kickoff: tool preflight confirmed on the target repo
  (the metric-layer runbook already specifies this), an explicit survival-rate expectation stated
  up front, and a stop-budget. Effort: trivial (a short kickoff checklist). **Confidence: high** on
  cheapness. *(Originally framed as pilot preparation; the pilots have since run — the framing now
  applies to every new target.)*

### 4d. Non-adoptions re-examined — all stand

The 2026-06 non-adoption table was re-checked against current VWH; every entry still holds
(DAG/islands/EV — pipeline work is a known sequence; variance/noise machinery — no noisy scalar in
feature delivery; firewall/data-tiers — no held-out eval to protect in the pipeline itself;
commit-per-experiment — ADR-17 artifacts + git serve this; intent journal/crash recovery — the
Workflow platform's resume covers it; monitor daemon — no home in a plugin, and its *principle*
already drives the A4 hook design). One entry gets a note: **`agent_calib`** (calibrating the
agent's confidence labels against realized outcomes) remains non-adopted for lack of a scalar
outcome stream — but if A5's decision log lands and closes its loop, decision-outcome rows become
exactly that stream; revisit `agent_calib` only after A5 proves itself.

## 5. Risk flags — corrected 2026-07-10

~~Original claim: `mine-verify-repo` and `mine-reference-model` are shipped, eval-accepted, and have
never executed; run the pilots before further miner investment.~~ **Wrong** — the pilots ran
2026-07-04/05 (debt mine → omnishelf_flutter_app `docs/tech-debt/`, 6 areas; reference model →
dotnet-microservices `docs/reference-model.md`, self-reference, runs 1–3), and a further run is in
progress on omnivision-ai-sdk. The first pass searched only the nexus repo, whose own eval docs
(dated 2026-07-04, pre-pilot) said "run artifacts consulted: NONE" — stale evidence read as current.

The claim is kept struck-through deliberately: it is a live instance of VWH's most candid
self-lesson (*"confident closure ahead of evidence"* — effort-insensitive: their highest-effort run
went the most wrong). The verifiable-evidence discipline both systems preach applies to assessments
of them, too.

**Actual residual risks:**
1. **Stale meta-docs** — the 2026-07-04 skill evals and the pipeline summaries still describe the
   pilots as operator-owed/unexecuted. Annotate them (a one-line "pilot executed 2026-07-0X, see
   {target repo}" note) rather than leaving two contradicting records.
2. **Unharvested pilot lessons** — the runs exposed real method behavior (e.g. the skeptic killing a
   vacuous grep and forcing a re-proof; the merged-finding audit notes). Nothing routed these back
   into the SKILL.mds or a lessons file yet — exactly the fluid→memory→MD ratchet's first rung.
3. **Registry refresh cadence unowned** — both registries now exist in target repos with
   `last_verified: 2026-07-05`; nothing schedules the refresh runs (run 2+ semantics are specified
   in C5/R4 but no trigger owns them).

## 6. Suggested sequencing (revised after the correction; superseded in detail by the proposal)

The concrete work plan now lives in `docs/proposals/mine-family-next-wave-2026-07.md` (P1–P5). The
estate-level items stay in this order:

1. **Stale-doc annotation + pilot-lesson harvest** (risk items 1–2 above) — cheap, honest-record
   hygiene; feeds P1.
2. **A2 declutter skill** — highest-value open estate item; the mine-family consolidation (P1) is
   its first natural workload.
3. **B1 conclusion-gate semantics** — cheapest new item, two shipped-file PATCH.
4. **A4 nudges spike → A5 decision-log pilot** (existing ratified order; A5 success later unlocks
   the `agent_calib` revisit).
5. **B2 companion / B3 roast** — owner-demand-driven; neither blocks anything.

---

## 7. Owner Q&A (2026-07-10 review — plain-language answers)

**Q1 — "The miners DID run; why did VWH score better on validation?"** The score was wrong — built
on stale evidence (the nexus-repo eval docs, written 2026-07-04 *before* the pilots, and a search
that never looked in the target repos where the registries actually land). Corrected: 8 vs 8, a tie.
The residual difference is the *kind* of evidence, not the amount: VWH re-proves itself continuously
(every push runs 133 test files + a ≥90% coverage gate + dry-runs on its own kernel), while a mine
is re-proven only when someone runs it on a target. Mine's counter-edge: far greater target
diversity (7+ real repos, 5 languages). Neither kind is strictly better.

**Q2 — "What does the prune do, and how does the auto-evaluation work?"** VWH's rule is that every
piece of the system lives at one of three levels: **code** (mechanically enforced — a gate that
refuses), **markdown** (instructions the agent reads — cheap to change, semi-reliable), or **the
agent's own judgment** (free, adaptive, but re-derived every session and not deterministic). Two
standing movements keep the levels balanced:
- **Harden (up):** when the agent *keeps dropping* a markdown rule, the rule is promoted into code.
  Real example: their fresh-context skeptic was a "remember to trigger it" instruction — one run
  fired it 0 out of 7 times — so they built a daemon that fires it automatically. The rule became a
  mechanism.
- **Prune (down):** the reverse. Every ~5–10 changes, a `declutter` pass scans docs, memory, code
  and asks "what is no longer pulling its weight?" — deleting a rule is reframed as *trusting the
  model's judgment to re-derive it*, not losing it. That pressure is why their kernel stayed ~5.4k
  lines through a month of heavy growth.
The "auto-evaluation" is the loop that feeds both directions: every operator correction is treated
as a learning signal (a reflection step proposes the cheapest fix level: memory < doc < nudge < gate
< kernel-code), the lesson is captured in a journal with provenance tags, and only lessons
**confirmed repeatedly** get promoted upward — one anecdote never becomes a rule. Nexus already has
the upward half (lessons.md → learner → recurrence-gated promotion, A1/A6 delivered); what it lacks
is the **prune direction** — that is exactly the ratified-but-unbuilt A2 declutter skill, and the
mine-family consolidation (proposal P1) is its natural first job.

**Q3 — "Cost will never be the problem — we need ALL the tests, 90–100% kill, agents are Sonnet."**
Agreed, and recorded in the scorecard as a weight note: for the mine's job the deliverable is
durable (gated tests + BR registries amortize across every later pipeline run), so completeness
beats thrift and tokens are not the binding constraint — time-to-done is. The budget rails in the
skills stay as what they were designed to be: runaway-stops (a broken loop burning a session), never
optimization pressure. **No change to the skills.**

**Q4 — "Split into templates / inherit a base skill? Everything was built but never consolidated."**
True inheritance between skills does not exist on this platform — but two supported mechanisms give
the same effect and are *already in use in the family*: cross-skill pointers ("inherits the
semantics of mine-verify-cover's Execution topology" — live today in both newer mines) and shipped
`references/` files (mine-verify-repo ships `references/metric-layer.md`). Proposal **P1** applies
them: extract the four repeated blocks (topology, budget rail, skeptic verdict grammar, registry
invariants + the sibling table) into one family-core reference owned by mine-verify-cover; siblings
keep a pointer plus whatever their grep-checkable ACs bind in-file. Prose-shape change only, gated
by skill-lint + a post-change evaluate-skill pass — designed explicitly around the "don't break the
mine" constraint.

**Q5 — "Statistical honesty — I don't fully understand, but improve it if we can."** Plain terms:
it is the discipline of not letting a pass/fail verdict be decided by randomness. In the mine's
world randomness appears in two places: **flaky tests** (a test that passes sometimes) and
**mutation-run noise** (a mutant killed by a timeout this run, surviving the next). The mine already
handles the first order well: every suite runs twice (`no_flaky`), kill-rate may never regress
between iterations (the ratchet), and the mutant total is cross-checked against the tool's own
summary (anti-fake-green). Proposal **P2** adds the two cheap upgrades VWH practice suggests: measure
the target repo's *pre-existing* flake before Cover writes anything (so inherited flake is raised at
kickoff, not blamed on generated tests), and when the kill rate lands within one mutant of the
floor, run the mutation pass once more before declaring pass/fail. Both gated on a spike: if no real
run ever hit those conditions, they stay documented seams — no machinery for unobserved pain.

**Q6 — "Mechanical enforcement — too complex for me, but improve it if worth it."** Plain terms: a
**prompt rule is a request** ("please don't read other files") — the agent almost always obeys, but
nothing stops it; a **mechanical rule is a lock** (the platform refuses the action). The mine's
verifiers are already locked (they receive the code inline and read zero files). The **miners** are
still on the request level — documented honestly in `nexus/harness/README.md` as deferred work, which
means the recall numbers are *conditioned on miners honoring the prompt*. Proposal **P3** closes it
where practical: spawn miners as a read-restricted agent type with the target source passed inline —
one small spike first to confirm the platform actually denies the reads. Repo-scope mines keep the
skeptic's must-reproduce gate as their mitigation (whole areas can't be inlined).

**On the two plans (mine-semantic-model + data-analyst extension):** both are in the proposal —
P4 adopts the KG skill as the **fifth mine** (it fits the family invariant: unit = one datasource
area; ground truth = live schema + read-only probes; gate = probe re-execution + KB grounding +
operator interview; output = the semantic-model bundle), P5 scopes the **nexus-analyst** extension
plugin as a definition handoff with the VWH boundary rule applied (method → plugin, autonomous loop
→ VWH, the semantic model as the shared artifact).

---

## 8. Re-evaluation under the job lens (2026-07-10, owner directive)

**Owner's re-weighting:** "get the job done well" always beats engineering sophistication — both
matter, but outcome wins. The original scorecard mixed the two; several rows scored *machinery*
(kernels, daemons, statistics) where the honest question is *delivered outcomes per unit of
machinery*. Re-scored below — only the rows where the lens changes which evidence counts; unchanged
rows keep their §1 scores and justifications.

| Category (job-lens reading) | mine-* | VWH | What changed and why |
|---|---|---|---|
| Methodology rigor | 9 | 9 | Unchanged — false-positive kill IS the job. |
| Defect containment *in practice* (was: mechanical enforcement) | 8 | 9 | Job lens asks "what escaped?", not "how many locks exist." Mine: one fake-green escaped once (2026-06-23), was caught and structurally fixed (real-report gate read); no known clean-room leak since across all runs. VWH structurally avoided that class but its own firewall is admittedly non-airtight. Gap narrows 7→8; VWH keeps the edge for tuition already paid. |
| **Job outcomes delivered** (was: empirical validation) | **9** | **8** | The lens flips this row. Mine's *products* — verified BR registries, mutation-gated suites, tech-debt and reference-model registries — are in production use across 7+ repos the org develops in daily. VWH's campaigns validate the harness excellently (retail flavor serving nightly runs, coverage .NET-live), but fewer of its end-products are load-bearing artifacts in daily development. |
| Reusability | 8 | 8 | Unchanged. |
| Self-improvement loop | 8 | 8 | Was 7 vs 9 — engineering-weighted. Job lens: the manual learner demonstrably does the job (5 recurring lessons promoted at the last consolidation; owner-confirmed) at near-zero machinery; VWH's loop does the same job with a daemon + kernel and *needed documented failures to get there* (0/7 skeptic firing). Nexus's one real job gap — the trigger — is P6, already in execution. Neither engineering depth nor its absence is the outcome; both loops deliver. |
| Cost governance | 8 | 8 | Was 7 vs 8. Job lens: neither system has ever had a cost-caused failure; mine's outputs amortize (owner stance, §1 weight note). Both adequate — differences here are machinery, not outcomes. |
| Documentation & operability | 8 | 9 | Unchanged — onboarding is a real job dimension (handoff to a second operator), VWH genuinely leads. |
| Job delivered per unit of machinery (was: simplicity) | 7 | 7 | Mine delivers with markdown + a dev-only substrate (nothing to host); its real job cost is the 420-line skill walls paid in agent context per invocation (P1 fixes). VWH's kernel is lean *for what it does* and declutter-pressured, but it is a standing system to maintain. Called even. |
| Statistical honesty | 8 | 9 | Mine 7→8: in every real run to date the ×2/ratchet/anti-fake-green trio sufficed — no known noise-caused wrong verdict (P2's spike will confirm or refute). VWH keeps the edge because its noisy domain demands more and it built more. |
| Output artifact quality | 9 | 8 | Unchanged. |
| **Average (job lens)** | **8.2** | **8.3** | |

**Bottom line, honestly stated:** the §1 gap (7.6 vs 8.4) was largely an engineering-maturity
artifact. Under the owner's job-first weighting the two systems are **effectively tied** — each
leads exactly where its own job demanded it (VWH: noise handling, self-hardening, onboarding; mine:
production-embedded outputs, durable artifact species). The practical consequence is unchanged but
now better-grounded: **borrow VWH's *lessons* (tuition it already paid), never its *machinery* for
machinery's sake** — which is precisely the P6-trigger-only / P7-loop-not-daemon shape already in
execution.

**The learner, specifically re-answered:** under the job lens the manual learner is not merely at
parity — it is *ahead on cost-effectiveness* (same job, a fraction of the machinery). VWH's
auto-learn engineering is evidence of what breaks without a trigger, not evidence that more
process is needed. The trigger-only verdict (P6) stands, reinforced.

---
*Assessment only — no plugin files changed. Anything here that graduates to work becomes a
proposal/backlog row per ADR-25/27/28; items touching `plugins/**` take a `release-plugin` bump
in-commit.*
