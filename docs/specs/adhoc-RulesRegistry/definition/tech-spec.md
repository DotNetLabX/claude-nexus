# Tech-Spec — Business-Rules Registry: artifact species split + rename rollout

**Slug:** adhoc-RulesRegistry
**Type:** Technical feature — architect owns the definition (ADR-27). Graduated from
`docs/proposals/rules-registry-vertical-slice.md` (Ratified 2026-07-04) per ADR-28 — the proposal is
the exploration record; this spec is the implementable contract. Decisions are extracted, never
re-authored.
**Status:** **Ready** — code-grounded critic pass folded (REVISE → fixed, see `## Critic Review`).
One interpretive call flagged to the owner: code-only registries record un-mined facts as `untagged`
rather than inventing values (extends ratified resolution 2's graceful degradation).
**Depends on:** nothing pending — the Merge/C1 machinery this renames is shipped
(`adhoc-SddMergeGen`, ADR-40/43); the omnivision C++ campaign artifacts exist (nexus-cpp 0.1.3).
**Date:** 2026-07-04
**Plan:** `docs/specs/adhoc-RulesRegistry/delivery/plan.md`

---

## Context

The mined rule ledgers and merged registries currently land in `docs/kb/` — the same namespace as the
actual knowledge base (research pool, `kb-entry-schema` entries, graphify inputs). Two artifact
species share one folder and one word, and after a full two-arm run one class's truth is spread
across five files in three directories. The ratified decision (ADR-45): mined/merged rule artifacts
are their **own species** at `docs/business-rules/`, with ONE canonical flat registry per class over
linked evidence. Full rationale, alternatives, and the ratified resolutions live in the proposal —
not restated here.

## Contract R1 — the registry artifact

**Species glossary (exactly two live species — critic HIGH-1):**
- **Evidence** — the per-arm mining artifacts: raw arm ledgers, per-slug `spec-rules.md`, run
  reports, gate JSON. Immutable, lives under `docs/specs/{slug}/…` (its lifecycle home). Never the
  read target of a consumer.
- **The registry** — the ONE live rule file per class. **The Mine→Verify verified per-class entry IS
  the day-one registry** (today emitted to `docs/kb/<class>.md` in kb-entry-schema shape — that is
  its *current* home, and it MOVES; it does not stay put). Merge updates the same file in place on a
  two-arm run. There is no third live file.

- **Path:** `docs/business-rules/<area>/<unit>.md` in the consuming repo. Flat file per mined unit —
  no folder-per-class slice (ratified resolution 1a). `<unit>` is the mined unit's natural name (class
  name for OO stacks, file basename for free-function C++); `<area>` may be omitted in single-area
  repos.
- **Grammar:** the PD-5263 golden-registry row columns **as-is** (resolution 2): per-row
  `source: code | spec | both`, `status` (incl. `divergence-pending-triage`), `criticality`
  (`golden | core | edge`), `last_verified`. A code-only row simply carries `source: code`; a fact the
  arm never mined (e.g. `criticality` on C++ rows — the cpp fact/tier mapping is still deferred) is
  recorded as **`untagged`**, never invented and never a trimmed grammar variant (graceful
  degradation, extending resolution 2 — flagged to the owner in Status).
- **Invariants (unchanged from C1/ADR-43):** rows never deleted (disposition flips to
  `retire`/`supersede`), append-only changelog, idempotent re-run against unchanged input.
- **Day-one existence (resolution 3):** the registry exists after the code arm alone; consumers never
  wait for the spec arm.
- **Evidence is linked, not co-located:** the registry links to its evidence per row / in its footer.
  Executable tests stay in the build-owned test trees, mirroring the `<area>/<unit>` path.

## Rollout — two increments in this slice

**Increment 1 — C++-first move + convert (consuming repo + cpp adapter).**
Omnivision is the cheapest first mover (2 registries, zero other consumers). This is a **move AND
grammar conversion**, not a path-only move (critic HIGH-2 — the live files are kb-entry-schema
shaped and would violate Contract R1 at the canonical path):
- Move `docs/kb/hungarian.md` → `docs/business-rules/tracking/hungarian.md` and
  `docs/kb/levenshtein.md` → `docs/business-rules/planogram/levenshtein.md` (areas from the source
  tree: `src/trackers/sortcpp/`, `src/planogram/`).
