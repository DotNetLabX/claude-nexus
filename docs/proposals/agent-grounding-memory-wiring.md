# Proposal — Agent grounding & memory wiring: registry discoverability, gateway consultation, consumer-repo grounding contract, flows-harness graduation

**Status:** Ratified — 2026-07-09, Laurentiu (decisions recorded in Unresolved → Resolutions; graduated same day per ## Graduate-to-spec)
**Decision-maker:** Laurentiu
**Recommendation:** Wire the estate's three existing memory layers into the shipped plugin — (1) register `docs/business-rules/` in the navigation/maintenance rules, (2) add an opt-in knowledge-gateway MCP consultation rule (spike-gated), (3) ship a consumer-repo grounding contract for the files agents auto-load — and (4) graduate the golden-flows method into a mine-family skill once the app-repo spike closes. Build no new memory infrastructure.
**Confidence:** High for items 1 and 3 — the gaps are grep-verified (shipped `kb-navigation.md`/`kb-maintenance.md` contain zero references to `docs/business-rules/` while three agent files depend on it; architect/po auto-load three per-repo files that consumer repos lack). Items 2 and 4 are spike-gated within the proposal (gateway consumption pattern unproven; flows determinism spike not yet closed) — they ratify as gated increments, not as open questions.
**Impact:** 8
**Effort:** med
**Date:** 2026-07-09

## Need

Agents in consumer repos start blind to memory that already exists, and each layer is invisible for a different mechanical reason:

1. **Mined rules are undiscoverable.** ADR-45 ratified `docs/business-rules/<area>/<Class>.md` as the canonical rule registry, and the rules-registry proposal (ratified 2026-07-04) named agent guardrails as its first consumer. But the shipped `kb-navigation.md` and `kb-maintenance.md` rules mention only `docs/kb/` — an agent answering "how does the Hungarian solver behave" reads source instead of the 42 verified rules. The only shipped references (attestation drift checks in `architect.md`/`developer.md`/`solo.md`) are forward-conditional on C2 records that don't exist — dead code today.
2. **The company memory is unreachable from code sessions.** The knowledge-gateway (D:\src\knowledge-gateway) is a working runtime memory — pgvector+FTS hybrid RAG over the docs-hub KB plus ~680 meeting notes, exposed via MCP (`search_kb`, `ask`) — but no plugin rule tells an agent it exists or when to consult it.
3. **Consumer repos lack the grounding files agents auto-load.** `architect.md` always loads `docs/architecture/index.md` + `docs/conventions/coding-conventions.md` (and on-demand `docs/product/index.md`); the omnivision SDK has none of them despite a rich doc set, so every session rediscovers the docs. The global KB travels to consumer repos as an untracked manual file copy — byte-identical today, silently stale tomorrow, no sync mechanism in either repo.
4. **The golden-flows method is trapped in one repo.** The app-repo `adhoc-MineVerifyFlows` spike (staged real captures, JSON scrubber, `diffJsonGoldens`, golden blessing + sabotage checks) is the estate's only integration-test miner, and no `mine-verify-flows` skill exists (grep-verified) — the method is not reusable in the SDK or elsewhere.

**Out of scope:** building any new memory infrastructure (embeddings/KG in the plugin — the gateway already exists); registry-as-graph-node-payload attachment (deferred to its own spike by rules-registry Resolution 5); the consumer-repo executions themselves (SDK grounding pass, graph spike, MVC expansion — tracked in the SDK repo's `adhoc-MineCode` roadmap).

## Approach

1. **Registry discoverability (rule edits, ships with the ratified guardrail increment).** `kb-navigation.md`: add `docs/business-rules/<area>/<Class>.md` as a first-class navigation layer — before reading source for a behavior question, check the class's registry. `kb-maintenance.md`: note the registries are their own species (ADR-45) with their own lifecycle — never hand-edit; changes go through re-mine or the post-edit skeptic re-verify. This complements the ratified guardrail consumer (pre-edit context loading) with the discovery half (Q&A navigation); same paths, one release.
2. **Gateway consultation rule (opt-in, spike-gated).** When the knowledge-gateway MCP is connected, domain/product questions consult `ask`/`search_kb` alongside local `docs/kb/`, citing gateway answers. Entry ticket: a short spike — connect the MCP in one working session, measure answer quality vs local grep — before the rule ships. Config-flagged per repo, not always-on.
3. **Consumer-repo grounding contract.** Document the contract a consumer repo must satisfy for instant grounding: `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` as thin indexes over existing docs, plus a tracked (scripted, not manual) KB copy or gateway-only access. Optionally scaffold via a small `ground-repo` skill (scan the repo's doc estate, generate the three indexes) — effort-gated, the documented contract alone already unblocks consumers.
4. **`mine-verify-flows` graduation (after the app spike closes).** Promote the proven method — capture corpus → seed → drive the flow → scrub/canonicalize → golden diff with per-path tolerance → sabotage check — into a mine-family skill with stack adapters: Flutter (`integration_test` harness, exists as spike) and C++ (desktop-CLI harness; toolchain research-verified: ApprovalTests.cpp for the bless workflow + `jd` for per-path float tolerance and order-independent array diffs — see the SDK repo's `docs/kb/research/cpp-golden-master-tooling.md`). **Shipped 2026-07-14** as `mine-verify-flows` (nexus 1.34.0) + `mine-verify-flows-flutter` (nexus-flutter 0.4.0); the C++ adapter remains unbuilt. **Superseded:** this item originally read "the spike's determinism answer (OQ-1) transfers as the tolerance default" — extending the flow into report-stage writes re-opened OQ-1 and produced a two-tier answer (semantic exact-match + class-wide exclusions; tolerance the exception, not the default). The shipped skill encodes the corrected form — see `docs/plugin-feedback/omni-1.25.1-2026-07-12.md` Entries 5/8.
5. **Graph-extraction guidance (one paragraph, likely in nexus-cpp).** For C++ repos, clang-uml (compile_commands.json via Ninja; GraphML + JSON model output; context-radius and path/regex filters that exclude god nodes at extraction time) is the research-verified extraction layer feeding `graphify-out/GRAPH_REPORT.md` — see `docs/kb/research/cpp-code-graph-tooling.md` (SDK repo). CodeQL is licence-barred for private repos; Joern is the zero-build fallback.

## Benefits

- Every consumer repo's agents are grounded on session start — the "Norbert talks to any agent and it already knows" property — without per-repo prompt engineering.
- The mined registries stop being a test-generation by-product nobody reads: discovery (this proposal) + guardrails (ratified) make them the working behavioral contract layer.
- The company memory becomes reachable from code sessions with citations, without duplicating it.
- The golden-flows method becomes reusable estate-wide, and the C++ adapter unblocks the SDK refactoring safety net.
- MVC-expansion target selection (rules-registry Resolution 5: graphify-selected classes) is unblocked by a verified extraction toolchain.

## Alternatives

- **Bake grounding into each consumer repo's CLAUDE.md** — no plugin release needed, but duplicates per repo, drifts, and the plugin already owns the navigation rules; rejected.
- **Index code-repo registries into the gateway and rely on runtime discovery only** — complementary, not sufficient: agents need offline/grep grounding when the gateway is down, and the gateway indexer currently clones only the docs hub (verified), so this is a gateway-side feature either way; carried as Unresolved 1, not as the mechanism.
- **Build a plugin-owned embedding/KG memory layer** (the "ingest 1M documents" architecture) — rejected after inventory: the gateway already provides runtime memory; file-based registries remain the reviewable source of truth; corpus size makes grep competitive.
- **Do nothing** — each newly mined class and each new consumer repo compounds the invisibility; rejected.

## Unresolved → Resolutions (ratified 2026-07-09, Laurentiu)

1. **Should the gateway index code-repo registries** (so `ask` surfaces verified SDK rules) — and via indexer-multi-repo or docs-hub aggregation? Gateway-side decision, belongs on the knowledge-gateway backlog; this proposal only depends on the answer for scope of item 2's citations. **Resolution: unchanged — stays on the gateway backlog; not blocking this slice.**
2. **Gateway rule shape:** always-on-when-connected vs per-repo config flag — the spike decides. **Resolution: unchanged — the spike decides; the spike queues behind the `adhoc-AgentGrounding` slice.**
3. **Grounding contract:** documentation-only vs `ground-repo` scaffold skill — effort call at ratification. **Resolution: documentation + ADR only (ADR-52). The `ground-repo` scaffold is deferred as a named successor; its trigger is a second consumer repo showing onboarding friction.**
4. **KB copy sync:** tracked copy + sync script, gateway-only, or both (author leans both: offline grounding + fresh runtime answers). **Resolution: both — the contract mandates a tracked, script-synced KB copy (offline/grep grounding); the gateway is named as the runtime layer in a clause conditional on the item-2 spike closing.**
5. **Where item 5 lands:** core `kb-navigation.md` (one sentence) vs the nexus-cpp adapter (full recipe). **Resolution: nexus-cpp adapter (`mine-verify-cover-cpp`), a short self-contained recipe beside its target-selection section — architect call disclosed at ratification: a C++ toolchain doesn't belong in core rules shipped to all stacks, and shipped-text self-containment requires the essentials inline, never a pointer to another repo's research entry as sole resolver.**

## Graduate-to-spec

Technical branch. On ratification: items 1+3(+5) become one ad-hoc slice in this repo (rule edits + docs, MINOR bumps per release-plugin); item 2's spike is a cheap probe queued behind it; item 4 graduates to its own tech-spec (skill + two adapters) gated on the app-repo device-day closing. ADR extraction: the consumer-repo grounding contract (item 3) is the one shipped-contract change that warrants an ADR.

**Graduated 2026-07-09:** items 1+3+5, converged with the ratified rules-registry consumer increment (guardrail + review rider — `rules-registry-vertical-slice.md` consumer ordering, queued as `adhoc-RulesRegistry` successor #1) and that slice's deferred merge-harness path rebase → one slice, slug **`adhoc-AgentGrounding`**, tech-spec at `docs/specs/adhoc-AgentGrounding/definition/tech-spec.md`; **ADR-52** extracted to `docs/architecture/README.md`. Item 2's spike queued behind the slice; item 4 graduates separately when the app-repo device-day closes.

## Provenance

Session 2026-07-08/09, omnivision-ai-sdk repo ("mine-code" session, architect persona). Fed by: grep-verified nexus inventory (rules/agents/ADR-45..50, no mine-verify-flows skill); omnishelf-docs inventory (KB source, untracked-copy finding, 24-skill estate); knowledge-gateway inventory (working MCP memory, stale README); the ratified `rules-registry-vertical-slice.md` proposal (guardrail consumer, graphify-selected coverage); research entries `docs/kb/research/cpp-golden-master-tooling.md` and `docs/kb/research/cpp-code-graph-tooling.md` (omnivision SDK repo); `adhoc-MineVerifyFlows` handoff (Flutter app repo).
