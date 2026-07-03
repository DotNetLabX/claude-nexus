# SDD Golden-Set Lifecycle — v1 UNGATED slice — Implementation

## Files Created

None — this pass is entirely edits to shipped skill text, agent prose, and the architecture record; no new files.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — added a new `## SDD lifecycle (M0–M3)` section
  (inserted before `## Relationship to other skills`, +36 lines). Frames the skill as the code arm of a
  larger SDD lifecycle; 4-row mode map (M0 Greenfield / M1 Create / M2 Protect / M3 Evolve); M0 described
  as a named lifecycle position (not a shipped recipe, spec arm not-yet-shipped / AC-6-gated); M2's full
  refactor-safety protocol (`suite_green` + `mutation_floor` re-clear across the refactor, `char_pin`
  explicitly inapplicable, kill-rate delta advisory-only never pass/fail), referencing (not restating) the
  file's own existing gate names; M1/M3 as a single deferred stub citing the tech-spec. Satisfies plan Step 1
  / OD-L6 / AC-L3 M2-half.
- `plugins/nexus/agents/solo.md` — added an **Attestation drift check (pre-implementation)** paragraph
  right after the existing "Context to load first" convention-reading guidance (+2 lines). Dormant forward
  conditional: when a touched class has an attested golden set (`docs/kb/golden/{Class}.md`), update the
  affected tests in the same pass or flag an M3 re-mine. Satisfies plan Step 2 / AC-L6.
- `plugins/nexus/agents/developer.md` — added the same **Attestation drift check (pre-implementation)**
  paragraph right after the existing "Coding Conventions (read first)" section (+2 lines), symmetric with
  solo. Satisfies plan Step 2 / AC-L6.
- `plugins/nexus/agents/architect.md` — added an **Attestation drift check (plan / done-check time)** bullet
  to the end of `## Plan Writing Rules` (+1 line), role-differentiated per the plan's MEDIUM-4 critic fix:
  "plan the test update or flag an M3 re-mine" — deliberately omits the solo/developer "update the affected
  tests in the same pass" clause, since the architect never writes tests. Satisfies plan Step 2 / AC-L6.
- `docs/architecture/README.md` — added **ADR-38** (M2 refactor safety = suite-green + floor re-clear,
  never a kill-rate delta) and **ADR-39** (Drift v1 = encoded agent awareness + CI backstop), inserted
  between ADR-37 and `## Inherited pipeline decisions` (+35 lines), mirroring ADR-37's shape (Status
  blockquote → Context → Decision → Why → Tradeoffs → Rejected). Both bodies cite `AC-6` as the deferral
  marker for the gated lifecycle (C1–C4/M1/M3). Also added the missing **ADR-37** line to the `## Contents`
  list (boy-scout fold-in from the plan review, alongside the new ADR-38/39 lines) — Contents previously
  ended at ADR-36 while ADR-37's body already existed. Satisfies plan Step 3.
