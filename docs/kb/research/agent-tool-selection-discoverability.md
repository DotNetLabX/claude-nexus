# agent-tool-selection-discoverability

## What is the most effective placement for tool/recipe-selection guidance in a many-tool LLM agent system — always-on injected context vs. on-demand retrieval vs. other mechanisms?

**Verdict:** No single mechanism wins unconditionally: always-on injection in the system prompt is most reliable for small-to-moderate toolsets (roughly under ~20–30 tools), but degrades due to context rot and lost-in-the-middle effects at scale; at larger toolsets semantic retrieval (Tool RAG) is empirically superior, with hybrid two-phase approaches (compact always-on metadata + on-demand full spec) being the recommended architecture for production systems. Rich per-tool descriptions are a high-ROI improvement at any scale, but carry a median +67% execution-step overhead when fully augmented.
**Evidence tier:** read-docs
**As-of:** 2026-06-17
**Validity scope:** Current-gen transformer-based LLM agents (Claude, GPT-4-class, Gemini 2.5-class) with system-prompt + tool-use architecture; context windows 32k–1M; tool counts ranging from single digits to hundreds
**Status:** current
**Reconfirm trigger:** A frontier model is released that demonstrably does not exhibit lost-in-the-middle degradation across its full context window, or a new architecture eliminates attention dilution at scale; or MCP publishes standardized tool-description best-practice requirements (SEP-1382 resolution)
**Corroboration:** 7 independent sources (Anthropic engineering blog × 2, arXiv tool-description paper, arXiv SoK skills paper, RAG-MCP arXiv/Red Hat replication, context-rot cross-model study, MCP specification); the core verdict — that always-on injection beats on-demand retrieval at small scale but reverses at large tool counts — is independently supported by both the Anthropic context engineering guidance and the RAG-MCP / Tool RAG empirical literature, constituting a second independent corroborating source.

## Verdict

For up to roughly 20–30 tools, placing tool-selection guidance always-on in the system prompt (via a `## Tool guidance` section and rich per-tool descriptions) is most reliable, because on-demand retrieval introduces a failure mode: the agent must choose to load the guide before it knows it needs it, and retrieval miss rates are material when tool metadata is poor. Beyond that scale, semantic retrieval (Tool RAG) that narrows the visible toolset to the most relevant subset per query outperforms always-on injection by large margins (from 13% to 43% accuracy in one direct benchmark). The recommended production architecture is hybrid: always-on compact metadata (name + one-line purpose) for all tools, with full specs loaded on demand — the same two-phase pattern used by Claude Code's skill system. A dedicated router/dispatcher is a viable alternative when sub-millisecond latency is required, but introduces its own complexity and staleness risks.

## Finding

