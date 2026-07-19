# F15-SkillCandidateMiner — mine-skill-candidates: the code-side pattern miner (tenth mine)

**Status:** Ready — code-grounded critic **GO-with-fixes** folded 2026-07-19 (2 HIGH, 5 MEDIUM, all folded — see `../delivery/review-critic.md`)
**Target:** `plugins/nexus` — one new shipped skill `mine-skill-candidates` (+ family-core 10th row,
member-count sweep, and a compatible extension to the `mine-skill-gaps` registry format); one
release-plugin bump at close (**MINOR** — new capability).
**Binding inputs:** owner idea shaped in-session 2026-07-19 (ADR-58 lane — no proposal; this spec is
the definition); consumer: `omnivision-ai-sdk` F2-SdkRewrite **P3** (pattern pack + do-not-regenerate
list — its tech-spec names this dependency class); sibling precedent: F10-SkillGapMiner tech-spec +
ADR-63 (registry species); tooling precedent: `mine-verify-repo`'s deterministic metric layer (git
log + Code Maat, bot-filtered); research context: `docs/kb/research/br-anchored-regeneration-landscape.md`.

## Goal

The **supply-side complement** to `mine-skill-gaps`: where the ninth mine reads delivery-artifact
exhaust (plans/lessons — demand: "work we keep doing with no skill"), this mine reads the **code and
its git history** (supply: "patterns the repo already repeats"). It exists because artifact mining
returns near-zero signal on repos with thin delivery estates and zero skills (the SDK case: every
row would be a gap). Discovery only — building skills stays with improve-skills; judging them with
evaluate-skill. **Dual output:** skill candidates AND an anti-pattern list (recurring shapes that
are debt — recorded so regeneration/refactoring lanes know what NOT to propagate). Skills are
recipes, not classes — the unit of mining is the **recurring cross-file shape**, never the single
class (which is why this is not bolted onto `mine-verify-cover`).

## S1 — Discover (two lenses)

- **Lens A — co-change (git history).** Reuse `mine-verify-repo`'s deterministic-layer posture:
  bot-filtered `git log`, Code Maat coupling over a declared time window. A **recurring file-set
  that changes together across ≥3 capability-adding commits** is a candidate recipe (e.g. every
  add-a-task-type commit touches `ts_task + ts_scheduler + core_adapter + ts_types` → that file-set
  IS the recipe). Candidate carries: inferred name, the commit citations, the file-set.
- **Lens B — structural recurrence.** **≥3 units instantiating the same shape** (same member/
  signature skeleton, same wiring — e.g. every detector: init/detect/release + net + decrypt).
  Piggybacks `graphify-out/` when present (communities + fan-in/out as the cheap pre-cluster);
  falls back to name/signature clustering (grep/ctags tier) when absent — graphify is an
  accelerator, never a prerequisite. Candidate carries: inferred name, the instance citations
  (`file:line` per instance), the shared skeleton.
- Both lenses are **cheap collectors, not smart detectors** (the F10 pilot lesson: collection is
  the bottleneck). Clustering judgment stays model-tier; the git/Code Maat parse may ship as a
  bundled script (ADR-62 posture) — developer's call.
- **Hand-authored seed join:** if the swept repo's architecture doc carries a Gaps table (skill-name
  suggestions with file-lists, e.g. the SDK's `index.md` §Gaps), those rows join S1 as pre-named
  candidates (the Tier-A analogue) — the lenses corroborate or challenge them, never re-discover
  them from scratch. A seed **without** lens corroboration survives only as a `candidate` row
  explicitly marked `uncorroborated` (its citation stays the hand-authored file-list — real
  knowledge, unverified by this mine); **only lens-corroborated candidates count toward the run
  gate**.

## S2 — Verify (skeptic + health gate)

A **fresh-context skeptic** (mandatory, clean-room posture) re-reads each candidate's actual
evidence — the cited commits (Lens A) or the cited instances (Lens B) — and confirms one coherent
pattern; coincidental clusters die here. Then the **health gate**, which the artifact-side sibling
does not need: recurrence in a legacy repo includes debt shapes, so every surviving candidate is
cross-checked against the swept repo's `docs/tech-debt/` registry and reference model (when
present). Recurring **and** debt-implicated → routed to the **anti-pattern list**, not the skill
candidates; recurring and healthy → skill candidate. A candidate with no tech-debt/reference-model
signal either way passes as a candidate with the check recorded as `unopposed`. Every surviving row
carries the skeptic's excerpt (F6 R2 pattern).

