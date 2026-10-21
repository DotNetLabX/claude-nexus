---
name: mine-verify-cover-dotnet
description: The .NET stack adapter for the mine-verify-cover method — fills its 5 capabilities with Stryker.NET, dotnet test and the repo's own test stack (xUnit v3 + AwesomeAssertions + FsCheck on the Microsoft Testing Platform where the repo has no test project yet), and names the setup steps and the Stryker reach probe a run needs. Use when running Mine→Verify→Cover on a .NET class, especially a repo with no existing test project (it scaffolds one) or DDD aggregates split across same-basename partial files.
user-invocable: true
---

# Mine→Verify→Cover — .NET adapter

Needs the `nexus-miner` plugin — if `mine-verify-cover` is not in your skill list, stop and tell the user `/plugin install nexus-miner@claude-nexus-miner`.

## Assumes

- **The `nexus-miner` plugin** and its `mine-verify-cover` method.
- **The .NET SDK**, the Stryker.NET local tool, and central package management (`central-package-management`).
- **The mutation test project** — the test project Stryker runs from — references every target class's project
  directly (§Test-project scaffold below); it may reference other projects too.

The **stack adapter** for `mine-verify-cover` (the `nexus-miner` method). The method owns the loop, the gate battery, and the KB ledger; this skill fills the 5 toolchain capabilities for .NET. Read `mine-verify-cover` first — this skill only supplies the .NET-specific parts.

## The 5 capabilities, filled for .NET

| Capability | .NET fill |
|------------|-----------|
| Evidence indexer | the miner reads the target `.cs` source file directly |
| Test runner | `dotnet test` on the mutation test project, with the repo's own test framework and runner — run twice for `suite_green` + `no_flaky` |
| Mutation tool | Stryker.NET via `dotnet stryker` from the mutation test project's folder, JSON report (schemaVersion 2); its test runner follows the repo's (§Test runner facts) |
| Test-style contract | the repo's own test framework and assertion library; with none yet, xUnit v3 `[Fact]` + AwesomeAssertions and FsCheck.Xunit.v3 `[Property]` |
| Prod-source-diff scoping | `git diff {run-start commit} -- {every production project folder}` — every project in the solution except test projects (the production tree, below this table) |

**The production tree.** The no-edit check covers every project in the solution except the test projects —
a project with `<IsTestProject>true</IsTestProject>` or a reference to `Microsoft.NET.Test.Sdk`, xUnit, NUnit or
MSTest. The diff is taken from the commit the run starts on, after the setup steps (§Setup steps below), so the
one production edit setup may make never shows in it.

## Instrument integrity — the Stryker shape (MANDATORY before any score is reported)

This stack's proven failure mode is **timeout-as-kill** (audit 2026-07-21: 3 timeouts on loop-free
string literals carried a 75-floor PASS that honestly read 73.58% FAIL; on another unit 17 of 20
timeouts were deadlocks, not detections). The binding fills of `mine-verify-cover` →
`### Instrument integrity`:

- **`Timeout` is never a kill.** The gate scores unadjudicated Timeouts as survivors and lists them
  in `detail.timeouts`. Adjudicate each at `--concurrency 1`: a proven infinite loop (e.g. `i++`→`i--`
  in a loop header) passes its line via `adjudicatedTimeoutKillLines`; a deadlock or slow test is a
  survivor — and usually a REAL suite gap (assert completion explicitly instead of hanging).
- **`CompileError` stays excluded from BOTH sides** (the gate already does this) — but Stryker's
  Safe Mode removes ALL mutants in a method on one compile error, so report the CompileError share
  of the total surface as a disclosed blind spot (one audited unit had 20% of its surface erased in
  method-wide clusters). Correct arithmetic ≠ adequate coverage.
- **Floor comparison is exact** — the shipped gate no longer rounds; never reintroduce a rounded
  score in any wrapper arithmetic.
- **Commit the evidence.** Copy the `StrykerOutput` JSON backing any committed verdict into a
  committed evidence path (e.g. `docs/business-rules/_evidence/{unit}/`, SHA-256 recorded). A
  verdict whose evidence lives in a gitignored worktree is one cleanup away from unauditable.
