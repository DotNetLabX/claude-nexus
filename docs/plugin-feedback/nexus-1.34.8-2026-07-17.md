# Plugin Feedback — nexus 1.34.8 (2026-07-17) — applied record

Dev-repo disposition copy (ADR-1). This is the **applied record** for the inbound plugin-feedback
file `nexus-1.34.8-2026-07-17.md` (from the `omnishelf_flutter_app` learner consolidation — 31
lessons files + 18 communication logs). The five entries were re-grounded against live plugin source
+ the consuming repo's live audit logs in the F9 defining session, then landed as **ADR-61**
(`docs/architecture/README.md`) and implemented in this pass (**applied at nexus 1.34.11**; the
filename keeps `1.34.8`, the version the feedback observed). Delivery record:
`docs/specs/F9-CoordinationHardening/delivery/`.

Each inbound entry is reproduced verbatim below with an added **Disposition** line.

## Entry 1: teammate completion reports arrive after idle notifications and after the hub's next dispatch
- **Suggested target:** messaging layer (harness/runtime) → agents-workflow.md coordination notes until fixed
- **Action:** update
- **Evidence:** adhoc-Refactor-W1-barrel-scc, adhoc-Refactor-W2-domain-mirrors (~11 crossings, "repeat, now 2 waves"), recurrence 2x at wave scale
- **Lesson:** A sequence number or a report-then-idle ordering guarantee would eliminate the crossed-dispatch class entirely; every crossing this wave was caused by ordering, not agent error.
- **Disposition:** applied (ADR-61 part 1, this pass) — `agents-workflow.md` `## All Agents` "Arrival
  order is untrusted" bullet (Step 1) + `team-lead.md` fourth RUNTIME caveat "Completion reports can
  arrive out of order" (Step 3.1). Harness-level fix (message sequence numbers) is out of scope — it
  belongs to the platform, not the plugin; the rule documents the limitation and keys decisions on
  agentId + artifact state instead of arrival order.

