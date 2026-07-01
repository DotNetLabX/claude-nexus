# Plan Cross-Check — adhoc-MvcCoverMinimize (Codex, independent)

**Verdict:** NO-GO — one CRITICAL + two HIGH + one LOW + one INFO
**Reviewed rev:** rev 1

## Findings

### 1. CRITICAL — slice-c restore-path test is vacuous against the live Flutter seam
The live harness output is `mutationSummary` (counts) + a survivors-only `mutants` array (`cover-flutter.workflow.js:374-423`; `mine-verify-cover-flutter/SKILL.md:65-80`). There is **no per-test killed-mutant kill-map**. The proposed sole-killer fixture must inject killed-mutant data the workflow never produces → the test can pass on fabricated data while the real restore path is unexercised.
**Architect reconciliation:** the per-test attribution is *agent reasoning*, not tool output — and is unverifiable by any tool (no per-test map exists). That is precisely why the confirm re-gate is the only safety net. Fix: the confirm uses the existing aggregate `mutationSummary` (re-run → compare exact killed-count); rewrite slice-c to mock the *confirm re-gate result* (a fresh summary with one more survivor) and assert restore + that a second runner call was issued. Grounded against the real output shape, not an invented kill-map.

### 2. HIGH — apply/restore write-ownership breaks the no-filesystem orchestrator contract
The orchestrator has no filesystem (`mine-verify-cover/SKILL.md:30,66`); file writes are delegated to write-owning agents (`cover-flutter.workflow.js:320,335`). Step 3 assigned test removal/restore to the orchestrator with no write-owning agent named.
**Fix:** the test-file edit (remove + restore) is an agent write; the orchestrator only routes the proposal and makes the pure compare/restore decision. Name the write-owning agent + the pure-text handoff. (Converges with critic HIGH-1.)

### 3. HIGH — confirm can silently pass on a one-mutant drop via rounding
The harness exposes exact counts AND rounded `scorePct` (`cover-flutter.workflow.js:120-125`); existing tests assert rounded percentages (`workflow-contract.test.mjs:737-759`). A confirm comparing rounded integer percent lets a one-mutant drop on a large denominator round to the same value and pass.
**Fix:** compare **exact reachable killed-count**, never rounded `scorePct`. Add a contract slice for the large-denominator rounding case.

### 4. LOW — plan inverts ADR-37's confirm-path default without flagging the drift
Plan makes full re-gate default; ADR-37 (`README.md:899-905`) made at-risk-line re-mutation the confirm, full re-run the fallback. (Same as critic L1.)
**Fix:** reconcile; resolved toward full re-gate as the sound default + ADR-37 amended.

### 5. INFO — reusing the existing full gate inherits real anti-fake-green guards for free
The full gate already halts on partial survivor sets before scoring and verifies mutation scope vs the target file (`mine-verify-cover/SKILL.md:52`; `cover-flutter.workflow.js:423,431`). Routing the confirm through it inherits those guards — an argument for full re-gate as the confirm default.

**GO/NO-GO:** NO-GO until the killed-mutant data path (resolved: aggregate summary, not per-test map), the apply/restore write-ownership, and the exact-count comparison are grounded against live source.
