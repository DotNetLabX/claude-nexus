# mine-verify-repo — Lessons

## Developer Lessons
- **`bump-plugin.mjs --minor/--major` is a GLOBAL override, not per-plugin.** When one feature touches
  two plugins that warrant different tiers (here: nexus MINOR for the new skill, nexus-dotnet PATCH for
  a cross-ref note), a single flagged run bumps *both* to the flag's tier (bump-plugin.mjs lines 40,
  165–173). There is no per-plugin tier flag. Getting a split tier needs either two `--staged`-scoped
  passes (with an inter-pass unstage — a git write) or a tool-default run + a hand-escalation of the
  one plugin. Surfaced as Q1 for the architect. (Evidence: [adhoc-MineVerifyRepo])
- **`evaluate-skill` on a shipped skill assumes the consuming-project channel** (route findings to
  `docs/plugin-feedback/`, never edit the version-keyed cache). In the *plugin dev repo* (this repo)
  the SKILL.md is the editable source of truth, so the plan's "fix findings before proceeding" is
  correct and overrides that assumption — the fix-in-place channel applies here. Worth noting when
  following evaluate-skill on a not-yet-shipped skill during authoring. (Evidence: [adhoc-MineVerifyRepo])
- **skill-lint E7 forbids angle-bracket tokens in SKILL.md prose — path templates like
  `docs/tech-debt/<area>.md` trip it.** Write such paths with `{area}` placeholders or keep them
  inside backticks/fenced blocks (both are E7-exempt). The lint only reads `SKILL.md` (not
  `references/*.md`), but keeping the runbook clean too is cheap. Greek/math glyphs (μ σ × ∩) are fine
  — E8 only flags U+FFFD / cp1252-mojibake, and the Write tool emits BOM-less UTF-8. (Evidence: [adhoc-MineVerifyRepo])
- **A transcribed tech-spec contract (`C6 — Cost & safety rails`) + a plan-requested `## Safety rails`
  section = a built-in Layer-2.1 duplication.** When the plan's target structure names a section that
  a contract already fully covers, make the section a pointer to the contract, not a second
  specification — evaluate-skill flagged the verbatim restatement (F1). Anticipate this whenever a
  method skill both transcribes numbered contracts AND mirrors a sibling skill's prose section layout.
  (Evidence: [adhoc-MineVerifyRepo])
- **A stated invariant ("every log below is bot-filtered") needs a per-command check, not a
  paragraph-level trust.** Fix Cycle 1 caught that Section 2's command silently dropped the bot filter
  Section 1 promised for "every log below" while Section 3 (right next to it) correctly carried it —
  an easy same-file drift when one command is added after the others without diffing it against the
  sibling command it should match. When a runbook states "X applies to every command in this doc,"
  grep every command block for the X clause before calling the doc done, don't rely on having applied
  it once nearby and trusting the rest follow. (Evidence: [adhoc-MineVerifyRepo])
- **Windows-hosted pilot targets need an explicit line-ending note for any tool piping through a
  redirected `git log`.** Code Maat (and likely other JVM/line-oriented consumers) expects LF; a
  PowerShell/cmd `>` redirect can silently emit CRLF. When a runbook's target repo is known to be
  Windows (stated in the plan/tech-spec), add the Git-Bash-or-LF note at authoring time rather than
  waiting for review to catch it — it's a one-line addition once the host OS is known.
  (Evidence: [adhoc-MineVerifyRepo])

## Architect Lessons
- **A method-text slice with all-documented terminal steps still passes the done-check via the log,
  not the self-report.** Steps 3 (release) and 4 (KG pilot) were plan-sanctioned "documented, not
  executed" (Q1 owner-reassignment + operator-owed) — correctly `Deviated (valid reason)`, never
  `Missing`. The load-bearing gate for the ONE executed skill (Step 1 `evaluate-skill`) was the
  `skill-invocations.log` entry under the developer-run token, not `## Skills Used` prose. Scope the
  log by `token=developer:implement` (the implement-phase token), not the current `architect:donecheck`
  phase token. (Evidence: [adhoc-MineVerifyRepo])
