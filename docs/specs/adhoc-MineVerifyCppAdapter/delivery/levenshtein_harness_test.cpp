// Mutation-gated GoogleTest suite for Levenshtein::distance and Levenshtein::editops.
// Each TEST() targets specific mutation boundaries so that a mutated production line
// turns at least one EXPECT_* RED.
//
// SURVIVING MUTANTS TARGETED THIS ITERATION:
//   [M-L24] cxx_le_to_lt  line 24 : distance() first-col loop `i<=n` → `i<n`
//            Effect: dp[n][0] never written → stays 0 instead of n.
//   [M-L58] cxx_assign_const line 58: editops() `path[i][0] = 1` → `path[i][0] = 42`
//            Effect: j==0 cells in editops backtrace fall to else-branch → emit
//            "replace" (from dp inequality guard) instead of "delete".
//   [M-L71] cxx_assign_const line 71: editops() `path[i][j] = 0` (match) → `= 42`
//            Effect: 42 falls into else-branch just like 0; dp equality check correctly
//            suppresses the op → LIKELY EQUIVALENT MUTANT (flagged below).
//   [M-L85] cxx_assign_const line 85: editops() `path[i][j] = 0` (substitution) → `= 42`
//            Effect: 42 falls into else-branch just like 0; dp inequality check still
//            emits replace → LIKELY EQUIVALENT MUTANT (flagged below).
//
// Include order is MANDATORY: levenshtein.h uses <string>/<tuple> without including them.
#include <gtest/gtest.h>
#include <string>
#include <tuple>
#include <vector>
#include "levenshtein.h"

using std::string;

// ============================================================================
// distance — empty-string base cases (LV-1, LV-2)
// ============================================================================

// LV-1: n==0 → return m.
TEST(LVDistance, EmptySourceReturnsTargetSize) {
    EXPECT_EQ(Levenshtein::distance<string>("", "abc"), 3);
    EXPECT_EQ(Levenshtein::distance<string>("", "a"),   1);
    EXPECT_EQ(Levenshtein::distance<string>("", ""),    0);
}

// LV-2: m==0 → return n (checked after LV-1).
TEST(LVDistance, EmptyTargetReturnsSourceSize) {
    EXPECT_EQ(Levenshtein::distance<string>("abc", ""), 3);
    EXPECT_EQ(Levenshtein::distance<string>("a",   ""), 1);
}

// Both empty → 0 (LV-1 short-circuit, never touches DP).
TEST(LVDistance, BothEmptyIsZero) {
    EXPECT_EQ(Levenshtein::distance<string>("", ""), 0);
}

// ============================================================================
// distance — identical sequences (LV-3, LV-6)
// ============================================================================

// Match diagonal: no +1 applied, result is 0.
// Kills: mutants that add cost on the match branch, or flip == to !=.
TEST(LVDistance, IdenticalIsZero) {
    EXPECT_EQ(Levenshtein::distance<string>("kitten",  "kitten"),  0);
    EXPECT_EQ(Levenshtein::distance<string>("a",       "a"),       0);
    EXPECT_EQ(Levenshtein::distance<string>("abcde",   "abcde"),   0);
}

