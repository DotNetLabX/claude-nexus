# KB — Hungarian assignment solver (`hungarian.cpp`)

Verified business rules for the SDK's Hungarian (minimum-assignment) solver, produced by Mine→Verify
(3 clean-room miners → consolidate → batched skeptic verify, 2026-06-24). 42 consensus rules, 40/42 in
all 3 miners. Verdicts: 14 CONFIRMED, 9 IMPRECISE (correction inline), 1 self-corrected, 18 transcribed
(3 entailment caveats). Public API: `hungarian_init` / `hungarian_solve` / `hungarian_free` over an
`int**` cost matrix; `extern "C"`.

## Rules

Tag legend: `[OBS]` = observable through the public API (a Cover test can assert it); `[INT]` = internal
state (slack/col_inc/parent_row) not black-box observable; `[DEAD]` = dead code (`verbose==0`).

### `hungarian_init` (setup)
- **BR-5** `[OBS]` The cost matrix is always made square: rows and cols both become `max(orig_cols, orig_rows)` via `hungarian_imax` before allocation; this padded dimension is also the return value of `hungarian_init`. (CONFIRMED via BR-38.)
- **BR-38** `[OBS]` `hungarian_init` returns the squared (padded) row count, not a success/failure code. (CONFIRMED.)
- **BR-6** `[OBS]` Padding cells (`i >= org_rows` OR `j >= org_cols`) are filled with cost 0; original cells copied verbatim from `cost_matrix[i][j]`. (transcribed.)
- **BR-7** `[OBS]` All `p->assignment[i][j]` are initialized to 0 regardless of position or mode. (transcribed.)
- **BR-9** `[OBS]` In `HUNGARIAN_MODE_MAXIMIZE_UTIL` every cost cell (incl. padding) becomes `max_cost - cost[i][j]`, converting maximization to minimization. (transcribed.)
- **BR-10** `[OBS]` In `HUNGARIAN_MODE_MINIMIZE_COST` no transformation is applied. (transcribed.)
- **BR-11** `[OBS]` An unknown mode prints a stderr warning but does NOT abort and applies no transform — behaviorally identical to MINIMIZE_COST. (CONFIRMED.)
- **BR-8** `[OBS]` `max_cost` = max over all padded cells using strict `<` (equal values do not update). IMPRECISE correction: "effectively the max of the originals" holds ONLY if all originals ≥ 0; a negative-only matrix leaves `max_cost = 0` (a padding zero wins). See BR-42.
- **BR-42** `[OBS]` `max_cost` starts at 0 and only grows (`if (max_cost < cell)`); if ALL original costs are negative it stays 0 — so MAXIMIZE_UTIL on an all-negative matrix transforms against 0. (CONFIRMED — a real edge case to test.)

### `hungarian_solve` (assignment + cost reduction)
- **BR-14** `[OBS]` At entry, every `p->assignment` cell is overwritten to `HUNGARIAN_NOT_ASSIGNED`, replacing the init zeros. (transcribed.)
- **BR-32** `[OBS]` After the doublecheck, exactly one cell per row is `HUNGARIAN_ASSIGNED` (`p->assignment[i][col_mate[i]]`); all others `NOT_ASSIGNED`. This is THE core observable: a valid permutation, one assignment per row/column. (transcribed.)
- **BR-33** `[OBS]` Every `p->cost[k][l]` is overwritten in place with the reduced cost `cost-row_dec+col_inc`; the original matrix is NOT preserved (tests must keep their own copy of the inputs). (transcribed.)
- **BR-13** `[OBS]` Column-minima heuristic: `s` = column min (scan rows 0..m-1); `cost += s` UNCONDITIONALLY; the per-column subtraction of `s` runs only when `s != 0`. (CONFIRMED — resolves the one miner wording contradiction.)
- **BR-16** `[INT]` Greedy seed: `row_dec[k]` = row min; assign row k to the first column where `cost==row_dec[k] && row_mate[l]<0`; else mark unmatched. (CONFIRMED.)
- **BR-17** `[INT]` If all rows greedily matched (`t==0`), `goto done` — skips the augmenting loop. (CONFIRMED.)
- **BR-19** `[INT]` Forest explore: `del = cost[k][l]-row_dec[k]+col_inc[l]`, skip `slack[l]==0`, update only when `del < slack[l]` (strict). (CONFIRMED.)
- **BR-20** `[INT]` `del==0` and column unmatched → immediate `goto breakthru`. (CONFIRMED.)
- **BR-21** `[INT]` `del==0` and column matched → `slack[l]=0`, `parent_row[l]=k`, enqueue `row_mate[l]`; extend forest, no breakthrough. (CONFIRMED.)
- **BR-22** `[INT]` `del>0 && del<slack[l]` → `slack[l]=del`, `slack_row[l]=k`. (transcribed.)
- **BR-23** `[INT]` Zero-introduction: minimum positive slack `s` over `slack[l]!=0` columns, search seeded at INF. IMPRECISE correction: `s` is a scalar used globally; there is NO "tied column" selection — drop the tie-break clause.
- **BR-24** `[INT]` `row_dec` += `s` for every current unchosen row. (transcribed.)
- **BR-25** `[INT]` Per column: `slack[l]!=0` → `slack[l]-=s`; else `col_inc[l]+=s`. (transcribed.)
- **BR-26** `[INT]` Newly-tight unmatched column → bump `col_inc[j]` for `j>l` with `slack[j]==0`, then breakthru; if matched → `parent_row[l]=slack_row[l]`, extend forest. (IMPRECISE: `k=slack_row[l]` is assigned shared, before the matched/unmatched branch — net effect as stated.)
- **BR-27** `[INT]` Augmenting-path update at breakthru: `j=col_mate[k]; col_mate[k]=l; row_mate[l]=k; if(j<0) break; k=parent_row[j]; l=j`. IMPRECISE correction: `j` is a COLUMN index (the column previously matched to row k); `j<0` means row k was previously unmatched — not "a row reached".
- **BR-18** `[INT]` `unmatched` starts at `t`, decremented per breakthrough; reaches 0 → `goto done`. IMPRECISE correction: each breakthrough also resets `t=0` and re-inits the forest (BR-28) before the next stage — not a plain decrement loop.
- **BR-28** `[INT]` Non-final breakthrough resets the stage: `t=0`, `parent_row[l]=-1` & `slack[l]=INF` per column, re-enqueue every `col_mate[k]<0` row. (transcribed.)
- **BR-40** `[INT]` In the new-zero phase the driving row is recovered from `slack_row[l]` (not `unchosen_row`) and used for `parent_row[l]`. (CONFIRMED.)
- **BR-41** `[INT]` `col_inc`/`row_dec`/mates ACCUMULATE across stages; only `t`, `parent_row`, `slack` reset. IMPRECISE correction: `unchosen_row` IS rebuilt each stage (the rule wrongly said it is not reset).
- **BR-15** `[INT]` Initial state: `row_mate[l]=-1`, `parent_row[l]=-1`, `col_inc[l]=0`, `slack[l]=INF` per column. (transcribed.)

