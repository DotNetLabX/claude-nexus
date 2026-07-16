# Machinery evaluation: nexus mine family vs virtual-worker-harness

**Date:** 2026-07-15 · **Status:** Assessment — feeds owner triage; no changes applied.
**Subjects:** the nexus mine family, scored in two arms (§4) — the **Cover arm** (`mine-verify-cover`
+ stack adapters, which has a reference harness) and the **prose siblings** (`mine-verify-repo`,
`mine-reference-model`, `mine-design`, `mine-algorithm`, `mine-verify-flows`, which have none).
**Comparator:** `virtual-worker-harness` (VWH, `D:\omnishelf\virtual-worker-harness`).

**Criterion — machinery only.** This doc scores *the machines as built*: which mechanisms exist, what
each contains, at what enforcement tier, how they compose. **Both harnesses are proven; efficacy is
out of scope and is not a scoring input.** No run counts, no breadth, no outcome deltas, and — the
distinction that matters — **no "designed well but never observed firing" penalty.** A mechanism is
scored on what it is, not on how often it has been watched. For the outcomes question, see
[`2026-07-12-mine-family-vs-vwh-per-member.md`](2026-07-12-mine-family-vs-vwh-per-member.md); this doc
does not reconcile against it, because it is answering a different question.

**Method.** Categories fixed before grounding. Two parallel sonnet read passes grounded the mechanism
inventories live: (1) VWH — 34 kernel modules / 5,448 LOC, `contract.py`, flavors, CI, plus the test
suite as the statement of each invariant; (2) the eight mine SKILL.md files + `mine-family-core.md` +
the `nexus-dotnet` adapter + the dev-repo `harness/`.

---

## 1. Verdict

| Subject | MC | ET | IA | SM | TF | XS | EC | CP | **Mean** |
|---|---|---|---|---|---|---|---|---|---|
| **VWH** | 9 | 9 | 8 | 9 | 7 | 8 | 6 | 6 | **7.8** |
| **mine Cover arm** | 7 | 6 | 6 | 6¹ | 8 | 6 | 8 | 9 | **7.0** |
| **mine prose siblings** | 7 | 2 | 6 | 4 | 8 | 4 | 8 | 9 | **6.0** |

¹ **Corrected 2026-07-15 (post-review), was 4.** The first cut scored the Cover arm as having no
run-level state machinery. It has one — supplied by the Workflow tool, not by the harness — and the
harness is deliberately engineered to use it. See §4 SM. The prose siblings keep 4: having no workflow
script, they have no runId to resume from.

MC = mechanism coverage · ET = enforcement tier · IA = independence architecture · SM = state model ·
TF = topology fit · XS = extensibility seam · EC = economy · CP = composability.
Scale 1–10: **5 = adequate with real gaps · 7 = good · 9 = would bet the estate on it.**

**These are not the same kind of machine, and the means hide it.** VWH wins where machinery is *hard*
— enforcement tier, state model, mechanism coverage. The mine family wins where machinery is *shaped*
— topology fit, economy, composability. Read the split, not the average:

> **VWH is a deep, hard, single-purpose engine. The mine family is a shallow, soft, highly composable
> pattern.** VWH builds guarantees into code. The mine family builds a *shape* that can be re-pointed
> at a new unit in an afternoon. Each is bad at being the other.

**The one asymmetry that isn't a tradeoff:** the mine family's deterministic gate layer
(`harness/lib/*.mjs`) is real, pure and unit-tested — and **ships nothing to users**. That is not a
design philosophy, it is an unclosed seam (§3.2).

---

## 2. The categories

| Code | Category | The question — asked of the machine, not its track record |
|---|---|---|
| **MC** | Mechanism coverage | Which failure classes does the machinery have an organ for? Which are simply uncovered? |
| **ET** | Enforcement tier | Is a failure structurally impossible, or discouraged in prose? |
| **IA** | Independence architecture | How is proposer/judge separation *constructed*? |
| **SM** | State model | What state exists, is it crash-safe, does a killed run resume? |
| **TF** | Topology fit | Does the machine's shape match the job's shape, or is it over/under-machined? |
| **XS** | Extensibility seam | What does a new domain structurally cost, and is the seam checked? |
| **EC** | Economy | Does each mechanism earn its place in the design? |
| **CP** | Composability | Can the parts be lifted, re-pointed, recombined? |

