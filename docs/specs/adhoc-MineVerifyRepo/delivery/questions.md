# mine-verify-repo — Questions

## Q1: Step 3 tier-split — `bump-plugin.mjs --minor` is global, but the plan wants nexus=MINOR + nexus-dotnet=PATCH
**From:** developer
**To:** architect
**Status:** Resolved (team-lead, 2026-07-04)
**Step:** Step 3 — Release both plugins

**Answer (team-lead):** Option 2 ownership — the differentiated bump is team-lead work at commit time
(release/commit boundary is team-lead-owned per ADR-18/20; bump-plugin must also run once after ALL
edits land, which a mid-implementation developer run would violate). Executed via Option 1's mechanic:
ran `node scripts/bump-plugin.mjs` once (both → PATCH: nexus 1.21.2, nexus-dotnet 1.3.1), then
hand-escalated nexus `plugin.json` 1.21.2 → **1.22.0** + rewrote its CHANGELOG entry to a `[1.22.0]`
MINOR ("new capability: mine-verify-repo skill"). nexus-dotnet stayed **1.3.1** PATCH. Omni twin
regenerated (`gen-omni`); selfcheck 5/5. Developer correctly ran no bump and no commit.
**File:** `scripts/bump-plugin.mjs`, `plugins/nexus/.claude-plugin/plugin.json` (1.21.1), `plugins/nexus-dotnet/.claude-plugin/plugin.json` (1.3.0)

**Context:**
Step 3 says "Follow release-plugin. nexus gets MINOR (owner-escalated); nexus-dotnet gets the
default PATCH … Run the bump exactly once." I read `scripts/bump-plugin.mjs` to plan the invocation.
The `--minor` flag is a **global** override (line 40: `OVERRIDE_TIER = has('--minor') ? TIER.MINOR : null`;
lines 165–173: the loop raises **every** changed plugin whose tier > NONE to `OVERRIDE_TIER`). There is
no per-plugin tier flag. Step 2 edits `plugins/nexus-dotnet/skills/improve-architecture/SKILL.md`, so
**both** plugins are in the change set. Therefore a single `node scripts/bump-plugin.mjs --minor` run
would bump nexus 1.21.1→1.22.0 **and** nexus-dotnet 1.3.0→1.4.0 (MINOR) — not the PATCH the plan wants
for nexus-dotnet. A single default run bumps both PATCH (nexus 1.21.2, wrong tier for nexus). The tool
cannot express "nexus MINOR + nexus-dotnet PATCH" in one flagged run.

Complicating factors: (a) the developer never commits and does no git writes (stash/checkout/reset
forbidden) — the clean two-pass `--staged` approach needs an inter-pass **unstage** (`git restore
--staged`), a git write that sits better with the committer; (b) the plan already defers the omni-twin
regen + commit to commit-time (team-lead).

**Question:**
How should Step 3 produce nexus=MINOR (1.22.0) + nexus-dotnet=PATCH (1.3.1)? Three viable paths:
1. **Tool default + hand-escalate nexus (developer-executable).** Run `node scripts/bump-plugin.mjs`
   once (both → PATCH: nexus 1.21.2, dotnet 1.3.1), then hand-edit `plugins/nexus/.claude-plugin/plugin.json`
   1.21.2→1.22.0 and rewrite that CHANGELOG entry header to `[1.22.0]` MINOR ("new capability:
   mine-verify-repo skill"). Leaves dotnet at PATCH 1.3.1. Editing the generated CHANGELOG entry is
   already part of the release-plugin flow (step 3 of its procedure).
2. **Defer the bump to the team-lead at commit time.** Developer finishes Steps 1–2; the team-lead
   runs the differentiated bump (two `--staged` passes, unstaging between) as part of the same-commit
   release, alongside the already-deferred omni-twin sync. Developer records the intended versions.
3. **Two `--staged` passes by the developer**, if the developer is permitted the inter-pass
   `git restore --staged` (a git write currently forbidden by the developer's hard rules).

**Recommendation:** Option 1 — one tool run for the mechanical bulk, then a deterministic 2-line
hand-escalation of nexus to MINOR. It is fully developer-executable (no git writes), produces the
plan's exact target versions, and the CHANGELOG hand-edit is already sanctioned by release-plugin. If
the architect prefers the release boundary stay wholly with the committer, Option 2 is the clean
fallback.
**Confidence:** medium — the *problem* is confirmed by reading the tool source (`--minor` is global,
no per-plugin flag); the *choice* among options 1/2/3 is a workflow-boundary judgment with a real
trade-off (hand-edit vs. defer-to-committer), so it wants the architect's call. Does not block Steps
1–2, which are unambiguous.
