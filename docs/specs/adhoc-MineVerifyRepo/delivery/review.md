# mine-verify-repo — Review

## Step 1 — Done-Check

**Pre-commitment predictions (made before reading implementation.md):**
1. Skill-log conformance for Step 1's mapped `evaluate-skill` (non-None Follow) — risk it's absent under the developer-run token.
2. Step 1 artifact completeness — the AC-3 grep-checkable binding obligations and AC-7 lens/disposition terms may not all be present in the actual SKILL.md.
3. Step 2 scope collision — the two surgical `mine-verify-cover` edits vs. the concurrent RulesRegistry section.

All three predictions checked out clean (see notes).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Author the skill | Implemented | `plugins/nexus/skills/mine-verify-repo/SKILL.md` (243 L) + `references/metric-layer.md` (123 L) exist. `user-invocable: true` at SKILL.md:4. Contracts C1–C6 present (headings at :99/:119/:132/:149/:163/:182). **AC-3** grep-checkable obligations verified live: `forbidden` on the miner estimate-ban (:199–200), skeptic reasoning-only ban (:201–202), `dropped by the orchestrator` structural enforcement (:204). **AC-7** verified live: four lenses code-quality/architecture/performance/test-coverage (:38–39,:57–61), disposition enum `accepted \| by-design \| deferred \| resolved \| superseded` (:125), refresh outcomes resolved/still-active/superseded (:175–178). evaluate-skill gate ran (findings doc `docs/skill-evals/2026-07-04-mine-verify-repo.md`, 99 L; F1/F2 fixed, F3/F4 recorded). |
| 2 — Cross-reference updates (2 files, surgical) | Implemented | `mine-verify-cover/SKILL.md`: `mine-verify-repo` relationship-table row (:412) + the does-NOT "graph-scoped targeting" bullet re-pointed (:329). `improve-architecture/SKILL.md`: supersession blockquote referencing `mine-verify-repo` + ADR-46 (:10). `git status` confirms only these two files modified — no collision with the concurrent RulesRegistry section (Satisfies ADR-46). |
| 3 — Release both plugins | Deviated (valid reason) | Plan-sanctioned non-execution: Q1 team-lead resolution reassigns release mechanics to the team lead (ADR-18/20) — the developer runs no `bump-plugin.mjs` and no commit. **RELEASE OWED at commit (team-lead):** tool-default bump (both → PATCH) then hand-escalate nexus → **1.22.0** MINOR ("new capability: mine-verify-repo skill"); nexus-dotnet → **1.3.1** PATCH; regenerate omni twin; re-check branch immediately before committing (shared tree). Target end-state nexus 1.22.0 / nexus-dotnet 1.3.1. Documented, not executed = correct done state. |
| 4 — KG pilot run | Deviated (valid reason) — operator-owed | Plan marks `Owner: operator`, "not executable in-pipeline". **OPERATOR ACTION REQUIRED** fully documented: run the shipped skill against `d:\src\knowledge-gateway` (preflight: Code Maat JVM + lizard, or accepted fallback), capture bot-exclusion count / degraded signals / mined→confirmed survival / registry delta, flow ≥1 accepted row to a KG backlog row, record payoff baseline; skill-defect findings return as KG plugin feedback. A PASS on Steps 1–3 does **not** prove AC-2/4/5/6 — those land only at this run. Documented, not executed = correct done state. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`):**
- Scoped to this developer run (agent `developer`, token `developer:implement`, session `2c1f3136-…`).
- Step 1 mapped `evaluate-skill` (non-None Follow) → logged: `nexus:evaluate-skill @ 2026-07-04T13:52:42Z, agent=developer, token=developer:implement`. Final-segment match (`nexus:evaluate-skill` → `evaluate-skill`). PASS.
- Steps 3/4 map `release-plugin` / `mine-verify-repo` but carry documented deviation reasons in `## Skills Used` (Q1 team-lead resolution; operator-owed) — not a Fail per the documented-deviation exemption.
- `## Skills Used` section present; no self-reported invocation absent from the log (no fabrication).

