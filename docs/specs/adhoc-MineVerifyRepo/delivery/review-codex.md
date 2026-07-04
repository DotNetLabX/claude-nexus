# mine-verify-repo - Codex Cross-Check

**Verdict:** **NO-GO** - the authored skill mostly mirrors C2-C6, but C1's metric runbook still has correctness gaps and the live repo has not yet closed the acceptance criteria that depend on a versioned ship and the KG pilot (AC-2/4/5/6).

## Contract Check

| Item | Status | Evidence |
|---|---|---|
| C1 | Partially Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:99-117` correctly restates metric-first execution, the bot filter, signal ordering, hotspot filter, free tooling, and honest degrade rules. `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:11-123` supplies the runbook. But `references/metric-layer.md:27-28` points the Code Maat fallback to "Section 5" even though the actual fallback method is at `:85-87`, so the "exact runbook" is not fully reliable. |
| C2 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:121-130` carries the contracted row schema (`id`, `area`, `lens`, `evidence = { reproducible command, excerpt }`, `severity`, `hotspot-priority`, `status`, `disposition`, `last_verified`, provenance) and explicitly demotes non-reproducible judgments to `lens-note`. |
| C3 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:134-147` requires the skeptic to run each evidence command, uses `CONFIRMED / WRONG / IMPRECISE`, includes severity recalibration and the cross-model seam, and logs WRONG findings with refuting output. `SKILL.md:201-206` adds the structural enforcement: verdicts without re-execution output are "dropped by the orchestrator." |
| C4 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:149-161` places the registry at `docs/tech-debt/{area}.md` in the target repo, keeps ADR-43/45 invariants (`last_verified`, no deletes, append-only changelog, idempotent re-runs), defines `by-design` adjudication references, and states the M1-first precondition before M2 composition. |
| C5 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:165-180` makes triage human-only, defines the full disposition set once, and maps refresh outcomes exactly onto the contracted `resolved / still-active / superseded` behavior without introducing extra state. |
| C6 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:184-192` defines hotspot-bounded spend, marginal-budget gating, report-on-halt, and the four prohibitions; `SKILL.md:210-218` preserves C6 as the single authoritative safety floor rather than duplicating it. |
| AC-1 | Partially Met | The skill exists in the required path with the required files (`plugins/nexus/skills/mine-verify-repo/SKILL.md:1-5`; `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:1-9`) and the gate artifact says it passed `evaluate-skill` (`docs/skill-evals/2026-07-04-mine-verify-repo.md:93-99`). But the delivery plan defines "shipped" as Step 3 versioning (`docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:80-86`), and the live plugin versions/changelogs are still pre-feature: `plugins/nexus/.claude-plugin/plugin.json:2-4`, `plugins/nexus/CHANGELOG.md:4-20`, `plugins/nexus-dotnet/.claude-plugin/plugin.json:2-4`, `plugins/nexus-dotnet/CHANGELOG.md:4-10`. |
| AC-2 | Partially Met | The skill text defines a free-tooling, bot-filtered metric path (`plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:34-123`) and requires degraded-signal reporting (`plugins/nexus/skills/mine-verify-repo/SKILL.md:189-190`). But the plan explicitly says AC-2 only lands at the KG pilot (`docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:88-98`), and the eval artifact says "Run artifacts consulted: NONE" / behavior "is first exercised at the KG pilot" (`docs/skill-evals/2026-07-04-mine-verify-repo.md:6-10`). |
| AC-3 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:198-205` is grep-checkable for both bans ("estimating churn, complexity, ownership, or coupling is forbidden"; "re-reasoning without execution is forbidden") and for the required structural enforcement ("dropped by the orchestrator"). |
| AC-4 | Partially Met | The authored method requires the run report to carry WRONG findings with refuting output and the mined->confirmed survival rate (`plugins/nexus/skills/mine-verify-repo/SKILL.md:145-147,189-190`). But `docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:95-98` says AC-4 only lands at Step 4, and there is no live run report artifact in this repo. |
| AC-5 | Partially Met | The method text defines the row grammar and ADR-49 invariants (`plugins/nexus/skills/mine-verify-repo/SKILL.md:121-126,149-161,173-180`). But the plan again says AC-5 is only proven at the pilot (`docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:95-98`), and there is no produced `docs/tech-debt/<area>.md` artifact or unchanged-rerun evidence here. |
| AC-6 | Not Met | The plan marks the KG pilot as "Owner: operator - not executable in-pipeline" and says AC-6 lands only there (`docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:88-98`). The eval artifact confirms the skill has never run (`docs/skill-evals/2026-07-04-mine-verify-repo.md:6-10`). |
| AC-7 | Met | `plugins/nexus/skills/mine-verify-repo/SKILL.md:53-79` structurally defines the four lenses and the global-pass catalog; `SKILL.md:167-179` spells out the disposition enum and refresh protocol in grep-checkable form. |

## Findings

### High

- `docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:88-98`; `docs/skill-evals/2026-07-04-mine-verify-repo.md:6-10`  
  Issue: AC-2, AC-4, AC-5, and AC-6 are still open in the live repo state. The plan explicitly says those criteria "only land at this run," and the shipped eval says no run artifacts were consulted because the behavior has not yet been exercised.  
  Why it matters: the current repo cannot truthfully claim full contract completion yet, even if the authored method text is close.

### Medium

- `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:27-28` and `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:85-87`  
  Issue: the Code Maat-absent preflight points readers to "Section 5" for the git-only fallback, but the actual fallback method is in Section 3 (`:85-87`), while Section 5 is only the signals table.  
  Why it matters: the degraded-tool path is load-bearing in C1; when Code Maat is missing, the runbook sends the operator to the wrong place.

- `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:15-19,69-70`  
  Issue: the runbook instructs readers to generate a redirected `repo.log`, but it omits Code Maat README's Windows-specific requirement to use Git Bash because Code Maat expects Git logs with UNIX line endings.  
  Why it matters: in a Windows/PowerShell environment, the documented path is incomplete; a user can follow the skill literally and still produce input Code Maat may reject or misread.

### Low

- `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md:44-48,57-62`  
  Issue: the Section 2 hotspot command is shown as the raw research command, not as a fully bot-filtered command. The bot filter is only described earlier in Section 1 prose ("Exclude them when generating every log below").  
  Why it matters: a literal copy/paste of the "Hotspot log" code block violates the skill's own "bot filter mandatory first" invariant unless the reader manually composes the two sections.

- `docs/specs/adhoc-MineVerifyRepo/delivery/plan.md:80-86`; `plugins/nexus/.claude-plugin/plugin.json:2-4`; `plugins/nexus/CHANGELOG.md:4-20`; `plugins/nexus-dotnet/.claude-plugin/plugin.json:2-4`; `plugins/nexus-dotnet/CHANGELOG.md:4-10`  
  Issue: Step 3 release/versioning is not landed. The live core plugin is still `1.21.1`, the .NET extension is still `1.3.0`, and neither top changelog contains a `mine-verify-repo` ship entry.  
  Why it matters: by the repo's own delivery plan, the feature is not yet "shipped = versioned."

## Metric Command Verification

I verified the command surface in `plugins/nexus/skills/mine-verify-repo/references/metric-layer.md` against:

- the research doc source of truth: `docs/kb/research/repo-technical-evaluation-for-refactoring.md:31`
- Code Maat's official README: <https://github.com/adamtornhill/code-maat>
- Git's official `git-log` docs: <https://git-scm.com/docs/git-log>
- Lizard's official README: <https://github.com/terryyin/lizard>

I also executed the Git commands in reduced form on this repo: `git shortlog -sne --all`, `git log -M -C --pretty=format:'commit %H %ct' --reverse -p -n 1`, and the one-line filtered `git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' -n 1`. All three parsed and ran successfully here.

