# Critic Review — adhoc-PluginCleanup (Mode 2: Plan vs Audit-Spec)

**Plan:** `docs/specs/adhoc-PluginCleanup/delivery/plan.md`
**Spec-equivalent:** `docs/audit/nexus-plugin-audit-2026-06-09.md` (+ 4 `.tmp-audit-*.md` source reports)
**Baseline:** `D:\src\fokus\.claude` (read-only restoration source)
**Method:** code-grounded — every cited current file and every Fokus source file read; restorations verified against actual file state.

---

## VERDICT: REVISE

The plan is well-structured, correctly honors the settled ADRs (message-only critic, background spawns, artifact-first, 2-commit, ADR-13 gate-inert), and maps the large majority of audit IDs to concrete steps with file:line targets. It is **not** REJECT — there is no CRITICAL design error and the release shape (machinery commit → one MINOR 1.3.0) is sound. But it cannot reach ACCEPT as written because of **one CRITICAL feasibility defect that will fail CI on every PR** (B5's `gen-commands.mjs nexus-dotnet` crashes — nexus-dotnet has no `agents/`), **two HIGH convergence defects** (C5 "TL/PO validate the verdict vocabulary" is false — nothing validates it, and the plan adds no validator; the product-doc `v1.md`→`index.md` rename is unaddressed yet the Step 7 Accept grep will trip on it), plus several MEDIUM coverage/acceptance gaps. All are fixable with a bounded change set (below).

**Findings by severity:** CRITICAL 1 · HIGH 3 · MEDIUM 7 · LOW 4

---

## 1. COVERAGE MATRIX (every audit ID)

Legend: COVERED = mapped to a concrete plan step; PARTIAL = mapped but incomplete/at-risk; MISSING = silently absent; DEFERRED = explicit out-of-scope/skip-with-reason.

### §1 Extraction losses — developer.md (Step 2)
| ID | Status | Evidence / Note |
|----|--------|-----------------|
| D1 | COVERED | Step 2 D1 "Restore adapted" — two-phase + spawned/standalone reconciliation of `developer.md:52`. Fokus source exists (`fokus/.claude/agents/developer.md:42-72`). |
| D2 | COVERED | Idempotency/resume — Fokus `:46,61`. |
| D3 | COVERED | Step announcements — Fokus `:37,63`. |
| D4 | COVERED | Completion Checklist — Fokus `:115-128`. |
| D5 | COVERED | "When the Reviewer Returns Findings" — Fokus `:170-179`. |
| D6 | COVERED | Debugging + 3-attempt circuit breaker + `diagnose` — Fokus `:101-109`. |
| D7 | COVERED | TDD bullet — Fokus `:67`. |
| D8 | COVERED | Boy Scout — Fokus `:111-113`. |
| D9 | COVERED | Skill-tool failure fallback — Fokus `:99`. |
| D10 | COVERED | Lessons section + frontmatter `lessons-format`. Verified: developer frontmatter currently `implementation-format, questions-format` (`developer.md:6`) — lacks lessons-format; lessons-format:55 "mandatory for every agent". Sound per ADR-4. |
| D11 | COVERED | Anti-patterns incl. pre-existing-build-failure — Fokus `:146-156`. |
| D12 | DEFERRED | Skip-with-reason (architect classifies). Defensible. |
| L5 | COVERED | Step 2 — lessons.md boundary bullet. Matches consistency L5. |

### §1 — critic.md (Step 3)
| ID | Status | Evidence / Note |
|----|--------|-----------------|
| C1 | COVERED | Phase 2.5 Implementation Feasibility — Fokus `critic.md:58-66`. |
| C2 | COVERED | Pre-commitment / Self-Audit / Realist Check — Fokus `:39-41,109-127`. |
| C3 | COVERED | Edge-case/ambiguity/backward-impact — Fokus `:91-95`. |
| C4 | COVERED | Phase 4.5 Breadth Scan — Fokus `:97-107`. |
| C5 | **PARTIAL** | Verdict vocab REJECT/REVISE/ACCEPT restored, BUT "TL/PO validate against it" is unsupported — see HIGH-1. |
| C6 | COVERED | Cross-reference Matrix adapted to message-only — consistent with ADR (critic writes no file). Fokus `:156-160`. |
| C7 | COVERED | "read-only but reads code" — Fokus `:189-196`. |

### §1 — reviewer.md / po.md / team-lead.md (Steps 4–6)
| ID | Status | Evidence / Note |
|----|--------|-----------------|
| R1 | COVERED | Carry-Over consumption. Producer heading verified: `implementation-format:22` = `## Carry-Over Findings`; Fokus reviewer `:30` consumes that exact heading. Convergence checkable. |
| R2 | COVERED | Fresh Evidence + `git show HEAD~1:` — Fokus reviewer `:74-84`. |
| R3 | COVERED | Stage gate — Fokus reviewer `:45`. |
| R4 | COVERED | Pre-commitment + Self-Audit — Fokus reviewer `:28,96-102`; review-format already demands the sections (`review-format:74,91`). |
| R5 | COVERED | Codex first-round-only + heuristics → team-lead.md. Verified absent today (grep on team-lead.md: no "first review round"). Fokus reviewer `:141-156`. |
| R6 | COVERED | Frontmatter `lessons-format` on reviewer + After-Review bullet. Reviewer frontmatter currently `review-format` only (`reviewer.md:6`). Sound. |
| R7 | COVERED | data-loading depth + boundary N/N+1 → review-format. Fokus reviewer `:58-59`. |
| P1 | COVERED | Question Answering Mode — Fokus po `:193-223`. |
| P2 | COVERED | Read boundaries — Fokus po `:224-233`. |
| P3 | COVERED | Pre-spec gap check — Fokus po `:120-130`. |
| P4 | COVERED (Q5) | Restore-lite producer for help.tooltips.md. Premise verified: `rules/help-tooltips.md` has 3 consumers, no producer. |
| P5 | PARTIAL | Backlog→Spec Ready. Behavior restore is fine, but `docs/backlog.md` does not exist in THIS repo — Step 5 Accept not locally exercisable (consumer-facing behavior; acceptable, but flag). |
| P6 | COVERED | "don't write spec until asked" — Fokus po `:98`; matches nexus 1.2.7 P9 intent. |
| P7 | COVERED (adapted) | Genericized issue-tracker shaping (no Jira tooling in core). Good ADR-3 call. |
| P8 | COVERED | Slug assignment — Fokus po `:63-72`. |
| P9 | COVERED | "Keep nexus's 1.2.7 spec-review gate untouched" — preserved (po.md:42-52). |
| T1 | COVERED | Fast-mode self-review → `## Self-Review` in implementation.md (ADR-18 compliant — NOT review.md). See Consistency §3 below. |
| T3 | COVERED | Learner trigger post-approval. |
| T4 | COVERED | Completion dashboard. |
| T5 | COVERED | Unattended spec-gate default. |
| (audit-logger detail field) | COVERED | Folded into A1/A2 (Step 8.1). |

### §2 Consistency drift (Step 7)
| ID | Status | Evidence / Note |
|----|--------|-----------------|
| H1 | COVERED (Q1) | improve-flow/improve-skills promotion rewrite. Verified targets: improve-flow `:37-49,70`, improve-skills `:22,26,31,104`. |
| H2 | COVERED | `.claude/skills/` glob → context. Verified: create-implementation-plan `:25,77`; create-architecture-doc `:22,31,36`. |
| H3 | COVERED | "loaded via @" + v1.md (architecture). Verified create-implementation-plan `:76`. |
| H4 | COVERED | create-feature-spec PO-first protocol. Verified `:38-40`. |
| M1 | **PARTIAL** | Canonical = `index.md`. But (a) the dev repo's own doc is `README.md` not `index.md` (Glob confirms only `docs/architecture/README.md` exists); (b) `create-architecture-doc` emits a 4th variant `{version}.md` (`:9,13,44`) — plan names "template output" so it's in scope, but the Step 7 Accept grep does NOT include `{version}.md` or `decisions.md`. See MEDIUM-3. |
| M2 | COVERED | `APPROVE`→`APPROVED`. Caveat: plan cites `:43`/`:72`; line 72 already reads `APPROVED` (`review-format:72`) — only `:43` needs the fix. Minor imprecision, target valid. |
| M3 | COVERED | Canonical diagram + "Three-agent pipeline" lead fix. Verified `agents-workflow.md:3`. |
| M4 | DEFERRED | Out-of-scope (documented cluster, change-all-at-once). Verified 7× (consistency M4). |
| M5 | COVERED | architect.md confidence-tagged option line. Verified `architect.md:324-325` lacks it; team-lead.md:137 + developer.md:92 have it. |
| M6 | COVERED | developer→architect leg in TL routing box. Verified `team-lead.md:250` omits it. |
| M7 | COVERED | `.current-agent`/`.personas.json` note. Correct-by-design per register-persona.js:6-12. |
| M8 | COVERED | Standard+Codex row → agents-workflow. Verified `agents-workflow.md:132-135` missing it. |
| ADR-2 gap | COVERED | Step 7.12 per-agent slug/path/cap block (ADR-14 pattern). See Consistency §3 for an ADR-14 nuance. |
| L1 | COVERED | improve-flow real section names. Verified stale names improve-flow `:40-41,66`. |
| L2 | **PARTIAL** | "move .NET/Fokus examples to nexus-dotnet" — but L2 also carries `v1.md` product-doc refs (`create-feature-spec:89`, `workflows/Template.md:10,37` = `docs/product/v1.md`) that NO step renames. See HIGH-2. |
| L3 | COVERED | create-implementation-plan refactoring carve-out → nexus-dotnet, principles abstracted. (Feasibility caveat: no nexus-dotnet plan-skill exists to receive it — see MEDIUM-6.) |
| L4 | COVERED | ADR-16 line-number annotation. |
| L6 | COVERED | critic "Managed by" note. Verified `agents-workflow.md:109`. |
| Stale refs | COVERED | diagnose:96 + review-format:97 `project-rules`→`coding-conventions.md`; agents-workflow:98 pointer; tdd/diagnose/boy-scout descriptions. All verified present. |

### §3 Hooks & machinery
| ID | Status | Evidence / Note |
|----|--------|-----------------|
| A1 | COVERED (Q3) | logger gated behind opt-in. Verified `audit-logger.js:69` writes tool-calls.log outside the `AUDIT_ON` guard (`:75`). |
| A2 | COVERED | root = CLAUDE_PROJECT_DIR\|\|data.cwd\|\|cwd. Verified `audit-logger.js:65` uses `process.cwd()`. |
| A3 | COVERED | transcript tail. Verified `audit-logger.js:41` reads whole file. |
| A4 | COVERED | delete pipeline-gate invariant 3. Verified unreachable (`pipeline-gate.js:53-63`; ADR-13). |
| A5 | COVERED | drive-letter/backslash + split-flag rm. Verified gap `guard.js:118-120`. |
| A6 | COVERED | matcher Write\|Edit + ti.new_string + delete-then-write `.current-agent`. Verified `hooks.json:31` Write-only; register-persona.js:31 uses `ti.content` only. |
| A7 | COVERED | guard matcher. Verified `hooks.json:11-16` no matcher. |
| A8 | COVERED | pipeline-gate matcher trim. Verified `hooks.json:18` has Task\|Agent. |
| A9 | COVERED | inject-rules resume skip. Verified inject-rules.js never parses stdin. |
| A10 | COVERED | per-file try/catch. Verified `inject-rules.js:31` unguarded. |
| A12 | COVERED | restore-agent add evt.cwd. Verified `restore-agent.js:46`. |
| A13 | COVERED | exclude .env.(example\|template\|sample). Verified `guard.js:99`. |
| A16 | COVERED | header note (Edit new_string scope, leading-slash). Verified `pipeline-gate.js:97,69`. |
| A17 | COVERED | derive VALID from agents/ dir. Verified hardcoded `restore-agent.js:25`. |
| A15 | COVERED | verify `async:true` vs validate --strict. |
| A11 | **MISSING** | lost-update race on `.personas.json` (audit LOW, "document in header"). Not in plan, not out-of-scope. See LOW-1. |
| A14 | **MISSING** | guard isAbsoluteOutside denies approved additional-working-dirs (audit LOW). Not in plan, not out-of-scope. See LOW-1. |
| B1 | COVERED | hoist runtime-config test. Verified unreachable `bump-plugin.mjs:102` before `:124`. |
| B2 | COVERED | classify both rename sides. Verified `bump-plugin.mjs:79`. |
| B3 | COVERED | CI push `--base github.event.before`. Verified vacuous push leg `plugin-release-check.yml:30-31`. |
| B4 | COVERED (Q4) | document frontmatter drop. Verified `gen-commands.mjs:33-36`. |
| B5 | **PARTIAL → CRITICAL defect** | staleness check, BUT the prescribed command crashes on nexus-dotnet. See CRITICAL-1. |
| B6 | COVERED | gen-omni --check. Verified no check mode today. |
| B8 | COVERED | bump-plugin --note. |
| B9 | PARTIAL | Plan covers only "B9 (partial) — guard readVersion against deleted dir" (`bump-plugin.mjs:162`). The other two B9 edges (octal unescape, magnitude-unenforced) are by-design per audit — acceptable as partial. |
| B7 | MISSING | gen-omni token-swap collision guard (audit LOW). Not in plan/out-of-scope. See LOW-1. |
| B10 | DEFERRED-ish | CI validate advisory-only — not in plan; reasonable (pending CLI auth, audit B10). Flag as implicit skip. See LOW-1. |

### Hygiene + §6 stale refs
| ID | Status | Note |
|----|--------|------|
| C2-hygiene | COVERED | logger relocate out of docs/ → `.claude/audit/` (Step 8.1, Q3). |
| C3-hygiene | DEFERRED | adhoc-PipelineHardening summary.md gap — explicit out-of-scope ("add closure note when convenient"). |
| C4-hygiene | N/A | keep-as-is (no action needed). |
| C5-hygiene | MISSING | `.gitignore` ignores 4 named `.claude/` files not the class (audit LOW). Interacts with Step 8's new `.claude/audit/` path — see MEDIUM-7. |
| C1-hygiene | N/A | tree clean. |
| §6 stale refs | COVERED | folded into Step 7.14. |

---

## 2. IMPLEMENTATION FEASIBILITY (code-grounded)

All restorations were checked against the actual Fokus source and the current nexus file the plan edits.

- **Every Fokus-restoration target exists** at the cited content (developer two-phase `fokus/.claude/agents/developer.md:42-72`; critic Phase 2.5 `critic.md:58-66`; reviewer Fresh Evidence `reviewer.md:74-84`; PO Question-Answering `po.md:193-223`). No restoration points at vapor.
- **Frontmatter additions (D10/R6) are implementable and correct.** developer.md:6 and reviewer.md:6 lack `lessons-format`; ADR-4 preloads producer-only; lessons-format:55 mandates it. No conflict with untouched text.
- **Adaptation conflicts with untouched nexus text — checked, mostly clean:**
  - D1 reconciliation of `developer.md:52` is necessary: the current bullet "A question-free plan may proceed straight to implementing" is exactly the Phase-1-collapse license ADR-13 can't block. The plan correctly scopes "question-free may proceed" to standalone only. **The plan must also reconcile the new two-phase section against the EXISTING `developer.md:54,56` hard-rules** (read-only files, "report ready for Step 1 and STOP") so the restored Phase-2 text doesn't contradict them — the plan doesn't explicitly call this out (MEDIUM-5).
  - C6/Output: the plan keeps message-only output and adapts the matrix into the message — consistent with the current `critic.md:26-28` no-file contract. No conflict.
- **CRITICAL feasibility break:** B5 / Step 9.1 assume `nexus-dotnet` has agents. It does not (Glob: no `plugins/nexus-dotnet/agents/`, no `commands/`). `gen-commands.mjs` iterates a hardcoded 8-agent MAP and `readFileSync(AGENTS_DIR/architect.md)` with no existence guard → ENOENT, exit 1. See CRITICAL-1.

---

## 3. CONSISTENCY OF THE ADAPTATIONS

- **D1 spawned-vs-standalone:** internally consistent and matches team-lead.md:73-89 dispatch verbs (`Analyze {slug}.` / `Implement.`). Good. Step 10's verbatim-match check is appropriate.
- **T1 self-review-in-implementation.md (ADR-18):** CORRECT. The plan routes the developer self-review verdict to a `## Self-Review` section of **implementation.md**, NOT review.md (which stays reviewer-owned per ADR-18, reviewer.md:46, agents-workflow.md:87). This is the right call and avoids the ADR-18 "author another agent's gate" breach. team-lead.md must validate that section's existence before close — plan says so (Step 6 T1).
- **C5/C6 verdict vocabulary vs what TL/PO actually validate:** **INCONSISTENT (HIGH-1).** `grep REJECT|REVISE|ACCEPT` over plugins/nexus = zero hits today. team-lead.md Verdict Validation (`:154-159`) validates reviewer APPROVED + architect PASS, and explicitly says "The critic writes no verdict file — read its findings from its TaskOutput" — it does NOT validate a critic REJECT/REVISE/ACCEPT verdict. po.md has no critic-verdict validation either. The plan restores the vocabulary into critic.md (C5) but **adds no consumer/validator in TL or PO**, yet the C5 disposition asserts "TL/PO validate against it" and Step 10 will re-verify "critic C5 vocabulary matches what TL/PO validate." That convergence check will FAIL as scoped.
- **Step 7.12 per-agent slug/path/cap block vs ADR-14:** consistent with ADR-14's deliberate-duplication pattern (same as the hard-stop/confidence inlining). One nuance the plan should honor: keep the block ≤10 lines and identical across all 8 agents (it's a duplication cluster like M4) — otherwise it becomes the next drift source. The plan says "≤10 lines"; it should add "verbatim-identical across agents."

