# Dotnet Feedback Apply — Lessons

## Developer Lessons
- **Grep glob `{a,b}/**` false-negatives top-level files.** During Phase-1 pattern verification,
  `Grep(pattern, path=…/skills, glob="{service-registration,persistence-patterns}/**")` returned
  "No files found" even though `service-registration/SKILL.md` contains matches. The `/**` suffix
  requires an intermediate path segment, so it skips files that sit *directly* in the braced dir.
  Fix: grep the file/dir path directly (`path=…/service-registration/SKILL.md`) or use a two-form
  glob. Don't trust a single braced-glob "0 hits" as proof a pattern is absent.
- **A "→ 0 hits" acceptance grep trips on your own corrective prose.** When a plan's acceptance is
  `{fictional-token} → 0 hits` and you write the fix as a *negation* ("there is no `IAction` type",
  "not `AutoMapper/Mapperly`", "no `Role.Admin`"), the literal token survives in the file and the
  mechanical gate fails. Reword the negation to drop the literal token while keeping the guidance
  ("substitute the real one", "the repo's mapper is Mapster", "the list below is the complete set").
  Hit this on Steps 3 (`IAction[^a-zA-Z]`), 5 (`global using Blocks.Domain`, `AutoMapper|Mapperly`),
  and 9 (`UserRoleType.(Editor|Admin)|Role.Admin`) — a recurring tax when removing named fictional
  identifiers. Check every "→ 0" acceptance grep against your *own* edits, not just the old content.
- **`bump-plugin.mjs --check` on an already-bumped (uncommitted) tree prints "no plugin
  behavior-surface changes detected — no bump needed" and exits 0 — that IS the pass.** Once
  `--minor`/`--patch` has bumped `plugin.json`, the plugin's version ≠ HEAD, so `--check` no longer
  sees an *un-bumped* shipped change; the wording reads like it missed the diff but exit 0 is correct.
  Don't re-bump in response (that double-bumps — one bump per feature).
- **Census the whole estate before writing a prescriptive absolute ("never X", "always Y", "nothing
  else Z") from live source.** Fix cycle 1 caught two pass-introduced false invariants: "VO ctor is
  `private`, never `internal`" (live: 14 `private` / **3 `internal`**) and AssignUserId hooks are the
  only thing that sets `CreatedById` ("nothing else sets it" — live: a handler assigns it directly).
  A single dominant exemplar reads like a universal rule; it usually isn't. When the point is genuinely
  the majority pattern, write it as **"prescriptive default (live majority ~N/M)"** and name the
  sanctioned minority variant with its exemplars — don't inflate a majority into an absolute. A quick
  `grep -c` census across the estate (not one file) before committing an absolute would have prevented both.
- **Pre-existing stale content in an in-scope target skill still gets fixed — and its provenance
  labeled.** The audit-field-types defect (`CreatedById (string?)` etc. → real `TPrimaryKey`/`DateTime`)
  predated this pass (the pass never touched those lines), but the file was an in-scope target and
  correctness is the bar, so it was corrected in the fix cycle. Record provenance (pre-existing vs
  pass-introduced) in implementation.md so the reviewer/architect can attribute it correctly.

### Improvement Proposal (optional, for systemic issues)
**Target:** `plugins/nexus/skills/create-implementation-plan/SKILL.md` (acceptance-grep guidance)
**Change:** When a plan step's acceptance is `{token} → 0 hits` for a fictional/removed identifier, add a
one-line note that the corrective prose must avoid the literal token (or the developer will trip the gate
with a negation). Alternatively phrase such acceptances against a *code-fence-scoped* or *usage-shaped*
grep rather than a bare token, so pedagogical "this does not exist" prose doesn't false-positive.
**Evidence:** [adhoc-DotnetFeedbackApply — Steps 3, 5, 9 each required rewording a corrective negation]
**Priority:** low

## Reviewer Lessons
- **A "→ 0 hits" acceptance grep only proves the OLD wrong pattern is gone, not that the NEW pattern is
  itself accurate.** Steps 3's VO-ctor fix passed its plan-mandated grep (`internal` ctor guidance → 0
  hits) cleanly, but the replacement text's own absolute wording ("never `internal`") turned out to
  overclaim — 3 live counterexamples exist (`Auth.Domain/Persons/ValueObjects/EmailAddress.cs:10`,
  `Review.Domain/_Shared/ValueObjects/EmailAddress.cs:10`, `Review.Domain/Assets/ValueObjects/
  FileName.cs:9`, all `internal`+`[JsonConstructor]`). A mechanically-clean acceptance gate on a
  fact-correction pass tests removal of the old fiction; it does not test the new claim's own
  universality. Worth a second look whenever a corrected skill states an absolute ("never", "always",
  "only") — grep the codebase for counterexamples to the NEW rule, not just absence of the OLD one.
