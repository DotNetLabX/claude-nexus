# Rule → Code Map — SlackSignatureVerifier (Step 2 / AC-2)

**Date:** 2026-06-25
**Class:** `KnowledgeGateway.API/Features/Slack/SlackSignatureVerifier.cs`
**Spec source:** `D:\src\knowledge-gateway\docs\audit\golden-set.md`, rules GOLD-13..18
**Method:** Manual mapping per plan §64 — each golden rule's Code attestation column from `golden-set.md`
locates the production line(s). A rule with **no locatable code** would be flagged `NO-CODE-FOUND` (candidate
sin-of-omission). All 6 rules have locatable code.

## Map

| Rule ID | Summary | Code location | Notes |
|---------|---------|---------------|-------|
| GOLD-13 | Replay/skew window: `abs(now - timestamp) > tolerance` → `TimestampOutOfRange`; symmetric, boundary exclusive; default tolerance 300s, config-driven via `TimeProvider` | `SlackSignatureVerifier.cs:66-68`; `SlackOptions.cs:49` | Boundary is exclusive (exactly-at passes). |
| GOLD-14 | Constant-time compare via `CryptographicOperations.FixedTimeEquals`; length-mismatch short-circuits BEFORE constant-time compare; case-sensitive against raw header | `SlackSignatureVerifier.cs:80-85` | Length check at L80 prevents timing oracle on mismatched lengths. |
| GOLD-15 | Expected sig = `v0=` + lowercase hex of `HMACSHA256(secret, "v0:{rawTimestampHeader}:{rawBody}")`; base string uses RAW timestamp header (not parsed long) | `SlackSignatureVerifier.cs:71-77` | Divergence noted in golden-set.md §6: raw vs parsed header — `+`-prefixed or leading-zero timestamps pass window but produce mismatched HMAC base string → `InvalidSignature`, not forged pass. Non-exploitable. |
| GOLD-16 | Null/empty timestamp OR `long.TryParse` fail → `MissingOrInvalidTimestamp`; no distinct "invalid format" case; no throw | `SlackSignatureVerifier.cs:62-63` | Single outcome for all parse failures. |
| GOLD-17 | Null/empty signing secret → `MissingSecret`; first guard, ahead of all header/timestamp checks; fail-closed | `SlackSignatureVerifier.cs:55-57` | First check in the chain. |
| GOLD-18 | Precedence: (1) missing secret → (2) missing sig → (3) missing/invalid timestamp → (4) timestamp out of window → (5) HMAC + compare → Valid | `SlackSignatureVerifier.cs:55-87` | Code-derived (no explicit doc enumerates this order). |

## No-code-found items

None — all 6 rules have locatable code. Divergence #6 from golden-set.md (raw vs parsed timestamp header)
is a code-vs-intent gap, not a missing feature — the code implements a specific behavior (using the raw
header string in the HMAC base) that diverges from what one might expect (using the parsed long), but the
code is intentional and the behavior is documented.