---

## 4. SEQUENCING & RELEASE SHAPE

- **Step 1 (machinery, no bump) before the rest:** correct ordering — "4 (CI fixes protect everything after)" per audit §6. Good.
- **One MINOR 1.3.0 for Tracks 1+2+3:** correct. Restored capability = MINOR (owner-escalated via `--minor`, per ADR-9/CLAUDE.md policy). Tracks 2+3 are PATCH-worthy but ride with the MINOR — fine.
- **Ordering hazard — Step 7 vs Steps 2–6 (same files):** **REAL but minor.** Step 7.7 (M3) edits the pipeline diagrams in developer.md AND architect.md AND team-lead.md — files also edited by Steps 2, 6. Step 7.8 (M5) edits architect.md Checkpoint format. These are the SAME files as the restoration steps. Within a single developer's sequential execution this is just "more edits to the same file," not a literal merge conflict — but the plan presents Steps 2–7 as if independent. **The plan should state that Steps 2–7 edits to a shared file (developer.md, architect.md, team-lead.md) are applied in one pass per file**, or sequence Step 7's per-file edits to run alongside the matching restoration step. Low risk for a single executor; worth a one-line note. (MEDIUM-4)
- **B5 staleness check landing before Step 9 regen:** B5 is a CI step (Step 1), it runs in CI not locally, so it doesn't gate Step 9. But B5 as written breaks ALL CI (CRITICAL-1) — so it must be fixed before merge regardless of ordering.
- **gen-commands regen (Step 9.1) before bump:** correct per ADR-9 flow.

