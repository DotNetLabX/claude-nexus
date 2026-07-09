# Codex Cross-Check — adhoc-ConformanceReviewer (Step 2, round 1)

**Runtime:** `codex exec` (gpt-5.4, read-only sandbox, reasoning effort xhigh), dispatched by the team lead as the Standard+Codex independent second opinion. Codex could not write this file itself (read-only sandbox) — the team lead persisted its verdict + findings here verbatim per the Relay Contract.

**VERDICT: NO-GO**

## Findings (as returned by Codex, with team-lead reconciliation)

Each finding was independently verified by the team lead against live source before being carried into the developer fix-list (finding-by-finding reconciliation, per the Standard+Codex rule — Codex's verdict is not trusted wholesale).

1. **[HIGH] `plugins/nexus/agents/team-lead.md:397`** — The PR-tail conformance bullet triggers "with `prConformance: true` … **or, when the key is absent, offered once, attended**," but 4b (`:231`) captures `prConformance` (default `false`) under "**missing key → its default applies, never ask**." So an absent key is resolved to `false` without asking before the tail runs — the "offer once when absent" branch is **unreachable**, and it also conflicts with spec **AC-D.3** ("with the key off… the tail behaves exactly as today"). **Team-lead: CONFIRMED real** (read `:231` + `:397`). Blocking (Codex HIGH).

2. **[MEDIUM] `plugins/nexus/skills/conformance-review/SKILL.md:164`** — The fail-closed gate says an uncalibrated PR-tail run (absent/UNGRADED/FAIL report) "**runs calibration-only**," which reads as auto-launching the K-diff repo-history replay mid-PR-closure — surprising and expensive, and in tension with the operator-owned calibration carve-out. Spec **AC-C.2** says the skill "**refuses PR posting** until a calibration report exists and the owner recorded a pass" — decline-and-inform, not auto-replay. **Team-lead: CONFIRMED** (read `:158–170`). Clarify.

3. **[MEDIUM] `plugins/nexus/skills/conformance-review/SKILL.md:119`** — `prConformanceCap` is described "config-overridable (default 5)" but the skill never says **where the runtime reads the value** (top-level key in `.claude/nexus-agents.json`, or the value the team-lead passes at dispatch). As written the key has no defined runtime effect and silently stays at 5. **Team-lead: CONFIRMED** (read `:115–122`; `prConformanceCap` is a top-level 4b key per team-lead.md `:231`). Wire the read path.

4. **[MEDIUM] `plugins/nexus/skills/conformance-review/SKILL.md:201`** (recipe ~`:186`) — The `@@ -a,b +c,d @@` prose correctly frames `c..c+d-1` as the *validity range*, but the `review.json` sample puts `"line": {c..c+d-1}` (a range) into `comments[].line`, which the reviews API requires to be a **single resolved new-side line**. Literal use, or a one-line hunk, yields invalid/misplaced comments. **Team-lead: CONFIRMED** (read the sample at `:201`). Fix the sample to a single resolved line within `c..c+d-1`.

## Note (not a Codex finding)
The nexus reviewer (`review.md ## Step 2`) returned **APPROVED** (no CRITICAL/HIGH; one sub-cutoff LOW: no explicit prompt-injection guardrail). The reviewer verified diff byte-stability + lint/tests; Codex caught the semantic/operational defects above. The merged team-lead verdict is **REQUEST CHANGES** — Codex HIGH #1 blocks; the three MEDIUMs bundle into the same fix cycle. Codex runs round-1 only; the cycle-2 re-review is reviewer-only.
