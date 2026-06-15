# Research & Confidence Protocol

The single topical owner for *when to research before you answer*. The two hard rules it expands —
"offer research before a cold answer" and "an unconfirmed assumption lowers confidence" — live in the
All-Agents block of `agents-workflow.md` (L92-L93); this file holds the full protocol they point to.
Scoped to **po / architect / solo** (the agents that shape work and render verdicts); the developer and
team lead carry the confidence refinement (D1) but not this research branch.

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
the load-bearing assumption that lowers confidence (agents-workflow.md L92): a verdict resting on it is
**not High** until you confirm it.

## The depth dial

Match the research effort to the cost of getting it, and decide whether to surface the choice:

- **Cheap / local** (a grep, one doc read, a quick KB lookup) → just do it and **resolve silently**.
  Surfacing a one-line lookup as a "should I research?" question is noise.
- **Expensive / external** (web search, fetching and cross-checking sources, a multi-step
  investigation) → **recommend it as an option, with a rough cost estimate** ("~5 web searches",
  "a few minutes"), so the user can choose research vs. a cold answer. This is the
  `agents-workflow.md` L93 offer: *"I can research {X} first — want me to, or do you already have a
  direction?"* Offer only when research would genuinely change the question or your recommendation — a
  reflexive offer on every question is noise.

## Capture and recall through `search-researches`

Research **compounds** — the same fact-shaped dive is never run twice. Route both the recall and the
capture through the `search-researches` skill:

- **Recall first.** Before you dive on a fact-shaped unknown, run the `search-researches` skill — it greps
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

## The offer (the L93 corollary, expanded)

When a question is headed to the user and targeted research could materially sharpen it or your
recommendation, present the questions normally and offer the choice alongside them:

> "I can research {X} (codebase, KB, existing specs/notes, or external sources) before you answer —
> want me to, or do you already have a direction?"

Don't silently go research when the user may already know the answer. Don't force a cold answer when
researched context is cheap. Let them decide — and for the fact-shaped unknown above, research is the
default rather than the offer.
