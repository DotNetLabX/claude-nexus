# F5-SkillGapCapture

**Feature Spec:** None — collapsed definition (ADR-25 two-way door): **ADR-59**, authored in Step 7.
Precedent: `F2-AdhocIsSoloOnly` (definition = ADR-58, no `definition/spec.md`).

## Context

The pipeline **detects** skill gaps well and **captures** them unreliably. `## Skill Gaps` is a fixed
heading in `lessons-format`, 22 of 54 lessons files carry one, and three runs' entries drove
`docs/proposals/estate-authoring-skill-2026-07.md` to its recurrence bar — the mechanism is real and has
paid off. But only `developer.md:158` names both the heading and the fields. The architect — whose
Skill Mapping runs a *verified* per-step skill search, making a `None` disposition a confirmed gap — has
the instruction scattered across four documents in four phrasings, none naming the heading or any field,
and its own `## After Every Review Cycle` (`architect.md:358`) names only `## Architect Lessons`.

The leak is measured. Counting only plans whose `Gap?` cell **explicitly directs a skill-gap log** — the
one rule the column actually supports — **4 of 11 shipped `lessons.md` with no `## Skill Gaps` section**:
`F1-NotesPlugin` (live), `adhoc-DotnetSkillSweep`, `adhoc-ResearchKB`, `adhoc-SddLifecycle`. That last
one's `plan.md:41-42` has two rows reading "Log to lessons"; its `lessons.md` carries Architect, Reviewer
and Developer Lessons — and no gap. The architect instructed itself and dropped it.

Underneath is a worse leak: **≥6 more plans declared a real gap in the column and never directed a log at
all**. `adhoc-PipelineHardening` alone has **9** gap cells — "M7 — no skill governs pipeline state
vocabulary", "Hook logic — no covering skill", "No test infra exists yet" — and no `## Skill Gaps`
section. A gap that stops at the column is never consolidated: the learner reads only `lessons.md` and
`communication-log.md` (`learner.md:26-27`).

**And the column cannot be reliably counted, because it has no vocabulary.** Enumerating every non-empty
`Gap?` cell across 33 plans finds five incompatible uses: gap declarations; explicit non-gap
dispositions ("expected, not a gap" — `adhoc-UtilitySkillsHardening`, the *correct* usage); confidence
ratings (`high`/`medium` — `adhoc-RecipeEstateAudit`); owner assignments (`Owner: operator` —
`adhoc-MineVerifyRepo`); and bare booleans (`yes`/`no` — `adhoc-NexusFleetView`). This is not incidental
— it is why the first two attempts to measure this leak (2-of-4, then 6-of-13) each produced a different
wrong number from a different grep of the same column. An undefined column is why Step 5 must give it a
vocabulary for the owner's "marker" intent to mean anything (see `## Decisions`).

**Impacted:** the `nexus` plugin only. No runtime surface — agent/skill/rule prose plus the ADR register.

## Scope

