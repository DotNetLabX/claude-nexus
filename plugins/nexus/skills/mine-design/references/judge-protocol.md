# Judge protocol (mine-design Stage 3)

The two-tier, reject-by-default judge that decides which designer patterns survive. Its posture is
**blind** (no exemplar or reference brief in its inputs), **provenance-stripped**
(which-designer-produced-what removed), and run at a **higher model tier than the designers** — tier
separation is part of its independence. Grounding is the only currency; a pattern earns its place by
citing census rows that verify, not by the fame of its name.

## Tier 1 — absolute grounding kill

Each pattern is judged **on its own**, reject-by-default:

- **Re-execute every census-row citation** against live source; record the excerpt. A citation that
  does not verify kills the pattern.
- **Famous pattern names score zero.** An authority citation ("this is the GoF X pattern", "Fowler
  recommends Y") earns nothing — grounding is the only currency. Authority framing is precisely the
  pattern-cosplay mechanism the gate exists to suppress.
- **Fabricated census rows are caught by a range-check** — a claimed row outside the census's actual
  row set fails here.
- **Anti-move proposals fail outright** — Extract Method as a destination, guard-clause flattening,
  and the standing estate rejections (Visitor on flat structs, Template Method in a no-inheritance
  culture, CoR-as-structure, abstract-factory hierarchies) can never satisfy the census-citation
  obligation.

## Tier 2 — pairwise over the survivors only

Only tier-1 survivors reach tier 2:

- **Pairwise-rank** the survivors, run in **both orderings**.
- A **position flip** between the two orderings is resolved by grounding **evidence**, never by
  order. Pairwise judging is materially more distractor-gameable than absolute judging, which is why
  the absolute grounding kill runs **first** and only grounded survivors are ranked.

## Synthesis

The judge grafts the surviving moves into one brief; **every graft is census-cited**. The synthesis
may combine moves from different designers — the brief is the best grounded design, not a single
designer's submission.

## Evidence-excerpt requirement

Every verdict — a tier-1 kill, a tier-1 survival, a tier-2 ranking — **carries its evidence
excerpt** (the re-executed citation output, the range-check result, the ordering-vs-ordering
comparison). A verdict without its excerpt is dropped, the same must-RUN enforcement the family
skeptic uses.

## Few-shot rejection exemplars

Distilled from a manual expert calibration session — **rejection exemplars only, never a full
reference brief** (a reference brief in the judge's inputs would contaminate the blind posture). Each
is a pattern proposed and correctly rejected, with the grounded reason:

- **Visitor rejected — flat structs.** The domain was flat data structs with a kind discriminator,
  not a polymorphic hierarchy; double dispatch had nothing to dispatch on. Rejection reason:
  "pattern cosplay — no hierarchy to visit."
- **Template Method rejected — inheritance coupling.** The staged flow's variation was real (row 11),
  but Template Method buys it with inheritance coupling in a codebase with no inheritance culture;
  the Pipeline of stage objects delivers the same variation by composition. Rejection reason:
  "inheritance coupling where composition suffices."
- **Chain-of-Responsibility-as-structure rejected — boilerplate.** Classification precedence is CoR
  *semantically*, but the honest implementation is a first-match-wins loop over an ordered vector;
  the handler-linkage structure adds boilerplate for no path reduction. Rejection reason: "keep the
  semantics, drop the handler-linkage structure."

## Independence escalation ladder

The default independence mechanism is **provenance-strip + a different (higher) model tier** — this
is what production runs use, and pilot calibration confirmed it robust to fabricated authority and
position bias. **Escalate only if a run shows self-preference or authority leakage** (the judge
favoring its own tier's phrasing, or an authority citation earning weight it should not):

1. **First escalation — an external cross-family CLI judge** (a different model family invoked as a
   command-line judge), to break same-family correlated error.
2. **Second escalation — a 3-judge geometric-median panel** (aggregate three judges by the
   geometric median of their scores), only if a single external judge is still demonstrably unstable.

**Do not pre-build either.** The correlated-error ceiling means a panel is worthless until a single
judge is demonstrably unstable; building it speculatively adds cost and no signal. The ladder is
recorded so the escalation path is known, not so it is walked by default.

## Provenance

The two-tier gate, the authority-zero rule, the both-orderings rule, and the escalation ladder are
the ratified `mine-design` judge design (research-backed and pilot-confirmed: the planted
fabricated-authority candidate was killed entirely at tier 1, authority citations scored zero, and
every judged pair was run in both orderings with flips resolved by evidence). The rejection exemplars
are distilled from a manual expert calibration session — exemplars only, to keep production judges
blind. The plant itself is a **calibration-time instrument**; production runs do not include one.
