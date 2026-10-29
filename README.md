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

Stack extensions teach it your stack; eight paid plugins add extras for shaping, review and reporting, rule mining, data analysis, meeting-notes search, building several features side by side while you are away, a digital you that learns how you decide, and a product owner's lane from meeting notes to tracker tickets, with its Jira extension.

## And there is more

- **The developer builds only what is in the spec.** Nothing extra slips in, nothing is skipped.
- **The spec and the plan are reviewed too** — before a line of code is written.
- **Leave it working while you are away.** It keeps going without asking, and hands you the list of what it decided.
- **Your session closed or crashed? Don't worry.** You resume it from where it was.
- **The agents cannot cut corners.** 30 automatic checks police how they work and block dangerous commands.
- **Small fix? One command.** `/nexus:solo` agrees the approach with you, then makes the change.
- **A stuck test fails in seconds.** Every test has its own stop — 3 seconds, or 30 for a test marked slow — and a timeout is reported apart from a real failure. Each test a step adds or changes is timed as it is built and marked slow when it is.

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
- **Enforcement you can inspect.** The 31 hook commands run on 7 Claude Code events. They put the team's working rules in front of every session and every spawned agent, block dangerous commands, stop a role that may not write code from editing your source, and record the test result when an agent hands work back.
- **The guard.** It blocks deleting a root or home folder, `sudo`, force-pushes, `git reset --hard`, piping a download into a shell, reading secret files and writing outside the project. A stricter mode for teams and CI also blocks every push, network install and network fetch.

## Free plugins

| Plugin | For | Install id |
|--------|-----|------------|
| [**nexus**](plugins/nexus) | Every project — the core | `nexus@claude-nexus` |
| [**nexus-dotnet**](plugins/nexus-dotnet) | .NET and Vue projects — your agents build services the way a senior team does | `nexus-dotnet@claude-nexus` |
| [**nexus-flutter**](plugins/nexus-flutter) | Flutter projects — from a Figma design to a pixel-accurate widget | `nexus-flutter@claude-nexus` |
| [**nexus-cpp**](plugins/nexus-cpp) | C and C++ projects — 95%+ test coverage, in Docker | `nexus-cpp@claude-nexus` |
| [**nexus-php**](plugins/nexus-php) | PHP and Laravel projects — 95%+ test coverage, in Docker | `nexus-php@claude-nexus` |
| [**nexus-channels**](plugins/nexus-channels) | Projects with more than one source of knowledge — every answer from the right one | `nexus-channels@claude-nexus` |

Every extension depends on `nexus`, so installing one installs the core with it. Click a plugin to see what it does.

## Want the end-to-end experience? Go pro (paid)

