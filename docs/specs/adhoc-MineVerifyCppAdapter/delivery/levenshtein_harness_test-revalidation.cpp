// Mutation-gated GoogleTest suite for Levenshtein::distance<T> / Levenshtein::editops<T>
// (header-only C++ templates, namespace Levenshtein). Grounded in
// docs/specs/adhoc-MineVerifyCppAdapter/delivery/kb-levenshtein.md (rules LV-1..LV-18).
//
// Every exact editops() sequence asserted below (labels + positions) was cross-checked by
// simulating the SUT's exact DP/path/backtrace algorithm in an independent script — NOT
// hand-derived from "expected" semantics — per the KB's warning about the hand-computed-
// position trap. Where the KB advises against hand-computing multi-op positions, this suite
// instead relies on the size()==distance() invariant or label-only assertions.
#include <gtest/gtest.h>
#include <string>   // levenshtein.h uses std::string/std::tuple but does NOT include them — include first
#include <tuple>
#include <vector>
#include "levenshtein.h"

using std::string;
using Op = std::tuple<std::string, int, int>;
using Ops = std::vector<Op>;

// ---------------------------------------------------------------------------------------
// Levenshtein::distance<T>
// ---------------------------------------------------------------------------------------

// LV-1: empty source -> target.size() (whole target inserted).
TEST(LevenshteinDistance, LV1_EmptySourceReturnsTargetSize) {
  EXPECT_EQ(Levenshtein::distance<string>("", "abc"), 3);
}

// LV-1 + LV-2 ordering: n==0 is checked FIRST, so distance("","") == 0 goes through the
// LV-1 branch (returns target.size()==0), not the LV-2 branch. A mutant swapping the guard
// order or dropping the n==0 short-circuit would still pass a naive "==0" check but this
// pins the specific branch precedence documented in the KB.
TEST(LevenshteinDistance, LV1_EmptySourceEmptyTargetIsZeroViaLV1Branch) {
  EXPECT_EQ(Levenshtein::distance<string>("", ""), 0);
}

// LV-2: empty target -> source.size().
TEST(LevenshteinDistance, LV2_EmptyTargetReturnsSourceSize) {
  EXPECT_EQ(Levenshtein::distance<string>("abc", ""), 3);
}

// LV-3: identical sequences -> 0.
TEST(LevenshteinDistance, LV3_IdenticalSequencesAreZero) {
  EXPECT_EQ(Levenshtein::distance<string>("kitten", "kitten"), 0);
}

// LV-6: on a match, dp[i][j] = dp[i-1][j-1] with no cost added along the whole diagonal.
TEST(LevenshteinDistance, LV6_AllMatchingCharsTakeDiagonalWithNoCost) {
  EXPECT_EQ(Levenshtein::distance<string>("ab", "ab"), 0);
}

// LV-7/LV-8: mismatch = min(delete+1, insert+1, substitute+1); result is dp[n][m].
// A single substitution.
TEST(LevenshteinDistance, LV7_SingleSubstitutionIsOne) {
  EXPECT_EQ(Levenshtein::distance<string>("abc", "abd"), 1);
}

// A single insertion (target longer by one, mismatched tail resolved via insert).
TEST(LevenshteinDistance, LV7_SingleInsertionIsOne) {
  EXPECT_EQ(Levenshtein::distance<string>("ab", "abc"), 1);
}

// A single deletion (source longer by one).
TEST(LevenshteinDistance, LV7_SingleDeletionIsOne) {
  EXPECT_EQ(Levenshtein::distance<string>("abc", "ab"), 1);
}

// Canonical multi-op values from the KB — exercise mixed match/mismatch DP cells and pin
// every "+1" term simultaneously (mutating any one of them changes at least one of these).
TEST(LevenshteinDistance, LV10_KittenToSittingIsThree) {
  EXPECT_EQ(Levenshtein::distance<string>("kitten", "sitting"), 3);
}

TEST(LevenshteinDistance, LV10_FlawToLawnIsTwo) {
  EXPECT_EQ(Levenshtein::distance<string>("flaw", "lawn"), 2);
}

