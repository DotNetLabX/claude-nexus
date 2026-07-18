# Market scan: improvement-loop harnesses & code/rule-mining systems — July 2026

**Date:** 2026-07-17 · **Author:** architect session (Fable 5) · **Companion doc:**
[`2026-07-17-mine-family-vs-vwh-fresh-eval.md`](2026-07-17-mine-family-vs-vwh-fresh-eval.md)
(neither informed the other — they ran in parallel).

**Method.** The built-in `/deep-research` harness (user-directed: opus research subagents): 5 search
angles → 24 sources fetched → 120 falsifiable claims extracted → 25 adversarially verified by
3-vote refutation panels → **21 confirmed, 4 refuted, 0 unverified**. 106 subagent calls total.
Every finding below survived a 3-0 or 2-1 verification vote; refuted claims are listed in §6 so
they don't re-enter circulation.

## 1. Verdict

**The market converged on exactly one design lesson, and both of our systems already embody it:
systems with credible published results couple LLM generation to *mechanical* verification gates;
prompt-level checks don't survive contact with scale.** The verified evidence spans Meta (ACH
mutation gating in production), OpenAI (MLE-bench's mechanically-owned held-out splits), Meta FAIR
(AIRA's measured validation-overfitting gap), RUC/Microsoft (Arbor's objective-value merge gate),
and IBM (compile-and-build-gated mainframe modernization).

Two sharper takeaways for us:
- **The field's single most-measured failure mode — validation-signal overfitting (a 9–13pp oracle
  gap that worsens over long runs) — is precisely what VWH's firewall + sequestered tier exists to
  prevent.** The market independently proves that mechanism is load-bearing, not paranoia.
- **Meta's ACH is the strongest industrial validation of the mine-verify-cover pattern** (generated
  tests earn trust only by mechanically killing mutants): 73% engineer acceptance across
  Facebook/Instagram/WhatsApp at 10,795-class scale. Notably, **no mature OSS equivalent survived
  verification** — the open question list has "is there an open ACH?" unanswered, which positions
  mine-verify-cover ahead of the verified OSS market on its own tile.

## 2. Axis 1 — autonomous improvement-loop harnesses (VWH's tile)

| System | What it is | Enforcement | Evidence (verified) |
|---|---|---|---|
| **AIDE** (weco, OSS) | The reference implementation: metric-gated tree search over candidate scripts | Mechanical search gating (pure Python metric comparisons); LLM-mediated metric *extraction* | MIT, ~1.4k stars, adopted as MLE-bench's strongest baseline; documented metric-hacking incident (fake 97% via lookup table, 0% held-out) |
| **AIRA** (Meta FAIR, NeurIPS 2025) | AIDE-lineage agents on MLE-bench lite | Held-out benchmark scoring | Raised SOTA 39.6%→47.7%; **operator set, not search policy, is the bottleneck** (+5.7pp from operators alone vs +1.5pp from MCTS/evolutionary search); scoped memory: sibling memories for draft/improve, ancestral for debug |
| **AI Scientist-v2** (Sakana) | Staged agentic tree search (4 phases with explicit stopping criteria), experiment-manager agent | Mixed by design: interpreter errors + replication/aggregation *node types* are mechanical; figure critique + node selection are LLM judges | One AI-generated paper scored 6.33/10 at an ICLR 2025 workshop (top ~45%, then withdrawn by arrangement); external critiques target the prompt-level gates' effectiveness |
| **MLE-bench** (OpenAI) | The held-out evaluation standard (75 Kaggle competitions) | **Benchmark owns the split and the grader** — re-split held-out sets, per-competition grading scripts; agent never touches labels | The "9–13pp oracle gap" finding: selecting by test instead of validation score would raise medal rates 9–13pp — validation overfitting is measured, systematic, and worsens over 90-hour runs |
| **Arbor** (RUC + MSR, June 2026) | Hypothesis-tree refinement: long-lived coordinator owns a persistent tree; short-lived executors test one hypothesis each in isolated git worktrees | **Mechanical merge gate**: candidate merges only if it beats current best on a held-out set in a fresh worktree (objective-value comparison, not prompt) | Claims best held-out result on all 6 real research tasks, >2.5× the relative gain of Codex (GPT-5.5) and Claude Code (Opus 4.6) baselines — **medium confidence**: self-reported living tech report, no independent replication yet |

