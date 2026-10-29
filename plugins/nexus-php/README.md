# nexus-php

**95%+ test coverage on PHP and Laravel.**

- **Tests that catch injected bugs in your PHP and Laravel classes.**
- **Your repository is never touched.** The run works on a copy.
- **Pest-compatible tests**, from a toolchain that ships ready to run in Docker.

nexus-php is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md). It is the PHP toolchain of the paid `nexus-miner`, which writes the tests; it needs Docker.

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-php@claude-nexus
```

It depends on `nexus`, so installing it installs the core with it. Then run `/reload-plugins` (or restart Claude Code) to activate.
