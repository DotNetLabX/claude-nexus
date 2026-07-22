# Program — BR-Anchored Regeneration

**What this document is:** the single reference for the whole program — a **stack-independent
capability to rewrite any legacy project from its mined, verified behavior** into a
human-designed better architecture, gated so nothing is lost. Projects run it as **campaigns**;
the omnivision-ai-sdk is campaign #1, not the program. This repo (nexus) is the program's home:
it builds and ships the capability. Written 2026-07-20; update at program milestones.
**Owner / decision-maker:** Maria.

---

## 1. The program in one paragraph

Take any sufficiently legacy project. Mine every unit's business rules out of the code and kill
every unverified claim with an adversarial skeptic. Map the real architecture with proof. Let the
**owner design a better architecture** — the machine never designs, it only evidences and checks
completeness. Then regenerate the code wave by wave *into the new shape*, behind mutation-proven
test floors and golden-master seams, with the legacy system shipping until each wave's gates are
green. The governing directive, binding on every campaign: **better, never a copy** — equivalence
gates protect behavior; they never mandate structural closeness. Applied end-state: rewrite ≠
risky bet, but a gated, evidence-driven production line — for any project, any stack.

## 2. Why we believe it works

Deep research (10 sources, 3-vote adversarial verification) found **no validated precedent**:
industry extracts rules but never closed the loop; the one academic attempt found regeneration
collapses to near-zero equivalence. We closed the loop ourselves, twice, in campaign #1:

| Experiment | Stack / code class | Result |
|---|---|---|
| P0 (posmCompliance, ~1,200 lines, 133 rules) | C++ / rule-shaped | **GO** — first buildable version byte-exact incl. 6 preserved bugs; 1 repair (linkage); its mull figures were later exposed as instrument-inflated (P0d re-baseline: true 53.8% decide-stage) — the byte-exact equivalence gates stand unaffected |
| P0-bis (RANSAC row-clustering core) | C++ / algorithm-shaped, stochastic | **GO-ALGORITHM-ARM** — behaviorally exact under seeded RNG; 1 repair (RNG ambiguity); mull above baseline |
| P0-RC (`CompleteRealogram` area, 84 rules) | **Flutter/Dart** / domain usecase | **GO** — 38/39 first shot; 1 repair = the generator's own pre-declared ambiguity (registry corrected); fresh blind battery → 100% reachable-kill; **regenerated 599L readable-first vs the refactored 1,335L — adopted** |
| P0-FSD (141 rules) | **Flutter/Dart** / domain usecase | **GO** — **97/97 first shot, ZERO repairs**; fresh battery 100% after 14 REAL suite gaps killed; **adopted** |

**Four experiments, two stacks, four GO — and the trend is improving** (repairs 1→1→1→0; the
declared-ambiguity obligation turned the RC repair into a pre-flagged registry fix). Same profile
every time: **generation is not the bottleneck — registry completeness and oracle strength are.**
Every repair traced to registry under-specification; every gate-invisible risk (P0's BR-106,
P0-bis's 45.6% weak-oracle shell, the Flutter suites' 20 REAL blind spots exposed by fresh blind
batteries) was caught by the method *before* being trusted. Two corollary findings from campaign
#2's W3 retrospective, now program doctrine candidates: **refactoring under house-precedent
steering can inflate code** (+177% lines at CCN success — the mine-design D1 circularity, fix
incoming as plugin feedback E1), and **per-shape mutant sets age — a "gated" suite still needs a
fresh blind-battery audit** (the S2 `mine-oracle-strength` candidate, the 12th mine). A third
joined from campaign #1's P0d (2026-07-21): **the measuring instrument itself can lie** — P0's
97.8–100% mull scores were race-inflated (a shared `/tmp` artifact under parallel workers turned
crashes into false kills; honest per-pid re-instrument: 53.8%). Generalized after campaign #2's
instrument review found the serial-harness analog (exit-code conflation — compile failures counted
as kills): **a kill only counts if it traces to a failing test assertion, never to infrastructure
failure (race, crash, compile error, timeout); every instrument must prove its kill-attribution
before its scores are trusted, and the concrete proof is per-instrument-shape** (parallel
shared-state → reproducibility run-pair + serial; exit-code batteries → failure-output
classification, proven fired in campaign #2 — 2 compile-fail kills in RC gen-2, recorded
86.15% correcting to ~77.5%, and non-uniform contamination across arms invalidates ranking
comparisons; timeout-counting gates like Stryker → timeouts bucketed separately and
adjudicated per-mutant, never auto-counted as kills — proven verdict-flipping in the .NET
estate, 2026-07-21: three timeouts on loop-free string literals carried a 75-floor PASS that
honestly reads 73.58% FAIL). A fourth shape closed the set: **gate arithmetic is part of the
instrument** — the shipped `cover-gates.mjs` both counted Timeout as killed and rounded
74.59% up to a 75-floor PASS (fix: timeout = adjudication bucket; exact floor comparison,
no rounding). A fifth: **the instrument's scope is part of the claim** — campaign #1's D2 gate
scored 91.9% on a `gitDiffRef`-collapsed 37-mutant subset; the honest whole-region score is
60.3% (fix: the claimed scope's mutant total is recorded with the score, and a re-run must
reproduce it). The estate-wide reproducibility sweep (2026-07-21) found no further race-class
defects — the five sibling C++ instruments all pass run-pair + serial with survivor-diff 0.

