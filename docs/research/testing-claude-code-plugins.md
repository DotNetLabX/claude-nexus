# Testing Claude Code Plugins — Research (2026-06-10)

**Question:** how to build automated tests for the nexus plugin — hooks, scripts, agent/skill markdown,
and the behavioral contracts that only exist when an LLM runs them.
**Method:** three parallel OMC document-specialist agents with distinct lenses (official platform /
ecosystem practice / agent evals), web access live. All three stranded their reports behind lifecycle
replies ("Ready when you are." / "Standing by." / "."); findings were recovered from their transcripts —
another live data point for the ADR-17 relay problem.
**Completes:** the web-research leg of the 2026-06-09 audit that ran degraded during the classifier outage.

---

## 1. What the platform provides (official)

| Capability | Verdict | Detail |
|---|---|---|
| `claude plugin validate --strict` | **Manifest/schema linter only** | Checks plugin.json types, agent frontmatter keys (flags `hooks`/`mcpServers`/`permissionMode` in plugin agents), hooks.json schema, marketplace schema/dupes/version-mismatch. Does NOT execute any code, check script existence on disk, or test behavior. |
| Headless CI sessions | **Works** | `claude -p "<scenario>" --plugin-dir . --bare --output-format stream-json --max-turns N --max-budget-usd X`. Assert on the `system/init` event's `plugins`/`plugin_errors`, structured output via `--json-schema`, exit code. `--bare` + `ANTHROPIC_API_KEY` for CI reproducibility. Text assertions are unreliable (live model). |
| Hook stdin/stdout contract | **Fully documented, UNVERSIONED** | Common fields: `session_id, transcript_path, cwd, permission_mode, hook_event_name` (+ `agent_id/agent_type` in subagents). PreToolUse adds `tool_name/tool_input/tool_use_id`; PostToolUse adds `tool_output`; SessionStart adds `source/model`. Exit codes: 0 = read stdout JSON, 2 = block + stderr→Claude, other = non-blocking. PostToolUse and SessionStart cannot block. No `schema_version` field, no stability guarantee — synthetic fixtures may need updates across Claude Code releases. |
| Official test tooling | **`plugin-dev` plugin only** | `anthropics/claude-plugins-official` → plugin-dev skill ships `test-hook.sh` (pipes a test-input.json to a hook, captures exit/stdout), `validate-hook-schema.sh`, `hook-linter.sh`, `validate-agent.sh`. No example inputs, no assertion framework, no CI templates. |
| Agent SDK as test harness | **No mock/replay mode** | The SDK always calls a live model. But: a plugin loaded via the SDK runs its hook shell scripts as real subprocesses (production path), and SDK callback hooks layer on top for observability (tool-call log). `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` isolates plugin agents from built-ins. |

Sources: code.claude.com/docs (plugins-reference, hooks, headless, agent-sdk/overview, agent-sdk/hooks,
plugin-marketplaces); github.com/anthropics/claude-plugins-official (plugin-dev).

## 2. What the ecosystem actually does

**Dominant finding: most Claude Code plugins have NO tests.**

