# adhoc-FleetHeartbeatFix — Communication Log

**Branch:** main
**Lane:** solo (discuss-then-implement; no pipeline, no plan/review gate)
**Step:** done
**Solo ID:** ad56948ee028589ab (opus)
**Origin:** fix for the bug root-caused in `docs/specs/adhoc-NexusFleetView/delivery/communication-log.md` Issues Log #6 (heartbeat never writes fleet-state.json — `resolveRoot` reads `workspace.project_dir`, absent from the hook-shaped subagentStatusLine payload).

---

## Message Table

| # | From → To | Phase | Message | Problem |
|---|-----------|-------|---------|---------|
| 1 | user → team-lead | launch | "start solo for this fix if it is small" — assessed small (1 fn + test + SKILL note + PATCH bump). Launching Solo. | — |
| 2 | team-lead → solo | solo:discuss | Discuss the resolveRoot fix; verify `data.cwd` is the right base-hook root field; confirm test + SKILL note + PATCH bump. Discuss-then-STOP. | — |
| 3 | solo → team-lead | solo:discuss | Verdict: proceed (high conf). **`data.cwd` independently confirmed** vs statusline.md + hooks.md common-input-fields. resolveRoot = `workspace?.project_dir || data.cwd`. Key catch: ALL existing heartbeat tests fed `workspace.project_dir` (masked the bug) → adds hook-shaped regression fixture + fixes the "no root" negative to also drop cwd. SKILL activation note. PATCH 1.14.1. 3 files, solo lane. | — |
| 4 | team-lead → solo | solo:implement | Approach confirmed (matches authorized scope, no open decisions). Implement all 4 parts + run unit suite + write implementation.md. NOTE: SendMessage resume drops opus→frontmatter; accepted — impl is mechanical execution of solo's own explicit plan. | resume-model caveat (accepted) |
| 5 | solo → team-lead | solo:implement | Done — 4 parts. resolveRoot = `workspace?.project_dir \|\| data.cwd` + comment rewrite; 2 new hook-shaped tests + negative fixed; SKILL activation note; PATCH 1.14.1; **omni twin regenerated + in sync**. 182/182 (subagent-rows 16/16). impl.md written. No commit. | — |
| 6 | team-lead (self) | close | **Verified:** selfcheck 4/4 (incl. gen-omni twin in-sync), verify-verdict pass, resolveRoot/version confirmed in source. Boundary flags triaged (see Issues). Twin-reality correction (see Issues #3). Commits: nexus fix + omni twin + NexusResearch correction. COMPLETE. | — |

---

## Runtime / Plugin Issues Log

1. **Boundary flag — solo Write to implementation.md (FALSE POSITIVE).** Logged to violations.log as "wrote an artifact whose owner is another role (ADR-18)". implementation.md is solo's *legitimate* deliverable (I assigned it). Same detector class as the FleetView issue #4: ownership matched by exact role, but solo writes implementation.md too. No action — artifact kept.
2. **Boundary flag — solo git write `git stash && validate --strict && git stash pop` (real, self-restored).** Solo stashed to run `--strict` on a clean tree (to isolate pre-existing errors). It's a state-changing git write a subagent shouldn't make (ADR-18), but it round-tripped cleanly — `git stash list` empty, tree intact, no commit, no dangling state → nothing to unwind. Note for learner: solo reached for `git stash` for clean-tree validation; that diagnostic should be team-lead-owned or done without a git write.
3. **CORRECTION — the omni twin is NOT absent; the NexusResearch Q1 "twin absent" premise was a wrong-path error.** `gen-omni.mjs` resolves the twin to `NEXUS/../omni` where `NEXUS` = `dirname(scripts/) = D:/src/claude-plugins/nexus` → twin = **`D:/src/claude-plugins/omni`** (present, separate git repo). NexusResearch Q1 (developer + architect) checked `D:/src/omni` (one level too high) and concluded "absent," deferring the twin regen. The missed tell: NexusResearch selfcheck reported gen-omni `--check` **"drifted"** (= twin exists, out of sync), not "missing". Solo correctly ran `gen-omni` here; the twin is now regenerated and `--check` passes (covering 1.14.0 + 1.14.1). The NexusResearch summary's twin operator-action is therefore RESOLVED, not pending. Team-lead initially mis-doubted solo's correct claim by inheriting the bad premise — settled deterministically by running `gen-omni --check` (exit 0). **Lesson: trust a deterministic check over an inherited prose premise; "drifted" ≠ "missing".**