| Command (skill/reference location) | Match vs research doc? | Technical validity / notes |
|---|---|---|
| `java -version` (`references/metric-layer.md:16`) | No direct research-doc equivalent. | Valid JVM-presence preflight. |
| `java -jar {path}/code-maat.jar --help` (`references/metric-layer.md:17`) | No direct research-doc equivalent. | Valid Code Maat preflight. The Code Maat CLI usage includes `-h, --help`. |
| `lizard --version` (`references/metric-layer.md:18`) | No direct research-doc equivalent. | Valid lizard preflight. |
| `git shortlog -sne --all` (`references/metric-layer.md:39`) | No direct research-doc equivalent. | Valid Git author-inventory command; it ran successfully in this repo. |
| `git log --perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' ...` (`references/metric-layer.md:47`) | No direct research-doc equivalent; this is an authored addition for bot filtering. | Valid Git syntax. Git's docs say `--author=<pattern>` accepts a regex and `--perl-regexp` enables PCRE; they also note PCRE support is compile-time optional. The full filtered `git log --numstat ...` form ran successfully here. |
| `git log -M -C --pretty=format:'commit %H %ct' --reverse -p` (`references/metric-layer.md:58`) | **Exact match** to the research doc at `docs/kb/research/repo-technical-evaluation-for-refactoring.md:31`. | Valid Git command; it ran successfully in reduced form here. The only caveat is method-level, not syntax-level: to satisfy C1/AC-2 it must be composed with the Section 1 bot filter. |
| Skill: `git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames \` + `--perl-regexp --author='^(?!.*(\[bot\]|dependabot|renovate|autoroll))' > repo.log` (`references/metric-layer.md:69-70`) | **Differs intentionally.** Research doc version is `git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames` (`docs/kb/research/repo-technical-evaluation-for-refactoring.md:31`). The skill adds the bot filter and output redirect. | The Git arguments themselves are correct; the one-line form ran successfully here. This is a legitimate extension of the research-doc command to enforce the skill's bot-filter rule. However, Code Maat's README also says Windows users should use Git Bash because Code Maat expects UNIX line endings in Git logs, and that requirement is omitted from the runbook. |
| `java -jar code-maat.jar -l repo.log -c git2 -a revisions` (`references/metric-layer.md:78`) | No direct research-doc equivalent; the research doc names Code Maat generally, not individual `-a` analyses. | Valid per Code Maat's documented CLI analysis list (`revisions` is listed). |
| `java -jar code-maat.jar -l repo.log -c git2 -a coupling` (`references/metric-layer.md:79`) | No direct research-doc equivalent. | Valid per Code Maat's documented CLI analysis list (`coupling` is listed). |
| `java -jar code-maat.jar -l repo.log -c git2 -a entity-ownership` (`references/metric-layer.md:80`) | No direct research-doc equivalent. | Valid per Code Maat's documented CLI analysis list (`entity-ownership` is listed). |
| `java -jar code-maat.jar -l repo.log -c git2 -a authors` (`references/metric-layer.md:81`) | No direct research-doc equivalent. | Valid per Code Maat's documented CLI analysis list (`authors` is listed). |
| `java -jar code-maat.jar -l repo.log -c git2 -a age` (`references/metric-layer.md:82`) | No direct research-doc equivalent. | Valid per Code Maat's documented CLI analysis list (`age` is listed). |
| `lizard {path} --csv > complexity.csv` (`references/metric-layer.md:92`) | No exact research-doc command. The research doc only says the complexity half needs a separate free tool such as "lizard, cloc, or indentation counts" (`docs/kb/research/repo-technical-evaluation-for-refactoring.md:31`). | Valid per lizard's usage (`lizard [options] [PATH or FILE]`) and `--csv` option. The follow-up note at `references/metric-layer.md:95-96` is technically sound: lizard emits per-function metrics, so file-level aggregation is still required before computing churnxcomplexity. |

### Command-Level Conclusion

- The two research-doc Git commands are carried correctly in spirit: the hotspot command is copied verbatim, and the Code Maat log-generation command keeps the same core shape while adding the bot filter the contract requires.
- The authored Code Maat `-a` commands are technically valid and match Code Maat's documented CLI vocabulary.
- The lizard command is technically valid and consistent with the research doc's "separate free tool" allowance.
- The main technical gap is not the Git/Code Maat/lizard syntax itself; it is the runbook quality around those commands: the wrong fallback section pointer and the missing Windows/Git Bash precondition for Code Maat log generation.
