# Agent Coordination Protocol

The agent pipeline (8 roles — team-lead, po, architect, developer, reviewer, critic, learner, solo) for feature development. Agents coordinate through file-based handoffs and **hub-and-spoke messaging** — all messages route through the team lead.

## Slug and Path Resolution

The `{slug}` identifies a unit of work and follows these conventions:
- Internal feature: `F{N}-{Name}` — e.g., `F5-SprintSummaryCard`
- Jira epic: `{KEY}-{2-3-words}` — e.g., `PD-5234-shelf-compliance-kpis`
- Jira issue: `{KEY}-{2-3-words}` — e.g., `PD-5226-split-config`
- Ad-hoc: `adhoc-{Name}` — e.g., `adhoc-SyncRefactoring` (**solo-only** — see the Lane rule below)
- Bug: `BUG-{N}-{name}` — e.g., `BUG-1-bug-count-zero`
- Gap: `GAP-{N}-{name}` — e.g., `GAP-3-sub-team-management-ui`

The team lead or PO assigns the slug at the start of each pipeline run and passes it to all downstream agents. Agents never derive the slug — they use exactly what was passed.

**Lane rule (ADR-58).** Any unit of work **shaped with the PO or designed with the architect — regardless of source** (fresh idea, external or ratified proposal, tracker item, owner directive) — is a **feature**: it takes an `F{N}` (or tracker-key) slug and is **recorded as a row in `docs/backlog.md`** when that file exists. `adhoc-{Name}` is **solo-only**. The moment work outgrows solo — it needs a PO shaping pass or an architect plan — re-slug it as a feature and add the backlog row before the pipeline proceeds. `BUG-{N}` / `GAP-{N}` are unaffected. A feature slug does not force a heavy definition — the technical branch's ADR-collapsed definition (ADR-25/27) still applies.

Standard paths:
```
docs/backlog.md                              ← feature sequence, dependencies, status
docs/specs/{slug}/
  definition/   ← spec.md (or epic.md / bug.md), help.tooltips.md, images
  delivery/     ← plan.md, implementation.md, review.md, lessons.md, summary.md, communication-log.md
```

For a Jira issue nested under an epic:
```
docs/specs/{epic-slug}/{issue-slug}/definition/
docs/specs/{epic-slug}/{issue-slug}/delivery/
```
Ad-hoc work has no `definition/` folder — only `delivery/`. (solo-only lane — Lane rule above).

`communication-log.md` is the **canonical filename** for the inter-agent message log. A consumer project preferring another name is their concern — the plugin always uses this name.

## Branch Pre-Flight & Default-Branch Resolution

