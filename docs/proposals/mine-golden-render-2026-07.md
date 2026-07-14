# Proposal — mine-golden-render: a golden/UI miner sibling for the rendering layer (parked, not ratified to build)

**Status:** Draft
**Decision-maker:** ldumit (owner)
**Recommendation:** Track this as a parked, unratified proposal — do **not** build now. The defect
being closed by this document is that Entry 11 was untracked in every registry; tracking closes that.
Building the sibling is a separate, much larger bet the owner is explicitly not taking today. Revisit
only if the precondition below is met.
**Confidence:** High — the "do not build now" recommendation rests on the owner's direct decision
(2026-07-14), not on a projection. The one thing that *would* change the answer — a consuming-repo
commitment to broad UI coverage — is named as an open, unmade product decision (see Unresolved #1),
not assumed either way.
**Impact:** 5 — conditional. Real (scales with UI surface: 25+ screens, ~70 shared widgets, a
15-screen split wave W7 in the pilot repo) only if the broad-UI-coverage precondition is later met;
zero today because that commitment has not been made and this proposal does not ask for it.
**Effort:** med — same shape and magnitude as `mine-verify-flows` (method skill in `nexus` + Flutter
adapter in `nexus-flutter`; see Approach).
**Date:** 2026-07-14

## Need

`docs/plugin-feedback/omni-1.22.0-2026-07-05.md` Entry 11 (lines 147-165, "skill gap — a golden/UI
'miner' sibling for the rendering layer") proposes a rendering-layer sibling to `mine-verify-cover`.
The entry was logged as a candidate for the operator to decide but never entered any tracked
registry (`docs/proposals/`, `docs/backlog.md`) — it sat only in the raw feedback file. That is the
actual defect this document closes: **the untracked state**, not a missing skill.

The entry's own author left the idea explicitly open and conditional, not a request to build:

> golden state-enumeration needs design-intent judgment (which states matter); goldens pin the
> CURRENT render (pins wrong UI if the current UI is wrong) and are env-brittle. So worth building
> ONLY if committing to broad UI coverage; for a bounded set, `new-golden-test` + developer judgment
> during standard dev suffices.

That precondition — a commitment to broad UI coverage — is a **consuming-repo product decision that
has not been made**. The value this sibling would produce lives in the consuming repo's UI surface,
not in nexus itself, so nexus cannot unilaterally decide it is worth building. Building it now would
be committing engineering effort against an unmade product bet.

Out of scope for this document: designing the skill, writing its SKILL.md, or scoping its stage
prompts. This proposal only records the idea, its shape, its cost class, and the gap that blocks it —
exactly the "track, don't build" instruction it exists to satisfy.

## Approach

**What it would be.** A 9th member of the mine family. The registry table
(`plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md:13-20`) currently lists 8
members (the file's own heading calls it "the eight-member mine family," line 3) — `mine-verify-cover`
(+ its `mine-from-spec` mode), `mine-verify-repo`, `mine-reference-model`, `mine-semantic-model`,
`mine-design`, `mine-algorithm`, `mine-verify-flows`. Using that table's own column vocabulary (`Mine
| Unit | Ground truth | Gate | Output`), the proposed sibling would read:

| Mine | Unit | Ground truth | Gate | Output |
|------|------|--------------|------|--------|
| `mine-golden-render` (proposed, NOT built) | one widget + its render-state contract | rendered golden images (characterization-of-render) | golden diff on render-state, plus an OPTIONAL mutation-of-widget strength check | golden test suite (one baseline image per render state) |

The framing (from Entry 11, and consistent with the family's existing code-arm/spec-arm split):
`mine-verify-cover` fits logic classes — mutants over pure logic. The rendering layer has little pure
logic of its own; its behavior *is* the rendered output. Goldens are the right net for that, not
mutation-gated rule tests — mutation-of-widget (layout/color/text) becomes the goldens' strength gate,
the rendering-layer analog of the mutation floor.

**The sketch (kept as a sketch — not a design; this document does not design the skill).** From
Entry 11, unchanged:

1. Read a widget + its bloc-state/props contract.
2. Enumerate the distinct render states — the golden equivalent of "rules" in `mine-verify-cover`.
3. Generate + baseline one golden per state via the existing `new-golden-test` skill.
4. OPTIONAL strength gate: mutate the widget's layout/color/text and confirm a golden diff fires —
   the golden analog of the mutation floor.

**A scope gap the entry does not acknowledge.** Step 3 above says to generate goldens "via the
existing `new-golden-test` skill." Re-grepped for this proposal: `new-golden-test` does not exist as
a shipped `nexus`/`nexus-flutter` skill. The only hits across `plugins/` are three passing mentions
inside `plugins/nexus-flutter/skills/figma-to-flutter/SKILL.md`:

- line 28 — "**Run or generate the golden itself** — it hands off to `new-golden-test` for
  verification" (an explicit non-goal of `figma-to-flutter`).
- line 30 — "This skill assumes the **omnishelf-family design system**: `AppColors` / `AppText` /
  `pxToW`-`pxToH` and the companion presentation skills (`new-golden-test`, `new-product-card`,
  `new-shared-widget`). In a Flutter project without those primitives and skills, treat the mapping
  tables below as a worked example to adapt — not a literal API."
- line 60 — "Verify with a golden test (`new-golden-test`) — render the widget with representative
  data and…"

So `new-golden-test` is a **project-local** companion skill in the pilot repo's own
(omnishelf-family) design system — `figma-to-flutter` explicitly treats it as an external dependency
it assumes but does not ship, and flags that assumption as something to adapt away in a project that
lacks it. Entry 11's sketch quietly inherits that same unshipped dependency. A nexus-shipped
`mine-golden-render` therefore cannot delegate step 3 to "the existing skill" the way the entry
implies — either nexus would need to own/abstract golden creation itself (widening scope past the
entry's four-step sketch), or the method would have to be scoped as consuming a project-local
capability it cannot guarantee exists, which is a materially different (and weaker) shape than every
other mine-family member, all of which are self-contained.

**Cost/shape, if ever built.** A method skill (`nexus`) + a Flutter adapter (`nexus-flutter`) — the
same shape and magnitude as `mine-verify-flows`, which shipped as nexus 1.34.0 / nexus-flutter 0.4.0
in commit `988075b` ("port `mine-verify-flows` method + flutter adapter from the omni twin"). Two
differences from that port matter here:

- `mine-verify-flows` was a **mechanical port** of work already designed and running in the omni
  twin — it did not require fresh PO/architect design, which is why it could ship under an
  `adhoc-MineVerifyFlowsPort` slug.
- `mine-golden-render` does not exist anywhere yet — it would be **fresh design**, not a port. Per
  ADR-58 (`plugins/nexus/rules/agents-workflow.md:17`, re-verified for this proposal): "Any unit of
  work shaped with the PO or designed with the architect — regardless of source (fresh idea, external
  or ratified proposal, tracker item, owner directive) — is a feature: it takes an `F{N}` (or
  tracker-key) slug and is recorded as a row in `docs/backlog.md` when that file exists. `adhoc-{Name}`
  is solo-only." A from-scratch `mine-golden-render` build is squarely a "designed with the architect"
  unit, so it would need an `F{N}` slug, a `docs/backlog.md` row, and a PO shaping pass — never the
  `adhoc-`/solo lane.

**Explicit non-overlap with `mine-verify-flows`.** This is a distinction the estate has already
collapsed once and is worth stating plainly: `mine-verify-flows` (the family's 8th member,
`mine-family-core.md:20`) mines **JSON flow goldens** — its ground truth is "routes/screens/blocs +
on-device output documents," and its gate is a flow-level golden comparison (canonicalize -> scrub ->
compare) over structured on-device output. Entry 11 is **widget-render goldens** — pixel/render-tree
characterization of a single widget's visual output per state. Different unit, different ground
truth, different artifact class (structured JSON documents vs. rendered images). `mine-verify-flows`
does not cover Entry 11's gap; the two would be siblings, not overlapping members.

## Benefits

- Closes the actual defect: Entry 11 stops being an orphaned line in a raw feedback file and becomes
  a discoverable, citable record in `docs/proposals/`.
- Preserves the entry's own conditionality faithfully — a future reader (PO, architect, or the owner)
  can act on it without re-deriving the precondition from the feedback file.
- Surfaces the `new-golden-test` scope gap now, before anyone scopes a build assuming the entry's
  sketch is complete as written.
- Costs nothing today — no skill is built, no plugin file changes, no version bump.

## Alternatives

- **Build it now, matching the entry's sketch as-is.** Rejected by the owner (2026-07-14): the
  precondition (a broad-UI-coverage commitment) is unmet, and it is a consuming-repo product decision
  nexus cannot make on the consuming repo's behalf.
- **Leave it in the raw feedback file, untracked.** Rejected: that is the exact defect this proposal
  exists to close — an idea with real conditional value sitting undiscoverable outside any registry.
- **Ratify it now as a direction, without committing to build.** Considered and rejected: per ADR-28,
  ratification graduates a proposal toward a tech-spec / backlog row (ADR-29) — that would mis-signal
  intent to build against an unmet precondition. Draft/unratified (staying in the idea inbox per
  ADR-29) is the accurate state.
- **Fold this into the `mine-verify-flows` sibling instead of a new member.** Rejected: different unit
  and ground truth (widget-render images vs. flow-level JSON documents); forcing them into one skill
  would blur two distinct gates the way the family's routing-boundary section
  (`mine-family-core.md`, "Routing boundary" section) explicitly warns against doing for other
  sibling pairs.

## Unresolved

1. **The precondition itself:** is broad UI coverage being committed to in the consuming repo? This
   is the single fact that would unblock a build. If not, Entry 11's own fallback stands: the
   project-local `new-golden-test` skill plus developer judgment during standard dev suffices for a
   bounded set of widgets.
2. If the precondition is later met, who owns closing the `new-golden-test` scope gap (point above) —
   does `mine-golden-render` ship its own golden-generation mechanism, or does it formally require a
   project-local companion skill as a stated prerequisite (the same posture `figma-to-flutter` already
   takes)?
3. Which consuming repo would be the first target, and does its design-system primitives
   (`AppColors`/`AppText`/`pxToW`-`pxToH`-shaped) generalize the way `figma-to-flutter`'s mapping
   tables already assume, or would a first build need to re-derive that from a project without them?

## Graduate-to-spec

Not applicable while this proposal remains unratified. Per ADR-28, graduation to a tech-spec (the
technical branch, since this is a method/skill decision with no product "what" of its own beyond the
consuming repo's UI) happens only on ratification; per ADR-29, an unratified proposal stays the idea
inbox in `docs/proposals/` rather than becoming a `docs/backlog.md` row. If the owner later ratifies
this (triggered by Unresolved #1 resolving toward "yes, broad coverage is committed to"), it re-slugs
as an `F{N}` feature per ADR-58 and proceeds through PO shaping, never through the solo/`adhoc-` lane.

## Provenance

Source: `docs/plugin-feedback/omni-1.22.0-2026-07-05.md`, Entry 11 (lines 147-165), from the
`mine-verify-repo` pilot run `mvr-pilot-1-2026-07-04` on `omnishelf_flutter_app`. Written by Solo
2026-07-14 at owner direction, to record a decline-for-now decision the owner made the same day —
tracking the idea without building it.
