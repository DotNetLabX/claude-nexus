# nexus — Changelog


## [1.38.0] — 2026-07-20
**Architecture miner — the eleventh mine (F16-ArchitectureMiner, ADR-67).** New shipped skill
`mine-architecture`: repo-scoped, skeptic-verified current-state architecture map — four clean-room
dimensions (boundaries/context map, EARS-phrased business-function catalog with file:line
traceability, data ownership, contracts/seams), a BR-coverage join (`none` / `no-registry-estate`
grammar), and the adversarial skeptic re-execution gate; output `docs/architecture-map/` in the
target repo (sixth registry species). Extraction-only by owner decision — zero target-design
content, enforced by the mandatory `Current-state only` header + decided-architecture pointer
line. Full method-contract family member (reference-model staging shape). Family core and the
seven sibling SKILL.mds swept ten → eleven (positional ordinals untouched).

## [1.37.0] — 2026-07-19
- MINOR bump.
  - skill change (mine-algorithm)
  - skill change (mine-design)
  - skill change (mine-reference-model)
  - skill change (mine-skill-candidates)
  - skill change (mine-skill-gaps)
  - skill change (mine-verify-cover)
  - skill change (mine-verify-flows)
  - skill change (mine-verify-repo)
  - owner-escalated to minor

## [1.36.1] — 2026-07-18
**Table-first output (owner directive).** The `status-table-format` rule broadens from
status-questions-only to ALL enumerable user-facing content: statuses, options, findings, next
steps, remaining work, comparisons, and per-item verdicts render as compact Markdown tables,
never bulleted/numbered lists — with table hygiene (≤~5 columns, short cells, explanations in
surrounding prose) so terminals render them intact. The status-specific three-column case is
retained as a subsection; the filename is unchanged (its `commands/backlog.md` reference still
resolves).
  - rule (injected every session)

## [1.36.0] — 2026-07-18
**Skill-gap miner — the ninth mine (F10-SkillGapMiner, ADR-63).** New shipped skill
`mine-skill-gaps`: sweep ONE repo's `docs/specs/*/delivery/` estate (plan.md + lessons.md) for
recurring uncovered work and emit a skeptic-verified, evidence-ranked skill-candidate registry at
`docs/skill-gaps/registry.md`. Two-tier discovery — Tier A greps pre-flagged `## Skill Gaps` lessons
entries as candidates-of-record (`gap:` cells corroborate only, orphan cells surface as capture
leaks); Tier B clusters unflagged `(none)` skill-mapping rows by task-shape at a 3-plan threshold.
A fresh-context skeptic kills coincidental clusters; the owner triages `candidate → confirmed` and
routes confirmed candidates to improve-skills (the miner never builds or auto-routes). Joins the mine
family by **name and shape** — no stack adapter, no toolchain, no capability contract
(mine-reference-model precedent). The family core becomes nine-member (family table 9th row + the
member-count sweep across the six siblings).
  - new skill (mine-skill-gaps) — new capability
  - family-membership sweep: mine-family-core.md + mine-algorithm / mine-design /
    mine-reference-model / mine-verify-cover / mine-verify-flows / mine-verify-repo (eight → nine)
  - owner-escalated to minor (new user-facing capability: a new shipped skill)

## [1.35.0] — 2026-07-18
**Mine machinery borrow wave 2 (F7-MineMachineryBorrowWave2).** The enforcement gate battery now
ships target-agnostic inside mine-verify-cover (`tools/` — cover-gates, evidence-gate,
kickoff-preflight) and runs in place from the version-keyed plugin cache (ADR-62 invoke-in-place);
registry/KB writes are evidence-gated at every chokepoint (structural predicate: empty, claim-echo,
no-reexecution-content); the kickoff checklist is now a blocking two-tier preflight ("Wired-but-
advisory" superseded); stage completion is mechanized (run journal + stage watcher, "poll don't
wait" consolidated to one canonical); the marginal-budget rail gains cross-session resume and the
runway forecast; S6 evidence: BugRatio recall golden set 3/3 = 100% with independent-oracle
curation.
  - skill change (mine-verify-cover)
  - skill change (mine-verify-repo)
  - owner-escalated to minor (new capability: shipped enforcement runtime)

## [1.34.11] — 2026-07-18
**Coordination hardening from field feedback (ADR-61 / F9-CoordinationHardening).** A wave-scale
learner consolidation surfaced five recurring coordination failures, re-grounded against live plugin
source + the consuming repo's audit logs (Entry 3's diagnosis was refuted and replaced). Five fixes,
each at its cheapest non-decaying locus:
- `rules/agents-workflow.md` — two new `## All Agents` bullets: **arrival order is untrusted**
  (completion reports can arrive after idle notifications / the next dispatch — key on agentId +
  artifact state, never arrival order) and **idle-without-payload recovery** for every dispatcher
  (verify artifact → SendMessage-resume → re-dispatch), plus a **spawn-tasking contract** bullet
  (the four capability pins no-git-push / no-git-config / no-history-rewrite / no-permission-change +
  the role-prefixed custom-name convention `{role|known-abbrev}-{qualifier}`).
- `agents/team-lead.md` — a fourth RUNTIME caveat (out-of-order completion reports); the custom-name
  paragraph **reverses the outright ban into the role-prefixed convention** (`resolve-role.js` peels
  the qualifier suffix; only qualifier-first names break resolution); a standing dispatch line
  carrying the four pins; a reconciling sentence in the Relay Contract distinguishing live-idled
  resume from thin-result recovery; and the comm-log `## Decisions Log` → `## Decisions` rename.
- `agents/learner.md` — the decisions-heading pilot clause repointed to **strict-write `## Decisions`,
  tolerant-read of the legacy `## Decisions Log` / `## Locked Decisions` variants**, so historical
  logs stay in evidence and the ≥3-runs pilot trigger can actually fire.
- `hooks/scripts/read-tracker.js` — **per-file round decay**: a repeat read counts only within a
  30-min sliding window of the previous read of the same file (`DECAY_MS`), else the count resets;
  an explicit `[n, lastTs]` shape guard treats legacy/foreign values as absent. Bounds a token-less
  hours-long round without weakening the F16 tight-loop catch. (+4 decay tests.)
- `commands/team-lead.md`, `commands/learner.md` — regenerated.

## [1.34.10] — 2026-07-18
**Close the learner's consolidation loop with a commit step.** The Consolidation Workflow ended at
the run stamp (step 8), so a completed consolidation left every promoted file — conventions,
CLAUDE.md, project-local skills, the plugin-feedback file, the `[APPLIED]`/`[TRACKED]` tag edits —
uncommitted, stranding the promotions locally.
- `agents/learner.md` — new step 9 **Commit the consolidation**: standalone, stage only the files
  the run touched (never `git add -A`), one commit on the current branch, message
  `docs(learner): consolidation {date} — {summary}`; as a team subagent, hand the staged-file list
  back to the team lead (commits are team-lead-owned); push stays owner-owed — never push (the
  guard hook blocks force-push always and any push in hardened mode).
- `rules/agents-workflow.md` — the commit-ownership line's "sole exception" (standalone architect)
  becomes "exceptions", adding the standalone learner's consolidation commit.
- `commands/learner.md` — regenerated.

## [1.34.9] — 2026-07-18
**Back-port the first consumer's FL-2 verification-rescan feedback into `mine-verify-flows`**
(hand-carried in the omni twin 2026-07-15, now canonical; 17-device-run calibration). Five
guidance additions, all evidence-cited: (1) scrub token numbering must not depend on the document
position of excluded content — first-seen-order across excluded subtrees produces phantom
`{Path_A}`↔`{Path_B}` swap diffs in gated fields; (2) ranked below-the-winner candidate lists
(alternative-SKU/OCR tails) are excluded-by-class from the start — gate the winner, never the tail
(2nd occurrence); (3) when a verify pair fails on a field DERIVED from an already-excluded
instability, enumerate the root cause's whole downstream surface and cut it in one pass, then run
N uncounted flush runs before restarting the formal verify counter; (4) "accept the flake" is a
legitimate third verdict at non-convergence — keep a core-value field gated with a documented
flake signature + rerun-once policy; (5) an exclusion baseline transfers only for shared output
files — every NEW file family adds a calibration round (2nd occurrence). Plus a stage recipe:
identical-replay fixtures on verification-semantics flows assert the FAIL branch — name the
expected verdict, never default to the happy path.
  - skill change (mine-verify-flows)

## [1.34.8] — 2026-07-16
- Agent model retier: po/architect/reviewer move to fable; developer/solo/data-analyst move to opus.
  - agent instruction/behavior change

## [1.34.7] — 2026-07-16
**Closes four verified mine-family Cover-arm enforcement gaps (R1/R2/R3/R5) — resume wiring, the
skeptic's evidence excerpt landing in the KB row, a capability-contract conformance test, and an
honest clean-room tier disclosure (R4, shipping the gates, is spike-gated and not in this release).**

- **R1 — resume wiring documented.** `mine-family-core.md`'s shared safety-rails list gains a
  "capture the `runId` at launch; resume, don't restart" bullet: relaunch a killed/hung `Workflow`
  with `resumeFromRunId` instead of from scratch (proven 2026-06-23, ~193k tokens saved), same-session
  only.
- **R2 — the skeptic's evidence now reaches the registry row.** `mine-family-core.md`'s `##
  Skeptic protocol` scoping note is corrected: the cover code-arm's rule-verify carries the excerpt
  into the registry row (a distinct obligation from the mutation gate's test verification), instead
  of being exempted from the section entirely.
- **R3 — capability-contract conformance (ADR-60).** A new CI-gated test asserts every stack adapter
  (`mine-verify-cover-{dotnet,php,cpp,flutter}`) fills all 5 method capabilities with a named
  executor, with an adversarial fixture proving the check can fail.
- **R5 — clean-room tier disclosure.** `mine-verify-cover/SKILL.md` now states plainly that the
  miner clean-room is prompt-enforced, not a mechanical guarantee, pending upstream platform support.

## [1.34.6] — 2026-07-15
**A detected skill gap's binding record is now `lessons.md` `## Skill Gaps`, in a fielded form one
skill owns — every producer surface references it, none restates it, and the plan's `Gap?` column
gets the vocabulary that makes "marker, not the record" true instead of nominal (ADR-59).**

- **`lessons-format` gains the fielded `## Skill Gaps` entry template** — `{Suggested skill name}` /
  `Kind` (missing | ill-fitting) / `Searched for` / `Why it would help` / `References` / `Evidence` — as
  a new fenced block mirroring the existing `### Improvement Proposal` precedent. The
  Provenance-&-strengthen-don't-duplicate rule now also covers a gap entry's `Evidence:` line, so a
  recurring gap strengthens one entry instead of spawning a twin.
- **`architect.md`'s after-review-cycle trigger now names `## Skill Gaps` explicitly.** A step whose
  Skill Mapping disposition is `None` after the "Skill verification before setting None" sub-protocol is
  a *verified* gap — the architect logs it in the same lessons.md pass the plan's `Gap?` column is a
  plan-local marker only, never the binding record.
- **`solo.md` gains a lessons mandate it never had** — `skills: lessons-format` frontmatter plus a new
  `## Lessons` section obligating `## Solo Lessons` and `## Skill Gaps` before finishing. Solo owns the
  highest-volume lane in this repo (ADR-58) and previously carried no lessons obligation at all.
  Forward-looking: the 1-of-54 historical `## Solo Lessons` corpus predates ADR-58's `adhoc-*`
  solo-only rule by construction.
- **`developer.md`'s duplicate field list is slimmed to a reference** — `lessons-format` is now the
  one owner of the fields; the `**Log skill gaps**` trigger survives, and the missing-vs-ill-fitting
  split survives as the template's `Kind` flag (the two cases' distinct diagnostic sub-fields from the
  old inline list do not carry over 1:1 — see the feature's carry-over finding).
- **The four scattered routing phrasings collapse to one reference** — `create-implementation-plan`'s
  `None`-disposition bullet, `plan-template.md`'s Disposition rules, and `agents-workflow.md`'s
  "no matching skill" sentence all now point at `lessons.md` `## Skill Gaps` per `lessons-format`
  instead of four different half-sentences.
- **The `Gap?` column gets a fixed two-value vocabulary** — `gap: {what's missing}` or `—`. An
  enumeration of 33 plans found five incompatible uses in the column (gap declarations, non-gap
  dispositions, confidence ratings, owner assignments, bare booleans); this is why two independent
  attempts to count the leak this feature fixes each produced a different wrong number before the
  vocabulary existed.
- **ADR-59** records the decision and the measured leak: 4 of 11 plans that explicitly directed a
  skill-gap log shipped no `## Skill Gaps` section, plus ≥6 more that declared a gap and directed no
  log at all (`adhoc-PipelineHardening`: 9 gap cells, 0 captured).
- Regenerated commands: `architect.md`, `developer.md`, `solo.md`.

## [1.34.5] — 2026-07-14
**The skill-conformance gate stops calling a mis-recorded real invocation a fabrication — without
giving back an inch of discretion. Plus ADR-18 gains the test-implementation.md clause.**

- **Skill conformance splits by a log-window test** (`architect.md` done-check + **ADR-24** Gate A).
  The gate previously Failed any self-reported invocation absent from the log, full stop. It now
  distinguishes two genuinely different things: a skill absent from the log **and** from the whole
  scoped run window is **true non-invocation → Fail** (ADR-24's unrecoverable breach #2, unchanged in
  spirit); a skill absent for that step **but present elsewhere in the window** was **really invoked
  and merely mis-recorded → Deviated-with-reason**. The observed case: `tdd` legitimately invoked at
  Step 4, applied from memory at Step 6 and self-reported there — bad bookkeeping, not a fabricated
  gate. A **missing `## Skills Used` section is still a hard Fail**, unchanged.

  The split is deliberately **mechanical** — "is the skill anywhere in the scoped window?" is a grep,
  not a judgment — so it does **not** restore the architect discretion ADR-24 removed on purpose.

- **The crash-resume edge case is now named** (`architect.md`, at the scoping paragraph). A crash can
  log a step's invocation under the run that *started* it rather than the one that finished it.
  Token-keying already dodges this — the window is keyed by `.pipeline-state` token, so it spans every
  run sharing that token — but the text never said so, leaving a reader free to narrow the query to the
  current session and reintroduce the bug. It now says so.

- **ADR-18 gains the `test-implementation.md` clause.** Non-developer implementer agents (a
  test-authoring agent such as an integration-tester) write
  `docs/specs/{slug}/delivery/test-implementation.md`, **never** `implementation.md`, which stays
  developer-owned; done-checks read both where both exist. This closes a standing collision — a
  test-authoring agent had no artifact of its own and wrote the developer's file every round (11
  logged ownership hits).

- **The actor-side rule** (`developer.md` → `## Anti-patterns`): invoke the Skill tool **every** time a
  step maps to a skill, even one used minutes earlier in the same session. The log is the only thing
  distinguishing "invoked" from "remembered" — and *"I already know this method"* is precisely the
  situation the skill-first protocol exists to catch.

**ADR-24 remains `PROPOSED`.** This amends its Decision text as an input to the owner's eventual
ratification; it does not ratify it, and the "not settled architecture" banner stands untouched.

**The detector half of ADR-18 deliberately did not ship.** The source entry asked for
`test-implementation.md` in `ARTIFACT_OWNERS` *"so the legitimate write stops logging as a violation"* —
but that map only flags files matching a **listed** regex, and `test-implementation.md` matches none, so
no violation can fire; the 11 hits stop on the filename change alone. Adding it would create new
enforcement against a role nexus does not ship. Recorded as a deferred question in
`docs/proposals/boundary-detector-test-implementation-ownership.md`, mirroring the identical
`boundary-detector-solo-ownership.md` precedent.

Reported in `docs/plugin-feedback/omni-1.25.1-2026-07-12.md` Part A Entries 2 and 4. **This closes the
last open entry across all six inbound feedback files.**

## [1.34.4] — 2026-07-14
**Two recurring pipeline failures become standing rules: trusting a fact you didn't verify, and
trusting a file a killed agent left behind.**

