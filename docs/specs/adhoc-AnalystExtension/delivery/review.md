# Review — adhoc-AnalystExtension

## Step 1 — Done-Check (architect, 2026-07-11)

**Verdict: PASS — all 6 steps Implemented**, including the owner-directed Step 2b relocation.
The one red test at HEAD is a pre-existing, fully-attributed sibling defect (below), not this
slug's regression.

### Step-by-step disposition (plan ↔ implementation.md ↔ disk, re-executed)

| Step | Verdict | Architect re-verification |
|---|---|---|
| 1 — tooling generalization | Implemented | gen-commands readdir + MAP-override (nexus byte-identity held — selfcheck drift green in the developer's runs); the 3 lint suites + selfcheck now iterate `marketplace.plugins`; skip-list non-empty and NAMED (`nexus-flutter/figma-to-flutter` `argument-hint` key) |
| 2 — scaffold | Implemented | plugin.json `nexus-analytics`/`0.1.0` + CHANGELOG `[0.1.0]` re-read ✓ |
| 2b — relocation | Implemented | md5 manifest identical pre/post move; core copy GONE (`git status` re-run: only the 3 registration edits remain dirty in core); 4 pointer lines re-worded to the prose form, zero `../mine-verify-cover` residue; travelled battery identical to the original build (same carve-outs, no drift); **P1 single-copy battery re-executed by architect: all 4 canonical phrases hit exactly ONE file cross-plugin** |
| 3 — agent + command | Implemented | `one message`/`never re-asked` signatures; `gen-commands.mjs nexus-analytics` exit 0, command generated (AC-8 both halves) |
| 4 — three skills + evaluate-skill ×3 | Implemented | AC-3 structural signatures (resolution ladder + arrows, plain-name sibling mine ref, answer-qa contract); AC-4 both scope readings executed and disclosed; evaluate-skill ×3 audit-logged, fix-then-accept |
| 5 — registration | Implemented | marketplace re-read: 6 plugins incl. nexus-analytics; gen-omni + `--check` clean per record |
| 6 — release, no bump apply | Implemented | version stayed 0.1.0; `bump-plugin --check` pass; AC-7 snapshot comparison exact after mid-build re-baseline |

### Architect re-executed gates (2026-07-11)

- Suite: **510 tests, 509 pass, 1 fail** — the single failure is
  `in-body 'name' skill references resolve to a shipped skill (any plugin)`, caused by commit
  `7ef5d44` (adhoc-ArchitectFastLane, nexus 1.30.0) shipping a `` `code-review` skill `` reference
  in `agents/architect.md` — no shipped plugin has that skill (it is a Claude Code built-in).
  Verified by the developer against BOTH the pre- and post-widening lint (fails identically →
  pre-existing at HEAD, not surfaced by this slug's widening, correctly NOT in the skip-list).
- Tree: `plugins/` dirty set = the 3 family-registration edits (adhoc-MineSemanticModel residue,
  now incl. the 2 marker edits) + untracked `plugins/nexus-analytics/` — nothing else; the
  sibling's files were never touched (its commit landing mid-build was handled by read-only
  re-baseline, recorded in implementation.md §Concurrent-Tree Notes).
- P1 anti-drift contract: re-executed cross-plugin, exactly one file holds each canonical phrase.

### Carry-over findings (for the operator/backlog)

1. **`agents/architect.md` `code-review` dangling reference (HEAD-red lint)** — adhoc-
   ArchitectFastLane's defect; one-line fix (reword to not match the `` `name` skill `` lint
   pattern, or point at a shipped skill). Owner decides which session/commit fixes it — it blocks
   a fully-green CI on any PR containing HEAD.
2. **`.github/workflows/plugin-release-check.yml` hardcodes nexus(+nexus-dotnet)** — 4 plugins
   (cpp/flutter/php/analytics) have no CI release-check coverage; Step-1-adjacent gap the plan
   never named, found by the developer reading the YAML. Candidate follow-up slug (small).
3. README Plugins table pre-existing staleness (missing cpp/flutter/php rows; the developer added
   only its own row, correctly not expanding scope).
4. Plan Step-4 acceptance carried one stale `nexus:mine-semantic-model` literal from before the
   relocation decision (bullet text said plain-name) — developer treated as transcription
   artifact, matching the tech-spec; correct call (architect's authoring slip, noted).

### Handoff — closure sequence (operator-owned)

1. Commit **nexus-analytics 0.1.0**: `plugins/nexus-analytics/` + `.claude-plugin/marketplace.json`
   + `scripts/{gen-commands,gen-omni,selfcheck}.mjs` + `tests/lint/{frontmatter,wiring,skill-refs}.test.mjs`
   + `tests/unit/gen-omni.test.mjs` fixture + root README + the two slugs' docs.
2. Commit the **core PATCH** for the fifth mine's family registration (3 edited core files; bump
   1.30.0→1.30.1 rides in the same commit per CLAUDE.md).
3. `../omni` twin sync commit (bundles ArchitectFastLane 1.30.0 + the registration PATCH +
   omni-analytics 0.1.0).
4. Optional same-window: the one-line architect.md `code-review` fix (finding #1) to restore a
   green HEAD.
