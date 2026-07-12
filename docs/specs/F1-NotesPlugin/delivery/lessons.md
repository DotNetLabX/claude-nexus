# F1-NotesPlugin — Lessons

## Architect Lessons

- **A "port from X" step needs a Keep/Change/Scrub list whenever X is bigger than the consumer's need.** Step 3 (search-notes) had one and survived review clean; Step 2 (note-schemas) said only "port from the live file" and drew the single HIGH — the 534-line producer contract would have shipped 26 dangling hub references. The under-specified port is the same defect class as the unscoped "replace all X."
- **Grep gates keyed to a repo-name literal miss hub-internal coupling.** The note-schemas source contains zero `omnishelf` literals yet 26 hub-only paths (`.claude/agents/…`, `kb/…`, `docs/proposals/…`) — G1 was structurally blind to all of them. When gating "no foreign coupling," grep for the *reference shapes* (path prefixes), not the repo name. G4 added.
- **Owner supersede of a ratified proposal at shaping:** record it in the spec's Source line and the extracted ADR's provenance blockquote — never edit the foreign repo's proposal unilaterally. The ADR-28 graduation chain stays intact with the supersede explicit at every hop.
- **External-repo grounding on this box:** Glob/Grep return empty for paths outside the session's working dirs (omnishelf-pipeline) while Read with absolute paths and PowerShell work — recurrence of the known sandbox-fabrication hazard; PowerShell remains the verification channel for external filesystem facts.
- **Concurrent-tree contamination reaches the twin:** gen-omni mirrors the working tree, so a dirty concurrent feature (adhoc-MineSkillAuthoring) contaminates a twin regen — the clean-tree guard became a plan-level gate (Step 6) instead of tribal knowledge.
