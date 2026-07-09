# Tech-Spec — The Conformance Reviewer: a corpus-grounded advisory lens for the PR tail

**Slug:** adhoc-ConformanceReviewer
**Status:** **Ready (2026-07-09)** — ratified by the owner at the definition checkpoint (spec-time review: architect self cross-check; grounding = two cite-checked research entries + same-day internal evidence + live surfaces re-verified this week). Plan-time code-grounded critic mandatory. **Plan:** `docs/specs/adhoc-ConformanceReviewer/delivery/plan.md`
**Owner (definition):** architect (technical branch, ADR-27)
**Ratifier:** Laurentiu (repo owner)
**Source:** the PR-tail v2 discussion (2026-07-08/09) — owner concern: "the PR reviewer must be
conceptually different… quality/patterns/principles/naming conventions… something you could put in
SonarQube but smarter." Owner decisions 2026-07-09: **build, don't buy** (maintenance effort is
equivalent; we maintain our skills anyway); the reviewer is **triggered at the PR and runs before the
human**, who then curates with the AI comments already in place.
**Research grounding:** `docs/kb/research/ai-pr-reviewer-landscape.md` (T1+T2, 42 sources, 3-skeptic
verified) · `docs/kb/research/sonar-codescene-llm-review-boundary.md` (T3, 17 sources) ·
`definition/internal-evidence.md` (T4, our own review-history classification).
**Supersedes:** the parked `adhoc-PRReviewTailV2` drafts (tech-spec + plan, never graduated). Their
inline-comments delivery mechanics are absorbed into Layer D below (including the plan-critic's HIGH
finding on the hunk-level 422 trap). Their draft ADR numbers (52/53) were never extracted and are NOT
reused: this spec's ADRs are **ADR-53/54** — ADR-52 was taken the same day by `adhoc-AgentGrounding`
(register verified 2026-07-09; plan-critic CRITICAL). The v2 "runnable local `/code-review`" amendment
is **dropped** — a fourth correctness pass at the PR is the noise this concept exists to avoid
(owner: "I don't want another reviewer"; internal evidence: 74% of Step-2 reviews close clean).

> Technical-branch definition (ADR-27): the binding cross-check is the ADR register, not product docs.
> Durable decisions live in the ADRs under **ADRs to extract**.

---

## Context

