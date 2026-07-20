# Implementation Plan — F16-ArchitectureMiner (`mine-architecture`, the eleventh mine)

**Spec:** `../definition/tech-spec.md` (Status: Ready; code-grounded critic folded)
**Slug:** F16-ArchitectureMiner · **Intent:** Scoped (single skill + family bookkeeping)
**Plan status:** Approved — code-grounded critic review folded (see `## Plan Review`)
**Baseline at plan time (2026-07-19):** HEAD `6fd50b1` (F15 closed, nexus **1.37.0**, family core
ten-member) on `main`. F16's sequencing precondition ("after F15's closure") is **already
satisfied** — verified at plan time, re-verify at Step 4.

## Context (what the developer needs to know)

`mine-architecture` is a prose skill — one new `SKILL.md` plus a member-count sweep across the
family; **no new harness code** (evidence gate + kickoff preflight are shipped in
`mine-verify-cover/tools/` and invoked in place, ADR-62). The binding content contract is the
tech-spec's §The pipeline, §The four dimensions (incl. the D1 overlap disposition), §The
BR-coverage join, §Verify gate, §Output artifact (incl. the two mandatory `index.md` lines), and
§Acceptance #1. The structural sibling to mirror is `mine-reference-model/SKILL.md` (closest
shape: N dimension extractors → one consolidate+skeptic; anti-flattery framing) — mirror its
*section skeleton*, never copy its content.

Binding identifiers (public surface): skill name `mine-architecture`; output dir
`docs/architecture-map/` (`index.md` + `{module}.md`); `rule-coverage` field grammar
`{registry file + row ids} | none | no-registry-estate`; header line `Current-state only`;
dimension names D1–D4 as specced. Internal wording/decomposition of the SKILL.md is the
developer's call within the required-sections list.

## Steps

### Step 1 — Author `plugins/nexus/skills/mine-architecture/SKILL.md`
**Skill:** None (verified: `improve-skills` scaffolds *project-local* skills and routes shipped-skill
fixes to plugin-feedback; `evaluate-skill` is the diagnose half; neither authors a new shipped
dev-repo skill) · **TDD:** no · **Gap?:** yes (route to lessons `## Skill Gaps`)
**Satisfies:** tech-spec Acceptance #1, #4

Required content (each item grep-checkable in the file):
- Frontmatter: `name: mine-architecture`, `user-invocable: true`, description carrying the
  use-when and the not-list (not debt/virtue/unit-prescription mining, no target design).
- Intro: **eleventh mine**, full method-contract member; the triangle *what is* (this) / *what
  hurts* (`mine-verify-repo`) / *what to copy* (`mine-reference-model`).
- Pipeline block (Extract → Consolidate → Verify → Emit → Refresh) per the tech-spec.
- The four dimensions D1–D4, **including D1's overlap disposition** (reuse `docs/tech-debt/`
  confirmed global-pass edge facts + coupling table when present; independent derivation only when
  absent; run report records the substrate used).
