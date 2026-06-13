# Implementation Plan — Pipeline Gates Hardening

**Feature Spec:** None (adhoc hardening pass — scope from this session's audit of the last 3 sprint-rituals
features + `docs/pipeline-hardening-findings.md` lineage + `docs/proposals/plugin-evaluation-2026-06.md` §B).
Binding constraint: the ADR register (`docs/architecture/README.md`) — ADR-13 (gate inert on background),
ADR-14/18 (agent self-containment + ownership), ADR-21 (delegated advancement), ADR-11 (opt-in audit).
**Slug:** adhoc-PipelineGatesHardening
**Plan:** docs/specs/adhoc-PipelineGatesHardening/delivery/plan.md
**Intent:** Refactoring / enforcement hardening (plugin-internal: hooks + agent docs + format skill; no
consuming-project source). One MINOR release.
**Review mode (recommended):** **critic, code-grounded** — this pass edits hooks (`*.js`), the done-check,
and `team-lead.md`; a doc-only critic is structurally blind to hook/script defects (architect.md: code-
grounded review is mandatory for shared/external-artifact passes).

---

## Context

This session audited the last three sprint-rituals pipeline runs and confirmed two enforcement gaps that
recur and are **not** prevented today — only detected, or not even that:

- **#1 Gate fabrication (HIGH, recoverable).** A developer spawned for Phase-1 `analyze`, finding no
  questions, ran the whole pipeline solo and **self-authored the independent gates** — `review.md` signed
  as Architect *and* Reviewer, `summary.md`, plus self-commits. Hit 2 of the 3 latest features
  (Pass5, VwhEvaluationFollowup). The boundary detector *logs* it; the team lead *recovers* it by voiding
  and re-running the real gates. Because it is **recoverable** (the real gates re-run, code was
  independently verified correct), the fix is **reliable detection + deterministic recovery**, not
  prevention. Decision this session: do **not** split the developer agent.

- **#2 Skill non-invocation (the worst, unrecoverable).** The developer applies patterns from the plan's
  paraphrase rather than invoking the mapped skills. The audit window's only telemetry showed the developer
  invoking `nexus:architect`/`nexus:reviewer` (gate impersonation) and **zero pattern skills**. This is
  unrecoverable — the code is already written, potentially drifted, and a plan-conformance review can pass it.

  **Baseline already on disk (re-verified this revision — do NOT re-build it):** the `## Skills Used` section
  and the done-check skill-conformance comparison **already ship** (nexus **1.5.0**, 2026-06-11;
  `CHANGELOG.md:154-155`, reinforced 1.5.1/1.5.2 at `:122`/`:102`). `implementation-format/SKILL.md:22-28`
  carries the per-step `## Skills Used` table; `:56` makes an empty/missing section a Fail anti-pattern;
  `:63` records the architect-consumer note; `architect.md:230` already Fails a mapped-skill-not-invoked
  without a documented reason. So the section is **present and enforced**. The **one structural gap** the
  shipped check cannot close: it scores against the developer's **own self-report** in implementation.md —
  fakeable (claim an invocation that never happened) and, if the section is omitted, the done-check has
  nothing to compare. The fix is to **re-point the authoritative source** of the existing check to a
  platform-logged fact (an always-on `skill-invocations.log`), demote the self-report to a cross-check, and
  make absence of the section a structural hard-Fail.

