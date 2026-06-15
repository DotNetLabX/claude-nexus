# Research — selecting the next big build ("the major") after TokenAuditFidelity

**Question:** of the three candidate "big" work items, which is the right next bet, ranked by the
master gate (cost-of-being-wrong, ADR-25) and impact ÷ effort (ADR-29)? Triggered by the architect
holding **below-High** confidence on a cold pick — confidence gate ⇒ research-first (P1, ADR-28).

**Method:** read the backing docs — `docs/research/testing-claude-code-plugins.md` (covers candidates
1 & 2), `docs/proposals/research-system-overview.md` (candidate 3), the architecture
known-limitations section, and the deferred-work grep across `docs/specs/*/delivery/`.

---

## Candidates assessed

| # | Candidate | Readiness | Effort | Impact | Blockers / dependencies |
|---|-----------|-----------|--------|--------|-------------------------|
| 1 | **Plugin unit-test suite (T1 lint + T2 node:test)** | **High** — fully designed in the testing research doc (tiers, targets, frameworks, build order) | **Med** — T1 hours, T2 1–2 days | **High** — permanent safety net under every future plugin change; subsumes the dangling-ref lint + convergence/CHANGELOG checks; nexus leads the ecosystem (most plugins have zero tests) | **None.** "Pure dev-repo machinery, no bump." |
| 2 | **VERIFY-stage harness (T3/T4 evals + mine-verify)** | **Low** — must build *after* T1/T2 ("T3/T4 as a follow-up"); mine-verify substrate "not yet bound" | **High** — promptfoo + claude-agent-sdk + scenario authoring | Med-High — proves LLMs *honor* contracts (lint can't) | Blocked on a **CI-auth decision** (`ANTHROPIC_API_KEY` secret); collides with in-flight unit-test work (ADR-26 deferred it for this reason); unbound substrate |
| 3 | **Research-system buildout (P2/P3/P4)** | **Mixed** — P2 already in flight (`adhoc-ResearchKB`); P3 **research-blocked** ("do not build"); P4 last + high drift-risk | Med per pass | Med — P2 `search-researches` recall; P4 persona calibration | Not one clean major: P2 in flight, **P3 explicitly blocked on research**, P4 risky/last |

## Verdict

**Recommended next big build: the plugin unit-test suite (T1 + T2).** Confidence: **High.**

- **Most ready** — zero blockers; design is done. The other two each carry a blocker (CI-auth + unbound
  substrate for VERIFY; a research-blocked P3 and an in-flight P2 for the research-system).
- **Highest impact ÷ effort** — ~2–3 days for a permanent deterministic safety net. The 2026-06 cleanup
  found multiple *shippable-only-because-untested* bugs (dead branch in `bump-plugin.mjs`, `gen-commands`
  crash on a no-`agents/` plugin, pipeline-gate regressions across patches). It also **subsumes** the
  dangling-`*-format`-ref lint (the ADR-4 bug class) and the CHANGELOG==version / no-`${CLAUDE_PLUGIN_ROOT}`
  checks.
- **It is also the mandatory first leg of the VERIFY harness** — the research's build order is explicit:
  `T1 → T2 ship together` (deterministic, no API cost), then `T3/T4 once CI auth is decided`. So even if
  the eventual aim is candidate 2, candidate 1 is the prerequisite. Doing it first is correct regardless.

**Eliminated:** VERIFY harness (blocked + premature; it builds on candidate 1); research-system buildout
(not a single major — P2 in flight, P3 research-blocked, P4 deferred-last).

## Reframe finding — "major version" is a category error here (master-gate constraint test)

By the repo's own semver policy (`release-plugin` skill; MAJOR = **breaking / behavior reversal**):

- **Candidate 1 (unit-tests) and candidate 2 (VERIFY harness) require NO version bump** — they are
  dev-repo / CI machinery that ships nothing to users and changes no shipped behavior. They are not a
  major; they are not *any* version event.
- **Candidate 3 (research-system) is a MINOR** — P2/P4 add new shipped capability, not a breaking change.

So **none of the three big candidates is a MAJOR version.** Nothing in the current pending surface
(deferred lessons, known-limitations, PROPOSED ADR-24, the proposal inbox) is breaking/behavior-reversal
shaped. "Do the big thing as a new major version" therefore rests on an assumption that doesn't hold
unless a specific breaking change is intended that isn't yet on record. Surfaced for the owner rather
than silently planned as a "major."

## Provenance
Architect research spike, 2026-06-14, standalone session. Sources as listed under Method. Feeds the
owner's ratification of the next big-build pick (ADR-28) once TokenAuditFidelity ships.
