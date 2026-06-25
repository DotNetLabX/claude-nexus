// Harness infrastructure — exit() neutralization for the mutation cover run.
// NOT a test, and NEVER mutated (mull.yml includePaths scopes mutation to the slice under test only).
//
// WHY: hungarian_solve() calls exit(0) in its internal doublecheck (KB BR-29/30/31, src lines 371/376/383).
// A mutant that breaks an algorithm invariant trips that check -> exit(0) -> WITHOUT this wrap the process
// exits status 0 BEFORE the test asserts -> the runner sees "passed" -> the mutant SURVIVES undetectably.
// That blind spot capped the first live Hungarian run at 46% reachable kill; the wrap lifted it to 64%.
//
// HOW: `-Wl,--wrap=exit` (the test target's link options) redirects every exit() reference from our objects
// to __wrap_exit; the real libc exit is reachable as __real_exit. We turn exit(0) into a NON-ZERO process
// exit so mull marks the tripping mutant KILLED (and the baseline suite would go red if exit ever fired on
// valid input — which, per the KB, it does not). Returning from main() is unaffected: glibc's main-return
// exit is resolved inside libc, not via our final link, so --wrap never sees it.
#include <cstdio>

extern "C" {
[[noreturn]] void __real_exit(int code);

[[noreturn]] void __wrap_exit(int code) {
  std::fprintf(stderr,
               "[exit-wrap] intercepted exit(%d) from the SUT; failing the run (mutation guard)\n", code);
  // exit(0) is the masking case — force non-zero so the runner records a failure. A genuine non-zero
  // exit is passed through unchanged (still a failure, which is correct).
  __real_exit(code == 0 ? 99 : code);
}
}
