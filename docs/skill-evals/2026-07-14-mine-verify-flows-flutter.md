# Skill Evaluation — mine-verify-flows-flutter (2026-07-14)

Scope: `plugins/nexus-flutter/skills/mine-verify-flows-flutter/SKILL.md` (working tree, plugin nexus-flutter v0.4.0), judged against the rubric Layers 1–4 plus the adapter-contract fitness criteria, cross-read against the method (`plugins/nexus/skills/mine-verify-flows/SKILL.md`) and the sibling adapter (`plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`). Layer 0 lint already passed and was skipped. Run evidence (the on-device golden-gated pilot: uninstall-at-teardown redo, 6-run calibration, 58/112 cross-device diff, Pixel 7 Pro AVD pin) is **pilot-documented in another repo and not locally reproducible** — this evaluation judges the spec and its internal/cross-file coherence, and takes pilot numbers on stated authority.

## Findings

[HIGH] — **Capability 3 (Output capture) is claimed but never operationalized.** The frontmatter and the 5-capabilities table both promise "app-documents-dir pre/post output capture," but the table cell is the only text: it near-verbatim restates the method's own capability-3 definition ("pre/post snapshot + diff … files this flow created or modified") and adds only "filtered to the flow's output patterns." Every other capability row has a body section; this one has none. A first-time Cover-stage implementer has no mechanics: who takes the snapshot (device-side Dart listing vs host-side pull), what the snapshot records (paths only, or mtime/hash so *modified* files are caught), where the pre-snapshot lives, and what the pattern filter runs against. Fix (one move): add an "Output capture" body section with the pilot's concrete mechanism, matching the depth of the runner/bless sections.

[MEDIUM] — **Capability 5 (Harness bringup) is only one-third filled.** The table row promises "fixture seeding + fake camera/API adapters + native-SDK init ordering." Init ordering is genuinely covered (the per-method `checkInit` gate and the `compute()` isolate-local-statics traps — both good, Flutter-specific fills). But fixture *seeding mechanics* (how fixture files get into the device sandbox before the run) and the fake camera/API *injection point* (DI override? flavor? test entrypoint?) are never explained anywhere; the method's capability 5 explicitly assigns both to the adapter. Fix: one short paragraph each under a bringup heading (or fold into the F1 section).

[MEDIUM] — **Method-owned calibration doctrine is restated (one-fact-one-owner / AP3).** The golden-gate-module section re-narrates the three-verdict enumeration, the full worked example (semantic exact-match + geometry/garbage class exclusions + `**.sfr` ε 0.005), and the determinism-spike caveat — all owned by the method's "Gate calibration" and "determinism verdict" sections, which the adapter simultaneously points to ("see the method's determinism-verdict scoping rule") *and* paraphrases. Same pattern in "Goldens are hardware-pinned": its first and last sentences duplicate the method's pin doctrine; only the concrete AVD pin and the 58/112 pilot numbers are adapter-owned. Drift risk on the exact numbers/wording. Fix: keep the pure-Dart module API, the concrete pin, and the pilot evidence; replace each doctrine sentence with a pointer.

[MEDIUM] — **The `flutter drive` invocation has two silent prerequisites.** (a) `test_driver/integration_test.dart` is named in the command and glossed as "the stock 3-line `integrationDriver()` entrypoint," but the file's content is never shown and there is no create-if-missing instruction — on a repo without `test_driver/` the documented command dead-ends on its first run. (b) `--flavor {flavor}` is written unconditionally; on a flavorless app the flag errors, and nothing marks it optional. Fix: show the 2-line entrypoint (import + `Future<void> main() => integrationDriver();`) with "create if absent," and bracket the flavor flag as omit-if-no-flavors.

[LOW] — **`{appDocsPath}` in the tar pull is an undefined referent, and "documents dir" vs `files/` conflict.** The bless path is described as "the app's own documents dir (`files/goldens_bless_output/…`)" — but on Android, path_provider's documents dir is `{dataDir}/app_flutter/`, while `files/` is the support dir; and the command's `-C {appDocsPath}` only composes with the `files/…` operand if `{appDocsPath}` means the app *data root*, not the docs dir. Mitigated by "prints the exact pull path," but the placeholder should be defined (e.g. "{appDocsPath} = the parent data dir the bless run prints"). One-move fix: define the placeholder next to the command.

[LOW] — **"Declare them as pubspec assets" hides the non-recursive-assets trap.** Pubspec `assets:` directory entries do not recurse; per-flow golden subdirectories (`goldens/{flowSlug}/`) each need their own entry. A first-time operator following the sentence literally lists the parent dir and gets the "golden asset not bundled" failure the skill itself warns verify mode reports. Fix: one clause — "one `assets:` entry per flow subdirectory (pubspec asset dirs are not recursive)."

[LOW] — **No lessons-capture hook (Layer 4.1) and no dated grounding citation for the load-bearing toolchain claim (Layer 1.3).** The uninstall-at-teardown claim rides on a pilot anecdote; the sibling adapter grounds its equivalent trust-anchor claim in a named `docs/kb/research/` doc. The sibling also lacks a lessons hook, so this may be a family-wide convention gap rather than a defect of this skill alone. Fix: cite the pilot KB/research doc if one exists; otherwise note "pilot-verified 2026-07, {repo}".

