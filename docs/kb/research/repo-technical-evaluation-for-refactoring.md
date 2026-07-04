# repo-technical-evaluation-for-refactoring

## What is the best-evidenced way to run a full technical evaluation of a repository (by LLM agents / automated tooling) as the input to refactoring planning — and how reliable are LLM repo audits?

**Verdict:** The best-evidenced input to refactoring planning is git-history-derived code-health analysis, not formal architecture assessment. Relative code churn (Nagappan & Ball 2005), minor-contributor ownership (Bird et al. 2011), and change coupling (Kirbas et al. 2017) all show peer-reviewed relationships with defects, and the entire hotspot pipeline is computable from a plain `git log` with free tooling (Code Maat + documented git commands and thresholds) — provided bot commits, which can dominate churn (74% of hotspot edits in one 91-repo corpus), are filtered first. Formal architecture-evaluation methods (ATAM/SAAM lineage) rest on strikingly thin validation and the one controlled comparison found ATAM outperformed by a lighter alternative. Industrial ATD assessment is largely untooled and prioritization runs on "gut feeling" — a systematic hotspot-weighted triage fills a real methodological vacuum. LLM-audit reliability claims did NOT survive the verification budget (unverified leads below say raw LLM defect findings run ~79–83% false positive and that adversarial refutation + empirical gates + cross-model diversity are what fixes it — treat as leads, not established facts).

**Evidence tier:** deep-research (105-agent fan-out, 114 claims extracted, top-25 adversarially verified 3-vote; 23 confirmed / 2 refuted)

**As-of:** 2026-07-04

**Validity scope:** Defect-prediction metrics validated 2005–2017 on large industrial systems (mostly Microsoft; ownership effects weaken in open source per Foucault et al.); architecture-evaluation evidence 2015–2022 reviews; bot-contamination figure from one Feb 2026 MSR study; nothing verified reflects post-2022 LLM-era tooling.

**Status:** current

**Reconfirm trigger:** Any peer-reviewed study measuring LLM repo-audit false-positive rates (sub-question 3 is unresearched, not settled); or a post-refactor outcome study showing hotspot-targeted refactoring pays off (payoff prediction is currently unproven — only defect-density prediction is).

**Corroboration:** high-stakes findings each verified 3-0 against primary texts: churn (verbatim vs ICSE 2005 abstract, DOI 10.1145/1062455.1062514), ownership (verbatim vs Bird et al. PDF Tables 1–2), practitioner vacuum (verbatim vs ECSA 2020 PDF + independently corroborated by Lenarduzzi SLR JSS 2021, SBES 2023, arXiv 2403.06484), pipeline computability (verbatim vs Code Maat README + MSR 2026 full text).

## Verdict (long form)

**1. Skip formal architecture assessment as the method backbone.** The ATAM/SAAM scenario-based lineage has thin, uneven validation: a 2022 systematic review (Sahlabadi et al., Sensors 22(3):1252, Table 5) counts validating case studies at Lightweight-ATAM = 0, TARA = 1, PBAR/DCAR = 3–6, full ATAM = 6+ — the lightweight variants practitioners would actually use are the least validated [1]. The one direct controlled comparison (EASE 2017, n=16) found ATAM outperformed on outcome quality by a lighter model-driven alternative (QuaDAI) [2]. (Refuted 0-3: "ATAM's six-week cost explains industry non-adoption" — do not reuse that causal story.)

**2. The vacuum is real.** Grounded theory with 18 senior practitioners (Verdecchia, Kruchten, Lago — ECSA 2020): ATD management mostly supported by **no tools**; items tracked in backlogs but prioritized by informal "gut feeling"; academia's ATD detection/measurement concepts absent from practitioner data [3]. Corroborated by Lenarduzzi et al. SLR (JSS 2021: TD prioritization "still preliminary", no consensus, no validated tools).

