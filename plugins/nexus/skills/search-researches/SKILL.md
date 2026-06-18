---
name: search-researches
description: Research a fact-shaped unknown once, then reuse it — grep the local research pool first, and on a miss spawn a forked read-only researcher for the web dive that returns a cited entry written to docs/kb/research/ before you answer. Use when po/architect/solo hit a fact-shaped unknown (a library capability, whether an approach is known to work, what a spec elsewhere decided) that current context cannot resolve. NOT for a standalone report with no pipeline capture (that is the built-in deep-research workflow, decoupled per ADR-1), and NOT a bare generic/Explore agent for a fact-shaped unknown (it recalls nothing and captures nothing). Limitation: inline + grep-based recall only; the dive is isolated in a forked researcher.
user-invocable: true
---

# Search Researches

Resolve a **fact-shaped unknown** — not a codebase grep, not a user preference, but a fact you cannot
resolve from current context (a library's actual capability, whether an approach is known to work, what
a spec elsewhere already decided; see the `research-before-asking` rule's third unknown-category). The
output is **cited or it does not ship**. Research **compounds**: the entry this skill writes is greppable
by the next caller, so the same dive never runs twice.

This is a **light, inline** skill — a person or a pipeline agent (po / architect / solo) drives it inside
a conversation. **Recall runs in the caller's context** (a cheap grep). Only the expensive web dive is
isolated in a forked subagent, so the dozens of searches and fetches never bloat the caller.

## Why the dive is a forked subagent, not skill-level `context: fork`

The dive runs in a **forked `Explore` subagent spawned via the Agent tool** — not via skill-level
`context: fork`. The reason is a constraint, not a workaround: **recall must stay inline** (a grep in the
caller's own context), but `context: fork` would fork the *whole* skill, pushing recall into the fork too.
The imperative Agent-tool spawn isolates **only** the dive while keeping recall in-caller. (Skill-level
`context: fork` stays a future option only if execution is later split into its own skill.)

The researcher is **read-only** and **self-contained**: it uses **`WebSearch` / `WebFetch` only** — no
dependency on OMC, and **deliberately decoupled from the built-in `deep-research` workflow (ADR-1)**:
`deep-research` is a standalone, user-invocable Claude Code workflow that emits a report and writes no pool
entry, so this skill never delegates capture to it. `Explore` is the recommended subagent type (read-only,
web-capable); `general-purpose` is the alternative.

## Recall first (inline, local-first)

**Always run recall before any dive** — it is a cheap grep in the caller's own context (no fork), and a
hit saves the whole expensive dive. Recall is the local-first half of the skill; execution (below) runs
only on a miss.

1. **Grep the pool, keyed on the question.** Search `docs/kb/research/*.md` for entries whose
   `## {Question answered}` heading (the recall key) and verdict match the current question. Match on the
   question's subject, not on exact wording — the same fact may have been captured under a differently-phrased
   question.

2. **Judge the hit.** Let the model decide whether a candidate entry actually answers *this* question — a
   keyword overlap is not a hit. No match → it is a **miss**; go to execution.

3. **Validity-gate the hit (R2).** Even a matching entry is only usable if it is still valid. Treat it as a
   **miss and re-research** (run execution) when **either**:
   - its **Reconfirm trigger** has fired (the version bumped, the date passed, the config changed), **or**
   - it is **past its Validity scope**, including the schema rule that an entry with **no validity scope is
     stale** by definition.
   Also re-research a `Status: uncertain` or already-`superseded` entry.

4. **Fresh hit → return it, no fork.** If the entry matches and passes the validity gate, return its verdict
   and recommendation directly. No researcher is spawned — this is the compounding payoff.

5. **On a re-research write, supersede — don't delete.** When execution produces a new entry for a question
   an old entry already covered, mark the **old** entry `Status: superseded` and **keep it**; write the new
   entry alongside. Never delete the old one — it is the audit trail of why the verdict changed (the
   build-persona supersede-don't-delete rule and `research-entry-schema`).

Recall is **grep-based only** — no embeddings, no vector index (R3). Heat-tiering, archive demotion,
periodic GC, and a learner consolidation mode are out of scope (P3).

## Steps (execution path — cache miss)

When recall finds no usable entry (no match, or a match that failed the validity gate), run the dive:

1. **Frame the question neutrally.** State it as an open question — never lead the researcher toward the
   answer you expect. Confirmation-biased framing ("confirm that X works") corrupts the verdict; ask
   "does X work, and under what conditions?" This neutral framing is part of the researcher's prompt.

2. **Spawn the forked researcher.** Use the **Agent tool** with subagent type `Explore`. Its prompt
   carries: the neutrally-framed question; the instruction to use **`WebSearch` / `WebFetch` only**; the
   **`research-entry-schema`** format (fields + the 8-part body + the claim grammar) to draft the entry
   in; and the cite-or-drop rule — **every claim line ends with an inline `[n]` source reference or the
   literal `[no source found]`; never invent a citation.** The researcher returns a drafted, cited entry
   — its many tool calls stay in *its* context; the caller sees only the returned draft.

3. **Seek corroboration for a high-stakes verdict.** When the verdict is one a downstream decision rests
   on (**high-stakes**), the researcher seeks a **second independent source** and records it in the entry's
   **Corroboration** field (source count + whether a second independent source agreed). This is the
   corroboration floor; the validator (Step below) fails a high-stakes single-source verdict. (Fuller
   multi-source adversarial corroboration is deferred — P3.)

4. **Validate before persisting.** Run the deterministic check on the drafted entry:

   ```bash
   node {search-researches folder}/scripts/cite-check.mjs {drafted-entry.md}
   ```

   It exits non-zero on a claim with no source and no `[no source found]`, on a `## Sources` entry that is
   a bare placeholder (`TODO` / `TBD` / `[source]`), and on a high-stakes single-source verdict. The
   prompt instruction in Step 2 is a *request*; this check is the *enforcement* — a drafted entry that
   fails it does not get written. (Resolve the script via the plugin cache in a consuming project: glob
   `~/.claude/plugins/cache/**/skills/search-researches/scripts/cite-check.mjs`, highest version.)

5. **Persist to the pool.** Write the validated entry to `docs/kb/research/{topic}.md` in the consuming
   project. Create the `docs/kb/research/` folder **lazily** the first time it is needed — the plugin never
   ships it (ADR-1). `{topic}` is a short slug for the subject area; multiple Q-and-A blocks may share one
   topic file.

6. **Then surface the answer** to the caller (verdict + the recommendation). The entry is written *before*
   the summary is presented — the pool is the durable record.

## Fallback when the forked researcher is unavailable

The fork is the *default* execution path, not a precondition for capture. If the forked researcher cannot
be spawned (an infra failure — the Agent tool is unavailable) and **you have web access**, do the dive
**inline in the caller's own context** — and you **still owe the cited entry**. Infra failure must not
silently drop capture: this exact leak (a dive run, the answer surfaced, nothing written to the pool) is
what started this skill. So the fallback path still:

1. drafts the entry in the `research-entry-schema` shape (fields + 8-part body + claim grammar),
2. validates it through `node {search-researches folder}/scripts/cite-check.mjs {drafted-entry.md}`
   (the same enforcement Step 4 runs — a failing draft is not written),
3. writes it to `docs/kb/research/{topic}.md` **before** surfacing the answer.

When the researcher is unavailable **and you also have no web access**, do not invent an answer. Either
**block** (report that the fact-shaped unknown is unresolvable right now and stop), or — if a decision must
proceed — **answer cold at explicitly lowered confidence** (never High; tag it `Confidence: low` with the
one-line reason that no source was checked, per `agents-workflow.md` L93) and record the open unknown as a
research target. The cold answer is a stopgap, not a captured verdict — no pool entry is written for an
uncited cold answer.

## Default a single researcher

Spawn **one** forked researcher by default. Fan-out to ~3 parallel workers is a **budget-gated option for
breadth-first topics only** (it costs roughly 15× the tokens of a single dive); do not fan out for a
focused fact-shaped question. For a genuine landscape / competitive / multi-stream scan that wants
breadth, the built-in **`deep-research`** workflow is the better fit — it is purpose-built for fan-out and
adversarial synthesis; this skill stays the inline, captures-to-the-pool path.

## Scope (this skill)

- **In:** recall (local-first grep, added in Increment 2 below) + execution (forked dive, validate,
  persist). Self-contained on platform `WebSearch` / `WebFetch` + built-in `Explore` subagent.
- **Out:** heat-tiering, archive demotion, periodic GC, a learner consolidation mode, and fuller
  multi-source adversarial corroboration (all P3). A standalone researcher *agent* persona (P4).
  Embeddings / a vector index — recall is **grep-based only** (R3).

