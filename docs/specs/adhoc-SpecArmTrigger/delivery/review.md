# Review — adhoc-SpecArmTrigger

## Step 1 — Done-Check

**By:** architect, 2026-07-03. **Verdict: PASS.**

**Pre-commitment predictions (made before reading implementation.md):** (1) SKILL.md mode text drifted
from spec S2's stamp grammar; (2) `release-plugin` invocation missing from the skill log; (3) the
architect checkpoint landed unbatched (offer separated from the review-mode choice). **All three came up
clean** — grammar verbatim (`SKILL.md:82`), log entry present (`developer / nexus:release-plugin /
session 54d7fe63`), offer and review-mode in the same block (`architect.md:145`, `po.md:122`).

### Step dispositions

| Step | Disposition | Evidence |
|------|-------------|----------|
| 1 — mine-from-spec mode + reconciliation | Implemented | Architect re-grep: mode heading ×2 refs, stamp grammar verbatim, topology rule present, `not yet shipped` → 0 hits |
| 2 — create-implementation-plan referent | Implemented | `ruleName` ×3, `blanket` (preserved rule) ×2 |
| 3 — architect join + done-check + net-new checkpoint | Implemented | `LF-normaliz` ×1, `delta re-check` ×1, `ruleName` ×2, `opportunistic` ×1, checkpoint heading ×1, batched offer at `:145` |
| 4 — po batched question | Implemented | Question text inside the existing gate section (`po.md:122`) + qualification gate + both routings (per impl evidence) |
| 5 — team-lead checkpoint + dispatch | Implemented | `Record the mine-from-spec confirmation` ×1, `Mine-from-spec Dispatch` ×1; team-mode technical surfacing correctly NOT wired (out-of-scope honored) |
| 6 — regen commands | N/A (command-only) | Exactly `commands/{architect,po,team-lead}.md` modified — matches the three edited agents |
| 7 — AC-T5 drill | Implemented (plan-sanctioned main-session execution) | Artifact on disk (54 rules, 52 verified / 2 ambiguous); stamp `ab725d865a7f` recomputes identically (LF-normalized); 3/3 citation grep-backs; verdict column fully populated. Orchestrator-verified, developer-recorded |
| 8 — MINOR bump + gates | Implemented | `plugin.json` 1.19.0 → 1.20.0 (single bump); CHANGELOG hand-edited; validate --strict exit 0; selfcheck 4/5 with `gen-omni --check` expected-RED (owner-owed twin sync at commit — plan-sanctioned) |

### Satisfies cross-check
Plan steps cite AC-T1..T5 + OD-T3 — all exist in the tech-spec. AC-T6 correctly absent from steps
(operator-owed, non-blocking).

### Skill conformance (scored against the log)
The plan maps exactly one non-None skill (Step 8: `release-plugin`). The audit log contains the matching
entry (`agent: developer`, `skill: nexus:release-plugin`, this session) — self-report corroborated, no
fabrication. Steps 1–7 are plan-mapped `Skill: None` (all-None exemption applies); `## Skills Used` is
present and documents Read-channel consults with reasons. PASS.

### Notes
- The carry-over finding (pre-existing `adhoc-SddLifecycle` tech-spec diff) is correctly attributed: it is
  the architect's own OD-L8/ADR-I amendment from this feature's definition phase — expected in the tree,
  rides in the same commit set at the owner's discretion.
- Open production gates, correctly surfaced, both operator-owed: AC-T6 (first consuming-repo run) and the
  omni twin sync at commit.

## Step 2 — Code Review

## Reviewed By
reviewer, 2026-07-03.

## Verdict: APPROVED

## Pre-commitment Predictions
1. The three agent files (po.md / architect.md / team-lead.md) describe the batched-question/routing
   contract inconsistently somewhere (wording drift on the qualification gate or default-skip behavior).
2. The regenerated commands don't actually match their source agent files (gen-commands.mjs inlining bug
   or a stale regen).
