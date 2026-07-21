---
name: mine-verify-cover-dotnet
description: The .NET stack adapter for the mine-verify-cover method — fills its 5 capabilities with Stryker.NET (MTP runner), dotnet test, xUnit v3 + AwesomeAssertions + FsCheck, and a self-contained test-project scaffold. Use when running Mine→Verify→Cover on a .NET class, especially a repo with no existing test project (it scaffolds one) or DDD aggregates split across same-basename partial files.
user-invocable: true
---

# Mine→Verify→Cover — .NET adapter

The **stack adapter** for `mine-verify-cover` (the nexus core method). The method owns the loop, the gate battery, and the KB ledger; this skill fills the 5 toolchain capabilities for .NET. Read `mine-verify-cover` first — this skill only supplies the .NET-specific parts.

## The 5 capabilities, filled for .NET

| Capability | .NET fill |
|------------|-----------|
| Evidence indexer | the miner reads the target `.cs` source file directly |
| Test runner | `dotnet test` (xUnit v3, MTP) — run twice for `suite_green` + `no_flaky` |
| Mutation tool | Stryker.NET via `dotnet stryker` (MTP), JSON report (schemaVersion 2) |
| Test-style contract | xUnit v3 `[Fact]` + AwesomeAssertions; FsCheck.Xunit.v3 `[Property]` |
| Prod-source-diff scoping | `git diff -- {Module}.Domain/` (scoped to the production project) |

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

## Test-project scaffold (the prerequisite)

The Cover agent writes test *files*, not a test *project*. A repo with no tests needs a project scaffolded ONCE per bounded context, before the first run. Mirror this proven shape.

Place it beside the domain project: `{Module}.Domain.Tests/`.

**`{Module}.Domain.Tests.csproj`** — opt OUT of the repo's central package management so the test stack stays self-contained, and pin the proven set inline:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <ManagePackageVersionsCentrally>false</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\{Module}.Domain\{Module}.Domain.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="xunit.v3" Version="3.2.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="AwesomeAssertions" Version="9.0.0" />
    <PackageReference Include="FsCheck.Xunit.v3" Version="3.3.3" />
  </ItemGroup>
</Project>
```

Opting out of central package management is the deliberate isolation choice — it avoids editing the shared `Directory.Packages.props` for test-only packages. See `central-package-management` for the repo-wide model this opts out of.

**`.config/dotnet-tools.json`** — Stryker as a local tool (`dotnet tool restore` once):

```json
{ "version": 1, "isRoot": true, "tools": {
  "dotnet-stryker": { "version": "4.14.2", "commands": ["dotnet-stryker"], "rollForward": false } } }
```

**`stryker-config.json`** (in the test project root):

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

## MTP runner facts (do not relearn these the hard way)

- **`test-runner: mtp`** is REQUIRED for xUnit v3. It works on Stryker 4.14.2 + xunit.v3 — a stale "MTP not supported on 4.14" note in some configs is wrong.
- **`coverage-analysis: off`** is REQUIRED with MTP — coverage-based filtering skips ALL mutants under MTP. Keep it off for domain test projects.
- The `json` reporter emits `StrykerOutput/{timestamp}/reports/mutation-report.json` — the gate reads this. The `files` object is keyed by ABSOLUTE path.

## Same-basename partial handling (DDD house style)

Many DDD codebases split each aggregate into `{Class}.cs` (data) + `Behaviors/{Class}.cs` (behavior) — so TWO report files share the basename `{Class}.cs`. The business rules live in the behaviors partial. Two non-negotiables, or the gate fake-greens:

- **Point the target source at the behaviors partial** and **scope the mutate glob to it**: `--mutate "**/{Area}/Behaviors/{Class}.cs"` (pin on the CLI; do not trust static config alone). This makes the report unambiguous.
- **Extract the per-file mutant entry by the FULL source path, never the basename** — a basename match can grab the 0-mutant data partial and score the wrong file (the classic fake-green). Build the honest `mutatedFiles` list (every file with at least one mutant) so the `target_mutated` gate can confirm the behaviors partial was the file mutated.

## Test style (so generated tests compile)

- **Example tests** — xUnit v3 `[Fact]`, AwesomeAssertions exclusively (`.Should()...`), no `Assert.*`. One `[Fact]` per rule boundary; pin exact threshold/boundary cases so relational and equality mutants die.
- **Property tests** — `FsCheck.Xunit.v3` `[Property]`, return `bool` directly (no `Prop.ForAll` — that is the F# API). Constrain inputs with wrapper types (`PositiveInt`, `NonEmptyString`). Namespaces: `FsCheck`, `FsCheck.Fluent`, `FsCheck.Xunit`.
- **Fixtures** — a `_Fixtures/` factory builds the aggregate through its `required init` properties and value-object factories (e.g. an email VO `.Create(...)`, a token `.CreateNew()`); one factory file per test project.

Record these facts in a project `docs/conventions/mutation-testing.md` so the Cover agent reads the API contract from the consuming repo (the method passes it the path).

## Fact tags & test tiers — .NET mapping

The method's fact-tagging + tier vocabulary (`mine-verify-cover` → "Fact tagging & test tiers") maps to
xUnit v3 traits and `dotnet test --filter` expressions:

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
  the record — the SR mini-pilot convention.

## What this skill does NOT do

- Own the loop, the gate battery, or the KB ledger — those are `mine-verify-cover` (the core method). This skill is only the .NET toolchain fill.
- Cover Vue/frontend test generation — this adapter is the .NET/domain side.
- Decide WHICH class to target — the operator (or, later, a graph-scoped Discover step) chooses; start with pure-logic behavior methods, not state machines that need a `DbContext`.

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the stack-neutral method this adapter plugs into (read it first) |
| `central-package-management` | the repo-wide package model the isolated test project opts OUT of |
| `domain-service` / `domain-patterns` | the .NET domain shapes whose rules this mines and tests |
| `tdd` | the boundary-case + kill-the-mutant test discipline |
