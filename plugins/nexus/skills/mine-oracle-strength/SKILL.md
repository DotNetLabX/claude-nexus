---
name: mine-oracle-strength
description: Audit how strong a nominally mutation-gated test suite is — a clean-room agent that never reads the suite authors fresh blind mutants against the subject source, a hardened battery scores them under instrument-integrity rules (kills come only from a failing test assertion; crashes/compile-fails/timeouts are adjudication buckets, never auto-kills; exact floor, no rounding), a judge adjudicates every survivor REAL vs UNKILLABLE with mandatory clusters, the REAL gaps are killed by sanity-red-proven test extensions, and an honest suite-strength report is emitted. Optionally scores the suite against a retained reference/candidate pair for buggy-vs-fixed discrimination. Use to audit a gated suite, run a fresh blind battery, produce a suite-strength report, or prove reference-pair discrimination. The twelfth mine, consumed by regenerate-unit's PROVE stage, run standalone between campaigns. Not a rule miner (mine-verify-cover) or debt mine (mine-verify-repo); it never authors mutants from the suite under audit.
user-invocable: true
---

# Mine→Battery→Adjudicate→Report (suite-strength scope)

Point this at ONE **gated suite + its subject**. It answers the question a "mutation-gated" badge
cannot: **how strong is this suite actually?** A suite whose own mutant set was authored against it
tests only what its author already thought to test — per-shape mutant sets age, and a green gate is
not proof. This mine re-audits with **fresh blind mutants** authored by an agent that has never seen
the suite, runs them through a hardened battery, **adjudicates every survivor**, kills the REAL
gaps, and reports honest suite strength — every number carried by re-executable evidence.

Field-validated **5× by hand** (RC / FSD / RG / p0c / p0d — 20 REAL blind spots exposed in suites
that were already "gated"); this skill mechanizes that protocol. Consumed by
`regenerate-unit`'s **PROVE** stage (F28); runs **standalone** between campaigns to audit any gated
suite. Program doctrine motivating it: *per-shape mutant sets age — a "gated" suite still needs a
fresh blind-battery audit* (`docs/programs/br-anchored-regeneration.md` §2).