## S3 — Emit (same registry, extended — one triage surface)

Write into the **existing species**: `docs/skill-gaps/registry.md` in the swept repo (ADR-63). Two
compatible format extensions. **Schema ownership (one owner per fact):** `mine-skill-gaps` remains
the **canonical schema owner** — it gains the `source` field and stamps `source: artifact` on its
own rows; this skill **points** to that schema and owns only its deltas (the `code` source value
and the anti-patterns section, cross-referenced from `mine-skill-gaps`, never duplicated into its
template):

- **New `source` field**, positioned **immediately after `kind`** — the full 9-column header, once:
  `| name | kind | source | recurrence | citations | repo | skeptic excerpt | last_verified | status |`.
  Values `artifact | code` (existing F10 rows are `artifact` by definition; optional-with-default
  for backward compatibility). A candidate found by **both** miners merges into one strengthened
  row citing both evidence classes — strengthen-don't-duplicate (the family invariant), the
  cross-corroboration this co-location buys.
- **New `## Anti-patterns (do-not-propagate)` section** in the same file: rows killed by the S2
  health gate, each citing its instances AND the tech-debt row that implicated it. Consumer: the
  refactoring lane and F2-P3-style target design ("shapes we deliberately do not regenerate").

All carried invariants hold: one canonical set over linked evidence; per-row `last_verified`;
append-only changelog entry on every write; re-runs refresh keyed on the delta since
`last_verified`, never fork duplicates; kills mark `superseded` with a reason. Code-row citations
must resolve: commit SHAs exist, `file:line` instances exist at the cited revision.

## S4 — Route (owner-triaged, never auto)

Identical posture to F10: the registry is evidence, not an auto-route. Owner triages
`candidate → confirmed`; confirmed candidates route to improve-skills' New-Skill recipe through its
existing channel rules. Anti-pattern rows are **evidence handed to the consuming repo's design
artifacts** (target-design / refactoring triage), never auto-applied. The miner never builds
skills, never edits code, never invokes improve-skills.

## Family membership

**Tenth mine** — joins by **name and shape** (discover → verify → registry → owner triage), not the
full method contract: no stack adapter, no ADR-60 capability-contract obligations (free tooling
only: git, Code Maat, grep/ctags; graphify optional). Precedents: `mine-skill-gaps` (ninth,
shape-not-contract) and `mine-verify-repo` (free-tooling metric layer).

Concrete landing sites: `mine-verify-cover/references/mine-family-core.md` — the §The mine family
table gains a **10th row** (unit = one repo's code + git history; gate = skeptic + health gate over
resolving citations); the "nine-member" header (`:3`), the **member-enumeration parenthetical
(`:4`)** — which gains `mine-skill-candidates` by name — and the "all nine" invariant line (`:23`)
all update to ten. The new SKILL.md carries the standard family-core pointer (sibling boilerplate). **Member-count sweep** (the F10 acceptance pattern) across the sibling sites that currently
say nine: `mine-verify-repo/SKILL.md:27,276` · `mine-verify-flows/SKILL.md:16` ·
`mine-verify-cover/SKILL.md:473` · `mine-reference-model/SKILL.md:28-29,221` ·
`mine-design/SKILL.md:25,27` · `mine-algorithm/SKILL.md:26,28`. (`mine-skill-gaps/SKILL.md:20`
"ninth mine" remains correct — it names its own ordinal, not the family size — but gains the
sibling cross-reference, see S3.)

**Execution topology (disclosed latitude):** single-session run; the S2 skeptic MUST be a
fresh-context subagent; lens collection may run inline or as subagents. The family core's full
staged-orchestration mandate is deliberately not adopted (shape-not-contract).

## Non-goals (recorded so they aren't re-litigated)

- Building or fixing skills — improve-skills / evaluate-skill own that split.
- Class dispositioning / coverage census — that is F2-P2-style census work; this mine feeds skills,
  not per-class verdicts.
- Business-rule mining — `mine-verify-cover` owns rules; this mine never asserts behavior.
- Learner changes — its contract (lessons.md + comm-logs, 2-occurrence promotion) is untouched.
- Cross-repo merge machinery — rows stay merge-ready via the `repo` field (F10 posture).

## Acceptance summary

