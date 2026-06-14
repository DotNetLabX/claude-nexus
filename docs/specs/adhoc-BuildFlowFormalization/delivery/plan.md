# Build-Flow Formalization — Implementation Plan

**Feature Spec:** None (ad-hoc TECHNICAL pass — the architect owns the definition: tech-spec + ADRs).
**Governing source:** `docs/research/2026-06-14-end-to-end-build-flow.md` (§7 recommendations, §8 decided
items + the one deferred question). **Binding cross-check (no spec.md):** the ADR register
(`docs/architecture/README.md`) — the critic runs **Mode 2 against the ADR register**, the done-check is
**ADR-mapping + grep-checkable acceptance** (architect.md:134).

## Context

The **back** of the Nexus flow (plan → build → verify) is mature; the **front** (idea → research →
proposal → definition) is informal. This pass formalizes the front as a **documentation layer** — it
names the stages, encodes the master skip gate, splits the technical/product definition branch, gives
proposals an RFC-lite lifecycle, and closes the one SDD traceability gap (`Satisfies: AC-n`). It is
**definition, not machinery**: the deliverable is ADRs + a tech-spec + a `proposal-format` skill + a
minimal `backlog.md` + light agent/rule edits. No new engine, agent, or hook.

**Hard constraint (honored throughout):** the flow **consumes** the research system — RESEARCH stage =
P1 (`research-before-asking.md`, shipped 1.8.2) + P2 (`search-researches` + research schema, in build as
`adhoc-ResearchKB`); the proposal layer adds only *impact (1–10)* + *effort (low/med/high)* on top of
P2's research-output format. **Reference P1/P2/P3; never restate them.**

**Answers driving scope (all user-confirmed, `questions.md` Q1–Q4):**
- **Q1:** RESEARCH = an explicit stage, as a thin doc layer over P1+P2, **zero new machinery**.
- **Q2:** **Tier 1 + R5** (the one-line `Satisfies: AC-n`). **R6** (T1–T4 verify harness) named **by
  reference only** — do **not** build it (collides with in-flight plugin-unit-test + mine-verify Pass-4).
- **Q3:** lifecycle rule in the flow ADR (ratified proposal ⇒ backlog row, ranked impact÷effort;
  unratified = idea inbox) + a **minimal** `docs/backlog.md` schema. **No migration** of existing proposals.
- **Q4:** new ADRs land **`Status: PROPOSED — owner ratifies`** (ADR-24 precedent).

## Scope

**In scope:**
- New ADRs in `docs/architecture/README.md` (PROPOSED): the **master gate** (R1), the **end-to-end flow
  + named RESEARCH stage** (R2/Q1), the **technical/product definition branch** (R4), the **proposal
  RFC-lite lifecycle + ratification + graduate-to-spec** (R3), the **ratified-proposal→backlog
  lifecycle** (R7/Q3). Grouped to avoid ADR sprawl (see Step 1).
- A **tech-spec** for this pass under `definition/` (the promoted-proposal artifact the flow itself
  prescribes — eating our own dog food).
- A `proposal-format` **skill** (ADR-4: formats are skills) — RFC-lite front-matter + NABC + lifecycle +
  impact/effort, born-compliant (skill-lint exit 0).
- A **minimal** `docs/backlog.md` (header + row schema + the lifecycle rule; **no** proposal migration).
- **R5:** the `Satisfies: AC-n` plan-step annotation, wired into `create-implementation-plan`'s template +
  the architect done-check + the reviewer Step-2 checklist.
- Light agent edits: `architect.md` (you own technical definition: tech-spec + ADRs; proposal→graduate),
  `po.md` (ratified product proposal = spec seed). Release bump + regen.

**Out of scope (named so the boundary is deliberate):**
- **R6 build** — the T1–T4 verify harness / `mine-verify` Pass-4 / plugin unit tests. Named **by
  reference** in the flow ADR's VERIFY row only; **not** built here (Q2; collides with two in-flight
  efforts).
