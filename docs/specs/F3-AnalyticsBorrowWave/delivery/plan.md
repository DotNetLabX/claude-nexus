# F3 — increment 0: port the feedback-loop layer into the shipped `mine-semantic-model` skill

**Status:** Plan — architect (Fable 5), 2026-07-17. Owner-directed increment under F3
(mine-semantic-model relocation lane); F3's S1–S4 (value ledger, grounding gate, analyst craft, CI
riders) remain **unplanned here** — they get their own plan after the Stage-0 pilot.
**Why now:** KG's run report (`D:\src\knowledge-gateway\docs\model-runs\2026-07-17.md`, Findings
#2 + "Skill resolution") records that run-#2 evidence for the relocated skill is blocked on exactly
this port: the plugin is installed (closed 2026-07-17) and the profile worked example exists, but
the feedback-loop consumption rules exist only in KG's project-local skill.
**Reference (read-only source of truth):** `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\`
— its `SKILL.md` (BR-A..BR-H, Audit leg 0, Phase-1 step 4, Phase-3 step 0, Phase-5 step 6, the
data-grounded refutation ordering), `references/feedback-ledger.md` (whole file),
`references/output-contract.md` (Schema v2 section + `## Feedback dispositions` + Audit mode enum),
`references/interview-protocol.md` (v2 answer-recording shapes). Its skill CHANGELOG's F60 entry is
the delta manifest. Verified asymmetry: the marker grep
(`Schema v2|confirmed-in-use|BR-C|BR-F|feedback-ledger|model-feedback`) = 41 hits across 6 KG
files, **0** in the plugin skill.
**Target:** `plugins/nexus-analytics/skills/mine-semantic-model/` (SKILL.md, `references/`, new
`references/feedback-ledger.md`).

## Binding ground rules (owner directive, 2026-07-17)

1. **Generalize, never copy KG tokens.** KG ids/paths (`F52`/`F60`/`F41`, `laurentiu_read`,
   `kg_seed`, `kg_god_ro`, `fmcg_platform`, OD-hub paths, `seed/db/`, `Cortex`, `MSM_PROBE_DSN`,
   `SemanticModel:StalenessThresholdDays`) are allowed ONLY in `references/project-profile.md`'s
   worked example. `F38` stays the one feature-id `SKILL.md` carries (its existing origin-story
   rule — no new ids join it).
2. **No tooling ships.** KG's `validate-provenance.cs` / `migrate-provenance-v2.cs` stay
   project-provided; the plugin gains only the *contract* + a profile *attestation* (rule 2 of the
   directive). Generalizing tooling is F8-W1's lane (post-F3-pilot, delivery mechanism shared with
   F7 S0b) — do not pre-empt it.
3. **Fail-closed posture intact:** BR-C mandatory dispositions incl. the explicit `none open`
   line; BR-D append-only; BR-E no scalar confidence; BR-F truthful dates (a `code({ref})`-primary
   entry never receives `verified`).
4. **release-plugin rides the same commit:** MINOR bump (0.1.1 → 0.2.0) + CHANGELOG entry.
5. **Review:** code-grounded critic on this plan (mandatory — shared shipped artifact); Step-2
   reviewer reads BOTH skill trees, not just the plan.

## Steps

### Step 1 — `references/output-contract.md`: Schema v2 + dispositions section + Audit mode

1. **Origin enum:** extend with **`code({ref})`** in BOTH places — the closed token list
   (currently five tokens, `output-contract.md:47-49`) AND the precedence chain (currently four
   entries; becomes `interview > kb > data-derived > code > schema-derived` — `carried` stays
   outside precedence). KG v2 did exactly this; BR-F is undefined without `code`. Add the
   code-origin caveat where the precedence list lives. (Critic LOW-1 wording fix.)