**Grep-checkable:** the skill passes shipped skill-lint (born-compliant, ADR-23); the family-core
table carries the 10th row; the member-count sweep is proven by **two greps** — (a)
`grep -rnE 'nine-member|all nine|9-row' plugins/nexus/skills` → **0 hits**, and (b)
`grep -rn 'ninth mine' plugins/nexus/skills` → **exactly `mine-skill-gaps/SKILL.md:20`** (positive
control that the sibling's own ordinal survived; `mine-design`'s "nine fixed causes" lines are
unrelated and stay untouched); the canonical schema in `mine-skill-gaps` shows the 9-column header
with `source` and cross-references the anti-patterns section this skill owns.
**Run gate (golden fixture = `omnivision-ai-sdk`):** a run on the SDK **corroborates ≥3 of the 7
hand-named Gaps-table recipes through an independent lens** (`add-task-type`, `add-config-param`,
`add-callback`, `add-action-type`, `add-kpi-metric`, `add-compliance-type`,
`create-conventions-doc`) — each counted row carrying **lens-produced citations** (Lens A commit
SHAs or Lens B `file:line` instances), never the seed's own Gaps-table file-list (S1's
uncorroborated rule: seed rows without lens evidence do not count); spot-check ≥3 rows' citations
resolve; AND emits **≥1 anti-pattern row** — expected: the near-duplicate KPI-block shape citing
tech-debt COR-4 (3 near-dup blocks), or another recurring-shape ∩ debt-row intersection named in
the run report — whose implicating citation resolves against the SDK's 50-row registry.
**Judgment (read-verified, not grep):** S4 names improve-skills only as the owner-executed route
target — no auto-invocation exists; evaluate-skill findings resolved (CRITICAL/HIGH fixed or
waived with reason); Judgment Gate passed at authoring; **ADR-65 extracted at close** (tenth
member + registry-species extension — the ADR-63 precedent's weight); omni twin regenerated and
committed per convention at close.

## Decisions (architect, disclosure per plan-template)

- **Both lenses in v1** (owner-ruled 2026-07-19). Co-change alone misses same-shape units each
  added once (five detectors, one commit each); structural alone misses the recipe dimension.
  (Rejected: co-change-only MVP; structural-only.)
- **Same registry + `source` field** (owner-ruled 2026-07-19). One triage surface;
  cross-miner corroboration merges into one strengthened row. Cost accepted: a small compatible
  extension to F10's shipped format, mirrored in both skills' templates in one release.
  (Rejected: sibling registry file — two triage surfaces, manual join.)
- **Anti-pattern list ships in v1** (architect, two-way door). The S2 health gate must run anyway
  (recurrence in legacy code canonizes debt otherwise); emitting the killed-as-debt rows is free
  and F2-P3 consumes them. (Rejected: defer to v2 — discards a computed result its consumer wants.)
- **Threshold 3+ on both lenses** (architect, two-way door). Mirrors F10 Tier-B: raw code/history
  signal is noisier than curated artifacts; hand-authored Gaps-table joins carry no threshold
  (they are pre-named, the Tier-A analogue). (Rejected: 2+ — lowers the bar where noise is
  highest.)
- **graphify optional, never prerequisite** (architect, two-way door). The SDK has graphify output;
  arbitrary consuming repos may not — a hard dependency would shrink the skill's applicability for
  a marginal collection speedup. (Rejected: require graphify.)
- **No spike** (architect). Both parse paths are proven in-estate: Code Maat in mine-verify-repo's
  metric layer, signature grep in daily use; clustering judgment is model-tier (F10 precedent).
- **`mine-skill-gaps` stays canonical schema owner; this skill points and owns only its deltas**
  (critic MEDIUM folded — one owner per fact, AP3). (Two-way door; rejected: template mirrored in
  full into both skills — two owners for one schema, drift by construction.)
- **Uncorroborated seeds survive as marked `candidate` rows but never count toward the run gate**
  (critic HIGH folded — closes the seeded-gate loophole while keeping hand-authored knowledge).
  (Two-way door; rejected: seeds count toward the gate — a run with both lenses broken could pass
  green.)
- **ADR-65 owed at close** (critic MEDIUM folded — tenth member + species extension matches the
  ADR-63 precedent's architectural weight; not collapsed into the tech-spec alone).

## Effort / sequencing

Single skill, single pass: **med**. Author via improve-skills' New-Skill recipe (dev-repo
carve-out, full Judgment Gate) → skill-lint → the SDK golden-fixture run → close (one MINOR bump,
omni sync). Sequencing: needed by F2-SdkRewrite **P3** (not before); sits behind the
architecture-miner in the F2 dependency order but has no dependency on it — either can ship first.
Both skills' edits (`mine-skill-candidates` new + the `mine-skill-gaps` schema extension) ride the
**one closure commit** with the single MINOR bump.
