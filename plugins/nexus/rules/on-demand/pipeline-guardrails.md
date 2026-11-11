# Pipeline Guardrails

> Read when: spawning any agent — choosing a subagent model or type, applying the cross-model pairing doctrine, or a third-party/specialist agent taking a pipeline role.

## Model presets

Every agent a session starts runs on the model the **model preset** in force names for its role, and
the same preset names the readers, the helper jobs and their efforts. This section is the only place
in the rules that names a model: every other rule names the role ("the preset's second reader") and
points here. Its table is held equal to the plugin's presets table (`hooks/scripts/lib/model-presets.json`),
which every hook and script reads.

- **Standard — the default.** Runs on every paid plan: the authors on their agent files' own models,
  Sonnet reading and running the helper jobs, Opus beside it. It seats Fable nowhere on its own.
- **Fable** — for plans where Fable is included (Max, Ultra, Team premium, Enterprise): Fable at
  medium runs the readers and the planners a session of that profile starts — the critic, the
  reviewer, the second reader, the architect, the PO and the learner — and the `audit` job; the
  builders (developer, solo, team lead) run Opus at high, the helper types and the other helper jobs
  Sonnet, and other nexus plugins' agents their own agent files' models. Fable goes, seat by seat, to
  high-need work run in low volume, because Fable is included only up to a share of the weekly limit,
  and the owner's own sessions need what is left. Where Codex is installed it reads
  first and Fable second; without Codex the readers are Opus and Fable, the one that did not write the
  work reading first.

**Which preset is in force.** The repo's `modelPreset` key in `.claude/nexus-agents.json`, else the
Claude Code profile's (`{CLAUDE_CONFIG_DIR, else ~/.claude}/nexus/profile.json`), else Standard.
`/nexus:model-preset` shows the presets and the one in force and switches it — `/nexus:model-preset fable`
for this profile, `/nexus:model-preset standard` back, `--repo` for this repo alone. A spawning agent
reads the preset in force once per round with `model-preset.js show`, in the same scripts folder as
`gear.js` (→ agents-workflow.md § Gears).

**The consent guard.** A repo `standard` always applies. A repo-set Fable value — `modelPreset`, a
`jobs` entry or a per-agent entry naming Fable — applies only where the profile's own preset is Fable,
so a committed repo setting never puts another account on paid Fable; elsewhere the preset's model for
that seat is used, and the run's record names the ignored entry (`model-preset.js show` lists it). An
owner's explicit spawn parameter is never overridden.