// ============================================================================
// distance — DP first-column init (LV-4) — TARGET: [M-L24]
//
// Surviving mutant: cxx_le_to_lt at line 24.
//   Original: for (int i = 0; i <= n; ++i) dp[i][0] = i;
//   Mutant:   for (int i = 0; i <  n; ++i) dp[i][0] = i;
//   Effect:   dp[n][0] is never written; it stays at 0 instead of n.
//
// Kill strategy: any call where the final answer depends on dp[n][0]=n.
//   • distance(source,"") → return n via LV-2 BEFORE hitting the DP, so the
//     early-return guard already covers the n==0 case, but for non-zero n the
//     m==0 guard fires first — so distance("abc","") returns 3 via LV-2 even
//     on the mutant.  We must find a path that REACHES dp[n][something>0]
//     where dp[n][0] is read as part of the recurrence.
//   • The inner loop at i=n, j>=1 reads dp[n-1][j], dp[n][j-1], dp[n-1][j-1].
//     dp[n][0] is read when j=1: dp[n][j-1] = dp[n][0].
//     If dp[n][0]=0 (mutant) instead of n, then dp[n][1] = min(dp[n-1][1]+1,
//     0+1, dp[n-1][0]+1) = min(correct, 1, n) which for n>1 gives 1 — wrong.
//   • Concrete kill: distance("ba","a").
//     n=2, m=1. DP fill for i=2,j=1:
//       source[1]='a', target[0]='a' → match → dp[2][1]=dp[1][0]=1.
//       Wait — that's a match path; dp[n][0] is not read here.
//     For i=2,j=1 with source="ba",target="b":
//       source[1]='a' != target[0]='b' → mismatch.
//       del = dp[1][1]+1, ins = dp[2][0]+1 = 0+1=1 (mutant) vs 2+1=3 (correct),
//       sub = dp[1][0]+1 = 1+1=2.
//       Mutant min = min(dp[1][1]+1, 1, 2). dp[1][1]: source[0]='b'==target[0]='b'
//       → dp[1][1]=dp[0][0]=0. So del=1, ins(mut)=1, sub=2 → min=1 (same as correct
//       del=1, but ins(mut)=1 makes it look the same). Hmm.
//     Better kill: distance("xyz","x") — n=3, m=1.
//       Correct: dp[3][1] uses dp[3][0]=3: del=dp[2][1]+1, ins=dp[3][0]+1=4,
//       sub=dp[2][0]+1=3. source[2]='z'!=target[0]='x'. del=dp[2][1]+1.
//       dp[2][1]: source[1]='y'!=target[0]='x'. del=dp[1][1]+1, ins=dp[2][0]+1=3,
//       sub=dp[1][0]+1=2. dp[1][1]: source[0]='x'==target[0]='x' → dp[1][1]=0.
//       del=1, ins=3, sub=2 → dp[2][1]=1. Back to dp[3][1]: del=2, ins=4, sub=3 → 2.
//       Correct distance=2.
//       Mutant: dp[3][0]=0. dp[3][1]: del=dp[2][1]+1=2, ins=dp[3][0]+1=1(mut),
//       sub=dp[2][0]+1=3. Min=1. Mutant distance=1. ← different! RED.
// ============================================================================

// Primary kill for [M-L24]: exercises dp[n][0] via ins-arm reading dp[n][0]+1.
TEST(MutantL24_FirstColLoopInclusive, InsertionArmReadsLastColEntry) {
    // distance("xyz","x") = 2. Mutant gives 1 because dp[3][0]=0 → ins cost 1.
    EXPECT_EQ(Levenshtein::distance<string>("xyz", "x"), 2);
    // distance("yz","y") = 1. n=2, m=1. dp[2][0] must be 2, else ins arm corrupted.
    EXPECT_EQ(Levenshtein::distance<string>("yz",  "y"), 1);
    // distance("abcde","a") = 4. dp[5][0] must be 5.
    EXPECT_EQ(Levenshtein::distance<string>("abcde", "a"), 4);
}

// Graduated series: distance(N-char-source, "") via LV-2 doesn't exercise DP,
// but distance(source, 1-char-target) forces the inner loop to read dp[n][0].
TEST(MutantL24_FirstColLoopInclusive, MultiLengthSourceSingleCharTarget) {
    EXPECT_EQ(Levenshtein::distance<string>("a",   "b"), 1);
    EXPECT_EQ(Levenshtein::distance<string>("ab",  "b"), 1);
    EXPECT_EQ(Levenshtein::distance<string>("abc", "c"), 2);
    EXPECT_EQ(Levenshtein::distance<string>("abc", "b"), 2);
}

// Also cover the DP first-col init for LV-4 generally.
TEST(LVDistance, FirstColumnInit_SingleChars) {
    EXPECT_EQ(Levenshtein::distance<string>("x",   ""), 1);
    EXPECT_EQ(Levenshtein::distance<string>("xx",  ""), 2);
    EXPECT_EQ(Levenshtein::distance<string>("xxx", ""), 3);
}