- **Any redefinition of P1/P2/P3** (hard constraint). This pass references them.
- **Editing `research-before-asking.md`'s recall wiring** — that file is **owned by `adhoc-ResearchKB`
  (P2)** for recall edits (R-A). This pass only *names the RESEARCH stage in the flow ADR*; it does **not**
  edit that rule file (avoids the edit race — see Sequencing).
- A proposal/spec/plan **vocabulary doc** — the owner barred re-proposing it (MEMORY; R-B). The RFC-lite
  **front-matter + lifecycle** is a different, narrower thing and is what's built here.
- An **automated** Mode-0 proposal critic gate — user-confirm IS the gate (§3a, ADR-13; R-E). Documented,
  not enforced by machinery.

**Sequencing (for the team lead):** this pass and `adhoc-ResearchKB` both *touch the same conceptual
area* (`research-before-asking.md`). To avoid an edit race, **this plan deliberately does not edit that
rule file** — P2 owns it. If `adhoc-ResearchKB` has not yet landed, this pass still ships cleanly (it only
*references* the P1 rule by name in the flow ADR). No hard ordering dependency; no shared file is edited
by both.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|-------------------------|------|
| 1 | (none) | None | no | New ADRs (PROPOSED) in `docs/architecture/README.md`: master gate, flow+RESEARCH stage, definition branch, proposal lifecycle, backlog lifecycle. All-`None` prose authoring. | |
| 2 | (none) | None | no | Tech-spec at `definition/tech-spec.md` (the promoted-proposal artifact; the flow's own technical-definition shape). | |
| 3 | improve-skills | Follow | no | New `proposal-format` skill: RFC-lite front-matter (NABC + named owner + Draft/Ratified/Superseded + impact 1–10 + effort low/med/high). Sibling to `kb-entry-schema`. | |
| 4 | (none) | None | no | Minimal `docs/backlog.md`: header + row schema (impact÷effort rank) + lifecycle rule. No migration. | |
| 5 | (none) | None | no | R5 `Satisfies: AC-n`: add to `create-implementation-plan` template + architect done-check + reviewer Step-2 checklist. | |
| 6 | (none) | None | no | Light agent edits: `architect.md` (technical-definition ownership + graduate rule), `po.md` (ratified product proposal = spec seed). | |
| 7 | release-plugin | Follow | no | Bump `nexus` (MINOR — new capability), `gen-commands.mjs nexus` (architect + po changed), `gen-omni.mjs`. | |

**Skill-verification for the `None` steps:** Steps 1, 2, 4, 5, 6 author **prose/markdown** (ADRs,
tech-spec, backlog schema, a template annotation, agent-doc lines) — no skill frontmatter covers
authoring ADR/spec/agent prose. The **all-`None` exemption** applies to these (architect.md done-check
rule): an empty skill-log for a prose-authoring step is **not** a Fail. Step 3 (**Follow improve-skills**)
and Step 7 (**Follow release-plugin**) are the two real skill invocations and **must** appear in
`.claude/audit/skill-invocations.log`. All steps `TDD: no` — no executable behavior; verification is the
code-grounded critic review + skill-lint + `claude plugin validate`.

## Domain Model Changes
N/A — plugin-content / documentation change.

## Data Model Changes
N/A.

## Implementation Steps

### Step 1 — Write the new ADRs (Status: PROPOSED)
**File:** `docs/architecture/README.md` (append after ADR-24; update the Contents list at the top).
**Skill:** None (ADR prose authoring — no skill covers it; all-`None` exemption applies).
**Satisfies:** R1, R2/Q1, R4, R3, R7/Q3.

Author the ADRs in the register's existing house style (*Context → Decision → Why → Tradeoffs → Rejected
alternatives*), each headed **`Status: PROPOSED — owner ratifies`** (Q4; mirror ADR-24's status banner
verbatim in shape). **Group to avoid sprawl** — developer's judgment on exact ADR count, but the
**content units below are binding** (each must be present and greppable):

