# F7 Stage-0 spike report — S0a seal test, S0b delivery mechanism, skill-shadowing rider

**Status:** Spike complete — architect (Fable 5), 2026-07-17. S0a and the rider are settled with
tested/cited facts. **S0b owner-confirmed 2026-07-18: option (d)** — extracted as **ADR-62**
(`docs/architecture/README.md`); the shared F7-S1/F8-W1 delivery mechanism is decided.
**Method:** one live Workflow experiment (run `wf_a4c73461-66b`, two probe legs) + a platform-docs
research pass (claude-code-guide agent, answers cited to `code.claude.com/docs`), adjudicated from
raw outputs. Fixtures authored by a dispatched subagent (architect writes no source).

## S0a — clean-room seal test

**Question** (tech-spec:25-28; `mine-family-next-wave-2026-07.md:282`): does a read-restricted
`agentType` actually deny file reads under Workflow?

**Evidence:**

- **Leg B — registered restricted type (`Explore`) under Workflow.** Write and Edit were
  **mechanically absent**, not advisory: "No Write tool exists in my toolset … no tool call was
  possible". The ToolSearch escape hatch is **closed**: `select:Write` returned verbatim
  "No matching deferred tools found" — a restricted agent cannot re-acquire an excluded tool via
  deferred-tool loading. Read (in-allowlist) succeeded normally.
- **Leg A — custom `spike-sealed-reader` (`tools: Write`).** Dispatch failed:
  "agent type 'spike-sealed-reader' not found". Root cause verified: `.claude/agents/` did not
  exist at session start (created 2026-07-17 20:36 by the fixture; this session is older) — the
  documented behavior: "a running session doesn't detect a newly created `agents` directory"
  (sub-agents doc). Not a refutation of enforcement; a registration-timing fact.
- **Docs:** the `tools:` frontmatter field is an allowlist the harness enforces — restricted tools
  are absent from the agent's toolset (https://code.claude.com/docs/en/sub-agents.md).