// ============================================================================
// distance — DP first-row init (LV-5)
// ============================================================================

// dp[0][j]=j for j=0..m. Kills off-by-one on =j or loop boundary.
TEST(LVDistance, FirstRowInit_SingleChars) {
    EXPECT_EQ(Levenshtein::distance<string>("", "x"),   1);
    EXPECT_EQ(Levenshtein::distance<string>("", "xx"),  2);
    EXPECT_EQ(Levenshtein::distance<string>("", "xxx"), 3);
}

// ============================================================================
// distance — mismatch recurrence, +1 on each arm (LV-7)
// ============================================================================

TEST(LVDistance, KittenToSitting) {
    EXPECT_EQ(Levenshtein::distance<string>("kitten", "sitting"), 3);
}

TEST(LVDistance, OneSubstitution) {
    EXPECT_EQ(Levenshtein::distance<string>("abc", "abd"), 1);
}

TEST(LVDistance, OneInsertion) {
    EXPECT_EQ(Levenshtein::distance<string>("ab", "abc"), 1);
}

TEST(LVDistance, OneDeletion) {
    EXPECT_EQ(Levenshtein::distance<string>("abc", "ab"), 1);
}

TEST(LVDistance, FlawToLawn) {
    EXPECT_EQ(Levenshtein::distance<string>("flaw", "lawn"), 2);
}

// ============================================================================
// distance — result is dp[n][m] (LV-8)
// ============================================================================

TEST(LVDistance, MultiStepTransform) {
    EXPECT_EQ(Levenshtein::distance<string>("saturday", "sunday"), 3);
}

// ============================================================================
// distance — symmetry (LV-9)
// ============================================================================

TEST(LVDistance, SymmetryKittenSitting) {
    EXPECT_EQ(Levenshtein::distance<string>("kitten",  "sitting"),
              Levenshtein::distance<string>("sitting", "kitten"));
}

TEST(LVDistance, SymmetryFlawLawn) {
    EXPECT_EQ(Levenshtein::distance<string>("flaw", "lawn"),
              Levenshtein::distance<string>("lawn", "flaw"));
}

TEST(LVDistance, SymmetryEmptyNonEmpty) {
    EXPECT_EQ(Levenshtein::distance<string>("",    "abc"),
              Levenshtein::distance<string>("abc", ""));
}

// ============================================================================
// editops — path matrix first-column init (LV-11) — TARGET: [M-L58]
//
// Surviving mutant: cxx_assign_const at line 58.
//   Original: path[i][0] = 1;   (inside `for (int i=0; i<=n; ++i)`)
//   Mutant:   path[i][0] = 42;
//   Effect:   all j==0 cells carry path 42 instead of 1.
//
// Kill strategy:
//   The backtrace walk: when j==0 and i>0, the loop continues (i>0 is true).
//   It checks path[i][j]:
//     Correct (path==1):  emits ("delete", i-1, j=0), i--.
//     Mutant  (path==42): 42 != 1 and 42 != -1 → falls to else-branch.
//       Else checks dp[i][0] != dp[i-1][0]: that's i != i-1, always true.
//       Emits ("replace", i-1, j-1) = ("replace", i-1, -1).  ← j-1 = -1!
//       (Or whatever dp[i-1][j-1] references — UB or wrong position.)
//       Then i--, j--. j becomes -1. The while loop: i>0||j>0 → j<0 is false
//       for the j>0 check, so if i also reaches 0 the loop stops.
//       But the emitted op has label "replace" not "delete" → assertion RED.
//
// Primary kill: editops(source, "") forces the backtrace to walk down j==0
// cells (path[i][0]) for all i from n down to 1.  We assert label=="delete".
// The mutant emits "replace" → ASSERT fails → mutant killed.
// ============================================================================

