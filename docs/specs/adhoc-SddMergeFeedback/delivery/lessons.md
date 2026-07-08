# Lessons — adhoc-SddMergeFeedback

## Architect Lessons

- **Code-grounded critic earns its cost on shared-artifact passes.** The critic (reading live source)
  caught two self-contradictions a doc-only pass would have missed: (HIGH-1) the plan's own "every inline
  copy is byte-compared by selfcheck" invariant had a hole — the *new* `crosswalkExpectations` wasn't in
  the `selfcheck.mjs` PAIRS list, so exactly the divergence hot-path would drift unguarded; (HIGH-2) a
  Verification acceptance line claimed "byte-identical registry + distillate" while items 1 and 4 of the
  same plan deliberately change those outputs. Both are the class of defect only found by reading the
  actual files (`selfcheck.mjs` PAIRS contents; the real before/after row counts). Reinforces the
  shared/external-artifact code-grounded-review mandate.

- **A new exported function needs a paired selfcheck-PAIRS registration when it's inlined into a Workflow.**
  For the SDD harness, adding an export to a `harness/lib/*.mjs` that `merge.workflow.js` inlines is
  incomplete until its name is added to the `scripts/selfcheck.mjs` PAIRS `fns` array — otherwise the
  byte-compare gate silently doesn't cover it. Bake "register in PAIRS" into any step that adds an inlined
  export, not just steps that edit existing ones.

- **Shipped-skill edit ⇒ omni-twin regen is part of the ship, not a trailing chore.** The plan's Step 6
  bumped `plugin.json`/`CHANGELOG` but omitted `gen-omni.mjs` + the `../omni` twin commit. `selfcheck`'s
  `gen-omni --check` backstops it (would fail), but the plan should state it up front so the developer
  doesn't diagnose a surprise selfcheck failure. Any pass touching `plugins/**` inherits this.

- **A stranded critic (0 tool calls) is recoverable by explicit re-dispatch.** The first critic spawn
  returned in ~3.6s with zero tool uses — the ADR-13 thin-reply shape. Re-dispatching the *same* agent
  (`SendMessage`, keeps its context) with an explicit "read these files, do not acknowledge, return the
  findings as your entire final message" recovered a full 14-tool-call code-grounded review. Cheaper than
  a fresh spawn; matches the Relay-Contract recovery order.

- **Operator-declared metadata rides the existing human-authored channel.** Item 2's chosen fix
  (divergence declared in the crosswalk) also settled item 3 (stale-spec tag) for free — same crosswalk
  value-shape extension, one mechanism, and the `kb-entry-schema` alternative was correctly left untouched.
  When a fix needs human judgment that a human already supplies post-hoc, extend that artifact rather than
  invent a new input or a new agent stage.

- **`node scripts/selfcheck.mjs` is the single decisive done-check probe for the SDD-merge harness.** Its
  five gates collapse three otherwise-manual done-check reads into one command: `spec-diff inline-copy
  sync` proves every lib edit was mirrored into `merge.workflow.js` (the hard inline-sync constraint,
  incl. the new `crosswalkExpectations` PAIR), `bump-plugin --check` proves the Step-6 bump is present,
  and `gen-omni --check` proves the omni twin was regenerated. On this pass all three were green, so the
  done-check reduced to running the four test suites + selfcheck + one grep of the SKILL.md Merge
  paragraph — a code-grounded verdict at low cost. For any future harness pass, lead the done-check with
  selfcheck; a red there localizes the missing step before reading implementation.md line-by-line.

## Reviewer Lessons

- **A plan step that corrects a stale doc-comment in the lib may leave a near-verbatim copy of the
  same stale comment in that lib's test file header — grep for the exact stale phrase repo-wide, not
  just in the file the plan named.** Step 3 corrected `harness/lib/merge-rules.mjs`'s header comment
  (the false "Content-keyed, granularity-tolerant matching" claim) but `tests/unit/merge-rules.test.mjs`
  carries a near-duplicate header comment with the same claim, untouched — the plan only scoped the
  lib file. A repo-wide grep for the exact retired phrase (not just the files the plan named) catches
  this class before it ships as a LOW finding instead of surfacing during the next merge-rules test
  failure.
- **Proving the inline-copy-sync gate is live (not just green) is cheap and worth doing on a harness
  pass.** Deliberately mutating one branch inside `merge.workflow.js`'s inlined function and rerunning
  `node scripts/selfcheck.mjs` confirmed the byte-compare gate actually fails on a real divergence
  (then restoring immediately) — a stronger evidence bar than trusting a green run alone, and fast
  (~2 commands) for a plan whose central invariant IS the inline-copy sync.
