# Merged fix-list — cycle 1/3 (reviewer + Codex, reconciled)

**Team mode:** Standard+Codex. Reviewer verdict: REQUEST CHANGES (1 HIGH). Codex verdict: NO-GO.
Reconciled finding-by-finding against live source (`references/metric-layer.md` read in full).
This is the **single consolidated list** for the developer — the developer does NOT read `review.md`
or `review-codex.md` directly.

**PARKED (pacing directive 2026-07-04):** not yet dispatched — waiting for the 5h token window to
reset before the developer fix cycle. On resume: set `.pipeline-state = developer:implement`, dispatch
the developer (fresh opus re-spawn or SendMessage) with this file as the fix scope, `Cycle 1/3`.

## In-scope fixes (all in `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md`)

### 1. HIGH — Section 2 hotspot-log command missing the bot-author filter
- **Location:** `metric-layer.md:57-59` (the `git log -M -C …` block), with the false claim at `:61-62`.
- **Problem:** Section 1 (`:44`) mandates the bot filter on "every log below"; Section 3 (`:69-70`)
  correctly includes it. Section 2's command omits it, yet `:61-62` states the count is over "the
  bot-filtered history." That modification count is the input to the Section 6 hotspot filter — one of
  C1's two hotspot conditions AC-2 requires be bot-filtered. A literal copy-paste reintroduces
  bot-commit noise into the ranking.
- **Both reviewers flagged independently** (reviewer HIGH conf 88; Codex Low) → strong signal; take HIGH.
- **Fix:** add the same `--perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))'` clause
  to Section 2's command, OR explicitly instruct splicing in the Section 1 filter. Keep it consistent
  with Section 3's form.

### 2. MEDIUM — wrong fallback section pointer
- **Location:** `metric-layer.md:27-28`.
- **Problem:** the Code Maat-absent preflight says compute the git-only fallback "with the git-only
  method **in Section 5**." The actual git-only fallback method is in **Section 3** (`:85-87`, the
  "**git-only fallback**" paragraph). Section 5 (`:98`) is the signals table. The degraded-tool path is
  load-bearing in C1; the pointer sends the operator to the wrong place.
- **Fix:** change "Section 5" → "Section 3" on `:28` (or reference the "git-only fallback" paragraph
  directly).

### 3. MEDIUM — missing Windows/Git Bash precondition for Code Maat log generation
- **Location:** `metric-layer.md:15-19` (preflight) and `:69-70` (log generation).
- **Problem:** Code Maat parses git logs and expects UNIX line endings; on Windows/PowerShell a
  literally-followed `git log … > repo.log` can emit CRLF that Code Maat misreads. The KG pilot target
  (`d:\src\knowledge-gateway`) is on Windows, so this is a live gap.
- **Fix:** add a one-line note in the preflight and/or the Section 3 log-gen step: on Windows, generate
  the log via Git Bash (or ensure LF line endings) so Code Maat reads it correctly. Additive hardening,
  not a logic change.

## Rejected — reconciled out of scope (NOT sent to the developer)

- **Codex NO-GO / High — "AC-2/4/5/6 open in live repo":** TRUE but by-design out of scope. Step 4
  (KG pilot) is operator-owned, "not executable in-pipeline" (plan `:88-98`); those ACs land at the
  pilot. The architect Step-1 done-check already ruled Step 4 "Deviated (valid reason)". Not a
  developer-fixable defect. A green repo gate + a documented operator step beats the Codex claim here.
- **Codex Low — "versions still 1.21.1 / 1.3.0, no ship entry":** team-lead commit-2 work (Q1
  resolution) — I run the split-tier bump (nexus 1.22.0 MINOR, nexus-dotnet 1.3.1 PATCH) + omni regen
  at commit. Not a developer fix.

## Informational — noted for slice 2, not required this cycle
- Code Maat `-a authors` / `-a age` outputs (`:81-82`) aren't wired into any downstream signal/filter
  (reviewer Open Question). Design/slice-2 concern.
- "top-N hot areas" vs the binary hotspot-filter threshold ambiguity — design-origin, inherited from
  the tech-spec; could yield 0 scanned areas on a quiet repo without an explicit report line.
- `questions.md` Q1 still `Status: Open` — team-lead hygiene item; close at commit 2.
