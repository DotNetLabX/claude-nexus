# F1-NotesPlugin — Implementation Plan (Wave 1)

**Feature Spec:** `docs/specs/F1-NotesPlugin/definition/spec.md`

## Context

The notes-pipeline surface lives as per-repo copies (producers in omnishelf-pipeline, consumers in omnishelf-docs) with hardcoded sibling paths — a documented drift class. This plan builds the **`nexus-notes`** extension plugin's wave 1 (consumer surface) in this marketplace repo. Governing decisions: ADR-56 (composition, two waves, generated omni-notes clone), ADR-57 (per-source config file + thin adapter rule).

## Scope

**In scope (wave 1):** plugin scaffold + marketplace entry; `search-notes` and `claim-notes` skills; the notes-config / note-schemas / adapter-rule-template references; `gen-omni.mjs` clone wiring; release 0.1.0.

**Out of scope:** everything in the spec's Out of Scope section, and **wave 2 (producers)** — planned as a **revision of this plan** when the owner green-lights it (`Owner: operator` precondition: omnishelf-pipeline routine registration stable). Wave 2 is deliberately not pre-planned: its source surface (live producer skills, stood up 2026-07-11/12) is still moving, and pre-planned steps would need full re-grounding anyway (plan-grounding rule: revision passes re-ground changed surfaces). Known wave-2 facts for the future revision: 4 skills (`fetch-transcripts`, `fetch-slack`, `meeting-to-notes` v2.6.0 with `phases/`, `slack-to-notes` v1.1.0 with `phases/`), 3 agents with pinned model IDs to convert to tiers, `gen-commands.mjs` already supports any plugin with an `agents/` dir (`scripts/gen-commands.mjs:1-3`), wave-2 release is a MINOR bump.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Scaffold from nexus-analytics structure | No scaffold skill for marketplace plugins — log to lessons.md |
| 2 | (none) | — | no | Three reference docs (contracts, not patterns) | — |
| 3 | improve-skills | Follow | no | search-notes generalization inputs (below) | |
| 4 | improve-skills | Follow | no | claim-notes authoring inputs (below) | |
| 5 | (none) | — | no | Two-line gen-omni wiring + fixture test | — |
| 6 | release-plugin | Follow | no | New plugin 0.1.0; concurrent-tree guard (below) | |

TDD is `no` throughout: wave 1 ships prose skills, reference docs, and two wiring lines in `gen-omni.mjs` — no runtime behavior with a test seam beyond the repo's existing lint/unit suites, which gate every step.

## Domain Model Changes

None — prose artifacts and build-script wiring only.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Scaffold `plugins/nexus-notes` + marketplace entry

- Create `plugins/nexus-notes/.claude-plugin/plugin.json` with the **full field set** (this list is the gate — no lint checks `dependencies`): `name: nexus-notes`, `version: 0.1.0` (new-plugin precedent: nexus-cpp started 0.1.0), `description` (the notes-pipeline consumer/producer surface for meeting-notes pipelines), `author`, `keywords`, and **`dependencies: ["nexus"]`** — the ADR-3/ADR-56 extension declaration (compare `plugins/nexus-analytics/.claude-plugin/plugin.json`).
- Create `plugins/nexus-notes/CHANGELOG.md` with the 0.1.0 entry.
- Add `{ "name": "nexus-notes", "source": "./plugins/nexus-notes" }` to `.claude-plugin/marketplace.json` after `nexus-analytics` (line 34).
- Structure exemplar (feature-specific surface, not a pattern skill): `plugins/nexus-analytics/`.
- Accept: `node --test tests/lint/*.test.mjs` green for the new plugin (frontmatter schema, CHANGELOG↔plugin.json version match).
- Satisfies: AC wave-1 #1.

### Step 2 — Author the three shared references (contracts before consumers)

