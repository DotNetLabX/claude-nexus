# nexus-flutter

**From a Figma design to a pixel-accurate Flutter widget.**

- **Figma node in, Flutter widget out.** Exact paddings, colours, typography and icons.
- **Built from your design system**, read from the real design values — never guessed from a screenshot.
- **95%+ test coverage on your Dart classes** — with the paid `nexus-miner`.
- **Your user flows tested on a real device** — with the paid `nexus-miner`.

nexus-flutter is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md).

## What's inside

A **thin Dart / Flutter stack extension** for the `nexus` core pipeline. It declares `dependencies: ["nexus"]`,
so installing it auto-installs and enables `nexus`, then layers the stack on top.

It ships **no agents, rules, commands, or hook registrations** — those come from `nexus`. It adds only:

| Component | Count | Notes |
|-----------|-------|-------|
| **Skills** | 3 | `figma-to-flutter` (design fidelity), and the Dart/Flutter adapters `mine-verify-cover-flutter` and `mine-verify-flows-flutter`, which need `nexus-miner`. |
| **Test runner** | 1 | `hooks/scripts/test-runner.js` — how `flutter test` and `dart test` run, for the core's test runs: named-file runs, the slow tag with its `dart_test.yaml` entry, the per-test stop, and what the slow-test timing leaves out. The core finds it in this plugin; without it, a Flutter repo's step checks run the declared `unit` whole. It needs a `nexus` core that ships the runner contract. |

## Install (alongside nexus)

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-flutter@claude-nexus
```

Then run `/reload-plugins` (or restart Claude Code) to activate.
