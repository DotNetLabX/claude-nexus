# Nexus Plugin Audit — 2026-06-09

**Audited:** nexus 1.2.8 @ `7e90e66` (3 unpushed commits: 1.2.6 → 1.2.8). Scope: shipped plugin + dev-repo machinery, weighted toward **TL relay losses** and **agent boundary violations** (owner-selected). Report-first — nothing fixed yet.

**Method:** 5 parallel investigations + live session evidence.
Source reports (working files, repo root): `.tmp-audit-fokus-diff.md` (Opus 1M), `.tmp-audit-consistency.md`, `.tmp-audit-machinery.md`, `.tmp-audit-web-research.md` (⚠ local-verification only — classifier outage blocked live web), plus the OMC comparison (inline, summarized in §4).

---

## Executive summary

1. **"The hub got hardened, the spokes got lobotomized."** The extraction from Fokus kept the formats and the team-lead layer (now *better* than Fokus), but dropped the worker-side half of nearly every contract. Most of the "problems with the mechanic" trace here — the TL enforces protocols its agents no longer know.
2. **The recent patch churn (1.0.1→1.2.8) held up better than expected** — the ADR-14/17/18 hard-rules are consistently mirrored across all 8 agents, and generated commands are in sync. Drift concentrated in **skills** (still carrying the Fokus `.claude/` world) and a few format/diagram clusters.
3. **Three real bugs in shipped hooks** (audit-logger writes unconditionally + to the wrong root; persona registration skippable) and **three holes in the release machinery** (CI push-leg vacuous, runtime-config changes never bump, omni twin can silently diverge).
4. **The relay problem reproduced itself during this audit**: 4 of 5 background agents lost their final report to lifecycle-event displacement, and 1 falsely claimed "done" without writing its file. ADR-17/18 are empirically right; they need mechanical reinforcement (OMC-style SubagentStop deliverable check + PreCompact state preservation).
5. **Version-cache lag bit us live**: this very session was policed by the *1.1.0* cached pipeline-gate (it blocked an OMC critic spawn under a rule the dev tree repealed in 1.2.x). The unpushed stack is itself a finding.

---

## §1 — Extraction losses (Fokus → nexus): restore the spokes

Full detail: `.tmp-audit-fokus-diff.md`. The load-bearing MISSING items, by agent:

### developer.md (Fokus 180 lines → nexus 112)
| ID | Lost | Why it matters |
|----|------|----------------|
| D1 | **Entire two-phase Analyze→Implement workflow section** | TL spawns `Analyze {slug}.` — the developer no longer defines the verb, the analyze-and-stop boundary, or Phase-2 resume. Worse: nexus `developer.md:52` "a question-free plan may proceed straight to implementing" licenses exactly the Phase-1 collapse the gate can't block (ADR-13). **The weakest seam in the relay mechanic.** |
| D2 | Idempotency check / resume-from-implementation.md | TL's stall recovery ("Continue from Step k+1") assumes a developer that knows how to resume. Contract now exists only on the dispatcher side. |
| D3 | Step announcements ("Step N done. Moving to Step N+1") | This stream is what lets the TL maintain Plan Steps Completed/Remaining — a field its comm-log header still requires. |
| D4 | **Completion Checklist** (blocking gates before "ready for Step 1") | "Ready for Step 1" now arrives unverified. |
| D5 | **"When the Reviewer Returns Findings"** fix-cycle procedure | Only the handoff one-liner survived; read-review/fix-by-severity/record/dispute protocol gone. |
| D6 | Debugging protocol + **3-attempt circuit breaker** + `diagnose` skill invocation | The cycle cap on debugging vanished; `diagnose` ships orphaned. |
| D7/D8 | `tdd` and `boy-scout` invocation points | Both skills ship orphaned — their descriptions claim "loaded by developer/solo" but nothing loads them. |
| D10 | Lessons obligation (`## Developer Lessons`, update before /compact) | `lessons-format` says "mandatory for every agent" but developer/reviewer/solo frontmatter never preloads it → learner loop starves. |

