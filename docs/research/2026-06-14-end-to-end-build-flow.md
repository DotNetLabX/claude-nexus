# Research — End-to-End Build Flow (idea → ship) for the Nexus Pipeline

**Date:** 2026-06-14
**Purpose:** ground the upcoming proposal to (a) formalize the *research* and *proposal* stages,
(b) integrate them with the existing Nexus pipeline, and (c) decide which steps are mandatory vs
skippable. This is **research, not a proposal** — it gathers the evidence a proposal will commit to.
**Method:** five parallel OMC `document-specialist` agents (live web, cited), one per area —
spec-driven development, solution-architecture methodologies, product discovery/requirements,
research→proposal/RFC/spike processes, and test-harness/verification — plus internal recon of the
current pipeline and the existing research/test artifacts. Every background agent stranded its report
behind a lifecycle closer; reports were recovered verbatim from transcripts (see §9).
**Builds on:** `docs/proposals/research-system-overview.md` (the confidence-gated research engine,
shipped 1.8.2), `docs/research/testing-claude-code-plugins.md` (the 4-tier test strategy), and
`docs/proposals/mine-verify-pilot-method.md` (the clean-room extraction harness).

---

## 0. The one finding that governs everything else

**All five streams independently converged on the same master gate: what makes a step mandatory or
skippable is *cost-of-being-wrong* — uncertainty × irreversibility — NOT feature size.**

| Stream | Its version of the rule |
|---|---|
| Product discovery | NN/g: *"Scale it, don't skip it."* Scale process to **uncertainty**, not feature size. |
| Solution architecture | Decision tree keyed on *local & well-understood?* → *cross-team?* → *touches a contract?* → *riskiest assumption untested?* — never on size. |
| Research → proposal | The **two-way vs one-way door** (reversible vs irreversible) is the master skip gate; confidence gates research-vs-decide. |
| Spec-driven dev | Skip the spec only when *throwaway / well-understood / a misread costs trivial rework*. |
| Test harness | **Early gates universal, later gates scoped** to what the change touches. |

This is the rule your "some mandatory, some skippable" instinct was reaching for. It is also the rule
the Nexus *confidence-gated research engine* already encodes at the micro scale (an unconfirmed
load-bearing assumption lowers confidence → triggers research before a verdict). The proposal should
adopt it as the **single skip criterion for the whole pipeline**, replacing any size-based heuristic.

A one-line statement of the gate, suitable for an ADR:
> A stage is mandatory when getting it wrong is *expensive or hard to reverse*. When the decision is a
> cheap two-way door, collapse the stage to its lightest artifact (a line) or skip it.

---

## 1. The canonical end-to-end flow (industry synthesis)

Stripped to the shared spine across all five streams:

```
IDEA
  → RESEARCH / SPIKE        (reduce uncertainty; output = recommendation + confidence; throwaway)
  → PROPOSAL / DECISION     (articulate the choice + alternatives; a NAMED owner ratifies)
  → [branch] DEFINITION     (product: spec  |  technical: tech-spec + ADRs)
  → PLAN                    (sequenced, dependency-annotated, independently verifiable steps)
  → BUILD                   (one slice at a time, with checkpoints)
  → VERIFY                  (tiered gates; acceptance criteria as executable tests)
  → SHIP
```

