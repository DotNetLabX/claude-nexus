# Lessons — adhoc-MineFamilyCore

## Architect Lessons

- **Execute acceptance greps against disk at plan-authoring time — never assert them from the
  mental model of files you read earlier.** [adhoc-MineFamilyCore] All three HIGH critic findings
  (F1 signature collision with an out-of-scope skill shipped later, F3 non-existent external
  backlog path, F4 gate-vs-step wording mismatch) plus the disposition-table drift (F2/F7/F8)
  shared one root cause: the AC grep targets and the table were written from context memory of the
  SKILL.mds instead of re-run live. For a feature whose entire value is grep-verifiable
  de-duplication, an AC is only real if it was executed-true when authored. The plan's own
  grounding rule ("any count the plan cites comes from a grep run at plan time") covers this —
  it was applied to the P0 anchors (all verified correct) but not to the AC-3 signatures.
  **How to apply:** before writing any grep-shaped AC, run the exact grep across the exact
  post-condition scope (including out-of-scope siblings that could collide) and paste the pre-edit
  hit inventory into the spec.
- **A consolidation pass must sweep for external consumers of the headings it removes.**
  [adhoc-MineFamilyCore] `agents/team-lead.md:127` cited "mine-verify-cover's Execution topology" —
  found only because the critic was instructed to grep the whole plugins/ tree for consumers. The
  plan's removal rules cover code symbols ("enumerate ALL consumers from a grep before planning a
  removal"); section headings in prose artifacts are the same class and need the same sweep.
- **Code-grounded critic earns its cost on shared-artifact passes — again.** [adhoc-MineFamilyCore]
  A doc-only review would have approved this plan (spec and plan were internally consistent); every
  HIGH was findable only by executing greps against the live tree. Third confirmation of the
  mandate (after the SDD and raw-SQL evidence already in the architect doc).
- **A plan that sanctions cross-artifact record annotations should pre-declare the ADR-18
  boundary-detector hits.** [adhoc-MineFamilyCore] Step 5's dated addenda to two other slugs'
  summary.md (team-lead-owned) correctly tripped the boundary detector 4×; the hits are
  plan-sanctioned but the sanction lived only in my head until the done-check recorded it — a
  later idempotency scan could have misread them as fabrication. **How to apply:** when a plan
  step instructs a write to another role's artifact, add one line to the step: "expect
  boundary-detector entries; the done-check records them as sanctioned" — so the ruling is
  pre-authored, not reconstructed.

## Developer Lessons

- **A multi-line markdown wrap silently breaks a single-line grep signature — write the grep target
  string, then immediately re-grep it, before moving to the next signature.** [adhoc-MineFamilyCore]
  Twice in this pass a bolded AC-anchored phrase (`**appends a changelog\nentry**`, and separately
  `pilot executed\n2026-07-04/05`) got line-wrapped by normal prose formatting, which silently
  turned a 1-hit grep into a 0-hit grep — caught only because I verified every AC-3/AC-6 target
  immediately after writing it, not batched at the end. **How to apply:** for any deliverable whose
  acceptance is "this exact substring appears," grep it right after writing it, not after finishing
  the file — a wrap is invisible on read-back (the words are still there, just split across two
  lines) and easy to miss without the grep.
- **A "lift, don't rewrite" instruction still requires connective-prose judgment at the seams.**
  [adhoc-MineFamilyCore] The three SKILL.mds' restated blocks were never byte-identical to each
  other (same effect, different wording — e.g. cover's topology intro vs repo's/ref-model's), so a
  literal splice of "the" canonical text into a shared file would have silently picked one skill's
  phrasing as canonical and orphaned the others' equally-valid framing. The plan's intent (verified
  against the tech-spec and confirmed by the AC grep battery, which is signature-based not
  full-text-based) was: lift the *load-bearing sentences* verbatim, but the surrounding prose that
  glues per-skill deltas together is fair game for light consolidation. Treating "lift, don't
  rewrite" as "never touch a word outside the AC-cited signatures" would have been over-literal and
  produced a worse-organized core file with no real fidelity gain — the grep battery is the actual
  zero-drift contract, not word-for-word identity with any one source.
- **`bump-plugin.mjs`'s auto-generated CHANGELOG bullets are a placeholder, not the final text, when
  the plan specifies exact CHANGELOG prose.** [adhoc-MineFamilyCore] The tool writes a generic
  file-classification bullet list (e.g. "skill change (x)"); when a plan step names the literal
  CHANGELOG line to ship, that text replaces the tool's default after the bump runs — the bump and
  the changelog wording are two separate concerns the tool bundles by convenience, not by contract.

## Reviewer Lessons

- **A retroactive Step 2 (implementation already committed/released) still earns full independent
  re-execution, not a re-read of implementation.md's evidence table.** [adhoc-MineFamilyCore] The
  pipeline stopped after the architect's Step 1 done-check with no Step 2/summary; by the time
  review ran, the change was already on `main` at nexus 1.26.1. Re-running all 8 AC greps, the
  test suite, and `selfcheck.mjs` live (rather than trusting the recorded output) was the only way
  to confirm the "zero behavior change" and dedup guarantees actually held at HEAD — and it was
  cheap, since the AC battery this feature shipped with is itself fully re-executable. **How to
  apply:** treat "already committed" as a reason to verify against the live tree, not a reason to
  skip verification — a stale or drifted claim in implementation.md is exactly as possible after
  commit as before it.
- **When a plan step repoints a citation to a removed heading (critic F6-class), sweep the *whole*
  live doc tree for the same dangling text, not just the one file the critic already named.**
  [adhoc-MineFamilyCore] The plan fixed the one consumer the critic found (`team-lead.md`); this
  review's gap analysis additionally grepped `plugins/` and `docs/architecture/README.md` for the
  same removed-heading text and confirmed no second dangling citation existed. Confirming the
  critic's fix was complete (not just correctly applied where already spotted) is a distinct check
  worth the extra minute on any heading-removal pass.

## Skill Gaps

None — `evaluate-skill` and `release-plugin` both covered this pass's needs as invoked; no missing
or ill-fitting skill encountered.