**In scope** (the owner's selected 5-file scope, plus the machinery it forces):
- `lessons-format/SKILL.md` — the fielded `## Skill Gaps` entry template + provenance tag. **The one owner.**
- `architect.md` — the `## Skill Gaps` write is the binding record, not the `Gap?` column.
- `solo.md` — `skills: lessons-format` frontmatter + a lessons mandate (it has neither today).
- `developer.md` — slim its duplicated field list to a reference (one-owner sweep; see `## Decisions`).
- `create-implementation-plan/SKILL.md`, `plan-template.md`, `agents-workflow.md` — collapse the four
  routing phrasings to one reference.
- Generated commands, ADR-59, the `docs/backlog.md` F5 row, the version bump.

**Explicitly out of scope:**
- `reviewer.md`, `po.md`, `critic.md` — the owner chose against it; no demonstrated gap-detection trigger.
- Any change to *how* the learner or `improve-skills` consume the section — read-side is unchanged.
- Retro-filling `## Skill Gaps` into the leaked runs — 4 directed (`F1-NotesPlugin`,
  `adhoc-DotnetSkillSweep`, `adhoc-ResearchKB`, `adhoc-SddLifecycle`) plus ≥6 undirected (worst:
  `adhoc-PipelineHardening`, 9 cells). **`F1-NotesPlugin` is live (`In Progress`)** — its gap is
  recoverable by its own run; surface it to the owner rather than back-filling from here.
- The `../omni` twin sync — a separate repo's commit, owner-run after this lands (CLAUDE.md).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | `lessons-format/SKILL.md`; the 5-field entry template + provenance | |
| 2 | (none) | — | no | `agents/architect.md`; binding-write rule + reference | Log to lessons.md — see gap note below |
| 3 | (none) | — | no | `agents/solo.md`; frontmatter + lessons mandate | (same gap) |
| 4 | (none) | — | no | `agents/developer.md`; slim `:158` to a reference | (same gap) |
| 5 | improve-skills | Follow | no | `create-implementation-plan/SKILL.md` + `plan-template.md`; `rules/agents-workflow.md` | |
| 6 | (none) | — | no | `node scripts/gen-commands.mjs nexus` | |
| 7 | (none) | — | no | ADR-59 in `docs/architecture/README.md`; F5 row in `docs/backlog.md` | |
| 8 | release-plugin | Follow | no | PATCH `1.34.5` → `1.34.6`; flag possible MINOR to owner | |

**Gap note (dogfood — the developer logs this using the Step-1 template):** steps 2–4 edit a *shipped
agent file in the dev repo*, and no skill covers that. `improve-skills` covers shipped **skills** (via
its dev-repo carve-out) but not agent files; `improve-flow` is learner-only and scoped to CLAUDE.md /
`docs/conventions/`. This repo edits agent files constantly (`adhoc-AdrAmendments`,
`adhoc-PipelineTrustRules`, `adhoc-MineRepoPilotHardening` — the last three commits), so the pattern is
repeatable. This feature's first user is itself.

**TDD:** `no` on every step. Pure prose/registry editing — no testable runtime behavior. The gates here
are deterministic greps and `skill-lint.mjs`, pinned per step below and **executed at plan time**.

## Domain Model Changes

None.

## Data Model Changes

None.

## Implementation Steps

### Step 1 — `lessons-format/SKILL.md`: the fielded entry template (the one owner)

**Follow improve-skills** (dev-repo carve-out: fix the shipped skill directly in
`plugins/nexus/skills/lessons-format/SKILL.md`; the lint is the done-condition).

**Placement is binding — read this before editing.** `## Skill Gaps` at `SKILL.md:40` and its two hint
bullets at `:41-42` sit **inside the fenced lessons.md skeleton** (fence opens `:12`, closes `:43`). The
`### Improvement Proposal` template is *not* "right below it" in the same structure — it is a **separate**
fenced block at `:47-53`, introduced by its own prose at `:45`. So:
- **Keep** `## Skill Gaps` + its two hint bullets in the skeleton — that is the section map / targeting
  anchor, and removing it degrades the anchor this step's own accept criteria protect.
- **Add** the fielded entry template as a **new fenced block after `:43`**, mirroring the
  `### Improvement Proposal` precedent at `:45-53` — its own short prose intro, then its own fence.
- **Never nest a fence inside the skeleton block.** `skill-lint` has no fence-balance check (E7 only
  flags angle-bracket tokens), so broken markdown would lint green.

The real defect is the asymmetry: the section that feeds `improve-skills` has no field template while the
improvement proposal beside it has a full one.

Required fields (owner-selected shape; `Kind` added — see `## Decisions`):

```markdown
### {Suggested skill name}
- **Kind:** missing | ill-fitting
- **Searched for:** {what you needed a skill to do}
- **Why it would help:** {what it would cover; what you did instead}
- **References:** {file paths the pattern lives in / was extracted from}
- **Evidence:** [{slug}, ...]
```

Domain constraints the fields exist to serve — state them, don't restate the consumers:
- `Kind` is `improve-skills`' first branch (`SKILL.md:8`; the routing it drives is `## Two Channels`
  at `:17`) — a gap and a fix route to different homes.
