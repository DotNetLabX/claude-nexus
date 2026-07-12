# Canonical-algorithm catalog (mine-algorithm Stage 2)

The bounded catalog Stage-2 matchers map a hand-rolled unit's *problem signature* against. Match by
problem signature (inputs/outputs/objective/invariants), **never by code tokens** — code-only
algorithm recognition is weak (best F1 around 0.56, below text-only), so a small high-signal catalog
matched by reasoning beats broad automated tagging.

**Scope of the availability column — CV/C++-instantiated.** The `availability` value on every row
below is instantiated for a C++ computer-vision stack with a specific linked set
(OpenCV / Eigen / STL / NumCpp / a vendored DBSCAN). **A new stack re-derives `availability` against
its own linked set** — the *problem signatures, complexity classes, and recognition cues are
stack-neutral*, but whether a given algorithm is a drop-in library call, a vendored copy, or
reasoning-only depends entirely on what that build actually links. Treat the values below as the
worked CV/C++ example, not a universal truth.

**The three availability values:**
- **`library`** — a drop-in call in the already-linked set; replacement is a near-pure deletion.
- **`vendored`** — available via a copy already vendored into the build (not a library call).
- **`reasoning-only`** — recognize the shape, but replacement means adopting a vetted vendored or
  hand-written implementation, not a call. Recognition still has full value (it names the problem
  and licenses a quantified-win comparison).

## Bounding discipline (a standing rule, not a per-run choice)

- **Few, frequent, balanced, deliberately-merged categories** — cap the catalog at roughly 25-30
  entries; every entry mutually distinct (no two match the same code shape); frequency-rank so rare
  families do not dilute. An ever-growing catalog is the pattern-sprawl failure mode.
- **Match by problem-signature reasoning, not code-token classification** (the F1-around-0.56
  finding). Automated code similarity is at most a *hint* source, never the primary mechanism.
- **Rank by likelihood of appearing hand-rolled** in the target domain. For retail/tracking CV the
  order is: assignment, clustering, NMS, sequence alignment, Kalman/tracking, Hough/line-fit, RANSAC.

## Catalog

| Family | Problem signature (inputs -> outputs, objective) | Complexity | Availability (CV/C++) | Recognition cue / notes |
|--------|--------------------------------------------------|-----------|-----------------------|--------------------------|
| Assignment / matching (Hungarian, Kuhn-Munkres, auction) | non-negative n-by-n cost matrix -> min-cost one-to-one assignment | O(n^3) | **reasoning-only** | The #1 hand-rolled family in tracking. No solver in OpenCV/Eigen/STL/NumCpp — Eigen only hosts the cost matrix. Tracking ports vendor their own. |
| Density clustering (DBSCAN) | points + epsilon + minPts -> density-reachable clusters + noise | O(n log n) with index, O(n^2) naive | **vendored** | The marquee hand-rolled-clustering target; recognize a hand-rolled "grow a cluster over a distance predicate" loop. |
| Predicate agglomerative grouping / connected components | items + a merge predicate -> equivalence classes | O(n^2) | **`library` (cv::partition)** | The linked-set substitute for hand-rolled "merge nearby boxes" / single-linkage grouping; distinct from point-vector clustering. |
| k-means | points + k -> k centers minimizing within-cluster sum of squares | O(n k i) | **`library` (cv::kmeans)** | Documented compactness objective a characterization matches against. |
| Non-max suppression (NMS: greedy, rotated, batched/class-aware, Soft-NMS) | boxes + scores + IoU threshold -> kept indices | O(n^2) | **`library` (cv::dnn::NMSBoxes / NMSBoxesBatched / softNMSBoxes)** | A hand-rolled greedy-NMS loop is a pure deletion; Soft-NMS (linear and Gaussian decay) is library-available too. |
| RANSAC / robust model fit | correspondences + model + threshold -> inlier model | O(iterations · sample) | **`library` (USAC family) — conditional, see caveat** | The USAC flags are an accuracy upgrade over legacy RANSAC. **Module caveat below** — the whole surface lives in an optional module a mobile build may not link. |
| Kalman filter / SORT motion model | measurements -> filtered state estimate (predict/correct) | O(state^3) per step | **`library` (cv::KalmanFilter)** | The canonical predict()/correct() two-phase API is the recognizer signature for a hand-rolled predict/update cycle. |
| Hough line fitting | edge points -> lines / segments | O(points · thetas) | **`library` (HoughLines / HoughLinesP)** | For shelf-row / boundary structure. |
| Least-squares line/plane fit, linear solve | points -> fitted model / solution | O(n) to O(n^3) | **`library` (Eigen / NumCpp linalg: norm/dot/det/inv/lstsq/svd)** | Availability substrate for fitting and homography solves; NumCpp also supplies the sort/argsort/argmin/argmax/unique primitives hand-rolled ranking decomposes into. |
| Sequence alignment (Levenshtein / Needleman-Wunsch / LCS) | two sequences -> edit distance / alignment | O(m·n) DP | **reasoning-only** | No linked-set impl; a DP archetype. An existing tested hand-rolled Levenshtein is itself the evidence there is no library call. |
| Budgeted selection / knapsack family | items with value + cost, a budget -> max-value feasible subset | O(G log G) sort + selection scan; underlying problem NP-hard | **reasoning-only** | STL primitives compose the sort/scan; no solver in the linked set. Recognition cue: a budget-capped loop over ratio-ordered candidates with a feasibility veto (Dantzig ratio greedy; budgeted max-coverage / CELF lineage for re-scored marginal-gain variants). Exact DP applies only with decision-independent additive values. |
| Graph (components beyond cv::partition, shortest path, topological sort) | graph -> paths / order / components | family-dependent | **reasoning-only** | Recognize the shape; replacement is a vetted hand-impl. |
| Interval / scheduling greedy | intervals -> selection / cover | O(n log n) | **reasoning-only** | |
| Geometric hashing | features -> match under transform | family-dependent | **reasoning-only** | |
| General dynamic programming | recurrence over subproblems -> optimum | problem-dependent | **reasoning-only** | The catch-all DP shape when no named family fits. |

