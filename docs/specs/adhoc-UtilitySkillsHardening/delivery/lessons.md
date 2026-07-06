# Lessons — adhoc-UtilitySkillsHardening

## Architect Lessons

- **`Measure-Object -Line` silently skips blank lines** — a line-count claim in a plan must come from
  `(Get-Content $f).Count`, never `Measure-Object -Line`. The artifact (325 vs the real 410) shipped into a
  plan that advertised code-grounding; the code-grounded critic caught it (M1). Any count a plan cites comes
  from a query whose semantics you've verified, not just a query you ran.
- **A pass that adds a lint check AND content that check could match must cross-check the two against each
  other.** Step 1's W4 (nested-reference warning), read with the widened regex, would have flagged Step 3's
  own `scripts/` recipe additions — the plan adding the check and its first false positive in the same
  change (critic H1). When a plan both tightens a gate and edits the gated surface, run the new gate's logic
  mentally over the pass's own diff before shipping the spec.
- **A cwd-relative fallback re-introduces caller-dependence into a previously deterministic tool.** The E6
  repo-level fallback anchored to `process.cwd()` would have made the lint's exit code depend on the
  invocation directory (critic M2). Anchor to a discoverable marker (nearest `.git` ancestor of the input)
  instead — deterministic from anywhere.
- **The external audit's own blind spot was real but its literal fix was unshippable** — naive E6 widening
  breaks two shipped skills the auditors couldn't see (they audited the concept, not this estate). Re-ground
  every inbound feedback item against live source before planning it (confirmed the standing rule); the
  amendment (marker-anchored fallback + file-shaped filter) is the plan's core design contribution.
- **Done-check (2026-07-06): pre-authoring Step 4's gen-omni/commit arm as operator-owed paid off — it
  resolves as `Deviated (valid reason)` in one table row, not an escalation.** Because the plan named the
  developer-can't-commit / gen-omni-pins-the-not-yet-existing-sha constraint up front, the developer's
  deferral was pre-sanctioned; the done-check confirms the completed arm (bump/CHANGELOG/backlog/sweep) and
  surfaces the omni sync as team-lead-owed. The verify-gate selfcheck fail on that deferred arm is a known
  false positive and is NOT a plan↔implementation conformance defect — the done-check verdict keys on
  conformance, not the transient state of the release gate.

## Developer Lessons

- **Phase-1 estate scan (2026-07-06): a third file-shaped `assets/` citation exists beyond the two
  DO-NOT-BREAK sites, and the lookbehind — not the file-shaped filter — is what keeps it safe.**
  `tailwind-theme/SKILL.md:16` cites `client/src/assets/main.css` inside a fenced code block. It is
  file-shaped (`main.css` has a dot), so the file-shaped filter would NOT exempt it — but the existing
  `(?<![\w/])` lookbehind skips it because `assets` is `/`-preceded (`src/assets`). Same mechanism that
  saves `research`/`research-entry-schema`/`evaluate-skill`'s `scripts/` cites (critic L1). Estate-wide,
  every file-shaped `scripts/`/`assets/` cite in all three plugins' SKILL.md files is either `/`-preceded
  (skipped) or resolves — `fleet:45`→skill-relative `scripts/render-fleet.mjs`, `improve-skills:70`→
  skill-relative `scripts/skill-lint.mjs`, `release-plugin` all →repo-root `scripts/`. Note E6 scans the
  FULL text, not code-stripped prose, so code-block cites like tailwind's ARE reached by the regex — the
  lookbehind is load-bearing, verify the preceding char, not just the last-segment dot. Add a Step-1 test
  guarding this class (a `/`-preceded file-shaped `scripts/` cite → no error) so the safety net is pinned.
- **A skill's bundled `scripts/` ships with the plugin bump via its parent skill folder — it is NOT the
  repo-root `scripts/*` the bump policy excludes.** `bump-plugin.mjs --dry-run` classified the
  `improve-skills/scripts/skill-lint.mjs` executable change under "skill change (improve-skills)" (the
  whole folder is version-keyed), so the E6/W3/W4 behavior change reaches users with 1.24.0. Don't assume
  the release policy's "`scripts/*` = no bump" (which means the dev-repo ROOT `scripts/`) waives a bundled
  skill script.
- **gen-omni's footer pins the impl commit sha, so the developer cannot correctly run it before the impl
  commit exists.** Running `gen-omni.mjs` now would stamp the PRIOR feature's HEAD sha into the twin's
  `Generated from the nexus plugin (nexus {sha})` footer. Deferred to the team-lead commit protocol
  (confirms the standing finalize-artifacts-before-commit2 rule) — a plan Step-4 that lists gen-omni under
  the developer's step still can't override that the sha only exists post-commit.
- **`node --test tests/` (bare directory) regressed on Node >=22 (here v24.13.0: `Cannot find module
  '...\tests'`).** Use the glob form the harness documents — `node --test tests/lint/*.test.mjs
  tests/unit/*.test.mjs`. Also: `plugin.json` lives at `plugins/{name}/.claude-plugin/plugin.json`, not
  `plugins/{name}/plugin.json`.

## Reviewer Lessons

- **`bump-plugin.mjs` has no unknown-flag guard — an invalid flag silently falls through to apply mode.**
  Probing usage via `node scripts/bump-plugin.mjs --help` (no such flag) applied a REAL bump
  (`1.24.0 -> 1.24.1` + a spurious CHANGELOG entry) instead of erroring, because `MODE` only branches on
  `--check`/`--dry-run` and defaults to `'apply'` otherwise (`scripts/bump-plugin.mjs:36`). Caught via
  `git diff --stat` insertion/deletion counts no longer matching the known pre-existing diff; reverted by
  hand. **Never invoke a mutating script (bump/gen/apply-mode tools) with an unverified flag during
  review** — read the script's argument-parsing source first, or stick to flags the skill/plan explicitly
  documents (`--check`, `--dry-run`). A read-only reviewer pass should treat every CLI invocation of a
  write-capable tool as a potential mutation until the flag is confirmed safe.
- **Reconcile a parallel `review-codex.md` against live source and the repo's own standing conventions,
  not at face value.** An independently-run Codex cross-check flagged Step 4 as a "major" NO-GO because
  `gen-omni --check` fails while `implementation.md`/`review.md` read COMPLETE/PASS. The finding was
  technically accurate (the check does fail) but missed that this repo's ADR-20 2-commit team-lead-owned
  protocol makes gen-omni structurally impossible to run before the implementation commit exists (its twin
  footer pins that commit's sha) — the developer/architect had already documented this exact deferral with
  reasoning, and it is precedented across multiple prior shipped features, not invented for this one. A
  cross-check tool's severity label is not self-certifying — trace its premise against the project's own
  conventions before adopting or dismissing it.