**Enforcement tiers:** **(a)** deterministic code that raises · **(b)** a CI/test/tool gate ·
**(c)** skill or prompt text an agent is asked to follow · **(d)** model judgment.

---

## 3. The mechanism map

### 3.1 Organ-by-organ

| Failure class | VWH organ | Tier | Mine organ | Tier |
|---|---|---|---|---|
| Input leakage | `firewall.py` — `sys.addaudithook` on `open()`, realpath-anchored | **a** | clean-room prompt text | **c** |
| Self-judging | spar brief excluding narrative + fresh `claude -p` subprocess; close-skeptic blocks `_STOP.md` | **a/d** | separate `agent()` call (separate context) | **a/d** |
| Vacuous verification | `mutation_floor` hard boolean in `Score.viable` | **a** | `mutationFloor` + 6 sibling gates | **a**¹ |
| Wrong-target scoring | `_rekey` path resolution | **a** | `targetMutated` (full-path match) | **a**¹ |
| Attribution loss | DAG `AtomicityError` — one lever per node | **a** | — *(no analog)* | — |
| Confounded conclusion | `conclusion.py` — blocks unless one variable named | **a** | — *(no analog)* | — |
| Premature kill | `_guard_deliberate_invalidate` | **a** | — *(no analog)* | — |
| Noise-as-progress | `acceptance.py` / `variance.py` — CI-lower-bound | **a** | — *(no analog)* | — |
| Overconfidence drift | `agent_calib.py` — Beta-Binomial shrinkage on the agent's own claims | **a** | — *(no analog)* | — |
| Crash mid-run | `journal.py` + `recovery.py` (idempotent reconcile) | **a** | Workflow `journal.jsonl` + `resumeFromRunId` — **tool-supplied, unwired** | **b**³ |
| Concurrent writers | `lock.py` — `flock`/`msvcrt`, raises `CampaignLocked` | **a** | — *(no analog)* | — |
| History loss | DAG `DeletionError` + commit-per-experiment | **a** | registry never-delete + supersede grammar | **c** |
| Runaway spend | `policy.py` cost/runway gates | **a** | marginal budget delta + `MAX_ITERATIONS`; tool layer: opt-in hard `budget.total` throw + 1000-agent lifetime cap | **a**¹ / **b** |
| Saturated metric | `charter.py` — blocks phases on arithmetic | **a** | — *(no analog)* | — |
| Pattern cosplay | — *(no analog)* | — | `mine-design` two-tier reject-by-default judge | **d** |
| Reckless replacement | — *(no analog)* | — | `mine-algorithm` BR-conformance oracle | **d** |
| Invented virtues | — *(no analog)* | — | `mine-reference-model` skeptic + anti-flattery framing | **c/d** |
| Agent-estimated priors | — *(no analog)* | — | `mine-verify-repo` metric layer (Code Maat / lizard) | **d**² |
| Blind-arm contamination | — *(no analog)* | — | `independence-check.mjs` — fails-closed | **a**¹ |

¹ Tier (a) **in the dev repo only** — see §3.2. ² Described as mechanical; is a command recipe an LLM
executes and does arithmetic over. ³ Tier (b) **available but unwired** — the organ exists at the tool
layer, the harness is built to be compatible with it, and no standing artifact invokes it. Exercised
exactly once, ad-hoc (2026-06-23 — see §4 SM).

**Read the empty cells — they are the whole story.** VWH has seven organs the mine family has no analog
for, and every one of them is an *experiment-loop* concern: attribution, confounds, premature kills,
variance, calibration, concurrency, charter. The mine family has five VWH lacks, and every one is a
*judgment-quality* concern: pattern cosplay, reckless replacement, invented virtues, agent-priors,
blind-arm contamination.

