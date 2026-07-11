# claude-code-builtin-skill-model-pinning

## Can the model used by a built-in Claude Code skill's spawned agents (e.g. /deep-research's fan-out) be pinned to a specific model without pinning anything else?

**Verdict:** No deterministic, correctly-scoped lever exists — the only enforced mechanisms are either global (`CLAUDE_CODE_SUBAGENT_MODEL` pins ALL subagents) or unavailable (the built-in's frontmatter/body is embedded in the binary and not editable). A standing instruction directing the orchestrating agent to pass `model` per spawn while that skill executes is the only lever scoped to one skill; it steers reliably but is probabilistic, not enforced.
**Evidence tier:** read-docs
**As-of:** 2026-07-11
**Validity scope:** Claude Code v2.1.x (verified against installed v2.1.207) and code.claude.com docs as of 2026-07
**Status:** current
**Reconfirm trigger:** A Claude Code changelog entry adding per-skill or per-workflow model configuration, or a revision to the subagent model-resolution docs
**Corroboration:** high-stakes; 5 sources; a second independent source agreed (docs cross-checked by claude-code-guide agent, plus first-hand binary inspection)

## Verdict
Subagent model choice has exactly three enforced inputs — env var, per-invocation param, agent frontmatter — with the session model as fallback. None of them can be scoped to "one built-in skill only" from the outside. The correctly-scoped lever is an instruction to the orchestrating agent (which authors the per-invocation `model` params); the deterministic lever (`CLAUDE_CODE_SUBAGENT_MODEL`) is global and over-broad.

## Finding
- Subagent model resolution precedence is: `CLAUDE_CODE_SUBAGENT_MODEL` environment variable → per-invocation `model` parameter → the subagent definition's `model` frontmatter → the main conversation's model. [1]
- Workflow `agent()` calls that omit `opts.model` inherit the main-loop (session) model; workflow scripts run in an isolated environment separate from the conversation. [3]
- Skill frontmatter supports a `model:` field ("Model to use when this skill is active", same values as `/model`, or `inherit`) — it applies to the skill itself, not to nested subagents the skill spawns. [2]
- A user- or project-level skill with the same name overrides a bundled skill of that name. [2]
- The deep-research skill ships embedded inside the Claude Code executable (registry entry with name/description/when-to-use present in the v2.1.207 binary; the body is stored compressed and is not extractable as text; no `SKILL.md` for it exists in user-level or project-level skill directories). [4]
- No settings.json key forces a model for a specific skill or workflow. [5]
- CLAUDE.md/rules instructions are not among the documented model-resolution inputs — an instruction can steer the orchestrating agent's per-invocation `model` param but is not platform-enforced. [1]

## Fix
- To pin only one built-in skill's fan-out to a specific model: add a standing instruction at the locus that is always in context where the skill runs (user-level CLAUDE.md for a personal tool), directing the agent to pass `model: "<target>"` on every Agent/`agent()` spawn while executing that skill and to leave model choice free elsewhere. [1]
- Promote to a deterministic gate (a PreToolUse hook denying mis-modeled spawns) only if the instruction demonstrably keeps failing — the allocation-principle ratchet. [no source found]

## Alternatives
- `CLAUDE_CODE_SUBAGENT_MODEL=<model>`: deterministic and enforced, but pins every subagent in every session — over-broad when only one skill should be restricted. [1]
- Shadowing the built-in with a same-named user/project skill carrying `model:` frontmatter: supported for skills in principle, but requires re-authoring the entire harness body since the built-in's body cannot be extracted from the binary, and the shadow drifts as the built-in improves upstream. [2]
- Running the session on the target model: workflow agents inherit the main-loop model when the script omits `model`, so a session already on the target model yields fan-out agents on it unless the harness explicitly overrides per stage. [3]

## Caveat
Whether the built-in deep-research harness hardcodes per-stage model overrides internally is UNCONFIRMED — its body is compressed inside the binary and could not be read. If it does hardcode stage models, an instruction-based pin still wins only if the orchestrating agent honors the user instruction over the skill's stage defaults (user instructions outrank skill guidance, but this is model judgment, not enforcement).

## Fallback
If the instruction-based pin proves unreliable in practice, escalate in order: (a) run deep-research only in sessions whose main model is the target model (inheritance then does the work); (b) accept the global `CLAUDE_CODE_SUBAGENT_MODEL` pin for research-heavy sessions and unset it after; (c) re-research whether a per-skill model config has shipped (see Reconfirm trigger).

## Sources
[1] https://code.claude.com/docs/en/sub-agents
[2] https://code.claude.com/docs/en/skills
[3] https://code.claude.com/docs/en/workflows
[4] Local inspection of the installed Claude Code binary, C:\Users\Laurentiu\.local\share\claude\versions\2.1.207 (2026-07-11): deep-research registry entry embedded; body not extractable; no on-disk SKILL.md in user or project skill dirs
[5] https://code.claude.com/docs/en/settings

## Recommendation
For "restrict skill X to model Y, leave everything else free": write the instruction at the narrowest locus that is always in context where the skill runs (user-level CLAUDE.md for personal built-ins; a plugin rule only if it should ship to all consumers). Do not use the env var unless a global pin is acceptable. Next probe if reopened: check the Claude Code CHANGELOG for per-skill/per-workflow model config.