**Refuted along the way (0–3 votes):** AIDE "4× more medals than OpenHands"; MLE-bench shipping
rule-violation/plagiarism detectors; both ML-Master 2.0 leaderboard claims (56.44%, #1 rank) — the
current MLE-bench leaderboard state is *not* established by this scan.

## 3. Axis 2 — code/rule mining & verification (the mine family's tile)

| System | What it is | Enforcement | Evidence (verified) |
|---|---|---|---|
| **COBRAIN** (IIT Tirupati, EASE 2025, peer-reviewed) | Few-shot LLM extraction of business rules from legacy COBOL | LLM extraction benchmarked vs static mining (COBREX's control-flow-graph approach) | **F1 0.73 vs 0.59 on ground truth** — LLM beats static mining; but ~¼ of rules still missed/wrong, which is direct peer-reviewed motivation for a skeptic/verify pass after mining. Caveat: authors overlap with the baseline's authors |
| **IBM watsonx Code Assistant for Z 2.8** (GA Feb 2026) | Flagship commercial rule-mining: Business Rule Discovery for large Z/COBOL programs | **Code-aware segmentation** (not generic chunking); agents grounded in a static-analysis metadata layer (Z Understand); compile-and-build verification; MCP-based agent orchestration | Medium confidence — vendor "designed to" phrasing, 2-1 split votes on two claims; independent partner review calls it "a highly promising vision rather than a daily guarantee" |
| **Meta ACH** (FSE 2025 Industry Track, peer-reviewed) | Mutation-gated LLM test generation in production | **Kill verification is execution-based**: tests must build, pass ×2 on original code, and kill mutants no existing test catches; only equivalent-mutant filtering is LLM-judged (precision 0.79 / recall 0.47) | Oct–Dec 2024 trial: 10,795 Kotlin classes, 9,095 mutants, 571 privacy tests, **73% engineer acceptance**, 36% judged privacy-relevant |

## 4. What the market validates about our estate

1. **VWH's firewall thesis is now market-measured.** AIRA quantified what happens without a
   mechanically-owned holdout (9–13pp oracle gap, worsening with run length); AIDE's metric-hacking
   incident shows mechanical gates need honest held-out data *behind* them. VWH's
   audit-hook firewall + FIREWALLED test tier + close-time-only scoring is the strongest version of
   this mechanism found anywhere in the scan — including the published academic systems.
2. **The mine family's Mine→Verify shape is peer-review-motivated.** COBRAIN proves LLM mining beats
   static mining *and* that raw LLM extraction leaves ~27% wrong/missing — exactly the gap the
   skeptic pass exists to close. No published system in the scan runs an evidence-re-executing
   skeptic over mined rules; the mine family's verify tier has no verified market counterpart.
3. **mine-verify-cover ≈ ACH, independently invented.** Same core invariant (a generated test earns
   trust only by mechanically killing mutants). ACH adds production-scale human-acceptance data;
   mine-verify-cover adds the registry/KB layer and cross-stack adapters ACH doesn't publish.
4. **The orchestration-framework space is evidentially empty.** Zero claims about LangGraph /
   AutoGen / CrewAI / OpenAI Agents SDK / claude-flow shipping mechanical verification machinery
   survived. Verification in that ecosystem is the application's responsibility — which is what
   both of our systems supply, and a reason not to expect a framework migration to buy anything.

## 5. Borrowable ideas (market → us), ranked

### For VWH
| # | Idea | Source | Why |
|---|------|--------|-----|
| W1 | **Insight backpropagation on the hypothesis tree** — each node binds ⟨falsifiable hypothesis, *reusable insight*, link to executable evidence⟩; executor evidence backpropagates up the tree | Arbor | VWH's DAG nodes carry levers and outcomes; a first-class *insight* field that propagates would mechanize what EXPERIENCE.md does in prose — and dovetails with the verified-memory borrow (V2 in the companion doc) |
| W2 | **Scoped memory per operator type** — sibling memory for draft/improve (diversity), ancestral memory for debug (anti-oscillation) | AIRA | Directly applicable to VWH's experiment-agent context assembly; cheap prompt-plumbing change |
| W3 | **Operators before search sophistication** — the measured bottleneck is operator/prompt quality, not DAG policy | AIRA | Strategic guidance: VWH's next quality dollar goes to its build/debug operator prompts, not to fancier EV ranking |
| W4 | **Replication/aggregation node types** — statistical rigor encoded as node types in the search structure, not as instructions | AI Scientist-v2 | VWH has variance-aware certify; making multi-seed replication a *node type* would let the DAG itself demand rigor |
| W5 | **Isolated git-worktree executors** | Arbor | Complements VWH's branch-agnostic commits for future multi-worker campaigns |
| — | *Anti-lesson:* adaptive test-set reuse — Arbor re-selects against its holdout every iteration | Arbor caveat | VWH's sequestered-tier / score-only-at-close discipline is already stricter; don't relax it toward Arbor's shape |

### For the mine family
| # | Idea | Source | Why |
|---|------|--------|-----|
| N1 | **A recall ground-truth benchmark** — a small curated golden set of known rules for one class/repo, F1-scored per run | COBRAIN's evaluation design | Directly attacks the family's #4 import gap ("recall is unmeasured everywhere"); the market grades miners on F1, the family currently can't state one |
| N2 | **Code-aware segmentation for large units** — segment by program structure before mining, not by token windows | IBM WCA4Z | mine-verify-cover targets one class; repo/flows miners hitting large units would benefit from structure-aware chunking as a stated protocol |
| N3 | **Equivalent-mutant filtering as a scored, disclosed sub-judgment** (ACH publishes precision 0.79 / recall 0.47 for its LLM filter) | Meta ACH | The family's survivor classification does this job; publishing its own precision/recall against adjudicated survivors would harden the `equivalent` tag from judgment to measured judgment |
| N4 | **Static-analysis metadata substrate under mining agents** | IBM WCA4Z | Validates the existing graphify/metric-layer design of mine-verify-repo; extendable to mine-verify-cover (dependency context for miners) |
| N5 | **Human-acceptance telemetry** — ACH's 73%-acceptance figure is its most persuasive artifact | Meta ACH | The family records gate outcomes but not operator acceptance of registry rows/tests over time; a tiny acceptance ledger would produce the same class of evidence |

## 6. Refuted claims (do not cite)

| Refuted claim | Vote |
|---|---|
| AIDE won 4× more medals than OpenHands on MLE-bench | 0–3 |
| MLE-bench ships rule-violation and plagiarism detectors | 0–3 |
| ML-Master 2.0 ranks #1 on MLE-bench at 56.44% overall | 0–3 |
| ML-Master 2.0 outperforms Leeroo (50.67%) and Thesis (48.44%) | 0–3 |

## 7. Coverage gaps and open questions (carried from the harness)

**Not covered by any surviving claim** (unverified ≠ nonexistent): OpenHands and Devin-class
workers; spec mining beyond COBOL business rules; technical-debt mining tools; OSS
characterization/approval-test generators (Diffblue and qodo-cover were fetched but produced no
surviving claims); all general orchestration frameworks.

**Open questions worth a follow-up dive:**
1. Actual MLE-bench SOTA as of July 2026 (AIRA2's Hidden Consistent Evaluation — does it close the
   9–13pp gap in a way that transfers outside Kaggle?).
2. Do any orchestration frameworks ship mechanical verification, or is it always app-side?
3. Is there a mature OSS ACH equivalent, and its kill/acceptance rates on non-Kotlin legacy code?
4. Do COBOL rule-mining results (COBRAIN, IBM BRD) generalize to VB6 / old Java/C# / PL/SQL, and
   does code-aware segmentation hold without a Z-Understand-class substrate?

**Time-sensitivity:** AIRA's 47.7% was SOTA at publication (July 2025); AIRA2 (March 2026) has
already pushed higher; Arbor is one month old. Treat all figures as a July 2026 snapshot.

## 8. Source register (fetched: 24; shown: claim-bearing primaries)

arxiv 2507.02554 (AIRA) · github wecoai/aideml + arxiv 2502.13138 (AIDE) · arxiv 2504.08066 +
github SakanaAI/AI-Scientist-v2 · github openai/mle-bench + arxiv 2410.07095 · arxiv 2606.11926 +
github RUC-NLPIR/Arbor · ACM 10.1145/3756681.3756982 (COBRAIN, EASE 2025) · ibm.com WCA4Z 2.8
announcement + CROZ partner review · engineering.fb.com ACH post + arxiv 2501.12862 (FSE 2025) ·
skeptical-angle sources: cursor.com reward-hacking post, arxiv 2603.11337, arxiv 2511.21654,
rdi.berkeley.edu trustworthy-benchmarks.
