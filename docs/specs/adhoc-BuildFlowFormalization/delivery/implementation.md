# Build-Flow Formalization — Implementation

Ad-hoc TECHNICAL pass. Governing source: `docs/research/2026-06-14-end-to-end-build-flow.md`.
Binding cross-check: the ADR register (`docs/architecture/README.md`). Plan:
`docs/specs/adhoc-BuildFlowFormalization/delivery/plan.md`.

**Hard constraint honored throughout:** this flow *consumes* the research system — RESEARCH stage =
P1 (`research-before-asking.md`, shipped 1.8.2) + P2 (`search-researches` + research schema, in build
as `adhoc-ResearchKB`). P1/P2/P3 are **referenced, never restated/redefined**. No shared file is edited
by both this pass and `adhoc-ResearchKB` (P2 owns `research-before-asking.md` recall edits; this pass
only *names* the RESEARCH stage in the flow ADR).

## Files Created
- `plugins/nexus/skills/proposal-format/SKILL.md` — **Step 3.** New born-compliant format skill (R3),
  sibling to `kb-entry-schema` (single-file SKILL.md, matching every existing `*-format` sibling — no
  `references/` needed, so lint E6 is trivially satisfied). Defines the RFC-lite proposal **front-matter**
  (Status: Draft|Ratified|Superseded, Decision-maker, Recommendation, Confidence [from P1, never
  self-rated], Impact 1-10, Effort low|med|high, Date) + **NABC body** (Need/Approach/Benefits/Alternatives
  + Unresolved, in order) + optional Graduate-to-spec/Provenance. The **format only** — the lifecycle
  rules (ratification, confidence gating, Mode-0 critic, graduate-to-spec semantics) **point back to
  ADR-28**, not restated. Written with the Write tool, UTF-8 no BOM. Done-condition met:
  `skill-lint.mjs plugins/nexus/skills/proposal-format` → exit 0 (`OK proposal-format`).

