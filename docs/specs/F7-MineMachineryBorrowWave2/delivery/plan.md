# F7 — Mine Machinery Borrow Wave 2: ship the enforcement, mechanize the firing, survive the kill

**Feature Spec:** `docs/specs/F7-MineMachineryBorrowWave2/definition/tech-spec.md` (Status: Ready,
critic GO-with-fixes folded 2026-07-17) — technical branch (ADR-27); governing decisions: ADR-62
(delivery mechanism, owner-confirmed 2026-07-18), ADR-60 (adversarial must-fail), ADR-5
(read-index fallback), ADR-25.
**Status:** Plan — architect (Fable 5), 2026-07-18. Stage 0 fully closed (S0a both legs tested,
fixture deleted; S0b = ADR-62) — **S1 has no remaining gates.** Q1 user-confirmed after the
research round: **S6 class = BugRatio** (questions.md Q1).

## Context

Wave 1 (F6) hardened what was cheap; this wave closes the structural gaps: gate code that never
reaches consumers (M1→S1), orchestrator-attention stranding (M2→S2), the same-session resume cap
(M3→S3), the advisory kickoff every incident walked through (M4→S4), the reactive budget rail
(M5→S5), and the unmeasurable recall claim (N1→S6). Targets: `plugins/nexus` (mine-family skills +
core reference) + dev-repo `harness/`. One MINOR release-plugin bump at wave close.

## Scope

**In:** S1–S6 per the tech-spec; shipped executables under
`plugins/nexus/skills/mine-verify-cover/tools/` (ADR-62); core-reference protocol/supersede edits;
BugRatio recall report.
**Out (spec Non-goals, not re-litigated):** VWH loop machinery (DAG, variance acceptance,
firewall); full prose-sibling runtimes beyond the S1.3 registry-write gate; N2/N3/N5 market items.
**DO-NOT-TOUCH (this wave):** `plugins/nexus-analytics/**` (F8's lane — its two family-core
pointer lines at `mine-semantic-model/SKILL.md:284-285,295-296` stay valid because both core
headings are preserved, see Steps 4/6); `plugins/nexus/CHANGELOG.md` historical entries
(:228, :274 contain "Poll, don't wait" as history — never edited by Step 4's sweep); the 9
drivers' inlined verbatim gate-helper copies (kept-in-sync pattern stays; only their SOURCE OF
TRUTH comment lines update, Step 1).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | yes | shipped gate battery, target-agnostic params | gap: harness/Workflow tooling authoring (logged in lessons.md) |
| 2 | (none) | — | no | 18 bare path literals → `_args`-resolved, 9 drivers | — (same gap as step 1) |
| 3 | (none) | — | yes | structural evidence predicate + write-chokepoint wiring | — (same gap) |
| 4 | (none) | — | yes | run journal + idempotent reconcile | — (same gap) |
| 5 | (none) | — | yes | stall watcher (journal-driven; capability-pinned, mechanism free) | — (same gap) |
| 6 | (none) | — | yes | two-tier blocking kickoff preflight | — (same gap) |
| 7 | (none) | — | yes | per-stage token accrual + forecast line | — (same gap) |
| 8 | (none) | — | no | BugRatio golden curation + recall run | — (scoring uses existing tested lib) |
| 9 | evaluate-skill | Follow | no | touched skills: mine-verify-repo, mine-verify-cover (incl. references/mine-family-core.md) | — |
| 10 | release-plugin | Follow | no | single MINOR bump + omni sync — **Owner: team lead** | — |

TDD note: `yes` steps carry testable behavior in `tests/unit/` (node `--test`); the developer
invokes the `tdd` skill on each. Steps 2/8/9/10 are wiring, a scoring run, and process gates.

## Domain Model Changes

None — dev-repo harness tooling + shipped skill artifacts.

## Data Model Changes