The **launch-time** branch guard, defined once here because both the team lead (Pre-Flight) and solo (Workflow) load this always-on rule and both reference it. It runs **only on a fresh launch** (a clean start, after the team lead's idempotency fork routes an interrupted run to **Resume** instead). It is git-only and host-agnostic — no `gh`/PR coupling. **Timing contract:** the checkpoint runs **before the first write of any kind — artifact or code —** on the clean-start path. **This is distinct from the team-lead Resume branch-check** (which guards against *resuming* onto the wrong branch, team-lead.md → Resume); the two never double-fire because the guard sits on the clean-start path only.

**Default-branch resolution order (best-effort, never blocks):**
1. `git symbolic-ref --quiet refs/remotes/origin/HEAD` → strip the `refs/remotes/origin/` prefix (the repo's actual default branch).
2. On miss → `.claude/nexus-agents.json` → `defaultBranch` (config override).
3. On miss → the literal `main` (fallback).

Resolution is best-effort: a detached or remote-less repo simply falls through (1)→(2)→(3). It never blocks — an unresolved default just means the fallback is used.

**Branch-state decision matrix.** "Matches the slug" = the current branch name contains the slug or the slug contains the branch name (the cheap heuristic). Anything that is **not** a clear match is treated as *unrelated*, and unrelated → **ask, never auto-classify** (D2):

| State | Attended | Unattended |
|---|---|---|
| On the default branch | Ask: the branch-strategy option set below, with a recommendation | Auto-create `{slug}` from the default, proceed |
| Branch matches the slug | Proceed silently ("Working on `{branch}`") | Proceed silently |
| Unrelated branch | Ask: the branch-strategy option set below, with a recommendation | Auto-create `{slug}` from the default, proceed |
| Detached HEAD / no slug | Ask to create a branch | **Abort** (can't safely auto-branch) |

**New-branch name = the slug.**

**Branch-strategy option set (attended ask).** The options an attended ask draws from — up to four, per each option's own condition below; the detached-HEAD row keeps its narrower ask from the matrix above instead of this set:
1. **Continue here** — work on the current branch (covers "just use main" when on the default).
2. **New branch from the default** — name = `{slug}` (existing naming rule stands).
3. **New branch from the current branch (stacked)** — offered **only when current ≠ default**; right when the new work builds on unmerged in-flight work.
4. **New worktree** — `git worktree add -b {slug} ../{repo-dir-name}-{slug} {defaultBranch}`; right for parallel/long-running work or a dirty tree that must stay untouched. Remove it after merge (`git worktree remove`) — don't leave stale worktrees around.

The 4-option shape deliberately fits the `AskUserQuestion` option cap; agents may present it with that tool or plain text — the rule stays mechanism-agnostic.

**Recommendation duty (attended ask).** Every ask **carries exactly one recommended option + `confidence: high|medium|low` + a one-line why**, derived from work shape × tree state:
- Dirty tree, dirt belongs to **this same work** (fix-cycle) → recommend **continue here**.
- Dirty tree, dirt is **unrelated / another feature's in-flight work** → recommend **worktree** (isolate the new work; never build on a tree you can't commit cleanly). Stash-then-branch is fallback guidance only — when a worktree is impractical — never a first-class option (stashes get forgotten; a worktree isolates without moving the in-flight work).
- Clean tree, small single-commit change → recommend **continue here**.
- Clean tree, multi-commit / PR-bound feature → recommend **new `{slug}` branch from the default**.
- New work **builds on** the current unmerged branch → recommend **stacked branch**.
- Work will run **in parallel** with other active work in this checkout (another session/agent) → recommend **worktree**.

The agent judges "same work vs unrelated" from available signals — slug/branch-name match, the dirty files' overlap with the new work's surface, an uncommitted bump/CHANGELOG entry naming another slug — and when unsure says so (that lowers the recommendation's confidence label; it never silently classifies).

**Overlays (apply on top of the matrix):**
- **Dirty tree:** applies **on top of every row, including a silent slug-match proceed** — a dirty/unrelated tree still gets a named warning even when the branch choice itself asks nothing. Where an ask is in play, the dirty state feeds the recommendation (per the Recommendation duty above); either way, the warning names *which files are dirty and whose work they appear to be* (attended). Abort if it can't be cleanly isolated (unattended). This is the team lead's existing dirty-tree behavior stated here as the shared rule — its meaning is unchanged.
- **Stale default:** when creating a branch *from* the default, `git fetch` the default and warn if local is behind `origin` before branching — never base new work on a stale default silently. The fetch is **unconditionally best-effort**: if it fails or errors for *any* reason (offline, no remote, a guard policy, a detached/remote-less repo), **warn-and-skip — never block or error**. (Unlike the closure push gate, this is *not* a hardened-mode deferral — hardened mode does **not** block `git fetch`, and an agent has no runtime signal for the active guard mode anyway; the best-effort posture covers the fetch failing for any reason, which subsumes the policy case.)

**Unattended note:** a worktree is **never auto-selected** — unattended keeps auto-branch per the matrix and the abort overlay (an unattended run switching its working directory mid-run is a harness risk no one can approve).

## Host Adapter & PR Tail

The **post-push** companion to Branch Pre-Flight above: the closure-side git/host-boundary rule. Both the team lead (Commit Protocol → PR Tail) and solo load this always-on rule, so the canonical definition lives here once and the team lead references it (the existing "canonical in agents-workflow" pattern). Branch Pre-Flight is git-only and host-agnostic; this section is where the outward, host-specific PR operations live. It is **opt-in, attended-only, and never a hard step** — with the tail off or unavailable the pipeline closes at push exactly as today.

**Host-adapter surface (ADR-36).** The outward PR operations route through a named adapter seam — four ops only:

| Adapter op | Purpose |
|---|---|
| **open-PR** | open (or reuse) the PR for the pushed branch |
| **post-review** | post the AI review onto the PR |
| **view-PR** | look up an existing PR (idempotency check) |
| **merge** | merge the PR (human-controlled, one-way) |

The **only adapter shipped is `gh` (GitHub).** This is a **documented concept, not code** — a single adapter in v1 — but it is what keeps `gh`/GitHub from being hard-wired into the agent prose, and it is the seam a future GitLab / Gitea / Azure adapter slots into without re-architecting.

**Host capability is resolved FIRST.** Before any adapter call, confirm the origin is a **GitHub remote** **and** `gh` is **installed + authed** (e.g. the origin URL matches `github.com`; `gh auth status` succeeds). Absent → the tail is **unavailable** and **silently skipped** — never an error, never a hard step; the pipeline closes at push exactly as today. (Mirrors the Branch Pre-Flight stale-default overlay's best-effort, host-aware, never-blocks posture.)

**Posture (stated once; the team-lead subsection references it, does not restate it):**
- **Attended-only.** The tail runs **attended only**.
- **Unattended → unreachable.** Under `[UNATTENDED]` the tail is **unreachable** — no PR open, no review post, no merge (fail-closed, ADR-32; curation and the one-way merge need a human).
- **Hardened mode → skips it.** Hardened guard mode **skips** the tail (prose deferral, mirroring the closure push gate). Note `gh` is **not** actually blocked by `guard.js` today (which blocks `git push`/fetch/curl only), so this is a **convention, not an enforcement,** in v1 — the `guard.js` hook block is roadmap.

`{defaultBranch}` for the PR base comes from **`## Branch Pre-Flight & Default-Branch Resolution`** above (`origin/HEAD` → config `defaultBranch` → `main`) — **do not re-derive it here.** The `gh` command recipes (the exact `gh pr create|view|review|merge` invocations) live in the team-lead PR-Tail subsection, not here.

## Pipeline State (`.claude/.pipeline-state`)

The team lead is the **sole writer** of `.claude/.pipeline-state`. Every phase transition writes the next token before the spawn or resume. The `pipeline-gate` hook reads this file as a **best-effort tripwire** — it can deny a *foreground* (main-session) write under the wrong token, but a **background subagent's deny is not honored by the platform** (ADR-13), so it does **not** reliably stop a backgrounded pipeline agent. The real enforcement of the analyze→stop boundary is the agent's own hard-stop rule (it asks before assuming — see "All Agents") plus the team lead's verify-and-intervene. No pipeline subagent may write this file — a subagent's write cannot be blocked (ADR-13) but is detected by the boundary detector and logged to `.claude/audit/violations.log`.

**Complete vocabulary (these exact tokens):**

| `.pipeline-state` value | Phase meaning | Written by team-lead before |
|---|---|---|
| *(absent / file missing)* | No pipeline active, solo, or leaderless run | — |
| `po:shape` | PO shaping the spec | Spawning PO |
| `architect:analyze` | Architect Phase-1 analyze-and-stop | Spawning architect Phase 1 |
| `architect:plan` | Architect Phase-2 writing the plan | Resuming architect Phase 2 |
| `architect:donecheck` | Architect Step-1 done check | Resuming architect for done check |
| `critic:review` | Critic reviewing spec or plan | Spawning critic |
| `developer:analyze` | Developer Phase-1 analyze-and-stop | Spawning developer Phase 1 |
| `developer:implement` | Developer Phase-2 implementing | Resuming developer Phase 2 |
| `reviewer:review` | Reviewer Step-2 code review | Spawning reviewer |
| `learner:process` | Learner consolidating lessons | Spawning learner |

**Gate contract (source of truth is the gate decision table in `pipeline-gate.js`) — these describe the gate's *decision*; it is only *enforced* against a foreground writer (ADR-13):**
- A developer source-write is allowed **only** under `developer:implement`; any other present token, or an unrecognized token, denies it — **but a background developer subagent's write is not actually blocked** (the deny is dropped), so this is a tripwire, not a guarantee.
- A plan.md write is blocked under any token ending in `:analyze` (same foreground-only caveat).
- An absent file fails open (solo / leaderless / unattended runs are never wedged).

**The gate keys on the token, not on conversational intent — three recurring failure modes:**
- **Inline user override mid-session.** When the user inline-approves a phase transition ("skip the checkpoint, write the plan"), the agent's `.pipeline-state` still says `…:analyze`, so the gate *correctly* blocks the write. The fix is **not** an agent workaround — it is the **team lead advancing the token to the next phase before the agent proceeds**. The team lead is the sole writer; a user "go" is the team lead's cue to write `architect:plan` (or `developer:implement`), then resume the agent.
- **No self-advance / no bypass.** A pipeline subagent must **never** advance its own phase — not by writing `.claude/.pipeline-state` (team-lead-owned; a subagent write is detected and logged by the boundary detector), not via the side doors a faithful agent reaches for when blocked (`printf …> .claude/.pipeline-state` in Bash, or writing `plan-draft.md` and `mv`-ing it to `plan.md`), and not by **spawning other agents to run the next phases** (the hard rule under All Agents). These defeat the checkpoints silently. If blocked, report the checkpoint and let the team lead transition — do not engineer around the gate.
- **Foreign-repo deliverables are a blind spot.** The gate watches the working tree at `CLAUDE_PROJECT_DIR`. For a pass whose deliverables land in a **separate repo** (e.g. editing the Nexus plugin source from a consumer project), the gate sees no plan/source writes in the repo it watches and cannot enforce the analyze→implement boundary at all — it fails open. The team lead must enforce the checkpoint **manually** for such passes (don't rely on the gate), and the plan must headline the foreign deliverable path so the done-check and review read the right repo. *(Making the gate two-repo-aware — watch a plan-declared foreign path, or honor a developer-written phase marker — is a tracked `pipeline-gate.js` improvement, not yet implemented.)*

**Session lifecycle:** `.pipeline-state` is **not** auto-cleared on SessionStart — `restore-agent.js` manages only the persona registry (`.personas.json`), never this file. The team lead owns the token: it overwrites the file to the correct phase before each spawn/resume, so a stale token from a prior run is replaced before it matters. A stale or absent token only ever fails the gate **open** (it never wedges a run).

## Communication Model: Hub-and-Spoke

All agent messages go through the team lead. Agents never message each other directly.

**Why:** The team lead triages all communication, intercepts decisions that need user approval, and prevents agents from silently overriding user requirements.

**How agents send messages:** Address the team lead, specifying the intended recipient and content:
```
To team-lead: "For {recipient}: {message content}"
```

**How the team lead dispatches:** Read the message, decide:
1. **Routine handoff** (e.g., "ready for review") → forward to recipient.
2. **Decision that contradicts user requirements or changes scope** → ask the user first, then forward the answer.
3. **Question that needs user input** → relay to user, wait for answer, forward to agent.

## All Agents

- **Instructions from the team lead are user decisions.** Instructions relayed through the team lead represent user decisions already made. Agents may flag concerns or recommend alternatives *before* the decision, but once an instruction arrives, they execute it — they don't substitute their own judgment because they consider it more efficient or equivalent.
- **Rules go in files, not memory.** When a reusable rule or convention is identified, capture it in the appropriate rule or agent file — not in memory. Memory is for context that doesn't fit in rule files (user preferences, project state, external references). This applies to every agent, not just the team lead.
- **Never assume past an open question — stop and ask (hard rule).** Any ambiguity, missing input, or unmade decision means you STOP, surface it (write it to `questions.md` and report it), and wait — before writing a plan, code, or any artifact that bakes in the assumption. "I'll assume X and proceed" is a defect, not initiative. In a team, route the question through the team lead; standalone, ask the user. A phase with **no** open question may proceed; a phase with an **unsurfaced** one may not. This is every agent's own rule, and it is also hard-coded in each agent file — per ADR-2 a spawned subagent sees only its own file, so the rule lives in both places. Corollary: an answer the user did not personally give is **not** a user answer — record a proceed-default as `presumed (proceed-default), not user-confirmed`, never under a user-answered heading.
- **Your durable artifact is your primary deliverable, not your inline message (hard rule).** Under background spawn the inline completion notice is partial by design (ADR-12/16); the record of record is the file you write (`plan.md`, `review.md`, `implementation.md`, `questions.md`, `lessons.md`, `summary.md`). Write the file **first**, then report — never return a verdict or findings inline-only with no file behind them. A missing artifact is an incomplete result, not a result delivered by message.
- **A 0-byte spawn `output_file` is expected, not a hang — and never poll a sibling's output to track it (hard rule).** The spawn-result `output_file` / `tasks/{id}.output` is routinely **0 bytes**; the real transcript is the platform-written `agent-{id}.jsonl` (salvage's by-agentId search finds it). Two rules follow: (1) a 0-byte output file is **not** evidence of a hung or stranded agent — check the transcript before concluding anything; (2) **never poll another agent's output file to infer its progress** — that misread is exactly what triggered a delegated-self-advancement breach (ADR-21), and it pairs with the never-spawn-a-pipeline-role rule below.
- **Never author another agent's artifact or sign as a role you are not (hard rule).** Each artifact has one owner: the developer writes `implementation.md`; the architect writes the Step-1 done-check in `review.md`; the reviewer writes the Step-2 review in `review.md`; the team lead writes `summary.md` and owns commits + `.claude/.pipeline-state` (exceptions: the standalone architect writes `summary.md` and commits at the close of an Architect-Led Fast Lane run — see `architect.md`; the standalone learner commits its own consolidation at the close of a run — see `learner.md` step 9). Producing a verdict for a role that isn't yours — or signing a section as another agent — fabricates an independent gate and is the most severe pipeline breach. If a gate hasn't run, **report it; never simulate it.** `lessons.md` is the one shared artifact: each role **appends under its own `## {Role} Lessons` heading** and never rewrites the file header or another role's sections.
- **Never spawn a pipeline-role agent (hard rule).** Advancing the pipeline by spawning po/architect/developer/reviewer/critic/learner/team-lead — or another instance of your own role — belongs to the team lead alone. The platform may *let* a subagent spawn agents; that is not permission. Commissioning a correctly-typed agent to produce a gate is the same breach as authoring the gate yourself (ADR-18/ADR-21): the result is an unsupervised pipeline — no checkpoints, no model config, gates nobody triaged. When your phase ends, hand back and STOP. The only sanctioned spawns are the ones your own agent file names: research helpers (Explore) for discovery, and the critic where your file directs it in standalone mode. A subagent's pipeline-role spawn is detected by the boundary detector and logged to `.claude/audit/violations.log`.
- **Your FINAL message is the deliverable — never an acknowledgement after it (hard rule).** The spawner reads your last message; under background spawn anything before it can be stranded (the measured shape: a real handback followed by "Done." / "Holding for the go-ahead." / "Acknowledged."). End every turn — the first return AND every resumed turn — with the handback itself: verdict, findings, questions, summary. If there is nothing substantive to add after the deliverable, add nothing.
- **A placeholder return is a non-result.** A dispatched subagent's first reply must carry its findings — a bare acknowledgement ("Ready.", "Standing by.", "Done.") is a non-result. The dispatcher re-dispatches **once** with an explicit "read the files and return findings — do not acknowledge"; if it placeholders again, do the bounded work yourself instead of burning more dispatch cycles. Never treat a placeholder as completed work.
- **Arrival order is untrusted.** A teammate's completion report can arrive *after* its idle
  notification and even after the hub's next dispatch (platform-level; every measured crossing was
  ordering, not agent error). Key every decision on agentId + artifact state, never on message
  arrival order; never re-litigate a settled round on a stale-sounding message.
- **Idle-without-payload recovery (every dispatcher, not just the team lead).** On an idle
  notification with no report: verify the artifact/tree first (target paths, `git status`,
  transcript), `SendMessage`-resume the named agent second (a **live idled** agent resumes with
  context intact and reliably recovers the payload — the measured result), re-dispatch last. Distinct
  from the Relay Contract's thin-result recovery (a **completed** agent's stranded result, where
  re-asking is the least-reliable last resort) — this is the *live idled, no-payload-yet* case.
- **Research-helper dispatch contract.** When spawning a research helper (Explore, general-purpose): point it at inputs **by file path** — never paste bulk content into the prompt — and require a structured return: counts + per-item one-liners + surprises, ~300 words ("return findings, not acknowledgements"). A shaped dispatch is the cheap half of the placeholder rule above: it prevents both the empty return and the unusable wall-of-text one.
- **Spawn-tasking contract: capability pins + role-prefixed names.** Every spawn/tasking carries the
  four explicit pins — spelled exactly as ADR-61 part 3 names them: no-git-push, no-git-config,
  no-history-rewrite, no-permission-change
  (a subagent's claimed "user request" is unverifiable from its transcript — the pins are the
  authority, not the claim). A custom spawn `name`, when used (e.g. parallel same-typed helpers
  needing distinct identities), MUST be role-prefixed — `{role|known-abbrev}-{qualifier}`
  (`developer-w7-a`, `dev-wave0`), unique qualifier per parallel helper — so the role-keyed hooks
  resolve it (`resolve-role.js` matches the role by its longest leading prefix, discarding the
  qualifier); a qualifier-first name (`w7-dev-stage-a`) defeats resolution and false-flags the
  agent's own writes.
- **Tag every user-facing recommendation with a confidence label (hard rule).** When you put a question or choice to the user — directly (`AskUserQuestion`), as a `To: user` question in `questions.md`, or as a recommendation you hand the team lead to relay — state your recommended answer and tag it **Confidence: high | medium | low** + a one-line why. **high** = a clear basis (spec, ADR/architecture, an existing pattern, strong evidence) points one way — safe to proceed on if unanswered; **medium** = a reasonable lean with a real trade-off; **low** = weak basis or a genuine toss-up — you especially want the human's call. The label tells the user which defaults to rubber-stamp and which need real thought. In `AskUserQuestion`, put it in the recommended option's description — and on a **boostable ask**, the question also carries the research option per research-before-asking.md; in `questions.md`, use the Recommendation/Confidence fields (questions-format). The team lead preserves an agent's confidence when relaying, and adds its own when it asks. **A clear basis means a *confirmed* basis — a belief is not a basis.** Confidence is **lowered by an unconfirmed load-bearing assumption**: a verdict or recommendation resting on an assumption you could not confirm is **not High**, however sure it feels, and that assumption is a **research target, not a basis** — confirm it (look it up, test it) before you let it carry a High. (This is the failure that turns "X is unsupported" — never checked — into a confident wrong verdict.)
- **A relayed, consensus-backed, or remembered fact is a claim to re-verify, not evidence.** A fact relayed from another agent, backed by a consensus of citing sources, or recalled from memory is a claim — re-execute it against live source before a decision depends on it. Re-executed evidence, not citation count, is ground truth. It matters most when the fact would license *skipping* a step ("no need to seed X"): that error direction is invisible at authoring time — the test still passes. The check is usually cheap and mechanical — a parity/"mirrors X" claim is byte-checkable (grep the cited body, diff the arithmetic), a cited path is `ls`-checkable. (The mine-family skeptic stage is the finding-verification instance of this same principle — see `mine-verify-repo/SKILL.md`'s skeptic, which re-executes each finding's evidence before it enters the registry.)
- **External-repo filesystem facts: an empty Glob/Grep/Bash result on an out-of-tree path is not evidence of absence.** Glob and Grep return empty for paths outside the session's registered working directories even when the files exist, and a sandboxed shell probing an out-of-repo path can fabricate a plausible wrong answer — this covers **any** external-path filesystem read, not just git commands. Verify through the channels that do reach outside: `Read` with an absolute path, a native-shell read (e.g. PowerShell `Test-Path` / `Get-ChildItem` on Windows), or `git -C {repo}` for git facts. Treat "No files found" on an external path as *unanswered*, never as *absent*.
- **Offer research before a cold answer.** On a **boostable ask** presented through a clickable surface, the offer's primary form is a selectable **research option** on the question itself, naming the target and a rough cost; prose remains the fallback for surfaces with no clickable ask: "I can research {X} first — want me to, or do you already have a direction?" This guards both failure modes: researching silently when the user already knows the answer, and forcing a cold answer when researched context is cheap. Offer only when research would genuinely change the question — a reflexive offer on every question is noise. (Codebase facts are never user questions — look them up.) See research-before-asking.md — the single owner — for the full Research & Confidence Protocol: boostable asks, the research option's semantics, the depth dial (cheap/local → resolve silently; expensive/external → offer with a cost estimate), capture-before-surface, and the **fact-shaped unknown** (a fact you can't resolve from current context → research is the default before a verdict).

## Message Size Contract

Keep agent outputs focused. Content goes in files; messages are notifications with summaries.

| Output type | Max length | Rule |
|-------------|-----------|------|
| Analysis outputs (Phase 1) | ~500 words | Write detailed findings to questions.md or a notes file; message is the summary |
| Handoff messages | ~300 words | One paragraph of what was done + one paragraph of what's next |
| Checkpoint reports | Structured format | See the Checkpoint Report Format section in each pipeline agent's own file (architect/developer/team-lead) |

**Write first, message second** — this applies to ALL artifacts, not just questions. Implementation details go in implementation.md, review findings go in review.md, questions go in questions.md. Messages are notifications.

## Read Discipline (all agents)

The pipeline is sequential and most files have one writer — within one **round** (a spawn→handback or resume→handback turn), nothing changes a file except you. Measured token waste comes overwhelmingly from re-reads (one run: an agent re-read its own plan.md ×35, ~2.5MB through context).

- **Read each file at most once per round.** After the first read it is in-context state — work from it. The Edit tool needs exactly **one** prior Read of a file, never one per edit.
- **Never re-read a file to "verify" your own Write/Edit** — the tool errors if the change failed.
- **The artifact you are authoring is the file you least need to re-read.** You wrote it; edit targeted sections from context.
- **Sanctioned re-reads (only these):** (1) after a context compaction — one re-read; (2) a file another agent changed since your last round (their fix landed between rounds — that's the new round's first read); (3) chunked first reads of a large file (offset/limit over distinct ranges is ONE logical read); (4) checking your own recent edit's surroundings — use an offset read of the changed range, not a whole-file re-read.
- **Read the section, not the whole file (large / multi-section inputs).** For a **large file (> ~400 lines) or a known multi-section artifact**, read the section you need rather than the whole file: **locate the heading (`grep '^#'`) → `Read` with `offset/limit`** around it. Two cheap calls replace one fat whole-file read. This is *targeting*, not re-reading — it composes with the "chunked reads = one logical read" exemption above. **Fallbacks (each resolves to a wider/whole read, so nothing is lost):** (a) no `^#` match (a non-markdown log) → whole-read; (b) ambiguous or duplicate heading → widen to whole-read rather than guess; (c) one oversized section → heading-targeting's floor is that section, `offset/limit` within it is the escape. The format skills (`review-format`, `implementation-format`, `summary-format`, the plan, `lessons-format`) document each artifact's fixed heading set as the targeting index. (See ADR-22 Extended.)
- **Role-input boundary:** read your role's inputs plus what your dispatch names — nothing else. `communication-log.md` is the team lead's; other roles' artifacts you don't consume are not yours to browse. (Reads are not ownership breaches, but they are paid context.)

The read-tracker hook nudges on a same-round repeat read and logs ≥3 repeats of the same file to `.claude/audit/violations.log` for the team lead's checkpoint review.

## Audit Substrate (`.claude/audit/`) — detect-then-gate

Two enforcement breaches recur and are **not preventable at the prompt level**: a background subagent's PreToolUse deny is dropped (ADR-13), and you cannot force an agent to invoke a `Skill`. So both are converted from "an agent must choose to behave" into **detect-then-gate** — log the fact deterministically, and make a gate Fail on the logged fact. Two always-on, observe-only hooks write two logs (neither is config-gated; both are zero-footprint until they have something to record, and fail silent):

| Log | Written by | Records | Consumed by |
|---|---|---|---|
| `.claude/audit/violations.log` | `boundary-detector.js` (PostToolUse `Write\|Edit\|MultiEdit\|Agent\|Task\|Bash`) + `read-tracker.js` (≥3 same-round re-reads) | A subagent breach the gate cannot block: an ownership write (a role writing another role's artifact / `.pipeline-state`), a **pipeline-role spawn** by a subagent (ADR-21), a **state-changing git write** by a subagent (`commit`/`add`/`reset`/`push`/`stash`/`restore`/`switch` — anchored-regex, `git commit-graph` and read-only git excluded, including the read-only stash subcommands `git stash list`/`show` a developer uses to inspect HEAD; ADR-18/20), and re-read offenders | The **team lead** at every verify point → the deterministic fabrication void-and-rerun matrix (team-lead.md, Enforcing the Rules): void the fabricated *gate*, re-run the real one, keep correct *code*; unwind a rogue commit. Backstopped by a `git log` author check (the guaranteed catch for any commit not authored by the team lead, however made). |
| `.claude/audit/skill-invocations.log` | `skill-tracker.js` (PostToolUse `Skill`) | One `{ts, agent, skill, token, session}` line per real skill invocation — the platform-logged fact (`tool_name === 'Skill'`, `tool_input.skill` = name), round-scoped by the `.pipeline-state` token | The **architect** done-check (Step 1): the **authoritative** source for the skill-conformance check. A plan-mapped non-`None` skill absent from the log (no documented deviation) Fails; a `## Skills Used` self-report not corroborated by the log is a fabrication → Fail; a missing `## Skills Used` section Fails structurally. All-`None` plans never Fail on an empty log. |

Neither breach is preventable by hook on a background subagent — the rule lives in the agent (ADR-14), the log makes the breach deterministically visible, and the gate Fails on the logged fact. Recoverable breaches (a fabricated gate over correct code) re-run the real gate; the unrecoverable one (a skipped skill — the code is already written) bounces the developer for a redo.

## Unattended Autonomy (additive mode) — verify gate, verify.json, review queue

Nexus runs unattended (`claude -p`, the `[UNATTENDED]` convention) as a **strictly additive mode** (ADR-30): a switch, not a rewrite. New behavior branches on `[UNATTENDED]`; with the flag off, attended is **byte-unchanged** (pinned by the `attended-unchanged.golden.test.mjs` golden test). The same machinery extends the detect-then-gate substrate above with a third always-on hook that **runs + records + is consumed** (rather than just records):

- **`.claude/verify.json` — the project's declared verify set (D1, AC-1.3/1.4).** Shape: `{ "commands": [ { "run": "…", "blocking": true|false } … ] }`. `blocking:true` commands gate the verdict; `blocking:false` are recorded but never flip a pass to fail. An **omitted `blocking` key defaults to `true`** (a command is blocking unless explicitly opted out with `blocking:false`). **Detection fallback** when the file is absent: the gate synthesizes a default set from the project's structure (this repo: a `tests/` node:test suite → `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`, plus `scripts/selfcheck.mjs` when present). Explicit config always wins; an absent or malformed file never crashes the hook.
- **`verify-gate.js` — the always-on advisory `SubagentStop` verify gate (ADR-31).** A net-new `SubagentStop` hook (matcher-less — Stop-family hooks take no tool matcher). When the **implementation** subagent (developer/solo) completes, it runs the resolved verify set and appends a verdict to `.claude/audit/verify-verdict.json` (`{ verdict: pass|fail, blocking_failed, commands, agent, token, … }`). It **never denies or blocks** — a blocking `SubagentStop` would trap a verify-failed subagent in an unsatisfiable retry loop (the spike's 14-fire pathology), so enforcement is by *consuming the recorded verdict*, never by a hook block. A recognized **non-impl** role's stop writes no verdict; an **absent/unrecognized** `agent_type` writes an `agent:"unknown"` record (never a silent skip — a written "couldn't classify" is recoverable; a silent no-write is a false-green). The hook **cannot read `[UNATTENDED]`** (a hook is a separate process) — it always runs and records the same way; the mode fork lives in the team lead.
- **The one fork — attended informs / unattended decides (AC-1.2).** One verify *execution* path (the hook); the only branch is *consumption*. **Attended:** the verdict informs the human/normal review (advisory). **Unattended:** the verdict *is* the decision — a `blocking_failed` verify-fail at the team lead's implementation-phase checkpoint **defers the item to the review queue**. The fail-defer is consumed **only at that checkpoint** (developer handed back `implementation.md`), never on an intermediate developer `SubagentStop` — a Step-1 red-test-authoring stop *correctly* records a `verdict:"fail"` (reds must fail), and that is a true-green advisory artifact the team lead does not act on.
- **`.claude/review-queue/` — the fail-closed sink (ADR-32, AC-3.1/3.2).** Unattended **never force-accepts or force-ships** — the worst case is "deferred." On a verify-fail, 3-cycle exhaustion, an unanswered load-bearing question, or a token-cap breach, the **team lead** (the queue's sole writer — the hook never writes it) drops one file per item, `.claude/review-queue/{slug}.md`, carrying the slug, the failing gate/reason, an audit-trail pointer (`verify-verdict.json` + `communication-log.md`), and a **resume instruction** wired to the ADR-19 idempotency state (`communication-log.md` Step/Cycle + `.pipeline-state`) so re-entry continues at the **failing phase** and does not re-run completed work. An `index.md` lists open items. The full convention and field list live in `team-lead.md` (Review Queue), which owns the runtime write.

This whole surface is **dormant in attended mode**: the verify gate's verdict is advisory (it changes no exit code and blocks nothing), the queue is written only on an unattended defer, and the golden test pins that the flag-off path is byte-identical to pre-v1.

## Agents

| Agent | Scope | Managed by |
|-------|-------|------------|
| team-lead | Pipeline orchestration, message routing, commit protocol | user |
| architect | Plans, Step 1 review (done check), question answers, escalation decisions | team lead |
| po | Feature shaping, spec writing, question answering | team lead |
| critic | Cross-reference review of specs, plans, and learner promotions | Current hub: PO/architect/learner when standalone; team lead in team mode |
| developer | Implementation, implementation.md, questions.md | team lead |
| reviewer | Step 2 review (code review), severity-rated conformance checks | team lead |
| learner | Lessons consolidation, pattern promotion to system files | team lead |
| solo | Small fixes and scoped changes (1-3 files) | user |

Agent models are baked into each agent's definition frontmatter — never override them.

## Pipeline Modes

The pipeline is not a rigid sequence — ceremony scales with uncertainty. Multiple entry points and team configurations exist.

### Entry Points

| Entry Point | First Agent | What's Skipped | Use Case |
|-------------|------------|----------------|----------|
| `be solo` | solo | Everything — no pipeline, no plan/review | Bug fixes, 1-3 file changes |
| `be architect` | architect | PO, spec, team orchestration | Refactoring plans, tech debt, one-off analysis |
| Team lead (existing plan) | developer | PO + architect planning | Plan already written via `be architect` |
| Team lead (full pipeline) | PO or architect | Nothing | Complex features needing discovery and alignment |

### Team Configurations

| Config | Agents | When |
|--------|--------|------|
| **Fast** | architect + developer (developer self-reviews via the review-format checklist → `## Self-Review` in implementation.md) | Well-understood patterns, internal tooling |
| **Standard** | architect + developer + reviewer | Production features, team alignment needed |
| **Standard+Codex** | architect + developer + reviewer + Codex (parallel independent cross-check, first review round only) | Complex analytics, full-stack changes, non-trivial filtering/pagination — when Codex is available |

### Key Principles

- PO phase is optional — architect can plan directly from incomplete tickets
- Critic is always optional with confirmation — never forced
- Solo handles its own scope — small improvements never enter the pipeline
- Known patterns get less process; novel work gets more

## Cycle Caps

| Loop | Max | Escalation |
|------|-----|------------|
| Reviewer ↔ Developer fix cycle | 3 | → Architect |
| Developer questions (same area) | 3 | → Human |
| Architect escalation resolution | 1 | → Human |

After escalation to human, agents STOP and wait.

## Artifact Formats

Nexus provides each artifact format as a skill or template. Agents reference the relevant
skill when producing an artifact:

| Artifact | Provided by |
|----------|-------------|
| Plan | `create-implementation-plan` skill |
| Implementation | `implementation-format` skill |
| Summary | `summary-format` skill |
| Questions | `questions-format` skill |
| Lessons | `lessons-format` skill |
| Review | `review-format` skill |

## Skill Authority

Nexus skills are the authoritative source for patterns.

- **Skill exists, project has what it needs:** Follow the skill.
- **Skill exists, project missing something it references:** Build it. Escalate to architect only if scope seems too large.
- **No matching skill:** Architect may inline snippets. Log the missing skill in lessons.md, under `## Skill Gaps` — see `lessons-format`.