3. The drilled `spec-rules.md` stamp line doesn't parse cleanly against the shipped grammar (hex length,
   date format, or field order mismatch).
4. CHANGELOG/`plugin.json` version drift (double bump, or a bump that doesn't match the changelog prose).
5. The architect.md Phase-1/Phase-2 numbered-list renumbering left a dangling reference elsewhere in the
   file (a stray "step 8" or "item 6" pointing at the wrong item post-insertion).

**Result:** (1) confirmed, weakly — one dense, self-undercutting sentence in `architect.md`'s
Technical-branch checkpoint (see Open Questions); not strong enough to assert as a finding. (2)–(5) came up
clean — independently re-verified below, not just re-read from implementation.md's claims.

## Findings

No CRITICAL/HIGH/MEDIUM findings survive at ≥80 confidence. See Open Questions for one lower-confidence
item surfaced for the developer/architect to confirm or refute.

## Positive Observations
- **Prose reconciliation is complete and self-consistent.** `grep -n "not yet shipped|AC-6-gated|reverse-engineers|ONE production class" plugins/nexus/skills/mine-verify-cover/SKILL.md` shows the code-arm premises correctly scoped (line 16's disclaimer) and zero remaining "not yet shipped" claims — independently re-run, not trusted from implementation.md.
- **Stamp grammar is verbatim and reproducible.** Independently recomputed `sed 's/\r$//' tech-spec.md | sha256sum | cut -c1-12` → `ab725d865a7f`, matching the shipped `spec-rules.md`'s stamp line byte-for-byte, and matching the grammar string in `SKILL.md:82` exactly (`Spec-stamp: {repo-relative path} @ sha256:{first 12 hex} ({date})`).
- **Drill artifact quality is high.** Independently counted: `grep -c '\*\*Verdict:\*\* verified'` → 52, `grep -c '\*\*Verdict:\*\* ambiguous'` → 2, `grep -c '^### R'` → 54 — 52+2=54, verdict column fully populated as claimed. Re-ran all 3 citation grep-backs against the source doc (`one verdict per disagreement`, `never auto-override a recorded verdict`, `disjoint input manifests`) — all present.
- **Command regeneration verified independently, not trusted.** Ran `node scripts/gen-commands.mjs nexus` myself; `git diff --stat` shows the command-file diffs for `architect.md`/`po.md`/`team-lead.md` are line-count-identical to their source agent-file diffs (46/11/28 insertions each, matching 1:1) — strong evidence the wrapper-inlining is exact, not just claimed.
- **Version/gates independently re-run.** `claude plugin validate plugins/nexus --strict` → exit 0; `node scripts/selfcheck.mjs` → 4/5 passed, the one failure is the expected-RED `gen-omni --check` (owner-owed twin sync at commit) — matches the plan-sanctioned non-failure exactly.
- **No cross-referenced-anchor drift from the Phase-1/Phase-2 renumbering.** `grep -n "step 5\|step 6\|step 7\|step 8\|item 4...8"` across `architect.md` returned nothing — no stray reference to the old numbering survived the renumbering the developer flagged in `## Key Decisions`.
- **Scope discipline on the SKILL.md reconciliation is clean.** `git diff` shows only the M0/M1/M3 rows and prose changed in the `## SDD lifecycle` section — the M2 paragraph (already shipped in 1.19.0, out of this feature's scope) is untouched.
- **The carry-over finding is independently confirmed accurate.** `git diff docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` shows exactly the OD-L8-amendment/ADR-I diff the developer described — correctly attributed to the architect's definition-phase work, not fabricated by the developer.

## Gaps
- Team-mode technical-branch surfacing (an equivalent of the PO Spec-Review Checkpoint for architect-authored tech-specs) is unwired — explicitly named as Out-of-scope in the spec and disposed by the critic (MEDIUM-1: "explicit Out-of-scope deferral… do-not-wire note on Step 5"). Not a gap in this review's scope; flagged here only for completeness per the Gap Analysis instruction.
- AC-T6 (first consuming-repo run, PO-gate path's first live traversal) is explicitly operator-owed, not blocking — correctly surfaced by both the plan and the architect's Step 1 notes.

## Open Questions
- **`architect.md:151-154`, confidence ~55 (below the ≥80 report cutoff).** The Technical-branch definition
  checkpoint's "spawned by the team lead" routing reads as internally tense: "surface both in your
  Phase-1/definition-review checkpoint report for the team lead to relay (team-mode technical-branch
  surfacing at the team lead's own checkpoint is out of scope for this slice — the team lead does not wire
  a mirror of this ask)." Read generously, this means "the generic Checkpoint-Report-Format relay still
  carries the content, but there's no bespoke PO-Spec-Review-Checkpoint-style menu/recording logic for it
  in `team-lead.md`" — consistent with the spec's Out-of-scope carve-out and the critic's MEDIUM-1
  disposition, and I confirmed `team-lead.md` has no such bespoke section (only the PO-side one). Read
  literally, an agent could take "for the team lead to relay" to imply a working relay+resume cycle that
  doesn't actually exist for this checkpoint (no matching entry in `team-lead.md`'s Message Templates for
  "resume architect after definition-checkpoint answers"). Practical blast radius is low: (a) this path is
  reachable in principle per `team-lead.md`'s own Launch Path Selection (team lead **can** spawn the
  architect for a spec-less ad-hoc technical feature), but (b) the qualification gate's "silence is the
  default-skip" fallback means the worst case is a missed opportunity to run `mine-from-spec`, not a broken
  or misleading state — and (c) the spec's Out-of-scope note already names this exact gap as
  intentional/deferred. Developer/architect: confirm whether the sentence should be tightened (e.g., made
  explicit that the generic relay applies but no bespoke recording exists yet) or left as-is since the
  scope was deliberately deferred.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Plugin validate | pass | `claude plugin validate plugins/nexus --strict` | `✔ Validation passed` (exit 0) |
| Selfcheck gates | 4/5 pass (expected) | `node scripts/selfcheck.mjs` | tests PASS, gen-commands drift PASS, gen-omni --check FAIL (expected-RED, owner-owed), bump-plugin --check PASS, spec-diff sync PASS |
| Command regen | in sync | `node scripts/gen-commands.mjs nexus` then `git diff --stat` | command-file diffs line-count-identical to their source agent-file diffs (46/11/28) |
| Stamp reproducibility | pass | `sed 's/\r$//' tech-spec.md \| sha256sum \| cut -c1-12` | `ab725d865a7f` — matches shipped stamp line exactly |
| Verdict-column population | pass | `grep -c` verified/ambiguous/rule-heading counts | 52 + 2 = 54, all rows verdicted |
| Citation grep-back (3 samples) | pass | `grep -c` on 3 sampled fragments against `tech-spec.md` | all 3 present (1 hit each) |
| Prose-reconciliation grep | pass | `grep -n "not yet shipped\|AC-6-gated\|reverse-engineers\|ONE production class"` | no stale "not yet shipped" claim; code-arm premises correctly scoped |
| Version/CHANGELOG | pass | `git diff plugin.json` + CHANGELOG read | single 1.19.0 → 1.20.0 MINOR bump; `[1.20.0]` entry names all 5 touch points |
| SKILL.md scope discipline | pass | `git diff plugins/nexus/skills/mine-verify-cover/SKILL.md` | only M0/M1/M3 rows/prose changed; M2 paragraph untouched |
| Renumbering dangling-ref check | pass | `grep -n "step 5\|step 6\|step 7\|step 8\|item 4..8"` on `architect.md` | no hits — no stray old-numbering reference |
| Carry-over finding | confirmed accurate | `git diff docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` | matches developer's described OD-L8/ADR-I diff exactly |

*Status: COMPLETE — reviewer, 2026-07-03.*
