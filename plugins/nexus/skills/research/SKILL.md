---
name: research
description: Research a fact-shaped unknown once, then reuse it — grep the local research pool first; on a miss, route by depth — a low–medium fact runs a forked read-only web dive now, a heavy/breadth-first one is routed to the built-in /deep-research — either way the cited result is captured to docs/kb/research/ before you answer. Use when po/architect/solo hit a fact-shaped unknown (a library capability, whether an approach is known to work, what a spec elsewhere decided) that current context cannot resolve. NOT a bare generic/Explore agent for a fact-shaped unknown (it recalls nothing and captures nothing). Recall is inline and grep-based only; the low–medium dive is isolated in a forked researcher; /deep-research is a gated, user-invocable built-in this skill routes to and captures, never auto-invokes.
user-invocable: true
---

# Research

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

The researcher is **read-only** and **self-contained**: it uses **`WebSearch` / `WebFetch` only**, so the
low–medium dive needs no external tool. This self-containment is a **constraint, not a preference**:
`/deep-research` (the heavy path, below) is a **Claude Code built-in workflow** — **user-invocable only**
(it cannot be spawned programmatically by a skill or subagent) and **gated** (CLI version, a paid plan,
and the `disableWorkflows`/Pro-`/config` toggle), so it **may be absent**. The skill therefore runs
low–medium dives itself (the forked researcher) and *routes* heavy dives to `/deep-research` for the user
to run — it never auto-invokes it. `Explore` is the recommended subagent type for the forked dive
(read-only, web-capable); `general-purpose` is the alternative.

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

## Route by depth (cache miss)

When recall finds no usable entry (no match, or a match that failed the validity gate), **route by the
depth of the question** before diving:

- **Low–medium** — a focused fact: one library capability, "does X work / under what conditions", "what
  did spec Y decide", a single config or version question. **This is the default.** The self-contained
  forked `Explore` researcher runs the dive **now** (the *execution path* below) — no external tool.
- **High / breadth-first** — a landscape or multi-source comparison: "what's the best approach across the
  field", a competitive scan, a survey spanning many sources. **Surface a recommended option to the
  caller** — *run the built-in `/deep-research {question framed neutrally}`* (reuse the neutral-framing
  rule below to build the string) — then go to **capture** (*Capture a `/deep-research` report*, below).
  Do **not** auto-spawn the forked researcher's 3-worker fan-out for these; the built-in does breadth and
  adversarial synthesis better, and (per the constraint above) the skill cannot invoke it programmatically
  anyway — the user runs it, the skill captures the result.

The depth heuristic is a judgment call on the question's *shape*: one fact vs. a field. When unsure, prefer
low–medium (the self-contained dive always works and captures); escalate to `/deep-research` only for a
genuine breadth scan.

## Steps (execution path — low–medium, cache miss)

For a **low–medium** question (the default route above), run the forked dive:

1. **Frame the question neutrally.** State it as an open question — never lead the researcher toward the
   answer you expect. Confirmation-biased framing ("confirm that X works") corrupts the verdict; ask
   "does X work, and under what conditions?" This neutral framing is part of the researcher's prompt.

2. **Spawn the forked researcher.** Use the **Agent tool** with subagent type `Explore`, model
   tiered by run mode (the research-dive exception in the `pipeline-guardrails` rule): in an
   `[UNATTENDED]` run always `model: "sonnet"`; attended, tier by stakes — `sonnet` for a routine
   fact, `opus` for a high-stakes or breadth verdict — and `fable` only after the user explicitly
   approves it (recommend it when the verdict warrants the strongest model; never auto-spawn fable). Its prompt
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
   node {research folder}/scripts/cite-check.mjs {drafted-entry.md}
   ```

   It exits non-zero on a claim with no source and no `[no source found]`, on a `## Sources` entry that is
   a bare placeholder (`TODO` / `TBD` / `[source]`), and on a high-stakes single-source verdict. The
   prompt instruction in Step 2 is a *request*; this check is the *enforcement* — a drafted entry that
   fails it does not get written. (Resolve the script via the plugin cache in a consuming project: glob
   `~/.claude/plugins/cache/**/skills/research/scripts/cite-check.mjs`, highest version.)

5. **Persist to the pool.** Write the validated entry to `docs/kb/research/{topic}.md` in the consuming
   project. Create the `docs/kb/research/` folder **lazily** the first time it is needed — the plugin never
   ships it (ADR-1). `{topic}` is a short slug for the subject area; multiple Q-and-A blocks may share one
   topic file.

6. **Then surface the answer** to the caller (verdict + the recommendation). The entry is written *before*
   the summary is presented — the pool is the durable record.

## Capture a `/deep-research` report (the heavy route)

When the **high / breadth-first** route sent the user to `/deep-research` and the report has come back, it
lands **in the caller's context** (the built-in writes no pool entry — capturing it is pure net value).
Reshape it into a pool entry so the breadth dive compounds like every other:

1. **Read the report from the caller's context.** It is already in-session — the built-in emitted it here.
   No file path to chase; the report text is the input.