- The BR-coverage join with the full grammar (`none` / `no-registry-estate`).
- Execution topology: pointer to family-core §Execution topology; own sizing (four dimension
  extractors in parallel, then ONE consolidate+skeptic); the kickoff-checklist pointer line with
  the Tier-2 note ("registry-oracle check skipped by member class — this member consumes no
  registry oracle; the BR-coverage join input is optional and disclosed at kickoff").
- Verify gate: full consumer of family §Skeptic protocol (must-RUN, drop-without-excerpt,
  vacuous-evidence check) + the four dimension-specific re-executions + the anti-flattery
  clean-room framing; judgment observations ride as `lens-note`s only (family §Fact/judgment).
- Output artifact: `docs/architecture-map/` (index + per-module), registry-invariants pointer,
  evidence-gate invocation at row writes, the mandatory `Current-state only` header AND the
  decided-architecture pointer line (`docs/architecture/` location or `none`), the
  deliberate-separation statement (decided vs mined).
- Binding prompt obligations (grep-checkable clauses, sibling pattern) + safety rails (read-only
  on target source; the only write is `docs/architecture-map/`; marginal-budget pointer).
- `## What this skill does NOT do` — **target-design content is the first bullet** (owner
  decision), then census, pattern/debt/unit mining, security dimension, multi-repo.
- Relationship table per the tech-spec (incl. the mine-design/mine-algorithm no-seam row).

**Accept:**
`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/mine-architecture`
exits green (invocation form per the lint's own usage; adjust args if its CLI differs — the gate
is "lint passes", the command line is the developer's to confirm); greps hit:
`user-invocable: true`, `Current-state only`, `no-registry-estate`, `eleventh mine`,
`What this skill does NOT do`.

### Step 2 — Family member-count sweep (ten → eleven)
**Skill:** None (mechanical sweep; no skill covers it) · **TDD:** no · **Gap?:** no
**Satisfies:** tech-spec Acceptance #2

The file list is **derived from the exact acceptance grep**, executed at plan time
(`grep -rnE 'ten-member|all ten|ten members|10-row' plugins/nexus/skills/` — 15 hits, **8 files**;
the critic caught the hand-transcribed table dropping the 8th — the grep, not the table, is
authoritative at execution):

| File | Lines | Edit |
|---|---|---|
| `mine-verify-cover/references/mine-family-core.md` | 3, 24 (+ table 11–22) | prose → eleven-member incl. `mine-architecture` (full method-contract member — it does NOT join the name-and-shape parenthetical); add the 11th table row (unit = one repo's architecture; ground truth = code structure + optional graph/coupling; gate = adversarial skeptic re-execution; output = `docs/architecture-map/`); invariant → "all eleven" |
| `mine-verify-cover/SKILL.md` | 473 | `10-row` → `11-row` |
| `mine-verify-repo/SKILL.md` | 27, 276 | `all ten members` → eleven forms |
| `mine-reference-model/SKILL.md` | 28–29, 221 | `10-row`/`all ten` → eleven forms |
| `mine-design/SKILL.md` | 25, 27 | same |
| `mine-algorithm/SKILL.md` | 26, 28 | same |
| `mine-verify-flows/SKILL.md` | 16 | same (two matches in one line) |
| `mine-skill-candidates/SKILL.md` | 25–26 | same |

Also in `mine-family-core.md` §Execution topology per-skill staging list: add one bullet —
`mine-architecture — four dimension extractors in parallel (default), then ONE
consolidate+skeptic (the reference-model shape)`.

**DO-NOT-TOUCH (homonym carve-outs):** `mine-skill-gaps/SKILL.md:20` ("ninth mine") and
`mine-skill-candidates/SKILL.md:21` ("tenth mine") are positional ordinals, not member counts;
`plugins/nexus/CHANGELOG.md` is history and sits outside the sweep path anyway.

**Accept (pair, executed at plan time — 15/0 hits respectively today):**
`grep -rnE 'ten-member|all ten|ten members|10-row' plugins/nexus/skills/` → **0 hits**;
positive control `grep -rn 'eleventh mine' plugins/nexus/skills/` → hits **only** in
`mine-architecture/SKILL.md` (its self-declaration; 0 hits before Step 1, ≥1 after).

### Step 3 — Extract the ADR into `docs/architecture/README.md`
**Skill:** None (the dev-repo README keeps its own ADR format — the file's own "dev-repo
exception" note; `create-architecture-doc` targets consumer-repo `index.md`) · **TDD:** no ·
**Gap?:** no · **Satisfies:** tech-spec Acceptance #5

Verify the next free number at execution: `grep -nE 'ADR-6[6-9]' docs/architecture/README.md`.
At plan time the register tops at **ADR-65**; **ADR-66 is claimed by F15**
(`docs/specs/F15-SkillCandidateMiner/delivery/summary.md` records the claim) but not yet written —
**leave 66 to F15 and take ADR-67** (if 67 is somehow taken by execution time, next free wins).
House format (Context → Decision → Why → Tradeoffs → Rejected) + a Contents line. Decision text
per tech-spec Acceptance #5: eleventh mine, unit = one repo's architecture, output =
`docs/architecture-map/` (sixth registry species), extraction-only by owner decision; rejected:
mined target-design proposals (anchoring), hard graphify precondition.

**Accept:** Contents lists the new ADR; body section exists; `grep -c 'ADR-67'` ≥ 2 (contents +
body) — or the equivalent for the actually-free number, disclosed in implementation.md.

### Step 4 — Release close (bump + twin) — **Owner: closing session (team-lead/owner), NOT the developer**
**Skill:** Follow release-plugin · **TDD:** no · **Gap?:** no · **Satisfies:** tech-spec Acceptance #6

The developer runs **no git writes** (pipeline rule); this step executes in the main session at
close. Immediately before committing: re-verify `git branch --show-current` = `main` and
`git log -1` (concurrent sessions have silently moved HEAD in this tree before). Run the
release-plugin dry-run and **check the reasons list names only F16's files** (Step 1–3 paths);
a reason naming a foreign file = a concurrent feature's contamination → stop and resolve
ownership before bumping. Escalate to **MINOR** (`--minor`, new capability; expected
1.37.0 → 1.38.0). Skills generate no commands (`gen-commands` not needed). Regenerate the omni
twin (`scripts/gen-omni.mjs`, twin path `D:\omnishelf\claude-omni` as arg 1) and commit it there
per the twin convention (`feat(F16-ArchitectureMiner): sync mine-architecture (omni 1.38.0)`,
delta body, provenance footer). One nexus closure commit: content + bump + CHANGELOG.

**Accept:** `plugins/nexus/.claude-plugin/plugin.json` version = 1.38.0 (or the dry-run-proposed
MINOR); CHANGELOG entry names mine-architecture + the family sweep; single commit contains
Steps 1–3 files + bump; twin commit exists in `D:\omnishelf\claude-omni`.

### Step 5 — Pilot run on the golden fixture — **Owner: operator (by construction)**
**Skill:** None (the run IS the skill being validated) · **TDD:** no · **Gap?:** no
**Satisfies:** tech-spec Acceptance #3

A developer subagent cannot execute this step — the run needs the orchestrator's spawning
primitives and the consuming repo (`D:\omnishelf\omnivision-ai-sdk`). Operator paste-prompt:

> Be architect. Run the shipped `mine-architecture` skill (nexus 1.38.0) on this repo per its
> SKILL.md — kickoff checklist first, four dimension extractors, consolidate+skeptic, emit
> `docs/architecture-map/`. Reconcile the `rule-coverage` join against the live
> `docs/business-rules/` tree (authoritative — 18 files / 6 areas at F16 plan time). Record the
> skeptic's re-execution excerpts and the run report (mined/confirmed/killed). This is F2 P2's
> architecture mine.

**Accept — and what Steps 1–4 passing does NOT prove:** shipping the skill text proves prose +
lint + bookkeeping only; the *method* is validated only by this live run (map emitted, every D2
row's traceability skeptic-re-resolved, zero-coverage modules flagged, `Current-state only` +
pointer line present, zero target-design content by skeptic/human judgment). The backlog row
flips **Done only after the pilot verdict**; until then it reads In Progress with Step 5
operator-owed.

## Skill Mapping

| Step | Skill | Disposition | TDD | Gap? |
|---|---|---|---|---|
| 1 | — | None (verified against improve-skills / evaluate-skill frontmatter) | no | yes |
| 2 | — | None (mechanical grep-derived sweep) | no | no |
| 3 | — | None (dev-repo ADR format is file-local) | no | no |
| 4 | release-plugin | Follow | no | no |
| 5 | — | None (operator-owed live run) | no | no |

Step 1's `None` is a *verified* skill gap (authoring a new shipped mine-family skill — third
occurrence: F10, F15, F16) — log it to `lessons.md` `## Skill Gaps` per ADR-59 at done-check.

## Decisions

| Decision | Why | Rejected alternative | Status |
|---|---|---|---|
| Add a mine-architecture staging bullet to family-core §Execution topology | The list is "the delta each sibling keeps"; reference-model's bullet is the precedent | Omit (list is selective) — but a full-contract member with a distinct sizing earns its line | decided |
| Leave ADR-66 to F15; F16 takes ADR-67 | F15's summary records the claim; stealing 66 breaks that thread's close | Take 66 as "next free at execution" — violates the recorded claim | decided |
| skill-lint as Step 1's gate with the invocation form developer-confirmed | The lint is the shipped ADR-23 gate; its exact CLI shape is verified at execution, the *gate* is binding | Pinning an unverified command line as acceptance | decided |

## Risks

- **Concurrent sessions in this tree** — mitigated: Step 4's branch/HEAD re-check + dry-run
  contamination check; the F15 collision risk is already retired (closed at `6fd50b1`).
- **ADR number race** (another close lands first) — mitigated: "next free wins" with disclosure.
- **Pilot slippage** — Step 5 is operator-owed; the F2 campaign wants it soon (P2 blocks on the
  architecture mine), so the backlog row's In-Progress state keeps it visible.

## Plan Review

Code-grounded critic review folded (2026-07-19): findings and dispositions in
`review-critic.md` §Plan review addendum.