- **Concurrent-session interference is now something to actively expect on this shared repo, not just
  react to.** Mid-review, `git log -1` moved from the session-start HEAD to a different feature's commit,
  and `gen-omni.mjs --check`'s drift count changed between two consecutive runs seconds apart — live
  proof of a second session editing nexus-core files concurrently. Scoping every git/lint check to the
  feature's own path (`-- plugins/nexus-dotnet/`) rather than trusting a whole-repo check kept the review
  accurate; a whole-repo `gen-omni --check` would have wrongly implicated this feature in unrelated
  nexus-core drift it never touched. Confirms the existing "re-check branch under concurrent run" lesson
  — extending it: scope every verification command's path, not just the git-branch/HEAD re-check.
- **Fan-out fact-checking against a live reference repo pays for itself on a 13-skill, ~45-defect pass.**
  Three parallel read-only `general-purpose` agents, each handed a cluster's diff + direct Grep/Read/
  PowerShell access to `D:\src\dotnet-microservices`, independently verified every corrected claim with
  file:line citations in well under the time a single-pass read would have taken, and caught the one real
  finding (VO ctor) that a prose skim would likely have missed since the corrected text reads as
  internally consistent and matches the plan's own wording.
- **Cycle 1 confirmed the concurrent-session drift really was noise, not a symptom.** Re-running
  `gen-omni.mjs --check` at the start of the re-review (vs. mid-initial-review) showed the previously-
  flagged nexus-core drift (`architect.md`, `critic.md`, `plan-template.md`) gone — "omni twin is in sync
  with nexus" — confirming it was transient concurrent-session churn on files this feature never touched,
  not a lingering defect. Re-running the same scoped check at the start of each re-review cycle (not just
  once) is what let this resolve itself off the review's plate instead of becoming a stale, carried-forward
  caveat.
- **A developer's own supporting arithmetic in implementation.md can be wrong even when the shipped text is
  right.** Fix #1's audit trail cited "14 private / 3 internal / 1 public" as the live VO-ctor census, but
  the "1 public" traced to `Pagination` in `ArticleHub.API/.../SearchArticlesQuery.cs` — a query-DTO class,
  not a value object at all (doesn't derive from `StringValueObject`/`SingleValueObject<T>`/`ValueObject`).
  The shipped skill text itself only claims "~14 of 17" and is accurate. Lesson: verify the *shipped*
  content against live source (what ships), but also spot-check the *supporting* numbers in implementation.md
  when they're oddly specific (an exact "1 public") — they can smuggle in a miscount that doesn't affect the
  fix but does affect how much to trust the rest of the developer's self-reported census next time.

## Architect Lessons
- **Grep-shaped acceptance made this done-check grep-and-confirm, not read-and-judge.** Every load-
  bearing defect correction had a named grep in the plan (`IAction[^a-zA-Z]` → 0, `Send[A-Z]\w*Async`
  → 0, `MasterData` → 0, the role-identifier alternation → 0, `plugin.json` = 1.4.0). The Step-1
  verdict rested on five mechanical greps + `git status` (13 folders, create-module untouched) rather
  than prose judgment. Confirms the "acceptance asserts the mechanism" plan rule pays off most on a
  prose-skill pass where there is no build to lean on — keep authoring removals as usage/token greps.
- **On a shared-artifact done-check, verify the edits actually landed — don't trust the self-report
  alone.** implementation.md claimed all ~45 defects applied and none skipped; the log-scoped skill
  check + the five spot-greps + git file-set corroborated it independently. For a pass that edits
  shipped skill files (whose correctness the reviewer will re-check against live consuming-repo
  source), the architect done-check should at least confirm file-set + the highest-risk grep
  acceptances rather than pass on the disposition table alone.
- **Literal-token "→ 0 hits" acceptances I authored forced the developer to reword corrective prose
  (Steps 3/5/9).** This is the architect side of the developer's improvement proposal above — when a
  plan's acceptance removes a *named fictional identifier*, a bare `{token} → 0` grep also matches the
  pedagogical "there is no `{token}`" sentence the fix wants to write. Phrase such acceptances
  usage-shaped or code-fence-scoped at plan time. Strengthening the developer's existing proposal
  (`create-implementation-plan` acceptance-grep guidance) — not a separate one.