- `References` is a structural dependency, not decoration: `improve-skills` step 1 checks those files
  still exist and step 5 extracts the real pattern from them ("don't invent abstract instructions").
- `Evidence` is the provenance tag. Extend the existing **Provenance & strengthen-don't-duplicate**
  rule (`SKILL.md:55-64`, today scoped to the improvement proposal's `**Evidence:**` line) to cover gap
  entries, so a recurring gap **strengthens** one entry instead of spawning a twin. This is what makes
  the learner's 2-occurrence threshold (`learner.md:17`) readable off the entry.

Keep the `## Skill Gaps` heading text byte-identical — it is a targeting anchor in **seven files**, from
an executed `grep -rl "Skill Gaps" plugins/` (not from memory — the first two counts of this list were
both wrong):
1. `skills/lessons-format/SKILL.md` — this file: the Section map (`:10`) **and** its own append-only rule (`:71`)
2. `agents/developer.md:131`
3. `commands/developer.md` — **the generated mirror of (2)**; regenerated by Step 6, never hand-edited
4-7. four `nexus-analytics` skills: `answer-qa/SKILL.md:54`, `data-investigation/SKILL.md:54`,
   `mine-semantic-model/SKILL.md:215`, `semantic-model-query/SKILL.md:66`

**Accept (executed at plan time; baseline in parentheses):**
- `grep -c "Searched for:" plugins/nexus/skills/lessons-format/SKILL.md` → **1** (was 0)
- `grep -c "^## Skill Gaps" plugins/nexus/skills/lessons-format/SKILL.md` → **1** (was 1 — anchor intact,
  and `1` not `2` proves the skeleton heading was kept rather than duplicated into the new block)
- **Fence balance** (catches the nesting failure lint cannot):
  `grep -c '^```' plugins/nexus/skills/lessons-format/SKILL.md` → **even** (was 4)
- **Repo-wide anchor stability:** `grep -rl "Skill Gaps" plugins/` → **all 7 pre-existing consumer files
  above still match**. This is a superset check, not an equality one — Steps 2/3/6 deliberately *add*
  `architect.md`, `solo.md` and their generated commands to this list, so the final count is 11, not 7.
  What must never happen is a pre-existing file dropping out.
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/lessons-format` → **exit 0**
  (path shape verified: the script does `resolve(arg)` off a `.git`-anchored root, `skill-lint.mjs:35-43,55`)

`Satisfies:` ADR-59 — one-owner entry template.

### Step 2 — `architect.md`: the Skill Gaps write is binding

**Skill: None.** No skill covers editing a shipped agent file (see Gap note).

Two edits to `plugins/nexus/agents/architect.md`:
1. `## After Every Review Cycle` (`:356-358`) — today it names only `## Architect Lessons`. Add the
   `## Skill Gaps` obligation, pointing at the Step-1 template for the fields (never restating them).
2. The `Gap?`-column routing — make the `lessons.md` write the **binding record** and the `Gap?` column
   a plan-local marker. The architect's `None` disposition is a *verified* gap (the Skill Mapping's
   "Skill verification before setting None" sub-protocol), so this is the highest-signal detector in the
   system and it must not terminate in a column the learner never reads.

Pattern reference: `developer.md:158` is the rule that measurably works — mirror its trigger shape.

**Accept:**
- `grep -c "Skill Gaps" plugins/nexus/agents/architect.md` → **≥1** (was **0**)
- The fields are NOT restated in `architect.md` — it references `lessons-format`. Gate the **whole field
  set**, not one field (one-owner, `proven-patterns.md` AP3):
  `grep -cE "Searched for:|Why it would help:|\*\*Kind:\*\*|\*\*References:\*\*" plugins/nexus/agents/architect.md` → **0**