Neither is missing organs it needs. **They are machines for different jobs**, and the gaps are the
proof: VWH is built to run a long iterative search honestly; the mine family is built to make one
bounded extraction trustworthy. Which is exactly what a hypothesis DAG (1,057 LOC, VWH's largest
module) is for, and exactly why the mine family doesn't have one and shouldn't.

### 3.2 The seam that isn't a tradeoff

`mine-verify-cover/SKILL.md` §Substrate: *"The loop runs as a Workflow the orchestrator **instantiates
from this spec** — skill markdown cannot reference a bundled script path, so the Workflow is authored
from this method, **not loaded**."* And `harness/README.md`: *"Dev-repo machinery… **ships nothing to
users** and triggers **no plugin version bump**."*

So every ¹-marked tier (a) above is (a) *here* and (c) *there*. `cover-gates.mjs` — `suiteGreen`,
`noFlaky`, `mutationFloor`, `targetMutated`, `noNewSkips`, `charPin`, `mutationRatchet` — is pure,
tested, correct code that a consuming project **never receives**; a real run re-authors that logic from
prose, unverified, each time.

**The workflows are not merely unshipped — they are unshippable as written.** `cover.workflow.js:263`:
`const RUNS_DIR = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'`. The same hardcoded dev-repo
absolute path appears in `cover-cpp.workflow.js:200`, `cover-flutter.workflow.js:223`,
`cover-php.workflow.js:264` — and in the `loop`, `loop-flutter`, `spec-cover`, `spec-cover-calc` and
`merge` drivers: 9 of the directory's 10 workflow files pin it (all but Increment-1's
`mine-verify.workflow.js`, which predates `.runs/`). These are **dev-repo drivers pointed at external targets**, not portable
runners: the C++/PHP/Dart work happened in other repos, but the driver was always this one. So the
*shipped* artifact (SKILL.md) and the *engineered* artifact (workflow.js) are two different programs,
and the tier-(a) gate battery lives only in the second.

**This was the plan, and it is the one Increment that did not land.** The 06-14 harness plan, Increment
4: *"Deterministic helpers (recall scorer, gate computations, KB-ledger writer) → small scripts;
consuming projects receive them via the read-index copy pattern (ADR-5)."* Increment 4 shipped the
method prose and left the helpers in `harness/`. The gap is not an oversight in the design — it is an
unexecuted step of it.

This is worth separating from the soft-vs-hard philosophy, because it isn't one. Prompt-tier
clean-room is a *constraint* (§3.3). Un-shipped gate code is an *unclosed seam*: the machine is
already built and simply doesn't reach the place it runs. That asymmetry is the cheapest thing on this
page to fix.

### 3.3 The constraint under the clean-room

The mine family's clean-room is tier (c) — and today it structurally cannot be otherwise:

- `harness/loop.workflow.js:24-30` — *"`agent()` has NO `disallowedTools` option (verified against the
  tool contract)… **Current seal status: PROMPT-ONLY**."*
- ADR-13 — *"a synchronous PreToolUse `deny` is **not honored** for a background (sidechain) subagent's
  tool call"* — while `mine-family-core.md` mandates exactly that spawn shape ("staged **background**
  agents").
- The escape hatch is an open spike: `mine-family-next-wave-2026-07.md` line 282 — *"P3 spike result:
  does a read-restricted `agentType` actually deny file reads under Workflow?"*

VWH is not cleverer here; **it is running somewhere else.** It owns a Python process, so it can install
an audit hook on `open()`. The mine family orchestrates black-box background subagents through a tool
contract that exposes no such lever. Same intent, different substrate, different ceiling.

Worth recording as a machinery fact rather than a track record: the family's one *measured* tier-(c)
compliance rate is **1 of 13** (fact-tag emission, including suites generated after the rule shipped).
That number is a property of the tier, not of the harness — it is what asking politely buys, and it is
the strongest argument for closing §3.2.

---

## 4. Per-category findings

### ET — enforcement tier · VWH 9 · Cover 6 · prose 2

