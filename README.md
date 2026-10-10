# claude-nexus

**Nexus turns [Claude Code](https://docs.anthropic.com/en/docs/claude-code) into a full engineering team: a product owner, an architect, a developer and reviewers — each a separate agent.**

- **Every feature gets a spec, a plan, the code and an independent review.** Not one long chat that forgets where it started.
- **Two pairs of eyes are better than one.** A different AI model reviews the code and catches what the first missed.
- **Codex on your review team.** It reviews every spec, plan and change — a second AI family checking the first.
- **Several reviewers at the same time, for faster delivery.** All checks run side by side, not one after another.
- **Several review rounds, for code quality.** Findings are fixed and reviewed again before anything is called done.
- **It never guesses.** An open question comes to you with a recommendation, never as a hidden assumption.
- **It auto-learns.** What the team learns on every feature becomes your conventions and your skills.
- **It works in your stack.** Packs for .NET and Vue, Flutter, C++ and PHP — or the language of your choice.

Stack extensions teach it your stack; four paid plugins add extras for shaping, review and reporting, rule mining, data analysis and meeting-notes search.

## And there is more

- **The developer builds only what is in the spec.** Nothing extra slips in, nothing is skipped.
- **The spec and the plan are reviewed too** — before a line of code is written.
- **Leave it working while you are away.** It keeps going without asking, and hands you the list of what it decided.
- **Your session closed or crashed? Don't worry.** You resume it from where it was.
- **The agents cannot cut corners.** 30 automatic checks police how they work and block dangerous commands.
- **Small fix? One command.** `/nexus:solo` agrees the approach with you, then makes the change.

## How a feature moves

```
You → PO (spec) → Architect (plan) → Developer (build)
    → Architect (done check) + Reviewer (code review), side by side → Done
```

- Eight roles: product owner, architect, developer, reviewer, critic, learner, team lead and solo.
- The team lead routes every message, so each change of scope passes one place where you can step in.
- A fix goes back to the developer at most three times before it is escalated.
- Run the whole pipeline with `/nexus:team-lead`, or take one role yourself — `/nexus:po`, `/nexus:architect`, `/nexus:developer`, `/nexus:reviewer`.

## The proof

- **Scored against another agent.** Three AI judges scored how Nexus's agents are instructed, equipped, policed and coordinated against another open-source coding agent, on a scoring sheet fixed in advance: **4.2 out of 5 for Nexus, 2.6 for the other** — and **5 out of 5 on enforcement** from all three.
- **Enforcement you can inspect.** The 30 hook commands run on 7 Claude Code events. They put the team's working rules in front of every session and every spawned agent, block dangerous commands, stop a role that may not write code from editing your source, and record the test result when an agent hands work back.
- **The guard.** It blocks deleting a root or home folder, `sudo`, force-pushes, `git reset --hard`, piping a download into a shell, reading secret files and writing outside the project. A stricter mode for teams and CI also blocks every push, network install and network fetch.

## The plugins

| Plugin | For | Install id |
|--------|-----|------------|
| **nexus** | Every project — the core | `nexus@claude-nexus` |
| **nexus-dotnet** | .NET and Vue projects | `nexus-dotnet@claude-nexus` |
| **nexus-flutter** | Flutter projects | `nexus-flutter@claude-nexus` |
| **nexus-cpp** | C and C++ projects | `nexus-cpp@claude-nexus` |
| **nexus-php** | PHP and Laravel projects | `nexus-php@claude-nexus` |
| **nexus-channels** | Projects with more than one source of knowledge | `nexus-channels@claude-nexus` |

Every extension depends on `nexus`, so installing one installs the core with it.

### nexus-dotnet — your agents build .NET services the way a senior team does

- **113 settled .NET coding rules, taught by example.** Every code sample obeys the rules it teaches.
- **A skill for every piece of a service**: services, modules and feature slices, aggregates and domain events, CQRS, EF Core, gRPC, integration events, background jobs, typed HTTP clients, authorization, Redis, file storage.
- **The front end too**: Vue 3, Pinia and Tailwind, with a review checklist.
- **Your conventions, enforced by a test.** The check fails when code breaks a convention, and names the rule.
- **It looks before it builds.** Your own helpers and shared libraries are reused, not written twice.
- **Architecture problems found before they cost you**: coupling hotspots, leaky boundaries, thin domain models.
- **Always on the latest stable .NET.**
- **95%+ test coverage on your C# classes** — with `nexus-miner`.

### nexus-flutter — from a Figma design to a pixel-accurate Flutter widget

- **Figma node in, Flutter widget out.** Exact paddings, colours, typography and icons.
- **Built from your design system**, read from the real design values — never guessed from a screenshot.
- **95%+ test coverage on your Dart classes** — with `nexus-miner`.
- **Your user flows tested on a real device** — with `nexus-miner`.

### nexus-cpp — 95%+ test coverage on C and C++

- **Tests that catch injected bugs in your C and C++** — functions, classes and header-only templates. With `nexus-miner`.
- **Runs wherever Docker runs, Windows included.** No compiler setup on your machine.
- **The toolchain ships ready to run.**

### nexus-php — 95%+ test coverage on PHP and Laravel

- **Tests that catch injected bugs in your PHP and Laravel classes.** With `nexus-miner`.
- **Your repository is never touched.** The run works on a copy.
- **Pest-compatible tests**, from a toolchain that ships ready to run in Docker.

### nexus-channels — your agents answer from the right source, every time

- **One file decides the source** for your docs, your knowledge base, your notes: the local copy, a remote server, or both.
- **Always the current version.** The local copy while it is up to date, the remote the moment it is not.
- **Off-limits means off-limits.** Every session checks that the sources you ruled out are really blocked.
- **Every answer names its source and its version.**
- **Set up in one conversation.**

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus@claude-nexus
```

Install a stack extension the same way — for example `/plugin install nexus-dotnet@claude-nexus`. Each command also runs in a terminal as `claude plugin …`.

Update with `claude plugin marketplace update claude-nexus`, then `claude plugin update nexus@claude-nexus`.

## Paid plugins

Four more plugins build on the core. Each lives in its own private repository, which is its own marketplace, and each repository's README carries its install lines.

- `DotNetLabX/claude-nexus-pro` — `nexus-pro`: eight extras for the core's own pipeline.
  - **Brainstorm mode.** Rounds of ideas before the questions start, every idea kept in a file beside the spec.
  - **Panel mode.** A second model argues your design question on its own; you get one merged answer and what the two still disagree on.
  - **Research.** An open fact is researched once, on the web or through Codex, saved with its sources and reused.
  - **Conventions review.** A separate advisory review of a change against your own conventions, architecture and patterns.
  - **Skill evaluation.** A skill is graded against a fixed rubric, and the findings are written down, ready to fix.
  - **Slow-test tagging.** Your suite is timed and its slow tests are tagged, so the quick run leaves them out; every close re-times the tests that changed.
  - **Token report.** Which agent used the most tokens in a run, and why.
  - **Usage record.** A numbers-only record of each feature's tokens, times and models, committed at its close.
- `DotNetLabX/claude-nexus-miner` — `nexus-miner`: 95%+ test coverage backed by rules mined from your code, old code rewritten in the architecture you choose, a map of your system and a skills package for your agents.
- `DotNetLabX/claude-nexus-analytics` — `nexus-analytics`: it mines your database and builds your semantic model for you, then answers business questions in plain words with numbers you can defend.
- `DotNetLabX/claude-nexus-notes` — `nexus-notes`: every decision from your meetings in front of whoever writes the spec, and a record of which note fed which feature.

**Get access:** the paid repositories are private. Ask the owner through the [DotNetLabX organisation on GitHub](https://github.com/DotNetLabX).

## What you need

- **Claude Code.** Nexus is built on its plugins, hooks and agents, and runs nowhere else.
- **`nexus-miner`** (paid), for every test-coverage line above. nexus-cpp and nexus-php are its toolchains and are installed for it.
- **Docker**, for the C++ and PHP toolchains only.
- **Figma's connector for Claude Code**, for the Figma-to-Flutter skill only.

## License

[MIT](LICENSE)