- **`ConfigureAwait(false)`→`true` survivors.** Such a survivor is a candidate for `equivalent-other` only
  (the method's Report-stage survivor tags): the classify agent proves that no caller runs the code under a
  synchronization context or a custom task scheduler, and states that proof as the reason. No Stryker setting
  ignores it — whether the flip is equivalent depends on the callers, so a blanket ignore would hide real mutants.

## Setup steps (once, before the first run)

Each is done once and committed before a run starts — in a campaign, once for the campaign, before its units
branch, never per unit.

- **The conventions file.** `docs/conventions/mutation-testing.md` is written once, at setup, before the first
  run: the repo's test framework, assertion library, runner and package management, and the test-style facts
  below (§Test style), so the Cover agent reads the API contract from the consuming repo (the method passes it the
  path).
- **Internal classes.** An internal target class needs its assembly to grant the mutation test project access —
  an `InternalsVisibleTo` entry naming the mutation test project, once per assembly. It is the one production edit
  setup may make, and because it is committed before the run starts, the no-edit check never sees it.

## The reach probe (kickoff, once per target project)

Stryker mutates only projects the mutation test project references directly, so the mining kickoff reads a
probe's result per target project before a Cover run (the method's kickoff checklist, mutation reach). From the
mutation test project's folder, once per distinct target project:

```
dotnet stryker --project {Target}.csproj --mutate "{the target class's own file}"
```

Run it once the mutation test project exists (in a repo with no tests, after the scaffold below), to completion —
about 25 s when the project is not found, one to two minutes when it is — and save its output. Read that output
with `tools/stryker-reach.mjs` beside this skill
(`node {this-skill-dir}/tools/stryker-reach.mjs --log {output file}`): it prints `{ "found": true }` or
`{ "found": false, "detail": ... }`, reading the "Found project … to mutate" or "No project found" line, never a
score. The kickoff's reach record is then:

```json
{ "probed": true, "testProject": "{the mutation test project's .csproj}",
  "projects": [ { "project": "{Target}.csproj", "found": true } ] }
```

one `projects` entry per probed project — the reader's `found` and `detail` with `project` added, spelled exactly
as the run's `targetProject` — and `testProject` spelled exactly as the run's `testProject`. The run's classes in
that project reuse it.

## Test-project scaffold (the prerequisite)

**Run doctor first.** Run `tools/doctor.mjs` from the base directory the loaded `mine-verify-cover`
skill announced (`node {that-base-dir}/tools/doctor.mjs --skill {this-skill-dir}`): it probes this stack's prerequisites (the .NET SDK, the Stryker dotnet-tool) and
reports severity-rated results with fix hints pointing back here. It tells you what is missing; the
scaffold below is still the thing you do about it.

The Cover agent writes test *files*, not a test *project*. **Where the repo already has a test project**, the
mutation test project — that project, or a new one beside it — uses its test framework, assertion library, runner
and package management, and the project file and package versions below do not apply; the direct-reference rule,
the Stryker local tool and the Stryker config shape below apply to every repo. **A repo with no tests** needs a
project scaffolded ONCE per bounded context, before the first run. Mirror this proven shape.

Place it beside the domain project: `{Module}.Domain.Tests/`.

**`{Module}.Domain.Tests.csproj`** — bare references; the versions go in the repo's central package file like every
other package (`central-package-management`):

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\{Module}.Domain\{Module}.Domain.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="xunit.v3" />
    <PackageReference Include="xunit.runner.visualstudio" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="AwesomeAssertions" />
    <PackageReference Include="FsCheck.Xunit.v3" />
  </ItemGroup>
</Project>
```

**Reference every target's project directly.** Stryker mutates only projects the test project references
directly. A project reached only through another reference builds and its tests run, but Stryker stops with
"No project found" — so a green build is no evidence of reach: add a `ProjectReference` per target project, and
confirm it with the reach probe above.

**`Directory.Packages.props`** — the proven set, added beside the repo's other versions (move a line to a newer
version only after a green run on it):

```xml
<ItemGroup>
  <PackageVersion Include="xunit.v3" Version="3.2.2" />
  <PackageVersion Include="xunit.runner.visualstudio" Version="3.1.5" />
  <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
  <PackageVersion Include="AwesomeAssertions" Version="9.0.0" />
  <PackageVersion Include="FsCheck.Xunit.v3" Version="3.3.3" />
</ItemGroup>
```

A repo with no central package file yet sets one up first (`central-package-management`), rather than pinning
versions in the test project.

**`.config/dotnet-tools.json`** — Stryker as a local tool (`dotnet tool restore` once):

```json
{ "version": 1, "isRoot": true, "tools": {
  "dotnet-stryker": { "version": "4.14.2", "commands": ["dotnet-stryker"], "rollForward": false } } }
```

**`stryker-config.json`** (in the test project root) — for the scaffold above, on the Microsoft Testing Platform:

```json
{ "stryker-config": {
  "project": "{Module}.Domain.csproj",
  "mutate": ["**/{Area}/Behaviors/{Class}.cs"],
  "test-runner": "mtp",
  "coverage-analysis": "off",
  "reporters": ["progress", "html", "json"],
  "mutation-level": "standard",
  "thresholds": { "break": 75 } } }
