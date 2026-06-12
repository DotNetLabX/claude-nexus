# Evidence — Omnishelf Job-Fitness Evaluation (2026-06-11/12)

Distilled from `D:\Omnishelf\omnishelf-docs\docs\proposals\2026-06-11-job-fitness\` —
a four-evaluator fitness review of that project's evolved skill estate (kb-sync,
meeting-to-notes, docs-bootstrap, spec chain) plus a 2026-06-12 addendum evaluating
`improve-skills`. This is the evidence base for **nexus 1.6.0** (the improve-skills
overhaul, ADR-23). Omnishelf consumes nexus via the generated omni twin; its addendum
diff-verified `omni:improve-skills` identical to our source at 1.5.1 and explicitly moved
the rewrite target to this repo.

## The improve-skills findings (their H/M ranking — all adopted in 1.6.0)

- **H1 — the meta-loop never runs the lint it should satisfy.** Their repo had a working
  skill-lint script for weeks while improve-skills neither ran it after fixes nor after
  scaffolds. Measured failure class: three skills silently registered broken (BOM +
  malformed YAML), found only by a later evaluation. *"The skill that writes skills is the
  single highest-leverage place to wire the deterministic post-condition."*
- **H2 — new skills are not born registered or fully fronted.** Scaffolds carried `name` +
  `description` only — no when-to-use phrasing, no user-invocable decision, no registration
  row — so every skill the meta-loop created was born violating the project's own checks.
- **H3 — no encoding rule on the write path.** Their worst registration incident (G16) was a
  PowerShell-default-encoding save producing BOM + mojibake in three agent cards.
- **M1 — fixes were additive patches.** "Preserve existing structure and style" contradicted
  their consolidation rule ("net complexity flat or down") and skipped version/changelog
  discipline on heavy skills.
- **M2 — the de-facto main entry point was undocumented.** Every significant skill in the
  repo was built by *direct operator sessions*, not through the learner path the skill was
  scoped to — the skill missed most of the real traffic for its job. Their verdict explicitly
  **rejects a separate create-skill skill** (duplicate owner) in favor of one skill, two
  modes, two documented entry points.

## Cross-job themes (T1–T4) — what survived contact with nexus

- **T2 — "A rule that isn't mechanically executed on every run is decoration."** Their
  strongest theme, proven three ways in their repo (quote gate on 0/79 receipts, a dead-letter
  promotion tier with 0% adoption, prose rules fixed only by `verify-quotes.py`) — and
  independently proven in knowledge-gateway by the skills-mandate decay (see
  `2026-06-12-developer-skill-usage-audit.md`). Two unrelated projects, one law. → ADR-23's
  core principle; also the new "Prefer Mechanical Enforcement" section in `improve-flow`.
- **T4 — fixes half-land.** A fix isn't done until every normative surface (convention,
  skill, template, standing generated artifacts) agrees — convergent with nexus ADR-19's
  extraction-loss class; already partially encoded in our surface-sweep guidance.
- **T1 (loops don't close) / T3 (freshness invisible at consumption)** — real findings, but
  about *their* domain skills (kb-sync, docs-bootstrap, meeting-to-notes, spec chain), which
  are not nexus skills. Noted as design pressure, not adopted as changes.

## What nexus adopted (1.6.0) vs declined

| Their finding | nexus 1.6.0 change |
|---|---|
| H1 lint-as-done-condition | `skills/improve-skills/scripts/skill-lint.mjs` ships with the skill; both paths end with exit 0; dev-repo dogfood test lints every shipped skill |
| H2 born-compliant scaffolds | Scaffold step 4 (frontmatter completeness) + step 6 (registration row) |
| H3 encoding rule | "Write Discipline" section: Write tool, UTF-8 without BOM, never shell redirection |
| M1 consolidating pass | Fix channel reworded: "net complexity flat or down, never additive patching" (changelog half already existed) |
| M2 entry broadening | "Entry Points" section: learner-classified item OR direct user request; separate create-skill skill rejected per their verdict |
| T2 generalized | `improve-flow` "Prefer Mechanical Enforcement" section |
| Their SKILL_AUTHORING / RECIPES / RUBRIC docs wholesale | **Declined** — project-flavored; the binding rules were distilled into the skill itself instead |
| T1/T3 domain-skill proposals (sync triggers, re-extraction, finalize paths) | **Declined** — Omnishelf-domain, not pipeline-generic |
