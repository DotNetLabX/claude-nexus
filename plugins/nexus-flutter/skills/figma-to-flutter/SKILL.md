---
name: figma-to-flutter
description: Map a Figma node (via the Figma MCP) to a pixel-accurate Flutter widget using this project's design system — exact paddings, colors, typography, and lucide icons. Use whenever a task references a Figma link/node or says "match the design".
argument-hint: "{Figma node URL or fileKey + nodeId} and the target widget file"
user-invocable: true
---

## What This Skill Does

Turns a Figma design node into a Flutter widget that matches the design **exactly**, by reading the real
spec values from the Figma MCP and translating them into this project's design-system primitives
(`AppColors`, `AppText`, `pxToW`/`pxToH`, `AppIcons`/lucide, `AppContainer`). Never eyeball a screenshot and
guess — pull the node and read the numbers.

## When to Use

- A PR comment / ticket links a Figma node ("match the design", "the card is not as in the design", "icons are not right").
- You are building or fixing any card/screen/empty-state/badge that has a design.
- A reviewer flags a design-fidelity gap.

> **Why this skill exists:** in PD-5444, the design work *claimed* to use Figma but produced wrong layouts
> (a card that crashed, a wrong empty-state icon, jammed rows). Every one was an "eyeballed, not spec-checked"
> mistake. Pulling the node and reading the exact values prevents all of them.

## What This Skill Does NOT Do

- **Author the widget's data/state layer** (Bloc/Cubit, repositories, models) — build those with `new-bloc-test` / the data-layer skills; this skill stops at the presentation widget.
- **Run or generate the golden itself** — it hands off to `new-golden-test` for verification.
- **Invent a missing data source** — out-of-scope design elements are dropped and flagged to the PO, never back-filled.
- **Generalize across design systems.** This skill assumes the **omnishelf-family design system**: `AppColors` / `AppText` / `pxToW`-`pxToH` and the companion presentation skills (`new-golden-test`, `new-product-card`, `new-shared-widget`). In a Flutter project without those primitives and skills, treat the mapping tables below as a worked example to adapt — not a literal API.

## The Figma MCP tools