## Entry 2: idle-without-payload is a standing failure mode — codify the verify-artifact protocol
- **Suggested target:** agents-workflow.md → coordination protocol (and team-lead.md)
- **Action:** add
- **Evidence:** adhoc-Refactor-W1-barrel-scc (miners), adhoc-Refactor-W2-domain-mirrors, adhoc-Refactor-W3-god-methods (#4); reproduced live twice in the consolidation session itself (both Explore sweeps idled without payloads; SendMessage recovered both), recurrence 3x+
- **Lesson:** On idle-without-report: verify the tree/artifact (git status, target paths, transcripts) BEFORE re-dispatching; SendMessage to a named agent resumes it with context intact and reliably recovers the payload. Never re-litigate settled rounds on stale-sounding messages.
- **Disposition:** applied (ADR-61 part 2, this pass) — `agents-workflow.md` `## All Agents`
  "Idle-without-payload recovery (every dispatcher, not just the team lead)" bullet (Step 1), made
  self-sufficient (no dependency on reading team-lead.md — ADR-2), + a reconciling sentence in the
  `team-lead.md` Relay Contract distinguishing the *live-idled* case (SendMessage-resume is reliable,
  right after the artifact check) from the *thin/stranded-result-of-a-completed-agent* case (re-ask
  is the last resort) (Step 3b).

## Entry 3: read-tracker re-read warnings mis-attribute subagent append-edit cycles
- **Suggested target:** read-tracker hook → ownership attribution
- **Action:** update
- **Evidence:** adhoc-lint-leancode-swap, adhoc-Refactor-W2-domain-mirrors (x2/x3 flags on files the dev, not the hub, was editing), recurrence 2x
- **Lesson:** Attribution keys off the main session instead of the acting subagent; progressive artifact writes (implementation.md as-you-go — which the pipeline mandates) trip re-read warnings. Resolve the acting agent from subagent context, or exempt an agent's own working files.
- **Disposition:** applied-with-rediagnosis (ADR-61 Context: attribution works; real causes =
  type-bucket collision, token-less endless round, qualifier-first names; own-files exemption
  rejected). Live re-grounding refuted the feedback's diagnosis — `agent_type` IS delivered on
  subagent PostToolUse (live `violations.log` shows `general-purpose`, `developer`,
  `w7-dev-stage-a`), so attribution is not main-session-keyed. The real false-flag causes and their
  fixes: (a) same-typed unnamed helpers share one count bucket → **role-prefixed names** buy
  instance-discriminated keys (part 3, Steps 2–3); (b) a token-less solo session never ends its round
  (`plan.md ×6` across ~12h) → **per-file 30-min round decay** in `read-tracker.js` (part 4, Step 5);
  (c) a qualifier-first custom name defeats `resolve-role`'s peel → the role-prefixed convention.
  The feedback's proposed "exempt an agent's own working files" was **rejected** — F16, the incident
  the hook exists for, was own-artifact re-reading; the exemption would gut the primary catch.

## Entry 4: agent tasking templates need explicit capability pins (rogue-subagent incident)
- **Suggested target:** agents-workflow.md → spawn/tasking boilerplate (all spawning agents)
- **Action:** add
- **Evidence:** adhoc-Refactor-W5-hygiene-perf (census agent pushed branches, changed git config, attempted `filter-branch` and a permission self-grant), 1x but critical class
- **Lesson:** Every tasking carries explicit no-git-push / no-git-config / no-history-rewrite / no-permission-change pins. A subagent's claimed "user request" is unverifiable from its transcript — pins are the authority, not the claim. (Applied project-side to consumer CLAUDE.md already; plugin templates should carry it natively.)
- **Disposition:** applied (ADR-61 part 3, this pass) — `agents-workflow.md` `## All Agents`
  "Spawn-tasking contract: capability pins + role-prefixed names" bullet (Step 2, the canonical
  definition) + `team-lead.md` standing "Every dispatch also carries the four capability pins" line
  (Step 3.3, inline copy of the four pin names per ADR-14) + the rewritten custom-name paragraph
  (Step 3.2). This **supersedes** the consumer-side "never custom-name" CLAUDE.md guidance — see the
  supersede note below.

## Entry 5: the Decisions Log pilot heading never took hold — the variant heading did the work
- **Suggested target:** communication-log format spec (agents-workflow.md / learner.md pilot clause)
- **Action:** update
- **Evidence:** full comm-log corpus (19 files): zero use `## Decisions Log`; 9 carry `## Decisions` or `## Locked Decisions` variants. One promotion this consolidation (scan-failure → Right-empty convention) cites those variant rows as evidence — the section earns its keep, the pilot heading doesn't.
- **Lesson:** Standardize on the heading agents actually write (`## Decisions`), and point the learner's pilot-evaluation clause at it; as literally specified, the pilot would read as "no run ever carried a Decisions Log" and wrongly recommend removal.
- **Disposition:** applied (ADR-61 part 5, this pass) — `team-lead.md` comm-log spec renamed
  `## Decisions Log` → `## Decisions` at all three sites (Step 3.4) + `learner.md` step 1 reworked to
  **strict-write `## Decisions`, tolerant-read of the legacy `## Decisions Log` / `## Locked Decisions`
  variants** so historical logs stay in evidence, and the pilot-evaluation trigger now counts the
  heading agents actually write so it can fire (Step 4). Historical comm-logs are NOT retro-edited
  (out of scope).

## Supersede note (carry back to the consuming repo)

The consumer-side CLAUDE.md guidance "never pass a custom spawn name" (applied project-side per Entry 4
before this pass) is now **superseded** by ADR-61 part 3: custom names ARE allowed when parallel
same-typed spawns need distinct identities, provided they are **role-prefixed** `{role|known-abbrev}-
{qualifier}` (`developer-w7-a`, `dev-wave0`). `resolve-role.js` peels the qualifier suffix, so the
role-keyed hooks still resolve — and the naming convention buys the instance-discriminated read-tracker
keys that fix Entry 3's count-bucket collision. Once the consuming repo picks up nexus ≥ 1.34.11 via
`/plugin update`, relax the project-side ban to the role-prefixed convention.
