# F29-OracleStrengthMiner — Tech-Spec

**Status:** Ready
**Slug:** F29-OracleStrengthMiner
**Plan:** docs/specs/F29-OracleStrengthMiner/delivery/plan.md
**Source (graduation, ADR-28):** ratified proposal `omnishelf_flutter_app
docs/proposals/regeneration-and-conventions-skill-pack.md` §S2 (ratified 2026-07-20) — promoted,
not re-authored; this spec adds only the nexus-side build decisions and the post-ratification
adoptions. **Research input:** `docs/kb/research/spec-representation-and-equivalence-oracles.md`
(2026-07-22). **Definition checkpoint:** run 2026-07-22 (standalone architect checkpoint) — review
mode = code-grounded critic; mine-from-spec = default-skip (skill/process feature, no runtime test
surface).

## What

`mine-oracle-strength` — the **twelfth mine**. Unit = **one gated suite + its subject**. It audits
how strong an existing (nominally mutation-gated) test suite actually is, via fresh blind mutants
authored by an agent that has never seen the suite, adjudicates every survivor, kills the REAL gaps,
and reports honest suite strength. Field-validated 5× manually (RC/FSD/RG/p0c/p0d — 20 REAL blind
spots exposed in "gated" suites); this feature mechanizes that protocol as a shipped skill.

Consumed by F28-RegenerateUnit's PROVE stage; runs standalone between campaigns (audit any gated
suite). Program doctrine motivating it: *per-shape mutant sets age — a "gated" suite still needs a
fresh blind-battery audit* (`docs/programs/br-anchored-regeneration.md` §2).

## Method (promoted from S2, stack-neutralized)

1. **Blind mutant author (clean-room, generator stage):** reads the subject source ONLY — never the
   suite (authoring only-killable mutants inflates the score). Contract: 55–80 semantic mutants
   proportionally distributed across all functions; each `find` string verified unique
   (count == 1); parse-safety checked per mutant on a scratch copy (per-stack command, see fill
   table); null/type-promotion-breaking and provably-equivalent mutations excluded, exclusions
   listed.