### critic.md (Fokus 236 lines → nexus 55)
| ID | Lost | Why it matters |
|----|------|----------------|
| C1 | **Phase 2.5 Implementation Feasibility (codebase-aware review)** | nexus's own `architect.md:166` records the consequence: in-context critic APPROVE vs code-grounded NO-GO-with-6-HIGH on the same plan. Likely a root cause of rubber-stamp critic verdicts. |
| C2 | Self-Audit + Realist Check (ADVERSARIAL escalation) | False-positive and rubber-stamp calibration gone. |
| C3/C4 | Edge-case probing, ambiguity splitting, breadth scan | The critic's actual gap-finding *techniques* — nexus keeps one bullet. |
| C5/C6 | Severity scale + REJECT/REVISE/ACCEPT vocabulary + **Cross-reference Matrix** | The anti-rubber-stamp device; TL/PO now have nothing structured to validate. |

### reviewer.md / po.md / team-lead.md
| ID | Lost | Why it matters |
|----|------|----------------|
| R1 | **Carry-Over Findings consumption rule** | Broken producer/consumer pair: implementation-format still tells the developer to write carry-overs *for the reviewer*; no reviewer instruction consumes them. |
| R2 | **Fresh Evidence rule** ("run verification yourself; `git show HEAD~1:` for parity") | Agent-level obligation to run builds/tests itself is gone; only the format skill hints at it. |
| R4 | Pre-commitment predictions + self-audit | review-format template *demands* sections whose generating procedure was dropped → cargo-cult fill-in. |
| P1 | **PO Question Answering Mode** (cite-or-escalate, Cited/Inferred/No-answer) | The TL routing chain ("PO answers with citation → user only if PO can't") rests on a protocol the PO never sees. |
| P3 | PO pre-spec gap check | The PO-side mirror of the architect's gap analysis. |
| P4 | help.tooltips.md producer | `rules/help-tooltips.md` still ships with 3 consumers and no producer. |
| T1 | **Fast-mode self-review instruction** | Fast mode is still offered; a Fast run currently ends with **no review of any kind**. |
| T3 | **Learner trigger** ("Process lessons?" post-approval step) | learner agent + `learner:process` token exist; nothing in the pipeline ever invokes them. Feedback loop unreachable from a normal run. |

Also: audit-logger lost Fokus's per-session, per-tool-arg **detail field** (which file an agent wrote, which skill it invoked) — the cheap forensic source for "who wrote what during analyze" (§3 A1/A2 interact).

**Fokus README decision now violated rather than ported:** "Agent boundary rules repeated per agent — duplication is cheaper than a missed guardrail." The slimming removed exactly that duplication.

### Stale Fokus references left in generic files
`diagnose/SKILL.md:96` + `review-format/SKILL.md:97` → `project-rules` (Fokus-only file; nexus = `coding-conventions.md`); `create-implementation-plan/SKILL.md:76` → "`docs/architecture/v1.md` … already loaded via @"; `plan-template.md:58` → gRPC/integration-event wording in core; `agents-workflow.md:98` → "the pipeline protocol" (no such file); `tdd`/`diagnose`/`boy-scout` descriptions claim loaders that don't exist.

---

## §2 — Consistency drift (post-extraction patching)

Full detail: `.tmp-audit-consistency.md` (4 HIGH / 8 MEDIUM / 6 LOW).

**HIGH (all in skills — the agents themselves held up):**
- **H1** `improve-flow`/`improve-skills` tell the **learner** to promote lessons into `.claude/agents|rules|skills/` — the pre-ADR-1 hardcopy world. In a consumer project those writes reach nothing and version nothing. Highest blast radius: decide promotion target (plugin repo vs project docs) and rewrite.
- **H2** `create-architecture-doc`/`create-implementation-plan` build the skill inventory by globbing `.claude/skills/` — the architecture doc's own Known-Limitation P2 says that under-reports plugin skills. Replace with "use skills in context."
- **H3** "already loaded via `@`" claims + `v1.md` filename in `create-implementation-plan`/`create-feature-spec` — directly contradicts ADR-2; an agent trusting it skips reading architecture entirely.
- **H4** `create-feature-spec` routes the **PO** through "the Architect agent's `@` directives" — a spawned PO has neither.

**MEDIUM:** M1 architecture-doc filename exists in 4 variants (`index.md`/`decisions.md`/`v1.md`/`{version}.md`); M2 `review-format` says `APPROVE` where every consumer greps `APPROVED` (verdict-grep correctness); M3 pipeline diagram duplicated 4× with diverging detail + "Three-agent pipeline" stale lead; M4 confidence-label gloss duplicated 7× (consistent today; known future-drift cluster); M5 architect's checkpoint format missed the 1.2.8 confidence-tag update; M6 question-routing chain omits the developer→architect leg in the TL box; M7 `.current-agent`/`.personas.json` two-file design undocumented; M8 Standard+Codex missing from agents-workflow Team Configurations (Fokus had the row — converges with fokus-diff).