- **A relayed, consensus-backed, or remembered fact is a claim to re-verify, not evidence**
  (`agents-workflow.md` → `## All Agents`). A fact relayed from another agent, backed by a consensus
  of citing sources, or recalled from memory must be **re-executed against live source** before a
  decision depends on it — re-executed evidence, not citation count, is ground truth. It bites hardest
  when the fact licenses *skipping* a step ("no need to seed X"), because **that error direction is
  invisible at authoring time: the test still passes.** The check is usually cheap and mechanical — a
  parity/"mirrors X" claim is byte-checkable (grep the cited body, diff the arithmetic), a cited path
  is `ls`-checkable. **Recurrence 3×:** a skeptic killed 2-of-3 confident, citing miners' "off-shelf
  flow is live" (dead code); a relayed research fact licensed skipping a `tasks.json` seed that would
  have silently tested against no planogram; and a "mirror function X" parity claim plus a
  from-memory golden path that `ls` disproved.

  Placed in `## All Agents` rather than the per-agent `## Anti-patterns` the source suggested —
  `architect.md` and `critic.md` have no such section, and a cross-cutting rule needs to reach every
  role. It **folds** the mine-family skeptic stage in as the finding-verification instance of the same
  principle instead of double-stating it.

- **The 600s no-output watchdog kills subagents mid-long-op — one root cause, two facets**
  (`developer.md` → `## Anti-patterns`). (A) *Untrusted draft after a kill:* on resume, treat files a
  killed predecessor left on disk as an **untrusted draft** — run the build/analyzer before assuming
  they compile or are complete (killed instances have left files with missing/unused imports).
  (B) *Prefer the main session for long ops:* run full test suites, on-device drives and long builds
  from the main session where possible, and write evidence to the artifact **incrementally as
  decisions land**, so a mid-run kill loses the least.

Reported in `docs/plugin-feedback/omni-1.25.1-2026-07-12.md` Part A Entries 1 and 3.

## [1.34.3] — 2026-07-14
**`mine-verify-repo` absorbs six findings from its own first end-to-end pilot — the run that mined 143
findings into 83 registry rows with 0 WRONG and 0 dropped, and had to improvise around the skill's
gaps to get there.** Every fix is a place the pilot re-derived something the method should have owned.

- **The preflight now proves the tool reads your language, not just that it runs**
  (`metric-layer.md` §0/§4). lizard has no native Dart reader: `lizard <dir>` returns **0 files**,
  because the directory walk filters by known-reader extension *before* the generic `CLikeReader`
  fallback can apply — so "lizard present" passed and the complexity table came back **silently
  empty**. `lizard -f <filelist>` bypasses the filter (0 → 1,887 rows). The generalizable rule lands
  in the preflight section where it is stack-neutral — **add a one-file parse probe per stack** — with
  the Dart specifics kept in §4 as the evidence case.
- **The Scope stage owns the degenerate case** (new `### Scope stage — area-expansion rule`). On a
  flat-package repo the community decomposition collapses: the pilot saw **735 communities across 951
  files, 86.5% singletons**, with 4 of the top-5 areas being single files. The rule the pilot
  improvised and validated across all 20 area-miner prompts is now codified — area = anchor file(s) +
  direct imports/importers + change-coupled files at support ≥5 — so scopes are consistent across runs
  instead of re-invented per orchestrator.
- **The test-coverage lens has a granularity floor** (`## The four lenses`). One row per uncovered
  method/region, uncovered branches as sub-bullets — never one row per branch. The pilot's TC miners
  produced 44 rows that consolidation merged to 8, the largest merge class in the 143→83 pass: lcov
  makes branch-level facts cheap to mine and expensive to verify. Cap granularity at the unit a
  refactoring wave would actually act on.
- **Evidence-command robustness is baked into the C2 schema.** Anchored single-line greps break when
  the formatter splits an expression across lines; structural greps **must** exclude generated files
  (`*.g.dart`, `*.config.dart`, `*.freezed.dart`) or counts inflate by an order of magnitude — raw
  re-execution gave 116/60/167 upward core edges vs **45/7/4** after exclusion; and `grep -A N`
  truncates long lcov records (use awk record extraction — this caused the pilot's one refuted
  side-number). The skeptic gate is only as good as its evidence commands' determinism.
- **"Poll, don't wait" is now the canonical statement** (`## Execution topology`). Background-run
  completion notifications are unreliable — a stage prompt must have its agent run measurements in the
  foreground (bounded poll loop if long) and never end a turn waiting on a completion callback. A
  Step-6 developer stranded **twice** on this before an explicit instruction fixed it; with all 23
  pilot-stage prompts carrying it, **no stage stranded**. `mine-verify-cover`'s topology paragraph
  (1.34.2) mirrors this and points here.
- **Author identities merge before ownership is computed** (`metric-layer.md` §1/§3). The pilot had
  **3 people holding 9 of 13 identities**; unmerged, the ownership signal fragments and
  minor-contributor flags fire falsely. A repo-root `.mailmap` does it for free — §3's numstat log
  already formats the author via `%aN`, which honors mailmap automatically — recorded in the run
  report. Ownership is the strongest validated signal; identity noise must not corrupt it.

Reported in `docs/plugin-feedback/omni-1.22.0-2026-07-05.md` Entries 1, 2, 3, 4, 5 and 7. With
1.34.2's Entries 9/10, this closes `omni-1.22.0` — its remaining Entry 11 (a golden/UI miner sibling)
is tracked as a parked proposal, not built.

## [1.34.2] — 2026-07-14
**`mine-verify-cover` now owns three things the pilot had to re-derive per run: what happens when a
mutant hangs or crashes, whether tag emission is actually checked, and where mined tests live.**
Four findings from the `mvr-pilot-1-2026-07-04` campaign on omnishelf_flutter_app, all landed as
method-level contract rather than adapter folklore.

- **Abnormal mutant exits are part of the adapter contract** (`## The adapter contract`). A mutant
  does not only fail an assertion — it can non-terminate (infinite recursion) or crash the runtime
  (stack overflow). Three requirements the Test-runner and Mutation-tool capability fills must state
  together: a timeout kill must reach the whole process **tree** (killing the top process alone can
  leave a descendant holding the output pipe open, so the run never returns — which makes
  `mutation_floor`'s "Timeout counts as a kill" a dead letter); a non-zero, non-clean-fail return code
  paired with a not-all-green suite scores **KILLED-by-crash**, never `SUSPECT`; and `char_pin` must be
  **re-verified after ANY abnormal exit**, because a hard kill bypasses a restore-on-exit `finally` and
  can leave a mutant applied to production source. A pointer from `## The gate battery` puts it in
  front of the reader at the `mutation_floor`/`char_pin` rows.
- **Tag emission is a verified assertion, not prose** (`## Fact tagging & test tiers`). Measured
  adherence in the pilot was **1 of 13** code-arm suites — including suites generated *after*
  fact-tagging shipped, so this was an adherence gap, not a capability gap. The fix deliberately
  mirrors the skill's own `## Safety rails` generation guard, which already names the principle
  (*"a prompt instruction is a request, not a guarantee that it is followed"*) and already answers it
  with a re-gate: a post-Cover assertion comparing tag-carrying occurrences to the test count, checked
  again at Report, with the same agent-counts / orchestrator-compares split as the Minimize confirm.
  The skill knew both the principle and the shape of the fix; it had never applied either here.
- **Mined-test location is now specified** (new `## Mined-test location`). The rule registry
  consolidates *rules* and said nothing about where generated *tests* go — silence a team reasonably
  reads as "the tests merged too." Both arms now land under a single root, told apart by a new
  stack-neutral `arm: code | spec` fact rather than by folder, and every adapter must state its
  default-path consequence explicitly: a root off the stack's default discovery path runs in CI only
  if the pipeline names it.
- **"Poll, don't wait"** — the `mine-from-spec` mode's execution topology now mirrors
  `mine-verify-repo`'s lesson: run measurements in the foreground, never end a turn waiting on a
  background-completion notification that repeatedly failed to re-invoke the waiting agent.

`arm` is modeled as a stack-neutral fact (matching `layer`/`criticality`) so mapping it to a stack's
tag syntax stays the adapter's job.

Reported in `docs/plugin-feedback/omni-1.22.0-2026-07-05.md` Entries 5/10 and
`docs/plugin-feedback/omni-1.23.1-2026-07-07.md` Entries 1/2.

## [1.34.1] — 2026-07-14
**`resolveRole` now maps the fast lane's `dev-*` spawn abbreviation — fixing a false-violation class
and a silently-skipped verify gate.** `resolve-role.js` peels a suffixed spawn name (`developer-2`,
`developer-f6`) back to its base role, but did not know `dev` abbreviates `developer`. Tracing
`resolveRole('dev-wave0')`: split on `-` → candidate `dev` is not in `KNOWN_ROLES` → the name returns
unresolved. Both name-keyed hooks then misbehave:
- **boundary-detector** — the unresolved name is absent from `ARTIFACT_OWNERS[implementation.md]`
  (`{developer, solo}`), so a fast-lane developer editing its OWN `implementation.md` logged an ADR-18
  cross-role write on every touch: 18 hits (`adhoc-lint-leancode-swap`, spawn `dev-wave0`), 8
  (`adhoc-Refactor-W1-barrel-scc`, `dev-w1`), 7 (`adhoc-MineVerifyFlows`, `dev-json-golden-2`).
- **verify-gate** — the same name misses `IMPL_ROLES` and falls to Branch 3, writing
  `verdict:"skipped"` (`reason: unrecognized agent_type: dev-wave0`). Recorded rather than silent, but
  the developer's verify set never ran. This half was not in the report and is the more serious of the
  two — log noise is visible; an unrun gate is not.

Fixed at the shared resolver so both hooks are covered for every spawn path (the alternative — requiring
canonical `developer-*` spawn names in fast-lane dispatch — is prose, unenforceable, and would leave the
verify gate exposed to any `dev-*` spawn from any other path). The map is **exact-token, never a prefix
match**: a `startsWith` rule would collapse `devops` and re-open the `team-lead`-collapses-to-`team` class
of bug. Both standing contracts are covered by new tests — the team-lead landmine and "a genuinely unknown
role stays unknown" — alongside `devops`/`deviation-check` negative cases and an invariant that every
abbreviation maps to a real role and shadows none.

Reported in `docs/plugin-feedback/omni-1.32.0-2026-07-14.md` Entry 1, whose code-grounded diagnosis
(including its correction of the source lessons' `.current-agent` hypothesis — the detector never reads
it) verified exact against source.

## [1.34.0] — 2026-07-14
**Add the `mine-verify-flows` skill — the flow-scoped mine (eighth family member).** Graduates the
method proven end-to-end in the OmniShelf pilot (19 flows mined & code-verified, 3 flows
golden-gated on-device through a real FFI SDK): clean-room miners extract user flows from
routes/screens/blocs, a skeptic re-traces reachability, a Cover agent writes on-device flow tests
asserting golden-master comparison of the flow's output JSONs, and a per-flow **sabotage check**
(perturb one asserted golden field → the test must go red) replaces the mutation floor at flow
scope — stated honestly as weaker. Carries the pilot's calibration doctrine: gates over FFI/ML
output converge by **class excision, not tolerance tuning** (class-wide `**.`-suffix exclusions;
the single `**.sfr` ε 0.005 tolerance as the worked example), ~4 verify pairs per new output
document, determinism verdicts scoped to the files actually produced, the self-consistent-fixture
greps (FFI re-entry + entity-id joins), hardware-pinned goldens, and the pilot-proven stage
recipes (real-corpus scrubber smoke, catalog-overlap fixture triage, dead-code by-product routing
to `docs/tech-debt/`). Family integration: `mine-family-core.md` gains the 8th table row, a
per-skill staging bullet, and the flow-Verify skeptic-protocol carve-out (code re-trace, verdict
grammar only); all sibling member-count mentions updated seven → eight. Pairs with the new
`nexus-flutter` `mine-verify-flows-flutter` adapter (0.4.0). (adhoc-MineVerifyFlows)

## [1.33.1] — 2026-07-14
- Architect-Led Fast Lane close now commits reliably: rewrote the `Close (pass)` as three ordered,
  non-optional steps (summary → self-commit → report) with the team-lead commit mechanics inlined
  (so the lane no longer depends on `team-lead.md` being in context), the version bump decoupled as
  dev-repo-only, and the report moved last as a report *of* the landed commit. Aligned the
  never-commit hard-rule exception to point at the ordered close.
  - agent instruction/behavior change
  - shipped command changed

## [1.33.0] — 2026-07-12
- clickable research option on boostable asks (rules + questions-format + agents), one-round cap, relayed-path carrier
  - agent instruction/behavior change
  - shipped command changed
  - rule (injected every session)
  - skill change (questions-format)
  - owner-escalated to minor

## [1.32.0] — 2026-07-12
- MINOR — the lane rule (ADR-58, F2-AdhocIsSoloOnly): `adhoc-*` is now explicitly the **solo-only**
  slug lane; any unit of work shaped with the PO or designed with the architect — regardless of
  source — is a **feature** (`F{N}`/tracker slug + `docs/backlog.md` row).
  - `rules/agents-workflow.md` — new canonical **Lane rule** paragraph in § Slug and Path
    Resolution; the `adhoc-{Name}` bullet and the "no `definition/` folder" line both cross-refer
    to it; the persona table's `be architect` entry point row reworded "ad-hoc analysis" →
    "one-off analysis" to reserve the term for the lane.
  - All 8 agent files' compact slug-line (team-lead, po, architect, developer, reviewer, critic,
    learner, solo) — `adhoc-{Name}` annotated `(solo-only — Lane rule, agents-workflow)`,
    byte-identical across all 8.
  - `agents/po.md` — work the PO shapes is never `adhoc-*`; PO adds/updates the backlog row when
    it exists.
  - `agents/architect.md` — the ad-hoc/refactoring no-spec exception re-scoped to "a technical
    feature's ADR-collapsed definition (ADR-25/27)" (the full tech-spec form remains valid); new
    guard: an `adhoc-*` slug arriving for planning gets stopped and handed back — the architect
    never self-assigns, the team lead/PO re-slugs to `F{N}` + backlog row before Phase 1 proceeds.
    Also: the `Satisfies:` cross-check's "ADR unit for an ad-hoc pass" wording updated to
    "ADR unit for a technical feature" for internal consistency with the reworded exception.
  - `agents/team-lead.md` — entry-point decision tree's two `Ad-hoc …` branches collapsed into one
    `Non-backlog work` sub-tree (PO/architect-shaped → feature slug + re-slug if needed; solo-scoped
    → `adhoc-{Name}`); Entry-point rule paragraph now points at the Lane rule.
  - `agents/solo.md` — new boundary line: solo owns the `adhoc-*` lane end-to-end; work that
    outgrows solo scope hands off to team lead/PO for a feature slug.
  - `commands/*.md` (all 8) regenerated via `scripts/gen-commands.mjs nexus` to mirror the agent
    edits.

## [1.31.1] — 2026-07-12
- PATCH — fix `guard.js` + `audit-logger.js` hooks silently failing on Claude Code >= 2.1.207.
  - Shell-form hook commands referencing `${user_config.*}` are rejected since v2.1.207
    (shell-injection fix), so the security guard and audit logger never ran. Both entries in
    `hooks.json` converted to exec form (`"command": "node"` + `args` array); scripts unchanged
    (still read `argv[2]`).

## [1.31.0] — 2026-07-12
- MINOR — two new mine-family skills graduate from their ratified proposals (adhoc-MineSkillAuthoring).
  - **NEW skill `mine-algorithm`** (the seventh mine) — recognizes a hand-rolled algorithm as a canonical
    one and adjudicates a BR-conformance-gated replacement (clean-room characterization → 2-3 clean-room
    matchers → adversarial conformance with deviation-triggered row re-grounding; stage-0 never-self-mine
    HARD BLOCK; dependency-tier ranking). Ships a frozen canonical-algorithm catalog + an equivalence-net
    comparator recipe (`references/`).
  - **NEW skill `mine-design`** (the sixth mine) — produces an evidence-cited design brief for one
    class/function (mechanical complexity census → decision-table-constrained designers → a blind,
    higher-tier two-tier judge). Ships the decision table v2 + the judge protocol (`references/`).
  - `mine-verify-cover/references/mine-family-core.md` — family table grown 5→7 rows and a once-authored
    routing boundary (algorithm-shaped vs rule/mapping-shaped) added; member-count pointers synced in
    `mine-verify-cover`, `mine-reference-model`, and `mine-verify-repo` SKILL.md.
  - owner-escalated to MINOR (two new user-facing capabilities).