- Anthropic's context engineering guidance explicitly recommends a `## Tool guidance` section in the system prompt and states that tool descriptions are "dynamically loaded into Claude's system prompt," endorsing always-on placement as the baseline approach for tool selection guidance. [1]
- Anthropic warns that agents should be given "the minimal set of information" needed and that tools should have "minimal overlap in functionality," as bloated tool sets "distract agents from pursuing efficient strategies." [1]
- Anthropic's "Writing Effective Tools" post specifies that tool descriptions are "loaded into your agents' context" and "collectively steer agents toward effective tool-calling behaviors," and that namespacing (e.g., `asana_search`, `jira_search`) helps agents "select the right tools at the right time." [2]
- Anthropic explicitly warns: "More tools don't always lead to better outcomes," and recommends starting with a few high-impact tools before scaling. [2]
- RAG-MCP (arXiv 2025) achieved 43.13% accuracy versus baselines of 18.20% and 13.62% by dynamically retrieving a relevant subset of tools per query rather than presenting all tools at once — a direct empirical comparison of retrieval vs. always-on injection at large toolset scale. [3]
- The Red Hat Tool RAG analysis reports that intelligent retrieval can "triple tool invocation accuracy while reducing prompt length in half" at enterprise scale (hundreds to thousands of tools). [4]
- Llama 3.1-8B failed to select the correct tool when given all 46 tools in context but succeeded when reduced to 19 tools — showing a concrete degradation threshold where always-on injection broke down. [4]
- 97.1% of analyzed MCP tool descriptions (856 tools across 103 servers) contain at least one "smell" — unclear purpose (56%), unstated limitations, missing usage guidelines — directly degrading the agent's ability to select the right tool from always-on injected descriptions. [5]
- Augmenting tool descriptions with a six-component rubric (Purpose, Guidelines, Limitations, Parameter Explanation, Length, Examples) improved task success by +5.85 percentage points and partial goal completion by +15.12%, but increased execution steps by a median of 67.46%. [5]
- Dropping the Examples component from augmented descriptions preserved statistically equivalent performance while reducing overhead — the lean augmented description (without examples) is the practical sweet spot. [5]
- The SoK Agentic Skills paper documents a two-phase loading pattern (metadata always-on, full spec on-demand) as the architecture that allows an agent to "know about hundreds of skills while spending context tokens only on the few it activates." [6]
- Failure modes for on-demand skill retrieval include retrieval misses ("If descriptions are wrong or incomplete, retrieval can pick the wrong skill or miss a relevant one"), metadata poisoning (adversarial descriptions surface wrong skills), and skill conflicts when multiple skills match simultaneously. [6]
- Curated on-demand skills raised agent pass rates by +16.2 percentage points on SkillsBench (86 tasks, 7,308 trajectories); self-generated skills degraded performance by 1.3 pp — demonstrating that on-demand retrieval quality is entirely dependent on curation quality of the metadata/description. [6]
- Context rot degrades all tested frontier models (GPT-4.1, Claude Opus 4, Gemini 2.5 Pro, Qwen3-235B) monotonically as input length grows; steepest degradation occurs in the 100K–500K token range, and no model maintained uniform retrieval accuracy across its full advertised context window. [7]
- Lost-in-the-middle effects cause accuracy to drop >30% when relevant content is positioned in the middle (positions 5–15 of 20 documents) versus at the start or end, directly threatening tool selection guidance buried in long system prompts. [7]
- A model with a 200K context window exhibits significant degradation at 50K tokens — meaning even large windows do not protect against context rot for always-on guidance. [7]
- The MCP specification defines tool descriptions as the primary discovery mechanism (name, description, inputSchema) and supports `listChanged` notifications for dynamic tool rosters, but provides no normative guidance on selection heuristics or where orchestrators should place selection guidance. [8]
- Semantic router architectures require tool selection to complete within single-digit milliseconds (5ms budget at 10K req/s), making LLM-based on-demand retrieval infeasible in latency-critical paths; lightweight embedding-based routers are the alternative. [9]
- Dynamic Tool Dependency Retrieval (DTDR) outperforms static retrieval by conditioning tool selection on both the initial query and the evolving execution context, improving multi-step function-calling success rates. [9]
- LLMs encode a reliable tool-necessity signal in hidden states (AUROC 0.89–0.96 across six models) even when generation fails to act on it, meaning the failure to invoke a tool is a generation/calibration problem, not an absence of internal knowledge. [10]

## Fix

- For toolsets up to ~20 tools: place selection guidance always-on in the system prompt under a clearly marked `## Tool guidance` section; invest in rich per-tool descriptions covering Purpose, Guidelines, Limitations, and Parameter Explanation (omit Examples to avoid +67% overhead). [1][2][5]
- For toolsets of 20–50 tools: introduce semantic namespacing and consolidate overlapping tools; test whether always-on injection still yields acceptable selection accuracy before adding retrieval infrastructure. [2][4]
- For toolsets above ~50 tools: implement a Tool RAG layer that narrows the presented toolset to 5–10 candidates per query before sending to the LLM; always-on injection at this scale causes context overload and accuracy collapse. [3][4]
- Use the two-phase hybrid architecture regardless of scale: always-on compact metadata (tool name + one-line purpose) for all tools, full spec loaded on demand when the agent selects a candidate — this is the pattern Claude Code's skill system implements. [6]
- Audit all tool descriptions against the six-component rubric (Purpose, Guidelines, Limitations, Parameter Explanation, Completeness, optional Examples); 97% of MCP tool descriptions currently fail at least one component, making always-on injection of poor descriptions worse than no guidance. [5]
- Place the most critical tool selection guidance at the beginning of the system prompt (not the middle) to exploit primacy bias and resist lost-in-the-middle degradation. [7]
- For latency-critical infrastructure (sub-5ms), use a lightweight embedding-based semantic router rather than LLM-based on-demand retrieval. [9]
- For multi-step agentic workflows, use dynamic retrieval conditioned on evolving task context (DTDR pattern), not just the initial query, because the best tool at step N depends on what happened at steps 1 through N-1. [9]

## Alternatives

