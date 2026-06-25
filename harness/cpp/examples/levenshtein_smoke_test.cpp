// Seed pattern test for the Levenshtein cover run — shows the include ORDER + call STYLE the Cover agent
// mirrors. levenshtein.h is header-only C++ (namespace Levenshtein), templated over a sequence type.
#include <gtest/gtest.h>
#include <string>   // levenshtein.h uses std::string/std::tuple but does NOT include them — include first
#include <tuple>
#include <vector>
#include "levenshtein.h"

using std::string;

// distance: pure int return — assert directly on it.
TEST(LevenshteinSmoke, IdenticalIsZero) {
  EXPECT_EQ(Levenshtein::distance<string>("kitten", "kitten"), 0);
}
TEST(LevenshteinSmoke, KittenToSitting) {
  EXPECT_EQ(Levenshtein::distance<string>("kitten", "sitting"), 3);
}
TEST(LevenshteinSmoke, EmptySourceReturnsTargetLen) {
  EXPECT_EQ(Levenshtein::distance<string>("", "abc"), 3);
}

// editops: returns an ordered vector<tuple<string,int,int>>; assert label + positions + count.
TEST(LevenshteinSmoke, SingleReplace) {
  auto ops = Levenshtein::editops<string>("abc", "abd");
  ASSERT_EQ(ops.size(), 1u);
  EXPECT_EQ(std::get<0>(ops[0]), "replace");
  EXPECT_EQ(std::get<1>(ops[0]), 2);
  EXPECT_EQ(std::get<2>(ops[0]), 2);
}
TEST(LevenshteinSmoke, MatchEmitsNoOps) {
  EXPECT_TRUE(Levenshtein::editops<string>("abc", "abc").empty());
}