1. **Master gate (R1).** Mandatory ⇔ *cost-of-being-wrong = uncertainty × irreversibility*; **retire
   size-based reasoning**. State the one-line ADR form from §0 verbatim ("A stage is mandatory when
   getting it wrong is expensive or hard to reverse; a cheap two-way door collapses to its lightest
   artifact or skips."). Cross-reference the **allocation principle** and **ADR-13** (same reliable-gate
   reasoning). This is the spine every per-stage skip rule cites (R-D) — state it **once**.
2. **End-to-end flow + named RESEARCH stage (R2/Q1).** The canonical spine (IDEA → RESEARCH → PROPOSAL →
   [branch] DEFINITION → PLAN → BUILD → VERIFY → SHIP) as a logical artifact ordering, **not** gated
   waterfall. RESEARCH = a **thin doc layer over P1+P2** with **zero new machinery**: stage entry =
   "riskiest assumption known? reversible & cheap?" → skip; else run the **P1 inline gate + P2
   `search-researches`** engine and emit its output contract (recommendation + confidence + options
   eliminated). **Reference P1/P2 by name; do not restate their schemas** (hard constraint). Include the
   §6 mandatory-vs-skippable matrix (bottom three stages always mandatory; top three flex on the master
   gate). **VERIFY row names T1–T4 + `mine-verify` BY REFERENCE only** (Q2) — point at
   `docs/research/testing-claude-code-plugins.md` and the mine-verify proposals; explicitly note the
   harness is **not built in this pass**.
3. **Technical/product definition branch (R4).** Who owns the definition: **architect** owns the
   *technical* definition (**tech-spec + extracted ADRs**); **PO** owns the *product* definition
   (`spec.md` + acceptance criteria). Both converge at PLAN. The binding technical cross-check is the
   **ADR register**, not product docs (already architect.md:130-134 for ad-hoc). State "same thinking at
   two altitudes, one authoritative" (§2a): tech-spec/proposal = *where you explore*; ADR = *the durable
   one-decision record*; drift → **supersede, don't rewrite**.
4. **Proposal RFC-lite lifecycle (R3).** A proposal is **not a decision — a named owner ratifies**
   (enables disagree-and-commit). Front-matter = NABC (Need/Approach/Benefits/Alternatives + Unresolved)
   + named decision-maker + **Draft→Ratified→Superseded** + impact(1–10) + effort(low/med/high).
   Ratifier = **the owner; the architect recommends** (recommendation + confidence from **P1**, never
   self-rated). **Below-High confidence ⇒ "research first" (P1 branch), never ratification** — the
   anti-regression guarantee (§3a). **Mode-0 critic = default-skip; user confirmation IS the gate**
   (ADR-13; no automated gate). On ratification the proposal **graduates**: technical → promoted to
   tech-spec + ADRs extracted; product → handed to PO as spec seed. Frame as front-matter + lifecycle,
   **not** a vocabulary doc (R-B).
