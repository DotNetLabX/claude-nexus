# adhoc-RulesRegistry — Lessons

> **Learner disposition (2026-07-11 → nexus 1.30.4):** [APPLIED] grep-gate executed-acceptance + whitelist/sibling-carve-out reconciliation + shipped-text self-containment (Improvement Proposal, with adhoc-AgentGrounding et al.) → create-implementation-plan Plan Grounding. [APPLIED] bump-plugin CHANGELOG stub mis-insert (with adhoc-AgentGrounding, 2 occurrences) → scripts/bump-plugin.mjs insertion fix.

## Architect Lessons

- **Grep-gate acceptance must be reconciled against actual grep output at plan time.** All five
  plan-review findings (2 HIGH, 2 MED, 1 LOW) shared one root: the edits were sound but the
  *acceptance assertions* were stated slightly wrong against what the greps really return — a
  self-colliding `docs/kb/golden` gate (the migration note must CONTAIN the string a sibling clause
  banned), a missed sanctioned hit (`docs/kb/index.md`), a missed second in-file reference (`:392`).
  Before writing a grep-based acceptance line, RUN the grep and enumerate the expected end-state hits
  as a whitelist; a "0 hits" gate coexisting with a "must name the old location" requirement needs a
  directive-form/bare-form split. **Recurred at done-check (same slug, a 6th instance of this class):**
  Step 6's third grep whitelist said "exactly FOUR" but omitted the `CHANGELOG.md` carve-out its own
  *second* bullet already granted — the live grep returned 5 (a benign nexus-cpp `[0.1.2]` CHANGELOG
  entry). This instance **survived the code-grounded critic pass that caught the other five**, so the fix
  must be mechanical AND cover intra-step consistency: run every acceptance grep at plan time, enumerate
  the whitelist from its *actual* output, and reconcile a step's multiple whitelist bullets against each
  other (a carve-out granted in one bullet must appear in every sibling bullet that runs an overlapping
  grep). Amended in plan Step 6 at done-check.
- **Shipped-text self-containment is a plan-time check, not a review-time catch.** Steps directing
  shipped-skill edits must never resolve load-bearing definitions through dev-repo-only documents
  (tech-spec contracts, ADR numbers). Rule of thumb: for every reference a plan tells a shipped file
  to carry, ask "does the consuming repo receive the referent?" — if not, inline the definition in
  ONE shipped file and point everything else at that.
- **Code-grounded critic ROI confirmed twice in one arc:** spec pass (2 HIGH — species ambiguity,
  grammar-vs-artifact mismatch) and plan pass (2 HIGH above); every HIGH was findable only by reading
  live source/running greps, none by doc-conformance review. For shared-artifact passes the mandate
  earns its cost.
- **Bash sandbox fabricated an external-repo directory listing** (showed `docs/business-rules/`
  populated in omnivision before it existed); PowerShell refuted it. Encoded as a binding execution
  constraint in the plan header (PowerShell for all external-repo filesystem facts). Also saved to
  session memory.
- **Answering a developer question can't always update the plan — the analyze-phase gate blocks plan
  writes.** When the pipeline-state token is `analyze`, `pipeline-gate.js` blocks any `plan.md` write, even
  a small clarification the answer implies. Route the resolution through `questions.md` (binding, and the
  file the developer reads on resume) and flag the plan-text clarification as **owed** for the next
  plan-write window — don't fight the gate. The `Answering Developer Questions` workflow's "update the plan
  if the answer changes it" step is conditional on the phase permitting a plan write. (This pass: Q1/Q2
  answers landed in questions.md immediately; the Step-1 clarification was owed, then applied once the team
  lead granted an `architect:plan` window — a clean two-step: unblock the developer via questions.md now,
  apply the plan edit at the next permitted window.)

## Developer Lessons