- Research: `docs/kb/research/br-anchored-regeneration-landscape.md` (this repo)
- Experiment reports: campaign #1's repo (see §6 artifact map)

## 3. The method (stack-independent core loop)

```
MINE       clean-room extraction of rules / architecture / designs / algorithms / patterns
VERIFY     adversarial skeptic re-executes every claim's evidence — unverified claims die
GATE       mutation testing proves tests catch bugs; goldens freeze observable seams
DESIGN     the OWNER decides the better shape (C4 diagrams, iterative; machine checks
           completeness: every capability and rule has a home)
REGENERATE generate into the designed shape from rules alone; bounded repair loop;
           every repair diff is mining-method feedback
PROVE      suite green -> mutation floor held -> goldens byte-exact -> wave cuts over
```

Doctrine that holds everywhere: **facts vs judgments** (mines record only what re-executes;
"what should be" is always human); **oracle-strength before trust** (weak-oracle code gets
fixtures before regeneration — the strengthen-before-regenerate class); **declared ambiguity**
(generators flag what the registry under-specifies; each flag becomes a registry fix).

**Model-tier doctrine (owner-ratified 2026-07-22; usage constraints lifted).** Capability is
spent where the campaigns proved failures live — mining completeness and verification — never on
generation glamour (sonnet generators already delivered 97/97 zero-repair):

| Stage class | Tier | Grounds |
|---|---|---|
| Orchestrating architect, gate audits, escalation rulings | **fable** | the adjudication layer — wrong rulings compound |
| Skeptics, judges, adjudication (fidelity, survivors, timeouts) | **fable** | the trust layer; the estate's one fable judge caught the wrong-formula rule (BR-89) three miners + a skeptic missed |
| Miners/extractors + clean-room generators, designers, blind mutant authors | **opus** | registry completeness is the proven bottleneck — every repair ever traced to under-mining |
| Mechanical stages (re-pointing, refresh, scoring, repairs) | **sonnet** | judgment-free |

**The asymmetry rule (binding): verification never runs below generation** — a skeptic or judge
runs at ≥ the tier of the producer it checks. Declared per run via the kickoff stage-model-plan
(declare-and-veto, F17); enforced in `mine-family-core` §Kickoff item 5. Supersedes the
budget-era "all spawned stages sonnet" ruling (S1 proposal, 2026-07-20).

## 4. The capability stack (what this repo ships)

Eleven mines, one shared skeleton (clean-room extraction → skeptic → evidence-carrying registry),
shipped in the `nexus` plugin (1.38.0) + stack adapters:

| Layer | Components | Status |
|---|---|---|
| Behavior mining | `mine-verify-cover` (+ adapters: **.NET, C++, Flutter/Dart, PHP**), `mine-from-spec`, `mine-verify-flows` | Shipped, battle-tested |
| Architecture mining | `mine-architecture` (F16 — current-state map, capability catalog, rule-coverage join) | Shipped 1.38.0; first pilot owed |
| "Better" evidence | `mine-design` (patterns earn their complexity), `mine-algorithm` (canonical-replacement adjudication), `mine-reference-model` (what to copy) | Shipped |
| Debt & patterns | `mine-verify-repo`, `mine-skill-gaps`, `mine-skill-candidates` (F15) | Shipped |
| Gating | mutation floors (per-stack adapter), golden-master harness pattern (per-campaign, at the frozen seam), `mine-semantic-model` (data semantics) | Proven in campaign #1 |
| Pattern packs | per-target-stack generation skills — grown per campaign (C++ pack growing now via skill seeds + F15) | Per-campaign cost |

## 5. Campaigns (executions of the program)

**Campaign #1 — omnivision-ai-sdk (C++, running).** The proving ground: both experiments, the
frozen C-export seam, P1 refactoring-as-mining under way, P2–P4 ahead. Its own master docs live
in that repo (`docs/specs/F2-SdkRewrite/` — tech-spec + campaign overview). Everything the
program learns there feeds back here as method/tool changes (BR-106 → coverage doctrine; P0-bis
→ oracle-strength doctrine + declared-ambiguity protocol candidate).