// Single char: backtrace visits path[1][0] — the key cell mutated at line 58.
TEST(MutantL58_PathFirstColIsOne, SingleCharDeleteLabel) {
    auto ops = Levenshtein::editops<string>("a", "");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete")
        << "path[1][0] must be 1 (delete); mutant =42 routes to else->replace";
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

// Three chars: backtrace visits path[3][0], path[2][0], path[1][0].
// All must be 1; any =42 flips label to "replace".
TEST(MutantL58_PathFirstColIsOne, ThreeCharDeleteLabels) {
    auto ops = Levenshtein::editops<string>("abc", "");
    ASSERT_EQ(ops.size(), 3u);
    for (const auto& o : ops) {
        EXPECT_EQ(std::get<0>(o), "delete")
            << "all j=0 backtrace cells must carry path=1 (delete)";
    }
}

// Five chars: exercises path[5][0]..path[1][0] — confirms the full column.
TEST(MutantL58_PathFirstColIsOne, FiveCharDeleteLabels) {
    auto ops = Levenshtein::editops<string>("abcde", "");
    ASSERT_EQ(ops.size(), 5u);
    for (const auto& o : ops) {
        EXPECT_EQ(std::get<0>(o), "delete");
    }
}

// Mixed case: "xyz" → "xy" — backtrace ends at (1,0) after matching 'x','y'.
// With path[1][0]=42 the backtrace emits "replace" instead of "delete".
TEST(MutantL58_PathFirstColIsOne, LeadingDeleteAfterSuffixMatch) {
    // "abc" → "bc": delete 'a'. Backtrace: match 'c' at (3,2), match 'b' at (2,1),
    // then (1,0): path[1][0] must be 1 → emit ("delete",0,0).
    auto ops = Levenshtein::editops<string>("abc", "bc");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

// Two leading deletes: "abcd" → "cd", visits path[2][0] and path[1][0].
TEST(MutantL58_PathFirstColIsOne, TwoLeadingDeletesAfterSuffixMatch) {
    auto ops = Levenshtein::editops<string>("abcd", "cd");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
    EXPECT_EQ(std::get<0>(ops[1]), "delete");
    EXPECT_EQ(std::get<1>(ops[1]), 1);
    EXPECT_EQ(std::get<2>(ops[1]), 1);
}

// ============================================================================
// editops — match emits nothing (LV-12, LV-16 match guard)
// ============================================================================

// LV-12 / LV-16: match path (path==0) + dp equality guard suppress the op.
// Kills: cxx_eq_to_ne on dp!=dp guard (would emit spurious replaces on matches).
TEST(LVEditops, IdenticalStringsEmptyOps) {
    EXPECT_TRUE(Levenshtein::editops<string>("abc",   "abc"  ).empty());
    EXPECT_TRUE(Levenshtein::editops<string>("kitten","kitten").empty());
    EXPECT_TRUE(Levenshtein::editops<string>("a",     "a"    ).empty());
    EXPECT_TRUE(Levenshtein::editops<string>("",      ""     ).empty());
}

TEST(LVEditops, PartialMatchOnlyMismatchedOps) {
    auto ops = Levenshtein::editops<string>("ab", "ac");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 1);
    EXPECT_EQ(std::get<2>(ops[0]), 1);
}

// ============================================================================
// editops — path[i][j]=0 on MATCH cells (LV-12) — TARGET: [M-L71]
//
// Surviving mutant: cxx_assign_const at line 71.
//   Original: path[i][j] = 0;   (inside the `source[i-1]==target[j-1]` branch)
//   Mutant:   path[i][j] = 42;
//
// Analysis: the backtrace else-branch is entered for path values not equal to 1
// or -1.  Both 0 and 42 land in the else-branch.  Inside else, the replace guard
// checks dp[i][j] != dp[i-1][j-1].  For a TRUE MATCH, dp[i][j] == dp[i-1][j-1]
// (the match branch copied the diagonal without adding 1).  The guard evaluates
// FALSE → no op is emitted → i--,j-- → same behavior as path=0.
//
// Conclusion: this mutant is OBSERVATIONALLY EQUIVALENT through the public API.
// The tests below are the strongest possible coverage; they pass on the mutant.
//
// CANDIDATE BUG: cxx_assign_const line 71 is likely an equivalent mutant.
//   The else-branch dp equality check correctly discriminates match (dp equal,
//   no op) from substitute (dp differ by 1, op emitted) regardless of whether
//   the stored path value is 0 or 42.  No observable difference.
// ============================================================================

TEST(MutantL71_PathMatchSentinel, IdenticalStringEmitsNoOps) {
    // All interior cells are match cells → path[i][j]=0 (or 42 on mutant).
    // Either way else-branch fires, dp equal → no op. Same result.
    EXPECT_TRUE(Levenshtein::editops<string>("abc",    "abc"   ).empty());
    EXPECT_TRUE(Levenshtein::editops<string>("hello",  "hello" ).empty());
    EXPECT_TRUE(Levenshtein::editops<string>("a",      "a"     ).empty());
}

TEST(MutantL71_PathMatchSentinel, MixedMatchAndReplace) {
    // "xabc" → "yabc": cell (1,1) is a substitute (path set at line 85, not 71).
    // Cells (2,2),(3,3),(4,4) are matches (path set at line 71, or 42 on mutant).
    // Mutant: cells (2,2)..(4,4) have path=42 → else-branch → dp equal → no op.
    // Substitute cell (1,1): path=0 (not affected by line-71 mutant) → else → dp differ → emit replace.
    // Expected: one replace at (0,0).
    auto ops = Levenshtein::editops<string>("xabc", "yabc");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

TEST(MutantL71_PathMatchSentinel, AlternatingMatchAndReplace) {
    // "axbx" → "aybz": match 'a', replace 'x'→'y', match 'b', replace 'x'→'z'.
    // Match cells have path=0 (line 71); substitute cells have path=0 (line 85).
    // With line-71 mutant only match cells become 42 → still else-branch → no op emitted.
    // Expected: two replace ops.
    auto ops = Levenshtein::editops<string>("axbx", "aybz");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<0>(ops[1]), "replace");
}

// ============================================================================
// editops — path[i][j]=0 on SUBSTITUTION cells (LV-13) — TARGET: [M-L85]
//
// Surviving mutant: cxx_assign_const at line 85.
//   Original: path[i][j] = 0;   (substitution arm: min_cost != deletion, != insertion)
//   Mutant:   path[i][j] = 42;
//
// Analysis: same reasoning as line 71.  42 != 1 and 42 != -1 → else-branch.
// For a substitution cell, dp[i][j] = dp[i-1][j-1]+1 ≠ dp[i-1][j-1] → the guard
// fires true → emits "replace" and i--,j--.  Identical observable behavior to path=0.
//
// Conclusion: this mutant is also OBSERVATIONALLY EQUIVALENT.
//
// CANDIDATE BUG: cxx_assign_const line 85 is likely an equivalent mutant.
//   The dp inequality check inside the else-branch correctly identifies
//   substitutions (dp differ) regardless of whether path is 0 or 42.
// ============================================================================

TEST(MutantL85_PathSubstSentinel, SingleSubstituteEmitsReplace) {
    // Substitution cell at (3,3): path set at line 85 (or 42 on mutant).
    // Either way: else-branch, dp[3][3]=1 != dp[2][2]=0 → emit replace.
    auto ops = Levenshtein::editops<string>("abc", "abd");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 2);
    EXPECT_EQ(std::get<2>(ops[0]), 2);
}

