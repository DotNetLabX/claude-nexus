# Critic Review — Plan Review (code-grounded) — adhoc-AnalystExtension

**Verdict:** NO-GO (revise-and-re-review; approach sound, fixes bounded) · **Date:** 2026-07-10 ·
**Mode:** 2, code-grounded. All five of the critic's pre-commitment predictions CONFIRMED — a
systemic signal the plan under-verified the shared dev-script/lint surfaces its own Definition
Review had flagged.

## Findings (all adopted — fold record in ## Fold below)

- **[CRITICAL] C1 — `node scripts/gen-commands.mjs nexus-analytics` CRASHES; AC-2 unachievable as
  written.** Executed proof: the agent set is a hard-coded 8-role `MAP` (gen-commands.mjs:26-35);
  the loop readFileSyncs each MAP name → `ENOENT …\nexus-analytics\agents\architect.md`, exit 1,
  commands/ left empty. The plugin argument selects the PATH only. The plan's "expected to work
  since the script takes the plugin argument" was asserted from CLAUDE.md's usage line, never
  executed. **Fix:** new prerequisite step — generalize gen-commands.mjs (agent set from
  `readdirSync(AGENTS_DIR)`; per-agent `proper`/`desc` from MAP when present, else derived from the
  agent doc — MAP-as-override keeps the nexus output byte-identical, guarded by selfcheck's
  gen-commands drift check).
- **[HIGH] H1 — "frontmatter lint green" is vacuous for plugin #6; "marketplace-driven lint
  auto-covers" over-claims.** frontmatter.test.mjs hard-codes `['nexus','nexus-dotnet']` (:35) and
  nexus-only agent/command checks (:18,:52); of 8 lint suites ONLY release.test.mjs iterates
  `marketplace.plugins`. **Fix:** generalize frontmatter + wiring(test 4) + skill-refs discovery to
  marketplace iteration (the durable option (a); also future-proofs plugin #7), with the
  pre-existing-violation protocol: violations surfaced in OTHER plugins are recorded + named in an
  explicit skip-list (their fixes ride each plugin's own next release — never silent, never
  scope-creep into this slug).
- **[HIGH] H2 — release-plugin's apply step would bump 0.1.0→0.1.1, breaking AC-1.** bump-plugin
  classifies a new plugin's files as PATCH and applies (:110-146,:186-192). Verified-TRUE
  counterpart: `--check` DOES accept a new plugin unbumped (readVersion null-at-base, :225).
  **Fix:** Step 6 imperative — for the initial scaffold NEVER run apply; 0.1.0 + its CHANGELOG IS
  the release; run only `--check` + the AC-7 diff.
- **[MEDIUM] M1 — the persona won't survive compaction.** register-persona.js accepts
  `data-analyst` (:43) but restore-agent.js resolves roles/bodies from `plugins/nexus/agents` only
  (:28-37,:43-50) → silent persona drop post-compact. Core-owned; AC-7 forbids fixing here.
  **Fix:** recorded as a KNOWN v1 GAP in tech-spec Out-of-scope + Migration Notes, with the
  forward pointer (a separate nexus-core slug: plugin-agnostic register/restore).
- **[MEDIUM] M2 — the "binding" P4 sequencing is enforced by nothing;** wiring test 4 scans only
  nexus surfaces (:86-90), so `nexus:mine-semantic-model` in the new plugin is resolution-checked
  by no lint, and the Step-5 gate only proves no bump in flight. **Fix:** hard on-disk
  precondition at plan entry (`plugins/nexus/skills/mine-semantic-model/SKILL.md` exists) + the H1
  wiring generalization makes the reference lint-real.
- **[MEDIUM] M3 — ladder grep (`grain`/`metric`/`dimension` ≥1) near-vacuous** (generic English).
  **Fix:** structural signatures — the literal `resolution ladder` + the three arrow forms.
- **[MEDIUM] M4 — answer-qa content had NO verifying AC; "all three skills profile-mediated"
  verified for one.** **Fix:** answer-qa contract greps added; AC-4's `profile.md` presence
  extended to all three SKILL.mds.
- **[LOW] twin-commit pointer** (mirrored `feat(adhoc-AnalystExtension): sync … (omni …)` message
  owed at closure) now named in Step 6; **selfcheck drift nexus-only** — drift check extended to
  agent-bearing plugins in the tooling step; **`${CLAUDE_PLUGIN_ROOT}` in md** would trip
  release.test's hygiene check — author note added.

## Verified TRUE (executed; recorded so nobody re-litigates)

gen-omni swap is CLEAN for the new tokens (`nexus-analytics`→`omni-analytics`,
`nexus:mine-semantic-model`→`omni:mine-semantic-model`, no double-swap; folder + in-file name
consistent); `bump-plugin --check` accepts the unbumped scaffold; release.test.mjs auto-covers
plugin #6 (manifest/semver/CHANGELOG/md-hygiene) and the specced scaffold satisfies it; gen-omni
edit anchors exact (:102, :114-120); virgin greps re-confirmed; estate 47/47 green; selfcheck
denominator 5 correct; proposal→spec fidelity intact (all intake decisions landed; "third plugin"
correctly reconciled to sixth).

## Systemic note

First-of-kind consumers (first extension agent, first new plugin since the lint estate grew) must
EXECUTE the shared machinery against a fixture at plan time — five out of five failures lived in
scripts/tests the plan cited but never ran.

## Re-review addendum (same critic, fix-verification pass) — **GO**

Every finding closes; no new CRITICAL/HIGH. Executed confirmations: the MAP-as-override
byte-identity premise holds (exactly 8 nexus agent files, all 8 in MAP — readdir+override emits
identical output); the M2 precondition target is correctly ABSENT today (the entry gate blocks as
intended); the three AC-9 target lint files genuinely contain zero `marketplace.plugins` today
(release.test has 4) — the widening is real, not cosmetic. Machinery item 0 ↔ plan Step 1:
consistent (plan adds the correct missing-dir guard). Three LOW residuals, all folded post-GO:
- **N1** — AC-9 conflated a structural claim (files iterate `marketplace.plugins`, provable at
  Step 1) with an eventual coverage claim (green over 6 plugins, provable only at Step 5 via
  AC-6). Fixed: AC-9 timing split, AC-6 cross-referenced.
- **N2** — the new plugin's frontmatter is lint-covered only from Step 5 (marketplace-driven
  discovery requires registration). Fixed: AC-3 states the timing; AC-6 is the terminal gate.
- **N3** — two Step-4 bullets said "names the profile" where AC-4 requires the literal
  `docs/semantic-model/profile.md`. Fixed: bullets now instruct the literal string.
