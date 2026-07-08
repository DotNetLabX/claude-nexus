# CalculateReferencePeriodAction — verified business rules

Mine→Verify output (run 2026-07-07, `mine-verify.workflow.js` inc1-batched-sliced: 3 clean-room
miners → consolidate → batched sliced skeptic verify). 15 consensus rules; 6 transcribed (all
quote-entailed), 9 interpretive (8 CONFIRMED, 1 refined per skeptic — see BR-3). Zero
contradictions between miners. Consumed as `KB_RULES` by `harness/cover-php.workflow.js`.

## Rules

- BR-1: In `execute()`, both `$dateFrom` and `$dateTo` are parsed with `Carbon::parse` and immediately normalized to `startOfDay()` before any comparison or arithmetic, so any time-of-day component in the raw inputs is discarded and all downstream logic operates on whole calendar days.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 13-14`
- BR-2: `isFullWeek()` matches only when `from` is exactly a Monday, `to` is exactly a Sunday, and the absolute day-count between them (`diffInDays(..., true)`) strictly equals 6 — an exact Monday-through-Sunday span; the absolute flag makes the magnitude check independent of argument order.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 57`
- BR-3: When `isFullWeek` matches, `execute()` returns the previous week by independently shifting the original `from` and `to` back one week each (`copy()->subWeek()`), not by recomputing from a shared period anchor (contrast: the month/quarter/year branches each derive both bounds from one shared `prev*` variable). That the result is again a Monday/Sunday pair holds only via the `isFullWeek` precondition (`isMonday()`/`isSunday()`), not via this branch's own code.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 17-20 · note: skeptic-refined — original phrasing asserted the Monday/Sunday property from outside its slice`
- BR-4: `isFullMonth()` matches only when `from->isStartOfMonth()`, `to->isEndOfMonth()`, and `from->isSameMonth($to)` all hold.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 62-64`
- BR-5: Unlike `isFullQuarter` and `isFullYear`, `isFullMonth` has no separate explicit same-year conjunct (no `isSameYear` call) — `isSameMonth` alone is relied on for month spans.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 2/3 · lines: 62-64`
- BR-6: When `isFullMonth` matches, the result derives solely from `from` via `subMonthNoOverflow()` — `to` participates only in the predicate — and the returned bounds are that prior month's `startOfMonth()`/`endOfMonth()`.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 24-28`
- BR-7: `isFullQuarter()` matches only when `from->isStartOfQuarter()`, `to->isEndOfQuarter()`, `from->quarter === to->quarter`, and `from->isSameYear($to)` all hold.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 69-72`
- BR-8: The explicit `isSameYear` conjunct in `isFullQuarter` is necessary because quarter numbers (1–4) repeat every year — without it Q1 of one year could match Q1 of another.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 2/3 · lines: 69-72`
- BR-9: When `isFullQuarter` matches, the result derives solely from `from` via `subQuarterNoOverflow()` — `to` is unused in the computation — and the returned bounds are that prior quarter's `startOfQuarter()`/`endOfQuarter()`.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 32-36`
- BR-10: `isFullYear()` matches only when `from->isStartOfYear()`, `to->isEndOfYear()`, and `from->isSameYear($to)` all hold.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 77-79`
- BR-11: When `isFullYear` matches, the result derives solely from `from` via `subYearNoOverflow()` — `to` is unused in the computation — and the returned bounds are that prior year's `startOfYear()`/`endOfYear()`.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 40-44`
- BR-12: `execute()` evaluates `isFullWeek`, `isFullMonth`, `isFullQuarter`, `isFullYear` in that fixed order, each in its own immediately-returning `if` with no `else`; the first match wins and no later predicate (nor the fallback) runs even if it would also match.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 16-45`
- BR-13: If no full-period predicate matches, the fallback computes `periodDays` as the absolute inclusive day-count of the original span: `to->diffInDays(from, true) + 1`, order-independent via the absolute flag.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: transcribed · miners: 3/3 · lines: 47`
- BR-14: In the fallback, the returned `to` is exactly one day before the original `from` (`subDay()`) and the returned `from` is `periodDays` days before the original `from` — an immediately-preceding period of the same inclusive length, anchored entirely on the original `from`; the original `to` is used only to compute `periodDays`.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 3/3 · lines: 49-52`
- BR-15: The fallback's `periodDays` is cast `(int)` immediately before `subDays()`, truncating any fractional component toward zero rather than rounding.
  `source: code · status: verified · criticality: untagged · last_verified: 2026-07-07 · kind: interpretive · miners: 1/3 · lines: 50`

## Key Files

- `harness/php/workspace/src/Actions/CalculateReferencePeriodAction.php` — the mined workspace copy (verbatim from fmcg_platform `app/Actions/CalculateReferencePeriodAction.php`)
- `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/probe-report.md` — toolchain probe this workspace was built by

## Edge Cases

- **Post-mining discovery (Cover run 2026-07-07):** BR-2's strict `=== 6` compared Carbon 3's float `diffInDays()` to int — permanently false, making the BR-3 branch dead code (masked by an algebraically identical fallback). **Fixed in fmcg_platform 2026-07-08** (`(int)` cast, branch `adhoc-MineVerifyPhpAdapter`); this workspace copy retains the pre-fix code the campaign ran against. Full story: fmcg `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/mvc-report.md`.
- Reversed inputs (`to` before `from`): both BR-2's week check and BR-13's fallback use absolute `diffInDays`, so magnitude survives reversal — but the full-month/quarter/year predicates do not (start/end checks fail), sending reversed ranges to the fallback.
- Time-of-day in inputs: discarded by BR-1's `startOfDay()` normalization before anything else runs.
- Month spans across years: BR-5 — `isSameMonth` is the only guard; its cross-year behavior is Carbon's, not this class's (candidate Cover probe).

## Relationships

- CalculateReferencePeriodAction → Carbon: all date arithmetic delegates to Carbon (`subWeek`, `sub*NoOverflow`, `startOf*`/`endOf*`, `diffInDays`).
- This KB → `harness/cover-php.workflow.js`: consumed as `KB_RULES` by the Cover agent (Step 6).

## Source

Mined from code (fmcg_platform, PHP/Laravel) by `harness/mine-verify.workflow.js` run wf_b9e270e4-d6b; skeptic-verified 2026-07-07. No spec arm — `source: code` throughout.