TEST(MutantL85_PathSubstSentinel, AllSubstitutesEmitAllReplaces) {
    // "abc" → "xyz": all three cells are substitutions (line 85 path).
    // Mutant: all three get path=42 → else-branch → dp differ → emit replace each time.
    auto ops = Levenshtein::editops<string>("abc", "xyz");
    ASSERT_EQ(ops.size(), 3u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace"); EXPECT_EQ(std::get<1>(ops[0]), 0); EXPECT_EQ(std::get<2>(ops[0]), 0);
    EXPECT_EQ(std::get<0>(ops[1]), "replace"); EXPECT_EQ(std::get<1>(ops[1]), 1); EXPECT_EQ(std::get<2>(ops[1]), 1);
    EXPECT_EQ(std::get<0>(ops[2]), "replace"); EXPECT_EQ(std::get<1>(ops[2]), 2); EXPECT_EQ(std::get<2>(ops[2]), 2);
}

TEST(MutantL85_PathSubstSentinel, SubstWinsTieBreakEmitsReplace) {
    // "a"→"b": sub=dp[0][0]+1=1 < del=dp[0][1]+1=2, ins=dp[1][0]+1=2. Sub wins.
    // Path set via line 85. Mutant: path=42 → else → dp differ → still replace.
    auto ops = Levenshtein::editops<string>("a", "b");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

// ============================================================================
// editops — single op types and positions (LV-15, LV-17, LV-18)
// ============================================================================

// LV-17: labels are exactly "delete"/"insert"/"replace" (lowercase).
// LV-15: positions per formula: delete=(i-1,j), insert=(i,j-1), replace=(i-1,j-1).
// LV-18: source→target order (result of std::reverse at end).

TEST(LVEditops, SingleReplace_CanonicalLV18) {
    auto ops = Levenshtein::editops<string>("abc", "abd");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 2);
    EXPECT_EQ(std::get<2>(ops[0]), 2);
}

TEST(LVEditops, SingleInsert) {
    auto ops = Levenshtein::editops<string>("ab", "abc");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "insert");
    EXPECT_EQ(std::get<1>(ops[0]), 2);
    EXPECT_EQ(std::get<2>(ops[0]), 2);
}

