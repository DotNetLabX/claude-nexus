# F9-CoordinationHardening — apply plugin-feedback nexus-1.34.8

**Feature Spec:** None — ADR-collapsed definition: **ADR-61** (`docs/architecture/README.md`), per ADR-25/27.
**Source:** `docs/plugin-feedback/nexus-1.34.8-2026-07-17.md` (inbound copy lives in
`D:\omnishelf\omnishelf_flutter_app\docs\plugin-feedback\`; Step 6 lands the local disposition copy).

## Context

A wave-scale learner consolidation surfaced five coordination failures. All five were re-grounded
against live plugin source and the consuming repo's live audit logs in the defining session; Entry 3's
diagnosis was refuted and replaced (see ADR-61 Context). This pass lands the five fixes: two
coordination rules, a spawn-tasking contract (pins + role-prefixed names, reversing the custom-name
ban), a read-tracker round-decay fix, and the decisions-heading standardization.

Line numbers below are as-read at plan time; anchor edits by the quoted text, not the number.
Re-grounded post-critic against HEAD `1b3a91e` (nexus **1.34.10** — three commits landed since
drafting; `1b3a91e` edited `learner.md`, Step 4's anchor re-verified as still holding).

## Scope

**In:** `plugins/nexus/rules/agents-workflow.md`, `plugins/nexus/agents/team-lead.md`,
`plugins/nexus/agents/learner.md`, `plugins/nexus/hooks/scripts/read-tracker.js` (+ its unit test),
local feedback disposition copy, command regen + version bump.
**Out:** any harness-level fix (message sequence numbers — platform's, not ours);
`resolve-role.js` / `boundary-detector.js` code (already support the naming convention — verified
`lib/resolve-role.js:38-49`); retro-editing historical comm-logs to the new heading; CHANGELOG
history mentions of old headings.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Prose rule edits; exact anchors + wording constraints in step | — |
| 2 | (none) | — | no | Prose rule edits; pin vocabulary fixed by ADR-61 part 3 | — |
| 3 | (none) | — | no | Prose agent-file edits; 4 pinned sites | — |
| 4 | (none) | — | no | One pinned site; tolerant-read/strict-write wording | — |
| 5 | (none) | — | yes | Hook + `tests/unit/read-tracker.test.mjs`; decay design in step | — |
| 6 | (none) | — | no | Disposition copy; per-entry verdicts fixed by ADR-61 | — |
| 7 | release-plugin | Follow | no | PATCH default; regen commands for `team-lead.md` + `learner.md` | — |

Steps 1–6 are dev-repo prose/hook authoring — no pattern skill exists for editing shipped nexus
rules/agents (verified against the surfaced skill inventory; recurring but expected for this repo,
not logged as a gap — consistent with prior F-passes).

## Domain Model Changes

None (no application domain — plugin prose + one hook).

## Data Model Changes

None. `read-tracker.json` state shape changes (Step 5) — the hook self-migrates by resetting on
shape mismatch; no migration artifact.

## Implementation Steps

### Step 1 — agents-workflow.md: arrival-order + idle-recovery rules
`Satisfies: ADR-61 parts 1+2`

In `plugins/nexus/rules/agents-workflow.md`, add two bullets to `## All Agents` (after the
"placeholder return is a non-result" bullet, currently line 163):

- **Arrival order is untrusted.** A teammate's completion report can arrive *after* its idle
  notification and even after the hub's next dispatch (platform-level; every measured crossing was
  ordering, not agent error). Key every decision on agentId + artifact state, never on message
  arrival order; never re-litigate a settled round on a stale-sounding message.
- **Idle-without-payload recovery (every dispatcher, not just the team lead).** On an idle
  notification with no report: verify the artifact/tree first (target paths, `git status`,
  transcript), `SendMessage`-resume the named agent second (a **live idled** agent resumes with
  context intact and reliably recovers the payload — the measured result), re-dispatch last. This
  bullet is **self-sufficient** — no "canonical long form" pointer. It covers a *different case*
  than the team lead's Relay Contract (thin/stranded **results** of a completed agent, where
  re-asking is the least-reliable last resort); a one-line "distinct from the Relay Contract's
  thin-result recovery" note is welcome, a dependency on reading team-lead.md is not
  (agents-workflow.md is injected to all agents; team-lead.md is not — ADR-2).