**Real ADR-2 exposure:** slug conventions, standard paths, and cycle caps live **only** in `agents-workflow.md` — masked in team mode (TL passes them in dispatch), broken for standalone `be developer`/`be architect`. Inline a compact slug/path/cap block per agent or document the degradation.

**LOW:** L1 `improve-flow` names agent sections that no longer exist; L2/L3 .NET/Fokus-specific examples embedded in core skills (ADR-3 says they belong in nexus-dotnet); L4 stale line-number refs in ADR-16 (historical, annotate); L5 developer boundary bullet omits lessons.md nuance; L6 stale critic "Managed by" note.

---

## §3 — Hooks & machinery bugs

Full detail: `.tmp-audit-machinery.md` (3 HIGH / 11 MEDIUM / 16 LOW).

**HIGH:**
- **A1** audit-logger writes `tool-calls.log` on **every tool call unconditionally** — the ADR-11 opt-in gates only the token log, contradicting its own header and plugin.json ("zero extra work when disabled"). Every consumer accrues an unasked-for, ever-growing `docs/audit/`.
- **A2** audit-logger resolves its path from `process.cwd()` (every sibling uses `CLAUDE_PROJECT_DIR || data.cwd`) — **this is the stray-log bug.** One-line fix; also relocate out of committed `docs/` (C2).
- **B1** bump-tool: changes to a plugin's `.mcp.json`/`.lsp.json`/`settings.json` classify as "no bump" (the runtime-config branch is unreachable behind the no-slash check) → would ship and never reach users; CI shares the hole.

