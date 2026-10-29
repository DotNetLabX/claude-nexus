# nexus-cpp

**95%+ test coverage on C and C++.**

- **Tests that catch injected bugs in your C and C++** — functions, classes and header-only templates.
- **Runs wherever Docker runs, Windows included.** No compiler setup on your machine.
- **The toolchain ships ready to run.**

nexus-cpp is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md). It is the C and C++ toolchain of the paid `nexus-miner`, which writes the tests; it needs Docker.

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-cpp@claude-nexus
```

It depends on `nexus`, so installing it installs the core with it. Then run `/reload-plugins` (or restart Claude Code) to activate.