None at CRITICAL.

## Checked clean

- **Job statement / adapter scope**: description is specific, accurate (except the F1 capture gap), auto-invocation-worthy (concrete cues: flow scope, integration_test, FFI re-entry, on-device JSON outputs), and stays strictly at toolchain-fill altitude — no ownership creep over the method's pipeline/gates/registry, and the body opens by ceding them explicitly.
- **5-capabilities table shape**: exactly the method's 5 capabilities, same order, none invented, none dropped; rows 1, 2, and 4 each map to a body section that genuinely operationalizes them (runner semantics + runner-agnostic test constraints; the two-hop bless with the sandbox rationale; the pure-Dart module API with the wildcard/precedence grammar).
- **Cross-reference integrity**: `mine-verify-flows`, `mine-verify-cover-flutter`, and `tdd` all exist on disk; every section pointer into the method resolves ("Fixture strategy," the determinism-verdict scoping rule, "the method's one human approval" ↔ Golden lifecycle); the "supplies the shared repo bringup" claim is verified true against cover-flutter's "Repo bringup" section — pub get, build_runner, HTTPS rewrite match exactly, and the mutation_test install is correctly *not* claimed for flow scope. The method's own relationship-table summary of this adapter matches the adapter's table.
- **Layer 1.2 guardrails**: no side-effecting claims to verify; the Cover-agent forbidden-actions rails correctly live only in the method (no restatement).
- **Layer 1.5 scope fence**: present, names both adjacent skills plus the two exclusions operators actually confuse (widget/pixel goldens; flow selection).
- **Layer 1.6 failure modes encoded**: uninstall-at-teardown, exclusion-is-blindness, isolate-local statics, opt-in init gates, and the exact-only-spike miscalibration are all encoded as rules in the steps, not left in lessons.
- **Layer 2.2/2.5**: fragile steps are pinned low-freedom (exact drive invocation, exact tar pipeline); no AP5 fictional tooling (`--keep-app-running` is a real flutter drive flag; `integrationDriver()` is the real entrypoint; toybox tar's position-independent `-C` makes the command valid on Android); the pilot method-name list is framed as "in the pilot app," so no AP4 hardcoded inventory.
- **Layer 2.3 weight**: single SKILL.md, no references — correct for an adapter; matches the sibling's shape and voice.
- **Layer 3 overlays**: none apply (the adapter spawns nothing, writes no external system, iterates nothing, holds no state — all orchestration correctly stays in the method) and, correctly, none of the overlay machinery is restated here.
- **Layer 4.3 index sync**: nexus-flutter `plugin.json` (v0.4.0) names this adapter with a capability summary matching the frontmatter.

## Verdict

**fix-then-accept** — the runner, bless, golden-module, and fixture-trap fills are strong and pilot-grounded, but one of the five capabilities the adapter exists to provide (output capture) is a table cell with no mechanics, plus fillable MEDIUM gaps (bringup mechanics, drive prerequisites, calibration-doctrine restatement); all are one-section or one-clause fixes with no structural rework.

---

## Resolution (architect, 2026-07-14 — consolidating pass, re-linted)

| Finding | Disposition |
|---|---|
| HIGH output capture not operationalized | **Fixed** — new "Output capture — device-side pre/post listing" section: the flow test takes both snapshots (relative-path listing pre/post), gated files = post-minus-pre set difference filtered to `.json` + registered patterns, sizes/hashes recorded pre-run for modify-flows. |
| MEDIUM harness bringup one-third filled | **Fixed** — new "Harness bringup — seeding and the fakes" section: fixture-tree copy into real on-device dirs with content-match resolution, fake camera/API installed via test-entrypoint DI overrides, init-ordering rule, cover-flutter repo-bringup prerequisite. |
| MEDIUM calibration-doctrine restatement | **Fixed (scoped)** — doctrine sentences replaced with pointers to the method; the calibrated two-tier config itself is retained deliberately (the graduation input assigns the worked-example config to the adapter); the hardware-pin section reframed as "the concrete fill" with the principle ceded to the method. |
| MEDIUM flutter drive prerequisites | **Fixed** — the two-line `integrationDriver()` entrypoint shown with create-if-absent; `--flavor` marked omit-on-flavorless. |
| LOW `{appDocsPath}` undefined / docs-dir naming | **Fixed** — placeholder defined next to the command (the parent data root the bless run prints). |
| LOW pubspec non-recursive assets | **Fixed** — one-clause warning added (one entry per flow subdirectory). |
| LOW grounding citation + lessons hook | **Partially fixed / waived** — the uninstall-at-teardown claim now carries "pilot-verified 2026-07"; the lessons-capture hook is waived as the same family-wide convention gap flagged on the method (one fix in `mine-family-core.md`, separate pass). |

Post-fix: skill-lint exit 0, no warnings.
