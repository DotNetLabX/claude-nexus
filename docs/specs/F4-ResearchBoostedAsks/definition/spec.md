# F4-ResearchBoostedAsks — a clickable research option on low-confidence questions

**Traces to:** `plugins/nexus/rules/agents-workflow.md` (All-Agents hard rules: confidence label on every recommendation; offer research before a cold answer), `plugins/nexus/rules/research-before-asking.md` (Research & Confidence Protocol), the `research` skill (recall → dive → deep-research routing, capture-before-surface)
**Source:** Scratch — owner idea 2026-07-12 (shaped in-session; no proposal)
**Dependencies:** The `research` skill and the Research & Confidence Protocol (both shipped). **Extends `questions-format`:** the relayed path needs the question record to carry the research offer (see Scope) — a load-bearing extension, not a new artifact.
**Status:** Ready
**Plan:** `docs/specs/F4-ResearchBoostedAsks/delivery/plan.md`

---

## Purpose

Today, when an agent puts a question to the user with a medium- or low-confidence recommendation, the
existing rules require it to *offer* research in prose beside the question ("I can research {X} first —
want me to?"). In a batched interview that offer has no click path — the user would have to type free
text to accept it, so in practice they answer cold or rubber-stamp a weak recommendation. This feature
turns that offer into a **first-class, selectable option inside the question itself**, gated by the
confidence label that every ask already carries. The user boosts the questions they care about with one
click; everything else proceeds as today.

## Concepts

- **Boostable ask** — a **user-decision question** (a preference, priority, scope, or risk call — the
  kind that legitimately goes to the user) whose recommendation's confidence is **medium or low
  because it rests on an unconfirmed, expensive-to-confirm, fact-shaped input**. The boundary against
  the existing auto-research default:
  - A question that is *itself* a fact-shaped unknown never reaches the user at all — research is the
    default before asking (existing protocol, unchanged).
  - A *cheap* fact-shaped input (a grep, one doc read) is resolved silently before asking (existing
    depth dial, unchanged) — it never yields a boostable ask.
  - What remains — and is this feature's entire niche — is the depth dial's **offer branch**: the
    input is expensive to confirm (web research, multi-source), so it is offered rather than auto-run,
    *and the user may moot it by answering directly* (they may already have a direction).
  - A question whose confidence is low for reasons research cannot move (a pure taste or appetite
    call) is **not** boostable.
- **Research option** — the extra option a boostable ask carries. It is never generic: it names the
  fact-shaped input and a rough cost, e.g. *"Research {X} first (~5 web searches, a few minutes) — for
  a higher-confidence recommendation."*
- **Research round** — what selecting it triggers: the named input is resolved through the `research`
  skill (pool recall first; on a miss, a dive at the depth the skill judges — or, for heavy/breadth-first
  targets, a recommendation to run the gated `/deep-research`), and the **same question is re-asked**
  with the boosted recommendation and updated confidence.

**Worked example.** PO asks: *"Should F-next integrate with the issue tracker, or stay file-based?"* —
a scope call the user owns. Recommendation: *file-based*, confidence **medium**, because it rests on an
unconfirmed input: whether the tracker's integration surface actually supports the epic-linking flows
we'd need. That input is fact-shaped but expensive (external docs, a few searches) — too costly to
auto-run when the user may simply say "file-based, we decided that already." So the ask carries:
*"Research the tracker's epic-linking capability first (~5 web searches) — for a higher-confidence
recommendation."*

## Scope

Asks authored by **po, architect, or solo** (the agents that carry the research branch of the
Research & Confidence Protocol), on both delivery paths:

1. **Direct** — the persona asks the user in an interactive session. The research option is rendered
   as an option of the interactive question tool (the same clickable surface every attended ask
   already uses).
2. **Relayed** — a spawned agent's question travels to the user through the team lead, and the
   research offer must travel on the question record itself. The record already carries the
   recommendation and confidence; this feature **extends the question record** so the asking agent
   also persists the boostable mark, the named research target, and the rough cost (the exact field
   shape is plan material). The team lead renders what it received through the same interactive
   question tool; a click routes the research request back to the **asking agent**, which runs the
   round and returns the boosted question through the same relay.

Asks authored by the team lead or developer keep their confidence labels exactly as today and do
**not** grow the research option (they don't carry the protocol's research branch).

## Flows

```
Flow 1: direct ask, single question
1. Agent prepares a question; its recommendation lands at confidence medium or low
2. Agent judges boostability: does the recommendation rest on an expensive, fact-shaped,
   user-mootable input? If yes → append the research option (named target + rough cost);
   if no (pure preference, or nothing research can move) → present as today
3. User clicks the research option
4. Agent runs the research round via the research skill (recall first; capture-before-surface preserved)
5. Agent re-asks the same question: boosted recommendation, updated confidence, no research option
6. User answers; interview proceeds

Flow 2: mixed batch
1. Agent presents a batch; two questions are boostable and carry research options
2. User answers questions 1 and 3, clicks research on 2 and 4
3. Agent acts immediately on answered questions that don't depend on a researched one;
   an answered question whose outcome depends on a question still in research is held
   until that round resolves. Then the agent re-asks only questions 2 and 4

Flow 3: relayed question
1. A spawned architect hits a question, writes it to the question record with recommendation,
   confidence, and — judging it boostable — the research target + cost
2. Team lead surfaces it to the user; the rendered ask carries the research option exactly as
   the asking agent marked it (the team lead adds no judgment of its own)
3. User clicks research → team lead routes "research requested" back to the asking agent
4. Asking agent runs the round, returns the boosted question; team lead re-surfaces it

Flow 4: heavy-depth target
1. User clicks the research option on a question whose target is breadth-first (a landscape,
   a multi-source comparison)
2. The research skill's depth routing recommends the gated /deep-research instead of diving:
   the agent reports that recommendation + cost and waits — it never auto-invokes it
3. User runs /deep-research (or declines); on a report, it is captured to the pool and the
   question re-asked boosted; on decline, the question is re-asked unchanged, marked cold

Flow 5: full option budget
1. A boostable ask already needs the question tool's full option budget for substantive answers
2. The research offer is not dropped to prose and does not evict an answer option: it is posed
   as a companion yes/no question in the same batch ("Research {X} first? (defers this answer)")
3. If the user both answers the main question and requests research, the answer wins — the
   research is mooted and skipped
```

## Business Rules

1. Every ask reaching the user carries exactly one recommended option + a confidence label
   (existing hard rule — unchanged by this feature).
2. The research option appears **only** on a boostable ask: confidence medium or low **and** the
   recommendation rests on an expensive, fact-shaped, user-mootable input (per Concepts).
   High-confidence questions and pure-preference questions never carry it — a reflexive research
   option on every question is noise.
3. The research option always names its target and a rough cost/depth; a generic "let me research"
   option is malformed.
4. The existing research defaults are untouched, and this feature never substitutes for them: a
   question that is itself a fact-shaped unknown is auto-researched before any ask exists, and a
   cheap input is resolved silently. Offering the research option in either case is a protocol
   violation, not a use of this feature — the option exists only for the depth dial's offer branch.
5. A click resolves through the `research` skill (the named input is fact-shaped, so the skill and
   its capture schema apply as-is): pool recall first, capture-before-surface on a miss. For
   heavy/breadth-first targets the skill's routing to `/deep-research` stands — the agent recommends
   it with cost and never auto-invokes it.
6. **Re-ask, don't reopen:** after a research round, the same question returns with the boosted
   recommendation and updated confidence — never an open menu, never a different question.
7. **One round per question:** a re-asked question never carries the research option again, even if
   confidence stays medium or low. Residual uncertainty is stated in the recommendation's why;
   the user decides.
8. In a mixed batch, an answered question is acted on without waiting for the others' research
   rounds — unless its outcome depends on a question still in research, in which case it is held
   until that round resolves. Only researched questions are re-asked.
9. The research option never evicts a substantive answer option. When the ask already uses the
   question tool's full option budget, the offer becomes a companion yes/no question in the same
   batch — still clickable, never prose. If the user both answers and requests research, the
   answer wins and the research is skipped.
10. On the relayed path, boostability is judged and marked by the **asking agent** on the question
    record (mark + target + cost); the team lead relays it verbatim and routes the click back — it
    never re-judges, re-prices, or researches on the asker's behalf.
11. Unattended runs are unaffected: this feature exists only where a question reaches a live user;
    unattended proceed-on-high behavior is unchanged.
12. The existing prose-offer texts (the "offer research before a cold answer" rule and the
    protocol's "offer" section) are updated to point at the clickable option as the primary form —
    so agents don't keep offering prose-only where a clickable ask is available. Prose remains the
    form for surfaces with no clickable ask.

## Acceptance Criteria

- [ ] A medium-confidence question resting on a named expensive fact-shaped input, presented by po,
      architect, or solo, carries a research option naming that input and a rough cost.
- [ ] A high-confidence question never carries the research option.
- [ ] A low-confidence pure-preference question (research cannot move it) does not carry the option.
- [ ] Clicking the option triggers pool recall first; on a miss the dive's cited result is captured to
      `docs/kb/research/` before the boosted question is presented (existing capture rules observed).
- [ ] The re-asked question shows an updated recommendation + confidence and carries no research
      option (one-round cap), with residual uncertainty stated when confidence stayed below high.
- [ ] In a mixed batch, an answered question independent of the researched ones is acted on without
      waiting; an answered question dependent on a researched one is held until that round resolves.
- [ ] A relayed question's record carries the asking agent's boostable mark, target, and cost; the
      team lead's rendered ask shows the option verbatim; a click reaches the asking agent and the
      boosted question returns through the relay.
- [ ] When a question already uses the full option budget, the research offer appears as a companion
      yes/no question in the same batch; if the user both answers and requests research, the answer
      is acted on and the research skipped.
- [ ] A heavy-depth click yields a `/deep-research` recommendation + cost, never an auto-invocation.

## Out of Scope

- **Auto-research on low confidence without a click** — cost control stays with the user; the only
  automatic research is the existing fact-shaped-unknown default and cheap-input silent resolve,
  both of which fire *before* a question exists.
- **Boosting a question that is itself a fact-shaped unknown** — already owned by the existing
  research-before-asking default (rule 4).
- **Changes to the confidence vocabulary or thresholds** — high/medium/low and their meanings are
  untouched; this feature only adds a click path at medium and below.
- **Multiple research rounds per question** — one round, then the user decides (rule 7); loops burn
  budget without a convergence guarantee.
- **Help/tooltips deliverable** — no product UI; the surface is the question protocol itself
  (skip confirmed at shaping).
- **mine-from-spec** — agent-protocol behavior with no code surface; does not qualify (skip confirmed
  at shaping).