**Campaign #2 — omnishelf_flutter_app (Flutter/Dart, RATIFIED 2026-07-20 — Track B gated).**
The generalization claim is being tested a phase earlier than planned: two GO regenerations
already ran there (P0-RC, P0-FSD — both adopted), and its W-waves are re-classified as that
repo's P1 refactoring-as-mining. Both lane proposals are **owner-ratified** (2026-07-20):
`docs/proposals/refactoring-method-v2.md` — Track A (elected-conventions charter) **active**,
Track B (full campaign candidacy) **gated** on charter + a P0-Flutter GO on the elected unit;
`docs/proposals/regeneration-and-conventions-skill-pack.md` — S1 `regenerate-unit` and
S2 `mine-oracle-strength` build **nexus-side**, S3 conventions pipeline prototypes locally first.
Pilot cluster: **fix-shelf** (+ the report-generation god-class variant). Doctrine minted there,
now ratified: **design intent enters at generation time, never as post-generation refactoring**
(the v3 pass was proven byte-identical and deliberately discarded; findings live in the S1
calibration ledger); **adoption and integration-branch operations are always standalone owner
questions**; the **re-shape vs in-place chunk** wave model (waves cut by the *target*
architecture; not everything re-homes). Nexus-side changes arrive as plugin-feedback entries
(E1–E4, S1–S3, filed on that repo's Phase 0) and are triaged into F-slugs here under this
repo's governance.

**Campaign #N — any project, any stack.** Preconditions per new campaign:
1. A `mine-verify-cover` **stack adapter** — the hard gate is a usable **mutation tool** for the
   stack (this is what makes rules *verified*).
2. A **golden seam** — some frozen boundary where byte-comparable oracles can sit.
3. A **BR-mining campaign first** (rules before anything — everything joins on them).
4. A target-stack **pattern pack + reference model** (the recurring per-campaign cost).
5. **A rerun of the P0 round-trip experiment as that campaign's go/no-go** — a GO earned in one
   campaign never transfers on faith.

Generalizing the playbook into a packaged, campaign-in-a-box offering is deliberately **not yet
shaped as a feature** — it graduates to a proposal when campaign #1 validates the full P0→P4
line end-to-end.

## 6. Artifact map

**This repo (nexus) — the program home:**
- This document — `docs/programs/br-anchored-regeneration.md`
- The capability: `plugins/nexus/skills/mine-*` (+ per-stack adapter plugins)
- Tool features: `docs/specs/F15-SkillCandidateMiner/`, `docs/specs/F16-ArchitectureMiner/`
- Research pool: `docs/kb/research/br-anchored-regeneration-landscape.md`

**Campaign #1 repo (`D:\omnishelf\omnivision-ai-sdk`):**
- Campaign master: `docs/specs/F2-SdkRewrite/definition/tech-spec.md` + `program-overview.md`
  (campaign-scoped overview) + the ratified proposal in `docs/proposals/`
- Experiments: `docs/specs/F2-SdkRewrite/delivery/` (P0 + executive brief),
  `docs/specs/F2-SdkRewrite/p0b-rowsplit/` (P0-bis)
- Registries: `docs/business-rules/`, `docs/tech-debt/`, `docs/reference-model.md`; future
  `docs/architecture-map/` (P2) and `docs/architecture/target/` (P3 C4 diagrams)

## 7. Program status & next milestones (2026-07-20)

1. Capability complete for campaign #1's needs — the eleventh mine shipped; **first
   `mine-architecture` pilot owed** — paid by whichever campaign runs it first (campaign #1's P2
   census, or campaign #2's Phase 2 which explicitly plans to pay it).
2. Campaign #1: P0/P0-bis GO · pilot p0c-shellimprove **owner-amended 2026-07-20 into the P4 wave
   rehearsal** — Stage 0 registry maintenance → 1A mine-design brief + 1B oracle-strengthening to
   ≥85% → Stage 2 whole-unit ENHANCED clean-room regeneration (registry + brief + reference model
   + pattern skills; behavior frozen, bugs preserved; gates: suite + mull floor + goldens); the
   85ff191 verbatim-move spike stands as structural prep only, not improvement · P1 running ·
   P2 census next · P3 owner design (C4) · P4 waves.
3. Campaign #2: both lane proposals **ratified 2026-07-20** · Phase 0 files plugin-feedback
   E1–E4 + S1–S3 → triage here into F-slugs (fast-track: E1 mine-design D1 fix — live defect;
   S2 `mine-oracle-strength` — candidate 12th mine; S1 `regenerate-unit` — the P4 inner loop) ·
   Phase 1 conventions charter → Phase 2 architecture map → Phase 3 fix-shelf pilot.
4. Program-level candidates queued behind campaign #1's validation: the declared-ambiguity
   generator obligation (P4 protocol), the campaign-in-a-box proposal (end-goal #2).
