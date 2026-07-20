# claude-code-subagent-resume-model

## When a Claude Code subagent is spawned on a model that differs from its agent file's `model:` frontmatter (per-invocation param, project-level override of a plugin agent, or CLAUDE_CODE_SUBAGENT_MODEL), what model does it run on when resumed via SendMessage — and can the resume fail because of the mismatch?

**Verdict:** Resume never fails on a model mismatch — on Claude Code >= v2.1.211 a per-invocation model override persists across resume, and before v2.1.211 resume silently re-resolved to the definition's frontmatter model (or session model); a project-level `.claude/agents/` override carries its model in its own frontmatter, so that scenario keeps its configured model on resume in all documented versions.
**Evidence tier:** read-docs
**As-of:** 2026-07-20
**Validity scope:** Claude Code CLI docs as published 2026-07-20 (docs annotate behavior through v2.1.212; CHANGELOG latest is v2.1.215); resume-model persistence documented for v2.1.211+; SendMessage-as-resume flow applies to v2.1.77+
**Status:** current
**Reconfirm trigger:** A Claude Code release changes the "Choose a model" or "Resume subagents" sections of the sub-agents doc, or the consuming team reproduces a resume failure/model switch on >= v2.1.211 with version + transcript evidence
**Corroboration:** 8 sources consulted; the resume-model behavior is stated by two agreeing Anthropic-published artifacts (sub-agents docs [1] and CHANGELOG v2.1.211 entry [2] — same vendor, separately maintained documents); no non-Anthropic source addresses resume-time model (a third-party deep-dive on persistent subagents is silent on it [7]); the "resume does not fail on mismatch" negative is additionally supported by an issue showing cross-model resume succeeding [4] and by absence of any matching issue in anthropics/claude-code