This is the **twelfth mine** — a **name-and-shape family member**: it follows the shared mining
method (clean-room generation → skeptic-grade adjudication → verified registry annotations), but its
battery runner ships **inline** in this folder's `assets/` with a small **per-stack fill table**
rather than a full per-stack adapter skill (the runner is stack-thin — only the parse-check command,
test command, crash-code set, and timeout mechanism vary). Unit = **one gated suite + its subject**;
ground truth = **the subject source** (never the suite — authoring only-killable mutants inflates
the score); gate = **sanity-red-proven gap-kill + the instrument-integrity honesty proof**; output =
the suite-strength report + registry annotations. Read
`../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 12-row family
table and the shared invariant (bounded unit → clean-room miners → consolidate → skeptic verify →
verified registry) all twelve members follow.

## Assumptions (declared up front)

- **The suite is nominally gated already.** This mine audits an existing suite's *strength*; it does
  not bootstrap a suite from zero (that is `mine-verify-cover`'s Cover arm). A subject with no suite
  is out of scope — refuse with that reason.
- **The subject source is readable and the toolchain is present.** The mutant author reads the
  subject; the battery needs the stack's test command runnable (kickoff Tier-1 tool preflight).
- **One subject + its suite per run.** The unit is a single gated suite and the source it covers,
  not a whole test project.
- **A live battery run is operator-owed at first campaign use.** The skill and its runner are
  shipped and dry-run-provable, but a real audit against a real suite runs the stack toolchain — that
  arm is `Owner: operator` at first campaign use (F28 preflight or a standalone audit).

## The pipeline

```
Stage 1  Blind mutant author   (clean-room generator, model: opus)  — reads the SUBJECT only
Stage 2  Battery run           (mechanical,            model: sonnet) — apply/restore/score runner
Stage 3  Reference-pair        (OPTIONAL,              model: sonnet) — fires only on a declared pair
Stage 4  Survivor adjudication (judge,                 model: fable)  — REAL vs UNKILLABLE, clusters
Stage 5  Gap-kill              (generator,             model: opus)   — sanity-red-proven extensions
Stage 6  Report                (mechanical,            model: sonnet) — the F28-PROVE consumption seam
```

Every stage dispatch carries an **explicit `model:` override** — never session-inherit (D3 pins
below). Stage 1 and Stage 5 (generation) run **opus**; Stage 4 (the judge) runs **fable**; Stages
2/3/6 (mechanical) run **sonnet**. The **asymmetry rule** holds: the judge (fable) is never below
the generator it checks.

### Stage 1 — Blind mutant author (clean-room generator, `model: opus`)

Reads the **subject source ONLY — never the suite**. An author who has seen the suite writes
only-killable mutants and inflates the score; the clean-room framing is half the instrument's
defense. Contract:

- **55–80 semantic mutants**, proportionally distributed across all functions (a function with more
  branches gets more mutants — no function left un-probed).
- **Each `find` string verified unique** on the subject (`count == 1`) — the battery's exact-string
  apply guard depends on it; a non-unique `find` is re-authored, never applied.
- **Parse-safety checked per mutant on a scratch copy** with the stack's parse-check command (fill
  table) — a mutant that does not parse is excluded pre-battery (it would only ever COMPILE_FAIL).
- **Provably-equivalent and null/type-promotion-breaking mutations excluded, exclusions listed** —
  an equivalent mutant can never be killed and would depress the score dishonestly; excluding it
  (with the reason recorded) keeps the denominator honest.
- Emits a mutant manifest: `[{"id","find","replace","line","note"}]` — the runner's input format.

### Stage 2 — Battery run (mechanical, `model: sonnet`)

The **exact-string apply / hash-verified restore / output-scored** runner
(`assets/mutation_battery.py`, promoted and hardened from campaign #2's battery), hardened to the
instrument-integrity rules (D4). Per mutant: apply the unique `find`→`replace`, run the suite,
capture combined stdout+stderr, **classify why the mutant died**, restore the subject byte-exact
(sha-verified in a `finally`), record. A kill counts **only** when classified `BEHAVIORAL` (a
failing test assertion); everything else lands in a named bucket. See §The runner asset.

### Stage 3 — Reference-pair discrimination (OPTIONAL, `model: sonnet`) — D2

Fires **only when the run declares a retained reference pair** (reference = ground-truth variant;
candidate = the unit under test — the regeneration context's legacy-vs-regenerated). The runner
executes the suite against **both variants** — the same apply / hash-verified restore / score
operation as Stage 2, but with a **whole-unit swap** instead of a mutant string (zero new
machinery). Scoring, the three verdict forms:

- **green-on-reference + red-on-divergent-candidate → discrimination proof** — the suite tells the
  variants apart.
- **green-on-reference + green-on-candidate → equivalence attestation *at the suite's measured
  strength*** — never "proven equivalent"; the suite could not distinguish them, which is only as
  strong as the suite is.
- **red-on-reference → HALT** — the suite or the declared pair is wrong; stop and report, never score
  through it.

**No pair declared → stage skipped, stated in the report — never silent.** (The report's `## Pair`
section carries either a verdict or the explicit skip line.)

### Stage 4 — Survivor adjudication (judge, `model: fable`)

Per survivor (any mutant not `BEHAVIORAL`-killed, **including every unadjudicated bucket entry**):

- **REAL** — a constructible fixture can discriminate the mutant; the suite has a genuine blind spot.
- **UNKILLABLE** — equivalent / unreachable-by-construction / unobservable without production
  changes.
- **Every verdict code-cited** — the `file:line` the fixture would target, or the equivalence/
  unreachability argument grounded in the source.
