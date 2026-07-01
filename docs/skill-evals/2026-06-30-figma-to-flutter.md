# Skill Evaluation — figma-to-flutter

- **Evaluator:** Solo (originally run in `claude-omni`; recorded here in the nexus source repo as the source-of-truth copy — the skill lands in `nexus-flutter` and flows to the omni twin via `gen-omni`)
- **Date:** 2026-06-30
- **Scope:** `plugins/nexus-flutter/skills/figma-to-flutter/SKILL.md` (v0.2.0 of nexus-flutter, ported verbatim from omnishelf_flutter_app `.claude/skills/figma-to-flutter`)
- **Run artifacts consulted:** none available in this repo — evaluation judges the **spec as ported** plus its embedded provenance (PD-5444). No fresh run evidence exists in the plugin repo; a fitness verdict here is text-level, not behavioral.
- **Layer 0 (skill-lint):** PASS (exit 0).

## F1: No explicit scope fence
**Severity:** Medium
**Layer:** 1.5
**Claim vs reality:** The rubric wants a "what this skill does NOT do" section naming adjacent skills. The skill has `Pitfalls` and a `Checklist` but no scope fence — it references `new-golden-test` / `new-product-card` / `new-shared-widget` inline without bounding where this skill stops and they start.
**Fix:** Add a short `## What This Skill Does NOT Do` section (does not author the widget's data layer / Bloc; does not run goldens — hands off to `new-golden-test`; does not invent missing data sources). One-move add.

## F2: Cross-references project-local skills + concrete paths that don't ship with the plugin
**Severity:** Medium
**Layer:** 1.4 / AP5
**Claim vs reality:** The skill cites `new-shared-widget`, `new-product-card`, `new-golden-test`, `new-bloc-test` and hard paths (`lib/core/utils/consts/app_colors.dart`, `lib/presentation/shared_widgets/app_icon.dart`). None ship with the plugin; they live in omnishelf_flutter_app. This is intrinsic to the verbatim-copy decision — the skill targets the omnishelf design-system family, not a generic Flutter app.
**Fix:** Acceptable by design (the skill is omnishelf-family-specific, as chosen). Recorded so a future generalization pass knows the coupling points. No edit under the verbatim decision.

## F3: Figma MCP tool names hardcoded with the `mcp__figma__` prefix
**Severity:** Medium
**Layer:** 1.3 / P9
**Claim vs reality:** The skill instructs `ToolSearch select:mcp__figma__get_design_context,mcp__figma__get_screenshot,mcp__figma__get_metadata` and names the tools as `mcp__figma__*` throughout. The MCP server prefix is **environment-dependent**: in some workspaces the Figma server is exposed as `mcp__claude_ai_Figma__*`. A literal `select:mcp__figma__…` returns nothing where the server is named differently, so the tool-load step can dead-end for a consumer whose server isn't named `figma`. The model can recover via a keyword `ToolSearch` (e.g. "figma design context"), which softens this from High to Medium.
**Fix (if applied):** Make the load instruction prefix-agnostic — e.g. "load via `ToolSearch` keyword search for the Figma `get_design_context` / `get_screenshot` / `get_metadata` tools (the MCP server prefix varies by environment — `mcp__figma__*` or `mcp__claude_ai_Figma__*`)." One-line edit to the tool-table note. **Conflicts with the verbatim decision — surfaced to the user.**

## F4: No lessons-capture instruction
**Severity:** Low
**Layer:** 4.1
**Claim vs reality:** The skill embeds lessons (PD-5444 pitfalls) but has no "on discovery, capture to the lessons flow" instruction. Minor for a shipped skill (the plugin CHANGELOG carries evidence), consistent with the sibling `mine-verify-cover-flutter`.
**Fix:** Optional — add a one-line lessons-capture pointer. Low priority.

## Checked clean
- **Layer 0** — lint exit 0 (BOM, frontmatter, name=folder, description, cited paths).
- **Layer 1.1** — frontmatter promise = body: every claimed capability (paddings, colors, typography, lucide icons) is implemented in the mapping tables.
- **Layer 1.6** — known failure modes encoded: the PD-5444 Spacer/unbounded-width crash, wrong empty-state icon, and out-of-scope-data pitfalls are all in `## Pitfalls`, not left in a lessons file.
- **Layer 2.2** — mechanical close: ends with an emittable `## Checklist`; lint-enforced rules (no inline `Color(0x…)`, no raw `Text()`, no raw px) point to the consumer's actual lint as executor (no AP1 dead-letter).
- **Layer 2.3/2.4** — right weight (single SKILL.md + tables) and followable cold (named constants in tables, worked canonical example).
- **Layer 2.5 / AP4** — color-token table is illustrative; the real mechanism is `grep AppColors` / `grep -i <hex> app_colors.dart`, so it globs rather than relying on the enumerated list.
- **Layer 3** — no overlay applies (no external-system writes in the API sense, no subagent fan-out, no unbounded iteration, single-pass not resumable).

## Verdict
**ACCEPT** (post-fix). No Critical/High findings; the Judgment Gate's mandatory fold is satisfied. Lint re-run clean (exit 0) after edits.

### Disposition (applied 2026-06-30, user-approved)
- **F1 — FIXED.** Added `## What This Skill Does NOT Do` scope fence.
- **F2 — FOLDED INTO F1.** The omnishelf design-system + companion-skill coupling is now a declared precondition in the scope fence (silent coupling → explicit precondition; addresses AP5 "reads as wired"). No separate edit — generalizing the skill was out of scope per the verbatim decision.
- **F3 — FIXED.** Tool-load instruction made prefix-agnostic (keyword `ToolSearch`, both `mcp__figma__*` and `mcp__claude_ai_Figma__*` named).
- **F4 — FIXED.** Added a `## Lessons` capture instruction.
