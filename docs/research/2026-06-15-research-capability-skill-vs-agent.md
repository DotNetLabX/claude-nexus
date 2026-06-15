# Research — building our own research capability: skill, agent, or both?

**Question:** OMC (`oh-my-claudecode`) was uninstalled; its `document-specialist` agent did our deep
research. We're building our own replacement. Should it be a **skill**, a **subagent**, or **both** —
and what are the build best-practices? (Re-opens the 2026-06-14 "skill only" answer in
`adhoc-ResearchKB/questions.md` Q2, at the owner's request.)

**Method:** read omnishelf's `SKILL_AND_AGENT_RECIPES.md` §0/§4 (archetype + frontmatter) and the
actual `document-specialist`/`scientist` agent defs on GitHub; web dive — Claude Code skills-vs-subagents
guidance, Anthropic's multi-agent research-system writeup, deep-research citation/anti-hallucination
literature, and the **current** Claude Code skills docs on `context: fork`. Date: 2026-06-15.

---

## 1. Verdict — *changes the prior verdict*

Prior (2026-06-14, Q2): **"skill only,"** defer any agent. **Revised:** build **one skill that forks
into a subagent for the heavy part** — i.e. **both, via `context: fork`** — not a pure inline skill, and
not a standalone agent persona. Confidence: **high** (grounded in current official docs + Anthropic's
own research-system design).

The prior answer wasn't wrong on surface-minimisation; it was made before weighing a third shape
(`context: fork`) that did not enter the Q2 framing. That shape gives an agent's context-isolation at a
skill's surface cost — which is exactly the tension the owner flagged ("a deep web dive shouldn't run in
the architect's context").

## 2. Finding — the correction to the prior assumption

The prior framing treated the choice as binary: **skill** (small surface, but runs *inline* in the
caller's context) vs **agent** (isolated context + own tools/model, but a large surface — new persona,
command-gen, ADR-21 spawn-sanctioning, gate interactions). Both halves of that trade-off are real:

- A pure **inline skill** runs a deep web dive (many `WebSearch`/`WebFetch` calls) **inside the
  architect's/PO's context** — bloating it, and incurring the well-documented multi-agent token/context
  cost with none of the isolation benefit.
- A standalone **agent** is the structural twin of `document-specialist` (own window, own tools, can
  fan out workers) but carries the surface Q2 rightly wanted to avoid.

The missing third option: **a skill with `context: fork` + `agent:`**. Current Claude Code docs document
this directly, with a worked **"Research skill using Explore agent"** example — our exact use case. When
invoked, the skill content becomes the subagent's prompt, it runs in an **isolated forked context**, and
only a **summary returns** to the caller. One file; no separate persona/command-gen; still invocable by
po/architect/solo via the Skill tool.

## 3. The answer — concrete shape

Split by cost, because recall and execution want different homes:

- **Recall (local-first pool lookup)** → runs **inline** in the caller. It's a cheap grep over
  `docs/kb/research/*.md`; you want the hit in-context to act on. Do **not** fork this.
- **Execution (cache miss = the deep dive)** → runs in a **forked subagent context** (`context: fork`,
  `agent: Explore` or a research-tuned type), so the searches/fetches don't pollute the caller. Returns
  the structured entry + a summary. For genuinely breadth-first topics it may itself fan out to a few
  parallel workers (Anthropic orchestrator-worker), but only when the budget justifies the ~15× token
  cost — default to a single forked researcher.
- **Output contract (enforced, not just prompted):** every factual claim carries an inline citation;
  state explicitly when no source supports a claim (never invent one); the 8-part output format already
  in P2 (verdict / finding / fix / **alternatives considered** / caveat / fallback / sources /
  next-probe). Pair the prompt rules with a **post-generation check** (cite-or-drop), per the
  three-layer anti-hallucination pattern — a prompt instruction alone is a request, not an enforcement.

So: **one `search-researches` skill** — inline recall, forked execution — plus its `research-entry-schema`
sibling. No new agent *persona*; the "agent" is the built-in fork target.

## 4. Alternatives considered (anti-confirmation-bias)

| Option | Verdict | Why |
|---|---|---|
| **A. Pure inline skill** (prior Q2 answer) | Rejected as the *execution* home | Deep dive bloats the caller's context; no isolation; the costly-but-no-benefit case |
| **B. Standalone research agent** (`document-specialist` twin) | Rejected *for now* | Largest surface (persona, command-gen, ADR-21 sanctioning, gate interactions) for isolation that `context: fork` already provides; revisit only if a custom system prompt/model is needed |
| **C. Skill that forks (`context: fork`)** | **Chosen** | Isolation of an agent at the surface of a skill; the documented best-practice shape for research skills; recall stays cheap and inline |

## 5. Honest caveat

- **`context: fork` had a "silently ignored" bug** ([issue #17283](https://github.com/anthropics/claude-code/issues/17283),
  opened 2026-01-10, now **Closed**). The current docs document the feature as working with examples, so
  it's very likely fixed — but **not guaranteed on every installed CC version.** Verify it actually forks
  before relying on it (decisive probe below).
- **`allowed-tools` is marked *experimental*** in the Agent Skills open standard (support varies across
  implementations), though Claude Code documents it.
- **Multi-agent fan-out costs ~15× chat tokens** — Anthropic's own guidance: the full orchestrator-worker
  topology is only justified for provably breadth-first tasks; most cases get the reliability gains inside
  a single (forked) agent. So default to a single forked researcher, fan out only on demand.

## 6. Fallback

If `context: fork` does **not** fork on the installed CC version: ship `search-researches` as an inline
skill whose instructions **explicitly spawn** an `Explore`/`general-purpose` subagent via the Agent tool
for the dive (the issue-#17283 workaround: "restructure as a custom agent"). Same isolation, achieved
imperatively instead of declaratively. The recall layer is identical either way.

## 7. Primary sources

- Claude Code — Skills docs (current), incl. **"Run skills in a subagent"** + frontmatter reference:
  https://code.claude.com/docs/en/skills
- `context: fork` honoring bug (Closed): https://github.com/anthropics/claude-code/issues/17283
- Anthropic — *How we built our multi-agent research system* (orchestrator-worker, 3–5 parallel Sonnet
  subagents, separate citation pass, +90% vs single-agent, ~15× tokens):
  https://www.anthropic.com/engineering/built-multi-agent-research-system
- Skills vs subagents guidance: https://zencoder.ai/blog/claude-code-skills-vs-subagents
- Deep-research citation accuracy / anti-hallucination (DRBench FACT: Claude-with-search 94%; three-layer
  protocol; cite-per-claim; abstain when evidence thin): arXiv 2601.22984, DRBench (Du et al. 2025)
- OMC source read this session: `Yeachan-Heo/oh-my-claudecode` `agents/document-specialist.md` (research
  librarian — local→curated→external sources, WebSearch/WebFetch, "every claim needs a verifiable
  source"), `agents/scientist.md` (Python data analysis — *not* our case)
- Local: omnishelf `D:\omnishelf\omnishelf-docs\.claude\skills\SKILL_AND_AGENT_RECIPES.md` §0 (archetype),
  §4 (`context: fork` "fits research/audit skills that fan out and return a report")

## 8. Recommendation + decisive next probe

**Recommend:** plan `adhoc-ResearchKB` as one skill — **inline recall + forked execution** (`context:
fork`) — with the cite-or-drop validator, built execution-first then recall. Skip the standalone agent
persona; keep it as a documented future option (Option B) if a custom system prompt/model is later
needed.

**Decisive probe (cheapest test):** author a 5-line throwaway `context: fork` skill with `agent: Explore`,
invoke it, and confirm it runs in a forked context (clean caller, summarised return). If yes → declarative
fork. If no → Option-6 fallback (imperative spawn). Run this *before* writing the execution step.

## Provenance
Architect research spike, 2026-06-15, standalone session. Re-opens `adhoc-ResearchKB` Q2 at owner request.
Feeds the `adhoc-ResearchKB` Phase-2 plan.