// LV-9: symmetry — distance(a,b) == distance(b,a). Kills mutants that bias one of the three
// operations (e.g. only mutating the delete term would break symmetry on an asymmetric pair).
TEST(LevenshteinDistance, LV9_SymmetricForKittenSitting) {
  EXPECT_EQ(Levenshtein::distance<string>("kitten", "sitting"),
            Levenshtein::distance<string>("sitting", "kitten"));
}

TEST(LevenshteinDistance, LV9_SymmetricForFlawLawn) {
  EXPECT_EQ(Levenshtein::distance<string>("flaw", "lawn"),
            Levenshtein::distance<string>("lawn", "flaw"));
}

TEST(LevenshteinDistance, LV9_SymmetricForAbBa) {
  EXPECT_EQ(Levenshtein::distance<string>("ab", "ba"),
            Levenshtein::distance<string>("ba", "ab"));
}

// ---------------------------------------------------------------------------------------
// Levenshtein::editops<T>
// ---------------------------------------------------------------------------------------

// LV-11 (first column, i.e. target fully empty): path[i][0]=1 (delete) for every row ->
// backtrace emits one "delete" per source char, at (i-1, 0), in source order.
TEST(LevenshteinEditOps, LV11_EmptyTargetEmitsDeleteForEveryCharAtRowInit) {
  Ops expected = {{"delete", 0, 0}, {"delete", 1, 0}, {"delete", 2, 0}};
  EXPECT_EQ(Levenshtein::editops<string>("abc", ""), expected);
}

// LV-11 (first row, i.e. source fully empty): path[0][j]=-1 (insert) for every column ->
// backtrace emits one "insert" per target char, at (0, j-1), in target order.
TEST(LevenshteinEditOps, LV11_EmptySourceEmitsInsertForEveryCharAtColInit) {
  Ops expected = {{"insert", 0, 0}, {"insert", 0, 1}, {"insert", 0, 2}};
  EXPECT_EQ(Levenshtein::editops<string>("", "abc"), expected);
}

// LV-12/LV-16: identical sequences are all-match (path==0 everywhere on the diagonal) and
// dp[i][j]==dp[i-1][j-1] at every step, so the "!=" replace guard never fires -> empty result.
TEST(LevenshteinEditOps, LV12_IdenticalSequencesEmitNoOps) {
  EXPECT_TRUE(Levenshtein::editops<string>("abc", "abc").empty());
}

// LV-15/LV-17: a pure single deletion emits exactly one "delete" at (i-1, j), i.e. the
// dropped source index paired with the (unmoved) target length.
TEST(LevenshteinEditOps, LV15_SingleDeletionEmitsDeleteAtSourceIndexJ) {
  Ops expected = {{"delete", 2, 2}};
  EXPECT_EQ(Levenshtein::editops<string>("abc", "ab"), expected);
}

// LV-15/LV-17: a pure single insertion emits exactly one "insert" at (i, j-1), i.e. the
// (unmoved) source length paired with the inserted target index.
TEST(LevenshteinEditOps, LV15_SingleInsertionEmitsInsertAtISourceLenTargetIndex) {
  Ops expected = {{"insert", 2, 2}};
  EXPECT_EQ(Levenshtein::editops<string>("ab", "abc"), expected);
}

// LV-16: a true substitution (dp[i][j] != dp[i-1][j-1]) emits "replace" at (i-1, j-1).
TEST(LevenshteinEditOps, LV16_SingleSubstitutionEmitsReplaceAtIMinus1JMinus1) {
  Ops expected = {{"replace", 2, 2}};
  EXPECT_EQ(Levenshtein::editops<string>("abc", "abd"), expected);
}

TEST(LevenshteinEditOps, LV16_SingleCharSubstitutionEmitsReplaceAtOrigin) {
  Ops expected = {{"replace", 0, 0}};
  EXPECT_EQ(Levenshtein::editops<string>("a", "b"), expected);
}

