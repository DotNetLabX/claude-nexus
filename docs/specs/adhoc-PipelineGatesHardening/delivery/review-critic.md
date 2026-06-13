# Pipeline Gates Hardening — Critic Review

## Mode: Plan Review (code-grounded)
## Verdict: REVISE

The plan's design is sound and its dependency chain (log → gate → docs → ADR → release) is correct. But its Gate A framing is factually false against the current tree, and two Step 5 implementation-determinism gaps survive self-audit. Details below, self-contained.

---

## Code-grounded claim verification (each plan claim ↔ the real file on disk)

I read every file the plan asserts facts about. Results, claim by claim:

| # | Plan claim | Verified against | Match? |
|---|---|---|---|
| 1 | boundary-detector matcher is `Write\|Edit\|MultiEdit\|Agent\|Task` and does **not** include `Bash` | `boundary-detector.js:72` (`if (!/^(Write\|Edit\|MultiEdit\|Agent\|Task)$/.test(data.tool_name...`) and `hooks.json:38` (`"matcher": "Write\|Edit\|MultiEdit\|Agent\|Task"`) | **MATCH — accurate.** Bash is absent from both the script regex and the hooks.json matcher. |
| 2 | boundary-detector is always-on (not config-gated) and already appends developer→`review.md`/`summary.md` writes + the ADR-21 spawn vector to `violations.log` | `boundary-detector.js:30-104` (no `argv`/config gate; `ARTIFACT_OWNERS` at 36-41; spawn branch 79-84; append 95-98); `hooks.json:37-42` (registered with no config arg) | **MATCH — accurate.** The cited line ranges ("36-64, 79-101") are slightly loose but point at the right blocks. |
| 3 | audit-logger captures `Skill` (`extractDetail` picks `ti.skill`) but is **gated on the opt-in `token_audit` config (`argv[2]`, default OFF)** | `audit-logger.js:32` (`const AUDIT_ON = /^(1\|true\|on\|yes)$/i.test(String(process.argv[2]...`), `:51` (`ti.skill` in the `extractDetail` pick chain), `:90` (`if (!AUDIT_ON) { process.exit(0); }`) | **MATCH — accurate.** Skill is captured; the whole logger short-circuits when `token_audit` is off. |
| 4 | read-tracker is the always-on positive-tracker precedent (PostToolUse `Read`, not config-gated) | `read-tracker.js` (no config gate; appends/writes state always), `hooks.json:44-47` (registered with no config arg) | **MATCH — accurate.** It is the correct precedent for Gate A's always-on logger. |
| 5 | `team-lead.md:174` (Verdict Validation) already tells the TL to read `violations.log` and "triage" new lines as judgment, not a deterministic void-and-rerun | `team-lead.md:174` (`Also read .claude/audit/violations.log if it exists … any new line since your last checkpoint is a violation to triage`) | **MATCH — accurate.** It is judgment-framed ("triage"), exactly as the plan says. |
| 6 | architect.md done-check's "Skill conformance check" currently compares the plan's Skill Mapping against implementation.md's `## Skills Used` (fakeable / omittable) | `architect.md:230` (`**Skill conformance check.** Compare the plan's Skill Mapping against implementation.md's `## Skills Used` section …`) | **MATCH on the literal mechanism** — the done-check does compare to the self-report. **BUT the plan's surrounding framing that this section/check is *absent or new* is FALSE — see CRITICAL-1.** |

**Claims that did NOT match the tree:** one, and it is the most important.

The plan's Context (lines 30-35), Scope (line 62-64), and **Step 4** (179-191) assert that `## Skills Used` is **absent** — *"Code passes never wrote a `## Skills Used` section"* and Step 4: *"`## Skills Used` becomes a **required** section … the structural section whose **absence** in the two code passes broke the conformance check."* On disk it already exists and is already enforced:

- `implementation-format/SKILL.md:22-28` — the `## Skills Used` table is in the template (per-step rows: `Step | Skill(s) invoked | Notes`, including the `None — deviation: {reason}` form).
- `implementation-format/SKILL.md:56` — anti-pattern: *"**Empty or missing Skills Used section.** Every step gets a row … a mapped skill silently skipped is a Fail finding."*
- `implementation-format/SKILL.md:63` — consumer note: the architect reads "Skills Used (vs the plan's Skill Mapping)."
- `architect.md:230` — the done-check already Fails a mapped-skill-not-invoked-without-reason.
- `CHANGELOG.md:154-155` — *"`implementation-format` gains a `## Skills Used` section; the developer's completion checklist and the architect's done-check now verify skill conformance per step."* (already shipped.)

So the genuine Gate-A delta is **narrow** — (a) re-point the *authoritative source* of the existing check from the fakeable self-report to a new always-on `skill-invocations.log` (Step 3, correctly framed as "re-point the existing rule"), and (b) make absence of the section a *structural* hard-Fail. The plan over-claims by presenting the section and the check as new. This is CRITICAL-1.

---

## Findings

### [CRITICAL] CRITICAL-1 — Gate A's premise is false against the tree: `## Skills Used` and the skill-conformance done-check already exist and are already enforced
**Files:** `docs/specs/adhoc-PipelineGatesHardening/delivery/plan.md` (Context 30-35, Scope 62-64, Step 3 155-177, Step 4 179-191) vs `plugins/nexus/skills/implementation-format/SKILL.md:22-28,56,63`; `plugins/nexus/agents/architect.md:230`; `plugins/nexus/CHANGELOG.md:154-155`.
**Issue:** The plan repeatedly treats `## Skills Used` and the done-check skill-conformance comparison as missing/new. They shipped already. Step 3 is correctly worded ("re-point the existing rule"), but Step 4 ("`## Skills Used` **becomes** a required section … absence … broke the conformance check") and the Context bullet #2 ("never wrote a `## Skills Used` section") describe a baseline that does not exist on disk.
**Evidence:**
- `implementation-format/SKILL.md:56` — `**Empty or missing Skills Used section.** … a mapped skill silently skipped is a Fail finding.`
- `architect.md:230` — `**Skill conformance check.** Compare the plan's Skill Mapping against implementation.md's `## Skills Used` section … is a **Fail** finding (Deviated-without-reason)…`
- `CHANGELOG.md:154-155` — section + done-check shipped together.
**Impact:** A developer acting on Step 4 will try to add a section that already exists → no-op-or-conflict edit; a reader of the Context will believe the gate is missing when only its *authoritative source* is being upgraded. This is precisely the failure the architect's own rules forbid: `architect.md:133` (*"Re-verify every aged finding against current source before planning its fix … planning a 'fix' for an already-fixed finding produces a no-op or a regression"*) and `architect.md:201` (*"Revision passes re-ground steps whose surface changed … re-verify against code"*).
**Fix:** Rewrite Context bullet #2 and Steps 3-4 to state the current baseline explicitly: "`## Skills Used` and the done-check skill-conformance comparison already ship (CHANGELOG x.y) and the section is already enforced by anti-pattern. The deltas are: (a) Step 3 re-points the authoritative source from the self-report to `skill-invocations.log`, demoting the self-report to a cross-check; (b) Step 4 promotes the section from anti-pattern-enforced to an explicitly listed *required* section **only if** the format skill has a 'required sections' list that omits it — verify first; (c) absence becomes a structural hard-Fail." Delete the "never wrote / absence broke the check" claims — the real gap was non-*invocation* logged nowhere, not a missing section.