VWH's guarantees raise: `DeletionError`, `CycleError`, `AtomicityError`, `FrontierError`,
`ConclusionGateError`, `InvalidateGuardError`, `CampaignLocked`. `governance.on_stop` refuses to write
`_STOP.md` while the close-skeptic is unserviced. The firewall docstring states the design intent
exactly — *"a read of a firewalled path raises, **not by convention**"* — and paths are realpath-anchored
because *"cwd-relative matching was bypassable by any `open()` issued from a different working
directory."* Not a 10 by VWH's own admission (`NOTES.md`): the firewall is *"an in-process Python audit
hook, not an OS sandbox — a spawned subprocess could read firewalled paths."*

The Cover arm's 6 is `cover-gates.mjs` at tier (a), discounted for §3.2. **The prose siblings' 2 is the
sharpest machinery finding in this doc**: the `harness/*.workflow.js` glob lists `loop`, `cover`,
`spec-cover`, `loop-flutter`, `cover-flutter`, `spec-cover-calc`, `cover-cpp`, `cover-php`,
`mine-verify`, `merge` — **none for repo, reference-model, design, algorithm or flows.** For those five,
`mine-family-core.md`'s "the orchestrator computes it" resolves to a live LLM session doing arithmetic
by hand from prose, per the file's own definition of orchestrator.

A tier-(a) claim to retire: the skeptic's must-re-execute rule is enforced as a **JSON-schema required
field** (`BATCH_VERDICT_SCHEMA.required = ['id','verdict','evidence']`). That forces the *field* to
exist — not even non-empty (`type: 'string'`, no `minLength`; `""` passes). `mine-family-core.md`
describes it in tier-(a) language — *"the orchestrator **drops** any verdict without one"* — but it
drops verdicts missing the field, not verdicts missing evidence. Tier (c) wearing (a)'s clothes.

### SM — state model · VWH 9 · Cover 6 · prose 4

**This section is corrected from the first cut, which scored the Cover arm 4 and recommended building
VWH's journal/recovery/lock trio. That recommendation was wrong: the organ already exists.**