**`Satisfies:` existence cross-check (where present):** AC-1..AC-7 all exist in `definition/tech-spec.md` (:155–173); ADR-46 referenced. Cited referents are real. Existence-validation only — not a gate.

**Observation (non-blocking, not a finding):** `questions.md` Q1 remains `Status: Open` with an empty Answer block, though its resolution is recorded in implementation.md and confirmed by the team-lead handoff. Artifact-hygiene only — the resolution is not lost; no effect on the verdict. Team lead may close Q1's Answer block at commit.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-04*

## Step 2 — Code Review

## Reviewed By
reviewer (nexus:reviewer) — cycle 1 initial review + cycle 1 re-review (fix verification)

## Verdict: APPROVED

**Cycle 2 (re-review) note:** the cycle-1 HIGH (Section 2 bot-filter omission) and the two Codex-found
MEDIUMs (wrong fallback pointer; missing Windows/Git-Bash line-ending note), reconciled into
`review-merged-cycle1.md`, were verified against live source in `metric-layer.md` — all 3 genuinely
applied, no regressions in adjacent sections. See `## Fix Cycle 1 — Verification` below for the
line-by-line check. No CRITICAL/HIGH remains open → APPROVED per the verdict gate.

## Pre-commitment Predictions
1. Since this is a method-text/runbook slice with no test suite, expected the highest-yield area to be
   internal consistency between the tech-spec's contracts and their transcription into SKILL.md —
   predicted transcription drift or a dropped nuance. **Found clean** — C1–C6 transcribe faithfully,
   AC-3/AC-7 grep-checkable terms all present and verified live.
2. Expected the two surgical cross-reference edits (mine-verify-cover, improve-architecture) to risk
   scope creep into the concurrently-edited RulesRegistry section of mine-verify-cover. **Found
   clean** — `git diff` shows exactly the two described hunks, nothing else touched.
3. Expected the `references/metric-layer.md` runbook — the one place with literal, copy-pasteable
   shell commands — to be the highest-risk spot for a correctness bug, since "exact commands, never
   estimate" is the family's whole ethos and there's no test to catch a broken command. **Confirmed** —
   found a real inconsistency (see Finding 1): the bot filter that Section 1 mandates for "every log
   below" is not present in Section 2's shown command, even though Section 2's output directly feeds
   the hotspot filter (Section 6) that AC-2 requires be bot-filtered.

## Findings

### [HIGH] — RESOLVED (cycle 1 re-review) — Section 2's "hotspot log" command omits the mandatory bot filter it claims to have applied
**File:** `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:53-62` (original); now `:59-70` after the fix
**Origin:** implementation
**Resolution verified:** Section 2's command now reads (live source, `:64-66`):
```
git log -M -C --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' \
  --pretty=format:'commit %H %ct' --reverse -p
```
— the same author-negative-lookahead clause Section 3 uses, in the same position. The heading prose
now reads "bot-filtered, same author lookahead as Section 1" (`:61-62`), so the claim and the command
agree — the contradiction is gone. Confirmed by direct read of live source, not from the developer's
claim alone. No stale "Section 5"-style dangling reference or syntax issue introduced by the edit
(checked the whole file's Section-N cross-references post-fix — all resolve correctly). **Fresh
`skill-lint.mjs` rerun is clean** (see Evidence). Fix is genuine and complete.
**Issue:** Section 1 ("Bot filter (mandatory FIRST step)") states: "Exclude them when generating
**every log below**, with a Perl-regex negative lookahead on author" (line 44), and shows the filter
clause:
```
git log --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' ...
```
Section 3 (Code Maat metrics) correctly follows this — its shown `git log ... > repo.log` command
(lines 69-71) includes the same `--perl-regexp --author=...` clause verbatim.

Section 2 ("Hotspot log (MSR 2026 method)") does not. Its shown command is:
```
git log -M -C --pretty=format:'commit %H %ct' --reverse -p
```
— no author filter — yet the very next line claims "Count modifications per file over the
**bot-filtered** history" (line 61), and this count is "the modification-count input to the hotspot
filter (Section 6)" — one of the two conditions in C1's hotspot filter (`> μ+3σ AND > 1 change/month`),
which is exactly the signal AC-2 requires to be produced "from free tooling only" with "the run report
stat[ing] the bot-exclusion count." An agent following this runbook literally (the stated mode of
operation for this must-reproduce family — "never estimate, run the exact thing") will run the shown
command as-is and get an unfiltered modification count feeding directly into the hotspot ranking,
silently reintroducing the exact bot-contamination problem (73.9% of hotspot commits bot-generated,
cited in this same file's own Section 1) that the mandatory-first-step bot filter exists to prevent.
This is not a hypothetical — this is the literal command shown for copy-paste, and it contradicts the
file's own universality claim ("every log below") one section later.

Notably, `evaluate-skill`'s Layer 2.4 pass ("followable cold: exact commands + named constants in the
runbook") signed this off as clean; this inconsistency was missed there too.
**Fix:** Add the same `--perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))'` clause
to Section 2's shown command (matching Section 3's pattern), or explicitly note that the filter from
Section 1 must be spliced into this command before running — either resolves the contradiction between
"every log below" and the shown example.
**Confidence:** 88/100