### [HIGH] HIGH-2 — Step 5 git write-verb carve-out is under-specified and internally inconsistent; chains, wrapping, and prefix collisions unaddressed
**Files:** `plan.md` Step 5 (193-214) and Scope (65) vs `plugins/nexus/hooks/scripts/guard.js:137-148`; `plugins/nexus/hooks/scripts/boundary-detector.js:86-90`.
**Issue:** This is the one detail the plan itself flags as "the one detail to get exactly right" (line 213), and it has three holes:
1. **The verb list disagrees with itself across three places.** Scope line 65: *"`git commit`/`git add -A`."* Step 5 body lines 199-200: *"`git commit`, `git add` (incl. `-A`/`.`), `git reset`, `git push`."* Acceptance lines 208-212 tests only `git commit`. A developer cannot tell whether `git push`/`git reset` are in scope.
2. **Prefix-collision and missing verbs.** The plan says "match the command prefix precisely" and "enumerate the write verbs explicitly, default-allow the rest" (lines 201, 214) — the right *principle* — but the enumeration omits `git stash`, `git restore`, `git switch` (state-changing), and a naive `git commit` match collides with `git commit-graph` (maintenance/read-ish). The plan never says to anchor on a word boundary the way guard.js does.
3. **`&&`-chains and wrapped commands.** A "match the command **prefix**" matcher misses `git status && git commit -m x` (prefix is `git status`) and `bash -c "git commit …"` (prefix is `bash`). Since the design basis is *detection*, a missed commit is a silently-undetected breach — the exact #1 fabrication vector Gate B exists to catch.
**Evidence:** `guard.js:137-138` shows the existing house style to mirror — anchored regexes `\bgit\s+push\b…(--force…)`, `\bgit\s+reset\s+--hard\b` — **not** a prefix scan. `plan.md:201` says "match the command prefix precisely" (the wrong technique for chained/wrapped commands).
**Judgment on the carve-out completeness (explicitly requested):** **Incomplete.** The write-verb side is under-enumerated and inconsistent across three locations; the read-verb exclusion (`status`, `diff`, `log`, `show`, `rev-parse`) is sound as far as it goes but is a *prefix* approach that both over-matches (`commit-graph`) and under-matches (chained/wrapped writes). `git reset` partly overlaps guard.js's existing `reset --hard` deny — different layer (detection vs prevention), so logging it too is acceptable, but the plan should note the overlap. The carve-out needs: one canonical verb list in all three places; substring (anchored-regex) matching for a state-changing verb *anywhere* in the command, not a prefix scan; an explicit DO-NOT-FLAG token list (`commit-graph`, `add--interactive`-class, and the read verbs); and an explicit statement that the Bash branch is the best-effort layer while Step 6's `git log` author check is the guaranteed retroactive catch.
**Fix:** As above — unify the list (recommend the Step-5-body list plus `git stash`, and note `git reset --hard` is already guard-denied), specify anchored-regex substring matching mirroring guard.js, add the DO-NOT-FLAG list, and reconcile Steps 5 and 6 so a missed chain/wrap is still caught at the verify point.

### [HIGH] HIGH-3 — Step 5 risks regressing an existing passing test; the acceptance doesn't preserve it
**Files:** `plan.md` Step 5 acceptance (208-212) vs `tests/unit/boundary-detector.test.mjs:73-78`.
**Issue:** The existing suite has, at lines 76-77, `assert.equal(detect(dir, 'critic', '', 'Bash').status, 0)` and `assert.ok(!existsSync(LOG(dir)))` under the test name *"fail silent: malformed stdin and **non-edit tools** never log or fail."* That test already feeds a `Bash` event and asserts **no** violation is logged. Once Step 5 adds `Bash` to the matcher and a git branch, the script is now invoked for Bash events; the test still passes only because that command is empty (no git verb). The plan never calls out that this test's intent is being narrowed, nor that the new branch must remain a zero-footprint no-op for a Bash command with no state-changing git verb. A developer "cleaning up" line 76, or a new branch that logs on an empty/garbage command, breaks the baseline.
**Evidence:** `boundary-detector.test.mjs:73-78` includes a `Bash` event today and asserts zero log output; `boundary-detector.js:86-87` currently early-exits a Bash event because it has no `file_path`.
**Impact:** Silent regression of a green test, or developer confusion about whether Bash-with-no-git-verb is still a no-op.
**Fix:** Add to Step 5 acceptance: "the existing `non-edit tools never log` test (boundary-detector.test.mjs:76 — a `Bash` event with no git write verb) still passes; a Bash command with no state-changing git verb remains a zero-footprint no-op." Make Step 1's red assert *both* directions: `git commit` → logged, and `git status`/empty → not logged.

