# nexus-channels

**Your agents answer from the right source, every time.**

- **One file decides the source** for your docs, your knowledge base, your notes: the local copy, a remote server, or both.
- **Always the current version.** The local copy while it is up to date, the remote the moment it is not.
- **Off-limits means off-limits.** Every session checks that the sources you ruled out are really blocked.
- **Every answer names its source and its version.**
- **Set up in one conversation.** Say "set up the knowledge channels" and it drafts the file for you to confirm.

nexus-channels is a free plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), part of [Nexus](../../README.md).

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus-channels@claude-nexus
```

It depends on `nexus`, so installing it installs the core with it. Then run `/reload-plugins` (or restart Claude Code) to activate.
