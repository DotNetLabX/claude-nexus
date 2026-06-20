# plugin-token-optimization

## What pure-plugin (no-proxy) techniques cut token cost in a Claude Code multi-agent pipeline, and which to avoid?

**Verdict:** Three pure-plugin techniques are worth adopting — (1) a cache-stable SessionStart injection (freeze the rules block, push per-turn volatiles to a `<system-reminder>`), (2) section-addressable handoff artifacts (TOC-indexed, read only the section you need), (3) a bounded distilled-return contract for subagents. Avoid lossy compression of structured handoff artifacts and any external compression proxy — both can corrupt the exact coordination the pipeline depends on.
**Evidence tier:** read-docs
**As-of:** 2026-06-19
**Validity scope:** Claude Code v2.x prompt-caching + plugin `additionalContext` placement behaviour; current Anthropic prompt-caching mechanics/pricing; the Nexus file-handoff pipeline architecture
**Status:** superseded
**Reconfirm trigger:** A change to Claude Code's prompt-caching behaviour or where it places plugin `additionalContext` in the prefix; a change to Anthropic cache pricing; a Nexus change to how the SessionStart rules block is injected
**Superseded by:** the 2026-06-20 live-audit entry appended below — the #1 "needs an audit" caveat is resolved: caching is healthy in two live projects, #1 is moot, and the spend is in large reads (#2)
**Corroboration:** high-stakes; 8 sources (4 primary). The cache-mechanics, subagent-isolation, just-in-time-retrieval, and `<system-reminder>` claims were independently corroborated and adversarially confirmed 3-0; the quantified-savings claims are single-source and were NOT confirmed in this run (see Caveat).

## Verdict
A Claude Code plugin cannot sit in the LLM request path, so proxy/library compressors (headroom-style) are out of scope — and unnecessary, because the harness already does native compaction and persisted-output. What a plugin *can* add on top is cache discipline and retrieval discipline. The highest-ROI, lowest-effort win is keeping the ~42KB SessionStart rules block byte-stable so it stays in the cached prefix; next is making subagents read only the artifact section they need; next is bounding what subagents hand back. The thing to avoid is the original headroom worry — lossy compression of spec/plan/impl artifacts — which the research backs as genuinely risky unless the original stays intact behind an index.

## Finding
- Prompt caching is prefix-matched: the API caches everything from the start of the request up to each cache_control breakpoint, and any change anywhere in the prefix invalidates everything cached after it [2].
- To maximize cache hits, content is ordered static-to-dynamic (static system prompt + tools, then CLAUDE.md, then session context, then messages) so the most requests share the longest prefix [2].
- Dynamic per-turn updates should be injected as a `<system-reminder>` in the next user message rather than by editing the system prompt, specifically to preserve the cache — directly implementable via a UserPromptSubmit hook [2].
- Injecting dynamic content anywhere before previously cached tokens forces the provider to recompute everything from the insertion point forward [3].
- Cache-aware structuring (dynamic content at the end / excluded from the cached prefix) reduced API cost 41–80% and improved time-to-first-token 13–31% across providers, vs naive full-context caching which can paradoxically increase latency [3].
- Subagents isolate exploration context and return a condensed 1,000–2,000-token summary despite consuming tens of thousands of tokens internally, so the lead agent only pays for the distilled result [1].
- A just-in-time retrieval approach — maintain lightweight identifiers (file paths, stored queries) and load only the needed data at runtime — is the recommended alternative to pre-loading all relevant data into context [1].
- Structured note-taking to persistent file artifacts outside the context window lets an agent track state and resume without keeping everything in context [1].
- AST-aware structural reading (read a generated code-map first, then read only the needed function via offset/limit) reportedly cut context ~80% on a multi-file debug task (1,892 vs 9,496 lines), implementable today as a ~50-line ast script + a CLAUDE.md instruction + a PreToolUse hook — unverified, vote abstained on rate-limit [4].
- PageIndex builds a hierarchical table-of-contents tree where each node carries explicit start/end coordinates plus a summary, enabling section-addressable retrieval without a full-document read or vector search — unverified, vote abstained on rate-limit [5].
- ReadAgent pairs lossy "gist memory" summaries with on-demand retrieval of the original passages, extends effective context 3.5×–20×, and beats both summary-only and retrieval-only — i.e. lossy summary is safe only when paired with addressable retrieval of the intact original — unverified, vote abstained on rate-limit [6].
- ACON learned context compression cut peak token usage 26–54%, and compressing *irrelevant* context improved agent task success up to 46% by mitigating context distraction — so trimming accumulated context is a quality win, not only a cost win — unverified, vote abstained on rate-limit [7].

