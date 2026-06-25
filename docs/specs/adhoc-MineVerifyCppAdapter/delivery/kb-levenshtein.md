# KB — Levenshtein edit distance (`levenshtein.h`)

Verified rules for the SDK's header-only Levenshtein, grounded directly in the source
(`D:\omnishelf\omnivision-ai-sdk\src\planogram\levenshtein.h`, read 2026-06-25). Header-only C++ templates;
public API `Levenshtein::distance<T>` and `Levenshtein::editops<T>` over any `T` with `.size()` and `[]`
(tested over `std::string`). Pure functions — the return value is the sole observable; no side effects, no
`exit`/`abort`/`throw`. Every rule below is `[OBS]` (observable through the public return value).

> Compile note: the header uses `std::string`/`std::tuple` but only `#include`s `<algorithm>`,`<vector>`.
> A test MUST `#include <string>`, `<tuple>`, `<vector>` **before** `"levenshtein.h"`.

## `Levenshtein::distance<T>(source, target) -> int`

- **LV-1** Empty source: if `source.size()==0`, returns `target.size()` (the whole target inserted). (L14–16)
- **LV-2** Empty target: if `target.size()==0`, returns `source.size()`. Checked AFTER LV-1, so `distance("","")==0` via LV-1. (L18–20)
- **LV-3** Identical sequences ⇒ distance `0` (every char matches the diagonal). e.g. `distance("kitten","kitten")==0`.
- **LV-4** DP first column init: `dp[i][0] = i` for `i in 0..n`. (L24–26)
- **LV-5** DP first row init: `dp[0][j] = j` for `j in 0..m`. (L28–30)
- **LV-6** Match (`source[i-1]==target[j-1]`): `dp[i][j] = dp[i-1][j-1]` — no cost added on the diagonal. (L34–35)
- **LV-7** Mismatch: `dp[i][j] = min(dp[i-1][j]+1 /*delete*/, dp[i][j-1]+1 /*insert*/, dp[i-1][j-1]+1 /*substitute*/)`. The `+1` on EACH of the three terms is load-bearing — mutating any `+1` away changes the result. (L37–41)
- **LV-8** Result is `dp[n][m]` (bottom-right cell). (L46)
- **LV-9** Symmetry: `distance(a,b) == distance(b,a)` (the recurrence is symmetric). A test asserting both directions kills mutants that bias one operation.
- **LV-10** Canonical value: `distance("kitten","sitting")==3`; `distance("flaw","lawn")==2`; `distance("abc","")==3`; `distance("","abc")==3`; one substitution `distance("abc","abd")==1`; one insertion `distance("ab","abc")==1`; one deletion `distance("abc","ab")==1`.

## `Levenshtein::editops<T>(source, target) -> vector<tuple<string,int,int>>`

Same DP as `distance`, plus a `path` matrix and a backtrace. Returns the ordered edit script
(source→target order; the raw backtrace is reversed at the end, L112).

- **LV-11** `path` init: first column `path[i][0]=1` (delete), first row `path[0][j]=-1` (insert). (L57–65)
- **LV-12** On a match, `path[i][j]=0` and dp takes the diagonal (no op emitted later — see LV-16). (L69–71)
- **LV-13** On a mismatch, `path` records WHICH op achieved the min, with tie priority **delete (1) > insert (-1) > substitute (0)**: `if(min==deletion) 1 else if(min==insertion) -1 else 0`. (L80–86) — the `==` comparisons and their ORDER are mutation-sensitive.
- **LV-14** Backtrace from `(i=n, j=m)` while `i>0 || j>0`. (L93–96)
- **LV-15** `path==1` ⇒ emit `("delete", i-1, j)`, then `i--`. `path==-1` ⇒ emit `("insert", i, j-1)`, then `j--`. (L97–102)
- **LV-16** `path==0` ⇒ emit `("replace", i-1, j-1)` **only if** `dp[i][j] != dp[i-1][j-1]` (a real substitution); a true match (dp equal) emits **nothing**; then `i--; j--`. (L103–109) — the `!=` guard is the match-vs-substitute discriminator.
- **LV-17** Op label strings are exactly `"delete"`, `"insert"`, `"replace"` (lowercase). The 2nd/3rd tuple fields are 0-based positions per LV-15/16.
- **LV-18** Final order is source→target (after `std::reverse`, L112): for `editops("abc","abd")` the single op is `("replace", 2, 2)`; for a pure-match pair the result is empty `[]`.

## Mutation targets (why this is a strong kill-rate slice)
Every rule is asserted through a returned `int` or the returned op vector — there is no internal state to
hide behind (contrast Hungarian's `int**`/`exit()`). Boundary mutants to pin: the `n==0`/`m==0` guards
(LV-1/2), each `+1` (LV-7), the match `==` (LV-6/12), the three tie-break `==` and their order (LV-13),
the backtrace `path==1`/`==-1` and the `dp != dp` replace guard (LV-15/16), and the init `=i`/`=j`/`=1`/`=-1`
(LV-4/5/11). `cxx_assign_const`, `cxx_lt_*`, `cxx_add_to_sub`, `cxx_eq_to_ne`, `cxx_remove_void_call`
(on `emplace_back`/`reverse`) all surface in the return value.

## Asserting `editops` safely (avoid the hand-computed-position trap)
The first cover run hit 96% kill but 2 tests FAILED on **correct** code because the agent hand-computed the
wrong `(i,j)` for a `delete` op (it expected target-pos `1` where a leading delete is `0`). For a clean,
high-kill suite:
- **Best invariant:** `editops(a,b).size() == distance(a,b)` — each emitted op costs exactly 1, so the op
  count equals the edit distance. Kills emission/count mutants with ZERO hand-computation.
- **Op labels:** assert the label sequence for small, certain cases (`editops("abc","abd")` is exactly one
  `"replace"`; `editops("abc","abc")` is empty `[]`; `editops("ab","abc")` is one `"insert"`).
- **Positions:** assert an exact `(i,j)` ONLY for a single, trivially-traceable op. For multi-op cases do
  NOT hand-compute the index sequence — either skip exact positions, or write a helper that APPLIES the
  returned ops to the source and asserts the result equals the target. A wrong hand-computed index is a
  FALSE failure, not a bug.

## Source
`D:\omnishelf\omnivision-ai-sdk\src\planogram\levenshtein.h` (119 LOC, header-only). Mined by direct read
2026-06-25 (a Mine→Verify pass would produce the same; the slice is small + well-understood).

<!-- mutation-gated: false -->