- `docs/specs/adhoc-BuildFlowFormalization/definition/tech-spec.md` — **Step 2.** The
  promoted-proposal technical-definition artifact (R4 — the worked example of "technical feature →
  tech-spec + extracted ADRs" that ADR-27 describes). §2a design-doc shape: Context · Goals · Non-goals
  · The formalized flow · The definition branch · Cross-cutting (P1/P2/P3 boundary) · Alternatives ·
  Unresolved. It is the **rationale home**; the decisions live in ADR-25…ADR-29 and it **points at
  them** (does not restate decision text — the one-authoritative-source rule). `## Non-goals` explicitly
  lists R6-build and P1/P2/P3-redefinition as out of scope and names the hard constraint (consumes, not
  redefines). Created the `definition/` folder.

- `docs/backlog.md` — **Step 4.** The minimal ratified-proposal queue the team-lead and PO already
  depend on (team-lead.md:46 + :253 read it; po.md:33/:54/:63 reference it) but which did not exist.
  Header explaining it is the ratified-proposal queue (not an idea inbox), a **row schema** (columns:
  Slug/Title · Source proposal · Impact 1-10 · Effort · Impact ÷ Effort · Status), the **impact ÷ effort
  ordering rule** with the appetite-bucket divisors (low=1/med=2/high=3), and the one-line **lifecycle
  rule** matching ADR-29 (ratified ⇒ row; unratified = idea inbox in `docs/proposals/`) + Shape Up's
  zombie-row warning. **One illustrative example row** (fictional `F12 Sample Feature`), explicitly
  marked illustrative; **no migration** of existing proposals.

## Files Modified
- `docs/architecture/README.md` — **Step 1.** Appended five new ADRs after ADR-24 (the five binding
  content units, grouped one-decision-per-ADR per the register's house style):
  - **ADR-25** — master gate (R1): a stage is mandatory by cost-of-being-wrong = uncertainty ×
    irreversibility; retires size-based reasoning; the §0 one-line form stated verbatim; the spine
    every per-stage skip rule cites, stated once. Cross-refs allocation principle + ADR-13.
  - **ADR-26** — end-to-end flow + named RESEARCH stage (R2/Q1): IDEA→RESEARCH→PROPOSAL→[branch]
    DEFINITION→PLAN→BUILD→VERIFY→SHIP as a logical ordering (not waterfall); RESEARCH = thin doc layer
    over P1+P2, zero new machinery; §6 mandatory-vs-skippable matrix; VERIFY names T1–T4 + mine-verify
    **by reference only, NOT built here**. P1/P2 referenced by name; schemas not restated.
  - **ADR-27** — technical/product definition branch (R4): architect owns the technical definition
    (tech-spec + extracted ADRs); PO owns product (spec.md + ACs); both converge at PLAN;
    "same thinking at two altitudes, one authoritative"; drift → supersede, don't rewrite.
  - **ADR-28** — proposal RFC-lite lifecycle (R3): a named owner ratifies; NABC + named decision-maker
    + Draft→Ratified→Superseded + impact + effort + confidence; confidence from P1, below-High ⇒
    research-first (anti-regression); Mode-0 critic default-skip, user-confirm IS the gate; ratification
    graduates (technical → tech-spec+ADRs; product → spec seed). Framed as front-matter, not a
    vocabulary doc (MEMORY/R-B).
  - **ADR-29** — ratified-proposal → backlog lifecycle (R7/Q3): ratified ⇒ backlog row ranked impact ÷
    effort; unratified = idea inbox; minimal `docs/backlog.md` schema, no migration; Shape Up zombie-row
    warning. Points at the Step-4 file.
  All five headed `Status: PROPOSED (owner ratifies)` (Q4; verbatim ADR-24 banner shape) **and** carry
  `— PROPOSED — owner ratifies` in the heading so the plan's exact-literal acceptance grep finds every
  new ADR body. Contents list at the top updated with the five new entries.

- `plugins/nexus/skills/create-implementation-plan/SKILL.md` + `references/plan-template.md` —
  **Step 5 (R5).** Added the optional `Satisfies: AC-n` (or `Satisfies: ADR-unit` for ad-hoc) per-step
  annotation as a plan-step convention: a short rule in SKILL.md Step 6 + a `Satisfies:` bullet in the
  template's "For each step" list. The SDD requirement→task link (lightweight, one-line, not a full
  ID chain) and the intent-drift defense. **Phrased optional-but-recommended / where-present** — the
  SKILL.md explicitly says **never** write it as a blanket "every step must carry `Satisfies:`" mandate
  (existing plans predate it). Lint exit 0.
- `plugins/nexus/agents/architect.md` — **Steps 5 + 6.** (Step 5) Added a `Satisfies:` cross-check
  line to the `## Step 1: Done Check` section (where-present, not a hard gate). (Step 6, R4) Extended the
  ad-hoc/ADR-register block: for a technical feature the architect **owns the definition — a tech-spec +
  extracted ADRs**, and a ratified technical **proposal graduates** (promoted to tech-spec, ADRs
  extracted, never re-authored). References ADR-25/ADR-27/ADR-28; does not restate ADR decision text.
  **Body edited ⇒ command regen owed (Step 7).**
- `plugins/nexus/agents/reviewer.md` — **Step 5 (R5).** Extended Review-Dimension 1 (Plan conformance):
  where a step carries `Satisfies:`, verify the code traces to that target (the intent-drift catch) —
  where-present, a step without it is not a finding. **Body edited ⇒ command regen owed (Step 7).**
- `plugins/nexus/agents/po.md` — **Step 6 (R4).** Added to the Feature Shaping Workflow starting-point:
  a **ratified product proposal = the spec seed** the PO shapes into `spec.md` (product branch).
  References ADR-27/ADR-28; one line, the spec-authoring flow otherwise unchanged. **Body edited ⇒
  command regen owed (Step 7).**
- `plugins/nexus/skills/review-format/SKILL.md` — **Step 5 (R5).** Added the matching `Satisfies:`
  where-present line to the Step-2 code-review checklist (the canonical checklist preloaded onto the
  reviewer). Lint exit 0.

### Step 7 — Release (dry-run only; team lead owns the bump + commit per Q5 + ADR-18)
Per the Q5 answer (owner-confirmed in the prompt), Step 7 is **dry-run + report only**. I did **not**
apply the bump, run `gen-commands`, run `gen-omni`, or commit; I did **not** touch/unstage the
pre-existing staged 1.8.3 (adhoc-GateNegationFix) release.

- `node scripts/bump-plugin.mjs --minor --dry-run` →
  **`nexus: MINOR  1.8.3 -> 1.9.0`** (base = HEAD's working tree, which carries the staged 1.8.3).
  Reasons listed: agent instruction/behavior change, skill changes (create-implementation-plan,
  review-format, proposal-format), owner-escalated to minor — **plus** a "hook behavior/enforcement
  change" which is the **pre-existing staged `pipeline-gate.js`** from adhoc-GateNegationFix, NOT this
  pass (I touched no hooks).
- **On-disk state:** HEAD `plugin.json` = 1.8.2; working tree (staged `M `) = 1.8.3 (the GateNegationFix
  release); the three GateNegationFix-staged files (plugin.json, CHANGELOG.md, pipeline-gate.js) remain
  staged exactly as found — untouched by me.
- **Command regen owed when the team lead applies:** **3** agent bodies changed (architect, po,
  reviewer) ⇒ `node scripts/gen-commands.mjs nexus` regenerates 3 commands; then `node
  scripts/gen-omni.mjs` (twin rides the bump).
- **`release-plugin` skill invoked** (logged: agent=developer, token=developer:implement, 2026-06-14) —
  its Procedure step 1 mandates dry-run-first, matching the Q5 instruction.

**See `## Deviations from Plan` for the OPERATOR ACTION REQUIRED note** (the bump/regen/commit the team
lead owns) and `## Carry-Over Findings`.

## Key Decisions
- **ADR count = 5, one per binding content unit.** The plan left the exact count to developer judgment
  ("group to avoid sprawl") but bound the five content units. The register's house style is strictly
  one-decision-per-ADR (ADR-1…ADR-24), so each content unit became its own ADR (ADR-25…ADR-29) rather
  than bundling — bundling would have produced a multi-decision ADR inconsistent with every existing
  entry. Cross-references between them (ADR-26 cites ADR-25 as the spine; ADR-28 graduates into ADR-27;
  ADR-29 reuses ADR-28's impact/effort) keep them a coherent set without a single mega-ADR.
- **Banner reconciliation (Q4 + acceptance grep).** Q4 said mirror ADR-24's banner verbatim
  (`PROPOSED (owner ratifies)`, parens); the Step-1 acceptance grep is the em-dash literal
  `PROPOSED — owner ratifies`. Honored both: the `>` banner is verbatim ADR-24 (parens), and the em-dash
  phrase is added to each ADR heading + each Contents entry. Result: `grep "PROPOSED — owner ratifies"`
  = 11 hits, present on every new ADR; the banner still matches the ADR-24 precedent exactly.
- **Step 5 / Step 6 both touch `architect.md`.** Step 5 adds the `Satisfies:` done-check cross-check;
  Step 6 adds the technical-definition-ownership line. Both are sanctioned by the plan (Step 5 names
  architect.md; Step 6 names architect.md) — recorded as one file with two step attributions, not a
  surprise edit.
- **`review-format` skill edited (Step 5).** The plan's Step 5 file list names `reviewer.md` *and/or*
  `review-format`. I edited **both** — reviewer.md (Review-Dimension 1) for the agent-file acceptance
  grep, and the `review-format` checklist (the canonical Step-2 checklist preloaded onto the reviewer)
  so the rule lives where the reviewer actually reads it. Both within plan sanction.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | ADR prose authoring — plan all-`None` exemption (Skill: None, TDD: no) |
| 2 | None | tech-spec prose authoring — plan all-`None` exemption (Skill: None, TDD: no) |
| 3 | improve-skills | Follow (logged: agent=developer, token=developer:implement, 2026-06-14). Authored shipped skill directly in `plugins/nexus/skills/` per ADR-1 dev-repo (the skill's "route to feedback file" channel is for *consuming* projects, not this repo). Lint exit 0. |
| 4 | None | `docs/backlog.md` markdown-schema authoring — plan all-`None` exemption (Skill: None, TDD: no) |
| 5 | None | prose-rule authoring (edits the plan-authoring skill + agent checklists) — plan all-`None` exemption (Skill: None, TDD: no). Edited skills re-linted (exit 0). |
| 6 | None | agent-doc prose authoring — plan all-`None` exemption (Skill: None, TDD: no) |
| 7 | release-plugin | Follow (logged: agent=developer, token=developer:implement, 2026-06-14). **Dry-run only** per Q5 — reported `1.8.3 -> 1.9.0`; no apply/regen/commit (team-lead-owned, ADR-18). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Pre-existing lint-test failure in a `nexus-dotnet` skill | low | reviewer/architect | `tests/lint/frontmatter.test.mjs` fails: `plugins/nexus-dotnet/skills/create-module-claude-md/SKILL.md: unknown frontmatter key "disable-model-invocation"`; key exists on HEAD (line 5), file not in my git status | **Not from this pass** (nexus-dotnet, untouched by me; predates the pass). The frontmatter lint allowlist may simply not include `disable-model-invocation` yet. Flagged so it isn't re-investigated as a regression. Not in scope to fix here. |
| Two co-staged releases in the working tree (Q5) | medium | team-lead | HEAD=1.8.2; staged 1.8.3 = adhoc-GateNegationFix (plugin.json + CHANGELOG + pipeline-gate.js); this pass's MINOR dry-run = `1.8.3 -> 1.9.0` | The team lead reconciles commit grouping (ADR-9/ADR-18): commit GateNegationFix 1.8.3 first, then apply+commit this pass's 1.9.0 bump + 3 regenerated commands + omni twin. I did not touch the staged 1.8.3. |
| `claude plugin validate` clean; repo nexus lint tests green | n/a (info) | reviewer | `claude plugin validate plugins/nexus --strict` → passed; `tests/lint/*` 31/32 pass (the 1 fail is the pre-existing nexus-dotnet item above) | Verification record for Step 7 / Testing Strategy items 3–4. The skill-lint-all, skill-ref, frontmatter (nexus), wiring, and command-backing tests all pass for nexus. |

## Deviations from Plan

- **Step 7 — dry-run only, by Q5 instruction (sanctioned).** The plan's Step 7 describes the full
  release (apply the bump, gen-commands, gen-omni). The Q5 answer in the prompt (owner-confirmed)
  narrowed the developer's Step-7 to **dry-run + report**; the team lead owns the apply/regen/commit and
  reconciles the two co-staged releases. This is a plan-sanctioned scope narrowing, not an unplanned
  deviation.
  - **OPERATOR ACTION REQUIRED (team lead):** the MINOR bump (`1.8.3 -> 1.9.0`) is **not applied** and
    **not committed**. To complete the release the team lead runs, after reconciling the staged
    GateNegationFix 1.8.3: `node scripts/bump-plugin.mjs --minor` (apply) → edit the new CHANGELOG entry
    to describe this pass → `node scripts/gen-commands.mjs nexus` (3 commands: architect, po, reviewer)
    → `node scripts/gen-omni.mjs` (+ `--check`) → `claude plugin validate plugins/nexus --strict` →
    commit content + bump + CHANGELOG + regenerated commands as one commit (ADR-9/ADR-20). Helper/owner:
    the `release-plugin` skill (`scripts/bump-plugin.mjs`). The dry-run is verified (exit 0).
- **No `gen-commands` / `gen-omni` run (consequence of the above).** Because the bump is not applied,
  the generated command files + omni twin are intentionally **not** regenerated in this pass — they
  regenerate when the team lead applies the bump (the regen must ride the same commit as the bump,
  ADR-9). This is why the 3 edited agent bodies (architect, po, reviewer) do not yet have matching
  regenerated `commands/*.md` in my changes.

## Fix Cycle 1

Consolidated fix-list merged from two independent Step-2 reviews. Surgical edits only — no rework
beyond the listed items. (One refuted finding explicitly left as-is; see below.)

**FIX 1 — backlog spec-link had nowhere to live (schema gap).** Added a **`Spec` column** to the
backlog schema. `docs/backlog.md`: new 7-column header + aligned divider + example row
(`Slug/Title | Source proposal | Impact (1-10) | Effort | Impact ÷ Effort | Spec | Status`,
example `Spec` = `—`); the `Spec Ready` lifecycle line (now "the PO puts the spec path in the `Spec`
column"); a new Status-values clarification + a dedicated `Spec` column bullet (empty `—` until a spec
exists, filled with `docs/specs/{slug}/definition/spec.md` on `Spec Ready`).
`plugins/nexus/agents/po.md:54` made consistent — "link the spec" → "put the spec path in the row's
`Spec` column." (Adding the column was the preferred fix per the fix-list, since po.md needed a home
for the link.)

**FIX 2 — Impact-optional contradicted backlog ranking.** Added the reconciling rule. Canonical home =
the **`proposal-format` skill** (ADR-4, formats are skills): rewrote the front-matter `Impact:` comment
("omit for pure-internal plumbing" → "may be omitted ONLY on the master-gate 'one ADR line' path — see
Impact/Effort rule below") and added a new **Impact/Effort rule** bullet to the front-matter rules — a
proposal that omits `Impact` is the master-gate "one ADR line" path (ADR-25) and does **NOT** enter the
ranked backlog; **any proposal that becomes a backlog row MUST carry both `Impact` and `Effort`.**
Mirrored a one-line clause into **ADR-29** (the backlog-lifecycle owner) so the register agrees. ADR-28
needed no change — it lists Impact/Effort as front-matter without asserting Impact-optional, so it did
not disagree. Verified the master-gate "one ADR line" path exists verbatim in **ADR-25:666** ("collapses
to its lightest artifact (a line) or skips") before referencing it.

**FIX 3 — illustrative row pointed at a non-existent real-looking file.** `docs/backlog.md` example row:
`docs/proposals/sample-feature.md` → `docs/proposals/<proposal-slug>.md` (obvious placeholder, can't be
read as a real reference).

**FIX 4 — tech-spec drift-prevention (LIGHT hardening, no rework).** An independent reviewer already
verified the tech-spec does not duplicate ADR decision text; this was a hardening pass only. Checked the
four named ranges (~86-91, 93-97, 105-109, 125-132). Each section already opens with "decided in ADR-NN"
and is framed as "rationale this tech-spec adds." Added an explicit **"owns this decision"** pointer to
the two section openers whose following sentences, read in isolation, state a decision: the formalized-
flow opener now names **ADR-26 (owns the matrix + output-contract decision) / ADR-25 (owns the master
gate)**; the definition-branch opener now names **ADR-27 (owns this decision)**. Both are parenthetical
additions — no restructure, no rewrite. The §125-132 Cross-cutting bullets already carry inline
ADR-26/28/29 ownership refs on every decision-flavored line and needed no change.

**DO NOT TOUCH (refuted finding) — left as-is.** ADR-26's "P1/P2 referenced by name; their entry/output
schemas are not restated here" hard-constraint wording is **unchanged** — both the reviewer and the
architect done-check verified naming the research output contract the flow consumes is not restating
P2's schema.

**Verification.** `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs
plugins/nexus/skills/proposal-format` → **exit 0** (`OK proposal-format`) — the only edited `plugins/`
file with a lint gate. Grep confirms `sample-feature.md` no longer appears as a live reference (the only
remaining hits are in review/communication-log artifacts that quote the original finding). The stale
`plugins/nexus/commands/po.md:54` is a **generated artifact** (regenerated from `agents/po.md` by
`gen-commands.mjs`) — it is **not** hand-edited (CLAUDE.md); its regen is already covered by the existing
OPERATOR ACTION REQUIRED note (po.md was already on the 3-agent regen list). No new release action: the
bump remains team-lead-owned (ADR-18), and `po.md` was already a body change in the original round, so
the owed bump tier (MINOR) and regen set (architect, po, reviewer) are unchanged.

*Fix Cycle 1 — developer, 2026-06-14*

*Status: COMPLETE — developer, 2026-06-14*