- **AC-3/AC-7 were written as grep-checkable acceptance, and that made the done-check deterministic.**
  Because the plan phrased the binding LLM-prompt obligations as literal terms (`forbidden`, `dropped
  by the orchestrator`) and the AC-7 structural terms as an enumerable set (four lens names + the
  disposition enum verbatim), verifying Step 1 was `grep -n` + confirm, not read-and-judge. Worth
  carrying forward: when a slice ships method text whose only pre-ship check is a grep (AC-7's own
  note says so), the acceptance lines must name the exact tokens. (Evidence: [adhoc-MineVerifyRepo])
- **On a technical-branch slice, the tech-spec's AC list + the ADR register are the done-check's
  spec-equivalent.** No `spec.md` exists (ADR-27 technical branch); the `Satisfies:` referents
  (AC-1..7, ADR-46) resolved against `definition/tech-spec.md` and the ADR register — existence-
  validated, not a gate. The done-check maps plan steps ↔ ADR/AC acceptance, exactly as the ad-hoc
  lane prescribes. (Evidence: [adhoc-MineVerifyRepo])

## Reviewer Lessons
- **A runbook's own internal "applies to every X below" claim needs checking against every literal
  example, not just spot-checked.** `metric-layer.md` Section 1 states the bot-author filter applies
  "when generating every log below"; Section 3's shown command correctly includes it, but Section 2's
  shown command (the MSR hotspot-log command, cited verbatim from the research doc) does not — yet the
  prose right after it claims the count is over "the bot-filtered history." A must-reproduce,
  copy-paste-literal runbook (this family's whole ethos: "never estimate, run the exact thing") needs
  every shown command checked against its own stated universal claims, not just the ones a reader's eye
  naturally lands on. `evaluate-skill`'s Layer 2.4 ("followable cold: exact commands") signed this off
  as clean and missed it too — a reminder that a rubric layer's clean bill on "commands are exact" does
  not mean "commands are internally consistent with each other." (Evidence: [adhoc-MineVerifyRepo])
- **Verbatim-cited commands (from a research source) can carry the citation's own scope, not the
  citing skill's added obligations.** The Section 2 command is verified verbatim against the MSR 2026
  paper's own hotspot-log method — the paper's raw command doesn't parameterize an author filter
  either. The developer's own bot-filter mandate (Section 1) is a layer ADDED on top of the cited
  command, and that addition needs to be reflected in every place the cited command is shown, not just
  assumed to travel with the citation. Worth flagging as a specific check whenever a runbook step is
  "verified verbatim against a primary source" — verbatim-to-source and complete-per-this-skill's-own-
  rules are two different properties. (Evidence: [adhoc-MineVerifyRepo])
- **Codex caught two MEDIUMs a same-file, same-read reviewer pass missed: a stale cross-reference
  ("Section 5" instead of "Section 3") and a platform precondition (Windows/Git-Bash CRLF vs Code
  Maat's LF expectation).** Both were sitting in the exact file (`metric-layer.md`) I'd already read in
  full for the HIGH finding — a cross-model second pass still found things a single-model close read
  didn't. Worth internalizing: internal-consistency bugs (dangling section pointers) and
  platform/environment preconditions (line-ending mismatches) are a different failure class from the
  "does this command do what its neighboring prose claims" check that caught the HIGH — worth a
  deliberate separate pass for each, not just one close read. (Evidence: [adhoc-MineVerifyRepo])
- **Re-review verification is cheap when the fix is additive and file-scoped.** All 3 cycle-1 fixes
  landed in one file (`metric-layer.md`, 124→135 lines); verifying "genuinely fixed, no regression" took
  a live-source read of the changed sections + a full-file grep for the stale pointer + a fresh
  `skill-lint` rerun + a line-count/scope check (`SKILL.md` untouched, no other tracked file diffed) —
  no need to re-read the whole review or implementation.md history. (Evidence: [adhoc-MineVerifyRepo])