---

## 5. EDGE CASES THE PLAN MISSES

1. **nexus-dotnet has no agents — gen-commands crashes (CRITICAL-1).** Both B5's CI command and Step 9.1's parenthetical assume agents exist. They don't.
2. **omni twin regeneration vs the new gen-omni `--check` (handled, but ordering).** Step 9.5 runs `gen-omni.mjs` + the new `--check`. Since `--check` is itself authored in Step 1 (B6) and committed in the machinery commit, by Step 9 it exists — consistent. No defect, but note: gen-omni mirrors nexus→omni; the restored agent content (with the word "nexus" in prose, e.g. "always-on via Nexus") gets token-swapped to "Omni" — pre-existing behavior, not new risk (B7 collision is the known caveat, left out of plan — LOW).
3. **Unpushed 1.2.6–1.2.8 stack + a 1.3.0 release (MEDIUM-2).** The audit (§5.1, executive #5) flags that the 1.2.6–1.2.8 stack is itself unpushed and consumers run ≤1.2.5. The plan's Step 9 bumps from current `plugin.json` (which is 1.2.8 per audit) → 1.3.0. That's arithmetically fine. BUT: the CHANGELOG rewrite (Step 9.4) and the single 1.3.0 entry risk **burying the 1.2.6–1.2.8 changes** if not preserved. The plan says "rewrite entry properly" but doesn't say "preserve the existing 1.2.6/1.2.7/1.2.8 CHANGELOG blocks." Track 6 (push) is correctly deferred to the user, but the plan should explicitly NOT collapse the unpushed stack's CHANGELOG history into the 1.3.0 entry.
4. **`.claude/audit/` relocation vs consumer gitignore (MEDIUM-7).** Step 8 moves logs from `docs/audit/` to `.claude/audit/{sessionId}.log`. The dev-repo `.gitignore` ignores 4 named `.claude/` files (audit C5) — NOT `.claude/audit/`. A consumer that gitignored `docs/audit/` (per old ADR-8 / current behavior) now has an un-ignored `.claude/audit/` accruing session logs. The plan's Accept ("zero files under docs/") verifies the docs/ side but not that `.claude/audit/` is gitignore-safe for consumers. ADR-8 (`:240`) still documents `docs/audit/tool-calls.log` as the path — Step 8 must also update ADR-8, which the plan does not list.
5. **gen-commands regeneration for nexus-dotnet if shared rules change — N/A.** nexus-dotnet ships no agents/commands; shared `rules/` live only in nexus. No cross-regen needed. The plan's instinct here is right; the bug is only that B5/Step 9.1 try to run the generator against the empty dir.
6. **Product-doc `v1.md`→`index.md` unaddressed (HIGH-2).** Distinct from M1 (architecture doc). The Fokus po.md and create-feature-spec Template use `docs/product/v1.md`; nexus convention (ADR-2 table, current po.md:23) is `docs/product/index.md`. Restoring Fokus PO content (Step 5) risks reintroducing `v1.md`. And the Step 7 Accept grep `grep -rn "v1\.md"` will return create-feature-spec:89 + Template.md:10,37 — so the plan cannot pass its own acceptance without addressing them, yet no step does.

---

## FINDINGS (severity-rated, with evidence)

### CRITICAL-1 — B5 / Step 9.1 break ALL CI: `gen-commands.mjs nexus-dotnet` crashes
**Where:** Plan Step 1.4 (`node scripts/gen-commands.mjs nexus && node scripts/gen-commands.mjs nexus-dotnet && git diff --exit-code plugins/*/commands`); Step 9.1 parenthetical.
**Evidence:** `plugins/nexus-dotnet/` has no `agents/` and no `commands/` dir (Glob: "No files found"). `gen-commands.mjs:30-31` iterates a hardcoded 8-agent MAP and calls `readFileSync(join(AGENTS_DIR, '${name}.md'))` with `AGENTS_DIR = plugins/nexus-dotnet/agents` — no existence guard → ENOENT → exit 1. The audit's own B5 fix direction (machinery report `:326`) is **nexus-only**: `node scripts/gen-commands.mjs nexus && git diff --exit-code plugins/*/commands`. The plan ADDED the nexus-dotnet leg, converting a correct fix into one that fails every PR.
**Fix:** Drop the `nexus-dotnet` leg from B5 and from Step 9.1 (nexus-dotnet has no agents to generate). OR, if future-proofing is wanted, guard `gen-commands.mjs` to no-op when `agents/` is absent — but that's a Track-4 machinery change that itself needs to be in Step 1. Minimum to ACCEPT: B5 = nexus only.

### HIGH-1 — C5 "TL/PO validate against [the verdict vocabulary]" is unsupported; Step 10 convergence check will fail
**Where:** Plan Step 3 (C5 disposition) + Step 10 ("critic C5 vocabulary matches what TL/PO validate").
**Evidence:** `grep REJECT|REVISE|ACCEPT` over `plugins/nexus` = 0 hits (vocabulary not present anywhere today). `team-lead.md:159` Verdict Validation: "The critic writes no verdict file — read its findings from its TaskOutput" — it validates reviewer/architect verdicts only, never a critic REJECT/REVISE/ACCEPT. po.md has no critic-verdict validation. The plan adds the vocabulary to critic.md but **no step adds a validator to TL or PO**, so the asserted "TL/PO validate against it" is false and the Step 10 re-verification cannot pass.
**Fix (pick one):** (a) Soften C5 to "stated once, used in the critic's own message verdict line" and drop the "TL/PO validate against it" clause + the matching Step 10 check; or (b) add a one-line critic-verdict acknowledgment to team-lead.md Verdict Validation (e.g. "a critic REJECT/REVISE is advisory to the architect/PO who owns the fix"). (a) is the smaller, ADR-faithful change.

### HIGH-2 — Product-doc `v1.md`→`index.md` rename unaddressed, yet Step 7 Accept grep trips on it
**Where:** Plan Step 5 (PO restore), Step 7.4/7.13 (H4/L2), Step 7 Accept (`grep -rn "v1\.md..."`).
**Evidence:** `create-feature-spec/SKILL.md:89` ("validates spec vs v1.md"), `create-feature-spec/workflows/Template.md:10` ("Traces to: docs/product/v1.md") and `:37` ("Reference docs/product/v1.md §4"). nexus convention is `docs/product/index.md` (ADR-2 table; po.md:23). No plan step renames the product-doc references, but the Step 7 Accept grep `grep -rn "v1\.md"` will return these three hits → the step fails its own acceptance. Also: restoring Fokus po.md (which uses `docs/product/v1.md` at Fokus po `:108,179`) risks reintroducing the same.
**Fix:** Add to Step 7 (or M1) an explicit "product-doc canonical = `docs/product/index.md`; sweep create-feature-spec:89, workflows/Template.md:10,37" and ensure the PO restoration (Step 5) genericizes `v1.md`→`index.md`. Then the Accept grep is satisfiable.

### HIGH-3 — M1 architecture-doc sweep is incomplete and conflicts with the dev repo's own filename
**Where:** Plan Step 7.5 (M1) + Step 7 Accept grep.
**Evidence:** Four variants exist: `index.md` (architect.md:24,108), `decisions.md` (architect.md:124), `v1.md` (create-implementation-plan:76), `{version}.md` (create-architecture-doc:9,13,44). The DEV REPO's actual doc is `docs/architecture/README.md` (Glob confirms it's the only file). The plan canonicalizes to `index.md` (defensible — matches the Read-Index convention) but: (1) the Step 7 Accept grep `grep -rn "v1\.md"` catches only `v1.md`, NOT `decisions.md` residue or `{version}.md`; (2) `create-architecture-doc` is the PRODUCER — if it keeps emitting `{version}.md`, every generated doc will mismatch the readers expecting `index.md`. The plan names "both skills, template output" in the M1 step text (good) but the acceptance check can't prove it.
**Fix:** Extend the Step 7 Accept grep to `\b(v1|decisions|\{version\})\.md\b` under architecture contexts, and make `create-architecture-doc` Generate-mode output `docs/architecture/index.md` (not `{version}.md`). Decide explicitly whether the dev repo renames its own `README.md`→`index.md` or documents README as the dev-repo exception.

