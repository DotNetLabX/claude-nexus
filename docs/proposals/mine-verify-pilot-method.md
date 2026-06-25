# Mine→Verify — the method (BR-coverage harness, Pass-2 pilot record)

**Status:** Ratified — method record.
**Delivered:** MineVerify Inc 1 (adhoc-MineVerifyCoverHarness) — productionized in `harness/mine-verify.workflow.js`; the 2 failure modes are design invariants there. Bookkept Ratified 2026-06-22.

**What this is:** the reusable *method* behind step 2b of the BR-coverage loop — clean-room rule
extraction (Mine) followed by independent adversarial refutation (Verify). Captured here in the
**nexus** repo because the method is the plugin's concern; the rules it emits and the tests it
drives are the consuming project's (they live in sprint-rituals' `docs/kb/` and test project).
This is the seed for an eventual generic harness skill (Pass 4); for the pilot it is run **manually**.

First exercised 2026-06-13 on `Fokus.Domain/Analytics/HealthScoreCalculator.cs`.

## The method

1. **Mine (clean room).** A subagent extracts business rules from ONE production source file.
   - Input boundary is absolute: the source file only. The miner must NOT read `docs/audit/`
     (the sequestered golden set), `docs/kb/` (prior output), or any test project. Reading the
     answer key turns "independent rediscovery" into pattern-matching and voids the recall metric.
   - Quote-first, evidence-or-reject: every rule cites a verbatim code quote + line numbers; no
     quote → the rule is dropped. No inferring behavior absent from the code.
   - Exhaustive across branches: main bands, every degenerate/guard branch, clamps, and the exact
     boundary inclusivity at each threshold (incl. discontinuities where two branches meet).

2. **Verify (independent model).** Hand the source + the mined rules to a *different* model
   (Codex/GPT) with a refutation brief: for each rule return CONFIRMED / WRONG / IMPRECISE with a
   correction, default-skeptical, and list any rule the code encodes that is MISSING. The verifier
   also stays clean of the golden set. The transcribed band formulas barely need it — refutation
   earns its keep on the *interpretive* claims (guard reachability, discontinuities, "never reaches
   100 within the band").

3. **Score (orchestrator only).** The orchestrator — which MAY see the golden set — compares the
   verified rules to the golden subset for recall/precision. Miner and verifier never do this.

## Two failure modes hit during the pilot (and the fixes)

- **Subagents won't reliably return text.** `general-purpose` (and `Explore`) agents repeatedly
  returned bare "Done." / "(Stale hook…)" with the actual output discarded. Fix: make the
  deliverable an **action that can't be skipped** — instruct the agent to `Write` the result to a
  named file (or `cat`-heredoc it via Bash for Bash-only agents like the Codex bridge), then read
  that file. Do not rely on the final message carrying data.
- **Reading the golden set contaminates the miner.** Glancing at `docs/audit/golden-set.md` "to
  check format" burns the current context as a miner. Fix: orchestrator/miner separation — the
  orchestrator dispatches a fresh clean-room subagent (source-only) and scores afterward. The
  miner's output format is its own; it must never be aligned to the answer key.

## Pilot result (HealthScoreCalculator)

- Recall **3/3** on the golden subset (GOLD-01/02/03), precision **3/3** — all rediscovered from
  source alone, correctly.
- Verify hardened 13 mined candidates → confirmed 7, corrected 6, found 3 missing. Material catches:
  a real **negative-`amber` pathology** (below-amber branch exceeds the 0–49 range), two
  **`value==amber` discontinuities** (one of which the miner missed and Verify recovered), and two
  `range==0` **guards proven to be dead code** — which a careful *hand-authored* KB draft had
  wrongly described as functional clamps. That delta (verified vs hand-authored) is the case for the
  method: independent extraction + refutation beats one careful pass.

## Calibration log (Pass 2 — running)

| Class | Difficulty | Golden | Recall | Precision | Confidence (consistency) | Escalation | Cost |
|-------|-----------|--------|--------|-----------|--------------------------|-----------|------|
| HealthScoreCalculator | easy (pure math) | GOLD-01/02/03 | 3/3 | 3/3 | not measured (single miner) | 1 candidate bug | ~60k tok, ~13 min Codex |
| BugRatioCalculator | hard (multi-sprint, streak) | GOLD-16/17/18 | 3/3 | 3/3 | high — 3 miners, ~22 behaviors in all 3, 0 contradictions | ~4 / ~28 ≈ 14% | ~267k tok, ~48 min Codex |

Reading so far:
- **Recall holds at 3/3 easy→hard**, and the hard class carried the two traps that matter (ratio-of-totals vs average-of-ratios; zero-SP-breaks-streak) — both independently rediscovered. Stronger evidence than the easy class alone.
- **Escalation 14%** sits just under the plan's 16–25% production norm.
- **Cost is the automation risk, not accuracy.** Codex wall-time went 13 min → 48 min as rule count grew (3-sample Mine + 28-rule refutation). Pass 4 needs a cheaper/scoped verifier or this won't run interactively across ~10 classes.
- **3-sample consistency is worth it on hard classes** (it gave a real confidence number and surfaced the rounding-compounding smell), skippable on trivial ones.

## Open for the Pass-4 skill

- Encode the clean-room boundary as `disallowedTools` / input-surface restrictions rather than a
  prompt instruction (prompts are advisory on background subagents — see nexus ADR-13).
- Automate the file-write return contract and the orchestrator-scores-only split.
- The Roslyn evidence index (currently the miner reading source by hand) is the language-adapter
  slot; the method above is language-neutral.