New per-run **journal file** under the runs dir (created by Step 4): one file per run carrying
stage, status, runId, timestamps (exact schema = developer's call). Consumers: Step 4's own
reconcile path, Step 5 (the watcher's declared state source), Step 7 (per-stage token accrual).
No other data models.

## Implementation Steps

### Step 1 — S1.1: ship the gate battery (ADR-62 invoke-in-place)
`Satisfies: tech-spec S1.1`

Create **`plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs`** — the named shipped
artifact, generalized from `harness/lib/cover-gates.mjs` (248 lines, zero imports; 7 exported
gates: suiteGreen, noFlaky, mutationFloor, targetMutated, noNewSkips, charPin, mutationRatchet —
these export names are **binding** public surface). Requirements:

- **Target-agnostic:** `EXPECTED_SURVIVOR_LINES = [17, 133, 268]` (pilot data,
  `harness/lib/cover-gates.mjs:243-248`) does **NOT** ship — the expected-survivor exclusion set
  is caller input only (the `opts.expectedSurvivorLines` parameter already exists on
  `mutationFloor`; the shipped file carries no BugRatio default). This is the data-literal gap the
  path grep cannot catch — hence the dedicated grep gate below.
- **Anti-fake-green invariants intact:** agent-total vs tool-summary cross-check; full-path target
  match.
- **`harness/lib/cover-gates.mjs` becomes the dev-repo shim:** re-export from the shipped file +
  keep the dev-repo-only `EXPECTED_SURVIVOR_LINES` constant. Consumers (grep-pinned at plan time):
  `tests/unit/cover-gates.test.mjs:20-21` (imports incl. the constant),
  `tests/unit/workflow-contract.test.mjs:506` — both must stay green unmodified or with
  import-path-only edits.
- **Stale-pointer sweep (hard sub-step):** grep `cover-gates` across `harness/` and update SOURCE
  OF TRUTH comment lines to the shipped path (plan-time hits: `cover.workflow.js:58`,
  `loop.workflow.js:139`, `spec-cover.workflow.js:217`, `spec-cover-calc.workflow.js:210`,
  `harness/README.md:23,26,35`; the inlined helper copies themselves are unchanged).
- **Invocation recipe in exactly ONE shipped locus (ADR-62):** new section in
  `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` (net-new heading —
  verify by grep that no external doc references it before finalizing the heading text).
  Self-contained shipped text: the "Base directory for this skill:" announcement recipe
  (`node <base-dir>/tools/cover-gates.mjs …`), the consumer-CI vendored hash-stamped fallback
  (ADR-5 read-index; documented, never the default), and the disclosed MEDIUM stability of the
  announcement (one-file fix locus).
- **`${CLAUDE_SKILL_DIR}` probe (non-blocking):** one probe, result recorded in implementation.md;
  if unprobeable in-pipeline, mark operator-owed — ADR-62 does not depend on the answer
  (pre-authorized `Deviated (valid reason)`).

**Accept (mechanisms, all recorded in implementation.md):**
1. Consuming-repo simulation: from a temp dir **outside** this repo, a fixture script invokes the
   shipped file by absolute path and the battery runs green against fixture inputs (command +
   output pasted).
2. `grep -rn 'D:[\\/]src[\\/]claude-plugins' plugins/nexus/skills/mine-verify-cover/tools/` → 0
   hits.
3. `grep -n 'BugRatioAnalyzer\|EXPECTED_SURVIVOR\|17, 133, 268'
   plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs` → 0 hits (target-agnostic gate).
4. `node --test tests/unit/` green (shim keeps `cover-gates.test.mjs` + contract tests passing).

### Step 2 — S1.2: parameterize the driver path literals
`Satisfies: tech-spec S1.2`

Convert every **bare** dev-repo path literal to the established `_args.{name} ?? '<same default>'`
form (precedent already in the drivers: `mine-verify.workflow.js:50`,
`cover-cpp.workflow.js:182`). The file list **is** the acceptance grep's plan-time output
(re-executed 2026-07-18 after critic HIGH-1, **whitespace-tolerant** definition-line grep
`^const\s+[A-Z_0-9]+\s+=\s+'D:` over `harness/*.workflow.js` — **20 hits, 9 files**; the earlier
single-space pattern was blind to `loop.workflow.js`'s aligned assignments and missed :92/:100):

`cover-cpp.workflow.js:200` · `cover-flutter.workflow.js:223` · `cover-php.workflow.js:264` ·
`cover.workflow.js:221,263` · `loop-flutter.workflow.js:59,60,66` ·
`loop.workflow.js:69,92,99,100` · `merge.workflow.js:480,481,503` ·
`spec-cover-calc.workflow.js:290,291,318` · `spec-cover.workflow.js:297,329`

Notes: `mine-verify.workflow.js` has **0** bare hits (already arg-resolved) — spec's "9 drivers"
count confirmed. The 10 already-`_args`-resolved `'D:…'` defaults elsewhere are the sanctioned
pattern — leave as-is. Literals derived via `${SR}`/`${NEXUS}` interpolation resolve transitively
once the base const is parameterized. Dev-repo defaults **remain** (drivers are dev-repo
templates, not shipped artifacts — critic HIGH-2 boundary).

**Accept:** the same whitespace-tolerant grep (`^const\s+[A-Z_0-9]+\s+=\s+'D:` over
`harness/*.workflow.js`) → **0 hits** (before: 20/9 files — the enumeration and the gate are the
SAME query, hardened on both per the pattern-hardening rule); `node --check` passes on all 9
edited drivers — **disclosed: syntax only**; no live launches are re-run (defaults preserved,
behavior unchanged by construction).

### Step 3 — S1.3: registry-write evidence gate (all members)
`Satisfies: tech-spec S1.3`

Upgrade the skeptic-evidence check from `minLength: 1` (`mine-verify.workflow.js:132`, post-F6) to
a **structural excerpt predicate rejected in code** at write time: evidence that is empty, a
claim-echo, or carries no re-execution content drops the verdict.

- **Feasibility confirmation FIRST (spec-mandated):** the developer confirms a code-only heuristic
  for the claim-echo case is feasible before committing to it; fallback = the mechanical subset
  only (line-ref presence + quoted re-execution output presence + non-identity with the claim
  string), with the semantic echo check disclosed as prompt-tier. Record the decision in
  implementation.md.
- **Predicate ships** as a sibling tool in `plugins/nexus/skills/mine-verify-cover/tools/`
  (filename = developer's call; the tools/ dir is binding) so prose siblings can invoke it in
  place (ADR-62), and the dev-repo imports it (directly or via a `harness/lib/` shim, same
  pattern as Step 1).
- **Wire at every registry-write chokepoint:** `mine-verify.workflow.js` verdict handling (the
  JSON-schema `minLength` stays; the structural predicate runs post-parse in code — a schema
  cannot express it), `harness/lib/rules-registry.mjs` (the C1 canonical-registry writer),
  `harness/lib/kb-write.mjs` (the Verify→Cover KB serializer).
- **Prose siblings (enforcement pairing):** one instruction line added to
  `references/mine-family-core.md` §Registry invariants + refresh outcome grammar (heading
  preserved) — run the shipped predicate wherever a registry row is written. The prompt-tier
  instruction is PAIRED with the code validator at the harness chokepoints; the residual
  prose-only path (a sibling run with no orchestrating code) is disclosed in the same lines.

**Accept:** adversarial must-fail fixtures (ADR-60) in `tests/unit/` — (a) claim-echo evidence
REJECTED, (b) empty/whitespace REJECTED, (c) a genuine re-execution excerpt PASSES (test names
recorded in implementation.md); `node --test tests/unit/` green.

### Step 4 — S3: run-id journal + cross-session reconcile (hard ordering: before Steps 5 and 7)
`Satisfies: tech-spec S3`

Per-run journal file under the runs dir (stage, status, runId, timestamps) + an idempotent
`reconcile` entry path — resume / complete-tail / none (VWH `recovery.py` **shape only**, no code
imports) — layered over the Workflow tool's same-session cache. The journal is the wave's shared
run-state substrate: Step 5's watcher polls it and Step 7 accrues into it (critic MEDIUM-1
resolution).

Core supersede (never silently rewritten): the sentence ending "…a run killed today cannot be
resumed tomorrow, so resume immediately or write the loss off"
(`references/mine-family-core.md:94-95`, under `## Marginal-budget rail + report-on-halt`) gets a
supersede note; the changelog line rides the wave bump (Step 10). **Binding: the heading
`## Marginal-budget rail + report-on-halt` text is preserved** — 7 external pointer sites depend
on it (mine-design:173, mine-reference-model:164, mine-algorithm:210, mine-verify-repo:229,
mine-verify-cover:246, mine-verify-flows:165, nexus-analytics mine-semantic-model:284-285; the
last is DO-NOT-TOUCH).

**Accept:** unit tests — reconcile over fixture journals: killed-mid-run → resume plan;
completed → no-op; **double-reconcile is a no-op** (idempotency asserted); **the live
kill-run/new-session/reconcile exercise is Owner: operator** (needs Workflow + two sessions; PASS
proves unit-level, stated in implementation.md). Grep: the superseded sentence absent except
inside the supersede note.

### Step 5 — S2: mechanized stage/skeptic firing (depends on Step 4)
`Satisfies: tech-spec S2`

Capability-pinned, mechanism free (developer's call: spawned process, scheduled loop, or
Monitor-based — **Windows-compatible, no cron assumption**): a watcher advances a stalled stage or
fires the cadence skeptic within a bounded interval and **logs each firing**. Lives in the
dev-repo harness (drivers don't ship). **State source (binding, critic MEDIUM-1): the Step-4
journal** — the watcher polls journal stage/status/timestamps to detect stalls; Workflow
in-session state is not reachable by an external watcher process, so the journal is the only
viable substrate.

Docs (grounding correction: the spec's "two mine-verify-cover poll mentions" is stale — plan-time
grep found exactly **one**, `mine-verify-cover/SKILL.md:107-108`):
- New protocol section in `references/mine-family-core.md` (net-new heading; grep-verify no prior
  external consumers of the chosen heading). Shipped text stays self-contained: capability +
  disclosure that the watcher implementation is dev-repo machinery.
- Replace the canonical statement `mine-verify-repo/SKILL.md:115-122` with a pointer to the new
  section + **one disclosure line**.
- Same pointer treatment for the single mirror at `mine-verify-cover/SKILL.md:107-108`.

**Accept:** simulated missed-completion advances without operator input — sim-level node test over
**fixture Step-4 journal state** (the declared state source, so the sim exercises what the live
watcher reads); **the live Workflow missed-completion exercise is Owner: operator** (a developer
subagent has no Workflow tool — PASS proves sim-level only, stated in implementation.md). Grep
gates: the old canonical paragraph text absent from `mine-verify-repo/SKILL.md` (pointer +
disclosure present); pointer present in `mine-verify-cover/SKILL.md`; CHANGELOG historical
mentions untouched.

### Step 6 — S4: blocking kickoff preflight (two-tier)
`Satisfies: tech-spec S4`

The core kickoff checklist (`references/mine-family-core.md:159-174`) becomes an
orchestrator-verified preflight with the reconciled two-tier set:
- **Universal (blocking, all members):** tool preflight · expected survival rate · stop-budget
  declared · run-report location.
- **Member-conditional:** registry existence/freshness — oracle-consuming members ONLY
  (mine-design, mine-algorithm); mined-test-root disclosure — Cover-arm runs only.

A failed precondition **refuses the run with a named reason**. Pattern precedent:
mine-algorithm/SKILL.md:90 Stage-0 HARD BLOCK. Mechanism: a preflight checker in the shipped
tools/ dir (code enforcement for workflow-run members) + the rewritten core section; the
skill-text obligation is thereby PAIRED with an enforcement; the prose-run residue is disclosed in
the section. **Binding: the heading `## Kickoff checklist (new-target runs, B4)` text is
preserved** — 7 external pointer sites (mine-design:71, mine-reference-model:63,
mine-algorithm:70, mine-verify-repo:112, mine-verify-cover:112, mine-verify-flows:155,
nexus-analytics mine-semantic-model:295-296; the last is DO-NOT-TOUCH). The
`**Wired-but-advisory:**` label (`mine-family-core.md:173`) is superseded (same note discipline as
Step 5).

**Accept:** unit fixtures — (a) missing universal precondition → refusal with the named reason;
(b) oracle-consuming fixture missing registry freshness → refusal; (c) **non-oracle member fixture
→ no registry check** — the test must show the registry-check path is reachable and skipped by
member class, not merely absent (vacuous-negative trap); grep: "Wired-but-advisory" absent except
in the supersede note.

### Step 7 — S5: runway forecast (depends on Step 4)
`Satisfies: tech-spec S5`

Accrue realized tokens per completed stage into the Step-4 journal (the drivers already carry the
rail — `budget.spent()` appears 49× across all 10 drivers; keep the capture-the-start delta rule).
The marginal-budget rail gains a forward projection (spent + projected-remaining vs budget) and
emits **`forecast: over-budget at stage N`** (line shape binding) **before** the overrun instead
of halting at it. Report-on-halt semantics unchanged.

**Accept:** fixture run with a low budget emits the forecast line before the rail trips (sim-level
node test); existing rail tests stay green (halt behavior unchanged).

### Step 8 — S6: BugRatio recall golden set (rider; user-confirmed Q1)
`Satisfies: tech-spec S6`

- **Curate the golden known-rules list from the INDEPENDENT legs only** — (leg 1) the frozen
  sequestered set `D:\src\sprint-rituals\docs\audit\golden-set.md` (BugRatio ids GOLD-16/17/18;
  frozen, user-confirmed 2026-06-11); (leg 2) the 2026-06-14 manual-pilot-confirmed rules
  (bug-ratio.md §Source); (leg 3) the original Fokus product spec —
  **`D:\src\sprint-rituals\docs\product\fokus\v1.md` §5.5 "Bug Ratio Per Developer"
  (v1.md:239)**. Evidence for the leg-3 pin (critic MEDIUM-2): the legacy citation name
  `fokus-spec.md` (bug-ratio.md:74) resolves here — v1.md (May 4, 2026) is the only product file
  carrying a Bug Ratio section; v2.md (May 14, "Extends: v1.md", QA analytics) defines no Bug
  Ratio content of its own (it references v1's feature at :291/:295) — no version fork; v1
  predates both the golden-set freeze (2026-06-11) and the miner, so it is a genuinely
  independent oracle. Curate **NOT from the harness-mined registry** (circular-oracle trap; see
  questions.md Q1 research). **CLEAN-ROOM BINDING RULE:** golden rule TEXT is never quoted
  into this plan, implementation.md, the run report, or any miner-visible artifact — reference by
  path + GOLD ids only (the file's own two-layer enforcement header governs).
- **Score mined-vs-golden RECALL** with the existing `harness/lib/recall-score.mjs`
  (parseGoldenSubset → buildPairingPacket → orchestrator-side LLM judge verdict map →
  computeRecall). Mined side = the current 37-rule confirmed BugRatio registry state
  (`D:\src\sprint-rituals\docs\kb\bug-ratio.md`) — no fresh mine run. **No precision, no F1**
  (spec/critic HIGH-1 boundary — binding).
- The judge call is a scoped orchestrator-side judgment on the pairing packet: the developer may
  perform it (attributed + disclosed in the report) or mark it operator-owed — both
  pre-authorized.
- **Run report** committed in the dev repo under the harness runs area (exact path = developer's
  call, recorded in implementation.md): recall as matched/total + unmatched list (**by GOLD id
  only**), the disclosure line "recall measured on the development class (method tuned on
  BugRatio)", and judge attribution. **Explicitly evidence, not a gate: no floor, no halt.**

**Accept:** the report file exists with recall (matched/total + unmatched-ids list) + both
disclosure lines; grep over the committed diff: no golden rule text outside the sequestered file.

### Step 9 — Docs integrity sweep + evaluate-skill gate

1. **Pointer sweep (hard sub-step):** grep every changed/superseded heading, label, and sentence
   from Steps 1, 3, 4, 5, 6 across `plugins/**` and `docs/**`; expected consumer sets are the
   plan-time lists pinned in Steps 5/6; fix stale pointers in touched nexus files only; zero stale
   pointers required. DO-NOT-TOUCH set per Scope.
2. **Follow evaluate-skill** on the touched skills — `mine-verify-repo`, `mine-verify-cover`
   (incl. `references/mine-family-core.md`). **ACCEPT verdict required** (spec acceptance
   "Judgment" row); findings doc path recorded in implementation.md.

**Accept:** evaluate-skill ACCEPT recorded; pointer greps return only the expected sets.

### Step 10 — Close-out (Owner: team lead — N/A for the developer at done-check)

**Follow release-plugin**: single **MINOR** bump riding the ship commit (spec + launch
instruction — new capability: shipped enforcement runtime). Before `gen-omni`: **confirm the omni
twin's back-port state** (auto-memory: an ahead twin can be clobbered by a naive regen; likely
omni-flutter-only — verify anyway); then gen-omni + mirror-message commit per CLAUDE.md + push
both (pre-authorized at launch, communication-log row 1).

## Migration Notes

None — no persistence, no migrations.

## Testing Strategy

- `tests/unit/` (node `--test`): battery generalization (Step 1), evidence predicate must-fail
  fixtures (Step 3, ADR-60), reconcile idempotency (Step 4), watcher sim over fixture journals
  (Step 5), preflight refusal + no-false-block (Step 6), forecast emission (Step 7).
- **Operator-owed live arms (pre-authorized `Deviated (valid reason)`):** S2 live
  missed-completion under Workflow; S3 live cross-session kill/resume; the `${CLAUDE_SKILL_DIR}`
  probe if unprobeable in-pipeline. A developer PASS proves sim/unit level — each step's
  implementation.md entry states what the PASS does not yet prove.
- Negative-assertion gates (Step 6c, Step 1 greps) are traced, not assumed: the no-false-block
  test must demonstrate reachability of the skipped path.

## KB Impact

None — dev-repo tooling + shipped plugin artifacts; no consuming-project `docs/kb/` entries.
(`harness/README.md` pointer updates are covered by Step 1's sweep.)

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Shipped executables live in `plugins/nexus/skills/mine-verify-cover/tools/` | family-core (the ADR-62 single recipe locus) already lives in this skill; consistent with F8's *planned* `mine-semantic-model/tools/` shape (F8-W1, gated — not yet on disk; corrected at done-check, was miscited as an existing precedent) | a new standalone skill dir (no consumer would invoke it directly) | decided |
| Canonical battery = the shipped file; `harness/lib/cover-gates.mjs` becomes a re-export shim keeping the dev-only `EXPECTED_SURVIVOR_LINES` | ADR-62 names the plugin file as the hash-drift anchor; one canonical copy, zero test churn | two independent copies (drift) or bump-time generation (machinery not owed this wave) | decided |
| S2 watcher protocol + battery recipe + preflight text all land in `mine-family-core.md` | the shared-mechanism home; single shipped locus per ADR-62; sibling pointers already converge there | per-sibling duplication (N-file fix on platform change) | decided |
| S2 watcher mechanism left to the developer | spec pins capability + acceptance only (Windows/no-cron reality) | pinning a daemon shape (substrate mismatch — spec Decisions) | deferred |
| Evidence predicate ships as a tools/ sibling, not harness-only | prose siblings must invoke it in consuming repos (S1.3 "wherever a row is written") | harness-only lib (unreachable outside the dev repo) | decided |
| S6 mined side = the existing 37-rule confirmed registry state; no fresh mine run | S6 is scoped "small" — wiring + curation; a fresh run is a full pipeline pass | fresh Mine-only run (cost without evidentiary gain) | decided |
| S6 golden curation from the independent legs only (frozen GOLD ids + manual pilot + fokus-spec), never the harness-mined registry | avoids the circular oracle; grounded in the Q1 research round, user-confirmed | registry-derived golden (recall ≈ trivially high) | decided |
| Step 5 targets ONE mine-verify-cover poll mention, superseding the spec's "two" | plan-time grep found exactly one (`SKILL.md:107-108`); grounding correction, not scope change | editing to the spec's stale count (would invent a second edit site) | decided |
| S2 watcher's state source = the S3 journal (Steps 4/5 ordered accordingly) | Workflow in-session state is unreachable by an external watcher; one shared substrate for S2/S3/S5 beats two state models | watcher reading ad-hoc Workflow state (unimplementable externally) | decided |

## Open Questions

None — Q1 answered (BugRatio, user-confirmed 2026-07-18); all other calls are Decisions rows or
explicitly the developer's.

## Plan Review

Critic (Mode 2, code-grounded, 2026-07-18): **REVISE** — 1 HIGH, 2 MEDIUM; findings persisted by
the team lead at `delivery/review-critic.md` (the critic writes no file). All folded 2026-07-18;
plan approved (review mode: critic). The critic independently verified all 14 heading-pointer
sites, every ADR citation, and the one-poll-mention correction.

| Finding | Fold |
|---|---|
| HIGH-1 — Step-2 grep whitespace-blind; `loop.workflow.js:92,100` unlisted; acceptance false-greens | Fixed — pattern hardened to `^const\s+[A-Z_0-9]+\s+=\s+'D:` on BOTH the enumeration and the acceptance gate (same query); list re-derived from the re-executed grep: **20 hits / 9 files** (`loop.workflow.js` now 69, 92, 99, 100) |
| MEDIUM-1 — watcher state source ambiguous; contradicted Data Model; implicit ordering | Fixed — Steps 4/5 swapped (journal is now Step 4, watcher Step 5 depends on it); the journal is DECLARED the watcher's binding state source (Workflow in-session state is unreachable externally); Data Model, Skill Mapping, Step-7 dependency, Scope pointer, and Testing Strategy re-pointed; new Decisions row |
| MEDIUM-2 — leg-3 citation `fokus-spec.md` unresolvable | Fixed (user direction: keep leg 3) — pinned to `D:\src\sprint-rituals\docs\product\fokus\v1.md` §5.5 "Bug Ratio Per Developer" (v1.md:239) with the evidence trail in Step 8: legacy name resolves there (bug-ratio.md:74); v2.md carries no Bug Ratio section (references v1's feature only, :291/:295) — no version fork; v1 (2026-05-04) predates the golden-set freeze and the miner |
