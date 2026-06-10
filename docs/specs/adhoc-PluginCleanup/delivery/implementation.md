# adhoc-PluginCleanup — Implementation

Plan: docs/specs/adhoc-PluginCleanup/delivery/plan.md
Developer: main session (Opus 1M), persona `developer` — TL session deliberately not used (stale 1.1.0 cache would police/spawn the pre-fix agents; context for the restorations lives in this session).

## Step 1 — Track 4: dev-repo machinery ✅ (verified 2026-06-10)

**scripts/bump-plugin.mjs**
- B1: runtime-config test (`.mcp.json|.lsp.json|settings.json`) hoisted ABOVE the no-slash doc/meta check in `classify()`; the now-dead branch removed from the label chain. Comment names the ordering constraint.
- B2: porcelain rename lines now classify BOTH sides (old path pushed before new) — a file moved out of `plugins/` counts as shipped-surface change.
- B8: `--note "<text>"` seeds the CHANGELOG entry's first line (falls back to the generic tier label).
- B9 (partial): `readVersion()` returns null for a deleted plugin dir; `printPlan()` and the apply loop report "plugin dir removed" instead of crashing.

**scripts/gen-commands.mjs**
- Guard: no-ops with exit 0 + message when the target plugin has no `agents/` dir (critic CRITICAL-1; nexus-dotnet ships skills only).
- B4 (per Q4): header documents the intentional frontmatter drop — spawned agents honor frontmatter; persona commands inherit the session model; consumer overrides happen at spawn time via `.claude/nexus-agents.json`.

**.github/workflows/plugin-release-check.yml**
- B3: push-to-main leg now diffs against `github.event.before` (fallback `HEAD~1`; all-zeros guard for branch creation). Previously base == pushed HEAD → empty diff → always green.
- B5: new step "Generated commands in sync" — `gen-commands.mjs nexus && git diff --exit-code plugins/nexus/commands` (nexus only).

**scripts/gen-omni.mjs**
- B6: rewritten with `--check` mode — regenerates in memory, diffs against the omni tree (missing / differs / extra / obsolete), exit 1 with the drift list; apply mode behavior unchanged. Flag-aware arg parsing (path arg no longer collides with `--check`).

**Deviations / deferrals (documented):**
- Plan Step 1.5's "mention `--check` in release-plugin/SKILL.md" is a SHIPPED-file edit — moved to the 1.3.0 release commit (Step 7/8 batch) so the no-bump machinery commit doesn't trip the bump-check CI we just fixed.

**Verification — PASSED 2026-06-10 (classifier outage cleared):**
- [x] `node --check` × 9 (3 scripts + 6 hook scripts) → ALL_SYNTAX_OK
- [x] `bump-plugin.mjs --dry-run` → classifies the full working tree, PATCH 1.2.8→1.2.9 with per-area reasons
- [x] B1 probe: throwaway `plugins/nexus/.mcp.json` → "runtime config surface" (hoisted test fires before no-slash check)
- [x] `gen-commands.mjs nexus-dotnet` → "no agents/ dir — nothing to generate", exit 0 (CRITICAL-1 guard works)
- [x] `gen-omni.mjs --check` → exit 1 listing 30 drifted paths (CORRECT — twin not yet regenerated; proves drift detection)
- [x] `--check` pass-path: `--base HEAD~1` over the 1.2.8 release commit (change + bump) → exit 0
- [x] `--check` fail-path: isolated worktree probe (shipped-file commit, no bump) → exit 1 with "behavior surface changed but version is still 1.2.8". Worktree removed after.
- [x] Semantics note: `--check` diffs `base...HEAD` (committed range, CI semantics) and ignores the working tree by design — `--check --base HEAD` correctly reports "no changes". Not a bug.
- [x] A15: `claude plugin validate plugins/nexus --strict` → passed (hooks.json with `"async": true` accepted)

## Step 2 — developer.md restoration ✅