- **Reproducing a RED→GREEN transition against the pre-change file (`git show HEAD:{path}`) is fast
  and catches a claimed-but-unverified defect.** Extracting the pre-change lib and running the new
  regression test's input directly against it (no test framework needed, just the exported function)
  confirmed both item-1 and item-4's stated defects reproduced exactly as the plan described, before
  trusting the implementation.md narrative.
- **On a fix-cycle re-review, temporarily reverting just the guard/condition a fix added (not the
  whole file) and rerunning its own new tests is the fastest way to prove they're load-bearing.**
  For Fix Cycle 1's `crosswalkExpectations` empty-decl guard, replacing the one guarded `out.set(...)`
  line with its pre-fix unconditional form and rerunning `tests/unit/rule-crosswalk.test.mjs` showed
  both new regression tests fail for the exact documented reason, before restoring — cheaper than
  reconstructing the pre-fix file from git history (there's no commit boundary mid-fix-cycle to
  `git show` against) and just as decisive.
- **A "behavior-preserving, X and Y are indistinguishable to the consumer" claim in implementation.md
  should be checked by tracing the actual consumer call site, not accepted as asserted prose.** Fix 3
  claimed an empty-decl entry and an absent entry are indistinguishable to `triageRuleSets`; tracing
  `decl = expectations.get(key)` confirmed both yield `undefined`-safe reads via existing optional
  chaining, and further — since the guard makes storage order-independent (empty decls are never
  written regardless of which alias is processed first) — the claim holds by construction, not just
  for the one ordering the new tests happened to cover.

## Developer Lessons

- **`bump-plugin --check` prints a misleading "no behavior-surface changes" line once the bump is already
  applied — trust the exit code, not the prose.** After applying the bump, both `selfcheck`'s bump check
  and a direct `bump-plugin --check` exit 0, but the direct-invocation message read "no plugin
  behavior-surface changes detected … 1 file(s) under docs/, scripts/" despite a dirty SKILL.md + many
  harness files. Exit 0 = satisfied (a bump is present); the diagnostic wording undercounts. Gate on the
  exit code (as selfcheck does), don't read intent into the message.

- **The post-bump `--dry-run` proposing `current+1` is the documented false signal — verify `cur` vs
  committed HEAD before ever bumping twice.** After bumping 1.25.1→1.25.2, `--dry-run` proposed 1.25.3
  because the shipped SKILL.md is still uncommitted vs HEAD (1.25.1). This matches the CLAUDE.md /
  MEMORY "uncommitted bump rides within" rule exactly: the committed HEAD is 1.25.1, current is HEAD+1,
  so the bump is correct — do not chase the phantom 1.25.3. Confirm `committed-HEAD version + 1 ==
  current` and stop.

- **Verbatim inline-mirror: keep in-body `//` comments identical too, even though `selfcheck.normalize`
  strips them.** `merge.workflow.js` inlines lib functions and the `spec-diff inline-copy sync` check
  compares normalized bodies (comment-lines + blanks stripped), so a divergent in-body comment would NOT
  fail the gate. But the plan mandates character-for-character mirroring; copying the comment verbatim is
  cheap, keeps the two files literally identical, and is robust to any future normalize change. When
  adding a NEW inlined function, mirror it WITHOUT its JSDoc (matching the existing inline style — the
  JSDoc sits above `function`, which `extractFn` never reaches), and add its name to the workflow's
  `selfcheck.mjs` PAIRS `fns` array (the architect lesson above, from the developer side).

- **A many-to-one keyed-lookup builder must not store empty/default values — a later empty alias
  overwrites an earlier populated one (Fix Cycle 1, Codex finding 2).** `crosswalkExpectations` folds
  many source aliases into a `Map<canonical, decl>`. Because two aliases can share a canonical, an alias
  carrying no metadata (`{canonical:'X'}` → `decl = {}`) unconditionally `out.set`-ing would clobber a
  sibling's real `{expect:'divergent'}`. Guard: only store a non-empty value (`Object.keys(decl).length
  > 0`). It's behavior-preserving precisely when absent and stored-empty are indistinguishable downstream
  (here both fall through to the boundary hint) — verify that equivalence before adopting the skip, and
  add a same-canonical/empty-second regression test (RED before the guard: the empty overwrites).
