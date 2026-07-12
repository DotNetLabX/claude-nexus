# Per-member evaluation: nexus mine family vs virtual-worker-harness — job lens, blind-scored

**Date:** 2026-07-12 (Architect) · **Status:** Assessment — feeds owner triage; no changes applied.
**Subjects (scored separately):** `mine-family-core` (shared reference), `mine-verify-cover`,
`mine-design`, `mine-algorithm`. **Comparator:** `virtual-worker-harness` (VWH,
`D:\omnishelf\virtual-worker-harness`), scored on the same categories.
**Criterion (owner):** quality and "gets the job done well" — outcomes delivered and defect
containment *in practice*, not machinery count.

**Method — blind-first.** Four sonnet read passes grounded everything live: (1) the four skill/reference
texts + both ratified proposals; (2) the VWH repo (kernel, coverage flavor, memory files, the Fokus
campaign artifacts); (3) the SDK pilot artifacts (`omnivision-ai-sdk/docs/specs/adhoc-Mine{Algorithm,Design}Pilot`);
(4) nexus-side delivery evidence (`adhoc-MineSkillAuthoring`, CHANGELOG, plugin-feedback). Scores were
locked to a scratchpad file **before** the prior assessment
(`2026-07-10-mine-suite-vs-vwh.md`, read from git history — it is deleted-uncommitted in the working
tree) was opened. §4 reconciles every delta against it. `docs/research/` was not read pre-lock.

**Status note on the subjects:** mine-design and mine-algorithm were ratified-proposal + pilot at the
time this evaluation was commissioned; during the concurrent `adhoc-MineSkillAuthoring` closure they
graduated to shipped skills (nexus 1.31.0, ADR-55, 2026-07-12). Evidence base per the commission =
the ratified proposals + the SDK pilot artifacts; the shipped skill texts were read as the current
statement of the method.

---

## 1. Verdict (read this first)

| Subject | OD | DC | GR | CV† | RP | EM | Mean |
|---|---|---|---|---|---|---|---|
| **mine-verify-cover** | 8 | 7 | 7 | 6 | 8 | 8 | **7.3** |
| **mine-family-core** | 7 | 6 | 6 | 8 | 7 | 6 | **6.7** |
| **VWH** (comparator) | 7 | 7 | 8 | 6 | 4 | 6 | **6.3** |
| **mine-algorithm** | 7 | 7 | 7 | 5 | 5 | 5 | **6.0** |
| **mine-design** | 7 | 7 | 7 | 4 | 5 | 5 | **5.8** |

