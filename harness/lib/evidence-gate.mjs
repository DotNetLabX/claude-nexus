// evidence-gate.mjs — DEV-REPO RE-EXPORT SHIM (F7 S1.3, ADR-62).
//
// Canonical predicate is the SHIPPED file:
//   plugins/nexus/skills/mine-verify-cover/tools/evidence-gate.mjs
// (target-agnostic, zero imports, invoked in place in consuming repos). This shim lets the dev-repo
// harness + its unit tests import the predicate from one place with zero churn. The Workflow drivers,
// which cannot import, inline a VERBATIM copy (kept in sync — same pattern as cover-gates.mjs).
export { structuralEvidenceOk } from '../../plugins/nexus/skills/mine-verify-cover/tools/evidence-gate.mjs';
