# Questions — adhoc-BuildFlowFormalization (formalize research/proposal stages + end-to-end flow)

**Slug:** adhoc-BuildFlowFormalization · **Phase:** Architect Phase 1 (Analyze) · **Date:** 2026-06-14
**Inputs (binding):** `docs/research/2026-06-14-end-to-end-build-flow.md` (governing source; §7 = the 7
recommendations, §8 = decided 2026-06-14 + the one deferred question), the ADR register
(`docs/architecture/README.md`, ADR-1 … ADR-24), `docs/proposals/research-system-overview.md` (P1/P2/P3),
in-flight `docs/specs/adhoc-ResearchKB/` (P2).
**Pass type:** ad-hoc TECHNICAL — no spec.md; I own the definition (tech-spec + ADRs). The flow
**consumes** P1/P2/P3 — hard constraint: do not redefine or duplicate them.

This is a **definitional** pass: most of §7's recommendations land as ADRs + a tech-spec + light
convention/agent/skill edits, not as code. Four judgment calls determine the plan's size and shape.
Q1 is the question §8 explicitly deferred to me; Q2–Q4 are scope forks I must not decide unilaterally
(each would reverse or expand what the research scoped). Items I resolved against source are under
"Resolved by the architect".

---

## Q1 — Research as a separate named pipeline stage, or keep P1's inline gate? (the deferred question)

**To:** user (owner — the question §8 deferred to the architect)
**Status:** Open
**Step:** Phase 1 analysis

**Context.** §8 deferred: *"resolve whether a named research/spike stage adds value over P1's inline
gate for large work, or whether P1 alone suffices."* P1 (shipped 1.8.2, `research-before-asking.md`)
is an **inline, per-decision** gate: an unconfirmed load-bearing assumption lowers confidence →
research-before-verdict, fired by any agent at the moment it would otherwise assume. The research's
own canonical flow (§1, §6) lists RESEARCH as a **named stage** with an output contract
(recommendation + confidence + options eliminated).

These are not in tension — they are the same engine at two scopes. P1 is the *micro* gate (fires
inside any stage); a named RESEARCH *stage* is the *macro* placement of that same engine at the front
of a large/uncertain piece of work, before a proposal is even drafted. P2 (`adhoc-ResearchKB`) already
gives the stage its output/recall contract (`search-researches` + the entry schema). So "name the
stage" costs almost nothing new — it is a **documentation/ADR act** that points at P1+P2, plus the
master-gate skip rule (skip when the riskiest assumption is already known; mandatory for a one-way
door). It does **not** add a new engine, agent, or artifact.