2. **Insert `### Schema v2 (structured verification dates + confirmed-in-use accretion)`** after
   the "Ledger-coverage check" bullet (currently line ~87), before `### Who reads the ledger`.
   Content generalized from KG's section (`output-contract.md:98-137`):
   - `verified: YYYY-MM-DD` — entry-level and per-`fields`-scalar; set only from an actual
     run/probe/interview date; **a `code({ref})`-primary entry never receives `verified`** —
     **retain KG's inline `(BR-F)` tag on this rule** (the Step-6 acceptance grep expects `BR-F`
     in this file); `carried({baseline})` rows stay undated, always (KG's `carried(F38)` here
     generalizes to `carried({baseline})`). Include both shape rules (sibling key; bare-string
     `fields` value upgrades to `{origin, verified}` object — never any other shape).
   - `confirmed-in-use: [{date, ref}]` — appendable discrete facts, never a scalar score (BR-E);
     design-time only — where a project's conventions place the ledger inside a runtime-served
     grounding root, the runtime still never writes it; a tag records, it never changes a model
     construct, so appending one does not require a full run (→ `references/feedback-ledger.md`).
   - `deprecated: "{origin}({ref}) -- {reason}"` — formally documented; use a **generic** example
     (KG's flat-hierarchy example stays in KG).
   - **v2 does NOT bless `+`-composition** — single-PRIMARY-origin adjudication unchanged and
     load-bearing. Generalize the migration note: pre-v2 composed origins in a project's live
     ledger are drift, normalized by a **project-side one-time migration** (project tooling lane —
     nothing ships here), never reformalized. **KG's `tools/migrate-provenance-v2.*` and
     `tools/validate-provenance.*` path references must NOT survive into this file** (critic
     HIGH-1) — the structural composed-vs-prose definition points at the profile's item-10
     validation attestation instead.
   - **Scrub KG runtime vocabulary:** KG's `read_reference` (its runtime grounding-root function)
     generalizes to "a runtime-served grounding root" everywhere in ported text — the plugin has
     zero `read_reference` today and must stay at zero (critic HIGH-1).
3. **Run-report template:** mode enum `{mode: Bootstrap|Refresh}` → `{mode: Bootstrap|Refresh|Audit}`
   (the plugin SKILL.md already documents Audit mode — the template lagged); **append a
   `## Findings / follow-ups` required section** at the template's tail (critic HIGH-2: Step 5.9's
   defect-log repoint needs a real target; KG's own live run report already uses exactly this
   section in practice — `docs/model-runs/2026-07-17.md:225` — the template lagged reality);
   insert the mandatory section after `## Hypotheses`:
   `## Feedback dispositions (BR-C — mandatory, every run)` — table
   `| Ledger entry | Construct | Disposition | Resolution |` with the
   `{probed | grounded | asked | still-open}` closed set + the explicit
   `"none open" if the area's ledger had zero open entries at run start — the check must
   demonstrably have run` line (KG `output-contract.md:180-186`, ledger path generalized to the
   profile's item-11 location).

### Step 2 — `references/interview-protocol.md`: v2 answer-recording shapes

Replace the current flattened orphan example (`{ "origin": ..., "question": "Q3", ... }`, line
~75-79) with the v2 per-construct-object shapes (KG `interview-protocol.md:73-94`, generalized):
keyed by construct id; `origin: interview({date})`; `verified` lifted from the same date ("the
interview date IS the verification date"); BOTH examples — whole-construct and field-scoped (the
field-scoped one showing `carried({baseline})` at entry level with the interview-dated scalar
inside `fields`).

### Step 3 — new `references/feedback-ledger.md` (generalized whole-file port)

Port KG's `references/feedback-ledger.md` in full, generalized: governs the profile's
model-feedback ledger (item 11, proposed default `docs/model-feedback/{area}.md`) — the
consumption-side companion to the provenance ledger (origins record where a fact came from; this
ledger records usage signals observed after the fact, improving the model **between** runs).
Sections to preserve 1:1 (content generalized, F52/F60 refs → the plugin's own BR ids):
Placement (BR-A — sibling of the run-report dir, never under the bundle root or any runtime-served
grounding root; same logic as BR9), Entry shape (Expected/Observed/Evidence/Date-observer/Status,
aggregate-only per BR13), Recurrence rule (strengthen, don't duplicate), Closure rule (BR-D:
append-only; resolution append only from a run that actually consumed the entry; `still-open`
leaves the entry untouched), Disposition vocabulary (the closed set above, mirrors the run
report), Area-file map (areas match the run-report scoping), Open append policy (any consuming
agent skill AND humans may append; the junk guard is the mandatory per-run disposition BR-C, not
write-gatekeeping — drop the KG decision-date attribution).

### Step 4 — `references/project-profile.md`: eleventh input + item-10 attestation + worked example

1. Intro + heading: "ten inputs" → "eleven inputs" (three spots: intro ×2, `## The ten inputs`
   heading).
2. **New input 11 — Model-feedback ledger location.** Proposed default:
   `docs/model-feedback/{area}.md`, area names matching the run-report scoping (item 4). Sibling
   of the run-report directory, never under the bundle root (BR-A). Plus an **optional
   staleness-threshold (days) sub-field** feeding Audit leg 3's stale band; when undeclared, the
   stale band merges into the sampled/pilot-only band (no invented default number).
3. **Extend item 10's attestation** (owner rule: "fold validate-provenance into the item-10-style
   runner attestation"): the attestation now also covers the project's **provenance-schema
   validation** — a project-provided check that the ledger obeys the v2 grammar (no
   numeric/boolean confidence leaves — BR-E; `verified`-shape and truthful-date rules — BR-F;
   single-primary origins). Invoked at Phase-5 step 6; a non-zero exit blocks the run (BR6
   extended). **Absence case (critic MEDIUM-1, explicit):** the attestation is either/or — a
   profile MAY declare "no provenance validator"; then BR-E/BR-F degrade to **contract-bound,
   disclosed** (BR-G's posture), and Phase-5 step 6 records
   `provenance validation: none declared (BR-E/BR-F contract-bound only)` in the run report's
   Gate result — **never a silent skip, never a silent block**.
4. **Worked example (KG tokens allowed here):** item 10 gains KG's `validate-provenance.cs`
   attestation lines (v2-grammar validator, numeric-leaf scan, invoked at Phase-5 step 6); new
   item 11 = `docs/model-feedback/{area}.md` (KG's F60 feature added the ledger; staleness
   threshold declared as `SemanticModel:StalenessThresholdDays`).

### Step 5 — `SKILL.md`: obligations rows + phase/leg insertions

1. **Phase 0:** "the ten profile inputs" → "the eleven profile inputs".
2. **Phase 1 — new step 4:** read the profile's model-feedback ledger (item 11) for the target
   area, if it exists; every open entry joins this run's hypothesis set alongside whatever
   Mine/Probe raise — never silently skipped; → `references/feedback-ledger.md`. **KG's hardcoded
   `docs/model-feedback/{area}.md` in its phase steps generalizes to "the profile's item-11
   location" — the literal path may appear once as the named default, never as the binding
   source** (critic gap note; same rule in steps 3 and 5 below).
3. **Phase 3 — new step 0:** the ledger, read FIRST — an open entry for the construct IS the
   hypothesis under investigation; ground it like any probe-raised hypothesis (**"steps 1-2
   below"** — the plugin's Phase 3 has two steps, not KG's three; critic gap note), then record
   its disposition (`probed | grounded | asked | still-open`). Closing paragraph: every ledger
   entry consumed this run gets a disposition in the run report's mandatory
   `## Feedback dispositions` section (BR-C) — zero open entries emits an explicit `none open`
   line.
4. **Phase 5 — new step 6:** run the profile's provenance-schema validation (item 10 attestation;
   project-provided tooling). A failure blocks exactly like a new validation-gate failure (BR6
   extended) — the run reports and stops, never left "done" with a schema violation. If the
   profile declares no validator (the item-10 absence case, Step 4.3), record the disclosure line
   in the Gate result and continue — BR-E/BR-F are then contract-bound only for this project.
5. **Audit — new leg 0 (ledger first):** Audit never routes through Phase 1/3, so leg 0 is the
   only path by which the ledger reaches an Audit run: before the four legs, read the area's
   ledger (the profile's item-11 location); every open entry is a mandatory hypothesis — refuted,
   grounded, or left `still-open` — and gets a BR-C disposition in the run report.
   **BR10 reconciliation (critic open question):** extend the Idempotence-invariant sentence with
   one honest clause — an open ledger entry is *new input*, so consuming it is not an idempotence
   violation; after its closure, a repeat run over the unchanged DB + bundle is again a strict
   no-op.
6. **Audit leg 3 — data-grounded refutation ordering** replacing the current flat class list:
   undated-AND-never-confirmed constructs first (no `verified` date AND zero `confirmed-in-use`
   tags — reality has never touched them), then stale-dated (a `verified` date older than the
   profile's declared staleness threshold, item 11; undeclared → this band merges into the next),
   then sampled/pilot-only attestations, then heavily-confirmed constructs last. Within that
   ordering, the existing refutation classes (sampled FKs, pilot-only verifications,
   characterized-not-reconciled formulas, additivity/grain claims) stay verbatim.
7. **Obligations table — append 8 rows** (no `(F60)` tags — generalized):
   - **BR-A** ledger placement — the profile's item-11 location, never under the bundle root /
     any runtime-served grounding root | `references/feedback-ledger.md` + BR9's same logic
   - **BR-B** no second write path — a ledger entry reaches the bundle only via the next run's
     Phase 1/3 (or Audit leg 0) → Phase 5 gate; a `confirmed-in-use` tag writes only the
     provenance sidecar, never a model construct | `references/output-contract.md` Schema v2; no
     phase writes a bundle construct from a ledger entry directly
   - **BR-C** mandatory disposition; `none open` line | Phase 1/3/leg-0 procedure + the run
     report's mandatory `## Feedback dispositions` section
   - **BR-D** never delete — entries and tags append-only; closure is a resolution append |
     `references/feedback-ledger.md` recurrence/closure rules
   - **BR-E** no scalar confidence — tags and dates only | the profile's provenance-validation
     attestation (item 10): project-provided numeric/boolean-leaf scan, non-zero exit blocks
     *(when the profile declares a validator; else contract-bound, disclosed — Step 4.3)*
   - **BR-F** truthful dates — `verified` only from an actual run/probe/interview date; a
     `code({ref})`-primary entry never receives `verified` | `references/output-contract.md`
     Schema v2 (governs every Phase-5 emit) + the item-10 validation attestation *(same absence
     case as BR-E)*
   - **BR-G** staleness nudge — silent when fresh, advisory only; contract-bound here, runtime
     implementation is the consuming project's own lane | this table row + Audit leg 3's stale
     band (no code in this skill enforces it — by design)
   - **BR-H** UTF-8 without BOM on every feedback-loop artifact (ledger files included) | same
     discipline as BR11, extended
8. **References section:** add the `references/feedback-ledger.md` line (entry template,
   recurrence/closure rules, disposition vocabulary, area-file map).
9. **Standalone defect-log pointer fix** (small, in-scope correction): "append an entry to this
   skill's own `CHANGELOG.md`" is wrong for a shipped skill — the plugin cache is not a writable
   working tree. Repoint the standalone path to the run report's `## Findings / follow-ups`
   section — **which Step 1.3 adds to the required-sections template in this same increment**
   (critic HIGH-2: the target must exist; KG's live run report already practices it). Dev-repo
   edits still ride the plugin CHANGELOG via the release flow.

### Step 6 — verify, bump, commit

1. **Acceptance greps** (all from repo root, scoped to
   `plugins/nexus-analytics/skills/mine-semantic-model/`):
   - Each of the six markers `Schema v2`, `confirmed-in-use`, `BR-C`, `BR-F`, `feedback-ledger`,
     `model-feedback` → **non-zero**, and in the right files (Schema v2 → output-contract;
     BR-C/BR-F → SKILL.md + output-contract; feedback-ledger → SKILL.md references + BR rows;
     model-feedback → SKILL.md + project-profile + feedback-ledger.md). Plus
     `Findings / follow-ups` → non-zero in output-contract.md AND SKILL.md (the Step 1.3 section
     + the Step 5.9 repoint target).
   - KG-token sweep (critic HIGH-1 — the extended set):
     `F60|F52|F41|laurentiu_read|kg_seed|kg_god_ro|fmcg_platform|omniaz|omnishelf|OD hub|seed/db/|Cortex|MSM_PROBE_DSN|StalenessThresholdDays|read_reference|migrate-provenance|validate-provenance|F38`
     with file-scoped allowances: **`validate-provenance` and `StalenessThresholdDays` allowed
     only in `references/project-profile.md`'s worked example; `F38` allowed only there + in
     SKILL.md's origin note; `read_reference` and `migrate-provenance` = 0 everywhere;
     everything else = 0 outside the worked example.**
   - Targeted generalization checks (grep, per critic HIGH-1): `carried(F38)` → **0** in
     output-contract.md, interview-protocol.md, feedback-ledger.md (the ported sections carry
     `carried({baseline})`); the pre-F60 flattened answer shape (`"question": "Q3"`) → 0 hits.
2. **skill-lint:** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` against the
   skill dir → 0 ERROR (WARN-level advisories acceptable per the KG-pilot precedent).
3. **Repo tests:** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green — the glob
   form is the repo's documented Node ≥22 invocation (`tests/README.md:63-66`; the bare-dir form
   errors `MODULE_NOT_FOUND` on Node 24 — reviewer-confirmed carry-over, plan line updated).
4. **Bump:** `node scripts/bump-plugin.mjs --dry-run` FIRST — the reasons list must name ONLY
   `plugins/nexus-analytics/**` files (today's uncommitted `docs/**`/`.claude/**` artifacts sit
   outside `plugins/` and must not appear; if any foreign plugin file appears, STOP per CLAUDE.md).
   Then `node scripts/bump-plugin.mjs --minor` → nexus-analytics **0.2.0** + CHANGELOG entry
   (MINOR: new capability — the feedback-loop layer).
5. **Commit (port + bump only):** stage `plugins/nexus-analytics/**` changes only; today's
   session docs and the F7 spike fixture stay uncommitted (owner commits those separately).
   Message: `feat(F3-AnalyticsBorrowWave): port the model-feedback loop into mine-semantic-model, release nexus-analytics 0.2.0`.
   **NO `gen-omni` this commit** — the omni twin is AHEAD of nexus (FL-2 back-port pending); the
   omni sync happens after that back-port lands, per the standing memory note.

## Decisions (disclosure)

- **Item-10 extension, not a 12th input**, for the provenance-validation attestation — the owner's
  literal directive ("fold it into the profile's item-10-style runner attestation"); eleven inputs
  total. (Two-way door.)
- **Staleness threshold = optional sub-field of item 11**; undeclared → the stale band merges into
  the sampled/pilot band. KG's config-key name stays KG-only. (Two-way door.)
- **Standalone defect-log repoint** (Step 5.9) — smallest honest fix for a shipped skill; critic
  HIGH-2 confirmed the diagnosis and required the target section to exist → Step 1.3 adds
  `## Findings / follow-ups` to the run-report template (KG's live run report already practices
  it). (Two-way door.)
- **Provenance-validation absence case** (critic MEDIUM-1) — either/or attestation; no validator
  declared ⇒ BR-E/BR-F contract-bound + disclosed in the Gate result, never silent. (Two-way
  door.)
- **`code({ref})` origin-enum extension is in scope** — BR-F is undefined without it; KG's v2
  changelog confirms it is part of the same layer. (Additive.)
- **No Audit-mode procedure changes beyond leg 0 / leg 3** — the plugin already documents Audit;
  only the F60 deltas port.

## Review gate

Code-grounded critic ran 2026-07-17 (both trees read in full): **GO-with-fixes — all folded
same-day** into the steps above. Disposition:

| Finding | Disposition |
|---|---|
| HIGH-1 KG-token sweep incomplete (`read_reference`, `migrate-provenance`/`validate-provenance` paths, `carried(F38)` pass silently) | Fixed — Step 6.1 sweep extended + file-scoped allowances + targeted `carried(F38)`/`read_reference` zero-checks; Step 1.2 gains explicit scrub bullets |
| HIGH-2 Step 5.9 repointed to a run-report section that didn't exist | Fixed — Step 1.3 adds `## Findings / follow-ups` to the template (KG's live report already practices it); acceptance grep added |
| MEDIUM-1 provenance-validator absence case unspecified (BR-E/BR-F silently advisory) | Fixed — either/or attestation in Step 4.3; disclosure line in Phase-5 step 6; BR-E/BR-F columns annotated |
| LOW-1 "four members" imprecise (token list has five; precedence has four) | Fixed — Step 1.1 reworded; `code` added to both lists |
| Gaps: BR-F tag retention; hardcoded ledger path scrub; Phase-3 "steps 1-2"; BR10 reconciliation | All folded (Steps 1.2, 5.2, 5.3, 5.5) |

Verified-correct by the critic (do not re-verify): all insertion points and KG line refs; the
`code({ref})` enum claim; the mode-enum lag; profile item counts; BR8-vs-release-commit is not a
contradiction; 0.1.1 → 0.2.0 MINOR.

Developer starts now (plan is post-fold). Step-2 reviewer reads both skill trees (owner rule 5).