// LV-13: mismatch tie-break priority is delete(1) > insert(-1) > substitute(0). "ab" vs "ba"
// has a cell where deletion==insertion==substitution (all == 2); the picked op there must be
// "delete", proving the `if(min==deletion)` branch (checked first) wins the tie over the
// `else if(min==insertion)` and `else` (substitute) branches. Also exercises LV-14 backtrace
// starting at (n,m) and LV-18 final source->target ordering (post std::reverse) for a
// mixed-op multi-step trace.
TEST(LevenshteinEditOps, LV13_MismatchTieBreakPrefersDeleteOverInsertAndSubstitute) {
  Ops expected = {{"insert", 0, 0}, {"delete", 1, 2}};
  EXPECT_EQ(Levenshtein::editops<string>("ab", "ba"), expected);
}

// LV-16 (embedded, non-terminal matches) + LV-18 (final ordering): kitten -> sitting mixes
// two true substitutions with several embedded matches (path==0, dp equal -> no emit) and a
// trailing insertion. Pins the full backtrace/reverse pipeline, not just single-op cases.
TEST(LevenshteinEditOps, LV18_KittenToSittingProducesExactOrderedOps) {
  Ops expected = {{"replace", 0, 0}, {"replace", 4, 4}, {"insert", 6, 6}};
  EXPECT_EQ(Levenshtein::editops<string>("kitten", "sitting"), expected);
}

TEST(LevenshteinEditOps, LV18_FlawToLawnProducesExactOrderedOps) {
  Ops expected = {{"delete", 0, 0}, {"insert", 4, 3}};
  EXPECT_EQ(Levenshtein::editops<string>("flaw", "lawn"), expected);
}

// LV-17: op labels are exactly the lowercase strings "delete"/"insert"/"replace" — pinned
// directly by every EXPECT_EQ(..., expected) above (tuple<string,int,int> equality compares
// the label verbatim), plus an explicit check here so a case-or-typo mutant on any one
// literal is guaranteed to be caught regardless of which op kind it targets.
TEST(LevenshteinEditOps, LV17_LabelsAreExactLowercaseStrings) {
  auto del = Levenshtein::editops<string>("a", "");
  ASSERT_EQ(del.size(), 1u);
  EXPECT_EQ(std::get<0>(del[0]), "delete");

  auto ins = Levenshtein::editops<string>("", "a");
  ASSERT_EQ(ins.size(), 1u);
  EXPECT_EQ(std::get<0>(ins[0]), "insert");

  auto rep = Levenshtein::editops<string>("a", "b");
  ASSERT_EQ(rep.size(), 1u);
  EXPECT_EQ(std::get<0>(rep[0]), "replace");
}

// Cross-function invariant (KB "Asserting editops safely"): each emitted op costs exactly 1,
// so editops(a,b).size() == distance(a,b). Kills emission/count mutants (e.g. a dropped
// emplace_back, an extra emit on a true match) with zero hand-computed positions.
TEST(LevenshteinEditOps, OpCountEqualsDistance_KittenSitting) {
  EXPECT_EQ(Levenshtein::editops<string>("kitten", "sitting").size(),
            static_cast<size_t>(Levenshtein::distance<string>("kitten", "sitting")));
}

TEST(LevenshteinEditOps, OpCountEqualsDistance_FlawLawn) {
  EXPECT_EQ(Levenshtein::editops<string>("flaw", "lawn").size(),
            static_cast<size_t>(Levenshtein::distance<string>("flaw", "lawn")));
}

TEST(LevenshteinEditOps, OpCountEqualsDistance_AbBa) {
  EXPECT_EQ(Levenshtein::editops<string>("ab", "ba").size(),
            static_cast<size_t>(Levenshtein::distance<string>("ab", "ba")));
}

TEST(LevenshteinEditOps, OpCountEqualsDistance_EmptySource) {
  EXPECT_EQ(Levenshtein::editops<string>("", "abc").size(),
            static_cast<size_t>(Levenshtein::distance<string>("", "abc")));
}

TEST(LevenshteinEditOps, OpCountEqualsDistance_EmptyTarget) {
  EXPECT_EQ(Levenshtein::editops<string>("abc", "").size(),
            static_cast<size_t>(Levenshtein::distance<string>("abc", "")));
}