5. **Ratified-proposal → backlog lifecycle (R7/Q3).** Ratified proposal ⇒ a **backlog row**, ranked by
   **impact ÷ effort**; **unratified proposals stay the idea inbox** in `docs/proposals/`. Note Shape Up's
   warning (don't let unbet ideas accumulate as zombie rows). Point at the `docs/backlog.md` schema
   (Step 4).

**Acceptance:**
- `grep -n "PROPOSED — owner ratifies" docs/architecture/README.md` → present on **every** new ADR added
  by this step (Q4).
- All five content units are greppable: `grep -niE "uncertainty .{0,3}irreversibility|two-way door"` (R1);
  `grep -niE "RESEARCH|PROPOSAL.*ratif|graduate"` (R2/R3); `grep -niE "tech-spec.*ADR|architect owns"`
  (R4); `grep -ni "impact ÷|impact / effort|idea inbox"` (R7).
- **Hard-constraint check:** the RESEARCH ADR **references** P1 (`research-before-asking.md`) and P2
  (`search-researches`/`adhoc-ResearchKB`) by name and does **not** restate their entry/output schema —
  `grep -ni "research-before-asking\|search-researches\|adhoc-ResearchKB" docs/architecture/README.md`
  finds the references; no P1/P2 schema fields are copied in.
- The VERIFY row says T1–T4 + `mine-verify` are named **by reference / not built here** (R6 exclusion).
- The Contents list at the top of `README.md` lists each new ADR.

### Step 2 — Write the tech-spec (the promoted-proposal artifact)
**File:** `docs/specs/adhoc-BuildFlowFormalization/definition/tech-spec.md` (create `definition/`).
**Skill:** None (tech-spec prose; no skill covers it — all-`None` exemption).
**Satisfies:** R4 (the technical-definition artifact the flow itself prescribes).

Write the tech-spec in the §2a design-doc shape: **context · goals / non-goals · the formalized flow ·
the definition branch · cross-cutting (P1/P2/P3 boundary) · alternatives · unresolved**. It is the
durable "how" for this pass and the worked example of "technical feature → tech-spec + extracted ADRs"
that Step 1's R4 ADR describes. Keep it the rationale home; the ADRs hold the decisions and point back
here (one-authoritative-source rule). **Do not duplicate the ADR decision text** — link to it.

**Acceptance:**
- File exists with goals/non-goals + an explicit `## Non-goals` listing R6-build and P1/P2/P3-redefinition
  as out of scope.
- It **references** the ADRs from Step 1 (does not restate their decisions) — `grep -ni "ADR-" tech-spec.md`.
- Non-goals name the hard constraint (consumes, not redefines, P1/P2/P3).

### Step 3 — Create the `proposal-format` skill (born-compliant)
**Files:** `plugins/nexus/skills/proposal-format/SKILL.md` (+ any `references/` it cites).
**Skill:** **Follow improve-skills** (the single owner of "write a skill correctly", ADR-23).
**Satisfies:** R3 (the durable RFC-lite format the lifecycle ADR points at).

**Follow improve-skills** to scaffold a born-compliant format skill, sibling to `kb-entry-schema`. The
skill defines the proposal **front-matter + section order** (the format only — the *lifecycle rules* live
in the Step-1 ADR; the skill points back at the ADR, ADR-4 producer-format shape). Feature-specific
content the skill must define: NABC sections (Need/Approach/Benefits/Alternatives + Unresolved), the
named-decision-maker header field, `Status: Draft|Ratified|Superseded`, `Impact: 1–10`, `Effort:
low|med|high`, `Confidence:` (from P1, never self-rated), and the graduate-to-spec note. Frontmatter
`name` = `proposal-format`; description in when-to-use phrasing.

**Done-condition (ADR-23):** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs
plugins/nexus/skills/proposal-format` exits **0** (SKILL.md present, no BOM, frontmatter valid, name =
folder, description present, cited `references/` exist). Write tool, **UTF-8 no BOM** (never shell
redirection — the measured BOM incident class).

**Acceptance:**
- `skill-lint.mjs plugins/nexus/skills/proposal-format` → exit 0.
- A `Skill` invocation of `improve-skills` appears in `.claude/audit/skill-invocations.log` for this round
  (the architect done-check scores Step 3 against the log, not the self-report).
- SKILL.md defines all front-matter fields above; it **references** the lifecycle ADR rather than
  restating the ratification rule.

### Step 4 — Create a minimal `docs/backlog.md`
**File:** `docs/backlog.md` (new — the team-lead already *references* it but no file exists).
**Skill:** None (markdown schema authoring — all-`None` exemption).
**Satisfies:** R7/Q3.

Create the file the team-lead already depends on (team-lead.md:46, :158, :253 read/update it). **Minimal:**
a header explaining it is the ratified-proposal queue, a **row schema** (columns: slug/title · source
proposal · impact · effort · impact÷effort rank · status), and a one-line statement of the lifecycle rule
(ratified proposal ⇒ row; unratified = idea inbox in `docs/proposals/`). **No migration** of existing
proposals into rows — that is operator curation, not a plan step (Q3). One illustrative example row is
allowed; a full population is not.

**Acceptance:**
- `docs/backlog.md` exists with the column schema and the impact÷effort ordering rule stated.
- **No** bulk migration: the file contains the schema + at most one example row, not a row per existing
  `docs/proposals/*.md`.
- The lifecycle rule matches Step-1's R7 ADR (ratified ⇒ row; unratified = inbox).

### Step 5 — Wire `Satisfies: AC-n` traceability (R5)
**Files:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (+ its
`references/plan-template.md` if the annotation belongs in the template); `plugins/nexus/agents/architect.md`
(done-check section); `plugins/nexus/agents/reviewer.md` (Step-2 checklist) and/or
`plugins/nexus/skills/review-format/SKILL.md` checklist.
**Skill:** None (the change *edits* the plan-authoring skill + agent checklists — it is prose-rule
authoring, not an invocation of a pattern skill; all-`None` exemption).
**Satisfies:** R5 (the SDD traceability gap, §4; also the intent-drift defense, §5).

Add the **one-line `Satisfies: AC-n`** annotation as a plan-step convention:
- **`create-implementation-plan`**: add a short rule + a `Satisfies:` line to the step template (each plan
  step *may* cite the acceptance criterion / ADR-unit it satisfies; **lightweight**, not a full
  requirement-ID chain — the research's chosen weight, §8). For ad-hoc passes with no spec ACs, `Satisfies:`
  cites the **ADR unit** instead (consistent with the ad-hoc ADR-mapping done-check). **Note in the skill**
  that this is *optional-but-recommended*, not a hard gate (avoids retro-failing every existing plan).
- **architect done-check (`architect.md`)**: add one line — when a plan step carries `Satisfies:`, the
  done-check confirms the cited AC/ADR-unit is real (a cheap cross-check, not a new gate).
- **reviewer Step-2 (`reviewer.md` / `review-format` checklist)**: add a checklist line — verify code
  traces to the step's `Satisfies:` target where present (the intent-drift catch, §5).

**Binding constraint:** the annotation is **additive and optional** — it must **not** be written as a hard
done-check Fail for steps that omit it (existing plans predate it). Phrase as "where present, verify";
never "every step must carry it."

**Acceptance:**
- `grep -ni "Satisfies:" plugins/nexus/skills/create-implementation-plan/SKILL.md` (or its template) →
  the annotation rule is documented.
- `architect.md` and `reviewer.md` (or `review-format`) each reference checking `Satisfies:` **where
  present** — `grep -ni "Satisfies" plugins/nexus/agents/architect.md plugins/nexus/agents/reviewer.md`.
- The wording is **optional/where-present**, never a blanket "every step must" mandate (grep the
  surrounding sentence to confirm).

### Step 6 — Light agent edits (definition ownership + spec seed)
**Files:** `plugins/nexus/agents/architect.md`, `plugins/nexus/agents/po.md`.
**Skill:** None (agent-doc prose — all-`None` exemption).
**Satisfies:** R4 (operationalizes the definition branch in the two definer agents).

- **`architect.md`** (extend the ad-hoc/ADR-register block around :130-134): state that for a **technical
  feature** the architect **owns the definition — a tech-spec + extracted ADRs**, and a ratified technical
  **proposal graduates** (promoted to the tech-spec, ADRs extracted, never re-authored). One concise
  addition that points at the new ADRs; do not duplicate ADR text.
- **`po.md`**: add that a **ratified product proposal = the spec seed** the PO shapes into `spec.md`
  (product branch). One line; the PO's spec-authoring flow is unchanged otherwise.

**Acceptance:**
- `grep -ni "tech-spec" plugins/nexus/agents/architect.md` → the technical-definition ownership line exists
  (it currently does **not** — verified at plan time).
- `grep -niE "ratified.*proposal|spec seed" plugins/nexus/agents/po.md` → the product-proposal-as-spec-seed
  line exists (currently absent — verified at plan time).
- Both edits **reference** the Step-1 ADRs; neither restates ADR decision text.

### Step 7 — Release (bump + regenerate)
**Files:** `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md` (via the skill),
regenerated `plugins/nexus/commands/{architect,po}.md`, the `omni` twin.
**Skill:** **Follow release-plugin** (owns the ADR-9 release flow).
**Satisfies:** the ADR-9 release gate (a shipped-file change must bump or it never reaches users).

**Follow release-plugin** — propose **MINOR** (new capability: the `proposal-format` skill +
formalized-flow agent behavior). The skill owns the real manifest path and the CHANGELOG entry. Then
`node scripts/gen-commands.mjs nexus` — **architect + po** agent bodies changed (Step 6), so **2** commands
regenerate; if Step 5 also edits `reviewer.md`, regenerate **3**. Then `node scripts/gen-omni.mjs` (twin
rides the bump). The **team lead** commits content + bump + regenerated artifacts as one commit
(ADR-9 / ADR-20) — the developer does **not** commit (ADR-18).

**Acceptance:**
- `plugin.json` version bumped (MINOR) + a matching top CHANGELOG entry.
- Regenerated command files reflect the edited agents (2 or 3 — match the actual set of agents Steps 5–6
  edited).
- `claude plugin validate plugins/nexus --strict` passes; the `omni` twin regenerated.
- A `Skill` invocation of `release-plugin` appears in `.claude/audit/skill-invocations.log` for this round.

## Cross-Service Changes
N/A.

## Migration Notes
N/A — no `docs/proposals/*` migration (Q3); existing proposals keep their freeform `Status:` until an
operator chooses to adopt the new front-matter. The `proposal-format` skill applies to **new** proposals;
back-fill is operator curation, out of scope.

## Testing Strategy
No executable tests (documentation + skill-content change; all steps `TDD: no`). Verification is:
(1) the **code-grounded critic review** (Mode 2 vs the ADR register — see below); (2) **skill-lint** exit 0
on `proposal-format` (Step 3); (3) `claude plugin validate plugins/nexus --strict` (Step 7); (4) the
repo's existing `tests/` (skill-lint-all + rule-injection) after Step 7. The architect done-check scores
Steps 3 & 7 against `.claude/audit/skill-invocations.log` (the two non-`None` steps); Steps 1,2,4,5,6 are
all-`None` prose (empty-log exemption).

## KB Impact
None in the plugin repo. (`docs/backlog.md` and the ADR register are dev-repo artifacts, not KB entries.)

## Plan Review (mode: critic — owed, NOT run by the architect)

Per the user's instruction and ADR-21, the architect (spawned as a subagent) does **not** spawn or run the
critic. **Critic review is OWED on this plan.** The team lead spawns the critic in **Mode 2 against the ADR
register** (there is no spec.md — the ad-hoc lane, architect.md:134): cross-reference every plan step's
acceptance against the §7 recommendations + the new ADR content units, and verify the hard constraint
(references P1/P2/P3, restates none). The architect folds the critic's findings into this section and fixes
gaps on resume. **Recommend a code-grounded critic** (reads the actual `README.md`, agent files, and the
skill-lint script) — a doc-only critic is structurally blind to whether the agent-edit acceptance greps
actually match on-disk text, and this pass edits shipped agents.

## Open Questions
None — Q1–Q4 resolved (user-confirmed) in `questions.md`.