## Fix Cycle 1 — Verification

All 3 items from `docs/specs/adhoc-MineVerifyRepo/delivery/review-merged-cycle1.md` (my HIGH + 2
Codex-originated MEDIUMs, team-lead-reconciled), scoped entirely to
`plugins/nexus/skills/mine-verify-repo/references/metric-layer.md`. Verified each against live source
(not from `implementation.md`'s Fix Cycle 1 table alone):

| # | Sev | Finding | Verified fix (live source) |
|---|-----|---------|------------------------------|
| 1 | HIGH | Section 2 hotspot-log command missing the bot-author filter | **RESOLVED** — see Findings above. Command now carries the filter clause; prose matches. |
| 2 | MEDIUM | Preflight's Code-Maat-absent fallback pointed to "Section 5" (the signals table) instead of "Section 3" (the actual git-only fallback paragraph) | **RESOLVED** — `metric-layer.md:27-29` now reads "...with the git-only fallback method in Section 3 (the 'git-only fallback' paragraph)...". Cross-checked: the git-only fallback paragraph does live in Section 3 (`:97-99`). A full-file grep for `Section 5` returns zero hits — no dangling stale pointer left anywhere. |
| 3 | MEDIUM | No Windows/Git-Bash precondition for Code Maat log generation (CRLF risk on the KG pilot's Windows target) | **RESOLVED** — a "Windows note" paragraph added to the Section 0 preflight (`:35-38`) and a matching inline note directly after the Section 3 log-generation command (`:81-83`). Both instruct generating the log via Git Bash / ensuring LF endings before invoking Code Maat. Additive only — the underlying command syntax is unchanged, confirmed by diff-reading against the pre-fix version. |

**Regression check (adjacent areas, not just the changed lines):** re-read the full `metric-layer.md`
post-fix (135 lines, up from 124 pre-fix — the +11 matches the additive-only claim). All `Section N`
cross-references in the file (`:28,62,74,108,116`) now resolve to the correct section — no fix
introduced a new dangling pointer. `plugins/nexus/skills/mine-verify-repo/SKILL.md` is unchanged
(still 243 lines) — confirms the fix cycle stayed scoped to the one reference file, as
`implementation.md`'s Fix Cycle 1 entry claims. No other tracked file shows a diff for this cycle
(`git status`/`git diff --stat` re-run fresh this cycle).

## Positive Observations
- C1–C6 contracts transcribe faithfully from the tech-spec into SKILL.md — verified by direct
  side-by-side read, no drift found (signals, hotspot filter thresholds, disposition enum, refresh
  outcomes, registry invariants all match verbatim or with equivalent-meaning elaboration).
- AC-3 and AC-7's grep-checkable obligations are genuinely present and grep-checkable, not just
  claimed: re-ran the greps myself (`forbidden` ×4, `dropped by the orchestrator` ×1, the four lens
  names, the global-pass catalog terms, the disposition enum verbatim, the refresh triad) — all landed
  at the lines implementation.md and the Step 1 done-check cite.
- The two cross-reference edits are minimal and precise: `mine-verify-cover/SKILL.md`'s relationship
  table row and does-NOT bullet, and `improve-architecture/SKILL.md`'s supersession blockquote, each
  read accurately against what `mine-verify-repo` actually ships (no overclaiming — e.g. the
  improve-architecture note correctly scopes the supersession to *discovery*, leaving the
  architect→backlog flow for already-known items untouched).
- `git diff HEAD` on both cross-reference files shows exactly the two described hunks each — no
  collision with the concurrently-edited RulesRegistry section in `mine-verify-cover/SKILL.md`, matching
  the plan's explicit scoping instruction.
- Fresh `skill-lint.mjs` reruns on all three touched skills (`mine-verify-repo`, `mine-verify-cover`,
  `improve-architecture`) are clean (`OK`) — not just trusted from the developer's evaluate-skill doc.
- `evaluate-skill` findings F1 (Safety-rails-vs-C6 duplication) and F2 (uncited Code Maat `-a`
  vocabulary) are both genuinely fixed in source, verified directly: Safety rails is now a pointer to
  C6, and the citation line is present in `metric-layer.md:73-75`.
- Plugin versions (`plugins/nexus/.claude-plugin/plugin.json` = 1.21.1,
  `plugins/nexus-dotnet/.claude-plugin/plugin.json` = 1.3.0) are correctly untouched, matching the
  plan-sanctioned Step 3 deviation (release is team-lead-owned, out of this review's scope).

## Gaps
- `metric-layer.md` Section 3 has the agent run Code Maat's `-a authors` and `-a age` analyses, but
  neither is referenced anywhere downstream — not in the C1 Signals list (tech-spec and SKILL.md both
  list only ownership / churn / churn×complexity / coupling), not in the Section 6 hotspot filter, and
  not in C5's triage/refresh text. It's unclear whether these are meant to feed the human triage
  session as qualitative context or are simply unused output. Confidence this is a real gap (vs.
  intentional extra context) is below the findings cutoff — moved to Open Questions.
- The relationship between "top-N hot areas" (C6's spend cap, ranked selection) and "the hotspot
  filter" (C1/Section 6's binary `> μ+3σ AND > 1 change/month` threshold) is not fully disambiguated:
  it's unclear whether a run always scans exactly N areas (ranked, regardless of threshold) or only
  those areas that also pass the binary filter (which could yield fewer than N, or zero, on a quiet
  repo). This ambiguity is inherited verbatim from the tech-spec (not introduced by this
  implementation) — a design-origin question, not an implementation defect. Low confidence it causes a
  real problem at the pilot; moved to Open Questions rather than asserted as a finding.

## Open Questions
- Are Code Maat's `authors`/`age` analyses (metric-layer.md:81-82) intended to feed anything in this
  slice, or are they informational only? If informational, a one-line note next to Section 3 would
  prevent a future reader from assuming they're wired into the hotspot score.
- Does "top-N hot areas" (C6) mean rank-N regardless of the Section 6 binary filter, or the
  intersection of both? Worth a one-line clarification before the AC-6 pilot run, since a quiet repo
  could otherwise scan 0 areas silently (the method's own "never silently green" principle would want
  this state to be reported explicitly either way).
- `questions.md` Q1 (Step 3 tier-split mechanics) is still `Status: Open` with an empty Answer block,
  though its resolution is recorded in implementation.md's Deviations section and confirmed by the
  Step 1 done-check. Same non-blocking artifact-hygiene observation the architect already noted — Step
  3 mechanics are out of this review's scope regardless.

## Carry-Over Findings — confirmed/refuted
| Title | Disposition | Evidence |
|-------|-------------|----------|
| AC-3 grep-checkable terms present | **Confirmed** | Fresh grep: `forbidden` at SKILL.md:102,135,200,202; `dropped by the orchestrator` at :204. Matches the carry-over's cited lines. |
| AC-7 grep-checkable terms present | **Confirmed** | Fresh grep: four lens names (:38-39,57-61), global-pass catalog terms (:73-75), disposition enum verbatim (:125), refresh triad resolved/still-active/superseded (:45,175-179). |
| Step-2 diff intentionally scoped | **Confirmed** | `git diff HEAD` on `mine-verify-cover/SKILL.md` shows exactly 2 hunks (relationship-table row + does-NOT bullet); no RulesRegistry-section overlap. |
| evaluate-skill F3/F4 recorded-not-fixed | **Confirmed, no objection** | Read `docs/skill-evals/2026-07-04-mine-verify-repo.md` F3/F4 rationale directly — both are genuinely slice-2/Substrate-inherited concerns (fan-out receipt contract, lessons routing), not defects of this slice's scope. Reasonable to record rather than fix. |

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| skill-lint (mine-verify-repo) | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-repo` | `OK    mine-verify-repo` |
| skill-lint (mine-verify-cover) | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-cover` | `OK    mine-verify-cover` |
| skill-lint (improve-architecture) | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-dotnet/skills/improve-architecture` | `OK    improve-architecture` |
| Diff scope (mine-verify-cover) | pass | `git diff HEAD -- plugins/nexus/skills/mine-verify-cover/SKILL.md` | 2 hunks, matches plan Step 2 exactly |
| Diff scope (improve-architecture) | pass | `git diff HEAD -- plugins/nexus-dotnet/skills/improve-architecture/SKILL.md` | 1 hunk (blockquote insert), matches plan Step 2 exactly |
| Line-count cross-check | pass | `wc -l plugins/nexus/skills/mine-verify-repo/SKILL.md references/metric-layer.md` | 243 / 123, matches implementation.md's claim |
| Plugin version untouched | pass | `grep version plugins/nexus/.claude-plugin/plugin.json plugins/nexus-dotnet/.claude-plugin/plugin.json` | 1.21.1 / 1.3.0 — matches plan-sanctioned Step 3 deviation |
| Build | N/A | — | Method-text slice, no executable code (plan §Testing Strategy) |

### Cycle 1 re-review (fix verification) — fresh evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| skill-lint (mine-verify-repo, post-fix) | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-verify-repo` | `OK    mine-verify-repo` |
| Fix 1 live-source check | pass | `Read plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:59-70` | Section 2 command carries `--perl-regexp --author='^(?!.*(\[bot\]\|dependabot\|renovate\|autoroll))'`; heading states "bot-filtered, same author lookahead as Section 1" |
| Fix 2 live-source check | pass | `Read metric-layer.md:11-38` + `grep -n "Section 5" metric-layer.md` | Pointer now reads "Section 3 (the 'git-only fallback' paragraph)"; zero remaining hits for the stale "Section 5" pointer |
| Fix 3 live-source check | pass | `Read metric-layer.md:35-38,81-83` | Windows/Git-Bash LF note present at both the Section 0 preflight and inline after the Section 3 log-gen command |
| Scope check | pass | `git status --short` + `wc -l SKILL.md` | Only `metric-layer.md` changed this cycle (124→135 lines, +11 additive); `SKILL.md` unchanged at 243 lines; no other tracked file diffed |
| Cross-reference regression check | pass | `grep -n "Section 5\|Section 3\|Section 2\|Section 1" metric-layer.md` | All 5 `Section N` references in the post-fix file resolve to the correct section; none dangling |

*Status: COMPLETE — reviewer, 2026-07-04 (cycle 1 re-review)*
