# F24-EditShippedSkillRecipe — Lessons

## Developer Lessons

- **skill-lint E6 vs E7 scan different text — matters when authoring a skill that teaches the lint traps.**
  E6 (dangling-reference) runs on the **raw** SKILL.md text, so a `references/`|`scripts/`|`assets/`-rooted
  path token is checked **even inside a code span or fence**. Only E7 (angle-bracket) strips code spans/fences.
  Consequence: putting a path in backticks does NOT exempt it from E6 — only putting an angle-bracket token in
  backticks exempts it from E7. When dogfooding the recipe I had to keep every cited path resolvable regardless
  of code-span wrapping, while `<tag>` illustrations only needed a code span.

- **The "sibling cite" form is E6-safe by *escaping the check*, not by resolving.** E6's regex has a lookbehind
  `(?<![\w/])`, so a path whose folder segment is preceded by `/` (e.g. `../improve-skills/scripts/skill-lint.mjs`
  — the `scripts/` is preceded by the `/` after `improve-skills`) is **not matched at all**, hence not checked.
  A *bare* `scripts/x.mjs` (preceded by space/backtick) IS matched and must resolve skill-relative or at the
  `.git`-anchored repo root. So `scripts/gen-commands.mjs` (repo-root) passes; a bare `scripts/skill-lint.mjs`
  would dangle (it's neither repo-root nor skill-relative for a light skill) — the sibling `../{skill}/…` form
  is the fix. The plan's "sibling cites resolve or go by-name" is correct; the underlying mechanism is the
  lookbehind skipping slash-preceded segments.

- **`bump-plugin.mjs --check` run *after* a bump prints "no plugin behavior-surface changes detected — no bump
  needed" and exits 0.** The wording reads as if it saw no changes, but it means the working-tree change is
  already covered by the version bump (the CI backstop is satisfied). Not a false negative — exit 0 is the pass
  signal after `--minor`/`--minor` has already applied.

- **Dogfooding a docs/rules edit against `edit-shipped-plugin-skill`'s own adjacent-surface-staleness rule
  caught nothing to fix — but proved the rule is cheap.** After the Step-2 pointer append to improve-skills, a
  single `grep -n carve-out` surfaced the four other carve-out references; confirming each concerned *authoring*
  (not the *edit* pass I added) took one read. The sweep is a ~30-second cost that would have caught a stale
  summary had one existed — exactly the F12/F17 ripple failures the skill exists to stop.
