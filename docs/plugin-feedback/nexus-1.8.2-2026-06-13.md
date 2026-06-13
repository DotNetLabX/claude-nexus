# nexus plugin feedback — v1.8.2 / 2026-06-13

Items classified as plugin-bound by the learner after the adhoc-ConfidenceGatedResearch pipeline.
Apply in the nexus source repo against the version noted above (or nearest forward version).

---

## Pipeline-gate false-positive on reviewer confidence fields and no-blocker summaries

- **Suggested target:** `plugins/nexus/hooks/scripts/pipeline-gate.js` → `approvedWithOpenHighSev` function (`:111`); specifically the `LEGEND` pattern at `:120` and the scan loop at `:123–130`
- **Action:** update
- **Evidence:** adhoc-PipelineGatesHardening (reviewer lessons L115–116), adhoc-VwhSelfcheckAndPrinciple (reviewer lessons L104 + improvement proposal), adhoc-DotnetSkillSweep (reviewer lessons L212 + improvement proposal), adhoc-ConfidenceGatedResearch (reviewer lessons) — 4 occurrences across 4 features
- **Lesson:** The `\b(CRITICAL|HIGH)\b` regex at `:125` fires on two false-positive patterns in otherwise-clean APPROVED reviews: (a) `**Confidence:** HIGH` fields in finding prose (the reviewer's own format-spec confidence qualifier for a finding), and (b) summary lines like "No CRITICAL or HIGH findings" that state absence rather than presence of a blocker. The current LEGEND pattern at `:120` exempts only `^\s*\|` table rows and a fixed severity-table word list; it does not exempt reviewer confidence fields or no-blocker summary lines. Extend the LEGEND pattern (or add a pre-filter before the loop) to skip lines where the severity word appears inside a `**Confidence:**` field, or inside a "No … findings" or "No blocking findings" summary phrase. Workaround used in the field 4 times: bypass the Edit hook entirely via PowerShell direct file write — a strong signal the gate is blocking legitimate work. A deterministic code fix is preferred over a prose workaround.

---

## Message-only critic has no ADR-17 recovery path under background spawn — team-lead spawn guidance incomplete

- **Suggested target:** `plugins/nexus/agents/architect.md` → Plan Workflow step 11, bullet "Critic review — team" (`:172`); this amends the *team-lead's spawn guidance*, not the standalone architect's
- **Action:** update (not net-new — `:172` and `:174` already exist; this adds a carve-out to the team-review bullet)
- **Evidence:** adhoc-PipelineHardening (L-A3 L38–43, L-A8 L73–80 — two incidents), adhoc-DotnetSkillSweep (architect lessons #2 L20–30), adhoc-ConfidenceGatedResearch (process/tooling lessons L48–60) — 4 incidents across 3 features
- **Lesson:** The critic is `disallowedTools: Write,Edit` (message-only, ADR-13). When the team lead spawns it in the background (`:172` bullet), its findings are vulnerable to inline-result truncation; ADR-17's documented recovery ("re-spawn with the file named as the primary deliverable") is structurally impossible for the critic — it cannot write a durable file. This creates a collision between ADR-13 (critic is message-only) and ADR-17 (artifact is the primary deliverable). The `:172` bullet already correctly prohibits the architect from self-spawning the critic as a subagent (ADR-21). The missing carve-out is: *when the team lead spawns the critic in the background for a plan review that needs a durable artifact*, the team lead should prefer a write-capable agent type (e.g., `general-purpose`) that can write its findings to a named file. This is a background-spawn-only carve-out and does not replace the critic's gate role in foreground/standalone use. **Two remediation options from source lessons (both valid; owner decides):** (a) Give the critic a single allowed write to a fixed findings path (preserves ADR-13 gate role, durable artifact, most architecturally clean); (b) Document that the team lead should dispatch a write-capable reviewer for background plan-review spawns (pragmatic workaround without changing the critic's toolset). Note: `:174` already mandates code-grounded review for shared/external-artifact passes — any amendment to `:172` must not duplicate or conflict with that existing guidance.
