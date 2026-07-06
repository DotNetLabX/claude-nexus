# Utility Skills Hardening — Codex Cross-Check

**NO-GO** — Steps 1–3 and most of Step 4 match the plan, but the plan’s Step 4 release acceptance is still open: `node scripts/gen-omni.mjs --check` does not pass in the current tree, while the delivery docs still mark the feature `COMPLETE` / `PASS`.

## Findings

- **major** — `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:154-164`; `docs/specs/adhoc-UtilitySkillsHardening/delivery/implementation.md:89-107`; `docs/specs/adhoc-UtilitySkillsHardening/delivery/review.md:16-24`; `docs/specs/adhoc-UtilitySkillsHardening/delivery/communication-log.md:24-25,33`; `scripts/gen-omni.mjs:143-148`
  Issue: the plan makes the omni sync part of Step 4, with acceptance requiring `node scripts/gen-omni.mjs --check` to exit 0. The current tree does not meet that gate: rerunning `node scripts/gen-omni.mjs --check` reports drift in six omni paths (`plugins/omni/.claude-plugin/plugin.json`, `plugins/omni/CHANGELOG.md`, `plugins/omni/skills/evaluate-skill/references/rubric.md`, `plugins/omni/skills/improve-skills/references/skill-recipe.md`, `plugins/omni/skills/improve-skills/scripts/skill-lint.mjs`, `plugins/omni/skills/improve-skills/SKILL.md`). Despite that, `implementation.md` is marked `COMPLETE`, `review.md` gives `Verdict: PASS`, and the communication log says Steps 1–4 are done.
  Suggested fix: run the planned omni sync (`node scripts/gen-omni.mjs`), rerun `node scripts/gen-omni.mjs --check` until it exits 0, and then update the delivery-status docs to close Step 4 only after that gate is actually green.

- **minor** — `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:156-157,177-181`; `docs/specs/adhoc-UtilitySkillsHardening/delivery/communication-log.md:24`; `docs/specs/adhoc-UtilitySkillsHardening/delivery/lessons.md:55-57`; `tests/helpers.mjs:1-3,80-83`
  Issue: the plan’s Step 4 / Testing Strategy names `node --test tests/` as the acceptance command for the full suite, and the communication log claims the full T1+T2 suite was green. But the feature’s own lessons record that bare `node --test tests/` is broken on Node `>=22` and must be replaced with `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`. That leaves the documented acceptance evidence non-reproducible as written.
  Suggested fix: either update the plan/review docs to the supported test command, or add a repo-level test entrypoint that makes `node --test tests/` valid again on the supported Node line.

## What Matches The Plan

- **Step 1 matches the amended E6 / W3 / W4 design.** The lint now widens E6 to `references|workflows|scripts|assets`, anchors repo-root fallback to the nearest `.git`, limits file-shape checking to `scripts/` and `assets/`, adds W3 for body size, and adds W4 with `references/`-only nested scanning: `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:67-103`, `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs:13-20,31-47,95-129`. The required new tests are present in `tests/unit/skill-lint.test.mjs:151-234`. The two DO-NOT-BREAK sites the plan calls out are consistent with the new logic: `plugins/nexus/skills/release-plugin/SKILL.md:25-31` and `plugins/nexus-flutter/skills/figma-to-flutter/SKILL.md:129-135`.

- **Step 2 matches the rubric edit requirements.** Layer 0 item 6 is gone, item 4 names `scripts/` and `assets/`, item 3 is softened to separate scripted thinness from judgment, and Layer 2.2 now points to the degrees-of-freedom axis without embedding a `references/`-prefixed path: `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:107-126`, `plugins/nexus/skills/evaluate-skill/references/rubric.md:8-19,46-50,86-90`.

- **Step 3 matches the authoring-path edits.** `skill-recipe.md` now sanctions bundled `scripts/`, adds the degrees-of-freedom bullet, and updates the §2 intro to allow both `references/` and `scripts/`: `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:130-150`, `plugins/nexus/skills/improve-skills/references/skill-recipe.md:43-63`. `improve-skills/SKILL.md` now offers `scripts/` in scaffold step 3 and updates the lint-scope sentence to the widened E6 plus W3/W4 warnings: `plugins/nexus/skills/improve-skills/SKILL.md:48-70`.

- **Step 4 is partially landed inside this repo.** The version bump, changelog entry, and backlog entries the plan requires are present: `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:158-164`, `plugins/nexus/.claude-plugin/plugin.json:1-4`, `plugins/nexus/CHANGELOG.md:4-27`, `docs/skill-backlog.md:47-78`.

- **The estate-wide lint sweep passes in the current workspace.** Running `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` across all `plugins/*/skills/*` folders exited 0, which matches the Step 1 / Step 4 “do not break the estate” requirement from `docs/specs/adhoc-UtilitySkillsHardening/delivery/plan.md:41-44,101-103,156-157`.

## Verification Notes

- I reran `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` over all shipped skill folders; it exited 0.
- I reran `node scripts/gen-omni.mjs --check`; it exited 1 with the six drifted omni paths listed above.
- I could not independently rerun `node --test ...` or `node scripts/bump-plugin.mjs --check` end-to-end in this Codex sandbox because this environment blocks Node child-process spawning with `EPERM`. That limitation is visible in the code paths themselves: the test harness shells out via `spawnSync` (`tests/helpers.mjs:44-83`), and `bump-plugin.mjs` shells out to `git` via `execFileSync` (`scripts/bump-plugin.mjs:44-59`). I therefore scored those items from static code review plus the repository’s own delivery notes, not from a fresh green-bar run here.