- **No path-scoped denial exists:** permission deny rules are tool-level; no documented mechanism
  denies a subagent Read of *specific paths* while allowing others
  (https://code.claude.com/docs/en/permissions.md; guide verdict: undocumented).

**Verdict (tested facts):**

1. **Tool-level restriction IS mechanical under Workflow** — including the ToolSearch hatch being
   closed. Confidence: **HIGH** (docs + direct observation in this session).
2. **The clean-room seal still cannot ride it.** The seal needs *path-scoped* read denial — miners
   MUST read the code they mine while NOT reading registries/prior consolidations — and only
   whole-tool denial exists. Excluding Read also requires excluding Grep/Glob/Bash/PowerShell
   (a shell `cat` reopens reads; Explore's own "Bash (read-only use only)" qualifier is prompt-tier),
   which would blind the miner entirely. Confidence: **HIGH**.
3. **S1 isolation posture: the disclosed prompt-tier seal stands** (F6 R5 disclosure discipline).
   The "pending upstream platform support" limbo is over — replaced by a tested fact, exactly what
   the spike promised. Future lever (out of S1 scope, speculative **MEDIUM**): a `PreToolUse` hook
   inspecting Read paths; subagent applicability undocumented.
4. Remaining leg: the custom-type leg now completes for free in any NEXT session
   (`.claude/agents/` pre-exists → the fixture registers). One-minute check at S1 build kickoff.

## S0b — delivery mechanism for shipped executables (RECOMMENDATION — pending owner confirmation)

The spike surfaced a **fourth option** the F6-era analysis missed, and it dominates:

| Option | Mechanism | Reversibility (ADR-25) | Verdict |
|--------|-----------|------------------------|---------|
| (a) ADR-5 read-index copy | consumer vendors scripts like conventions | Reversible; copy-drift risk (hash header mitigates) | Fallback for consumer-CI only |
| (b) kickoff-generated from verbatim skill blocks | model transcribes at kickoff, hash-stamped | Reversible, but transcription is the exact failure mode M1 exists to kill; 235 lines re-transcribed per consumer | Reject |
| (c) versioned package | npm-style install declared by adapter contract | Near one-way — removal breaks consumers; publish infra owed | Reject (bar not met when (d) is zero-footprint) |
| **(d) invoke-in-place from the plugin cache** | executables ship **inside the skill directory**, ride the version-keyed cache; sessions run `node <skill-base-dir>/…` via the harness's **"Base directory for this skill:"** announcement | **Most reversible of all** — zero consumer-repo footprint; version-true by construction (cache path embeds the plugin version) | **RECOMMEND (primary)** |

**Grounding for (d):**
- Observed **live in this session**: the harness announced the plugin-cache base directory for an
  invoked plugin skill (`…\plugins\cache\claude-nexus\nexus\1.34.8\skills\proposal-format`).
- The bundled-scripts pattern is documented for plugins
  (https://code.claude.com/docs/en/plugins-reference.md).
- The shipped artifact is ideal for it: `harness/lib/cover-gates.mjs` is **235 lines, zero
  imports** — a self-contained node script.
- **Why F6 deferred and why that reason no longer binds:** platform constraint #2 (no
  `${CLAUDE_PLUGIN_ROOT}` expansion in skill markdown) blocked the *template-variable* path. The
  base-dir **runtime announcement** sidesteps the variable entirely — no expansion needed.
- Research note: the guide pass returned a *conflicting* signal on whether `${CLAUDE_PLUGIN_ROOT}`
  (and a newer `${CLAUDE_SKILL_DIR}`) now also expands in skill/agent content — the docs may have
  moved since the repo's June-2026 verification. A one-line probe at S1 build settles it;
  **(d) does not depend on the answer** (it would only strengthen the recipe).

**Confidence labels:** mechanism works today — **HIGH** (first-party observation + docs);
long-term stability of the announcement line — **MEDIUM** (harness-rendered convention, not a
formal API). Mitigation: S1 records the invocation recipe in exactly one shipped place
(family-core), so a platform change is a one-file fix; probe `${CLAUDE_SKILL_DIR}` at build.

**Scope:** one decision for **F7-S1 and F8-W1** (the probe runner ships the same way, under
`plugins/nexus-analytics/skills/mine-semantic-model/tools/`). **Consumer-CI fallback (a):** a repo
that wants the gates in its own CI (runners have no plugin cache) vendors a **hash-stamped copy**
listed by the read-index; drift is visible as a hash mismatch against the plugin's canonical file.
Documented, never the default.

**Held ADR draft** (extracted at ship per ADR-28; title only until owner confirms): *"Shipped
executables ride the skill bundle and run in place from the version-keyed plugin cache; vendored
hash-stamped copies only for consumer CI."*

## Rider — does a project-local skill shadow a same-name plugin skill? (F8 critic L3) — ANSWERED

**Yes — with a namespace escape.** Docs: skills sharing a name resolve enterprise → personal →
project; **"Plugin skills use a `plugin-name:skill-name` namespace, so they cannot conflict with
other levels"** (https://code.claude.com/docs/en/skills.md). So in KG, a bare
`/mine-semantic-model` runs the **project-local F52 skill**; the plugin's is always addressable
explicitly as `nexus-analytics:mine-semantic-model`. Confidence: **HIGH** (docs quote).

**Consequence for the running W2a session (F8 spec, W2a skill-resolution clause):** the "run-#2
evidence" claim attaches only if the *plugin* skill executed — which now provably requires the
**namespaced invocation**. Surfaced to the operator with a paste-able correction line.

## Fixture disposition & incidentals

- `.claude/agents/spike-sealed-reader.md` — **kept deliberately** (untracked, outside `plugins/`,
  no bump impact): it registers in any next session and completes the custom-type leg at S1
  kickoff. Delete after that check.
- Canary + probe files live in the session scratchpad — no action.
- Incidental: even with legitimate Read access, the Leg-B agent declined to echo the canary's
  DO-NOT-LEAK token — model-tier discretion. Recorded as color; it is not enforcement and changes
  no verdict.