### MEDIUM-1 — Step 8 must update ADR-8 (still documents `docs/audit/tool-calls.log`)
**Where:** Step 8.1 (A1/A2/C2 relocate to `.claude/audit/`).
**Evidence:** `docs/architecture/README.md:240` (ADR-8): "`audit-logger.js` runs async and appends every tool call to `docs/audit/tool-calls.log`." Step 8 changes the path and the always-on behavior, but the plan's file list for Step 8 (`hooks/scripts/*.js`, `hooks.json`, `plugin.json`) omits the ADR doc. ADR-11 (`:333-363`) also frames the logger as "existing always-on" — now false.
**Fix:** Add `docs/architecture/README.md` (ADR-8 + ADR-11 note) to Step 8's file list, or to Step 7's "annotation only" sweep.

### MEDIUM-2 — Preserve the unpushed 1.2.6–1.2.8 CHANGELOG history in the 1.3.0 release
**Where:** Step 9.4 ("CHANGELOG: rewrite entry properly").
**Evidence:** Audit executive #5 + §5.1: 1.2.6–1.2.8 are unpushed; consumers run ≤1.2.5. The bump tool prepends a new block (`bump-plugin.mjs:223-241`) above the title, so existing blocks are preserved by default — but Step 9.4 says "rewrite," which invites collapsing. The 1.3.0 entry must not absorb/erase the 1.2.6/1.2.7/1.2.8 entries (they ship to consumers on the eventual push).
**Fix:** Step 9.4 → "prepend the 1.3.0 block; do NOT modify the existing 1.2.6–1.2.8 blocks."