`Satisfies:` ADR-59 — architect routing.

### Step 3 — `solo.md`: the missing lessons mandate

**Skill: None.**

`plugins/nexus/agents/solo.md` has **no `skills:` frontmatter at all** (`:1-6`) — so `lessons-format`
never preloads — and mentions `lessons.md` only inside the Paths compact reference, though
`lessons-format:68` says "No agent exits without writing lessons." **That structural absence is the
defect — not a measured leak rate.**

Be precise about the evidence. An earlier draft of this plan claimed solo "writes Skill Gaps ~41% of the
time"; that was the **global** rate across all 54 lessons files — a different population — and it is
**withdrawn**. The real corpus: `^## Solo Lessons` appears in **1 of 54** lessons files, and that one has
no `## Skill Gaps`. But that does not convict solo either: ADR-58 made `adhoc-*` solo-only on
**2026-07-12**, three days ago, and every `adhoc-*` lessons file predates it (verified via git:
`adhoc-PipelineHardening` 2026-06-14, `adhoc-ResearchKB` and `adhoc-SddLifecycle` 2026-07-11). Those were
pipeline-role runs in the adhoc lane, before the rule. So Step 3 is **forward-looking**: solo is about to
own this repo's highest-volume lane while carrying no lessons mandate at all.

1. Add `skills: lessons-format` to the frontmatter (`developer.md:6` and `reviewer.md:6` are the shape).
2. Add a lessons obligation covering `## Solo Lessons` **and** `## Skill Gaps` (the `lessons-format`
   section map already reserves `## Solo Lessons` with "Missing skills or conventions"). Reference the
   Step-1 template for fields.

Constraint: solo's `adhoc-*` lane has a `delivery/`-only folder — the path `docs/specs/{slug}/delivery/
lessons.md` is already correct and needs no special-casing.

**Accept:**
- `sed -n '1,7p' plugins/nexus/agents/solo.md | grep -c "lessons-format"` → **1** (was **0**)
- `grep -c "Skill Gaps" plugins/nexus/agents/solo.md` → **≥1** (was **0**)

`Satisfies:` ADR-59 — solo mandate.

### Step 4 — `developer.md`: slim the duplicate to a reference

**Skill: None.**

`developer.md:158` carries the field list inline. Once Step 1 lands, that is a second owner of the same
fact — the drift this feature exists to fix (`improve-skills` AP3 one-owner; AP2 sweep every normative
surface). Keep the **trigger** in `developer.md` (the rule that works); move the **fields** to the
reference.

Preserve both cases the current rule covers — missing skill *and* ill-fitting skill. Step 1's `Kind`
field is what carries the ill-fitting case forward; do not let it drop.

**Accept:**
- `grep -c "Log skill gaps" plugins/nexus/agents/developer.md` → **1** — this gates the **trigger
  itself**. `grep -c "Skill Gaps"` → ≥1 is **not** sufficient and must not be used here: `:131` is an
  unrelated hard rule that also matches, so a ≥1 gate stays green even if the `:158` trigger is deleted
  outright — green on the exact failure this step exists to prevent.
- `grep -c "ill-fitting" plugins/nexus/agents/developer.md` → **≥1** (was 1) — the ill-fitting case
  survives the slim. Required in prose above; gated here.
- `grep -c "suggested name, coverage, references used" plugins/nexus/agents/developer.md` → **0**
  (was 1 — inline field list gone)

`Satisfies:` ADR-59 — one-owner sweep.

### Step 5 — Collapse the four routing phrasings to one reference

**Follow improve-skills** for the two skill files (dev-repo carve-out; consolidating pass — net
complexity flat or down, never additive patching). `rules/agents-workflow.md` is a rule file, edited
directly in the same step.

The four phrasings, each verified this session:

| File:line | Today | Becomes |
|---|---|---|
| `skills/create-implementation-plan/SKILL.md:39` | "Log to the Gaps column for future skill creation" | route to `lessons.md` `## Skill Gaps` per `lessons-format` |
| `skills/create-implementation-plan/references/plan-template.md:26` (`Gap?` cell) | "Log to lessons.md" | keep — it already routes correctly |
| `skills/create-implementation-plan/references/plan-template.md:31` | "Log the gap." | name the destination |
| `rules/agents-workflow.md:289` | "Log the missing skill in lessons.md" | **keep the sentence**; append the heading + a `lessons-format` reference |

