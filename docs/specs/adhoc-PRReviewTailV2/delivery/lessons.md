# Lessons — adhoc-PRReviewTailV2 (superseded, never implemented)

## Architect Lessons

- **"Continue this feature/discussion" meant the discussion — not a build sprint.** The owner asked to
  continue a *discussion* about a thin feature; the architect compressed it into two option menus and
  ran spec → plan → critic in one sitting. The owner's correction was explicit ("the discussion! and
  you did what?"). Lesson: when the user names a discussion, the deliverable is the conversation and
  the assessment — the spec starts only on an explicit "spec it". An option menu the architect authors
  is steering, not discussing.

- **Concept before mechanics: a richer channel for the wrong payload is still the wrong feature.** v2
  made the *projection of the correctness review* richer (inline comments). The premise question —
  "should the PR carry a correctness review at all, given reviewer + Codex + tests already ran?" — was
  never asked until the owner asked it. The research then showed the correctness lens saturated (74%
  of Step-2 reviews close clean) and the conceptual lens uncovered. One premise question would have
  saved the whole v2 drafting cycle.

- **The critic catch worth keeping (inherited by the successor): diff membership is a HUNK-level
  question, not a file-level one.** `gh pr diff --name-only` passes a finding whose file changed but
  whose line sits outside the changed hunks — and the reviews API then 422s the ENTIRE POST, silently
  collapsing inline projection to the body fallback on ordinary inputs. Any inline-comment design must
  parse `@@ -a,b +c,d @@` headers (new-side range `c..c+d-1`, side RIGHT). Absorbed into
  `adhoc-ConformanceReviewer` plan Step 1.

- **Supersede-don't-delete worked as designed.** Both files carry Superseded banners pointing at the
  successor, the dead draft ADR numbers (52/53) are explicitly declared dead in the banner, and the
  critic-findings audit trail stays greppable. The one salvageable orphan — the `guard.js` hardened
  `gh` block (Step 1 of this plan, fixtures and golden expectations critic-verified) — is flagged in
  the banner as a standalone candidate pass.

## Developer Lessons

None — the plan never reached a developer.

## Reviewer Lessons

None — no implementation, no Step 2.
