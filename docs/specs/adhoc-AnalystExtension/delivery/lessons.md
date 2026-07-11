# Lessons — adhoc-AnalystExtension

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] execute-shared-machinery-against-a-fixture-at-plan-time → create-implementation-plan bundle; new-plugin wiring surfaces (gen-commands MAP, gen-omni.test fixtures) → release-plugin New-plugin ship checklist. [ROUTED-TO-PROPOSAL] estate-authoring skill gap (3rd consecutive occurrence) → docs/proposals/estate-authoring-skill-2026-07.md.

## Architect Lessons

- **A first-of-kind consumer of shared machinery must EXECUTE that machinery against a fixture at
  plan time — a usage line in CLAUDE.md is not a capability claim.** [adhoc-AnalystExtension] The
  plan asserted "gen-commands.mjs {plugin} already takes the plugin argument" from the documented
  invocation and even hedged Step 2 with "expected to work" — the critic ran it against a
  throwaway plugin dir and it CRASHED (hard-coded 8-role MAP, ENOENT, exit 1). Five of five of the
  critic's pre-commitment predictions confirmed, all in scripts/tests the plan cited but never
  ran. This is the executed-true grep lesson (adhoc-MineFamilyCore) escalated one level: it
  applies to TOOLING INVOCATIONS, not just grep signatures. **How to apply:** when a plan makes a
  new-shaped call into an existing script/test estate (new plugin, new artifact type, new agent
  surface), execute the call against a disposable fixture during plan authoring — "the script
  takes an argument" says nothing about what the script assumes about the argument's shape.
- **"The estate lints it" needs a discovery check per suite — coverage claims are per-mechanism,
  never blanket.** [adhoc-AnalystExtension] Of 8 lint suites only release.test.mjs iterates
  `marketplace.plugins`; frontmatter/wiring/skill-refs hard-code the founding pair, so the plan's
  "marketplace-driven lint auto-covers plugin #6" was true for manifests and false for
  frontmatter/references — a malformed skill would have shipped green. **How to apply:** before
  citing a lint as an AC's enforcement, read its DISCOVERY code (what it globs/iterates), not its
  assertions; state coverage per suite.
- **Don't write the review outcome before the review returns.** [adhoc-AnalystExtension] The
  revised plan briefly said "Re-review passed" while the re-review was still in flight — caught
  and corrected in the same session, but it is the exact confident-closure-ahead-of-evidence
  failure the mine family's whole verdict grammar exists to kill. Records state what HAS
  happened; in-flight work is IN FLIGHT.

## Developer Lessons

- **A shared/marketplace-driven script edit needs its OWN unit-test fixtures re-audited, not just
  the script.** [adhoc-AnalystExtension] Adding `mirrorPlugin('nexus-analytics', ...)` to
  `gen-omni.mjs` crashed `tests/unit/gen-omni.test.mjs` — its synthetic sandbox fixture hard-codes
  which plugin dirs exist, the exact C1 shape but in the TEST harness rather than the script under
  test. Caught immediately by running the full suite after the Step 5 script edit (never batched
  to the end), fixed by seeding a fixture skill matching the established pattern
  ("seed them so collect() doesn't ENOENT" — already the convention for
  nexus-flutter/cpp/php). **How to apply:** after editing a script that a unit test drives via a
  synthetic fixture (not the real repo tree), re-run that specific test file FIRST, before the
  full suite — a fixture-shape mismatch surfaces as a crash, not a subtle diff.
- **A concurrent sibling session finishing (committing) MID-BUILD is not just noise to route
  around — re-baseline the entry-precondition snapshot against the new HEAD.** [adhoc-AnalystExtension]
  The task brief's dirty-file list went stale when `adhoc-ArchitectFastLane` committed partway
  through this build; continuing to compare against the STALE snapshot would have wrongly flagged
  legitimate post-commit state as "unexplained." Re-ran `git log`/`git status` to confirm via
  read-only git (never a write), re-baselined the snapshot to the new clean state, and it actually
  SIMPLIFIED the AC-7 comparison (fewer dirty files, not more). **How to apply:** in a long session
  where a shared-tree brief describes another session's dirty files, treat that description as a
  snapshot-at-dispatch-time, not a live truth — re-verify via `git log`/`git status` before trusting
  it, especially before a tree-comparison AC gate.
- **A pre-existing lint failure that fails identically under BOTH the narrow (pre-widening) and the
  widened test is not a "widening surfaced this" skip-list candidate** — even though it lives in
  the same plugin the widening touches. [adhoc-AnalystExtension] The `architect.md`/`code-review`
  skill-refs failure predates Step 1 entirely (verified by checking it against the ORIGINAL
  hard-coded resolution set before editing the test). Filing it under the Step 1 skip-list (whose
  stated purpose is "violations THIS widening surfaces in OTHER plugins") would have misattributed
  a sibling-commit regression to this slug's tooling change. **How to apply:** before adding a
  found violation to a "the widening surfaced this" skip-list, verify it under the PRE-widening
  code path too — if it already failed there, it's a different category of finding (documented
  baseline exclusion), not a skip-list entry.
- **A tech-spec/plan AC's grammatical scope ("all three [X]... across the plugin") can read as two
  different literal scopes** — execute BOTH readings and disclose, don't silently pick one.
  [adhoc-AnalystExtension] AC-4's "zero hard-coded consumer paths... across the plugin" could mean
  "across the three SKILL.mds this AC is about" or "across the whole plugin directory including a
  relocated file with an ALREADY-SANCTIONED exception from a different slug's own AC." Ran both
  greps, reported both results, named which reading PASSES clean and why the other reading's one
  hit is a carried-forward sanctioned exception rather than a new violation — mirrors the
  `adhoc-MineSemanticModel` precedent for its own analogous AC-6/AC-9 tension (Architect Lessons
  above; same discipline, second occurrence).

## Skill Gaps

- Skill-authoring/plugin-scaffolding gap, third consecutive occurrence (LearnerCadenceNudge:
  hook-authoring; MineSemanticModel: skill-promotion; here: plugin scaffold + extension-agent
  authoring). The learner should weigh a `create-skill`/`create-plugin` skill — the recurrence
  bar is met.
