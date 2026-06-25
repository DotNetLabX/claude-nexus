#include <gtest/gtest.h>
#include <vector>
#include <cstdlib>

extern "C" {
#include "hungarian.h"
}

namespace {
int** make_matrix(const std::vector<std::vector<int>>& m) {
  int** a = static_cast<int**>(malloc(m.size() * sizeof(int*)));
  for (size_t i = 0; i < m.size(); ++i) {
    a[i] = static_cast<int*>(malloc(m[i].size() * sizeof(int)));
    for (size_t j = 0; j < m[i].size(); ++j) a[i][j] = m[i][j];
  }
  return a;
}
void free_matrix(int** a, size_t rows) {
  for (size_t i = 0; i < rows; ++i) free(a[i]);
  free(a);
}
}  // namespace

// The cost matrix [[1,2,3],[2,4,6],[3,6,9]] has a UNIQUE minimum-cost assignment:
// row0->col2, row1->col1, row2->col0, total = 3+4+3 = 10. Pinning the exact mates
// (not just the total) gives mull more behaviour to kill.
TEST(Hungarian, MinimizesToUniqueOptimalAssignment) {
  const std::vector<std::vector<int>> cost = {{1, 2, 3}, {2, 4, 6}, {3, 6, 9}};
  int** cm = make_matrix(cost);

  hungarian_problem_t p;
  const int n = hungarian_init(&p, cm, 3, 3, HUNGARIAN_MODE_MINIMIZE_COST);
  ASSERT_EQ(n, 3);

  hungarian_solve(&p);

  std::vector<int> mate(3, -1);
  int total = 0;
  for (int i = 0; i < 3; ++i)
    for (int j = 0; j < 3; ++j)
      if (p.assignment[i][j] == HUNGARIAN_ASSIGNED) {
        mate[i] = j;
        total += cost[i][j];
      }

  EXPECT_EQ(mate[0], 2);
  EXPECT_EQ(mate[1], 1);
  EXPECT_EQ(mate[2], 0);
  EXPECT_EQ(total, 10);

  // Valid permutation: every column assigned exactly once.
  std::vector<int> colcount(3, 0);
  for (int i = 0; i < 3; ++i) {
    ASSERT_GE(mate[i], 0);
    colcount[mate[i]]++;
  }
  for (int c = 0; c < 3; ++c) EXPECT_EQ(colcount[c], 1);

  hungarian_free(&p);
  free_matrix(cm, 3);
}
