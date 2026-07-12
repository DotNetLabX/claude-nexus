# F1-NotesPlugin — nexus-notes: the notes-pipeline surface as an extension plugin

**Traces to:** ratified proposal `D:\omnishelf\omnishelf-docs\docs\proposals\2026-07-12-omni-notes-plugin.md` (graduated per ADR-28); ADR-56 (plugin composition), ADR-57 (config mechanism)
**Source:** Ratified proposal 2026-07-12 — **scope superseded by owner 2026-07-12**: the proposal shipped consumers only ("producer side out of scope"); the owner expanded scope to the full notes suite (producers + consumers) during F1 shaping. The proposal's Out-of-scope line is superseded, not re-litigated.
**Dependencies:** None (hub-split Phase 1 executed 2026-07-12; producers live in omnishelf-pipeline, consumers in omnishelf-docs — both are source material, not blockers)
**Status:** Ready
**Plan:** `docs/specs/F1-NotesPlugin/delivery/plan.md`

---

## Purpose

One shared, versioned home for the meeting-notes pipeline surface — producers (fetch + extract) and consumers (search + claim) — shipped as the **`nexus-notes`** extension plugin in this marketplace and cloned as **`omni-notes`** into claude-omni (established gen-omni flow). Today these skills live as per-repo copies with hardcoded sibling paths; per-repo copies are documented to drift (F33 search-notes fork, slack-voice extraction lesson). A plugin makes onboarding a consumer "install + configure," not "copy and re-path," and a fix lands everywhere at once.

## Scope — two waves, one plugin, one feature