### Doublecheck + termination (the `exit()` blind spot)
- **BR-29** `[OBS-exit]` Validity check calls **`exit(0)`** (not `exit(1)`) if any `cost[k][l] < row_dec[k]-col_inc[l]` (a negative reduced cost). (CONFIRMED — process exits status 0 on failure.)
- **BR-30** `[OBS-exit]` Also `exit(0)` if a matched row has `col_mate[k]<0` OR complementary slackness `cost[k][col_mate[k]] == row_dec[k]-col_inc[col_mate[k]]` fails. (CONFIRMED.)
- **BR-31** `[OBS-exit]` Also `exit(0)` if the count of columns with `col_inc[l]!=0` exceeds `m`. (transcribed; entailment caveat — quote shows `exit(0)` on `k>m`.)
- **BR-39** `[INT]` The doublecheck runs UNCONDITIONALLY at `done:` (not verbose-guarded) before the assignment writes. (CONFIRMED.)
- **MUTATION NOTE:** BR-29/30/31 are the `exit(0)` false-survivor trap — a mutant that trips one exits status 0 → the test process "passes" → mutant survives. Pass lines **371/376/383** as `expectedSurvivorLines` so the gate excludes them from the reachable denominator until `exit` is `--wrap`-neutralized.

### Cost scalar + cleanup
- **BR-34** `[INT]` Final cost = column-minima sum + Σ`row_dec[i]` − Σ`col_inc[i]`. Entailment caveat: the column-minima initialization is outside the shown quote. NOT returned (BR-37).
- **BR-37** `[INT]` `hungarian_solve` does NOT return the cost; the local is discarded. IMPRECISE correction: the reduced-cost matrix IS left in `p->cost` (BR-33), so the caller can still derive cost from outputs — not "only via the dead verbose branch".
- **BR-36** `[OBS]` Frees all 8 working arrays (slack, col_inc, parent_row, row_mate, slack_row, row_dec, unchosen_row, col_mate); does NOT free `p->cost`/`p->assignment` (left for the caller). (CONFIRMED.)
- **BR-12** `[OBS]` `hungarian_free` frees the row arrays + the 2 top-level pointers, then sets `p->cost`/`p->assignment` to NULL; does NOT clear `num_rows`/`num_cols`. (Verdict logged "WRONG" but the verifier's own evidence re-concludes CONFIRMED — treat as confirmed.)

### Constants / macros / dead code
- **BR-1** `[OBS]` `INF = 0x7FFFFFFF` (INT32_MAX), the slack sentinel. (transcribed; entailment caveat — quote defines the value, not the "sentinel" role.)
- **BR-3** `[OBS]` `hungarian_test_alloc` only prints to stderr on NULL; it does NOT abort/exit/return — execution continues with a NULL pointer. (CONFIRMED.)
- **BR-4** `[INT]` `hungarian_imax` returns `b` when `a<b`, else `a` (ties → `a`). (transcribed.)
- **BR-2 / BR-35 / BR-37(print)** `[DEAD]` `verbose==0` makes every `if(verbose)` fprintf branch dead code. IMPRECISE caveat: the `#define verbose (0)` and the call sites weren't in one slice — the dead-code claim needs both; do not assert on diagnostic output.

## Key Files
- `src/hungarian.cpp` (419 LOC, pure C, `extern "C"`) — the SUT. `src/hungarian.h` — the public API.

## Edge Cases (test targets)
- Non-square input → padded to square with zero-cost padding (BR-5/6); assignment covers padded dims.
- Unknown mode value → behaves as MINIMIZE_COST (BR-11).
- All-negative cost matrix → `max_cost` stays 0; MAXIMIZE_UTIL transforms against 0 (BR-42/8).
- Degenerate: all rows greedily matched → augmenting loop skipped (BR-17).
- `exit(0)` on internal-invariant violation (BR-29/30/31) — not reachable with valid inputs, but the mutation blind spot.

## Source
Mined from `D:\omnishelf\omnivision-ai-sdk\src\trackers\sortcpp\hungarian.cpp` (libhungarian, Cyrill Stachniss). Mine→Verify run `wf_356fb6ab-024`, 2026-06-24.

<!-- mutation-gated: false -->
<!-- last-stryker-run: none -->
