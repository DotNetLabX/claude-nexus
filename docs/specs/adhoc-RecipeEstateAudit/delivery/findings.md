# Audit Findings — adhoc-RecipeEstateAudit

**Phase 1 (read-only audit) · 2026-06-17 · architect-owned · Explore-assisted (3 parallel sweeps)**
Proposal: `docs/proposals/recipe-estate-audit.md` (Ratified). Companion: `selection-index.md`.

## Read this first — verification status

The three sweeps (drift, inventory, gate-coherence) produced **candidates, not verified defects.** I
spot-checked one representative claim per sweep against source. Calibration result:

| Spot-check | Sweep claim | Verified outcome |
|---|---|---|
| ADR-13 critic citation | "miscite, should be ADR-22" | **False positive** — ADR-13 body (README:484-485) covers the critic's `disallowedTools`; citation is correct. Proposed fix (ADR-22 = read discipline) was a hallucination. |
| ADR-4 `lessons-format` scope | "table says architect-only, frontmatter says more" | **Confirmed** — `developer.md:6` + `reviewer.md:6` carry it; ADR-4 table (README:192) lists architect only. |
| `isCodeFile()` divergence | ".sh/.ps1 only in boundary-detector" | **Partial** — triplication confirmed (3 defs); the specific extension divergence unconfirmed. |

So: **1 confirmed, 1 false, 1 partial.** Every finding below is tagged **[Confirmed]** (I verified it
against source this pass) or **[Candidate]** (surfaced by a sweep, **must be grounded before any fix** —
per the "re-verify every aged finding against current source before planning its fix" rule). Only
Confirmed items become actionable backlog rows now. This labelling discipline *is* the point of the
audit — the estate's recurring failure is exactly surfacing unverified claims as fact.

## A. Drift & contradiction

- **[Confirmed · Low]** ADR-4 preload table (README:192) is stale: `lessons-format` is preloaded onto
  **architect + developer + reviewer** (frontmatter), but the table lists architect only. The
  frontmatter is what executes; the ADR under-documents. Fix: update the table.
- **[Rejected — false positive]** "architect.md:187 miscites ADR-13 for the critic's no-write." The
  citation is correct (ADR-13 body covers the critic `disallowedTools`). Recorded here so it is not
  re-raised by a future sweep.
- **[Candidate · Low]** `improve-flow` frontmatter says "Do not invoke directly," yet it appears in the
  skill catalog and `improve-skills` routes shipped-skill fixes to its mechanism. Ground: is it
  `user-invocable` in frontmatter, and is "do not invoke directly" the intended contract?
- **[Candidate · Low]** architect.md Coordination-Protocol pipeline diagram shows "architect spawns
  critic" without the standalone-vs-subagent distinction the body (architect.md:188) draws four lines
  earlier. Likely an acceptable diagram simplification, not a defect — confirm before touching.
- **[Candidate · Med]** Drifted duplicate blocks across the 9 agent files (the 06-10 eval's open
  "duplicated blocks, no lint" thread): the confidence-label hard rule appears in solo/developer/
  architect/po never-do sections but reportedly **not** in reviewer/critic; `.pipeline-state` read-only
  marking is inconsistent across agents. Needs per-file grounding before any fix — this is the highest
  re-verification burden in the set.

## B. Gate coherence

Full 15-gate map is in the sweep record; the structural picture and the actionable specifics:

- **[Confirmed · structural, known]** The synchronous deny layer — `guard.js`, `pipeline-gate.js`
  (analyze-collapse + verdict-integrity) — is **inert on background subagents** (3/3 blocking gates).
  Grounded in ADR-13 and the 06-10 eval (pipeline-enforcement scored 5). This is the standing platform
  cap, not a new defect; it's the backdrop every other finding sits against. Detection (boundary-detector,
  PostToolUse) is the sanctioned compensation.
- **[Confirmed · Med]** `isCodeFile()` is defined **three times** (`guard.js:91`, `pipeline-gate.js:111`,
  `boundary-detector.js:55`). Duplicated predicate → drift risk (a code-type list can diverge silently).
  Fix candidate: extract one shared predicate. **Resolved (code-grounded review, 2026-06-17):** the
  earlier ".sh/.ps1 only in boundary-detector" Candidate was **inverted** — `.sh`/`.ps1` are in
  `guard.js:94` AND `boundary-detector.js:58`; the outlier missing them is `pipeline-gate.js:114`. A
  second drift axis: `guard.js:92` normalizes backslashes, the other two don't (Windows-path behavior
  differs). Both axes are handled in `plan.md` Step 4.
- **[Candidate · Med]** `pipeline-gate.js` verdict-integrity reportedly inspects only Edit `new_string`,
  so an Edit that flips only the verdict line while leaving findings intact evades it. Ground against
  the gate source before treating as real.
- **[Candidate · by-design mostly]** 7 prose-only gates with no deterministic backstop (PO spec-review,
  architect done-check, reviewer Step-2, ADR-25 master gate, cite-check/confidence, critic-invocation,
  unattended queue). ADR-13 already concedes prevention is impossible for background agents, so most are
  by-design. The *actionable* sub-question per gate: does it warrant a **detector** (the
  boundary-detector pattern — observe + log to violations.log) or is prose acceptable? A design call, not
  a defect list.
- **[Candidate · design]** Pipeline transitions with no gate at all: IDEA→RESEARCH, RESEARCH→PROPOSAL,
  PO-`Ready`→architect-start, plan-approval→developer-start. Whether any deserves a gate is a deliberate
  design decision for triage, not an auto-fix.

## C. Selection index

The single genuinely-*missing* abstraction (not a drift). Drafted separately in `selection-index.md`:
the inventory (21 skills / 11 rules / 7 named gates), 6 trigger-ambiguity clusters, and a draft
"situation → recipe + gate" index. Cluster A (research routing: `search-researches` vs `deep-research`
vs a bare generic helper) is **confirmed by this session's own incident** — it's the highest-value entry.

## Triage → backlog (Phase 2)

Ranked impact ÷ effort. **Confirmed items are actionable now; Candidates get a grounding sub-pass
first.**

| # | Item | Status | Size | Lane |
|---|---|---|---|---|
| 1 | Build the selection index (resolve cluster A first) | Confirmed gap | small | architect-defined → developer build |
| 2 | Research-capture trio (framing + workflow step + fallback capture) — from this session | Confirmed | small | folds into #1's `search-researches` edit |
| 3 | Extract one shared `isCodeFile()` across the 3 hooks | Confirmed | small | solo |
| 4 | Update ADR-4 table (`lessons-format` scope) | Confirmed | trivial | solo |
| 5 | Grounding sub-pass for the Candidate drift items (duplicate-block drift, verdict-integrity Edit gap, improve-flow framing) | Candidate | med | architect + Explore, then route confirmed ones |
| 6 | Gate-detector design call (which prose gates get a detector; which ungated transitions need a gate) | Candidate | med-design | architect proposal |

Items 2 and 1 converge: the research-capture framing fix *is* part of authoring the selection index's
research-routing entry — do them together so `search-researches` is touched once.
