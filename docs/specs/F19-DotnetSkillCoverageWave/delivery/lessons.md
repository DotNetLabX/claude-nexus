# F19-DotnetSkillCoverageWave — Lessons

## Developer Lessons
- **A same-wave edit that inserts lines above a cited section stales every line-number cross-reference to
  that section — including one the plan told you to write.** F19 Step 2's `Validator.md` was instructed to
  cite `service-infra-conventions §10 (SKILL.md:253-272)`; Step 7's edits to that same file (Assumes block
  + §3 fallback) then shifted §10 down ~28 lines, staling the cite the moment both steps landed. The
  self-review caught it. Takeaway: when a wave edits both the citing file and the cited file, **cite by
  stable section anchor (`## 10. Validators`), never by line range** — and re-sweep line-number cross-refs
  after any insert-above edit (recipe §3 directional/adjacent-surface discipline extends to line-numbered
  cites, not just "above"/"below" words).
- **The per-step acceptance greps double as the coherence proof for a two-surface reconciliation.** For
  the HIGH-1 fix, "FE block contains `ValidatorsMessagesConstants` AND zero `NotEmptyWithMessage`" + "the 3
  remaining `NotEmptyWithMessage` hits are all MediatR-path" together *proved* the FastEndpoints/MediatR
  split was reconciled, not just present. Running the grep and reading *where* the residual hits landed is
  a cheap, decisive check that the contradiction is actually gone.
- **`## Assumes` first-H2 placement plays nicely with a pre-existing worked-exemplar blockquote.** Several
  nexus-dotnet skills open with an intro paragraph + a `>` worked-exemplar blockquote before the first H2.
  Inserting `## Assumes` after the blockquote (not before the intro) keeps it the *first H2* — the W5 lint
  only needs `^## Assumes` anywhere, but the F18 §4.1 judgment bar wants it as the first H2, and this
  placement satisfies both without disturbing the exemplar framing.

## Architect Lessons
- **Re-verify multi-repo feedback claims before planning — three of ten needed narrowing.** P5's
  promote-target (fokus `create-standalone-service`) never existed (no dir, no git history — only a
  lessons description); P9 was half-fixed at 1.5.0 (attribution shipped, only the fallback posture
  missing); P1's "dead references" were real reference-app members needing declare+fallback, not
  deletion. A plan written from the feedback's framing alone would have shipped a wrong fix shape on
  all three. The "re-verify aged findings against current source" rule paid for itself 3×/10 here.
- **The code-grounded critic caught a cross-skill contradiction no doc review could.** HIGH-1
  (Validator.md's FastEndpoints template vs service-infra-conventions §10's explicit prohibition)
  was visible only by reading both live files — and my own plan had certified the sections as
  "consistent siblings." Shared-artifact passes get code-grounded review, confirmed again.
- **Pin an executor split in the plan when the lane splits a step's ownership.** Writing "the
  developer delivers the guards; release-plugin is the lane close's — Implemented, not Deviated"
  directly into Step 9 pre-resolved what would otherwise be a done-check dispute in one line.
- **A hard estate-count guard ("= exactly 10") is brittle against concurrent born-compliant
  skills** — the critic's per-folder reformulation (each target folder has exactly one) is immune
  to an F21-class new skill landing mid-wave. Prefer per-unit guards over estate-wide equalities
  when other lanes can add members.

## Skill Gaps
- None. `edit-shipped-plugin-skill` (Read-channel) + `skill-lint.mjs` covered every step; no missing or
  ill-fitting skill surfaced. (The Skill-tool non-resolution is a cache-version issue, not a skill gap —
  the recipe content itself was complete and sufficient via the Read channel.)
