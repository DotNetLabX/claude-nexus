# nexus-vue

**Your agents build Vue 3 front ends on settled patterns.**

- **Vue 3 Composition API patterns**: `<script setup>`, reactivity, composables, built-in components, URL state.
- **Pinia stores, Tailwind CSS v4 theming and component layout**, each with a skill.
- **A feature slice in one go**: route, view, store, API call and test.
- **A front-end review checklist** for the reviewer.
- **Vue tests with Vitest**: components by their behaviour, composables, Pinia stores, async work.
- **A flow-map profile for a Vue client** — with the paid `nexus-pro`.
- **Any back end.** Nothing here assumes .NET or any other server stack.

nexus-vue is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md).

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-vue@claude-nexus
```

It depends on `nexus`, so installing it installs the core with it. Then run `/reload-plugins` (or restart Claude Code) to activate.

## The Vue conventions file

The conventions are a file your project reads, not text inside the agents (the Read-Index model):

1. Copy this plugin's `conventions/vue.md` into your project's `docs/conventions/`.
2. Add the line `@vue.md` to `docs/conventions/coding-conventions.md`, the index the coding agents read before every
   task. Without that line no agent reads `vue.md`.
3. Copy it again after a plugin update — an update never refreshes your copy by itself.

**Re-copying another plugin's conventions folder?** A stack plugin's `conventions/` folder carries its own
`coding-conventions.md`, and `nexus-dotnet`'s no longer lists `vue.md`. After every such re-copy, add the `@vue.md`
line back to the index.

## Moving from nexus-dotnet

These skills shipped in `nexus-dotnet` up to its 2.1.x versions. A project that used them there installs this plugin
once, and re-adds `@vue.md` to its conventions index after it next re-copies `nexus-dotnet`'s `conventions/` folder.