VWH still wins, and its machinery is its own: an in-flight journal
(`applied→training→trained→ledgered`), `recovery.reconcile` **proven idempotent by test** (double-reconcile
doesn't re-bump `num_experiments`), a single-writer lock raising on contention, atomic JSON writes, a
`crash_at` fault-injection harness. Resume is `HARNESS_CAMPAIGN_DIR`-addressed from authoritative JSON,
never inferred from `git log`.

**What the first cut missed.** The Workflow tool supplies the Cover arm a journal and resume for free:
a run returns a `runId`; `Workflow({scriptPath, resumeFromRunId})` replays the unchanged prefix of
`agent()` calls from cache; `journal.jsonl` records every agent's actual return value. And the harness
is **deliberately engineered to stay compatible with it** — the resume-safety discipline is visible in
comments across every workflow file: *"no Date/Math.random — pure string op, resume-safe"*
(`cover-cpp.workflow.js:215`, `cover-flutter.workflow.js:240`, `cover-php.workflow.js:228`),
*"new Date() throws in the Workflow runtime (breaks resume)"* (`loop.workflow.js:246`), *"The
orchestrator VM has no Date object (calling it breaks workflow resume)"* (`loop.workflow.js:318`).
Someone paid sustained attention to keeping resume working.

**And no standing artifact invokes it.** No workflow, and no SKILL.md runbook, references
`resumeFromRunId`. It has fired exactly once — ad-hoc, in the 2026-06-23 ReviewInvitation run-eval
(`docs/specs/adhoc-MineVerifyCoverHarness/delivery/run-eval-reviewinvitation-2026-06-23.md`): Run 1
halted on the budget-gate misfire, the script was fixed, and the resume replayed the cached
Mine→Verify instantly (~193k tokens saved) and ran Cover live to all-gates-green. Then the knowledge
decayed: three weeks later both census passes *and* this doc's own post-review check concluded it had
never been used, because no durable artifact records it. The defect is not a missing organ, and not
an unproven one — it is **an organ that works, invoked once from session memory, wired to nothing.**

Why 6 and not 8: resume is **same-session only**, so a run killed today cannot be resumed tomorrow;
there is **no lock** (though contention matters far less here than in VWH, whose campaigns are
long-lived and multi-worker); and the artifact-level story, while genuinely good machinery — idempotent
registry refresh with a `resolved`/`still-active`/`superseded` grammar and never-deleted rows
(ADR-43/45/49-51) — is not a substitute for in-run recovery.

The **prose siblings keep 4**: with no workflow script there is no `runId`, so the tool-supplied organ
does not reach them. Their only state machinery is the registry's idempotent refresh.

### TF — topology fit · VWH 7 · mine 8

The category where the mine family wins on design, not on thrift.

Its topology — *bounded unit → parallel clean-room miners → consolidate → skeptic → graded registry* —
is exactly as much machine as the job needs. One shot, no loop, no maximand, no DAG, because a bounded
extraction has no search space to navigate. Nothing is carried that isn't used.

VWH's 7 is over-machining outside its origin domain, and its own notes say so: the ML-shaped
phase/advisory layer misfires on non-ML flavors — a 0%-coverage cold start wrongly trips *"AT FLOOR —
not learning, pivot structurally."* The hypothesis DAG, EV ranking, gap account and calibration are
right for a long ML search and heavy for a coverage campaign. `gap_account.py` is a mechanism the
coverage flavor's charter simply doesn't need.

### CP — composability · mine 9 · VWH 6

The mine family's best category and its actual architectural achievement. Eight siblings share **one**
core reference; each swaps three slots — unit, ground truth, gate:

| Mine | Unit | Ground truth | Gate |
|---|---|---|---|
| `mine-verify-cover` | one class | code | mutants |
| `mine-verify-repo` | one repo | git metrics + code | hotspot rank + re-execution |
| `mine-reference-model` | one reference repo | reference source | invented-virtue kill |
| `mine-design` | one class/function | complexity census | two-tier judge |
| `mine-algorithm` | one algorithm-shaped unit | BR registry | row-by-row conformance |
| `mine-verify-flows` | one app's flows | routes + on-device output | sabotage + twice-green |

*"The family invariant is unchanged across all eight: bounded unit → clean-room miners → consolidate →
skeptic verify → graded/verified registry. What changes per member is the unit, the ground truth, and
the failure mode the gate kills."* That is a genuine abstraction — eight machines from one shape, with
a single owner for the shared definition and an explicit supersede-don't-fork rule.

VWH's 6: the kernel is a coherent Python package but coupled to its own campaign model. The firewall
lifts cleanly; the DAG does not. A new flavor slots into the existing engine — it does not recombine
the engine's parts.

### EC — economy · mine 8 · VWH 6

VWH spends 27 mechanisms / 5,448 kernel LOC. Its clearest ornamental organ is the **substrate island**:
narrated in `README.md`, `CLAUDE.md` TOP RULE 2, `FLAVORS.md` and every cookbook — yet `dag.py`
contains **no code that recognizes an island named "substrate."** It rides entirely on generic
under-explored-island nudging. Add the non-ML misfires (§TF) and the design carries weight it doesn't
use.

The mine family is lean, and — to its credit — labels its own soft spots rather than dressing them up:
`mine-family-core.md` §Kickoff checklist is self-described *"**Wired-but-advisory**… discipline without
an enforced gate"*; the Cover generation guard says *"volume reduction, **not enforcement** — a prompt
instruction is a request, not a guarantee that it is followed."* Honest self-labeling is a machinery
virtue; it makes the tier legible to the next reader.

### MC — mechanism coverage · VWH 9 · mine 7 · IA · XS

**MC** — §3.1's map is the finding: VWH has an organ for nine failure classes the mine family doesn't
address, all loop-shaped. The mine family covers five VWH doesn't, all judgment-shaped. VWH's 9 is
breadth of failure classes with an organ each; the mine family's 7 reflects real, named gaps
(no attribution, no confound gate, no crash organ) that its one-shot topology mostly — but not
entirely — excuses. The crash gap is not excused by topology.

**IA · VWH 8 · mine 6.** VWH's construction is stronger: `assemble_spar_brief` *"deliberately
**EXCLUDES** the agent's narrative (hypothesis/learning/reasoning) — the skeptic must not inherit the
frame it is red-teaming"*, spawned as a separate process with no shared history. Not 9: mid-run, by
design, most judge-moments are still the same agent; the skeptic is cadence-gated and mandatory only at
close. The mine family's 6 is its core insight done right — separate `agent()` calls are genuinely
separate contexts, plus provenance-stripping and model-tier separation (opus judge / sonnet designers)
— capped because **no code verifies the strip happened.** Its one real mechanical check,
`independence-check.mjs`, is fails-closed but narrow: it validates **declared path manifests the
orchestrator itself assembles**, catching a wiring mistake, not an agent reading an undeclared path.

**XS · VWH 8 · Cover 6 · prose 4.** VWH's seam is mechanically checked: an adapter Protocol
(`contract.py`), a conformance harness with adversarial fixtures (`test_conformance_rejects_legacy_train_signature`,
`::rejects_a_broken_adapter`), `selfcheck` cross-checking the `FLAVORS.md` registry against disk, and a
`dry-run` that must complete one honest iteration from a fresh sandbox clone. The mine family's seam is
a prose capability table — `mine-verify-cover-dotnet` is ~130 lines, no executable: capability
fill-ins, scaffold recipe, pinned versions, toolchain gotchas, same-basename-partial rules. Cheap,
unchecked, no conformance test, no drift check across the four adapters that now exist.

---

## 5. What each should steal

**Mine family ← VWH**, ranked by *machinery gap closed ÷ work required* — reordered after the
post-review checks (§4 SM). Carried into a proposal:
[`mine-machinery-hardening-2026-07.md`](../proposals/mine-machinery-hardening-2026-07.md).

1. **Wire up the resume you already built — and used once.** Not "build a journal" — invoke
   `resumeFromRunId`, and say so in the runbook. The organ exists at the tool layer, the harness has
   been kept resume-safe for weeks, and it has fired in anger once (2026-06-23, §4 SM) before being
   forgotten. Nearest thing to free on this page, and it addresses the arm's most expensive failure (a
   killed run at ~400k–787k tokens/class). SM 6→7 — 8 would additionally need cross-session durability
   and a lock, which a runbook line does not buy.