### MEDIUM-3 — Step 7 Accept grep under-checks M1/H3 residue
**Where:** Step 7 Accept (`grep -rn "v1\.md\|project-rules\|loaded via @"`).
**Evidence:** This grep misses `decisions.md` (architect.md:124), `{version}.md` (create-architecture-doc), and `.claude/skills|agents|rules` write-instructions (H1/H2 — those are in the FIRST Accept grep, OK). The acceptance is necessary-but-insufficient for M1/H3.
**Fix:** Broaden the Step 7 Accept greps as in HIGH-3.

### MEDIUM-4 — Cross-step edit ordering on shared agent files not stated
**Where:** Steps 2, 6, 7.7 (M3), 7.8 (M5) all edit developer.md / architect.md / team-lead.md.
**Evidence:** M3 (Step 7.7) syncs the pipeline diagrams in developer.md + architect.md + team-lead.md — files restored in Steps 2 and 6. M5 (Step 7.8) edits architect.md. The plan presents Steps 2–7 as independent tracks.
**Fix:** One-line note: "apply all edits to a given agent file (restoration + consistency) in a single pass per file" — or fold M3/M5's per-file edits into the matching restoration step. Low risk for one executor; prevents a half-applied diagram.

### MEDIUM-5 — D1 reconciliation must check the EXISTING developer hard-rules, not just `:52`
**Where:** Step 2 D1.
**Evidence:** The plan reconciles `developer.md:52`. But the restored Phase-2 section must also stay consistent with the untouched hard-rules at `developer.md:54,56` ("report 'ready for Step 1' and STOP", read-only files). A naive Fokus restore (Fokus developer `:68` "Don't commit unless asked") could soften the stronger nexus "never commit" hard rule (`developer.md:56`).
**Fix:** Step 2 should state "preserve the nexus ADR-18 hard-rules (developer.md:54-56) verbatim; the restored two-phase text wraps around them, never relaxes them."