## Verdict
The claim as stated is not supported. There is no documented restriction, error, or known bug where resuming a subagent fails because its spawn-time model differs from its agent file's `model:` frontmatter. What did exist was a silent model *switch*: before v2.1.211, resuming dropped a per-invocation `model` parameter and the subagent reverted to its definition's `model` field (or, without one, the main conversation's model); v2.1.211 fixed this so the per-invocation model persists across resume/SendMessage. The project-level-override scenario the team lead describes is the *safest* configuration, because the configured model lives in the overriding definition's own frontmatter — the exact place resume re-resolved to even on pre-fix versions. Project-level override of a plugin agent by same name is a supported, documented mechanism (project scope priority 3 beats plugin scope priority 5).

## Finding
- The documented spawn-time precedence is current: (1) `CLAUDE_CODE_SUBAGENT_MODEL` env var, (2) per-invocation `model` parameter, (3) the definition's `model` frontmatter, (4) the main conversation's model [1]
- Docs state, annotated min-version v2.1.211: "A per-invocation `model` parameter also applies when the subagent is resumed or sent a follow-up message, so the subagent stays on that model" [1]
- Docs state the pre-v2.1.211 behavior was a silent reversion, not a failure: "Before v2.1.211, resuming dropped the per-invocation value and the subagent reverted to its definition's `model` field or, without one, the main conversation's model" [1]
- The CHANGELOG corroborates: v2.1.211 — "Fixed subagents spawned with an explicit model override reverting to the parent's model when resumed or sent a follow-up message" [2]
- No doc section, changelog entry, or anthropics/claude-code issue describes a resume being refused or erroring because the spawn-time model differs from the frontmatter model [no source found]
- In the project-override scenario, the active definition IS the project file (scope priority: managed 1 > `--agents` CLI 2 > `.claude/agents/` 3 > `~/.claude/agents/` 4 > plugin `agents/` 5, with "When multiple subagents share the same name, Claude Code uses the one from the higher-priority location"), so I INFER that even pre-v2.1.211 resume re-resolved to the project override's own frontmatter model, i.e. no model change and no failure in that scenario [1]
- Docs are silent on whether `CLAUDE_CODE_SUBAGENT_MODEL` is re-applied at resume; the resume-persistence note covers only the per-invocation parameter [1]
- Resumed subagents "retain their full conversation history" and resume "starts a new run of the agent under the same ID"; a completed subagent auto-resumes in the background on receiving a SendMessage, and current docs state "SendMessage doesn't require agent teams to be enabled" for this [1]
- Overriding a plugin agent by copying it into `.claude/agents/` is an explicitly sanctioned mechanism: docs say plugin agents ignore `hooks`, `mcpServers`, and `permissionMode` and advise "If you need them, copy the agent file into `.claude/agents/` or `~/.claude/agents/`" [1]
- Plugin agents register under scoped identifiers such as `my-plugin:code-reviewer`, while bare-name resolution also works ("you can pass only the agent name and Claude Code finds it"); docs do not state what happens when the Agent tool is invoked with the plugin-scoped name while a same-named project override exists [no source found]
- No settings.json mechanism for a per-agent model override appears in the sub-agents or plugins reference docs; the documented knobs are frontmatter `model`, the per-invocation parameter, and the global `CLAUDE_CODE_SUBAGENT_MODEL` env var, all filtered against the org `availableModels` allowlist [1][3]
- Documented real causes of "cannot resume" are unrelated to model: the Agent tool's `resume` parameter was removed in v2.1.77 in favor of `SendMessage({to: agentId})` [7]; SendMessage was not injected/callable in some versions despite being documented [6]; SendMessage addressed by agent NAME silently failed for completed agents where the agent ID worked [5]
- Issue #44724 shows a `claude-sonnet-4-6` subagent resumed via SendMessage under a `claude-opus-4-6` orchestrator with resume functioning (the defect was cache cost, not model resolution) [4]
- A separate spawn-time bug report exists where project `.claude/agents/` definitions were not resolvable via the Agent tool at all ("Agent type ... not found"), which could masquerade as an override/resume problem [8]

## Fix
- Tell the team lead the premise is inverted: project-level `.claude/agents/` overrides with `model:` in frontmatter are the most resume-stable configuration, because resume re-resolves to (>= nothing to do) or persisted from (v2.1.211+) that definition [1][2]
- Have the team run `claude --version`; if < v2.1.211 and they pass models via the Agent tool's per-invocation `model` parameter, upgrade to >= v2.1.211 to stop resumes silently reverting the model [2]
- Spawn overridden agents by their bare `name` (matching the project file's frontmatter `name`) rather than the plugin-scoped `plugin:name`, since only same-name higher-priority resolution is documented [1]
- If a resume actually errors, diagnose SendMessage mechanics, not model config: confirm SendMessage is available in that version, address completed agents by agent ID rather than name, and note that user-stopped agents refuse auto-resume until manually resumed [5][6][1]
- Do not rely on `CLAUDE_CODE_SUBAGENT_MODEL` for per-role models across resume: it is global to all subagents and its resume-time behavior is undocumented [1]

## Alternatives
- Per-invocation `model` parameter: works and now persists across resume, but only on >= v2.1.211; on older versions it was precisely the mechanism that reverted on resume [1][2]
- `CLAUDE_CODE_SUBAGENT_MODEL` env var: highest precedence but forces every subagent onto one model, so it cannot express per-role models like a project override can [1]
- Editing the plugin's shipped agent files in place: docs instead direct users to copy the file into `.claude/agents/` or `~/.claude/agents/`, which also unlocks fields plugins ignore [1]
- A settings.json per-agent model map: not documented as existing; the only agent-related setting shown is `agent` (default main-session agent), not a model override [1][3]

## Caveat
Everything here is read-docs, not ran-it: the two agreeing sources on resume-model behavior are both Anthropic-published (docs page and CHANGELOG), and no third-party source reproduces the resume-time model behavior — the one third-party deep-dive on persistent subagents does not cover it. The docs are explicitly silent on two edges: whether `CLAUDE_CODE_SUBAGENT_MODEL` re-applies at resume, and whether spawning by the plugin-scoped name (`plugin:agent`) honors a same-bare-name project override. The team lead's report could be a truthful observation of the pre-v2.1.211 reversion bug (model silently changing on resume, perceived as "cannot resume with our configured model") if they were passing per-invocation model params on an older CLI, or a collision with unrelated resume bugs (SendMessage availability/name-addressing, or project agents not resolving at spawn per issue #59881). The verdict holds for Claude Code v2.1.211–v2.1.215 documentation; older versions have the documented reversion behavior, and pre-v2.1.77 used a removed `resume` parameter entirely.

## Fallback
If the consuming team reproduces an actual resume failure or model switch on >= v2.1.211, the verdict is wrong for their configuration: capture `claude --version`, the exact spawn parameters (scoped vs bare agent name, per-invocation model), and the subagent transcript at `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` (each API request records the model), then search/file an issue on anthropics/claude-code. Until resolved, pin models in the project override's frontmatter and avoid per-invocation model params, since frontmatter is the value resume falls back to in every documented version.

## Sources
[1] https://code.claude.com/docs/en/sub-agents
[2] https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
[3] https://code.claude.com/docs/en/plugins-reference
[4] https://github.com/anthropics/claude-code/issues/44724
[5] https://github.com/anthropics/claude-code/issues/42999
[6] https://github.com/anthropics/claude-code/issues/61248
[7] https://claudefa.st/blog/guide/agents/persistent-subagents
[8] https://github.com/anthropics/claude-code/issues/59881

## Recommendation
Respond to the team lead that project-level agent overrides with `model:` frontmatter are supported and are the resume-safe way to set per-agent models; ask them for their `claude --version` and the exact resume error text, since the only documented model-related resume defect (per-invocation model reverting, fixed v2.1.211) is a silent switch, not a failure. If reopened, the next probe is a ran-it test on their CLI version: spawn the overridden agent, SendMessage it, and diff the `model` field across requests in the subagent's transcript jsonl.
