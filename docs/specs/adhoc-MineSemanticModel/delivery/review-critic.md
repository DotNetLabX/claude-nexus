# Critic Review — Plan Review (code-grounded) — adhoc-MineSemanticModel

**Verdict:** GO-with-fixes · **Date:** 2026-07-10 · **Mode:** 2, code-grounded (live plugin tree,
KG source package, tests/lint estate, gen-omni.mjs, release state). Verified TRUE: all virgin/
collision claims (`mine-semantic-model` 0, `four-member` exactly 1, `five-member` 0); AC-2
non-vacuous and passing on the real 7 probes; AC-5 regex 0 hits over the ENTIRE KG package (env-var
DSN, no inline creds); all four family-core edit loci + the carve-out precedent (L73-75) exact;
frontmatter pair (`user-invocable` + `disable-model-invocation`) already shipped (distill-prompt,
improve-skills) and in `frontmatter.test.mjs` SKILL_KEYS; **gen-omni copies non-md recursively**
(probes/*.sql mirror fine, no swap-token in the folder name); DecisionLog dirty-set content-disjoint
(overlap only plugin.json/CHANGELOG, governed by the Step-5 gate; this bump targets 1.29.0); all 11
shipping KG files BOM-free; no central skill registry to update.

## Findings (all adopted)

- **[HIGH] H1 — the family grows to five but three shipped files still assert "all four"** outside
  both the plan's edit scope and AC-3's hyphen-only grep: `mine-family-core.md:18` ("unchanged
  across all four"), `mine-reference-model/SKILL.md:29` + `mine-verify-repo/SKILL.md:27` ("all four
  members follow"). The whole AC battery passes while two sibling skills contradict the five-row
  table they point at. **Fix:** Step 4 extends to the member-count sweep (3 edits); AC-3 gains the
  discriminating grep. **Architect correction on the suggested fix:** the critic's proposed blanket
  `all four` = 0-hits AC would false-positive on `mine-family-core.md:109` ("confirm all four up
  front" — the kickoff checklist's four ITEMS, not the four members; verified 4 total hits, not 3).
  The adopted AC pattern is `all four members|across all four` = 0 hits, with :109 named
  DO-NOT-TOUCH.
- **[HIGH] H2 — AC-5/AC-6 + the keep/replace dispositions under-cover the KG stack-coupling
  surface; a fully KG-coupled skill passes every AC.** Measured: 14 dotnet/.cs/.ps1/C#-symbol
  anchors across the shipping sources (probe-catalog 8 — `DataPoolQueryExecutor.cs`,
  `calibrate-explain-ceiling.ps1`, `QueryLoadFloor.ParseTotalCost`,
  `IsValidReportDetailBound`/`IsValidEventsBound`/`IsBareTautology`, `F52`, the four analytics
  table names; SKILL.md 5 — incl. `F41`/`F39`/`F50` lane ids; output-contract 1 — the literal
  `dotnet test --filter …` at :146, plus prose `F38` at :19/:44) + interview-protocol's
  `seed/db/generation-rules/interview.md` cite (slips past AC-6's `seed/db/semantic-model` token)
  and `analytics_reports.status` example. `evaluate-skill` lints SKILL.md only — no backstop.
  **Fix:** dispositions enumerate every anchor; new AC-9 stack-anchor sweep
  (`\.cs\b|\.ps1\b|\bdotnet\b|DataPool|QueryLoad|\bF[0-9]{2}\b`, profile excluded, single sanctioned
  exception: literal `F38` in SKILL.md's labeled origin story); AC-6 token list extended
  (`analytics_report|analytics_events|retail_chain_id|fmcg_platform`, `seed/db/` broadened); the
  `run-probe.cs` worked-example citation MOVES to project-profile.md item 10 so probe-catalog ships
  anchor-free.
- **[MEDIUM] M1 —** `probe-catalog.md:111` carries a dangling `references/connection.md` cross-ref
  (connection.md stays in KG by decision; `skill-lint.mjs` E6 lints SKILL.md only, so the dangler
  ships ungated). **Fix:** re-point to the profile's datasource surface (item 7).
- **[MEDIUM] M2 —** BOM obligation stated but unverified; skill-lint E2 covers SKILL.md only, and
  PowerShell redirection writes UTF-16 on this platform. **Fix:** first-3-bytes ≠ `EF BB BF`
  acceptance over every `probes/*.sql` + `references/*.md` (AC-10).
- **[MEDIUM] M3 —** AC-3's "§Skeptic protocol names mine-semantic-model" is vacuous: the family-
  table row (edit 2, same file) satisfies a whole-file grep even if edit 4 is skipped. **Fix:**
  grep the carve-out-unique phrase `origin enum is its verdict grammar`.
- **[LOW] L1 —** `skill-refs.test.mjs` fails on `` `name` skill `` phrasing for non-skill names.
  **Fix:** Step 3 binding phrasing rule — "mine-from-spec **mode**", "the mine-family-core
  **reference**", never backtick + " skill".
- **[LOW] L2 —** Step-5 gate interpretation-dependent while the hazard is live (HEAD=1.27.0,
  working=1.28.0). **Fix:** exact check named —
  `git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` exits 0 before bumping.

## Systemic note

The critic's pre-commitment predictions confirmed the pattern: fixed-token AC lists under-cover a
coupling SURFACE (stack anchors, feature-ids) — derive sweep regexes from the coupling *class*, not
from remembered example tokens. Two predicted integration hazards were REFUTED by execution
(gen-omni copies .sql; the frontmatter pair is already shipped + linted) — recorded so the next
promotion pass doesn't re-litigate them.
