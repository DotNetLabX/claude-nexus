# F29-OracleStrengthMiner — Questions

## Q1: Family membership form — full method-contract member or name-and-shape member?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis
**File:** plugins/nexus/skills/mine-oracle-strength/ (to be created)

**Context:** The ratified S2 proposal leaves this open as its Unresolved #2, explicitly marked
"Program owner's call": does `mine-oracle-strength` follow the full `mine-verify-cover` pattern (a
stack-neutral method + a per-stack adapter skill filling a capability contract), or is it a
name-and-shape member (family skeleton + skeptic protocol, but the runner ships inline because it is
already stack-thin)? The battery runner's mechanics (exact-string apply, hash-verified restore,
stdout scoring) are stack-independent; only the parse-safety check (e.g. `dart format -o none`) and
the test command vary per stack.

**Question:** Full method-contract member (per-stack adapters) or name-and-shape member (inline
per-stack table)?

**Recommendation:** Name-and-shape member now: ship the runner in the skill with a small per-stack
fill table (parse-check command, test command, crash return-code set); promote to a full adapter
contract only when a second stack's needs diverge. This mirrors the family's own seam rule
("do not extract this seam from a single language — abstract it only once a second stack is live",
mine-verify-cover §The adapter contract).
**Confidence:** high — the seam rule is established family doctrine and the runner is demonstrably
stack-thin in the field (validated on Dart; the C++ estate used sibling instruments with the same
apply/restore/score shape).

### Answer
**User (2026-07-22): "Name-and-shape (Recommended)"** — resolved. Also resolves the S2 proposal's
Unresolved #2. Status → Answered.

## Q2: Where does the buggy/fixed-pair discrimination metric slot in?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis
**File:** plugins/nexus/skills/mine-oracle-strength/ (to be created)

**Context:** The F29 backlog amendment (research 2026-07-22,
`docs/kb/research/spec-representation-and-equivalence-oracles.md`) adopts buggy/fixed-pair
discrimination as the suite/spec-strength metric — a suite is strong only if it passes on the
correct variant AND fails on the buggy variant, with a retained reference implementation standing in
for the golden spec. The S2 proposal's five stages (blind mutants → battery → adjudication →
gap-kill → report) predate this adoption. Blind mutants already give per-mutant discrimination; the
genuinely new capability is scoring the suite against a REAL variant pair (retained legacy vs
regenerated unit) when one exists — the regeneration context.

**Question:** Integrate as (a) an optional reference-pair stage that fires when a retained reference
implementation exists, (b) reporting vocabulary only (the report states discrimination in
buggy/fixed terms, no new stage), or (c) defer the pair mode to F28-RegenerateUnit's PROVE stage?

**Recommendation:** (a) — an optional, explicitly-gated reference-pair stage: when the run declares
a reference pair, the battery additionally runs the suite against both variants and reports
discrimination; absent a pair, the blind-mutant path is unchanged. Keeps F29 the single home of
suite-strength measurement (F28 consumes, never re-implements).
**Confidence:** medium — the design lean is clear but the stage boundary vs F28's PROVE is a real
trade-off the owner may see differently. **Boosted to HIGH (2026-07-22, post-checkpoint):**
(1) S1's PROVE step is specified as "S2 battery → survivor adjudication → gap-kill" — F28 invokes
F29's battery and owns no measurement machinery, so option (c) would break the ratified
consumed-not-reimplemented seam; (2) the pair run reuses the battery runner's exact operation
(apply variant → run suite → score) with a whole-unit swap instead of a mutant string — a small
in-F29 generalization, zero new machinery; (3) option (b) ships the vocabulary without the real-pair
capability, which IS the research adoption.

### Answer
**User (2026-07-22): "increase your confidence if you can"** — a confidence-boost directive, not a
direct pick. Boosted to high on the grounds above; proceeding on recommendation (a) per the
directive. `presumed (proceed-default per owner boost-directive), not a verbatim option pick —
optional reference-pair stage`. Status → Answered.

## Q3: Build F29 before F25 (the mine-family-member recipe), or F25 first?
**From:** architect
**To:** user
**Status:** Open
**Step:** Phase 1 analysis
**File:** docs/backlog.md (sequencing)

**Context:** F25-MineFamilyMemberRecipe (Ready, low effort) packages "adding the Nth mine-family
member" as a recipe — family table row insert, member-count sweep, sibling greps. F29 is the next
member addition, so the F24-before-F19 house precedent ("the recipe precedes its first large
consumer") could argue F25 first. But F24-before-F19 amortized over 10 repetitions of the same pass;
F29 is ONE member addition, and building it manually yields a fresh third/fourth data point for F25.

**Question:** F29 now with a manual member-addition pass (lessons feed F25), or F25 first?

**Recommendation:** F29 now; log the member-addition friction to lessons.md as F25 input. A recipe
amortizes over repetition — one consumer doesn't buy its build, and F25 gets better evidence.
**Confidence:** medium — the precedent cuts the other way on a literal reading; this is a sequencing
preference the owner owns. **Boosted to HIGH (2026-07-22, post-checkpoint):** (1) queue check — F29
is the only family-member addition in the entire Ready queue (mine-conventions prototypes
project-local first, no near-term nexus build date), so the recipe has no amortization base now and
gains F29's fresh data point for later; (2) the recipe's checklist (family-table row insert,
member-count sweep with the positional-ordinal carve-out, sibling greps, skill-lint) is inlined as
explicit numbered plan steps in F29's plan — everything the recipe protects is protected this run;
(3) the F24-before-F19 precedent's own stated justification is "10 skills × the same edit pass" —
explicit amortization language one consumer doesn't meet.

### Answer
**User (2026-07-22): "increase confidence if you can"** — a confidence-boost directive, not a direct
pick. Boosted to high on the grounds above; proceeding F29-now per the directive. `presumed
(proceed-default per owner boost-directive) — F29 now, member-addition friction logged to lessons.md
as F25 input`. Status → Answered.
