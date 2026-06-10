# adhoc-PluginCleanup — Step 10 Verification Review

**Reviewer:** fresh-context (independent of the implementing session)
**Under review:** commits `772185b` (Track 4 machinery, no bump) + `9314af4` (release 1.3.0)
**Checklist:** `docs/audit/nexus-plugin-audit-2026-06-09.md` (every finding ID) + plan Step 10 convergence claims
**Method:** code-grounded — every disposition below spot-verified against the files at HEAD (working tree == HEAD, confirmed clean), not taken from implementation.md. Acceptance greps from plan Steps 7/9 re-run; `gen-commands.mjs nexus` re-run against the committed `commands/`; `gen-omni.mjs --check` re-run.

## Verdict: APPROVED

All audit findings are FIXED, DEFERRED (named in the plan's Out-of-scope), or SKIPPED with a documented reason. Zero MISSED. The three convergence claims hold (one cosmetic wording nuance, LOW). One MEDIUM hygiene finding (the audit report itself is untracked and now gitignore-masked) and three LOWs — none blocks; all are post-release fixes.

**Counts:** FIXED 78 · DEFERRED 7 · SKIPPED-WITH-REASON 1 · PARTIAL 1 (M7, LOW) · MISSED 0 · N/A (ID not present in any surviving audit artifact) 10.

---

## Disposition table

Legend: **FIXED** (verified in the diff at the cited location), **DEFERRED** (named in plan Out-of-scope / implementation.md carry-overs), **SKIPPED** (reason documented), **N/A** (the prompt's ID range overshoots — the ID appears in no surviving audit artifact: not in the audit report, plan, or plan-review coverage matrix; source `.tmp-audit-*.md` reports were deleted per plan Step 9.8).

### D-series — developer.md (spot-verified: D1, D6; rest read in full)

| ID | Disposition | Evidence |
|----|-------------|----------|
| D1 | FIXED | `agents/developer.md:22-53` "Plan Workflow — Two Phases": Phase 1 `Analyze {slug}` → checkpoint-and-STOP (`:37` "Do NOT write any code in this phase"); spawned-mode collapse license removed — `:119` hard rule: "When **spawned by the team lead**, Phase 1 always ends at the analyze checkpoint — even question-free… Only in **standalone** mode may a question-free analysis proceed." ADR-18 hard rules preserved verbatim (`:121-123`). |
| D2 | FIXED | `:28` idempotency check (note first incomplete step); `:42` Phase 2 resume, never redo completed steps. |
| D3 | FIXED | `:44` "Step N done. Moving to Step N+1: {name}. If you skip a number, stop." |
| D4 | FIXED | `:98-111` Completion Checklist table, blocking gates before "ready for Step 1". |
| D5 | FIXED | `:147-156` "When the Reviewer Returns Findings" — fix-by-severity, dispute protocol, cycle message. |
| D6 | FIXED | `:84-92` Debugging Protocol — `diagnose` skill invocation + **3-attempt circuit breaker** → STOP, questions.md, architect. Mirrored for solo (`solo.md:21-24`). |
| D7 | FIXED | `:48` TDD bullet (Phase 2 #8) — `tdd` skill no longer orphaned. |
| D8 | FIXED | `:94-96` Boy Scout section; also added to `solo.md:24` — both claimed loaders now real. |
| D9 | FIXED | `:72` Skill-tool failure fallback (retry → read SKILL.md → log gap). |
| D10 | FIXED | Frontmatter `:6` `skills: …, lessons-format`; `:137-145` "After Each Implementation Round" + before-compact rule. |
| D11 | FIXED | `:125-135` Anti-patterns (7 items, incl. pre-existing-build-failure attribution). |
| D12 | SKIPPED | Plan Step 2: "Skip — redundant: nexus developer is plan-driven; the architect classifies." Echoed in implementation.md Step 2. |
| D13 | N/A | No D13 exists — D-series ends at D12 in the audit/plan/plan-review. |

### C-series — critic.md (spot-verified: C1, C5, C6)

| ID | Disposition | Evidence |
|----|-------------|----------|
| C1 | FIXED | `agents/critic.md:49-57` "Phase 2.5: Implementation Feasibility (codebase-aware)" — pattern conflicts, formula divergence, cross-cutting retrofits, "Cite file paths for evidence." |
| C2 | FIXED | `:30-32` Phase 1 Pre-commitment; `:84-91` Phase 5 Self-Audit (low-confidence → Open Questions); `:93-100` Phase 5.5 Realist Check + ADVERSARIAL escalation. |
| C3 | FIXED | `:69-73` edge-case probing, ambiguity splitting (two plausible readings → flagged), backward impact. |
| C4 | FIXED | `:75-82` Phase 4.5 Breadth Scan incl. `:80` "**'Not mentioned' is not the same as 'explicitly deferred'**". |
| C5 | FIXED | `:106-111` severity scale; `:113-117` REJECT/REVISE/ACCEPT verdict definitions; `:129` verdict line in the message format. Consumers wired: team-lead.md:164 + po.md:125 (see Convergence claim 2). |
| C6 | FIXED | `:134-137` Cross-reference Matrix (COVERED/PARTIAL/MISSING) **in the message body**; `:151-153` Evidence Requirements ("Findings without evidence are opinions"); no-file contract preserved (`:119-121`). |
| C7 | FIXED | `:155-157` Tool Usage — "Reading code is not 'reviewing implementation' — it's verifying feasibility." |
| C8 | N/A | No C8 exists — C-series ends at C7. |

### R-series — reviewer.md (spot-verified: R1, R2)

| ID | Disposition | Evidence |
|----|-------------|----------|
| R1 | FIXED | `agents/reviewer.md:19` "Note every entry in its **`## Carry-Over Findings`** table… require explicit confirmation or refutation in review.md"; obligation echoed `:72` and `:80` (anti-pattern). |
| R2 | FIXED | `:34-41` Fresh Evidence — "**Run verification yourself.**… `git show HEAD~1:{path}` and compare behavioral parity." |
| R3 | FIXED | `:32` Stage gate — conformance fail → immediate REQUEST-CHANGES write; "no behavior change" = persisted/observable outcome. |
| R4 | FIXED | `:18` pre-commitment predictions; `:56-61` confidence qualifier; `:63-68` Self-Audit — review-format template sections now have generating procedures. |
| R5 | FIXED | `team-lead.md:201` "**Codex runs on the first review round only** — fix-cycle re-reviews (cycles 2, 3) are reviewer-only" + when-to-recommend heuristics (complex analytics / full-stack / filtering-pagination). |
| R6 | FIXED | reviewer frontmatter `:6` gains `lessons-format`; `:95-97` After Review lessons bullet. |
| R7 | FIXED | `skills/review-format/SKILL.md:34-35` data-loading depth ("silent null/zero results") + boundary tests "at exactly N and N+1". |
| R8, R9 | N/A | No such IDs — R-series ends at R7. |

### P-series — po.md (spot-verified: P1, P4)

| ID | Disposition | Evidence |
|----|-------------|----------|
| P1 | FIXED | `agents/po.md:67-88` Question Answering Mode — Cited (`confidence: high`) / Inferred (escalate, "pipeline must not proceed on inferences") / No answer (escalate, never guess); per-question format; never-modify-spec-while-answering (`:88`). |
| P2 | FIXED | `:94-95` read boundaries — names/paths via Glob/Grep OK, never Read source contents; report bugs, don't investigate. |
| P3 | FIXED | `:35-44` "Before Writing the Spec" gap check (complete/testable/unambiguous/edge cases/guardrails). |
| P4 | FIXED (restore-lite, Q5) | `:52` one optional writing-time question → `help.tooltips.md` on yes; sync-check after review fixes. `rules/help-tooltips.md` producer restored. |
| P5 | FIXED | `:54` "if `docs/backlog.md` exists" → Status `Spec Ready` + link (consumer-facing; not locally exercisable per critic LOW-3 — documented). |
| P6 | FIXED | `:46` "Do not write the spec until the user explicitly asks." |
| P7 | FIXED (genericized) | `:26-29` tracker flows — ticket/epic shaping, no Jira-specific tooling (ADR-3). |
| P8 | FIXED | `:31-33` Slug Assignment — propose + confirm with user before creating folders. |
| P9 | FIXED (preserved) | `:115-125` 1.2.7 spec-review gate intact; only addition is the critic vocabulary on the "run the chosen review" line (`:125`). |

### T-series — team-lead.md (spot-verified: T3, T4)

| ID | Disposition | Evidence |
|----|-------------|----------|
| T1 | FIXED | `agents/team-lead.md:193-195` Fast Mode Dispatch — developer self-reviews via review-format checklist → `## Self-Review` in **implementation.md**; TL "validate that the `## Self-Review` section exists with a verdict line" before close; review.md stays reviewer-owned (ADR-18). |
| T2 | N/A | No T2 exists in any surviving audit artifact. |
| T3 | FIXED | `:276` Pipeline Sequence step 7 — "Process lessons from this pipeline?" → spawn learner scoped to this slug's lessons.md (unattended: skip + record). Learner now reachable from a normal run. |
| T4 | FIXED | `:277-285` step 8 Completion dashboard block (Steps/Review/Files/Lessons/Commits). |
| T5 | FIXED | `:373` Unattended — "the spec must exist with `Status: Ready`, or **abort the run** — never spawn the PO unattended." |
| T6–T8 | N/A | No such IDs — T-series ends at T5. |
| C5-hook | FIXED | `:164` — see Convergence claim 2. |
| Q4-config | FIXED | `:188` Pre-Flight 4b `.claude/nexus-agents.json` (model = spawn param, effort = dispatch-prompt line, frontmatter fallback) + `:100` Message Templates pointer. |

### H-series — consistency (H1–H4; spot-verified: all four)

| ID | Disposition | Evidence |
|----|-------------|----------|
| H1 | FIXED (per Q1) | `skills/improve-flow/SKILL.md:14-15` two channels — project-bound applied on the spot (CLAUDE.md, docs/conventions/); plugin-bound → "**never write into `.claude/` or the plugin cache**" → `docs/plugin-feedback/nexus-{version}-{date}.md`. `improve-skills:15-27` same model (project-local `.claude/skills/` legitimately owned by consumer). `learner.md:16-19,33` channel classification + `[ROUTED-TO-PLUGIN]` tag + new hard rule. Accept grep 1 re-run: remaining `.claude/skills` hits are all reads/project-local scaffolds — none instructs a plugin-world write. |
| H2 | FIXED | `create-architecture-doc/SKILL.md:31,36` and `create-implementation-plan/SKILL.md:25,77` — "use the skills surfaced in your context" (cache under-reporting named); project-local scan kept deliberately. `.claude/README.md` post-apply steps gone. |
| H3 | FIXED | Accept grep 2 re-run (`v1\.md\|project-rules\|loaded via @\|{version}\.md` over `plugins/nexus/`): only hit is the CHANGELOG line describing this very fix. `create-implementation-plan:76` now "read it if present — nothing is auto-loaded". |
| H4 | FIXED | `create-feature-spec/SKILL.md:7` retitled "(PO Reference)"; `:38-41` PO-first reading protocol (product/architecture index.md if present; "the PO never opens source files"; implementation questions → architect). |

### M-series — consistency

| ID | Disposition | Evidence |
|----|-------------|----------|
| M1 | FIXED (one LOW note) | Canonical `docs/architecture/index.md` everywhere: `create-architecture-doc:9,13,44` now **emits** index.md ("record version history inside the doc, not in the filename"); `decisions.md` grep over agents/ = zero hits; `{version}.md` grep = zero. The "dev-repo exception documented" sub-item is recorded only in plan.md itself, not in a durable doc — see LOW-2. |
| M2 | FIXED | `review-format:45` verdict definition reads APPROVED; no bare-`APPROVE` verdict remains (`:11,74,118` all APPROVED). |
| M3 | FIXED | `agents-workflow.md:3` "The agent pipeline (8 roles…)"; diagrams synced — developer.md:169-185 (canonical, PO branch + review.md `## Step 1`/`## Step 2` targets), team-lead.md:56-76 (PO spec-review-gate line + its additive review-fork detail), architect.md:280-315 (PO branch + review.md targets). |
| M4 | DEFERRED | Plan Out-of-scope: "documented cluster, change-all-at-once rule." |
| M5 | FIXED | `architect.md:330` checkpoint Action-options line carries `confidence: {high\|medium\|low} ({one-line why})` — matches developer.md:199 / team-lead.md:142. |
| M6 | FIXED | `team-lead.md:261-264` Question Routing Chain shows both legs (PO product leg + developer→architect technical leg). |
| M7 | PARTIAL (LOW-1) | `register-persona.js:14-16` "Two files BY DESIGN (don't 'unify' them)…" — the audit's intent (design documented) is met at the consumed location. The plan's second leg ("in ADR doc") did not land; implementation.md narrowed to "added to its header" without flagging the deviation. |
| M8 | FIXED | `agents-workflow.md:136` Standard+Codex row ("parallel independent cross-check, first review round only"); Fast row names the Self-Review mechanism. |

### L-series — consistency

| ID | Disposition | Evidence |
|----|-------------|----------|
| L1 | FIXED | improve-flow rewritten; section names appear only as current-name suggested-target guidance. |
| L2 | FIXED | Spec "Do not include" examples genericized; product-doc `v1.md` refs swept (grep clean — 7.15). |
| L3 | FIXED | create-implementation-plan refactoring rules abstracted to principles; .NET/Fokus specifics deleted (nexus-dotnet candidate noted in plan Out-of-scope). |
| L4 | FIXED | `docs/architecture/README.md:456` — "(line numbers refer to the pre-1.2.6 `team-lead.md` — historical record, since reconciled)". |
| L5 | FIXED | `developer.md:121` boundary bullet — "lessons.md (append only under your own `## Developer Lessons` / `## Skill Gaps` headings)". |
| L6 | FIXED | `agents-workflow.md:109` critic Managed-by — "Current hub: PO/architect/learner when standalone; team lead in team mode." |

### A-series — hooks (spot-verified: A1, A4, A6; all six scripts read in full)

| ID | Disposition | Evidence |
|----|-------------|----------|
| A1 | FIXED | `audit-logger.js:32` flag parse; `:90` `if (!AUDIT_ON) { process.exit(0); }` **before any work** — tool-call trace included in the gate (the audit's exact defect: trace written outside the guard). OFF = zero dirs/files. |
| A2 | FIXED | `:98` `root = CLAUDE_PROJECT_DIR \|\| data.cwd \|\| process.cwd()` (stray-log bug); output relocated to `.claude/audit/{sid}.log` (`:101-108`). Fokus detail field restored (`extractDetail`, 120-char, content-redacted). |
| A3 | FIXED | `:60-73` tail-only transcript read (last 64KB), partial-first-line skip handled (`:79`). |
| A4 | FIXED | `pipeline-gate.js:15-24` — invariant 3 **deleted**; header records why ("no caller both attributable AND blockable — unreachable code", ADR-13) and the gate's foreground-only scope. Invariants 1–2 intact (`:60-83`). |
| A5 | FIXED | `guard.js:121-127` split-flag collection (`rm -r -f`) + Windows targets (drive letters, UNC); `:131-134` basic PowerShell `Remove-Item -Rec* -Fo*` coverage. |
| A6 | FIXED | `hooks.json:35` PostToolUse matcher `Write\|Edit`; `register-persona.js:37` handles `ti.new_string` ("the file usually pre-exists… the model may legitimately Edit it"). |
| A7 | FIXED | `hooks.json:14` guard matcher `Read\|Write\|Edit\|MultiEdit\|NotebookEdit\|Bash` (was: none). |
| A8 | FIXED | `hooks.json:20` gate matcher `Write\|Edit\|MultiEdit` (Task/Agent dropped). |
| A9 | FIXED | `inject-rules.js:23-26` parses stdin, `source === 'resume'` → exit (≈6K dup tokens saved); fail-open on unparseable stdin. |
| A10 | FIXED | `inject-rules.js:42-45` per-file try/catch — one bad rule file no longer drops all rules. |
| A11 | DEFERRED | Plan Out-of-scope "Deferred LOWs": `.personas.json` lost-update race — TTL-design-acceptable. |
| A12 | FIXED | `restore-agent.js:56-59` root chain gains `evt.cwd` (same chain as register-persona). |
| A13 | FIXED | `guard.js:100` `.env.(example\|template\|sample)` excluded from the secret block. |
| A14 | DEFERRED | Plan Out-of-scope "Deferred LOWs": no env var exposes the approved additional-working-dirs list. |
| A15 | FIXED (verified) | `hooks.json` retains `"async": true`; implementation.md Step 1 checklist: `claude plugin validate plugins/nexus --strict` passed with it. CI plugin-validate job re-exercises the schema (advisory). |
| A16 | FIXED | `pipeline-gate.js:26-30` deliberate fail-open edges documented (Edit `new_string` scope; separator-required path match). |
| A17 | FIXED | `restore-agent.js:28-37` `validRoles()` derived from the plugin's `agents/` dir — hardcoded roster gone. |

### B-series — scripts/CI (spot-verified: B1, B3, B5)

| ID | Disposition | Evidence |
|----|-------------|----------|
| B1 | FIXED | `bump-plugin.mjs:110-118` — runtime-config test (`.mcp/.lsp.json`, `settings.json`) hoisted **above** the no-slash doc/meta check; comment names the ordering constraint ("must run BEFORE the no-slash doc/meta check below"). Probe verified in implementation.md Step 1 checklist. |
| B2 | FIXED | `:82-85` rename lines classify **both** sides ("A file moved OUT of plugins/ removes shipped surface"). Double-count caveat recorded in implementation.md Carry-Over #2 (harmless, same tier). |
| B3 | FIXED | `plugin-release-check.yml` push leg — `--base "${{ github.event.before }}"` with all-zeros guard (branch creation) and `HEAD~1` fallback; PR leg unchanged. Vacuous-diff bug closed. Force-push edge accepted in implementation.md Carry-Over #3. |
| B4 | FIXED (documented, per Q4) | `gen-commands.mjs:5-9` header documents the intentional frontmatter drop (spawned agents honor frontmatter; persona commands inherit session model); consumer override path = `.claude/nexus-agents.json` (team-lead.md:188). |
| B5 | FIXED | CI step "Generated commands in sync (audit B5)" — `gen-commands.mjs nexus && git diff --exit-code plugins/nexus/commands`, **nexus only** (critic CRITICAL-1 honored); `gen-commands.mjs:19-22` no-ops with exit 0 on a plugin without `agents/`. |
| B6 | FIXED | `gen-omni.mjs` `--check` mode (`:12-13,21,42-60`) — regenerate in memory, diff (missing/differs/extra), exit 1 on drift; mentioned in `release-plugin/SKILL.md:62` SYNC TWIN step. Re-run now: exit 0 (twin in sync). |
| B7 | DEFERRED | Plan Out-of-scope "Deferred LOWs": token-swap collision guard. |
| B8 | FIXED | `bump-plugin.mjs:17,42` `--note <text>` seeds the CHANGELOG first line. |
| B9 | FIXED (partial by design) | `:172-178` `readVersion()` returns null for a deleted plugin dir ("a reportable state, not a crash (audit B9)"); the other two B9 edges are by-design per the audit itself. |
| B10 | DEFERRED | Plan Out-of-scope; CI `plugin-validate` job carries `continue-on-error: true` with the "flip to required once green" comment. |

### C-hygiene

| ID | Disposition | Evidence |
|----|-------------|----------|
| C1-hygiene | N/A | Tree clean (re-verified: `git status` empty at HEAD). |
| C2-hygiene | FIXED | Logger relocated out of committed `docs/` → `.claude/audit/` (with A1/A2); ADR-8/ADR-11 amended (`docs/architecture/README.md:241-247,353-357`); `.gitignore` += `.claude/audit/`; `consumption-report` skill reads the new path with pre-1.3.0 fallback. |
| C3-hygiene | DEFERRED | Plan Out-of-scope: adhoc-PipelineHardening summary.md gap — "add a closure note when convenient." |
| C4-hygiene | N/A | Keep-as-is per plan-review (no action needed). |
| C5-hygiene | DEFERRED | Plan Out-of-scope "Deferred LOWs": named-files-vs-class — revisit if more `.claude/` state files appear. |

---

## Convergence claims (plan Step 10) — re-verified against the files

### 1. Developer two-phase verbs vs team-lead dispatch templates — PASS (one cosmetic nuance, LOW-3)

| Where | Quoted evidence |
|-------|-----------------|
| `team-lead.md:100` | "**First spawn (always Phase 1):** `Analyze {slug}.`" |
| `developer.md:26` | "### Phase 1: Analyze (prompt: \"Analyze {slug}\")" — **verbatim match** |
| `team-lead.md:102` | "**Resume developer:** `Implement. Answers: {answers or \"None — all clear\"}.`" |
| `developer.md:39` | "### Phase 2: Implement (resumed by team lead with answers or \"proceed\")" — verb **Implement** matches; "proceed" is a string the TL never sends (LOW-3, cosmetic) |
| `developer.md:119` + `team-lead.md:94` | Collapse license gone: question-free-proceed scoped to standalone only; "Never send a combined 'analyze and write/implement' prompt." |

### 2. Critic verdict vocabulary + TL Verdict Validation — PASS

| Where | Quoted evidence |
|-------|-----------------|
| `critic.md:113-117` | Verdict definitions for **REJECT / REVISE / ACCEPT** (REJECT on any blocking finding; REVISE when fixable; ACCEPT otherwise) |
| `critic.md:129` | `## Verdict: REJECT \| REVISE \| ACCEPT` in the message-body format |
| `team-lead.md:164` | "**Critic messages carry a REJECT / REVISE / ACCEPT verdict line** — advisory input you relay verbatim to the architect/PO who own the fixes; you never gate on it yourself." — same vocabulary, "advisory", "relayed verbatim" (the critic-HIGH-1 resolution, option b) |
| `po.md:125` | "the critic's verdict vocabulary is REJECT / REVISE / ACCEPT — on REJECT or REVISE, fix and re-verify" |

### 3. Carry-Over Findings heading — PASS

| Where | Quoted evidence |
|-------|-----------------|
| `skills/implementation-format/SKILL.md:22` | `## Carry-Over Findings` (producer format) |
| this run's `implementation.md:112` | `## Carry-Over Findings` (produced in practice) |
| `reviewer.md:19` | "Note every entry in its **`## Carry-Over Findings`** table — these are developer-flagged risks that require explicit confirmation or refutation in review.md." — exact heading; obligation echoed `:72`, `:80` |

The broken producer/consumer pair (audit R1) is closed.

---

## Sanity checks

| Check | Result |
|-------|--------|
| `plugin.json` version | **1.3.0** ✓ |
| CHANGELOG top entry | `## [1.3.0] — 2026-06-10` ✓ — full entry (not a stub), matches release content; 1.2.6–1.2.8 blocks preserved below (critic MEDIUM-2 honored) |
| Commands regen-clean | `node scripts/gen-commands.mjs nexus` re-run → `git diff plugins/nexus/commands` **empty** (all 8 regenerated byte-identical to HEAD) ✓ |
| 7.12 uniform block | "Slug / paths / caps" block present **exactly once in each of the 8 agents**, md5-identical across all 8 ✓ (declared change-together cluster, critic LOW-4) |
| `${CLAUDE_PLUGIN_ROOT}` in plugins/nexus markdown | One hit: `plugins/nexus/README.md:29` — prose **explaining** that the variable doesn't expand in markdown (documentation, not usage). `hooks.json` uses are correct (it does expand there). ✓ |
| Stray `.tmp-*` at repo root | None ✓ (4 `.tmp-audit-*` deleted; `.tmp-critic-plugincleanup.md` → `delivery/plan-review.md`, committed) |
| omni twin | `gen-omni.mjs --check` re-run → exit 0, in sync ✓ |
| Working tree vs HEAD | Clean — review performed against committed state ✓ |
| Two-commit shape | `772185b` machinery (no bump) + `9314af4` release — matches plan Step 9.7 ✓ |

Process note: the pipeline-gate denied this review file's first Write (verdict word plus quoted severity-vocabulary strings in the evidence) — the gate's documented conservative heuristic firing on a meta-review; evidence quotes were moved into table rows, which its legend exemption covers. Recorded as live confirmation that invariant 2 is active at HEAD's behavior, not as a finding.

---

## Findings

### MEDIUM-1 — The audit report (this effort's spec) is untracked and now gitignore-masked
**Where:** `docs/audit/nexus-plugin-audit-2026-06-09.md` + `.gitignore` (`docs/audit/` line added in `9314af4`).
**Evidence:** `git ls-files docs/audit/` → empty; `git status --ignored docs/audit/` → `!!` (ignored). The committed `plan.md:3` declares "**Input:** `docs/audit/nexus-plugin-audit-2026-06-09.md` (the audit is the spec)" — so the repo now ships a plan/implementation/review chain whose spec exists only on this machine and is silently excluded from every future `git add`. The `.gitignore` comment scopes the line to "pre-1.3.0 strays" (the `tool-calls.log`/`token-usage.jsonl` sitting next to it — those are correctly ignored), but it collaterally swallows the hand-written report.
**Fix:** `git add -f docs/audit/nexus-plugin-audit-2026-06-09.md`, or move the report to `docs/specs/adhoc-PluginCleanup/definition/` (it is this run's definition) and narrow the ignore to `docs/audit/*.log` + `docs/audit/*.jsonl`.

### LOW-1 — M7's ADR-doc leg not done (plan deviation not flagged)
**Where:** plan Step 7.10 vs `docs/architecture/README.md`.
**Evidence:** Plan: "one-line note documenting the … two-file design — **in ADR doc** + register-persona.js comment cross-ref." The register-persona.js header note exists (`:14-16`, verified); no corresponding note exists anywhere in `docs/architecture/README.md` (grep `personas.json|current-agent|write-trigger` → zero hits). implementation.md Step 8 records only "M7: two-file design note added to its header" — a silent scope narrowing. Audit intent (design documented at the consumed location) is met; the supplementary leg is missing.
**Fix:** one line in the ADR-8 hook inventory or a follow-up docs commit.

### LOW-2 — M1 "dev-repo exception documented" exists only in plan.md
**Where:** plan Step 7.5 / implementation.md Step 7 claim vs durable docs.
**Evidence:** "Dev-repo exception, documented not renamed: this repo's own `docs/architecture/README.md` is the plugin's ADR record, not a consumer architecture doc" — no such note found in `docs/architecture/README.md`, `create-architecture-doc/SKILL.md`, or `CLAUDE.md` (greps for "exception", "consumer architecture", "dev repo" → zero relevant hits). The claim is satisfied only by the plan/implementation artifacts themselves. Consumer-facing canonicalization is complete and unaffected; this is a dev-repo documentation nicety.
**Fix:** one line in the README header ("this file is the dev-repo ADR record; consumer projects use `docs/architecture/index.md`").

### LOW-3 — developer.md Phase-2 heading names a resume string the TL never sends
**Where:** `developer.md:39` vs `team-lead.md:101-102`.
**Evidence:** Developer: "(resumed by team lead with answers or \"proceed\")"; TL resume templates send `Implement. Answers: {answers or "None — all clear"}.` — the literal "proceed" appears in no TL template. Cosmetic: the Phase-2 trigger is the resume event, and the verb **Implement** matches verbatim.
**Fix:** change the parenthetical to "(resumed by team lead with answers or \"None — all clear\")" next time the file is touched.

---
Reviewed: commits 772185b + 9314af4 against docs/audit/nexus-plugin-audit-2026-06-09.md
