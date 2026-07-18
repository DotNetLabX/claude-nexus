// cover-gates.mjs — DEV-REPO RE-EXPORT SHIM (F7 S1.1, ADR-62).
//
// The canonical §6 gate battery is now the SHIPPED file:
//   plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs
// (target-agnostic, zero imports, invoked in place in consuming repos — ADR-62 hash-drift anchor).
//
// This dev-repo module re-exports every gate from the shipped file so the harness, its unit tests
// (tests/unit/cover-gates.test.mjs), and the workflow-contract tests keep importing from one place with
// zero churn — one canonical copy, no drift. The ONE thing that stays dev-repo-only is the pilot target's
// expected-survivor constant below: the shipped battery ships no per-class defaults (the exclusion set is
// caller input on mutationFloor), so the pilot's dead-line set lives here, not in the shipped artifact.
export {
  suiteGreen,
  noFlaky,
  mutationFloor,
  targetMutated,
  noNewSkips,
  charPin,
  mutationRatchet,
} from '../../plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs';

// The KB-pre-documented dead lines in BugRatioAnalyzer.cs whose mutant SURVIVORS are expected-survivors —
// excluded from the mutation_floor denominator, NOT chased with tests (Domain section / bug-ratio.md Edge
// Cases). Confirmed against live source: `startIndex` destructured-unused at L17 & L133; the
// `if (completedSp == 0) break;` streak guard at L268. The orchestrator (never the Cover agent) annotates
// these with `// Stryker disable once all` at run time; this list is the gate-time exclusion set. This is
// the ONLY pilot-specific constant — it stays dev-repo-only (see the shipped file's caller-input contract).
export const EXPECTED_SURVIVOR_LINES = [17, 133, 268];
