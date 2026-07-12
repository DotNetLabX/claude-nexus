# F1-NotesPlugin — Critic Review (code-grounded, definition + plan)

**Mode:** Plan Review (Mode 2, code-grounded) · **Date:** 2026-07-12 · **Verdict: REVISE** · Critic agent: a8278b4eb14455d70 (opus)

Persisted verbatim-in-substance by the architect (ADR-13: the critic writes no files). Dispositions added after fixes — see the `## Plan Review` note in plan.md.

## Findings

| # | Sev | Finding | Fix disposition |
|---|-----|---------|-----------------|
| H1 | HIGH | Step 2's note-schemas port had no scope/scrub guidance: live source is a 534-line producer contract with a UTF-8 BOM, 5 mojibake em-dashes, and 26 hub-internal refs (`.claude/agents|scripts|skills/…`, `docs/proposals/…`, `kb/…`) — zero `omnishelf` literals, so G1/G2/G3 all miss it. Port scope ambiguous (whole file vs consumer field-set). | Fixed: Step 2 rewritten — consumer field-set scope, explicit scrub list (BOM, mojibake, hub-internal refs), new gate **G4** targeting dangling hub references. |
| M1 | MED | Source search-notes frontmatter keys `triggers`/`args`/`argument-hint` are illegal per `tests/lint/frontmatter.test.mjs:18` (SKILL_KEYS closed set); skiplist-exemption trap at `:29`. | Fixed: Step 3 Change list names the key-drop + forbids a skiplist exemption. |
| M2 | MED | `tests/unit/gen-omni.test.mjs` goes red on the new mirrorPlugin line two ways: sandbox `before()` seeds only 6 plugins (`:27-34`, ENOENT), expected-names array at `:58` omits `omni-notes`. Plan read as purely additive. | Fixed: Step 5 names both required test edits. |
| M3 | MED | Step 7 said the backlog row "stays In Progress" — no row existed; AC8 unmet; no Impact/Effort values given. | Fixed: row **added** to `docs/backlog.md` at definition close (Impact 5, Effort high); Step 7 reworded to update-the-row. |
| M4 | MED | Step 7 said spec "stays Ready" while spec was `Status: Draft`. | Fixed: spec flipped to Ready at definition close (post-review); Step 7 wording corrected. |
| M5 | MED | AC6 (live twin generation + omni commit) will be deferred by Step 6's dirty-tree guard on the current tree (adhoc-MineSkillAuthoring dirt), yet Step 6 claimed Satisfies AC6 wholesale. | Fixed: AC6 split in spec (wiring+fixture vs live-twin run, deferral recorded as owed); Step 6 states the partial satisfaction explicitly. |
| M6 | MED | Step 1 field list omitted `dependencies: ["nexus"]` (ADR-3/ADR-56 extension declaration) — no lint checks it, so a literal reading ships an undeclared dependency. | Fixed: Step 1 lists name/version/description/author/keywords/`dependencies: ["nexus"]` explicitly. |
| L1 | LOW | BR4 covered by Step 2 but uncited. | Fixed: BR 4 added to Step 2 Satisfies. |
| L2 | LOW | note-schemas mojibake (5× `â€”`) escapes all gates. | Folded into H1 fix (scrub list). |
| L3 | LOW | Step 4 called the claim mechanics "three bullets"; it is one bullet chain spanning omni-project-adapter.md:110-112. | Fixed: wording corrected. |

## Confirmed accurate by the critic (grounded, no action)

gen-omni two-line wiring correct and sufficient (lines 103/121/34 all accurate; banner auto-derives, twin marketplace regenerated wholesale, gen-omni.mjs not self-mirrored); T1 lint is marketplace-driven — a skills-only plugin is discovered dynamically, no hardcoded list to edit (hooks-wiring tests correctly skip a hookless plugin); all external anchors exist as cited (search-notes param set exact match; claim mechanics at :110-112; meeting-context.md); wave-2 facts valid (gen-commands any-plugin, nexus-cpp 0.1.0 precedent, mine-family-core placement precedent); YAML config decision conflict-free; G3 correctly forces the BOM strip; G1 satisfiable only if the adapter template generalizes the literal inbox path out (now explicit in Step 2).
