# Pipeline Guardrails

> Read when: spawning any agent — choosing a subagent model or type, applying the cross-model pairing doctrine, or a third-party/specialist agent taking a pipeline role.

## Helper agents — model and type

- **Every helper job runs on its job's model — a per-repo setting.** A helper job is a spawn the
  pipeline makes on its own behalf: an `Explore` or `general-purpose` helper, the round-1 second
  reader, the done check. Its model is, in order: an **explicit
  owner-directed spawn parameter**; the repo's entry for that job in the `jobs` block of
  `.claude/nexus-agents.json`; the **unset value** in the table below, which is what the site ran on
  before the setting existed. The spawning agent reads the file when it spawns the job — at most once
  per round for a round-shaped agent, once per invocation otherwise (the team lead captures `jobs` in
  its one pre-flight read). Every site that spawns a job names the job and its unset value and points
  here. The `sonnet` defaults stand because these helpers research and summarize; they do not reason
  deeply.

| Job | Covers | When unset |
|---|---|---|
| `discovery` | helpers that locate or sketch — codebase discovery dives, options-panel sketches, the learner's scan | `sonnet` |
| `audit` | `general-purpose` helpers that review or verify — substitute review passes, finder passes, the registry verifier, the reviewer's fan-out helpers | `sonnet` |
| `secondReader` | the round-1 second reader at the critic and reviewer seats | Sonnet, or Opus beside a Sonnet primary (→ agents-workflow.md § Critic rounds) |
| `doneCheck` | the Step-1 done check and its re-checks, each a fresh architect spawn, or a read-only Codex job where the value is `codex` | the architect's resolved model — its per-agent entry, else its frontmatter |

  The same block carries three miner keys — `minerGenerator`, `minerJudge` and `minerMechanical` —
  which are authored in the miner's own doctrine (`mine-family-core.md` § Kickoff checklist, in the
  `nexus-miner` plugin), not here. A skill of another installed plugin may declare a job of its own
  in the same block: its row, its unset value and the rule for its value are authored in that skill,
  which points here for how a job's model is read.

  ```json
  {
    "jobs": { "doneCheck": "sonnet" },
    "codex": { "timeLimitMinutes": 25, "effort": "xhigh" }
  }
  ```

  **Values, and a value that cannot be used.** A value is a Claude model family — `fable`, `opus`,
  `sonnet` or `haiku` — matched ignoring case and surrounding spaces. Every job in the table takes a
  string. `codex` is a value at `doneCheck` alone, used where it is the effective value — an explicit
  owner-directed spawn parameter still outranks it (→ codex-dispatch.md § Done check); at any other
  job it is read as unset, with the disclosure line below. A value that cannot be used is read as unset, with one disclosure line in the spawning
  turn naming the job, the value and the value taken — never a halt: an unknown family, a job name
  no table declares, `haiku` at `secondReader` or `doneCheck` (`haiku` is never a checker). One job
  exists to add a family, so a setting that would lose it is read as unset too: a `secondReader`
  naming the main reader's family. A repo-set `fable` second reader is the repo's approval for an
  attended run; an `[UNATTENDED]` run reads it as unset. The second reader resolves by a longer
  order, with the feature's picked pair first (→ agents-workflow.md § Critic rounds). The config
  advisory (`config-advisor.js`) reports, when the file is edited, the unusable values the file alone
  shows; the ones that depend on the run — a `secondReader` in the primary's family, a `fable`
  second reader in an `[UNATTENDED]` run — surface only at the spawn's disclosure line.

  **`codex` — one setting for every Codex job.** `codex.timeLimitMinutes` is a positive number, the
  total time a Codex job may run from its start (unset: 25); a review job with other readers in its
  round runs until the later of that and the last of them finishing (→ codex-dispatch.md § Time limit and fallback).
  `codex.effort` is the effort a Codex
  dispatch may send, one of `none`, `minimal`, `low`, `medium`, `high`, `xhigh` (unset: none is sent,
  and the user's own Codex config decides). Every Codex job reads it, through the Codex job helper
  (→ codex-dispatch.md § Time limit and fallback).

- **Read-only helpers that locate or sketch default to `Explore`** (the `discovery` job — discovery
  reads, options-panel sketches) — its charter excludes Edit/Write/NotebookEdit, so a stray write is
  structurally impossible rather than merely forbidden in prose. Use `general-purpose` only when the
  helper must **write its deliverable**, must **audit or verify** (the `audit` job — `Explore`
  locates code, it doesn't review it), or needs a tool `Explore` lacks. This is a `subagent_type` rule — it composes with the job's model above, it does not replace
  it.
## Agent model overrides and pairing

- **Never override specialized agent models — outside four sanctioned channels, a gear riding the first** — specialized
  agents (architect, developer, reviewer, etc.) have their model baked into their definition
  frontmatter, and the prohibition on ad-hoc overrides stands. The four channels that may override
  it: the **`.claude/nexus-agents.json` ladder — per-agent and per-job entries, then the repo's
  gear** — read at pre-flight by the team lead and at a job's spawn by the agent that spawns it (a
  done check on its `doneCheck` model is this channel, not an ad-hoc override). A spawned po,
  architect, developer or team lead takes its model and effort from `gear.js value --setting 8|9
  --role {agent}` (→ agents-workflow.md § Gears), whose order is the helper's; a main-session persona runs on the session model, outside the gear; an
  **explicit owner-directed spawn parameter**; the **reader-pair list**, applied by the pairing
  check (the bullet below — always on, at checker seats only, where it picks the main reader with or
  without a collision); and the **second reader** (→ agents-workflow.md § Critic rounds),
  spawned on its job's model (`secondReader` in the table above) as additive coverage. Any other `model`
  parameter that overrides an agent's frontmatter is the
  ad-hoc override this rule forbids. Editing `.claude/nexus-agents.json` runs a config-time advisory
  (`config-advisor.js`) that reports a producer/checker family collision; the setting always
  stands — the reader-pair list applies at spawn.
- **Cross-model pairing — always on (ADR-93).** The verifier/critic/judge of any
  judgment artifact runs on a **different model** than its producer — allowed pairs are
  Fable-Opus, Opus-Sonnet, Fable-Sonnet. There is no switch to turn it on: the master switch was
  removed, so a config still setting one changes nothing. Deterministic instruments are model-free
  and satisfy no pairing — the judgment layer over them is what pairs.
  Pairing applies to the **primary** checker only; the second reader is additive coverage
  and may share the producer's family.
  **Placement (the ruled precedence):**
  absent an explicit owner direction, the independent check sits **with the strongest producer**,
  and the top model goes where its output is most mechanically checkable — never in a seat whose
  output only a stronger judge could audit; an explicit owner direction (e.g. "Fable generates,
  Opus verifies") wins over all defaults. **Reconciliation:** the doctrine governs dispatches where
  the caller sets `model:` (campaign/stage spawns), and — since nexus 1.65.0 — it also reaches
  the pipeline's **checker** seats (spec→critic, plan→critic, implementation→reviewer,
  promotion→critic) through that mechanism and no other. **Producer seats, non-checker spawns, and
  everything else keep the rule above**: the reader-pair list reaches checker seats only — there it
  picks the main reader whether or not a collision occurred. At the critic and reviewer seats a
  substitution takes the effort of the model it puts in the seat
  (→ pipeline-guardrails.md § Effort by model at the checker seats); at every other seat a
  substitution never changes effort.

## Effort by model at the checker seats

The critic and reviewer seats take their reasoning effort from the model in the seat. This section is
the table's one home.

| Model family | Effort |
|---|---|
| sonnet | high |
| opus | xhigh |
| fable | xhigh |

- **Who:** every `nexus:critic` and `nexus:reviewer` spawn — the primary, the second reader, the
  fallback main, a promoted or fresh replacement, in every round. The done check and every other
  agent keep their agent file's `effort`.
- **The family** is the spawn's `model` parameter, else the agent file's `model`. A family not in
  the table — Haiku included — takes the agent file's `effort`.
- **A spawn's own `effort` wins:** a spawn that passes one keeps it — the light lane's lowered
  level, an owner-directed effort. A per-agent `effort` entry in `.claude/nexus-agents.json` stays a
  dispatch-prompt line and does not count as a spawn's own effort.
- **Codex is outside the table:** its effort is the repo's `codex.effort`, or a gear's Codex effort,
  which the Codex job helper resolves (→ codex-dispatch.md § Critic seat).
- **Applied by a hook:** the `checker-effort.js` hook fills the spawn's `effort` from the table when
  the call passes none — the spawner writes nothing. Where the hook cannot run (an error, a Claude
  Code older than 2.1.292), the agent file's `effort` applies. The hook assumes this plugin's
  `critic` and `reviewer` agent files: a consuming repo's same-named project agent, or a subagent
  model the environment forces, is not detected.
- **Under a gear:** a Sonnet seat takes the gear's checker effort (`gear.js value --setting 5`) in
  place of the table, filled by the same hook from the spawning session's gear context — a spec
  review's gear before the plan included (→ agents-workflow.md § Gears). `as today`, no gear, every
  other family, and a learner or solo session keep the table. A repo has no other override: a
  per-agent `effort` entry still does not count.

## Effort in the light lane

On the light lane every checker runs one effort level below its baseline (→ architect.md § Light Lane (standalone only)), save an effort a gear names (below). This section is the rule's one home.

- **Who:** the critic, the code reviewers, every second reader and the done check — never the
  developer and never the planning architect.
- **Claude readers:** the baseline is what runs when the spawn passes no effort — at the critic and
  reviewer seats the table's value for the model in the seat, the agent file's `effort` for a model
  outside the table (→ pipeline-guardrails.md § Effort by model at the checker seats), for the done
  check and every other reader the agent file's `effort`; the per-agent `effort` key in
  `.claude/nexus-agents.json` is a dispatch-prompt line, not a baseline. One step down the ladder `max → xhigh → high → medium →
  low`, floor `low`, passed as the Agent tool's per-spawn `effort` parameter — an explicit value, so
  the checker-effort hook leaves it alone.
- **Codex:** one level below the repo's `codex.effort` on the ladder `xhigh → high → medium → low`,
  floor `low`, sent with the Codex job helper's `--effort`. Where the repo sets it at `low` or below
  (`minimal`, `none`), no `--effort` is passed, the configured value stays, and the round's record
  says Codex was not lowered. Where the repo sets no `codex.effort`, no `--effort` is passed either —
  no baseline is known, the user's own Codex config decides, and the record says so.
- **A model substitution:** at the critic and reviewer seats the lowered level is one step below the
  baseline of the model the substitution puts in the seat (its table value, else the agent file's
  `effort`); at every other seat a substitution never
  changes effort, and the seat's lowered level travels with whichever model the reader-pair list or a
  pairing ask puts in it.
- **Under a gear:** an effort the gear names — a Sonnet seat's checker effort, or Codex's — is never
  stepped down: the spawner passes no effort and the hook, or the Codex job helper, fills the gear's
  value; under `fast`, Codex runs at the repo's `codex.effort`, else at its own default. A setting
  reading `as today`, and every other seat, takes the step down above.

## Pipeline role ownership

- **Nexus agents own the pipeline** — for feature pipeline roles (architect, developer, reviewer,
  critic), always use the Nexus pipeline agents. Don't substitute generic or third-party agents for
  pipeline roles. **One ratified exception (owner-ratified 2026-08-22, extended to every review
  2026-09-30):** where Codex reads — a spec, plan, code or promotion review — it *replaces* the nexus
  critic or reviewer as that review's primary, dispatched read-only through the Codex job helper,
  with a nexus second reader beside it (→ agents-workflow.md § Critic rounds). The session that
  dispatched it persists its verdict. The exception extends to the done check where a repo sets
  `jobs.doneCheck` to `codex`: a read-only Codex job, persisted by its dispatcher
  (→ codex-dispatch.md § Done check). Where Codex fails inside its early window in a typed-marker
  unattended run, the stand-in is a nexus reader on Fable — pair 2, the reader-pair list's one
  automatic Fable pick (→ codex-dispatch.md § Time limit and fallback).
- **Third-party specialist agents are fine for standalone tasks** outside the pipeline (e.g. a dedicated debugger, security reviewer, or designer) — just not as replacements for the pipeline roles themselves.

## Output Size Constraint

Explore and general-purpose agents return a structured report under 300 words. Write detailed findings to disk (e.g., a notes file or questions.md); the message is a summary. Never return raw file dumps or full grep output as the agent response — summarize findings and cite file paths.
