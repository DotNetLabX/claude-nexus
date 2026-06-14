# BugRatioCalculator Adversarial Refutation -- BR-1..BR-28

## 1. Per-rule verdict table

| Rule | Verdict | Evidence / Correction |
|------|---------|----------------------|
| BR-1 | CONFIRMED | IsBug is m.Ticket?.IssueType == "Bug" (no comparer) at :334-335. Null Ticket or IssueType yields false. |
| BR-2 | CONFIRMED | ComputeCompletedBugNonBugSp: bugSp=completed.Where(IsBug).Sum(...), nonBugSp=completed.Where(!IsBug).Sum(...) at :327-329. |
| BR-3 | CONFIRMED | Every completedSp = bugSp+nonBugSp or totalBugSp+totalNonBugSp. See :34,47,75,94,144,160,185,200,265. |
| BR-4 | IMPRECISE | Ternary guard completedSp>0?bugSp/completedSp*100:0m at :35,48,76,95,145,161,186,201 is NOT universal. EvaluateAlert uses if(completedSp==0) break; then unguarded division at :268-271. Correction: guard applies to main outputs only; else branch covers any non-positive completedSp. |
| BR-5 | CONFIRMED | sortedTarget=targetSprints.OrderBy(s=>s.StartDate).ToList() at :20. |
| BR-6 | WRONG | Math.Round(...,1) used in many DTOs (:38-41,51-54,84-87,106-109,215-217,229-232,381) but NOT in single-sprint team cards (BugRatioTeamSingleData) at :164-170, which use raw decimals with format 0.#. |
| BR-7 | CONFIRMED | perSprintTrend stores Math.Round(bugSp,1) and Math.Round(nonBugSp,1) at :39-40. Team totals sum those already-rounded fields at :45-47 -- precision-loss compounding confirmed. |
| BR-8 | CONFIRMED | teamRatio = totalBugSp/totalCompletedSp*100 at :48. Never an average of per-sprint ratios. |
| BR-9 | CONFIRMED | devRatio=devBugSp/devCompletedSp*100 at :95 where devBugSp=sprintBreakdowns.Sum(b=>b.BugSp) at :92. Never an average of per-sprint ratios. |
| BR-10 | CONFIRMED | completed.Count(IsBug) and completed.Count(!IsBug) at :80-81 and :190-191. |
| BR-11 | CONFIRMED | allClosedSprints.OrderByDescending(s=>s.StartDate) at :256. |
| BR-12 | CONFIRMED | if (completedSp == 0) break; at :268-269. |
| BR-13 | IMPRECISE | Guard at :268-269 checks ==0, not >0. Division at :271 safe (non-zero denominator guaranteed). Correction: denominator is guaranteed non-zero, not positive. |
| BR-14 | CONFIRMED | new BugRatioAlertData(consecutiveAbove>=consecutiveCount, consecutiveAbove, threshold) at :282. |
| BR-15 | IMPRECISE | Threshold from settings.BugRatio.AlertThreshold at :101-102,:224-225. Correction: whether allClosedSprints covers the full sprint history is a caller concern not proven in this file. |
| BR-16 | CONFIRMED | Excludes m.RemovedAt!=null and excludedStatuses.Contains(m.FinalStatus, StringComparer.OrdinalIgnoreCase) at :303-304. |
| BR-17 | CONFIRMED | Transitions grouped by TicketId with OrdinalIgnoreCase into a dictionary; missing tickets get [] from GetValueOrDefault at :297-308. |
| BR-18 | CONFIRMED | FilterDevelopers: blank subTeam returns all; else d.SubTeam==subTeam (case-sensitive) at :341-343. |
| BR-19 | CONFIRMED | FilterMemberships: m.Ticket?.Assignee?.SubTeam==subTeam (case-sensitive) when non-blank, then !excludedDeveloperIds.Contains(m.Ticket.AssigneeId) at :352-355. |
| BR-20 | CONFIRMED | GetDeveloperMemberships: m.Ticket?.AssigneeId==developerId and SubTeam check at :365-366. No excludedDeveloperIds parameter on this path. |
| BR-21 | CONFIRMED | Groups by m.Ticket?.IssueType??"Unknown", returns BugRatioIssueTypeData(g.Key,g.Count(),Math.Round(spTotal,1)) at :377,380-381. |
| BR-22 | IMPRECISE | Only sort: .OrderByDescending(e=>e.TicketCount) at :383. No secondary key; tie order is LINQ stable-sort behavior. |
| BR-23 | CONFIRMED | Sprint window = sprint own StartDate/EndDate at :32-33,73-74,142-143,155-156,182-183,197-198,263-264. |
| BR-24 | CONFIRMED | Prior team metrics inside if(priorSprint is not null) at :148-161; deltas=current-prior or null at :165-170. |
| BR-25 | CONFIRMED | Exactly three team cards: Bug Ratio% positive-down, Bug SP positive-down, Non-Bug SP positive-up at :165-170. |
| BR-26 | CONFIRMED | Per-developer delta only when priorSprint is not null at :194; SP/ratio deltas Math.Round(...,1), count deltas integers at :208-219. |
| BR-27 | CONFIRMED | sortedTarget.SelectMany(s=>GetTransitionCompletedMemberships(...)) then BuildIssueTypeBreakdown(...) at :58-63. |
| BR-28 | CONFIRMED | Team paths use FilterMemberships at :30,60,140,154; dev paths use GetDeveloperMemberships at :71,181,196,261. Only team-level accepts excludedDeveloperIds. |