TEST(LVEditops, SingleDelete) {
    auto ops = Levenshtein::editops<string>("abc", "ab");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 2);
    EXPECT_EQ(std::get<2>(ops[0]), 2);
}

TEST(LVEditops, ReplaceAtPositionZero) {
    auto ops = Levenshtein::editops<string>("abc", "xbc");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

// ============================================================================
// editops — path[0][j]=-1 first-row init (LV-11, insert column)
// ============================================================================

TEST(LVEditops, EmptySourceProducesAllInserts) {
    auto ops = Levenshtein::editops<string>("", "ab");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_EQ(std::get<0>(ops[0]), "insert");
    EXPECT_EQ(std::get<1>(ops[0]), 0); EXPECT_EQ(std::get<2>(ops[0]), 0);
    EXPECT_EQ(std::get<0>(ops[1]), "insert");
    EXPECT_EQ(std::get<1>(ops[1]), 0); EXPECT_EQ(std::get<2>(ops[1]), 1);
}

TEST(LVEditops, EmptyTargetProducesAllDeletes) {
    auto ops = Levenshtein::editops<string>("ab", "");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 0); EXPECT_EQ(std::get<2>(ops[0]), 0);
    EXPECT_EQ(std::get<0>(ops[1]), "delete");
    EXPECT_EQ(std::get<1>(ops[1]), 1); EXPECT_EQ(std::get<2>(ops[1]), 0);
}

// ============================================================================
// editops — tie-break priority: delete > insert > substitute (LV-13)
// ============================================================================

TEST(LVEditops, SingleCharSubstituteNoTie) {
    auto ops = Levenshtein::editops<string>("a", "b");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
}

TEST(LVEditops, TieBreakDeleteBeforeInsert) {
    // "ab" → "b": delete 'a' (cost 1); insertion path costs 2.
    auto ops = Levenshtein::editops<string>("ab", "b");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 1);
}

TEST(LVEditops, TieBreakDeleteOverSubstituteViaInit) {
    auto ops = Levenshtein::editops<string>("a", "");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "delete");
    EXPECT_EQ(std::get<1>(ops[0]), 0);
    EXPECT_EQ(std::get<2>(ops[0]), 0);
}

// ============================================================================
// editops — backtrace loop boundary: i>0 || j>0 (LV-14)
// ============================================================================