**3. Build the objective layer on git-history metrics.** Verified predictive signals, strongest first:
- **Minor-contributor ownership** (Bird et al. ESEC/FSE 2011, Windows Vista/7): minor contributors (<5% of a binary's commits) correlated with pre-release failures at Spearman 0.86–0.93 — above size (0.75), churn (0.72), complexity (0.70); adding it raised regression R² from 26%→46% (Vista) and 24%→70% (Win7); survives controls [4]. Weakens in open source (Foucault et al.) — scoped to strong-ownership industrial contexts.
- **Relative (normalized) code churn** (Nagappan & Ball ICSE 2005): absolute churn is a poor predictor; churn normalized by size and temporal extent discriminated fault-prone binaries at 89% accuracy [5]. Cross-project model transfer is poor (Zimmermann et al. 2009) — always calibrate within-repo.
- **Change/temporal coupling** (Kirbas et al. 2017, two industrial systems): significant correlation with defects in 59% of modules; modest and variable (Spearman 0–0.8); in multivariate regression each additional coupling raised defect odds ~8% (OR 1.08) while developer count dominated (OR 2.67) [6]. Real but secondary signal. (Refuted 0-3: "coupling signal strongest in large multi-developer modules, rho=-0.218" — do not carry that refinement.)
- **Composite code-health scores** ("Code Red", Tornhill & Borg TechDebt 2022, 39 codebases / 30,737 files): low-quality files had 15× more defects, +124% resolution time, 9× max cycle times [7]. Medium confidence: single vendor-affiliated study (CodeScene founder, proprietary metric, disclosed COI), correlational, means overstate medians (d=0.45).

**4. The pipeline is free and concrete.** MSR 2026 hotspot method: `git log -M -C --pretty=format:'commit %H %ct' --reverse -p`; hotspot filter = modification count > μ+3σ **AND** >1 change/month of project lifetime (either alone over-fires) [8]. Code Maat (GPLv3, legacy-maintained but functional) computes churn, logical coupling, age, ownership, author counts from `git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames` [9]. The complexity half of churn×complexity needs a separate free tool (lizard, cloc, or indentation counts). **Bot filtering is mandatory first**: bots generated 73.9% of 20,690 hotspot commits from 23 accounts in a 91-repo corpus (skewed by one autoroll bot; pattern-specific — metadata changes 95% bot, stepwise refactoring 100% human) [8].

**5. LLM-audit reliability — UNVERIFIED LEADS ONLY** (sources found and mined, but cut by the top-25 verification budget; treat as leads to re-verify, not established facts):
- Refute-or-Promote (arXiv 2604.19049): adversarial stage-gated pipeline killed ~79% of ~171 LLM defect candidates pre-disclosure; 83% prospective kill rate; **80+ agents including adversarial reviewers unanimously endorsed a nonexistent OpenSSL padding oracle — killed only by a mandatory empirical gate of three concrete test cases**; a cross-model critic killed ~3% of survivors and found errors in 16% of same-family-approved fixes; adversarial agents corrected LLM severity inflation downward in 8 of 9 cases.
- LLM4PFA lineage (arXiv 2601.18844): static-analysis alarms run 76–95% false positive; hybrid static+LLM-agent triage eliminated 94–98% of FPs at 0.75–0.88 recall; CoT prompting was the *weakest* strategy tested.
- Multi-agent verification ablation (arXiv 2511.16708): accuracy 32.8% (1 agent) → 72.4% (4 diverse agents), but even the aggregated verifier had ~50% FPR; agent diversity (ρ=0.05–0.25 between lenses) is the mechanism, and naive consensus-seeking degraded heterogeneous teams by up to 37.6% vs their best member (arXiv 2603.25773: same-family review is structurally circular; spec grounding + model diversity complementary).

**6. Grading/prioritization frameworks: open.** No surviving evidence for or against SQALE, severity/likelihood matrices, or interest-vs-principal models; no practitioner evidence on what separates acted-on audits from shelf-ware. Hotspot-weighted ranking is the defensible default given (2) and (3).

## Sources

1. https://www.mdpi.com/1424-8220/22/3/1252 (Sahlabadi et al., Sensors 2022 — verified via PMC8838159)
2. https://dl.acm.org/doi/10.1145/3084226.3084253 (EASE 2017 QuaDAI vs ATAM replication)
3. https://robertoverdecchia.github.io/papers/ECSA_2020.pdf (Verdecchia, Kruchten, Lago — ECSA 2020)
4. https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bird2011dtm.pdf (Bird et al., ESEC/FSE 2011)
5. https://www.microsoft.com/en-us/research/publication/use-of-relative-code-churn-measures-to-predict-system-defect-density/ (Nagappan & Ball, ICSE 2005)
6. https://onlinelibrary.wiley.com/doi/full/10.1002/smr.1842 (Kirbas et al., JSEP 2017)
7. https://arxiv.org/abs/2203.04374 (Tornhill & Borg, "Code Red", TechDebt 2022)
8. https://arxiv.org/pdf/2602.13170 (MSR 2026 bot-contamination + hotspot method)
9. https://github.com/adamtornhill/code-maat (Code Maat, GPLv3)
10. UNVERIFIED: https://arxiv.org/pdf/2604.19049 (Refute-or-Promote), https://arxiv.org/html/2601.18844v1 (LLM4PFA), https://arxiv.org/pdf/2511.16708 (multi-agent verification ablation), https://arxiv.org/pdf/2603.25773 (correlated-error circularity)

## Open questions

- Measured FP rates / failure modes of LLM repo auditing and which precision strategies help — zero verified claims; the §5 leads need their own verification pass.
- Do formal debt-grading frameworks beat hotspot-weighted ranking? What separates acted-on audits from shelf-ware?
- Do hotspots predict refactoring *payoff* (post-refactor defect/cycle-time improvement), not just pre-refactor defect density?
- Do Microsoft-era ownership results transfer to bot-heavy modern development after bot filtering?

## Provenance

Deep-research workflow run wf_128b6675-975 (2026-07-04, claude-fable-5, 105 agents, ~4.5M tokens): 5 search angles → 23 sources fetched → 114 claims → 25 verified (3-vote adversarial) → 23 confirmed, 2 refuted. Full journal: session dd66811d subagents/workflows/wf_128b6675-975/journal.jsonl. Commissioned for the "technical mine" (full-repo technical evaluation → refactoring backlog) proposal exploration.