---

## 2. Corrections list

**BR-4 (IMPRECISE):** Ternary guard completedSp>0 applies to main outputs only. EvaluateAlert uses break-on-zero (if(completedSp==0) break at :268-269) then unguarded division at :271. Rule incorrectly implies the guard is universal.

**BR-6 (WRONG):** Single-sprint team cards (BugRatioTeamSingleData) at :164-170 use raw decimal values with format string 0.#, not Math.Round(...,1). Claim that all reported SP/ratio values are rounded to 1dp is false.

**BR-13 (IMPRECISE):** EvaluateAlert guard is ==0 (not >0). Division by zero is prevented, but a negative completedSp (structurally impossible from SP sums but not type-enforced here) would not trigger the break.

**BR-15 (IMPRECISE):** File proves threshold/consecutive-count come from settings and method iterates caller-supplied allClosedSprints list. Does not prove that list is the full sprint history.

**BR-22 (IMPRECISE):** Only descending TicketCount sort at :383. Tie-breaking order is LINQ stable-sort behavior, not an explicit secondary comparison in this file.

---

## 3. High-risk probe results

**Probe a -- BR-8 ratio-of-sums (CONFIRMED)**
totalBugSp=perSprintTrend.Sum(t=>t.BugSp) at :45; totalNonBugSp=.Sum(t=>t.NonBugSp) at :46; totalCompletedSp=totalBugSp+totalNonBugSp at :47; teamRatio=totalBugSp/totalCompletedSp*100 when totalCompletedSp>0 at :48. Developer: devBugSp=sprintBreakdowns.Sum(b=>b.BugSp) at :92; devNonBugSp=.Sum(b=>b.NonBugSp) at :93; devCompletedSp=devBugSp+devNonBugSp at :94; devRatio=devBugSp/devCompletedSp*100 when devCompletedSp>0 at :95. Neither path averages per-sprint ratios.

**Probe b -- BR-7 rounding compounding (CONFIRMED -- precision-loss shape)**
perSprintTrend stores Math.Round(ratioPercent,1), Math.Round(bugSp,1), Math.Round(nonBugSp,1), Math.Round(completedSp,1) at :38-41. Team totals sum those already-rounded fields at :45-47; teamRatio at :48 is computed from summed rounded inputs. Same on developer path: sprint breakdown stores rounded SP at :84-87, devBugSp/devNonBugSp sum those rounded fields at :92-94, devRatio from summed rounded values at :95. Note: totalCompletedSp and devCompletedSp are recomputed as bug+nonbug totals from the rounded sums, not summed from the separately rounded CompletedSp fields.

**Probe c -- Case-sensitivity asymmetry (CONFIRMED)**
Case-SENSITIVE (plain == no comparer): IsBug m.Ticket?.IssueType=="Bug" at :334-335; FilterDevelopers d.SubTeam==subTeam at :343; FilterMemberships m.Ticket?.Assignee?.SubTeam==subTeam at :353; GetDeveloperMemberships m.Ticket?.AssigneeId==developerId and SubTeam==subTeam at :365-366.
Case-INSENSITIVE (explicit OrdinalIgnoreCase): excludedStatuses.Contains(m.FinalStatus, StringComparer.OrdinalIgnoreCase) at :304; TicketId GroupBy and dictionary at :297-298.
Extra nuance: excludedDeveloperIds.Contains(m.Ticket.AssigneeId) at :355 has no comparer argument in this file; case behavior depends on caller-constructed HashSet.

**Probe d -- BR-12/BR-13 streak safety (CONFIRMED)**
completedSp=bugSp+nonBugSp at :265; if(completedSp==0) break at :268-269; var ratio=bugSp/completedSp*100 at :271. Division by zero impossible. Guard is ==0 not >0; negative completedSp (impossible in practice but not structurally enforced here) would not trigger the break.

**Probe e -- startIndex dead variable (CONFIRMED)**
ResolveStartIndex(settings) destructured into (orderedStages, startIndex) at :17 and again at :133. No downstream read of startIndex anywhere else in this file. Later logic uses only orderedStages and endIndex.

---

## 4. Missing rules (encoded in code, absent from BR-1..BR-28)

- **startIndex is a dead variable.** Captured at :17 and :133, never read downstream. No BR rule mentions this.

- **Single-sprint team output omits a Completed SP card.** ComputeSingleSprint builds exactly three cards (Bug Ratio %, Bug SP, Non-Bug SP) at :164-170. Multi-sprint outputs include rounded totalCompletedSp at :50-54. Asymmetry unmentioned in BR-1..BR-28.

- **excludedDeveloperIds does not apply to developer row selection or alert evaluation.** Developer rows start from FilterDevelopers(activeDevelopers,subTeam) at :21 and :131; per-developer membership lookup and alert evaluation use GetDeveloperMemberships(...,developerId,subTeam) at :71,:181,:196,:261 with no excludedDeveloperIds parameter. No BR rule captures this asymmetry.

- **excludedDeveloperIds.Contains comparer is unspecified in this file.** FilterMemberships uses excludedDeveloperIds.Contains(m.Ticket.AssigneeId) at :355 without a StringComparer argument. Case behavior is determined entirely by the caller-constructed HashSet. No BR rule notes this.
