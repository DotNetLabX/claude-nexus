# F19-DotnetSkillCoverageWave — Questions

## Q1: Plan review mode
**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis

**Context:** F19 edits 10 shipped nexus-dotnet skills (shared/external artifacts in the plugin
source repo). The architect instructions mandate recommending a code-grounded review for
shared-artifact passes: a doc-only critic is structurally blind to the defect classes that matter
here (stale refs vs live skill text, enumeration echoes, cross-skill pointers).

**Question:** Which review runs on the plan before implementation?

**Recommendation:** Code-grounded critic (Mode 2 against the backlog row + P1–P10 + F18 §4, reading
the live skill files) — not a doc-only pass.
**Confidence:** high — the shared-artifact mandate names this exact case; the evidence base (6-HIGH
vs GO on the same plan) is cited in the architect instructions.

### Answer
User (AskUserQuestion, 2026-07-23): **Code-grounded critic.** Status → Answered.

## Q2: Execution mode after plan approval
**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis

**Context:** F19 is 10 repetitive prose passes with a deterministic gate (skill-lint W5/W6 + repo
lint suite) and a shipped recipe (`edit-shipped-plugin-skill`) governing every pass. F18 ran the
architect-led fast lane successfully on a similar (smaller) shipped-prose change. The full team
pipeline adds a fresh-context Step-2 reviewer on the diff.

**Question:** Architect-led fast lane (one developer spawn, prose-angle code review baked into the
dispatch, my done-check, lane commit) — or the full team pipeline?

**Recommendation:** Architect-led fast lane. The work is recipe-governed and lint-gated; the lane's
docs-only-diff branch (prose review angles + two general-purpose finder passes) covers the
coherence-drift risk. Fall back to the pipeline if fix rounds exceed the lane's cap.
**Confidence:** medium — 10 skills is larger than the lane's "small feature" framing; a real
trade-off vs the pipeline's independent reviewer.

### Answer
User (AskUserQuestion, 2026-07-23): **Architect-led fast lane.** Status → Answered.

## Q3: Semver tier for the nexus-dotnet bump
**From:** architect
**To:** user
**Status:** Answered
**Step:** Phase 1 analysis

**Context:** Policy: PATCH by default, owner escalates to MINOR for new capability. F19 adds new
decision branches and patterns (policy-based auth branch, minimal-stack branches, localStorage
persistence, extend-existing-slice) across 10 skills. Precedent: 1.4.0 (13-skill feedback apply)
and 1.5.0 (estate consolidation) were both owner-escalated MINOR.

**Question:** PATCH (default) or escalate to MINOR at release?

**Recommendation:** MINOR — the wave adds new branches/variants (capability), matching the 1.4.0
precedent; asking now avoids a stop at lane close.
**Confidence:** medium — defensible as PATCH under "content fixes to existing skills"; the owner
owns this call by policy.

### Answer
User (AskUserQuestion, 2026-07-23): **MINOR.** Owner-ratified escalation, recorded for the release
step. Status → Answered.
