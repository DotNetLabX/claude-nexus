# F1-NotesPlugin — Review

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** (1) skill conformance on the two `improve-skills` steps + `release-plugin` step; (2) the split AC6 live-twin half being misread as Missing; (3) the G1–G4 grep gates actually holding on the shipped files vs. only claimed. All three checked directly against live files/log.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Scaffold `plugins/nexus-notes` + marketplace entry | Implemented | `plugin.json` (v0.1.0, `dependencies: ["nexus"]`, name `nexus-notes`), `CHANGELOG.md` `## [0.1.0]` matches manifest, `marketplace.json` entry present after nexus-analytics. Lint suite 49/49 green. |
| 2 — Three shared references | Implemented | `notes-config.md`, `note-schemas.md`, `adapter-rule-template.md` all present under `search-notes/references/`. G1/G3/G4 clean on references; default path present in `notes-config.md` only. Authored as a fresh consumer contract (not a scrub-in-place port), which is why BOM/mojibake/hub-refs had no channel into the shipped files. |
| 3 — `search-notes` skill — Follow improve-skills | Implemented | `SKILL.md` present; `improve-skills` invoked (log 16:27, in-scope). No omnishelf path in skill body (cleanest G1); cites `note-schemas.md`. |
| 4 — `claim-notes` skill — Follow improve-skills | Implemented | `SKILL.md` present; `improve-skills` invoked (log 16:30, in-scope). `never claim without` hard rule present (lines 15, 58); cites `note-schemas.md` via sibling-citation form. |
| 5 — `gen-omni.mjs` clone wiring | Implemented | Both sites landed: `mirrorPlugin('nexus-notes','omni-notes')` (`gen-omni.mjs:104`) + `wantPlugins` entry (`:123`). Both test fixes present: fixture seed (`gen-omni.test.mjs:35`) + `omni-notes` in expected-names (`:59`). Unit suite 462/462 green. |
| 6 — Release wave 1 — Follow release-plugin | Deviated (valid reason) | `release-plugin` invoked (log 16:35, in-scope), `--dry-run` only. New plugin correctly ships at authored 0.1.0 (no bump). G1–G4 all pass; CHANGELOG 0.1.0 present. **AC6 live-twin half (`node scripts/gen-omni.mjs` live run + omni twin commit) and the F1 commit are deferred to the closing session** under the plan-sanctioned concurrent-tree guard (Step 6 split) — the tree carries a concurrent feature's dirty docs. Pre-authored operator-owed fallback fired → Deviated, not Missing. **Operator-owed gate remains open** (see below). |
| 7 — Close wave 1 bookkeeping | Implemented | Backlog F1 row title cell appended "wave 1 shipped (nexus-notes 0.1.0)", Status stays `In Progress` (feature closes with wave 2); spec `Status: Ready` unchanged; ADR-56 (`README.md:1391`) + ADR-57 (`:1432`) present in register. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, scoped to session `17ce058a` / `agent:developer` / `token:developer:implement`):**
- Step 3 → `improve-skills` mapped, logged ✓
- Step 4 → `improve-skills` mapped, logged ✓
- Step 6 → `release-plugin` mapped, logged ✓
- Steps 1, 2, 5, 7 → `Skill: None` in plan (no requirement) ✓
- `## Skills Used` section present ✓; every self-reported invocation appears in the log (no fabrication). The `evaluate-skill` Judgment Gate was deliberately not run for Steps 3/4 — plan accept scopes the done-condition to skill-lint + grep gates, and the gate would be a pipeline-agent spawn the developer may not initiate. Warranted; documented as a Key Decision.

**`Satisfies:` existence cross-check (where present):** all cited referents resolve — AC wave-1 #1–#8 and BR 1–9 exist in the spec. Existence-validation only; the code→intent trace is the reviewer's Step-2 job.

**Plan-hygiene (`## Decisions`):** section present and non-silent (4 rows). No hygiene finding.

**Load-bearing gates re-run directly (shared/external-artifact pass):** G1 (path discipline — 3 hits, all in `notes-config.md`, zero in skill bodies, zero forbidden), G2 (no pinned models — zero), G3 (no BOM — zero), G4 (no dangling hub refs — zero), lint 49/49, unit 462/462 (511 combined, matches self-report).

**Operator-owed open gate (surfaced, not blocking):** AC6's live-twin half is formally open. At the closing session, on a clean tree: run `node scripts/gen-omni.mjs` then `node scripts/gen-omni.mjs --check` (expect exit 0), and commit the omni twin per the twin convention (subject mirrors the nexus F1 commit, scope = F1 slug, `(omni {version})` tag, body = plugin delta since last sync, footer `Generated from the nexus plugin (nexus {sha}).`). The mid-feature `gen-omni --check` selfcheck fail on the developer's stop is the documented uncommitted-`plugins/**` false positive — not a defect.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-12*

## Step 2 — Code Review

## Reviewed By
reviewer

## Verdict: APPROVED

