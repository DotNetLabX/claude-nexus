# adhoc-PluginCleanup — Implementation Plan

**Input:** `docs/audit/nexus-plugin-audit-2026-06-09.md` (the audit is the spec).
**Scope:** Tracks 1–4. Track 5 (OMC adoptions) is deliberately excluded — it needs platform-feature verification first and will get its own plan. Track 6 (push) is a user action.
**Release shape:** one commit for Track 4 (dev-repo machinery, no bump), then **one release `1.3.0` (MINOR)** containing Tracks 1+2+3 — fix everything, verify, ship once.
**Baseline for restorations:** `D:\src\fokus\.claude` (read-only). IDs (D1, C1, R1, P1, T1, H1, M1, A1, B1…) reference the audit and its source reports.
**Review:** critic Mode 2 (Opus, fresh context, code-grounded) — verdict **REVISE**, 1 CRITICAL / 3 HIGH / 7 MEDIUM / 4 LOW; **all findings applied in this revision** (markers "critic {ID}" inline). Review record: `.tmp-critic-plugincleanup.md` → moves to `delivery/plan-review.md` at Step 9.8.

---

## Decisions needed before implementation (defaults proposed — GO confirms defaults)

| # | Decision | Default (= what this plan implements) | Confidence |
|---|----------|----------------------------------------|------------|
| Q1 | Learner promotion target (H1) | **DECIDED (owner)** — ONE learner, two output channels: (1) project-bound lessons → applied on the spot to consumer `docs/` + `CLAUDE.md`; (2) plugin-bound lessons → consolidated into a **portable feedback file** `docs/plugin-feedback/nexus-{plugin-version}-{date}.md` (committable; consumers without plugin-source access send it to the plugin owner, who applies it in this dev repo — same channel works locally since owner's machine has both). Never written to `.claude/agents\|rules\|skills/`. | high — owner-confirmed design |
| Q2 | Agent-file growth | Accept growth now (developer ~112→~190, critic ~55→~200 lines); protocol-extraction-to-skill is a later, separate decision | high — one variable at a time |
| Q3 | audit-logger fate (A1/A2) | **DECIDED (owner)** — keep, opt-in via the **same `token_audit` flag** (one flag gates both logs), restore Fokus's per-session files + detail field, write under `.claude/audit/` not `docs/audit/` | high — owner-confirmed |
| Q4 | gen-commands frontmatter drop (B4) + per-agent consumer config | **RESEARCHED & RESOLVED** — clarification: spawned pipeline agents already honor frontmatter `model`/`effort`; the drop affects persona commands only. Research verdict (claude-code-guide, docs-verified): spawn-param > frontmatter > session is the documented model resolution; **effort is NOT a spawn parameter**; `${user_config.*}` never expands in frontmatter; `CLAUDE_CODE_SUBAGENT_MODEL` is global-only. **Design adopted (consumer per-agent config):** team-lead pre-flight reads optional `.claude/nexus-agents.json` (`{"architect": {"model": "opus", "effort": "xhigh"}, …}`); `model` passed as spawn param; `effort` relayed as a dispatch-prompt line ("Effort: {value}" — soft but the same mechanism agents use internally); missing file/key → frontmatter defaults. Implemented as ONE bullet in Step 6 (small, rides the MINOR). The `/agents` UI shadow-copy is the documented escape hatch for hard effort overrides (full-copy drift warning). B4 text: document the drop as intentional + point to `nexus-agents.json`. | medium — design verified; effort-via-prompt is advisory, not enforced |
| Q5 | help-files producer (P4) | **DECIDED (owner)** — restore-lite: PO asks one optional question at spec-writing time ("help content files? y/n"), produces `help.tooltips.md` only on yes | high — owner-confirmed |

---

## Step 1 — Track 4: dev-repo machinery (commit separately, NO bump)

**Files:** `scripts/bump-plugin.mjs`, `scripts/gen-omni.mjs`, `.github/workflows/plugin-release-check.yml`, `scripts/gen-commands.mjs`

1. **B1** — hoist the runtime-config test (`.mcp.json|.lsp.json|settings.json`) above the no-slash doc/meta check in `classify()` (bump-plugin.mjs:102 vs :124). Add a unit-style self-test or at minimum a comment naming the ordering constraint.
2. **B2** — classify **both** sides of a rename (`bump-plugin.mjs:79`), highest tier wins.
3. **B3** — CI: on push events pass `--base "${{ github.event.before }}"`; keep PR leg as is.
4. **B5** — CI: add staleness step `node scripts/gen-commands.mjs nexus && git diff --exit-code plugins/nexus/commands` (**nexus only** — nexus-dotnet ships no `agents/`/`commands/`; running the generator against it crashes, critic CRITICAL-1). Also guard `gen-commands.mjs`: no-op with a clear message when the target plugin has no `agents/` dir.
5. **B6** — gen-omni: add `--check` mode (regenerate to temp dir, diff against the omni tree, exit 1 on drift). Mention it in `release-plugin/SKILL.md` as a post-bump verification step (dev-repo skill — allowed).
6. **B4** — per Q4: document the frontmatter drop in gen-commands.mjs header.
7. **B8** — bump-plugin: accept `--note "<summary>"` to seed the CHANGELOG entry.
8. **B9 (partial)** — guard `readVersion()` against a deleted plugin dir (report, don't crash).

**Accept:** CI dry-run logic verified by running `node scripts/bump-plugin.mjs --check --base <prior-sha>` locally against a known-change commit; `gen-omni.mjs --check` exits 0 on a fresh regen and 1 after a synthetic touch.

---

**Execution note (Steps 2–7, critic MEDIUM-4):** several steps edit the same agent file (developer.md, architect.md, team-lead.md — restorations + the M3/M5 consistency edits). Apply **all edits to a given file in one pass**: fold Step 7's per-file items (7.7 M3, 7.8 M5) into the matching restoration step when touching that file.

## Step 2 — Track 1: developer.md restoration

**File:** `plugins/nexus/agents/developer.md` (+ frontmatter). Source: `fokus/.claude/agents/developer.md`.

| ID | Disposition | Notes |
|----|-------------|-------|
| D1 | **Restore adapted** | Add a "Plan Workflow — two phases" section mirroring the architect's Phase 1/Phase 2 structure: `Analyze {slug}` = read plan + conventions + patterns, surface questions, **output checkpoint report and STOP**; Phase 2 = resumed by team lead with answers. Reconcile the existing stop-and-ask bullet (`:52`): in **spawned** mode Phase 1 always ends at the checkpoint (even question-free — the TL triages); "question-free may proceed" applies to **standalone** mode only. **Preserve the nexus ADR-18 hard-rules (`developer.md:54-56`) verbatim** — the restored two-phase text wraps around them, never relaxes them (e.g. Fokus's softer "don't commit unless asked" must NOT displace "never commit"). |
| D2 | **Restore** | Idempotency: if `implementation.md` exists, note first incomplete step; Phase 2 resumes there; never redo completed steps. |
| D3 | **Restore** | Step announcements ("Step N done. Moving to Step N+1: {name}." — skipped number = stop). Feeds the TL's Plan-Steps tracking. |
| D4 | **Restore** | Completion Checklist (build / plan coverage / debug artifacts / deviations — blocking) before "ready for Step 1". |
| D5 | **Restore** | "When the Reviewer Returns Findings": read review.md, fix CRITICAL+HIGH first, record each fix in implementation.md, documented-dispute protocol, verify build, then handoff. |
| D6 | **Restore** | Debugging Protocol: invoke `diagnose` skill before burning attempts; **3-attempt circuit breaker** → STOP, questions.md, message architect. (Skill-tool invocation, not frontmatter preload — it's situational.) |
| D7 | **Restore** | TDD bullet: testable-behavior plan steps → invoke `tdd` skill, red-green-refactor. |
| D8 | **Restore** | Boy Scout bullet (consider invoking after completing changes to a file). |
| D9 | **Restore** | Skill-tool failure fallback (retry once → read SKILL.md directly → log gap in lessons.md). |
| D10 | **Restore + frontmatter** | "After Each Implementation Round" lessons section; add `lessons-format` to developer frontmatter `skills:` (producer carries its format — ADR-4). |
| D11 | **Restore** | Anti-patterns list (incl. pre-existing-build-failure attribution). |
| D12 | **Skip** | Task classification — redundant: nexus developer is plan-driven; the architect classifies. |
| L5 | **Fix here** | Boundary bullet: add "lessons.md — append only under your own `## Developer Lessons` heading". |

**Accept:** developer.md contains the two-phase section with analyze-and-stop; `:52` no longer licenses spawned-mode Phase-1 collapse; `tdd`/`diagnose`/`boy-scout` each referenced exactly where their descriptions claim.

## Step 3 — Track 1: critic.md restoration

**File:** `plugins/nexus/agents/critic.md`. Source: `fokus/.claude/agents/critic.md`. Keep all nexus additions (message-only output, Mode 3, hub-routing).

| ID | Disposition | Notes |
|----|-------------|-------|
| C1 | **Restore** | Phase 2.5 Implementation Feasibility — read existing code; pattern conflicts, formula divergence, cross-cutting retrofits; cite file paths. |
| C2 | **Restore** | Pre-commitment predictions; Phase 5 Self-Audit (LOW confidence → Open Questions); Phase 5.5 Realist Check (CRITICAL survives or 3+ HIGH → ADVERSARIAL mode). |
| C3 | **Restore** | Edge-case probing, ambiguity splitting (two readings → HIGH), backward impact enumeration. |
| C4 | **Restore** | Phase 4.5 Breadth Scan ("not mentioned ≠ explicitly deferred"). |
| C5 | **Restore adapted** | Severity scale + verdict vocabulary **REJECT / REVISE / ACCEPT** — stated once, used in the critic's **message** verdict line (the critic writes no file, so there is no file validation — critic HIGH-1). Consumption is wired in Step 6: one line added to team-lead.md Verdict Validation acknowledging the vocabulary. |
| C6 | **Restore adapted** | Output format incl. **Cross-reference Matrix** (every requirement: COVERED/PARTIAL/MISSING) + Evidence Requirements ("findings without evidence are opinions") — adapted to message-only output: the matrix is part of the returned message, no file written (preserves the nexus no-file contract). |
| C7 | **Restore** | "Read-only but expected to read code — reading code is verifying feasibility, not reviewing implementation." |

**Accept:** a Mode-2 critic prompt exercises code-reading per C1; verdict line uses C5 vocabulary; matrix present in output format.

## Step 4 — Track 1: reviewer.md restoration (+ TL Codex rule)

**Files:** `plugins/nexus/agents/reviewer.md`, `plugins/nexus/agents/team-lead.md` (Codex), `plugins/nexus/skills/review-format/SKILL.md` (R7)

| ID | Disposition | Notes |
|----|-------------|-------|
| R1 | **Restore** | Consume `## Carry-Over Findings` from implementation.md — each entry explicitly confirmed or refuted in review.md. |
| R2 | **Restore** | Fresh Evidence: run verification yourself; no approval without fresh build/test output; `git show HEAD~1:{path}` for refactoring parity. |
| R3 | **Restore** | Stage gate: conformance issues in Stage 1 → REQUEST CHANGES immediately, skip Stage 2. |
| R4 | **Restore** | Pre-commitment predictions + Self-Audit (refutable-with-context + confidence < HIGH → Open Questions) — the review-format template already expects these sections. |
| R5 | **Restore adapted** | Into **team-lead.md** Standard+Codex Dispatch: "Codex runs on the **first review round only** — cycles 2–3 are reviewer-only" + the when-to-recommend heuristics (complex analytics, full-stack, non-trivial filtering/pagination). |
| R6 | **Frontmatter** | Add `lessons-format` to reviewer `skills:` + restore the After-Review lessons bullet. |
| R7 | **Restore adapted** | Generic phrasing into review-format checklist: data-loading depth (silent null/zero), boundary tests at exactly N and N+1. |

**Accept:** reviewer consumes what implementation-format produces (R1 closes the broken pair); review-format template sections all have generating procedures again.

## Step 5 — Track 1: po.md restoration

**File:** `plugins/nexus/agents/po.md`. Keep nexus's 1.2.7 spec-review gate (P9) untouched. **Genericize all Fokus `docs/product/v1.md` references to `docs/product/index.md` during restoration** (Fokus po.md:108,179 — critic HIGH-2).

| ID | Disposition | Notes |
|----|-------------|-------|
| P1 | **Restore** | Question Answering Mode: cite-or-escalate; per-answer **Cited / Inferred / No answer** → confidence high/inferred/none; never let the pipeline proceed on inferences; don't modify the spec while answering. |
| P2 | **Restore** | Read boundaries: specs/product/backlog/architecture only — never open source files; report bugs, don't investigate. |
| P3 | **Restore** | Pre-spec gap check (complete? testable? unambiguous? edge cases? guardrails?) — flag gaps to user before writing. |
| P4 | **Restore-lite (Q5)** | One optional question at writing time: "Help content files for this feature?" → produce `help.tooltips.md` on yes; sync-check after critic fixes. |
| P5 | **Restore** | Update `docs/backlog.md` → `Spec Ready` + spec link when the spec goes Ready. (Consumer-facing — no `docs/backlog.md` exists in this repo; verified by behavior text, not locally exercisable — critic LOW-3.) |
| P6 | **Restore** | "Do not write the spec until the user explicitly asks — stay in discussion mode." (Protects the owner's individual PO flow — same constraint as 1.2.7.) |
| P7 | **Restore adapted** | Genericized: "feature originates from an issue-tracker ticket the user names → fetch it, shape epic/story per the slug conventions" — no Jira-specific tooling steps in core. |
| P8 | **Restore** | Slug assignment: propose + confirm with user before creating folders (`F{N}` follows last backlog number). |

**Accept:** the TL's escalation chain ("PO answers with citation → user only if PO can't") now matches a protocol the PO actually carries.

## Step 6 — Track 1: team-lead.md operational items

**File:** `plugins/nexus/agents/team-lead.md`

| ID | Disposition | Notes |
|----|-------------|-------|
| T1 | **Restore adapted** | Fast-mode dispatch template: developer self-reviews **using the review-format skill checklist** and records verdict + evidence in a `## Self-Review` section of **implementation.md** (NOT review.md — review.md stays reviewer-owned per ADR-18). TL validates that section exists before close. |
| T3 | **Restore** | Shutdown sequence: after reviewer approval, ask "Process lessons from this pipeline?" → on yes, spawn learner scoped to this slug's lessons.md. |
| T4 | **Restore** | Completion dashboard block (Steps/Review/Files/Lessons/Duration) at close. |
| T5 | **Restore** | Unattended defaults: spec gate — must exist with `Status: Ready` or abort; never spawn PO unattended. |
| C5-hook | **Add** | One line in Verdict Validation: critic messages carry **REJECT / REVISE / ACCEPT** — advisory, relayed verbatim to the architect/PO who own the fixes (the critic writes no file). Closes the audit's "TL/PO have nothing structured to validate against". |
| Q4-config | **Add (new, owner-requested)** | Pre-flight step: read optional `.claude/nexus-agents.json`; per-agent `model` passed as spawn param (documented precedence: spawn > frontmatter), `effort` relayed as a dispatch-prompt line; absent → frontmatter defaults. Mention the file in the dispatch-discipline section; one example inline. |

**Accept:** Fast mode produces a verifiable review artifact; learner reachable from a normal run.

## Step 7 — Track 2: consistency cleanup (mechanical — audit §2 + §1 stale refs)

**Files:** skills (`improve-flow`, `improve-skills`, `create-architecture-doc`, `create-implementation-plan` + plan-template, `create-feature-spec`, `review-format`, `diagnose`, `questions-format` untouched), `rules/agents-workflow.md`, `agents/architect.md`, `docs/architecture/README.md` (annotation only)

1. **H1 (per Q1, owner-decided)** — rewrite `improve-flow`/`improve-skills` promotion targets: project-bound → consumer `docs/` + `CLAUDE.md` (applied on the spot); plugin-bound → consolidated **portable feedback file** `docs/plugin-feedback/nexus-{plugin-version}-{date}.md` (committable; consumers send it to the plugin owner — the learner/`learner.md` carries the two-channel rule too). Delete every `.claude/agents|rules|skills/` write instruction.
2. **H2** — replace `.claude/skills/` globbing with "use the skills surfaced in your context" (per Known-Limitation P2); drop `.claude/README.md` post-apply steps.
3. **H3** — delete all "loaded via `@`" claims; `v1.md` → canonical name (see M1).
4. **H4** — rewrite create-feature-spec reading protocol PO-first (read `docs/product/index.md` + architecture index if present; no architect machinery references).
5. **M1** — canonical architecture-doc name = `docs/architecture/index.md`; sweep `architect.md:124` (`decisions.md`), both skills, AND make `create-architecture-doc` Generate mode emit `index.md` instead of `{version}.md` (`create-architecture-doc:9,13,44` — the producer must match the readers, critic HIGH-3). Dev-repo exception, documented not renamed: this repo's own `docs/architecture/README.md` is the plugin's ADR record, not a consumer architecture doc.
6. **M2** — review-format `:43`: `APPROVE` → `APPROVED` (verify `:72` — already correct, critic LOW-2).
7. **M3** — make team-lead's pipeline diagram canonical; sync the developer/architect copies to it (add PO branch + review.md targets); fix "Three-agent pipeline" lead in agents-workflow.md → "the agent pipeline (8 roles)".
8. **M5** — architect.md checkpoint format: add the confidence-tagged option line (1.2.8 miss).
9. **M6** — TL Question Routing Chain box: add the developer→architect technical leg.
10. **M7** — one-line note documenting the `.current-agent` (write-trigger) / `.personas.json` (registry) two-file design — in ADR doc + register-persona.js comment cross-ref.
11. **M8** — add Standard+Codex row to agents-workflow Team Configurations.
12. **ADR-2 gap** — inline a compact slug/path/cycle-cap block (≤10 lines, **verbatim-identical across all 8 agents** — a declared change-together cluster like M4, critic LOW-4) into each agent's Coordination Protocol section (ADR-14 pattern).
13. **L1** — improve-flow: real section names; **L2/L3** — abstract the principles in core and **delete** the .NET/Fokus-specific examples (no nexus-dotnet plan-authoring skill exists to receive them — critic MEDIUM-6; noted as a future nexus-dotnet skill candidate in Out-of-scope); **L4** — annotate ADR-16 "(line numbers from the pre-1.2.6 file)"; **L6** — fix critic "Managed by" note.
14. **Stale refs** — `diagnose:96` + `review-format:97` `project-rules` → `coding-conventions.md`; `agents-workflow.md:98` "pipeline protocol" pointer → name the agents' Checkpoint Report Format sections; fix `tdd`/`diagnose`/`boy-scout` descriptions to match their (now real, per Step 2) loaders.
15. **Product-doc sweep (critic HIGH-2)** — canonical product doc = `docs/product/index.md`; fix `create-feature-spec/SKILL.md:89` and `workflows/Template.md:10,37` (`docs/product/v1.md` → `index.md`). Pairs with Step 5's PO genericization.

**Accept:** `grep -rn "\.claude/skills\|\.claude/agents\|\.claude/rules" plugins/nexus/skills/` returns only legitimate hits (none instructing writes); `grep -rn "v1\.md\|project-rules\|loaded via @\|{version}\.md" plugins/nexus/` returns nothing; `grep -rn "decisions\.md" plugins/nexus/agents/` returns nothing (critic MEDIUM-3).

## Step 8 — Track 3: hook fixes

**Files:** `plugins/nexus/hooks/scripts/*.js`, `plugins/nexus/hooks/hooks.json`, `plugins/nexus/.claude-plugin/plugin.json` (userConfig text), `docs/architecture/README.md` (ADR-8 + ADR-11 still document the old `docs/audit/` path and "always-on" behavior — critic MEDIUM-1), dev-repo `.gitignore` (add `.claude/audit/` — critic MEDIUM-7)

1. **A1+A2 (per Q3)** — audit-logger: gate **everything** behind the opt-in flag; root = `CLAUDE_PROJECT_DIR || data.cwd || process.cwd()`; write to `.claude/audit/{sessionId}.log`; restore Fokus's detail field (file_path/command/skill, 120-char excerpts, content-redacted). Update plugin.json userConfig description to match reality. Update ADR-8/ADR-11 to the new path + opt-in semantics, and document the consumer-side gitignore line (`.claude/audit/`).
2. **A3** — token capture: read transcript tail (last 64KB) instead of whole file.
3. **A4** — delete pipeline-gate invariant 3 (unreachable); header note records why (ADR-13).
4. **A5** — guard: add drive-letter/backslash rm targets + split-flag handling (`rm -r -f`); note PowerShell coverage as follow-up.
5. **A6** — register-persona: matcher `Write|Edit`, handle `ti.new_string`; persona command text: delete-then-write `.current-agent`.
6. **A7** — guard matcher: `Read|Write|Edit|MultiEdit|NotebookEdit|Bash`.
7. **A8** — pipeline-gate matcher: trim to `Write|Edit|MultiEdit`.
8. **A9** — inject-rules: parse stdin, skip on `source === 'resume'`.
9. **A10** — inject-rules: per-file try/catch.
10. **A12** — restore-agent root chain: add `evt.cwd`.
11. **A13** — guard: exclude `.env.(example|template|sample)`.
12. **A16** — pipeline-gate: header note documenting the deliberate fail-open edges (Edit new_string scope, leading-slash path match).
13. **A17** — restore-agent: derive VALID roster from the plugin's `agents/` dir.
14. **A15** — verify `"async": true` against `claude plugin validate --strict` / hooks schema; restructure to fire-and-forget child if unsupported.

**Accept:** fresh consumer-project simulation (temp dir, plugin loaded) produces **zero** files under `docs/`; opt-in on produces `.claude/audit/{sessionId}.log` with detail fields; `.claude/audit/` covered by the dev-repo `.gitignore`; ADR-8/ADR-11 match the new behavior.

## Step 9 — Release 1.3.0

1. `node scripts/gen-commands.mjs nexus` (nexus only — nexus-dotnet ships no agents/commands, critic CRITICAL-1).
2. Stray-artifact sweep (no `docs/audit/` strays, no `.omc/`, no `.tmp-audit-*` staged).
3. `node scripts/bump-plugin.mjs --minor --dry-run` → review → `node scripts/bump-plugin.mjs --minor --note "restore worker-agent protocols (Fokus parity), skill/rules consistency sweep, hook fixes"`.
4. CHANGELOG: **prepend** the 1.3.0 block (spoke restoration / consistency / hooks, with audit reference); do **not** modify the existing, still-unpushed 1.2.6–1.2.8 blocks — they ship to consumers on the eventual push (critic MEDIUM-2).
5. `node scripts/gen-omni.mjs` + new `--check` passes.
6. `claude plugin validate --strict` both plugins, exit 0.
7. Single commit, explicit staging, message via `.git/NEXUS_RELEASE_MSG.txt` (Track 4 already committed separately in Step 1).
8. Delete `.tmp-audit-*.md` working files (audit report itself stays); move `.tmp-critic-plugincleanup.md` → `docs/specs/adhoc-PluginCleanup/delivery/plan-review.md` (provenance).

**Accept:** clean tree; two commits total (machinery + 1.3.0); validate exit 0; CI green on the PR/push with the new base logic.

## Step 10 — Verification pass (post-implementation)

Independent review before declaring done (writer/reviewer separation):
- Spawn a fresh-context reviewer over the full diff with the audit as the checklist — every audit ID marked fixed/deferred/skip-with-reason.
- Specifically re-verify the three convergence claims: developer two-phase matches TL's dispatch verbs verbatim; critic C5 vocabulary stated in critic.md's output format AND acknowledged by the team-lead Verdict Validation line added in Step 6; R1 consumption names the exact implementation-format table heading (`## Carry-Over Findings`).

---

## Out of scope (tracked, not forgotten)

- **Track 5** OMC adoptions — own plan after verifying PreCompact/SubagentStop events + `disallowedTools` frontmatter against current platform docs.
- **Protocol-extraction-to-skill** (team-lead/architect size) — revisit after 1.3.0 settles (Q2).
- **M4** confidence-gloss 7× duplication — documented cluster, change-all-at-once rule.
- **pipeline-guardrails OMC trigger words** — consumer CLAUDE.md concern, not a plugin change (per fokus-diff §2).
- **C3 summary.md gap** in adhoc-PipelineHardening — add a closure note when convenient.
- **Push** (Track 6) — user-triggered.
- **Deferred LOWs** (documented here, no behavior change this release — critic LOW-1): A11 (`.personas.json` lost-update race — TTL-design-acceptable), A14 (guard vs additional working dirs — no env var exposes the approved list), B7 (gen-omni token-swap collision guard — name used self-referentially only), B10 (CI validate advisory until CLI auth is wired), C5-hygiene (`.gitignore` named-files-vs-class — revisit if more `.claude/` state files appear).
- **Future nexus-dotnet candidate:** a .NET plan-authoring/refactoring skill to receive the carve-out examples deleted in Step 7.13.
