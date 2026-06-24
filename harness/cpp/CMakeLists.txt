cmake_minimum_required(VERSION 3.16)
project(hungarian_probe C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Mutation builds want -O0 -g so mull can map IR back to source lines.
set(CMAKE_BUILD_TYPE Debug)

# Optional mull pass-plugin wiring — enabled with -DMULL=ON for the mutation build.
option(MULL "Compile with the mull IR pass plugin" OFF)
if(MULL)
  add_compile_options(-O0 -g -grecord-command-line -fpass-plugin=/usr/lib/mull-ir-frontend-15)
endif()

# The slice under test (real SDK file, unmodified). extern "C" header, compiled as C++.
add_library(hungarian STATIC src/hungarian.cpp)
target_include_directories(hungarian PUBLIC src)

enable_testing()
find_package(GTest REQUIRED)
add_executable(hungarian_smoke_test tests/hungarian_smoke_test.cpp)
target_link_libraries(hungarian_smoke_test PRIVATE hungarian GTest::gtest GTest::gtest_main)

include(GoogleTest)
gtest_discover_tests(hungarian_smoke_test)