## [1.30.4] — 2026-07-11
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed
  - skill change (create-implementation-plan)
  - skill change (improve-skills)
  - skill change (release-plugin)

## [1.30.3] — 2026-07-11
- PATCH bump.
  - rule (injected every session)
  - skill change (research)

## [1.30.2] — 2026-07-10
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed

## [1.30.1] — 2026-07-10
- PATCH bump.
  - skill change (mine-reference-model)
  - skill change (mine-verify-cover)
  - skill change (mine-verify-repo)

## [1.30.0] — 2026-07-10
- **Architect-Led Fast Lane (adhoc-ArchitectFastLane).** New standalone-only mode: the architect
  (main session persona, never a spawned subagent) can run a compact architect-develop-review loop
  for a small feature instead of handing off to the full team pipeline — one developer dispatch
  with a first-round `code-review` skill invocation baked in, the existing Step 1 done-check
  (scoped by agent + main-session id + dispatch timestamp, since standalone has no
  `.claude/.pipeline-state` token), fix rounds capped at 3, and a mode-scoped exception letting the
  standalone architect write `summary.md` and commit at lane close. Two ownership-consistency
  carve-outs keep the always-on hard rules from contradicting the new exception
  (`agents-workflow.md`'s "team lead writes summary.md and owns commits" rule, and
  `team-lead.md`'s "pipeline agents never commit" restated as "spawned pipeline agents never
  commit"). `summary-format`'s producer note and frontmatter description now name both producers.
  - agent instruction/behavior change (architect.md, team-lead.md)
  - shipped command changed (commands/architect.md, commands/team-lead.md — regenerated)
  - rule amendment (agents-workflow.md — injected every session)
  - skill change (summary-format)
  - owner-escalated to minor (new capability: a new standalone operating mode)

## [1.29.0] — 2026-07-10
- **Branch Strategy Ask — Branch Pre-Flight v2 (adhoc-BranchStrategyAsk).** Amended the canonical
  Branch Pre-Flight & Default-Branch Resolution rule: attended asks now offer the full
  branch-strategy option set (continue here / new branch from the default / stacked branch when
  current ≠ default / new worktree, first-class) and every ask carries one recommended option +
  confidence + a one-line why, keyed on work shape × tree dirtiness. Team-lead Pre-Flight #1 and
  solo Workflow step 1 updated to reference the option set instead of restating a two-option list.
  - agent instruction/behavior change (team-lead.md, solo.md)
  - rule amendment (agents-workflow.md — injected every session)
  - shipped command changed (commands/team-lead.md, commands/solo.md regenerated)
  - owner-escalated to minor (new capability: first-class worktree option + recommendation duty)

## [1.28.0] — 2026-07-10
- **Decision Log with Outcome Back-links — A5 pilot (adhoc-DecisionLog).** decisions log pilot in
  communication-log.md (team-lead writer, shutdown outcome back-fill, learner reader,
  kill-if-unused criterion).
  - agent instruction/behavior change (team-lead.md, learner.md)
  - shipped command changed (commands/team-lead.md, commands/learner.md regenerated)
  - owner-escalated to minor (new pipeline capability)

## [1.27.0] — 2026-07-10
- **Learner cadence nudge (adhoc-LearnerCadenceNudge).** New PostToolUse hook `learner-cadence.js`
  rides the `summary.md` close write: counts pipeline summaries newer than the learner's
  `.claude/audit/learner-last-run` stamp and emits a silent-when-clean `systemMessage` nudge
  ("consider 'be learner'") when lessons accumulate. Wired into the existing `(PostToolUse,
  Write|Edit)` group (`async: true`, timeout 10). Learner workflow gains step 8 — stamp the
  last-run marker, apply-only-on-promotion, mtime-driven; command regenerated. Unit-tested
  (AC-1 four cases) + dry-fire verified.
  - agent instruction/behavior change (learner stamp obligation)
  - shipped command changed (commands/learner.md regenerated)
  - hook added (learner-cadence.js) + hooks.json wiring
  - owner-escalated to minor (new capability)

## [1.26.2] — 2026-07-10
- Conclusion-gate verdict semantics in diagnose + review-format (causal verdicts name their
  variable; kills need falsifying evidence).

## [1.26.1] — 2026-07-10
- Mine-family core reference extracted (topology/budget/skeptic/registry invariants consolidated) +
  pilot-lesson harvest + kickoff checklist; records annotated.

## [1.26.0] — 2026-07-09
- **The Conformance Reviewer — a corpus-grounded advisory lens for the PR tail (adhoc-ConformanceReviewer,
  ADR-53/54).** New opt-in capability: reviews a diff against the repo's **own corpus** (conventions,
  architecture + graph facts, reference-model, tech-debt, shipped skill patterns) — the *conceptual* lens
  (patterns, principles, naming, conventions), **never** correctness and **never** the deterministic
  linter tier.
  - **New skill `conformance-review`** — charter (six checks + permanent exclusions + cite-or-drop + the
    No-corpus-no-review decline + advisory-forever `COMMENT` posture); a precision-first **two-stage
    runtime** (grounded generation, then a fail-closed skeptic filter, capped at `prConformanceCap`,
    sonnet-class helpers); a **calibration mode** gated by a human-graded `## Owner verdict: PASS` marker
    before any live PR posting; PR + standalone delivery recipes (`/nexus:conformance-review`).
  - **Team-lead Pre-Flight 4b** gains two optional `.claude/nexus-agents.json` keys: `prConformance`
    (bool, default `false`) and `prConformanceCap` (int, default `5`), captured in the existing one read.
  - **Team-lead PR Tail** gains an opt-in conformance step after the projection posts — attended-only,
    host-gated, advisory, respecting the skill's calibration gate. Defaults preserve today's behavior
    exactly (both keys off → no change to any pre-push or tail path).

## [1.25.3] — 2026-07-09
- **Registry consumers wired: guardrail rebase, review rider, discoverability, and the grounding
  contract (adhoc-AgentGrounding).** The three agent guardrail hooks (`solo.md`, `developer.md`,
  `architect.md`) — previously inert on the old C2-conditional trigger — now rebase onto the live
  registry at `docs/business-rules/<area>/<unit>.md`: pre-edit registry read, post-edit scoped skeptic
  re-verify (read-only `general-purpose` verifier, in-context fallback disclosed), test-update-or-M3-
  re-mine obligation retained. `reviewer.md` gains a rule-aware review rider: a registry check in
  `## Before Reviewing` and a rule-diff rider in `## Review Dimensions` that names the specific rule a
  change flips. `kb-navigation.md`/`kb-maintenance.md` make the registry species discoverable — a new
  navigation layer plus a species-boundary note (never hand-edit a registry). New `## Repo Grounding
  Contract` section in `kb-navigation.md` (ADR-52): the three thin indexes + a tracked, script-synced
  KB copy a consumer repo needs for instant agent grounding, with the knowledge-gateway MCP clause
  marked conditional. Commands regenerated to match.
  - agent instruction/behavior change
  - shipped command changed
  - rule (injected every session)

## [1.25.2] — 2026-07-08
- **`mine-verify-cover` Merge doc honesty (sprint-rituals feedback `nexus-1.21.0-2026-07-04.md`, item 2
  doc half).** Rewrote the **Merge** paragraph to drop the inaccurate "Content-keyed, granularity-tolerant
  matching (symbol + condition content)" claim the exact-string compare never delivered. It now states
  the spec/code rule sets are reconciled by the human-authored crosswalk (many-to-one tolerant both ways)
  and that agree-vs-diverge is **operator-declared via the crosswalk**, with the condition-boundary
  comparison as a corroborating hint consulted only when nothing is declared; the `suspect-stale-spec` tag
  is likewise operator-declared (or date-derived). Text-only, method-honest — no behavior change to the
  skill. Ships alongside the harness defect-fixes for the same feedback's items 1–4 (registry code-only-row
  drop, crosswalk-declared expectations, boundary demotion, layer-only distillate clustering), which live
  outside `plugins/**` and carry no version.
  - skill change (mine-verify-cover)
## [1.25.1] — 2026-07-08
- **`mine-verify-cover` core skill: PHP adapter registered.** Adds the new `nexus-php` stack adapter
  (`mine-verify-cover-php`) across the core method's four adapter-mention sites — the method intro, the
  fact/tier stack-adapter table (a `deferred` PHP row mirroring cpp), the "What this skill does NOT do"
  bullet, and the "Relationship to other skills" table. Text-only, no method/behavior change; ships
  alongside the new `nexus-php` plugin (PHP is the fourth stack adapter after .NET, Flutter, C++).
  - skill change (mine-verify-cover)

## [1.25.0] — 2026-07-06
- Architect Decision Disclosure: plans now carry a `## Decisions` section (decision · why · rejected alternative · status decided|deferred) declaring self-resolved two-way-door calls; architect emits a `Decisions taken: N` metric in the plan-approval message; critic flags a missing/silent section as a MEDIUM plan-hygiene finding.
  - agent instruction/behavior change
  - skill change (create-implementation-plan)
  - owner-escalated to minor

## [1.24.0] — 2026-07-06
- **MINOR — utility-skill audit hardening: two new lint gate capabilities + a widened check.**
  Applies the six consolidating fixes from the routed dotnet-microservices utility-skill audit
  (`nexus-1.23.1-2026-07-06.md`, Entries 1–6; no Critical/High — the audit otherwise validated the
  estate). Owner-escalated to MINOR because Entries 1/2/6 add new gate capability.
  - `improve-skills/scripts/skill-lint.mjs` — **E6 widened** (Entry 1, amended): the citation net now
    covers **file-shaped** `scripts/`/`assets/` paths in addition to `references/`/`workflows/`, and a
    citation resolves if it exists **skill-relative OR at the `.git`-anchored repo root** (deterministic
    from any cwd — never `process.cwd()`). This keeps the two DO-NOT-BREAK sites green: `release-plugin`'s
    repo-root `scripts/bump-plugin.mjs` (repo-root fallback) and `figma-to-flutter`'s directory-shaped
    `assets/icons/` (file-shaped filter). **W3** (Entry 2) warns — never errors — on a SKILL.md body over
    500 lines (progressive-disclosure split). **W4** (Entry 6) warns on a cited `references/*.md` that
    itself cites another reference (canon: one level deep from SKILL.md; references-only scope). Header +
    rationale comments updated. 9 TDD cases added (`tests/unit/skill-lint.test.mjs`).
  - `evaluate-skill/references/rubric.md` — **Entry 3:** deleted the Layer 0 "skills index" dead-letter
    (the scripted layer's script has no index check; Layer 4.3 already owns index sync as judgment);
    synced Layer 0 item 4's folder list to the widened E6; softened item 3's scripted-vs-judgment
    boundary. **Entry 5 (rubric half):** Layer 2.2 gains a degrees-of-freedom clause.
  - `improve-skills/references/skill-recipe.md` — **Entry 4 + Entry 5 (recipe half):** §2 sanctions a
    bundled `scripts/` folder element (P1 post-condition home) and names the degrees-of-freedom axis;
    intro harmonized to sanction both `references/` and `scripts/`.
  - `improve-skills/SKILL.md` — scaffold step 3 now offers `scripts/`; the lint-scope sentence synced to
    the widened E6 and the two new warnings.

## [1.23.1] — 2026-07-05
- PATCH bump.
  - skill change (mine-reference-model)

## [1.23.0] — 2026-07-05
- **MINOR — new capability: the `mine-reference-model` skill (the fourth mine, the "what to copy"
  arm).** Stack-neutral reference-repo virtue extraction (ADR-50): parallel clean-room extractors read
  ONE designated reference repo per dimension (default five — layering, module boundaries, error
  handling, DI, testing strategy), a fresh skeptic RE-EXECUTES each pattern's evidence to kill invented
  virtues (the flattery failure mode), and confirmed patterns are graded for portability to the
  consuming stack (`portable | adapt | not-portable`) with a cross-stack translation dictionary. Output
  is a `docs/reference-model.md` registry species in the consuming repo — the third alongside
  `docs/business-rules/` (ADR-45) and `docs/tech-debt/` (ADR-49) — consumed at `mine-verify-repo`'s C5
  triage as the by-design adjudication reference. Read-only on both repos, no toolchain.
  - `mine-verify-repo/SKILL.md` — cross-reference edits: the family enumeration now names the fourth
    mine; C4/C5 add `docs/reference-model.md` as an **additional** formal source of the reference model
    alongside the repo's own ADRs/conventions (`no-reference-model` still fires only when no reference
    model of any kind exists — additive, never a replacement); a relationship-table row for the new skill.
  - `mine-verify-cover/SKILL.md` — cross-reference edit: a relationship-table row for the new skill (the
    reference-repo sibling; virtues not debts; no Cover arm).

## [1.22.1] — 2026-07-04
- **PATCH — additive skill-authoring reference.** `improve-skills` gains
  `references/skill-recipe.md` — the archetype decision (heavy/autonomous vs
  light/conversational, nexus-grounded examples), the reusable-element menu (re-pointed to
  nexus's own artifacts — `communication-log.md`/`.pipeline-state` for state persistence,
  `skill-lint.mjs` + Write Discipline for loader safety, `proven-patterns.md` P5/P6 by
  reference), and a frontmatter cheat-sheet for all 9 fields verified against live Claude Code
  Skills semantics. Wired into "For New Project-Local Skills" steps 2 and 4 (both authoring
  paths). Closes the one real gap identified in `docs/proposals/skill-authoring-recipe.md`
  (P5) — no new capability surface, no behavior change to `improve-skills` itself.

## [1.22.0] — 2026-07-04
- **MINOR — new capability: the `mine-verify-repo` skill (the third mine).** Repo-scoped Mine→Verify →
  tech-debt triage registry (ADR-46..49): a metric-first hotspot layer (bot-filtered git-history churn +
  ownership + coupling via Code Maat, churn×complexity via lizard), the fact/judgment split gated by an
  empirical must-reproduce Verify pass, and a `docs/tech-debt/<area>.md` registry species. Ships
  `references/metric-layer.md` as the deterministic, copy-paste runbook.
  - `mine-verify-cover/SKILL.md` — cross-reference edits: a relationship-table row for the new skill and
    a "does NOT" boundary bullet distinguishing per-class Cover from repo-scoped triage.

## [1.21.1] — 2026-07-04

