# Direction 2 (spec-driven) — SlackSignatureVerifier

**Date:** 2026-06-25
**Question:** Generate tests from the PO golden rules (intended behavior), run them against the code — where does the code diverge from spec?

## Method
- Spec source: `D:\src\knowledge-gateway\docs\audit\golden-set.md`, rules **GOLD-13…18** (the Slack rules).
  The `docs/audit/targets/gateway-slackverifier.json` file is **ids-only** (harness convention) — the rule
  text lives in `golden-set.md`.
- A Sonnet agent authored 23 xUnit tests from the rule text, **blind to the implementation**
  (`SlackSignatureVerifier.cs` never read) and to the existing tests — given only a signatures-only contract +
  `SlackOptions.cs`. So a red test = a real spec-vs-code divergence, not a mirror of current behavior.
- Built + run against the real code in an isolated scratch assembly. KG repo untouched.

## Result — 23/23 PASS → 0 spec-vs-code divergences surfaced

The code correctly implements all 6 PO rules: exclusive ±300s tolerance boundary, case-sensitive constant-time
compare, length-mismatch short-circuit, fail-closed on empty secret, and the full precedence chain
(secret→signature→timestamp→window→HMAC→Valid).

## Honest caveats (do not over-read the green)

1. **Independence of the golden rules is unverified.** All-green is only evidence of correctness if the PO
   authored the rules from *intended behavior*, not by reading the implementation. If the rules describe the
   code, agreement is circular. (Open question for the PO.)
2. **A documented divergence was NOT surfaced — because the spec author sidestepped it.** `golden-set.md`
   itself records a "Divergence #6": the HMAC base string interpolates the **raw** timestamp header string,
   not the parsed value (confirmed in source: `$"v0:{timestampHeader}:{rawBody}"`). The agent deliberately
   used canonical numeric timestamps so its GOLD-15 test would not trip this. So a known spec-vs-code gap
   exists but produced no red. **Methodological lesson:** spec-driven divergence-finding only works if the
   generated tests actually *probe the divergent input* — a happy-path spec test hides the gap. A production
   Direction-2 harness must push edge/adversarial inputs per rule, not just canonical ones.

## So what
- **Mechanism works end-to-end:** golden rules → testable assertions → run vs code → compare. The plumbing
  of Direction 2 is proven.
- **Slack is the wrong class to find divergences** — a careful, correct crypto verifier. The complex
  `GeneratedSqlValidator` (more rules, more surface) is the better divergence target, and the "probe the
  divergent input" lesson should be applied there (test edge inputs each rule implies, not just valid SQL).