### MEDIUM-6 — L3 relocation has no nexus-dotnet destination skill
**Where:** Step 7.13 (L2/L3 "move .NET/Fokus examples to nexus-dotnet equivalents").
**Evidence:** L3 is the `create-implementation-plan` Refactoring & Type-Move block (.NET-specific). There is no `nexus-dotnet` plan/refactoring skill to receive it (nexus-dotnet skills are domain/stack recipes; none is a plan-authoring skill). "Move to nexus-dotnet equivalents" presumes a destination that doesn't exist.
**Fix:** Either (a) abstract the principles in core and DELETE the .NET examples (don't relocate), or (b) name/create the specific nexus-dotnet skill that receives them. The audit's own L3 direction ("abstract in core; relocate examples") tilts to (a)-with-a-home; pick one concretely.

### MEDIUM-7 — `.claude/audit/` consumer gitignore not covered
**Where:** Step 8.1 + Step 8 Accept.
**Evidence:** New path `.claude/audit/{sessionId}.log`. Dev-repo `.gitignore` ignores 4 named `.claude/` files, not `.claude/audit/` (audit C5/C1). Consumers that ignored `docs/audit/` now accrue un-ignored `.claude/audit/`.
**Fix:** Add `.claude/audit/` to the dev-repo `.gitignore` and document the consumer gitignore line in ADR-8/ADR-11 (consumers add `.claude/audit/`). Extend Step 8 Accept to assert the path is gitignore-covered.

### LOW-1 — Silently-dropped audit IDs (no skip-with-reason)
**Where:** Plan (no mention).
**Evidence:** A11 (`.personas.json` lost-update race — audit "document in header"), A14 (guard denies approved additional-working-dirs), B7 (gen-omni collision guard), B10 (CI validate advisory-only), C5-hygiene (.gitignore named-files-not-class). All are audit LOWs; reasonable to defer, but they vanished without an Out-of-scope line.
**Fix:** Add a one-line "Deferred LOWs: A11, A14, B7, B10, C5-hygiene (documented, no behavior change this release)" to Out of scope.

### LOW-2 — M2 cite imprecision
**Where:** Step 7.6.
**Evidence:** Plan says `review-format :43/:72 APPROVE→APPROVED`; line 72 already reads `APPROVED` (`review-format:72`). Only `:43` (and `:43`-style legend) needs it. Harmless; target valid.
**Fix:** Change "`:43`/`:72`" to "`:43` (and verify `:72` already correct)."

### LOW-3 — P5 Accept not locally exercisable
**Where:** Step 5 (P5 backlog update).
**Evidence:** No `docs/backlog.md` in this repo (Glob). The restored behavior is consumer-facing; fine to ship, but Step 5's "backlog → Spec Ready" can't be locally tested.
**Fix:** Note that P5 is verified by behavior text, not by a local backlog.

### LOW-4 — Step 7.12 ADR-2 block should be declared a verbatim-identical duplication cluster
**Where:** Step 7.12.
**Evidence:** Inlining a slug/path/cap block into 8 agents creates a new M4-style cluster. ADR-14 sanctions it, but without a "change-all-together" note it becomes the next drift source.
**Fix:** Add "≤10 lines, verbatim-identical across all 8 agents; treat as a single change-together cluster."

---

## MINIMAL CHANGE SET TO REACH ACCEPT

1. **CRITICAL-1:** B5 (Step 1.4) and Step 9.1 → drop the `nexus-dotnet` leg (nexus only), OR guard gen-commands.mjs against a missing `agents/` dir as part of Track 4.
2. **HIGH-1:** Either soften C5 to "critic states the verdict in its own message; not validated by TL/PO" and drop the matching Step 10 check, OR add a one-line critic-verdict acknowledgment to team-lead.md.
3. **HIGH-2:** Add product-doc `v1.md`→`docs/product/index.md` sweep (create-feature-spec:89, workflows/Template.md:10,37) and genericize the PO restoration; broaden the Step 7 Accept grep accordingly.
4. **HIGH-3:** Extend the M1 sweep to `decisions.md` + `{version}.md`, make `create-architecture-doc` emit `index.md`, decide the dev-repo `README.md` exception explicitly, and broaden the Accept grep.
5. **MEDIUM-1 & MEDIUM-7:** Add `docs/architecture/README.md` (ADR-8/ADR-11) to Step 8's edits and add `.claude/audit/` to `.gitignore` + consumer-gitignore doc.
6. **MEDIUM-2:** Step 9.4 → preserve the 1.2.6–1.2.8 CHANGELOG blocks.
7. **MEDIUM-6:** Decide L3 = delete .NET examples (abstract in core) vs name a concrete nexus-dotnet destination.
8. **LOW-1:** Add the deferred-LOWs line to Out of scope.

MEDIUM-3/4/5 and LOW-2/3/4 are tightening, not blockers, but should be folded in while revising.

---
Reviewed: docs/specs/adhoc-PluginCleanup/delivery/plan.md
