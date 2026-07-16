# Broken Adapter (test fixture — not a real stack adapter, ships nothing)

This file is a **deliberately broken** stack-adapter capability table, used only by
`tests/unit/capability-contract.test.mjs` to prove the R3/ADR-60 capability-contract checker can
FAIL (the mine family's own vacuous-evidence rule: a gate that cannot fail is no gate). It is not a
real adapter, is not discovered by any real skill glob, and ships nothing.

## The 5 capabilities, filled for Broken

| Capability | Broken fill |
|------------|-------------|
| Evidence indexer | the miner reads the target source file directly |
| Test runner | `some-test-runner` — run twice for suite_green + no_flaky |
| Mutation tool | mutates the target file somehow, no tool named |
| Test-style contract | `SomeTestFramework` test() functions |
| Prod-source-diff scoping | `git diff -- src/` for char_pin |