**MEDIUM (selected):**
- **B3** CI push-to-main leg is **vacuous** (base resolves to the just-pushed HEAD → empty diff → always green). All recent releases were direct pushes — the exact unchecked path. Fix: `--base ${{ github.event.before }}`.
- **A4** pipeline-gate invariant 3 (subagent writing `.pipeline-state`) **can never fire** — only attributable callers are background subagents whose deny is dropped (ADR-13). Invariants 1–2 remain alive for foreground. Keep the gate, delete/re-point invariant 3.
- **A6** persona registration silently skippable (PostToolUse matcher is `Write` only; an **Edit** to the pre-existing `.current-agent` never registers → guard's role enforcement quietly off; `.current-agent` itself is never-read residue).
- **A7** guard.js binds with **no matcher** — synchronous node spawn on every Read/Glob/MCP call it can't act on.
- **B5** no staleness check for generated `commands/` (verified in sync today); **B6** omni twin has no `--check` mode and no CI — silent divergence possible; **B4** gen-commands drops `model`/`effort`/`skills` frontmatter (a `/team-lead` persona runs at whatever model the session has — document or carry over).
- **A5** guard's rm-rf detection is POSIX-only (misses `rm -rf D:\`, PowerShell `Remove-Item`, split flags) on a Windows-first machine.

**LOW (themes):** matcher waste (A8 `Task|Agent` dead in gate matcher), resume re-injection (~6K dup tokens, A9), per-file try/catch (A10), root-resolution inconsistency (A12), `.env.example` over-block (A13), roster hardcoded in 3 places (A17), `async: true` support unverified (A15), CHANGELOG scaffold quality (B8), validate job advisory-only (B10). C3: the adhoc-PipelineHardening record has **no summary.md** — formally the hardening run never closed.

---

## §4 — Adoption candidates (from OMC) — mapped to pain points

| # | Pattern | Addresses | Verify first |
|---|---------|-----------|--------------|
| 1 | **PreCompact hook** re-injecting pipeline state (slug, phase, cycle, agentIds, steps done/remaining from comm-log header) as `additionalContext` | Relay loss across `/compact` — today only the persona survives; the TL wakes up in-role but amnesiac | PreCompact event support [local docs: UNVERIFIED] — confirm against hooks docs |
| 2 | **`disallowedTools: Write, Edit`** frontmatter on architect/reviewer/critic/po | Boundary violations at platform level, not prose | Frontmatter field support for plugin agents [UNVERIFIED] |
| 3 | **Kill switches** `DISABLE_NEXUS` / `NEXUS_SKIP_HOOKS` (~5 lines/script) | Hook debuggability; a broken hook currently wedges every session | — |
| 4 | **SubagentStop deliverable-verification hook** (advisory, never blocking; `templates/deliverables.json`: stage → required file + minSize + verdict pattern) | The #1 observed failure: "claimed done, artifact thin/missing" — catches it mechanically | SubagentStop event support [UNVERIFIED] |
| 5 | **Protocol extraction into a preloaded reference skill** (`skills:` frontmatter injection is *guaranteed* per ADR-4) to shrink team-lead.md (32KB)/architect.md (30KB) | Patch churn — protocol duplicated in 2 big files | Interacts with §1: restoring spoke content *grows* worker files; extraction offsets it. Sequence carefully. |
| Skip | dist/TS build layer, run.cjs version magic, project-memory auto-detect, setup wizard, PostToolUse rules injector | Disproportionate for an 8-agent single-owner plugin | — |

Session-scoped state (`.claude/state/{session_id}/pipeline-state`) is a smaller adopt-worthy item — the current single global `.pipeline-state` cross-contaminates overlapping runs.

---

## §5 — Live session evidence (this audit, today)

1. **Stale-cache enforcement:** the 1.1.0 cached pipeline-gate blocked an `oh-my-claudecode:critic` spawn (role-match splits on `[:/]` → "critic") under a rule the dev tree repealed in 1.2.x. Demonstrates both the over-broad match *and* the cost of the unpushed 1.2.6–1.2.8 stack.
2. **Relay displacement, 4×:** four background agents completed with their full report stranded in-transcript; repeated SubagentStop lifecycle pings made "nothing pending" their final visible message. ADR-16/17's "inline notice is partial" reproduced on a different orchestration stack.
3. **Fabricated completion, 1×:** an agent replied "done" with no file written — the exact ADR-18 failure class.
4. **What worked:** the relaunched Fokus-diff agent with **artifact-first delivery baked into the prompt** ("write the file FIRST; if Write fails, full text as final message; never answer pings with 'nothing pending'") delivered flawlessly. This prompt pattern belongs in the TL's dispatch templates.

---

## §6 — Proposed fix plan (for GO/NO-GO, per track)

| Track | Content | Suggested release | Confidence |
|-------|---------|-------------------|------------|
| **1. Spoke restoration** | §1: D1–D10, C1–C6, R1–R4, P1–P4, T1, T3 + re-wire `tdd`/`diagnose`/`boy-scout` + preload `lessons-format` where mandated | **MINOR (1.3.0)** — restored capability | high — restores proven Fokus behavior the TL already assumes |
| **2. Consistency cleanup** | §2: H1–H4, M1–M3, M5–M8, L1–L6 + §1 stale refs; M4 left as documented cluster | PATCH (can ride with track 1) | high — mechanical, each item has exact file:line |
| **3. Hook fixes** | A1+A2 (logger gating + root + relocate out of docs/), A4 (delete invariant 3), A6 (matcher Write\|Edit), A7/A8 (matchers), A9/A10, A5 (Windows rm patterns) | PATCH | high for A1/A2/A6/A7; medium for A5 scope |
| **4. Machinery** | B1 (classifier hoist), B3 (CI base), B5 (commands staleness CI), B6 (gen-omni --check), B4 (document or carry frontmatter), B8 (--note) | no bump (dev-repo only) | high |
| **5. OMC adoptions** | PreCompact state, kill switches, disallowedTools, SubagentStop verify-deliverables, session-scoped state; protocol-extraction-to-skill as a separate later decision | MINOR, after platform-support verification | medium — three items rest on unverified platform features |
| **6. Push the stack** | 1.2.6–1.2.8 (+ whatever ships above) | — | high — every consumer currently runs ≤1.2.5 behavior incl. the repealed spawn-block |

**Suggested order:** 4 (CI fixes protect everything after) → 1+2 together → 3 → verify platform features → 5. Track 6 whenever you say push.

**Open questions for the owner:**
1. H1: where do learner promotions land — plugin dev-repo or consumer `docs/` + CLAUDE.md? (Recommendation: consumer-facing lessons → project docs; plugin-behavior lessons → flagged for the plugin repo, applied only here. Confidence: medium — real trade-off between autonomy and ADR-1 purity.)
2. Track 1 grows developer.md/critic.md substantially. Accept growth now and consider protocol-extraction (§4.5) later, or do both in one release? (Recommendation: growth now, extraction later — one variable at a time. Confidence: high.)
3. audit-logger: keep a (fixed, opt-in, detail-restored) tool trace at all, or delete the hook and keep only the token audit? (Recommendation: keep, opt-in, with Fokus's detail field restored — it's the supervision evidence source. Confidence: medium.)
