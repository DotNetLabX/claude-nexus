# Critic severity ruler — seed
Provenance: derived 2026-09-10 from 377 records (0 owner-graded, 32 panel-graded) by the calibration script; corpus sha256 f1544847abc4. Generated — never hand-edit.

## spec

### CRITICAL

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0001 | The core loop has no way to run its queries, so the work stalls at step one until someone decides who builds the missing execution path. | fixed-real |
| seed-0002 | A mode the document promises can never actually run, so two builders implement opposite behaviour and one breaks the write-protection boundary. | fixed-real |
| seed-0003 | The verification stage the work was approved for is missing, so unchecked findings ship and a scan can run against production with no stop rule. | fixed-real |

### HIGH

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0004 | Two committed files each claim to say what the business is paid on, with no precedence, so a team keeps two divergent weight sets and ranks by the wrong one. | fixed-real |
| seed-0008 | A run anchored on a measure that cannot be computed either fails deep inside scoring or reports an empty result as a legitimate answer. | fixed-real |
| seed-0007 | With more than one outcome measure, nothing says how to combine them, so the headline ranking differs between builds and a wrong choice is permanent. | fixed-real |

### MEDIUM

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0021 | An approved list of result types changed without anyone saying so, so people build against a set the decision-makers never agreed to. | fixed-real |
| seed-0022 | One place fixes the storage layout and another calls it an open choice, so whoever builds it picks one and the other statement turns wrong. | fixed-real |
| seed-0023 | An old reference number now belongs to a different piece of work, so anyone following the pointer lands on the wrong thing. | fixed-real |

### LOW

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0041 | A section reserved for blocking questions holds notes instead, so a reader cannot tell what still blocks the next step. | fixed-real |
| seed-0310 | Two claimed behaviors have no test, and both are places where a builder could get the direction or the denominator wrong unnoticed. | fixed-real |
| seed-0364 | The step a rule points to never mentions the filter, so whoever builds that step leaves it out and the filter is silently never applied. | fixed-real |

## plan

### CRITICAL

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0115 | A test valid only for counts is used on money and volume figures, so meaningless differences read as statistically significant and pass the check. | fixed-real |
| seed-0169 | Generating one role's text from another's silently deletes rules that applied only to the first, shipping wrong instructions to every user. | fixed-real |
| seed-0189 | Renaming a heading breaks the stored mappings that point at the old name, so a hard check fails in a file no step was told to touch. | fixed-real |

Negative: seed-0116 — The release step asks a single command to raise two packages by different amounts, which it cannot do, so the published version numbers come out wrong. (graded CRITICAL; re-graded HIGH at the sitting)

### HIGH

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0116 | The release step asks a single command to raise two packages by different amounts, which it cannot do, so the published version numbers come out wrong. | fixed-real |
| seed-0117 | One decision fixes the reporting period while another derives it, and a span calculation elsewhere is correct only for the fixed one. | fixed-real |
| seed-0120 | The plan adds a new reason for skipping an item, but the rules allow only a fixed set of reasons, so the outcome cannot be recorded or explained. | fixed-real |

Negative: seed-0123 — Text shipped to users points at a folder that exists only in the authors' own repository, so readers follow a path they do not have. (graded HIGH; re-graded MEDIUM at the sitting)

### MEDIUM

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0123 | Text shipped to users points at a folder that exists only in the authors' own repository, so readers follow a path they do not have. | fixed-real |
| seed-0129 | A related programme document asks for edit-order coordination and was never consulted, so two efforts can edit the same text out of order. | fixed-real |
| seed-0130 | A rewritten passage leaves in place a requirement the new case violates, so the document states a rule its own example disobeys. | fixed-real |

Negative: seed-0127 — A written-out number could mean either the table rows or the names listed, so whoever updates the text later cannot tell which count to keep true. (graded MEDIUM; re-graded LOW at the sitting)

### LOW

| Anchor | Consequence | Outcome |
|---|---|---|
| seed-0127 | A written-out number could mean either the table rows or the names listed, so whoever updates the text later cannot tell which count to keep true. | fixed-real |
| seed-0137 | Two similar entries are placed differently with no note saying why, so a later editor may treat the difference as a mistake and undo it. | fixed-real |
| seed-0153 | One side of a maximum can never be the larger, so the formula carries arithmetic that never applies and misleads whoever reads it. | fixed-real |

## Never downgrade

data-loss · security · silent-wrong-output — under seed or overlay alike.

## Bias table

| Kind | Mean shift given→after | n |
|---|---|---|
| spec | 0.03 | 162 |
| plan | -0.01 | 201 |
| promotion | — | 0 |

Legend: shift = after − given on CRITICAL 4 · HIGH 3 · MEDIUM 2 · LOW 1; negative = the seat graded high.