- Convert each `## Rules` bullet to a registry row: `source: code`; `status` from the existing
  verify/mutation-gated footer; `last_verified` from the run record; `criticality: untagged`
  (Contract R1 grammar). Keep the kb-entry-schema context sections (Key Files, Edge Cases, Source)
  below the rows — additive, not conflicting.
- Update the `mine-verify-cover-cpp` artifact contract: the ledger emission at its `docs/kb/<class>.md`
  line (SKILL.md:118) becomes the registry path + row grammar. **Do NOT touch its `docs/kb/research/…`
  reference (SKILL.md:31)** — that is the research pool and stays under `docs/kb/` (critic MED-4).
- → **nexus-cpp 0.1.4** (PATCH — contract-text change, not new capability; owner may escalate).

**Increment 2 — cross-stack rename pass (this repo's shipped files).**
One maintenance pass (resolution 4 — not coupled to the next Flutter campaign), updating every
shipped file that names the old default path. **Shipped-text self-containment rule (plan-review
HIGH-2):** shipped skills never point load-bearing definitions at dev-repo-only documents — the core
skill's registry section enumerates the full row grammar inline and is THE shipped grammar reference;
`Contract R1`/`ADR-45` appear in shipped text only as parenthetical provenance tags, never as the
sole resolver.

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — the C1 default path (`docs/kb/golden/{Class}.md`
  → `docs/business-rules/<area>/<unit>.md`, SKILL.md:359) and the `## The KB rule-ledger` section
  (SKILL.md:244-246): retitle to the registry species and state the landing path explicitly — today
  that section has **no literal path** (it delegates to `kb-entry-schema`), so the lever is adding the
  path + retitling, not replacing a string (critic HIGH-1).
- `plugins/nexus/skills/kb-entry-schema/SKILL.md` — disambiguate: KB entries stay `docs/kb/`; the
  registry species points to `docs/business-rules/` with Contract R1 row grammar.
- `plugins/nexus/agents/solo.md`, `developer.md`, `architect.md` — the three attestation-drift hooks
  reference `docs/kb/golden/{Class}.md`; re-point to the new path AND soften the parenthetical from
  "a C2 attestation record at …" to "the class's registry at …" — otherwise the shipped text would
  describe a C2 record living at the C1 path (critic MED-6). The *trigger semantics* (attested golden
  set, C2) stay as-written; rebasing the trigger from C2 onto C1 is the successor slice, out of scope
  here. Regenerate commands after agent edits (`scripts/gen-commands.mjs`).
- `plugins/nexus-dotnet/…` + `plugins/nexus-flutter/…` adapters — conditional: a 2026-07-04 sweep
  found `docs/kb/golden` in exactly 7 shipped files (the 3 agent docs + their 3 generated commands +
  the core SKILL.md) and **none** in the dotnet/flutter adapters; the plan-phase grep re-verifies
  before touching them. `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` does reference
  `docs/kb/` ledger paths — that edit belongs to Increment 1.
- **Migration note** for the Flutter repo's existing `docs/kb/` ledgers + `docs/kb/golden/` registries
  (a short note in the core skill or adapter; the physical move happens in that repo's next touch).
- Version bumps: **PATCH by default** on each plugin whose shipped files change — a path rename is a
  contract-text change, not a new capability, so no auto-escalation; the owner escalates at release
  time if desired (critic LOW-7 — same tier logic as nexus-cpp in Increment 1). One bump per plugin
  after all edits land.

## Out of scope (queued successors, ratified order)

1. **Guardrail + review-rider consumer increment** — rebase the three inert C2-conditional hooks on
   the live C1 registries (pre-edit registry load + post-edit scoped skeptic), with rule-aware review
   riding the same trigger. Own slug, after this slice ships (it must point at the final path once).
2. **Cross-platform conformance spike** — find one genuinely shared-logic pair before any registry
   diff (premise checked 2026-07-04: zero rule-text overlap on today's registries).
3. **Graphify node-payload fusion** — deferred to its own spike. (Graph-*selected* coverage is
   ratified policy, not an implementation item here.)

## Acceptance criteria (grep-checkable)

- **AC-1:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` contains `docs/business-rules/` as the
  registry default path; `grep -r "docs/kb/golden/{Class}.md" plugins/` → **0 hits** (directive form
  retired); the bare `docs/kb/golden` may appear ONLY in the core skill's migration note (AC-4 names
  the old location by design) and `CHANGELOG.md` files — an enumerated whitelist, zero judgment calls
  (amended at plan review: the original "CHANGELOG-only" form contradicted AC-4's required note).
- **AC-2:** the three agent docs' attestation-drift hooks name `docs/business-rules/` (grep across
  `plugins/nexus/agents/{solo,developer,architect}.md`); regenerated `commands/*.md` match.
- **AC-3:** `kb-entry-schema/SKILL.md` states the KB-vs-business-rules species split.
- **AC-4:** a Flutter migration note exists naming the old `docs/kb/` + `docs/kb/golden/` locations.
- **AC-5a (this repo, grep-checkable):** nexus-cpp `plugin.json` ≥ 0.1.4 with a CHANGELOG entry
  naming the new artifact path + row grammar.
- **AC-5b (external evidence, not grep-checkable here — critic MED-5):** omnivision's 2 registries
  live under `docs/business-rules/` in Contract R1 grammar; the artifact of record is the consuming
  repo's run report (`D:\omnishelf\omnivision-ai-sdk\docs\specs\mvc-tests\delivery\mvc-report.md`,
  next entry).
- **AC-6:** registry grammar text unchanged apart from the path — `source:`/`last_verified`
  mandatory-per-row language retained (grep in the core skill).

## ADRs extracted

- **ADR-45** — the artifact-species split (name, flat layout, canonical-over-evidence, selection-based
  coverage). Extracted to `docs/architecture/README.md` at graduation, same session.

## Critic Review

Code-grounded critic pass, 2026-07-04 (fresh-context, live-file grounded; external-repo facts
PowerShell-verified after the Bash sandbox returned a fabricated filesystem view for the omnivision
paths). Verdict: **REVISE** → all findings folded, spec flipped to Ready.

| Finding | Severity | Disposition |
|---------|----------|-------------|
| HIGH-1 — ledger-vs-registry species ambiguous; Contract R1 misstated the ledger's current home | HIGH | Fixed — species glossary added; the Mine→Verify entry IS the day-one registry and MOVES from `docs/kb/<class>.md`; Increment-2 lever corrected (retitle + add path, not string-replace) |
| HIGH-2 — omnivision files are kb-entry-schema shaped; path-only move violates Contract R1 | HIGH | Fixed — Increment 1 is move+convert; un-mined facts recorded `untagged` (owner-flagged in Status) |
| MED-3 — `<area>/<Class>` template vs live flat/lowercase names | MED | Fixed — `<unit>` naming rule + two concrete target paths named |
| MED-4 — cpp adapter's research-pool ref at risk in a blanket rename | MED | Fixed — Increment 1 scoped to SKILL.md:118; :31 explicitly excluded |
| MED-5 — AC-5's external clause not repo-checkable | MED | Fixed — split into AC-5a/AC-5b with the artifact of record named |
| MED-6 — post-rename hooks would describe a C2 record at the C1 path | MED | Fixed — hook parenthetical softened at rename time; trigger semantics unchanged, rebase stays with the successor |
| LOW-7 — bump-tier asymmetry (PATCH vs MINOR) | LOW | Fixed — PATCH default across all four plugins, owner escalates at release |
| LOW-8 — AC-1's "historical text" needed judgment | LOW | Fixed — AC-1 now: hits only in CHANGELOG.md files |

## Cross-references

- Proposal (ratified source): `docs/proposals/rules-registry-vertical-slice.md`
- Registry machinery being renamed: `adhoc-SddMergeGen` (ADR-40/43), SddLifecycle C1
  (`docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` — historical doc, text stays as-written)
- Consuming-repo campaigns: omnivision `docs/specs/mvc-tests/…`, Flutter `PD-5263-mvc-tests`