OD = outcome delivery · DC = defect containment in practice · GR = grounding of claims ·
CV = cost-to-value · RP = robustness/portability · EM = evidence maturity. Scale 1–10; anchors are
deliberately conservative (5 = adequate-with-real-gaps, 7 = good with demonstrated results, 9 = would
bet the estate on it). †CV is **owner-de-weighted** per the recorded 2026-07-10 stance ("completeness
beats thrift; budget rails are runaway-stops, not optimization pressure") — it is reported but should
not move triage decisions.

**Headline.** For the one job both systems share — trustworthy, mutation-gated verification of real
code — **mine-verify-cover gets the job done better than VWH today** (breadth: 4 stacks, 7+ repos,
production-embedded registries), while **VWH remains the stronger grounding machine by construction**
(its measurement path is pure code outside any LLM; its firewall and blocking gates have no mine
equivalent). The two new siblings are a different maturity class: **their demonstrated containment
quality is unusually high for day-one methods** — the design judge killed a fabricated-authority
plant 100% at tier 1 and caught fabricated census rows by range-check; the algorithm gate caught all
three matchers under-reading the build — **but every hour of their evidence comes from one repo, one
language, one day.** Their scores are capped by evidence volume, not by observed defects.

---

## 2. Per-subject rationale (blind scores, unchanged by reconciliation)

### mine-verify-cover — 7.3 (the family's proven core)
- **OD 8.** Delivers both halves of its promise on real code: verified BR registries + mutation-gated
  suites across .NET, Flutter (2 Dart classes live-proven), C++ (SDK campaign; the clusterize
  Mine→Verify pull: 79 rows, 100% skeptic survival), PHP adapter registered. Minimize stage grounded
  in a 3-suite production-app pilot; SDD Merge/Generate shipped with pilot numbers (F12: 78 rules;
  F13: 4-of-24 spec-only rules on target).
- **DC 7.** The 6-row gate battery is orchestrator-computed from raw tool output; Minimize's
  fail-closed full re-gate is real enforcement. Two real escapes on record: the 2026-06 fake-green
  (runner-fabricated per-file entry — hardened with `target_mutated` + real-report reads) and the
  2026-07-02 C++ runner deadlock (hand-run non-terminating mutant hung the whole workflow — fixed by
  *policy*, "never execute mutants outside mull", not by a mechanical timeout).
- **GR 7.** Skeptic excerpt-or-drop is enforced and demonstrated (1 IMPRECISE corrected, vacuous-
  evidence positive controls actually run in the clusterize pilot). Openly advisory: the Cover
  generation guard ("a request, not a guarantee" — SKILL.md:238) and survivor classification. Recall
  is honestly disclaimed (no golden set).
- **CV 6.** No token/wall-clock accounting recorded for its own runs; one class per run.
- **RP 8.** Four stack adapters proven live; Claude-Code-native (no Python env, Windows-clean).
  cpp/php fact-tagging deferred.
- **EM 8.** Longest history in the family; ~13 runs across 4 stacks (90–100% reachable kill per the
  prior assessment's corrected count); ADRs extracted from real pilots; a live plugin-feedback loop.

### mine-family-core — 6.7 (cheap, high-leverage, one proven tooth)
- **OD 7.** Its protocol demonstrably carried three pilots (marginal-budget rail, report-on-halt,
  skeptic grammar, refresh grammar all used in anger). But it shipped a dead pointer — the
  chunked-writes discipline was *claimed* by a sibling before it existed in the core (caught at
  review, authored as FD1) — the core lagged its consumers once already.
- **DC 6.** Its one enforced mechanism (verdict-without-excerpt is dropped) worked in practice. Its
  kickoff checklist is self-labeled "wired-but-advisory" and **was violated in practice** — the
  pilot-2 "truth fork" (self-mined oracle) — and the resulting hardening landed in mine-algorithm's
  Stage-0, not in the core itself.
- **GR 6 / CV 8 / RP 7 / EM 6.** Fact/judgment doctrine and the vacuous-evidence rule are both
  post-incident patches (good learning, but reactive). As a reference file it costs nothing and
  leverages across 7 members — the best cost profile in the estate. Recent additions (routing
  boundary, chunked-writes) have zero post-change run evidence.

### mine-design — 5.8 (excellent gate design, one day of evidence)
- **OD 7.** All three pilot gates PASS: calibration (synthesis reproduced the manual expert brief and
  corrected it twice), contrast (`fromJson` correctly routed to DTO+mapper — the pattern-cosplay
  failure mode did not fire), held-out (discriminated genuine designs, C>B>A, a real pairwise flip
  resolved by evidence). Censuses surfaced 9 real pre-existing bugs in `fromJson` alone (dead-write
  `price_kpis`, the `"sf_anchor_id "` trailing-space round-trip reset, two unguarded-access crash
  paths). Outputs are briefs — no landed code change yet.
- **DC 7.** The planted fabricated-authority design was killed entirely at tier 1; its 3 fabricated
  census citations (C-95/101/108 vs a real census ending at C-92) were caught by range-check. On the
  held-out unit the judge caught a genuine designer inflating its paths-eliminated claim and an
  incomplete safety net. Bug-preservation discipline held (5 live bugs preserved, BR-95 routed to its
  own sign-off). Caveat: the plant is calibration-only — production runs carry no standing canary.
- **GR 7.** Citations and house precedents re-executed at file:line; the decision-table's
  `-fno-exceptions` hedge was actually tested against the repo's CMakeLists and found false. No
  independent oracle for "best design" beyond the census the same method produced.
- **CV 4.** ~2.0M marginal tokens against a declared ~800k budget (2.5× — disclosed, not silent) for
  three briefs. Under the owner's cost stance this doesn't dent the verdict; it is still the family's
  least-calibrated budget estimate.
- **RP 5 / EM 5.** One repo, one language, one day; a Glob search-root hazard hit mid-run (fix now a
  skill instruction); hard dependency on an existing BR registry. Experimental design (calibration +
  contrast + held-out) is genuinely strong — n is the cap, not quality.

### mine-algorithm — 6.0 (real adjudicated wins, catalog is the soft spot)
- **OD 7.** Adjudicated, quantified outcomes: ≈263 NLOC grep-proven dead code APPROVED for deletion;
  `cv::partition` swap CONDITIONAL GO with an honest "modest" win (−16 NLOC, −6 CCN, Θ(N³)-flavor →
  Θ(N²)+union-find bound); discovery core correctly named "sequential RANSAC, restructure-toward-
  canonical, 0 new deps"; 3–4 new latent hazards surfaced (uninitialized `actionType` enum, NaN-sort
  UB, unpopulated sibling set). Owner decisions resolved same-day. Still recommendations — the
  mandatory back-to-back net is not yet built.
- **DC 7.** The opus gate caught **all three** sonnet matchers under-reading the build (calib3d not
  linked — it read `CMakeLists.txt` directly); it *refuted* a REAL-bug adjudication by re-grounding
  (BR-46 provably unreachable today); the pilot-2 truth-fork breach was contained same-day and
  hardened into the Stage-0 HARD BLOCK — the only advisory family rule pressure-tested into a
  mechanical gate so far. The "bugs fall out as deviations" claim under-delivered (1 strong of 5).
- **GR 7.** Excerpt-or-drop enforced; availability is now a build-verified precondition (learned, not
  designed). Quantified-win numbers are agent-asserted with no independent recomputation.
- **CV 5.** 593k (pilot 1) + ~1.2M (pilot 2, incl. one killed Fable stage) marginal tokens; budget
  raised mid-run, disclosed.
- **RP 5 / EM 5.** The catalog is the soft spot: availability values explicitly non-portable ("the
  worked CV/C++ example, not a universal truth"), its bounding discipline self-labeled "directional —
  single-source, verification cut short", and matching leans on problem-signature reasoning because
  code-only recognition is weak (F1≈0.56). Two pilots, one repo, one day.

### VWH — 6.3 (best grounding machine, narrowest proven footprint)
- **OD 7.** The Fokus .NET campaign delivered a real gated suite: 0.798 branch / 0.701 kill,
  refusing SOTA for 7 consecutive experiments until the 0.70 floor was honestly cleared. Retail
  flavor serves nightly (conformance 24/24). But `campaign_002` on disk carries no DAG/PLAN/
  LEADERBOARD artifacts — it was a manually-driven engine validation, so **the full autonomous
  research loop is live-proven only on example tasks**, and the run stopped at 0.798 against a 0.90
  goal (charter bar was "viable SOTA").
- **DC 7.** Gates are computed from real subprocess output, double-run flake check, mutation parsed
  from actual tool output failing loud. But the repo's own history shows three silent-inertness
  incidents: a dead invalidate guard (no CLI path ever passed the flag), a mutation fallback dead via
  an `int("exp_0002")` bug swallowed by a bare except, and the `_rekey` bug making the mutation gate
  silently vacuous on any multi-project layout — all caught by dogfooding/operator report, not by the
  harness's own tests.
- **GR 8.** The measurement path is pure code outside any LLM — the strongest grounding-by-
  construction in this comparison. Conclusion gate blocks confounded causal verdicts; firewall
  canonicalizes paths. Residual: the firewall is a self-labeled stub (subprocess reads pass); skeptic
  override quality is unchecked.
- **CV 6.** Measure step 75–205s/exp mechanical; **no token/$ accounting at all** for the agent side.
- **RP 4.** Windows is explicitly not a target platform (the `fcntl` crash was fixed by hand on this
  box; CI is ubuntu-only); the single-directory workspace model breaks in ~5 places on a real
  multi-project solution (deferred to an architect, unresolved); PHP/Flutter/C++ toolchains are
  declared configs, never validated live.
- **EM 6.** One real external repo + own-repo dogfooding + Python e2e smoke + 150+ test files + a 90%
  coverage CI floor on itself. Continuous self-validation is a real strength; external-target
  diversity is the weakness.

---

## 3. Job-lens synthesis per member

- **mine-verify-cover** is the only subject that has *repeatedly* completed the full job on foreign
  code across stacks. Its containment record (two escapes, both hardened) is comparable to VWH's
  (three silent-inertness incidents, all hardened) — neither system's gates survived contact with
  reality unmodified, and both fixed what broke. Where it trails VWH is enforcement depth: its
  clean-room and generation guards remain requests backstopped downstream, where VWH refuses at the
  process level.
- **mine-family-core** does a different, smaller job — keeping seven siblings consistent — and does
  it cheaply. Its honest weakness: the parts that are advisory stayed advisory until an incident
  forced hardening, and the hardening accrued to a sibling, not the core.
- **mine-design** and **mine-algorithm** delivered outcomes on day one that older methods took weeks
  to reach (real bugs surfaced, quantified adjudicated wins, an expert brief reproduced-and-
  corrected). Treat their High confidence as **High-for-this-estate**: the catalog's availability
  facts, the decision table's row set, and the judge's calibration all have exactly one repo behind
  them.
- **VWH** is the reference standard for *how to make a gate impossible to sweet-talk* — and the
  cautionary record for *gates rotting silently* even so. For the org's daily job (delivering
  verified artifacts into working repos, on Windows, across stacks), it is currently the narrower
  tool.

---

## 4. Reconciliation vs `2026-07-10-mine-suite-vs-vwh.md` (read post-lock, from git history)

**Scope differences first** (these explain most apparent deltas):
1. The prior doc scored **one aggregate** ("mine suite" = mvc + mine-verify-repo + mine-reference-
   model + dev-repo substrate) vs **whole-harness VWH** (all three flavors). This pass scores four
   members separately and reads VWH primarily against the shared job. Aggregate-vs-member is not a
   like-for-like row.
2. **Three of my four subjects postdate it.** mine-design and mine-algorithm graduated 2026-07-12;
   the family-core reference is the prior doc's own P1 proposal, since delivered. No prior scores
   exist for them — nothing to reconcile beyond noting P1 is now real and already pressure-tested.
3. **Scale anchors differ.** The prior doc's job-lens table clusters at 7–9; mine anchors 5 =
   adequate. Absolute numbers are not comparable; orderings and gaps are.

**Delta table** (prior job-lens §8 scores vs this pass, nearest-category mapping):

| Prior row (mine-suite / VWH) | This pass (mvc / VWH) | Delta and justification |
|---|---|---|
| Job outcomes delivered **9 / 8** | OD **8 / 7** | Same direction (mine ahead by 1), one anchor-notch lower each. My mvc excludes verify-repo/reference-model registries (scored per-member); my VWH deducts for the new finding that `campaign_002` lacks the autonomous-loop artifacts — the prior doc did not surface that the real-repo run was manually driven. |
| Defect containment **8 / 9** | DC **7 / 7** | Two changes, both evidence-based. (a) The prior doc's mine row counted only the 2026-06 fake-green; it never weighed the 2026-07-02 C++ mutant deadlock — a production-impacting containment failure fixed by policy, not mechanism. (b) The prior doc credited VWH 9 "for tuition already paid"; I weight the tuition itself — three separate silently-inert-gate incidents caught only by dogfooding — as evidence the *in-practice* record is at parity with mine's, not above it. VWH's genuine construction edge I book under GR (8 vs 7), not DC. |
| Empirical validation **8 / 8** (tie) | EM **8 / 6** | The tie treated continuous CI self-validation as equal-kind to external-target evidence. Under the job lens external diversity dominates: the job is delivering on foreign repos, where VWH has n=1 (Fokus, and that run needed two engine fixes to start) vs mine's 7+ repos / 5 languages. Also new since 2026-07-10: two more mine pilots ran (design/algorithm, SDK). |
| Cost governance **8 / 8** | CV **6 / 6** | Same tie, lower anchors. The owner weight note is honored: CV is reported, de-weighted, and moved no verdict here. New data the prior doc lacked: the design pilot's 2.5× disclosed overrun (booked against mine-design, not mvc). |
| Documentation & operability **8 / 9** | (folded into RP/CV) | Not a standalone category this pass. VWH's onboarding lead (HANDS-ON, companion, doctor) is real and re-affirmed — it partially offsets its RP 4, which is why RP isn't lower. |
| Statistical honesty **8 / 9** | (folded into GR/DC) | No delta of substance: VWH's noise machinery still exceeds mine's ×2/ratchet/cross-check trio, and mine's domain still doesn't demand more. Reflected inside GR 8 vs 7. |
| Methodology rigor **9 / 9** | (not re-scored) | Agreed and unchanged; rigor-of-text is not a job-lens category, which is exactly why it was left out here. |
| **Average 8.2 / 8.3 — "effectively tied"** | **7.3 / 6.3 — mvc ahead** | The headline flip is the sum of the three justified deltas above: per-member scoping, the campaign_002 finding, the deadlock weighing, and job-lens external-diversity weighting. Note the prior doc itself flagged its own trajectory: its §8 re-weighting had already moved the gap from VWH+0.8 to VWH+0.1. This pass continues that direction with new evidence rather than contradicting it. |

**What this pass confirms from the prior doc, independently:** the shared-DNA lineage (gate battery
name-for-name); the substrate verdict (plugin-native markdown over Python-kernel hosting — VWH's RP 4
on Windows/multi-project is fresh confirmation); the "borrow lessons, not machinery" rule; and its
most candid lesson — *confident closure ahead of evidence* — which this pass dodged by reading the
target repos directly (all pilot claims verified against SDK artifacts, not nexus summaries).

**What this pass corrects:** treat the prior doc's B4 (charter-gate kickoff) as **half-delivered and
already half-refuted** — the kickoff checklist now exists in family-core but is self-labeled
advisory, and the truth-fork incident proved advisory isn't enough for oracle-integrity rules;
mine-algorithm's Stage-0 HARD BLOCK is the shape B4 should take family-wide (see follow-ups).

---

## 5. Risks and follow-ups

1. **Portability debt on the new siblings (highest-value next evidence).** One second-stack pilot
   each for mine-design and mine-algorithm (a .NET or Dart unit with an existing registry —
   dotnet-microservices is the natural target) would either lift RP/EM from 5 toward 7 or expose the
   catalog/decision-table estate-coupling cheaply. Until then, High confidence is estate-local.
2. **Promote the Stage-0 pattern to the family core.** The one advisory→mechanical hardening that
   exists (registry freshness HARD BLOCK) lives only in mine-algorithm. mine-design's HALT-and-route
   is prose; the core's kickoff checklist is openly unenforced. One core-level rule — "oracle-
   integrity preconditions are orchestrator-verified, never prompt-trusted" — closes the class.
3. **The deadlock fix is policy, not mechanism.** "Never run mutants outside mull" is a prompt rule
   guarding against a proven hang. A timeout wrapper at the adapter layer would be the mechanical
   version — exactly the convention→code ratchet VWH's history recommends.
4. **VWH borrowables ledger unchanged.** A2 declutter / B1 conclusion-verdict semantics remain the
   live items; nothing found here reopens the non-adoption table.
5. **Working-tree anomaly, again.** Both prior research docs are deleted-uncommitted in the working
   tree, unexplained (flagged in adhoc-MineSkillAuthoring's summary, never root-caused). This doc is
   written as a new untracked file; the deletions were left untouched. Owner should decide restore
   vs. confirm-intent before the next commit sweeps `docs/research/`.
6. **Registry refresh cadence still unowned** (carried forward from 2026-07-10 unresolved): the SDK
   pilots deferred registry corrections (BR-39/BR-46/BR-53 flags, 6 fixing_tools rows) to follow-up
   lanes that no trigger owns.

---

## 6. Similarity map — VWH vs the whole mine family (owner follow-up, same day)

Convergence scored 1–10 per category (10 = same DNA, 1 = disjoint). Headline: **one epistemics
school, two different machines** — the doctrine is nearly identical (documented lineage, not
coincidence); loop shape, substrate, and artifact model are where they split.

| Category | Similarity | The shared core | Where they diverge |
|---|---|---|---|
| Epistemics / anti-fabrication doctrine | **9** | "Never trust the agent's claim; verify fresh-context; a prompt is a request, not an enforcement; degrade loudly." The gate battery is name-for-name (`suite_green · no_flaky · mutation_floor · no_new_skips · char_pin`) — flowed VWH → mine 2026-06 via the sprint-rituals evaluation | Emphasis only: VWH aims it at metric gaming, mine at fabricated findings |
| Actor architecture | **8** | Deterministic trusted orchestrator; untrusted agents do all I/O; gates computed from raw tool output; golden/held-out material sequestered from every reasoning agent | VWH's orchestrator is a kernel that *refuses* (audit hook raises, gates block); mine's is a Workflow script that *checks* (drop-rules, pure-fn gates) |
| Fresh-context verification | **7** | Both carry an adversarial second pass (VWH close-skeptic ≈ mine skeptic/judge), and both learned the same lesson — a verification you must remember to trigger doesn't fire (VWH: 0/7 → daemon; mine: protocol-mandated stage) | VWH daemon-fires it and blocks campaign finalize; mine enforces via excerpt-or-drop but the trigger is protocol, not mechanism |
| Self-improvement culture | **7** | Both harden convention→code only after real incidents (VWH: dead guard / vacuous fallback → conclusion gate + auto-fire; mine: truth fork → Stage-0 HARD BLOCK, vacuous-CONFIRMED → positive-control rule) | VWH also runs the **prune** direction (declutter cadence held its kernel ~5.4k LOC through a month of growth); mine only promotes upward — A2 declutter remains the ratified-unbuilt gap |
| Cost governance | **6** | Budget rails as runaway-stops in both; overruns disclosed, never silently absorbed | VWH: EV ranking, stopping triggers, field-kill — but zero token/$ accounting for the agent side. Mine: marginal-token rail + model-tier economics (sonnet lanes / opus gates, pilot-validated) |
| Statistical honesty | **6** | ×2 flake run and the anti-fake-green total cross-check exist in both | VWH adds variance-aware acceptance (CI bounds, certify repeats) — its noisy optimization domain demands it; mine's mostly deterministic domain hasn't needed it (P2 spike stands) |
| Loop shape / job model | **3** | Both bound work to a declared unit with a charter/kickoff and a stop condition | Open-ended *optimization* loop toward a maximand (hypothesis DAG, islands, SOTA ratchet) vs single-pass *extraction* pipelines that establish durable facts once and refresh them |
| Substrate & enforcement ceiling | **4** | Same philosophy — push invariants into mechanism where incidents prove prose insufficient | Python kernel (33 modules, process-level refusal, 150+ test files, CI on itself) vs Workflow JS + prose method re-instantiated by each consuming session; mine's ceiling is what an orchestrator script can check |
| Artifact model | **4** | Append-only, provenance-carrying records in both | Campaign-scoped ledger/DAG/`workspace.patch` vs cross-project registries (never-delete, `last_verified`, disposition flips, refresh grammar) — the mine side's strongest card, and deliberately not campaign-scoped |

**VWH has, mine doesn't:** the mechanical firewall + held-out data tiers; variance-aware acceptance;
hypothesis DAG / islands / EV ranking / derived-SOTA ratchet; the blocking conclusion gate (confound
naming, no-kill-on-a-rising-curve); the charter gate (baseline arithmetic before optimizing);
commit-per-experiment with crash recovery and a single-writer lock; continuous CI self-validation
(≥90% coverage floor on its own code + selfcheck + dry-runs per push); the onboarding layer
(HANDS-ON walkthrough, read-only companion, doctor, dagboard); the declutter/prune lane; a headless
Mode-B driver.

**Mine has, VWH doesn't:** the durable BR-registry artifact species consumed across repos; a
stack-adapter contract live-proven on four stacks; N-miner clean-room consensus + the
CONFIRMED/WRONG/IMPRECISE skeptic grammar with excerpt-or-drop; the blind provenance-stripped design
judge with a calibration plant and both-orderings pairwise; the canonical-algorithm catalog +
equivalence net (executable back-to-back doctrine); the family routing boundary + shared core
reference; model-tier economics as method (sonnet lanes / opus gates, validated in both SDK pilots);
plugin-native distribution — nothing to host, Windows-clean, runs wherever Claude Code runs; the
Minimize stage with its fail-closed full re-gate; spec-side integration (mine-from-spec, SDD
Merge/Generate).

**Standing consequence (re-affirmed, not new):** the 2026-06-23 substrate verdict and the
"borrow lessons, never machinery for machinery's sake" rule both survive this map — every VWH-only
row above is either already in the reconciled borrowables ledger (A2, B1–B4) or in the upheld
non-adoption table (DAG/variance/firewall/commit-per-experiment).

### 6a. Lineage split — how much of the mine method is borrowed vs native (owner follow-up)

Judgment estimate by method substance (not line count); the direction of each flow is documented,
the percentages are the architect's decomposition:

| Origin | Share of mine-verify-cover | Share family-wide | What it is |
|---|---|---|---|
| **Native nexus doctrine** | **≈ 90%** | **≈ 95%+** | The family-defining mechanisms all grew from nexus's own ADRs (deterministic gates ADR-7/23, skills-as-lore ADR-4, artifact-first ADR-17, fresh-context critic) and from the family's own pilot incidents: clean-room N-miner consensus, the CONFIRMED/WRONG/IMPRECISE skeptic grammar with excerpt-or-drop, the registry artifact species + refresh grammar, the blind provenance-stripped judge, the canonical catalog + equivalence net, the routing boundary |
| **VWH-borrowed** | **≈ 10%** | **< 5%** | Two items, both documented: the 5-name gate battery (`suite_green · no_flaky · mutation_floor · no_new_skips · char_pin`, name-for-name from VWH's coverage-flavor PRD 2026-06-12 → mine-verify-cover 2026-06-23, transfer channel = the sprint-rituals BR-coverage evaluation) and the kickoff-checklist framing (B4, from VWH's charter gate) |

**Impact is the inverse of volume.** The borrowed ~10% is the highest impact-per-line in the family:
the gate battery sits at the single most fake-green-prone point (does the generated suite actually
kill mutants?), and both fake-green incidents in mine's history were caught at exactly that layer —
without it the Cover half would be self-reported quality. But its impact is localized: Mine→Verify,
mine-design, and mine-algorithm would work identically without it. The native ~90% is foundational —
it is the epistemics every member runs on. In short: **VWH supplied one critical joint; nexus built
the skeleton.** No flow in the reverse direction was found (nothing in VWH credits or resembles
mine-specific machinery).

### 6b. Job-surface size — what each system covers, does, and has proven (owner follow-up)

**Overlap is exactly one tile:** VWH's test-coverage flavor ≈ mine-verify-cover's Cover→Gate half.
Every other job on either side has no counterpart on the other.

| | VWH | Mine family |
|---|---|---|
| **Shape of the surface** | One deep, generic loop — a task-agnostic kernel where any job expressible as "optimize a scalar honestly" can become a flavor. Breadth is *potential*, added one flavor at a time | Seven bounded pipelines — breadth is *by subject type*: verified facts about classes, repos, specs, data sources, designs, algorithms. Breadth is *instantiated*, one member at a time |
| **Jobs instantiated** | 3 flavors: ML/pytorch (founding), test-coverage (v1 shipped), retail/analytics-intelligence (v1+v2) | 7 members: verify-cover (+ mine-from-spec + SDD Merge/Generate), verify-repo, reference-model, semantic-model (ships in nexus-analytics), design, algorithm, + the family core |
| **Jobs live-proven on real targets** | ~1.5 of 3: coverage on one external .NET repo + Python e2e; retail serving nightly (24/24 conformance). ML flavor = examples only; the full autonomous DAG loop = examples only | 6 of 6 runnable members have real-target runs: cover across 4 stacks/~13 runs, from-spec piloted (5 red drifts, 0 false alarms), debt mine + reference model in production repos, design + algorithm piloted on the SDK (3 + 2 gates/pilots) |
| **Estate reach** | 2 external target repos touched (Fokus, own examples aside); 1 language live (C# via coverage; Python on itself) | 7+ repos, 5 languages; registries and gated suites are load-bearing artifacts in daily development |
| **What it proves** | **Process honesty under optimization**: an agent loop can pursue a metric without gaming it (firewall, noise-band acceptance, refuse-to-promote demonstrated 7× consecutively) | **Fact honesty at extraction**: an agent can mine knowledge from code/specs and the output can be trusted (skeptic re-execution, 100% survival demonstrated, plant killed at tier 1, fabricated citations caught) |
| **Self-proof infrastructure** | Continuous: 150+ test files, ≥90% coverage CI floor on itself, selfcheck per push | Per-run only: each target run re-proves the method; no standing self-test of the skill texts beyond skill-lint + evaluate-skill at authoring time |

**Reading.** VWH is the *wider possible* machine and the *narrower proven* one; the mine family is
the reverse — no single member matches the kernel's generality, but the family's proven footprint
(jobs × repos × languages) is several times VWH's today. The asymmetry mirrors their consumers: VWH
optimizes toward goals inside campaigns; mine manufactures durable artifacts the estate consumes
daily. The one shared tile (coverage/Cover) is also exactly where the documented lineage borrow
happened (§6a) — the overlap and the influence channel are the same place.

### 6c. Results head-to-head — whose proofs delivered better numbers (owner follow-up)

**On the one directly comparable job (mutation-gated coverage), mine's delivered results are
better.** Caveats stated where they matter:

| Result dimension | VWH | Mine family | Better |
|---|---|---|---|
| Kill rate delivered on real code | 0.701 vs a 0.70 floor, one external .NET repo (Fokus, 8 experiments; charter bar was "viable SOTA", not max — it stopped the moment the floor cleared) | 90–100% *reachable* kill across proven targets, ~13 runs, .NET + Flutter (75% default floor treated as a floor, not a target) | **Mine** — even granting VWH's lower bar, the delivered ceilings differ by ~30 points |
| Breadth of the result base | 1 external repo, 1 language live (plus Python e2e on examples) | 4 stacks, 7+ repos | **Mine** |
| False-positive / honesty record | No known false promotion; 7 consecutive refusals until the floor honestly cleared — the strongest *discipline* result in either system | mine-from-spec pilot: 5 red drifts confirmed, **zero false alarms**; skeptic survival 100% with the 1 IMPRECISE corrected, vacuous-evidence positive controls run; design plant killed 100% at tier 1 | **Tie** — both clean post-hardening; different kinds of proof |
| Defects found in real targets | Not its job (it builds suites; it doesn't hunt bugs) | 84 adjudicated real bugs (SDK campaign), 9 pre-existing bugs surfaced in one census (`fromJson`), 3–4 new latent hazards (pilot 1), ≈263 NLOC grep-proven dead | **Mine** — uncontested, VWH doesn't compete here |
| Results consumed downstream | `workspace.patch` + campaign ledger (campaign-scoped); retail flavor serving nightly, 24/24 conformance | Registries + gated suites are daily load-bearing inputs to the pipeline (done-checks, design/algorithm oracles, KB) | **Mine** for the code-quality estate; retail nightly is VWH's one standing production consumer |
| Self-proof results | CI green at ≥90% coverage on its own kernel, every push — continuous | Per-run only; skill texts re-proven at authoring gates | **VWH** |

**Verdict.** Mine's results are better where the two overlap and richer where they don't — its
proofs *deliver artifacts* (bugs found, rules verified, suites gated to 90–100% kill). VWH's best
results *prove restraint* (refuse-to-promote 7×, continuous self-validation) — genuinely valuable,
but restraint is a property mine has also demonstrated at its own gates. The honest asymmetry to
keep: VWH's numbers come from a system that measures itself continuously; mine's come from more
targets but are only re-proven when someone runs a mine. Neither record contains a known
false-green that survived to a consumer.

**VWH's results on its own terms (owner follow-up — the complete proven ledger, not the
mine-relative view):**

1. **Coverage flavor — the flagship proof.** One real .NET campaign (Fokus `campaign_002`):
   branch coverage 0 → 0.798 and kill rate 0 → 0.701 across 8 experiments, the mutation gate
   refusing SOTA for experiments 2–7 and promoting only when the 0.70 floor honestly cleared;
   measure step 75–205s/exp. Plus a Python end-to-end smoke: coverage 0 → 0.088, live mutmut gate
   (kill 30/45 = 0.667 vs 0.6 floor, ~70s), SOTA advance, `workspace.patch` exported.
2. **Retail/analytics-intelligence flavor.** *(Corrected after the §7 deep-dive:)* the loop itself
   is demo-grade — conformance 24/24 and dry-run 16/16 are the kernel's generic adapter gates on
   synthetic data, plus a smoke (fitness 0.045→0.4716) and a 2-night carry-forward demo. The real
   production evidence is stronger but different in kind: one-off analyst engagements against the
   live fmcg_platform Postgres produced measured, confound-controlled findings (see §7) — analyst
   work products, not autonomous-loop runs.
3. **Honesty machinery proven in anger.** After the fake-green fix, the gate refused SOTA to a
   +0.074-branch-coverage experiment carrying a 0.333 kill rate — the exact failure class the fix
   targeted, demonstrated live. Continuous self-proof: 150+ test files, ≥90% coverage CI floor on
   its own kernel, selfcheck + dry-runs on every push.
4. **Not yet proven — and it is the headline promise.** The full autonomous research loop (DAG
   planning, islands, EV ranking, literature, auto-skeptic cadence) has never run end-to-end on
   real code — `campaign_002` was manually driven engine validation; the loop's only complete runs
   are the example tasks. The ML/pytorch founding flavor has no live result. Windows and
   multi-project layouts remain open architecture questions.

Net: one strong coverage campaign, one modest smoke, one nightly production pipeline, and
first-rate proof of its own restraint — while the system's defining capability (autonomous
research) remains example-grade. VWH has proven its *gates* beyond doubt; its *loop* is still
awaiting a real-world run.

---

## 7. VWH retail/analytics flavor — deep-dive + borrow-vs-build for nexus-analytics (owner ask, same day)

### 7.1 What it is

Two campaign modes on one adapter (`flavors/retail_intelligence/adapter.py:35`): v1 `served_value`
(maximize coverage × real logged question-usage + displacement savings − forecast penalty) and v2
`measured_value` (grounded coverage of demanded KPIs × cited coefficient strength − feedback
miscalibration + savings; `EVOLVE_DESIGN.md:39-54`). Design keystone: **there is no impact ground
truth** — so every scoring input is something the agent cannot fabricate: real logged usage,
evidence rows that must exist at the cited indices, literature-cited coefficients (uncited = zero),
and deferred human ratings with a miscalibration penalty. The semantic layer (`kpi_registry.yaml` +
`schema_map.yaml`, KPI-as-JOIN with present/imported/absent feed states) is a first-class editable
product as of v2.

### 7.2 What it has actually proven

- **Loop, synthetic (demo-grade):** conformance 24/24, dry-run 16/16 (generic kernel gates incl.
  firewall-denial probes), smoke fitness 0.045→0.4716, one inconclusive correctly
  recorded-not-reverted, a 2-night carry-forward. Numbers live in a memory file; run dirs are
  gitignored — not independently re-derivable.
- **Real production analyses (the strong evidence):** pointed at the live fmcg_platform Postgres
  (chains 22/41/43/86), the value ledger carries measured findings: **VL-005** phantom inventory —
  67.4% of ~33k out-of-shelf observations had system-stock > 0 (confound-controlled 67.0%);
  **VL-011** bad-report classifier — within-chain ROC-AUC 0.997 collapsing to 0.85 cross-chain,
  recovered to ~0.94 AUC / 66% catch via per-chain domain adaptation, plus an honestly-reported
  null on image fusion; **VL-014/017** — measured net ΔOSA ≈ 0, Mann-Kendall no significant trend,
  scan-timing exactly backwards. Uncomfortable client-facing findings, reported anyway.
- **Gaming vector caught live:** a summed forecast term let a 0.95-vs-honest-0.55 forecast raise
  fitness — restructured to penalty-only (`memory/retail_intelligence/forecast-not-summed.md`).

### 7.3 Our side — nexus-analytics 0.1.0 (shipped 2026-07-10/11)

Five surfaces: the `data-analyst` agent (batched interview), `mine-semantic-model` (family member 5;
Mine→Probe→Ground→Interview→Emit, 7 SQL probes), `semantic-model-query` (resolution ladder + 3
mandatory pre-query checks), `data-investigation`, `answer-qa` (answer contract gate). Architecturally
sound, reviewed, and **zero real-world validation runs** — the first consumer's `profile.md` is still
operator-owed. The governing boundary is already settled and re-affirmed here: **method → plugin,
data → project, autonomous loop → VWH**, with the semantic model as the shared artifact
(`vwh-adoptions-2026-06.md:242-244`, P5, tech-spec).

### 7.4 Borrow-vs-build verdicts (per mechanism)

| # | VWH mechanism | Verdict | Home in our estate | Effort | Confidence |
|---|---|---|---|---|---|
| 1 | **Value ledger** — 1-line index + frontmatter detail docs, lifecycle proposed→validating→validated\|invalidated, `whatif()` | **BORROW — highest value.** It *is* a registry, mine-family-shaped; and it's the ESTIMATED→MEASURED lifecycle our own proposal already flagged "worth carrying in." Zero kernel coupling (markdown + one small deterministic script) | `docs/value-ledger/` in the consuming project (data→project); authoring/refresh method as a nexus-analytics skill | Small-medium | **High** |
| 2 | **Grounding gate** — evidence rows must exist at cited indices; uncited coefficient scores zero | **BORROW** as answer-qa hardening: a deterministic existence-check before an insight ships, same shape as the mine skeptic's excerpt-or-drop | `answer-qa` + a probe script | Small | **High** |
| 3 | **Penalty-only rule** — an agent-set estimate feeding any score may only subtract, never add | **BORROW** as a one-line doctrine; it's a paid-tuition gaming lesson (caught live) | analyst persona + answer-qa | Trivial | **High** |
| 4 | **§CRAFT analyst-discipline moves** (attribution isolation, effort≠outcome, distribution-over-mean, dynamic baselines, cohort≠population…) | **BORROW near-verbatim** — zero coupling, distilled from real engagements, domain-generic | a `references/analyst-craft.md` under the data-analyst agent | Small | **High** |
| 5 | **Boot briefing** — session-start state deterministically rendered from the ledger, jargon-translated, never free-handed numbers | **BORROW** once #1 exists (it renders *from* the ledger) | data-analyst persona | Small | Medium-high |
| 6 | **Reporting discipline** — CSV-first, provenance panel, every number linkable to source | **BORROW** as answer-qa/report convention | answer-qa + a reporting reference | Small | Medium-high |
| 7 | **KPI feed-state coverage** — per-claim required inputs, blocked-vs-covered computation, demand-weighted "leaked value" expansion report | **ADAPT pattern, not content** — extend mine-semantic-model's output contract with feed states + a "what can't be answered and why" section; registry content stays project-side | mine-semantic-model output-contract | Medium | Medium |
| 8 | **Deferred-feedback calibration** (miscalibration penalty vs specialist ratings) | **DEFER** — our proposal's recorded trigger stands: adopt when analyst claims ship to stakeholders | future answer-qa extension | — | High (in deferring) |
| 9 | Engine-computed scoring loop, firewall/held-out subprocess re-scoring, SOTA/certify | **DON'T BORROW** — this is the autonomous campaign engine; the settled boundary keeps it in VWH. Re-implementing it in a plugin is the machinery-for-machinery's-sake failure the 2026-06 verdict warned against | stays in VWH | — | High |
| 10 | Persona role-play grammar ("If [X data], we could [Y outcome]") + roast interview | **PARTIAL** — the interview instinct already lives in mine-semantic-model's Interview phase and the batched-intake persona; graft the per-persona expansion grammar only | mine-semantic-model interview-protocol | Small | Medium |

### 7.5 Recommended sequencing

1. **Run the 0.1.0 pilot first** (profile.md + one live query lane on the analytics workspace or
   fmcg_platform). Borrowing into an unvalidated plugin inverts the evidence order — and every
   borrow above is cheaper to place correctly after one real run. *(Confidence: high.)*
2. **Borrow wave → 0.2.0** after the pilot: #2/#3/#4 (cheap prose + one probe script) plus #1 (the
   value ledger) as the wave's centerpiece; #5/#6 ride along if the pilot shows session-continuity
   or reporting pain. One slug, one bump.
3. **#7 (feed states) only if the pilot surfaces "why can't this be answered" friction** — it's the
   one adaptation with real design work in it.

The strategic read: VWH's retail flavor validated the *discipline* of honest analytics (grounding,
penalty-only, ledgered value claims) on real production data — that tuition is exactly what the
boundary rule says we should import as method. Its *loop* stays where it is.

---
*Assessment only — no plugin files changed, no bump owed (docs/ only). Blind-score lock:
session scratchpad `blind-scores-locked.md`, written before the prior doc was opened.*