2. **Persist the skeptic's evidence into the registry row**, not just through the schema. The row
   already carries citations and line ranges; the verify excerpt belongs beside them. Buys
   **auditability, not verification** — a persisted string is still a model-produced string — but it
   is what lets a later reader judge whether a verdict was earned.
3. **A `selfcheck` analog for the capability contract.** 5 capabilities × 4 adapters = 20 promised
   fills, none checked. This already bit: `mine-verify-flows`' sabotage gate *"had no named executor
   until an eval fixed it — both the method and the Flutter adapter separately named a capability with
   no mechanics — same failure class, twice."* A script catches that at authoring time; a human eval
   caught it late.
4. **Ship the gates.** Highest value, and the only item with real design work — ADR-5 is a *conventions*
   read-index (markdown a project places and agents read); carrying executables is an extension of it,
   not a reuse, and platform constraint #2 (`${CLAUDE_PLUGIN_ROOT}` never expands inside skill
   markdown) blocks the obvious shortcut. Closes §3.2, lifts ET 6→8. Ranked below the
   cheap items because it needs a delivery decision first, not because it matters less.
5. **Disclose the tier in the shipped text.** One sentence in `mine-verify-cover/SKILL.md`. Nearly
   free, and the lowest value of the five: it changes no behavior, it only calibrates how much a reader
   should trust a run. Do it while already in the file.

**VWH ← mine family:**

1. **The three-slot family shape.** VWH's flavors slot into one engine; the mine family recombines one
   invariant into eight machines. The unit/ground-truth/gate decomposition is liftable and would give
   VWH's flavor seam a sharper contract than "implement this Protocol."
2. **Retire or build the substrate island.** It is narrated everywhere and recognized by no code.
   Either give `dag.py` a privileged concept or stop promising one.