| Plugin | What you get | Repository |
|--------|--------------|------------|
| [**nexus-pro**](#nexus-pro) | Twelve extras that get more out of every feature | `DotNetLabX/claude-nexus-pro` |
| [**nexus-miner**](#nexus-miner) | Tests, rules, maps and rewrites mined from the code you already have | `DotNetLabX/claude-nexus-miner` |
| [**nexus-analytics**](#nexus-analytics) | Business questions in plain words, numbers you can defend | `DotNetLabX/claude-nexus-analytics` |
| [**nexus-notes**](#nexus-notes) | Every meeting decision in front of whoever writes the spec | `DotNetLabX/claude-nexus-notes` |
| [**nexus-product**](#nexus-product) | A product owner's lane, from meeting notes to tracker tickets | `DotNetLabX/claude-nexus-product` |
| [**nexus-product-jira**](#nexus-product-jira) | That lane on Jira Cloud | `DotNetLabX/claude-nexus-product-jira` |
| [**nexus-factory**](#nexus-factory) | Several features built side by side while you are away | `DotNetLabX/claude-nexus-factory` |
| [**nexus-digital-you**](#nexus-digital-you) | A digital you that learns how you decide | `DotNetLabX/claude-nexus-digital-you` |

Each paid plugin lives in its own private repository, which is its own marketplace and carries its install lines.

**Get access:** ask the owner through the [DotNetLabX organisation on GitHub](https://github.com/DotNetLabX).

### nexus-pro

**Twelve extras for the Nexus pipeline — for when you already like the core and want more from every feature.**

- **Brainstorm mode — ideas, then straight into the critique.** Short rounds of ideas you pick from, then every idea you chose is challenged before anything reaches the spec.
- **Panel mode — a second mind on a design question.** A model from another family drafts its own position; you get one merged answer and every remaining disagreement written down.
- **Research — find it out once, reuse it.** A fact nobody knows is researched on the web or through Codex, saved with its sources, and reused by the next agent that needs it.
- **Conventions review — a change read against your own rules.** Every comment cites the rule it rests on, or it is dropped.
- **Skill evaluation — your skills, graded.** Scored against a fixed rubric, findings written down by severity, ready to fix.
- **Slow-test tagging — a quick test run that stays quick.** Your whole suite is timed and its slow tests are tagged, so the quick run leaves them out.
- **Token report — where the tokens went.** Which agent costs the most, and why.
- **Usage record — what every feature cost, on record.** Tokens, times, models and versions, committed at every close. No conversation text, no file contents.
- **Custom gears — your own pipeline gear.** A new name, a base gear, and only the settings it changes.
- **Flow atlas — which classes run for each entry point.** One page per endpoint, route, job or consumer, down to storage, marked stale the moment the code moves.
- **Live agent view — see what every agent is doing.** Each agent's row names its role, and a developer's shows its step, tokens and time — `dev-s1 · step 3/7 · 420k · 9 min`.
- **Suite methods for app agents.** When your app's own agents run on a model's API, their prompts start from a tested method instead of a blank page.

### nexus-miner

**Mine the code you already have. Walk away with tests that catch bugs, rules your agents can read, a map of your system — and old code rewritten your way.**

- **95%+ test coverage, backed by rule behaviours mined from your code.** Measured the hard way: the share of deliberately injected bugs your tests catch. On .NET, Flutter, C++ and PHP.
- **Rewrite your old code with modern patterns, in the architecture you choose.** Rebuilt from its mined rules, every verified behaviour kept, each run ending in a clear go or no-go.
- **A technical skills package.** The patterns worth teaching — from a project you admire, your conventions, your own code — become skills your agents follow.
- **A code map of your architecture.** Its modules, what each does for the business, who owns which data, where the seams are.
- **A registry of every business rule your code enforces**, tied to the code behind it — your agents read it before they change that code.
- **Also in the box:** a ranked technical-debt backlog, conventions mined from your code and voted by you, an honest audit of your existing tests, the bugs already hiding in your old code, and on-device tests for your app's user flows.
- **The proof:** 100% on .NET, 100% on Flutter, 97.8% on C++ — injected bugs caught, on record. A class with 141 mined rules was regenerated and passed 97 of 97 tests on the first run.

### nexus-analytics

**Ask a business question in plain words. Get a number you can defend.**

- **It mines your database and builds your semantic model for you.** No model written by hand — and it asks you only what the data cannot tell it.
- **Answers from your live data, through your own definitions.** Never a guessed query.
- **Same question, same number — whoever asks.**
- **No silent assumptions.** Missing a date range or a market? It asks before it runs anything.
- **Every number shows its working, and is run again before you see it.**
- **It tells you what to watch.** Outliers, turning points, trends and who drives the total — ranked, and proven on later data.
- **Charts on request, and saved questions you run again by name.**

### nexus-notes

**Every decision from your meetings, in front of whoever writes the spec.**

- **Find what was decided, in plain words.** "What did we decide about imports last week?" — and you get a ranked list of notes.
- **Know where every requirement came from.** Each note a feature is built on is recorded against that feature.
- **Nothing decided is forgotten.** One view shows the notes no feature has picked up yet.
- **Spot notes that changed after they were used.**
- **Your notes stay untouched**, and nothing is claimed without your yes.

### nexus-product

**A product owner's lane, from meeting notes to tracker tickets.**

- **Specs from what was decided.** From your meeting notes, a Google Doc or a Word file.
- **Stories your team can build.** One sub-task per team, every acceptance criterion checkable pass or fail.
- **Estimates from your own history.** Points from your team's own closed tickets, with the reference used and how sure the estimate is.
- **Reviewed before it ships.** An independent reviewer reads the spec and the stories together.
- **Nothing written without your yes.** Every publish checks for duplicates and shows a preview first.
- **Shared with your team, no git needed.**

### nexus-product-jira

**The product owner's lane on Jira Cloud.**

- **Every ticket it needs, through one extension.** Projects, sprints, estimates, the duplicate search, and every create, edit and read-back.
- **Your token stays yours.** Read only to sign in, never shown in a session.
- **Nothing lost on an edit.** A ticket is read before it changes and again after, and nothing it already carries is removed.

### nexus-factory

**Hand it a list of ready features. Come back to finished branches and one report.**

- **Several features built side by side, with nobody at the keyboard.**
- **A full team for every feature** — plan, code and reviews, each in its own worktree, on its own branch.
- **Built in the right order.** A feature that builds on another starts only once that one is finished.
- **It paces itself.** Near your usage limit nothing new starts, and the campaign carries on by itself after the reset.
- **One stuck feature never stops the rest.**
- **One report at the end**: each feature's final state, every open point, and the order to merge the branches.
- **Nothing leaves your machine.** A campaign pushes nothing and merges nothing.

### nexus-digital-you

**A digital you: it learns how you decide, guesses your answers unseen, and tells you honestly how often it is right.**

- **Learns from your own history.** A short profile of how you decide, every line pointing to the moments it came from.
- **Every agent starts knowing you.** Each is handed the parts of the profile its job needs; what you say in the session always wins.
- **Nothing to review.** It learns from what you answer, correct and change your mind about.
- **A hidden guess for every question**, and an honest weekly score of how often it matched.
- **Your data stays with you.** One folder in your home directory, outside every repository.

## Install

```
/plugin marketplace add DotNetLabX/claude-nexus
/plugin install nexus@claude-nexus
```

Install a stack extension the same way — for example `/plugin install nexus-dotnet@claude-nexus`. Each command also runs in a terminal as `claude plugin …`.

Update with `claude plugin marketplace update claude-nexus`, then `claude plugin update nexus@claude-nexus`.

## What you need

- **Claude Code.** Nexus is built on its plugins, hooks and agents, and runs nowhere else.
- **`nexus-miner`** (paid), for the test coverage on any stack. nexus-cpp and nexus-php are its toolchains and are installed for it.
- **Docker**, for the C++ and PHP toolchains only.
- **Figma's connector for Claude Code**, for the Figma-to-Flutter skill only.

## License

[MIT](LICENSE)
