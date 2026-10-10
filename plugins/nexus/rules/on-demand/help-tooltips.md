# Help Tooltips

> Read when: a slug's `definition/` contains `help.tooltips.md` (architect plans UI steps, developer wires them, reviewer verifies them).

If `docs/specs/{slug}/definition/help.tooltips.md` exists, wire the tooltip text to the corresponding UI elements during implementation.

- **Architect:** Include tooltip wiring in plan steps that build the relevant UI components.
- **Developer:** Read `help.tooltips.md` and add tooltips using the text on each matching element.
- **Reviewer:** Verify tooltips match `help.tooltips.md` content if the file exists.

The file is optional — if it doesn't exist, skip silently.