## Pre-commitment Predictions
- Grep gates (G1–G4) would be claimed-but-not-actually-re-run-clean somewhere — re-ran all four directly against live files; all held exactly as claimed (G1: 3 hits, all in `notes-config.md`; G2/G3/G4: zero).
- Carried-over content from the omnishelf-docs source that survived "generalization" incompletely — the *path*-shaped leftovers (G1/G4) were clean, but found a *non-path* leftover: an example/output-format value in `search-notes/SKILL.md` that contradicts the freshly-authored `note-schemas.md` contract it's supposed to defer to (see Finding 1). Confirms the general risk class, wrong specific instance.
- AC6's gen-omni wiring being real vs. only self-reported — diffed `gen-omni.mjs` and `gen-omni.test.mjs` directly; matches the plan's two named edit sites exactly, unit suite re-run green (462/462).
- Cross-document consistency between the three references and the two skills that cite them (rather than restate) — found one gap (Finding 1) and one lower-confidence ambiguity (multi-source aggregation, Open Questions).
- Low risk on the marketplace/plugin.json plumbing given the close nexus-analytics precedent — confirmed, byte-for-byte structural match plus a fresh `claude plugin validate --strict` pass.

## Findings

### [MEDIUM] `search-notes` output format contradicts the note-schemas.md confidence contract it's supposed to defer to
**File:** `plugins/nexus-notes/skills/search-notes/SKILL.md:88,93` vs `plugins/nexus-notes/skills/search-notes/references/note-schemas.md:25`
**Origin:** implementation
**Issue:** `note-schemas.md` (Step 2, freshly authored per plan) defines `confidence` strictly as `integer (1–10)` with no documented fallback for a missing/unset value — unlike `completeness`, which explicitly states "a note without the field counts as `unverified`." Yet `search-notes/SKILL.md`'s own worked example (line 88) shows a note with `Confidence: pending`, and its output-format template (line 93) reserves a fourth rollup bucket, `**Pending validation:** {count}`, alongside the three confidence-threshold buckets. Neither the skill body nor the schema reference defines what "pending" means, when a note qualifies for it, or how it differs from a note simply lacking the field. Traced this to the source: confirmed byte-identical wording in `D:\omnishelf\omnishelf-docs\.claude\skills\search-notes\SKILL.md` (same example row, same four-bucket footer) — it is an unreconciled leftover from the port, not a fresh authoring choice. Plan Step 3's explicit instruction was "frontmatter fields cite `references/note-schemas.md` instead of restating them" — this is a restatement that additionally *contradicts* the schema it should defer to, which the plan's G1/G4 grep gates (path- and hub-ref–shaped) have no way to catch since the defect isn't a path or a hub reference.
**Fix:** Either (a) add a `confidence`-missing fallback to `note-schemas.md` (mirroring the `completeness` pattern) and update the `search-notes` example/output template to match that defined semantics, or (b) if "pending" was never meant to survive the port, delete the `Pending validation` bucket and swap the example row to a normal integer confidence value. Either fix keeps the skill's own output consistent with the contract it cites.
**Confidence:** 85/100