| Repo | Framework | Hook tests | Frontmatter lint | Notes |
|---|---|---|---|---|
| oh-my-claudecode | Vitest | No | No | Best-tested found: lint/integration/perf tests, 6-job CI (typecheck, vitest, build, AST-grep gate, version-sync, npm-pack smoke) |
| anthropics/claude-plugins-official | Bun scripts (CI only) | No | **Yes** | `validate-frontmatter.ts` — agents need name+description, skills description/when_to_use, commands description; YAML pre-processor for glob patterns; diff-scoped (`gh pr diff --diff-filter=AMRC`) |
| SuperClaude | pytest | No | No | Tests the Python installer/CLI, not the markdown assets |
| claude-flow | broken | No | No | CI misconfigured (issue #266) |
| claude-code-hooks-mastery (3k★) | none | runtime-only | No | Session-time validators, no offline tests |
| VoxCore84/claude-code-hook-tester | pure Python | **Yes** | No | The only purpose-built harness: `payloads.json` mocks per event, asserts exit codes/crash/JSON validity/timing. Orphaned — no plugin repo embeds the pattern |
| ohmyzsh (adjacent) | `zsh -n` | n/a | No | 300+ plugins, syntax-check-only CI |

**Three gaps nobody has filled** (nexus would be ahead of the ecosystem on all three):
1. Hook scripts tested via synthetic JSON in the plugin's own CI (pattern proven by VoxCore84, embedded nowhere).
2. Dangling-reference checks (skill names in agent bodies vs `skills/*/` on disk) — no prior art.
3. Generated-file drift checks — nexus already has both (`gen-commands` regen-diff in CI, `gen-omni --check`).

**Adjacent-ecosystem lesson (VS Code extensions, GitHub Actions):** enforce a hard split between the
Node-testable tier (pure logic, fast, deterministic, runs everywhere) and the host-required tier
(slow, costly, spot-checked). Nexus's split: hooks/scripts/markdown-lint vs agent behavior.

## 3. Testing the non-deterministic surface (agent contracts)

**The lint-vs-eval line:** lint proves the contract *text* exists and is consistent; only an eval proves
the LLM *honors* it. Example: lint catches `REJECT` missing from critic.md; only an eval catches the
critic always hedging instead of using it.

- **Best-fit framework: promptfoo** — native `anthropic:claude-agent-sdk` provider (drives the plugin
  directly), `trajectory:*` assertions check the tool-call trace deterministically at zero judge cost
  (`trajectory:tool-used {pattern: "Write", max: 0}` = "critic never writes a file"), `llm-rubric` for
  soft contracts, `--repeat 5` + `threshold: 0.8` for N-of-M flakiness handling, 14-day disk cache,
  GitHub Action with merge blocking. (MIT; acquired by OpenAI 2026-03, still open source.)
- **Anthropic guidance:** prefer code-based grading by *designing for it* (fixed verdict location enables
  a `contains` check); judges reason-then-score; regression suites run ~98–100%, capability evals
  graduate into them; build scenarios from REAL failures, not invented ones; `pass^k` for safety-critical
  consistency.
- **Judge hygiene:** pointwise (not pairwise) judging avoids position bias; haiku-class judge at temp 0
  suffices for well-specified structural rubrics; consider a non-Anthropic judge only for conversational-
  quality rubrics (self-preference bias); always give the rubric an ambiguity escape hatch (score 0.5 + reason).
- **Cost reality (haiku for run + judge):** ~$0.15 per PR-triggered eval (5 scenarios × 5 repeats),
  $0.30–1.00 nightly full suite, realistic $5–18/month. `--max-budget-usd` per run as a hard stop.

**The 5 highest-risk nexus contracts to eval first** (violations silently corrupt the pipeline):
1. Critic never writes a file (trajectory, deterministic).
2. Critic verdict ∈ {REJECT, REVISE, ACCEPT} (contains-any, deterministic).
3. Developer Phase 1 produces no file edits (trajectory, deterministic).
4. Reviewer engages with `## Carry-Over Findings` when present (llm-rubric).
5. Team-lead routes a REJECT verdict correctly (llm-rubric).

## 4. Recommended nexus test strategy (four tiers)

| Tier | What | Cost | Cadence | Build effort |
|---|---|---|---|---|
| **T1 Structural lint** | Frontmatter schema (port Anthropic's validate-frontmatter pattern incl. the YAML glob pre-processor); `skills:` references resolve to shipped skills; dangling `*-format` refs; convergence lint (verdict vocabulary in critic+team-lead+po; `## Carry-Over Findings` in producer+consumer); CHANGELOG-top == plugin.json version; no `${CLAUDE_PLUGIN_ROOT}` in md bodies | $0, ms | every commit | hours |
| **T2 Unit tests (`node --test`)** | Hooks: spawn each script with synthetic event JSON (per §1 schemas), assert exit code / stdout JSON / registry side-effects — guard rm+secret matrices, gate invariants, persona Write|Edit payloads, audit-logger off ⇒ zero side effects. Scripts: bump classifier tier table, gen-commands fixture, gen-omni write→check round-trip | $0, sec | every commit | 1–2 days |
| **T3 Deterministic evals** | promptfoo + claude-agent-sdk provider: contracts 1–3 above via trajectory/contains assertions, haiku runs, `--max-budget-usd` | ~$0.05–0.15/run | PR touching agents/skills | 1 day |
| **T4 Judge evals** | Contracts 4–5 via llm-rubric (haiku judge, temp 0, 5-repeat, 0.8 threshold) | adds ~$0.05/run | PR on agents + nightly | 1 day |

Build order: T1 → T2 ship together (pure dev-repo machinery, no bump); T3/T4 as a follow-up once
CI auth (`ANTHROPIC_API_KEY` secret) is decided. Grow T3/T4 scenarios from real failures only.

**Process rule worth adopting (TDAD):** when editing an agent contract, write/extend the failing
T1 lint or T3/T4 scenario FIRST — the test is the contract, the `.md` is the compiled artifact.

## 5. Caveats

- Hook stdin schema is unversioned — pin fixtures to a Claude Code version and re-verify on platform releases.
- T3/T4 run a live model: never assert exact text; assert structure, vocabulary, and trajectories.
- Eval scenarios invented from speculation rot; scenarios from real regressions (e.g. this repo's audit
  findings D1/C6/R1) stay meaningful.

## Sources (consolidated)

Platform: code.claude.com/docs — plugins-reference, hooks, headless, sub-agents, agent-sdk/overview,
agent-sdk/hooks, plugin-marketplaces; docs.anthropic.com hooks; github.com/anthropics/claude-plugins-official
(plugin-dev, validate-frontmatter.ts, validate-plugins.yml); github.com/anthropics/claude-agent-sdk-demos.
Ecosystem: github.com/Yeachan-Heo/oh-my-claudecode (ci.yml); SuperClaude-Org/SuperClaude_Framework;
ruvnet/claude-flow#266; disler/claude-code-hooks-mastery; VoxCore84/claude-code-hook-tester;
hesreallyhim/awesome-claude-code; ohmyzsh; code.visualstudio.com extension testing; cardinalby (JS actions testing).
Evals: promptfoo.dev (expected-outputs, model-graded, deterministic, evaluate-coding-agents,
promptfoo-action); anthropic.com/engineering/demystifying-evals-for-ai-agents; anthropics/anthropic-cookbook
building_evals.ipynb; docs.anthropic.com develop-tests; alignment.anthropic.com Bloom; arXiv:2603.02601
(AgentAssay N-of-M), 2603.08806 (TDAD), 2604.06996 (self-preference), 2602.02219 (position bias);
deepeval.com; braintrust.dev; kinde.com CI/CD evals.
