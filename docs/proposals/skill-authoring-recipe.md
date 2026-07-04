# Proposal P5 — Skill-authoring recipe (extract the omnishelf gap)

**Status:** Ratified (2026-07-04, owner go-ahead in-session — "it has a plan, let's do it"; implemented via `adhoc-SkillAuthoringRecipe`).
**Confidence:** **High** — concrete identified gap, clear home, low risk.
**Priority:** independent; do whenever convenient.

## Finding
Most of omnishelf `SKILL_AND_AGENT_RECIPES.md` should **not** be ported — it is already shipped here, or
omnishelf-specific:

| Omnishelf | Already here / verdict |
|---|---|
| `SKILL_QUALITY_RUBRIC.md` | `evaluate-skill/references/rubric.md` |
| `SKILL_AUTHORING.md` (loader safety) | `improve-skills/scripts/skill-lint.mjs` — a **gate**, stronger than prose |
| §7 proven patterns | `improve-skills/references/proven-patterns.md` (P1–P11/AP1–AP7, same job-fitness provenance) |
| §2 Fokus agent recipe | redundant — **Nexus *is* that pipeline** |
| §5 OMC note, §6 spec→Jira, §7 local evidence | omnishelf-project-specific |

Porting wholesale would manufacture the **AP3 "restated rules, no single owner"** failure the catalog
itself warns about.

## The one real gap
Nexus tells you how to *evaluate* and *fix* a skill but has no crisp *authoring-from-scratch* recipe:
- **§0** — the heavy/autonomous vs light/conversational **archetype decision** (pick it first).
- **§1** — the **reusable element menu** (modes table, config constants, hard rules, phase index, state
  persistence, self-check, …).
- **§4** — the **frontmatter cheat-sheet** (`disable-model-invocation`, `allowed-tools`,
  `disallowed-tools`, `context: fork`, the `when_to_use` cap, …).

## Decision
Extract §0/§1/§4 into **`plugins/nexus/skills/improve-skills/references/skill-recipe.md`**, sibling to
`proven-patterns.md`. `improve-skills` already owns scaffolding new skills → single owner, existing
reference-file pattern, no fourth competing doc. **Not** a proposal-folder doc (porting isn't a
"should we build" question) and **not** the architecture README (implementation detail belongs in
skills). If a standalone doc is preferred anyway, architecture > proposals — but folding in is cleaner.

## Note
This is the only one of the six that, **when implemented, touches `plugins/nexus/**` → needs a version
bump** (release-plugin skill). The proposal file itself does not.

## Provenance
Session `researcher-build-persona`, 2026-06-13. Grounded against the actual nexus skill estate (rubric
+ lint + proven-patterns all confirmed present).