3. **Flavor-scope the ML-shaped layer.** The phase/advisory machinery misfiring on non-ML flavors is a
   fit bug the mine family avoids by carrying no machinery it doesn't use.
4. **Self-label the soft tiers.** `mine-family-core.md` marks its advisory items *"wired-but-advisory."*
   VWH's substrate island, memory-read discipline and phase confirmations are all tier (c)/(d) and read
   as load-bearing.

---

## 6. Limitations

- **Scored as-built, at one commit**, from two grounded read passes on this machine's disk. VWH's
  kernel inherits from `solum-code-reader`, not inspected.
- **The 8 categories are a choice, not a standard.** A defensible alternative set (operator ergonomics,
  cost-to-value, failure-mode severity weighting) would move the numbers. Cost-to-value is excluded per
  the recorded 2026-07-10 owner stance ("completeness beats thrift").
- **The two arms are not equally documented.** The prose siblings' machinery was read from SKILL.md
  text; where a sibling's method is executed by a session rather than a script, "the machinery" and
  "the instructions" are the same artifact, and the score reflects that identity rather than a gap
  between them.
- **Deliberately excluded:** efficacy, run counts, breadth, outcome deltas, and any "designed but not
  observed firing" discount. A mechanism here is scored on what it is.
- **One score moved after review** (Cover arm SM 4→6, §4). The correction came from a targeted check,
  not from the census passes — which is itself a limitation signal: a census that reads the *harness*
  will not find an organ supplied by the *tool contract the harness runs on*. Other tool-layer organs
  may be similarly uncounted here. *(Confirmed by the 2026-07-16 re-verification, which found two more
  — the opt-in hard `budget.total` throw and the 1000-agent lifetime cap, now credited in §3.1 — and
  one uncounted usage fact: the 06-23 resume, §7.)*

---

## 7. Correction log

| Date | Change | Cause |
|---|---|---|
| 2026-07-15 | Cover arm **SM 4 → 6**, mean 6.8 → 7.0; §3.1 "crash mid-run" row from *no analog* → tier (b) unused; recommendation #2 rewritten from "build journal/lock" to "invoke the resume you have"; §5 reordered by gap ÷ work | Post-review check found the Workflow tool supplies `journal.jsonl` + `resumeFromRunId`, and the harness is deliberately kept resume-safe. The original recommendation would have rebuilt an existing organ. |
| 2026-07-15 | §3.2 strengthened with the hardcoded `RUNS_DIR` finding and the unexecuted Increment-4 delivery step | Same check: the workflows pin `D:\src\claude-plugins\nexus\harness\.runs`, making them dev-repo drivers rather than portable runners. |
| 2026-07-16 | §3.1 crash row *never invoked* → *unwired*; §4 SM rewritten: `resumeFromRunId` **was invoked once, successfully** — the 2026-06-23 ReviewInvitation run-eval (halt on the budget-gate misfire → fix → resume replayed the cached Mine→Verify, ~193k saved, Cover ran live to all-gates-green); §5.1's target corrected from SM 6→8 to SM 6→7 (the same-session cap and missing lock stand regardless of a runbook line); the SM score itself stays 6 — its stated caps were already the structural ones | Independent fresh-eyes re-verification (model change, 2026-07-16). The 06-23 use lived in no standing artifact, so both census passes and the 07-15 post-review check missed it — exactly the knowledge decay §5.1's runbook line exists to fix. |
| 2026-07-16 | §3.1 runaway-spend row gains the tool-layer organs (opt-in hard `budget.total` throw, 1000-agent lifetime cap); §4 ET schema wording tightened (`required` forces the field to exist — `""` passes); §3.2 RUNS_DIR count 4 → 9-of-10 drivers; `ADR-2 #3` citation corrected to platform constraint #2 | Same re-verification sweep — every §5 / proposal-feeding claim re-grounded against the live repo. |

---

**Provenance.** Two grounded machinery read passes, 2026-07-15: VWH mechanism census (70 tool calls),
mine-family mechanism census (62 tool calls), plus a post-review targeted check on ADR-5, resume usage
and run-dump persistence. Every claim is cited to a file the pass read.
