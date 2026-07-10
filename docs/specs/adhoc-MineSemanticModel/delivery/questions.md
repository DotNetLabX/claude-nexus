# mine-semantic-model — the Fifth Mine — Questions

## Q1: Step 1's byte-for-byte probe mandate leaks tokens that AC-6/AC-9 (as tech-spec-literally-scoped) forbid

**From:** developer
**To:** architect
**Status:** Open
**Step:** Step 1 (probe lift) interacting with AC-6 and AC-9 (tech-spec-level definitions)
**File:** `plugins/nexus/skills/mine-semantic-model/probes/cardinality.sql`,
`plugins/nexus/skills/mine-semantic-model/probes/orphan-fk-fanout.sql`

**Context:** Step 1 is explicit and repeated: copy the 7 probe files **byte-for-byte**, "do not
edit SQL" ("they are already parameterized ... and carry the BR1 preamble as static text; do not
edit SQL"; "Copy mechanism matters (critic M2): use a byte-copy ... KG sources are verified
BOM-free"). I copied them with `cp` (no PowerShell redirection) and verified byte-fidelity
mechanically isn't in question — the files are correct, unedited copies.

The problem: two of the seven probe files carry **pre-existing inline SQL comments** that embed
tokens the tech-spec's AC-6 and AC-9 forbid outside `references/project-profile.md`/SKILL.md's one
sanctioned exception:

1. **AC-6 (KG-token scoping)** — tech-spec: "grep ... across
   `plugins/nexus/skills/mine-semantic-model/` lists **at most one file**:
   `references/project-profile.md`." Executed as literally written (whole folder, no exclusion for
   `probes/`), the sweep lists **three** files, not one:
   ```
   probes/cardinality.sql:4:-- >100M tables (analytics_report_items, analytics_report_product_stats,
   probes/cardinality.sql:5:-- analytics_report_client_subcategory_stats) -- the runner refuses a bare TRUE on those (BR12c).
   probes/orphan-fk-fanout.sql:16:-- analytics_reports.store_id/task_id are both nullable) whenever a meaningful share of rows carry
   ```
   (Full sweep: `grep -rlE 'laurentiu_read|kg_seed|kg_god_ro|seed/db/|omnishelf-docs|analytics_report|analytics_events|retail_chain_id|fmcg_platform' plugins/nexus/skills/mine-semantic-model` → the two probe files plus `references/project-profile.md`.)

2. **AC-9 (stack-anchor sweep)** — tech-spec: "grep `\.cs\b|\.ps1\b|\bdotnet\b|DataPool|QueryLoad|\bF[0-9]{2}\b`
   across the shipped skill folder **excluding `references/project-profile.md`** returns hits ONLY
   for the literal `F38` inside SKILL.md's labeled pilot-origin story." Executed literally, it also
   hits:
   ```
   probes/orphan-fk-fanout.sql:8:-- child scope has zero non-null FK values (caught live during the F52 Step 6 dry-run against the
   ```
   (`F52`, a KG pilot feature-id embedded in a `FIX-3` review-cycle comment — not `F38`, and not in
   SKILL.md.)

I did NOT edit either probe file — Step 1's instruction is unambiguous and I take it as binding
over a downstream AC's literal wording where the two conflict. I verified this isn't accidental
scope creep on my part: the **plan's own per-step Acceptance/Satisfies lines never claim AC-6 or
AC-9 for Step 1** — Step 1's acceptance line lists only AC-2 and AC-10; AC-6 is claimed by Step 2
("AC-6 extended token list (grep lists at most `references/project-profile.md`)") and AC-9 is split
into a "references half" (Step 2) and a "SKILL.md half" (Step 3) — **no step ever claims an AC-9 or
AC-6 "probes half."** So the plan's own step-level scoping is internally consistent with leaving
probes out of both sweeps; only the tech-spec's prose ("across the shipped skill folder") reads
more broadly than the plan's step-level claims do.

**Question:** Which governs — the plan's implicit step-level AC scoping (AC-6/AC-9 never apply to
`probes/*.sql`, consistent with Step 1's byte-for-byte mandate), or the tech-spec's literal
whole-folder wording (which would require either editing the SQL against Step 1's explicit
instruction, or narrowing AC-6/AC-9's stated scope with an explicit `probes/` exclusion, mirroring
the exclusion AC-9 already grants `project-profile.md`)?

**Recommendation:** Adopt the plan's implicit scoping as authoritative and amend AC-6/AC-9's
tech-spec text to state the exclusion explicitly (`excluding references/project-profile.md and
probes/*.sql` for AC-9; "at most one file, not counting pre-existing byte-for-byte probe comments"
for AC-6) — for the same reason `project-profile.md` is already excluded from AC-9: a byte-for-byte
lift of already-piloted, grep-verified-safe (AC-2/AC-5 pass) source is a narrower, load-bearing
promise than the generalized prose files, and Step 1 forbids editing it. The alternative (hand-
editing two probe comments) would break byte-for-byte fidelity for a purely cosmetic reason (the
tokens are in comments, not executable SQL, and neither is a credential — AC-5 already covers
credential hygiene and passes 0-hit).
**Confidence:** high — Step 1's "do not edit SQL" instruction is explicit and repeated twice with a
named mechanism risk (BOM); the plan's own Satisfies lines corroborate that AC-6/AC-9 were never
intended to reach the probes; the leaked tokens are non-sensitive (public table/column names, an
internal pilot feature-id in a code comment), unlike a credential.

