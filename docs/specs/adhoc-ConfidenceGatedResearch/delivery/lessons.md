# adhoc-ConfidenceGatedResearch — Lessons

## Architect Lessons

- **"Edit the canonical rule" is not done — the inlined agent copies are the load-bearing surface
  (ADR-2 #2 + ADR-14).** The plan's first draft sharpened the confidence rule on `agents-workflow.md`
  L92 and assumed it would reach all agents "via the pointer." It doesn't: a spawned subagent sees only
  its own file, so a rule that lives only behind a pointer never reaches it — which is the entire reason
  ADR-14 duplicates hard rules into each agent. Any change to a behavioral hard rule must edit the
  canonical rule **and** every inlined copy. *Recurrence signal:* this is the same class as the
  reviewer-noted "applied for D2 (3 agents) but dropped for D1 (5 agents)." **Improvement proposal:** a
  lint/check that, when a hard rule in the All-Agents block changes, flags every agent file whose
  inlined copy didn't change in the same commit (candidate for the learner — a deterministic guard for
  a class agents keep dropping).

- **A duplication audit must grep agents/ AND rules/, never rules-only.** The plan claimed the
  "I can research" offer had 2 owners; it had 4 (two rules + two inlined agent backstops). The
  acceptance grep was scoped to `rules/*.md` and would have passed green while the agent copies stayed
  unreconciled. Acceptance greps for "one owner" must cover every surface the fact can live on.

- **Cheap local research before expensive review measurably shrank the work — the P1 thesis,
  dogfooded.** Two cheap moves (the omnishelf reads; `grep "without a confidence label"`) collapsed the
  net-research list and pre-found the D1/D2 scope split *before* the review ran. This is exactly the
  behavior P1 is trying to install. Worth citing as live evidence in the proposal.

## Process / Tooling Lessons (route to the learner)

- **The Nexus `critic` is structurally un-retrievable under background spawn.** It is
  `disallowedTools: Write,Edit` (message-only by the 1.4.0 contract), and its findings were lost
  **twice** to inline-result truncation (first spawn returned only the verdict line; `SendMessage`
  resume returned 0 tool-uses + an empty output file). ADR-17's documented recovery ("re-spawn with the
  file named as the primary deliverable") is **impossible for a message-only agent** — it cannot write
  the file. Recovery required substituting a general-purpose code-grounded reviewer that *can* write.
  *Recurrence signal:* this is the ADR-16/ADR-17 failure mode recurring, now with the added wrinkle that
  the prescribed recovery is blocked by the critic's own tool restriction. **Improvement proposal
  (learner / architecture):** either (a) give the critic a single allowed write to a fixed
  `review.md`/findings path (so its deliverable is durable, not inline-only), or (b) document that a
  code-grounded review of plugin source should be dispatched to a write-capable reviewer from the start,
  not the message-only critic. This is a genuine gap between ADR-13's "critic message-only contract" and
  ADR-17's "artifact is the primary deliverable" — the two collide for this agent.