**Question.** Name RESEARCH an explicit pipeline stage (documented in the flow ADR, mandatory-vs-skip
governed by the master gate, output contract = P1+P2's), or leave research purely as P1's inline gate
with no named stage?

**Recommendation:** **Name it a stage** — but as a *thin documentation layer over P1+P2*, with zero
new machinery. The stage entry = "is the riskiest assumption known? reversible & cheap?" → skip, else
run the P1/P2 engine and emit its output contract before drafting a proposal. This is strictly
additive to P1's inline gate (the inline gate keeps firing inside every other stage) and is what makes
the master gate's "Research: skip | mandatory" row in §6 actually mean something.
**Confidence:** high — the research converged on it (§1, §6, §7.2), it reuses P1/P2 with no
duplication, and the cost is an ADR paragraph + a row in the flow doc, not a build.

---

## Q2 — Deliverable scope: definition-only, or definition + the mechanical pieces? (the big fork)

**To:** user (owner — scope; sizes the whole plan)
**Status:** Open
**Step:** Phase 1 analysis

**Context.** §7 has 7 recommendations. They split cleanly into two tiers:

- **Tier 1 — pure definition (ADRs + tech-spec + light prose edits):** R1 master gate, R2 name
  RESEARCH (Q1), R4 technical/product branch (architect owns tech-spec+ADRs; PO owns spec), and the
  *documentation* half of R3 (proposal = RFC-lite, named-owner ratification, Draft→Ratified→Superseded,
  graduate-to-spec). These are the research's already-**decided** items (§8). Low risk, high value,
  small surface — mostly the flow ADR + a `proposal-format` skill (ADR-4 shape) + a few agent-doc lines.

- **Tier 2 — mechanical wiring (touches shipped behaviour):** R5 the `Satisfies: AC-n` annotation
  **enforced** (plan-template + done-check + reviewer), and R6 the tiered T1–T4 verify harness wired as
  the build gate (sequences existing research — `testing-claude-code-plugins.md`, `mine-verify`). R6 in
  particular overlaps the **already-proposed** plugin-unit-test work in "Known limitations / future
  work" and the `mine-verify` Pass-4 generic-harness seed — it is its own substantial build.

**Question.** Does this pass deliver **Tier 1 only** (formalize the front of the flow — the actual ask
in the title: "formalize the research and proposal stages"), with R5/R6 spun out as their own
follow-on passes? Or does it also take on Tier 2 in the same plan?

**Recommendation:** **Tier 1 in this pass; R5 as a small, contained add-on here; R6 as a separate
follow-on pass.** Rationale: (a) the title scopes this to *research + proposal* formalization — Tier 1
is exactly that; (b) R5 (`Satisfies: AC-n`) is genuinely small (a one-line annotation + a done-check
column) and the research rates it *need: high / weight: medium* — cheap to fold in and it closes the
one real SDD gap (§4); (c) R6 is a multi-tier harness that collides with two existing in-flight
proposals (plugin unit tests, mine-verify Pass-4) — planning it here would duplicate or pre-empt them,
violating the same "don't re-specify a system this flow consumes" discipline the hard constraint
applies to P1/P2/P3. I recommend this pass **wire verify by reference** (the flow ADR names T1–T4 +
`mine-verify` as the verify-stage gate and points at the existing research) but **not build** the
harness.
**Confidence:** high on Tier 1 + R5; medium on excluding R6 (it is defensible to include a *thin*
verify-doc step, which my recommendation does — the fork is only whether to *build* the harness, which
I recommend against here).

---

## Q3 — Is the ratified-proposal backlog (R7) in scope, and does it reconcile with `docs/backlog.md`?

**To:** user (owner — scope + a naming/ownership decision)
**Status:** Open
**Step:** Phase 1 analysis

**Context.** R7: "ratified proposals become backlog rows; unratified stay the idea inbox in
`docs/proposals/`; rank rows by impact ÷ effort." Verified against source: **`docs/backlog.md` does
not exist** — the team-lead agent *references* it (reads it to triage "what's next", flips rows to
Done on ship) but no file is present. So R7 is greenfield, not a conflict — but it introduces a real
artifact + a lifecycle rule (proposal ratified ⇒ a backlog row is created; impact÷effort ordering)
that the team-lead already assumes exists.

**Question.** Create `docs/backlog.md` and the ratified-proposal→backlog-row lifecycle (R7) in this
pass, or scope this pass to research+proposal only and leave the backlog as a separate pass?

**Recommendation:** **Define the lifecycle rule in the flow ADR (ratified proposal ⇒ backlog row,
ranked impact÷effort; unratified = idea inbox) and create a minimal `docs/backlog.md` header/schema**,
because the team-lead already depends on the file and a flow that ends at "ratified" with nowhere for
the row to land is incomplete. Keep it **minimal** — the schema + the rule, not a migration of every
existing proposal into rows (that is operator curation, not a plan step). If you'd rather keep this
pass tightly on research+proposal, I'll move R7 to its own follow-on and just note the dependency.
**Confidence:** medium — value is clear and the file is already assumed to exist, but it is a
defensible separate concern; your call on whether to bundle it.

---

## Q4 — Do the new ADRs land as DECIDED or PROPOSED (owner-ratifies-later)?

**To:** user (owner — ratification; this flow *defines* ratification, so it must model it)
**Status:** Open
**Step:** Phase 1 analysis

**Context.** This flow's central governance rule is *"a proposal is not a decision; a named owner
ratifies"* (§3). The architect writes ADRs/tech-specs but **does not ratify** them — by this flow's
own rule, you do. Precedent in the register: ADR-24 shipped its implementation but its ADR text is
explicitly **`Status: PROPOSED (owner ratifies)`**. The research items are marked "decided 2026-06-14"
in §8 — but "decided in the research" and "ratified into the ADR register" are different acts under
the very rule we're encoding.

**Question.** Should the new ADRs this pass writes (the flow ADR + the technical/product-branch ADR +
the proposal-lifecycle ADR) land as **`Status: PROPOSED — owner ratifies`** (consistent with ADR-24
and with the flow's own ratification rule), or as **decided** records (since §8 already records the
owner's 2026-06-14 decisions)?

**Recommendation:** **Land them as `Status: PROPOSED — owner ratifies`**, eating our own dog food: the
flow we're defining says the architect recommends and the owner ratifies, and ADR-24 already set this
exact precedent in the same register. You flip them to decided in one act when you ratify — which is
itself the first run of the ratification gate this pass defines.
**Confidence:** high — it is the only framing consistent with the rule the pass encodes and with the
ADR-24 precedent; the cost of being wrong is one word in a status line.

---

## Q5 — Step 7 bump: a 1.8.3 release is already staged uncommitted; what version does this MINOR pass land?

**From:** developer
**To:** architect (routes to team lead — it owns the bump + commit, per the prompt)
**Status:** Open
**Step:** Phase 1 analysis (Step 7 — Release)

**Context.** The Phase-1 prompt flagged that Step 7's bump edits `plugin.json`/`CHANGELOG.md`, which
already have a separate pending release staged in the working tree. Verified on disk:
- `HEAD:plugins/nexus/.claude-plugin/plugin.json` = **`1.8.2`** (last commit `3270979`).
- Working tree (git status: `M ` staged) = **`1.8.3`**, with a staged `CHANGELOG [1.8.3]` entry +
  a staged `pipeline-gate.js` change. This is the **`adhoc-GateNegationFix`** release (untracked spec
  folder `docs/specs/adhoc-GateNegationFix/`; CHANGELOG dates it 2026-06-13) — **staged but not yet
  committed**.
- `scripts/bump-plugin.mjs` reads the **current working-tree** `plugin.json` as the base
  (`readFileSync(manifestPath)`, line 184/243), so a `--minor` run started now reads `1.8.3` and
  produces **`1.9.0`** (MINOR resets patch) — not `1.8.4`.

So Step 7's "MINOR" lands as **1.9.0 on top of the un-committed 1.8.3**, and two unrelated releases
(GateNegationFix PATCH + this MINOR) are co-staged in one working tree. The CHANGELOG would then carry
both a `[1.9.0]` (this pass) and the pre-existing `[1.8.3]` entry. I do **not** commit (ADR-18), so the
sequencing/commit decision is the team lead's — but it affects what *I* run in Step 7.

**Question.** When I reach Step 7, should I (a) run `node scripts/bump-plugin.mjs --minor` as-is and let
it produce **1.9.0** on top of the staged 1.8.3 (the mechanically-correct outcome — the GateNegationFix
1.8.3 becomes an intermediate version the team lead commits separately first), or (b) is the
GateNegationFix 1.8.3 going to be committed/handled before this pass's Step 7 so I bump from a clean
committed base? Either way the team lead reconciles the final commit(s); I only need to know which base
to bump from and whether the `[1.8.3]` CHANGELOG entry stays.

**Recommendation:** Run `--dry-run` first at Step 7 and **report the proposed version + base to the team
lead before applying** (release-plugin Procedure step 1 already mandates dry-run-first). Default to **(a)
— accept 1.9.0 on top of the staged 1.8.3**: it is the script's deterministic output, it loses nothing
(the GateNegationFix entry is preserved, the team lead commits the two releases in whatever order/grouping
it chooses), and it avoids me touching/unstaging another pass's release. I will **not** revert, unstage,
or rewrite the staged `[1.8.3]` entry — that is the team lead's to reconcile.
**Confidence:** high — the bump mechanics are verified against the script source and the CHANGELOG, the
dry-run-first + team-lead-commits division is exactly ADR-9/ADR-18 + the release-plugin skill, and (a) is
non-destructive. The only genuinely open part is the team lead's *commit grouping*, which is theirs to
decide and does not block my implementation of Steps 1–6.

---

## Resolved by the architect (recorded, not blocking — override if any is wrong)

- **R-A — No overlap with P1/P2/P3 (hard constraint honored).** The flow **consumes**: RESEARCH stage =
  P1 (inline gate) + P2 (`search-researches` + research schema, in build as `adhoc-ResearchKB`); the
  proposal layer adds only *impact (1–10)* and *effort (low/med/high)* on top of P2's research-output
  format (§3a). I will reference P1/P2/P3 by name and **not** restate their schemas. Where this pass
  and `adhoc-ResearchKB` both touch `research-before-asking.md`, the flow ADR references the P2 wiring
  rather than re-editing it — P2 owns that file's research-recall edits; this pass only adds the
  *stage-naming* paragraph if it needs one. (Sequencing note for the team lead under the report.)

- **R-B — Proposal lifecycle vocabulary, decided against re-proposing.** MEMORY note
  "proposal-spec-plan-vocabulary" records the owner already decided **not** to codify a
  proposal/spec/plan vocabulary doc and "don't re-propose it." This pass does **not** add such a doc;
  the proposal **front-matter + Draft→Ratified→Superseded lifecycle** (R3) is a *different, narrower*
  thing (an RFC-lite header + ratification gate on `docs/proposals/*`), which §3/§8 explicitly decided
  to add. I will frame it as front-matter + a `proposal-format` skill, not a vocabulary doc — staying
  inside the owner's prior decision. (Flagging so it isn't mistaken for the re-proposal that was barred.)

- **R-C — Artifact homes (ADR-1/ADR-4).** New durable definition → ADRs appended to
  `docs/architecture/README.md` (the dev-repo ADR register) + a tech-spec for this pass under
  `docs/specs/adhoc-BuildFlowFormalization/definition/`. The proposal RFC-lite shape → a
  `proposal-format` **skill** (ADR-4: formats are skills), not inline prose. Any shipped-agent edits
  (e.g. an architect-doc line "you own technical definition: tech-spec + ADRs") are minimal and trigger
  a **release-plugin bump** (MINOR — new capability) + `gen-commands` if frontmatter changes.

- **R-D — The master gate (R1) is the spine, stated once.** R1 (mandatory ⇔ cost-of-being-wrong =
  uncertainty × irreversibility; retire size-based reasoning) is §0's "one finding that governs
  everything." It already echoes the allocation principle and ADR-13's reliable-gate reasoning. I will
  state it once as the flow ADR's governing rule and have every per-stage skip rule cite it, rather
  than restating a skip heuristic per stage.

- **R-E — Mode-0 proposal critic = default-skip, user-confirm IS the gate (§3a, decided).** Consistent
  with ADR-13 (automated gates on background subagents don't hold) and the existing critic Mode 1/2.
  This pass documents Mode-0-on-confirmation; it does **not** add an automated proposal gate. No new
  enforcement machinery — the user confirm is the enforcement, exactly as §3a decided.
