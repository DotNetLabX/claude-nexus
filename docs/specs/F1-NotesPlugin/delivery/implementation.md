# F1-NotesPlugin — Implementation

Wave 1 (consumer surface) of the `nexus-notes` extension plugin. Plan: `docs/specs/F1-NotesPlugin/delivery/plan.md`.

## Files Created
- `plugins/nexus-notes/.claude-plugin/plugin.json` — plugin manifest, `version: 0.1.0`, `dependencies: ["nexus"]` (ADR-3/ADR-56 extension declaration), full field set per Step 1 gate.
- `plugins/nexus-notes/CHANGELOG.md` — 0.1.0 entry; top `## [0.1.0]` heading matches manifest version (release.test.mjs gate).
- `plugins/nexus-notes/skills/search-notes/references/notes-config.md` — the ADR-57 per-source config contract (`.claude/notes.config.yaml`): `id`/`kind`/`staging`/`inbox`/`registry`/`enabled` per source, optional `models:` tier-override block, full YAML example, and the **only** normative statement of the no-config default inbox `../omnishelf-pipeline/docs/meeting-notes/`.
- `plugins/nexus-notes/skills/search-notes/references/note-schemas.md` — the **consumer** field-set contract (fresh-authored, not a verbatim port of the 468-line producer source): the frontmatter fields search/claim filter/rank/stamp on (`meeting_date`, `meeting`, `topic`, `type`, `tags`, `domain`, `status`, `confidence`, `completeness`, `category`), the `claimed_by`/`claimed_at` claim stamps, the `product/`/`strategy/`/`review/` folders, and an example. Carries zero hub refs (G4) and zero omnishelf paths (G1).
- `plugins/nexus-notes/skills/search-notes/references/adapter-rule-template.md` — the thin behavioral "search-before-shaping" rule a consumer copies into `.claude/rules/`; carries no path literal (paths resolve via the config), so G1 stays clean.
- `plugins/nexus-notes/skills/search-notes/SKILL.md` — generalized port of the omnishelf-docs `search-notes` skill. Light/conversational skill. Keeps the 10-param filter table, natural-language parsing, ranked-table output, read-only guarantee, and exclusions. Changes: inbox root + default resolve via `references/notes-config.md` (no literal path in the body — cleanest G1); field semantics cite `references/note-schemas.md` rather than restate; PO-workflow section generalized (kept search→review→claim→spec flow, dropped hub-only machinery — `meeting-to-notes --re-extract-note`, `bug-to-ticket`, the `po.md` cadence). Frontmatter limited to `name`/`description`/`user-invocable` (dropped source `triggers`/`args`/`argument-hint`, no skiplist exemption). skill-lint OK.
- `plugins/nexus-notes/skills/claim-notes/SKILL.md` — new confirmation-gated claim skill. Hard rules (never claim without in-session confirmation — the `never claim without` grep gate is satisfied; never overwrite; never re-claim). Steps: resolve selection → present + confirm (partial confirmation honored) → move to `docs/specs/{slug}/definition/notes/` → stamp `claimed_by`/`claimed_at`. Cites the shared references via the sibling path `../search-notes/references/…` (mine-family-core sibling-citation precedent; owner cites `references/…`). Edge-case + "does NOT do" tables. skill-lint OK. Satisfies AC #4's "both skills cite the schema reference" (both cite note-schemas.md).

## Files Modified
- `.claude-plugin/marketplace.json` — added `{ "name": "nexus-notes", "source": "./plugins/nexus-notes" }` after `nexus-analytics`. Marketplace-driven lint/gen-omni discovery now sees the plugin.
- `scripts/gen-omni.mjs` — added `mirrorPlugin('nexus-notes', 'omni-notes');` after the nexus-analytics mirror line, and `{ name: 'omni-notes', source: './plugins/omni-notes' }` to `wantPlugins`. Wires the twin clone (BR8). `node --check` passes. (Live run deferred — see Deviations / owed.)
- `docs/backlog.md` — appended " — wave 1 shipped (nexus-notes 0.1.0)" to the F1-NotesPlugin **title cell only**; Status left `In Progress` (feature closes with wave 2), per plan Step 7 + the binding "edit only the F1 row" constraint. F3/F4 concurrent rows untouched.
- `tests/unit/gen-omni.test.mjs` — the two plan-named red-first fixes: (a) seeded a minimal `plugins/nexus-notes/skills/search-notes/SKILL.md` fixture in `before()` so `collect()` doesn't ENOENT on the new mirror; (b) appended `omni-notes` to the expected-names assertion. Test green (3/3); first-of-kind mirror exercised by the fixture, not a live run.