| Stage | What it is | Artifact | Owner | Skippable when… |
|---|---|---|---|---|
| Research / spike | Timeboxed investigation; output is *knowledge*, not code (Beck's XP spike) | recommendation + confidence + options eliminated | architect (technical) / PO+trio (product) | the riskiest assumption is already known; reversible & low-cost |
| Proposal / decision | A reviewable recommendation that a **named owner ratifies** (RFC/design-doc; NABC) | proposal doc, ratified | the named decision-maker (you, or the architect for technical) | small, team-internal, narrow decision space → go straight to one ADR |
| Definition | The committed "what" (product) or "how" (technical) | `spec.md` / tech-spec + ADRs | PO / architect | obvious solution, no trade-offs |
| Plan | Decision broken into ordered, verifiable steps | `plan.md` | architect | never (even a 1-step plan); this is the SDD task layer |
| Build | Incremental implementation | code + `implementation.md` | developer | never |
| Verify | Tiered verification; early gates universal | `review.md` + test runs | reviewer / critic / Codex | later gates (e2e/perf) scope to what changed |

The flow is **not waterfall** — every source stresses iteration (TOGAF ADM is explicitly an
iterative information-flow model; dual-track agile runs discovery *continuously alongside* delivery).
The stages are a logical ordering of artifacts, not gated phases.

---

## 2. The two branches — technical vs product (your "still a feature" point, grounded)

The research confirms the distinction we reached two turns ago is real and standard. The split is on
**who owns the definition**, and it determines the artifact, not the rigor:

| | **Product feature** | **Technical feature** |
|---|---|---|
| Definer | **PO + product trio** (PM/designer/tech-lead) | **Architect** (the PO-equivalent) |
| Discovery | Cagan/Torres continuous discovery; opportunity-solution tree | research spike (survey prior art, build-vs-buy) |
| Definition artifact | `spec.md` / PRD / Shape Up *pitch* (problem, appetite, solution, rabbit-holes, no-gos) | **tech-spec / design doc** (context, goals/non-goals, design, alternatives, cross-cutting) |
| Decision record | acceptance criteria | **ADRs** (one decision each, in-repo, chained) |
| Owns | **what & why** | **how** |
| Cross-check | critic Mode 1 vs product docs | critic / ADR register |

Mountain Goat's clean statement: *"the PO owns what and why; the architect/tech-lead owns how."* A
purely technical feature has no product "what" to shape — so the architect defines it, and the
binding cross-check is the **ADR register**, not product docs (which is exactly what `architect.md`
already says for ad-hoc passes). Both branches converge at **Plan**.

### 2a. ADR vs tech-spec — your pasted rule, corroborated

Your "same thinking at two altitudes, one authoritative" rule is **industry-standard**, confirmed
independently by both the solution-architecture and RFC streams:

- *Tech-spec/design-doc = where you explore* (options, trade-offs, narrative). *ADR = the durable
  one-decision record* (terse, in-repo, greppable). "RFC/design-doc explores → team decides → ADR
  records." (Nygard 2011; candost.blog; Google design docs.)
- **One authoritative source.** ADR wins on *the decision*; the spec/proposal owns *the rationale*
  and the ADR points back to it. *"Future proposals read ADRs, not old RFCs."*
- **Drift over time → supersede, don't rewrite** (the same supersede-don't-delete rule the research
  engine already uses; Python's *Provisional* status is the canonical confidence-gated landing).
- **The proposal graduates.** A ratified technical proposal *is promoted* to the tech-spec; ADRs are
  *extracted* from it (the Reflekt "one writing session, two homes" path) — never re-authored.

Adopt as decided. **Confidence: high.**

---

## 3. Research → proposal, formalized

Today in this repo, **research** is the just-shipped confidence-gated engine and **proposal** is a
freeform file in `docs/proposals/`. The research gives both a standard shape to formalize against:

**Research = the spike.** Timeboxed, deliverable is a *recommendation + confidence + options
eliminated* (not code). Nexus already has this as the confidence-gated engine; the only formalization
needed is to name it a pipeline stage with an output contract (the engine's entry/output schema).

**Proposal = the RFC / design-doc.** The convergent format (Phil Calçado's NABC; Rust/PEP/Google):

- **Need** (problem, why now, out-of-scope) · **Approach** · **Benefits** · **Alternatives /
  Competition** · **Unresolved questions**.
- A **named decision-maker** in the header. The single most important governance rule from the RFC
  stream: **a proposal is *not* a decision — it gathers feedback; a named owner ratifies.** This
  enables "disagree and commit."
- Lifecycle: **Draft → Ratified → Superseded** (mirrors the research engine's supersede discipline
  and ADR status).
- **Ratification is an explicit act**, then the proposal *graduates*: technical → promoted to
  tech-spec + ADRs extracted; product → handed to the PO as the spec seed.

This directly answers "formalize the proposal": give `docs/proposals/*` an RFC-lite front-matter
and a ratification gate. Unratified proposals stay the **idea inbox**; ratified ones become
**backlog rows** (see §6).

### 3a. Proposal front-matter, confidence reuse, and the gate (decided 2026-06-14)

The proposal is the architect's recommendation. It carries (extends P2's research-output format):

- **Recommendation + confidence** — from **P1**: derived from unconfirmed assumptions, never
  self-rated.
- **Product impact (1–10)** — when it makes sense (skip for pure-internal plumbing).
- **Effort (low / med / high)** — the Shape-Up *appetite* signal.
- **Alternatives considered** — P2 already requires this (anti-confirmation-bias, neutral framing).

**Ratifier = you; the architect recommends** (decided: *option 3*). Option 1 ("you ratify all,
no recommendation") was rejected as a **regression** — it discards the recommendation+confidence the
agents already produce. Crucially this **reuses P1, doesn't re-decide it**: *if confidence is not
High, the recommendation is "research first" (P1's research branch), not a go/no-go you ratify.* You
only ever ratify **High-confidence** recommendations; anything below routes through a research spike
(P1) and re-surfaces. That is the anti-regression guarantee.

**Proposal critic gate ("Mode 0") = default skip; user confirmation IS the gate.** A proposal already
carries derived confidence + mandatory alternatives, so it is self-critiqued; the master gate reserves
extra ceremony for high-stakes. So: default-skip, and the Mode-0 critic runs **only on explicit user
confirmation** — the confirmation *is* the gate. That is the only reliable form: an automated gate on
a background subagent does not hold (ADR-13), so user confirmation is the sole enforcement point that
does, consistent with every other reliable gate in the pipeline. The architect may *flag* a
high-impact/irreversible proposal as a prompt, but enforcement is the confirm, not the flag.

**No overlap with the research system (P1 / P2 / P3).** This flow **consumes** the confidence-gated
engine (P1, shipped 1.8.2) and the `search-researches` + research-KB schema (P2, in build as
`adhoc-ResearchKB`). It does **not** redefine them. "Research" as a flow stage *is* P1+P2; impact and
effort are the only proposal-layer additions on top of P2's research-output format.

impact + effort also give the **backlog its priority ordering** (ratified proposals → rows ranked by
impact ÷ effort), closing the ranking gap from the prior backlog discussion.

---

## 4. Spec-driven development: the destination, and the one real gap

The SDD stream is unambiguous that Nexus is already ~80% of the way to spec-driven development:

- **Mandatory across spec-kit / Kiro / Tessl / BMAD:** spec → human-review gate → task breakdown →
  verification. Nexus has all four (spec/plan → plan-review → plan steps → reviewer/critic).
- **The constitution layer** (spec-kit) / **steering files** (Kiro) = Nexus's `CLAUDE.md` + agent
  role boundaries. Already present.
- **Never self-review in the same context** (the core SDD/agent-verification rule) — Nexus *already*
  enforces this structurally via separate reviewer / critic / Codex agents. This is a genuine
  strength worth naming.

**The one structural gap: requirement → task traceability.** Standard SDD links each task back to a
specific acceptance criterion (Kiro's `requirements.md → design.md → tasks.md` requirement-ID chain).
Nexus plans enumerate steps but don't link them to acceptance criteria. Closing this loop is the
single addition that makes Nexus fully spec-anchored — *and* it is the mechanism that defeats the
biggest documented AI failure mode (see §5). **Confidence: high** this is the gap; **medium** on
implementation weight (could be as light as a "Satisfies: AC-3" annotation per plan step).

---

## 5. Verification / test-harness integration

The verify stage is a **mandatory terminal gate, tiered** — and Nexus already has both the strategy
and most of the best practices:

- **Tiering** (existing `testing-claude-code-plugins.md`): T1 structural lint → T2 node unit tests →
  T3 deterministic promptfoo evals → T4 judge evals. Maps onto the industry rule: *early gates
  universal (lint/unit always run, even for a one-line fix), later gates scoped to what changed.*
- **The `mine-verify` harness** is the clean-room extraction + adversarial-refutation pattern — a
  ready building block for the verify stage.
- **AI-specific best practices, and where Nexus stands:**
  - *Never self-review same context* → Nexus **already** does (separate reviewer/critic).
  - *Adversarial cross-model verify* (different models find different bugs) → Nexus **already** does
    (Codex as an independent second reviewer in Standard+Codex mode).
  - *"Passing tests / wrong thing" — intent drift* (Tricentis; the #1 documented AI failure: tests
    that prove the code runs, not that it does the intended thing) → countered by **acceptance-
    criteria traceability** (§4): when tests trace to spec criteria, a green suite that diverges from
    intent is detectable. This is *why* the SDD traceability gap and the verify stage are the same
    piece of work.

**Net:** integrating "a test harness for build automation" is mostly **sequencing existing research
into the flow as the tiered verify gate** + closing the traceability loop — not new research.

---

## 6. Mapping onto Nexus — current vs proposed

**Current pipeline:** `team-lead` orchestrates; `PO` (spec) → `architect` (plan + review mode) →
`developer` (implement) → `architect` Step-1 done-check → `reviewer`/`critic`/Codex Step-2 →
`learner`. `solo` for small scoped work. The **front** of the flow (idea → research → proposal →
definition) is informal; the **back** (plan → build → verify) is mature.

**Proposed end-to-end flow** (new/changed stages in **bold**):

```
IDEA
  → **RESEARCH** (confidence-gated engine, as a named stage; output = recommendation + confidence)
  → **PROPOSAL** (RFC-lite; named owner ratifies; Draft→Ratified→Superseded)
  → [branch]
       product   → PO: spec.md + acceptance criteria
       technical → architect: tech-spec (the promoted proposal) + extracted ADRs
  → PLAN (architect; **each step annotated with the AC it satisfies**)
  → BUILD (developer)
  → VERIFY (reviewer/critic/Codex; **tiered T1–T4 harness as the build gate**)
  → SHIP (team-lead: summary, **backlog row flipped to Done**)
```

**Mandatory-vs-skippable matrix (Nexus-specific):**

| Stage | Two-way door / low-uncertainty | One-way door / high-uncertainty |
|---|---|---|
| Research | skip | **mandatory** (spike before deciding) |
| Proposal | one ADR line | **mandatory** RFC-lite + ratification |
| Definition | skip (go to plan) | **mandatory** spec / tech-spec |
| Plan | **mandatory** (even 1 step) | **mandatory** |
| Build | **mandatory** | **mandatory** |
| Verify | T1+T2 (lint+unit) | **mandatory** full T1–T4 + adversarial |

The bottom three are always mandatory; the top three flex on the master gate. This is the
`solo` lane (top-row collapse) vs full pipeline (right column) distinction, now principled.

---

## 7. Recommendations (sequenced, for the proposal to commit)

1. **Adopt the master gate** (uncertainty × irreversibility) as the *single* skip criterion. Retire
   size-based reasoning. — *high*
2. **Name RESEARCH a pipeline stage** = the shipped confidence-gated engine, with an output contract
   (recommendation + confidence + options eliminated). — *high*
3. **Formalize PROPOSAL** as RFC-lite: NABC sections + named-owner header + Draft/Ratified/Superseded
   + the graduate-to-spec promotion rule. — *high*
4. **Encode the technical/product branch**: architect owns technical definition (tech-spec + ADRs);
   PO owns product definition (spec). Both converge at Plan. — *high*
5. **Close the SDD gap**: annotate each plan step with the acceptance criterion it satisfies; this
   also wires the verify stage against intent drift. — *high (need) / medium (weight)*
6. **Wire the verify stage** as the tiered T1–T4 harness + `mine-verify`, as build automation. — *med*
7. **Backlog = ratified-proposal queue** (ties to the prior backlog discussion): ratified proposals
   become backlog rows; unratified stay the idea inbox in `docs/proposals/`; Shape Up's warning —
   don't let unbet ideas accumulate as zombie rows. — *med*

---

## 8. Decisions (resolved 2026-06-14) + what's left for the architect

- **Ratifier — DECIDED:** you ratify; the architect recommends (recommendation + confidence + impact
  1–10 + effort low/med/high). Below-High confidence → research first (P1), **never** ratification.
- **Proposal gate — DECIDED:** default skip; the Mode-0 critic runs **only on explicit user
  confirmation — the confirmation *is* the gate** (the only reliable form; automated subagent gates
  don't hold, ADR-13). The architect may flag a high-impact/irreversible proposal, but enforcement is
  the user confirm, not the flag.
- **Traceability — DECIDED:** a one-line `Satisfies: AC-n` annotation per plan step (not a full
  requirement-ID chain).
- **Research as a separate stage — DEFERRED to the architect:** resolve while drafting whether a named
  research/spike stage adds value over P1's inline gate for large work, or whether P1 alone suffices.

**Hard constraint for the architect:** do not redefine or duplicate P1/P2/P3 — the flow consumes the
research system, it does not re-specify it. Coordinate with the in-flight `adhoc-ResearchKB` work.

---

## 9. Method notes & a plugin finding

- **Every background OMC agent stranded its report** behind a lifecycle closer ("Ready.", "Ready when
  you need me."). Recovered verbatim via longest-substantive-block extraction from the platform
  transcript. The *foreground* probe and the longest-running agent returned inline cleanly — stranding
  correlates with background spawn, consistent with ADR-12/ADR-17.
- **Plugin bug (salvage-transcript):** the shipped `salvage-transcript.js` last-non-closer heuristic
  **mis-picks when an agent appends a short post-report meta-message** — that message isn't a closer
  by the keyword test, so salvage stops on it instead of the (earlier, longer) report. For
  research-report agents the deliverable is reliably the *longest* substantive block. Recommend adding
  a `--longest` selection mode (or making it the default for non-pipeline agents). Worth a
  plugin-feedback entry + a patch.

---

## Sources (by stream)

**Spec-driven development:** [Böckeler — Understanding SDD (martinfowler.com)](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) · [GitHub Spec Kit](https://github.com/github/spec-kit) + [blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) · [Kiro docs](https://kiro.dev/docs/specs/) · [Tessl SDD](https://docs.tessl.io/use/spec-driven-development-with-tessl) · [Thoughtworks — SDD 2025](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices) · [Adzic — SDD: revenge of waterfall?](https://www.linkedin.com/pulse/spec-driven-development-revenge-waterfall-bdd-taken-gojko-adzic-imquf)

**Solution architecture:** [TOGAF ADM (Conexiam)](https://conexiam.com/togaf-adm-phases-explained/) · [C4 model (InfoQ)](https://www.infoq.com/articles/C4-architecture-model/) · [arc42](https://arc42.org/overview) · [Kruchten 4+1 (IEEE)](https://doi.org/10.1109/52.469759) · [DDD strategic patterns (Open Group)](https://digital-portfolio.opengroup.org/oaa-standard/latest/part2-building-blocks/DDD-strategic-patterns.html) · [Nygard — ADRs](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) · [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/) · [Architectural spiking](https://cloud-architecture.io/architecture/architectural-spiking/) · [candost — ADRs vs RFCs](https://candost.blog/adrs-rfcs-differences-when-which/)

**Product discovery:** [SVPG — Dual-Track Agile](https://www.svpg.com/dual-track-agile/) · [Torres — Continuous Discovery Habits](https://www.mindtheproduct.com/continuous-discovery-habits/) · [Patton — User Story Mapping](https://www.oreilly.com/library/view/user-story-mapping/9781491904893/) · [Adzic — Impact Mapping](https://leanpub.com/impact-mapping) · [Brandolini — Event Storming](https://en.wikipedia.org/wiki/Event_storming) · [Adzic — Specification by Example](https://gojko.net/books/specification-by-example/) · [Basecamp — Shape Up](https://basecamp.com/shapeup/) · [Productboard — PRD Guide](https://www.productboard.com/blog/product-requirements-document-guide/) · [Mountain Goat — PO vs architecture](https://www.mountaingoatsoftware.com/blog/can-a-product-owner-dictate-the-architecture) · [NN/g — Discovery in Agile](https://www.nngroup.com/articles/discovery-in-agile/)

**Research → proposal:** [Mountain Goat — Spikes](https://www.mountaingoatsoftware.com/blog/spikes) · [Rust RFC 0002](https://rust-lang.github.io/rfcs/0002-rfc-process.html) · [Python PEP 1](https://peps.python.org/pep-0001/) · [IETF RFC 2026](https://www.rfc-editor.org/rfc/rfc2026.html) · [Calçado — Structured RFC Process](https://philcalcado.com/2018/11/19/a_structured_rfc_process.html) · [Thoughtworks Tech Radar](https://www.thoughtworks.com/radar) · [fs.blog — reversible decisions](https://fs.blog/reversible-irreversible-decisions/)

**Test harness / verification:** [Thoughtworks — shift-left](https://www.thoughtworks.com/insights/blog/transitioning-conventional-shift-left-testing) · [Agile Alliance — ATDD](https://agilealliance.org/glossary/atdd/) · [Braintrust — agent evaluation](https://www.braintrust.dev/articles/agent-evaluation) · [MindStudio — multi-agent review](https://www.mindstudio.ai/blog/automated-code-review-multiple-ai-agents) · [coleam00/adversarial-dev](https://github.com/coleam00/adversarial-dev) · [Tricentis — intent drift](https://www.tricentis.com/blog/intent-drift-ai-code-fix-regression-blind-spots) · [Ning et al. — Code as Agent Harness (arXiv 2605.18747)](https://arxiv.org/html/2605.18747v1)