- `plugins/nexus/.claude-plugin/plugin.json` — version bumped `1.18.10` → `1.19.0` (MINOR, owner-pre-decided
  per the team lead's resume message: new skill-section capability + net-new agent rules = new capability).
  Via `node scripts/bump-plugin.mjs --minor`.
- `plugins/nexus/CHANGELOG.md` — new `## [1.19.0]` entry; replaced the auto-generated stub with a
  substantive description of the shipped change (skill section, drift rule, ADRs) and corrected the date
  to `2026-07-03` (the stub used a stale `2026-07-02`, likely computed at the moment the day rolled over).
- `plugins/nexus/commands/architect.md`, `plugins/nexus/commands/developer.md`, `plugins/nexus/commands/solo.md`
  — regenerated via `node scripts/gen-commands.mjs nexus` to reflect the three agent-file edits in Step 2.
  (`reviewer.md`, `team-lead.md`, `po.md`, `critic.md`, `learner.md` were also regenerated but produced no
  diff — their source agent files are unchanged.)
- `plugins/nexus/skills/boy-scout/SKILL.md`, `plugins/nexus/skills/diagnose/SKILL.md`,
  `plugins/nexus/skills/evaluate-skill/SKILL.md`, `plugins/nexus/skills/improve-skills/SKILL.md`
  **[Fix Cycle 1/3]** — quoted each file's `description:` frontmatter value (no content changes). Each had
  an unquoted plain YAML scalar containing mid-line colon-bearing prose (`vs simplify: boy-scout`, `Timing:
  reach`, `Order: evaluate-skill` ×2 in evaluate-skill and improve-skills) that broke the parser. Resolves
  the Carry-Over Finding below and the reviewer/Codex Step-2 blocker. Not a plan step — an owner-authorized
  scope addition per the fix-cycle instruction.
- `plugins/nexus/CHANGELOG.md` **[Fix Cycle 1/3]** — appended a note under the existing `## [1.19.0]` entry
  documenting the frontmatter repair (no new version heading — the fix rides within the uncommitted 1.19.0
  bump per the coordinator's explicit no-re-bump instruction).

## Key Decisions

- **Section placement in `mine-verify-cover/SKILL.md`:** placed the new `## SDD lifecycle (M0–M3)` section
  immediately before `## Relationship to other skills` (the file's last section) rather than earlier in the
  method body — it's a "bigger picture / where this skill sits" framing, which reads naturally right before
  the relationship table, and keeps the core Mine→Verify→Cover pipeline/gate-battery/Minimize/Report sections
  contiguous and unbroken (plan said "do not restructure the existing method").
- **Attestation drift check placement:** placed in solo.md/developer.md right next to each agent's existing
  convention-reading paragraph (the plan's own suggested anchor: "near each agent's existing
  convention-reading / pre-implementation ... guidance"), and in architect.md as the final bullet of
  `## Plan Writing Rules` (the plan-time guidance the architect actually consults per-step, and the plan's
  "plan/done-check" framing folds naturally into that checklist rather than needing two separate insertion
  points).
- **CHANGELOG date correction:** the bump-plugin.mjs-generated stub dated the entry `2026-07-02`; corrected
  to `2026-07-03` (today) when rewriting the entry body, since I was already editing that line and the stale
  date would otherwise ship.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan-sanctioned — doc/skill-text authoring step, no shipped skill governs ADR/skill-section *content* (plan.md:46-52) |
| 2 | None | plan-sanctioned — agent-prose authoring step, same rationale |
| 3 | None | plan-sanctioned — ADR-authoring step, same rationale |
| 4 | release-plugin | Followed in full: `--dry-run` classify → owner-pre-authorized `--minor` apply → CHANGELOG rewrite → `gen-commands.mjs nexus` → `validate --strict` → `selfcheck.mjs`. Did **not** run `gen-omni.mjs` (Owner split — team-lead-owned at commit time, plan.md:54-59, 181-182) |

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| ~~`claude plugin validate plugins/nexus --strict` fails on 4 pre-existing, unrelated skill files~~ **RESOLVED — Fix Cycle 1/3** | medium → resolved | reviewer/architect | Originally: `validate --strict` reported YAML frontmatter parse errors in `boy-scout/SKILL.md`, `diagnose/SKILL.md`, `evaluate-skill/SKILL.md`, `improve-skills/SKILL.md` (zero working-tree diff from HEAD, last touched 2026-06-18/06-20, 13-15 days pre-feature). The reviewer's Step 2 flagged this as an operator-owed release-blocking prerequisite; a parallel Codex cross-check returned NO-GO citing the same gate. Owner authorized fixing in-pass (scope addition). Fixed this cycle: quoted the 4 unquoted `description:` values (root cause: unescaped mid-line colons in a plain YAML scalar). `claude plugin validate plugins/nexus --strict` now **exits 0**. | See Fix Cycle 1/3 section below for full evidence. |

## KB Changes

None — this pass touches no `docs/kb/**` entries (no C1/C2 attestation records ship in this ungated slice).

## Deviations from Plan

- **Step 4 acceptance — `validate --strict` originally did not pass, for a reason outside this feature's
  original scope; RESOLVED in Fix Cycle 1/3.** The plan's Step 4 acceptance line requires `claude plugin
  validate plugins/nexus --strict` to pass. At initial implementation it exited 1 on 4 skill files this
  plan never touched and that pre-dated this feature by 13 days (see Carry-Over Findings above) — every
  file this plan *did* edit validated without error. Initially treated the same way the plan itself treats
  the anticipated `gen-omni --check` expected-RED (HIGH-1): documented rather than chased, per the developer
  agent's hard rule to document, not silently fix, a suspected pre-existing failure outside plan scope. The
  reviewer (Step 2) and a parallel Codex cross-check both flagged this as release-blocking; the owner then
  authorized fixing it in-pass (scope addition, relayed via the coordinator's fix-cycle message) — see Fix
  Cycle 1/3 below. `validate --strict` now exits 0.
- **`gen-omni --check` is expected-RED, as the plan anticipated (HIGH-1, not a bounce).** `selfcheck.mjs`
  shows `[FAIL] gen-omni --check — omni twin drifted`; this is the plan's own documented known-deferred
  state (plan.md:177-182) — the `../omni` twin regen is team-lead-owned at commit time, so I did not run
  `gen-omni.mjs` to chase it green. The other 4 gating checks (`tests`, `gen-commands drift`, `bump-plugin
  --check`, `spec-diff inline-copy sync`) all PASS, matching the plan's rescoped acceptance exactly.
- **MINOR tier applied directly, no in-round flag.** The plan (Step 4) instructs the developer to run
  `bump-plugin` proposing PATCH and *flag* a possible MINOR to the owner rather than self-escalate. The
  team lead's resume message pre-authorized MINOR before I reached Step 4 ("Step-4 tier pre-decided by the
  owner: MINOR ... no need to flag at Step 4, the escalation is already owner-authorized"), so I applied
  `--minor` directly instead of flagging-then-waiting. Not a self-escalation — the owner decision predates
  the bump.

## Fix Cycle 1/3

**Trigger:** Step 2 reviewer APPROVED, but a parallel Codex cross-check returned NO-GO on the single
outstanding gate (`review-codex.md`): `claude plugin validate plugins/nexus --strict` still red because of
the 4 pre-existing broken `SKILL.md` frontmatters this developer's Step 4 had documented as a Carry-Over
Finding rather than fixed (out of original plan scope). Consolidated fix-list from the Step-2 reviews: one
item. Owner authorized fixing the 4 files in-pass (scope addition) via the coordinator's resume message.

**Root cause.** Each of the 4 files had an unquoted `description:` plain YAML scalar containing a mid-line
`word: ` colon+space inside the prose, which a YAML plain scalar cannot contain without breaking the parse:

| File | Offending colon-bearing phrase |
|------|-------------------------------|
| `boy-scout/SKILL.md` | `vs simplify: boy-scout is IN-FILE` |
| `diagnose/SKILL.md` | `Timing: reach for it AFTER` |
| `evaluate-skill/SKILL.md` | `Order: evaluate-skill first, then improve-skills` |
| `improve-skills/SKILL.md` | `Order: evaluate-skill first, then improve-skills` |

**Fix applied.** Wrapped each file's `description:` value in double quotes — no content changes (verified:
none of the 4 descriptions contain an embedded double-quote character, so plain quoting needed no escaping).

**Verification (re-run this cycle):**
- `claude plugin validate plugins/nexus --strict` → **exit 0** (`✔ Validation passed`), down from 4 errors.
- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **443 passed, 0 failed** (re-run per the
  coordinator's instruction; unchanged from the pre-fix run — these files carry no test coverage of their
  own, so the count matching confirms no regression).
- `node scripts/selfcheck.mjs` → unchanged at **4/5 PASS**: `tests`, `gen-commands drift`, `bump-plugin
  --check`, `spec-diff inline-copy sync` all PASS; `gen-omni --check` remains the plan-sanctioned
  expected-RED (not run, not chased — Owner split unchanged by this fix).
- `node scripts/bump-plugin.mjs --dry-run` → proposes `1.19.0 → 1.19.1` PATCH (now citing all 5 changed
  skills, including the 4 just-fixed ones). Per the coordinator's explicit instruction this is the documented
  false-positive (dirty-vs-committed-HEAD, not dirty-vs-the-already-uncommitted-1.19.0-bump) — **did NOT
  re-bump**; `plugin.json` stays `1.19.0`.
- `git status --porcelain` confirms only the 4 `SKILL.md` files + `CHANGELOG.md` changed this cycle; no
  agent files touched, so `gen-commands` needed no re-run (confirmed still in sync via selfcheck above).

**Files touched this cycle:** the 4 `SKILL.md` frontmatters (see Files Modified) + `CHANGELOG.md` (fix note
appended under the existing `## [1.19.0]` heading, no new version section).

**Not re-bumped, not re-committed, `gen-omni` not run** — per the coordinator's explicit instructions; tree
remains uncommitted, owned by the team lead's commit protocol.

*Status: COMPLETE — developer, 2026-07-03.*