### [MEDIUM] MEDIUM-4 — `skill-tracker.js` overlaps audit-logger's existing Skill capture; record the dedupe rationale
**Files:** `plan.md` Step 2 (130-153) vs `plugins/nexus/hooks/scripts/audit-logger.js:46-57`.
**Issue:** audit-logger already records `Skill` calls (with the name, via `ti.skill`) into the per-session trace **when `token_audit` is on**. The plan's justification for a separate always-on logger is correct and explicit (Gate A must not depend on the opt-in flag — lines 141-142), so this is not a defect — but the plan never says "audit-logger also logs Skill; we are deliberately *not* consolidating because that one is config-gated." Without the note, a future reader may "consolidate" and silently re-couple Gate A to `token_audit`.
**Evidence:** `audit-logger.js:51` (`ti.skill` pick), `:32`/`:90` (config gate).
**Fix:** Add one line to Step 2: "audit-logger also captures Skill but only under `token_audit`; this logger is deliberately separate and always-on so Gate A never depends on the opt-in flag (ADR-11). Do not consolidate."

### [MEDIUM] MEDIUM-5 — main-session attribution for `skill-tracker.js` needs the explicit `|| 'main'` fallback
**Files:** `plan.md` Step 2 (138-140) vs `plugins/nexus/hooks/scripts/audit-logger.js:35-42,99`.
**Issue:** Step 2 says resolve `agent` by `data.agent_type` else the persona from `.personas.json` "as `audit-logger.js:readSessionPersona` does." But `readSessionPersona` returns `null` when the registry/session entry is absent, and audit-logger then falls back to `'main'` (`:99`). The plan omits the final `|| 'main'`, so a Skill call in a session that never registered a persona could be logged with a null/blank agent — weakening Step 3's "scoped to the developer's run" query (especially on solo/fast runs where the developer *is* the main session).
**Evidence:** `audit-logger.js:99` — `const agent = data.agent_type || readSessionPersona(…) || 'main';`.
**Fix:** Step 2: end the resolution chain with `|| 'main'`, exactly as audit-logger does; have Step 3's scoping tolerate `main`-attributed entries for solo/fast runs.

### [MEDIUM] MEDIUM-6 — Step 3's "scope to the developer's run for this slug" is underdetermined; the proposed log line has no slug/round field
**Files:** `plan.md` Step 3 (159-167) and the Step 2 schema (line 136) vs `plugins/nexus/hooks/scripts/read-tracker.js:52-59`.
**Issue:** Step 3 requires the done-check to read `skill-invocations.log` "scoped to the developer's implement run for this slug," but the Step 2 schema is `{ts, agent, skill}` — **no slug, no phase/round marker.** The only scoping signals are `agent == developer` and timestamp, which is fragile across resumes and two features run back-to-back in one session. read-tracker solved the analogous "what round" problem by keying on `.pipeline-state` content (`read-tracker.js:57`). The plan leaves "exact windowing to the developer" while giving them nothing to window on.
**Evidence:** Step 2 schema line 136 `{ ts, agent, skill }`; read-tracker round-keying `read-tracker.js:52-59`.
**Impact:** A weak window can miss a developer's skill calls (false Fail) or count a prior feature's (false Pass) — undermining the "scored against a platform-logged fact" determinism the plan is built on.
**Fix:** Add the `.pipeline-state` token (or session_id) to the log line in Step 2 and scope by it in Step 3 (matching read-tracker), or state explicitly that the window is "developer-attributed entries since the last `developer:implement` token write."

### [LOW] LOW-7 — Minor line-reference drift in Context
**Files:** `plan.md` Context line 45 ("lines 36-64, 79-101").
**Issue:** boundary-detector's violation/append logic is `51-64` and `79-101`; the `36-64` start is at the `ARTIFACT_OWNERS` const rather than where writes append. Cosmetic. `team-lead.md:174` (line 53 of the plan) is accurate.
**Fix:** Tighten to `51-101` if precision matters; not blocking.

---

## Gap Analysis (what's missing, not just wrong)