| Tool | Use it for |
|------|-----------|
| `mcp__figma__get_metadata` | Node tree overview — layer names (incl. **icon layer names**), positions, sizes. Cheap. Use to locate the right node/icon. |
| `mcp__figma__get_design_context` | **The primary tool.** Returns exact specs: padding, gap, radius, **hex + design-token colors** (`var(--dark/90,#3b3f42)`), **font tokens** (`Text/Small/SemiBold`), and asset/icon references, plus reference code (React/Tailwind — convert, don't copy) and a screenshot. |
| `mcp__figma__get_screenshot` | The rendered PNG (returns a short-lived URL; `curl` it then `Read` the file to view). Use to confirm the visual + inspect an icon glyph. |

These tools are deferred — load via `ToolSearch`. The MCP server prefix is **environment-dependent**
(`mcp__figma__*` when the server is named `figma`, `mcp__claude_ai_Figma__*` for the claude.ai Figma
server), so search by **keyword** rather than a fixed `select:` — e.g. `ToolSearch` for
`figma get_design_context get_screenshot get_metadata` — and load whatever prefix matches.

**Extracting `fileKey` + `nodeId` from a PR-comment URL:**
`https://www.figma.com/design/<fileKey>/<name>?node-id=22626-18618` → `fileKey=<fileKey>`, `nodeId=22626-18618`
(the `nodeId` may use `-` or `:`; both are accepted).

## Workflow

1. **Get the node.** Extract `fileKey` + `nodeId` from the Figma link in the comment/ticket. If only a frame
   URL (no `node-id`), ask for a node-specific link or use `get_metadata` to drill in.
2. **Pull the spec.** Call `get_design_context` (pass `clientFrameworks: "flutter", clientLanguages: "dart"`).
   Add `excludeScreenshot: true` only if you already have the screenshot (saves tokens). Read the **literal
   values** (paddings, gaps, radii, the `var(--token,#hex)` colors, the `Text/...` font tokens, icon assets).
3. **Map to the design system** using the tables below. The Figma token names mirror the code names — the
   mapping is mostly mechanical.
4. **Build the widget** from the mapped primitives. Strip all web-isms from the reference code
   (flex/Tailwind/`<div>`); follow the existing widget patterns (`new-shared-widget`, `new-product-card`).
5. **Verify with a golden test** (`new-golden-test`) — render the widget with representative data and
   regenerate the golden. Compare the golden PNG to the Figma screenshot. Goldens catch layout crashes and
   spacing drift that unit tests miss.

## Mapping tables

### Spacing / padding / gaps
Figma px → `N.pxToW` (horizontal) or `N.pxToH` (vertical). The project scales raw px (`pxToW = px * .277 * .w`),
so **always** wrap design px in `pxToW`/`pxToH` — never use raw px.

| Figma | Flutter |
|-------|---------|
| `p-[12px]` (uniform) | `EdgeInsets.all(12.pxToW)` |
| `px-[8px] py-[4px]` | `EdgeInsets.symmetric(horizontal: 8.pxToW, vertical: 4.pxToW)` |
| `gap-[8px]` in a Column | `Column(spacing: 8.pxToW, …)` (or `Gap(8.pxToW)` between children) |
| `gap-[4px]` in a Row | `Row(spacing: 4.pxToW, …)` |
| width/height `80px` | `80.pxToW` / `80.pxToH` |

**Axis rule:** horizontal paddings/gaps/widths → `pxToW`; vertical paddings/heights → `pxToH`. (Most card code
uses `pxToW` for both for visual consistency — match the surrounding widget; vertical-only constraints like
`minHeight` use `pxToH`.)

### Radius & shadow
| Figma | Flutter |
|-------|---------|
| `rounded-[8px]` | `BorderRadius.circular(8)` |
| `drop-shadow … #09222D1A` | use `AppAnimatedCard` / existing card shell (don't hand-roll BoxShadow) |

### Colors — Figma token → `AppColors`
The Figma var name maps directly: `var(--dark/90,#3b3f42)` → `AppColors.dark90`; `var(--main/main-20,#d2ddee)`
→ `AppColors.main20`. Scale tokens exist for `dark03,05,08,10,15,20,30,40,50,60,70,80,90,100`,
`main04,08,12,20,30,100`, `green*`, `red*`, `white`.

| Figma | AppColors |
|-------|-----------|
| `--dark/100 #252a2d` | `AppColors.dark100` |
| `--dark/90 #3b3f42` | `AppColors.dark90` |
| `--dark/80 #515557` | `AppColors.dark80` |
| `--dark/60 #7c7f81` | `AppColors.dark60` |
| `--dark/50 #929496` | `AppColors.dark50` |
| `--dark/40` | `AppColors.dark40` |
| `--dark/10 #e9eaea` | `AppColors.dark10` |
| `--main/main-20 #d2ddee` | `AppColors.main20` |
| `--main/main-100` | `AppColors.main100` |
| price-badge bg `#e0f0fa` / text `#2c6e91` | grep `AppColors` for the matching token; **never** inline a `Color(0x…)` (lint-enforced) |

If a hex has no obvious token, `grep -i "<hex without #>" lib/core/utils/consts/app_colors.dart` to find the
named token. If it genuinely doesn't exist, flag it — do not hardcode the color.

### Typography — Figma text style → `AppText.*`
Figma `Text/{Size}/{Weight}` → `AppText.{size}{Weight}` (camelCase). Size by px:

| Figma px | size prefix | Figma weight | suffix |
|----------|-------------|--------------|--------|
| 12 | `xSmall` | Regular | `Normal` |
| 14 | `small` | Medium | `Medium` |
| 16 | `base` | SemiBold | `SemiBold` |
| 18+ / title | `large` / `smallTitle` / `largeTitle` | Bold | `Bold` |

Examples: `Text/Small/SemiBold` (14/600) → `AppText.smallSemiBold`; `Text/XSmall/Normal` (12/400) →
`AppText.xSmallNormal`; `Text/Small/Bold` (14/700) → `AppText.smallBold`; `Text/LabelTag` (12/700 UPPERCASE) →
`AppText.xSmallBold` with the text already upper-cased. Pass the color via the `color:` param. Confirm the
constructor exists: `grep "AppText\." lib --include='*.dart' -roh | sort -u`. **Never** use a raw `Text()`
(lint-enforced).

### Icons — **lucide first**, then custom SVG
The icon system is `flutter_lucide` (`LucideIcons.*`) wrapped by the `AppIcons` sealed class
(`lib/presentation/shared_widgets/app_icon.dart`), rendered with `AppIcon(icon: AppIcons.x, size: …, color: …)`.

1. **Identify the glyph** — `get_screenshot` the icon node (and/or read its layer name via `get_metadata`).
2. **Check lucide first.** Find the matching `LucideIcons.<name>` (e.g. seal-with-check → `LucideIcons.badge_check`,
   info → `LucideIcons.info`, list → `LucideIcons.list`, megaphone → `LucideIcons.megaphone`).
3. **Is it already in `AppIcons`?** `grep "LucideIcons" lib/presentation/shared_widgets/app_icon.dart`. If yes,
   use that `AppIcons.<name>`. If no, add `static const AppIcons <name> = DataIcon(iconData: LucideIcons.<name>);`.
4. **Not in lucide?** Then it's a custom SVG: add the asset under `assets/icons/`, an `AppPaths.assetX` const,
   and `static const AppIcons <name> = SvgIcon(path: AppPaths.assetX);`.
5. Use `AppIcon(icon: AppIcons.<name>, size: <px>.pxToW, color: AppColors.<token>)` — match the Figma icon
   size + color.

### Images
| Figma | Flutter |
|-------|---------|
| product image box `80×80`/`96×96` rounded | `AppContainer.productImage(imagePath: …, imageSize: 96.pxToW, padding: EdgeInsets.all(4.pxToW))` |
| product image with stock indicator | `AppContainer.inventoryProductImage(imagePath:, stock:, isLowStock:, imageSize:)` |

## Pitfalls (learned the hard way)

- **Don't blindly reuse a composite "convenience" widget.** A widget whose internal layout is `Row([…, Spacer(), …])`
  (e.g. `AppInventoryTile`) **crashes with `RenderFlex … unbounded width`** if placed as a non-flex child of
  another Row — wrap it in `Expanded`, or use plain text per the design. In PD-5444 this rendered the
  cycle-count card *blank*. When the design shows plain `Inventory: 80` text, build plain text — don't reach
  for a heavier composite that injects a chip/Spacer the design doesn't have.
- **Out-of-scope elements:** the design may show data the app doesn't have (e.g. a `0.33L` size badge). Drop it
  and note the deviation — confirm with the PO/user, don't invent a data source.
- **Verify the icon is the *right* one.** An empty-state showed per-type icons (list/cart/megaphone) when the
  design wanted a single compliance-check seal. The icon node in the comment is authoritative — pull it.
- **The reference code is React/Tailwind.** Convert to Flutter + this design system; never paste it or add
  Tailwind. Node IDs are in `data-node-id` attributes for traceability.
- **Always finish with a golden test.** Goldens caught a layout crash that 1000+ unit tests missed. Compare the
  golden PNG to the Figma screenshot before claiming "matches design".

## Canonical example

PD-5444 cycle-count card, rebuilt against Figma node `22626-18618`:
`AppAnimatedCard` (`padding 12`, `gap 8`, `radius 8`, `AppColors.main20` border) → top `Row(spacing: 8.pxToW)`:
`AppContainer.inventoryProductImage(imageSize: 96.pxToW)` + `Expanded(Column[name (smallSemiBold dark90),
index (xSmallNormal dark60)])` + price badge (`px8/py4`, `radius 8`, `AppColors.main20` bg, `smallSemiBold
main100`); bottom `Row(spaceBetween)`: plain `Inventory:` (label dark50, value dark100, `smallSemiBold`) ⟷
`Counted:`; split rows under Counted when enabled. Verified against
`test/.../cycle_count_summary/widgets/cycle_count_summary_card_golden_test.dart`.

## Checklist

- [ ] `fileKey` + `nodeId` extracted from the Figma link
- [ ] `get_design_context` pulled; exact paddings/gaps/radii/colors/fonts/icons read
- [ ] colors mapped to `AppColors` tokens (no inline `Color(0x…)`)
- [ ] text mapped to `AppText.*` (no raw `Text()`)
- [ ] spacing wrapped in `pxToW`/`pxToH` (no raw px)
- [ ] icons resolved lucide-first (`LucideIcons.*` via `AppIcons`), custom SVG only if not in lucide
- [ ] composite widgets checked for `Spacer`/unbounded-width hazards
- [ ] out-of-scope/missing-data elements dropped + noted
- [ ] golden test added/updated and compared to the Figma screenshot

## Lessons

When a mapping surprises you — a Figma token with no `AppColors` match, a lucide glyph that
doesn't exist, a composite widget that crashes on layout — capture it to the project's lessons
flow so the mapping tables and **Pitfalls** above can be updated. Don't leave the fix only in the
PR; the next run reads this skill, not your diff.
