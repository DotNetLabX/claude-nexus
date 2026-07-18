# Skill-gap registry — knowledge-gateway (F10 Tier-B golden fixture)

**Fixture run of `mine-skill-gaps` (Follow-by-Read, plan D2)** over
`d:\src\knowledge-gateway\docs\specs\` on 2026-07-18. Discovery only — the owner triages
`candidate → confirmed`; nothing here is auto-routed. This is a **fixture copy** produced under
F10 delivery; the real consumer-repo path would be `docs/skill-gaps/registry.md` inside
knowledge-gateway (D1 — KG is read-only input to this run).

**Estate swept:** 77 plan.md (recursive, incl. nested epic/issue paths); 73 carry a skill-mapping
table. **`(none)` rows extracted:** ~333 (318 via the `Step | Skill | … | Gap?` format + 15 via
the pre-standardization `Step | Disposition | …` format in F19/F20/F21 — see Run report).
**Tier-B threshold:** a cluster enters only at 3 or more plans. **Verify:** a fresh-context
`general-purpose` skeptic re-read each cluster's cited rows (CONFIRMED / WRONG / IMPRECISE); every
ranked row carries its re-read excerpt. Zero WRONG verdicts; four IMPRECISE boundary corrections
folded (noted per row).

## Candidate skills (ranked by recurrence — plan count first, row count tiebreak)

| name | kind | recurrence | citations (slug + step) | repo | skeptic excerpt | last_verified | status |
|------|------|-----------|-------------------------|------|-----------------|---------------|--------|
| `orchestrator-agent-loop-wiring` | gap | 14 plans / ~28 rows | F43 s2–4; F45 s2,3,4,6; F48 s2–4; F59 s2–4; F55 s6; F56 s4; F19 s3; F20 s2; adhoc-AgentDeclaredSources s4; adhoc-SourcesMatchAnswer s4; adhoc-WebAnswerHygiene s2; adhoc-WebChatAnswerReview/{always-table-and-chart s3/s5, answer-correctness s2, answer-self-improvement s5} | knowledge-gateway | CONFIRMED (IMPRECISE→folded: dropped F45 s5, a wire-contract step → C4). Self-nomination verbatim, F43 s2 Gap cell: "Recurring \"orchestrator decorator/state\" None (F42/F45/F48) → candidate project skill"; F48 s2: "Log: recurring \"orchestrator decorator/state\" None across F42/F45/F48 → candidate project skill" | 2026-07-18 | candidate |
| `prompt-content-steering` | gap | 15 plans / ~20 rows | adhoc-AnswerQualityPrompt s1–5; adhoc-AgentDeclaredSources s5; adhoc-WebAnswerHygiene s1; F19 s2; F22 s5; F23 s5; F25 s2–3; F26 s2; F28 s5; F34 s2; F48 s7; F58 s1; F59 s1; adhoc-WebChatAnswerReview/{answer-correctness s1/s3, context-caching s4} | knowledge-gateway | CONFIRMED — "All 5 citations are genuine prompt/brief/judge-prompt work … No coincidental members found." F59 s1 Gap cell: "no prompt-revision skill (same gap F58 Step 1 logged)" | 2026-07-18 | candidate |
| `raw-npgsql-persistence` | gap | 13 plans / ~20 rows | F17 s1–3; F21 s3; F24 s1; F31 s1–3; F33 s1; F41 A1; F43 s5; F50 s3; F51 s3; F56 s3; F63 s1; F64 s3; F7-DataPoolConnection s5 | knowledge-gateway | CONFIRMED — "Every cited row is genuine raw-Npgsql/non-EF persistence work." Self-nomination verbatim, F50 s3: "raw-Npgsql repository is a recurring None (F17/F21/F50) → candidate project skill"; F51 s3: "Recurring raw-Npgsql None (F17/F21/F50/F51) → candidate project skill" | 2026-07-18 | candidate |
| `additive-wire-contract-sse-frame` | gap | 9 plans / ~13 rows | adhoc-WebChatAnswerReview/always-table-and-chart s1/s2; F20 s1; F22 s1; F23 s1–3; F28 s2; F41 B1; F43 s3; F45 s5; F58 s4 | knowledge-gateway | CONFIRMED — "exact matches (new AskEventKind/payload + SseEventDto/DTO mirror + types.ts)." F45 s5 rehomed here from C1 per the skeptic. | 2026-07-18 | candidate |
| `cost-audit-additive-jsonl-fields` | gap | 7 plans / ~8 rows | adhoc-WebChatAnswerReview/cost-caching s5; F43 s4; F45 s8; F48 s8; F49 s6; F59 s5; F64 s8 | knowledge-gateway | IMPRECISE→folded: "cite cost-caching step 5 [the JSONL CostAuditRecord sink], not step 4 [upstream AskTurnMetrics only]." F59 s5 Gap cell: "additive-JSONL pattern lives in CostAuditSink.cs precedent, no skill" | 2026-07-18 | candidate |
| `vectordata-records-collections-tests` | gap | 3 plans / ~6 rows | F2-KbVectorPool s2,3,5; F3-KbIndexer s4,8; F4-KnowledgeRouter s4 | knowledge-gateway | IMPRECISE→folded: "drop F2 step 4 [plain docker-compose infra → C9]." Named family, F4 s4: "extends the recurring vectordata-* gap family (F2 lesson #1)" | 2026-07-18 | candidate |
| `mcp-server-tool-authoring` | gap | 3 plans / ~4 rows | adhoc-DataPointProfiles s2; F5-GatewayMcpApi s5; F74-NotesMcpRetrieval s1,2 | knowledge-gateway | IMPRECISE→folded: "drop F6 step 6 — it's an MCP client round-trip test, a sibling cluster (`mcp-client-roundtrip-test`), not tool authoring." F5 s5 self-names "mcp-server-tool" | 2026-07-18 | candidate |

## Additional clusters at threshold — observed, NOT skeptic-verified this run

Per the skill's rule that a ranked row must carry a skeptic re-read excerpt, these clusters clear
the 3-plan bar on their own self-nomination text but were not sent through the fresh-context
skeptic in this fixture run. They are logged as leads for a follow-up verification pass, not as
verified candidates.

| name | recurrence | citations | note |
|------|-----------|-----------|------|
| `fastendpoints-direct-web-endpoint` | 6 plans | F19 s4/s5; F20 s4; F24 s5; F25 s4; F36 s2; F41 A2 | Self-referencing "FastEndpoints-direct web idiom (no CQRS on the web surface; F19/F25/F36 precedent)" |
| `postgres-seed-and-docker-infra` | 3 plans | F2 s4; F7-DataPoolConnection s1/s2; F8 s3 | The `docker-compose`/postgres-seed cluster F2 s4 was split out of C6 into here by the skeptic |
| `container-build-deploy-ci-authoring` | 3 plans | F47 s1/s4/s5; F53 s1/s2; F7-DataPoolConnection s7 | Dockerfile/GHCR/GitHub-Actions/az-provisioning authoring |

## Capture leaks

None. (A capture-leak is an orphan `gap:` cell with no matching lessons entry. The KG estate
predates the fielded `## Skill Gaps` lessons vocabulary, so its gap signal lives in plan
skill-mapping `Gap?` cells that the clusters above already consume — there is no fielded-entry vs
cell mismatch to surface here. The Tier-A fixture, `nexus-registry.md`, is where the
fielded-entry / `gap:`-cell corroboration rule is exercised.)

