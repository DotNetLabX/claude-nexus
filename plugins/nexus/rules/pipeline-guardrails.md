# Pipeline Guardrails

- **No Opus for general-purpose / Explore agents** — always set `model: "sonnet"`. General-purpose agents do research and summarization, not deep reasoning.

  ```
  Agent({
    subagent_type: "general-purpose",
    model: "sonnet",   // REQUIRED
    ...
  })

  Agent({
    subagent_type: "Explore",
    model: "sonnet",   // REQUIRED
    ...
  })
  ```

  **Exception — deep research runs on fable.** Research dives get the strongest model, not sonnet:
  the `research` skill's forked web researcher, and every agent spawned while executing the built-in
  `/deep-research` harness (Agent-tool or workflow `agent()` spawns alike), set `model: "fable"`.
  This is the only exception — it does not extend to code-discovery Explore dives or any other
  general-purpose spawn.

- **Never override specialized agent models** — specialized agents (architect, developer, reviewer, etc.) have their model baked into their definition frontmatter. Never pass a `model` parameter that overrides it.
- **Nexus agents own the pipeline** — for feature pipeline roles (architect, developer, reviewer), always use the Nexus pipeline agents. Don't substitute generic or third-party agents for pipeline roles.
- **Third-party specialist agents are fine for standalone tasks** outside the pipeline (e.g. a dedicated debugger, security reviewer, or designer) — just not as replacements for the pipeline roles themselves.

## Output Size Constraint

Explore and general-purpose agents return a structured report under 300 words. Write detailed findings to disk (e.g., a notes file or questions.md); the message is a summary. Never return raw file dumps or full grep output as the agent response — summarize findings and cite file paths.