All under `plugins/nexus-notes/skills/search-notes/references/` (family precedent: the shared mine-family core lives in one skill's `references/` and siblings cite it — `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`):

- `notes-config.md` — the ADR-57 contract: config file at consumer-repo path `.claude/notes.config.yaml`; one entry per source (`id`, `kind: meetings|slack|…` open enum, `staging`, `inbox`, `registry`, `enabled`), optional `models:` tier-override block; full example; the documented no-config default inbox `../omnishelf-pipeline/docs/meeting-notes/`. This file is the **only** place the default path is normative.
- `note-schemas.md` — **the consumer field-set contract, not a verbatim port.** Source `D:\omnishelf\omnishelf-pipeline\conventions\note-schemas.md` is a 534-line producer-side contract; extract only what search/claim filter, rank, and stamp on: the frontmatter fields (`domain`, `tags`, `type`, `confidence`, `status`, `completeness`, `meeting_date`, `meeting`, `topic`, the claim stamps `claimed_by`/`claimed_at`), each field's type/enum semantics, and the note-category folders (`product/`, `strategy/`, `review/`). Read the live file at implementation time. **Scrub list (the source fails all three original gates silently):** strip the leading UTF-8 BOM; fix the 5 mojibake em-dash sequences (`â€”`); carry over **no** hub-internal references — the source has 26 (`.claude/agents|scripts|skills/…`, `docs/proposals/…`, `kb/…`) and none may ship (gate G4). The full producer contract (quote/owner contracts, extraction schemas, `verify-quotes` enforcement) returns with the wave-2 revision if needed — not now.
- `adapter-rule-template.md` — the behavioral template a consumer copies into its own rules (source material: `D:\omnishelf\omnishelf-docs\.claude\rules\meeting-context.md` — "search the inbox before shaping/updating any spec"), with a one-line pointer to the config file for all paths. **The template carries no literal inbox path** — the source rule's `../omnishelf-pipeline/docs/meeting-notes/` is generalized out, or G1 fails.
- Accept: all three exist, UTF-8 no BOM; `notes-config.md` contains the default path; G4 (Step 6) zero-hits; lint suite green.
- Satisfies: AC wave-1 #4, #5; BR 4.

### Step 3 — `search-notes` skill (generalized port) — Follow improve-skills

Follow improve-skills (scaffold per its skill-recipe, end with the skill-lint gate). Feature-specific inputs:

- Target: `plugins/nexus-notes/skills/search-notes/SKILL.md`. Source material (generalize, don't copy verbatim): `D:\omnishelf\omnishelf-docs\.claude\skills\search-notes\SKILL.md`.
- Keep: the parameter table (domain/tags/type/category/date/keyword/confidence/status/completeness/meeting), natural-language parsing, ranked-table output format, read-only guarantee, the claimed/summaries/transcripts exclusions.
- Change: every path resolves via the notes config (`references/notes-config.md`); the no-config default is stated once, citing that reference; frontmatter fields cite `references/note-schemas.md` instead of restating them; the "PO workflow integration" section is generalized — keep the search→review→claim→spec flow, drop hub-only machinery references (`meeting-to-notes --re-extract-note`, `bug-to-ticket`, the po.md post-meeting cadence — those return with wave 2 or stay repo-local).
- Frontmatter: the source declares `triggers:`, `args:`, `argument-hint:` — **drop them**; plugin skills declare only the `SKILL_KEYS` closed set (`tests/lint/frontmatter.test.mjs:18` — `name`, `description`, `user-invocable`, `disable-model-invocation`). **Do not add a skiplist exemption** (the nexus-flutter entry at `:29` is legacy precedent, not a pattern to copy).
- Accept: skill-lint green; grep gate G1 (Step 6) covers the path discipline.
- Satisfies: AC wave-1 #2, #4; BR 1, 3.

### Step 4 — `claim-notes` skill (new) — Follow improve-skills

Follow improve-skills. Feature-specific inputs:

- Target: `plugins/nexus-notes/skills/claim-notes/SKILL.md`. Source mechanics (one bullet chain spanning `D:\omnishelf\omnishelf-docs\.claude\rules\omni-project-adapter.md:110-112`): present matches → user confirms → move to `docs/specs/{slug}/definition/notes/` → stamp frontmatter `claimed_by: {slug}`, `claimed_at: {ISO date}`.
- Hard rule, stated as such in the skill: **never claim without explicit user confirmation in-session**; refusing to proceed without it is the correct behavior, not an error.
- Inputs: a search-notes result selection (row numbers or file paths) + the target `{slug}`; inbox root resolves via the notes config exactly as in Step 3.
- Edge cases the skill must state: file already claimed (frontmatter present) → skip with notice; destination exists → never overwrite, surface; partial confirmation → move only confirmed rows.
- Accept: skill-lint green; the confirmation gate is stated as a hard rule (grep: `never claim without` present in the skill body).
- Satisfies: AC wave-1 #3; BR 2.

### Step 5 — `gen-omni.mjs` clone wiring

- `scripts/gen-omni.mjs`: add `mirrorPlugin('nexus-notes', 'omni-notes');` after the `nexus-analytics` line (currently line 103) and `{ name: 'omni-notes', source: './plugins/omni-notes' }` to `wantPlugins` (currently ends line 121).
- Fix and extend `tests/unit/gen-omni.test.mjs` — the new mirrorPlugin line turns the **current** test red two ways before any extension: (a) the sandbox `before()` block seeds only the six existing plugins (`:27-34`), so gen-omni hits ENOENT on `plugins/nexus-notes` and the `status, 0` asserts (`:49`, `:67`) fail — seed a minimal `plugins/nexus-notes` fixture there; (b) the expected-names array at `:58` omits `omni-notes` — add it. First-of-kind execution is covered by this fixture run, not by a live run.
- Do **not** run gen-omni against the real omni repo in this step — see Step 6 guard.
- Accept: `node --test tests/unit/*.test.mjs` green including the extended fixture.
- Satisfies: AC wave-1 #6 (wiring half); BR 8.

### Step 6 — Release wave 1 — Follow release-plugin

Follow release-plugin. Feature-specific inputs and gates:

- New plugin ships at its authored `0.1.0` — no bump needed for nexus-notes itself; if any *shipped* file of another plugin was touched (should be none), the dry-run reasons list must name only F1 files — **a reason naming a concurrent feature's file means stop and hand the bump to that session** (CLAUDE.md release rule; the tree currently carries uncommitted adhoc-MineSkillAuthoring work).
- **Concurrent-tree guard:** run `node scripts/gen-omni.mjs` and the omni twin commit **only when `git status` shows no other feature's plugin files dirty** — gen-omni mirrors the working tree, so a dirty tree contaminates the twin. If the tree isn't clean, the twin sync is deferred to whoever commits last (established concurrent-run practice) and recorded as owed in implementation.md.
- Known noise: `scripts/selfcheck.mjs`'s gen-commands check is git-HEAD-based and false-positives while another feature's agent edits are uncommitted — do not chase it; it resolves on that feature's commit.
- Grep gates, run after Steps 3–5 land (expected results below are the gate definitions; they run against files that don't exist at plan time):
  - **G1 (path discipline, BR 3):** `grep -rn "omnishelf" plugins/nexus-notes/` — hits allowed **only** in `references/notes-config.md` (the normative default + example) and at most one documented-default line per skill body citing that reference; **zero** hits matching `omnishelf-docs` or a drive-absolute path (`[A-Z]:\\`).
  - **G2 (no pinned models, BR 5):** `grep -rn "claude-[a-z]*-4" plugins/nexus-notes/` — zero hits.
  - **G3 (encoding, BR 6):** repo BOM check over `plugins/nexus-notes/**` — zero BOMs (the note-schemas source file carries one — Step 2's scrub strips it).
  - **G4 (no dangling hub references, closes the H1 blind spot — the source has 26 such refs with zero `omnishelf` literals, invisible to G1):** `grep -rnE "\.claude/(agents|scripts|skills)/|docs/proposals/|(^|[^-.\w])kb/" plugins/nexus-notes/` — **zero hits**. Legitimate `.claude/` mentions (`.claude/notes.config.yaml`, "copy into your `.claude/rules/`") don't match these patterns by construction.
- Accept: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green; G1–G4 pass; CHANGELOG 0.1.0 entry present; commit protocol per repo rules (content + versioning in one commit; omni twin commit per the twin convention when the guard allows).
- **AC6 satisfaction is split:** the wiring + fixture half closes in this step; the live `gen-omni` run + twin commit close only if the concurrent-tree guard allows — otherwise they are recorded in implementation.md as **owed** and AC6 stays formally open until the deferred sync lands. Do not mark AC6 fully satisfied under a dirty tree.
- Satisfies: AC wave-1 #1, #7, and #6's wiring half (live-twin half per the split above); BR 8.

### Step 7 — Close wave 1 bookkeeping

- `docs/backlog.md`: the F1-NotesPlugin row was **added at definition close** (2026-07-12; Impact 5, Effort high, Status `In Progress`) — update it: append "wave 1 shipped (nexus-notes 0.1.0)" to the title cell; Status stays `In Progress` (the feature closes with wave 2).
- Spec `Status:` was flipped to `Ready` at definition close (after the critic REVISE→fix cycle) — it stays `Ready`; ADR-56/57 already in the register (authored at definition time — verify presence, no edit needed).
- Accept: backlog row reflects wave-1 ship; `grep -n "ADR-56\|ADR-57" docs/architecture/README.md` returns both.
- Satisfies: AC wave-1 #8.

## Cross-Service Changes

None in-repo. Cross-repo consequences (omnishelf-docs/pipeline rewiring, omni marketplace publication) are coordinated follow-ups per the spec's Out of Scope.

## Migration Notes

None.

## Testing Strategy

The repo's existing suites are the harness: T1 structural lint (`tests/lint`) validates the new plugin's frontmatter/CHANGELOG/version coherence; T2 unit fixtures validate the gen-omni mapping; G1–G3 grep gates validate the plan's own invariants (path discipline, no pinned models, encoding). No runtime code ships in wave 1 beyond the two gen-omni lines, which the fixture test covers.

## KB Impact

None — this repo's KB (`docs/kb/research/`) needs no entry; the cloud-plugin research already exists in the omnishelf-docs pool and is cited by the spec.

## Decisions

| Decision | Why | Rejected alternative | Status |
|----------|-----|----------------------|--------|
| Shared references live in `search-notes/references/`, siblings cite them | mine-family-core precedent; plugins have no skill-independent references home | Top-level `plugins/nexus-notes/references/` (no loader/lint precedent) | decided |
| Config file is `.claude/notes.config.yaml` (YAML) | Note frontmatter and pipeline watermarks (`_sync.yaml`) are YAML; consumers already read YAML fluently | JSON (`skill-lint.json` precedent — but that's tooling, not agent-read config) | decided |
| Wave 2 is planned as a plan revision at owner green-light, not pre-planned here | Producer surface stood up 2026-07-11/12 and still moving; pre-planned steps would be stale by rule | Plan both waves now, split sub-plans | decided |
| gen-omni live run + twin commit gated on a clean tree | gen-omni mirrors the working tree; concurrent uncommitted features contaminate the twin | Regenerate immediately at Step 6 | decided |

## Open Questions

None.

## Plan Review

Code-grounded critic (opus, 2026-07-12): **REVISE** — 1 HIGH, 6 MEDIUM, 3 LOW; full findings + dispositions in `review-critic.md`. All findings fixed in this revision: Step 2 rewritten (consumer field-set scope + scrub list + new gate G4 for the hub-reference blind spot), Step 3 frontmatter key-drop added, Step 5 names the two red-first fixture edits, Step 6 splits AC6 satisfaction under the dirty-tree guard, Step 1 lists `dependencies: ["nexus"]` explicitly, Step 7 backlog/status wording grounded. The critic confirmed accurate: gen-omni two-line wiring sufficiency (lines 103/121/34), marketplace-driven lint discovery (no hardcoded list), all external-repo anchors, wave-2 facts, and the YAML config decision.
