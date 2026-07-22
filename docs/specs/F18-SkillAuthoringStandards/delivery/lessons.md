# F18-SkillAuthoringStandards — Lessons

## Developer Lessons

- **A skill authored in this repo but not yet in the version-keyed install cache is invisible to the
  Skill tool.** `edit-shipped-plugin-skill` shipped at nexus 1.46.0, but the installed cache here is
  1.44.1, so both `edit-shipped-plugin-skill` and `nexus:edit-shipped-plugin-skill` returned "Unknown
  skill." The correct fallback is **not** the cache glob (which also misses it) — it is a direct Read
  of the at-source `plugins/nexus/skills/{name}/SKILL.md`. This will recur for every F18/F24 consumer
  wave (F19/F21/F22 all map `edit-shipped-plugin-skill`) until the local cache is refreshed past the
  skill's ship version. Record it as a Read-channel deviation, don't reconstruct the recipe from memory.

- **When hand-running a census of lint warns, grep the warn message's actual casing, not the semantic
  phrase.** My first W6 census used `grep "use when"` (lowercase, the predicate's substring) against
  lint output whose warn text reads "Use when" (capital) — it reported W6=0 and looked like a lint bug.
  The lint was correct (`.toLowerCase().includes('use when')`); the census grep was wrong. Recount via a
  phrase unique to the warn message ("step-shapes") gave the true baseline of 5. Lesson: a census over
  tool *output* must match the output's literal text; a census over the *inputs* (descriptions) is the
  independent cross-check.

- **For a lint scoping predicate that reads a path segment, split on both separators.** The plugin-dir
  predicate (segment above `skills/`) must `split(/[\\/]/)` because `path.resolve()` yields backslashes
  on win32 and forward slashes elsewhere; the repo runs on win32. A `split('/')` would have returned the
  whole backslash path as one segment and silently never matched — a scope bug invisible until a
  cross-platform run. The plan pinned this; confirming it here as a reusable rule.

### Improvement Proposal (optional, for systemic issues)
**Target:** `docs/specs/{slug}/delivery` developer workflow — the Skill-Authority fallback note in the
developer/solo agent files (`plugins/*/agents/developer.md`, `solo.md`).
**Change:** The current fallback text says "glob `~/.claude/plugins/cache/**/skills/{name}/SKILL.md`,
pick the highest version." Add: **if the cache glob also misses (a repo-authored skill not yet released
past the local cache version), Read the at-source `plugins/*/skills/{name}/SKILL.md` directly** — this
is the common case when a just-shipped recipe skill is mapped by its first consumer wave in the same
release window.
**Evidence:** [F18-SkillAuthoringStandards] — `edit-shipped-plugin-skill` (shipped 1.46.0) unresolvable
via Skill tool and absent from the 1.44.1 install cache; only the at-source Read worked.
**Priority:** medium