**Wave 1 — consumer surface** (unblocks Phase-2 workspace repos):
- `search-notes` skill — search/rank the unclaimed-notes inbox (generalized from omnishelf-docs' repo-local skill).
- `claim-notes` skill — confirmation-gated claim: present matches → user confirms → move to `docs/specs/{slug}/definition/notes/` → stamp `claimed_by`/`claimed_at` frontmatter (today three bullet lines in the omnishelf-docs adapter rule; becomes a first-class skill).
- The **notes config file** + **thin adapter-rule template** (ADR-57) — per-source configuration read by all plugin skills.
- The **note frontmatter schema** shipped as a plugin reference — the producer↔consumer contract (source: omnishelf-pipeline `conventions/note-schemas.md`).
- Plugin scaffold, marketplace entry, gen-omni clone wiring, release.

**Wave 2 — producer surface** (after live routine registration in omnishelf-pipeline stabilizes):
- Skills: `fetch-transcripts` (Drive → `transcripts/` staging, `_sync.yaml` watermark), `fetch-slack` (channel registry → `slack-pulls/` staging, per-channel watermarks), `meeting-to-notes` (transcript → per-topic notes; multi-file `phases/` structure), `slack-to-notes` (pull triage → notes/review routing; `phases/` structure).
- Agents: `notes-extractor`, `slack-extractor`, `notes-critic` — re-homed with **model tier names** (e.g. `opus`, `sonnet`), never pinned version IDs (today pinned: `claude-opus-4-8`, `claude-sonnet-4-6`).

## Contracts

**Notes config file (per consumer repo; exact name/schema is plan material — ADR-57 fixes the mechanism).** Must express, per **source**:
- source id and kind (`meetings`, `slack`; open to future kinds e.g. `teams`)
- staging location (where fetch writes, extract reads — e.g. `transcripts/`, `slack-pulls/`)
- notes inbox root (where extract writes, search/claim read — default `../omnishelf-pipeline/docs/meeting-notes/` when no config present, preserving today's consumers)
- source-specific registry reference (e.g. the Slack channel registry) and enabled/disabled state
- optional agent model-tier overrides

**Adapter-rule template (behavior only).** A thin per-repo rule carrying behavioral triggers — "search the inbox before shaping or updating any spec" (today `meeting-context.md`). Structured facts live in the config file, never in the rule. Extension plugins ship no always-on rules (only base `nexus` has injection machinery), so the plugin ships this as a documented template the consumer copies.

**Note frontmatter schema.** The fields search/claim filter and rank on (`domain`, `tags`, `type`, `confidence`, `status`, `completeness`, `meeting_date`, …) and producers stamp. Ships as a plugin reference doc; producers and consumers both cite it. On drift: supersede the plugin copy, never fork per repo.

**Claim mechanics (invariant).** Present matches → user confirms → move file → stamp `claimed_by: {slug}`, `claimed_at: {ISO date}`. **Never claim without explicit confirmation.**

## Flows

```
Flow 1: PO claims notes in a consumer repo (wave 1)
1. PO runs search-notes with filters (domain/tags/type/date/confidence/keyword)
2. Skill resolves the inbox root from the notes config (or documented default), returns ranked table
3. PO runs claim-notes for selected rows
4. Skill presents the selection, asks for confirmation
5. On confirm: files move to docs/specs/{slug}/definition/notes/, frontmatter stamped

Flow 2: producer run in the pipeline repo (wave 2)
1. Routine (or user) invokes fetch-transcripts / fetch-slack — staging updated, watermark stamped
2. Routine (or user) invokes meeting-to-notes / slack-to-notes — extractor agent + notes-critic produce
   schema-conformant notes into the configured inbox (flagged) or review/ (unflagged)

Flow 3: new consumer onboarding
1. Repo declares the plugin (committed .claude/settings.json — cloud-confirmed) or installs locally
2. Repo adds its notes config file (sources, paths) + copies the adapter-rule template
3. search/claim (and producers, where relevant) work against that repo's configured roots
```

## Business Rules

1. `search-notes` is read-only — it never moves, edits, or claims a note.
2. `claim-notes` never claims without explicit user confirmation in that session.
3. Shipped skill bodies contain no hardcoded consumer paths; every path resolves via the notes config file, with the single documented default (`../omnishelf-pipeline/docs/meeting-notes/`) when no config exists.
4. Config is **per source**; unknown source kinds are representable without a plugin change.
5. Shipped agents declare model **tiers**, never pinned model version IDs.
6. All shipped files are UTF-8 without BOM.
7. The plugin is cloud-viable: installable from a repo-committed `.claude/settings.json` (research-confirmed 2026-07-12, `omnishelf-docs docs/kb/research/2026-07-12-cloud-routines-plugin-support.md`); the private omni marketplace needs a `GITHUB_TOKEN` env var in routine settings.
8. `omni-notes` is generated from `nexus-notes` by `gen-omni.mjs` — never hand-edited (ADR-6 discipline).
9. Wave 2 re-grounds every producer skill against the live omnishelf-pipeline source at implementation time — the hub copies keep evolving until the plugin ships.

## Acceptance Criteria

Wave 1:
- [ ] `plugins/nexus-notes/` exists with `.claude-plugin/plugin.json` (version 0.1.0), `CHANGELOG.md`, and the two consumer skills; marketplace.json lists `nexus-notes`.
- [ ] `search-notes` resolves its root from the notes config; with no config it uses the documented default. No other hardcoded consumer path appears in any shipped skill body (grep-checkable).
- [ ] `claim-notes` refuses to move files without an explicit confirmation step and stamps `claimed_by`/`claimed_at` on claim.
- [ ] The note frontmatter schema reference ships in the plugin and both skills cite it.
- [ ] The adapter-rule template ships as a documented reference (not an injected rule).
- [ ] The gen-omni wiring (mirrorPlugin line + marketplace entry) lands with a green fixture test; `node scripts/gen-omni.mjs` produces `plugins/omni-notes` in the omni twin and the omni commit follows the twin convention — the live run may be deferred by the concurrent-tree guard (plan Step 6), in which case the deferral is recorded as owed in implementation.md and this criterion stays open until the sync lands.
- [ ] All shipped files pass a UTF-8-no-BOM check.
- [ ] ADR-56 and ADR-57 are in the register; backlog row F1-NotesPlugin exists and tracks status.

Wave 2:
- [ ] The four producer skills and three agents ship in `nexus-notes`; agents declare model tiers only (grep: no `claude-*-4-*` pinned IDs under `plugins/nexus-notes/`).
- [ ] Producer skills resolve staging/inbox/registry paths via the notes config (same rule 3 grep gate).
- [ ] A minor version bump releases wave 2 (new capability — MINOR per release policy).
- [ ] omnishelf-pipeline can run its routines against the plugin-shipped skills with repo-local config only (verified in that repo as a coordinated follow-up, not in this repo).

## Out of Scope

- **Routines** (`transcript-processor`, `slack-processor`) — account/schedule-bound; stay repo-local in omnishelf-pipeline. The plugin ships what they invoke.
- **Consumer-repo rewiring** — replacing omnishelf-docs' local `search-notes` + adapter claim bullet, and omnishelf-pipeline's local producer skills, with the plugin: coordinated follow-up passes in those repos, never unilateral from here.
- **KG runtime retrieval** — different consumer, different medium (F33 eval loop covers that drift).
- **`hot-backlog-from-slack` / Machine-2 triage** — not built yet in the hub; nothing to package.
- **Retiring hub-local copies** — happens in the consumer repos after the plugin proves itself.

## Open Questions

None — the shaping decisions (scope supersede, slug, config mechanism, review mode) were taken by the owner on 2026-07-12 during F1 shaping.
