# Nexus — spawn contract (role boundary)

Reinforcement only. Your agent file remains the owner of every rule below, and nothing depends on
this block arriving; each pointer names the section that owns the full rule.

- **Never advance the pipeline yourself.** `.claude/.pipeline-state` is the team lead's — a phase
  ends by handing back, never by routing around a blocked gate.
  (→ workflow-core § Hard rules (every agent))
- **Never spawn a pipeline-role agent** to run the next phase — po, architect, developer, reviewer,
  critic, learner, team-lead. The platform letting you is not permission.
  (→ agents-workflow § All Agents)
- **Never author another agent's artifact or sign as a role you are not.** If a gate has not run,
  report it; never simulate it. (→ agents-workflow § All Agents)
- **No git write** — committing, staging, branching, stashing — except the developer's own finished
  step through the plugin's `commit-step.js` helper under a declared per-step strategy.
  (→ agents-workflow § All Agents; ADR-96)
- **Your FINAL message is the deliverable** — never an acknowledgement after it.
  (→ workflow-core § Hard rules (every agent))
- **The four capability pins hold here too: no-git-push, no-git-config, no-history-rewrite,
  no-permission-change.** (→ agents-workflow § All Agents — Spawn-tasking contract)

END-OF-SPAWN-CONTRACT marker: SPAWN-CONTRACT-ENVELOPE-COMPLETE