**Give the `Gap?` column a vocabulary.** This is what makes the owner's "marker, not the record" intent
true rather than nominal — today the column has no vocabulary, and the enumeration in `## Context` found
five incompatible uses across 33 plans. Define exactly two legal values in `plan-template.md`'s
**Disposition rules** (`:28-33` — **not** `:22`, which is the bare table header row and hosts no
semantics):
- `gap: {what's missing}` — a real gap. The binding record is the `## Skill Gaps` entry in `lessons.md`.
- `—` — no gap. An explicit "expected, not a gap" note stays welcome (`adhoc-UtilitySkillsHardening`
  models the good form).

Confidence, owner, and TDD values do not belong in this column — each has its own home. Do not delete the
column: it earns its place at plan-read time, and the owner chose to keep it.

**Accept:**
- `grep -c "Log to the Gaps column" plugins/nexus/skills/create-implementation-plan/SKILL.md` → **0** (was **1**)
- `grep -c "Skill Gaps" plugins/nexus/rules/agents-workflow.md` → **≥1** (was **0** — the heading is now
  named). **Do not gate `"Log the missing skill in lessons.md"` → 0** — the correct minimal edit *appends
  to* that sentence rather than rewording it, so a `→ 0` gate would fail a correct implementation.
- `grep -c "gap: " plugins/nexus/skills/create-implementation-plan/references/plan-template.md` → **≥1**
  (vocabulary defined; was **0**)
- `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/create-implementation-plan` → **exit 0**

`Satisfies:` ADR-59 — one-owner reference.

### Step 6 — Regenerate the commands

**Skill: None.** `plugins/nexus/commands/*.md` are generated from `agents/*.md` (CLAUDE.md — don't
hand-edit). Steps 2–4 edited three agent files, so:

```
node scripts/gen-commands.mjs nexus
```

**Accept:** all three regenerated commands carry their agent's Step 2–4 text (`gen-commands.mjs` loops
every agent, so `developer.md` regenerates too — gate it, don't assume it).
- `grep -c "Skill Gaps" plugins/nexus/commands/architect.md` → **≥1** (was **0**)
- `grep -c "Skill Gaps" plugins/nexus/commands/solo.md` → **≥1** (was **0**)
- `grep -c "Log skill gaps" plugins/nexus/commands/developer.md` → **1** — the trigger-shaped gate, for
  the same reason as Step 4.

### Step 7 — ADR-59 + the F5 backlog row

**Skill: None.**