- **Platform `tool_name` for skill invocations is unverified, and the whole gate hangs on it.** Step 2 sets the hooks.json matcher to `Skill` and reads `data.tool_input.skill`. If the platform emits a different `tool_name` for a skill invocation, the logger captures nothing and Gate A silently never fires — a false-green gate, the worst outcome. The plan rates Step 2 "Confidence: high"; that is overstated given this one unverified platform string. Flag it as the Step-2 highest-risk fact for the developer to verify live before relying on it. (audit-logger's `ti.skill` pick suggests the tool_input carries `.skill`, but the `tool_name` string the matcher keys on is the unverified part.)
- **all-`None` plans must not Fail.** Gate A makes "mapped non-None skill absent from the log" a hard Fail. `architect.md:230` already carries the exemption "A plan whose steps are all `Skill: None` still carries the TDD column." Step 3 should restate that the log-based check preserves this — a plan that legitimately maps no skills (like this very plan) must not Fail for an empty log.
- **gen-omni round-trip of the new hook.** Step 9 regenerates the omni twin generically; the new `skill-tracker.js` and the boundary-detector `Bash` edit are the at-risk artifacts. Add an explicit acceptance that the twin's `hooks.json` carries the new entry and `gen-omni.mjs --check` round-trips with no stray diff.
- **Harness invocation note (non-blocking, for the developer):** `node --test tests/` does not recurse subdirectories in the repo's current Node (v24) — the suite is run per-file/glob. The harness itself is healthy (I ran `boundary-detector.test.mjs` + `read-tracker.test.mjs`: 17/17 pass), and `helpers.mjs` provides `runHook`/`makeSandbox` exactly as Step 1 assumes. Step 1's "existing green baseline still green" acceptance should use the suite's real invocation, not a bare `node --test tests/`.

## Categories with no findings (explicit, as requested)

- **ADR conflict:** none. The plan's claim that an always-on logger does not violate ADR-11 is correct — ADR-11 governs the *token* audit specifically (opt-in), and read-tracker is the established always-on, non-config-gated precedent the plan correctly cites. No proposed step contradicts ADR-13, 14, 18, 20, or 21; Step 8 proposes ADR-24 as *proposed/owner-ratify* (not silently finalized), which honors the architect's "owner ratifies" rule. No existing ADR is silently rewritten.
- **guard.js duplication:** none. I checked whether plain `git commit`/`git add` are already covered elsewhere — `guard.js:137-148` only denies force-push, `reset --hard`, and (hardened) any push/installs. Step 5 is **not** a duplicate of guard; it is genuinely new detection. (Noted overlap only on `reset --hard`, different layer.)
- **Dependency ordering:** correct. Step 1 (reds) → 2 (logger) → 3 (done-check consumes the log) → 5 (boundary git branch) → 6 (TL gate consumes Steps 3+5) → 7 (docs) → 8 (ADR) → 9 (release). Each step's stated dependency matches what it actually consumes. No missing handoff.
- **Out-of-scope dispositions:** complete and forward-referenced (developer split → decided against this session; #5 engineering-discipline.md → handed to sprint-rituals; #3/#4/#6 → no code owed with reasons; evaluate-skill re-run → out). Nothing in-scope is silently dropped.

---

## Self-Audit & Realist Check

- **CRITICAL-1** — Confidence HIGH. Refutable only if the architect intended Steps 3-4 as "re-point + re-state existing," in which case the *Context* is still false and must be corrected — survives either way. Not downgraded: it produces a no-op-or-regression edit and misrepresents the shipped baseline; the architect's own `:133`/`:201` rules forbid exactly this.
- **HIGH-2** — Confidence HIGH. The chained/wrapped-commit evasion is the likely *real* case, not theoretical; the three-way verb-list inconsistency is on the page. Survives.
- **HIGH-3** — Confidence HIGH. The conflicting test exists and feeds a Bash event today (verifiable at `boundary-detector.test.mjs:76`). Survives.
- **Systemic pattern (1 CRITICAL + 2 HIGH survive → escalation check):** one root cause explains all three — the plan was written against the *historical finding doc*, not re-grounded against the *current shipped tree* (the same "aged finding not re-verified against source" failure `architect.md:133/:201` warns about). CRITICAL-1 is the direct instance; the Step-5 under-specification (HIGH-2) reads as written-from-the-finding-doc rather than from the test file (HIGH-3). Recommend the architect re-ground Steps 3-5 against the on-disk files before resuming.
- **No data-loss or security issue.** The gates' *design* is sound and the dependency chain is correct. The blockers are accuracy-of-premise (CRITICAL-1) and two determinism HIGHs — all fixable in a revision pass without re-architecting.

---

## Verdict: REVISE

```
Reviewed: docs/specs/adhoc-PipelineGatesHardening/delivery/plan.md
```