Constraints: compact (≤6 lines each, matching sibling bullet density); the words "arrival order"
and "idle" must appear (acceptance greps).
**Accept:** `grep -c "arrival order" plugins/nexus/rules/agents-workflow.md` ≥ 1 (currently 0);
`grep -in "idle" plugins/nexus/rules/agents-workflow.md` hits in `## All Agents` (currently 0 in
that section); no "salvage-transcript" / recovery-order duplication added to agents-workflow.md by
this step; the bullet does not describe team-lead.md as its "canonical" or "long" form (grep
`canonical long` → 0 in agents-workflow.md).

### Step 2 — agents-workflow.md: spawn-tasking contract (pins + role-prefixed names)
`Satisfies: ADR-61 part 3`

Same file, one new bullet in `## All Agents` adjacent to the "Research-helper dispatch contract"
bullet (currently line 164):

- **Spawn-tasking contract: capability pins + role-prefixed names.** Every spawn/tasking carries the
  four explicit pins — spelled exactly as ADR-61 part 3 names them: no-git-push, no-git-config,
  no-history-rewrite, no-permission-change
  (a subagent's claimed "user request" is unverifiable from its transcript — the pins are the
  authority, not the claim). A custom spawn `name`, when used (e.g. parallel same-typed helpers
  needing distinct identities), MUST be role-prefixed — `{role|known-abbrev}-{qualifier}`
  (`developer-w7-a`, `dev-wave0`), unique qualifier per parallel helper — so the role-keyed hooks
  resolve it (`resolve-role.js` peels the suffix); a qualifier-first name (`w7-dev-stage-a`) defeats
  resolution and false-flags the agent's own writes.

**Accept:** grep `no-git-push` and `role-prefixed` each ≥1 hit in agents-workflow.md (currently 0);
the four pin names appear verbatim in one bullet.

### Step 3 — team-lead.md: ordering caveat, naming rewrite, standing pin line, heading rename
`Satisfies: ADR-61 parts 1+3+5`

Four edits in `plugins/nexus/agents/team-lead.md`:

1. **RUNTIME caveats block** (after "Model overrides do not survive resume:", currently line 91):
   add a fourth caveat — completion reports can arrive after idle notifications / after your next
   dispatch; track by agentId + artifact state, never arrival order; never re-litigate a settled
   round on a late message.