TEST(LVEditops, BacktraceConsumesAllInserts) {
    auto ops = Levenshtein::editops<string>("", "xyz");
    ASSERT_EQ(ops.size(), 3u);
    for (auto& op : ops) { EXPECT_EQ(std::get<0>(op), "insert"); }
}

TEST(LVEditops, BacktraceConsumesAllDeletes) {
    auto ops = Levenshtein::editops<string>("xyz", "");
    ASSERT_EQ(ops.size(), 3u);
    for (auto& op : ops) { EXPECT_EQ(std::get<0>(op), "delete"); }
}

// ============================================================================
// editops — order: source→target after std::reverse (LV-18)
// ============================================================================

TEST(LVEditops, TwoReplaceOpsInOrder) {
    auto ops = Levenshtein::editops<string>("ab", "xy");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace"); EXPECT_EQ(std::get<1>(ops[0]), 0); EXPECT_EQ(std::get<2>(ops[0]), 0);
    EXPECT_EQ(std::get<0>(ops[1]), "replace"); EXPECT_EQ(std::get<1>(ops[1]), 1); EXPECT_EQ(std::get<2>(ops[1]), 1);
}

TEST(LVEditops, MixedOpsOrderedBySourcePosition) {
    auto ops = Levenshtein::editops<string>("abc", "xc");
    ASSERT_EQ(ops.size(), 2u);
    EXPECT_LE(std::get<1>(ops[0]), std::get<1>(ops[1]));
}

// ============================================================================
// editops — dp[i][j] != dp[i-1][j-1] replace guard (LV-16)
// ============================================================================

TEST(LVEditops, SubstituteGuardEmitsForMismatch) {
    auto ops = Levenshtein::editops<string>("a", "b");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
}

TEST(LVEditops, SubstituteGuardSuppressesForMatch) {
    auto ops = Levenshtein::editops<string>("a", "a");
    EXPECT_TRUE(ops.empty());
}

TEST(LVEditops, PrefixMatchSuffixReplace) {
    auto ops = Levenshtein::editops<string>("xab", "xac");
    ASSERT_EQ(ops.size(), 1u);
    EXPECT_EQ(std::get<0>(ops[0]), "replace");
    EXPECT_EQ(std::get<1>(ops[0]), 2);
    EXPECT_EQ(std::get<2>(ops[0]), 2);
}

// ============================================================================
// editops — label string values are exactly lowercase (LV-17)
// ============================================================================

TEST(LVEditops, LabelStringsAreLowercase) {
    {
        auto ops = Levenshtein::editops<string>("a", "");
        ASSERT_EQ(ops.size(), 1u);
        EXPECT_EQ(std::get<0>(ops[0]), "delete");
        EXPECT_NE(std::get<0>(ops[0]), "Delete");
        EXPECT_NE(std::get<0>(ops[0]), "DELETE");
    }
    {
        auto ops = Levenshtein::editops<string>("", "a");
        ASSERT_EQ(ops.size(), 1u);
        EXPECT_EQ(std::get<0>(ops[0]), "insert");
        EXPECT_NE(std::get<0>(ops[0]), "Insert");
    }
    {
        auto ops = Levenshtein::editops<string>("a", "b");
        ASSERT_EQ(ops.size(), 1u);
        EXPECT_EQ(std::get<0>(ops[0]), "replace");
        EXPECT_NE(std::get<0>(ops[0]), "Replace");
    }
}

// ============================================================================
// editops — kitten→sitting integration (LV-10, LV-18)
// ============================================================================

TEST(LVEditops, KittenToSittingOpCount) {
    auto ops = Levenshtein::editops<string>("kitten", "sitting");
    ASSERT_EQ(ops.size(), 3u);
    for (auto& op : ops) {
        const string& label = std::get<0>(op);
        EXPECT_TRUE(label == "replace" || label == "insert" || label == "delete")
            << "Unexpected op label: " << label;
    }
    // Ops must be in non-decreasing source-position order (source→target order guarantee).
    for (std::size_t k = 1; k < ops.size(); ++k) {
        EXPECT_LE(std::get<1>(ops[k - 1]), std::get<1>(ops[k]));
    }
}
