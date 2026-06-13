# nexus-dotnet — Changelog


## [1.1.0] — 2026-06-12
.NET skill estate sweep — rubric evaluation, format normalization, genericization fixes (ADR-23).
First pass of all 26 .NET skills through the ADR-23 quality system (`skill-lint`, `evaluate-skill`,
proven-patterns). Skill **names are frozen** — no renames; all changes are descriptions/bodies/frontmatter.
Dispositions: 9 keep · 12 reformat · 5 rewrite (`docs/specs/adhoc-DotnetSkillSweep/delivery/disposition.md`).
MINOR tier: 26-skill breadth + `disable-model-invocation` behavior change (owner-escalated).

- **Genericization (the pivotal change).** Five skills were bound to private projects and/or documented
  unbuilt "Pass 2/3" future state; all are now app-agnostic:
  - `domain-patterns`, `domain-service`, `analytics-computation-service` — removed the "not proven until
    Passes 2/3" banners and all "target-state / before-state / won't-build-until-then" framing; demoted
    live `Fokus.*` paths to illustrative examples; restated ADR-004/005/006/007/010/011 as **named
    conventions** (the rule, not the project's ADR number). The valuable mechanical content (CS9032
    rule, VO-vs-scalar rule, pure-by-default + escape-hatch read-port, output/input boundaries, the
    wire-only `{Mode,Multi?,Single?}` envelope rule, delta/direction/polarity, sparkline builder,
    rolling-average ordering caveat) is preserved verbatim.
  - `central-package-management` — dropped the banner + the `sprint-rituals` "Pass 0" snapshot;
    **preserved verbatim** the three-form verification grep with its globstar-portability warning.
  - `framework-currency` — dropped the banner + named-project `file:line` examples; **preserved
    verbatim** the two-stage `Send.*` detection (grep → receiver inspection) and version-verification
    discipline.
- **Blocking lint fixes (Layer 0).** `persistence-patterns` and `redis-patterns` had `<T>` tokens in
  prose headings (XML-tag-in-prose) — wrapped in inline code; both now lint clean.
- **Format normalization.**
  - Per-skill `CHANGELOG.md` dropped to git history on all 5 that carried one (analytics-computation-service,
    create-aggregate, create-feature, domain-patterns, persistence-patterns) — per-skill evolution lives in
    this plugin CHANGELOG (no external norm keeps per-skill changelogs).
  - Every in-scope description now carries a `Use when` / `Loaded when` trigger clause (auto-invocation
    discovery; Anthropic authoring guidance).
  - Architect-only skills (`system-design`, `create-service-claude-md`, `create-module-claude-md`) set
    **`disable-model-invocation: true`** (keep `user-invocable: true`) — a developer-session model no
    longer auto-invokes them. Fixed `system-design`'s incorrect `user-invocable: false` sibling citation.
  - `service-registration` — removed a paragraph that duplicated its frontmatter description; title-cased.
  - Empty `{ProjectName}` registry tables in `add-integration-event` / `create-grpc-contract` replaced
    with grep-before-adding pointer lines; added scope/adjacency fences between confusable siblings
    (integration-event ↔ grpc ↔ domain-event-handler; pipeline-behavior ↔ cqrs).

## [1.0.3] — 2026-06-12
Learner consolidation — Pass 4 finalize-stage malfunction log (M6).

- **`conventions/csharp.md`**: generalized the **Build Verification** `cd /d` rule from build commands to **any command under the Bash tool** (added the `git -C "…"` form). Third occurrence of the cmd-ism class — Pass 0 (developer, build), Pass 3c-B (architect, build), Pass 4 M6 (team-lead, **git**); the build-scoped wording could not catch the git context.

## [1.0.2] — 2026-06-10
Learner consolidation from Passes 4 and 5.

- **`skills/persistence-patterns`**: `UpsertAsync` value-copy rule — copy through EF `PropertyValues` (`Entry(existing).CurrentValues.SetValues(Entry(entity).CurrentValues)`), never `SetValues(object)`: the object overload uses plain reflection and silently skips `PropertyAccessMode.Field` backing-field properties (latent shallow-copy, invisible to shape greps). Cross-referenced with the existing owned/complex-type deep-copy caveat. Promoted at one occurrence (silent-data-bug class).
- **`skills/create-aggregate`**: new **Promote an Existing Entity to an Aggregate Root (in place)** section — type-change-in-place (keep the existing EF config + repository), check the schema consequence from the model snapshot at plan time (audit columns ⇒ mandatory migration), mirror an existing aggregate for the behavior split and raise-after-save event pattern. Variant-aware (plain-DDD vs ASP.NET Identity).

## [1.0.1] — 2026-06-08
Learner consolidation from Passes 0–3c-B — proven (2+ occurrence) and critical lessons promoted into the stack skills and conventions.

- **`conventions/csharp.md`**: added a **Build Verification** rule (on Windows under the Bash tool, never `cd /d … && dotnet build` — `/d` is a cmd flag bash mis-reads, the build never runs, and exit-1 masquerades as a compile failure; pass the absolute `.slnx` path with no `cd`) and a **`required` + `private set` = CS9032** type rule (drop `required` + private ctor, or use `init`); `domain-patterns` (`## Entity`) cross-references it from its encapsulation guidance.
- **`conventions/ef-core.md`**: a generated `DropColumn` + `AddColumn` for the same data **destroys rows** — read every migration after `add` and hand-edit to `RenameColumn`; critical for seeded singletons (VO-regrouping renames).
- **`persistence-patterns`**: new "Mapping a Command onto a Tracked Entity (Mapster)" section — `IgnoreNonMapped(true)` is a whitelist not a shield (zero `.Map()` = silent no-op write), `.Adapt(existing)` never nulls unmatched members (no guard needed), `ComplexProperty`/owned VOs must be assigned explicitly, and write paths must verify **save → reload → assert**.
- **`create-feature` (Mappings workflow)**: added the **Mapster eligibility test** (single-source + name-aligned only; method-dispatch / multi-source / conditional stay explicit), the two-direction caveat (outbound new-object vs inbound onto-tracked), and the **prefix-dropping VO flattening** caveat (auto-flatten breaks → explicit `.Map()`).
- **`domain-service` + `analytics-computation-service`**: discriminated `{Mode, Multi?, Single?}` `*Response` envelopes are **wire-only** — the endpoint assembles them; never mirror into the domain or a domain rename table.

## [1.0.0] — 2026-06-06
First versioned release. Graduates from the `0.1.x` line to `1.0.0` alongside `nexus`.
Backfilled from git history.

Baseline included in 1.0.0:
- Thin stack extension declaring `dependencies: ["nexus"]` — reuses the core's agents, rules,
  commands, and security guard; ships only stack skills + convention files (Read-Index model).
- .NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints + Vue / Pinia / Tailwind
  code-pattern skills (create-feature, create-aggregate, create-service, domain-patterns,
  persistence-patterns, vue-patterns, and the rest of the stack set).
- Stack convention files (csharp, ef-core, vue, testing, coding-conventions, project-rules) for
  a project to place under `docs/conventions/`.
- Skill repairs from `adhoc-Pass1-SkillRepair` (domain-service, central-package-management,
  framework-currency created; analytics-computation-service, domain-patterns fixed).
- Added the missing YAML frontmatter to `service-registration` (failed `claude plugin validate
  --strict`); both plugins now validate clean under `--strict`.

Depends on `nexus` via a bare dependency (tracks latest). See the proposal for the
open question on pinning a version constraint.