- **A grep-only acceptance can't pin a physical format — surface the format, don't guess.** Step 1's
  acceptance ("both new files contain `source: code` and `criticality: untagged` rows") passes whether a
  "row" is an annotated bullet or a markdown-table row. The plan verb ("append … to each bullet") and the
  tech-spec grammar ("the PD-5263 golden-registry row columns as-is" — which grounds to a real markdown
  *table* in `adhoc-SddMergeGen`'s `renderRegistry`) point different directions. When the gate is
  format-blind and the source is rich prose in an external repo, the interpretation is load-bearing and
  belongs in questions.md, not in a silent choice. (Phase-1 analyze; see Q1.)
- **Ground "columns as-is" against the actual emitter before reading it as a table mandate.** The golden
  registry's column list lives in the Merge stage (`renderRegistry`), not in the Mine→Verify day-one
  entry that these omnivision files ARE — the tech-spec says that entry stays "in kb-entry-schema shape"
  and MOVES. So the same field *set* can be required without a table *format*.
- **A CHANGELOG entry documenting a path retirement will re-trip the very grep gate that retires it —
  unless you control the phrasing.** Step 7's fresh CHANGELOG prose ("X moved from `docs/kb/golden/
  {Class}.md` to Y") literally re-injected the exact retired directive-form string a same-round Step 6
  sweep had just driven to 0 hits, self-failing the gate on re-run. Fix: when *authoring new* text that
  must describe an old path (unlike quoting *pre-existing historical* text, which must never be
  rewritten), phrase around the exact retired literal — "the old per-class registry path" instead of
  quoting the string verbatim — while still using whatever bare/general form the gate already
  whitelists for CHANGELOG files. Re-run the sweep after any step that adds descriptive text mentioning
  a retired string, not just after the step that retires it.
- **Same finding, second occurrence — the architect's already-logged "reconcile grep gates against live
  output" lesson (see Architect Lessons above) held at implementation time too, from the developer side:**
  Step 6's third grep bullet enumerated 4 sanctioned hits but a live run returned 5 (a pre-existing
  historical CHANGELOG line the plan's whitelist didn't anticipate) — logged as a Carry-Over Finding in
  implementation.md rather than silently "fixed" by editing historical changelog text or the plan itself.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (Plan Grounding & Deviation Rules)
**Change:** add the two rules above: (1) grep-gate acceptance lines are written from an executed grep
with an enumerated expected-hits whitelist, never from memory of the intended end state — **and when a
step has multiple whitelist bullets over overlapping greps, a carve-out granted in one must be repeated
in every sibling** (this slug's Step 6: bullet 2 whitelisted `CHANGELOG.md`, bullet 3 forgot to, and the
mismatch survived the critic pass); (2) shipped-text self-containment — a plan step editing a shipped
file must verify every reference it introduces resolves within shipped artifacts.
**Evidence:** [adhoc-RulesRegistry] — the grep-gate class recurred **6× within this one slug** (5 at
plan-review + 1 at done-check), the last surviving a code-grounded critic pass; strong single-slug signal
even before a second slug confirms it.
**Priority:** high

## Reviewer Lessons

- **Tracing an appended entry's full sibling context (not just the entry itself) catches contradictions
  a self-report can't surface.** implementation.md's own description ("appended... recording the move")
  was accurate about the entry's content but silent on what sits *below* it. Reading the whole external
  file end-to-end (`mvc-report.md`) — not just the new section — surfaced a pre-existing `## Artifacts`
  bullet still asserting the moved registries are "(live)" at the now-deleted `docs/kb/` paths, three
  lines below the entry that says those paths are gone. The developer's own preserve-as-is rationale
  scoped itself to sections *above* the insertion point; the contradiction survived because nothing
  checked sections *below* it. When a plan step appends to an existing multi-section report, scan the
  whole file for present-tense/"(live)"-style pointers elsewhere in it, not just the new section's
  internal consistency.
- **Re-counting a claimed row total directly against the artifact (not trusting the self-report) is cheap
  insurance.** `Select-String -Pattern "source: code"` / `"criticality: untagged"` on both converted
  omnivision files took one PowerShell call and confirmed the developer's claimed 41/18 counts exactly —
  worth doing whenever a plan step converts many individual items in bulk (bullets/rows), since a silent
  off-by-one or a skipped rule would otherwise only surface by manual read.
- **A MEDIUM/LOW-only fix cycle still needs the same adjacent-area regression check as a CRITICAL/HIGH
  one.** Re-reviewing Cycle 1's 3 external-repo text fixes, the cheap-looking trap was fix #2 (a "42"→"41"
  correction) potentially colliding with a *different, independently-correct* "42 Hungarian" a few sections
  away in `## Grand totals` — same numeral, different unit (rule-ID count vs. bullet count). A surface diff
  of just the changed line would have looked fine either way; only re-deriving *why* both 42 and 41 are
  simultaneously correct (already reconciled in the original pass) confirmed fix #2 touched the right line
  and left the other alone. Don't skip the adjacent-area check just because the fix batch is all LOW/MEDIUM.
- **A Codex (external tool) cross-check can surface real findings a first pass missed — verify, don't just
  relay.** 2 of the 3 Cycle-1 fixes originated from Codex, not this reviewer's own pass. Re-verified both
  independently with the same PowerShell rigor as the reviewer's own MEDIUM, rather than taking either the
  team lead's merge or the developer's fix-status table on faith — consistent with the standing "Codex
  reviewer fabricates schema" risk (session memory): cross-check findings from any external tool against
  live source before trusting them into the record.

## Skill Gaps

- **`scripts/bump-plugin.mjs` mis-inserts the new CHANGELOG entry when the file has a descriptive
  paragraph between the H1 title and the first `## [version]` entry.** `plugins/nexus-cpp/CHANGELOG.md`
  has "All notable changes to the `nexus-cpp` plugin." on the line right after the title (most other
  plugin CHANGELOGs, e.g. `plugins/nexus/CHANGELOG.md`, don't). The tool inserted the new stub entry
  directly after the title, ABOVE that descriptive line, orphaning it mid-file below the newest entry.
  Not a plan-blocking issue (I fixed it by hand while writing the real entry — same file already
  touched, boy-scout), but worth a `bump-plugin.mjs` fix so future runs on this file don't repeat it:
  insert after the first blank-line-terminated paragraph following the H1, not unconditionally after
  the title.