2. **Battery run (mechanical stage):** the exact-string apply / hash-verified restore /
   output-scored runner (promoted from campaign #2's `mutation_battery.py` into skill assets),
   hardened to the instrument-integrity rules (D4 below).
3. **Reference-pair discrimination (OPTIONAL stage — the research adoption, D2):** fires only when
   the run declares a retained reference pair (reference = ground-truth variant, candidate = under
   test; the regeneration context's legacy-vs-regenerated). The runner executes the suite against
   both variants — the same apply/restore/score operation with a whole-unit swap instead of a mutant
   string. Scoring: green-on-reference + red-on-divergent-candidate = discrimination proof;
   green-green = equivalence attestation *at the suite's measured strength* (never "proven
   equivalent"); red-on-reference = HALT, the suite or the declared pair is wrong. No pair declared
   → stage skipped, stated in the report (never silent).
4. **Survivor adjudication (judge stage):** per survivor, REAL (a constructible fixture can
   discriminate) vs UNKILLABLE (equivalent / unreachable-by-construction / unobservable without
   production changes) — each verdict code-cited. **Cluster detection is mandatory output** (9 of
   FSD's 14 shared one fixture theme — clusters mean few tests kill many mutants).
5. **Gap-kill (generator stage):** for each REAL survivor, a minimal suite extension,
   **sanity-red-proven** (green on pristine → red under the applied mutant → byte-exact sha-verified
   restore → full suite green).
6. **Report:** suite-strength report — raw kill %, reachable-kill % after adjudication (exact floor
   comparison, no rounding), adjudication-bucket counts, gap themes/clusters, tests added, pair-stage
   verdict or skip line — plus registry annotations where a survivor disproves a suite note (the
   BR-119 precedent). Report artifact schema is the F28-PROVE consumption seam: stable section
   names, grep-checkable.

## Decisions (owner-resolved at the 2026-07-22 checkpoint; details in delivery/questions.md)

- **D1 — Name-and-shape family member** (user-picked; resolves proposal Unresolved #2): the runner
  ships inline in the skill with a **per-stack fill table** (parse-check command, test command,
  crash return-code set, process-tree timeout mechanism). Dart fill = proven (campaign #2); other
  stacks declared TBD-at-first-use. Promote to a full adapter contract only when a second stack's
  fill diverges (the family's "abstract only once a second stack is live" seam rule).
- **D2 — Pair metric as optional stage** (boost-directive, high): stage 3 above. F29 stays the
  single home of suite-strength measurement; F28 invokes, never re-implements.
- **D3 — Stage models per the program stage-model-plan** (owner-ratified 2026-07-22, backlog F28
  row; **supersedes the S2/S1 proposal's all-sonnet model-tier line**): generators (mutant author,
  gap-kill) = opus; judge (survivor adjudication) = fable; mechanical (battery run, report) =
  sonnet. Explicit `model:` overrides on every dispatch, never session-inherit.
- **D4 — Instrument-integrity rules are binding on the runner** (program doctrine,
  `mine-verify-cover` §Instrument integrity): a kill counts only when attributed to a failing test
  assertion; COMPILE_FAIL / LOAD_CRASH / TIMEOUT are adjudication buckets, never auto-kills;
  unadjudicated buckets score as survivors; the exit-code-shaped runner must pass the
  failure-output-classification honesty proof before any score is reported; per-process-isolated
  scratch state; score arithmetic + evidence artifacts committed; exact floor comparison, no
  rounding.
- **D5 — Built before F25** (boost-directive, high): the member-addition checklist is inlined as
  explicit plan steps (below); friction logged to lessons.md as F25 input.

## Family-membership obligations (the 12th-mine sweep — explicit, plan-step material)

- `mine-family-core.md`: header "eleven-member" → twelve; family invariant line "all eleven" →
  twelve; **§The mine family table +1 row** (unit = one gated suite + its subject; ground truth =
  the subject source; gate = sanity-red-proven gap-kill + instrument-integrity honesty proof).
- Sibling SKILL.md count sweep ("full 11-row family table", "all eleven members") across the ~8
  referencing skills — **positional ordinals untouched** (mine-design stays "sixth",
  mine-architecture stays "eleventh"; the F16 CHANGELOG precedent).
- `mine-verify-cover/SKILL.md` §Relationship: family-head pointer list gains the new member.
- `docs/programs/br-anchored-regeneration.md` §4: "Eleven mines" → twelve; §7 status update
  (candidate → shipped).
- New ADR in `docs/architecture/README.md`: "mine-oracle-strength is the twelfth mine" (next free
  number — ADR-68 by current register; verify at edit time), mirroring ADR-67's shape.
- New skill folder `plugins/nexus/skills/mine-oracle-strength/` (SKILL.md + assets: the promoted
  runner) — authored under the F18 standards; skill-lint clean; release via `release-plugin`
  (MINOR — new capability).

## Acceptance (grep-checkable)

- `plugins/nexus/skills/mine-oracle-strength/SKILL.md` exists, frontmatter `user-invocable: true`,
  describes stages 1–6 with stage-model pins matching D3.
- Runner asset present in the skill folder; its scoring section implements/states the D4 bucket
  grammar (`COMPILE_FAIL|LOAD_CRASH|TIMEOUT` present in the file).
- Pair stage present with the explicit skip line ("no pair declared → skipped, stated").
- `grep -r "eleven members\|11-row" plugins/` returns zero hits post-sweep (count refs only;
  positional ordinals excluded by construction).
- Family table row count = 12; program doc §4 says twelve; new ADR row present in the register
  index and body.
- `node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"` green (skill-lint gate).
- Version bump + CHANGELOG in the same commit (release-plugin, MINOR).
