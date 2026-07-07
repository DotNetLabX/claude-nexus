# Skill Estate Consolidation — one estate, in the plugin, pattern-first

**Feature Spec:** None — ad-hoc technical pass. Binding definition: the **owner directive below** (captured
verbatim-in-substance from the owner, 2026-07-07) + the Phase B verdict record
(`D:\src\dotnet-microservices\docs\skill-evals\2026-07-05-phase-b-verdicts.md`). Governed by ADR-23
(born-compliant skills), ADR-9 (release flow), ADR-1 (plugin repo is source of truth), ADR-28 (ADR
ratification). Master gate (ADR-25): two-way-door (git-reversible skill/doc moves) — no tech-spec; this
plan carries the definition.

## Definition — owner directive (2026-07-07)

This section IS the binding contract of the pass. The owner corrected the architect's course:

- **D1 — The consuming repo is closed.** `dotnet-microservices` is a template/reference of how to build
  .NET projects, mined for the owner's *other and future* projects. It is the quarry, not a consumer with
  ongoing feature work.
- **D2 — Skills were always plugin-bound.** The original instruction was "build skills, then port them to
  the nexus plugin, because the shipped C# skills are old and need improvement." Project-local skills are
  a mining instrument, never an end state. `architecture-reference.md` §14 (lines 1030–1044: the
  "phased, variant-aware, repo-exact" opinionated-local-estate design) was drift from this directive
  (scaffolding documented as architecture) and is superseded by this pass.
