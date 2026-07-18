# Project Profile — value-briefing

`value-briefing` ships as a project-agnostic **method**; every project-specific value it needs
lives in ONE committed file — `docs/value-model/profile.md` in the consuming repo — resolved at
Phase 0 of every run. This file is the **template** for that profile (four inputs, each with
guidance and a proposed default where one exists) plus a **complete synthetic worked example**.

A missing profile triggers the first-run intake (SKILL.md Phase 0) — one batched message asking for
these four inputs, with the proposed defaults below offered as a starting point. The answered intake
becomes the committed profile; a briefing never runs against an unresolved or assumed profile.

## The four inputs

1. **Value-model artifact path(s)** — where the validated value model lives in this repo: the
   value-model file and its provenance sidecar (the `docs/value-model/` artifacts the project pulls
   or governs). This is the **sole required input** and the single most project-specific one — no
   universal default. A briefing reads its KPI rows (pool, value weight, displacement mapping where
   sourced) and its coefficient register from here.

2. **Semantic-model bundle root** — where this project's semantic-model bundle lives, so a briefing
   can cross-reference a value-model row's construct join (`measureId` / `termId`) against the
   measured construct it names. This is what lets a number be labeled **measured** rather than
   **estimated**: a row whose construct join resolves against the bundle is measured-eligible.
   Described **abstractly on purpose** — name wherever the project actually keeps its bundle (a JSON
   bundle directory, a CSV trio, whatever the project's own semantic-model skills read); do NOT
   assume a specific grounding-root layout. No universal default.

3. **Model-feedback ledger location** — *optional*. Where the consuming project's model-feedback
   ledger lives, if it maintains one; a briefing loads that area's open entries as additional
   context. **May legitimately be absent or empty** — a consuming project that hosts no ledger is a
   valid configuration, not an error. Proposed default where one exists: `docs/model-feedback/{area}.md`.

4. **KB-source search order** — *optional enrichment*. The knowledge bases a briefing consults, in
   priority order, when a value-model provenance row cites a source. **Not a hard dependency**: the
   provenance rows carry their citations inline, so a briefing runs on the embedded provenance alone.
   Where a cited source is not locally reachable, the briefing runs anyway and discloses the
   unavailable source (SKILL.md's load step). No universal default — name every hub the project
   maintains, or declare none.

## Worked example — a synthetic profile (fictional project)

A complete filled profile for a **fictional** project. Every token here is invented — this skill
package embeds no real project's paths, ids, or values.

1. **Value-model artifact path(s):** `docs/value-model/value-model.json` + its sidecar
   `docs/value-model/provenance.json` (pulled read-only into this repo from the project that governs
   them).
2. **Semantic-model bundle root:** `docs/model/` — this fictional project's committed
   semantic-model bundle (measures, dimensions, terms). A value-model row citing
   `measureId: m_units_sold` is measured-eligible only if `m_units_sold` resolves here.
3. **Model-feedback ledger location:** *none* — this fictional consumer hosts no ledger. A briefing
   loads no open entries and treats the empty ledger as a legitimate configuration.
4. **KB-source search order:** (1) the value model's own inline provenance citations; (2) a
   fictional companion KB at `docs/kb/value-notes/`. A cited source not reachable under this order is
   disclosed in the briefing, never silently dropped.