## Positive Observations
- Every plan-defined gate (G1–G4) and both test suites (lint 49/49, unit 462/462) were re-run directly against the live shipped files in this review session and matched the developer's self-report exactly — no gap between claimed and actual evidence.
- `claude plugin validate --strict` (not explicitly required by Step 6's accept criteria, run here for extra fresh evidence) passes clean on both `plugins/nexus-notes/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- The Keep/Change/Scrub discipline on Step 2's port (note-schemas.md authored fresh rather than scrubbed-in-place) demonstrably worked: BOM, mojibake, and all 26 (drifted to 20) hub-internal references from the producer source have zero channel into the shipped file — confirmed via G1/G3/G4 and a direct BOM byte check on every shipped file.
- `claim-notes`'s three hard rules (never claim without confirmation, never overwrite, never re-claim) are stated once as hard rules and then operationalized identically in the Steps and Edge-cases sections — no drift between the two restatements.
- Sibling-citation form (`../search-notes/references/…`) is used correctly and consistently in `claim-notes.md`, matching the mine-family-core precedent and passing skill-lint's E6 dangling-reference check.
- AC6's split satisfaction (wiring+fixture done now, live-twin run deferred) is handled exactly as the plan prescribed: both `gen-omni.mjs` edit sites and both `gen-omni.test.mjs` fixes are real and verified, the deferral is recorded with an explicit `OPERATOR ACTION REQUIRED` block in implementation.md (not silently dropped), and `plugins/omni-notes/` correctly does not exist (BR8 — never hand-created).

## Gaps
- **Multi-source aggregation is underspecified (lower confidence, see Open Questions).** `notes-config.md` defines an open list of *sources*, each with its own `inbox` path and an `enabled` flag, and states "Disabled sources are skipped by all skills" — implying skills iterate over the source list. `search-notes.md`'s algorithm (`## How to search`, step 1) instead says "Resolve **the** inbox root," singular, with no stated iteration over enabled sources or union-of-inboxes behavior when two enabled sources have different `inbox` paths. Not filed as a Finding — see Open Questions for why confidence falls under 80.
- Neither skill states behavior for a note file with malformed/missing required frontmatter (e.g., no `meeting_date`). Not spec-mandated, so not a Finding — noting as an edge case a future revision could tighten.
- The `Satisfies:` trace was checked for all annotated plan steps (Steps 1–6) against the spec's AC wave-1 #1–#8 and BR 1–9; all traced cleanly to code that does what the annotation claims — no intent-drift found.

## Open Questions
- **Multi-source aggregation semantics (confidence ~65, MEDIUM band — moved here per the ≥80 cutoff).** Is `search-notes`'s singular "resolve the inbox root" phrasing a deliberate wave-1 simplification (in practice only one source is typically enabled, per the shipped example where `slack` is `enabled: false`), or a genuine gap that should say "for each enabled source, resolve and search its inbox, union the results"? The AC itself uses singular language ("resolves **its** root from the notes config"), suggesting this may be an intentional design choice carried from the spec rather than a developer-introduced gap — but I can't rule out that the config's own explicit multi-source, per-source-`inbox`, "skipped by all skills" language was meant to drive real iteration logic the skill body never states. Developer/architect: confirm intent; if deliberate, consider a one-line clarification in `search-notes.md` step 1 ("if multiple sources are enabled, search each one's inbox and union the results") so a future consumer with two genuinely different inbox paths isn't left guessing.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Lint suite | pass | `node --test tests/lint/*.test.mjs` | 49/49 pass, 0 fail (includes `nexus-notes: plugin.json is valid and CHANGELOG top entry matches its version`) |
| Unit suite | pass | `node --test tests/unit/*.test.mjs` | 462/462 pass, 0 fail |
| Frontmatter lint (targeted) | pass | `node --test tests/lint/frontmatter.test.mjs` | 4/4 pass — confirms no `SKILL_KEYS` violation, no skiplist entry added for nexus-notes |
| G1 (path discipline) | pass | `grep -rn "omnishelf" plugins/nexus-notes/` | 3 hits, all in `notes-config.md:46,52,67`; zero elsewhere |
| G1b (forbidden path shapes) | pass | `grep -rnE "omnishelf-docs\|[A-Z]:\\\\" plugins/nexus-notes/` | zero hits |
| G2 (no pinned models) | pass | `grep -rn "claude-[a-z]*-4" plugins/nexus-notes/` | zero hits |
| G3 (no BOM) | pass | byte-level check (`head -c 3` per file) on all 6 shipped files | no file starts with `EF BB BF` |
| G4 (no dangling hub refs) | pass | `grep -rnE "\.claude/(agents\|scripts\|skills)/\|docs/proposals/\|(^\|[^-.\w])kb/" plugins/nexus-notes/` | zero hits |
| `never claim without` hard-rule gate | pass | `grep -n "never claim without" plugins/nexus-notes/skills/claim-notes/SKILL.md` | 2 hits (lines 15, 58) |
| `gen-omni.mjs` / `gen-omni.test.mjs` diff | verified | `git diff -- scripts/gen-omni.mjs tests/unit/gen-omni.test.mjs` | both named edit sites present exactly as plan/implementation.md describe |
| `bump-plugin.mjs --dry-run` | pass | `node scripts/bump-plugin.mjs --dry-run` | `nexus-notes: new plugin (absent at HEAD) — first release ships at its authored version; no bump.` / `no plugin behavior-surface changes detected` |
| `claude plugin validate --strict` (nexus-notes) | pass | `claude plugin validate --strict plugins/nexus-notes` | `Validation passed` |
| `claude plugin validate --strict` (marketplace) | pass | `claude plugin validate --strict .claude-plugin/marketplace.json` | `Validation passed` |
| `omni-notes` not hand-created | pass | `find plugins/omni-notes` | `No such file or directory` (BR8 — generated-only, correctly absent pre-sync) |
| Backlog / ADR register | pass | `grep -n "F1-NotesPlugin" docs/backlog.md`; `grep -n "ADR-56\|ADR-57" docs/architecture/README.md` | F1 row present with "wave 1 shipped" title-cell update, Status `In Progress`; both ADRs present (`:1391`, `:1432`) |

**Carry-over findings from implementation.md — dispositions:**
| Title | Severity | Disposition |
|-------|----------|-------------|
| AC6 live-twin half is owed, not done | medium | **Confirmed, non-blocking.** Verified wiring is real (both `gen-omni.mjs` sites, both test fixes), fixture green. Per the task framing this cycle, the live-twin half is a plan-sanctioned operator-owed deferral, not a gap — does not affect the verdict. |
| gen-omni fixture is frontmatter-only | low | **Confirmed, accurate as described.** The seeded fixture (`gen-omni.test.mjs:35`) is a minimal one-line-body SKILL.md, consistent with every other plugin's fixture in the same file — by design, not an oversight. |
| Shared references use sibling-citation form | low | **Confirmed, correct usage.** `claim-notes/SKILL.md` cites `../search-notes/references/…` exactly per the mine-family-core precedent; skill-lint E6 passes. |
| F1 delivery folder partially committed by a concurrent session | low | **Confirmed, attribution-only.** `git log` shows commit `01e7a3e` landed the definition + plan; no action needed, doesn't affect this review's scope. |

*Status: COMPLETE — reviewer, 2026-07-12*
