# claude-code-skill-context-fork

## Does Claude Code support `context: fork` on a skill to isolate it in a subagent?

**Verdict:** Yes — `context: fork` is a documented Claude Code skill frontmatter field that runs the skill's body in a fresh subagent with its own isolated context window, separate from the caller's conversation history. The companion field is `agent:` (optional; selects the subagent type).
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** Current Claude Code skills documentation at code.claude.com/docs/en/skills and Claude Code v2.1.x+
**Status:** superseded
**Reconfirm trigger:** A revision to the Claude Code skills frontmatter docs, or a Claude Code release changelog entry that changes or removes `context: fork` behavior
**Corroboration:** high-stakes; 4 sources; a second independent source (GitHub issues #17283, #16803, #49559 with repros) agreed the field exists and describes the same isolation semantics — but also documented persistent reliability bugs where the isolation does not actually fire
**Superseded by:** the 2026-06-15-revalidated entry below (Step-7 stale-path demonstration — reconfirm trigger treated as fired)

## Verdict
`context: fork` exists and is documented. When set, the skill body becomes the task prompt sent to a new subagent with its own fresh context window. That subagent has no access to the caller's conversation history. The `agent:` field optionally selects the subagent type (built-in: `Explore`, `Plan`, `general-purpose`; or any custom subagent from `.claude/agents/`); it defaults to `general-purpose` if omitted. However, multiple open and recently-closed GitHub issues document that the feature has had persistent reliability failures where skills fall back to running inline rather than forking — one of which (issue #49559) was closed as "not planned" / stale without a fix.

## Finding
- The official Claude Code skills docs include `context` in the frontmatter reference table with the description "Set to fork to run in a forked subagent context" and `agent` with description "Which subagent type to use when context: fork is set." [1]
- The "Run skills in a subagent" section of the same docs states explicitly: "The skill content becomes the prompt that drives the subagent. It won't have access to your conversation history." This is the documented isolation guarantee. [1]
- The docs provide a four-step execution model: (1) a new isolated context is created; (2) the subagent receives the skill content as its prompt; (3) the agent field determines execution environment (model, tools, permissions); (4) results are summarized and returned to the main conversation. [1]
- The built-in Explore and Plan agents additionally skip CLAUDE.md and git status at startup to keep their context small — a forked skill using agent: Explore therefore sees only the SKILL.md content and the agent's own system prompt, providing stronger isolation than general-purpose. [1]
- The official docs show a concrete example with both fields used together: context: fork plus agent: Explore in a pr-summary skill. [1]
- The context field is a Claude Code extension and is NOT part of the Agent Skills open standard specification. The spec's frontmatter table lists only name, description, license, compatibility, metadata, and allowed-tools. Agents other than Claude Code will silently ignore context: fork. [2]
- The feature was introduced in Claude Code v2.1.0 per the CHANGELOG referenced in GitHub issue #16803: "Added support for running skills and slash commands in a forked sub-agent context using context: fork in skill frontmatter." [3]
- GitHub issues #17283, #16803, and #49559 independently report that context: fork has been unreliable in practice — skills run inline in the main conversation instead of spawning a forked subagent, across both agent: Explore and agent: general-purpose, and persisting across cache clears and restarts. [3]
- Issue #49559 (filed against v2.1.112) was closed as "not planned" and labeled stale with no Anthropic staff response visible. [5]
- The documented workaround for the reliability failure is to add explicit instructions inside the skill body telling Claude to use the Task tool to launch the subagent — which forces the model to dispatch manually rather than relying on the declarative context: fork contract. [5]

## Fix
- If you need context isolation with high reliability today (June 2026), do not depend solely on context: fork as the isolation mechanism — given documented bug reports and a "not planned" closure, the declarative fork may silently fall back to inline execution. [3]
- For guaranteed isolation, use the explicit Task tool dispatch pattern inside the skill body (the documented workaround), or structure the work as a standalone subagent and invoke it directly rather than wrapping it in a context: fork skill. [5]
- context: fork remains worth including in the frontmatter as the declarative intent, since when it does fire it provides the correct isolation semantics (fresh context, no conversation history). Pair it with explicit instructions as a belt-and-suspenders approach. [1]
- The agent: companion field should always be set explicitly when using context: fork — without it the default is general-purpose which loads CLAUDE.md and git status, giving weaker isolation than agent: Explore or agent: Plan. [1]

## Alternatives
- Standalone subagent: define the work as a custom subagent file rather than a skill with context: fork. Subagents have their own system prompt and are invoked via the Task tool, which is more reliable than the declarative fork. Loses the convenience but avoids the reliability gap. [1]
- Imperative Task tool call in skill body: write explicit "use the Task tool to launch a subagent" instructions inside the skill body. This is the official workaround, confirmed effective, but verbose and breaks the declarative design contract of context: fork. [5]
- disable-model-invocation: true is not an alternative for isolation — it controls who can invoke the skill but does not isolate context; the skill still runs inline. [1]

## Caveat
The isolation guarantee ("won't have access to your conversation history") is the stated design intent per the official docs, but the GitHub issue evidence shows this guarantee has not been reliably delivered in practice as of v2.1.112 (April 2026). Whether a particular version of Claude Code correctly forks depends on the exact Claude Code release. Installations running versions prior to v2.1.0 do not have the field at all. The field is also Claude Code-specific — any other Agent Skills-compatible tool will ignore it.

## Fallback
If testing reveals that context: fork is not forking (verifiable by checking session .jsonl transcripts for the absence of subagent_type entries): (a) add explicit Task-tool dispatch instructions to the skill body as the immediate workaround; (b) watch the Claude Code changelog for a fix commit; (c) file or upvote the relevant GitHub issue to signal demand. If Anthropic closes further reports as "not planned," treat context: fork as aspirational metadata only and build all isolation via explicit subagent patterns.

## Sources
[1] https://code.claude.com/docs/en/skills
[2] https://agentskills.io/specification
[3] https://github.com/anthropics/claude-code/issues/16803
[4] https://github.com/anthropics/claude-code/issues/17283
[5] https://github.com/anthropics/claude-code/issues/49559

## Recommendation
Include context: fork plus agent: Explore (or the appropriate agent type) in the frontmatter as documented, but also add an explicit "use the Task tool to dispatch this as a subagent" instruction line in the skill body as a belt-and-suspenders guard against the known inline-fallback bug. Verify isolation in your actual Claude Code version by checking session transcripts for subagent_type entries after invoking the skill. Next probe if the question reopens: check the Claude Code CHANGELOG for any entry after v2.1.112 that mentions a context: fork fix or removal, and search the claude-code issue tracker for newer reports.

---

## Does Claude Code support `context: fork` on a skill to isolate it in a subagent? (revalidated 2026-06-15)

**Verdict:** Yes — re-research confirms the original verdict: `context: fork` runs the skill body in a fresh isolated subagent context, with `agent:` as the optional subagent-type selector; the documented inline-fallback reliability caveat still stands.
**Evidence tier:** read-docs
**As-of:** 2026-06-15
**Validity scope:** Current Claude Code skills documentation at code.claude.com/docs/en/skills and Claude Code v2.1.x+
**Status:** current
**Reconfirm trigger:** A revision to the Claude Code skills frontmatter docs, or a Claude Code release changelog entry that changes or removes `context: fork` behavior
**Corroboration:** high-stakes; 2 sources; a second independent source agreed the field exists with the same isolation semantics and the same reliability caveat

## Verdict
Re-research after the reconfirm trigger was treated as fired returns the same answer: `context: fork` isolates a skill in a fresh subagent context (no caller conversation history), `agent:` selects the subagent type, and the inline-fallback reliability bug remains the standing caveat.

## Finding
- The official Claude Code skills docs still list `context` (set to fork for a forked subagent context) and `agent` (the subagent type) in the frontmatter reference, with the isolation guarantee "won't have access to your conversation history." [1]
- The reliability caveat is unchanged: multiple GitHub issues report inline fallback rather than forking, one closed as "not planned." [2]

## Fix
- Treat the original recommendation as still in force: declare context: fork plus an explicit agent:, and guard with an imperative Task/Agent dispatch instruction in the skill body. [1]

## Alternatives
- Imperative Agent/Task-tool spawn in the skill body remains the more reliable isolation mechanism than the declarative field. [2]

## Caveat
This revalidation is a Step-7 stale-path demonstration (the reconfirm trigger was treated as fired to exercise re-research + supersede); the underlying facts did not change between the original and revalidated entries.

## Fallback
If a future Claude Code release changes context: fork behavior, re-research again and supersede this entry in turn.

## Sources
[1] https://code.claude.com/docs/en/skills
[2] https://github.com/anthropics/claude-code/issues/49559

## Recommendation
Keep the original recommendation. Next probe: watch the Claude Code CHANGELOG for any context: fork fix after v2.1.112.