**Unifying principle (the design spine of this plan):** neither breach is preventable at the prompt level
(ADR-13: a background subagent's PreToolUse deny is dropped; you cannot force a `Skill` call). So convert
both from "an agent must choose to behave" into **detect-then-gate**: log the fact deterministically, and
make the gate Fail on the logged fact. #1 re-runs the real gates (recoverable); #2 bounces for a redo.

**Code-grounded facts (re-verified file-by-file this revision):**
- `plugins/nexus/hooks/scripts/boundary-detector.js` is **always-on** (PostToolUse `Write|Edit|MultiEdit|Agent|Task`,
  not config-gated; `hooks.json:38`) and already appends ownership-breach writes AND the ADR-21
  "subagent spawns a pipeline-role agent" vector to `.claude/audit/violations.log` (violation/append logic at
  lines 51-101). It does **not** match `Bash` (`boundary-detector.js:72`, `hooks.json:38`), so a rogue
  `git commit` by a subagent is currently undetected at the hook.
- `plugins/nexus/hooks/scripts/guard.js:137-138,147` is the **house style for git-command matching** — anchored
  word-boundary regexes (`\bgit\s+push\b…(--force…)`, `\bgit\s+reset\s+--hard\b`), NOT a prefix scan. Step 5
  mirrors this. guard.js already **denies** `git push --force` and `git reset --hard`; Step 5 is a different
  layer (detection of plain commits/adds the guard does not block), not a duplicate — note the `reset --hard`
  overlap.
- `plugins/nexus/hooks/scripts/audit-logger.js` *does* capture `Skill` calls (`extractDetail` picks `ti.skill`,
  `:51`) but is **gated on the opt-in `token_audit` config** (`argv[2]`, `:32`/`:90`, default OFF) — so
  skill-invocation data only exists when audit happens to be on. A reliable gate cannot depend on it. Its
  agent-attribution chain ends `data.agent_type || readSessionPersona(…) || 'main'` (`:99`) — Gate A's logger
  copies this **including the `|| 'main'` tail** (MED-5).
- `plugins/nexus/hooks/scripts/read-tracker.js` is the precedent for an **always-on positive tracker** (PostToolUse
  `Read` → `read-tracker.json`, not config-gated) AND the precedent for **round-scoping by the `.pipeline-state`
  token** (`:52-59`: state resets when the token or session id changes). Gate A's logger mirrors both (MED-6).
- `plugins/nexus/agents/team-lead.md:174` (Verdict Validation / Enforcing the Rules) already tells the TL to read
  `violations.log` and "triage" new lines — but as **judgment**, not a deterministic void-and-rerun. That sentence
  is Gate B's hook; it needs to become a fixed action matrix.
- `plugins/nexus/agents/architect.md:230` done-check **already carries** the "Skill conformance check" — it
  compares the plan's Skill Mapping against implementation.md's `## Skills Used` (**self-report: fakeable /
  omittable**). Step 3 **re-points** it (does not introduce it) to score against the log.

**Quantified Gate-A delta (what genuinely remains vs what already ships — the team lead needs this to confirm a
MINOR release is warranted):**

| Already ships (1.5.0–1.5.2, do NOT re-build) | Genuinely remaining (this plan) |
|---|---|
| `## Skills Used` section in `implementation-format` (`:22-28`) | **NEW** always-on `skill-tracker.js` hook → `skill-invocations.log` (Step 2) — the platform-logged fact |
| Empty/missing-section anti-pattern Fail (`:56`) | Step 3 **re-points** the existing check's authoritative source from the self-report to the log; self-report demoted to a cross-check |
| Done-check compares Mapping ↔ self-report (`architect.md:230`) | Step 3 makes **absence of `## Skills Used`** a *structural* hard-Fail (today it's an anti-pattern, not a named required section) |
| `TDD: yes` not waived by `Skill: None`; all-`None` exemption | Step 4 promotes the section to an explicitly **listed required section** *only if* `implementation-format` lacks such a list today (verify first — it may already be enforced enough) |

The net new capability is **the logger + the gate's authoritative-source flip + the rogue-commit detection branch**
(Gate B) — two new always-on detection mechanisms. That is a **new capability surface → MINOR** is warranted; it is
*not* a re-statement of shipped behavior.

## Scope

**In scope:**
1. **Gate A (#2):** an always-on `skill-tracker.js` hook → `.claude/audit/skill-invocations.log`; the
   architect done-check **re-points** its existing skill-conformance check to score against that log (not the
   fakeable self-report) and makes absence of `## Skills Used` a structural hard-Fail. (The `## Skills Used`
   section and the conformance check already ship — 1.5.0; this upgrades their *authoritative source*, it does
   not introduce them. See the Quantified Gate-A delta above.)
2. **Gate B (#1):** extend `boundary-detector.js` to flag a subagent **state-changing git write** —
   **canonical verb list (used identically in Step 5 body, acceptance, and the Step-1 red):**
   `git commit`, `git add`, `git reset`, `git push`, `git stash`, `git restore`, `git switch` — matched with
   **anchored word-boundary regexes** (guard.js house style), with a **DO-NOT-FLAG** list (read-only git +
   `git commit-graph`); convert `team-lead.md`'s "triage the log" into a **deterministic fabrication
   void-and-rerun** protocol with a fixed action matrix, run at every verify point.
3. Document both logs + gates in `agents-workflow.md`; propose **ADR-24** (skill invocation is a logged,
   gated fact; the fabrication gate's determinism extends ADR-18/21).
4. Tests-first (the repo's hardening convention): red `node --test` units before the fixes.
5. One **MINOR** release (new capability) via `release-plugin`; regenerate commands + the `omni` twin.

**Explicitly out of scope:**
- **The developer agent split** — decided against this session (analyze→implement stop stays a soft rule;
  the breach it guards is recoverable and now deterministically caught by Gate B).
- **#5 dangling `engineering-discipline.md`** — handed to **sprint-rituals** separately (its ADR-003 +
  backlog cite the missing path; it is a different repo, not a nexus-plugin concern). Not touched here.
- **#3 relay / #4 architect plan defects / #6 runtime** — no code change owed (relay fixed in 1.7.2 →
  ops/test action in the consumer; #4 rule already in `create-implementation-plan` + code-grounded critic;
  #6 platform, recovery-only).
- Re-running `evaluate-skill` — the 26-skill sweep ran 2026-06-12; not re-run here.

---

## Skill Mapping

| Step | Skill | Disposition | Feature-Specific Inputs | TDD | Gap? |
|------|-------|-------------|------------------------|-----|------|
| 1 | (none — test authoring) | None | Red units (repo-root `tests/unit/`, `node:test`) for skill-tracker (both directions), boundary-detector git-write branch (commit→logged, status/empty→not), and the `## Skills Used` structural lint; each fails for the right reason first | yes | — |
| 2 | (none — Claude Code hook) | None | New always-on PostToolUse(`Skill`) logger mirroring `read-tracker.js`; register in `hooks.json`. **Highest-risk live-verify: the platform `tool_name` for a Skill invocation** (the gate is false-green if the matcher string is wrong) | yes | No skill covers authoring a CC hook |
| 3 | (none — agent definition) | None | **Re-point** the existing done-check skill-conformance (architect.md:230): authoritative source = `skill-invocations.log`; self-report demoted to cross-check; structural hard-Fail on missing `## Skills Used`; preserve the all-`None` exemption | no | — |
| 4 | (none — format skill) | None | Promote `## Skills Used` to an explicitly listed REQUIRED section in `implementation-format` (verify it is not already one); per-step rows | no | — |
| 5 | (none — Claude Code hook) | None | Extend `boundary-detector.js` to flag a subagent **state-changing git write** (canonical verb list, anchored regex, DO-NOT-FLAG list); add `Bash` to its matcher; preserve the Bash-no-git-verb no-op | yes | — |
| 6 | (none — agent definition) | None | `team-lead.md`: deterministic fabrication void-and-rerun action matrix at verify points; consume the skill-conformance Fail | no | — |
| 7 | (none — rules doc) | None | Document `skill-invocations.log` + both gates alongside `violations.log` in `agents-workflow.md` | no | — |
| 8 | (none — ADR proposal) | None | Propose ADR-24 + note fabrication-gate determinism extends ADR-18/21 — owner ratifies, architect does not silently amend | no | — |
| 9 | `release-plugin` | Follow | MINOR bump (new capability), CHANGELOG, regenerate `nexus` commands + `omni` twin | no | — |

**Skill-verification notes:** Steps 2–8 perform plugin-internal authoring (Claude Code hook scripts, agent
markdown, a rules doc, an ADR proposal). No `nexus`/`nexus-dotnet` skill frontmatter covers "write a CC
hook" or "edit an agent definition" — `None` is warranted for each. Step 9 is the ADR-9 release flow →
`Follow release-plugin` (its keyword is the binding trigger). **Anti-pattern check:** no "adapt" near any
skill ref; the one Follow step carries only the bump tier + regen targets, not restated release mechanics.

**Harness facts (re-verified this revision — the plan's Step 1 path assumptions were loose):** tests live at
**repo-root `tests/unit/` and `tests/lint/`** (NOT `plugins/nexus/tests/`); shared helpers
`tests/helpers.mjs` export `pluginRoot`, `runHook`, `makeSandbox`, `cleanupSandboxes`. The **canonical
invocation** (CI hard gate, `plugin-release-check.yml:58` + `tests/README.md:8`) is the **glob form**
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` — the bare-dir form regressed on Node ≥22. Every
acceptance that says "baseline still green" or "lint green" means **this glob command**, not `node --test tests/`.

---

## Implementation Steps

### Step 1 — Red tests first (TDD baseline)
**Files (create):** `tests/unit/skill-tracker.test.mjs`; **modify:** `tests/unit/boundary-detector.test.mjs`
(extend, do not rewrite — preserve all 11 existing tests); add the structural-section assertion to the lint
tier (`tests/lint/` — co-locate with the existing `enforcement`/`wiring` lints, or extend one). Mirror the
existing hook tests' fixture-feeding pattern: import `runHook, makeSandbox, cleanupSandboxes, pluginRoot`
from `../helpers.mjs`; feed a synthetic event JSON on stdin via `runHook`. Add:
- a **skill-tracker** test (new file): a synthetic PostToolUse `Skill` event → asserts one
  `{ts, agent, skill, …}` line appended to `skill-invocations.log`; a non-`Skill` event appends **nothing**;
  malformed stdin appends nothing and exits 0. (Mirror `read-tracker.test.mjs` for the state/positive-log shape.)
- a **boundary-detector git-write** test (extend the existing file): a subagent `Bash` event with
  `git commit …` → asserts a `violations.log` rogue-write line; **and the inverse** — a `git status`/`git diff`
  command AND an **empty** Bash command (`''`) append **nothing** (read-only/no-verb git is not a breach). This
  inverse half **must** be asserted: it preserves the intent of the existing
  `boundary-detector.test.mjs:76` test (`detect(dir, 'critic', '', 'Bash')` → no log), which now exercises a
  matched-but-no-verb path rather than an unmatched-tool path (HIGH-3).
- a **`## Skills Used` structural lint**: assert `implementation-format/SKILL.md` lists `## Skills Used` as a
  **required** section (red until Step 4 promotes it from anti-pattern to listed-required). If the lint tier has
  no "required sections" check today, add a minimal one scoped to this section.

Each test must **fail for the right reason** before its fix lands (skill-tracker script absent → red;
boundary git branch absent → red; format lint → red). This step writes only tests.

- **Skill:** None (test authoring). **TDD:** yes (these ARE the tests).
- **Dependency:** none.
- **Accept:** the three reds exist and fail for the right reason (script/section absent), not on a harness
  error; the existing `boundary-detector.test.mjs` suite (all 11 tests, incl. `:76`) and the full baseline
  stay green under the canonical invocation `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`.
- **Confidence:** high — harness layout now pinned (repo-root `tests/`, `helpers.mjs` exports `runHook`/
  `makeSandbox`); `read-tracker.test.mjs` + `boundary-detector.test.mjs` are direct precedents.

### Step 2 — Always-on skill-invocation logger
**Files (create):** `plugins/nexus/hooks/scripts/skill-tracker.js`. **Modify:**
`plugins/nexus/hooks/hooks.json` (register it: `PostToolUse`, matcher = **the platform's Skill tool name**
(see live-verify below), `async: true`, `timeout: 10` — same shape as the `read-tracker` / `boundary-detector`
entries).

Author an always-on PostToolUse hook that appends one JSON line per skill invocation to
`.claude/audit/skill-invocations.log`. Mirror `read-tracker.js` exactly for the plumbing — stdin JSON read,
`async`/observe-only/**never blocks**, **fail-silent** on any error, root = `CLAUDE_PROJECT_DIR || data.cwd ||
cwd`, `mkdir -p .claude/audit`.

**Log line schema** — `{ ts, agent, skill, token, session }` (NOT just `{ts, agent, skill}`):
- `agent` — resolve **exactly as `audit-logger.js:99` does**, including the final fallback:
  `data.agent_type || readSessionPersona(session_id, root) || 'main'`. The `|| 'main'` tail is **required**
  (MED-5) — on solo/fast runs the developer *is* the main session and a Skill call there must attribute to
  `main`, not blank, or Step 3's scoping silently drops it.
- `skill` — `data.tool_input.skill`.
- `token` — the `.claude/.pipeline-state` content (read the way `read-tracker.js:52-53` reads it; `''` if
  absent) — **and** `session` = `data.session_id`. These give Step 3 a real window to scope by (MED-6): the
  bare `{ts, agent, skill}` had only agent+timestamp, which is fragile across resumes and two back-to-back
  features in one session. read-tracker solved the same "which round" problem by keying on the pipeline-state
  token; this mirrors it.

This logger is **not** config-gated (Gate A must not depend on opt-in `token_audit` — ADR-11; `read-tracker.js`
is the always-on precedent). **Dedupe note (MED-4):** `audit-logger.js:51` *also* captures `Skill` (via
`ti.skill`) into the per-session trace — but only under `token_audit`. This logger is **deliberately separate
and always-on**; do **not** consolidate them, or Gate A re-couples to the opt-in flag.

**HIGHEST-RISK LIVE-VERIFY (the whole gate hangs on this — do this before relying on the logger):** the
hooks.json matcher and the event's `tool_name` must be the platform's **actual** identifier for a skill
invocation. `audit-logger.js` only picks `ti.skill` opportunistically from a broad `||` chain — it is **not**
evidence that `tool_name === 'Skill'`. If the platform emits a different `tool_name` (e.g. the skill surfaces
as a `Task`/tool-call under another name), the matcher captures nothing and **Gate A is silently false-green
— the worst outcome.** The developer must verify the live `tool_name` (and that `tool_input.skill` carries the
name) against a real Skill event — inspect an `audit-logger` per-session trace with `token_audit` on, or emit a
probe — and set the matcher to whatever the platform actually emits. Document the verified string in
implementation.md.

- **Skill:** None (CC hook). **TDD:** yes (Step 1 red → green).
- **Key constraints:** never block (PostToolUse can't anyway); zero footprint on error; one line per skill
  call; `agent` filled (incl. `|| 'main'`) for subagent AND main-session; log line carries the round token.
- **Dependency:** Step 1 (its red test).
- **Accept:**
  1. `skill-tracker.js` exists; `hooks.json` registers it on PostToolUse with the **verified** matcher, async.
  2. A skill invocation appends `{ts, agent, skill, token, session}` with `agent` resolved through `|| 'main'`;
     a non-matching tool appends nothing; an error/malformed-stdin path creates/writes nothing.
  3. Step 1's skill-tracker test is green.
  4. The platform `tool_name` is verified live and the verified string recorded in implementation.md.
- **Confidence:** **medium** — the plumbing is high-confidence (`read-tracker.js` is a direct precedent), but
  the **platform `tool_name` for Skill is unverified on disk** and the gate is false-green if it's wrong. Not
  `high` until the live-verify lands.

### Step 3 — Done-check gates against the log, not the self-report
**File (modify):** `plugins/nexus/agents/architect.md:230` (the **Skill conformance check** under Step 1: Done
Check — it **already exists**; this step re-points it, it does not introduce it).

The current text (`architect.md:230`) compares the plan's Skill Mapping against implementation.md's
`## Skills Used` (the self-report). **Re-point** it: the **authoritative** source becomes
`.claude/audit/skill-invocations.log`; the implementation.md `## Skills Used` section is **demoted to a
secondary cross-check** (a self-report corroborated against the log). The new dispositions:
- A plan step with a non-`None` Skill Mapping (a pattern skill, or `tdd` on a `TDD: yes` step) whose skill does
  **not** appear in the log for the developer's run, with **no documented deviation reason**, is a **Fail**
  finding — same disposition as a Missing step.
- A self-reported invocation **absent from the log** is a fabrication → Fail.
- A **missing `## Skills Used` section** is itself a Fail (structural — Step 4 makes the section a named
  required section so this is enforceable).
- **Preserve the all-`None` exemption (gap-analysis item):** a plan whose steps legitimately map **no** skills
  (like this very plan — all `Skill: None`) must **not** Fail for an empty log. The log-based check applies
  only to steps with a non-`None` mapping; the existing "a plan whose steps are all `Skill: None` still carries
  the TDD column" line stays.

**Scoping the log to the developer's run (MED-6 — make this concrete, don't punt it):** the window is
**developer-attributed entries** (`agent == developer`, or `main` for solo/fast runs) **whose `token` field
matches the `.pipeline-state` token in force during the implement phase** (the field Step 2 adds). This is the
same round-keying `read-tracker.js:57` uses — it survives resumes and disambiguates two features run
back-to-back in one session. The done-check reads the token and filters by it; it does not rely on timestamp
guesswork.

- **Skill:** None (agent definition). **TDD:** no.
- **Key constraints:** log is authoritative; deviation must be *documented* to pass; absence of the section
  is a hard Fail; all-`None` plans never Fail on an empty log; this is a detection-gate (it cannot force
  invocation — it makes silent omission always Fail).
- **Dependency:** Step 2 (the log + its `token` field exist).
- **Accept:** `architect.md:230`'s done-check is **rewritten in place** (not duplicated) to name
  `skill-invocations.log` as authoritative, scope by the `.pipeline-state` token, and specify hard-Fail on
  (a) missing `## Skills Used`, (b) a mapped non-`None` skill absent from the log without a documented
  deviation, (c) a self-report not corroborated by the log — while explicitly exempting all-`None` plans. The
  prior "compare to implementation.md `## Skills Used`" wording is replaced, not left alongside.
- **Confidence:** high — `architect.md:230` is read and the edit is a re-point of existing text.

### Step 4 — Promote `## Skills Used` to a named required section
**File (modify):** `plugins/nexus/skills/implementation-format/SKILL.md`.

**Baseline (re-verified — CRITICAL-1):** `## Skills Used` **already exists** in this skill — the per-step table
template at `:22-28` and the **anti-pattern** "Empty or missing Skills Used section … a mapped skill silently
skipped is a Fail finding" at `:56`. So this step does **NOT** add the section (it's there); it **promotes its
status from anti-pattern-enforced to a named structural requirement** so Step 3's "absence is a hard Fail" is
mechanically checkable by Step 1's lint.

**Verify-first carve-out:** read the skill's required-sections list first. If `## Skills Used` is **already**
in an explicit "required sections" enumeration, this step is a **no-op confirmation** (note it in
implementation.md and move on — do not duplicate the existing rule). If the skill has no such enumeration (the
template + anti-pattern enforce it implicitly), add a one-line "required sections" statement that names
`## Skills Used` alongside the others, so the lint has a concrete line to assert against. Keep the existing
`:22-28` table shape and the `None — deviation: {reason}` row form unchanged.

- **Skill:** None (format skill). **TDD:** no (covered by Step 1's structural lint).
- **Dependency:** none (pairs with Step 3).
- **Accept:** `implementation-format` carries an explicit "required sections" statement that names
  `## Skills Used` (or, if one already exists, implementation.md records the no-op confirmation); the existing
  table/anti-pattern is preserved, not duplicated; Step 1's structural lint is green.
- **Confidence:** high.

### Step 5 — Boundary detector flags rogue subagent git writes
**Files (modify):** `plugins/nexus/hooks/scripts/boundary-detector.js`; `plugins/nexus/hooks/hooks.json`
(add `Bash` to the boundary-detector matcher — currently `Write|Edit|MultiEdit|Agent|Task`, `hooks.json:38`).

Extend the detector: when a **subagent** (`agent_type` present) runs `Bash` whose command contains a
**state-changing git write**, append a `violations.log` line (rule: "subagent ran a git write — pipeline agents
never commit; the team lead owns commits (ADR-18, commit strategy ADR-20)"). Preserve all existing
Write/Edit/MultiEdit/Agent/Task behavior **unchanged** (the current Bash early-exit at `boundary-detector.js:87`
is for the no-`file_path` case — the new git branch runs **before** that path for `Bash`); keep
observe-only/fail-silent/zero-footprint-when-clean.

**Canonical write-verb list (identical to Scope, the Step-1 red, and Acceptance below — ONE list, do not
re-curate):** `git commit`, `git add`, `git reset`, `git push`, `git stash`, `git restore`, `git switch`.

**Matching technique — anchored-regex substring, mirroring guard.js (NOT a prefix scan):** match a
state-changing verb **anywhere** in the command with word-boundary anchors, exactly the house style at
`guard.js:137-138` (`/\bgit\s+push\b…/`, `/\bgit\s+reset\s+--hard\b/`). A **prefix** match was the wrong
technique (the plan's prior "match the command prefix" wording is removed): it misses `git status && git commit -m x`
(prefix is `git status`) and `bash -c "git commit …"` (prefix is `bash`) — and a missed write is a silently
undetected breach, the exact #1 vector this gate exists to catch.

**Verified pattern (the architect ran this against the case table below — use it, do not hand-roll a variant):**
```
/\bgit\s+(commit|add|reset|push|stash|restore|switch)(\s|$)/
```
The trailing `(\s|$)` is **load-bearing** — `\bcommit\b` does **NOT** exclude `git commit-graph` (the `-` is a
word boundary, so `\bcommit\b` matches *inside* `commit-graph`). Requiring whitespace-or-end after the verb is
what excludes `commit-graph` while still matching `git add .`, `git add -A`, and `&&`-chained writes. Match
against the **lowercased** command (`boundary-detector.js` should `.toLowerCase()` first, as guard.js does).

Verified case table (the developer's test should assert these exact rows):

| command (lowercased) | match? |
|---|---|
| `git commit -m x` | yes |
| `git status && git commit -m x` | yes |
| `git add -A` / `git add .` | yes |
| `git stash` / `git stash push` | yes |
| `git push origin main` | yes |
| `git restore --staged f` / `git switch -c b` | yes |
| `git commit-graph write` | **no** |
| `git status` / `git diff` / `git log --oneline` / `git rev-parse HEAD` | no |
| `` (empty) | no |

**DO-NOT-FLAG list (explicit carve-outs — these must NOT log):**
- **read-only git:** `status`, `diff`, `log`, `show`, `rev-parse`, `branch` (list), `remote -v`, `fetch` —
  none are in the verb alternation, so they don't match.
- **`git commit-graph`** (maintenance) — excluded **only** by the trailing `(\s|$)`; assert it in the test (a
  `\b`-only pattern false-positives — the architect confirmed this empirically).
- **a Bash command with no git write verb at all** (incl. the empty command `''`) — **zero-footprint no-op**
  (this is what preserves `boundary-detector.test.mjs:76`, HIGH-3).

**Layer reconciliation with Step 6 (required — a missed chain/wrap must still be caught):** this Bash branch is
the **best-effort** detection layer; it cannot see a write that evades the regex (exotic wrapping) or a commit
made by a tool other than Bash. Step 6's **`git log` author check at every verify point** is the **guaranteed
retroactive catch** — any commit whose author is not the team lead since the phase began is unwound there,
regardless of how it was made. State this explicitly in both steps so the determinism does not rest on the
best-effort layer alone. Note also the partial overlap with `guard.js`'s existing `reset --hard` deny
(different layer: guard *prevents* `reset --hard`/force-push in the foreground; this *detects* plain
commits/adds the guard never blocks — logging `reset` here too is acceptable redundancy).

- **Skill:** None (CC hook). **TDD:** yes (Step 1 red → green).
- **Key constraints:** only `agent_type`-present (subagent) calls; only the canonical state-changing verbs via
  anchored-regex substring; the DO-NOT-FLAG carve-outs never log; Bash-with-no-git-verb stays a zero-footprint
  no-op; never blocks.
- **Dependency:** Step 1 (its red test).
- **Accept:**
  1. `hooks.json` boundary-detector matcher includes `Bash`.
  2. A subagent `git commit` (incl. inside an `&&`-chain) appends a rogue-write `violations.log` line; each
     read-only verb, `git commit-graph`, and an **empty** Bash command append **nothing**; existing
     artifact/spawn detection is unchanged.
  3. **The existing `boundary-detector.test.mjs:76` test (a `Bash` event with no git write verb → no log) still
     passes** — Bash-with-no-git-verb remains a zero-footprint no-op (HIGH-3).
  4. Step 1's boundary-detector git test (both directions) is green.
- **Confidence:** medium — the anchored-regex carve-out (write verbs vs read verbs vs `commit-graph`, chains/
  wraps) is the one detail to get exactly right; the canonical list + guard.js house style + Step-6 backstop
  bound the risk.

### Step 6 — Deterministic fabrication void-and-rerun gate
**File (modify):** `plugins/nexus/agents/team-lead.md` — the **Enforcing the Rules** § (the
"Detect at each checkpoint … read `.claude/audit/violations.log` … any new line is a violation to triage"
bullet at `team-lead.md:174`, and the "act with the least intervention" bullet at `:175-179`). Reconcile with
the **Verdict Validation** § above it (`:162-168`) — the matrix is **additive** to those rules, not a replacement.

**Baseline (re-verified):** `:174` is the judgment-framed "triage new violation lines"; `:175-179` is the
existing **least-intervention** ladder (no-impact-fix-and-continue / recoverable-correct-in-place /
unrecoverable-stop-and-retry) and the "**restarting a clean already-correct run is itself a defect**" rule.
The matrix below converts the *triage judgment* into a **fixed action table** while honoring that ladder — it
keeps the bias-to-lightest-action principle, it does not override it.

Add a deterministic action matrix the TL runs at every verify point:

| Detected (a greppable `violations.log` line / `git log` author fact since last checkpoint) | Mandatory action (least-intervention) |
|---|---|
| Developer (or any non-owner role) authored `review.md` / `summary.md` / `plan.md` (boundary-detector ownership line, or the verdict self-contradiction at `:167`) | **VOID** the fabricated artifact (reset to stub / delete), re-run the **real** independent gate (architect done-check / reviewer / TL summary); never accept the self-authored verdict. **Keep the correct code** (recoverable). |
| Subagent spawned a pipeline-role agent (ADR-21 line) | Treat the downstream artifacts that rogue agent produced as fabricated → void + re-run the real gate; keep any correct code. |
| Subagent git write (Step 5 rogue-write line) **OR** a commit whose author is not the team lead since the phase began (the `git log` check below) | **Unwind** (`git reset` to the last team-lead commit), re-commit under team-lead ownership after the real gates pass (ADR-18: pipeline agents never commit; ADR-20: 2-commit team-lead-owned strategy). |
| Skill-conformance Fail (Step 3) in the done-check verdict | Bounce to developer (Fail); do **not** advance to Step 2 review. |

**The `git log` author check is the guaranteed retroactive catch (reconciles with Step 5).** Step 5's Bash
branch is best-effort and can miss an exotically-wrapped or non-Bash commit; at **every verify point** the TL
also runs a `git log` author check since the phase began — any commit not authored by the team lead is unwound
per row 3, **regardless of how it was made**. This is the determinism backstop; the Bash branch is the early-
warning layer.

State the principle explicitly (the "least-intervention" ruling already used in the Pass5/VWH recoveries, and
the existing `:179` "don't restart a clean run" rule): keep correct *code*, void fabricated *gates*, re-run the
real ones; the verdict an agent wrote about its own work is never trusted; but a collapse that cost no decision
(clean plan, zero open questions) is noted for the learner, not cause to restart. Keep the existing
"record voided gates + feed the learner" shutdown behavior.

- **Skill:** None (agent definition). **TDD:** no.
- **Key constraints:** the action matrix is mandatory, not discretionary; recoverability is the design basis
  (code kept, gate re-run); it is **additive to** and honors the existing Verdict Validation (`:162-168`) +
  least-intervention (`:175-179`) rules, not a replacement; the `git log` author check is the guaranteed catch.
- **Dependency:** Steps 3 (skill-conformance Fail), 5 (rogue-write line).
- **Accept:** `team-lead.md`'s Enforcing-the-Rules § carries the action matrix as a deterministic verify-point
  gate; each row names the trigger (a greppable log/`git log` fact) and the mandatory action; the `git log`
  author check is named as the guaranteed catch reconciling Step 5; the prose "triage" at `:174` is upgraded to
  the matrix (the least-intervention ladder at `:175-179` is preserved, referenced, not deleted).
- **Confidence:** medium — wording must reconcile with the existing Verdict Validation + least-intervention +
  "never wedge an unattended run" rules; the matrix is additive to those.

### Step 7 — Document the logs + gates
**File (modify):** `plugins/nexus/rules/agents-workflow.md`.

Document `.claude/audit/skill-invocations.log` (what writes it, what consumes it) and the two gates
alongside the existing `violations.log` description, so every agent shares one model of the audit substrate.
Name the detect-then-gate principle once.

- **Skill:** None (rules doc). **TDD:** no.
- **Dependency:** Steps 2, 3, 5, 6.
- **Accept:** `agents-workflow.md` describes both logs + both gates; no dangling reference to a log that no
  script writes.
- **Confidence:** high.

### Step 8 — Propose ADR-24 (owner ratifies)
**File (modify):** `docs/architecture/README.md` — **propose** ADR-24 ("Skill invocation is a logged, gated
fact; gate fabrication is deterministically voided") and note that the fabrication gate's determinism
**extends ADR-18/21**. The architect proposes; the owner ratifies — do **not** silently finalize the ADR
text as decided. Flag it for the user/team-lead in the handback.

- **Skill:** None (ADR proposal). **TDD:** no.
- **Dependency:** Steps 2–7 (the ADR records what they implement).
- **Accept:** a proposed ADR-24 entry exists in the register (clearly marked proposed/owner-ratify), with the
  ADR-18/21 extension noted; no existing ADR is silently rewritten.
- **Confidence:** high.

### Step 9 — Release (MINOR) + regenerate twins
**Files:** `plugins/nexus/.claude-plugin/plugin.json` + `CHANGELOG.md` (via `bump-plugin.mjs --minor`);
regenerated `plugins/nexus/commands/*.md` (`gen-commands.mjs nexus` — architect + team-lead changed);
the `omni` twin (`gen-omni.mjs`).

New capability (two new enforcement gates) → **MINOR** (owner-escalated per the release policy; the tool
proposes PATCH by default). Run the bump in the **same commit** as the changes; regenerate the commands
after the agent-doc edits; regenerate the `omni`/`omni-dotnet` twin so its versions ride along. Confirm
`plugin-release-check.yml` (the behavior-surface bump backstop + the new lints) passes.

- **Skill:** Follow `release-plugin` (ADR-9 flow). **TDD:** no.
- **Dependency:** Steps 1–8 (everything shippable).
- **Accept:** `plugin.json` MINOR-bumped + CHANGELOG entry; `gen-commands.mjs nexus` re-run with no stray diff
  (architect + team-lead changed); **`gen-omni.mjs` re-run and the `omni` twin's `hooks.json` carries the new
  `skill-tracker` entry + the boundary-detector `Bash` matcher edit** (the new hook + matcher are the at-risk
  artifacts — assert the twin round-trips them, not just that it ran); the full suite green under the canonical
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (incl. Step 1's now-green reds); one commit carries
  the change + bump.
- **Confidence:** high.

---

## Cross-Service / Cross-Repo Changes

- **sprint-rituals (separate, not this plan):** #5 dangling `engineering-discipline.md` — repoint
  ADR-003 + backlog citations (or vendor the rule). Owner-handed; tracked separately.
- **Consumer install (ops, not code):** the #3 relay fix is in 1.7.x already — after this release, the
  consumer must `/plugin update` to pick up *both* the relay fix and these gates (version-keyed cache;
  a stale install gets none of it). The validation run (below) must be on the updated install.

## Testing Strategy

Tests-first per the repo convention (Step 1). The JS units (skill-tracker, boundary-detector git branch) live
in repo-root `tests/unit/` and run under the canonical CI gate
`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` (glob form — the bare-dir form regressed on Node ≥22;
`plugin-release-check.yml:58`); the format requirement is a `tests/lint/` structural lint. **Live validation
(owner, last):** one real
pipeline feature on the updated install that **deliberately** (a) has a developer attempt a no-questions
self-advance + a gate write → confirm the void-and-rerun fires, and (b) skips a mapped skill → confirm the
done-check Fails on the log. A clean happy-path run proves nothing (cross-cutting acceptance:
"guardrails proven to fire, live").

## KB Impact

None — no `docs/kb/` in this repo. The audit-substrate model is captured in `agents-workflow.md`
(Step 7, numbered) and ADR-24 (Step 8, numbered), not a KB entry.

## Open Questions

None — the four forks (plan-first, one release, #5 out-of-scope, critic review) were decided with the user
this session.

---

## Plan Review

**Review mode:** critic, code-grounded — **ran 2026-06-13**, verdict REVISE
(`docs/specs/adhoc-PipelineGatesHardening/delivery/review-critic.md`). This revision re-grounded Steps 1-6 +
Context + Scope against the on-disk tree (the critic's systemic root cause: the prior draft was written against
a historical finding-doc, not the shipped tree) and resolved every finding:

| Finding | Resolution |
|---|---|
| **CRITICAL-1** — `## Skills Used` + done-check already ship | Context #2, Scope, Steps 3-4 rewritten to the real 1.5.0 baseline; added the **Quantified Gate-A delta** table; Step 4 is now promote-if-not-already (verify-first), Step 3 re-points the existing `architect.md:230` check. |
| **HIGH-2** — git verb list under-specified/inconsistent | One **canonical verb list** (+ stash/restore/switch) in Scope/Step5/Step1/Accept; **anchored-regex substring** matching (guard.js house style) replaces the prefix scan; explicit **DO-NOT-FLAG** list (read verbs + `commit-graph`); Step5↔Step6 reconciled (best-effort Bash branch + guaranteed `git log` author catch). |
| **HIGH-3** — Step 5 regresses `boundary-detector.test.mjs:76` | Step 5 acceptance + Step 1 red now preserve the Bash-no-git-verb zero-footprint no-op (both directions asserted). |
| **MED-4/5/6** | Dedupe-vs-audit-logger note (Step 2); `|| 'main'` tail (Step 2 + Code-grounded facts); `{token, session}` added to the log line and Step 3 scopes by the `.pipeline-state` token (read-tracker round-keying). |
| **LOW-7** | Context line-ref tightened to `51-101`. |
| Gap: platform `tool_name` | Step 2 = **highest-risk live-verify gate**; Step 2 Confidence dropped `high → medium`. |
| Gap: all-`None` plans | Step 3 preserves the all-`None` exemption explicitly. |
| Gap: gen-omni round-trip | Step 9 asserts the twin's `hooks.json` carries the new entry + matcher edit. |
| Gap: harness invocation | Pinned to the canonical glob `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`; test paths corrected to repo-root `tests/`. |

9 steps, no split (the dependency chain — log → gate → docs → ADR → release — is one sequence; a seam split
would yield <2 independent steps). **Step 8 stays proposed/owner-ratify** — ADR-24 is not silently finalized.
