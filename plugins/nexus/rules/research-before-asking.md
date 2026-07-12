# Research & Confidence Protocol

The single topical owner for *when to research before you answer*. The two hard rules it expands —
"offer research before a cold answer" and "an unconfirmed assumption lowers confidence" — live in the
All-Agents block of `agents-workflow.md` (the confidence-label and offer-research bullets); this file
holds the full protocol they point to.
Scoped to **po / architect / solo** (the agents that shape work and render verdicts) for judging and
originating a research offer — deciding a question is boostable, naming its target and cost. The
developer and team lead carry the confidence refinement (D1) but never judge or originate a research
offer; the team lead's part in this research branch is mechanical relay only — rendering a boostable
ask's research option verbatim and routing the click back to the asking agent (see questions-format,
`team-lead.md`) — never re-judging, re-pricing, or researching on the asker's behalf.

## The third unknown-category

Two kinds of unknown already have a settled move:

- a **grep-able codebase fact** (a signature, a config value, an existing pattern) → look it up; it is
  **never** a user question.
- a **user preference / priority / scope / risk** call → ask the user (with a confidence-tagged
  recommendation).

There is a **third** kind: a **fact-shaped unknown you cannot resolve from current context** — not in
the codebase to grep, not a matter of preference. A library's actual capability, whether an approach is
known to work, what a spec elsewhere already decided. For this kind, **research is the default action
before you render a verdict.** Do not promote it to a "basis" by assumption and do not bounce it to the
user as if it were a preference — resolve it. An unconfirmed answer to a fact-shaped unknown is exactly
the load-bearing assumption that lowers confidence (agents-workflow.md's confidence-label bullet): a
verdict resting on it is **not High** until you confirm it.

## The depth dial

Match the research effort to the cost of getting it, and decide whether to surface the choice:

- **Cheap / local** (a grep, one doc read, a quick KB lookup) → just do it and **resolve silently**.
  Surfacing a one-line lookup as a "should I research?" question is noise.
- **Expensive / external** (web search, fetching and cross-checking sources, a multi-step
  investigation) → **recommend it as an option, with a rough cost estimate** ("~5 web searches",
  "a few minutes"), so the user can choose research vs. a cold answer. This is
  `agents-workflow.md`'s offer-research bullet: on a **boostable ask**, the offer is a clickable
  research option (see §The offer below); elsewhere it is the prose form: *"I can research {X} first —
  want me to, or do you already have a direction?"* Offer only when research would genuinely change the
  question or your recommendation — a reflexive offer on every question is noise.

For a **fact-shaped unknown** (the third category above), the expensive route splits by depth — and the
`research` skill owns the split:

- **Low–medium** (a focused fact: one library capability, "does X work", what a spec elsewhere decided)
  → `/research` runs a **self-contained forked dive now** and captures the cited verdict.
- **Heavy / breadth-first** (a landscape or multi-source comparison) → `/research` recommends the built-in
  **`/deep-research`** (user-invocable, gated — the skill can't auto-invoke it) and **captures its report**
  into the pool.

Either way you call `/research`; it decides the engine. The depth heuristic and the capture mechanics live
in the skill (one owner — don't restate them here).

## Capture and recall through `research`

Research **compounds** — the same fact-shaped dive is never run twice. Route both the recall and the
capture through the `research` skill:

- **Recall first.** Before you dive on a fact-shaped unknown, run the `research` skill — it greps
  the local research pool (`docs/kb/research/*.md` in the consuming project) keyed on your question and,
  on a still-valid hit, returns the prior verdict instead of re-researching. A hit that has gone stale (its
  reconfirm-trigger fired or it is past its validity scope) is re-researched automatically.
- **Capture before you surface.** On a cache miss, the same skill runs the dive (in an isolated read-only
  researcher), then **writes the cited entry to `docs/kb/research/{topic}.md` before presenting the
  answer** — the pool is the durable record. The entry follows the `research-entry-schema` skill (fields,
  the 8-part output ordering, and the cite-or-drop claim grammar), and a deterministic check rejects an
  entry whose claims are not cited. A superseding re-research marks the old entry superseded and keeps it.

The `docs/kb/research/` folder is created **lazily in the consuming project** the first time it is needed —
the plugin never ships it (ADR-1).

## The offer — boostable asks and the research option

The offer exists to guard two failure modes: researching silently when the user may already know the
answer, and forcing a cold answer when researched context is cheap to get. The mechanism below — a
boostable ask carrying a clickable research option — lets the user decide either way, at their own
initiative.

### Boostable asks

A **boostable ask** is a user-decision question (a preference, priority, scope, or risk call — the
kind that legitimately goes to the user) whose recommendation's confidence is **medium or low because
it rests on an unconfirmed, expensive-to-confirm, fact-shaped input** that the user can moot by
answering directly. Three exclusions keep this from swallowing the existing defaults:

- A question that is **itself** a fact-shaped unknown never reaches the user at all — research is the
  default before asking (the fact-shaped-unknown default above, unchanged).
- A **cheap** fact-shaped input (a grep, one doc read) is resolved silently before asking (the depth
  dial above, unchanged) — it never yields a boostable ask.
- A question whose confidence is low for reasons research cannot move (a pure taste or appetite call)
  is **never** boostable — a reflexive research option on every question is noise.

**Worked example.** PO asks: "Should F-next integrate with the issue tracker, or stay file-based?" — a
scope call the user owns. Recommendation: file-based, confidence medium, because it rests on an
unconfirmed input — whether the tracker's integration surface actually supports the epic-linking flows
we'd need. That input is fact-shaped but expensive (external docs, a few searches) — too costly to
auto-run when the user may simply say "file-based, we decided that already." So the ask carries:
"Research the tracker's epic-linking capability first (~5 web searches) — for a higher-confidence
recommendation."

### The research option

On a boostable ask presented through a clickable surface (`AskUserQuestion`), the offer is an **option
in the question itself** — never prose-only. Canonical shape: label `Research first: {short target}`;
description `~{cost}. Defers this answer — the agent researches and re-asks with a boosted
recommendation.` A generic "let me research" option — no named target, no cost — is malformed.

### Round semantics

A click resolves through the `research` skill exactly as this rule already routes it: recall first,
then a dive or a `/deep-research` recommendation, capture-before-surface (see §Capture and recall
above — no new engine text here). The agent then **re-asks the same question** boosted: an updated
Recommendation and Confidence, never an open menu.

**One round per question.** The re-asked question never carries the research option again, even if
confidence stays medium or low — residual uncertainty goes into the recommendation's why, and the user
decides. A declined `/deep-research` re-asks the question unchanged, marked cold.

### Full option budget

The research option never evicts a substantive answer option. When the ask already uses the question
tool's full option budget, the offer becomes a **companion yes/no question in the same batch**
("Research {X} first? (defers this answer)") — still clickable, never dropped to prose. If the user
both answers the main question and requests research, **the answer wins** and the research is skipped.

### Mixed batch

In a batch with both answered and boostable questions, answered questions proceed immediately — unless
one depends on a question still in research, in which case it is **held** until that round resolves.
Only the researched questions are re-asked.

### Prose fallback

Prose survives only where there is no clickable surface to render the option on. This carve-out is
**attended/clickable-only, stated explicitly**: an unattended run has no clickable ask at all, so
BR11's guarantee (unattended behavior is unaffected by this feature) is textual here, not inferred.
Everywhere a clickable ask exists, the research option above is the primary form; prose is the
fallback, never an alternative.