2. **Reshape into `research-entry-schema` format** — the metadata block (Verdict, Evidence tier, As-of,
   Validity scope, Status, Reconfirm trigger, Corroboration) + the 8-part body (`## Verdict` … `##
   Recommendation`) + the `[n]` claim grammar (claims as bullets under `## Finding` / `## Fix` /
   `## Alternatives`, each ending in `[n]` or `[no source found]`; `## Sources` carries the linked
   references). This is **model-driven semantic reshaping** — read the report's findings and re-express
   them in the schema — **not** a brittle parser keyed on `/deep-research`'s exact layout, so it stays
   robust if the built-in's output format changes.

3. **Derive the three fields a `/deep-research` report does not hand you.** These are the hard part — naive
   copy-through fails `cite-check` (its high-stakes and validity checks):
   - **Evidence tier** → `read-docs` when an authoritative source backs the claim, else `inferred`.
     **Never `ran-it`** — a web dive observes nothing first-hand, so `ran-it` is never correct for a
     captured report.
   - **Validity scope + Reconfirm trigger** → synthesize from the question's subject: the version / API /
     platform the answer holds for, and the event (a version bump, a date, a config change) that would
     invalidate it. **Never leave Validity scope blank** — the schema treats a blank scope as stale by
     definition, so a blank fails the recall validity-gate immediately.
   - **Corroboration** → map `/deep-research`'s per-claim cross-check to the cite-check grammar: when a
     verdict is **high-stakes** (a downstream decision rests on it), label Corroboration `high-stakes` and
     record either a source **count ≥ 2** or the literal `second independent source agreed` — that clears
     the floor. **If a high-stakes verdict rests on a single source, do NOT label it a cleared
     `high-stakes` Corroboration** — `cite-check` fails-closed on a `high-stakes` line with `< 2` sources
     **regardless of `Status`** (the gate keys on the `high-stakes` token in Corroboration, not on
     `Status`). Instead record the **source count**, set **`Status: uncertain`**, and state the
     single-source limitation in `## Caveat`. This is the honest single-source capture — an entry recorded
     as uncertain, never a fabricated second source, and never a high-stakes verdict the floor would reject.

4. **Validate before persisting (fail-closed — same gate as the forked path):**

   ```bash
   node {research folder}/scripts/cite-check.mjs {drafted-entry.md}
   ```

   An uncited claim, a placeholder source, or a high-stakes single-source verdict does **not** get written.
   The reshape prompt above is the *request*; this check is the *enforcement* — a captured entry that fails
   it is fixed (derive the missing field, cite the claim, or flag `uncertain`) before it can persist.

5. **Supersede — don't delete**, then **persist** to `docs/kb/research/{topic}.md` (lazily create the
   folder; ADR-1). If an older entry already answered this question, mark it `Status: superseded` and keep
   it alongside the new one.

6. **Then surface the verdict** to the caller — the entry is written *before* the summary, same as the
   forked path.

## Fallback when the forked researcher is unavailable

The fork is the *default* execution path, not a precondition for capture. If the forked researcher cannot
be spawned (an infra failure — the Agent tool is unavailable) and **you have web access**, do the dive
**inline in the caller's own context** — and you **still owe the cited entry**. Infra failure must not
silently drop capture: this exact leak (a dive run, the answer surfaced, nothing written to the pool) is
what started this skill. So the fallback path still:

1. drafts the entry in the `research-entry-schema` shape (fields + 8-part body + claim grammar),
2. validates it through `node {research folder}/scripts/cite-check.mjs {drafted-entry.md}`
   (the same enforcement Step 4 runs — a failing draft is not written),
3. writes it to `docs/kb/research/{topic}.md` **before** surfacing the answer.

When the researcher is unavailable **and you also have no web access**, do not invent an answer. Either
**block** (report that the fact-shaped unknown is unresolvable right now and stop), or — if a decision must
proceed — **answer cold at explicitly lowered confidence** (never High; tag it `Confidence: low` with the
one-line reason that no source was checked, per `agents-workflow.md` L93) and record the open unknown as a
research target. The cold answer is a stopgap, not a captured verdict — no pool entry is written for an
uncited cold answer.

## Default a single researcher

Spawn **one** forked researcher by default for the low–medium dive. Do not fan out to parallel workers for
a focused fact-shaped question. A genuine landscape / competitive / multi-stream scan that wants breadth is
the **high / breadth-first** route above — it goes to the built-in **`/deep-research`** (purpose-built for
fan-out and adversarial synthesis) plus capture, *not* to a self-spawned fan-out: the built-in does breadth
better and the skill cannot invoke it programmatically regardless. This skill stays the inline,
captures-to-the-pool path. (A budget-gated ~3-worker forked fan-out is a deferred future option — P3 — not
the current breadth answer; breadth routes to `/deep-research`.)

## Scope (this skill)

- **In:** recall (local-first grep, added in Increment 2 below) + execution (forked dive, validate,
  persist). Self-contained on platform `WebSearch` / `WebFetch` + built-in `Explore` subagent.
- **Out:** heat-tiering, archive demotion, periodic GC, a learner consolidation mode, and fuller
  multi-source adversarial corroboration (all P3). A standalone researcher *agent* persona (P4).
  Embeddings / a vector index — recall is **grep-based only** (R3).

