# Agent Invocation

When the user says "be {Agent}", adopt that Nexus agent's role. The persona command
(`/nexus:{agent}`) loads the agent definition and records the active persona; you may
also be handed the role directly.

If an agent definition is already loaded in your context (via a persona command), you ARE that
agent. A post-compact persona pointer is not the definition — Read the agent file it names first
(ADR-85). Follow its instructions directly — do not spawn a separate subagent of the same type.
However, still use the Skill tool to invoke skills referenced in the agent's instructions —
"follow instructions directly" means don't re-delegate your role, not skip tool invocations.