## Fix
- Freeze the SessionStart rules injection: keep it byte-for-byte identical across turns and strip interpolated volatiles (current date, active mode, user email, growing comm-log) out of the cached prefix [2].
- Route per-turn dynamic context through a UserPromptSubmit `<system-reminder>` placed after the cached prefix instead of baking it into the rules block [2].
- Give handoff artifacts (spec.md / plan.md / implementation.md) a stable line-indexed TOC header so a subagent reads only its section via offset/limit rather than the whole file [1].
- Keep the original artifact intact and add an index over it — never replace it with a lossy summary [6].
- Bound subagent return size to a distilled summary routed through the team-lead, rather than full dumps [1].
- Roll or archive the communication-log so accumulated context neither grows the prefix nor distracts later agents [7].

## Alternatives
- External compression proxy (headroom-style): rejected — a plugin cannot sit in Claude Code's request path, it overlaps native compaction/persisted-output, and lossy reads can corrupt exact handoff artifacts [no source found].
- Dynamic content at the END of the system prompt (rather than in the user message): weaker than the `<system-reminder>` pattern and one verifier refuted it as a recommended practice — prefer the user-message injection [2].
- Vector-RAG / embeddings over artifacts: heavier than a TOC index and needs an index store; a PageIndex-style TOC tree gives section-addressable retrieval with no embeddings [5].

## Caveat
- The synthesis step and ~17 of 25 verification votes failed on API rate-limiting, so the quantified-savings claims (≈80% structural-read, ReadAgent 3.5–20×, ACON 26–54%, 41–80% cache cost) are single-source and were NOT adversarially confirmed in this run. The cache mechanics, subagent isolation, just-in-time retrieval, and the `<system-reminder>` pattern WERE confirmed 3-0.
- Whether Nexus's current SessionStart injection actually leaks volatiles into the cached prefix is not yet audited — the win depends on it.
- The cache-stability payoff also depends on Claude Code placing plugin `additionalContext` in a cache-eligible position; if the harness already positions it after a breakpoint, the gain is smaller than the raw 42KB suggests.

## Fallback
- If the SessionStart block cannot be fully frozen, segregate it: emit the static rules once and route the unavoidable volatiles via UserPromptSubmit, so only the small dynamic part misses cache.
- If section-addressable reads prove brittle (agents fetch the wrong range), keep full-file reads but enforce the distilled-return contract — the lowest-risk of the three wins.
- If the savings numbers matter to the decision, re-run the failed synthesis/verification (it died on rate-limit, not substance) before committing engineering effort.

## Sources
[1] https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[2] https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything
[3] https://arxiv.org/abs/2601.06007
[4] https://github.com/anthropics/claude-code/issues/34304
[5] https://github.com/VectifyAI/PageIndex
[6] https://read-agent.github.io/
[7] https://arxiv.org/abs/2510.00615
[8] https://platform.claude.com/docs/en/build-with-claude/prompt-caching

## Recommendation
Adopt in order: (1) cache-stable SessionStart injection, (2) section-addressable handoff artifacts, (3) bounded distilled-return contract. Avoid lossy artifact compression and external proxies. Next probe if the question reopens: re-run the rate-limited synthesis/verification to confirm the savings magnitudes, and audit the live SessionStart hook output to confirm whether volatiles (date, mode, email, comm-log) currently sit inside the cached prefix.

---

## Did the SessionStart rules block actually bust the cache in live nexus-heavy projects? (live audit, 2026-06-20)

