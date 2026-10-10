# Nexus — always-on prohibitions

Stop-signs, carried every session. Each line is the whole rule you need in the
moment; the procedures live on demand — the pointer names the owning section, and the kernel's
Read-Index resolves the path.

- **Never self-elect a worktree or an isolation mode.** Electing a tree is an attended ask; the
  Agent tool exposing an `isolation` parameter is not authorization, and unattended auto-branches.
  (→ agents-workflow.md § Branch Pre-Flight & Default-Branch Resolution — the matrix, Worktree duties)
- **An approval is scoped to the facts you presented when you asked.** A fact found wrong — the
  size, the current behavior, what already shipped — re-opens it: stop and re-present, standing yes
  or not. (→ agents-workflow § All Agents; `prohibition-gate.js` refuses a file edit outside the stamped `.claude/.approval-scope` set)
- **Never poll another agent's output file to infer its progress.** A 0-byte `output_file` is the
  normal case, not a hang; wait on a real completion signal. (→ agents-workflow § All Agents)
- **Never let a spawned subagent make a git write — except a step commit through the plugin's
  `commit-step.js` helper under a declared `per-step` strategy.** Committing, staging, branching and
  stashing are otherwise the coordinating session's own act at close — pin it in the dispatch, then
  do it yourself. (→ agents-workflow § All Agents; the boundary detector logs the breach)
- **Never override a specialized agent's model** outside the four sanctioned channels: the
  config ladder (per-agent and per-job entries), an explicit owner-directed spawn parameter, the
  reader-pair list, and the second reader (its job's model, additive).
  Any other `model:` on a pipeline agent is the ad-hoc override this forbids.
  (→ pipeline-guardrails.md § Agent model overrides and pairing)
- **Never ask the owner, or end a turn waiting on them while other work remains, once they say a
  run is unattended — in words, or the `[UNATTENDED]` marker.** Write `on` to `.owner-away` in the
  scratchpad (it arms the refusal of the question box); take the entry's away answer or a defensible
  recommendation and list it; leave one-way actions undone; only the part that truly needs the owner
  waits; show the list at the end. Building on an unresolved point in silence is still a defect —
  this is how every stop-and-ask rule is met in such a run.
  (→ agents-workflow.md § Owner-away runs)
- **Never end a main-session turn on background work, or on a need for the owner, without saying
  which.** Its last line before the footer is one of two:
  `Not stopped — waiting for {what is running}; I continue when it finishes. Nothing is needed from you.`
  or `Stopped — needs you: {what}.` (→ agents-workflow § All Agents)
- **Never offer or name a paid part unasked.** When the user asks by name for brainstorm mode, a
  panel, a research dive or the research library, the conventions review, skill evaluation,
  slow-test tagging, the token report or the usage record, and that skill is not in your skill
  list, say in **one line** that it comes with the nexus-pro plugin and that access is asked
  through the DotNetLabX organisation on GitHub; then carry on with what the core does and say
  nothing more about the plugin. A request for the live agent view gets "not available in this
  version" and no plugin name.

END-OF-PROHIBITIONS marker: PROHIBITIONS-ENVELOPE-COMPLETE