Full rewrite of `plugins/nexus/agents/developer.md` (112 → ~210 lines):
- D1: "Plan Workflow — Two Phases" section (Analyze → checkpoint-and-STOP; Implement resumed by TL); the `:52` stop-and-ask bullet reworked — spawned mode ALWAYS ends Phase 1 at the checkpoint even question-free; standalone may proceed question-free. ADR-18 hard rules (write-nothing-foreign / no-foreign-verdict / never-commit) preserved verbatim per critic MEDIUM-5.
- D2 idempotency + resume-from-first-incomplete-step (Phase 1 #1, Phase 2 #2). D3 step announcements + skipped-number stop (Phase 2 #4). D4 Completion Checklist table (blocking gates; "per project-rules" genericized to build/type-check/lint). D5 "When the Reviewer Returns Findings" (fix-by-severity, dispute protocol, cycle message). D6 Debugging Protocol (diagnose skill + 3-attempt circuit breaker). D7 TDD bullet (Phase 2 #8). D8 Boy Scout. D9 Skill-tool failure fallback (in Skill Authority). D10 "After Each Implementation Round" (lessons + skill gaps + before-compact) + frontmatter `skills:` gains `lessons-format`. D11 Anti-patterns (7 items, generic). D12 task classification SKIPPED per plan (architect classifies).
- L5: boundary bullet now names lessons.md append-only-under-own-heading. M3: pipeline diagram replaced with the canonical version (PO branch + review.md section targets) — same diagram to be applied verbatim to architect.md/team-lead.md in their steps.
- Fokus content deliberately NOT restored: `@`-import lines (ADR-2), "Deploy to .claude/agents/" (Fokus-only), `known-deviations.md` check (no nexus equivalent — noted for learner future), "When There's No Plan" (nexus routes no-plan work to solo/TL), Fokus "Don't commit unless asked" (weaker than nexus "never commit" hard rule — kept the hard rule).
- Step 7.12 ADR-2 block intentionally NOT added here — it lands identically across all 8 agents in the Step 7 uniform pass.

## Step 3 — critic.md restoration ✅

Full rewrite of `plugins/nexus/agents/critic.md` (55 → ~200 lines). Restored C1 (Phase 2.5 Implementation Feasibility — pattern conflicts/formula divergence/cross-cutting retrofits, cite file paths), C2 (Phase 1 pre-commitment, Phase 5 Self-Audit, Phase 5.5 Realist Check + ADVERSARIAL escalation), C3 (edge-case probing, ambiguity splitting, backward impact), C4 (Phase 4.5 Breadth Scan incl. "not mentioned ≠ explicitly deferred"), C5 (severity scale + REJECT/REVISE/ACCEPT verdict, stated once, used in the message verdict line per critic HIGH-1 resolution), C6 (output format + Cross-reference Matrix **adapted into the message body** — no-file contract preserved), C7 (read-code-for-feasibility tool usage). Plus: Evidence Requirements, Failure Modes, Final Checklist. Kept all nexus additions verbatim: Mode 3 promotion review, message-only Output, hub-spawn routing (standalone vs team), assume-past hard rule, message footer. Fokus `v1.md`/`@docs/product/index.md` references genericized to "docs/product/ (if present; start at index.md)". Protocol scoped to Modes 1–2 (Mode 3 keeps its own code-grounded checklist).

## Step 4 — reviewer.md restoration (+ review-format) ✅

`plugins/nexus/agents/reviewer.md` (83 → ~140 lines): restored R1 ("Before Reviewing" — re-read plan, pre-commitment predictions, read implementation.md + consume the exact `## Carry-Over Findings` table heading, confirm-or-refute obligation echoed in Review Output), R2 (Fresh Evidence — run verification yourself, reject without fresh output, `git show HEAD~1:{path}` parity), R3 (Stage gate folded into Review Dimensions — conformance fail → immediate REQUEST CHANGES; "no behavior change" = persisted/observable outcome), R4 (Findings Format confidence qualifier + Self-Audit — matching the review-format template sections that previously had no generating procedure), Gap Analysis (incl. empty-state reachability), Anti-patterns (5, generic), R6 (After Review lessons + frontmatter gains `lessons-format`). ADR-18 boundary bullet extended with lessons.md own-heading. Kept verbatim: Verdict Gate, re-review postcondition, handoffs/artifact-first, cycle cap, footer.

`plugins/nexus/skills/review-format/SKILL.md`: M2 (`:43` APPROVE → APPROVED — `:72` was already correct, critic LOW-2 confirmed), R7 (data-loading depth + boundary-test items added to the Step 2 checklist), stale `[per project-rules]` evidence row → coding-conventions (Step 7.14 item, folded here per the per-file execution note).

R5 (Codex first-round-only + recommendation heuristics) → lands in team-lead.md at Step 6 as planned.

## Step 5 — po.md restoration ✅

`plugins/nexus/agents/po.md` (64 → ~150 lines): restored P1 (full Question Answering Mode — cite-or-escalate, Cited/Inferred/No-answer confidence, per-question format, never-modify-spec-while-answering, escalation message), P2 (read boundaries — names/paths via Glob/Grep OK, never Read source contents; report-don't-investigate bugs), P3 (Before Writing the Spec gap check), P4 per Q5 (one optional writing-time question → `help.tooltips.md` only on yes; sync-check after review fixes; Fokus's `help.page.md` NOT restored — restore-lite scope), P5 ("if docs/backlog.md exists" → Status `Spec Ready` + link), P6 (don't-write-until-asked), P7 (genericized issue-tracker flows — ticket + epic with nested slugs, no Jira-specific steps), P8 (slug assignment — propose + confirm before creating folders). Fokus `docs/product/v1.md` / `docs/architecture/v1.md` refs genericized to `index.md` (critic HIGH-2). Kept verbatim: 1.2.7 spec-review gate (P9) incl. standalone-vs-spawned split — only addition: the critic's REJECT/REVISE/ACCEPT vocabulary named in the "run the chosen review" line. Confidence + assume-past hard rules kept.

## Step 6 — team-lead.md operational items ✅

`plugins/nexus/agents/team-lead.md`: T1 — new **Fast Mode Dispatch** section (developer self-reviews via review-format checklist → `## Self-Review` section of implementation.md, TL validates its existence before close; review.md stays reviewer-owned per ADR-18). T3 — Pipeline Sequence gains step 7 "Lessons processing (optional, ask once)" → spawns learner scoped to this slug (unattended: skip + record). T4 — step 8 Completion dashboard block. T5 — Unattended Mode gains the spec-gate abort bullet (never spawn PO unattended). R5 — Standard+Codex Dispatch gains "Codex first review round only" + when-to-recommend heuristics. C5-hook — Verdict Validation now names the critic's REJECT/REVISE/ACCEPT line (advisory, relayed verbatim, TL never gates on it). Q4-config — Pre-Flight 4b reads optional `.claude/nexus-agents.json` (model as spawn param, effort as dispatch-prompt line, frontmatter fallback) + Message Templates pointer. M3 — pipeline diagram's PO line gains the spec-review gate (now consistent with developer.md's canonical copy; TL keeps its own extra review-fork detail — additive, not divergent). M6 — Question Routing Chain box now shows both legs (PO product leg + developer→architect technical leg).

## Step 7 — consistency cleanup ✅

- **H1 (per Q1):** `improve-flow` + `improve-skills` rewritten around the two-channel model — project-bound applied on the spot (CLAUDE.md, docs/conventions/, project-local `.claude/skills/`); plugin-bound → portable feedback file `docs/plugin-feedback/nexus-{version}-{date}.md` with suggested-target entries; every ADR-1-violating `.claude/agents|rules|skills/` write instruction deleted. `learner.md` carries the channel classification + a new hard rule (never write into the plugin cache) + `[ROUTED-TO-PLUGIN]` tag. L1 resolved by the rewrite (section names now appear only as suggested-target guidance, using current names).
- **H2:** `.claude/skills/` globbing replaced with "skills surfaced in context + project-local" in create-architecture-doc (SKILL + reading protocol + steps) and create-implementation-plan (`:25`, Required Reading); `.claude/README.md` post-apply steps dropped from both improve-* skills (rewritten away).
- **H3:** all "loaded via @" claims deleted (create-implementation-plan:76 → "read it if present — nothing is auto-loaded"; create-feature-spec:39 → PO-first reading protocol).
- **H4:** create-feature-spec retitled "(PO Reference)"; reading protocol rewritten PO-first (product/index.md + architecture/index.md if present; PO never opens source — routes implementation questions to architect).
- **M1/HIGH-3:** canonical architecture doc = `docs/architecture/index.md` everywhere — architect.md:124 `decisions.md` example removed (generic ADR-register phrasing), create-architecture-doc Generate now EMITS index.md (version inside the doc), template.md updated, create-implementation-plan Required Reading fixed. Dev-repo `docs/architecture/README.md` documented as the dev-repo exception (ADR record, not a consumer architecture doc).
- **M2:** review-format `:43` APPROVE → APPROVED (`:72` verified already correct). **M5:** architect.md checkpoint Action-options line now confidence-tagged. **M6:** TL Question Routing Chain shows both legs. **M8:** Standard+Codex row added to agents-workflow Team Configurations (+ Fast row updated to name the Self-Review mechanism).
- **M3:** "Three-agent pipeline" lead → "8 roles"; diagrams synced (developer canonical rewrite, TL PO-gate line, architect review.md targets).
- **7.12:** verbatim-identical "Slug / paths / caps" block (3 bullets) inserted into all 8 agents' Coordination Protocol sections — declared change-together cluster.
- **7.14 stale refs:** diagnose:96 + review-format:97 `project-rules` → coding-conventions; agents-workflow:98 pointer → names the agents' own Checkpoint Report Format sections; tdd/diagnose/boy-scout descriptions verified accurate post-restoration (no edit needed — their loaders are real again).
- **7.15 (HIGH-2):** product-doc sweep — create-feature-spec:89 + workflows/Template.md:10,24,37 `docs/product/v1.md` → `index.md`.
- **L2:** spec "Do not include" examples genericized to placeholders. **L3:** create-implementation-plan refactoring rules abstracted (6 principles kept, .NET/Fokus specifics deleted; stack examples noted as nexus-dotnet candidates). **L4:** ADR-16 line-number annotation added. **L6:** critic "Managed by" → current-hub wording.

## Step 8 — hook fixes ✅

- **A1+A2+A3 (Q3):** `audit-logger.js` rewritten — fully gated behind `token_audit` (OFF = zero work, no dirs); root = `CLAUDE_PROJECT_DIR || data.cwd || process.cwd()`; per-session `.claude/audit/{sid}.log` with restored `detail` field (file_path/command/skill/pattern, 120-char, content-redacted); token-usage.jsonl same dir; transcript read is tail-only (64KB).
- **A4:** pipeline-gate invariant 3 deleted (unreachable per ADR-13 — only attributable callers were unblockable background subagents); header records why + the gate's foreground-only scope. **A16:** deliberate fail-open edges documented in header (Edit new_string scope, separator-required path match).
- **A5:** guard rm detection — split-flag collection (`rm -r -f`), Windows targets (`C:\`, `C:/`, UNC), basic PowerShell `Remove-Item -Rec* -Fo*` coverage. **A13:** `.env.(example|template|sample)` excluded from the secret block.
- **A6:** register-persona matcher `Write|Edit` + `ti.new_string` handling (the `.current-agent` file pre-exists across sessions, inviting Edit). **M7:** two-file design note added to its header.
- **A7:** guard matcher `Read|Write|Edit|MultiEdit|NotebookEdit|Bash` (was: every tool). **A8:** gate matcher trimmed to `Write|Edit|MultiEdit` (Task|Agent were guaranteed no-ops).
- **A9+A10:** inject-rules parses stdin and skips `source === 'resume'` (~6K dup tokens saved); per-file try/catch so one bad rule file doesn't drop all rules.
- **A12+A17:** restore-agent root chain gains `evt.cwd`; VALID roster derived from the plugin's `agents/` dir (was hardcoded in 3 places — one down, gen-commands MAP documented, agents dir is source).
- **Dependents swept:** plugin.json `token_audit` description rewritten (honest scope + gitignore advice); `consumption-report` skill → new path with pre-1.3.0 fallback; dev-repo `.gitignore` += `.claude/audit/`; **ADR-8 + ADR-11 amended** (1.3.0 blockquotes — path move, full opt-in gating, detail field, tail-read).
- **release-plugin skill:** SYNC TWIN step now includes `gen-omni.mjs --check` verification (deferred Step-1.5 item, landed here so it rides the bump).
- **A15:** `"async": true` support verification queued with the blocked shell batch (validate --strict will also exercise hooks.json schema).

## Step 9 — Release 1.3.0 ✅ (2026-06-10)

1. **Verification batch** (Step 1 checklist) — all passed, see Step 1's updated checklist. Includes the
   `--check` fail-path probe in an isolated worktree (shipped commit without bump → exit 1) — removed after.
2. `gen-commands.mjs nexus` → 8 commands regenerated.
3. Stray sweep: 4 `.tmp-audit-*.md` deleted; `.tmp-critic-plugincleanup.md` → `delivery/plan-review.md`.
4. `bump-plugin.mjs --minor --note "..."` → nexus 1.2.8 → **1.3.0**; CHANGELOG stub rewritten to a full
   entry (1.2.6–1.2.8 blocks preserved).
5. `gen-omni.mjs` (twin regenerated) + `--check` → in sync, exit 0.
6. `claude plugin validate --strict` → both plugins pass (A15: `"async": true` accepted).
7. Two commits, explicit staging (no `git add -A`), per plan: machinery (no-bump) then release.
8. Side addition riding the release commit (docs-only, user request mid-step): architecture README
   "Known limitations / future work" gains a **plugin init tests** proposal (node:test over hooks/scripts
   + structural lint; promote to ADR when built).

NOT pushed — Track 6 requires the user's explicit ask (1.2.6→1.3.0 all local).

## Step 10 — Fresh-context verification review ✅ (2026-06-10)

Independent reviewer (fresh context, code-grounded) over `772185b` + `9314af4` with the audit as
checklist → **APPROVED** (`delivery/review.md`): FIXED 78 · DEFERRED 7 · SKIPPED 1 · PARTIAL 1 ·
**MISSED 0**. All 3 convergence claims PASS. Findings triaged by severity:

- **MEDIUM-1 FIXED** — the audit report (this run's spec) was untracked + gitignore-masked
  (`docs/audit/`). Moved to `definition/audit.md` (it IS the definition); plan.md Input pointer
  updated; `docs/audit/` ignore kept (now masks only the pre-1.3.0 stray logs it was meant for).
- **LOW-1 FIXED** — register-persona two-file design note added to ADR-8 (the plan's missed second leg).
- **LOW-2 FIXED** — dev-repo exception blockquote added to the architecture README header.
- **LOW-3 DEFERRED** — `developer.md:39` parenthetical names a resume string ("proceed") the TL never
  sends; cosmetic, shipped file → rides the next bump (see Carry-Over #4).

All four fixes are docs-only (no shipped plugin files) → no bump. Committed as a follow-up commit.

## Carry-Over Findings

| # | Risk | For reviewer |
|---|------|--------------|
| 1 | gen-omni.mjs full rewrite — apply-mode behavior must be byte-equivalent for generated output (mirrorDir now collects-then-writes instead of write-during-walk; rmSync timing changed: dst removed AFTER collection — verify no self-mirroring edge when OMNI is nested under NEXUS (it isn't in practice)) | Diff old/new apply-mode output on the real omni repo |
| 2 | B2 both-sides classification can double-count a rename WITHIN plugins/ (old+new both PATCH) — harmless (same tier, same plugin) but verify the reasons list isn't confusing | Read output of --dry-run on a rename |
| 3 | CI `github.event.before` on force-push points at a rewritten-away commit — `--check` would error on `git diff`; accepted (force-push to main is denied by guard policy anyway), worth a header note if it ever bites | — |
| 4 | Step-10 LOW-3: `developer.md:39` Phase-2 parenthetical says `or "proceed"` but the TL resume template sends `None — all clear`; cosmetic — fix to ride the NEXT version bump (shipped file, not worth one alone) | Fold into next release touching developer.md |