### Answer
**Adjudicated (architect, 2026-07-10): the Recommendation is adopted in full — the plan's
step-level scoping governs; the probes were correctly NOT edited.** The tech-spec's AC-6/AC-9
wording is amended with the explicit `probes/*.sql` carve-out (mirroring the existing
`project-profile.md` exclusion) and a Decisions row records the rationale: byte-for-byte fidelity
is the binding contract for the lifted SQL, the leaked tokens are non-sensitive comments (AC-5's
credential sweep stays whole-folder and passes), and the plan's per-step Satisfies lines never
claimed AC-6/AC-9 for Step 1. Architect re-executed both sweeps and confirmed the exact 3-file /
1-token inventory the developer reported. The developer's handling — proceed under the stated
recommendation, report the gap honestly rather than silently passing or silently editing — was
correct on both counts.
**Status: Closed.**

## Q2: Step 5's sequencing gate flipped RED mid-implementation — a sibling slug bumped plugin.json to 1.29.0, uncommitted, ahead of this one

**From:** developer
**To:** team-lead / architect
**Status:** Open
**Step:** Step 5 (release)
**File:** `plugins/nexus/.claude-plugin/plugin.json`

**Context:** The task brief stated the sequencing gate was GREEN at hand-off (`plugin.json` ==
committed HEAD at 1.28.0) and gave the exact re-check command to run immediately before bumping:
`git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` exits 0. I re-ran that check
directly before invoking the bump (good practice — never trust a staleness-prone precondition), and
it now **fails** (exit 1). Investigation:

```
git diff HEAD -- plugins/nexus/.claude-plugin/plugin.json
-  "version": "1.28.0",
+  "version": "1.29.0",
```

`git status --porcelain` shows a **different, concurrent, uncommitted change set** — not mine —
touching `plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md`,
`plugins/nexus/agents/solo.md`, `plugins/nexus/agents/team-lead.md`,
`plugins/nexus/commands/solo.md`, `plugins/nexus/commands/team-lead.md`,
`plugins/nexus/rules/agents-workflow.md`, plus a new `docs/specs/adhoc-ArchitectFastLane/` folder.
File mtimes on the touched files are recent (within this session's window), confirming this is a
**live concurrent pipeline run** (apparently slug `adhoc-ArchitectFastLane`) that has already bumped
to 1.29.0, uncommitted — the exact "uncommitted sibling bump" hazard CLAUDE.md's double-bump rule
and this plan's Step-5 gate exist to catch (the same shape as the adhoc-DecisionLog-in-flight
scenario the plan was originally written against, now recurring with a different sibling).

`bump-plugin.mjs --dry-run` (run for visibility only, no `--minor`, no write) confirms it would
propose `1.29.0 -> 1.29.1` and lists dirty-file categories that are **not from this slug**
("agent instruction/behavior change", "shipped command changed", "rule (injected every session)")
alongside the four mine-family skill changes that ARE mine.

I did **not** run the bump. I did not touch any of the sibling's files. Steps 1-4 (probes, the four
references, SKILL.md + evaluate-skill, the family registration edits) are complete, verified, and
lint/test-green independent of this — only the release step is blocked.

**Question:** Hold Step 5 until the sibling slug commits (or its bump is otherwise resolved), then
re-run the sequencing gate and the bump? Or is there a different resolution (e.g. the sibling's bump
is itself abandoned/reset by its own owner)?

**Recommendation:** Hold. Do not bump over the uncommitted sibling — CLAUDE.md is explicit ("never
bump over an uncommitted sibling bump ... team-lead/operator-owned ordering") and this plan's Step 5
text names exactly this ordering as team-lead/operator-owned, not developer-resolved. Re-run
`git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` once the sibling's change lands
in a commit, then proceed with `node scripts/bump-plugin.mjs --dry-run` followed by
`node scripts/bump-plugin.mjs --minor` exactly as originally planned (targeting whatever version
follows the sibling's committed one, not necessarily 1.29.0 anymore).
**Confidence:** high — this is a direct, mechanical re-application of the plan's own pre-authored
gate logic (CLAUDE.md's double-bump rule + the plan's named exact-check command) to a hazard that
recurred in a new instance; no judgment call beyond "the gate says wait" is required.

### Answer
**Confirmed (architect, 2026-07-10): HOLD — the developer's refusal to bump was exactly right.**
The concurrent change set is a live pipeline run in another operator session (slug
`adhoc-ArchitectFastLane`, uncommitted 1.29.0 bump). Resolution is operator-owned: once that
session's work commits (or its bump is reset by its own owner), re-run the gate
(`git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json` exits 0) and execute Step 5
as planned — the bump then targets whatever version follows the sibling's committed one (1.30.0
if the sibling lands 1.29.0). Surfaced to the operator in the session report; Steps 1–4 are
done-check-verified independent of this.
**Status: Closed (awaiting operator action, not further pipeline work).**