```

Add a trivial smoke test so the baseline `dotnet test` is green and the project reference resolves, then let the Cover agent add the real suite. Gitignore `bin/`, `obj/`, `StrykerOutput/` in the test project.

## Test runner facts (do not relearn these the hard way)

- **Classic xUnit 2 runs on Stryker's default runner** — leave `test-runner` out of the config. Measured on
  Stryker 4.16 with xUnit 2.9.2 and FluentAssertions 6.12.2.
- **`test-runner: mtp`** is REQUIRED for xUnit v3 (the scaffold above). It works on Stryker 4.14.2 + xunit.v3 — a stale "MTP not supported on 4.14" note in some configs is wrong.
- **`coverage-analysis: off`** is REQUIRED with MTP — coverage-based filtering skips ALL mutants under MTP. Keep it off for domain test projects.
- The `json` reporter emits `StrykerOutput/{timestamp}/reports/mutation-report.json` — the gate reads this. The `files` object is keyed by ABSOLUTE path.

## Same-basename partial handling (DDD house style)

Many DDD codebases split each aggregate into `{Class}.cs` (data) + `Behaviors/{Class}.cs` (behavior) — so TWO report files share the basename `{Class}.cs`. The business rules live in the behaviors partial. Two non-negotiables, or the gate fake-greens:

- **Point the target source at the behaviors partial** and **scope the mutate glob to it**: `--mutate "**/{Area}/Behaviors/{Class}.cs"` (pin on the CLI; do not trust static config alone). This makes the report unambiguous.
- **Extract the per-file mutant entry by the FULL source path, never the basename** — a basename match can grab the 0-mutant data partial and score the wrong file (the classic fake-green). Build the honest `mutatedFiles` list (every file with at least one mutant) so the `target_mutated` gate can confirm the behaviors partial was the file mutated.

## Test style (so generated tests compile)

Where the repo already has tests, generated tests follow its framework, assertion library and conventions; the
facts below are for the scaffold above.

- **Example tests** — xUnit v3 `[Fact]`, AwesomeAssertions exclusively (`.Should()...`), no `Assert.*`. One `[Fact]` per rule boundary; pin exact threshold/boundary cases so relational and equality mutants die.
- **Property tests** — `FsCheck.Xunit.v3` `[Property]`, return `bool` directly (no `Prop.ForAll` — that is the F# API). Constrain inputs with wrapper types (`PositiveInt`, `NonEmptyString`). Namespaces: `FsCheck`, `FsCheck.Fluent`, `FsCheck.Xunit`.
- **Fixtures** — a `_Fixtures/` factory builds the aggregate through its `required init` properties and value-object factories (e.g. an email VO `.Create(...)`, a token `.CreateNew()`); one factory file per test project.

These facts, or the repo's own, are what the conventions file records (§Setup steps above).

## Fact tags & test tiers — .NET mapping

The method's fact-tagging + tier vocabulary (`mine-verify-cover` → "Fact tagging & test tiers") maps to the
test framework's traits or categories and `dotnet test --filter` expressions — xUnit v3 shown:

- **Facts → `[Trait]` attributes** — `[Trait("layer", "domain-calc")]`, `[Trait("criticality", "golden")]`,
  `[Trait("mutation-gated", "true")]`, `[Trait("runtime-cost", "fast")]` on every generated `[Fact]`/
  `[Property]`.
- **Tiers → `--filter` expressions** — `smoke` = `dotnet test --filter "criticality=golden&runtime-cost=fast"`;
  `full` = `dotnet test` (no filter); `gate` = `dotnet test --filter "mutation-gated=true"`, run on target-class
  change.
- **The parked-red idiom** — a generated red that documents a genuine spec-code divergence (Cover-from-spec's
  output convention, `mine-verify-cover` → SDD lifecycle) is KEPT, never deleted, and marked:
  ```csharp
  [Fact(Skip = "SPEC-CODE DIVERGENCE — pending triage: {one-line divergence summary, observed value}")]
  ```
  so the suite stays green (`dotnet test` reports it skipped, not failed) while the divergence stays on
  the record.

## What this skill does NOT do

- Own the loop, the gate battery, or the KB ledger — those are `mine-verify-cover` (the `nexus-miner` method). This skill is only the .NET toolchain fill.
- Cover Vue/frontend test generation — this adapter is the .NET/domain side.
- Decide WHICH class to target — the operator (or, later, a graph-scoped Discover step) chooses; start with pure-logic behavior methods, not state machines that need a `DbContext`.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the stack-neutral method this adapter plugs into (read it first) |
| `central-package-management` | where the test project's package versions go, beside every other version |
| `domain-service` / `domain-patterns` | the .NET domain shapes whose rules this mines and tests |
| `tdd` | the boundary-case + kill-the-mutant test discipline |