- **Always-on injection only (large scale):** Loses because context overload causes tool selection accuracy to collapse — demonstrated by Llama 3.1-8B failing at 46 tools but succeeding at 19 tools, and RAG-MCP showing 43% vs. 13% accuracy for retrieval vs. always-on at scale. [3][4]
- **On-demand retrieval only (no always-on metadata):** Loses because the agent must choose to load the guide before knowing it needs it; retrieval quality is gated entirely on metadata quality, which is poor in 97% of real MCP servers; self-generated skills degrade performance by 1.3 pp; retrieval misses are a documented failure mode. [5][6]
- **Richer per-tool descriptions alone (without structural changes):** Partial win — +5.85 pp task success — but median +67% execution-step overhead and 16.67% regression rate mean it is insufficient as a standalone solution without also controlling tool count. [5]
- **Dedicated router/dispatcher model:** Viable in latency-critical paths but adds architectural complexity, suffers from stale performance metrics as tools evolve, and coarse complexity scoring mispredicts nuanced task demands. [9]
- **Training/fine-tuning for tool selection:** Increases parameter size and tool variety in training consistently helps; more instances per tool produces mixed effects. Viable long-term but not a quick fix for deployment, and doesn't eliminate context-rot effects at inference time. [no source found]
- **Progressive disclosure / scoped tool loadout (per-task subset injection):** Functionally equivalent to Tool RAG when curated statically; superior to always-on injection at scale; inferior to dynamic semantic retrieval when task diversity is high, because static loadouts cannot adapt to query-by-query variation. [4][6]

## Caveat

- The 20–50 tool degradation threshold is inferred from case examples (Llama 3.1-8B: 46 vs. 19 tools) rather than from a systematic benchmark sweep across all model families; more capable models may sustain always-on injection to higher tool counts. [4]
- Context-rot and lost-in-the-middle findings are most strongly evidenced for mid-2025 model families; architectural mitigations in future models could shift these thresholds. [7]
- The +5.85 pp improvement from richer descriptions was measured on specific benchmark tasks; domain variation is large (healthcare skills: +51.9 pp vs. software engineering: +4.5 pp), so gains may not generalize. [5][6]
- Tool RAG accuracy depends critically on embedding quality and tool-description quality; if descriptions are poor, retrieval recall suffers and on-demand retrieval becomes worse than a well-curated always-on set of fewer tools. [5][6]
- The MCP spec provides no normative placement guidance, so MCP-based deployments have no authoritative standard to follow, only community and research best practice. [8]
- On-demand retrieval failure ("agent doesn't load the doc it should") is a real and documented failure mode but its base rate under good metadata conditions is not quantified in available primary sources. [6]

## Fallback

- If the hybrid two-phase approach is too complex to implement, fall back to: keep always-on tool count aggressively low (under ~20) by consolidating and eliminating overlapping tools, invest heavily in description quality, and use system-prompt placement with critical guidance at the very top. [1][2]
- If Tool RAG retrieval accuracy is poor, diagnose description quality first (use the six-component rubric audit) before adjusting retrieval architecture; description quality is the primary bottleneck, not the retrieval mechanism. [5]
- If on-demand retrieval is suspected to be silently failing (agent not loading specs it should), add logging/tracing of skill invocation rates and compare against task success rates; switch to always-on injection for the failing subset of tools as a targeted fix. [6]
- If a new model is released claiming to have solved lost-in-the-middle at full context, rerun RAG-MCP-style benchmarks at scale before abandoning the hybrid architecture. [3][7]

## Sources

[1] https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[2] https://www.anthropic.com/engineering/writing-tools-for-agents
[3] https://arxiv.org/pdf/2505.03275
[4] https://next.redhat.com/2025/11/26/tool-rag-the-next-breakthrough-in-scalable-ai-agents/
[5] https://arxiv.org/html/2602.14878v1
[6] https://arxiv.org/html/2602.20867v1
[7] https://www.morphllm.com/context-rot
[8] https://modelcontextprotocol.io/specification/2025-11-25/server/tools
[9] https://arxiv.org/pdf/2603.13426
[10] https://arxiv.org/html/2605.09252v1

## Recommendation

Adopt the two-phase hybrid architecture immediately: audit all tool descriptions against the six-component rubric [5], keep compact metadata always-on for all tools, load full specs on demand when a tool is selected, and add a semantic retrieval layer if the active toolset exceeds ~30 tools. The next probe to reopen this question: run a controlled benchmark comparing always-on vs. hybrid vs. full Tool RAG across your specific tool corpus at tool counts of 10, 30, 50, and 100 — the existing literature provides existence proofs but no universal threshold that accounts for model capability, description quality, and domain distribution simultaneously.