**Verdict:** No — prompt caching is healthy in both live projects (KG 92.2%, SR 98.1% read/write ratio); the ~21–42K rules prefix is steadily cache-read, not rewritten. #1 (cache-stable injection) is moot — already optimal by construction. The real spend is large whole-file/artifact reads inflating agent contexts to 150–250K, which is #2's target.
**Evidence tier:** ran-it
**As-of:** 2026-06-20
**Validity scope:** the nexus static SessionStart injector + Claude Code incremental prompt caching as observed in KG/SR `token-usage.jsonl` telemetry, 3-day window 2026-06-18→20
**Status:** current
**Reconfirm trigger:** a change to `inject-rules.js` that interpolates a volatile; a Claude Code caching/breakpoint change; or a future run showing `cache_read` collapse turn-over-turn
**Corroboration:** high-stakes; 2 independent projects (KG, SR), ~4,100 telemetry rows, ~60 sessions

## Verdict
Across KG and SR over three days, `cache_read` dwarfs `cache_creation` and the stable cached prefix holds flat (~21,397 tokens) turn-over-turn while large `cache_creation` events coincide with new large content arriving — not with prefix invalidation. The earlier "audit needed" caveat is resolved: there is no cache bust to fix, #1 should be dropped, and the remaining spend is large reads.

## Finding
- KG cache efficiency (read / read+create) over 3 days was 92.2% — 411.6M read vs 34.9M create across 2,775 rows / ~57 sessions [1].
- SR cache efficiency was 98.1% — 213.8M read vs 4.1M create across 1,326 rows [2].
- The stable cached prefix held flat at ~21,397 tokens across mid-session turns; a real bust would show `cache_read` collapsing turn-over-turn, which did not occur [1].
- High `cache_creation` turns coincided with large new content entering context (e.g. an agent at context 252,258 with creation 230,859) — legitimate first-write caching of a big read, not a prefix rewrite [1].
- The lowest-efficiency agent was `nexus:critic` at 59% (13.6M read vs 9.5M create) — a short-lived agent that loads large artifacts whole and reuses little, the clearest section-addressable-read target [1].
- Agent contexts routinely ballooned to 150K–250K tokens, driven by whole-file reads and fat agent contexts rather than the rules block [1].

## Fix
- Drop #1 (cache-stable injection) from the adoption list — the injector is already byte-static and the prefix is cache-read optimally [1].
- Prioritise #2 (section-addressable reads / read-discipline) — the spend is whole-artifact and whole-file reads inflating contexts, exactly what #2 reduces [1].
- Treat `nexus:critic`'s whole-artifact loading as the first concrete #2 case [1].

## Alternatives
- Keep treating #1 as a live candidate: rejected — two independent projects show healthy caching, so the #1 ceiling is the 0 end [1][2].

## Caveat
- Efficiency is a ratio, not a context-size cap; a short-lived read-heavy agent (the critic) shows low efficiency without any bust — the metric flags amortisation, not waste per se. The actionable waste is reading whole files where a section suffices [1].
- The 3-day window covers active feature work; a quieter period would show fewer large reads and higher efficiency [1].

## Fallback
- If a future run shows `cache_read` collapsing turn-over-turn (a true bust), re-open #1 and re-audit `inject-rules.js` for an interpolated volatile [1].

## Sources
[1] d:\src\knowledge-gateway\.claude\audit\token-usage.jsonl
[2] d:\src\sprint-rituals\.claude\audit\token-usage.jsonl

## Recommendation
Adopt #2 first (section-addressable reads + read-discipline); drop #1. Next probe: measure each agent's "fraction of read bytes actually referenced" to size #2's ceiling, starting with `nexus:critic`.

**Why #3 (distilled-return contract) is NOT next / not now:** it is a *different axis* (subagent
return-size, not read-size), **team-mode only** (zero benefit solo), and **estimated, not measured** —
the audit proved #2's read-spend, not #3's return-bloat. Deferred behind #2 to keep slices small and
sequence the audit-proven win first. **Revisit trigger:** after #2 ships and its operator post-measure
runs — if team-lead context still bloats from fat subagent returns, promote #3 to a `docs/proposals/`
proposal (ADR-29) → backlog row. Until then it is an idea, not a queued bet.
