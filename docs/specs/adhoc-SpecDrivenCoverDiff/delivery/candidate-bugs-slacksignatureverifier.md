# Candidate Bugs — SlackSignatureVerifier (Step 4 / AC-3)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs`
**Evidence source:** `delivery/specdriven-slacksignatureverifier.md`
**Method:** A Sonnet agent authored 23 xUnit tests from golden rules GOLD-13..18 (rule text only, blind to
implementation — given signatures-only contract + `SlackOptions.cs`). Tests run against real code in an
isolated scratch assembly. Stryker was not run on Direction-2 output (per-rule mutation kill is a Direction-1
metric; Direction-2's gate is: reds = candidate bugs, greens = spec-compliance confidence).

## Result — 0 candidate bugs

23/23 tests PASS. No spec-vs-code divergences surfaced.

The code correctly implements all 6 PO rules: exclusive ±300s tolerance boundary, case-sensitive
constant-time compare, length-mismatch short-circuit, fail-closed on empty secret, and the full precedence
chain (secret→signature→timestamp→window→HMAC→Valid).

## Honest caveat — a known divergence was NOT surfaced

A documented code-vs-intent gap exists (**golden-set.md §Divergence #6**: the HMAC base string uses the
RAW timestamp header, not the parsed value — `$"v0:{timestampHeader}:{rawBody}"`). The spec-author agent
deliberately used canonical numeric timestamps in its GOLD-15 test, so the divergent input (a non-canonical
but parseable timestamp like `+300`) was never probed. Result: the divergence exists but produced no red.

**Methodological lesson:** spec-driven divergence-finding only works if the generated tests actually probe
the divergent input. A happy-path spec test can hide the gap (see `delivery/specdriven-slacksignatureverifier.md`
for full analysis). This is a production Direction-2 requirement: push edge/adversarial inputs per rule.

## Per-rule kill summary (Direction 2)

| Rule | Tests | Result | Candidate bug? |
|------|-------|--------|----------------|
| GOLD-13 (replay window) | ~4 | PASS | No |
| GOLD-14 (constant-time compare) | ~4 | PASS | No |
| GOLD-15 (HMAC base string) | ~4 | PASS (canonical inputs only — known gap) | No (gap not probed) |
| GOLD-16 (malformed timestamp) | ~4 | PASS | No |
| GOLD-17 (fail-closed secret) | ~3 | PASS | No |
| GOLD-18 (precedence chain) | ~4 | PASS | No |
