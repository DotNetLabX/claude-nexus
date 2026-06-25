# Spec vs Code Diff — SlackSignatureVerifier (Step 5 / AC-4)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs`
**Spec side (Direction 2):** golden rules GOLD-13..18; tests generated from `golden-set.md` rule text (blind to implementation)
**Code side (Direction 1):** code-derived harness suite from `killdelta-slacksignatureverifier.md` (single Sonnet agent, production source only, blind to golden set)
**Evidence sources:** `delivery/specdriven-slacksignatureverifier.md`, `delivery/killdelta-slacksignatureverifier.md`, `delivery/baseline-slacksignatureverifier.md`

**Reading this diff:** A rule appears in `spec ∧ ¬code` if the spec states a behavior that the code-derived direction missed (surviving mutant or uncovered path). `code ∧ ¬spec` is an undocumented behavior that the code encodes but the golden spec doesn't name. `both-divergent` is a boundary disagreement between the two directions.

## Axis 1 — `spec ∧ ¬code`: rules the spec names that the code-derived direction missed

| Rule | Spec statement | Code-derived gap | Status |
|------|---------------|-----------------|--------|
| GOLD-13 (boundary) | "exactly-at-tolerance passes; only strictly-greater fails" — exclusive boundary | Baseline A left **L67 survivor** (`>`→`>=` equality mutant), confirming this boundary was untested. Code-derived harness **killed this survivor** (explicit boundary sweep at −301/−300/−299, +299/+300/+301). | **RESOLVED by harness** — gap existed in human suite; code-derived direction closed it. |
| GOLD-17 (null secret) | Fail-closed: `MissingSecret` is the FIRST guard | Baseline A left **L37, L38 survivors** (null-option/null-time guards). Code-derived harness killed both. Note: GOLD-17's fail-closed check is at L55-57, not L37-38 — the baseline survivors were for argument null-guards, a related but distinct concern. | **RESOLVED by harness** — null-guard tests added. |

**Result: 0 unresolved `spec ∧ ¬code` items.** The code-derived harness independently closed every gap the golden spec identifies. No sins of omission found on this class.

## Axis 2 — `code ∧ ¬spec`: undocumented behaviors the code encodes but the spec doesn't name

| Behavior | Code location | Verdict |
|----------|---------------|---------|
| Constructor null-guard for `SlackOptions` | L37 | **Defensive implementation detail** — not a rule the spec names, but a reasonable guard. Not a spec miss; the spec focuses on authentication logic, not constructor contracts. |
| Constructor null-guard for `TimeProvider` | L38 | Same as above. |

**Result: 2 minor undocumented behaviors** (constructor null-guards). Not spec violations — implementation details below the spec's abstraction level.

## Axis 3 — `both-divergent`: boundary disagreements between the two directions

| Item | Spec says | Code-derived says | Verdict |
|------|-----------|-------------------|---------|
| Divergence #6 — GOLD-15 raw vs parsed timestamp | Intended behavior: HMAC base string should use the parsed integer (natural reading) | Code uses the raw header string `{timestampHeader}` — a non-canonical timestamp (e.g. `+300`) passes the window (parsed) but hashes a different base string → `InvalidSignature`. | **Code-vs-intent gap** (golden-set.md §Divergence #6). Direction-2 tests sidestepped it (canonical inputs). Direction-1 (code-derived) encodes the raw-string behavior as a rule. Disagreement is real; code is internally consistent (benign, non-exploitable). |

**Result: 1 `both-divergent` item** (GOLD-15 raw/parsed base string). Not a security issue per golden-set.md analysis. Requires a human ruling on whether the raw-timestamp behavior is intentional or a latent correctness issue.

## Summary

| Axis | Count | Headline |
|------|-------|---------|
| `spec ∧ ¬code` (missing features) | 0 resolved / 0 open | Harness closed all spec-identified gaps |
| `code ∧ ¬spec` (undocumented behavior) | 2 minor | Constructor null-guards — below spec abstraction level |
| `both-divergent` (boundary disagreements) | 1 | GOLD-15 raw vs parsed timestamp header — code-vs-intent gap, non-exploitable |

**Spike verdict for Slack:** High spec-code agreement. No candidate bugs. The "probe edge inputs" lesson
applies — the one documented divergence was not surfaced because the spec test used canonical inputs. A
production Direction-2 harness must push adversarial inputs per rule to surface such gaps.