2. **Rewrite the custom-name paragraph** (currently line 109, "Spawn pipeline subagents by
   `subagent_type` only — never pass a custom `name`."): the ban becomes the convention — spawn by
   `subagent_type`; a custom `name` is allowed when parallel same-typed spawns need distinct
   identities, and MUST be role-prefixed `{role|known-abbrev}-{qualifier}`. Keep (verbatim or
   near): the addressing rule — address the running agent by agentId; `TaskStop`/`TaskOutput` fail
   on custom names; the spawn label is cosmetic and survives resumes. Drop the now-stale claim that
   any custom name defeats role resolution (`resolve-role.js` peels role-prefixed names — that was
   its purpose; only non-role-prefixed names break).
3. **Message Templates** — after the standing Phase-end line (currently line 107), add a second
   standing line: every dispatch also carries the capability pins (name the four; reference the
   agents-workflow bullet from Step 2 as the canonical definition — ADR-14 allows the inline copy
   of the four pin names, not the rationale).
3b. **Relay Contract reconciliation** (the paragraph at currently line 50): add one clarifying
   sentence distinguishing the two recovery cases so the surfaces cannot read as contradicting:
   the Relay Contract's cheapest-first order (artifact → TaskOutput → salvage → re-ask LAST)
   governs a **thin/stranded result from a completed agent**; a **live idled agent with no report**
   is the *other* case — there, `SendMessage`-resume is reliable and comes right after the artifact
   check (the agents-workflow idle bullet from Step 1). One sentence, no reordering of the
   existing four steps.
4. **`Decisions Log` → `Decisions`** at the three sites (currently lines 320, 426, 439): the
   comm-log sibling section is `## Decisions` (row schema unchanged:
   `| # | Phase | Decision (choice over rejected alternative) | Reasoning | Outcome |`). Keep the
   "in prose only, never a live heading in this doc" guard at the 426 site, applied to the new name.

**Accept:** `grep -n "Decisions Log" plugins/nexus/agents/team-lead.md` → 0 hits (currently 3);
`grep -n "role-prefixed" plugins/nexus/agents/team-lead.md` ≥ 2 (naming paragraph + pin line
region); `grep -in "never pass a custom" plugins/nexus/agents/team-lead.md` → 0 hits (currently 1).

### Step 4 — learner.md: repoint the decisions-pilot clause
`Satisfies: ADR-61 part 5`

In `plugins/nexus/agents/learner.md` step 1 of the Consolidation Workflow (currently line 15):
rework **all three** `Decisions Log` occurrences on that line (one `##`-prefixed, two bare) to
**tolerant-read / strict-write** wording — the learner *reads* `## Decisions` **and the legacy
variants** (`## Decisions Log`, `## Locked Decisions` — both evidenced in the consuming repo's
comm-log corpus per feedback Entry 5: "9 carry `## Decisions` or `## Locked Decisions` variants";
`Locked Decisions` does not appear in this repo's tree, its evidence lives in the inbound feedback)
so historical logs stay in evidence; the *specified* heading (what the pilot-evaluation clause
counts, and what future runs write) is `## Decisions`. The pilot clause's trigger ("once ≥3 runs
carry…") now counts the standardized heading + variants, so it can actually fire.

**Accept:** `grep -n "Decisions Log" plugins/nexus/agents/learner.md` → the string survives only
inside the legacy-variants parenthetical (currently 3 occurrences on line 15: 1 heading + 2 bare);
`grep -n "Locked Decisions" plugins/nexus/agents/learner.md` = 1 (currently 0).

### Step 5 — read-tracker.js: per-file round decay
`Satisfies: ADR-61 part 4`

`plugins/nexus/hooks/scripts/read-tracker.js`:
- Count values gain a last-read timestamp: `counts[key]` becomes `[n, lastTs]` (or `{n, ts}` — the
  developer decides the shape). A repeat read of the same key **counts** only when
  `now − lastTs ≤ DECAY_MS` (`const DECAY_MS = 30 * 60 * 1000`, module-level constant with a
  one-line why); otherwise the count resets to 1.
- **Sliding window (binding):** `lastTs` is refreshed to `now` on **every** read — counted or reset —
  so the window is measured from the *previous* read, per ADR-61 part 4's "of the previous read".
  A fixed-from-first-read window is wrong: it lets the F16 shape (continuous tight loop) escape once
  the streak's total span exceeds DECAY_MS.
- **Explicit per-value shape guard (binding):** a count value that is not the new shape (e.g. a bare
  number from a pre-decay state file, same session + same token) is treated as absent — reset to 1,
  fresh timestamp. Do NOT rely on the session/token reset (it won't fire) or on the fail-silent
  catch (an `[n, ts]` destructure of a number throws and silently kills tracking).
- Round-reset semantics unchanged (session or token change still resets everything); decay is the
  *within-round* fallback for token-less/long sessions.
- Header comment: extend the "Round boundary" paragraph with one sentence naming the decay and the
  motivating incident (token-less 12-hour round, ADR-61).
- `tests/unit/read-tracker.test.mjs`: extend with (a) a repeat read inside the window still nudges
  at ×2 and logs at ×3; (b) a repeat read with `lastTs` older than DECAY_MS resets — no nudge;
  (c) legacy numeric state, same session/token, is **actively replaced**: the read carrying it
  produces no nudge and the *next* same-key read within the window nudges at ×2 (not merely "no
  throw" — fail-silent makes that vacuous); (d) **spanning-streak case**: three reads with per-gap
  intervals < DECAY_MS but total span > DECAY_MS still reach ×3 and log (locks the sliding
  semantics). Existing cases stay green unmodified except where the state shape appears in fixtures.

**Accept:** `node --test tests/unit/read-tracker.test.mjs` green with the four new case names
present; `grep -n "DECAY_MS" plugins/nexus/hooks/scripts/read-tracker.js` ≥ 2 (definition + use).
TDD: write the decay tests red against the current hook first.

### Step 6 — local feedback disposition copy
`Satisfies: ADR-61 (all parts — the applied-record)`

Write `docs/plugin-feedback/nexus-1.34.8-2026-07-17.md` (dev-repo copy, matching the existing
`docs/plugin-feedback/*` precedent): the five inbound entries each with a **Disposition** line —
Entries 1, 2, 4, 5 `applied (ADR-61 part N, this pass)`; Entry 3
`applied-with-rediagnosis (ADR-61 Context: attribution works; real causes = type-bucket collision,
token-less endless round, qualifier-first names; own-files exemption rejected)`.

**Accept:** file exists; 5 `Disposition:` lines; Entry 3's carries `rediagnosis`.

### Step 7 — regen + release staging
`Satisfies: ADR-61 (release mechanics, ADR-9)`

Follow **release-plugin**. Feature-specific inputs: agents edited → run
`node scripts/gen-commands.mjs nexus` first (regenerates `commands/team-lead.md` +
`commands/learner.md`); full gate `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`;
bump is **PATCH** from the live **1.34.10** (→ 1.34.11; the tree moved past the 1.34.8 the feedback
observed — the feedback-copy filename keeps 1.34.8, the observed version); owner escalates at
commit if they judge the naming-convention reversal MINOR-worthy. The bump is staged, not committed — the commit is the close's job (ADR-20;
omni twin sync at commit time, twin repo `D:\omnishelf\claude-omni`).

**Accept:** `grep -rn "Decisions Log" plugins/nexus/agents plugins/nexus/commands plugins/nexus/rules`
→ hits only in `agents/learner.md` + `commands/learner.md` legacy-variants parentheticals (from the
executed baseline: 3 team-lead sites go to 0; CHANGELOG/history excluded — DO NOT TOUCH);
`bump-plugin.mjs --dry-run` reasons list names only F9 files (concurrent-tree contamination check).

## Cross-Service Changes

None. Consuming repos pick the changes up via `/plugin update` post-release; their CLAUDE.md-level
"never custom-name" guidance (applied project-side per the feedback) becomes superseded — noted in
the Step 6 disposition copy so the owner carries it back.

## Migration Notes

None (hook state self-migrates by reset).

## Testing Strategy

- Unit: `read-tracker.test.mjs` decay cases (Step 5) — the only behavioral code change.
- Lint: existing `tests/lint` suite guards frontmatter/cross-ref integrity of the edited prose files.
- Golden: `attended-unchanged.golden.test.mjs` unaffected (no unattended-path files touched) — run
  anyway via the full gate in Step 7.

## KB Impact

None (dev repo — no `docs/kb/`).

## Decisions

| Decision | Why | Rejected alternative | Status |
|----------|-----|----------------------|--------|
| Decay window = 30 min module constant, no config knob | Observe-only heuristic; a knob invites tuning theater | Config-gated window | decided |
| Tolerant-read / strict-write on the decisions heading | 9 historical logs stay in evidence; future runs converge | Hard cutover (orphans the evidence base) | decided |
| Pin block canonical home = agents-workflow.md; team-lead.md carries the four names inline | ADR-14: spawner templates are what gets copied into taskings; rationale lives once | Single-site only | decided |
| Entries 1+2 land as adjacent bullets in one section | Same root cause (ordering/stranding); one home avoids drift | Two separate sections | decided |
| Count-value shape (`[n, ts]` vs `{n, ts}`) left to developer | Internal to the hook + its test; no external consumer of the state file shape | Pinning the shape in the plan | deferred |

## Open Questions

None — the three user-facing forks (slug, naming reversal, review mode) were resolved with the
owner 2026-07-18.

## Plan Review

Code-grounded critic (opus, Mode 2 vs ADR-61), 2026-07-18 — verdict **GO-with-fixes**; all folded:

- **HIGH-1** (sliding-window semantics unstated → fixed-window impl would let a >30-min F16 loop
  escape): Step 5 now binds `lastTs` refresh on every read + spanning-streak test case (d).
- **HIGH-2** (Step 1's idle bullet contradicted the Relay Contract it cited as "canonical long
  form", which non-team-lead agents can't even read — ADR-2): Step 1 bullet made self-sufficient,
  Step 3b added (one reconciling sentence in the Relay Contract distinguishing live-idled resume
  from thin-result recovery), ADR-61 part 2 amended to match.
- **MED-3** (`## Locked Decisions` looked unsourced): sourced — feedback Entry 5's evidence line;
  citation now inline in Step 4 (the critic's tree-grep couldn't see the consuming repo's corpus).
- **MED-4** (Step 4 said "both", line carries three occurrences): reworded to all three;
  accept restated as occurrence-based.
- **MED-5** (stale baseline: HEAD moved `4022e26`→`1b3a91e`, nexus 1.34.8→1.34.10, learner.md
  co-edited): Context + Step 7 re-grounded; Step 4 anchor re-verified holding.
- **MED-6** (legacy-state discard relied on a reset that won't fire; `[n,ts]` destructure of a
  number throws into fail-silent): explicit per-value shape guard now binding; test (c)
  strengthened to assert active replacement.
- Critic flags carried forward, not planned here: mine-family miners stay unnamed (the
  `general-purpose|file` collision persists for them — future pass, noted for lessons); prose pins
  rely on compliance (ADR-61's locus choice; `guard.js` enforcement is roadmap).