**Who fills the model.** Under Standard a spawner passes the job's model (the helper rows below), and
the `checker-effort.js` hook fills only the reader seats' effort, by the effort row; every other spawn
is left as it is. Under Fable the same hook also fills every matched spawn whose seat the preset gives a
model — a core agent, `Explore`, `general-purpose` and `Plan` — that names no model with that seat's
model and effort; a spawn of such a seat that names its own model and no effort takes the effort row's
value for that model. Another plugin's agent, whose seat the preset leaves to its agent file, is left as
it is, whatever it names. The hook sees the agent type, never the job, so under Fable a site starting a
helper job (→ § Helper agents — model and type) passes nothing only where the job resolves to the
preset's own value for its spawn's type — a `discovery` job on `Explore`, a `general` job on
`general-purpose` — and the hook fills that model and effort. Otherwise the site passes the job's
model: with the preset's effort for the job where the model is the preset's own (an `audit` job's),
and with no effort where an owner direction or the repo's `jobs` entry names it, so the hook fills the
effort row's value for that model. A spawn's own `model` or `effort` is never replaced. A session the owner opens with a persona is no
started agent: it runs on the model and effort the owner picked, and the agent files keep their own
`model:`.

The **Need** column scores how much a better model changes the result of the seat's work, 1 to 10, and
**Why** names that work; a change to a seat's model starts there.

| Setting | Standard | Fable | Need | Why |
|---|---|---|---|---|
| Architect | the agent file's model and effort | Fable at medium | 9 | planning a feature |
| PO | the agent file's model and effort | Fable at medium | 9 | writing a spec |
| Developer | the agent file's model and effort | Opus at high | 8 | building code |
| Solo | the agent file's model and effort | Opus at high | 7 | a small fix |
| Team lead | the agent file's model and effort | Opus at high | 6 | running the pipeline |
| Learner | the agent file's model and effort | Fable at medium | 6 | turning lessons into rules |
| Critic, where the spawn names no model | the agent file's model | Fable at medium | 9 | spec or plan review, main reader |
| Reviewer, where the spawn names no model | the agent file's model | Fable at medium | 9 | code review, main reader |
| Second reader | Sonnet, or Opus beside a Sonnet primary | Fable, or Opus beside a Fable primary | 7 | second reader on reviews |
| Refused-start reader: a code review's first reader when its reader family is refused and Codex is absent | none | Sonnet | — | — |
| Helper job discovery | Sonnet | Sonnet at medium | 2 | finding where code lives |
| Helper job audit | Sonnet | Fable at medium | 7 | re-checking rules against code |
| Helper job general | Sonnet | Sonnet at high | 8 | investigating a bug across code |
| Claude fallback of a helper job on Codex | discovery Sonnet at medium; audit Sonnet at high; general Sonnet at high | discovery Sonnet at medium; audit Fable at medium; general Sonnet at high | — | — |
| Helper type Explore | Claude Code's own default | Sonnet at medium | 2 | finding where code lives |
| Helper type general-purpose | Claude Code's own default | Sonnet at high | 7 | review and verify passes |
| Helper type Plan | Claude Code's own default | Sonnet at medium | 5 | design option sketches |
| Other nexus plugins' agents | the agent file's model and effort | the agent file's model and effort | — | — |
| Done check | the architect's resolved model | Opus at high | 7 | the done check |
| Effort by model | Sonnet high, Opus xhigh, Fable xhigh (reader seats) | Fable medium, Opus high, Sonnet high (a spawn naming its own model) | — | — |
| Lowest effort on the light lane | low | medium | — | — |
| Reader pairs, in order | Codex + Sonnet; Sonnet + Opus; Opus + Sonnet | Codex + Fable; Opus + Fable; Fable + Opus | — | — |
| Third reader under a gear that adds one | the family the pair lacks among Sonnet, Opus; none where none is left | the family the pair lacks among Fable, Opus; none where none is left | — | — |
| Gear reader tokens | Fable reads as Opus; a repeat takes the family the pair lacks, or is dropped | Sonnet reads as Fable; a repeat takes the family the pair lacks, or is dropped | — | — |
| After an early Codex drop | the next eligible pair from pair 2 on | the next eligible pair from pair 2 on | — | — |
| After a late Codex drop | the second reader is promoted unless it is the author's family or Fable; else a fresh main from pair 2 on, never Fable | the second reader is promoted unless it is the author's family; else a fresh main from pair 2 on | — | — |
| Author model and effort under a gear (rows 8 and 9) | Opus, high | Fable, medium for PO and architect; Opus, high for developer and team lead | — | — |
| Never suggested by the config advisor | Fable | Sonnet | — | — |

- **The pairs** are the reader-pair list (→ agents-workflow.md § Critic rounds): pair 1 is Codex with
  the preset's second reader, where Codex is installed; pairs 2 and 3 are the preset's two Claude
  reader families, each leading once. A family the late row names is the one it holds back.
- **The effort row** is the effort at the critic and reviewer seats under Standard, and under Fable
  at every spawn that names its own model where the preset gives its seat a model
  (→ § Effort by model at the checker seats); a seat the hook fills under Fable takes its own row's
  effort. Under a gear, the gear's checker effort replaces it for Standard's second-reader family only.
- **The model families** the presets know are Fable, Opus and Sonnet, which may check work, and
  Haiku, which never checks. The config advisor ranks them Fable, Opus, Sonnet, and its default
  `modelRanking` is that order. The never-suggested row is about the advisor's checker suggestion
  only: under Fable, Sonnet still runs the helpers and the refused-start reader below.

**A refused start.** Claude Code never switches models on a usage-limit or billing error by itself.
So a spawn on Fable that ends on a usage-limit, billing or model-unavailable error before it hands
back is started again once: a planner or the `audit` helper with `model` set by name to its Standard
model — the agent file's model for a nexus agent, Sonnet for `general-purpose`; a reader by
re-applying the reading rule (→ agents-workflow.md § Critic rounds) to the pair order in force with
Fable left out, so its main is never the author's family; where that leaves no eligible main — a code
review with no Codex, its author on Opus — the main is the preset's refused-start reader, Sonnet, for
that case only. The builders and the other helpers run on no Fable, so no refused Fable start of theirs
arises. The run's record names the retry; a second refusal is handled as any
failed spawn. The campaign runner restarts a refused campaign session the same way, for a session
started on a family the Standard preset never runs; a session on another family refused on the
account's limit keeps the usage hold.

## Helper agents — model and type

- **Every helper job runs on its job's model — a per-repo setting.** A helper job is a spawn the
  pipeline makes on its own behalf: an `Explore` or `general-purpose` helper, the round-1 second
  reader, the done check. Its model is, in order: an **explicit
  owner-directed spawn parameter**; the repo's entry for that job in the `jobs` block of
  `.claude/nexus-agents.json`, under the consent guard; the preset's model for the job, read with
  `model-preset.js show` (→ § Model presets). The spawning agent reads the file and the preset when it
  spawns the job — at most once per round for a round-shaped agent, once per invocation otherwise
  (the team lead captures `jobs` in its one pre-flight read). Every site that spawns a job names the
  job and points here; a `discovery`, `audit` or `general` site writes no model of its own — it uses
  the job's model as read, passing it where the preset in force says (→ § Model presets). The
  Standard preset runs these helpers on its cheaper family because they research and summarize; they
  do not reason deeply.

| Job | Covers | Claude fallback of a Codex job | When unset |
|---|---|---|---|
| `discovery` | helpers that locate or sketch — codebase discovery dives, options-panel sketches, the learner's scan | the preset's, for this job | the preset's model for this job |
| `audit` | `general-purpose` helpers that review or verify — substitute review passes, finder passes, the registry verifier, the reviewer's fan-out helpers — and any other helper its spawning agent judges to need real judgement within a clear brief (a short fact check, a bounded bug investigation, scoring a trial) and expects to be light, under about 10 minutes and about 20 files; such a helper expected over either, and a review or verify pass that large, runs as `general` | the preset's, for this job | the preset's model for this job |
| `general` | a helper no other row names — an investigation, an audit started by hand, a document written from sources, a summary | the preset's, for this job | the preset's model for this job |
| `secondReader` | the round-1 second reader at the critic and reviewer seats | — | the preset's second reader (→ agents-workflow.md § Critic rounds) |
| `doneCheck` | the Step-1 done check and its re-checks, each a fresh architect spawn, or a read-only Codex job where the value is `codex` | the architect spawn, on this job's model (→ codex-dispatch.md § Done check) | the preset's done-check model and effort, passed on the architect spawn; where the preset names none, the architect's resolved model — its per-agent entry, else its frontmatter |

  The same block carries three miner keys — `minerGenerator`, `minerJudge` and `minerMechanical` —
  which are authored in the miner's own doctrine (`mine-family-core.md` § Kickoff checklist, in the
  `nexus-miner` plugin), not here. Mining jobs take their model and effort from `nexus-miner`'s
  mining job table — the checker-seat effort table below does not apply to them — and where Codex
  leads a mining job the key sets its fallback. A skill of another installed plugin may declare a job of its own
  in the same block: its row, its unset value and the rule for its value are authored in that skill,
  which points here for how a job's model is read.

  ```json
  {
    "jobs": { "doneCheck": "codex" },
    "codex": { "timeLimitMinutes": 25, "effort": "xhigh" }
  }
  ```

  **Values, and a value that cannot be used.** A value is a Claude model family the presets know
  (→ § Model presets), matched ignoring case and surrounding spaces. `codex` is a value at
  `discovery`, `audit` and `general` (the helper jobs on Codex, below) and at `doneCheck`, used where
  it is the effective value — an explicit owner-directed spawn parameter still outranks it
  (→ codex-dispatch.md § Done check); at any other job it is read as unset, with the disclosure line
  below. At the three helper jobs `codex` may carry an effort, `{ "model": "codex", "effort": "{level}" }`
  with one of the Codex levels below; every other job takes a string. A value that cannot be used is read as unset, with one disclosure line in the spawning
  turn naming the job, the value and the value taken — never a halt: an unknown family, a job name
  no table declares, a family that never checks at `secondReader` or `doneCheck`. One job
  exists to add a family, so a setting that would lose it is read as unset too: a `secondReader`
  naming the main reader's family. A repo-set second reader the consent guard lets stand is the
  repo's approval, and it holds in every run, the owner present or away. The second reader resolves by a longer
  order, with the feature's picked pair first (→ agents-workflow.md § Critic rounds). The config
  advisory (`config-advisor.js`) reports, when the file is edited, the unusable values the file alone
  shows; the one that depends on the run — a `secondReader` in the primary's family — surfaces only
  at the spawn's disclosure line.

  **`codex` — one setting for every Codex job.** `codex.timeLimitMinutes` is a positive number, the
  total time a Codex job may run from its start (unset: 25); a review job with other readers in its
  round runs until the later of that and the last of them finishing (→ codex-dispatch.md § Time limit and fallback).
  `codex.effort` is the effort a Codex
  dispatch may send, one of `none`, `minimal`, `low`, `medium`, `high`, `xhigh` (unset: none is sent,
  and the user's own Codex config decides). Every Codex job reads it, through the Codex job helper
  (→ codex-dispatch.md § Time limit and fallback); a helper job's own effort, where its entry names
  one, comes before it.

  **A helper job on Codex.** Where `discovery`, `audit` or `general` has the value `codex` and Codex
  is available, a main session starting that helper decides by the job's size whether Codex is worth
  it; a job of a minute or two stays on Claude for now. The job only reads and reports back, and the
  session saves anything to be saved. A job that must edit files, or that a plugin agent does, stays on
  Claude, and a job that scores or judges work never goes to the family that produced it. A helper
  started inside another agent stays on Claude for now. A job that stays on Claude runs on the job's
  Claude fallback in the table. The session starts the job with the `helper` kind, a label naming the
  job, `--job-name` and the limit it judges right (→ codex-dispatch.md § Helper job). A job that cannot
  start, fails, is cut at its limit or returns nothing falls back at once to the same Claude fallback,
  with one disclosure line and no question.

- **Read-only helpers that locate or sketch default to `Explore`** (the `discovery` job — discovery
  reads, options-panel sketches) — its charter excludes Edit/Write/NotebookEdit, so a stray write is
  structurally impossible rather than merely forbidden in prose. Use `general-purpose` only when the
  helper must **write its deliverable**, must **audit or verify** (the `audit` job — `Explore`
  locates code, it doesn't review it), or needs a tool `Explore` lacks. This is a `subagent_type` rule — it composes with the job's model above, it does not replace
  it.
## Agent model overrides and pairing

- **Never override specialized agent models — outside five sanctioned channels, a gear riding the first** — specialized
  agents (architect, developer, reviewer, etc.) have their model baked into their definition
  frontmatter, and the prohibition on ad-hoc overrides stands. The five channels that may override
  it: the **`.claude/nexus-agents.json` ladder — per-agent and per-job entries, then the repo's
  gear** — each entry under the consent guard of § Model presets, read at pre-flight by the team lead and at a job's spawn by the agent that spawns it (a
  done check on its `doneCheck` model is this channel, not an ad-hoc override). A spawned po,
  architect, developer or team lead takes its model and effort from `gear.js value --setting 8|9
  --role {agent}` (→ agents-workflow.md § Gears), whose order is the helper's; a main-session persona runs on the session model, outside the gear; an
  **explicit owner-directed spawn parameter**; the **reader-pair list**, applied by the pairing
  check (the bullet below — always on, at checker seats only, where it picks the main reader with or
  without a collision); the **second reader** (→ agents-workflow.md § Critic rounds),
  spawned on its job's model (`secondReader` in the table above) as additive coverage; and the
  **model preset**, which gives a started agent the preset's model where no channel above set one
  (→ § Model presets). Any other `model`
  parameter that overrides an agent's frontmatter is the
  ad-hoc override this rule forbids. Editing `.claude/nexus-agents.json` runs a config-time advisory
  (`config-advisor.js`) that reports a producer/checker family collision; the setting always
  stands — the reader-pair list applies at spawn.
- **Cross-model pairing — always on (ADR-93).** The verifier/critic/judge of any
  judgment artifact runs on a **different model** than its producer — any two different families
  that may check (→ § Model presets). There is no switch to turn it on: the master switch was
  removed, so a config still setting one changes nothing. Deterministic instruments are model-free
  and satisfy no pairing — the judgment layer over them is what pairs.
  Pairing applies to the **primary** checker only; the second reader is additive coverage
  and may share the producer's family.
  **Placement (the ruled precedence):**
  absent an explicit owner direction, the independent check sits **with the strongest producer**,
  and the top model goes where its output is most mechanically checkable — never in a seat whose
  output only a stronger judge could audit; an explicit owner direction (e.g. "the strongest model
  generates, another family verifies") wins over all defaults. **Reconciliation:** the doctrine governs dispatches where
  the caller sets `model:` (campaign/stage spawns), and — since nexus 1.65.0 — it also reaches
  the pipeline's **checker** seats (spec→critic, plan→critic, implementation→reviewer,
  promotion→critic) through that mechanism and no other. **Producer seats, non-checker spawns, and
  everything else keep the rule above**: the reader-pair list reaches checker seats only — there it
  picks the main reader whether or not a collision occurred. At the critic and reviewer seats a
  substitution takes the effort of the model it puts in the seat
  (→ pipeline-guardrails.md § Effort by model at the checker seats); at every other seat a
  substitution never changes effort.

## Effort by model at the checker seats

The critic and reviewer seats take their reasoning effort from the model in the seat, by the effort
row of the preset in force (→ § Model presets); under a preset whose hook fills every matched spawn,
the same row also sets the effort of a spawn that names its own model and no effort, where the preset
gives that spawn's seat a model — never another plugin's agent — while a seat the hook fills takes its
own row's effort.

- **Who:** every `nexus:critic` and `nexus:reviewer` spawn — the primary, the second reader, the
  fallback main, a promoted or fresh replacement, in every round. Under a preset whose row covers
  the reader seats only, the done check and every other agent keep their agent file's `effort`.
- **The family** is the spawn's `model` parameter, else the agent file's `model`. A family the row
  does not name takes the agent file's `effort`.
- **A spawn's own `effort` wins:** a spawn that passes one keeps it — the light lane's lowered
  level, an owner-directed effort. A per-agent `effort` entry in `.claude/nexus-agents.json` stays a
  dispatch-prompt line and does not count as a spawn's own effort.
- **Codex is outside the table:** its effort is the repo's `codex.effort`, or a gear's Codex effort,
  which the Codex job helper resolves (→ codex-dispatch.md § Critic seat).
- **Applied by a hook:** the `checker-effort.js` hook fills the spawn's `effort` from the row when
  the call passes none — the spawner writes nothing. Where the hook cannot run (an error, a Claude
  Code older than 2.1.292), the agent file's `effort` applies. The hook assumes this plugin's
  `critic` and `reviewer` agent files: a consuming repo's same-named project agent, or a subagent
  model the environment forces, is not detected.
- **Under a gear:** on the Standard preset, a seat on its second-reader family takes the gear's
  checker effort (`gear.js value --setting 5`) in place of the row, filled by the same hook from the
  spawning session's gear context — a spec review's gear before the plan included
  (→ agents-workflow.md § Gears). `as today`, no gear, every other family, every other preset, and a
  learner or solo session keep the row. A repo has no other override: a per-agent `effort` entry still
  does not count.

## Effort in the light lane

On the light lane every checker runs one effort level below its baseline (→ architect.md § Light Lane (standalone only)), save an effort a gear names (below). This section is the rule's one home.

- **Who:** the critic, the code reviewers, every second reader and the done check — never the
  developer and never the planning architect.
- **Claude readers:** the baseline is what runs when the spawn passes no effort — at the critic and
  reviewer seats the effort row's value for the model in the seat, the agent file's `effort` for a
  model outside the row (→ pipeline-guardrails.md § Effort by model at the checker seats), for the done
  check the preset's done-check effort where the preset names one (a light-lane done check runs one
  step below it, on the same model), and for it otherwise and every other reader the agent file's
  `effort`; the per-agent `effort` key in `.claude/nexus-agents.json` is a dispatch-prompt line, not a
  baseline. One step down the ladder `max → xhigh → high → medium → low`, never below the preset's
  lowest light-lane effort (→ § Model presets), passed as the Agent tool's per-spawn `effort`
  parameter — an explicit value, so the checker-effort hook leaves it alone.