1. **ADR-59** in `docs/architecture/README.md` — this feature's collapsed definition (ADR-25: two-way-door
   change → one ADR, no tech-spec). **Register re-checked this session: highest is ADR-58; 59 free, no
   renumber.** Follow `ADR-58`'s header-note shape verbatim (`README.md:1480-1487`) — it is the F2
   precedent for an owner-directed, ADR-collapsed feature.

   The decision to record: **a detected skill gap's binding record is `lessons.md` `## Skill Gaps`, in
   the fielded form `lessons-format` owns; every other surface references it and none restates it. The
   plan's `Gap?` column is a marker with a fixed two-value vocabulary — never the record.**

   Context = the measured leak: **4 of 11** plans that explicitly directed a skill-gap log shipped no
   `## Skill Gaps` section, plus **≥6** that declared a gap and directed nothing (`adhoc-PipelineHardening`:
   9 gap cells, 0 captured). **Use these numbers — not the "2 of 4" an earlier draft of this plan
   carried** (see `## Decisions`; the column's five-way vocabulary is why both early counts were wrong).
   Cite the evidence; don't restate the template.

2. **`docs/backlog.md`** — add the F5 row. ADR-58 requires the row for any F-slug. Follow the F2 row's
   shape (`backlog.md:23`): Spec column points at the ADR, not a spec path. Source = owner-directed
   2026-07-15 (no proposal). Status = `In Progress`, flipped to `Done` at close.

**Accept:**
- `grep -c "^## ADR-59" docs/architecture/README.md` → **1**
- `grep -c "^| F5-SkillGapCapture" docs/backlog.md` → **1**
- `grep -c "^## ADR-60" docs/architecture/README.md` → **0** (no accidental renumber)

`Satisfies:` ADR-25 — collapsed definition; ADR-58 — backlog row.

### Step 8 — Version bump (last step, once)

**Follow release-plugin.** Run **once, after every edit above has landed** — `bump-plugin.mjs`
classifies the whole working tree against HEAD, so a mid-sequence run double-bumps (CLAUDE.md).

`nexus` `1.34.5` → **`1.34.6`** (PATCH default). **Check the dry-run's reasons list against the files
this plan names** — a reason naming a file outside F5 means a concurrent feature contaminated the
classification: stop and hand the bump back.

**Accept:**
- `plugins/nexus/.claude-plugin/plugin.json` version = `1.34.6`
- `plugins/nexus/CHANGELOG.md` has the F5 entry
- Bump + content land in **one commit** (the fast lane has no plan-approval commit boundary)

`Satisfies:` ADR-9 — release flow.

## Cross-Service Changes

None. The `../omni` twin regen is owner-run after this lands — out of scope (see Scope).

## Migration Notes

None.

## Testing Strategy

No test suite — this is agent/skill/rule prose. The gates are the per-step greps above (every baseline
executed at plan time, then re-executed after the critic review) plus `skill-lint.mjs` exit 0 on both
touched skills.

The behavioral proof is **deferred by construction**: a PASS here does not prove agents will now log
gaps — that only shows up in the next few runs' `lessons.md`. The honest post-ship check is the
cross-check that found the leak, re-run at ~5 closed slugs: for each new plan carrying a `gap:` cell,
does its `lessons.md` carry a matching `## Skill Gaps` entry? **Baseline to beat: 4 of 11 directed gaps
leaked (36%), plus ≥6 undirected.** Note that Step 5's `gap:` vocabulary makes that check a single grep
instead of the hand-judged enumeration this plan needed — the measurability is itself part of the
deliverable.

## KB Impact

None — `docs/kb/` holds business rules; this is pipeline machinery.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| `developer.md` (Step 4) included, though the owner's 5-file scope didn't name it | Step 1 makes `lessons-format` the owner; leaving `developer.md:158`'s inline field list creates a second owner immediately — the exact drift this feature fixes (`improve-skills` AP2 sweep-every-surface, AP3 one-owner) | Leave `developer.md` untouched — it's the rule that works, don't risk it | decided |
| `**Kind:** missing \| ill-fitting` added to the owner-selected template | `developer.md:158` covers both cases today; dropping the distinction silently narrows a shipped guarantee, and `improve-skills:8` branches gap-vs-fix as its *first* decision | Ship the 4 owner-selected fields as-is | decided |
| ADR-59 + backlog row included (Step 7) | ADR-25's collapse path makes the ADR *be* the definition — without it F5 has none; ADR-58 mandates the row for an F-slug. F2 is the precedent for exactly this shape | Ship prose only, no ADR | decided |
| `Gap?` column kept, not deleted | Owner's selected preview: "marker; lessons is the record". It earns its place at plan-read time | Delete the column as redundant | decided |
| PATCH (`1.34.6`), not MINOR | CLAUDE.md: PATCH by default, the **owner** escalates; the tool never auto-escalates by file type | MINOR — solo gaining a lessons mandate is arguably new capability | decided — flagged to owner in Step 8 |
| `reviewer.md` / `po.md` left out | Owner scope choice; neither has a demonstrated skill-search trigger | Extend to all producer roles | decided |
| The `Gap?` column gains a fixed two-value vocabulary — `gap: {text}` / `—` (Step 5) | The owner chose "column = marker; lessons is the record", but a column with **no vocabulary cannot be a marker**: the enumeration found five incompatible uses across 33 plans, which is precisely why both early leak counts were wrong. This **implements** the owner's selected intent rather than overriding it | Leave the column undefined as today — "marker" stays nominal and the leak stays unmeasurable | decided — **surfaced to owner** (new evidence they did not have at scope time) |
| The leak statistic corrected to **4 of 11 directed (+≥6 undirected)** after the critic review | The plan's original "2 of 4" came from a too-narrow grep that missed cells like *"No scaffold skill for marketplace plugins — log to lessons.md"*; the critic's "6 of 13" came from a broader matcher and over-counted. Neither is countable without a vocabulary — the Step-5 fix is what makes the post-ship check honest | Ship the original number into ADR-59 | decided |

## Open Questions

None. Both of the critic's open questions were resolved against the repo — see `## Plan Review`.

## Plan Review

**Mode 2, code-grounded critic** (owner-selected). Verdict: **NO-GO — 4 HIGH, 4 MEDIUM, 2 LOW**, all
folded. The critic's systemic read was correct and worth recording verbatim, because it is the same
failure this feature exists to fix:

> *"This plan is rigorous exactly where it grepped, and unreliable exactly where it counted… this is a
> feature about the gap between detecting something and recording it faithfully, and the plan's own
> recording is where it leaks."*

Every claim executed at plan time held (14/14 baselines, 4/4 phrasing citations, the ADR-register check,
both script behaviours — the critic tried to break these and could not). Every claim *reasoned to* was
wrong. Dispositions:

| Finding | Disposition |
|---|---|
| HIGH-1 — Step 4's gates go green if the trigger is deleted (`developer.md` matches "Skill Gaps" twice: `:131` + `:158`) | **Confirmed by re-grep, fixed.** Gates now target the trigger (`"Log skill gaps"` → 1) and the previously-ungated `ill-fitting` case |
| HIGH-2 — leak count wrong | **Confirmed, fixed — but the critic's replacement was also wrong.** My "2 of 4" under-counted; its "6 of 13" over-counted. Root cause is deeper than either: the column has no vocabulary. Now 4-of-11 directed + ≥6 undirected, with the counting rule stated, and Step 5 adds the vocabulary |
| HIGH-3 — "~41%" is the global rate misattributed to solo | **Confirmed, withdrawn.** Solo's real corpus is 1-of-54 `## Solo Lessons`. Its open question also resolved: git confirms every `adhoc-*` lessons file predates ADR-58 (2026-07-12), so Step 3 is forward-looking, not contradicted |
| HIGH-4 — `lessons-format:40-42` is inside a fenced block; both implementations pass the gates | **Confirmed, fixed.** Placement is now binding (keep the skeleton heading, add a separate block after `:43`), plus a fence-balance gate `skill-lint` structurally cannot provide |
| MEDIUM-1 — Step 5's `→ 0` gate would fail a *correct* minimal edit | **Confirmed, fixed** — gate the addition, not the removal |
| MEDIUM-2 — `plan-template.md:22` is the table header row | **Confirmed, retargeted to `:28-33`** |
| MEDIUM-3 — four analytics consumers, not three; plus `lessons-format:71` | **Confirmed, corrected to six anchors** |
| MEDIUM-4 — Step 2 gated 1 of 5 fields | **Confirmed, fixed** — whole field set |
| LOW-1 — `improve-skills:8` vs `:17` label | Fixed |
| LOW-2 — `commands/developer.md` ungated | Fixed |
| Its `skill-lint.mjs` path-shape hypothesis | **Disproven by the critic itself** — `resolve(arg)` off a `.git`-anchored root (`:35-43,55`). No change |