- **Cluster detection is mandatory output** — group REAL survivors by shared fixture theme (9 of
  FSD's 14 shared one theme). Clusters mean a few tests kill many mutants; the report names them so
  gap-kill is minimal, not one-test-per-survivor.

The judge runs **fable** and is never below the opus generator whose mutants it adjudicates
(asymmetry rule).

### Stage 5 — Gap-kill (generator, `model: opus`)

For each **REAL** survivor (clustered where possible), a **minimal suite extension**, each one
**sanity-red-proven** in this exact order:

1. green on the pristine subject (the new test passes as-is),
2. **red under the applied mutant** (the new test actually catches the blind spot),
3. **byte-exact sha-verified restore** of the subject,
4. **full suite green** after restore (no collateral breakage).

A gap-kill that cannot go red under its mutant is not a kill — it is re-authored or the survivor is
re-adjudicated UNKILLABLE.

### Stage 6 — Report (mechanical, `model: sonnet`)

The **suite-strength report** — the F28-PROVE consumption seam. Stable, grep-checkable section
names (see §The report artifact schema). Raw kill %, reachable-kill % after adjudication (**exact
floor comparison, no rounding**), adjudication-bucket counts, gap themes/clusters, tests added,
pair-stage verdict or skip line, plus **registry annotations** where a survivor disproves a suite
note (the BR-119 precedent — a surviving mutant that contradicts a documented "covered" claim
annotates that registry row).

## Stage-model pins (D3)

Owner-ratified 2026-07-22 (program stage-model-plan; backlog F28 row). **Supersedes** the S2/S1
proposal's all-sonnet model-tier line. **Explicit `model:` override on every dispatch — never
session-inherit.**

| Stage | Class | `model:` |
|-------|-------|----------|
| 1 — Blind mutant author | generator | **opus** |
| 2 — Battery run | mechanical | **sonnet** |
| 3 — Reference-pair | mechanical | **sonnet** |
| 4 — Survivor adjudication | judge | **fable** |
| 5 — Gap-kill | generator | **opus** |
| 6 — Report | mechanical | **sonnet** |

The **asymmetry rule (binding):** verification never runs below generation — the judge (fable) ≥ the
generators (opus) it checks. Declared in the kickoff stage-model-plan (declare-and-veto); the
default lands in the kickoff output for the operator to veto, never an interactive prompt.

## The per-stack fill table (D1)

The runner is **stack-thin**: only four things vary per stack. This member ships them **inline** as
a fill table rather than a per-stack adapter skill. **Dart is filled** (proven in campaign #2);
other stacks are **`TBD-at-first-use`** — named and shaped, filled when the first run on that stack
needs them.

| Stack | Parse-check command | Test command | Crash return-code set | Process-tree timeout mechanism |
|-------|--------------------|--------------|-----------------------|-------------------------------|
| **Dart/Flutter** | `dart analyze <scratch-copy>` (0 issues = parse-safe; the lighter `dart format -o none` also rejects unparseable source) | `flutter test <test_path> --reporter compact` | `rc != 0` with **no** behavioral marker and **no** compile marker → `LOAD_CRASH` (marker-disambiguated, never rc-alone) | `taskkill /PID <pid> /T /F` (whole tree) + bounded 30s drain, then `rc = -1` → `TIMEOUT` |
| .NET | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use |
| C/C++ | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use |
| PHP | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use |
| Other | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use | TBD-at-first-use |

**Promotion rule (the family's "abstract only once a second stack is live" seam rule).** Keep the
inline fill table until a **second stack's fill diverges** in shape — not just in literal command,
but in the *contract* (e.g. a stack with no single-file parse-check, or a group-kill signal the
Dart shape cannot express). At that point promote the four columns to a **named capability adapter
contract** (the `mine-verify-cover` §adapter-contract pattern). Do **not** extract the seam from a
single language.

## The runner asset

`assets/mutation_battery.py` — promoted from campaign #2's field-validated battery and hardened to
the **D4 instrument-integrity rules** (below). Its preserved-verbatim mechanics: **exact-string
apply with a `count == 1` guard**, CRLF-normalized find/replace, **hash-verified restore in a
`finally`** (byte-exact or the run aborts), a stdout+stderr scoring loop, the mutant manifest format,
and the bucket/adjudication logic (`excluded_non_viable`, `pending_adjudication`,
denominator-exclusion). The D4 hardening it carries:

- **(a) Kill = failing-test-assertion only.** Every non-pass is classified into
  `COMPILE_FAIL | LOAD_CRASH | TIMEOUT` and emitted per-mutant in the JSON report — **never
  auto-killed**. `status = "KILLED"` only when `audit_class == "BEHAVIORAL"`.
- **(b) Per-pid/GUID scratch paths** — no shared temp state; a shared mutable path under parallel
  workers converts harness collisions into false kills at test-authoring time, where no later audit
  can see them.
- **(c) Exact floor comparison, no rounding** anywhere in score arithmetic — `74.59%` is below a
  `75` floor, full stop.
- **(d) Timeout kill reaches the whole process tree** — grandchildren release the pipe; a bounded
  drain follows so the runner never hangs on cleanup.
- **(e) Per-stack commands** (parse-check, test, crash-rc set) read from a **config block**, not
  hardcoded to one stack — the fill table's four columns are the config surface.

**Denominator honesty (Stryker convention, hardened):** `COMPILE_FAIL` is excluded from **both**
numerator and denominator (a non-viable mutant is evidence of nothing); `LOAD_CRASH` and `TIMEOUT`
sit in **pending buckets** awaiting per-mutant adjudication (Stage 4) — not killed, not survived, not
in the denominator. `kill_pct` is therefore a **FLOOR** whenever any bucket is pending: an
adjudication can only *raise* it. The gate may under-state, never over-state.

**Dry-run provable, live-run operator-owed.** An offline dry-run against a tiny fixture (a 2-file
subject + a 2-mutant manifest, stub test command, no real test run) exits 0 and emits the bucket
fields — that proves the runner's *grammar*. It does **not** prove a live audit; the first real
battery against a campaign suite is the **operator's arm** (`Owner: operator`).

## Instrument integrity (D4 — inherited, binding on the runner)

This runner is a **full consumer of** `mine-verify-cover` §Instrument integrity — the kill-attribution
rule the cross-stack audit (2026-07-21) minted after finding *every* audited mutation instrument
lying in its own way. Read that section; it is binding here unchanged:

- **A kill counts only when attributed to a failing test assertion** — crashes, compile errors, and
  timeouts are never auto-kills; each lands in a named bucket and is adjudicated per-mutant.
  Unadjudicated bucket entries **score as survivors** (under-state, never over-state).
- **No score is reported until the instrument passes its shape's honesty proof.** This runner is an
  **exit-code-shaped harness**, so its proof is **failure-output classification** — capture and read
  the output; `rc != 0` alone proves nothing. The honesty proof runs before any score is reported.
- **Harness state is process-isolated** (per-pid/GUID); **score arithmetic + evidence artifacts are
  committed**, never left in ephemeral paths; **comparative claims require a uniform instrument**
  (classify kills in every arm before comparing).

## The report artifact schema (the F28-PROVE consumption seam)

**Stable, grep-checkable section names** — F28's PROVE stage greps these, so they are fixed at the
skill level, not chosen per run:

```
## Scores          raw kill %, reachable kill % (after adjudication), exact-floor comparison (no rounding)
## Buckets         COMPILE_FAIL / LOAD_CRASH / TIMEOUT counts + each bucket entry's adjudication
## Survivors       REAL vs UNKILLABLE, each code-cited; clusters named (shared-fixture themes)
## Gap-Kill        tests added per REAL survivor, each with its sanity-red evidence (green→red→restore→green)
## Pair            reference-pair verdict (discrimination proof / equivalence attestation / HALT) OR the explicit skip line
## Registry Annotations   survivors that disprove a suite note → the annotated registry row (BR-119 precedent)
```

The `## Pair` section is **never omitted**: with no declared pair it carries the mandatory skip line
("no pair declared → stage skipped, stated in the report — never silent").

## Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents carrying the stage prompts, "launch = orchestrate stages", poll-don't-wait
stage-completion discipline) is defined there. The orchestrator has no filesystem; agents do all I/O,
including running the battery and every evidence command. This skill's own staging: Stage 1
(clean-room author) → Stage 2/3 (battery, foreground-polled) → Stage 4 (judge) → Stage 5 (gap-kill)
→ Stage 6 (report), each dispatched at its D3 model pin.

## Verify / skeptic protocol

Read `../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol. This mine's **gate is
the sanity-red-proven gap-kill + the instrument-integrity honesty proof** — a *runnable* mechanism,
so the survivor adjudications and gap-kills carry re-execution evidence (the mutant applied, the test
run, the byte-exact restore). The **vacuous-evidence check** applies to any zero-hit/absence claim in
the report (an "UNKILLABLE because unreachable" claim whose grep is structurally unable to match is
WRONG, not confirmed). The §Evidence gate on write predicate applies wherever a registry annotation
is written.

## Marginal-budget rail + kickoff checklist

- **Marginal-budget rail** — read `../mine-verify-cover/references/mine-family-core.md` §Marginal-budget
  rail: gate on the **spend delta** (capture start spend), never the shared-pool absolute; **every
  stop writes a report naming the stop reason**, never a silent green exit.
- **Kickoff checklist (NEW target)** — read the core §Kickoff checklist and walk it before launching:
  Tier-1 universal (tool preflight — the stack test command runnable; expected survival rate stated
  up front; stop-budget declared; run-report location named; **stage-model-plan declared** = the D3
  pins above, declare-and-veto). **Tier-2 is skipped by member class:** this member consumes **no
  registry oracle** (unlike `mine-design` / `mine-algorithm`), and it is **not a Cover-arm run** — so
  both Tier-2 checks are reachable-and-skipped, never vacuously absent. A failed Tier-1 precondition
  **REFUSES the run with a named reason** (the HARD-BLOCK pattern).

## Safety rails — the four prohibitions

- **Never author mutants from the suite under audit** — Stage 1 reads the subject source only. Seeing
  the suite is the score-inflation attack this whole method exists to stop. (First and hardest.)
- **Never auto-kill a non-assertion failure** — COMPILE_FAIL / LOAD_CRASH / TIMEOUT are buckets, never
  kills; unadjudicated buckets score as survivors.
- **Never round in score arithmetic** — exact floor comparison; a reported score depends only on
  committed evidence artifacts, never ephemeral paths.
- **Never claim "proven equivalent"** — a green-green pair or an unkillable survivor is equivalence
  **at the suite's measured strength**, not a proof; and a red-on-reference pair HALTs.

## What this skill does NOT do

- **Bootstrap a suite from zero** — that is `mine-verify-cover`'s Cover arm. This mine audits an
  existing gated suite's strength.
- **Run a live battery in this dev repo** — no stack toolchain runs here; the live audit is
  operator-owed at first campaign use (F28 preflight or standalone).
- **Re-implement measurement inside F28** — F28's PROVE stage **invokes** this mine; suite-strength
  measurement lives here, single-homed.
- **Promote the per-stack fill table to a full adapter contract** before a second stack's fill
  diverges (the seam rule).
- **Ship a per-stack adapter skill** — the runner is inline (name-and-shape member); only a divergent
  second stack triggers promotion.

## Relationship to other skills

Read `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 12-row family
table (all twelve members) and how this suite-strength audit differs from its rule/debt/structure
siblings.

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | **Family head.** Ground truth: code; gate: mutants. This mine **inherits its §Instrument integrity** (the kill-attribution rule) unchanged and points to `../mine-verify-cover/references/mine-family-core.md` for the shared method. `mine-verify-cover` *builds* a suite; this mine *audits* an existing one's strength. Not a consumer. |
| `regenerate-unit` (F28) | **Consumer.** Its **PROVE** stage invokes this mine's battery + adjudication + gap-kill and consumes the `## Scores/Buckets/Survivors/Gap-Kill/Pair/Registry Annotations` report seam. F28 invokes, never re-implements. |
| `mine-verify-cover-flutter` / `-dotnet` / `-cpp` / `-php` | Stack adapters for the Cover arm; their apply/restore/score shape is the same family lineage this runner's fill table generalizes. Not adapters *of* this skill (name-and-shape member — the runner is inline). |
| `mine-architecture` / `mine-verify-repo` / `mine-reference-model` | Repo-scoped siblings answering different questions; no seam with a suite-strength audit. |