- **Codex:** one level below the repo's `codex.effort` on the ladder `xhigh → high → medium → low`,
  floor `low`, sent with the Codex job helper's `--effort`. Where the repo sets it at `low` or below
  (`minimal`, `none`), no `--effort` is passed, the configured value stays, and the round's record
  says Codex was not lowered. Where the repo sets no `codex.effort`, no `--effort` is passed either —
  no baseline is known, the user's own Codex config decides, and the record says so.
- **A model substitution:** at the critic and reviewer seats the lowered level is one step below the
  baseline of the model the substitution puts in the seat (its row value, else the agent file's
  `effort`); at every other seat a substitution never
  changes effort, and the seat's lowered level travels with whichever model the reader-pair list or a
  pairing ask puts in it.
- **Under a gear:** an effort the gear names — a seat's checker effort under Standard, or Codex's — is never
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
  (→ codex-dispatch.md § Done check). Where Codex fails, its stand-in is the nexus reader the
  reading rule picks from the preset's pair order (→ codex-dispatch.md § Time limit and fallback).
- **Third-party specialist agents are fine for standalone tasks** outside the pipeline (e.g. a dedicated debugger, security reviewer, or designer) — just not as replacements for the pipeline roles themselves.

## Output Size Constraint

Explore and general-purpose agents return a structured report under 300 words. Write detailed findings to disk (e.g., a notes file or questions.md); the message is a summary. Never return raw file dumps or full grep output as the agent response — summarize findings and cite file paths.