**The lens, precisely.** The human PR reviewer today does not re-check business rules (the developer +
pipeline own those) — they review *conceptually*: patterns, principles, conventions, naming, shape.
That lens is the only one in the flow that is not automated, and the pipeline's existing reviewers
produce it only incidentally (10–20% of findings, nearly all LOW — internal-evidence.md). The
Conformance Reviewer automates the *first pass* of exactly that lens and posts it on the PR **before**
the human looks, so the human curates an annotated PR instead of cold-reading ("AI goes first, human
curates" — ADR-35's model, with the right payload this time).

**Why build (not adopt), on the evidence:**
- The rules-file *mechanism* is commodity across commercial tools, but adherence is non-deterministic,
  truncated (Copilot reads 4,000 chars/file), and **no vendor measures conformance accuracy**
  (landscape entry, Findings).
- Independent benchmarks: most AI PR reviewers run **<10% precision** (best ~19% F1), and agents
  systematically **under-cover Design/Documentation/Maintainability — the repo-specific categories**
  (c-CRAB), whose recommended fix is documented conventions — the artifact estate nexus already
  maintains (`docs/conventions/`, `docs/architecture/`, `docs/reference-model.md`, `docs/tech-debt/`,
  graphify output, the skills themselves).
- The only production-proven precision architecture is **rules-grounded generation + a fail-closed
  filter** (BitsAI-CR: 16.8% → 57% → 75% precision) — structurally identical to the nexus mine→verify
  pattern.
- Context strategy is settled by ablation: **diff + targeted externally-computed facts beats
  whole-file context**, which degrades every tested model.

**Hard constraints (carried).**
- Advisory only, never a gate: no approval events, no merge authority, never blocks (ADR-35 posture;
  habituation evidence). The team-lead owns all outward ops (ADR-18/20); host-gated via the ADR-36
  adapter; unattended tail unreachable in v1 (ADR-32).
- Correctness is out of charter — the pipeline reviewer, Codex, and tests own it. This reviewer files
  zero bug reports.
- Stack-agnostic core: grounding artifacts are read-if-present; the dotnet lane adds nothing but its
  own convention files (ADR-3/5).

**Out of scope (roadmap, named only):** PR-triggered unattended runs (GitHub Action / webhook);
learner loop-back from per-finding dismissals (now measurable once findings are inline); org-level
rule inheritance; non-GitHub hosts (ADR-36 seam exists); a Sonar/linter-output ingestion adapter.

---

## v1 definition & acceptance criteria

v1 ships one **nexus skill** (`conformance-review`) + its PR-tail integration + a calibration gate.
Prose/skill ACs are grep-checkable; the calibration AC is artifact-checkable.

### Layer A — Charter (the conceptual core)

- **AC-A.1** The skill's charter names what it checks, each grounded in the repo's own corpus:
  (1) **semantic naming** — does the name tell the truth about behavior; (2) **convention
  conformance** — the diff vs `docs/conventions/` (Read-Index, ADR-5); (3) **pattern divergence** —
  the diff vs an existing skill pattern or `docs/reference-model.md` virtue covering the same shape;
  (4) **architecture/layering intent** — the diff vs `docs/architecture/` + graphify facts where
  present; (5) **debt-delta** — the diff worsens a `docs/tech-debt/` registered cluster;
  (6) **semantic duplication** — reimplements an existing helper/pattern.
- **AC-A.2** The charter names what it NEVER checks: correctness/bugs/security patterns (pipeline +
  tests own them); the deterministic tier per the T3 boundary entry (metrics, duplication-by-token,
  naming format, declared layering rules — linters/Sonar territory, whoever owns it per-project);
  git-history metrics. The LLM never absorbs the deterministic tier even when no analyzer exists —
  that tier belongs to stack linters/CI, and the dotnet extension documents that placement.
- **AC-A.3** **Cite-or-drop grounding:** every finding MUST cite the specific corpus source it
  enforces (convention file + section, skill name, architecture doc line, reference-model virtue,
  tech-debt entry). A candidate finding with no citable basis is dropped at the filter stage — generic
  best-practice commentary is structurally excluded. **No corpus, no review:** in a repo with none of
  the grounding artifacts, the skill declines to run (with a one-line explanation) rather than
  degrade to generic taste.

### Layer B — Two-stage precision-first runtime

- **AC-B.1** **Stage 1 (generate):** input = the PR diff + *targeted* corpus facts (relevant
  convention sections, matched skill/pattern names, graph facts) — never whole source files stuffed
  as context. Emits candidate findings: `{category (A.1 1–6), corpus citation, diff location
  file:line, one-line rationale, confidence high|medium}`.
- **AC-B.2** **Stage 2 (filter, fail-closed):** a fresh-context skeptic pass attempts to refute each
  candidate (citation real? diff actually does what the finding claims? already conformant?).
  A finding survives only if the skeptic confirms both the citation and the diff reading. Killed
  findings are logged, not posted.
- **AC-B.3** **Volume cap:** at most N surviving findings post (default 5, config-overridable),
  highest-confidence first; the remainder are summarized in one collapsed line ("M further
  lower-confidence observations available on request"). Volume↔relevance evidence drives the cap.
- **AC-B.4** Both stages run on the configured helper model (default sonnet-class via
  `.claude/nexus-agents.json`), never the main-session model by default.

### Layer C — Calibration before live (the go-live gate)

- **AC-C.1** The skill ships a **calibration mode**: run over the last K merged feature diffs from
  git history (no PR needed), produce `docs/specs/{slug}/delivery/calibration-report.md` — every
  surviving finding with its citation, for the owner to grade (valid / noise / wrong-citation).
- **AC-C.2** **Process gate (prose, fail-closed):** the skill refuses PR posting until a calibration
  report exists and the owner has recorded a pass verdict in it. The precision bar is the owner's
  call at grading time — the spec does not invent a number.

### Layer D — Delivery on the PR (absorbed from the parked v2, corrected)

- **AC-D.1** Findings post as **one PR review** via the ADR-36 adapter: `gh api --method POST
  repos/{owner}/{repo}/pulls/{n}/reviews`, `event: COMMENT` (always — self-PR restriction),
  `comments[]` = one entry per finding whose file+line lie **inside the PR diff hunks**; body = the
  provenance line + verdict-free summary + out-of-hunk findings. Provenance line: "Conformance
  review (advisory) — grounded in this repo's docs/conventions + architecture; not a correctness
  review."
- **AC-D.2** **Fallback ladder (the tail never errors):** (1) a finding whose file is untouched by
  the diff, or whose line falls outside the changed hunks (parse `gh pr diff` `@@` headers — the
  hunk-level check; a file-level check is insufficient, the reviews API 422s on out-of-hunk lines),
  rides in the body; (2) if the inline POST fails for any reason, fall back once to a single
  `gh pr review --comment --body-file` body. Worst case = one plain comment.
- **AC-D.3** PR-tail integration: the team-lead's PR Tail offers the conformance review as the
  post-projection step, gated by a new 4b key `prConformance` (bool, default `false` in v1),
  attended-only, host-gated — referencing the canonical `Host Adapter & PR Tail` rule, not restating
  it. With the key off or the host unavailable, the tail behaves exactly as today.
- **AC-D.4** The skill is also invocable standalone (`/nexus:conformance-review {diff|branch|PR#}`)
  for pre-PR local use — same charter, same two stages, output to the terminal instead of the PR.

### Layer E — Register + release hygiene

- **AC-E.1** ADR-53/54 extracted verbatim, **both surfaces** (index line + body). (Numbers re-checked
  against the live register at extraction time — a same-day collision already forced one renumber.)
- **AC-E.2** The parked `adhoc-PRReviewTailV2` tech-spec + plan carry a `Superseded` status pointing
  here; ADR-35's roadmap tradeoff line gains a pointer to this feature for the delivery mechanics it
  absorbs. No register entries existed for the parked drafts (nothing to supersede in the register).
- **AC-E.3** MINOR bump + CHANGELOG + command regen + omni twin follow-through (ADR-9), bump in the
  same commit as the edits.

---

## ADRs to extract (on reaching `Ready`, per ADR-27/28)

> **Extracted 2026-07-09** into `docs/architecture/README.md` as **ADR-53** and **ADR-54** — both surfaces (index lines + full bodies), verbatim per ADR-28. Register re-checked immediately before extraction: highest was ADR-52, so 53/54 were free — no renumber (the same-day collision that forced the 52→53/54 renumber at plan-critic time did not recur). ADR-35's Tradeoffs line gained the delivery-mechanics pointer (AC-E.2 clause 2). SKILL.md's ADR-53/54 citations (`SKILL.md` :17/:81/:128) match the extracted numbers — no citation shift. AC-E.1/E.2 satisfied.

### ADR-53 — The Conformance Reviewer: a corpus-grounded advisory lens outside the pipeline; cite-or-drop; never correctness, never the deterministic tier, never a gate
- **Context.** The pipeline's review estate saturates correctness (reviewer, Codex, tests) but
  produces the conceptual lens — patterns, principles, conventions, semantic naming — only
  incidentally (10–20% of findings, internal evidence). That lens is what the human PR reviewer
  actually does; it was the only unautomated review in the flow. Independent evidence (c-CRAB) shows
  review agents systematically under-cover exactly these repo-specific categories, and the
  recommended remedy is documented conventions — the artifact estate this plugin already maintains.
- **Decision.** A **Conformance Reviewer** — shipped as the `conformance-review` skill, invoked at
  the PR tail (team-lead-owned, attended, opt-in via `prConformance`) and standalone — that reviews
  the **diff against the repo's own corpus** (`docs/conventions/`, `docs/architecture/` + graph
  facts, `docs/reference-model.md`, `docs/tech-debt/`, shipped skill patterns). **Cite-or-drop:**
  every finding must cite the corpus source it enforces; no corpus → the skill declines to run.
  **Charter exclusions are permanent:** correctness (the pipeline owns it), the deterministic tier
  (linters/Sonar territory per the T3 boundary — whoever owns it per-project), git-history metrics.
  **Advisory forever:** COMMENT events only, no gate, no merge authority; the human curates and
  merges. It lives outside the pipeline roles — it can never become a fourth gate.
- **Why.** Owner decision (build over buy — maintenance parity, 2026-07-09); the defensible value is
  the maintained grounding corpus, which commercial tools can ingest but not keep true; the
  cite-or-drop rule is what structurally separates "our conventions" from generic-taste noise; the
  charter exclusions prevent re-reviewing saturated or mechanically-owned ground.
- **Tradeoffs.** In corpus-poor consuming repos the reviewer is unavailable until conventions exist —
  accepted: that is the honest signal to write them (c-CRAB's own recommendation). The conceptual
  lens's density on product code is unmeasured (internal evidence is plugin-repo-shaped) —
  calibration (ADR-54) is the control. The inline-posting recipe (`gh api …/reviews`) lives in the
  skill under the ADR-36 `post-review` op — a third recipe locus beyond the rule and the team-lead
  subsection; the 4-op seam itself is unchanged (recorded so a future non-GitHub adapter author knows
  where to look).
- **Rejected.** *Adopt a commercial reviewer fed our docs* — unmeasured, non-deterministic adherence;
  truncation limits; noise profiles; consumes a fraction of the corpus. *A fourth correctness pass at
  the PR* — the saturated lens; explicitly the owner's anti-goal. *Generic quality review without
  citations* — the measured <10%-precision failure mode.

### ADR-54 — Precision-first runtime: rules-grounded generation + fail-closed skeptic filter + capped advisory output, gated by human-graded calibration before any live PR
- **Context.** Ground-truthed benchmarks put most AI PR reviewers under 10% precision; the only
  production-scale counterexample (BitsAI-CR, 75% precision) pairs rule-taxonomy-grounded generation
  with a fail-closed second-stage filter. Context ablations show more repo context degrades review
  models; volume correlates with lower relevance and slower PRs.
- **Decision.** The Conformance Reviewer runs **two stages**: Stage 1 generates candidates from the
  **diff + targeted corpus facts** (never whole-file context); Stage 2, a fresh-context skeptic,
  refutes each candidate (citation validity + diff reading) and kills what it cannot confirm.
  Survivors post **capped** (default 5) and confidence-labeled. **Calibration-before-live:** the
  skill replays repo history into a graded calibration report, and PR posting is locked until the
  owner records a pass verdict — the precision bar is the owner's, set at grading time. Helper-model
  work runs on the configured sonnet-class tier.
- **Why.** Each element carries independent measured evidence: two-stage (BitsAI-CR), diff+facts
  (SWE-PRBench ablation; LLM4FPM), cap (MSR volume↔relevance), calibration on own history (vendor
  benchmarks demonstrated unreliable). The shape is the in-house mine→verify pattern applied to a
  diff — no new machinery species.
- **Tradeoffs.** Two stages double per-review cost — accepted; precision is the deployment
  bottleneck, not cost. Calibration delays first live use by one grading session — accepted; an
  ungraded reviewer posting noise to a real PR is the failure mode this ADR exists to prevent.
- **Rejected.** *Single-pass review* (the <10%-precision baseline). *Whole-repo RAG/context*
  (measurably degrades). *A fixed precision threshold in the spec* (the bar is repo- and
  owner-relative; inventing a number here would be false precision).

---

## Decisions resolved at definition (architect, two-way doors)

| # | Call | Resolution | Why |
|---|---|---|---|
| d1 | Ship shape | One skill (`conformance-review`) + PR-tail hook, not a new pipeline agent | Outside-the-pipeline placement (never a gate); skills are the portable, preloadable locus (ADR-2/4); an agent persona can wrap it later |
| d2 | Config | New 4b key `prConformance` (bool, default false) | Orthogonal to `prReviewMode` (projection) — a mode value would conflate two independent switches |
| d3 | Finding cap default | 5, config-overridable | Volume↔relevance evidence; small enough to read, large enough to matter |
| d4 | v2 "runnable /code-review" amendment | Dropped, recorded in Supersedes | Fourth correctness pass = the anti-goal; suggest-only ultra stays as-is from v1 |
| d5 | Skill vs script for stage runtime | Skill prose orchestrating helper agents (Agent tool), no new runtime scripts in v1 | Cheapest correct locus; scripts earn their place after calibration proves the method |

## Open decisions — for ratification

None blocking. The two owner forks (build-not-buy; PR-triggered-before-human) were resolved
2026-07-09 in discussion. Naming (`conformance-review`) is the architect's proposal — rename at
ratification if wanted.

---

## Review gate

- Cross-check is the **ADR register + the three research entries** (technical branch; no product spec).
- **Spec-time review:** offered at the definition checkpoint (self cross-check vs critic Mode 1).
- **Plan-time review: code-grounded critic Mode-2 — MANDATORY.** This pass edits shared plugin source
  (a new skill, team-lead PR-tail prose, 4b config, `agents-workflow` references) and its central
  claims are live-source-dependent (the PR-tail v1 surfaces shipped three weeks ago and were already
  re-verified once for the parked v2 — re-verify again at plan time; prerequisite facts go stale).
- **mine-from-spec:** default-skip — plugin skill/agent prose; no consuming-project business rules.
- Plan steps carry `Satisfies: AC-{layer}.{n}`.