- **D3 — Register: pattern-first, exemplar-cited.** A shipped nexus-dotnet skill teaches the **pattern**
  for a new .NET project (closed role enum range-partitioned by domain, two-layer auth gate, data-driven
  state machine, idempotency variants, …), citing dotnet-microservices as the worked exemplar ("the
  reference app") — never hardcoded to the Articles domain as the only reality it serves.
- **End state:** `dotnet-microservices/.claude/skills/` is empty; nexus-dotnet carries the full estate;
  the records in both repos say so.

## Context

nexus-dotnet 1.4.0 (adhoc-DotnetFeedbackApply) already absorbed the mined corrections: 11 skills patched,
2 replaced from the Phase B winners. Three things remain to reach the owner's end state:

1. **Four mined skills have no shipped counterpart skill** and were never ported:
   `article-state-machine` (SKILL.md), `file-storage-patterns` (SKILL.md + `templates.md`),
   `consumer-patterns` (SKILL.md + 3 reference templates), `service-infra-conventions` (SKILL.md) — all
   under `D:\src\dotnet-microservices\.claude\skills\`. **Recorded divergence from the verdict record:**
   Phase B pairing #9 evaluated `service-infra-conventions` against `service-registration`
   (+`central-package-management`) as a MERGE — its routed B1/B2 defects were applied in 1.4.0, but the
   conventions content itself (request-context bridge, correlation chain, options fail-fast, repo
   conventions) has no shipped home, so this pass ports it as a **new skill** (Step 4, with fences)
   rather than folding it into `service-registration`. The divergence is deliberate and Step 6 still
   diffs the pair for residue.
2. **One shipped skill violates D3's register** (architect-verified grep, 2026-07-07): only
   `authorization-patterns`' description is article-register ("Endpoint authorization for the article
   lifecycle …"); `create-domain-event-handler`'s description is already pattern-first — its body may
   still carry article-register residue to sweep.
3. **The 13 locals still exist and are already drifting**: the 1.4.0 fix-cycle's VO-ctor census
   correction lives only upstream (`create-aggregate/workflows/ValueObject.md:13-19`); local
   `create-aggregate:173` still states the disproved absolute. Locals fall further behind every plugin
   release.

Clean-room note: the standing "clean-room for any new skill" rule applied to the **original** local
builds (it produced the unbiased defect evidence). It does **not** apply to these ports — the local
skills ARE the sanctioned base per D2; porting from them is the point.

## Scope

**In (plugin repo):** 4 new shipped skills ported from the local bases (D3 register); re-registration of
`authorization-patterns` (+ residue sweep of `create-domain-event-handler`); fold-upstream diff of the 9
overlapping locals; a PROPOSED ADR row for the D3 register rule; plugin.json skill-count claim; release.
**In (consuming repo):** delete all 13 `.claude/skills/` folders; rewrite `architecture-reference.md` §14
as superseded; update `docs/skill-backlog.md` rows; verify CLAUDE.md's skills section is accurate
post-retirement. Separate commit, `[Skills]` tag (consuming-repo convention — never conventional-commit
prefixes there).
**Out:** any change to nexus core; the Deferred coverage gaps (unblock conditions still not fired);
`create-module`'s staleness row (separate Deferred backlog row, unchanged); renaming the 2 already-replaced
skills (names are stable public surface).

## Binding vs developer's-call

- **Precondition (binding, critic F7):** the plugin repo currently sits on the `adhoc-MineVerifyPhpAdapter`
  branch with a concurrent pipeline's dirty communication-logs. This pass starts from a clean checkout of
  `main` (coordinate with the concurrent session; never commit on its branch); verify `git branch
  --show-current` = `main` before Step 1.
- **Binding:** D1–D3 above; the 4 ported skills pass skill-lint exit 0 AND an inline rubric judgment pass
  (Layers 1–4, no Critical/High) — ADR-23's meta-loop for new shipped skills; folder `name:` = skill name;
  every exemplar citation names the reference app explicitly (D3); **register gate semantics (critic F5):**
  repo-domain vocabulary (Article*, `UserRoleType`, ArticleHub, service names) may appear ONLY inside an
  explicit exemplar clause naming the reference app — the case-insensitive `article` description grep is a
  smoke test, not the rule; the fold-upstream diff (Step 6) produces a **per-pair disposition table** in
  implementation.md (`folded (where)` / `already-upstream` / `dropped (why)`) — the de-dup boundary is a
  plan artifact, not working memory; local retirement runs only **after** the release ships and the
  consuming repo has the released version installed (Step 9 after Step 8 — critic F2); one plugin bump,
  after all plugin edits (dev-repo CLAUDE.md); consuming-repo commit separate from plugin-repo commits and
  containing only the paths Step 9 names.
- **Developer's call:** exact wording and section order of ported skills; how much of each local template
  ports verbatim vs compresses; whether `create-domain-event-handler`'s body needs any D3 edits at all
  (grep first — its description is already compliant); consolidated vs per-skill backlog entries.
- **Owner-confirmed at plan approval:** the ported name for `article-state-machine` — proposal:
  **`add-state-machine`** (pattern-first: data-driven state-transition validation for an aggregate;
  "article" would violate D3 in the estate's own naming). The other three names are already
  domain-neutral and port unchanged.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | port article-state-machine → `add-state-machine` | — |
| 2 | improve-skills | Follow | no | port file-storage-patterns (+ templates.md) | — |
| 3 | improve-skills | Follow | no | port consumer-patterns (+ 3 references) | — |
| 4 | improve-skills | Follow | no | port service-infra-conventions | — |
| 5 | improve-skills | Follow | no | re-register authorization-patterns; sweep create-domain-event-handler | — |
| 6 | improve-skills | Follow | no | fold-upstream diff of the 9 overlapping locals; disposition table | — |
| 7 | (none) | — | no | PROPOSED ADR row (ADR-50, D3 register rule) in docs/architecture/README.md | expected — ADR authoring has no skill |
| 8 | release-plugin | Follow | no | estate lint; count claim 33→37; backlog; single bump; gen-omni | — |
| 9 | (none) | — | no | consuming-repo retirement + record corrections, AFTER the release is installed | expected — cross-repo doc/deletion step |

For Steps 1–6, `improve-skills` is the authoring/fix standard (ADR-23 owner of "write or modify a skill
correctly"); Steps 1–4 use its scaffold path (born-compliant frontmatter, lint gate), 5–6 its
consolidating-fix path.

## Domain Model Changes

N/A — skill markdown, ADR text, doc corrections, deletions, a version bump.

## Data Model Changes

N/A.

## Implementation Steps

**1. Port `article-state-machine` → `plugins/nexus-dotnet/skills/add-state-machine/` (name
owner-confirmed at approval).** Follow improve-skills (scaffold path).
Base: `D:\src\dotnet-microservices\.claude\skills\article-state-machine\SKILL.md`.
- D3 register: the pattern is *data-driven state-transition validation* — legal transitions are cached
  data (seed table), never a hardcoded switch; validate-before-mutate guard in the aggregate; factory +
  cache DI variants. The Articles `ArticleStageTransition`/`ArticleStateMachineFactory` material becomes
  the cited reference-app exemplar, with placeholder shapes (`{Entity}StateTransition`) carrying the
  template.
- Scope fence: design-level state-machine discussion stays in `domain-patterns` (its state-machine
  section gains a one-line pointer to this skill for the build recipe — touch it in this step).
- Accept: lint exit 0; inline rubric judgment no Critical/High; description states pattern + when-to-use
  (case-insensitive `article` grep as smoke test; the binding gate is the register rule — repo vocabulary
  only inside an exemplar clause naming the reference app); `domain-patterns` (`SKILL.md:211` "State
  Machine Pattern" section) fence pointer present.
Satisfies: D2, D3.

**2. Port `file-storage-patterns` → `plugins/nexus-dotnet/skills/file-storage-patterns/`.** Follow
improve-skills (scaffold path).
Base: local SKILL.md + `templates.md` (port as `references/templates.md` — the estate's heavy-skill shape).
- D3 register: pluggable file-storage module composition — provider choice, options-marker second stores,
  singleton-default + scoped-per-extra registration, compensating `TryDeleteAsync` (file write outside
  the DB transaction), cross-stage byte migration in consumers. Reference-app exemplars cited as such.
- Accept: lint exit 0; rubric judgment no Critical/High; cited `references/templates.md` exists (E6).
Satisfies: D2, D3.

**3. Port `consumer-patterns` → `plugins/nexus-dotnet/skills/consumer-patterns/`.** Follow improve-skills
(scaffold path).
Base: local SKILL.md + `projection-consumer.md`, `reference-data-consumer.md`, `write-side-consumer.md`
(port under `references/`).
- D3 register: consumer shape, the **three idempotency variants** decision table (skip-if-exists /
  throw-if-exists / exists-check-return), reference-data hydration, projection-vs-write-side split.
- Scope fence both ways with the shipped `add-integration-event`: it owns contract+publisher+wiring and
  gains a one-line pointer to this skill for consumer depth (touch it in this step); this skill points
  back for the propagation mechanics.
- **Disposition `add-integration-event/workflows/Consumer.md` (critic F6):** two authoritative consumer
  templates must not coexist — slim `Consumer.md` to the wiring minimum (auto-discovery, class shape) +
  pointer, and delimit both descriptions so routing is unambiguous (`add-integration-event` = propagate
  an event; `consumer-patterns` = author/edit an `IConsumer`).
- Accept: lint exit 0; rubric judgment no Critical/High; both fence pointers present; `Consumer.md` no
  longer carries a full consumer template (grep for its idempotency/hydration sections → moved or
  pointered).
Satisfies: D2, D3.

**4. Port `service-infra-conventions` → `plugins/nexus-dotnet/skills/service-infra-conventions/`.**
Follow improve-skills (scaffold path).
Base: local SKILL.md.
- D3 register: ambient request-context bridge (segregated claims/route providers), correlation-id chain,
  fail-fast options binding, pipeline-order note, JSON casing, GlobalUsings/naming conventions.
- Scope fences: DI **placement** stays `service-registration`'s; CPM **mechanics** stay
  `central-package-management`'s (this skill keeps only the convention-level pointers — no restated
  recipes, AP3).
- Accept: lint exit 0; rubric judgment no Critical/High; grep this skill for `Directory.Packages.props`
  recipe content → pointers only.
Satisfies: D2, D3.

**5. Re-register `authorization-patterns` to D3; sweep `create-domain-event-handler`.** Follow
improve-skills (consolidating fix).
- `authorization-patterns/SKILL.md`: description and framing become pattern-first — *closed role enum
  surfaced as string constants, two-layer role+resource endpoint gate, authentication-only read-model
  exception, server-side identity stamping, JWT validation* — with the article-lifecycle vocabulary
  (`UserRoleType`, ArticleHub, per-service bypasses) recast as the cited reference-app exemplar. Content
  facts from 1.4.0 are correct and stay; only the register changes.
- `create-domain-event-handler`: description already D3-compliant (verified) — grep the body for
  article-register residue (claims framed as "the article lifecycle's" rather than "the reference
  app's"); fix only what the grep finds, else record no-op.
- Accept: `authorization-patterns` description leads with the pattern (the case-insensitive `article`
  grep is the smoke test; the binding gate is the register rule — the exemplar may be named, but only as
  an explicit exemplar clause, and repo identifiers appear nowhere outside such clauses); lint exit 0 on
  both.
Satisfies: D3.

**6. Fold-upstream diff of the 9 overlapping locals.** Follow improve-skills (consolidating fix on any
shipped skill that gains content).
Pairs (local → shipped): `add-integration-event`→same, `error-handling`→same, `create-aggregate`→same
(+`domain-patterns` where the claim is design-level), `create-feature-slice`→`create-feature`
(+`cqrs-patterns` where the claim is snippet-level — verdict #4's secondary target), `create-service`→same,
`grpc-communication`→`create-grpc-contract`, `persistence-patterns`→same,
`domain-event-wiring`→`create-domain-event-handler`, `authorization-security`→`authorization-patterns`,
and — pairing #9's residue check — `service-infra-conventions`→`service-registration`
(+`central-package-management`), expected mostly `already-upstream` (B1/B2 in 1.4.0) or `folded (Step 4
port)`.
- For each pair: enumerate local-only claims/templates/verify-greps; disposition each as
  `folded (target file)` / `already-upstream` / `dropped (why — e.g. repo-lifecycle detail with no
  pattern value)`. The last two pairs are expected to be near-total `already-upstream` (they were the
  replacement bases) — verify, don't assume.
- **The disposition table is a required implementation.md artifact** (binding). Fold with D3 register;
  every touched shipped skill re-lints.
- Accept: table covers all 10 pairs; every `folded` row names its target file:section; lint exit 0 across
  touched skills.
Satisfies: D2 (nothing of the mining is lost), D3.

**7. Encode the D3 register rule as PROPOSED ADR-50.** Skill: none — ADR authoring (ADR-28 lifecycle: the
owner ratifies; PROPOSED until then).
File: `docs/architecture/README.md` (the ADR register) — next free number is **ADR-50** (index ends at
ADR-49; ADR-24's PROPOSED row at `README.md:42` is the format precedent).
- One-decision record: *nexus-dotnet skills are pattern-first and exemplar-cited — they teach the pattern
  for a new .NET project in the consuming family, citing the reference app (dotnet-microservices) as the
  worked example; repo-exact framing is a defect except where the pattern IS the app.* Point back at this
  plan's Definition section as provenance. Add the index row (marked *(PROPOSED — owner ratifies)*,
  matching ADR-24's precedent).
- Accept: ADR body + index row present; grep for `PROPOSED` on the new row → 1 hit.
Satisfies: D3 (durability beyond this pass).

**8. Estate sweep, count claim, backlog, release.** Follow release-plugin. Once, after Steps 1–7 land.
- Full-estate lint (every plugin's skill folders — nexus, nexus-dotnet, nexus-cpp, nexus-flutter) exit 0;
  `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green.
- `plugins/nexus-dotnet/.claude-plugin/plugin.json`: description's skill count 33 → 37.
- Plugin-repo `docs/skill-backlog.md`: `Skills Created` entries for the 4 ports, `Skills Fixed` for
  Steps 5–6, source `adhoc-SkillEstateConsolidation`.
- Release: `bump-plugin.mjs --dry-run` → owner decides tier — architect recommendation **MINOR** (4 new
  skills = new capability; precedent: 1.4.0). Bump in the same commit as the plugin changes; then
  `gen-omni.mjs` + `--check` exit 0, twin commit with mirrored subject.
- Accept: `bump-plugin.mjs --check` exit 0; CHANGELOG names 4 ports + re-registration + fold-upstream;
  count claim reads 37; `gen-omni.mjs --check` exit 0.
Satisfies: ADR-9; D2.

**9. Consuming-repo retirement + record corrections — runs only AFTER Step 8's release ships and the
consuming repo has it installed** (critic F2: retirement before release would stamp a nonexistent version
and leave the repo skill-less in the gap). Skill: none — cross-repo deletions + doc edits. All paths
under `D:\src\dotnet-microservices`:
- Precondition: `/plugin update` run in the consuming repo; installed nexus-dotnet version ≥ the version
  Step 8 released (read it from the release commit — do not hardcode).
- Delete all 13 skill folders under `.claude\skills\` (list = the 4 ported + the 9 diffed; nothing else
  lives there — verify with a directory listing first; anything unexpected stops the step).
- `docs\architecture-reference.md` §14 (lines 1030–1044): rewrite as a short supersession record — the
  local estate was the mining instrument (D2); the estate lives in nexus-dotnet at the Step-8 version;
  keep the historical eval facts, delete the live design claims ("What exists: 13 project-local skills",
  the "phased, variant-aware, repo-exact" design paragraph, the `.claude/skills` inventory pointer at
  `:1032`).
- `docs\skill-backlog.md`: flip the **11 existing** `Skills Created` rows to `Ported-to-plugin (retired
  locally)` + the Step-8 version, and **add the 2 rows the file is missing** (`create-service`,
  `persistence-patterns` — critic F3) with the same status so all 13 are recorded; flip the `Routed to
  Plugin` rows to `Applied upstream` (nexus 1.24.0 / nexus-dotnet 1.4.0) — this also closes the learner's
  outstanding stamp obligation from the feedback arc.
- CLAUDE.md: verify the "Agents and skills" section is accurate post-retirement (it already claims skills
  come from the plugins); fix only if stale.
- Commit in the consuming repo, `[Skills]` tag, containing only the paths named above.
- Accept: `.claude\skills\` empty; grep `architecture-reference.md` for `What exists: 13 project-local
  skills` and the repo-exact design paragraph → 0 hits, and for a supersession line naming the Step-8
  version → 1 hit; backlog: 13 `Ported-to-plugin` rows + `Applied upstream` on the routed rows.
Satisfies: D1, D2, End state.

## Cross-Service Changes

None. Cross-**repo** is explicit here (Step 8) — the consuming repo's retirement is IN scope this time,
by owner directive, as its own commit.

## Migration Notes

N/A.

## Testing Strategy

Prose/doc pass — gates: per-step lint + rubric judgment on the 4 new skills (ADR-23); grep-shaped
acceptance per step; full-estate lint + test suite at Step 9; the Step-6 disposition table makes the
fold-upstream auditable; code-grounded Step-2 review reads ported skills against both the local bases and
the reference-app source.

## KB Impact

None in the plugin repo (no `docs/kb/`). Consuming-repo record corrections are Step 8 (numbered, not
trailing).

## Open Questions

None. The ported name **`add-state-machine`** is owner-confirmed (2026-07-07 — "the obvious answer since
we generalize the skills"); it is now binding for Step 1. Review mode = **code-grounded critic** (standing
mandate for shared-artifact passes; ran — see Plan Review below). Semver tier = owner decides at Step 8
(architect recommends MINOR).

## Plan Review (critic, code-grounded, 2026-07-07)

Mode 2 ad-hoc review against the Definition (D1–D3), the Phase B verdict record, live source in both
repos, and the ADR register. Same disclosure as the sibling pass: no `critic` agent type in this session —
ran as a read-only `general-purpose` agent with the critic's charter. Verdict: **REVISE** — definition
coverage complete (D1/D2/D3/End-state all mapped), no CRITICAL; 2 HIGH + 5 MEDIUM + 3 LOW, all folded:

- **F1 HIGH (folded, Step 9 + D2).** The §14 acceptance grep was vacuous — "canonical" never appears in
  the live file, and D2 quoted a phrase §14 doesn't contain. Fixed: D2 now cites §14's actual words
  (lines 1030–1044); the gate targets the live claims ("What exists: 13 project-local skills", the
  repo-exact design paragraph, the `:1032` inventory pointer) plus a required supersession line.
- **F2 HIGH (folded, Steps 8/9 swapped).** Retirement ran before the release existed — stamping an
  unreleased version and leaving the consuming repo skill-less in the gap. Fixed: release is Step 8;
  retirement is Step 9 with an installed-version precondition.
- **F3 MEDIUM (folded, Step 9).** The backlog has 11 `Skills Created` rows, not 13 (`create-service`,
  `persistence-patterns` missing) — the flip now adds the two missing rows so all 13 are recorded.
- **F4 MEDIUM (folded, Context + Step 6).** The plan silently diverged from Phase B pairing #9
  (`service-infra-conventions` was a MERGE pairing, not counterpart-less). Fixed: divergence recorded as
  deliberate (port-as-new-skill), pair added to Step 6's table (now 10 pairs).
- **F5 MEDIUM (folded, Binding + Steps 1, 5).** The "no `article` token" gates were both stricter and
  weaker than D3. Fixed: token grep demoted to smoke test; binding gate = repo vocabulary only inside an
  explicit exemplar clause naming the reference app.
- **F6 MEDIUM (folded, Step 3).** Two authoritative consumer templates would coexist
  (`add-integration-event/workflows/Consumer.md` vs the ported skill). Fixed: Consumer.md slimmed to
  wiring + pointer, both descriptions delimited.
- **F7 MEDIUM (folded, Precondition).** The plugin repo sits on a concurrent pipeline's branch with dirty
  files — clean-`main` start precondition added.
- **F8/F9/F10 LOW (folded).** "all plugins" (four, not three) in Step 8's sweep; the vacuous
  cross-repo-commit acceptance replaced with a named-paths containment check; Step 6 pair 4 regained
  verdict #4's secondary target (`+cqrs-patterns`).

Checked clean: 13 local folders = exact 4+9 partition; all 33 shipped descriptions scanned (only
`authorization-patterns` article-register); 33→37 arithmetic; `domain-patterns/SKILL.md:211` fence target;
`add-integration-event/SKILL.md:10` fence block; ADR-50 free + ADR-24 PROPOSED precedent; the drift
example verified live both sides; dangling-consumer sweep (post-retirement, only §14 and backlog rows
reference `.claude/skills` — both rewritten by Step 9); single-bump timing; all named scripts exist.