## Pilot-hardened caveats (verified against an installed build, not library docs)

- **RANSAC / USAC module-scoping caveat.** The entire USAC/RANSAC surface lives in the vision
  library's calibration module (calib3d) and exposes correspondence estimators
  (homography / fundamental / PnP), NOT generic point-set line fitting. Mobile-profile builds often
  do **not** link calib3d at all (a core/imgproc/video/stitching-only link set is common). **Verify
  the consumer's linked module set before treating RANSAC as `library`-available**; when calib3d is
  absent, RANSAC is effectively `reasoning-only` (hand-roll a sequential sampler over a random-number
  primitive plus a line-fit primitive).
- **`cv::fitLine` name-collision trap.** `cv::fitLine` is a deterministic M-estimator (IRLS), **not**
  a RANSAC-family algorithm — a matcher must never treat it as one. Its legitimate role is the
  sample-fit primitive *inside* a hand-rolled RANSAC, not a robust-fit replacement on its own.
- **Every `library` verdict is per-link-set.** If a nominally-`library` entry is not linked on the
  target build (e.g. the dnn module excluded to shrink the binary), downgrade it to `reasoning-only`
  or `vendored` for that build and record it — availability is per-link-set, never universal.

## Reconfirm triggers

Refresh this catalog when: a library major moves the NMS / RANSAC / Kalman / clustering APIs; a
mine-algorithm run discovers a hand-rolled family absent from the catalog (add it as a new entry
with its availability value, keeping the mutual-distinctness and size-cap rules); or the
catalog-bounding-discipline sub-claims (currently directional) are independently reconfirmed.

## Provenance

Frozen from the research-pool entry `canonical-algorithm-catalog` (library-availability claims 3-0
verified against the vision library's docs/source; the catalog-bounding-discipline claims are
directional — single-source, verification cut short by a usage limit). The budgeted-selection /
knapsack entry and the two pilot-hardened caveats above were added by the first two mine-algorithm
pilot runs (both endorsed by the Stage-3 adjudicator against an installed build). Availability is
asserted against a documented library API instantiated for one CV/C++ link set — re-verify every
`library` value against the actual linked module set at run time.