## Run report

- **Estate:** `d:\src\knowledge-gateway\docs\specs\` — 77 plan.md (recursive); 73 with a
  skill-mapping table; ~333 `(none)` rows.
- **Extraction:** deterministic PowerShell parse (D3 latitude — model-tier clustering, mechanical
  row extraction). **Parser-tolerance finding:** the strict `^Skill$`-header parser under-extracts
  the pre-standardization `Step | Disposition | TDD | Confidence` table format (F19/F20/F21), where
  the `None` disposition lives in a *Disposition* column with no separate *Skill* column. Those 3
  plans (15 rows) were recovered by a second tolerant pass and folded — this is exactly the
  "tolerant of pre-standardization estates" posture the skill's Parser-posture section calls for,
  and it recurs as a developer lesson.
- **Clustering:** model-tier task-shape grouping over the extracted rows.
- **Verify:** one fresh-context `general-purpose` skeptic (synchronous), read-only over KG. Verdicts:
  3 CONFIRMED, 4 IMPRECISE (all boundary-precision corrections, folded above), 0 WRONG. Both
  author-named clusters (`orchestrator-agent-loop-wiring`, `raw-npgsql-persistence`) re-found and
  their self-nominations verbatim-confirmed. Citation spot-checks: 5 run (F43 s2, F51 s3, F22 s1,
  F74 s1 PASS; F6 s6 skill-cell PASS / task-shape FAIL — drove C7's correction). No cited plan.md
  or step failed to resolve across ~20 files opened.
- **Acceptance vs the tech-spec Tier-B gate:** the two author-named clusters re-found **by name**
  (met); 7 skeptic-verified clusters at the 3+ threshold, far exceeding the ≥4 bar (met); ≥3
  citation spot-checks against cited plans (5 run, met).
- **Skeptic under-citation note (recorded, not padded):** the skeptic observed F21-DeployReadiness
  is in the raw-Npgsql self-nomination chain; F21 s3 is now cited in C2 after the tolerant re-parse.
  F42 is named in C1's self-nomination but was not independently extracted (no F42 plan.md row in
  this estate) — it is referenced, not counted, per the no-fabricated-row rule.

## Changelog (append-only)

- 2026-07-18 — Initial fixture run. 7 candidate clusters verified + 3 observed-unverified; 0 capture
  leaks. Skeptic verdicts folded (C1 F45-s5 drop, C5 cost-caching-s5, C6 F2-s4 drop, C7 F6-s6 drop).
