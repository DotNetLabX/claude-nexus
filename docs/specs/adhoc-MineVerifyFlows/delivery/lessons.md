# Lessons — adhoc-MineVerifyFlows (plugin-repo graduation)

> **Provenance — as-run in the `omni` twin.** Ported back verbatim (`adhoc-MineVerifyFlowsPort`).
> "here"/"this repo" below mean the twin, where the run happened — so "`gen-omni.mjs`/
> `bump-plugin.mjs` are nexus-side, absent here" is true as written, from omni's vantage.

> **Learner disposition (2026-07-21 → nexus 1.39.2):** [APPLIED] member-count-is-a-shared-fact sweep (with MineSkillAuthoring/F10/F16/F20) → create-implementation-plan counted-surface bullet. [TRACKED] mine-family lessons-capture hook gap (family-wide, L4.1) — 1 occurrence; handoff-mechanics re-verify folded under the applied referent-verification class.

## Architect Lessons

- **Re-verify a handoff's repo mechanics before planning against them.** The graduation handoff (written 2026-07-12) was wrong on three verifiable facts by run time: the path layout (`plugins/omni/...`, not `omni/...`), the release tooling (`gen-omni.mjs`/`bump-plugin.mjs` are nexus-side, absent here), and the versions (the twin was 15 minors behind until a `git pull` synced it mid-session). The handoff itself said "re-check current" — the general rule: a handoff's *content* can be binding while its *mechanics* are a snapshot; grep the live repo before writing a single plan step.
- **A `git pull` can dissolve a user question.** The versioning question (collision with nexus's 0.3.0) had three carefully-constructed options; syncing the twin made the mechanically-default answer correct. When a question exists only because two copies have drifted, "sync first, then ask what remains" beats answering under drift.
- **A member-count is a shared fact with consumers.** Adding the 8th family member touched 12 count-bearing mentions across 6 files; the code-grounded critic and a grep confirmed the sweep complete. Any "N-member" phrasing in a shared reference is a rename-class edit — grep the whole estate.
- **The judgment gate caught what author-mode missed, twice, symmetrically.** Both fresh-context evaluators found a HIGH the author (this session) had structurally hidden from itself: the method named a gate (sabotage) with no executor, and the adapter named a capability (output capture) with no mechanics. Both were "the table row exists, the section doesn't" defects — exactly the class a same-context self-review glosses because the author remembers the intent. The pair pattern (method names it / adapter operationalizes it) needs an explicit both-sides check at authoring time.
- **Family-wide gap logged, not patched per-skill:** no mine-family skill carries a lessons-capture hook (rubric L4.1). One fix belongs in `mine-family-core.md` as its own pass — waived identically on both new skills rather than patching them out of family shape.