- **Business-rules registry: mined/merged rule artifacts move to `docs/business-rules/<area>/<unit>.md`
  (ADR-45).** The rule registry is now its own artifact species, split from the KB namespace
  (`docs/kb/…`, unchanged for vocabulary/research-pool entries):
  - `mine-verify-cover/SKILL.md` — retitled `## The KB rule-ledger` → `## The rule registry`; added the
    explicit landing path and enumerated the full row grammar inline (`source: code | spec | both`,
    `status` incl. `divergence-pending-triage`, `criticality: golden | core | edge | untagged`,
    `last_verified`) as THE shipped grammar reference; the Merge-stage canonical-registry default path
    updated to match; added a Flutter migration note (existing Flutter ledgers/registries move to
    `docs/business-rules/` on that repo's next campaign touch).
  - `kb-entry-schema/SKILL.md` — added a species-boundary note disambiguating KB entries from the rule
    registry species.
  - `agents/{solo,developer,architect}.md` (+ regenerated `commands/`) — the attestation-drift hook's
    old per-class registry path re-pointed to `docs/business-rules/<area>/<unit>.md`; trigger semantics
    (attested golden set, forward conditional) unchanged.
  - Contract-text only, no runtime behavior change (PATCH).

## [1.21.0] — 2026-07-03
- **SDD merge/generate — `mine-verify-cover` gains shipped Merge + Generate stages (`adhoc-SddMergeGen`,
  AC-6 GO).** New capability: adjudicates the `adhoc-SddCoverageLoop` pilot AC-6 gate GO
  (`docs/proposals/sdd-generate-merge-2026-07.md`, Ratified) and ships the M1/C1 triage-merge + the
  diff-driven Cover-from-spec generator, ungating the `## SDD lifecycle` mode table's M0/M1/M3 rows.
  - `mine-verify-cover/SKILL.md` — new `## Fact tagging & test tiers` section (facts:
    `layer`/`criticality`/`mutation-gated`/`runtime-cost`; named tiers `smoke`/`full`/`gate`; the
    "no scalar score" rejection). Rewrote the `## SDD lifecycle (M0–M3)` section: the Merge stage (five
    delta buckets, `divergence-pending-triage` + evidence pair, `suspect-stale-spec`, the canonical rule
    registry's no-delete/provenance/changelog/idempotency invariants) and the Generate stage
    (spec-only-unimplemented ∧ layer-match eligibility, `ambiguous` blocked, the two pre-red
    preconditions, the parked-red output convention, zero-tests-is-correct). C2 (attestation record),
    C3/C4 (the merged ONE test set) remain explicitly deferred to the next arc.
  - `solo.md` — new `## Spec write-back` section: trivial-factual spec fixes + re-stamp only; behavioral
    drift is surfaced to the PO/owner, never settled.
  - `developer.md` — the read-only file enumeration now explicitly names
    `docs/specs/{slug}/definition/` (previously only implied).
  - 5 new ADRs extracted to `docs/architecture/README.md` (ADR-40..44): AC-6 GO + merge-first order,
    diff-driven Cover-from-spec, fact-based tagging (no scalar), docs-render direction, spec write-back
    routing.
  - `commands/{solo,developer}.md` regenerated.
  - owner-escalated to minor

## [1.20.0] — 2026-07-03
- **Spec-arm trigger — `mine-from-spec` at spec-Ready (`adhoc-SpecArmTrigger`).** New capability: pulls
  the Mine+Verify half of the SDD spec arm forward out of the AC-6 gate and wires it to fire the moment a
  spec flips `Status: Ready`.
  - `mine-verify-cover/SKILL.md` — new `mine-from-spec` mode (input-source axis, orthogonal to the
    existing depth modes): clean-room miners + a fresh skeptic mine a spec manifest instead of a
    production class, citation-per-rule, `verified | ambiguous` verdicts, writing
    `docs/specs/{slug}/definition/spec-rules.md` with a reproducible per-file LF-normalized sha256 stamp.
    Multi-agent Execution-topology rule (staged background `general-purpose` agents; orchestrator = the
    spawning session). SDD-lifecycle section reconciled: Mine+Verify-from-spec is shipped/ungated; only
    Cover-from-spec + the two-arm merge stay AC-6-gated.
  - `create-implementation-plan/SKILL.md` — `Satisfies:` gains a third referent, `{ruleName}` (resolves to
    a `spec-rules.md` row); advisory only, stays optional/never-blanket.
  - `architect.md` — Phase-1 opportunistic spec-rules join (stamp check + LF-normalized delta re-check),
    Phase-2 advisory `Satisfies: {ruleName}` guidance, done-check third-referent existence check, and a
    net-new Technical-branch definition checkpoint (batches review-mode choice + the mine-from-spec offer,
    codifying existing ADR-27 practice).
  - `po.md` — batches the mine-from-spec offer into the existing `### Spec review (mandatory gate)`
    checkpoint, gated to rule-shaped commitments only.
  - `team-lead.md` — PO Spec-Review Checkpoint surfaces + records the confirmation; new staged
    background dispatch (miners in parallel, then consolidate+skeptic) alongside the architect dispatch.
  - Proven end-to-end on the architect-gate path against `adhoc-SddLifecycle/definition/tech-spec.md`:
    54 consolidated rules (52 verified, 2 ambiguous spec findings), stamp reproducible, citations
    grep-back verified.

## [1.19.0] — 2026-07-03
- **SDD Golden-Set Lifecycle — ungated slice (`adhoc-SddLifecycle`).** New capability: a
  `## SDD lifecycle (M0–M3)` section in `mine-verify-cover/SKILL.md` framing the skill as the
  **code arm** of a larger spec-driven lifecycle — a 4-mode map (M0 Greenfield, M1 Create, M2
  Protect, M3 Evolve), M2's full refactor-safety protocol (`suite_green` + `mutation_floor`
  re-clear across a refactor; `char_pin` inapplicable; kill-rate delta advisory-only, never
  pass/fail), and M0 named as a lifecycle position (no new machinery). M1/M3 (canonical rule
  registry, attestation, merged-set triage, three-way reconciliation) are a deferred stub
  pending the parent pilot's AC-6 verdict. Adds a net-new **AC-L6 attestation drift rule** —
  a dormant forward conditional — to `solo.md`, `architect.md`, and `developer.md` (role-
  differentiated: solo/developer update tests in the same pass or flag an M3 re-mine; architect
  plans the update, since it never writes tests). Extracts **ADR-38** (M2 refactor safety) and
  **ADR-39** (drift v1) into `docs/architecture/README.md`.
- **Fix (fix-cycle 1/3, pre-existing, unrelated to the above).** Repairs 4 pre-existing broken
  `SKILL.md` frontmatters that failed `claude plugin validate --strict` — `boy-scout`,
  `diagnose`, `evaluate-skill`, `improve-skills` each had an unquoted `description:` scalar
  containing colon-bearing prose (`vs simplify: boy-scout`, `Timing: reach`, `Order:
  evaluate-skill` ×2), which YAML parses as a broken plain scalar. Quoted the description
  values; no content changes. `validate --strict` now exits 0.

## [1.18.10] — 2026-07-01
- **`mine-verify-cover` — categorical-KEEP + activation gate in the Minimize stage (F1).** Refines the
  post-floor Minimize stage (ADR-37) after the Flutter rerun surfaced its one over-reach: Minimize could
  prune a behaviour-distinct-but-mutation-redundant test (an empty-template / placeholder-absent no-op),
  because the post-floor confirm compares kill *counts* and such a test contributes zero unique kills — its
  loss is invisible to the confirm. Added a **categorical-KEEP** class (the inverse of the four
  categorical-dead classes): a degenerate-input test that *constructs* the edge (empty / no-match / zero /
  empty-collection / documented failure-passthrough) AND asserts the observable safe/no-op result is kept
  even when mutation-redundant and same-ruleId, honored mechanically by the orchestrator; the discriminator
  vs categorical-dead class #4 (*constructs + asserts?* → KEEP; names but never builds → #4); an
  **activation gate** (skip Minimize when the generated suite is within a non-zero margin of the distinct
  mined-rule count); and a third `minimized: skipped (at rule-floor)` report-line form. (adhoc-MvcSuiteFidelity)

## [1.18.9] — 2026-07-01
- **`mine-verify-cover` — post-floor Minimize stage (ADR-37).** Added a `Minimize` stage (the dual of
  classify-survivors): after the suite hits the mutation floor, a minimize agent proposes redundant-test
  removals by reasoning, a write-agent applies them, and a runner agent re-runs the **full** gate on the
  reduced suite — the orchestrator restores everything on any exact reachable killed-count drop (fail-closed
  confirm, named as the anti-fake-green invariant applied to test removal). Plus a Cover generation guard
  (no categorically-dead tests, labeled non-enforcing) and a `minimized: …` report line. Optimizes for
  rule-traceability, not mutation-minimality — a test that uniquely documents a distinct verified rule is
  kept even when mutation-redundant.

## [1.18.8] — 2026-07-01
- **Uniform reasoning effort — `xhigh` for all agents.** Raised the three sonnet agents
  (`developer`, `reviewer`, `solo`) from `effort: max` to `effort: xhigh`, matching the opus
  roles. Models unchanged (sonnet agents ride Sonnet 5 via the bare alias).

## [1.18.7] — 2026-06-29
**Learner consolidation — five recurring lessons promoted into the pipeline.** Drawn from 13 ad-hoc
runs since the 1.13.0 feedback pass; each item is multi-occurrence or process-breaking.
- **`team-lead` — closure-provenance validation at the idempotency gate.** Before trusting
  `summary.md`/`.pipeline-state=done` and reporting "already done," scan `violations.log` for
  unresolved fabrication lines for the slug (the load-bearing signal) and corroborate the last
  commit's provenance — a developer subagent that fabricates a review, writes `summary.md`, commits,
  and sets `done` otherwise short-circuits the retroactive `git log` catch (ADR-21; strongest
  instance in adhoc-MineVerifyCoverHarness). No blocking pre-commit hook: it's platform-unsound (the
  git layer can't see `agent_type`; the PreToolUse deny is dropped for background subagents, ADR-13).
- **`team-lead` — spawn pipeline subagents by `subagent_type` only, never a custom `name`.** A custom
  name becomes the `agent_type` the hooks key on, so verify-gate and boundary-detector mis-resolve the
  role (the verify set doesn't run; legitimate owner-writes get flagged) and `TaskStop`/`TaskOutput`
  can't address the agent. Address the running agent by its agentId.
- **`team-lead` — Codex liveness & recovery.** Verify a real Codex job exists before waiting (a chat
  ack is not proof), never hold the gate indefinitely, and relay Codex's file-write via the Relay
  Contract when its sandbox is read-only.
- **`team-lead` — re-check the branch before *every* commit.** The Pre-Flight branch guard is
  launch-only; a concurrent same-tree run can switch the branch and move HEAD between launch and
  commit. Plus: defer the omni-twin sync under concurrent runs.
- **`create-implementation-plan` — operator-owed *by construction* for tool-surface gaps.** A step
  needing a tool the implementer's surface lacks (the `Workflow`/`agent`/`parallel` primitives for a
  developer subagent) is operator-owed up front; a build-only increment states what a PASS does not
  yet prove; `node --check` is JS-syntax only and can't validate a Workflow script.

  **Consuming-repo feedback (knowledge-gateway + sprint-rituals, re-grounded against live source):**
  - **Hooks — resolve a suffixed/auto-suffixed spawn name to its base role** (`developer-2`,
    `developer-f6` → `developer`), via a shared `hooks/scripts/lib/resolve-role.js`. `verify-gate.js`
    and `boundary-detector.js` previously `.split(/[:/]/).pop()`, which strips a `:` namespace but not
    a `-suffix`, so a suffixed re-spawn wrote `verdict:"skipped"` (reads as a pass but never ran) and
    false-flagged a developer writing its own `implementation.md`. ~27 occurrences across both repos.
    Landmine handled: `team-lead` never collapses to `team`.
  - **`boundary-detector.js` — flag cross-agent task assignment** (a subagent `TaskUpdate owner=` to a
    different agent) as ADR-21 peer-orchestration; self-claims and status-only updates are exempt.
  - **`architect.md` — three more code-grounded-review triggers:** SDK/library-wiring (verify the
    installed package), extending a same-session subsystem, and any live-external-dependency path.
  - **`reviewer.md` — include WebApplicationFactory endpoint tests in the baseline scan;** confirm a
    pre-existing failure by exception signature, not a stash round-trip.
  - **`create-feature-spec` + `po.md` — help/tooltips is a default deliverable confirmed in the upfront
    interview,** not a trailing opt-in (user-reported regression).
  - **`team-lead.md` — verify `git diff --cached --name-only` before every commit** (the harness can
    auto-stage unrelated files during a pause).

## [1.18.6] — 2026-06-26
**Report-stage survivor-classification taxonomy.** The `mine-verify-cover` method now specifies a Report stage that classifies every residual survivor into one of five tags (`equivalent-logging`, `equivalent-format`, `dead-code`, `masked`, `REAL-gap`) and — critically — **who may assign each**: the orchestrator pre-tags only `equivalent-logging`, and only against an adapter-supplied log-line set; the source-dependent tags are assigned by a classify-survivors agent with source + KB access, the orchestrator merely records them and never defaults an unprovable survivor to `REAL-gap`. "Only `REAL-gap` is worth chasing" is a Report-stage / follow-up-run property — mid-loop the orchestrator can only filter its own `equivalent-logging` pre-tags, since the source-dependent tags are not known until the Report-stage classify; a survivor the classify agent leaves unanswered is recorded as a loud, logged `unclassified` terminal state, never defaulted to `REAL-gap`. The stage also emits implied source cleanups (`file:line`) and an `expectedSurvivorLines` suggestion. Additive to the 1.18.5 anti-fake-green invariant (referenced, not restated).

## [1.18.5] — 2026-06-26
**Fix mutation gate under-report: score from stdout summary, not the survivors-only XML.** The `mine-verify-cover` method now adds an anti-fake-green invariant to the gate battery: before scoring `mutation_floor`, cross-check the agent-reported mutant TOTAL against the tool summary's `Found N` and halt/flag on mismatch. A survivor-only XML report read as the full mutant set (the exact mechanism behind a pilot reporting 0% instead of 77.14%) would be caught by this invariant. Keeps the check stack-neutral — the adapter's summary parse supplies the authoritative total. Paired with the `nexus-flutter` fix that corrects the scorer to use the stdout summary directly (adhoc-MvcGateScoringFix).

## [1.18.4] — 2026-06-25
**Pin Sonnet as the mine-verify-cover model policy.** The method now tells the authoring orchestrator to set
`model: 'sonnet'` on the agent calls rather than inheriting the session model (often Opus). The mutation gate
is a mechanical evaluator, so test quality is what matters and Sonnet clears the floor on every target proven
to date (.NET + Flutter, 90–100%); Opus adds cost without a demonstrated gain (reserve a stronger model for
the Verify skeptic only). Updates the `mine-verify-cover` skill (adhoc-FlutterSonnetDefault).

## [1.18.3] — 2026-06-25
- PATCH bump.
  - skill change (mine-verify-cover)

## [1.18.2] — 2026-06-25
**Provenance-based "strengthen-don't-duplicate" for the learner.** Lessons now carry a provenance tag
(`**Evidence:**` = the runs a lesson has appeared in); the tag count *is* the recurrence count, surfacing
the 2-occurrence promotion threshold in the lesson itself. On a recurring lesson the learner appends the
new run to the existing entry's provenance (and revises on contradiction) instead of adding a near-duplicate
twin — keeping `lessons.md` lean and the recurrence signal honest. Updates `learner` (agent + command) and
the `lessons-format` skill (adhoc-LessonsProvenance).
  - agent instruction/behavior change · shipped command changed · skill change (lessons-format)

## [1.18.1] — 2026-06-24
**Wire the Dart/Flutter adapter into the mine-verify-cover method.** The Flutter stack adapter now exists
(`mine-verify-cover-flutter` in the new `nexus-flutter` plugin), live-proven on 2 Dart classes. Updates the
stack-neutral method doc to reference it: the adapter list, the adapter-contract table, and the "What this
skill does NOT do" toolchain note now name `mine-verify-cover-flutter` alongside `-dotnet`. Also corrects the
mutation-tool guidance — a regex-based tool (Dart's `mutation_test`) emits equivalent mutants the adapter
excludes by reasoning, distinct from a stack with NO mutation tool (the coverage + assertion-density fallback).
  - skill change (mine-verify-cover)

## [1.18.0] — 2026-06-23
**Mine→Verify→Cover (new skill)** — the stack-neutral method that discovers, verifies, and mutation-gates the
business rules of ONE class. Clean-room miners extract the rules a class encodes, a skeptic re-checks each
against the code, a Cover agent writes example + property tests, and a 6-gate battery (incl. `target_mutated`
anti-fake-green + a reachable `mutation_floor`) proves the tests actually catch bugs. Outputs a verified rule
KB entry + a mutation-gated suite; never edits the production class, never deletes a red test. Two modes: full
(needs a stack adapter) or Mine→Verify-only (a verified rule KB with no test toolchain). Defines the
5-capability adapter contract the stack skills fill (.NET = `mine-verify-cover-dotnet` in nexus-dotnet).
Live-proven on 3 classes across 2 repos. Owner-escalated to MINOR (new capability).
  - skill change (mine-verify-cover)
  - owner-escalated to minor

## [1.17.0] — 2026-06-21
**PR + AI-review tail (v1)** — the pipeline's optional *end*, after the push gate. An **opt-in,
attended-only, host-gated** tail owned by the team lead: after a successful push it opens (or reuses)
a PR, posts the AI review **first** — by default **projecting** the reviewer's existing
`## Step 2 — Code Review` from `review.md` as a single PR review body — then **STOPS** and hands to one
human who curates via native GitHub/`gh` UX and **controls the merge** ("AI goes first, human
curates"). The model never auto-merges and only *suggests* the opt-in `/code-review ultra` independent
pass (user-triggered + billed). Host capability (`gh` + GitHub remote) is resolved first; absent → the
tail is **silently skipped** and the pipeline closes at push exactly as today. Unattended is
**unreachable** (fail-closed, ADR-32) and hardened mode skips it. Additive only — no pre-push path
changes. Three optional `.claude/nexus-agents.json` keys added (`prTail`, `prDraft`, `prReviewMode`) —
absent → documented defaults, fully backward-compatible. Prose/agent/rule change only; owner-escalated
to MINOR (new opt-in capability). Implements ADR-35 (the tail policy) + ADR-36 (the gh-only host-adapter
seam).

- **`rules/agents-workflow.md` — new canonical `Host Adapter & PR Tail` section** (the post-push
  companion to `Branch Pre-Flight`; both team-lead and solo load it). Defines once: the host-adapter
  surface (**open-PR / post-review / view-PR / merge**, ADR-36), the **`gh`-only** adapter (a documented
  concept, not code — the seam a future GitLab/Gitea/Azure adapter slots into), **host capability
  resolved first** (`gh auth status` + `github.com` origin → else **silently skipped**), and the
  **attended-only / unattended-unreachable / hardened-skip** posture. Points at `Branch Pre-Flight` for
  `{defaultBranch}` (does not re-derive); `gh` command recipes live in the team-lead subsection.
- **`agents/team-lead.md` — Pre-Flight 4b extended + new Commit-Protocol `PR Tail` subsection.** 4b now
  captures `prTail`/`prDraft`/`prReviewMode` (with defaults) in the **same one read** as
  `defaultBranch`/`autoPush`, cached for closure. A new **PR Tail** subsection (after the Push gate, left
  unchanged) adds the after-push, OFF-by-default gate, the `gh pr view` idempotency check, the
  `gh pr create --base {defaultBranch} --head {branch} --fill` (+`--draft`) open, the
  `gh pr review --comment --body-file` projection (with the explicit **"--comment, not self-approve"**
  rationale — GitHub forbids self-approval; verdict + severity + `file:line` ride in the body), the
  suggest-not-run `/code-review ultra` opt-in, and the STOP + single-human hand-off + human-controlled
  `gh pr merge` (only on explicit instruction, never auto, never at closure). A new **Unattended Mode**
  bullet records the tail is unreachable unattended.

## [1.16.2] — 2026-06-21
**Branch pre-flight guard + closure push gate** — strengthen the pipeline's bookends. At launch the
team lead now resolves the repo's default branch and runs a branch-state matrix (new-branch vs continue
by state) instead of just warning on a dirty tree and staying put; at closure a controlled, opt-in push
gate replaces "commit and stop." Solo gets the same guard, lightweight. Git-only and host-agnostic; the
PR / AI-review / merge-to-main tail is explicitly out of scope (a separate feature). Two optional
`.claude/nexus-agents.json` keys added (`defaultBranch`, `autoPush`) — absent → documented defaults,
fully backward-compatible. Prose/agent/rule change only (PATCH).

- **`rules/agents-workflow.md` — new canonical `Branch Pre-Flight & Default-Branch Resolution`
  section** (near the Slug area; both team-lead and solo load it). Defines once: the best-effort
  default-branch resolution order (`origin/HEAD` → config `defaultBranch` → `main`), the 4-state
  attended|unattended decision matrix (ask-when-unrelated; unattended auto-branches `{slug}` from the
  default), and two overlays — dirty-tree (offer to isolate) and stale-default (`git fetch` is
  **unconditionally best-effort**: warn-and-skip on any failure, never block — hardened mode does *not*
  block `git fetch`). Stated as the **launch-only** guard, distinct from the team-lead Resume
  branch-check (which is unchanged).
- **`agents/team-lead.md` — Pre-Flight rewired + closure push gate.** Pre-Flight #1 (Dirty tree) and #2
  (Branch) collapse into a single **#1 Branch guard** applying the canonical rule, dirty-tree overlay
  folded in (numbering becomes `0,1,3,4,4b,5,6,7` — no #2, nothing below renumbered, so the `4b`
  cross-references stay valid). The #0 idempotency note now states the guard runs on the clean-start
  path only (an interrupted run takes Resume and skips it). Pre-Flight 4b additionally captures
  `defaultBranch` + `autoPush` in its one config read (`autoPush` cached for closure). Commit Protocol
  gains a **Push gate** (attended asks; unattended never pushes unless `autoPush:true`; defers to
  hardened mode's `git push` block; merge-to-main explicitly out of scope). Unattended Mode gains a
  matching branch-guard bullet.
- **`agents/solo.md` — lightweight guard + push gate.** Workflow step 1 (Understand) folds in a branch
  pre-flight referencing the canonical rule (attended column governs; matrix not restated); step 4
  (Document) adds "before pushing, ask."
- **`commands/team-lead.md`, `commands/solo.md`** regenerated from the agents.

## [1.16.1] — 2026-06-20
**Section-addressable reads** — extend Read Discipline from *"don't re-read"* to *"read only the
section you need."* A 2026-06-20 live audit (KG/SR) found caching already healthy (92–98%); the spend
is agents reading **whole** artifacts/docs when a section suffices (`nexus:critic` the clearest case,
59% efficiency, 150–250K contexts). Prose/skill/agent change only — non-lossy, whole-read fallback
preserved (PATCH). Extends ADR-22 (two-way-door amendment, not a new ADR).

- **`rules/agents-workflow.md` — Read Discipline gains a section-targeting bullet** — for a large
  (> ~400 lines) or multi-section input, locate the heading (`grep '^#'`) → `Read` with `offset/limit`
  rather than the whole file; names all three whole-read fallbacks (no `^#` match, ambiguous/duplicate
  heading, oversized single section).
- **Format skills document a fixed-heading section map** — `review-format`, `implementation-format`,
  `summary-format`, `lessons-format`, and the plan template each list their stable `##` heading set as
  the targeting index; `questions-format` states the variable-heading (`## Q{N}`) exclusion.
- **Heavy-loader agents get a duplicated targeted-read pointer** (ADR-14, since a subagent sees only
  its own file — ADR-2 #2) — `critic`, `reviewer`, `architect`, and `po` are directed to read the
  sections their job needs for large inputs.
- **`rules/kb-navigation.md`** — step 4 extended to section-target large entries/source.

**Also in 1.16.1 — `distill-prompt` rewritten to its real contract** (separate feature,
`adhoc-DistillPromptContractFix`; its code landed in this release tree). The 1.15.0 build had drifted to
a single-prompt sharpener (lossless / keep-values); this restores the graduated-proposal contract —
*conversation/transcript → ONE reusable prompt + a title*, **strip** run-specific data values / **keep**
the converged intent, prose-only. Supersedes the sharpener. See ADR-34 (pure compaction mechanism only;
promotion/storage stays project-local or with `learner`/`improve-skills`).

## [1.16.0] — 2026-06-20
Make the skill-authoring **harness** standing: every new skill now runs it automatically, instead of
a planner hand-listing the steps each time. Two additions to `improve-skills`' New-Skill flow, plus an
ADR-23 amendment. New standard step → MINOR (owner-escalated).

- **`skills/improve-skills/SKILL.md` — domain-grounding step** — the "study existing skills" step
  becomes "ground the design in the authoritative sources, not from memory": consult the canonical
  reference for the skill's *subject* (e.g. `claude-api` for a prompt/LLM skill) **and** design against
  `references/proven-patterns.md`, before writing the recipe.
- **`skills/improve-skills/SKILL.md` — Judgment Gate (new section)** — after `skill-lint` exits 0, every
  **new** skill runs `evaluate-skill` (the rubric's judgment layers the lint can't check) and folds its
  CRITICAL/HIGH findings back as a consolidating pass. Done = lint exits 0 **and** findings resolved.
  Mandatory for new skills (owner decision 2026-06-20); fixes to existing skills keep the lint alone.
  Carve-out + Deterministic-Gate clauses updated so the rule lands on every surface (AP2).

## [1.15.0] — 2026-06-20
Add the `distill-prompt` skill — a user-invocable utility (`/nexus:distill-prompt`,
human-triggered only) that rewrites a verbose, rambling, or underspecified prompt into a tight,
effective one — clear task, explicit constraints, defined output shape — **without dropping any
load-bearing requirement** (distillation is lossless on requirements, not a lossy summary). Stack-
agnostic, so it ships in nexus core. New user-facing capability → MINOR (owner-escalated).

## [1.14.1] — 2026-06-18
Fix the fleet heartbeat: `subagentStatusLine` payload is hook-shaped (no `workspace` object) —
`resolveRoot()` now reads the base-hook top-level `cwd` as primary, keeping `workspace.project_dir`
as a forward-compat fallback. Without this fix, `fleet-state.json` was never written in live runs
(root always null → write always skipped → `/nexus:fleet` always showed "No active fleet").

- **`statusline/subagent-rows.js` — `resolveRoot()` fix** — resolves root from `data.cwd` (base
  hook field, present in real subagent payloads) instead of `data.workspace.project_dir` (main
  statusLine field only, absent in subagent payloads). Fallback chain:
  `workspace.project_dir || cwd`. Block comments corrected to match the real schema.
- **`skills/fleet/SKILL.md` — activation note** — documents that the `subagentStatusLine`
  registration in the plugin's `settings.json` is read at plugin-load only; `/reload-plugins` or a
  session restart is required after install/update.

## [1.14.0] — 2026-06-18
The research front door: the `search-researches` skill becomes `research` (invocable as `/research`),
gains depth-routing, and captures heavy dives from the built-in `/deep-research`.

- **`search-researches` skill renamed to `research`** — folder, frontmatter, and all live internal
  references (the `research-entry-schema` cross-refs, the `research-before-asking` rule, the
  `cite-check.mjs` path/comment, and `tests/unit/cite-check.test.mjs`). Now invocable as `/research`.
  Historical changelog entries keep the old name (audit trail — supersede-don't-delete).
- **Depth-routing branch** — on a recall miss, `/research` routes by depth: a **low–medium** fact runs the
  self-contained forked researcher now (today's behavior); a **heavy / breadth-first** question is routed
  to the built-in `/deep-research` (the user runs it) and its report is captured.
- **Capture path** — a `/deep-research` report is reshaped into `research-entry-schema` format, the three
  fields a report doesn't supply (Evidence tier, Validity scope + Reconfirm trigger, Corroboration) are
  derived, gated through `cite-check`, and persisted (supersede-don't-delete) — so the breadth dive
  compounds in the pool like every other.
- **`/deep-research` re-labeled** inside the skill as a **Claude Code built-in workflow** — user-invocable
  only and gated (CLI version / plan / `disableWorkflows`), so the skill routes to it and captures its
  result, never auto-invokes it. This gating is why the low–medium path stays self-contained.
- **`research-before-asking` rule** — depth dial extended with the engine split (low–medium `/research`
  forked vs. heavy `/research` → `/deep-research` + capture); the skill owns the heuristic and mechanics.

## [1.13.2] — 2026-06-18
- PATCH bump.
  - hook behavior/enforcement change
  - skill change (boy-scout)
  - skill change (diagnose)
  - skill change (evaluate-skill)
  - skill change (improve-skills)
  - skill change (search-researches)

## [1.13.1] — 2026-06-17
Learner consolidation of the inbound `nexus-1.13.0` plugin-feedback (knowledge-gateway F17–F23 +
adhoc runs). Six recurring items promoted; two re-raised items were already shipped on the live tree
and recorded as confirmed-shipped (model-override-on-resume; the developer self-advance prose guard —
its only net-new ask, a backstop that *aborts* a rogue spawn, stays blocked by ADR-13).

- **`pipeline-gate.js` — verdict scan inverted to a positive finding-heading anchor.** The old
  blocklist (line-initial negation / Confidence field / legend) kept missing benign shapes — a
  narrative "the reviewer found no CRITICAL or HIGH findings", a `critic HIGH-2` cross-reference, an
  off-token legend row — and false-blocked clean APPROVED reviews (4 features). It now fires only when
  a CRITICAL/HIGH heads an actual `### [SEVERITY]` finding (review-format shape) with no resolution
  marker. Deliberate fail-open on an off-format finding; backstopped by the team lead's Verdict
  Validation + the reviewer's Verdict Gate.
- **`boundary-detector.js` — two false-positive fixes.** `implementation.md` is now owned by
  `developer` **or** `solo` (solo's own deliverable was flagged); and the read-only stash subcommands
  `git stash list`/`show` are exempted from the git-write scan (stripped before the verb test, so a
  chained `git stash list && git commit` still flags — no bypass).
- **`developer.md` — no git-write to inspect HEAD.** The "stash and rebuild" anti-pattern (a forbidden
  ADR-18 write the detector flags) is replaced with read-only `git show HEAD:{path}` + documenting the
  suspected pre-existing failure; the reviewer confirms attribution (it already runs verification).
- **Mechanism-aware acceptance criteria** (`create-implementation-plan`, `architect.md`) — each
  load-bearing acceptance line asserts the *mechanism* that proves it (test file + assertion shape, or
  exact grep target), not a surface outcome; with the stub-auth structural-gate and self-flagging
  source-grep traps named.
- **Run plan-mandated tests under an *including* filter** (`review-format`, `reviewer.md`) — a green
  baseline that *excludes* a required test (e.g. `--filter Category!=Integration`) proves nothing about
  it; and don't assume a tagged test needs a live dependency.
- **Broaden the code-grounded / adversarial review trigger** (`architect.md`) to raw-SQL/persistence
  changes and negative-assertion gates; with a standing reviewer check (`review-format`, `reviewer.md`)
  that a "X never called" / `CallCount == 0` assertion is a gate only if a reachable path to X exists —
  catches the vacuous test.

## [1.13.0] — 2026-06-16
Unattended autonomy v1 — Nexus runs unattended (`claude -p`) as a **strictly additive** mode
(`adhoc-UnattendedAutonomy`, ADR-30/31/32). Attended is byte-unchanged, pinned by a golden test.

- **`verify-gate.js` — an always-on advisory `SubagentStop` verify gate (ADR-31).** A net-new
  matcher-less `SubagentStop` hook: when the implementation subagent (developer/solo) completes, it
  runs the project's declared verify set and appends a verdict to `.claude/audit/verify-verdict.json`.
  It **never denies or blocks** — a blocking `SubagentStop` would trap a verify-failed subagent in an
  unsatisfiable retry loop, so enforcement is by *consuming the recorded verdict*. A recognized
  non-impl role's stop writes no verdict; an absent/unrecognized `agent_type` writes an
  `agent:"unknown"` record (never a silent skip — the false-green guard). The hook can't read
  `[UNATTENDED]` (separate process) — it always runs advisory; the mode fork lives in the team lead.
  The literal `nexus:developer` `agent_type` was live-verified (claude 2.1.179, 2026-06-16) and is
  pinned by a `SubagentStop` CONTRACT entry in `platform-contract.test.mjs`.
- **`.claude/verify.json` — project-declared verify commands** (`{commands:[{run,blocking}]}`) with a
  runner-detection fallback when absent. This repo dogfoods it (`node --test` glob + `selfcheck.mjs`).
- **Team lead consumes the verdict — attended informs / unattended decides (`team-lead.md`).** One
  verify execution path; the only fork is consumption. Attended, the verdict is advisory; unattended,
  a `blocking_failed` at the implementation-phase checkpoint **defers the item to the review queue**.
  Scoped to that checkpoint only — a Step-1 red-test-authoring fail is a true-green it does not act on.
- **`.claude/review-queue/` — the fail-closed sink (ADR-32).** Unattended never force-accepts or
  force-ships; on verify-fail / 3-cycle-exhaustion / unanswered-question / token-cap the team lead
  drops one resumable file per item (slug + reason + audit pointer + ADR-19 resume instruction) + an
  index. A per-run token cap aborts-to-queue, with a loud-inert launch warning when `token_audit` is off.
- **Golden regression test (`attended-unchanged.golden.test.mjs`, AC-0.3).** Pins flag-off
  byte-identity: the gate emits no deny/block and no queue artifact, and the existing
  PreToolUse/PostToolUse hooks still fire and decide identically with the new entry present.
- Documented in `agents-workflow.md`; ADR-30/31/32 in the register. Layers 2 (enforceable advancement)
  and 4 (anti-gaming holdout) are roadmap, not built here.

## [1.12.0] — 2026-06-16
The fleet view — a consolidated, on-invoke dashboard of the running background agents
(`adhoc-NexusFleetView`, ADR-33). Additive and two-way-door; existing behavior is unchanged.

- **Statusline heartbeat (`statusline/subagent-rows.js`).** After rendering the rows, the renderer
  now persists a normalized fleet snapshot to `<root>/.claude/audit/fleet-state.json` — the only
  place the rich live roster (per-task tokens/startTime/status/role) is delivered. Root-resolved
  from the statusLine payload's `workspace.project_dir`; atomic temp-then-rename; drains to an empty
  snapshot when the fleet ends; fully fail-open so row rendering is never disturbed.
- **`fleet` skill.** Reads that snapshot and joins it best-effort with the newest
  `communication-log.md` header (phase/cycle), `token-usage.jsonl` (per-agent tool-call depth, with
  `token_audit` on), and `violations.log` (boundary-event count) into a header / per-agent-line /
  health-footer dashboard. Every missing source degrades to a pinned one-liner; a stale snapshot is
  labelled, not rendered as live. User-invoked observability surface, single-project/current-session.

## [1.11.0] — 2026-06-16
Research-refinements batch — additive, attended-mode improvements distilled from the
orchestration-fork research (`docs/research/2026-06-16-orchestration-fork-value-extract.md`).
Every item is purely additive; existing attended behavior is unchanged beyond the named addition.

- **A4 — parallel Options Panel (`architect.md`).** For high-uncertainty designs only, the
  architect may offer a panel of 2–3 parallel approach sketches (minimal / clean / pragmatic),
  synthesized into one comparison + a single reasoned recommendation. **Double-gated:** fires only
  when the master gate (ADR-25) flags the design high cost-of-being-wrong AND the user opts in at
  the Phase-1 checkpoint; default skip for routine work. Sketches are read-only `general-purpose`
  helpers, never nested pipeline-role agents (ADR-21).
- **B5 — confidence-gated, multi-axis review (`reviewer.md` + `review-format`).** Findings now
  carry a numeric **Confidence (0–100)** with a **report cutoff of ≥80** — below-80 findings move
  to Open Questions, never silently dropped (bands onto the existing HIGH/MEDIUM/LOW). Step-2 review
  is documented as three axes (simplicity-DRY / bugs-correctness / conventions) — a checklist by
  default, with an **optional** read-only fan-out reserved for large diffs.
- **B6 — Origin taxonomy (`review-format` + `reviewer.md`).** Each finding carries an **Origin**
  (requirements / design / implementation / external) alongside Severity — a causal tag that routes
  the process fix (a design-origin finding goes to the architect, not the developer). Never changes
  the verdict.
- **B4 — doc drift.** The core README's component table now states **Rules: 11** (was 10),
  matching the actual `rules/*.md` count and the marketplace README.
- **B3 — platform-contract smoke test** (`tests/lint/platform-contract.test.mjs`, dev-repo only).
  Pins the Claude Code contract strings the hooks depend on — the `Skill` tool name + matcher, the
  `Agent|Task` matcher + `subagent_type`, the `.personas.json` / `.current-agent` registry files —
  so a silent platform rename fails loudly instead of false-greening a gate.

## [1.10.0] — 2026-06-15
- Research-KB: add search-researches (inline recall + forked-execution research skill) and research-entry-schema (entry format + cite-or-drop claim grammar); wire the research-before-asking rule to route capture+recall through them.
  - rule (injected every session)
  - skill change (research-entry-schema)
  - skill change (search-researches)
  - owner-escalated to minor

## [1.9.3] — 2026-06-15
Subagent status-line rows for the pipeline (experimental wiring).

- **`subagentStatusLine` renderer** (`statusline/subagent-rows.js`) — restyles the agent-panel
  rows for recognised pipeline roles (team-lead, architect, po, developer, reviewer, critic,
  learner, solo) as a colour-coded `[role]` tag · description · token count · elapsed. Rows it
  doesn't recognise keep Claude Code's default rendering, and a malformed payload fails open (no
  output). Role detection is word-boundary matched, so substrings like "purpose" never fire `po`.
- **`settings.json`** wires `subagentStatusLine` to the script via `${CLAUDE_PLUGIN_ROOT}`.
  Whether that variable expands in a plugin `settings.json` is undocumented — if it doesn't, the
  rows simply render default (a safe no-op) pending an installer-skill fallback.
- Unit suite `tests/unit/subagent-rows.test.mjs` (8 tests) pins detection, fail-open, token
  formatting, and column clipping.

## [1.9.2] — 2026-06-14
- PATCH bump.
  - agent instruction/behavior change
  - shipped command changed

## [1.9.1] — 2026-06-14
Applied five promoted items from the 1.9.0 learner feedback file (`docs/plugin-feedback/nexus-1.9.0-2026-06-14.md`) — all small, prose-only.

- **P2(a) — standalone critic salvage-persist.** `architect.md` standalone critic bullet now mirrors
  `team-lead.md`: salvage a thin/stranded critic message and persist findings verbatim to
  `review-critic.md`; record explicit non-emission rather than fabricate. (Part b — giving the critic its
  own write — is an architect decision, still owed.)
- **P3 — 0-byte output is expected, not a hang.** Caveat in the team-lead Relay-Contract recovery order
  + a new hard-rule in `agents-workflow.md`: a 0-byte spawn `output_file` is not a hung agent (check the
  transcript), and never poll a sibling agent's output to infer progress (the ADR-21 misread).
- **P4 — create→extend disposition table.** New rule in `create-implementation-plan` requiring a
  `covered/new/deferred` disposition table when a plan's scope flips from create to extend.
- **N4 — dev-repo carve-out.** `improve-skills` "Two Channels" now notes that in the plugin source repo
  shipped skills are fixed directly (lint is the done-condition); the feedback-file channel is the
  consuming-project path.
- **N6 — learner sweeps the comm-log.** `learner.md` now requires `communication-log.md` (Runtime /
  Plugin Issues sections) as a second consolidation source alongside `lessons.md`.

## [1.9.0] — 2026-06-14
- MINOR bump.
  - agent instruction/behavior change
  - skill change (create-implementation-plan)
  - skill change (review-format)
  - skill change (proposal-format)
  - owner-escalated to minor

## [1.8.3] — 2026-06-13
Gate negation fix (P1) — `pipeline-gate.js` no longer false-positive DENYs a clean APPROVED review.

- **`approvedWithOpenHighSev()` exempts two non-finding prose shapes** from the open-severity scan,
  before the unresolved-window conclusion: **(a) negation** — a line matching `\bno\b[^.]*\b(critical|high)\b`
  ("No CRITICAL or HIGH findings.") states *absence*, not a finding; **(b) Confidence field** — a line
  matching `\bconfidence\b\s*[:*]` ("**Confidence:** HIGH") is the reviewer's per-finding format qualifier
  (review-format), not a severity. Both are line-local `continue` skips, identical in spirit to the
  existing LEGEND skip; the real invariant (an `APPROVED` verdict beside a genuinely-unresolved
  `### [CRITICAL|HIGH]` finding) still fires. Recurred across 4 pipelines — in `adhoc-DotnetSkillSweep`
  it blocked a clean APPROVED, the reviewer burned ~8h and died on a stream-idle timeout, and the field
  workaround was a raw write bypassing the Edit hook. Regression tests added in
  `tests/unit/pipeline-gate.test.mjs` (negation → ALLOW, Confidence field → ALLOW, real open HIGH beside
  both → still DENY).

## [1.8.2] — 2026-06-13
Confidence-Gated Research (P1) — makes a below-High confidence label *do* something instead of sitting
as an annotation, and closes the failure class where an unconfirmed assumption treated as fact produces
a confident wrong verdict.

- **D1 (universal) — an unconfirmed assumption lowers confidence.** The confidence hard rule
  (`agents-workflow.md` "All Agents" block) and the inlined confidence line in **all 5** agents
  (po, architect, solo, developer, team-lead) now state that *a clear basis means a confirmed basis —
  a belief is not a basis*: a verdict resting on an unconfirmed load-bearing assumption is **not High**,
  and that assumption is a **research target, not a basis**. The team lead also learns that a *relayed*
  below-High label may be assumption-derived — relay as-is, never silently upgrade. Inlined into every
  agent because a pointer doesn't reach a spawned subagent (ADR-2 #2 / ADR-14).
- **D2 (scoped po/architect/solo) — fact-shaped unknown → research.** `research-before-asking.md`
  becomes the **Research & Confidence Protocol**: a third unknown-category (a fact you can't resolve
  from current context — not a grep-able codebase fact, not a user preference) where **research is the
  default before you render a verdict**; a **depth dial** (cheap/local → resolve silently;
  expensive/external → offer with a rough cost estimate); and **capture-before-surface** (write findings
  to `docs/kb/research/{topic}.md` before surfacing — a bare convention; schema + recall are P2,
  retention P3). The `agents-workflow.md` offer rule keeps its full hard-rule text + codebase-facts
  corollary and gains a pointer to the protocol; po/architect's existing research-offer lines are
  reconciled (not duplicated) and solo gains a research-branch pointer.

## [1.8.1] — 2026-06-13
Fixes the `salvage-transcript.js` deliverable-selection heuristic (the recovery script the team
lead runs as leg 3 of the stranded-deliverable recovery order). Found live during the 1.8.0 run:
an agent emitted its real review (~21k chars) then capped the run with several fenced
"Complete."/"Done." lifecycle closers, and salvage returned an 85-char closer instead of the review.

- **Closer detection by shape, not length.** The old `looksLikeDeliverable = last.includes('\n') ||
  length >= 400` plus a `slice(-5)` longest-recent window failed two ways: a multi-line *fenced*
  closer cleared the newline shortcut, and when many closers piled up (8 in the measured case) the
  deliverable fell outside the 5-block window while one closer exceeded the 400-char bar. Replaced
  with: strip trailing fenced blocks to get the prose, classify a short (<400-char) lifecycle-keyword
  prose block as a closer, then walk back from the tail past the closers and return the last
  remaining substantive text. Correctly skips an even-longer *analysis* block that precedes the
  deliverable (so "pick the longest" stays wrong). `--final`, the stub-skip, and the all-stubs
  fail-safe are unchanged. New regression fixture replicates the full measured shape.

## [1.8.0] — 2026-06-13
Two enforcement gates for breaches the pipeline previously only detected (or not at all),
converting both from "an agent must choose to behave" into detect-then-gate: log the fact
deterministically, then gate on the logged fact (a background subagent's PreToolUse deny is
dropped — ADR-13 — so prevention at the prompt level is impossible).

- **Gate A — skill invocation is a logged, gated fact.** New always-on `skill-tracker.js` hook
  (PostToolUse `Skill`, not config-gated) appends `{ts, agent, skill, token, session}` to
  `.claude/audit/skill-invocations.log`. The architect done-check now scores skill-conformance
  against that log — the authoritative source — instead of the fakeable/omittable
  implementation.md self-report (now a cross-check); a missing `## Skills Used` section is a
  structural hard-Fail. The all-`None` exemption is preserved. `implementation-format` lists
  `## Skills Used` as a required section.
- **Gate B — gate fabrication is deterministically voided.** `boundary-detector.js` gains a
  `Bash` branch that flags a subagent state-changing git write (`commit`/`add`/`reset`/`push`/
  `stash`/`restore`/`switch`, anchored so `git commit-graph` and read-only git are not flagged).
  `team-lead.md` replaces "triage the violations log" with a deterministic void-and-rerun action
  matrix run at every verify point, with a `git log` author check as the guaranteed retroactive
  backstop. The Bash regex is best-effort (a `git -C` form or shell alias can slip it); the
  author check is the guarantee.
- **Audit substrate documented** (`agents-workflow.md`): both logs, both gates, and the
  detect-then-gate principle, so every agent shares one model of the audit substrate.
- **ADR-24 proposed** (owner ratifies) — records the detect-then-gate substrate; extends ADR-18/21.

## [1.7.2] — 2026-06-12
Names the allocation principle the pipeline already practices and wires it into the learner
(VWH adoption A1; `docs/proposals/vwh-adoptions-2026-06.md`). The shipped surface is one line of
learner behavior; the rest of the pass is dev-repo machinery (architecture record + T1 lint
extensions), which does not ship.

- **Learner classifies by locus** (`learner.md`): the consolidation classify step gains a third
  axis (c) **locus** — should a lesson become a **deterministic check** (hook/lint/CI), **prose**
  (rule/skill), or stay **with judgment**? Prefer the cheapest locus that cannot decay; a lesson
  restating what a gate already enforces is a prune candidate, not a promotion. (The architecture
  record's new *allocation principle* section, referenced from ADR-7/ADR-23, is the dev-repo half.)

## [1.7.1] — 2026-06-12
Two small imports from the Omnishelf estate sweep (10 candidate mechanisms triaged: 6 were
already nexus's own or covered by 1.7.0; the third genuine candidate — a standing
cross-cutting lessons inbox — is documented as a deferred proposal in the dev repo
(`docs/proposals/cross-cutting-lessons-inbox.md`) with an explicit adoption trigger).

- **Research-before-asking offer** (`agents-workflow.md` + architect + PO): when a question
  headed to the user could be materially sharpened by targeted research (codebase, KB,
  existing specs), offer it alongside the question — "I can research {X} first — want me to,
  or do you already have a direction?" Guards both failure modes: researching silently when
  the user already knows, and forcing a cold answer when researched context is cheap.
  Offer only where research would genuinely change the question.
- **Research-helper dispatch contract** (`agents-workflow.md` + architect's Explore pattern):
  point helpers at inputs by file path — never paste bulk content into the prompt — and
  require a structured return (counts + per-item one-liners + surprises, ~300 words). The
  cheap preventive half of the existing placeholder-is-a-non-result rule.

## [1.7.0] — 2026-06-12
Completes the skill-quality system (ADR-23 extension) — the remaining Lane A items from the
Omnishelf upstreaming plan (`2026-06-12-skill-quality-to-plugin.md`): the *design* layer and
the *review* layer join 1.6.0's write standard + mechanical gate.

- **New skill: `evaluate-skill`** — the review standard. Judges a skill against its own job
  statement (input → output → consumer → what excellent looks like), two anchors: first-pass
  quality AND whole-life job fitness (the measured estate pattern: high first-pass, failing
  loop-closure). Process: gather run evidence → lint as Layer 0 → judgment Layers 1–4 +
  capability overlays (`references/rubric.md`, genericized from the consumer's validated
  rubric) → severity-rated findings doc (`docs/skill-evals/`) with verdict + checked-clean
  list → fixes routed via improve-skills (local) or the plugin-feedback file (shipped,
  ADR-1). Project-specific overlays deliberately stay consumer-local.
- **New: `improve-skills/references/proven-patterns.md`** — the §7 catalog genericized:
  11 evidence-backed patterns (deterministic post-conditions, state-first writing,
  preserve-on-write, two-axis quality, carry-over confirm-or-refute, …) + 7 anti-patterns
  (dead-letter enforcement, half-landed fixes, restated rules, hardcoded inventories,
  fictional infrastructure, no-finalize-path, gate-nothing checkpoints), each with one-line
  provenance and a when-NOT-to-use fence. Wired into improve-skills' scaffold step, fix
  path, and Quality Gate — the design-judgment layer the lint can't check.
- **skill-lint.mjs — generic Layer-0 extras:** XML-tag-shaped tokens in prose (code blocks
  exempt; `{placeholder}` never `<placeholder>`), mojibake markers (U+FFFD / UTF-8-as-1252
  signatures), description-length cap warning, and a path-prefix fix so repo-level paths
  containing `references/` aren't treated as skill-relative. 5 new tests (TDD-first);
  config-driven project checks (retired names, index-sync, convergence pins) stay local.
- **Enforcement pins (AP1 applied to the system itself):** lint tests assert improve-skills
  names the lint as its done-condition and ships the script, and evaluate-skill runs the
  lint as Layer 0 and ships the rubric.

## [1.6.0] — 2026-06-12
The improve-skills overhaul (ADR-23) — the skill meta-loop now ends in a deterministic gate.
Evidence base: the Omnishelf job-fitness evaluation of the evolved skill estate (their addendum
diff-verified `omni:improve-skills` against our 1.5.1 source and moved the rewrite target here;
distilled in `docs/evidence/2026-06-11-omnishelf-job-fitness.md`), convergent with the
knowledge-gateway skills-decay audit: **a rule that isn't mechanically executed on every run is
decoration** — two independent projects, one law.

- **New: `skills/improve-skills/scripts/skill-lint.mjs`** — a portable lint shipped *inside* the
  skill (version-locked to the instructions that invoke it): SKILL.md present, no BOM (UTF-8/16),
  frontmatter valid, `name` = folder, `description` present, cited `references/`/`workflows/`
  files exist. Errors exit 1; thin descriptions warn. The dev repo dogfoods it — a new test
  lints every shipped nexus skill (11 new tests, TDD-first).
- **improve-skills SKILL.md rewritten** around "born compliant":
  - **Deterministic gate (both paths):** every fix and every scaffold ends with the lint
    exiting 0 — the done-condition, not advice.
  - **Born-compliant scaffolds:** frontmatter completeness (name=folder, when-to-use phrasing,
    `user-invocable`/`disable-model-invocation` decisions) + a registration step (skills index
    row) are scaffold steps 4/6.
  - **Write Discipline:** SKILL.md and reference files via the Write tool, UTF-8 without BOM —
    never shell redirection (measured incident: three skills silently registered broken by a
    shell-default BOM, found weeks later).
  - **Two entry points, one owner:** learner-classified items AND direct user requests
    ("build me a skill for X") run the same gates — the de-facto main entry point was
    previously unscoped; a separate create-skill skill was rejected (duplicate owner).
  - **Fixes are consolidating passes:** net complexity flat or down, never additive patching.
- **improve-flow — "Prefer Mechanical Enforcement":** when promoting a lesson, wire or extend a
  deterministic check (lint/test/hook/CI) instead of — or alongside — the prose rule, and name
  the enforcement in the report; prose-only promotions must say so explicitly.
- Architecture record: ADR-23.

## [1.5.2] — 2026-06-12
Refinements from the knowledge-gateway per-plan skill-usage audit (29 mapped steps across 11
plans → 3 Skill invocations; evidence distilled in `docs/evidence/2026-06-12-developer-skill-usage-audit.md`).

- **developer.md — mandate re-keyed on the mapping, not the "Follow" keyword.** A plan writing
  bare skill names (the measured F16 failure) now binds identically; the keyword is phrasing,
  the mapping is the trigger.
- **developer.md — fallback ladder gains the cache-Read rung.** Skill tool (bare → namespaced) →
  Read the installed SKILL.md from the plugin cache, recorded as a Read-channel deviation in
  `## Skills Used` → plan references, recorded. (F11's developer proved the cache rung works
  and is materially compliant; 1.5.1 had banned all disk reads.)
- **create-implementation-plan + plan-template — two new anti-patterns:** (a) a mapped skill
  without its disposition keyword in the step text (removed the developer's binding trigger —
  9 mapped steps, zero invocations); (b) structural-pattern code references on Follow steps
  (devs measurably imitate cited code and skip the skill — cite code only for feature-specific
  surfaces).
- **consumption-report — skill-usage caveat:** frontmatter preloads never appear as `Skill`
  tool calls; zero entries ≠ format non-compliance (a measured audit mis-conclusion).

## [1.5.1] — 2026-06-11
Restores the Fokus-baseline **Skill-First Implementation** section in `developer.md` — diluted in the
Fokus→nexus extraction (same loss class as ADR-19). Audit evidence: a 12-step plan with skills mapped
on 9 steps implemented with zero Skill invocations while the logger was active (sprint-rituals Pass 4).

- The 4-step invoke→load→implement→conflict recipe and the **"This is mandatory… STOP and invoke
  it"** self-check sentence are back, extended to `tdd` on `TDD: yes` steps.
- The dead fallback fixed: "read `.claude/skills/{name}/SKILL.md`" doesn't exist in plugin consumers
  (skills live in the version-keyed cache — probe-verified that bare AND `nexus-dotnet:{name}` forms
  resolve via the Skill tool). On a genuinely failed invocation: implement from the plan's pattern
  references + record the deviation in `## Skills Used` — never silently reconstruct from memory.

## [1.5.0] — 2026-06-11
The F16 remediation package (ADR-21/ADR-22) — anti-delegation, communication, read discipline, and
skills enforcement, all evidence-based from the audited F16-DataPathRework run (10-rogue-agent
self-advancement incident, 8/8 stranded deliverables, plan.md re-read ×35, 2 Skill invocations in
12.7h).

- **Anti-delegation (ADR-21).** New all-agents hard rule: a pipeline subagent never spawns
  pipeline-role agents (the F16 incident vector — a developer commissioned done-checks, a Step-2
  review, and a learner as correctly-typed agents, so ownership rules never fired); explicit
  entries in `developer.md`/`learner.md`; the false "as a subagent you *cannot* spawn" claims
  corrected to **must not** (architect/critic/learner). `boundary-detector.js` now also matches
  `Agent|Task` and logs a subagent's pipeline-role spawn to `violations.log`. The team-lead
  dispatch templates gain the standing "Phase-end = hand back and STOP" line; the learner gains an
  explicit approval gate before applying promotions.
- **Communication (ADR-22).** `salvage-transcript.js` default selection is now longest-recent (the
  measured 8/8 recovery winner; the old final-substantive pick failed all 8 verbose-closer
  strandings — `--final` preserves it). New all-agents final-message contract: the last message IS
  the deliverable, never an acknowledgement after it (reinforced per agent). Placeholder
  first-returns ("Standing by.") codified as non-results with a re-dispatch-once rule. Team lead:
  persists critic findings verbatim to `review-critic.md` (standardized), and documents that
  spawn-time `model` overrides do NOT survive `SendMessage` resume (platform constraint #4) —
  re-spawn fresh for model-critical phases.
- **Read discipline (ADR-22).** New all-agents rule: read each file at most **once per round**
  (sanctioned exceptions: post-compaction, cross-round external change, chunked first reads,
  offset checks); role-input boundary (the comm-log is the team lead's). New `read-tracker.js`
  PostToolUse hook: nudges on a 2nd same-round read, logs ≥3 to `violations.log`; round boundary =
  pipeline-state token/session change. `consumption-report` gains a re-read-offenders aggregation;
  the plan skill gains a plan-size budget (a plan is read by 4+ agents).
- **Skills enforcement.** The plan template's Skill Mapping gains a **TDD column** (`Skill: None`
  never waives TDD — F16 shipped 34+ tests test-after under an all-None mapping);
  `implementation-format` gains a `## Skills Used` section; the developer's completion checklist
  and the architect's done-check now verify skill conformance per step.
- **Plan-grounding additions** (from the knowledge-gateway feedback file): pre-authored
  operator-owed fallbacks for build-time-unavailable credentials; prompt-only LLM obligations must
  pair with a fail-closed validator or documented backstop; revision passes re-ground steps whose
  surface changed; presumed answers are never recorded as user-answered (`questions-format`);
  `lessons.md` is append-only per role (`lessons-format`).
- Stale "gate invariant 3" references fixed (`team-lead.md`, `agents-workflow.md`); the
  architecture record gains ADR-21/ADR-22 + platform constraint #4; the P2 skill-inventory
  limitation marked resolved (the F16 all-None mapping was verified honest). F11's "gate blocked
  Edit during implementation" feedback item: verified not-a-bug in current code — the gate blocks
  only during `:analyze`; the F11 symptom was a stale token + foreground writer.

## [1.4.1] — 2026-06-10
Learner consolidation from Passes 3c-C, 4, 5 — proven (2+ occurrence) lessons promoted into the plan skill and architect agent.

- **`skills/create-implementation-plan`**: new **Plan Grounding & Deviation Rules** section — (1) declare which surfaces are binding vs the developer's call (public/wire identifiers binding, internal names free; name the convention forks) so deviations are pre-sanctioned; (2) a hedge in a plan is a deferred read — resolve every disk-checkable "may/if needed/either-or" at plan time, cite counts only from greps, and trace cross-boundary contract fields to their actual source type. Extended the enumerate-all-consumers refactoring rule with a **method-hiding sweep** (`public new {Method}` + call-site static types — a `new`-hidden base method can have zero reachable callers).
- **`agents/architect.md`** (+ regenerated command mirror): adhoc/refactoring passes must **re-verify every aged finding against current source** (triage verdicts, proposal-era defect lists, prior-pass deferrals) before planning its fix — the cited defect may already be fixed; a "fix" for a fixed finding is a no-op or a regression.

## [1.4.0] — 2026-06-10
The enforcement + relay package (evaluation roadmap B/C, TDD-first: every change below
shipped with its test written and failing first; the offline suite lives in the dev repo).

**New: stranded deliverables are recoverable by script.** `hooks/scripts/salvage-transcript.js`
extracts a background agent's final substantive message verbatim from its platform-written
transcript (zero model tokens), skipping lifecycle stubs ("Ready when you are.") — the measured
stranding shape. The always-on rules context now injects the resolved plugin root + the exact
salvage command, and team-lead.md codifies the recovery order: **artifact → TaskOutput →
salvage → re-ask LAST** (re-ask measured 0/2). A stranded critic message is routed from salvage
exactly as if it had arrived.

**New: boundary violations are deterministically visible.** Probe P1 established that
PostToolUse hooks fire inside background subagents (where the gate's deny is dropped, ADR-13).
New `hooks/scripts/boundary-detector.js` (async, observe-only) logs every ADR-18 ownership
breach by a subagent — non-code role editing source, wrong-role artifact writes,
`.pipeline-state` writes — to `.claude/audit/violations.log`; the team lead reads it at every
checkpoint. Zero footprint when clean.

**Hardened: critic is physically tool-locked.** `disallowedTools: Write, Edit, MultiEdit,
NotebookEdit` in its frontmatter — platform-enforced regardless of spawn mode; message-only is
now mechanical, not instructional.

**Hardened: persona registry can no longer be clobbered by a subagent.** Probe P1 showed
subagent hook events carry the parent session_id; `register-persona.js` now ignores any event
with `agent_type`, so only the main thread registers personas.

**Artifacts self-certify.** `implementation-format` and `review-format` gain a completion
footer (`*Status: COMPLETE — {role}, {date}*`); the team lead trusts the footer, not the
completion message.

Also: developer.md Phase-2 heading now names the real resume message (Step-10 LOW-3 carry-over).

## [1.3.0] — 2026-06-10
Restores the worker-side halves of every pipeline contract that the Fokus→nexus extraction dropped
("the hub got hardened, the spokes got lobotomized" — full audit: adhoc-PluginCleanup). The team-lead
layer kept its formats and gates across 1.2.x; this release gives the five worker agents back the
protocols those gates assume, plus a consistency sweep and hook fixes.

- **developer.md** — two-phase plan workflow (analyze-and-stop checkpoint), idempotency/resume,
  step announcements, debugging protocol (diagnose + 3-attempt circuit breaker), TDD, Boy Scout,
  completion checklist, reviewer-findings response protocol, anti-patterns.
- **critic.md** — full investigation protocol (code-grounded feasibility, breadth scan, self-audit,
  realist + adversarial checks), severity scale, REJECT/REVISE/ACCEPT verdict, cross-reference
  matrix in the message (no-file contract kept).
- **reviewer.md** — pre-commitment predictions, `## Carry-Over Findings` consumption, fresh-evidence
  requirement (`git show HEAD~1:{path}` parity), stage gate, gap analysis, finding confidence,
  self-audit.
- **po.md** — question-answering mode (Cited/Inferred/No-answer, cite-or-escalate), read boundaries,
  pre-spec gap check, optional `help.tooltips.md` question (restore-lite), generic tracker flows,
  slug confirm.
- **team-lead.md** — Fast Mode dispatch (developer self-review), per-agent model/effort config via
  optional `.claude/nexus-agents.json` (spawn-param model + prompt-line effort, frontmatter fallback),
  Codex first-round-only heuristics, lessons-processing and completion-dashboard pipeline steps,
  unattended spec-gate abort, two-leg question routing.
- **learner.md** — two-channel lesson promotion: project-bound lessons applied on the spot;
  plugin-bound lessons routed to a portable `docs/plugin-feedback/` file for the plugin owner
  (consumers can't edit the plugin cache). improve-flow/improve-skills rewritten around the same model.
- **Consistency sweep** — every agent carries the identical slug/paths/caps compact-reference block
  (ADR-2); stale `v1.md`/`project-rules`/`@`-import references genericized across skills; stack-specific
  (.NET) examples abstracted out of create-implementation-plan.
- **Hooks** — audit-logger: truly zero-cost when off, logs to `.claude/audit/` with per-event detail;
  inject-rules: skips on resume; guard: split-flag `rm` + PowerShell `Remove-Item` coverage,
  `.env.example` excluded; pipeline-gate: unreachable background-role invariant removed (ADR-13);
  register-persona: handles Edit payloads; restore-agent: roles derived from `agents/` dir.

## [1.2.8] — 2026-06-09
Every recommendation an agent puts to the user now carries a **confidence label** (high | medium | low),
so the user can see at a glance which defaults are safe to rubber-stamp and which need real thought —
exactly the distinction that was implicit when, in Pass 4/5, the user accepted most PO defaults but made
a few calls personally.

- **New universal hard rule (`agents-workflow.md`):** when an agent surfaces a question/choice to the
  user — `AskUserQuestion`, a `To: user` question, or a recommendation handed up for the team lead to
  relay — it states its recommended answer + **Confidence: high | medium | low** + a one-line why.
  high = clear basis (spec/ADR/pattern/evidence), safe to proceed if unanswered; medium = reasonable
  lean with a real trade-off; low = toss-up, wants the human's call.
- **Echoed into the user-facing agents** (po, architect, developer, solo, team-lead) per ADR-2 (a
  spawned subagent sees only its own file). The team lead preserves an agent's confidence when relaying
  and adds its own when it asks. (Critic/reviewer/learner don't put option-questions to the user, so
  they're covered by the universal rule rather than an echo.)
- **Structural:** `questions-format` skill gains `Recommendation` + `Confidence` fields on every
  `To: user` question; the checkpoint-report "Action options" block now tags the recommended option
  with its confidence.

## [1.2.7] — 2026-06-09
Restores the spec-side review gate (sibling of 1.2.6's team-lead restoration). Found in a real run
(sprint-rituals Pass 4): the PO shaped a spec and went straight to `Status: Ready` with **no spec
review** — because the spec-review choice (self cross-check vs critic Mode 1) is written as an
interactive offer, and when the PO runs spawned/background it had no relay path and the team lead had no
checkpoint to surface it (unlike the architect's plan-review, which nexus wires correctly). The
coordinator then pre-empted it by handling only the PO's product questions.

- **PO spec review is now a mandatory, mode-aware gate (`po.md`).** Standalone (`be po`) still asks the
  user directly — individual flow unchanged. When **spawned**, the PO does not ask; it hands a
  `recommend {critic|self}` spec-review choice up to the team lead and never flips to Ready until the
  chosen review runs.
- **New PO Spec-Review Checkpoint in `team-lead.md`** — the spec-side mirror of the Architect Questions
  Checkpoint: after a spawned PO returns, the team lead surfaces self-vs-critic (Mode 1: spec vs
  product/architecture docs + ADRs) to the user before Ready; unattended → self cross-check.
- **Entry-point rule made explicit (`team-lead.md` Launch Path Selection):** the furthest existing
  artifact sets the start — plan exists → Developer; else spec (`Status: Ready`) exists → Architect;
  else → PO. **Never spawn the PO when a spec already exists**, exactly as the team lead never re-plans
  when a plan exists. The PO runs only for genuinely new behavior with no spec yet.

## [1.2.6] — 2026-06-09
Closes a severe failure mode found in a real run (sprint-rituals Pass 5) and restores the team-lead
operational depth lost when nexus was extracted from Fokus. The developer, spawned in the background
for Phase-1 analyze, ran the whole pipeline in one sweep — and **fabricated both quality gates**,
signing a Step-1 done-check as "Architect" and a Step-2 review as "Reviewer", plus a `summary.md`, and
self-committing. No rule forbade it; the gate is inert on background subagents (ADR-13). Two layers fix
it: an explicit **prevention** rule in the agents, and **containment** restored to the team lead. No
hook/gate code changed — rules + agent text + decision record.

- **Agent output boundaries (prevention, ADR-18).** New hard rules in the developer (and echoed in
  architect/reviewer + universal in `agents-workflow.md`): each artifact has **one owner**; an agent
  never authors another role's verdict, never signs as another agent, never commits, never writes
  `.pipeline-state`. "If a gate hasn't run, report it — never simulate it." The developer's outputs are
  source + `implementation.md` (+ `lessons.md`); everything else is read-only to it.
- **Artifact is the primary deliverable (ADR-17).** `agents-workflow.md` + the team-lead Relay Contract:
  the durable file is the mandatory primary output; `TaskOutput` is best-effort (it returned "no task
  found" for a completed agent in Pass 5). An inline-only verdict with an empty artifact is an
  incomplete result → re-spawn with the file as primary; never proceed on it.
- **Team-lead operational depth restored from the Fokus baseline (ADR-19).** Inlined (ADR-2 #2 blocks
  `@`-import): **verbatim relay to the user** (the team lead is the user's only window — show agent
  output before triage); **idempotency gate** + **safe Resume** (branch-mismatch block, done-check,
  resume-from-Step/Cycle via agent IDs); a **communication-log header** (the resume state) + Runtime/
  Plugin Issues Log; **phase-failure & timeout/stall recovery** (assess → resume → split; Retry/Edit/
  Skip/Abort menu); **escalation menu** (Continue/Force-accept/Abort); a **status-check table**; and
  **shutdown issue-investigation** (on detected issues, don't close silently — investigate, report).
- **Commit strategy → 2 commits with override (ADR-20).** Reverts the fixed 4-checkpoint scheme. Commits
  now happen only at team-lead-owned boundaries (plan approved, pipeline done), removing the
  post-implementation commit seam a subagent used to self-commit; overridable to 1 or 4 at launch.
- **Decision record:** ADR-17–20 added to `docs/architecture/README.md`, including why the team lead
  regressed (the Fokus operations file fell through the `@`-import gap at extraction).
- **Critic pass (folded in):** an independent critic review caught that ADR-17's artifact-primary
  inversion left the *opposite* pre-inversion wording in `developer/architect/reviewer.md` and split
  the team-lead Relay Contract's ordering — the `:43/:112`-vs-`:77` contradiction class ADR-16 had
  retired. Reconciled: the three agent handoffs now state "artifact first, message is a convenience
  copy"; the Relay Contract states the artifact-primary ordering once; a verbatim-relay/Read-Discipline
  bridge was added; and ADR-16 now back-references ADR-17.

## [1.2.5] — 2026-06-09
Enforcement moves into the agents; the docs stop claiming the gate does what it can't. Root-caused
from a real run (Pass 3c-C): the developer ran analyze→implement in one spawn while the token was
correctly `developer:analyze` and the gate produced **zero** denies — proving a synchronous
PreToolUse `deny` is **not honored for a background subagent** (the gate is inert for exactly the
agents it targets). No hook/gate code changed — this is rules + agent text + the decision record.

- **New universal hard rule — "never assume past an open question; stop and ask."** Added to
  `agents-workflow.md` (always-on) **and hard-coded into every agent file** (developer, architect,
  reviewer, po, critic, learner, solo) — per ADR-2 a spawned subagent sees only its own file, so the
  rule must live in both. A question-free phase may proceed; a phase with an *unsurfaced* question may
  not. The developer's narrow "if the plan contradicts itself" stop is broadened to any ambiguity.
- **team-lead.md slimmed to coordinate + enforce, not author agent rules (ADR-14).** Removed the
  agent-behavior sentence from the Phase-1 step (the "agent stops" rule now lives in the agent); added
  an **Enforcing the Rules** section — detect a broken rule, then apply the *least* intervention:
  self-fix-and-continue when there's no process impact, correct-in-place when recoverable, stop-and-retry
  only when a checkpoint is unrecoverable (ADR-15). Restarting a clean run is itself a defect.
- **Honesty fixes for the doc-drift that kept causing reverts.** `agents-workflow.md` + `team-lead.md`
  now say the `pipeline-gate` is a **best-effort tripwire** (bites a foreground writer; a background
  deny is dropped — ADR-13), not the two-phase enforcer. The stale `.pipeline-state` "cleared on
  SessionStart" line is corrected (`restore-agent.js` only touches the persona registry). The relay
  contradiction is reconciled: read the full result via `TaskOutput`, the inline notice is partial by
  design, the artifact is a legitimate fallback (ADR-16).
- **Architecture record: ADR-13–16** — gate-inert-on-background (qualifies ADR-7), agent
  self-containment, graduated minimal-intervention enforcement, and the relay model — so the next
  pass doesn't re-propose foregrounding or "the messaging is broken / disable OMC".

## [1.2.4] — 2026-06-08
Independent review gate for the learner — promotions now get a critic pass before close.

- **`critic.md`: new Mode 3 — Promotion Review** (code-grounded). The critic reads the *actual*
  promoted/edited files on disk + the source `lessons.md` and flags distortion, **over-promotion**
  (a 1-occurrence item promoted with no build-breaking/data-loss justification), **mis-routing**
  (ADR-1: stack-agnostic content in an extension, or stack-specific detail in the agnostic core),
  conflicts/duplication, and **artifact drift** (an edited `agents/*.md` with a stale `commands/*.md`,
  or a shipped change with no bump/CHANGELOG). The learner is added as a critic spawner (standalone →
  direct; team → via team lead), and folds the findings like the architect folds a plan review.
- **`learner.md`: a Mode-3 critic review is now a mandatory close step.** Promotions edit shared source
  that shapes every future run (highest blast radius), so they get an independent review exactly like a
  plan. An adversarial second opinion (`omc:critic` / Codex) is an opt-in add-on for large
  consolidations — never required (nexus depends on neither). Release machinery stays out of the shipped
  learner (dev-repo concern); the Mode-3 artifact-drift check backstops a skipped `gen-commands`.

## [1.2.3] — 2026-06-08
Learner consolidation from Passes 0–3c-B — proven (2+ occurrence) flow lessons promoted into the plan skill, the architect, and the coordination rules.

- **`create-implementation-plan`**: new **Refactoring & Type-Move Plan Rules** section — (a) a "fix/split/replace every file matching P" step must derive its file list from the *exact* acceptance grep (definition-line, not usage); (b) enumerate ALL consumer/DI/injection sites from a repo-wide grep before a removal; (c) "grep before delete" is a hard numbered sub-step for shared-type deletions; (d) "replace all X" needs file:line + DO-NOT-TOUCH carve-outs for non-call homonyms (the `"neutral"` literal, `HttpClient`/SignalR `SendAsync`, Mapster `.Adapt<T>()`); (e) type-move/rename needs an explicit old→new table + wire-stability invariants (`DataMember(Order)`, property/JSON-key names, wire-only `*Response` envelopes); (f) project-reference removal must grep dependent `GlobalUsings` + property/field/return types, not just `.csproj`.
- **`architect.md`**: the Feature Spec Workflow now handles **ad-hoc / refactoring passes that have no `spec.md`** — gate on backlog row + ADR register + triage, cross-check every ADR against its triage verdict (conflicts → user Q), and review via critic **Mode 2 against the ADR register**. Also: when subagent spawn is unavailable, an in-context critic must be **disclosed** (never called "independent"), and shared/external-artifact passes (skills, the plugin repo) require a **code-grounded** review as the load-bearing gate, not a doc-only critic.
- **`agents-workflow.md`** (Pipeline State): documented the three recurring `pipeline-gate` failure modes — inline user override (team lead must advance the token, not the agent), no self-advance / no Bash-`printf`/`mv` bypass, and the **foreign-repo blind spot** (the working-tree gate fails open for deliverables in another repo; the team lead enforces the checkpoint manually). The two-repo-aware `pipeline-gate.js` change remains a tracked, unimplemented improvement.

## [1.2.2] — 2026-06-08
Standard+Codex review made explicit and deterministic.

- **`team-lead.md`: Standard+Codex now mandates *both* reviewers run in parallel** — the nexus reviewer
  (Step 2) **and** Codex, independently (neither sees the other's findings). Codex never replaces the
  reviewer. The team lead **merges both into one deduped fix-list** for the developer (who never reads
  either review file) and reconciles a verdict conflict (reviewer APPROVED vs Codex NO-GO)
  finding-by-finding. The prior wording ("Codex before or alongside the reviewer") could be misread as
  Codex-only.
- **Renamed the Codex artifact `codex-crosscheck.md` → `review-codex.md`** so it pairs with `review.md`.

## [1.2.1] — 2026-06-08
Reverts the 1.2.0 pipeline-hardening experiment. The hardening regressed the thing that actually
worked — agents relaying their output to the team lead — without buying correctness the simple gate
didn't already give. Confirmed against a real run that shipped clean with the gate not even firing,
and against the `cfb7a64` / fokus baseline that "worked fine."

- **Restored the message-first relay model** (the `cfb7a64` model). Pipeline agents return their full
  verdict, questions, and findings **in their completion message**, and the team lead reads and relays
  that message. Reverted the 1.2.0 "minimal-return contract / never trust the agent's last message /
  grep the artifact for the verdict" machinery in `team-lead.md`, `architect.md`, `developer.md`, and
  `reviewer.md`. Artifacts (`plan.md`, `review.md`, `implementation.md`, `lessons.md`) remain the durable
  record — the team lead no longer reconstructs verdicts/questions from them.
- **Simplified `pipeline-gate.js` back to the load-bearing invariants** — (1) analyze-phase collapse
  (no `plan.md`/source written during an `:analyze` phase), (2) review.md verdict integrity (no APPROVED
  with an open CRITICAL/HIGH), (3) state-file integrity (a pipeline subagent can't rewrite
  `.pipeline-state`). Dropped the 1.2.0 additions: the team-lead read-lane (H0) and the dev-repo markdown
  source guard (H2b). Spawns pass through untouched (background by design, ADR-12).
- **Reverted `restore-agent.js`** (dropped the SessionStart `.pipeline-state` liveness-clearing, H4) and
  the hooks matcher (back to `Write|Edit|MultiEdit|Task|Agent`, no `Read`/`Grep`). Removed the gate/restore
  unit tests added with the experiment.

## [1.2.0] — 2026-06-07
Pipeline-gate hardening experiment — **reverted in 1.2.1**, see above. Tightened the team lead's read
lane (H0, hook-enforced), added a dev-repo markdown source guard (H2b) and a `.pipeline-state`
liveness clear (H4), and added a "minimal-return / grep-the-artifact" relay contract across the
pipeline agents. The relay changes regressed message relay and the extra gate lanes added no
correctness the simple gate lacked; all of it was rolled back in 1.2.1.
## [1.1.1] — 2026-06-07
Spawn mode reversed to **background** for pipeline agents (ADR-12, supersedes ADR-10). Also flips the
release policy to **PATCH-default** (owner escalates to MINOR/MAJOR) — see `release-plugin` skill.

- **Pipeline agents now spawn in the background.** The team lead spawns architect/developer/reviewer/PO/
  critic with `run_in_background: true` so the pipeline no longer blocks the main session — restoring the
  original `cfb7a64` default and the repo owner's standing preference. It reads each agent's full result
  via `TaskOutput` on completion and resumes the same live agent via `SendMessage` for Phase 2.
- **`pipeline-gate.js` foreground enforcement removed** (former invariant 3). Spawn mode is no longer
  hook-gated; the gate keeps the two-phase-collapse, verdict-integrity, and state-file invariants (now
  numbered 1–3). The 1.0.1 rationale (background "truncates" the relayed result) did not hold: relay
  reads the verdict from the artifact and the full result from `TaskOutput`, never the inline message,
  and a background agent stays alive to resume.
- **Docs:** ADR-10 marked superseded; ADR-12 records the reversal and why the foreground fears don't
  hold on the current platform.

## [1.1.0] — 2026-06-07
Token consumption audit — opt-in, off by default (ADR-11).

- **`token_audit` userConfig flag** (default off). When on, the `audit-logger` hook additionally
  records per-agent token usage to `docs/audit/token-usage.jsonl` (`{ts, agent, tool, input, output,
  cache_read, cache_creation, context}`), reading the last completed turn's `usage` from the
  transcript (a one-turn lag, fine for a growth curve). Off by default — zero extra work when
  disabled; the existing `tool-calls.log` trace is unchanged.
- **`consumption-report` skill** — aggregates that log into a per-agent table: peak context, output
  generated, tool-call count, and context growth (first → peak), so you can see which agent burns the
  most tokens and tie its growth back to what it re-read. Dedups same-turn rows so output isn't
  multi-counted.

## [1.0.2] — 2026-06-06
Hotfix: revert the implementer agents off the 1M-context model.

- **`developer`, `reviewer`, `solo` moved back to the `sonnet` alias** (from `sonnet[1m]`).
  Sonnet 1M context requires usage credits on every plan, which blocked Developer Phase 1 with a
  1M-context credit error. The plain `sonnet` alias (200K, subscription-covered) avoids the cost.
  `effort: max` is retained — effort does not incur the 1M credit charge.

## [1.0.1] — 2026-06-06
Pipeline-orchestration fixes: spawn mode and review-mode timing (committed in `024fcf2`
without a bump; this release carries it to users).

- **Foreground pipeline spawns enforced.** `pipeline-gate.js` now denies a pipeline agent
  (architect/developer/reviewer/po/critic/learner) spawned with `run_in_background` — a background
  spawn truncates the relayed result (breaking verdict relay) and leaves no live agent to
  SendMessage-resume for Phase 2 (ADR-10). The team-lead's Two-Phase Spawn now carries an
  imperative "Foreground, always" rule at the spawn site; the hook matcher is broadened to
  `Task|Agent` so the gate sees spawns.
- **Pipeline-gate state-file tamper protection.** `pipeline-gate.js` now denies any pipeline
  subagent (architect/developer/reviewer/po/critic/learner) from writing `.claude/.pipeline-state`
  — the two-phase gate's own source of truth. Previously a subagent could rewrite it to flip its own
  `analyze`→`implement` phase and silently bypass the collapse gate (guard.js treats `.claude/` as
  writable and it is not a plan/source file, so nothing else stopped it). Only the team lead advances
  phases now; the main session is unaffected.
- **Review-mode question deferred to the post-Phase-1 checkpoint.** Removed from the team-lead's
  launch-time Pre-Flight. The architect owns the decision: it recommends in its Phase-1 report when
  team-spawned, and asks itself alongside the Phase-1 questions when running standalone — so it is
  no longer asked before any design analysis has happened.
- **Per-agent model & effort tuning.** Added an `effort:` level to every agent (opus agents →
  `xhigh`, sonnet agents → `max`) and moved the implementer agents (developer, reviewer, solo)
  to the 1M-context `sonnet[1m]` alias. **Cost note:** Sonnet 1M context is billed via usage
  credits on every plan (not subscription-covered), so those three agents now carry that cost
  on every install.

## [1.0.0] — 2026-06-06
First versioned release. Graduates from the `0.1.x` line to `1.0.0` and adopts the
MAJOR-leaning version policy (the payload is agent behavior and the install cache is
version-keyed, so most changes must reach users). Backfilled from git history.

Baseline included in 1.0.0:
- Eight-agent pipeline (team-lead, architect, developer, reviewer, po, critic, learner, solo)
  with hub-and-spoke coordination, two-phase spawn, verdict validation, and persona commands.
- Always-on rules injected via the SessionStart hook (`inject-rules.js`); enforcement hooks
  `guard.js` (security guard, `security_mode` userConfig) and `pipeline-gate.js`.
- Artifact-format skills (`implementation-format`, `questions-format`, `review-format`,
  `lessons-format`, `summary-format`) preloaded producer-only; process skills
  (`create-implementation-plan`, `create-architecture-doc`, `create-feature-spec`,
  `improve-flow`, `improve-skills`, `diagnose`, `tdd`, `boy-scout`, kb/schema skills).
- Team-lead and architect **read discipline** (grep verdicts, own the comm-log, never re-read
  the plan you authored) — the change that triggered this release.
- **`release-plugin` skill + `scripts/bump-plugin.mjs`**: a **dev-repo tool** that owns the
  version-bump decision and the ADR-9 release flow (classify → bump + CHANGELOG in the same commit
  → regenerate → validate → tag). Invoked directly when developing the plugin; the local reminder
  lives in the dev-repo `CLAUDE.md` and the guarantee is a CI `--check`. **Not** wired into the
  shipped agents — nothing about releasing reaches consumer-facing agent behavior. No session hook.