## Key Decisions
- Wave-1 keywords omit `agents` (nexus-analytics uses it because it ships an agent; nexus-notes wave 1 ships skills only). Chose notes-domain keywords instead.
- **improve-skills Judgment Gate (evaluate-skill) not run for Steps 3/4.** The plan's Step 3/4 accept criteria explicitly scope the done-condition to "skill-lint green" + the grep gates — the architect made that call in the plan. The skill's optional Judgment Gate (spawn `evaluate-skill`) would also be a pipeline-agent spawn, which the developer role must not initiate. Both skills are generalized ports of proven, already-shipped/battle-tested skills (search-notes shipped in omnishelf-docs; claim mechanics are the proven 3-line adapter rule), so job-fitness risk is low. Done-condition honored: skill-lint exits 0 for both.
- **search-notes cites `claim-notes` before Step 4 authors it** — the plan's Step 3-before-Step-4 ordering makes `skill-refs.test.mjs` transiently red between the two steps (`` `claim-notes` skill`` reference). Resolves when Step 4 lands the directory; full lint suite is green only after Step 4 (verified there).
- **claim-notes safety = body hard rule + confirmation gate, not `disable-model-invocation`.** The plan (Step 4) specifies the confirmation gate as a body-level hard rule with a `never claim without` grep gate — that is the chosen BR2 mechanism. `disable-model-invocation: true` (defense-in-depth against auto-invocation) is available in SKILL_KEYS but the plan did not call for it, and the body hard rule already forces confirmation on every invocation path. Followed the plan; `user-invocable: true` matches search-notes and the PO-drives-it flow.
- **Shared references cited via sibling path.** skill-lint's E6 resolves a bare `references/X` skill-relative or at repo-root only; claim-notes' shared references live in `search-notes/references/`. First lint flagged them dangling. Fixed to `../search-notes/references/…` — the exact mine-family-core sibling-citation form (`mine-verify-repo`/`mine-design`/`mine-algorithm` all cite `../mine-verify-cover/references/mine-family-core.md`), which the lookbehind exempts and skill-lint passes.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | Scaffold step (plan Skill Mapping: none, TDD no). No scaffold skill exists for marketplace plugins — logged to lessons.md per plan Step 1 gap note. |
| 2 | None | Plan Skill Mapping: none (TDD no) — the three references are contracts, not pattern-driven code. Gates G1/G1b/G2/G3/G4 all pass on the references. |
| 3 | improve-skills | Follow. Dev-repo carve-out: new shipped skill authored directly in `plugins/nexus-notes/skills/`; done-condition = skill-lint per plan Step 3 accept (see Key Decisions re: Judgment Gate). Consulted `references/skill-recipe.md` (light archetype) + `references/proven-patterns.md` (AP1/AP3/AP5). skill-lint OK. |
| 4 | improve-skills | Follow (re-invoked for the audit trail). New shipped skill, same dev-repo carve-out + skill-lint done-condition. Sibling-citation fix applied after first lint flagged the cross-skill references (see Key Decisions). skill-lint OK. |
| 5 | None | Plan Skill Mapping: none (TDD no) — two-line gen-omni wiring + fixture test. Unit suite green (462), gen-omni test green (3/3). |
| 6 | release-plugin | Follow. `--dry-run` only (no apply, no commit — per binding findings). Tool auto-detected new plugin → ships at authored 0.1.0, no bump; no foreign file flagged as bump-triggering. G1–G4 all pass; combined suites green (511). Live gen-omni twin run + omni commit deferred (owed — see Deviations). |
| 7 | None | Plan Skill Mapping: none (TDD no) — bookkeeping. Backlog F1 row updated (title cell only); spec Status already `Ready` (no edit); ADR-56/ADR-57 confirmed present in `docs/architecture/README.md` (lines 1391/1432, no edit). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| AC6 live-twin half is owed, not done | medium | reviewer | plan Step 6 split + Deviations section | Do not read AC6 as failed — the wiring+fixture half is green; the live `gen-omni` run + omni commit are deferred to the closing session under the clean-tree guard (concurrent F3/F4 docs dirty). Verify the wiring (gen-omni.mjs both sites + both test sites), not a live twin, exists. |
| gen-omni fixture is frontmatter-only | low | reviewer | `tests/unit/gen-omni.test.mjs` before() seed | The seeded `nexus-notes` fixture is a minimal SKILL.md, by plan design ("first-of-kind execution covered by this fixture run, not a live run"). The mirror test validates the mapping, not real skill content. |
| Shared references use sibling-citation form | low | reviewer | claim-notes SKILL.md `../search-notes/references/…` | Both skills cite `note-schemas.md` (AC #4). The owner (search-notes) cites `references/…`; the sibling (claim-notes) cites `../search-notes/references/…` — the mine-family-core precedent, required for skill-lint E6 to pass. |
| F1 delivery folder partially committed by a concurrent session | low | architect | `git status`: lessons.md tracked+modified, implementation.md/communication-log.md untracked | Attribution note only — a concurrent session committed part of `docs/specs/F1-NotesPlugin/` (per communication-log launch context, commit `01e7a3e`). No action needed from me; flagged so staging at commit time is scoped deliberately. |

## Deviations from Plan
- **AC6 live-twin half is OWED, not done — split-open per plan Step 6.** The gen-omni wiring + fixture half is complete (Step 5, green). The live `node scripts/gen-omni.mjs` run against the real omni repo and the omni twin commit are **deferred to the closing session** per the concurrent-tree guard: `git status` shows a concurrent feature's docs dirty (F3-/F4- spec dirs, backlog, research files) and gen-omni mirrors the working tree, so a live regen now would contaminate the twin. AC6 stays formally open until the deferred sync lands.
  - **OPERATOR ACTION REQUIRED (closing session, clean-tree only):** after F1 is committed and the tree carries no other feature's plugin files dirty, run `node scripts/gen-omni.mjs` then `node scripts/gen-omni.mjs --check` (expect exit 0), and commit the omni twin per the twin convention (subject mirrors the nexus F1 commit, scope = F1 slug, `(omni {version})` tag, body = plugin delta since last sync, footer `Generated from the nexus plugin (nexus {sha}).`). Helper: `scripts/gen-omni.mjs` (in this repo).
- **No commit and no bump applied (Step 6).** Commits are team-lead-owned; `bump-plugin.mjs` was run `--dry-run` only. The new plugin correctly needs no bump (ships at authored 0.1.0). `claude plugin validate --strict` (release-plugin procedure step 6) is deferred to the closing session's release ceremony — the lint suite's release.test.mjs + skill-lint E9 already enforce the equivalent plugin.json / frontmatter strict-YAML coherence checks, all green.

## Post-Review Fixes (Step 2 review, cycle 1/3 — APPROVED, one non-blocking MEDIUM)

**Finding:** `search-notes` output format contradicted its own schema contract
(`plugins/nexus-notes/skills/search-notes/SKILL.md:88,93` vs `references/note-schemas.md:25`). The
worked example showed `Confidence: pending` and the output template carried a `Pending validation`
count bucket, but `note-schemas.md` defines `confidence` as a strict `integer (1–10)` with no fallback
(unlike `completeness`, which documents one). Byte-identical wording carried over from the
omnishelf-docs source, unreconciled with the ported schema.

**Decision: stripped the stale "pending" bucket/example — no fallback added to the schema.** Grounded in
the live producer contract, not the ported doc: `omnishelf-pipeline/.claude/agents/notes-extractor.md`
states explicitly, twice (lines 223 and 273 of the live file) — *"Every note has `confidence: {1-10}`
integer in frontmatter... **Never use string labels (`high`, `medium`, `low`, `pending`)**."* Confidence
is a required, self-assessed integer set by the Notes-Extractor at write time; even the degraded
Gemini-only-input path (no transcript) still emits a numeric score, just capped at 7 — it never emits
"pending" or leaves the field unset. There is no producer state that ever ships a note into the inbox
without a validated numeric confidence, so a confidence-missing fallback would document a case that
cannot occur. The "pending" bucket/example was dead weight carried verbatim from the source skill,
never reconciled against the schema it was ported alongside.

**Fix applied:**
- `plugins/nexus-notes/skills/search-notes/SKILL.md` — output-format worked example: row 2's
  `Confidence` cell changed from the string `pending` to a valid integer (`5`), consistent with the
  4-6 "needs review" bucket already named directly below it. Removed the `**Pending validation:**
  {count}` line from the output template (three buckets — Jira-ready/needs-review/low-confidence —
  now exhaustively cover the 1–10 range with no residual bucket for values `note-schemas.md` says
  cannot occur).
- Swept the rest of the plugin for the same stale artifact (`grep -rn "pending"
  plugins/nexus-notes/`) — zero other hits; the defect was isolated to this one section, not
  half-landed elsewhere (AP2 discipline).

**Gates re-run (files touched: `search-notes/SKILL.md` only):**
- `skill-lint.mjs plugins/nexus-notes/skills/search-notes` — OK.
- G1 (omnishelf literal), G2 (pinned models), G3 (BOM), G4 (dangling hub refs) — all zero/clean on the
  touched file.
- Combined `tests/lint/*.test.mjs tests/unit/*.test.mjs` — 511 pass, 0 fail (unchanged from pre-fix).

Reviewer's Open Question on the singular inbox-root phrasing was **not touched** per the coordinator's
instruction (spec-inherited, stays as recorded).

*Status: COMPLETE — developer, 2026-07-12*
